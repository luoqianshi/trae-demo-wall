import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, Search, MessageSquare, Trash2, RefreshCw,
  ChevronDown, ChevronUp, AlertTriangle, ShieldCheck, Swords, Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  opinionApi, parseOpinion, type KnowledgeOpinion, type ParsedOpinion,
} from '../api/opinion-api'

interface OpinionViewProps {
  kbId: string
}

const ALIGNMENT_CONFIG: Record<string, { label: string; icon: typeof ShieldCheck; color: string }> = {
  '利益相关': { label: '利益相关', icon: AlertTriangle, color: 'bg-amber-100 text-amber-700' },
  '利益无关': { label: '利益无关', icon: ShieldCheck, color: 'bg-green-100 text-green-700' },
  '竞争抹黑': { label: '竞争抹黑', icon: Swords, color: 'bg-red-100 text-red-700' },
}

function formatDate(date: string): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return date
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function OpinionView({ kbId }: OpinionViewProps) {
  const [loading, setLoading] = useState(true)
  const [opinions, setOpinions] = useState<KnowledgeOpinion[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [alignmentFilter, setAlignmentFilter] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadOpinions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await opinionApi.list({
        kbId,
        page,
        pageSize,
        interestAlignment: alignmentFilter === 'all' ? undefined : alignmentFilter,
        keyword: keyword || undefined,
      })
      setOpinions(res.records || [])
      setTotal(res.total || 0)
    } catch (e) {
      console.error('加载观点列表失败', e)
    } finally {
      setLoading(false)
    }
  }, [kbId, page, pageSize, keyword, alignmentFilter])

  useEffect(() => {
    void loadOpinions()
  }, [loadOpinions])

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该观点？')) return
    try {
      await opinionApi.delete(id)
      await loadOpinions()
    } catch (e) {
      console.error('删除失败', e)
    }
  }

  // ============ 详情面板 ============
  if (selectedId) {
    const raw = opinions.find((o) => o.id === selectedId)
    if (!raw) {
      setSelectedId(null)
      return null
    }
    const opn = parseOpinion(raw)
    const alignCfg = ALIGNMENT_CONFIG[opn.relations.interest_alignment] || ALIGNMENT_CONFIG['利益无关']

    return (
      <div className='flex h-full flex-col bg-white'>
        <div className='flex items-center gap-2 border-b border-neutral-100 px-3 py-2'>
          <Button variant='ghost' size='sm' onClick={() => setSelectedId(null)} className='h-7 gap-1 text-xs'>
            <ChevronDown size={14} className='rotate-90' /> 返回列表
          </Button>
          <div className='ml-auto'>
            <Button variant='ghost' size='sm' onClick={() => void handleDelete(opn.id)} className='h-7 gap-1 text-xs text-red-500 hover:text-red-600'>
              <Trash2 size={12} /> 删除
            </Button>
          </div>
        </div>

        <div className='min-h-0 flex-1 overflow-y-auto p-4'>
          {/* 核心论点 */}
          <div className='mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4'>
            <div className='mb-2 flex items-center gap-2'>
              <MessageSquare size={14} className='text-fuchsia-500' />
              <span className='text-xs font-semibold text-neutral-500'>核心论点</span>
            </div>
            <p className='text-sm leading-relaxed text-neutral-900'>{opn.coreThesis}</p>
          </div>

          {/* 实体关系层 */}
          <div className='mb-4'>
            <h3 className='mb-2 text-xs font-semibold text-neutral-700'>实体关系</h3>
            <div className='space-y-2'>
              <div className='flex items-center gap-2 text-xs'>
                <span className='w-20 text-neutral-500'>主体：</span>
                <Badge variant='outline' className='text-xs text-blue-600'>{opn.relations.source_entity}</Badge>
              </div>
              <div className='flex items-center gap-2 text-xs'>
                <span className='w-20 text-neutral-500'>客体：</span>
                <div className='flex flex-wrap gap-1'>
                  {opn.relations.target_entities.map((t, i) => (
                    <Badge key={i} variant='outline' className='text-xs text-purple-600'>{t}</Badge>
                  ))}
                </div>
              </div>
              <div className='flex items-center gap-2 text-xs'>
                <span className='w-20 text-neutral-500'>利益关系：</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] ${alignCfg.color}`}>
                  {alignCfg.label}
                </span>
              </div>
            </div>
          </div>

          {/* 业务上下文 */}
          <div className='mb-4'>
            <h3 className='mb-2 text-xs font-semibold text-neutral-700'>业务上下文</h3>
            <div className='space-y-2'>
              {opn.context.stance.length > 0 && (
                <div className='flex items-center gap-2 text-xs'>
                  <span className='w-20 text-neutral-500'>立场：</span>
                  <div className='flex flex-wrap gap-1'>
                    {opn.context.stance.map((s, i) => (
                      <Badge key={i} variant='secondary' className='text-xs'>{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {opn.context.applicable_stage.length > 0 && (
                <div className='flex items-center gap-2 text-xs'>
                  <span className='w-20 text-neutral-500'>适用阶段：</span>
                  <div className='flex flex-wrap gap-1'>
                    {opn.context.applicable_stage.map((s, i) => (
                      <Badge key={i} variant='secondary' className='text-xs'>{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 支撑逻辑 */}
          {opn.supportingLogic.length > 0 && (
            <div className='mb-4'>
              <h3 className='mb-2 text-xs font-semibold text-neutral-700'>支撑逻辑</h3>
              <div className='space-y-1.5'>
                {opn.supportingLogic.map((logic, i) => (
                  <div key={i} className='rounded border border-neutral-200 bg-white p-2 text-xs text-neutral-700'>
                    <span className='mr-1 text-neutral-400'>{i + 1}.</span>
                    {logic}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 防伪与失效机制 */}
          <div className='mb-4'>
            <h3 className='mb-2 text-xs font-semibold text-neutral-700'>防伪与失效机制</h3>
            <div className='space-y-2'>
              <div className='flex items-center gap-2 text-xs'>
                <span className='w-20 text-neutral-500'>逻辑严密性：</span>
                <div className='flex items-center gap-1'>
                  <div className='h-2 w-20 overflow-hidden rounded-full bg-neutral-200'>
                    <div
                      className='h-full bg-gradient-to-r from-red-400 to-green-500'
                      style={{ width: `${opn.credibility.logic_rigor * 10}%` }}
                    />
                  </div>
                  <span className='text-xs font-semibold text-neutral-700'>{opn.credibility.logic_rigor}/10</span>
                </div>
              </div>
              {opn.credibility.expiration_trigger && (
                <div className='flex items-start gap-2 text-xs'>
                  <span className='w-20 shrink-0 text-neutral-500'>失效条件：</span>
                  <span className='text-neutral-700'>{opn.credibility.expiration_trigger}</span>
                </div>
              )}
            </div>
          </div>

          {/* 搜索索引 */}
          {opn.searchIndex && (
            <div className='mb-4'>
              <h3 className='mb-2 text-xs font-semibold text-neutral-700'>搜索关键词</h3>
              <p className='text-xs text-neutral-500'>{opn.searchIndex}</p>
            </div>
          )}

          {/* 时间 */}
          <div className='text-[10px] text-neutral-400'>
            创建时间：{formatDate(opn.createTime)}
          </div>
        </div>
      </div>
    )
  }

  // ============ 列表视图 ============
  return (
    <div className='flex h-full flex-col bg-white'>
      {/* 搜索栏 */}
      <div className='space-y-2 border-b border-neutral-100 p-3'>
        <div className='relative'>
          <Search size={14} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400' />
          <Input
            placeholder='搜索核心论点或关键词...'
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
            className='h-8 pl-8 text-xs'
          />
        </div>
        <div className='flex items-center gap-2'>
          <Select value={alignmentFilter} onValueChange={(v) => { setAlignmentFilter(v); setPage(1) }}>
            <SelectTrigger className='h-8 flex-1 text-xs'>
              <SelectValue placeholder='利益相关性' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all' className='text-xs'>全部</SelectItem>
              <SelectItem value='利益相关' className='text-xs'>利益相关</SelectItem>
              <SelectItem value='利益无关' className='text-xs'>利益无关</SelectItem>
              <SelectItem value='竞争抹黑' className='text-xs'>竞争抹黑</SelectItem>
            </SelectContent>
          </Select>
          <Button variant='outline' size='sm' onClick={() => void loadOpinions()} disabled={loading} className='h-8 gap-1 text-xs'>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> 刷新
          </Button>
        </div>
      </div>

      {/* 观点列表 */}
      <div className='min-h-0 flex-1 overflow-y-auto p-3'>
        {loading ? (
          <div className='flex h-full items-center justify-center'>
            <Loader2 size={24} className='animate-spin text-neutral-400' />
          </div>
        ) : opinions.length === 0 ? (
          <div className='flex h-full flex-col items-center justify-center gap-2 text-neutral-400'>
            <MessageSquare size={32} />
            <span className='text-xs'>暂无观点数据</span>
            <span className='text-[10px] text-neutral-400'>
              选择"观点入库"模式上传文档即可自动提取
            </span>
          </div>
        ) : (
          <div className='space-y-2'>
            {opinions.map((raw) => {
              const opn = parseOpinion(raw)
              const alignCfg = ALIGNMENT_CONFIG[opn.relations.interest_alignment] || ALIGNMENT_CONFIG['利益无关']
              const isExpanded = expandedId === opn.id
              return (
                <div
                  key={opn.id}
                  className='rounded-lg border border-neutral-200 bg-white transition-shadow hover:shadow-sm'
                >
                  {/* 卡片头 */}
                  <div className='cursor-pointer p-3' onClick={() => setExpandedId(isExpanded ? null : opn.id)}>
                    <div className='mb-1.5 flex items-center justify-between'>
                      <div className='flex items-center gap-1.5'>
                        <Badge variant='outline' className='text-[10px] text-blue-600'>
                          {opn.relations.source_entity}
                        </Badge>
                        <span className='text-[10px] text-neutral-400'>→</span>
                        <span className='text-[10px] text-neutral-500'>
                          {opn.relations.target_entities.join('、')}
                        </span>
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] ${alignCfg.color}`}>
                          {alignCfg.label}
                        </span>
                        <span className='text-[10px] text-neutral-400'>{opn.credibility.logic_rigor}/10</span>
                        {isExpanded ? <ChevronUp size={12} className='text-neutral-400' /> : <ChevronDown size={12} className='text-neutral-400' />}
                      </div>
                    </div>
                    <p className='line-clamp-2 text-xs leading-relaxed text-neutral-800'>
                      {opn.coreThesis}
                    </p>
                    {opn.context.stance.length > 0 && (
                      <div className='mt-1.5 flex flex-wrap gap-1'>
                        {opn.context.stance.map((s, i) => (
                          <span key={i} className='rounded bg-neutral-100 px-1 py-0.5 text-[10px] text-neutral-500'>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 展开内容 */}
                  {isExpanded && (
                    <div className='border-t border-neutral-100 p-3'>
                      {opn.supportingLogic.length > 0 && (
                        <div className='mb-2'>
                          <p className='mb-1 text-[10px] font-semibold text-neutral-500'>支撑逻辑</p>
                          <ul className='space-y-1'>
                            {opn.supportingLogic.map((l, i) => (
                              <li key={i} className='text-[11px] leading-relaxed text-neutral-700'>
                                <span className='mr-1 text-neutral-400'>{i + 1}.</span>{l}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {opn.credibility.expiration_trigger && (
                        <div className='mb-2'>
                          <p className='mb-1 text-[10px] font-semibold text-neutral-500'>失效条件</p>
                          <p className='text-[11px] text-neutral-600'>{opn.credibility.expiration_trigger}</p>
                        </div>
                      )}
                      <div className='flex items-center justify-between'>
                        <span className='text-[10px] text-neutral-400'>{formatDate(opn.createTime)}</span>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={(e) => { e.stopPropagation(); setSelectedId(opn.id) }}
                          className='h-6 gap-1 text-[11px]'
                        >
                          <Eye size={10} /> 查看详情
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 分页 */}
      {total > pageSize && (
        <div className='flex items-center justify-between border-t border-neutral-100 px-3 py-2 text-xs text-neutral-500'>
          <span>共 {total} 条观点</span>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className='h-7 text-xs'>
              上一页
            </Button>
            <span>{page} / {Math.ceil(total / pageSize)}</span>
            <Button variant='outline' size='sm' disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage((p) => p + 1)} className='h-7 text-xs'>
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
