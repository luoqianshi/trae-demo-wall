package com.health.module.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 医生异步回复请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class ReplyDTO {

    /** 问诊会话ID */
    @NotNull(message = "问诊会话ID不能为空")
    private Long consultationId;

    /** 回复内容 */
    @NotBlank(message = "回复内容不能为空")
    private String content;
}
