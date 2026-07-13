import { diffLines } from 'diff'

// ==================== 歌词行结构类型 ====================

/** 歌词单行 */
export interface LyricLine {
  id: number
  text: string
}

/** 歌词 JSON 数据（存入数据库的格式） */
export interface LyricData {
  lines: LyricLine[]
}

/** 选区模型：基于行 ID + 行内偏移 */
export interface LyricSelection {
  lineId: number
  startInLine: number
  endInLine: number
  text: string
}

// ==================== 转换工具 ====================

/** 纯文本 → LyricData */
export const parseLyricData = (raw: string): LyricData => {
  // 尝试解析 JSON
  try {
    const parsed = JSON.parse(raw) as LyricData
    if (Array.isArray(parsed.lines) && parsed.lines.length > 0 && typeof parsed.lines[0].id === 'number') {
      return parsed
    }
  } catch {
    // 非 JSON，按纯文本解析
  }
  // 纯文本兜底：按行拆分
  return plainTextToLyricData(raw)
}

/** 纯文本 → LyricData */
export const plainTextToLyricData = (text: string): LyricData => {
  const lines = text.split('\n')
  return {
    lines: lines.map((line, index) => ({ id: index + 1, text: line })),
  }
}

/** LyricData → 纯文本（用于 AI 上下文等场景） */
export const lyricDataToPlainText = (data: LyricData): string => {
  return data.lines.map((line) => line.text).join('\n')
}

/** LyricData → JSON 字符串（用于入库） */
export const lyricDataToJson = (data: LyricData): string => {
  return JSON.stringify(data)
}

/** 根据 lineId 查找行 */
export const findLineById = (data: LyricData, lineId: number): LyricLine | undefined => {
  return data.lines.find((line) => line.id === lineId)
}

/** 替换指定行中选中部分的文本，返回新的 LyricData */
export const replaceLineText = (data: LyricData, lineId: number, startInLine: number, endInLine: number, replacement: string): LyricData => {
  return {
    lines: data.lines.map((line) => {
      if (line.id !== lineId) return line
      const newText = line.text.slice(0, startInLine) + replacement + line.text.slice(endInLine)
      return { ...line, text: newText }
    }),
  }
}

/** 获取最大行 ID */
export const getMaxLineId = (data: LyricData): number => {
  return data.lines.reduce((max, line) => Math.max(max, line.id), 0)
}

/** 添加行到末尾（自动分配 ID） */
export const appendLyricLine = (data: LyricData, text: string): LyricData => {
  const nextId = getMaxLineId(data) + 1
  return { lines: [...data.lines, { id: nextId, text }] }
}

// ==================== 旧版兼容类型（版本 diff） ====================

export interface LyricGenerateInput {
  prompt: string
  style: string
  mood: string
  language: string
}

export interface LyricCandidate {
  title: string
  content: string
}

export const buildLyricGenerateInput = (params: LyricGenerateInput) => {
  return [
    '任务类型：生成歌词',
    `创作内容：${params.prompt}`,
    `曲风：${params.style}`,
    `情绪：${params.mood}`,
    `语言：${params.language}`,
  ]
    .filter(Boolean)
    .join('\n')
}

const getSection = (text: string, sectionTitle: string) => {
  const escaped = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = text.match(new RegExp(`##\\s*${escaped}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`))
  return match?.[1]?.trim() || ''
}

export const parseGeneratedLyric = (outputText: string) => {
  const lyric = getSection(outputText, '歌词')
  const note = getSection(outputText, '创作说明')
  return {
    lyric: lyric || outputText.trim(),
    note,
  }
}

export const normalizePlainLyricText = (text: string, mode: 'lyric' | 'candidate' = 'lyric') => {
  const plainText = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .trim()
  if (mode === 'candidate') return plainText
  const sectionStart = plainText.search(/^\s*\[[^\]\n]+\]/m)
  return sectionStart >= 0 ? plainText.slice(sectionStart).trim() : plainText
}

// 仅匹配 AI 原样回传的 prompt 指令行（要精准，不能误杀候选内容）
export const isPromptInstruction = (text: string) => {
  const t = text.trim()
  if (/^你是一位/.test(t)) return true
  if (/^需要替换的原文[：:]/.test(t)) return true
  if (/^选中的原文[：:]/.test(t)) return true
  if (/^上下文[：:（(]/.test(t)) return true
  if (/^上文[：:]/.test(t)) return true
  if (/^下文[：:]/.test(t)) return true
  if (/^完整歌词[（(]/.test(t)) return true
  if (/^修改要求[：:]/.test(t)) return true
  if (/^请严格按/.test(t)) return true
  if (/^任务类型[：:]/.test(t)) return true
  if (/^规则[（(]/.test(t)) return true
  if (/^示例[：:]/.test(t)) return true
  if (/^每个候选/.test(t)) return true
  if (/^候选文字/.test(t)) return true
  if (/^绝对不要/.test(t)) return true
  if (/^参考上下文/.test(t)) return true
  if (/^候选\d$/.test(t)) return true
  if (/^替换文字[ABC]$/.test(t)) return true
  if (/^输出示例/.test(t)) return true
  // English labels (used in inputValue)
  if (/^Selected fragment to replace[：:]/.test(t)) return true
  if (/^Requirement[：:]/.test(t)) return true
  if (/^Full lyrics[：:]/.test(t)) return true
  if (/^Output format/i.test(t)) return true
  if (/^Strictly follow/i.test(t)) return true
  if (/^\[[^\]]+\]$/.test(t)) return true  // 段落标记 [Verse 1]
  return false
}

export const parseRewriteCandidates = (outputText: string): LyricCandidate[] => {
  const section = getSection(outputText, '修改候选') || outputText

  // 1. 尝试匹配 ### 标题格式
  const markdownMatches = Array.from(section.matchAll(/###\s*(.+?)\s*\n([\s\S]*?)(?=\n###\s+|\n##\s+|$)/g))
  if (markdownMatches.length > 0) {
    return markdownMatches
      .map((match) => ({
        title: normalizePlainLyricText(match[1].trim(), 'candidate'),
        content: normalizePlainLyricText(match[2].trim(), 'candidate'),
      }))
      .filter((item) => item.content && !isPromptInstruction(item.content) && !isPromptInstruction(item.title))
  }

  // 2. 按空行分段
  const segments = section.split(/\n{2,}/)
  const results: LyricCandidate[] = []
  for (const seg of segments) {
    const lines = seg.split('\n').filter((line) => !isPromptInstruction(line))
    const content = normalizePlainLyricText(lines.join('\n').trim(), 'candidate')
    if (content) {
      results.push({ title: `候选 ${results.length + 1}`, content })
    }
  }
  return results
}

export interface DiffRow {
  type: 'keep' | 'remove' | 'add' | 'change'
  line: string
  before: string
  after: string
}

/**
 * 基于 Myers diff 算法（和 Git 相同）的行级对比。
 * 右栏始终展示 current（新版）的完整歌词，差异行用颜色标注：
 * - keep:  未变化，普通显示
 * - remove: 被删除的行，红色删除线
 * - add:   新增的行，绿色
 * - change: 同一位置旧行→新行，黄色（旧文红色删除线→新文黄色）
 */
export const createLineDiff = (previous: string, current: string): DiffRow[] => {
  const changes = diffLines(previous, current, { newlineIsToken: true })
  const rows: DiffRow[] = []

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i]
    const lines = change.value.replace(/\n$/, '').split('\n')

    if (!change.added && !change.removed) {
      // 未变化行
      for (const line of lines) {
        rows.push({ type: 'keep', line, before: '', after: '' })
      }
    } else if (change.removed) {
      // 被删除的行——看紧跟的下一个 change 是否是 added（配对为 change）
      const next = changes[i + 1]
      if (next && next.added) {
        const newLines = next.value.replace(/\n$/, '').split('\n')
        const maxLen = Math.max(lines.length, newLines.length)
        for (let j = 0; j < maxLen; j++) {
          const oldLine = lines[j] ?? ''
          const newLine = newLines[j] ?? ''
          if (oldLine && newLine) {
            // 同一位置旧→新，标记为 change
            rows.push({ type: 'change', line: newLine, before: oldLine, after: newLine })
          } else if (oldLine && !newLine) {
            // 旧行多出来，纯删除
            rows.push({ type: 'remove', line: oldLine, before: oldLine, after: '' })
          } else if (!oldLine && newLine) {
            // 新行多出来，纯新增
            rows.push({ type: 'add', line: newLine, before: '', after: newLine })
          }
        }
        i++ // 跳过下一个 added change（已经处理了）
      } else {
        // 纯删除，没有配对的新行
        for (const line of lines) {
          rows.push({ type: 'remove', line, before: line, after: '' })
        }
      }
    } else if (change.added) {
      // 纯新增（没有前导 removed 配对）
      for (const line of lines) {
        rows.push({ type: 'add', line, before: '', after: line })
      }
    }
  }

  return rows.filter((row) => row.line.trim() || row.before.trim())
}

/**
 * 为 LyricCanvas 等场景：将当前版本的每一行映射为 diff 状态。
 * 返回数组索引对应当前版本的行号，值为 'keep' | 'add' | 'change'。
 * （'remove' 不在当前版本中，所以不会出现。）
 */
export const mapCurrentLinesToDiff = (previous: string, current: string): Array<'keep' | 'add' | 'change'> => {
  const changes = diffLines(previous, current, { newlineIsToken: true })
  const result: Array<'keep' | 'add' | 'change'> = []

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i]
    const lines = change.value.replace(/\n$/, '').split('\n')

    if (!change.added && !change.removed) {
      for (const _line of lines) result.push('keep')
    } else if (change.removed) {
      // 被删除的行不在当前版本中，跳过
      // 但需要看下一个 change 是否是 added（配对为 change）
      const next = changes[i + 1]
      if (next && next.added) {
        const newLines = next.value.replace(/\n$/, '').split('\n')
        for (let j = 0; j < newLines.length; j++) {
          result.push('change')
        }
        i++ // 跳过 added change
      }
      // 纯删除，不往 result 里加行
    } else if (change.added) {
      // 纯新增
      for (const _line of lines) result.push('add')
    }
  }

  return result
}
