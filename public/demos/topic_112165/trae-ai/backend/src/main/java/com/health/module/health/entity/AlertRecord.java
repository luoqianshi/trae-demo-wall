package com.health.module.health.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 告警记录实体。
 * <p>
 * 每次指标数据入库后由告警引擎计算生成，记录告警等级与状态。
 * </p>
 */
@Data
@TableName("alert_record")
public class AlertRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long metricId;

    /** 告警等级：NORMAL / WARNING / DANGER */
    private String level;

    /** 触发告警的值 */
    private String value;

    /** 状态：NEW / ACKNOWLEDGED */
    private String status;

    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 告警等级常量：正常 */
    public static final String LEVEL_NORMAL = "NORMAL";
    /** 告警等级常量：预警 */
    public static final String LEVEL_WARNING = "WARNING";
    /** 告警等级常量：危险 */
    public static final String LEVEL_DANGER = "DANGER";

    /** 状态常量：新建 */
    public static final String STATUS_NEW = "NEW";
    /** 状态常量：已知晓 */
    public static final String STATUS_ACKNOWLEDGED = "ACKNOWLEDGED";
}
