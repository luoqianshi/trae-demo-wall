package com.health.module.user.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.health.common.BusinessException;
import com.health.common.ResultCode;
import com.health.module.user.dto.DoctorRegisterDTO;
import com.health.module.user.dto.LoginDTO;
import com.health.module.user.dto.LoginVO;
import com.health.module.user.dto.RegisterDTO;
import com.health.module.user.dto.UserProfileDTO;
import com.health.module.user.dto.UserProfileVO;
import com.health.module.user.entity.DoctorInfo;
import com.health.module.user.entity.SysUser;
import com.health.module.user.entity.UserProfile;
import com.health.module.user.mapper.DoctorInfoMapper;
import com.health.module.user.mapper.SysUserMapper;
import com.health.module.user.mapper.UserProfileMapper;
import com.health.module.user.service.SmsService;
import com.health.module.user.service.UserService;
import com.health.security.JwtUtil;
import com.health.security.SecurityUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 用户服务实现.
 *
 * @author trae
 * @date 2026-07-10
 */
@Service
public class UserServiceImpl implements UserService {

    /** 日志对象必须为 private static final. */
    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);

    private final SysUserMapper sysUserMapper;
    private final UserProfileMapper userProfileMapper;
    private final DoctorInfoMapper doctorInfoMapper;
    private final SmsService smsService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserServiceImpl(
            final SysUserMapper sysUserMapper,
            final UserProfileMapper userProfileMapper,
            final DoctorInfoMapper doctorInfoMapper,
            final SmsService smsService,
            final PasswordEncoder passwordEncoder,
            final JwtUtil jwtUtil) {
        this.sysUserMapper = sysUserMapper;
        this.userProfileMapper = userProfileMapper;
        this.doctorInfoMapper = doctorInfoMapper;
        this.smsService = smsService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LoginVO register(final RegisterDTO dto) {
        final String phone = dto.getPhone();

        // 创建用户基础信息（含验证码校验、手机号唯一性校验、密码加密、入库）
        final SysUser user = createBaseUser(phone, dto.getCode(), dto.getPassword(),
                dto.getName(), dto.getGender(), SysUser.ROLE_USER);

        // 创建用户健康档案
        final UserProfile profile = new UserProfile();
        profile.setUserId(user.getId());
        userProfileMapper.insert(profile);

        logger.info("用户注册成功: userId={}, phone={}", user.getId(), phone);

        return buildLoginResponse(user);
    }

    @Override
    public LoginVO loginBySms(final LoginDTO dto) {
        final String phone = dto.getPhone();

        // 校验验证码非空
        if (StringUtils.isBlank(dto.getCode())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "验证码不能为空");
        }

        // 校验验证码
        if (!smsService.verifyCode(phone, dto.getCode())) {
            throw new BusinessException(ResultCode.SMS_CODE_ERROR);
        }

        // 查询用户
        final SysUser user = sysUserMapper.findByPhone(phone);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND, "手机号未注册: " + phone);
        }

        // 校验账号状态
        checkUserStatus(user);

        logger.info("短信验证码登录成功: userId={}, phone={}", user.getId(), phone);

        return buildLoginResponse(user);
    }

    @Override
    public LoginVO loginByPassword(final LoginDTO dto) {
        final String phone = dto.getPhone();

        // 校验密码非空
        if (StringUtils.isBlank(dto.getPassword())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "密码不能为空");
        }

        // 查询用户
        final SysUser user = sysUserMapper.findByPhone(phone);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND, "手机号未注册: " + phone);
        }

        // BCrypt 校验密码
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new BusinessException(ResultCode.PASSWORD_ERROR, "手机号或密码错误");
        }

        // 校验账号状态
        checkUserStatus(user);

        logger.info("密码登录成功: userId={}, phone={}", user.getId(), phone);

        return buildLoginResponse(user);
    }

    @Override
    public UserProfileVO getProfile() {
        // 从安全上下文获取当前用户 ID，严禁前端传入
        final Long userId = SecurityUtils.getCurrentUserId();

        // 查询用户基础信息
        final SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND, "用户不存在: userId=" + userId);
        }

        // 查询健康档案，user_id 有唯一索引确保最多一条
        final UserProfile profile = userProfileMapper.selectOne(
                new LambdaQueryWrapper<UserProfile>().eq(UserProfile::getUserId, userId));

        // 显式赋值构造 VO，禁止反射拷贝
        final UserProfileVO vo = new UserProfileVO();
        vo.setUserId(user.getId());
        vo.setName(user.getName());
        vo.setPhone(user.getPhone());
        vo.setGender(user.getGender());
        vo.setBirthDate(user.getBirthDate());
        vo.setHeight(user.getHeight());
        vo.setWeight(user.getWeight());
        vo.setRole(user.getRole());

        if (profile != null) {
            vo.setMedicalHistory(profile.getMedicalHistory());
            vo.setAllergy(profile.getAllergy());
            vo.setMedication(profile.getMedication());
            vo.setEmergencyContact(profile.getEmergencyContact());
        }

        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateProfile(final UserProfileDTO dto) {
        // 从安全上下文获取当前用户 ID，严禁前端传入
        final Long userId = SecurityUtils.getCurrentUserId();

        // 查询现有档案，user_id 有唯一索引确保最多一条
        final UserProfile existing = userProfileMapper.selectOne(
                new LambdaQueryWrapper<UserProfile>().eq(UserProfile::getUserId, userId));

        if (existing == null) {
            // 档案不存在则创建
            final UserProfile profile = new UserProfile();
            profile.setUserId(userId);
            profile.setMedicalHistory(dto.getMedicalHistory());
            profile.setAllergy(dto.getAllergy());
            profile.setMedication(dto.getMedication());
            profile.setEmergencyContact(dto.getEmergencyContact());
            userProfileMapper.insert(profile);
        } else {
            // 更新档案（显式赋值，禁止反射拷贝）
            existing.setMedicalHistory(dto.getMedicalHistory());
            existing.setAllergy(dto.getAllergy());
            existing.setMedication(dto.getMedication());
            existing.setEmergencyContact(dto.getEmergencyContact());
            userProfileMapper.updateById(existing);
        }

        logger.info("用户档案更新成功: userId={}", userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LoginVO registerDoctor(final DoctorRegisterDTO dto) {
        final String phone = dto.getPhone();

        // 创建用户基础信息（角色为 DOCTOR）
        final SysUser user = createBaseUser(phone, dto.getCode(), dto.getPassword(),
                dto.getName(), dto.getGender(), SysUser.ROLE_DOCTOR);

        // 创建医生信息（审核状态为 PENDING）
        final DoctorInfo doctorInfo = new DoctorInfo();
        doctorInfo.setUserId(user.getId());
        doctorInfo.setTitle(dto.getTitle());
        doctorInfo.setDepartment(dto.getDepartment());
        doctorInfo.setSpecialties(dto.getSpecialties());
        doctorInfo.setLicenseNo(dto.getLicenseNo());
        doctorInfo.setLicenseImg(dto.getLicenseImg());
        doctorInfo.setAuditStatus(DoctorInfo.AUDIT_PENDING);
        doctorInfo.setRating(DoctorInfo.DEFAULT_RATING);
        doctorInfoMapper.insert(doctorInfo);

        logger.info("医生注册成功: userId={}, phone={}", user.getId(), phone);

        return buildLoginResponse(user);
    }

    /**
     * 创建用户基础信息.
     * <p>
     * 包含验证码校验、手机号唯一性校验、BCrypt 密码加密、插入 sys_user。
     * 公共逻辑抽取，避免 register 与 registerDoctor 间代码重复。
     * </p>
     *
     * @param phone    手机号
     * @param code     短信验证码
     * @param password 原始密码
     * @param name     姓名
     * @param gender   性别
     * @param role     角色
     * @return 已插入数据库的用户实体（含生成的 ID）
     */
    private SysUser createBaseUser(final String phone, final String code, final String password,
                                   final String name, final String gender, final String role) {
        // 校验验证码
        if (!smsService.verifyCode(phone, code)) {
            throw new BusinessException(ResultCode.SMS_CODE_ERROR);
        }

        // 校验手机号不重复
        final SysUser existing = sysUserMapper.findByPhone(phone);
        if (existing != null) {
            throw new BusinessException(ResultCode.USER_ALREADY_EXISTS, "手机号已注册: " + phone);
        }

        // BCrypt 加密密码
        final String encodedPassword = passwordEncoder.encode(password);

        // 构造并插入用户
        final SysUser user = new SysUser();
        user.setPhone(phone);
        user.setPassword(encodedPassword);
        user.setName(name);
        user.setGender(gender);
        user.setRole(role);
        user.setStatus(SysUser.STATUS_ENABLED);
        sysUserMapper.insert(user);

        return user;
    }

    /**
     * 校验用户账号状态是否启用.
     *
     * @param user 用户实体
     */
    private void checkUserStatus(final SysUser user) {
        final Integer status = user.getStatus();
        if (status == null || status != SysUser.STATUS_ENABLED) {
            throw new BusinessException(ResultCode.ACCOUNT_DISABLED, "账号已被禁用，请联系管理员");
        }
    }

    /**
     * 生成 JWT 并构造登录返回 VO.
     *
     * @param user 用户实体
     * @return 登录返回 VO
     */
    private LoginVO buildLoginResponse(final SysUser user) {
        final Long userId = user.getId();
        final String userRole = user.getRole();
        final String token = jwtUtil.generateToken(userId, userRole);
        return buildLoginVO(token, userId, user.getName(), userRole);
    }

    /**
     * 构造登录返回 VO.
     *
     * @param token  JWT Token
     * @param userId 用户ID
     * @param name   姓名
     * @param role   角色
     * @return 登录返回 VO
     */
    private LoginVO buildLoginVO(final String token, final Long userId, final String name, final String role) {
        final LoginVO vo = new LoginVO();
        vo.setToken(token);
        vo.setUserId(userId);
        vo.setName(name);
        vo.setRole(role);
        return vo;
    }
}
