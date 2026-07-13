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
import com.ice.template.model.entity.KnowledgeEvent;
import com.ice.template.rag.Vectorizer;
import com.ice.template.service.KnowledgeChunkService;
import com.ice.template.service.KnowledgeEventService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Date;

/**
 * 事件落库节点（工作流节点执行器）
 * 将提取的标准化事件 JSON 写入 knowledge_events 表，并完成向量化双写
 */
@Component
public class EventWriterNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(EventWriterNodeExecutor.class);

    @Resource
    private KnowledgeEventService knowledgeEventService;

    @Resource
    private KnowledgeChunkService knowledgeChunkService;

    @Resource
    private Vectorizer vectorizer;

    @Override
    public boolean supports(String nodeType) {
        return "EventWriter".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String embeddingModelConfigId = FlowNodeDataUtils.getTemplateString(node, "embedding_model_config_id");
        String eventsJson = (String) context.getVariable("events_json");
        if (StringUtils.isBlank(eventsJson)) {
            eventsJson = context.getCurrentText();
        }
        String kbId = (String) context.getVariable("kb_id");
        String docId = (String) context.getVariable("doc_id");

        if (StringUtils.isBlank(kbId)) {
            kbId = FlowNodeDataUtils.getTemplateString(node, "kb_id");
        }

        int savedCount = 0;
        int skippedCount = 0;

        try {
            JSONObject result = JSONUtil.parseObj(eventsJson);
            JSONArray events = result.getJSONArray("events");

            if (events != null && !events.isEmpty()) {
                for (int i = 0; i < events.size(); i++) {
                    try {
                        JSONObject evt = events.getJSONObject(i);

                        // 校验 action（必填）
                        String action = evt.getStr("action", "");
                        if (StringUtils.isBlank(action)) {
                            log.warn("[EventWriter] 事件{}缺少action，跳过", i);
                            skippedCount++;
                            continue;
                        }

                        // 校验 time_anchor（模糊时间标准化）
                        JSONObject timeAnchor = evt.getJSONObject("time_anchor");
                        String dateStr = "1970-01-01";
                        String granularity = "year";
                        if (timeAnchor != null) {
                            dateStr = StringUtils.defaultIfBlank(timeAnchor.getStr("date"), "").trim();
                            granularity = StringUtils.defaultIfBlank(timeAnchor.getStr("granularity"), "");
                            if (StringUtils.isBlank(dateStr)) {
                                dateStr = "1970-01-01";
                                granularity = "year";
                            } else if (dateStr.matches("^\\d{4}$")) {
                                granularity = "year";
                                dateStr = dateStr + "-01-01";
                            } else if (dateStr.matches("^\\d{4}-\\d{1,2}$")) {
                                granularity = "month";
                                String[] parts = dateStr.split("-");
                                dateStr = parts[0] + "-" + String.format("%02d", Integer.parseInt(parts[1])) + "-01";
                            } else if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
                                if (!"exact".equals(granularity) && !"month".equals(granularity) && !"year".equals(granularity)) {
                                    granularity = "exact";
                                }
                            } else {
                                log.warn("[EventWriter] 日期格式异常: '{}', 使用默认值", dateStr);
                                dateStr = "1970-01-01";
                                granularity = "year";
                            }
                        }

                        // 校验 credibility
                        JSONObject credibility = evt.getJSONObject("credibility");
                        String sourceType = "news";
                        int confidenceScore = 5;
                        String verificationStatus = "unverified";
                        if (credibility != null) {
                            sourceType = StringUtils.defaultIfBlank(credibility.getStr("source_type"), "news");
                            confidenceScore = credibility.getInt("confidence_score", 5);
                            if (confidenceScore < 1) confidenceScore = 1;
                            if (confidenceScore > 10) confidenceScore = 10;
                            verificationStatus = StringUtils.defaultIfBlank(credibility.getStr("verification_status"), "unverified");
                        }

                        // 构建 KnowledgeEvent 并保存
                        KnowledgeEvent ke = new KnowledgeEvent();
                        ke.setKbId(kbId);
                        ke.setDocId(docId);
                        ke.setEventDate(java.sql.Date.valueOf(dateStr));
                        ke.setTimeGranularity(granularity);
                        ke.setSearchIndex(evt.getStr("search_index", ""));
                        ke.setEntities(safeJsonArray(evt.getStr("entities", "[]")));
                        ke.setAction(action);
                        ke.setSourceType(sourceType);
                        ke.setConfidenceScore(confidenceScore);
                        ke.setVerificationStatus(verificationStatus);
                        ke.setImpactInference(evt.getStr("impact_inference", ""));
                        ke.setSourceUrl(evt.getStr("source_url", ""));
                        ke.setCreateTime(new Date());

                        knowledgeEventService.save(ke);

                        // RAG 双写：search_index 向量化
                        try {
                            String vectorText = ke.getSearchIndex();
                            if (StringUtils.isBlank(vectorText)) {
                                vectorText = ke.getAction();
                                if (StringUtils.isNotBlank(ke.getImpactInference())) {
                                    vectorText += "，" + ke.getImpactInference();
                                }
                            }
                            if (StringUtils.isBlank(vectorText)) {
                                log.warn("[EventWriter] 事件无可用向量化文本，跳过向量化: eventId={}", ke.getId());
                            } else {
                                KnowledgeChunk chunk = new KnowledgeChunk();
                                chunk.setKbId(kbId);
                                chunk.setDocId(docId);
                                chunk.setChunkText(vectorText);
                                chunk.setContent(vectorText);
                                chunk.setRawText(vectorText);
                                chunk.setChunkIndex(0);
                                chunk.setChunkLevel("event");
                                chunk.setParentId(ke.getId());
                                chunk.setMetadata("{\"source_type\":\"event\",\"source_id\":\"" + ke.getId() + "\"}");
                                String embedding = vectorizer.vectorize(vectorText, StringUtils.isNotBlank(embeddingModelConfigId) ? embeddingModelConfigId : null);
                                if (embedding != null) {
                                    chunk.setEmbedding(embedding);
                                    log.info("[EventWriter] 事件向量化成功: eventId={}, textLen={}", ke.getId(), vectorText.length());
                                } else {
                                    log.warn("[EventWriter] 事件向量化返回null（可能无可用embedding模型）: eventId={}", ke.getId());
                                }
                                knowledgeChunkService.save(chunk);
                            }
                        } catch (Exception ex) {
                            log.warn("[EventWriter] 事件向量化失败: eventId={}, error={}", ke.getId(), ex.getMessage());
                        }

                        savedCount++;
                    } catch (Exception e) {
                        log.warn("[EventWriter] 事件{}保存失败: {}", i, e.getMessage());
                        skippedCount++;
                    }
                }
            }
        } catch (Exception e) {
            log.error("[EventWriter] 解析事件JSON失败: {}", e.getMessage());
        }

        log.info("[EventWriter] 事件落库完成: saved={}, skipped={}, kbId={}", savedCount, skippedCount, kbId);

        // 将原始 JSON 传递给下游 EntityAligner 节点（如果存在）
        context.setVariable("events_json", eventsJson);

        FlowNodeExecuteResult executeResult = FlowNodeExecuteResult.of("success");
        executeResult.getOutput().put("saved_count", savedCount);
        executeResult.getOutput().put("skipped_count", skippedCount);
        return executeResult;
    }

    private String safeJsonArray(String jsonStr) {
        if (StringUtils.isBlank(jsonStr)) return "[]";
        try {
            Object parsed = JSONUtil.parse(jsonStr);
            if (parsed instanceof JSONArray) return jsonStr;
            JSONArray arr = new JSONArray();
            arr.add(jsonStr);
            return arr.toString();
        } catch (Exception e) {
            JSONArray arr = new JSONArray();
            for (String s : jsonStr.split("[,，]")) {
                String trimmed = s.trim();
                if (StringUtils.isNotBlank(trimmed)) arr.add(trimmed);
            }
            return arr.toString();
        }
    }
}
