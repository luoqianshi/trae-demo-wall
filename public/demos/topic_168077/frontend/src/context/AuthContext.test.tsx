import { describe, it, expect, vi } from 'vitest'
import { render, screen, renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import React from 'react'

function setupWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )
}

describe('AuthContext', () => {
  it('provides admin role as default', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: setupWrapper() })
    expect(result.current.role).toBe('admin')
    expect(result.current.childId).toBeNull()
    expect(result.current.childName).toBeNull()
  })

  it('switchToChild sets role to child with id and name', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: setupWrapper() })
    act(() => {
      result.current.switchToChild('1', '小明')
    })
    expect(result.current.role).toBe('child')
    expect(result.current.childId).toBe('1')
    expect(result.current.childName).toBe('小明')
  })

  it('switchToAdmin with correct password returns true and resets', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: setupWrapper() })
    act(() => {
      result.current.switchToChild('1', '小明')
    })
    let success = false
    act(() => {
      success = result.current.switchToAdmin('123456')
    })
    expect(success).toBe(true)
    expect(result.current.role).toBe('admin')
    expect(result.current.childId).toBeNull()
    expect(result.current.childName).toBeNull()
  })

  it('switchToAdmin with wrong password returns false', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: setupWrapper() })
    let success = true
    act(() => {
      success = result.current.switchToAdmin('wrong')
    })
    expect(success).toBe(false)
    expect(result.current.role).toBe('admin')
  })

  it('provides context to child components', () => {
    render(
      <AuthProvider>
        <div data-testid="auth-child">
          <AuthConsumer />
        </div>
      </AuthProvider>
    )
    expect(screen.getByTestId('auth-role')).toHaveTextContent('admin')
  })
})

function AuthConsumer() {
  const { role } = useAuth()
  return <span data-testid="auth-role">{role}</span>
}