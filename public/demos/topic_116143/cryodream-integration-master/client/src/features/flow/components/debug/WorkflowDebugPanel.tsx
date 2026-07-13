import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Bot,
  Braces,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleQuestionMark,
  Clock,
  DatabaseZap,
  File,
  FolderOpen,
  Globe,
  History,
  Loader2,
  MessageSquareReply,
  MessageSquareText,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  ScanSearch,
  Send,
  Text,
  TextCursorInput,
  Trash2,
  Webhook,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useFlowStore } from '../../stores/useFlowStore'
import { useFlowDebugStore } from '../../stores/useFlowDebugStore'
import type { DebugMessage, DebugRole, FlowRunResult } from '../../utils/runFlowAdapter'
import type { RunFlowStep } from '../../api/run-flow'
import type { CustomNode } from '../../types'

/** 节点类型 -> 图标组件 映射（与 nodeTemplates 保持一致） */
const nodeTypeIconMap: Record<string, LucideIcon> = {
  ChatInput: MessageSquareText,
  ChatOutput: MessageSquareReply,
  TextInput: TextCursorInput,
  TextOutput: Text,
  Webhook: Webhook,
  URL: Globe,
  APIRequest: Network,
  Directory: FolderOpen,
  File: File,
  SQLDatabase: DatabaseZap,
  EmbeddingModel: ScanSearch,
  PromptTemplate: Braces,
  MessageHistory: History,
  LanguageModel: Bot,
  Agent: Bot,
  ChatInputNode: MessageSquareText,
}

/** 节点类型 -> 中文显示名 映射（与 nodeTemplates display_name 保持一致，作为兜底） */
const nodeTypeDisplayNameMap: Record<string, string> = {
  ChatInput: '聊天输入',
  ChatOutput: '聊天输出',
  TextInput: '文本输入',
  TextOutput: '文本输出',
  Webhook: '网络回调',
  URL: '网页地址',
  APIRequest: '接口请求',
  Directory: '目录读取',
  File: '文件读取',
  SQLDatabase: '数据库查询',
  EmbeddingModel: '嵌入模型',
  PromptTemplate: '提示模板',
  MessageHistory: '消息历史',
  LanguageModel: '语言模型',
  Agent: '智能体',
  ParseData: '数据解析',
  KnowledgeBase: '知识库',
  FileUpload: '文件上传',
  DocumentLoader: '文档加载器',
  SplitText: '文本切分',
  CombineText: '文本合并',
  FilterData: '数据筛选',
  TransformData: '数据转换',
  IfElse: '条件分支',
  Loop: '循环',
  Pass: '直接传递',
  Calculator: '计算器',
  PythonFunction: 'Python 函数',
  JSONCleaner: 'JSON 清理器',
  SearchTool: '搜索工具',
  RetrieverTool: '检索工具',
  Chroma: 'Chroma 向量库',
  FAISS: 'FAISS 向量库',
}

/** 节点图标组件（避免在渲染期间创建组件） */
const NodeIcon = ({ type, className }: { type: string; className?: string }) => {
  const Icon = nodeTypeIconMap[type] ?? CircleQuestionMark
  return <Icon className={className} />
}

/** 从 CustomNode 提取节点类型和名称（优先 display_name，兜底类型映射，最后才用 ID） */
const getNodeMeta = (node: CustomNode): { type: string; name: string } => {
  const data = node.data as {
    type?: string
    node?: { type?: string; display_name?: string }
    label?: string
    displayName?: string
    name?: string
    title?: string
    text?: string
  }
  const type = data.type ?? data.node?.type ?? (typeof node.type === 'string' ? node.type : 'Unknown')
  // 优先级：node.display_name → label → displayName → 类型映射中文名 → title/text（便签/分组）→ ID
  const name =
    data.node?.display_name ??
    data.label ??
    data.displayName ??
    nodeTypeDisplayNameMap[type] ??
    data.title ??
    data.name ??
    node.id
  return { type, name }
}

const roleLabel: Record<DebugRole, string> = {
  user: '用户输入',
  assistant: '流程输出',
  system: '系统提示',
  error: '运行错误',
}

const roleIcon: Record<DebugRole, typeof MessageSquareText> = {
  user: MessageSquareText,
  assistant: Bot,
  system: MessageSquareText,
  error: CircleAlert,
}

const messageTone: Record<DebugRole, string> = {
  user: 'border-primary/20 bg-primary/5',
  assistant: 'border-border bg-background',
  system: 'border-border bg-muted/40',
  error: 'border-destructive/30 bg-destructive/5 text-destructive',
}

/* ------------------------------------------------------------------ */
/* 富文本渲染：识别代码块、加粗、行内代码、无序/有序列表、标题、引用       */
/* ------------------------------------------------------------------ */

interface RichTextProps {
  content: string
  className?: string
}

const RichText = memo(({ content, className }: RichTextProps) => {
  const blocks = useMemo(() => parseRichText(content), [content])
  return (
    <div className={cn('text-[13px] leading-6', className)}>
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return (
            <pre key={index} className="my-2 overflow-x-auto rounded-md border bg-muted/60 p-3 text-[12px] leading-5">
              {block.lang && <div className="mb-1 text-[10px] text-muted-foreground">{block.lang}</div>}
              <code className="font-mono">{block.text}</code>
            </pre>
          )
        }
        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul'
          return (
            <ListTag key={index} className={cn('my-1.5 flex flex-col gap-1 pl-5', block.ordered ? 'list-decimal' : 'list-disc')}>
              {block.items.map((item, i) => (
                <li key={i}>{renderInline(item)}</li>
              ))}
            </ListTag>
          )
        }
        if (block.type === 'heading') {
          const sizeClass =
            block.level >= 3 ? 'text-[13px] font-semibold' : block.level === 2 ? 'text-sm font-semibold' : 'text-base font-bold'
          return (
            <div key={index} className={cn('mt-2 mb-1', sizeClass)}>
              {renderInline(block.text)}
            </div>
          )
        }
        if (block.type === 'quote') {
          return (
            <blockquote key={index} className="my-1.5 border-l-2 border-border pl-3 text-muted-foreground">
              {block.lines.map((line, i) => (
                <div key={i}>{renderInline(line)}</div>
              ))}
            </blockquote>
          )
        }
        return (
          <p key={index} className="my-1.5 whitespace-pre-wrap break-words">
            {renderInline(block.text)}
          </p>
        )
      })}
    </div>
  )
})

type RichBlock =
  | { type: 'code'; text: string; lang?: string }
  | { type: 'list'; items: string[]; ordered: boolean }
  | { type: 'heading'; text: string; level: number }
  | { type: 'quote'; lines: string[] }
  | { type: 'paragraph'; text: string }

const parseRichText = (content: string): RichBlock[] => {
  const blocks: RichBlock[] = []
  const lines = content.split('\n')

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    const fenceMatch = line.match(/^```(\w*)/)
    if (fenceMatch) {
      const lang = fenceMatch[1] || undefined
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++
      blocks.push({ type: 'code', text: codeLines.join('\n'), lang })
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      blocks.push({ type: 'heading', text: headingMatch[2], level: headingMatch[1].length })
      i++
      continue
    }

    if (/^\s*>\s?/.test(line)) {
      const quoteLines: string[] = []
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''))
        i++
      }
      blocks.push({ type: 'quote', lines: quoteLines })
      continue
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ''))
        i++
      }
      blocks.push({ type: 'list', items, ordered: false })
      continue
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''))
        i++
      }
      blocks.push({ type: 'list', items, ordered: true })
      continue
    }

    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('```') &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i])
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paraLines.join('\n') })
    }
    if (i < lines.length && lines[i].trim() === '') {
      i++
    }
  }

  return blocks.length > 0 ? blocks : [{ type: 'paragraph', text: content }]
}

/** 行内渲染：**加粗**、`行内代码`、*斜体*。逐字符扫描，避免未闭合标记导致内容丢失 */
const renderInline = (text: string) => {
  const nodes: ReactNode[] = []
  let buffer = ''
  let nodeKey = 0

  const flushBuffer = () => {
    if (buffer) {
      nodes.push(<span key={nodeKey++}>{buffer}</span>)
      buffer = ''
    }
  }

  let j = 0
  while (j < text.length) {
    if (text[j] === '`') {
      const end = text.indexOf('`', j + 1)
      if (end !== -1) {
        flushBuffer()
        nodes.push(
          <code key={nodeKey++} className="rounded bg-muted px-1 py-px font-mono text-[12px]">
            {text.slice(j + 1, end)}
          </code>
        )
        j = end + 1
        continue
      }
    }
    if (text[j] === '*' && text[j + 1] === '*') {
      const end = text.indexOf('**', j + 2)
      if (end !== -1) {
        flushBuffer()
        nodes.push(
          <strong key={nodeKey++} className="font-semibold">
            {text.slice(j + 2, end)}
          </strong>
        )
        j = end + 2
        continue
      }
    }
    if (text[j] === '*' && text[j + 1] !== '*') {
      const end = text.indexOf('*', j + 1)
      if (end !== -1 && end > j + 1) {
        flushBuffer()
        nodes.push(
          <em key={nodeKey++} className="italic">
            {text.slice(j + 1, end)}
          </em>
        )
        j = end + 1
        continue
      }
    }
    buffer += text[j]
    j++
  }
  flushBuffer()
  return nodes
}

/* ------------------------------------------------------------------ */
/* 左侧：节点流（初始显示所有画布节点为灰色待执行，运行后更新状态）         */
/* ------------------------------------------------------------------ */

/** 节点状态：待执行 / 执行中 / 成功 / 失败 */
type NodeStatus = 'pending' | 'running' | 'success' | 'failed'

interface NodeFlowItem {
  nodeId: string
  nodeName: string
  nodeType: string
  status: NodeStatus
  elapsedMs?: number
  errorMessage?: string
  input?: Record<string, unknown>
  output?: Record<string, unknown>
}

/** 将画布节点与运行结果合并，生成节点流展示数据 */
const buildNodeFlowItems = (canvasNodes: CustomNode[], result: FlowRunResult | null): NodeFlowItem[] => {
  if (canvasNodes.length === 0) return []

  const stepMap = new Map<string, RunFlowStep>()
  if (result?.steps) {
    for (const step of result.steps) {
      stepMap.set(step.nodeId, step)
    }
  }

  return canvasNodes.map((node) => {
    const { type, name } = getNodeMeta(node)
    const step = stepMap.get(node.id)
    if (!step) {
      return { nodeId: node.id, nodeName: name, nodeType: type, status: 'pending' as NodeStatus }
    }
    return {
      nodeId: node.id,
      nodeName: step.nodeName || name,
      nodeType: step.nodeType || type,
      status: (step.status === 'SUCCESS' ? 'success' : 'failed') as NodeStatus,
      elapsedMs: step.elapsedMs,
      errorMessage: step.errorMessage ?? undefined,
      input: step.input ?? undefined,
      output: step.output ?? undefined,
    }
  })
}

/** 按拓扑层级分组（基于 edges），同层节点并排显示 */
const groupByLayer = (items: NodeFlowItem[], edges: { source: string; target: string }[]): NodeFlowItem[][] => {
  if (items.length === 0) return []

  const idSet = new Set(items.map((item) => item.nodeId))
  // 只考虑两端都在当前节点集内的边
  const inDegree = new Map<string, number>()
  items.forEach((item) => inDegree.set(item.nodeId, 0))
  edges.forEach((edge) => {
    if (idSet.has(edge.source) && idSet.has(edge.target)) {
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
    }
  })

  // Kahn 分层
  const layers: NodeFlowItem[][] = []
  const remaining = new Set(items.map((item) => item.nodeId))
  const itemMap = new Map(items.map((item) => [item.nodeId, item]))

  while (remaining.size > 0) {
    const layerIds: string[] = []
    remaining.forEach((id) => {
      if ((inDegree.get(id) ?? 0) === 0) {
        layerIds.push(id)
      }
    })
    if (layerIds.length === 0) {
      // 存在环，把剩余全部放入当前层
      remaining.forEach((id) => layerIds.push(id))
    }
    const layer = layerIds.map((id) => itemMap.get(id)!).filter(Boolean)
    layers.push(layer)
    layerIds.forEach((id) => {
      remaining.delete(id)
      edges.forEach((edge) => {
        if (edge.source === id && idSet.has(edge.target)) {
          inDegree.set(edge.target, Math.max(0, (inDegree.get(edge.target) ?? 0) - 1))
        }
      })
    })
  }

  return layers
}

interface NodeStepCardProps {
  item: NodeFlowItem
}

const NodeStepCard = memo(({ item }: NodeStepCardProps) => {
  const [expanded, setExpanded] = useState(false)

  const statusConfig: Record<NodeStatus, { icon: typeof CheckCircle2; color: string; border: string; dot: string }> = {
    pending: { icon: Clock, color: 'text-muted-foreground', border: 'border-border', dot: 'bg-muted-foreground/30' },
    running: { icon: Loader2, color: 'text-blue-500', border: 'border-blue-500/40', dot: 'bg-blue-500' },
    success: { icon: CheckCircle2, color: 'text-emerald-500', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
    failed: { icon: XCircle, color: 'text-destructive', border: 'border-destructive/40', dot: 'bg-destructive' },
  }
  const config = statusConfig[item.status]
  const StatusIcon = config.icon
  const isAnimated = item.status === 'running'

  const inputEntries = Object.entries(item.input ?? {})
  const outputEntries = Object.entries(item.output ?? {})
  const hasDetails = inputEntries.length > 0 || outputEntries.length > 0

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '空'
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col rounded-md border bg-background px-2 py-1.5 transition-all',
        config.border,
        item.status === 'pending' && 'opacity-60',
        item.status !== 'pending' && 'shadow-sm'
      )}
    >
      <div className="flex items-center gap-1.5">
        <div className={cn('flex size-4 shrink-0 items-center justify-center rounded', item.status === 'pending' ? 'bg-muted/40' : 'bg-muted/60')}>
          <NodeIcon type={item.nodeType} className="size-2.5 text-foreground" />
        </div>
        <span className="min-w-0 flex-1 text-[11px] font-medium leading-4">{item.nodeName}</span>
        <StatusIcon className={cn('size-3 shrink-0', config.color, isAnimated && 'animate-spin')} />
      </div>

      {item.status !== 'pending' && (
        <div className="mt-0.5 flex items-center gap-2 text-[9px] text-muted-foreground">
          {typeof item.elapsedMs === 'number' && <span>{item.elapsedMs}ms</span>}
          {hasDetails && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-0.5 transition-colors hover:text-foreground"
            >
              {expanded ? <ChevronDown className="size-2.5" /> : <ChevronRight className="size-2.5" />}
              详情
            </button>
          )}
        </div>
      )}

      {item.errorMessage && (
        <div className="mt-1 rounded bg-destructive/5 px-1.5 py-0.5 text-[9px] leading-3 text-destructive">{item.errorMessage}</div>
      )}

      {expanded && hasDetails && (
        <div className="mt-1 flex flex-col gap-1 border-t pt-1">
          {inputEntries.length > 0 && (
            <div>
              <div className="mb-0.5 text-[9px] font-medium text-muted-foreground">输入</div>
              <div className="flex flex-col gap-0.5">
                {inputEntries.map(([key, value]) => (
                  <div key={key} className="rounded bg-muted/40 px-1 py-0.5">
                    <div className="text-[9px] font-medium text-muted-foreground">{key}</div>
                    <pre className="mt-0.5 max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono text-[9px] leading-3">
                      {formatValue(value)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
          {outputEntries.length > 0 && (
            <div>
              <div className="mb-0.5 text-[9px] font-medium text-emerald-600">输出</div>
              <div className="flex flex-col gap-0.5">
                {outputEntries.map(([key, value]) => (
                  <div key={key} className="rounded bg-emerald-500/5 px-1 py-0.5">
                    <div className="text-[9px] font-medium text-emerald-600">{key}</div>
                    <pre className="mt-0.5 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-[9px] leading-3">
                      {formatValue(value)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

interface NodeFlowPanelProps {
  items: NodeFlowItem[]
  layers: NodeFlowItem[][]
  result: FlowRunResult | null
  isRunning: boolean
}

const NodeFlowPanel = memo(({ items, layers, result, isRunning }: NodeFlowPanelProps) => {
  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-[11px] text-muted-foreground">
        画布暂无节点，请先在编辑器中添加组件。
      </div>
    )
  }

  const successCount = items.filter((item) => item.status === 'success').length
  const failedCount = items.filter((item) => item.status === 'failed').length
  const pendingCount = items.filter((item) => item.status === 'pending').length

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-1 p-2.5">
        {/* 运行概览 */}
        <div className="mb-1.5 flex items-center justify-between rounded-md border bg-muted/20 px-2 py-1">
          <div className="flex items-center gap-1.5">
            {result ? (
              <Badge
                variant="outline"
                className={cn(
                  'h-4 rounded px-1 text-[9px] font-medium',
                  result.status === 'SUCCESS'
                    ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600'
                    : 'border-destructive/30 bg-destructive/5 text-destructive'
                )}
              >
                {result.status === 'SUCCESS' ? '成功' : '失败'}
              </Badge>
            ) : (
              <Badge variant="outline" className="h-4 rounded px-1 text-[9px] font-medium text-muted-foreground">
                待运行
              </Badge>
            )}
            <span className="text-[9px] text-muted-foreground">
              {successCount > 0 && <span className="text-emerald-600">{successCount} 成功</span>}
              {successCount > 0 && failedCount > 0 && ' · '}
              {failedCount > 0 && <span className="text-destructive">{failedCount} 失败</span>}
              {(successCount > 0 || failedCount > 0) && pendingCount > 0 && ' · '}
              {pendingCount > 0 && <span>{pendingCount} 待执行</span>}
              {successCount === 0 && failedCount === 0 && pendingCount === 0 && `${items.length} 节点`}
            </span>
          </div>
          {result?.runId && (
            <span className="font-mono text-[9px] text-muted-foreground">{result.runId.slice(0, 8)}</span>
          )}
        </div>

        {/* 节点流：自上而下，同层并排 */}
        {layers.map((layer, layerIndex) => (
          <div key={layerIndex} className="flex flex-col">
            {layerIndex > 0 && (
              <div className="flex justify-center py-0.5" aria-hidden>
                <div className="h-3 w-px bg-border" />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              {layer.map((item) => (
                <NodeStepCard key={item.nodeId} item={item} />
              ))}
            </div>
            {layer.length > 1 && <div className="mt-0.5 text-center text-[9px] text-muted-foreground">同层并行</div>}
          </div>
        ))}

        {isRunning && (
          <div className="mt-2 flex items-center justify-center gap-1.5 rounded-md border border-blue-500/20 bg-blue-500/5 py-1.5 text-[10px] text-blue-600">
            <Loader2 className="size-3 animate-spin" />
            正在执行工作流...
          </div>
        )}
      </div>
    </ScrollArea>
  )
})

/* ------------------------------------------------------------------ */
/* 右侧：实际回答区域                                                    */
/* ------------------------------------------------------------------ */

const DebugMessageItem = memo(({ message }: { message: DebugMessage }) => {
  const Icon = roleIcon[message.role]
  const [showSteps, setShowSteps] = useState(true)
  
  return (
    <div className={cn('rounded-lg border p-3', messageTone[message.role])}>
      <div className="mb-1.5 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
        <Icon className="size-3.5" />
        <span>{roleLabel[message.role]}</span>
        <span className="ms-auto text-[10px]">{new Date(message.createdAt).toLocaleTimeString()}</span>
      </div>
      
      {/* 显示执行步骤 */}
      {message.runResult?.steps && message.runResult.steps.length > 0 && (
        <div className="mb-2 rounded-md border bg-muted/20 p-2">
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="flex w-full items-center justify-between text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <span>执行步骤 ({message.runResult.steps.length})</span>
            {showSteps ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </button>
          
          {showSteps && (
            <div className="mt-2 flex flex-col gap-1.5">
              {message.runResult.steps.map((step, index) => {
                const isSuccess = step.status === 'SUCCESS'
                const StatusIcon = isSuccess ? CheckCircle2 : XCircle
                const statusColor = isSuccess ? 'text-emerald-500' : 'text-destructive'
                
                return (
                  <div key={step.nodeId} className="rounded border bg-background p-2 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <StatusIcon className={cn('size-3 shrink-0', statusColor)} />
                      <span className="font-medium">{index + 1}. {step.nodeName}</span>
                      <span className={cn('ms-auto text-[10px]', statusColor)}>
                        {step.status}
                        {step.elapsedMs !== undefined && ` (${step.elapsedMs}ms)`}
                      </span>
                    </div>
                    
                    {step.errorMessage && (
                      <div className="mt-1 rounded bg-destructive/5 px-1.5 py-0.5 text-[10px] text-destructive">
                        错误: {step.errorMessage}
                      </div>
                    )}
                    
                    {/* 显示输入输出 */}
                    {(step.input || step.output) && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
                          查看输入/输出
                        </summary>
                        <div className="mt-1 space-y-1">
                          {step.input && Object.keys(step.input).length > 0 && (
                            <div>
                              <div className="text-[9px] font-medium text-muted-foreground">输入:</div>
                              <pre className="mt-0.5 max-h-20 overflow-auto rounded bg-muted/40 p-1 text-[9px] leading-3">
                                {JSON.stringify(step.input, null, 2)}
                              </pre>
                            </div>
                          )}
                          {step.output && Object.keys(step.output).length > 0 && (
                            <div>
                              <div className="text-[9px] font-medium text-emerald-600">输出:</div>
                              <pre className="mt-0.5 max-h-20 overflow-auto rounded bg-emerald-500/5 p-1 text-[9px] leading-3">
                                {JSON.stringify(step.output, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
      
      {/* 显示错误信息 */}
      {message.runResult?.errorMessage && (
        <div className="mb-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-[11px] text-destructive">
          <div className="font-medium">执行失败</div>
          <div className="mt-1">{message.runResult.errorMessage}</div>
        </div>
      )}
      
      {/* 显示主要内容 */}
      {message.role === 'assistant' || message.role === 'error' ? (
        <RichText content={message.content} />
      ) : (
        <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-5">{message.content}</pre>
      )}
      
      {/* 显示运行状态 */}
      {message.runResult && (
        <div className="mt-2 flex items-center gap-2 border-t pt-2 text-[10px] text-muted-foreground">
          <Badge
            variant="outline"
            className={cn(
              'h-4 rounded px-1 text-[9px] font-medium',
              message.runResult.status === 'SUCCESS'
                ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600'
                : 'border-destructive/30 bg-destructive/5 text-destructive'
            )}
          >
            {message.runResult.status === 'SUCCESS' ? '成功' : '失败'}
          </Badge>
          <span>来源: {message.runResult.source === 'remote' ? '后端执行' : '本地模拟'}</span>
          {message.runResult.runId && <span className="font-mono">ID: {message.runResult.runId.slice(0, 8)}</span>}
        </div>
      )}

      {/* 显示结构化输出参数 */}
      {message.runResult?.outputs && Object.keys(message.runResult.outputs).length > 0 && (
        <div className="mt-2 rounded-md border bg-muted/20 p-2">
          <div className="text-[10px] font-medium text-muted-foreground">输出参数</div>
          <div className="mt-1 flex flex-col gap-1">
            {Object.entries(message.runResult.outputs).map(([key, value]) => (
              <div key={key} className="rounded bg-background px-1.5 py-1">
                <div className="text-[10px] font-medium text-emerald-600">{key}</div>
                <pre className="mt-0.5 max-h-24 overflow-auto whitespace-pre-wrap break-words font-mono text-[9px] leading-3">
                  {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

interface AnswerPanelProps {
  messages: DebugMessage[]
  isRunning: boolean
}

const AnswerPanel = memo(({ messages, isRunning }: AnswerPanelProps) => {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, isRunning])

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2.5 p-3">
        {messages.map((message) => (
          <DebugMessageItem key={message.id} message={message} />
        ))}
        {isRunning && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-[13px] text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            正在执行当前工作流...
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
})

/* ------------------------------------------------------------------ */
/* 主面板：左右分栏                                                      */
/* ------------------------------------------------------------------ */

/** 从 ObjectInput 节点的 PromptTemplate 下游推断参数字段 */
const extractObjectInputFields = (nodes: CustomNode[]): { key: string; label: string; type: string; placeholder?: string; order?: number }[] => {
  // 找 ObjectInput 节点
  const objInput = nodes.find((n) => {
    const data = n.data as { type?: string } | null
    return data?.type === 'ObjectInput'
  })
  if (!objInput) return []

  // 找 PromptTemplate 节点，从模板中提取 {{变量名}}
  const ptNode = nodes.find((n) => {
    const data = n.data as { type?: string } | null
    return data?.type === 'PromptTemplate'
  })
  if (!ptNode) return []

  const ptData = ptNode.data as { node?: { template?: { template?: { value?: string } } } } | null
  const template = ptData?.node?.template?.template?.value ?? ''
  const varRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g
  const fields: { key: string; label: string; type: string; placeholder?: string }[] = []
  let match: RegExpExecArray | null
  const seen = new Set<string>()
  while ((match = varRegex.exec(template)) !== null) {
    const key = match[1]
    if (seen.has(key)) continue
    seen.add(key)
    // 根据变量名推断类型和标签
    const labelMap: Record<string, { label: string; type: string; placeholder: string; order: number }> = {
      full_lyrics: { label: '原歌词', type: 'textarea', placeholder: '粘贴完整歌词', order: 1 },
      selected_text: { label: '修改的部分', type: 'text', placeholder: '要改写的歌词片段', order: 2 },
      instruction: { label: '要求', type: 'text', placeholder: '如：更有画面感、适合副歌重复', order: 3 },
      input: { label: '输入', type: 'text', placeholder: '', order: 99 },
    }
    const preset = labelMap[key]
    fields.push({
      key,
      label: preset?.label ?? key,
      type: preset?.type ?? 'text',
      placeholder: preset?.placeholder,
      order: preset?.order ?? 50,
    })
  }
  // 按预设顺序排列
  fields.sort((a, b) => (a.order ?? 50) - (b.order ?? 50))
  return fields
}

/** 获取入口节点类型 */
const getEntryNodeType = (nodes: CustomNode[]): 'ObjectInput' | 'ChatInput' | null => {
  const objInput = nodes.find((n) => (n.data as { type?: string } | null)?.type === 'ObjectInput')
  if (objInput) return 'ObjectInput'
  const chatInput = nodes.find((n) => (n.data as { type?: string } | null)?.type === 'ChatInput')
  if (chatInput) return 'ChatInput'
  return null
}

const WorkflowDebugPanel = () => {
  const { nodes, edges } = useFlowStore()
  const { isRunning, inputValue, messages, lastRunResult, setInputValue, clearMessages, runCurrentFlow } =
    useFlowDebugStore()
  const [showNodeFlow, setShowNodeFlow] = useState(true)

  // 入口节点类型和 ObjectInput 参数字段
  const entryType = useMemo(() => getEntryNodeType(nodes), [nodes])
  const objFields = useMemo(() => extractObjectInputFields(nodes), [nodes])

  // ObjectInput 模式下的字段值
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})

  // 合并画布节点与运行结果，生成节点流展示数据
  const items = useMemo(() => buildNodeFlowItems(nodes, lastRunResult), [nodes, lastRunResult])
  const layers = useMemo(() => groupByLayer(items, edges), [items, edges])

  const handleSubmit = useCallback(() => {
    let finalInput: string
    if (entryType === 'ObjectInput' && objFields.length > 0) {
      // ObjectInput 模式：从字段值构造 JSON
      const obj: Record<string, string> = {}
      for (const field of objFields) {
        obj[field.key] = fieldValues[field.key] ?? ''
      }
      finalInput = JSON.stringify(obj)
    } else {
      finalInput = inputValue
    }
    void runCurrentFlow(finalInput)
  }, [entryType, objFields, fieldValues, inputValue, runCurrentFlow])

  return (
    <aside className="flex min-h-0 flex-1 flex-col bg-background">
      {/* 顶部工具栏 */}
      <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b px-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={() => setShowNodeFlow((v) => !v)}
            title={showNodeFlow ? '隐藏节点流' : '显示节点流'}
          >
            {showNodeFlow ? <PanelLeftClose className="size-3.5" /> : <PanelLeftOpen className="size-3.5" />}
          </Button>
          <div className="flex items-center gap-1.5 text-[13px] font-semibold">
            <Bot className="size-3.5" />
            调试运行
          </div>
        </div>
        <Button size="icon" variant="ghost" className="size-7" onClick={clearMessages} title="清空调试消息">
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* 左右分栏内容区 */}
      <div className="flex min-h-0 flex-1">
        {showNodeFlow && (
          <div className="flex w-72 shrink-0 flex-col border-r bg-muted/10">
            <div className="flex h-7 shrink-0 items-center border-b px-2.5 text-[10px] font-medium text-muted-foreground">
              执行节点流
            </div>
            <div className="min-h-0 flex-1">
              <NodeFlowPanel items={items} layers={layers} result={lastRunResult} isRunning={isRunning} />
            </div>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <AnswerPanel messages={messages} isRunning={isRunning} />
          </div>
        </div>
      </div>

      {/* 底部输入区：根据入口节点类型显示不同 UI */}
      <div className="shrink-0 border-t bg-background p-2.5">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-1.5 rounded-lg border bg-muted/30 p-1.5 shadow-sm">
          {entryType === 'ObjectInput' && objFields.length > 0 ? (
            /* ObjectInput 结构化参数输入 */
            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto p-1">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Braces className="size-3" />
                对象输入参数
              </div>
              {objFields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1">
                  <Label className="text-[11px] text-muted-foreground">{field.label}</Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      value={fieldValues[field.key] ?? ''}
                      onChange={(e) => setFieldValues((v) => ({ ...v, [field.key]: e.target.value }))}
                      disabled={isRunning}
                      placeholder={field.placeholder}
                      className="max-h-24 min-h-12 resize-none border bg-background text-[13px]"
                    />
                  ) : (
                    <Input
                      value={fieldValues[field.key] ?? ''}
                      onChange={(e) => setFieldValues((v) => ({ ...v, [field.key]: e.target.value }))}
                      disabled={isRunning}
                      placeholder={field.placeholder}
                      className="h-8 border bg-background text-[13px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                          e.preventDefault()
                          handleSubmit()
                        }
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* ChatInput 纯文本输入 */
            <Textarea
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  handleSubmit()
                }
              }}
              disabled={isRunning}
              placeholder="输入内容，Enter 运行 · Shift+Enter 换行"
              className="max-h-32 min-h-14 resize-none overflow-y-auto border-0 bg-transparent text-[13px] shadow-none focus-visible:ring-0"
            />
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground">
              {entryType === 'ObjectInput' ? 'JSON 对象输入模式' : '接口不可用时自动切换本地模拟'}
            </span>
            <Button size="sm" onClick={handleSubmit} disabled={isRunning} className="h-7 shrink-0 px-3">
              {isRunning ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Send data-icon="inline-start" />}
              运行
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default WorkflowDebugPanel
