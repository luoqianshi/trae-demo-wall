// System Prompt 工程 v2 — 全维度交叉分析 + 确认式引导
// 核心原则：不分类、不割裂，任何问题都通盘考虑所有维度

import type { Person, Memory, UserProfile } from '../types'
import { getResponseStyleParams } from './config'

// 默认用户画像（首次使用时）
const DEFAULT_PROFILE_OBJECT: UserProfile = {
  name: '陈志远',
  age: '42',
  gender: 'male',
  city: '杭州',
  occupation: '杭州云启科技有限公司 运营总监',
  education: '浙江大学工商管理本科',
  workYears: '18',
  income: '年薪约44万（税后约35万）',
  family: '妻子林晓薇（全职在家5年），儿子陈一诺（12岁，初一），母亲陈秀兰（73岁，绍兴独居）',
  finance:
    '杭州未来科技城四居室，总价680万，贷款470万，月供2.6万（剩18年）。儿子学费+补课+兴趣班每年约18万。家庭年开支超55万，积蓄已见底。',
  health: '脂肪肝、高血压、甘油三酯偏高（2.8）。医生建议戒酒+有氧运动每周3次。',
  currentChallenges:
    '42岁互联网行业"大龄"，VP位置被85后空降，晋升通道窄。跳槽怕年龄歧视，留下看不到出路。近期失眠严重，每周至少3天凌晨2点才睡着。',
}

export function formatUserProfile(profile: UserProfile): string {
  const parts: string[] = []
  parts.push(`姓名：${profile.name || '未填写'}`)
  parts.push(
    `年龄：${profile.age || '未填写'}岁，${profile.gender === 'male' ? '男性' : profile.gender === 'female' ? '女性' : '未填写'}，${profile.city || '未填写'}`
  )
  if (profile.occupation) parts.push(`职业：${profile.occupation}`)
  if (profile.education) parts.push(`学历：${profile.education}`)
  if (profile.workYears) parts.push(`工作年限：${profile.workYears}年`)
  if (profile.income) parts.push(`收入：${profile.income}`)
  parts.push('')
  if (profile.family) parts.push(`家庭：${profile.family}`)
  parts.push('')
  if (profile.finance) parts.push(`财务：${profile.finance}`)
  parts.push('')
  if (profile.health) parts.push(`健康：${profile.health}`)
  parts.push('')
  if (profile.currentChallenges) parts.push(`当前困境：${profile.currentChallenges}`)
  return parts.join('\n')
}

export function getUserProfile(): string {
  const raw = localStorage.getItem('hengzhou-user-profile')
  if (!raw) return formatUserProfile(DEFAULT_PROFILE_OBJECT)
  try {
    const parsed = JSON.parse(raw) as UserProfile
    return formatUserProfile(parsed)
  } catch {
    return raw
  }
}

export function getUserProfileObject(): UserProfile {
  const raw = localStorage.getItem('hengzhou-user-profile')
  if (!raw) return DEFAULT_PROFILE_OBJECT
  try {
    return JSON.parse(raw) as UserProfile
  } catch {
    return DEFAULT_PROFILE_OBJECT
  }
}

export function setUserProfile(profile: string | UserProfile): void {
  if (typeof profile === 'string') {
    localStorage.setItem('hengzhou-user-profile', profile)
  } else {
    localStorage.setItem('hengzhou-user-profile', JSON.stringify(profile))
  }
}

// ============================================================
// 全维度交叉分析 System Prompt
// ============================================================
export function buildSystemPrompt(context: {
  userProfile?: string
  relevantMemories: Memory[]
  relevantPeople: Person[]
  recentMessages: { role: string; content: string }[]
}): string {
  const parts: string[] = []

  // 核心身份设定 — 精简版（SPEED-3: 减少 token 数）
  parts.push(`你是"衡舟"，用户的第二大脑和生活伴侣。你像一位真正了解他全部生活的老朋友。`)
  parts.push(`核心能力：当用户提到任何问题时，你能自动联想到其他维度——工作变动可能影响健康和家庭，健康问题可能影响工作和婚姻。你从不孤立地看待任何问题。`)
  parts.push(`语气温暖、自然、像一位老朋友。不用太正式，但要真诚。`)

  // 用户画像
  const profile = context.userProfile || getUserProfile()
  parts.push(`\n【用户画像】\n${profile}`)

  // SPEED-3: 相关人物档案 — 限制为 Top 3，精简格式
  const topPeople = context.relevantPeople.slice(0, 3)
  if (topPeople.length > 0) {
    parts.push(`\n【相关人物档案】`)
    for (const person of topPeople) {
      parts.push(formatPersonCompact(person))
    }
  }

  // SPEED-3: 相关记忆 — 限制为 Top 5，每条截断到 80 字
  const topMemories = context.relevantMemories.slice(0, 5)
  if (topMemories.length > 0) {
    parts.push(`\n【相关记忆】`)
    for (const mem of topMemories) {
      const conf = mem.confidence === 'high' ? '已确认' : '待确认'
      const content = mem.content.length > 80 ? mem.content.slice(0, 80) + '...' : mem.content
      parts.push(`- [${conf}] ${content}`)
    }
  }

  // SPEED-3: 精简回复策略
  parts.push(`\n【回复策略】`)
  parts.push(`1. 记忆中有答案时，直接引用记忆回答，不要绕弯子。`)
  parts.push(`2. 记忆中没有直接答案时，基于已有记忆给出判断，再追问。`)
  parts.push(`3. 涉及重大决策时，做全维度关联分析（工作/家庭/健康/财务/关系），给出可操作建议。`)

  // 银发关怀：健康维度引导
  parts.push(`\n【健康关怀】`)
  parts.push(`当用户提到家人（特别是父母长辈）的健康话题时，主动关联记忆中的健康记录（体检、用药、血压等），给出关怀建议。`)
  parts.push(`如果记忆中有长辈的健康数据，主动提醒用药、复查、体检时间。语气要温暖，像关心自己家人一样。`)

  // 幻觉防护 — 保留核心约束
  parts.push(`\n【严格禁忌】`)
  parts.push(`1. 绝对禁止编造记忆中不存在的事实。记忆中没有相关信息时，必须说"我记忆中暂无相关信息"。`)
  parts.push(`2. 绝对禁止虚构人物、公司、事件、日期、数字。只能引用【相关记忆】中的信息。`)
  parts.push(`3. AI的建议用"我觉得"开头，用户的事实用"你之前提过"开头。`)

  // 回复风格控制
  const styleParams = getResponseStyleParams()
  parts.push(`\n【回复风格】`)
  parts.push(styleParams.systemHint)

  return parts.join('\n')
}

// SPEED-3: 精简版人物格式化 — 只保留核心信息
function formatPersonCompact(person: Person): string {
  const lines = [`\n【${person.name}】关系：${relationshipLabel(person.relationship)}，温度：${person.sentiment}/100`]
  const identity = person.profile?.identity
  if (identity?.age) lines.push(`  ${identity.age}岁，${identity.hometown || ''}人，现居${identity.currentCity || ''}`)
  const career = person.profile?.career
  if (career?.company || career?.title) {
    lines.push(`  职业：${career.company || ''} ${career.title || ''}`)
  }
  const p = person.profile?.personality
  if (p) lines.push(`  性格：${p.mbti || '未知'} — ${p.description || ''}`)
  // 只保留 1 条偏好
  const pref = person.profile?.preferences
  if (pref?.likes?.length > 0) lines.push(`  喜好：${pref.likes.slice(0, 2).join('、')}`)
  if (pref?.dislikes?.length > 0) lines.push(`  反感：${pref.dislikes.slice(0, 1).join('、')}`)
  // 只保留 1 条最近事件
  const timeline = person.profile?.timeline
  if (Array.isArray(timeline)) {
    const recent = timeline.filter(e => e.type === 'event').slice(-1)
    for (const event of recent) {
      lines.push(`  最近：${event.description}`)
    }
  }
  return lines.join('\n')
}

// ============================================================
// 丰满版人物格式化
// ============================================================
function formatPersonFull(person: Person): string {
  const lines = [`\n【${person.name}】关系：${relationshipLabel(person.relationship)}，温度：${person.sentiment}/100`]

  // 身份信息
  const identity = person.profile.identity
  if (identity.age) lines.push(`  基本信息：${identity.age}岁，${identity.gender === 'male' ? '男' : identity.gender === 'female' ? '女' : ''}，${identity.zodiac || ''}，${identity.hometown || ''}人，现居${identity.currentCity || ''}`)
  if (identity.nicknames.length > 0) lines.push(`  昵称：${identity.nicknames.join('、')}`)

  // 职业信息
  const career = person.profile.career
  if (career.company || career.title) {
    lines.push(`  职业：${career.company || ''} ${career.title || ''}${career.department ? `（${career.department}）` : ''}`)
  }
  if (career.strengths.length > 0) lines.push(`  优势：${career.strengths.join('、')}`)
  if (career.weaknesses.length > 0) lines.push(`  弱点：${career.weaknesses.join('、')}`)

  // 性格
  const p = person.profile.personality
  lines.push(`  性格：${p.mbti || '未知'} — ${p.description}`)
  lines.push(`  大五人格：开放性${p.openness}/尽责${p.conscientiousness}/外向${p.extraversion}/宜人${p.agreeableness}/神经质${p.neuroticism}`)

  // 偏好
  const pref = person.profile.preferences
  if (pref.likes.length > 0) lines.push(`  喜好：${pref.likes.join('、')}`)
  if (pref.dislikes.length > 0) lines.push(`  反感：${pref.dislikes.join('、')}`)
  if (pref.allergies.length > 0) lines.push(`  过敏：${pref.allergies.join('、')}`)
  if (pref.communicationStyle) lines.push(`  沟通风格：${pref.communicationStyle}`)

  // 价值观
  const val = person.profile.values
  if (val.coreValues.length > 0) lines.push(`  价值观：${val.coreValues.join('、')}`)
  if (val.motivations.length > 0) lines.push(`  驱动因素：${val.motivations.join('、')}`)
  if (val.fears.length > 0) lines.push(`  担忧：${val.fears.join('、')}`)
  if (val.goals.length > 0) lines.push(`  目标：${val.goals.join('、')}`)

  // 社交角色
  const role = person.profile.socialRole
  if (role.roleInMyLife) lines.push(`  在我生活中：${role.roleInMyLife}`)
  if (role.myRoleInTheirLife) lines.push(`  我在TA生活中：${role.myRoleInTheirLife}`)
  lines.push(`  信任度：${role.trustLevel}/100，亲密度：${role.intimacyLevel}/100`)

  // 关系温度历史
  if (person.sentimentHistory.length > 0) {
    const latest = person.sentimentHistory[person.sentimentHistory.length - 1]
    lines.push(`  最近关系变化：${latest.reason}（${Math.floor((Date.now() - latest.timestamp) / 86400000)}天前，温度${latest.value}°）`)
  }

  // 关系网络
  if (person.connections.length > 0) {
    lines.push(`  关系网络：${person.connections.map(c => `${c.targetPersonName}(${c.strength}度)`).join('、')}`)
  }

  return lines.join('\n')
}

function relationshipLabel(r: string): string {
  const map: Record<string, string> = {
    spouse: '配偶', family: '家人', colleague: '同事',
    friend: '朋友', leader: '领导', mentor: '导师',
    subordinate: '下属', client: '客户', rival: '对手', other: '其他',
  }
  return map[r] || r
}

// ============================================================
// 多轮审核用的 Prompt（也改为全维度）
// ============================================================
export function buildReviewPrompt(
  agentRole: string,
  userRequest: string,
  draft: string,
  context: string
): string {
  const rolePrompts: Record<string, string> = {
    writer: `你是方案写手。根据用户的需求和背景信息，起草一份具体、可执行的建议方案。注意：不要只关注单一维度，必须考虑工作、家庭、健康、财务、关系的连锁反应。`,
    relation: `你是关系顾问。从人际关系角度审核以下方案，检查是否忽略了重要人物的感受、是否可能引发冲突、是否需要提前沟通。`,
    psych: `你是心理顾问。从心理健康角度审核以下方案，检查是否给用户带来额外压力、是否忽略了情绪需求。`,
    practical: `你是生活顾问。从可行性角度审核以下方案，检查时间是否足够、资源是否到位。`,
    critic: `你是批判顾问。从风险识别角度审核以下方案，检查最坏情况是什么、有哪些潜在漏洞。`,
    host: `你是主持人。综合各方审核意见，给出最终定稿。确保方案完整、逻辑通顺、各方意见都被考虑。`,
  }

  return `${rolePrompts[agentRole] || rolePrompts.writer}

【用户需求】
${userRequest}

【背景信息】
${context}

${draft ? `【当前方案】\n${draft}\n\n` : ''}请严格按以下 JSON 输出，不要包含 JSON 以外的内容：
{
  "verdict": "pass | revise",
  "comments": ["具体修改建议，如果没有则留空数组"],
  "confidence": 0.8,
  "reasoning": "你的判断理由"
}
如果方案没有问题，verdict 填 "pass"，comments 为空数组。`
}

// ============================================================
// 编排器 Prompt — 输出固定 JSON 计划
// ============================================================
export function buildOrchestratorPlanPrompt(userRequest: string): string {
  return `作为任务编排器，请分析以下用户需求，将其分解为可执行的子任务。

用户需求：${userRequest}

可用Agent：
- researcher（研究员）：深度信息检索与分析
- writer（方案写手）：起草具体可执行方案
- relation（关系顾问）：人际关系角度审核
- psych（心理顾问）：情绪与心理健康审核
- practical（生活顾问）：可行性与资源审核
- critic（批判顾问）：风险识别与漏洞审查
- synthesizer（综合员）：多意见整合与冲突调和
- host（主持人）：最终定稿与质量把关

请输出严格符合以下 JSON 格式的执行计划（不要输出任何 JSON 以外的内容）：
{
  "plan": [
    { "agentId": "researcher", "task": "简要任务描述", "parallel": false },
    { "agentId": "writer", "task": "简要任务描述", "parallel": false },
    { "agentId": "relation", "task": "简要任务描述", "parallel": true },
    { "agentId": "psych", "task": "简要任务描述", "parallel": true },
    { "agentId": "practical", "task": "简要任务描述", "parallel": true },
    { "agentId": "critic", "task": "简要任务描述", "parallel": true },
    { "agentId": "synthesizer", "task": "简要任务描述", "parallel": false },
    { "agentId": "host", "task": "简要任务描述", "parallel": false }
  ],
  "reasoning": "你的调度思路"
}

规则：
- 所有 8 个非编排器 Agent 都应该出现在 plan 中
- parallel=true 表示该步骤与前后 parallel=true 的步骤可以并行执行
- 输出必须是合法 JSON，不要加 markdown 代码块标记`
}

// ============================================================
// 批量聊天记录记忆提取 Prompt
// ============================================================
export interface BatchMemoryExtractionInputMessage {
  sender: string
  content: string
  timestamp: number
}

export function buildBatchMemoryExtractionPrompt(
  chatName: string,
  messages: BatchMemoryExtractionInputMessage[]
): string {
  const messagesText = messages
    .map(
      (m) =>
        `[${new Date(m.timestamp).toLocaleString('zh-CN')}] ${m.sender}: ${m.content}`
    )
    .join('\n')

  return `你是信息提取专家。请从以下微信聊天记录中提取值得记住的信息，用于构建用户的个人知识库。

【聊天对象】${chatName}

【聊天记录】
${messagesText}

请提取所有明确、具体、值得长期记住的信息，例如：事实、偏好、约定、事件、情绪、目标、恐惧、价值观等。

输出严格符合以下 JSON 数组格式（不要输出任何 JSON 以外的内容）：
[
  {
    "type": "preference|commitment|event|insight|emotion|habit|goal|fear|value",
    "content": "提取的记忆内容，简明准确",
    "confidence": "high|medium|low",
    "reason": "为什么是这个置信度，以及判断依据",
    "related_person_names": ["关联的人物名字，如\"张三\"、\"妈妈\"等"]
  }
]

规则：
- 只提取明确的信息，不要猜测
- 用户直接陈述的事实 → high
- 用户暗示或提及但未明确确认 → medium
- 需要进一步确认才能确定 → low
- related_person_names 必须包含该条记忆涉及的真实人物姓名（不含昵称/称呼）
- 如果没有可提取的内容，返回空数组 []`
}

// ============================================================
// 记忆提取 Prompt（增强全维度关联）
// ============================================================
export function buildMemoryExtractionPrompt(
  userMessage: string,
  assistantReply: string
): string {
  return `你是信息提取专家。请从以下对话中提取结构化信息，用于构建用户的个人知识库。

【对话】
用户：${userMessage}
衡舟：${assistantReply}

【重要规则 — 只提取用户的信息，不提取AI的建议】
- 只提取【用户】陈述的事实、偏好、承诺、事件、情绪等
- 【不要】提取衡舟（AI）给出的建议、分析、提醒作为记忆
- 如果用户说"好的""记下了""没问题"等确认词，且AI之前给了建议，则提取为用户确认的承诺
- 如果用户没有明确确认AI的建议，不要将该建议提取为记忆
- 记忆内容必须使用第二人称"你"来描述用户本人，不要使用用户姓名或"用户"这个称呼
  - 正确："你答应妈妈端午节回绍兴"
  - 错误："用户答应妈妈端午节回绍兴" 或 "陈志远答应妈妈端午节回绍兴"

请提取以下内容，以 JSON 格式输出：
{
  "memories": [
    {
      "type": "preference|commitment|event|insight|emotion|habit|goal|fear|value",
      "content": "提取的记忆内容，用'你'指代用户",
      "confidence": "high|medium|low",
      "source_type": "user_statement|user_confirmation",
      "related_dimensions": ["工作","家庭","健康","财务","关系"],
      "related_person_names": ["关联的人物名字，如\\"张三\\"、\\"妈妈\\""],
      "reason": "为什么是这个置信度",
      "temporal": "current|past|future",
      "importance": "high|medium|low"
    }
  ],
  "people_mentioned": ["提到的人物名字"],
  "topics": ["话题标签"],
  "emotions": ["检测到的情绪"],
  "cross_dimension_impact": "这个问题可能波及其他维度的分析",
  "entities": [
    {
      "text": "实体文本",
      "type": "person|organization|location|time|event|concept"
    }
  ]
}

规则：
- 只提取用户明确陈述的信息，不要猜测
- 用户直接陈述的事实 → high, source_type: "user_statement"
- 用户暗示或提及但未明确确认 → medium, source_type: "user_statement"
- 用户确认了AI的建议（如回复"好的""行""没问题"）→ high, source_type: "user_confirmation"
- 需要进一步确认才能确定 → low, source_type: "user_statement"
- 必须标注每条记忆可能涉及的其他维度（工作/家庭/健康/财务/关系）
- type 扩展为9种：preference(偏好), commitment(承诺), event(事件), insight(洞察), emotion(情绪), habit(习惯), goal(目标), fear(恐惧), value(价值观)
- 提取对话中提到的具体实体（人物、组织、地点、时间、事件、概念）
- 如果用户没有提供任何可提取的信息（只是闲聊或提问），返回空数组`
}

// ============================================================
// 数字分身回复建议 Prompt
// ============================================================
export function buildDigitalTwinReplyPrompt(
  myName: string,
  otherName: string,
  recentMessages: { sender: string; content: string }[],
  relevantMemories: string[],
  myStyleHints: string[],
  currentInput?: string,
  socialContext?: string
): string {
  const parts: string[] = []

  parts.push(`你是 ${myName} 的数字分身，正在替 ${myName} 给 ${otherName} 回复消息。请基于以下信息，生成 3 条自然、贴合 ${myName} 聊天风格的回复建议。`)
  parts.push(`\n【回复原则——中国式人情世故】`)
  parts.push(`- 回复要符合 ${myName} 和 ${otherName} 的关系亲疏：家人说话随意但有关心，同事说话客气有分寸，领导说话恭敬但不卑微，朋友说话真诚但不越界。`)
  parts.push(`- 懂中国人的含蓄：有些话不直说，用"改天""有空"等委婉表达。但不过度客套，显得生分。`)
  parts.push(`- 注意面子：回复中不让对方难堪，给对方台阶下。如果有不同意见，先肯定再转折。`)
  parts.push(`- 回复必须基于【近期对话】和【相关记忆】中的真实信息。不要编造没有发生过的事，不要假设对方说过没说过的话。`)
  parts.push(`- 不要代第三方做承诺：比如不能说"我帮你问XX能不能答应"——你只能回复你自己能决定的事。`)
  parts.push(`- 避免触发对方负面情绪（《人物志》六情机）：不在对方面前自夸，不攻击对方短处，不否定对方能力。`)
  parts.push(`- 理解话外音：如果对方说"改天"可能是婉拒，"没事"可能恰恰有事，回复要体贴到这一层。`)

  // 注入社交智能上下文（差序格局+面子策略+人情账本）
  if (socialContext) {
    parts.push(`\n${socialContext}`)
  }

  if (myStyleHints.length > 0) {
    parts.push(`\n【${myName} 的聊天风格】`)
    for (const hint of myStyleHints) {
      parts.push(`- ${hint}`)
    }
  }

  if (recentMessages.length > 0) {
    parts.push(`\n【近期对话】`)
    for (const msg of recentMessages) {
      parts.push(`${msg.sender}：${msg.content}`)
    }
  }

  if (relevantMemories.length > 0) {
    parts.push(`\n【相关记忆】`)
    for (const mem of relevantMemories) {
      parts.push(`- ${mem}`)
    }
  }

  parts.push(`\n【当前输入】`)
  parts.push(currentInput && currentInput.trim().length > 0
    ? `${otherName} 刚发来："${currentInput}"`
    : `对方刚发来一条消息，${myName} 还没有回复。`)

  parts.push(`\n要求：`)
  parts.push(`- 生成的回复要符合 ${myName} 的聊天风格，并考虑与 ${otherName} 的关系。`)
  parts.push(`- 每条建议包含 text（回复文本）、tone（语气标签，如"关心""幽默""简洁""正式"）、reason（为什么这条建议合适）。`)
  parts.push(`- 输出严格符合以下 JSON 数组格式，不要添加 markdown 代码块或任何额外说明：`)
  parts.push(`[\n  {"text":"回复内容1","tone":"语气1","reason":"理由1"},\n  {"text":"回复内容2","tone":"语气2","reason":"理由2"},\n  {"text":"回复内容3","tone":"语气3","reason":"理由3"}\n]`)

  return parts.join('\n')
}

// ============================================================
// 向上管理建议 Prompt
// ============================================================
export function buildUpwardManagementPrompt(params: {
  leaderName: string
  memories: string[]
}): string {
  return `你是一位职场沟通教练。以下是我与直属领导「${params.leaderName}」的关键记忆：

${params.memories.map((m) => `- ${m}`).join('\n')}

请给出 3 条具体可执行的建议，帮助我更好地向上管理：
1. 下周汇报应该注意什么
2. 当前关系中的潜在风险点
3. 一个可以立刻做的增进信任的小动作

只输出 JSON：{ "weeklyReportTips": string, "risk": string, "quickAction": string }`
}

// ============================================================
// 承诺提取 Prompt
// ============================================================
export function buildCommitmentExtractionPrompt(memoriesText: string): string {
  return `请从以下记忆中识别所有「承诺」：
- 我答应别人的事
- 别人答应我的事

记忆内容：
${memoriesText}

输出 JSON 数组，每个元素包含：
{
  "content": "承诺内容",
  "who": "相关人名",
  "deadline": "截止日期或 null",
  "direction": "made-by-me" | "made-to-me"
}`
}

// ============================================================
// 重大决策提取 Prompt
// ============================================================
export function buildDecisionExtractionPrompt(memoriesText: string): string {
  return `请从以下记忆中识别用户正在面临的重大决策，如跳槽、创业、接项目、换城市等。

记忆内容：
${memoriesText}

输出 JSON 数组：
{
  "topic": "决策主题",
  "description": "具体描述",
  "stakeholders": ["相关人名"],
  "urgency": "high" | "medium" | "low"
}`
}
