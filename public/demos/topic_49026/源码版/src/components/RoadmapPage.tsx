import { Monitor, Mail, Plane, Glasses, Headphones, Home, Watch, Brain, Shield, Users, AlertTriangle, MapPin, Lock, HardDrive, Eye } from 'lucide-react'
import { BackHeader } from './BackHeader'

interface RoadmapPageProps {
  onClose: () => void
}

interface RoadmapItem {
  icon: React.ReactNode
  title: string
  description: string
  tag: string
  tagColor: string
}

interface RoadmapPhase {
  period: string
  subtitle: string
  dotColor: string
  items: RoadmapItem[]
}

const phases: RoadmapPhase[] = [
  {
    period: '近期（3个月内）',
    subtitle: '夯实基础，提升效率',
    dotColor: 'bg-zen-sage',
    items: [
      {
        icon: <Monitor className="w-5 h-5" />,
        title: '电脑端控制',
        description: '文件管理、邮件收发、日程同步，一站式掌控你的数字工作台。',
        tag: '开发中',
        tagColor: 'bg-zen-sage/10 text-zen-sage',
      },
      {
        icon: <Mail className="w-5 h-5" />,
        title: '邮箱系统接入',
        description: '自动分类重要邮件，提供智能回复建议，让沟通更高效。',
        tag: '开发中',
        tagColor: 'bg-zen-sage/10 text-zen-sage',
      },
      {
        icon: <Plane className="w-5 h-5" />,
        title: '票务/出行管理',
        description: '航班、火车票自动同步，行程提醒不错过任何一次出发。',
        tag: '规划中',
        tagColor: 'bg-zen-amber/10 text-zen-amber',
      },
    ],
  },
  {
    period: '中期（6-12个月）',
    subtitle: '硬件融合，场景延伸',
    dotColor: 'bg-zen-amber',
    items: [
      {
        icon: <Glasses className="w-5 h-5" />,
        title: 'AI 眼镜接入',
        description: '第一人称视角记忆，所见即所记，让回忆更加鲜活立体。',
        tag: '调研中',
        tagColor: 'bg-zen-indigo/10 text-zen-indigo',
      },
      {
        icon: <Headphones className="w-5 h-5" />,
        title: 'AI 耳机接入',
        description: '语音实时记录，随时捕捉灵感与对话，解放双手。',
        tag: '调研中',
        tagColor: 'bg-zen-indigo/10 text-zen-indigo',
      },
      {
        icon: <Home className="w-5 h-5" />,
        title: '智能家居联动',
        description: '根据心情自动调节灯光与音乐，营造最舒适的生活氛围。',
        tag: '规划中',
        tagColor: 'bg-zen-amber/10 text-zen-amber',
      },
      {
        icon: <Watch className="w-5 h-5" />,
        title: '健康设备集成',
        description: '智能手表数据同步，睡眠质量分析，关注你的身心健康。',
        tag: '规划中',
        tagColor: 'bg-zen-amber/10 text-zen-amber',
      },
    ],
  },
  {
    period: '远期（1-3年）',
    subtitle: '智能进化，预见未来',
    dotColor: 'bg-zen-terracotta',
    items: [
      {
        icon: <Brain className="w-5 h-5" />,
        title: '数字分身',
        description: '基于完整个人知识库训练专属模型，让 AI 真正理解你。',
        tag: '调研中',
        tagColor: 'bg-zen-indigo/10 text-zen-indigo',
      },
      {
        icon: <Shield className="w-5 h-5" />,
        title: '跨平台记忆',
        description: '多设备无缝同步，离线优先架构，记忆永不丢失。',
        tag: '规划中',
        tagColor: 'bg-zen-amber/10 text-zen-amber',
      },
      {
        icon: <Users className="w-5 h-5" />,
        title: '社交智能',
        description: '自动维护人际关系，生日与纪念日主动提醒并建议礼物。',
        tag: '调研中',
        tagColor: 'bg-zen-indigo/10 text-zen-indigo',
      },
      {
        icon: <AlertTriangle className="w-5 h-5" />,
        title: '预测性干预',
        description: '在问题发生前主动预警，如"你最近压力指标上升，建议休息一下"。',
        tag: '调研中',
        tagColor: 'bg-zen-indigo/10 text-zen-indigo',
      },
    ],
  },
]

export function RoadmapPage({ onClose }: RoadmapPageProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 内容面板 */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-surface rounded-2xl shadow-2xl border border-ink-muted/10 flex flex-col mx-4 overflow-hidden">
        {/* 头部 */}
        <BackHeader
          title="未来拓展方向"
          subtitle="衡舟的进化路线图"
          onBack={onClose}
        />

        {/* 时间轴内容 */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-10">
          {phases.map((phase, _phaseIndex) => (
            <div key={phase.period} className="relative">
              {/* 阶段标题 */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-3 h-3 rounded-full ${phase.dotColor} ring-4 ring-surface shadow-sm`} />
                <div>
                  <h3 className="text-base font-semibold text-ink-primary">{phase.period}</h3>
                  <p className="text-xs text-ink-tertiary">{phase.subtitle}</p>
                </div>
              </div>

              {/* 功能卡片列表 */}
              <div className="ml-1.5 pl-6 border-l-2 border-ink-muted/10 space-y-4">
                {phase.items.map((item, _itemIndex) => (
                  <div
                    key={item.title}
                    className="rounded-xl bg-canvas border border-ink-muted/10 p-4 hover:shadow-md hover:border-ink-muted/20 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface border border-ink-muted/10 flex items-center justify-center text-ink-secondary flex-shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-ink-primary">{item.title}</h4>
                          <span className={`text-2xs px-1.5 py-0.5 rounded-full font-medium ${item.tagColor}`}>
                            {item.tag}
                          </span>
                        </div>
                        <p className="text-xs text-ink-tertiary leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 底部隐私承诺 */}
          <div className="rounded-xl bg-gradient-to-br from-zen-sage/5 to-zen-indigo/5 border border-zen-sage/15 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-zen-sage" />
              <h3 className="text-sm font-medium text-ink-primary">我们致力于在保护隐私的前提下，让 AI 真正成为你的第二大脑</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-zen-sage/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-zen-sage" />
                </div>
                <div>
                  <div className="text-xs font-medium text-ink-primary">本地优先</div>
                  <p className="text-2xs text-ink-tertiary mt-0.5 leading-relaxed">核心数据存储在本地设备，不上传云端</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-zen-sage/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lock className="w-3.5 h-3.5 text-zen-sage" />
                </div>
                <div>
                  <div className="text-xs font-medium text-ink-primary">数据加密</div>
                  <p className="text-2xs text-ink-tertiary mt-0.5 leading-relaxed">敏感信息采用端到端加密存储</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-zen-sage/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <HardDrive className="w-3.5 h-3.5 text-zen-sage" />
                </div>
                <div>
                  <div className="text-xs font-medium text-ink-primary">用户可控</div>
                  <p className="text-2xs text-ink-tertiary mt-0.5 leading-relaxed">随时导出、删除，完全掌控你的数据</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
