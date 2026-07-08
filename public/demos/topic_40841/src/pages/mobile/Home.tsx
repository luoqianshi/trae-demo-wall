import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, MapPin, SlidersHorizontal, X, Check, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import { useGeoActivities } from '@/store/selectors'
import ActivityCard from '@/components/ActivityCard'
import type { TrustLevel } from '@/types'

const DISTANCE_OPTIONS = [
  { label: '1km', value: 1 },
  { label: '3km', value: 3 },
  { label: '5km', value: 5 },
  { label: '10km', value: 10 },
]

const CATEGORY_OPTIONS = ['全部', '福利领取', '医疗健康', '商超促销', '社区活动', '教育培训', '体育健身', '公共服务', '集市展销']
const TRUST_OPTIONS: { label: string; value: TrustLevel | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '已核实', value: 'verified' },
  { label: '待核实', value: 'pending' },
  { label: '有风险', value: 'risk' },
]

export default function Home() {
  const activities = useGeoActivities()

  const [searchText, setSearchText] = useState('')
  const [distance, setDistance] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [category, setCategory] = useState('全部')
  const [trustLevel, setTrustLevel] = useState<TrustLevel | 'all'>('all')

  const filtered = useMemo(() => {
    return activities.filter(a => {
      if (distance !== null && a.distance > distance) return false
      if (category !== '全部' && a.category !== category) return false
      if (trustLevel !== 'all' && a.trustLevel !== trustLevel) return false
      if (searchText && !a.title.includes(searchText) && !a.organizer.includes(searchText)) return false
      return true
    })
  }, [activities, distance, category, trustLevel, searchText])

  const verifiedCount = filtered.filter(a => a.trustLevel === 'verified').length
  const avgScore = filtered.length > 0
    ? Math.round(filtered.reduce((sum, a) => sum + a.trustScore, 0) / filtered.length)
    : 0

  const hasActiveFilter = category !== '全部' || trustLevel !== 'all'
  const featured = filtered.find(a => a.trustScore >= 90) ?? filtered[0]
  const rest = filtered.filter(a => a.id !== featured?.id)

  return (
    <div className="min-h-screen pb-3">
      {/* Premium dark hero */}
      <header className="mobile-hero-dark">
        <div className="flex items-start justify-between">
          <div>
            <p className="mobile-hero-eyebrow">ActiveDetective</p>
            <h1 className="mobile-hero-display">发现<em>靠谱</em>活动</h1>
          </div>
          <button type="button" className="mobile-city-pill mobile-city-pill--on-dark">
            <MapPin size={13} />
            北京
          </button>
        </div>

        <div className="mobile-search-field mobile-search-field--on-dark">
          <Search size={16} className="text-white/40" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="搜索活动、主办方…"
            className="flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/40"
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {DISTANCE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDistance(distance === opt.value ? null : opt.value)}
              className={`mobile-chip mobile-chip--on-dark ${distance === opt.value ? 'mobile-chip--on-dark-active' : ''}`}
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`mobile-chip mobile-chip--on-dark flex items-center gap-1 ${hasActiveFilter ? 'mobile-chip--on-dark-active' : ''}`}
          >
            <SlidersHorizontal size={12} />
            筛选
          </button>
        </div>
      </header>

      {/* Bento stats */}
      <section className="mobile-insight-rail">
        <div className="mobile-insight-rail__item">
          <div className="mobile-insight-rail__icon"><Sparkles size={14} /></div>
          <div className="mobile-insight-rail__num">{filtered.length}</div>
          <div className="mobile-insight-rail__label">附近活动</div>
        </div>
        <div className="mobile-insight-rail__item">
          <div className="mobile-insight-rail__icon"><ShieldCheck size={14} /></div>
          <div className="mobile-insight-rail__num">{verifiedCount}</div>
          <div className="mobile-insight-rail__label">已核实</div>
        </div>
        <div className="mobile-insight-rail__item">
          <div className="mobile-insight-rail__icon"><TrendingUp size={14} /></div>
          <div className={`mobile-insight-rail__num ${avgScore >= 80 ? '' : 'text-warning'}`}>{avgScore}</div>
          <div className="mobile-insight-rail__label">可信均分</div>
        </div>
      </section>

      <section className="mt-6 px-4">
        {featured && (
          <div className="mb-5">
            <div className="mobile-section-head">
              <span className="mobile-section-head__eyebrow">编辑精选</span>
              <h2 className="mobile-section-head__title">今日最值得看</h2>
              <p className="mobile-section-head__meta">可信分最高 · 优先推荐</p>
            </div>
            <ActivityCard activity={featured} featured />
          </div>
        )}

        <div className="mobile-section-head">
          <span className="mobile-section-head__eyebrow">附近发现</span>
          <h2 className="mobile-section-head__title">推荐活动</h2>
          <p className="mobile-section-head__meta">共 {rest.length} 个活动</p>
        </div>

        <div className="space-y-2.5">
          {rest.map(activity => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}

          {filtered.length === 0 && (
            <div className="mobile-empty-state">
              <Search size={36} strokeWidth={1.2} />
              <p className="mt-3 text-sm text-ink-secondary">没有符合条件的活动</p>
              <button
                type="button"
                onClick={() => { setDistance(null); setCategory('全部'); setTrustLevel('all'); setSearchText('') }}
                className="mobile-btn-primary mt-4"
              >
                清除筛选
              </button>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="mobile-overlay-backdrop"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="mobile-bottom-sheet"
            >
              <div className="mobile-bottom-sheet-handle" />
              <div className="mb-4 flex items-center justify-between">
                <h3 className="mobile-section-title">筛选条件</h3>
                <button type="button" onClick={() => setDrawerOpen(false)}>
                  <X size={20} className="text-ink-muted" />
                </button>
              </div>

              <div className="mb-5">
                <div className="mb-2 text-[13px] font-medium text-ink-secondary">活动分类</div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`mobile-chip ${category === cat ? 'mobile-chip--active' : 'mobile-chip--default'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <div className="mb-2 text-[13px] font-medium text-ink-secondary">可信等级</div>
                <div className="flex flex-wrap gap-2">
                  {TRUST_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTrustLevel(opt.value)}
                      className={`mobile-chip flex items-center gap-1 ${trustLevel === opt.value ? 'mobile-chip--active' : 'mobile-chip--default'}`}
                    >
                      {trustLevel === opt.value && <Check size={12} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setCategory('全部'); setTrustLevel('all'); setDistance(null) }}
                  className="mobile-btn-secondary flex-1"
                >
                  重置
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="mobile-btn-primary flex-1"
                >
                  确定（{filtered.length}）
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
