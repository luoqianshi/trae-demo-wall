/* api.js — OpenAI 兼容客户端（全局单例 API） */
/* 提供流式文本生成与非流式工具调用两种能力，基于 OpenAI Chat Completions API */

const API = {
  /**
   * 流式聊天：async generator，逐个 yield 文本片段 (delta.content)
   * @param {Object} opts { messages, model, temperature, signal }
   */
  async *streamChat({ messages, model, temperature, signal }) {
    const url = Config.data.baseUrl.replace(/\/+$/, '') + '/chat/completions';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + Config.data.apiKey
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: true,
        temperature: temperature
      }),
      signal: signal
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error('API 错误 (' + res.status + '): ' + errText.slice(0, 300));
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // 按 \n 切行解析 SSE
      let idx;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);

        if (!line || !line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') return;

        try {
          const json = JSON.parse(data);
          const delta = json.choices && json.choices[0] && json.choices[0].delta;
          if (delta && delta.content) {
            yield delta.content;
          }
        } catch (e) {
          // 跨块 JSON 解析失败时跳过，下一轮会补齐
        }
      }
    }
  },

  /**
   * 非流式带工具调用：返回 message 对象 { role, content, tool_calls }
   * @param {Object} opts { messages, tools, tool_choice, model, temperature, signal }
   */
  async chatWithTools({ messages, tools, tool_choice = 'auto', model, temperature, signal }) {
    const url = Config.data.baseUrl.replace(/\/+$/, '') + '/chat/completions';
    const body = {
      model: model,
      messages: messages,
      tools: tools,
      tool_choice: tool_choice,
      stream: false,
      temperature: temperature
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + Config.data.apiKey
      },
      body: JSON.stringify(body),
      signal: signal
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error('API 错误 (' + res.status + '): ' + errText.slice(0, 300));
    }

    const json = await res.json();
    return json.choices && json.choices[0] && json.choices[0].message;
  }
};
