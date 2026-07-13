// 收藏按钮（可切换收藏/未收藏状态）
import { isFavorite as checkFav, toggleFavorite } from '../lib/storage'
import { useState } from 'react'

export default function FavButton({ item, onChange }) {
  const [fav, setFav] = useState(() => (item ? checkFav(item.question, item.roleId) : false))

  const handleClick = (e) => {
    e?.stopPropagation()
    if (!item) return
    const newList = toggleFavorite(item)
    const nowFav = newList.some((f) => f.question === item.question && f.roleId === item.roleId)
    setFav(nowFav)
    if (onChange) onChange(nowFav, newList)
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-ink-sub/60 transition-colors"
      aria-label={fav ? '取消收藏' : '收藏'}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill={fav ? '#C53D43' : 'none'} stroke={fav ? '#C53D43' : '#7C9EB2'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}
