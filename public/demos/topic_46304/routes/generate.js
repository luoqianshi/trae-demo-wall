/* ============================================================
 * 生成 API 路由（IGA Pages 版）
 *
 * AI 生成代理，不依赖数据库。
 * ============================================================ */
const express = require('express');
const router = express.Router();

router.post('/chat', async (req, res) => {
  const { apiUrl, apiKey, model, messages, temperature, maxTokens } = req.body;

  if (!apiUrl || !apiKey || !model) {
    return res.status(400).json({ ok: false, error: '缺少必要的 API 配置' });
  }

  try {
    const response = await fetch(apiUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: temperature ?? 0.8,
        max_tokens: maxTokens ?? 8192,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ ok: false, error: errText });
    }

    const data = await response.json();
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/stream', async (req, res) => {
  const { apiUrl, apiKey, model, messages, temperature, maxTokens } = req.body;

  if (!apiUrl || !apiKey || !model) {
    return res.status(400).json({ ok: false, error: '缺少必要的 API 配置' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const response = await fetch(apiUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: temperature ?? 0.8,
        max_tokens: maxTokens ?? 8192,
        stream: true,
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      res.write(chunk);
    }

    res.end();
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
