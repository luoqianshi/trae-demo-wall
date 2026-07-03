const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const {
  initPromise,
  getConfig,
  setConfig,
  createSession,
  getSessions,
  getSessionById,
  deleteSession,
  updateSession,
  addMessage,
  getMessagesBySession,
  getAllUserMessages,
  getMessageCount,
  getUserProfile,
  setUserProfile,
  getArchiveStats,
  getArchiveSessions
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3456;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Wait for DB init
let dbReady = false;
initPromise.then(() => { dbReady = true; }).catch(err => {
  console.error('数据库初始化失败:', err);
});

function checkDb(req, res, next) {
  if (!dbReady) {
    return res.status(503).json({ error: '数据库初始化中，请稍后再试' });
  }
  next();
}

app.use(checkDb);

// ---------- Personality Prompts ----------
const PERSONALITY_PROMPTS = {
  gentle: '\n[性格预设：温柔倾听]\n你性格温柔，善于倾听，不急于给出建议，用温暖的话语回应每一份心事。',
  philosophy: '\n[性格预设：哲理引导]\n你善于用温和的方式引导思考，帮助对方梳理思绪，在对话中点亮新的视角。',
  inspiration: '\n[性格预设：灵感碰撞]\n你活泼积极，喜欢回应脑洞，和对方一起发散思维，碰撞灵感火花。'
};

// ---------- LLM Helper (non-streaming) ----------
async function callLLM(messages, config) {
  const isLocal = config.useLocal === true || config.useLocal === 'true';
  let resultText = '';

  if (isLocal) {
    const ollamaUrl = config.ollamaUrl || 'http://localhost:11434';
    const modelName = config.modelName || 'granite4.1:3b';
    const url = new URL(ollamaUrl);
    const postData = JSON.stringify({ model: modelName, messages, stream: false });
    const options = {
      hostname: url.hostname,
      port: url.port || 11434,
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
      timeout: 120000
    };
    const client = url.protocol === 'https:' ? https : http;
    resultText = await new Promise((resolve, reject) => {
      const req2 = client.request(options, (res2) => {
        let data = '';
        res2.on('data', chunk => data += chunk);
        res2.on('end', () => {
          try { resolve(JSON.parse(data).message?.content || ''); }
          catch { resolve(data); }
        });
      });
      req2.on('error', reject);
      req2.on('timeout', () => { req2.destroy(); reject(new Error('超时')); });
      req2.write(postData);
      req2.end();
    });
  } else {
    const apiUrl = config.apiUrl || '';
    const apiKey = config.apiKey || '';
    if (!apiUrl || !apiKey) throw new Error('请配置公网 API');
    const url = new URL(apiUrl);
    const postData = JSON.stringify({ model: config.modelName || 'gpt-3.5-turbo', messages, stream: false, temperature: 0.5 });
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname || '/v1/chat/completions',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'Content-Length': Buffer.byteLength(postData) },
      timeout: 120000
    };
    const client = url.protocol === 'https:' ? https : http;
    resultText = await new Promise((resolve, reject) => {
      const req2 = client.request(options, (res2) => {
        let data = '';
        res2.on('data', chunk => data += chunk);
        res2.on('end', () => {
          try { resolve(JSON.parse(data).choices?.[0]?.message?.content || ''); }
          catch { resolve(data); }
        });
      });
      req2.on('error', reject);
      req2.on('timeout', () => { req2.destroy(); reject(new Error('超时')); });
      req2.write(postData);
      req2.end();
    });
  }
  return resultText;
}

// ---------- Config APIs ----------
app.get('/api/config', async (req, res) => {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/config', async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await setConfig(key, value);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/config/test', async (req, res) => {
  try {
    const config = req.body;
    const isLocal = config.useLocal === true || config.useLocal === 'true';
    if (isLocal) {
      const url = new URL(config.ollamaUrl || 'http://localhost:11434');
      const options = {
        hostname: url.hostname,
        port: url.port || 11434,
        path: '/api/tags',
        method: 'GET',
        timeout: 5000
      };
      const result = await new Promise((resolve, reject) => {
        const req2 = http.request(options, (res2) => {
          let data = '';
          res2.on('data', chunk => data += chunk);
          res2.on('end', () => {
            if (res2.statusCode === 200) {
              try {
                const json = JSON.parse(data);
                const models = json.models || [];
                resolve({ success: true, models: models.map(m => m.name || m.model) });
              } catch {
                resolve({ success: true, message: 'Ollama 连接正常' });
              }
            } else {
              reject(new Error(`状态码: ${res2.statusCode}`));
            }
          });
        });
        req2.on('error', err => reject(err));
        req2.on('timeout', () => { req2.destroy(); reject(new Error('连接超时')); });
        req2.end();
      });
      res.json(result);
    } else {
      const apiUrl = config.apiUrl || '';
      if (!apiUrl) {
        return res.status(400).json({ success: false, error: '请填写 API 地址' });
      }
      res.json({ success: true, message: '公网 API 配置已保存，请通过对话测试' });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ---------- Session APIs ----------
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await getSessions();
    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const title = req.body.title || '新对话';
    const id = await createSession(title);
    res.json({ id, title });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/sessions/:id', async (req, res) => {
  try {
    await deleteSession(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/sessions/:id/messages', async (req, res) => {
  try {
    const messages = await getMessagesBySession(req.params.id);
    res.json(messages);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/sessions/:id', async (req, res) => {
  try {
    await updateSession(req.params.id, req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Chat API (SSE) ----------
app.post('/api/chat', async (req, res) => {
  const { sessionId, message } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: '缺少参数' });
  }

  // Save user message
  await addMessage(sessionId, 'user', message);

  // Get config
  const config = await getConfig();
  const companionName = config.companionName || '天一';

  // Get user profile
  const profile = await getUserProfile();
  let profileText = '';
  if (profile && profile.enabled && profile.content) {
    const intensityPrefix = {
      light: '（简要了解）',
      medium: '（适度了解）',
      deep: '（深度了解）'
    }[profile.intensity] || '';
    const parts = [];
    if (profile.content.topics) parts.push(`常聊话题：${profile.content.topics}`);
    if (profile.content.emotion) parts.push(`情绪倾向：${profile.content.emotion}`);
    if (profile.content.style) parts.push(`表达风格：${profile.content.style}`);
    if (profile.content.focus) parts.push(`近期关注：${profile.content.focus}`);
    if (profile.content.advice) parts.push(`陪伴建议：${profile.content.advice}`);
    if (parts.length > 0) {
      profileText = `\n[懂你的心${intensityPrefix}]\n${parts.join('\n')}\n`;
    }
  }

  // Build messages
  const systemPrompt = config.systemPrompt || `你是「${companionName}」，一个温暖包容的灵魂伴灵。`;
  const personality = config.personality || 'gentle';
  const personalityText = PERSONALITY_PROMPTS[personality] || '';
  const fullSystem = systemPrompt + personalityText + profileText;

  const history = await getMessagesBySession(sessionId);
  const messages = [{ role: 'system', content: fullSystem }];
  for (const msg of history.slice(-20)) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Setup SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullText = '';

  try {
    const isLocal = config.useLocal === true || config.useLocal === 'true';

    if (isLocal) {
      // Ollama streaming
      const ollamaUrl = config.ollamaUrl || 'http://localhost:11434';
      const modelName = config.modelName || 'granite4.1:3b';
      const url = new URL(ollamaUrl);

      const postData = JSON.stringify({
        model: modelName,
        messages: messages,
        stream: true,
        options: { temperature: 0.8 }
      });

      const options = {
        hostname: url.hostname,
        port: url.port || 11434,
        path: '/api/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 120000
      };

      const client = url.protocol === 'https:' ? https : http;

      const ollamaReq = client.request(options, (ollamaRes) => {
        ollamaRes.setEncoding('utf8');
        let buffer = '';

        ollamaRes.on('data', (chunk) => {
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.message && data.message.content) {
                const text = data.message.content;
                fullText += text;
                res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
              }
              if (data.done) {
                res.write(`data: ${JSON.stringify({ done: true, fullText })}\n\n`);
                res.end();
                // Save assistant message
                addMessage(sessionId, 'assistant', fullText).then(() => {
                  updateSessionWordCount(sessionId);
                }).catch(() => {});
              }
            } catch {
              // ignore parse error
            }
          }
        });

        ollamaRes.on('end', () => {
          if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ done: true, fullText })}\n\n`);
            res.end();
            addMessage(sessionId, 'assistant', fullText).then(() => {
              updateSessionWordCount(sessionId);
            }).catch(() => {});
          }
        });

        ollamaRes.on('error', (err) => {
          res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
          res.end();
        });
      });

      ollamaReq.on('error', (err) => {
        res.write(`data: ${JSON.stringify({ error: 'Ollama 连接失败: ' + err.message })}\n\n`);
        res.end();
      });

      ollamaReq.write(postData);
      ollamaReq.end();

    } else {
      // Public API (OpenAI-compatible)
      const apiUrl = config.apiUrl || '';
      const apiKey = config.apiKey || '';
      if (!apiUrl || !apiKey) {
        res.write(`data: ${JSON.stringify({ error: '请配置公网 API 地址和密钥' })}\n\n`);
        res.end();
        return;
      }

      const url = new URL(apiUrl);
      const postData = JSON.stringify({
        model: config.modelName || 'gpt-3.5-turbo',
        messages: messages,
        stream: true,
        temperature: 0.8
      });

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname || '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 120000
      };

      const client = url.protocol === 'https:' ? https : http;

      const apiReq = client.request(options, (apiRes) => {
        apiRes.setEncoding('utf8');
        let buffer = '';

        apiRes.on('data', (chunk) => {
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6);
            if (jsonStr === '[DONE]') {
              res.write(`data: ${JSON.stringify({ done: true, fullText })}\n\n`);
              res.end();
              addMessage(sessionId, 'assistant', fullText).then(() => {
                updateSessionWordCount(sessionId);
              }).catch(() => {});
              return;
            }
            try {
              const data = JSON.parse(jsonStr);
              const delta = data.choices?.[0]?.delta?.content || '';
              if (delta) {
                fullText += delta;
                res.write(`data: ${JSON.stringify({ chunk: delta })}\n\n`);
              }
            } catch {
              // ignore
            }
          }
        });

        apiRes.on('end', () => {
          if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ done: true, fullText })}\n\n`);
            res.end();
            addMessage(sessionId, 'assistant', fullText).then(() => {
              updateSessionWordCount(sessionId);
            }).catch(() => {});
          }
        });
      });

      apiReq.on('error', (err) => {
        res.write(`data: ${JSON.stringify({ error: 'API 请求失败: ' + err.message })}\n\n`);
        res.end();
      });

      apiReq.write(postData);
      apiReq.end();
    }
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  }
});

async function updateSessionWordCount(sessionId) {
  try {
    const messages = await getMessagesBySession(sessionId);
    let count = 0;
    for (const m of messages) {
      count += (m.content || '').length;
    }
    await updateSession(sessionId, { wordCount: count });
  } catch {
    // ignore
  }
}

// ---------- Auto Archive API ----------
app.post('/api/sessions/:id/auto-archive', async (req, res) => {
  try {
    const messages = await getMessagesBySession(req.params.id);
    if (messages.length < 2) {
      return res.json({ success: true, skipped: true });
    }

    const config = await getConfig();
    const conversationText = messages.map(m => `${m.role === 'user' ? '用户' : '伴灵'}: ${m.content}`).join('\n');

    const archivePrompt = `请分析以下对话，生成归档信息，只输出纯 JSON，不要 markdown 代码块，格式如下：
{
  "title": "简短标题，10字以内",
  "summary": "一句话摘要，30字以内",
  "mood": "情绪标签，如：温暖、沉思、释然、纠结、灵感、平静",
  "tags": ["标签1", "标签2"]
}

可选标签包括：深夜倾诉、灵感记录、情绪梳理、哲学思考，也可以根据内容自创新标签。可以贴多个标签。

对话内容：
${conversationText.slice(0, 6000)}`;

    const resultText = await callLLM([{ role: 'user', content: archivePrompt }], config);

    let archive;
    try {
      const clean = resultText.replace(/```json\s*|\s*```/g, '').trim();
      archive = JSON.parse(clean);
    } catch {
      const match = resultText.match(/\{[\s\S]*\}/);
      if (match) {
        archive = JSON.parse(match[0]);
      } else {
        throw new Error('解析归档失败');
      }
    }

    await updateSession(req.params.id, {
      title: archive.title || '对话',
      summary: archive.summary || '',
      mood: archive.mood || '温暖',
      tags: JSON.stringify(archive.tags || [])
    });

    res.json({ success: true, archive });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ---------- Archive APIs ----------
app.get('/api/archive', async (req, res) => {
  try {
    const { tag, search } = req.query;
    const sessions = await getArchiveSessions(tag || '', search || '');
    const stats = await getArchiveStats();
    res.json({ sessions, stats });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/archive/stats', async (req, res) => {
  try {
    res.json(await getArchiveStats());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/archive/manual', async (req, res) => {
  try {
    const { title, content, mood, tags } = req.body;
    const id = await createSession(title || '一条思绪');
    await addMessage(id, 'user', content || '');
    await updateSession(id, {
      summary: (content || '').slice(0, 100),
      mood: mood || '温暖',
      tags: JSON.stringify(tags || []),
      wordCount: (content || '').length
    });
    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Profile APIs ----------
app.get('/api/profile', async (req, res) => {
  try {
    res.json(await getUserProfile());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    const { content, enabled, intensity } = req.body;
    await setUserProfile(content, enabled, intensity);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/profile/analyze', async (req, res) => {
  try {
    const userMessages = await getAllUserMessages(300);
    if (userMessages.length < 3) {
      return res.json({ success: false, error: '历史消息太少，多聊一会儿再来分析吧' });
    }

    const combined = userMessages.map(m => m.content).join('\n---\n');
    const config = await getConfig();

    const analyzePrompt = `请基于以下用户的倾诉内容，提炼出一份温柔的用户画像分析，只输出纯 JSON，不要 markdown 代码块，格式如下：
{
  "topics": "用户常聊的话题，用顿号分隔",
  "emotion": "用户的情绪倾向和内心状态",
  "style": "用户的表达风格和语言特点",
  "focus": "用户近期反复思考或关注的命题",
  "advice": "给伴灵的建议：如何更好地陪伴这位用户"
}

用户倾诉内容：
${combined.slice(0, 8000)}`;

    const resultText = await callLLM([{ role: 'user', content: analyzePrompt }], config);

    // Parse JSON from result
    let content;
    try {
      const clean = resultText.replace(/```json\s*|\s*```/g, '').trim();
      content = JSON.parse(clean);
    } catch {
      const match = resultText.match(/\{[\s\S]*\}/);
      if (match) {
        content = JSON.parse(match[0]);
      } else {
        throw new Error('解析画像失败');
      }
    }

    await setUserProfile(content, true, 'medium');
    res.json({ success: true, content });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ---------- Serve index.html for all other routes ----------
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`痴话小棉袄已启动：http://localhost:${PORT}`);
});
