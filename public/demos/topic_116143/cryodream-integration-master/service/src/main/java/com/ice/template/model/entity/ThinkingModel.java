package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

/**
 * 思维模型（Text-to-Tool）：将文章压成 Agent 可调用的标准化工具
 * 无需分块和向量化，直接落库生效
 */
@TableName(value = "thinking_model", autoResultMap = true)
@Data
public class ThinkingModel implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 所属知识库 ID（与知识库关联展示）
     */
    @TableField("kb_id")
    private String kbId;

    /**
     * 模型唯一标识，如 tool_swot_001
     */
    @TableField("model_id")
    private String modelId;

    /**
     * 模型中文名
     */
    @TableField("model_name")
    private String modelName;

    /**
     * 是否启用
     */
    @TableField("is_active")
    private Boolean isActive;

    /**
     * 路由分类：战略与商业 / 诊断与分析 / 流程与执行 / 表达与沟通
     */
    @TableField("routing_category")
    private String routingCategory;

    /**
     * 触发场景关键词（JSON数组）
     */
    @TableField(value = "tags", typeHandler = com.ice.template.config.JsonbTypeHandler.class)
    private String tags;

    /**
     * Function Calling 工具定义（JSON）
     * 包含 name, description, parameters
     */
    @TableField(value = "tool_schema", typeHandler = com.ice.template.config.JsonbTypeHandler.class)
    private String toolSchema;

    /**
     * 执行提示词：大模型拿到后直接干活的指令
     */
    @TableField("execution_prompt")
    private String executionPrompt;

    /**
     * 原始输入文本（来源文章内容）
     */
    @TableField("raw_text")
    private String rawText;

    /**
     * 描述
     */
    private String description;

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
     * 是否删除
     */
    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}
