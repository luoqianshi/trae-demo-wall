// 底部输入框组件
import { useState, useRef, useEffect } from 'react'

export default function InputBar({
  placeholder = '写下你的困惑…',
  buttonText = '提问',
  onSubmit,
  disabled = false,
  autoFocus = false,
}) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = (e) => {
    e?.preventDefault()
    const text = value.trim()
    if (!text || disabled) return
    onSubmit(text)
    setValue('')
    // 重置 textarea 高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleInput = (e) => {
    setValue(e.target.value)
    // 自动调整高度
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 bg-ink-card rounded-2xl border border-ink-border p-2 shadow-ink"
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none bg-transparent outline-none text-[15px] text-ink-dark placeholder:text-ink-muted/60 px-2 py-2 max-h-[120px] thin-scroll"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="seal px-4 py-2 text-sm flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        {buttonText}
      </button>
    </form>
  )
}
