package com.sva.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 音色 VO
 */
@Data
public class VoiceVO {

    private String id;
    private String userId;
    private String voiceName;
    private String description;
    private String gender;
    private String language;
    private String featurePath;
    private String sourceAudioId;
    private Boolean isSystem;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}