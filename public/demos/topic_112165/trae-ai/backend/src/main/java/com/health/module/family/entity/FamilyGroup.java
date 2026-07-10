package com.health.module.family.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 家庭组实体，对应 family_group 表.
 * <p>
 * 由某用户创建，创建者自动成为 OWNER，其他成员通过邀请加入。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
@TableName("family_group")
public class FamilyGroup {

    /** 主键ID. */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 创建者用户ID. */
    private Long ownerId;

    /** 家庭组名称. */
    private String name;

    /** 创建时间. */
    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT)
    private LocalDateTime createdAt;
}
