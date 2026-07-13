// 社区问答页 Community
import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import { getCommunity, likeCommunity, searchCommunity } from '../api'

export default function CommunityPage({ onBack, onOpenChat }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getCommunity(10).then((data) => {
      if (mounted) {
        setItems(data || [])
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  const formatDate = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    const now = new Date()
    const diff = now - d
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }

  return (
    <div className="min-h-screen ink-texture flex flex-col">
      <TopBar title="社区问答" onBack={onBack} />

      <div className="flex-1 overflow-y-auto thin-scroll mx-auto max-w-md w-full px-4 py-5 pb-28">
        {/* 社区简介 */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="relative inline-block mb-3">
            <div className="ink-circle w-20 h-20 -z-10" style={{ backgroundColor: '#C53D43', top: '-10px', left: '-10px' }} />
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center font-serif-cn font-bold text-2xl relative z-10" style={{ backgroundColor: '#F1E7D8', color: '#C53D43' }}>
              问
            </div>
          </div>
          <h1 className="font-serif-cn font-bold text-xl text-ink-dark tracking-wide">共问共答</h1>
          <p className="text-sm text-ink-muted mt-1">汇集众人之问，共享圣贤之答</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-ink-border" />
            <span className="text-[10px] text-ink-gold font-serif-cn tracking-widest">墨问社区</span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-ink-border" />
          </div>
        </div>

        {loading ? (
          /* 加载中 */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-ink-accent/30 border-t-ink-accent rounded-full animate-spin mb-3" />
            <p className="text-sm text-ink-muted">加载社区问答中…</p>
          </div>
        ) : items.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-ink-sub flex items-center justify-center mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7C9EB2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="font-serif-cn text-base text-ink-dark font-medium mb-1">暂无社区问答</p>
            <p className="text-sm text-ink-muted">在对话中点击"分享到社区"</p>
            <p className="text-xs text-ink-muted/70 mt-1">你的优质问答将出现在这里</p>
            <button
              onClick={onBack}
              className="seal mt-6 px-5 py-2 text-sm hover:opacity-90 transition-opacity"
            >
              去提问
            </button>
          </div>
        ) : (
          /* 问答列表 */
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="rice-paper rounded-2xl p-5 shadow-ink border border-ink-border hover:shadow-ink-lg transition-all duration-300 animate-fade-in relative overflow-hidden group"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full opacity-[0.03]" style={{ backgroundColor: '#C53D43' }} />
                {/* 顶部信息 */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center font-serif-cn font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: '#2C2C2C', color: '#FFFCF7' }}
                  >
                    {item.avatar || '问'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-serif-cn font-medium text-ink-dark">{item.role || '古人'}</span>
                      {item.school && (
                        <span className="text-[10px] text-ink-gold px-1.5 py-0.5 rounded font-serif-cn" style={{ backgroundColor: 'rgba(184, 153, 104, 0.12)' }}>
                          {item.school}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-ink-muted/70 flex-shrink-0">{formatDate(item.created_at || item.timestamp)}</span>
                </div>
                {/* 问题 */}
                <p className="font-serif-cn text-[15px] text-ink-dark leading-7 mb-3 line-clamp-2">
                  {item.question}
                </p>
                {/* 回答引用 */}
                <div className="bg-ink-sub/50 rounded-lg px-3 py-2 border-l-2 border-ink-accent mb-3">
                  <p className="font-serif-cn text-sm text-ink-dark/80 leading-6 line-clamp-2">
                    {item.quote || item.answer?.quote}
                  </p>
                  {item.source && (
                    <p className="text-[10px] text-ink-muted mt-1">—— {item.source}</p>
                  )}
                </div>
                {/* 互动操作 */}
                <div className="flex items-center justify-between pt-2 border-t border-ink-border/60">
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink-accent transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                      </svg>
                      <span>{item.likes || 0}</span>
                    </button>
                    <button className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink-accent transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>{item.comments || 0}</span>
                    </button>
                  </div>
                  <button
                    onClick={() => onOpenChat?.(item.question, item.role_id)}
                    className="text-xs text-ink-accent hover:opacity-80 transition-opacity flex items-center gap-1 font-medium"
                  >
                    问同样问题
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}