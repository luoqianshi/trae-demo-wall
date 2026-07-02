'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { User, getMe, logout as apiLogout, register as apiRegister, createPlan } from './api'
import { createDocument } from './editor-api'
import { useToast } from '../components/ui/Toast'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  login: (token: string, user: User) => void
  logout: () => void
  register: (username: string, password: string, displayName?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/* ------------------------------------------------------------------ */
/*  同步结果类型                                                       */
/* ------------------------------------------------------------------ */

interface SyncResult {
  success: boolean
  migrated: { documents: number; plans: number; messages: number }
  errors: string[]
}

/**
 * 将游客本地数据同步到后端
 * - 成功后才清除本地数据
 * - 失败时保留本地数据，并返回错误信息供上层提示用户
 */
async function syncGuestData(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    migrated: { documents: 0, plans: 0, messages: 0 },
    errors: [],
  }

  if (typeof window === 'undefined') {
    return result
  }

  // 收集所有待删除的本地 key，等全部成功后再统一清理
  const keysToRemove: { storage: Storage; key: string }[] = []

  try {
    /* -------------------- 同步游客文档 -------------------- */
    const docKeys = Object.keys(localStorage).filter(k => k.startsWith('doc_draft_'))
    for (const key of docKeys) {
      try {
        const draft = JSON.parse(localStorage.getItem(key) || '{}')
        if (draft.title && draft.content) {
          await createDocument({ title: draft.title, content: draft.content })
          result.migrated.documents++
          keysToRemove.push({ storage: localStorage, key })
        }
      } catch (err: any) {
        const msg = `文档 "${key}" 同步失败`
        result.errors.push(msg)
        console.error(msg, err)
      }
    }

    /* -------------------- 同步游客聊天消息 -------------------- */
    const msgKeys = Object.keys(sessionStorage).filter(k => k.startsWith('guest_messages_'))
    for (const key of msgKeys) {
      try {
        // 聊天消息目前仅做清理（后端暂无对应接口）
        result.migrated.messages++
        keysToRemove.push({ storage: sessionStorage, key })
      } catch (err: any) {
        const msg = `聊天记录 "${key}" 清理失败`
        result.errors.push(msg)
        console.error(msg, err)
      }
    }

    /* -------------------- 同步游客计划 -------------------- */
    const planKeys = Object.keys(localStorage).filter(k => k.startsWith('guest_plan_'))
    for (const key of planKeys) {
      try {
        const plan = JSON.parse(localStorage.getItem(key) || '{}')
        if (plan.title) {
          await createPlan(plan)
          result.migrated.plans++
          keysToRemove.push({ storage: localStorage, key })
        }
      } catch (err: any) {
        const planData = JSON.parse(localStorage.getItem(key) || '{}')
        const msg = `计划 "${planData.title || key}" 同步失败`
        result.errors.push(msg)
        console.error(msg, err)
      }
    }

    /* -------------------- 统一清理已同步数据 -------------------- */
    if (result.errors.length === 0) {
      // 全部成功：统一删除本地数据
      for (const { storage, key } of keysToRemove) {
        storage.removeItem(key)
      }
    } else {
      // 部分失败：仅删除已成功同步的数据
      // 注意：这里不删除任何数据，因为用户可能想稍后重试
      // 如果确实需要删除已成功项，可以取消下面的注释
      // for (const { storage, key } of keysToRemove) { storage.removeItem(key) }
      result.success = false
    }
  } catch (e: any) {
    // 整体流程异常（如 JSON 解析错误、Storage 不可用等）
    result.success = false
    result.errors.push(`同步过程异常: ${e.message || String(e)}`)
    console.error('同步游客数据失败:', e)
  }

  return result
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const toast = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('caijianji_token')
    const savedUser = localStorage.getItem('caijianji_user')

    if (token && savedUser) {
      // Check if it's a guest token
      if (token.startsWith('guest_')) {
        try {
          const userData = JSON.parse(savedUser)
          setUser(userData)
        } catch {
          localStorage.removeItem('caijianji_token')
          localStorage.removeItem('caijianji_user')
        }
        setIsLoading(false)
      } else {
        // Real user - verify with server
        getMe()
          .then(user => {
            setUser(user)
            localStorage.setItem('caijianji_user', JSON.stringify(user))
          })
          .catch(() => {
            localStorage.removeItem('caijianji_token')
            localStorage.removeItem('caijianji_user')
          })
          .finally(() => setIsLoading(false))
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = (token: string, user: User) => {
    localStorage.setItem('caijianji_token', token)
    localStorage.setItem('caijianji_user', JSON.stringify(user))
    setUser(user)
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch {
      // ignore
    }
    localStorage.removeItem('caijianji_token')
    localStorage.removeItem('caijianji_user')
    setUser(null)
    window.location.href = '/'
  }

  const register = async (username: string, password: string, displayName?: string) => {
    setIsLoading(true)
    try {
      const data = await apiRegister(username, password, undefined, displayName)
      localStorage.setItem('caijianji_token', data.token)
      localStorage.setItem('caijianji_user', JSON.stringify(data.user))
      setUser(data.user)

      // 同步游客数据到后端
      const syncResult = await syncGuestData()

      if (syncResult.success) {
        toast.success(
          `数据迁移完成：已迁移 ${syncResult.migrated.documents} 个文档、` +
            `${syncResult.migrated.plans} 个计划、` +
            `${syncResult.migrated.messages} 条聊天记录。`,
          5000
        )
      } else {
        toast.warning(
          `部分数据未迁移成功：${syncResult.errors.join('；')}。` +
            `你的本地数据仍然保留，可以稍后重试。`,
          8000
        )
      }

      router.push('/app')
    } catch (err: any) {
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const isGuest = user?.isGuest || false

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      isGuest,
      login,
      logout,
      register,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
