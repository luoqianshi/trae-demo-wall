import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import GlowButton from '../components/GlowButton'
import AnimatedNumber from '../components/AnimatedNumber'
import { useApp, TIER_INFO } from '../context/AppContext'

type Phase = 'scanning' | 'heat' | 'rate' | 'strategy' | 'ticketStrategy' | 'done'

export default function AnalysisPage() {
  const { state, dispatch } = useApp()
  const [phase, setPhase] = useState<Phase>('scanning')
  const info = TIER_INFO[state.tier]

  // 阶段顺序推进
  useEffect(() => {
    const timers: number[] = []
    timers.push(window.setTimeout(() => setPhase('heat'), 400))
    timers.push(window.setTimeout(() => setPhase('rate'), 1000))
    timers.push(window.setTimeout(() => setPhase('strategy'), 1600))
    timers.push(window.setTimeout(() => setPhase('ticketStrategy'), 2200))
    timers.push(window.setTimeout(() => setPhase('done'), 3000))
    return () => timers.forEach(clearTimeout)
  }, [])

  // 热门程度文案
  const heatDesc =
    state.tier === 'hot'
      ? '百万人竞争 · 服务器瞬时压力极高'
      : state.tier === 'normal'
      ? '中等竞争 · 模拟难度可控'
      : '竞争较低 · 大概率可购'

  const competitorCount =
    state.tier === 'hot' ? 1280000 : state.tier === 'normal' ? 85000 : 4200

  // 策略建议
  const strategies =
    state.tier === 'hot'
      ? [
          '⚡ 激进策略：开票前 3 分钟预热 BGP 专线节点',
          '⚡ 多设备并发：建议 3 台设备同时挂机',
          '⚡ 实名信息预填：观演人/支付方式提前校验',
          '⚡ 网络优化：切换 5G + WiFi 双通道',
          '⚡ 备用方案：准备 3 个购票平台账号',
        ]
      : state.tier === 'normal'
      ? [
          '✓ 稳健策略：开票前 1 分钟进入排队',
          '✓ 实名认证：确保观演人信息已填',
          '✓ 支付预检：绑定免密支付方式',
          '✓ 网络检查：测试当前网络延迟',
        ]
      : [
          '✓ 轻松策略：正常进入即可',
          '✓ 信息预填：观演人信息已填即可',
          '✓ 支付方式：任意支付方式均可',
        ]

  // 票档策略
  const ticketStrategy =
    state.tier === 'hot'
      ? {
          headline: '检测到超高热度场次',
          sub: '预计开票瞬时流量突破 100 万+',
          main: '主策略：780元档',
          backup: '备选策略：580元档',
          aiJudge: 'AI判断：中档票竞争压力最低，成功率最高',
        }
      : state.tier === 'normal'
      ? {
          headline: '竞争热度中等',
          sub: '预计开票瞬时流量约 8 万+',
          main: '推荐：优先选择视野最佳区域',
          backup: '无需降档策略',
          aiJudge: 'AI判断：按偏好选座即可，无需备选',
        }
      : {
          headline: '检测到余票充足',
          sub: '预计开票瞬时流量低于 1 万',
          main: '推荐：直接选择最佳观演区',
          backup: '无需备选策略',
          aiJudge: 'AI判断：座位充足，无需降档',
        }

  return (
    <Layout step={2} title="AI 策略推演" subtitle={`正在推演「${state.concertName}」的场景成功率...`}>
      <div className="grid md:grid-cols-2 gap-6">
        {/* 左：热度分析 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 relative overflow-hidden"
          style={{ borderColor: `${info.color}40` }}
        >
          {/* 扫描线 */}
          {phase === 'scanning' && (
            <motion.div
              className="absolute left-0 right-0 h-px"
              style={{ background: info.color, boxShadow: `0 0 20px ${info.color}` }}
              initial={{ top: 0 }}
              animate={{ top: '100%' }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background: info.color }} />
              <h2 className="text-lg font-bold">热度分析</h2>
            </div>
            <span
              className="text-[10px] px-2 py-1 rounded-full font-bold tracking-wider"
              style={{ color: info.color, background: `${info.color}20`, border: `1px solid ${info.color}50` }}
            >
              {info.label}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {phase === 'scanning' && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 mx-auto mb-4 border-2 border-transparent rounded-full"
                  style={{ borderTopColor: info.color, borderRightColor: info.color }}
                />
                <div className="text-white/50 text-sm">AI 正在扫描场景参数...</div>
              </motion.div>
            )}

            {phase !== 'scanning' && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {/* 热度权重环形 */}
                <div className="flex items-center justify-center my-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                      <motion.circle
                        cx="50" cy="50" r="42" fill="none" stroke={info.color} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 42}
                        initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - state.hotWeight) }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        style={{ filter: `drop-shadow(0 0 8px ${info.color})` }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <AnimatedNumber
                        value={state.hotWeight * 100}
                        decimals={0}
                        suffix="%"
                        className="text-2xl font-black"
                        color={info.color}
                      />
                      <div className="text-[10px] text-white/40 tracking-wider">HOT WEIGHT</div>
                    </div>
                  </div>
                </div>

                <div className="text-center mb-4">
                  <div className="text-sm font-bold" style={{ color: info.color }}>
                    {heatDesc}
                  </div>
                  <div className="text-xs text-white/40 mt-1">
                    预估参与人数：<AnimatedNumber value={competitorCount} suffix=" 人" className="font-mono text-neon-green" />
                  </div>
                </div>

                {/* 竞争等级条 */}
                <div className="space-y-2">
                  {[
                    { label: '竞争强度', val: state.hotWeight * 100, color: info.color },
                    { label: '服务器压力', val: state.tier === 'hot' ? 95 : state.tier === 'normal' ? 50 : 20, color: '#FF3D5A' },
                    { label: '黄牛活跃度', val: state.tier === 'hot' ? 88 : state.tier === 'normal' ? 40 : 10, color: '#FFE600' },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-[10px] text-white/50 mb-1">
                        <span>{b.label}</span>
                        <span style={{ color: b.color }}>{Math.round(b.val)}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${b.val}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 右：成功率预测 + 策略 */}
        <div className="space-y-6">
          {/* 成功率预测 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass glow-border-green p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-neon-green rounded-full" />
              <h2 className="text-lg font-bold">场景成功率预测</h2>
            </div>

            <div className="text-center py-4">
              <div className="text-6xl font-black mb-2">
                <AnimatedNumber
                  value={state.successRate}
                  suffix="%"
                  duration={1500}
                  className="text-glow-green"
                  color="#00FF9D"
                />
              </div>
              <div className="text-xs text-white/40 tracking-widest">SCENARIO SUCCESS RATE</div>

              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs">
                <motion.span
                  className="w-2 h-2 rounded-full bg-neon-green"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-white/60">
                  {state.successRate < 20
                    ? '⚠ 危险：当前几乎不可能抢到'
                    : state.successRate < 50
                    ? '⚠ 警告：成功率偏低，需优化'
                    : '✓ 安全：成功率良好'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* AI 策略建议 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass glow-border-purple p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-neon-purple rounded-full" />
              <h2 className="text-lg font-bold">AI 策略推演</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/40">
                {state.tier === 'hot' ? '激进模式' : state.tier === 'normal' ? '稳健模式' : '轻松模式'}
              </span>
            </div>

            <AnimatePresence mode="wait">
              {phase === 'strategy' || phase === 'ticketStrategy' || phase === 'done' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  {strategies.map((s, i) => (
                    <motion.div
                      key={s}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="text-sm p-2 rounded-lg bg-white/5 border border-white/5 text-white/80"
                    >
                      {s}
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="py-8 text-center text-white/30 text-sm">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    AI 正在生成策略...
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* AI 策略推演 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass glow-border-green p-6 relative overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 rounded-full border-2 border-neon-green border-t-transparent"
              />
              <h2 className="text-lg font-bold text-neon-green text-glow-green">AI 策略推演</h2>
            </div>

            <AnimatePresence mode="wait">
              {phase === 'ticketStrategy' || phase === 'done' ? (
                <motion.div
                  key="ticket-strategy"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3 font-mono text-sm"
                >
                  <TypeWriter text={ticketStrategy.headline} color="#00FF9D" delay={30} />
                  <TypeWriter text={ticketStrategy.sub} color="#ffffffb3" delay={25} startDelay={250} />
                  <div className="pt-2 space-y-2">
                    <TypeWriter text={ticketStrategy.main} color="#B026FF" delay={25} startDelay={500} />
                    <TypeWriter text={ticketStrategy.backup} color="#00D4FF" delay={25} startDelay={750} />
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="p-2.5 rounded-lg bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs mt-2"
                  >
                    {ticketStrategy.aiJudge}
                  </motion.div>
                </motion.div>
              ) : (
                <div className="py-6 text-center text-white/30 text-sm">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    AI 正在推演最佳购票策略...
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* 扫描线 */}
            {(phase === 'ticketStrategy' || phase === 'done') && (
              <motion.div
                className="absolute left-0 right-0 h-px bg-neon-green"
                style={{ boxShadow: '0 0 20px #00FF9D' }}
                initial={{ top: 0, opacity: 0.6 }}
                animate={{ top: '100%', opacity: [0.6, 0.2, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </motion.div>

          {/* AI 决策可信度 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass glow-border-purple p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-neon-purple rounded-full" />
              <h2 className="text-lg font-bold">AI 决策可信度</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/40">
                {state.tier === 'hot' ? '高可信度' : state.tier === 'normal' ? '较高可信度' : '极高可信度'}
              </span>
            </div>

            <div className="text-center py-3">
              <div className="text-5xl font-black text-neon-purple text-glow-purple">
                <AnimatedNumber
                  value={state.tier === 'hot' ? 90 : state.tier === 'normal' ? 93 : 97}
                  suffix="%"
                  duration={1200}
                  color="#B026FF"
                />
              </div>
              <div className="text-xs text-white/40 tracking-widest mt-1">CREDIBILITY SCORE</div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="text-xs text-white/40 mb-2">评估依据</div>
              <div className="space-y-1.5">
                {[
                  { icon: '📊', text: `历史热度模型：${state.tier === 'hot' ? '超高流量匹配' : state.tier === 'normal' ? '中等流量匹配' : '低流量匹配'}` },
                  { icon: '✅', text: `用户准备状态：${state.prepareScore >= 75 ? '已充分准备' : state.prepareScore >= 50 ? '部分准备' : '准备不足'}` },
                  { icon: '🌐', text: `网络环境预测：${state.networkLatency}ms 延迟` },
                  { icon: '🎫', text: `票档竞争分析：${state.tier === 'hot' ? '中档票竞争最低' : state.tier === 'normal' ? '各档位均衡' : '无竞争压力'}` },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="text-xs text-white/60 flex items-center gap-2"
                  >
                    <span>{item.icon}</span>
                    {item.text}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 底部按钮 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 flex justify-center"
      >
        <GlowButton
          variant="purple"
          size="lg"
          disabled={phase !== 'done'}
          onClick={() => dispatch({ type: 'GO_PAGE', payload: 'prepare' })}
        >
          {phase === 'done' ? '▶ 继续准备优化' : '推演中...'}
        </GlowButton>
      </motion.div>
    </Layout>
  )
}

// 打字机动画组件
function TypeWriter({
  text,
  color,
  delay = 40,
  startDelay = 0,
}: {
  text: string
  color?: string
  delay?: number
  startDelay?: number
}) {
  const [display, setDisplay] = useState('')
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    let idx = 0
    const startTimer = setTimeout(() => {
      const timer = setInterval(() => {
        idx += 1
        setDisplay(text.slice(0, idx))
        if (idx >= text.length) clearInterval(timer)
      }, delay)
    }, startDelay)
    return () => clearTimeout(startTimer)
  }, [text, delay, startDelay])

  return (
    <div className="flex items-center gap-2">
      <span style={{ color }}>{display}</span>
      {display.length < text.length && (
        <motion.span
          className="w-0.5 h-4 bg-neon-green"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </div>
  )
}
