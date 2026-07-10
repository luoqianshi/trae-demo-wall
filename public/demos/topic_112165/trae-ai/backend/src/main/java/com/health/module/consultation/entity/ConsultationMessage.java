package com.health.module.consultation.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 问诊消息实体，对应 consultation_message 表.
 * <p>
 * 记录问诊会话中的每一条消息，包括文本、图片和语音类型。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
@TableName("consultation_message")
public class ConsultationMessage {

    /** 发送者类型常量：用户（患者）. */
    public static final String SENDER_USER = "USER";

    /** 发送者类型常量：医生. */
    public static final String SENDER_DOCTOR = "DOCTOR";

    /** 内容类型常量：文本. */
    public static final String CONTENT_TEXT = "TEXT";

    /** 内容类型常量：图片. */
    public static final String CONTENT_IMAGE = "IMAGE";

    /** 内容类型常量：语音. */
    public static final String CONTENT_VOICE = "VOICE";

    /** 主键ID. */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 问诊会话ID. */
    private Long consultationId;

    /** 发送者类型 USER/DOCTOR. */
    private String senderType;

    /** 内容类型 TEXT/IMAGE/VOICE. */
    private String contentType;

    /** 消息内容（文本内容或图片/语音的URL）. */
    private String content;

    /** 发送时间. */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime sentAt;

    /** 已读状态 0未读 1已读. */
    private Integer readStatus;
}
