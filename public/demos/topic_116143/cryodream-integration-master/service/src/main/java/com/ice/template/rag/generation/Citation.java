package com.ice.template.rag.generation;

/**
 * 溯源锚点：研判简报中每个引用对应的真实 Chunk 元数据
 */
public class Citation {

    /** 引用编号，对应简报中的 [引用: 资料N] */
    private int index;

    /** 真实 Chunk ID，供跳转 Chunk 详情 */
    private String chunkId;

    private String docId;

    /** 来源文档标题 */
    private String docTitle;

    /** 来源（前员工爆料 / 朋友圈 / document 等） */
    private String source;

    /** 置信度 0~1 */
    private double confidence;

    /** 断言类型：事实陈述 / 观点预测 */
    private String claimType;

    /** 时间戳 */
    private String timeStamp;

    /** 原文片段预览 */
    private String snippet;

    /** 向量相似度 */
    private double vectorScore;

    /** 综合分 */
    private double score;

    public int getIndex() {
        return index;
    }

    public void setIndex(int index) {
        this.index = index;
    }

    public String getChunkId() {
        return chunkId;
    }

    public void setChunkId(String chunkId) {
        this.chunkId = chunkId;
    }

    public String getDocId() {
        return docId;
    }

    public void setDocId(String docId) {
        this.docId = docId;
    }

    public String getDocTitle() {
        return docTitle;
    }

    public void setDocTitle(String docTitle) {
        this.docTitle = docTitle;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }

    public String getClaimType() {
        return claimType;
    }

    public void setClaimType(String claimType) {
        this.claimType = claimType;
    }

    public String getTimeStamp() {
        return timeStamp;
    }

    public void setTimeStamp(String timeStamp) {
        this.timeStamp = timeStamp;
    }

    public String getSnippet() {
        return snippet;
    }

    public void setSnippet(String snippet) {
        this.snippet = snippet;
    }

    public double getVectorScore() {
        return vectorScore;
    }

    public void setVectorScore(double vectorScore) {
        this.vectorScore = vectorScore;
    }

    public double getScore() {
        return score;
    }

    public void setScore(double score) {
        this.score = score;
    }
}
