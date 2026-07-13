package com.health.module.plan.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

/**
 * 计划打卡请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class CheckinDTO {

    /** 计划ID. */
    @NotNull(message = "计划ID不能为空")
    private Long planId;

    /** 打卡日期. */
    @NotNull(message = "打卡日期不能为空")
    private LocalDate taskDate;
}
