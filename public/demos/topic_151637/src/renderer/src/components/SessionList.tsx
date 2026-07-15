import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import type { Session } from '../store/appStore'
import ConfirmDialog from './ConfirmDialog'

/** 将 ISO 时间字符串格式化为中文相对时间，例如 "刚刚"、"5分钟前"、"2小时前" */
function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  // 时间戳异常（未来时间）时按"刚刚"处理
  if (diffMs < 0) return '刚刚'

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  if (months < 12) return `${months}个月前`
  return `${years}年前`
}

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

interface SessionListProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

export default function SessionList({ collapsed, onToggleCollapse }: SessionListProps) {
  const sessions = useAppStore((s) => s.sessions)
  const currentSessionId = useAppStore((s) => s.currentSessionId)
  const createSession = useAppStore((s) => s.createSession)
  const switchSession = useAppStore((s) => s.switchSession)
  const deleteSession = useAppStore((s) => s.deleteSession)

  // 待删除的会话（null = 弹窗关闭）
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null)

  const handleDelete = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation()
    e.preventDefault()
    setPendingDelete({ id, title: title?.trim() || '新对话' })
  }

  const confirmDelete = () => {
    if (pendingDelete) {
      deleteSession(pendingDelete.id)
    }
    setPendingDelete(null)
  }

  return (
    <div className="session-list">
      <div className="session-list-header">
        <span className="panel-icon">
          <ChatIcon />
          会话
        </span>
        <div className="session-list-header-actions">
          <button className="session-new-btn" onClick={() => createSession()} title="新建会话">
            <PlusIcon />
            新建
          </button>
          <button
            className="session-toggle-btn"
            onClick={onToggleCollapse}
            title="折叠会话列"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="session-empty">
          <div className="session-empty-text">暂无会话</div>
          <div className="session-empty-hint">点击"新建"开始一次数据分析</div>
        </div>
      ) : (
        <div className="session-items">
          {sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              active={session.id === currentSessionId}
              onSelect={() => switchSession(session.id)}
              onDelete={(e) => handleDelete(e, session.id, session.title)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除会话"
        message={`确定删除会话「${pendingDelete?.title || ''}」？此操作无法撤销，相关 Python 沙箱进程也会被清理。`}
        confirmText="删除"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

interface SessionItemProps {
  session: Session
  active: boolean
  onSelect: () => void
  onDelete: (e: React.MouseEvent) => void
}

function SessionItem({ session, active, onSelect, onDelete }: SessionItemProps) {
  const title = session.title?.trim() || '新对话'

  return (
    <div
      className={`session-item${active ? ' active' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <div className="session-item-info">
        <div className="session-item-title">{title}</div>
        <div className="session-item-time">{formatRelativeTime(session.updatedAt)}</div>
      </div>
      <button
        className="session-item-delete"
        onClick={onDelete}
        title="删除会话"
        aria-label="删除会话"
      >
        <TrashIcon />
      </button>
    </div>
  )
}
