package com.ice.template.rag;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ice.template.config.JsonbTypeHandler;
import com.ice.template.integration.llm.OpenAiChatMessage;
import com.ice.template.integration.llm.OpenAiCompatibleClient;
import com.ice.template.mapper.ThinkingModelMapper;
import com.ice.template.model.entity.ModelConfig;
import com.ice.template.model.entity.ThinkingModel;
import com.ice.template.service.ModelConfigService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class ThinkingModelService {

    @Resource
    private ThinkingModelMapper thinkingModelMapper;

    @Resource
    private ModelConfigService modelConfigService;

    @Resource
    private OpenAiCompatibleClient openAiCompatibleClient;

    @Resource
    private StructuredJsonOutputRepairer structuredJsonOutputRepairer;

    private static final String EXTRACTION_PROMPT = """
            # Role
            你是一个顶级的 AI 架构师与业务咨询专家。你的任务是将用户输入的"非结构化思维模型文章"，转化为大模型可调用的"标准化 Function Calling 工具"。

            # Workflow
            请阅读用户输入的文本，提取核心逻辑，并严格输出为以下 JSON 格式。

            # JSON Schema 要求
            {
              "model_id": "根据模型英文名生成，如 tool_swot_001",
              "model_name": "模型中文名",
              "is_active": true,
              "routing_category": "必须从以下四个中选一个：[战略与商业, 诊断与分析, 流程与执行, 表达与沟通]",
              "tags": ["提取3-5个触发该模型的业务场景关键词"],
              "tool_schema": {
                "name": "纯英文，下划线命名法",
                "description": "用大白话描述：当用户遇到什么具体困难、需要做什么事时，调用此模型。必须精准，这是路由的核心依据。",
                "parameters": {
                  "type": "object",
                  "properties": {
                    "变量名1": {"type": "string", "description": "变量含义说明"}
                  },
                  "required": ["必须由用户提供的核心变量名"]
                }
              },
              "execution_prompt": "你现在是该领域的顶级专家。请基于用户提供的参数，严格按照以下步骤执行：\\n1. [步骤1名称]: [步骤1具体做法]\\n2. [步骤2名称]: [步骤2具体做法]..."
            }

            # Constraint
            - 不要输出任何解释性废话，只输出合法的 JSON。
            - execution_prompt 必须具有极强的指令性和实操性，确保大模型拿到后能直接干活。
            - tool_schema.name 必须是纯英文、下划线命名法。
            - tags 提取3-5个业务场景关键词。
            - routing_category 只能是：战略与商业、诊断与分析、流程与执行、表达与沟通。
            """;

    private static final String EXTRACTION_JSON_SCHEMA = """
            {
              "model_id": "tool_xxx_001",
              "model_name": "模型中文名",
              "is_active": true,
              "routing_category": "诊断与分析",
              "tags": ["关键词1", "关键词2"],
              "tool_schema": {
                "name": "tool_name",
                "description": "描述",
                "parameters": {
                  "type": "object",
                  "properties": {"param1": {"type": "string", "description": "说明"}},
                  "required": ["param1"]
                }
              },
              "execution_prompt": "执行提示词"
            }
            """;

    /** 思维模型判断 prompt：判断文档是否包含可提取的思维模型 */
    private static final String JUDGMENT_PROMPT = """
            你是一个文档分类专家。请判断以下文档是否描述了一个可被结构化的「思维模型」（也称为思考框架、方法论、分析模型）。
            
            思维模型的特征：
            - 包含明确的步骤、流程或框架
            - 有可定义的输入变量和输出结果
            - 可以被抽象为工具/函数供 AI 调用
            - 例如：SWOT分析、第一性原理、5W2H、MECE法则、金字塔原理等
            
            不是思维模型的文档：
            - 纯教程/操作指南（没有可抽象的方法论）
            - 新闻/故事/散文
            - 单纯的知识科普（没有可执行的步骤）
            
            请严格输出以下 JSON，不要输出其他内容：
            {"is_thinking_model": true/false, "confidence": 0.0-1.0, "reason": "一句话说明判断依据"}
            """;

    /** 临时存储提取结果，等待用户确认。key=extractId, value=ThinkingModel */
    private final ConcurrentHashMap<String, ThinkingModel> pendingExtractions = new ConcurrentHashMap<>();

    /**
     * 从原始文本提取思维模型并保存到数据库
     */
    public ThinkingModel extractAndSave(String rawText, String modelConfigId, String kbId) {
        if (StringUtils.isBlank(rawText)) {
            throw new IllegalArgumentException("输入文本不能为空");
        }

        ModelConfig modelConfig = resolveModelConfig(modelConfigId);
        if (modelConfig == null) {
            throw new RuntimeException("思维模型提取必须指定有效的 LLM 模型配置，请在模型设置中配置一个带 API Key 的 LLM 模型");
        }

        log.info("[ThinkingModelService] 使用模型: {} ({}), 输入文本长度: {}, kbId: {}", modelConfig.getName(), modelConfig.getModelName(), rawText.length(), kbId);

        List<OpenAiChatMessage> messages = new ArrayList<>();
        messages.add(new OpenAiChatMessage("system", EXTRACTION_PROMPT));
        messages.add(new OpenAiChatMessage("user", rawText));

        String response = openAiCompatibleClient.chat(modelConfig, messages, 0.1, null);
        log.info("[ThinkingModelService] LLM 返回结果，长度: {}", response.length());

        JSONObject result = structuredJsonOutputRepairer.parseOrRepairObject("思维模型提取", EXTRACTION_JSON_SCHEMA, EXTRACTION_PROMPT, response, modelConfig);

        ThinkingModel model = new ThinkingModel();
        model.setId(UUID.randomUUID().toString());
        model.setKbId(kbId);
        model.setModelId(result.getStr("model_id", "tool_unknown_001"));
        model.setModelName(result.getStr("model_name", "未命名模型"));
        model.setIsActive(result.getBool("is_active", true));
        model.setRoutingCategory(result.getStr("routing_category", "诊断与分析"));
        model.setTags(result.getJSONArray("tags") != null ? result.getJSONArray("tags").toString() : "[]");
        model.setToolSchema(result.getJSONObject("tool_schema") != null ? result.getJSONObject("tool_schema").toString() : "{}");
        model.setExecutionPrompt(result.getStr("execution_prompt", ""));
        model.setRawText(rawText);
        model.setDescription(result.getStr("model_name", ""));
        model.setCreateTime(new Date());
        model.setUpdateTime(new Date());

        ThinkingModel saved = saveOrOverwrite(model);
        log.info("[ThinkingModelService] 思维模型入库成功: modelId={}, name={}, category={}, kbId={}",
                saved.getModelId(), saved.getModelName(), saved.getRoutingCategory(), kbId);
        return saved;
    }

    private ModelConfig resolveModelConfig(String modelConfigId) {
        if (StringUtils.isNotBlank(modelConfigId)) {
            ModelConfig config = modelConfigService.getById(modelConfigId);
            if (config != null) return config;
        }
        return modelConfigService.list().stream()
                .filter(mc -> Integer.valueOf(1).equals(mc.getEnabled())
                        && isChatCompletionModel(mc)
                        && StringUtils.isNotBlank(mc.getBaseUrl()))
                .sorted((a, b) -> Boolean.compare(StringUtils.isBlank(a.getApiKey()), StringUtils.isBlank(b.getApiKey())))
                .findFirst()
                .orElse(null);
    }

    private boolean isChatCompletionModel(ModelConfig mc) {
        if (mc == null || StringUtils.isBlank(mc.getModelType())) return false;
        return "llm".equalsIgnoreCase(mc.getModelType()) || "chat".equalsIgnoreCase(mc.getModelType());
    }

    public ThinkingModel getById(String id) {
        return thinkingModelMapper.selectById(id);
    }

    /**
     * 保存思维模型实体（由工作流节点调用）
     * 按模型名称模糊匹配去重：同名工具视为同一个，避免 LLM 生成不同 ID 导致的重复入库
     */
    public ThinkingModel saveOrOverwrite(ThinkingModel model) {
        ThinkingModel existing = findByNameFuzzy(model.getModelName());
        if (existing != null) {
            log.info("[ThinkingModelService] 同名思维模型已存在（模糊匹配），覆盖更新: newName={}, existingName={}, oldId={}",
                    model.getModelName(), existing.getModelName(), existing.getId());
            model.setId(existing.getId());
            // 保留原始创建时间
            model.setCreateTime(existing.getCreateTime());
            model.setUpdateTime(new Date());
            // 如果新记录没有 kb_id 但旧记录有，保留旧的关联
            if (StringUtils.isBlank(model.getKbId()) && StringUtils.isNotBlank(existing.getKbId())) {
                model.setKbId(existing.getKbId());
            }
            thinkingModelMapper.updateById(model);
            return model;
        }
        thinkingModelMapper.insert(model);
        return model;
    }

    /**
     * 仅提取思维模型，不落库。用于前端预览确认流程。
     * 返回：extractId（确认保存用）、isThinkingModel（判断结果）、preview（提取的模型数据）
     */
    public Map<String, Object> extractOnly(String documentId, String rawText, String modelConfigId) {
        if (StringUtils.isBlank(rawText) && StringUtils.isBlank(documentId)) {
            throw new IllegalArgumentException("documentId 和 rawText 不能同时为空");
        }

        ModelConfig modelConfig = resolveModelConfig(modelConfigId);
        if (modelConfig == null) {
            throw new RuntimeException("思维模型提取必须指定有效的 LLM 模型配置，请在模型设置中配置一个带 API Key 的 LLM 模型");
        }

        // 如果只传了 documentId，从 rawText 参数取或跳过
        // （由 Controller 层保证 rawText 已填充）

        // 第一步：判断是否包含思维模型
        boolean isThinkingModel = isThinkingModel(rawText, modelConfig);
        if (!isThinkingModel) {
            log.info("[ThinkingModelService] 文档不包含思维模型，跳过提取");
            Map<String, Object> result = new HashMap<>();
            result.put("isThinkingModel", false);
            result.put("reason", "文档内容不包含可结构化的思维模型");
            return result;
        }

        // 第二步：提取思维模型
        log.info("[ThinkingModelService] 文档包含思维模型，开始提取: textLength={}", rawText.length());

        List<OpenAiChatMessage> messages = new ArrayList<>();
        messages.add(new OpenAiChatMessage("system", EXTRACTION_PROMPT));
        messages.add(new OpenAiChatMessage("user", rawText));

        String response = openAiCompatibleClient.chat(modelConfig, messages, 0.1, null);
        log.info("[ThinkingModelService] LLM 提取结果，长度: {}", response.length());

        JSONObject extractResult = structuredJsonOutputRepairer.parseOrRepairObject("思维模型提取", EXTRACTION_JSON_SCHEMA, EXTRACTION_PROMPT, response, modelConfig);

        // 构建 ThinkingModel 对象（不保存）
        ThinkingModel model = new ThinkingModel();
        model.setId(UUID.randomUUID().toString());
        model.setModelId(extractResult.getStr("model_id", "tool_unknown_001"));
        model.setModelName(extractResult.getStr("model_name", "未命名模型"));
        model.setIsActive(extractResult.getBool("is_active", true));
        model.setRoutingCategory(extractResult.getStr("routing_category", "诊断与分析"));
        model.setTags(extractResult.getJSONArray("tags") != null ? extractResult.getJSONArray("tags").toString() : "[]");
        model.setToolSchema(extractResult.getJSONObject("tool_schema") != null ? extractResult.getJSONObject("tool_schema").toString() : "{}");
        model.setExecutionPrompt(extractResult.getStr("execution_prompt", ""));
        model.setRawText(rawText);
        model.setDescription(extractResult.getStr("model_name", ""));

        // 存入临时缓存，等待用户确认
        String extractId = "ext-" + UUID.randomUUID().toString().substring(0, 8);
        pendingExtractions.put(extractId, model);

        // 10 分钟后自动清理
        new Thread(() -> {
            try { Thread.sleep(10 * 60 * 1000); } catch (InterruptedException ignored) {}
            pendingExtractions.remove(extractId);
        }).start();

        Map<String, Object> result = new HashMap<>();
        result.put("isThinkingModel", true);
        result.put("extractId", extractId);
        result.put("preview", buildPreviewMap(model));
        return result;
    }

    /**
     * 确认保存思维模型。前端预览确认后调用。
     */
    public ThinkingModel confirmSave(String extractId) {
        ThinkingModel model = pendingExtractions.remove(extractId);
        if (model == null) {
            throw new IllegalArgumentException("提取结果已过期或不存在，请重新提取");
        }
        model.setCreateTime(new Date());
        model.setUpdateTime(new Date());
        ThinkingModel saved = saveOrOverwrite(model);
        log.info("[ThinkingModelService] 确认保存思维模型: modelId={}, name={}", saved.getModelId(), saved.getModelName());
        return saved;
    }

    /**
     * 判断文档是否包含可提取的思维模型
     */
    private boolean isThinkingModel(String text, ModelConfig modelConfig) {
        if (StringUtils.isBlank(text)) return false;

        // 截取前 2000 字做判断，避免超长文本
        String snippet = text.length() > 2000 ? text.substring(0, 2000) : text;

        List<OpenAiChatMessage> messages = new ArrayList<>();
        messages.add(new OpenAiChatMessage("system", JUDGMENT_PROMPT));
        messages.add(new OpenAiChatMessage("user", snippet));

        try {
            String response = openAiCompatibleClient.chat(modelConfig, messages, 0.0, null);
            JSONObject judgment = JSONUtil.parseObj(response.trim());
            boolean result = judgment.getBool("is_thinking_model", false);
            double confidence = judgment.getDouble("confidence", 0.0);
            String reason = judgment.getStr("reason", "");
            log.info("[ThinkingModelService] 思维模型判断: isThinkingModel={}, confidence={}, reason={}", result, confidence, reason);
            return result && confidence >= 0.5;
        } catch (Exception e) {
            log.warn("[ThinkingModelService] 思维模型判断失败，默认放行: {}", e.getMessage());
            // 判断失败时默认放行，让后续提取步骤自行决定
            return true;
        }
    }

    /**
     * 构建 preview 数据，用于前端展示
     */
    private Map<String, Object> buildPreviewMap(ThinkingModel model) {
        Map<String, Object> preview = new HashMap<>();
        preview.put("modelId", model.getModelId());
        preview.put("modelName", model.getModelName());
        preview.put("routingCategory", model.getRoutingCategory());
        preview.put("isActive", model.getIsActive());
        preview.put("tags", model.getTags());
        preview.put("toolSchema", model.getToolSchema());
        preview.put("executionPrompt", model.getExecutionPrompt());
        preview.put("description", model.getDescription());
        return preview;
    }

    /**
     * 按模型名称模糊查找（去重用）。
     * LLM 可能对同一工具概念生成不同的 model_id（如 tool_swot_001 / tool_swot_analysis_002），
     * 但 model_name 通常一致或高度相似。使用 ILIKE 进行大小写不敏感的模糊匹配。
     *
     * @param modelName 模型中文名（如"SWOT分析模型"、"第一性原理"）
     * @return 匹配到的已存在记录，未找到返回 null
     */
    public ThinkingModel findByNameFuzzy(String modelName) {
        if (StringUtils.isBlank(modelName)) return null;
        return thinkingModelMapper.selectOne(new LambdaQueryWrapper<ThinkingModel>()
                .like(ThinkingModel::getModelName, modelName.trim())
                .last("LIMIT 1"));
    }

    public List<ThinkingModel> list() {
        return thinkingModelMapper.selectList(new LambdaQueryWrapper<ThinkingModel>()
                .orderByDesc(ThinkingModel::getCreateTime));
    }

    public List<ThinkingModel> listActive() {
        return thinkingModelMapper.selectList(new LambdaQueryWrapper<ThinkingModel>()
                .eq(ThinkingModel::getIsActive, true)
                .orderByDesc(ThinkingModel::getCreateTime));
    }

    /**
     * 按知识库 ID 查询思维模型列表
     */
    public List<ThinkingModel> listByKbId(String kbId) {
        return thinkingModelMapper.selectList(new LambdaQueryWrapper<ThinkingModel>()
                .eq(ThinkingModel::getKbId, kbId)
                .orderByDesc(ThinkingModel::getCreateTime));
    }

    public void updateIsActive(String id, boolean active) {
        ThinkingModel model = thinkingModelMapper.selectById(id);
        if (model != null) {
            model.setIsActive(active);
            model.setUpdateTime(new Date());
            thinkingModelMapper.updateById(model);
        }
    }

    public void deleteById(String id) {
        thinkingModelMapper.deleteById(id);
    }
}
