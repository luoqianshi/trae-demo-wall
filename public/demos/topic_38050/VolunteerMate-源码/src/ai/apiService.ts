// AI 多提供商服务层
// 支持：DeepSeek / SiliconFlow (硅基流动) / DashScope (阿里) / Zhipu (智谱)

export type APIProvider = 'deepseek' | 'siliconflow' | 'dashscope' | 'zhipu';

export interface APIProviderConfig {
  id: APIProvider;
  name: string;
  icon: string;
  description: string;
  url: string;
  modelField: string;
  defaultModel: string;
  models: string[];
  apiKeyUrl: string;
  freeAvailable: string;
  priceHint: string;
}

export const PROVIDERS: APIProviderConfig[] = [
  {
    id: 'siliconflow',
    name: '硅基流动 SiliconFlow',
    icon: '🌊',
    description: '国内最友好的 AI 平台，超多模型免费调用',
    url: 'https://api.siliconflow.cn/v1/chat/completions',
    modelField: 'model',
    defaultModel: 'nex-agi/Nex-N2-Pro',
    models: [
      'nex-agi/Nex-N2-Pro',
      'Qwen/Qwen2.5-7B-Instruct',
      'Qwen/Qwen2.5-32B-Instruct',
      'deepseek-ai/DeepSeek-V4-Flash',
      'deepseek-ai/DeepSeek-V4-Pro',
      'THUDM/glm-4-9b-chat',
      'Pro/zai-org/GLM-4.7',
    ],
    apiKeyUrl: 'https://cloud.siliconflow.cn/account/ak',
    freeAvailable: '新用户赠送大量额度，nex-agi/Nex-N2-Pro 等模型完全免费',
    priceHint: '限免模型 ¥0，其他模型约 ¥1-5 元 / 百万 tokens',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🦄',
    description: 'DeepSeek-V3 / R1 大模型，推理能力强',
    url: 'https://api.deepseek.com/chat/completions',
    modelField: 'model',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    freeAvailable: '新用户赠送 ¥7 额度（约 700w tokens）',
    priceHint: '约 ¥1-3 元 / 百万 tokens',
  },
  {
    id: 'dashscope',
    name: '阿里百炼 DashScope',
    icon: '🪶',
    description: '通义千问官方 API，中文理解强',
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    modelField: 'model',
    defaultModel: 'qwen-plus',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'deepseek-v3'],
    apiKeyUrl: 'https://dashscope.console.aliyun.com/apiKey',
    freeAvailable: '新用户赠送大量额度，长期有免费试用活动',
    priceHint: 'Qwen-Turbo 约 ¥2 元 / 百万 tokens',
  },
  {
    id: 'zhipu',
    name: '智谱 AI',
    icon: '💎',
    description: 'GLM 系列模型，中文任务表现优秀',
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    modelField: 'model',
    defaultModel: 'glm-4-flash',
    models: ['glm-4-flash', 'glm-4-plus', 'glm-4-air', 'glm-4'],
    apiKeyUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    freeAvailable: '新用户赠送 ¥18 额度，glm-4-flash 长期免费',
    priceHint: 'glm-4-flash 免费！其他约 ¥3 元 / 百万 tokens',
  },
];

// 系统提示词 - 让 AI 成为专业的公益助手
const SYSTEM_PROMPT = `你是「公益随手做 VolunteerMate」的 AI 小助手，一位专业、温暖、有爱心的公益顾问。

你的职责：
1. 回答用户关于公益的各种问题（如何做公益、环保知识、捐赠渠道、志愿服务等）
2. 根据用户的心情和需求，推荐合适的公益行动
3. 鼓励用户坚持做公益，传递正能量
4. 用温暖、有感染力的语言传递公益理念

你的特点：
- 温暖、专业、有耐心
- 回答接地气，不说教
- 善于发现用户做公益的闪光点并给予鼓励
- 可以结合时事和热点聊公益

回复要求：
- 用中文回复
- 语言温暖有感染力，像朋友聊天一样
- 如果不确定，给出建议而非错误信息
- 可以适当用 emoji 增加亲切感
- 控制在 200-400 字左右
- 如果用户没有明确问题，主动引导："想聊聊今天的公益心情吗？或者告诉我你现在的心情，我来帮你选一个合适的任务～"`;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 预配置的 API Key（硅基流动 nex-agi/Nex-N2-Pro 限免模型，已验证可用）
const PRESET_API_KEY = 'YOUR_API_KEY_HERE';

// 获取当前配置
export const getCurrentConfig = (): { provider: APIProviderConfig; apiKey: string; model: string } => {
  const providerId = (localStorage.getItem('ai_provider') as APIProvider) || 'siliconflow';
  const apiKey = localStorage.getItem(`api_key_${providerId}`) ||
    (providerId === 'siliconflow' ? PRESET_API_KEY : '');
  const provider = PROVIDERS.find((p) => p.id === providerId) || PROVIDERS[0];
  const model = localStorage.getItem(`ai_model_${providerId}`) || provider.defaultModel;
  return { provider, apiKey, model };
};

// 是否有已配置的 API Key
export const hasConfiguredAPI = (): boolean => {
  const config = getCurrentConfig();
  return !!config.apiKey && config.apiKey.trim() !== '';
};

// 保存配置
export const saveConfig = (provider: APIProvider, apiKey: string, model: string) => {
  localStorage.setItem('ai_provider', provider);
  localStorage.setItem(`api_key_${provider}`, apiKey.trim());
  localStorage.setItem(`ai_model_${provider}`, model);
};

// 发送消息到 API
export const sendToAI = async (
  messages: ChatMessage[],
  provider: APIProviderConfig = getCurrentConfig().provider,
  apiKey: string = getCurrentConfig().apiKey,
  model: string = getCurrentConfig().model
): Promise<AIResponse> => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('NO_API_KEY');
  }

  const response = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      [provider.modelField]: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 800,
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || `API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || '抱歉，我现在无法回答这个问题，请稍后再试。',
    usage: data.usage,
  };
};
