package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.ice.template.config.JsonbTypeHandler;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 研判历史记录
 */
@TableName(value = "analysis_history")
@Data
public class AnalysisHistory implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    @TableField("kb_id")
    private String kbId;

    @TableField("user_query")
    private String userQuery;

    @TableField(value = "rewritten_query", typeHandler = JsonbTypeHandler.class)
    private String rewrittenQuery;

    @TableField("retrieved_count")
    private Integer retrievedCount;

    @TableField("analysis_result")
    private String analysisResult;

    @TableField(value = "citations", typeHandler = JsonbTypeHandler.class)
    private String citations;

    @TableField("elapsed_ms")
    private Long elapsedMs;

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
