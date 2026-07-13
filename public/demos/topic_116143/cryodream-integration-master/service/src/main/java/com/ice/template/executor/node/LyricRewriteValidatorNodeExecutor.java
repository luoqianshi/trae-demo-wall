package com.ice.template.executor.node;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 歌词改写校验节点。
 * 接收 LLM 的原始输出，解析出短词替换候选，过滤无效输出（prompt 回传、完整歌词、过长文本等），
 * 输出结构化 JSON 给前端。
 */
@Component
public class LyricRewriteValidatorNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(LyricRewriteValidatorNodeExecutor.class);

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
    };

    // 歌词段落标记
    private static final Pattern SECTION_MARKER = Pattern.compile("^\\s*\\[[^\\]]+\\]\\s*$");

    @Override
    public boolean supports(String nodeType) {
        return "LyricRewriteValidator".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String input = StringUtils.defaultIfBlank(context.getCurrentText(), "");
        String selectedText = FlowNodeDataUtils.getTemplateString(node, "selected_text");

        log.info("[LyricRewriteValidator] input length={}, selectedText='{}'",
                input.length(), selectedText);

        List<Map<String, String>> candidates = parseAndValidate(input, selectedText);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("candidates", candidates);
        result.put("count", candidates.size());

        String json;
        try {
            json = OBJECT_MAPPER.writeValueAsString(result);
        } catch (JsonProcessingException e) {
            log.error("[LyricRewriteValidator] JSON 序列化失败", e);
            json = "{\"candidates\":[],\"count\":0}";
        }

        context.setCurrentText(json);
        FlowNodeExecuteResult executeResult = FlowNodeExecuteResult.of(json);
        executeResult.getInput().put("input", truncate(input, 500));
        executeResult.getInput().put("selected_text", selectedText);
        executeResult.getOutput().put("candidates", json);
        executeResult.getOutput().put("count", candidates.size());
        return executeResult;
    }

    private List<Map<String, String>> parseAndValidate(String input, String selectedText) {
        List<Map<String, String>> candidates = new ArrayList<>();
        int selectedLen = Math.max(selectedText.length(), 1);
        int maxLen = Math.max(selectedLen * 3, 20);

        // 0. 优先尝试 JSON 格式解析（新提示词要求 LLM 输出 JSON）
        List<Map<String, String>> jsonCandidates = tryParseJsonCandidates(input, maxLen, selectedText);
        if (!jsonCandidates.isEmpty()) {
            return jsonCandidates;
        }

        // 1. 尝试按 "候选N" 标题格式匹配
        var headerMatches = Pattern.compile("候选\\s*(\\d+)\\s*\\n([\\s\\S]*?)(?=\\n候选\\s*\\d+|$)")
                .matcher(input);
        boolean headerFound = false;
        while (headerMatches.find()) {
            headerFound = true;
            String content = headerMatches.group(2).trim();
            if (isValidCandidate(content, maxLen, selectedText)) {
                candidates.add(candidateEntry(String.format("候选 %s", headerMatches.group(1)), content));
            }
        }
        if (headerFound && !candidates.isEmpty()) {
            return candidates;
        }

        // 2. 尝试按 ### 标题格式匹配
        var mdMatches = Pattern.compile("###\\s*(.+?)\\s*\\n([\\s\\S]*?)(?=\\n###\\s+|\\n##\\s+|$)")
                .matcher(input);
        boolean mdFound = false;
        while (mdMatches.find()) {
            mdFound = true;
            String title = mdMatches.group(1).trim();
            String content = mdMatches.group(2).trim();
            if (isValidCandidate(content, maxLen, selectedText) && !isPromptInstruction(title)) {
                candidates.add(candidateEntry(title, content));
            }
        }
        if (mdFound && !candidates.isEmpty()) {
            return candidates;
        }

        // 3. 兜底：按空行分段
        String[] segments = input.split("\\n{2,}");
        int idx = 1;
        for (String seg : segments) {
            // 按行拆分，去掉指令行
            String[] lines = seg.split("\\n");
            StringBuilder sb = new StringBuilder();
            for (String line : lines) {
                if (!isPromptInstruction(line)) {
                    if (sb.length() > 0) sb.append("\n");
                    sb.append(line);
                }
            }
            String content = sb.toString().trim();
            if (isValidCandidate(content, maxLen, selectedText)) {
                candidates.add(candidateEntry(String.format("候选 %d", idx), content));
                idx++;
            }
        }

        return candidates;
    }

    /**
     * 优先尝试解析 JSON 格式输出：{"candidates":["c1","c2","c3"]}
     * 或直接数组格式：["c1","c2","c3"]
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, String>> tryParseJsonCandidates(String input, int maxLen, String selectedText) {
        List<Map<String, String>> candidates = new ArrayList<>();

        // 从输入中提取 JSON 部分（LLM 可能在 JSON 前后附加文字）
        String jsonStr = extractJsonString(input);
        if (jsonStr == null) return candidates;

        try {
            Object parsed = OBJECT_MAPPER.readValue(jsonStr, Object.class);

            // 格式1: {"candidates": ["c1", "c2", "c3"]}
            if (parsed instanceof Map) {
                Map<String, Object> map = (Map<String, Object>) parsed;
                Object cands = map.get("candidates");
                if (cands instanceof List) {
                    int idx = 1;
                    for (Object item : (List<?>) cands) {
                        String content = String.valueOf(item).trim();
                        if (isValidCandidate(content, maxLen, selectedText)) {
                            candidates.add(candidateEntry(String.format("候选 %d", idx), content));
                            idx++;
                        }
                    }
                }
            }
            // 格式2: ["c1", "c2", "c3"]
            else if (parsed instanceof List) {
                int idx = 1;
                for (Object item : (List<?>) parsed) {
                    String content = String.valueOf(item).trim();
                    if (isValidCandidate(content, maxLen, selectedText)) {
                        candidates.add(candidateEntry(String.format("候选 %d", idx), content));
                        idx++;
                    }
                }
            }
        } catch (Exception e) {
            log.debug("[LyricRewriteValidator] JSON 解析失败，回退到文本解析: {}", e.getMessage());
        }

        return candidates;
    }

    /**
     * 从 LLM 输出中提取 JSON 字符串（处理 LLM 在 JSON 前后附加文字的情况）
     */
    private String extractJsonString(String input) {
        String trimmed = input.trim();
        // 直接就是 JSON
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
            (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
            return trimmed;
        }
        // 从文本中提取 JSON 块
        int braceStart = trimmed.indexOf('{');
        int bracketStart = trimmed.indexOf('[');
        int start = -1;
        if (braceStart >= 0 && bracketStart >= 0) {
            start = Math.min(braceStart, bracketStart);
        } else if (braceStart >= 0) {
            start = braceStart;
        } else if (bracketStart >= 0) {
            start = bracketStart;
        }
        if (start < 0) return null;

        char openChar = trimmed.charAt(start);
        char closeChar = openChar == '{' ? '}' : ']';
        // 找到匹配的关闭括号
        int depth = 0;
        for (int i = start; i < trimmed.length(); i++) {
            char c = trimmed.charAt(i);
            if (c == openChar) depth++;
            else if (c == closeChar) depth--;
            if (depth == 0) {
                return trimmed.substring(start, i + 1);
            }
        }
        return null;
    }

    private boolean isValidCandidate(String content, int maxLen, String selectedText) {
        if (StringUtils.isBlank(content)) return false;
        // 包含段落标记（如 [Verse 1]）的是完整歌词片段
        if (SECTION_MARKER.matcher(content).find()) return false;
        // 超过最大长度
        if (content.length() > maxLen) return false;
        // 包含换行的不适合短词替换（选区改写应该是短词）
        if (content.contains("\n")) return false;
        // 是 prompt 指令
        if (isPromptInstruction(content)) return false;
        // 内容就是原文的引号包裹回传（如 "继续沉沦" 或 "继续沉沦"）
        if (StringUtils.isNotBlank(selectedText)) {
            String trimmed = content.trim();
            String quoted = "\"" + selectedText + "\"";
            String quotedCn = "\u201C" + selectedText + "\u201D";
            if (trimmed.equals(quoted) || trimmed.equals(quotedCn) || trimmed.equals(selectedText)) return false;
        }
        return true;
    }

    private boolean isPromptInstruction(String text) {
        String t = text.trim();
        for (Pattern pattern : PROMPT_INSTRUCTION_PATTERNS) {
            if (pattern.matcher(t).find()) return true;
        }
        return false;
    }

    private Map<String, String> candidateEntry(String title, String content) {
        Map<String, String> entry = new LinkedHashMap<>();
        entry.put("title", title);
        entry.put("content", content);
        return entry;
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max) + "...";
    }
}
