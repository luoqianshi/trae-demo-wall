package com.health.module.user.controller;

import com.health.common.BusinessException;
import com.health.common.Result;
import com.health.common.ResultCode;
import com.health.module.user.dto.DoctorRegisterDTO;
import com.health.module.user.dto.LoginDTO;
import com.health.module.user.dto.LoginVO;
import com.health.module.user.dto.RegisterDTO;
import com.health.module.user.dto.SendSmsDTO;
import com.health.module.user.service.SmsService;
import com.health.module.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 认证控制器，提供注册、登录、短信验证码等接口.
 * <p>
 * 路径 /api/auth/** 已在 SecurityConfig 中放行，无需认证即可访问。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final SmsService smsService;

    public AuthController(final UserService userService, final SmsService smsService) {
        this.userService = userService;
        this.smsService = smsService;
    }

    /**
     * 用户注册.
     *
     * @param dto 注册信息
     * @return 登录返回 VO
     */
    @PostMapping("/register")
    public Result<LoginVO> register(@Valid @RequestBody final RegisterDTO dto) {
        final LoginVO vo = userService.register(dto);
        return Result.success(vo);
    }

    /**
     * 登录，根据 loginType 分流为短信验证码登录或密码登录.
     *
     * @param dto 登录信息
     * @return 登录返回 VO
     */
    @PostMapping("/login")
    public Result<LoginVO> login(@Valid @RequestBody final LoginDTO dto) {
        final String loginType = dto.getLoginType();
        final LoginVO vo;
        if (LoginDTO.LOGIN_BY_SMS.equals(loginType)) {
            vo = userService.loginBySms(dto);
        } else if (LoginDTO.LOGIN_BY_PASSWORD.equals(loginType)) {
            vo = userService.loginByPassword(dto);
        } else {
            throw new BusinessException(ResultCode.PARAM_ERROR, "不支持的登录方式: " + loginType);
        }
        return Result.success(vo);
    }

    /**
     * 发送短信验证码.
     *
     * @param dto 发送验证码请求
     * @return 操作结果
     */
    @PostMapping("/sms")
    public Result<Void> sendSms(@Valid @RequestBody final SendSmsDTO dto) {
        smsService.sendSms(dto.getPhone());
        return Result.success();
    }

    /**
     * 医生注册.
     *
     * @param dto 医生注册信息
     * @return 登录返回 VO
     */
    @PostMapping("/doctor/register")
    public Result<LoginVO> doctorRegister(@Valid @RequestBody final DoctorRegisterDTO dto) {
        final LoginVO vo = userService.registerDoctor(dto);
        return Result.success(vo);
    }
}
