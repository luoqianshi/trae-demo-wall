import { useState, useEffect } from 'react'
import {
  Activity,
  Cpu,
  HardDrive,
  MessageSquare,
  Package,
  RefreshCw,
  RotateCcw,
  Clock,
  Zap,
  TrendingUp,
  DollarSign,
  Gauge,
  BrainCircuit,
  CheckCircle2,
  Shield,
  Server,
  Database,
  Layers,
  Globe,
  Radio,
  Heart,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { fetchDashboard, fetchStatus, fetchStats, fetchMetrics, fetchHealth, restartSystem, createEventSource } from '../lib/api'
import type { DashboardData, StatusData, StatsData, MetricsData, HealthData, PipelineEvent } from '../types/api'

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [restarting, setRestarting] = useState(false)
  const [restartMessage, setRestartMessage] = useState('')
  const [stats, setStats] = useState<StatsData | null>(null)
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [pipelineEvents, setPipelineEvents] = useState<PipelineEvent[]>([])
  const [sseConnected, setSseConnected] = useState(false)
  const [health, setHealth] = useState<HealthData | null>(null)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  // SSE 消息流连接
  useEffect(() => {
    const eventSource = createEventSource('/messages/stream')
    eventSource.onopen = () => setSseConnected(true)
    eventSource.onerror = () => setSseConnected(false)

    eventSource.onmessage = (event) => {
      try {
        const evtData = JSON.parse(event.data)
        setPipelineEvents(prev => {
          const next = [evtData, ...prev].slice(0, 50)
          return next
        })
      } catch {
        // 忽略解析错误
      }
    }

    return () => {
      eventSource.close()
      setSseConnected(false)
    }
  }, [])

  const loadData = async () => {
    try {
      const [dashboardData, statusData, statsData, metricsData] = await Promise.all([
        fetchDashboard(),
        fetchStatus(),
        fetchStats(),
        fetchMetrics()
      ])
      setData(dashboardData)
      setStatus(statusData)
      setStats(statsData)
      setMetrics(metricsData)

      fetchHealth()
        .then(setHealth)
        .catch(() => setHealth(null))
    } catch (err) {
      console.error('加载仪表盘数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRestart = async () => {
    if (!confirm('确定要重启 YaraFlow 吗？')) return
    try {
      setRestarting(true)
      setRestartMessage('正在发送重启指令…')
      const result = await restartSystem()
      setRestartMessage(result.message || '重启中…')

      let attempts = 0
      const checkInterval = setInterval(async () => {
        attempts++
        setRestartMessage(`正在等待 YaraFlow 重启… (${attempts}/30)`)
        try {
          await fetchStatus()
          clearInterval(checkInterval)
          setRestartMessage('重启成功！正在刷新页面…')
          setTimeout(() => window.location.reload(), 1000)
        } catch {
          if (attempts >= 30) {
            clearInterval(checkInterval)
            setRestarting(false)
            setRestartMessage('重启超时，请手动刷新页面')
          }
        }
      }, 2000)
    } catch (err) {
      setRestarting(false)
      setRestartMessage('重启请求失败')
    }
  }

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return d > 0 ? `${d}天 ${h}小时 ${m}分钟` : h > 0 ? `${h}小时 ${m}分钟` : `${m}分钟`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div 
            className="h-12 w-12 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' }}
          >
            <Zap className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>正在加载…</p>
        </div>
      </div>
    )
  }

  // 统计卡片数据 - 全部使用蓝色主调
  const statCards = [
    { label: '运行状态', value: data?.status.running ? '运行中' : '已停止', icon: Activity, status: data?.status.running ? 'success' : 'error' },
    { label: '运行时间', value: status ? formatUptime(status.uptime) : '--', icon: Clock, status: '' },
    { label: '内存使用', value: status ? `${status.memory_mb.toFixed(1)} MB` : '--', icon: HardDrive, status: '' },
    { label: 'Goroutines', value: status ? String(status.goroutines) : '--', icon: Cpu, status: '' },
  ]

  const stageNames: Record<string, string> = {
    dedupe: '去重检查',
    preprocess: '消息预处理',
    gate: '理解分析',
    reply: '生成回复',
  }
  const translateStage = (stage: string) => stageNames[stage] || stage

  // 健康检查组件中文标签
  const componentLabels: Record<string, { icon: typeof Database; label: string }> = {
    database: { icon: Database, label: '数据库' },
    llm: { icon: BrainCircuit, label: 'AI 模型' },
    runtime: { icon: Cpu, label: '运行时' },
    circuit_breaker: { icon: Shield, label: '熔断器' },
  }

  return (
    <div className="min-h-full p-4 lg:p-6 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight" style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            系统仪表盘
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-muted))' }}>
            实时监控 YaraFlow 系统状态
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={loadData} className="btn btn-outline flex items-center gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            刷新
          </button>
          <button
            onClick={handleRestart}
            disabled={restarting}
            className="btn btn-accent flex items-center gap-1.5 text-xs"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${restarting ? 'animate-spin' : ''}`} aria-hidden="true" />
            {restarting ? '重启中…' : '重启'}
          </button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="card card-hover p-4 min-h-[88px] flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center"
                style={{ background: 'hsl(var(--primary) / 0.1)' }}
              >
                <card.icon className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              {card.status ? (
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: card.status === 'success' ? 'hsl(var(--success))' : 'hsl(var(--error))' }}
                />
              ) : null}
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: 'hsl(var(--text-muted))' }}>{card.label}</p>
              <p className="text-lg font-bold mt-0.5 tracking-tight" style={{ color: 'hsl(var(--text-primary))' }}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
            <h3 className="text-sm font-semibold">24h 调用趋势</h3>
            <span className="badge badge-primary ml-auto">{stats?.total_calls?.toLocaleString() || 0} 次</span>
          </div>
          <div className="h-52">
            {stats?.call_trend && stats.call_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.call_trend}>
                  <defs>
                    <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }} tickLine={false} axisLine={false} width={35} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--surface))', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="calls" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#callsGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs" style={{ color: 'hsl(var(--text-muted))' }}>暂无数据</div>
            )}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-4 w-4" style={{ color: 'hsl(var(--accent))' }} />
            <h3 className="text-sm font-semibold">24h 花费趋势</h3>
            <span className="badge badge-accent ml-auto">¥{stats?.total_cost != null ? stats.total_cost.toFixed(4) : '0.0000'}</span>
          </div>
          <div className="h-52">
            {stats?.cost_trend && stats.cost_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.cost_trend}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }} tickLine={false} axisLine={false} width={50} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--surface))', fontSize: '12px' }} formatter={(v: unknown) => [`¥${Number(v).toFixed(6)}`, '花费']} />
                  <Area type="monotone" dataKey="cost" stroke="hsl(var(--accent))" strokeWidth={2} fillOpacity={1} fill="url(#costGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs" style={{ color: 'hsl(var(--text-muted))' }}>暂无数据</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
            <h3 className="text-sm font-semibold">Token 消耗（近7天）</h3>
            <span className="text-xs ml-auto" style={{ color: 'hsl(var(--text-muted))' }}>
              输入 {(metrics?.llm?.tokens_in || 0).toLocaleString()} / 输出 {(metrics?.llm?.tokens_out || 0).toLocaleString()}
            </span>
          </div>
          <div className="h-52">
            {stats?.token_usage && stats.token_usage.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.token_usage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }} tickLine={false} axisLine={false} width={45} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--surface))', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="prompt_tokens" name="输入 Token" stackId="a" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="completion_tokens" name="输出 Token" stackId="a" fill="hsl(var(--accent))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs" style={{ color: 'hsl(var(--text-muted))' }}>暂无数据</div>
            )}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
            <h3 className="text-sm font-semibold">管线延迟</h3>
          </div>
          <div className="space-y-2.5">
            <div className="p-3 rounded-lg" style={{ background: 'hsl(var(--primary) / 0.06)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>P50</span>
                <span className="text-lg font-bold" style={{ color: 'hsl(var(--primary))' }}>
                  {metrics?.pipeline?.latency_p50 != null ? `${(metrics.pipeline.latency_p50 / 1000).toFixed(1)}s` : '--'}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'hsl(var(--accent) / 0.06)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>P95</span>
                <span className="text-lg font-bold" style={{ color: 'hsl(var(--accent))' }}>
                  {metrics?.pipeline?.latency_p95 != null ? `${(metrics.pipeline.latency_p95 / 1000).toFixed(1)}s` : '--'}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'hsl(var(--primary) / 0.04)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>P99</span>
                <span className="text-lg font-bold" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {metrics?.pipeline?.latency_p99 != null ? `${(metrics.pipeline.latency_p99 / 1000).toFixed(1)}s` : '--'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
            <div className="flex items-center gap-2 mb-3">
              <BrainCircuit className="h-3.5 w-3.5" style={{ color: 'hsl(var(--primary))' }} />
              <span className="text-xs font-semibold">LLM 调用</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg text-center" style={{ background: 'hsl(var(--primary) / 0.06)' }}>
                <p className="text-base font-bold" style={{ color: 'hsl(var(--primary))' }}>{(metrics?.llm?.calls_total || 0).toLocaleString()}</p>
                <p className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>总调用</p>
              </div>
              <div className="p-2.5 rounded-lg text-center" style={{ background: 'hsl(var(--accent) / 0.06)' }}>
                <p className="text-base font-bold" style={{ color: 'hsl(var(--accent))' }}>
                  {metrics?.llm && metrics.llm.calls_total > 0 ? `${((metrics.llm.calls_success / metrics.llm.calls_total) * 100).toFixed(1)}%` : '--'}
                </p>
                <p className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>成功率</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
          <h3 className="text-sm font-semibold">运行时指标</h3>
        </div>
        <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 lg:grid-cols-7">
          <div className="p-3 rounded-lg text-center" style={{ background: 'hsl(var(--primary) / 0.06)' }}>
            <Server className="h-4 w-4 mx-auto mb-1.5" style={{ color: 'hsl(var(--primary))' }} />
            <p className="text-sm font-bold" style={{ color: 'hsl(var(--primary))' }}>{status?.num_cpu || '--'}</p>
            <p className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>CPU 核心</p>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ background: 'hsl(var(--primary) / 0.06)' }}>
            <MessageSquare className="h-4 w-4 mx-auto mb-1.5" style={{ color: 'hsl(var(--primary))' }} />
            <p className="text-sm font-bold" style={{ color: 'hsl(var(--text-primary))' }}>{(metrics?.messages?.received || 0).toLocaleString()}</p>
            <p className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>收到消息</p>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ background: 'hsl(var(--accent) / 0.06)' }}>
            <CheckCircle2 className="h-4 w-4 mx-auto mb-1.5" style={{ color: 'hsl(var(--accent))' }} />
            <p className="text-sm font-bold" style={{ color: 'hsl(var(--text-primary))' }}>{(metrics?.messages?.replied || 0).toLocaleString()}</p>
            <p className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>已回复</p>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ background: 'hsl(var(--primary) / 0.06)' }}>
            <Layers className="h-4 w-4 mx-auto mb-1.5" style={{ color: 'hsl(var(--primary))' }} />
            <p className="text-sm font-bold" style={{ color: 'hsl(var(--text-primary))' }}>{(metrics?.messages?.deduped || 0).toLocaleString()}</p>
            <p className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>已去重</p>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ background: 'hsl(var(--accent) / 0.06)' }}>
            <Database className="h-4 w-4 mx-auto mb-1.5" style={{ color: 'hsl(var(--accent))' }} />
            <p className="text-sm font-bold" style={{ color: 'hsl(var(--text-primary))' }}>{(metrics?.memory?.queries || 0).toLocaleString()}</p>
            <p className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>记忆查询</p>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ background: 'hsl(var(--primary) / 0.06)' }}>
            <Zap className="h-4 w-4 mx-auto mb-1.5" style={{ color: 'hsl(var(--primary))' }} />
            <p className="text-sm font-bold" style={{ color: 'hsl(var(--text-primary))' }}>{(metrics?.memory?.hits || 0).toLocaleString()}</p>
            <p className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>记忆命中</p>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ background: 'hsl(var(--primary) / 0.06)' }}>
            <Globe className="h-4 w-4 mx-auto mb-1.5" style={{ color: 'hsl(var(--primary))' }} />
            <p className="text-sm font-bold" style={{ color: 'hsl(var(--text-primary))' }}>{status?.go_version?.replace('go', '') || '--'}</p>
            <p className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>Go 版本</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
            <h3 className="text-sm font-semibold">插件状态</h3>
            <span className="badge badge-primary ml-auto">{data?.plugins.count || 0} 个</span>
          </div>
          <div className="space-y-1.5">
            {data?.plugins.list?.slice(0, 4).map((plugin) => (
              <div 
                key={plugin.id} 
                className="flex items-center justify-between p-2.5 rounded-lg"
                style={{ background: 'hsl(var(--surface-hover))' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div 
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ 
                      background: plugin.status === 'loaded' ? 'hsl(var(--success))' : 
                                   plugin.status === 'disabled' ? 'hsl(var(--primary))' : 'hsl(var(--error))' 
                    }}
                  />
                  <span className="text-xs font-medium truncate">{plugin.id}</span>
                </div>
                <span className={`badge ${
                  plugin.status === 'loaded' ? 'badge-success' :
                  plugin.status === 'disabled' ? 'badge-primary' :
                  'badge-error'
                }`}>
                  {plugin.status === 'loaded' ? '已加载' : plugin.status === 'disabled' ? '已禁用' : '错误'}
                </span>
              </div>
            )) || (
              <div className="py-6 text-center text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                暂无插件
              </div>
            )}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
            <h3 className="text-sm font-semibold">LLM 概览</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg text-center" style={{ background: 'hsl(var(--primary) / 0.08)' }}>
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>{data?.llm.providers || 0}</p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--text-muted))' }}>AI 提供商</p>
            </div>
            <div className="p-4 rounded-lg text-center" style={{ background: 'hsl(var(--accent) / 0.08)' }}>
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--accent))' }}>{data?.llm.models || 0}</p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--text-muted))' }}>配置模型</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
            <h3 className="text-sm font-semibold">熔断器</h3>
            <span className={`badge ml-auto ${
              metrics?.circuit_breaker === 'closed' ? 'badge-success' :
              metrics?.circuit_breaker === 'open' ? 'badge-error' :
              'badge-warning'
            }`}>
              {metrics?.circuit_breaker === 'closed' ? '正常' :
               metrics?.circuit_breaker === 'open' ? '熔断' :
               metrics?.circuit_breaker === 'half-open' ? '半开' : '--'}
            </span>
          </div>
          <div className="space-y-2.5">
            <div className="p-3 rounded-lg" style={{ background: 'hsl(var(--primary) / 0.06)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>状态</span>
                <span className="text-sm font-bold" style={{ color: metrics?.circuit_breaker === 'closed' ? 'hsl(var(--success))' : metrics?.circuit_breaker === 'open' ? 'hsl(var(--error))' : 'hsl(var(--warning))' }}>
                  {metrics?.circuit_breaker === 'closed' ? 'Closed (正常通行)' :
                   metrics?.circuit_breaker === 'open' ? 'Open (拒绝请求)' :
                   metrics?.circuit_breaker === 'half-open' ? 'Half-Open (探测恢复)' : '未初始化'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg text-center" style={{ background: 'hsl(var(--success) / 0.06)' }}>
                <p className="text-base font-bold" style={{ color: 'hsl(var(--success))' }}>{(metrics?.llm?.calls_success || 0).toLocaleString()}</p>
                <p className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>成功调用</p>
              </div>
              <div className="p-2.5 rounded-lg text-center" style={{ background: 'hsl(var(--error) / 0.06)' }}>
                <p className="text-base font-bold" style={{ color: 'hsl(var(--error))' }}>{(metrics?.llm?.calls_error || 0).toLocaleString()}</p>
                <p className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>失败调用</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4" style={{ color: sseConnected ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))' }} />
            <h3 className="text-sm font-semibold">实时消息处理</h3>
          </div>
          <span className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
            {sseConnected ? (
              <span className="badge badge-success">已连接</span>
            ) : (
              <span>连接中…</span>
            )}
          </span>
        </div>
        {(() => {
          const traceMap = new Map<string, { events: PipelineEvent[], shouldReply: boolean, replyContent: string, groupId: string }>()
          for (const evt of pipelineEvents) {
            const tid = evt.trace_id
            if (!tid) continue
            if (!traceMap.has(tid)) {
              traceMap.set(tid, { events: [], shouldReply: false, replyContent: '', groupId: evt.group_id || '' })
            }
            const group = traceMap.get(tid)!
            group.events.push(evt)
            if (evt.type === 'pipeline_end') {
              group.shouldReply = evt.should_reply === true
              group.replyContent = evt.reply_content || ''
              if (evt.group_id) group.groupId = evt.group_id
            }
            if (evt.group_id && !group.groupId) group.groupId = evt.group_id
          }

          const replyTraces = Array.from(traceMap.entries())
            .filter(([_, v]) => v.shouldReply)
            .sort((a, b) => {
              const aTime = a[1].events[0]?.created_at || 0
              const bTime = b[1].events[0]?.created_at || 0
              return bTime - aTime
            })

          // 按群分组
          const groupMap = new Map<string, typeof replyTraces>()
          for (const entry of replyTraces) {
            const gid = entry[1].groupId || 'private'
            if (!groupMap.has(gid)) groupMap.set(gid, [])
            groupMap.get(gid)!.push(entry)
          }

          if (replyTraces.length === 0) {
            return (
              <div className="py-8 text-center text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                等待消息事件…
              </div>
            )
          }

          return (
            <div className="max-h-64 overflow-auto space-y-3">
              {Array.from(groupMap.entries()).map(([groupId, traces]) => (
                <div key={groupId}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="badge badge-primary text-[10px]">{groupId || '私聊'}</span>
                    <span className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>{traces.length} 条回复</span>
                  </div>
                  <div className="space-y-1 ml-2 pl-3" style={{ borderLeft: '2px solid hsl(var(--primary) / 0.2)' }}>
                    {traces.map(([traceId, traceData]) => {
                      const startEvt = traceData.events.find((e) => e.type === 'pipeline_start')
                      const endEvt = traceData.events.find((e) => e.type === 'pipeline_end')
                      const stageEvts = traceData.events.filter((e) => e.type === 'stage_complete')

                      return (
                        <div key={traceId} className="p-2 rounded-lg text-xs" style={{ background: 'hsl(var(--surface-hover))' }}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium" style={{ color: 'hsl(var(--primary))' }}>
                              {startEvt?.sender_id || '-'}
                            </span>
                            <span className="truncate max-w-28" style={{ color: 'hsl(var(--text-muted))' }}>
                              {startEvt?.content || '-'}
                            </span>
                            <span style={{ color: 'hsl(var(--text-muted))' }}>→</span>
                            <span className="truncate max-w-36 font-medium" style={{ color: 'hsl(var(--accent))' }}>
                              {traceData.replyContent || '回复'}
                            </span>
                            <span className="ml-auto text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>
                              {endEvt?.total_ms != null ? `${(endEvt.total_ms / 1000).toFixed(1)}s` : ''}
                            </span>
                          </div>
                          {stageEvts.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {stageEvts.map((s, si) => (
                                <span key={si} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'hsl(var(--primary) / 0.06)', color: 'hsl(var(--text-muted))' }}>
                                  {translateStage(s.stage || '')} {s.duration_ms != null ? (s.duration_ms >= 1000 ? `${(s.duration_ms / 1000).toFixed(1)}s` : `${s.duration_ms}ms`) : ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      {health && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4" style={{ color: health.status === 'ok' ? 'hsl(var(--primary))' : 'hsl(var(--warning))' }} />
              <h3 className="text-sm font-semibold">系统健康</h3>
            </div>
            <span className={`badge ${
              health.status === 'ok' ? 'badge-success' :
              health.status === 'degraded' ? 'badge-warning' :
              'badge-error'
            }`}>
              {health.status === 'ok' ? '正常' : health.status === 'degraded' ? '部分异常' : '异常'}
            </span>
          </div>
          <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
            {health.components && Object.entries(health.components).map(([name, comp]) => {
              const compInfo = componentLabels[name] || { icon: Server, label: name }
              return (
                <div key={name} className="p-2.5 rounded-lg" style={{ background: 'hsl(var(--surface-hover))' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <compInfo.icon className="h-3.5 w-3.5" style={{ color: 'hsl(var(--primary))' }} />
                    <span className="text-xs font-medium">{compInfo.label}</span>
                    <span className={`badge badge-${comp.status === 'ok' ? 'success' : 'error'} ml-auto`}>
                      {comp.status === 'ok' ? '正常' : '异常'}
                    </span>
                  </div>
                  <p className="text-[10px] truncate" style={{ color: 'hsl(var(--text-muted))' }}>{comp.message || '-'}</p>
                </div>
              )
            }) || (
              <p className="col-span-full py-2 text-xs" style={{ color: 'hsl(var(--text-muted))' }}>暂无组件信息</p>
            )}
          </div>
        </div>
      )}

      {status && (
        <div className="p-3 rounded-lg" style={{ background: 'hsl(var(--surface-hover))', border: '1px solid hsl(var(--border))' }}>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
            <span>版本 <span className="font-medium" style={{ color: 'hsl(var(--text-primary))' }}>{status.version}</span></span>
            <span>Go <span className="font-medium" style={{ color: 'hsl(var(--text-primary))' }}>{status.go_version}</span></span>
            <span>CPU <span className="font-medium" style={{ color: 'hsl(var(--text-primary))' }}>{status.num_cpu} 核心</span></span>
            <span>启动于 <span className="font-medium" style={{ color: 'hsl(var(--text-primary))' }}>{new Date(status.start_time).toLocaleString('zh-CN')}</span></span>
          </div>
        </div>
      )}

      {restarting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="rounded-xl bg-surface p-6 shadow-lg max-w-xs w-full mx-4" style={{ border: '1px solid hsl(var(--border))' }}>
            <div 
              className="h-12 w-12 rounded-lg flex items-center justify-center mx-auto mb-3"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' }}
            >
              <RefreshCw className="h-6 w-6 animate-spin text-white" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-center">{restartMessage}</p>
            <p className="text-xs text-center mt-1" style={{ color: 'hsl(var(--text-muted))' }}>请耐心等待…</p>
          </div>
        </div>
      )}
    </div>
  )
}
