package com.ice.template.executor.node;

import com.ice.template.rag.web.JinaReaderExtractor;
import com.ice.template.rag.web.WebContentExtractor;
import com.ice.template.rag.web.WebExtractProperties;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

/**
 * 网页提取节点 L2：Jina Reader（r.jina.ai）。可处理公众号、知乎等 JS 动态渲染页面。
 */
@Component
public class WebFetchJinaNodeExecutor extends AbstractWebFetchNodeExecutor {

    @Resource
    private JinaReaderExtractor jinaExtractor;

    @Resource
    private WebExtractProperties properties;

    @Override
    public boolean supports(String nodeType) {
        return "WebFetchJina".equals(nodeType);
    }

    @Override
    protected WebContentExtractor extractor() {
        return jinaExtractor;
    }

    @Override
    protected WebExtractProperties properties() {
        return properties;
    }
}
