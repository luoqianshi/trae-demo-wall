package com.ice.template.rag;

import com.ice.template.integration.llm.SiliconFlowEmbeddingClient;
import com.ice.template.model.entity.ModelConfig;
import com.ice.template.service.ModelConfigService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

@Slf4j
@Component
public class Vectorizer {

    @Resource
    private SiliconFlowEmbeddingClient siliconFlowEmbeddingClient;

    @Resource
    private ModelConfigService modelConfigService;

    @Resource
    private PGVectorClient pgVectorClient;

    /**
     * 对文本做 embedding，返回向量字符串表示
     * @param text 输入文本
     * @param embeddingModelId embedding 模型配置 ID（可选）
     * @return 向量字符串，如 "[0.1, 0.2, ...]"
     */
    public String vectorize(String text, String embeddingModelId) {
        if (StringUtils.isBlank(text)) {
            return null;
        }
        try {
            ModelConfig modelConfig = resolveEmbeddingModel(embeddingModelId);
            float[] embedding = siliconFlowEmbeddingClient.embed(modelConfig, text);
            return pgVectorClient.vectorToString(embedding);
        } catch (Exception e) {
            log.warn("[Vectorizer] 向量化失败: {}", e.getMessage());
            return null;
        }
    }

    private ModelConfig resolveEmbeddingModel(String modelConfigId) {
        if (StringUtils.isNotBlank(modelConfigId)) {
            ModelConfig config = modelConfigService.getById(modelConfigId);
            if (config != null) return config;
        }
        // 自动选择第一个可用的 embedding 模型
        return modelConfigService.list().stream()
                .filter(c -> Integer.valueOf(1).equals(c.getEnabled()) && "embedding".equals(c.getModelType()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("没有可用的嵌入模型配置"));
    }
}
