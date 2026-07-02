import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { AuthProvider } from '../lib/auth-context'
import { ToastProvider } from '../components/ui/Toast'

export const metadata: Metadata = {
  title: '彩笺寄 - AI 学术写作助手',
  description: '以墨香古韵，助学术耕耘。AI 学术写作规划，让长周期学术写作有章可循。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="light" suppressHydrationWarning>
      <body className="bg-[#FAF8F5] text-[#2C2420] antialiased">
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function() {
            try {
              const theme = localStorage.getItem('caijianji_theme') || 'light'
              document.documentElement.classList.remove('light', 'dark')
              document.documentElement.classList.add(theme)
            } catch(e) {}
          })()`}
        </Script>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
