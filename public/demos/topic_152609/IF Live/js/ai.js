// ========================================
// IF LIFE · AI 事件生成
// OpenAI 兼容格式 API 集成，支持降级为本地模拟
// ========================================

const AI = {
  // API 配置（从 localStorage 加载）
  config: {
    apiKey: localStorage.getItem('iflife_api_key') || '',
    baseURL: localStorage.getItem('iflife_api_base') || '',
    model: localStorage.getItem('iflife_api_model') || ''
  },

  // 配置 API
  configure(apiKey, baseURL, model) {
    this.config.apiKey = apiKey;
    this.config.baseURL = baseURL;
    this.config.model = model;
    localStorage.setItem('iflife_api_key', apiKey);
    localStorage.setItem('iflife_api_base', baseURL);
    localStorage.setItem('iflife_api_model', model);
  },

  // 是否已配置
  isConfigured() {
    return !!(this.config.apiKey && this.config.baseURL && this.config.model);
  },

  hasConnectionConfig(apiKey = this.config.apiKey, baseURL = this.config.baseURL) {
    return !!(apiKey && baseURL);
  },

  getBaseURL(baseURL = this.config.baseURL) {
    return (baseURL || '').trim().replace(/\/+$/, '');
  },

  // 获取可用模型列表
  async fetchModels(apiKey = this.config.apiKey, baseURL = this.config.baseURL) {
    if (!this.hasConnectionConfig(apiKey, baseURL)) {
      throw new Error('请先填写 API Base URL 和 API Key');
    }

    const response = await fetch(`${this.getBaseURL(baseURL)}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`模型列表请求失败: ${response.status}`);
    }

    const data = await response.json();
    const models = (data.data || [])
      .map(item => item.id || item.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    if (!models.length) {
      throw new Error('没有获取到模型');
    }

    return models;
  },

  // 生成事件
  async generateEvent(characterState) {
    if (!this.isConfigured()) {
      return this.mockEvent(characterState);
    }

    const prompt = this.buildPrompt(characterState);

    try {
      const response = await fetch(`${this.getBaseURL()}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: '你是人生模拟器的事件生成器。请严格输出JSON格式，不要包含markdown代码块标记。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.9,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      // 清理可能的 markdown 标记
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const event = JSON.parse(cleaned);

      return this.normalizeEvent(event, characterState);
    } catch (error) {
      console.warn('AI 生成失败，降级为本地模拟:', error.message);
      return this.mockEvent(characterState);
    }
  },

  // 自动模式：让 AI 做出选择并给出可展示的思考摘要
  async decideEvent(event, characterState) {
    if (!this.isConfigured()) {
      return this.mockDecision(event, characterState);
    }

    try {
      const response = await fetch(`${this.getBaseURL()}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: '你是 IF LIFE 人生模拟器里的决策 AI。只输出 JSON。不要展示隐藏推理链，只给可展示的简短思考摘要。'
            },
            { role: 'user', content: this.buildDecisionPrompt(event, characterState) }
          ],
          temperature: 0.55,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        throw new Error(`AI 决策请求失败: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleaned);

      return this.normalizeDecision(result, event, characterState, 'api');
    } catch (error) {
      console.warn('AI 决策失败，降级为本地决策:', error.message);
      return this.mockDecision(event, characterState, error.message);
    }
  },

  buildDecisionPrompt(event, state) {
    const attrs = state.attributes;
    const personalityMap = {
      striver: '进取型',
      guardian: '守护型',
      speculator: '投机型',
      free: '自由型'
    };
    const riskMap = {
      conservative: '稳健型',
      balanced: '平衡型',
      aggressive: '激进型'
    };
    const options = event.options.map(opt => `${opt.id}. ${opt.label}：${opt.description}`).join('\n');

    return `请根据角色状态，为这个人生事件做一个选择。

角色状态：
- 性格：${personalityMap[state.params.personality] || '自由型'}
- 风险偏好：${riskMap[state.params.risk] || '平衡型'}
- 财富：${attrs.wealth}
- 幸福：${attrs.happiness}
- 健康：${attrs.health}
- 事业：${attrs.career}

事件：${event.title}
情境：${event.context}

可选项：
${options}

输出严格 JSON：
{
  "choice": "A/B/C/D",
  "thinking": "用 1-2 句中文概括判断依据，像思考摘要，不要写详细推理过程",
  "reply": "用第一人称说出选择，例如：我会选 A，因为……"
}`;
  },

  normalizeDecision(raw, event, state, source) {
    const validOptions = event.options.map(opt => opt.id);
    const fallback = Engine.makeAIDecision(event.id, state.params.personality, state.params.risk);
    const optionId = validOptions.includes(raw.choice) ? raw.choice : fallback;
    const option = event.options.find(opt => opt.id === optionId) || event.options[0];

    return {
      optionId,
      thinking: raw.thinking || this.buildLocalThinking(event, state, option),
      reply: raw.reply || `我会选 ${optionId}：${option?.label || '这个选项'}。`,
      source
    };
  },

  mockDecision(event, state, reason = '') {
    const optionId = Engine.makeAIDecision(event.id, state.params.personality, state.params.risk);
    const option = event.options.find(opt => opt.id === optionId) || event.options[0];
    return {
      optionId,
      thinking: this.buildLocalThinking(event, state, option),
      reply: `我会选 ${optionId}：${option?.label || '这个选项'}。${this.buildLocalReplyTail(state)}`,
      source: reason ? 'fallback' : 'local'
    };
  },

  buildLocalThinking(event, state, option) {
    const personalityFocus = {
      striver: '我会更看重成长空间和长期上限',
      guardian: '我会更看重稳定性、关系成本和可承受的风险',
      speculator: '我会更看重机会窗口和潜在回报',
      free: '我会更看重这个选择是否保留自主性'
    };
    const riskFocus = {
      conservative: '风险偏好偏稳，所以会避开代价过高的路径',
      balanced: '风险偏好居中，所以会在收益和代价之间取平衡',
      aggressive: '风险偏好更高，所以会允许短期波动换取可能性'
    };
    const first = personalityFocus[state.params.personality] || personalityFocus.free;
    const second = riskFocus[state.params.risk] || riskFocus.balanced;
    return `${first}。${second}，因此「${option?.label || event.title}」更贴近这个角色此刻的底色。`;
  },

  buildLocalReplyTail(state) {
    const tails = {
      striver: '这条路不一定轻松，但它更像一次向上争取。',
      guardian: '这不是最刺激的路，但它能让重要的人和事更稳。',
      speculator: '机会不会等人，下注本身也是一种人生姿态。',
      free: '我想保留选择权，而不是太早被一种生活固定。'
    };
    return tails[state.params.personality] || tails.free;
  },

  // 构建提示词
  buildPrompt(state) {
    const attrs = state.attributes;
    const personalityMap = {
      striver: '进取型',
      guardian: '守护型',
      speculator: '投机型',
      free: '自由型'
    };
    const personalityName = personalityMap[state.params.personality] || '自由型';

    return `你是人生模拟器的事件生成器。请为以下角色生成一个符合其人生阶段的关键事件。

角色状态：
- 年龄：${40 + Math.floor(Math.random() * 15)}
- 性格：${personalityName}
- 家庭背景：${state.params.family || '普通'}
- 财富：${attrs.wealth}
- 幸福：${attrs.happiness}
- 健康：${attrs.health}
- 事业：${attrs.career}

输出严格 JSON 格式（不要有markdown标记）：
{
  "title": "事件标题（12字内）",
  "context": "事件情境（200-300字，第二人称描述）",
  "options": [
    {"id": "A", "label": "选项标签", "description": "详细描述"},
    {"id": "B", "label": "选项标签", "description": "详细描述"},
    {"id": "C", "label": "选项标签", "description": "详细描述"},
    {"id": "D", "label": "选项标签", "description": "详细描述"}
  ],
  "insight_a": "选A后的洞察句",
  "insight_b": "选B后的洞察句",
  "insight_c": "选C后的洞察句",
  "insight_d": "选D后的洞察句",
  "impact": {
    "A": {"wealth": 0, "happiness": 0, "health": 0, "career": 0},
    "B": {"wealth": 0, "happiness": 0, "health": 0, "career": 0},
    "C": {"wealth": 0, "happiness": 0, "health": 0, "career": 0},
    "D": {"wealth": 0, "happiness": 0, "health": 0, "career": 0}
  }
}`;
  },

  // 标准化事件格式
  normalizeEvent(raw, state) {
    return {
      id: 'ai_' + Date.now(),
      title: raw.title || '一个意外的转折',
      life_stage: 'mid_life',
      context: raw.context || '生活给你出了一个意料之外的题。',
      options: (raw.options || []).map((o, i) => ({
        id: o.id || String.fromCharCode(65 + i),
        label: o.label || '选项' + String.fromCharCode(65 + i),
        description: o.description || ''
      })),
      insights: {
        A: raw.insight_a || '你做出了选择。',
        B: raw.insight_b || '你做出了选择。',
        C: raw.insight_c || '你做出了选择。',
        D: raw.insight_d || '你做出了选择。'
      },
      impact: raw.impact || {
        A: { wealth: 0, happiness: 0, health: 0, career: 0 },
        B: { wealth: 0, happiness: 0, health: 0, career: 0 },
        C: { wealth: 0, happiness: 0, health: 0, career: 0 },
        D: { wealth: 0, happiness: 0, health: 0, career: 0 }
      }
    };
  },

  // 本地模拟事件（API 不可用时降级）
  mockEvent(state) {
    const mocks = [
      {
        title: '老同学的邀约',
        context: '十年没联系的老同学突然找到你，说他在做一个新项目，缺一个合伙人。他说你有经验、有人脉，正是他需要的人。项目听起来不错，但需要你投入时间和一部分积蓄。你的事业刚稳定下来，生活节奏正好。老同学说机会窗口只有两个月，过了就没了。你想起十年前，你们一起毕业时，他选了创业你选了打工，现在他公司估值两个亿。',
        options: [
          { id: 'A', label: '加入老同学', description: '放下现在的工作，投入新项目，赌一把大的' },
          { id: 'B', label: '婉拒但投资', description: '不加入但投10万占小股，两头下注' },
          { id: 'C', label: '婉拒', description: '现在的稳定来之不易，不能冒进' },
          { id: 'D', label: '先看看再说', description: '要详细商业计划书，评估后再决定' }
        ],
        insights: {
          A: '你选了赌一把。十年前你没敢走的路，今天你走了。',
          B: '你选了两头下注。你比十年前聪明了，但也没那么勇敢了。',
          C: '你选了稳。你告诉自己这不是怯懦，是成熟。',
          D: '你选了理性。但你心里清楚，很多时候"再看看"就是"不了了之"。'
        },
        impact: {
          A: { wealth: -10, happiness: 8, health: -5, career: 15 },
          B: { wealth: -5, happiness: 3, health: 0, career: 5 },
          C: { wealth: 2, happiness: -3, health: 2, career: 0 },
          D: { wealth: 0, happiness: 0, health: 0, career: 3 }
        }
      },
      {
        title: '一封匿名信',
        context: '你收到一封匿名信，信里说你的配偶在三年前有过一段秘密关系。信没有署名，但附了一张模糊的照片和一些细节，时间线对得上。你的配偶正在出差，电话打了三次都没接。你坐在客厅里，看着结婚照，回忆这三年里的每一个细节。信的最后写着："你值得知道真相。" 你不知道这是善意还是恶意，但你的手在发抖。',
        options: [
          { id: 'A', label: '直接质问', description: '等配偶回来当面对质，要一个说法' },
          { id: 'B', label: '暗中调查', description: '不声张，自己先查清楚再决定' },
          { id: 'C', label: '选择信任', description: '把信撕了，相信配偶，不给匿名者得逞的机会' },
          { id: 'D', label: '先找写信人', description: '追查匿名信的来源，搞清楚谁在背后' }
        ],
        insights: {
          A: '你选了直面。不管结果如何，你不允许自己活在猜疑里。',
          B: '你选了暗中调查。你比想象中更冷静，或者更害怕确认。',
          C: '你选了信任。但你撕掉的是信，不是疑虑。',
          D: '你选了追查源头。你在保护婚姻，也在准备退路。'
        },
        impact: {
          A: { wealth: 0, happiness: -15, health: -5, career: -3 },
          B: { wealth: 0, happiness: -8, health: -3, career: -2 },
          C: { wealth: 0, happiness: -5, health: -2, career: 0 },
          D: { wealth: -3, happiness: -10, health: -3, career: -5 }
        }
      },
      {
        title: '意外的遗产',
        context: '一个远房亲戚去世了，律师通知你继承了一笔30万的遗产。你甚至不太记得这个人，只在小时候见过几面。律师说这位亲戚没有直系子女，在遗嘱里指名留给你。你的第一反应是意外，第二反应是：这笔钱可以解决你眼下很多问题。但你的配偶说，来路不明的钱最好别动，先搞清楚为什么留给你。你妈说这是祖宗保佑，别想太多。',
        options: [
          { id: 'A', label: '立刻使用', description: '30万解燃眉之急，先用了再说' },
          { id: 'B', label: '存起来不动', description: '先存定期，搞清楚来龙去脉再说' },
          { id: 'C', label: '捐出一部分', description: '留20万，捐10万做善事，心安理得' },
          { id: 'D', label: '追查原因', description: '搞清楚为什么留给你，可能有隐情' }
        ],
        insights: {
          A: '你选了解燃眉之急。务实，但也许少了点敬畏。',
          B: '你选了稳妥。你相信天上不会掉馅饼，至少不会白掉。',
          C: '你选了分一份出去。你比多数人懂得：意外之财要散一点才安稳。',
          D: '你选了追查。你不是贪心，是谨慎——你知道没人会无缘无故给你东西。'
        },
        impact: {
          A: { wealth: 20, happiness: 5, health: 0, career: 3 },
          B: { wealth: 15, happiness: 8, health: 2, career: 0 },
          C: { wealth: 8, happiness: 15, health: 5, career: 0 },
          D: { wealth: 5, happiness: 3, health: 0, career: 5 }
        }
      }
    ];

    const randomMock = mocks[Math.floor(Math.random() * mocks.length)];
    return this.normalizeEvent(randomMock, state);
  }
};
