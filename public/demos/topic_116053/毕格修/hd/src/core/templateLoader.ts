import path from 'node:path'
import fs from 'node:fs'
import { logger } from '../utils/logger.js'
import { settings } from '../config.js'
import { parseDocx } from './docxParser.js'

// 模板目录中的规范文档与模板文档文件名（含中文、空格、点号，注意路径拼接）
const STANDARD_FILENAME = '0300.毕业生毕业论文（设计）撰写规范.docx'
const TEMPLATE_FILENAME = '0301. 毕业论文模板（院内版、企业版、联培版）.docx'

// 用于从规范文档提取规则的关键词列表
const FORMAT_KEYWORDS = [
  '宋体', '黑体', '楷体', 'Times New Roman',
  '初号', '小初', '一号', '小一', '二号', '小二',
  '三号', '小三', '四号', '小四', '五号', '小五',
  '1.5倍行距', '1.5 倍行距', '行距', '单倍行距', '双倍行距',
  '页边距', '上', '下', '左', '右', '上下', '左右',
  '首行缩进', '缩进', '页码', '页眉', '页脚',
  '对齐', '居中', '左对齐', '右对齐', '两端对齐', '加粗',
]

// 模板文档中提取出的样式三元组
interface TemplateStyleEntry {
  style_name: string | null
  font_name: string | null
  font_size_pt: number | null
}

// 规范文档提取结果
interface StandardExtractResult {
  standard_text: string
  extracted_rules: Record<string, string[]>
}

// 模板文档提取结果
interface TemplateExtractResult {
  template_styles?: TemplateStyleEntry[]
  template_page_setup?: Record<string, unknown>
}

/**
 * 毕业论文模板规范加载器：从模板目录读取规范文档与模板文档，
 * 提取格式规则，结合默认规则集返回完整规则对象。
 * 用于替代原 Python python-docx 实现。
 */
export class TemplateLoader {
  private readonly templateDir: string
  private _rulesCache: Record<string, unknown> | null

  constructor(templateDir?: string) {
    this.templateDir = templateDir || settings.TEMPLATE_DIR
    this._rulesCache = null
  }

  async loadRules(): Promise<Record<string, unknown>> {
    if (this._rulesCache) return this._rulesCache
    try {
      const rules = this._getDefaultRules()
      const standardData = await this._extractFromStandard()
      const templateData = await this._extractFromTemplate()
      rules['standard_text'] = standardData.standard_text || ''
      rules['extracted_rules'] = standardData.extracted_rules || {}
      rules['template_styles'] = templateData.template_styles || []
      rules['template_page_setup'] = templateData.template_page_setup || {}
      if (!rules['standard_text'] && !rules['template_styles']) {
        logger.warn(
          `未能从模板目录提取到任何规范信息，仅返回默认规则集: ${this.templateDir}`
        )
      }
      this._rulesCache = rules
      return rules
    } catch (e) {
      logger.warn(`模板规则加载异常，回退到默认规则集: ${e}`)
      this._rulesCache = this._getDefaultRules()
      return this._rulesCache
    }
  }

  // 韩山师范学院本科毕业论文通用规范默认规则集
  private _getDefaultRules(): Record<string, unknown> {
    return {
      page_setup: {
        top_margin_cm: 2.54,
        bottom_margin_cm: 2.54,
        left_margin_cm: 3.17,
        right_margin_cm: 3.17,
        paper_size: 'A4',
      },
      body_text: {
        chinese_font: '宋体',
        english_font: 'Times New Roman',
        font_size_pt: 12.0,
        line_spacing: 1.5,
        line_spacing_rule: '1.5_lines',
        first_line_indent_cm: 0.74,
        alignment: 'justify',
      },
      heading_1: {
        chinese_font: '黑体',
        english_font: 'Times New Roman',
        font_size_pt: 16.0,
        bold: true,
        alignment: 'center',
        outline_level: 0,
      },
      heading_2: {
        chinese_font: '黑体',
        english_font: 'Times New Roman',
        font_size_pt: 14.0,
        bold: true,
        alignment: 'left',
        outline_level: 1,
      },
      heading_3: {
        chinese_font: '黑体',
        english_font: 'Times New Roman',
        font_size_pt: 13.0,
        bold: true,
        alignment: 'left',
        outline_level: 2,
      },
      references: {
        chinese_font: '宋体',
        english_font: 'Times New Roman',
        font_size_pt: 10.5,
        line_spacing: 1.5,
      },
      abstract: {
        chinese_font: '宋体',
        english_font: 'Times New Roman',
        font_size_pt: 12.0,
        line_spacing: 1.5,
      },
      figure_caption: {
        chinese_font: '宋体',
        english_font: 'Times New Roman',
        font_size_pt: 10.5,
        alignment: 'center',
      },
      table_caption: {
        chinese_font: '宋体',
        english_font: 'Times New Roman',
        font_size_pt: 10.5,
        alignment: 'center',
      },
    }
  }

  // 从规范文档提取文本与关键词命中的段落
  private async _extractFromStandard(): Promise<StandardExtractResult> {
    const empty: StandardExtractResult = { standard_text: '', extracted_rules: {} }
    const standardPath = path.join(this.templateDir, STANDARD_FILENAME)
    if (!fs.existsSync(standardPath)) {
      logger.warn(`规范文档不存在: ${standardPath}`)
      return empty
    }
    try {
      const doc = await parseDocx(standardPath)
      const paragraphs = doc.paragraphs || []
      const standardText = paragraphs.map((p) => p.text).join('\n')
      const extractedRules: Record<string, string[]> = {}
      for (const para of paragraphs) {
        const text = para.text || ''
        for (const keyword of FORMAT_KEYWORDS) {
          if (text.includes(keyword)) {
            if (!extractedRules[keyword]) extractedRules[keyword] = []
            extractedRules[keyword].push(text)
          }
        }
      }
      return { standard_text: standardText, extracted_rules: extractedRules }
    } catch (e) {
      logger.warn(`规范文档解析异常: ${e}`)
      return empty
    }
  }

  // 从模板文档提取段落样式三元组与页面设置
  private async _extractFromTemplate(): Promise<TemplateExtractResult> {
    const templatePath = path.join(this.templateDir, TEMPLATE_FILENAME)
    if (!fs.existsSync(templatePath)) {
      logger.warn(`模板文档不存在: ${templatePath}`)
      return {}
    }
    try {
      const doc = await parseDocx(templatePath)

      // 提取段落样式三元组 (style_name, font_name, font_size_pt) 并去重
      const seen = new Set<string>()
      const templateStyles: TemplateStyleEntry[] = []
      for (const para of doc.paragraphs || []) {
        const styleName = para.format?.style_name ?? null
        const firstRun =
          para.runs && para.runs.length > 0 ? para.runs[0] : null
        const fontName = firstRun?.font_name ?? null
        const fontSizePt = firstRun?.font_size ?? null
        const key = JSON.stringify([styleName, fontName, fontSizePt])
        if (seen.has(key)) continue
        seen.add(key)
        templateStyles.push({
          style_name: styleName,
          font_name: fontName,
          font_size_pt: fontSizePt,
        })
      }

      // 从首个 section 提取页面设置
      let templatePageSetup: Record<string, unknown> = {}
      const section =
        doc.sections && doc.sections.length > 0 ? doc.sections[0] : null
      if (section) {
        templatePageSetup = {
          top_margin_cm: section.top_margin,
          bottom_margin_cm: section.bottom_margin,
          left_margin_cm: section.left_margin,
          right_margin_cm: section.right_margin,
          page_width_cm: section.page_width,
          page_height_cm: section.page_height,
          paper_size: this._detectPaperSize(
            section.page_width,
            section.page_height
          ),
        }
      }

      return {
        template_styles: templateStyles,
        template_page_setup: templatePageSetup,
      }
    } catch (e) {
      logger.warn(`模板文档解析异常: ${e}`)
      return {}
    }
  }

  // 根据宽高（cm）判定纸张型号
  private _detectPaperSize(
    widthCm: number | null,
    heightCm: number | null
  ): string {
    if (widthCm == null || heightCm == null) return 'unknown'
    if (Math.abs(widthCm - 21.0) < 0.5 && Math.abs(heightCm - 29.7) < 0.5)
      return 'A4'
    if (Math.abs(widthCm - 29.7) < 0.5 && Math.abs(heightCm - 42.0) < 0.5)
      return 'A3'
    if (Math.abs(widthCm - 21.59) < 0.5 && Math.abs(heightCm - 27.94) < 0.5)
      return 'Letter'
    return 'custom'
  }
}

/**
 * 获取模板规则的便捷函数：使用默认模板目录创建加载器并加载规则。
 */
export async function getTemplateRules(): Promise<Record<string, unknown>> {
  const loader = new TemplateLoader()
  return loader.loadRules()
}
