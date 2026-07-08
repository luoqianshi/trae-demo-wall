import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, ShieldAlert, AlertTriangle, ShieldCheck, Phone,
} from 'lucide-react'

interface GuideSection {
  icon: typeof ShieldAlert
  iconColor: string
  iconBg: string
  title: string
  points: string[]
}

const SECTIONS: GuideSection[] = [
  {
    icon: ShieldAlert,
    iconColor: 'var(--danger)',
    iconBg: 'var(--danger-bg)',
    title: '如何辨别虚假活动',
    points: [
      '主办方无法提供工商备案信息或官方资质证明',
      '活动地址为临时租用场地（如短租写字楼、酒店会议室）',
      '要求预付定金、押金或购买指定产品才能参加',
      '宣传"零基础包过""限时抢购""内部名额"等话术',
      '官方网站无法访问或域名注册时间极短',
      '现场有高压销售行为，限制参与者自由离开',
    ],
  },
  {
    icon: AlertTriangle,
    iconColor: 'var(--warning)',
    iconBg: 'var(--warning-bg)',
    title: '常见骗局类型',
    points: [
      '免费旅游骗局：以免费旅游为名，实际为保健品推销会',
      '考证包过骗局：宣传"零基础速成包过"，收取高额培训费后跑路',
      '扫码送礼骗局：要求填写身份证号、手机号等敏感信息换取礼品',
      '虚假义诊骗局：以免费义诊为名，推销高价保健品或医疗器械',
      '预付定金骗局：以优惠活动为名要求预付定金，随后失联',
      '代报名骗局：声称可代报名资格考试，收取服务费后消失',
    ],
  },
  {
    icon: ShieldCheck,
    iconColor: 'var(--success)',
    iconBg: 'var(--success-bg)',
    title: '安全参与建议',
    points: [
      '优先选择政府机构、知名企业主办的活动',
      '核实主办方工商信息及官方备案',
      '通过官方渠道报名，不轻信中介或代办',
      '不提供身份证原件、银行卡号等敏感信息',
      '保留活动宣传截图、聊天记录等证据',
      '活动前查看平台可信分及用户评价',
      '如遇可疑情况，及时向平台举报',
    ],
  },
  {
    icon: Phone,
    iconColor: 'var(--info)',
    iconBg: 'var(--info-bg)',
    title: '遇到诈骗怎么办',
    points: [
      '立即停止参与，保留所有证据（截图、录音、收据等）',
      '拨打 110 报警，或拨打 12315 消费者投诉热线',
      '在平台内点击"举报"按钮提交举报信息',
      '如已造成财产损失，及时联系银行冻结账户',
      '向当地市场监管部门投诉举报',
      '提醒身边亲友注意防范同类骗局',
    ],
  },
]

export default function Guide() {
  const navigate = useNavigate()

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
        <h1 className="text-[17px] font-semibold text-ink">防骗指南</h1>
      </div>

      {/* Intro banner */}
      <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-brand/20 bg-brand-light p-3">
        <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-brand" />
        <p className="text-[12px] leading-relaxed text-ink-secondary">
          本指南汇总了常见活动骗局类型及防范建议，帮助您安全参与各类惠民活动。如遇可疑活动，请及时举报。
        </p>
      </div>

      {/* Sections */}
      <div className="mt-3 space-y-3 px-4">
        {SECTIONS.map((section, i) => {
          const Icon = section.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="mobile-card p-4"
            >
              {/* Section title */}
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: section.iconBg }}
                >
                  <Icon size={18} style={{ color: section.iconColor }} />
                </div>
                <h2 className="text-[15px] font-semibold text-ink">{section.title}</h2>
              </div>

              {/* Bullet points */}
              <div className="space-y-2">
                {section.points.map((point, pi) => (
                  <div key={pi} className="flex items-start gap-2">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: section.iconColor }}
                    />
                    <span className="text-[13px] leading-relaxed text-ink-secondary">{point}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Emergency contact */}
      <div className="mx-4 mt-4 mb-6 rounded-2xl bg-gradient-to-br from-[var(--danger)] to-[#B91C1C] p-4 text-white">
        <div className="flex items-center gap-2">
          <Phone size={18} />
          <h3 className="text-[15px] font-semibold">紧急求助电话</h3>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-white/15 p-3">
            <div className="text-[20px] font-bold">110</div>
            <div className="text-[11px] text-white/80">报警电话</div>
          </div>
          <div className="rounded-lg bg-white/15 p-3">
            <div className="text-[20px] font-bold">12315</div>
            <div className="text-[11px] text-white/80">消费者投诉</div>
          </div>
        </div>
      </div>
    </div>
  )
}
