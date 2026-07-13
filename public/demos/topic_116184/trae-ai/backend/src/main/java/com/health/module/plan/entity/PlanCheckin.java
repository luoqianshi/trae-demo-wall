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
 * 计划打卡记录实体，对应 plan_checkin 表.
 * <p>
 * 记录用户某天对某计划的打卡情况，(plan_id, task_date) 唯一。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
@TableName("plan_checkin")
public class PlanCheckin {

    /** 主键ID. */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 计划ID. */
    private Long planId;

    /** 用户ID. */
    private Long userId;

    /** 打卡日期. */
    private LocalDate taskDate;

    /** 是否完成 0否 1是. */
    private Integer completed;

    /** 创建时间. */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
