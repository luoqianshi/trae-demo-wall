import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFlowStore } from '@/features/flow/stores/useFlowStore'
import { useFlowDebugStore } from '@/features/flow/stores/useFlowDebugStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { BrainCog, FileJson, Play, Redo2, Save, Undo2, Lock, Unlock, Unlink, Trash2 } from 'lucide-react'
import WorkflowParamsPanel from '@/features/flow/components/WorkflowParamsPanel'

interface SystemWorkflowToolbarProps {
  templateId: string
  kbId?: string
  runPath?: '/system-workflows/standard-rag' | '/system-workflows/tiered-rag' | '/system-workflows/structured-extraction' | '/system-workflows/web-parse' | '/system-workflows/file-parse' | '/system-workflows/video-parse' | '/system-workflows/douyin-parse' | '/system-workflows/thinking-model' | '/system-workflows/event-ingestion' | '/system-workflows/case-ingestion' | '/system-workflows/opinion-ingestion' | '/system-workflows/diary-analysis'
  placeholder?: string
}

/** 保存系统工作流模板画布数据到后端 */
const saveTemplateGraph = async (data: { id: string; name: string; graphJson: string }): Promise<boolean> => {
  const response = await fetch('/api/workflowTemplate/saveGraph', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const result = await response.json()
  if (result.code !== 0) {
    throw new Error(result.message || '保存失败')
  }
  return result.data
}

const SystemWorkflowToolbar = ({ templateId, kbId, runPath = '/system-workflows/case-ingestion', placeholder = '案例入库' }: SystemWorkflowToolbarProps) => {
  const { flowName, setFlowName, saveFlow, clearFlow, nodes, edges, locked, setLocked, undo, redo, canUndo, canRedo, deleteNode } =
    useFlowStore()
  const { setOpen: setDebugOpen } = useFlowDebugStore()
  const navigate = useNavigate()
  const [paramsOpen, setParamsOpen] = useState(false)

  const currentSnapshot = useMemo(() => {
    try {
      return JSON.stringify({ nodes, edges, flowName })
    } catch {
      return ''
    }
  }, [nodes, edges, flowName])
  const savedSnapshotRef = useRef<string>('')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!savedSnapshotRef.current) {
      savedSnapshotRef.current = currentSnapshot
      return
    }
    setDirty(currentSnapshot !== savedSnapshotRef.current)
  }, [currentSnapshot])

  /** 保存工作流到后端模板 */
  const handleSave = async (): Promise<boolean> => {
    const flow = saveFlow()
    let graphJson: string
    try {
      graphJson = JSON.stringify({ nodes: flow.nodes, edges: flow.edges })
    } catch {
      toast.error('工作流数据序列化失败，请检查节点参数')
      return false
    }

    try {
      await saveTemplateGraph({
        id: templateId,
        name: flow.name,
        graphJson,
      })
      savedSnapshotRef.current = currentSnapshot
      setDirty(false)
      toast.success(`已保存（${flow.nodes.length} 节点 · ${flow.edges.length} 连线）`)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误'
      toast.error(`保存失败：${message}`)
      return false
    }
  }

  const handleRun = async () => {
    if (nodes.length === 0) {
      toast.error('请先添加组件')
      return
    }
    await handleSave()
    setDebugOpen(true)
    navigate({
      to: runPath,
      search: { kbId, mode: 'debug' },
    })
  }

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

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b bg-background px-3">
      <div className="flex min-w-0 items-center gap-2">
        <Input
          className="h-8 w-64 border-0 bg-transparent px-1 text-sm font-medium shadow-none focus-visible:ring-0"
          value={flowName}
          onChange={(event) => setFlowName(event.target.value)}
          placeholder={placeholder}
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
        <Button size="sm" variant={dirty ? 'default' : 'outline'} onClick={() => void handleSave()} className="h-8 rounded-md px-2.5">
          <Save data-icon="inline-start" />
          {dirty ? '保存改动 *' : '保存'}
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

export default SystemWorkflowToolbar
