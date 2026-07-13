import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Eye, EyeOff, ImageIcon, Lock, MessageSquare, Trash2, Type, Unlock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ComicLayer } from '../types'

interface Props {
  panelId: string | null
  layers: ComicLayer[]
  selectedLayerId: string | null
  onSelect: (layerId: string) => void
  onReorder: (orderedIds: string[]) => void
  onToggleVisible: (layerId: string, visible: boolean) => void
  onToggleLocked: (layerId: string, locked: boolean) => void
  onRename: (layerId: string, name: string) => void
  onDelete: (layerId: string) => void
}

const layerIconMap = {
  image: ImageIcon,
  text: Type,
  bubble: MessageSquare,
  effect: Zap,
}

export function LayerPanel({
  panelId,
  layers,
  selectedLayerId,
  onSelect,
  onReorder,
  onToggleVisible,
  onToggleLocked,
  onRename,
  onDelete,
}: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  // 图层面板从上到下显示：数组末尾（顶层）在最上
  const reversedLayers = [...layers].reverse()

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = reversedLayers.findIndex((l) => l.id === active.id)
    const newIndex = reversedLayers.findIndex((l) => l.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const newOrderReversed = arrayMove(reversedLayers, oldIndex, newIndex)
    const newOrderIds = [...newOrderReversed].reverse().map((l) => l.id)
    onReorder(newOrderIds)
  }

  if (!panelId) {
    return (
      <div className='flex h-full items-center justify-center px-4 text-center text-xs text-neutral-400'>
        请先选中一个分格
      </div>
    )
  }

  if (layers.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-xs text-neutral-400'>
        <ImageIcon size={24} />
        <span>暂无图层</span>
        <span className='text-[10px]'>在左侧素材栏添加图片/文字/气泡</span>
      </div>
    )
  }

  return (
    <div className='h-full overflow-y-auto'>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={reversedLayers.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {reversedLayers.map((layer) => (
            <SortableLayerItem
              key={layer.id}
              layer={layer}
              isSelected={selectedLayerId === layer.id}
              onSelect={() => onSelect(layer.id)}
              onToggleVisible={() => onToggleVisible(layer.id, !layer.visible)}
              onToggleLocked={() => onToggleLocked(layer.id, !layer.locked)}
              onRename={(name) => onRename(layer.id, name)}
              onDelete={() => onDelete(layer.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

interface ItemProps {
  layer: ComicLayer
  isSelected: boolean
  onSelect: () => void
  onToggleVisible: () => void
  onToggleLocked: () => void
  onRename: (name: string) => void
  onDelete: () => void
}

function SortableLayerItem({
  layer,
  isSelected,
  onSelect,
  onToggleVisible,
  onToggleLocked,
  onRename,
  onDelete,
}: ItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: layer.id })
  const [editing, setEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState(layer.name)

  const Icon = layerIconMap[layer.type] ?? ImageIcon

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-1.5 border-b border-neutral-100 px-2 py-1.5 text-xs transition-colors',
        isSelected ? 'bg-blue-50' : 'hover:bg-neutral-50'
      )}
      onClick={onSelect}
    >
      <span
        {...attributes}
        {...listeners}
        className='cursor-grab select-none text-neutral-300 hover:text-neutral-500'
        onClick={(e) => e.stopPropagation()}
      >
        ≡
      </span>
      <button
        className='text-neutral-500 hover:text-neutral-900'
        onClick={(e) => {
          e.stopPropagation()
          onToggleVisible()
        }}
      >
        {layer.visible ? <Eye size={13} /> : <EyeOff size={13} className='text-neutral-300' />}
      </button>
      <button
        className='text-neutral-500 hover:text-neutral-900'
        onClick={(e) => {
          e.stopPropagation()
          onToggleLocked()
        }}
      >
        {layer.locked ? <Lock size={13} className='text-amber-500' /> : <Unlock size={13} />}
      </button>
      <Icon size={13} className='text-neutral-500' />
      {editing ? (
        <Input
          autoFocus
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={() => {
            const trimmed = nameDraft.trim()
            if (trimmed && trimmed !== layer.name) onRename(trimmed)
            setEditing(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') {
              setNameDraft(layer.name)
              setEditing(false)
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className='h-6 flex-1 px-1 text-xs'
        />
      ) : (
        <span
          className='flex-1 cursor-text truncate'
          onDoubleClick={(e) => {
            e.stopPropagation()
            setNameDraft(layer.name)
            setEditing(true)
          }}
        >
          {layer.name}
        </span>
      )}
      <button
        className='hidden text-rose-500 hover:text-rose-600 group-hover:block'
        onClick={(e) => {
          e.stopPropagation()
          if (window.confirm('删除此图层？')) onDelete()
        }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
