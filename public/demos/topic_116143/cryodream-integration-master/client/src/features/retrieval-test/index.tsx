import { useEffect, useMemo, useState } from 'react'
import { Brain, Database, Loader2, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { knowledgeBaseApi, type KnowledgeBase } from '@/features/knowledge/api/knowledge-api'
import {
  retrievalApi,
  type RetrievalResponse,
  type RewrittenQuery,
} from './api/retrieval-api'

type SearchMode = 'hybrid' | 'vector'

const TIME_RANGE_LABELS: Record<string, string> = {
  last_week: '最近一周',
  last_month: '最近一月',
  last_3_months: '最近三月',
  last_year: '最近一年',
  all: '全部时间',
}

export function RetrievalTestPage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [selectedKbId, setSelectedKbId] = useState<string>('')
  const [query, setQuery] = useState<string>('')
  const [mode, setMode] = useState<SearchMode>('hybrid')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RetrievalResponse | null>(null)

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

  const selectedKb = useMemo(
    () => knowledgeBases.find((kb) => kb.id === selectedKbId),
    [knowledgeBases, selectedKbId],
  )

  const handleSearch = async () => {
    if (!selectedKbId) {
      toast.error('请先选择知识库')
      return
    }
    if (!query.trim()) {
      toast.error('请输入检索提问')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res =
        mode === 'hybrid'
          ? await retrievalApi.hybridSearch(selectedKbId, query.trim())
          : await retrievalApi.vectorSearch(selectedKbId, query.trim())
      setResult(res)
      if (res.totalCount === 0) {
        toast.info('未召回任何结果，可换个提问或确认该知识库已入库')
      } else {
        toast.success(`召回 ${res.totalCount} 条，耗时 ${res.elapsedMs}ms`)
      }
    } catch (error) {
      toast.error(`检索失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <Search size={22} className="text-primary" />
        <h1 className="text-xl font-semibold">动态检索测试</h1>
        <Badge variant="outline" className="ml-1">RAG 模块二</Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">检索条件</CardTitle>
          <CardDescription>
            选择知识库，输入模糊提问。混合检索会先用 LLM 重构意图，再做向量召回与元数据软加权排序。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs">
                <Database size={14} /> 知识库
              </Label>
              <Select value={selectedKbId} onValueChange={setSelectedKbId}>
                <SelectTrigger>
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
              <Label className="flex items-center gap-1.5 text-xs">
                <SlidersHorizontal size={14} /> 检索模式
              </Label>
              <Select value={mode} onValueChange={(v) => setMode(v as SearchMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hybrid">混合检索（意图重构 + 软加权）</SelectItem>
                  <SelectItem value="vector">纯向量召回</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">检索提问</Label>
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="例如：最近有哪些关于 AI 提问技巧的方法？"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    void handleSearch()
                  }
                }}
              />
              <Button onClick={() => void handleSearch()} disabled={loading} className="shrink-0">
                {loading ? (
                  <Loader2 size={16} className="mr-1 animate-spin" />
                ) : (
                  <Search size={16} className="mr-1" />
                )}
                检索
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <RewrittenQueryPanel rewritten={result?.rewrittenQuery} mode={mode} />
        <ResultPanel result={result} loading={loading} selectedKbName={selectedKb?.name} />
      </div>
    </div>
  )
}

function RewrittenQueryPanel({
  rewritten,
  mode,
}: {
  rewritten?: RewrittenQuery
  mode: SearchMode
}) {
  return (
    <Card className="flex min-h-0 flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <Brain size={16} className="text-primary" /> 意图重构
        </CardTitle>
        <CardDescription>
          {mode === 'vector' ? '纯向量模式不重构意图' : 'LLM 解析后的标准查询条件'}
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        {!rewritten ? (
          <p className="text-sm text-muted-foreground">检索后展示重构结果</p>
        ) : (
          <ScrollArea className="h-full pr-2">
            <div className="space-y-3 text-sm">
              <Field label="语义查询" value={rewritten.semanticQuery} />
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">时间窗口</span>
                <div>
                  <Badge variant="secondary">
                    {TIME_RANGE_LABELS[rewritten.timeRange] ?? rewritten.timeRange}
                  </Badge>
                </div>
              </div>
              <TagField label="领域" items={rewritten.domains} />
              <TagField label="实体" items={rewritten.entities} />
              <TagField label="概念" items={rewritten.concepts} />
              <TagField label="断言类型" items={rewritten.claimTypes} />
              <div className="flex gap-4">
                <Field label="最低置信度" value={String(rewritten.minConfidence)} inline />
                <Field label="TopK" value={String(rewritten.topK)} inline />
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

function Field({ label, value, inline }: { label: string; value?: string; inline?: boolean }) {
  return (
    <div className={inline ? 'space-y-1' : 'space-y-1'}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm">{value || '—'}</p>
    </div>
  )
}

function TagField({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1">
        {items.length === 0 ? (
          <span className="text-sm text-muted-foreground">—</span>
        ) : (
          items.map((item) => (
            <Badge key={item} variant="outline" className="text-xs">
              {item}
            </Badge>
          ))
        )}
      </div>
    </div>
  )
}

function ResultPanel({
  result,
  loading,
  selectedKbName,
}: {
  result: RetrievalResponse | null
  loading: boolean
  selectedKbName?: string
}) {
  return (
    <Card className="flex min-h-0 flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5">
            <Sparkles size={16} className="text-primary" /> 召回结果
          </span>
          {result && (
            <span className="text-xs font-normal text-muted-foreground">
              {selectedKbName} · {result.totalCount} 条 · {result.elapsedMs}ms
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 size={20} className="mr-2 animate-spin" /> 检索中...
          </div>
        ) : !result ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            输入提问并点击检索
          </div>
        ) : result.chunks.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            未召回任何片段
          </div>
        ) : (
          <ScrollArea className="h-full pr-2">
            <div className="space-y-3">
              {result.chunks.map((chunk, index) => (
                <div key={chunk.chunkId} className="rounded-lg border p-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="px-1.5">#{index + 1}</Badge>
                      {chunk.docTitle && <span className="truncate">{chunk.docTitle}</span>}
                      {typeof chunk.chunkIndex === 'number' && (
                        <span>· 片段 {chunk.chunkIndex}</span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        综合 {chunk.score.toFixed(4)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        向量 {chunk.vectorScore.toFixed(4)}
                      </Badge>
                    </div>
                  </div>
                  <Separator className="my-1.5" />
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {chunk.rawText || chunk.chunkText}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
