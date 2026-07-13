package com.ice.template.rag.retrieval;

import java.util.ArrayList;
import java.util.List;

/**
 * 意图重构后的标准查询结构
 */
public class RewrittenQuery {

    /** 时间窗口标识，如 last_3_months / last_year / all */
    private String timeRange = "last_3_months";

    /** 领域过滤 */
    private List<String> domains = new ArrayList<>();

    /** 实体过滤 */
    private List<String> entities = new ArrayList<>();

    /** 概念过滤 */
    private List<String> concepts = new ArrayList<>();

    /** 断言类型过滤，如 事实陈述 / 观点预测 */
    private List<String> claimTypes = new ArrayList<>();

    /** 最低置信度阈值 */
    private double minConfidence = 0.0;

    /** 返回数量 */
    private int topK = 10;

    /** 原始提问 */
    private String originalQuery;

    /** 用于向量召回的语义文本（重写后的检索意图，默认等于 originalQuery） */
    private String semanticQuery;

    public String getTimeRange() {
        return timeRange;
    }

    public void setTimeRange(String timeRange) {
        this.timeRange = timeRange;
    }

    public List<String> getDomains() {
        return domains;
    }

    public void setDomains(List<String> domains) {
        this.domains = domains;
    }

    public List<String> getEntities() {
        return entities;
    }

    public void setEntities(List<String> entities) {
        this.entities = entities;
    }

    public List<String> getConcepts() {
        return concepts;
    }

    public void setConcepts(List<String> concepts) {
        this.concepts = concepts;
    }

    public List<String> getClaimTypes() {
        return claimTypes;
    }

    public void setClaimTypes(List<String> claimTypes) {
        this.claimTypes = claimTypes;
    }

    public double getMinConfidence() {
        return minConfidence;
    }

    public void setMinConfidence(double minConfidence) {
        this.minConfidence = minConfidence;
    }

    public int getTopK() {
        return topK;
    }

    public void setTopK(int topK) {
        this.topK = topK;
    }

    public String getOriginalQuery() {
        return originalQuery;
    }

    public void setOriginalQuery(String originalQuery) {
        this.originalQuery = originalQuery;
    }

    public String getSemanticQuery() {
        return semanticQuery;
    }

    public void setSemanticQuery(String semanticQuery) {
        this.semanticQuery = semanticQuery;
    }
}
