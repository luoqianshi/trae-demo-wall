package com.sva.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "ai.comfyui")
public class ComfyUiProperties {

    private boolean enabled = false;

    private String endpoint = "http://localhost:8188";

    private String apiKey = "";

    private int timeout = 60000;
}
