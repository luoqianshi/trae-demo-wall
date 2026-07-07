import { AlertTriangle, Ear, Keyboard, ScanLine, ShieldCheck, WifiOff } from 'lucide-react'

import type { ServiceStatus } from '@/store/useSoundPupilStore'
import type { VisionConfigStatus } from '../../shared/vision-config'

interface AccessibilityHintsProps {
  errorMessage: string
  speechSupported: boolean
  serviceStatus: ServiceStatus
  realConfigStatus: VisionConfigStatus
}

export default function AccessibilityHints({ errorMessage, speechSupported, serviceStatus, realConfigStatus }: AccessibilityHintsProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-slate-950/45 p-6 backdrop-blur-xl">
      <p className="text-sm uppercase tracking-[0.28em] text-amber-200/70">使用建议</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-white">
            <Ear className="h-5 w-5 text-amber-200" />
            <span className="font-medium">耳机优先</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-300">建议佩戴耳机或骨传导耳机收听播报，减少外放干扰，也更接近真实步行使用方式。</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-white">
            <ScanLine className="h-5 w-5 text-cyan-200" />
            <span className="font-medium">胸前挂载</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-300">默认按胸前朝前挂载设计视角，方向描述会优先使用左前方、右前方与脚下前方等措辞。</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-white">
            <Keyboard className="h-5 w-5 text-emerald-200" />
            <span className="font-medium">自动运行优先</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-300">所有主操作都采用大尺寸按钮，并保留清晰聚焦态；开始后系统会自动采样和决定是否播报。</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="h-5 w-5 text-emerald-200" />
            <span className="font-medium">隐私与数据</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-300">当前版本不保存图片历史；若接入在线识别，将明确展示在线或降级状态，便于判断当前提醒来源。</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
        {!speechSupported
          ? '当前浏览器不支持语音播报，你仍可看到实时文字描述。'
          : errorMessage || '如果出现权限拒绝或设备不支持，页面会在这里显示可理解的错误提示。'}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
        <WifiOff className="mt-0.5 h-5 w-5 flex-none" />
        <span>
          {realConfigStatus === 'missing'
            ? '若要启用真实识别，请先在下方填写 Base URL、API Key 与模型名，再测试连接。'
            : serviceStatus === 'degraded'
            ? '当前在线识别暂不可用，系统已降级到模拟播报以保持连续提醒。'
            : '若网络波动或在线识别失败，系统会明确提示降级状态，并继续用模拟结果保持基本播报。'}
        </span>
      </div>

      {errorMessage && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
          <span>{errorMessage}</span>
        </div>
      )}
    </section>
  )
}
