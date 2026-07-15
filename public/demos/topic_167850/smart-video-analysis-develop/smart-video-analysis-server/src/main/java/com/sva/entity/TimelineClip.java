package com.sva.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_timeline_clip")
public class TimelineClip {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private Long trackId;

    private String sourceType;

    private String sourceId;

    private String sourcePath;

    private String bucketName;

    private String clipName;

    private Long startPosition;

    private Long duration;

    private Long sourceStart;

    private Long sourceDuration;

    private Integer volume;

    private Integer opacity;

    private Double speed;

    private String inTransition;

    private String outTransition;

    private Integer transitionDuration;

    private String effects;

    @TableLogic
    private Integer isDeleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}