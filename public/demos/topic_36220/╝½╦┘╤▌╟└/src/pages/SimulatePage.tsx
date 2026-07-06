import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'

type Stage = 'countdown' | 'queue' | 'stuck' | 'ai' | 'rush' | 'done'

interface LogEntry {
  time: string
  text: string
  type: 'info' | 'warn' | 'error' | 'success' | 'ai'
}

export default function SimulatePage() {
  const { state, dispatch } = useApp()
  const [stage, setStage] = useState<Stage>('countdown')
  const [countdown, setCountdown] = useState(3)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [queueCount, setQueueCount] = useState(0)
  const [showAI, setShowAI] = useState(false)
  const [showScanLine, setShowScanLine] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  const success = state.optimizationCount >= 3

  const addLog = (text: string, type: LogEntry['type']) => {
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0').slice(0, 3)}`
    setLogs((prev) => [...prev, { time, text, type }])
  }

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // ============ 阶段1：倒计时 ============
  useEffect(() => {
    if (stage !== 'countdown') return
    addLog(`准备模拟购票：${state.concertName}`, 'info')
    addLog(`当前成功率：${state.successRate}%`, 'info')
    addLog(`网络延迟：${state.networkLatency}ms`, 'info')

    let n = 3
    setCountdown(3)
    const timer = setInterval(() => {
      n -= 1
      if (n <= 0) {
        clearInterval(timer)
        addLog('🚀 开抢！', 'success')
        setStage('queue')
      } else {
        setCountdown(n)
      }
    }, 800)
    return () => clearInterval(timer)
  }, [stage])

  // ============ 阶段2：排队 + 卡住 ============
  useEffect(() => {
    if (stage !== 'queue') return
    addLog('已加入模拟购票队列...', 'info')

    let p = 0
    let q = 0
    const queueTimer = setInterval(() => {
      p += Math.random() * 8 + 3
      q += Math.floor(Math.random() * 8000 + 3000)
      if (p > 65) p = 65
      if (q > 150000) q = 150000 + Math.floor(Math.random() * 5000)
      setProgress(p)
      setQueueCount(q)

      if (p >= 65 && q >= 150000) {
        clearInterval(queueTimer)
        addLog('⚠ 检测到排队人数 150,000+！', 'warn')
        addLog('⚠ 华东节点严重拥堵！', 'error')
        addLog('⚠ 服务器响应超时', 'error')
        setStage('stuck')
      }
    }, 200)
    return () => clearInterval(queueTimer)
  }, [stage])

  // ============ 阶段3：卡住 → AI 介入 ============
  useEffect(() => {
    if (stage !== 'stuck') return
    const t1 = setTimeout(() => {
      addLog('🔍 检测到模拟购票异常', 'warn')
    }, 600)
    const t2 = setTimeout(() => {
      setShowAI(true)
      setShowScanLine(true)
      addLog('🤖 AI 动态策略启动', 'ai')
      addLog('🔄 正在切换 BGP 智能专线...', 'ai')
      setStage('ai')
    }, 1400)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [stage])

  // ============ 阶段4：AI 介入 → 冲刺 ============
  useEffect(() => {
    if (stage !== 'ai') return
    const t1 = setTimeout(() => addLog('✓ 华南 BGP 专线已切换', 'ai'), 500)
    const t2 = setTimeout(() => addLog('✓ 正在重新分配最优路径', 'ai'), 1000)
    const t3 = setTimeout(() => {
      addLog('⚡ 加速冲刺中...', 'success')
      setStage('rush')
    }, 1600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [stage])

  // ============ 阶段5：冲刺到 100% ============
  useEffect(() => {
    if (stage !== 'rush') return
    let p = 65
    const rushTimer = setInterval(() => {
      p += Math.random() * 12 + 6
      if (p >= 100) {
        p = 100
        setProgress(100)
        clearInterval(rushTimer)
        addLog(success ? '✓ 模拟购票成功！' : '✗ 模拟购票失败...', success ? 'success' : 'error')
        setTimeout(() => {
          dispatch({ type: 'SET_RESULT', payload: success ? 'success' : 'fail' })
          dispatch({ type: 'GO_PAGE', payload: 'result' })
        }, 800)
      } else {
        setProgress(p)
      }
    }, 150)
    return () => clearInterval(rushTimer)
  }, [stage])

  const stageLabel = {
    countdown: '准备开抢',
    queue: '排队中',
    stuck: '服务器拥堵',
    ai: 'AI 介入',
    rush: '极速冲刺',
    done: '完成',
  }[stage]

  const isDanger = stage === 'stuck'
  const isAIActive = stage === 'ai' || stage === 'rush'

  return (
    <motion.div
      className="relative min-h-screen grid-bg flex flex-col overflow-hidden"
      animate={
        isDanger
          ? {
              x: [0, -4, 4, -4, 4, 0],
            }
          : {}
      }
      transition={{ duration: 0.4, repeat: isDanger ? Infinity : 0, repeatDelay: 0.2 }}
    >
      {/* 全屏红色闪光 */}
      <AnimatePresence>
        {isDanger && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, repeat: Infinity }}
            className="fixed inset-0 pointer-events-none z-50"
            style={{ background: 'radial-gradient(circle at center, rgba(255,61,90,0.5), transparent 70%)' }}
          />
        )}
      </AnimatePresence>

      {/* 绿色扫描线 - AI 介入时 */}
      <AnimatePresence>
        {showScanLine && (
          <motion.div
            initial={{ top: '-10%', opacity: 0 }}
            animate={{ top: '110%', opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="fixed left-0 right-0 h-1 pointer-events-none z-50"
            style={{
              background: 'linear-gradient(90deg, transparent, #00FF9D, transparent)',
              boxShadow: '0 0 40px #00FF9D, 0 0 80px #00FF9D80',
            }}
          />
        )}
      </AnimatePresence>

      {/* 顶部状态 */}
      <div className="relative z-10 px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className={`w-8 h-8 rounded-full border-2 ${isAIActive ? 'border-neon-green border-t-transparent' : isDanger ? 'border-neon-red border-t-transparent' : 'border-neon-green border-t-transparent'}`}
          />
          <div>
            <div className={`font-bold ${isDanger ? 'text-neon-red text-glow-red' : 'text-neon-green text-glow-green'}`}>模拟购票流程</div>
            <div className="text-[10px] text-white/40">{state.concertName} · {state.city}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-white/40">阶段：</span>
            <span className={`font-bold ${isDanger ? 'text-neon-red' : isAIActive ? 'text-neon-green' : 'text-neon-green'}`}>{stageLabel}</span>
          </div>
          <div>
            <span className="text-white/40">优化次数：</span>
            <span className="text-neon-purple font-bold">{state.optimizationCount}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative z-10 px-6 py-8 max-w-6xl mx-auto w-full grid md:grid-cols-3 gap-6">
        {/* 左：主进度区 */}
        <div className="md:col-span-2 space-y-6">
          {/* 倒计时 */}
          <AnimatePresence>
            {stage === 'countdown' && (
              <motion.div
                key="countdown"
                exit={{ opacity: 0, scale: 1.5 }}
                className="glass-strong glow-border-green p-12 flex flex-col items-center justify-center min-h-[400px]"
              >
                <div className="text-white/40 text-sm tracking-widest mb-4">距离开抢</div>
                <motion.div
                  key={countdown}
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="text-[180px] font-black leading-none text-glow-green"
                  style={{ color: '#00FF9D' }}
                >
                  {countdown}
                </motion.div>
                <div className="text-white/40 text-sm tracking-widest mt-4">秒</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 排队进度 */}
          {stage !== 'countdown' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-strong p-8 relative overflow-hidden ${isDanger ? 'glow-border-red' : isAIActive ? 'glow-border-green' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isDanger && (
                    <motion.div
                      animate={{ opacity: [1, 0.2, 1], scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="text-neon-red text-2xl"
                    >
                      🚨
                    </motion.div>
                  )}
                  {isAIActive && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 rounded-full border-2 border-neon-green border-t-transparent"
                    />
                  )}
                  <h2 className="text-xl font-bold">
                    {stage === 'stuck' ? (
                      <span className="text-neon-red text-glow-red">⚠ 服务器拥堵</span>
                    ) : stage === 'ai' || stage === 'rush' ? (
                      <span className="text-neon-green text-glow-green">⚡ AI 加速中</span>
                    ) : (
                      <span className="text-neon-blue">排队中</span>
                    )}
                  </h2>
                </div>
                <div className="text-3xl font-black">
                  <motion.span
                    key={Math.floor(progress)}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className={
                      stage === 'stuck' ? 'text-neon-red' : stage === 'rush' ? 'text-neon-green' : 'text-white'
                    }
                  >
                    {Math.floor(progress)}%
                  </motion.span>
                </div>
              </div>

              {/* 进度条 */}
              <div className="relative h-6 bg-bg-deep rounded-full overflow-hidden border border-white/5">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background:
                      stage === 'stuck'
                        ? 'linear-gradient(90deg, #FF3D5A, #FF2D95)'
                        : stage === 'ai' || stage === 'rush'
                        ? 'linear-gradient(90deg, #00FF9D, #00D4FF)'
                        : 'linear-gradient(90deg, #00D4FF, #B026FF)',
                    boxShadow:
                      stage === 'stuck'
                        ? '0 0 20px rgba(255,61,90,0.6)'
                        : '0 0 20px rgba(0,255,157,0.6)',
                  }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2 }}
                />
                {/* 卡住时的抖动效果 */}
                {isDanger && (
                  <motion.div
                    className="absolute inset-0 bg-neon-red/20"
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                  />
                )}
              </div>

              {/* 排队人数 */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="text-white/50">
                  排队人数：
                  <span
                    className={`font-mono font-bold ml-1 ${
                      queueCount > 100000 ? 'text-neon-red text-glow-red' : 'text-neon-yellow'
                    }`}
                  >
                    {queueCount.toLocaleString()}
                  </span>
                </div>
                <div className="text-white/50">
                  {stage === 'stuck' ? (
                    <span className="text-neon-red font-bold">⚠ 检测到排队人数 150000+ · 华东节点严重拥堵</span>
                  ) : stage === 'rush' ? (
                    <span className="text-neon-green font-bold">⚡ 极速冲刺</span>
                  ) : (
                    <span className="text-neon-blue">处理中...</span>
                  )}
                </div>
              </div>

              {/* 危险警告条 */}
              <AnimatePresence>
                {isDanger && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-3 rounded-lg bg-neon-red/10 border border-neon-red/30 flex items-center gap-3"
                  >
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="text-neon-red text-xl"
                    >
                      🚨
                    </motion.span>
                    <div>
                      <div className="text-neon-red font-bold text-sm">华东节点严重拥堵</div>
                      <div className="text-white/50 text-xs">检测到排队人数 150000+，常规通道已瘫痪</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* AI 介入弹窗 */}
          <AnimatePresence>
            {showAI && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="glass-strong glow-border-green p-6 relative overflow-hidden"
              >
                {/* 扫描线 */}
                <motion.div
                  className="absolute left-0 right-0 h-px bg-neon-green"
                  style={{ boxShadow: '0 0 20px #00FF9D' }}
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 rounded-full border-2 border-neon-green border-t-transparent"
                  />
                  <div>
                    <div className="font-bold text-neon-green text-glow-green">AI 动态策略已启动</div>
                    <div className="text-[10px] text-white/40">正在切换 BGP 智能专线 · 重新分配最优路径</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { k: '华东 BGP', v: '已切换', c: '#00FF9D' },
                    { k: '拥堵节点', v: '已避开', c: '#00D4FF' },
                    { k: '请求并发', v: '×3', c: '#B026FF' },
                  ].map((x) => (
                    <div key={x.k} className="p-2 rounded-lg bg-white/5 border border-white/5 text-center">
                      <div className="text-white/40 text-[10px]">{x.k}</div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-bold" style={{ color: x.c }}
                      >
                        {x.v}
                      </motion.div>
                    </div>
                  ))}
                </div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: 'linear' }}
                  className="mt-3 h-1 bg-gradient-to-r from-neon-green to-neon-blue rounded-full"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 右：运行日志 */}
        <div className="glass p-4 flex flex-col h-[500px]">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
            <motion.span
              className={`w-2 h-2 rounded-full ${isDanger ? 'bg-neon-red' : 'bg-neon-green'}`}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-sm font-bold">运行日志</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-xs">
            <AnimatePresence>
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2"
                >
                  <span className="text-white/30 shrink-0">{log.time}</span>
                  <span
                    className={
                      log.type === 'success'
                        ? 'text-neon-green'
                        : log.type === 'error'
                        ? 'text-neon-red'
                        : log.type === 'warn'
                        ? 'text-neon-yellow'
                        : log.type === 'ai'
                        ? 'text-neon-purple'
                        : 'text-white/60'
                    }
                  >
                    {log.text}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}