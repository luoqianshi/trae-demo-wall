import { useState, useMemo } from 'react'
import { Card, Tag, Button, Tabs, Modal, Space, Row, Col, Statistic, message, Input, Empty } from 'antd'
import {
  ShieldCheck,
  Clock,
  MapPin,
  Users,
  Package,
  HandHeart,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
} from 'lucide-react'
import { useStore } from '@/store'
import type { SurplusItem, Qualification, QualificationType, QualificationStatus } from '@/types'

/* ---------- Config ---------- */

const surplusStatusConfig: Record<SurplusItem['status'], { text: string; color: string; bg: string }> = {
  available: { text: '可领取', color: 'var(--brand)', bg: 'var(--success-bg)' },
  claimed: { text: '已认领', color: 'var(--info)', bg: 'var(--info-bg)' },
  expired: { text: '已过期', color: 'var(--text-muted)', bg: 'var(--bg-subtle)' },
}

const surplusStatusTagClass: Record<SurplusItem['status'], string> = {
  available: 'status-tag--success',
  claimed: 'status-tag--info',
  expired: 'status-tag--neutral',
}

const qualTypeLabels: Record<QualificationType, string> = {
  sanitation_worker: '环卫工人',
  disabled: '残障人士',
  low_income: '低收入家庭',
  elderly_alone: '独居老人',
}

const qualTypeColors: Record<QualificationType, { color: string; bg: string }> = {
  sanitation_worker: { color: 'var(--warning)', bg: 'var(--warning-bg)' },
  disabled: { color: 'var(--info)', bg: 'var(--info-bg)' },
  low_income: { color: 'var(--info)', bg: 'var(--info-bg)' },
  elderly_alone: { color: 'var(--danger)', bg: 'var(--danger-bg)' },
}

const qualTypeTagClass: Record<QualificationType, string> = {
  sanitation_worker: 'status-tag--warning',
  disabled: 'status-tag--info',
  low_income: 'status-tag--info',
  elderly_alone: 'status-tag--danger',
}

const qualStatusConfig: Record<QualificationStatus, { text: string; color: string; bg: string }> = {
  pending_review: { text: '待审核', color: 'var(--warning)', bg: 'var(--warning-bg)' },
  pending_match: { text: '待匹配', color: 'var(--info)', bg: 'var(--info-bg)' },
  completed: { text: '已完成', color: 'var(--brand)', bg: 'var(--success-bg)' },
  rejected: { text: '已驳回', color: 'var(--danger)', bg: 'var(--danger-bg)' },
}

const qualStatusTagClass: Record<QualificationStatus, string> = {
  pending_review: 'status-tag--warning',
  pending_match: 'status-tag--info',
  completed: 'status-tag--success',
  rejected: 'status-tag--danger',
}

/* ---------- Component ---------- */

export default function MutualReview() {
  const surplusItems = useStore(s => s.surplusItems)
  const qualifications = useStore(s => s.qualifications)

  const [localSurplus, setLocalSurplus] = useState(surplusItems)
  const [localQuals, setLocalQuals] = useState(qualifications)
  const [activeTab, setActiveTab] = useState<'surplus' | 'qualification'>('surplus')
  const [detailSurplus, setDetailSurplus] = useState<SurplusItem | null>(null)
  const [detailQual, setDetailQual] = useState<Qualification | null>(null)
  const [searchText, setSearchText] = useState('')

  /* ----- Stats ----- */

  const surplusStats = useMemo(() => {
    return {
      total: localSurplus.length,
      available: localSurplus.filter((s: SurplusItem) => s.status === 'available').length,
      claimed: localSurplus.filter((s: SurplusItem) => s.status === 'claimed').length,
      expired: localSurplus.filter((s: SurplusItem) => s.status === 'expired').length,
    }
  }, [localSurplus])

  const qualStats = useMemo(() => {
    return {
      total: localQuals.length,
      pending: localQuals.filter((q: Qualification) => q.status === 'pending_review').length,
      matching: localQuals.filter((q: Qualification) => q.status === 'pending_match').length,
      completed: localQuals.filter((q: Qualification) => q.status === 'completed').length,
    }
  }, [localQuals])

  /* ----- Handlers ----- */

  const handleSurplusAction = (id: string, status: SurplusItem['status']) => {
    setLocalSurplus(prev => prev.map((s: SurplusItem) => s.id === id ? { ...s, status } : s))
    const text = surplusStatusConfig[status].text
    message.success(`已标记为：${text}`)
  }

  const handleQualAction = (id: string, status: QualificationStatus) => {
    setLocalQuals(prev => prev.map((q: Qualification) => q.id === id ? { ...q, status } : q))
    const text = qualStatusConfig[status].text
    message.success(`已标记为：${text}`)
  }

  /* ----- Filtered lists ----- */

  const filteredSurplus = useMemo(() => {
    if (!searchText) return localSurplus
    return localSurplus.filter(
      (s: SurplusItem) => s.itemName.includes(searchText) || s.shopName.includes(searchText)
    )
  }, [localSurplus, searchText])

  const filteredQuals = useMemo(() => {
    if (!searchText) return localQuals
    return localQuals.filter(
      (q: Qualification) => q.applicantName.includes(searchText) || qualTypeLabels[q.type].includes(searchText)
    )
  }, [localQuals, searchText])

  /* ----- Render ----- */

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic
              title="剩余物资总数"
              value={surplusStats.total}
              valueStyle={{ color: 'var(--text-primary)', fontWeight: 700 }}
              prefix={<Package size={16} className="inline" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic title="可领取" value={surplusStats.available} valueStyle={{ color: 'var(--brand)', fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic
              title="资质申请总数"
              value={qualStats.total}
              valueStyle={{ color: 'var(--text-primary)', fontWeight: 700 }}
              prefix={<HandHeart size={16} className="inline" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic title="待审核" value={qualStats.pending} valueStyle={{ color: 'var(--warning)', fontWeight: 700 }} />
          </Card>
        </Col>
      </Row>

      {/* Search */}
      <div className="flex items-center gap-3">
        <Input
          allowClear
          placeholder="搜索物资名称 / 提供方 / 申请人"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ maxWidth: 360 }}
          prefix={<Eye size={14} className="text-ink-muted" />}
        />
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={key => setActiveTab(key as 'surplus' | 'qualification')}
        items={[
          {
            key: 'surplus',
            label: (
              <span className="flex items-center gap-2">
                <Package size={14} className="text-brand" />
                剩余物资
                <span className="status-tag status-tag--success">
                  {surplusStats.total}
                </span>
              </span>
            ),
            children: (
              <div className="space-y-3">
                {/* Summary bar */}
                <div className="flex items-center gap-6 rounded-lg bg-surface-subtle px-4 py-3 text-sm">
                  <span className="text-ink-secondary">
                    可领取 <strong className="text-brand">{surplusStats.available}</strong>
                  </span>
                  <span className="text-ink-secondary">
                    已认领 <strong className="text-info">{surplusStats.claimed}</strong>
                  </span>
                  <span className="text-ink-secondary">
                    已过期 <strong className="text-ink-muted">{surplusStats.expired}</strong>
                  </span>
                </div>

                {filteredSurplus.length === 0 ? (
                  <Card variant="borderless" className="admin-stat-card">
                    <Empty description="暂无剩余物资" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  </Card>
                ) : (
                  filteredSurplus.map((item: SurplusItem) => (
                    <Card key={item.id} variant="borderless" className="admin-stat-card">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h4 className="text-sm font-semibold text-ink m-0">{item.itemName}</h4>
                            <span className={`status-tag ${surplusStatusTagClass[item.status]}`}>
                              {surplusStatusConfig[item.status].text}
                            </span>
                            {item.safetyVerified && (
                              <span className="status-tag status-tag--success">
                                <ShieldCheck size={12} className="inline mr-1" />
                                已验证
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-ink-muted flex-wrap">
                            <span className="flex items-center gap-1">
                              <Users size={12} /> {item.shopName}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={12} /> {item.address}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {item.pickupTime}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <span className="status-tag status-tag--success">
                              {item.foodType}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2">
                          <Button
                            size="small"
                            type="link"
                            icon={<Eye size={14} />}
                            onClick={() => setDetailSurplus(item)}
                            style={{ padding: '0 4px' }}
                          >
                            详情
                          </Button>
                          {item.status === 'available' && (
                            <Button
                              size="small"
                              type="link"
                              icon={<CheckCircle size={14} />}
                              style={{ color: 'var(--info)', padding: '0 4px' }}
                              onClick={() => handleSurplusAction(item.id, 'claimed')}
                            >
                              标记认领
                            </Button>
                          )}
                          {item.status === 'claimed' && (
                            <Button
                              size="small"
                              type="link"
                              danger
                              icon={<XCircle size={14} />}
                              style={{ padding: '0 4px' }}
                              onClick={() => handleSurplusAction(item.id, 'available')}
                            >
                              撤销认领
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            ),
          },
          {
            key: 'qualification',
            label: (
              <span className="flex items-center gap-2">
                <HandHeart size={14} className="text-warning" />
                资质审核
                <span className="status-tag status-tag--warning">
                  {qualStats.pending}
                </span>
              </span>
            ),
            children: (
              <div className="space-y-3">
                {/* Summary bar */}
                <div className="flex items-center gap-6 rounded-lg bg-surface-subtle px-4 py-3 text-sm">
                  <span className="text-ink-secondary">
                    待审核 <strong className="text-warning">{qualStats.pending}</strong>
                  </span>
                  <span className="text-ink-secondary">
                    待匹配 <strong className="text-info">{qualStats.matching}</strong>
                  </span>
                  <span className="text-ink-secondary">
                    已完成 <strong className="text-brand">{qualStats.completed}</strong>
                  </span>
                </div>

                {filteredQuals.length === 0 ? (
                  <Card variant="borderless" className="admin-stat-card">
                    <Empty description="暂无资质申请" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  </Card>
                ) : (
                  filteredQuals.map((item: Qualification) => (
                    <Card key={item.id} variant="borderless" className="admin-stat-card">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h4 className="text-sm font-semibold text-ink m-0">{item.applicantName}</h4>
                            <span className={`status-tag ${qualTypeTagClass[item.type]}`}>
                              {qualTypeLabels[item.type]}
                            </span>
                            <span className={`status-tag ${qualStatusTagClass[item.status]}`}>
                              {qualStatusConfig[item.status].text}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-ink-muted flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {item.createdAt}
                            </span>
                            <span>需求：{item.description}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.verifiedDocs.map((doc: string) => (
                              <span key={doc} className="status-tag status-tag--info text-[11px]">
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2">
                          <Button
                            size="small"
                            type="link"
                            icon={<Eye size={14} />}
                            onClick={() => setDetailQual(item)}
                            style={{ padding: '0 4px' }}
                          >
                            详情
                          </Button>
                          {item.status === 'pending_review' && (
                            <>
                              <Button
                                size="small"
                                type="link"
                                icon={<CheckCircle size={14} />}
                                style={{ color: 'var(--brand)', padding: '0 4px' }}
                                onClick={() => handleQualAction(item.id, 'pending_match')}
                              >
                                通过
                              </Button>
                              <Button
                                size="small"
                                type="link"
                                danger
                                icon={<XCircle size={14} />}
                                style={{ padding: '0 4px' }}
                                onClick={() => handleQualAction(item.id, 'rejected')}
                              >
                                驳回
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Surplus Detail Modal */}
      <Modal
        title="物资详情"
        open={!!detailSurplus}
        onCancel={() => setDetailSurplus(null)}
        width={560}
        footer={
          <Space>
            <Button onClick={() => setDetailSurplus(null)}>关闭</Button>
            {detailSurplus?.status === 'available' && (
              <Button
                type="primary"
                icon={<CheckCircle size={14} />}
                onClick={() => {
                  handleSurplusAction(detailSurplus.id, 'claimed')
                  setDetailSurplus(null)
                }}
              >
                标记认领
              </Button>
            )}
          </Space>
        }
      >
        {detailSurplus && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-ink m-0">{detailSurplus.itemName}</h3>
              <span className={`status-tag ${surplusStatusTagClass[detailSurplus.status]}`}>
                {surplusStatusConfig[detailSurplus.status].text}
              </span>
            </div>

            <Row gutter={[16, 12]}>
              <Col span={12}>
                <div className="text-xs text-ink-muted">提供方</div>
                <div className="text-sm font-medium text-ink">{detailSurplus.shopName}</div>
              </Col>
              <Col span={12}>
                <div className="text-xs text-ink-muted">位置</div>
                <div className="text-sm font-medium text-ink">{detailSurplus.address}</div>
              </Col>
              <Col span={12}>
                <div className="text-xs text-ink-muted">数量</div>
                <div className="text-sm font-medium text-ink">{detailSurplus.quantity}</div>
              </Col>
              <Col span={12}>
                <div className="text-xs text-ink-muted">领取时间</div>
                <div className="text-sm font-medium text-ink">{detailSurplus.pickupTime}</div>
              </Col>
            </Row>

            <div>
              <div className="text-xs text-ink-muted mb-1">食品类型</div>
              <div className="flex flex-wrap gap-1">
                <span className="status-tag status-tag--success">
                  {detailSurplus.foodType}
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs text-ink-muted mb-1">安全验证</div>
              {detailSurplus.safetyVerified ? (
                <span className="status-tag status-tag--success">
                  <ShieldCheck size={12} className="inline mr-1" />已通过食品安全验证
                </span>
              ) : (
                <span className="status-tag status-tag--danger">
                  未通过安全验证
                </span>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Qualification Detail Modal */}
      <Modal
        title="资质申请详情"
        open={!!detailQual}
        onCancel={() => setDetailQual(null)}
        width={560}
        footer={
          <Space>
            <Button onClick={() => setDetailQual(null)}>关闭</Button>
            {detailQual?.status === 'pending_review' && (
              <>
                <Button
                  danger
                  icon={<XCircle size={14} />}
                  onClick={() => {
                    handleQualAction(detailQual.id, 'rejected')
                    setDetailQual(null)
                  }}
                >
                  驳回
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircle size={14} />}
                  onClick={() => {
                    handleQualAction(detailQual.id, 'pending_match')
                    setDetailQual(null)
                  }}
                >
                  通过审核
                </Button>
              </>
            )}
          </Space>
        }
      >
        {detailQual && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-ink m-0">{detailQual.applicantName}</h3>
              <span className={`status-tag ${qualTypeTagClass[detailQual.type]}`}>
                {qualTypeLabels[detailQual.type]}
              </span>
              <span className={`status-tag ${qualStatusTagClass[detailQual.status]}`}>
                {qualStatusConfig[detailQual.status].text}
              </span>
            </div>

            <Row gutter={[16, 12]}>
              <Col span={12}>
                <div className="text-xs text-ink-muted">申请类型</div>
                <div className="text-sm font-medium text-ink">{qualTypeLabels[detailQual.type]}</div>
              </Col>
              <Col span={12}>
                <div className="text-xs text-ink-muted">申请时间</div>
                <div className="text-sm font-medium text-ink">{detailQual.createdAt}</div>
              </Col>
              <Col span={24}>
                <div className="text-xs text-ink-muted">需求描述</div>
                <div className="text-sm font-medium text-ink">{detailQual.description}</div>
              </Col>
            </Row>

            <div>
              <div className="text-xs text-ink-muted mb-1">已验证材料</div>
              <div className="flex flex-wrap gap-1">
                {detailQual.verifiedDocs.map((doc: string) => (
                  <span key={doc} className="status-tag status-tag--info">
                    <ShieldCheck size={12} className="inline mr-1" />
                    {doc}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="flex items-start gap-2 rounded-lg p-3"
              style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }}
            >
              <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
              <div className="text-xs text-ink-secondary">
                请仔细核验申请材料真实性，确认无误后再通过审核。通过后将进入匹配队列。
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
