/**
 * MCP 工具调用指示器
 *
 * 企业级技术降维：Anthropic MCP (Model Context Protocol) → 个人 AI 助手工具调用
 *
 * 在聊天消息中展示 AI 调用了哪些"个人工具"：
 * - 日历查询、通讯录搜索、日记检索、关系图谱查询
 * - 每个工具调用显示名称、耗时、结果摘要
 */

import { useState } from 'react'
import {
  Calendar, Users, BookOpen, Network,
  ChevronDown, ChevronUp, Wrench, CheckCircle2,
  XCircle, Clock,
} from 'lucide-react'
import type { MCPToolCall } from '../lib/mcpProtocol'

// ─── 工具图标映射 ───────────────────────────────────────────
const SERVER_ICONS: Record<string, typeof Calendar> = {
  calendar: Calendar,
  contacts: Users,
  journal: BookOpen,
  relationships: Network,
}

const SERVER_LABELS: Record<string, string> = {
  calendar: '日历',
  contacts: '通讯录',
  journal: '日记',
  relationships: '关系图谱',
}

const TOOL_LABELS: Record<string, string> = {
  get_upcoming_events: '查询日程',
  find_free_time: '查找空闲时间',
  search_person: '搜索联系人',
  get_person_detail: '获取联系人详情',
  search_journal: '搜索日记',
  get_relationships: '查询关系',
  find_connection_path: '查找关系路径',
}

// ─── 单个工具调用徽章 ───────────────────────────────────────
function ToolCallBadge({ call }: { call: MCPToolCall }) {
  const Icon = SERVER_ICONS[call.tool.server] || Wrench
  const toolLabel = TOOL_LABELS[call.tool.name] || call.tool.name
  const serverLabel = SERVER_LABELS[call.tool.server] || call.tool.server

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zen-indigo/5 border border-zen-indigo/15"
      style={{
        animation: 'mcp-badge-in 0.3s ease-out both',
      }}
    >
      <Icon className="w-3 h-3 text-zen-indigo flex-shrink-0" />
      <span className="text-2xs text-ink-secondary font-medium">{toolLabel}</span>
      <span className="text-2xs text-ink-muted">·</span>
      <span className="text-2xs text-ink-tertiary">{serverLabel}</span>
      {call.success ? (
        <CheckCircle2 className="w-2.5 h-2.5 text-zen-sage flex-shrink-0" />
      ) : (
        <XCircle className="w-2.5 h-2.5 text-zen-rose flex-shrink-0" />
      )}
      {call.duration > 0 && (
        <span className="text-2xs text-ink-muted flex items-center gap-0.5">
          <Clock className="w-2 h-2" />
          {(call.duration / 1000).toFixed(1)}s
        </span>
      )}
    </div>
  )
}

// ─── 主组件 ─────────────────────────────────────────────────
interface MCPToolIndicatorProps {
  calls: MCPToolCall[]
}

export function MCPToolIndicator({ calls }: MCPToolIndicatorProps) {
  const [expanded, setExpanded] = useState(false)

  if (!calls || calls.length === 0) return null

  const successCount = calls.filter(c => c.success).length

  return (
    <div className="flex flex-col gap-1">
      {/* 折叠状态：紧凑徽章行 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 self-start px-2 py-1 rounded-lg bg-zen-indigo/5 border border-zen-indigo/15 hover:bg-zen-indigo/10 transition-colors"
      >
        <Wrench className="w-3 h-3 text-zen-indigo" />
        <span className="text-2xs text-ink-secondary font-medium">
          MCP 工具调用 · {calls.length} 个
        </span>
        <span className="text-2xs text-zen-sage">
          {successCount}/{calls.length} 成功
        </span>
        {expanded ? (
          <ChevronUp className="w-2.5 h-2.5 text-ink-muted" />
        ) : (
          <ChevronDown className="w-2.5 h-2.5 text-ink-muted" />
        )}
      </button>

      {/* 展开状态：详细列表 */}
      {expanded && (
        <div className="flex flex-wrap gap-1.5 pl-1">
          {calls.map((call) => (
            <ToolCallBadge key={call.id} call={call} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes mcp-badge-in {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
