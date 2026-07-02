const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

import type { Document, AISuggestion, AIAnalysis, PlanCheckResult, AIProviderConfig } from './editor-types'
import { encryptObject, decryptObject } from './encryption'

// Helper to get auth token
function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('caijianji_token')
  }
  return null
}

// Helper to check if current user is guest
function isGuest(): boolean {
  const token = getToken()
  return !!token && token.startsWith('guest_')
}

// Simple UUID generator for guest mode
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// localStorage key for guest documents
const GUEST_DOCUMENTS_KEY = 'caijianji_documents'

// Helper to get guest documents from localStorage
function getGuestDocuments(): Document[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(GUEST_DOCUMENTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Document[]
  } catch {
    return []
  }
}

// Helper to save guest documents to localStorage
function saveGuestDocuments(docs: Document[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(GUEST_DOCUMENTS_KEY, JSON.stringify(docs))
}

// Helper for authenticated requests
async function authFetch(url: string, options: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { ...options, headers })
  if (res.status === 401) {
    // 清除无效 token，降级为游客模式
    localStorage.removeItem('caijianji_token')
    localStorage.removeItem('caijianji_user')
    throw new Error('AUTH_EXPIRED')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }))
    throw new Error(err.error || '请求失败')
  }
  return res
}

// 包装 API 函数：401 时自动降级为游客模式
function withGuestFallback<T>(guestFn: () => T): (serverFn: () => Promise<T>) => Promise<T> {
  return async (serverFn: () => Promise<T>) => {
    try {
      return await serverFn()
    } catch (e: any) {
      if (e.message === 'AUTH_EXPIRED') {
        return guestFn()
      }
      throw e
    }
  }
}

// ============ Documents API ============

export async function getDocuments(): Promise<Document[]> {
  if (isGuest()) {
    return getGuestDocuments()
  }
  return withGuestFallback(getGuestDocuments)(() =>
    authFetch(`${API_BASE}/documents`).then(r => r.json())
  )
}

export async function createDocument(data: {
  title?: string
  content?: string
  planId?: string | null
}): Promise<Document> {
  const guestCreate = () => {
    const now = new Date().toISOString()
    const title = data.title || '未命名文档'
    const content = data.content || '<p></p>'
    const plainText = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    const wordCount = plainText.length

    const doc: Document = {
      id: generateUUID(),
      userId: 'guest',
      planId: data.planId ?? null,
      title,
      content,
      plainText,
      wordCount,
      fileName: null,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    }

    const docs = getGuestDocuments()
    docs.unshift(doc)
    saveGuestDocuments(docs)
    return doc
  }

  if (isGuest()) {
    return guestCreate()
  }
  return withGuestFallback(guestCreate)(() =>
    authFetch(`${API_BASE}/documents`, {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(r => r.json())
  )
}

export async function getDocument(id: string): Promise<Document> {
  const guestGet = () => {
    const docs = getGuestDocuments()
    const doc = docs.find((d) => d.id === id)
    if (!doc) throw new Error('文档不存在')
    return doc
  }
  if (isGuest()) return guestGet()
  return withGuestFallback(guestGet)(() =>
    authFetch(`${API_BASE}/documents/${id}`).then(r => r.json())
  )
}

export async function updateDocument(
  id: string,
  data: { title?: string; content?: string; status?: string; planId?: string | null }
): Promise<Document> {
  const guestUpdate = () => {
    const docs = getGuestDocuments()
    const index = docs.findIndex((d) => d.id === id)
    if (index === -1) throw new Error('文档不存在')

    const doc = docs[index]
    if (data.title !== undefined) doc.title = data.title
    if (data.content !== undefined) {
      doc.content = data.content
      doc.plainText = data.content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      doc.wordCount = doc.plainText.length
    }
    if (data.status !== undefined) doc.status = data.status as Document['status']
    if (data.planId !== undefined) doc.planId = data.planId
    doc.updatedAt = new Date().toISOString()

    docs[index] = doc
    saveGuestDocuments(docs)
    return doc
  }
  if (isGuest()) return guestUpdate()
  return withGuestFallback(guestUpdate)(() =>
    authFetch(`${API_BASE}/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }).then(r => r.json())
  )
}

export async function deleteDocument(id: string): Promise<void> {
  const guestDelete = () => {
    const docs = getGuestDocuments()
    saveGuestDocuments(docs.filter((d) => d.id !== id))
  }
  if (isGuest()) return guestDelete()
  return withGuestFallback(guestDelete)(() =>
    authFetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' }).then(() => { })
  )
}

export async function uploadDocument(file: File): Promise<Document> {
  // Use mammoth to parse .docx file for both guest and authenticated users
  const arrayBuffer = await file.arrayBuffer()
  const mammoth = await import('mammoth')
  const result = await mammoth.convertToHtml({ arrayBuffer })
  const html = result.value
  const plainText = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()

  const title = file.name.replace(/\.(docx?|DOCX?)$/, '') || '导入文档'
  const now = new Date().toISOString()

  if (isGuest()) {
    const doc: Document = {
      id: generateUUID(),
      userId: 'guest',
      planId: null,
      title,
      content: html || '<p></p>',
      plainText,
      wordCount: plainText.length,
      fileName: file.name,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    }

    const docs = getGuestDocuments()
    docs.unshift(doc)
    saveGuestDocuments(docs)
    return doc
  }

  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(err.error || 'Upload failed')
  }
  return res.json()
}

// Helper to escape HTML special characters
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// ============ AI Configuration ============

const AI_SETTINGS_KEY = 'caijianji_ai_settings'
const AI_SETTINGS_KEY_ENCRYPTED = 'caijianji_ai_settings_encrypted'

export function getAIConfig(): AIProviderConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const encrypted = localStorage.getItem(AI_SETTINGS_KEY_ENCRYPTED)
    if (encrypted) {
      const decrypted = decryptObject<AIProviderConfig>(encrypted)
      if (decrypted) return decrypted
    }
    
    const raw = localStorage.getItem(AI_SETTINGS_KEY)
    if (!raw) return null
    
    const config = JSON.parse(raw) as AIProviderConfig
    saveAIConfig(config)
    localStorage.removeItem(AI_SETTINGS_KEY)
    
    return config
  } catch {
    return null
  }
}

export function saveAIConfig(config: AIProviderConfig): void {
  if (typeof window === 'undefined') return
  const encrypted = encryptObject(config)
  localStorage.setItem(AI_SETTINGS_KEY_ENCRYPTED, encrypted)
}

export function hasAIConfig(): boolean {
  return getAIConfig() !== null
}

// ============ Generic AI Call ============

export interface AICallOptions {
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

export async function callAI(prompt: string, options: AICallOptions = {}): Promise<string> {
  const config = getAIConfig()
  if (!config) {
    throw new Error('AI 未配置。请先点击 AI 面板右上角的设置按钮配置 AI 提供商。')
  }

  const { provider, apiKey, baseUrl, model } = config
  const { systemPrompt = 'You are a helpful assistant.', temperature = 0.7, maxTokens = 2048 } = options

  if (provider === 'ollama') {
    const url = `${baseUrl || 'http://localhost:11434'}/api/generate`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3.2',
        prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
        stream: false,
        options: {
          temperature,
          num_predict: maxTokens,
        },
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Ollama request failed' }))
      throw new Error(err.error || `Ollama HTTP ${res.status}`)
    }
    const data = await res.json()
    return data.response || ''
  }

  // For DeepSeek, OpenAI, and Custom providers (OpenAI-compatible API)
  let url: string
  let headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (provider === 'deepseek') {
    url = `${baseUrl || 'https://api.deepseek.com'}/chat/completions`
    headers['Authorization'] = `Bearer ${apiKey}`
  } else if (provider === 'openai') {
    url = `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`
    headers['Authorization'] = `Bearer ${apiKey}`
  } else {
    // custom
    url = `${baseUrl}/chat/completions`
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
  }

  const messages = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: prompt })

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'AI request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ============ AI API ============

export async function getAISuggestion(
  documentId: string,
  context?: string,
  cursorPosition?: number
): Promise<AISuggestion> {
  if (!hasAIConfig()) {
    return {
      suggestions: ['AI 尚未配置。请点击 AI 面板右上角的设置按钮，配置你的 AI 提供商和 API Key。'],
      category: 'general',
      context: context || '',
    }
  }

  try {
    const prompt = `请根据以下写作内容，提供 3 条续写建议：\n\n${context || ''}\n\n请用中文回复，每条建议单独一行，前面加上序号。`
    const response = await callAI(prompt, {
      systemPrompt: '你是一位学术写作助手，擅长帮助用户续写论文和学术文档。',
      temperature: 0.8,
      maxTokens: 1024,
    })

    const suggestions = response
      .split('\n')
      .map((line) => line.replace(/^\d+[.、]\s*/, '').trim())
      .filter((line) => line.length > 10)
      .slice(0, 3)

    return {
      suggestions: suggestions.length > 0 ? suggestions : [response.trim()],
      category: 'general',
      context: context || '',
    }
  } catch (e: any) {
    return {
      suggestions: [`AI 调用失败: ${e.message}`],
      category: 'general',
      context: context || '',
    }
  }
}

export async function analyzeDocument(documentId: string, content?: string): Promise<AIAnalysis> {
  if (!hasAIConfig()) {
    return {
      wordCount: 0,
      paragraphCount: 0,
      chapterCount: 0,
      sectionCount: 0,
      chapters: [],
      sections: [],
      structure: {
        hasAbstract: false,
        hasKeywords: false,
        hasReferences: false,
        hasConclusion: false,
      },
      planSuggestions: ['AI 尚未配置。请点击 AI 面板右上角的设置按钮，配置你的 AI 提供商和 API Key。'],
      overallScore: 0,
    }
  }

  try {
    const plainText = content ? content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : ''
    const paragraphs = plainText.split(/\n+/).filter((p) => p.trim().length > 0)
    const chapters = paragraphs.filter((p) => /^[第\d一二三四五六七八九十]+章|^\d+\./.test(p.trim()))

    const prompt = `请分析以下文档的结构完整度，并给出改进建议。文档内容如下：\n\n${plainText.slice(0, 3000)}\n\n请回复 JSON 格式：{"overallScore": 0-100, "planSuggestions": ["建议1", "建议2"], "structure": {"hasAbstract": true/false, "hasKeywords": true/false, "hasReferences": true/false, "hasConclusion": true/false}}`

    const response = await callAI(prompt, {
      systemPrompt: '你是一位学术论文评审专家。请只输出合法的 JSON，不要包含其他文字。',
      temperature: 0.3,
      maxTokens: 1024,
    })

    let parsed: Partial<AIAnalysis> = {}
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      }
    } catch {
      // ignore parse error
    }

    return {
      wordCount: plainText.length,
      paragraphCount: paragraphs.length,
      chapterCount: chapters.length,
      sectionCount: 0,
      chapters: chapters.slice(0, 20),
      sections: [],
      structure: {
        hasAbstract: parsed.structure?.hasAbstract ?? plainText.includes('摘要'),
        hasKeywords: parsed.structure?.hasKeywords ?? plainText.includes('关键词'),
        hasReferences: parsed.structure?.hasReferences ?? plainText.includes('参考文献'),
        hasConclusion: parsed.structure?.hasConclusion ?? plainText.includes('结论'),
      },
      planSuggestions: parsed.planSuggestions?.length
        ? parsed.planSuggestions
        : ['分析完成，暂无额外建议。'],
      overallScore: parsed.overallScore ?? 70,
    }
  } catch (e: any) {
    return {
      wordCount: 0,
      paragraphCount: 0,
      chapterCount: 0,
      sectionCount: 0,
      chapters: [],
      sections: [],
      structure: { hasAbstract: false, hasKeywords: false, hasReferences: false, hasConclusion: false },
      planSuggestions: [`AI 分析失败: ${e.message}`],
      overallScore: 0,
    }
  }
}

export async function checkPlanProgress(documentId: string): Promise<PlanCheckResult> {
  if (!hasAIConfig()) {
    return {
      documentId,
      planId: null,
      tasks: [],
      summary: {
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        progress: 0,
      },
      suggestions: ['AI 尚未配置。请点击 AI 面板右上角的设置按钮，配置你的 AI 提供商和 API Key。'],
    }
  }

  try {
    const prompt = `请检查以下写作计划的进度。当前文档 ID: ${documentId}\n\n请评估任务完成情况，并给出建议。`
    const response = await callAI(prompt, {
      systemPrompt: '你是一位项目进度管理专家。',
      temperature: 0.5,
      maxTokens: 1024,
    })

    return {
      documentId,
      planId: null,
      tasks: [],
      summary: {
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        progress: 0,
      },
      suggestions: [response.trim()],
    }
  } catch (e: any) {
    return {
      documentId,
      planId: null,
      tasks: [],
      summary: {
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        progress: 0,
      },
      suggestions: [`AI 检查失败: ${e.message}`],
    }
  }
}

// ============ 文章润色 API ============

export type PolishType = 'standard' | 'academic' | 'business' | 'creative'

export interface PolishResponse {
  originalText: string
  polishedText: string
  diffMarkup: string
  error?: string
}

/**
 * 计算两段文本的差异并生成带有HTML标记的差异
 */
function generateDiffMarkup(original: string, polished: string): string {
  const diffLines: string[] = []
  const originalLines = original.split('\n')
  const polishedLines = polished.split('\n')

  let i = 0, j = 0

  while (i < originalLines.length || j < polishedLines.length) {
    const origLine = i < originalLines.length ? originalLines[i] : ''
    const polishLine = j < polishedLines.length ? polishedLines[j] : ''

    if (origLine === polishLine) {
      diffLines.push(escapeHtml(origLine))
      i++
      j++
    } else {
      if (j + 1 < polishedLines.length && originalLines[i] === polishedLines[j + 1]) {
        diffLines.push(`<ins class="diff-add">${escapeHtml(polishLine)}</ins>`)
        j++
      } else if (i + 1 < originalLines.length && polishedLines[j] === originalLines[i + 1]) {
        diffLines.push(`<del class="diff-del">${escapeHtml(origLine)}</del>`)
        i++
      } else {
        diffLines.push(`<del class="diff-del">${escapeHtml(origLine)}</del>`)
        diffLines.push(`<ins class="diff-add">${escapeHtml(polishLine)}</ins>`)
        i++
        j++
      }
    }
  }

  return diffLines.join('\n')
}

/**
 * 文章润色函数
 */
export async function polishContent(
  originalText: string,
  polishType: PolishType = 'standard'
): Promise<PolishResponse> {
  const config = getAIConfig()
  if (!config) {
    return {
      originalText,
      polishedText: '',
      diffMarkup: '',
      error: 'AI 未配置。请先点击 AI 面板右上角的设置按钮配置 AI 提供商。',
    }
  }

  const { provider, apiKey, baseUrl, model } = config

  const stylePrompt = {
    standard: '使用更加流畅和自然的语言。',
    academic: '使用更加学术和专业的语言。',
    business: '使用更加商业和专业的语言。',
    creative: '使用更加生动和有创意的语言，增加趣味性和吸引力。',
  }

  const promptTemplate = `请帮我润色以下文章，保持主要内容不变，但提升表达效果和语言流畅度。${stylePrompt[polishType]}

以下是原文：
${originalText}

请提供润色后的文本。只返回润色后的完整文本，不要添加任何说明或解释。`

  try {
    const response = await callAI(promptTemplate, {
      systemPrompt: '你是一位专业的中文文字润色专家，擅长提升文章的表达效果和语言流畅度。',
      temperature: 0.3,
      maxTokens: 4096,
    })

    if (!response.trim()) {
      throw new Error('AI 返回为空')
    }

    const diffMarkup = generateDiffMarkup(originalText, response)

    return {
      originalText,
      polishedText: response,
      diffMarkup,
    }
  } catch (e: any) {
    return {
      originalText,
      polishedText: '',
      diffMarkup: '',
      error: e.message || '润色失败',
    }
  }
}
