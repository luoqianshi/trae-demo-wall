package com.health.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

/**
 * WebSocket STOMP 消息代理配置.
 * <p>
 * 配置 STOMP 端点 /ws，消息代理前缀 /topic，应用前缀 /app。
 * 握手时通过 JwtHandshakeInterceptor 验证 Token 并设置 Principal。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtHandshakeInterceptor jwtHandshakeInterceptor;

    public WebSocketConfig(final JwtHandshakeInterceptor jwtHandshakeInterceptor) {
        this.jwtHandshakeInterceptor = jwtHandshakeInterceptor;
    }

    @Override
    public void registerStompEndpoints(final StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(jwtHandshakeInterceptor)
                .setHandshakeHandler(new StompHandshakeHandler());
    }

    @Override
    public void configureMessageBroker(final MessageBrokerRegistry registry) {
        // 客户端发送消息到服务端的应用前缀
        registry.setApplicationDestinationPrefixes("/app");
        // 服务端推送给客户端的消息代理前缀
        registry.enableSimpleBroker("/topic");
    }

    /**
     * 自定义握手处理器，从会话属性中读取用户身份并设置 Principal.
     * <p>
     * JwtHandshakeInterceptor 已在握手前将 userId 和 role 存入 attributes，
     * 此处据此构造 Principal 供后续 STOMP 会话使用。
     * </p>
     */
    private static class StompHandshakeHandler extends DefaultHandshakeHandler {

        @Override
        protected Principal determineUser(final ServerHttpRequest request,
                                          final WebSocketHandler wsHandler,
                                          final Map<String, Object> attributes) {
            final String userId = (String) attributes.get(JwtHandshakeInterceptor.ATTR_USER_ID);
            final String role = (String) attributes.get(JwtHandshakeInterceptor.ATTR_ROLE);
            if (userId == null) {
                return null;
            }
            return new StompPrincipal(userId, role);
        }
    }

    /**
     * STOMP 会话的 Principal 实现，携带用户 ID 和角色.
     */
    public static class StompPrincipal implements Principal {

        private final String userId;

        private final String role;

        StompPrincipal(final String userId, final String role) {
            this.userId = userId;
            this.role = role;
        }

        @Override
        public String getName() {
            return userId;
        }

        public String getRole() {
            return role;
        }
    }
}
