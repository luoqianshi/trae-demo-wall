package com.health.module.admin.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 医生管理列表展示 VO.
 * <p>
 * 包含医生基本信息与审核状态。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class DoctorAdminVO {

    /** 医生用户ID（sys_user.id）. */
    private Long userId;

    /** 医生姓名. */
    private String name;

    /** 手机号. */
    private String phone;

    /** 职称. */
    private String title;

    /** 科室. */
    private String department;

    /** 擅长领域. */
    private String specialties;

    /** 执业证书编号. */
    private String licenseNo;

    /** 审核状态 PENDING/APPROVED/REJECTED. */
    private String auditStatus;

    /** 评分. */
    private BigDecimal rating;

    /** 创建时间. */
    private LocalDateTime createdAt;
}
