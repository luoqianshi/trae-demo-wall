package com.ice.template.rag.generation;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.integration.llm.OpenAiChatMessage;
import com.ice.template.integration.llm.OpenAiCompatibleClient;
import com.ice.template.model.entity.ModelConfig;
import com.ice.template.rag.retrieval.HybridSearchService;
import com.ice.template.rag.retrieval.RetrievalResponse;
import com.ice.template.rag.retrieval.RetrievedChunk;
import com.ice.template.service.AnalysisHistoryService;
import com.ice.template.service.ModelConfigService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

/**
 * 情报分析师服务：检索召回 → 单次 LLM 生成分层研判简报 → 后端注入真实 Chunk 溯源。
 */
@Service
public class IntelligenceAnalyzerService {

    private static final Logger log = LoggerFactory.getLogger(IntelligenceAnalyzerService.class);

    @Resource
    private HybridSearchService hybridSearchService;

    @Resource
    private OpenAiCompatibleClient openAiCompatibleClient;

    @Resource
    private ModelConfigService modelConfigService;

    @Autowired(required = false)
    private AnalysisHistoryService analysisHistoryService;

    private static final String SYSTEM_PROMPT = """
            你是一名资深情报分析师，秉持「理论为基、数据为核」的原则进行研判。
            你必须严格依据用户提供的【参考资料】作答，不得编造资料之外的信息。
            每一条结论后面必须标注溯源锚点，格式为 [引用: 资料N]（N 为资料编号），无法溯源的结论不得输出。
            高置信度的事实数据与低置信度的市场叙事必须分块呈现，并提示时效性风险。
            """;

    /**
     * 生成研判简报。
     *
     * @param kbId          知识库 ID
     * @param query         用户提问
     * @param modelConfigId 指定 LLM 模型，为空自动兜底
     */
    public AnalysisResponse analyze(String kbId, String query, String modelConfigId) {
        long start = System.currentTimeMillis();
        AnalysisResponse response = new AnalysisResponse();
        response.setQuery(query);

        if (StringUtils.isBlank(kbId) || StringUtils.isBlank(query)) {
            response.setReport("知识库 ID 与提问内容不能为空。");
            return response;
        }

        RetrievalResponse retrieval = hybridSearchService.hybridSearch(kbId, query, modelConfigId);
        List<RetrievedChunk> chunks = retrieval.getChunks();
        response.setRetrievedCount(retrieval.getTotalCount());
        response.setRewrittenQuery(retrieval.getRewrittenQuery());

        if (chunks.isEmpty()) {
            response.setReport("## 💡 一句话核心研判\n知识库中未检索到与该问题相关的资料，无法进行研判。\n\n"
                    + "## 🎯 综合行动建议\n建议补充相关资料后重试，或调整提问关键词。");
            response.setElapsedMs(System.currentTimeMillis() - start);
            return response;
        }

        List<Citation> citations = buildCitations(chunks);
        response.setCitations(citations);

        String references = buildReferences(chunks, citations);
        ModelConfig modelConfig = resolveLlmModel(modelConfigId);
        if (modelConfig == null) {
            response.setReport("未找到可用的 LLM 模型，无法生成研判简报，请在模型设置中配置带 API Key 的 LLM 模型。");
            response.setElapsedMs(System.currentTimeMillis() - start);
            return response;
        }

        try {
            List<OpenAiChatMessage> messages = new ArrayList<>();
            messages.add(new OpenAiChatMessage("system", SYSTEM_PROMPT));
            messages.add(new OpenAiChatMessage("user", buildUserPrompt(query, references)));
            String report = openAiCompatibleClient.chat(modelConfig, messages, 0.3, null);
            response.setReport(StringUtils.defaultIfBlank(report, "研判生成失败，模型返回为空。"));
        } catch (Exception e) {
            log.error("[IntelligenceAnalyzer] 研判生成失败: {}", e.getMessage(), e);
            response.setReport("研判生成失败：" + e.getMessage());
        }

        response.setElapsedMs(System.currentTimeMillis() - start);
        log.info("[IntelligenceAnalyzer] 研判完成: kbId={}, 召回{}条, 耗时{}ms",
                kbId, chunks.size(), response.getElapsedMs());

        if (analysisHistoryService != null) {
            try {
                analysisHistoryService.saveHistory(kbId, response);
            } catch (Exception e) {
                log.warn("[IntelligenceAnalyzer] 研判历史保存失败: {}", e.getMessage());
            }
        }
        return response;
    }

    private List<Citation> buildCitations(List<RetrievedChunk> chunks) {
        List<Citation> citations = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            RetrievedChunk c = chunks.get(i);
            Citation citation = new Citation();
            citation.setIndex(i + 1);
            citation.setChunkId(c.getChunkId());
            citation.setDocId(c.getDocId());
            citation.setDocTitle(StringUtils.defaultIfBlank(c.getDocTitle(), "未知文档"));
            citation.setVectorScore(round(c.getVectorScore()));
            citation.setScore(round(c.getScore()));
            citation.setSnippet(preview(StringUtils.defaultIfBlank(c.getRawText(), c.getChunkText())));

            citation.setSource("document");
            citation.setConfidence(0.8);
            citation.setClaimType("事实陈述");
            citation.setTimeStamp("");
            if (StringUtils.isNotBlank(c.getMetadata())) {
                try {
                    JSONObject meta = JSONUtil.parseObj(c.getMetadata());
                    JSONObject epistemology = meta.getJSONObject("3_Epistemology_Tag");
                    if (epistemology != null) {
                        citation.setSource(epistemology.getStr("source", "document"));
                        citation.setConfidence(epistemology.getDouble("confidence", 0.8));
                        citation.setClaimType(epistemology.getStr("claim_type", "事实陈述"));
                        citation.setTimeStamp(epistemology.getStr("time_stamp", ""));
                    }
                } catch (Exception e) {
                    log.debug("[IntelligenceAnalyzer] 元数据解析失败: {}", e.getMessage());
                }
            }
            citations.add(citation);
        }
        return citations;
    }

    private String buildReferences(List<RetrievedChunk> chunks, List<Citation> citations) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < chunks.size(); i++) {
            RetrievedChunk c = chunks.get(i);
            Citation ct = citations.get(i);
            String text = StringUtils.defaultIfBlank(c.getRawText(), c.getChunkText());
            if (text != null && text.length() > 600) {
                text = text.substring(0, 600) + "...";
            }
            sb.append("【资料").append(i + 1).append("】")
                    .append("[来源:").append(ct.getSource())
                    .append(" | 置信度:").append(ct.getConfidence())
                    .append(" | 类型:").append(ct.getClaimType());
            if (StringUtils.isNotBlank(ct.getTimeStamp())) {
                sb.append(" | 时间:").append(ct.getTimeStamp());
            }
            sb.append("]\n").append(text).append("\n\n");
        }
        return sb.toString().trim();
    }

    private String buildUserPrompt(String query, String references) {
        return "请根据以下带置信度标签的参考资料，对用户问题进行情报研判。\n\n"
                + "===== 参考资料 =====\n" + references + "\n\n"
                + "===== 用户问题 =====\n" + query + "\n\n"
                + "请严格按以下 Markdown 结构输出研判简报（每条结论后标注 [引用: 资料N]）：\n\n"
                + "## 💡 一句话核心研判\n（用一句话给出最关键结论）\n\n"
                + "## 🏗️ 底层逻辑与概念\n（解释相关概念与底层逻辑）\n\n"
                + "## 📊 核心数据与事实（高置信度）\n（列出置信度较高的事实数据，每条带 [引用: 资料N]）\n\n"
                + "## 📢 市场叙事与情绪（低置信度）\n（列出置信度较低的叙事/观点，提示需谨慎，每条带 [引用: 资料N]）\n\n"
                + "## 🎯 综合行动建议\n（基于数据事实给出可执行建议，避免主观臆断）";
    }

    private ModelConfig resolveLlmModel(String modelConfigId) {
        if (StringUtils.isNotBlank(modelConfigId)) {
            ModelConfig mc = modelConfigService.getById(modelConfigId);
            if (mc != null) {
                return mc;
            }
        }
        List<ModelConfig> enabledLlms = modelConfigService.list().stream()
                .filter(mc -> Integer.valueOf(1).equals(mc.getEnabled())
                        && "llm".equalsIgnoreCase(mc.getModelType())
                        && StringUtils.isNotBlank(mc.getBaseUrl()))
                .toList();
        return enabledLlms.stream()
                .filter(mc -> StringUtils.isNotBlank(mc.getApiKey()))
                .findFirst()
                .orElse(enabledLlms.stream().findFirst().orElse(null));
    }

    private double round(double v) {
        return Math.round(v * 10000.0) / 10000.0;
    }

    private String preview(String text) {
        if (StringUtils.isBlank(text)) {
            return "";
        }
        String oneLine = text.replaceAll("\\s+", " ").trim();
        return oneLine.length() > 120 ? oneLine.substring(0, 120) + "..." : oneLine;
    }
}
