import { useState } from 'react'
import { Card, Tag, Button, Empty, Badge, message, Row, Col, Statistic } from 'antd'
import { Bot, CheckCircle, XCircle, User, Clock, FileText } from 'lucide-react'
import { useStore } from '@/store'
import { usePendingUploads } from '@/store/selectors'
import type { UserUpload, RiskLevel } from '@/types'

const riskLevelConfig: Record<RiskLevel, { color: string; text: string; bg: string; border: string }> = {
  low: { color: 'var(--brand)', text: '低风险', bg: 'var(--success-bg)', border: 'var(--brand)' },
  medium: { color: 'var(--warning)', text: '中风险', bg: 'var(--warning-bg)', border: 'var(--warning)' },
  high: { color: 'var(--danger)', text: '高风险', bg: 'var(--danger-bg)', border: 'var(--danger)' },
}

const riskLevelTagClass: Record<RiskLevel, string> = {
  low: 'status-tag--success',
  medium: 'status-tag--warning',
  high: 'status-tag--danger',
}

const typeLabels: Record<string, string> = {
  geo: '地理活动',
  cert: '考证活动',
  contest: '赛事活动',
}

const typeTagClass: Record<string, string> = {
  geo: 'status-tag--success',
  cert: 'status-tag--info',
  contest: 'status-tag--info',
}

export default function Review() {
  const pendingUploads = usePendingUploads()
  const approveUpload = useStore(s => s.approveUpload)
  const rejectUpload = useStore(s => s.rejectUpload)

  const [actionLoading, setActionLoading] = useState<string>('')

  const handleApprove = (item: UserUpload) => {
    setActionLoading(item.id)
    try {
      approveUpload(item.id)
      message.success(`已通过：${item.title}`)
    } finally {
      setActionLoading('')
    }
  }

  const handleReject = (item: UserUpload) => {
    setActionLoading(item.id)
    try {
      rejectUpload(item.id)
      message.success(`已驳回：${item.title}`)
    } finally {
      setActionLoading('')
    }
  }

  const handleManual = (item: UserUpload) => {
    message.info(`已转人工审核：${item.title}，已分配给审核员处理`)
  }

  const stats = {
    total: pendingUploads.length,
    high: pendingUploads.filter(u => u.aiReviewResult?.riskLevel === 'high').length,
    medium: pendingUploads.filter(u => u.aiReviewResult?.riskLevel === 'medium').length,
    low: pendingUploads.filter(u => u.aiReviewResult?.riskLevel === 'low').length,
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic
              title="待审核总数"
              value={stats.total}
              valueStyle={{ color: 'var(--brand)', fontWeight: 700 }}
              prefix={<Clock size={16} className="inline" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic title="高风险" value={stats.high} valueStyle={{ color: 'var(--danger)', fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic title="中风险" value={stats.medium} valueStyle={{ color: 'var(--warning)', fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic title="低风险" value={stats.low} valueStyle={{ color: 'var(--brand)', fontWeight: 700 }} />
          </Card>
        </Col>
      </Row>

      {/* Queue */}
      {pendingUploads.length === 0 ? (
        <Card variant="borderless" className="admin-stat-card">
          <Empty
            description="审核队列已清空"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '40px 0' }}
          >
            <Button type="primary" onClick={() => window.location.reload()}>
              刷新队列
            </Button>
          </Empty>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingUploads.map((item, idx) => {
            const review = item.aiReviewResult
            const cfg = review ? riskLevelConfig[review.riskLevel] : null
            return (
              <Card
                key={item.id}
                variant="borderless"
                className="admin-stat-card"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge count={idx + 1} style={{ backgroundColor: 'var(--brand)' }} />
                      <h3 className="text-base font-semibold text-ink m-0">{item.title}</h3>
                      <span className={`status-tag ${typeTagClass[item.type] || 'status-tag--neutral'}`}>
                        {typeLabels[item.type] || item.type}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-ink-muted flex-wrap">
                      <span className="flex items-center gap-1">
                        <User size={12} /> {item.submitter}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {item.createdAt}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={12} /> {item.source}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-4 rounded-lg bg-surface-subtle p-3">
                  <div className="text-xs text-ink-muted mb-1">用户描述</div>
                  <p className="text-sm text-ink-secondary m-0 leading-relaxed">{item.description}</p>
                </div>

                {/* AI Review Result */}
                {review && cfg && (
                  <div
                    className="mt-3 rounded-lg p-4"
                    style={{
                      backgroundColor: cfg.bg,
                      border: `1px solid ${cfg.border}30`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Bot size={16} color={cfg.color} />
                        <span className="text-sm font-semibold" style={{ color: cfg.color }}>
                          AI 初审结果
                        </span>
                        <span className={`status-tag ${riskLevelTagClass[review.riskLevel]}`}>
                          {cfg.text}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-ink-muted">建议可信分</span>
                        <span className="text-2xl font-bold" style={{ color: cfg.color }}>
                          {review.suggestedScore}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-xs text-ink-muted mb-1">命中关键词</div>
                      <div className="flex flex-wrap gap-1">
                        {review.keywords.map(kw => (
                          <span
                            key={kw}
                            className="status-tag"
                            style={{
                              color: cfg.color,
                              background: 'var(--bg-card)',
                              border: `1px solid ${cfg.border}40`,
                              fontSize: 12,
                            }}
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-ink-muted mb-1">AI 建议</div>
                      <p className="text-sm text-ink-secondary m-0 leading-relaxed">{review.suggestion}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    icon={<User size={14} />}
                    onClick={() => handleManual(item)}
                    disabled={actionLoading === item.id}
                  >
                    转人工
                  </Button>
                  <Button
                    danger
                    icon={<XCircle size={14} />}
                    loading={actionLoading === item.id}
                    onClick={() => handleReject(item)}
                  >
                    驳回
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckCircle size={14} />}
                    loading={actionLoading === item.id}
                    onClick={() => handleApprove(item)}
                  >
                    通过
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
