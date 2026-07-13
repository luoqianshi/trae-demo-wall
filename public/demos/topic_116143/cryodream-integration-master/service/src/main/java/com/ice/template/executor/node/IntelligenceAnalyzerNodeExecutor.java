package com.ice.template.executor.node;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.rag.generation.AnalysisResponse;
import com.ice.template.rag.generation.Citation;
import com.ice.template.rag.generation.IntelligenceAnalyzerService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

/**
 * 情报分析师节点：检索召回 + 单次 LLM 生成分层研判简报 + 真实溯源锚点。
 */
@Component
public class IntelligenceAnalyzerNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(IntelligenceAnalyzerNodeExecutor.class);

    @Resource
    private IntelligenceAnalyzerService intelligenceAnalyzerService;

    @Override
    public boolean supports(String nodeType) {
        return "IntelligenceAnalyzer".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String kbId = FlowNodeDataUtils.getTemplateString(node, "kb_id");
        String query = StringUtils.defaultIfBlank(context.getCurrentText(),
                FlowNodeDataUtils.getTemplateString(node, "query"));
        if (StringUtils.isBlank(query)) {
            query = context.getInputValue();
        }
        String modelConfigId = FlowNodeDataUtils.getTemplateString(node, "model_config_id");

        log.info("[IntelligenceAnalyzer] kbId={}, query={}, modelConfigId={}", kbId, query, modelConfigId);
        if (StringUtils.isBlank(kbId)) {
            throw new IllegalArgumentException("知识库ID不能为空");
        }
        if (StringUtils.isBlank(query)) {
            throw new IllegalArgumentException("研判提问不能为空");
        }

        AnalysisResponse analysis = intelligenceAnalyzerService.analyze(kbId, query, modelConfigId);

        JSONArray citationArr = new JSONArray();
        for (Citation c : analysis.getCitations()) {
            JSONObject obj = new JSONObject(true);
            obj.set("引用编号", c.getIndex());
            obj.set("chunkId", c.getChunkId());
            obj.set("来源", c.getSource());
            obj.set("置信度", c.getConfidence());
            obj.set("断言类型", c.getClaimType());
            obj.set("时间", c.getTimeStamp());
            obj.set("文档", c.getDocTitle());
            obj.set("原文预览", c.getSnippet());
            citationArr.add(obj);
        }

        context.setVariable("analysisReport", analysis.getReport());
        context.setVariable("citations", JSONUtil.toJsonStr(analysis.getCitations()));
        context.setCurrentText(analysis.getReport());

        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(analysis.getReport());
        result.getInput().put("query", query);
        result.getInput().put("kbId", kbId);
        result.getOutput().put("研判简报", analysis.getReport());
        result.getOutput().put("召回数量", analysis.getRetrievedCount());
        result.getOutput().put("耗时ms", analysis.getElapsedMs());
        result.getOutput().put("溯源锚点", citationArr);
        result.getOutput().put("report", analysis.getReport());

        log.info("[IntelligenceAnalyzer] 研判完成，召回{}条，溯源{}个，耗时{}ms",
                analysis.getRetrievedCount(), analysis.getCitations().size(), analysis.getElapsedMs());
        return result;
    }
}
