package com.health.module.health.controller;

import com.health.common.Result;
import com.health.module.health.dto.HealthDashboardVO;
import com.health.module.health.dto.ReportMetricDTO;
import com.health.module.health.entity.HealthRecord;
import com.health.module.health.service.HealthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 健康指标监控接口。
 * <p>
 * 提供看板数据、指标上报、趋势查询等功能。
 * </p>
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final HealthService healthService;

    public HealthController(final HealthService healthService) {
        this.healthService = healthService;
    }

    /**
     * 获取健康看板数据（含状态概览与大类卡片）。
     */
    @GetMapping("/dashboard")
    public Result<HealthDashboardVO> getDashboard() {
        return Result.success(healthService.getDashboard());
    }

    /**
     * 上报指标数据，返回计算后的告警等级。
     */
    @PostMapping("/records")
    public Result<Map<String, String>> reportMetric(@Valid @RequestBody final ReportMetricDTO dto) {
        final String alertLevel = healthService.reportMetric(dto);
        return Result.success(Map.of("alertLevel", alertLevel));
    }

    /**
     * 获取指标趋势数据。
     *
     * @param metricId 指标项 ID
     * @param days     天数（默认 7）
     */
    @GetMapping("/records/trend")
    public Result<List<HealthRecord>> getTrend(
            @RequestParam final Long metricId,
            @RequestParam(defaultValue = "7") final int days) {
        return Result.success(healthService.getTrend(metricId, days));
    }
}
