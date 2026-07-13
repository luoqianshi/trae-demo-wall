package com.health.module.plan.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 积分兑换商品实体，对应 points_exchange 表.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
@TableName("points_exchange")
public class PointsExchange {

    /** 主键ID. */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 商品名称. */
    private String itemName;

    /** 商品描述. */
    private String description;

    /** 兑换所需积分. */
    private Integer pointsCost;

    /** 库存. */
    private Integer stock;

    /** 商品图片URL. */
    private String imageUrl;

    /** 是否上架 1是 0否. */
    private Integer enabled;

    /** 创建时间. */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 更新时间. */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
