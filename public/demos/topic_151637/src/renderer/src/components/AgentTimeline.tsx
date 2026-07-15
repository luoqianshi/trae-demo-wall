import { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import type { AgentStep } from '../../../types/shared'

const AGENT_LABELS: Record<string, string> = {
  user: '你',
  coding: 'Agent',
  orchestrator: '调度',
  deep_research: '研究',
  analysis: '分析',
  plot: '可视化',
  report: '报告'
}

const TimelineIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6v6l4 2" />
    <circle cx="12" cy="12" r="9" />
  </svg>
)

const CodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
  </svg>
)

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const BrainIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M4 9a3 3 0 0 1 3-3h1a3 3 0 0 1 0 6H7a3 3 0 0 1-3-3z" />
    <path d="M20 9a3 3 0 0 0-3-3h-1a3 3 0 0 0 0 6h1a3 3 0 0 0 3-3z" />
    <path d="M12 14a4 4 0 0 0-4 4v1h8v-1a4 4 0 0 0-4-4z" />
  </svg>
)

interface AgentTimelineProps {
  embedded?: boolean
}

export default function AgentTimeline({ embedded = false }: AgentTimelineProps) {
  const agentSteps = useAppStore((s) => s.agentSteps)
  const agentRunning = useAppStore((s) => s.agentRunning)
  const runningSessionId = useAppStore((s) => s.runningSessionId)
  const currentSessionId = useAppStore((s) => s.currentSessionId)

  // 仅当当前会话是运行中会话时，显示运行状态
  const isCurrentRunning = agentRunning && currentSessionId === runningSessionId

  // 判断是否有正在进行的 thinking 步骤（流式中）
  const hasActiveThinking = agentSteps.length > 0 &&
    agentSteps[agentSteps.length - 1].action === 'thinking' &&
    isCurrentRunning

  return (
    <div className="agent-timeline">
      <div className="timeline-section-header">
        <span className="section-label">
          <TimelineIcon />
          执行轨迹
        </span>
        {isCurrentRunning && <span className="running-indicator">运行中</span>}
      </div>
      {(agentSteps || []).length === 0 && !isCurrentRunning && (
        <div className="panel-placeholder">输入分析目标后，Agent 的执行步骤将在此展示</div>
      )}
      {isCurrentRunning && (agentSteps || []).length === 0 && (
        <div className="timeline-item loading">
          <div className="timeline-dot" />
          <div className="timeline-content">
            <span className="timeline-agent">思考中</span>
            <span className="timeline-reasoning">正在分析...</span>
          </div>
        </div>
      )}
      <div className="timeline-list">
        {(agentSteps || []).map((step, i) => (
          <TimelineItem
            key={`${i}-${step.action}`}
            step={step}
            isLast={i === agentSteps.length - 1}
            isActiveThinking={i === agentSteps.length - 1 && step.action === 'thinking' && isCurrentRunning}
          />
        ))}
        {isCurrentRunning && !hasActiveThinking && (
          <div className="timeline-item loading">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <span className="timeline-agent">思考中</span>
              <span className="timeline-reasoning">正在分析...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TimelineItem({
  step,
  isLast,
  isActiveThinking,
}: {
  step: AgentStep
  isLast: boolean
  isActiveThinking: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const label = AGENT_LABELS[step.agent] || step.agent
  const isUserMessage = step.agent === 'user'
  const isThinking = step.action === 'thinking'
  const isThinkingComplete = step.action === 'thinking_complete'
  const isFinalAnswer = step.action === 'final_answer'

  // 流式思考时自动展开；完成后自动折叠
  useEffect(() => {
    if (isActiveThinking && isThinking) {
      setExpanded(true)
    } else if (isThinkingComplete && isLast) {
      setExpanded(false)
    }
  }, [isActiveThinking, isThinking, isThinkingComplete, isLast])

  if (isUserMessage) {
    return (
      <div className="timeline-item user-message">
        <div className="user-avatar" aria-hidden>U</div>
        <div className="timeline-content user-content">
          <div className="user-bubble">{step.reasoning}</div>
          <span className="timeline-time user-time">{formatTime(step.timestamp)}</span>
        </div>
      </div>
    )
  }

  // 思考步骤：特殊渲染
  if (isThinking || isThinkingComplete) {
    const isActive = isThinking && isActiveThinking
    return (
      <div className={`timeline-item thinking-item ${isActive ? 'active' : ''} ${expanded ? 'expanded' : 'collapsed'}`}>
        <div className={`timeline-dot thinking ${isActive ? 'pulsing' : ''}`} />
        <div className="timeline-content">
          <div className="timeline-header">
            <span className="timeline-agent thinking-agent">
              <BrainIcon />
              思考
            </span>
            <span className="timeline-time">{formatTime(step.timestamp)}</span>
          </div>
          {/* 折叠时显示摘要 */}
          {!expanded && (
            <div
              className="thinking-summary"
              onClick={() => setExpanded(true)}
              title="点击展开思考过程"
            >
              <ChevronRight />
              <span>{truncateText(step.reasoning, 100) || '思考完成'}</span>
              <span className="thinking-expand-hint">点击展开</span>
            </div>
          )}
          {/* 展开时显示完整内容 */}
          {expanded && (
            <div className="thinking-body">
              <div
                className="thinking-toggle"
                onClick={() => setExpanded(false)}
              >
                <ChevronDown />
                <span>收起思考</span>
              </div>
              <div className="thinking-text">
                {step.reasoning || '(空)'}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 最终答案：简洁展示，可点击展开
  if (isFinalAnswer) {
    return (
      <div className={`timeline-item final-answer-item ${expanded ? 'expanded' : 'collapsed'}`}>
        <div className="timeline-dot final-answer" />
        <div className="timeline-content">
          <div className="timeline-header">
            <span className="timeline-agent final-answer-agent">最终答案</span>
            <span className="timeline-time">{formatTime(step.timestamp)}</span>
          </div>
          {!expanded ? (
            <div
              className="thinking-summary"
              onClick={() => setExpanded(true)}
              title="点击展开最终答案"
            >
              <ChevronRight />
              <span>{truncateText(step.reasoning, 120) || '答案已生成'}</span>
              <span className="thinking-expand-hint">点击展开</span>
            </div>
          ) : (
            <div className="thinking-body">
              <div className="thinking-toggle" onClick={() => setExpanded(false)}>
                <ChevronDown />
                <span>收起答案</span>
              </div>
              <div className="final-answer-text">
                {step.reasoning || '(空)'}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`timeline-item ${step.error ? 'error' : ''}`}>
      <div className={`timeline-dot ${step.error ? 'error' : ''}`} />
      <div className="timeline-content">
        <div className="timeline-header">
          <span className="timeline-agent" data-agent={step.agent}>{label}</span>
          <span className="timeline-action">{step.action}</span>
          <span className="timeline-time">{formatTime(step.timestamp)}</span>
        </div>
        <div className="timeline-reasoning">{step.reasoning}</div>
        {step.code && (
          <button
            className="code-toggle"
            onClick={() => setExpanded(!expanded)}
          >
            <CodeIcon />
            {expanded ? '收起代码' : '查看代码'}
          </button>
        )}
        {expanded && step.code && (
          <pre className="timeline-code">
            <code>{step.code}</code>
          </pre>
        )}
        {step.error && <div className="timeline-error">{step.error}</div>}
      </div>
    </div>
  )
}

function truncateText(text: string, maxLen: number): string {
  if (!text) return ''
  const lines = text.split('\n')
  if (lines.length > 1) {
    return lines[0].slice(0, maxLen) + '...'
  }
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

function formatTime(ts: string): string {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}