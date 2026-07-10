package com.health.module.user.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 医生信息实体，对应 doctor_info 表.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
@TableName("doctor_info")
public class DoctorInfo {

    /** 审核状态常量：待审核. */
    public static final String AUDIT_PENDING = "PENDING";

    /** 审核状态常量：已通过. */
    public static final String AUDIT_APPROVED = "APPROVED";

    /** 审核状态常量：已拒绝. */
    public static final String AUDIT_REJECTED = "REJECTED";

    /** 默认评分（注册时初始化）. */
    public static final BigDecimal DEFAULT_RATING = BigDecimal.valueOf(5.0);

    /** 主键ID. */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户ID（关联 sys_user）. */
    private Long userId;

    /** 职称. */
    private String title;

    /** 科室. */
    private String department;

    /** 擅长领域. */
    private String specialties;

    /** 执业证书编号. */
    private String licenseNo;

    /** 执业证书图片URL. */
    private String licenseImg;

    /** 审核状态 PENDING/APPROVED/REJECTED. */
    private String auditStatus;

    /** 评分. */
    private BigDecimal rating;

    /** 创建时间. */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 更新时间. */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
