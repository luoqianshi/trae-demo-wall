package com.health.module.user.service;

import com.health.module.user.dto.DoctorRegisterDTO;
import com.health.module.user.dto.LoginDTO;
import com.health.module.user.dto.LoginVO;
import com.health.module.user.dto.RegisterDTO;
import com.health.module.user.dto.UserProfileDTO;
import com.health.module.user.dto.UserProfileVO;

/**
 * 用户服务接口，提供注册、登录、档案管理等功能.
 *
 * @author trae
 * @date 2026-07-10
 */
public interface UserService {

    /**
     * 用户注册.
     * <p>
     * 校验验证码、校验手机号不重复、BCrypt 加密密码、插入用户与档案、生成 JWT。
     * </p>
     *
     * @param dto 注册信息
     * @return 登录返回 VO
     */
    LoginVO register(RegisterDTO dto);

    /**
     * 短信验证码登录.
     *
     * @param dto 登录信息
     * @return 登录返回 VO
     */
    LoginVO loginBySms(LoginDTO dto);

    /**
     * 密码登录.
     *
     * @param dto 登录信息
     * @return 登录返回 VO
     */
    LoginVO loginByPassword(LoginDTO dto);

    /**
     * 获取当前用户档案.
     * <p>
     * 从安全上下文获取当前用户 ID，严禁前端传入。
     * </p>
     *
     * @return 用户档案 VO
     */
    UserProfileVO getProfile();

    /**
     * 更新当前用户健康档案.
     *
     * @param dto 档案信息
     */
    void updateProfile(UserProfileDTO dto);

    /**
     * 医生注册.
     * <p>
     * 插入 sys_user（role=DOCTOR）与 doctor_info（audit_status=PENDING），生成 JWT。
     * </p>
     *
     * @param dto 医生注册信息
     * @return 登录返回 VO
     */
    LoginVO registerDoctor(DoctorRegisterDTO dto);
}
