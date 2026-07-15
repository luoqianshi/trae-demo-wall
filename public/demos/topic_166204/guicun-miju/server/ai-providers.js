export const DEFAULT_PROVIDER_ID = 'deepseek'

export const AI_PROVIDER_PRESETS = Object.freeze([
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini'
  },
  {
    id: 'dashscope',
    name: '阿里云百炼 / 通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus'
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1',
    model: 'deepseek-ai/DeepSeek-V3'
  },
  {
    id: 'moonshot',
    name: 'Moonshot / Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k'
  },
  {
    id: 'zhipu',
    name: '智谱 BigModel',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash'
  },
  {
    id: 'volcengine',
    name: '火山方舟',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    model: 'doubao-seed-1-6-250615'
  },
  {
    id: 'custom',
    name: '自定义兼容接口',
    baseUrl: '',
    model: ''
  }
])

export function getProviderPreset(providerId = DEFAULT_PROVIDER_ID) {
  return AI_PROVIDER_PRESETS.find((provider) => provider.id === providerId)
    || AI_PROVIDER_PRESETS[0]
}
