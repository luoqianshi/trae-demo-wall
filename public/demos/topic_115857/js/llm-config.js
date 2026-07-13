const LLMConfig = {
  presets: [
    {
      id: 'openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o',
      apiKey: '',
      requestFormat: 'openai',
      description: 'GPT-4o，创意写作能力强'
    },
    {
      id: 'claude',
      name: 'Claude (Anthropic)',
      baseUrl: 'https://api.anthropic.com/v1/messages',
      model: 'claude-3-5-sonnet-20240620',
      apiKey: '',
      requestFormat: 'anthropic',
      description: 'Claude 3.5 Sonnet，长文本和深度创作'
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com/chat/completions',
      model: 'deepseek-chat',
      apiKey: '',
      requestFormat: 'openai',
      description: '国产模型，性价比高，中文好'
    },
    {
      id: 'tongyi',
      name: '通义千问',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      model: 'qwen-plus',
      apiKey: '',
      requestFormat: 'openai',
      description: '阿里通义千问（OpenAI 兼容模式）'
    },
    {
      id: 'doubao',
      name: '豆包 (火山引擎 Ark)',
      baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      model: '',
      apiKey: '',
      requestFormat: 'openai',
      description: '字节豆包，模型处填写推理点ID（ep-开头）'
    },
    {
      id: 'zhipu',
      name: '智谱AI',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model: 'glm-4',
      apiKey: '',
      requestFormat: 'openai',
      description: '智谱清言，国产大模型'
    },
    {
      id: 'coding_plan_aliyun',
      name: '阿里云 Coding Plan (OpenAI)',
      baseUrl: 'https://coding.dashscope.aliyuncs.com/v1/chat/completions',
      model: 'qwen3.5-plus',
      apiKey: '',
      requestFormat: 'openai',
      description: '阿里云百炼 Coding Plan。Base 可只填到 /v1，系统会自动补 /chat/completions；Key 通常 sk-sp- 开头'
    },
    {
      id: 'custom',
      name: '自定义',
      baseUrl: '',
      model: '',
      apiKey: '',
      requestFormat: 'auto',
      description: '使用你自己的接口地址'
    }
  ],

  temperatureMap: {
    story_idea: 0.9,
    world_building: 0.9,
    character: 0.9,
    outline: 0.8,
    episode_outline: 0.8,
    script: 0.9,
    shot_list: 0.6,
    storyboard_desc: 0.6,
    character_art: 0.7,
    scene_art: 0.7,
    frame_art: 0.7,
    optimize: 0.7,
    general: 0.7
  },

  getTemperature(promptType) {
    return this.temperatureMap[promptType] || 0.7;
  },

  getPreset(id) {
    return this.presets.find(p => p.id === id);
  },

  getAllPresets() {
    return [...this.presets];
  },

  createConfigFromPreset(presetId) {
    const preset = this.getPreset(presetId);
    if (!preset) return null;

    return {
      id: `config_${Date.now()}`,
      name: preset.name,
      presetId: preset.id,
      baseUrl: preset.baseUrl,
      model: preset.model,
      apiKey: '',
      maxTokens: null,
      requestFormat: preset.requestFormat || 'auto',
      createdAt: new Date().toISOString()
    };
  },

  validateConfig(config) {
    const errors = [];

    if (!config.name || config.name.trim() === '') {
      errors.push('配置名称不能为空');
    }
    if (!config.baseUrl || config.baseUrl.trim() === '') {
      errors.push('API地址不能为空');
    }
    if (!config.model || config.model.trim() === '') {
      errors.push('模型名称不能为空');
    }
    if (!config.apiKey || config.apiKey.trim() === '') {
      errors.push('API密钥不能为空');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  getConfigs() {
    return Storage.loadLLMConfigs();
  },

  saveConfigs(configs) {
    return Storage.saveLLMConfigs(configs);
  },

  addConfig(config) {
    const configs = this.getConfigs();
    configs.push(config);
    this.saveConfigs(configs);
    return config;
  },

  updateConfig(id, updates) {
    const configs = this.getConfigs();
    const index = configs.findIndex(c => c.id === id);
    if (index === -1) return null;

    configs[index] = { ...configs[index], ...updates };
    this.saveConfigs(configs);
    return configs[index];
  },

  deleteConfig(id) {
    const configs = this.getConfigs();
    const filtered = configs.filter(c => c.id !== id);
    this.saveConfigs(filtered);

    const defaultId = Storage.getDefaultConfigId();
    if (defaultId === id) {
      Storage.saveDefaultConfig(filtered.length > 0 ? filtered[0].id : null);
    }

    return true;
  },

  getDefaultConfig() {
    const defaultId = Storage.getDefaultConfigId();
    if (!defaultId) return null;

    const configs = this.getConfigs();
    return configs.find(c => c.id === defaultId) || null;
  },

  setDefaultConfig(id) {
    return Storage.saveDefaultConfig(id);
  },

  /**
   * 解析请求格式：
   * - openai: { model, messages, ... } Chat Completions
   * - anthropic: Anthropic Messages
   * - dashscope: 通义原生 { model, input: { messages }, parameters }
   * - openai_input: 部分网关要求顶层 input（消息数组或拼接文本）
   */
  resolveRequestFormat(config) {
    const explicit = (config.requestFormat || 'auto').toLowerCase();
    if (explicit && explicit !== 'auto') return explicit;

    const url = (config.baseUrl || '').toLowerCase();
    if (url.includes('anthropic.com')) return 'anthropic';
    // 通义原生（非 compatible-mode）
    if (url.includes('dashscope') && !url.includes('compatible-mode')) {
      return 'dashscope';
    }
    // OpenAI Responses API
    if (url.includes('/responses')) return 'openai_input';
    // 部分中转站/聚合网关路径
    if (url.includes('/text-generation') || url.includes('/generation')) {
      return 'dashscope';
    }
    return 'openai';
  },

  isAnthropic(config) {
    return this.resolveRequestFormat(config) === 'anthropic'
      || (config.baseUrl || '').includes('anthropic.com');
  },

  generateHeaders(config) {
    if (this.isAnthropic(config)) {
      return {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      };
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    };
  },

  normalizeMessages(messages) {
    return (messages || [])
      .filter(m => m && m.content != null && String(m.content).length >= 0)
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : (m.role === 'system' ? 'system' : 'user'),
        content: String(m.content ?? '')
      }));
  },

  /**
   * @param {object} config
   * @param {Array} messages
   * @param {string} promptType
   * @param {{ stream?: boolean }} options
   */
  buildRequestBody(config, messages, promptType, options = {}) {
    const stream = options.stream !== false;
    const temperature = this.getTemperature(promptType);
    const format = this.resolveRequestFormat(config);
    const normalized = this.normalizeMessages(messages);

    if (format === 'anthropic') {
      const systemMessage = normalized.find(m => m.role === 'system');
      const userMessages = normalized.filter(m => m.role !== 'system');

      return {
        model: config.model,
        max_tokens: config.maxTokens || 4096,
        temperature,
        system: systemMessage ? systemMessage.content : '',
        messages: userMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
        stream
      };
    }

    // 通义原生 / 部分 generation 接口：input.messages + parameters
    if (format === 'dashscope') {
      const parameters = {
        temperature,
        result_format: 'message'
      };
      if (config.maxTokens) parameters.max_tokens = config.maxTokens;
      if (stream) parameters.incremental_output = true;

      return {
        model: config.model,
        input: {
          messages: normalized
        },
        parameters
      };
    }

    // 要求顶层 input 的网关 / Responses 风格
    if (format === 'openai_input') {
      const body = {
        model: config.model,
        input: normalized,
        temperature,
        stream
      };
      if (config.maxTokens) body.max_tokens = config.maxTokens;
      // 同时带 messages，兼容只认其一的实现
      body.messages = normalized;
      return body;
    }

    // 默认 OpenAI Chat Completions
    const body = {
      model: config.model,
      messages: normalized,
      temperature,
      stream
    };
    if (config.maxTokens) {
      body.max_tokens = config.maxTokens;
    }
    return body;
  },

  parseStreamChunk(chunk, config) {
    const format = this.resolveRequestFormat(config);

    try {
      // Anthropic 有时直接推 JSON 行，有时带 data:
      let payload = chunk;
      if (chunk.startsWith('data:')) {
        payload = chunk.replace(/^data:\s*/, '');
      }

      if (format === 'anthropic' || (config.baseUrl || '').includes('anthropic.com')) {
        if (payload === '[DONE]') return null;
        const data = JSON.parse(payload);
        if (data.type === 'content_block_delta' && data.delta?.text) {
          return { text: data.delta.text, kind: 'content' };
        }
        return { text: '', kind: 'ignore' };
      }

      if (payload === '[DONE]') return null;
      // 非 data: 前缀也可能是纯 JSON chunk
      if (!chunk.startsWith('data:') && !chunk.trim().startsWith('{')) {
        return { text: '', kind: 'ignore' };
      }

      const data = JSON.parse(payload);

      // OpenAI / 兼容：优先正文 content
      const delta = data.choices?.[0]?.delta || {};
      if (typeof delta.content === 'string' && delta.content.length > 0) {
        return { text: delta.content, kind: 'content' };
      }
      // 部分网关把最终文本放在 message
      const msgContent = data.choices?.[0]?.message?.content;
      if (typeof msgContent === 'string' && msgContent.length > 0 && !delta.reasoning) {
        return { text: msgContent, kind: 'content' };
      }
      // 推理模型：reasoning / reasoning_content 仅作状态，不当正文
      const reasoning = delta.reasoning || delta.reasoning_content
        || data.choices?.[0]?.delta?.reasoning_content;
      if (typeof reasoning === 'string' && reasoning.length > 0) {
        return { text: reasoning, kind: 'reasoning' };
      }

      // 通义流式
      const dash = data.output?.choices?.[0]?.message?.content
        || data.output?.text
        || data.output?.response;
      if (dash) return { text: typeof dash === 'string' ? dash : '', kind: 'content' };

      // Responses API
      if (data.type === 'response.output_text.delta' && data.delta) {
        return { text: data.delta, kind: 'content' };
      }

      return { text: '', kind: 'ignore' };
    } catch (e) {
      return { text: '', kind: 'ignore' };
    }
  },

  /**
   * 从非流式响应里提取文本，兼容多厂商。
   */
  extractCompletionText(data, config) {
    if (!data) return '';
    const format = this.resolveRequestFormat(config);

    if (format === 'anthropic' || data.content?.[0]?.text) {
      return data.content?.[0]?.text || '';
    }

    // OpenAI chat（含 reasoning 字段时仍取 content）
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    if (data.choices?.[0]?.text) {
      return data.choices[0].text;
    }
    // 极少数把最终答案放在 delta
    if (data.choices?.[0]?.delta?.content) {
      return data.choices[0].delta.content;
    }

    // 通义原生
    if (data.output?.choices?.[0]?.message?.content) {
      return data.output.choices[0].message.content;
    }
    if (data.output?.text) {
      return data.output.text;
    }

    // Responses / input 风格
    if (data.output_text) return data.output_text;
    if (typeof data.output === 'string') return data.output;
    if (data.response) return data.response;

    return '';
  }
};
