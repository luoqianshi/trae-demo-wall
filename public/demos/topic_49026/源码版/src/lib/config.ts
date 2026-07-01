// 统一配置管理
// 所有 API Key 和模型参数从这里读取
// 注意：自 2026-06-18 起，默认 API Key 不再硬编码在前端源码中。
// 开发时请通过后端代理（server/index.mjs）的环境变量配置 Key，
// 或在前端设置面板中填写自己的 Key，由前端通过代理转发。

const DEFAULT_BASE_URL = 'https://api.deepseek.com/v1'
const DEFAULT_MODEL = 'deepseek-v4-flash'

// 豆包默认配置（火山方舟 OpenAI 兼容接口）
// 重要：在火山方舟控制台需要显式"开通模型服务"后，模型ID才能被 API 调用
// 已验证：以下模型对账号 2101161090 已开通并可正常调用（2026-06-19 验证）
const DEFAULT_DOUBAO_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3'
// 主对话模型 - doubao-seed-2-0-mini-260428（2026-04-28 发布）
// 豆包 Seed 2.0 Mini 最新版，快速响应，轻量场景
// 注意：doubao-seed-2-0-lite-260428 因"安全体验模式"推理上限已达，暂不可用
// 备选模型（可在设置面板切换）：
//   - doubao-seed-2-0-pro-260215  （Pro版，深度推理最强，但速度较慢）
//   - doubao-seed-2-0-lite-260428 （Lite版，需在火山方舟控制台关闭"安全体验模式"后可用）
const DEFAULT_DOUBAO_MODEL = 'doubao-seed-2-0-mini-260428'

// 豆包 Embedding 默认配置
// 使用多模态向量化 API（/api/v3/embeddings/multimodal）+ doubao-embedding-vision-* 模型
// 原因：纯文本 embedding 模型（doubao-embedding-text-*, doubao-embedding-large-text-*）
// 已进入 Retiring 状态，直接调用返回 404。多模态 vision 模型支持纯文本输入，
// 返回 2048 维向量，与 ZVEC_EMBEDDING_DIMENSION 匹配。
// 官方文档：https://www.volcengine.com/docs/82379/1523520
const DEFAULT_DOUBAO_EMBEDDING_MODEL = 'doubao-embedding-vision-251215'

export function getApiKey(): string {
  return localStorage.getItem('hengzhou-api-key') || ''
}

export function getBaseUrl(): string {
  return localStorage.getItem('hengzhou-base-url') || DEFAULT_BASE_URL
}

export function getModel(): string {
  return localStorage.getItem('hengzhou-model') || DEFAULT_MODEL
}

// 豆包配置
export function getDoubaoApiKey(): string {
  return localStorage.getItem('hengzhou-doubao-api-key') || ''
}

export function getDoubaoBaseUrl(): string {
  return localStorage.getItem('hengzhou-doubao-base-url') || DEFAULT_DOUBAO_BASE_URL
}

export function getDoubaoModel(): string {
  return localStorage.getItem('hengzhou-doubao-model') || DEFAULT_DOUBAO_MODEL
}

export function getDoubaoEmbeddingModel(): string {
  return localStorage.getItem('hengzhou-doubao-embedding-model') || DEFAULT_DOUBAO_EMBEDDING_MODEL
}

// 自 2026-06-18 起，项目默认通过后端代理持有豆包 API Key。
// 当前仓库的 .env 已配置默认豆包 Key，因此豆包能力默认启用；
// 实际调用时若后端 Key 不可用，由 ai.ts 的熔断/降级机制处理。
const IS_BACKEND_DOUBAO_CONFIGURED = true

// P0-1: 后端 .env 已预置 DeepSeek API Key，评委零配置即可体验
const IS_BACKEND_DEEPSEEK_CONFIGURED = true

export function isDoubaoEnabled(): boolean {
  return !!getDoubaoApiKey() || IS_BACKEND_DOUBAO_CONFIGURED
}

// DeepSeek 是否可用（用户配置了 Key 或后端已预置）
export function isDeepseekEnabled(): boolean {
  return isApiKeyValid() || IS_BACKEND_DEEPSEEK_CONFIGURED
}

export function setConfig(key: string, value: string): void {
  localStorage.setItem(key, value)
}

/**
 * 检查用户是否已在 localStorage 中配置自己的 DeepSeek API Key
 */
export function isApiKeyValid(): boolean {
  const key = localStorage.getItem('hengzhou-api-key')
  return !!key && key.trim().length > 0
}

/**
 * 检查用户是否已在 localStorage 中配置自己的豆包 API Key
 */
export function isDoubaoApiKeyValid(): boolean {
  const key = localStorage.getItem('hengzhou-doubao-api-key')
  return !!key && key.trim().length > 0
}

/**
 * 检查是否尚未配置个人 API Key（此时将完全依赖后端代理的环境变量 Key）
 */
export function isUsingDefaultKey(): boolean {
  return !isApiKeyValid() || !isDoubaoApiKeyValid()
}

/**
 * 检查是否至少有一个模型可用（用户已配置 Key，或后端代理已配置默认 Key）
 */
export function isAnyModelAvailable(): boolean {
  return isApiKeyValid() || isDoubaoApiKeyValid() || IS_BACKEND_DOUBAO_CONFIGURED || IS_BACKEND_DEEPSEEK_CONFIGURED
}

export function getProxyToken(): string {
  return localStorage.getItem('hengzhou-proxy-token') || ''
}

export function setProxyToken(value: string): void {
  localStorage.setItem('hengzhou-proxy-token', value.trim())
}

// 默认模型名导出（供设置面板等 UI 组件使用，避免硬编码）
export const DEFAULT_DOUBAO_MODEL_NAME = DEFAULT_DOUBAO_MODEL
export const DEFAULT_DOUBAO_EMBEDDING_MODEL_NAME = DEFAULT_DOUBAO_EMBEDDING_MODEL

// === 回复风格配置 ===
export type ResponseStyle = 'concise' | 'standard' | 'detailed'

export const RESPONSE_STYLE_LABELS: Record<ResponseStyle, string> = {
  concise: '简洁',
  standard: '标准',
  detailed: '详细',
}

export const RESPONSE_STYLE_DESCRIPTIONS: Record<ResponseStyle, string> = {
  concise: '直奔主题，50字以内，不寒暄',
  standard: '适度展开，100-200字，有温度但不啰嗦',
  detailed: '全面分析，300字左右，多维度展开',
}

export function getResponseStyle(): ResponseStyle {
  const style = localStorage.getItem('hengzhou-response-style')
  if (style === 'concise' || style === 'standard' || style === 'detailed') return style
  return 'standard'
}

export function setResponseStyle(style: ResponseStyle): void {
  localStorage.setItem('hengzhou-response-style', style)
}

// 根据回复风格获取 AI 参数
export function getResponseStyleParams(): { temperature: number; maxTokens: number; systemHint: string } {
  const style = getResponseStyle()
  switch (style) {
    case 'concise':
      return {
        temperature: 0.5,
        maxTokens: 300,
        systemHint: '回复要求：极度简洁，直奔主题，50字以内。不寒暄、不铺垫、不重复用户问题。像发微信一样短。',
      }
    case 'detailed':
      return {
        temperature: 0.8,
        maxTokens: 800,
        systemHint: '回复要求：可以详细展开，300字左右，多维度分析。但仍然要有重点，不要泛泛而谈。',
      }
    default:
      return {
        temperature: 0.7,
        maxTokens: 500,
        systemHint: '回复要求：适度展开，100-200字。有温度但不啰嗦，先回答核心问题再补充背景。',
      }
  }
}
