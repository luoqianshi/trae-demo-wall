package com.ice.template.model.dto.diary;

import java.util.Date;
import lombok.Data;

@Data
public class MilestoneAddRequest {
    private String title;
    private String description;
    private Date targetDate;
    private String color;
    private Integer sort;
}
