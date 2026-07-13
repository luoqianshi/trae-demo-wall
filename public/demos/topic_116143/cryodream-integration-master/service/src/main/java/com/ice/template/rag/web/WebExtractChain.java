package com.ice.template.rag.web;

import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * 网页正文提取责任链。
 *
 * <p>按提取器 order 从小到大依次尝试（jsoup -> Jina -> Scrapling -> ...），
 * 任一级返回合格正文（长度达到 {@code minContentLength} 且未命中反爬特征）即返回，
 * 否则降级到下一级；全部失败则抛出业务异常。</p>
 */
@Component
public class WebExtractChain {

    private static final Logger log = LoggerFactory.getLogger(WebExtractChain.class);

    private static final String[] ANTI_BOT_SIGNALS = {
            "请开启javascript", "enable javascript", "verify you are human",
            "访问验证", "人机验证", "captcha", "403 forbidden", "access denied"
    };

    private final List<WebContentExtractor> extractors;
    private final WebExtractProperties properties;

    public WebExtractChain(List<WebContentExtractor> extractors, WebExtractProperties properties) {
        this.extractors = extractors.stream()
                .sorted(Comparator.comparingInt(WebContentExtractor::order))
                .toList();
        this.properties = properties;
    }

    /**
     * 提取网页正文，逐级降级。
     *
     * @param url 目标网页 URL
     * @return 合格正文
     * @throws BusinessException 所有提取器均失败时抛出
     */
    public WebContent extract(String url) {
        if (StringUtils.isBlank(url)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "网页 URL 不能为空");
        }
        String normalizedUrl = normalizeUrl(url);

        for (WebContentExtractor extractor : extractors) {
            if (!extractor.isEnabled()) {
                continue;
            }
            try {
                Optional<WebContent> result = extractor.extract(normalizedUrl);
                if (result.isPresent() && isQualified(result.get())) {
                    WebContent content = result.get();
                    log.info("[WebExtractChain] 提取成功: extractor={}, url={}, length={}",
                            extractor.name(), normalizedUrl, content.getMarkdown().length());
                    return content;
                }
                log.info("[WebExtractChain] 提取器 {} 结果不合格，降级: url={}", extractor.name(), normalizedUrl);
            } catch (Exception e) {
                log.warn("[WebExtractChain] 提取器 {} 异常，降级: url={}, error={}",
                        extractor.name(), normalizedUrl, e.getMessage());
            }
        }
        throw new BusinessException(ErrorCode.OPERATION_ERROR, "所有提取方案均未能获取该网页正文，请检查链接或更换方案");
    }

    private boolean isQualified(WebContent content) {
        if (content == null || StringUtils.isBlank(content.getMarkdown())) {
            return false;
        }
        String markdown = content.getMarkdown();
        if (markdown.length() < properties.getMinContentLength()) {
            return false;
        }
        // 仅对短文本做反爬特征检测：真正的拦截/验证页通常很短（< 1000 字符），
        // 而正常长文可能正文本身就提到 captcha 等词，不应误杀。
        if (markdown.length() < 1000) {
            String lower = markdown.toLowerCase();
            for (String signal : ANTI_BOT_SIGNALS) {
                if (lower.contains(signal)) {
                    return false;
                }
            }
        }
        return true;
    }

    private String normalizeUrl(String url) {
        String trimmed = url.trim();
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            return "https://" + trimmed;
        }
        return trimmed;
    }
}
