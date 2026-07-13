package com.ice.template.model.dto.diary;

import java.util.Date;
import lombok.Data;

@Data
public class DiaryAddRequest {
    private String title;
    private String content;
    private String category;
    private String mood;
    private String audioUrl;
    private Integer audioDurationSec;
    private Date diaryDate;
    /** 触发 AI 分析时使用的模型配置 ID（可选，不传则跳过 AI 分析） */
    private String modelConfigId;
}
