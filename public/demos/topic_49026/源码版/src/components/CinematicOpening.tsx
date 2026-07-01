import { useState, useEffect, useRef } from 'react'

/**
 * P0-3: 电影开场动画
 * 3 秒品牌叙事，替代白屏等待
 * 深色背景 → 心跳脉冲 → 记忆碎片汇聚 → logo → 界面渐入
 */

interface CinematicOpeningProps {
  onComplete: () => void
}

export function CinematicOpening({ onComplete }: CinematicOpeningProps) {
  const [phase, setPhase] = useState(0)
  // 0: 深色背景
  // 1: 心跳脉冲
  // 2: 记忆碎片汇聚
  // 3: logo 展示
  // 4: 淡出
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    // 阶段 1: 心跳脉冲 (300ms)
    timerRef.current.push(setTimeout(() => setPhase(1), 300))
    // 阶段 2: 记忆碎片汇聚 (800ms)
    timerRef.current.push(setTimeout(() => setPhase(2), 800))
    // 阶段 3: logo 展示 (1600ms)
    timerRef.current.push(setTimeout(() => setPhase(3), 1600))
    // 阶段 4: 淡出 (2600ms)
    timerRef.current.push(setTimeout(() => setPhase(4), 2600))
    // 完成 (3200ms)
    timerRef.current.push(setTimeout(() => onComplete(), 3200))

    return () => {
      timerRef.current.forEach(clearTimeout)
    }
  }, [onComplete])

  // 记忆碎片文本（固定位置）
  const FIXED_FRAGMENTS = [
    { text: '王思亮', startX: -180, startY: -120 },
    { text: '周会', startX: 150, startY: -80 },
    { text: '运营数据', startX: -120, startY: 100 },
    { text: '晓薇', startX: 200, startY: 60 },
    { text: '创业', startX: -60, startY: -150 },
    { text: '一诺', startX: 100, startY: 130 },
    { text: '体检', startX: -200, startY: 20 },
    { text: '赵海明', startX: 180, startY: -140 },
    { text: '张伟华', startX: -150, startY: -60 },
    { text: '西溪湿地', startX: 60, startY: 80 },
  ]

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-600 ${
        phase >= 4 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: phase === 0
          ? 'var(--color-canvas-deep, #1a1f1a)'
          : phase >= 1
            ? `radial-gradient(circle at center, color-mix(in srgb, var(--color-zen-sage, #6B9E6B) 15%, var(--color-canvas-deep, #1a1f1a)) 0%, var(--color-canvas-deep, #1a1f1a) 70%)`
            : 'var(--color-canvas-deep, #1a1f1a)',
      }}
    >
      {/* 心跳脉冲 */}
      {phase >= 1 && phase < 3 && (
        <div
          className="absolute rounded-full"
          style={{
            width: phase >= 2 ? '120px' : '60px',
            height: phase >= 2 ? '120px' : '60px',
            background: `radial-gradient(circle, color-mix(in srgb, var(--color-zen-sage, #6B9E6B) 30%, transparent) 0%, transparent 70%)`,
            animation: 'heartbeat 1.2s ease-in-out infinite',
            transition: 'width 0.4s ease, height 0.4s ease',
          }}
        />
      )}

      {/* 记忆碎片汇聚 */}
      {phase >= 2 && phase < 3 && (
        <div className="absolute inset-0 flex items-center justify-center">
          {FIXED_FRAGMENTS.map((frag, i) => (
            <span
              key={i}
              className="absolute text-xs font-mono whitespace-nowrap"
              style={{
                color: `color-mix(in srgb, var(--color-zen-sage, #6B9E6B) ${30 + (i % 3) * 20}%, transparent)`,
                animation: `converge-${i} 1.2s ease-out forwards`,
                ['--start-x' as string]: `${frag.startX}px`,
                ['--start-y' as string]: `${frag.startY}px`,
              }}
            >
              {frag.text}
            </span>
          ))}
        </div>
      )}

      {/* Logo 展示 */}
      {phase >= 3 && (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
          <div
            className="w-20 h-20 rounded-full bg-gradient-to-br from-zen-sage to-zen-terracotta flex items-center justify-center mb-4 shadow-2xl"
            style={{
              animation: 'logoGlow 1s ease-out',
            }}
          >
            <span className="text-3xl text-white font-serif">舟</span>
          </div>
          <h1 className="text-2xl font-serif text-white mb-1 tracking-wide">衡舟</h1>
          <p className="text-sm text-white/60 tracking-wider">你的第二大脑</p>
        </div>
      )}

      {/* 内联动画样式 */}
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes logoGlow {
          0% { transform: scale(0.5); opacity: 0; box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-zen-sage, #6B9E6B) 0%); }
          50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 40px 10px color-mix(in srgb, var(--color-zen-sage, #6B9E6B) 30%); }
          100% { transform: scale(1); opacity: 1; box-shadow: 0 0 20px 5px color-mix(in srgb, var(--color-zen-sage, #6B9E6B) 15%); }
        }
        ${FIXED_FRAGMENTS.map((_, i) => `
          @keyframes converge-${i} {
            0% {
              transform: translate(var(--start-x), var(--start-y)) scale(0.5);
              opacity: 0;
            }
            60% {
              opacity: 0.8;
            }
            100% {
              transform: translate(0, 0) scale(0);
              opacity: 0;
            }
          }
        `).join('')}
      `}</style>
    </div>
  )
}
