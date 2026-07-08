import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, Button, Empty, message } from 'antd'
import {
  Activity as ActivityIcon,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import { useStore } from '@/store'
import { usePendingUploads } from '@/store/selectors'
import { useCountUp } from '@/utils/useCountUp'
import { getTrustColor } from '@/utils/helpers'
import type { RiskLevel } from '@/types'

const riskLevelConfig: Record<RiskLevel, { color: string; text: string; bg: string }> = {
  low: { color: 'var(--brand)', text: '低风险', bg: 'var(--success-bg)' },
  medium: { color: 'var(--warning)', text: '中风险', bg: 'var(--warning-bg)' },
  high: { color: 'var(--danger)', text: '高风险', bg: 'var(--danger-bg)' },
}

const riskLevelTagClass: Record<RiskLevel, string> = {
  low: 'status-tag--success',
  medium: 'status-tag--warning',
  high: 'status-tag--danger',
}

function KpiCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
}: {
  label: string
  value: number
  icon: React.ReactNode
  iconBg: string
  iconColor: string
}) {
  const animated = useCountUp(value, 1200)
  return (
    <div className="admin-kpi">
      <div className="admin-kpi__icon" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div className="admin-kpi__label">{label}</div>
      <div className="admin-kpi__value">{animated}</div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const activities = useStore(s => s.activities)
  const uploads = useStore(s => s.uploads)
  const riskLogs = useStore(s => s.riskLogs)
  const pendingUploads = usePendingUploads()
  const approveUpload = useStore(s => s.approveUpload)
  const rejectUpload = useStore(s => s.rejectUpload)

  const [actionLoading, setActionLoading] = useState<string>('')

  const stats = useMemo(() => {
    const verified = activities.filter(a => a.trustLevel === 'verified').length
    const pending = uploads.filter(u => u.status === 'pending').length
    return { total: activities.length, verified, pending, risk: riskLogs.length }
  }, [activities, uploads, riskLogs])

  const trendData = useMemo(() => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const seedValues = [12, 18, 15, 22, 28, 35, 30]
    const max = Math.max(...seedValues)
    return days.map((day, i) => ({ day, value: seedValues[i], percent: (seedValues[i] / max) * 100 }))
  }, [])

  const latestPending = pendingUploads.slice(0, 5)
  const latestRiskLogs = riskLogs.slice(0, 3)

  const handleQuickApprove = (id: string) => {
    setActionLoading(id)
    try {
      approveUpload(id)
      message.success('已通过审核')
    } finally {
      setActionLoading('')
    }
  }

  const handleQuickReject = (id: string) => {
    setActionLoading(id)
    try {
      rejectUpload(id)
      message.success('已驳回')
    } finally {
      setActionLoading('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="admin-bento">
        <KpiCard label="活动总数" value={stats.total} icon={<ActivityIcon size={20} />} iconBg="var(--success-bg)" iconColor="var(--brand)" />
        <KpiCard label="已核实" value={stats.verified} icon={<ShieldCheck size={20} />} iconBg="var(--success-bg)" iconColor="var(--brand)" />
        <KpiCard label="待审核" value={stats.pending} icon={<Clock size={20} />} iconBg="var(--warning-bg)" iconColor="var(--warning)" />
        <KpiCard label="风险拦截" value={stats.risk} icon={<AlertTriangle size={20} />} iconBg="var(--danger-bg)" iconColor="var(--danger)" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="admin-panel lg:col-span-7">
          <div className="admin-panel__head">
            <div className="admin-panel__title">近 7 天活动上架趋势</div>
            <button type="button" className="admin-panel__link" onClick={() => navigate('/admin/activities')}>
              查看全部 <ArrowRight size={14} />
            </button>
          </div>
          <div className="flex h-[200px] items-end justify-between gap-2">
            {trendData.map((item, idx) => (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[11px] font-semibold text-ink-secondary">{item.value}</span>
                <div
                  className="w-full rounded-t-lg"
                  style={{
                    height: `${item.percent * 1.5}px`,
                    minHeight: 8,
                    background: 'linear-gradient(180deg, var(--brand) 0%, #6EE7B7 100%)',
                    animation: `growBar 0.8s ease-out ${idx * 0.06}s both`,
                  }}
                />
                <span className="text-[10px] text-ink-muted">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel lg:col-span-5">
          <div className="admin-panel__head">
            <div className="admin-panel__title">
              <AlertTriangle size={16} className="text-danger" />
              风险拦截
            </div>
            <button type="button" className="admin-panel__link" onClick={() => navigate('/admin/risk-logs')}>
              全部 <ArrowRight size={14} />
            </button>
          </div>
          {latestRiskLogs.length === 0 ? (
            <Empty description="暂无风险记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div className="space-y-2">
              {latestRiskLogs.map(log => {
                const cfg = riskLevelConfig[log.level]
                return (
                  <div key={log.id} className="flex items-start gap-3 rounded-xl bg-surface-subtle p-3">
                    <span className={`status-tag ${riskLevelTagClass[log.level]}`}>
                      {cfg.text}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">{log.title}</div>
                      <div className="mt-0.5 text-[11px] text-ink-muted">{log.riskType} · {log.time}</div>
                    </div>
                    <span className="text-sm font-bold" style={{ color: getTrustColor(log.riskScore) }}>
                      {log.riskScore}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel__head">
          <div className="admin-panel__title">
            <Clock size={16} className="text-warning" />
            待审核上传
            {latestPending.length > 0 && (
              <Tag color="orange" className="ml-1">{latestPending.length}</Tag>
            )}
          </div>
          <button type="button" className="admin-panel__link" onClick={() => navigate('/admin/review')}>
            审核工作台 <ArrowRight size={14} />
          </button>
        </div>

        {latestPending.length === 0 ? (
          <Empty description="暂无待审核上传" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div className="space-y-2">
            {latestPending.map(item => {
              const riskLevel = item.aiReviewResult?.riskLevel
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-xl border border-border-subtle bg-surface-subtle p-4 transition-colors hover:bg-surface-hover"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-ink">{item.title}</span>
                      {item.aiReviewResult && (
                        <span className={`status-tag ${riskLevel === 'high' ? 'status-tag--danger' : riskLevel === 'medium' ? 'status-tag--warning' : 'status-tag--success'}`}>
                          AI {item.aiReviewResult.suggestedScore}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 truncate text-xs text-ink-muted">
                      {item.submitter} · {item.createdAt}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckCircle size={14} />}
                      loading={actionLoading === item.id}
                      onClick={() => handleQuickApprove(item.id)}
                    >
                      通过
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<XCircle size={14} />}
                      loading={actionLoading === item.id}
                      onClick={() => handleQuickReject(item.id)}
                    >
                      驳回
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
