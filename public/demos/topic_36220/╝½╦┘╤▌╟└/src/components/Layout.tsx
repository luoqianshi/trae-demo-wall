import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'

interface LayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  step?: number // 1-4
}

const STEPS = ['首页', 'AI分析', '准备优化', '模拟购票', '结果']

export default function Layout({ children, title, subtitle, step }: LayoutProps) {
  const { state } = useApp()

  return (
    <div className="relative min-h-screen grid-bg">
      {/* 顶部导航 */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-green to-neon-purple flex items-center justify-center font-black text-bg-deep text-lg shadow-neon-green">
            F
          </div>
          <div>
            <div className="font-bold text-lg tracking-wider shimmer-text">FastTicket AI</div>
            <div className="text-[10px] text-white/40 tracking-[0.3em] uppercase">AI 购票策略实验室</div>
          </div>
        </div>

        {/* 步骤指示器 */}
        <div className="hidden md:flex items-center gap-2">
          {STEPS.map((s, i) => {
            const active = step !== undefined && i + 1 === step
            const done = step !== undefined && i + 1 < step
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                    active
                      ? 'bg-neon-green text-bg-deep border-neon-green shadow-neon-green'
                      : done
                      ? 'bg-neon-green/20 text-neon-green border-neon-green/50'
                      : 'border-white/10 text-white/30'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-xs ${active ? 'text-neon-green' : done ? 'text-white/60' : 'text-white/30'}`}>
                  {s}
                </span>
                {i < STEPS.length - 1 && <div className="w-4 h-px bg-white/10" />}
              </div>
            )
          })}
        </div>

        {/* 当前演唱会信息 */}
        {state.concertName && (
          <div className="text-right">
            <div className="text-sm font-bold text-neon-green text-glow-green">{state.concertName}</div>
            <div className="text-[10px] text-white/40">{state.city} · {state.ticketTime || '待定'}</div>
          </div>
        )}
      </header>

      {/* 主内容 */}
      <main className="relative z-10 px-6 py-8 max-w-6xl mx-auto">
        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            {title && (
              <h1 className="text-3xl md:text-4xl font-black tracking-wider mb-2">
                <span className="shimmer-text">{title}</span>
              </h1>
            )}
            {subtitle && <p className="text-white/50 text-sm tracking-wide">{subtitle}</p>}
          </motion.div>
        )}
        {children}
      </main>
    </div>
  )
}
