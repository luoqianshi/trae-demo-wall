package com.health.module.report.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 健康报告实体，对应 health_report 表.
 * <p>
 * 聚合用户在指定周期内的指标数据、异常项与健康建议，content 字段存储 JSON，
 * file_url 指向生成的 PDF 文件相对路径。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
@TableName("health_report")
public class HealthReport {

    /** 报告类型常量：周报. */
    public static final String TYPE_WEEKLY = "WEEKLY";

    /** 报告类型常量：月报. */
    public static final String TYPE_MONTHLY = "MONTHLY";

    /** 报告类型常量：自定义周期. */
    public static final String TYPE_CUSTOM = "CUSTOM";

    /** 主键ID. */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户ID. */
    private Long userId;

    /** 报告周期开始日期. */
    private LocalDate periodStart;

    /** 报告周期结束日期. */
    private LocalDate periodEnd;

    /** 报告类型 WEEKLY/MONTHLY/CUSTOM. */
    private String reportType;

    /** 报告内容（JSON，LONGTEXT）. */
    private String content;

    /** PDF 文件相对路径. */
    private String fileUrl;

    /** 创建时间. */
    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT)
    private LocalDateTime createdAt;
}
