import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Heart } from 'lucide-react'
import { useStore } from '@/store'
import ActivityCard from '@/components/ActivityCard'

export default function Favorites() {
  const navigate = useNavigate()
  const favoriteIds = useStore(s => s.favoriteIds)
  const activities = useStore(s => s.activities)

  const favorites = useMemo(
    () =>
      favoriteIds
        .map(id => activities.find(a => a.id === id))
        .filter((a): a is NonNullable<typeof a> => a !== undefined),
    [favoriteIds, activities],
  )

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center gap-3 bg-surface-card px-4 pb-3 pt-3 shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-subtle"
        >
          <ArrowLeft size={18} className="text-ink-secondary" />
        </button>
        <h1 className="text-[17px] font-semibold text-ink">我的收藏</h1>
        {favorites.length > 0 && (
          <span className="ml-auto rounded-full bg-brand-light px-2.5 py-0.5 text-[12px] font-medium text-brand">
            {favorites.length} 个
          </span>
        )}
      </div>

      {/* Favorites list */}
      <div className="px-4 pt-3">
        {favorites.length > 0 ? (
          <div className="space-y-2">
            {favorites.map((activity, i) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              >
                <ActivityCard activity={activity} />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mobile-empty-state"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-subtle">
              <Heart size={36} strokeWidth={1.2} className="text-ink-faint" />
            </div>
            <p className="mt-4 text-[15px] font-medium text-ink-muted">暂无收藏</p>
            <p className="mt-1 text-[12px] text-ink-muted">在活动详情页点击收藏按钮即可保存</p>
            <button
              type="button"
              onClick={() => navigate('/app')}
              className="mobile-btn-primary mt-5 rounded-full px-5 py-2 text-[13px] font-medium"
            >
              去逛逛
            </button>
          </motion.div>
        )}
      </div>

      <div className="h-6" />
    </div>
  )
}
