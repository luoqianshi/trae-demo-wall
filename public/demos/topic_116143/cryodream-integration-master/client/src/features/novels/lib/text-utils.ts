/**
 * 小说文本工具集 —— 严格排版格式化 & 精细字数统计
 *
 * 参考主流平台（简书 / 番茄小说作家系统 / 飞书文档 / Notion / Ulysses）的中文写作规范：
 * - 中英文之间自动加半角空格
 * - 中文段落使用中文标点（。！？，、；：），并避免多重连续中文标点
 * - 破折号 -- 或 -> 转为 —— ；连续英文句号 ... 或 . . . 转为 ……
 * - 智能弯引号：英文 " " → 中文 " "；英文 ' ' → 中文 ' '
 * - 段首两空格全角缩进
 * - 全角/半角混排自动清理
 */

// ─────────────────────────────────────────────
// 字数统计
// ─────────────────────────────────────────────

const CJK_REGEX = /[\u4e00-\u9fa5\u3400-\u4dbf\uf900-\ufaff]/g
const CJK_PUNCT_REGEX = /[\u3000-\u303f\uff00-\uffef]/g
const ASCII_WORD_REGEX = /[A-Za-z0-9]+/g

export interface WordStats {
  /** 总字数（汉字数 + 英文/数字词数），符合番茄小说、简书统计口径 */
  totalWords: number
  /** 纯汉字数 */
  cjkChars: number
  /** 中文标点数 */
  cjkPuncts: number
  /** 英文/数字单词数（连续字母数字算作 1 词） */
  asciiWords: number
  /** 字符数（含空格） */
  charsWithSpaces: number
  /** 字符数（不含空格与换行） */
  charsWithoutSpaces: number
  /** 段落数（按空行分段） */
  paragraphs: number
  /** 行数 */
  lines: number
  /** 阅读时长（分钟，按中文 350字/分 + 英文 200词/分 估算） */
  readingMinutes: number
}

/**
 * 去除 Markdown 语法后再统计（更贴近读者眼中的正文字数）
 * 主流平台的字数口径通常是"去掉标题号 / 引用号 / 列表号 / 代码围栏"后的正文
 */
function stripMarkdown(md: string): string {
  return md
    // 代码块
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]+`/g, '')
    // 图片 / 链接
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // 标题号 / 引用号 / 列表号
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}[-*+]\s+/gm, '')
    .replace(/^\s{0,3}\d+\.\s+/gm, '')
    // 表格分隔行
    .replace(/^\s*\|?[\s:-|]+\|?\s*$/gm, '')
    // 加粗/斜体/删除线符号
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(\*|_)(.+?)\1/g, '$2')
    .replace(/~~(.+?)~~/g, '$1')
    // HTML 标签
    .replace(/<[^>]+>/g, '')
}

/**
 * 精细字数统计
 */
export function computeWordStats(raw: string): WordStats {
  const text = stripMarkdown(raw ?? '')
  const cjkMatches = text.match(CJK_REGEX) ?? []
  const cjkPunctMatches = text.match(CJK_PUNCT_REGEX) ?? []
  const asciiWordMatches = text.match(ASCII_WORD_REGEX) ?? []

  const charsWithSpaces = text.length
  const charsWithoutSpaces = text.replace(/\s+/g, '').length
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean).length
  const lines = text.split(/\n/).length

  const cjkCount = cjkMatches.length
  const asciiCount = asciiWordMatches.length
  const totalWords = cjkCount + asciiCount

  const readingMinutes = Math.max(1, Math.round(cjkCount / 350 + asciiCount / 200))

  return {
    totalWords,
    cjkChars: cjkCount,
    cjkPuncts: cjkPunctMatches.length,
    asciiWords: asciiCount,
    charsWithSpaces,
    charsWithoutSpaces,
    paragraphs,
    lines,
    readingMinutes,
  }
}

/**
 * 简易字数（旧接口兼容）
 */
export function countWords(raw: string): number {
  return computeWordStats(raw).totalWords
}

// ─────────────────────────────────────────────
// 严格排版格式化
// ─────────────────────────────────────────────

export interface FormatOptions {
  /** 中英文/数字之间自动加半角空格 */
  autoSpaceBetweenCjkAscii?: boolean
  /** 智能弯引号（英文引号 → 中文引号） */
  smartQuotes?: boolean
  /** 中文标点归一（半角逗号/句号 → 全角） */
  chinesePunctuation?: boolean
  /** 破折号：-- 或 → 或 -> 转为 —— */
  fixDashes?: boolean
  /** 省略号：... 或 . . . 转为 …… */
  fixEllipsis?: boolean
  /** 段首两全角空格缩进 */
  indentParagraph?: boolean
  /** 折叠 3+ 连续空行为 1 空行 */
  collapseBlankLines?: boolean
  /** 折叠段落内多余空格（不影响代码块） */
  trimTrailingSpaces?: boolean
}

const DEFAULT_OPTIONS: Required<FormatOptions> = {
  autoSpaceBetweenCjkAscii: true,
  smartQuotes: true,
  chinesePunctuation: true,
  fixDashes: true,
  fixEllipsis: true,
  indentParagraph: false,
  collapseBlankLines: true,
  trimTrailingSpaces: true,
}

const CJK_CHAR = '[\\u4e00-\\u9fa5]'

/**
 * 中英文之间加半角空格
 * "你好world" → "你好 world"
 * "test中文" → "test 中文"
 */
function addSpaceBetweenCjkAscii(text: string): string {
  return text
    .replace(new RegExp(`(${CJK_CHAR})([A-Za-z0-9])`, 'g'), '$1 $2')
    .replace(new RegExp(`([A-Za-z0-9])(${CJK_CHAR})`, 'g'), '$1 $2')
}

/**
 * 智能弯引号
 * 英文 " → 中文 " "（成对识别）
 */
function applySmartQuotes(text: string): string {
  let result = ''
  let inDouble = false
  let inSingle = false
  const isCJKContext = (i: number) => {
    const prev = result.slice(-1)
    const next = text.charAt(i + 1)
    return CJK_REGEX.test(prev) || CJK_REGEX.test(next)
  }
  CJK_REGEX.lastIndex = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (ch === '"') {
      if (isCJKContext(i) || inDouble) {
        result += inDouble ? '\u201D' : '\u201C'
        inDouble = !inDouble
      } else {
        result += ch
      }
    } else if (ch === "'") {
      const prev = result.slice(-1)
      const isApostrophe = /[A-Za-z]/.test(prev) && /[A-Za-z]/.test(text.charAt(i + 1))
      if (isApostrophe) {
        result += "'"
      } else if (isCJKContext(i) || inSingle) {
        result += inSingle ? '\u2019' : '\u2018'
        inSingle = !inSingle
      } else {
        result += ch
      }
    } else {
      result += ch
    }
  }
  return result
}

/**
 * 中文标点归一
 */
function normalizeChinesePunctuation(text: string): string {
  return text.replace(/([\u4e00-\u9fa5])([,.!?;:])/g, (_, cjk: string, punct: string) => {
    const map: Record<string, string> = {
      ',': '，',
      '.': '。',
      '!': '！',
      '?': '？',
      ';': '；',
      ':': '：',
    }
    return cjk + (map[punct] ?? punct)
  })
}

/** 破折号 */
function fixDashes(text: string): string {
  return text.replace(/--+/g, '——').replace(/-{1,2}>/g, '——')
}

/** 省略号 */
function fixEllipsis(text: string): string {
  return text
    .replace(/\.{3,}/g, '……')
    .replace(/(\. ){2,}\.?/g, '……')
    .replace(/(。 ){2,}。?/g, '……')
}

/** 段首缩进：为每个非空段落添加两个全角空格（跳过标题、引用、列表、代码块） */
function indentParagraphs(text: string): string {
  const lines = text.split('\n')
  let inCode = false
  return lines
    .map((line) => {
      if (line.trim().startsWith('```')) {
        inCode = !inCode
        return line
      }
      if (inCode) return line
      const trimmed = line.trimStart()
      if (!trimmed) return line
      if (/^(#{1,6}\s|>\s|[-*+]\s|\d+\.\s|\|)/.test(trimmed)) return line
      // 已有全角空格前缀跳过
      if (line.startsWith('\u3000\u3000')) return line
      // 首字符是引号 / 破折号等不缩进（对白）
      if (/^["""''「『（(]/.test(trimmed)) return '\u3000\u3000' + trimmed
      return '\u3000\u3000' + trimmed
    })
    .join('\n')
}

/** 折叠连续空行 */
function collapseBlanks(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n')
}

/** 去除行尾空格 */
function trimTrailing(text: string): string {
  return text.replace(/[ \t]+$/gm, '')
}

/**
 * 综合格式化
 * @param raw 原始文本
 * @param options 各项开关
 */
export function formatText(raw: string, options: FormatOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let text = raw
  // 保护代码块 —— 提取 -> 处理 -> 放回
  const codeBlocks: string[] = []
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match)
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`
  })
  const inlineCodes: string[] = []
  text = text.replace(/`[^`\n]+`/g, (match) => {
    inlineCodes.push(match)
    return `__INLINE_CODE_${inlineCodes.length - 1}__`
  })

  if (opts.chinesePunctuation) text = normalizeChinesePunctuation(text)
  if (opts.smartQuotes) text = applySmartQuotes(text)
  if (opts.fixDashes) text = fixDashes(text)
  if (opts.fixEllipsis) text = fixEllipsis(text)
  if (opts.autoSpaceBetweenCjkAscii) text = addSpaceBetweenCjkAscii(text)
  if (opts.indentParagraph) text = indentParagraphs(text)
  if (opts.collapseBlankLines) text = collapseBlanks(text)
  if (opts.trimTrailingSpaces) text = trimTrailing(text)

  // 放回代码
  text = text.replace(/__INLINE_CODE_(\d+)__/g, (_, i) => inlineCodes[Number(i)] ?? '')
  text = text.replace(/__CODE_BLOCK_(\d+)__/g, (_, i) => codeBlocks[Number(i)] ?? '')

  return text
}

// ─────────────────────────────────────────────
// 结构化提取
// ─────────────────────────────────────────────

export interface HeadingItem {
  level: number
  text: string
  id: string
  line: number
}

/**
 * 从 markdown 提取所有 heading（章节内小标题定位使用）
 */
export function extractHeadings(md: string): HeadingItem[] {
  const items: HeadingItem[] = []
  const lines = (md ?? '').split('\n')
  let inCode = false
  lines.forEach((line, idx) => {
    if (line.trim().startsWith('```')) {
      inCode = !inCode
      return
    }
    if (inCode) return
    const match = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line)
    if (match) {
      const level = match[1]!.length
      const text = match[2]!.trim()
      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff]+/g, '-')
        .replace(/^-+|-+$/g, '')
      items.push({ level, text, id, line: idx })
    }
  })
  return items
}

// ─────────────────────────────────────────────
// 导出为文件
// ─────────────────────────────────────────────

export function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 将 Markdown 转为纯文本 TXT
 */
export function markdownToPlainText(md: string): string {
  return stripMarkdown(md).replace(/\n{3,}/g, '\n\n').trim()
}
