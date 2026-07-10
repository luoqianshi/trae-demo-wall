package com.health.module.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

/**
 * 生成健康报告请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class GenerateReportDTO {

    /** 报告类型 WEEKLY/MONTHLY/CUSTOM */
    @NotBlank(message = "报告类型不能为空")
    private String reportType;

    /** 报告周期开始日期 */
    @NotNull(message = "周期开始日期不能为空")
    private LocalDate periodStart;

    /** 报告周期结束日期 */
    @NotNull(message = "周期结束日期不能为空")
    private LocalDate periodEnd;
}
