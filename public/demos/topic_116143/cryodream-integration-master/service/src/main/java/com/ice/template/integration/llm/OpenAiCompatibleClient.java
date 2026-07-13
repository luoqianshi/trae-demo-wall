package com.ice.template.integration.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.entity.ModelConfig;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

@Component
public class OpenAiCompatibleClient {

    private static final Logger log = LoggerFactory.getLogger(OpenAiCompatibleClient.class);

    private static final int CONNECT_TIMEOUT_MS = 15_000;
    private static final int READ_TIMEOUT_MS = 120_000;
    private static final int MAX_ATTEMPTS = 3;
    private static final long RETRY_BASE_DELAY_MS = 1_000L;

    private final RestTemplate restTemplate = buildRestTemplate();

    private static RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return new RestTemplate(factory);
    }

    private final ObjectMapper objectMapper = new ObjectMapper();

    /** 未在模型配置中指定 max_tokens 时的统一默认值 */
    private static final int DEFAULT_MAX_TOKENS = 10000;

    /**
     * 解析有效的 max_tokens，统一规则（对所有 LLM 调用生效）：
     * 1. 调用方显式指定优先；
     * 2. 其次取「模型配置」中的 max_tokens（推荐在模型设置里统一配置）；
     * 3. 都未指定时使用默认值 {@link #DEFAULT_MAX_TOKENS}（10K），兼顾输出完整性与响应速度。
     */
    private int effectiveMaxTokens(Integer maxTokens, ModelConfig modelConfig) {
        if (maxTokens != null && maxTokens > 0) {
            return maxTokens;
        }
        if (modelConfig != null && modelConfig.getMaxTokens() != null && modelConfig.getMaxTokens() > 0) {
            return modelConfig.getMaxTokens();
        }
        return DEFAULT_MAX_TOKENS;
    }

    private ResponseEntity<String> postWithRetry(String url, HttpEntity<?> requestEntity) {
        Exception lastException = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                return restTemplate.postForEntity(url, requestEntity, String.class);
            } catch (BusinessException e) {
                throw e;
            } catch (Exception e) {
                lastException = e;
                if (!isRetryable(e) || attempt == MAX_ATTEMPTS) {
                    throw buildModelCallException(e, url);
                }
                long delay = RETRY_BASE_DELAY_MS * (1L << (attempt - 1));
                log.warn("[LLM] 调用失败，{}ms 后进行第 {}/{} 次重试：url={}, error={}", delay, attempt, MAX_ATTEMPTS - 1, url, e.getMessage());
                try {
                    Thread.sleep(delay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new BusinessException(ErrorCode.OPERATION_ERROR, "LLM 调用重试被中断：" + ie.getMessage());
                }
            }
        }
        throw buildModelCallException(lastException, url);
    }

    private boolean isRetryable(Exception e) {
        if (e instanceof ResourceAccessException) {
            return true;
        }
        if (e instanceof HttpStatusCodeException) {
            return ((HttpStatusCodeException) e).getStatusCode().value() >= 500;
        }
        Throwable cause = e.getCause();
        while (cause != null) {
            if (cause instanceof SocketTimeoutException || cause instanceof ConnectException) {
                return true;
            }
            cause = cause.getCause();
        }
        return false;
    }

    public String chat(ModelConfig modelConfig, List<OpenAiChatMessage> messages, Double temperature, Integer maxTokens) {
        validModelConfig(modelConfig);
        String provider = StringUtils.defaultString(modelConfig.getProvider()).toLowerCase();
        if ("anthropic".equals(provider)) {
            return chatWithAnthropic(modelConfig, messages, temperature, maxTokens);
        }
        if ("ollama".equals(provider)) {
            return chatWithOllama(modelConfig, messages, temperature, maxTokens);
        }
        return chatWithOpenAiCompatible(modelConfig, messages, temperature, maxTokens);
    }

    private String chatWithOpenAiCompatible(ModelConfig modelConfig, List<OpenAiChatMessage> messages, Double temperature, Integer maxTokens) {
        String url = buildOpenAiChatCompletionUrl(modelConfig.getBaseUrl());
        Map<String, Object> body = new HashMap<>();
        body.put("model", modelConfig.getModelName());
        body.put("messages", messages);
        body.put("temperature", temperature == null ? modelConfig.getTemperature() : temperature);
        body.put("max_tokens", effectiveMaxTokens(maxTokens, modelConfig));

        HttpHeaders headers = buildJsonHeaders();
        if (StringUtils.isNotBlank(modelConfig.getApiKey())) {
            headers.setBearerAuth(modelConfig.getApiKey());
        }
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = postWithRetry(url, requestEntity);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
            if (contentNode.isMissingNode() || contentNode.isNull()) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "模型响应缺少 choices[0].message.content");
            }
            return contentNode.asText();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw buildModelCallException(e, url);
        }
    }

    private String chatWithAnthropic(ModelConfig modelConfig, List<OpenAiChatMessage> messages, Double temperature, Integer maxTokens) {
        String url = buildAnthropicMessagesUrl(modelConfig.getBaseUrl());
        Map<String, Object> body = new HashMap<>();
        body.put("model", modelConfig.getModelName());
        body.put("max_tokens", effectiveMaxTokens(maxTokens, modelConfig));
        body.put("temperature", temperature == null ? modelConfig.getTemperature() : temperature);
        String system = messages.stream()
                .filter(message -> "system".equals(message.getRole()))
                .map(OpenAiChatMessage::getContent)
                .filter(StringUtils::isNotBlank)
                .collect(Collectors.joining("\n"));
        if (StringUtils.isNotBlank(system)) {
            body.put("system", system);
        }
        body.put("messages", messages.stream()
                .filter(message -> !"system".equals(message.getRole()))
                .map(message -> {
                    Map<String, String> item = new HashMap<>();
                    item.put("role", "assistant".equals(message.getRole()) ? "assistant" : "user");
                    item.put("content", message.getContent());
                    return item;
                })
                .collect(Collectors.toList()));

        HttpHeaders headers = buildJsonHeaders();
        headers.set("x-api-key", modelConfig.getApiKey());
        headers.set("anthropic-version", "2023-06-01");
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = postWithRetry(url, requestEntity);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode contentNode = root.path("content").path(0).path("text");
            if (contentNode.isMissingNode() || contentNode.isNull()) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "Anthropic 响应缺少 content[0].text");
            }
            return contentNode.asText();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw buildModelCallException(e, url);
        }
    }

    private String chatWithOllama(ModelConfig modelConfig, List<OpenAiChatMessage> messages, Double temperature, Integer maxTokens) {
        String url = buildOllamaChatUrl(modelConfig.getBaseUrl());
        Map<String, Object> body = new HashMap<>();
        body.put("model", modelConfig.getModelName());
        body.put("messages", messages);
        body.put("stream", false);
        Map<String, Object> options = new HashMap<>();
        options.put("temperature", temperature == null ? modelConfig.getTemperature() : temperature);
        options.put("num_predict", effectiveMaxTokens(maxTokens, modelConfig));
        body.put("options", options);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, buildJsonHeaders());

        try {
            ResponseEntity<String> response = postWithRetry(url, requestEntity);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode contentNode = root.path("message").path("content");
            if (contentNode.isMissingNode() || contentNode.isNull()) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "Ollama 响应缺少 message.content");
            }
            return contentNode.asText();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw buildModelCallException(e, url);
        }
    }

    private void validModelConfig(ModelConfig modelConfig) {
        if (modelConfig == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "模型配置不存在");
        }
        if (!Integer.valueOf(1).equals(modelConfig.getEnabled())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "模型配置未启用");
        }
        if (StringUtils.isAnyBlank(modelConfig.getBaseUrl(), modelConfig.getModelName())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "模型配置缺少接口地址或模型名称");
        }
        if ("anthropic".equalsIgnoreCase(modelConfig.getProvider()) && StringUtils.isBlank(modelConfig.getApiKey())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "Anthropic 模型配置缺少 API 密钥");
        }
    }

    private HttpHeaders buildJsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private String buildOpenAiChatCompletionUrl(String baseUrl) {
        String normalized = StringUtils.removeEnd(baseUrl, "/");
        if (normalized.endsWith("/chat/completions")) {
            return normalized;
        }
        // 已包含版本号路径（如 /v1、/v2、/v3）时，追加 /chat/completions，避免重复拼接 /v1
        if (normalized.matches(".*\\/v\\d+$")) {
            return normalized + "/chat/completions";
        }
        return normalized + "/v1/chat/completions";
    }

    private String buildAnthropicMessagesUrl(String baseUrl) {
        String normalized = StringUtils.removeEnd(baseUrl, "/");
        if (normalized.endsWith("/messages")) {
            return normalized;
        }
        if (normalized.endsWith("/v1")) {
            return normalized + "/messages";
        }
        return normalized + "/v1/messages";
    }

    private String buildOllamaChatUrl(String baseUrl) {
        String normalized = StringUtils.removeEnd(baseUrl, "/");
        if (normalized.endsWith("/api/chat")) {
            return normalized;
        }
        return normalized + "/api/chat";
    }

    private BusinessException buildModelCallException(Exception e, String url) {
        if (e instanceof HttpStatusCodeException) {
            HttpStatusCodeException httpException = (HttpStatusCodeException) e;
            String responseBody = StringUtils.defaultIfBlank(httpException.getResponseBodyAsString(), "无响应体");
            return new BusinessException(ErrorCode.OPERATION_ERROR, "模型调用失败：" + httpException.getStatusCode() + "，请求地址：" + url + "，响应：" + responseBody);
        }
        return new BusinessException(ErrorCode.OPERATION_ERROR, "模型调用失败：" + e.getMessage() + "，请求地址：" + url);
    }
}
