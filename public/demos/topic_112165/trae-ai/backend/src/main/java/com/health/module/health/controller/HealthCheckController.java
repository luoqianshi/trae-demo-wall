package com.health.module.health.controller;

import com.health.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 健康检查接口，用于验证服务是否正常启动。
 */
@RestController
@RequestMapping("/api/health")
public class HealthCheckController {

    /**
     * 健康检查 ping 接口。
     */
    @GetMapping("/ping")
    public Result<Map<String, String>> ping() {
        return Result.success(Map.of("status", "ok", "service", "health-monitor-backend"));
    }
}
