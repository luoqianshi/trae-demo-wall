package com.ice.template.executor.node;

import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import org.springframework.stereotype.Component;

@Component
public class ChatOutputNodeExecutor implements FlowNodeExecutor {

    @Override
    public boolean supports(String nodeType) {
        return "ChatOutput".equals(nodeType) || "TextOutput".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String outputText = context.getCurrentText() == null ? "" : context.getCurrentText();
        // 读取输出参数名，默认为 "result"
        String outputName = FlowNodeDataUtils.getTemplateString(node, "output_name");
        if (outputName.isBlank()) {
            outputName = "result";
        }
        // 将输出值存入 context.outputs，供调用方获取结构化输出
        context.getOutputs().put(outputName, outputText);
        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(outputText);
        result.getInput().put("input", outputText);
        result.getOutput().put("message", outputText);
        result.getOutput().put("output_name", outputName);
        return result;
    }
}
