package com.health.module.family.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 家庭成员实体，对应 family_member 表.
 * <p>
 * 记录用户在家庭组中的角色与指标查看授权状态。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
@TableName("family_member")
public class FamilyMember {

    /** 角色常量：创建者. */
    public static final String ROLE_OWNER = "OWNER";

    /** 角色常量：普通成员. */
    public static final String ROLE_MEMBER = "MEMBER";

    /** 授权状态常量：已授权查看指标. */
    public static final int AUTHORIZED_YES = 1;

    /** 授权状态常量：未授权查看指标. */
    public static final int AUTHORIZED_NO = 0;

    /** 主键ID. */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 家庭组ID. */
    private Long groupId;

    /** 成员用户ID. */
    private Long userId;

    /** 角色 OWNER/MEMBER. */
    private String role;

    /** 是否授权查看指标 0否 1是，null 表示尚未持久化. */
    private Integer authorizedView;

    /** 创建时间. */
    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT)
    private LocalDateTime createdAt;
}
