package com.health.module.device.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 设备信息 VO（不含 Token，避免泄露鉴权凭证）.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class DeviceVO {

    /** 设备ID */
    private Long id;

    /** 设备类型 */
    private String deviceType;

    /** 设备型号 */
    private String model;

    /** 状态 ACTIVE/INACTIVE */
    private String status;

    /** 绑定时间 */
    private LocalDateTime boundAt;

    /** 最近同步时间 */
    private LocalDateTime lastSyncAt;
}
