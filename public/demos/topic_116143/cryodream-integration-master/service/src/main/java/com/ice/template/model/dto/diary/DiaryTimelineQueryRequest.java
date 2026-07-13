package com.ice.template.model.dto.diary;

import lombok.Data;

@Data
public class DiaryTimelineQueryRequest {
    /** 粒度：day / week / month */
    private String granularity = "day";
    private String startDate;
    private String endDate;
    private String category;
    private String mood;
}
