package com.ice.template.executor.node;

import com.ice.template.executor.FlowEdgeDTOAccessor;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 提示词模板节点执行器。
 * - 从模板中解析 {{变量名}} 形式的变量
 * - 优先从连接的上游节点获取变量值
 * - 其次从节点配置的 variables 字段获取默认值
 * - 替换变量后输出最终提示词
 */
@Component
public class PromptTemplateNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(PromptTemplateNodeExecutor.class);

    private static final Pattern MUSTACHE_VARIABLE_PATTERN = Pattern.compile("\\{\\{([a-zA-Z_][a-zA-Z0-9_]*)\\}\\}");

    @Override
    public boolean supports(String nodeType) {
        return "PromptTemplate".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String template = FlowNodeDataUtils.getTemplateString(node, "template");
        if (StringUtils.isBlank(template)) {
            template = "";
        }

        // 从模板中解析出所有 {{变量名}}
        Map<String, String> variableValues = resolveVariables(node, context, template);

        // 替换所有 {{变量名}}
        String resolved = substituteVariables(template, variableValues);

        // 设置系统消息（给下游 LLM 节点使用）
        context.setSystemMessage(resolved);

        log.info("[PromptTemplate] template={}, variables={}, resolved={}",
                truncate(template, 200), variableValues, truncate(resolved, 200));

        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(resolved);
        result.getInput().put("template", template);
        result.getInput().put("variables", variableValues);
        result.getOutput().put("prompt", resolved);
        return result;
    }

    /**
     * 解析并填充所有模板变量。
     * - 优先级1：上游节点连接到 var_{变量名} handle 的输出
     * - 优先级2：context.variables（由 ObjectInput 等上游节点注入）
     * - 优先级3：节点 data.variables 中手动填写的默认值
     * - 优先级4：兼容旧写法 {{input}} / 保持 {{变量名}} 原样
     */
    private Map<String, String> resolveVariables(FlowNodeDTO node, FlowExecutionContext context, String template) {
        Map<String, String> variableValues = new HashMap<>();

        Matcher matcher = MUSTACHE_VARIABLE_PATTERN.matcher(template);
        while (matcher.find()) {
            String varName = matcher.group(1);
            if (variableValues.containsKey(varName)) continue;

            // 1) 从上游节点连接中获取（targetHandle = var_{变量名}）
            String upstreamValue = FlowEdgeDTOAccessor.getUpstreamHandleValue(context, node.getId(), "var_" + varName);
            if (StringUtils.isNotBlank(upstreamValue)) {
                variableValues.put(varName, upstreamValue);
                continue;
            }

            // 2) 从 context.variables 获取（由 ObjectInput 等上游节点注入）
            Object contextVar = context.getVariable(varName);
            if (contextVar != null && StringUtils.isNotBlank(String.valueOf(contextVar))) {
                variableValues.put(varName, String.valueOf(contextVar));
                continue;
            }

            // 3) 从节点配置 variables 字段获取默认值
            Object variablesObj = FlowNodeDataUtils.getNestedValueObj(node, "variables");
            if (variablesObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> variablesMap = (Map<String, Object>) variablesObj;
                Object val = variablesMap.get(varName);
                if (val != null && StringUtils.isNotBlank(String.valueOf(val))) {
                    variableValues.put(varName, String.valueOf(val));
                    continue;
                }
            }

            // 4) 兼容旧写法：{{input}} 与 {input}
            if ("input".equals(varName)) {
                String currentText = context.getCurrentText() == null ? context.getInputValue() : context.getCurrentText();
                variableValues.put(varName, currentText == null ? "" : currentText);
            } else {
                // 保持原始 {{变量名}}，方便调试
                variableValues.put(varName, "{{" + varName + "}}");
            }
        }

        return variableValues;
    }

    private String substituteVariables(String template, Map<String, String> values) {
        if (StringUtils.isBlank(template)) return "";
        String result = template;
        for (Map.Entry<String, String> entry : values.entrySet()) {
            String token = "{{" + entry.getKey() + "}}";
            String replacement = entry.getValue() == null ? "" : entry.getValue();
            result = result.replace(token, replacement);
        }
        // 兼容旧写法 {input}
        result = result.replace("{input}", contextInputValueOrDefault(values));
        return result;
    }

    private String contextInputValueOrDefault(Map<String, String> values) {
        String v = values.get("input");
        if (StringUtils.isNotBlank(v) && !"{{input}}".equals(v)) return v;
        return "";
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        if (text.length() <= max) return text;
        return text.substring(0, max) + "...";
    }
}
