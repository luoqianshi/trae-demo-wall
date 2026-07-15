/**
 * 乒乓球球员颜色工具
 * 左侧选手和右侧选手使用不同颜色区分
 * 蓝色系主题
 */

// 选手颜色映射
const PLAYER_COLORS = {
  left: '#3b82f6',  // 蓝色 - 左侧选手
  right: '#f59e0b', // 琥珀色 - 右侧选手
}

// 球速颜色梯度（绿→黄→红）
const SPEED_COLORS = [
  { threshold: 0, color: '#22c55e' },   // 绿色 - 慢
  { threshold: 5, color: '#84cc16' },   // 黄绿
  { threshold: 8, color: '#eab308' },   // 黄色
  { threshold: 11, color: '#f97316' },  // 橙色
  { threshold: 14, color: '#ef4444' },  // 红色 - 快
]

/**
 * 获取选手颜色
 * @param {string} side - 选手位置 'left' 或 'right'
 * @returns {string} 颜色十六进制值
 */
export function getPlayerColor(side) {
  return PLAYER_COLORS[side] || '#8b5cf6'
}

/**
 * 根据球速获取对应颜色
 * 速度越快颜色越红
 * @param {number} speed - 球速(m/s)
 * @returns {string} 颜色十六进制值
 */
export function getSpeedColor(speed) {
  let color = SPEED_COLORS[0].color
  for (const item of SPEED_COLORS) {
    if (speed >= item.threshold) {
      color = item.color
    }
  }
  return color
}

/**
 * 获取选手位置显示名称
 * @param {string} side - 选手位置 'left' 或 'right'
 * @returns {string} 中文名称
 */
export function getSideName(side) {
  if (side === 'left') return '左侧选手'
  if (side === 'right') return '右侧选手'
  return '未知'
}

/**
 * 根据密度值（0-1）获取热力图颜色
 * 绿 → 黄 → 红 渐变
 * @param {number} density - 密度值 0-1
 * @returns {string} rgba颜色字符串
 */
export function getHeatColor(density) {
  const d = Math.min(1, Math.max(0, density))
  let r, g, b
  if (d < 0.5) {
    // 绿到黄
    const t = d * 2
    r = Math.round(34 + (255 - 34) * t)
    g = Math.round(197 + (221 - 197) * t)
    b = Math.round(94 + (34 - 94) * t)
  } else {
    // 黄到红
    const t = (d - 0.5) * 2
    r = Math.round(255 + (239 - 255) * t)
    g = Math.round(221 + (68 - 221) * t)
    b = Math.round(34 + (68 - 34) * t)
  }
  return `rgba(${r}, ${g}, ${b}, 0.65)`
}
