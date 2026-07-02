import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import type { AIProvider } from '../../../lib/editor-types'

interface AIConfig {
  provider: AIProvider
  apiKey: string
  baseUrl?: string
  model: string
}

const SYSTEM_PROMPT = '你是彩笺寄学术写作助手，专注于帮助用户进行学术研究与论文写作。回答应专业、严谨、有条理。优先使用中文回复。'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const configHeader = req.headers.get('x-ai-config')
    if (!configHeader) {
      return new Response(
        JSON.stringify({ error: '缺少 AI 配置，请在设置中配置您的 AI 提供商信息' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let config: AIConfig
    try {
      config = JSON.parse(configHeader)
    } catch {
      return new Response(
        JSON.stringify({ error: 'AI 配置格式错误，请检查 x-ai-config 请求头' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const needsApiKey = config.provider !== 'ollama'
    if (!config.provider || !config.model || (needsApiKey && !config.apiKey)) {
      return new Response(
        JSON.stringify({ error: 'AI 配置不完整，需要提供 provider 和 model' + (needsApiKey ? '、apiKey' : '') }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 创建 OpenAI 兼容的提供商
    const createProvider = (apiKey: string, baseURL?: string) =>
      createOpenAI({ apiKey, baseURL: baseURL || undefined })

    let llm

    switch (config.provider) {
      case 'openai':
        llm = createProvider(config.apiKey, config.baseUrl || 'https://api.openai.com/v1')(config.model)
        break

      case 'deepseek':
        llm = createProvider(config.apiKey, config.baseUrl || 'https://api.deepseek.com/v1')(config.model)
        break

      case 'ollama': {
        let baseURL = (config.baseUrl || 'http://localhost:11434').replace(/\/$/, '')
        if (!baseURL.endsWith('/v1')) baseURL += '/v1'
        llm = createProvider(config.apiKey || 'ollama', baseURL)(config.model)
        break
      }

      case 'grok':
        llm = createProvider(config.apiKey, config.baseUrl || 'https://api.x.ai/v1')(config.model)
        break

      case 'cherry':
        llm = createProvider(config.apiKey, config.baseUrl || 'http://localhost:23333/v1')(config.model)
        break

      case 'custom': {
        if (!config.baseUrl) {
          return new Response(
            JSON.stringify({ error: '自定义提供商需要设置 Base URL' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }
        llm = createProvider(config.apiKey, config.baseUrl)(config.model)
        break
      }

      default:
        return new Response(
          JSON.stringify({ error: `不支持的 AI 提供商: ${config.provider}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    const result = await streamText({
      model: llm,
      system: SYSTEM_PROMPT,
      messages,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({
        error: '智囊调用失败',
        message: error instanceof Error ? error.message : '未知错误',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
