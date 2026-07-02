import { NextResponse } from 'next/server'

interface AIModel {
  id: string
  name: string
  description?: string
}

// 各提供商的默认模型列表（作为 API 不可用时的回退）
const DEEPSEEK_MODELS: AIModel[] = [
  { id: 'deepseek-chat', name: 'DeepSeek-V3', description: '通用对话模型' },
  { id: 'deepseek-reasoner', name: 'DeepSeek-R1', description: '推理模型（擅长数学、代码）' },
]

const OPENAI_MODELS: AIModel[] = [
  { id: 'gpt-4o', name: 'GPT-4o', description: '多模态旗舰模型' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '轻量快速模型' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: '高性能模型' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '经济型模型' },
]

const GROK_MODELS: AIModel[] = [
  { id: 'grok-3-latest', name: 'Grok-3 Latest', description: 'xAI 最新模型' },
  { id: 'grok-3-fast', name: 'Grok-3 Fast', description: 'xAI 快速模型' },
  { id: 'grok-2-1212', name: 'Grok-2', description: 'xAI 模型' },
]

export async function POST(req: Request) {
  try {
    const { provider, baseUrl, apiKey } = await req.json()

    if (!provider) {
      return NextResponse.json({ error: '缺少 provider 参数' }, { status: 400 })
    }

    switch (provider) {
      case 'ollama': {
        const url = (baseUrl || 'http://localhost:11434').replace(/\/$/, '')
        const res = await fetch(`${url}/api/tags`, {
          headers: { 'Content-Type': 'application/json' },
        })
        if (!res.ok) throw new Error(`Ollama 返回 HTTP ${res.status}`)
        const data = await res.json()
        const models = (data.models || []).map((m: any) => ({
          id: m.name || m.model,
          name: m.name || m.model,
          description: m.details?.family || '本地模型',
        }))
        return NextResponse.json({ models })
      }

      case 'deepseek': {
        const url = (baseUrl || 'https://api.deepseek.com').replace(/\/$/, '')
        if (apiKey) {
          try {
            const res = await fetch(`${url}/models`, {
              headers: { Authorization: `Bearer ${apiKey}` },
            })
            if (res.ok) {
              const data = await res.json()
              const models = (data.data || []).map((m: any) => ({
                id: m.id, name: m.id, description: 'DeepSeek 模型',
              }))
              if (models.length > 0) return NextResponse.json({ models })
            }
          } catch { /* 回退到默认列表 */ }
        }
        return NextResponse.json({ models: DEEPSEEK_MODELS })
      }

      case 'openai': {
        const url = (baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '')
        if (apiKey) {
          try {
            const res = await fetch(`${url}/models`, {
              headers: { Authorization: `Bearer ${apiKey}` },
            })
            if (res.ok) {
              const data = await res.json()
              const models = (data.data || [])
                .filter((m: any) => /gpt|o1|o3/i.test(m.id))
                .sort((a: any, b: any) => b.created - a.created)
                .slice(0, 15)
                .map((m: any) => ({ id: m.id, name: m.id, description: 'OpenAI 模型' }))
              if (models.length > 0) return NextResponse.json({ models })
            }
          } catch { /* 回退到默认列表 */ }
        }
        return NextResponse.json({ models: OPENAI_MODELS })
      }

      case 'grok': {
        const url = (baseUrl || 'https://api.x.ai/v1').replace(/\/$/, '')
        if (apiKey) {
          try {
            const res = await fetch(`${url}/models`, {
              headers: { Authorization: `Bearer ${apiKey}` },
            })
            if (res.ok) {
              const data = await res.json()
              const models = (data.data || []).map((m: any) => ({
                id: m.id, name: m.id, description: 'xAI 模型',
              }))
              if (models.length > 0) return NextResponse.json({ models })
            }
          } catch { /* 回退到默认列表 */ }
        }
        return NextResponse.json({ models: GROK_MODELS })
      }

      case 'cherry': {
        const url = (baseUrl || 'http://localhost:23333/v1').replace(/\/$/, '')
        try {
          const res = await fetch(`${url}/models`, {
            headers: { 'Content-Type': 'application/json' },
          })
          if (res.ok) {
            const data = await res.json()
            const models = (data.data || []).map((m: any) => ({
              id: m.id, name: m.id, description: 'Cherry Studio',
            }))
            if (models.length > 0) return NextResponse.json({ models })
          }
        } catch { /* 回退到默认列表 */ }
        return NextResponse.json({
          models: [
            { id: 'openai:gpt-4o-mini', name: 'GPT-4o Mini', description: 'OpenAI 轻量模型' },
            { id: 'openai:gpt-4o', name: 'GPT-4o', description: 'OpenAI 旗舰模型' },
            { id: 'anthropic:claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Anthropic 模型' },
          ]
        })
      }

      case 'custom': {
        if (!baseUrl) {
          return NextResponse.json({ error: '自定义模型需要设置 Base URL' }, { status: 400 })
        }
        const url = baseUrl.replace(/\/$/, '')
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
        const res = await fetch(`${url}/models`, { headers })
        if (!res.ok) throw new Error(`API 返回 HTTP ${res.status}`)
        const data = await res.json()
        const models = (data.data || []).map((m: any) => ({
          id: m.id, name: m.id, description: '自定义模型',
        }))
        return NextResponse.json({ models })
      }

      default:
        return NextResponse.json({ error: `不支持的提供商: ${provider}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('模型发现失败:', error)
    return NextResponse.json({ error: error.message || '模型发现失败' }, { status: 500 })
  }
}
