package com.ice.template.executor.node;

import com.ice.template.rag.web.ScraplingExtractor;
import com.ice.template.rag.web.WebContentExtractor;
import com.ice.template.rag.web.WebExtractProperties;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

/**
 * 网页提取节点 L3：Scrapling 爬虫微服务。具备反爬绕过能力，应对 Cloudflare 等强反爬站点。默认需开启配置。
 */
@Component
public class WebFetchScraplingNodeExecutor extends AbstractWebFetchNodeExecutor {

    @Resource
    private ScraplingExtractor scraplingExtractor;

    @Resource
    private WebExtractProperties properties;

    @Override
    public boolean supports(String nodeType) {
        return "WebFetchScrapling".equals(nodeType);
    }

    @Override
    protected WebContentExtractor extractor() {
        return scraplingExtractor;
    }

    @Override
    protected WebExtractProperties properties() {
        return properties;
    }
}
