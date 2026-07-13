import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { OUTLINE_LEVEL_LABEL } from '../constants'
import { novelOutlineApi, type NovelOutlineNode } from '../api/novel-api'

interface Props {
  novelId: string
  tree: NovelOutlineNode[]
  activeId: string | null
  onSelect: (node: NovelOutlineNode) => void
  onChange: () => void
}

interface NodeRowProps {
  node: NovelOutlineNode
  depth: number
  activeId: string | null
  onSelect: (node: NovelOutlineNode) => void
  onChange: () => void
  novelId: string
  expandedIds: Set<string>
  toggleExpand: (id: string) => void
}

const LEVEL_STYLE: Record<number, { dot: string; label: string }> = {
  1: { dot: 'bg-primary', label: 'text-foreground' },
  2: { dot: 'bg-primary/60', label: 'text-foreground/90' },
  3: { dot: 'bg-muted-foreground/60', label: 'text-foreground/80' },
}

function NodeRow({
  node,
  depth,
  activeId,
  onSelect,
  onChange,
  novelId,
  expandedIds,
  toggleExpand,
}: NodeRowProps) {
  const [renaming, setRenaming] = useState(false)
  const [tempTitle, setTempTitle] = useState(node.title)
  const hasChildren = (node.children?.length ?? 0) > 0
  const isExpanded = expandedIds.has(node.id)
  const isActive = activeId === node.id
  const canAddChild = node.level < 3
  const style = LEVEL_STYLE[node.level] ?? LEVEL_STYLE[3]!

  const handleAddChild = async () => {
    const nextLevel = node.level + 1
    if (nextLevel > 3) return
    try {
      await novelOutlineApi.add({ novelId, parentId: node.id, level: nextLevel })
      toast.success(`已新增${OUTLINE_LEVEL_LABEL[nextLevel]}`)
      onChange()
      if (!isExpanded) toggleExpand(node.id)
    } catch (e) {
      toast.error((e as Error).message || '新增失败')
    }
  }

  const handleAddSibling = async () => {
    try {
      await novelOutlineApi.add({
        novelId,
        parentId: node.parentId ?? null,
        level: node.level,
      })
      toast.success(`已新增同级${OUTLINE_LEVEL_LABEL[node.level]}`)
      onChange()
    } catch (e) {
      toast.error((e as Error).message || '新增失败')
    }
  }

  const handleRename = async () => {
    if (!tempTitle.trim() || tempTitle === node.title) {
      setRenaming(false)
      setTempTitle(node.title)
      return
    }
    try {
      await novelOutlineApi.update({ id: node.id, title: tempTitle.trim() })
      toast.success('重命名成功')
      setRenaming(false)
      onChange()
    } catch (e) {
      toast.error((e as Error).message || '重命名失败')
    }
  }

  const handleDelete = async () => {
    if (!confirm(`确定要删除「${node.title}」吗？其下所有子节点也会被删除。`)) return
    try {
      await novelOutlineApi.delete(node.id)
      toast.success('已删除')
      onChange()
    } catch (e) {
      toast.error((e as Error).message || '删除失败')
    }
  }

  return (
    <>
      <div
        className={cn(
          'group relative flex cursor-pointer items-center gap-1.5 rounded-md py-1.5 pe-1.5 text-[13px] transition-colors',
          isActive ? 'bg-primary/10' : 'hover:bg-muted/60'
        )}
        style={{ paddingInlineStart: `${depth * 12 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {/* Active 左侧竖条 */}
        {isActive && (
          <span className="absolute inset-y-1 start-0 w-0.5 rounded-full bg-primary" />
        )}

        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-5 shrink-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              toggleExpand(node.id)
            }}
          >
            {isExpanded ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </Button>
        ) : (
          <span className="size-5 shrink-0" />
        )}

        {/* 层级点 */}
        <span
          className={cn('size-1.5 shrink-0 rounded-full', style.dot)}
          aria-hidden
        />

        {renaming ? (
          <Input
            className="h-6 flex-1 border-0 bg-background px-1.5 shadow-none focus-visible:ring-1"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleRename()
              if (e.key === 'Escape') {
                setRenaming(false)
                setTempTitle(node.title)
              }
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={cn('min-w-0 flex-1 truncate', style.label, isActive && 'font-medium')}>
            {node.title}
          </span>
        )}

        {node.level === 3 && node.wordCount != null && node.wordCount > 0 && (
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
            {node.wordCount}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuGroup>
              {canAddChild && (
                <DropdownMenuItem onClick={handleAddChild}>
                  <Plus data-icon="inline-start" />
                  新增下级「{OUTLINE_LEVEL_LABEL[node.level + 1]}」
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleAddSibling}>
                <Plus data-icon="inline-start" />
                新增同级「{OUTLINE_LEVEL_LABEL[node.level]}」
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRenaming(true)}>
                <Pencil data-icon="inline-start" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                <Trash2 data-icon="inline-start" />
                删除
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isExpanded &&
        node.children?.map((child) => (
          <NodeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            activeId={activeId}
            onSelect={onSelect}
            onChange={onChange}
            novelId={novelId}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
          />
        ))}
    </>
  )
}

export function OutlineTree({ novelId, tree, activeId, onSelect, onChange }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleAddRoot = async () => {
    try {
      await novelOutlineApi.add({ novelId, parentId: null, level: 1 })
      toast.success('已新增卷')
      onChange()
    } catch (e) {
      toast.error((e as Error).message || '新增失败')
    }
  }

  const expandAll = () => {
    const ids = new Set<string>()
    const walk = (nodes: NovelOutlineNode[]) => {
      nodes.forEach((n) => {
        ids.add(n.id)
        if (n.children) walk(n.children)
      })
    }
    walk(tree)
    setExpandedIds(ids)
  }

  const collapseAll = () => setExpandedIds(new Set())

  const totalCount = countNodes(tree)

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-1 border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Outline
          </span>
          {totalCount > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 font-mono text-[10px]">
              {totalCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground"
            onClick={expandAll}
            title="展开全部"
          >
            <ChevronDown className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground"
            onClick={collapseAll}
            title="收起全部"
          >
            <ChevronRight className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground"
            onClick={handleAddRoot}
            title="新建卷"
          >
            <Plus className="size-3" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-0.5 p-2">
          {tree.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed p-6 text-center">
              <p className="text-xs text-muted-foreground">还没有大纲结构</p>
              <Button size="sm" variant="outline" className="h-7" onClick={handleAddRoot}>
                <Plus data-icon="inline-start" />
                新建第一卷
              </Button>
            </div>
          ) : (
            tree.map((node) => (
              <NodeRow
                key={node.id}
                node={node}
                depth={0}
                activeId={activeId}
                onSelect={onSelect}
                onChange={onChange}
                novelId={novelId}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function countNodes(tree: NovelOutlineNode[]): number {
  let count = 0
  const walk = (nodes: NovelOutlineNode[]) => {
    for (const n of nodes) {
      count++
      if (n.children) walk(n.children)
    }
  }
  walk(tree)
  return count
}
