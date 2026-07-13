package com.health.module.device.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 设备实体，对应 device 表.
 * <p>
 * 记录用户绑定的健康监测设备信息，包含设备类型、型号与鉴权 Token。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
@TableName("device")
public class Device {

    /** 设备状态常量：启用（已绑定）. */
    public static final String STATUS_ACTIVE = "ACTIVE";

    /** 设备状态常量：停用（已解绑）. */
    public static final String STATUS_INACTIVE = "INACTIVE";

    /** 主键ID. */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 绑定用户ID. */
    private Long userId;

    /** 设备类型（血压计/血糖仪等）. */
    private String deviceType;

    /** 设备型号. */
    private String model;

    /** 设备鉴权Token（唯一）. */
    private String token;

    /** 状态 ACTIVE/INACTIVE. */
    private String status;

    /** 绑定时间. */
    private LocalDateTime boundAt;

    /** 最近同步时间，null 表示尚未同步. */
    private LocalDateTime lastSyncAt;
}
