package com.ice.template.executor.node;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.model.entity.KnowledgeChunk;
import com.ice.template.model.entity.KnowledgeOpinion;
import com.ice.template.rag.Vectorizer;
import com.ice.template.service.KnowledgeChunkService;
import com.ice.template.service.KnowledgeOpinionService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Date;

/**
 * 观点落库节点（工作流节点执行器）
 * 将提取的标准化观点 JSON 写入 knowledge_opinions 表，并完成向量化双写
 * 设计理念：实体关系驱动 —— 观点是"主体实体 → 看法 → 客体实体"的关系
 * 向量化策略：search_index + core_thesis + supporting_logic 全量入库
 */
@Component
public class OpinionWriterNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(OpinionWriterNodeExecutor.class);

    @Resource
    private KnowledgeOpinionService knowledgeOpinionService;

    @Resource
    private KnowledgeChunkService knowledgeChunkService;

    @Resource
    private Vectorizer vectorizer;

    @Override
    public boolean supports(String nodeType) {
        return "OpinionWriter".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String embeddingModelConfigId = FlowNodeDataUtils.getTemplateString(node, "embedding_model_config_id");
        String opinionsJson = (String) context.getVariable("opinions_json");
        if (StringUtils.isBlank(opinionsJson)) {
            opinionsJson = context.getCurrentText();
        }
        String kbId = (String) context.getVariable("kb_id");
        String docId = (String) context.getVariable("doc_id");

        if (StringUtils.isBlank(kbId)) {
            kbId = FlowNodeDataUtils.getTemplateString(node, "kb_id");
        }

        int savedCount = 0;
        int skippedCount = 0;

        try {
            JSONObject result = JSONUtil.parseObj(opinionsJson);
            JSONArray opinions = result.getJSONArray("opinions");

            if (opinions != null && !opinions.isEmpty()) {
                for (int i = 0; i < opinions.size(); i++) {
                    try {
                        JSONObject opn = opinions.getJSONObject(i);

                        // 校验 core_thesis（必填）
                        String coreThesis = opn.getStr("core_thesis", "");
                        if (StringUtils.isBlank(coreThesis)) {
                            log.warn("[OpinionWriter] 观点{}缺少core_thesis，跳过", i);
                            skippedCount++;
                            continue;
                        }

                        // 校验 relations（必填）
                        JSONObject relations = opn.getJSONObject("relations");
                        if (relations == null || relations.isEmpty()) {
                            log.warn("[OpinionWriter] 观点{}缺少relations，跳过", i);
                            skippedCount++;
                            continue;
                        }

                        // 构建 KnowledgeOpinion 并保存
                        KnowledgeOpinion ko = new KnowledgeOpinion();
                        ko.setKbId(kbId);
                        ko.setDocId(docId);
                        ko.setRelations(relations.toString());
                        JSONObject ctxObj = opn.getJSONObject("context");
                        ko.setContext(ctxObj != null ? ctxObj.toString() : "{}");
                        ko.setCoreThesis(coreThesis);
                        JSONArray logicArr = opn.getJSONArray("supporting_logic");
                        ko.setSupportingLogic(logicArr != null ? logicArr.toString() : "[]");
                        JSONObject credObj = opn.getJSONObject("credibility");
                        ko.setCredibility(credObj != null ? credObj.toString() : "{}");
                        ko.setSearchIndex(opn.getStr("search_index", ""));
                        ko.setCreateTime(new Date());

                        knowledgeOpinionService.save(ko);

                        // RAG 双写：向量化 search_index + core_thesis + supporting_logic
                        try {
                            String vectorText = buildVectorText(opn);
                            if (StringUtils.isNotBlank(vectorText)) {
                                KnowledgeChunk chunk = new KnowledgeChunk();
                                chunk.setKbId(kbId);
                                chunk.setDocId(docId);
                                chunk.setChunkText(vectorText);
                                chunk.setContent(vectorText);
                                chunk.setRawText(vectorText);
                                chunk.setChunkIndex(0);
                                chunk.setChunkLevel("opinion");
                                chunk.setParentId(ko.getId());
                                // 注入 context 标签到 metadata，用于混合检索
                                String metadata = buildOpinionMetadata(ko.getId(), relations, ctxObj);
                                chunk.setMetadata(metadata);
                                String embedding = vectorizer.vectorize(vectorText, StringUtils.isNotBlank(embeddingModelConfigId) ? embeddingModelConfigId : null);
                                if (embedding != null) {
                                    chunk.setEmbedding(embedding);
                                }
                                knowledgeChunkService.save(chunk);
                                log.debug("[OpinionWriter] 观点向量化成功: {}", ko.getId());
                            }
                        } catch (Exception ex) {
                            log.warn("[OpinionWriter] 观点向量化失败: {}", ex.getMessage());
                        }

                        // 实体对齐由下游 EntityAligner 节点接管

                        savedCount++;
                    } catch (Exception e) {
                        log.warn("[OpinionWriter] 观点{}保存失败: {}", i, e.getMessage());
                        skippedCount++;
                    }
                }
            }

            // 将原始 JSON 传递给下游 EntityAligner 节点
            context.setVariable("opinions_json", opinionsJson);

            JSONObject output = new JSONObject();
            output.set("saved", savedCount);
            output.set("skipped", skippedCount);
            output.set("total", savedCount + skippedCount);

            FlowNodeExecuteResult executeResult = FlowNodeExecuteResult.of(output.toString());
            executeResult.getOutput().put("saved_count", savedCount);
            executeResult.getOutput().put("skipped_count", skippedCount);
            return executeResult;
        } catch (Exception e) {
            log.error("[OpinionWriter] 观点入库失败", e);
            FlowNodeExecuteResult failResult = FlowNodeExecuteResult.of("观点入库失败: " + e.getMessage());
            failResult.getOutput().put("error", e.getMessage());
            return failResult;
        }
    }

    /** 构建向量化文本：search_index + core_thesis + supporting_logic */
    private String buildVectorText(JSONObject opn) {
        StringBuilder sb = new StringBuilder();
        String searchIndex = opn.getStr("search_index", "");
        if (StringUtils.isNotBlank(searchIndex)) sb.append(searchIndex).append(" ");
        String coreThesis = opn.getStr("core_thesis", "");
        if (StringUtils.isNotBlank(coreThesis)) sb.append(coreThesis).append(" ");
        JSONArray logic = opn.getJSONArray("supporting_logic");
        if (logic != null) {
            for (int i = 0; i < logic.size(); i++) {
                String l = logic.getStr(i);
                if (StringUtils.isNotBlank(l)) sb.append(l).append(" ");
            }
        }
        return sb.toString().trim();
    }

    /** 构建 metadata：opinion_id + source_entity + interest_alignment + stance */
    private String buildOpinionMetadata(String opinionId, JSONObject relations, JSONObject context) {
        JSONObject meta = new JSONObject();
        meta.set("opinion_id", opinionId);
        meta.set("chunk_level", "opinion");
        if (relations != null) {
            meta.set("source_entity", relations.getStr("source_entity"));
            meta.set("interest_alignment", relations.getStr("interest_alignment"));
        }
        if (context != null) {
            meta.set("stance", context.getJSONArray("stance"));
            meta.set("applicable_stage", context.getJSONArray("applicable_stage"));
        }
        return meta.toString();
    }
}
