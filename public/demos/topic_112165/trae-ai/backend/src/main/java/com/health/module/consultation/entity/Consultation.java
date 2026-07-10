package com.health.module.consultation.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 问诊会话实体，对应 consultation 表.
 * <p>
 * 记录一次问诊的全生命周期信息，包括主诉、症状、状态流转与评价。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
@TableName("consultation")
public class Consultation {

    /** 问诊类型常量：实时问诊. */
    public static final String TYPE_REALTIME = "REALTIME";

    /** 问诊类型常量：异步问诊. */
    public static final String TYPE_ASYNC = "ASYNC";

    /** 会话状态常量：等待中（异步问诊初始状态）. */
    public static final String STATUS_WAITING = "WAITING";

    /** 会话状态常量：进行中. */
    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";

    /** 会话状态常量：已关闭. */
    public static final String STATUS_CLOSED = "CLOSED";

    /** 主键ID. */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户（患者）ID. */
    private Long userId;

    /** 医生ID（关联 sys_user.id）. */
    private Long doctorId;

    /** 问诊类型 REALTIME/ASYNC. */
    private String type;

    /** 状态 WAITING/IN_PROGRESS/CLOSED. */
    private String status;

    /** 主诉（异步问诊）. */
    private String chiefComplaint;

    /** 症状描述. */
    private String symptomDesc;

    /** 持续时间. */
    private String duration;

    /** 伴随症状. */
    private String accompanying;

    /** 相关图片URL（JSON数组字符串，由业务层解析）. */
    private String images;

    /** 追问次数（异步问诊）. */
    private Integer replyCount;

    /** 用户评分 1-5，null 表示未评价. */
    private Integer rating;

    /** 评价内容. */
    private String ratingComment;

    /** 创建时间. */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 关闭时间，null 表示未关闭. */
    private LocalDateTime closedAt;
}
