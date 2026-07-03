package com.fridgemagic.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class ApiKeyProvider {

    @Value("${zhipu.api-key-encrypted:}")
    private String encryptedApiKey;

    @Value("${zhipu.api-key:}")
    private String plainApiKey;

    private String apiKey;

    @PostConstruct
    public void init() {
        // 优先使用加密的 API Key
        if (encryptedApiKey != null && !encryptedApiKey.isBlank()) {
            try {
                apiKey = AESUtil.decrypt(encryptedApiKey.trim());
                return;
            } catch (Exception e) {
                // 解密失败，尝试其他方式
            }
        }
        // 其次使用明文配置
        if (plainApiKey != null && !plainApiKey.isBlank()) {
            apiKey = plainApiKey.trim();
            return;
        }
        // 最后尝试从文件读取
        try {
            java.nio.file.Path keyPath = java.nio.file.Paths.get("api_key.txt");
            if (java.nio.file.Files.exists(keyPath)) {
                apiKey = java.nio.file.Files.readString(keyPath).trim();
                if (!apiKey.isBlank()) return;
            }
        } catch (Exception ignored) {}
        apiKey = null;
    }

    public String getApiKey() { return apiKey; }
    public boolean hasApiKey() { return apiKey != null && !apiKey.isBlank(); }
}