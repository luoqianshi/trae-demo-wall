package com.sva.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class FrameTaskVO {

    private String id;
    private String projectId;
    private String videoId;
    private String mode;
    private String modeName;
    private Map<String, Object> params;
    private List<Map<String, Object>> sourceFrames;
    private List<Map<String, Object>> results;
    private String comfyuiTaskId;
    private Integer status;
    private Integer progress;
    private String errorMsg;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
