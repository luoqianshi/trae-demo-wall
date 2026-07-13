package com.ice.template.executor.node;

import cn.hutool.json.JSONUtil;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.rag.retrieval.HybridSearchService;
import com.ice.template.rag.retrieval.RetrievedChunk;
import com.ice.template.rag.retrieval.RewrittenQuery;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

/**
 * 元数据软加权重排节点：对候选 chunk 按三维背包元数据加权后融合排序。
 * 软过滤策略——元数据仅作加权信号，缺失不惩罚。
 */
@Component
public class MetadataFilterNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(MetadataFilterNodeExecutor.class);

    @Resource
    private HybridSearchService hybridSearchService;

    @Override
    public boolean supports(String nodeType) {
        return "MetadataFilter".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String chunksJson = StringUtils.defaultIfBlank((String) context.getVariable("retrievedChunks"),
                FlowNodeDataUtils.getTemplateString(node, "chunks"));
        String rewrittenJson = StringUtils.defaultIfBlank((String) context.getVariable("rewrittenQuery"),
                FlowNodeDataUtils.getTemplateString(node, "rewritten_query"));
        int topK = FlowNodeDataUtils.getTemplateInteger(node, "top_k", 10);

        log.info("[MetadataFilter] chunksExists={}, rewrittenExists={}, topK={}",
                StringUtils.isNotBlank(chunksJson), StringUtils.isNotBlank(rewrittenJson), topK);
        if (StringUtils.isBlank(chunksJson)) {
            throw new IllegalArgumentException("候选 Chunk 数据不能为空，请连接向量召回节点");
        }

        List<RetrievedChunk> candidates = JSONUtil.toList(chunksJson, RetrievedChunk.class);
        RewrittenQuery rq = StringUtils.isNotBlank(rewrittenJson)
                ? JSONUtil.toBean(rewrittenJson, RewrittenQuery.class)
                : new RewrittenQuery();

        List<RetrievedChunk> ranked = hybridSearchService.rerankByMetadata(candidates, rq, topK);
        String rankedJson = JSONUtil.toJsonStr(ranked);
        context.setVariable("retrievedChunks", rankedJson);

        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(rankedJson);
        result.getOutput().put("chunks", rankedJson);
        result.getOutput().put("chunkCount", ranked.size());

        log.info("[MetadataFilter] 软加权重排完成，输出{}个", ranked.size());
        return result;
    }
}
