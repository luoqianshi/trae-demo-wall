package com.sva.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * RVC 歌声转换服务配置属性
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "ai.rvc")
public class RvcProperties {

    private boolean enabled = false;

    private String endpoint = "http://localhost:8000";

    private String apiKey = "";

    private int timeout = 120000;
}