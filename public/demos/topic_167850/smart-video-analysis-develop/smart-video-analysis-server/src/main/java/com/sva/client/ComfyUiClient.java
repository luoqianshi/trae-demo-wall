package com.sva.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sva.config.ComfyUiProperties;
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
 * ComfyUI HTTP API 客户端
 * 文档: https://github.com/comfyanonymous/ComfyUI
 * 核心接口:
 *   POST /prompt        提交工作流
 *   GET  /history/{id}  查询任务历史/结果
 *   GET  /system_stats  系统状态（连接测试）
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ComfyUiClient {

    private final ComfyUiProperties comfyUiProperties;
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
     * 测试 ComfyUI 服务连通性
     */
    public Map<String, Object> testConnection() {
        Map<String, Object> result = new HashMap<>();
        if (!comfyUiProperties.isEnabled()) {
            result.put("connected", false);
            result.put("message", "ComfyUI 服务未启用，请在配置中开启 ai.comfyui.enabled");
            return result;
        }
        try {
            String url = normalizeUrl(comfyUiProperties.getEndpoint()) + "/system_stats";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = client().send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode json = objectMapper.readTree(response.body());
                result.put("connected", true);
                result.put("message", "连接成功");
                result.put("systemInfo", json);
            } else {
                result.put("connected", false);
                result.put("message", "ComfyUI 返回状态码: " + response.statusCode());
            }
        } catch (Exception e) {
            log.error("ComfyUI connection test failed", e);
            result.put("connected", false);
            result.put("message", "连接失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * 提交工作流到 ComfyUI
     * @param prompt 工作流 JSON（ComfyUI API 格式）
     * @param clientId 客户端 ID
     * @return ComfyUI 返回的 prompt_id（任务 ID）
     */
    public String submitPrompt(Map<String, Object> prompt, String clientId) throws Exception {
        if (!comfyUiProperties.isEnabled()) {
            throw new IllegalStateException("ComfyUI 服务未启用");
        }

        Map<String, Object> body = new HashMap<>();
        body.put("prompt", prompt);
        body.put("client_id", clientId);

        String url = normalizeUrl(comfyUiProperties.getEndpoint()) + "/prompt";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .timeout(Duration.ofMillis(comfyUiProperties.getTimeout()))
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = client().send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException("ComfyUI 提交失败: " + response.statusCode() + " " + response.body());
        }

        JsonNode json = objectMapper.readTree(response.body());
        JsonNode nodeId = json.path("prompt_id");
        if (nodeId.isMissingNode()) {
            throw new RuntimeException("ComfyUI 响应缺少 prompt_id: " + response.body());
        }
        return nodeId.asText();
    }

    /**
     * 查询任务历史/结果
     * @param promptId ComfyUI 任务 ID
     * @return 任务历史 JSON（包含 outputs 字段）
     */
    public JsonNode getHistory(String promptId) throws Exception {
        String url = normalizeUrl(comfyUiProperties.getEndpoint()) + "/history/" + promptId;
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(15))
                .GET()
                .build();

        HttpResponse<String> response = client().send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 404) {
            return null; // 任务尚未完成或不存在
        }
        if (response.statusCode() != 200) {
            throw new RuntimeException("ComfyUI 查询失败: " + response.statusCode());
        }
        JsonNode json = objectMapper.readTree(response.body());
        return json.path(promptId);
    }

    /**
     * 从指定端点测试连通性（用于配置弹窗的动态测试）
     */
    public Map<String, Object> testConnectionWith(String endpoint, String apiKey) {
        Map<String, Object> result = new HashMap<>();
        try {
            String url = normalizeUrl(endpoint) + "/system_stats";
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
                result.put("systemInfo", objectMapper.readTree(response.body()));
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
