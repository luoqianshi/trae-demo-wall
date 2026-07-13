package com.health.module.plan.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * 创建健康计划请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class CreatePlanDTO {

    /** 计划类型（WEIGHT_LOSS/BLOOD_PRESSURE 等）. */
    @NotBlank(message = "计划类型不能为空")
    private String type;

    /** 目标描述. */
    @NotBlank(message = "目标描述不能为空")
    private String goal;

    /** 每日任务列表. */
    @NotEmpty(message = "每日任务不能为空")
    private List<String> tasks;

    /** 周期开始日期. */
    @NotNull(message = "周期开始日期不能为空")
    private LocalDate periodStart;

    /** 周期结束日期. */
    @NotNull(message = "周期结束日期不能为空")
    private LocalDate periodEnd;
}
