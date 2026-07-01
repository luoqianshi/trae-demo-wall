import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, Gift, Scale, HeartHandshake, AlertTriangle,
  Users, Sparkles, Calendar, TrendingDown, TrendingUp, Minus,
  Bot, Send, ChevronRight, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useDataStore } from '../stores/useDataStore'
import {
  getComprehensiveReport,
  analyzeSocialScene,
  type EtiquetteReport,
  type EtiquetteSuggestion,
  type SocialDebtAnalysis,
  type SocialDebtItem,
  type MaintenanceSuggestion,
  type RelationshipAlert,
  type SceneAnalysis,
} from '../lib/socialEtiquette'
import { buildCausalChain, type CausalChain } from '../lib/causalChain'
import { CausalChainView } from './CausalChainView'
import { BackHeader } from './BackHeader'
import { warmthToColor, warmthToColorAlpha, warmthLabel, warmthBgGradient } from '../lib/warmthColor'

// ============================================================
// 标签页配置
// ============================================================
type TabKey = 'festivals' | 'socialDebt' | 'maintenance' | 'alerts' | 'scene'

interface TabConfig {
  key: TabKey
  label: string
  icon: typeof Gift
  color: string
  bgColor: string
  borderColor: string
}

const TABS: TabConfig[] = [
  { key: 'festivals', label: '节日礼仪', icon: Gift, color: 'text-zen-amber', bgColor: 'bg-zen-amber/10', borderColor: 'border-zen-amber/30' },
  { key: 'socialDebt', label: '人情往来', icon: Scale, color: 'text-zen-terracotta', bgColor: 'bg-zen-terracotta/10', borderColor: 'border-zen-terracotta/30' },
  { key: 'maintenance', label: '关系维护', icon: HeartHandshake, color: 'text-zen-sage', bgColor: 'bg-zen-sage/10', borderColor: 'border-zen-sage/30' },
  { key: 'alerts', label: '暖度预警', icon: AlertTriangle, color: 'text-zen-rose', bgColor: 'bg-zen-rose/10', borderColor: 'border-zen-rose/30' },
  { key: 'scene', label: '场景分析', icon: Users, color: 'text-zen-indigo', bgColor: 'bg-zen-indigo/10', borderColor: 'border-zen-indigo/30' },
]

// ============================================================
// 优先级/紧急度/风险等级 样式
// ============================================================
const LEVEL_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-zen-rose/15', text: 'text-zen-rose', label: '高' },
  medium: { bg: 'bg-zen-amber/15', text: 'text-zen-amber', label: '中' },
  low: { bg: 'bg-zen-sage/15', text: 'text-zen-sage', label: '低' },
}

function getLevelStyle(level: string) {
  return LEVEL_STYLES[level] || LEVEL_STYLES.medium
}

// ============================================================
// 趋势图标
// ============================================================
function TrendIcon({ trend }: { trend: 'rising' | 'stable' | 'declining' }) {
  if (trend === 'rising') return <TrendingUp className="w-3.5 h-3.5 text-zen-sage" />
  if (trend === 'declining') return <TrendingDown className="w-3.5 h-3.5 text-zen-rose" />
  return <Minus className="w-3.5 h-3.5 text-ink-tertiary" />
}

// ============================================================
// 暖度条 — 用色彩渐变替代数字
// ============================================================
function TemperatureBar({ value, max = 100 }: { value: number; max?: number }) {
  const temp = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden relative">
        {/* 底层轨道 */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(to right,
              hsla(215, 22%, 60%, 0.12),
              hsla(35, 14%, 70%, 0.12),
              hsla(10, 38%, 63%, 0.12)
            )`,
          }}
        />
        {/* 填充 */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${temp}%`,
            background: `linear-gradient(to right,
              hsla(215, 22%, 60%, 0.5),
              ${warmthToColorAlpha(temp, 0.85)}
            )`,
          }}
        />
      </div>
      {/* 暖度标签 */}
      <span
        className="text-2xs font-medium w-8 text-right transition-colors duration-500 flex-shrink-0"
        style={{ color: warmthToColor(temp) }}
      >
        {warmthLabel(temp)}
      </span>
    </div>
  )
}

// ============================================================
// 加载骨架屏
// ============================================================
function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface border border-ink-muted/10 rounded-xl p-4 space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-ink-muted/20 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-ink-muted/20 animate-pulse" />
              <div className="h-3 w-full rounded bg-ink-muted/20 animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-ink-muted/20 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// 空状态
// ============================================================
function EmptyState({ icon: Icon, title, hint }: { icon: typeof Gift; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-surface border border-ink-muted/10 rounded-xl">
      <div className="w-12 h-12 rounded-full bg-ink-muted/10 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-ink-muted" />
      </div>
      <p className="text-sm text-ink-secondary">{title}</p>
      <p className="text-2xs text-ink-tertiary mt-1 max-w-xs">{hint}</p>
    </div>
  )
}

// ============================================================
// 节日礼仪卡片
// ============================================================
function FestivalCard({ suggestion }: { suggestion: EtiquetteSuggestion }) {
  const levelStyle = getLevelStyle(suggestion.priority)
  return (
    <div className="bg-surface border border-ink-muted/10 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zen-amber/10 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4 text-zen-amber" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-ink-primary">{suggestion.festival}</h4>
            <p className="text-2xs text-ink-tertiary">
              {suggestion.festivalDate} · 距今{suggestion.daysUntil}天
            </p>
          </div>
        </div>
        <span className={`text-2xs px-2 py-0.5 rounded-full ${levelStyle.bg} ${levelStyle.text} flex-shrink-0`}>
          {levelStyle.label}优先
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-ink-primary">{suggestion.personName}</span>
        <span className="text-2xs text-ink-tertiary">·</span>
        <span className="text-2xs text-ink-tertiary">{suggestion.relationship}</span>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Gift className="w-3.5 h-3.5 text-zen-terracotta flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-2xs text-ink-tertiary mb-0.5">礼物建议</p>
            <p className="text-xs text-ink-secondary leading-relaxed">{suggestion.giftSuggestion}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Sparkles className="w-3.5 h-3.5 text-zen-sage flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-2xs text-ink-tertiary mb-0.5">问候语</p>
            <p className="text-xs text-ink-secondary leading-relaxed">{suggestion.greetingSuggestion}</p>
          </div>
        </div>
        {suggestion.reason && (
          <div className="flex gap-2 pt-1 border-t border-ink-muted/10">
            <ChevronRight className="w-3.5 h-3.5 text-ink-muted flex-shrink-0 mt-0.5" />
            <p className="text-2xs text-ink-tertiary leading-relaxed">{suggestion.reason}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// 人情往来卡片
// ============================================================
function SocialDebtCard({ item }: { item: SocialDebtItem }) {
  const levelStyle = getLevelStyle(item.urgency)
  const debtTypeConfig = {
    'owe-them': { label: '你欠TA', color: 'text-zen-terracotta', bg: 'bg-zen-terracotta/10' },
    'they-owe-me': { label: 'TA欠你', color: 'text-zen-indigo', bg: 'bg-zen-indigo/10' },
    'balanced': { label: '已平衡', color: 'text-zen-sage', bg: 'bg-zen-sage/10' },
  }
  const debtConfig = debtTypeConfig[item.debtType] || debtTypeConfig['balanced']

  return (
    <div className="bg-surface border border-ink-muted/10 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${debtConfig.bg} flex items-center justify-center flex-shrink-0`}>
            <Scale className={`w-4 h-4 ${debtConfig.color}`} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-ink-primary">{item.personName}</h4>
            <p className="text-2xs text-ink-tertiary">{item.relationship}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-2xs px-2 py-0.5 rounded-full ${debtConfig.bg} ${debtConfig.color}`}>
            {debtConfig.label}
          </span>
          <span className={`text-2xs px-2 py-0.5 rounded-full ${levelStyle.bg} ${levelStyle.text}`}>
            {levelStyle.label}
          </span>
        </div>
      </div>

      <p className="text-xs text-ink-secondary leading-relaxed mb-2">{item.description}</p>

      {item.evidence && (
        <div className="mb-2 p-2 bg-canvas-warm rounded-lg">
          <p className="text-2xs text-ink-tertiary leading-relaxed">依据：{item.evidence}</p>
        </div>
      )}

      {item.suggestedAction && (
        <div className="flex gap-2 pt-1 border-t border-ink-muted/10">
          <ChevronRight className="w-3.5 h-3.5 text-zen-terracotta flex-shrink-0 mt-0.5" />
          <p className="text-xs text-ink-secondary leading-relaxed">{item.suggestedAction}</p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// 关系维护卡片
// ============================================================
function MaintenanceCard({ suggestion }: { suggestion: MaintenanceSuggestion }) {
  const levelStyle = getLevelStyle(suggestion.priority)
  return (
    <div
      className="border border-ink-muted/10 rounded-xl p-4 hover:shadow-sm transition-shadow relative overflow-hidden"
      style={{ background: warmthBgGradient(suggestion.currentTemperature, 0.4) }}
    >
      <div className="flex items-start justify-between mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zen-sage/10 flex items-center justify-center flex-shrink-0">
            <HeartHandshake className="w-4 h-4 text-zen-sage" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-ink-primary">{suggestion.personName}</h4>
            <p className="text-2xs text-ink-tertiary">{suggestion.relationship}</p>
          </div>
        </div>
        <span className={`text-2xs px-2 py-0.5 rounded-full ${levelStyle.bg} ${levelStyle.text} flex-shrink-0`}>
          {levelStyle.label}优先
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 relative z-10">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendIcon trend={suggestion.trend} />
            <span className="text-2xs text-ink-tertiary">暖度变化</span>
          </div>
          <p className="text-2xs text-ink-secondary flex items-center gap-1">
            <span style={{ color: warmthToColor(suggestion.previousTemperature) }}>{warmthLabel(suggestion.previousTemperature)}</span>
            <span className="text-ink-muted">→</span>
            <span style={{ color: warmthToColor(suggestion.currentTemperature) }}>{warmthLabel(suggestion.currentTemperature)}</span>
          </p>
        </div>
        <div>
          <p className="text-2xs text-ink-tertiary mb-1">上次互动</p>
          <p className="text-2xs text-ink-secondary">{suggestion.daysSinceLastInteraction}天前</p>
        </div>
      </div>

      <div className="mb-2 relative z-10">
        <TemperatureBar value={suggestion.currentTemperature} />
      </div>

      <p className="text-xs text-ink-secondary leading-relaxed mb-2 relative z-10">{suggestion.suggestion}</p>

      {suggestion.suggestedAction && (
        <div className="flex gap-2 pt-1 border-t border-ink-muted/10 relative z-10">
          <ChevronRight className="w-3.5 h-3.5 text-zen-sage flex-shrink-0 mt-0.5" />
          <p className="text-xs text-ink-secondary leading-relaxed">{suggestion.suggestedAction}</p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// 暖度预警卡片
// ============================================================
function AlertCard({ alert }: { alert: RelationshipAlert }) {
  const levelStyle = getLevelStyle(alert.riskLevel)
  return (
    <div
      className={`border rounded-xl p-4 hover:shadow-sm transition-shadow relative overflow-hidden ${
        alert.riskLevel === 'high' ? 'border-zen-rose/30' : 'border-ink-muted/10'
      }`}
      style={{ background: warmthBgGradient(alert.currentTemperature, 0.4) }}
    >
      <div className="flex items-start justify-between mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            alert.riskLevel === 'high' ? 'bg-zen-rose/15' : alert.riskLevel === 'medium' ? 'bg-zen-amber/15' : 'bg-zen-sage/15'
          }`}>
            <AlertTriangle className={`w-4 h-4 ${
              alert.riskLevel === 'high' ? 'text-zen-rose' : alert.riskLevel === 'medium' ? 'text-zen-amber' : 'text-zen-sage'
            }`} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-ink-primary">{alert.personName}</h4>
            <p className="text-2xs text-ink-tertiary">{alert.relationship}</p>
          </div>
        </div>
        <span className={`text-2xs px-2 py-0.5 rounded-full ${levelStyle.bg} ${levelStyle.text} flex-shrink-0`}>
          {levelStyle.label}风险
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 relative z-10">
        <div>
          <p className="text-2xs text-ink-tertiary mb-1">当前暖度</p>
          <p
            className="text-sm font-medium transition-colors duration-500"
            style={{ color: warmthToColor(alert.currentTemperature) }}
          >
            {warmthLabel(alert.currentTemperature)}
          </p>
        </div>
        <div>
          <p className="text-2xs text-ink-tertiary mb-1">下降幅度</p>
          <p className="text-sm font-medium text-zen-rose">-{alert.declineAmount}°</p>
        </div>
      </div>

      <div className="mb-2 relative z-10">
        <TemperatureBar value={alert.currentTemperature} />
      </div>

      {alert.declineReason && (
        <div className="mb-2 p-2 bg-canvas-warm rounded-lg relative z-10">
          <p className="text-2xs text-ink-tertiary leading-relaxed">原因：{alert.declineReason}</p>
        </div>
      )}

      {alert.repairSuggestion && (
        <div className="flex gap-2 pt-1 border-t border-ink-muted/10 relative z-10">
          <HeartHandshake className="w-3.5 h-3.5 text-zen-sage flex-shrink-0 mt-0.5" />
          <p className="text-xs text-ink-secondary leading-relaxed">{alert.repairSuggestion}</p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// 暖度预警卡片 + 因果推理链（企业级 RCA 降维）
// ============================================================
function AlertWithCausalChain({
  alert,
  persons,
  memories,
}: {
  alert: RelationshipAlert
  persons: import('../types').Person[]
  memories: import('../types').Memory[]
}) {
  const [showCausal, setShowCausal] = useState(false)
  const [causalChain, setCausalChain] = useState<CausalChain | null>(null)

  const handleToggleCausal = () => {
    if (!showCausal && !causalChain) {
      // 首次展开时计算因果链
      const person = persons.find(p => p.name === alert.personName)
      if (person) {
        try {
          const chain = buildCausalChain(person, memories)
          setCausalChain(chain)
        } catch (e) {
          console.warn('[EtiquettePanel] buildCausalChain failed:', e)
        }
      }
    }
    setShowCausal(!showCausal)
  }

  return (
    <div className="space-y-2">
      <AlertCard alert={alert} />
      {/* 因果分析展开按钮 */}
      <button
        onClick={handleToggleCausal}
        className="flex items-center gap-1 text-2xs text-zen-indigo hover:text-zen-indigo/80 transition-colors px-2"
      >
        {showCausal ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showCausal ? '收起因果分析' : '查看因果分析（为什么降温？）'}
      </button>
      {/* 因果链可视化 */}
      {showCausal && causalChain && (
        <CausalChainView chain={causalChain} />
      )}
      {showCausal && !causalChain && (
        <div className="text-2xs text-ink-muted p-2 bg-canvas-warm rounded-lg">
          暂无足够的互动记录来构建因果链
        </div>
      )}
    </div>
  )
}

// ============================================================
// 社交场景分析结果
// ============================================================
function SceneResult({ analysis }: { analysis: SceneAnalysis }) {
  return (
    <div className="space-y-3">
      {/* 综合建议 */}
      <div className="bg-canvas-warm/50 rounded-xl p-4 border border-ink-muted/10">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-zen-indigo" />
          <span className="text-xs font-medium text-ink-secondary">综合建议</span>
        </div>
        <p className="text-xs text-ink-secondary leading-relaxed whitespace-pre-wrap">{analysis.overallAdvice}</p>
      </div>

      {/* 座次安排 */}
      {analysis.seatingArrangement && analysis.seatingArrangement !== '暂无建议' && (
        <div className="bg-surface border border-ink-muted/10 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Users className="w-3.5 h-3.5 text-zen-indigo" />
            <span className="text-xs font-medium text-ink-secondary">座次安排</span>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed whitespace-pre-wrap">{analysis.seatingArrangement}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 安全话题 */}
        {analysis.safeTopics.length > 0 && (
          <div className="bg-surface border border-ink-muted/10 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-zen-sage" />
              <span className="text-xs font-medium text-ink-secondary">安全话题</span>
            </div>
            <ul className="space-y-1">
              {analysis.safeTopics.map((topic, i) => (
                <li key={i} className="text-xs text-ink-secondary leading-relaxed flex gap-1.5">
                  <span className="text-zen-sage flex-shrink-0">·</span>
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 禁忌话题 */}
        {analysis.forbiddenTopics.length > 0 && (
          <div className="bg-surface border border-ink-muted/10 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-zen-rose" />
              <span className="text-xs font-medium text-ink-secondary">禁忌话题</span>
            </div>
            <ul className="space-y-1">
              {analysis.forbiddenTopics.map((topic, i) => (
                <li key={i} className="text-xs text-ink-secondary leading-relaxed flex gap-1.5">
                  <span className="text-zen-rose flex-shrink-0">·</span>
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 矛盾提醒 */}
        {analysis.conflicts.length > 0 && (
          <div className="bg-surface border border-zen-rose/20 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-zen-rose" />
              <span className="text-xs font-medium text-ink-secondary">矛盾提醒</span>
            </div>
            <ul className="space-y-1">
              {analysis.conflicts.map((conflict, i) => (
                <li key={i} className="text-xs text-ink-secondary leading-relaxed flex gap-1.5">
                  <span className="text-zen-rose flex-shrink-0">!</span>
                  {conflict}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 礼物建议 */}
        {analysis.giftSuggestions.length > 0 && (
          <div className="bg-surface border border-ink-muted/10 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Gift className="w-3.5 h-3.5 text-zen-terracotta" />
              <span className="text-xs font-medium text-ink-secondary">礼物建议</span>
            </div>
            <ul className="space-y-1">
              {analysis.giftSuggestions.map((gift, i) => (
                <li key={i} className="text-xs text-ink-secondary leading-relaxed flex gap-1.5">
                  <span className="text-zen-terracotta flex-shrink-0">·</span>
                  {gift}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// 主组件
// ============================================================
interface EtiquettePanelProps {
  onClose: () => void
}

export function EtiquettePanel({ onClose }: EtiquettePanelProps) {
  const persons = useDataStore((s) => s.persons)
  const memories = useDataStore((s) => s.memories)
  const loadPersons = useDataStore((s) => s.loadPersons)
  const loadMemories = useDataStore((s) => s.loadMemories)

  const [report, setReport] = useState<EtiquetteReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('festivals')

  // 场景分析
  const [sceneInput, setSceneInput] = useState('')
  const [sceneAnalysis, setSceneAnalysis] = useState<SceneAnalysis | null>(null)
  const [sceneLoading, setSceneLoading] = useState(false)

  // 确保数据已加载
  useEffect(() => {
    loadPersons()
    loadMemories()
  }, [loadPersons, loadMemories])

  // 生成综合报告
  const generateReport = useCallback(async () => {
    setLoading(true)
    setReport(null)
    try {
      const result = await getComprehensiveReport()
      setReport(result)
    } catch (err) {
      console.error('[EtiquettePanel] generateReport failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 首次加载自动生成报告
  useEffect(() => {
    if (persons.length > 0) {
      generateReport()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persons.length])

  // 场景分析
  const handleAnalyzeScene = async () => {
    if (!sceneInput.trim()) return
    setSceneLoading(true)
    setSceneAnalysis(null)
    try {
      const result = await analyzeSocialScene(sceneInput.trim())
      setSceneAnalysis(result)
    } catch (err) {
      console.error('[EtiquettePanel] analyzeScene failed:', err)
    } finally {
      setSceneLoading(false)
    }
  }

  const _activeTabConfig = TABS.find((t) => t.key === activeTab) || TABS[0]
  void _activeTabConfig

  return (
    <div className="fixed inset-0 z-50 bg-canvas flex flex-col">
      {/* 头部 */}
      <BackHeader
        title="人情世故"
        onBack={onClose}
        subtitle={
          report
            ? `生成于 ${new Date(report.generatedAt).toLocaleString('zh-CN')}${report.mode === 'demo' ? ' · 示例模式' : ''}`
            : '基于人物关系数据的 AI 动态分析'
        }
        rightAction={
          <button
            type="button"
            onClick={generateReport}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zen-sage/10 border border-zen-sage/20 text-xs font-medium text-zen-sage hover:bg-zen-sage/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? '生成中...' : '刷新报告'}
          </button>
        }
      />

      {/* 标签栏 */}
      <div className="flex gap-1.5 px-6 py-3 overflow-x-auto pb-1 bg-surface border-b border-ink-muted/10">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? `${tab.bgColor} ${tab.color} border ${tab.borderColor}`
                  : 'bg-canvas text-ink-secondary hover:bg-canvas-warm border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {report && tab.key === 'festivals' && report.festivals.length > 0 && (
                <span className={`ml-0.5 text-2xs ${isActive ? tab.color : 'text-ink-muted'}`}>
                  {report.festivals.length}
                </span>
              )}
              {report && tab.key === 'socialDebt' && report.socialDebt.items.length > 0 && (
                <span className={`ml-0.5 text-2xs ${isActive ? tab.color : 'text-ink-muted'}`}>
                  {report.socialDebt.items.length}
                </span>
              )}
              {report && tab.key === 'maintenance' && report.maintenance.length > 0 && (
                <span className={`ml-0.5 text-2xs ${isActive ? tab.color : 'text-ink-muted'}`}>
                  {report.maintenance.length}
                </span>
              )}
              {report && tab.key === 'alerts' && report.alerts.length > 0 && (
                <span className={`ml-0.5 text-2xs ${isActive ? tab.color : 'text-ink-muted'}`}>
                  {report.alerts.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-24">
        <div className="max-w-3xl mx-auto">
          {/* 无人物数据提示 */}
          {persons.length === 0 && !loading && (
            <EmptyState
              icon={Users}
              title="暂无人物关系数据"
              hint="请先通过对话记录积累人物档案，再来查看人情世故分析"
            />
          )}

          {/* 加载中 */}
          {loading && <LoadingSkeleton count={4} />}

          {/* 节日礼仪 */}
          {!loading && activeTab === 'festivals' && report && (
            <>
              {report.festivals.length === 0 ? (
                <EmptyState
                  icon={Gift}
                  title="近期暂无节日礼仪建议"
                  hint="45天内没有重大节日，或暂无需要送礼建议的人物关系"
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary mb-1">
                    <Bot className="w-3.5 h-3.5 text-zen-amber" />
                    节日礼仪建议（基于人物偏好生成）
                  </div>
                  {report.festivals.map((suggestion, i) => (
                    <FestivalCard key={i} suggestion={suggestion} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* 人情往来 */}
          {!loading && activeTab === 'socialDebt' && report && (
            <SocialDebtView analysis={report.socialDebt} />
          )}

          {/* 关系维护 */}
          {!loading && activeTab === 'maintenance' && report && (
            <>
              {report.maintenance.length === 0 ? (
                <EmptyState
                  icon={HeartHandshake}
                  title="关系维护状况良好"
                  hint="当前所有关系暖度健康，暂无需要特别维护的关系"
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary mb-1">
                    <Bot className="w-3.5 h-3.5 text-zen-sage" />
                    关系维护建议（基于暖度趋势生成）
                  </div>
                  {report.maintenance.map((suggestion, i) => (
                    <MaintenanceCard key={i} suggestion={suggestion} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* 暖度预警 */}
          {!loading && activeTab === 'alerts' && report && (
            <>
              {report.alerts.length === 0 ? (
                <EmptyState
                  icon={AlertTriangle}
                  title="所有关系温度健康"
                  hint="当前没有关系温度下降或过低的情况"
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary mb-1">
                    <Bot className="w-3.5 h-3.5 text-zen-rose" />
                    关系暖度预警（需关注的关系）
                  </div>
                  {report.alerts.map((alert, i) => (
                    <AlertWithCausalChain
                      key={i}
                      alert={alert}
                      persons={persons}
                      memories={memories}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* 场景分析 */}
          {!loading && activeTab === 'scene' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary mb-2">
                  <Bot className="w-3.5 h-3.5 text-zen-indigo" />
                  社交场景分析
                </div>
                <p className="text-2xs text-ink-tertiary mb-3 leading-relaxed">
                  描述一个即将面对的社交场景（如饭局、聚会、拜访、商务会面），AI 将基于你的人物关系网络分析座次、话题、矛盾和礼物建议。
                </p>
                <div className="flex gap-2">
                  <textarea
                    value={sceneInput}
                    onChange={(e) => setSceneInput(e.target.value)}
                    placeholder="例如：下周三要请张总和李经理吃饭，还有几个同事作陪，在楼外楼包厢..."
                    rows={3}
                    className="flex-1 px-3 py-2.5 rounded-lg bg-canvas border border-ink-muted/20 text-sm text-ink-primary placeholder:text-ink-muted outline-none focus:border-zen-indigo/50 transition-colors resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleAnalyzeScene()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAnalyzeScene}
                    disabled={!sceneInput.trim() || sceneLoading}
                    className="self-end px-4 py-2.5 rounded-lg bg-zen-indigo/10 border border-zen-indigo/20 text-xs font-medium text-zen-indigo hover:bg-zen-indigo/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    分析
                  </button>
                </div>
                {/* 快捷场景 */}
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {['商务饭局', '家庭聚会', '拜访领导', '同事聚餐'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSceneInput(preset)}
                      className="text-2xs px-2 py-1 rounded-md bg-canvas-warm text-ink-tertiary hover:text-ink-secondary transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {sceneLoading && <LoadingSkeleton count={3} />}

              {sceneAnalysis && !sceneLoading && (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
                    <Sparkles className="w-3.5 h-3.5 text-zen-indigo" />
                    分析结果
                    {sceneAnalysis.mode === 'demo' && (
                      <span className="text-2xs text-ink-tertiary">· 示例模式</span>
                    )}
                  </div>
                  <SceneResult analysis={sceneAnalysis} />
                </>
              )}

              {!sceneAnalysis && !sceneLoading && persons.length > 0 && (
                <EmptyState
                  icon={Users}
                  title="输入场景开始分析"
                  hint="描述一个社交场景，AI 会基于你的人物关系网络给出应对策略"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 人情往来视图
// ============================================================
function SocialDebtView({ analysis }: { analysis: SocialDebtAnalysis }) {
  const balanceScore = analysis.balanceScore
  const balanceLabel = balanceScore < -30 ? '你欠别人较多' : balanceScore > 30 ? '别人欠你较多' : '基本平衡'
  const balanceColor = balanceScore < -30 ? 'text-zen-terracotta' : balanceScore > 30 ? 'text-zen-indigo' : 'text-zen-sage'

  return (
    <div className="space-y-4">
      {/* 平衡度概览 */}
      <div className="bg-surface border border-ink-muted/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-zen-terracotta" />
            <span className="text-xs font-medium text-ink-secondary">人情往来平衡度</span>
          </div>
          <span className={`text-xs font-medium ${balanceColor}`}>{balanceLabel}</span>
        </div>
        {/* 平衡度条 */}
        <div className="relative h-2 rounded-full bg-ink-muted/20 overflow-hidden mb-2">
          <div className="absolute top-0 left-1/2 w-px h-full bg-ink-muted/40" />
          {balanceScore < 0 && (
            <div
              className="absolute top-0 h-full bg-zen-terracotta/60 rounded-l-full"
              style={{ left: `${50 + balanceScore / 2}%`, width: `${-balanceScore / 2}%` }}
            />
          )}
          {balanceScore > 0 && (
            <div
              className="absolute top-0 h-full bg-zen-indigo/60 rounded-r-full"
              style={{ left: '50%', width: `${balanceScore / 2}%` }}
            />
          )}
        </div>
        <div className="flex justify-between text-2xs text-ink-tertiary">
          <span>欠别人</span>
          <span className={balanceColor}>{balanceScore > 0 ? '+' : ''}{balanceScore}</span>
          <span>别人欠你</span>
        </div>
        <p className="text-xs text-ink-secondary leading-relaxed mt-3 pt-3 border-t border-ink-muted/10">
          {analysis.summary}
        </p>
      </div>

      {/* 人情明细 */}
      {analysis.items.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="暂无人情往来记录"
          hint="在对话中记录谁帮过你、你欠谁的人情，这里会自动分析"
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
            <Bot className="w-3.5 h-3.5 text-zen-terracotta" />
            人情往来明细
          </div>
          {analysis.items.map((item, i) => (
            <SocialDebtCard key={i} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
