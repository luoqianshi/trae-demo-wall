'use client'

import { useEffect } from 'react'
import { Button } from '../components/ui/Button'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#F5EDE3] flex items-center justify-center border border-[#E5DDD4]">
          <AlertTriangle className="w-10 h-10 text-[#B54A3A]" />
        </div>
        <h1 className="text-2xl font-bold text-[#2C2420] mb-2">出了点小问题</h1>
        <p className="text-[#8A7E74] mb-8 leading-relaxed">
          {error.message || '页面遇到了意外错误，请尝试刷新页面。'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={() => window.location.href = '/'}>
            <Home className="w-4 h-4" />
            返回首页
          </Button>
          <Button onClick={reset}>
            <RotateCcw className="w-4 h-4" />
            重试
          </Button>
        </div>
      </div>
    </div>
  )
}
