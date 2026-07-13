package com.ice.template.executor.node;

import cn.hutool.json.JSONUtil;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.rag.retrieval.HybridSearchService;
import com.ice.template.rag.retrieval.RetrievedChunk;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

/**
 * 向量召回节点：在知识库内按余弦相似度召回候选 chunk。
 */
@Component
public class VectorSearchNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(VectorSearchNodeExecutor.class);

    @Resource
    private HybridSearchService hybridSearchService;

    @Override
    public boolean supports(String nodeType) {
        return "VectorSearch".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String kbId = FlowNodeDataUtils.getTemplateString(node, "kb_id");
        String query = StringUtils.defaultIfBlank((String) context.getVariable("semanticQuery"),
                StringUtils.defaultIfBlank(context.getCurrentText(),
                        FlowNodeDataUtils.getTemplateString(node, "query")));
        int candidateLimit = FlowNodeDataUtils.getTemplateInteger(node, "candidate_limit", 50);

        log.info("[VectorSearch] kbId={}, query={}, candidateLimit={}", kbId, query, candidateLimit);
        if (StringUtils.isBlank(kbId)) {
            throw new IllegalArgumentException("知识库ID不能为空");
        }
        if (StringUtils.isBlank(query)) {
            throw new IllegalArgumentException("检索提问不能为空");
        }

        List<RetrievedChunk> chunks = hybridSearchService.recall(kbId, query, candidateLimit);
        String chunksJson = JSONUtil.toJsonStr(chunks);
        context.setVariable("retrievedChunks", chunksJson);

        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(chunksJson);
        result.getOutput().put("chunks", chunksJson);
        result.getOutput().put("chunkCount", chunks.size());

        log.info("[VectorSearch] 召回完成，共{}个候选", chunks.size());
        return result;
    }
}
