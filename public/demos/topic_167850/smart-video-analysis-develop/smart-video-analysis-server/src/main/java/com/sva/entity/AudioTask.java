package com.sva.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_audio_task")
public class AudioTask {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private Long projectId;

    private Long userId;

    private Long sourceAudioId;

    private String mode;

    private String voiceId;

    private String voiceName;

    private String textContent;

    private String paramsJson;

    private String resultPath;

    private String resultBucket;

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