import { useMemo, useState } from 'react'
import { Table, Card, Input, Select, Button, Tag, Space, Modal, Row, Col, Statistic, Progress } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Search, Eye, ShieldAlert, Bot, Clock, AlertTriangle } from 'lucide-react'
import { useStore } from '@/store'
import { getTrustColor } from '@/utils/helpers'
import type { RiskLog, RiskLevel } from '@/types'

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

const getStatusTagClass = (status: string): string => {
  if (status.includes('拦截') || status.includes('驳回')) return 'status-tag--danger'
  if (status.includes('待')) return 'status-tag--warning'
  return 'status-tag--success'
}

export default function RiskLogs() {
  const riskLogs = useStore(s => s.riskLogs)

  const [searchText, setSearchText] = useState('')
  const [levelFilter, setLevelFilter] = useState<RiskLevel | 'all'>('all')
  const [detailLog, setDetailLog] = useState<RiskLog | null>(null)

  const filtered = useMemo(() => {
    return riskLogs.filter(log => {
      if (levelFilter !== 'all' && log.level !== levelFilter) return false
      if (searchText && !log.title.includes(searchText) && !log.riskType.includes(searchText)) return false
      return true
    })
  }, [riskLogs, levelFilter, searchText])

  const summary = useMemo(() => {
    return {
      total: riskLogs.length,
      high: riskLogs.filter(l => l.level === 'high').length,
      medium: riskLogs.filter(l => l.level === 'medium').length,
      low: riskLogs.filter(l => l.level === 'low').length,
    }
  }, [riskLogs])

  const columns: ColumnsType<RiskLog> = [
    {
      title: '风险事件',
      dataIndex: 'title',
      key: 'title',
      width: 240,
      ellipsis: true,
      render: (title: string, record) => (
        <div className="flex items-center gap-2">
          <AlertTriangle
            size={14}
            color={riskLevelConfig[record.level].color}
          />
          <span className="font-medium text-ink">{title}</span>
        </div>
      ),
    },
    {
      title: '风险类型',
      dataIndex: 'riskType',
      key: 'riskType',
      width: 120,
      render: (type: string) => <span className="text-ink-secondary">{type}</span>,
    },
    {
      title: '风险等级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: RiskLevel) => {
        const cfg = riskLevelConfig[level]
        return (
          <span className={`status-tag ${riskLevelTagClass[level]}`}>{cfg.text}</span>
        )
      },
    },
    {
      title: '风险分',
      dataIndex: 'riskScore',
      key: 'riskScore',
      width: 160,
      sorter: (a, b) => a.riskScore - b.riskScore,
      render: (score: number, record) => (
        <div className="flex items-center gap-2">
          <div className="w-20">
            <div className="mt-1 h-1.5 rounded-full bg-surface-subtle overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${score}%`,
                  backgroundColor: riskLevelConfig[record.level].color,
                }}
              />
            </div>
          </div>
          <span className="text-sm font-bold" style={{ color: getTrustColor(score) }}>
            {score}
          </span>
        </div>
      ),
    },
    {
      title: '处理状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <span className={`status-tag ${getStatusTagClass(status)}`}>{status}</span>
      ),
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 160,
      sorter: (a, b) => a.time.localeCompare(b.time),
      render: (time: string) => <span className="text-ink-muted text-xs">{time}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button
          size="small"
          type="link"
          icon={<Eye size={14} />}
          onClick={() => setDetailLog(record)}
          style={{ padding: '0 4px' }}
        >
          详情
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic
              title="风险事件总数"
              value={summary.total}
              valueStyle={{ color: 'var(--text-primary)', fontWeight: 700 }}
              prefix={<ShieldAlert size={16} className="inline" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic title="高风险" value={summary.high} valueStyle={{ color: 'var(--danger)', fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic title="中风险" value={summary.medium} valueStyle={{ color: 'var(--warning)', fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic title="低风险" value={summary.low} valueStyle={{ color: 'var(--brand)', fontWeight: 700 }} />
          </Card>
        </Col>
      </Row>

      <Card
        variant="borderless"
        className="admin-stat-card"
        title="风险拦截日志"
        extra={
          <Space>
            <Select
              value={levelFilter}
              onChange={v => setLevelFilter(v)}
              style={{ width: 130 }}
              options={[
                { label: '全部等级', value: 'all' },
                { label: '高风险', value: 'high' },
                { label: '中风险', value: 'medium' },
                { label: '低风险', value: 'low' },
              ]}
            />
            <Input
              allowClear
              prefix={<Search size={14} className="text-ink-muted" />}
              placeholder="搜索事件 / 类型"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 220 }}
            />
          </Space>
        }
      >
        <Table<RiskLog>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="风险事件详情"
        open={!!detailLog}
        onCancel={() => setDetailLog(null)}
        width={600}
        footer={
          <Button onClick={() => setDetailLog(null)}>关闭</Button>
        }
      >
        {detailLog && (() => {
          const cfg = riskLevelConfig[detailLog.level]
          return (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-2 flex-wrap">
                <AlertTriangle size={18} color={cfg.color} />
                <h3 className="text-base font-semibold text-ink m-0">{detailLog.title}</h3>
                <span className={`status-tag ${riskLevelTagClass[detailLog.level]}`}>
                  {cfg.text}
                </span>
                <span className={`status-tag ${getStatusTagClass(detailLog.status)}`}>
                  {detailLog.status}
                </span>
              </div>

              {/* Info grid */}
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <div className="text-xs text-ink-muted">风险类型</div>
                  <div className="text-sm font-medium text-ink">{detailLog.riskType}</div>
                </Col>
                <Col span={12}>
                  <div className="text-xs text-ink-muted">发生时间</div>
                  <div className="text-sm font-medium text-ink flex items-center gap-1">
                    <Clock size={12} /> {detailLog.time}
                  </div>
                </Col>
                <Col span={12}>
                  <div className="text-xs text-ink-muted">风险评分</div>
                  <div className="text-sm font-bold" style={{ color: cfg.color }}>
                    {detailLog.riskScore} 分
                  </div>
                </Col>
                <Col span={12}>
                  <div className="text-xs text-ink-muted">关联活动</div>
                  <div className="text-sm font-medium text-ink">{detailLog.title}</div>
                </Col>
              </Row>

              {/* Risk score bar */}
              <div>
                <div className="text-xs text-ink-muted mb-2">风险评分</div>
                <Progress
                  percent={detailLog.riskScore}
                  strokeColor={cfg.color}
                  showInfo={false}
                />
              </div>

              {/* AI Analysis */}
              {detailLog.detail && (
                <div
                  className="rounded-lg p-4"
                  style={{
                    backgroundColor: cfg.bg,
                    border: `1px solid ${cfg.border}30`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Bot size={16} color={cfg.color} />
                    <span className="text-sm font-semibold" style={{ color: cfg.color }}>
                      AI 风险分析
                    </span>
                  </div>
                  <p className="text-sm text-ink-secondary m-0 leading-relaxed">
                    {detailLog.detail}
                  </p>

                  {detailLog.keywords && detailLog.keywords.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs text-ink-muted mb-1">命中关键词</div>
                      <div className="flex flex-wrap gap-1">
                        {detailLog.keywords.map(kw => (
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
                  )}
                </div>
              )}

              {/* Suggestion */}
              {detailLog.detail && (
                <div className="rounded-lg bg-surface-subtle p-3">
                  <div className="text-xs text-ink-muted mb-1">处理建议</div>
                  <p className="text-sm text-ink-secondary m-0 leading-relaxed">
                    {detailLog.detail}
                  </p>
                </div>
              )}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
