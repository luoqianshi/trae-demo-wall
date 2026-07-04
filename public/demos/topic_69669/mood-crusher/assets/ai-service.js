/* ============================================================
   坏情绪粉碎机 · AI 服务封装
   支持 OpenAI/Claude 兼容 API，失败时自动 fallback 到本地分析
   ============================================================ */

(function () {
  'use strict';

  // 6 大情绪维度（用于 AI 返回结果映射）
  const EMOTIONS = ['stress', 'anger', 'anxiety', 'sadness', 'lonely', 'joy'];
  const EMOTION_LABELS = {
    stress: '压力',
    anger: '愤怒',
    anxiety: '焦虑',
    sadness: '悲伤',
    lonely: '孤独',
    joy: '喜悦',
  };
  const EMOTION_EMOJIS = {
    stress: '💼',
    anger: '😤',
    anxiety: '😰',
    sadness: '🥺',
    lonely: '🌙',
    joy: '✨',
  };
  const EMOTION_COLORS = {
    stress: '#F59E0B',
    anger: '#EF4444',
    anxiety: '#8B5CF6',
    sadness: '#3B82F6',
    lonely: '#6366F1',
    joy: '#10B981',
  };

  // 检查 AI 是否可用
  function isAIEnabled() {
    if (!window.MCAIConfig) return false;
    if (!window.MCAIConfig.isAIEnabled()) return false;
    const cfg = window.MCAIConfig.getActiveConfig();
    if (!cfg || !cfg.enabled || !cfg.apiUrl) return false;
    // Ollama 本地模型不需要 API Key
    if (cfg.provider === 'ollama') return true;
    return cfg.apiKey;
  }

  // 调用 AI API
  function callAI(cfg, messages, callback) {
    const { apiUrl, apiKey, model, provider } = cfg;

    // 判断 provider 类型
    const isClaude = provider === 'claude' || apiUrl.includes('anthropic');
    const isOllama = provider === 'ollama' || apiUrl.includes('ollama') || apiUrl.includes('11434');

    let url = apiUrl;
    let headers = {
      'Content-Type': 'application/json',
    };
    let body = {};

    if (isClaude) {
      // Claude API 格式
      url = apiUrl.endsWith('/messages') ? apiUrl : apiUrl.replace(/\/?$/, '/v1/messages');
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      body = {
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: messages.filter(m => m.role !== 'system'), // Claude 不支持 system role
      };
      // Claude 把 system 放到 system 参数
      const sysMsg = messages.find(m => m.role === 'system');
      if (sysMsg) body.system = sysMsg.content;
    } else if (isOllama) {
      // Ollama OpenAI 兼容格式
      url = apiUrl.endsWith('/chat/completions') ? apiUrl : apiUrl.replace(/\/?$/, '/v1/chat/completions');
      headers['Authorization'] = 'Bearer ' + (apiKey || 'ollama');
      body = {
        model: model || 'llama3',
        messages: messages,
        temperature: 0.7,
        stream: false,
      };
    } else {
      // OpenAI 兼容格式（智谱AI / 通义千问 / DeepSeek / 月之暗面 / 星火 / 文心 / 01.AI / 豆包 等都支持）
      headers['Authorization'] = 'Bearer ' + apiKey;
      body = {
        model: model || 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
      };
    }

    fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('API Error: ' + res.status);
        }
        return res.json();
      })
      .then(data => {
        let content = '';
        if (isClaude) {
          content = data.content && data.content[0] && data.content[0].text;
        } else {
          content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        }
        callback(null, content);
      })
      .catch(err => {
        console.warn('[AI Service] API call failed, fallback to local:', err.message);
        callback(err, null);
      });
  }

  // 情绪分析 prompt
  function buildAnalyzePrompt(text) {
    return [
      {
        role: 'system',
        content: `你是一个情绪分析助手。用户会输入一段文字，你需要分析其中的情绪。
请输出一个 JSON 对象，包含：
- scores: 对象，每个情绪维度的 0-100 分数，维度有：stress(压力), anger(愤怒), anxiety(焦虑), sadness(悲伤), lonely(孤独), joy(喜悦)
- dominant: 当前主导情绪的 key，如果没有明显情绪为 null
- summary: 一句话总结用户的情绪状态（10字以内）
只输出 JSON，不要其他内容。`,
      },
      {
        role: 'user',
        content: text,
      },
    ];
  }

  // 吐槽总结 prompt
  function buildRoastPrompt(analysis, text) {
    const dominantLabel = analysis.dominant ? EMOTION_LABELS[analysis.dominant] : '平静';
    return [
      {
        role: 'system',
        content: `你是一个犀利但温暖的安慰师。用户刚才分析了情绪数据：主导情绪是${dominantLabel}。
请生成一句犀利的吐槽/安慰语（20字以内），风格是：先吐槽再安慰，带点幽默。
只输出这句话，不要其他内容。`,
      },
      {
        role: 'user',
        content: `我的烦恼是：${text}`,
      },
    ];
  }

  // 解析 AI 返回的情绪分析结果
  function parseAnalysisResult(content) {
    try {
      // 尝试提取 JSON
      let jsonStr = content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];
      const data = JSON.parse(jsonStr);

      const scores = { stress: 0, anger: 0, anxiety: 0, sadness: 0, lonely: 0, joy: 0 };
      EMOTIONS.forEach(em => {
        scores[em] = Math.max(0, Math.min(100, parseInt(data.scores[em] || 0, 10)));
      });

      const dominant = data.dominant && EMOTIONS.includes(data.dominant) ? data.dominant : null;
      let dominantInfo = null;
      if (dominant) {
        dominantInfo = {
          key: dominant,
          label: EMOTION_LABELS[dominant],
          emoji: EMOTION_EMOJIS[dominant],
          color: EMOTION_COLORS[dominant],
          value: scores[dominant],
        };
      }

      return {
        scores,
        dominant: dominantInfo,
        summary: data.summary || '',
        source: 'ai',
      };
    } catch (e) {
      console.warn('[AI Service] Failed to parse AI response:', e);
      return null;
    }
  }

  // 使用 AI 进行情绪分析
  function analyzeWithAI(text, callback) {
    if (!isAIEnabled()) {
      // fallback 到本地分析
      fallbackToLocal(text, callback);
      return;
    }

    const cfg = window.MCAIConfig.getActiveConfig();
    const messages = buildAnalyzePrompt(text);

    callAI(cfg, messages, (err, content) => {
      if (err || !content) {
        fallbackToLocal(text, callback);
        return;
      }

      const result = parseAnalysisResult(content);
      if (result) {
        callback(null, result);
      } else {
        fallbackToLocal(text, callback);
      }
    });
  }

  // 使用 AI 生成吐槽总结
  function generateRoastWithAI(analysis, text, callback) {
    if (!isAIEnabled()) {
      // fallback 到本地
      fallbackToRoast(analysis, callback);
      return;
    }

    const cfg = window.MCAIConfig.getActiveConfig();
    const messages = buildRoastPrompt(analysis, text);

    callAI(cfg, messages, (err, content) => {
      if (err || !content) {
        fallbackToRoast(analysis, callback);
        return;
      }
      callback(null, content.trim());
    });
  }

  // Fallback 到本地 MCAnalyzer
  function fallbackToLocal(text, callback) {
    if (window.MCAnalyzer) {
      const result = window.MCAnalyzer.analyze(text);
      callback(null, {
        scores: result.scores,
        dominant: result.dominant,
        summary: '',
        source: 'local',
      });
    } else {
      callback(new Error('No analyzer available'), null);
    }
  }

  // Fallback 到本地 roastSummary
  function fallbackToRoast(analysis, callback) {
    if (window.MCAnalyzer) {
      const result = window.MCAnalyzer.roastSummary(analysis);
      callback(null, result.text);
    } else {
      callback(new Error('No analyzer available'), null);
    }
  }

  // AI聊天接口
  function chat(messages, callback, timeout = 10000) {
    if (!isAIEnabled()) {
      callback(new Error('AI not enabled'), null);
      return;
    }

    const cfg = window.MCAIConfig.getActiveConfig();
    if (!cfg) {
      callback(new Error('No AI config'), null);
      return;
    }

    const aiTimeout = setTimeout(() => {
      callback(new Error('AI response timeout'), null);
    }, timeout);

    callAI(cfg, messages, (err, content) => {
      clearTimeout(aiTimeout);
      if (err || !content) {
        callback(err || new Error('No response'), null);
        return;
      }
      // 清理回复中的多余空白
      const cleaned = content.trim();
      callback(null, cleaned);
    });
  }

  // 测试连接
  function testConnection(cfg, callback) {
    const messages = [
      {
        role: 'user',
        content: 'Hi, respond with OK',
      },
    ];

    const timeout = setTimeout(() => {
      callback(new Error('Connection timeout'), null);
    }, 10000);

    callAI(cfg, messages, (err, content) => {
      clearTimeout(timeout);
      if (err) {
        callback(err, null);
        return;
      }
      if (content && content.toLowerCase().includes('ok')) {
        callback(null, 'Connection OK');
      } else {
        callback(null, 'Connected but unexpected response: ' + content);
      }
    });
  }

  window.MCAIService = {
    isAIEnabled,
    analyzeWithAI,
    generateRoastWithAI,
    testConnection,
    chat,
  };
})();
