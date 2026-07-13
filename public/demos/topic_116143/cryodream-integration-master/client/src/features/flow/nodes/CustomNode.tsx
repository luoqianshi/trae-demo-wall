import { memo, useCallback, useMemo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'
import { Boxes, CircleQuestionMark, Copy, FileText, GripVertical, Maximize2, Trash2, type LucideIcon } from 'lucide-react'
import { getModelDisplayName, getModelSelectOptions } from '@/features/model-config/model-config-store'
import { getDocumentSelectOptions, getKnowledgeBaseSelectOptions, getKnowledgeBaseDisplayName } from '@/features/flow/utils/document-options'
import { PromptModal } from '../components/debug/PromptModal'
import { extractMustacheVariables } from '../utils/mustache'
import { useFlowStore } from '../stores/useFlowStore'
import type { ComponentTemplate, CustomNode as CustomNodeType, GenericFlowNode, GenericNodeData, GroupFlowNode, NoteFlowNode, TemplateField } from '../types'

const iconMap = LucideIcons as unknown as Record<string, LucideIcon>

const noteTone: Record<string, string> = {
  yellow: 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/60 dark:text-amber-50',
  blue: 'border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-500/40 dark:bg-sky-950/60 dark:text-sky-50',
  green: 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-950/60 dark:text-emerald-50',
  rose: 'border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-500/40 dark:bg-rose-950/60 dark:text-rose-50',
}

const groupTone: Record<string, string> = {
  slate: 'border-slate-400/60 bg-slate-500/5 text-slate-700 dark:text-slate-200',
  violet: 'border-violet-400/60 bg-violet-500/5 text-violet-700 dark:text-violet-200',
  amber: 'border-amber-400/60 bg-amber-500/5 text-amber-700 dark:text-amber-200',
  emerald: 'border-emerald-400/60 bg-emerald-500/5 text-emerald-700 dark:text-emerald-200',
}

const typeDisplayMap: Record<string, string> = {
  Message: '消息',
  Text: '文本',
  Data: '数据',
  File: '文件',
  LanguageModel: '语言模型',
  EmbeddingModel: '嵌入模型',
  Embeddings: '嵌入向量',
  Tool: '工具',
  Agent: '智能体',
  VectorStore: '向量库',
  Retriever: '检索器',
  Prompt: '提示词',
  Chain: '链路',
  Memory: '记忆',
  Logic: '逻辑',
  Boolean: '布尔',
  Number: '数字',
  str: '文本',
  int: '整数',
  float: '小数',
  bool: '布尔',
  dict: '对象',
  list: '列表',
  any: '任意',
  model: '模型',
  tools: '工具',
  data: '数据',
  prompt: '提示词',
  retriever: '检索器',
  model_config: '模型配置',
}

const formatTypeLabel = (type: string) => typeDisplayMap[type] ?? type
const formatTypeList = (types: string[]) => types.map(formatTypeLabel).join(' | ')

const parseFieldValue = (field: TemplateField, value: string) => {
  if (field.type === 'int') return Number.parseInt(value || '0', 10)
  if (field.type === 'float') return Number.parseFloat(value || '0')
  if (field.type === 'bool') return value === 'true'
  return value
}

const getFieldOptions = (field: TemplateField, nodeType?: string) => {
  if (field.options?.length) return field.options
  if (field.type === 'model_config') {
    // 根据节点类型过滤模型列表
    if (nodeType === 'EmbeddingModel' || nodeType === 'KnowledgeBaseWriter') return getModelSelectOptions('embedding')
    if (nodeType === 'LanguageModel') return getModelSelectOptions('chat')
    return getModelSelectOptions()
  }
  if (field.type === 'knowledge_base') return getKnowledgeBaseSelectOptions()
  if (field.type === 'document') return getDocumentSelectOptions()
  if (field.type === 'bool') return ['true', 'false']
  if (field.name === 'method') return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  return []
}

const getNodeFields = (template: ComponentTemplate) => Object.entries(template.template)

const getFieldRole = (field: TemplateField) => {
  if (field.input_types?.length) return 'input'
  if (field.tool_mode) return 'tool'
  if (field.advanced) return 'advanced'
  return 'field'
}

const getNodeOutputs = (node: ComponentTemplate) => node.outputs

interface NodeFieldEditorProps {
  fieldKey: string
  field: TemplateField
  nodeId: string
  nodeType?: string
  onPromptExpand?: (value: string) => void
}

const NodeFieldEditor = ({ fieldKey, field, nodeId, nodeType, onPromptExpand }: NodeFieldEditorProps) => {
  const { updateNodeData } = useFlowStore()
  const options = getFieldOptions(field, nodeType)
  const value = field.value === undefined || field.value === null ? '' : String(field.value)
  const editorWidth = 'w-full'

  const updateField = (nextValue: unknown) => {
    updateNodeData(nodeId, {
      node: {
        template: {
          [fieldKey]: {
            ...field,
            value: nextValue,
          },
        },
      } as ComponentTemplate,
    } as Partial<GenericNodeData>)
  }

  if (options.length > 0 || field.type === 'model_config') {
    const placeholder = field.placeholder || (field.type === 'model_config' ? '请选择模型' : field.type === 'knowledge_base' ? '请选择知识库' : '请选择')
    const renderOptionLabel = (optionValue: string) => {
      if (field.type === 'model_config') return getModelDisplayName(optionValue)
      if (field.type === 'knowledge_base') return getKnowledgeBaseDisplayName(optionValue)
      return optionValue
    }
    const usesDisplayName = field.type === 'model_config' || field.type === 'knowledge_base'
    const emptyHint = field.type === 'knowledge_base' ? '暂无知识库，请先创建知识库' : '暂无可用模型，请先到「模型设置」中添加'
    return (
      <Select
        value={options.length > 0 ? (value || options[0]) : ''}
        onValueChange={(nextValue) => updateField(parseFieldValue(field, nextValue))}
        disabled={options.length === 0}
      >
        <SelectTrigger className={cn('nodrag h-7 rounded-md bg-background px-2 text-[11px] shadow-none', editorWidth)}>
          <SelectValue placeholder={options.length === 0 ? placeholder : (usesDisplayName ? renderOptionLabel(value || options[0]) : undefined)}>
            {usesDisplayName && value ? renderOptionLabel(value) : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.length === 0 && (
              <SelectItem value='__empty__' disabled className="text-xs text-muted-foreground">
                {emptyHint}
              </SelectItem>
            )}
            {options.map((option) => (
              <SelectItem key={option} value={option} className="text-xs">
                {renderOptionLabel(option)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  if (field.tool_mode) {
    return (
      <div className="nodrag flex h-7 w-full items-center rounded-md border border-dashed bg-muted/25 px-2 text-[11px] text-muted-foreground">
        {Array.isArray(field.value) && field.value.length > 0 ? `已连接 ${field.value.length} 个工具` : '连接工具'}
      </div>
    )
  }

  // PromptTemplate 的 template 字段：使用放大编辑框
  if (nodeType === 'PromptTemplate' && fieldKey === 'template') {
    return (
      <div className="nodrag relative min-h-[100px]">
        <textarea
          value={value}
          placeholder="提示词模板，使用 {{变量名}} 定义变量"
          onChange={(event) => updateField(event.target.value)}
          className="nodrag min-h-[100px] w-full resize-none rounded-md bg-background px-2 py-1.5 pr-8 text-[11px] leading-relaxed shadow-none focus-visible:ring-1"
        />
        <button
          type="button"
          onClick={() => onPromptExpand?.(value)}
          className="nodrag absolute bottom-2 right-2 flex size-6 items-center justify-center rounded border bg-background text-muted-foreground shadow-sm hover:bg-muted"
          title="放大编辑"
        >
          <Maximize2 className="size-3" />
        </button>
      </div>
    )
  }

  if (field.type === 'str' && (field.name.includes('template') || field.name.includes('code') || field.name.includes('query') || field.name.includes('schema') || field.name.includes('prompt') || field.name.includes('message'))) {
    return (
      <Textarea
        value={value}
        placeholder={field.placeholder}
        onChange={(event) => updateField(event.target.value)}
        className="nodrag min-h-14 w-full resize-none rounded-md bg-background px-2 py-1.5 text-[11px] shadow-none focus-visible:ring-1"
      />
    )
  }

  return (
    <Input
      value={value}
      placeholder={field.placeholder}
      type={field.type === 'int' || field.type === 'float' ? 'number' : 'text'}
      step={field.type === 'float' ? '0.1' : undefined}
      onChange={(event) => updateField(parseFieldValue(field, event.target.value))}
      className={cn('nodrag h-7 rounded-md bg-background px-2 text-[11px] shadow-none focus-visible:ring-1', editorWidth)}
    />
  )
}

const NodeInlineToolbar = ({ nodeId, visible }: { nodeId: string; visible?: boolean }) => {
  const { duplicateNode, deleteNode } = useFlowStore()

  if (!visible) return <GripVertical className="size-3.5 text-muted-foreground/45 opacity-0 transition-opacity group-hover:opacity-100" />

  return (
    <div className="nodrag flex items-center gap-0.5 rounded-md border bg-background p-0.5 shadow-sm">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-5 rounded text-muted-foreground hover:text-foreground"
        onClick={(event) => {
          event.stopPropagation()
          duplicateNode(nodeId)
        }}
        title="复制节点"
      >
        <Copy className="size-3.5" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-5 rounded text-muted-foreground hover:text-destructive"
        onClick={(event) => {
          event.stopPropagation()
          deleteNode(nodeId)
        }}
        title="删除节点"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}

const GenericNode = memo(({ id, data, selected }: NodeProps<GenericFlowNode>) => {
  const node = data.node
  const Icon = node.icon ? (iconMap[node.icon] ?? CircleQuestionMark) : CircleQuestionMark
  const inputFields = getNodeFields(node)
  const visibleOutputs = getNodeOutputs(node)
  const { updateNodeData } = useFlowStore()
  const [promptModalOpen, setPromptModalOpen] = useState(false)
  const [promptModalValue, setPromptModalValue] = useState('')

  // PromptTemplate 节点：检测 {{变量名}} 作为动态变量输入点
  const templateValue = useMemo(() => {
    if (node.type !== 'PromptTemplate') return ''
    const templateField = node.template['template']
    const val = templateField?.value
    return typeof val === 'string' ? val : ''
  }, [node])

  const templateVariables = useMemo(() => extractMustacheVariables(templateValue), [templateValue])

  // 从节点 data 中读取变量值（用于手动填写）
  const variableValues = useMemo<Record<string, string>>(() => {
    const nodeData = data as { variables?: Record<string, string> }
    const raw = nodeData.variables
    if (raw && typeof raw === 'object') return raw as Record<string, string>
    return {}
  }, [data])

  const updateVariableValue = useCallback((name: string, val: string) => {
    updateNodeData(id, {
      variables: { ...variableValues, [name]: val },
    } as Partial<GenericNodeData>)
  }, [id, variableValues, updateNodeData])

  const handlePromptExpand = useCallback((value: string) => {
    setPromptModalValue(value)
    setPromptModalOpen(true)
  }, [setPromptModalOpen])

  const handlePromptChange = useCallback((newValue: string) => {
    // 直接更新 template.template 的 value
    updateNodeData(id, {
      node: {
        template: {
          ...node.template,
          template: {
            ...node.template.template,
            value: newValue,
          },
        },
      } as ComponentTemplate,
    } as Partial<GenericNodeData>)
  }, [id, node.template, updateNodeData])

  return (
    <div
      className={cn(
        'generic-node-div group w-80 overflow-visible rounded-xl border bg-background text-foreground shadow-sm transition-shadow hover:shadow-md',
        selected && 'ring-2 ring-primary/25'
      )}
    >
      <div className="flex w-full items-center justify-between gap-2 px-4 py-3 text-foreground">
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background text-foreground">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1 truncate text-sm font-bold leading-5 text-foreground">{node.display_name}</div>
        </div>
        <NodeInlineToolbar nodeId={id} visible={selected} />
      </div>

      <div className="px-4 pb-3 text-[11px] leading-4 text-muted-foreground">{node.description}</div>

      <div className="border-t" />

      <div className="nopan nodelete noflow relative flex cursor-auto flex-col">
        {/* 静态输入字段 */}
        {inputFields.length > 0 ? (
          inputFields.map(([key, field]) => {
            const role = getFieldRole(field)
            const isConnectedInput = Boolean(field.input_types?.length)
            return (
              <div
                key={key}
                className={cn(
                  'relative flex w-full flex-wrap items-center justify-between px-5 py-2 text-xs hover:bg-muted/30',
                  role === 'input' || role === 'tool' ? 'min-h-14' : 'min-h-12'
                )}
              >
                {isConnectedInput && (
                  <Handle
                    id={key}
                    type="target"
                    position={Position.Left}
                    className="flow-handle flow-handle-target !left-[-7px]"
                  />
                )}
                <div className="flex w-full flex-col gap-2">
                  <div className="flex w-full items-center justify-between gap-2 text-sm">
                    <span className="truncate text-[13px] font-medium leading-5">{field.display_name}</span>
                    <span className="rounded bg-muted px-1.5 py-px text-[10px] leading-4 text-muted-foreground">
                      {field.input_types?.length ? formatTypeList(field.input_types) : field.tool_mode ? '工具列表' : formatTypeLabel(field.type)}
                    </span>
                  </div>
                  <NodeFieldEditor fieldKey={key} field={field} nodeId={id} nodeType={node.type} onPromptExpand={handlePromptExpand} />
                </div>
              </div>
            )
          })
        ) : (
          <div className="px-5 py-3 text-[11px] text-muted-foreground">无参数</div>
        )}

        {/* PromptTemplate 节点：动态变量输入点 */}
        {node.type === 'PromptTemplate' && templateVariables.length > 0 && (
          <>
            <div className="px-5 pt-2 pb-1">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <span className="size-1 rounded-full bg-primary" />
                模板变量 ({templateVariables.length})
              </div>
            </div>
            {templateVariables.map((varName) => (
              <div
                key={varName}
                className="relative flex w-full flex-wrap items-center justify-between px-5 py-2 text-xs hover:bg-muted/30"
              >
                {/* 左侧连接点：外部节点可以传入变量值 */}
                <Handle
                  id={`var_${varName}`}
                  type="target"
                  position={Position.Left}
                  className="flow-handle flow-handle-target !left-[-7px]"
                />
                <div className="flex w-full flex-col gap-2">
                  <div className="flex w-full items-center justify-between gap-2 text-sm">
                    <Badge variant="secondary" className="text-[11px]">
                      {`{{${varName}}}`}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">文本 | 连接输入</span>
                  </div>
                  <input
                    type="text"
                    value={variableValues[varName] ?? ''}
                    onChange={(e) => updateVariableValue(varName, e.target.value)}
                    placeholder={`为 {${varName}} 输入默认值`}
                    className="nodrag h-8 w-full rounded-md border bg-background px-2 text-[11px] outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="border-t" />

      {node.outputs.length > 0 && (
        <div className="flex flex-col rounded-b-xl bg-muted/30">
          {visibleOutputs.map((output) => (
            <div key={output.name} className="relative flex min-h-11 w-full items-center justify-between gap-2 px-5 py-2 text-xs text-muted-foreground">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[13px] font-medium text-foreground">{output.display_name}</span>
                <span className="text-[10px] leading-4 text-muted-foreground">输出</span>
              </div>
              <span className="mr-2 shrink-0 truncate rounded-md border bg-background px-1.5 py-px text-[10px] leading-4">{formatTypeList(output.types)}</span>
              <Handle id={output.name} type="source" position={Position.Right} className="flow-handle flow-handle-source !right-[-7px]" />
            </div>
          ))}
        </div>
      )}

      {node.type === 'PromptTemplate' && (
        <PromptModal
          open={promptModalOpen}
          setOpen={setPromptModalOpen}
          value={promptModalValue}
          onChange={handlePromptChange}
        />
      )}
    </div>
  )
})

GenericNode.displayName = 'GenericNode'

const NoteNode = memo(({ id, data, selected }: NodeProps<NoteFlowNode>) => {
  const { updateNodeData } = useFlowStore()
  const [editing, setEditing] = useState(false)
  const colorClass = noteTone[data.color] ?? noteTone.yellow

  return (
    <div
      className={cn('group min-h-[104px] w-[200px] rounded-xl border p-2.5 shadow-sm transition-shadow hover:shadow-md', colorClass, selected && 'ring-2 ring-primary/25')}
      onDoubleClick={() => setEditing(true)}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold">
          <FileText className="size-3.5" />
          便签
        </div>
        <div className="flex items-center gap-1">
          {selected ? (
            <NodeInlineToolbar nodeId={id} visible />
          ) : (
            Object.keys(noteTone).map((color) => (
              <button
                key={color}
                type="button"
                className={cn('nodrag size-3 rounded-full border', data.color === color && 'ring-2 ring-primary/40')}
                style={{ backgroundColor: color === 'yellow' ? '#facc15' : color === 'blue' ? '#38bdf8' : color === 'green' ? '#34d399' : '#fb7185' }}
                onClick={(event) => {
                  event.stopPropagation()
                  updateNodeData(id, { color })
                }}
                aria-label={`切换便签颜色为 ${color}`}
              />
            ))
          )}
        </div>
      </div>
      {hasOutputs && (
          <div className="border-t bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>输出</span>
              <span>{template.outputs.length} 项</span>
            </div>
            <div className="space-y-1.5">
              {template.outputs.map((output) => {
                const typeLabel = output.type === 'image' ? '图片' : output.type === 'video' ? '视频' : output.type === 'audio' ? '音频' : output.type
                return (
                  <div key={output.id} className="flex items-center justify-between rounded-md border bg-background px-2 py-1.5 text-[10px]">
                    <span className="text-foreground">{output.label}</span>
                    <span className="rounded-full border bg-muted/30 px-2 py-0.5 text-muted-foreground">{typeLabel}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {selected && (
        <div className="nodrag mb-2 flex items-center gap-1">
          {Object.keys(noteTone).map((color) => (
            <button
              key={color}
              type="button"
              className={cn('size-3 rounded-full border', data.color === color && 'ring-2 ring-primary/40')}
              style={{ backgroundColor: color === 'yellow' ? '#facc15' : color === 'blue' ? '#38bdf8' : color === 'green' ? '#34d399' : '#fb7185' }}
              onClick={(event) => {
                event.stopPropagation()
                updateNodeData(id, { color })
              }}
              aria-label={`切换为 ${color}`}
            />
          ))}
        </div>
      )}
      {editing ? (
        <Textarea
          autoFocus
          value={data.text}
          onBlur={() => setEditing(false)}
          onChange={(event) => updateNodeData(id, { text: event.target.value })}
          className="nodrag min-h-[68px] resize-none border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
        />
      ) : (
        <div className="whitespace-pre-wrap text-xs leading-relaxed">{data.text}</div>
      )}
    </div>
  )
})

NoteNode.displayName = 'NoteNode'

const GroupNode = memo(({ id, data, selected }: NodeProps<GroupFlowNode>) => {
  const { updateNodeData, ungroupNode } = useFlowStore()
  const colorClass = groupTone[data.color] ?? groupTone.slate

  return (
    <div
      className={cn(
        'group h-full min-h-[156px] min-w-[280px] rounded-xl border border-dashed p-2 shadow-sm transition-shadow',
        colorClass,
        selected && 'ring-2 ring-primary/25'
      )}
    >
      <div className="nodrag flex items-center justify-between gap-2 rounded-lg border bg-background/95 px-2 py-1 shadow-sm">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Boxes className="size-3" />
          </div>
          <div className="min-w-0">
            <input
              value={data.title}
              onChange={(event) => updateNodeData(id, { title: event.target.value })}
              className="nodrag h-5 w-36 bg-transparent text-[12px] font-semibold outline-none"
              aria-label="分组名称"
            />
            <div className="truncate text-[10px] text-muted-foreground">
              {data.description || `${data.childNodeIds.length} 个节点`}
            </div>
          </div>
        </div>
        {selected ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="nodrag h-6 rounded px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={(event) => {
              event.stopPropagation()
              ungroupNode(id)
            }}
          >
            解组
          </Button>
        ) : (
          <GripVertical className="size-4 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
    </div>
  )
})

GroupNode.displayName = 'GroupNode'

const CustomNode = (props: NodeProps<CustomNodeType>) => {
  if (props.type === 'noteNode') return <NoteNode {...(props as NodeProps<NoteFlowNode>)} />
  if (props.type === 'groupNode') return <GroupNode {...(props as NodeProps<GroupFlowNode>)} />
  return <GenericNode {...(props as NodeProps<GenericFlowNode>)} />
}

export default memo(CustomNode)
