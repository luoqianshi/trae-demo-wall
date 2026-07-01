// 对话意图检测 — 识别用户想要增删改记忆/人物/提醒的自然语言
import { useDataStore } from '../stores/useDataStore'
import { getUserProfileObject } from './prompts'
import { addNaturalLanguageReminder, parseNaturalLanguageDate } from './manualReminders'

export type IntentType =
  | 'add_memory'      // 记住/记一下
  | 'modify_memory'   // 改一下/不对
  | 'delete_memory'   // 删掉/删除
  | 'add_reminder'    // 提醒我/别忘了
  | 'add_person'      // xxx是我的xxx
  | 'modify_person'   // 更新人物信息
  | 'add_person_relation' // A和B是xxx关系
  | 'interpret_high_context' // 解读高语境信号（"他说改天是什么意思"）
  | 'none'

export interface ConversationIntent {
  type: IntentType
  description: string       // 人类可读的操作描述
  payload: {
    content?: string        // 记忆内容/人物描述
    personName?: string     // 相关人物名
    personName2?: string    // 第二个人物名（用于人物间关系）
    personRelation?: string // 人物关系
    relationType?: string   // 关系类型映射后的英文
    reminderTitle?: string  // 提醒标题
    reminderDate?: string   // 提醒日期
    targetMemoryKeyword?: string // 要修改/删除的记忆关键词
    highContextPhrase?: string   // 高语境词汇
    highContextMeaning?: string  // 高语境含义解读
  }
  confidence: number
}

// 关系类型中文 → 英文映射
const RELATION_TYPE_MAP: Record<string, string> = {
  '同学': 'friend', '校友': 'friend', '发小': 'friend', '朋友': 'friend', '哥们': 'friend', '闺蜜': 'friend',
  '亲戚': 'family', '表亲': 'family', '堂亲': 'family', '家人': 'family', '兄弟': 'family', '姐妹': 'family',
  '同事': 'colleague', '前同事': 'colleague', '同僚': 'colleague',
  '合伙人': 'partner', '合作伙伴': 'partner', '搭档': 'partner',
  '竞争对手': 'rival', '竞品': 'rival', '对手': 'rival',
  '介绍人': 'introduced_by', '引荐人': 'introduced_by',
}

// 高语境词汇列表（用于意图检测）
const HIGH_CONTEXT_PHRASES = [
  '改天', '再说吧', '下次吧', '有空再说', '到时候看', '研究研究', '考虑考虑',
  '我看看', '尽量吧', '我想想', '还行', '还可以', '过得去',
  '没事', '随便', '不用了', '都行', '不急',
  '随你便', '无所谓', '算了吧', '你定就行', '我睡了', '别管我',
]

// 关键词模式匹配
const PATTERNS: { type: IntentType; patterns: RegExp[]; extract: (m: RegExpMatchArray, text: string) => Partial<ConversationIntent['payload']> }[] = [
  {
    // 解读高语境信号 — "他说改天是什么意思" / "晓薇说没事，她真的没事吗"
    type: 'interpret_high_context',
    patterns: [
      // "xxx说改天是什么意思" / "他说没事是什么意思"
      /(.{2,8})说(改天|再说吧|下次吧|有空再说|到时候看|研究研究|考虑考虑|我看看|尽量吧|我想想|还行|还可以|过得去|没事|随便|不用了|都行|不急|随你便|无所谓|算了吧|你定就行|我睡了|别管我).{0,5}(是什么意思|什么意思|啥意思|是不是|到底|真的)/,
      // "他说改天，是不是不想..."
      /(.{2,8})说(改天|再说吧|下次吧|有空再说|研究研究|考虑考虑|我看看|尽量吧|我想想|没事|随便|不用了|都行|随你便|无所谓|算了吧|你定就行|我睡了|别管我)，?(?:是不是|是不是不想|是不是不想理我|是不是在敷衍)/,
      // "改天是什么意思" / "没事到底什么意思"（无主语）
      /(改天|再说吧|下次吧|有空再说|到时候看|研究研究|考虑考虑|我看看|尽量吧|我想想|还行|还可以|没事|随便|不用了|都行|不急|随你便|无所谓|算了吧|你定就行|我睡了|别管我).{0,3}(是什么意思|什么意思|啥意思|到底)/,
    ],
    extract: (m) => {
      const personName = m[1]?.trim() || ''
      const phrase = m[2]?.trim() || ''
      const meanings: Record<string, string> = {
        '改天': '通常是婉拒，不要追问"改哪天"',
        '再说吧': '通常是拒绝，不要反复提',
        '下次吧': '通常是拒绝，不是真的有下次',
        '有空再说': '婉拒，不要等对方主动联系',
        '到时候看': '不承诺，大概率不行',
        '研究研究': '通常意味着拒绝或拖延',
        '考虑考虑': '通常是委婉拒绝',
        '我看看': '不一定能办到，不要抱太大期望',
        '尽量吧': '不一定能做到，对方没把握',
        '我想想': '犹豫中，大概率倾向拒绝',
        '还行': '在中国语境下是不错的评价，不是敷衍',
        '还可以': '比"还行"稍好，是正面评价',
        '没事': '可能恰恰有事，需要主动关心',
        '随便': '可能并不随便，只是不想争',
        '不用了': '可能只是客气，并非真的不需要',
        '都行': '可能有偏好但选择迁就',
        '不急': '可能其实急，只是不想催',
        '随你便': '不高兴了，不是真的让你随意',
        '无所谓': '可能很在意但不想表达',
        '算了吧': '失望或放弃，不是真的无所谓',
        '你定就行': '在测试你是否考虑对方感受',
        '我睡了': '可能情绪不好，不是真的要睡觉',
        '别管我': '实际希望被关注和安慰',
      }
      return {
        personName,
        highContextPhrase: phrase,
        highContextMeaning: meanings[phrase] || '需要结合语境判断',
        content: phrase,
      }
    },
  },
  {
    // A和B是同学/朋友/亲戚等关系
    type: 'add_person_relation',
    patterns: [
      // "A和B是同学" / "A跟B是朋友" / "A和B原来是亲戚"
      /(.{2,8})[和跟与](.{2,8})是(.{2,6})(?:关系)?/,
      // "A是B的同学" / "A是B的表哥"
      /(.{2,8})是(.{2,8})的(.{2,6})/,
      // "我发现A和B认识" / "A和B认识"
      /(?:我发现|原来|偶然发现)?(.{2,8})[和跟与](.{2,8})(?:认识|认识|是朋友|是同学)/,
      // "A和B原来是同学/朋友/亲戚"
      /(.{2,8})[和跟与](.{2,8})原来是(.{2,6})/,
    ],
    extract: (m) => {
      const name1 = m[1]?.trim()
      const name2 = m[2]?.trim()
      const relation = m[3]?.trim() || '认识'
      const relationType = RELATION_TYPE_MAP[relation] || 'other'
      return {
        personName: name1,
        personName2: name2,
        personRelation: relation,
        relationType,
        content: `${name1}和${name2}是${relation}关系`,
      }
    },
  },
  {
    type: 'add_reminder',
    patterns: [
      /提醒我(.{2,50})/,
      /别忘了(.{2,50})/,
      /不要忘记(.{2,50})/,
      /记得提醒我(.{2,50})/,
    ],
    extract: (m) => ({
      reminderTitle: m[1]?.trim(),
      content: m[1]?.trim(),
    }),
  },
  {
    type: 'delete_memory',
    patterns: [
      /(?:删掉|删除|去掉|清除)(?:那条|那个|关于)?(.{2,30})(?:的记忆|的记录|的话)/,
      /(?:那条|那个)关于(.{2,20})(?:不对|错了|删了|删掉)/,
      /(.{2,20})不对[，,]?(?:删掉|删除|改)/,
    ],
    extract: (m) => ({
      targetMemoryKeyword: m[1]?.trim(),
      content: m[0],
    }),
  },
  {
    type: 'modify_memory',
    patterns: [
      /(?:改一下|修改|更新|更正)(?:那条|那个)?(.{2,30})(?:的记忆|的记录)/,
      /(.{2,20})不是这样的[，,]?(?:应该是|改为)/,
      /(.{2,20})应该是(.{2,50})/,
    ],
    extract: (m) => ({
      targetMemoryKeyword: m[1]?.trim(),
      content: m[2]?.trim() || m[0],
    }),
  },
  {
    type: 'add_memory',
    patterns: [
      /(?:记住|记一下|帮我记|记录一下|记下来)(.{2,100})/,
      /(?:我要|帮我)(?:记住|记录)(.{2,100})/,
    ],
    extract: (m) => ({
      content: m[1]?.trim(),
    }),
  },
  {
    type: 'add_person',
    patterns: [
      /(.{2,8})是我(?:的)?(.{2,10})/,
      /我(?:有个)?(.{2,10})(?:叫|名字叫|名叫)(.{2,8})/,
      /新增(?:一个)?(?:人物|联系人)[：:](.{2,50})/,
    ],
    extract: (m) => ({
      personName: m[1]?.trim(),
      personRelation: m[2]?.trim(),
      content: m[0],
    }),
  },
]

// 误触发排除规则 — 这些短语虽然匹配模式，但不应触发意图
const FALSE_POSITIVE_PATTERNS = [
  // 对话/提问类（不是在记录信息）
  /^(为什么|怎么|怎么办|什么意思|是不是|对不对|好不好|行不行|可以吗|能吗|要不要|该不该)/,
  // 情感表达类
  /^(我累|我困|我饿|我烦|我开心|我难过|我生气|我害怕|我担心)/,
  // 模糊代词（"我和你"不是人物关系）
  /[我和跟与]你/,
  // 纯提问"xxx是什么"
  /是什么$/,
  // 包含问号
  /[?？]$/,
]

// 检查是否为误触发
function isFalsePositive(text: string, type: IntentType): boolean {
  // 问句一律不触发操作意图（除非是"提醒我"这种明确的祈使句）
  if (/[?？]$/.test(text) && type !== 'add_reminder') return true

  // 检查排除模式
  for (const pattern of FALSE_POSITIVE_PATTERNS) {
    if (pattern.test(text)) return true
  }

  // 人物关系意图的特殊校验：两个人名不能相同，不能包含"你""我"等代词
  if (type === 'add_person_relation') {
    // 排除包含代词的匹配
    if (/[你我他她它]/.test(text.substring(0, text.indexOf('是')))) return true
  }

  // "记住"意图的特殊校验：消息太长（>100字）可能是长段叙述而非记录指令
  if (type === 'add_memory' && text.length > 100) return true

  return false
}

// 检测对话意图
export function detectIntent(userMessage: string): ConversationIntent | null {
  const text = userMessage.trim()

  // 太短的消息不检测
  if (text.length < 3) return null

  for (const { type, patterns, extract } of PATTERNS) {
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        // 误触发检查
        if (isFalsePositive(text, type)) continue

        const payload = extract(match, text)
        // 构建人类可读描述
        let description = ''
        switch (type) {
          case 'add_memory':
            description = `记下这条信息：${payload.content || text}`
            break
          case 'modify_memory':
            description = `修改关于"${payload.targetMemoryKeyword}"的记忆`
            break
          case 'delete_memory':
            description = `删除关于"${payload.targetMemoryKeyword}"的记忆`
            break
          case 'add_reminder':
            description = `设置提醒：${payload.reminderTitle || payload.content}`
            break
          case 'add_person':
            description = `新增人物：${payload.personName}（${payload.personRelation}）`
            break
          case 'add_person_relation':
            description = `记录人物关系：${payload.personName} 和 ${payload.personName2} 是${payload.personRelation}，并在关系图谱中添加连线`
            break
          case 'interpret_high_context':
            description = `解读高语境信号：${payload.personName || '对方'}说"${payload.highContextPhrase}" — ${payload.highContextMeaning}`
            break
          default:
            description = text
        }

        return {
          type,
          description,
          payload,
          confidence: 0.8,
        }
      }
    }
  }

  return null
}

// 执行意图操作
export async function executeIntent(intent: ConversationIntent): Promise<{ success: boolean; message: string }> {
  const store = useDataStore.getState()
  const profile = getUserProfileObject()

  try {
    switch (intent.type) {
      case 'add_memory': {
        const content = intent.payload.content || ''
        if (!content) return { success: false, message: '内容为空' }

        // 检查是否涉及已知人物
        const persons = store.persons
        const relatedPersonIds: string[] = []
        for (const p of persons) {
          if (content.includes(p.name)) {
            relatedPersonIds.push(p.id)
          }
        }

        await store.addMemory({
          type: 'event',
          content: content.replace(/用户/g, '你').replace(profile.name || '', '你'),
          source: 'user_input',
          confidence: 'high',
          confirmed: true,
          tags: [],
          relatedPersonIds,
          relatedMemoryIds: [],
        })
        return { success: true, message: '已记下' }
      }

      case 'add_reminder': {
        const rawTitle = intent.payload.reminderTitle || intent.payload.content || ''
        if (!rawTitle) return { success: false, message: '提醒内容为空' }

        // 使用增强的自然语言日期解析
        const { dueDate, time, cleanTitle } = parseNaturalLanguageDate(rawTitle)

        // 去掉触发词
        const finalTitle = cleanTitle.replace(/提醒我|别忘了|不要忘记|记得提醒我/g, '').trim()
        if (!finalTitle) return { success: false, message: '提醒内容为空' }

        const priority: 'high' | 'medium' = dueDate && dueDate - Date.now() < 86400000 ? 'high' : 'medium'

        addNaturalLanguageReminder({
          title: finalTitle,
          content: rawTitle,
          type: 'task',
          priority,
          dueDate,
          time,
        })

        // 格式化反馈消息
        let message = '提醒已设置'
        if (dueDate) {
          const d = new Date(dueDate)
          const month = d.getMonth() + 1
          const day = d.getDate()
          const hour = String(d.getHours()).padStart(2, '0')
          const minute = String(d.getMinutes()).padStart(2, '0')
          message = `提醒已设置：${month}月${day}日 ${hour}:${minute}`
        }

        return { success: true, message }
      }

      case 'add_person': {
        const name = intent.payload.personName || ''
        const relation = intent.payload.personRelation || ''
        if (!name || name.length < 2) return { success: false, message: '人物名字无效' }

        // 映射关系类型
        const relationMap: Record<string, string> = {
          '老婆': 'spouse', '妻子': 'spouse', '爱人': 'spouse', '老公': 'spouse', '丈夫': 'spouse',
          '妈': 'family', '妈的': 'family', '母亲': 'family', '爸': 'family', '父亲': 'family',
          '儿子': 'family', '女儿': 'family', '兄弟': 'family', '姐妹': 'family', '家人': 'family',
          '朋友': 'friend', '同事': 'colleague', '领导': 'leader', '老板': 'leader',
          '老师': 'mentor', '师傅': 'mentor', '客户': 'client', '下属': 'subordinate',
        }
        const relationship = relationMap[relation] || 'other'

        await store.addPerson({
          name,
          relationship: relationship as any,
          sentiment: 50,
          traits: [relation],
          tags: [relation],
          profile: {
            identity: { nicknames: [name] },
            career: { strengths: [], weaknesses: [], careerHistory: [] },
            personality: { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50, description: '' },
            preferences: { likes: [], dislikes: [], allergies: [], dietary: [], hobbies: [], communicationStyle: '' },
            values: { coreValues: [], motivations: [], fears: [], goals: [] },
            socialRole: { roleInMyLife: relation, myRoleInTheirLife: '', powerDynamic: 'equal', trustLevel: 50, intimacyLevel: 50 },
          },
          connections: [],
          sentimentHistory: [],
          interactionStats: { totalCount: 0, lastInteractionAt: Date.now(), avgSentiment: 50, topics: [] },
          isDemo: 0,
        } as any)
        return { success: true, message: `已添加人物：${name}（${relation}）` }
      }

      case 'add_person_relation': {
        const name1 = intent.payload.personName || ''
        const name2 = intent.payload.personName2 || ''
        const relation = intent.payload.personRelation || '认识'
        const relationType = (intent.payload.relationType || 'other') as 'family' | 'colleague' | 'friend' | 'partner' | 'rival' | 'introduced_by' | 'other'

        if (!name1 || !name2 || name1.length < 2 || name2.length < 2) {
          return { success: false, message: '人物名字无效' }
        }

        const persons = store.persons
        // 模糊匹配人物（支持全名和部分名匹配）
        const findPerson = (name: string) => {
          // 精确匹配
          let p = persons.find(p => p.name === name)
          if (p) return p
          // 包含匹配（如"秀兰"匹配"陈秀兰"）
          p = persons.find(p => p.name.includes(name) || name.includes(p.name))
          if (p) return p
          // 昵称匹配
          p = persons.find(p => p.profile?.identity?.nicknames?.some(n => n === name))
          return p
        }

        const person1 = findPerson(name1)
        const person2 = findPerson(name2)

        if (!person1 || !person2) {
          const missing = !person1 ? name1 : name2
          return { success: false, message: `未找到人物"${missing}"，请先在关系页面添加该人物` }
        }

        if (person1.id === person2.id) {
          return { success: false, message: '不能添加自己与自己的关系' }
        }

        // 检查是否已存在连接
        const existingConn1 = person1.connections?.find(c => c.targetPersonId === person2.id)
        const existingConn2 = person2.connections?.find(c => c.targetPersonId === person1.id)

        if (existingConn1 || existingConn2) {
          return { success: false, message: `${person1.name}和${person2.name}之间已存在关系连线` }
        }

        // 双向添加 connection
        const newConn1 = {
          targetPersonId: person2.id,
          targetPersonName: person2.name,
          relationType,
          strength: 50,
          description: `${relation}关系`,
        }
        const newConn2 = {
          targetPersonId: person1.id,
          targetPersonName: person1.name,
          relationType,
          strength: 50,
          description: `${relation}关系`,
        }

        await store.updatePerson(person1.id, {
          connections: [...(person1.connections || []), newConn1],
        })
        await store.updatePerson(person2.id, {
          connections: [...(person2.connections || []), newConn2],
        })

        // 同时写入记忆
        await store.addMemory({
          type: 'insight',
          content: `${person1.name}和${person2.name}是${relation}关系`,
          source: 'user_input',
          confidence: 'high',
          confirmed: true,
          tags: ['人物关系', relation],
          relatedPersonIds: [person1.id, person2.id],
          relatedMemoryIds: [],
        })

        return { success: true, message: `已记录：${person1.name}和${person2.name}是${relation}，关系图谱已更新` }
      }

      case 'delete_memory': {
        const keyword = intent.payload.targetMemoryKeyword || ''
        if (!keyword) return { success: false, message: '未指定要删除的记忆' }

        const memories = store.memories
        const target = memories.find(m => m.content.includes(keyword))
        if (!target) return { success: false, message: `未找到包含"${keyword}"的记忆` }

        await (store as any).deleteMemory(target.id)
        return { success: true, message: `已删除关于"${keyword}"的记忆` }
      }

      case 'modify_memory': {
        const keyword = intent.payload.targetMemoryKeyword || ''
        const newContent = intent.payload.content || ''
        if (!keyword || !newContent) return { success: false, message: '修改信息不完整' }

        const memories = store.memories
        const target = memories.find(m => m.content.includes(keyword))
        if (!target) return { success: false, message: `未找到包含"${keyword}"的记忆` }

        await (store as any).updateMemory(target.id, {
          content: newContent.replace(/用户/g, '你').replace(profile.name || '', '你'),
        })
        return { success: true, message: `已更新关于"${keyword}"的记忆` }
      }

      case 'interpret_high_context': {
        // 高语境解读不需要执行写操作，仅返回解读结果供 AI 参考
        const phrase = intent.payload.highContextPhrase || ''
        const meaning = intent.payload.highContextMeaning || ''
        const person = intent.payload.personName || '对方'
        return {
          success: true,
          message: `${person}说"${phrase}" — ${meaning}。建议在回复中体察这层含义，不要只按字面意思理解。`,
        }
      }

      default:
        return { success: false, message: '未识别的操作类型' }
    }
  } catch (e) {
    console.warn('[Intent] 执行失败:', e)
    return { success: false, message: `操作失败: ${e instanceof Error ? e.message : '未知错误'}` }
  }
}
