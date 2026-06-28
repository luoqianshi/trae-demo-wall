import type { RefObject } from 'react'
import { Camera, CameraOff, ShieldAlert } from 'lucide-react'

interface CameraPanelProps {
  videoRef: RefObject<HTMLVideoElement>
  isSupported: boolean
  isReady: boolean
  error: string
  onEnable: () => void
}

export default function CameraPanel({ videoRef, isSupported, isReady, error, onEnable }: CameraPanelProps) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(8,17,31,0.45)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">前方视野</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">助行采样画面</h2>
        </div>
        <div className="rounded-full border border-cyan-200/20 bg-cyan-200/10 p-3 text-cyan-100">
          {isReady ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
        </div>
      </div>

      <div className="p-6">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70">
          <video ref={videoRef} playsInline muted className="aspect-[4/3] w-full object-cover" />
          {!isReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/70 px-6 text-center">
              <div className="rounded-full border border-amber-300/30 bg-amber-300/10 p-4 text-amber-100">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-white">开启摄像头后，系统会按胸前前视角持续采样前方道路</p>
                <p className="text-sm text-slate-300">{isSupported ? '先授权摄像头，再开始风险提醒与方向播报。' : '当前设备或浏览器不支持摄像头能力。'}</p>
              </div>
              {isSupported && (
                <button
                  type="button"
                  onClick={onEnable}
                  className="rounded-full bg-amber-300 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-200/50"
                >
                  立即开启摄像头
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
          {error || (isReady ? '摄像头已连接，系统会按固定节奏采样当前画面，并仅在值得提醒时发声。' : '等待摄像头连接。')}
        </div>
      </div>
    </section>
  )
}
