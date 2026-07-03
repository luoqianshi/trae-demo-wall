package com.fridgemagic.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fridgemagic.config.ApiKeyProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AIService {

    private final ApiKeyProvider apiKeyProvider;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${zhipu.api-url}")
    private String apiUrl;

    @Value("${zhipu.model}")
    private String model;

    @Value("${zhipu.timeout}")
    private int timeout;

    public AIService(ApiKeyProvider apiKeyProvider, ObjectMapper objectMapper) {
        this.apiKeyProvider = apiKeyProvider;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(30)).build();
    }

    public boolean hasApiKey() {
        return apiKeyProvider.hasApiKey();
    }

    @SuppressWarnings("unchecked")
    public String identifyIngredients(String base64Image) throws Exception {
        String apiKey = apiKeyProvider.getApiKey();
        if (apiKey == null) throw new RuntimeException("API Key 未配置");

        List<Map<String, Object>> content = new ArrayList<>();
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("type", "text");
        textPart.put("text", "请识别这张图片中的食材，只返回食材名称，用逗号分隔，不要其他文字。例如：鸡蛋,番茄,青椒");
        content.add(textPart);

        Map<String, Object> imagePart = new HashMap<>();
        imagePart.put("type", "image_url");
        imagePart.put("image_url", Map.of("url", "data:image/jpeg;base64," + base64Image));
        content.add(imagePart);

        Map<String, Object> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", content);

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", "你是一个食材识别助手，只返回食材名称列表，用逗号分隔，不要其他文字。"));
        messages.add(userMessage);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "glm-4v-flash");
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.3);
        requestBody.put("max_tokens", 200);

        String json = objectMapper.writeValueAsString(requestBody);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .timeout(Duration.ofMillis(timeout))
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException("AI 视觉服务返回错误 (" + response.statusCode() + ")");
        }

        Map<String, Object> responseData = objectMapper.readValue(response.body(), Map.class);
        List<Map<String, Object>> choices = (List<Map<String, Object>>) responseData.get("choices");
        if (choices == null || choices.isEmpty()) throw new RuntimeException("AI 返回数据为空");

        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        String result = (String) message.get("content");
        result = result.replaceAll("[\\s\\n]+", "").replaceAll("识别(的)?食材(为|是|：|:)?", "");
        return result;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> generateRecipes(String ingredients, String preference) throws Exception {
        return generateRecipes(ingredients, preference, 3);
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> generateRecipes(String ingredients, String preference, int count) throws Exception {
        String apiKey = apiKeyProvider.getApiKey();
        if (apiKey == null) throw new RuntimeException("API Key 未配置");

        String systemPrompt = "你是一位专业的中式家常菜厨师。你擅长根据现有食材推荐菜谱，优先推荐能用现有食材完成的菜。";
        String userPrompt = String.format(
            "我有以下食材：%s\n饮食偏好：%s\n\n请推荐" + count + "道菜谱。\n\n" +
            "要求：\n1. 每道菜包含：菜名、难度（简单/中等/较难）、烹饪时间、步骤（3-5步）\n" +
            "2. 营养信息：热量(kcal)、蛋白质(g)、碳水(g)、脂肪(g)\n" +
            "3. 如果食材不够，说明需要额外购买什么\n" +
            "4. 优先推荐能用现有食材完成的菜\n\n" +
            "输出格式（严格JSON数组）：\n" +
            "[{\"name\":\"菜名\",\"difficulty\":\"简单\",\"time\":\"15分钟\",\"steps\":[\"步骤1\",\"步骤2\"],\"nutrition\":{\"calories\":300,\"protein\":20,\"carbs\":30,\"fat\":10},\"extraIngredients\":[\"需要额外购买的食材\"]}]",
            ingredients, preference.isEmpty() ? "无特殊要求" : preference);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        messages.add(Map.of("role", "user", "content", userPrompt));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 2048);

        String json = objectMapper.writeValueAsString(requestBody);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .timeout(Duration.ofMillis(timeout))
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("AI 服务返回错误 (" + response.statusCode() + ")");
        }

        Map<String, Object> responseData = objectMapper.readValue(response.body(), Map.class);
        List<Map<String, Object>> choices = (List<Map<String, Object>>) responseData.get("choices");
        if (choices == null || choices.isEmpty()) throw new RuntimeException("AI 返回数据为空");

        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        String content = (String) message.get("content");

        return parseRecipeJSON(content);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseRecipeJSON(String raw) {
        Pattern pattern = Pattern.compile("\\[\\s*\\{[\\s\\S]*\\}\\s*\\]");
        Matcher matcher = pattern.matcher(raw);
        if (!matcher.find()) throw new RuntimeException("未找到 JSON 数组");

        String jsonStr = matcher.group(0);
        try {
            return objectMapper.readValue(jsonStr, List.class);
        } catch (Exception e) {
            jsonStr = jsonStr.replaceAll("^[^\\[]*\\[", "[").replaceAll("\\][^\\]]*$", "]");
            try {
                return objectMapper.readValue(jsonStr, List.class);
            } catch (Exception ex) {
                throw new RuntimeException("JSON 解析失败");
            }
        }
    }
}