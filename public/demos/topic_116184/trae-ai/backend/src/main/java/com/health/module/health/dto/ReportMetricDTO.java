package com.health.module.health.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 指标数据上报请求 DTO。
 */
@Data
public class ReportMetricDTO {

    /** 指标项 ID */
    @NotNull(message = "指标项ID不能为空")
    private Long metricId;

    /** 指标值 */
    @NotNull(message = "指标值不能为空")
    private String value;

    /** 采集时间（可选，默认当前时间） */
    private LocalDateTime recordedAt;

    /** 数据来源（可选，默认 MANUAL） */
    private String source;
}
