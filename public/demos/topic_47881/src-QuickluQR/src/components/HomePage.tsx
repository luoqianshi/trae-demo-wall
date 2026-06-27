import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import ErrorBoundary from './ErrorBoundary'
import Toast from './Toast'
import { showToast } from './toastStore'
import { getByteLength, QR_CAPACITY, copySvgAsPng, downloadSvgAsPng } from '../utils/qr'
import { useHistory } from '../hooks/useHistory'
import HelpModal from './HelpModal'

type ECLevel = 'L' | 'M' | 'Q' | 'H'

function formatTime(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  const minute = 60 * 1000
  const hour = 60 * minute

  if (diff < minute) {
    return '刚刚'
  }
  if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  }

  const date = new Date(ts)
  const nowDate = new Date(now)
  const isToday =
    date.getFullYear() === nowDate.getFullYear() &&
    date.getMonth() === nowDate.getMonth() &&
    date.getDate() === nowDate.getDate()

  const pad = (n: number) => n.toString().padStart(2, '0')

  if (isToday) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  if (date.getFullYear() === nowDate.getFullYear()) {
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function highlightText(text: string, keyword: string): ReactNode {
  if (!keyword) return text
  const lowerText = text.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()
  const parts: ReactNode[] = []
  let lastIndex = 0
  let index = lowerText.indexOf(lowerKeyword)

  while (index !== -1) {
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index))
    }
    parts.push(<mark key={index}>{text.slice(index, index + keyword.length)}</mark>)
    lastIndex = index + keyword.length
    index = lowerText.indexOf(lowerKeyword, lastIndex)
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

export default function HomePage() {
  const [text, setText] = useState('')
  const [qrValue, setQrValue] = useState('')
  const [ecLevel, setEcLevel] = useState<ECLevel>('M')
  const [enableCompression, setEnableCompression] = useState(false)
  const [whiteBg, setWhiteBg] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [tab, setTab] = useState<'generate' | 'history'>('generate')
  const [showHelp, setShowHelp] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('quicklyqr-theme')
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const qrContainerRef = useRef<HTMLDivElement>(null)
  const { items, error, addHistory, deleteHistory, clearHistory } = useHistory()

  useEffect(() => {
    if (error) {
      showToast(error, 'error')
    }
  }, [error])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('quicklyqr-theme', theme)
  }, [theme])

  const toggleTheme = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const x = e.clientX
    const y = e.clientY
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

    const doToggle = () => {
      setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
    }

    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        doToggle()
      })
      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 500,
            easing: 'ease-in-out',
            pseudoElement: '::view-transition-new(root)',
          },
        )
      })
    } else {
      doToggle()
    }
  }, [])

  const byteLength = getByteLength(text)
  const capacity = QR_CAPACITY[ecLevel]
  const isOverLimit = byteLength > capacity.max
  const isNearLimit = byteLength > capacity.warn && !isOverLimit
  const ratio = Math.min(byteLength / capacity.max, 1)

  const handleGenerateQR = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed) return

    let finalValue = trimmed
    if (enableCompression) {
      finalValue = trimmed.replace(/\s+/g, ' ').trim()
    }

    const finalBytes = getByteLength(finalValue)
    if (finalBytes > QR_CAPACITY[ecLevel].max) {
      showToast(
        `内容过长（${finalBytes} 字节），当前纠错等级最多支持 ${QR_CAPACITY[ecLevel].max} 字节。请缩短内容或降低纠错等级。`,
        'error',
      )
      return
    }

    setQrValue(finalValue)
    addHistory({ content: finalValue, ecLevel, whiteBg })
  }, [text, enableCompression, ecLevel, whiteBg, addHistory])

  const handleClearQR = useCallback(() => {
    setQrValue('')
    setText('')
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleGenerateQR()
      }
    },
    [handleGenerateQR],
  )

  const handleCopyImage = useCallback(async () => {
    if (!qrContainerRef.current) return
    const svg = qrContainerRef.current.querySelector('svg')
    if (!svg) return
    const ok = await copySvgAsPng(svg as SVGSVGElement, whiteBg)
    showToast(ok ? '二维码已复制到剪贴板' : '复制失败，请尝试下载', ok ? 'success' : 'error')
  }, [whiteBg])

  const handleDownload = useCallback(async () => {
    if (!qrContainerRef.current) return
    const svg = qrContainerRef.current.querySelector('svg')
    if (!svg) return
    const ok = await downloadSvgAsPng(svg as SVGSVGElement, 'qrcode.png', whiteBg)
    showToast(ok ? '二维码已下载' : '下载失败', ok ? 'success' : 'error')
  }, [whiteBg])

  const handleLoadHistory = useCallback((item: { content: string; ecLevel: ECLevel; whiteBg: boolean }) => {
    setText(item.content)
    setEcLevel(item.ecLevel)
    setWhiteBg(item.whiteBg)
    setQrValue(item.content)
    setTab('generate')
  }, [])

  const handleDeleteHistory = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteHistory(id)
    showToast('已删除', 'success')
  }, [deleteHistory])

  const handleClearHistory = useCallback(async () => {
    if (window.confirm('确定要清空所有历史记录吗？')) {
      await clearHistory()
      showToast('已清空', 'success')
    }
  }, [clearHistory])

  const filteredItems = searchKeyword
    ? items.filter((item) => item.content.toLowerCase().includes(searchKeyword.toLowerCase()))
    : items

  const counterColor = isOverLimit
    ? 'var(--error)'
    : isNearLimit
      ? 'var(--warning)'
      : 'var(--text-soft)'

  return (
    <div className="home-page">
      <Toast />

      <div className="page-header">
        <div className="header-icon-small">
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="8" height="8" rx="1.5" fill="currentColor" />
            <rect x="18" y="2" width="8" height="8" rx="1.5" fill="currentColor" />
            <rect x="2" y="18" width="8" height="8" rx="1.5" fill="currentColor" />
            <rect x="11" y="2" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
            <rect x="14" y="2" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
            <rect x="11" y="5" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
            <rect x="2" y="11" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
            <rect x="5" y="11" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
            <rect x="5" y="14" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
            <rect x="11" y="11" width="8" height="8" rx="1" fill="currentColor" opacity="0.8" />
            <rect x="21" y="11" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
            <rect x="24" y="14" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
            <rect x="21" y="17" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
            <rect x="11" y="21" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
            <rect x="14" y="24" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
            <rect x="21" y="21" width="5" height="5" rx="1" fill="currentColor" opacity="0.6" />
          </svg>
        </div>
        <div className="header-title-wrap">
          <h1 className="page-title">QuicklyQR</h1>
          <p className="page-subtitle">快速生成二维码 · 支持复制与下载</p>
        </div>
        <button
          className="theme-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? '切换浅色模式' : '切换深色模式'}
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.5 8.5A5.5 5.5 0 017.5 2.5a6 6 0 106 6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <button
          className="help-btn"
          onClick={() => setShowHelp(true)}
          title="帮助"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6.5 6.5a2.5 2.5 0 014.2 1.3c0 1.5-2.7 1.7-2.7 3M9 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          帮助
        </button>
      </div>

      <div className="tab-bar">
        <button
          className={`tab-btn ${tab === 'generate' ? 'tab-active' : ''}`}
          onClick={() => setTab('generate')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          生成二维码
        </button>
        <button
          className={`tab-btn ${tab === 'history' ? 'tab-active' : ''}`}
          onClick={() => setTab('history')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          历史记录
          {items.length > 0 && <span className="tab-badge">{items.length}</span>}
        </button>
      </div>

      {tab === 'generate' && (
        <div className="qr-generator">
          <div className="card input-card">
            <div className="card-header">
              <h2 className="card-title">输入内容</h2>
              <span className="char-counter" style={{ color: counterColor }}>
                {byteLength} / {capacity.max} 字节
                {isOverLimit && ' · 超出限制'}
                {isNearLimit && ' · 接近上限'}
              </span>
            </div>

            <div className="capacity-bar">
              <div
                className={`capacity-fill ${isOverLimit ? 'fill-over' : isNearLimit ? 'fill-warn' : ''}`}
                style={{ width: `${ratio * 100}%` }}
              />
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请输入文本或网址...&#10;支持 Ctrl/Cmd + Enter 快速生成"
              rows={5}
              className={`text-input ${isOverLimit ? 'input-error' : ''}`}
            />

            <div className="options-section">
              <div className="option-group">
                <label className="option-label">纠错等级</label>
                <div className="ec-selector">
                  {(Object.keys(QR_CAPACITY) as ECLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`ec-btn ${ecLevel === level ? 'ec-active' : ''}`}
                      onClick={() => setEcLevel(level)}
                      title={QR_CAPACITY[level].desc}
                    >
                      {QR_CAPACITY[level].label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={enableCompression}
                  onChange={(e) => setEnableCompression(e.target.checked)}
                />
                <span className="checkbox-custom" />
                折叠多余空白
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={whiteBg}
                  onChange={(e) => setWhiteBg(e.target.checked)}
                />
                <span className="checkbox-custom" />
                白色背景
              </label>
            </div>

            <div className="button-group">
              <button
                onClick={handleGenerateQR}
                disabled={!text.trim() || isOverLimit}
                className="btn btn-primary"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8a6 6 0 0110.89-3.48M14 8A6 6 0 013.11 11.48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M14 3v3h-3M2 13v-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                生成二维码
              </button>
              <button
                onClick={handleClearQR}
                disabled={!qrValue && !text}
                className="btn btn-ghost"
              >
                清空
              </button>
            </div>
          </div>

          <div className="card output-card">
            <div className="card-header">
              <h2 className="card-title">二维码预览</h2>
            </div>

            <div className="qr-display-area">
              {qrValue ? (
                <ErrorBoundary
                  fallback={
                    <div className="qr-error">
                      <div className="error-icon">⚠</div>
                      <p>二维码生成失败</p>
                      <p className="error-detail">内容可能过长，请缩短后重试</p>
                    </div>
                  }
                >
                  <div className={`qr-code-wrapper ${whiteBg ? '' : 'qr-transparent'}`}>
                    <div className="qr-code-container" ref={qrContainerRef}>
                      <QRCodeSVG
                        value={qrValue}
                        size={240}
                        level={ecLevel}
                        includeMargin={true}
                        bgColor="transparent"
                        fgColor="#1a1a2e"
                      />
                    </div>
                  </div>
                  <div className="action-buttons">
                    <button onClick={handleCopyImage} className="btn btn-action">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M3 11V4.5A1.5 1.5 0 014.5 3H11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                      复制图像
                    </button>
                    <button onClick={handleDownload} className="btn btn-action btn-action-primary">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 2v8m0 0l3-3m-3 3L5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 11v1.5A1.5 1.5 0 003.5 14h9a1.5 1.5 0 001.5-1.5V11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                      下载 PNG
                    </button>
                  </div>
                  {qrValue.length <= 200 && (
                    <p className="qr-content-text">{qrValue}</p>
                  )}
                  {qrValue.length > 200 && (
                    <p className="qr-content-text" title={qrValue}>
                      {qrValue.slice(0, 200)}...
                    </p>
                  )}
                </ErrorBoundary>
              ) : (
                <div className="placeholder">
                  <div className="placeholder-icon">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <rect x="6" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                      <rect x="30" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                      <rect x="6" y="30" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                      <rect x="21" y="6" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
                      <rect x="27" y="6" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
                      <rect x="6" y="21" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
                      <rect x="21" y="21" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="2" opacity="0.4" />
                      <rect x="33" y="33" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                    </svg>
                  </div>
                  <p>输入内容后点击「生成二维码」</p>
                  <p className="placeholder-hint">支持 Ctrl/Cmd + Enter 快捷生成</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="card history-card">
          <div className="card-header history-header">
            <div className="history-title-wrap">
              <h2 className="card-title">历史记录</h2>
              <span className="history-count">({items.length})</span>
            </div>
            <div className="history-actions">
              <div className="search-input-wrap">
                <input
                  type="text"
                  className="search-input"
                  placeholder="搜索历史记录..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                {searchKeyword && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchKeyword('')}
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                type="button"
                className="btn btn-clear-history"
                onClick={handleClearHistory}
                disabled={items.length === 0}
              >
                清空历史
              </button>
            </div>
          </div>

          <div className="history-list">
            {filteredItems.length === 0 ? (
              <div className="history-empty">
                {searchKeyword
                  ? `未找到匹配"${searchKeyword}"的记录`
                  : '暂无历史记录，生成二维码后将自动保存'}
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="history-item"
                  onClick={() => handleLoadHistory(item)}
                >
                  <div className="history-item-content">
                    <span className="history-content-preview">
                      {highlightText(item.content.length > 100 ? item.content.slice(0, 100) + '...' : item.content, searchKeyword)}
                    </span>
                    <span className="history-tag">{item.ecLevel}</span>
                    {item.whiteBg && <span className="history-whitebg-indicator" title="白色背景">□</span>}
                  </div>
                  <div className="history-item-right">
                    <span className="history-time">{formatTime(item.createdAt)}</span>
                    <button
                      type="button"
                      className="history-delete-btn"
                      onClick={(e) => handleDeleteHistory(item.id, e)}
                      title="删除"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      <style>{`
        .home-page {
          max-width: 860px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
          min-height: 100vh;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2.5rem;
          padding: 0 0.5rem;
        }

        .header-icon-small {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 12px var(--accent-shadow);
        }

        .header-title-wrap {
          flex: 1;
          min-width: 0;
        }

        .page-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-h);
          margin: 0 0 0.4rem;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          color: var(--text-soft);
          font-size: 0.95rem;
          margin: 0;
        }

        .help-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.9rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          border: 1.5px solid var(--border);
          background: var(--card-bg);
          color: var(--text-soft);
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .help-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--accent-bg);
        }

        .theme-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          cursor: pointer;
          border: 1.5px solid var(--border);
          background: var(--card-bg);
          color: var(--text-soft);
          transition: all 0.2s;
          flex-shrink: 0;
          padding: 0;
        }

        .theme-btn:hover {
          border-color: var(--accent);
          color: var(--warning);
          background: var(--accent-bg);
        }

        .tab-bar {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-bottom: 1.5rem;
          background: var(--tag-bg);
          border-radius: 12px;
          padding: 4px;
          width: fit-content;
          margin-left: auto;
          margin-right: auto;
        }

        .tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0.55rem 1.2rem;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          background: transparent;
          color: var(--text-soft);
          transition: all 0.2s;
          white-space: nowrap;
        }

        .tab-btn:hover {
          color: var(--text-h);
        }

        .tab-btn.tab-active {
          background: var(--card-bg);
          color: var(--accent);
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }

        .tab-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 9px;
          background: var(--accent);
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          line-height: 1;
        }

        .qr-generator {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .history-card {
          width: 100%;
        }

        .history-header {
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .history-title-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .history-count {
          font-size: 0.88rem;
          color: var(--text-soft);
          font-weight: 500;
        }

        .history-actions {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .search-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input {
          padding: 0.4rem 2rem 0.4rem 0.75rem;
          border: 1.5px solid var(--border);
          border-radius: 8px;
          background: var(--input-bg);
          color: var(--text-h);
          font-size: 0.82rem;
          width: 200px;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent-bg);
        }

        .search-input::placeholder {
          color: var(--text-soft);
        }

        .search-clear-btn {
          position: absolute;
          right: 6px;
          background: none;
          border: none;
          color: var(--text-soft);
          cursor: pointer;
          font-size: 1rem;
          padding: 2px 6px;
          border-radius: 4px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-clear-btn:hover {
          background: var(--tag-bg);
          color: var(--text-h);
        }

        .btn-clear-history {
          background: transparent;
          color: var(--error);
          border: 1px solid var(--error);
          font-size: 0.82rem;
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-clear-history:hover:not(:disabled) {
          background: var(--error);
          color: white;
        }

        .btn-clear-history:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          max-height: 300px;
          overflow-y: auto;
          margin-top: 0.5rem;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .history-list::-webkit-scrollbar {
          display: none;
        }

        .history-item {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          margin-bottom: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: background 0.15s;
        }

        .history-item:hover {
          background: var(--tag-bg);
        }

        .history-item-content {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 4px;
          overflow: hidden;
        }

        .history-content-preview {
          font-size: 0.88rem;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .history-tag {
          font-size: 0.7rem;
          padding: 1px 6px;
          border-radius: 4px;
          background: var(--tag-bg);
          color: var(--text-soft);
          margin-left: 6px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .history-whitebg-indicator {
          font-size: 0.8rem;
          color: var(--text-soft);
          margin-left: 2px;
          flex-shrink: 0;
        }

        .history-item-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .history-time {
          font-size: 0.78rem;
          color: var(--text-soft);
          white-space: nowrap;
          font-family: var(--mono);
        }

        .history-delete-btn {
          background: none;
          border: none;
          color: var(--text-soft);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 1rem;
          opacity: 0.5;
          transition: all 0.15s;
          line-height: 1;
        }

        .history-delete-btn:hover {
          opacity: 1;
          color: var(--error);
          background: var(--error-bg);
        }

        .history-empty {
          text-align: center;
          padding: 2rem 1rem;
          color: var(--text-soft);
          font-size: 0.88rem;
        }

        mark {
          background: rgba(251, 191, 36, 0.3);
          color: inherit;
          padding: 0 2px;
          border-radius: 2px;
        }

        .card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.5rem;
          backdrop-filter: blur(12px);
          transition: box-shadow 0.3s ease;
        }

        .card:hover {
          box-shadow: var(--card-shadow);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .card-title {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--text-h);
          margin: 0;
        }

        .char-counter {
          font-size: 0.8rem;
          font-family: var(--mono);
          font-weight: 500;
          transition: color 0.2s;
        }

        .capacity-bar {
          width: 100%;
          height: 4px;
          background: var(--border);
          border-radius: 2px;
          margin-bottom: 0.75rem;
          overflow: hidden;
        }

        .capacity-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--success), var(--accent));
          border-radius: 2px;
          transition: width 0.3s ease, background 0.3s ease;
        }

        .capacity-fill.fill-warn {
          background: linear-gradient(90deg, var(--warning), #f59e0b);
        }

        .capacity-fill.fill-over {
          background: var(--error);
        }

        .text-input {
          width: 100%;
          padding: 0.85rem 1rem;
          border: 1.5px solid var(--border);
          border-radius: 12px;
          background: var(--input-bg);
          color: var(--text-h);
          font-family: var(--sans);
          font-size: 0.95rem;
          line-height: 1.5;
          resize: vertical;
          min-height: 120px;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .text-input::placeholder {
          color: var(--text-soft);
          white-space: pre-line;
        }

        .text-input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-bg);
        }

        .text-input.input-error {
          border-color: var(--error);
          box-shadow: 0 0 0 3px var(--error-bg);
        }

        .options-section {
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .option-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .option-label {
          font-size: 0.85rem;
          color: var(--text-soft);
          font-weight: 500;
          white-space: nowrap;
        }

        .ec-selector {
          display: flex;
          gap: 4px;
          background: var(--tag-bg);
          border-radius: 8px;
          padding: 3px;
        }

        .ec-btn {
          padding: 0.35rem 0.7rem;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          background: transparent;
          color: var(--text-soft);
          transition: all 0.2s;
        }

        .ec-btn:hover {
          color: var(--text-h);
        }

        .ec-btn.ec-active {
          background: var(--card-bg);
          color: var(--accent);
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.88rem;
          color: var(--text);
          user-select: none;
        }

        .checkbox-label.checkbox-sm {
          font-size: 0.82rem;
          gap: 0.4rem;
        }

        .checkbox-label.checkbox-sm .checkbox-custom {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }

        .checkbox-label input[type="checkbox"] {
          display: none;
        }

        .checkbox-custom {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          border: 1.5px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
          position: relative;
        }

        .checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
          background: var(--accent);
          border-color: var(--accent);
        }

        .checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
          content: '';
          width: 5px;
          height: 9px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg) translate(-1px, -1px);
        }

        .button-group {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.25rem;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.7rem 1.4rem;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          white-space: nowrap;
        }

        .btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          color: white;
          flex: 1;
          box-shadow: 0 4px 12px var(--accent-shadow);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px var(--accent-shadow);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-ghost {
          background: var(--tag-bg);
          color: var(--text);
        }

        .btn-ghost:hover:not(:disabled) {
          background: var(--border);
        }

        .qr-display-area {
          min-height: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .qr-code-wrapper {
          padding: 1.25rem;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          color: #1a1a2e;
          margin-bottom: 1rem;
          transition: background 0.2s;
        }

        .qr-code-wrapper.qr-transparent {
          background:
            repeating-conic-gradient(var(--checker-dark) 0% 25%, var(--checker-light) 0% 50%) 0 0 / 16px 16px;
          color: var(--qr-fg);
          box-shadow: none;
          border: 1px solid var(--border);
        }

        .qr-code-container {
          display: flex;
          justify-content: center;
        }

        .qr-code-container svg {
          display: block;
        }

        .action-buttons {
          display: flex;
          gap: 0.6rem;
          margin-bottom: 0.75rem;
        }

        .btn-action {
          padding: 0.55rem 1.1rem;
          font-size: 0.82rem;
          background: var(--tag-bg);
          color: var(--text);
          border-radius: 8px;
        }

        .btn-action:hover:not(:disabled) {
          background: var(--border);
        }

        .btn-action-primary {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .btn-action-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669, #047857);
        }

        .qr-content-text {
          font-size: 0.78rem;
          color: var(--text-soft);
          word-break: break-all;
          margin: 0;
          padding: 0.6rem 0.8rem;
          background: var(--tag-bg);
          border-radius: 8px;
          max-width: 100%;
          line-height: 1.5;
        }

        .placeholder {
          text-align: center;
          color: var(--text-soft);
          padding: 2rem 1rem;
        }

        .placeholder-icon {
          color: var(--border);
          margin-bottom: 1rem;
        }

        .placeholder p {
          margin: 0.3rem 0;
          font-size: 0.9rem;
        }

        .placeholder-hint {
          font-size: 0.8rem !important;
          opacity: 0.6;
        }

        .qr-error {
          text-align: center;
          padding: 2rem;
          color: var(--error);
        }

        .error-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .qr-error p {
          margin: 0.3rem 0;
        }

        .error-detail {
          font-size: 0.85rem;
          opacity: 0.7;
        }

        .toast-container {
          position: fixed;
          top: 1.5rem;
          right: 1.5rem;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .toast {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.75rem 1.1rem;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 500;
          color: white;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          animation: toastIn 0.3s ease;
          backdrop-filter: blur(8px);
        }

        .toast-success { background: linear-gradient(135deg, #10b981, #059669); }
        .toast-error { background: linear-gradient(135deg, #ef4444, #dc2626); }
        .toast-info { background: linear-gradient(135deg, #3b82f6, #2563eb); }

        .toast-icon {
          font-size: 1rem;
          font-weight: 700;
        }

        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* 帮助模态框 */
        .help-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.2s ease;
        }

        .help-modal {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          max-width: 720px;
          width: 100%;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }

        .help-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .help-modal-title {
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--text-h);
          margin: 0;
        }

        .help-modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: var(--text-soft);
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          line-height: 1;
          transition: all 0.2s;
        }

        .help-modal-close:hover {
          background: var(--tag-bg);
          color: var(--text-h);
        }

        .help-modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          scrollbar-width: thin;
        }

        .help-section {
          margin-bottom: 1.5rem;
        }

        .help-section:last-child {
          margin-bottom: 0;
        }

        .help-section-title {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--text-h);
          margin: 0 0 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid var(--accent);
        }

        .help-subtitle {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text);
          margin: 1rem 0 0.5rem;
        }

        .help-text {
          font-size: 0.88rem;
          color: var(--text);
          line-height: 1.6;
          margin: 0;
        }

        .help-note {
          margin-top: 0.75rem;
          padding: 0.75rem;
          background: var(--accent-bg);
          border-radius: 8px;
          border-left: 3px solid var(--accent);
        }

        .help-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .help-list-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.6rem 0;
          border-bottom: 1px solid var(--border);
          font-size: 0.88rem;
        }

        .help-list-item:last-child {
          border-bottom: none;
        }

        .help-step {
          font-weight: 600;
          color: var(--accent);
          flex-shrink: 0;
          min-width: 140px;
        }

        .help-action {
          font-weight: 600;
          color: var(--text-h);
          flex-shrink: 0;
          min-width: 140px;
        }

        .help-desc {
          color: var(--text-soft);
          line-height: 1.5;
        }

        .help-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.75rem 0;
          font-size: 0.82rem;
        }

        .help-table-sm {
          font-size: 0.8rem;
        }

        .help-table th {
          background: var(--tag-bg);
          color: var(--text-h);
          font-weight: 600;
          padding: 0.6rem 0.75rem;
          text-align: left;
          border: 1px solid var(--border);
        }

        .help-table td {
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border);
          color: var(--text);
        }

        .help-table tbody tr:nth-child(even) {
          background: var(--input-bg);
        }

        .help-faq {
          margin: 0.75rem 0;
          padding: 0.75rem;
          background: var(--tag-bg);
          border-radius: 8px;
        }

        .help-faq-question {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-h);
          margin: 0 0 0.4rem;
        }

        .help-faq-answer {
          font-size: 0.85rem;
          color: var(--text-soft);
          margin: 0;
          line-height: 1.6;
        }

        kbd {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 0.15rem 0.4rem;
          font-size: 0.78rem;
          font-family: var(--mono);
          color: var(--text-h);
          box-shadow: 0 1px 0 var(--border);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .home-page {
            padding: 1.5rem 1rem;
          }

          .qr-generator {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .card {
            padding: 1.25rem;
          }

          .button-group {
            flex-direction: column;
          }

          .action-buttons {
            flex-direction: column;
            width: 100%;
          }

          .btn-action {
            width: 100%;
          }

          .page-title {
            font-size: 1.6rem;
          }

          .qr-code-wrapper {
            padding: 1rem;
          }

          .history-actions {
            width: 100%;
            flex-wrap: wrap;
          }

          .search-input-wrap {
            flex: 1;
            min-width: 150px;
          }

          .search-input {
            width: 100%;
          }

          .history-item {
            gap: 0.5rem;
            padding: 0.6rem 0.75rem;
          }

          .page-header {
            gap: 0.75rem;
          }

          .help-btn span {
            display: none;
          }

          .help-modal {
            max-width: 100%;
            max-height: 90vh;
          }

          .help-modal-body {
            padding: 1rem;
          }

          .help-list-item {
            flex-direction: column;
            gap: 0.3rem;
          }

          .help-step,
          .help-action {
            min-width: unset;
          }

          .help-table {
            font-size: 0.75rem;
          }

          .help-table th,
          .help-table td {
            padding: 0.4rem 0.5rem;
          }
        }
      `}</style>
    </div>
  )
}
