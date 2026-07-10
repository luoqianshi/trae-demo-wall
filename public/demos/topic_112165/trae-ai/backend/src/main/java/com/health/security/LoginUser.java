package com.health.security;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/**
 * 登录用户信息，作为 Spring Security 的 Principal。
 * <p>
 * 携带用户 ID 与角色，避免在业务层重复查询数据库。
 * </p>
 */
@Getter
@AllArgsConstructor
public class LoginUser implements UserDetails {

    /** 用户 ID */
    private final Long userId;

    /** 用户名（手机号） */
    private final String username;

    /** 密码（加密后） */
    private final String password;

    /** 角色：USER / DOCTOR / ADMIN */
    private final String role;

    /** 账号是否启用 */
    private final boolean enabled;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // 角色前缀 ROLE_ 是 Spring Security 约定
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
