import { useState, useEffect, useRef, useCallback } from 'react'
import {
  FileText,
  RefreshCw,
  Pause,
  Play,
  Trash2,
  Search,
  X,
  ChevronDown,
  Download,
} from 'lucide-react'
import { subscribeLogs } from '../lib/api'

type LogLevel = 'all' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

function detectLevel(line: string): string {
  // 优先从 [LEVEL] 前缀解析级别，避免因消息内容含有关键词而误判
  const match = line.match(/^\[(DEBUG|INFO|WARN|ERROR|FATAL|PANIC)\]/i)
  if (match) {
    const level = match[1].toLowerCase()
    if (level === 'panic') return 'fatal'
    return level
  }
  // 兜底：没有 [LEVEL] 前缀时用关键词匹配
  const lower = line.toLowerCase()
  if (lower.includes('fatal') || lower.includes('panic')) return 'fatal'
  if (lower.includes('error') || lower.includes('err]')) return 'error'
  if (lower.includes('warn') || lower.includes('warning')) return 'warn'
  if (lower.includes('debug') || lower.includes('trace')) return 'debug'
  return 'info'
}

const LEVEL_COLORS: Record<string, string> = {
  debug: 'text-purple-300',
  info: 'text-sky-300',
  warn: 'text-amber-300',
  error: 'text-red-400',
  fatal: 'text-red-500',
}

const LEVEL_BG: Record<string, string> = {
  debug: 'bg-purple-500/5',
  info: '',
  warn: 'bg-amber-500/5',
  error: 'bg-red-500/8',
  fatal: 'bg-red-600/10',
}

export function Logs() {
  const [logs, setLogs] = useState<string[]>([])
  const [paused, setPaused] = useState(false)
  const [filter, setFilter] = useState<LogLevel>('all')
  const [search, setSearch] = useState('')
  const [connected, setConnected] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const pausedLogsRef = useRef<string[]>([])
  const autoScrollRef = useRef(true)

  const addLog = useCallback((line: string) => {
    if (paused) {
      pausedLogsRef.current.push(line)
      if (pausedLogsRef.current.length > 500) {
        pausedLogsRef.current = pausedLogsRef.current.slice(-500)
      }
      return
    }
    setLogs(prev => {
      const next = [...prev, line]
      return next.length > 1000 ? next.slice(-1000) : next
    })
  }, [paused])

  useEffect(() => {
    const es = subscribeLogs((line) => {
      addLog(line)
    })
    es.onopen = () => setConnected(true)
    es.onerror = () => setConnected(false)

    return () => {
      es.close()
      setConnected(false)
    }
  }, [addLog])

  useEffect(() => {
    if (autoScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 50
  }, [])

  const handlePause = () => {
    setPaused(prev => {
      if (prev) {
        if (pausedLogsRef.current.length > 0) {
          setLogs(prevLogs => {
            const next = [...prevLogs, ...pausedLogsRef.current]
            return next.length > 1000 ? next.slice(-1000) : next
          })
          pausedLogsRef.current = []
        }
      }
      return !prev
    })
  }

  const handleClear = () => {
    setLogs([])
    pausedLogsRef.current = []
  }

  const filteredLogs = logs.filter(line => {
    if (filter !== 'all' && detectLevel(line) !== filter) return false
    if (search && !line.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleExport = () => {
    const blob = new Blob([filteredLogs.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yaraflow-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const levelCounts: Record<string, number> = {}
  for (const line of logs) {
    const lvl = detectLevel(line)
    levelCounts[lvl] = (levelCounts[lvl] || 0) + 1
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'debug': return 'badge badge-pink'
      case 'info': return 'badge badge-blue'
      case 'warn': return 'badge badge-warning'
      case 'error': return 'badge badge-error'
      case 'fatal': return 'badge badge-error'
      default: return 'badge badge-blue'
    }
  }

  const getFilterBtnClass = (level: LogLevel) => {
    const base = 'rounded-xl px-4 py-2 text-xs font-bold transition-all'
    if (filter === level) {
      if (level === 'all') {
        return `${base} bg-gradient-to-r from-[hsl(213,93%,55%)] to-[hsl(330,82%,55%)] text-white`
      }
      return `${base} ${getLevelBadge(level)}`
    }
    return `${base} text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--surface-hover))] hover:text-[hsl(var(--text-primary))]`
  }

  return (
    <div className="flex flex-col h-full p-4 lg:p-6 aurora-bg">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-gradient">实时日志</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {connected ? (
              <span className="badge badge-success text-[10px]">
                <span className="status-dot status-dot-success" />
                SSE 已连接
              </span>
            ) : (
              <span>连接中...</span>
            )}
            <span className="mx-1.5 text-muted-foreground/30">|</span>
            共 <span className="font-bold text-foreground">{logs.length}</span> 条
            {paused && <span className="ml-1.5 badge badge-warning text-[10px]">已暂停</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
            className="btn btn-outline text-xs"
            title="导出日志"
          >
            <Download className="h-3.5 w-3.5" />
            导出
          </button>
          <button
            onClick={handleClear}
            className="btn btn-outline text-xs"
            title="清空日志"
          >
            <Trash2 className="h-3.5 w-3.5" />
            清空
          </button>
          <button
            onClick={handlePause}
            className="btn btn-accent text-xs"
            title={paused ? '继续' : '暂停'}
          >
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {paused ? '继续' : '暂停'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4 shrink-0">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索日志..."
            className="input pl-9 pr-8 text-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1">
          {(['all', 'debug', 'info', 'warn', 'error', 'fatal'] as LogLevel[]).map(level => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all ${
                filter === level
                  ? level === 'all'
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-sm'
                    : `${getLevelBadge(level)} shadow-sm`
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface'
              }`}
            >
              {level === 'all' ? '全部' : level.toUpperCase()}
              {level !== 'all' && levelCounts[level] ? (
                <span className="ml-1 opacity-60">({levelCounts[level]})</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 rounded-xl card overflow-auto font-mono text-sm leading-relaxed"
        style={{ background: 'hsl(222 47% 6%)' }}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="h-16 w-16 rounded-2xl bg-slate-800 flex items-center justify-center">
              <FileText size={32} className="text-slate-500" aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-400 mb-1">暂无日志</p>
              <p className="text-xs text-slate-600">
                {search || filter !== 'all' ? '没有匹配的日志，请调整筛选条件' : '等待日志数据...'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-1.5">
            {filteredLogs.map((line, i) => {
              const level = detectLevel(line)
              // 提取时间戳部分（如果存在）
              const timeMatch = line.match(/\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}/)
              const timePart = timeMatch ? timeMatch[0] : null
              const contentPart = timePart ? line.replace(timeMatch![0], '').trimStart() : line
              // 去掉可能的前缀方括号如 [INFO]
              const cleanContent = contentPart.replace(/^\[[A-Z]+\]\s*/, '')

              return (
                <div
                  key={i}
                  className={`flex items-start gap-1.5 px-2.5 py-1 rounded hover:bg-[hsl(var(--primary)/0.04)] transition-colors group ${LEVEL_BG[level] || ''}`}
                >
                  <span className={`shrink-0 w-12 text-[10px] font-mono mt-0.5 text-right ${LEVEL_COLORS[level] || 'text-muted-foreground'}`}>
                    {level.toUpperCase()}
                  </span>
                  {timePart && (
                    <span className="shrink-0 text-[10px] font-mono mt-0.5 text-slate-500">
                      {timePart.replace(/^\d{4}-/, '')}
                    </span>
                  )}
                  <span className="whitespace-pre-wrap break-all text-[12px] leading-relaxed text-slate-300">{cleanContent}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {!autoScrollRef.current && filteredLogs.length > 0 && (
        <button
          onClick={() => {
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight
            }
            autoScrollRef.current = true
          }}
          className="fixed bottom-8 right-8 rounded-full bg-gradient-to-r from-[hsl(330,82%,55%)] to-[hsl(330,75%,60%)] text-white p-3 shadow-lg shadow-[hsl(330,82%,55%)/0.3] hover:opacity-90 transition-all hover:scale-105 animate-fade-in"
          title="跳转到底部"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
