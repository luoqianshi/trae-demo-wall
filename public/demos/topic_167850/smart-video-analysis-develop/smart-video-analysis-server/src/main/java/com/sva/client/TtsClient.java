package com.sva.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * TTS 服务 HTTP 客户端
 * 支持文本转语音功能
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TtsClient {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private HttpClient httpClient;

    private HttpClient client() {
        if (httpClient == null) {
            httpClient = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();
        }
        return httpClient;
    }

    /**
     * 测试 TTS 服务连通性
     * @param endpoint TTS 服务地址
     * @return 连接测试结果
     */
    public Map<String, Object> testConnection(String endpoint) {
        Map<String, Object> result = new HashMap<>();
        try {
            String url = normalizeUrl(endpoint) + "/health";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = client().send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                result.put("connected", true);
                result.put("message", "连接成功");
                try {
                    JsonNode json = objectMapper.readTree(response.body());
                    result.put("systemInfo", json);
                } catch (Exception e) {
                    result.put("systemInfo", response.body());
                }
            } else {
                result.put("connected", false);
                result.put("message", "TTS 返回状态码: " + response.statusCode());
            }
        } catch (Exception e) {
            log.error("TTS connection test failed", e);
            result.put("connected", false);
            result.put("message", "连接失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * 文本转语音
     * @param endpoint TTS 服务地址
     * @param text 要转换的文本
     * @param voiceId 音色ID
     * @param params 参数（语速、语调、情感等）
     * @return 生成的音频文件路径
     */
    public String synthesize(String endpoint, String text, String voiceId, Map<String, Object> params) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("text", text);
        body.put("voice_id", voiceId);
        if (params != null) {
            body.put("speed", params.getOrDefault("speed", 1.0));
            body.put("pitch", params.getOrDefault("pitch", 1.0));
            body.put("emotion", params.getOrDefault("emotion", "neutral"));
            body.put("format", params.getOrDefault("format", "wav"));
        }

        String url = normalizeUrl(endpoint) + "/synthesize";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(60))
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = client().send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException("TTS 合成失败: " + response.statusCode() + " " + response.body());
        }

        JsonNode json = objectMapper.readTree(response.body());
        JsonNode audioPathNode = json.path("audio_path");
        if (audioPathNode.isMissingNode()) {
            throw new RuntimeException("TTS 响应缺少 audio_path: " + response.body());
        }
        return audioPathNode.asText();
    }

    /**
     * 从指定端点测试连通性（用于配置弹窗的动态测试）
     * @param endpoint 服务地址
     * @param apiKey API密钥
     * @return 连接测试结果
     */
    public Map<String, Object> testConnectionWith(String endpoint, String apiKey) {
        Map<String, Object> result = new HashMap<>();
        try {
            String url = normalizeUrl(endpoint) + "/health";
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .GET();
            if (apiKey != null && !apiKey.isEmpty()) {
                builder.header("Authorization", "Bearer " + apiKey);
            }
            HttpResponse<String> response = client().send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                result.put("connected", true);
                result.put("message", "连接成功");
                try {
                    result.put("systemInfo", objectMapper.readTree(response.body()));
                } catch (Exception e) {
                    result.put("systemInfo", response.body());
                }
            } else {
                result.put("connected", false);
                result.put("message", "返回状态码: " + response.statusCode());
            }
        } catch (Exception e) {
            result.put("connected", false);
            result.put("message", "连接失败: " + e.getMessage());
        }
        return result;
    }

    private String normalizeUrl(String url) {
        if (url == null) return "";
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}