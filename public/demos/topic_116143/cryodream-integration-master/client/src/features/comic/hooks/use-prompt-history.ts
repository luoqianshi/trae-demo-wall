import { useCallback, useEffect, useState } from 'react'

/** localStorage key */
const HISTORY_KEY = 'comic-prompt-history-v1'
const FAVORITES_KEY = 'comic-prompt-favorites-v1'
const MAX_HISTORY = 100

export interface PromptEntry {
  id: string
  text: string
  /** 类型：positive 正面提示词 / negative 负面提示词 */
  kind: 'positive' | 'negative'
  /** unix ms */
  ts: number
}

interface Store {
  history: PromptEntry[]
  favorites: PromptEntry[]
}

/** 从 localStorage 读取，避免 SSR 崩溃 */
function readStore(): Store {
  if (typeof window === 'undefined') return { history: [], favorites: [] }
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as PromptEntry[]
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') as PromptEntry[]
    return {
      history: Array.isArray(history) ? history : [],
      favorites: Array.isArray(favorites) ? favorites : [],
    }
  } catch {
    return { history: [], favorites: [] }
  }
}

function writeHistory(list: PromptEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('prompt-history-changed'))
  } catch {
    // ignore quota
  }
}

function writeFavorites(list: PromptEntry[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('prompt-favorites-changed'))
  } catch {
    // ignore quota
  }
}

/**
 * 提示词历史 + 收藏 hook：
 * - history：按时间倒序，最多 MAX_HISTORY 条
 * - favorites：用户显式收藏的条目
 * - 同步支持：多组件间通过 window custom event 广播刷新
 */
export function usePromptHistory() {
  const [store, setStore] = useState<Store>(() => readStore())

  useEffect(() => {
    const refresh = () => setStore(readStore())
    window.addEventListener('prompt-history-changed', refresh)
    window.addEventListener('prompt-favorites-changed', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('prompt-history-changed', refresh)
      window.removeEventListener('prompt-favorites-changed', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const pushHistory = useCallback((text: string, kind: PromptEntry['kind']) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const current = readStore().history
    // 去重：如果相同 kind + text 已存在，先移除旧的
    const filtered = current.filter((e) => !(e.text === trimmed && e.kind === kind))
    const next: PromptEntry[] = [
      { id: crypto.randomUUID(), text: trimmed, kind, ts: Date.now() },
      ...filtered,
    ].slice(0, MAX_HISTORY)
    writeHistory(next)
    setStore((s) => ({ ...s, history: next }))
  }, [])

  const clearHistory = useCallback(() => {
    writeHistory([])
    setStore((s) => ({ ...s, history: [] }))
  }, [])

  const removeHistoryEntry = useCallback((id: string) => {
    const next = readStore().history.filter((e) => e.id !== id)
    writeHistory(next)
    setStore((s) => ({ ...s, history: next }))
  }, [])

  const toggleFavorite = useCallback((entry: PromptEntry) => {
    const current = readStore().favorites
    const isFav = current.some((e) => e.text === entry.text && e.kind === entry.kind)
    const next = isFav
      ? current.filter((e) => !(e.text === entry.text && e.kind === entry.kind))
      : [{ ...entry, id: crypto.randomUUID(), ts: Date.now() }, ...current]
    writeFavorites(next)
    setStore((s) => ({ ...s, favorites: next }))
  }, [])

  const removeFavorite = useCallback((id: string) => {
    const next = readStore().favorites.filter((e) => e.id !== id)
    writeFavorites(next)
    setStore((s) => ({ ...s, favorites: next }))
  }, [])

  const isFavorite = useCallback(
    (text: string, kind: PromptEntry['kind']) => {
      const trimmed = text.trim()
      if (!trimmed) return false
      return store.favorites.some((e) => e.text === trimmed && e.kind === kind)
    },
    [store.favorites]
  )

  return {
    history: store.history,
    favorites: store.favorites,
    pushHistory,
    clearHistory,
    removeHistoryEntry,
    toggleFavorite,
    removeFavorite,
    isFavorite,
  }
}
