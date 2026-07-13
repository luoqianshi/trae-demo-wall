package com.ice.template.rag.web;

/**
 * 网页正文提取结果
 */
public class WebContent {

    /** 文章标题（可能为空） */
    private String title;

    /** 提取出的正文（Markdown 格式） */
    private String markdown;

    /** 来源 URL */
    private String sourceUrl;

    /** 命中的提取器名称（用于可观测） */
    private String extractorName;

    public WebContent() {
    }

    public WebContent(String title, String markdown, String sourceUrl, String extractorName) {
        this.title = title;
        this.markdown = markdown;
        this.sourceUrl = sourceUrl;
        this.extractorName = extractorName;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMarkdown() {
        return markdown;
    }

    public void setMarkdown(String markdown) {
        this.markdown = markdown;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }

    public String getExtractorName() {
        return extractorName;
    }

    public void setExtractorName(String extractorName) {
        this.extractorName = extractorName;
    }
}
