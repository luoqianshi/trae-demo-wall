package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

/**
 * 商业案例库表（PRD: Cases 模块）
 * 设计理念：多维特征矩阵 + 症状匹配，高信噪比可实操案例库
 */
@TableName(value = "knowledge_cases", autoResultMap = true)
@Data
public class KnowledgeCase implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    @TableField("kb_id")
    private String kbId;

    /** 关联外部知识库文档 ID */
    @TableField("source_doc_id")
    private String sourceDocId;

    /** 核心结构化数据 JSON (title/context/problem/solution/outcome/credibility/attachments) */
    @TableField(value = "case_data", typeHandler = com.ice.template.config.JsonbTypeHandler.class)
    private String caseData;

    /** 浓缩关键词，专供向量化使用 */
    @TableField("search_index")
    private String searchIndex;

    @TableField("create_time")
    private Date createTime;

    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}
