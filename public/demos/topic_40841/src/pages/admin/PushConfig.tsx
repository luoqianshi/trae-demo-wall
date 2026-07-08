import { useState, useMemo } from 'react'
import { Card, Switch, Select, Radio, Button, Form, message, Tag, Divider, Row, Col } from 'antd'
import { Bell, MapPin, Globe, Pin, Save, Info } from 'lucide-react'
import { useStore } from '@/store'

type PushFrequency = 'realtime' | 'daily' | 'weekly'

const frequencyLabels: Record<PushFrequency, string> = {
  realtime: '实时推送',
  daily: '每日汇总',
  weekly: '每周汇总',
}

export default function PushConfig() {
  const activities = useStore(s => s.activities)

  const [geoPushEnabled, setGeoPushEnabled] = useState(true)
  const [nationalPushEnabled, setNationalPushEnabled] = useState(false)
  const [pinnedIds, setPinnedIds] = useState<string[]>(['g1', 'c1'])
  const [frequency, setFrequency] = useState<PushFrequency>('realtime')
  const [geoRadius, setGeoRadius] = useState(5)
  const [saving, setSaving] = useState(false)

  const publishedActivities = useMemo(
    () => activities.filter(a => a.status === 'published'),
    [activities]
  )

  const selectOptions = publishedActivities.map(a => ({
    label: `${a.title}（${a.category}）`,
    value: a.id,
  }))

  const pinnedActivities = useMemo(
    () => pinnedIds.map(id => activities.find(a => a.id === id)).filter(Boolean),
    [pinnedIds, activities]
  )

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      message.success('推送配置已保存')
    }, 600)
  }

  const handlePinnedChange = (values: string[]) => {
    if (values.length > 5) {
      message.warning('最多置顶 5 个活动')
      return
    }
    setPinnedIds(values)
  }

  return (
    <div className="space-y-4">
      {/* Push toggles */}
      <Card
        variant="borderless"
        className="admin-stat-card"
        title={
          <span className="flex items-center gap-2">
            <Bell size={16} className="text-brand" />
            推送开关
          </span>
        }
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={12}>
            <div className="flex items-start justify-between rounded-lg border border-border-subtle p-4">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'var(--success-bg)' }}
                >
                  <MapPin size={18} className="text-brand" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">地理活动推送</div>
                  <div className="mt-1 text-xs text-ink-muted">
                    向用户推送附近 {geoRadius}km 范围内的地理类活动
                  </div>
                </div>
              </div>
              <Switch
                checked={geoPushEnabled}
                onChange={v => {
                  setGeoPushEnabled(v)
                  message.info(`地理活动推送已${v ? '开启' : '关闭'}`)
                }}
              />
            </div>
            {geoPushEnabled && (
              <div className="mt-3 rounded-lg bg-surface-subtle p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-ink-muted">
                  <span>推送范围</span>
                  <span className="font-semibold text-ink-secondary">{geoRadius} km</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={geoRadius}
                  onChange={e => setGeoRadius(Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: 'var(--brand)' }}
                />
              </div>
            )}
          </Col>

          <Col xs={24} sm={12}>
            <div className="flex items-start justify-between rounded-lg border border-border-subtle p-4">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'var(--info-bg)' }}
                >
                  <Globe size={18} className="text-info" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">全国活动推送</div>
                  <div className="mt-1 text-xs text-ink-muted">
                    向用户推送全国性考证、赛事类活动
                  </div>
                </div>
              </div>
              <Switch
                checked={nationalPushEnabled}
                onChange={v => {
                  setNationalPushEnabled(v)
                  message.info(`全国活动推送已${v ? '开启' : '关闭'}`)
                }}
              />
            </div>
            {nationalPushEnabled && (
              <div className="mt-3 rounded-lg bg-surface-subtle p-3">
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <Info size={12} />
                  全国推送将覆盖所有注册用户，请谨慎使用
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* Pinned activities */}
      <Card
        variant="borderless"
        className="admin-stat-card"
        title={
          <span className="flex items-center gap-2">
            <Pin size={16} className="text-warning" />
            置顶活动配置
            <span className="status-tag status-tag--warning" style={{ marginLeft: 4 }}>
              {pinnedIds.length}/5
            </span>
          </span>
        }
        extra={
          <span className="text-xs text-ink-muted">最多置顶 5 个活动</span>
        }
      >
        <Form layout="vertical">
          <Form.Item label="选择置顶活动" extra="置顶活动将在用户端首页顶部优先展示">
            <Select
              mode="multiple"
              placeholder="请选择要置顶的活动"
              value={pinnedIds}
              onChange={handlePinnedChange}
              options={selectOptions}
              style={{ width: '100%' }}
              optionFilterProp="label"
              maxTagCount="responsive"
            />
          </Form.Item>
        </Form>

        {pinnedActivities.length > 0 && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <div className="text-xs text-ink-muted mb-2">当前置顶活动预览</div>
            <div className="space-y-2">
              {pinnedActivities.map((act, idx) => act && (
                <div
                  key={act.id}
                  className="flex items-center gap-3 rounded-lg border border-border-subtle p-3"
                >
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: 'var(--warning)' }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium text-ink">{act.title}</div>
                    <div className="text-xs text-ink-muted">{act.category} · {act.organizer}</div>
                  </div>
                  <span className="status-tag status-tag--success">
                    可信分 {act.trustScore}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Push frequency */}
      <Card
        variant="borderless"
        className="admin-stat-card"
        title={
          <span className="flex items-center gap-2">
            <Bell size={16} className="text-info" />
            推送频率配置
          </span>
        }
      >
        <Radio.Group
          value={frequency}
          onChange={e => setFrequency(e.target.value)}
          style={{ width: '100%' }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Radio.Button
                value="realtime"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  height: 'auto',
                  padding: '12px 16px',
                  borderRadius: 8,
                  borderColor: frequency === 'realtime' ? 'var(--brand)' : undefined,
                }}
              >
                <div>
                  <div className="text-sm font-semibold">实时推送</div>
                  <div className="text-xs text-ink-muted mt-1">活动上架后立即推送</div>
                </div>
              </Radio.Button>
            </Col>
            <Col xs={24} sm={8}>
              <Radio.Button
                value="daily"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  height: 'auto',
                  padding: '12px 16px',
                  borderRadius: 8,
                  borderColor: frequency === 'daily' ? 'var(--brand)' : undefined,
                }}
              >
                <div>
                  <div className="text-sm font-semibold">每日汇总</div>
                  <div className="text-xs text-ink-muted mt-1">每天 08:00 汇总推送</div>
                </div>
              </Radio.Button>
            </Col>
            <Col xs={24} sm={8}>
              <Radio.Button
                value="weekly"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  height: 'auto',
                  padding: '12px 16px',
                  borderRadius: 8,
                  borderColor: frequency === 'weekly' ? 'var(--brand)' : undefined,
                }}
              >
                <div>
                  <div className="text-sm font-semibold">每周汇总</div>
                  <div className="text-xs text-ink-muted mt-1">每周一 08:00 汇总推送</div>
                </div>
              </Radio.Button>
            </Col>
          </Row>
        </Radio.Group>

        <div className="mt-4 rounded-lg bg-surface-subtle p-3">
          <div className="text-xs text-ink-muted mb-1">当前配置预览</div>
          <div className="text-sm text-ink-secondary">
            {geoPushEnabled && <span className="mr-2">地理活动推送（{geoRadius}km）</span>}
            {nationalPushEnabled && <span className="mr-2">全国活动推送</span>}
            {!geoPushEnabled && !nationalPushEnabled && <span className="text-ink-muted">暂无开启的推送通道</span>}
            {pinnedIds.length > 0 && <span className="mr-2">· 置顶 {pinnedIds.length} 个活动</span>}
            {' · '}
            <span>{frequencyLabels[frequency]}</span>
          </div>
        </div>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          type="primary"
          size="large"
          icon={<Save size={16} />}
          loading={saving}
          onClick={handleSave}
          style={{ minWidth: 140 }}
        >
          保存推送配置
        </Button>
      </div>
    </div>
  )
}
