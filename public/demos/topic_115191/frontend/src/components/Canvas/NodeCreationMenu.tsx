/** 画布双击弹出菜单：添加文本 / 图片 / 视频 / agent导演 / 导演台节点。 */
import { useEffect, useRef } from 'react'

export type CreationNodeType = 'text' | 'image' | 'video' | 'director_stage' | 'agent_director'

interface NodeCreationMenuProps {
  x: number
  y: number
  onSelect: (type: CreationNodeType) => void
  onClose: () => void
}

const ITEMS: { type: CreationNodeType; label: string; icon: string }[] = [
  { type: 'agent_director', label: 'agent导演', icon: '🎬' },
  { type: 'text', label: '文本', icon: '☰' },
  { type: 'image', label: '图片', icon: '🖼️' },
  { type: 'video', label: '视频', icon: '🎥' },
  { type: 'director_stage', label: '导演台', icon: '🎪' },
]

export function NodeCreationMenu({ x, y, onSelect, onClose }: NodeCreationMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="fixed z-50 w-48 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-2xl overflow-hidden py-1"
      style={{ left: x, top: y }}
    >
      <div className="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-800">添加节点</div>
      {ITEMS.map((item) => (
        <button
          key={item.type}
          type="button"
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-200 hover:bg-[#252525] transition-colors text-left"
          onClick={() => onSelect(item.type)}
        >
          <span className="text-base">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
