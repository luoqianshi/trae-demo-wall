package com.health.security;

import com.health.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 工具类，负责 Token 的生成与解析。
 */
@Component
public class JwtUtil {

    /** 日志对象必须为 private static final */
    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);

    /** JWT 中用户 ID 的声明键 */
    private static final String CLAIM_USER_ID = "userId";

    /** JWT 中用户角色的声明键 */
    private static final String CLAIM_ROLE = "role";

    private final JwtProperties jwtProperties;

    private final SecretKey secretKey;

    public JwtUtil(final JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        // 使用密钥字节数组构造 HMAC 密钥
        this.secretKey = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 生成 JWT Token。
     *
     * @param userId 用户 ID
     * @param role   用户角色
     * @return JWT 字符串
     */
    public String generateToken(final Long userId, final String role) {
        final long now = System.currentTimeMillis();
        final long expirationMs = (long) jwtProperties.getExpiration() * 60 * 60 * 1000L;
        final Date expiryDate = new Date(now + expirationMs);
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim(CLAIM_USER_ID, userId)
                .claim(CLAIM_ROLE, role)
                .issuedAt(new Date(now))
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    /**
     * 解析 Token，返回 Claims。
     *
     * @param token JWT 字符串
     * @return Claims，解析失败返回 null
     */
    public Claims parseToken(final String token) {
        try {
            return Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (final Exception e) {
            // 解析失败记录日志，不打印堆栈到控制台
            logger.warn("JWT 解析失败: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 从 Token 中提取用户 ID。
     */
    public Long getUserIdFromToken(final String token) {
        final Claims claims = parseToken(token);
        if (claims == null) {
            return null;
        }
        return claims.get(CLAIM_USER_ID, Long.class);
    }

    /**
     * 从 Token 中提取用户角色。
     */
    public String getRoleFromToken(final String token) {
        final Claims claims = parseToken(token);
        if (claims == null) {
            return null;
        }
        return claims.get(CLAIM_ROLE, String.class);
    }

    /**
     * 校验 Token 是否有效。
     */
    public boolean validateToken(final String token) {
        final Claims claims = parseToken(token);
        if (claims == null) {
            return false;
        }
        // 检查是否过期
        return claims.getExpiration().after(new Date());
    }
}
