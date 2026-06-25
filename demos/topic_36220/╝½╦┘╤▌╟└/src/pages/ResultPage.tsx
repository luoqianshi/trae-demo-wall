import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import GlowButton from '../components/GlowButton'
import AnimatedNumber from '../components/AnimatedNumber'
import { useApp, TIER_INFO } from '../context/AppContext'

export default function ResultPage() {
  const { state, dispatch } = useApp()
  const success = state.finalResult === 'success'
  const info = TIER_INFO[state.tier]
  const [showPoster, setShowPoster] = useState(false)

  const handleRestart = () => {
    dispatch({ type: 'RESET' })
  }

  const initialSuccessRate = Math.round((1 - state.hotWeight) * 100)
  const initialLatency = state.tier === 'hot' ? 180 : state.tier === 'normal' ? 120 : 80

  // 金句
  const goldenQuote = success
    ? '不是运气更好，而是准备更充分。'
    : '抢票拼的不只是手速，更是提前准备。'

  // 成功数据
  const successData = {
    duration: 0.42,
    beatPercent: 99,
    ticketTier: state.tier === 'hot' ? '内场 VIP ¥2080' : state.tier === 'normal' ? '看台 A ¥780' : '普通席 ¥380',
    summary: [
      `凭借 ${state.optimizationCount} 次 AI 优化，将成功率从初始 ${initialSuccessRate}% 提升至 ${state.successRate}%`,
      `网络延迟优化至 ${state.networkLatency}ms，比平均用户快 ${Math.round(((initialLatency - state.networkLatency) / initialLatency) * 100)}%`,
      `AI BGP 专线在排队拥堵时成功介入，0.42 秒完成下单`,
    ],
  }

  // 失败数据
  const failData = {
    duration: 8.5,
    reason: state.optimizationCount === 0 ? '未进行任何 AI 优化' : `仅优化 ${state.optimizationCount} 项，未达到 3 项成功阈值`,
    analysis: [
      `准备度仅 ${state.prepareScore}/100，远低于成功所需的 75+`,
      `网络延迟 ${state.networkLatency}ms，在拥堵时无法及时响应`,
      `成功率仅 ${state.successRate}%，AI BGP 介入后仍无法突破排队队列`,
      `优化次数 ${state.optimizationCount} < 3，AI 策略未能完全生效`,
    ],
  }

  // 关键原因
  const keyReasons = [
    state.checklist.realName ? '完成实名认证' : '未完成实名认证',
    state.checklist.payment ? '提前绑定支付方式' : '未绑定支付方式',
    state.checklist.audience ? '预填观演人信息' : '未预填观演人信息',
    state.checklist.network ? '启用 AI 网络加速' : '未启用网络加速',
  ]

  return (
    <Layout step={5}>
      {/* 顶部结果横幅 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={`relative glass-strong p-8 mb-6 text-center overflow-hidden ${
          success ? 'glow-border-green' : 'glow-border-red'
        }`}
      >
        {/* 背景光效 */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: success
              ? 'radial-gradient(circle at center, rgba(0,255,157,0.4), transparent 70%)'
              : 'radial-gradient(circle at center, rgba(255,61,90,0.4), transparent 70%)',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="text-7xl mb-4"
          >
            {success ? '🎉' : '💔'}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-5xl font-black mb-2 ${
              success ? 'text-neon-green text-glow-green' : 'text-neon-red text-glow-red'
            }`}
          >
            {success ? '模拟成功' : '模拟失败'}
          </motion.h1>

          {/* 金句 */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className={`text-lg font-medium mb-3 ${success ? 'text-neon-green/80' : 'text-neon-red/80'}`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            "{goldenQuote}"
          </motion.p>

          {/* AI 总结金句 */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`text-sm font-bold mt-1 ${
              success ? 'text-neon-green' : 'text-neon-red'
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {success
              ? 'AI判断：你的成功并非来自运气，而是来自充分准备。'
              : 'AI判断：抢票拼的不只是手速，更是提前规划与配置。'}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/60 text-sm"
          >
            {success
              ? `耗时 ${successData.duration} 秒 · 击败 ${successData.beatPercent}% 用户`
              : `卡死在排队队列 · 耗时 ${failData.duration} 秒`}
          </motion.p>
        </div>
      </motion.div>

      {/* AI 价值总结 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`glass p-6 mb-6 ${success ? 'border-neon-green/20' : 'border-neon-red/20'}`}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-1 h-5 rounded-full ${success ? 'bg-neon-green' : 'bg-neon-red'}`} />
          <h2 className="text-lg font-bold">本次模拟价值总结</h2>
        </div>
        <p className={`text-sm leading-relaxed ${success ? 'text-neon-green/80' : 'text-neon-red/80'}`}>
          {success
            ? '本次模拟表明：充分准备与合理策略，能够显著提升购票成功概率。'
            : '本次模拟表明：忽略关键准备环节，将大幅降低购票成功概率。'}
        </p>
      </motion.div>

      {/* 仪表盘 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass p-6 mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-1 h-5 rounded-full ${success ? 'bg-neon-green' : 'bg-neon-red'}`} />
          <h2 className="text-lg font-bold">AI 复盘数据</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-blue/20 text-neon-blue border border-neon-blue/40">
            科技风
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 md:gap-8 justify-items-center">
          <DashboardGauge
            label="演唱会热度"
            value={state.hotWeight * 100}
            max={100}
            suffix="%"
            color={info.color}
            desc={info.label}
          />
          <DashboardGauge
            label="准备度评分"
            value={state.prepareScore}
            max={100}
            suffix="分"
            color="#00FF9D"
            desc={state.prepareScore >= 75 ? '优秀' : state.prepareScore >= 50 ? '一般' : '不足'}
          />
          <DashboardGauge
            label="最终成功率"
            value={state.successRate}
            max={100}
            suffix="%"
            color="#B026FF"
            desc={state.successRate >= 50 ? '较高' : '偏低'}
          />
        </div>
      </motion.div>

      {/* 主体内容 */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* 左：核心数据 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-1 h-5 rounded-full ${success ? 'bg-neon-green' : 'bg-neon-red'}`} />
            <h2 className="text-lg font-bold">{success ? '战报' : '失败原因分析'}</h2>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <DataBox label="下单耗时" value={successData.duration} suffix="s" color="#00FF9D" />
                <DataBox label="击败用户" value={successData.beatPercent} suffix="%" color="#B026FF" />
                <DataBox label="最终成功率" value={state.successRate} suffix="%" color="#00D4FF" />
                <DataBox label="网络延迟" value={state.networkLatency} suffix="ms" color="#FFE600" />
              </div>

              <div className="p-4 rounded-lg bg-neon-green/5 border border-neon-green/20">
                <div className="text-xs text-white/40 mb-1">🎯 推荐票档</div>
                <div className="text-neon-green font-bold">{successData.ticketTier}</div>
                <div className="text-[10px] text-white/40 mt-1">AI 根据热度与成功率智能推荐</div>
              </div>

              <div>
                <div className="text-xs text-white/40 mb-2">📋 AI 总结</div>
                <div className="space-y-2">
                  {successData.summary.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="text-xs p-2 rounded bg-white/5 text-white/70"
                    >
                      ✓ {s}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-neon-red/5 border border-neon-red/20">
                <div className="text-xs text-white/40 mb-1">⚠ 核心原因</div>
                <div className="text-neon-red font-bold text-sm">{failData.reason}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <DataBox label="准备度" value={state.prepareScore} suffix="/100" color="#FF3D5A" />
                <DataBox label="成功率" value={state.successRate} suffix="%" color="#FF3D5A" />
                <DataBox label="网络延迟" value={state.networkLatency} suffix="ms" color="#FF3D5A" />
                <DataBox label="优化次数" value={state.optimizationCount} suffix="/3" color="#FF3D5A" />
              </div>

              <div>
                <div className="text-xs text-white/40 mb-2">🔍 失败分析</div>
                <div className="space-y-2">
                  {failData.analysis.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="text-xs p-2 rounded bg-white/5 text-white/70"
                    >
                      ✗ {s}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* 右：AI 复盘报告 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass glow-border-purple p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-neon-purple rounded-full" />
            <h2 className="text-lg font-bold">AI 复盘报告</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/40">
              专业版
            </span>
          </div>

          <div className="space-y-3">
            <ReportRow
              label="演唱会热度"
              from={`${initialSuccessRate}% 初始成功率`}
              to={`${(state.hotWeight * 100).toFixed(0)}% 热度权重`}
              color={info.color}
            />
            <ReportRow
              label="准备度评分"
              from="0 分"
              to={`${state.prepareScore} 分`}
              color="#00FF9D"
            />
            <ReportRow
              label="网络优化"
              from={`${initialLatency}ms`}
              to={`${state.networkLatency}ms`}
              color="#00D4FF"
              improved
            />
            <ReportRow
              label="成功率变化"
              from={`${initialSuccessRate}%`}
              to={`${state.successRate}%`}
              color="#B026FF"
              improved
            />
            <ReportRow
              label="AI 优化次数"
              from="0 次"
              to={`${state.optimizationCount} 次`}
              color="#FFE600"
            />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className={`p-3 rounded-lg border ${
                success
                  ? 'bg-neon-green/10 border-neon-green/30'
                  : 'bg-neon-red/10 border-neon-red/30'
              }`}
            >
              <div className="text-xs text-white/40 mb-1">最终结局</div>
              <div className={`text-xl font-black ${success ? 'text-neon-green' : 'text-neon-red'}`}>
                {success ? '✓ 模拟成功' : '✗ 模拟失败'}
              </div>
            </motion.div>

            <div>
              <div className="text-xs text-white/40 mb-2">关键原因</div>
              <div className="space-y-1.5">
                {keyReasons.map((reason, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.08 }}
                    className={`text-xs flex items-center gap-2 ${
                      reason.startsWith('完成') || reason.startsWith('提前') || reason.startsWith('预填') || reason.startsWith('启用')
                        ? 'text-neon-green'
                        : 'text-white/40'
                    }`}
                  >
                    <span>
                      {reason.startsWith('完成') || reason.startsWith('提前') || reason.startsWith('预填') || reason.startsWith('启用')
                        ? '✓'
                        : '✗'}
                    </span>
                    {reason}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI 下一步建议 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass glow-border-green p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 rounded-full border-2 border-neon-green border-t-transparent"
            />
            <h2 className="text-lg font-bold text-neon-green">AI 下一步建议</h2>
          </div>

          {success ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-neon-green/5 border border-neon-green/20">
                <div className="text-xs text-white/40 mb-1">📋 策略评估</div>
                <div className="text-sm text-white/80">当前策略表现优秀，建议保留当前配置。</div>
              </div>
              <div className="p-3 rounded-lg bg-neon-green/5 border border-neon-green/20">
                <div className="text-xs text-white/40 mb-1">📈 预测</div>
                <div className="text-sm text-white/80">
                  预计下次场景成功率：
                  <span className="text-neon-green font-bold text-lg ml-1">
                    <AnimatedNumber value={82} suffix="%" duration={1200} color="#00FF9D" />
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-neon-yellow/5 border border-neon-yellow/20">
                <div className="text-xs text-white/40 mb-1">⚠ 优化建议</div>
                <div className="space-y-1.5">
                  {!state.checklist.realName && (
                    <div className="text-xs text-white/70 flex items-center gap-2">
                      <span className="text-neon-yellow">▸</span> 完成实名认证
                    </div>
                  )}
                  {!state.checklist.network && (
                    <div className="text-xs text-white/70 flex items-center gap-2">
                      <span className="text-neon-yellow">▸</span> 开启网络优化
                    </div>
                  )}
                  {!state.checklist.payment && (
                    <div className="text-xs text-white/70 flex items-center gap-2">
                      <span className="text-neon-yellow">▸</span> 增加备用支付方式
                    </div>
                  )}
                  {!state.checklist.audience && (
                    <div className="text-xs text-white/70 flex items-center gap-2">
                      <span className="text-neon-yellow">▸</span> 预填观演人信息
                    </div>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-neon-green/5 border border-neon-green/20">
                <div className="text-xs text-white/40 mb-1">📈 预测</div>
                <div className="text-sm text-white/80">
                  预计可提升成功率：
                  <span className="text-neon-green font-bold text-lg ml-1">
                    <AnimatedNumber value={35} suffix="%" duration={1200} color="#00FF9D" />
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* 底部按钮 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex justify-center gap-4"
      >
        <GlowButton variant="green" size="lg" onClick={handleRestart}>
          ↻ 重新开始（重置全部状态）
        </GlowButton>
        <GlowButton variant="purple" size="lg" onClick={() => setShowPoster(true)}>
          🏆 生成战绩海报
        </GlowButton>
      </motion.div>

      {/* 战绩海报弹窗 */}
      <AnimatePresence>
        {showPoster && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPoster(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-[380px] rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0a0c14 0%, #141820 50%, #0a0c14 100%)',
                border: '2px solid rgba(176,38,255,0.5)',
                boxShadow: '0 0 60px rgba(176,38,255,0.3), 0 0 120px rgba(0,255,157,0.15)',
              }}
            >
              {/* 装饰 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-purple via-neon-green to-neon-blue" />
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-blue via-neon-green to-neon-purple" />

              <div className="p-8">
                {/* 标题 */}
                <div className="text-center mb-6">
                  <div className="text-[10px] tracking-[0.3em] text-neon-purple mb-2">FASTTICKET AI · 战绩海报</div>
                  <div className="text-2xl font-black tracking-wider">
                    <span className="shimmer-text">极速演抢</span>
                  </div>
                </div>

                {/* 核心信息 */}
                <div className="glass p-4 mb-4">
                  <div className="text-xs text-white/40 mb-1">演唱会</div>
                  <div className="text-sm font-bold text-white truncate">{state.concertName || '—'}</div>
                  <div className="text-[10px] text-white/30 mt-1">{state.city} · {state.ticketTime}</div>
                </div>

                {/* 数据网格 */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="glass p-3 text-center">
                    <div className="text-[10px] text-white/40 mb-1">热度等级</div>
                    <div className="text-lg font-black" style={{ color: info.color }}>{info.label}</div>
                  </div>
                  <div className="glass p-3 text-center">
                    <div className="text-[10px] text-white/40 mb-1">成功率</div>
                    <div className="text-lg font-black text-neon-purple">{state.successRate}%</div>
                  </div>
                  <div className="glass p-3 text-center">
                    <div className="text-[10px] text-white/40 mb-1">准备度</div>
                    <div className="text-lg font-black text-neon-green">{state.prepareScore}/100</div>
                  </div>
                  <div className="glass p-3 text-center">
                    <div className="text-[10px] text-white/40 mb-1">优化次数</div>
                    <div className="text-lg font-black" style={{ color: '#FFE600' }}>{state.optimizationCount}次</div>
                  </div>
                </div>

                {/* 结果 */}
                <div className={`glass-strong p-4 text-center mb-4 ${success ? 'glow-border-green' : 'glow-border-red'}`}>
                  <div className="text-[10px] text-white/40 mb-1">最终结果</div>
                  <div className={`text-2xl font-black ${success ? 'text-neon-green text-glow-green' : 'text-neon-red text-glow-red'}`}>
                    {success ? '🎉 模拟成功' : '💔 模拟失败'}
                  </div>
                </div>

                {/* 时间戳 */}
                <div className="text-center text-[10px] text-white/20 font-mono">
                  {new Date().toLocaleString('zh-CN')} · FastTicket AI
                </div>
              </div>

              {/* 关闭按钮 */}
              <button
                onClick={() => setShowPoster(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-6 text-center text-xs text-white/30"
      >
        {success
          ? '💡 试试选择更热门的场景，或减少优化次数，看看结局如何变化'
          : '💡 回到准备页，至少优化 3 项，再体验模拟成功的反馈'}
      </motion.div>
    </Layout>
  )
}

// ============ 子组件 ============
function DataBox({
  label,
  value,
  suffix,
  color,
}: {
  label: string
  value: number
  suffix: string
  color: string
}) {
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
      <div className="text-[10px] text-white/40 mb-1">{label}</div>
      <div className="text-xl font-black">
        <AnimatedNumber value={value} suffix={suffix} color={color} duration={1200} />
      </div>
    </div>
  )
}

function DashboardGauge({
  label,
  value,
  max,
  suffix,
  color,
  desc,
}: {
  label: string
  value: number
  max: number
  suffix: string
  color: string
  desc: string
}) {
  const pct = Math.min(100, (value / max) * 100)
  const r = 48
  const c = 2 * Math.PI * r
  return (
    <div className="relative w-32 h-32 md:w-36 md:h-36 flex flex-col items-center">
      <div className="relative w-full h-full">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
          <motion.circle
            cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - pct / 100) }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 10px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatedNumber value={value} suffix={suffix} className="text-2xl font-black" color={color} duration={1500} />
          <div className="text-[9px] text-white/40 tracking-wider mt-0.5">{label}</div>
        </div>
      </div>
      <div className="text-[10px] mt-1 px-2 py-0.5 rounded-full" style={{ color, background: `${color}15`, border: `1px solid ${color}40` }}>
        {desc}
      </div>
    </div>
  )
}

function ReportRow({
  label,
  from,
  to,
  color,
  improved,
}: {
  label: string
  from: string
  to: string
  color: string
  improved?: boolean
}) {
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
      <div className="text-xs text-white/40 mb-2">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-white/30 line-through text-xs">{from}</span>
        <span className="text-white/30 text-xs">→</span>
        <motion.span
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-bold text-sm"
          style={{ color }}
        >
          {to}
        </motion.span>
        {improved && <span className="text-[10px] text-neon-green">↘ 优化</span>}
      </div>
    </div>
  )
}