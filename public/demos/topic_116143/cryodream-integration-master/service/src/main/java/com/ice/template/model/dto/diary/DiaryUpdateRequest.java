package com.ice.template.model.dto.diary;

import java.util.Date;
import lombok.Data;

@Data
public class DiaryUpdateRequest {
    private String id;
    private String title;
    private String content;
    private String summary;
    private String category;
    private String mood;
    private Integer moodScore;
    private Date diaryDate;
}
