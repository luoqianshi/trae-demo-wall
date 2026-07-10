package com.health.module.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 发起问诊请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class StartConsultationDTO {

    /** 医生ID（sys_user.id） */
    @NotNull(message = "医生ID不能为空")
    private Long doctorId;

    /** 问诊类型 REALTIME/ASYNC */
    @NotBlank(message = "问诊类型不能为空")
    private String type;

    /** 主诉（异步问诊必填） */
    private String chiefComplaint;

    /** 症状描述 */
    private String symptomDesc;

    /** 持续时间 */
    private String duration;

    /** 伴随症状 */
    private String accompanying;

    /** 相关图片URL列表 */
    private List<String> images;
}
