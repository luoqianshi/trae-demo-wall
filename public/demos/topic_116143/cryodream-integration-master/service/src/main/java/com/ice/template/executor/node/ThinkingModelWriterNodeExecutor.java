package com.ice.template.executor.node;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.model.entity.ThinkingModel;
import com.ice.template.rag.ThinkingModelService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Date;
import java.util.UUID;

/**
 * 思维模型落库节点：把上游 FormatValidator(json_object) 输出的标准化工具 JSON 写入 thinking_model 表。
 *
 * <p>输入：</p>
 * <ul>
 *   <li>currentText：上游 FormatValidator 输出的 JSON 字符串</li>
 *   <li>raw_text：原始输入文本（可选，运行时注入）</li>
 * </ul>
 */
@Component
public class ThinkingModelWriterNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(ThinkingModelWriterNodeExecutor.class);

    @Resource
    private ThinkingModelService thinkingModelService;

    @Override
    public boolean supports(String nodeType) {
        return "ThinkingModelWriter".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String input = StringUtils.defaultIfBlank(context.getCurrentText(), "");
        if (StringUtils.isBlank(input)) {
            throw new IllegalStateException("思维模型落库节点没有收到上游输入，请检查 FormatValidator 输出");
        }

        // 解析 JSON
        JSONObject result;
        try {
            result = JSONUtil.parseObj(input);
        } catch (Exception e) {
            throw new IllegalStateException("思维模型落库节点无法解析上游 JSON: " + e.getMessage());
        }

        // 获取 rawText
        String rawText = resolve(node, context, "raw_text");

        // 构建 ThinkingModel 实体
        ThinkingModel model = new ThinkingModel();
        model.setId(UUID.randomUUID().toString());
        model.setModelId(result.getStr("model_id", "tool_unknown_001"));
        model.setModelName(result.getStr("model_name", "未命名模型"));
        model.setIsActive(result.getBool("is_active", true));
        model.setRoutingCategory(result.getStr("routing_category", "诊断与分析"));
        model.setTags(result.getJSONArray("tags") != null ? result.getJSONArray("tags").toString() : "[]");
        model.setToolSchema(result.getJSONObject("tool_schema") != null ? result.getJSONObject("tool_schema").toString() : "{}");
        model.setExecutionPrompt(result.getStr("execution_prompt", ""));
        model.setRawText(StringUtils.isNotBlank(rawText) ? rawText : input);
        model.setDescription(result.getStr("model_name", ""));
        model.setCreateTime(new Date());
        model.setUpdateTime(new Date());

        thinkingModelService.saveOrOverwrite(model);
        log.info("[ThinkingModelWriter] 思维模型入库成功: modelId={}, name={}, category={}",
                model.getModelId(), model.getModelName(), model.getRoutingCategory());

        context.setVariable("thinkingModelId", model.getId());
        context.setVariable("thinkingModelName", model.getModelName());

        FlowNodeExecuteResult executeResult = FlowNodeExecuteResult.of(model.getId());
        executeResult.getOutput().put("thinkingModelId", model.getId());
        executeResult.getOutput().put("thinkingModelName", model.getModelName());
        executeResult.getOutput().put("modelId", model.getModelId());
        return executeResult;
    }

    private String resolve(FlowNodeDTO node, FlowExecutionContext context, String key) {
        String value = FlowNodeDataUtils.getTemplateString(node, key);
        if (StringUtils.isNotBlank(value)) {
            return value;
        }
        Object var = context.getVariable(key);
        return var == null ? "" : String.valueOf(var);
    }
}
