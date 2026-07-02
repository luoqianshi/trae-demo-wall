// AI 模型自动发现 - 根据提供商自动获取可用模型列表

export interface AIModel {
  id: string
  name: string
  description?: string
}

// ========== Ollama 模型发现 ==========

export async function discoverOllamaModels(baseUrl: string = 'http://localhost:11434'): Promise<AIModel[]> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) {
      throw new Error(`Ollama 返回 HTTP ${res.status}`)
    }
    const data = await res.json()
    // Ollama /api/tags 返回 { models: [{ name, model, modified_at, size, digest, details }] }
    const models = data.models || []
    return models.map((m: any) => ({
      id: m.name || m.model,
      name: m.name || m.model,
      description: m.details?.family || '本地模型',
    }))
  } catch (e: any) {
    throw new Error(`无法连接 Ollama: ${e.message}`)
  }
}

// ========== DeepSeek 模型列表 ==========

const DEEPSEEK_MODELS: AIModel[] = [
  { id: 'deepseek-chat', name: 'DeepSeek-V3', description: '通用对话模型' },
  { id: 'deepseek-reasoner', name: 'DeepSeek-R1', description: '推理模型（擅长数学、代码）' },
]

export async function discoverDeepSeekModels(baseUrl?: string, apiKey?: string): Promise<AIModel[]> {
  // DeepSeek 支持通过 API 获取模型列表
  const url = baseUrl || 'https://api.deepseek.com'
  if (!apiKey) {
    return DEEPSEEK_MODELS
  }
  try {
    const res = await fetch(`${url}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    if (!res.ok) {
      return DEEPSEEK_MODELS
    }
    const data = await res.json()
    const models = data.data || []
    if (models.length > 0) {
      return models.map((m: any) => ({
        id: m.id,
        name: m.id,
        description: 'DeepSeek 模型',
      }))
    }
    return DEEPSEEK_MODELS
  } catch {
    return DEEPSEEK_MODELS
  }
}

// ========== OpenAI 模型列表 ==========

const OPENAI_MODELS: AIModel[] = [
  { id: 'gpt-4o', name: 'GPT-4o', description: '多模态旗舰模型' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '轻量快速模型' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: '高性能模型' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '经济型模型' },
]

export async function discoverOpenAIModels(baseUrl?: string, apiKey?: string): Promise<AIModel[]> {
  const url = baseUrl || 'https://api.openai.com/v1'
  if (!apiKey) {
    return OPENAI_MODELS
  }
  try {
    const res = await fetch(`${url}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    if (!res.ok) {
      return OPENAI_MODELS
    }
    const data = await res.json()
    const chatModels = (data.data || [])
      .filter((m: any) => m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3'))
      .sort((a: any, b: any) => b.created - a.created)
      .slice(0, 15)
    if (chatModels.length > 0) {
      return chatModels.map((m: any) => ({
        id: m.id,
        name: m.id,
        description: 'OpenAI 模型',
      }))
    }
    return OPENAI_MODELS
  } catch {
    return OPENAI_MODELS
  }
}

// ========== Grok 模型发现 ==========

const GROK_MODELS: AIModel[] = [
  { id: 'grok-3-latest', name: 'Grok-3 Latest', description: 'xAI 最新模型' },
  { id: 'grok-3-fast', name: 'Grok-3 Fast', description: 'xAI 快速模型' },
  { id: 'grok-2-1212', name: 'Grok-2', description: 'xAI 模型' },
]

export async function discoverGrokModels(baseUrl?: string, apiKey?: string): Promise<AIModel[]> {
  const url = baseUrl || 'https://api.x.ai/v1'
  if (!apiKey) {
    return GROK_MODELS
  }
  try {
    const res = await fetch(`${url}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    if (!res.ok) {
      return GROK_MODELS
    }
    const data = await res.json()
    const models = data.data || []
    if (models.length > 0) {
      return models.map((m: any) => ({
        id: m.id,
        name: m.id,
        description: 'xAI 模型',
      }))
    }
    return GROK_MODELS
  } catch {
    return GROK_MODELS
  }
}

// ========== Cherry Studio 模型发现 ==========

export async function discoverCherryModels(baseUrl: string = 'http://localhost:23333/v1'): Promise<AIModel[]> {
  try {
    const res = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) {
      throw new Error(`Cherry Studio 返回 HTTP ${res.status}`)
    }
    const data = await res.json()
    const models = data.data || []
    if (models.length > 0) {
      return models.map((m: any) => ({
        id: m.id,
        name: m.id,
        description: 'Cherry Studio',
      }))
    }
    // 如果无法连接，返回一些常用的模型作为默认值
    return [
      { id: 'openai:gpt-4o-mini', name: 'GPT-4o Mini', description: 'OpenAI 轻量模型' },
      { id: 'openai:gpt-4o', name: 'GPT-4o', description: 'OpenAI 旗舰模型' },
      { id: 'anthropic:claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Anthropic 模型' },
      { id: 'google:gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Google 模型' },
    ]
  } catch (e: any) {
    return [
      { id: 'openai:gpt-4o-mini', name: 'GPT-4o Mini', description: 'OpenAI 轻量模型' },
      { id: 'openai:gpt-4o', name: 'GPT-4o', description: 'OpenAI 旗舰模型' },
      { id: 'anthropic:claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Anthropic 模型' },
      { id: 'google:gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Google 模型' },
    ]
  }
}

// ========== 自定义模型发现（OpenAI兼容API） ==========

export async function discoverCustomModels(baseUrl: string, apiKey?: string): Promise<AIModel[]> {
  if (!baseUrl) {
    return []
  }
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }
    const res = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers,
    })
    if (!res.ok) {
      throw new Error(`API 返回 HTTP ${res.status}`)
    }
    const data = await res.json()
    const models = data.data || []
    return models.map((m: any) => ({
      id: m.id,
      name: m.id,
      description: '自定义模型',
    }))
  } catch (e: any) {
    throw new Error(`无法获取模型列表: ${e.message}`)
  }
}

// ========== 通用模型发现接口 ==========

export async function discoverModels(
  provider: 'ollama' | 'deepseek' | 'openai' | 'custom' | 'grok' | 'cherry',
  options: { baseUrl?: string; apiKey?: string }
): Promise<AIModel[]> {
  switch (provider) {
    case 'ollama':
      return discoverOllamaModels(options.baseUrl)
    case 'deepseek':
      return discoverDeepSeekModels(options.baseUrl, options.apiKey)
    case 'openai':
      return discoverOpenAIModels(options.baseUrl, options.apiKey)
    case 'grok':
      return discoverGrokModels(options.baseUrl, options.apiKey)
    case 'cherry':
      return discoverCherryModels(options.baseUrl)
    case 'custom':
      return discoverCustomModels(options.baseUrl!, options.apiKey)
    default:
      return []
  }
}
