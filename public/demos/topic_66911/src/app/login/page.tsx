'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login, register, guestLogin } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'
import { User, Lock, Mail, ArrowLeft, Sparkles } from 'lucide-react'

/* 浮动汉字列表 — 用 CSS animation-delay 错开漂移节奏 */
const floatingChars = [
  { char: '筆', top: '12%', left: '8%',  delay: '0s',   size: 'text-3xl',  opacity: 'text-white/[0.06]' },
  { char: '墨', top: '28%', right: '12%', delay: '3s',  size: 'text-4xl',  opacity: 'text-ochre-light/[0.07]' },
  { char: '紙', top: '55%', left: '5%',  delay: '6s',  size: 'text-2xl',  opacity: 'text-white/[0.05]' },
  { char: '簡', top: '72%', right: '8%', delay: '9s',  size: 'text-3xl',  opacity: 'text-ochre-light/[0.06]' },
  { char: '硯', top: '40%', left: '70%', delay: '4.5s', size: 'text-2xl', opacity: 'text-white/[0.04]' },
  { char: '韻', top: '85%', left: '35%', delay: '7.5s', size: 'text-xl',  opacity: 'text-ochre-light/[0.05]' },
]

export default function LoginPage() {
  const router = useRouter()
  const { login: authLogin } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const { token, user } = await login(username, password)
        authLogin(token, user)
        router.push('/app')
      } else {
        const { token, user } = await register(username, password, email || undefined, displayName || undefined)
        authLogin(token, user)
        router.push('/app')
      }
    } catch (err: any) {
      setError(err.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleGuestLogin() {
    setError('')
    setLoading(true)
    try {
      const { token, user } = await guestLogin()
      authLogin(token, user)
      router.push('/app')
    } catch (err: any) {
      setError(err.message || '过客入境未果')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row animate-page-enter">
      {/* ===== 左侧：水墨深色品牌区 ===== */}
      <div
        className="md:w-[45%] bg-ink relative overflow-hidden flex flex-col justify-between p-10 animate-flow-bg"
        style={{
          backgroundImage: `
            linear-gradient(135deg, #1C1816 0%, #2C2420 25%, #1a1512 50%, #2a2018 75%, #1C1816 100%),
            radial-gradient(ellipse 600px 400px at 15% 20%, rgba(139, 94, 60, 0.08) 0%, transparent 70%),
            radial-gradient(ellipse 500px 500px at 85% 60%, rgba(74, 107, 138, 0.06) 0%, transparent 70%),
            radial-gradient(ellipse 400px 300px at 50% 80%, rgba(181, 74, 58, 0.04) 0%, transparent 70%)
          `,
        }}
      >
        {/* ---- 视差深度层 1：最远层 - 大字水印 ---- */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ zIndex: 1 }}>
          <span
            className="font-display text-[220px] leading-none text-white/[0.04]"
            style={{ textShadow: '0 0 120px rgba(196,168,130,0.06)' }}
          >
            書
          </span>
        </div>

        {/* ---- 视差深度层 2：浮动汉字漂移 ---- */}
        {floatingChars.map((item, i) => (
          <span
            key={i}
            className={`absolute pointer-events-none select-none font-serif ${item.size} ${item.opacity} animate-float-in`}
            style={{
              top: item.top,
              ...(item.left ? { left: item.left } : {}),
              ...(item.right ? { right: item.right } : {}),
              zIndex: 2,
              animationDelay: item.delay,
              animationDuration: '12s',
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
              animationTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {item.char}
          </span>
        ))}

        {/* ---- 视差深度层 3：水墨晕染光斑 ---- */}
        <div className="absolute top-[15%] left-[20%] w-36 h-36 rounded-full bg-white/[0.03] blur-2xl animate-float-in pointer-events-none" style={{ zIndex: 3, animationDelay: '1s', animationDuration: '8s', animationIterationCount: 'infinite', animationDirection: 'alternate' }} />
        <div className="absolute top-[55%] right-[15%] w-28 h-28 rounded-full bg-ochre-light/[0.05] blur-xl animate-float-in pointer-events-none" style={{ zIndex: 3, animationDelay: '3s', animationDuration: '10s', animationIterationCount: 'infinite', animationDirection: 'alternate' }} />
        <div className="absolute bottom-[25%] left-[45%] w-24 h-24 rounded-full bg-white/[0.025] blur-lg animate-float-in pointer-events-none" style={{ zIndex: 3, animationDelay: '5s', animationDuration: '9s', animationIterationCount: 'infinite', animationDirection: 'alternate' }} />
        <div className="absolute top-[35%] left-[60%] w-16 h-16 rounded-full bg-ochre-light/[0.03] blur-md animate-float-in pointer-events-none" style={{ zIndex: 3, animationDelay: '7s', animationDuration: '11s', animationIterationCount: 'infinite', animationDirection: 'alternate' }} />

        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25 pointer-events-none" style={{ zIndex: 4 }} />

        {/* ---- 视差深度层 5：前景内容 ---- */}
        {/* 顶部 */}
        <div className="relative flex items-start justify-between" style={{ zIndex: 10 }}>
          <div className="w-14 h-14 border border-ochre-light/20 rounded-lg flex items-center justify-center rotate-3 bg-white/[0.04] shadow-lg shadow-black/20">
            <span className="text-ochre-light/70 text-sm font-serif font-semibold">彩</span>
          </div>
          <div className="writing-vertical text-ochre-light/30 text-xs tracking-[0.3em] font-serif">
            笔墨纸砚间
          </div>
        </div>

        {/* 中部品牌信息 */}
        <div className="relative flex-1 flex flex-col justify-center max-w-sm" style={{ zIndex: 10 }}>
          <h1
            className="font-display text-5xl text-ochre-light tracking-wider mb-5"
            style={{
              textShadow: '0 0 40px rgba(196,168,130,0.25), 0 0 80px rgba(196,168,130,0.1), 0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            彩笺寄
          </h1>

          {/* 金色微光分隔线 */}
          <div
            className="h-[1.5px] mb-5 rounded-full gold-shimmer"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(196,168,130,0.4) 30%, rgba(196,168,130,0.6) 50%, rgba(196,168,130,0.4) 70%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
          />

          <p className="font-serif text-white/50 text-sm leading-[2] tracking-wide">
            智笔绘章，学术写作良伴。以 AI 之力，助阁下规划论文、管理文献、追踪进度，使写作重归思考之本。
          </p>
        </div>

        {/* 底部 */}
        <div className="relative" style={{ zIndex: 10 }}>
          <p className="font-serif text-xs text-white/30 tracking-wider">
            智笔绘章 · 学术写作良伴
          </p>
        </div>
      </div>

      {/* ===== 右侧：表单区 ===== */}
      <div className="flex-1 md:w-[55%] flex flex-col justify-center items-center p-6 sm:p-8 paper-texture relative">
        {/* 水墨晕染叠加层 */}
        <div className="absolute inset-0 ink-wash opacity-30 pointer-events-none" />

        <div className="w-full max-w-[420px] relative" style={{ zIndex: 1 }}>
          {/* 返回链接 */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ochre transition-colors duration-250 ease-spring no-underline font-serif ink-underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>归去来兮</span>
            </Link>
          </div>

          {/* Logo */}
          <div className="mb-8">
            <h1 className="font-display text-2xl text-ochre">彩笺寄</h1>
            <div
              className="h-[2px] mt-1.5 rounded-full gold-shimmer"
              style={{
                background: 'linear-gradient(90deg, #8B5E3C 0%, #C4A882 50%, transparent 100%)',
                backgroundSize: '200% 100%',
              }}
            />
          </div>

          {/* Tab 切换 */}
          <div className="mb-8">
            <div className="relative flex gap-0">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError('') }}
                className={`relative z-10 px-5 py-2.5 font-serif text-sm transition-colors duration-250 ease-spring bg-transparent border-none cursor-pointer ${
                  isLogin ? 'text-ink font-semibold' : 'text-ink-muted hover:text-ink-secondary'
                }`}
              >
                雅士归来
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError('') }}
                className={`relative z-10 px-5 py-2.5 font-serif text-sm transition-colors duration-250 ease-spring bg-transparent border-none cursor-pointer ${
                  !isLogin ? 'text-ink font-semibold' : 'text-ink-muted hover:text-ink-secondary'
                }`}
              >
                结缘彩笺
              </button>
              {/* 底部渐变指示器 - 弹簧缓动 */}
              <div
                className="absolute bottom-0 h-[2px] rounded-full"
                style={{
                  width: 'calc(50% - 4px)',
                  left: isLogin ? '0px' : 'calc(50% + 4px)',
                  background: 'linear-gradient(90deg, #8B5E3C, #C4A882)',
                  transition: 'all 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
            </div>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="mb-5 p-3 bg-cinnabar/5 border border-cinnabar/20 rounded-xl font-serif text-sm text-cinnabar">
              {error}
            </div>
          )}

          {/* 表单 - liquid-glass 卡片包裹，赭石色顶部边框 */}
          <div className="liquid-glass p-6 md:p-8" style={{ borderTop: '3px solid #8B5E3C' }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 注册额外字段 */}
              {!isLogin && (
                <div className="space-y-5">
                  {/* 墨点分隔 */}
                  <div className="ink-divider" />

                  <div>
                    <label className="flex items-center gap-2 font-serif text-sm text-ink-secondary mb-1.5">
                      <span className="inline-block w-1 h-1 rounded-full bg-ochre/60" />
                      雅号
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light pointer-events-none" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="雅号为何"
                        className="input-field pl-10 font-serif"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 font-serif text-sm text-ink-secondary mb-1.5">
                      <span className="inline-block w-1 h-1 rounded-full bg-ochre/60" />
                      鸿雁传书（可选）
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="input-field pl-10 font-serif"
                      />
                    </div>
                  </div>

                  {/* 墨点分隔 */}
                  <div className="ink-divider" />
                </div>
              )}

              {/* 用户名 */}
              <div>
                <label className="flex items-center gap-2 font-serif text-sm text-ink-secondary mb-1.5">
                  <span className="inline-block w-1 h-1 rounded-full bg-ochre/60" />
                  名讳
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="请赐名讳"
                    required
                    className="input-field pl-10 font-serif"
                  />
                </div>
              </div>

              {/* 密码 */}
              <div>
                <label className="flex items-center gap-2 font-serif text-sm text-ink-secondary mb-1.5">
                  <span className="inline-block w-1 h-1 rounded-full bg-ochre/60" />
                  密钥
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="请设密钥"
                    required
                    className="input-field pl-10 font-serif"
                  />
                </div>
              </div>

              {/* 提交按钮 - 金色微光 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary rounded-xl py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed gold-shimmer"
              >
                {loading ? '请稍候...' : isLogin ? '入席' : '结缘'}
              </button>
            </form>
          </div>

          {/* 分割线 + 过客登录 */}
          <div className="mt-6">
            <div className="relative flex items-center gap-4">
              <div className="flex-1 ink-divider" />
              <span className="font-serif text-sm text-ink-muted px-2 shrink-0">亦可</span>
              <div className="flex-1 ink-divider" />
            </div>

            <button
              onClick={handleGuestLogin}
              disabled={loading}
              className="mt-4 w-full py-3 px-4 rounded-xl font-serif text-sm flex items-center justify-center gap-2 btn-secondary disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              过客一览（不留痕迹）
            </button>
          </div>

          {/* 切换提示 */}
          <p className="mt-6 text-center font-serif text-sm text-ink-muted">
            {isLogin ? '尚未结缘？' : '已有雅席？'}
            <button
              onClick={() => { setIsLogin(!isLogin); setError('') }}
              className="ml-1 text-ochre font-medium bg-transparent border-none cursor-pointer font-serif text-sm ink-underline transition-colors duration-250 ease-spring"
            >
              {isLogin ? '即刻结缘' : '即刻入席'}
            </button>
          </p>

          {/* 条款 */}
          <p className="mt-4 text-center font-serif text-xs text-ink-light">
            入席即示赞同彩笺寄的
            <Link href="#" className="text-ochre ink-underline transition-colors duration-250 ml-0.5">书斋规矩</Link>
            和
            <Link href="#" className="text-ochre ink-underline transition-colors duration-250 ml-0.5">密约</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
