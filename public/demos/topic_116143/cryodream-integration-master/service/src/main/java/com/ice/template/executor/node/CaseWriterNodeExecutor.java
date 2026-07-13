package com.ice.template.executor.node;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.model.entity.KnowledgeCase;
import com.ice.template.model.entity.KnowledgeChunk;
import com.ice.template.rag.Vectorizer;
import com.ice.template.service.KnowledgeCaseService;
import com.ice.template.service.KnowledgeChunkService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Date;

/**
 * 案例落库节点（工作流节点执行器）
 * 将提取的标准化案例 JSON 写入 knowledge_cases 表，并完成向量化双写
 * 关键设计：向量化使用 search_index + problem + solution + outcome 全部入库
 */
@Component
public class CaseWriterNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(CaseWriterNodeExecutor.class);

    @Resource
    private KnowledgeCaseService knowledgeCaseService;

    @Resource
    private KnowledgeChunkService knowledgeChunkService;

    @Resource
    private Vectorizer vectorizer;

    @Override
    public boolean supports(String nodeType) {
        return "CaseWriter".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String embeddingModelConfigId = FlowNodeDataUtils.getTemplateString(node, "embedding_model_config_id");
        String casesJson = (String) context.getVariable("cases_json");
        if (StringUtils.isBlank(casesJson)) {
            casesJson = context.getCurrentText();
        }
        String kbId = (String) context.getVariable("kb_id");
        String docId = (String) context.getVariable("doc_id");

        if (StringUtils.isBlank(kbId)) {
            kbId = FlowNodeDataUtils.getTemplateString(node, "kb_id");
        }

        int savedCount = 0;
        int skippedCount = 0;

        try {
            JSONObject result = JSONUtil.parseObj(casesJson);
            JSONArray cases = result.getJSONArray("cases");

            if (cases != null && !cases.isEmpty()) {
                for (int i = 0; i < cases.size(); i++) {
                    try {
                        JSONObject cs = cases.getJSONObject(i);

                        // 校验 title（必填）
                        String title = cs.getStr("title", "");
                        if (StringUtils.isBlank(title)) {
                            log.warn("[CaseWriter] 案例{}缺少title，跳过", i);
                            skippedCount++;
                            continue;
                        }

                        // 校验 context（必填）
                        JSONObject contextObj = cs.getJSONObject("context");
                        if (contextObj == null || contextObj.isEmpty()) {
                            log.warn("[CaseWriter] 案例{}缺少context，跳过", i);
                            skippedCount++;
                            continue;
                        }

                        // 构建 KnowledgeCase 并保存
                        KnowledgeCase kc = new KnowledgeCase();
                        kc.setKbId(kbId);
                        kc.setSourceDocId(docId);
                        kc.setCaseData(cs.toString());
                        kc.setSearchIndex(cs.getStr("search_index", ""));
                        kc.setCreateTime(new Date());

                        knowledgeCaseService.save(kc);

                        // RAG 双写：向量化 search_index + problem + solution + outcome
                        try {
                            String vectorText = buildVectorText(cs);
                            if (StringUtils.isNotBlank(vectorText)) {
                                KnowledgeChunk chunk = new KnowledgeChunk();
                                chunk.setKbId(kbId);
                                chunk.setDocId(docId);
                                chunk.setChunkText(vectorText);
                                chunk.setContent(vectorText);
                                chunk.setRawText(vectorText);
                                chunk.setChunkIndex(0);
                                chunk.setChunkLevel("case");
                                chunk.setParentId(kc.getId());
                                // 注入 context 标签到 metadata，用于混合检索
                                String metadata = buildCaseMetadata(kc.getId(), contextObj);
                                chunk.setMetadata(metadata);
                                String embedding = vectorizer.vectorize(vectorText, StringUtils.isNotBlank(embeddingModelConfigId) ? embeddingModelConfigId : null);
                                if (embedding != null) {
                                    chunk.setEmbedding(embedding);
                                }
                                knowledgeChunkService.save(chunk);
                                log.debug("[CaseWriter] 案例向量化成功: {}", kc.getId());
                            }
                        } catch (Exception ex) {
                            log.warn("[CaseWriter] 案例向量化失败: {}", ex.getMessage());
                        }

                        // 实体对齐由下游 EntityAligner 节点接管，此处不再硬编码

                        savedCount++;
                    } catch (Exception e) {
                        log.warn("[CaseWriter] 案例{}保存失败: {}", i, e.getMessage());
                        skippedCount++;
                    }
                }
            }
        } catch (Exception e) {
            log.error("[CaseWriter] 解析案例JSON失败: {}", e.getMessage());
        }

        log.info("[CaseWriter] 案例落库完成: saved={}, skipped={}, kbId={}", savedCount, skippedCount, kbId);

        // 将原始 JSON 传递给下游 EntityAligner 节点
        context.setVariable("cases_json", casesJson);

        FlowNodeExecuteResult executeResult = FlowNodeExecuteResult.of("success");
        executeResult.getOutput().put("saved_count", savedCount);
        executeResult.getOutput().put("skipped_count", skippedCount);
        return executeResult;
    }

    /**
     * 构建向量化文本：search_index + problem + solution + outcome 全部入库
     */
    private String buildVectorText(JSONObject cs) {
        StringBuilder sb = new StringBuilder();

        // search_index
        String searchIndex = cs.getStr("search_index", "");
        if (StringUtils.isNotBlank(searchIndex)) {
            sb.append(searchIndex);
        }

        // problem
        JSONObject problem = cs.getJSONObject("problem");
        if (problem != null) {
            String symptom = problem.getStr("symptom_summary", "");
            if (StringUtils.isNotBlank(symptom)) {
                if (sb.length() > 0) sb.append("，");
                sb.append(symptom);
            }
            JSONArray rootCauses = problem.getJSONArray("root_causes");
            if (rootCauses != null && !rootCauses.isEmpty()) {
                if (sb.length() > 0) sb.append("，");
                sb.append("根因：");
                for (int i = 0; i < rootCauses.size(); i++) {
                    if (i > 0) sb.append("、");
                    sb.append(rootCauses.getStr(i));
                }
            }
        }

        // solution
        JSONObject solution = cs.getJSONObject("solution");
        if (solution != null) {
            JSONArray strategyTypes = solution.getJSONArray("strategy_type");
            if (strategyTypes != null && !strategyTypes.isEmpty()) {
                if (sb.length() > 0) sb.append("，");
                sb.append("策略：");
                for (int i = 0; i < strategyTypes.size(); i++) {
                    if (i > 0) sb.append("、");
                    sb.append(strategyTypes.getStr(i));
                }
            }
            JSONArray executionSteps = solution.getJSONArray("execution_steps");
            if (executionSteps != null && !executionSteps.isEmpty()) {
                if (sb.length() > 0) sb.append("，");
                sb.append("执行步骤：");
                for (int i = 0; i < executionSteps.size(); i++) {
                    if (i > 0) sb.append("、");
                    sb.append(executionSteps.getStr(i));
                }
            }
        }

        // outcome
        JSONObject outcome = cs.getJSONObject("outcome");
        if (outcome != null) {
            String resultSummary = outcome.getStr("result_summary", "");
            if (StringUtils.isNotBlank(resultSummary)) {
                if (sb.length() > 0) sb.append("，");
                sb.append("结果：").append(resultSummary);
            }
            JSONArray successFactors = outcome.getJSONArray("key_success_factors");
            if (successFactors != null && !successFactors.isEmpty()) {
                if (sb.length() > 0) sb.append("，");
                sb.append("关键成功因素：");
                for (int i = 0; i < successFactors.size(); i++) {
                    if (i > 0) sb.append("、");
                    sb.append(successFactors.getStr(i));
                }
            }
        }

        return sb.toString();
    }

    /**
     * 构建案例 chunk 的 metadata，注入 context 标签用于混合检索过滤
     */
    private String buildCaseMetadata(String caseId, JSONObject contextObj) {
        JSONObject meta = new JSONObject();
        meta.set("source_type", "case");
        meta.set("source_id", caseId);
        // 注入 context 标签到 metadata
        if (contextObj != null) {
            for (String key : contextObj.keySet()) {
                meta.set("ctx_" + key, contextObj.get(key));
            }
        }
        return meta.toString();
    }
}
