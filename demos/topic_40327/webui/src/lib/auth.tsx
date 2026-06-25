import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { API_BASE } from '../lib/api'

interface AuthContextType {
  token: string
  isAuthenticated: boolean
  login: (token: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'yf_auth_token'

function getStoredToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string>(getStoredToken)
  const didInit = useRef(false)

  const isAuthenticated = !!token

  const login = useCallback(async (inputToken: string): Promise<boolean> => {
    try {
      const resp = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inputToken }),
      })
      const data = await resp.json()
      if (data.success) {
        localStorage.setItem(TOKEN_KEY, inputToken)
        setToken(inputToken)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken('')
  }, [])

  // 启动时检查认证状态：无 token 时检查是否需要认证，有 token 时验证是否有效
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    const stored = getStoredToken()
    const headers: Record<string, string> = {}
    if (stored) {
      headers['Authorization'] = `Bearer ${stored}`
    }

    fetch(`${API_BASE}/auth/status`, { headers })
      .then(r => r.json())
      .then(data => {
        if (!data.auth_required) {
          // 服务端未设置 token，不需要认证
          setToken('no-auth-needed')
        } else if (stored && data.token_valid === false) {
          // 存储的 token 已失效（服务重启后 token 变了），清除并回到登录页
          localStorage.removeItem(TOKEN_KEY)
          setToken('')
        }
        // token 有效或未登录时不做任何操作，保持当前状态
      })
      .catch(() => {
        // 网络错误时保持当前状态，不做清除
      })
  }, [])

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth 必须在 AuthProvider 内使用')
  }
  return ctx
}