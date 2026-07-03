// ==================== 配置管理 ====================
// 支持的API服务商配置
const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    visionModel: 'gpt-4o-mini',
    chatModel: 'gpt-4o-mini'
  },
  zhipu: {
    name: '智谱AI',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    visionModel: 'glm-4v-flash',
    chatModel: 'glm-4-flash'
  },
  qwen: {
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    visionModel: 'qwen-vl-max-latest',
    chatModel: 'qwen-plus'
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    visionModel: 'deepseek-chat', // DeepSeek暂无视觉模型，需用chat模型替代
    chatModel: 'deepseek-chat'
  },
  custom: {
    name: '自定义',
    baseUrl: '',
    visionModel: '',
    chatModel: ''
  }
};

// 当前配置
let config = {
  provider: 'openai',
  apiKey: '',
  baseUrl: '',
  visionModel: '',
  chatModel: ''
};

// 从localStorage加载配置
function loadConfig() {
  try {
    const saved = localStorage.getItem('timeStorytellerConfig');
    if (saved) {
      config = { ...config, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('加载配置失败', e);
  }
  // 确保默认值
  const provider = PROVIDERS[config.provider] || PROVIDERS.openai;
  if (!config.baseUrl) config.baseUrl = provider.baseUrl;
  if (!config.visionModel) config.visionModel = provider.visionModel;
  if (!config.chatModel) config.chatModel = provider.chatModel;
}

// 保存配置到localStorage
function saveConfigToStorage() {
  try {
    localStorage.setItem('timeStorytellerConfig', JSON.stringify(config));
  } catch (e) {
    console.warn('保存配置失败', e);
  }
}

// 获取当前API配置
function getApiConfig() {
  return {
    baseUrl: config.baseUrl.replace(/\/$/, ''),
    apiKey: config.apiKey,
    visionModel: config.visionModel,
    chatModel: config.chatModel
  };
}

// 检查是否配置了API Key
function hasApiKey() {
  return config.apiKey && config.apiKey.trim().length > 0;
}

// 初始化
loadConfig();
