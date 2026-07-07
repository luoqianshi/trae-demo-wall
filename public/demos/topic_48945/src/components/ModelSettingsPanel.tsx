import { useEffect, useState } from 'react'
import { KeyRound, Link2, Rocket, Save, Trash2 } from 'lucide-react'
import type { VisionConfigStatus, VisionRuntimeConfig } from '../../shared/vision-config'

interface ModelSettingsPanelProps {
  initialConfig: VisionRuntimeConfig
  status: VisionConfigStatus
  message: string
  onSave: (config: VisionRuntimeConfig) => void
  onClear: () => void
  onTest: () => Promise<{ ok: boolean; message: string } | { ok: false; message: string }>
}

const statusLabelMap: Record<VisionConfigStatus, string> = {
  missing: '未配置',
  saved: '已保存待测试',
  testing: '测试中',
  valid: '连接可用',
  invalid: '连接失败',
}

export default function ModelSettingsPanel({
  initialConfig,
  status,
  message,
  onSave,
  onClear,
  onTest,
}: ModelSettingsPanelProps) {
  const [draft, setDraft] = useState(initialConfig)

  useEffect(() => {
    setDraft(initialConfig)
  }, [initialConfig])

  return (
    <section className="rounded-[32px] border border-white/10 bg-slate-950/45 p-6 backdrop-blur-xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">真实识别设置</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">本地填写大模型配置</h2>
        </div>
        <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-4 py-2 text-sm text-cyan-100">
          {statusLabelMap[status]}
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <label className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          <div className="flex items-center gap-2 text-white">
            <Link2 className="h-4 w-4 text-cyan-200" />
            Base URL
          </div>
          <input
            value={draft.baseUrl}
            onChange={(event) => setDraft((current) => ({ ...current, baseUrl: event.target.value }))}
            placeholder="https://api.openai.com/v1"
            className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-200/40"
          />
        </label>

        <label className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          <div className="flex items-center gap-2 text-white">
            <KeyRound className="h-4 w-4 text-amber-200" />
            API Key
          </div>
          <input
            type="password"
            value={draft.apiKey}
            onChange={(event) => setDraft((current) => ({ ...current, apiKey: event.target.value }))}
            placeholder="sk-..."
            className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-200/40"
          />
        </label>

        <label className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          <div className="flex items-center gap-2 text-white">
            <Rocket className="h-4 w-4 text-emerald-200" />
            模型名
          </div>
          <input
            value={draft.model}
            onChange={(event) => setDraft((current) => ({ ...current, model: event.target.value }))}
            placeholder="gpt-4.1-mini"
            className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-200/40"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-100/50"
        >
          <Save className="h-4 w-4" />
          保存配置
        </button>
        <button
          type="button"
          onClick={() => void onTest()}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/80 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-cyan-200/30"
        >
          <Rocket className="h-4 w-4 text-cyan-200" />
          测试连接
        </button>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/80 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-cyan-200/30"
        >
          <Trash2 className="h-4 w-4 text-rose-200" />
          清除配置
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm leading-7 text-slate-200">
        {message}
      </div>

      <div className="mt-4 rounded-2xl border border-cyan-200/15 bg-cyan-200/10 px-4 py-3 text-sm leading-7 text-cyan-50">
        这些配置只保存在当前浏览器的本地存储中，仅用于调用本地代理接口，不会由页面直接请求外部大模型服务。
      </div>
    </section>
  )
}
