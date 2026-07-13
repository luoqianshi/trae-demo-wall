package com.health.security;

import com.health.common.BusinessException;
import com.health.common.ResultCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 安全上下文工具类。
 * <p>
 * 严禁从外部（前端参数）获取当前用户身份，统一从此处从 SecurityContext 获取。
 * </p>
 */
public final class SecurityUtils {

    private SecurityUtils() {
        // 工具类禁止实例化
    }

    /**
     * 获取当前登录用户 ID。
     *
     * @return 用户 ID，未登录抛出业务异常
     */
    public static Long getCurrentUserId() {
        final Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        final Object principal = authentication.getPrincipal();
        if (principal instanceof final LoginUser loginUser) {
            return loginUser.getUserId();
        }
        throw new BusinessException(ResultCode.UNAUTHORIZED);
    }

    /**
     * 获取当前登录用户角色。
     *
     * @return 角色字符串，未登录抛出业务异常
     */
    public static String getCurrentRole() {
        final Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        final Object principal = authentication.getPrincipal();
        if (principal instanceof final LoginUser loginUser) {
            return loginUser.getRole();
        }
        throw new BusinessException(ResultCode.UNAUTHORIZED);
    }

    /**
     * 判断当前用户是否为指定角色。
     */
    public static boolean hasRole(final String role) {
        try {
            return role.equals(getCurrentRole());
        } catch (final BusinessException e) {
            return false;
        }
    }

    /**
     * 判断当前用户是否为管理员。
     */
    public static boolean isAdmin() {
        return hasRole("ADMIN");
    }

    /**
     * 判断当前用户是否为医生。
     */
    public static boolean isDoctor() {
        return hasRole("DOCTOR");
    }
}
