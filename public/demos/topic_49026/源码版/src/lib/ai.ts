import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { streamText, generateText } from 'ai'
import {
  getApiKey, getModel,
  getDoubaoApiKey, getDoubaoModel, getDoubaoEmbeddingModel, isDoubaoEnabled, getProxyToken,
  isApiKeyValid, isAnyModelAvailable
} from './config'
import { apiKeyPool, initApiKeyPool } from './apiKeyPool'
// 解析代理基地址：开发时通过 Vite proxy 转发到本地后端，生产环境可注入 VITE_API_BASE_URL。
// @ai-sdk/openai-compatible 在浏览器中需要绝对 URL，因此默认将相对 /api 解析为当前 origin。
function resolveProxyBaseUrl(): string {
  const envUrl = (import.meta.env?.VITE_API_BASE_URL as string | undefined)
  if (envUrl) return envUrl
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/api`
  }
  return '/api'
}

const PROXY_BASE_URL = resolveProxyBaseUrl()

// 初始化 API Key 池（从 localStorage 加载所有已配置的 Key）
initApiKeyPool()

// === 模型提供者 ===
// 所有请求都先经过 /api 后端代理，由后端持有真实 Key 并转发到对应服务商。
// 如果用户在前端设置了自己的 Key，则通过 x-user-api-key 透传给后端，
// 后端会优先使用用户 Key，否则回退到环境变量中的 Key。
function getDeepseekProvider() {
  const apiKey = getApiKey()
  return createOpenAICompatible({
    name: 'deepseek',
    baseURL: PROXY_BASE_URL,
    apiKey,
    headers: {
      'x-provider': 'deepseek',
      ...(apiKey ? { 'x-user-api-key': apiKey } : {}),
      ...(getProxyToken() ? { 'x-api-token': getProxyToken() } : {}),
    },
  })
}

function getDoubaoProvider() {
  const apiKey = getDoubaoApiKey()
  return createOpenAICompatible({
    name: 'doubao',
    baseURL: PROXY_BASE_URL,
    apiKey,
    headers: {
      'x-provider': 'doubao',
      ...(apiKey ? { 'x-user-api-key': apiKey } : {}),
      ...(getProxyToken() ? { 'x-api-token': getProxyToken() } : {}),
    },
  })
}

// === 熔断器状态（每个模型独立） ===
interface CircuitBreakerState {
  failures: number
  lastFailureTime: number
  isOpen: boolean
}

const deepseekCB: CircuitBreakerState = { failures: 0, lastFailureTime: 0, isOpen: false }
const doubaoCB: CircuitBreakerState = { failures: 0, lastFailureTime: 0, isOpen: false }

const CIRCUIT_THRESHOLD = 5
const CIRCUIT_TIMEOUT = 60000
const MAX_RETRIES = 3
const RETRY_DELAYS = [500, 1500, 4000]

// 首次用户体验关键参数：快速探测，失败立即降级，避免用户长时间等待
// 注意：豆包等带推理功能的模型首次响应可能需要 5-8 秒，10 秒太短会导致误降级
const QUICK_PROBE_TIMEOUT_MS = 15000

function isCircuitOpen(cb: CircuitBreakerState): boolean {
  if (!cb.isOpen) return false
  if (Date.now() - cb.lastFailureTime > CIRCUIT_TIMEOUT) {
    cb.isOpen = false
    cb.failures = 0
    return false
  }
  return true
}

function recordSuccess(cb: CircuitBreakerState) {
  cb.failures = 0
  cb.isOpen = false
}

function recordFailure(cb: CircuitBreakerState) {
  cb.failures++
  cb.lastFailureTime = Date.now()
  if (cb.failures >= CIRCUIT_THRESHOLD) {
    cb.isOpen = true
  }
}

// 检测是否为不可重试的错误（429 限流、401 认证失败、501/404 后端不存在等）
function isNonRetryableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /429|TooManyRequests|SetLimitExceeded|rate.?limit|Unauthorized|401|404|501|Not Implemented|Failed to fetch|NetworkError|ERR_CONNECTION|fetch failed/i.test(msg)
}

// === 后端可用性检测 ===
// HTML 体验版无后端代理时，标记全局不可用，后续所有 API 调用直接跳过
let _backendUnavailable = false

export function isBackendUnavailable(): boolean {
  return _backendUnavailable
}

export function markBackendUnavailable(): void {
  if (!_backendUnavailable) {
    _backendUnavailable = true
    console.warn('[AI] 后端代理不可用，切换到离线 Demo 模式')
  }
}

// 启动时探测后端是否可用（供 main.tsx 调用）
export async function probeBackendAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${window.location.origin}/api/vector/count`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    })
    const available = res.ok
    if (!available) markBackendUnavailable()
    return available
  } catch {
    markBackendUnavailable()
    return false
  }
}

// 带重试的通用包装器
async function withRetry<T>(
  fn: () => Promise<T>,
  operationName: string,
  cb: CircuitBreakerState
): Promise<T> {
  if (isCircuitOpen(cb)) {
    throw new Error('服务暂时不可用')
  }

  let lastError: Error | undefined
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await fn()
      recordSuccess(cb)
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      // 429/401 等错误不可重试，直接跳出
      if (isNonRetryableError(error)) {
        console.warn(`[withRetry] ${operationName} 不可重试错误，跳过重试:`, lastError.message)
        break
      }
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }
  recordFailure(cb)
  throw lastError || new Error(`${operationName} 调用失败`)
}

async function withTimeout<T>(promise: Promise<T>, ms: number, operationName: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${operationName} 超时 (${ms}ms)`)), ms)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

// 快速探测模型是否可用：单次、短超时、不重试，用于首次用户体验的即时降级
// FIX: 缓存探测结果，避免未配置 Key 时反复发起 401 请求污染控制台
let _probeCache: { deepseek: boolean | null; doubao: boolean | null; embed: boolean | null; ts: number } = {
  deepseek: null, doubao: null, embed: null, ts: 0
}
const PROBE_CACHE_TTL = 60000 // 1 分钟内不重复探测

function isProbeCacheValid(): boolean {
  return Date.now() - _probeCache.ts < PROBE_CACHE_TTL
}

async function quickProbeModel(
  provider: ReturnType<typeof createOpenAICompatible>,
  model: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  providerName: 'deepseek' | 'doubao' = 'deepseek' // FIX: 显式传入 provider 名称
): Promise<boolean> {
  // FIX: 使用缓存避免短时间内的重复探测
  const cacheKey = providerName
  if (isProbeCacheValid() && _probeCache[cacheKey] !== null) {
    return _probeCache[cacheKey] as boolean
  }

  try {
    await withTimeout(
      generateText({
        model: provider(model),
        messages: messages.slice(-1),
        maxOutputTokens: 1,
        temperature: 0.3,
        maxRetries: 0,
      }),
      QUICK_PROBE_TIMEOUT_MS,
      'quick-probe'
    )
    _probeCache[cacheKey] = true
    _probeCache.ts = Date.now()
    return true
  } catch (e) {
    _probeCache[cacheKey] = false
    _probeCache.ts = Date.now()
    return false
  }
}

// 快速探测 embedding 服务是否可用：单次、短超时、不重试
// 注意：豆包 vision 模型需要走 multimodal 端点，不能用 AI SDK 的标准 embed()
export async function quickEmbedProbe(): Promise<boolean> {
  // FIX: 后端不可用时直接返回 false，跳过所有嵌入探测
  if (_backendUnavailable) return false
  // FIX: 使用缓存避免短时间内的重复探测
  if (isProbeCacheValid() && _probeCache.embed !== null) {
    return _probeCache.embed as boolean
  }

  try {
    if (isDoubaoEnabled()) {
      // 豆包 vision 模型使用 multimodal 端点，直接用 getEmbedding 探测
      const result = await withTimeout(
        getEmbedding('probe'),
        QUICK_PROBE_TIMEOUT_MS,
        'quick-embed-probe'
      )
      const available = Array.isArray(result) && result.length > 0
      _probeCache.embed = available
      _probeCache.ts = Date.now()
      return available
    }
    // DeepSeek 走标准 embed
    const { embed } = await import('ai')
    const provider = getDeepseekProvider()
    const model = getModel()
    await withTimeout(
      embed({
        model: provider.embeddingModel(model),
        value: 'probe',
      }),
      QUICK_PROBE_TIMEOUT_MS,
      'quick-embed-probe'
    )
    _probeCache.embed = true
    _probeCache.ts = Date.now()
    return true
  } catch (e) {
    // FIX: 降低日志级别，避免未配置 Key 时控制台刷屏
    _probeCache.embed = false
    _probeCache.ts = Date.now()
    console.warn('[AI] embedding 快速探测不可用:', e instanceof Error ? e.message : String(e))
    return false
  }
}

// === Demo 模式错误识别 ===
export function isDemoModeError(error: unknown): boolean {
  if (error == null) return false
  const message = String(error)
  return (
    message.includes('API Key not configured') ||
    message.includes('API Key for') ||
    message.includes('所有模型均不可用') ||
    message.includes('服务暂时不可用') ||
    message.includes('501') ||
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('ERR_CONNECTION') ||
    message.includes('fetch failed')
  )
}

// FIX: 重置探测缓存（用户在设置页面保存新 Key 后调用，使下次请求重新探测）
export function resetProbeCache(): void {
  _probeCache = { deepseek: null, doubao: null, embed: null, ts: 0 }
}

// OPT-3: 预热 LLM 连接 — 启动时发一个极小请求建立 TCP/TLS 连接池
// 后续真实对话可省去握手时间（实测节省 200-500ms TTFT）
let _warmupDone = false
export async function warmupLLMConnection(): Promise<void> {
  if (_warmupDone) return
  _warmupDone = true

  // FIX: 后端不可用时跳过预热
  if (_backendUnavailable) return

  // FIX: 延迟 500ms 再预热，避免 Vite proxy 尚未就绪时请求被 ABORT
  await new Promise(r => setTimeout(r, 500))

  const warmupTasks: Promise<void>[] = []

  // 预热 DeepSeek 通道
  if (isApiKeyValid() || isAnyModelAvailable()) {
    warmupTasks.push(
      fetch(`${PROXY_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider': 'deepseek',
          ...(getApiKey() ? { 'x-user-api-key': getApiKey() } : {}),
          ...(getProxyToken() ? { 'x-api-token': getProxyToken() } : {}),
        },
        body: JSON.stringify({
          model: getModel(),
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1,
          stream: false,
        }),
        // FIX: 移除 keepalive，HMR 重载时会导致 net::ERR_ABORTED 噪音
      }).then(() => {
        console.log('[warmup] DeepSeek 连接已预热')
      }).catch(() => {
        // 预热失败静默处理，不影响正常使用
      })
    )
  }

  // 预热豆包通道
  if (isDoubaoEnabled()) {
    warmupTasks.push(
      fetch(`${PROXY_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider': 'doubao',
          ...(getDoubaoApiKey() ? { 'x-user-api-key': getDoubaoApiKey() } : {}),
          ...(getProxyToken() ? { 'x-api-token': getProxyToken() } : {}),
        },
        body: JSON.stringify({
          model: getDoubaoModel(),
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1,
          stream: false,
        }),
      }).then(() => {
        console.log('[warmup] 豆包连接已预热')
      }).catch(() => {
        // 预热失败静默处理
      })
    )
  }

  // 并行预热，不阻塞应用启动
  await Promise.race([
    Promise.allSettled(warmupTasks),
    // 最多等 3 秒，超时就放行
    new Promise<void>(resolve => setTimeout(resolve, 3000)),
  ])
}

// === 流式对话（主模型 + 豆包降级） ===
// SPEED-1: 当后端已预置 Key 或用户已配置 Key 时，跳过冗余探测直接流式请求
// 探测逻辑仅用于"无 API Key + 无后端 Key"的纯 Demo 模式
export async function streamChat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
): Promise<{ stream: AsyncIterable<string>; model: string }> {
  // FIX: 后端不可用时直接抛出 demo 模式错误，避免创建注定失败的流
  if (_backendUnavailable) {
    throw new Error('所有模型均不可用')
  }
  const { temperature = 0.7, maxTokens: maxOutputTokens = 1024 } = options || {}  // OPT-1: 2048→1024 减少生成阶段耗时
  const systemMessage = messages.find(m => m.role === 'system')?.content
  const chatMessages = messages.filter(m => m.role !== 'system')
  const probeMessages = messages.filter(m => m.role !== 'system')

  // SPEED-1: 跳过冗余探测 — 后端已配置 Key 时直接流式请求
  const skipProbe = isApiKeyValid() || isAnyModelAvailable()
  if (skipProbe) {
    try {
      console.log('[streamChat] 跳过探测，直接流式输出（SPEED-1）')
      const result = streamText({
        model: getDeepseekProvider()(getModel()),
        system: systemMessage,
        messages: chatMessages,
        temperature,
        maxOutputTokens,
        maxRetries: 0,
      })
      return { stream: result.textStream, model: getModel() }
    } catch (e) {
      console.warn('[streamChat] 直接流式请求失败，降级到探测模式:', e instanceof Error ? e.message : String(e))
      // 降级到探测模式
    }
  }

  // 尝试 DeepSeek（探测模式）
  const deepseekAvailable = await quickProbeModel(getDeepseekProvider(), getModel(), probeMessages, 'deepseek')
  if (deepseekAvailable) {
    console.log('[streamChat] DeepSeek 可用，开始流式输出')
    const result = streamText({
      model: getDeepseekProvider()(getModel()),
      system: systemMessage,
      messages: chatMessages,
      temperature,
      maxOutputTokens,
      maxRetries: 0,
    })
    return { stream: result.textStream, model: getModel() }
  }
  console.warn('[streamChat] DeepSeek 快速探测不可用')

  // 豆包降级：探测成功后流式输出；探测失败则直接尝试流式请求作为最后兜底
  if (isDoubaoEnabled()) {
    const doubaoAvailable = await quickProbeModel(getDoubaoProvider(), getDoubaoModel(), probeMessages, 'doubao')
    if (doubaoAvailable) {
      console.log('[streamChat] 已降级到豆包')
      const result = streamText({
        model: getDoubaoProvider()(getDoubaoModel()),
        system: systemMessage,
        messages: chatMessages,
        temperature,
        maxOutputTokens,
        maxRetries: 0,
      })
      return { stream: result.textStream, model: getDoubaoModel() }
    }
    // 探测超时但仍尝试直接流式请求（探测可能因超时误判，实际服务可用）
    console.warn('[streamChat] 豆包探测不可用，尝试直接流式请求')
    try {
      const result = streamText({
        model: getDoubaoProvider()(getDoubaoModel()),
        system: systemMessage,
        messages: chatMessages,
        temperature,
        maxOutputTokens,
        maxRetries: 0,
      })
      return { stream: result.textStream, model: getDoubaoModel() }
    } catch (e) {
      console.warn('[streamChat] 豆包直接流式请求也失败:', e)
    }
  }

  // 最终兜底：检查 API Key 池是否有其他可用 Key
  const poolStatus = apiKeyPool.getStatus()
  if (poolStatus.available > 0) {
    console.warn(`[streamChat] 主通道不可用，API Key 池还有 ${poolStatus.available} 个可用 Key`)
    // Key 池中的 Key 已在上述探测中尝试过，此处仅作状态报告
  }

  throw new Error('所有模型均不可用')
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  system?: string
  preferDoubao?: boolean  // OPT-2: 后台任务优先用豆包（更快、不占用主对话通道）
}

// === 非流式便捷封装（兼容旧 llm.ts 接口） ===
export async function chatCompletion(
  messages: LLMMessage[],
  options?: LLMOptions
): Promise<string> {
  return chat(messages, options)
}

// === 流式便捷封装（兼容旧 llm.ts 接口） ===
export async function* chatCompletionStream(
  messages: LLMMessage[],
  options?: LLMOptions
): AsyncGenerator<string, void, unknown> {
  const { stream } = await streamChat(messages, options)
  for await (const chunk of stream) {
    if (chunk) yield chunk
  }
}

// === 非流式对话（主模型 + 并行备用） ===
export async function chat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: LLMOptions
): Promise<string> {
  const { temperature = 0.3, maxTokens: maxOutputTokens = 768, system, preferDoubao = false } = options || {}  // OPT-1: 1024→768 非流式调用默认更小
  const systemMessage = system ?? messages.find(m => m.role === 'system')?.content
  const chatMessages = messages.filter(m => m.role !== 'system')

  // OPT-2: 后台任务（记忆提取等）优先用豆包，避免占用 DeepSeek 主对话通道
  if (preferDoubao && isDoubaoEnabled()) {
    try {
      const result = await withTimeout(
        withRetry(async () => {
          const r = await generateText({
            model: getDoubaoProvider()(getDoubaoModel()),
            system: systemMessage,
            messages: chatMessages,
            temperature,
            maxOutputTokens,
            maxRetries: 0,
          })
          return r.text
        }, 'chat-doubao-preferred', doubaoCB),
        15000,  // FIX: 30s→15s，429 错误 0.2s 就会返回，15s 足够
        'chat-doubao-preferred'
      )
      console.log('[chat] 后台任务使用豆包（优先模式）')
      return result
    } catch (e) {
      console.warn('[chat] 豆包优先模式失败，降级到双模型并行:', e instanceof Error ? e.message : String(e))
      // 降级到下面的双模型并行逻辑
    }
  }

  // 如果豆包未启用，只用DeepSeek
  if (!isDoubaoEnabled()) {
    return withTimeout(
      withRetry(async () => {
        const result = await generateText({
          model: getDeepseekProvider()(getModel()),
          system: systemMessage,
          messages: chatMessages,
          temperature,
          maxOutputTokens,
          maxRetries: 0,
        })
        return result.text
      }, 'chat', deepseekCB),
      30000,
      'chat'
    )
  }

  // 双模型并行：DeepSeek + 豆包同时请求，取更快的结果
  const deepseekPromise = withTimeout(
    withRetry(async () => {
      const result = await generateText({
        model: getDeepseekProvider()(getModel()),
        system: systemMessage,
        messages: chatMessages,
        temperature,
        maxOutputTokens,
        maxRetries: 0,
      })
      return { text: result.text, source: 'deepseek' as const }
    }, 'chat', deepseekCB),
    30000,
    'chat'
  ).catch((e) => ({ text: '', source: 'deepseek' as const, error: e }))

  const doubaoPromise = withTimeout(
    withRetry(async () => {
      const result = await generateText({
        model: getDoubaoProvider()(getDoubaoModel()),
        system: systemMessage,
        messages: chatMessages,
        temperature,
        maxOutputTokens,
        maxRetries: 0,
      })
      return { text: result.text, source: 'doubao' as const }
    }, 'chat-doubao', doubaoCB),
    30000,
    'chat'
  ).catch((e) => ({ text: '', source: 'doubao' as const, error: e }))

  const result = await Promise.race([deepseekPromise, doubaoPromise])

  // 如果race winner有结果，直接返回
  if ('text' in result && result.text) {
    console.log(`[chat] 使用${result.source}的结果（更快）`)
    return result.text
  }

  // 如果race winner失败了，等另一个
  const [deepseekResult, doubaoResult] = await Promise.allSettled([deepseekPromise, doubaoPromise])

  if (deepseekResult.status === 'fulfilled' && 'text' in deepseekResult.value && deepseekResult.value.text) {
    return deepseekResult.value.text
  }
  if (doubaoResult.status === 'fulfilled' && 'text' in doubaoResult.value && doubaoResult.value.text) {
    return doubaoResult.value.text
  }

  throw new Error('所有模型均不可用')
}

// === 文本嵌入 ===
// 火山方舟的文本 embedding 模型（doubao-embedding-text-*, doubao-embedding-large-text-*）
// 已进入 Retiring 状态，直接用模型 ID 调用 /api/v3/embeddings 会返回 404。
// 解决方案：使用多模态向量化 API（/api/v3/embeddings/multimodal）+ doubao-embedding-vision-*
// 模型。该 API 支持纯文本输入（type: "text"），返回 2048 维向量，与 ZVEC_EMBEDDING_DIMENSION 匹配。
// 官方文档：https://www.volcengine.com/docs/82379/1523520
//
// OPT-6: 多模型回退 — vision 模型不可用时尝试其他 embedding 模型
let workingEmbeddingModel: string | null = null

export async function getEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) return []
  // FIX: 后端不可用时直接返回空，跳过所有嵌入请求
  if (_backendUnavailable) return []

  const trimmed = text.trim().slice(0, 1000)

  // 优先使用豆包多模态向量化 API
  if (isDoubaoEnabled()) {
    // 如果已找到可用模型，直接使用
    if (workingEmbeddingModel) {
      try {
        return await withTimeout(
          withRetry(async () => callDoubaoEmbedding(trimmed, workingEmbeddingModel!), 'getEmbedding-doubao', doubaoCB),
          20000,
          'getEmbedding-doubao'
        )
      } catch (e) {
        console.warn(`[Embedding] 模型 ${workingEmbeddingModel} 不可用，重新探测:`, e instanceof Error ? e.message : String(e))
        workingEmbeddingModel = null
        // FIX: 501/404 等永久错误说明后端不存在，标记并快速返回
        if (isNonRetryableError(e)) {
          markBackendUnavailable()
          return []
        }
      }
    }

    // 逐个尝试候选模型
    const candidateModels = [getDoubaoEmbeddingModel(), 'doubao-embedding-text-240715', 'doubao-embedding-large-text-240915']
    for (const model of candidateModels) {
      try {
        const result = await withTimeout(
          withRetry(async () => callDoubaoEmbedding(trimmed, model), 'getEmbedding-doubao', doubaoCB),
          20000,
          'getEmbedding-doubao'
        )
        workingEmbeddingModel = model
        console.log(`[Embedding] 使用模型 ${model}`)
        return result
      } catch (e) {
        console.warn(`[Embedding] 模型 ${model} 不可用:`, e instanceof Error ? e.message : String(e))
        // FIX: 501/404 等永久错误说明后端不存在，不再尝试其他模型
        if (isNonRetryableError(e)) {
          markBackendUnavailable()
          break
        }
      }
    }

    console.warn('[Embedding] 所有豆包 embedding 模型均不可用')
    return []
  }

  // 降级：尝试 DeepSeek（已知 DeepSeek 无标准 embedding 接口，大概率失败）
  console.warn('[Embedding] 未配置豆包 Key，尝试 DeepSeek embedding（可能不可用）')
  return withTimeout(
    withRetry(async () => {
      const { embed } = await import('ai')
      const result = await embed({
        model: getDeepseekProvider().embeddingModel(getModel()),
        value: trimmed,
      })
      return result.embedding
    }, 'getEmbedding-deepseek', deepseekCB),
    20000,
    'getEmbedding-deepseek'
  ).catch((e) => {
    console.warn('[Embedding] DeepSeek embedding 失败:', e instanceof Error ? e.message : String(e))
    return []
  })
}

/**
 * 统一的 embedding 调用函数
 * 自动选择 multimodal 或标准 embeddings 端点
 * OPT-6: 支持多模型回退
 */
async function callDoubaoEmbedding(text: string, model: string): Promise<number[]> {
  const isVisionModel = model.includes('vision')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-provider': 'doubao',
  }
  const userKey = getDoubaoApiKey()
  if (userKey) headers['x-user-api-key'] = userKey
  const token = getProxyToken()
  if (token) headers['x-api-token'] = token

  const body = isVisionModel
    ? { model, encoding_format: 'float', dimensions: 2048, input: [{ type: 'text', text }] }
    : { model, encoding_format: 'float', input: text }

  const response = await fetch(`${PROXY_BASE_URL}/embeddings${isVisionModel ? '/multimodal' : ''}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    // FIX: 501 (Method Not Implemented) / 404 表明无后端代理（HTML Demo 模式）
    if (response.status === 501 || response.status === 404) {
      markBackendUnavailable()
    }
    throw new Error(`Doubao embedding failed: ${response.status} ${errText.slice(0, 200)}`)
  }

  const data = await response.json()
  // 多模态 API 返回格式：{ data: { embedding: [...] } }
  // 标准 API 返回格式：{ data: [{ embedding: [...] }] }
  const embedding = isVisionModel
    ? data?.data?.embedding
    : data?.data?.[0]?.embedding
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error('Doubao embedding returned empty embedding')
  }
  return embedding as number[]
}

// === 降级回复 ===
export function getFallbackReply(): string {
  const fallbacks = [
    '网络有点慢，让我想想...',
    '抱歉，我这边出了点小问题，能再说一遍吗？',
    '服务暂时不太稳定，稍等一下我再回答你。',
    '哎呀，好像卡住了。你刚才说什么来着？',
  ]
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}

// 导出熔断器状态
export function getCircuitBreakerStatus(): { deepseek: boolean; doubao: boolean } {
  return {
    deepseek: deepseekCB.isOpen,
    doubao: doubaoCB.isOpen,
  }
}

// 导出 API Key 池状态
export function getApiKeyPoolStatus(): { total: number; available: number; rateLimited: number } {
  return apiKeyPool.getStatus()
}

// === 统一安全包装：模型不可用时自动降级到本地示例回复 ===
import { generateDemoReply } from './demoReply'

export async function safeChat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
): Promise<{ text: string; mode: 'live' | 'demo' }> {
  // 首次用户体验：先快速探测，不可用则直接尝试实际请求（探测可能因超时误判）
  const probeMessages = messages.filter(m => m.role !== 'system')
  const liveAvailable = await quickProbeModel(getDeepseekProvider(), getModel(), probeMessages, 'deepseek')
  if (!liveAvailable && isDoubaoEnabled()) {
    const doubaoAvailable = await quickProbeModel(getDoubaoProvider(), getDoubaoModel(), probeMessages, 'doubao')
    if (!doubaoAvailable) {
      // 探测均失败，但仍尝试实际请求作为最后兜底（探测超时 ≠ 服务不可用）
      try {
        const text = await chat(messages, options)
        return { text, mode: 'live' }
      } catch (err) {
        if (isDemoModeError(err)) {
          const lastUser = messages.slice().reverse().find(m => m.role === 'user')
          return { text: generateDemoReply(lastUser?.content || ''), mode: 'demo' }
        }
        throw err
      }
    }
  } else if (!liveAvailable) {
    // DeepSeek 不可用且豆包未启用，尝试实际请求兜底
    try {
      const text = await chat(messages, options)
      return { text, mode: 'live' }
    } catch (err) {
      if (isDemoModeError(err)) {
        const lastUser = messages.slice().reverse().find(m => m.role === 'user')
        return { text: generateDemoReply(lastUser?.content || ''), mode: 'demo' }
      }
      throw err
    }
  }

  try {
    const text = await chat(messages, options)
    return { text, mode: 'live' }
  } catch (err) {
    if (isDemoModeError(err)) {
      const lastUser = messages.slice().reverse().find(m => m.role === 'user')
      return { text: generateDemoReply(lastUser?.content || ''), mode: 'demo' }
    }
    throw err
  }
}

export async function safeStreamChat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
): Promise<{ stream: AsyncIterable<string>; model: string; mode: 'live' } | { stream: AsyncIterable<string>; model: string; mode: 'demo'; demoText: string }> {
  try {
    const result = await streamChat(messages, options)
    return { ...result, mode: 'live' }
  } catch (err) {
    if (isDemoModeError(err)) {
      const lastUser = messages.slice().reverse().find(m => m.role === 'user')
      const demoText = generateDemoReply(lastUser?.content || '')
      async function* gen() {
        // 模拟流式：逐字输出，让用户体验到「实时回复」
        const chunks = demoText.split('')
        for (const ch of chunks) {
          yield ch
          await new Promise(r => setTimeout(r, 8))
        }
      }
      return { stream: gen(), model: 'demo-local', mode: 'demo', demoText }
    }
    throw err
  }
}
