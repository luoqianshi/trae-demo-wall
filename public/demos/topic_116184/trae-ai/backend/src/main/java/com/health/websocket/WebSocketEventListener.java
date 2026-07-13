package com.health.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Map;

/**
 * WebSocket 会话事件监听器.
 * <p>
 * 监听 STOMP 会话的连接与断开事件，维护医生在线状态到 Redis。
 * 连接时若当前用户为医生，则设置 Redis 在线标记；断开时清除。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Component
public class WebSocketEventListener {

    /** 日志对象必须为 private static final */
    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    /** Redis 键前缀：医生在线状态，key=doctor:online:{userId} */
    private static final String DOCTOR_ONLINE_KEY_PREFIX = "doctor:online:";

    /** 角色常量：医生 */
    private static final String ROLE_DOCTOR = "DOCTOR";

    private final RedisTemplate<String, Object> redisTemplate;

    public WebSocketEventListener(final RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * 会话连接成功事件：标记医生在线.
     *
     * @param event 会话连接事件
     */
    @EventListener
    public void handleSessionConnected(final SessionConnectedEvent event) {
        final StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        final Principal principal = accessor.getUser();
        if (principal == null) {
            return;
        }

        final String userId = principal.getName();
        final String role = extractRole(accessor, principal);
        if (ROLE_DOCTOR.equals(role)) {
            redisTemplate.opsForValue().set(DOCTOR_ONLINE_KEY_PREFIX + userId, "1");
            logger.info("医生上线：userId={}", userId);
        }
    }

    /**
     * 会话断开事件：清除医生在线标记.
     *
     * @param event 会话断开事件
     */
    @EventListener
    public void handleSessionDisconnect(final SessionDisconnectEvent event) {
        final StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        final Principal principal = accessor.getUser();
        if (principal == null) {
            return;
        }

        final String userId = principal.getName();
        final String role = extractRole(accessor, principal);
        if (ROLE_DOCTOR.equals(role)) {
            redisTemplate.delete(DOCTOR_ONLINE_KEY_PREFIX + userId);
            logger.info("医生离线：userId={}", userId);
        }
    }

    /**
     * 从 Principal 或会话属性中提取角色.
     * <p>
     * 优先从 StompPrincipal 获取角色，若类型不匹配则回退到会话属性。
     * </p>
     *
     * @param accessor  STOMP 头访问器
     * @param principal 会话 Principal
     * @return 角色字符串，无法获取返回 null
     */
    private String extractRole(final StompHeaderAccessor accessor, final Principal principal) {
        if (principal instanceof final WebSocketConfig.StompPrincipal stompPrincipal) {
            return stompPrincipal.getRole();
        }

        final Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes == null) {
            return null;
        }
        return (String) sessionAttributes.get(JwtHandshakeInterceptor.ATTR_ROLE);
    }
}
