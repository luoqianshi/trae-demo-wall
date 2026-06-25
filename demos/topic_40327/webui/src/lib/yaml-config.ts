// YAML 配置解析与回写工具
// 从 BotConfig.tsx 提取，用于将 config.yaml 解析为可视化分组并支持回写

export interface YamlField {
  path: string
  label: string
  value: string
  isLong?: boolean
}

export interface YamlSection {
  title: string
  titleCN: string
  fields: YamlField[]
}

// Section 中文标签
export const SECTION_LABELS: Record<string, string> = {
  bot: '基本信息',
  personality: '人格设定',
  trigger: '聊天触发',
  decision: '决策配置',
  behavior_rules: '行为规则',
  emoji: '表情包配置',
  content_filter: '内容过滤',
  hook: 'Hook 配置',
  memory: '记忆系统',
  web_search: '联网搜索',
  vision: '视觉分析',
  vision_rules: '视觉分析规则',
  voice: '语音处理',
  logger: '日志配置',
  bus: '事件总线',
  goja: '脚本配置',
  browser: '内嵌浏览器',
  webui: 'Web仪表盘',
  tong_shadow: '瞳影自画像',
  dedupe: '消息去重',
  message_receive: '消息接收',
  timing_gate: 'LLM 定时网关',
  rate_limit: '限流',
  writeback: '回写',
  weight_decay: '权重衰减',
  global_memory: '全局记忆',
  graph_memory: '图记忆',
}

// 字段中文标签
export const FIELD_LABELS: Record<string, string> = {
  qq: 'QQ 号',
  nickname: '昵称',
  aliases: '别名',
  max_reply_len: '最大回复长度',
  max_concurrent_messages: '最大并发消息数',
  enable_self_evaluation: '回复质量自评',
  base_identity: '核心身份',
  default_style: '默认风格',
  extra_styles: '备选风格',
  style_probability: '风格概率',
  persona_angles: '人物视角',
  angle_probability: '视角概率',
  behavior_rules: '行为规则',
  vision_rules: '视觉分析规则',
  auto_reply: '自动回复',
  require_mention: '需要@',
  base_frequency: '基础回复频率',
  at_reply: '@时回复',
  mention_reply: '提及回复',
  reply_cooldown: '回复冷却(秒)',
  max_rounds: '最大决策轮次',
  steal_emoji: '自动收藏表情',
  auto_tag: '自动标签',
  max_reg_num: '最大表情数',
  check_interval: '检查间隔(秒)',
  do_replace: '自动替换表情',
  content_filtration: '表情内容过滤',
  ban_words: '屏蔽词',
  ban_regex: '正则过滤',
  mode: '模式',
  list: '名单',
  rate_limit: '限流',
  enabled: '启用',
  developer: 'F12 开发者工具',
  auth_token: '仪表盘访问令牌',
  similarity_threshold: '相似度阈值',
  max_portraits: '最大自画像数',
  describe_prompt: '外貌描述提示词',
  inject_self_description: '注入外貌描述',
  max_per_min: '每分钟上限',
  max_per_hour: '每小时上限',
  max_fragments: '最大片段数',
  fragment_ttl_days: '片段有效期(天)',
  top_k: '召回数量',
  search_mode: '搜索模式',
  embedding_dim: '嵌入维度',
  vector_persist_sec: '向量持久化(秒)',
  writeback: '回写',
  message_threshold: '消息阈值',
  context_length: '上下文长度',
  person_fact_enabled: '人物事实',
  chat_summary_enabled: '聊天摘要',
  weight_decay: '权重衰减',
  decay_rate: '衰减速率',
  access_boost: '访问提升',
  boost_cap: '提升上限',
  global_memory: '全局记忆',
  graph_memory: '图记忆',
  'memory.enabled': '记忆系统',
  'memory.writeback.enabled': '回写',
  'memory.writeback.person_fact_enabled': '回写-人物事实',
  'memory.writeback.chat_summary_enabled': '回写-聊天摘要',
  'memory.weight_decay.enabled': '权重衰减',
  'memory.global_memory.enabled': '全局记忆',
  'memory.global_memory.top_k': '全局记忆-召回数量',
  'memory.graph_memory.enabled': '图记忆',
  'web_search.enabled': '联网搜索',
  'web_search.default_depth': '默认搜索模式',
  'web_search.shallow.max_results': '简易搜索-最大结果数',
  'web_search.deep.max_results': '常规搜索-最大结果数',
  'web_search.deep.fetch_content': '常规搜索-抓取网页内容',
  'web_search.deep.fetch_timeout': '常规搜索-抓取超时(秒)',
  'web_search.research.max_results': '深度搜索-最大结果数',
  'web_search.research.max_sub_queries': '深度搜索-最大子问题数',
  'web_search.research.enabled': '深度搜索-启用大会辩论',
  'web_search.research.max_rounds': '深度搜索-最大辩论轮次',
  'web_search.allow_file_download': '允许下载文件',
  'download.use_thunder': '优先使用迅雷下载',
  'download.thunder_min_file_size': '迅雷最小文件大小(MB)',
  'download.allow_file_download': '允许下载文件',
  'download.download_dir': '下载目录',
  'vision.enabled': '视觉分析',
  'voice.enabled': '语音处理',
  'hook.rate_limit.enabled': '限流',
  'dedupe.enabled': '消息去重',
  'timing_gate.enabled': 'LLM定时网关',
  console_level: '控制台级别',
  file_level: '文件级别',
  file_path: '日志文件路径',
  max_log_days: '最大日志天数',
  window_ms: '去重窗口(毫秒)',
  max_size: '最大记录数',
  forward_max_images: '转发最大图片数',
  max_observe_messages: '最多观望消息数',
  respond_cooldown_sec: '回应冷却(秒)',
  recent_window_size: '近期窗口大小(条)',
  max_recent_responds: '窗口最大回应数',
  max_consecutive_skips: '连续跳过阈值',
  urgency_threshold: '紧急度阈值(0-1)',
  buffer_size: '缓冲区大小',
  script_path: '脚本路径',
}

// 布尔值字段路径集合
export const BOOLEAN_FIELDS = new Set([
  'trigger.auto_reply',
  'trigger.require_mention',
  'trigger.at_reply',
  'trigger.mention_reply',
  'bot.enable_self_evaluation',
  'emoji.steal_emoji',
  'emoji.auto_tag',
  'emoji.do_replace',
  'emoji.content_filtration',
  'memory.enabled',
  'memory.writeback.enabled',
  'memory.writeback.person_fact_enabled',
  'memory.writeback.chat_summary_enabled',
  'memory.weight_decay.enabled',
  'memory.global_memory.enabled',
  'memory.graph_memory.enabled',
  'web_search.enabled',
  'web_search.deep.fetch_content',
  'web_search.research.enabled',
  'web_search.allow_file_download',
  'download.use_thunder',
  'download.allow_file_download',
  'vision.enabled',
  'voice.enabled',
  'hook.rate_limit.enabled',
  'dedupe.enabled',
  'timing_gate.enabled',
  'browser.developer',
  'tong_shadow.enabled',
  'tong_shadow.inject_self_description',
])

// 固定选项字段
export type OptionItem = string | { label: string; value: string }
export const FIELD_OPTIONS: Record<string, OptionItem[]> = {
  'logger.console_level': ['debug', 'info', 'warn', 'error'],
  'logger.file_level': ['debug', 'info', 'warn', 'error'],
  'web_search.default_depth': [
    { label: '简易搜索 (simple)', value: 'simple' },
    { label: '常规搜索 (webpage)', value: 'webpage' },
    { label: '深度搜索 (depth)', value: 'depth' },
  ],
  'hook.mode': ['blacklist', 'whitelist'],
  'memory.search_mode': ['hybrid', 'keyword', 'vector'],
}

// 字段描述
export const FIELD_DESCRIPTIONS: Record<string, string> = {
  'web_search.default_depth':
    '简易搜索：Bing快速返回摘要，无需LLM\n常规搜索：搜索+抓取全文+LLM总结（默认）\n深度搜索：拆解子问题+并行搜索+综合报告',
}

// 计算行缩进
function getIndent(line: string): number {
  let n = 0
  while (n < line.length && (line[n] === ' ' || line[n] === '\t')) n++
  return n
}

// 解析 YAML 为分组可视化配置
export function parseYamlToSections(yaml: string): YamlSection[] {
  const sections: YamlSection[] = []
  const lines = yaml.split('\n')
  let currentSection: YamlSection | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    let indent = getIndent(line)

    // 顶层 section 或多行文本字段
    if (indent === 0 && (trimmed.endsWith(':') || /^\w[\w_]*:\s*\|/.test(trimmed))) {
      const topMatch = line.match(/^(\w[\w_]*):\s*(.*)$/)
      if (!topMatch) continue
      const sectionName = topMatch[1]
      const sectionVal = topMatch[2].trim()

      // 多行文本顶层字段
      if (sectionVal === '|') {
        const titleCN = SECTION_LABELS[sectionName] || sectionName
        currentSection = { title: sectionName, titleCN, fields: [] }
        sections.push(currentSection)

        let j = i + 1
        let multiVal = ''
        while (j < lines.length) {
          const nextLine = lines[j]
          let nextIndent = getIndent(nextLine)
          if (nextIndent === 0 && nextLine.trim() && !nextLine.trim().startsWith('#')) break
          if (nextLine.trim() && !nextLine.trim().startsWith('#')) {
            multiVal += (multiVal ? '\n' : '') + nextLine.trim()
          }
          j++
        }
        const fieldPath = sectionName
        const label = FIELD_LABELS[fieldPath] || SECTION_LABELS[sectionName] || sectionName.replace(/_/g, ' ')
        currentSection.fields.push({ path: fieldPath, label, value: multiVal, isLong: true })
        i = j - 1
        continue
      }

      // 普通 section
      const titleCN = SECTION_LABELS[sectionName] || sectionName
      currentSection = { title: sectionName, titleCN, fields: [] }
      sections.push(currentSection)
      continue
    }

    if (currentSection) {
      // 检测子节标题
      const isSubsection =
        trimmed.endsWith(':') &&
        !trimmed.includes(' ', trimmed.indexOf(':') + 1) &&
        i + 1 < lines.length &&
        (() => {
          const nextLine = lines[i + 1]
          let nextIndent = getIndent(nextLine)
          return nextIndent > indent && nextLine.trim() !== '' && !nextLine.trim().startsWith('#')
        })()

      if (isSubsection) {
        const subName = trimmed.slice(0, -1)
        let j = i + 1
        while (j < lines.length) {
          const childLine = lines[j]
          let childIndent = getIndent(childLine)
          if (childIndent <= indent) break
          const childTrimmed = childLine.trim()
          if (childTrimmed && !childTrimmed.startsWith('#')) {
            const childMatch = childLine.match(/^\s*(\w[\w_]*):\s*(.*)$/)
            if (childMatch) {
              if (childTrimmed.endsWith(':') && !childMatch[2]?.trim()) {
                const nextLine = lines[j + 1]
                if (nextLine) {
                  let nextIndent = getIndent(nextLine)
                  if (nextIndent > childIndent) continue
                }
              }
              let childVal = childMatch[2]?.trim() || ''
              const childKey = childMatch[1]
              const childPath = currentSection.title + '.' + subName + '.' + childKey
              const childLabel = FIELD_LABELS[childPath] || FIELD_LABELS[childKey] || childKey.replace(/_/g, ' ')
              const childIsLong =
                childKey === 'base_identity' ||
                childKey === 'default_style' ||
                childKey === 'behavior_rules' ||
                childKey === 'vision_rules'
              if (
                (childVal.startsWith('"') && childVal.endsWith('"')) ||
                (childVal.startsWith("'") && childVal.endsWith("'"))
              ) {
                childVal = childVal.slice(1, -1)
              }
              currentSection.fields.push({ path: childPath, label: childLabel, value: childVal, isLong: childIsLong })
            }
          }
          j++
        }
        i = j - 1
      } else {
        // 普通字段
        const match = line.match(/^\s*(\w[\w_]*):\s*(.*)$/)
        if (match) {
          const fieldKey = match[1]
          let val = match[2].trim()
          if (
            val === '' &&
            trimmed.endsWith(':') &&
            (i + 1 >= lines.length || lines[i + 1].trim() === '' || lines[i + 1].trim().startsWith('#'))
          ) {
            i++
            continue
          }
          const fieldPath = currentSection.title + '.' + fieldKey
          const label = FIELD_LABELS[fieldPath] || FIELD_LABELS[fieldKey] || fieldKey.replace(/_/g, ' ')
          const isLong =
            val.length > 60 ||
            fieldKey === 'base_identity' ||
            fieldKey === 'default_style' ||
            fieldKey === 'behavior_rules' ||
            fieldKey === 'vision_rules' ||
            fieldKey === 'describe_prompt'
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1)
          }
          // 多行字符串
          if (val === '|') {
            let j = i + 1
            let multiVal = ''
            const baseIndent = indent + 2
            while (j < lines.length) {
              const nextLine = lines[j]
              let nextIndent = getIndent(nextLine)
              if (nextIndent < baseIndent && nextLine.trim()) break
              if (nextLine.trim()) {
                multiVal += (multiVal ? '\n' : '') + nextLine.slice(nextIndent)
              }
              j++
            }
            i = j - 1
            val = multiVal
          }
          currentSection.fields.push({ path: fieldPath, label, value: val, isLong })
        }
      }
    }
  }

  return sections
}

// 根据路径设置值（支持任意深度嵌套和顶层字段）
export function setValueInYAML(rawContent: string, path: string, value: string): string {
  const lines = rawContent.split('\n')
  const parts = path.split('.')
  let found = false

  // 顶层字段
  if (parts.length === 1) {
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim()
      if (getIndent(lines[i]) === 0 && trimmed.startsWith(parts[0] + ':')) {
        if (value.includes('\n')) {
          lines[i] = `${parts[0]}: |`
          let j = i + 1
          while (j < lines.length) {
            const nextIndent = getIndent(lines[j])
            if (nextIndent === 0 && lines[j].trim()) break
            j++
          }
          lines.splice(i + 1, j - i - 1, ...value.split('\n').map((v) => `  ${v}`))
        } else {
          const formattedVal =
            value.includes(' ') || value.includes('#') || value.includes(':') ? `"${value}"` : value
          lines[i] = `${parts[0]}: ${formattedVal}`
          let k = i + 1
          while (k < lines.length) {
            const nextIndent = getIndent(lines[k])
            if (nextIndent === 0 && lines[k].trim()) break
            k++
          }
          if (k > i + 1) {
            lines.splice(i + 1, k - i - 1)
          }
        }
        found = true
        break
      }
    }
    if (!found) {
      if (value.includes('\n')) {
        lines.push('', `${parts[0]}: |`, ...value.split('\n').map((v) => `  ${v}`))
      } else {
        const formattedVal =
          value.includes(' ') || value.includes('#') || value.includes(':') ? `"${value}"` : value
        lines.push('', `${parts[0]}: ${formattedVal}`)
      }
    }
    return lines.join('\n')
  }

  // 嵌套字段
  let depth = 0
  let expectedIndent = 0
  let targetLine = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const indent = getIndent(line)

    if (depth > 0 && indent < expectedIndent && trimmed) {
      break
    }

    if (depth === 0) {
      if (indent === 0 && trimmed === parts[0] + ':') {
        depth = 1
        expectedIndent = 2
      }
      continue
    }

    const fieldMatch = line.match(/^\s*(\w[\w_]*):\s*(.*)$/)
    if (!fieldMatch || fieldMatch[1] !== parts[depth]) continue

    const fieldVal = fieldMatch[2].trim()

    if (depth === parts.length - 1) {
      targetLine = i
      found = true
      break
    }

    if (fieldVal === '' && i + 1 < lines.length) {
      const nextIndent = getIndent(lines[i + 1])
      if (nextIndent > indent && lines[i + 1].trim() && !lines[i + 1].trim().startsWith('#')) {
        depth++
        expectedIndent = indent + 2
        continue
      }
    }
  }

  // 写回修改
  if (found && targetLine >= 0) {
    const targetIndent = getIndent(lines[targetLine])
    const fieldName = parts[parts.length - 1]

    if (value.includes('\n')) {
      lines[targetLine] = ' '.repeat(targetIndent) + `${fieldName}: |`
      let j = targetLine + 1
      while (j < lines.length) {
        const nextIndent = getIndent(lines[j])
        if (nextIndent <= targetIndent && lines[j].trim()) break
        j++
      }
      lines.splice(
        targetLine + 1,
        j - targetLine - 1,
        ...value.split('\n').map((v) => ' '.repeat(targetIndent + 2) + v),
      )
    } else {
      let formattedVal = value
      if (value === 'true' || value === 'false' || (!isNaN(Number(value)) && value !== '')) {
        // 布尔/数字保持原样
      } else if (value.includes(' ') || value.includes('#') || value.includes(':')) {
        formattedVal = `"${value}"`
      }
      lines[targetLine] = ' '.repeat(targetIndent) + `${fieldName}: ${formattedVal}`
      let k = targetLine + 1
      while (k < lines.length) {
        const nextIndent = getIndent(lines[k])
        if (nextIndent <= targetIndent && lines[k].trim()) break
        k++
      }
      if (k > targetLine + 1) {
        lines.splice(targetLine + 1, k - targetLine - 1)
      }
    }
  }

  // 字段不存在则追加
  if (!found) {
    const fieldName = parts[parts.length - 1]
    let sectionEnd = lines.length
    let inSection = false
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim()
      const indent = getIndent(lines[i])
      if (indent === 0 && trimmed === parts[0] + ':') {
        inSection = true
        continue
      }
      if (inSection && indent === 0 && trimmed) {
        sectionEnd = i
        break
      }
    }

    if (value.includes('\n')) {
      const insertLines = [`  ${fieldName}: |`, ...value.split('\n').map((v) => `    ${v}`)]
      lines.splice(sectionEnd, 0, ...insertLines)
    } else {
      let formattedVal = value
      if (value === 'true' || value === 'false' || (!isNaN(Number(value)) && value !== '')) {
        // 保持原样
      } else if (value.includes(' ') || value.includes('#') || value.includes(':')) {
        formattedVal = `"${value}"`
      }
      lines.splice(sectionEnd, 0, `  ${fieldName}: ${formattedVal}`)
    }
  }

  return lines.join('\n')
}
