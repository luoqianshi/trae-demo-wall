/**
 * 球员颜色分配工具
 * 为每个球员分配不同颜色，支持红、蓝、绿、黄、紫、橙、青、粉等
 */

// 预设颜色列表（高辨识度且适配深色背景的精选色）
const COLOR_PALETTE = [
  '#ef4444', // 红色
  '#3b82f6', // 蓝色
  '#22c55e', // 绿色
  '#f0b429', // 琥珀
  '#a855f7', // 紫色
  '#f97316', // 橙色
  '#22d3ee', // 青色
  '#ec4899', // 粉色
  '#84cc16', // 亮绿
  '#fb923c', // 橘黄
  '#6366f1', // 靛蓝
  '#c084fc', // 淡紫
  '#2dd4bf', // 薄荷绿
  '#fdba74', // 肤色
  '#818cf8', // 淡蓝
  '#fca5a5', // 淡红
]

// 球员ID到颜色的映射缓存
const playerColorMap = new Map()

/**
 * 为球员分配颜色
 * @param {number} playerId - 球员ID
 * @returns {string} 颜色十六进制值
 */
export function getPlayerColor(playerId) {
  if (playerColorMap.has(playerId)) {
    return playerColorMap.get(playerId)
  }
  const color = COLOR_PALETTE[playerId % COLOR_PALETTE.length]
  playerColorMap.set(playerId, color)
  return color
}

/**
 * 获取球队颜色
 * @param {string} team - 球队标识 'team_a' 或 'team_b'
 * @returns {string} 颜色十六进制值
 */
export function getTeamColor(team) {
  if (team === 'team_a') {
    return '#ef4444' // 红队
  }
  return '#3b82f6' // 蓝队
}

/**
 * 获取球队显示名称
 * @param {string} team - 球队标识
 * @returns {string} 中文队名
 */
export function getTeamName(team) {
  if (team === 'team_a') {
    return '红队'
  }
  if (team === 'team_b') {
    return '蓝队'
  }
  return '未知'
}

/**
 * 清除颜色映射缓存
 */
export function clearColorCache() {
  playerColorMap.clear()
}
