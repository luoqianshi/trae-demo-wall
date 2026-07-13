package com.ice.template.rag.web;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Optional;

/**
 * L2：Jina Reader（r.jina.ai）。
 *
 * <p>把目标 URL 拼到 Jina Reader 端点后即可拿到清洗好的 Markdown，
 * 能处理公众号、知乎等 JS 动态渲染页面。免费（可选 API Key 提额）。</p>
 */
@Component
@Order(2)
public class JinaReaderExtractor implements WebContentExtractor {

    private static final Logger log = LoggerFactory.getLogger(JinaReaderExtractor.class);

    @Resource
    private WebExtractProperties properties;

    @Override
    public String name() {
        return "jina-reader";
    }

    @Override
    public int order() {
        return 2;
    }

    @Override
    public boolean isEnabled() {
        return properties.getJina().isEnabled();
    }

    @Override
    public Optional<WebContent> extract(String url) {
        WebExtractProperties.Jina cfg = properties.getJina();
        String endpoint = StringUtils.appendIfMissing(cfg.getEndpoint(), "/");
        String requestUrl = endpoint + url;
        try {
            HttpRequest request = HttpRequest.get(requestUrl)
                    .timeout(cfg.getTimeoutMs())
                    .header("Accept", "text/markdown")
                    .header("X-Return-Format", "markdown");
            if (StringUtils.isNotBlank(cfg.getApiKey())) {
                request.header("Authorization", "Bearer " + cfg.getApiKey());
            }

            try (HttpResponse response = request.execute()) {
                if (!response.isOk()) {
                    log.info("[JinaReaderExtractor] 非 200 响应，降级: url={}, status={}", url, response.getStatus());
                    return Optional.empty();
                }
                String markdown = response.body();
                if (StringUtils.isBlank(markdown)) {
                    return Optional.empty();
                }
                String title = extractTitle(markdown);
                return Optional.of(new WebContent(title, markdown, url, name()));
            }
        } catch (Exception e) {
            log.info("[JinaReaderExtractor] 提取失败，降级: url={}, error={}", url, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Jina Reader 输出头部通常包含 "Title: xxx"，尝试解析。
     */
    private String extractTitle(String markdown) {
        for (String line : markdown.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("Title:")) {
                return trimmed.substring("Title:".length()).trim();
            }
            if (trimmed.startsWith("# ")) {
                return trimmed.substring(2).trim();
            }
            if (!trimmed.isEmpty()) {
                break;
            }
        }
        return null;
    }
}
