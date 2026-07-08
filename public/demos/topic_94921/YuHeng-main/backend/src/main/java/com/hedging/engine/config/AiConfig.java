package com.hedging.engine.config;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class AiConfig {

    @Value("${hedging.ai.api-key}")
    private String apiKey;

    @Value("${hedging.ai.base-url}")
    private String baseUrl;

    @Value("${hedging.ai.model-name}")
    private String modelName;

    @Value("${hedging.ai.temperature}")
    private double temperature;

    @Value("${hedging.ai.timeout-seconds}")
    private int timeoutSeconds;

    @Bean
    public ChatLanguageModel chatLanguageModel() {
        return OpenAiChatModel.builder()
                .apiKey(apiKey)
                .baseUrl(baseUrl)
                .modelName(modelName)
                .temperature(temperature)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .build();
    }
}
