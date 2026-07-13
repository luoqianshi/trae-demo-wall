import { Link, useNavigate } from '@tanstack/react-router'
import { saveWorkflowAsTemplate, saveWorkflowGraph } from '@/features/projects/project-api'
import { useFlowStore } from '../stores/useFlowStore'
import { useFlowDebugStore } from '../stores/useFlowDebugStore'
import { useWorkflowTabsStore } from '../stores/workflow-tabs-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useState } from 'react'
import { BookmarkPlus, BrainCog, Download, FileJson, Lock, Play, Redo2, Save, Trash2, Undo2, Unlock, Unlink } from 'lucide-react'
import WorkflowParamsPanel from './WorkflowParamsPanel'

interface ToolbarProps {
  projectId?: string
  workflowId?: string
}

const Toolbar = ({ projectId, workflowId }: ToolbarProps) => {
  const { flowName, setFlowName, saveFlow, clearFlow, nodes, edges, locked, setLocked, undo, redo, canUndo, canRedo, deleteNode } =
    useFlowStore()
  const { setOpen: setDebugOpen } = useFlowDebugStore()
  const updateTabName = useWorkflowTabsStore((s) => s.updateTabName)
  const navigate = useNavigate()
  const [paramsOpen, setParamsOpen] = useState(false)

  /** 保存工作流到后端或本地 */
  const handleSave = async (): Promise<boolean> => {
    const flow = saveFlow()
    let graphJson: string
    try {
      graphJson = JSON.stringify({ nodes: flow.nodes, edges: flow.edges })
    } catch {
      toast.error('工作流数据序列化失败，请检查节点参数')
      return false
    }

    if (workflowId) {
      try {
        await saveWorkflowGraph({
          id: workflowId,
          name: flow.name,
          description: flow.description,
          graphJson,
          nodeCount: flow.nodes.length,
          edgeCount: flow.edges.length,
          status: 'draft',
        })
        toast.success(`已保存（${flow.nodes.length} 节点 · ${flow.edges.length} 连线）`)
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : '未知错误'
        toast.error(`后端保存失败：${message}，已备份到本地缓存`)
        localStorage.setItem(`flow_${flow.id}`, JSON.stringify(flow))
        return false
      }
    }

    localStorage.setItem(`flow_${flow.id}`, JSON.stringify(flow))
    toast.success(`已保存到本地缓存（${flow.nodes.length} 节点 · ${flow.edges.length} 连线）`)
    return true
  }

  const handleExport = () => {
    const flow = saveFlow()
    const dataStr = JSON.stringify(flow, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', `${flow.name}.json`)
    linkElement.click()
    toast.success('工作流已导出')
  }

  /** 调试运行：先自动保存工作流，再切换到调试 Tab */
  const handleRun = async () => {
    if (nodes.length === 0) {
      toast.error('请先添加组件')
      return
    }
    // 自动保存工作流
    if (workflowId) {
      await handleSave()
    }
    setDebugOpen(true)
    navigate({
      to: '/flow',
      search: { projectId, workflowId, mode: 'debug' },
    })
  }

  /** 检测并删除未连接的孤立节点（没有任何连线相连的节点） */
  const handleDeleteUnconnected = () => {
    const connectedIds = new Set<string>()
    edges.forEach((edge) => {
      connectedIds.add(edge.source)
      connectedIds.add(edge.target)
    })
    const unconnected = nodes.filter((node) => !connectedIds.has(node.id))
    if (unconnected.length === 0) {
      toast.success('没有未连接的节点')
      return
    }
    unconnected.forEach((node) => deleteNode(node.id))
    toast.success(`已删除 ${unconnected.length} 个未连接节点`)
  }

  /** 保存当前工作流为模板 */
  const handleSaveAsTemplate = async () => {
    if (!workflowId) {
      toast.error('请先保存工作流后再保存为模板')
      return
    }
    try {
      await saveWorkflowAsTemplate(workflowId)
      toast.success('已标记为模板（可在"从模板创建"中使用）')
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误'
      toast.error(`保存为模板失败：${message}`)
    }
  }

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b bg-background px-3">
      <div className="flex min-w-0 items-center gap-2">
        <Input
          className="h-8 w-64 border-0 bg-transparent px-1 text-sm font-medium shadow-none focus-visible:ring-0"
          value={flowName}
          onChange={(event) => {
            const name = event.target.value
            setFlowName(name)
            if (workflowId) updateTabName(workflowId, name)
          }}
          placeholder="未命名工作流"
        />
      </div>

      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" className="size-8" onClick={undo} disabled={!canUndo()} title="撤销">
          <Undo2 />
        </Button>
        <Button size="icon" variant="ghost" className="size-8" onClick={redo} disabled={!canRedo()} title="重做">
          <Redo2 />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <Button
          size="sm"
          variant="outline"
          onClick={() => setParamsOpen(true)}
          className="h-8 rounded-md px-2.5"
          title="查看工作流输入/输出参数"
        >
          <FileJson data-icon="inline-start" />
          参数
        </Button>
        <WorkflowParamsPanel open={paramsOpen} onOpenChange={setParamsOpen} nodes={nodes} edges={edges} />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          onClick={handleDeleteUnconnected}
          title="删除未连接节点"
        >
          <Unlink />
        </Button>
        <Button size="icon" variant="ghost" className="size-8" onClick={() => setLocked(!locked)} title={locked ? '解锁画布' : '锁定画布'}>
          {locked ? <Lock /> : <Unlock />}
        </Button>
        <Button size="sm" variant="outline" className="h-8 rounded-md px-3" asChild>
          <Link to="/model-settings">
            <BrainCog data-icon="inline-start" />
            模型设置
          </Link>
        </Button>
        <Button size="sm" onClick={() => void handleRun()} className="h-8 rounded-md px-3">
          <Play data-icon="inline-start" />
          调试运行
        </Button>
        <Button size="sm" variant="outline" onClick={() => void handleSave()} className="h-8 rounded-md px-2.5">
          <Save data-icon="inline-start" />
          保存
        </Button>
        <Button size="sm" variant="ghost" onClick={() => void handleSaveAsTemplate()} className="h-8 rounded-md px-2.5" title="保存为模板">
          <BookmarkPlus data-icon="inline-start" />
          存为模板
        </Button>
        <Button size="sm" variant="ghost" onClick={handleExport} className="h-8 rounded-md px-2.5">
          <Download data-icon="inline-start" />
          导出
        </Button>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            if (confirm('确定要清空画布吗？')) clearFlow()
          }}
          className="size-8 rounded-md text-muted-foreground hover:text-destructive"
          title="清空画布"
        >
          <Trash2 />
        </Button>
      </div>
    </header>
  )
}

export default Toolbar
