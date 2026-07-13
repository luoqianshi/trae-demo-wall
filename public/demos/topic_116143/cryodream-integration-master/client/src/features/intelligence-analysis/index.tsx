import { useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  Brain,
  Database,
  Download,
  FileSearch,
  History,
  Loader2,
  Quote,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { knowledgeBaseApi, type KnowledgeBase } from '@/features/knowledge/api/knowledge-api'
import {
  generationApi,
  type AnalysisHistory,
  type AnalysisResponse,
  type ChunkDetail,
  type Citation,
} from './api/generation-api'

interface ReportSection {
  title: string
  body: string
}

function parseSections(report: string): ReportSection[] {
  if (!report) return []
  const parts = report.split(/^##\s+/m).filter((p) => p.trim())
  return parts.map((part) => {
    const lines = part.split('\n')
    const title = lines[0].trim()
    const body = lines.slice(1).join('\n').trim()
    return { title, body }
  })
}

export function IntelligenceAnalysisPage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [selectedKbId, setSelectedKbId] = useState<string>('')
  const [query, setQuery] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResponse | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyList, setHistoryList] = useState<AnalysisHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [chunkDetail, setChunkDetail] = useState<ChunkDetail | null>(null)
  const [chunkLoading, setChunkLoading] = useState(false)
  const [chunkOpen, setChunkOpen] = useState(false)

  useEffect(() => {
    knowledgeBaseApi
      .list({ current: 1, pageSize: 100 })
      .then((res) => {
        setKnowledgeBases(res.list)
        if (res.list.length > 0) {
          setSelectedKbId((prev) => prev || res.list[0].id)
        }
      })
      .catch(() => toast.error('加载知识库列表失败'))
  }, [])

  const sections = useMemo(() => parseSections(result?.report ?? ''), [result])

  const handleAnalyze = async () => {
    if (!selectedKbId) {
      toast.error('请先选择知识库')
      return
    }
    if (!query.trim()) {
      toast.error('请输入研判提问')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await generationApi.analyze(selectedKbId, query.trim())
      setResult(res)
      toast.success(`研判完成，召回 ${res.retrievedCount} 条，耗时 ${res.elapsedMs}ms`)
    } catch (error) {
      toast.error(`研判失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const list = await generationApi.listHistory(selectedKbId || undefined, 50)
      setHistoryList(list)
    } catch (error) {
      toast.error(`加载历史失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleOpenHistory = (open: boolean) => {
    setHistoryOpen(open)
    if (open) void loadHistory()
  }

  const handleLoadHistory = (h: AnalysisHistory) => {
    let citations: Citation[] = []
    try {
      citations = h.citations ? (JSON.parse(h.citations) as Citation[]) : []
    } catch {
      citations = []
    }
    setQuery(h.userQuery)
    setResult({
      query: h.userQuery,
      report: h.analysisResult,
      citations,
      retrievedCount: h.retrievedCount,
      elapsedMs: h.elapsedMs,
    })
    setHistoryOpen(false)
  }

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await generationApi.deleteHistory(id)
      setHistoryList((prev) => prev.filter((h) => h.id !== id))
      toast.success('已删除')
    } catch (error) {
      toast.error(`删除失败：${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleOpenChunk = async (chunkId: string) => {
    if (!chunkId) return
    setChunkOpen(true)
    setChunkLoading(true)
    setChunkDetail(null)
    try {
      const detail = await generationApi.getChunk(chunkId)
      setChunkDetail(detail)
    } catch (error) {
      toast.error(`加载 Chunk 失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setChunkLoading(false)
    }
  }

  const handleExport = () => {
    if (!result) return
    const md = buildMarkdown(result)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `研判简报-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <FileSearch size={22} className="text-primary" />
        <h1 className="text-xl font-semibold">情报研判</h1>
        <Badge variant="outline" className="ml-1">RAG 模块三</Badge>
        <Sheet open={historyOpen} onOpenChange={handleOpenHistory}>
          <SheetTrigger asChild>
            <Button size="sm" variant="outline" className="ml-auto h-8">
              <History size={15} className="mr-1" /> 研判历史
            </Button>
          </SheetTrigger>
          <SheetContent className="flex w-[420px] flex-col sm:max-w-[420px]">
            <SheetHeader>
              <SheetTitle>研判历史</SheetTitle>
              <SheetDescription>点击任意记录可加载查看，最多展示最近 50 条</SheetDescription>
            </SheetHeader>
            <HistoryList
              list={historyList}
              loading={historyLoading}
              onLoad={handleLoadHistory}
              onDelete={handleDeleteHistory}
            />
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">研判条件</CardTitle>
          <CardDescription>
            选择知识库并提出问题，系统将检索召回相关情报，由情报分析师 LLM 生成带溯源的分层研判简报。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs">
              <Database size={14} /> 知识库
            </Label>
            <Select value={selectedKbId} onValueChange={setSelectedKbId}>
              <SelectTrigger className="sm:max-w-md">
                <SelectValue placeholder="选择知识库" />
              </SelectTrigger>
              <SelectContent>
                {knowledgeBases.map((kb) => (
                  <SelectItem key={kb.id} value={kb.id}>
                    {kb.name}
                    {typeof kb.chunkCount === 'number' ? `（${kb.chunkCount} 片段）` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">研判提问</Label>
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="例如：张三的私域项目最近经营状况如何？是否值得跟进？"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    void handleAnalyze()
                  }
                }}
              />
              <Button onClick={() => void handleAnalyze()} disabled={loading} className="shrink-0">
                {loading ? (
                  <Loader2 size={16} className="mr-1 animate-spin" />
                ) : (
                  <Brain size={16} className="mr-1" />
                )}
                生成研判
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <ReportPanel
          sections={sections}
          loading={loading}
          hasResult={!!result}
          onExport={handleExport}
        />
        <CitationPanel citations={result?.citations ?? []} onCitationClick={handleOpenChunk} />
      </div>

      <Dialog open={chunkOpen} onOpenChange={setChunkOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>溯源 Chunk 详情</DialogTitle>
            <DialogDescription>引用资料对应的知识库原文片段</DialogDescription>
          </DialogHeader>
          {chunkLoading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Loader2 size={18} className="mr-2 animate-spin" /> 加载中...
            </div>
          ) : chunkDetail ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5 text-xs">
                <Badge variant="secondary">片段序号 {chunkDetail.chunkIndex}</Badge>
                <Badge variant="outline">chunkId: {chunkDetail.id.slice(0, 8)}...</Badge>
              </div>
              <ScrollArea className="max-h-[340px] rounded-md border p-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {chunkDetail.rawText || chunkDetail.chunkText || chunkDetail.content}
                </p>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              未找到 Chunk
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function HistoryList({
  list,
  loading,
  onLoad,
  onDelete,
}: {
  list: AnalysisHistory[]
  loading: boolean
  onLoad: (h: AnalysisHistory) => void
  onDelete: (id: string, e: React.MouseEvent) => void
}) {
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <Loader2 size={18} className="mr-2 animate-spin" /> 加载中...
      </div>
    )
  }
  if (list.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        暂无研判历史
      </div>
    )
  }
  return (
    <ScrollArea className="-mx-2 flex-1 px-2">
      <div className="space-y-2">
        {list.map((h) => (
          <div
            key={h.id}
            onClick={() => onLoad(h)}
            className="group cursor-pointer rounded-lg border p-2.5 text-sm transition-colors hover:bg-muted/50"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-2 flex-1 font-medium">{h.userQuery}</p>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => onDelete(h.id, e)}
              >
                <Trash2 size={13} className="text-destructive" />
              </Button>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>召回 {h.retrievedCount} 条</span>
              <span>·</span>
              <span>{h.elapsedMs}ms</span>
              <span>·</span>
              <span>{h.createTime?.replace('T', ' ').slice(0, 16)}</span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

const SECTION_TONE: Record<string, string> = {
  数据: 'border-l-emerald-500',
  事实: 'border-l-emerald-500',
  叙事: 'border-l-amber-500',
  情绪: 'border-l-amber-500',
  建议: 'border-l-blue-500',
  核心: 'border-l-primary',
}

function toneFor(title: string): string {
  const hit = Object.keys(SECTION_TONE).find((k) => title.includes(k))
  return hit ? SECTION_TONE[hit] : 'border-l-muted-foreground/30'
}

function renderWithCitations(text: string) {
  const parts = text.split(/(\[引用:\s*资料\d+\])/g)
  return parts.map((part, i) => {
    if (/^\[引用:\s*资料\d+\]$/.test(part)) {
      return (
        <Badge key={i} variant="secondary" className="mx-0.5 align-middle text-[10px]">
          <Quote size={10} className="mr-0.5" />
          {part.replace(/[[\]]/g, '')}
        </Badge>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function ReportPanel({
  sections,
  loading,
  hasResult,
  onExport,
}: {
  sections: ReportSection[]
  loading: boolean
  hasResult: boolean
  onExport: () => void
}) {
  return (
    <Card className="flex min-h-0 flex-col">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <BadgeCheck size={16} className="text-primary" /> 研判简报
        </CardTitle>
        {hasResult && (
          <Button size="sm" variant="outline" onClick={onExport} className="h-7">
            <Download size={14} className="mr-1" /> 导出 MD
          </Button>
        )}
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 size={20} className="mr-2 animate-spin" /> 情报分析师研判中...
          </div>
        ) : !hasResult ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            输入提问并点击「生成研判」
          </div>
        ) : (
          <ScrollArea className="h-full pr-2">
            <div className="space-y-3">
              {sections.map((sec, i) => (
                <div key={i} className={`rounded-md border-l-4 bg-muted/30 p-3 ${toneFor(sec.title)}`}>
                  <h3 className="mb-1.5 text-sm font-semibold">{sec.title}</h3>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {renderWithCitations(sec.body)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

function confidenceTone(confidence: number): string {
  if (confidence >= 0.7) return 'text-emerald-600'
  if (confidence >= 0.4) return 'text-amber-600'
  return 'text-rose-600'
}

function CitationPanel({
  citations,
  onCitationClick,
}: {
  citations: Citation[]
  onCitationClick: (chunkId: string) => void
}) {
  return (
    <Card className="flex min-h-0 flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <Quote size={16} className="text-primary" /> 溯源锚点
        </CardTitle>
        <CardDescription>点击卡片查看引用的原文 Chunk</CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        {citations.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            研判后展示溯源资料
          </div>
        ) : (
          <ScrollArea className="h-full pr-2">
            <div className="space-y-2.5">
              {citations.map((c) => (
                <div
                  key={c.index}
                  onClick={() => onCitationClick(c.chunkId)}
                  className="cursor-pointer rounded-lg border p-2.5 text-xs transition-colors hover:border-primary/50 hover:bg-muted/40"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <Badge variant="secondary" className="px-1.5">资料{c.index}</Badge>
                    <span className={`font-medium ${confidenceTone(c.confidence)}`}>
                      置信度 {c.confidence}
                    </span>
                  </div>
                  <div className="mb-1 flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-[10px]">{c.source}</Badge>
                    <Badge variant="outline" className="text-[10px]">{c.claimType}</Badge>
                    {c.timeStamp && <Badge variant="outline" className="text-[10px]">{c.timeStamp}</Badge>}
                  </div>
                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground/70">{c.docTitle}</span>
                  </div>
                  <Separator className="my-1.5" />
                  <p className="text-muted-foreground">{c.snippet}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

function buildMarkdown(result: AnalysisResponse): string {
  const lines: string[] = []
  lines.push(`# 情报研判简报`)
  lines.push('')
  lines.push(`> 提问：${result.query}`)
  lines.push(`> 召回 ${result.retrievedCount} 条 · 耗时 ${result.elapsedMs}ms`)
  lines.push('')
  lines.push(result.report)
  lines.push('')
  lines.push('---')
  lines.push('## 溯源锚点')
  result.citations.forEach((c) => {
    lines.push(
      `- 资料${c.index} [来源:${c.source} | 置信度:${c.confidence} | 类型:${c.claimType}${c.timeStamp ? ` | 时间:${c.timeStamp}` : ''}] 文档:${c.docTitle}`,
    )
    lines.push(`  > ${c.snippet}`)
  })
  return lines.join('\n')
}
