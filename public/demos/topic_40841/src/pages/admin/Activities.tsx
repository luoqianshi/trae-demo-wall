import { useMemo, useState } from 'react'
import { Table, Card, Input, Select, Button, Tag, Space, Popconfirm, message, Row, Col, Statistic } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Search, Trash2, Power } from 'lucide-react'
import { useStore } from '@/store'
import { getTrustColor, getSourceLabel } from '@/utils/helpers'
import type { Activity, ActivityType, TrustLevel, ActivityStatus } from '@/types'

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

const statusConfig: Record<ActivityStatus, { text: string; color: string; bg: string }> = {
  published: { text: '已上架', color: 'var(--brand)', bg: 'var(--success-bg)' },
  pending: { text: '待审核', color: 'var(--warning)', bg: 'var(--warning-bg)' },
  rejected: { text: '已下架', color: 'var(--danger)', bg: 'var(--danger-bg)' },
}

const statusTagClass: Record<ActivityStatus, string> = {
  published: 'status-tag--success',
  pending: 'status-tag--warning',
  rejected: 'status-tag--danger',
}

const trustLevelConfig: Record<TrustLevel, { text: string; color: string; bg: string }> = {
  verified: { text: '已核实', color: 'var(--brand)', bg: 'var(--success-bg)' },
  pending: { text: '待核实', color: 'var(--warning)', bg: 'var(--warning-bg)' },
  risk: { text: '有风险', color: 'var(--danger)', bg: 'var(--danger-bg)' },
}

const trustLevelTagClass: Record<TrustLevel, string> = {
  verified: 'status-tag--success',
  pending: 'status-tag--warning',
  risk: 'status-tag--danger',
}

export default function Activities() {
  const activities = useStore(s => s.activities)
  const toggleActivityStatus = useStore(s => s.toggleActivityStatus)
  const deleteActivity = useStore(s => s.deleteActivity)

  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all')

  const filtered = useMemo(() => {
    return activities.filter(a => {
      if (typeFilter !== 'all' && a.type !== typeFilter) return false
      if (searchText && !a.title.includes(searchText) && !a.organizer.includes(searchText)) return false
      return true
    })
  }, [activities, typeFilter, searchText])

  const summary = useMemo(() => {
    return {
      total: activities.length,
      published: activities.filter(a => a.status === 'published').length,
      rejected: activities.filter(a => a.status === 'rejected').length,
      risk: activities.filter(a => a.trustLevel === 'risk').length,
    }
  }, [activities])

  const handleToggle = (record: Activity) => {
    toggleActivityStatus(record.id)
    const next = record.status === 'published' ? '下架' : '上架'
    message.success(`已${next}：${record.title}`)
  }

  const handleDelete = (record: Activity) => {
    deleteActivity(record.id)
    message.success(`已删除：${record.title}`)
  }

  const columns: ColumnsType<Activity> = [
    {
      title: '活动标题',
      dataIndex: 'title',
      key: 'title',
      width: 280,
      ellipsis: true,
      render: (title: string, record) => (
        <div className="flex items-center gap-2">
          {record.icon && <span className="text-lg">{record.icon}</span>}
          <span className="font-medium text-ink">{title}</span>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: ActivityType) => (
        <span className={`status-tag ${typeTagClass[type]}`}>
          {typeLabels[type]}
        </span>
      ),
      filters: [
        { text: '地理活动', value: 'geo' },
        { text: '考证活动', value: 'cert' },
        { text: '赛事活动', value: 'contest' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => <span className="text-ink-secondary">{category}</span>,
    },
    {
      title: '可信分',
      dataIndex: 'trustScore',
      key: 'trustScore',
      width: 100,
      sorter: (a, b) => a.trustScore - b.trustScore,
      render: (score: number) => (
        <span className="font-bold" style={{ color: getTrustColor(score) }}>
          {score}
        </span>
      ),
    },
    {
      title: '可信等级',
      dataIndex: 'trustLevel',
      key: 'trustLevel',
      width: 110,
      render: (level: TrustLevel) => {
        const cfg = trustLevelConfig[level]
        return (
          <span className={`status-tag ${trustLevelTagClass[level]}`}>{cfg.text}</span>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ActivityStatus) => {
        const cfg = statusConfig[status]
        return (
          <span className={`status-tag ${statusTagClass[status]}`}>{cfg.text}</span>
        )
      },
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string) => <span className="text-ink-muted text-xs">{getSourceLabel(source as Activity['source'])}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => {
        const isPublished = record.status === 'published'
        return (
          <Space size="small">
            <Button
              size="small"
              type="link"
              icon={<Power size={14} />}
              style={{ color: isPublished ? 'var(--danger)' : 'var(--brand)', padding: '0 4px' }}
              onClick={() => handleToggle(record)}
            >
              {isPublished ? '下架' : '上架'}
            </Button>
            <Popconfirm
              title="确认删除该活动？"
              description="删除后不可恢复"
              okText="确认删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record)}
            >
              <Button
                size="small"
                type="link"
                danger
                icon={<Trash2 size={14} />}
                style={{ padding: '0 4px' }}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic title="活动总数" value={summary.total} valueStyle={{ color: 'var(--text-primary)', fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic title="已上架" value={summary.published} valueStyle={{ color: 'var(--brand)', fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic title="已下架" value={summary.rejected} valueStyle={{ color: 'var(--danger)', fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className="admin-stat-card">
            <Statistic title="风险活动" value={summary.risk} valueStyle={{ color: 'var(--warning)', fontWeight: 700 }} />
          </Card>
        </Col>
      </Row>

      <Card
        variant="borderless"
        className="admin-stat-card"
        title="活动管理"
        extra={
          <Space>
            <Select
              value={typeFilter}
              onChange={v => setTypeFilter(v)}
              style={{ width: 140 }}
              options={[
                { label: '全部类型', value: 'all' },
                { label: '地理活动', value: 'geo' },
                { label: '考证活动', value: 'cert' },
                { label: '赛事活动', value: 'contest' },
              ]}
            />
            <Input
              allowClear
              prefix={<Search size={14} className="text-ink-muted" />}
              placeholder="搜索活动标题 / 主办方"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 240 }}
            />
          </Space>
        }
      >
        <Table<Activity>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
          scroll={{ x: 1100 }}
          size="middle"
        />
      </Card>
    </div>
  )
}
