// 收藏数据 localStorage 持久化

const STORAGE_KEY = 'mowen_favorites'

/**
 * 获取所有收藏
 * @returns {Array} 收藏列表
 */
export function getFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/**
 * 判断某条对话是否已收藏（基于 question + roleId）
 */
export function isFavorite(question, roleId) {
  const list = getFavorites()
  return list.some((f) => f.question === question && f.roleId === roleId)
}

/**
 * 添加收藏
 * @param {Object} item { question, roleId, role, avatar, source, quote, answer, timestamp }
 */
export function addFavorite(item) {
  const list = getFavorites()
  // 去重
  const exists = list.some((f) => f.question === item.question && f.roleId === item.roleId)
  if (!exists) {
    list.unshift({ ...item, timestamp: Date.now() })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }
  return list
}

/**
 * 移除收藏
 */
export function removeFavorite(question, roleId) {
  let list = getFavorites()
  list = list.filter((f) => !(f.question === question && f.roleId === roleId))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  return list
}

/**
 * 切换收藏状态
 */
export function toggleFavorite(item) {
  if (isFavorite(item.question, item.roleId)) {
    return removeFavorite(item.question, item.roleId)
  }
  return addFavorite(item)
}

/**
 * 清空所有收藏
 */
export function clearFavorites() {
  localStorage.removeItem(STORAGE_KEY)
  return []
}
