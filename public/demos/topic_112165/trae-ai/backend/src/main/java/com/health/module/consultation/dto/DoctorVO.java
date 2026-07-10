package com.health.module.consultation.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 医生列表展示 VO.
 * <p>
 * id 为医生的 sys_user.id，用于发起问诊时引用。
 * online 字段由服务层从 Redis 在线状态填充。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class DoctorVO {

    /** 医生用户ID（sys_user.id） */
    private Long id;

    /** 医生姓名 */
    private String name;

    /** 职称 */
    private String title;

    /** 科室 */
    private String department;

    /** 擅长领域 */
    private String specialties;

    /** 评分 */
    private BigDecimal rating;

    /** 是否在线（由服务层从 Redis 填充） */
    private Boolean online;
}
