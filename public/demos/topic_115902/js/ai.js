/**
 * 医知通 - AI 引擎模块
 * 接入 DeepSeek API (deepseek-v4-flash) 实现真正的自然语言智能问答
 */

// AI 配置 — DeepSeek flash 模式
// API Key 从 localStorage 读取，避免硬编码泄露
const AI_CONFIG = {
  apiKey: '',
  apiUrl: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-v4-flash',
  maxTokens: 1500,
  temperature: 0.3
};

// 从 localStorage 加载 API Key
(function loadApiKey() {
  try {
    const savedKey = localStorage.getItem('yzt_api_key');
    if (savedKey && savedKey.trim().length > 0) {
      AI_CONFIG.apiKey = savedKey.trim();
    }
  } catch (e) {
    console.warn('无法读取 API Key');
  }
})();

// AI 引擎
const AIEngine = {

  /**
   * 检查 API 是否可用
   */
  isAvailable() {
    return AI_CONFIG.apiKey && AI_CONFIG.apiKey.length > 0;
  },

  /**
   * 构建 System Prompt
   */
  buildSystemPrompt(context) {
    let prompt = `你是"医知通"，一个专业的临床知识智能速查助手。你的用户是一线临床医生、医学生和基层医务人员。

请遵循以下原则：
1. 回答必须基于循证医学证据，优先使用提供的知识库上下文
2. 回答要简洁、结构化，适合临床场景下快速阅读
3. 对于药品相互作用、禁忌等问题，必须明确标注风险等级（高风险/中风险/低风险）
4. 如果问题超出你的知识范围或涉及具体患者诊疗决策，请明确提示"请咨询专科医生"
5. 所有回答末尾附注"本回答仅供参考，临床决策请遵循医嘱"
6. 对于检验指标解读，需给出参考范围和临床意义
7. 回答使用中文，使用 markdown 格式（**加粗**、### 小标题、- 列表）`;

    if (context && context.length > 0) {
      prompt += `\n\n以下是知识库中与用户问题相关的参考信息，请优先基于这些信息回答：\n\n${context}`;
    }

    return prompt;
  },

  /**
   * 调用 DeepSeek API
   */
  async ask(query, context = '') {
    if (!this.isAvailable()) {
      throw new Error('未配置 API Key，请在 js/ai.js 中配置 AI_CONFIG.apiKey');
    }

    const systemPrompt = this.buildSystemPrompt(context);

    const requestBody = {
      model: AI_CONFIG.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      stream: false
    };

    const response = await fetch(AI_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `API 请求失败 (${response.status})`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      throw new Error('API 返回空结果');
    }

    return answer.trim();
  },

  /**
   * 流式调用 DeepSeek API（用于实时打字效果）
   */
  async askStream(query, context = '', onChunk) {
    if (!this.isAvailable()) {
      throw new Error('未配置 API Key');
    }

    const systemPrompt = this.buildSystemPrompt(context);

    const requestBody = {
      model: AI_CONFIG.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      stream: true
    };

    const response = await fetch(AI_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API 请求失败 (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              if (onChunk) onChunk(fullText);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    return fullText.trim();
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AIEngine, AI_CONFIG };
} else {
  window.AIEngine = AIEngine;
  window.AI_CONFIG = AI_CONFIG;
}
