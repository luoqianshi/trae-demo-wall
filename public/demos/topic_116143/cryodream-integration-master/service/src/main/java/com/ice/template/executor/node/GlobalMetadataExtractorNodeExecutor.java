package com.ice.template.executor.node;

import cn.hutool.json.JSONObject;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.rag.GlobalMetadataExtractor;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Map;

@Component
public class GlobalMetadataExtractorNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(GlobalMetadataExtractorNodeExecutor.class);

    @Resource
    private GlobalMetadataExtractor metadataExtractor;

    @Override
    public boolean supports(String nodeType) {
        return "GlobalMetadataExtractor".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String input = StringUtils.defaultIfBlank(context.getCurrentText(), FlowNodeDataUtils.getTemplateString(node, "input"));
        String modelConfigId = FlowNodeDataUtils.getTemplateString(node, "model_config_id");

        // 调试日志：打印节点完整数据结构，排查 model_config_id 提取问题
        log.info("[GlobalMetadataExtractor] 节点数据调试：nodeId={}, dataType={}, dataKeys={}",
                node.getId(),
                node.getData() == null ? null : node.getData().get("type"),
                node.getData() == null ? "null" : node.getData().keySet());
        log.info("[GlobalMetadataExtractor] 提取结果：inputLength={}, modelConfigId=[{}], isBlank={}",
                input == null ? 0 : input.length(),
                modelConfigId,
                StringUtils.isBlank(modelConfigId));
        // 打印 node.node.template.model_config_id 的原始结构（如果存在）
        Object nodeTemplate = node.getData() == null ? null : node.getData().get("node");
        if (nodeTemplate instanceof Map) {
            Object template = ((Map<?, ?>) nodeTemplate).get("template");
            if (template instanceof Map) {
                Object modelConfigField = ((Map<?, ?>) template).get("model_config_id");
                log.info("[GlobalMetadataExtractor] node.template.model_config_id 原始结构：{}", modelConfigField);
            }
        }

        if (StringUtils.isBlank(input)) {
            throw new IllegalArgumentException("输入文本不能为空");
        }
        if (StringUtils.isBlank(modelConfigId)) {
            throw new IllegalArgumentException("模型配置 ID 为空，请在节点属性面板选择模型配置");
        }

        JSONObject globalMetadata = metadataExtractor.extract(input, modelConfigId);
        JSONObject metadata3d = metadataExtractor.build3DMetadata(globalMetadata);

        String metadataJson = metadata3d.toString();
        context.setVariable("globalMetadata", metadataJson);
        
        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(metadataJson);
        result.getOutput().put("metadata", metadataJson);
        result.getOutput().put("domain", globalMetadata.getStr("domain"));
        result.getOutput().put("theme", globalMetadata.getStr("theme"));
        
        log.info("[GlobalMetadataExtractor] 元数据提取完成: domain={}, theme={}", 
                globalMetadata.getStr("domain"), globalMetadata.getStr("theme"));
        return result;
    }
}
