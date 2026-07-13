const LLMChat = {
  abortController: null,
  isGenerating: false,
  lastDebug: null,
  debugEntries: [],

  maskSecret(value) {
    const s = String(value || '');
    if (!s) return '';
    if (s.length <= 8) return '***';
    return `${s.slice(0, 4)}***${s.slice(-4)}`;
  },

  sanitizeForLog(value, depth = 0) {
    if (value == null) return value;
    if (depth > 6) return '[MaxDepth]';
    if (typeof value === 'string') {
      if (/^sk-[A-Za-z0-9_\-]{8,}/.test(value) || /^sk-sp-[A-Za-z0-9_\-]{8,}/.test(value)) {
        return this.maskSecret(value);
      }
      if (value.length > 4000) return value.slice(0, 4000) + `...[truncated ${value.length - 4000} chars]`;
      return value;
    }
    if (typeof value !== 'object') return value;
    if (Array.isArray(value)) {
      return value.map(v => this.sanitizeForLog(v, depth + 1));
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const key = k.toLowerCase();
      if (key.includes('authorization') || key.includes('api-key') || key.includes('apikey') || key === 'x-api-key') {
        out[k] = typeof v === 'string' ? this.maskSecret(v.replace(/^Bearer\s+/i, '')) : '***';
      } else if (key === 'apikey' || key === 'api_key') {
        out[k] = this.maskSecret(v);
      } else {
        out[k] = this.sanitizeForLog(v, depth + 1);
      }
    }
    return out;
  },

  logDebug(entry) {
    const record = {
      time: new Date().toISOString(),
      ...entry
    };
    this.lastDebug = record;
    this.debugEntries = [...(this.debugEntries || []).slice(-19), record];
    try {
      console.info('[LLMChat debug]', record);
    } catch {
      // ignore
    }
    return record;
  },

  getLastDebugText() {
    if (!this.lastDebug && (!this.debugEntries || this.debugEntries.length === 0)) {
      return '暂无调试日志。请先点击「测试连接」。';
    }
    const entries = this.debugEntries && this.debugEntries.length
      ? this.debugEntries
      : [this.lastDebug];
    return entries.map((e, i) => {
      const lines = [
        `======== 调试 #${i + 1} @ ${e.time || ''} ========`,
        `阶段: ${e.stage || '-'}`,
        `成功: ${e.success === true ? '是' : e.success === false ? '否' : '-'}`,
        `请求格式: ${e.format || '-'}`,
        `原始 URL: ${e.rawUrl || '-'}`,
        `实际 URL: ${e.url || '-'}`,
        `代理: ${e.viaProxy ? '是 (/__proxy)' : '否'}`,
        `HTTP: ${e.status != null ? e.status : '-'}`,
      ];
      if (e.hint) lines.push(`提示: ${e.hint}`);
      if (e.error) lines.push(`错误: ${e.error}`);
      if (e.requestHeaders) {
        lines.push('请求头:');
        lines.push(JSON.stringify(this.sanitizeForLog(e.requestHeaders), null, 2));
      }
      if (e.requestBody) {
        lines.push('请求体:');
        lines.push(typeof e.requestBody === 'string'
          ? e.requestBody
          : JSON.stringify(this.sanitizeForLog(e.requestBody), null, 2));
      }
      if (e.responsePreview != null) {
        lines.push('响应摘要:');
        lines.push(typeof e.responsePreview === 'string'
          ? e.responsePreview
          : JSON.stringify(this.sanitizeForLog(e.responsePreview), null, 2));
      }
      if (e.attempts && e.attempts.length) {
        lines.push('重试记录:');
        e.attempts.forEach((a, idx) => {
          lines.push(`  [${idx + 1}] format=${a.format} status=${a.status} ok=${a.ok} ${a.note || ''}`);
          if (a.error) lines.push(`      error: ${a.error}`);
        });
      }
      return lines.join('\n');
    }).join('\n\n');
  },

  /**
   * 安全读取错误响应：body 只能读一次，先 text 再尝试 JSON 解析。
   * 兼容 OpenAI / Anthropic / 火山引擎 等常见错误结构。
   */
  async readErrorMessage(response, fallbackPrefix = '请求失败') {
    let errorMsg = `${fallbackPrefix} (${response.status})`;
    try {
      const buffer = await response.arrayBuffer();
      let text = new TextDecoder('utf-8').decode(buffer);
      // 去掉 BOM；控制字符用 codePoint 过滤，避免源码里写 null 字节
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      text = Array.from(text).filter(ch => {
        const c = ch.codePointAt(0);
        return c === 0x09 || c === 0x0A || c === 0x0D || c >= 0x20;
      }).join('');

      if (!text) return errorMsg;

      try {
        const errorData = JSON.parse(text);
        const extracted = this.extractErrorFromJson(errorData);
        if (extracted) return extracted;
        return text.substring(0, 500);
      } catch {
        const printable = text.match(/[\x20-\x7E一-鿿]/g) || [];
        const printableRatio = printable.length / Math.max(text.length, 1);
        if (printableRatio < 0.6) {
          return `${fallbackPrefix} (${response.status})：响应无法解析，请检查 API 地址/密钥，或重启本地服务后重试`;
        }
        return text.substring(0, 500);
      }
    } catch {
      return errorMsg;
    }
  },

  extractErrorFromJson(data) {
    if (!data || typeof data !== 'object') return '';
    if (typeof data.error === 'string') return data.error;
    if (data.error?.message) {
      const code = data.error.code || data.error.type || '';
      return code ? `[${code}] ${data.error.message}` : data.error.message;
    }
    if (data.error?.code && !data.error?.message) {
      return String(data.error.code);
    }
    if (data.message) return data.message;
    if (data.msg) return data.msg;
    if (data.ResponseMetadata?.Error?.Message) {
      const e = data.ResponseMetadata.Error;
      return e.Code ? `[${e.Code}] ${e.Message}` : e.Message;
    }
    return '';
  },

  /**
   * 补全常见不完整 endpoint：
   * - .../v1 或 .../v1/ → .../v1/chat/completions
   * - .../compatible-mode/v1 → .../chat/completions
   * - 已是完整路径则原样返回
   */
  normalizeEndpoint(url) {
    if (!url || typeof url !== 'string') return url;
    let u = url.trim();
    if (!u) return u;

    u = u.replace(/\/+$/, '');
    const lower = u.toLowerCase();

    if (
      lower.endsWith('/chat/completions') ||
      lower.endsWith('/messages') ||
      lower.endsWith('/completions') ||
      lower.endsWith('/responses') ||
      lower.includes('/text-generation') ||
      lower.includes('/generation')
    ) {
      return u;
    }

    // .../v1 或 .../compatible-mode/v1
    if (/\/v\d+$/i.test(u) || /\/compatible-mode\/v\d+$/i.test(u)) {
      return `${u}/chat/completions`;
    }

    return u;
  },

  /**
   * 本地开发时走 /__proxy，绕过浏览器 CORS。
   * 直接打开 index.html（file://）或非本地域名时仍直连。
   */
  shouldUseProxy() {
    if (typeof location === 'undefined') return false;
    if (location.protocol === 'file:') return false;
    const host = location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  },

  async fetchApi(url, options = {}) {
    if (this.shouldUseProxy()) {
      const headers = new Headers(options.headers || {});
      headers.set('X-Proxy-Target', url);
      return fetch('/__proxy', {
        ...options,
        headers
      });
    }
    return fetch(url, options);
  },

  async streamChat(config, messages, promptType, onChunk, onComplete, onError) {
    if (this.isGenerating) {
      if (onError) onError(new Error('正在生成中，请稍候...'));
      return;
    }

    this.isGenerating = true;
    this.abortController = new AbortController();

    try {
      const rawUrl = config.baseUrl;
      const url = this.normalizeEndpoint(rawUrl);
      const headers = LLMConfig.generateHeaders(config);
      const body = LLMConfig.buildRequestBody(config, messages, promptType, { stream: true });
      const format = LLMConfig.resolveRequestFormat(config);

      this.logDebug({
        stage: 'streamChat:request',
        format,
        rawUrl,
        url,
        viaProxy: this.shouldUseProxy(),
        requestHeaders: headers,
        requestBody: body
      });

      const response = await this.fetchApi(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        let errorMsg = await this.readErrorMessage(response);
        errorMsg = this.humanizeError(errorMsg, format);
        this.logDebug({
          stage: 'streamChat:error',
          success: false,
          format,
          rawUrl,
          url,
          viaProxy: this.shouldUseProxy(),
          status: response.status,
          error: errorMsg,
          requestHeaders: headers,
          requestBody: body
        });
        throw new Error(errorMsg);
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('application/json') && !contentType.includes('event-stream')) {
        const data = await response.json();
        const text = LLMConfig.extractCompletionText(data, config);
        this.isGenerating = false;
        this.logDebug({
          stage: 'streamChat:json',
          success: true,
          format,
          rawUrl,
          url,
          viaProxy: this.shouldUseProxy(),
          status: response.status,
          responsePreview: text ? text.slice(0, 500) : data
        });
        if (onChunk && text) onChunk(text, text);
        if (onComplete) onComplete(text);
        return text;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let reasoningText = '';
      let buffer = '';
      let sawContent = false;

      const emitStatus = (msg) => {
        if (onChunk && !sawContent) {
          // 仅在还没有正文时展示思考/状态，避免污染最终答案
          onChunk('', msg);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          const parsed = LLMConfig.parseStreamChunk(trimmedLine, config);
          if (parsed === null) continue;

          // 兼容旧版返回字符串
          const kind = typeof parsed === 'string' ? (parsed ? 'content' : 'ignore') : (parsed.kind || 'ignore');
          const piece = typeof parsed === 'string' ? parsed : (parsed.text || '');

          if (kind === 'reasoning' && piece) {
            reasoningText += piece;
            // 截断展示，避免刷屏
            const preview = reasoningText.length > 120
              ? reasoningText.slice(-120)
              : reasoningText;
            emitStatus(`⏳ 模型思考中… ${preview.replace(/\n/g, ' ')}`);
            continue;
          }

          if (kind === 'content' && piece) {
            if (!sawContent) {
              sawContent = true;
              // 清空思考状态，开始正文
              if (onChunk) onChunk('', '');
            }
            fullText += piece;
            if (onChunk) onChunk(piece, fullText);
          }
        }
      }

      // 处理残留 buffer
      if (buffer.trim()) {
        try {
          const parsed = LLMConfig.parseStreamChunk(buffer.trim(), config);
          if (parsed && parsed !== null) {
            const kind = typeof parsed === 'string' ? (parsed ? 'content' : 'ignore') : (parsed.kind || 'ignore');
            const piece = typeof parsed === 'string' ? parsed : (parsed.text || '');
            if (kind === 'content' && piece) {
              sawContent = true;
              fullText += piece;
              if (onChunk) onChunk(piece, fullText);
            }
          }
        } catch {
          try {
            const data = JSON.parse(buffer.trim().replace(/^data:\s*/, ''));
            const extracted = LLMConfig.extractCompletionText(data, config);
            if (extracted) {
              fullText = extracted;
              sawContent = true;
              if (onChunk) onChunk(fullText, fullText);
            }
          } catch {
            // ignore
          }
        }
      }

      // 流式结束仍无正文：自动非流式重试一次（推理模型常见）
      if (!fullText) {
        this.logDebug({
          stage: 'streamChat:empty-stream-fallback',
          format,
          rawUrl,
          url,
          viaProxy: this.shouldUseProxy(),
          status: response.status,
          reasoningPreview: reasoningText.slice(0, 300)
        });
        emitStatus('⏳ 流式无正文，正在非流式重试…');
        try {
          const nonStreamBody = LLMConfig.buildRequestBody(config, messages, promptType, { stream: false });
          const retryResp = await this.fetchApi(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(nonStreamBody),
            signal: this.abortController?.signal
          });
          if (retryResp.ok) {
            const data = await retryResp.json();
            fullText = LLMConfig.extractCompletionText(data, config) || '';
            if (fullText && onChunk) onChunk(fullText, fullText);
          } else {
            const err = await this.readErrorMessage(retryResp);
            throw new Error(err);
          }
        } catch (retryErr) {
          if (!fullText) {
            // 若只有 reasoning，给出可理解提示
            if (reasoningText) {
              fullText = '';
              throw new Error('模型返回了思考过程但没有正文。请重试，或在设置中换模型/关闭深度思考。');
            }
            throw retryErr;
          }
        }
      }

      this.isGenerating = false;
      this.logDebug({
        stage: 'streamChat:done',
        success: !!fullText,
        format,
        rawUrl,
        url,
        viaProxy: this.shouldUseProxy(),
        status: response.status,
        responsePreview: fullText.slice(0, 500),
        reasoningPreview: reasoningText ? reasoningText.slice(0, 200) : undefined
      });
      if (onComplete) onComplete(fullText || '');
      return fullText;

    } catch (error) {
      this.isGenerating = false;

      if (error.name === 'AbortError') {
        if (onError) onError(new Error('已取消生成'));
      } else {
        console.error('AI调用失败:', error);
        if (onError) onError(error);
      }
      return null;
    }
  },

  async chat(config, messages, promptType) {
    return new Promise((resolve, reject) => {
      let fullText = '';

      this.streamChat(
        config,
        messages,
        promptType,
        (chunk, text) => {
          fullText = text;
        },
        () => {
          resolve(fullText);
        },
        (error) => {
          reject(error);
        }
      );
    });
  },

  stopGeneration() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isGenerating = false;
  },

  generateWithTask(taskId, userInput, onChunk, onComplete, onError) {
    const task = this.findTaskById(taskId);
    const defaultConfig = LLMConfig.getDefaultConfig();

    if (!defaultConfig) {
      if (onError) onError(new Error('请先在设置中配置大模型API'));
      return null;
    }

    const promptType = task?.promptType || 'general';
    const messages = Prompts.buildMessages(promptType, {
      user_input: userInput,
      character_info: '',
      outline: '',
      episode_summary: '',
      script: '',
      shot_info: '',
      scene_desc: '',
      content_type: task?.name || ''
    });

    return this.streamChat(
      defaultConfig,
      messages,
      promptType,
      onChunk,
      onComplete,
      onError
    );
  },

  generateWithPrompt(promptType, variables, onChunk, onComplete, onError) {
    const defaultConfig = LLMConfig.getDefaultConfig();

    if (!defaultConfig) {
      if (onError) onError(new Error('请先在设置中配置大模型API'));
      return null;
    }

    const messages = Prompts.buildMessages(promptType, variables);

    return this.streamChat(
      defaultConfig,
      messages,
      promptType,
      onChunk,
      onComplete,
      onError
    );
  },

  findTaskById(taskId) {
    for (const phase of WorkflowData.phases) {
      const task = phase.tasks.find(t => t.id === taskId);
      if (task) return task;
    }
    return null;
  },

  continueChat(chatHistory, onChunk, onComplete, onError) {
    const defaultConfig = LLMConfig.getDefaultConfig();

    if (!defaultConfig) {
      if (onError) onError(new Error('请先在设置中配置大模型API'));
      return null;
    }

    return this.streamChat(
      defaultConfig,
      chatHistory,
      'general',
      onChunk,
      onComplete,
      onError
    );
  },

  humanizeError(errorMsg, format) {
    const msg = String(errorMsg || '');
    const lower = msg.toLowerCase();

    if (lower.includes('input is required') || lower.includes('"input" is required')) {
      return `${msg}\n提示：当前接口需要 input 字段。请在设置里把「请求格式」改为「兼容 input」或「通义原生」，或确认 API 地址是否为 /chat/completions。`;
    }
    if (lower.includes('messages') && lower.includes('required')) {
      return `${msg}\n提示：当前接口需要 messages 字段。请把「请求格式」设为「OpenAI Chat」。`;
    }
    if (lower.includes('authentication') || lower.includes('unauthorized') || lower.includes('invalid api key') || lower.includes('api key format')) {
      return `${msg}\n提示：请检查 API 密钥是否正确（火山引擎请用 Ark API Key，模型填 ep- 推理点 ID）。`;
    }
    if (lower.includes('404') || lower.includes('not found')) {
      return `${msg}\n提示：地址可能不完整。若只填到 /v1，请改为 .../v1/chat/completions（系统也会自动补全）。`;
    }
    if (format && !msg.includes('请求格式')) {
      return msg;
    }
    return msg;
  },

  async testConfig(config) {
    const testMessages = [
      { role: 'system', content: '你是一个助手，请简短回复。' },
      { role: 'user', content: '你好，请回复"测试成功"，不要有多余内容。' }
    ];

    const rawUrl = config.baseUrl;
    const url = this.normalizeEndpoint(rawUrl);
    const headers = LLMConfig.generateHeaders(config);
    const format = LLMConfig.resolveRequestFormat(config);
    const viaProxy = this.shouldUseProxy();
    const attempts = [];

    const tryOnce = async (fmt, note) => {
      const tryConfig = { ...config, requestFormat: fmt };
      const body = LLMConfig.buildRequestBody(tryConfig, testMessages, 'general', { stream: false });
      const attempt = {
        format: fmt,
        note: note || '',
        url,
        requestBody: body
      };
      try {
        const response = await this.fetchApi(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });
        attempt.status = response.status;
        attempt.ok = response.ok;

        if (!response.ok) {
          const errorMsg = this.humanizeError(await this.readErrorMessage(response, 'HTTP'), fmt);
          attempt.error = errorMsg;
          attempts.push(attempt);
          return { success: false, error: errorMsg, status: response.status, format: fmt, body };
        }

        const data = await response.json();
        const content = LLMConfig.extractCompletionText(data, tryConfig);
        attempt.responsePreview = content || data;
        attempts.push(attempt);

        if (content) {
          return {
            success: true,
            response: content.trim(),
            status: response.status,
            format: fmt,
            body,
            data
          };
        }
        return {
          success: false,
          error: 'API返回了空内容，请检查模型名称是否正确',
          status: response.status,
          format: fmt,
          body,
          data
        };
      } catch (error) {
        attempt.error = error.message;
        attempt.ok = false;
        attempts.push(attempt);
        return { success: false, error: error.message, format: fmt, body };
      }
    };

    try {
      let result = await tryOnce(format, '用户配置/自动识别');

      if (!result.success && format === 'openai') {
        if (/input is required/i.test(result.error || '')) {
          result = await tryOnce('openai_input', '自动重试：兼容 input');
          if (result.success && config.id) {
            LLMConfig.updateConfig(config.id, { requestFormat: 'openai_input' });
            result.hint = '已自动切换为「兼容 input」格式并保存';
          }
        }
        if (!result.success && /input is required/i.test(result.error || '')) {
          result = await tryOnce('dashscope', '自动重试：通义原生');
          if (result.success && config.id) {
            LLMConfig.updateConfig(config.id, { requestFormat: 'dashscope' });
            result.hint = '已自动切换为「通义原生」格式并保存';
          }
        }
      }

      let pathHint = '';
      if (rawUrl && url && rawUrl.replace(/\/+$/, '') !== url) {
        pathHint = `已自动补全地址：${rawUrl} → ${url}`;
      }

      this.logDebug({
        stage: 'testConfig',
        success: result.success,
        format: result.format || format,
        rawUrl,
        url,
        viaProxy,
        status: result.status,
        error: result.success ? undefined : result.error,
        hint: [pathHint, result.hint].filter(Boolean).join('；') || undefined,
        requestHeaders: headers,
        requestBody: result.body,
        responsePreview: result.success
          ? result.response
          : (result.data || result.error),
        attempts: attempts.map(a => ({
          format: a.format,
          status: a.status,
          ok: a.ok,
          note: a.note,
          error: a.error
        }))
      });

      if (result.success) {
        return {
          success: true,
          response: result.response,
          hint: [pathHint, result.hint].filter(Boolean).join('；') || undefined
        };
      }
      return { success: false, error: result.error };

    } catch (error) {
      this.logDebug({
        stage: 'testConfig:exception',
        success: false,
        format,
        rawUrl,
        url,
        viaProxy,
        error: error.message,
        requestHeaders: headers,
        attempts
      });
      return { success: false, error: error.message };
    }
  }
};
