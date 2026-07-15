package com.sva.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_timeline_track")
public class TimelineTrack {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private Long editorProjectId;

    private String trackType;

    private String trackName;

    private Integer trackIndex;

    private Integer volume;

    private Integer isMuted;

    private Integer isLocked;

    @TableLogic
    private Integer isDeleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}