import { create } from 'zustand'
import { db } from '../lib/db'
import { isDemoMode } from '../lib/demoGuard'
import type { ConversationIntent } from '../lib/conversationIntent'

interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  intent?: ConversationIntent | null  // 内联意图确认卡片
}

interface ConversationMeta {
  id: number
  title: string
  timestamp: number
  messageCount: number
}

interface ConversationState {
  messages: ConversationMessage[]
  inputText: string
  isGenerating: boolean
  conversations: ConversationMeta[]
  activeConversationId: number | null

  addMessage: (msg: Omit<ConversationMessage, 'id' | 'timestamp'>) => void
  setMessages: (messages: ConversationMessage[]) => void
  clearMessages: () => void
  setInputText: (text: string) => void
  setIsGenerating: (v: boolean) => void

  loadConversations: () => Promise<void>
  createConversation: () => Promise<void>
  switchConversation: (id: number) => Promise<void>
  deleteConversation: (id: number) => Promise<void>
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  messages: [],
  inputText: '',
  isGenerating: false,
  conversations: [],
  activeConversationId: null,

  addMessage: (msg) =>
    set((state) => {
      const newMessages = [
        ...state.messages,
        { ...msg, id: generateId(), timestamp: Date.now() },
      ]
      const msgs = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }))

      const activeId = state.activeConversationId
      const title = msg.content.slice(0, 30) || '新对话'
      if (activeId) {
        db.conversations
          .update(activeId, { timestamp: Date.now(), title, messages: msgs })
          .then(() => get().loadConversations())
          .catch((e) => console.error('Save conversation error:', e))
      } else {
        db.conversations
          .add({ timestamp: Date.now(), title, messages: msgs })
          .then((id) => {
            set({ activeConversationId: id as number })
            get().loadConversations()
          })
          .catch((e) => console.error('Create conversation error:', e))
      }

      return { messages: newMessages }
    }),

  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [] }),
  setInputText: (inputText) => set({ inputText }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  loadConversations: async () => {
    try {
      const convs = await db.conversations.orderBy('timestamp').reverse().limit(50).toArray()
      const metas: ConversationMeta[] = convs.map((c) => ({
        id: c.id!,
        title: c.messages[0]?.content?.slice(0, 30) || '新对话',
        timestamp: c.timestamp,
        messageCount: c.messages.length,
      }))
      set({ conversations: metas })
      if (metas.length > 0 && !get().activeConversationId) {
        await get().switchConversation(metas[0].id)
      }
    } catch (e) {
      console.error('Load conversations error:', e)
    }
  },

  createConversation: async () => {
    try {
      // Demo Guard: 演示模式下允许创建临时对话，但不持久化
      if (isDemoMode()) {
        const fakeId = Math.floor(Math.random() * 1000000) + 1
        set({ messages: [], activeConversationId: fakeId })
        return
      }
      const id = await db.conversations.add({
        timestamp: Date.now(),
        title: '新对话',
        messages: [],
      })
      set({ messages: [], activeConversationId: id as number })
      await get().loadConversations()
    } catch (e) {
      console.error('Create conversation error:', e)
    }
  },

  switchConversation: async (id) => {
    try {
      const conv = await db.conversations.get(id)
      if (!conv) return
      const loaded = conv.messages.map((m, i) => ({
        id: `loaded-${id}-${i}`,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }))
      set({ messages: loaded, activeConversationId: id })
    } catch (e) {
      console.error('Switch conversation error:', e)
    }
  },

  deleteConversation: async (id) => {
    try {
      // Demo Guard: 演示模式下静默跳过删除
      if (isDemoMode()) {
        if (get().activeConversationId === id) {
          set({ messages: [], activeConversationId: null })
        }
        return
      }
      await db.conversations.delete(id)
      if (get().activeConversationId === id) {
        set({ messages: [], activeConversationId: null })
      }
      await get().loadConversations()
    } catch (e) {
      console.error('Delete conversation error:', e)
    }
  },
}))
