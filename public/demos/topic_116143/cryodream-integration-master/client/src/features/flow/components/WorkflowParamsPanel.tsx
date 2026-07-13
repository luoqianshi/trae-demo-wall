import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useFlowStore } from '@/features/flow/stores/useFlowStore'
import { getModelDisplayName, getModelSelectOptions } from '@/features/model-config/model-config-store'
import { getDocumentSelectOptions, getKnowledgeBaseSelectOptions, getKnowledgeBaseDisplayName } from '@/features/flow/utils/document-options'
import { ArrowDownToLine, ArrowUpFromLine, ChevronDown, Code2, Cog, FileText, Info, MessageSquare, Pencil, Sparkles } from 'lucide-react'
import type { GenericNodeData, TemplateField } from '@/features/flow/types'

// ── Types ──────────────────────────────────────────────────────────────────────

interface WorkflowParamsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodes: Array<{
    id: string
    data: {
      type: string
      node?: {
        display_name?: string
        description?: string
        category?: string
        template?: Record<string, TemplateField>
        outputs?: Array<{ name: string; display_name: string; types: string[] }>
      }
    }
  }>
  edges: Array<{ source: string; sourceHandle?: string | null; target: string; targetHandle?: string | null }>
}

interface ParamEntry {
  /** 变量名（字段 name） */
  key: string
  /** 字段定义 */
  field: TemplateField
  /** 所属节点 */
  nodeId: string
  /** 所属节点类型 */
  nodeType: string
  /** 节点显示名 */
  nodeDisplayName: string
  /** 参数分类：input / config / output */
  category: 'input' | 'config' | 'output'
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const categoryIcon: Record<string, string> = {
  input_output: 'MessageSquare',
  data_source: 'FileText',
  models_and_agents: 'Sparkles',
  files_and_knowledge: 'FileText',
  processing: 'Cog',
  flow_controls: 'Code2',
  utilities: 'Info',
  tools: 'Pencil',
  vectorstores: 'Database',
}

const getNodeIcon = (nodeType: string, category?: string) => {
  if (nodeType === 'ChatInput') return MessageSquare
  if (nodeType === 'ChatOutput') return ArrowUpFromLine
  if (nodeType === 'LanguageModel') return Sparkles
  if (nodeType === 'PromptTemplate') return FileText
  const icon = categoryIcon[category ?? ''] ?? 'Info'
  const map: Record<string, React.ComponentType<{ className?: string }>> = {
    MessageSquare, ArrowUpFromLine, Sparkles, FileText, Cog, Code2, Info, Pencil,
  }
  return map[icon] ?? Info
}

const getFieldOptions = (field: TemplateField) => {
  if (field.options?.length) return field.options
  if (field.type === 'model_config') return getModelSelectOptions(field.modelType)
  if (field.type === 'knowledge_base') return getKnowledgeBaseSelectOptions()
  if (field.type === 'document') return getDocumentSelectOptions()
  if (field.type === 'bool') return ['true', 'false']
  return []
}

const getFieldOptionLabel = (field: TemplateField, optionValue: string) => {
  if (field.type === 'model_config') return getModelDisplayName(optionValue)
  if (field.type === 'knowledge_base') return getKnowledgeBaseDisplayName(optionValue)
  return optionValue
}

const stringifyValue = (value: unknown) => {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

const parseValue = (field: TemplateField, value: string) => {
  if (field.type === 'int') return Number.parseInt(value || '0', 10)
  if (field.type === 'float') return Number.parseFloat(value || '0')
  if (field.type === 'bool') return value === 'true'
  return value
}

const typeColorMap: Record<string, string> = {
  string: 'bg-sky-50 text-sky-700 border-sky-200',
  str: 'bg-sky-50 text-sky-700 border-sky-200',
  float: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  int: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  number: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Data: 'bg-violet-50 text-violet-700 border-violet-200',
  Message: 'bg-amber-50 text-amber-700 border-amber-200',
  Text: 'bg-sky-50 text-sky-700 border-sky-200',
  model_config: 'bg-rose-50 text-rose-700 border-rose-200',
  prompt: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  bool: 'bg-orange-50 text-orange-700 border-orange-200',
}

const getTypeBadge = (type: string) => {
  const cls = typeColorMap[type] || 'bg-muted text-muted-foreground border-border'
  return (
    <Badge variant='outline' className={`font-mono text-[10px] px-1.5 py-0 leading-none ${cls}`}>
      {type}
    </Badge>
  )
}

/** 判断字段是否为可配置项（模板内固定配置，非运行时输入） */
const isConfigField = (field: TemplateField) =>
  field.type === 'model_config' ||
  field.type === 'knowledge_base' ||
  field.type === 'document' ||
  field.name === 'template' ||
  field.name === 'system_message' ||
  field.name === 'chunk_size' ||
  field.name === 'overlap_size' ||
  field.name === 'selected_text' ||
  field.name === 'expected_format'

/** 判断字段是否应由连线输入（有 input_types 且 value 为空） */
const isWiredField = (field: TemplateField) =>
  (field.input_types?.length ?? 0) > 0 && !stringifyValue(field.value)

// ── Component ─────────────────────────────────────────────────────────────────

const WorkflowParamsPanel = ({ open, onOpenChange, nodes, edges }: WorkflowParamsPanelProps) => {
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  // 默认只展开 PromptTemplate 节点，其他折叠
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})

  // 分析所有节点并分类参数
  const nodeParamsMap = useMemo(() => {
    const hasIncoming = new Set(edges.map((e) => e.target))
    const hasOutgoing = new Set(edges.map((e) => e.source))

    const result: Array<{
      nodeId: string
      nodeType: string
      nodeDisplayName: string
      description: string
      category: string
      isInput: boolean
      isOutput: boolean
      params: ParamEntry[]
      outputs: Array<{ name: string; display_name: string; types: string[] }>
    }> = []

    for (const node of nodes) {
      const nodeDef = node.data.node
      if (!nodeDef) continue

      const isInput = !hasIncoming.has(node.id)
      const isOutput = !hasOutgoing.has(node.id)
      const template = nodeDef.template || {}
      const params: ParamEntry[] = []

      for (const [key, field] of Object.entries(template)) {
        // 跳过 tools 字段
        if (field.type === 'tools') continue

        let category: ParamEntry['category'] = 'config'
        // 有 input_types 且由连线输入的字段 → input
        if (isWiredField(field) && (field.input_types?.length ?? 0) > 0) {
          category = 'input'
        }
        // ChatInput 节点的非配置字段 → input
        else if (isInput && !isConfigField(field)) {
          category = 'input'
        }
        // 明确的配置字段 → config
        else if (isConfigField(field)) {
          category = 'config'
        }
        // 输出节点 → output
        else if (isOutput) {
          category = 'output'
        }

        params.push({
          key,
          field,
          nodeId: node.id,
          nodeType: node.data.type,
          nodeDisplayName: nodeDef.display_name || node.data.type,
          category,
        })
      }

      result.push({
        nodeId: node.id,
        nodeType: node.data.type,
        nodeDisplayName: nodeDef.display_name || node.data.type,
        description: nodeDef.description || '',
        category: nodeDef.category || '',
        isInput,
        isOutput,
        params,
        outputs: nodeDef.outputs || [],
      })
    }

    // 输入节点在前，输出在后，处理节点中间
    result.sort((a, b) => {
      if (a.isInput && !b.isInput) return -1
      if (!a.isInput && b.isInput) return 1
      if (a.isOutput && !b.isOutput) return 1
      if (!a.isOutput && b.isOutput) return -1
      return 0
    })

    return result
  }, [nodes, edges])

  // 字段值修改
  const handleFieldChange = (nodeId: string, key: string, field: TemplateField, value: string) => {
    // 从 nodes prop 中找到对应节点，构建更新数据
    const node = nodes.find((n) => n.id === nodeId)
    if (!node?.data.node) return
    const component = node.data.node
    updateNodeData(nodeId, {
      node: {
        ...component,
        template: {
          ...component.template,
          [key]: { ...field, value: parseValue(field, value) },
        },
      },
    } as Partial<GenericNodeData>)
  }

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-[540px] sm:max-w-[640px] p-0'>
        <SheetHeader className='px-5 pt-5 pb-3 border-b'>
          <SheetTitle className='flex items-center gap-2 text-base'>
            <Info className='size-4 text-primary' />
            工作流参数
          </SheetTitle>
          <SheetDescription className='text-xs text-muted-foreground mt-0.5'>
            查看和编辑工作流的输入、输出及节点配置参数
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className='h-[calc(100vh-100px)]'>
          <div className='flex flex-col gap-1.5 p-4'>
            {/* ── 按节点分组的参数列表 ── */}
            <div className='text-[11px] font-medium text-muted-foreground px-1 mb-1'>节点配置</div>
            <div className='flex flex-col gap-1.5'>
              {nodeParamsMap.map((nodeInfo) => {
                const Icon = getNodeIcon(nodeInfo.nodeType, nodeInfo.category)
                const isOpen = expandedNodes[nodeInfo.nodeId] ?? (nodeInfo.nodeType === 'PromptTemplate')
                const configParams = nodeInfo.params.filter((p) => p.category === 'config')
                const inputNodeParams = nodeInfo.params.filter((p) => p.category === 'input')
                const hasParams = nodeInfo.params.length > 0

                return (
                  <Collapsible
                    key={nodeInfo.nodeId}
                    open={isOpen}
                    onOpenChange={() => toggleNode(nodeInfo.nodeId)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant='ghost'
                        className='w-full justify-between h-7 px-2 rounded-md hover:bg-muted/60'
                      >
                        <div className='flex items-center gap-1.5'>
                          <Icon className='size-3.5 text-muted-foreground' />
                          <span className='text-xs font-medium'>{nodeInfo.nodeDisplayName}</span>
                          <span className='text-[10px] text-muted-foreground font-mono'>({nodeInfo.nodeType})</span>
                          {nodeInfo.isInput && (
                            <Badge variant='outline' className='text-[9px] px-1 py-0 border-sky-200 text-sky-700 bg-sky-50/50'>
                              输入
                            </Badge>
                          )}
                          {nodeInfo.isOutput && (
                            <Badge variant='outline' className='text-[9px] px-1 py-0 border-emerald-200 text-emerald-700 bg-emerald-50/50'>
                              输出
                            </Badge>
                          )}
                        </div>
                        <ChevronDown className={`size-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className='pl-3 pr-1 pb-2 flex flex-col gap-2'>
                        {/* 节点描述 */}
                        {nodeInfo.description && (
                          <p className='text-[11px] text-muted-foreground pl-8 leading-relaxed'>
                            {nodeInfo.description}
                          </p>
                        )}

                        {/* 输入参数（连线输入的） */}
                        {inputNodeParams.length > 0 && (
                          <div className='pl-8'>
                            <div className='text-[10px] font-medium text-sky-600 mb-1.5 flex items-center gap-1'>
                              <ArrowDownToLine className='size-3' />
                              输入参数
                            </div>
                            <div className='flex flex-col gap-1'>
                              {inputNodeParams.map((p) => (
                                <div key={p.key} className='flex items-center gap-2 rounded-md border border-dashed bg-sky-50/30 px-2.5 py-1.5'>
                                  <code className='text-[11px] font-semibold font-mono text-foreground'>{p.key}</code>
                                  {getTypeBadge(p.field.type)}
                                  {p.field.required && (
                                    <Badge variant='destructive' className='text-[9px] px-1 py-0 leading-none'>必填</Badge>
                                  )}
                                  <span className='text-[10px] text-muted-foreground ml-auto truncate max-w-[120px]'>
                                    {p.field.info || p.field.display_name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 可配置参数 */}
                        {configParams.length > 0 && (
                          <div className='pl-8'>
                            <div className='text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1'>
                              <Cog className='size-3' />
                              配置参数
                            </div>
                            <div className='flex flex-col gap-2'>
                              {configParams.map((p) => {
                                const options = getFieldOptions(p.field)
                                const value = stringifyValue(p.field.value)
                                return (
                                  <div key={p.key} className='flex flex-col gap-1 rounded-md border bg-card px-2.5 py-2'>
                                    {/* 参数标题行 */}
                                    <div className='flex items-center gap-1.5'>
                                      <code className='text-[11px] font-semibold font-mono'>{p.key}</code>
                                      {getTypeBadge(p.field.type)}
                                      {p.field.required && (
                                        <Badge variant='destructive' className='text-[9px] px-1 py-0 leading-none'>必填</Badge>
                                      )}
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className='text-[10px] text-muted-foreground ml-auto truncate max-w-[100px] cursor-help'>
                                            {p.nodeDisplayName}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side='top' className='text-xs'>
                                          来自节点：{p.nodeDisplayName}（{p.nodeType}）
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                    {/* 参数说明 */}
                                    {p.field.info && (
                                      <p className='text-[10px] text-muted-foreground leading-relaxed'>
                                        {p.field.info}
                                      </p>
                                    )}
                                    {/* 可编辑值 */}
                                    {options.length > 0 ? (
                                      <Select
                                        value={value || options[0]}
                                        onValueChange={(v) => handleFieldChange(p.nodeId, p.key, p.field, v)}
                                      >
                                        <SelectTrigger className='h-7 rounded-md bg-muted/30 text-xs border-dashed'>
                                          <SelectValue>
                                            {getFieldOptionLabel(p.field, value || options[0])}
                                          </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectGroup>
                                            {options.map((opt) => (
                                              <SelectItem key={opt} value={opt} className='text-xs'>
                                                {getFieldOptionLabel(p.field, opt)}
                                              </SelectItem>
                                            ))}
                                          </SelectGroup>
                                        </SelectContent>
                                      </Select>
                                    ) : p.nodeType === 'PromptTemplate' && p.field.name === 'template' ? (
                                      <Textarea
                                        value={value}
                                        onChange={(e) => handleFieldChange(p.nodeId, p.key, p.field, e.target.value)}
                                        rows={5}
                                        className='rounded-md bg-muted/30 text-xs border-dashed'
                                      />
                                    ) : value.length > 80 ? (
                                      <Textarea
                                        value={value}
                                        onChange={(e) => handleFieldChange(p.nodeId, p.key, p.field, e.target.value)}
                                        rows={3}
                                        className='rounded-md bg-muted/30 text-xs border-dashed min-h-[60px]'
                                      />
                                    ) : (
                                      <Input
                                        value={value}
                                        onChange={(e) => handleFieldChange(p.nodeId, p.key, p.field, e.target.value)}
                                        className='h-7 rounded-md bg-muted/30 text-xs border-dashed'
                                      />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* 输出参数 */}
                        {nodeInfo.isOutput && nodeInfo.outputs.length > 0 && (
                          <div className='pl-8'>
                            <div className='text-[10px] font-medium text-emerald-600 mb-1.5 flex items-center gap-1'>
                              <ArrowUpFromLine className='size-3' />
                              输出参数
                            </div>
                            <div className='flex flex-col gap-1'>
                              {nodeInfo.outputs.map((out) => (
                                <div key={out.name} className='flex items-center gap-2 rounded-md border border-dashed bg-emerald-50/30 px-2.5 py-1.5'>
                                  <code className='text-[11px] font-semibold font-mono'>{out.name}</code>
                                  {getTypeBadge(out.types.join(' | '))}
                                  <span className='text-[10px] text-muted-foreground ml-auto'>{out.display_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!hasParams && (
                          <p className='text-[10px] text-muted-foreground pl-8'>无参数</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
            </div>

            {nodes.length === 0 && (
              <div className='flex flex-col items-center gap-2 py-8 text-center'>
                <div className='flex size-10 items-center justify-center rounded-md border bg-muted/30 text-muted-foreground'>
                  <Info className='size-5' />
                </div>
                <p className='text-xs text-muted-foreground'>暂无节点，请先添加工作流组件</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export default WorkflowParamsPanel
