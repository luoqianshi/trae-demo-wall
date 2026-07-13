package com.ice.template.executor.node;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.rag.retrieval.HybridSearchService;
import com.ice.template.rag.retrieval.RetrievalResponse;
import com.ice.template.rag.retrieval.RetrievedChunk;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

/**
 * 一体化混合检索节点：意图重构 + 向量召回 + 元数据软加权融合排序。
 * 输出 RAG 提示词（参考资料 + 原始问题）供下游 LLM 总结，并提供可读的调试信息。
 */
@Component
public class HybridRetrieverNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(HybridRetrieverNodeExecutor.class);

    @Resource
    private HybridSearchService hybridSearchService;

    @Override
    public boolean supports(String nodeType) {
        return "HybridRetriever".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String kbId = FlowNodeDataUtils.getTemplateString(node, "kb_id");
        String query = StringUtils.defaultIfBlank(context.getCurrentText(),
                FlowNodeDataUtils.getTemplateString(node, "query"));
        if (StringUtils.isBlank(query)) {
            query = context.getInputValue();
        }
        String modelConfigId = FlowNodeDataUtils.getTemplateString(node, "model_config_id");

        log.info("[HybridRetriever] kbId={}, query={}, modelConfigId={}", kbId, query, modelConfigId);
        if (StringUtils.isBlank(kbId)) {
            throw new IllegalArgumentException("知识库ID不能为空");
        }
        if (StringUtils.isBlank(query)) {
            throw new IllegalArgumentException("检索提问不能为空");
        }

        RetrievalResponse response = hybridSearchService.hybridSearch(kbId, query, modelConfigId);
        List<RetrievedChunk> chunks = response.getChunks();

        StringBuilder referenceBuilder = new StringBuilder();
        JSONArray debugChunks = new JSONArray();
        for (int i = 0; i < chunks.size(); i++) {
            RetrievedChunk c = chunks.get(i);
            String text = StringUtils.defaultIfBlank(c.getRawText(), c.getChunkText());
            referenceBuilder.append("【资料").append(i + 1).append("】")
                    .append(StringUtils.isNotBlank(c.getDocTitle()) ? "（来源：" + c.getDocTitle() + "）" : "")
                    .append("\n").append(text).append("\n\n");

            JSONObject dbg = new JSONObject(true);
            dbg.set("序号", i + 1);
            dbg.set("综合分", round(c.getScore()));
            dbg.set("向量相似度", round(c.getVectorScore()));
            dbg.set("来源文档", StringUtils.defaultIfBlank(c.getDocTitle(), "未知"));
            dbg.set("片段序号", c.getChunkIndex());
            dbg.set("文本预览", preview(text));
            debugChunks.add(dbg);
        }

        String references = referenceBuilder.toString().trim();
        String ragPrompt = buildRagPrompt(query, references);

        context.setVariable("retrievedChunks", JSONUtil.toJsonStr(chunks));
        context.setVariable("retrievalContext", references);
        context.setVariable("originalQuery", query);
        context.setCurrentText(ragPrompt);

        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(ragPrompt);
        result.getInput().put("query", query);
        result.getInput().put("kbId", kbId);
        result.getOutput().put("召回数量", response.getTotalCount());
        result.getOutput().put("耗时ms", response.getElapsedMs());
        result.getOutput().put("意图重构", response.getRewrittenQuery());
        result.getOutput().put("召回明细", debugChunks);
        result.getOutput().put("references", references);
        result.getOutput().put("ragPrompt", ragPrompt);
        result.getOutput().put("context", ragPrompt);

        log.info("[HybridRetriever] 混合检索完成，召回{}条，耗时{}ms", response.getTotalCount(), response.getElapsedMs());
        return result;
    }

    private String buildRagPrompt(String query, String references) {
        if (StringUtils.isBlank(references)) {
            return "知识库中未检索到与问题相关的资料。\n\n用户问题：" + query
                    + "\n\n请如实告知未找到相关资料，不要编造。";
        }
        return "请严格根据以下参考资料回答用户问题。要求：\n"
                + "1. 只依据参考资料作答，不要编造资料中没有的信息；\n"
                + "2. 如果资料不足以回答，请明确说明；\n"
                + "3. 回答要条理清晰、准确简洁。\n\n"
                + "===== 参考资料 =====\n" + references + "\n"
                + "===== 用户问题 =====\n" + query + "\n\n请给出你的回答：";
    }

    private double round(double v) {
        return Math.round(v * 10000.0) / 10000.0;
    }

    private String preview(String text) {
        if (StringUtils.isBlank(text)) {
            return "";
        }
        String oneLine = text.replaceAll("\\s+", " ").trim();
        return oneLine.length() > 80 ? oneLine.substring(0, 80) + "..." : oneLine;
    }
}
