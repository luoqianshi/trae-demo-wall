import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCw,
  Power,
  CheckCircle2,
  Package,
  Puzzle,
  SlidersHorizontal,
  X,
  AlertTriangle,
} from 'lucide-react'
import {
  fetchPlugins,
  togglePlugin,
  reloadPlugin,
  fetchLTPXIcons,
} from '../lib/api'
import type { PluginInfo } from '../types/api'

export function Plugins() {
  const navigate = useNavigate()
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [defaultIcons, setDefaultIcons] = useState<string[]>([])
  const [iconErrors, setIconErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadPlugins()
    loadDefaultIcons()
  }, [])

  const loadDefaultIcons = async () => {
    try {
      const data = await fetchLTPXIcons()
      setDefaultIcons(data.icons || [])
    } catch {
      // 默认图标加载失败不阻塞
    }
  }

  const loadPlugins = async () => {
    try {
      setLoading(true)
      const data = await fetchPlugins()
      setPlugins(data.plugins || [])
    } catch {
      setMessage('加载插件列表失败')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 3000)
  }

  const handleToggle = async (pluginId: string) => {
    try {
      const result = await togglePlugin(pluginId)
      showMessage(result.message, 'success')
      await loadPlugins()
    } catch {
      showMessage('操作失败', 'error')
    }
  }

  const handleReload = async (pluginId: string) => {
    try {
      const result = await reloadPlugin(pluginId)
      showMessage(result.message, 'success')
      await loadPlugins()
    } catch {
      showMessage('重载失败', 'error')
    }
  }

  const getPluginIcon = (plugin: PluginInfo): string => {
    if (plugin.icon) return plugin.icon
    if (defaultIcons.length === 0) return ''
    const rand = Math.abs(hashCode(plugin.id)) % defaultIcons.length
    return `/api/icon/ltpx/${defaultIcons[rand]}`
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'loaded': return 'badge badge-blue'
      case 'disabled': return 'badge badge-pink'
      case 'error': return 'badge badge-pink'
      default: return 'badge'
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'loaded': return '已加载'
      case 'disabled': return '已禁用'
      case 'error': return '错误'
      default: return status
    }
  }

  const statusDot = (status: string) => {
    switch (status) {
      case 'loaded': return 'bg-blue-400'
      case 'disabled': return 'bg-gray-400'
      case 'error': return 'bg-pink-400'
      default: return 'bg-muted-foreground'
    }
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center aurora-bg">
        <div className="flex flex-col items-center gap-6">
          <div className="h-20 w-20 rounded-2xl card-glow-blue flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-blue animate-spin" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-foreground text-base font-bold">正在加载插件列表</p>
            <p className="text-muted-foreground text-sm mt-1">请稍等片刻...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full p-6 lg:p-8 aurora-bg">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl card-glow-blue flex items-center justify-center">
                <Puzzle className="h-6 w-6 text-blue" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground text-gradient">
                  插件管理
                </h1>
                <p className="text-muted-foreground text-sm">管理和配置已加载的插件</p>
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-full card-glow-pink text-pink text-sm font-bold">
                <div className="h-2 w-2 rounded-full bg-pink animate-pulse" aria-hidden="true" />
                {plugins.length} 个插件
              </div>
            </div>
          </div>
          <button
            onClick={loadPlugins}
            className="btn btn-outline"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            刷新
          </button>
        </div>
      </div>

      {message && (
        <div
          role="alert"
          className={`mb-6 rounded-2xl border p-5 flex items-center justify-between ${
            messageType === 'success'
              ? 'card card-glow-blue'
              : 'card card-glow-pink'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
              messageType === 'success' ? 'bg-blue/10' : 'bg-pink/10'
            }`}>
              {messageType === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-blue" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-pink" aria-hidden="true" />
              )}
            </div>
            <span className="font-bold text-sm">{message}</span>
          </div>
          <button
            onClick={() => { setMessage(''); setMessageType(''); }}
            aria-label="关闭提示"
            className="p-2 rounded-xl hover:bg-blue/10 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {plugins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-24 w-24 rounded-2xl card-glow-pink flex items-center justify-center mb-8">
            <Package className="h-12 w-12 text-pink" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">还没有任何插件</h3>
          <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
            请检查插件目录配置，或添加新插件到指定目录中
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 stagger">
          {plugins.map((plugin) => {
            const iconSrc = getPluginIcon(plugin)
            return (
              <div
                key={plugin.id}
                className={`card card-hover rounded-xl border bg-card overflow-hidden ${
                  plugin.status === 'loaded' ? 'border-l-4 border-l-blue' :
                  plugin.status === 'error' ? 'border-l-4 border-l-pink' :
                  'border-l-4 border-l-muted-foreground'
                }`}
              >
                <div className="p-5 lg:p-6">
                  <div className="flex items-center gap-4">
                    {/* 插件图标 */}
                    <div
                      className="h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue/40 transition-all"
                      onClick={() => navigate(`/plugins/${encodeURIComponent(plugin.id)}/config`)}
                      title="点击配置插件"
                    >
                      {iconSrc && !iconErrors.has(plugin.id) ? (
                        <img
                          src={iconSrc}
                          alt={plugin.name || plugin.id}
                          className="h-full w-full object-contain"
                          onError={() => setIconErrors(prev => new Set(prev).add(plugin.id))}
                        />
                      ) : (
                        <div
                          className="h-full w-full rounded-2xl flex items-center justify-center"
                          style={{ background: 'var(--card-glow-pink-bg, linear-gradient(135deg, rgba(236,72,153,0.15), rgba(59,130,246,0.15)))' }}
                        >
                          <Package className="h-7 w-7 text-pink" aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    {/* 插件信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                        <h3 className="text-base font-bold text-foreground truncate">{plugin.name || plugin.id}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusBadge(plugin.status)}`}>
                          <span className={`h-2 w-2 rounded-full ${statusDot(plugin.status)}`} aria-hidden="true" />
                          {statusLabel(plugin.status)}
                        </span>
                        {plugin.ipc_mode && (
                          <span className="badge badge-blue">IPC</span>
                        )}
                      </div>

                      {plugin.description ? (
                        <p className="text-muted-foreground text-sm mb-2 line-clamp-2 leading-relaxed">{plugin.description}</p>
                      ) : (
                        <p className="text-muted-foreground/50 text-sm mb-2 italic">暂无描述</p>
                      )}

                      <div className="flex items-center gap-5 text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">版本</span>
                          <span className="font-mono text-xs text-foreground/80 bg-blue/10 px-2 py-1 rounded-lg">{plugin.version || '--'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">类型</span>
                          <span className="font-mono text-xs text-foreground/80 bg-pink/10 px-2 py-1 rounded-lg">{plugin.type || '--'}</span>
                        </div>
                        {plugin.tags && plugin.tags.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">标签</span>
                            <div className="flex items-center gap-1">
                              {plugin.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={`font-mono text-xs px-2 py-1 rounded-lg ${
                                    tag === 'LTPX' ? 'bg-emerald-500/10 text-emerald-500' :
                                    tag === 'LTP3' ? 'bg-violet-500/10 text-violet-500' :
                                    tag === 'LTP2' ? 'bg-amber-500/10 text-amber-500' :
                                    'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => navigate(`/plugins/${encodeURIComponent(plugin.id)}/config`)}
                        className="btn btn-accent"
                        title="插件配置"
                      >
                        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">配置</span>
                      </button>
                      <button
                        onClick={() => handleReload(plugin.id)}
                        className="btn btn-outline"
                        title="重载插件"
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">重载</span>
                      </button>
                      <button
                        onClick={() => handleToggle(plugin.id)}
                        className="btn btn-accent"
                      >
                        <Power className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">{plugin.status === 'loaded' ? '禁用' : '启用'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}