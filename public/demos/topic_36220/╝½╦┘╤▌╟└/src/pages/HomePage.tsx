import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import GlowButton from '../components/GlowButton'
import AnimatedNumber from '../components/AnimatedNumber'
import { useApp, TIER_INFO, ConcertTier } from '../context/AppContext'
import { Concert, FUTURE_CONCERTS, getRandomConcerts } from '../data/concerts'

const CITIES = ['北京', '上海', '广州', '深圳', '成都', '杭州', '武汉', '南京']

export default function HomePage() {
  const { dispatch } = useApp()
  const [name, setName] = useState('')
  const [city, setCity] = useState('上海')
  const [ticketTime, setTicketTime] = useState('2026-07-01 20:00')
  const [selectedConcert, setSelectedConcert] = useState<Concert | null>(null)
  const [displayConcerts, setDisplayConcerts] = useState<Concert[]>(() => getRandomConcerts(6))

  const handleConcertPick = (concert: Concert) => {
    setName(concert.concertName)
    setCity(concert.city)
    setTicketTime(`${concert.date} 20:00`)
    setSelectedConcert(concert)
    dispatch({
      type: 'SET_CONCERT',
      payload: {
        name: concert.concertName,
        city: concert.city,
        ticketTime: `${concert.date} 20:00`,
        tier: concert.tier,
        hotWeight: concert.hotWeight,
      },
    })
  }

  const handleRefresh = () => {
    setDisplayConcerts(getRandomConcerts(6))
    setSelectedConcert(null)
  }

  const handleStart = () => {
    if (!name.trim()) return
    let tier: ConcertTier = 'normal'
    const lower = name.toLowerCase()
    if (/周杰伦|五月天|taylor swift|泰勒|林俊杰|薛之谦|邓紫棋|blackpink|陈奕迅|华晨宇/i.test(name)) {
      tier = 'hot'
    } else if (/livehouse|独立|小众|民谣|爵士|落日|棱镜|草东|deca|康士坦/i.test(name)) {
      tier = 'cold'
    }
    const hotWeight = TIER_INFO[tier].hotWeight
    dispatch({
      type: 'SET_CONCERT',
      payload: { name: name.trim(), city, ticketTime, tier, hotWeight },
    })
    dispatch({ type: 'GO_PAGE', payload: 'analysis' })
  }

  // 热度预测数据
  const predictionData = useMemo(() => {
    if (!selectedConcert) return null
    const info = TIER_INFO[selectedConcert.tier]
    const successRate = Math.round((1 - selectedConcert.hotWeight) * 100)
    const stars = selectedConcert.tier === 'hot' ? 5 : selectedConcert.tier === 'normal' ? 3 : 1
    return {
      expectedUsers: selectedConcert.expectedUsers,
      successRate,
      stars,
      tier: info.label,
      color: info.color,
      desc: info.desc,
    }
  }, [selectedConcert])

  return (
    <Layout step={1}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <div className="inline-block px-3 py-1 rounded-full glass border border-neon-green/30 text-xs text-neon-green mb-4 tracking-widest">
          AI 购票策略实验室
        </div>
        <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight">
          <span className="shimmer-text">FastTicket AI</span>
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-white/80 mb-4">
          AI购票策略实验室
        </h2>
        <p className="text-white/50 text-base max-w-2xl mx-auto leading-relaxed">
          通过不同热度场景模拟购票过程
        </p>
        <p className="text-white/40 text-sm mt-2 max-w-2xl mx-auto leading-relaxed">
          体验AI如何帮助用户提升购票成功率
        </p>
        <p className="text-neon-green/70 text-sm mt-4 tracking-wide">
          ↓ 选择一个模拟场景，开始体验 ↓
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 左侧：输入表单 + AI 预测面板 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="glass glow-border-green p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-5 bg-neon-green rounded-full" />
              <h2 className="text-lg font-bold tracking-wide">模拟场景信息</h2>
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-2 tracking-wider">场景名称</label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setSelectedConcert(null)
                }}
                placeholder="输入或选择模拟场景名称"
                className="w-full bg-bg-deep/60 border border-white/10 focus:border-neon-green focus:shadow-neon-green rounded-lg px-4 py-3 text-white placeholder-white/30 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-2 tracking-wider">城市</label>
              <div className="grid grid-cols-4 gap-2">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      city === c
                        ? 'bg-neon-green/20 text-neon-green border border-neon-green/50 shadow-neon-green'
                        : 'glass text-white/60 border border-white/5 hover:border-white/20'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-2 tracking-wider">开票时间</label>
              <input
                value={ticketTime}
                onChange={(e) => setTicketTime(e.target.value)}
                placeholder="如 2026-07-01 20:00"
                className="w-full bg-bg-deep/60 border border-white/10 focus:border-neon-green focus:shadow-neon-green rounded-lg px-4 py-3 text-white placeholder-white/30 outline-none transition-all font-mono"
              />
            </div>

            <GlowButton
              variant="green"
              size="lg"
              fullWidth
              disabled={!name.trim()}
              onClick={handleStart}
            >
              ▶ 开始 AI 策略推演
            </GlowButton>
          </div>

          {/* AI 热度预测面板 */}
          <AnimatePresence mode="wait">
            {predictionData ? (
              <motion.div
                key="prediction"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass glow-border-purple p-5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 opacity-10"
                  style={{ background: `radial-gradient(circle, ${predictionData.color}, transparent 70%)` }} />
                <div className="flex items-center gap-2 mb-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 rounded-full border-2 border-neon-purple border-t-transparent"
                  />
                  <h2 className="text-lg font-bold text-neon-purple">AI 场景热度推演</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="text-[10px] text-white/40 mb-1 tracking-wider">模拟参与人数</div>
                    <div className="text-xl font-black">
                      <AnimatedNumber value={predictionData.expectedUsers} suffix=" 人" color={predictionData.color} duration={1200} />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="text-[10px] text-white/40 mb-1 tracking-wider">场景成功率预测</div>
                    <div className="text-xl font-black">
                      <AnimatedNumber value={predictionData.successRate} suffix="%" color={predictionData.successRate >= 50 ? '#00FF9D' : '#FF3D5A'} duration={1200} />
                    </div>
                  </div>
                  <div className="col-span-2 p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="text-[10px] text-white/40 mb-1 tracking-wider">模拟难度</div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black" style={{ color: predictionData.color }}>
                        {predictionData.tier}
                      </span>
                      <DifficultyStars count={predictionData.stars} color={predictionData.color} />
                    </div>
                    <div className="text-[10px] text-white/30 mt-1">{predictionData.desc}</div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass p-5 text-center"
              >
                <div className="text-white/30 text-sm">
                  <motion.span
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    👆 选择下方模拟场景以查看 AI 策略推演
                  </motion.span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 右侧：未来30天演唱会卡片 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-neon-blue rounded-full" />
              <h2 className="text-lg font-bold tracking-wide">热门购票场景</h2>
            </div>
            <GlowButton variant="ghost" size="sm" onClick={handleRefresh}>
              🔄 生成新场景
            </GlowButton>
          </div>

          <div className="text-[10px] text-white/40 leading-relaxed">
            AI 根据不同热度等级构建模拟购票场景，用于演示策略分析与成功率变化。
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-1">
            {displayConcerts.map((concert) => {
              const info = TIER_INFO[concert.tier]
              const isSelected = selectedConcert?.id === concert.id
              const difficultyLabel = concert.tier === 'hot' ? '极难' : concert.tier === 'normal' ? '中等' : '容易'
              const difficultyColor = concert.tier === 'hot' ? '#FF3D5A' : concert.tier === 'normal' ? '#FFE600' : '#00FF9D'
              const predictedSuccess = Math.round((1 - concert.hotWeight) * 100)

              return (
                <motion.button
                  key={concert.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleConcertPick(concert)}
                  className={`p-3 rounded-lg border transition-all text-left relative overflow-hidden ${
                    isSelected
                      ? 'glass-strong border-neon-green/60 shadow-neon-green'
                      : 'glass border-white/5 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{concert.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate leading-tight">{concert.artist}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/40">预计参与人数</span>
                      <span className="text-white/70 font-mono">{concert.expectedUsers >= 10000
                        ? `${(concert.expectedUsers / 10000).toFixed(0)}万`
                        : concert.expectedUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/40">场景热度</span>
                      <span className="font-bold" style={{ color: info.color }}>{info.label}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/40">模拟难度</span>
                      <span className="font-bold" style={{ color: difficultyColor }}>{difficultyLabel}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/40">成功率预测</span>
                      <span className="font-bold" style={{ color: predictedSuccess >= 50 ? '#00FF9D' : '#FF3D5A' }}>
                        {predictedSuccess}%
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <motion.div
                      layoutId="selected-concert"
                      className="absolute inset-0 border-2 border-neon-green rounded-lg pointer-events-none"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>

          <div className="glass p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-neon-purple rounded-full" />
              <h2 className="text-lg font-bold tracking-wide">核心能力</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { icon: '🔥', t: '场景热度分析', d: 'AI 评估竞争强度' },
                { icon: '⚡', t: '准备度优化', d: '4 项准备一键加速' },
                { icon: '🎯', t: '成功率推演', d: '动态计算成功概率' },
                { icon: '🚀', t: '模拟购票流程', d: 'BGP 专线动态介入' },
              ].map((f) => (
                <div key={f.t} className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-lg mb-1">{f.icon}</div>
                  <div className="font-bold text-neon-green">{f.t}</div>
                  <div className="text-white/40 mt-0.5">{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
      {/* 模拟说明提示区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 glass border-white/5 p-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-neon-blue/20 flex items-center justify-center shrink-0 text-neon-blue text-xs">ℹ</div>
          <div>
            <div className="text-xs font-bold text-white/70 mb-1">模拟说明</div>
            <div className="text-[11px] text-white/40 leading-relaxed">
              本项目为 AI 购票策略模拟 Demo。所有场景均为演示用途，不连接真实票务平台，不提供自动抢票功能。
              旨在展示场景热度分析、准备度优化、策略推演、结果复盘等 AI 辅助决策能力。
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  )
}

// 难度星级组件
function DifficultyStars({ count, color }: { count: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: i <= count ? 1 : 0.2, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="text-sm"
          style={{ color: i <= count ? color : '#ffffff20' }}
        >
          ★
        </motion.span>
      ))}
    </div>
  )
}