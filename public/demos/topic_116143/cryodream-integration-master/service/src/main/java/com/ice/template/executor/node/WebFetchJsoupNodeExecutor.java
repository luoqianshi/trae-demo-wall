package com.ice.template.executor.node;

import com.ice.template.rag.web.JsoupReadabilityExtractor;
import com.ice.template.rag.web.WebContentExtractor;
import com.ice.template.rag.web.WebExtractProperties;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

/**
 * 网页提取节点 L1：本地 jsoup + readability 提取。免费最快，适合静态/正文规整的网页。
 */
@Component
public class WebFetchJsoupNodeExecutor extends AbstractWebFetchNodeExecutor {

    @Resource
    private JsoupReadabilityExtractor jsoupExtractor;

    @Resource
    private WebExtractProperties properties;

    @Override
    public boolean supports(String nodeType) {
        return "WebFetchJsoup".equals(nodeType);
    }

    @Override
    protected WebContentExtractor extractor() {
        return jsoupExtractor;
    }

    @Override
    protected WebExtractProperties properties() {
        return properties;
    }
}
