/**
 * LLMClient - 大模型API客户端
 * 支持DeepSeek（兼容OpenAI API格式）
 */

class LLMClient {
  constructor() {
    this.apiKey = '';
    this.provider = 'deepseek';
    this.model = 'deepseek-chat';
    this.baseUrl = '';
    this.maxTokens = 4096;
    this.temperature = 0.3;
  }

  /**
   * 从localStorage加载配置
   */
  loadConfig() {
    const saved = localStorage.getItem('yinao_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        this.apiKey = config.apiKey || '';
        this.provider = config.provider || 'deepseek';
        this.model = config.model || 'deepseek-chat';
        this.baseUrl = config.baseUrl || '';
      } catch (e) {
        console.warn('配置加载失败', e);
      }
    }
  }

  /**
   * 保存配置到localStorage
   */
  saveConfig() {
    const config = {
      apiKey: this.apiKey,
      provider: this.provider,
      model: this.model,
      baseUrl: this.baseUrl
    };
    localStorage.setItem('yinao_config', JSON.stringify(config));
  }

  /**
   * 验证API Key是否可用（简单检查格式）
   */
  validateApiKey() {
    if (!this.apiKey || this.apiKey.trim() === '') {
      return { valid: false, message: '请先在设置中填入API Key' };
    }
    if (this.apiKey.length < 10) {
      return { valid: false, message: 'API Key格式不正确，请检查' };
    }
    return { valid: true, message: 'API Key 已配置' };
  }

  /**
   * 获取API基础URL
   */
  _getBaseUrl() {
    if (this.baseUrl && this.baseUrl.trim() !== '') {
      return this.baseUrl.replace(/\/+$/, '');
    }
    switch (this.provider) {
      case 'deepseek':
        return 'https://api.deepseek.com';
      default:
        return 'https://api.deepseek.com';
    }
  }

  /**
   * 发送对话请求（流式）
   * @param {Array} messages - [{role: 'system'|'user'|'assistant', content: string}]
   * @param {Function} onChunk - 收到每个文本块时的回调 (text: string) => void
   * @param {Object} options - 可选参数
   * @returns {Promise<string>} 完整的回复文本
   */
  async chatStream(messages, onChunk, options = {}) {
    const url = `${this._getBaseUrl()}/chat/completions`;

    const body = {
      model: this.model,
      messages: messages,
      stream: true,
      max_tokens: options.maxTokens || this.maxTokens,
      temperature: options.temperature || this.temperature
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `API请求失败 (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.error?.message || errorMsg;
      } catch (e) {
        // 使用默认错误信息
      }
      throw new Error(errorMsg);
    }

    // 读取SSE流
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            if (onChunk) onChunk(delta);
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }

    return fullText;
  }

  /**
   * 发送对话请求（非流式）
   * @param {Array} messages
   * @param {Object} options
   * @returns {Promise<string>}
   */
  async chat(messages, options = {}) {
    const url = `${this._getBaseUrl()}/chat/completions`;

    const body = {
      model: this.model,
      messages: messages,
      stream: false,
      max_tokens: options.maxTokens || this.maxTokens,
      temperature: options.temperature || this.temperature
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `API请求失败 (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.error?.message || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

// 暴露到全局
window.LLMClient = LLMClient;