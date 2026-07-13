package com.health.module.health.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 健康指标项实体。
 * <p>
 * 包含正常、预警、危险三档阈值，用于告警引擎计算。
 * </p>
 */
@Data
@TableName("health_metric")
public class HealthMetric {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long categoryId;

    private String name;

    private String unit;

    /** 正常范围下限 */
    private BigDecimal normalMin;

    /** 正常范围上限 */
    private BigDecimal normalMax;

    /** 预警阈值下限 */
    private BigDecimal warningMin;

    /** 预警阈值上限 */
    private BigDecimal warningMax;

    /** 危险阈值下限 */
    private BigDecimal dangerMin;

    /** 危险阈值上限 */
    private BigDecimal dangerMax;

    /** 适用性别：ALL / MALE / FEMALE */
    private String applicableGender;

    /** 适用年龄下限 */
    private Integer ageMin;

    /** 适用年龄上限 */
    private Integer ageMax;

    private Integer enabled;

    private Integer sortOrder;

    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
