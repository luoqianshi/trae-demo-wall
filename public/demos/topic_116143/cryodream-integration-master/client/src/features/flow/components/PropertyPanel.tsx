import { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Boxes, Info, Settings2, Trash2 } from 'lucide-react'
import { getModelDisplayName, getModelSelectOptions } from '@/features/model-config/model-config-store'
import { getDocumentSelectOptions, getKnowledgeBaseSelectOptions, getKnowledgeBaseDisplayName } from '@/features/flow/utils/document-options'
import { useFlowStore } from '../stores/useFlowStore'
import type { GenericNodeData, GroupNodeData, NoteNodeData, TemplateField } from '../types'

const categoryLabelMap: Record<string, string> = {
  input_output: '输入/输出',
  data_source: '数据源',
  models_and_agents: '智能体和模型',
  files_and_knowledge: '文件与知识',
  processing: '数据处理',
  flow_controls: '流程控制',
  utilities: '实用工具',
  tools: '工具',
  vectorstores: '向量存储',
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
  model_config: '模型配置',
}

const formatTypeList = (types: string[]) => types.map((type) => typeDisplayMap[type] ?? type).join(' | ')

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

const PropertyPanel = () => {
  const { selectedNode, updateNodeData, deleteNode } = useFlowStore()

  // 自动填充默认值：对于有 options 的字段（如 model_config），如果当前 value 为空，自动选择第一个选项
  // 必须放在所有条件返回之前，遵守 React Hooks 规则
  useEffect(() => {
    if (!selectedNode || selectedNode.type !== 'genericNode') return
    const data = selectedNode.data as GenericNodeData
    const component = data.node
    if (!component?.template) return
    let needUpdate = false
    const nextTemplate = { ...component.template }
    for (const [key, field] of Object.entries(component.template)) {
      const options = getFieldOptions(field)
      const currentValue = stringifyValue(field.value)
      if (options.length > 0 && !currentValue) {
        nextTemplate[key] = { ...field, value: parseValue(field, options[0]) }
        needUpdate = true
      }
    }
    if (needUpdate) {
      updateNodeData(selectedNode.id, {
        node: { ...component, template: nextTemplate },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode?.id, selectedNode?.type])

  if (!selectedNode) {
    return (
      <aside className="flex min-h-0 w-[18rem] shrink-0 flex-col border-l bg-background">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
          <Info className="size-4 text-muted-foreground" />
          <div className="truncate text-sm font-medium">检查器</div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
          <div className="flex size-10 items-center justify-center rounded-md border bg-muted/30 text-muted-foreground">
            <Info className="size-5" />
          </div>
          <div className="flex max-w-48 flex-col gap-1">
            <p className="text-sm font-medium">未选择节点</p>
            <p className="text-xs leading-relaxed text-muted-foreground">点击画布节点后在这里编辑参数。</p>
          </div>
        </div>
      </aside>
    )
  }

  if (selectedNode.type === 'groupNode') {
    const data = selectedNode.data as GroupNodeData
    return (
      <aside className="flex min-h-0 w-[18rem] shrink-0 flex-col border-l bg-background">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
          <Boxes className="size-4 text-muted-foreground" />
          <div className="min-w-0 flex-1 truncate text-sm font-medium">分组</div>
          <Badge variant="outline" className="h-5 rounded px-1.5 text-[11px]">分组节点</Badge>
        </div>
        <div className="flex flex-col gap-2 p-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="group-title" className="text-xs text-muted-foreground">名称</Label>
            <Input
              id="group-title"
              value={data.title}
              onChange={(event) => updateNodeData(selectedNode.id, { title: event.target.value })}
              className="h-8 rounded-md bg-muted/20 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="group-desc" className="text-xs text-muted-foreground">描述</Label>
            <Textarea
              id="group-desc"
              value={data.description ?? ''}
              onChange={(event) => updateNodeData(selectedNode.id, { description: event.target.value })}
              className="min-h-20 rounded-md bg-muted/20 text-xs"
            />
          </div>
          <section className="rounded-md border bg-muted/10 p-2 text-xs text-muted-foreground">
            包含节点：{data.childNodeIds.length} 个
          </section>
          <Button variant="destructive" size="sm" className="h-8 w-full rounded-md" onClick={() => deleteNode(selectedNode.id)}>
            <Trash2 data-icon="inline-start" />
            删除分组
          </Button>
        </div>
      </aside>
    )
  }

  if (selectedNode.type === 'noteNode') {
    const data = selectedNode.data as NoteNodeData
    return (
      <aside className="flex min-h-0 w-[18rem] shrink-0 flex-col border-l bg-background">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
          <Settings2 className="size-4 text-muted-foreground" />
          <div className="min-w-0 flex-1 truncate text-sm font-medium">便签</div>
          <Badge variant="outline" className="h-5 rounded px-1.5 text-[11px]">便签节点</Badge>
        </div>
        <div className="flex flex-col gap-2 p-2">
          <Textarea
            value={data.text}
            onChange={(event) => updateNodeData(selectedNode.id, { text: event.target.value })}
            className="min-h-32 text-xs"
          />
          <Button variant="destructive" size="sm" className="h-8 w-full rounded-md" onClick={() => deleteNode(selectedNode.id)}>
            <Trash2 data-icon="inline-start" />
            删除节点
          </Button>
        </div>
      </aside>
    )
  }

  const data = selectedNode.data as GenericNodeData
  const component = data.node

  const handleFieldChange = (key: string, value: string) => {
    const field = component.template[key]
    updateNodeData(selectedNode.id, {
      node: {
        ...component,
        template: {
          ...component.template,
          [key]: {
            ...field,
            value: parseValue(field, value),
          },
        },
      },
    })
  }

  return (
    <aside className="flex min-h-0 w-[18rem] shrink-0 flex-col border-l bg-background">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <Settings2 className="size-4 text-muted-foreground" />
        <div className="min-w-0 flex-1 truncate text-sm font-medium">{component.display_name}</div>
        <Badge variant="outline" className="h-5 rounded px-1.5 text-[11px] font-normal">
          {categoryLabelMap[component.category] ?? component.category}
        </Badge>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-2 p-2">
          <section className="rounded-md border bg-muted/10 p-2">
            <div className="text-xs font-medium">{component.display_name}</div>
            <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{component.description}</div>
          </section>

          <section className="flex flex-col gap-2 rounded-md border p-2">
            <div className="text-xs font-medium">参数</div>
            <Separator />
            {Object.entries(component.template).map(([key, field]) => {
              const options = getFieldOptions(field)
              const value = stringifyValue(field.value)

              return (
                <div key={key} className="flex flex-col gap-1.5">
                  <Label htmlFor={`field-${key}`} className="text-xs text-muted-foreground">
                    {field.display_name}
                  </Label>
                  {options.length > 0 ? (
                    <Select value={value || options[0]} onValueChange={(nextValue) => handleFieldChange(key, nextValue)}>
                      <SelectTrigger id={`field-${key}`} className="h-8 w-full rounded-md bg-muted/20 text-xs">
                        <SelectValue>
                          {getFieldOptionLabel(field, value || options[0])}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {options.map((option) => (
                            <SelectItem key={option} value={option} className="text-xs">
                              {getFieldOptionLabel(field, option)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : value.length > 80 ? (
                    <Textarea
                      id={`field-${key}`}
                      value={value}
                      onChange={(event) => handleFieldChange(key, event.target.value)}
                      rows={3}
                      className="rounded-md bg-muted/20 text-xs"
                    />
                  ) : (
                    <Input
                      id={`field-${key}`}
                      value={value}
                      onChange={(event) => handleFieldChange(key, event.target.value)}
                      className="h-8 rounded-md bg-muted/20 text-xs"
                    />
                  )}
                </div>
              )
            })}
          </section>

          {component.outputs.length > 0 && (
            <section className="flex flex-col gap-1.5 rounded-md border p-2">
              <div className="text-xs font-medium">输出</div>
              {component.outputs.map((output) => (
                <div key={output.name} className="flex h-7 items-center justify-between gap-2 rounded bg-muted/40 px-2 text-xs">
                  <span className="truncate font-medium">{output.display_name}</span>
                  <Badge variant="outline" className="h-5 rounded px-1 text-[10px]">{formatTypeList(output.types)}</Badge>
                </div>
              ))}
            </section>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-2">
        <Button variant="destructive" size="sm" className="h-8 w-full rounded-md" onClick={() => deleteNode(selectedNode.id)}>
          <Trash2 data-icon="inline-start" />
          删除节点
        </Button>
      </div>
    </aside>
  )
}

export default PropertyPanel
