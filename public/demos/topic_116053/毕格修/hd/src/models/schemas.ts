import { z } from 'zod'

// 文本片段 (run) 的格式信息
export const RunFormatSchema = z.object({
  font_name: z.string().nullable().default(null),
  font_name_eastasia: z.string().nullable().default(null),
  font_size: z.number().nullable().default(null),
  bold: z.boolean().nullable().default(null),
  italic: z.boolean().nullable().default(null),
  underline: z.boolean().nullable().default(null),
  color: z.string().nullable().default(null),
})
export type RunFormat = z.infer<typeof RunFormatSchema>

// 段落格式信息
export const ParagraphFormatSchema = z.object({
  alignment: z.string().nullable().default(null),
  line_spacing: z.number().nullable().default(null),
  line_spacing_rule: z.string().nullable().default(null),
  space_before: z.number().nullable().default(null),
  space_after: z.number().nullable().default(null),
  first_line_indent: z.number().nullable().default(null),
  left_indent: z.number().nullable().default(null),
  outline_level: z.number().int().nullable().default(null),
  style_name: z.string().nullable().default(null),
})
export type ParagraphFormat = z.infer<typeof ParagraphFormatSchema>

// 段落信息
export const ParagraphInfoSchema = z.object({
  index: z.number().int(),
  text: z.string().default(''),
  runs: z.array(RunFormatSchema).default([]),
  format: ParagraphFormatSchema.default(ParagraphFormatSchema.parse({})),
})
export type ParagraphInfo = z.infer<typeof ParagraphInfoSchema>

// 表格信息
export const TableInfoSchema = z.object({
  index: z.number().int(),
  rows: z.number().int().default(0),
  cols: z.number().int().default(0),
  cells: z.array(z.array(z.string())).default([]),
})
export type TableInfo = z.infer<typeof TableInfoSchema>

// 节 / 页面格式信息
export const SectionFormatSchema = z.object({
  top_margin: z.number().nullable().default(null),
  bottom_margin: z.number().nullable().default(null),
  left_margin: z.number().nullable().default(null),
  right_margin: z.number().nullable().default(null),
  page_width: z.number().nullable().default(null),
  page_height: z.number().nullable().default(null),
  orientation: z.string().nullable().default(null),
  header_text: z.string().nullable().default(null),
  footer_text: z.string().nullable().default(null),
})
export type SectionFormat = z.infer<typeof SectionFormatSchema>

// 完整文档格式信息
export const DocumentFormatSchema = z.object({
  sections: z.array(SectionFormatSchema).default([]),
  paragraphs: z.array(ParagraphInfoSchema).default([]),
  tables: z.array(TableInfoSchema).default([]),
  total_paragraphs: z.number().int().default(0),
  total_tables: z.number().int().default(0),
})
export type DocumentFormat = z.infer<typeof DocumentFormatSchema>

// 单个修改项
export const ModificationItemSchema = z.object({
  target_type: z.string(),
  target_index: z.number().int(),
  field: z.string(),
  current_value: z.unknown().nullable().default(null),
  target_value: z.unknown().nullable().default(null),
  description: z.string().nullable().default(null),
})
export type ModificationItem = z.infer<typeof ModificationItemSchema>

// 修改方案
export const ModificationPlanSchema = z.object({
  items: z.array(ModificationItemSchema).default([]),
  summary: z.string().nullable().default(null),
  total_items: z.number().int().default(0),
})
export type ModificationPlan = z.infer<typeof ModificationPlanSchema>

// 修改报告
export const FixReportSchema = z.object({
  total_modified: z.number().int().default(0),
  details: z.array(z.string()).default([]),
  output_filename: z.string().nullable().default(null),
})
export type FixReport = z.infer<typeof FixReportSchema>

// 工厂函数：创建空默认对象（便于内部构造）
export function createEmptyParagraphFormat(): ParagraphFormat {
  return ParagraphFormatSchema.parse({})
}
export function createEmptyDocumentFormat(): DocumentFormat {
  return DocumentFormatSchema.parse({})
}
export function createEmptyFixReport(): FixReport {
  return FixReportSchema.parse({})
}
