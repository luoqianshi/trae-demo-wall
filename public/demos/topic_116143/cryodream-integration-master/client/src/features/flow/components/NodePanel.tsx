import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'
import { Boxes, ChevronDown, CircleQuestionMark, Package, PlugZap, Search, type LucideIcon } from 'lucide-react'
import { nodeCategories } from '../config/nodeTemplates'
import { useFlowStore } from '../stores/useFlowStore'
import type { NodeCategory, NodeTemplate } from '../types'

interface NodePanelProps {
  onDragStart: (event: React.DragEvent, node: NodeTemplate) => void
  /** 覆盖默认的全量节点分类，仅展示指定分类 */
  overrideCategories?: NodeCategory[]
}

const iconMap = LucideIcons as unknown as Record<string, LucideIcon>
const sourceFilters = [
  { id: 'all', label: '全部', icon: Boxes },
  { id: 'core', label: '核心', icon: CircleQuestionMark },
  { id: 'bundle', label: '扩展', icon: Package },
  { id: 'mcp', label: 'MCP', icon: PlugZap },
] as const

type SourceFilter = (typeof sourceFilters)[number]['id']

const NodePanel = ({ onDragStart, overrideCategories }: NodePanelProps) => {
  const { addComponentNode } = useFlowStore()
  const baseCategories = overrideCategories ?? nodeCategories
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(baseCategories.map((category) => [category.id, true]))
  )

  const filteredCategories = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    return baseCategories
      .map((category) => ({
        ...category,
        nodes: category.nodes.filter((node) => {
          const source = node.source ?? (node.legacy ? 'legacy' : 'core')
          const matchesSource = sourceFilter === 'all' || source === sourceFilter
          const matchesKeyword =
            !keyword ||
            `${node.display_name} ${node.name} ${node.description} ${category.name} ${node.bundle ?? ''} ${node.mcpServer ?? ''}`
              .toLowerCase()
              .includes(keyword)
          return matchesSource && matchesKeyword
        }),
      }))
      .filter((category) => category.nodes.length > 0)
  }, [query, sourceFilter])

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }))
  }

  return (
    <aside className="flex min-h-0 w-[17rem] shrink-0 flex-col border-r bg-background">
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3">
        <div>
          <div className="text-sm font-semibold">组件</div>
          <div className="text-[11px] text-muted-foreground">拖拽到画布</div>
        </div>
        <Badge variant="outline" className="h-5 rounded px-1.5 text-[11px] font-normal">
          {baseCategories.reduce((count, category) => count + category.nodes.length, 0)}
        </Badge>
      </div>

      <div className="flex flex-col gap-2 border-b p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索组件、扩展或 MCP"
            className="h-8 rounded-md pl-7 text-xs"
          />
        </div>
        <div className="grid grid-cols-4 gap-1">
          {sourceFilters.map((filter) => {
            const Icon = filter.icon
            const active = sourceFilter === filter.id
            return (
              <button
                key={filter.id}
                type="button"
                className={cn(
                  'flex h-7 items-center justify-center gap-1 rounded-md border text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground',
                  active && 'border-primary/30 bg-primary/10 text-primary'
                )}
                onClick={() => setSourceFilter(filter.id)}
              >
                <Icon className="size-3" />
                {filter.label}
              </button>
            )
          })}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-1 p-2">
          {filteredCategories.map((category) => {
            const Icon = iconMap[category.icon] ?? CircleQuestionMark
            const open = openCategories[category.id] ?? true

            return (
              <Collapsible key={category.id} open={open} onOpenChange={() => toggleCategory(category.id)}>
                <CollapsibleTrigger className="group flex h-8 w-full items-center justify-between rounded-md px-2 text-left hover:bg-muted">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-xs font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">{category.nodes.length}</span>
                    <span className="flex size-5 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                      <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} />
                    </span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="flex flex-col gap-1 py-1 pl-3">
                  {category.nodes.map((node) => {
                    const NodeIcon = iconMap[node.icon] ?? CircleQuestionMark
                    return (
                      <div
                        key={node.id}
                        draggable
                        onDragStart={(event) => onDragStart(event, node)}
                        data-testid={`${node.category}${node.display_name}`}
                        className="group flex h-9 cursor-grab items-center gap-2 rounded-md border border-transparent px-2 text-xs hover:border-border hover:bg-muted/60 active:cursor-grabbing"
                        onDoubleClick={() => addComponentNode(node, { x: 120 + Math.random() * 120, y: 120 + Math.random() * 120 })}
                        title={node.display_name}
                      >
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                          <NodeIcon className="size-3.5" />
                        </div>
                        <span className="min-w-0 flex-1 truncate font-medium">{node.display_name}</span>
                      </div>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      </ScrollArea>
    </aside>
  )
}

export default NodePanel
