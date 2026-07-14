/* ===== api.js · AI 调用封装（fetch + SSE 流式） ===== */
window.API = (function () {

  // 流式调用 LLM
  // opts: { messages, onChunk(text), onDone(fullText), onError(msg) }
  async function callAI(opts) {
    const settings = Store.getSettings();
    if (!settings.apiKey) {
      opts.onError && opts.onError('未配置 API Key，请到设置页填写');
      return;
    }
    const baseUrl = settings.baseUrl || 'https://api.openai.com/v1';
    const url = baseUrl.replace(/\/$/, '') + '/chat/completions';

    const body = {
      model: settings.model || 'gpt-4o-mini',
      messages: opts.messages,
      stream: true,
      temperature: 0.5,
    };
    // 部分模型支持 response_format json_object，加上（不支持的厂商会忽略或报错，报错时降级）
    body.response_format = { type: 'json_object' };

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + settings.apiKey,
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      // 网络错误 / CORS
      opts.onError && opts.onError('网络连接失败，请检查网络或 Base URL 是否支持跨域（CORS）');
      return;
    }

    if (!response.ok) {
      const status = response.status;
      let msg = '';
      try {
        const errBody = await response.json();
        msg = (errBody.error && errBody.error.message) || '';
      } catch (e) { /* 忽略 */ }
      if (status === 401) {
        opts.onError && opts.onError('API Key 无效或已过期（401）' + (msg ? '：' + msg : ''));
      } else if (status === 429) {
        opts.onError && opts.onError('调用过于频繁或额度不足（429）' + (msg ? '：' + msg : ''));
      } else if (status === 404) {
        opts.onError && opts.onError('接口路径错误或模型不存在（404），请检查 Base URL 与模型名');
      } else {
        // 部分厂商不支持 response_format，去掉后重试一次
        if (body.response_format) {
          return _retryWithoutFormat(opts, settings, url);
        }
        opts.onError && opts.onError('服务异常（' + status + '）' + (msg ? '：' + msg : ''));
      }
      return;
    }

    // 流式解析 SSE
    let fullText = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // 按 \n\n 分割 SSE 事件
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // 保留最后不完整的
        for (const evt of events) {
          const lines = evt.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') {
              opts.onDone && opts.onDone(fullText);
              return;
            }
            try {
              const json = JSON.parse(data);
              const delta = json.choices && json.choices[0] && json.choices[0].delta;
              const content = delta && delta.content;
              if (content) {
                fullText += content;
                opts.onChunk && opts.onChunk(content, fullText);
              }
            } catch (e) { /* 忽略解析失败的行 */ }
          }
        }
      }
      // 流结束但没收到 [DONE]
      opts.onDone && opts.onDone(fullText);
    } catch (e) {
      opts.onError && opts.onError('读取流式响应失败：' + e.message);
    }
  }

  // 去掉 response_format 重试（兼容性降级）
  async function _retryWithoutFormat(opts, settings, url) {
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + settings.apiKey,
        },
        body: JSON.stringify({
          model: settings.model || 'gpt-4o-mini',
          messages: opts.messages,
          stream: true,
          temperature: 0.5,
        }),
      });
    } catch (e) {
      opts.onError && opts.onError('网络连接失败，请检查网络或 CORS');
      return;
    }
    if (!response.ok) {
      const status = response.status;
      let msg = '';
      try {
        const errBody = await response.json();
        msg = (errBody.error && errBody.error.message) || '';
      } catch (e) { /* 忽略 */ }
      opts.onError && opts.onError('服务异常（' + status + '）' + (msg ? '：' + msg : ''));
      return;
    }
    // 流式解析（同上）
    let fullText = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const evt of events) {
          const lines = evt.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') {
              opts.onDone && opts.onDone(fullText);
              return;
            }
            try {
              const json = JSON.parse(data);
              const delta = json.choices && json.choices[0] && json.choices[0].delta;
              const content = delta && delta.content;
              if (content) {
                fullText += content;
                opts.onChunk && opts.onChunk(content, fullText);
              }
            } catch (e) { /* 忽略 */ }
          }
        }
      }
      opts.onDone && opts.onDone(fullText);
    } catch (e) {
      opts.onError && opts.onError('读取流式响应失败：' + e.message);
    }
  }

  // 测试连接（发一个简单请求验证 Key）
  async function testConnection() {
    const settings = Store.getSettings();
    if (!settings.apiKey) return { ok: false, msg: '未填写 API Key' };
    const url = (settings.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '') + '/chat/completions';
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + settings.apiKey,
        },
        body: JSON.stringify({
          model: settings.model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 5,
        }),
      });
      if (resp.ok) return { ok: true, msg: '连接成功' };
      if (resp.status === 401) return { ok: false, msg: 'API Key 无效（401）' };
      if (resp.status === 429) return { ok: false, msg: '调用频繁或额度不足（429）' };
      return { ok: false, msg: '失败（' + resp.status + '）' };
    } catch (e) {
      return { ok: false, msg: '网络/CORS 错误：' + e.message };
    }
  }

  return { callAI, testConnection };
})();
