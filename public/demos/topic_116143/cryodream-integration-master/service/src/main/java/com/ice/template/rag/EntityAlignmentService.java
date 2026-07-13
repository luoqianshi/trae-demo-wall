package com.ice.template.rag;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.integration.llm.OpenAiChatMessage;
import com.ice.template.integration.llm.OpenAiCompatibleClient;
import com.ice.template.mapper.KnowledgeEntityMapper;
import com.ice.template.model.entity.KnowledgeEntity;
import com.ice.template.model.entity.ModelConfig;
import com.ice.template.service.KnowledgeEntityService;
import com.ice.template.service.ModelConfigService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.*;

/**
 * 实体对齐与异步自动建档服务
 *
 * 核心职责：
 * 1. 实体对齐：拿着实体名称去 knowledge_entities 表的 name 和 aliases 字段中检索
 *    - 命中：直接使用标准名称
 *    - 未命中：触发异步自动建档
 * 2. 异步自动建档：调用 LLM 生成实体的 description 和 metadata，写入 knowledge_entities 表
 */
@Slf4j
@Service
public class EntityAlignmentService {

    @Resource
    private KnowledgeEntityService knowledgeEntityService;

    @Resource
    private KnowledgeEntityMapper knowledgeEntityMapper;

    @Resource
    private ModelConfigService modelConfigService;

    @Resource
    private OpenAiCompatibleClient openAiCompatibleClient;

    /**
     * 批量实体对齐：对一组实体名称进行对齐，未命中的触发异步建档
     *
     * @param kbId         知识库 ID
     * @param entityNames  实体名称列表（从事件/案例中抽取）
     * @return 对齐后的实体 ID -> 标准名称映射
     */
    public Map<String, String> alignEntities(String kbId, List<String> entityNames) {
        if (StringUtils.isBlank(kbId) || entityNames == null || entityNames.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<String, String> aligned = new HashMap<>();
        Set<String> toProfile = new LinkedHashSet<>();

        for (String name : entityNames) {
            if (StringUtils.isBlank(name)) continue;
            String trimmed = name.trim();
            // 先查 name 精确匹配
            KnowledgeEntity existing = findByName(kbId, trimmed);
            if (existing != null) {
                aligned.put(existing.getId(), existing.getName());
                continue;
            }
            // 再查 aliases 包含匹配
            existing = findByAlias(kbId, trimmed);
            if (existing != null) {
                aligned.put(existing.getId(), existing.getName());
                continue;
            }
            // 未命中，收集待建档
            toProfile.add(trimmed);
        }

        // 异步建档（不阻塞主流程）
        if (!toProfile.isEmpty()) {
            for (String name : toProfile) {
                try {
                    asyncProfileEntity(kbId, name);
                } catch (Exception e) {
                    log.warn("[EntityAlignment] 异步建档触发失败: {} - {}", name, e.getMessage());
                }
            }
        }

        return aligned;
    }

    /**
     * 按 name 精确查找
     */
    private KnowledgeEntity findByName(String kbId, String name) {
        return knowledgeEntityService.lambdaQuery()
                .eq(KnowledgeEntity::getKbId, kbId)
                .eq(KnowledgeEntity::getName, name)
                .last("LIMIT 1")
                .one();
    }

    /**
     * 按 aliases JSONB 数组包含查找
     * 使用 PostgreSQL JSONB @> 操作符
     */
    private KnowledgeEntity findByAlias(String kbId, String alias) {
        try {
            List<KnowledgeEntity> list = knowledgeEntityService.lambdaQuery()
                    .eq(KnowledgeEntity::getKbId, kbId)
                    .like(KnowledgeEntity::getAliases, alias)
                    .list();
            // 精确匹配 aliases 数组中的元素
            for (KnowledgeEntity e : list) {
                if (containsAlias(e.getAliases(), alias)) {
                    return e;
                }
            }
        } catch (Exception e) {
            log.warn("[EntityAlignment] alias 查询异常: {}", e.getMessage());
        }
        return null;
    }

    /** 检查 aliases JSON 数组是否包含指定别名 */
    private boolean containsAlias(String aliasesJson, String alias) {
        if (StringUtils.isBlank(aliasesJson)) return false;
        try {
            JSONArray arr = JSONUtil.parseArray(aliasesJson);
            for (int i = 0; i < arr.size(); i++) {
                if (alias.equals(arr.getStr(i))) return true;
            }
        } catch (Exception ignored) {
        }
        return false;
    }

    /**
     * 异步自动建档：调用 LLM 生成实体的 description 和 metadata
     * 不阻塞主流程，失败仅 log warn
     */
    @Async
    public void asyncProfileEntity(String kbId, String entityName) {
        try {
            // 先创建一个最小记录（占位），避免并发重复建档
            KnowledgeEntity placeholder = new KnowledgeEntity();
            placeholder.setKbId(kbId);
            placeholder.setName(entityName);
            placeholder.setType("Concept"); // 默认类型，LLM 会更新
            placeholder.setAliases("[]");
            placeholder.setMetadata("{}");
            placeholder.setDescription("");
            knowledgeEntityService.save(placeholder);
            log.info("[EntityAlignment] 创建占位实体: {} -> {}", entityName, placeholder.getId());

            // 调用 LLM 自动建档
            ModelConfig modelConfig = resolveLlmModel();
            if (modelConfig == null) {
                log.warn("[EntityAlignment] 无可用 LLM 模型，跳过自动建档: {}", entityName);
                return;
            }

            String prompt = buildProfilingPrompt(entityName);
            List<OpenAiChatMessage> messages = new ArrayList<>();
            messages.add(new OpenAiChatMessage("system", "你是一个知识图谱专家，只输出合法 JSON。"));
            messages.add(new OpenAiChatMessage("user", prompt));

            String response = openAiCompatibleClient.chat(modelConfig, messages, 0.3, 1024);
            JSONObject profile = parseProfileResponse(response, entityName);

            // 更新占位记录
            placeholder.setType(profile.getStr("type", "Concept"));
            placeholder.setDescription(profile.getStr("description", ""));
            String aliases = profile.getJSONArray("aliases") != null
                    ? profile.getJSONArray("aliases").toString()
                    : "[]";
            placeholder.setAliases(aliases);
            String metadata = profile.getJSONObject("metadata") != null
                    ? profile.getJSONObject("metadata").toString()
                    : "{}";
            placeholder.setMetadata(metadata);
            knowledgeEntityService.updateById(placeholder);
            log.info("[EntityAlignment] 实体建档完成: {} (type={})", entityName, placeholder.getType());
        } catch (Exception e) {
            log.warn("[EntityAlignment] 异步建档失败: {} - {}", entityName, e.getMessage());
        }
    }

    private String buildProfilingPrompt(String entityName) {
        return """
                请为以下实体生成一个标准化的知识档案。

                实体名称：%s

                要求：
                1. 判断实体类型（Person 人物 / Company 公司 / Product 产品 / Concept 概念）
                2. 生成简短背景介绍（100字以内，给决策 Agent 提供上下文）
                3. 列出常见别名（如有）
                4. 根据 type 生成动态属性 metadata

                metadata 示例：
                - Person: {"title":"职位","current_company":"公司","credibility_tier":"T1"}
                - Company: {"industry":"行业","business_model":"商业模式","status":"上市/私有"}
                - Product: {"category":"类别","parent_company":"母公司"}
                - Concept: {"origin":"来源领域","related_frameworks":["相关框架"]}

                严格输出以下 JSON 格式：
                {
                  "name": "%s",
                  "type": "Person|Company|Product|Concept",
                  "description": "简短背景介绍",
                  "aliases": ["别名1", "别名2"],
                  "metadata": {}
                }
                """.formatted(entityName, entityName);
    }

    private JSONObject parseProfileResponse(String response, String entityName) {
        if (StringUtils.isBlank(response)) {
            JSONObject fallback = new JSONObject();
            fallback.set("name", entityName);
            fallback.set("type", "Concept");
            fallback.set("description", "");
            fallback.set("aliases", new JSONArray());
            fallback.set("metadata", new JSONObject());
            return fallback;
        }
        try {
            // 去除可能的 markdown 包裹
            String cleaned = response.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```(json)?\\s*", "").replaceAll("\\s*```$", "");
            }
            return JSONUtil.parseObj(cleaned);
        } catch (Exception e) {
            log.warn("[EntityAlignment] LLM 输出 JSON 解析失败: {}", e.getMessage());
            JSONObject fallback = new JSONObject();
            fallback.set("name", entityName);
            fallback.set("type", "Concept");
            fallback.set("description", response.substring(0, Math.min(response.length(), 200)));
            fallback.set("aliases", new JSONArray());
            fallback.set("metadata", new JSONObject());
            return fallback;
        }
    }

    /**
     * 自动选择一个可用的对话模型
     */
    private ModelConfig resolveLlmModel() {
        List<ModelConfig> enabledLlms = modelConfigService.list().stream()
                .filter(mc -> Integer.valueOf(1).equals(mc.getEnabled())
                        && "llm".equalsIgnoreCase(mc.getModelType())
                        && StringUtils.isNotBlank(mc.getBaseUrl()))
                .toList();
        return enabledLlms.stream()
                .filter(mc -> StringUtils.isNotBlank(mc.getApiKey()))
                .findFirst()
                .orElse(enabledLlms.stream().findFirst().orElse(null));
    }
}
