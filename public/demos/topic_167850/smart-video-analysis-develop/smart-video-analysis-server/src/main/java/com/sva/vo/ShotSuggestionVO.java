package com.sva.vo;

import lombok.Data;

@Data
public class ShotSuggestionVO {
    private Integer index;
    private String sourceVideoId;
    private String sourceVideoName;
    private String shotType;
    private String description;
    private String duration;
    private String tags;
    private String prompt;
}
