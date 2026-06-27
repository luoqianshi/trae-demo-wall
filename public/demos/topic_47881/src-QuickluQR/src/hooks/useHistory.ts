import { useState, useCallback, useEffect, useRef } from 'react'

export interface HistoryItem {
  id: string
  content: string
  ecLevel: 'L' | 'M' | 'Q' | 'H'
  whiteBg: boolean
  createdAt: number
}

export type HistoryAddItem = Omit<HistoryItem, 'id' | 'createdAt'>

const STORAGE_KEY = 'quicklyqr-history'
const MAX_ITEMS = 1000
const DEDUP_WINDOW_MS = 10000

function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI !== undefined
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function readLocalStorage(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as HistoryItem[]
  } catch {
    return []
  }
}

function writeLocalStorage(items: HistoryItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function sortByCreatedDesc(items: HistoryItem[]): HistoryItem[] {
  return [...items].sort((a, b) => b.createdAt - a.createdAt)
}

function lsLoad(): HistoryItem[] {
  return sortByCreatedDesc(readLocalStorage())
}

function lsAdd(item: Omit<HistoryItem, 'id' | 'createdAt'>): HistoryItem[] {
  const items = readLocalStorage()
  const now = Date.now()

  const isDuplicate = items.some((existing) => {
    if (now - existing.createdAt > DEDUP_WINDOW_MS) return false
    return (
      existing.content === item.content &&
      existing.ecLevel === item.ecLevel &&
      existing.whiteBg === item.whiteBg
    )
  })

  if (!isDuplicate) {
    const newItem: HistoryItem = {
      id: generateId(),
      content: item.content,
      ecLevel: item.ecLevel,
      whiteBg: item.whiteBg,
      createdAt: now,
    }
    items.push(newItem)
  }

  const sorted = sortByCreatedDesc(items)
  const limited = sorted.slice(0, MAX_ITEMS)
  writeLocalStorage(limited)
  return limited
}

function lsDelete(id: string): HistoryItem[] {
  const items = readLocalStorage()
  const filtered = items.filter((item) => item.id !== id)
  writeLocalStorage(filtered)
  return sortByCreatedDesc(filtered)
}

function lsClear(): HistoryItem[] {
  writeLocalStorage([])
  return []
}

async function fetchHistory(): Promise<HistoryItem[]> {
  if (isElectron()) {
    return window.electronAPI.historyLoad()
  }
  return lsLoad()
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function initLoad() {
      try {
        const result = await fetchHistory()
        if (!cancelled && mountedRef.current) {
          setItems(result)
        }
      } catch (e) {
        if (!cancelled && mountedRef.current) {
          setError(e instanceof Error ? e.message : '加载历史记录失败')
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false)
        }
      }
    }
    initLoad()
    return () => {
      cancelled = true
    }
  }, [])

  const reloadHistory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchHistory()
      if (mountedRef.current) {
        setItems(result)
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : '加载历史记录失败')
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  const addHistory = useCallback(
    async (item: Omit<HistoryItem, 'id' | 'createdAt'>) => {
      setError(null)
      try {
        if (isElectron()) {
          const result = await window.electronAPI.historyAdd(item)
          if (mountedRef.current) {
            setItems(result)
          }
        } else {
          if (mountedRef.current) {
            setItems(lsAdd(item))
          }
        }
      } catch (e) {
        if (mountedRef.current) {
          setError(e instanceof Error ? e.message : '保存历史记录失败')
        }
      }
    },
    [],
  )

  const deleteHistory = useCallback(async (id: string) => {
    setError(null)
    try {
      if (isElectron()) {
        const result = await window.electronAPI.historyDelete(id)
        if (mountedRef.current) {
          setItems(result)
        }
      } else {
        if (mountedRef.current) {
          setItems(lsDelete(id))
        }
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : '删除历史记录失败')
      }
    }
  }, [])

  const clearHistory = useCallback(async () => {
    setError(null)
    try {
      if (isElectron()) {
        await window.electronAPI.historyClear()
        if (mountedRef.current) {
          setItems([])
        }
      } else {
        lsClear()
        if (mountedRef.current) {
          setItems([])
        }
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : '清空历史记录失败')
      }
    }
  }, [])

  return {
    items,
    loading,
    error,
    addHistory,
    deleteHistory,
    clearHistory,
    reloadHistory,
  }
}
