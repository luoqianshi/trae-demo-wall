package com.health.module.consultation.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 问诊消息展示 VO.
 * <p>
 * 包含消息内容以及发送者信息（由服务层根据会话关联关系填充）。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class MessageVO {

    /** 消息ID */
    private Long id;

    /** 问诊会话ID */
    private Long consultationId;

    /** 发送者类型 USER/DOCTOR */
    private String senderType;

    /** 内容类型 TEXT/IMAGE/VOICE */
    private String contentType;

    /** 消息内容（文本内容或图片/语音的URL） */
    private String content;

    /** 发送时间 */
    private LocalDateTime sentAt;

    /** 已读状态 0未读 1已读 */
    private Integer readStatus;

    /** 发送者ID（根据会话关联关系推导） */
    private Long senderId;

    /** 发送者姓名 */
    private String senderName;
}
