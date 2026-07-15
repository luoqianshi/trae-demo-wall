package com.sva.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_audio")
public class Audio {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private Long projectId;

    private Long userId;

    private Long videoId;

    private String filename;

    private String storagePath;

    private String bucketName;

    private Long fileSize;

    private Integer duration;

    private Integer sampleRate;

    private Integer channels;

    private String format;

    private String sourceType;

    @TableLogic
    private Integer isDeleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}