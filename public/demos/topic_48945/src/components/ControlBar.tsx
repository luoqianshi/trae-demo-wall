import { Ear, PauseCircle, PlayCircle, Volume2, Waves, WandSparkles } from 'lucide-react'
import type { NarrationIntensity, VisionMode } from '@/services/vision/types'
import type { ServiceStatus } from '@/store/useSoundPupilStore'
import type { VisionConfigStatus } from '../../shared/vision-config'

interface ControlBarProps {
  isRunning: boolean
  narrationIntensity: NarrationIntensity
  mode: VisionMode
  serviceStatus: ServiceStatus
  realConfigStatus: VisionConfigStatus
  onStart: () => void
  onPause: () => void
  onToggleIntensity: () => void
  onToggleMode: () => void
}

const serviceStatusLabelMap: Record<ServiceStatus, string> = {
  online: '在线识别优先',
  degraded: '在线降级中',
  simulation: '模拟稳定模式',
}

export default function ControlBar({
  isRunning,
  narrationIntensity,
  mode,
  serviceStatus,
  realConfigStatus,
  onStart,
  onPause,
  onToggleIntensity,
  onToggleMode,
}: ControlBarProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">使用控制</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <button
          type="button"
          onClick={isRunning ? onPause : onStart}
          className="flex min-h-16 items-center justify-center gap-3 rounded-full bg-amber-300 px-6 py-4 text-lg font-semibold text-slate-950 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-100/50"
        >
          {isRunning ? <PauseCircle className="h-6 w-6" /> : <PlayCircle className="h-6 w-6" />}
          {isRunning ? '暂停提醒' : '开始助行'}
        </button>

        <button
          type="button"
          onClick={onToggleIntensity}
          className="flex min-h-16 items-center justify-center gap-3 rounded-full border border-white/15 bg-slate-900/80 px-6 py-4 text-lg font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-cyan-200/30"
        >
          {narrationIntensity === 'quiet' ? <Ear className="h-6 w-6 text-amber-200" /> : <Volume2 className="h-6 w-6 text-cyan-200" />}
          {narrationIntensity === 'quiet' ? '当前安静模式' : '当前标准播报'}
        </button>

        <button
          type="button"
          onClick={onToggleMode}
          className="flex min-h-16 items-center justify-center gap-3 rounded-full border border-white/15 bg-slate-900/80 px-6 py-4 text-lg font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-cyan-200/30"
        >
          <WandSparkles className="h-6 w-6 text-amber-200" />
          {mode === 'mock' ? (realConfigStatus === 'valid' || realConfigStatus === 'saved' ? '切换在线识别' : '先完成真实配置') : '切换稳定模拟'}
        </button>

        <div className="rounded-[28px] border border-cyan-200/15 bg-cyan-200/10 px-5 py-4 text-sm leading-6 text-cyan-50">
          <div className="flex items-center gap-2 font-medium text-cyan-100">
            <Waves className="h-4 w-4" />
            {serviceStatusLabelMap[serviceStatus]}
          </div>
          <p className="mt-2">开始后默认自动采样，并优先直接描述脚下到前方约 3 米内的环境；只有明显风险时才补极短建议，普通重复内容会尽量保持静默。</p>
        </div>
      </div>
    </section>
  )
}
