package com.sva.vo;

import lombok.Data;

import java.util.List;

@Data
public class ImageSearchResultVO {

    private Long videoId;

    private String videoFilename;

    private String thumbnailUrl;

    private Double similarity;

    private Long matchStartTimeMs;

    private Long matchEndTimeMs;

    private String matchStartTime;

    private String matchEndTime;

    private String sceneDescription;

    private List<String> sceneTags;

    private Double videoDuration;
}
