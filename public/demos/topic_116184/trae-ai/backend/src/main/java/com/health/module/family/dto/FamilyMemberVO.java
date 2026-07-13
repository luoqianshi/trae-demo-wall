package com.health.module.family.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 家庭成员信息 VO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class FamilyMemberVO {

    /** 成员记录ID */
    private Long id;

    /** 用户ID */
    private Long userId;

    /** 用户姓名 */
    private String name;

    /** 角色 OWNER/MEMBER */
    private String role;

    /** 是否授权查看指标 0否 1是 */
    private Integer authorizedView;

    /** 加入时间 */
    private LocalDateTime createdAt;
}
