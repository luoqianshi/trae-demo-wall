package com.health.module.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 医生注册请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class DoctorRegisterDTO {

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

    /** 职称. */
    @NotBlank(message = "职称不能为空")
    private String title;

    /** 科室. */
    @NotBlank(message = "科室不能为空")
    private String department;

    /** 擅长领域. */
    @NotBlank(message = "擅长领域不能为空")
    private String specialties;

    /** 执业证书编号. */
    @NotBlank(message = "执业证书编号不能为空")
    private String licenseNo;

    /** 执业证书图片URL. */
    @NotBlank(message = "执业证书图片不能为空")
    private String licenseImg;
}
