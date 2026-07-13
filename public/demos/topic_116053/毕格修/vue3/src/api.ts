// 毕格修后端 API 封装层
// 后端服务地址：开发环境通过 Vite 代理转发到 http://localhost:8000

const API_BASE = ''

// 字段名到中文检查项名称的映射
const FIELD_NAME_MAP: Record<string, string> = {
  font_size: '字号',
  font_name_eastasia: '中文字体',
  font_name: '英文字体',
  bold: '加粗',
  alignment: '对齐方式',
  line_spacing: '行距',
  line_spacing_rule: '行距规则',
  first_line_indent: '首行缩进',
  space_before: '段前间距',
  space_after: '段后间距',
  outline_level: '大纲级别',
  top_margin: '上页边距',
  bottom_margin: '下页边距',
  left_margin: '左页边距',
  right_margin: '右页边距',
}

// 格式化显示值
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '未设置'
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'number') {
    // 字号字段显示为磅
    return String(value)
  }
  return String(value)
}

// 后端返回的修改项结构
export interface ModificationItem {
  target_type: string
  target_index: number
  field: string
  current_value: unknown
  target_value: unknown
  description?: string | null
}

export interface ModificationPlan {
  items: ModificationItem[]
  summary?: string | null
  total_items: number
}

export interface FixReport {
  total_modified: number
  details: string[]
  output_filename?: string | null
}

export interface FixResponse {
  report: FixReport
  output_file: string
  download_url: string
  plan?: ModificationPlan
}

export interface DocumentFormat {
  sections: unknown[]
  paragraphs: unknown[]
  tables: unknown[]
  total_paragraphs: number
  total_tables: number
}

export interface CheckResultItem {
  name: string
  detail: string
  pass: boolean
}

// 上传 .docx 文件并获取格式分析结果
export async function analyzeDocument(file: File): Promise<DocumentFormat> {
  const formData = new FormData()
  formData.append('file', file)
  const resp = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    body: formData,
  })
  if (!resp.ok) {
    const detail = await safeReadError(resp)
    throw new Error(detail)
  }
  return resp.json()
}

// 上传 .docx 文件执行完整修复流程
export async function fixDocument(file: File): Promise<FixResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const resp = await fetch(`${API_BASE}/api/fix`, {
    method: 'POST',
    body: formData,
  })
  if (!resp.ok) {
    const detail = await safeReadError(resp)
    throw new Error(detail)
  }
  return resp.json()
}

// 仅检查文档格式问题，返回问题清单与文档格式信息
export async function checkDocument(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const resp = await fetch(`${API_BASE}/api/check`, {
    method: 'POST',
    body: formData,
  })
  if (!resp.ok) {
    const detail = await safeReadError(resp)
    throw new Error(detail)
  }
  return resp.json()
}

// 仅修复文档（使用检查阶段获取的 plan），返回下载链接与报告
export async function repairDocument(file: File, plan: object) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('plan', JSON.stringify(plan))
  const resp = await fetch(`${API_BASE}/api/repair`, {
    method: 'POST',
    body: formData,
  })
  if (!resp.ok) {
    const detail = await safeReadError(resp)
    throw new Error(detail)
  }
  return resp.json()
}

// 获取模板规范规则集
export async function getTemplateRules(): Promise<Record<string, unknown>> {
  const resp = await fetch(`${API_BASE}/api/template-rules`)
  if (!resp.ok) {
    throw new Error('获取模板规范失败')
  }
  return resp.json()
}

// 拼接下载修正文件的完整 URL
export function buildDownloadUrl(filename: string): string {
  return `${API_BASE}/api/download/${encodeURIComponent(filename)}`
}

// 将后端修改方案转换为前端检查结果列表
// 未在 plan.items 中出现的检查项视为通过，出现的视为未通过
export function planToCheckResults(plan: ModificationPlan | undefined): CheckResultItem[] {
  if (!plan || !plan.items || plan.items.length === 0) {
    return [
      { name: '格式检查', detail: '未发现格式偏差，文档符合模板规范', pass: true },
    ]
  }

  // 按字段分组统计
  const grouped: Record<string, ModificationItem[]> = {}
  for (const item of plan.items) {
    const key = item.field || 'other'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(item)
  }

  return Object.entries(grouped).map(([field, items]) => {
    const first = items[0]
    const name = FIELD_NAME_MAP[field] || field
    const currentStr = formatValue(first.current_value)
    const targetStr = formatValue(first.target_value)
    const detail = first.description
      ? first.description
      : `当前：${currentStr} → 应为：${targetStr}（共 ${items.length} 处）`
    return { name, detail, pass: false }
  })
}

async function safeReadError(resp: Response): Promise<string> {
  try {
    const text = await resp.text()
    try {
      const data = JSON.parse(text)
      return data.detail || data.message || text || `请求失败 (${resp.status})`
    } catch {
      return text || `请求失败 (${resp.status})`
    }
  } catch {
    return `请求失败 (${resp.status})`
  }
}
