package com.ice.template.model.vo;

import com.ice.template.model.entity.KnowledgeChunk;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class ChunkVO implements Serializable {

    private String id;

    private String docId;

    private String kbId;

    private Integer chunkIndex;

    private String parentId;

    private String chunkLevel;

    private String chunkText;

    private String rawText;

    private String metadata;

    private String events;

    private String embedding;

    private Date createTime;

    public static ChunkVO objToVo(KnowledgeChunk chunk) {
        if (chunk == null) {
            return null;
        }
        ChunkVO vo = new ChunkVO();
        BeanUtils.copyProperties(chunk, vo);
        return vo;
    }

    private static final long serialVersionUID = 1L;
}
