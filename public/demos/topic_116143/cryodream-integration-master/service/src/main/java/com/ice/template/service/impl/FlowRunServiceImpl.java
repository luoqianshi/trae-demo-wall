package com.ice.template.service.impl;

import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowGraphExecutor;
import com.ice.template.model.dto.flow.FlowGraphDTO;
import com.ice.template.model.dto.flow.FlowRunRequest;
import com.ice.template.model.vo.flow.FlowRunResponse;
import com.ice.template.model.vo.flow.FlowRunStepVO;
import com.ice.template.service.FlowRunService;
import java.util.List;
import java.util.UUID;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class FlowRunServiceImpl implements FlowRunService {

    @Resource
    private FlowGraphExecutor flowGraphExecutor;

    @Override
    public FlowRunResponse runFlow(FlowRunRequest flowRunRequest) {
        validRequest(flowRunRequest);
        String runId = "run-" + UUID.randomUUID();
        FlowExecutionContext context = new FlowExecutionContext();
        context.setRunId(runId);
        context.setInputValue(StringUtils.defaultString(flowRunRequest.getInputValue()));
        context.setCurrentText(StringUtils.defaultString(flowRunRequest.getInputValue()));
        context.setSessionId(flowRunRequest.getSessionId());
        context.setStartTime(System.currentTimeMillis());
        FlowRunResponse response = new FlowRunResponse();
        response.setRunId(runId);
        // 执行工作流：节点失败时不抛异常，返回包含 FAILED 步骤的列表
        List<FlowRunStepVO> steps = flowGraphExecutor.execute(flowRunRequest.getFlow(), flowRunRequest.getStartNodeId(), context);
        response.setSteps(steps);
        response.setOutputText(StringUtils.defaultString(context.getCurrentText()));
        response.setOutputs(context.getOutputs());
        response.setMessages(context.getMessages());
        // 如果有节点失败，整体状态为 FAILED
        boolean hasFailed = steps.stream().anyMatch(step -> "FAILED".equals(step.getStatus()));
        if (hasFailed) {
            response.setStatus("FAILED");
            // 取第一个失败节点的错误信息作为整体错误信息
            FlowRunStepVO failedStep = steps.stream()
                    .filter(step -> "FAILED".equals(step.getStatus()))
                    .findFirst()
                    .orElse(null);
            if (failedStep != null) {
                response.setErrorMessage("节点「" + failedStep.getNodeName() + "」执行失败：" + failedStep.getErrorMessage());
            }
        } else {
            response.setStatus("SUCCESS");
        }
        return response;
    }

    private void validRequest(FlowRunRequest flowRunRequest) {
        if (flowRunRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        FlowGraphDTO flow = flowRunRequest.getFlow();
        if (flow == null || flow.getNodes() == null || flow.getNodes().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "工作流节点不能为空");
        }
    }
}
