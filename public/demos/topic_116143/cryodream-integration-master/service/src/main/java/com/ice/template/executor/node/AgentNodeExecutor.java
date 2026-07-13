package com.ice.template.executor.node;

import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.integration.llm.OpenAiChatMessage;
import com.ice.template.integration.llm.OpenAiCompatibleClient;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.model.entity.ModelConfig;
import com.ice.template.model.vo.flow.FlowRunMessageVO;
import com.ice.template.service.ModelConfigService;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

@Component
public class AgentNodeExecutor implements FlowNodeExecutor {

    @Resource
    private ModelConfigService modelConfigService;

    @Resource
    private OpenAiCompatibleClient openAiCompatibleClient;

    @Override
    public boolean supports(String nodeType) {
        return "Agent".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String modelConfigId = FlowNodeDataUtils.getTemplateString(node, "agent_model_config_id");
        ModelConfig modelConfig = modelConfigService.getById(modelConfigId);
        String input = StringUtils.defaultIfBlank(context.getCurrentText(), context.getInputValue());
        String systemPrompt = FlowNodeDataUtils.getTemplateString(node, "system_prompt");
        List<OpenAiChatMessage> messages = new ArrayList<>();
        if (StringUtils.isNotBlank(systemPrompt)) {
            messages.add(new OpenAiChatMessage("system", systemPrompt));
        }
        messages.add(new OpenAiChatMessage("user", input == null ? "" : input));
        String output = openAiCompatibleClient.chat(modelConfig, messages, modelConfig == null ? null : modelConfig.getTemperature(), modelConfig == null ? null : modelConfig.getMaxTokens());
        context.setCurrentText(output);
        FlowRunMessageVO assistantMessage = new FlowRunMessageVO();
        assistantMessage.setRole("assistant");
        assistantMessage.setContent(output);
        context.getMessages().add(assistantMessage);
        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(output);
        result.getInput().put("modelConfigId", modelConfigId);
        result.getInput().put("input", input);
        result.getInput().put("systemPrompt", systemPrompt);
        result.getOutput().put("response", output);
        return result;
    }
}
