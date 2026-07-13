package com.ice.template.rag;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.integration.llm.OpenAiChatMessage;
import com.ice.template.integration.llm.OpenAiCompatibleClient;
import com.ice.template.model.entity.ModelConfig;
import com.ice.template.service.ModelConfigService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

@Component
public class GlobalMetadataExtractor {

    private static final Logger log = LoggerFactory.getLogger(GlobalMetadataExtractor.class);

    @Resource
    private OpenAiCompatibleClient openAiCompatibleClient;

    @Resource
    private ModelConfigService modelConfigService;

    @Resource
    private StructuredJsonOutputRepairer structuredJsonOutputRepairer;


    private static final String METADATA_EXTRACTION_PROMPT = """
            请阅读以下文档内容，并提取全局元数据信息。

            文档内容：
            {{DOCUMENT_CONTENT}}

            请按照以下JSON格式输出元数据：
            {
                "domain": "领域范围，如：自媒体/知识付费/AI技术/投资理财/医疗健康",
                "theme": "核心主题，如：2026行业洗牌观察/人工智能发展趋势",
                "entities": [
                    {"name": "实体名称", "description": "实体描述"}
                ],
                "concepts": [
                    {"name": "概念名称", "description": "概念定义"}
                ],
                "events": [
                    {
                        "subject": "主语",
                        "action": "动作",
                        "object": "对象",
                        "result": "结果或影响",
                        "event_time": "事件发生时间，文本未明确则留空",
                        "assertion_time": "信息发布时间，文本未明确则留空",
                        "event_type": "事件类型，如收购/发布/合作/因果/影响/观点",
                        "causal_role": "事理角色，如cause/effect/evidence/background/unknown",
                        "evidence": "支撑该事件的原文短句"
                    }
                ],
                "summary": "文档摘要（不超过100字）"
            }

            注意：
            1. entities 是文档中提到的主要人物、组织、地点等实体，最多 12 个
            2. concepts 是文档中涉及的专业术语、核心概念，最多 12 个
            3. events 是文档中明确出现的主体-动作-对象-结果关系，最多 8 个，优先从案例、因果、措施、影响中抽取
            4. event_time 是事件自身发生时间；assertion_time 是文本发布、记录、引用或断言该信息的时间，两者不能混用
            5. 如果文本没有明确事件发生时间，event_time 必须留空，不要用当前日期或发布时间代替
            6. causal_role 用于事理图谱，可取 cause/effect/evidence/background/unknown
            7. evidence 必须是能支撑该事件的原文短句
            8. 如果文档存在人物/组织采取行动并产生结果，events 不能为空
            9. 输出必须是有效的JSON格式，不要包含其他内容
            """;

    private static final String METADATA_JSON_SCHEMA = """
            {
              "domain": "领域范围",
              "theme": "核心主题",
              "entities": [{"name": "实体名称", "description": "实体描述"}],
              "concepts": [{"name": "概念名称", "description": "概念定义"}],
              "events": [{"subject": "主语", "action": "动作", "object": "对象", "result": "结果或影响", "event_time": "事件发生时间", "assertion_time": "信息发布时间或断言时间", "event_type": "事件类型", "causal_role": "cause/effect/evidence/background/unknown", "evidence": "原文短句"}],
              "summary": "文档摘要"
            }
            """;

    public JSONObject extract(String documentContent, String modelConfigId) {
        if (StringUtils.isBlank(documentContent)) {
            throw new IllegalArgumentException("文档内容不能为空");
        }

        ModelConfig modelConfig = null;
        if (StringUtils.isNotBlank(modelConfigId)) {
            modelConfig = modelConfigService.getById(modelConfigId);
            if (modelConfig == null) {
                log.error("[GlobalMetadataExtractor] 模型配置不存在: modelConfigId=[{}]", modelConfigId);
                throw new RuntimeException("模型配置不存在：modelConfigId=" + modelConfigId + "，请检查数据库或重新选择模型配置");
            } else {
                log.info("[GlobalMetadataExtractor] 使用模型: {} ({}), provider={}, baseUrl={}",
                    modelConfig.getName(), modelConfig.getModelName(),
                    modelConfig.getProvider(), modelConfig.getBaseUrl());
            }
        } else {
            log.error("[GlobalMetadataExtractor] 未指定模型配置，modelConfigId 为空");
            throw new RuntimeException("未指定模型配置，请在节点属性面板选择模型配置");
        }

        String prompt = METADATA_EXTRACTION_PROMPT.replace("{{DOCUMENT_CONTENT}}", documentContent);
        
        List<OpenAiChatMessage> messages = new ArrayList<>();
        messages.add(new OpenAiChatMessage("system", "你是一个专业的元数据提取助手，请严格按照要求的格式输出JSON。"));
        messages.add(new OpenAiChatMessage("user", prompt));

        try {
            String response = openAiCompatibleClient.chat(modelConfig, messages, 0.1, null);
            log.info("[GlobalMetadataExtractor] LLM返回: {}", response);
            return structuredJsonOutputRepairer.parseOrRepairObject("全局元数据提取", METADATA_JSON_SCHEMA, prompt, response, modelConfig);
        } catch (Exception e) {
            log.error("[GlobalMetadataExtractor] 提取元数据失败: {}", e.getMessage(), e);
            // 抛出异常而不是返回默认值，让调用方知道发生了什么
            throw new RuntimeException("元数据提取失败: " + e.getMessage(), e);
        }
    }
    
    private String extractJsonFromResponse(String response) {
        if (response == null) {
            throw new RuntimeException("LLM 响应为空");
        }
        String trimmed = response.trim();
        String candidate = extractJsonCandidate(trimmed);
        return sanitizeJson(candidate);
    }

    private String extractJsonCandidate(String text) {
        int jsonStart = text.indexOf("```json");
        if (jsonStart != -1) {
            int contentStart = text.indexOf("\n", jsonStart) + 1;
            int contentEnd = text.indexOf("```", contentStart);
            if (contentStart > 0 && contentEnd != -1) {
                return text.substring(contentStart, contentEnd).trim();
            }
        }
        int codeStart = text.indexOf("```");
        if (codeStart != -1) {
            int contentStart = text.indexOf("\n", codeStart) + 1;
            int contentEnd = text.indexOf("```", contentStart);
            if (contentStart > 0 && contentEnd != -1) {
                String content = text.substring(contentStart, contentEnd).trim();
                if (content.startsWith("{")) {
                    return content;
                }
            }
        }
        int firstBrace = text.indexOf("{");
        if (firstBrace < 0) {
            throw new RuntimeException("无法从 LLM 响应中提取 JSON: " + StringUtils.abbreviate(text, 500));
        }
        int end = findBalancedJsonEnd(text, firstBrace);
        if (end < 0) {
            throw new RuntimeException("LLM 响应中的 JSON 对象不完整: " + StringUtils.abbreviate(text.substring(firstBrace), 500));
        }
        return text.substring(firstBrace, end + 1);
    }

    private int findBalancedJsonEnd(String text, int start) {
        boolean inString = false;
        boolean escaped = false;
        int depth = 0;
        for (int i = start; i < text.length(); i++) {
            char c = text.charAt(i);
            if (escaped) {
                escaped = false;
                continue;
            }
            if (c == '\\') {
                escaped = inString;
                continue;
            }
            if (c == '"') {
                inString = !inString;
                continue;
            }
            if (inString) {
                continue;
            }
            if (c == '{') {
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0) {
                    return i;
                }
            }
        }
        return -1;
    }

    private String sanitizeJson(String json) {
        String withoutComments = stripJsonComments(json);
        return withoutComments.replaceAll(",\\s*([}\\]])", "$1").trim();
    }

    private String stripJsonComments(String json) {
        StringBuilder sb = new StringBuilder();
        boolean inString = false;
        boolean escaped = false;
        for (int i = 0; i < json.length(); i++) {
            char c = json.charAt(i);
            if (escaped) {
                sb.append(c);
                escaped = false;
                continue;
            }
            if (c == '\\') {
                sb.append(c);
                escaped = inString;
                continue;
            }
            if (c == '"') {
                sb.append(c);
                inString = !inString;
                continue;
            }
            if (!inString && c == '/' && i + 1 < json.length()) {
                char next = json.charAt(i + 1);
                if (next == '/') {
                    i += 2;
                    while (i < json.length() && json.charAt(i) != '\n' && json.charAt(i) != '\r') {
                        i++;
                    }
                    if (i < json.length()) {
                        sb.append(json.charAt(i));
                    }
                    continue;
                }
                if (next == '*') {
                    i += 2;
                    while (i + 1 < json.length() && !(json.charAt(i) == '*' && json.charAt(i + 1) == '/')) {
                        i++;
                    }
                    i++;
                    continue;
                }
            }
            sb.append(c);
        }
        return sb.toString();
    }

    private JSONObject createDefaultMetadata(String content) {
        JSONObject meta = new JSONObject();
        meta.set("domain", "未分类");
        meta.set("theme", "未知主题");
        meta.set("entities", new ArrayList<>());
        meta.set("concepts", new ArrayList<>());
        meta.set("events", new ArrayList<>());
        meta.set("summary", StringUtils.abbreviate(content, 100));
        return meta;
    }

    private JSONArray normalizeEvents(Object events) {
        JSONArray result = new JSONArray();
        if (!(events instanceof JSONArray arr)) {
            return result;
        }
        for (Object item : arr) {
            if (item instanceof JSONObject event) {
                JSONObject normalized = new JSONObject();
                normalized.set("subject", event.getStr("subject", ""));
                normalized.set("action", event.getStr("action", ""));
                normalized.set("object", event.getStr("object", ""));
                normalized.set("result", event.getStr("result", ""));
                normalized.set("event_time", event.getStr("event_time", ""));
                normalized.set("assertion_time", event.getStr("assertion_time", ""));
                normalized.set("event_type", StringUtils.defaultIfBlank(event.getStr("event_type"), "unknown"));
                normalized.set("causal_role", StringUtils.defaultIfBlank(event.getStr("causal_role"), "unknown"));
                normalized.set("evidence", event.getStr("evidence", ""));
                result.add(normalized);
            }
        }
        return result;
    }

    public JSONObject build3DMetadata(JSONObject globalMetadata) {
        JSONObject metadata3d = new JSONObject();
        
        JSONObject domainScope = new JSONObject();
        domainScope.set("domain", globalMetadata.getStr("domain", "未分类"));
        domainScope.set("theme", globalMetadata.getStr("theme", "未知主题"));
        metadata3d.set("1_Domain_Scope", domainScope);

        JSONObject ontologyRouting = new JSONObject();
        Object entities = globalMetadata.get("entities");
        Object concepts = globalMetadata.get("concepts");
        Object events = globalMetadata.get("events");
        ontologyRouting.set("entities", entities instanceof JSONArray ? entities : new JSONArray());
        ontologyRouting.set("concepts", concepts instanceof JSONArray ? concepts : new JSONArray());
        ontologyRouting.set("events", normalizeEvents(events));
        metadata3d.set("2_Ontology_Routing", ontologyRouting);

        JSONObject epistemologyTag = new JSONObject();
        epistemologyTag.set("time_stamp", java.time.LocalDate.now().toString());
        epistemologyTag.set("claim_type", "事实陈述");
        epistemologyTag.set("source", "document");
        epistemologyTag.set("confidence", 0.8);
        metadata3d.set("3_Epistemology_Tag", epistemologyTag);

        return metadata3d;
    }
}
