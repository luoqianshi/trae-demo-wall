// 首页 Home
import { useState, useEffect } from 'react'
import Logo from '../components/Logo'
import InputBar from '../components/InputBar'
import { getRoles, getScenes, recommendRole, getCommunity, DEFAULT_ROLES, DEFAULT_SCENES, DEFAULT_TODAY } from '../api'

// 学派分组定义
const SCHOOL_ORDER = ['道家', '儒家', '兵家', '法家', '墨家', '纵横家', '杂家', '文学', '周易']

export default function HomePage({ onAsk, onGoFavorites, onGoCommunity, onGoSearch, onGoAuth }) {
  const [roles, setRoles] = useState(DEFAULT_ROLES)
  const [today, setToday] = useState(DEFAULT_TODAY)
  const [scenes, setScenes] = useState(DEFAULT_SCENES)
  const [selectedRole, setSelectedRole] = useState('auto')
  const [autoRole, setAutoRole] = useState(null)
  const [communityItems, setCommunityItems] = useState([])
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => {
    let mounted = true
    getRoles().then((data) => {
      if (mounted && data && data.length) setRoles(data)
    })
    getScenes().then((data) => {
      if (mounted) {
        if (data.today) setToday(data.today)
        if (data.scenes && data.scenes.length) setScenes(data.scenes)
      }
    })
    getCommunity(3).then((data) => {
      if (mounted && data) setCommunityItems(data)
    })
    return () => {
      mounted = false
    }
  }, [])

  const todayRole = roles.find((r) => r.id === today.suggestRole) || roles[0]
  const currentRole = selectedRole === 'auto'
    ? (autoRole ? roles.find((r) => r.id === autoRole.role_key) || roles[0] : roles[0])
    : roles.find((r) => r.id === selectedRole) || roles[0]

  // 按学派分组
  const groupedRoles = {}
  roles.forEach((role) => {
    const school = role.school || '其他'
    if (!groupedRoles[school]) groupedRoles[school] = []
    groupedRoles[school].push(role)
  })

  const handleAsk = async (question) => {
    if (selectedRole === 'auto') {
      const rec = await recommendRole(question)
      if (rec) {
        setAutoRole(rec)
        onAsk(question, rec.role_key)
        return
      }
    }
    onAsk(question, selectedRole === 'auto' ? 'zhuangzi' : selectedRole)
  }

  const handleSceneClick = (scene) => {
    onAsk(scene.question, scene.suggestRole || (selectedRole === 'auto' ? 'auto' : selectedRole))
  }

  const handleTodayAsk = () => {
    onAsk(today.question, today.suggestRole || (selectedRole === 'auto' ? 'auto' : selectedRole))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchKeyword.trim()) {
      onGoSearch?.(searchKeyword.trim())
    }
  }

  return (
    <div className="min-h-screen ink-texture pb-32">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-30 bg-ink-bg/90 backdrop-blur-lg border-b border-ink-border/60">
        <div className="mx-auto max-w-md flex items-center justify-between px-4 h-14">
          <Logo size="md" />
          <div className="flex items-center gap-2">
            <button
              onClick={onGoSearch}
              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-ink-sub/60 transition-colors press-down"
              aria-label="古籍检索"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C9EB2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            <button
              onClick={onGoFavorites}
              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-ink-sub/60 transition-colors press-down"
              aria-label="收藏夹"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C9EB2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-6 space-y-7">
        {/* ============ Hero 区域 ============ */}
        <section className="stagger-1 text-center pt-2 pb-1">
          <div className="relative inline-block mb-4">
            <div className="ink-circle w-32 h-32 -z-10" style={{ backgroundColor: '#C53D43', top: '-20px', left: '-20px' }} />
            <div className="ink-circle w-24 h-24 -z-10" style={{ backgroundColor: '#7C9EB2', bottom: '-10px', right: '-15px' }} />
            <h1 className="font-serif-cn text-[32px] font-bold text-ink-dark tracking-wider leading-tight">
              问古知今
            </h1>
          </div>
          <p className="text-sm text-ink-muted leading-relaxed">
            五千年智慧，为你解答当下困惑
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-ink-border" />
            <span className="text-[10px] text-ink-gold font-serif-cn tracking-widest">墨问</span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-ink-border" />
          </div>
        </section>

        {/* ============ 今日一问 ============ */}
        <section className="stagger-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="title-decor text-sm font-serif-cn font-bold text-ink-dark">今日一问</span>
            <span className="text-xs text-ink-muted">每日一题，古人来答</span>
          </div>
          <div className="rice-paper rounded-2xl p-5 shadow-ink-lg border border-ink-border relative overflow-hidden card-glow hover-lift">
            <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-[0.05]" style={{ backgroundColor: '#C53D43' }} />
            <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full opacity-[0.04]" style={{ backgroundColor: '#7C9EB2' }} />
            <span className="absolute right-3 top-4 vertical-text text-[9px] text-ink-gold/40 font-serif-cn">每日一问</span>

            <p className="font-serif-cn text-[17px] leading-[1.8] text-ink-dark mb-5 relative z-10">
              {today.question}
            </p>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-serif-cn font-bold flex-shrink-0" style={{ backgroundColor: '#2C2C2C', color: '#FFFCF7' }}>
                  {todayRole?.avatar || '庄'}
                </div>
                <span className="text-xs text-ink-muted">推荐</span>
                <span className="text-sm font-serif-cn text-ink-accent font-medium">{todayRole?.name}</span>
              </div>
              <button
                onClick={handleTodayAsk}
                className="seal px-5 py-2 text-sm hover:opacity-90 transition-opacity press-down flex items-center gap-1.5"
              >
                <span>问{todayRole?.name}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* ============ 大家都在问 ============ */}
        <section className="stagger-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="title-decor text-sm font-serif-cn font-bold text-ink-dark">大家都在问</span>
            <span className="text-xs text-ink-muted">点击直接对话</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {scenes.map((scene, idx) => (
              <button
                key={scene.id || idx}
                onClick={() => handleSceneClick(scene)}
                className="group rice-paper rounded-xl p-4 shadow-ink border border-ink-border text-left hover:shadow-card-hover hover:border-ink-accent/30 hover-lift transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 w-12 h-12 rounded-full opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500" style={{ backgroundColor: '#C53D43' }} />
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-serif-cn font-bold text-sm flex-shrink-0 seal-square"
                    style={{ fontSize: '12px' }}
                  >
                    {scene.icon}
                  </span>
                  <span className="text-sm font-medium text-ink-dark">{scene.label}</span>
                </div>
                <p className="text-xs text-ink-muted leading-5 line-clamp-2">
                  {scene.question}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* ============ 选择古人导师 - 按学派分组 ============ */}
        <section className="stagger-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="title-decor text-sm font-serif-cn font-bold text-ink-dark">选择你的古人导师</span>
            <span className="text-xs text-ink-muted">← 滑动 →</span>
          </div>

          {/* 智能匹配按钮 */}
          <div className="mb-4">
            <button
              onClick={() => setSelectedRole('auto')}
              className={`w-full rice-paper rounded-xl p-3 shadow-ink border border-ink-border flex items-center gap-3 transition-all duration-300 hover-lift ${
                selectedRole === 'auto' ? 'border-ink-accent/40' : ''
              }`}
              style={{
                boxShadow: selectedRole === 'auto'
                  ? '0 2px 12px rgba(197, 61, 67, 0.12), inset 0 0 0 1px rgba(197, 61, 67, 0.2)'
                  : '',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{
                  backgroundColor: selectedRole === 'auto' ? '#C53D43' : '#B89968',
                  color: '#FFFCF7',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className={`font-serif-cn font-bold text-sm ${selectedRole === 'auto' ? 'text-ink-accent' : 'text-ink-dark'}`}>
                    智能匹配
                  </span>
                  <span className="text-[10px] text-ink-gold px-1.5 py-0.5 rounded font-serif-cn" style={{ backgroundColor: 'rgba(184, 153, 104, 0.12)' }}>
                    推荐
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">根据你的问题自动推荐最合适的古人</p>
              </div>
              {selectedRole === 'auto' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C53D43" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          </div>

          {/* 按学派分组展示 */}
          <div className="space-y-4">
            {SCHOOL_ORDER.filter((school) => groupedRoles[school]?.length > 0).map((school) => (
              <div key={school} className="rice-paper rounded-2xl p-4 shadow-ink border border-ink-border relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-[0.03]" style={{ backgroundColor: '#B89968' }} />
                {/* 学派标题 */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1 h-4 rounded-full" style={{ backgroundColor: '#C53D43' }} />
                  <span className="font-serif-cn font-bold text-sm text-ink-dark">{school}</span>
                  <span className="text-[10px] text-ink-muted">{groupedRoles[school].length}位先贤</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-ink-border/60 to-transparent" />
                </div>
                {/* 角色横向滚动 */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
                  {groupedRoles[school].map((role) => {
                    const isActive = role.id === selectedRole
                    return (
                      <div key={role.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setSelectedRole(role.id)}
                          className={`w-16 h-16 text-2xl rounded-full flex items-center justify-center font-serif-cn font-bold transition-all duration-300 press-down ${
                            isActive ? 'scale-105' : 'hover:scale-105'
                          }`}
                          style={{
                            backgroundColor: isActive ? '#C53D43' : '#2C2C2C',
                            color: '#FFFCF7',
                            boxShadow: isActive
                              ? '0 4px 16px rgba(197, 61, 67, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                              : '0 2px 8px rgba(44, 44, 44, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                          }}
                          title={role.name}
                        >
                          {role.avatar}
                        </button>
                        <span className={`text-xs whitespace-nowrap ${isActive ? 'text-ink-accent font-medium' : 'text-ink-muted'}`}>
                          {role.name}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 选中角色详情 */}
          <div className="mt-4 rice-paper rounded-2xl p-4 shadow-ink border border-ink-border relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-[0.03]" style={{ backgroundColor: '#C53D43' }} />
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {selectedRole === 'auto' ? (
                    <>
                      <span className="font-serif-cn text-base text-ink-accent font-bold">智能匹配</span>
                      <span className="text-[10px] text-ink-gold px-1.5 py-0.5 rounded font-serif-cn" style={{ backgroundColor: 'rgba(184, 153, 104, 0.12)' }}>推荐</span>
                    </>
                  ) : (
                    <>
                      <span className="font-serif-cn text-base text-ink-dark font-bold">{currentRole.name}</span>
                      <span className="text-[10px] text-ink-gold px-1.5 py-0.5 rounded font-serif-cn" style={{ backgroundColor: 'rgba(184, 153, 104, 0.12)' }}>{currentRole.style}</span>
                    </>
                  )}
                </div>
                {/* 学派和朝代信息 */}
                {selectedRole !== 'auto' && currentRole.school && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded font-serif-cn" style={{ backgroundColor: 'rgba(197, 61, 67, 0.08)', color: '#C53D43' }}>
                      {currentRole.school}
                    </span>
                    {currentRole.era && (
                      <span className="text-[10px] px-2 py-0.5 rounded font-serif-cn" style={{ backgroundColor: 'rgba(124, 158, 178, 0.1)', color: '#7C9EB2' }}>
                        {currentRole.era}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-xs text-ink-muted leading-5">
                  {selectedRole === 'auto'
                    ? '根据你的问题内容，自动推荐最合适的古人来回答。不满意可以随时换一个古人。'
                    : currentRole.desc}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 自由提问 ============ */}
        <section className="stagger-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="title-decor text-sm font-serif-cn font-bold text-ink-dark">直接问</span>
            <span className="text-xs text-ink-muted">
              {selectedRole === 'auto' ? '智能匹配古人来答' : `${currentRole.name}来答`}
            </span>
          </div>
          <InputBar
            placeholder="用白话写下你的困惑…"
            buttonText="提问"
            onSubmit={handleAsk}
          />
        </section>

        {/* ============ 社区问答入口 ============ */}
        <section className="stagger-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="title-decor text-sm font-serif-cn font-bold text-ink-dark">社区问答</span>
            <span className="text-xs text-ink-muted">众人之问，圣贤之答</span>
            <button
              onClick={onGoCommunity}
              className="ml-auto text-xs text-ink-accent hover:opacity-80 transition-opacity flex items-center gap-0.5"
            >
              查看更多
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            {communityItems.length > 0 ? (
              communityItems.slice(0, 3).map((item, idx) => (
                <button
                  key={item.id || idx}
                  onClick={() => onAsk(item.question, item.role_id || 'auto')}
                  className="w-full rice-paper rounded-xl p-4 shadow-ink border border-ink-border text-left hover:shadow-card-hover hover:border-ink-accent/30 hover-lift transition-all duration-300 group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-serif-cn font-bold flex-shrink-0" style={{ backgroundColor: '#2C2C2C', color: '#FFFCF7' }}>
                      {item.avatar || '问'}
                    </span>
                    <span className="text-xs font-serif-cn font-medium text-ink-dark">{item.role || '古人'}</span>
                    {item.school && (
                      <span className="text-[9px] text-ink-gold px-1 py-0.5 rounded font-serif-cn" style={{ backgroundColor: 'rgba(184, 153, 104, 0.12)' }}>
                        {item.school}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink-dark/90 leading-6 line-clamp-2">{item.question}</p>
                  {item.quote && (
                    <div className="mt-2 bg-ink-sub/40 rounded-lg px-2.5 py-1.5 border-l-2 border-ink-accent">
                      <p className="font-serif-cn text-xs text-ink-dark/70 leading-5 line-clamp-1">{item.quote}</p>
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="rice-paper rounded-xl p-5 shadow-ink border border-ink-border text-center">
                <p className="text-sm text-ink-muted">暂无社区问答</p>
                <p className="text-xs text-ink-muted/70 mt-1">在对话中分享你的问答到社区</p>
              </div>
            )}
          </div>
        </section>

        {/* ============ 古籍检索入口 ============ */}
        <section className="stagger-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="title-decor text-sm font-serif-cn font-bold text-ink-dark">古籍检索</span>
            <span className="text-xs text-ink-muted">搜原文，溯出处</span>
          </div>
          <form onSubmit={handleSearch} className="rice-paper rounded-2xl p-4 shadow-ink border border-ink-border">
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="输入古籍关键词…"
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-ink-sub/50 border border-ink-border text-sm text-ink-dark placeholder:text-ink-muted/50 focus:outline-none focus:border-ink-accent/50 transition-colors"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-ink-sub/60 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C9EB2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-ink-muted/60 mt-2">搜索《论语》《道德经》《庄子》等古籍原文</p>
          </form>
        </section>

        {/* ============ 底部快捷入口 ============ */}
        <section className="stagger-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onGoCommunity}
              className="rice-paper rounded-xl p-4 shadow-ink border border-ink-border flex items-center gap-3 hover-lift transition-all duration-200 group"
            >
              <span className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#F1E7D8', color: '#C53D43' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <div className="text-left">
                <p className="text-sm font-serif-cn font-medium text-ink-dark">社区</p>
                <p className="text-[10px] text-ink-muted">共问共答</p>
              </div>
            </button>
            <button
              onClick={onGoAuth}
              className="rice-paper rounded-xl p-4 shadow-ink border border-ink-border flex items-center gap-3 hover-lift transition-all duration-200 group"
            >
              <span className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#F1E7D8', color: '#C53D43' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <div className="text-left">
                <p className="text-sm font-serif-cn font-medium text-ink-dark">我的</p>
                <p className="text-[10px] text-ink-muted">个人中心</p>
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}