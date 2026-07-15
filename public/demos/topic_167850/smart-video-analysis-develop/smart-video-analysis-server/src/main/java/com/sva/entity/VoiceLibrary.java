package com.sva.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_voice_library")
public class VoiceLibrary {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private Long userId;

    private String voiceName;

    private String description;

    private String gender;

    private String language;

    private String featurePath;

    private Long sourceAudioId;

    private Integer isSystem;

    @TableLogic
    private Integer isDeleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}