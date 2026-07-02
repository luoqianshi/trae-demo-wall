'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth-context'
import { TopNavBar } from './components/TopNavBar'
import { MobileNav } from './components/MobileNav'
import { ToastProvider } from '../../components/ui/Toast'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router, mounted])

  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center paper-texture ink-wash">
        <div className="relative">
          <div
            className="w-12 h-12 rounded-full border-2 border-ink/20"
            style={{
              borderTopColor: '#8B5E3C',
              borderRightColor: 'rgba(139,94,60,0.3)',
              animation: 'spin 1.2s linear infinite',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-ochre to-cinnabar flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        </div>
        <p className="mt-4 font-serif text-sm text-ink-muted animate-pulse">加载中...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col paper-texture ink-wash">
        <TopNavBar />
        <main className="flex-1 min-h-0 pb-16 md:pb-0 animate-page-enter">
          <div className="relative h-full">{children}</div>
        </main>
        <MobileNav />
      </div>
    </ToastProvider>
  )
}
