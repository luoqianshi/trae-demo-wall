import { colorPalette, type TagColorKey } from '../constants'
import type { Tag } from '../api/tag-api'
import { X } from 'lucide-react'

interface TagPillProps {
  tag: Tag
  size?: 'sm' | 'md'
  onRemove?: (tagId: string) => void
  onClick?: (tag: Tag) => void
}

export function TagPill({ tag, size = 'sm', onRemove, onClick }: TagPillProps) {
  const colorKey = (tag.categoryColor || tag.color || 'gray') as TagColorKey
  const colors = colorPalette[colorKey] || colorPalette.gray

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-[11px] gap-1'
    : 'px-3 py-1 text-xs gap-1.5'

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses} transition-all ${
        onClick ? 'cursor-pointer hover:brightness-95 active:scale-95' : ''
      }`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
      onClick={onClick ? () => onClick(tag) : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span
        className="size-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: colors.text, opacity: 0.5 }}
      />
      {tag.name}
      {onRemove && (
        <button
          type="button"
          className="ml-0.5 inline-flex size-3.5 items-center justify-center rounded-full transition-colors hover:bg-black/10"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(tag.id)
          }}
        >
          <X className="size-2.5" />
        </button>
      )}
    </span>
  )
}
