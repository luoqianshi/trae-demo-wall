package com.health.module.health.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 指标项 VO（含最新值与告警等级）。
 */
@Data
public class MetricVO {

    private Long id;

    private Long categoryId;

    private String name;

    private String unit;

    /** 正常范围描述（如 "90-120"） */
    private String normalRange;

    /** 最新值 */
    private String value;

    /** 告警等级：NORMAL / WARNING / DANGER */
    private String alertLevel;

    /** 最近采集时间 */
    private LocalDateTime recordedAt;
}
