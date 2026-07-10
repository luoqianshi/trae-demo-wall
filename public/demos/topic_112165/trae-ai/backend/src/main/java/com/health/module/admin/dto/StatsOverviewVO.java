package com.health.module.admin.dto;

import lombok.Data;

/**
 * 平台概览统计 VO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class StatsOverviewVO {

    /** 用户总数. */
    private Long userCount;

    /** 问诊总数. */
    private Long consultationCount;

    /** 告警总数. */
    private Long alertCount;

    /** 今日活跃用户数. */
    private Long todayActiveCount;
}
