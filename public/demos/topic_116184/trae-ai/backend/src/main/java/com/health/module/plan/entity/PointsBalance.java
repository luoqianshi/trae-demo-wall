package com.health.module.plan.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 积分余额实体，对应 points_balance 表.
 * <p>
 * 每个用户一条余额记录，user_id 唯一。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
@TableName("points_balance")
public class PointsBalance {

    /** 主键ID. */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户ID. */
    private Long userId;

    /** 积分余额. */
    private Integer balance;

    /** 更新时间. */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
