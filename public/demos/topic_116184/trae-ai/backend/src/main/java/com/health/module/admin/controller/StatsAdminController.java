package com.health.module.admin.controller;

import com.health.common.Result;
import com.health.module.admin.dto.AlertDistributionVO;
import com.health.module.admin.dto.StatsOverviewVO;
import com.health.module.admin.service.AdminService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 平台统计接口（后台）.
 * <p>
 * 提供平台概览与指标异常分布统计。
 * 权限由 SecurityConfig 中 /api/admin/** 需 ADMIN 角色控制。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@RestController
@RequestMapping("/api/admin/stats")
public class StatsAdminController {

    private final AdminService adminService;

    public StatsAdminController(final AdminService adminService) {
        this.adminService = adminService;
    }

    /**
     * 查询平台概览统计.
     * <p>
     * 包含用户总数、问诊总数、告警总数、今日活跃用户数。
     * </p>
     *
     * @return 概览统计
     */
    @GetMapping("/overview")
    public Result<StatsOverviewVO> getOverview() {
        return Result.success(adminService.getOverview());
    }

    /**
     * 查询指标异常分布统计.
     *
     * @return 异常分布列表
     */
    @GetMapping("/alerts")
    public Result<List<AlertDistributionVO>> getAlertDistribution() {
        return Result.success(adminService.getAlertDistribution());
    }
}
