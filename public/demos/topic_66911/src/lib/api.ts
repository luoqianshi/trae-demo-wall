const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

import { getAIConfig } from './editor-api'

// Helper to get auth token
function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('caijianji_token')
  }
  return null
}

// Helper to check if user is guest
function isGuestUser(): boolean {
  const token = getToken()
  return token?.startsWith('guest_') || false
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

  try {
    const res = await fetch(url, { ...options, headers })
    if (res.status === 401) {
      localStorage.removeItem('caijianji_token')
      localStorage.removeItem('caijianji_user')
      throw new Error('AUTH_EXPIRED')
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: '请求失败' }))
      throw new Error(err.error || '请求失败')
    }
    return res
  } catch (error: any) {
    if (error.message === 'Failed to fetch') {
      throw new Error('无法连接到服务器，请检查网络或稍后重试')
    }
    throw error
  }
}

// ============ TYPES ============

export interface User {
  id: string
  username: string
  displayName: string
  email: string | null
  isGuest: boolean
}

export interface Plan {
  id: string
  userId: string
  title: string
  description: string
  deadline: string
  totalWords: number
  status: 'active' | 'completed' | 'archived'
  createdAt: string
  updatedAt: string
  progress: number
  tasks: Task[]
}

export interface Task {
  id: string
  planId: string
  title: string
  description: string
  orderNum: number
  status: 'pending' | 'in_progress' | 'completed'
  targetWords: number
  completedWords: number
  deadline: string
  createdAt: string
}

export interface ChatSession {
  id: string
  userId: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface Paper {
  id: string
  userId: string
  title: string
  authors: string
  journal: string
  year: number | null
  doi: string
  abstract: string
  tags: string
  readStatus: 'unread' | 'reading' | 'read'
  notes: string
  rating: number
  createdAt: string
  updatedAt: string
}

export interface KnowledgeEntry {
  id: string
  userId: string
  title: string
  content: string
  category: string
  tags: string
  sourcePaperId: string | null
  sourcePaperTitle?: string
  createdAt: string
  updatedAt: string
}

export interface AIPlan {
  title: string
  deadline: string
  phases: {
    name: string
    duration: number
    tasks: string[]
  }[]
}

// ============ LOCAL STORAGE HELPERS FOR GUEST USERS ============

const GUEST_PLANS_KEY = 'caijianji_guest_plans'
const GUEST_PAPERS_KEY = 'caijianji_guest_papers'
const GUEST_KNOWLEDGE_KEY = 'caijianji_guest_knowledge'
const GUEST_CHAT_KEY = 'caijianji_guest_chat'

function getGuestData<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function setGuestData<T>(key: string, data: T[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data))
  }
}

function generateGuestId(): string {
  return 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// ============ AUTH API ============

function handleNetworkError(error: any, defaultMsg: string): never {
  if (error.message === 'Failed to fetch') {
    throw new Error('无法连接到服务器，请检查网络或稍后重试')
  }
  throw new Error(defaultMsg)
}

export async function register(username: string, password: string, email?: string, displayName?: string): Promise<{ token: string; user: User }> {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email, displayName }),
    })
    if (!res.ok) throw new Error('注册失败')
    return res.json()
  } catch (error: any) {
    handleNetworkError(error, '注册失败')
  }
}

export async function login(username: string, password: string): Promise<{ token: string; user: User }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) throw new Error('登录失败，用户名或密码错误')
    return res.json()
  } catch (error: any) {
    handleNetworkError(error, '登录失败')
  }
}

export async function guestLogin(): Promise<{ token: string; user: User }> {
  try {
    const res = await fetch(`${API_BASE}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    if (!res.ok) throw new Error('游客登录失败')
    return res.json()
  } catch (error: any) {
    handleNetworkError(error, '游客登录失败')
  }
}

export async function getMe(): Promise<User> {
  const res = await authFetch(`${API_BASE}/auth/me`)
  return res.json()
}

export async function logout(): Promise<void> {
  try {
    await authFetch(`${API_BASE}/auth/logout`, { method: 'POST' })
  } catch {
    // ignore
  }
  localStorage.removeItem('caijianji_token')
  localStorage.removeItem('caijianji_user')
  localStorage.removeItem(GUEST_PLANS_KEY)
  localStorage.removeItem(GUEST_PAPERS_KEY)
  localStorage.removeItem(GUEST_KNOWLEDGE_KEY)
  localStorage.removeItem(GUEST_CHAT_KEY)
}

// ============ PLANS API ============

export async function getPlans(): Promise<Plan[]> {
  if (isGuestUser()) {
    return getGuestData<Plan>(GUEST_PLANS_KEY)
  }
  const res = await authFetch(`${API_BASE}/plans`)
  return res.json()
}

export async function getPlan(id: string): Promise<Plan> {
  if (isGuestUser()) {
    const plans = getGuestData<Plan>(GUEST_PLANS_KEY)
    const plan = plans.find(p => p.id === id)
    if (!plan) throw new Error('Plan not found')
    return plan
  }
  const res = await authFetch(`${API_BASE}/plans/${id}`)
  return res.json()
}

export async function createPlan(data: Partial<Plan>): Promise<Plan> {
  if (isGuestUser()) {
    const plans = getGuestData<Plan>(GUEST_PLANS_KEY)
    const newPlan: Plan = {
      id: generateGuestId(),
      userId: 'guest',
      title: data.title || '',
      description: data.description || '',
      deadline: data.deadline || '',
      totalWords: data.totalWords || 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 0,
      tasks: []
    }
    plans.push(newPlan)
    setGuestData(GUEST_PLANS_KEY, plans)
    return newPlan
  }
  const res = await authFetch(`${API_BASE}/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function updatePlan(id: string, data: Partial<Plan>): Promise<Plan> {
  if (isGuestUser()) {
    const plans = getGuestData<Plan>(GUEST_PLANS_KEY)
    const index = plans.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Plan not found')
    plans[index] = { ...plans[index], ...data, updatedAt: new Date().toISOString() }
    setGuestData(GUEST_PLANS_KEY, plans)
    return plans[index]
  }
  const res = await authFetch(`${API_BASE}/plans/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function deletePlan(id: string): Promise<void> {
  if (isGuestUser()) {
    const plans = getGuestData<Plan>(GUEST_PLANS_KEY)
    setGuestData(GUEST_PLANS_KEY, plans.filter(p => p.id !== id))
    return
  }
  await authFetch(`${API_BASE}/plans/${id}`, { method: 'DELETE' })
}

// ============ TASKS API ============

export async function getTasks(planId: string): Promise<Task[]> {
  if (isGuestUser()) {
    const plans = getGuestData<Plan>(GUEST_PLANS_KEY)
    const plan = plans.find(p => p.id === planId)
    return plan?.tasks || []
  }
  const res = await authFetch(`${API_BASE}/plans/${planId}/tasks`)
  return res.json()
}

export async function createTask(planId: string, data: Partial<Task>): Promise<Task> {
  if (isGuestUser()) {
    const plans = getGuestData<Plan>(GUEST_PLANS_KEY)
    const planIndex = plans.findIndex(p => p.id === planId)
    if (planIndex === -1) throw new Error('Plan not found')

    const newTask: Task = {
      id: generateGuestId(),
      planId,
      title: data.title || '',
      description: data.description || '',
      orderNum: data.orderNum || 0,
      status: 'pending',
      targetWords: data.targetWords || 0,
      completedWords: 0,
      deadline: data.deadline || '',
      createdAt: new Date().toISOString(),
    }
    plans[planIndex].tasks = [...(plans[planIndex].tasks || []), newTask]
    setGuestData(GUEST_PLANS_KEY, plans)
    return newTask
  }
  const res = await authFetch(`${API_BASE}/plans/${planId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function updateTask(taskId: string, data: Partial<Task>): Promise<Task> {
  if (isGuestUser()) {
    const plans = getGuestData<Plan>(GUEST_PLANS_KEY)
    for (const plan of plans) {
      const taskIndex = plan.tasks?.findIndex(t => t.id === taskId)
      if (taskIndex !== undefined && taskIndex !== -1) {
        plan.tasks[taskIndex] = { ...plan.tasks[taskIndex], ...data }
        setGuestData(GUEST_PLANS_KEY, plans)
        return plan.tasks[taskIndex]
      }
    }
    throw new Error('Task not found')
  }
  const res = await authFetch(`${API_BASE}/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function deleteTask(taskId: string): Promise<void> {
  if (isGuestUser()) {
    const plans = getGuestData<Plan>(GUEST_PLANS_KEY)
    for (const plan of plans) {
      if (plan.tasks) {
        plan.tasks = plan.tasks.filter(t => t.id !== taskId)
      }
    }
    setGuestData(GUEST_PLANS_KEY, plans)
    return
  }
  await authFetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' })
}

// ============ AI PLANNING API ============

export async function generateAIPlan(title: string, deadline: string, description?: string): Promise<AIPlan> {
  const aiConfig = getAIConfig()
  const res = await authFetch(`${API_BASE}/ai/generate-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, deadline, description, config: aiConfig }),
  })
  return res.json()
}

// ============ CHAT API ============

export async function getChatSessions(): Promise<ChatSession[]> {
  if (isGuestUser()) {
    return getGuestData<ChatSession>(GUEST_CHAT_KEY)
  }
  const res = await authFetch(`${API_BASE}/chat/sessions`)
  return res.json()
}

export async function createChatSession(title?: string): Promise<ChatSession> {
  if (isGuestUser()) {
    const sessions = getGuestData<ChatSession>(GUEST_CHAT_KEY)
    const newSession: ChatSession = {
      id: generateGuestId(),
      userId: 'guest',
      title: title || '新对话',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    sessions.push(newSession)
    setGuestData(GUEST_CHAT_KEY, sessions)
    return newSession
  }
  const res = await authFetch(`${API_BASE}/chat/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  return res.json()
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  if (isGuestUser()) {
    if (typeof window === 'undefined') return []
    const key = `guest_messages_${sessionId}`
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  }
  const res = await authFetch(`${API_BASE}/chat/sessions/${sessionId}/messages`)
  return res.json()
}

export async function sendChatMessage(sessionId: string, content: string): Promise<ChatMessage> {
  if (isGuestUser()) {
    const msg: ChatMessage = {
      id: generateGuestId(),
      sessionId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    const key = `guest_messages_${sessionId}`
    const existing: ChatMessage[] = (() => {
      if (typeof window === 'undefined') return []
      const raw = sessionStorage.getItem(key)
      return raw ? JSON.parse(raw) : []
    })()
    existing.push(msg)
    if (typeof window !== 'undefined') sessionStorage.setItem(key, JSON.stringify(existing))
    return msg
  }
  const res = await authFetch(`${API_BASE}/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, role: 'user' }),
  })
  return res.json()
}

export async function getAIResponse(sessionId: string, message: string): Promise<{ response: string }> {
  const res = await authFetch(`${API_BASE}/chat/ai-response`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message }),
  })
  return res.json()
}

export async function getAIResponseStream(sessionId: string, message: string, onChunk: (text: string) => void): Promise<string> {
  const res = await authFetch(`${API_BASE}/chat/ai-response`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message }),
  })

  const fullText = ''
  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''
  let accumulated = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') break
        try {
          const parsed = JSON.parse(data)
          if (parsed.content) {
            accumulated += parsed.content
            onChunk(accumulated)
          }
        } catch { }
      }
    }
  }

  return accumulated
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  if (isGuestUser()) {
    const sessions = getGuestData<ChatSession>(GUEST_CHAT_KEY)
    setGuestData(GUEST_CHAT_KEY, sessions.filter(s => s.id !== sessionId))
    return
  }
  await authFetch(`${API_BASE}/chat/sessions/${sessionId}`, { method: 'DELETE' })
}

// ============ PAPERS API ============

export async function getPapers(): Promise<Paper[]> {
  if (isGuestUser()) {
    return getGuestData<Paper>(GUEST_PAPERS_KEY)
  }
  const res = await authFetch(`${API_BASE}/papers`)
  return res.json()
}

export async function createPaper(data: Partial<Paper>): Promise<Paper> {
  if (isGuestUser()) {
    const papers = getGuestData<Paper>(GUEST_PAPERS_KEY)
    const newPaper: Paper = {
      id: generateGuestId(),
      userId: 'guest',
      title: data.title || '',
      authors: data.authors || '',
      journal: data.journal || '',
      year: data.year || null,
      doi: data.doi || '',
      abstract: data.abstract || '',
      tags: data.tags || '',
      readStatus: 'unread',
      notes: '',
      rating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    papers.push(newPaper)
    setGuestData(GUEST_PAPERS_KEY, papers)
    return newPaper
  }
  const res = await authFetch(`${API_BASE}/papers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function updatePaper(id: string, data: Partial<Paper>): Promise<Paper> {
  if (isGuestUser()) {
    const papers = getGuestData<Paper>(GUEST_PAPERS_KEY)
    const index = papers.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Paper not found')
    papers[index] = { ...papers[index], ...data, updatedAt: new Date().toISOString() }
    setGuestData(GUEST_PAPERS_KEY, papers)
    return papers[index]
  }
  const res = await authFetch(`${API_BASE}/papers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function deletePaper(id: string): Promise<void> {
  if (isGuestUser()) {
    const papers = getGuestData<Paper>(GUEST_PAPERS_KEY)
    setGuestData(GUEST_PAPERS_KEY, papers.filter(p => p.id !== id))
    return
  }
  await authFetch(`${API_BASE}/papers/${id}`, { method: 'DELETE' })
}

// ============ KNOWLEDGE API ============

export async function getKnowledge(): Promise<KnowledgeEntry[]> {
  if (isGuestUser()) {
    return getGuestData<KnowledgeEntry>(GUEST_KNOWLEDGE_KEY)
  }
  const res = await authFetch(`${API_BASE}/knowledge`)
  return res.json()
}

export async function createKnowledge(data: Partial<KnowledgeEntry>): Promise<KnowledgeEntry> {
  if (isGuestUser()) {
    const entries = getGuestData<KnowledgeEntry>(GUEST_KNOWLEDGE_KEY)
    const newEntry: KnowledgeEntry = {
      id: generateGuestId(),
      userId: 'guest',
      title: data.title || '',
      content: data.content || '',
      category: data.category || 'general',
      tags: data.tags || '',
      sourcePaperId: data.sourcePaperId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    entries.push(newEntry)
    setGuestData(GUEST_KNOWLEDGE_KEY, entries)
    return newEntry
  }
  const res = await authFetch(`${API_BASE}/knowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function updateKnowledge(id: string, data: Partial<KnowledgeEntry>): Promise<KnowledgeEntry> {
  if (isGuestUser()) {
    const entries = getGuestData<KnowledgeEntry>(GUEST_KNOWLEDGE_KEY)
    const index = entries.findIndex(e => e.id === id)
    if (index === -1) throw new Error('Entry not found')
    entries[index] = { ...entries[index], ...data, updatedAt: new Date().toISOString() }
    setGuestData(GUEST_KNOWLEDGE_KEY, entries)
    return entries[index]
  }
  const res = await authFetch(`${API_BASE}/knowledge/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function deleteKnowledge(id: string): Promise<void> {
  if (isGuestUser()) {
    const entries = getGuestData<KnowledgeEntry>(GUEST_KNOWLEDGE_KEY)
    setGuestData(GUEST_KNOWLEDGE_KEY, entries.filter(e => e.id !== id))
    return
  }
  await authFetch(`${API_BASE}/knowledge/${id}`, { method: 'DELETE' })
}

// ============ STATISTICS API ============

export async function getPlanStatistics(planId: string): Promise<{
  totalWords: number
  completedWords: number
  progress: number
  dailyAverage: number
  daysRemaining: number
  riskLevel: 'low' | 'medium' | 'high'
}> {
  if (isGuestUser()) {
    return { totalWords: 0, completedWords: 0, progress: 0, dailyAverage: 0, daysRemaining: 0, riskLevel: 'low' }
  }
  const res = await authFetch(`${API_BASE}/plans/${planId}/statistics`)
  return res.json()
}

export async function getWritingTrend(planId: string, days: number = 30): Promise<{ date: string; words: number }[]> {
  if (isGuestUser()) {
    return []
  }
  const res = await authFetch(`${API_BASE}/plans/${planId}/trend?days=${days}`)
  return res.json()
}

export async function getOverviewStatistics(): Promise<{
  totalPlans: number
  activePlans: number
  totalPapers: number
  totalKnowledge: number
  totalChatSessions: number
  readPapers: number
  unreadPapers: number
}> {
  if (isGuestUser()) {
    const plans = getGuestData<Plan>(GUEST_PLANS_KEY)
    const papers = getGuestData<Paper>(GUEST_PAPERS_KEY)
    const knowledge = getGuestData<KnowledgeEntry>(GUEST_KNOWLEDGE_KEY)
    const chatSessions = getGuestData<ChatSession>(GUEST_CHAT_KEY)
    return {
      totalPlans: plans.length,
      activePlans: plans.filter(p => p.status === 'active').length,
      totalPapers: papers.length,
      totalKnowledge: knowledge.length,
      totalChatSessions: chatSessions.length,
      readPapers: papers.filter(p => p.readStatus === 'read').length,
      unreadPapers: papers.filter(p => p.readStatus === 'unread').length,
    }
  }
  const res = await authFetch(`${API_BASE}/statistics/overview`)
  return res.json()
}

// ============ AI CALL (re-export from editor-api) ============

export { callAI } from './editor-api'
