import { AudioLines, Ear, RefreshCcw, Sparkles, Wifi, WifiOff } from 'lucide-react'
import type { NarrationIntensity, NarrationResult, VisionMode } from '@/services/vision/types'
import type { ServiceStatus } from '@/store/useSoundPupilStore'

interface LiveNarrationPanelProps {
  narration: NarrationResult | null
  countdown: number
  mode: VisionMode
  narrationIntensity: NarrationIntensity
  isSpeaking: boolean
  serviceStatus: ServiceStatus
  statusMessage: string
}

const modeLabelMap: Record<VisionMode, string> = {
  mock: '模拟模式',
  real: '真实模式',
}

const intensityLabelMap: Record<NarrationIntensity, string> = {
  standard: '标准播报',
  quiet: '安静模式',
}

const serviceStatusLabelMap: Record<ServiceStatus, string> = {
  online: '在线优先运行',
  degraded: '已降级到模拟播报',
  simulation: '模拟稳定运行',
}

const priorityLabelMap = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
} as const

const directionLabelMap = {
  front: '正前方',
  left_front: '左前方',
  right_front: '右前方',
  left: '左侧',
  right: '右侧',
  underfoot_front: '脚下前方',
  behind: '身后',
} as const

export default function LiveNarrationPanel({
  narration,
  countdown,
  mode,
  narrationIntensity,
  isSpeaking,
  serviceStatus,
  statusMessage,
}: LiveNarrationPanelProps) {
  const primaryEvent = narration?.events[0]
  const riskLabel = narration ? priorityLabelMap[narration.overallPriority] : '等待识别'
  const directionLabel = primaryEvent?.direction ? directionLabelMap[primaryEvent.direction] : '待判断'
  const nodeLabel = primaryEvent?.headline ?? '尚未识别到关键节点'
  const sceneLabel = narration?.summary.text ?? '正在直接描述前方环境'

  return (
    <section className="rounded-[32px] border border-white/10 bg-slate-950/50 p-6 shadow-[0_24px_80px_rgba(8,17,31,0.42)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-amber-200/70">实时提醒</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">当前助行判断</h2>
        </div>
        <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-4 py-2 text-sm text-amber-100">
          {modeLabelMap[mode]}
        </span>
      </div>

      <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-3 text-cyan-100">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm uppercase tracking-[0.2em] text-cyan-100/80">最新播报文案</span>
        </div>
        <p className="mt-4 min-h-24 text-xl leading-9 text-white">
          {narration?.text ?? '开始后，系统会在检测到风险、路口节点或方向变化时，用简短中文提醒你。'}
        </p>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          {narration?.guidance ?? '当前暂无新的执行建议，系统继续保持安静采样。'}
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Sparkles className="h-4 w-4 text-amber-200" />
            当前风险
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{riskLabel}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Ear className="h-4 w-4 text-cyan-200" />
            方向判断
          </div>
          <p className="mt-3 text-xl font-semibold text-white">{directionLabel}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <RefreshCcw className="h-4 w-4 text-cyan-200" />
            下一次采样
          </div>
          <p className="mt-3 text-xl font-semibold text-white">{countdown} 秒后</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <AudioLines className="h-4 w-4 text-amber-200" />
            播报状态
          </div>
          <p className="mt-3 text-xl font-semibold text-white">{isSpeaking ? '正在播报' : '等待条件触发'}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Sparkles className="h-4 w-4 text-cyan-200" />
            前方主描述
          </div>
          <p className="mt-3 text-base leading-7 text-white">{sceneLabel}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Sparkles className="h-4 w-4 text-cyan-200" />
            关键节点
          </div>
          <p className="mt-3 text-base leading-7 text-white">{nodeLabel}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            {serviceStatus === 'degraded' ? <WifiOff className="h-4 w-4 text-amber-200" /> : <Wifi className="h-4 w-4 text-emerald-200" />}
            当前模式
          </div>
          <p className="mt-3 text-base leading-7 text-white">
            {intensityLabelMap[narrationIntensity]} · {serviceStatusLabelMap[serviceStatus]}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <AudioLines className="h-4 w-4 text-cyan-200" />
            建议策略
          </div>
          <p className="mt-3 text-base leading-7 text-white">{narration?.guidance ? '明显风险时补极短建议' : '当前以环境直述为主'}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm leading-7 text-slate-200">
        {statusMessage}
      </div>
    </section>
  )
}
