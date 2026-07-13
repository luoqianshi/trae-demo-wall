package com.ice.template.executor.node;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import java.util.Map;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 对象输入节点。
 * 接收 JSON 字符串，解析为独立字段，存入 context.variables 供下游 PromptTemplate 等节点使用。
 */
@Component
public class ObjectInputNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(ObjectInputNodeExecutor.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Override
    public boolean supports(String nodeType) {
        return "ObjectInput".equals(nodeType);
    }

    @Override
    @SuppressWarnings("unchecked")
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        // 作为入口节点时 currentText 为空，回退到 inputValue
        String input = StringUtils.defaultIfBlank(context.getCurrentText(), context.getInputValue());
        if (input == null) input = "";

        // 尝试去除 markdown 代码块包裹
        String cleaned = input.trim()
                .replaceAll("^```(?:json)?\\s*", "")
                .replaceAll("\\s*```$", "")
                .trim();

        Map<String, Object> parsed;
        try {
            parsed = OBJECT_MAPPER.readValue(cleaned, Map.class);
        } catch (JsonProcessingException e) {
            log.warn("[ObjectInput] 输入不是有效 JSON，尝试包装为 {{input}}: {}", e.getMessage());
            // 非 JSON，包装为单字段
            parsed = Map.of("input", cleaned);
        }

        // 将解析后的每个字段存入 context.variables
        int count = 0;
        for (Map.Entry<String, Object> entry : parsed.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue() != null ? String.valueOf(entry.getValue()) : "";
            context.setVariable(key, value);
            count++;
        }

        log.info("[ObjectInput] 解析出 {} 个字段: {}", count, parsed.keySet());

        // 不设置 currentText，ObjectInput 通过 variables 传递数据
        // 下游 LanguageModel 从 input_value 字段（连线注入）获取用户消息
        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(cleaned);
        result.getInput().put("input", truncate(input, 500));
        result.getOutput().put("fields", parsed.keySet());
        result.getOutput().put("count", count);
        // 也把每个字段放入 output，方便调试
        for (Map.Entry<String, Object> entry : parsed.entrySet()) {
            result.getOutput().put(entry.getKey(), entry.getValue());
        }
        return result;
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max) + "...";
    }
}
