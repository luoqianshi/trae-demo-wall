package com.ice.template.rag.retrieval;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ice.template.integration.llm.SiliconFlowEmbeddingClient;
import com.ice.template.model.entity.*;
import com.ice.template.rag.PGVectorClient;
import com.ice.template.service.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.time.LocalDate;
import java.util.*;
import java.util.Comparator;

/**
 * 混合检索服务：编排 意图重构 → 向量召回 → 元数据软加权 → 融合排序。
 * 软过滤策略：元数据（时间/置信度/领域/实体/概念）仅作为加权信号，不做硬过滤，避免召回为空。
 */
@Slf4j
@Service
public class HybridSearchService {

    /** 向量召回候选集相对于 topK 的放大倍数 */
    private static final int CANDIDATE_MULTIPLIER = 5;
    private static final int MIN_CANDIDATE = 30;

    @Resource
    private QueryRewriterService queryRewriterService;

    @Resource
    private ChunkRetrievalRepository retrievalRepository;

    @Resource
    private SiliconFlowEmbeddingClient embeddingClient;

    @Resource
    private PGVectorClient pgVectorClient;

    @Resource
    private KnowledgeBaseService knowledgeBaseService;

    @Resource
    private ModelConfigService modelConfigService;

    @Resource
    private KnowledgeChunkService knowledgeChunkService;

    // ========== Original methods (hybridSearch / vectorSearch / recall / rerankByMetadata) ==========

    /**
     * 混合检索：意图重构 + 向量召回 + 元数据软加权融合排序。
     */
    public RetrievalResponse hybridSearch(String kbId, String query, String modelConfigId) {
        long start = System.currentTimeMillis();
        RewrittenQuery rq = queryRewriterService.rewrite(query, modelConfigId);
        RetrievalResponse response = doSearch(kbId, rq, true);
        response.setElapsedMs(System.currentTimeMillis() - start);
        return response;
    }

    /**
     * 纯向量检索：不做意图重构，直接用原始提问向量召回。
     */
    public RetrievalResponse vectorSearch(String kbId, String query, int topK) {
        long start = System.currentTimeMillis();
        RewrittenQuery rq = new RewrittenQuery();
        rq.setOriginalQuery(query);
        rq.setSemanticQuery(query);
        rq.setTopK(topK > 0 ? topK : 10);
        RetrievalResponse response = doSearch(kbId, rq, false);
        response.setElapsedMs(System.currentTimeMillis() - start);
        return response;
    }

    private RetrievalResponse doSearch(String kbId, RewrittenQuery rq, boolean applyMetadataWeight) {
        RetrievalResponse response = new RetrievalResponse();
        response.setRewrittenQuery(rq);

        if (StringUtils.isBlank(kbId)) {
            return response;
        }
        String semanticQuery = StringUtils.defaultIfBlank(rq.getSemanticQuery(), rq.getOriginalQuery());
        if (StringUtils.isBlank(semanticQuery)) {
            return response;
        }

        int topK = rq.getTopK() > 0 ? rq.getTopK() : 10;
        int candidateLimit = Math.max(MIN_CANDIDATE, topK * CANDIDATE_MULTIPLIER);
        List<RetrievedChunk> candidates = recall(kbId, semanticQuery, candidateLimit);
        if (candidates.isEmpty()) {
            return response;
        }

        List<RetrievedChunk> ranked = applyMetadataWeight
                ? rerankByMetadata(candidates, rq, topK)
                : trimByVectorScore(candidates, topK);

        response.setChunks(ranked);
        response.setTotalCount(ranked.size());
        return response;
    }

    /**
     * 向量召回：生成查询向量并在指定知识库内按余弦相似度召回候选 chunk。
     */
    public List<RetrievedChunk> recall(String kbId, String semanticQuery, int candidateLimit) {
        if (StringUtils.isBlank(kbId) || StringUtils.isBlank(semanticQuery)) {
            return new ArrayList<>();
        }
        ModelConfig embeddingConfig = resolveEmbeddingConfig(kbId);
        if (embeddingConfig == null) {
            log.warn("[HybridSearch] 无可用嵌入模型，无法生成查询向量: kbId={}", kbId);
            return new ArrayList<>();
        }
        try {
            float[] queryVector = embeddingClient.embed(embeddingConfig, semanticQuery);
            String queryVectorStr = pgVectorClient.vectorToString(queryVector);
            int limit = candidateLimit > 0 ? candidateLimit : MIN_CANDIDATE;
            List<RetrievedChunk> candidates = retrievalRepository.vectorSearch(kbId, queryVectorStr, limit);
            for (RetrievedChunk chunk : candidates) {
                chunk.setScore(chunk.getVectorScore());
            }
            return candidates;
        } catch (Exception e) {
            log.error("[HybridSearch] 向量召回失败: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * 元数据软加权重排：对候选 chunk 按时间/置信度/领域/实体/概念加权后融合排序，截取 topK。
     * 软过滤策略——缺失元数据不惩罚，避免召回为空。
     */
    public List<RetrievedChunk> rerankByMetadata(List<RetrievedChunk> candidates, RewrittenQuery rq, int topK) {
        if (candidates == null || candidates.isEmpty()) {
            return new ArrayList<>();
        }
        LocalDate startDate = resolveStartDate(rq.getTimeRange());
        for (RetrievedChunk chunk : candidates) {
            chunk.setScore(chunk.getVectorScore() * metadataBoost(chunk, rq, startDate));
        }
        List<RetrievedChunk> ranked = new ArrayList<>(candidates);
        ranked.sort(Comparator.comparingDouble(RetrievedChunk::getScore).reversed());
        int limit = topK > 0 ? topK : 10;
        return ranked.size() > limit ? new ArrayList<>(ranked.subList(0, limit)) : ranked;
    }

    private List<RetrievedChunk> trimByVectorScore(List<RetrievedChunk> candidates, int topK) {
        List<RetrievedChunk> ranked = new ArrayList<>(candidates);
        ranked.sort(Comparator.comparingDouble(RetrievedChunk::getVectorScore).reversed());
        int limit = topK > 0 ? topK : 10;
        return ranked.size() > limit ? new ArrayList<>(ranked.subList(0, limit)) : ranked;
    }

    /**
     * 元数据软加权系数：基础 1.0，命中各类信号时小幅加成，缺失时不惩罚（软过滤）。
     */
    private double metadataBoost(RetrievedChunk chunk, RewrittenQuery rq, LocalDate startDate) {
        if (StringUtils.isBlank(chunk.getMetadata())) {
            return 1.0;
        }
        double boost = 1.0;
        try {
            JSONObject meta = JSONUtil.parseObj(chunk.getMetadata());
            JSONObject domainScope = meta.getJSONObject("1_Domain_Scope");
            JSONObject ontology = meta.getJSONObject("2_Ontology_Routing");
            JSONObject epistemology = meta.getJSONObject("3_Epistemology_Tag");

            if (epistemology != null) {
                double confidence = epistemology.getDouble("confidence", 0.8);
                boost += (confidence - 0.5) * 0.2;

                if (!rq.getClaimTypes().isEmpty()) {
                    String claimType = epistemology.getStr("claim_type", "");
                    if (rq.getClaimTypes().contains(claimType)) {
                        boost += 0.1;
                    }
                }

                if (startDate != null) {
                    String ts = epistemology.getStr("time_stamp", "");
                    LocalDate stamp = parseDate(ts);
                    if (stamp != null && stamp.isBefore(startDate)) {
                        boost -= 0.15;
                    }
                }
            }

            if (domainScope != null && !rq.getDomains().isEmpty()) {
                String domain = domainScope.getStr("domain", "");
                String theme = domainScope.getStr("theme", "");
                for (String d : rq.getDomains()) {
                    if (StringUtils.containsIgnoreCase(domain, d) || StringUtils.containsIgnoreCase(theme, d)) {
                        boost += 0.1;
                        break;
                    }
                }
            }

            if (ontology != null) {
                boost += matchBoost(ontology.getJSONArray("entities"), rq.getEntities(), 0.1);
                boost += matchBoost(ontology.getJSONArray("concepts"), rq.getConcepts(), 0.1);
            }
        } catch (Exception e) {
            log.debug("[HybridSearch] 元数据加权解析失败，按基础分: {}", e.getMessage());
            return 1.0;
        }
        return Math.max(0.5, boost);
    }

    private double matchBoost(JSONArray items, List<String> queryTerms, double weight) {
        if (items == null || items.isEmpty() || queryTerms == null || queryTerms.isEmpty()) {
            return 0.0;
        }
        for (Object item : items) {
            if (!(item instanceof JSONObject obj)) {
                continue;
            }
            String name = obj.getStr("name", "");
            String desc = obj.getStr("description", "");
            for (String term : queryTerms) {
                if (StringUtils.containsIgnoreCase(name, term) || StringUtils.containsIgnoreCase(desc, term)) {
                    return weight;
                }
            }
        }
        return 0.0;
    }

    private LocalDate resolveStartDate(String timeRange) {
        if (StringUtils.isBlank(timeRange) || "all".equalsIgnoreCase(timeRange)) {
            return null;
        }
        LocalDate now = LocalDate.now();
        return switch (timeRange) {
            case "last_week" -> now.minusWeeks(1);
            case "last_month" -> now.minusMonths(1);
            case "last_3_months" -> now.minusMonths(3);
            case "last_year" -> now.minusYears(1);
            default -> now.minusMonths(3);
        };
    }

    private LocalDate parseDate(String ts) {
        if (StringUtils.isBlank(ts)) {
            return null;
        }
        try {
            return LocalDate.parse(ts.trim().substring(0, Math.min(10, ts.trim().length())));
        } catch (Exception e) {
            return null;
        }
    }

    private ModelConfig resolveEmbeddingConfig(String kbId) {
        KnowledgeBase kb = knowledgeBaseService.getById(kbId);
        ModelConfig embeddingConfig = null;
        if (kb != null && StringUtils.isNotBlank(kb.getEmbeddingModelId())) {
            embeddingConfig = modelConfigService.getById(kb.getEmbeddingModelId());
        }
        if (embeddingConfig == null) {
            embeddingConfig = modelConfigService.list().stream()
                    .filter(mc -> Integer.valueOf(1).equals(mc.getEnabled())
                            && "embedding".equalsIgnoreCase(mc.getModelType())
                            && StringUtils.isNotBlank(mc.getApiKey()))
                    .findFirst()
                    .orElse(null);
        }
        return embeddingConfig;
    }
}
