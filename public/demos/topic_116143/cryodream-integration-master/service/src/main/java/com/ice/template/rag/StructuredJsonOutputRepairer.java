package com.ice.template.rag;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.integration.llm.OpenAiChatMessage;
import com.ice.template.integration.llm.OpenAiCompatibleClient;
import com.ice.template.model.entity.ModelConfig;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

@Component
public class StructuredJsonOutputRepairer {

    private static final Logger log = LoggerFactory.getLogger(StructuredJsonOutputRepairer.class);
    private static final int MAX_REPAIR_ATTEMPTS = 2;
    private static final int REPAIR_MAX_TOKENS = 4000;

    @Resource
    private OpenAiCompatibleClient openAiCompatibleClient;

    public JSONObject parseOrRepairObject(String taskName, String expectedSchema, String originalPrompt, String originalResponse, ModelConfig modelConfig) {
        Exception firstException;
        try {
            return parseObject(originalResponse);
        } catch (Exception e) {
            firstException = e;
            log.warn("[StructuredJsonOutputRepairer] {} 首次 JSON 解析失败: {}", taskName, e.getMessage());
        }

        String lastResponse = originalResponse;
        Exception lastException = firstException;
        for (int attempt = 1; attempt <= MAX_REPAIR_ATTEMPTS; attempt++) {
            try {
                String repairPrompt = buildRepairPrompt(taskName, expectedSchema, originalPrompt, lastResponse, lastException.getMessage());
                List<OpenAiChatMessage> messages = new ArrayList<>();
                messages.add(new OpenAiChatMessage("system", "你是严格的 JSON 修复器。你只能输出一个合法 JSON 对象，不能输出 Markdown、解释、注释或多余文本。"));
                messages.add(new OpenAiChatMessage("user", repairPrompt));
                String repaired = openAiCompatibleClient.chat(modelConfig, messages, 0.0, REPAIR_MAX_TOKENS);
                lastResponse = repaired;
                JSONObject result = parseObject(repaired);
                log.info("[StructuredJsonOutputRepairer] {} 第 {} 次修复成功", taskName, attempt);
                return result;
            } catch (Exception e) {
                lastException = e;
                log.warn("[StructuredJsonOutputRepairer] {} 第 {} 次修复失败: {}", taskName, attempt, e.getMessage());
            }
        }
        throw new RuntimeException(taskName + "结构化 JSON 修复失败: " + lastException.getMessage(), lastException);
    }

    private JSONObject parseObject(String response) {
        String json = extractJsonFromResponse(response);
        return JSONUtil.parseObj(json);
    }

    private String buildRepairPrompt(String taskName, String expectedSchema, String originalPrompt, String originalResponse, String parseError) {
        return """
                任务名称：
                %s

                你的任务：
                根据期望 JSON 结构和原始任务要求，修复模型上一次输出的 JSON。
                必须只输出一个完整、合法、可解析的 JSON 对象。
                不要输出 Markdown，不要输出解释，不要输出注释，不要输出省略号。
                如果原始输出被截断，请根据原始任务要求补齐结构，无法确定的字段使用空字符串、空数组或合理默认值。
                所有字符串必须使用双引号。
                JSON 不能包含尾逗号。

                期望 JSON 结构：
                %s

                上一次解析错误：
                %s

                原始任务要求：
                %s

                上一次模型输出：
                %s
                """.formatted(
                taskName,
                StringUtils.abbreviate(expectedSchema, 6000),
                StringUtils.abbreviate(StringUtils.defaultString(parseError), 1000),
                StringUtils.abbreviate(StringUtils.defaultString(originalPrompt), 12000),
                StringUtils.abbreviate(StringUtils.defaultString(originalResponse), 12000)
        );
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
}
