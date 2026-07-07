import { useEffect } from 'react'
import { Compass, Waves } from 'lucide-react'
import AccessibilityHints from '@/components/AccessibilityHints'
import CameraPanel from '@/components/CameraPanel'
import ControlBar from '@/components/ControlBar'
import LiveNarrationPanel from '@/components/LiveNarrationPanel'
import ModelSettingsPanel from '@/components/ModelSettingsPanel'
import { appConfig } from '@/config/appConfig'
import { useCameraStream } from '@/hooks/useCameraStream'
import { useFrameCapture } from '@/hooks/useFrameCapture'
import { useVisionConfig } from '@/hooks/useVisionConfig'
import { useNarrationRuntime } from '@/hooks/useNarrationRuntime'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { useSoundPupilStore } from '@/store/useSoundPupilStore'

export default function HomePage() {
  const {
    isCameraReady,
    isRunning,
    speechEnabled,
    isSpeaking,
    mode,
    narrationIntensity,
    serviceStatus,
    realConfigStatus,
    lastNarration,
    countdown,
    statusMessage,
    errorMessage,
    setSpeaking,
    setSpeechEnabled,
  } = useSoundPupilStore()
  const {
    config,
    isConfigured,
    status: configStatus,
    message: configMessage,
    saveConfig,
    clearConfig,
    testConnection,
  } = useVisionConfig()

  const { videoRef, isSupported, isReady, error, attachStream } = useCameraStream()
  const { supported: speechSupported, speak, cancel } = useSpeechSynthesis(setSpeaking)
  const {
    handleEnableCamera,
    handleStart,
    handlePause,
    handleToggleIntensity,
    handleToggleMode,
  } = useNarrationRuntime({
    videoRef,
    attachStream,
    isReady,
    cameraError: error,
    speechSupported,
    speak,
    cancel,
    isConfigured,
    configStatus,
  })

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_26%),radial-gradient(circle_at_80%_15%,rgba(251,191,36,0.12),transparent_22%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-[36px] border border-white/10 bg-slate-950/55 px-6 py-8 shadow-[0_32px_120px_rgba(8,17,31,0.55)] backdrop-blur-2xl sm:px-8 lg:px-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-4 py-2 text-sm text-cyan-100">
                <Waves className="h-4 w-4" />
                户外助行场景优先的连续环境提醒
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {appConfig.appName}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
                面向真实步行过程设计。打开摄像头后，系统会持续采样胸前前视画面，优先直接说清脚下到前方约 3 米内的环境，让你自己判断；只有在明显风险或识别不确定时，才通过耳机补一句极短提醒。
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">固定采样，优先快返回</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">一句直述前方环境</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">明显风险才补极短建议</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:min-w-[360px]">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3 text-amber-100">
                  <Compass className="h-5 w-5" />
                  <span className="text-sm uppercase tracking-[0.22em] text-amber-100/75">适用场景</span>
                </div>
                <p className="mt-4 text-lg text-white">人行道步行、路口通行、绕开地面障碍、识别靠近人流与临时变化</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <div className="text-sm uppercase tracking-[0.22em] text-cyan-100/75">当前运行状态</div>
                <p className="mt-4 text-lg text-white">
                  {serviceStatus === 'degraded'
                    ? '在线识别暂不可用，系统正以稳定模拟结果直接描述前方环境'
                    : mode === 'real'
                      ? '在线识别优先运行，主目标是更快更直接地说清前方环境'
                      : '当前以模拟稳定模式运行，适合演练与离线演示'}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">真实识别配置：{realConfigStatus === 'valid' ? '已验证可用' : realConfigStatus === 'saved' ? '已保存待测试' : realConfigStatus === 'testing' ? '测试中' : realConfigStatus === 'invalid' ? '连接失败' : '尚未填写'}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <CameraPanel
            videoRef={videoRef}
            isSupported={isSupported}
            isReady={isReady}
            error={errorMessage}
            onEnable={handleEnableCamera}
          />

          <LiveNarrationPanel
            narration={lastNarration}
            countdown={countdown}
            mode={mode}
            narrationIntensity={narrationIntensity}
            isSpeaking={isSpeaking}
            serviceStatus={serviceStatus}
            statusMessage={statusMessage}
          />
        </section>

        <section className="mt-6 space-y-6">
          <ControlBar
            isRunning={isRunning}
            narrationIntensity={narrationIntensity}
            mode={mode}
            serviceStatus={serviceStatus}
            realConfigStatus={realConfigStatus}
            onStart={handleStart}
            onPause={handlePause}
            onToggleIntensity={handleToggleIntensity}
            onToggleMode={handleToggleMode}
          />

          <AccessibilityHints
            errorMessage={errorMessage}
            speechSupported={speechSupported}
            serviceStatus={serviceStatus}
            realConfigStatus={realConfigStatus}
          />

          <ModelSettingsPanel
            initialConfig={config}
            status={configStatus}
            message={configMessage}
            onSave={saveConfig}
            onClear={clearConfig}
            onTest={testConnection}
          />
        </section>
      </div>
    </main>
  )
}
