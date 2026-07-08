/**
 * M3 · AI 生成模块
 *
 * 负责：Prompt 工程、AI 服务调用（OpenAI 兼容接口）、结果解析、多版本回复生成、情绪解读。
 * 依赖：EventBus（event-bus.js）
 */

import { EventBus } from './event-bus.js';

// ============================================================
// 常量
// ============================================================

/** 超时时间（毫秒） */
const TIMEOUT_MS = 30_000;

/** 最大自动重试次数 */
const MAX_RETRIES = 1;

/** 对话消息保留上限 */
const MAX_MESSAGES = 30;

/** LocalStorage 中 Provider 配置的 Key */
const STORAGE_KEY_PROVIDERS = 'ycjs_providers';

/** 默认 Provider 列表（不含 apiKey，由用户填写） */
const DEFAULT_PROVIDERS = [
  {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    maxTokens: 1024,
    temperature: 0.7,
    enabled: true,
    apiKey: '',
  },
  {
    name: '智谱 AI',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
    maxTokens: 1024,
    temperature: 0.7,
    enabled: true,
    apiKey: '',
  },
  {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    maxTokens: 1024,
    temperature: 0.7,
    enabled: true,
    apiKey: '',
  },
  {
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-turbo',
    maxTokens: 1024,
    temperature: 0.7,
    enabled: true,
    apiKey: '',
  },
  {
    name: '火山引擎 Ark',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    model: 'doubao-seed-2-0-mini-260428',
    maxTokens: 1024,
    temperature: 0.7,
    enabled: true,
    apiKey: '',
  },
];

/** System Prompt（严格按设计文档） */
const SYSTEM_PROMPT = `你是一位专业的沟通顾问，擅长分析对话上下文并提供恰当的回复建议。

核心规则：
1. 必须基于完整对话历史理解语境，绝不能只看最后一条消息
2. 提供 3 个风格明显不同的回复版本，让用户可以根据实际沟通场景选择
3. 每个回复必须贴合上下文，像是用户本人会说的话
4. 回复要自然、得体，符合中文日常聊天习惯
5. 不要过度正式或生硬，保持真实对话感
6. 每个回复控制在 100 字以内`;

// ============================================================
// 工具函数
// ============================================================

/**
 * 生成简易唯一 ID
 * @returns {string}
 */
function generateId() {
  return 'opt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * 从 LocalStorage 读取 Provider 配置，合并到 DEFAULT_PROVIDERS 上
 * @returns {Array} Provider 配置数组
 */
function loadProviders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROVIDERS);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_PROVIDERS));

    const saved = JSON.parse(raw);
    // 以默认列表为基准，用存储数据覆盖可写字段
    return DEFAULT_PROVIDERS.map((def, i) => ({
      ...def,
      ...(saved[i] || {}),
    }));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_PROVIDERS));
  }
}

/**
 * 将 Provider 配置数组写入 LocalStorage
 * @param {Array} providers
 */
function saveProviders(providers) {
  localStorage.setItem(STORAGE_KEY_PROVIDERS, JSON.stringify(providers));
}

/**
 * 截断消息列表，保留最近 MAX_MESSAGES 条
 * @param {Array} messages
 * @returns {Array}
 */
function truncateMessages(messages) {
  if (messages.length <= MAX_MESSAGES) return messages;
  return messages.slice(-MAX_MESSAGES);
}

/**
 * 构建 User Prompt
 * @param {object} request
 * @returns {string}
 */
function buildUserPrompt({ messages, myName, otherName, tone, context }) {
  // 构建对话历史文本
  const history = messages
    .map((m) => `${m.sender}: ${m.content}`)
    .join('\n');

  // 语气风格映射（更丰富的风格描述）
  const toneStyleMap = {
    formal: '正式得体（适合职场、商务沟通）',
    casual: '轻松随意（适合朋友间日常聊天）',
    friendly: '温和友好（适合拉近关系、化解尴尬）',
    professional: '专业严谨（适合工作对接、客户沟通）',
  };
  const styleHint = tone && toneStyleMap[tone]
    ? `\n期望整体风格：${toneStyleMap[tone]}`
    : '\n期望整体风格：自然日常，贴近真实聊天';

  // 补充背景
  const contextBlock = context ? `\n补充背景：${context}` : '';

  return `对话上下文：
${myName} 和 ${otherName} 的聊天记录：

${history}

---

请提供：
1. 3 个不同风格的回复方案（温和版、直接版、委婉版）
2. 对方近期消息（特别是最后 1-3 条）的情绪变化、潜台词和真实意图分析
3. 每个回复方案附 1 句推荐理由
${styleHint}${contextBlock}

输出格式（严格按 JSON）：
{
  "replyOptions": [
    {"label": "温和版", "content": "...", "reasoning": "..."},
    {"label": "直接版", "content": "...", "reasoning": "..."},
    {"label": "委婉版", "content": "...", "reasoning": "..."}
  ],
  "emotionAnalysis": {
    "overallEmotion": "...",
    "intensity": 7,
    "subtext": "...",
    "suggestedApproach": "...",
    "keyPhrases": ["..."]
  }
}`;
}

/**
 * 从 AI 返回的文本中提取 JSON 块
 * 优先尝试整体 JSON.parse，失败后用正则 /\{[\s\S]*\}/ 提取
 * @param {string} text
 * @returns {object|null}
 */
function extractJSON(text) {
  // 先尝试直接解析
  try {
    return JSON.parse(text);
  } catch {
    // 忽略，继续正则提取
  }

  // 正则提取第一个完整 JSON 对象
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {
      // 仍无法解析
    }
  }

  return null;
}

/**
 * 校验并规范化 AIResponse 结构
 * @param {object} parsed
 * @returns {object}
 */
function normalizeResponse(parsed) {
  const replyOptions = (parsed.replyOptions || []).map((opt) => ({
    id: opt.id || generateId(),
    label: opt.label || '方案',
    content: opt.content || '',
    reasoning: opt.reasoning || '',
  }));

  let emotionAnalysis = undefined;
  if (parsed.emotionAnalysis) {
    const ea = parsed.emotionAnalysis;
    emotionAnalysis = {
      overallEmotion: ea.overallEmotion || '未知',
      intensity: typeof ea.intensity === 'number' ? Math.min(10, Math.max(1, ea.intensity)) : 5,
      subtext: ea.subtext || '',
      suggestedApproach: ea.suggestedApproach || '',
      keyPhrases: Array.isArray(ea.keyPhrases) ? ea.keyPhrases : [],
    };
  }

  return {
    success: true,
    replyOptions,
    emotionAnalysis,
  };
}

/**
 * 创建带超时的 AbortController
 * @param {number} timeoutMs
 * @returns {{ controller: AbortController, timeoutId: number }}
 */
function createTimeoutController(timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeoutId };
}

// ============================================================
// AIGeneration 对象
// ============================================================

const AIGeneration = {
  /** 是否正在生成中（防重复提交） */
  _isLoading: false,

  /** 当前请求的 AbortController（用于中断） */
  _abortController: null,

  /** 当前超时定时器 */
  _timeoutId: null,

  /**
   * 核心 AI 生成方法
   * @param {object} request
   * @param {Array}  request.messages         - 完整对话历史 [{sender, senderRole, content}]
   * @param {string} request.myName           - 用户自己的昵称
   * @param {string} request.otherName        - 对方昵称
   * @param {string} [request.requestType='both'] - 'reply' | 'analysis' | 'both'
   * @param {string} [request.tone='casual']  - 期望语气
   * @param {string} [request.context='']     - 额外补充背景
   * @param {string} [request.sessionId='']  - 会话 ID（用于事件载荷）
   * @returns {Promise<object>} AIResponse
   */
  async generate(request) {
    const {
      messages,
      myName,
      otherName,
      requestType = 'both',
      tone = 'casual',
      context = '',
      sessionId = '',
    } = request;

    // 防重复提交
    if (this._isLoading) {
      throw new Error('正在生成中，请稍候再试');
    }
    this._isLoading = true;

    try {
      // 获取当前活跃 Provider
      const providers = loadProviders();
      const activeProvider = providers.find((p) => p.enabled && p.apiKey);

      if (!activeProvider) {
        throw new Error('请先在设置中配置 AI 服务 API Key');
      }

      // 截断过长对话
      const trimmedMessages = truncateMessages(messages || []);

      if (trimmedMessages.length === 0) {
        throw new Error('对话内容为空，无法生成回复');
      }

      // 构建 Prompt
      const systemPrompt = SYSTEM_PROMPT;
      const userPrompt = buildUserPrompt({
        messages: trimmedMessages,
        myName,
        otherName,
        tone,
        context,
      });

      // 发起 API 调用（含自动重试）
      const resultText = await this._callAI(
        activeProvider,
        systemPrompt,
        userPrompt,
        MAX_RETRIES
      );

      // 解析 JSON
      const parsed = extractJSON(resultText);
      if (!parsed) {
        throw new Error('AI 返回的内容无法解析为有效 JSON，请重试');
      }

      // 规范化响应结构
      const response = normalizeResponse(parsed);

      return response;
    } catch (error) {
      // 触发错误事件
      const errorMsg =
        error.name === 'AbortError'
          ? '生成已取消'
          : error.message || '生成失败，请检查网络或稍后重试';

      EventBus.emit('ai:generation-error', { sessionId, error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      this._isLoading = false;
      this._abortController = null;
    }
  },

  /**
   * 调用 AI 服务（OpenAI 兼容 chat/completions 接口）
   * @param {object} provider  - Provider 配置
   * @param {string} systemPrompt
   * @param {string} userPrompt
   * @param {number} retries   - 剩余重试次数
   * @returns {Promise<string>} AI 返回的文本内容
   */
  async _callAI(provider, systemPrompt, userPrompt, retries) {
    const { controller, timeoutId } = createTimeoutController(TIMEOUT_MS);
    this._abortController = controller;
    this._timeoutId = timeoutId;

    const url = `${provider.baseUrl.replace(/\/+$/, '')}/chat/completions`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: provider.maxTokens,
          temperature: provider.temperature,
        }),
        signal: controller.signal,
      });

      // 超时或取消
      if (!response.ok) {
        let detail = '';
        try {
          const errBody = await response.json();
          detail = errBody.error?.message || errBody.message || JSON.stringify(errBody);
        } catch {
          detail = response.statusText;
        }
        throw new Error(`API 请求失败（${response.status}）：${detail}`);
      }

      const data = await response.json();

      // 提取返回文本
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('AI 服务返回了空内容');
      }

      // 清除超时定时器
      clearTimeout(timeoutId);

      return content;
    } catch (error) {
      clearTimeout(timeoutId);

      // 用户主动取消，不重试
      if (error.name === 'AbortError') {
        throw error;
      }

      // 还有重试机会则自动重试
      if (retries > 0) {
        console.warn(`[AIGeneration] 请求失败，自动重试（剩余 ${retries} 次）：`, error.message);
        return this._callAI(provider, systemPrompt, userPrompt, retries - 1);
      }

      throw error;
    }
  },

  /**
   * 仅做情绪分析（复用 generate 逻辑，但只返回 emotionAnalysis）
   * @param {object} request - 同 generate 参数
   * @returns {Promise<object>} EmotionAnalysis
   */
  async analyzeEmotion(request) {
    const response = await this.generate({
      ...request,
      requestType: 'analysis',
    });

    if (!response.emotionAnalysis) {
      throw new Error('AI 未能返回有效的情绪分析结果');
    }

    return response.emotionAnalysis;
  },

  /**
   * 获取当前已配置的 Provider 列表
   * @returns {Array} AIProviderConfig[]
   */
  getProviders() {
    return loadProviders();
  },

  /**
   * 更新指定 Provider 的配置
   * @param {number} index  - Provider 在列表中的索引
   * @param {object} config - 需要更新的字段
   */
  setProviderConfig(index, config) {
    const providers = loadProviders();
    if (index < 0 || index >= providers.length) {
      console.warn(`[AIGeneration] Provider 索引越界：${index}`);
      return;
    }
    providers[index] = { ...providers[index], ...config };
    saveProviders(providers);
  },

  /**
   * 测试指定 Provider 的 API 连通性
   * @param {number} providerIndex
   * @returns {Promise<boolean>} 是否连通
   */
  async testConnection(providerIndex) {
    const providers = loadProviders();
    const provider = providers[providerIndex];

    if (!provider) {
      throw new Error(`Provider 索引 ${providerIndex} 不存在`);
    }
    if (!provider.apiKey) {
      throw new Error(`${provider.name} 尚未配置 API Key`);
    }

    const url = `${provider.baseUrl.replace(/\/+$/, '')}/chat/completions`;

    const { controller, timeoutId } = createTimeoutController(10_000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'user', content: '你好' },
          ],
          max_tokens: 16,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      clearTimeout(timeoutId);
      return false;
    }
  },

  /**
   * 中断当前正在进行的生成请求
   */
  abort() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
  },
};

// ============================================================
// 导出
// ============================================================

export { AIGeneration };
export default AIGeneration;
