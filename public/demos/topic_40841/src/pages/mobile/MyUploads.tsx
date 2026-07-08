import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Upload, Clock } from 'lucide-react'
import { useStore } from '@/store'
import type { ActivityType, UploadStatus } from '@/types'

const TYPE_LABELS: Record<ActivityType, string> = {
  geo: '附近活动',
  cert: '考证信息',
  contest: '赛事活动',
}

const STATUS_META: Record<UploadStatus, { text: string; color: string; bg: string }> = {
  pending: { text: '待审核', color: 'var(--warning)', bg: 'var(--warning-bg)' },
  approved: { text: '已通过', color: 'var(--success)', bg: 'var(--success-bg)' },
  rejected: { text: '已驳回', color: 'var(--danger)', bg: 'var(--danger-bg)' },
}

export default function MyUploads() {
  const navigate = useNavigate()
  const uploads = useStore(s => s.uploads)

  const pendingCount = uploads.filter(u => u.status === 'pending').length
  const approvedCount = uploads.filter(u => u.status === 'approved').length
  const rejectedCount = uploads.filter(u => u.status === 'rejected').length

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
        <h1 className="text-[17px] font-semibold text-ink">我的上传</h1>
        <button
          type="button"
          onClick={() => navigate('/app/upload')}
          className="mobile-btn-primary ml-auto flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium"
        >
          <Upload size={13} />
          上传
        </button>
      </div>

      {/* Stats */}
      {uploads.length > 0 && (
        <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
          <div className="mobile-stat-pill">
            <div className="text-xl font-bold text-warning">{pendingCount}</div>
            <div className="mt-0.5 text-[11px] text-ink-muted">待审核</div>
          </div>
          <div className="mobile-stat-pill">
            <div className="text-xl font-bold text-success">{approvedCount}</div>
            <div className="mt-0.5 text-[11px] text-ink-muted">已通过</div>
          </div>
          <div className="mobile-stat-pill">
            <div className="text-xl font-bold text-danger">{rejectedCount}</div>
            <div className="mt-0.5 text-[11px] text-ink-muted">已驳回</div>
          </div>
        </div>
      )}

      {/* Upload list */}
      <div className="px-4 pt-3">
        {uploads.length > 0 ? (
          <div className="space-y-3">
            {uploads.map((upload, i) => {
              const statusMeta = STATUS_META[upload.status]
              return (
                <motion.div
                  key={upload.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="mobile-card p-4"
                >
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="flex-1 text-[15px] font-semibold text-ink">
                      {upload.title}
                    </h3>
                    <span
                      className="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ color: statusMeta.color, backgroundColor: statusMeta.bg }}
                    >
                      {statusMeta.text}
                    </span>
                  </div>

                  {/* Type + time */}
                  <div className="mt-2 flex items-center gap-2 text-[12px] text-ink-muted">
                    <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[11px] text-ink-muted">
                      {TYPE_LABELS[upload.type]}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock size={11} />
                      {upload.createdAt}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-secondary">
                    {upload.description}
                  </p>

                  {/* AI review result */}
                  {upload.aiReviewResult && (
                    <div className="mt-3 rounded-lg bg-surface-subtle p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-medium text-ink-secondary">AI 初审结果</span>
                        <span
                          className="text-[12px] font-bold"
                          style={{
                            color:
                              upload.aiReviewResult.suggestedScore >= 80
                                ? 'var(--success)'
                                : upload.aiReviewResult.suggestedScore >= 50
                                ? 'var(--warning)'
                                : 'var(--danger)',
                          }}
                        >
                          建议可信分: {upload.aiReviewResult.suggestedScore}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                        {upload.aiReviewResult.suggestion}
                      </p>
                      {upload.aiReviewResult.keywords.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {upload.aiReviewResult.keywords.map((kw, ki) => (
                            <span
                              key={ki}
                              className="rounded bg-surface-card px-1.5 py-0.5 text-[10px] text-ink-muted"
                            >
                              #{kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mobile-empty-state"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-subtle">
              <Upload size={36} strokeWidth={1.2} className="text-ink-faint" />
            </div>
            <p className="mt-4 text-[15px] font-medium text-ink-muted">暂无上传记录</p>
            <p className="mt-1 text-[12px] text-ink-muted">分享你发现的活动，帮助更多人避坑</p>
            <button
              type="button"
              onClick={() => navigate('/app/upload')}
              className="mobile-btn-primary mt-5 rounded-full px-5 py-2 text-[13px] font-medium"
            >
              去上传
            </button>
          </motion.div>
        )}
      </div>

      <div className="h-6" />
    </div>
  )
}
