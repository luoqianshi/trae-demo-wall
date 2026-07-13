import { useState, useEffect, useRef, useCallback } from 'react'
import ForceGraph from 'force-graph'
import { Loader2, RefreshCw, Trash2, Network, Clock, List, Search, Filter, Zap, Shield, Newspaper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { eventApi, type KnowledgeEvent, type EventGraphData, type EventGraphNode, type EventGraphEdge, type EventTimelineYear } from '../api/event-api'

interface EventViewProps {
  kbId: string
}

type ViewMode = 'timeline' | 'list' | 'graph'

const GRANULARITY_LABEL: Record<string, string> = {
  exact: '精确',
  month: '月级',
  year: '年级',
}

const SOURCE_TYPE_CONFIG: Record<string, { label: string; icon: typeof Zap; color: string }> = {
  official: { label: '官方', icon: Shield, color: 'text-green-600' },
  news: { label: '新闻', icon: Newspaper, color: 'text-blue-600' },
  social_media: { label: '社交', icon: Zap, color: 'text-amber-600' },
}

const NODE_CONFIG: Record<string, { color: string; size: number; shape: string; label: string }> = {
  entity: { color: '#6366f1', size: 8, shape: 'circle', label: '实体' },
  event: { color: '#f59e0b', size: 7, shape: 'diamond', label: '事件' },
}

const EDGE_COLORS = {
  entityEvent: 'rgba(148, 163, 184, 0.4)',
  eventEvent: 'rgba(239, 68, 68, 0.4)',
}

interface FGNode extends EventGraphNode {
  x?: number; y?: number; val?: number
}

function parseEntities(entitiesStr: string): string[] {
  if (!entitiesStr) return []
  try {
    const parsed = JSON.parse(entitiesStr)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

function formatEventDate(date: string, granularity: string): string {
  if (!date) return '未知时间'
  const d = date.replace(/T.*/, '')
  if (granularity === 'year') return d.substring(0, 4)
  if (granularity === 'month') return d.substring(0, 7)
  return d
}

// ==================== 时间轴视图 ====================
function TimelineView({ kbId, onSelectEvent }: { kbId: string; onSelectEvent: (e: KnowledgeEvent) => void }) {
  const [timeline, setTimeline] = useState<EventTimelineYear[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    eventApi.getTimeline(kbId).then(setTimeline).finally(() => setLoading(false))
  }, [kbId])

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
  if (timeline.length === 0) return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">暂无事件数据</div>

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {timeline.map(yearGroup => (
        <div key={yearGroup.year} className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
              {yearGroup.year}
            </div>
            <div className="flex-1 h-px bg-amber-200" />
          </div>
          {yearGroup.months.map(monthGroup => (
            <div key={monthGroup.month} className="ml-4 mb-3">
              <div className="text-xs font-medium text-muted-foreground mb-1">{monthGroup.month}月</div>
              <div className="space-y-1.5">
                {monthGroup.events.map(evt => {
                  const isSelected = selectedId === evt.id
                  const srcConfig = SOURCE_TYPE_CONFIG[evt.sourceType] || SOURCE_TYPE_CONFIG.news
                  const SrcIcon = srcConfig.icon
                  return (
                    <div
                      key={evt.id}
                      className={`group flex items-start gap-2 px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-50 ring-1 ring-amber-300' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => { setSelectedId(isSelected ? null : evt.id); onSelectEvent(evt) }}
                    >
                      <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-[10px] text-muted-foreground w-10">
                          {formatEventDate(evt.eventDate, evt.timeGranularity).substring(5)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-800 leading-snug">{evt.action}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <SrcIcon size={10} className={srcConfig.color} />
                          <span className="text-[10px] text-muted-foreground">{evt.confidenceScore}/10</span>
                          {evt.impactInference && <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">→ {evt.impactInference}</span>}
                        </div>
                        {parseEntities(evt.entities).length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {parseEntities(evt.entities).slice(0, 4).map((name, i) => (
                              <span key={i} className="px-1 py-0 rounded text-[9px] bg-indigo-50 text-indigo-600">{name}</span>
                            ))}
                            {parseEntities(evt.entities).length > 4 && <span className="text-[9px] text-muted-foreground">+{parseEntities(evt.entities).length - 4}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ==================== 列表视图 ====================
function ListView({ kbId, onSelectEvent }: { kbId: string; onSelectEvent: (e: KnowledgeEvent) => void }) {
  const [events, setEvents] = useState<KnowledgeEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('')

  useEffect(() => {
    setLoading(true)
    eventApi.listEvents({ kbId, pageSize: 100, ...(sourceFilter ? { sourceType: sourceFilter } : {}) })
      .then(res => setEvents(res.records || []))
      .finally(() => setLoading(false))
  }, [kbId, sourceFilter])

  const handleSearch = async () => {
    if (!search.trim()) return
    setLoading(true)
    try {
      const results = await eventApi.searchEvents(kbId, search.trim())
      setEvents(results)
    } finally { setLoading(false) }
  }

  const filtered = search && !loading ? events : events

  return (
    <div className="flex flex-col h-full">
      {/* 搜索和筛选 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-background/50">
        <div className="flex-1 flex items-center gap-1.5">
          <Input placeholder="搜索事件..." value={search} onChange={e => setSearch(e.target.value)}
            className="h-7 text-xs" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSearch}>
            <Search size={14} />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          {['', 'official', 'news', 'social_media'].map(type => {
            const config = type ? SOURCE_TYPE_CONFIG[type] : null
            return (
              <Button key={type} size="sm" variant={sourceFilter === type ? 'default' : 'outline'}
                className="h-6 text-[10px] px-1.5" onClick={() => setSourceFilter(type)}>
                {config ? config.label : '全部'}
              </Button>
            )
          })}
        </div>
      </div>
      {/* 列表 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">暂无事件</div>
        ) : (
          <div className="divide-y">
            {filtered.map(evt => {
              const srcConfig = SOURCE_TYPE_CONFIG[evt.sourceType] || SOURCE_TYPE_CONFIG.news
              const SrcIcon = srcConfig.icon
              return (
                <div key={evt.id} className="px-3 py-2 hover:bg-slate-50 cursor-pointer" onClick={() => onSelectEvent(evt)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-800">{evt.action}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                        <span>{formatEventDate(evt.eventDate, evt.timeGranularity)}</span>
                        <span className="flex items-center gap-0.5"><SrcIcon size={10} className={srcConfig.color} />{srcConfig.label}</span>
                        <span>置信度 {evt.confidenceScore}/10</span>
                        <Badge variant="outline" className="text-[9px] h-3.5 px-1">{GRANULARITY_LABEL[evt.timeGranularity] || evt.timeGranularity}</Badge>
                      </div>
                      {evt.impactInference && <div className="text-[10px] text-slate-500 mt-0.5 truncate">→ {evt.impactInference}</div>}
                    </div>
                    {evt.verificationStatus === 'verified' && <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-green-50 text-green-700">已验证</Badge>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== 关系图视图 ====================
function GraphView({ data }: { data: EventGraphData }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<ReturnType<typeof ForceGraph> | null>(null)
  const [hoverNode, setHoverNode] = useState<FGNode | null>(null)

  useEffect(() => {
    if (!containerRef.current || !data) return
    const fgNodes: FGNode[] = data.nodes.map(n => ({ ...n, val: NODE_CONFIG[n.type]?.size ?? 5 }))
    const fgLinks = data.edges.map(e => ({
      source: e.source, target: e.target, label: e.label,
      _isEntityRelation: e._isEntityRelation || false,
      _color: e._color || (e.label === '参与' ? EDGE_COLORS.entityEvent : EDGE_COLORS.eventEvent),
    }))

    if (fgRef.current) { fgRef.current._destructor(); fgRef.current = null }
    const container = containerRef.current
    const fg = ForceGraph()(container)
      .graphData({ nodes: fgNodes, links: fgLinks })
      .nodeId('id').nodeLabel('label').linkSource('source').linkTarget('target').linkLabel('label')
      .width(container.clientWidth).height(container.clientHeight)
      .backgroundColor('#ffffff')
      .linkColor((link: any) => link._color as string)
      .linkWidth(0).linkDirectionalArrowLength(0)
      .linkCurvature((link: any) => link._isEntityRelation ? 0.2 : 0.1)
      .linkCanvasObjectMode(() => 'replace')
      .linkCanvasObject((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const start = link.source, end = link.target
        if (!start || !end || start.x === undefined || end.x === undefined) return
        const midX = (start.x + end.x) / 2, midY = (start.y + end.y) / 2
        const curvature = link._isEntityRelation ? 0.2 : 0.1
        const dx = end.x - start.x, dy = end.y - start.y
        const cpX = midX + dy * curvature, cpY = midY - dx * curvature
        ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.quadraticCurveTo(cpX, cpY, end.x, end.y)
        ctx.strokeStyle = link._color as string; ctx.lineWidth = link._isEntityRelation ? 1.5 : 0.8; ctx.stroke()
        if (link.label) {
          const labelT = 0.5
          const lmx = (1 - labelT) ** 2 * start.x + 2 * (1 - labelT) * labelT * cpX + labelT ** 2 * end.x
          const lmy = (1 - labelT) ** 2 * start.y + 2 * (1 - labelT) * labelT * cpY + labelT ** 2 * end.y
          const fs = Math.max(9 / globalScale, 2.5)
          ctx.font = `${fs}px Sans-Serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          const text = link.label.length > 8 ? link.label.substring(0, 8) + '..' : link.label
          const tw = ctx.measureText(text).width
          ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(lmx - tw / 2 - 2, lmy - fs / 2 - 1, tw + 4, fs + 2)
          ctx.fillStyle = '#475569'; ctx.fillText(text, lmx, lmy)
        }
      })
      .nodeCanvasObject((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const config = NODE_CONFIG[node.type] || NODE_CONFIG.entity
        const fontSize = Math.max(10 / globalScale, 2)
        const nodeSize = Math.max(config.size / globalScale, 2)
        ctx.fillStyle = config.color; ctx.globalAlpha = 0.85
        if (config.shape === 'circle') { ctx.beginPath(); ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2); ctx.fill() }
        else if (config.shape === 'diamond') {
          ctx.beginPath(); ctx.moveTo(node.x, node.y - nodeSize); ctx.lineTo(node.x + nodeSize, node.y)
          ctx.lineTo(node.x, node.y + nodeSize); ctx.lineTo(node.x - nodeSize, node.y); ctx.closePath(); ctx.fill()
        }
        ctx.globalAlpha = 1
        if (globalScale > 0.6) {
          ctx.font = `${fontSize}px Sans-Serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#334155'
          const displayText = (node.label || '').length > 12 ? node.label.substring(0, 12) + '...' : node.label
          ctx.fillText(displayText, node.x, node.y + nodeSize + 2)
        }
      })
      .nodePointerAreaPaint((node: any, color: string, ctx: CanvasRenderingContext2D) => {
        const size = Math.max(NODE_CONFIG[node.type]?.size ?? 5, 4)
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(node.x, node.y, size + 2, 0, Math.PI * 2); ctx.fill()
      })
      .onNodeClick((node: any) => { fg.centerAt(node.x, node.y, 600); fg.zoom(2.5, 600) })
      .onNodeHover((node: any) => { setHoverNode(node); container.style.cursor = node ? 'pointer' : 'default' })
      .cooldownTicks(200).warmupTicks(50).d3AlphaDecay(0.03).d3VelocityDecay(0.3)
    fgRef.current = fg
    return () => { if (fgRef.current) { fgRef.current._destructor(); fgRef.current = null } }
  }, [data])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (fgRef.current && width > 0 && height > 0) { fgRef.current.width(width); fgRef.current.height(height) }
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex-1 relative bg-white">
      <div ref={containerRef} className="w-full h-full" />
      {hoverNode && (
        <div className="absolute bottom-3 left-3 bg-white border rounded-lg shadow-lg px-3 py-2 max-w-xs text-xs pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NODE_CONFIG[hoverNode.type]?.color }} />
            <span className="font-medium">{NODE_CONFIG[hoverNode.type]?.label}</span>
          </div>
          <div className="font-medium text-sm mb-1">{hoverNode.label}</div>
          {hoverNode.type === 'event' && hoverNode.date && <div className="text-muted-foreground">时间: {formatEventDate(hoverNode.date, hoverNode.granularity || 'exact')}</div>}
          {hoverNode.type === 'event' && hoverNode.action && <div className="text-muted-foreground">行动: {hoverNode.action}</div>}
          {hoverNode.type === 'event' && hoverNode.impactInference && <div className="text-muted-foreground">影响: {hoverNode.impactInference}</div>}
        </div>
      )}
    </div>
  )
}

// ==================== 主组件 ====================
export function EventView({ kbId }: EventViewProps) {
  const [graphData, setGraphData] = useState<EventGraphData | null>(null)
  const [stats, setStats] = useState<{ total: number; bySourceType: Record<string, number>; byYear: Record<string, number>; avgConfidence: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const [clearing, setClearing] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<KnowledgeEvent | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [gd, st] = await Promise.all([eventApi.getGraphData(kbId), eventApi.getStats(kbId)])
      setGraphData(gd)
      setStats(st)
    } catch (e) { console.error('Failed to fetch event data', e) }
    finally { setLoading(false) }
  }, [kbId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleClearData = useCallback(async () => {
    if (!confirm('确定要清空该知识库的所有事件数据吗？此操作不可撤销。')) return
    setClearing(true)
    try { await eventApi.clearData(kbId); setGraphData(null); await fetchData() }
    catch (e) { console.error('Failed to clear event data', e) }
    finally { setClearing(false) }
  }, [kbId, fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground text-sm">加载事件数据...</span>
      </div>
    )
  }

  const hasData = stats && stats.total > 0

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground">
        <p className="text-sm">暂无事件数据</p>
        <p className="text-xs mt-1">请先使用「事件入库」模式处理文档</p>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* 左侧：事件视图 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 工具栏 */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-background/80">
          <div className="flex items-center bg-muted rounded-md p-0.5">
            <Button variant={viewMode === 'timeline' ? 'default' : 'ghost'} size="sm"
              className="h-6 text-[11px] gap-1" onClick={() => setViewMode('timeline')}>
              <Clock size={12} />时间轴
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm"
              className="h-6 text-[11px] gap-1" onClick={() => setViewMode('list')}>
              <List size={12} />列表
            </Button>
            <Button variant={viewMode === 'graph' ? 'default' : 'ghost'} size="sm"
              className="h-6 text-[11px] gap-1" onClick={() => setViewMode('graph')}>
              <Network size={12} />关系图
            </Button>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>事件 {stats?.total ?? 0}</span>
            <span className="mx-0.5">|</span>
            <span>实体 {graphData?.stats.entities ?? 0}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchData}><RefreshCw size={14} /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={handleClearData} disabled={clearing}>
            {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </Button>
        </div>

        {/* 视图内容 */}
        {viewMode === 'timeline' ? (
          <TimelineView kbId={kbId} onSelectEvent={setSelectedEvent} />
        ) : viewMode === 'list' ? (
          <ListView kbId={kbId} onSelectEvent={setSelectedEvent} />
        ) : graphData ? (
          <GraphView data={graphData} />
        ) : null}
      </div>

      {/* 右侧：事件详情面板 */}
      {selectedEvent && (
        <div className="w-64 border-l bg-white p-3 overflow-y-auto shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-amber-600">事件详情</span>
            <button className="text-[10px] text-muted-foreground hover:text-foreground" onClick={() => setSelectedEvent(null)}>关闭</button>
          </div>
          <h3 className="text-xs font-semibold text-slate-800 mb-2">{selectedEvent.action}</h3>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex gap-2">
              <span className="text-muted-foreground shrink-0 w-8">时间</span>
              <span className="text-slate-700">{formatEventDate(selectedEvent.eventDate, selectedEvent.timeGranularity)}</span>
              <Badge variant="outline" className="text-[9px] h-3.5 px-1">{GRANULARITY_LABEL[selectedEvent.timeGranularity] || selectedEvent.timeGranularity}</Badge>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground shrink-0 w-8">来源</span>
              <span className="text-slate-700">{(SOURCE_TYPE_CONFIG[selectedEvent.sourceType] || SOURCE_TYPE_CONFIG.news).label}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground shrink-0 w-8">置信</span>
              <span className="text-slate-700">{selectedEvent.confidenceScore}/10</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground shrink-0 w-8">状态</span>
              <span className="text-slate-700">{selectedEvent.verificationStatus === 'verified' ? '已验证' : '未验证'}</span>
            </div>
            {selectedEvent.impactInference && (
              <div className="flex gap-2">
                <span className="text-muted-foreground shrink-0 w-8">影响</span>
                <span className="text-slate-700">{selectedEvent.impactInference}</span>
              </div>
            )}
            {selectedEvent.sourceUrl && (
              <div className="flex gap-2">
                <span className="text-muted-foreground shrink-0 w-8">链接</span>
                <a href={selectedEvent.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 truncate">{selectedEvent.sourceUrl}</a>
              </div>
            )}
          </div>
          {parseEntities(selectedEvent.entities).length > 0 && (
            <div className="mt-3">
              <h4 className="text-[10px] font-medium text-indigo-600 mb-1">关联实体</h4>
              <div className="flex flex-wrap gap-1">
                {parseEntities(selectedEvent.entities).map((name, i) => (
                  <Badge key={i} variant="secondary" className="text-[9px] h-4 px-1.5 bg-indigo-50 text-indigo-700">{name}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
