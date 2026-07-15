package com.sva.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_fusion_task")
public class FusionTask {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private Long projectId;

    private Long userId;

    private String videoIdsJson;

    private String fusionMode;

    private String scriptOutline;

    private String shotSuggestions;

    private Integer status;

    private Integer progress;

    private String errorMsg;

    @TableLogic
    private Integer isDeleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
