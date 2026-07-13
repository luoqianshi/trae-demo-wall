package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 模型厂商表
 */
@TableName("model_provider")
@Data
public class ModelProvider implements Serializable {

    @TableField(exist = false)
    public static final long serialVersionUID = 1L;

    /**
     * id
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 厂商编码（唯一标识）
     */
    private String code;

    /**
     * 厂商名称
     */
    private String name;

    /**
     * 默认接口地址
     */
    @TableField("default_base_url")
    private String defaultBaseUrl;

    /**
     * 支持模型列表（JSON 格式）
     */
    private String models;

    /**
     * API 文档地址
     */
    @TableField("doc_url")
    private String docUrl;

    /**
     * 图标
     */
    private String icon;

    /**
     * 排序
     */
    @TableField("sort_order")
    private Integer sortOrder;

    /**
     * 状态（0-禁用，1-启用）
     */
    @TableField("status")
    private Integer status;

    /**
     * 创建时间
     */
    @TableField("create_time")
    private Date createTime;

    /**
     * 更新时间
     */
    @TableField("update_time")
    private Date updateTime;

    /**
     * 是否删除（0-未删除，1-已删除）
     */
    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;
}
