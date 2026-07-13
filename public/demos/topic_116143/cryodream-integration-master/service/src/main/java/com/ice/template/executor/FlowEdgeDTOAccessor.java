package com.ice.template.executor;

import com.ice.template.model.dto.flow.FlowEdgeDTO;
import java.util.List;
import java.util.Map;
import org.apache.commons.lang3.StringUtils;

/**
 * 辅助类：通过 edges 查找节点的上游输入。
 * 用于 PromptTemplate 等节点根据 targetHandle 获取上游节点输出。
 */
public class FlowEdgeDTOAccessor {

    private FlowEdgeDTOAccessor() {}

    /**
     * 查找给定节点的 targetHandle 所连接的上游节点，并从上一个节点的输出中提取第一个字符串值。
     */
    public static String getUpstreamHandleValue(FlowExecutionContext context, String nodeId, String targetHandle) {
        if (context == null || nodeId == null || targetHandle == null) return null;
        List<FlowEdgeDTO> edges = context.getEdges();
        Map<String, Map<String, Object>> nodeOutputs = context.getNodeOutputs();
        if (edges == null || nodeOutputs == null) return null;

        for (FlowEdgeDTO edge : edges) {
            if (!nodeId.equals(edge.getTarget())) continue;
            // 匹配 targetHandle：如果 edge.getTargetHandle() 为 null，尝试精确匹配
            String edgeHandle = edge.getTargetHandle();
            if (edgeHandle == null || edgeHandle.isBlank()) continue;
            if (!targetHandle.equals(edgeHandle)) continue;

            // 找到上游节点输出
            Map<String, Object> output = nodeOutputs.get(edge.getSource());
            if (output == null || output.isEmpty()) continue;

            String firstStringValue = extractFirstStringValue(output);
            if (StringUtils.isNotBlank(firstStringValue)) return firstStringValue;
        }
        return null;
    }

    /**
     * 从上游节点的输出中提取一个有意义的字符串值。
     * 按顺序尝试：output["prompt"] → output["text"] → output["data"] → 第一个字符串值
     */
    @SuppressWarnings("unchecked")
    private static String extractFirstStringValue(Object output) {
        if (output == null) return null;
        if (output instanceof String) return (String) output;

        if (output instanceof Map) {
            Map<String, Object> outputMap = (Map<String, Object>) output;
            // 按优先级尝试常用的输出 key
            String[] priorityKeys = {"prompt", "text", "data", "output", "message", "value", "result"};
            for (String key : priorityKeys) {
                Object val = outputMap.get(key);
                if (val != null && StringUtils.isNotBlank(String.valueOf(val))) {
                    return String.valueOf(val);
                }
            }
            // 取第一个字符串值
            for (Map.Entry<String, Object> entry : outputMap.entrySet()) {
                Object val = entry.getValue();
                if (val != null && !(val instanceof Map) && !(val instanceof List)) {
                    String s = String.valueOf(val);
                    if (StringUtils.isNotBlank(s)) return s;
                }
            }
            return null;
        }

        return String.valueOf(output);
    }
}
