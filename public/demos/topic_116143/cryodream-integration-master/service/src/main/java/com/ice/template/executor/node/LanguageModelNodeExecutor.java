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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class LanguageModelNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(LanguageModelNodeExecutor.class);

    @Resource
    private ModelConfigService modelConfigService;

    @Resource
    private OpenAiCompatibleClient openAiCompatibleClient;

    @Override
    public boolean supports(String nodeType) {
        return "LanguageModel".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String modelConfigId = FlowNodeDataUtils.getTemplateString(node, "model_config_id");
        ModelConfig modelConfig = resolveModelConfig(modelConfigId);
        if (modelConfig != null) {
            modelConfigId = modelConfig.getId();
        }
        // 优先级：1. input_value 字段（连线注入）
        //         2. currentText（上游节点设置的文本）
        //         3. inputValue（工作流初始输入）
        //         4. 默认触发文本（当系统提示词已包含完整指令时，用户消息只需触发）
        String input = FlowNodeDataUtils.getTemplateString(node, "input_value");
        if (StringUtils.isBlank(input)) {
            input = StringUtils.defaultIfBlank(context.getCurrentText(), context.getInputValue());
        }
        if (StringUtils.isBlank(input)) {
            input = "请按照系统提示词的要求输出";
        }
        String systemMessage = StringUtils.defaultIfBlank(context.getSystemMessage(), FlowNodeDataUtils.getTemplateString(node, "system_message"));
        log.info("[LanguageModel] modelConfigId={}, input={}, systemMessage={}, currentText={}, contextSystemMessage={}",
                modelConfigId, input, systemMessage, context.getCurrentText(), context.getSystemMessage());
        Double temperature = FlowNodeDataUtils.getTemplateDouble(node, "temperature", modelConfig == null ? null : modelConfig.getTemperature());
        Integer maxTokens = FlowNodeDataUtils.getTemplateInteger(node, "max_tokens", modelConfig == null ? null : modelConfig.getMaxTokens());
        List<OpenAiChatMessage> messages = new ArrayList<>();
        if (StringUtils.isNotBlank(systemMessage)) {
            messages.add(new OpenAiChatMessage("system", systemMessage));
        }
        messages.add(new OpenAiChatMessage("user", input == null ? "" : input));
        log.info("[LanguageModel] 发送给模型的 messages={}", messages);
        String output = openAiCompatibleClient.chat(modelConfig, messages, temperature, maxTokens);
        log.info("[LanguageModel] 模型返回 output={}", output);
        context.setCurrentText(output);
        FlowRunMessageVO assistantMessage = new FlowRunMessageVO();
        assistantMessage.setRole("assistant");
        assistantMessage.setContent(output);
        context.getMessages().add(assistantMessage);
        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(output);
        result.getInput().put("modelConfigId", modelConfigId);
        result.getInput().put("input", input);
        result.getInput().put("systemMessage", systemMessage);
        result.getOutput().put("response", output);
        return result;
    }

    private ModelConfig resolveModelConfig(String modelConfigId) {
        if (StringUtils.isNotBlank(modelConfigId)) {
            return modelConfigService.getById(modelConfigId);
        }
        return modelConfigService.list().stream()
                .filter(mc -> Integer.valueOf(1).equals(mc.getEnabled()))
                .filter(this::isChatCompletionModel)
                .filter(mc -> StringUtils.isNotBlank(mc.getBaseUrl()))
                .findFirst()
                .orElse(null);
    }

    private boolean isChatCompletionModel(ModelConfig modelConfig) {
        if (modelConfig == null || StringUtils.isBlank(modelConfig.getModelType())) {
            return false;
        }
        return "llm".equalsIgnoreCase(modelConfig.getModelType())
                || "chat".equalsIgnoreCase(modelConfig.getModelType());
    }
}
