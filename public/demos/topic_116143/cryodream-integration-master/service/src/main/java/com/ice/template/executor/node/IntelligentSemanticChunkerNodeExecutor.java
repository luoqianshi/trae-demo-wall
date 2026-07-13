package com.ice.template.executor.node;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.rag.IntelligentSemanticChunker;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

@Component
public class IntelligentSemanticChunkerNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(IntelligentSemanticChunkerNodeExecutor.class);

    @Resource
    private IntelligentSemanticChunker intelligentChunker;

    @Override
    public boolean supports(String nodeType) {
        return "IntelligentSemanticChunker".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String input = StringUtils.defaultIfBlank(context.getCurrentText(), FlowNodeDataUtils.getTemplateString(node, "input"));
        String modelConfigId = FlowNodeDataUtils.getTemplateString(node, "model_config_id");
        String metadataStr = FlowNodeDataUtils.getTemplateString(node, "metadata");
        if (StringUtils.isBlank(metadataStr)) {
            metadataStr = (String) context.getVariable("globalMetadata");
        }
        
        log.info("[IntelligentSemanticChunker] inputLength={}, modelConfigId={}", 
                input != null ? input.length() : 0, modelConfigId);

        if (StringUtils.isBlank(input)) {
            throw new IllegalArgumentException("输入文本不能为空");
        }

        JSONObject globalMetadata = null;
        if (StringUtils.isNotBlank(metadataStr)) {
            try {
                globalMetadata = JSONUtil.parseObj(metadataStr);
            } catch (Exception e) {
                log.warn("[IntelligentSemanticChunker] 解析元数据失败，将使用空元数据: {}", e.getMessage());
            }
        }

        List<IntelligentSemanticChunker.ChunkInfo> chunks = intelligentChunker.chunk(input, globalMetadata, modelConfigId);
        
        JSONArray chunksArray = new JSONArray();
        for (IntelligentSemanticChunker.ChunkInfo chunk : chunks) {
            JSONObject chunkObj = new JSONObject();
            chunkObj.set("index", chunk.getChunkIndex());
            chunkObj.set("text", chunk.getChunkText());
            chunkObj.set("rawText", chunk.getRawText());
            chunkObj.set("semanticBoundary", chunk.getSemanticBoundary());
            chunkObj.set("metadata", chunk.getMetadata());
            chunkObj.set("chunkLevel", chunk.getChunkLevel());
            chunkObj.set("parentLocalId", chunk.getParentLocalId());
            chunkObj.set("events", chunk.getEvents());
            chunksArray.add(chunkObj);
        }

        String chunksJson = chunksArray.toString();
        context.setVariable("chunks", chunksJson);
        
        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(chunksJson);
        result.getOutput().put("chunks", chunksJson);
        result.getOutput().put("chunkCount", chunks.size());
        
        log.info("[IntelligentSemanticChunker] 智能分块完成，共{}个Chunk", chunks.size());
        return result;
    }
}
