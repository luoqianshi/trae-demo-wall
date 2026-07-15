package com.sva.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_video_frame")
public class VideoFrame {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private Long videoId;

    private Long analysisId;

    private Integer frameIndex;

    private Long timestampMs;

    private String storagePath;

    private String bucketName;

    private String sceneTags;

    private String promptText;

    private Integer isKeyFrame;

    @TableLogic
    private Integer isDeleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
