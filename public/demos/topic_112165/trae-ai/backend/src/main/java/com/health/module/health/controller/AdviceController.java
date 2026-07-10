package com.health.module.health.controller;

import com.health.common.Result;
import com.health.module.health.dto.AdviceVO;
import com.health.module.health.service.AdviceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 健康建议接口。
 */
@RestController
@RequestMapping("/api/health/advice")
public class AdviceController {

    private final AdviceService adviceService;

    public AdviceController(final AdviceService adviceService) {
        this.adviceService = adviceService;
    }

    /**
     * 根据指标项 ID 获取健康建议。
     *
     * @param metricId 指标项 ID
     */
    @GetMapping("/{metricId}")
    public Result<AdviceVO> getAdvice(@PathVariable final Long metricId) {
        return Result.success(adviceService.getAdvice(metricId));
    }
}
