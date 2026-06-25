import { useState, useEffect } from 'react'
import { Save, RefreshCw, X, Code2, Layout, AlertTriangle, Settings2 } from 'lucide-react'
import { fetchYAMLConfig, saveYAMLConfig } from '../lib/api'
import {
  SECTION_LABELS,
  FIELD_LABELS,
  BOOLEAN_FIELDS,
  FIELD_OPTIONS,
  FIELD_DESCRIPTIONS,
  parseYamlToSections,
  setValueInYAML,
} from '../lib/yaml-config'
import type { OptionItem } from '../lib/yaml-config'

// 所有标签页
const TABS = [
  { key: 'basic', label: '基本信息' },
  { key: 'personality', label: '人格' },
  { key: 'trigger', label: '聊天' },
  { key: 'timing', label: '定时网关' },
  { key: 'emoji', label: '表情' },
  { key: 'filter', label: '过滤' },
  { key: 'hook', label: 'Hook' },
  { key: 'memory', label: '记忆' },
  { key: 'search', label: '搜索' },
  { key: 'voice', label: '语音' },
  { key: 'logger', label: '日志' },
  { key: 'dedupe', label: '去重' },
  { key: 'messaging', label: '消息' },
  { key: 'advanced', label: '高级' },
]

// 标签页对应的 section 列表
const TAB_SECTIONS: Record<string, string[]> = {
  basic: ['bot'],
  personality: ['personality'],
  trigger: ['trigger', 'decision', 'behavior_rules'],
  timing: ['timing_gate'],
  emoji: ['emoji'],
  filter: ['content_filter'],
  hook: ['hook'],
  memory: ['memory'],
  search: ['web_search', 'vision', 'vision_rules'],
  voice: ['voice'],
  logger: ['logger'],
  dedupe: ['dedupe'],
  messaging: ['message_receive'],
  advanced: ['bus', 'goja', 'tong_shadow', 'webui', 'browser'],
}

/** 将点号路径转为合法的 DOM id */
function fieldId(path: string) {
  return `field-${path.replace(/\./g, '-')}`
}

export function BotConfig() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [rawContent, setRawContent] = useState('')
  const [configPath, setConfigPath] = useState('')
  const [activeTab, setActiveTab] = useState('basic')
  const [editMode, setEditMode] = useState<'visual' | 'source'>('visual')

  useEffect(() => { loadConfig() }, [])

  async function loadConfig() {
    try {
      setLoading(true)
      const data = await fetchYAMLConfig()
      setRawContent(data.raw || '')
      setConfigPath(data.path || '')
    } catch (err) {
      setMessage('加载 config.yaml 失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      const result = await saveYAMLConfig(rawContent)
      setMessage(result.message || '配置已保存')
    } catch (err) {
      setMessage('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const sections = parseYamlToSections(rawContent)

  // 根据路径设置值（委托给 yaml-config 模块的纯函数）
  function handleSetValue(path: string, value: string) {
    setRawContent(setValueInYAML(rawContent, path, value))
  }

  // ─── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="加载中…">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin btn-primary" aria-hidden="true" />
          <span className="text-sm">正在加载配置…</span>
        </div>
      </div>
    )
  }

  // 获取当前标签页的 sections
  const activeSections = sections.filter(s => TAB_SECTIONS[activeTab]?.includes(s.title))

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen aurora-bg">
      {/* ─── Top gradient accent bar ──────────────────────────────────────────────── */}
      <div className="h-1.5 bg-gradient-to-r from-blue-400 via-pink-400 to-purple-400" aria-hidden="true" />

      <div className="space-y-6 p-6">

        {/* ─── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60 card card-hover p-5 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
              <Settings2 className="h-6 w-6" style={{ color: 'hsl(var(--accent))' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground text-gradient">
                YaraFlow 主程序配置
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                编辑 config.yaml 中的配置项目
                {configPath && (
                  <span className="ml-2 font-mono text-xs badge badge-blue px-2.5 py-1 rounded-full">
                    {configPath}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {/* Refresh */}
            <button
              onClick={loadConfig}
              aria-label="刷新配置"
              className="btn btn-outline"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              刷新
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              aria-label="保存配置"
              aria-busy={saving}
              className="btn btn-accent"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                  保存中…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  保存配置
                </>
              )}
            </button>
          </div>
        </div>

        {/* ─── Message Alert ──────────────────────────────────────────────── */}
        {message && (
          <div
            role="alert"
            className="animate-slide-in-left card card-hover rounded-xl p-4 text-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
                <span className="h-2 w-2 rounded-full bg-primary" />
              </span>
              <span>{message}</span>
            </div>
            <button
              onClick={() => setMessage('')}
              aria-label="关闭提示"
              className="rounded-full p-1.5 hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* ─── Edit Mode Toggle ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <div className="inline-flex gap-1.5 rounded-full bg-muted p-1.5 card shadow-sm" role="group" aria-label="编辑模式切换">
            <button
              onClick={() => setEditMode('visual')}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 btn ${
                editMode === 'visual'
                  ? 'btn btn-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface'
              }`}
            >
              <Layout className="h-4 w-4" aria-hidden="true" />
              可视化编辑
            </button>
            <button
              onClick={() => setEditMode('source')}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 btn ${
                editMode === 'source'
                  ? 'btn btn-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface'
              }`}
            >
              <Code2 className="h-4 w-4" aria-hidden="true" />
              源代码编辑
            </button>
          </div>
        </div>

        {/* ─── Visual Edit Mode ──────────────────────────────────────────────── */}
        {editMode === 'visual' && (
          <div className="space-y-6">

            {/* ─── Tabs ──────────────────────────────────────────────── */}
            <nav className="flex flex-wrap gap-2" role="tablist" aria-label="配置分类">
              {TABS.map((tab) => {
                const hasContent = sections.some(s => TAB_SECTIONS[tab.key]?.includes(s.title) && s.fields.length > 0)
                return (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={activeTab === tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium whitespace-nowrap rounded-full transition-colors btn shadow-sm ${
                      activeTab === tab.key
                        ? 'btn btn-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </nav>

            {/* ─── Sections ──────────────────────────────────────────────── */}
            <div className="space-y-5 stagger" role="tabpanel">
              {activeSections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-fade-in-up" aria-live="polite">
                  <div className="relative mb-5">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                      <Layout className="h-9 w-9" style={{ color: 'hsl(var(--primary) / 0.4)' }} aria-hidden="true" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-400/20 flex items-center justify-center">
                      <span className="block w-2 h-2 rounded-full bg-pink-400/60" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold">该标签页暂无配置项</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">切换到其他标签页查看配置</p>
                </div>
              ) : (
                activeSections.map((section, index) => {
                  const isAccent = index % 2 === 0
                  return (
                    <section
                      key={section.title}
                      className={`card card-hover rounded-2xl overflow-hidden animate-fade-in-up card-glow`}
                      aria-labelledby={`section-h-${section.title}`}
                    >
                      {/* Section header with gradient accent */}
                      <div className={`border-l-4`} style={{ borderColor: isAccent ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }}>
                        <div className="px-6 py-4 flex items-center gap-3 bg-muted">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface" aria-hidden="true">
                            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: isAccent ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }} />
                          </span>
                          <h2
                            id={`section-h-${section.title}`}
                            className="text-base font-semibold tracking-tight text-foreground"
                          >
                            {section.titleCN}
                          </h2>
                          <span className="ml-auto text-xs text-muted-foreground font-mono tabular-nums">
                            {section.fields.length} 项
                          </span>
                        </div>
                      </div>

                      {/* Fields */}
                      <div className="p-6 space-y-5 stagger-children">
                        {section.fields.map(field => {
                          const isBool = BOOLEAN_FIELDS.has(field.path)
                          const options = FIELD_OPTIONS[field.path]
                          const desc = FIELD_DESCRIPTIONS[field.path]
                          const fid = fieldId(field.path)
                          return (
                            <div key={field.path} className="space-y-1.5">
                              {/* ─── Boolean Toggle ──────────────────────────────────────────────── */}
                              {isBool ? (
                                <div className="flex items-center gap-3.5">
                                  <button
                                    type="button"
                                    role="switch"
                                    id={fid}
                                    aria-checked={field.value === 'true'}
                                    aria-label={field.label}
                                    onClick={() => handleSetValue(field.path, field.value === 'true' ? 'false' : 'true')}
                                    className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out"
                                    style={{ backgroundColor: field.value === 'true' ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
                                  >
                                    <span
                                      aria-hidden="true"
                                      className="inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out"
                                      style={{ transform: field.value === 'true' ? 'translateX(1.5rem)' : 'translateX(0.125rem)' }}
                                    />
                                  </button>
                                  <label htmlFor={fid} className="text-sm font-medium text-foreground cursor-pointer select-none">
                                    {field.label}
                                  </label>
                                  <span className="text-xs text-muted-foreground">
                                    {field.value === 'true' ? '已启用' : '已禁用'}
                                  </span>
                                </div>
                              ) : options ? (
                                /* ─── Select ──────────────────────────────────────────────── */
                                <div>
                                  <label htmlFor={fid} className="text-sm font-medium text-foreground mb-1.5 block">
                                    {field.label}
                                  </label>
                                  <select
                                    id={fid}
                                    value={field.value}
                                    onChange={(e) => handleSetValue(field.path, e.target.value)}
                                    className="w-full max-w-xs rounded-full input"
                                  >
                                    {options.map(opt => {
                                    const isObj = typeof opt === 'object'
                                    const val = isObj ? (opt as { label: string; value: string }).value : (opt as string)
                                    const label = isObj ? (opt as { label: string; value: string }).label : (opt as string)
                                    return <option key={val} value={val}>{label}</option>
                                  })}
                                  </select>
                                  {desc && (
                                    <p className="text-xs text-muted-foreground whitespace-pre-line mt-1">{desc}</p>
                                  )}
                                </div>
                              ) : field.isLong ? (
                                /* ─── Textarea ──────────────────────────────────────────────── */
                                <div>
                                  <label htmlFor={fid} className="text-sm font-medium text-foreground mb-1.5 block">
                                    {field.label}
                                  </label>
                                  <textarea
                                    id={fid}
                                    value={field.value}
                                    onChange={(e) => handleSetValue(field.path, e.target.value)}
                                    rows={6}
                                    className="w-full rounded-xl input font-mono resize-y"
                                    spellCheck={false}
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">支持长文本，保存时将自动处理换行</p>
                                </div>
                              ) : (
                                /* ─── Text Input ──────────────────────────────────────────────── */
                                <div>
                                  <label htmlFor={fid} className="text-sm font-medium text-foreground mb-1.5 block">
                                    {field.label}
                                  </label>
                                  <input
                                    id={fid}
                                    value={field.value}
                                    onChange={(e) => handleSetValue(field.path, e.target.value)}
                                    className="w-full rounded-full border border-blue-200 bg-white/80 px-4 py-2.5 text-sm font-mono transition-all duration-200 input"
                                  />
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {section.fields.length === 0 && (
                          <p className="text-sm text-muted-foreground py-2" aria-live="polite">暂无配置项</p>
                        )}
                      </div>
                    </section>
                  )
                })
              )}
            </div>

            {/* ─── Warning Tip ──────────────────────────────────────────────── */}
            <div className="flex items-start gap-4 card card-hover rounded-xl p-5" role="alert">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
                <AlertTriangle className="h-4 w-4 text-primary" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  温馨提示
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  复杂配置项（如列表、嵌套结构）请使用源代码编辑模式。保存后配置将自动热加载。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Source Edit Mode ──────────────────────────────────────────────── */}
        {editMode === 'source' && (
          <div className="space-y-3 animate-fade-in-up">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-sm bg-primary/60" />
              </span>
              <label htmlFor="source-editor" className="text-sm font-medium text-foreground">
                编辑 config.yaml
              </label>
              <span className="ml-auto text-xs text-muted-foreground/60 font-mono tabular-nums">
                {rawContent.split('\n').length} 行
              </span>
            </div>
            <div className="relative card card-hover rounded-xl overflow-hidden">
              {/* Line numbers gutter simulation */}
              <textarea
                id="source-editor"
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                className="w-full min-h-[500px] bg-transparent p-4 pl-16 font-mono text-sm leading-relaxed resize-y transition-all duration-200 input"
                spellCheck={false}
                placeholder="# YaraFlow 配置文件内容…"
                style={{
                  backgroundImage: 'linear-gradient(to right, hsl(var(--muted-foreground) / 0.06) 1px, transparent 1px)',
                  backgroundPosition: '3.5rem 0',
                  backgroundSize: '3.5rem 100%',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
