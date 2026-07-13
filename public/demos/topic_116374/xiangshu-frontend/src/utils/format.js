// 通用格式化工具

// 秒数 → mm:ss
export function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 性别码 → 中文
export function genderText(code) {
  return code === 1 ? '男' : code === 2 ? '女' : '未知'
}

// 性别对应的样式 class
export function genderClass(code) {
  return code === 1 ? 'male' : code === 2 ? 'female' : 'unknown'
}

// 年份范围：出生 - 去世（或至今）
export function lifeSpan(birth, death) {
  if (!birth) return '生年不详'
  return death ? `${birth} — ${death}` : `${birth} — 至今`
}

// 文档类型 → Lucide 图标名（统一走 Iconify）
export function docTypeIcon(type) {
  const map = {
    地契: 'lucide:scroll',
    家谱: 'lucide:book-open',
    奖状: 'lucide:award',
    书信: 'lucide:mail'
  }
  return map[type] || 'lucide:file-text'
}

// 文档类型对应的封面样式 class
export function docTypeClass(type) {
  const map = {
    地契: 'deed',
    家谱: 'genealogy',
    奖状: 'award',
    书信: 'letter'
  }
  return map[type] || 'default'
}

// 日期格式化 → YYYY-MM-DD
export function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
