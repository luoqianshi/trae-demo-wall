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
 * RVC 歌声转换 HTTP 客户端
 * 支持音色转换和人声克隆功能
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RvcClient {

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
     * 测试 RVC 服务连通性
     * @param endpoint RVC 服务地址
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
                result.put("message", "RVC 返回状态码: " + response.statusCode());
            }
        } catch (Exception e) {
            log.error("RVC connection test failed", e);
            result.put("connected", false);
            result.put("message", "连接失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * 音色转换
     * @param endpoint RVC 服务地址
     * @param audioPath 输入音频路径
     * @param voiceId 目标音色ID
     * @param params 参数（音调偏移、混合比例等）
     * @return 转换后的音频文件路径
     */
    public String convertVoice(String endpoint, String audioPath, String voiceId, Map<String, Object> params) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("audio_path", audioPath);
        body.put("voice_id", voiceId);
        if (params != null) {
            body.put("pitch_offset", params.getOrDefault("pitchOffset", 0));
            body.put("mix_ratio", params.getOrDefault("mixRatio", 0.8));
            body.put("format", params.getOrDefault("format", "wav"));
        }

        String url = normalizeUrl(endpoint) + "/convert";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(120))
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = client().send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException("RVC 音色转换失败: " + response.statusCode() + " " + response.body());
        }

        JsonNode json = objectMapper.readTree(response.body());
        JsonNode audioPathNode = json.path("result_path");
        if (audioPathNode.isMissingNode()) {
            throw new RuntimeException("RVC 响应缺少 result_path: " + response.body());
        }
        return audioPathNode.asText();
    }

    /**
     * 人声克隆（创建新音色）
     * @param endpoint RVC 服务地址
     * @param audioPath 用于克隆的音频路径
     * @param voiceName 新音色名称
     * @return 创建的音色ID
     */
    public String cloneVoice(String endpoint, String audioPath, String voiceName) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("audio_path", audioPath);
        body.put("voice_name", voiceName);

        String url = normalizeUrl(endpoint) + "/clone";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(120))
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = client().send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException("RVC 人声克隆失败: " + response.statusCode() + " " + response.body());
        }

        JsonNode json = objectMapper.readTree(response.body());
        JsonNode voiceIdNode = json.path("voice_id");
        if (voiceIdNode.isMissingNode()) {
            throw new RuntimeException("RVC 响应缺少 voice_id: " + response.body());
        }
        return voiceIdNode.asText();
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