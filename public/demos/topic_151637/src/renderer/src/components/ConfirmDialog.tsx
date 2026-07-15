import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * 通用确认弹窗 — 替代 window.confirm。
 *
 * 为什么不用 window.confirm：
 *   Electron 的 BrowserWindow 默认禁用 native dialog（出于安全/UX 考虑），
 *   window.confirm 会同步阻塞且不显示任何 UI，相当于永远返回 false。
 *   改用 React 控制的自定义弹层，可靠地拿到用户意图。
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  danger = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  // 打开时自动 focus 在确认按钮上 + 绑定 ESC/Enter
  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      else if (e.key === 'Enter') onConfirm()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onCancel, onConfirm])

  if (!open) return null

  return (
    <div
      className="confirm-dialog-backdrop"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-dialog-header">
          <h3 id="confirm-dialog-title">{title}</h3>
        </div>
        <div className="confirm-dialog-body">{message}</div>
        <div className="confirm-dialog-footer">
          <button
            type="button"
            className="confirm-dialog-btn secondary"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`confirm-dialog-btn primary ${danger ? 'danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
