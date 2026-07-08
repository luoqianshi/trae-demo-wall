import { motion } from 'framer-motion'
import { GraduationCap, ShieldAlert, Gauge, Award, AlertTriangle } from 'lucide-react'
import { useCertActivities } from '@/store/selectors'
import ActivityCard from '@/components/ActivityCard'
import type { Activity } from '@/types'

function CertExtraTags({ activity }: { activity: Activity }) {
  const tags: { label: string; color: string; bg: string; icon?: typeof Gauge }[] = []

  if (activity.difficulty) {
    tags.push({ label: `难度: ${activity.difficulty}`, color: 'var(--text-secondary)', bg: 'var(--bg-subtle)' })
  }
  if (activity.valueScore) {
    tags.push({ label: `含金量: ${activity.valueScore}`, color: 'var(--success)', bg: 'var(--success-bg)' })
  }
  if (activity.intermediaryRisk) {
    const isHigh = activity.intermediaryRisk === '高'
    tags.push({
      label: `中介风险: ${activity.intermediaryRisk}`,
      color: isHigh ? 'var(--danger)' : 'var(--text-muted)',
      bg: isHigh ? 'var(--danger-bg)' : 'var(--bg-subtle)',
      icon: isHigh ? AlertTriangle : undefined,
    })
  }

  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 px-3 pb-3">
      {tags.map((tag, i) => {
        const Icon = tag.icon
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium"
            style={{ color: tag.color, backgroundColor: tag.bg }}
          >
            {Icon && <Icon size={11} />}
            {tag.label}
          </span>
        )
      })}
    </div>
  )
}

export default function Cert() {
  const activities = useCertActivities()

  const verifiedCount = activities.filter(a => a.trustLevel === 'verified').length
  const riskCount = activities.filter(a => a.trustLevel === 'risk').length

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mobile-header-glass sticky top-0 z-30 px-4 pb-3 pt-3">
        <div className="mobile-channel-title">
          <span className="mobile-channel-title__icon">
            <GraduationCap size={18} className="text-brand" />
          </span>
          <div>
            <h1 className="text-[18px] font-bold tracking-tight text-ink">考证频道</h1>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              官方渠道报名，拒绝中介代办与"包过"陷阱
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
        <div className="mobile-card flex flex-col items-center justify-center px-2 py-3">
          <div className="text-xl font-bold text-ink">{activities.length}</div>
          <div className="mt-0.5 text-[11px] text-ink-muted">考证活动</div>
        </div>
        <div className="mobile-card flex flex-col items-center justify-center px-2 py-3">
          <div className="text-xl font-bold text-brand">{verifiedCount}</div>
          <div className="mt-0.5 text-[11px] text-ink-muted">官方已核实</div>
        </div>
        <div className="mobile-card flex flex-col items-center justify-center px-2 py-3">
          <div className="text-xl font-bold text-danger">{riskCount}</div>
          <div className="mt-0.5 text-[11px] text-ink-muted">风险预警</div>
        </div>
      </div>

      {/* Risk warning banner if any risk activity */}
      {riskCount > 0 && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-bg p-3">
          <ShieldAlert size={15} className="mt-0.5 flex-shrink-0 text-danger" />
          <p className="text-[12px] leading-relaxed text-danger">
            列表中存在风险活动，请重点关注"中介风险"标签为高的项目，避免上当受骗。
          </p>
        </div>
      )}

      {/* Activity list */}
      <div className="mt-3 space-y-3 px-4">
        {activities.map((activity, i) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="mobile-card overflow-hidden"
          >
            <ActivityCard activity={activity} />
            <CertExtraTags activity={activity} />
          </motion.div>
        ))}

        {activities.length === 0 && (
          <div className="mobile-empty-state">
            <Award size={40} strokeWidth={1.2} />
            <p className="mt-3 text-sm">暂无考证活动</p>
          </div>
        )}
      </div>

      {/* Bottom tip */}
      <div className="mx-4 mt-4 mb-6 rounded-xl bg-success-bg p-3">
        <div className="flex items-center gap-1.5">
          <Gauge size={14} className="text-brand" />
          <span className="text-[12px] font-medium text-brand">小贴士</span>
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-secondary">
          国家职业资格考试仅通过官方渠道报名，不存在"内部名额"或"代报名"服务。如遇要求预付定金、承诺包过的机构，请立即举报。
        </p>
      </div>
    </div>
  )
}
