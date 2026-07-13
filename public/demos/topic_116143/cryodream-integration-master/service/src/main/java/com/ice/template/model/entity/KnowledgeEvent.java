package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

/**
 * 新版事件追踪表（PRD: OPC 知识库事件模块）
 * 设计理念：事件为中心、自包含（实体内嵌）、可信度评估、影响推演、双写检索
 */
@TableName(value = "knowledge_events")
@Data
public class KnowledgeEvent implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    @TableField("kb_id")
    private String kbId;

    @TableField("doc_id")
    private String docId;

    @TableField("event_date")
    private Date eventDate;

    /** 时间粒度: exact(精确到日), month(精确到月), year(精确到年) */
    @TableField("time_granularity")
    private String timeGranularity;

    /** 浓缩关键词，专供向量化使用 */
    @TableField("search_index")
    private String searchIndex;

    /** 参与主体数组 JSON */
    @TableField(value = "entities", typeHandler = com.ice.template.config.JsonbTypeHandler.class)
    private String entities;

    /** 事件核心动作（一句话总结） */
    @TableField("action")
    private String action;

    /** 信息来源类型: official/news/social_media */
    @TableField("source_type")
    private String sourceType;

    /** LLM 评估置信度 1-10 */
    @TableField("confidence_score")
    private Integer confidenceScore;

    /** 验证状态: verified/unverified */
    @TableField("verification_status")
    private String verificationStatus;

    /** LLM 推演的商业影响 */
    @TableField("impact_inference")
    private String impactInference;

    @TableField("source_url")
    private String sourceUrl;

    @TableField("create_time")
    private Date createTime;

    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}
