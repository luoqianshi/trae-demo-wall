import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight, Loader2, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Route as WorkspaceRoute, type NovelWorkspaceTab, type NovelWorkspaceSearch } from '@/routes/_authenticated/novels/$novelId'
import {
  novelApi,
  novelCharacterApi,
  novelOutlineApi,
  novelRelationApi,
  novelTimelineApi,
  type NovelCharacterItem,
  type NovelItem,
  type NovelOutlineNode,
  type NovelRelationItem,
  type NovelTimelineEvent,
} from './api/novel-api'
import { findOutlineNode, findPath } from './stores/novel-workspace-store'
import { OutlineTree } from './components/OutlineTree'
import { ChapterEditor } from './components/ChapterEditor'
import { CharacterListPanel } from './components/CharacterListPanel'
import { RelationCanvas } from './components/RelationCanvas'
import { SettingWikiPanel } from './components/SettingWikiPanel'
import { TimelinePanel } from './components/TimelinePanel'

export function NovelWorkspacePage() {
  const { novelId } = useParams({ strict: false }) as { novelId: string }
  const search = WorkspaceRoute.useSearch()
  const navigate = useNavigate()

  const [novel, setNovel] = useState<NovelItem | null>(null)
  const [outlineTree, setOutlineTree] = useState<NovelOutlineNode[]>([])
  const [characters, setCharacters] = useState<NovelCharacterItem[]>([])
  const [relations, setRelations] = useState<NovelRelationItem[]>([])
  const [events, setEvents] = useState<NovelTimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  const activeTab: NovelWorkspaceTab = search.tab ?? 'outline'
  const activeNodeId = search.nodeId ?? null
  const activeCharacterId = search.characterId ?? null
  const activeEventId = search.eventId ?? null

  /** 更新 URL search 参数（保持其它不变） */
  const patchSearch = useCallback(
    (patch: Partial<NovelWorkspaceSearch>) => {
      void navigate({
        to: '/novels/$novelId',
        params: { novelId },
        search: (prev: unknown) => ({ ...(prev as NovelWorkspaceSearch), ...patch }) as NovelWorkspaceSearch,
        replace: true,
      })
    },
    [navigate, novelId]
  )

  const reloadNovel = useCallback(async () => {
    try {
      const data = await novelApi.get(novelId)
      setNovel(data)
    } catch (e) {
      toast.error((e as Error).message || '加载小说失败')
    }
  }, [novelId])

  const reloadOutline = useCallback(async () => {
    try {
      const tree = await novelOutlineApi.tree(novelId)
      setOutlineTree(tree)
      if (activeNodeId && !findOutlineNode(tree, activeNodeId)) {
        patchSearch({ nodeId: undefined })
      }
    } catch (e) {
      toast.error((e as Error).message || '加载大纲失败')
    }
  }, [novelId, activeNodeId, patchSearch])

  const reloadCharacters = useCallback(async () => {
    try {
      const list = await novelCharacterApi.list(novelId)
      setCharacters(list)
    } catch (e) {
      toast.error((e as Error).message || '加载人物失败')
    }
  }, [novelId])

  const reloadRelations = useCallback(async () => {
    try {
      const list = await novelRelationApi.list(novelId)
      setRelations(list)
    } catch (e) {
      toast.error((e as Error).message || '加载关系失败')
    }
  }, [novelId])

  const reloadEvents = useCallback(async () => {
    try {
      const list = await novelTimelineApi.list(novelId)
      setEvents(list)
    } catch (e) {
      toast.error((e as Error).message || '加载时间线失败')
    }
  }, [novelId])

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      setLoading(true)
      await Promise.all([
        reloadNovel(),
        reloadOutline(),
        reloadCharacters(),
        reloadRelations(),
        reloadEvents(),
      ])
      if (!cancelled) setLoading(false)
    }
    void init()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novelId])

  const activeNode = activeNodeId ? findOutlineNode(outlineTree, activeNodeId) : null
  const breadcrumbs = activeNodeId ? findPath(outlineTree, activeNodeId) : []

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!novel) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <p>找不到该小说</p>
        <Button variant="outline" onClick={() => navigate({ to: '/novels' })}>
          返回列表
        </Button>
      </div>
    )
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => patchSearch({ tab: v as NovelWorkspaceTab })}
      className="flex h-full min-h-0 flex-col"
    >
      {/* 顶栏 */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background/70 px-4 backdrop-blur">
        <SidebarTrigger className="-ms-2 shrink-0" />
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => navigate({ to: '/novels' })}
          title="返回列表"
        >
          <ArrowLeft className="size-4" />
        </Button>

        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span
            className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => navigate({ to: '/novels' })}
          >
            作品架
          </span>
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
          <span className="truncate font-medium">{novel.title}</span>
          {novel.genre && (
            <Badge variant="outline" className="ms-1 font-normal">
              {novel.genre}
            </Badge>
          )}
        </div>

        <div className="mx-auto hidden md:block">
          <TabsList className="h-9">
            <TabsTrigger value="outline">大纲 · 章节</TabsTrigger>
            <TabsTrigger value="characters">人物</TabsTrigger>
            <TabsTrigger value="relations">关系图</TabsTrigger>
            <TabsTrigger value="timeline">时间线</TabsTrigger>
            <TabsTrigger value="settings">世界观</TabsTrigger>
          </TabsList>
        </div>

        <div className="ms-auto flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="hidden lg:inline">字数</span>
            <span className="rounded-md bg-muted/60 px-2 py-1 font-mono text-[11px] tabular-nums">
              {(novel.wordCount ?? 0).toLocaleString()}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigate({ to: '/novels' })}>
                  返回作品架
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* 移动端 Tabs */}
      <div className="border-b bg-background/70 px-4 py-2 backdrop-blur md:hidden">
        <TabsList className="w-full">
          <TabsTrigger value="outline" className="flex-1">
            大纲
          </TabsTrigger>
          <TabsTrigger value="characters" className="flex-1">
            人物
          </TabsTrigger>
          <TabsTrigger value="relations" className="flex-1">
            关系
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex-1">
            时间
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">
            设定
          </TabsTrigger>
        </TabsList>
      </div>

      {/* 大纲 · 章节 */}
      <TabsContent value="outline" className="flex-1 overflow-hidden p-0 data-[state=inactive]:hidden">
        <div className="flex h-full min-h-0">
          <aside className="w-64 shrink-0 border-e bg-muted/20">
            <OutlineTree
              novelId={novelId}
              tree={outlineTree}
              activeId={activeNodeId}
              onSelect={(n) => patchSearch({ nodeId: n.id })}
              onChange={() => {
                void reloadOutline()
                void reloadNovel()
              }}
            />
          </aside>
          <main className="min-h-0 flex-1 overflow-hidden">
            {activeNode ? (
              <ChapterEditor
                novelId={novelId}
                novelWordCount={novel.wordCount ?? 0}
                outlineTree={outlineTree}
                node={activeNode}
                breadcrumbs={breadcrumbs}
                onSaved={() => {
                  void reloadOutline()
                  void reloadNovel()
                }}
              />
            ) : (
              <WorkspaceEmptyHint />
            )}
          </main>
        </div>
      </TabsContent>

      {/* 人物 */}
      <TabsContent
        value="characters"
        className="flex-1 overflow-hidden data-[state=inactive]:hidden"
      >
        <div className="flex h-full flex-col p-4 lg:p-6">
          <SectionHeader
            eyebrow="Characters"
            title="人物设定"
            description="完整档案 · 自定义状态属性 · 剧情快照。"
            compact
          />
          <div className="min-h-0 flex-1">
            <CharacterListPanel
              novelId={novelId}
              characters={characters}
              events={events}
              activeCharacterId={activeCharacterId}
              onActiveChange={(id) => patchSearch({ characterId: id ?? undefined })}
              onChange={() => {
                void reloadCharacters()
              }}
            />
          </div>
        </div>
      </TabsContent>

      {/* 关系图 */}
      <TabsContent
        value="relations"
        className="flex-1 overflow-hidden data-[state=inactive]:hidden"
      >
        <div className="flex h-full flex-col p-4 lg:p-6">
          <SectionHeader
            eyebrow="Relationships"
            title="人物关系图"
            description="拖拽人物到画布，连线选择关系类型。位置会自动持久化。"
            compact
          />
          <div className="min-h-0 flex-1">
            <RelationCanvas
              novelId={novelId}
              characters={characters}
              relations={relations}
              onCharactersChange={reloadCharacters}
              onRelationsChange={reloadRelations}
            />
          </div>
        </div>
      </TabsContent>

      {/* 时间线 */}
      <TabsContent
        value="timeline"
        className="flex-1 overflow-hidden data-[state=inactive]:hidden"
      >
        <div className="flex h-full flex-col p-4 lg:p-6">
          <SectionHeader
            eyebrow="Timeline"
            title="剧情时间线"
            description="记录剧情推进，串联章节、人物与状态快照。"
            compact
          />
          <div className="min-h-0 flex-1">
            <TimelinePanel
              novelId={novelId}
              events={events}
              characters={characters}
              outlineTree={outlineTree}
              activeEventId={activeEventId}
              onActiveChange={(id) => patchSearch({ eventId: id ?? undefined })}
              onChange={reloadEvents}
            />
          </div>
        </div>
      </TabsContent>

      {/* 世界观 */}
      <TabsContent
        value="settings"
        className="flex-1 overflow-hidden data-[state=inactive]:hidden"
      >
        <div className="flex h-full flex-col p-4 lg:p-6">
          <SectionHeader
            eyebrow="World"
            title="世界观 · 设定 Wiki"
            description="沉淀地点、组织、物品、势力，让虚构世界可查询、可复用。"
            compact
          />
          <div className="min-h-0 flex-1">
            <SettingWikiPanel novelId={novelId} />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
  compact,
}: {
  eyebrow: string
  title: string
  description: string
  compact?: boolean
}) {
  return (
    <div className={cn('mb-6 flex flex-col gap-1', compact && 'mb-4')}>
      <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
        {eyebrow}
      </p>
      <div className="flex items-baseline gap-3">
        <h2
          className={cn(
            'font-semibold tracking-tight',
            compact ? 'text-xl' : 'text-2xl sm:text-3xl'
          )}
        >
          {title}
        </h2>
      </div>
      <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function WorkspaceEmptyHint() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-full border border-dashed bg-muted/30">
        <span className="text-lg">📖</span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium">选择或创建一个节点</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          在左侧大纲中新建卷 / 章 / 节，或点击已有节点开始撰写正文。
        </p>
      </div>
    </div>
  )
}
