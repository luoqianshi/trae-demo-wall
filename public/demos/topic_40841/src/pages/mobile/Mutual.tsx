import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { message, Modal, Input, Select } from 'antd'
import {
  Info, MapPin, Clock, ShieldCheck, Package, FileText, UserCheck,
  ClipboardList, Plus, HeartHandshake,
} from 'lucide-react'
import { useStore } from '@/store'
import MobileSubpageHeader from '@/components/MobileSubpageHeader'
import type { QualificationType, QualificationStatus, SurplusItem } from '@/types'

const TABS = ['今日余量', '领取说明', '我的申请'] as const
type Tab = typeof TABS[number]

const QUAL_TYPE_LABELS: Record<QualificationType, string> = {
  sanitation_worker: '环卫工人',
  disabled: '残障人士',
  low_income: '低收入家庭',
  elderly_alone: '独居老人',
}

const QUAL_TYPE_OPTIONS = Object.entries(QUAL_TYPE_LABELS).map(([value, label]) => ({
  value: value as QualificationType,
  label,
}))

const QUAL_STATUS_META: Record<QualificationStatus, { text: string; color: string; bg: string }> = {
  pending_review: { text: '审核中', color: 'var(--warning)', bg: 'var(--warning-bg)' },
  pending_match: { text: '待匹配', color: 'var(--success)', bg: 'var(--success-bg)' },
  completed: { text: '已完成', color: 'var(--text-muted)', bg: 'var(--bg-subtle)' },
  rejected: { text: '已驳回', color: 'var(--danger)', bg: 'var(--danger-bg)' },
}

const SURPLUS_STATUS_META: Record<SurplusItem['status'], { text: string; color: string; bg: string }> = {
  available: { text: '可领取', color: 'var(--success)', bg: 'var(--success-bg)' },
  claimed: { text: '已领取', color: 'var(--text-muted)', bg: 'var(--bg-subtle)' },
  expired: { text: '已过期', color: 'var(--danger)', bg: 'var(--danger-bg)' },
}

export default function Mutual() {
  const surplusItems = useStore(s => s.surplusItems)
  const qualifications = useStore(s => s.qualifications)
  const addQualification = useStore(s => s.addQualification)

  const [tab, setTab] = useState<Tab>('今日余量')
  const [formOpen, setFormOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<QualificationType>('sanitation_worker')
  const [formDesc, setFormDesc] = useState('')

  const handleSubmit = () => {
    if (!formName.trim()) {
      message.warning('请填写姓名')
      return
    }
    if (!formDesc.trim()) {
      message.warning('请填写情况说明')
      return
    }
    addQualification({ applicantName: formName, type: formType, description: formDesc })
    message.success('申请已提交，工作人员将在 3 个工作日内审核')
    setFormName('')
    setFormDesc('')
    setFormType('sanitation_worker')
    setFormOpen(false)
    setTab('我的申请')
  }

  return (
    <div className="min-h-screen pb-2">
      <MobileSubpageHeader
        title="余量互助"
        icon={<HeartHandshake size={18} className="text-brand" />}
        subtitle="规划预览 · 演示数据"
        tabs={TABS.map(t => ({ key: t, label: t }))}
        activeTab={tab}
        onTabChange={key => setTab(key as Tab)}
      />

      <div className="mobile-notice-bar">
        <Info size={15} className="mt-0.5 flex-shrink-0 text-warning" />
        <p>正式版需人工审核领取资质后方可领取余量食品。</p>
      </div>

      <div className="mobile-page-body">
        <AnimatePresence mode="wait">
          {tab === '今日余量' && (
            <motion.div
              key="今日余量"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {surplusItems.map((item, i) => {
                const statusMeta = SURPLUS_STATUS_META[item.status]
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    className="mobile-card overflow-hidden"
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Package size={15} className="text-brand" />
                        <span className="text-[14px] font-semibold text-ink">{item.shopName}</span>
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ color: statusMeta.color, backgroundColor: statusMeta.bg }}
                      >
                        {statusMeta.text}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="text-[15px] font-medium text-ink">{item.itemName}</h3>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="rounded bg-success-bg px-1.5 py-0.5 text-[11px] text-brand">
                              {item.foodType}
                            </span>
                            <span className="text-[12px] text-ink-muted">余 {item.quantity} 份</span>
                            {item.safetyVerified && (
                              <span className="flex items-center gap-0.5 text-[11px] text-brand">
                                <ShieldCheck size={11} />
                                食安已核
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Info rows */}
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-[12px] text-ink-muted">
                          <Clock size={13} className="flex-shrink-0 text-ink-muted" />
                          <span>{item.pickupTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-ink-muted">
                          <MapPin size={13} className="flex-shrink-0 text-ink-muted" />
                          <span className="flex-1">{item.address}</span>
                          <span className="text-[11px] text-ink-muted">{item.distance}km</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}

              {surplusItems.length === 0 && (
                <div className="mobile-empty-state">
                  <Package size={40} strokeWidth={1.2} />
                  <p className="mt-3 text-sm">今日暂无余量</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Tab 2: 领取说明 */}
          {tab === '领取说明' && (
            <motion.div
              key="领取说明"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="mobile-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-bg">
                    <UserCheck size={16} className="text-brand" />
                  </div>
                  <h3 className="mobile-section-title">如何申请领取资质</h3>
                </div>
                <div className="space-y-2">
                  {[
                    '在"我的申请"页面点击"申请资格"按钮',
                    '填写真实姓名、身份类型及情况说明',
                    '上传相关证明材料（身份证、工作证等）',
                    '等待工作人员人工审核（3 个工作日内）',
                    '审核通过后即可在"今日余量"领取食品',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="text-[13px] leading-relaxed text-ink-secondary">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mobile-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-bg">
                    <ShieldCheck size={16} className="text-warning" />
                  </div>
                  <h3 className="mobile-section-title">食品安全须知</h3>
                </div>
                <div className="space-y-2">
                  {[
                    '仅领取平台标注"食安已核"的食品',
                    '领取时请检查食品外观及保质期',
                    '即食类食品请在 2 小时内食用',
                    '如发现食品质量问题请立即举报',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ShieldCheck size={14} className="mt-0.5 flex-shrink-0 text-brand" />
                      <span className="text-[13px] leading-relaxed text-ink-secondary">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mobile-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg">
                    <Clock size={16} className="text-danger" />
                  </div>
                  <h3 className="mobile-section-title">领取规则</h3>
                </div>
                <div className="space-y-2">
                  {[
                    '请在规定时间内到达门店领取',
                    '每人每日限领 1 份余量食品',
                    '领取时需出示资质审核通过凭证',
                    '逾期未领取视为自动放弃',
                  ].map((rule, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-danger" />
                      <span className="text-[13px] leading-relaxed text-ink-secondary">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 3: 我的申请 */}
          {tab === '我的申请' && (
            <motion.div
              key="我的申请"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* Apply button */}
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-[14px] font-medium text-white transition-transform active:scale-[0.98]"
              >
                <Plus size={18} />
                申请资格
              </button>

              {/* Qualification list */}
              {qualifications.map((qual, i) => {
                const statusMeta = QUAL_STATUS_META[qual.status]
                return (
                  <motion.div
                    key={qual.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    className="mobile-card p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success-bg">
                          <ClipboardList size={16} className="text-brand" />
                        </div>
                        <div>
                          <div className="text-[14px] font-semibold text-ink">{qual.applicantName}</div>
                          <div className="text-[11px] text-ink-muted">{QUAL_TYPE_LABELS[qual.type]}</div>
                        </div>
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ color: statusMeta.color, backgroundColor: statusMeta.bg }}
                      >
                        {statusMeta.text}
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{qual.description}</p>
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-ink-muted">
                      <Clock size={11} />
                      {qual.createdAt}
                    </div>
                  </motion.div>
                )
              })}

              {qualifications.length === 0 && (
                <div className="mobile-empty-state">
                  <FileText size={40} strokeWidth={1.2} />
                  <p className="mt-3 text-sm">暂无申请记录</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mobile-page-footer-spacer" />
      <Modal
        title="申请领取资质"
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={handleSubmit}
        okText="提交申请"
        cancelText="取消"
        okButtonProps={{ style: { backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' } }}
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-secondary">姓名</label>
            <Input
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="请输入真实姓名"
              maxLength={20}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-secondary">身份类型</label>
            <Select
              value={formType}
              onChange={v => setFormType(v)}
              options={QUAL_TYPE_OPTIONS}
              className="w-full"
              placeholder="请选择身份类型"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-secondary">情况说明</label>
            <Input.TextArea
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              placeholder="请简要描述您的实际情况，便于工作人员审核"
              rows={4}
              maxLength={200}
              showCount
            />
          </div>
        </div>
      </Modal>

      {/* Bottom spacer */}
      <div className="h-6" />
    </div>
  )
}
