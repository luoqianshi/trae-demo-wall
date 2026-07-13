package com.ice.template.rag.retrieval;

import java.util.ArrayList;
import java.util.List;

/**
 * 检索结果响应
 */
public class RetrievalResponse {

    private List<RetrievedChunk> chunks = new ArrayList<>();
    private int totalCount;
    private RewrittenQuery rewrittenQuery;
    private long elapsedMs;

    public List<RetrievedChunk> getChunks() {
        return chunks;
    }

    public void setChunks(List<RetrievedChunk> chunks) {
        this.chunks = chunks;
    }

    public int getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(int totalCount) {
        this.totalCount = totalCount;
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
