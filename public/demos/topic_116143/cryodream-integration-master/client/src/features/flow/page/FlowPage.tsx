import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Bot, FolderKanban, MousePointer2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Main } from '@/components/layout/main'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { listEnabledModelConfigs } from '@/features/model-config/model-config-store'
import { getWorkflow } from '@/features/projects/project-api'
import Toolbar from '../components/Toolbar'
import NodePanel from '../components/NodePanel'
import FlowCanvas from '../components/FlowCanvas'
import PropertyPanel from '../components/PropertyPanel'
import WorkflowDebugPanel from '../components/debug/WorkflowDebugPanel'
import { useFlowDebugStore } from '../stores/useFlowDebugStore'
import { useFlowStore } from '../stores/useFlowStore'
import { useDragAndDrop } from '../utils/useDragAndDrop'
import { useWorkflowTabsStore } from '../stores/workflow-tabs-store'
import type { FlowData } from '../types'
import { cn } from '@/lib/utils'

interface FlowPageProps {
  projectId?: string
  workflowId?: string
  mode?: 'edit' | 'debug'
}

const FlowPage = ({ projectId, workflowId, mode }: FlowPageProps) => {
  const { onDragStart } = useDragAndDrop()
  const debugOpen = useFlowDebugStore((state) => state.open)
  const setOpen = useFlowDebugStore((state) => state.setOpen)
  const loadFlow = useFlowStore((state) => state.loadFlow)
  const navigate = useNavigate()

  const tabs = useWorkflowTabsStore((state) => state.tabs)
  const activeTabId = useWorkflowTabsStore((state) => state.activeTabId)
  const addTab = useWorkflowTabsStore((state) => state.addTab)
  const removeTab = useWorkflowTabsStore((state) => state.removeTab)
  const setActiveTab = useWorkflowTabsStore((state) => state.setActiveTab)

  // 当 URL 参数变化时，添加/切换标签
  useEffect(() => {
    if (workflowId && projectId) {
      const existing = tabs.find((t) => t.workflowId === workflowId)
      if (!existing) {
        // 从 API 获取工作流信息
        getWorkflow(workflowId).then((wf) => {
          addTab({
            workflowId,
            projectId: wf.projectId || projectId,
            projectName: wf.projectName || '项目',
            workflowName: wf.name,
          })
        }).catch(() => {
          addTab({
            workflowId,
            projectId,
            projectName: '项目',
            workflowName: workflowId,
          })
        })
      } else {
        // 已存在时，更新 projectId（可能之前存的不对）
        if (existing.projectId !== projectId) {
          addTab({ ...existing, projectId })
        }
        setActiveTab(workflowId)
      }
    }
  }, [workflowId, projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  // 路由 mode 参数同步到 debug store
  useEffect(() => {
    if (mode === 'debug') setOpen(true)
    else if (mode === 'edit') setOpen(false)
  }, [mode, setOpen])

  // Tab 切换时更新 URL mode 参数
  const handleTabChange = (value: string) => {
    setOpen(value === 'debug')
    navigate({
      to: '/flow',
      search: { projectId, workflowId, mode: value === 'debug' ? 'debug' : 'edit' },
    })
  }

  // 点击工作流标签页
  const handleTabClick = (tabWorkflowId: string, tabProjectId: string) => {
    if (tabWorkflowId === workflowId) return
    navigate({
      to: '/flow',
      search: { projectId: tabProjectId, workflowId: tabWorkflowId },
    })
  }

  // 关闭工作流标签页
  const handleCloseTab = (e: React.MouseEvent, tabWorkflowId: string) => {
    e.stopPropagation()
    removeTab(tabWorkflowId)
    // 如果关闭的是当前标签，跳转到剩余标签或项目空间
    if (tabWorkflowId === workflowId) {
      const remaining = tabs.filter((t) => t.workflowId !== tabWorkflowId)
      if (remaining.length > 0) {
        const nextTab = remaining[0]
        navigate({ to: '/flow', search: { projectId: nextTab.projectId, workflowId: nextTab.workflowId } })
      } else {
        navigate({ to: '/projects' })
      }
    }
  }

  useEffect(() => {
    listEnabledModelConfigs().catch(() => {})
  }, [])

  useEffect(() => {
    if (!workflowId) return
    getWorkflow(workflowId)
      .then((workflow) => {
        const graph = workflow.graphJson ? (JSON.parse(workflow.graphJson) as Partial<FlowData>) : {}
        loadFlow({
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          nodes: graph.nodes ?? [],
          edges: graph.edges ?? [],
          createdAt: workflow.createTime ?? new Date().toISOString(),
          updatedAt: workflow.updateTime ?? new Date().toISOString(),
        })
      })
      .catch(() => {
        toast.error('工作流加载失败，请从项目空间重新打开')
      })
  }, [loadFlow, workflowId])

  return (
    <Main fixed fluid className="overflow-hidden bg-background p-0">
      {/* 工作流标签页栏 */}
      <div className='flex items-center border-b bg-muted/30 overflow-x-auto no-scrollbar'>
        {/* 固定标签：项目空间 */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r shrink-0 transition-colors',
            !activeTabId ? 'bg-background text-foreground border-b-2 border-b-primary' : 'text-muted-foreground hover:bg-muted/50'
          )}
          onClick={() => navigate({ to: '/projects', search: projectId ? { projectId } : undefined })}
        >
          <FolderKanban className='size-3' />
          <span>项目空间</span>
        </div>

        {/* 工作流标签 */}
        {tabs.map((tab) => {
          const isActive = tab.workflowId === activeTabId
          return (
            <div
              key={tab.workflowId}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r shrink-0 transition-colors group',
                isActive ? 'bg-background text-foreground border-b-2 border-b-primary' : 'text-muted-foreground hover:bg-muted/50'
              )}
              onClick={() => handleTabClick(tab.workflowId, tab.projectId)}
            >
              <span className='truncate max-w-[120px]'>{tab.workflowName}</span>
              {tab.projectName && (
                <span className='text-[9px] text-muted-foreground shrink-0'>· {tab.projectName}</span>
              )}
              <button
                className='size-3.5 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 transition-opacity flex items-center justify-center shrink-0'
                onClick={(e) => handleCloseTab(e, tab.workflowId)}
              >
                <X className='size-2.5' />
              </button>
            </div>
          )
        })}
      </div>

      <Tabs
        value={debugOpen ? 'debug' : 'editor'}
        onValueChange={handleTabChange}
        className="flex min-h-0 flex-1 flex-col overflow-hidden border-t bg-background"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-background px-3 py-1.5">
          <TabsList className="grid h-7 w-[14rem] grid-cols-2">
            <TabsTrigger value="editor" className="gap-1 text-xs">
              <MousePointer2 className="size-3" />
              编辑器
            </TabsTrigger>
            <TabsTrigger value="debug" className="gap-1 text-xs">
              <Bot className="size-3" />
              调试运行
            </TabsTrigger>
          </TabsList>
          <div className="text-[10px] text-muted-foreground">
            {workflowId ? `${tabs.find(t => t.workflowId === workflowId)?.workflowName || '工作流'}` : '未选择工作流'}
          </div>
        </div>
        <Toolbar projectId={projectId} workflowId={workflowId} />

        <TabsContent value="editor" className="m-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
          <div className="flex h-full min-h-0 overflow-hidden">
            <NodePanel onDragStart={onDragStart} />
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

export default FlowPage
