export const API_BASE = '/api'

function getAuthToken(): string {
  try {
    return localStorage.getItem('yf_auth_token') || ''
  } catch {
    return ''
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {}
  // FormData 上传时不设置 Content-Type，让浏览器自动生成 boundary
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${resp.statusText}`)
  }
  return resp.json()
}

// ── 仪表盘 ──
export async function fetchStatus() { return request<{ running: boolean; uptime: number; start_time: string; version: string; go_version: string; goroutines: number; memory_mb: number; num_cpu: number }>('/status') }
export async function fetchDashboard() { return request<{ status: { running: boolean; uptime: number; memory_mb: number }; plugins: { count: number; list: Array<{ id: string; status: string }> }; llm: { providers: number; models: number }; messages: { recent: Array<{ id: string; content: string; sender: string; direction: string; group_id: string; timestamp: number }>; by_group: Record<string, Array<{ id: string; content: string; sender: string; direction: string; group_id: string; timestamp: number }>> }; config: { nickname: string; auto_reply: boolean }; timestamp: number }>('/dashboard') }

// ── 插件 ──
export async function fetchPlugins() { return request<{ plugins: Array<{ id: string; name: string; version: string; description: string; type: string; status: string; author?: string; tags?: string[]; url?: string; icon?: string; ipc_mode?: boolean }>; count: number }>('/plugins') }
export async function togglePlugin(pluginId: string) { return request<{ success: boolean; enabled: boolean; message: string }>(`/plugins/${pluginId}/toggle`, { method: 'POST' }) }
export async function reloadPlugin(pluginId: string) { return request<{ success: boolean; message: string }>(`/plugins/${pluginId}/reload`, { method: 'POST' }) }
export async function fetchPluginConfig(pluginId: string) { return request<{ success: boolean; plugin_id: string; config: { raw?: string; path?: string; note?: string; parsed?: Record<string, unknown>; format?: string } }>(`/plugins/${pluginId}/config`) }
export async function savePluginConfig(pluginId: string, payload: { raw?: string; parsed?: Record<string, unknown> }) { return request<{ success: boolean; message: string }>(`/plugins/${pluginId}/config`, { method: 'PUT', body: JSON.stringify(payload) }) }
export async function fetchPluginSchema(pluginId: string) { return request<{ success: boolean; schema: { plugin_id: string; plugin_info?: { name: string; version: string; description: string; author: string }; sections: Record<string, { name: string; label: string; description?: string; fields: Array<{ name: string; type: string; description?: string; default?: unknown; required?: boolean; placeholder?: string }> }> } }>(`/plugins/${pluginId}/schema`) }
export async function fetchLTPXIcons() { return request<{ icons: string[]; count: number }>('/icon/ltpx/') }

// ── 配置 ──
export async function fetchBotConfig() { return request<{ success: boolean; config: unknown }>('/config/bot') }
export async function fetchLLMConfig() { return request<{ success: boolean; config: { api_providers: unknown[]; models: unknown[]; model_task_config: unknown; last_model_selection: Record<string, { task_type: string; model_name: string; identifier: string; provider: string; time: number }> } }>('/config/llm') }
export async function saveLLMConfig(config: unknown) { return request<{ success: boolean; message: string }>('/config/llm', { method: 'PUT', body: JSON.stringify(config) }) }
export async function testConnection(provider: { name: string; base_url: string; api_key: string }) { return request<{ success: boolean; result?: { network_ok: boolean; api_key_valid: boolean; latency_ms: number; error: string }; error?: string }>('/config/llm/test-connection', { method: 'POST', body: JSON.stringify(provider) }) }
export async function fetchProviderModels(providerName: string) { return request<{ success: boolean; provider: string; models: Array<{ id: string; name: string; owned_by?: string }>; count: number }>(`/config/llm/models?provider=${encodeURIComponent(providerName)}`) }

// ── 知识库 ──
export async function fetchKnowledgeList(offset?: number, limit?: number) { return request<{ success: boolean; entries: Array<{ id: number; content: string; tags: string[]; source: string; created_at: string; updated_at: string }>; total: number; offset: number; limit: number }>(`/knowledge?offset=${offset ?? 0}&limit=${limit ?? 50}`) }
export async function addKnowledge(content: string, tags: string[]) { return request<{ success: boolean; entry: { id: number; content: string; tags: string[]; source: string; created_at: string; updated_at: string }; message: string }>('/knowledge', { method: 'POST', body: JSON.stringify({ content, tags }) }) }
export async function updateKnowledge(id: number, content: string, tags: string[]) { return request<{ success: boolean; entry: { id: number; content: string; tags: string[]; source: string; created_at: string; updated_at: string }; message: string }>(`/knowledge/${id}`, { method: 'PUT', body: JSON.stringify({ content, tags }) }) }
export async function deleteKnowledge(id: number) { return request<{ success: boolean; message: string }>(`/knowledge/${id}`, { method: 'DELETE' }) }
export async function searchKnowledge(q: string, mode?: 'keyword' | 'semantic') { return request<{ success: boolean; query: string; results: Array<{ id: number; content: string; tags: string[]; source: string; created_at: string; updated_at: string }>; count: number }>(`/knowledge/search?q=${encodeURIComponent(q)}${mode ? `&mode=${mode}` : ''}`) }
export async function importKnowledgeFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const resp = await fetch(`${API_BASE}/knowledge/import`, { method: 'POST', body: formData })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json() as Promise<{ success: boolean; filename: string; imported: number; message: string }>
}

// ── 日志流 ──
export function subscribeLogs(onMessage: (line: string) => void): EventSource {
  const token = getAuthToken()
  const url = token ? `${API_BASE}/logs/stream?token=${encodeURIComponent(token)}` : `${API_BASE}/logs/stream`
  const es = new EventSource(url)
  es.onmessage = (e) => onMessage(e.data)
  es.onerror = () => { /* reconnect handled by browser */ }
  return es
}

// ── SSE 连接工具 ──
// EventSource 不支持自定义请求头，需要通过 URL 参数传递 token
export function createEventSource(path: string): EventSource {
  const token = getAuthToken()
  const url = token ? `${API_BASE}${path}?token=${encodeURIComponent(token)}` : `${API_BASE}${path}`
  return new EventSource(url)
}

// ── 规则 ──
export async function fetchRules() { return request<{ success: boolean; rules: Array<{ id: string; name: string; description: string; enabled: boolean; priority: number; builtin: boolean; condition?: { keywords?: string[]; sender_ids?: string[]; time_range?: string; is_at_me?: boolean; has_image?: boolean; regex?: string }; action?: { set_mood?: string; set_reply_style?: string; set_persona?: string; trigger_plugin?: string; send_reply?: string } }>; count: number }>('/rules') }
export async function createRule(rule: { name: string; description: string; enabled: boolean; priority: number; condition: Record<string, unknown>; action: Record<string, unknown> }) { return request<{ success: boolean; message: string }>('/rules', { method: 'POST', body: JSON.stringify(rule) }) }
export async function updateRule(id: string, rule: { description: string; enabled: boolean; priority: number; condition: Record<string, unknown>; action: Record<string, unknown> }) { return request<{ success: boolean; message: string }>(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(rule) }) }
export async function deleteRule(id: string) { return request<{ success: boolean; message: string }>(`/rules/${id}`, { method: 'DELETE' }) }
export async function toggleRule(id: string) { return request<{ success: boolean; enabled: boolean; message: string }>(`/rules/${id}/toggle`, { method: 'POST' }) }
export async function testRules(test: { content: string; sender_id?: string; group_id?: string; is_at_me?: boolean; has_image?: boolean }) { return request<{ success: boolean; results: Array<{ rule_name: string; matched: boolean; description: string; priority: number; enabled: boolean; builtin: boolean; action: { set_mood?: string; set_reply_style?: string; set_persona?: string; trigger_plugin?: string; send_reply?: string }; match_reason?: string; fail_reason?: string }>; total: number; matched_count: number }>('/rules/test', { method: 'POST', body: JSON.stringify(test) }) }

// ── 聊天记录 ──
export async function fetchChatRecent(limit?: number) { return request<{ success: boolean; messages: Array<{ id: string; platform: string; sender_id: string; sender: string; group_id: string; group_name: string; content: string; direction: string; is_at_me: boolean; has_image: boolean; reply_to_msg_id?: string; timestamp: number }>; count: number }>(`/chat/recent?limit=${limit ?? 50}`) }

// ── 系统 ──
export async function restartSystem() { return request<{ success: boolean; message: string }>('/system/restart', { method: 'POST' }) }

// ── 统计数据 ──
export async function fetchStats() { return request<{ success: boolean; call_trend: Array<{ time: string; calls: number }>; token_usage: Array<{ date: string; prompt_tokens: number; completion_tokens: number; total_tokens: number }>; cost_trend: Array<{ time: string; cost: number }>; total_calls: number; total_cost: number }>('/stats') }

// ── 运行时指标 ──
export async function fetchMetrics() { return request<{ success: boolean; llm: { calls_total: number; calls_success: number; calls_error: number; tokens_in: number; tokens_out: number }; messages: { received: number; processed: number; deduped: number; replied: number }; pipeline: { latency_p50: number; latency_p95: number; latency_p99: number }; memory: { queries: number; deduped: number; hits: number }; plugins: { loaded: number; total: number; commands: number }; circuit_breaker: string }>('/metrics') }

// ── YAML 配置 ──
export async function fetchYAMLConfig() { return request<{ success: boolean; raw: string; path: string }>('/config/yaml') }
export async function saveYAMLConfig(raw: string) { return request<{ success: boolean; message: string }>('/config/yaml', { method: 'PUT', body: JSON.stringify({ raw }) }) }

// ── 健康检查（非 /api 前缀，直接挂载在根路径） ──
export async function fetchHealth() {
  const resp = await fetch('/health')
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json() as Promise<{ status: string; version: string; uptime: string; components: Record<string, { status: string; message: string; latency?: string }>; timestamp: number }>
}

// ── 适配器配置 ──
export async function fetchAdapterConfig() { return request<{ success: boolean; config: AdapterConfig; path: string }>('/config/adapter') }
export async function saveAdapterConfig(config: AdapterConfig) { return request<{ success: boolean; message: string }>('/config/adapter', { method: 'PUT', body: JSON.stringify(config) }) }

// ── 适配器配置类型 ──
export interface AdapterConfig {
  napcat_ws_server?: string | null
  napcat_ws_token?: string | null
  lunar_core_url?: string | null
  lunar_ws_server?: string | null
  poll_interval?: number
  listen_group_ids?: string[]
  trigger_keywords?: string[]
  display_logs?: boolean
  default_reply?: string | null
  yutong_mode?: boolean
}
export async function fetchMemoryStats() { return request<{ success: boolean; memory_fragments: number; vector_entries: number; index_entries: number }>('/memory/stats') }
export async function searchMemory(req: { query: string; session_id?: string; group_id?: string; limit?: number; search_mode?: string; source_kinds?: string[] }) { return request<{ success: boolean; query: string; search_mode?: string; hits: Array<{ fragment_id: string; content: string; score?: number; source_kind: string; session_id: string; group_id: string; user_id: string; access_count: number; created_at: string; expires_at?: string; metadata?: unknown }>; total_hits: number; processing_ms?: number }>('/memory/debug', { method: 'POST', body: JSON.stringify(req) }) }
export async function ingestMemory(req: { content: string; session_id?: string; group_id?: string; user_id?: string; source_kind?: string }) { return request<{ success: boolean; message: string }>('/memory/ingest', { method: 'POST', body: JSON.stringify(req) }) }
export async function deleteMemory(id: string) { return request<{ success: boolean; message: string }>(`/memory/delete?id=${encodeURIComponent(id)}`, { method: 'DELETE' }) }
export async function fetchMemoryList(limit?: number) { return request<{ success: boolean; data: Array<{ fragment_id: string; content: string; source_kind: string; session_id: string; group_id: string; user_id: string; access_count: number; created_at: string; expires_at?: string; metadata?: unknown }>; total: number }>(`/memory/list?limit=${limit ?? 50}`) }

// ── 黑话/新词 ──
export async function fetchJargonList(limit?: number) { return request<{ success: boolean; entries: Array<{ id: number; word: string; meaning: string; frequency: number; source: string; created_at: string; updated_at: string }>; count: number }>(`/jargon/list?limit=${limit ?? 200}`) }
export async function fetchJargonStats() { return request<{ success: boolean; stats: { total: number; recent_7d?: number } }>('/jargon/stats') }
export async function deleteJargon(id: number) { return request<{ success: boolean; message: string }>(`/jargon/delete?id=${id}`, { method: 'DELETE' }) }

// ── 背景管理 ──
export interface BackgroundItem {
  id: string
  name: string
  url: string
  created_at: number
}
export async function fetchBackgrounds() { return request<{ success: boolean; backgrounds: BackgroundItem[]; selected: string }>('/backgrounds') }
export async function uploadBackground(file: File, name?: string) {
  const fd = new FormData()
  fd.append('file', file)
  if (name) fd.append('name', name)
  return request<{ success: boolean; background?: BackgroundItem; error?: string }>('/backgrounds', { method: 'POST', body: fd })
}
export async function deleteBackground(id: string) { return request<{ success: boolean }>(`/backgrounds/${encodeURIComponent(id)}`, { method: 'DELETE' }) }
export async function selectBackground(id: string) { return request<{ success: boolean; selected: string }>('/backgrounds/select', { method: 'POST', body: JSON.stringify({ id }) }) }

// ── 表情包管理 ──
export interface EmojiItem {
  hash: string
  file_name: string
  description: string
  emotions: string[]
  query_count: number
  is_registered: boolean
}
export async function fetchEmojiList() { return request<{ success: boolean; count: number; emojis: EmojiItem[] }>('/emoji/list') }
export async function deleteEmoji(hash: string) { return request<{ success: boolean; message: string }>('/emoji/delete', { method: 'POST', body: JSON.stringify({ hash }) }) }
export async function cleanupEmojis() { return request<{ success: boolean; message: string; before_count: number; after_count: number; removed: number }>('/emoji/cleanup', { method: 'POST' }) }

// ── 瞳影 (TongShadow) ──
export async function fetchTongShadows() { return request<{ success: boolean; items: Array<{ id: string; image_hash: string; mime_type: string; description: string; created_at: string }>; count: number }>('/tong-shadow') }
export async function uploadTongShadow(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  return request<{ success: boolean; item: { id: string; image_hash: string; mime_type: string; description: string; created_at: string }; message: string }>('/tong-shadow', { method: 'POST', body: fd })
}
export async function deleteTongShadow(id: string) { return request<{ success: boolean; message: string }>(`/tong-shadow/${id}`, { method: 'DELETE' }) }
export function getTongShadowImageUrl(id: string) { return `/api/tong-shadow/${id}/image` }

// ── 本地聊天 ──
export async function sendLocalChat(content: string, history: Array<{ role: string; content: string }>) {
  return request<{ success: boolean; reply: string }>('/local-chat', {
    method: 'POST',
    body: JSON.stringify({ content, history }),
  })
}