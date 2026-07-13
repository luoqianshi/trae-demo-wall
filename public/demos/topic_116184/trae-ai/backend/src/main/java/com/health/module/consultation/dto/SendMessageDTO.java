package com.health.module.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 发送问诊消息请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class SendMessageDTO {

    /** 问诊会话ID */
    @NotNull(message = "问诊会话ID不能为空")
    private Long consultationId;

    /** 内容类型 TEXT/IMAGE/VOICE */
    @NotBlank(message = "内容类型不能为空")
    private String contentType;

    /** 消息内容（文本内容或图片/语音的URL） */
    @NotBlank(message = "消息内容不能为空")
    private String content;
}
