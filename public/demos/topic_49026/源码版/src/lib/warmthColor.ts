/**
 * Warmth Color System
 * 关系温度视觉化色彩系统
 *
 * 设计理念（Apple 首席视觉设计师视角）：
 * - 选用中国传统色作为温度锚点，文化质感与数据可视化融合
 * - 色彩本身即数据：冷端黛蓝（敌对）→ 鹊灰（冷淡）→ 蟹青（疏离）
 *   → 秋香（平和）→ 赭石（温和）→ 朱膘（亲密）
 * - 色相路径：205°(蓝) → 210°(蓝灰) → 160°(青) → 44°(黄) → 18°(橙) → 11°(红橙)
 *   自然经过青→绿→黄过渡，避开紫色域，符合"升温"直觉
 * - 饱和度跨度 38%-82%，明度跨度 52%-64%，冷端沉稳但不灰、暖端明亮鲜艳
 *   温度差异在视觉上一目了然
 *
 * 中国传统色来源：fuwa.org/tools/chinese-colors.html
 * v4: 中国传统色重构，全色域插值，色彩差异显著
 * v5: 饱和度/明度全面提升，消除冷端"灰蒙乏力"感
 */

// 色彩锚点：温度 → HSL（中国传统色，饱和度/明度全面提升）
// 保留传统色色相路径，大幅提升饱和度与明度，使色彩鲜明有力
const WARMTH_STOPS = [
  { temp: 0,   h: 205, s: 55, l: 52 },  // 黛蓝 — s:29→55, l:42→52，深沉但不灰
  { temp: 18,  h: 210, s: 42, l: 55 },  // 鹊灰 — s:20→42, l:44→55，冷峻清晰
  { temp: 38,  h: 160, s: 40, l: 58 },  // 蟹青 — s:13→40, l:54→58，青绿分明
  { temp: 55,  h: 44,  s: 72, l: 64 },  // 秋香 — s:62→72, l:61→64，金黄饱满
  { temp: 78,  h: 18,  s: 62, l: 60 },  // 赭石 — s:45→62, l:57→60，橙红温润
  { temp: 100, h: 11,  s: 82, l: 60 },  // 朱膘 — s:75→82, l:57→60，朱红鲜明
] as const

/**
 * 线性插值
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * 将温度 (0-100) 映射为 HSL 色彩对象
 */
export function warmthToHSL(temp: number): { h: number; s: number; l: number } {
  const t = Math.max(0, Math.min(100, temp))

  // 找到所在区间
  for (let i = 0; i < WARMTH_STOPS.length - 1; i++) {
    const lo = WARMTH_STOPS[i]
    const hi = WARMTH_STOPS[i + 1]
    if (t >= lo.temp && t <= hi.temp) {
      const ratio = (t - lo.temp) / (hi.temp - lo.temp)
      return {
        h: lerp(lo.h, hi.h, ratio),
        s: lerp(lo.s, hi.s, ratio),
        l: lerp(lo.l, hi.l, ratio),
      }
    }
  }

  const last = WARMTH_STOPS[WARMTH_STOPS.length - 1]
  return { h: last.h, s: last.s, l: last.l }
}

/**
 * 将温度转为 HSL CSS 字符串
 * 例: warmthToColor(80) → "hsl(16, 34%, 65%)"
 */
export function warmthToColor(temp: number): string {
  const { h, s, l } = warmthToHSL(temp)
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
}

/**
 * 带透明度的暖度色
 * alpha: 0-1
 */
export function warmthToColorAlpha(temp: number, alpha: number): string {
  const { h, s, l } = warmthToHSL(temp)
  return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${alpha})`
}

/**
 * 暖度等级标签（替代数字）
 */
export function warmthLabel(temp: number): string {
  if (temp >= 80) return '亲密'
  if (temp >= 60) return '温和'
  if (temp >= 40) return '平和'
  if (temp >= 20) return '冷淡'
  return '疏远'
}

/**
 * 生成暖度渐变条的整体背景色（从冷到暖的完整光谱）
 * 用于温度条的底色轨道 — 中国传统色光谱
 */
export function warmthTrackGradient(): string {
  return `linear-gradient(to right,
    hsl(205, 55%, 52%) 0%,
    hsl(210, 42%, 55%) 18%,
    hsl(160, 40%, 58%) 38%,
    hsl(44, 72%, 64%) 55%,
    hsl(18, 62%, 60%) 78%,
    hsl(11, 82%, 60%) 100%
  )`
}

/**
 * 生成从冷端到当前温度的渐变（用于填充条）
 */
export function warmthFillGradient(temp: number): string {
  const t = Math.max(0, Math.min(100, temp))
  const currentColor = warmthToColor(t)
  // 从冷端（黛蓝）到当前温度的渐变
  return `linear-gradient(to right, hsl(205, 55%, 52%), ${currentColor})`
}

/**
 * 生成暖度光球的径向渐变（用于圆形指示器）
 */
export function warmthOrbGradient(temp: number): string {
  const { h, s, l } = warmthToHSL(temp)
  const center = `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l + 8)}%, 1)`
  const mid = `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, 0.9)`
  const edge = `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l - 8)}%, 0.7)`
  return `radial-gradient(circle at 35% 35%, ${center}, ${mid} 50%, ${edge})`
}

/**
 * 生成暖度光晕（box-shadow）
 */
export function warmthGlow(temp: number, intensity: number = 1): string {
  const color = warmthToColorAlpha(temp, 0.5 * intensity)
  const colorSoft = warmthToColorAlpha(temp, 0.2 * intensity)
  return `0 0 6px ${color}, 0 0 14px ${colorSoft}, 0 0 22px ${colorSoft}`
}

/**
 * 【核心】生成模块背景渐变 — 暖度色从右侧向左侧渐变透明
 *
 * 视觉效果：模块右侧呈现暖度色彩，向左逐渐淡出为透明，
 * 让模块本身的底色自然显露，色彩成为背景氛围而非前景装饰。
 *
 * @param temp 温度值 0-100
 * @param intensity 色彩强度 0-1（默认 0.38，明显氛围感）
 * @returns CSS linear-gradient 字符串
 *
 * 用法: style={{ background: warmthBgGradient(temp) }}
 */
export function warmthBgGradient(temp: number, intensity: number = 0.5): string {
  const t = Math.max(0, Math.min(100, temp))
  const { h, s, l } = warmthToHSL(t)
  // 右侧：暖度色（带透明度），向左渐变到完全透明
  const rightColor = `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${intensity})`
  const midColor = `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${intensity * 0.5})`
  const leftColor = `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, 0)`
  return `linear-gradient(to left, ${rightColor}, ${midColor} 40%, ${leftColor})`
}

/**
 * 生成模块背景渐变 — 带边缘柔化的版本
 * 右侧有更饱和的色彩，向左快速淡出
 */
export function warmthBgGradientSoft(temp: number, intensity: number = 0.25): string {
  const t = Math.max(0, Math.min(100, temp))
  const { h, s, l } = warmthToHSL(t)
  const rightColor = `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${intensity})`
  const midColor = `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${intensity * 0.3})`
  const leftColor = `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, 0)`
  return `linear-gradient(to left, ${rightColor} 0%, ${midColor} 30%, ${leftColor} 70%)`
}
