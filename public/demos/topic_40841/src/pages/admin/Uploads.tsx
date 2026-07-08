import { useMemo, useState } from 'react'
import { Table, Card, Input, Select, Button, Tag, Space, Modal, Row, Col, Statistic, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Search, Eye, CheckCircle, XCircle, Bot, User, Clock, FileText } from 'lucide-react'
import { useStore } from '@/store'
import { getTrustColor, getSourceLabel } from '@/utils/helpers'
import type { UserUpload, UploadStatus, RiskLevel, ActivityType, ActivitySource } from '@/types'

const typeLabels: Record<ActivityType, string> = {
  geo: '地理活动',
  cert: '考证活动',
  contest: '赛事活动',
}

const typeTagClass: Record<ActivityType, string> = {
  geo: 'status-tag--success',
  cert: 'status-tag--info',
  contest: 'status-tag--info',
}

const statusConfig: Record<UploadStatus, { text: string; color: string; bg: string }> = {
  pending: { text: '待审核', color: 'var(--warning)', bg: 'var(--warning-bg)' },
  approved: { text: '已通过', color: 'var(--brand)', bg: 'var(--success-bg)' },
  rejected: { text: '已驳回', color: 'var(--danger)', bg: 'var(--danger-bg)' },
}

const statusTagClass: Record<UploadStatus, string> = {
  pending: 'status-tag--warning',
  approved: 'status-tag--success',
  rejected: 'status-tag--danger',
}

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

export default function Uploads() {
  const uploads = useStore(s => s.uploads)
  const approveUpload = useStore(s => s.approveUpload)
  const rejectUpload = useStore(s => s.rejectUpload)

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<UploadStatus | 'all'>('all')
  const [detailItem, setDetailItem] = useState<UserUpload | null>(null)

  const filtered = useMemo(() => {
    return uploads.filter(u => {
      if (statusFilter !== 'all' && u.status !== statusFilter) return false
      if (searchText && !u.title.includes(searchText) && !u.submitter.includes(searchText)) return false
      return true
    })
  }, [uploads, statusFilter, searchText])

  const summary = useMemo(() => {
    return {
      total: uploads.length,
      pending: uploads.filter(u => u.status === 'pending').length,
      approved: uploads.filter(u => u.status === 'approved').length,
      rejected: uploads.filter(u => u.status === 'rejected').length,
    }
  }, [uploads])

  const handleApprove = (id: string) => {
    approveUpload(id)
    message.success('已通过审核')
    setDetailItem(null)
  }

  const handleReject = (id: string) => {
    rejectUpload(id)
    message.success('已驳回')
    setDetailItem(null)
  }

  const columns: ColumnsType<UserUpload> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 240,
      ellipsis: true,
      render: (title: string) => <span className="font-medium text-ink">{title}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: ActivityType) => (
        <span className={`status-tag ${typeTagClass[type]}`}>
          {typeLabels[type]}
        </span>
      ),
    },
    {
      title: '提交人',
      dataIndex: 'submitter',
      key: 'submitter',
      width: 100,
      render: (submitter: string) => <span className="text-ink-secondary">{submitter}</span>,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string) => <span className="text-ink-muted text-xs">{getSourceLabel(source as ActivitySource)}</span>,
    },
    {
      title: 'AI 风险',
      dataIndex: 'aiReviewResult',
      key: 'aiRisk',
      width: 110,
      render: (review: UserUpload['aiReviewResult']) => {
        if (!review) return <span className="text-ink-muted text-xs">未检测</span>
        const cfg = riskLevelConfig[review.riskLevel]
        return (
          <span className={`status-tag ${riskLevelTagClass[review.riskLevel]}`}>
            {cfg.text}
          </span>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: UploadStatus) => {
        const cfg = statusConfig[status]
        return (
          <span className={`status-tag ${statusTagClass[status]}`}>{cfg.text}</span>
        )
      },
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
      render: (time: string) => <span className="text-ink-muted text-xs">{time}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="link"
            icon={<Eye size={14} />}
            onClick={() => setDetailItem(record)}
            style={{ padding: '0 4px' }}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                size="small"
                type="link"
                icon={<CheckCircle size={14} />}
                style={{ color: 'var(--brand)', padding: '0 4px' }}
                onClick={() => handleApprove(record.id)}
              >
                通过
              </Button>
              <Button
                size="small"
                type="link"
                danger
                icon={<XCircle size={14} />}
                style={{ padding: '0 4px' }}
                onClick={() => handleReject(record.id)}
              >
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic title="上传总数" value={summary.total} valueStyle={{ color: 'var(--text-primary)', fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic title="待审核" value={summary.pending} valueStyle={{ color: 'var(--warning)', fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic title="已通过" value={summary.approved} valueStyle={{ color: 'var(--brand)', fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic title="已驳回" value={summary.rejected} valueStyle={{ color: 'var(--danger)', fontWeight: 700 }} />
          </Card>
        </Col>
      </Row>

      <Card
        variant="borderless"
        className="admin-stat-card"
        title="用户上传管理"
        extra={
          <Space>
            <Select
              value={statusFilter}
              onChange={v => setStatusFilter(v)}
              style={{ width: 130 }}
              options={[
                { label: '全部状态', value: 'all' },
                { label: '待审核', value: 'pending' },
                { label: '已通过', value: 'approved' },
                { label: '已驳回', value: 'rejected' },
              ]}
            />
            <Input
              allowClear
              prefix={<Search size={14} className="text-ink-muted" />}
              placeholder="搜索标题 / 提交人"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 220 }}
            />
          </Space>
        }
      >
        <Table<UserUpload>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
          scroll={{ x: 1100 }}
          size="middle"
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="上传详情"
        open={!!detailItem}
        onCancel={() => setDetailItem(null)}
        width={640}
        footer={
          detailItem?.status === 'pending' ? (
            <Space>
              <Button onClick={() => setDetailItem(null)}>关闭</Button>
              <Button danger icon={<XCircle size={14} />} onClick={() => handleReject(detailItem.id)}>
                驳回
              </Button>
              <Button type="primary" icon={<CheckCircle size={14} />} onClick={() => handleApprove(detailItem.id)}>
                通过
              </Button>
            </Space>
          ) : (
            <Button onClick={() => setDetailItem(null)}>关闭</Button>
          )
        }
      >
        {detailItem && (
          <div className="space-y-4">
            {/* Basic info */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="text-base font-semibold text-ink m-0">{detailItem.title}</h3>
                <span className={`status-tag ${typeTagClass[detailItem.type]}`}>
                  {typeLabels[detailItem.type]}
                </span>
                <span className={`status-tag ${statusTagClass[detailItem.status]}`}>
                  {statusConfig[detailItem.status].text}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-ink-muted flex-wrap">
                <span className="flex items-center gap-1">
                  <User size={12} /> {detailItem.submitter}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {detailItem.createdAt}
                </span>
                <span className="flex items-center gap-1">
                  <FileText size={12} /> {getSourceLabel(detailItem.source as ActivitySource)}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-lg bg-surface-subtle p-3">
              <div className="text-xs text-ink-muted mb-1">用户描述</div>
              <p className="text-sm text-ink-secondary m-0 leading-relaxed">{detailItem.description}</p>
            </div>

            {/* AI Review Result */}
            {detailItem.aiReviewResult && (() => {
              const review = detailItem.aiReviewResult
              const cfg = riskLevelConfig[review.riskLevel]
              return (
                <div
                  className="rounded-lg p-4"
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
              )
            })()}
          </div>
        )}
      </Modal>
    </div>
  )
}
