package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

/**
 * 全局实体表（knowledge_entities）
 * 设计理念：统一命名规范（消歧义）+ 存储实体背景（提供上下文）+ 别名检索
 * 实体类型：Person 人物 / Company 公司 / Product 产品 / Concept 概念
 */
@TableName(value = "knowledge_entities")
@Data
public class KnowledgeEntity implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    @TableField("kb_id")
    private String kbId;

    /** 标准唯一名称 */
    @TableField("name")
    private String name;

    /** 实体类型: Person / Company / Product / Concept */
    @TableField("type")
    private String type;

    /** 别名数组 JSON: ["马斯克", "老马"] */
    @TableField(value = "aliases", typeHandler = com.ice.template.config.JsonbTypeHandler.class)
    private String aliases;

    /** LLM 自动生成的简短背景介绍 */
    @TableField("description")
    private String description;

    /** 动态属性 JSON，根据 type 不同存放不同数据 */
    @TableField(value = "metadata", typeHandler = com.ice.template.config.JsonbTypeHandler.class)
    private String metadata;

    @TableField("create_time")
    private Date createTime;

    @TableField("update_time")
    private Date updateTime;

    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}
