import { useState } from 'react'
import { Check, X, Loader2, PenLine, Trash2, Bell, UserPlus, Edit3, Link2 } from 'lucide-react'
import type { ConversationIntent } from '../lib/conversationIntent'
import { executeIntent } from '../lib/conversationIntent'

interface IntentConfirmCardProps {
  intent: ConversationIntent
  onResolved: (result: { success: boolean; message: string }) => void
}

function getIntentIcon(type: ConversationIntent['type']) {
  switch (type) {
    case 'add_memory': return <PenLine className="w-4 h-4" />
    case 'modify_memory': return <Edit3 className="w-4 h-4" />
    case 'delete_memory': return <Trash2 className="w-4 h-4" />
    case 'add_reminder': return <Bell className="w-4 h-4" />
    case 'add_person': return <UserPlus className="w-4 h-4" />
    case 'add_person_relation': return <Link2 className="w-4 h-4" />
    case 'modify_person': return <Edit3 className="w-4 h-4" />
    default: return <PenLine className="w-4 h-4" />
  }
}

function getIntentColor(type: ConversationIntent['type']) {
  switch (type) {
    case 'add_memory': return { bg: 'bg-zen-sage/10', text: 'text-zen-sage', border: 'border-zen-sage/30' }
    case 'modify_memory': return { bg: 'bg-zen-amber/10', text: 'text-zen-amber', border: 'border-zen-amber/30' }
    case 'delete_memory': return { bg: 'bg-zen-rose/10', text: 'text-zen-rose', border: 'border-zen-rose/30' }
    case 'add_reminder': return { bg: 'bg-zen-terracotta/10', text: 'text-zen-terracotta', border: 'border-zen-terracotta/30' }
    case 'add_person': return { bg: 'bg-zen-indigo/10', text: 'text-zen-indigo', border: 'border-zen-indigo/30' }
    case 'add_person_relation': return { bg: 'bg-zen-indigo/10', text: 'text-zen-indigo', border: 'border-zen-indigo/30' }
    default: return { bg: 'bg-ink-muted/10', text: 'text-ink-secondary', border: 'border-ink-muted/30' }
  }
}

function getIntentLabel(type: ConversationIntent['type']) {
  switch (type) {
    case 'add_memory': return '记录信息'
    case 'modify_memory': return '修改记忆'
    case 'delete_memory': return '删除记忆'
    case 'add_reminder': return '设置提醒'
    case 'add_person': return '新增人物'
    case 'add_person_relation': return '人物关系'
    case 'modify_person': return '更新人物'
    default: return '操作'
  }
}

export function IntentConfirmCard({ intent, onResolved }: IntentConfirmCardProps) {
  const [status, setStatus] = useState<'pending' | 'executing' | 'done' | 'cancelled'>('pending')
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const colors = getIntentColor(intent.type)

  const handleConfirm = async () => {
    setStatus('executing')
    const res = await executeIntent(intent)
    setResult(res)
    setStatus('done')
    setTimeout(() => onResolved(res), 1500)
  }

  const handleCancel = () => {
    setStatus('cancelled')
    setTimeout(() => onResolved({ success: false, message: '已取消' }), 800)
  }

  if (status === 'done' && result) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${result.success ? 'bg-zen-sage/8 border-zen-sage/25' : 'bg-zen-rose/8 border-zen-rose/25'}`}>
        {result.success ? (
          <Check className="w-4 h-4 text-zen-sage" />
        ) : (
          <X className="w-4 h-4 text-zen-rose" />
        )}
        <span className={`text-xs ${result.success ? 'text-zen-sage' : 'text-zen-rose'}`}>
          {result.message}
        </span>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-ink-muted/20 bg-ink-muted/5">
        <X className="w-4 h-4 text-ink-muted" />
        <span className="text-xs text-ink-muted">已取消</span>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-3 max-w-md`}>
      {/* 头部 */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors.bg} ${colors.text}`}>
          {getIntentIcon(intent.type)}
        </div>
        <span className={`text-xs font-medium ${colors.text}`}>
          {getIntentLabel(intent.type)}
        </span>
        {status === 'executing' && (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-ink-muted ml-auto" />
        )}
      </div>

      {/* 操作描述 */}
      <p className="text-sm text-ink-primary leading-relaxed mb-3">
        {intent.description}
      </p>

      {/* 确认按钮 */}
      {status === 'pending' && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleConfirm}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border} hover:opacity-80 transition-opacity`}
          >
            <Check className="w-3.5 h-3.5 inline mr-1" />
            确认
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-ink-tertiary hover:bg-ink-muted/10 transition-colors"
          >
            取消
          </button>
        </div>
      )}
    </div>
  )
}
