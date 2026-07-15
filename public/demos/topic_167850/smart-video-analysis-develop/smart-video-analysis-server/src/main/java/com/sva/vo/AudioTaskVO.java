package com.sva.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 音频创作任务结果 VO
 */
@Data
public class AudioTaskVO {

    private String id;
    private String projectId;
    private String sourceAudioId;
    private String mode;
    private String modeName;
    private String voiceId;
    private String voiceName;
    private String textContent;
    private Map<String, Object> params;
    private String resultPath;
    private String resultBucket;
    private String resultUrl;
    private Integer status;
    private Integer progress;
    private String errorMsg;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}