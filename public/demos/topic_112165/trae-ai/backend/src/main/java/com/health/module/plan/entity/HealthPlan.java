package com.health.module.plan.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 健康计划实体，对应 health_plan 表.
 * <p>
 * 用户根据自身指标异常情况创建的改善计划，包含目标、每日任务与进度。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
@TableName("health_plan")
public class HealthPlan {

    /** 计划状态常量：进行中. */
    public static final String STATUS_ACTIVE = "ACTIVE";

    /** 计划状态常量：已完成. */
    public static final String STATUS_COMPLETED = "COMPLETED";

    /** 计划状态常量：已放弃. */
    public static final String STATUS_ABANDONED = "ABANDONED";

    /** 主键ID. */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户ID. */
    private Long userId;

    /** 计划类型（WEIGHT_LOSS/BLOOD_PRESSURE 等）. */
    private String type;

    /** 目标描述. */
    private String goal;

    /** 每日任务（JSON 数组字符串）. */
    private String tasks;

    /** 周期开始日期. */
    private LocalDate periodStart;

    /** 周期结束日期. */
    private LocalDate periodEnd;

    /** 进度百分比 0-100. */
    private Integer progress;

    /** 状态 ACTIVE/COMPLETED/ABANDONED. */
    private String status;

    /** 创建时间. */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 更新时间. */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
