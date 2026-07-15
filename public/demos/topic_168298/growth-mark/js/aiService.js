/**
 * 成长印记 · AI 服务层（aiService.js）
 *
 * 统一的 AI 调用入口，根据用户配置自动选择：
 *   - 启用 API 时：调用 OpenAI 兼容格式的真实 API
 *   - 未启用或调用失败时：回退到本地 MOCK（mockAI.js）
 *
 * 设计原则：
 *   1. 统一接口：processRecord() 为唯一入口，外部不关心内部实现
 *   2. 渐进降级：API 失败自动回退 MOCK，保证用户体验不中断
 *   3. 本地存储：配置信息保存在 localStorage，不上传任何服务器
 */

'use strict';

// ============================================================
// 默认系统提示词（指导 LLM 输出结构化 JSON）
// ============================================================
const DEFAULT_SYSTEM_PROMPT = `你是一个成长记录分析助手。请分析用户输入的内容，输出 JSON 格式的分析结果。

要求：
1. 理解内容主题，生成精炼的标题（不超过30字）
2. 提取核心摘要（不超过80字）
3. 生成 3-5 个相关标签（第一个标签为主要分类：工作/学习/项目/情绪/成长）
4. 判断是否为里程碑时刻：
   - first_step: 首次出现的新领域标签
   - breakthrough: 从困难到突破的成长（不确定则为 null）
   - cross_node: 横跨多个领域
5. 给出温暖回应（里程碑时刻才需要，否则为 null）

输出格式：
{
  "understanding": {
    "title": "string",
    "summary": "string",
    "tags": ["string"]
  },
  "milestone": "first_step" | "breakthrough" | "cross_node" | null,
  "warmResponse": "string" | null
}

注意：
- 标签必须是中文，简洁有意义
- 里程碑判断要保守，不确定则为 null`;

// ============================================================
// 常用地址预设（OpenAI 兼容格式，地址不同但接口协议相同）
// ============================================================
const PRESET_CONFIGS = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  trae: {
    baseUrl: 'https://trae-api.cn.mchost.guru/api/v1',
    models: ['gpt-4o-mini', 'gpt-4o', 'claude-3.5-sonnet', 'deepseek-v2']
  }
};

// ============================================================
// 默认配置
// ============================================================
const DEFAULT_CONFIG = {
  enabled: false,
  baseUrl: '',
  apiKey: '',
  model: '',
  temperature: 0.7,
  maxTokens: 8192,
  timeout: 60000,          // API 调用超时时间（毫秒），默认 60 秒
  maxRetryCount: 3,        // 连续失败最大次数，超过后熔断
  retryResetTime: 300000,  // 熔断重置时间（毫秒），默认 5 分钟
  systemPrompt: DEFAULT_SYSTEM_PROMPT
};

// ============================================================
// AIService 对象
// ============================================================
const AIService = {
  // 当前配置
  _config: { ...DEFAULT_CONFIG },

  // localStorage 存储键名
  _storageKey: 'growthmark_ai_config',

  // 上次 API 调用是否失败（用于提示用户）
  _lastApiFailed: false,
  _lastError: null,

  // 熔断机制状态
  _failedCount: 0,          // 连续失败计数
  _lastFailTime: 0,         // 最后一次失败时间戳

  // ============================================================
  // 初始化：从 localStorage 加载配置
  // ============================================================
  init() {
    try {
      const saved = localStorage.getItem(this._storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        this._config = { ...DEFAULT_CONFIG, ...parsed };
        // 确保 systemPrompt 有值（空值时用默认）
        if (!this._config.systemPrompt || !this._config.systemPrompt.trim()) {
          this._config.systemPrompt = DEFAULT_SYSTEM_PROMPT;
        }
      }
      console.log('[成长印记] AI 服务初始化完成', {
        enabled: this._config.enabled,
        baseUrl: this._config.baseUrl || '(未设置)',
        model: this._config.model || '(未设置)'
      });
    } catch (e) {
      console.error('[成长印记] AI 配置加载失败，使用默认配置', e);
      this._config = { ...DEFAULT_CONFIG };
    }
  },

  // ============================================================
  // 核心方法：处理记录
  // 自动选择 API 或 MOCK，失败时降级
  // ============================================================
  async processRecord(input) {
    if (!input || input.trim().length === 0) return null;
    input = input.trim();

    // 未启用 API → 直接用 MOCK
    if (!this._config.enabled) {
      return this._callMock(input);
    }

    // 已启用 → 尝试 API 调用（带超时和熔断保护）
    try {
      // 先检查熔断状态
      this._checkCircuitBreaker();

      // 带超时的 API 调用
      const result = await this._callAPIWithTimeout(input);

      // 调用成功：重置失败状态
      this._resetFailState();

      // API 返回的是部分结构，需要补充 originalContent 和本地关联计算
      return this._buildFullRecord(input, result);
    } catch (err) {
      console.warn('[成长印记] API 调用失败，回退到 MOCK', err);

      // 记录失败（用于熔断）
      this._recordFail(err.message || String(err));

      // 降级到 MOCK
      return this._callMock(input);
    }
  },

  // ============================================================
  // 测试 API 连接
  // 返回 { success: boolean, message: string }
  // ============================================================
  async testConnection() {
    if (!this._config.apiKey || !this._config.baseUrl || !this._config.model) {
      return { success: false, message: '请先填写完整的 API 配置（密钥、地址、模型）' };
    }

    try {
      const response = await fetch(this._config.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this._config.apiKey
        },
        body: JSON.stringify({
          model: this._config.model,
          messages: [
            { role: 'user', content: 'hi' }
          ],
          max_tokens: 10,
          temperature: 0
        })
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        return {
          success: false,
          message: `连接失败 (${response.status})：${errorText.slice(0, 100) || response.statusText}`
        };
      }

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        return { success: true, message: '连接成功！API 正常工作。' };
      } else {
        return { success: false, message: '响应格式异常，请检查 API 地址和模型名称' };
      }
    } catch (err) {
      return {
        success: false,
        message: '网络错误：' + (err.message || String(err)) + '（可能是 CORS 跨域限制）'
      };
    }
  },

  // ============================================================
  // 保存配置
  // ============================================================
  saveConfig(config) {
    // 合并配置，保留未传的字段
    this._config = { ...this._config, ...config };
    // 确保 systemPrompt 有值
    if (!this._config.systemPrompt || !this._config.systemPrompt.trim()) {
      this._config.systemPrompt = DEFAULT_SYSTEM_PROMPT;
    }
    // 保存到 localStorage
    try {
      localStorage.setItem(this._storageKey, JSON.stringify(this._config));
    } catch (e) {
      console.error('[成长印记] AI 配置保存失败', e);
    }
  },

  // ============================================================
  // 获取当前配置
  // ============================================================
  getConfig() {
    return { ...this._config };
  },

  // ============================================================
  // 获取默认系统提示词
  // ============================================================
  getDefaultSystemPrompt() {
    return DEFAULT_SYSTEM_PROMPT;
  },

  // ============================================================
  // 获取预设配置列表
  // ============================================================
  getPresets() {
    return PRESET_CONFIGS;
  },

  // ============================================================
  // 获取当前状态
  // ============================================================
  getStatus() {
    // 计算熔断剩余时间
    let fuseRemainingSec = 0;
    if (this._failedCount >= this._config.maxRetryCount && this._lastFailTime > 0) {
      const elapsed = Date.now() - this._lastFailTime;
      if (elapsed < this._config.retryResetTime) {
        fuseRemainingSec = Math.ceil((this._config.retryResetTime - elapsed) / 1000);
      }
    }

    return {
      enabled: this._config.enabled,
      usingAPI: this._config.enabled && !this._lastApiFailed && fuseRemainingSec === 0,
      baseUrl: this._config.baseUrl,
      model: this._config.model,
      lastApiFailed: this._lastApiFailed,
      lastError: this._lastError,
      failedCount: this._failedCount,
      fuseRemainingSec: fuseRemainingSec,
      timeout: this._config.timeout
    };
  },

  // ============================================================
  // 内部方法：带超时的 API 调用
  // 使用 Promise.race 实现超时控制
  // ============================================================
  async _callAPIWithTimeout(input) {
    // 保底超时：至少 30s，且随 maxTokens 线性增长（每 token 约 30ms）
    const baseTimeout = this._config.timeout || 60000;
    const minTimeout = Math.max(30000, (this._config.maxTokens || 1024) * 30);
    const timeout = Math.max(baseTimeout, minTimeout);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`API 调用超时（${timeout}ms 未收到响应）`));
      }, timeout);
    });

    const apiPromise = this._callAPI(input);

    return await Promise.race([apiPromise, timeoutPromise]);
  },

  // ============================================================
  // 内部方法：检查熔断状态
  // 连续失败超过阈值时，在熔断期内直接抛出错误触发降级
  // ============================================================
  _checkCircuitBreaker() {
    const { maxRetryCount, retryResetTime } = this._config;
    if (this._failedCount >= maxRetryCount && this._lastFailTime > 0) {
      const now = Date.now();
      const elapsed = now - this._lastFailTime;
      if (elapsed < retryResetTime) {
        const remainSec = Math.ceil((retryResetTime - elapsed) / 1000);
        throw new Error(`API 连续失败 ${this._failedCount} 次，已自动熔断。${remainSec} 秒后自动恢复。`);
      }
    }
  },

  // ============================================================
  // 内部方法：记录 API 调用失败
  // ============================================================
  _recordFail(errorMessage) {
    this._failedCount++;
    this._lastFailTime = Date.now();
    this._lastApiFailed = true;
    this._lastError = errorMessage;
    console.debug('[成长印记] API 调用失败时的请求配置', {
      baseUrl: this._config.baseUrl,
      model: this._config.model,
      maxTokens: this._config.maxTokens,
      temperature: this._config.temperature,
      timeout: this._config.timeout
    });
  },

  // ============================================================
  // 内部方法：重置失败状态（调用成功时调用）
  // ============================================================
  _resetFailState() {
    this._failedCount = 0;
    this._lastFailTime = 0;
    this._lastApiFailed = false;
    this._lastError = null;
  },

  // ============================================================
  // 内部方法：调用本地 MOCK
  // ============================================================
  _callMock(input) {
    if (typeof processRecord === 'function') {
      return processRecord(input);
    }
    // 极端兜底：mockAI 未加载时返回基础结构
    return {
      originalContent: input,
      understanding: {
        title: input.slice(0, 20) + (input.length > 20 ? '…' : ''),
        summary: input.slice(0, 60) + (input.length > 60 ? '…' : ''),
        tags: ['记录']
      },
      warmResponse: null,
      milestone: null
    };
  },

  // ============================================================
  // 内部方法：调用真实 API
  // ============================================================
  async _callAPI(input) {
    const { baseUrl, apiKey, model, temperature, maxTokens, systemPrompt } = this._config;

    if (!baseUrl || !apiKey || !model) {
      throw new Error('API 配置不完整');
    }

    const url = baseUrl.replace(/\/$/, '') + '/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        temperature: temperature,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 200) || response.statusText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('API 响应格式异常：缺少 choices');
    }

    const content = data.choices[0].message.content;
    console.log('[成长印记] API 原始响应', {
      finish_reason: data.choices[0].finish_reason,
      content
    });

    // 弹性 JSON 提取：先直接解析，失败则尝试从文本中提取 JSON 对象
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          throw new Error('API 返回的不是有效的 JSON：\n' + content);
        }
      } else {
        throw new Error('API 返回的不是有效的 JSON：\n' + content);
      }
    }

    // 校验必要字段
    if (!parsed.understanding || typeof parsed.understanding !== 'object') {
      throw new Error('API 返回缺少 understanding 字段');
    }

    return parsed;
  },

  // ============================================================
  // 内部方法：将 API 返回的部分结构补全为完整记录
  // 补充 originalContent，并让本地 buildRelations 计算关联
  // ============================================================
  _buildFullRecord(input, apiResult) {
    const record = {
      originalContent: input,
      understanding: {
        title: apiResult.understanding.title || '未命名记录',
        summary: apiResult.understanding.summary || '',
        tags: Array.isArray(apiResult.understanding.tags)
          ? apiResult.understanding.tags.filter(t => typeof t === 'string' && t.trim()).slice(0, 5)
          : ['记录']
      },
      warmResponse: apiResult.warmResponse || null,
      milestone: apiResult.milestone || null
    };

    // 确保至少有一个标签
    if (record.understanding.tags.length === 0) {
      record.understanding.tags.push('记录');
    }

    // 关联计算留给 Store.addRecord() 或 buildRelations 处理
    // 这里不计算，保持与 MOCK 模式一致的流程
    // 保存 API 原始响应到记录，卡片中可查看完整回复
    record.rawApiResponse = apiResult;

    return record;
  }
};
