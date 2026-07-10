package com.health.module.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 医生审核请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class DoctorAuditDTO {

    /** 审核状态 APPROVED/REJECTED. */
    @NotBlank(message = "审核状态不能为空")
    private String auditStatus;
}
