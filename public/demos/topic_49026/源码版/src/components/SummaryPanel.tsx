import { useState, useEffect, useCallback } from 'react'
import { Calendar, FileText, Sparkles, Loader2, Clock, ChevronRight, Settings2 } from 'lucide-react'
import { BackHeader } from './BackHeader'
import {
  generateDailySummary,
  generateMonthlySummary,
  generateYearlySummary,
  getSummaryHistory,
  getSummaryConfig,
  setSummaryConfig,
  type SummaryResult,
  type SummaryPeriod,
  type SummaryConfig,
  type Summary,
} from '../lib/summaryEngine'

interface SummaryPanelProps {
  onClose: () => void
  defaultTab?: SummaryPeriod
}

export function SummaryPanel({ onClose, defaultTab }: SummaryPanelProps) {
  const [activeTab, setActiveTab] = useState<SummaryPeriod>(defaultTab || 'daily')
  const [loading, setLoading] = useState(false)
  const [currentSummary, setCurrentSummary] = useState<SummaryResult | null>(null)
  const [history, setHistory] = useState<Summary[]>([])
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState<SummaryConfig>(() => getSummaryConfig())

  const loadHistory = useCallback(async () => {
    const h = await getSummaryHistory(activeTab)
    setHistory(h)
  }, [activeTab])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleGenerate = async () => {
    setLoading(true)
    setCurrentSummary(null)
    try {
      let result: SummaryResult
      if (activeTab === 'daily') {
        result = await generateDailySummary()
      } else if (activeTab === 'monthly') {
        result = await generateMonthlySummary()
      } else {
        result = await generateYearlySummary()
      }
      setCurrentSummary(result)
      loadHistory()
    } catch (e) {
      console.error('[Summary] 生成失败:', e)
      setCurrentSummary({
        period: activeTab,
        date: '',
        title: '生成失败',
        content: '总结生成失败，请检查 API Key 配置后重试。',
        highlights: [],
        nextActions: [],
        mood: '',
        peopleInvolved: [],
        mode: 'demo',
        generatedAt: Date.now(),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfigChange = (key: keyof SummaryConfig, value: string | boolean) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    setSummaryConfig({ [key]: value })
  }

  const tabs: { key: SummaryPeriod; label: string; icon: typeof Calendar; color: string }[] = [
    { key: 'daily', label: '每日总结', icon: Calendar, color: 'zen-sage' },
    { key: 'monthly', label: '月度总结', icon: FileText, color: 'zen-amber' },
    { key: 'yearly', label: '年度总结', icon: Sparkles, color: 'zen-indigo' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      {/* 顶部导航 */}
      <BackHeader
        title="时光总结"
        subtitle="日 · 月 · 年 的人生回顾"
        onBack={onClose}
        rightAction={
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-ink-secondary, #57534e)' }}
            aria-label="设置"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        }
      />

      {/* 配置面板 */}
      {showConfig && (
        <div className="px-5 py-4 bg-surface border-b border-ink-muted/20 space-y-3">
          <h3 className="text-sm font-medium text-ink-primary">总结设置</h3>
          <div className="space-y-2.5">
            <label className="flex items-center justify-between">
              <span className="text-sm text-ink-secondary">每日总结</span>
              <input
                type="checkbox"
                checked={config.dailyEnabled}
                onChange={(e) => handleConfigChange('dailyEnabled', e.target.checked)}
                className="w-4 h-4 rounded accent-zen-sage"
              />
            </label>
            {config.dailyEnabled && (
              <div className="flex items-center justify-between pl-4">
                <span className="text-sm text-ink-tertiary flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  生成时间
                </span>
                <input
                  type="time"
                  value={config.dailyTime}
                  onChange={(e) => handleConfigChange('dailyTime', e.target.value)}
                  className="text-sm px-2 py-1 rounded-lg border border-ink-muted/20 bg-canvas text-ink-primary"
                />
              </div>
            )}
            <label className="flex items-center justify-between">
              <span className="text-sm text-ink-secondary">月度总结</span>
              <input
                type="checkbox"
                checked={config.monthlyEnabled}
                onChange={(e) => handleConfigChange('monthlyEnabled', e.target.checked)}
                className="w-4 h-4 rounded accent-zen-sage"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-ink-secondary">年度总结</span>
              <input
                type="checkbox"
                checked={config.yearlyEnabled}
                onChange={(e) => handleConfigChange('yearlyEnabled', e.target.checked)}
                className="w-4 h-4 rounded accent-zen-sage"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-ink-secondary">语音播报总结</span>
              <input
                type="checkbox"
                checked={config.voiceAnnounce}
                onChange={(e) => handleConfigChange('voiceAnnounce', e.target.checked)}
                className="w-4 h-4 rounded accent-zen-sage"
              />
            </label>
          </div>
        </div>
      )}

      {/* 标签栏 */}
      <div className="flex items-center gap-1 px-5 py-2.5 bg-surface border-b border-ink-muted/10">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setCurrentSummary(null) }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? `bg-${tab.color}/10 text-${tab.color}`
                  : 'text-ink-tertiary hover:bg-canvas-warm'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* 生成按钮 */}
        {!currentSummary && !loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-zen-indigo/8 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-zen-indigo" />
            </div>
            <p className="text-sm text-ink-secondary mb-1">
              {activeTab === 'daily' && '生成今天的总结'}
              {activeTab === 'monthly' && '生成本月的总结'}
              {activeTab === 'yearly' && '生成今年的总结'}
            </p>
            <p className="text-xs text-ink-tertiary mb-5 text-center max-w-xs">
              {activeTab === 'daily' && '回顾今天的对话和记忆，提炼关键事项和明日待办'}
              {activeTab === 'monthly' && '回顾本月的关键事件、关系变化和情绪趋势'}
              {activeTab === 'yearly' && '回顾这一年的人生轨迹、重大决策和成长变化'}
            </p>
            <button
              onClick={handleGenerate}
              className="px-5 py-2.5 rounded-xl bg-zen-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              立即生成
            </button>
          </div>
        )}

        {/* 加载中 */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-zen-indigo mb-3" />
            <p className="text-sm text-ink-secondary">正在回顾你的记忆...</p>
            <p className="text-xs text-ink-tertiary mt-1">这可能需要几秒钟</p>
          </div>
        )}

        {/* 总结结果 */}
        {currentSummary && !loading && (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* 标题卡 */}
            <div className="rounded-2xl bg-surface border border-ink-muted/15 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-serif font-semibold text-ink-primary">
                    {currentSummary.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-ink-tertiary">
                      {new Date(currentSummary.generatedAt).toLocaleString('zh-CN')}
                    </span>
                    {currentSummary.mode === 'demo' && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-zen-amber/10 text-zen-amber">
                        示例模式
                      </span>
                    )}
                  </div>
                </div>
                {currentSummary.mood && (
                  <span className="text-xs px-2 py-1 rounded-lg bg-zen-sage/10 text-zen-sage font-medium">
                    {currentSummary.mood}
                  </span>
                )}
              </div>
              {/* 正文 */}
              <div className="text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap">
                {currentSummary.content}
              </div>
            </div>

            {/* 关键事项 */}
            {currentSummary.highlights.length > 0 && (
              <div className="rounded-2xl bg-surface border border-ink-muted/15 p-4">
                <h4 className="text-xs font-medium text-ink-tertiary mb-2.5 uppercase tracking-wide">
                  关键事项
                </h4>
                <div className="space-y-2">
                  {currentSummary.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-zen-amber/10 text-zen-amber text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-ink-primary leading-relaxed">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 待办事项 */}
            {currentSummary.nextActions.length > 0 && (
              <div className="rounded-2xl bg-surface border border-ink-muted/15 p-4">
                <h4 className="text-xs font-medium text-ink-tertiary mb-2.5 uppercase tracking-wide">
                  {activeTab === 'daily' ? '明日待办' : activeTab === 'monthly' ? '下月关注' : '新年目标'}
                </h4>
                <div className="space-y-2">
                  {currentSummary.nextActions.map((a, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-zen-sage flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-ink-primary leading-relaxed">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 涉及人物 */}
            {currentSummary.peopleInvolved.length > 0 && (
              <div className="rounded-2xl bg-surface border border-ink-muted/15 p-4">
                <h4 className="text-xs font-medium text-ink-tertiary mb-2.5 uppercase tracking-wide">
                  涉及人物
                </h4>
                <div className="flex flex-wrap gap-2">
                  {currentSummary.peopleInvolved.map((p, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-zen-indigo/8 text-zen-indigo text-xs font-medium"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 重新生成 */}
            <button
              onClick={handleGenerate}
              className="w-full py-2.5 rounded-xl border border-ink-muted/20 text-sm text-ink-secondary hover:bg-canvas-warm transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              重新生成
            </button>
          </div>
        )}

        {/* 历史总结 */}
        {history.length > 0 && !currentSummary && !loading && (
          <div className="max-w-2xl mx-auto mt-6">
            <h4 className="text-xs font-medium text-ink-tertiary mb-3 uppercase tracking-wide">
              历史总结
            </h4>
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="rounded-xl bg-surface border border-ink-muted/15 p-3.5 hover:border-ink-muted/30 transition-colors cursor-pointer"
                  onClick={() => {
                    setCurrentSummary({
                      period: h.period,
                      date: h.date,
                      title: h.title,
                      content: h.content,
                      highlights: [],
                      nextActions: [],
                      mood: '',
                      peopleInvolved: [],
                      mode: 'live',
                      generatedAt: h.createdAt,
                    })
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink-primary">{h.title}</span>
                    <span className="text-xs text-ink-tertiary">
                      {new Date(h.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <p className="text-xs text-ink-tertiary mt-1 line-clamp-2">
                    {h.content.slice(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
