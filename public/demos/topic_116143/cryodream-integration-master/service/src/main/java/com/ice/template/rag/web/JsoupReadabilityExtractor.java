package com.ice.template.rag.web;

import net.dankito.readability4j.Article;
import net.dankito.readability4j.Readability4J;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Optional;

/**
 * L1：本地 jsoup 抓取 + readability4j 正文提取。
 *
 * <p>免费、最快，适合静态/正文规整的网页（博客、文档站、新闻）。
 * 对强 JS 渲染或反爬站点会失败，由责任链降级到下一级。</p>
 */
@Component
@Order(1)
public class JsoupReadabilityExtractor implements WebContentExtractor {

    private static final Logger log = LoggerFactory.getLogger(JsoupReadabilityExtractor.class);

    private static final String USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    + "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

    @Resource
    private WebExtractProperties properties;

    @Override
    public String name() {
        return "jsoup-readability";
    }

    @Override
    public int order() {
        return 1;
    }

    @Override
    public boolean isEnabled() {
        return properties.getJsoup().isEnabled();
    }

    @Override
    public Optional<WebContent> extract(String url) {
        try {
            String html = Jsoup.connect(url)
                    .userAgent(USER_AGENT)
                    .timeout(properties.getJsoup().getTimeoutMs())
                    .ignoreHttpErrors(true)
                    .ignoreContentType(false)
                    .followRedirects(true)
                    .get()
                    .html();

            Readability4J readability4J = new Readability4J(url, html);
            Article article = readability4J.parse();

            String contentHtml = article.getContent();
            if (contentHtml == null || contentHtml.isBlank()) {
                log.info("[JsoupReadabilityExtractor] 未提取到正文，降级: url={}", url);
                return Optional.empty();
            }

            Document contentDoc = Jsoup.parse(contentHtml);
            String markdown = HtmlToMarkdownConverter.convert(contentDoc.body());

            String title = article.getTitle();
            return Optional.of(new WebContent(title, markdown, url, name()));
        } catch (Exception e) {
            log.info("[JsoupReadabilityExtractor] 提取失败，降级: url={}, error={}", url, e.getMessage());
            return Optional.empty();
        }
    }
}
