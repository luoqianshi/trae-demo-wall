/**
 * WordSoul - AI 裁判模块
 * 支持调用外部大模型 API，同时提供本地规则裁判作为降级方案
 */

var AIJudge = {
  // 本地裁判关键词库
  LOCAL_KEYWORDS: {
    positive: ['重要', '核心', '本质', '根本', '关键', '必须', '需要', '值得', '珍惜', '重视', '热爱', '喜欢', '想要', '追求'],
    negative: ['不重要', '无所谓', '放弃', '淘汰', '次要', '可有可无', '不需要', '讨厌', '厌恶', '排斥'],
    values: {
      '自由': ['独立', '自主', '不受约束', '选择', '掌控', '决定'],
      '稳定': ['安全', '保障', '踏实', '可靠', '持久', '长期'],
      '成长': ['进步', '学习', '提升', '突破', '挑战', '发展'],
      '关系': ['家人', '朋友', '爱', '陪伴', '连接', '归属'],
      '成就': ['成功', '目标', '荣誉', '认可', '成果', '价值'],
      '健康': ['身体', '心理', '平衡', '休息', '运动', '养生']
    }
  },

  /**
   * 获取 AI 配置
   */
  getConfig() {
    return Storage.getAIConfig();
  },

  /**
   * 检查 AI 是否可用
   */
  isAIEnabled() {
    var config = this.getConfig();
    return config.enabled && config.apiUrl && config.apiKey;
  },

  /**
   * 获取 AI 未配置的具体原因
   */
  getDisabledReason() {
    var config = this.getConfig();
    if (!config.enabled) return '请先开启"启用 AI 裁判"开关';
    if (!config.apiUrl) return '请填写 API 地址';
    if (!config.apiKey) return '请填写 API Key';
    return '';
  },

  /**
   * 调用 AI 裁判
   * @param {string} wordA - 词语 A
   * @param {string} wordB - 词语 B
   * @param {string} reason - 用户给出的理由
   * @param {string} chosen - 用户选择的词语
   */
  async judge(wordA, wordB, reason, chosen) {
    // 如果 AI 配置可用，优先调用 AI
    if (this.isAIEnabled()) {
      try {
        const result = await this.callAI(wordA, wordB, reason, chosen);
        return { ...result, source: 'ai' };
      } catch (e) {
        console.warn('AI judge failed, falling back to local:', e);
      }
    }
    // 降级到本地裁判
    return this.localJudge(wordA, wordB, reason, chosen);
  },

  /**
   * 调用外部 AI API
   */
  async callAI(wordA, wordB, reason, chosen) {
    const config = this.getConfig();

    const prompt = this.buildPrompt(wordA, wordB, reason, chosen);

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: '你是一位基于 Schwartz 价值观理论的心理学裁判。你的任务是分析用户在词语对战中的选择理由，判断其价值观一致性，并给出引导性反馈。请用 JSON 格式输出。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // 尝试解析 JSON
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Failed to parse AI response as JSON:', e);
    }

    // 如果解析失败，返回原始内容
    return {
      winner: chosen,
      analysis: content,
      feedback: 'AI 分析完成',
      values: []
    };
  },

  /**
   * 构建 Prompt
   */
  buildPrompt(wordA, wordB, reason, chosen) {
    return `请分析以下词语对战中的选择理由：

对战词语："${wordA}" vs "${wordB}"
用户选择："${chosen}"
用户理由："${reason}"

请从以下维度进行分析，并以 JSON 格式输出：
{
  "winner": "胜出的词语",
  "analysis": "对选择理由的价值观分析（100字以内）",
  "feedback": "给用户的引导性反馈（100字以内）",
  "values": ["涉及的核心价值观，如：自由、稳定、成长等"],
  "consistency": "一致性评分 1-10",
  "depth": "思考深度评分 1-10"
}

分析要求：
1. 基于 Schwartz 价值观理论分析用户的选择
2. 指出理由中的价值观倾向
3. 如果理由存在逻辑矛盾，温和地指出
4. 反馈要有引导性，帮助用户更深入思考`;
  },

  /**
   * 本地规则裁判（降级方案）
   */
  localJudge(wordA, wordB, reason, chosen) {
    const keywords = this.LOCAL_KEYWORDS;
    let scoreA = 0;
    let scoreB = 0;
    let matchedValues = [];

    // 分析理由中的关键词
    const reasonLower = reason.toLowerCase();

    // 正向关键词加分
    keywords.positive.forEach(kw => {
      if (reasonLower.includes(kw)) {
        scoreA += 1;
        scoreB += 1;
      }
    });

    // 负向关键词减分
    keywords.negative.forEach(kw => {
      if (reasonLower.includes(kw)) {
        scoreA -= 1;
        scoreB -= 1;
      }
    });

    // 价值观匹配
    Object.keys(keywords.values).forEach(value => {
      const valueWords = keywords.values[value];
      valueWords.forEach(vw => {
        if (reasonLower.includes(vw)) {
          matchedValues.push(value);
          if (chosen === wordA) scoreA += 2;
          if (chosen === wordB) scoreB += 2;
        }
      });
    });

    // 理由长度加分（鼓励详细阐述）
    const lengthBonus = Math.min(reason.length / 20, 3);
    if (chosen === wordA) scoreA += lengthBonus;
    if (chosen === wordB) scoreB += lengthBonus;

    // 确定胜者
    const winner = scoreA > scoreB ? wordA : wordB;
    const isConsistent = winner === chosen;

    // 生成分析
    let analysis = '';
    if (matchedValues.length > 0) {
      analysis = `你的理由体现了对"${matchedValues.join('、')}"价值观的重视。`;
    } else {
      analysis = '你的理由展现了独特的思考角度。';
    }

    if (isConsistent) {
      analysis += '选择与理由高度一致。';
    } else {
      analysis += '但理由似乎更支持另一个词语，值得再思考。';
    }

    // 生成反馈
    let feedback = '';
    if (reason.length < 10) {
      feedback = '试着更深入地阐述你的理由，这有助于发现内心真正的价值观。';
    } else if (matchedValues.length === 0) {
      feedback = '你的理由很有个性。试着思考一下，这个选择反映了你内心真正重视什么？';
    } else {
      feedback = `你对"${matchedValues[0]}"的重视很清晰。继续探索其他价值观之间的关系吧。`;
    }

    return {
      winner,
      analysis,
      feedback,
      values: [...new Set(matchedValues)],
      consistency: isConsistent ? 8 : 4,
      depth: Math.min(Math.floor(reason.length / 15) + 3, 9),
      source: 'local'
    };
  },

  /**
   * 测试 AI 连接
   */
  async testConnection() {
    if (!this.isAIEnabled()) {
      return { ok: false, error: 'AI 未配置 — ' + this.getDisabledReason() };
    }

    try {
      const config = this.getConfig();
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5
        })
      });

      if (response.ok) {
        return { ok: true, error: null };
      } else {
        const error = await response.text();
        return { ok: false, error: `API 错误 (${response.status}): ${error}` };
      }
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }
};
