/**
 * 轻量级中文人名提取（NER）
 *
 * 用于从用户消息中实时提取人名，不依赖数据库匹配。
 * 解决"相关人物"面板在提到新人物时为空的问题。
 *
 * 提取策略：
 * 1. 关系称谓（我妈、老婆、老王、张总等）
 * 2. 中文全名（2-4字姓氏+名）
 * 3. 姓氏+称谓（王总、李医生、赵哥）
 */

/** 提取到的人物信息 */
export interface ExtractedPerson {
  /** 原文匹配到的人名/称谓 */
  raw: string
  /** 推断的显示名 */
  displayName: string
  /** 推断的关系类型 */
  relationship: 'family' | 'colleague' | 'friend' | 'boss' | 'other'
  /** 是否为关系称谓（而非具体姓名） */
  isRelational: boolean
}

// ============================================================
// 关系称谓映射
// ============================================================

const FAMILY_TITLES: Record<string, string> = {
  '我妈': '妈妈', '我爸爸': '爸爸', '我爸': '爸爸',
  '我老婆': '老婆', '我老公': '老公',
  '我弟': '弟弟', '我哥': '哥哥', '我姐': '姐姐', '我妹': '妹妹',
  '我儿': '儿子', '我女儿': '女儿', '孩子': '孩子',
  '爷爷': '爷爷', '奶奶': '奶奶', '外公': '外公', '外婆': '外婆',
  '岳父': '岳父', '岳母': '岳母', '公公': '公公', '婆婆': '婆婆',
}

const COLLEAGUE_TITLES: Record<string, string> = {
  '老板': '老板', '领导': '领导',
  '合伙人': '合伙人', '同事': '同事',
}

// 姓氏+称谓模式
const TITLE_SUFFIXES = ['总', '经理', '主任', '总监', '院长', '校长', '老师', '医生', '哥', '姐', '弟', '妹', '叔', '阿姨', '爷', '奶']

// 老/小 + 姓氏 的常见称呼（如老王、小张、大李）
const NAME_PREFIXES = ['老', '小', '大', '阿']

// 常见中文姓氏（覆盖95%以上）
const COMMON_SURNAMES = [
  '王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
  '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
  '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧',
  '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕',
  '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎',
  '余', '潘', '杜', '戴', '夏', '钟', '汪', '田', '任', '姜',
  '范', '方', '石', '姚', '谭', '廖', '邹', '熊', '金', '陆',
  '郝', '孔', '白', '崔', '康', '毛', '邱', '秦', '江', '史',
  '顾', '侯', '邵', '孟', '龙', '万', '段', '雷', '钱', '汤',
  '尹', '黎', '易', '常', '武', '乔', '贺', '赖', '龚', '文',
  '欧阳', '司马', '诸葛', '上官', '司徒', '皇甫',
]

// ============================================================
// 提取函数
// ============================================================

/**
 * 从用户消息中提取人物信息
 * 不依赖数据库，纯规则匹配
 */
export function extractPersonsFromMessage(message: string): ExtractedPerson[] {
  const results: ExtractedPerson[] = []
  const seen = new Set<string>()

  // 1. 匹配家庭关系称谓
  for (const [pattern, displayName] of Object.entries(FAMILY_TITLES)) {
    if (message.includes(pattern)) {
      const key = `family:${pattern}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push({
          raw: pattern,
          displayName,
          relationship: 'family',
          isRelational: true,
        })
      }
    }
  }

  // 2. 匹配同事关系称谓
  for (const [pattern, displayName] of Object.entries(COLLEAGUE_TITLES)) {
    if (message.includes(pattern)) {
      const key = `colleague:${pattern}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push({
          raw: pattern,
          displayName,
          relationship: 'colleague',
          isRelational: true,
        })
      }
    }
  }

  // 3. 匹配"老/小/大/阿 + 姓氏"（如老王、小张、大李、阿陈）
  for (const prefix of NAME_PREFIXES) {
    for (const surname of COMMON_SURNAMES) {
      const pattern = prefix + surname
      if (message.includes(pattern)) {
        const key = `prefix:${pattern}`
        if (!seen.has(key)) {
          seen.add(key)
          results.push({
            raw: pattern,
            displayName: pattern,
            relationship: 'friend',
            isRelational: false,
          })
        }
      }
    }
  }

  // 4. 匹配姓氏+称谓（如"王总"、"李医生"、"赵哥"）
  for (const surname of COMMON_SURNAMES) {
    for (const suffix of TITLE_SUFFIXES) {
      const pattern = surname + suffix
      if (message.includes(pattern)) {
        const key = `title:${pattern}`
        if (!seen.has(key)) {
          seen.add(key)
          // 判断关系类型
          let relationship: ExtractedPerson['relationship'] = 'other'
          if (['总', '经理', '主任', '总监', '院长', '校长'].includes(suffix)) {
            relationship = 'boss'
          } else if (['老师', '医生'].includes(suffix)) {
            relationship = 'other'
          } else if (['哥', '姐', '弟', '妹'].includes(suffix)) {
            relationship = 'friend'
          }
          results.push({
            raw: pattern,
            displayName: pattern,
            relationship,
            isRelational: false,
          })
        }
      }
    }
  }

  // 5. 匹配中文全名（2-4字，姓氏开头）
  // 先排除已匹配的称谓
  let remainingText = message
  for (const r of results) {
    remainingText = remainingText.replace(r.raw, '  ')
  }

  // 匹配模式：姓氏 + 1-2个非姓氏字（限制为2字名，3字名需额外验证）
  // 先尝试2字名（姓氏+1字），再尝试3字名（姓氏+2字）
  const surnameAlt = COMMON_SURNAMES.join('|')

  // 2字名：姓氏 + 1个中文字
  const name2Pattern = new RegExp(
    `(${surnameAlt})([\\u4e00-\\u9fa5])`,
    'g'
  )
  let match: RegExpExecArray | null
  while ((match = name2Pattern.exec(remainingText)) !== null) {
    const fullName = match[0]
    if (isLikelyPersonName(fullName, message)) {
      const key = `name:${fullName}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push({
          raw: fullName,
          displayName: fullName,
          relationship: 'other',
          isRelational: false,
        })
      }
    }
  }

  // 3字名：姓氏 + 2个中文字（需额外验证，排除"王思亮上周"这类）
  const name3Pattern = new RegExp(
    `(${surnameAlt})([\\u4e00-\\u9fa5]{2})`,
    'g'
  )
  while ((match = name3Pattern.exec(remainingText)) !== null) {
    const fullName = match[0]
    // 3字名需要通过更严格的验证
    if (isLikelyPersonName3(fullName, message)) {
      const key = `name:${fullName}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push({
          raw: fullName,
          displayName: fullName,
          relationship: 'other',
          isRelational: false,
        })
      }
    }
  }

  return results.slice(0, 8) // 最多返回8个，避免面板过长
}

/**
 * 判断一个匹配是否可能是人名
 * 排除常见误匹配（如"王家"、"李家"、"陈旧"等）
 */
function isLikelyPersonName(name: string, context: string): boolean {
  // 2字名：需要更严格判断
  if (name.length === 2) {
    // 排除常见非人名组合
    const exclude = [
      '王家', '李家', '张家', '刘家', '陈家', '杨家', '赵家',
      '陈旧', '老王', '老李', '老张', '老刘', '老陈', '老赵',
      '小王', '小李', '小张', '小刘', '小陈', '小赵',
      '王总', '李总', '张总', '刘总', '陈总', // 已被称谓匹配
    ]
    if (exclude.includes(name)) return false
    // 2字名需要上下文佐证（附近有"说"、"问"、"告诉"等动词）
    const idx = context.indexOf(name)
    if (idx >= 0) {
      const after = context.substring(idx + name.length, idx + name.length + 4)
      if (/说|问|告诉|答应|找|叫|给|和|跟|对|让|请|约|催|帮|借/.test(after)) {
        return true
      }
      const before = context.substring(Math.max(0, idx - 4), idx)
      if (/让|叫|请|约|和|跟|对/.test(before)) {
        return true
      }
    }
    return false
  }
  return true // 3字以上大概率是人名
}

/**
 * 3字名的严格验证 — 排除"王思亮上周"这类误匹配
 * 核心逻辑：人名后面通常跟着动词/称谓，而非时间词/方位词
 */
function isLikelyPersonName3(name: string, context: string): boolean {
  if (name.length !== 3) return false

  // 排除以非人名用字结尾的组合
  const lastChar = name[2]
  // 常见非人名尾字（时间、方位、动词等）
  const nonNameChars = '上下周今昨明后前里外中去来过到被把将让给对跟和与及或但而'
  if (nonNameChars.includes(lastChar)) return false

  // 检查上下文中这个名字后面跟着的是否是动词/称谓
  const idx = context.indexOf(name)
  if (idx >= 0) {
    const after = context.substring(idx + name.length, idx + name.length + 4)
    // 人名后通常跟着动词或称谓
    if (/说|问|告诉|答应|找|叫|给|和|跟|对|让|请|约|催|帮|借|总|师|哥|姐|弟|妹/.test(after)) {
      return true
    }
    // 如果后面跟着的是时间词/方位词，很可能不是3字名
    if (/上周|下周|今天|昨天|明天|后天|前天|里面|外面|中间|上去|下来|过去/.test(after)) {
      return false
    }
    // 检查前面是否有引导词
    const before = context.substring(Math.max(0, idx - 4), idx)
    if (/让|叫|请|约|和|跟|对/.test(before)) {
      return true
    }
  }

  // 默认对3字名保守处理：如果没有上下文佐证，不提取
  return false
}

/**
 * 获取人物的关系标签文字
 */
export function getPersonRelationLabel(person: ExtractedPerson): string {
  const labels: Record<ExtractedPerson['relationship'], string> = {
    family: '家人',
    colleague: '同事',
    friend: '朋友',
    boss: '上级',
    other: '提及',
  }
  return labels[person.relationship] || '提及'
}
