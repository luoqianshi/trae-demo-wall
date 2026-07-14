/**
 * NanHong API Configuration & Utility
 * Shared across all demo modules
 * Provides LLM API integration with fallback to rule-based logic
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'nanhong_api_config';
  var DEFAULT_CONFIG = {
    endpoint: 'https://api.stepfun.com/step_plan/v1',
    apiKey: '7m9k47rGpnTdWXClHeJoz7YvmQ0znnY3ANvmPDeIvsMD0XpfnHHVuR6RYqnfAHqTd',
    model: 'step-3.7-flash',
    enabled: true
  };

  function getConfig() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var config = JSON.parse(raw);
        return {
          endpoint: config.endpoint || DEFAULT_CONFIG.endpoint,
          apiKey: config.apiKey || DEFAULT_CONFIG.apiKey,
          model: config.model || DEFAULT_CONFIG.model,
          enabled: config.enabled !== undefined ? config.enabled : true
        };
      }
    } catch(e) {}
    return Object.assign({}, DEFAULT_CONFIG);
  }

  function saveConfig(config) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      return true;
    } catch(e) {
      return false;
    }
  }

  function isConfigured() {
    var c = getConfig();
    return c.enabled && c.endpoint && c.apiKey && c.model;
  }

  function init() {
    var existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      saveConfig(DEFAULT_CONFIG);
    }
  }

  /**
   * Core API call function
   * @param {string} systemPrompt - System role prompt
   * @param {string} userPrompt - User message
   * @param {object} options - { temperature, maxTokens, timeout, messages }
   * @returns {Promise<string>} AI response text
   */
  async function chat(systemPrompt, userPrompt, options) {
    var config = getConfig();
    if (!isConfigured()) {
      throw new Error('API未配置，请前往设置页面配置API信息');
    }

    var endpoint = config.endpoint.replace(/\/+$/, '') + '/chat/completions';
    var messages;
    var noReasoning = '直接回答，不要推理过程。';
    if (options && options.messages) {
      // Append no-reasoning instruction to the first system message
      messages = options.messages.map(function(m, i) {
        if (m.role === 'system') {
          return { role: 'system', content: m.content + (m.content.indexOf('不要推理') === -1 ? ' ' + noReasoning : '') };
        }
        return m;
      });
    } else {
      var sp = systemPrompt;
      if (sp && sp.indexOf('不要推理') === -1) {
        sp = sp + ' ' + noReasoning;
      }
      messages = [
        { role: 'system', content: sp },
        { role: 'user', content: userPrompt }
      ];
    }

    // Enforce minimum max_tokens for reasoning models
    var maxTokens = (options && options.maxTokens) || 2048;
    if (maxTokens < 500) {
      maxTokens = 500;
    }

    var body = {
      model: config.model,
      messages: messages,
      temperature: (options && options.temperature) || 0.8,
      max_tokens: maxTokens
    };

    var controller = new AbortController();
    var timeoutId = setTimeout(function() { controller.abort(); }, (options && options.timeout) || 60000);

    try {
      var response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + config.apiKey
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        var errorText = '';
        try {
          var errorData = await response.json();
          errorText = errorData.error ? (errorData.error.message || JSON.stringify(errorData.error)) : '';
        } catch(e) {}

        if (response.status === 401) {
          throw new Error('API Key无效，请在设置中检查');
        } else if (response.status === 429) {
          throw new Error('请求过于频繁，请稍后再试');
        } else if (response.status >= 500) {
          throw new Error('服务器错误(' + response.status + ')，请稍后再试');
        } else {
          throw new Error('API错误(' + response.status + '): ' + errorText);
        }
      }

      var data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        var msg = data.choices[0].message;
        var content = msg.content || '';
        // Some reasoning models put content in reasoning_content field
        if (!content && msg.reasoning_content) {
          content = msg.reasoning_content;
        }
        // Strip reasoning tags (<think>...</think>) from reasoning models
        if (content) {
          content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
          // Also handle unclosed <think> tags
          content = content.replace(/<think>[\s\S]*$/gi, '').trim();
          // Handle <reasoning> tags too
          content = content.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '').trim();
        }
        return content;
      }
      throw new Error('API返回格式异常');
    } catch(e) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        throw new Error('请求超时，请稍后再试');
      }
      throw e;
    }
  }

  /**
   * Chat with fallback to rule-based logic
   * @param {string} systemPrompt
   * @param {string} userPrompt
   * @param {function|string} fallbackFn - Function or value to use if API fails
   * @param {object} options
   * @returns {Promise<string>}
   */
  async function chatWithFallback(systemPrompt, userPrompt, fallbackFn, options) {
    if (!isConfigured()) {
      if (typeof fallbackFn === 'function') return fallbackFn();
      return fallbackFn;
    }

    try {
      showLoading();
      var result = await chat(systemPrompt, userPrompt, options);
      hideLoading();
      return result;
    } catch(e) {
      hideLoading();
      console.warn('[NanHongAPI] 调用失败，使用本地规则引擎:', e.message);
      toast('AI连接失败，已切换到本地模式: ' + e.message, 'error');
      if (typeof fallbackFn === 'function') return fallbackFn();
      return fallbackFn;
    }
  }

  /**
   * Chat and parse JSON response
   * @returns {Promise<object|string>} Parsed JSON or raw text
   */
  async function chatJSON(systemPrompt, userPrompt, fallbackFn, options) {
    if (!isConfigured()) {
      if (typeof fallbackFn === 'function') return fallbackFn();
      return fallbackFn;
    }

    try {
      showLoading();
      var response = await chat(systemPrompt, userPrompt, options);
      hideLoading();

      // Try to extract JSON from response
      var jsonStr = response;
      
      // 1. Try code block ```json ... ```
      var codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      } else {
        // 2. Try to find JSON object or array in the response
        var jsonMatch = response.match(/[\[{][\s\S]*[\]}]/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }
      
      // 3. Clean up common issues: trailing commas, smart quotes
      jsonStr = jsonStr.replace(/，/g, ',').replace(/：/g, ':').replace(/"/g, '"').replace(/'/g, '"');
      // Remove trailing commas before } or ]
      jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

      try {
        return JSON.parse(jsonStr);
      } catch(parseErr) {
        // 4. Last resort: try to find the outermost { } block
        var braceMatch = response.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          try {
            return JSON.parse(braceMatch[0]);
          } catch(e2) {
            console.warn('[NanHongAPI] JSON解析失败，返回原始文本');
            return response;
          }
        }
        console.warn('[NanHongAPI] JSON解析失败，返回原始文本');
        return response;
      }
    } catch(e) {
      hideLoading();
      console.warn('[NanHongAPI] 调用失败，使用本地规则引擎:', e.message);
      toast('AI连接失败，已切换到本地模式', 'error');
      if (typeof fallbackFn === 'function') return fallbackFn();
      return fallbackFn;
    }
  }

  /**
   * Test API connection
   * @returns {Promise<object>} { success, message }
   */
  async function testConnection() {
    var config = getConfig();
    if (!config.endpoint || !config.apiKey || !config.model) {
      return { success: false, message: '请填写完整的API配置信息' };
    }

    try {
      var endpoint = config.endpoint.replace(/\/+$/, '') + '/chat/completions';
      var controller = new AbortController();
      var timeoutId = setTimeout(function() { controller.abort(); }, 15000);

      var response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + config.apiKey
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: '你是测试助手，直接回答，不要推理过程。' },
            { role: 'user', content: '请回复"连接成功"四个字。' }
          ],
          max_tokens: 1000
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        var data = await response.json();
        var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        return { success: true, message: '连接成功！模型回复: ' + reply };
      } else {
        var err = '';
        try { err = (await response.json()).error.message; } catch(e) {}
        return { success: false, message: '连接失败(' + response.status + '): ' + err };
      }
    } catch(e) {
      if (e.name === 'AbortError') {
        return { success: false, message: '连接超时，请检查网络和API地址' };
      }
      return { success: false, message: '连接异常: ' + e.message };
    }
  }

  // === UI Helpers ===

  function showLoading(msg) {
    hideLoading();
    
    if (!document.getElementById('nanhong-loading-styles')) {
      var style = document.createElement('style');
      style.id = 'nanhong-loading-styles';
      style.textContent = '@keyframes nanhong-spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(style);
    }

    var overlay = document.createElement('div');
    overlay.id = 'nanhong-loading-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(61,46,42,0.35);z-index:99998;display:flex;align-items:center;justify-content:center;';

    var inner = document.createElement('div');
    inner.style.cssText = 'background:#fff;border-radius:16px;padding:1.5rem 2rem;display:flex;align-items:center;gap:0.8rem;box-shadow:0 8px 30px rgba(0,0,0,0.15);font-family:PingFang SC,Microsoft YaHei,sans-serif;color:#3D2E2A;font-size:0.95rem;max-width:90vw;';

    var spinner = document.createElement('span');
    spinner.style.cssText = 'display:inline-block;width:1.2rem;height:1.2rem;border:2.5px solid #F4C4B5;border-top-color:#E8826B;border-radius:50%;animation:nanhong-spin 0.7s linear infinite;flex-shrink:0;';

    var text = document.createElement('span');
    text.textContent = msg || 'AI 正在思考中...';

    inner.appendChild(spinner);
    inner.appendChild(text);
    overlay.appendChild(inner);
    document.body.appendChild(overlay);
  }

  function hideLoading() {
    var el = document.getElementById('nanhong-loading-overlay');
    if (el) el.remove();
  }

  function toast(msg, type) {
    type = type || 'info';
    var colors = {
      success: '#5BA5A0',
      error: '#E8826B',
      info: '#3D2E2A'
    };

    var div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:1.5rem;left:50%;transform:translateX(-50%) translateY(-10px);background:' + (colors[type] || colors.info) + ';color:#fff;padding:0.75rem 1.5rem;border-radius:100px;font-size:0.9rem;font-family:PingFang SC,Microsoft YaHei,sans-serif;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.15);opacity:0;transition:opacity 0.3s,transform 0.3s;max-width:90vw;text-align:center;';
    div.textContent = msg;
    document.body.appendChild(div);

    requestAnimationFrame(function() {
      div.style.opacity = '1';
      div.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(function() {
      div.style.opacity = '0';
      div.style.transform = 'translateX(-50%) translateY(-10px)';
      setTimeout(function() { div.remove(); }, 300);
    }, 3500);
  }

  function getStatusBadge() {
    if (isConfigured()) {
      return '<span style="display:inline-flex;align-items:center;gap:0.3rem;padding:0.25rem 0.7rem;background:rgba(91,165,160,0.15);border:1px solid rgba(91,165,160,0.3);border-radius:100px;font-size:0.75rem;color:#5BA5A0;font-weight:600;text-decoration:none;"><span style="width:6px;height:6px;background:#5BA5A0;border-radius:50%;display:inline-block;"></span>AI 已连接</span>';
    }
    return '<span style="display:inline-flex;align-items:center;gap:0.3rem;padding:0.25rem 0.7rem;background:rgba(232,130,107,0.15);border:1px solid rgba(232,130,107,0.3);border-radius:100px;font-size:0.75rem;color:#E8826B;font-weight:600;text-decoration:none;"><span style="width:6px;height:6px;background:#E8826B;border-radius:50%;display:inline-block;"></span>本地模式</span>';
  }

  // === Initialize with default config ===
  init();

  // === Export ===
  window.NanHongAPI = {
    getConfig: getConfig,
    saveConfig: saveConfig,
    isConfigured: isConfigured,
    chat: chat,
    chatWithFallback: chatWithFallback,
    chatJSON: chatJSON,
    testConnection: testConnection,
    showLoading: showLoading,
    hideLoading: hideLoading,
    toast: toast,
    getStatusBadge: getStatusBadge,
    STORAGE_KEY: STORAGE_KEY
  };
})();
