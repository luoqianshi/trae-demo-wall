/**
 * ai-service.js — AI 通信层
 * 通过 CORS 代理调用 DeepSeek API，含超时处理、错误降级
 */
var AIService = (function() {
  'use strict';

  // ===== 核心调用 =====

  function chat(messages, options) {
    options = options || {};

    var apiBody = {
      model: Config.AI.MODEL,
      messages: messages,
      max_tokens: options.maxTokens || Config.AI.MAX_TOKENS,
      temperature: options.temperature != null ? options.temperature : Config.AI.TEMPERATURE
    };

    if (options.stream) {
      apiBody.stream = true;
    }

    // 通过代理服务器转发
    var proxyBody = {
      target_url: Config.AI.API_URL,
      auth: 'Bearer ' + Config.AI.API_KEY,
      body: apiBody
    };

    var controller = new AbortController();
    var timeoutId = setTimeout(function() {
      controller.abort();
    }, options.timeout || Config.AI.TIMEOUT_MS);

    return fetch(Config.AI.PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(proxyBody),
      signal: controller.signal
    })
    .then(function(response) {
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error('API 返回错误: ' + response.status);
      }
      return response.json();
    })
    .then(function(data) {
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      }
      throw new Error('API 返回格式异常');
    })
    .catch(function(err) {
      clearTimeout(timeoutId);
      console.warn('[AIService] 调用失败:', err.message);
      return null;
    });
  }

  // ===== 便捷方法 =====

  function simpleChat(userMessage, options) {
    var messages = [
      { role: 'user', content: userMessage }
    ];
    return chat(messages, options);
  }

  function systemChat(systemPrompt, userMessage, options) {
    var messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];
    return chat(messages, options);
  }

  // ===== JSON 响应解析 =====

  function chatJSON(messages, options) {
    return chat(messages, options).then(function(raw) {
      if (!raw) return null;
      try {
        // 尝试提取 JSON（AI 可能在 JSON 前后加文字）
        var jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return null;
      } catch (e) {
        console.warn('[AIService] JSON 解析失败:', e.message);
        return null;
      }
    });
  }

  function systemChatJSON(systemPrompt, userMessage, options) {
    var messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];
    return chatJSON(messages, options);
  }

  // ===== 带对话历史的调用（AI 记忆核心）=====

  function chatWithHistory(systemPrompt, history, userMessage, options) {
    var messages = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    if (history && history.length > 0) {
      messages = messages.concat(history);
    }

    messages.push({ role: 'user', content: userMessage });

    return chat(messages, options);
  }

  function chatWithHistoryJSON(systemPrompt, history, userMessage, options) {
    return chatWithHistory(systemPrompt, history, userMessage, options).then(function(raw) {
      if (!raw) return null;
      try {
        var jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return null;
      } catch (e) {
        console.warn('[AIService] JSON 解析失败:', e.message);
        return null;
      }
    });
  }

  // ===== 公开 API =====
  return {
    chat: chat,
    simpleChat: simpleChat,
    systemChat: systemChat,
    chatJSON: chatJSON,
    systemChatJSON: systemChatJSON,
    chatWithHistory: chatWithHistory,
    chatWithHistoryJSON: chatWithHistoryJSON
  };
})();