/* config.js — 配置管理（全局单例 Config，读写 localStorage） */
const Config = {
  STORAGE_KEY: 'petapp_config',

  defaults: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    chatModel: 'gpt-4o-mini',
    actionModel: 'gpt-4o-mini',
    temperature: 0.85,
    actionTemperature: 0.6,
    mode: 'parallel', // 'parallel' | 'sequential'
    chatSystemPrompt:
      '你是一个住在屏幕右侧的可爱涂鸦小人，性格活泼、爱撒娇、好奇心强。' +
      '请用简短、口语化的中文回复（通常1-3句），偶尔加一点颜文字或emoji。' +
      '把用户当成最好的朋友，回答要有温度、有情绪，不要太机械。',
    actionSystemPrompt:
      '你是一个动作决策助手，负责控制屏幕右侧可爱小人的动作和表情。' +
      '根据用户最新的消息和对话氛围，调用 perform_action 工具让小人做出合适的反应。' +
      '每次回复都必须调用该工具。动作要与对话情绪匹配：开心时挥手/跳舞/跳跃，' +
      '难过时睡觉/伤心，惊讶时惊讶，思考时点头，拒绝时摇头。' +
      'bubble 字段填2-8字的简短语气词或拟声词（如"嘿嘿~""哇！""呜呜..."）。' +
      '不要输出任何多余的文字，只调用工具。'
  },

  data: {},

  load() {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    } catch (e) {
      saved = {};
    }
    this.data = Object.assign({}, this.defaults, saved);
  },

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
  },

  isReady() {
    return !!this.data.apiKey && !!this.data.baseUrl;
  }
};
