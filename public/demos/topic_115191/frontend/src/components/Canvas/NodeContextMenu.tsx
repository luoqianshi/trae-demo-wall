/** 画布节点右键菜单：删除节点 / 复制节点。 */
import { useEffect, useRef } from 'react'

interface NodeContextMenuProps {
  x: number
  y: number
  onDelete: () => void
  onDuplicate: () => void
  onClose: () => void
}

export function NodeContextMenu({ x, y, onDelete, onDuplicate, onClose }: NodeContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  // 防止菜单超出视口底部
  const adjustedY = Math.min(y, window.innerHeight - 120)

  return (
    <div
      ref={ref}
      className="fixed z-50 w-44 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-2xl overflow-hidden py-1"
      style={{ left: x, top: adjustedY }}
    >
      <button
        type="button"
        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-200 hover:bg-[#252525] transition-colors text-left"
        onClick={() => { onDuplicate(); onClose() }}
      >
        <span className="text-base">📋</span>
        <span>复制节点</span>
      </button>
      <button
        type="button"
        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-[#252525] transition-colors text-left"
        onClick={() => { onDelete(); onClose() }}
      >
        <span className="text-base">🗑️</span>
        <span>删除节点</span>
      </button>
    </div>
  )
}
