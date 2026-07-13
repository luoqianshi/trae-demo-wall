import { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCw, Trash2, Search, Briefcase, AlertTriangle, CheckCircle2, ExternalLink, Shield, FileText, Zap, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { caseApi, type KnowledgeCase, type CaseData, type CaseStats, type CaseDetail } from '../api/case-api'

interface CaseViewProps {
  kbId: string
}

const SOURCE_NATURE_LABEL: Record<string, { label: string; color: string }> = {
  official_report: { label: '官方报告', color: 'text-green-700 bg-green-50' },
  first_hand_review: { label: '一手复盘', color: 'text-blue-700 bg-blue-50' },
  third_party_analysis: { label: '三方分析', color: 'text-amber-700 bg-amber-50' },
  PR_article: { label: 'PR稿', color: 'text-red-700 bg-red-50' },
}

function parseCaseData(raw: string | CaseData): CaseData | null {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

function CaseCard({ kc, onSelect }: { kc: KnowledgeCase; onSelect: () => void }) {
  const data = parseCaseData(kc.caseData)
  if (!data) return null
  const srcNature = SOURCE_NATURE_LABEL[data.credibility?.source_nature] || SOURCE_NATURE_LABEL.third_party_analysis

  return (
    <div className="px-3 py-2.5 border-b hover:bg-slate-50 cursor-pointer" onClick={onSelect}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-800 mb-0.5">{data.title}</div>
          {/* 多维标签 */}
          <div className="flex flex-wrap gap-0.5 mb-1">
            {(data.context?.industry || []).slice(0, 3).map((t, i) => (
              <Badge key={i} variant="outline" className="text-[9px] h-3.5 px-1 bg-violet-50 text-violet-700 border-violet-200">{t}</Badge>
            ))}
            {(data.context?.business_model || []).slice(0, 2).map((t, i) => (
              <Badge key={`bm${i}`} variant="outline" className="text-[9px] h-3.5 px-1 bg-sky-50 text-sky-700 border-sky-200">{t}</Badge>
            ))}
            {(data.context?.target_audience || []).slice(0, 2).map((t, i) => (
              <Badge key={`ta${i}`} variant="outline" className="text-[9px] h-3.5 px-1 bg-teal-50 text-teal-700 border-teal-200">{t}</Badge>
            ))}
          </div>
          {/* 困境摘要 */}
          <div className="text-[11px] text-slate-600 line-clamp-2">{data.problem?.symptom_summary}</div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-0.5">
          <Badge className={`text-[9px] h-4 px-1.5 ${srcNature.color}`}>{srcNature.label}</Badge>
          <span className="text-[10px] text-muted-foreground">可信度 {data.credibility?.authenticity_score || '?'}/10</span>
        </div>
      </div>
      {/* 幸存者偏差警告 */}
      {data.credibility?.survivorship_bias_warning && (
        <div className="mt-1 flex items-start gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
          <AlertTriangle size={10} className="shrink-0 mt-0.5" />
          <span className="line-clamp-1">{data.credibility.survivorship_bias_warning}</span>
        </div>
      )}
    </div>
  )
}

function CaseDetailPanel({ caseId, onClose }: { caseId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<CaseDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    caseApi.getCaseDetail(caseId).then(setDetail).finally(() => setLoading(false))
  }, [caseId])

  if (loading) return <div className="w-72 border-l bg-white p-4 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>

  if (!detail) return null
  const data = typeof detail.caseData === 'string' ? parseCaseData(detail.caseData) : detail.caseData
  if (!data) return null

  return (
    <div className="w-72 border-l bg-white p-3 overflow-y-auto shrink-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-violet-600">案例详情</span>
        <button className="text-[10px] text-muted-foreground hover:text-foreground" onClick={onClose}>关闭</button>
      </div>
      <h3 className="text-xs font-semibold text-slate-800 mb-2">{data.title}</h3>

      {/* 多维标签 */}
      <div className="mb-2">
        <span className="text-[10px] text-muted-foreground">行业</span>
        <div className="flex flex-wrap gap-0.5 mt-0.5">
          {(data.context?.industry || []).map((t, i) => <Badge key={i} variant="outline" className="text-[9px] h-3.5 px-1 bg-violet-50 text-violet-700">{t}</Badge>)}
        </div>
      </div>
      <div className="mb-2">
        <span className="text-[10px] text-muted-foreground">商业模式</span>
        <div className="flex flex-wrap gap-0.5 mt-0.5">
          {(data.context?.business_model || []).map((t, i) => <Badge key={i} variant="outline" className="text-[9px] h-3.5 px-1 bg-sky-50 text-sky-700">{t}</Badge>)}
        </div>
      </div>

      {/* 困境 */}
      <div className="mb-2">
        <h4 className="text-[10px] font-medium text-red-600 mb-0.5">困境</h4>
        <p className="text-[11px] text-slate-700">{data.problem?.symptom_summary}</p>
        {data.problem?.root_causes && (
          <ul className="mt-0.5 space-y-0.5">
            {data.problem.rootCauses.map((c, i) => <li key={i} className="text-[10px] text-slate-500 flex items-start gap-1"><span className="text-red-400 mt-0.5">•</span>{c}</li>)}
          </ul>
        )}
      </div>

      {/* 方案 */}
      <div className="mb-2">
        <h4 className="text-[10px] font-medium text-green-600 mb-0.5">方案</h4>
        <div className="flex flex-wrap gap-0.5 mb-0.5">
          {(data.solution?.strategy_type || []).map((t, i) => <Badge key={i} variant="secondary" className="text-[9px] h-3.5 px-1">{t}</Badge>)}
        </div>
        <ol className="space-y-0.5">
          {(data.solution?.execution_steps || []).map((s, i) => <li key={i} className="text-[10px] text-slate-600">{s}</li>)}
        </ol>
      </div>

      {/* 结果 */}
      <div className="mb-2">
        <h4 className="text-[10px] font-medium text-blue-600 mb-0.5">结果</h4>
        <p className="text-[11px] text-slate-700">{data.outcome?.result_summary}</p>
      </div>

      {/* 可信度 */}
      <div className="mb-2">
        <h4 className="text-[10px] font-medium text-amber-600 mb-0.5">可信度</h4>
        <div className="space-y-0.5 text-[10px]">
          <div className="flex items-center gap-1">
            <Shield size={10} />
            <span>{(SOURCE_NATURE_LABEL[data.credibility?.source_nature] || SOURCE_NATURE_LABEL.third_party_analysis).label}</span>
            <span className="ml-auto">{data.credibility?.authenticity_score}/10</span>
          </div>
          {data.credibility?.survivorship_bias_warning && (
            <div className="flex items-start gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              <AlertTriangle size={10} className="shrink-0 mt-0.5" />
              <span>{data.credibility.survivorship_bias_warning}</span>
            </div>
          )}
        </div>
      </div>

      {/* 附属物 */}
      {data.attachments && data.attachments.length > 0 && (
        <div className="mb-2">
          <h4 className="text-[10px] font-medium text-slate-600 mb-0.5">参考资料</h4>
          <div className="space-y-0.5">
            {data.attachments.map((att, i) => (
              <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline">
                <ExternalLink size={9} />{att.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 原文链接 */}
      {detail.sourceDocId && (
        <div className="mt-3 pt-2 border-t">
          <span className="text-[10px] text-muted-foreground">来源文档: {detail.sourceDocId}</span>
        </div>
      )}
    </div>
  )
}

export function CaseView({ kbId }: CaseViewProps) {
  const [cases, setCases] = useState<KnowledgeCase[]>([])
  const [stats, setStats] = useState<CaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [listRes, st] = await Promise.all([
        caseApi.listCases({ kbId, pageSize: 100 }),
        caseApi.getStats(kbId)
      ])
      setCases(listRes.records || [])
      setStats(st)
    } catch (e) { console.error('Failed to fetch case data', e) }
    finally { setLoading(false) }
  }, [kbId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = async () => {
    if (!search.trim()) return
    setLoading(true)
    try {
      const results = await caseApi.searchCases({ kbId, query: search.trim() })
      setCases(results)
    } finally { setLoading(false) }
  }

  const handleClearData = useCallback(async () => {
    if (!confirm('确定要清空该知识库的所有案例数据吗？此操作不可撤销。')) return
    setClearing(true)
    try { await caseApi.clearData(kbId); await fetchData() }
    catch (e) { console.error('Failed to clear case data', e) }
    finally { setClearing(false) }
  }, [kbId, fetchData])

  if (loading && cases.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground text-sm">加载案例数据...</span>
      </div>
    )
  }

  const hasData = stats && stats.total > 0

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground">
        <p className="text-sm">暂无案例数据</p>
        <p className="text-xs mt-1">请先使用「案例入库」模式处理文档</p>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* 左侧：案例列表 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 搜索栏 */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-background/80">
          <div className="flex-1 flex items-center gap-1.5">
            <Input placeholder="搜索案例（症状、行业、关键词）..." value={search} onChange={e => setSearch(e.target.value)}
              className="h-7 text-xs" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSearch}>
              <Search size={14} />
            </Button>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>案例 {stats?.total ?? 0}</span>
            {stats?.avgAuthenticity ? <><span className="mx-0.5">|</span><span>均可信度 {stats.avgAuthenticity}</span></> : null}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchData}><RefreshCw size={14} /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={handleClearData} disabled={clearing}>
            {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </Button>
        </div>

        {/* 案例列表 */}
        <div className="flex-1 overflow-y-auto">
          {cases.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">无匹配案例</div>
          ) : (
            cases.map(kc => (
              <CaseCard key={kc.id} kc={kc} onSelect={() => setSelectedCaseId(selectedCaseId === kc.id ? null : kc.id)} />
            ))
          )}
        </div>
      </div>

      {/* 右侧：详情面板 */}
      {selectedCaseId && <CaseDetailPanel caseId={selectedCaseId} onClose={() => setSelectedCaseId(null)} />}
    </div>
  )
}
