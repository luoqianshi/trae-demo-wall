import type { TrustLevel, ActivitySource } from '@/types'

export function copyToClipboard(text: string, label: string = '内容'): void {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      // success handled by caller via message
    }).catch(() => {
      fallbackCopy(text)
    })
  } else {
    fallbackCopy(text)
  }
}

function fallbackCopy(text: string): void {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
  } catch {
    // ignore
  }
  document.body.removeChild(textarea)
}

/** 可信分颜色 — 统一使用设计系统色值 */
export function getTrustColor(score: number): string {
  if (score >= 80) return '#00A870'
  if (score >= 50) return '#D97706'
  return '#DC2626'
}

/** 可信分 CSS class — 用于 trust-score-pill 组件 */
export function getTrustScoreClass(score: number): string {
  if (score >= 80) return 'trust-score-pill--high'
  if (score >= 50) return 'trust-score-pill--mid'
  return 'trust-score-pill--low'
}

export function getTrustLabel(level: TrustLevel): { text: string; color: string; bg: string } {
  switch (level) {
    case 'verified':
      return { text: '已核实', color: '#00A870', bg: '#ECFDF5' }
    case 'pending':
      return { text: '待核实', color: '#D97706', bg: '#FFFBEB' }
    case 'risk':
      return { text: '有风险', color: '#DC2626', bg: '#FEF2F2' }
  }
}

export function getSourceLabel(source: ActivitySource): string {
  switch (source) {
    case 'crawler':
      return '爬虫采集'
    case 'user':
      return '用户上传'
    case 'official':
      return '官方发布'
  }
}
