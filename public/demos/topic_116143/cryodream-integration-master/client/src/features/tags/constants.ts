// 12 色预设色板（参考 Notion/Linear 风格）
// key 与后端对齐，值为 CSS 色值

export type TagColorKey =
  | 'gray'
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'brown'

export interface ColorDef {
  bg: string
  text: string
  border: string
}

export const colorPalette: Record<TagColorKey, ColorDef> = {
  gray: {
    bg: 'oklch(0.95 0.01 260)',
    text: 'oklch(0.40 0.02 260)',
    border: 'oklch(0.82 0.02 260)',
  },
  red: {
    bg: 'oklch(0.95 0.04 25)',
    text: 'oklch(0.45 0.12 25)',
    border: 'oklch(0.82 0.06 25)',
  },
  orange: {
    bg: 'oklch(0.95 0.05 60)',
    text: 'oklch(0.45 0.13 60)',
    border: 'oklch(0.82 0.07 60)',
  },
  amber: {
    bg: 'oklch(0.95 0.06 80)',
    text: 'oklch(0.45 0.14 80)',
    border: 'oklch(0.82 0.08 80)',
  },
  yellow: {
    bg: 'oklch(0.96 0.07 95)',
    text: 'oklch(0.45 0.15 95)',
    border: 'oklch(0.84 0.09 95)',
  },
  green: {
    bg: 'oklch(0.95 0.05 155)',
    text: 'oklch(0.42 0.13 155)',
    border: 'oklch(0.82 0.07 155)',
  },
  teal: {
    bg: 'oklch(0.95 0.04 175)',
    text: 'oklch(0.42 0.11 175)',
    border: 'oklch(0.82 0.06 175)',
  },
  blue: {
    bg: 'oklch(0.95 0.04 250)',
    text: 'oklch(0.42 0.13 250)',
    border: 'oklch(0.82 0.06 250)',
  },
  indigo: {
    bg: 'oklch(0.94 0.05 275)',
    text: 'oklch(0.42 0.14 275)',
    border: 'oklch(0.80 0.07 275)',
  },
  purple: {
    bg: 'oklch(0.94 0.05 300)',
    text: 'oklch(0.42 0.14 300)',
    border: 'oklch(0.80 0.07 300)',
  },
  pink: {
    bg: 'oklch(0.95 0.05 340)',
    text: 'oklch(0.45 0.14 340)',
    border: 'oklch(0.82 0.07 340)',
  },
  brown: {
    bg: 'oklch(0.93 0.03 60)',
    text: 'oklch(0.40 0.06 60)',
    border: 'oklch(0.80 0.04 60)',
  },
}

export const colorKeys = Object.keys(colorPalette) as TagColorKey[]
