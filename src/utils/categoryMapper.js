/**
 * 将作品 tag 映射到默认插画的类别 key。
 * 实际数据中只有 5 个 tag：学习工作、生活娱乐、社会服务、社会公益、硬件交互。
 * 加上 general 作为兜底类别，共 6 张插画。
 */
const TAG_TO_CATEGORY = {
  '学习工作': 'study',
  '生活娱乐': 'entertainment',
  '社会服务': 'service',
  '社会公益': 'charity',
  '硬件交互': 'hardware',
}

/**
 * 根据作品的 tags 数组返回对应的插画类别 key。
 * @param {string[]|undefined} tags
 * @returns {string} 类别 key，如 'study'、'general'
 */
export function categorizeTag(tags) {
  if (!tags || tags.length === 0) return 'general'
  const firstTag = tags[0]
  return TAG_TO_CATEGORY[firstTag] || 'general'
}

/**
 * 所有支持的类别列表。
 */
export const ALL_CATEGORIES = ['study', 'entertainment', 'service', 'charity', 'hardware', 'general']
