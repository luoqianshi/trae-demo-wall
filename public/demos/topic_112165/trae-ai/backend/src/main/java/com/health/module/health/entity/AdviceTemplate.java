package com.health.module.health.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 健康建议模板实体。
 * <p>
 * 按指标项与告警等级关联，提供结构化的健康指导内容。
 * </p>
 */
@Data
@TableName("advice_template")
public class AdviceTemplate {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 关联指标项 ID（NULL 表示通用建议） */
    private Long metricId;

    /** 告警等级：WARNING / DANGER */
    private String level;

    private String title;

    /** 建议内容（富文本 HTML） */
    private String content;

    private Integer version;

    private Integer enabled;

    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
