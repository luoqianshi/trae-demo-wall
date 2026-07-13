export type ModelProvider = 'openai' | 'anthropic' | 'ollama' | 'deepseek' | 'qwen' | 'siliconflow' | 'custom'

export type ModelType = 'chat' | 'text' | 'embedding' | 'image' | 'audio'

export const modelTypeLabels: Record<ModelType, string> = {
  chat: '对话',
  text: '文本',
  embedding: '嵌入',
  image: '生图',
  audio: '语音',
}

export const modelTypeOptions: { value: ModelType; label: string }[] = [
  { value: 'chat', label: '对话' },
  { value: 'text', label: '文本' },
  { value: 'embedding', label: '嵌入' },
  { value: 'image', label: '生图' },
  { value: 'audio', label: '语音' },
]

export interface ModelConfig {
  id: string
  name: string
  modelType: ModelType
  provider: ModelProvider
  providerName: string
  model: string
  baseUrl: string
  apiKey: string
  temperature: number
  maxTokens: number
  enabled: boolean
  description?: string
}

export interface ModelProviderVO {
  id: string
  code: string
  name: string
  defaultBaseUrl: string
  models: string[]
  docUrl?: string
  icon?: string
  status: number
}

interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

interface PageResponse<T> {
  records: T[]
  total: number
  current: number
  size: number
}

interface ModelConfigVO {
  id: number | string
  name: string
  modelType?: string
  provider: string
  providerName?: string
  modelName: string
  baseUrl?: string
  apiKey?: string
  temperature?: number
  maxTokens?: number
  enabled?: boolean
  description?: string
}

export interface ModelConfigPayload {
  id?: string
  name: string
  modelType: string
  provider: string
  providerName?: string
  modelName: string
  baseUrl?: string
  apiKey?: string
  temperature?: number
  maxTokens?: number
  enabled?: boolean
  description?: string
}

export interface ModelConfigTestPayload {
  providerCode?: string
  baseUrl: string
  apiKey: string
  model: string
}

const STORAGE_KEY = 'flow.modelConfigs'
const PROVIDERS_STORAGE_KEY = 'flow.modelProviders'
const API_PREFIX = '/api/modelConfig'
const PROVIDER_API_PREFIX = '/api/modelProvider'
const SYSTEM_SETTING_API_PREFIX = '/api/systemSetting'

export interface DouyinCookieSetting {
  configured: boolean
  maskedCookie: string
  cookieCount: number
  updateTime?: string
}

// 内存缓存，用于存储最新的模型配置数据
let modelConfigsCache: ModelConfig[] = []

export const providerLabels: Record<ModelProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  ollama: 'Ollama',
  deepseek: 'DeepSeek',
  qwen: '通义千问',
  siliconflow: 'SiliconFlow',
  custom: '自定义',
}

export const defaultModelConfigs: ModelConfig[] = [
  {
    id: '10001',
    name: '默认 OpenAI 小模型',
    modelType: 'llm',
    provider: 'openai',
    providerName: 'OpenAI',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    temperature: 0.1,
    maxTokens: 1000,
    enabled: true,
    description: '适合常规对话和轻量任务',
  },
  {
    id: '10002',
    name: '默认 Claude Sonnet',
    modelType: 'llm',
    provider: 'anthropic',
    providerName: 'Anthropic',
    model: 'claude-3-5-sonnet-latest',
    baseUrl: 'https://api.anthropic.com',
    apiKey: '',
    temperature: 0.1,
    maxTokens: 1024,
    enabled: true,
    description: '适合复杂推理和长文本任务',
  },
  {
    id: '10003',
    name: '本地 Ollama',
    modelType: 'chat',
    provider: 'ollama',
    providerName: 'Ollama',
    model: 'llama3.1',
    baseUrl: 'http://localhost:11434',
    apiKey: '',
    temperature: 0.1,
    maxTokens: 1000,
    enabled: true,
    description: '适合本地模型调试',
  },
]

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const normalizeProvider = (provider: string): ModelProvider => {
  if (provider === 'openai' || provider === 'anthropic' || provider === 'ollama' || provider === 'deepseek' || provider === 'qwen' || provider === 'siliconflow' || provider === 'custom') {
    return provider
  }
  return 'custom'
}

const normalizeModelType = (value: string | undefined): ModelType => {
  if (value === 'chat' || value === 'text' || value === 'embedding' || value === 'image' || value === 'audio') {
    return value
  }
  // 兼容历史数据
  if (value === 'llm') return 'chat'
  return 'chat'
}

const voToConfig = (item: ModelConfigVO): ModelConfig => ({
  id: String(item.id),
  name: item.name,
  modelType: normalizeModelType(item.modelType),
  provider: normalizeProvider(item.provider),
  providerName: item.providerName || providerLabels[normalizeProvider(item.provider)] || item.provider || '自定义',
  model: item.modelName,
  baseUrl: item.baseUrl ?? '',
  apiKey: item.apiKey ?? '',
  temperature: item.temperature ?? 0.1,
  maxTokens: item.maxTokens ?? 1000,
  enabled: item.enabled ?? true,
  description: item.description ?? '',
})

const configToPayload = (config: ModelConfig): ModelConfigPayload => ({
  id: config.id.startsWith('temp-') ? undefined : config.id,
  name: config.name,
  modelType: config.modelType,
  provider: config.provider,
  providerName: config.providerName || providerLabels[config.provider],
  modelName: config.model,
  baseUrl: config.baseUrl,
  apiKey: config.apiKey,
  temperature: config.temperature,
  maxTokens: config.maxTokens,
  enabled: config.enabled,
  description: config.description,
})

const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })
  if (!response.ok) {
    throw new Error(`请求失败：${response.status}`)
  }
  const result = (await response.json()) as ApiResponse<T>
  if (result.code !== 0) {
    throw new Error(result.message || '模型配置接口请求失败')
  }
  return result.data
}

export const getModelConfigs = (): ModelConfig[] => {
  if (!isBrowser()) return defaultModelConfigs

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultModelConfigs
    const parsed = JSON.parse(raw) as ModelConfig[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultModelConfigs
  } catch {
    return defaultModelConfigs
  }
}

export const saveModelConfigs = (configs: ModelConfig[]) => {
  if (!isBrowser()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
  window.dispatchEvent(new CustomEvent('flow:model-configs-changed'))
}

export const listModelConfigs = async () => {
  const page = await request<PageResponse<ModelConfigVO>>(`${API_PREFIX}/list/page`, {
    method: 'POST',
    body: JSON.stringify({ current: 1, pageSize: 200 }),
  })
  const configs = page.records.map(voToConfig)
  modelConfigsCache = configs
  saveModelConfigs(configs)
  return configs
}

export const listEnabledModelConfigs = async () => {
  const records = await request<ModelConfigVO[]>(`${API_PREFIX}/list/enabled`)
  const configs = records.map(voToConfig)
  modelConfigsCache = configs
  if (configs.length > 0) saveModelConfigs(configs)
  return configs
}

export const addModelConfig = async (config: ModelConfig) => {
  const id = await request<number | string>(`${API_PREFIX}/add`, {
    method: 'POST',
    body: JSON.stringify(configToPayload(config)),
  })
  return String(id)
}

export const updateModelConfig = async (config: ModelConfig) => {
  await request<boolean>(`${API_PREFIX}/update`, {
    method: 'POST',
    body: JSON.stringify(configToPayload(config)),
  })
}

export const getDouyinCookieSetting = async () => {
  return request<DouyinCookieSetting>(`${SYSTEM_SETTING_API_PREFIX}/douyin/cookie`)
}

export const updateDouyinCookieSetting = async (cookie: string) => {
  return request<DouyinCookieSetting>(`${SYSTEM_SETTING_API_PREFIX}/douyin/cookie`, {
    method: 'POST',
    body: JSON.stringify({ cookie }),
  })
}

export const deleteModelConfig = async (id: string) => {
  await request<boolean>(`${API_PREFIX}/delete`, {
    method: 'POST',
    body: JSON.stringify({ id }),
  })
}

export const getEnabledModelConfigs = () => {
  if (modelConfigsCache.length > 0) {
    return modelConfigsCache.filter((config) => config.enabled)
  }
  return getModelConfigs().filter((config) => config.enabled)
}

export const getEnabledModelConfigsByType = (modelType: ModelType): ModelConfig[] => {
  return getEnabledModelConfigs().filter((config) => config.modelType === modelType)
}

export const getModelSelectOptions = (modelType?: string) => {
  const enabledConfigs = getEnabledModelConfigs()
  const source = enabledConfigs.length > 0 ? enabledConfigs : getModelConfigs()
  const filtered = modelType ? source.filter((config) => config.modelType === modelType) : source
  return filtered.map((config) => config.id)
}

export const getModelDisplayName = (modelId: string) => {
  const allConfigs = modelConfigsCache.length > 0 ? modelConfigsCache : getModelConfigs()
  const config = allConfigs.find((item) => item.id === modelId)
  if (!config) return modelId
  const providerName = config.providerName || providerLabels[config.provider]
  return `${config.name}（${providerName} / ${config.model || '未填写模型'}）`
}

export const createModelConfig = (modelType: ModelType = 'chat'): ModelConfig => ({
  id: `temp-${Date.now()}`,
  name: '新模型配置',
  modelType,
  provider: 'custom',
  providerName: '自定义',
  model: '',
  baseUrl: '',
  apiKey: '',
  temperature: 0.1,
  maxTokens: 1000,
  enabled: true,
  description: '',
})

// 厂商相关接口
export const getModelProviders = (): ModelProviderVO[] => {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(PROVIDERS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ModelProviderVO[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const saveModelProviders = (providers: ModelProviderVO[]) => {
  if (!isBrowser()) return
  window.localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(providers))
}

export const listModelProviders = async () => {
  const providers = await request<ModelProviderVO[]>(`${PROVIDER_API_PREFIX}/list/enabled`)
  saveModelProviders(providers)
  return providers
}

export const testModelConfig = async (payload: ModelConfigTestPayload) => {
  const result = await request<string>(`${API_PREFIX}/test`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return result
}

export const fetchRemoteModels = async (baseUrl: string, apiKey?: string) => {
  const params = new URLSearchParams({ baseUrl })
  if (apiKey) {
    params.set('apiKey', apiKey)
  }
  const models = await request<string[]>(`${API_PREFIX}/fetch-models?${params.toString()}`)
  return models
}
