import { useEffect } from 'react'
import { Copy, Pencil, Play, Trash2 } from 'lucide-react'

export interface ContextMenuState {
  x: number
  y: number
  nodeId: string
  nodeType: string
}

interface NodeContextMenuProps {
  menu: ContextMenuState
  onRun: (nodeId: string) => void
  onEdit: (nodeId: string) => void
  onDuplicate: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onClose: () => void
}

/**
 * 画布节点右键菜单。
 */
export function NodeContextMenu({
  menu,
  onRun,
  onEdit,
  onDuplicate,
  onDelete,
  onClose,
}: NodeContextMenuProps) {
  useEffect(() => {
    const handler = () => onClose()
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [onClose])

  const isWorkflow = menu.nodeType === 'workflowNode'
  const isPromptBatch = menu.nodeType === 'promptBatchNode'
  const isLoop = menu.nodeType === 'loopNode'

  const items = [
    isWorkflow && {
      key: 'run',
      label: '运行出图',
      icon: Play,
      onClick: () => onRun(menu.nodeId),
    },
    isPromptBatch && {
      key: 'run-batch',
      label: '批量生成',
      icon: Play,
      onClick: () => onRun(menu.nodeId),
    },
    isLoop && {
      key: 'run-loop',
      label: '执行循环',
      icon: Play,
      onClick: () => onRun(menu.nodeId),
    },
    isWorkflow && {
      key: 'edit',
      label: '编辑参数',
      icon: Pencil,
      onClick: () => onEdit(menu.nodeId),
    },
    {
      key: 'duplicate',
      label: '复制节点',
      icon: Copy,
      onClick: () => onDuplicate(menu.nodeId),
    },
    {
      key: 'delete',
      label: '删除节点',
      icon: Trash2,
      onClick: () => onDelete(menu.nodeId),
      danger: true,
    },
  ].filter(Boolean) as {
    key: string
    label: string
    icon: typeof Play
    onClick: () => void
    danger?: boolean
  }[]

  return (
    <div
      className="fixed z-50 min-w-[150px] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
      style={{ left: menu.x, top: menu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => {
            item.onClick()
            onClose()
          }}
          className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-neutral-100 ${
            item.danger ? 'text-red-600 hover:bg-red-50' : 'text-neutral-700'
          }`}
        >
          <item.icon size={14} />
          {item.label}
        </button>
      ))}
    </div>
  )
}
