package com.ice.template.executor.node;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * LLM 输出格式检验器。
 * 接收 LLM 原始输出，根据期望格式（json_candidates / json_object / json_array / plain_list）
 * 提取、修正并校验输出，确保结果符合指定格式。
 */
@Component
public class FormatValidatorNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(FormatValidatorNodeExecutor.class);

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    // prompt 指令行特征，用于过滤 AI 原样回传的 prompt 文本
    private static final Pattern[] PROMPT_INSTRUCTION_PATTERNS = {
            Pattern.compile("^你是一位"),
            Pattern.compile("^需要替换的原文[：:]"),
            Pattern.compile("^选中的原文[：:]"),
            Pattern.compile("^上下文[：:（(]"),
            Pattern.compile("^上文[：:]"),
            Pattern.compile("^下文[：:]"),
            Pattern.compile("^完整歌词[（(]"),
            Pattern.compile("^修改要求[：:]"),
            Pattern.compile("^请严格按"),
            Pattern.compile("^任务类型[：:]"),
            Pattern.compile("^规则[（(]"),
            Pattern.compile("^示例[：:]"),
            Pattern.compile("^输出示例"),
            Pattern.compile("^每个候选"),
            Pattern.compile("^候选文字"),
            Pattern.compile("^绝对不要"),
            Pattern.compile("^参考上下文"),
            Pattern.compile("^候选\\d$"),
            Pattern.compile("^替换文字[ABC]$"),
            // English labels (used in inputValue)
            Pattern.compile("^Selected fragment to replace[：:]"),
            Pattern.compile("^Requirement[：:]"),
            Pattern.compile("^Full lyrics[：:]"),
            Pattern.compile("^Output format"),
            Pattern.compile("^Strictly follow"),
    };

    private static final Pattern SECTION_MARKER = Pattern.compile("^\\s*\\[[^\\]]+\\]\\s*$");

    @Override
    public boolean supports(String nodeType) {
        return "FormatValidator".equals(nodeType) || "LyricRewriteValidator".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String input = StringUtils.defaultIfBlank(context.getCurrentText(), "");
        String expectedFormat = StringUtils.defaultIfBlank(
                FlowNodeDataUtils.getTemplateString(node, "expected_format"), "json_candidates");
        int maxItemLength = FlowNodeDataUtils.getTemplateInteger(node, "max_item_length", 0);
        String contextText = StringUtils.defaultString(
                FlowNodeDataUtils.getTemplateString(node, "context_text"),
                FlowNodeDataUtils.getTemplateString(node, "selected_text"));

        log.info("[FormatValidator] input length={}, format={}, maxLen={}, contextText='{}'",
                input.length(), expectedFormat, maxItemLength, contextText);

        String resultJson;

        switch (expectedFormat) {
            case "json_candidates":
                resultJson = validateAsCandidates(input, maxItemLength, contextText);
                break;
            case "json_object":
                resultJson = validateAsJsonObject(input);
                break;
            case "json_array":
                resultJson = validateAsJsonArray(input);
                break;
            case "plain_list":
                resultJson = validateAsPlainList(input, maxItemLength, contextText);
                break;
            default:
                resultJson = validateAsCandidates(input, maxItemLength, contextText);
        }

        context.setCurrentText(resultJson);
        FlowNodeExecuteResult executeResult = FlowNodeExecuteResult.of(resultJson);
        executeResult.getInput().put("input", truncate(input, 500));
        executeResult.getInput().put("expected_format", expectedFormat);
        executeResult.getOutput().put("result", resultJson);
        return executeResult;
    }

    // ── json_candidates 格式 ────────────────────────────────────────
    // 输出: {"candidates":[{"title":"候选 1","content":"..."}],"count":3}

    private String validateAsCandidates(String input, int maxItemLength, String contextText) {
        int maxLen = maxItemLength > 0 ? maxItemLength : Math.max(contextText.length() * 3, 20);
        List<Map<String, String>> candidates = new ArrayList<>();

        // 0. 优先 JSON 格式
        List<Map<String, String>> jsonResult = tryParseJsonCandidates(input, maxLen, contextText);
        if (!jsonResult.isEmpty()) {
            candidates = jsonResult;
        } else {
            // 1. 候选N 标题格式
            candidates = parseByHeaderFormat(input, maxLen, contextText);
            // 2. ### 标题格式
            if (candidates.isEmpty()) {
                candidates = parseByMarkdownFormat(input, maxLen, contextText);
            }
            // 3. 空行分段
            if (candidates.isEmpty()) {
                candidates = parseByBlankLines(input, maxLen, contextText);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("candidates", candidates);
        result.put("count", candidates.size());
        return toJson(result);
    }

    // ── json_object 格式 ────────────────────────────────────────────
    // 强制提取 LLM 输出中的 JSON 对象，修复常见问题

    private String validateAsJsonObject(String input) {
        String jsonStr = extractJsonString(input, '{');
        if (jsonStr != null) {
            try {
                Object parsed = OBJECT_MAPPER.readValue(jsonStr, Object.class);
                return OBJECT_MAPPER.writeValueAsString(parsed);
            } catch (Exception e) {
                log.debug("[FormatValidator] JSON object 解析失败，尝试修复: {}", e.getMessage());
            }
        }
        // 尝试修复：去除 markdown 代码块包裹
        String cleaned = input.trim()
                .replaceAll("^```(?:json)?\\s*", "")
                .replaceAll("\\s*```$", "")
                .trim();
        if (cleaned.startsWith("{")) {
            try {
                Object parsed = OBJECT_MAPPER.readValue(cleaned, Object.class);
                return OBJECT_MAPPER.writeValueAsString(parsed);
            } catch (Exception ignored) {}
        }
        // 兜底：包装为对象
        Map<String, Object> fallback = new LinkedHashMap<>();
        fallback.put("raw", input.trim());
        return toJson(fallback);
    }

    // ── json_array 格式 ─────────────────────────────────────────────
    // 强制提取 LLM 输出中的 JSON 数组

    private String validateAsJsonArray(String input) {
        String jsonStr = extractJsonString(input, '[');
        if (jsonStr != null) {
            try {
                Object parsed = OBJECT_MAPPER.readValue(jsonStr, Object.class);
                return OBJECT_MAPPER.writeValueAsString(parsed);
            } catch (Exception e) {
                log.debug("[FormatValidator] JSON array 解析失败，尝试修复: {}", e.getMessage());
            }
        }
        // 尝试修复
        String cleaned = input.trim()
                .replaceAll("^```(?:json)?\\s*", "")
                .replaceAll("\\s*```$", "")
                .trim();
        if (cleaned.startsWith("[")) {
            try {
                Object parsed = OBJECT_MAPPER.readValue(cleaned, Object.class);
                return OBJECT_MAPPER.writeValueAsString(parsed);
            } catch (Exception ignored) {}
        }
        // 兜底：按行拆为数组
        List<String> items = new ArrayList<>();
        for (String line : input.split("\\n")) {
            String trimmed = line.trim();
            if (!trimmed.isEmpty() && !isPromptInstruction(trimmed)) {
                items.add(trimmed);
            }
        }
        return toJson(items);
    }

    // ── plain_list 格式 ─────────────────────────────────────────────
    // 按行/空行拆分，过滤无效行

    private String validateAsPlainList(String input, int maxItemLength, String contextText) {
        int maxLen = maxItemLength > 0 ? maxItemLength : Integer.MAX_VALUE;
        List<String> items = new ArrayList<>();
        for (String line : input.split("\\n")) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;
            if (isPromptInstruction(trimmed)) continue;
            if (SECTION_MARKER.matcher(trimmed).matches()) continue;
            if (trimmed.length() > maxLen) continue;
            if (StringUtils.isNotBlank(contextText) && isEchoOfContext(trimmed, contextText)) continue;
            items.add(trimmed);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("count", items.size());
        return toJson(result);
    }

    // ── JSON 候选解析 ───────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<Map<String, String>> tryParseJsonCandidates(String input, int maxLen, String contextText) {
        List<Map<String, String>> candidates = new ArrayList<>();
        String jsonStr = extractJsonString(input, '\0');
        if (jsonStr == null) return candidates;

        try {
            Object parsed = OBJECT_MAPPER.readValue(jsonStr, Object.class);

            List<?> items = null;
            if (parsed instanceof Map) {
                Map<String, Object> map = (Map<String, Object>) parsed;
                Object cands = map.get("candidates");
                if (cands instanceof List) items = (List<?>) cands;
            } else if (parsed instanceof List) {
                items = (List<?>) parsed;
            }

            if (items != null) {
                int idx = 1;
                for (Object item : items) {
                    if (item instanceof String) {
                        String content = ((String) item).trim();
                        if (isValidItem(content, maxLen, contextText)) {
                            candidates.add(candidateEntry(String.format("候选 %d", idx), content));
                            idx++;
                        }
                    } else if (item instanceof Map) {
                        // 支持 {"title":"...", "content":"..."} 格式
                        Map<String, Object> map = (Map<String, Object>) item;
                        String content = String.valueOf(map.getOrDefault("content", "")).trim();
                        if (isValidItem(content, maxLen, contextText)) {
                            String title = String.valueOf(map.getOrDefault("title", String.format("候选 %d", idx)));
                            candidates.add(candidateEntry(title, content));
                            idx++;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.debug("[FormatValidator] JSON candidates 解析失败: {}", e.getMessage());
        }
        return candidates;
    }

    // ── 文本格式解析 ────────────────────────────────────────────────

    private List<Map<String, String>> parseByHeaderFormat(String input, int maxLen, String contextText) {
        List<Map<String, String>> candidates = new ArrayList<>();
        var matches = Pattern.compile("候选\\s*(\\d+)\\s*\\n([\\s\\S]*?)(?=\\n候选\\s*\\d+|$)")
                .matcher(input);
        while (matches.find()) {
            String content = matches.group(2).trim();
            if (isValidItem(content, maxLen, contextText)) {
                candidates.add(candidateEntry(String.format("候选 %s", matches.group(1)), content));
            }
        }
        return candidates;
    }

    private List<Map<String, String>> parseByMarkdownFormat(String input, int maxLen, String contextText) {
        List<Map<String, String>> candidates = new ArrayList<>();
        var matches = Pattern.compile("###\\s*(.+?)\\s*\\n([\\s\\S]*?)(?=\\n###\\s+|\\n##\\s+|$)")
                .matcher(input);
        while (matches.find()) {
            String title = matches.group(1).trim();
            String content = matches.group(2).trim();
            if (isValidItem(content, maxLen, contextText) && !isPromptInstruction(title)) {
                candidates.add(candidateEntry(title, content));
            }
        }
        return candidates;
    }

    private List<Map<String, String>> parseByBlankLines(String input, int maxLen, String contextText) {
        List<Map<String, String>> candidates = new ArrayList<>();
        String[] segments = input.split("\\n{2,}");
        int idx = 1;
        for (String seg : segments) {
            String[] lines = seg.split("\\n");
            StringBuilder sb = new StringBuilder();
            for (String line : lines) {
                if (!isPromptInstruction(line)) {
                    if (sb.length() > 0) sb.append("\n");
                    sb.append(line);
                }
            }
            String content = sb.toString().trim();
            if (isValidItem(content, maxLen, contextText)) {
                candidates.add(candidateEntry(String.format("候选 %d", idx), content));
                idx++;
            }
        }
        return candidates;
    }

    // ── 校验 ────────────────────────────────────────────────────────

    private boolean isValidItem(String content, int maxLen, String contextText) {
        if (StringUtils.isBlank(content)) return false;
        if (SECTION_MARKER.matcher(content).find()) return false;
        if (content.length() > maxLen) return false;
        // 多行选区对应多行候选，不再过滤换行符
        if (isPromptInstruction(content)) return false;
        if (StringUtils.isNotBlank(contextText) && isEchoOfContext(content, contextText)) return false;
        return true;
    }

    private boolean isEchoOfContext(String content, String contextText) {
        String trimmed = content.trim();
        String quoted = "\"" + contextText + "\"";
        String quotedCn = "\u201C" + contextText + "\u201D";
        return trimmed.equals(quoted) || trimmed.equals(quotedCn) || trimmed.equals(contextText);
    }

    private boolean isPromptInstruction(String text) {
        String t = text.trim();
        for (Pattern pattern : PROMPT_INSTRUCTION_PATTERNS) {
            if (pattern.matcher(t).find()) return true;
        }
        return false;
    }

    // ── JSON 提取 ───────────────────────────────────────────────────

    /**
     * 从 LLM 输出中提取 JSON 字符串。
     * @param preferredStart 优先匹配的起始字符（'{' 或 '['），'\0' 表示自动检测
     */
    private String extractJsonString(String input, char preferredStart) {
        String trimmed = input.trim()
                .replaceAll("^```(?:json)?\\s*", "")
                .replaceAll("\\s*```$", "")
                .trim();

        if (preferredStart == '{' && trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
        if (preferredStart == '[' && trimmed.startsWith("[") && trimmed.endsWith("]")) return trimmed;
        if (preferredStart == '\0' &&
            ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
             (trimmed.startsWith("[") && trimmed.endsWith("]")))) return trimmed;

        int start = -1;
        if (preferredStart == '{') start = trimmed.indexOf('{');
        else if (preferredStart == '[') start = trimmed.indexOf('[');
        else {
            int braceStart = trimmed.indexOf('{');
            int bracketStart = trimmed.indexOf('[');
            if (braceStart >= 0 && bracketStart >= 0) start = Math.min(braceStart, bracketStart);
            else if (braceStart >= 0) start = braceStart;
            else if (bracketStart >= 0) start = bracketStart;
        }
        if (start < 0) return null;

        char openChar = trimmed.charAt(start);
        char closeChar = openChar == '{' ? '}' : ']';
        int depth = 0;
        for (int i = start; i < trimmed.length(); i++) {
            char c = trimmed.charAt(i);
            if (c == openChar) depth++;
            else if (c == closeChar) depth--;
            if (depth == 0) return trimmed.substring(start, i + 1);
        }
        return null;
    }

    // ── 工具方法 ────────────────────────────────────────────────────

    private Map<String, String> candidateEntry(String title, String content) {
        Map<String, String> entry = new LinkedHashMap<>();
        entry.put("title", title);
        entry.put("content", content);
        return entry;
    }

    private String toJson(Object obj) {
        try {
            return OBJECT_MAPPER.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.error("[FormatValidator] JSON 序列化失败", e);
            return "{}";
        }
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max) + "...";
    }
}
