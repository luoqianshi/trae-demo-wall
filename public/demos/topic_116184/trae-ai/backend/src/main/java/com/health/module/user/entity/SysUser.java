package com.health.module.user.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 系统用户实体，对应 sys_user 表.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
@TableName("sys_user")
public class SysUser {

    /** 角色常量：普通用户. */
    public static final String ROLE_USER = "USER";

    /** 角色常量：医生. */
    public static final String ROLE_DOCTOR = "DOCTOR";

    /** 角色常量：管理员. */
    public static final String ROLE_ADMIN = "ADMIN";

    /** 性别常量：男. */
    public static final String GENDER_MALE = "MALE";

    /** 性别常量：女. */
    public static final String GENDER_FEMALE = "FEMALE";

    /** 状态常量：启用. */
    public static final int STATUS_ENABLED = 1;

    /** 状态常量：禁用. */
    public static final int STATUS_DISABLED = 0;

    /** 主键ID. */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 手机号（登录账号）. */
    private String phone;

    /** 密码（BCrypt加密）. */
    private String password;

    /** 姓名. */
    private String name;

    /** 性别 MALE/FEMALE. */
    private String gender;

    /** 出生日期. */
    private LocalDate birthDate;

    /** 身高(cm). */
    private BigDecimal height;

    /** 体重(kg). */
    private BigDecimal weight;

    /** 角色 USER/DOCTOR/ADMIN. */
    private String role;

    /** 状态 1启用 0禁用，null 表示尚未持久化. */
    private Integer status;

    /** 逻辑删除 0未删 1已删. */
    @TableLogic
    private Integer deleted;

    /** 创建时间. */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 更新时间. */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
