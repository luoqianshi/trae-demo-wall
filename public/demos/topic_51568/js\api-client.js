/**
 * API Client — GLM API 客户端
 *
 * Handles communication with GLM (Zhipu AI) chat completions API.
 * Supports streaming responses and vision (image) input.
 */

const APIClient = {

    /**
     * Generate JWT token from Zhipu AI API key (id.secret format)
     * Uses Web Crypto API for HMAC-SHA256
     */
    async generateToken(apiKey) {
        const parts = apiKey.split('.');
        if (parts.length !== 2) {
            // Not in id.secret format, return as-is (might be JWT already)
            return apiKey;
        }

        const [id, secret] = parts;
        const header = { alg: 'HS256', sign_type: 'SIGN' };
        const now = Date.now();
        const payload = {
            api_key: id,
            exp: now + 3600 * 1000,
            timestamp: now
        };

        const base64UrlEncode = (obj) => {
            const json = JSON.stringify(obj);
            const bytes = new TextEncoder().encode(json);
            let binary = '';
            bytes.forEach(b => binary += String.fromCharCode(b));
            return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        };

        const headerEncoded = base64UrlEncode(header);
        const payloadEncoded = base64UrlEncode(payload);
        const data = `${headerEncoded}.${payloadEncoded}`;

        // Import secret as HMAC key
        const keyData = new TextEncoder().encode(secret);
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        // Sign
        const signature = await crypto.subtle.sign(
            'HMAC',
            cryptoKey,
            new TextEncoder().encode(data)
        );

        let sigBinary = '';
        new Uint8Array(signature).forEach(b => sigBinary += String.fromCharCode(b));
        const sigEncoded = btoa(sigBinary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        return `${data}.${sigEncoded}`;
    },

    /**
     * Get settings from localStorage
     */
    getSettings() {
        try {
            const saved = localStorage.getItem(AppConfig.storage.settings);
            if (saved) {
                return { ...AppConfig.api, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
        return { ...AppConfig.api };
    },

    /**
     * Save settings to localStorage
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(AppConfig.storage.settings, JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    },

    /**
     * Check if API is configured
     */
    isConfigured() {
        const settings = this.getSettings();
        return !!settings.url && !!settings.key;
    },

    /**
     * Build request body for chat completions
     */
    buildRequestBody(messages, options = {}) {
        const settings = this.getSettings();

        const body = {
            model: options.model || settings.model || 'glm-5.2',
            messages: messages,
            temperature: options.temperature ?? settings.temperature ?? 0.1,
            max_tokens: options.maxTokens || settings.maxTokens || 8192,
            stream: options.stream !== false
        };

        // Handle image content
        if (options.images && options.images.length > 0) {
            // Convert the last user message to multimodal content
            const lastUserMsg = body.messages.find(m => m.role === 'user');
            if (lastUserMsg) {
                const content = [{ type: 'text', text: lastUserMsg.content }];
                for (const img of options.images) {
                    const base64Data = img.split(',')[1] || img;
                    content.push({
                        type: 'image_url',
                        image_url: { url: `data:image/jpeg;base64,${base64Data}` }
                    });
                }
                lastUserMsg.content = content;
            }
        }

        return body;
    },

    /**
     * Send chat completion request with streaming support
     * @param {Array} messages - Array of message objects
     * @param {Object} options - Request options
     * @param {Function} onProgress - Callback for streaming progress (content, fullText)
     * @param {Function} onStatus - Callback for status updates
     * @returns {Promise<string>} - Complete response text
     */
    async chat(messages, options = {}, onProgress, onStatus) {
        const settings = this.getSettings();

        if (!settings.url || !settings.key) {
            throw new Error('请先在设置中配置 API 接口地址和 API Key');
        }

        // Generate auth token
        if (onStatus) onStatus('正在认证...');
        const token = await this.generateToken(settings.key);

        const body = this.buildRequestBody(messages, options);

        if (onStatus) onStatus('正在发送请求...');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(),
            (settings.timeout || 180) * 1000);

        try {
            const response = await fetch(settings.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                let errorMsg = `API请求失败 (${response.status})`;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMsg = `API错误: ${errorJson.error?.message || errorJson.msg || errorText}`;
                } catch (e) {
                    errorMsg += `: ${errorText.substring(0, 200)}`;
                }
                throw new Error(errorMsg);
            }

            // Handle streaming response
            if (body.stream) {
                return await this.handleStreamResponse(response, onProgress, onStatus);
            } else {
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content || '';
                if (onProgress) onProgress(content, content);
                return content;
            }
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('请求超时，请检查网络或增加超时时间');
            }
            throw error;
        }
    },

    /**
     * Handle SSE streaming response
     */
    async handleStreamResponse(response, onProgress, onStatus) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        if (onStatus) onStatus('正在生成评分标准...');

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process complete SSE lines
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data:')) continue;

                    const data = trimmed.slice(5).trim();
                    if (data === '[DONE]') {
                        continue;
                    }

                    try {
                        const json = JSON.parse(data);
                        const delta = json.choices?.[0]?.delta;

                        if (delta?.content) {
                            fullText += delta.content;
                            if (onProgress) onProgress(delta.content, fullText);
                        }

                        // Handle finish_reason
                        if (json.choices?.[0]?.finish_reason === 'stop') {
                            if (onStatus) onStatus('生成完成');
                        }

                        // Handle usage info
                        if (json.usage) {
                            this.lastUsage = json.usage;
                        }
                    } catch (e) {
                        // Skip malformed JSON
                        console.warn('Failed to parse SSE chunk:', data);
                    }
                }
            }

            // Process any remaining buffer
            if (buffer.trim().startsWith('data:')) {
                const data = buffer.trim().slice(5).trim();
                if (data !== '[DONE]') {
                    try {
                        const json = JSON.parse(data);
                        const delta = json.choices?.[0]?.delta;
                        if (delta?.content) {
                            fullText += delta.content;
                            if (onProgress) onProgress(delta.content, fullText);
                        }
                    } catch (e) {
                        // Ignore
                    }
                }
            }

            return fullText;
        } finally {
            reader.releaseLock();
        }
    },

    /**
     * Test API connection
     */
    async testConnection() {
        const testMessages = [
            { role: 'user', content: '请回复"连接成功"' }
        ];

        try {
            const result = await this.chat(testMessages, {
                stream: false,
                maxTokens: 50
            });
            return { success: true, message: result };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Get last usage statistics
     */
    getLastUsage() {
        return this.lastUsage || null;
    }
};

// Export
window.APIClient = APIClient;
