export interface ApiResponse<T = unknown> {
  success: boolean
  error?: boolean
  message?: string
  data?: T
  [key: string]: unknown
}

export interface DashboardData {
  status: {
    running: boolean
    uptime: number
    memory_mb: number
  }
  plugins: {
    count: number
    list: Array<{ id: string; status: string }>
  }
  llm: {
    providers: number
    models: number
  }
  messages: {
    recent: Array<{
      id: string
      content: string
      sender: string
      direction: string
      group_id: string
      timestamp: number
    }>
    by_group: Record<string, Array<{
      id: string
      content: string
      sender: string
      direction: string
      group_id: string
      timestamp: number
    }>>
  }
  config: {
    nickname: string
    auto_reply: boolean
  }
  timestamp: number
}

export interface StatusData {
  running: boolean
  uptime: number
  start_time: string
  version: string
  go_version: string
  goroutines: number
  memory_mb: number
  num_cpu: number
}

export interface PluginInfo {
  id: string
  name: string
  version: string
  description: string
  author?: string
  type: string
  status: string
  tags?: string[]
  url?: string
  ipc_mode?: boolean
  icon?: string
}

export interface LLMConfig {
  api_providers: APIProvider[]
  models: ModelEntry[]
  model_task_config: ModelTaskConfig
  last_model_selection: Record<string, LastModelSelection>
}

export interface LastModelSelection {
  task_type: string
  model_name: string
  identifier: string
  provider: string
  time: number
}

export interface APIProvider {
  name: string
  base_url: string
  api_key: string
  client_type: string
  max_retry: number
  timeout: number
  retry_interval: number
}

export interface ModelEntry {
  name: string
  model_identifier: string
  api_provider: string
  price_in?: number
  price_out?: number
  force_stream_mode?: boolean
  temperature?: number
  max_tokens?: number
  extra_params?: Record<string, unknown>
  [key: string]: unknown
}

export interface ModelTaskConfig {
  replyer: TaskConfig
  planner: TaskConfig
  tool_use: TaskConfig
  vlm: TaskConfig
  voice: TaskConfig
  embedding: TaskConfig
}

export interface TaskConfig {
  model_list: string[]
  selection_strategy: string
  [key: string]: unknown
}

export interface TestConnectionResult {
  network_ok?: boolean
  api_key_valid?: boolean
  latency_ms?: number
  error?: string
  http_status?: number
}

export interface KnowledgeEntry {
  id: number
  content: string
  tags: string[]
  source: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  platform: string
  sender_id: string
  sender: string
  group_id: string
  group_name: string
  content: string
  direction: string
  is_at_me: boolean
  has_image: boolean
  reply_to_msg_id?: string
  timestamp: number
}

export interface RuleInfo {
  id: string
  name: string
  description: string
  enabled: boolean
  priority: number
  builtin?: boolean
  condition?: RuleCondition
  action?: RuleAction
}

export interface RuleCondition {
  keywords?: string[]
  sender_ids?: string[]
  time_range?: string
  is_at_me?: boolean
  has_image?: boolean
  regex?: string
}

export interface RuleAction {
  set_mood?: string
  set_reply_style?: string
  set_persona?: string
  trigger_plugin?: string
  send_reply?: string
}

export interface RuleCreateRequest {
  name: string
  description: string
  enabled: boolean
  priority: number
  condition: RuleCondition
  action: RuleAction
}

export interface MemoryHitDetail {
  fragment_id: string
  content: string
  score?: number
  source_kind: string
  session_id: string
  group_id: string
  user_id: string
  access_count: number
  created_at: string
  expires_at?: string
  metadata?: unknown
}

export interface MemoryDebugRequest {
  query: string
  session_id?: string
  group_id?: string
  limit?: number
  search_mode?: string
  source_kinds?: string[]
}

export interface MemoryDebugResult {
  success: boolean
  query: string
  search_mode?: string
  hits: MemoryHitDetail[]
  total_hits: number
  processing_ms?: number
}

export interface MemoryStats {
  success: boolean
  memory_fragments: number
  vector_entries: number
  index_entries: number
}

export interface MemoryIngestRequest {
  content: string
  session_id?: string
  group_id?: string
  user_id?: string
  source_kind?: string
}

export interface MemoryListResult {
  success: boolean
  data: MemoryHitDetail[]
  total: number
}

// ── 黑话/新词 ──
export interface JargonEntry {
  id: number
  word: string
  meaning: string
  frequency: number
  source: string
  created_at: string
  updated_at: string
}

// ── 瞳影 (TongShadow) ──
export interface TongShadowItem {
  id: string
  image_hash: string
  mime_type: string
  description: string
  created_at: string
}

// ── 本地聊天 ──
export interface LocalChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

export interface LocalChatRequest {
  content: string
  history: LocalChatHistoryItem[]
}

export interface LocalChatResponse {
  success: boolean
  reply: string
}

// ── 仪表盘统计 ──
export interface StatsData {
  success: boolean
  call_trend: Array<{ time: string; calls: number }>
  token_usage: Array<{ date: string; prompt_tokens: number; completion_tokens: number; total_tokens: number }>
  cost_trend: Array<{ time: string; cost: number }>
  total_calls: number
  total_cost: number
}

// ── 运行时指标 ──
export interface MetricsData {
  success: boolean
  llm: {
    calls_total: number
    calls_success: number
    calls_error: number
    tokens_in: number
    tokens_out: number
  }
  messages: {
    received: number
    processed: number
    deduped: number
    replied: number
  }
  pipeline: {
    latency_p50: number
    latency_p95: number
    latency_p99: number
  }
  memory: {
    queries: number
    deduped: number
    hits: number
  }
  plugins: {
    loaded: number
    total: number
    commands: number
  }
  circuit_breaker: string
}

// ── 健康检查 ──
export interface HealthComponent {
  status: string
  message: string
  latency?: string
}

export interface HealthData {
  status: string
  version: string
  uptime: string
  components: Record<string, HealthComponent>
  timestamp: number
}

// ── 管线事件（SSE 消息流） ──
export interface PipelineEvent {
  trace_id?: string
  type?: string
  stage?: string
  sender_id?: string
  content?: string
  group_id?: string
  should_reply?: boolean
  reply_content?: string
  total_ms?: number
  duration_ms?: number
  created_at?: number
  [key: string]: unknown
}