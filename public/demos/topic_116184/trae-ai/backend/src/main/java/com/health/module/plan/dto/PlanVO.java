package com.health.module.plan.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * 健康计划展示 VO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class PlanVO {

    /** 计划ID. */
    private Long id;

    /** 计划类型. */
    private String type;

    /** 目标描述. */
    private String goal;

    /** 每日任务列表. */
    private List<String> tasks;

    /** 周期开始日期. */
    private LocalDate periodStart;

    /** 周期结束日期. */
    private LocalDate periodEnd;

    /** 进度百分比 0-100. */
    private Integer progress;

    /** 状态 ACTIVE/COMPLETED/ABANDONED. */
    private String status;
}
