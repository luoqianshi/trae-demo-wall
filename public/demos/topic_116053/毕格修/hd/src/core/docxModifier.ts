import { DOMParser, XMLSerializer } from '@xmldom/xmldom'
import type { Document, Element, Node } from '@xmldom/xmldom'
import JSZip from 'jszip'
import fs from 'node:fs'
import path from 'node:path'
import { logger } from '../utils/logger.js'
import { settings } from '../config.js'
import type { FixReport, ModificationItem, ModificationPlan } from '../models/schemas.js'

// OOXML 命名空间
const NS = {
  w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
}

// 节点类型常量
const ELEMENT_NODE = 1

// 对齐方式映射（python-docx -> OOXML）
const ALIGNMENT_TO_OOXML: Record<string, string> = {
  left: 'left',
  center: 'center',
  right: 'right',
  justify: 'both',
}

// 行距规则映射（python-docx -> OOXML）
const LINE_SPACING_RULE_TO_OOXML: Record<string, { lineRule: string; line?: number }> = {
  single: { lineRule: 'auto', line: 240 },
  '1.5_lines': { lineRule: 'auto', line: 360 },
  double: { lineRule: 'auto', line: 480 },
  multiple: { lineRule: 'auto' },
  at_least: { lineRule: 'atLeast' },
  exactly: { lineRule: 'exact' },
}

// 节级 margin 字段 -> w:pgMar 属性名
const SECTION_MARGIN_FIELDS: Record<string, string> = {
  top_margin: 'top',
  bottom_margin: 'bottom',
  left_margin: 'left',
  right_margin: 'right',
}

// ===== 单位转换（与原 Python _to_pt/_to_cm 一致）=====

// target_value 转 pt：>1000 视为 EMU 除以 12700，否则直接是 pt
function toPt(value: unknown): number | null {
  if (value == null) return null
  const v = Number(value)
  if (isNaN(v)) return null
  return v > 1000 ? v / 12700 : v
}

// target_value 转 cm：>1000 视为 EMU 除以 360000，否则直接是 cm
function toCm(value: unknown): number | null {
  if (value == null) return null
  const v = Number(value)
  if (isNaN(v)) return null
  return v > 1000 ? v / 360000 : v
}

// cm 转 twips（写入 OOXML 属性）：twips = cm * 567
function cmToTwips(cm: number): number {
  return Math.round(cm * 567)
}

// pt 转 twips：twips = pt * 20
function ptToTwips(pt: number): number {
  return Math.round(pt * 20)
}

// pt 转半磅（字号）：halfPoints = pt * 2
function ptToHalfPoints(pt: number): number {
  return Math.round(pt * 2)
}

// 时间戳格式 YYYYMMDD_HHMMSS
function formatTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

// 兼容多种类型的布尔转换
function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    const lower = v.toLowerCase()
    return lower === 'true' || v === '1'
  }
  if (typeof v === 'number') return v !== 0
  return Boolean(v)
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

/** 设置 w 命名空间下的属性值 */
function setAttr(el: Element, localName: string, value: string): void {
  el.setAttribute(`w:${localName}`, value)
}

/** 移除 w 命名空间下的属性值 */
function removeAttr(el: Element, localName: string): void {
  const qualified = `w:${localName}`
  if (el.hasAttribute(qualified)) {
    el.removeAttribute(qualified)
  } else if (el.hasAttributeNS(NS.w, localName)) {
    el.removeAttributeNS(NS.w, localName)
  }
}

// ===== XML 辅助函数 =====

/** 获取或创建指定命名空间子元素（不存在则创建并追加） */
function getOrCreateChild(parent: Element, ns: string, localName: string): Element {
  const existing = firstChild(parent, localName)
  if (existing) return existing
  const doc = parent.ownerDocument
  if (!doc) throw new Error('元素没有关联的 Document')
  const el = doc.createElementNS(ns, `w:${localName}`)
  parent.appendChild(el)
  return el
}

/** 获取或创建段落的 w:pPr（不存在则创建并插入为段落第一个子元素） */
function ensurePPr(paragraph: Element): Element {
  const existing = firstChild(paragraph, 'pPr')
  if (existing) return existing
  const doc = paragraph.ownerDocument
  if (!doc) throw new Error('元素没有关联的 Document')
  const pPr = doc.createElementNS(NS.w, 'w:pPr')
  // pPr 必须是段落的第一个子元素
  paragraph.insertBefore(pPr, paragraph.firstChild)
  return pPr
}

/** 获取或创建 run 的 w:rPr（不存在则创建并插入为 run 第一个子元素） */
function ensureRPr(run: Element): Element {
  const existing = firstChild(run, 'rPr')
  if (existing) return existing
  const doc = run.ownerDocument
  if (!doc) throw new Error('元素没有关联的 Document')
  const rPr = doc.createElementNS(NS.w, 'w:rPr')
  // rPr 应为 run 的第一个子元素
  run.insertBefore(rPr, run.firstChild)
  return rPr
}

/** 设置 run 字体：eastasia 设置 w:eastAsia，western 设置 w:ascii 和 w:hAnsi */
function setRunFont(run: Element, eastasia?: string, western?: string): void {
  const rPr = ensureRPr(run)
  const rFonts = getOrCreateChild(rPr, NS.w, 'rFonts')
  if (eastasia !== undefined) {
    setAttr(rFonts, 'eastAsia', eastasia)
  }
  if (western !== undefined) {
    setAttr(rFonts, 'ascii', western)
    setAttr(rFonts, 'hAnsi', western)
  }
}

/** 设置段落大纲级别（先移除已有 w:outlineLvl，再添加新的） */
function setOutlineLevel(paragraph: Element, level: number): void {
  const pPr = ensurePPr(paragraph)
  // 先移除已有的 w:outlineLvl
  const existing = firstChild(pPr, 'outlineLvl')
  if (existing) {
    pPr.removeChild(existing)
  }
  // 添加新的 w:outlineLvl
  const doc = pPr.ownerDocument
  if (!doc) throw new Error('元素没有关联的 Document')
  const outlineLvl = doc.createElementNS(NS.w, 'w:outlineLvl')
  setAttr(outlineLvl, 'val', String(level))
  pPr.appendChild(outlineLvl)
}

/** 获取段落中所有 run（含超链接内的 run） */
function getAllRuns(paragraph: Element): Element[] {
  const runs: Element[] = []
  for (const r of childElements(paragraph, 'r')) {
    runs.push(r)
  }
  for (const hl of childElements(paragraph, 'hyperlink')) {
    for (const r of childElements(hl, 'r')) {
      runs.push(r)
    }
  }
  return runs
}

// ===== DocxModifier 类 =====

/**
 * Word 文档格式修改器：基于 jszip + @xmldom/xmldom 直接操作 word/document.xml
 * 的 XML 元素应用格式修改，用于替代原 Python python-docx 实现。
 */
export class DocxModifier {
  private readonly filePath: string
  private zip: JSZip | null = null
  private documentDoc: Document | null = null
  private details: string[]
  private modifiedCount: number

  constructor(filePath: string) {
    this.filePath = filePath
    this.details = []
    this.modifiedCount = 0
  }

  async applyPlan(plan: ModificationPlan): Promise<FixReport> {
    await this._load()

    const total = plan.items?.length ?? 0
    let modifiedCount = 0
    const details: string[] = []

    for (let idx = 0; idx < (plan.items?.length ?? 0); idx++) {
      const item = plan.items[idx]
      try {
        if (item.target_type === 'section') {
          await this._applySectionModification(item)
        } else if (item.target_type === 'paragraph') {
          await this._applyParagraphModification(item)
        } else if (item.target_type === 'run') {
          await this._applyRunModification(item)
        } else {
          logger.warn(`第 ${idx} 项未知 target_type=${item.target_type}，已跳过`)
          continue
        }
        modifiedCount++
        const desc =
          item.description ||
          `${item.target_type}[${item.target_index}].${item.field} -> ${item.target_value}`
        details.push(desc)
        logger.info(`第 ${idx} 项修改成功: ${desc}`)
      } catch (e) {
        logger.warn(
          `第 ${idx} 项修改失败 (target_type=${item.target_type}, index=${item.target_index}, field=${item.field}): ${e}`
        )
      }
    }

    const outputFilename = await this._saveOutput()
    const report: FixReport = {
      total_modified: modifiedCount,
      details,
      output_filename: outputFilename,
    }
    logger.info(
      `修改方案应用完成: 成功 ${modifiedCount} / 共 ${total} 项，输出文件=${outputFilename}`
    )
    return report
  }

  private async _load(): Promise<void> {
    if (this.zip) return
    const data = await fs.promises.readFile(this.filePath)
    this.zip = await JSZip.loadAsync(data)
    const file = this.zip.file('word/document.xml')
    if (!file) {
      throw new Error(`docx 文件缺少 word/document.xml: ${this.filePath}`)
    }
    const xmlContent = await file.async('text')
    const parser = new DOMParser({
      onError: (level, msg) => {
        if (level === 'fatalError') {
          throw new Error(`XML 解析致命错误: ${msg}`)
        }
        logger.warn({ level, msg }, 'XML 解析告警')
      },
    })
    this.documentDoc = parser.parseFromString(xmlContent, 'application/xml')
  }

  private async _saveOutput(): Promise<string> {
    const filename = `fixed_${formatTimestamp(new Date())}.docx`
    const outputDir = settings.OUTPUT_DIR
    await fs.promises.mkdir(outputDir, { recursive: true })
    const outputPath = path.join(outputDir, filename)
    // 序列化 XML 写回 jszip
    const updatedXml = new XMLSerializer().serializeToString(this.documentDoc!)
    this.zip!.file('word/document.xml', updatedXml)
    const buffer = await this.zip!.generateAsync({ type: 'nodebuffer' })
    await fs.promises.writeFile(outputPath, buffer)
    logger.info(`已保存修正后文档: ${outputPath}`)
    return filename
  }

  private _getBody(): Element {
    if (!this.documentDoc) throw new Error('文档未加载')
    const root = this.documentDoc.documentElement
    if (!root) throw new Error('文档缺少根元素')
    const body = firstChild(root, 'body')
    if (!body) throw new Error('文档缺少 w:body 元素')
    return body
  }

  /** 收集所有 w:sectPr 元素（包括 body 下的和段落 pPr 下的），按文档顺序返回 */
  private _collectSections(): Element[] {
    if (!this.documentDoc) throw new Error('文档未加载')
    const root = this.documentDoc.documentElement
    if (!root) return []
    return descendants(root, 'sectPr')
  }

  /** 获取 body 下第 index 个 w:p 元素（跳过 w:tbl） */
  private _getParagraph(index: number): Element | null {
    if (index < 0) return null
    const body = this._getBody()
    let pIndex = 0
    for (let n = body.firstChild; n; n = n.nextSibling) {
      if (n.nodeType !== ELEMENT_NODE) continue
      const ln = localNameOf(n)
      if (ln === 'p') {
        if (pIndex === index) return n as Element
        pIndex++
      }
    }
    return null
  }

  // ===== 三级修改方法 =====

  /** 节级修改：top/bottom/left/right_margin */
  private async _applySectionModification(item: ModificationItem): Promise<void> {
    const sections = this._collectSections()
    if (item.target_index < 0 || item.target_index >= sections.length) {
      throw new Error(`节索引越界: ${item.target_index} (共 ${sections.length} 节)`)
    }
    const sectPr = sections[item.target_index]
    const field = item.field
    const targetValue = item.target_value

    const marginAttr = SECTION_MARGIN_FIELDS[field]
    if (marginAttr) {
      const cm = toCm(targetValue)
      if (cm === null) throw new Error(`无效的 ${field} 值: ${targetValue}`)
      const pgMar = getOrCreateChild(sectPr, NS.w, 'pgMar')
      setAttr(pgMar, marginAttr, String(cmToTwips(cm)))
      return
    }

    throw new Error(`不支持的节字段: ${field}`)
  }

  /** 段落级修改 */
  private async _applyParagraphModification(item: ModificationItem): Promise<void> {
    const paragraph = this._getParagraph(item.target_index)
    if (!paragraph) {
      throw new Error(`段落索引越界: ${item.target_index}`)
    }

    const field = item.field
    const targetValue = item.target_value

    switch (field) {
      case 'font_size':
      case 'font_name_eastasia':
      case 'font_name':
      case 'bold': {
        // 对段落所有 run 应用 run 级字段
        const runs = getAllRuns(paragraph)
        for (const run of runs) {
          this._applyRunField(run, field, targetValue)
        }
        break
      }
      case 'alignment': {
        if (targetValue == null) throw new Error('alignment 值为 null')
        const pPr = ensurePPr(paragraph)
        const jc = getOrCreateChild(pPr, NS.w, 'jc')
        const val = ALIGNMENT_TO_OOXML[String(targetValue)] || String(targetValue)
        setAttr(jc, 'val', val)
        break
      }
      case 'line_spacing': {
        const v = Number(targetValue)
        if (isNaN(v)) throw new Error(`无效的 line_spacing 值: ${targetValue}`)
        const pPr = ensurePPr(paragraph)
        const spacing = getOrCreateChild(pPr, NS.w, 'spacing')
        if (v >= 100) {
          // 视为 pt 固定值
          setAttr(spacing, 'line', String(ptToTwips(v)))
          setAttr(spacing, 'lineRule', 'exact')
        } else {
          // 视为倍数
          setAttr(spacing, 'line', String(Math.round(v * 240)))
          setAttr(spacing, 'lineRule', 'auto')
        }
        break
      }
      case 'line_spacing_rule': {
        const mapping = LINE_SPACING_RULE_TO_OOXML[String(targetValue)]
        if (!mapping) throw new Error(`不支持的 line_spacing_rule: ${targetValue}`)
        const pPr = ensurePPr(paragraph)
        const spacing = getOrCreateChild(pPr, NS.w, 'spacing')
        setAttr(spacing, 'lineRule', mapping.lineRule)
        if (mapping.line !== undefined) {
          setAttr(spacing, 'line', String(mapping.line))
        }
        break
      }
      case 'first_line_indent': {
        const cm = toCm(targetValue)
        if (cm === null) throw new Error(`无效的 first_line_indent 值: ${targetValue}`)
        const pPr = ensurePPr(paragraph)
        const ind = getOrCreateChild(pPr, NS.w, 'ind')
        setAttr(ind, 'firstLine', String(cmToTwips(cm)))
        break
      }
      case 'space_before': {
        const pt = toPt(targetValue)
        if (pt === null) throw new Error(`无效的 space_before 值: ${targetValue}`)
        const pPr = ensurePPr(paragraph)
        const spacing = getOrCreateChild(pPr, NS.w, 'spacing')
        setAttr(spacing, 'before', String(ptToTwips(pt)))
        break
      }
      case 'space_after': {
        const pt = toPt(targetValue)
        if (pt === null) throw new Error(`无效的 space_after 值: ${targetValue}`)
        const pPr = ensurePPr(paragraph)
        const spacing = getOrCreateChild(pPr, NS.w, 'spacing')
        setAttr(spacing, 'after', String(ptToTwips(pt)))
        break
      }
      case 'outline_level': {
        const level = Number(targetValue)
        if (isNaN(level)) throw new Error(`无效的 outline_level 值: ${targetValue}`)
        setOutlineLevel(paragraph, Math.round(level))
        break
      }
      default:
        throw new Error(`不支持的段落字段: ${field}`)
    }
  }

  /** Run 级修改：对该段落所有 run 应用 font_size/font_name_eastasia/font_name/bold */
  private async _applyRunModification(item: ModificationItem): Promise<void> {
    const paragraph = this._getParagraph(item.target_index)
    if (!paragraph) {
      throw new Error(`段落索引越界: ${item.target_index}`)
    }
    const runs = getAllRuns(paragraph)
    for (const run of runs) {
      this._applyRunField(run, item.field, item.target_value)
    }
  }

  /** 对单个 run 应用字段修改 */
  private _applyRunField(run: Element, field: string, targetValue: unknown): void {
    switch (field) {
      case 'font_size': {
        const pt = toPt(targetValue)
        if (pt === null) throw new Error(`无效的 font_size 值: ${targetValue}`)
        const rPr = ensureRPr(run)
        const sz = getOrCreateChild(rPr, NS.w, 'sz')
        const szCs = getOrCreateChild(rPr, NS.w, 'szCs')
        const hp = String(ptToHalfPoints(pt))
        setAttr(sz, 'val', hp)
        setAttr(szCs, 'val', hp)
        break
      }
      case 'font_name_eastasia': {
        if (targetValue == null) throw new Error('font_name_eastasia 值为 null')
        setRunFont(run, String(targetValue), undefined)
        break
      }
      case 'font_name': {
        if (targetValue == null) throw new Error('font_name 值为 null')
        setRunFont(run, undefined, String(targetValue))
        break
      }
      case 'bold': {
        const rPr = ensureRPr(run)
        const b = getOrCreateChild(rPr, NS.w, 'b')
        if (toBool(targetValue)) {
          // true: 移除 val 属性（默认为加粗）
          removeAttr(b, 'val')
        } else {
          // false: 设置 val="0"
          setAttr(b, 'val', '0')
        }
        break
      }
      default:
        throw new Error(`不支持的 run 字段: ${field}`)
    }
  }
}

/** 便捷函数：修改 docx 文件并返回修复报告 */
export async function modifyDocx(
  filePath: string,
  plan: ModificationPlan
): Promise<FixReport> {
  const modifier = new DocxModifier(filePath)
  return modifier.applyPlan(plan)
}
