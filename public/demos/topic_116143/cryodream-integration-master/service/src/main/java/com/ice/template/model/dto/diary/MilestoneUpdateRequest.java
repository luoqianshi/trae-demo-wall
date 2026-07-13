package com.ice.template.model.dto.diary;

import java.util.Date;
import lombok.Data;

@Data
public class MilestoneUpdateRequest {
    private String id;
    private String title;
    private String description;
    private Date targetDate;
    private String status;
    private String color;
    private Integer sort;
    private String linkedDiaryId;
}
