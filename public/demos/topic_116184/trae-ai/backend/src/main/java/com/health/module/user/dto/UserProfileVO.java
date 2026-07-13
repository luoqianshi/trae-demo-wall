package com.health.module.user.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 用户档案返回 VO，包含用户基础信息与健康档案信息.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class UserProfileVO {

    /** 用户ID. */
    private Long userId;

    /** 姓名. */
    private String name;

    /** 手机号. */
    private String phone;

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

    /** 既往病史. */
    private String medicalHistory;

    /** 过敏史. */
    private String allergy;

    /** 用药情况. */
    private String medication;

    /** 紧急联系人及电话. */
    private String emergencyContact;
}
