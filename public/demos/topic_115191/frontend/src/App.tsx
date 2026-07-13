/** App 主组件：顶部栏 + 侧边栏 + 画布 + 底部节点面板 + 资产库。 */
import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import type { Node } from '@xyflow/react'
import { useStore } from './store'
import { Sidebar } from './components/Sidebar/Sidebar'
import { FlowCanvas } from './components/Canvas/FlowCanvas'
import { NodeCreationMenu, type CreationNodeType } from './components/Canvas/NodeCreationMenu'
import { NodeContextMenu } from './components/Canvas/NodeContextMenu'
import { NodeChatPanel } from './components/NodeChatPanel/NodeChatPanel'
import { AssetLibrary } from './components/Library/AssetLibrary'
// 按需动态加载：Three.js / R3F / drei 进入独立 chunk，画布首屏不加载 3D 引擎
const DirectorStageEditor = lazy(() => import('./components/DirectorStageEditor').then(m => ({ default: m.DirectorStageEditor })))

function ErrorToast() {
  const error = useStore(s => s.globalError)
  const setError = useStore(s => s.setGlobalError)
  if (!error) return null
  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-3 rounded shadow-lg max-w-2xl">
      <div className="flex items-start gap-3">
        <span className="text-sm flex-1 whitespace-pre-wrap">{error}</span>
        <button
          type="button"
          className="text-white hover:text-gray-200 font-bold"
          onClick={() => setError(null)}
        >
          ×
        </button>
      </div>
    </div>
  )
}

const STAGE_LABELS: Record<string, string> = {
  workflow_started: '工作流已启动...',
  script_analyzing: 'Agent 正在分析剧本...',
  asset_prompt_writing: '正在生成资产提示词...',
  asset_generating: '正在生成资产图片...',
  storyboard_prompt_writing: '正在生成电影故事板提示词...',
  storyboard_generating: '正在生成电影故事板图片...',
}

function WorkflowStatus() {
  const status = useStore(s => s.workflowStatus)
  if (!status) return null
  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a]/90 backdrop-blur border border-gray-700 rounded-full shadow-lg">
      <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-gray-200">{STAGE_LABELS[status] || status}</span>
    </div>
  )
}

function DirectorStageEditorContainer() {
  const open = useStore(s => s.directorStageEditorOpen)
  const stageId = useStore(s => s.directorStageEditorId)
  const close = useStore(s => s.closeDirectorStageEditor)
  if (!open || !stageId) return null
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex items-center justify-center text-gray-400 text-sm">
          加载导演台...
        </div>
      }
    >
      <DirectorStageEditor stageId={stageId} onClose={close} />
    </Suspense>
  )
}

function TopBar({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  const currentProject = useStore(s => s.currentProject)
  return (
    <div className="h-12 bg-[#1a1a1a] border-b border-gray-800 flex items-center justify-between px-4 shrink-0 z-30">
      <div className="flex items-center gap-2">
        <span className="text-white font-semibold text-sm">AI 短剧无限画布</span>
        {currentProject && (
          <span className="text-xs text-gray-500 ml-2">· {currentProject.name}</span>
        )}
      </div>
      <button
        type="button"
        onClick={onOpenLibrary}
        className="px-3 py-1.5 text-xs font-medium text-gray-200 bg-gray-800 hover:bg-gray-700 rounded-full border border-gray-700 transition-colors"
      >
        节点生成历史
      </button>
    </div>
  )
}

export default function App() {
  const currentProject = useStore(s => s.currentProject)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [creationMenu, setCreationMenu] = useState<{
    open: boolean
    x: number
    y: number
    flowPosition: { x: number; y: number }
  } | null>(null)
  const [nodeContextMenu, setNodeContextMenu] = useState<{
    x: number
    y: number
    nodeId: string
  } | null>(null)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const rippleIdRef = useRef(0)

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback((e: React.MouseEvent) => {
    setSelectedNode(null)
    // 涟漪效果：在点击位置创建一个扩散圈
    const id = rippleIdRef.current++
    setRipples(prev => [...prev, { id, x: e.clientX, y: e.clientY }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600)
  }, [])

  const onNodeContextMenu = useCallback((e: React.MouseEvent, node: Node) => {
    e.preventDefault()
    setNodeContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id })
  }, [])

  // 切换项目时清空选中节点，避免底部面板残留上一个项目的节点信息
  useEffect(() => {
    setSelectedNode(null)
  }, [currentProject?.id])

  const createDirectorStage = useStore(s => s.createDirectorStage)
  const addFreeNode = useStore(s => s.addFreeNode)
  const addScriptNode = useStore(s => s.addScriptNode)
  const deleteNode = useStore(s => s.deleteNode)
  const duplicateNode = useStore(s => s.duplicateNode)

  const onPaneDoubleClick = useCallback((e: React.MouseEvent, position: { x: number; y: number }) => {
    setCreationMenu({ open: true, x: e.clientX, y: e.clientY, flowPosition: position })
  }, [])

  const handleMenuSelect = useCallback((type: CreationNodeType) => {
    if (!creationMenu) return
    if (type === 'director_stage') {
      createDirectorStage(creationMenu.flowPosition)
    } else if (type === 'agent_director') {
      addScriptNode(creationMenu.flowPosition)
    } else {
      addFreeNode(creationMenu.flowPosition, type)
    }
    setCreationMenu(null)
  }, [creationMenu, createDirectorStage, addFreeNode, addScriptNode])

  const handleMenuClose = useCallback(() => {
    setCreationMenu(null)
  }, [])

  if (!currentProject) {
    return (
      <div className="flex flex-col h-full bg-[#0a0a0a]">
        <TopBar onOpenLibrary={() => setLibraryOpen(true)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <ErrorToast />
            <WorkflowStatus />
            <div className="text-center text-gray-500">
              <p className="text-lg">欢迎使用 AI 短剧无限画布</p>
              <p className="text-sm mt-2">请在左侧新建或选择一个项目开始</p>
            </div>
          </div>
        </div>
        <AssetLibrary open={libraryOpen} onClose={() => setLibraryOpen(false)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <TopBar onOpenLibrary={() => setLibraryOpen(true)} />
      <WorkflowStatus />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 relative">
          <ErrorToast />
          <FlowCanvas onNodeClick={onNodeClick} onPaneClick={onPaneClick} onPaneDoubleClick={onPaneDoubleClick} onNodeContextMenu={onNodeContextMenu} />
        </div>
      </div>
      <NodeChatPanel
        selectedNode={selectedNode}
        onClose={() => setSelectedNode(null)}
      />
      <DirectorStageEditorContainer />
      <AssetLibrary open={libraryOpen} onClose={() => setLibraryOpen(false)} />
      {creationMenu?.open && (
        <NodeCreationMenu
          x={creationMenu.x}
          y={creationMenu.y}
          onSelect={handleMenuSelect}
          onClose={handleMenuClose}
        />
      )}
      {nodeContextMenu && (
        <NodeContextMenu
          x={nodeContextMenu.x}
          y={nodeContextMenu.y}
          onDelete={() => {
            deleteNode(nodeContextMenu.nodeId)
            setSelectedNode(null)
          }}
          onDuplicate={() => duplicateNode(nodeContextMenu.nodeId)}
          onClose={() => setNodeContextMenu(null)}
        />
      )}
      {/* 画布点击涟漪：从鼠标点击位置扩散一圈 */}
      {ripples.map(r => (
        <div
          key={r.id}
          className="pointer-events-none fixed z-20 rounded-full border border-white/50"
          style={{
            left: r.x,
            top: r.y,
            transform: 'translate(-50%, -50%)',
            animation: 'ripple-expand 0.6s ease-out forwards',
          }}
        />
      ))}
    </div>
  )
}
