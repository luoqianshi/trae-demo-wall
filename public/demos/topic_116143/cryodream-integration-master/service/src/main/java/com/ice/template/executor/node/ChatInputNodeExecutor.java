package com.ice.template.executor.node;

import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.model.vo.flow.FlowRunMessageVO;
import org.springframework.stereotype.Component;

@Component
public class ChatInputNodeExecutor implements FlowNodeExecutor {

    @Override
    public boolean supports(String nodeType) {
        return "ChatInput".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String inputValue = context.getInputValue() == null ? "" : context.getInputValue();
        context.setCurrentText(inputValue);
        FlowRunMessageVO message = new FlowRunMessageVO();
        message.setRole("user");
        message.setContent(inputValue);
        context.getMessages().add(message);
        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(inputValue);
        result.getInput().put("inputValue", inputValue);
        result.getOutput().put("message", inputValue);
        return result;
    }
}
