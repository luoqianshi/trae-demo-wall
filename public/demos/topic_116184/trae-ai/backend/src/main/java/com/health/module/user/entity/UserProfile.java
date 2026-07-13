package com.health.module.user.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户健康档案实体，对应 user_profile 表.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
@TableName("user_profile")
public class UserProfile {

    /** 主键ID. */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户ID（关联 sys_user）. */
    private Long userId;

    /** 既往病史. */
    private String medicalHistory;

    /** 过敏史. */
    private String allergy;

    /** 用药情况. */
    private String medication;

    /** 紧急联系人及电话. */
    private String emergencyContact;

    /** 创建时间. */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 更新时间. */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
