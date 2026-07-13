package com.ice.template.rag.retrieval;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

/**
 * Chunk 向量检索仓储：基于 pgvector 余弦相似度召回
 */
@Repository
public class ChunkRetrievalRepository {

    private static final Logger log = LoggerFactory.getLogger(ChunkRetrievalRepository.class);

    private final JdbcTemplate jdbcTemplate;

    public ChunkRetrievalRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * 向量余弦召回：在指定知识库内按相似度排序返回候选 chunk。
     * 采用软过滤策略——仅按 kb_id 限定范围，不在 SQL 内对领域/实体硬过滤，避免召回为空。
     *
     * @param kbId            知识库 ID
     * @param queryVectorStr  pgvector 文本格式查询向量，如 "[0.1, 0.2, ...]"
     * @param candidateLimit  候选集大小
     * @return 召回的候选 chunk（含 vectorScore）
     */
    public List<RetrievedChunk> vectorSearch(String kbId, String queryVectorStr, int candidateLimit) {
        if (kbId == null || kbId.isBlank() || queryVectorStr == null || queryVectorStr.isBlank()) {
            return new ArrayList<>();
        }
        int limit = candidateLimit > 0 ? candidateLimit : 50;
        String sql = "SELECT c.id, c.doc_id, c.kb_id, c.chunk_index, c.chunk_text, c.raw_text, "
                + "c.metadata::text AS metadata, "
                + "1 - (c.embedding <=> CAST(? AS vector)) AS vector_score, "
                + "d.title AS doc_title, d.file_type AS doc_file_type "
                + "FROM knowledge_chunk c "
                + "LEFT JOIN knowledge_document d ON d.id = c.doc_id "
                + "WHERE c.kb_id = ? AND c.is_delete = 0 AND c.embedding IS NOT NULL "
                + "ORDER BY c.embedding <=> CAST(? AS vector) "
                + "LIMIT ?";
        try {
            return jdbcTemplate.query(sql,
                    (rs, rowNum) -> {
                        RetrievedChunk chunk = new RetrievedChunk();
                        chunk.setChunkId(rs.getString("id"));
                        chunk.setDocId(rs.getString("doc_id"));
                        chunk.setKbId(rs.getString("kb_id"));
                        int idx = rs.getInt("chunk_index");
                        chunk.setChunkIndex(rs.wasNull() ? null : idx);
                        chunk.setChunkText(rs.getString("chunk_text"));
                        chunk.setRawText(rs.getString("raw_text"));
                        chunk.setMetadata(rs.getString("metadata"));
                        chunk.setVectorScore(rs.getDouble("vector_score"));
                        chunk.setDocTitle(rs.getString("doc_title"));
                        chunk.setDocFileType(rs.getString("doc_file_type"));
                        return chunk;
                    },
                    queryVectorStr, kbId, queryVectorStr, limit);
        } catch (Exception e) {
            log.error("[ChunkRetrievalRepository] 向量召回失败: kbId={}, error={}", kbId, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * 统计指定知识库内有向量的 chunk 数量
     */
    public int countEmbeddedChunks(String kbId) {
        if (kbId == null || kbId.isBlank()) {
            return 0;
        }
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM knowledge_chunk WHERE kb_id = ? AND is_delete = 0 AND embedding IS NOT NULL",
                    Integer.class, kbId);
            return count == null ? 0 : count;
        } catch (Exception e) {
            log.warn("[ChunkRetrievalRepository] 统计向量 chunk 失败: {}", e.getMessage());
            return 0;
        }
    }
}
