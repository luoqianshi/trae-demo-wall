package com.sva.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * TTS 服务配置属性
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "ai.tts")
public class TtsProperties {

    private boolean enabled = false;

    private String endpoint = "http://localhost:5000";

    private String apiKey = "";

    private int timeout = 60000;

    private String defaultVoiceId = "default";
}