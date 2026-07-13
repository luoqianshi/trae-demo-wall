/** React Flow 主画布容器。 */
import { useCallback } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap, ReactFlowProvider,
  applyEdgeChanges, applyNodeChanges, addEdge,
  useReactFlow,
  type Connection, type EdgeChange, type NodeChange, type Node,
} from '@xyflow/react'
import { useStore } from '../../store'
import { ScriptNode } from '../nodes/ScriptNode'
import { AssetNode } from '../nodes/AssetNode'
import { EpisodeNode } from '../nodes/EpisodeNode'
import { StoryboardNode } from '../nodes/StoryboardNode'
import { VideoNode } from '../nodes/VideoNode'
import { DirectorStageNode } from '../nodes/DirectorStageNode'
import { ReferenceImageNode } from '../nodes/ReferenceImageNode'
import { FreeNode } from '../nodes/FreeNode'

const nodeTypes = {
  script: ScriptNode,
  character: AssetNode,
  scene: AssetNode,
  prop: AssetNode,
  episode: EpisodeNode,
  storyboard: StoryboardNode,
  video: VideoNode,
  director_stage: DirectorStageNode,
  reference_image: ReferenceImageNode,
  free_node: FreeNode,
}

function FlowCanvasInner({
  onNodeClick,
  onPaneClick,
  onPaneDoubleClick,
  onNodeContextMenu,
}: {
  onNodeClick?: (e: any, node: Node) => void
  onPaneClick?: (e: React.MouseEvent) => void
  onPaneDoubleClick?: (e: React.MouseEvent, position: { x: number; y: number }) => void
  onNodeContextMenu?: (e: React.MouseEvent, node: Node) => void
}) {
  const nodes = useStore(s => s.nodes)
  const edges = useStore(s => s.edges)
  const setNodes = useStore(s => s.setNodes)
  const setEdges = useStore(s => s.setEdges)
  const updateStoryboardRefs = useStore(s => s.updateStoryboardRefs)

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds: typeof nodes) => applyNodeChanges(changes, nds)),
    [setNodes],
  )
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds: typeof edges) => applyEdgeChanges(changes, eds)),
    [setEdges],
  )
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds: typeof edges) => addEdge(params, eds)),
    [setEdges],
  )

  const { screenToFlowPosition } = useReactFlow()

  const handleWrapperDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!onPaneDoubleClick) return
    // 双击在节点上时不触发画布菜单
    if ((e.target as HTMLElement).closest('.react-flow__node')) return
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    onPaneDoubleClick(e, position)
  }, [onPaneDoubleClick, screenToFlowPosition])

  const onNodesDelete = useCallback((deletedNodes: Node[]) => {
    const currentNodes = useStore.getState().nodes
    deletedNodes.forEach(node => {
      if (node.type !== 'reference_image') return
      const refId = (node.data as any)?.id as string | undefined
      if (!refId) return
      currentNodes.forEach(n => {
        if (n.type !== 'storyboard') return
        const sbData = n.data as any
        const refs = (sbData?.director_stage_ref_ids || []) as string[]
        if (refs.includes(refId)) {
          updateStoryboardRefs(sbData?.id, refs.filter(id => id !== refId))
        }
      })
    })
  }, [updateStoryboardRefs])

  return (
    <div className="w-full h-full bg-[#0a0a0a]" onDoubleClick={handleWrapperDoubleClick}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        onNodesDelete={onNodesDelete}
        nodeTypes={nodeTypes}
        zoomOnDoubleClick={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{ style: { stroke: '#9ca3af', strokeWidth: 1.5 } }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={1.5} color="rgba(255,255,255,0.18)" />
        <Controls
          className="bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-lg"
          style={{ color: '#e5e7eb' }}
        />
        <MiniMap
          className="bg-[#1a1a1a] border border-gray-800 rounded-lg"
          nodeColor={(n) => {
            switch (n.type) {
              case 'script': return '#6366f1'
              case 'character': return '#ec4899'
              case 'scene': return '#10b981'
              case 'prop': return '#f59e0b'
              case 'episode': return '#a855f7'
              case 'storyboard': return '#0ea5e9'
              case 'video': return '#ef4444'
              default: return '#64748b'
            }
          }}
          maskColor="rgba(10, 10, 10, 0.7)"
        />
      </ReactFlow>
    </div>
  )
}

export function FlowCanvas(props: {
  onNodeClick?: (e: any, node: Node) => void
  onPaneClick?: (e: React.MouseEvent) => void
  onPaneDoubleClick?: (e: React.MouseEvent, position: { x: number; y: number }) => void
  onNodeContextMenu?: (e: React.MouseEvent, node: Node) => void
}) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
