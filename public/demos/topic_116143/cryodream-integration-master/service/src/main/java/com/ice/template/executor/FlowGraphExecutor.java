package com.ice.template.executor;

import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.dto.flow.FlowEdgeDTO;
import com.ice.template.model.dto.flow.FlowGraphDTO;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.model.vo.flow.FlowRunStepVO;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.stream.Collectors;
import javax.annotation.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class FlowGraphExecutor {

    private static final Logger log = LoggerFactory.getLogger(FlowGraphExecutor.class);

    @Resource
    private List<FlowNodeExecutor> nodeExecutors;

    public List<FlowRunStepVO> execute(FlowGraphDTO flow, String startNodeId, FlowExecutionContext context) {
        List<FlowNodeDTO> nodes = flow.getNodes() == null ? new ArrayList<>() : flow.getNodes();
        List<FlowEdgeDTO> edges = flow.getEdges() == null ? new ArrayList<>() : flow.getEdges();
        context.setNodes(nodes);
        context.setEdges(edges);
        List<FlowNodeDTO> order = buildExecutionOrder(flow, startNodeId);
        log.info("[FlowGraphExecutor] 执行顺序：{}", order.stream()
                .map(node -> FlowNodeDataUtils.getDisplayName(node) + "(" + FlowNodeDataUtils.getNodeType(node) + ")")
                .collect(Collectors.joining(" -> ")));
        List<FlowRunStepVO> steps = new ArrayList<>();
        for (FlowNodeDTO node : order) {
            FlowRunStepVO step = executeNode(node, context);
            steps.add(step);
            // 节点执行失败时，停止后续节点执行，但返回已执行的步骤（含失败节点信息）
            if ("FAILED".equals(step.getStatus())) {
                log.warn("[FlowGraphExecutor] 节点执行失败，停止后续执行：nodeId={}, error={}",
                        node.getId(), step.getErrorMessage());
                break;
            }
        }
        return steps;
    }

    private FlowRunStepVO executeNode(FlowNodeDTO node, FlowExecutionContext context) {
        long start = System.currentTimeMillis();
        FlowRunStepVO step = new FlowRunStepVO();
        String nodeType = FlowNodeDataUtils.getNodeType(node);
        step.setNodeId(node.getId());
        step.setNodeName(FlowNodeDataUtils.getDisplayName(node));
        step.setNodeType(nodeType);
        // 调试日志：打印节点执行前的关键数据，排查节点数据提取问题
        log.info("[FlowGraphExecutor] 开始执行节点：nodeId={}, nodeType={}, displayName={}, dataKeys={}",
                node.getId(),
                nodeType,
                step.getNodeName(),
                node.getData() == null ? "null" : node.getData().keySet());
        try {
            // 基于连线把上游节点输出注入当前节点的输入字段
            injectInputsFromEdges(node, context);
            FlowNodeExecutor executor = nodeExecutors.stream()
                    .filter(item -> item.supports(nodeType))
                    .findFirst()
                    .orElse(null);
            FlowNodeExecuteResult result = executor == null ? passThrough(node, context) : executor.execute(node, context);
            context.getNodeOutputs().put(node.getId(), result.getOutput());
            step.setStatus("SUCCESS");
            step.setInput(result.getInput());
            step.setOutput(result.getOutput());
        } catch (Exception e) {
            // 节点执行失败时，记录错误信息但不抛异常，返回 FAILED 状态的 step
            // 这样前端可以收到已执行的步骤列表，看到具体哪个节点失败
            step.setStatus("FAILED");
            step.setErrorMessage(e.getMessage());
            log.error("[FlowGraphExecutor] 节点执行失败：nodeId={}, nodeType={}, error={}",
                    node.getId(), nodeType, e.getMessage(), e);
        } finally {
            step.setElapsedMs(System.currentTimeMillis() - start);
        }
        return step;
    }

    /**
     * 基于连线（edges）把上游节点输出注入到当前节点的输入字段。
     * 规则：对每条 source -> target 连线（edge.sourceHandle -> edge.targetHandle），
     * 从 context.nodeOutputs[source] 中读取 sourceHandle 对应的值，
     * 注入到 target 节点的 data.values[targetHandle]，并同步更新 context 变量。
     */
    private void injectInputsFromEdges(FlowNodeDTO node, FlowExecutionContext context) {
        String nodeId = node.getId();
        List<FlowEdgeDTO> edges = context.getEdges();
        if (edges == null || edges.isEmpty()) {
            return;
        }
        Map<String, Map<String, Object>> nodeOutputs = context.getNodeOutputs();
        for (FlowEdgeDTO edge : edges) {
            if (!nodeId.equals(edge.getTarget())) {
                continue;
            }
            Map<String, Object> upstreamOutput = nodeOutputs.get(edge.getSource());
            if (upstreamOutput == null || upstreamOutput.isEmpty()) {
                continue;
            }
            String sourceHandle = edge.getSourceHandle();
            String targetHandle = edge.getTargetHandle();
            Object value = upstreamOutput.get(sourceHandle);
            if (value == null) {
                continue;
            }
            // 注入到当前节点的 data.values，供 FlowNodeDataUtils.getTemplateValue 读取
            Map<String, Object> data = node.getData();
            if (data == null) {
                data = new java.util.HashMap<>();
                node.setData(data);
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> values = (Map<String, Object>) data.get("values");
            if (values == null) {
                values = new java.util.HashMap<>();
                data.put("values", values);
            }
            values.put(targetHandle, value);
            // 同步更新 context 变量，兼容节点执行器的直接读取逻辑
            context.setVariable(targetHandle, String.valueOf(value));
            // 若输入字段名为 "text" 或 "input"，也同步到 currentText
            if ("text".equals(sourceHandle) || "input".equals(targetHandle)) {
                if (value instanceof String) {
                    context.setCurrentText((String) value);
                }
            }
        }
    }

    private FlowNodeExecuteResult passThrough(FlowNodeDTO node, FlowExecutionContext context) {
        String text = context.getCurrentText() == null ? context.getInputValue() : context.getCurrentText();
        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(text);
        result.getInput().put("input", text);
        result.getOutput().put("nodeType", FlowNodeDataUtils.getNodeType(node));
        return result;
    }

    private List<FlowNodeDTO> buildExecutionOrder(FlowGraphDTO flow, String startNodeId) {
        List<FlowNodeDTO> nodes = flow.getNodes();
        List<FlowEdgeDTO> edges = flow.getEdges() == null ? new ArrayList<>() : flow.getEdges();
        Map<String, FlowNodeDTO> nodeMap = nodes.stream().collect(Collectors.toMap(FlowNodeDTO::getId, item -> item, (left, right) -> left));
        String entryId = inferEntryNodeId(nodes, edges, startNodeId);
        if (!nodeMap.containsKey(entryId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "执行入口节点不存在");
        }

        // 构建邻接表与入度表（仅统计图中存在的节点）
        Map<String, List<String>> outgoing = new HashMap<>();
        Map<String, Integer> inDegree = new HashMap<>();
        for (FlowNodeDTO node : nodes) {
            outgoing.put(node.getId(), new ArrayList<>());
            inDegree.put(node.getId(), 0);
        }
        for (FlowEdgeDTO edge : edges) {
            if (!nodeMap.containsKey(edge.getSource()) || !nodeMap.containsKey(edge.getTarget())) {
                continue;
            }
            outgoing.get(edge.getSource()).add(edge.getTarget());
            inDegree.merge(edge.getTarget(), 1, Integer::sum);
        }

        // 拓扑排序（Kahn 算法），保证每个节点在其所有前驱节点之后执行
        List<FlowNodeDTO> ordered = new ArrayList<>();
        Queue<String> queue = new ArrayDeque<>();
        // 入口节点最先入队，保证它排在执行顺序首位
        queue.add(entryId);
        inDegree.put(entryId, 0);
        // 其他零入度节点也作为起点入队（如 PromptTemplate 等无入边的节点），
        // 否则它们不会被从 entryId 出发的单源遍历触达，导致后置追加而打乱拓扑顺序
        for (FlowNodeDTO node : nodes) {
            String nodeId = node.getId();
            if (nodeId.equals(entryId)) {
                continue;
            }
            if (inDegree.getOrDefault(nodeId, 0) == 0) {
                queue.add(nodeId);
            }
        }
        while (!queue.isEmpty()) {
            String nodeId = queue.poll();
            FlowNodeDTO node = nodeMap.get(nodeId);
            if (node == null) {
                continue;
            }
            ordered.add(node);
            for (String nextId : outgoing.getOrDefault(nodeId, new ArrayList<>())) {
                int remain = inDegree.merge(nextId, -1, Integer::sum);
                if (remain == 0) {
                    queue.add(nextId);
                }
            }
        }

        // 处理孤立节点或未触达节点（无连线的节点按位置顺序追加）
        if (ordered.size() < nodes.size()) {
            List<FlowNodeDTO> remaining = nodes.stream()
                    .filter(item -> !ordered.contains(item))
                    .sorted(Comparator.comparing(this::getPositionX))
                    .collect(Collectors.toList());
            ordered.addAll(remaining);
        }
        if (ordered.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "没有可执行节点");
        }
        return ordered;
    }

    private String inferEntryNodeId(List<FlowNodeDTO> nodes, List<FlowEdgeDTO> edges, String startNodeId) {
        if (startNodeId != null && !startNodeId.isBlank()) {
            return startNodeId;
        }
        // 优先找 ObjectInput（对象输入工作流），其次找 ChatInput（聊天工作流）
        return nodes.stream()
                .filter(node -> "ObjectInput".equals(FlowNodeDataUtils.getNodeType(node)))
                .map(FlowNodeDTO::getId)
                .findFirst()
                .or(() -> nodes.stream()
                        .filter(node -> "ChatInput".equals(FlowNodeDataUtils.getNodeType(node)))
                        .map(FlowNodeDTO::getId)
                        .findFirst())
                .orElseGet(() -> inferZeroInDegreeNode(nodes, edges));
    }

    private String inferZeroInDegreeNode(List<FlowNodeDTO> nodes, List<FlowEdgeDTO> edges) {
        java.util.Set<String> targets = edges.stream().map(FlowEdgeDTO::getTarget).collect(Collectors.toSet());
        return nodes.stream()
                .filter(node -> !targets.contains(node.getId()))
                .min(Comparator.comparing(this::getPositionX))
                .map(FlowNodeDTO::getId)
                .orElse(nodes.get(0).getId());
    }

    private Double getPositionX(FlowNodeDTO node) {
        if (node.getPosition() == null) {
            return 0D;
        }
        Object value = node.getPosition().getOrDefault("x", 0);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException e) {
            return 0D;
        }
    }
}
