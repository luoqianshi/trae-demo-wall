import { useState, useEffect, useRef, useCallback } from 'react'
import { Download, X, Check, AlertTriangle, Loader2, RefreshCw, Zap } from 'lucide-react'
import { createEventSource } from '../../lib/api'
import type { DownloadProgressEvent } from '../../types/download'

interface DownloadItem extends DownloadProgressEvent {
  /** 标记为完成/失败的项在短暂显示后自动移除 */
  willRemove?: boolean
}

export function DownloadPanel() {
  const [open, setOpen] = useState(false)
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const downloadsRef = useRef(downloads)
  downloadsRef.current = downloads
  const panelRef = useRef<HTMLDivElement>(null)
  const [thunderAvailable, setThunderAvailable] = useState<boolean | null>(null)
  const [thunderChecking, setThunderChecking] = useState(false)
  const [thunderToast, setThunderToast] = useState<string | null>(null)

  // 点击外部关闭
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // SSE 订阅下载进度
  useEffect(() => {
    const es = createEventSource('/downloads/progress/stream')
    es.onmessage = (e) => {
      try {
        const event: DownloadProgressEvent = JSON.parse(e.data)
        setDownloads(prev => {
          const idx = prev.findIndex(d => d.download_id === event.download_id)
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = { ...event }
            return next
          }
          return [...prev, event]
        })
      } catch { /* ignore parse errors */ }
    }
    es.onerror = () => { /* 自动重连 */ }
    return () => es.close()
  }, [])

  // 完成/失败后自动移除
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    downloads.forEach((d) => {
      if ((d.status === 'completed' || d.status === 'failed') && !d.willRemove) {
        setDownloads(prev =>
          prev.map(item =>
            item.download_id === d.download_id ? { ...item, willRemove: true } : item
          )
        )
        const delay = d.status === 'completed' ? 5000 : 10000
        timers.push(setTimeout(() => {
          setDownloads(prev => prev.filter(item => item.download_id !== d.download_id))
        }, delay))
      }
    })
    return () => timers.forEach(clearTimeout)
  }, [downloads])

  const activeCount = downloads.filter(d => d.status === 'downloading').length
  const hasFailed = downloads.some(d => d.status === 'failed')

  // 面板打开时获取迅雷状态
  useEffect(() => {
    if (!open) return
    fetch('/api/downloads/thunder/check')
      .then(res => res.json())
      .then(data => setThunderAvailable(data.available))
      .catch(() => {})
  }, [open])

  // Toast 自动消失
  useEffect(() => {
    if (!thunderToast) return
    const timer = setTimeout(() => setThunderToast(null), 3000)
    return () => clearTimeout(timer)
  }, [thunderToast])

  const checkThunder = async () => {
    setThunderChecking(true)
    try {
      const res = await fetch('/api/downloads/thunder/check', { method: 'POST' })
      const data = await res.json()
      setThunderAvailable(data.available)
      setThunderToast(data.available ? '检测到迅雷，下次下载将使用迅雷加速' : '未检测到迅雷，将使用内置下载')
    } catch {
      setThunderToast('检测失败，请稍后重试')
    } finally {
      setThunderChecking(false)
    }
  }

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec < 1024) return `${bytesPerSec} B/s`
    if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`
  }

  const formatSize = (bytes: number) => {
    if (bytes <= 0) return '?'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* 下载按钮 */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="下载管理"
        title="下载管理"
        className="btn-ghost relative inline-flex items-center justify-center rounded-md p-1.5"
      >
        <Download
          className="h-4 w-4"
          style={{ color: 'hsl(var(--text-muted))' }}
          aria-hidden="true"
        />
        {activeCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-[9px] font-bold text-white min-w-[14px] h-[14px] px-[2px] animate-pulse-soft"
            style={{ background: 'hsl(var(--primary))' }}
          >
            {activeCount}
          </span>
        )}
        {hasFailed && activeCount === 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full"
            style={{ background: 'hsl(var(--danger, 0, 84%, 60%))' }}
          />
        )}
      </button>

      {/* 下载面板 */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden animate-fade-scale bg-white dark:bg-gray-900"
          style={{
            backdropFilter: 'blur(20px)',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          {/* 面板标题 */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid hsl(var(--border))' }}
          >
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
              <span className="text-sm font-semibold">下载管理</span>
              {activeCount > 0 && (
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'hsl(var(--primary) / 0.12)',
                    color: 'hsl(var(--primary))',
                  }}
                >
                  {activeCount} 个进行中
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* 迅雷状态 + 重新检测按钮 */}
              {thunderAvailable !== null && (
                <button
                  onClick={checkThunder}
                  disabled={thunderChecking}
                  className="btn-ghost inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px]"
                  title={thunderAvailable ? '迅雷可用，点击重新检测' : '迅雷不可用，点击重新检测'}
                  style={{ color: 'hsl(var(--text-muted))' }}
                >
                  {thunderChecking ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  {thunderAvailable ? (
                    <span style={{ color: 'hsl(142, 76%, 45%)' }}>迅雷</span>
                  ) : (
                    <span>迅雷</span>
                  )}
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="btn-ghost inline-flex items-center justify-center rounded-md p-1"
                aria-label="关闭"
              >
                <X className="h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
              </button>
            </div>
          </div>

          {/* 下载列表 */}
          <div className="max-h-[360px] overflow-y-auto">
            {downloads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Download
                  className="h-8 w-8"
                  style={{ color: 'hsl(var(--text-muted) / 0.3)' }}
                />
                <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                  暂无下载任务
                </p>
              </div>
            ) : (
              downloads.map((d) => (
                <div
                  key={d.download_id}
                  className="px-4 py-3 transition-all duration-300"
                  style={{
                    borderBottom: '1px solid hsl(var(--border) / 0.5)',
                    opacity: d.willRemove ? 0.6 : 1,
                  }}
                >
                  {/* 文件名 + 状态图标 */}
                  <div className="flex items-start gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-medium truncate"
                        style={{ maxWidth: '200px' }}
                        title={d.file_name}
                      >
                        {d.file_name}
                      </p>
                      <p
                        className="text-[10px] truncate"
                        style={{ color: 'hsl(var(--text-muted))', maxWidth: '200px' }}
                        title={d.url}
                      >
                        {d.url}
                      </p>
                    </div>
                    {d.status === 'downloading' && (
                      <Loader2
                        className="h-4 w-4 flex-shrink-0 animate-spin"
                        style={{ color: 'hsl(var(--primary))' }}
                      />
                    )}
                    {d.status === 'completed' && (
                      <Check
                        className="h-4 w-4 flex-shrink-0"
                        style={{ color: 'hsl(142, 76%, 45%)' }}
                      />
                    )}
                    {d.status === 'failed' && (
                      <AlertTriangle
                        className="h-4 w-4 flex-shrink-0"
                        style={{ color: 'hsl(var(--danger, 0, 84%, 60%))' }}
                      />
                    )}
                  </div>

                  {/* 进度条 */}
                  {d.status === 'downloading' && (
                    <>
                      <div className="w-full h-1.5 rounded-full overflow-hidden mb-1" style={{ background: 'hsl(var(--border))' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${Math.max(d.percent, 2)}%`,
                            background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))',
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span style={{ color: 'hsl(var(--text-muted))' }}>
                          {d.percent}% · {formatSize(d.downloaded)} / {d.total > 0 ? formatSize(d.total) : '?'}
                        </span>
                        <span style={{ color: 'hsl(var(--primary))' }}>
                          {formatSpeed(d.speed)}
                        </span>
                      </div>
                    </>
                  )}

                  {/* 失败信息 */}
                  {d.status === 'failed' && d.error && (
                    <p
                      className="text-[10px] mt-1"
                      style={{ color: 'hsl(var(--danger, 0, 84%, 60%))' }}
                    >
                      {d.error}
                    </p>
                  )}

                  {/* 完成信息 */}
                  {d.status === 'completed' && (
                    <p className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>
                      下载完成 · {formatSize(d.downloaded)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {thunderToast && (
        <div
          className="fixed bottom-4 right-4 z-50 rounded-lg px-4 py-2 text-sm shadow-lg animate-fade-scale"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--text))',
          }}
        >
          {thunderToast}
        </div>
      )}
    </div>
  )
}