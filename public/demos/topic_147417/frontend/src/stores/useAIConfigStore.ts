import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AIProvider, ModelConfig } from "@/config/aiModels"
import { getAIConfig as getEnvAIConfig, providerPresets } from "@/config/aiModels"

interface AIConfigState {
  provider: AIProvider | ""
  model: string
  apiKey: string
  baseUrl: string
  enabled: boolean

  setProvider: (provider: AIProvider | "") => void
  setModel: (model: string) => void
  setApiKey: (apiKey: string) => void
  setBaseUrl: (baseUrl: string) => void
  setEnabled: (enabled: boolean) => void
  resetConfig: () => void
}

export const useAIConfigStore = create<AIConfigState>()(
  persist(
    (set) => ({
      provider: "",
      model: "",
      apiKey: "",
      baseUrl: "",
      enabled: false,

      setProvider: (provider) => set({ provider }),
      setModel: (model) => set({ model }),
      setApiKey: (apiKey) => set({ apiKey }),
      setBaseUrl: (baseUrl) => set({ baseUrl }),
      setEnabled: (enabled) => set({ enabled }),
      resetConfig: () =>
        set({
          provider: "",
          model: "",
          apiKey: "",
          baseUrl: "",
          enabled: false,
        }),
    }),
    {
      name: "smart-home-ai-config",
    }
  )
)

export function getAIConfig(): ModelConfig {
  const { provider, model, apiKey, baseUrl } = useAIConfigStore.getState()

  if (provider && apiKey) {
    const effectiveProvider = provider as AIProvider
    const preset = providerPresets[effectiveProvider]
    return {
      provider: effectiveProvider,
      apiKey,
      model: model || preset.defaultModel,
      baseUrl: baseUrl || preset.defaultBaseUrl,
    }
  }

  return getEnvAIConfig()
}