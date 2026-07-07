export type VisionMode = 'mock' | 'real'

export const appConfig = {
  appName: '声瞳Live',
  tagline: '面向真实户外步行的实时助行助手',
  narrationIntervalMs: 3000,
  speechLanguage: 'zh-CN',
  defaultMode: 'mock' as VisionMode,
  backendApiBaseUrl: import.meta.env.VITE_BACKEND_API_BASE_URL ?? '',
  captureMaxWidth: 960,
  captureJpegQuality: 0.76,
}
