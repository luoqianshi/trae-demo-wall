package com.ice.template.rag;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.integration.llm.OpenAiChatMessage;
import com.ice.template.integration.llm.OpenAiCompatibleClient;
import com.ice.template.model.entity.ModelConfig;
import com.ice.template.service.ModelConfigService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class ContentTypeClassifier {

    @Resource
    private OpenAiCompatibleClient openAiCompatibleClient;

    @Resource
    private ModelConfigService modelConfigService;

    private static final String CLASSIFICATION_PROMPT = """
            # Role
            你是一个专业的信息类型分类专家。你的任务是分析用户提供的文档内容，判断其主要信息类型。

            # 信息类型定义
            - **事件密集型**：文档主要内容是事件描述、时间线、因果链、人物行动、组织变动等。典型场景：新闻、事件报道、历史分析、行业动态。
            - **观点密集型**：文档主要内容是观点、评论、态度、立场、预测、判断等。典型场景：评论文章、分析报告、专栏、辩论记录。
            - **案例型**：文档主要内容是完整案例描述，包含背景、做法、过程、结果、经验/教训。典型场景：商业案例、项目复盘、成功/失败案例。
            - **方法论型**：文档主要内容是思维模型、分析框架、工具方法、决策流程等可复用的结构化方法论。典型场景：管理模型、分析工具、决策框架、操作手册。
            - **描述型**：文档主要内容是客观描述性知识，如产品说明、技术文档、术语解释、数据统计等。典型场景：说明书、技术文档、百科、FAQ。

            # Workflow
            1. 阅读文档内容，识别核心信息类型
            2. 判断是否包含次要类型（一个文档可能同时包含多种类型）
            3. 评估分类置信度

            # JSON Schema 要求
            严格输出以下 JSON 格式：
            {
              "primary_type": "从以下五类中选一个：事件密集型/观点密集型/案例型/方法论型/描述型",
              "secondary_types": ["其他包含的类型，可为空数组"],
              "confidence": 0.85,
              "reasoning": "简要说明分类依据（一句话）"
            }

            # Constraint
            - 只输出合法 JSON，不要输出任何解释性文字。
            - primary_type 必须是上述五种之一。
            - confidence 范围 0-1。
            - 如果文档同时包含多种类型，选择信息量最大的作为 primary_type。
            """;

    /**
     * 分类文档内容的信息类型
     * @param rawText 文档原文
     * @param modelConfigId 模型配置ID（可选，为空时自动选择）
     * @return 分类结果 JSON
     */
    public JSONObject classify(String rawText, String modelConfigId) {
        if (StringUtils.isBlank(rawText)) {
            throw new IllegalArgumentException("文档内容不能为空");
        }

        // 截取前 4000 字符用于分类（避免 token 过长）
        String snippet = rawText.length() > 4000 ? rawText.substring(0, 4000) : rawText;

        ModelConfig modelConfig = resolveModelConfig(modelConfigId);

        List<OpenAiChatMessage> messages = new ArrayList<>();
        messages.add(new OpenAiChatMessage("system", CLASSIFICATION_PROMPT));
        messages.add(new OpenAiChatMessage("user", "请分类以下文档内容：\n\n" + snippet));

        String response = openAiCompatibleClient.chat(modelConfig, messages, 0.1, null);
        log.info("[ContentTypeClassifier] LLM 原始响应: {}", response.length() > 500 ? response.substring(0, 500) + "..." : response);

        // Extract JSON from LLM response (handle markdown code blocks)
        String jsonStr = response.trim();
        if (jsonStr.contains("```json")) {
            int start = jsonStr.indexOf("```json") + 7;
            int end = jsonStr.indexOf("```", start);
            if (end > start) jsonStr = jsonStr.substring(start, end).trim();
        } else if (jsonStr.contains("```")) {
            int start = jsonStr.indexOf("```") + 3;
            int end = jsonStr.indexOf("```", start);
            if (end > start) jsonStr = jsonStr.substring(start, end).trim();
        }
        // Find first { to last }
        int firstBrace = jsonStr.indexOf("{");
        int lastBrace = jsonStr.lastIndexOf("}");
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        JSONObject result;
        try {
            result = JSONUtil.parseObj(jsonStr);
        } catch (Exception e) {
            log.warn("[ContentTypeClassifier] JSON解析失败，尝试容错处理: {}", e.getMessage());
            String cleaned = jsonStr.replaceAll("[\\x00-\\x1F]", " ")
                    .replaceAll(",\\s*}", "}")
                    .replaceAll(",\\s*]", "]");
            try {
                result = JSONUtil.parseObj(cleaned);
            } catch (Exception e2) {
                log.error("[ContentTypeClassifier] JSON容错解析也失败，返回空结果: {}", e2.getMessage());
                result = new JSONObject();
                result.set("primary_type", "描述型");
                result.set("secondary_types", new JSONArray());
            }
        }

        // 验证必要字段
        if (!result.containsKey("primary_type")) {
            log.warn("[ContentTypeClassifier] 分类结果缺少 primary_type，默认为描述型");
            result.set("primary_type", "描述型");
            result.set("confidence", 0.3);
        }

        log.info("[ContentTypeClassifier] 分类结果: primary_type={}, confidence={}",
                result.getStr("primary_type"), result.getDouble("confidence"));
        return result;
    }

    private ModelConfig resolveModelConfig(String modelConfigId) {
        if (StringUtils.isNotBlank(modelConfigId)) {
            ModelConfig config = modelConfigService.getById(modelConfigId);
            if (config != null) {
                return config;
            }
        }
        // 自动选择第一个可用的 chat 模型
        List<ModelConfig> configs = modelConfigService.list();
        return configs.stream()
                .filter(c -> Boolean.TRUE.equals(c.getEnabled()) && "chat".equals(c.getModelType()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("没有可用的对话模型配置"));
    }
}
