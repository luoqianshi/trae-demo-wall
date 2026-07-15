package com.sva.websocket;

import cn.hutool.json.JSONObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class TaskProgressHandler extends TextWebSocketHandler {

    private static final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String userId = getUserIdFromSession(session);
        if (userId != null) {
            sessions.put(userId, session);
            log.info("WebSocket连接建立, userId: {}", userId);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String userId = getUserIdFromSession(session);
        if (userId != null) {
            sessions.remove(userId);
            log.info("WebSocket连接关闭, userId: {}", userId);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        log.debug("收到WebSocket消息: {}", payload);

        try {
            JSONObject json = new JSONObject(payload);
            String type = json.getStr("type");

            if ("subscribe".equals(type)) {
                String userId = json.getStr("userId");
                if (userId != null) {
                    sessions.put(userId, session);
                    log.info("用户订阅任务进度, userId: {}", userId);
                }
            }
        } catch (Exception e) {
            log.warn("解析WebSocket消息失败: {}", e.getMessage());
        }
    }

    public static void sendProgress(Long userId, String taskType, Long taskId, int progress, String status) {
        if (userId == null) {
            return;
        }

        WebSocketSession session = sessions.get(userId.toString());
        if (session == null || !session.isOpen()) {
            return;
        }

        JSONObject message = new JSONObject();
        message.set("type", "progress");
        message.set("taskType", taskType);
        message.set("taskId", taskId);
        message.set("progress", progress);
        message.set("status", status);

        synchronized (session) {
            try {
                session.sendMessage(new TextMessage(message.toString()));
                log.debug("发送进度消息成功, userId: {}, taskId: {}, progress: {}", userId, taskId, progress);
            } catch (IOException e) {
                log.error("发送进度消息失败, userId: {}, taskId: {}", userId, taskId, e);
            }
        }
    }

    private String getUserIdFromSession(WebSocketSession session) {
        String query = session.getUri().getQuery();
        if (query != null) {
            for (String param : query.split("&")) {
                String[] pair = param.split("=", 2);
                if (pair.length == 2 && "userId".equals(pair[0])) {
                    return pair[1];
                }
            }
        }
        return null;
    }
}
