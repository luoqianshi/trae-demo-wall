import { useState, useEffect } from 'react'
import {
  Radio,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { fetchAdapterConfig, saveAdapterConfig, type AdapterConfig } from '../lib/api'

const defaultConfig: AdapterConfig = {
  napcat_ws_server: '',
  napcat_ws_token: '',
  lunar_core_url: '',
  lunar_ws_server: '',
  poll_interval: 10,
  listen_group_ids: [],
  trigger_keywords: [],
  display_logs: true,
  default_reply: '',
  yutong_mode: false,
}

export function AdapterConfig() {
  const [config, setConfig] = useState<AdapterConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [showToken, setShowToken] = useState(false)
  const [configPath, setConfigPath] = useState('')
  const [newGroupId, setNewGroupId] = useState('')
  const [newKeyword, setNewKeyword] = useState('')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const result = await fetchAdapterConfig()
      if (result.config && Object.keys(result.config).length > 0) {
        setConfig(result.config)
      }
      setConfigPath(result.path || '')
    } catch (err) {
      showMessage('加载适配器配置失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage('')
      await saveAdapterConfig(config)
      showMessage('适配器配置已保存并热重载生效', 'success')
    } catch (err) {
      showMessage('保存失败: ' + (err instanceof Error ? err.message : '未知错误'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  const updateField = (field: keyof AdapterConfig, value: unknown) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const addGroupId = () => {
    const trimmed = newGroupId.trim()
    if (!trimmed) return
    if (config.listen_group_ids?.includes(trimmed)) return
    setConfig(prev => ({
      ...prev,
      listen_group_ids: [...(prev.listen_group_ids || []), trimmed],
    }))
    setNewGroupId('')
  }

  const removeGroupId = (id: string) => {
    setConfig(prev => ({
      ...prev,
      listen_group_ids: (prev.listen_group_ids || []).filter(g => g !== id),
    }))
  }

  const addKeyword = () => {
    const trimmed = newKeyword.trim()
    if (!trimmed) return
    if (config.trigger_keywords?.includes(trimmed)) return
    setConfig(prev => ({
      ...prev,
      trigger_keywords: [...(prev.trigger_keywords || []), trimmed],
    }))
    setNewKeyword('')
  }

  const removeKeyword = (kw: string) => {
    setConfig(prev => ({
      ...prev,
      trigger_keywords: (prev.trigger_keywords || []).filter(k => k !== kw),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#60a5fa] to-[#f472b6] flex items-center justify-center shadow-lg card-glow-blue">
              <RefreshCw className="h-6 w-6 text-white animate-spin" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium">正在加载适配器配置…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen aurora-bg">
      {/* 顶部装饰渐变色条 */}
      <div className="h-1.5 bg-gradient-to-r from-[#60a5fa] via-[#f472b6] to-[#60a5fa]" />

      <div className="p-6 lg:p-8 stagger">
        {/* 标题区 */}
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl card-glow-pink flex items-center justify-center">
                <Radio className="h-6 w-6 text-[#f472b6]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gradient">适配器配置</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  配置 QQ 适配器（NapCat）连接参数与行为
                  {configPath && <span className="ml-2 badge badge-pink">📁 {configPath}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadConfig}
                className="flex items-center gap-2 btn btn-outline"
              >
                <RefreshCw className="h-4 w-4" />
                刷新
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 btn btn-accent"
              >
                <Save className="h-4 w-4" />
                {saving ? '保存中…' : '保存配置'}
              </button>
            </div>
          </div>
        </div>

        {/* 消息提示 */}
        {message && (
          <div
            className={`mb-6 flex items-center gap-3 card rounded-2xl p-4 border ${messageType === 'success' ? 'card-glow-blue' : 'border-red-200 bg-red-50/50'}`}
          >
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${messageType === 'success' ? 'bg-[#60a5fa]/10' : 'bg-red-100'}`}>
              {messageType === 'success'
                ? <CheckCircle2 className="h-5 w-5 text-[#60a5fa]" />
                : <AlertTriangle className="h-5 w-5 text-red-500" />
              }
            </div>
            <span className={`text-sm font-medium ${messageType === 'success' ? 'text-[#60a5fa]' : 'text-red-700'}`}>{message}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* WebSocket 连接 */}
          <div className="relative card card-hover rounded-2xl overflow-hidden card-glow-blue">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl card-glow-pink flex items-center justify-center">
                  <Radio className="h-6 w-6 text-[#f472b6]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">WebSocket 连接</h3>
                  <p className="text-xs text-muted-foreground">NapCat 桥接服务配置</p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">NapCat WebSocket 服务器</label>
                <input
                  type="text"
                  value={config.napcat_ws_server || ''}
                  onChange={e => updateField('napcat_ws_server', e.target.value)}
                  placeholder="例: ws://localhost:3001"
                  className="w-full input"
                />
                <p className="text-xs text-muted-foreground mt-1">NapCat 正向 WebSocket 服务地址</p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">NapCat Token</label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={config.napcat_ws_token || ''}
                    onChange={e => updateField('napcat_ws_token', e.target.value)}
                    placeholder="Token（可选）"
                    className="w-full input pr-12"
                  />
                  <button
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#f472b6] hover:text-[#60a5fa] hover:bg-[#60a5fa]/10 transition-all"
                    aria-label={showToken ? '隐藏 Token' : '显示 Token'}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Lunar 核心 URL</label>
                <input
                  type="text"
                  value={config.lunar_core_url || ''}
                  onChange={e => updateField('lunar_core_url', e.target.value)}
                  placeholder="例: http://localhost:8080"
                  className="w-full input"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Lunar WebSocket 服务器</label>
                <input
                  type="text"
                  value={config.lunar_ws_server || ''}
                  onChange={e => updateField('lunar_ws_server', e.target.value)}
                  placeholder="例: ws://localhost:8080/ws"
                  className="w-full input"
                />
              </div>
            </div>
          </div>

          {/* 行为设置 */}
          <div className="relative card card-hover rounded-2xl overflow-hidden card-glow-pink">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl card-glow-blue flex items-center justify-center">
                  <Radio className="h-6 w-6 text-[#60a5fa]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">行为设置</h3>
                  <p className="text-xs text-muted-foreground">适配器触发与回复行为</p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">轮询间隔 (秒)</label>
                <input
                  type="number"
                  value={config.poll_interval ?? 10}
                  onChange={e => updateField('poll_interval', parseInt(e.target.value) || 10)}
                  min={1}
                  max={60}
                  className="w-full input"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">默认回复</label>
                <input
                  type="text"
                  value={config.default_reply || ''}
                  onChange={e => updateField('default_reply', e.target.value)}
                  placeholder="留空则不默认回复"
                  className="w-full input"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium text-foreground">显示日志</span>
                  <p className="text-xs text-muted-foreground">在控制台输出适配器日志</p>
                </div>
                <button
                  onClick={() => updateField('display_logs', !config.display_logs)}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-200 ${
                    config.display_logs ? 'bg-gradient-to-r from-[#60a5fa] to-[#f472b6]' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={config.display_logs}
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    config.display_logs ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium text-foreground">语瞳模式</span>
                  <p className="text-xs text-muted-foreground">true=语瞳, false=月华</p>
                </div>
                <button
                  onClick={() => updateField('yutong_mode', !config.yutong_mode)}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-200 ${
                    config.yutong_mode ? 'bg-gradient-to-r from-[#f472b6] to-[#60a5fa]' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={config.yutong_mode}
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    config.yutong_mode ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* 监听群组 */}
          <div className="relative card card-hover rounded-2xl overflow-hidden card-glow-pink">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl card-glow-blue flex items-center justify-center">
                  <Radio className="h-6 w-6 text-[#60a5fa]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">监听群组</h3>
                  <p className="text-xs text-muted-foreground">留空则监听所有群组</p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={newGroupId}
                  onChange={e => setNewGroupId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addGroupId()}
                  placeholder="输入群号"
                  className="flex-1 input"
                />
                <button
                  onClick={addGroupId}
                  className="flex items-center gap-1.5 shrink-0 btn btn-accent"
                >
                  <Plus className="h-4 w-4" />
                  添加
                </button>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
                {config.listen_group_ids && config.listen_group_ids.length > 0 ? (
                  config.listen_group_ids.map(id => (
                    <div key={id} className="flex items-center justify-between rounded-xl bg-[#60a5fa]/5 px-4 py-2.5 group hover:bg-[#60a5fa]/10 border border-[#60a5fa]/20 transition-all">
                      <span className="text-sm font-mono text-[#60a5fa]">{id}</span>
                      <button
                        onClick={() => removeGroupId(id)}
                        className="text-[#f472b6] hover:text-[#60a5fa] transition-all p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#f472b6]/10"
                        aria-label="移除群组"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-12 w-12 rounded-full bg-[#60a5fa]/10 flex items-center justify-center mb-2">
                      <Radio className="h-6 w-6 text-[#60a5fa]/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">未设置监听群组</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">当前将监听所有群组消息</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 触发关键词 */}
          <div className="relative card card-hover rounded-2xl overflow-hidden card-glow-blue">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl card-glow-pink flex items-center justify-center">
                  <Radio className="h-6 w-6 text-[#f472b6]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">触发关键词</h3>
                  <p className="text-xs text-muted-foreground">包含这些关键词的消息将触发回复</p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addKeyword()}
                  placeholder="输入关键词"
                  className="flex-1 input"
                />
                <button
                  onClick={addKeyword}
                  className="flex items-center gap-1.5 shrink-0 btn btn-primary"
                >
                  <Plus className="h-4 w-4" />
                  添加
                </button>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
                {config.trigger_keywords && config.trigger_keywords.length > 0 ? (
                  config.trigger_keywords.map(kw => (
                    <div key={kw} className="flex items-center justify-between rounded-xl bg-[#f472b6]/5 px-4 py-2.5 group hover:bg-[#f472b6]/10 border border-[#f472b6]/20 transition-all">
                      <span className="text-sm text-[#f472b6]">{kw}</span>
                      <button
                        onClick={() => removeKeyword(kw)}
                        className="text-[#60a5fa] hover:text-[#f472b6] transition-all p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#60a5fa]/10"
                        aria-label="移除关键词"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-12 w-12 rounded-full bg-[#f472b6]/10 flex items-center justify-center mb-2">
                      <Radio className="h-6 w-6 text-[#f472b6]/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">未设置触发关键词</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">添加关键词以触发自动回复</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
