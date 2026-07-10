package com.health.module.device.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 设备绑定请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class BindDeviceDTO {

    /** 设备类型（血压计/血糖仪等） */
    @NotBlank(message = "设备类型不能为空")
    private String deviceType;

    /** 设备型号（可选） */
    private String model;

    /** 设备鉴权Token */
    @NotBlank(message = "设备Token不能为空")
    private String token;
}
