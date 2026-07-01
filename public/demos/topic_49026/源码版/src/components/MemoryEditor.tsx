import { useState, useEffect } from 'react'
import { BackHeader } from './BackHeader'
import { useDataStore } from '../stores/useDataStore'
import type { Memory } from '../types'

interface MemoryEditorProps {
  memory?: Memory
  onClose: () => void
}

const typeOptions: { value: Memory['type']; label: string }[] = [
  { value: 'preference', label: '偏好' },
  { value: 'commitment', label: '承诺' },
  { value: 'event', label: '事件' },
  { value: 'insight', label: '洞察' },
  { value: 'emotion', label: '情绪' },
]

export function MemoryEditor({ memory, onClose }: MemoryEditorProps) {
  const addMemory = useDataStore((s) => s.addMemory)

  const [type, setType] = useState<Memory['type']>(memory?.type || 'event')
  const [content, setContent] = useState(memory?.content || '')
  const [confidence, setConfidence] = useState<Memory['confidence']>(memory?.confidence || 'high')
  const [confirmed, setConfirmed] = useState(memory?.confirmed ?? true)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSave = async () => {
    if (!content.trim()) return

    await addMemory({
      type,
      content: content.trim(),
      source: 'manual',
      confidence,
      confirmed,
      tags: [],
      relatedMemoryIds: [],
      relatedPersonIds: [],
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-primary/30 backdrop-blur-sm"
        role="button"
        tabIndex={0}
        aria-label="关闭"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
            e.preventDefault()
            onClose()
          }
        }}
      />
      <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <BackHeader
          title={memory ? '编辑记忆' : '添加记忆'}
          onBack={onClose}
        />

        <div className="p-6 space-y-5">
          {/* 类型 */}
          <div>
            <label className="text-xs font-medium text-ink-tertiary uppercase tracking-wider">记忆类型</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    type === opt.value
                      ? 'bg-zen-terracotta text-white'
                      : 'bg-canvas text-ink-secondary hover:bg-canvas-warm'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 内容 */}
          <div>
            <label className="text-xs font-medium text-ink-tertiary uppercase tracking-wider">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="描述这条记忆..."
              rows={4}
              className="w-full mt-1.5 px-3 py-2.5 rounded-lg bg-canvas border border-ink-muted/20 text-sm text-ink-primary outline-none focus:border-zen-terracotta/50 resize-none"
            />
          </div>

          {/* 置信度 */}
          <div>
            <label className="text-xs font-medium text-ink-tertiary uppercase tracking-wider">置信度</label>
            <div className="flex gap-2 mt-2">
              {(['high', 'medium', 'low'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setConfidence(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    confidence === c
                      ? 'bg-zen-terracotta text-white'
                      : 'bg-canvas text-ink-secondary hover:bg-canvas-warm'
                  }`}
                >
                  {c === 'high' ? '高' : c === 'medium' ? '中' : '低'}
                </button>
              ))}
            </div>
          </div>

          {/* 确认状态 */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="confirmed"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 accent-zen-terracotta"
            />
            <label htmlFor="confirmed" className="text-sm text-ink-secondary">已确认（直接生效）</label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-ink-muted/20">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-secondary hover:bg-canvas-warm transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-zen-terracotta text-white hover:bg-zen-terracotta/90 transition-colors disabled:opacity-40"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
