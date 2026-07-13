package com.ice.template.rag;

import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.entity.KnowledgeChunk;
import com.ice.template.service.KnowledgeChunkService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

@Component
public class PGVectorClient {

    private static final Logger log = LoggerFactory.getLogger(PGVectorClient.class);

    @Resource
    private KnowledgeChunkService chunkService;

    public void saveChunk(KnowledgeChunk chunk) {
        if (chunk == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "Chunk不能为空");
        }
        if (StringUtils.isBlank(chunk.getDocId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文档ID不能为空");
        }
        if (StringUtils.isBlank(chunk.getKbId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "知识库ID不能为空");
        }
        if (StringUtils.isBlank(chunk.getChunkText())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "Chunk文本不能为空");
        }

        boolean result = chunkService.save(chunk);
        if (!result) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "保存Chunk失败");
        }
        log.info("[PGVectorClient] 保存Chunk成功: docId={}, chunkIndex={}", chunk.getDocId(), chunk.getChunkIndex());
    }

    public void saveChunks(List<KnowledgeChunk> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "Chunk列表不能为空");
        }

        boolean result = chunkService.saveBatch(chunks);
        if (!result) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "批量保存Chunk失败");
        }
        log.info("[PGVectorClient] 批量保存Chunk成功: count={}", chunks.size());
    }

    public String vectorToString(float[] embedding) {
        if (embedding == null || embedding.length == 0) {
            return "[]";
        }
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < embedding.length; i++) {
            if (i > 0) {
                sb.append(", ");
            }
            sb.append(embedding[i]);
        }
        sb.append("]");
        return sb.toString();
    }

    public float[] stringToVector(String embeddingStr) {
        if (StringUtils.isBlank(embeddingStr)) {
            return new float[0];
        }
        try {
            String cleaned = embeddingStr.trim().replace("[", "").replace("]", "");
            String[] parts = cleaned.split(",");
            float[] result = new float[parts.length];
            for (int i = 0; i < parts.length; i++) {
                result[i] = Float.parseFloat(parts[i].trim());
            }
            return result;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "解析向量字符串失败: " + e.getMessage());
        }
    }
}
