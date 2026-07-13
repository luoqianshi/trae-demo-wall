package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

@TableName(value = "workflow")
@Data
public class Workflow implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    @TableField("project_id")
    private String projectId;

    private String name;

    private String description;

    private String status;

    private Integer version;

    @TableField("source_template_id")
    private String sourceTemplateId;

    @TableField("graph_json")
    private String graphJson;

    @TableField("node_count")
    private Integer nodeCount;

    @TableField("edge_count")
    private Integer edgeCount;

    @TableField("last_run_status")
    private String lastRunStatus;

    @TableField("is_template")
    private Integer isTemplate;

    private String category;

    private String tags;

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
