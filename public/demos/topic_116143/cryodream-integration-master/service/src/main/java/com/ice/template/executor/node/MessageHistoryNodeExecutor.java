package com.ice.template.executor.node;

import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import org.springframework.stereotype.Component;

@Component
public class MessageHistoryNodeExecutor implements FlowNodeExecutor {

    @Override
    public boolean supports(String nodeType) {
        return "MessageHistory".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String text = context.getCurrentText() == null ? context.getInputValue() : context.getCurrentText();
        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(text);
        result.getOutput().put("history", context.getMessages());
        return result;
    }
}
