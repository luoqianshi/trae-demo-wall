package com.health.module.user.dto;

import lombok.Data;

/**
 * 用户健康档案更新请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class UserProfileDTO {

    /** 既往病史. */
    private String medicalHistory;

    /** 过敏史. */
    private String allergy;

    /** 用药情况. */
    private String medication;

    /** 紧急联系人及电话. */
    private String emergencyContact;
}
