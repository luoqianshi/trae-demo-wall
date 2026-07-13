package com.ice.template.rag.web;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 网页正文提取配置。
 *
 * <pre>
 * knowledge:
 *   web-extract:
 *     min-content-length: 200
 *     jsoup:
 *       enabled: true
 *       timeout-ms: 15000
 *     jina:
 *       enabled: true
 *       endpoint: https://r.jina.ai/
 *       timeout-ms: 30000
 *     scrapling:
 *       enabled: false
 *       endpoint: http://localhost:8200/extract
 *       timeout-ms: 60000
 * </pre>
 */
@Component
@ConfigurationProperties(prefix = "knowledge.web-extract")
public class WebExtractProperties {

    /** 合格正文的最小字符数，低于此值视为提取失败并降级 */
    private int minContentLength = 200;

    private Jsoup jsoup = new Jsoup();
    private Jina jina = new Jina();
    private Scrapling scrapling = new Scrapling();

    public int getMinContentLength() {
        return minContentLength;
    }

    public void setMinContentLength(int minContentLength) {
        this.minContentLength = minContentLength;
    }

    public Jsoup getJsoup() {
        return jsoup;
    }

    public void setJsoup(Jsoup jsoup) {
        this.jsoup = jsoup;
    }

    public Jina getJina() {
        return jina;
    }

    public void setJina(Jina jina) {
        this.jina = jina;
    }

    public Scrapling getScrapling() {
        return scrapling;
    }

    public void setScrapling(Scrapling scrapling) {
        this.scrapling = scrapling;
    }

    public static class Jsoup {
        private boolean enabled = true;
        private int timeoutMs = 15000;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public int getTimeoutMs() {
            return timeoutMs;
        }

        public void setTimeoutMs(int timeoutMs) {
            this.timeoutMs = timeoutMs;
        }
    }

    public static class Jina {
        private boolean enabled = true;
        private String endpoint = "https://r.jina.ai/";
        private int timeoutMs = 30000;
        /** 可选：Jina API Key，提升额度（Bearer），为空则匿名调用 */
        private String apiKey = "";

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getEndpoint() {
            return endpoint;
        }

        public void setEndpoint(String endpoint) {
            this.endpoint = endpoint;
        }

        public int getTimeoutMs() {
            return timeoutMs;
        }

        public void setTimeoutMs(int timeoutMs) {
            this.timeoutMs = timeoutMs;
        }

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }
    }

    public static class Scrapling {
        private boolean enabled = false;
        private String endpoint = "http://localhost:8200/extract";
        private int timeoutMs = 60000;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getEndpoint() {
            return endpoint;
        }

        public void setEndpoint(String endpoint) {
            this.endpoint = endpoint;
        }

        public int getTimeoutMs() {
            return timeoutMs;
        }

        public void setTimeoutMs(int timeoutMs) {
            this.timeoutMs = timeoutMs;
        }
    }
}
