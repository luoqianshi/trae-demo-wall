import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { message } from 'antd'
import { Trophy, ShieldCheck, Calendar, Link2 } from 'lucide-react'
import { useContestActivities } from '@/store/selectors'
import ActivityCard from '@/components/ActivityCard'
import ActivityCover from '@/components/ActivityCover'
import TrustBadge from '@/components/TrustBadge'
import { copyToClipboard, getTrustColor } from '@/utils/helpers'

export default function Contest() {
  const navigate = useNavigate()
  const activities = useContestActivities()

  const traeActivity = activities.find(a => a.title.includes('TRAE')) || activities[0]
  const others = activities.filter(a => a.id !== traeActivity?.id)

  const handleCopyLink = (url: string) => {
    if (!url) {
      message.warning('暂无官方链接')
      return
    }
    copyToClipboard(url, '赛事链接')
    message.success('官方链接已复制到剪贴板')
  }

  const trustScoreColorClass =
    traeActivity && traeActivity.trustScore >= 80 ? 'text-brand'
    : traeActivity && traeActivity.trustScore >= 50 ? 'text-warning'
    : 'text-danger'

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mobile-header-glass sticky top-0 z-30 px-4 pb-3 pt-3">
        <div className="mobile-channel-title">
          <span className="mobile-channel-title__icon">
            <Trophy size={18} className="text-brand" />
          </span>
          <div>
            <h1 className="text-[18px] font-bold tracking-tight text-ink">赛事频道</h1>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              官方赛事直通，拒绝虚假报名通道
            </p>
          </div>
        </div>
      </div>

      {/* TRAE featured card */}
      {traeActivity && (
        <div className="px-4 pt-3">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            onClick={() => navigate(`/app/detail/${traeActivity.id}`)}
            className="mobile-card mobile-card--featured mobile-card--interactive overflow-hidden"
          >
            {/* Featured tag */}
            <div className="flex items-center gap-1.5 px-4 pt-3">
              <Trophy size={15} className="text-brand" />
              <span className="text-[13px] font-semibold text-ink">重点赛事</span>
              <span className="ml-auto">
                <TrustBadge level={traeActivity.trustLevel} />
              </span>
            </div>

            {/* Cover */}
            <div className="relative mt-2 h-[160px] w-full overflow-hidden">
              <ActivityCover activity={traeActivity} className="h-full w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <h2 className="text-[18px] font-bold leading-tight text-white">{traeActivity.title}</h2>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-white/85">
                  <Calendar size={12} />
                  {traeActivity.time}
                  <span>·</span>
                  {traeActivity.fee}
                </div>
              </div>
            </div>

            {/* Trust + description */}
            <div className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck size={15} className={trustScoreColorClass} />
                <span className="text-[13px] text-ink-secondary">
                  可信分 <span className={`font-bold ${trustScoreColorClass}`}>{traeActivity.trustScore}</span>
                </span>
                <span className="text-[12px] text-ink-muted">· {traeActivity.organizer}</span>
              </div>
              <p className="text-[13px] leading-relaxed text-ink-muted">{traeActivity.description}</p>

              {/* Enrollment steps */}
              {traeActivity.enrollSteps && traeActivity.enrollSteps.length > 0 && (
                <div className="mt-4 rounded-xl bg-surface-subtle p-3">
                  <div className="mb-3 text-[13px] font-semibold text-ink">报名步骤</div>
                  <div className="relative">
                    {/* Connecting line */}
                    <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-brand/20" />
                    {traeActivity.enrollSteps.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.08 }}
                        className="relative flex items-start gap-3 pb-3 last:pb-0"
                      >
                        <div className="z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                          {i + 1}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-[13px] leading-relaxed text-ink-secondary">{step}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Copy official link button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopyLink(traeActivity.officialUrl)
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-brand/30 bg-surface-card py-2.5 text-[13px] font-medium text-brand transition-colors active:bg-brand-light"
              >
                <Link2 size={15} />
                复制官方链接
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Other contests */}
      {others.length > 0 && (
        <div className="mt-5 px-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="mobile-section-title">更多赛事</h3>
            <span className="text-[12px] text-ink-muted">{others.length} 场</span>
          </div>
          <div className="space-y-2">
            {others.map((activity, i) => (
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
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-6" />
    </div>
  )
}
