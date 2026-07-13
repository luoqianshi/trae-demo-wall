package com.ice.template.model.vo;

import com.ice.template.model.entity.KnowledgeBase;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class KnowledgeBaseVO implements Serializable {

    private String id;

    private String projectId;

    private String name;

    private String description;

    private String domain;

    private String embeddingModelId;

    private Integer chunkCount;

    private Date createTime;

    private Date updateTime;

    public static KnowledgeBaseVO objToVo(KnowledgeBase knowledgeBase) {
        if (knowledgeBase == null) {
            return null;
        }
        KnowledgeBaseVO vo = new KnowledgeBaseVO();
        BeanUtils.copyProperties(knowledgeBase, vo);
        return vo;
    }

    private static final long serialVersionUID = 1L;
}
