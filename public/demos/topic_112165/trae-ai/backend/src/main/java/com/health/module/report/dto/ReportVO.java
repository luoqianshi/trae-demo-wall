package com.health.module.report.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 健康报告信息 VO（列表展示用，不含大字段 content）.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class ReportVO {

    /** 报告ID */
    private Long id;

    /** 报告类型 */
    private String reportType;

    /** 报告周期开始日期 */
    private LocalDate periodStart;

    /** 报告周期结束日期 */
    private LocalDate periodEnd;

    /** PDF 文件下载路径 */
    private String fileUrl;

    /** 创建时间 */
    private LocalDateTime createdAt;
}
