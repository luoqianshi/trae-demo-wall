// 个人中心 Auth/我的
import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import { authRegister, authLogin } from '../api'

function getStoredUser() {
  try {
    const raw = localStorage.getItem('mowen_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setStoredUser(user) {
  if (user) {
    localStorage.setItem('mowen_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('mowen_user')
  }
}

export default function AuthPage({ onBack, onGoHome }) {
  const [user, setUser] = useState(getStoredUser)
  const [showLogin, setShowLogin] = useState(false)
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState('')

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  const handleLogin = () => {
    const name = nickname.trim() || '墨客'
    const av = avatar.trim() || '墨'
    const newUser = {
      id: 'user_' + Date.now(),
      nickname: name,
      avatar: av,
      loginTime: Date.now(),
    }
    setStoredUser(newUser)
    setUser(newUser)
    setShowLogin(false)
    setNickname('')
    setAvatar('')
  }

  const handleLogout = () => {
    setStoredUser(null)
    setUser(null)
  }

  // 统计信息
  const favCount = (() => {
    try {
      const raw = localStorage.getItem('mowen_favorites')
      return raw ? JSON.parse(raw).length : 0
    } catch { return 0 }
  })()

  return (
    <div className="min-h-screen ink-texture flex flex-col">
      <TopBar title="我的" onBack={onBack} />

      <div className="flex-1 overflow-y-auto thin-scroll mx-auto max-w-md w-full px-4 py-6 pb-28">
        {user ? (
          <>
            {/* 用户信息卡片 */}
            <div className="rice-paper rounded-2xl p-6 shadow-ink border border-ink-border text-center animate-fade-in relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-[0.04]" style={{ backgroundColor: '#C53D43' }} />
              <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full opacity-[0.03]" style={{ backgroundColor: '#7C9EB2' }} />
              <div className="relative z-10">
                <div
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center font-serif-cn font-bold text-3xl mb-4 shadow-ink-lg"
                  style={{ backgroundColor: '#C53D43', color: '#FFFCF7' }}
                >
                  {user.avatar}
                </div>
                <h2 className="font-serif-cn font-bold text-xl text-ink-dark">{user.nickname}</h2>
                <p className="text-xs text-ink-muted mt-1">墨问学友</p>
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-ink-border/60">
                  <div className="text-center">
                    <p className="font-serif-cn font-bold text-lg text-ink-dark">{favCount}</p>
                    <p className="text-[10px] text-ink-muted">锦囊收藏</p>
                  </div>
                  <div className="text-center">
                    <p className="font-serif-cn font-bold text-lg text-ink-dark">--</p>
                    <p className="text-[10px] text-ink-muted">社区贡献</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 功能菜单 */}
            <div className="mt-6 space-y-2">
              <button className="w-full rice-paper rounded-xl px-4 py-3.5 shadow-ink border border-ink-border flex items-center gap-3 hover-lift transition-all duration-200 group">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: '#F1E7D8', color: '#C53D43' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <span className="flex-1 text-left text-sm text-ink-dark">我的收藏</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C9EB2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              <button className="w-full rice-paper rounded-xl px-4 py-3.5 shadow-ink border border-ink-border flex items-center gap-3 hover-lift transition-all duration-200 group">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: '#F1E7D8', color: '#C53D43' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <span className="flex-1 text-left text-sm text-ink-dark">我的社区问答</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C9EB2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              <button className="w-full rice-paper rounded-xl px-4 py-3.5 shadow-ink border border-ink-border flex items-center gap-3 hover-lift transition-all duration-200 group">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: '#F1E7D8', color: '#C53D43' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
                <span className="flex-1 text-left text-sm text-ink-dark">关于墨问</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C9EB2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* 退出登录 */}
            <div className="mt-8">
              <button
                onClick={handleLogout}
                className="w-full py-3 rounded-xl text-sm border border-ink-border text-ink-muted hover:text-ink-accent hover:border-ink-accent/30 transition-all duration-200"
              >
                退出登录
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 未登录状态 */}
            <div className="text-center py-10 animate-fade-in">
              <div className="relative inline-block mb-6">
                <div className="ink-circle w-28 h-28 -z-10" style={{ backgroundColor: '#C53D43', top: '-15px', left: '-15px' }} />
                <div
                  className="w-24 h-24 mx-auto rounded-full flex items-center justify-center font-serif-cn font-bold text-4xl relative z-10 shadow-ink-lg"
                  style={{ backgroundColor: '#2C2C2C', color: '#FFFCF7' }}
                >
                  墨
                </div>
              </div>
              <h1 className="font-serif-cn font-bold text-2xl text-ink-dark tracking-wide">墨问</h1>
              <p className="text-sm text-ink-muted mt-2">登录后享受完整体验</p>
              <ul className="text-xs text-ink-muted/70 mt-4 space-y-1.5">
                <li>云端同步锦囊收藏</li>
                <li>分享问答到社区</li>
                <li>个性化推荐古人</li>
              </ul>
            </div>

            {/* 登录表单 */}
            <div className="rice-paper rounded-2xl p-5 shadow-ink border border-ink-border">
              <div className="flex items-center gap-2 mb-4">
                <span className="title-decor text-sm font-serif-cn font-bold text-ink-dark">快速登录</span>
                <span className="text-xs text-ink-muted">无需密码，输入昵称即可</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-ink-muted mb-1 block">昵称</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="输入你的昵称"
                    maxLength={12}
                    className="w-full px-4 py-2.5 rounded-xl bg-ink-sub/50 border border-ink-border text-sm text-ink-dark placeholder:text-ink-muted/50 focus:outline-none focus:border-ink-accent/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-muted mb-1 block">头像（单字）</label>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="输入一个字作为头像"
                    maxLength={1}
                    className="w-full px-4 py-2.5 rounded-xl bg-ink-sub/50 border border-ink-border text-sm text-ink-dark placeholder:text-ink-muted/50 focus:outline-none focus:border-ink-accent/50 transition-colors"
                  />
                </div>
                <button
                  onClick={handleLogin}
                  className="w-full seal py-2.5 text-sm hover:opacity-90 transition-opacity press-down"
                >
                  进入墨问
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}