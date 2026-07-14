export type AIProvider = "aliyun" | "deepseek" | "openai" | "custom"

export interface ModelConfig {
  provider: AIProvider
  apiKey: string
  model: string
  baseUrl: string
}

export interface ProviderPreset {
  defaultModel: string
  defaultBaseUrl: string
  models: string[]
}

export const providerPresets: Record<AIProvider, ProviderPreset> = {
  aliyun: {
    defaultModel: "qwen-plus",
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    models: ["qwen-plus", "qwen-turbo", "qwen-max", "qwen-max-longcontext"],
  },
  deepseek: {
    defaultModel: "deepseek-chat",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    models: ["deepseek-chat", "deepseek-r1-chat", "deepseek-r1.5-chat"],
  },
  openai: {
    defaultModel: "gpt-5.4",
    defaultBaseUrl: "https://api.openai.com/v1",
    models: ["gpt-5.4", "gpt-4o-mini", "gpt-4o", "gpt-4"],
  },
  custom: {
    defaultModel: "",
    defaultBaseUrl: "",
    models: [],
  },
}

export function getAIConfig(): ModelConfig {
  const rawProvider = import.meta.env.VITE_AI_PROVIDER
  const provider: AIProvider =
    rawProvider === "aliyun" || rawProvider === "deepseek" || rawProvider === "openai" || rawProvider === "custom"
      ? rawProvider
      : "aliyun"
  const apiKey = import.meta.env.VITE_AI_API_KEY || ""
  const model = import.meta.env.VITE_AI_MODEL || providerPresets[provider].defaultModel
  const baseUrl = import.meta.env.VITE_AI_BASE_URL || providerPresets[provider].defaultBaseUrl

  return {
    provider,
    apiKey,
    model,
    baseUrl,
  }
}