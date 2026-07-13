package com.ice.template.executor.node;

import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * URL 输入节点：网页工作流的统一入口，输出 url 给下游并联的多个网页提取节点。
 *
 * <p>运行时优先取节点 url 字段；为空则取 {@code context.getVariable("url")}（由入库入口注入）。</p>
 */
@Component
public class UrlInputNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(UrlInputNodeExecutor.class);

    @Override
    public boolean supports(String nodeType) {
        return "URLInput".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String url = FlowNodeDataUtils.getTemplateString(node, "url");
        if (StringUtils.isBlank(url)) {
            Object var = context.getVariable("url");
            if (var != null) {
                url = String.valueOf(var);
            }
        }
        if (StringUtils.isBlank(url)) {
            throw new IllegalArgumentException("请提供网页 URL");
        }
        context.setVariable("url", url);
        log.info("[URLInput] url={}", url);

        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(url);
        result.getOutput().put("url", url);
        return result;
    }
}
