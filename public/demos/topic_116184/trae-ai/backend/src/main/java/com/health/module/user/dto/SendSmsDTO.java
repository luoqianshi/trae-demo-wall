package com.health.module.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 发送短信验证码请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class SendSmsDTO {

    /** 手机号，匹配中国大陆手机号：1 开头，共 11 位数字. */
    @NotBlank(message = "手机号不能为空")
    @Pattern(regexp = "^1\\d{10}$", message = "手机号格式不正确，需为1开头的11位数字")
    private String phone;
}
