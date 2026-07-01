import { Plus, MessageSquare, X } from 'lucide-react'
import { useConversationStore } from '../stores/useConversationStore'
import { useUIStore } from '../stores/useUIStore'

interface ChatDrawerProps {
  open: boolean
  onClose: () => void
}

export function ChatDrawer({ open, onClose }: ChatDrawerProps) {
  const conversations = useConversationStore((s) => s.conversations)
  const activeConversationId = useConversationStore((s) => s.activeConversationId)
  const switchConversation = useConversationStore((s) => s.switchConversation)
  const createConversation = useConversationStore((s) => s.createConversation)
  const setLastRetrievalInfo = useUIStore((s) => s.setLastRetrievalInfo)

  const handleNew = () => {
    createConversation()
    setLastRetrievalInfo(null) // 清除旧对话的检索信息，避免关系面板残留
    onClose()
  }

  const handleSwitch = (id: number) => {
    switchConversation(id)
    setLastRetrievalInfo(null) // 切换对话时也清除，等待新对话的检索结果
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div
        className="fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-surface shadow-xl"
        style={{ width: '75%', maxWidth: '320px' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-ink-muted/10">
          <span className="text-sm font-semibold text-ink-primary">会话历史</span>
          <button onClick={onClose} className="p-1 text-ink-tertiary">
            <X size={18} />
          </button>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 mx-3 mt-3 px-3 py-2.5 rounded-lg bg-zen-indigo/10 text-zen-indigo"
        >
          <Plus size={16} />
          <span className="text-sm font-medium">新对话</span>
        </button>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSwitch(conv.id)}
              className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-left ${
                conv.id === activeConversationId
                  ? 'bg-zen-indigo/10 text-zen-indigo'
                  : 'text-ink-secondary hover:bg-canvas-warm'
              }`}
            >
              <MessageSquare size={14} className="flex-shrink-0 opacity-50" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{conv.title || '新对话'}</div>
                <div className="text-xs text-ink-tertiary">
                  {new Date(conv.timestamp).toLocaleDateString('zh-CN')}
                </div>
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="text-center text-xs text-ink-tertiary py-8">暂无历史会话</div>
          )}
        </div>
      </div>
    </>
  )
}
