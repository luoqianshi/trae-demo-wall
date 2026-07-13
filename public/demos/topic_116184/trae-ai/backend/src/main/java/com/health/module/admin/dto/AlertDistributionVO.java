package com.health.module.admin.dto;

import lombok.Data;

/**
 * 指标异常分布统计 VO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class AlertDistributionVO {

    /** 指标ID. */
    private Long metricId;

    /** 指标名称. */
    private String metricName;

    /** 异常告警数量. */
    private Long alertCount;
}
