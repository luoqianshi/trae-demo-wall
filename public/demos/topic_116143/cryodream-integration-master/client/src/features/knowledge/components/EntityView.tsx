import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, Search, Users, Building2, Package, Lightbulb,
  Shield, Newspaper, Zap, ChevronLeft, Trash2, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  entityApi, type KnowledgeEntity, type EntityDetail, type EntityType,
} from '../api/entity-api'

interface EntityViewProps {
  kbId: string
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Users; color: string; bg: string }> = {
  Person: { label: '人物', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  Company: { label: '公司', icon: Building2, color: 'text-green-600', bg: 'bg-green-50' },
  Product: { label: '产品', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
  Concept: { label: '概念', icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50' },
}

const SOURCE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  official: { label: '官方', color: 'bg-green-100 text-green-700' },
  news: { label: '新闻', color: 'bg-blue-100 text-blue-700' },
  social_media: { label: '社交', color: 'bg-amber-100 text-amber-700' },
}

function parseAliases(aliasesStr: string): string[] {
  if (!aliasesStr) return []
  try {
    const parsed = JSON.parse(aliasesStr)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

function parseMetadata(metadataStr: string): Record<string, unknown> | null {
  if (!metadataStr) return null
  try {
    return JSON.parse(metadataStr)
  } catch { return null }
}

function formatDate(date: string, granularity?: string): string {
  if (!date) return '未知时间'
  const d = new Date(date)
  if (isNaN(d.getTime())) return date
  if (granularity === 'year') return `${d.getFullYear()}年`
  if (granularity === 'month') return `${d.getFullYear()}年${d.getMonth() + 1}月`
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export function EntityView({ kbId }: EntityViewProps) {
  const [loading, setLoading] = useState(true)
  const [entities, setEntities] = useState<KnowledgeEntity[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(24)
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<EntityDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const loadEntities = useCallback(async () => {
    setLoading(true)
    try {
      const res = await entityApi.list({
        kbId,
        page,
        pageSize,
        type: typeFilter === 'all' ? undefined : typeFilter,
        keyword: keyword || undefined,
      })
      setEntities(res.records || [])
      setTotal(res.total || 0)
    } catch (e) {
      console.error('加载实体列表失败', e)
    } finally {
      setLoading(false)
    }
  }, [kbId, page, pageSize, keyword, typeFilter])

  useEffect(() => {
    void loadEntities()
  }, [loadEntities])

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    setSelectedId(id)
    try {
      const res = await entityApi.detail(id)
      setDetail(res)
    } catch (e) {
      console.error('加载实体详情失败', e)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该实体？')) return
    try {
      await entityApi.delete(id)
      if (selectedId === id) {
        setSelectedId(null)
        setDetail(null)
      }
      await loadEntities()
    } catch (e) {
      console.error('删除失败', e)
    }
  }

  // ============ 详情面板 ============
  if (selectedId && detail) {
    const entity = detail.entity
    const typeCfg = TYPE_CONFIG[entity.type] || TYPE_CONFIG.Concept
    const aliases = parseAliases(entity.aliases)
    const metadata = parseMetadata(entity.metadata)
    const Icon = typeCfg.icon

    return (
      <div className='flex h-full flex-col bg-white'>
        {/* 顶栏 */}
        <div className='flex items-center gap-2 border-b border-neutral-100 px-3 py-2'>
          <Button variant='ghost' size='sm' onClick={() => { setSelectedId(null); setDetail(null) }} className='h-7 gap-1 text-xs'>
            <ChevronLeft size={14} /> 返回列表
          </Button>
          <div className='ml-auto flex items-center gap-2'>
            <Button variant='ghost' size='sm' onClick={() => void loadDetail(entity.id)} className='h-7 gap-1 text-xs'>
              <RefreshCw size={12} /> 刷新
            </Button>
            <Button variant='ghost' size='sm' onClick={() => void handleDelete(entity.id)} className='h-7 gap-1 text-xs text-red-500 hover:text-red-600'>
              <Trash2 size={12} /> 删除
            </Button>
          </div>
        </div>

        <div className='min-h-0 flex-1 overflow-y-auto p-4'>
          {/* 实体名片 */}
          <div className={`mb-4 rounded-lg border border-neutral-200 ${typeCfg.bg} p-4`}>
            <div className='flex items-start gap-3'>
              <div className={`flex size-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ${typeCfg.color}`}>
                <Icon size={24} />
              </div>
              <div className='min-w-0 flex-1'>
                <h2 className='text-lg font-bold text-neutral-900'>{entity.name}</h2>
                <div className='mt-1 flex items-center gap-2'>
                  <Badge variant='outline' className={`text-xs ${typeCfg.color}`}>
                    {typeCfg.label}
                  </Badge>
                  {aliases.length > 0 && (
                    <span className='text-xs text-neutral-500'>
                      别名：{aliases.join('、')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {entity.description && (
              <p className='mt-3 text-sm leading-relaxed text-neutral-700'>
                {entity.description}
              </p>
            )}
            {metadata && Object.keys(metadata).length > 0 && (
              <div className='mt-3 flex flex-wrap gap-2'>
                {Object.entries(metadata).map(([k, v]) => (
                  <Badge key={k} variant='secondary' className='text-xs'>
                    {k}：{String(v)}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 相关事件 */}
          <div className='mb-4'>
            <div className='mb-2 flex items-center gap-2'>
              <Zap size={14} className='text-amber-500' />
              <h3 className='text-sm font-semibold text-neutral-800'>
                相关事件 <span className='text-neutral-400'>({detail.eventCount})</span>
              </h3>
            </div>
            {detail.relatedEvents.length === 0 ? (
              <p className='py-3 text-center text-xs text-neutral-400'>暂无相关事件</p>
            ) : (
              <div className='space-y-2'>
                {detail.relatedEvents.map((evt) => {
                  const srcCfg = SOURCE_TYPE_CONFIG[evt.sourceType] || SOURCE_TYPE_CONFIG.news
                  return (
                    <div key={evt.id} className='rounded border border-neutral-200 bg-white p-3 text-xs'>
                      <div className='flex items-center justify-between'>
                        <span className='text-neutral-500'>{formatDate(evt.date, evt.granularity)}</span>
                        <div className='flex items-center gap-1.5'>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] ${srcCfg.color}`}>
                            {srcCfg.label}
                          </span>
                          <span className='text-[10px] text-neutral-400'>置信度 {evt.confidenceScore}/10</span>
                        </div>
                      </div>
                      <p className='mt-1.5 text-neutral-800'>{evt.action}</p>
                      {evt.impactInference && (
                        <p className='mt-1 text-neutral-500'>影响：{evt.impactInference}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 相关案例 */}
          <div className='mb-4'>
            <div className='mb-2 flex items-center gap-2'>
              <Package size={14} className='text-purple-500' />
              <h3 className='text-sm font-semibold text-neutral-800'>
                相关案例 <span className='text-neutral-400'>({detail.caseCount})</span>
              </h3>
            </div>
            {detail.relatedCases.length === 0 ? (
              <p className='py-3 text-center text-xs text-neutral-400'>暂无相关案例</p>
            ) : (
              <div className='space-y-2'>
                {detail.relatedCases.map((c) => {
                  let title = '未命名案例'
                  try {
                    const data = JSON.parse(c.caseData)
                    title = data.title || title
                  } catch { /* ignore */ }
                  return (
                    <div key={c.id} className='rounded border border-neutral-200 bg-white p-3 text-xs'>
                      <p className='text-neutral-800'>{title}</p>
                      {c.searchIndex && (
                        <p className='mt-1 text-[10px] text-neutral-400'>关键词：{c.searchIndex}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
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
            placeholder='搜索实体名称或描述...'
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
            className='h-8 pl-8 text-xs'
          />
        </div>
        <div className='flex items-center gap-2'>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
            <SelectTrigger className='h-8 flex-1 text-xs'>
              <SelectValue placeholder='实体类型' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all' className='text-xs'>全部类型</SelectItem>
              <SelectItem value='Person' className='text-xs'>人物</SelectItem>
              <SelectItem value='Company' className='text-xs'>公司</SelectItem>
              <SelectItem value='Product' className='text-xs'>产品</SelectItem>
              <SelectItem value='Concept' className='text-xs'>概念</SelectItem>
            </SelectContent>
          </Select>
          <Button variant='outline' size='sm' onClick={() => void loadEntities()} disabled={loading} className='h-8 gap-1 text-xs'>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> 刷新
          </Button>
        </div>
      </div>

      {/* 实体网格 */}
      <div className='min-h-0 flex-1 overflow-y-auto p-3'>
        {loading ? (
          <div className='flex h-full items-center justify-center'>
            <Loader2 size={24} className='animate-spin text-neutral-400' />
          </div>
        ) : entities.length === 0 ? (
          <div className='flex h-full flex-col items-center justify-center gap-2 text-neutral-400'>
            <Users size={32} />
            <span className='text-xs'>暂无实体数据</span>
            <span className='text-[10px] text-neutral-400'>
              事件/案例入库时会自动抽取实体并建档
            </span>
          </div>
        ) : (
          <div className='grid grid-cols-2 gap-2'>
            {entities.map((entity) => {
              const typeCfg = TYPE_CONFIG[entity.type] || TYPE_CONFIG.Concept
              const Icon = typeCfg.icon
              const aliases = parseAliases(entity.aliases)
              return (
                <button
                  key={entity.id}
                  onClick={() => void loadDetail(entity.id)}
                  className={`flex flex-col gap-1.5 rounded-lg border border-neutral-200 p-3 text-left transition-all hover:border-neutral-300 hover:shadow-sm ${typeCfg.bg}`}
                >
                  <div className='flex items-center gap-2'>
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-white ${typeCfg.color}`}>
                      <Icon size={16} />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-xs font-semibold text-neutral-900'>{entity.name}</p>
                      <span className={`text-[10px] ${typeCfg.color}`}>{typeCfg.label}</span>
                    </div>
                  </div>
                  {entity.description && (
                    <p className='line-clamp-2 text-[10px] leading-relaxed text-neutral-600'>
                      {entity.description}
                    </p>
                  )}
                  {aliases.length > 0 && (
                    <p className='truncate text-[10px] text-neutral-400'>
                      别名：{aliases.join('、')}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 分页 */}
      {total > pageSize && (
        <div className='flex items-center justify-between border-t border-neutral-100 px-3 py-2 text-xs text-neutral-500'>
          <span>共 {total} 个实体</span>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className='h-7 text-xs'
            >
              上一页
            </Button>
            <span>{page} / {Math.ceil(total / pageSize)}</span>
            <Button
              variant='outline'
              size='sm'
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage((p) => p + 1)}
              className='h-7 text-xs'
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
