package com.health.websocket;

import com.health.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.Map;

/**
 * WebSocket 握手拦截器.
 * <p>
 * 从握手请求的查询参数中提取 JWT Token，验证后将用户 ID 和角色存入会话属性。
 * 验证失败则拒绝握手，保障 WebSocket 连接的安全性。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    /** 日志对象必须为 private static final */
    private static final Logger logger = LoggerFactory.getLogger(JwtHandshakeInterceptor.class);

    /** 查询参数名：token */
    private static final String PARAM_TOKEN = "token";

    /** 会话属性键：用户ID */
    public static final String ATTR_USER_ID = "userId";

    /** 会话属性键：角色 */
    public static final String ATTR_ROLE = "role";

    private final JwtUtil jwtUtil;

    public JwtHandshakeInterceptor(final JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public boolean beforeHandshake(final ServerHttpRequest request,
                                   final ServerHttpResponse response,
                                   final WebSocketHandler wsHandler,
                                   final Map<String, Object> attributes) {
        final String token = extractTokenFromQuery(request);
        if (token == null || !jwtUtil.validateToken(token)) {
            logger.warn("WebSocket 握手失败：Token 无效或缺失");
            return false;
        }

        final Long userId = jwtUtil.getUserIdFromToken(token);
        final String role = jwtUtil.getRoleFromToken(token);
        if (userId == null || role == null) {
            logger.warn("WebSocket 握手失败：Token 中缺少用户信息");
            return false;
        }

        // 将用户身份存入会话属性，供后续事件监听器使用
        attributes.put(ATTR_USER_ID, String.valueOf(userId));
        attributes.put(ATTR_ROLE, role);
        logger.debug("WebSocket 握手成功：userId={}, role={}", userId, role);
        return true;
    }

    @Override
    public void afterHandshake(final ServerHttpRequest request,
                               final ServerHttpResponse response,
                               final WebSocketHandler wsHandler,
                               final Exception exception) {
        // 握手后无需额外处理
    }

    /**
     * 从请求 URI 查询参数中提取 Token.
     *
     * @param request 服务端 HTTP 请求
     * @return Token 字符串，不存在返回 null
     */
    private String extractTokenFromQuery(final ServerHttpRequest request) {
        final URI uri = request.getURI();
        final String query = uri.getQuery();
        if (query == null) {
            return null;
        }

        // 解析查询参数，不使用字符串拼接构建 URL，仅做参数提取
        final String[] pairs = query.split("&");
        for (final String pair : pairs) {
            final int idx = pair.indexOf('=');
            if (idx > 0 && PARAM_TOKEN.equals(pair.substring(0, idx))) {
                return pair.substring(idx + 1);
            }
        }
        return null;
    }
}
