package com.ice.template.executor.node;

import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.rag.web.WebContent;
import com.ice.template.rag.web.WebContentExtractor;
import com.ice.template.rag.web.WebExtractProperties;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

/**
 * 网页提取节点的抽象基类（条件短路降级）。
 *
 * <p>把网页正文提取的某一方案（jsoup / Jina / Scrapling）包装成可在画布上独立可见、可调参的节点。
 * 多个网页提取节点按优先级<b>串联</b>，配合「上游已成功则短路」的条件逻辑，实现 if-else 降级链：</p>
 *
 * <pre>
 *   URL → jsoup ──成功──→ 透传到底（结束）
 *            └─失败─→ Jina ──成功──→ 透传到底（结束）
 *                        └─失败─→ Scrapling …
 * </pre>
 *
 * <p>节点逻辑：</p>
 * <ul>
 *   <li>读上游经连线注入的<b>成功标志</b>（upstream_success）；若上游已成功，则直接透传上游正文、跳过本级提取
 *       （不发网络请求，等价于短路）；</li>
 *   <li>否则用本级 extractor 从 url 尝试提取；成功则输出正文（success=true），失败则输出空正文（success=false）交给下游继续。</li>
 * </ul>
 *
 * <p>注意：判断是否短路依据的是上游<b>明确的 success 信号</b>，而非正文长度。
 * 因为失败页面（验证码页、Cloudflare 拦截页、登录墙等）也可能返回一定长度的字符，
 * 用长度判断会误判为成功，导致更强的降级方案不被触发。</p>
 */
public abstract class AbstractWebFetchNodeExecutor implements FlowNodeExecutor {

    private final Logger log = LoggerFactory.getLogger(getClass());

    /** 返回本级使用的提取器。 */
    protected abstract WebContentExtractor extractor();

    /** 返回提取配置（用于合格性判断的最小长度阈值）。 */
    protected abstract WebExtractProperties properties();

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        // 1) 上游已明确成功（success 信号）→ 短路透传，跳过本级（不调用提取器，无网络开销）
        boolean upstreamSuccess = parseBoolean(FlowNodeDataUtils.getTemplateValue(node, "upstream_success"));
        if (upstreamSuccess) {
            String upstreamText = FlowNodeDataUtils.getTemplateString(node, "input");
            log.info("[{}] 上游已成功(length={})，短路透传，跳过本级提取", extractor().name(),
                    upstreamText == null ? 0 : upstreamText.length());
            context.setCurrentText(upstreamText);
            return buildResult(upstreamText, true, "upstream", null);
        }

        String url = resolveUrl(node, context);
        if (StringUtils.isBlank(url)) {
            return buildResult("", false, extractor().name() + "-no-url", null);
        }

        // 2) 本级尝试提取
        try {
            Optional<WebContent> result = extractor().extract(normalizeUrl(url));
            if (result.isPresent() && isQualified(result.get().getMarkdown())) {
                WebContent content = result.get();
                String markdown = content.getMarkdown();
                context.setCurrentText(markdown);
                context.setVariable("webVia", extractor().name());
                if (StringUtils.isNotBlank(content.getTitle())) {
                    context.setVariable("webTitle", content.getTitle());
                }
                log.info("[{}] 提取成功: url={}, length={}", extractor().name(), url, markdown.length());
                return buildResult(markdown, true, extractor().name(), content.getTitle());
            }
            log.info("[{}] 结果不合格，降级到下一方案: url={}", extractor().name(), url);
        } catch (Exception e) {
            log.warn("[{}] 提取异常，降级到下一方案: url={}, error={}", extractor().name(), url, e.getMessage());
        }

        // 3) 本级失败：输出空正文（success=false），不抛异常、不中断图，交由下游节点继续尝试
        return buildResult("", false, extractor().name() + "-failed", null);
    }

    private boolean parseBoolean(Object value) {
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        return value != null && "true".equalsIgnoreCase(String.valueOf(value));
    }

    private FlowNodeExecuteResult buildResult(String text, boolean success, String via, String title) {
        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(text);
        result.getOutput().put("text", text);
        result.getOutput().put("success", success);
        result.getOutput().put("length", text == null ? 0 : text.length());
        result.getOutput().put("via", via);
        result.getOutput().put("title", StringUtils.defaultString(title));
        return result;
    }

    private String resolveUrl(FlowNodeDTO node, FlowExecutionContext context) {
        String url = FlowNodeDataUtils.getTemplateString(node, "url");
        if (StringUtils.isBlank(url)) {
            Object var = context.getVariable("url");
            if (var != null) {
                url = String.valueOf(var);
            }
        }
        return url;
    }

    private boolean isQualified(String markdown) {
        return StringUtils.isNotBlank(markdown) && markdown.length() >= properties().getMinContentLength();
    }

    private String normalizeUrl(String url) {
        String trimmed = url.trim();
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            return "https://" + trimmed;
        }
        return trimmed;
    }
}
