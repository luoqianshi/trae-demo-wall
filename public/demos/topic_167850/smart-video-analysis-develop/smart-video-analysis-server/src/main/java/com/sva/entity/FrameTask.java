package com.sva.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_frame_task")
public class FrameTask {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private Long projectId;

    private Long userId;

    private Long videoId;

    private String mode;

    private String paramsJson;

    private String sourceFramesJson;

    private String resultPathsJson;

    private String comfyuiTaskId;

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
