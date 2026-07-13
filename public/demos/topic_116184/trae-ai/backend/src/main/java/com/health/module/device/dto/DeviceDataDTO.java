package com.health.module.device.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 设备数据上报请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class DeviceDataDTO {

    /** 指标项ID */
    @NotNull(message = "指标项ID不能为空")
    private Long metricId;

    /** 指标值 */
    @NotNull(message = "指标值不能为空")
    private String value;

    /** 采集时间（可选，默认当前时间） */
    private LocalDateTime recordedAt;
}
