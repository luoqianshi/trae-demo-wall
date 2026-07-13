import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { tagApi, type Tag } from '../api/tag-api'
import { colorPalette, type TagColorKey } from '../constants'
import { TagPill } from './tag-pill'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface TagSelectorProps {
  selectedTagIds: string[]
  onChange: (tagIds: string[]) => void
  targetType?: string
  targetId?: string
}

export function TagSelector({ selectedTagIds, onChange }: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    tagApi.listAll().then(setAllTags).catch(() => {})
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedTags = allTags.filter((t) => selectedTagIds.includes(t.id))
  const filteredTags = allTags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  // 按分类分组
  const grouped: Record<string, Tag[]> = {}
  for (const tag of filteredTags) {
    const cat = tag.categoryName || '未分类'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(tag)
  }

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId))
    } else {
      onChange([...selectedTagIds, tagId])
    }
  }

  return (
    <div className="relative" ref={ref}>
      {/* 已选标签 + 触发按钮 */}
      <div
        className={`flex min-h-[34px] flex-wrap items-center gap-1 rounded-lg border bg-background px-2.5 py-1.5 cursor-text transition-colors ${
          open ? 'border-ring ring-1 ring-ring/20' : 'border-input hover:border-ring/50'
        }`}
        onClick={() => setOpen(true)}
      >
        {selectedTags.map((tag) => (
          <TagPill
            key={tag.id}
            tag={tag}
            onRemove={() => toggleTag(tag.id)}
          />
        ))}
        <div className="flex flex-1 items-center gap-1.5 min-w-[80px]">
          <Search className="size-3.5 text-muted-foreground/50 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder={selectedTags.length === 0 ? '搜索或选择标签...' : ''}
            className="flex-1 border-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        <ChevronDown className={`size-3.5 text-muted-foreground/50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {/* 下拉面板 */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-lg border bg-popover shadow-lg">
          <ScrollArea className="max-h-[280px]">
            {Object.keys(grouped).length === 0 && (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                {search ? '无匹配标签' : '暂无可用标签'}
              </div>
            )}
            {Object.entries(grouped).map(([catName, tags], groupIdx) => (
              <div key={catName}>
                {groupIdx > 0 && <Separator />}
                <div className="px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {catName}
                </div>
                {tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id)
                  const colorKey = (tag.categoryColor || tag.color || 'gray') as TagColorKey
                  const colors = colorPalette[colorKey] || colorPalette.gray
                  return (
                    <div
                      key={tag.id}
                      className={`flex cursor-pointer items-center gap-2.5 px-2.5 py-1.5 text-xs transition-colors ${
                        isSelected ? 'bg-accent' : 'hover:bg-accent/50'
                      }`}
                      onClick={() => toggleTag(tag.id)}
                    >
                      <span
                        className="size-2.5 rounded-full ring-1 ring-inset flex-shrink-0"
                        style={{ backgroundColor: colors.bg, ringColor: colors.border }}
                      />
                      <span className="flex-1">{tag.name}</span>
                      {isSelected && (
                        <Check className="size-3.5 text-primary" />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
