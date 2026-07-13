import { readFileSync } from 'node:fs'
import { DOMParser } from '@xmldom/xmldom'
import type { Document, Element, Node } from '@xmldom/xmldom'
import JSZip from 'jszip'
import { logger } from '../utils/logger.js'
import type {
  DocumentFormat,
  ParagraphFormat,
  ParagraphInfo,
  RunFormat,
  SectionFormat,
  TableInfo,
} from '../models/schemas.js'

// OOXML 命名空间
const NS = {
  w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
  r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
}

// 关系类型：页眉 / 页脚
const REL_HEADER =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/header'
const REL_FOOTER =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer'

// 节点类型常量
const ELEMENT_NODE = 1

// ===== 单位转换 =====
// OOXML 中长度属性单位为 twips（dxa）：1 cm = 567 twips，1 pt = 20 twips
function twipsToCm(twips: number): number {
  return twips / 567
}
function twipsToPt(twips: number): number {
  return twips / 20
}
// 字号为半磅：pt = val / 2
function halfPointsToPt(hp: number): number {
  return hp / 2
}

// ===== DOM 工具函数 =====

/** 获取节点 local name（兼容 xmldom 的 localName 与 nodeName 解析） */
function localNameOf(node: Node): string {
  const ln = node.localName
  if (ln) return ln
  const name = node.nodeName || ''
  const idx = name.indexOf(':')
  return idx >= 0 ? name.substring(idx + 1) : name
}

/** 获取第一个直接子元素（按 local name 匹配，忽略命名空间前缀） */
function firstChild(parent: Node | null, localName: string): Element | null {
  if (!parent) return null
  for (let n = parent.firstChild; n; n = n.nextSibling) {
    if (n.nodeType !== ELEMENT_NODE) continue
    if (localNameOf(n) === localName) return n as Element
  }
  return null
}

/** 获取所有直接子元素（按 local name 匹配） */
function childElements(parent: Node, localName: string): Element[] {
  const result: Element[] = []
  for (let n = parent.firstChild; n; n = n.nextSibling) {
    if (n.nodeType !== ELEMENT_NODE) continue
    if (localNameOf(n) === localName) result.push(n as Element)
  }
  return result
}

/** 递归查找所有后代元素（按 local name 匹配） */
function descendants(parent: Node, localName: string): Element[] {
  const result: Element[] = []
  const walk = (node: Node): void => {
    for (let n = node.firstChild; n; n = n.nextSibling) {
      if (n.nodeType !== ELEMENT_NODE) continue
      if (localNameOf(n) === localName) result.push(n as Element)
      walk(n)
    }
  }
  walk(parent)
  return result
}

/** 读取 w 命名空间下的属性值：优先 w:localName，其次 localName，最后按命名空间 */
function getAttr(el: Element, localName: string): string | null {
  const qualified = `w:${localName}`
  if (el.hasAttribute(qualified)) {
    const v = el.getAttribute(qualified)
    return v === null ? '' : v
  }
  if (el.hasAttribute(localName)) {
    const v = el.getAttribute(localName)
    return v === null ? '' : v
  }
  if (el.hasAttributeNS(NS.w, localName)) {
    const v = el.getAttributeNS(NS.w, localName)
    return v === null ? '' : v
  }
  return null
}

/** 读取关系引用属性 r:id */
function getRelId(el: Element): string | null {
  if (el.hasAttribute('r:id')) {
    const v = el.getAttribute('r:id')
    return v === null ? '' : v
  }
  if (el.hasAttributeNS(NS.r, 'id')) {
    const v = el.getAttributeNS(NS.r, 'id')
    return v === null ? '' : v
  }
  return null
}

/** 解析 w:b / w:i 这类 on/off 布尔属性：存在即 true，w:val="0"/"false"/"off" 为 false */
function parseOnOff(el: Element | null): boolean | null {
  if (!el) return null
  const v = getAttr(el, 'val')
  if (v === null) return true
  const lower = v.toLowerCase()
  if (v === '0' || lower === 'false' || lower === 'off') return false
  return true
}

/** 解析下划线 w:u：存在且 val != "none" 即 true */
function parseUnderline(el: Element | null): boolean | null {
  if (!el) return null
  const v = getAttr(el, 'val')
  if (v === null) return true
  if (v.toLowerCase() === 'none') return false
  return true
}

/** 安全解析整数，失败或 null 返回 null */
function parseIntSafe(v: string | null): number | null {
  if (v === null) return null
  const n = parseInt(v, 10)
  return isNaN(n) ? null : n
}

/** 提取元素内所有 w:t 文本（含 w:tab/w:br 处理），忽略域指令等非可见文本 */
function extractText(parent: Node): string {
  const parts: string[] = []
  const walk = (node: Node): void => {
    for (let n = node.firstChild; n; n = n.nextSibling) {
      if (n.nodeType !== ELEMENT_NODE) continue
      const ln = localNameOf(n)
      if (ln === 't') {
        parts.push(n.textContent || '')
      } else if (ln === 'tab') {
        parts.push('\t')
      } else if (ln === 'br' || ln === 'cr') {
        parts.push('\n')
      } else {
        walk(n)
      }
    }
  }
  walk(parent)
  return parts.join('')
}

/**
 * Word 文档解析器：基于 jszip + @xmldom/xmldom 解析 .docx 内部 OOXML，
 * 用于替代原 Python python-docx 实现。
 */
export class DocxParser {
  private readonly filePath: string

  constructor(filePath: string) {
    this.filePath = filePath
  }

  async parse(): Promise<DocumentFormat> {
    logger.info({ filePath: this.filePath }, '开始解析 docx 文件')

    const data = readFileSync(this.filePath)
    const zip = await JSZip.loadAsync(data)

    // 1. 读取主文档 document.xml
    const documentXml = await this.readZipFile(zip, 'word/document.xml')
    if (documentXml === null) {
      throw new Error(`docx 文件缺少 word/document.xml: ${this.filePath}`)
    }
    const doc = this.parseXml(documentXml)

    // 2. 读取样式表 styles.xml（失败不中断）
    let styleMap = new Map<string, string>()
    const stylesXml = await this.readZipFile(zip, 'word/styles.xml')
    if (stylesXml !== null) {
      try {
        styleMap = this.parseStyles(this.parseXml(stylesXml))
      } catch (err) {
        logger.warn(
          { err: (err as Error).message },
          '解析 styles.xml 失败，将使用空样式表'
        )
      }
    }

    // 3. 读取关系与页眉/页脚文本
    const rels = await this.parseRelationships(zip)
    const { headerTexts, footerTexts } = await this.parseHeaderFooterTexts(zip, rels)

    // 4. 解析节/页面格式
    const sections = this.parseSections(doc, headerTexts, footerTexts)

    // 5. 解析正文段落与表格
    const body = this.getDocumentBody(doc)
    const { paragraphs, tables } = this.parseBodyContent(body, styleMap)

    const result: DocumentFormat = {
      sections,
      paragraphs,
      tables,
      total_paragraphs: paragraphs.length,
      total_tables: tables.length,
    }

    logger.info(
      {
        sections: result.sections.length,
        total_paragraphs: result.total_paragraphs,
        total_tables: result.total_tables,
      },
      'docx 解析完成'
    )
    return result
  }

  // ===== 内部方法 =====

  private parseXml(xml: string): Document {
    const parser = new DOMParser({
      onError: (level, msg) => {
        if (level === 'fatalError') {
          throw new Error(`XML 解析致命错误: ${msg}`)
        }
        logger.warn({ level, msg }, 'XML 解析告警')
      },
    })
    return parser.parseFromString(xml, 'application/xml')
  }

  private async readZipFile(zip: JSZip, name: string): Promise<string | null> {
    const file = zip.file(name)
    if (!file) return null
    const text = await file.async('text')
    // 去除可能存在的 UTF-8 BOM
    if (text.length > 0 && text.charCodeAt(0) === 0xfeff) {
      return text.substring(1)
    }
    return text
  }

  private getDocumentBody(doc: Document): Element {
    const root = doc.documentElement
    if (!root) throw new Error('文档缺少根元素')
    const body = firstChild(root, 'body')
    if (!body) throw new Error('文档缺少 w:body 元素')
    return body
  }

  // ----- 样式表 -----

  private parseStyles(stylesDoc: Document | null): Map<string, string> {
    const map = new Map<string, string>()
    if (!stylesDoc) return map
    const root = stylesDoc.documentElement
    if (!root) return map
    for (const style of childElements(root, 'style')) {
      const styleId =
        style.getAttribute('w:styleId') || style.getAttribute('styleId')
      if (!styleId) continue
      const nameEl = firstChild(style, 'name')
      const name = nameEl ? getAttr(nameEl, 'val') : null
      if (name) map.set(styleId, name)
    }
    return map
  }

  // ----- 关系（document.xml.rels） -----

  private async parseRelationships(
    zip: JSZip
  ): Promise<Map<string, { target: string; type: string }>> {
    const map = new Map<string, { target: string; type: string }>()
    let relsXml: string | null = null
    try {
      relsXml = await this.readZipFile(zip, 'word/_rels/document.xml.rels')
    } catch (err) {
      logger.warn(
        { err: (err as Error).message },
        '读取 document.xml.rels 失败'
      )
      return map
    }
    if (!relsXml) return map
    let doc: Document
    try {
      doc = this.parseXml(relsXml)
    } catch (err) {
      logger.warn({ err: (err as Error).message }, '解析关系文件失败')
      return map
    }
    const root = doc.documentElement
    if (!root) return map
    for (const rel of descendants(root, 'Relationship')) {
      const id = rel.getAttribute('Id')
      const target = rel.getAttribute('Target')
      const type = rel.getAttribute('Type')
      if (id && target && type) {
        map.set(id, { target, type })
      }
    }
    return map
  }

  // ----- 页眉 / 页脚文本 -----

  private async parseHeaderFooterTexts(
    zip: JSZip,
    rels: Map<string, { target: string; type: string }>
  ): Promise<{
    headerTexts: Map<string, string>
    footerTexts: Map<string, string>
  }> {
    const headerTexts = new Map<string, string>()
    const footerTexts = new Map<string, string>()
    for (const [id, { target, type }] of rels) {
      if (type !== REL_HEADER && type !== REL_FOOTER) continue
      const fullPath = this.resolveTargetPath(target)
      const xml = await this.readZipFile(zip, fullPath)
      if (xml === null) {
        logger.warn({ target: fullPath }, '页眉/页脚文件不存在')
        continue
      }
      let text = ''
      try {
        const hfDoc = this.parseXml(xml)
        const root = hfDoc.documentElement
        text = root ? extractText(root) : ''
      } catch (err) {
        logger.warn(
          { err: (err as Error).message, target: fullPath },
          '解析页眉/页脚失败'
        )
      }
      if (type === REL_HEADER) headerTexts.set(id, text)
      else footerTexts.set(id, text)
    }
    return { headerTexts, footerTexts }
  }

  /** 将关系 Target 解析为 zip 内路径（相对于 word/ 目录） */
  private resolveTargetPath(target: string): string {
    if (target.startsWith('/')) return target.substring(1)
    return `word/${target}`
  }

  // ----- 节 / 页面格式 -----

  private parseSections(
    doc: Document,
    headerTexts: Map<string, string>,
    footerTexts: Map<string, string>
  ): SectionFormat[] {
    const root = doc.documentElement
    if (!root) return []
    const sections: SectionFormat[] = []
    for (const sectPr of descendants(root, 'sectPr')) {
      try {
        const { header, footer } = this.resolveSectionHeaderFooter(
          sectPr,
          headerTexts,
          footerTexts
        )
        sections.push(this.parseSection(sectPr, header, footer))
      } catch (err) {
        logger.warn({ err: (err as Error).message }, '解析节属性失败')
      }
    }
    return sections
  }

  private resolveSectionHeaderFooter(
    sectPr: Element,
    headerTexts: Map<string, string>,
    footerTexts: Map<string, string>
  ): { header: string; footer: string } {
    const headerParts: string[] = []
    const footerParts: string[] = []
    for (let n = sectPr.firstChild; n; n = n.nextSibling) {
      if (n.nodeType !== ELEMENT_NODE) continue
      const ln = localNameOf(n)
      const el = n as Element
      if (ln === 'headerReference') {
        const rid = getRelId(el)
        if (rid) {
          const t = headerTexts.get(rid)
          if (t) headerParts.push(t)
        }
      } else if (ln === 'footerReference') {
        const rid = getRelId(el)
        if (rid) {
          const t = footerTexts.get(rid)
          if (t) footerParts.push(t)
        }
      }
    }
    return { header: headerParts.join(''), footer: footerParts.join('') }
  }

  private parseSection(
    sectPr: Element,
    headerText: string,
    footerText: string
  ): SectionFormat {
    const section: SectionFormat = {
      top_margin: null,
      bottom_margin: null,
      left_margin: null,
      right_margin: null,
      page_width: null,
      page_height: null,
      orientation: null,
      header_text: null,
      footer_text: null,
    }

    const pgMar = firstChild(sectPr, 'pgMar')
    if (pgMar) {
      const top = parseIntSafe(getAttr(pgMar, 'top'))
      if (top !== null) section.top_margin = twipsToCm(top)
      const bottom = parseIntSafe(getAttr(pgMar, 'bottom'))
      if (bottom !== null) section.bottom_margin = twipsToCm(bottom)
      const left = parseIntSafe(getAttr(pgMar, 'left'))
      if (left !== null) section.left_margin = twipsToCm(left)
      const right = parseIntSafe(getAttr(pgMar, 'right'))
      if (right !== null) section.right_margin = twipsToCm(right)
    }

    const pgSz = firstChild(sectPr, 'pgSz')
    if (pgSz) {
      const w = parseIntSafe(getAttr(pgSz, 'w'))
      if (w !== null) section.page_width = twipsToCm(w)
      const h = parseIntSafe(getAttr(pgSz, 'h'))
      if (h !== null) section.page_height = twipsToCm(h)
      const orient = getAttr(pgSz, 'orient')
      if (orient) section.orientation = orient
    }

    section.header_text = headerText || null
    section.footer_text = footerText || null
    return section
  }

  // ----- 正文段落与表格 -----

  private parseBodyContent(
    body: Element,
    styleMap: Map<string, string>
  ): { paragraphs: ParagraphInfo[]; tables: TableInfo[] } {
    const paragraphs: ParagraphInfo[] = []
    const tables: TableInfo[] = []
    let pIndex = 0
    let tIndex = 0
    for (let n = body.firstChild; n; n = n.nextSibling) {
      if (n.nodeType !== ELEMENT_NODE) continue
      const ln = localNameOf(n)
      if (ln === 'p') {
        try {
          paragraphs.push(this.parseParagraph(n as Element, pIndex, styleMap))
        } catch (err) {
          logger.warn(
            { index: pIndex, err: (err as Error).message },
            '解析段落失败'
          )
        }
        pIndex++
      } else if (ln === 'tbl') {
        try {
          tables.push(this.parseTable(n as Element, tIndex))
        } catch (err) {
          logger.warn(
            { index: tIndex, err: (err as Error).message },
            '解析表格失败'
          )
        }
        tIndex++
      }
    }
    return { paragraphs, tables }
  }

  private parseParagraph(
    p: Element,
    index: number,
    styleMap: Map<string, string>
  ): ParagraphInfo {
    const text = extractText(p)
    const runs: RunFormat[] = []
    // 直接子 run
    for (const r of childElements(p, 'r')) {
      try {
        runs.push(this.parseRun(r))
      } catch (err) {
        logger.warn({ err: (err as Error).message }, '解析 run 失败')
      }
    }
    // 超链接中的 run
    for (const hl of childElements(p, 'hyperlink')) {
      for (const r of childElements(hl, 'r')) {
        try {
          runs.push(this.parseRun(r))
        } catch (err) {
          logger.warn({ err: (err as Error).message }, '解析 hyperlink run 失败')
        }
      }
    }

    const format = this.parseParagraphFormat(p, styleMap)
    return { index, text, runs, format }
  }

  private parseParagraphFormat(
    p: Element,
    styleMap: Map<string, string>
  ): ParagraphFormat {
    const format: ParagraphFormat = {
      alignment: null,
      line_spacing: null,
      line_spacing_rule: null,
      space_before: null,
      space_after: null,
      first_line_indent: null,
      left_indent: null,
      outline_level: null,
      style_name: null,
    }
    const pPr = firstChild(p, 'pPr')
    if (!pPr) return format

    // 样式名（查 styles.xml）
    const pStyle = firstChild(pPr, 'pStyle')
    if (pStyle) {
      const styleId = getAttr(pStyle, 'val')
      if (styleId) {
        format.style_name = styleMap.get(styleId) || styleId
      }
    }

    // 对齐方式
    const jc = firstChild(pPr, 'jc')
    if (jc) {
      const v = getAttr(jc, 'val')
      if (v) format.alignment = this.mapAlignment(v)
    }

    // 行距与段前段后
    const spacing = firstChild(pPr, 'spacing')
    if (spacing) {
      const line = parseIntSafe(getAttr(spacing, 'line'))
      const lineRule = getAttr(spacing, 'lineRule')
      if (line !== null) {
        if (lineRule === 'exact') {
          format.line_spacing = twipsToPt(line)
          format.line_spacing_rule = 'exactly'
        } else if (lineRule === 'atLeast') {
          format.line_spacing = twipsToPt(line)
          format.line_spacing_rule = 'at_least'
        } else {
          // auto 或缺省：240 = 单倍
          format.line_spacing = line / 240
          format.line_spacing_rule = 'multiple'
        }
      }
      const before = parseIntSafe(getAttr(spacing, 'before'))
      if (before !== null) format.space_before = twipsToPt(before)
      const after = parseIntSafe(getAttr(spacing, 'after'))
      if (after !== null) format.space_after = twipsToPt(after)
    }

    // 缩进
    const ind = firstChild(pPr, 'ind')
    if (ind) {
      const firstLine = parseIntSafe(getAttr(ind, 'firstLine'))
      if (firstLine !== null) format.first_line_indent = twipsToCm(firstLine)
      const left =
        parseIntSafe(getAttr(ind, 'left')) ??
        parseIntSafe(getAttr(ind, 'start'))
      if (left !== null) format.left_indent = twipsToCm(left)
    }

    // 大纲级别
    const outlineLvl = firstChild(pPr, 'outlineLvl')
    if (outlineLvl) {
      const v = parseIntSafe(getAttr(outlineLvl, 'val'))
      if (v !== null) format.outline_level = v
    }

    return format
  }

  private mapAlignment(v: string): string {
    switch (v) {
      case 'left':
      case 'start':
        return 'left'
      case 'center':
        return 'center'
      case 'right':
      case 'end':
        return 'right'
      case 'both':
      case 'justify':
      case 'distribute':
        return 'justify'
      default:
        return v
    }
  }

  private parseRun(r: Element): RunFormat {
    const format: RunFormat = {
      font_name: null,
      font_name_eastasia: null,
      font_size: null,
      bold: null,
      italic: null,
      underline: null,
      color: null,
    }
    const rPr = firstChild(r, 'rPr')
    if (!rPr) return format

    const rFonts = firstChild(rPr, 'rFonts')
    if (rFonts) {
      const ascii = getAttr(rFonts, 'ascii') ?? getAttr(rFonts, 'hAnsi')
      if (ascii) format.font_name = ascii
      const eastAsia = getAttr(rFonts, 'eastAsia')
      if (eastAsia) format.font_name_eastasia = eastAsia
    }

    const sz = firstChild(rPr, 'sz')
    if (sz) {
      const v = parseIntSafe(getAttr(sz, 'val'))
      if (v !== null) format.font_size = halfPointsToPt(v)
    }

    format.bold = parseOnOff(firstChild(rPr, 'b'))
    format.italic = parseOnOff(firstChild(rPr, 'i'))
    format.underline = parseUnderline(firstChild(rPr, 'u'))

    const color = firstChild(rPr, 'color')
    if (color) {
      const v = getAttr(color, 'val')
      if (v) format.color = v
    }

    return format
  }

  private parseTable(tbl: Element, index: number): TableInfo {
    const trs = childElements(tbl, 'tr')
    const cells: string[][] = []
    let maxCols = 0
    for (const tr of trs) {
      const tcs = childElements(tr, 'tc')
      const row: string[] = tcs.map((tc) => extractText(tc))
      if (tcs.length > maxCols) maxCols = tcs.length
      cells.push(row)
    }
    return {
      index,
      rows: trs.length,
      cols: maxCols,
      cells,
    }
  }
}

/** 解析 .docx 文件的便捷函数 */
export async function parseDocx(filePath: string): Promise<DocumentFormat> {
  const parser = new DocxParser(filePath)
  return parser.parse()
}
