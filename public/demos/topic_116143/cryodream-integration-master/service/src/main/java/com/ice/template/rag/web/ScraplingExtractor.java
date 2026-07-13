package com.ice.template.rag.web;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import org.apache.commons.lang3.StringUtils;
import org.jsoup.Jsoup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Optional;

/**
 * L3：Scrapling 爬虫微服务（HTTP）。
 *
 * <p>Scrapling 是 Python 框架，通过独立 FastAPI 微服务暴露 {@code POST /extract}，
 * 具备 StealthyFetcher 反爬绕过、代理轮换等能力，用于应对 Cloudflare 等强反爬站点。
 * Java 端仅通过 HTTP 调用，零 Python 依赖。默认关闭，配置开启后生效。</p>
 *
 * <p>约定微服务请求体：{@code {"url": "..."}}，
 * 响应体：{@code {"title": "...", "markdown": "...", "html": "..."}}，
 * 其中 markdown 优先；若仅返回 html，则本地转 Markdown。</p>
 */
@Component
@Order(3)
public class ScraplingExtractor implements WebContentExtractor {

    private static final Logger log = LoggerFactory.getLogger(ScraplingExtractor.class);

    @Resource
    private WebExtractProperties properties;

    @Override
    public String name() {
        return "scrapling";
    }

    @Override
    public int order() {
        return 3;
    }

    @Override
    public boolean isEnabled() {
        return properties.getScrapling().isEnabled();
    }

    @Override
    public Optional<WebContent> extract(String url) {
        WebExtractProperties.Scrapling cfg = properties.getScrapling();
        try {
            JSONObject payload = new JSONObject();
            payload.set("url", url);

            try (HttpResponse response = HttpRequest.post(cfg.getEndpoint())
                    .timeout(cfg.getTimeoutMs())
                    .header("Content-Type", "application/json")
                    .body(payload.toString())
                    .execute()) {

                if (!response.isOk()) {
                    log.info("[ScraplingExtractor] 非 200 响应，降级: url={}, status={}", url, response.getStatus());
                    return Optional.empty();
                }

                String body = response.body();
                if (StringUtils.isBlank(body)) {
                    return Optional.empty();
                }

                JSONObject json = JSONUtil.parseObj(body);
                String title = json.getStr("title");
                String markdown = json.getStr("markdown");
                if (StringUtils.isBlank(markdown)) {
                    String html = json.getStr("html");
                    if (StringUtils.isNotBlank(html)) {
                        markdown = HtmlToMarkdownConverter.convert(Jsoup.parse(html).body());
                    }
                }
                if (StringUtils.isBlank(markdown)) {
                    return Optional.empty();
                }
                return Optional.of(new WebContent(title, markdown, url, name()));
            }
        } catch (Exception e) {
            log.info("[ScraplingExtractor] 提取失败，降级: url={}, error={}", url, e.getMessage());
            return Optional.empty();
        }
    }
}
