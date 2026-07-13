package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

@TableName(value = "agent")
@Data
public class Agent implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String name;

    private String description;

    private String avatar;

    private String status;

    @TableField("project_id")
    private String projectId;

    @TableField("workflow_id")
    private String workflowId;

    @TableField("knowledge_base_id")
    private String knowledgeBaseId;

    @TableField("model_config_id")
    private String modelConfigId;

    @TableField("core_memory")
    private String coreMemory;

    @TableField("create_time")
    private Date createTime;

    @TableField("update_time")
    private Date updateTime;

    @TableField("last_used_time")
    private Date lastUsedTime;

    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}