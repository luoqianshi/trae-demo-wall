package com.ice.template.executor.node;

import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.integration.llm.OpenAiChatMessage;
import com.ice.template.integration.llm.OpenAiCompatibleClient;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.model.entity.ModelConfig;
import com.ice.template.service.ModelConfigService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

/**
 * 翻译节点：把上游正文翻译为中文（针对非中文网页）。
 *
 * <p>沿用「便宜的本地判断决定要不要调用昂贵的下游」这一短路设计哲学：</p>
 * <ul>
 *   <li>本地统计中文字符占比，<b>已是中文 → 直接透传、不调 LLM</b>（零成本零延迟）；</li>
 *   <li>未配置模型（model_config_id 为空）→ 直接透传（默认不翻，避免无意识跨费）；</li>
 *   <li>正文为外文且配置了模型 → 调用大模型译为中文。</li>
 * </ul>
 *
 * <p>放置位置：网页提取之后、存入知识库之前，保证存进库的正文已是中文，便于中文 query 检索命中。</p>
 */
@Component
public class TranslateNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(TranslateNodeExecutor.class);

    /** 中文字符占比阈值：超过此比例视为「已是中文」，短路跳过翻译。 */
    private static final double CHINESE_RATIO_THRESHOLD = 0.2;

    /** 分段翻译的默认单段最大字符数（按段落边界累积，避免超长正文撞模型上下文/输出上限）。 */
    private static final int DEFAULT_CHUNK_SIZE = 3000;

    @Resource
    private ModelConfigService modelConfigService;

    @Resource
    private OpenAiCompatibleClient openAiCompatibleClient;

    @Override
    public boolean supports(String nodeType) {
        return "Translate".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String input = FlowNodeDataUtils.getTemplateString(node, "input");
        if (StringUtils.isBlank(input)) {
            input = context.getCurrentText();
        }
        if (StringUtils.isBlank(input)) {
            return buildResult("", false, "empty");
        }

        // 1) 本地检测：已是中文 → 短路透传，不调 LLM
        if (isChinese(input)) {
            log.info("[Translate] 检测为中文(length={})，短路透传，跳过翻译", input.length());
            context.setCurrentText(input);
            return buildResult(input, false, "already-zh");
        }

        // 2) 未配置模型 → 默认不翻，直接透传（避免无意识跨费）
        String modelConfigId = FlowNodeDataUtils.getTemplateString(node, "model_config_id");
        ModelConfig modelConfig = StringUtils.isBlank(modelConfigId) ? null : modelConfigService.getById(modelConfigId);
        if (modelConfig == null) {
            log.info("[Translate] 未配置翻译模型，短路透传，跳过翻译");
            context.setCurrentText(input);
            return buildResult(input, false, "no-model");
        }

        // 3) 外文且有模型 → 调 LLM 译为中文（超长正文自动分段，逐段翻译再拼接）
        try {
            Double temperature = FlowNodeDataUtils.getTemplateDouble(node, "temperature",
                    modelConfig.getTemperature() == null ? 0.2 : modelConfig.getTemperature());
            Integer maxTokens = FlowNodeDataUtils.getTemplateInteger(node, "max_tokens", modelConfig.getMaxTokens());
            int chunkSize = FlowNodeDataUtils.getTemplateInteger(node, "chunk_size", DEFAULT_CHUNK_SIZE);
            if (chunkSize <= 0) {
                chunkSize = DEFAULT_CHUNK_SIZE;
            }

            List<String> segments = splitByLength(input, chunkSize);
            log.info("[Translate] 开始翻译: inputLength={}, 分段数={}, chunkSize={}", input.length(), segments.size(), chunkSize);

            StringBuilder translated = new StringBuilder(input.length() + 64);
            int failedSegments = 0;
            for (int i = 0; i < segments.size(); i++) {
                String segment = segments.get(i);
                try {
                    String segOut = translateSegment(modelConfig, segment, temperature, maxTokens);
                    if (StringUtils.isBlank(segOut)) {
                        // 单段返回空：保留原文该段，不丢内容
                        translated.append(segment);
                        failedSegments++;
                    } else {
                        translated.append(segOut);
                    }
                } catch (Exception segErr) {
                    // 单段失败：保留原文该段，继续翻后续段，避免整篇失败
                    log.warn("[Translate] 第{}段翻译失败，保留原文: error={}", i + 1, segErr.getMessage());
                    translated.append(segment);
                    failedSegments++;
                }
                if (i < segments.size() - 1) {
                    translated.append("\n\n");
                }
            }

            String output = translated.toString();
            if (failedSegments == segments.size()) {
                // 全部段失败 → 视为翻译失败，透传原文
                log.warn("[Translate] 全部分段翻译失败，透传原文");
                context.setCurrentText(input);
                return buildResult(input, false, "error");
            }
            log.info("[Translate] 翻译完成: inputLength={}, outputLength={}, 失败段={}/{}",
                    input.length(), output.length(), failedSegments, segments.size());
            context.setCurrentText(output);
            return buildResult(output, true, segments.size() > 1 ? "translated-chunked" : "translated");
        } catch (Exception e) {
            // 翻译失败不阻断入库：透传原文，交由下游继续
            log.warn("[Translate] 翻译异常，透传原文: error={}", e.getMessage());
            context.setCurrentText(input);
            return buildResult(input, false, "error");
        }
    }

    /** 翻译单个分段。 */
    private String translateSegment(ModelConfig modelConfig, String segment, Double temperature, Integer maxTokens) {
        List<OpenAiChatMessage> messages = new ArrayList<>();
        messages.add(new OpenAiChatMessage("system",
                "你是一名专业翻译。请将用户提供的内容完整翻译为简体中文，保持原有的 Markdown 结构（标题、列表、代码块、链接等）不变，只输出译文，不要添加任何解释或额外说明。"));
        messages.add(new OpenAiChatMessage("user", segment));
        return openAiCompatibleClient.chat(modelConfig, messages, temperature, maxTokens);
    }

    /**
     * 按目标长度分段：优先沿段落边界（空行）累积，单段超过 maxLen 才硬切，尽量保持语义完整与 Markdown 结构。
     */
    private List<String> splitByLength(String text, int maxLen) {
        List<String> result = new ArrayList<>();
        if (text.length() <= maxLen) {
            result.add(text);
            return result;
        }
        String[] paragraphs = text.split("\n\n");
        StringBuilder current = new StringBuilder();
        for (String para : paragraphs) {
            // 单个段落本身就超长 → 先冲刷已累积内容，再对该段落硬切
            if (para.length() > maxLen) {
                if (current.length() > 0) {
                    result.add(current.toString());
                    current.setLength(0);
                }
                for (int i = 0; i < para.length(); i += maxLen) {
                    result.add(para.substring(i, Math.min(para.length(), i + maxLen)));
                }
                continue;
            }
            // 累积超过阈值 → 冲刷
            if (current.length() + para.length() + 2 > maxLen && current.length() > 0) {
                result.add(current.toString());
                current.setLength(0);
            }
            if (current.length() > 0) {
                current.append("\n\n");
            }
            current.append(para);
        }
        if (current.length() > 0) {
            result.add(current.toString());
        }
        return result;
    }

    private FlowNodeExecuteResult buildResult(String text, boolean translated, String via) {
        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(text);
        result.getOutput().put("text", text);
        result.getOutput().put("translated", translated);
        result.getOutput().put("via", via);
        result.getOutput().put("length", text == null ? 0 : text.length());
        return result;
    }

    /** 统计中文字符占比，判断是否「已是中文」。基于采样前若干字符，避免长文全量遍历。 */
    private boolean isChinese(String text) {
        int sampleLen = Math.min(text.length(), 2000);
        int chinese = 0;
        int letters = 0;
        for (int i = 0; i < sampleLen; i++) {
            char c = text.charAt(i);
            if (c >= '\u4e00' && c <= '\u9fff') {
                chinese++;
                letters++;
            } else if (Character.isLetter(c)) {
                letters++;
            }
        }
        if (letters == 0) {
            return true;
        }
        return (double) chinese / letters >= CHINESE_RATIO_THRESHOLD;
    }
}
