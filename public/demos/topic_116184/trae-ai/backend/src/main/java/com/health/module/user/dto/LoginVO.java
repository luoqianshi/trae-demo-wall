package com.health.module.user.dto;

import lombok.Data;

/**
 * 登录成功返回 VO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class LoginVO {

    /** JWT Token. */
    private String token;

    /** 用户ID. */
    private Long userId;

    /** 姓名. */
    private String name;

    /** 角色 USER/DOCTOR/ADMIN. */
    private String role;
}
