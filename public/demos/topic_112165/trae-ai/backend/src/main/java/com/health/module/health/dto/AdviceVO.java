package com.health.module.health.dto;

import lombok.Data;

/**
 * 健康建议 VO。
 */
@Data
public class AdviceVO {

    private Long id;

    private String title;

    /** 建议内容（富文本 HTML） */
    private String content;

    /** 告警等级 */
    private String level;
}
