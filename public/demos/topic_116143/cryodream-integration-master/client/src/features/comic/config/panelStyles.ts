import type { PanelStyle } from '../types'

/**
 * 分格风格预设：将样式设置一次性描述好。
 * 视觉设计要点（灵感借鉴 impeccable / 优质设计规范）：
 *  - 中性色带色调（warm/cool gray）而不是纯灰
 *  - 阴影用不透明度而不是黑色调深浅
 *  - 圆角使用连续 modular scale（0 / 4 / 8 / 12 / 20）
 */

export interface PanelStyleSpec {
  /** 主描边颜色 */
  border: string
  /** 主描边宽度（px，画布坐标） */
  borderWidth: number
  /** 圆角大小 */
  cornerRadius: number
  /** 分格填充色（缺省 #ffffff） */
  fill?: string
  /** 是否绘制第二层描边（外圈或内圈） */
  outerStroke?: {
    color: string
    width: number
    /** 偏移量：负值向外扩，正值向内收 */
    offset: number
    cornerRadius: number
  }
  /** 阴影配置（可选） */
  shadow?: {
    color: string
    blur: number
    offsetX: number
    offsetY: number
    opacity: number
  }
  /** 是否给分格添加内发光/内阴影效果（Konva 不原生支持，用叠加 Rect 实现） */
  innerGlow?: {
    color: string
    /** 距离描边多少像素画一层浅色 */
    inset: number
    width: number
  }
  /** 展示用的中文名 */
  label: string
  /** 简短描述 */
  desc: string
}

export const PANEL_STYLE_PRESETS: Record<Exclude<PanelStyle, 'custom'>, PanelStyleSpec> = {
  classic: {
    label: '日系经典',
    desc: '粗黑线 · 直角',
    border: '#141414',
    borderWidth: 4,
    cornerRadius: 0,
    fill: '#ffffff',
    shadow: {
      color: 'rgba(15, 23, 42, 1)',
      blur: 4,
      offsetX: 2,
      offsetY: 2,
      opacity: 0.08,
    },
  },
  soft: {
    label: '柔和',
    desc: '细描边 · 大圆角',
    border: '#94a3b8', // cool gray-400
    borderWidth: 1.5,
    cornerRadius: 20,
    fill: '#fefefe',
    shadow: {
      color: 'rgba(15, 23, 42, 1)',
      blur: 24,
      offsetX: 0,
      offsetY: 8,
      opacity: 0.06,
    },
  },
  paper: {
    label: '纸质',
    desc: '米色描边 · 温柔投影',
    border: '#a1887f', // warm brown gray
    borderWidth: 2,
    cornerRadius: 8,
    fill: '#fdfaf2', // 米白
    shadow: {
      color: 'rgba(120, 53, 15, 1)', // warm shadow
      blur: 20,
      offsetX: 0,
      offsetY: 6,
      opacity: 0.1,
    },
    innerGlow: {
      color: 'rgba(180, 83, 9, 0.08)',
      inset: 4,
      width: 1,
    },
  },
  manga: {
    label: '极简线稿',
    desc: '细黑线 · 微阴影',
    border: '#0f172a', // slate-900
    borderWidth: 1.5,
    cornerRadius: 4,
    fill: '#ffffff',
    shadow: {
      color: 'rgba(15, 23, 42, 1)',
      blur: 12,
      offsetX: 0,
      offsetY: 4,
      opacity: 0.08,
    },
  },
  retro: {
    label: '复古双线',
    desc: '双层描边',
    border: '#0f172a',
    borderWidth: 3,
    cornerRadius: 2,
    fill: '#ffffff',
    outerStroke: {
      color: '#0f172a',
      width: 1,
      offset: -6,
      cornerRadius: 4,
    },
  },
  ink: {
    label: '水墨',
    desc: '深灰粗线 · 淡纸底',
    border: '#1f2937', // gray-800
    borderWidth: 5,
    cornerRadius: 6,
    fill: '#f8f7f3', // 淡纸底
    shadow: {
      color: 'rgba(15, 23, 42, 1)',
      blur: 20,
      offsetX: 2,
      offsetY: 6,
      opacity: 0.14,
    },
  },
  neon: {
    label: '霓虹',
    desc: '亮色发光',
    border: '#22d3ee', // cyan-400
    borderWidth: 2.5,
    cornerRadius: 14,
    fill: '#0f172a', // 深底
    shadow: {
      color: 'rgba(34, 211, 238, 1)',
      blur: 24,
      offsetX: 0,
      offsetY: 0,
      opacity: 0.55,
    },
  },
}

export const PANEL_STYLE_ORDER: Array<Exclude<PanelStyle, 'custom'>> = [
  'classic',
  'manga',
  'soft',
  'paper',
  'retro',
  'ink',
  'neon',
]

/**
 * 根据 style 派生实际绘制参数。
 * 现在应用只使用固定的 'soft' 风格；旧数据的 style/borderColor 会被忽略。
 */
export function resolvePanelStyle(_panel: {
  style?: PanelStyle
  borderColor: string
  borderWidth: number
  cornerRadius: number
}): PanelStyleSpec {
  return PANEL_STYLE_PRESETS.soft
}
