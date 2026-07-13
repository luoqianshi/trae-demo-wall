import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Bot, MousePointer2 } from 'lucide-react'
import { toast } from 'sonner'
import { Main } from '@/components/layout/main'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { listEnabledModelConfigs } from '@/features/model-config/model-config-store'
import { getWorkflowTemplate } from '@/features/projects/project-api'
import NodePanel from '@/features/flow/components/NodePanel'
import FlowCanvas from '@/features/flow/components/FlowCanvas'
import PropertyPanel from '@/features/flow/components/PropertyPanel'
import WorkflowDebugPanel from '@/features/flow/components/debug/WorkflowDebugPanel'
import SystemWorkflowToolbar from '@/features/system-workflows/SystemWorkflowToolbar'
import { useFlowDebugStore } from '@/features/flow/stores/useFlowDebugStore'
import { useFlowStore } from '@/features/flow/stores/useFlowStore'
import { useDragAndDrop } from '@/features/flow/utils/useDragAndDrop'
import { nodeCategories } from '@/features/flow/config/nodeTemplates'
import type { FlowData } from '@/features/flow/types'

interface ThinkingModelSearch {
  mode?: 'edit' | 'debug'
}

export const Route = createFileRoute(
  '/_authenticated/system-workflows/thinking-model'
)({
  validateSearch: (search: Record<string, unknown>): ThinkingModelSearch => ({
    mode: search.mode === 'debug' || search.mode === 'edit' ? search.mode : undefined,
  }),
  component: ThinkingModelRoute,
})

const TEMPLATE_ID = 'tpl-thinking-model-ingestion'

/** 思维模型工作流需要的节点类型白名单 */
const ALLOWED_NODE_TYPES = new Set([
  'DocumentLoader', 'PromptTemplate', 'LanguageModel',
  'FormatValidator', 'ThinkingModelWriter',
])

/** 只保留与思维模型入库相关的节点分类（模块级计算，不依赖 React hooks） */
const thinkingModelNodeCategories = nodeCategories
  .map(cat => ({
    ...cat,
    nodes: cat.nodes.filter(n => ALLOWED_NODE_TYPES.has(n.type)),
  }))
  .filter(cat => cat.nodes.length > 0)

function ThinkingModelRoute() {
  const search = Route.useSearch()
  const mode = search.mode
  return <ThinkingModelWorkflow mode={mode} />
}

interface ThinkingModelWorkflowProps {
  mode?: 'edit' | 'debug'
}

function ThinkingModelWorkflow({ mode }: ThinkingModelWorkflowProps) {
  const { onDragStart } = useDragAndDrop()
  const debugOpen = useFlowDebugStore((state) => state.open)
  const setOpen = useFlowDebugStore((state) => state.setOpen)
  const loadFlow = useFlowStore((state) => state.loadFlow)
  const navigate = useNavigate()

  useEffect(() => {
    if (mode === 'debug') setOpen(true)
    else if (mode === 'edit') setOpen(false)
  }, [mode, setOpen])

  const handleTabChange = (value: string) => {
    setOpen(value === 'debug')
    navigate({
      to: '/system-workflows/thinking-model',
      search: { mode: value === 'debug' ? 'debug' : 'edit' },
    })
  }

  useEffect(() => {
    listEnabledModelConfigs().catch(() => {})
  }, [])

  useEffect(() => {
    getWorkflowTemplate(TEMPLATE_ID)
      .then((template) => {
        const graph = template.graphJson ? (JSON.parse(template.graphJson) as Partial<FlowData>) : {}
        loadFlow({
          id: template.id,
          name: template.name || '思维模型入库',
          description: template.description,
          nodes: graph.nodes ?? [],
          edges: graph.edges ?? [],
          createdAt: template.createTime ?? new Date().toISOString(),
          updatedAt: template.updateTime ?? new Date().toISOString(),
        })
      })
      .catch((err) => {
        console.error('[thinking-model] 模板加载失败:', err)
        toast.error('工作流模板加载失败: ' + (err instanceof Error ? err.message : String(err)))
      })
  }, [loadFlow])

  return (
    <Main fixed fluid className="overflow-hidden bg-background p-0">
      <Tabs
        value={debugOpen ? 'debug' : 'editor'}
        onValueChange={handleTabChange}
        className="flex min-h-0 flex-1 flex-col overflow-hidden border-t bg-background"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-background px-3 py-2">
          <TabsList className="grid h-9 w-[18rem] grid-cols-2">
            <TabsTrigger value="editor" className="gap-1.5">
              <MousePointer2 className="size-3.5" />
              编辑器
            </TabsTrigger>
            <TabsTrigger value="debug" className="gap-1.5">
              <Bot className="size-3.5" />
              调试运行
            </TabsTrigger>
          </TabsList>
          <div className="text-xs text-muted-foreground">
            系统默认工作流 · 思维模型入库
          </div>
        </div>
        <SystemWorkflowToolbar templateId={TEMPLATE_ID} runPath="/system-workflows/thinking-model" placeholder="思维模型入库" />

        <TabsContent value="editor" className="m-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
          <div className="flex h-full min-h-0 overflow-hidden">
            <NodePanel onDragStart={onDragStart} overrideCategories={thinkingModelNodeCategories} />
            <FlowCanvas />
            <PropertyPanel />
          </div>
        </TabsContent>

        <TabsContent value="debug" className="m-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <WorkflowDebugPanel />
          </div>
        </TabsContent>
      </Tabs>
    </Main>
  )
}
