package com.sva.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_editor_analysis")
public class EditorAnalysis {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private Long editorProjectId;

    private String sceneDetection;

    private Integer audioQuality;

    private String audioIssues;

    private String suggestions;

    private LocalDateTime analysisTime;

    @TableLogic
    private Integer isDeleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}