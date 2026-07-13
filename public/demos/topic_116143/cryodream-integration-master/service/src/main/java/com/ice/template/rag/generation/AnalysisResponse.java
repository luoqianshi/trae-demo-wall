package com.ice.template.rag.generation;

import com.ice.template.rag.retrieval.RewrittenQuery;

import java.util.ArrayList;
import java.util.List;

/**
 * 研判生成响应
 */
public class AnalysisResponse {

    /** 用户原始提问 */
    private String query;

    /** 研判简报（Markdown，含 5 区块） */
    private String report;

    /** 溯源锚点列表 */
    private List<Citation> citations = new ArrayList<>();

    /** 召回 Chunk 数量 */
    private int retrievedCount;

    /** 意图重构结果 */
    private RewrittenQuery rewrittenQuery;

    /** 总耗时 */
    private long elapsedMs;

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getReport() {
        return report;
    }

    public void setReport(String report) {
        this.report = report;
    }

    public List<Citation> getCitations() {
        return citations;
    }

    public void setCitations(List<Citation> citations) {
        this.citations = citations;
    }

    public int getRetrievedCount() {
        return retrievedCount;
    }

    public void setRetrievedCount(int retrievedCount) {
        this.retrievedCount = retrievedCount;
    }

    public RewrittenQuery getRewrittenQuery() {
        return rewrittenQuery;
    }

    public void setRewrittenQuery(RewrittenQuery rewrittenQuery) {
        this.rewrittenQuery = rewrittenQuery;
    }

    public long getElapsedMs() {
        return elapsedMs;
    }

    public void setElapsedMs(long elapsedMs) {
        this.elapsedMs = elapsedMs;
    }
}
