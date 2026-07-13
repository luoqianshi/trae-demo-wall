package com.ice.template.model.vo;

import com.ice.template.model.entity.KnowledgeDocument;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class KnowledgeDocumentVO implements Serializable {

    private String id;

    private String kbId;

    private String title;

    private String fileType;

    private String filePath;

    private Long fileSize;

    private String rawText;

    private String globalMetadata;

    private String status;

    private String ingestionMode;

    private String resolvedIngestionMode;

    private Integer chunkCount;

    private String errorMessage;

    private Date createTime;

    private Date updateTime;

    public static KnowledgeDocumentVO objToVo(KnowledgeDocument document) {
        if (document == null) {
            return null;
        }
        KnowledgeDocumentVO vo = new KnowledgeDocumentVO();
        BeanUtils.copyProperties(document, vo);
        return vo;
    }

    private static final long serialVersionUID = 1L;
}
