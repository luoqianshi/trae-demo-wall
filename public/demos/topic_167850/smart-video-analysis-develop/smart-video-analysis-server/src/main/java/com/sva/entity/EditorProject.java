package com.sva.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_editor_project")
public class EditorProject {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private Long userId;

    private Long projectId;

    private String name;

    private String description;

    private String timelineData;

    private Long duration;

    private String resolution;

    private Integer fps;

    private Integer status;

    private Integer exportProgress;

    private String exportResultPath;

    @TableLogic
    private Integer isDeleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}