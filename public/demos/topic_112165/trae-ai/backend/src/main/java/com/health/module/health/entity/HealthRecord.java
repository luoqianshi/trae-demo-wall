package com.health.module.health.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 健康指标记录实体。
 * <p>
 * 每条记录对应一次指标数据采集，来源可为手动录入、设备上报或体检导入。
 * </p>
 */
@Data
@TableName("health_record")
public class HealthRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long metricId;

    /** 指标值（字符串兼容数值型与文本型指标） */
    private String value;

    private String unit;

    /** 数据来源：MANUAL / DEVICE / IMPORT */
    private String source;

    /** 设备 ID（来源为 DEVICE 时填写） */
    private Long deviceId;

    /** 采集时间 */
    private LocalDateTime recordedAt;

    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 来源常量：手动录入 */
    public static final String SOURCE_MANUAL = "MANUAL";
    /** 来源常量：设备上报 */
    public static final String SOURCE_DEVICE = "DEVICE";
    /** 来源常量：体检导入 */
    public static final String SOURCE_IMPORT = "IMPORT";
}
