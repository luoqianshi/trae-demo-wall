export interface VisionRuntimeConfig {
  baseUrl: string
  apiKey: string
  model: string
}

export type VisionConfigStatus = 'missing' | 'saved' | 'testing' | 'valid' | 'invalid'

export interface VisionAnalyzeRequest {
  image: string
  capturedAt: number
  config: VisionRuntimeConfig
}

export interface VisionTestRequest {
  config: VisionRuntimeConfig
}

export interface VisionTestResponse {
  ok: boolean
  message: string
  modelFound?: boolean
}

export const visionConfigStorageKey = 'soundpupil.live.vision-config'

export const emptyVisionRuntimeConfig: VisionRuntimeConfig = {
  baseUrl: '',
  apiKey: '',
  model: '',
}

export function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, '')
}

export function sanitizeVisionRuntimeConfig(config: VisionRuntimeConfig): VisionRuntimeConfig {
  return {
    baseUrl: normalizeBaseUrl(config.baseUrl),
    apiKey: config.apiKey.trim(),
    model: config.model.trim(),
  }
}

export function isVisionRuntimeConfigComplete(config: VisionRuntimeConfig) {
  const sanitized = sanitizeVisionRuntimeConfig(config)
  return Boolean(sanitized.baseUrl && sanitized.apiKey && sanitized.model)
}
