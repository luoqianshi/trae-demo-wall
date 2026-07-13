package com.health.module.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 登录请求 DTO.
 * <p>
 * 支持短信验证码登录与密码登录，由 loginType 决定校验与认证流程。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class LoginDTO {

    /** 登录方式常量：短信验证码登录. */
    public static final String LOGIN_BY_SMS = "LOGIN_BY_SMS";

    /** 登录方式常量：密码登录. */
    public static final String LOGIN_BY_PASSWORD = "LOGIN_BY_PASSWORD";

    /** 手机号，匹配中国大陆手机号：1 开头，共 11 位数字. */
    @NotBlank(message = "手机号不能为空")
    @Pattern(regexp = "^1\\d{10}$", message = "手机号格式不正确，需为1开头的11位数字")
    private String phone;

    /** 短信验证码（loginType 为 LOGIN_BY_SMS 时必填）. */
    private String code;

    /** 密码（loginType 为 LOGIN_BY_PASSWORD 时必填）. */
    private String password;

    /** 登录方式 LOGIN_BY_SMS / LOGIN_BY_PASSWORD. */
    @NotBlank(message = "登录方式不能为空")
    private String loginType;
}
