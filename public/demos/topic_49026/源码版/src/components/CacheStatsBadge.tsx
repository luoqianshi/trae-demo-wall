/**
 * 语义缓存统计指示器
 *
 * 企业级技术降维：Redis LangCache / GPTCache → 个人 AI 助手语义缓存
 *
 * 在设置或聊天界面角落展示缓存效果：
 * - 命中率
 * - 节省的 API 调用次数
 * - 估算节省费用
 * - 语义匹配 vs Token 匹配占比
 */

import { useState, useEffect } from 'react'
import { Database, Zap, TrendingUp, RefreshCw, Trash2 } from 'lucide-react'
import { getCacheStats, clearQueryCache } from '../lib/queryCache'

interface CacheStatsData {
  totalQueries: number
  cacheHits: number
  semanticHits: number
  tokenHits: number
  misses: number
  apiCallsSaved: number
  estimatedCostSaved: number
  hitRate: number
  cacheSize: number
}

// ─── 主组件 ─────────────────────────────────────────────────
export function CacheStatsBadge() {
  const [stats, setStats] = useState<CacheStatsData | null>(null)
  const [expanded, setExpanded] = useState(false)

  const refresh = async () => {
    const s = await getCacheStats()
    setStats({
      totalQueries: s.totalQueries,
      cacheHits: s.cacheHits,
      semanticHits: s.semanticHits,
      tokenHits: s.tokenHits,
      misses: s.misses,
      apiCallsSaved: s.apiCallsSaved,
      estimatedCostSaved: s.estimatedCostSaved,
      hitRate: s.hitRate,
      cacheSize: s.cacheSize,
    })
  }

  useEffect(() => {
    refresh()
    // 每 5 秒刷新一次
    const interval = setInterval(() => { refresh() }, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!stats || stats.totalQueries === 0) return null

  const handleClear = async () => {
    await clearQueryCache()
    refresh()
  }

  return (
    <div className="inline-flex flex-col gap-1">
      {/* 紧凑徽章 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zen-sage/5 border border-zen-sage/15 hover:bg-zen-sage/10 transition-colors"
        title="语义缓存统计"
      >
        <Database className="w-3 h-3 text-zen-sage" />
        <span className="text-2xs text-ink-secondary font-medium">
          语义缓存
        </span>
        <span className={`text-2xs font-medium ${stats.hitRate > 30 ? 'text-zen-sage' : 'text-ink-muted'}`}>
          {stats.hitRate}%
        </span>
        {stats.apiCallsSaved > 0 && (
          <span className="text-2xs text-ink-muted flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5" />
            省{stats.apiCallsSaved}次
          </span>
        )}
      </button>

      {/* 展开详情 */}
      {expanded && (
        <div
          className="bg-surface border border-ink-muted/15 rounded-xl p-3 space-y-2 shadow-sm"
          style={{ animation: 'cache-stats-in 0.2s ease-out both' }}
        >
          {/* 标题 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-zen-sage" />
              <span className="text-xs font-medium text-ink-secondary">语义缓存统计</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={refresh}
                className="p-1 rounded-md hover:bg-canvas-warm transition-colors"
                title="刷新"
              >
                <RefreshCw className="w-3 h-3 text-ink-muted" />
              </button>
              <button
                onClick={handleClear}
                className="p-1 rounded-md hover:bg-zen-rose/10 transition-colors"
                title="清空缓存"
              >
                <Trash2 className="w-3 h-3 text-ink-muted hover:text-zen-rose" />
              </button>
            </div>
          </div>

          {/* 统计数据网格 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-canvas-warm/50 rounded-lg p-2 text-center">
              <p className="text-lg font-semibold text-ink-primary">{stats.hitRate}%</p>
              <p className="text-2xs text-ink-tertiary">命中率</p>
            </div>
            <div className="bg-canvas-warm/50 rounded-lg p-2 text-center">
              <p className="text-lg font-semibold text-ink-primary">{stats.apiCallsSaved}</p>
              <p className="text-2xs text-ink-tertiary">节省调用</p>
            </div>
          </div>

          {/* 匹配方式分布 */}
          {stats.cacheHits > 0 && (
            <div className="space-y-1">
              <p className="text-2xs text-ink-tertiary font-medium">匹配方式分布</p>
              <div className="flex h-1.5 rounded-full overflow-hidden bg-ink-muted/10">
                {/* 语义匹配 */}
                <div
                  className="bg-zen-sage"
                  style={{ width: `${(stats.semanticHits / stats.cacheHits) * 100}%` }}
                />
                {/* Token 匹配 */}
                <div
                  className="bg-zen-amber"
                  style={{ width: `${(stats.tokenHits / stats.cacheHits) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-2xs">
                <span className="flex items-center gap-1 text-zen-sage">
                  <span className="w-1.5 h-1.5 rounded-full bg-zen-sage" />
                  语义 {stats.semanticHits}
                </span>
                <span className="flex items-center gap-1 text-zen-amber">
                  <span className="w-1.5 h-1.5 rounded-full bg-zen-amber" />
                  Token {stats.tokenHits}
                </span>
              </div>
            </div>
          )}

          {/* 其他统计 */}
          <div className="flex items-center justify-between text-2xs text-ink-tertiary pt-1 border-t border-ink-muted/10">
            <span>总查询: {stats.totalQueries}</span>
            <span>缓存大小: {stats.cacheSize}</span>
          </div>

          {/* 节省费用 */}
          {stats.estimatedCostSaved > 0 && (
            <div className="flex items-center gap-1.5 text-2xs text-zen-sage pt-1">
              <TrendingUp className="w-3 h-3" />
              <span>估算节省 ¥{stats.estimatedCostSaved.toFixed(3)}</span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes cache-stats-in {
          0% { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
