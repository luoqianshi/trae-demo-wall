// 收藏夹 Favorites（锦囊）
import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import { getFavorites, addFavorite, removeFavorite } from '../api'
import { getFavorites as getLocalFavorites, removeFavorite as removeLocalFavorite, clearFavorites as clearLocalFavorites } from '../lib/storage'

function getStoredUser() {
  try {
    const raw = localStorage.getItem('mowen_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function FavoritesPage({ onBack, onOpenChat }) {
  const [favorites, setFavorites] = useState([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [user, setUser] = useState(null)
  const [isCloud, setIsCloud] = useState(false)

  useEffect(() => {
    const u = getStoredUser()
    setUser(u)
    loadFavorites(u)
  }, [])

  const loadFavorites = async (u) => {
    if (u && u.id) {
      // 登录用户：从云端获取
      try {
        const cloudData = await getFavorites(u.id)
        if (cloudData && cloudData.length > 0) {
          setFavorites(cloudData)
          setIsCloud(true)
          return
        }
      } catch (err) {
        console.warn('[墨问] 云端收藏获取失败，使用本地收藏:', err.message)
      }
    }
    // 未登录或云端失败：使用本地
    setFavorites(getLocalFavorites())
    setIsCloud(false)
  }

  const handleRemove = async (item) => {
    if (user && user.id && isCloud) {
      try {
        await removeFavorite(user.id, item.question, item.roleId)
        // 同时从本地删除
        removeLocalFavorite(item.question, item.roleId)
      } catch (err) {
        console.warn('[墨问] 云端删除失败，仅删除本地:', err.message)
      }
    } else {
      removeLocalFavorite(item.question, item.roleId)
    }
    // 刷新列表
    const newList = getLocalFavorites()
    setFavorites(newList)
    setIsCloud(false)
  }

  const handleClear = () => {
    clearLocalFavorites()
    setFavorites([])
    setShowConfirm(false)
  }

  const handleOpen = (item) => {
    onOpenChat(item.question, item.roleId)
  }

  const formatDate = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    const month = d.getMonth() + 1
    const day = d.getDate()
    return `${month}月${day}日`
  }

  return (
    <div className="min-h-screen ink-texture flex flex-col">
      <TopBar
        title="锦囊"
        onBack={onBack}
        rightAction={
          favorites.length > 0 ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-xs text-ink-muted hover:text-ink-accent transition-colors px-2"
            >
              清空
            </button>
          ) : null
        }
      />

      <div className="flex-1 overflow-y-auto thin-scroll mx-auto max-w-md w-full px-4 py-4 pb-28">
        {/* 同步状态提示 */}
        {user && isCloud && (
          <div className="flex items-center gap-1.5 mb-3 px-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7C9EB2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <span className="text-[10px] text-ink-muted">已同步至云端</span>
          </div>
        )}
        {user && !isCloud && favorites.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 px-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B89968" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-[10px] text-ink-muted">本地存储</span>
          </div>
        )}

        {favorites.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-ink-sub flex items-center justify-center mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7C9EB2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="font-serif-cn text-base text-ink-dark font-medium mb-1">锦囊尚空</p>
            <p className="text-sm text-ink-muted">在对话中收藏圣贤的回答</p>
            <p className="text-xs text-ink-muted/70 mt-1">它们会汇聚于此，随时可取</p>
            <button
              onClick={onBack}
              className="seal mt-6 px-5 py-2 text-sm hover:opacity-90 transition-opacity"
            >
              去提问
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-ink-muted">共 {favorites.length} 条收藏</span>
            </div>
            <div className="space-y-3">
              {favorites.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-ink-card rounded-2xl p-4 shadow-ink border border-ink-border hover:shadow-ink-lg transition-all duration-300 group"
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => handleOpen(item)}
                  >
                    {/* 角色信息行 */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center font-serif-cn font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: '#2C2C2C', color: '#FFFCF7' }}
                      >
                        {item.avatar}
                      </span>
                      <span className="text-sm font-serif-cn font-medium text-ink-dark">{item.role}</span>
                      <span className="text-[10px] text-ink-muted">·</span>
                      <span className="text-[10px] text-ink-muted font-serif-cn">{item.source}</span>
                      <span className="ml-auto text-[10px] text-ink-muted/70">{formatDate(item.timestamp)}</span>
                    </div>
                    {/* 问题 */}
                    <p className="text-sm text-ink-dark/90 leading-6 mb-2 line-clamp-2">
                      {item.question}
                    </p>
                    {/* 原文引用 */}
                    <div className="bg-ink-sub/50 rounded-lg px-3 py-2 border-l-2 border-ink-accent">
                      <p className="font-serif-cn text-sm text-ink-dark/80 leading-6 line-clamp-2">
                        {item.quote}
                      </p>
                    </div>
                  </div>
                  {/* 操作行 */}
                  <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-ink-border">
                    <button
                      onClick={() => handleRemove(item)}
                      className="text-xs text-ink-muted hover:text-ink-accent transition-colors flex items-center gap-1"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      移除
                    </button>
                    <button
                      onClick={() => handleOpen(item)}
                      className="text-xs text-ink-accent hover:opacity-80 transition-opacity flex items-center gap-1 font-medium"
                    >
                      重看对话
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 清空确认弹窗 */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-dark/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-ink-card rounded-2xl p-6 mx-8 max-w-xs shadow-ink-lg border border-ink-border"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-serif-cn text-base text-ink-dark font-medium mb-1">清空锦囊？</p>
            <p className="text-sm text-ink-muted mb-5 leading-6">
              所有收藏的圣贤回答将被移除，此操作不可撤销。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm bg-ink-sub text-ink-dark hover:bg-ink-border transition-colors"
              >
                再想想
              </button>
              <button
                onClick={handleClear}
                className="flex-1 py-2.5 rounded-xl text-sm seal hover:opacity-90 transition-opacity"
              >
                清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}