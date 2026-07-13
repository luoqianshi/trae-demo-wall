package com.health.security;

import com.health.config.JwtProperties;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT 认证过滤器。
 * <p>
 * 从请求头中提取 Token，解析后设置 SecurityContext。
 * </p>
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /** 日志对象必须为 private static final */
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtUtil jwtUtil;

    private final JwtProperties jwtProperties;

    public JwtAuthenticationFilter(final JwtUtil jwtUtil, final JwtProperties jwtProperties) {
        this.jwtUtil = jwtUtil;
        this.jwtProperties = jwtProperties;
    }

    @Override
    protected void doFilterInternal(final HttpServletRequest request,
                                    final HttpServletResponse response,
                                    final FilterChain filterChain) throws ServletException, IOException {
        final String token = resolveToken(request);
        if (StringUtils.hasText(token) && jwtUtil.validateToken(token)) {
            setAuthentication(request, token);
        }
        filterChain.doFilter(request, response);
    }

    /**
     * 从请求头中提取 Token。
     */
    private String resolveToken(final HttpServletRequest request) {
        final String header = request.getHeader(jwtProperties.getHeader());
        if (StringUtils.hasText(header) && header.startsWith(jwtProperties.getPrefix())) {
            // 去除 Bearer 前缀
            return header.substring(jwtProperties.getPrefix().length());
        }
        return null;
    }

    /**
     * 解析 Token 并设置 SecurityContext。
     */
    private void setAuthentication(final HttpServletRequest request, final String token) {
        final Claims claims = jwtUtil.parseToken(token);
        if (claims == null) {
            logger.warn("Token 解析失败，跳过认证设置");
            return;
        }
        final Long userId = claims.get("userId", Long.class);
        final String role = claims.get("role", String.class);
        if (userId != null && StringUtils.hasText(role)) {
            // 构造 LoginUser 作为 Principal，密码字段不需要
            final LoginUser loginUser = new LoginUser(userId, claims.getSubject(), "", role, true);
            final UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(loginUser, null, loginUser.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
    }
}
