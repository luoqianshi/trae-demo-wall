import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { CHART_STYLE_PRESETS } from '../../../agents/shared/styleGuide'

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

const StopIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
)

const QueueIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 17 20 12 15 7" />
    <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const PaletteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 0 0 0 20" />
    <path d="M12 2a10 10 0 0 1 0 20" />
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
    <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
  </svg>
)

interface ChatPanelProps {
  embedded?: boolean
}

export default function ChatPanel({ embedded = false }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  const [showTokenTooltip, setShowTokenTooltip] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const modelMenuRef = useRef<HTMLDivElement>(null)
  const styleMenuRef = useRef<HTMLDivElement>(null)

  const {
    settings,
    setActiveApiConfig,
    setActiveStyle,
    runAgent,
    cancelAgent,
    enqueueGoal,
    agentRunning,
    pendingGoal,
    tokenUsage,
    selectedDataset,
    currentSessionId
  } = useAppStore()

  const sessionId = currentSessionId || ''
  const activeApiConfig = settings.apiConfigs.find((c) => c.id === settings.activeApiConfigId)
  const customStyles = settings.customStyles || []
  const activeStyle =
    CHART_STYLE_PRESETS.find((s) => s.id === settings.activeStyleId) ||
    customStyles.find((s) => s.id === settings.activeStyleId) ||
    CHART_STYLE_PRESETS[1]

  const allStyles = [
    ...CHART_STYLE_PRESETS,
    ...customStyles.map((cs) => ({ id: cs.id, name: cs.name, description: '自定义风格' })),
  ]

  const hasInput = input.trim().length > 0

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setShowModelMenu(false)
      }
      if (styleMenuRef.current && !styleMenuRef.current.contains(e.target as Node)) {
        setShowStyleMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Agent 完成时自动聚焦（让用户继续输入）
  useEffect(() => {
    if (!agentRunning) {
      inputRef.current?.focus()
    }
  }, [agentRunning])

  const handleSend = () => {
    const goal = input.trim()
    if (!goal) return

    if (agentRunning) {
      // 运行中：排队等待当前任务完成
      enqueueGoal(goal)
      setInput('')
    } else {
      setInput('')
      runAgent(goal)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 按钮状态：
  // - agentRunning + 无输入 → 中止按钮（红色）
  // - agentRunning + 有输入 → 排队发送按钮（蓝色）
  // - 不运行 → 普通发送按钮
  const btnOnClick = agentRunning
    ? (hasInput ? handleSend : cancelAgent)
    : handleSend
  const btnDisabled = agentRunning ? !hasInput && false : !hasInput
  const btnTitle = agentRunning
    ? (hasInput ? '排队发送（当前任务完成后自动执行）' : '停止 Agent')
    : '发送 (Enter)'
  const btnIcon = agentRunning
    ? (hasInput ? <QueueIcon /> : <StopIcon />)
    : <SendIcon />
  const btnClass = agentRunning
    ? (hasInput ? 'chat-send-btn queueing' : 'chat-send-btn running')
    : 'chat-send-btn'

  // Token 用量计算
  const usagePct = tokenUsage ? Math.min((tokenUsage.estimated / tokenUsage.max) * 100, 100) : 0
  const usageColor = usagePct > 80 ? 'var(--color-danger)' : usagePct > 50 ? 'var(--color-warning, #f59e0b)' : 'var(--color-accent)'
  const formatTokens = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`

  return (
    <div className={`chat-panel ${embedded ? 'embedded' : ''}`}>
      <div className="chat-input-area">
        {/* 排队提示 */}
        {pendingGoal && (
          <div className="chat-pending-banner">
            <span className="chat-pending-dot" />
            排队中："{pendingGoal.slice(0, 40)}{pendingGoal.length > 40 ? '…' : ''}"
          </div>
        )}

        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder={agentRunning
            ? '可以继续输入，将在当前任务完成后自动执行…'
            : '请输入分析目标，例如：分析深圳各区二手房均价...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
        />
        <div className="chat-input-actions">
          <div className="chat-input-selectors">
            {/* 风格选择器 */}
            <div className="style-selector" ref={styleMenuRef}>
              <button
                className="model-selector-btn"
                onClick={() => { setShowModelMenu(false); setShowStyleMenu(!showStyleMenu) }}
                title="选择图表风格"
              >
                <PaletteIcon />
                <span className="model-selector-label">{activeStyle.name}</span>
                <ChevronDownIcon />
              </button>
              {showStyleMenu && (
                <div className="model-selector-menu">
                  <div className="model-selector-menu-title">图表风格</div>
                  {allStyles.map((style) => (
                    <button
                      key={style.id}
                      className={`model-selector-item ${settings.activeStyleId === style.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveStyle(style.id)
                        setShowStyleMenu(false)
                      }}
                    >
                      <span className="model-selector-item-name">{style.name}</span>
                      <span className="model-selector-item-desc">{style.description}</span>
                    </button>
                  ))}
                  <div className="model-selector-menu-footer">
                    <span className="model-selector-menu-hint">更多风格可在设置中自定义</span>
                  </div>
                </div>
              )}
            </div>

            {/* 模型选择器 */}
            <div className="model-selector" ref={modelMenuRef}>
              <button
                className="model-selector-btn"
                onClick={() => { setShowStyleMenu(false); setShowModelMenu(!showModelMenu) }}
                title="选择模型"
              >
                <span className="model-selector-label">{activeApiConfig?.name || '未配置'}</span>
                <ChevronDownIcon />
              </button>
              {showModelMenu && (
                <div className="model-selector-menu">
                  <div className="model-selector-menu-title">选择模型</div>
                  {settings.apiConfigs.length === 0 ? (
                    <div className="model-selector-menu-empty">
                      <span>暂无模型配置</span>
                      <span className="model-selector-menu-hint">请在设置中添加 API 配置</span>
                    </div>
                  ) : (
                    settings.apiConfigs.map((config) => (
                      <button
                        key={config.id}
                        className={`model-selector-item ${settings.activeApiConfigId === config.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveApiConfig(config.id)
                          setShowModelMenu(false)
                        }}
                      >
                        <span className="model-selector-item-name">{config.name}</span>
                        <span className="model-selector-item-desc">{config.model}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 上下文窗口进度指示器 */}
            {tokenUsage && (
              <div
                className="token-usage-indicator"
                onMouseEnter={() => setShowTokenTooltip(true)}
                onMouseLeave={() => setShowTokenTooltip(false)}
              >
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <circle
                    cx="10" cy="10" r="8"
                    fill="none"
                    stroke="var(--color-rule)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="10" cy="10" r="8"
                    fill="none"
                    stroke={usageColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={`${usagePct * 0.5026} 50.26`}
                    transform="rotate(-90 10 10)"
                    style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.5s ease' }}
                  />
                </svg>
                {showTokenTooltip && (
                  <div className="token-tooltip">
                    <div className="token-tooltip-title">上下文窗口用量</div>
                    <div className="token-tooltip-row">
                      <span>已用</span>
                      <span>{formatTokens(tokenUsage.estimated)} tokens</span>
                    </div>
                    <div className="token-tooltip-row">
                      <span>上限</span>
                      <span>{formatTokens(tokenUsage.max)} tokens</span>
                    </div>
                    <div className="token-tooltip-row">
                      <span>使用率</span>
                      <span style={{ color: usageColor }}>{usagePct.toFixed(1)}%</span>
                    </div>
                    <div className="token-tooltip-divider" />
                    <div className="token-tooltip-hint">
                      仅估算，非 API 精确计数
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            className={btnClass}
            onClick={btnOnClick}
            disabled={btnDisabled}
            title={btnTitle}
          >
            {btnIcon}
          </button>
        </div>
      </div>
    </div>
  )
}