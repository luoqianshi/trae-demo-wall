import type { Tag } from '../api/tag-api'
import { TagPill } from './tag-pill'

interface TagListProps {
  tags: Tag[]
  onRemoveTag?: (tagId: string) => void
  onClickTag?: (tag: Tag) => void
}

export function TagList({ tags, onRemoveTag, onClickTag }: TagListProps) {
  if (tags.length === 0) {
    return <span className="text-xs text-muted-foreground">暂无标签</span>
  }

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <TagPill
          key={tag.id}
          tag={tag}
          onRemove={onRemoveTag}
          onClick={onClickTag}
        />
      ))}
    </div>
  )
}
