package com.ice.template.executor;

import com.ice.template.model.dto.flow.FlowNodeDTO;

public interface FlowNodeExecutor {

    boolean supports(String nodeType);

    FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context);
}
