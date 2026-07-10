package com.health.module.user.service;

import com.health.module.user.entity.SysUser;
import com.health.module.user.mapper.SysUserMapper;
import com.health.security.LoginUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Spring Security UserDetailsService 实现.
 * <p>
 * 供 Spring Security 认证流程使用（如 AuthenticationManager）。
 * JWT 过滤器中不走此处，JwtAuthenticationFilter 直接从 Token 解析用户信息。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    /** 日志对象必须为 private static final. */
    private static final Logger logger = LoggerFactory.getLogger(UserDetailsServiceImpl.class);

    private final SysUserMapper sysUserMapper;

    public UserDetailsServiceImpl(final SysUserMapper sysUserMapper) {
        this.sysUserMapper = sysUserMapper;
    }

    @Override
    public UserDetails loadUserByUsername(final String phone) throws UsernameNotFoundException {
        final SysUser user = sysUserMapper.findByPhone(phone);
        if (user == null) {
            throw new UsernameNotFoundException("手机号未注册: " + phone);
        }

        final Integer status = user.getStatus();
        final boolean enabled = status != null && status == SysUser.STATUS_ENABLED;

        logger.debug("加载用户详情: userId={}, phone={}", user.getId(), phone);

        return new LoginUser(user.getId(), user.getPhone(), user.getPassword(), user.getRole(), enabled);
    }
}
