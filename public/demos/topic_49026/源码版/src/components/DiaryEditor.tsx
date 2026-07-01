import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { BackHeader } from './BackHeader'
import { useDataStore } from '../stores/useDataStore'
import type { DiaryEntry } from '../types'

interface DiaryEditorProps {
  entry?: DiaryEntry
  onClose: () => void
}

export function DiaryEditor({ entry, onClose }: DiaryEditorProps) {
  const addDiary = useDataStore((s) => s.addDiary)

  const [content, setContent] = useState(entry?.content || '')
  const [emotions, setEmotions] = useState<string[]>(entry?.emotions || [])
  const [newEmotion, setNewEmotion] = useState('')
  const [tags, setTags] = useState<string[]>(entry?.tags || [])
  const [newTag, setNewTag] = useState('')

  const handleSave = async () => {
    if (!content.trim()) return

    await addDiary({
      content: content.trim(),
      type: 'text',
      emotions,
      tags,
    })

    onClose()
  }

  const addItem = (list: string[], setList: (v: string[]) => void, value: string, setValue: (v: string) => void) => {
    if (!value.trim()) return
    setList([...list, value.trim()])
    setValue('')
  }

  const removeItem = (list: string[], setList: (v: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index))
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

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
      <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10">
          <BackHeader
            title={entry ? '编辑日记' : '写日记'}
            onBack={onClose}
          />
        </div>

        <div className="p-6 space-y-5">
          {/* 内容 */}
          <div>
            <label className="text-xs font-medium text-ink-tertiary uppercase tracking-wider">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="记录今天发生的事、想法和感受..."
              rows={6}
              className="w-full mt-1.5 px-3 py-2.5 rounded-lg bg-canvas border border-ink-muted/20 text-sm text-ink-primary outline-none focus:border-zen-terracotta/50 resize-none"
            />
          </div>

          {/* 情绪标签 */}
          <div>
            <label className="text-xs font-medium text-ink-tertiary uppercase tracking-wider">情绪</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {emotions.map((emo, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zen-rose/10 text-xs text-zen-rose"
                >
                  {emo}
                  <button onClick={() => removeItem(emotions, setEmotions, i)} className="hover:text-zen-rose/70">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input
                  value={newEmotion}
                  onChange={(e) => setNewEmotion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(emotions, setEmotions, newEmotion, setNewEmotion))}
                  placeholder="添加情绪..."
                  className="w-24 px-2 py-1 rounded-md bg-canvas border border-ink-muted/20 text-xs text-ink-primary outline-none focus:border-zen-terracotta/50"
                />
                <button
                  onClick={() => addItem(emotions, setEmotions, newEmotion, setNewEmotion)}
                  className="w-6 h-6 rounded-md flex items-center justify-center bg-canvas text-ink-tertiary hover:text-zen-terracotta"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 分类标签 */}
          <div>
            <label className="text-xs font-medium text-ink-tertiary uppercase tracking-wider">标签</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-canvas text-xs text-ink-secondary"
                >
                  {tag}
                  <button onClick={() => removeItem(tags, setTags, i)} className="hover:text-zen-rose">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(tags, setTags, newTag, setNewTag))}
                  placeholder="添加标签..."
                  className="w-24 px-2 py-1 rounded-md bg-canvas border border-ink-muted/20 text-xs text-ink-primary outline-none focus:border-zen-terracotta/50"
                />
                <button
                  onClick={() => addItem(tags, setTags, newTag, setNewTag)}
                  className="w-6 h-6 rounded-md flex items-center justify-center bg-canvas text-ink-tertiary hover:text-zen-terracotta"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-ink-muted/20 sticky bottom-0 bg-surface">
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
