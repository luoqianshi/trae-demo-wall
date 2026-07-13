package com.ice.template.executor.node;

import cn.hutool.json.JSONUtil;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.rag.retrieval.QueryRewriterService;
import com.ice.template.rag.retrieval.RewrittenQuery;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

/**
 * 意图重构节点：将模糊提问翻译为标准 JSON 查询条件。
 */
@Component
public class QueryRewriterNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(QueryRewriterNodeExecutor.class);

    @Resource
    private QueryRewriterService queryRewriterService;

    @Override
    public boolean supports(String nodeType) {
        return "QueryRewriter".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String query = StringUtils.defaultIfBlank(context.getCurrentText(),
                FlowNodeDataUtils.getTemplateString(node, "query"));
        if (StringUtils.isBlank(query)) {
            query = context.getInputValue();
        }
        String modelConfigId = FlowNodeDataUtils.getTemplateString(node, "model_config_id");

        log.info("[QueryRewriter] query={}, modelConfigId={}", query, modelConfigId);
        if (StringUtils.isBlank(query)) {
            throw new IllegalArgumentException("检索提问不能为空");
        }

        RewrittenQuery rewritten = queryRewriterService.rewrite(query, modelConfigId);
        String rewrittenJson = JSONUtil.toJsonStr(rewritten);

        context.setVariable("rewrittenQuery", rewrittenJson);
        context.setVariable("semanticQuery", rewritten.getSemanticQuery());

        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(rewritten.getSemanticQuery());
        result.getOutput().put("rewrittenQuery", rewrittenJson);
        result.getOutput().put("semanticQuery", rewritten.getSemanticQuery());

        log.info("[QueryRewriter] 重构完成: timeRange={}, topK={}", rewritten.getTimeRange(), rewritten.getTopK());
        return result;
    }
}
