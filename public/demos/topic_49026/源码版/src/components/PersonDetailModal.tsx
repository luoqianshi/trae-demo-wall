import { useEffect, useState } from 'react'
import {
  Users,
  Heart,
  Shield,
  Briefcase,
  Smile,
  MapPin,
  Sparkles,
  MessageCircle,
  Activity,
  Network,
  Target,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Star,
  Clock,
  TrendingUp,
  BarChart3,
  TrendingDown,
} from 'lucide-react'
import { BackHeader } from './BackHeader'
import { WarmthBar } from './ThermometerBar'
import { TrajectoryChart } from './TrajectoryChart'
import { MiniRelationGraph } from './MiniRelationGraph'
import { useDataStore } from '../stores/useDataStore'
import { getUserProfileObject } from '../lib/prompts'
import { warmthToColor, warmthLabel, warmthBgGradient } from '../lib/warmthColor'
import { predictTrajectory, type TrajectoryPrediction } from '../lib/trajectoryPrediction'
import { assessPerson, type PersonAssessment } from '../lib/personAssessment'
import type { Person, PersonConnection } from '../types'

// 将文本中的用户本人姓名和"用户"称呼替换为第二人称"你"
function replaceUserReferences(text: string): string {
  const profile = getUserProfileObject()
  const userName = profile.name?.trim()
  let result = text
  if (userName && userName.length >= 2) {
    result = result.replace(new RegExp(userName, 'g'), '你')
    if (userName.length >= 3) {
      const givenName = userName.slice(1)
      if (givenName.length >= 2) {
        result = result.replace(new RegExp(givenName, 'g'), '你')
      }
    }
  }
  // 替换"用户"为"你"
  result = result.replace(/用户/g, '你')
  return result
}

// 关系类型中文标签
const RELATIONSHIP_LABELS: Record<Person['relationship'], string> = {
  spouse: '配偶',
  family: '家人',
  colleague: '同事',
  friend: '朋友',
  leader: '领导',
  mentor: '导师',
  subordinate: '下属',
  client: '客户',
  rival: '竞争对手',
  other: '其他',
}

// 关系类型样式（使用自定义 zen 色板）
const RELATIONSHIP_STYLES: Record<Person['relationship'], string> = {
  spouse: 'bg-zen-rose/15 text-zen-rose',
  family: 'bg-zen-terracotta/15 text-zen-terracotta',
  colleague: 'bg-zen-indigo/15 text-zen-indigo',
  friend: 'bg-zen-sage/15 text-zen-sage',
  leader: 'bg-zen-amber/15 text-zen-amber',
  mentor: 'bg-zen-sage/15 text-zen-sage',
  subordinate: 'bg-zen-indigo/15 text-zen-indigo',
  client: 'bg-zen-amber/15 text-zen-amber',
  rival: 'bg-zen-rose/15 text-zen-rose',
  other: 'bg-ink-muted/10 text-ink-muted',
}

// 头像渐变色组（基于 zen 色板）
const AVATAR_GRADIENTS = [
  'from-zen-sage to-zen-indigo',
  'from-zen-terracotta to-zen-amber',
  'from-zen-rose to-zen-terracotta',
  'from-zen-indigo to-zen-sage',
  'from-zen-amber to-zen-rose',
  'from-zen-sage to-zen-amber',
  'from-zen-indigo to-zen-rose',
  'from-zen-terracotta to-zen-rose',
]

const GENDER_LABELS: Record<string, string> = {
  male: '男',
  female: '女',
  other: '其他',
}

const POWER_DYNAMIC_LABELS: Record<string, string> = {
  equal: '平等',
  superior: '我主导',
  subordinate: 'TA主导',
  complex: '复杂',
}

const CONNECTION_TYPE_LABELS: Record<PersonConnection['relationType'], string> = {
  family: '家人',
  colleague: '同事',
  friend: '朋友',
  partner: '伴侣',
  rival: '竞争对手',
  introduced_by: '介绍人',
  other: '其他',
}

// 完整的 Tailwind 类名映射（避免动态拼接类名导致 JIT 无法识别）
type ColorStyle = { text: string; bgLight: string; bg: string }
const COLOR_STYLES: Record<string, ColorStyle> = {
  'zen-sage': { text: 'text-zen-sage', bgLight: 'bg-zen-sage/10', bg: 'bg-zen-sage' },
  'zen-rose': { text: 'text-zen-rose', bgLight: 'bg-zen-rose/10', bg: 'bg-zen-rose' },
  'zen-amber': { text: 'text-zen-amber', bgLight: 'bg-zen-amber/10', bg: 'bg-zen-amber' },
  'zen-indigo': { text: 'text-zen-indigo', bgLight: 'bg-zen-indigo/10', bg: 'bg-zen-indigo' },
  'zen-terracotta': { text: 'text-zen-terracotta', bgLight: 'bg-zen-terracotta/10', bg: 'bg-zen-terracotta' },
}

// 根据人物 id 确定性地选取一个渐变色
function getAvatarGradient(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

// 取姓名首字作为头像文字
function getInitial(name: string): string {
  return name.charAt(0).toUpperCase()
}

// sentiment 已是 0~100 范围，直接作为温度值使用
function sentimentToTemperature(sentiment: number): number {
  return Math.max(0, Math.min(100, Math.round(sentiment)))
}

// 根据温度返回颜色（使用暖度色彩系统）
function getTemperatureColor(temp: number): string {
  return warmthToColor(temp)
}

// 格式化时间戳为简短日期
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

// 格式化相对时间
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}个月前`
  return `${Math.floor(days / 365)}年前`
}

interface PersonDetailModalProps {
  personId: string | null
  onClose: () => void
}

export function PersonDetailModal({ personId, onClose }: PersonDetailModalProps) {
  const persons = useDataStore((s) => s.persons)
  const memories = useDataStore((s) => s.memories)
  const [trajectory, setTrajectory] = useState<TrajectoryPrediction | null>(null)
  const [assessment, setAssessment] = useState<PersonAssessment | null>(null)

  // ESC 键关闭
  useEffect(() => {
    if (!personId) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [personId, onClose])

  // 计算关系轨迹预测
  useEffect(() => {
    if (!personId) {
      setTrajectory(null)
      return
    }
    const person = persons.find(p => p.id === personId)
    if (!person) {
      setTrajectory(null)
      return
    }
    try {
      const prediction = predictTrajectory(person, memories)
      setTrajectory(prediction)
    } catch (e) {
      console.warn('[PersonDetailModal] trajectory prediction failed:', e)
      setTrajectory(null)
    }
  }, [personId, persons, memories])

  // 计算人物分析（九征八观）
  useEffect(() => {
    if (!personId) {
      setAssessment(null)
      return
    }
    const person = persons.find(p => p.id === personId)
    if (!person) {
      setAssessment(null)
      return
    }
    try {
      const result = assessPerson(person)
      setAssessment(result)
    } catch (e) {
      console.warn('[PersonDetailModal] person assessment failed:', e)
      setAssessment(null)
    }
  }, [personId, persons])

  if (!personId) return null

  const person = persons.find((p) => p.id === personId)
  if (!person) return null

  const temperature = sentimentToTemperature(person.sentiment)
  const gradient = getAvatarGradient(person.id)
  const tempColor = getTemperatureColor(temperature)
  const { profile } = person

  // 大五人格数据
  const bigFive = [
    { label: '开放性', value: profile.personality.openness, desc: '好奇心与创造力' },
    { label: '尽责性', value: profile.personality.conscientiousness, desc: '自律与可靠' },
    { label: '外向性', value: profile.personality.extraversion, desc: '社交与活力' },
    { label: '宜人性', value: profile.personality.agreeableness, desc: '合作与信任' },
    { label: '神经质', value: profile.personality.neuroticism, desc: '情绪敏感度' },
  ]

  // 最近的关系温度变化（取最近5条，倒序）
  const recentSentiment = [...person.sentimentHistory].slice(-5).reverse()

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-ink-primary/30 backdrop-blur-sm"
        role="button"
        tabIndex={0}
        aria-label="关闭"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClose()
          }
        }}
      />

      {/* 弹窗主体 */}
      <div className="relative bg-surface rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <BackHeader
          title={person.name}
          subtitle="人物档案"
          onBack={onClose}
        />
        <div className="flex-shrink-0 px-5 py-4 relative overflow-hidden" style={{ background: warmthBgGradient(temperature, 0.42) }}>
          {/* 人物概要 */}
          <div className="flex items-center gap-3.5 relative z-10">
            {/* 头像 */}
            <div
              className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-medium text-xl flex-shrink-0`}
            >
              {getInitial(person.name)}
            </div>

            {/* 姓名 + 关系 + 温度 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-medium text-ink-primary truncate">{person.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RELATIONSHIP_STYLES[person.relationship]}`}>
                  {RELATIONSHIP_LABELS[person.relationship]}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-ink-tertiary">
                <span className="flex items-center gap-1" style={{ color: tempColor }}>
                  <Heart className="w-3.5 h-3.5" />
                  <span>{warmthLabel(temperature)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{person.interactionStats.totalCount} 次互动</span>
                </span>
              </div>
            </div>
          </div>

          {/* 暖度渐变条 */}
          <div className="mt-3 relative z-10">
            <WarmthBar temperature={temperature} />
          </div>
        </div>

        {/* 可滚动内容 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 pb-8">
          {/* === 身份信息 === */}
          <Section icon={<MapPin className="w-3.5 h-3.5" />} title="身份信息">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              <InfoItem
                label="年龄"
                value={profile.identity.age != null ? `${profile.identity.age} 岁` : undefined}
              />
              <InfoItem
                label="性别"
                value={profile.identity.gender ? GENDER_LABELS[profile.identity.gender] : undefined}
              />
              <InfoItem label="星座" value={profile.identity.zodiac} />
              <InfoItem label="生日" value={profile.identity.birthday} />
              <InfoItem label="籍贯" value={profile.identity.hometown} />
              <InfoItem label="现居" value={profile.identity.currentCity} />
            </div>
            {profile.identity.nicknames.length > 0 && (
              <div className="mt-3">
                <TagRow label="昵称" tags={profile.identity.nicknames} color="zen-indigo" />
              </div>
            )}
          </Section>

          {/* === 职业信息 === */}
          <Section icon={<Briefcase className="w-3.5 h-3.5" />} title="职业信息">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              <InfoItem label="公司" value={profile.career.company} />
              <InfoItem label="职位" value={profile.career.title} />
              <InfoItem label="部门" value={profile.career.department} />
              <InfoItem label="行业" value={profile.career.industry} />
            </div>
            {profile.career.workStyle && (
              <div className="mt-3">
                <p className="text-xs text-ink-tertiary mb-1">工作风格</p>
                <p className="text-sm text-ink-secondary leading-relaxed">{profile.career.workStyle}</p>
              </div>
            )}
            {profile.career.strengths.length > 0 && (
              <div className="mt-3">
                <TagRow label="优势" tags={profile.career.strengths} color="zen-sage" icon={<ThumbsUp className="w-3 h-3" />} />
              </div>
            )}
            {profile.career.weaknesses.length > 0 && (
              <div className="mt-3">
                <TagRow label="弱点" tags={profile.career.weaknesses} color="zen-rose" icon={<ThumbsDown className="w-3 h-3" />} />
              </div>
            )}
          </Section>

          {/* === 性格特质 === */}
          <Section icon={<Smile className="w-3.5 h-3.5" />} title="性格特质">
            {profile.personality.mbti && (
              <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zen-indigo/10">
                <span className="text-xs font-medium text-ink-tertiary">MBTI</span>
                <span className="text-sm font-semibold text-zen-indigo">{profile.personality.mbti}</span>
              </div>
            )}
            {profile.personality.description && (
              <p className="text-sm text-ink-secondary leading-relaxed mb-3">
                {profile.personality.description}
              </p>
            )}
            <div className="space-y-2.5">
              {bigFive.map((trait) => (
                <BarRow key={trait.label} label={trait.label} desc={trait.desc} value={trait.value} />
              ))}
            </div>
          </Section>

          {/* === 人物分析（九征八观） === */}
          {assessment && (
            <Section icon={<Sparkles className="w-3.5 h-3.5" />} title="人物分析 · 九征八观">
              {/* 综合评分 */}
              <div className="flex items-center gap-3 mb-3 p-3 rounded-lg bg-zen-terracotta/5">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zen-amber to-zen-terracotta flex items-center justify-center text-white font-bold text-lg">
                    {assessment.overallScore}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-ink-tertiary mb-0.5">综合评分</p>
                  <p className="text-sm text-ink-secondary leading-relaxed">{assessment.summary}</p>
                </div>
              </div>

              {/* 九征分析 */}
              <div className="space-y-2 mb-3">
                <p className="text-xs font-medium text-ink-tertiary mb-1.5">九征分析</p>
                {assessment.nineObservations.map((dim) => (
                  <div key={dim.key} className="flex items-center gap-2">
                    <div className="w-16 flex-shrink-0">
                      <span className="text-xs font-medium text-ink-secondary">{dim.name}·{dim.modernName}</span>
                    </div>
                    <div className="flex-1 h-1.5 rounded-full bg-ink-muted/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          dim.score >= 65 ? 'bg-zen-sage' : dim.score >= 40 ? 'bg-zen-amber' : 'bg-zen-rose'
                        }`}
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                    <span className="text-xs text-ink-tertiary w-8 text-right flex-shrink-0">{dim.score}</span>
                  </div>
                ))}
              </div>

              {/* 优势与短板 */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {assessment.strengths.length > 0 && (
                  <div>
                    <p className="text-xs text-ink-tertiary mb-1.5">优势</p>
                    <div className="flex flex-wrap gap-1">
                      {assessment.strengths.map((s, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded-full text-2xs bg-zen-sage/10 text-zen-sage">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {assessment.weaknesses.length > 0 && (
                  <div>
                    <p className="text-xs text-ink-tertiary mb-1.5">短板</p>
                    <div className="flex flex-wrap gap-1">
                      {assessment.weaknesses.map((w, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded-full text-2xs bg-zen-rose/10 text-zen-rose">{w}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 沟通建议 */}
              <div className="mb-3">
                <p className="text-xs font-medium text-ink-tertiary mb-1.5">沟通建议</p>
                <ul className="space-y-1">
                  {assessment.communicationTips.map((tip, i) => (
                    <li key={i} className="text-xs text-ink-secondary leading-relaxed flex items-start gap-1.5">
                      <span className="text-zen-amber mt-0.5">·</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 相处之道 */}
              <div className="p-2.5 rounded-lg bg-zen-indigo/5">
                <p className="text-xs font-medium text-ink-tertiary mb-1">相处之道</p>
                <p className="text-sm text-ink-secondary leading-relaxed">{assessment.compatibility}</p>
              </div>
            </Section>
          )}

          {/* === 偏好与习惯（原位置） === */}
          <Section icon={<Star className="w-3.5 h-3.5" />} title="偏好与习惯">
            {profile.preferences.communicationStyle && (
              <div className="mb-3">
                <p className="text-xs text-ink-tertiary mb-1">沟通风格</p>
                <p className="text-sm text-ink-secondary leading-relaxed">{profile.preferences.communicationStyle}</p>
              </div>
            )}
            <div className="space-y-3">
              {profile.preferences.likes.length > 0 && (
                <TagRow label="喜好" tags={profile.preferences.likes} color="zen-sage" icon={<ThumbsUp className="w-3 h-3" />} />
              )}
              {profile.preferences.dislikes.length > 0 && (
                <TagRow label="反感" tags={profile.preferences.dislikes} color="zen-rose" icon={<ThumbsDown className="w-3 h-3" />} />
              )}
              {profile.preferences.hobbies.length > 0 && (
                <TagRow label="爱好" tags={profile.preferences.hobbies} color="zen-amber" />
              )}
              {profile.preferences.allergies.length > 0 && (
                <TagRow label="过敏" tags={profile.preferences.allergies} color="zen-terracotta" icon={<AlertCircle className="w-3 h-3" />} />
              )}
              {profile.preferences.dietary.length > 0 && (
                <TagRow label="饮食偏好" tags={profile.preferences.dietary} color="zen-indigo" />
              )}
            </div>
          </Section>

          {/* === 价值观与动机 === */}
          <Section icon={<Sparkles className="w-3.5 h-3.5" />} title="价值观与动机">
            <div className="space-y-3">
              {profile.values.coreValues.length > 0 && (
                <TagRow label="核心价值观" tags={profile.values.coreValues} color="zen-terracotta" />
              )}
              {profile.values.motivations.length > 0 && (
                <TagRow label="驱动因素" tags={profile.values.motivations} color="zen-amber" icon={<TrendingUp className="w-3 h-3" />} />
              )}
              {profile.values.fears.length > 0 && (
                <TagRow label="担忧/恐惧" tags={profile.values.fears} color="zen-rose" icon={<AlertCircle className="w-3 h-3" />} />
              )}
              {profile.values.goals.length > 0 && (
                <TagRow label="目标/愿望" tags={profile.values.goals} color="zen-sage" icon={<Target className="w-3 h-3" />} />
              )}
            </div>
          </Section>

          {/* === 关系定位 === */}
          <Section icon={<Heart className="w-3.5 h-3.5" />} title="关系定位">
            <div className="space-y-2.5">
              <InfoItem label="TA在我生活中的角色" value={profile.socialRole.roleInMyLife} fullWidth />
              <InfoItem label="我在TA生活中的角色" value={profile.socialRole.myRoleInTheirLife} fullWidth />
              <InfoItem
                label="权力关系"
                value={POWER_DYNAMIC_LABELS[profile.socialRole.powerDynamic]}
              />
            </div>
            <div className="mt-3 space-y-2.5">
              <BarRow
                label="信任度"
                value={profile.socialRole.trustLevel}
                icon={<Shield className="w-3 h-3" />}
                color="zen-sage"
              />
              <BarRow
                label="亲密度"
                value={profile.socialRole.intimacyLevel}
                icon={<Heart className="w-3 h-3" />}
                color="zen-rose"
              />
            </div>
          </Section>

          {/* === 关系温度变化 === */}
          {recentSentiment.length > 0 && (
            <Section icon={<Activity className="w-3.5 h-3.5" />} title="关系温度变化">
              <div className="space-y-1.5">
                {recentSentiment.map((point, idx) => {
                  const temp = sentimentToTemperature(point.value)
                  const prevTemp = idx < recentSentiment.length - 1
                    ? sentimentToTemperature(recentSentiment[idx + 1].value)
                    : temp
                  const delta = temp - prevTemp
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-lg p-2.5 transition-all duration-500 relative overflow-hidden"
                      style={{
                        background: warmthBgGradient(temp, 0.5),
                      }}
                    >
                      <div className="flex-1 min-w-0 relative z-10">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-ink-tertiary">{formatTime(point.timestamp)}</span>
                          <span
                            className="text-xs font-medium transition-colors duration-500"
                            style={{ color: warmthToColor(temp) }}
                          >
                            {warmthLabel(temp)}
                          </span>
                          {/* 视觉趋势箭头替代数值 */}
                          {delta !== 0 && (
                            <span
                              className="text-xs leading-none"
                              style={{
                                color: delta > 0
                                  ? warmthToColor(Math.min(100, temp + 5))
                                  : warmthToColor(Math.max(0, temp - 5)),
                              }}
                            >
                              {delta > 0 ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-secondary leading-relaxed">{replaceUserReferences(point.reason)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {/* === 关系走向预测（企业级时序预测降维） === */}
          {trajectory && (
            <Section icon={<TrendingDown className="w-3.5 h-3.5" />} title="关系走向预测">
              <TrajectoryChart prediction={trajectory} />
            </Section>
          )}

          {/* === 关系网络（迷你关系图 + 列表） === */}
          {person.connections.length > 0 && (
            <Section icon={<Network className="w-3.5 h-3.5" />} title="关系网络">
              {/* 迷你关系图 */}
              <div className="mb-3">
                <MiniRelationGraph
                  person={person}
                  allPersons={persons}
                />
              </div>
              {/* 关系列表 */}
              <div className="space-y-1.5">
                {person.connections.map((conn, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-canvas/60 border border-ink-muted/10 hover:bg-canvas-warm/50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-zen-indigo/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-3 h-3 text-zen-indigo" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-ink-primary truncate">
                          {conn.targetPersonName}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-2xs bg-zen-indigo/10 text-zen-indigo">
                          {CONNECTION_TYPE_LABELS[conn.relationType]}
                        </span>
                      </div>
                      {conn.description && (
                        <p className="text-2xs text-ink-tertiary mt-0.5 truncate">{replaceUserReferences(conn.description)}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-12 h-1 rounded-full bg-ink-muted/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-zen-indigo/60"
                          style={{ width: `${conn.strength}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* === 互动统计 === */}
          <Section icon={<BarChart3 className="w-3.5 h-3.5" />} title="互动统计">
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="总互动次数"
                value={person.interactionStats.totalCount.toString()}
                icon={<MessageCircle className="w-4 h-4" />}
                color="zen-indigo"
              />
              <StatCard
                label="平均暖度"
                value={warmthLabel(sentimentToTemperature(person.interactionStats.avgSentiment))}
                icon={<Heart className="w-4 h-4" />}
                color="zen-rose"
              />
              <StatCard
                label="最近互动"
                value={person.interactionStats.lastInteractionAt > 0
                  ? formatRelativeTime(person.interactionStats.lastInteractionAt)
                  : '暂无'}
                icon={<Clock className="w-4 h-4" />}
                color="zen-amber"
              />
              <StatCard
                label="话题数量"
                value={person.interactionStats.topics.length.toString()}
                icon={<Sparkles className="w-4 h-4" />}
                color="zen-sage"
              />
            </div>
            {person.interactionStats.topics.length > 0 && (
              <div className="mt-3">
                <TagRow label="常聊话题" tags={person.interactionStats.topics} color="zen-amber" />
              </div>
            )}
          </Section>

          {/* === 特点标签 === */}
          {(person.traits.length > 0 || person.tags.length > 0) && (
            <Section icon={<Star className="w-3.5 h-3.5" />} title="标签">
              <div className="space-y-3">
                {person.traits.length > 0 && (
                  <TagRow label="特点" tags={person.traits} color="zen-terracotta" />
                )}
                {person.tags.length > 0 && (
                  <TagRow label="标签" tags={person.tags} color="zen-indigo" />
                )}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

// === 子组件 ===

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl bg-canvas/40 border border-ink-muted/10 p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-ink-tertiary">{icon}</span>
        <h3 className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function InfoItem({
  label,
  value,
  fullWidth,
}: {
  label: string
  value?: string
  fullWidth?: boolean
}) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <p className="text-xs text-ink-tertiary mb-0.5">{label}</p>
      <p className={`text-sm ${value ? 'text-ink-primary' : 'text-ink-muted/60'}`}>
        {value || '未填写'}
      </p>
    </div>
  )
}

function TagRow({
  label,
  tags,
  color,
  icon,
}: {
  label: string
  tags: string[]
  color: string
  icon?: React.ReactNode
}) {
  const style = COLOR_STYLES[color] || COLOR_STYLES['zen-indigo']
  return (
    <div>
      <div className="flex items-center gap-1 mb-1.5">
        {icon && <span className={style.text}>{icon}</span>}
        <p className="text-xs text-ink-tertiary">{label}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, i) => (
          <span
            key={i}
            className={`px-2 py-0.5 rounded-full text-xs ${style.bgLight} ${style.text}`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

function BarRow({
  label,
  desc,
  value,
  icon,
  color = 'zen-terracotta',
}: {
  label: string
  desc?: string
  value: number
  icon?: React.ReactNode
  color?: string
}) {
  const style = COLOR_STYLES[color] || COLOR_STYLES['zen-terracotta']
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          {icon && <span className={style.text}>{icon}</span>}
          <span className="text-xs font-medium text-ink-secondary">{label}</span>
          {desc && <span className="text-xs text-ink-muted">{desc}</span>}
        </div>
        <span className="text-xs text-ink-tertiary">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-ink-muted/15 overflow-hidden">
        <div
          className={`h-full rounded-full ${style.bg} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
}) {
  const style = COLOR_STYLES[color] || COLOR_STYLES['zen-indigo']
  return (
    <div className="p-3 rounded-lg bg-surface border border-ink-muted/10">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={style.text}>{icon}</span>
        <span className="text-xs text-ink-tertiary">{label}</span>
      </div>
      <p className={`text-lg font-semibold ${style.text}`}>{value}</p>
    </div>
  )
}
