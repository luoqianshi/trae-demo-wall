import { useState } from 'react'
import { useUIStore } from '../stores/useUIStore'
import { Play, MessageSquare, CheckCircle2, Bell } from 'lucide-react'

const STEPS = [
  {
    id: 'morning',
    time: '08:00',
    title: '主动提醒',
    shortDesc: '衡舟发现你今天还没给妈妈回消息，主动在首页弹出提醒。',
    detailDesc: '在你昨晚的日记中提到「妈妈打电话来说端午节想让我回绍兴」。衡舟自动识别出「回绍兴」是一个待确认的行程，并在今天早上 8 点生成提醒，避免你因为忙而忘记回复。',
    tryPrompt: '帮我写一条回复妈妈的消息，告诉她我端午节会回绍兴',
    icon: Bell,
  },
  {
    id: 'chat',
    time: '12:30',
    title: '一句话倾诉',
    shortDesc: '你在午休时输入：“最近压力大，想辞职”。衡舟结合你的家庭、健康、财务档案给出交叉分析。',
    detailDesc: '你只需像和朋友聊天一样倾诉一句，衡舟就会调用记忆检索、人物关系图谱和 Agent 团队，从职场、家庭、健康、财务多个维度给出交叉分析，而不是给出一堆泛泛而谈的建议。',
    tryPrompt: '最近压力大，想辞职，但我又担心房贷和家庭开支',
    icon: MessageSquare,
  },
  {
    id: 'memory',
    time: '14:00',
    title: '记忆确认',
    shortDesc: '系统自动提取出“考虑辞职”“担心房贷”两条记忆，等你确认后写入第二大脑。',
    detailDesc: '衡舟会从对话中自动提取关键事实、待办事项和情绪信号，并在「记忆确认」页以卡片形式呈现。你点一下确认，它才会写入你的私人记忆库，成为你后续咨询的依据。',
    tryPrompt: '提取我今天提到的重要决定和担忧',
    icon: CheckCircle2,
  },
  {
    id: 'action',
    time: '18:00',
    title: '可执行建议',
    shortDesc: '晚上衡舟提醒你：“可以先和妻子晓薇沟通，再算一笔 6 个月现金流”。',
    detailDesc: '到了傍晚，衡舟不会只给鸡汤，而是把分析转化为可执行的下一步：先和重要关系人沟通，再做一次家庭现金流测算，让焦虑变成具体行动。',
    tryPrompt: '帮我列一个今晚可以和晓薇沟通的话题清单',
    icon: Play,
  },
]

export function DemoDayPage() {
  const [active, setActive] = useState(0)
  const setActiveNav = useUIStore((s) => s.setActiveNav)

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-medium text-ink-primary">决赛演示：陈志远的一天</h2>
          <button
            onClick={() => setActiveNav('对话')}
            className="text-xs px-3 py-1.5 rounded-lg bg-zen-terracotta/10 text-zen-terracotta hover:bg-zen-terracotta/20 transition-colors"
          >
            返回对话
          </button>
        </div>

        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon
            const isActive = idx === active
            return (
              <button
                key={step.id}
                onClick={() => setActive(idx)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-zen-terracotta/10 border-zen-terracotta/30'
                    : 'bg-surface border-ink-muted/10 hover:border-ink-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-tertiary w-12">{step.time}</span>
                  <div className="w-8 h-8 rounded-lg bg-canvas flex items-center justify-center">
                    <Icon className="w-4 h-4 text-zen-terracotta" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-primary">{step.title}</p>
                    <p className="text-xs text-ink-tertiary mt-1 leading-relaxed">{step.shortDesc}</p>
                  </div>
                </div>
                {isActive && (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs text-ink-tertiary leading-relaxed">{step.detailDesc}</p>
                    {step.tryPrompt && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          localStorage.setItem('hengzhou_pending_prompt', step.tryPrompt)
                          setActiveNav('对话')
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-zen-terracotta text-white hover:bg-zen-terracotta/90 transition-colors"
                      >
                        亲自试试
                      </button>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
