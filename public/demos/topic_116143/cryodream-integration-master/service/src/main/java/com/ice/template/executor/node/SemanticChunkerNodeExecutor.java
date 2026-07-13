package com.ice.template.executor.node;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.rag.SemanticChunker;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

@Component
public class SemanticChunkerNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(SemanticChunkerNodeExecutor.class);

    @Resource
    private SemanticChunker semanticChunker;

    @Override
    public boolean supports(String nodeType) {
        return "SemanticChunker".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String input = StringUtils.defaultIfBlank(context.getCurrentText(), FlowNodeDataUtils.getTemplateString(node, "input"));
        String metadataStr = (String) context.getVariable("globalMetadata");
        int chunkSize = FlowNodeDataUtils.getTemplateInteger(node, "chunk_size", 500);
        int overlapSize = FlowNodeDataUtils.getTemplateInteger(node, "overlap_size", 50);
        
        log.info("[SemanticChunker] inputLength={}, chunkSize={}, overlapSize={}", 
                input != null ? input.length() : 0, chunkSize, overlapSize);

        if (StringUtils.isBlank(input)) {
            throw new IllegalArgumentException("输入文本不能为空");
        }

        JSONObject globalMetadata = null;
        if (StringUtils.isNotBlank(metadataStr)) {
            try {
                globalMetadata = JSONUtil.parseObj(metadataStr);
            } catch (Exception e) {
                log.warn("[SemanticChunker] 解析元数据失败，将使用默认元数据: {}", e.getMessage());
            }
        }

        List<SemanticChunker.ChunkInfo> chunks = semanticChunker.chunk(input, globalMetadata, chunkSize, overlapSize);
        
        JSONArray chunksArray = new JSONArray();
        for (SemanticChunker.ChunkInfo chunk : chunks) {
            JSONObject chunkObj = new JSONObject();
            chunkObj.set("index", chunk.getChunkIndex());
            chunkObj.set("text", chunk.getChunkText());
            chunkObj.set("rawText", chunk.getRawText());
            chunkObj.set("metadata", chunk.getMetadata());
            chunksArray.add(chunkObj);
        }

        String chunksJson = chunksArray.toString();
        context.setVariable("chunks", chunksJson);
        
        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(chunksJson);
        result.getOutput().put("chunks", chunksJson);
        result.getOutput().put("chunkCount", chunks.size());
        
        log.info("[SemanticChunker] 分块完成，共{}个Chunk", chunks.size());
        return result;
    }
}
