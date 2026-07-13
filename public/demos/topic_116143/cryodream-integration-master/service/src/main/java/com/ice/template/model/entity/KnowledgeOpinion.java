package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

/**
 * 观点表（knowledge_opinions）
 * 设计理念：实体关系驱动（Entity-Relational）—— 观点是"主体实体 → 看法 → 客体实体"的关系
 * 核心字段：relations（实体关系层 JSONB）+ context（业务上下文 JSONB）+ core_thesis + supporting_logic + credibility
 */
@TableName(value = "knowledge_opinions", autoResultMap = true)
@Data
public class KnowledgeOpinion implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    @TableField("kb_id")
    private String kbId;

    @TableField("doc_id")
    private String docId;

    /** 实体关系层 JSON: {source_entity, target_entities[], interest_alignment} */
    @TableField(value = "relations", typeHandler = com.ice.template.config.JsonbTypeHandler.class)
    private String relations;

    /** 业务上下文 JSON: {stance[], applicable_stage[]} */
    @TableField(value = "context", typeHandler = com.ice.template.config.JsonbTypeHandler.class)
    private String context;

    /** 核心论点（一句话总结） */
    @TableField("core_thesis")
    private String coreThesis;

    /** 支撑逻辑 JSON 数组 */
    @TableField(value = "supporting_logic", typeHandler = com.ice.template.config.JsonbTypeHandler.class)
    private String supportingLogic;

    /** 防伪与失效机制 JSON: {logic_rigor, expiration_trigger} */
    @TableField(value = "credibility", typeHandler = com.ice.template.config.JsonbTypeHandler.class)
    private String credibility;

    /** 高密度搜索关键词，专供向量化 */
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
