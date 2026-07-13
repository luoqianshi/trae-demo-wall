import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  getBezierPath,
  useReactFlow,
  useViewport,
  type Connection,
  type EdgeProps,
  type NodeProps,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
  ChevronUp,
  Copy,
  FileText,
  HelpCircle,
  Keyboard,
  Minus,
  MousePointer2,
  Plus,
  ScanSearch,
  Trash2,
  Boxes,
  Ungroup,
  Layers3,
} from 'lucide-react'
import { useFlowStore, type FlowState } from '../stores/useFlowStore'
import CustomNodeComponent from '../nodes/CustomNode'
import type { CustomNode, EdgeType, GenericNodeData, NodeTemplate } from '../types'

const nodeTypes: NodeTypes = {
  genericNode: CustomNodeComponent as unknown as React.ComponentType<NodeProps>,
  noteNode: CustomNodeComponent as unknown as React.ComponentType<NodeProps>,
  groupNode: CustomNodeComponent as unknown as React.ComponentType<NodeProps>,
}

const DefaultEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd }: EdgeProps<EdgeType>) => {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  return <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
}

const edgeTypes: EdgeTypes = {
  default: DefaultEdge,
}

const formatZoomPercentage = (zoom: number) => `${Math.round(zoom * 100)}%`

type ContextMenuState =
  | { type: 'pane'; x: number; y: number; flowPosition: { x: number; y: number } }
  | { type: 'node'; x: number; y: number; node: CustomNode }
  | null

type FlowTestApi = Pick<
  FlowState,
  | 'nodes'
  | 'edges'
  | 'addComponentNode'
  | 'addNoteNode'
  | 'addGroupNode'
  | 'groupNodes'
  | 'ungroupNode'
  | 'deleteNode'
  | 'duplicateNode'
  | 'onConnect'
  | 'undo'
  | 'redo'
  | 'clearFlow'
>

declare global {
  interface Window {
    __flowTestApi?: FlowTestApi
  }
}

const FlowTestBridge = () => {
  const flowApi = useFlowStore() as FlowTestApi

  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__flowTestApi = flowApi
    return () => {
      if (window.__flowTestApi === flowApi) window.__flowTestApi = undefined
    }
  }, [flowApi])

  return null
}

const CanvasShortcuts = () => {
  const { fitView } = useReactFlow()
  const { selectedNode, duplicateNode, deleteSelected, addNoteNode, groupSelected, undo, redo, canUndo, canRedo } = useFlowStore()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable

      if (isTyping) return

      const isMod = event.metaKey || event.ctrlKey

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNode) {
        event.preventDefault()
        deleteSelected()
      }

      if (isMod && event.key.toLowerCase() === 'd' && selectedNode) {
        event.preventDefault()
        duplicateNode(selectedNode.id)
      }

      if (isMod && event.key.toLowerCase() === 'g') {
        event.preventDefault()
        groupSelected()
      }

      if (isMod && event.key.toLowerCase() === 'z' && !event.shiftKey && canUndo()) {
        event.preventDefault()
        undo()
      }

      if ((isMod && event.key.toLowerCase() === 'y' && canRedo()) || (isMod && event.shiftKey && event.key.toLowerCase() === 'z' && canRedo())) {
        event.preventDefault()
        redo()
      }

      if (isMod && event.key === '0') {
        event.preventDefault()
        fitView({ duration: 180, padding: 0.2 })
      }

      if (isMod && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        addNoteNode({ x: 260, y: 180 })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [addNoteNode, canRedo, canUndo, deleteSelected, duplicateNode, fitView, groupSelected, redo, selectedNode, undo])

  return null
}

const CanvasControls = () => {
  const { zoomIn, zoomOut, fitView, setViewport } = useReactFlow()
  const { zoom } = useViewport()
  const { addNoteNode, addGroupNode, selectedNode, duplicateNode, deleteSelected, groupSelected } = useFlowStore()

  return (
    <Panel
      position="bottom-center"
      className="react-flow__controls compact-canvas-controls flex !flex-row items-center gap-1 !overflow-visible rounded-lg border bg-background px-2 py-1 shadow-sm [&>button]:border-0"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="group flex h-8 items-center justify-center gap-0.5 rounded-md px-1 hover:bg-muted" title="画布控制">
            <span className="w-11 text-center text-sm text-muted-foreground group-hover:text-foreground">{formatZoomPercentage(zoom)}</span>
            <ChevronUp className="size-4 text-muted-foreground group-hover:text-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="top" className="w-48">
          <DropdownMenuLabel className="text-xs">画布控制</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 160 })}>
            重置缩放
            <DropdownMenuShortcut>100%</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fitView({ duration: 180, padding: 0.2 })}>
            适应画布
            <DropdownMenuShortcut>Ctrl 0</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => zoomIn({ duration: 120 })}>放大</DropdownMenuItem>
          <DropdownMenuItem onClick={() => zoomOut({ duration: 120 })}>缩小</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button size="icon" variant="ghost" className="size-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => zoomOut({ duration: 120 })} title="缩小">
        <Minus />
      </Button>
      <Button size="icon" variant="ghost" className="size-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => zoomIn({ duration: 120 })} title="放大">
        <Plus />
      </Button>
      <Button size="icon" variant="ghost" className="size-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => fitView({ duration: 180, padding: 0.2 })} title="适应画布">
        <ScanSearch />
      </Button>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <Button size="icon" variant="ghost" className="size-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => addNoteNode({ x: 260, y: 180 })} title="添加便签">
        <FileText />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={() => (selectedNode ? groupSelected() : addGroupNode({ x: 220, y: 140 }))}
        title={selectedNode ? '将选中节点分组' : '添加分组'}
      >
        <Boxes />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        disabled={!selectedNode}
        onClick={() => selectedNode && duplicateNode(selectedNode.id)}
        title="复制选中节点"
      >
        <Copy />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-8 rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
        disabled={!selectedNode}
        onClick={deleteSelected}
        title="删除选中节点"
      >
        <Trash2 />
      </Button>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="size-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" title="帮助">
            <HelpCircle />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-64">
          <DropdownMenuLabel className="text-xs">快捷键</DropdownMenuLabel>
          <DropdownMenuItem>
            <Keyboard />
            适应画布
            <DropdownMenuShortcut>Ctrl 0</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy />
            复制选中节点
            <DropdownMenuShortcut>Ctrl D</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Trash2 />
            删除选中节点
            <DropdownMenuShortcut>Del</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Boxes />
            分组选中节点
            <DropdownMenuShortcut>Ctrl G</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileText />
            添加便签
            <DropdownMenuShortcut>Ctrl N</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Boxes />
            右键画布/节点
            <DropdownMenuShortcut>Menu</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Panel>
  )
}

interface CanvasContextMenuProps {
  menu: ContextMenuState
  onClose: () => void
}

const CanvasContextMenu = ({ menu, onClose }: CanvasContextMenuProps) => {
  const { addNoteNode, addGroupNode, duplicateNode, deleteNode, groupSelected, ungroupNode, selectNode } = useFlowStore()

  if (!menu) return null

  const itemClass = 'flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-xs hover:bg-muted disabled:pointer-events-none disabled:opacity-50'
  const iconClass = 'size-3.5 text-muted-foreground'

  return (
    <div
      className="absolute z-20 w-40 rounded-md border bg-background p-1 shadow-md"
      style={{ left: menu.x, top: menu.y }}
      onMouseLeave={onClose}
    >
      {menu.type === 'pane' ? (
        <>
          <button
            type="button"
            className={itemClass}
            onClick={() => {
              addNoteNode(menu.flowPosition)
              onClose()
            }}
          >
            <FileText className={iconClass} />
            添加便签
          </button>
          <button
            type="button"
            className={itemClass}
            onClick={() => {
              addGroupNode(menu.flowPosition)
              onClose()
            }}
          >
            <Boxes className={iconClass} />
            添加分组
          </button>
        </>
      ) : (
        <>
          <div className="truncate px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
            {menu.node.type === 'genericNode' ? (menu.node.data as GenericNodeData).node.display_name : menu.node.type === 'noteNode' ? '便签' : '分组'}
          </div>
          <button
            type="button"
            className={itemClass}
            onClick={() => {
              duplicateNode(menu.node.id)
              onClose()
            }}
          >
            <Copy className={iconClass} />
            复制节点
          </button>
          {menu.node.type !== 'groupNode' ? (
            <button
              type="button"
              className={itemClass}
              onClick={() => {
                selectNode(menu.node)
                groupSelected()
                onClose()
              }}
            >
              <Boxes className={iconClass} />
              包装为分组
            </button>
          ) : (
            <button
              type="button"
              className={itemClass}
              onClick={() => {
                ungroupNode(menu.node.id)
                onClose()
              }}
            >
              <Ungroup className={iconClass} />
              解组
            </button>
          )}
          <button
            type="button"
            className={itemClass}
            onClick={() => {
              deleteNode(menu.node.id)
              onClose()
            }}
          >
            <Trash2 className={iconClass} />
            删除节点
          </button>
        </>
      )}
    </div>
  )
}

const FlowCanvasInner = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)
  const { screenToFlowPosition } = useReactFlow()
  const {
    nodes,
    edges,
    locked,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addComponentNode,
    selectNode,
    groupSelected,
  } = useFlowStore()
  const selectedCount = nodes.filter((node) => node.selected && node.type !== 'groupNode').length

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const bounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!bounds) return

      const nodeData = event.dataTransfer?.getData('application/reactflow')
      if (!nodeData) return

      const template = JSON.parse(nodeData) as NodeTemplate
      addComponentNode(template, screenToFlowPosition({ x: event.clientX - 130, y: event.clientY - 40 }))
      setContextMenu(null)
    },
    [addComponentNode, screenToFlowPosition]
  )

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: CustomNode) => {
      setContextMenu(null)
      selectNode(node)
    },
    [selectNode]
  )

  const handlePaneClick = useCallback(() => {
    setContextMenu(null)
    selectNode(null)
  }, [selectNode])

  const getMenuPosition = useCallback((event: MouseEvent | React.MouseEvent) => {
    const bounds = reactFlowWrapper.current?.getBoundingClientRect()
    if (!bounds) return { x: event.clientX, y: event.clientY }
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    }
  }, [])

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: CustomNode) => {
      event.preventDefault()
      const position = getMenuPosition(event)
      setContextMenu({ type: 'node', x: position.x, y: position.y, node })
      selectNode(node)
    },
    [getMenuPosition, selectNode]
  )

  const handlePaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault()
      const position = getMenuPosition(event)
      setContextMenu({
        type: 'pane',
        x: position.x,
        y: position.y,
        flowPosition: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      })
      selectNode(null)
    },
    [getMenuPosition, screenToFlowPosition, selectNode]
  )

  const isValidConnection = useCallback((connection: Connection | EdgeType) => Boolean(connection.source && connection.target && connection.source !== connection.target), [])

  return (
    <div ref={reactFlowWrapper} className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-muted/10">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={handleNodeClick}
        onNodeContextMenu={handleNodeContextMenu}
        onPaneClick={handlePaneClick}
        onPaneContextMenu={handlePaneContextMenu}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionRadius={36}
        connectOnClick
        fitView
        nodesDraggable={!locked}
        nodesConnectable={!locked}
        elementsSelectable={!locked}
        className="h-full w-full"
        defaultEdgeOptions={{ type: 'default', animated: false }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Panel position="top-left" className="pointer-events-auto rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground shadow-sm">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <MousePointer2 className="size-3.5" />
            拖拽组件到画布，框选多个节点后 Ctrl G 分组
          </div>
        </Panel>
        {selectedCount > 1 && (
          <Panel position="top-center" className="pointer-events-auto rounded-lg border bg-background px-2 py-1 shadow-sm">
            <Button size="sm" variant="ghost" className="h-7 rounded-md px-2 text-xs" onClick={groupSelected}>
              <Layers3 data-icon="inline-start" />
              将 {selectedCount} 个节点分组
            </Button>
          </Panel>
        )}
        <FlowTestBridge />
        <CanvasShortcuts />
        <CanvasControls />
      </ReactFlow>
      <CanvasContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} />
    </div>
  )
}

const FlowCanvas = () => (
  <ReactFlowProvider>
    <FlowCanvasInner />
  </ReactFlowProvider>
)

export default FlowCanvas
