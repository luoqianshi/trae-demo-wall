/**
 * LLM 客户端（当前支持 KIMI / Moonshot）
 * 仅做可选辅助，失败时不影响本地规则
 */
const https = require('https');

const DEFAULT_MODEL = process.env.KIMI_MODEL || 'moonshot-v1-8k';
const KIMI_ENDPOINT = 'api.moonshot.cn';

function isProviderAvailable(provider, apiKey) {
  if (provider !== 'kimi') return false;
  return !!(apiKey || process.env.KIMI_API_KEY);
}

function requestKimi(apiKey, messages, model) {
  const key = apiKey || process.env.KIMI_API_KEY;
  const payload = JSON.stringify({
    model: model || DEFAULT_MODEL,
    messages,
    temperature: 0.3,
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: KIMI_ENDPOINT,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 30000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          return reject(new Error(`KIMI API HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        }
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error(`KIMI 响应解析失败: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('KIMI API 请求超时'));
    });

    req.write(payload);
    req.end();
  });
}

function buildPrompt(rawText) {
  return `你是短视频包装助手。请从下面的口播稿里挑出真正适合做包装的重点内容。
每个包装点请按 JSON 对象返回，数组格式如下：
[
  {
    "text": "原文中的关键句（尽量完整但不超过 60 字）",
    "displayText": "包装上实际显示的短文案，控制在 15 字以内，只保留核心数字/观点/引语/日期/短标题",
    "type": "data_card 或 quote_highlight 或 timeline_node 或 title_card",
    "presetId": "可选，从下方推荐里选最合适的 ID"
  }
]

可选预设：
- 数据卡（data_card）：data_card_v1 大气数字、data_card_v2 对比卡片、data_card_v3 趋势卡片、data_card_v4 环形进度、data_card_v5 迷你标签
- 观点花字（quote_highlight）：quote_highlight_v1 左线引用、quote_highlight_v2 居中引用、quote_highlight_v3 说话人卡片、quote_highlight_v4 气泡引用、quote_highlight_v5 下划线强调
- 时间轴（timeline_node）：timeline_node_v1 单节点、timeline_node_v2 双节点对比、timeline_node_v3 流程轴、timeline_node_v4 日期卡片、timeline_node_v5 里程碑
- 标题/结论卡（title_card）：title_card_v1 大气标题、title_card_v2 副标题卡片、title_card_v3 左线标题、title_card_v4 结论卡片、title_card_v5 章节标签

请只输出 JSON 数组，不要任何解释、markdown 代码块或额外文字。

口播稿：
${rawText}`;
}

function parseLLMResponse(content) {
  let text = (content || '').trim();
  // 去除可能的 markdown 代码块
  if (text.startsWith('```')) {
    text = text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
  }
  const arr = JSON.parse(text);
  if (!Array.isArray(arr)) throw new Error('LLM 返回不是数组');
  return arr.map((item, idx) => ({
    id: `llm-${Date.now()}-${idx}`,
    text: String(item.text || item.displayText || '').trim(),
    type: item.type || 'title_card',
    confidence: typeof item.confidence === 'number' ? item.confidence : 0.85,
    suggestedTemplate: item.presetId || undefined,
    extractedData: {
      displayText: String(item.displayText || item.text || '').trim(),
      ...(item.type === 'data_card' ? {
        mainText: String(item.displayText || item.text || '').trim(),
        number: String(item.displayText || item.text || '').match(/[\d,.]+/)?.[0] || '',
        unit: String(item.displayText || item.text || '').replace(/[\d,.]+/, '').trim(),
      } : {}),
      ...(item.type === 'quote_highlight' ? {
        quoteText: String(item.displayText || item.text || '').trim(),
      } : {}),
      ...(item.type === 'timeline_node' ? {
        timeText: String(item.displayText || item.text || '').trim(),
      } : {}),
      ...(item.type === 'title_card' || item.type === 'conclusion_box' ? {
        titleText: String(item.displayText || item.text || '').trim(),
      } : {}),
    },
  }));
}

async function callLLM(rawText, provider = 'kimi', apiKey) {
  if (!isProviderAvailable(provider, apiKey)) {
    throw new Error(`${provider} 不可用：缺少 API Key`);
  }

  const messages = [
    { role: 'system', content: '你是一个专业的短视频包装策划助手，只输出 JSON。' },
    { role: 'user', content: buildPrompt(rawText) },
  ];

  const json = await requestKimi(apiKey, messages);
  const content = json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;
  if (!content) throw new Error('KIMI 响应缺少内容');

  return parseLLMResponse(content);
}

module.exports = {
  isProviderAvailable,
  callLLM,
};
