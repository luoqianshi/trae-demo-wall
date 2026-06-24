import { type ReactNode } from 'react'
import { useAuth } from '../../lib/auth'
import { LoginPage } from '../../pages/Login'

/**
 * RequireAuth 包裹需要认证的路由元素。
 * 未认证时渲染 LoginPage，认证后渲染子元素。
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <LoginPage />
  }
  return <>{children}</>
}
