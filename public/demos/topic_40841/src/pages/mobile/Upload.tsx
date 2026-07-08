import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { message } from 'antd'
import { Upload as UploadIcon, Check, MapPin, GraduationCap, Trophy, Info } from 'lucide-react'
import { useStore } from '@/store'
import type { ActivityType } from '@/types'

const TYPE_OPTIONS: { value: ActivityType; label: string; icon: typeof MapPin; desc: string }[] = [
  { value: 'geo', label: '附近活动', icon: MapPin, desc: '福利领取、义诊、促销等地理位置活动' },
  { value: 'cert', label: '考证信息', icon: GraduationCap, desc: '职业资格考试、技能认证等' },
  { value: 'contest', label: '赛事活动', icon: Trophy, desc: '学科竞赛、科技竞赛等' },
]

export default function Upload() {
  const navigate = useNavigate()
  const submitUpload = useStore(s => s.submitUpload)

  const [title, setTitle] = useState('')
  const [type, setType] = useState<ActivityType>('geo')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = () => {
    if (!title.trim()) {
      message.warning('请填写活动标题')
      return
    }
    if (!description.trim()) {
      message.warning('请填写活动描述')
      return
    }
    setSubmitting(true)
    // Simulate AI review delay
    setTimeout(() => {
      submitUpload({
        title: title.trim(),
        type,
        description: description.trim(),
        submitter: '演示用户',
      })
      setSubmitting(false)
      setShowSuccess(true)
      setTimeout(() => {
        navigate('/app/my-uploads')
      }, 1500)
    }, 600)
  }

  const selectedOption = TYPE_OPTIONS.find(o => o.value === type)!

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface-card px-4 pb-3 pt-3 shadow-sm">
        <div className="flex items-center gap-2">
          <UploadIcon size={20} className="text-brand" />
          <h1 className="text-[18px] font-semibold text-ink">上传活动</h1>
        </div>
        <p className="mt-1 text-[12px] text-ink-muted">
          提交后 AI 初审，人工核实通过后发布
        </p>
      </div>

      <AnimatePresence mode="wait">
        {showSuccess ? (
          /* Success state */
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center px-6 pt-24"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-brand"
            >
              <Check size={40} className="text-white" strokeWidth={3} />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-[18px] font-semibold text-ink"
            >
              提交成功
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-1 text-[13px] text-ink-muted"
            >
              AI 初审已完成，正在跳转到我的上传...
            </motion.p>
          </motion.div>
        ) : (
          /* Form */
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pt-3"
          >
            {/* Title */}
            <div className="mobile-card p-4">
              <label className="mb-2 block text-[14px] font-semibold text-ink-secondary">
                活动标题
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="请输入活动标题（如：社区免费义诊）"
                maxLength={50}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-[14px] text-ink-secondary placeholder:text-ink-muted focus:border-brand focus:outline-none"
              />
            </div>

            {/* Type select */}
            <div className="mobile-card mt-3 p-4">
              <label className="mb-2 block text-[14px] font-semibold text-ink-secondary">
                活动类型
              </label>
              <div className="space-y-2">
                {TYPE_OPTIONS.map(opt => {
                  const Icon = opt.icon
                  const selected = type === opt.value
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setType(opt.value)}
                      className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors"
                      style={{
                        borderColor: selected ? 'var(--brand)' : 'var(--border)',
                        backgroundColor: selected ? 'var(--brand-light)' : 'var(--bg-card)',
                      }}
                    >
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: selected ? 'var(--brand)' : 'var(--bg-subtle)',
                        }}
                      >
                        <Icon
                          size={18}
                          style={{ color: selected ? 'var(--text-inverse)' : 'var(--text-muted)' }}
                        />
                      </div>
                      <div className="flex-1">
                        <div
                          className="text-[14px] font-medium"
                          style={{ color: selected ? 'var(--brand)' : 'var(--text-primary)' }}
                        >
                          {opt.label}
                        </div>
                        <div className="text-[11px] text-ink-muted">{opt.desc}</div>
                      </div>
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded-full border-2"
                        style={{
                          borderColor: selected ? 'var(--brand)' : 'var(--border)',
                          backgroundColor: selected ? 'var(--brand)' : 'transparent',
                        }}
                      >
                        {selected && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Description */}
            <div className="mobile-card mt-3 p-4">
              <label className="mb-2 block text-[14px] font-semibold text-ink-secondary">
                活动描述
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="请描述活动的时间、地点、主办方、参与方式等关键信息..."
                rows={5}
                maxLength={500}
                className="w-full resize-none rounded-lg border border-border px-3 py-2.5 text-[14px] leading-relaxed text-ink-secondary placeholder:text-ink-muted focus:border-brand focus:outline-none"
              />
              <div className="mt-1 text-right text-[11px] text-ink-muted">
                {description.length}/500
              </div>
            </div>

            {/* AI review notice */}
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-brand/20 bg-brand-light p-3">
              <Info size={15} className="mt-0.5 flex-shrink-0 text-brand" />
              <div className="text-[12px] leading-relaxed text-ink-secondary">
                <span className="font-medium text-brand">AI 初审说明：</span>
                提交后系统将自动检测风险关键词（如"包过""代报名"等），并给出建议可信分。通过初审后由人工核实发布。
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting}
              className="mobile-btn-primary mt-4 flex w-full items-center justify-center gap-2 py-3.5 text-[15px] font-medium disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                  />
                  AI 初审中...
                </>
              ) : (
                <>
                  <UploadIcon size={18} />
                  提交上传
                </>
              )}
            </button>

            {/* Selected type hint */}
            <p className="mt-3 text-center text-[12px] text-ink-muted">
              当前选择：{selectedOption.label}
            </p>

            <div className="h-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
