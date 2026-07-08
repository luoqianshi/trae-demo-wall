import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { message } from 'antd'
import {
  ArrowLeft, CheckCircle2, Clock, MapPin, Ruler, Building2, Wallet,
  ChevronDown, Heart, Flag, Share2, Link2, ShieldAlert, FileSearch,
} from 'lucide-react'
import { useStore } from '@/store'
import { useActivityById } from '@/store/selectors'
import TrustScoreRing from '@/components/TrustScoreRing'
import TrustBadge from '@/components/TrustBadge'
import ActivityCover from '@/components/ActivityCover'
import { copyToClipboard, getTrustLabel, getSourceLabel } from '@/utils/helpers'

export default function Detail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const activity = useActivityById(id)
  const isFavorite = useStore(s => s.isFavorite)
  const toggleFavorite = useStore(s => s.toggleFavorite)
  const [tipsOpen, setTipsOpen] = useState(false)
  const [heartScale, setHeartScale] = useState(1)

  if (!activity) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-page px-6">
        <FileSearch size={48} strokeWidth={1.2} className="text-ink-faint" />
        <p className="mt-4 text-base font-medium text-ink-secondary">活动不存在</p>
        <p className="mt-1 text-xs text-ink-muted">该活动可能已下架或链接有误</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-6 flex items-center gap-1.5 rounded-full bg-brand px-5 py-2 text-sm font-medium text-white"
        >
          <ArrowLeft size={15} />
          返回上一页
        </button>
      </div>
    )
  }

  const trustMeta = getTrustLabel(activity.trustLevel)
  const fav = isFavorite(activity.id)
  const trustTextColorClass =
    activity.trustLevel === 'verified' ? 'text-brand'
    : activity.trustLevel === 'pending' ? 'text-warning'
    : 'text-danger'

  const handleFavorite = () => {
    const wasFav = isFavorite(activity.id)
    toggleFavorite(activity.id)
    setHeartScale(1.4)
    setTimeout(() => setHeartScale(1), 200)
    message.success(wasFav ? '已取消收藏' : '已加入收藏')
  }

  const handleReport = () => {
    message.success('举报已提交，工作人员将尽快核实')
  }

  const handleShare = () => {
    message.success('分享链接已生成')
  }

  const handleCopyLink = () => {
    copyToClipboard(activity.officialUrl || window.location.href, '活动链接')
    message.success('官方链接已复制到剪贴板')
  }

  const infoRows = [
    { icon: Clock, label: '活动时间', value: activity.time },
    { icon: MapPin, label: '活动地点', value: activity.address },
    { icon: Ruler, label: '距离', value: activity.distance > 0 ? `${activity.distance} 公里` : '线上活动' },
    { icon: Building2, label: '主办方', value: activity.organizer },
    { icon: Wallet, label: '费用', value: activity.fee },
  ]

  return (
    <div className="min-h-screen bg-surface-page pb-24">
      {/* Cover image with gradient overlay */}
      <div className="relative h-[220px] w-full overflow-hidden">
        <ActivityCover activity={activity} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />

        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mobile-glass-dark absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="mb-2 flex items-center gap-2">
            <TrustBadge level={activity.trustLevel} size="md" />
            <span className="mobile-glass-dark rounded-full px-2 py-0.5 text-[11px] text-white">
              {activity.category}
            </span>
          </div>
          <h1 className="text-[19px] font-semibold leading-tight text-white">{activity.title}</h1>
        </div>
      </div>

      {/* Trust score card */}
      <div className="mobile-card mx-4 -mt-4 p-4">
        <div className="flex items-center gap-4">
          <TrustScoreRing score={activity.trustScore} size={84} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-base font-semibold ${trustTextColorClass}`}>
                {trustMeta.text}
              </span>
              <span className="text-xs text-ink-muted">· {getSourceLabel(activity.source)}</span>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
              已核对主办方备案信息，综合信源交叉验证
            </p>
          </div>
        </div>

        {/* Trust reasons */}
        <div className="mt-4 border-t border-border-subtle pt-3">
          <div className="mb-2 mobile-section-title">可信核验依据</div>
          <div className="space-y-2">
            {activity.trustReasons.map((reason, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="flex items-start gap-2"
              >
                <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-brand" />
                <span className="text-[13px] leading-relaxed text-ink-secondary">{reason}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity info */}
      <div className="mobile-card mx-4 mt-3 p-4">
        <div className="mb-3 mobile-section-title">活动信息</div>
        <div className="space-y-3">
          {infoRows.map((row, i) => {
            const Icon = row.icon
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-surface-subtle">
                  <Icon size={14} className="text-ink-muted" />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] text-ink-muted">{row.label}</div>
                  <div className="mt-0.5 text-[14px] text-ink">{row.value}</div>
                </div>
              </div>
            )
          })}
        </div>

        {activity.description && (
          <div className="mt-4 border-t border-border-subtle pt-3">
            <div className="mb-2 mobile-section-title">活动详情</div>
            <p className="text-[13px] leading-relaxed text-ink-secondary">{activity.description}</p>
          </div>
        )}
      </div>

      {/* Anti-fraud tips collapsible */}
      <div className="mobile-card mx-4 mt-3 overflow-hidden">
        <button
          type="button"
          onClick={() => setTipsOpen(!tipsOpen)}
          className="flex w-full items-center justify-between p-4"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-danger" />
            <span className="mobile-section-title">防骗提示</span>
            <span className="rounded-full bg-danger-bg px-2 py-0.5 text-[10px] text-danger">
              {activity.antiFraudTips.length} 条
            </span>
          </div>
          <motion.div animate={{ rotate: tipsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={18} className="text-ink-muted" />
          </motion.div>
        </button>
        <AnimatePresence initial={false}>
          {tipsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border-subtle p-4">
                <div className="space-y-2">
                  {activity.antiFraudTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-danger" />
                      <span className="text-[13px] leading-relaxed text-ink-secondary">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Copy official link */}
      <div className="mx-4 mt-3">
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-brand/30 bg-surface-card py-3 text-[14px] font-medium text-brand transition-colors active:bg-brand-light"
        >
          <Link2 size={16} />
          复制官方链接
        </button>
      </div>

      {/* Bottom action bar */}
      <div className="mobile-detail-bar">
        <motion.button
          type="button"
          onClick={handleFavorite}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center gap-0.5"
        >
          <motion.div animate={{ scale: heartScale }} transition={{ duration: 0.2 }}>
            <Heart
              size={22}
              className={fav ? 'fill-danger text-danger' : 'text-ink-muted'}
            />
          </motion.div>
          <span className={`text-[10px] ${fav ? 'text-danger' : 'text-ink-muted'}`}>
            {fav ? '已收藏' : '收藏'}
          </span>
        </motion.button>

        <motion.button
          type="button"
          onClick={handleReport}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center gap-0.5"
        >
          <Flag size={22} className="text-ink-muted" />
          <span className="text-[10px] text-ink-muted">举报</span>
        </motion.button>

        <motion.button
          type="button"
          onClick={handleShare}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center gap-0.5"
        >
          <Share2 size={22} className="text-ink-muted" />
          <span className="text-[10px] text-ink-muted">分享</span>
        </motion.button>

        <button
          type="button"
          onClick={() => navigate('/app/upload')}
          className="ml-auto rounded-full bg-brand px-6 py-2.5 text-[14px] font-medium text-white"
        >
          上传类似活动
        </button>
      </div>
    </div>
  )
}
