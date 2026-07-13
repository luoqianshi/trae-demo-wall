import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeProps,
  type NodeTypes,
  type OnNodesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Trash2, User } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  novelCharacterApi,
  novelRelationApi,
  type NovelCharacterItem,
  type NovelRelationItem,
} from '../api/novel-api'
import { RELATION_TYPE_LABEL, RELATION_TYPE_OPTIONS } from '../constants'

interface Props {
  novelId: string
  characters: NovelCharacterItem[]
  relations: NovelRelationItem[]
  onCharactersChange: () => void
  onRelationsChange: () => void
}

interface CharacterNodeData extends Record<string, unknown> {
  label: string
  identity?: string
}

const CharacterNode = memo(({ data, selected }: NodeProps<Node<CharacterNodeData>>) => {
  return (
    <div
      className={cn(
        'flex min-w-[140px] flex-col items-center gap-1 rounded-lg border-2 bg-background px-3 py-2 shadow-sm transition-all',
        selected ? 'border-primary shadow-md' : 'border-muted-foreground/30'
      )}
    >
      <Handle type="target" position={Position.Top} className="!size-2 !bg-primary/60" />
      <div className="flex size-8 items-center justify-center rounded-full border bg-muted/40">
        <User className="size-4 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium">{data.label}</div>
      {data.identity && (
        <Badge variant="secondary" className="h-4 px-1 text-[9px]">
          {data.identity}
        </Badge>
      )}
      <Handle type="source" position={Position.Bottom} className="!size-2 !bg-primary/60" />
    </div>
  )
})
CharacterNode.displayName = 'CharacterNode'

const nodeTypes: NodeTypes = { character: CharacterNode }

function parseCanvasPos(pos?: string): { x: number; y: number } | null {
  if (!pos) return null
  const parts = pos.split(',').map((s) => parseFloat(s))
  if (parts.length !== 2 || Number.isNaN(parts[0]!) || Number.isNaN(parts[1]!)) return null
  return { x: parts[0]!, y: parts[1]! }
}

function RelationCanvasInner({
  novelId,
  characters,
  relations,
  onCharactersChange,
  onRelationsChange,
}: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CharacterNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [connectDialog, setConnectDialog] = useState<{ source: string; target: string } | null>(null)
  const [relationType, setRelationType] = useState<string>('friend')
  const [description, setDescription] = useState('')
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

  // 已上图的人物 id
  const onCanvasIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes])
  const offCanvas = useMemo(() => characters.filter((c) => !onCanvasIds.has(c.id)), [characters, onCanvasIds])

  // 初始化：从人物 canvasPos + 关系数据构造 nodes/edges
  useEffect(() => {
    const initialNodes: Node<CharacterNodeData>[] = characters
      .filter((c) => !!c.canvasPos)
      .map((c, i) => {
        const pos = parseCanvasPos(c.canvasPos) ?? { x: 100 + (i % 5) * 180, y: 100 + Math.floor(i / 5) * 140 }
        return {
          id: c.id,
          type: 'character',
          position: pos,
          data: { label: c.name, identity: c.identity } as CharacterNodeData,
        }
      })
    setNodes(initialNodes)

    const initialEdges: Edge[] = relations.map((r) => ({
      id: r.id,
      source: r.sourceId,
      target: r.targetId,
      label: RELATION_TYPE_LABEL[r.relationType] ?? r.relationType,
      data: { relationType: r.relationType, description: r.description },
      labelStyle: { fontSize: 11 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: 'hsl(var(--background))', stroke: 'hsl(var(--border))' },
    }))
    setEdges(initialEdges)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters, relations])

  // 拖拽人物到画布
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const characterId = e.dataTransfer.getData('application/novel-character')
      if (!characterId) return
      const c = characters.find((x) => x.id === characterId)
      if (!c) return
      const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const position = { x: e.clientX - bounds.left, y: e.clientY - bounds.top }
      const pos = `${Math.round(position.x)},${Math.round(position.y)}`
      // 立即持久化
      void novelCharacterApi
        .update({ id: c.id, canvasPos: pos })
        .then(() => {
          onCharactersChange()
          toast.success(`${c.name} 已加入关系图`)
        })
        .catch((err) => toast.error((err as Error).message || '添加失败'))
    },
    [characters, onCharactersChange]
  )

  // 节点位置变更 → 保存 canvasPos
  const handleNodesChange: OnNodesChange<Node<CharacterNodeData>> = useCallback(
    (changes) => {
      onNodesChange(changes)
      changes.forEach((ch) => {
        if (ch.type === 'position' && ch.dragging === false && ch.position) {
          const pos = `${Math.round(ch.position.x)},${Math.round(ch.position.y)}`
          void novelCharacterApi.update({ id: ch.id, canvasPos: pos }).catch(() => {})
        }
      })
    },
    [onNodesChange]
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes)
    },
    [onEdgesChange]
  )

  // 新建连线 → 弹窗选择关系类型
  const handleConnect = useCallback((conn: Connection) => {
    if (!conn.source || !conn.target || conn.source === conn.target) return
    setConnectDialog({ source: conn.source, target: conn.target })
    setRelationType('friend')
    setDescription('')
  }, [])

  const handleConfirmConnect = async () => {
    if (!connectDialog) return
    try {
      const id = await novelRelationApi.add({
        novelId,
        sourceId: connectDialog.source,
        targetId: connectDialog.target,
        relationType,
        description: description.trim() || undefined,
      })
      setEdges((eds) =>
        addEdge(
          {
            id,
            source: connectDialog.source,
            target: connectDialog.target,
            label: RELATION_TYPE_LABEL[relationType] ?? relationType,
            labelStyle: { fontSize: 11 },
            labelBgPadding: [4, 2],
            labelBgBorderRadius: 4,
            labelBgStyle: { fill: 'hsl(var(--background))', stroke: 'hsl(var(--border))' },
          },
          eds
        )
      )
      onRelationsChange()
      toast.success('关系已建立')
    } catch (e) {
      toast.error((e as Error).message || '建立关系失败')
    } finally {
      setConnectDialog(null)
    }
  }

  const handleDeleteEdge = async () => {
    if (!selectedEdgeId) return
    if (!confirm('确定要删除这条关系吗？')) return
    try {
      await novelRelationApi.delete(selectedEdgeId)
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId))
      setSelectedEdgeId(null)
      toast.success('已删除关系')
      onRelationsChange()
    } catch (e) {
      toast.error((e as Error).message || '删除失败')
    }
  }

  const handleRemoveFromCanvas = async (id: string, name: string) => {
    if (!confirm(`将「${name}」从关系图移除？关联关系也会被删除。`)) return
    try {
      // 清空 canvasPos
      await novelCharacterApi.update({ id, canvasPos: '' })
      // 删除相关关系
      const related = relations.filter((r) => r.sourceId === id || r.targetId === id)
      for (const r of related) {
        await novelRelationApi.delete(r.id)
      }
      onCharactersChange()
      onRelationsChange()
    } catch (e) {
      toast.error((e as Error).message || '移除失败')
    }
  }

  return (
    <div className="flex h-full min-h-[500px] gap-3">
      {/* 左侧：未上图人物 */}
      <div className="flex w-52 shrink-0 flex-col gap-2 rounded-md border p-2">
        <div className="flex items-center justify-between px-1 text-xs font-medium text-muted-foreground">
          <span>未上图</span>
          <Badge variant="outline" className="h-4 px-1 text-[10px]">
            {offCanvas.length}
          </Badge>
        </div>
        <div className="flex flex-col gap-1.5 overflow-auto">
          {offCanvas.length === 0 ? (
            <p className="p-2 text-center text-[11px] text-muted-foreground">
              所有人物都在关系图上
            </p>
          ) : (
            offCanvas.map((c) => (
              <div
                key={c.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/novel-character', c.id)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                className="flex cursor-grab items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-xs transition-colors hover:bg-muted/40 active:cursor-grabbing"
              >
                <div className="flex size-6 items-center justify-center rounded-full border bg-muted/40">
                  <User className="size-3 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{c.name}</div>
                  {c.identity && (
                    <div className="truncate text-[10px] text-muted-foreground">{c.identity}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t pt-2 text-[10px] leading-relaxed text-muted-foreground">
          拖拽人物到右侧画布，两个节点相连即可创建关系。
        </div>
      </div>

      {/* 画布 */}
      <div
        className="relative flex-1 rounded-md border"
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
        onDrop={handleDrop}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onEdgeClick={(_, edge) => setSelectedEdgeId(edge.id)}
          onNodeDoubleClick={(_, node) => {
            const c = characters.find((x) => x.id === node.id)
            if (c) void handleRemoveFromCanvas(c.id, c.name)
          }}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
        </ReactFlow>

        {selectedEdgeId && (
          <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-md border bg-background px-2 py-1 shadow-sm">
            <span className="text-xs">已选中关系</span>
            <Button size="sm" variant="ghost" className="h-6" onClick={() => setSelectedEdgeId(null)}>
              取消
            </Button>
            <Button size="sm" variant="destructive" className="h-6" onClick={handleDeleteEdge}>
              <Trash2 className="mr-1 size-3" />
              删除
            </Button>
          </div>
        )}

        {nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            拖拽左侧人物到这里开始构建关系图
          </div>
        )}
      </div>

      {/* 连线关系弹窗 */}
      <Dialog open={!!connectDialog} onOpenChange={(o) => !o && setConnectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>建立人物关系</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>关系类型</Label>
              <Select value={relationType} onValueChange={setRelationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATION_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>描述（可选）</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="补充说明这段关系"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialog(null)}>
              取消
            </Button>
            <Button onClick={handleConfirmConnect}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function RelationCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <RelationCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
