import { useState } from 'react'
import { Card, Slider, Tag, Input, Button, Space, message, Divider, Row, Col, Progress } from 'antd'
import { Settings, Tag as TagIcon, Plus, X, Save, RotateCcw, AlertTriangle } from 'lucide-react'

interface WeightFactor {
  key: string
  label: string
  desc: string
  value: number
  color: string
}

const defaultFactors: WeightFactor[] = [
  { key: 'organizer', label: '主办方资质', desc: '主办方工商备案、官方资质核验', value: 30, color: 'var(--brand)' },
  { key: 'crossSource', label: '信源交叉验证', desc: '多渠道信息交叉比对一致性', value: 25, color: 'var(--info)' },
  { key: 'history', label: '历史记录', desc: '主办方历史活动记录与投诉情况', value: 25, color: 'var(--info)' },
  { key: 'feedback', label: '用户反馈', desc: '用户举报、评价与参与反馈', value: 20, color: 'var(--warning)' },
]

const defaultKeywords = [
  '免费旅游',
  '零基础包过',
  '保健品推销',
  '限时抢购',
  '身份证号',
  '高价培训贷',
  '包就业',
  '内部名额',
  '代报名',
  '短租场地',
]

export default function TrustRules() {
  const [factors, setFactors] = useState<WeightFactor[]>(defaultFactors)
  const [keywords, setKeywords] = useState<string[]>(defaultKeywords)
  const [newKeyword, setNewKeyword] = useState('')

  const totalWeight = factors.reduce((sum, f) => sum + f.value, 0)

  const handleSliderChange = (key: string, value: number) => {
    setFactors(prev => prev.map(f => (f.key === key ? { ...f, value } : f)))
  }

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim()
    if (!trimmed) {
      message.warning('请输入关键词')
      return
    }
    if (keywords.includes(trimmed)) {
      message.warning('该关键词已存在')
      return
    }
    setKeywords(prev => [...prev, trimmed])
    setNewKeyword('')
    message.success(`已添加关键词：${trimmed}`)
  }

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(prev => prev.filter(k => k !== kw))
    message.success(`已移除关键词：${kw}`)
  }

  const handleSave = () => {
    if (totalWeight !== 100) {
      message.error(`权重总和需为100%，当前为${totalWeight}%`)
      return
    }
    message.success('可信度规则已保存')
  }

  const handleReset = () => {
    setFactors(defaultFactors)
    setKeywords(defaultKeywords)
    setNewKeyword('')
    message.success('已恢复默认配置')
  }

  return (
    <div className="space-y-4">
      {/* Weight sliders */}
      <Card
        variant="borderless"
        className="admin-stat-card"
        title={
          <span className="flex items-center gap-2">
            <Settings size={16} className="text-brand" />
            可信度评分权重配置
          </span>
        }
        extra={
          <Space>
            <Button icon={<RotateCcw size={14} />} onClick={handleReset}>恢复默认</Button>
            <Button
              type="primary"
              icon={<Save size={14} />}
              onClick={handleSave}
            >
              保存配置
            </Button>
          </Space>
        }
      >
        {/* Total weight indicator */}
        <div className="mb-6 rounded-lg p-4" style={{ backgroundColor: totalWeight === 100 ? 'var(--success-bg)' : 'var(--warning-bg)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink-secondary">权重总和</span>
            <span
              className="text-2xl font-bold"
              style={{ color: totalWeight === 100 ? 'var(--brand)' : 'var(--warning)' }}
            >
              {totalWeight}%
            </span>
          </div>
          <Progress
            percent={totalWeight}
            strokeColor={totalWeight === 100 ? 'var(--brand)' : 'var(--warning)'}
            showInfo={false}
          />
          <div className="mt-1 text-xs" style={{ color: totalWeight === 100 ? 'var(--brand)' : 'var(--warning)' }}>
            {totalWeight === 100
              ? '权重配置正确，各项总和为100%'
              : `权重总和需为100%，当前${totalWeight > 100 ? '超出' : '还差'}${Math.abs(100 - totalWeight)}%`}
          </div>
        </div>

        <Row gutter={[24, 24]}>
          {factors.map(factor => (
            <Col xs={24} sm={12} key={factor.key}>
              <div className="rounded-lg border border-border-subtle p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: factor.color }}
                    />
                    <span className="text-sm font-semibold text-ink">{factor.label}</span>
                  </div>
                  <span
                    className="text-lg font-bold"
                    style={{ color: factor.color }}
                  >
                    {factor.value}%
                  </span>
                </div>
                <div className="text-xs text-ink-muted mb-3">{factor.desc}</div>
                <Slider
                  min={0}
                  max={60}
                  value={factor.value}
                  onChange={v => handleSliderChange(factor.key, v)}
                  trackStyle={{ backgroundColor: factor.color }}
                  handleStyle={{ backgroundColor: factor.color, borderColor: factor.color }}
                  marks={{ 0: '0%', 30: '30%', 60: '60%' }}
                />
              </div>
            </Col>
          ))}
        </Row>

        <Divider />

        {/* Scoring formula preview */}
        <div className="rounded-lg bg-surface-subtle p-4">
          <div className="text-xs text-ink-muted mb-2">可信度计算公式</div>
          <div className="text-sm text-ink-secondary leading-relaxed">
            可信分 ={' '}
            {factors.map((f, i) => (
              <span key={f.key}>
                <span style={{ color: f.color, fontWeight: 600 }}>{f.label}</span>
                <span className="text-ink-muted"> × {f.value}%</span>
                {i < factors.length - 1 && <span className="text-ink-muted"> + </span>}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Risk keyword management */}
      <Card
        variant="borderless"
        className="admin-stat-card"
        title={
          <span className="flex items-center gap-2">
            <TagIcon size={16} className="text-danger" />
            风险关键词管理
            <span className="status-tag status-tag--danger" style={{ marginLeft: 4 }}>
              {keywords.length} 个
            </span>
          </span>
        }
        extra={
          <span className="flex items-center gap-1 text-xs text-ink-muted">
            <AlertTriangle size={12} className="text-warning" />
            命中关键词将降低可信分
          </span>
        }
      >
        <div className="mb-4 flex items-center gap-2">
          <Input
            placeholder="输入风险关键词，如：免费旅游、包过、代报名"
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            onPressEnter={handleAddKeyword}
            prefix={<Plus size={14} className="text-ink-muted" />}
            style={{ maxWidth: 360 }}
          />
          <Button
            type="primary"
            icon={<Plus size={14} />}
            onClick={handleAddKeyword}
          >
            添加
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {keywords.length === 0 ? (
            <div className="text-sm text-ink-muted py-4">暂无风险关键词</div>
          ) : (
            keywords.map(kw => (
              <Tag
                key={kw}
                closable
                closeIcon={<X size={12} />}
                onClose={e => {
                  e.preventDefault()
                  handleRemoveKeyword(kw)
                }}
                style={{
                  padding: '4px 10px',
                  fontSize: 13,
                  color: 'var(--danger)',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 6,
                }}
              >
                {kw}
              </Tag>
            ))
          )}
        </div>

        <Divider />

        <div className="rounded-lg bg-surface-subtle p-3">
          <div className="text-xs text-ink-muted mb-1">规则说明</div>
          <ul className="text-xs text-ink-secondary m-0 pl-4 space-y-1">
            <li>每命中一个风险关键词，可信分扣减 10 分</li>
            <li>命中 3 个及以上关键词，自动标记为高风险并拦截</li>
            <li>命中 1-2 个关键词，标记为中风险并转人工审核</li>
            <li>关键词匹配支持模糊匹配，如"包过"可匹配"零基础包过"</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
