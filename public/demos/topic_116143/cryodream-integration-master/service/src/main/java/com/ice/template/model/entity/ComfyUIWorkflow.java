package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * ComfyUI 变量化工作流（不修改用户原始 .json，存为我方副本）
 */
@TableName(value = "comfyui_workflow")
@Data
public class ComfyUIWorkflow implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    @TableField("name")
    private String name;

    @TableField("description")
    private String description;

    /** 源 .json 文件绝对路径 */
    @TableField("source_path")
    private String sourcePath;

    /** 工作流输出类型：image / video / audio（单一枚举，兼容老逻辑；新逻辑请用 outputSlots） */
    @TableField("output_type")
    private String outputType;

    /**
     * 多输出插槽（JSON 字符串，序列化自 {@code List&lt;OutputSlot&gt;}）。
     * 老工作流可能为空 —— 前端会用 outputType 生成 1 个 fallback slot 保持兼容。
     */
    @TableField("output_slots")
    private String outputSlots;

    /** 原始 UI 格式 graph JSON（TEXT） */
    @TableField("graph_json")
    private String graphJson;

    /** 可变参数 schema（JSON 字符串：节点参数定义） */
    @TableField("param_schema")
    private String paramSchema;

    /** 参数当前值（JSON 字符串） */
    @TableField("param_values")
    private String paramValues;

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
