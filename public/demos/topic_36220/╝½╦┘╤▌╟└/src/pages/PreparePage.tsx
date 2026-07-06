import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import Layout from '../components/Layout'
import GlowButton from '../components/GlowButton'
import AnimatedNumber from '../components/AnimatedNumber'
import { useApp } from '../context/AppContext'

interface CheckItem {
  key: 'realName' | 'payment' | 'audience' | 'network'
  title: string
  desc: string
  icon: string
  detail: string
}

interface HudNotification {
  id: number
  text: string
  color: string
  icon: string
}

const CHECKLIST: CheckItem[] = [
  { key: 'realName', title: '实名认证', desc: '身份证信息已校验', icon: '🪪', detail: 'AI 自动校验身份证 + 人脸比对' },
  { key: 'payment', title: '支付方式', desc: '免密支付已绑定', icon: '💳', detail: 'AI 优化支付通道，免密 + 备用卡' },
  { key: 'audience', title: '观演人信息', desc: '观演人列表已预填', icon: '👥', detail: 'AI 预填观演人，支持 5 人快速切换' },
  { key: 'network', title: '网络节点加速', desc: 'BGP 专线已就绪', icon: '🌐', detail: 'AI 智能选择最优 BGP 节点' },
]

let hudIdCounter = 0

export default function PreparePage() {
  const { state, dispatch } = useApp()
  const prevCountRef = useRef(state.optimizationCount)
  const [pulse, setPulse] = useState(false)
  const [huds, setHuds] = useState<HudNotification[]>([])

  const addHud = useCallback((text: string, color: string, icon: string) => {
    const id = ++hudIdCounter
    setHuds((prev) => [...prev, { id, text, color, icon }])
    setTimeout(() => {
      setHuds((prev) => prev.filter((h) => h.id !== id))
    }, 800)
  }, [])

  const handleOptimize = (key: CheckItem['key']) => {
    if (state.checklist[key]) return
    dispatch({ type: 'OPTIMIZE', payload: key })

    // 弹出 HUD 通知
    addHud('+15% Success Rate', '#B026FF', '🎯')
    setTimeout(() => addHud('+25 Preparation Score', '#00FF9D', '⚡'), 100)
    setTimeout(() => addHud('-28ms Network Delay', '#00D4FF', '📡'), 200)
  }

  useEffect(() => {
    if (state.optimizationCount !== prevCountRef.current && state.optimizationCount > 0) {
      setPulse(true)
      const timer = setTimeout(() => setPulse(false), 600)
      prevCountRef.current = state.optimizationCount
      return () => clearTimeout(timer)
    }
  }, [state.optimizationCount])

  const allDone = state.optimizationCount >= 4
  const canSimulate = state.optimizationCount >= 1

  return (
    <Layout
      step={3}
      title="AI 准备优化"
      subtitle="每点击一次【AI优化】，准备度、成功率、延迟同步变化"
    >
      {/* HUD 通知层 */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-2">
        <AnimatePresence>
          {huds.map((hud) => (
            <motion.div
              key={hud.id}
              initial={{ opacity: 0, scale: 0.5, y: -20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.5, y: 20, filter: 'blur(4px)' }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{
                background: `rgba(10,12,16,0.9)`,
                border: `1px solid ${hud.color}60`,
                boxShadow: `0 0 30px ${hud.color}40, 0 0 60px ${hud.color}20`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <motion.span
                className="text-lg"
                animate={{ scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                {hud.icon}
              </motion.span>
              <motion.span
                className="font-black text-lg tracking-wider"
                style={{
                  color: hud.color,
                  textShadow: `0 0 20px ${hud.color}, 0 0 40px ${hud.color}60`,
                }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.4 }}
              >
                {hud.text}
              </motion.span>
              {/* 粒子散射 */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full"
                  style={{ background: hud.color }}
                  initial={{ opacity: 1, x: 0, y: 0 }}
                  animate={{
                    opacity: 0,
                    x: (Math.random() - 0.5) * 80,
                    y: (Math.random() - 0.5) * 60,
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 顶部数据面板 */}
      <motion.div
        className="grid grid-cols-3 gap-4 mb-8"
        animate={pulse ? { scale: [1, 1.01, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <StatCard
          label="设备准备度"
          value={state.prepareScore}
          suffix="/100"
          color="#00FF9D"
          icon="⚡"
          pulse={pulse}
        />
        <StatCard
          label="AI 成功率预测"
          value={state.successRate}
          suffix="%"
          color="#B026FF"
          icon="🎯"
          pulse={pulse}
        />
        <StatCard
          label="网络延迟"
          value={state.networkLatency}
          suffix="ms"
          color="#00D4FF"
          icon="📡"
          invert
          pulse={pulse}
        />
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 左：检查项 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-neon-green rounded-full" />
              <h2 className="text-lg font-bold">准备检查项</h2>
            </div>
            <span className="text-xs text-white/50">
              已优化 <span className="text-neon-green font-bold">{state.optimizationCount}</span> / 4
            </span>
          </div>

          {CHECKLIST.map((item, i) => {
            const done = state.checklist[item.key]
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass p-4 flex items-center justify-between transition-all ${
                  done ? 'glow-border-green' : 'border border-white/5'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <motion.div
                    animate={done ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                    transition={{ duration: 0.5 }}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                      done ? 'bg-neon-green/20 shadow-neon-green' : 'bg-white/5'
                    }`}
                  >
                    {done ? '✓' : item.icon}
                  </motion.div>
                  <div className="flex-1">
                    <div className={`font-bold text-sm ${done ? 'text-neon-green' : 'text-white'}`}>
                      {item.title}
                    </div>
                    <div className="text-[11px] text-white/40 mt-0.5">
                      {done ? item.detail : item.desc}
                    </div>
                  </div>
                </div>
                <GlowButton
                  size="sm"
                  variant={done ? 'ghost' : 'green'}
                  disabled={done}
                  onClick={() => handleOptimize(item.key)}
                >
                  {done ? '已优化' : 'AI 优化'}
                </GlowButton>
              </motion.div>
            )
          })}
        </div>

        {/* 右：优化影响可视化 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-5 bg-neon-purple rounded-full" />
            <h2 className="text-lg font-bold">AI 影响分析</h2>
          </div>

          {/* 进度环 */}
          <div className="glass p-6">
            <div className="flex items-center justify-center gap-8">
              <RingProgress
                value={state.prepareScore}
                max={100}
                label="准备度"
                color="#00FF9D"
                pulse={pulse}
              />
              <RingProgress
                value={state.successRate}
                max={100}
                label="成功率"
                color="#B026FF"
                pulse={pulse}
              />
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex justify-between text-xs text-white/50 mb-2">
                <span>网络延迟</span>
                <motion.span
                  animate={pulse ? { scale: [1, 1.3, 1], color: ['#00D4FF', '#00FF9D', '#00D4FF'] } : {}}
                  transition={{ duration: 0.5 }}
                  className={state.networkLatency < 50 ? 'text-neon-green' : 'text-neon-yellow'}
                >
                  {state.networkLatency < 50 ? '✓ 极速' : state.networkLatency < 100 ? '⚠ 一般' : '⚠ 较慢'}
                </motion.span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-neon-red via-neon-yellow to-neon-green"
                  animate={{ width: `${Math.max(0, Math.min(100, (200 - state.networkLatency) / 2))}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/30 mt-1">
                <span>200ms</span>
                <span>8ms</span>
              </div>
            </div>
          </div>

          {/* 关键提示 */}
          <AnimatePresence>
            {state.optimizationCount >= 3 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass glow-border-green p-4 text-center"
              >
                <div className="text-neon-green font-bold text-sm mb-1">✓ 已达到成功阈值</div>
                <div className="text-xs text-white/50">
                  优化次数 ≥ 3，模拟购票将判定为<span className="text-neon-green font-bold">成功</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass glow-border-red p-4 text-center"
              >
                <div className="text-neon-red font-bold text-sm mb-1">
                  ⚠ 还需优化 {3 - state.optimizationCount} 项才能成功
                </div>
                <div className="text-xs text-white/50">
                  当前优化次数 {state.optimizationCount}，少于 3 将判定为<span className="text-neon-red font-bold">失败</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 底部按钮 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 flex justify-center gap-4"
      >
        <GlowButton
          variant="ghost"
          size="lg"
          onClick={() => dispatch({ type: 'GO_PAGE', payload: 'analysis' })}
        >
          ← 返回分析
        </GlowButton>
        <GlowButton
          variant="purple"
          size="lg"
          disabled={!canSimulate}
          onClick={() => dispatch({ type: 'GO_PAGE', payload: 'simulate' })}
        >
          {canSimulate ? '🚀 开始模拟购票' : '至少优化 1 项'}
        </GlowButton>
      </motion.div>

      {/* 全部优化完成提示 */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 glass-strong glow-border-green px-6 py-3 rounded-full text-sm z-50"
          >
            <span className="text-neon-green font-bold">✓ 满分准备！</span>
            <span className="text-white/60 ml-2">成功率已拉满，立即开始模拟</span>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}

// ============ 子组件 ============
function StatCard({
  label,
  value,
  suffix,
  color,
  icon,
  invert,
  pulse,
}: {
  label: string
  value: number
  suffix: string
  color: string
  icon: string
  invert?: boolean
  pulse?: boolean
}) {
  const controls = useAnimation()

  useEffect(() => {
    if (pulse) {
      controls.start({
        scale: [1, 1.15, 0.95, 1.05, 1],
        textShadow: [
          `0 0 10px ${color}80`,
          `0 0 40px ${color}`,
          `0 0 20px ${color}80`,
          `0 0 10px ${color}80`,
        ],
        transition: { duration: 0.6 },
      })
    }
  }, [pulse, controls, color])

  return (
    <motion.div
      className="glass p-4 relative overflow-hidden"
      whileHover={{ y: -4 }}
      animate={controls}
    >
      <div className="absolute inset-0 opacity-0 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${color}20, transparent 70%)` }} />
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/50 tracking-wider">{label}</span>
        <motion.span
          className="text-lg"
          animate={pulse ? { rotate: [0, -15, 15, 0], scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          {icon}
        </motion.span>
      </div>
      <motion.div
        className="text-3xl font-black"
        animate={pulse ? { scale: [1, 1.2, 1], color: [color, '#ffffff', color] } : {}}
        transition={{ duration: 0.4 }}
      >
        <AnimatedNumber value={value} suffix={suffix} color={color} duration={600} />
      </motion.div>
      {invert && <div className="text-[10px] text-white/30 mt-1">越低越好</div>}
    </motion.div>
  )
}

function RingProgress({
  value,
  max,
  label,
  color,
  pulse,
}: {
  value: number
  max: number
  label: string
  color: string
  pulse?: boolean
}) {
  const pct = Math.min(100, (value / max) * 100)
  const r = 42
  const c = 2 * Math.PI * r
  return (
    <motion.div
      className="relative w-28 h-28"
      animate={pulse ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
      transition={{ duration: 0.5 }}
    >
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <motion.circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ filter: pulse ? `drop-shadow(0 0 16px ${color})` : `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          animate={pulse ? { scale: [1, 1.25, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          <AnimatedNumber value={value} className="text-xl font-black" color={color} />
        </motion.div>
        <div className="text-[10px] text-white/40 tracking-wider mt-0.5">{label}</div>
      </div>
    </motion.div>
  )
}