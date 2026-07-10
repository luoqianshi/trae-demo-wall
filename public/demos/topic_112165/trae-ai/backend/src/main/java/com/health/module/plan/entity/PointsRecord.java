package com.health.module.plan.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 积分记录实体，对应 points_record 表.
 * <p>
 * 记录用户每次积分变动（获得/消耗），points 为正表示获得，负表示消耗。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
@TableName("points_record")
public class PointsRecord {

    /** 类型常量：获得. */
    public static final String TYPE_EARN = "EARN";

    /** 类型常量：消耗. */
    public static final String TYPE_SPEND = "SPEND";

    /** 来源常量：打卡. */
    public static final String SOURCE_CHECKIN = "CHECKIN";

    /** 来源常量：兑换. */
    public static final String SOURCE_EXCHANGE = "EXCHANGE";

    /** 来源常量：指标改善. */
    public static final String SOURCE_IMPROVE = "IMPROVE";

    /** 主键ID. */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户ID. */
    private Long userId;

    /** 积分数量（正数获得，负数消耗）. */
    private Integer points;

    /** 类型 EARN/SPEND. */
    private String type;

    /** 来源（CHECKIN/EXCHANGE/IMPROVE 等）. */
    private String source;

    /** 关联ID（计划ID/兑换项ID等），可空. */
    private Long refId;

    /** 创建时间. */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
