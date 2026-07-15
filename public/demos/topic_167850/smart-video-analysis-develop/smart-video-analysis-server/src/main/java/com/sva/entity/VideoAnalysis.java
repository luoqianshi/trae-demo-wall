package com.sva.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_video_analysis")
public class VideoAnalysis {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private Long videoId;

    private String transcriptJson;

    private String framesJson;

    private String promptsJson;

    private String summary;

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
