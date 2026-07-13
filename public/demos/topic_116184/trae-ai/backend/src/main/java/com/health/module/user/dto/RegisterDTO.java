package com.health.module.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;

/**
 * 用户注册请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class RegisterDTO {

    /** 手机号，匹配中国大陆手机号：1 开头，共 11 位数字. */
    @NotBlank(message = "手机号不能为空")
    @Pattern(regexp = "^1\\d{10}$", message = "手机号格式不正确，需为1开头的11位数字")
    private String phone;

    /** 短信验证码. */
    @NotBlank(message = "验证码不能为空")
    private String code;

    /** 登录密码. */
    @NotBlank(message = "密码不能为空")
    private String password;

    /** 姓名. */
    @NotBlank(message = "姓名不能为空")
    private String name;

    /** 性别 MALE/FEMALE. */
    @NotBlank(message = "性别不能为空")
    private String gender;

    /** 出生日期. */
    private LocalDate birthDate;
}
