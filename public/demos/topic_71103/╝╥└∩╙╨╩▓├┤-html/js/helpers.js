// ===== 工具函数模块 (Helpers) =====
window.HomeStash = window.HomeStash || {}
HomeStash.helpers = (function () {
  const { EMOJI_MAP, CATEGORY_EMOJI, CATEGORY_LABELS } = HomeStash.constants

  // 过期检测：good(>30天)/warning(<30天)/danger(<0天)
  function getExpiryInfo(expiry) {
    if (!expiry) return { cls: '', text: '', diff: null }
    const d = new Date(expiry)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { cls: 'danger', text: '已过期', diff }
    if (diff === 0) return { cls: 'danger', text: '今天到期', diff }
    if (diff < 30) return { cls: 'warning', text: diff + '天后过期', diff }
    return { cls: 'good', text: diff + '天后', diff }
  }

  // 关键词猜测分类
  function guessCategory(name) {
    const n = (name || '').toLowerCase()
    if (/(奶|面|米|油|盐|酱|醋|茶|咖啡|糖|肉|蛋|菜|果|零食|饮料|面包|可乐|水|麦)/.test(n)) return 'food'
    if (/(药|胶囊|颗粒|片|贴|膏|维生素|布洛芬|感冒|退烧|创可贴|口罩)/.test(n)) return 'medicine'
    if (/(纸|巾|洗发水|沐浴露|牙膏|牙刷|洗衣液|洗洁精|毛巾|保鲜|垃圾袋|香皂)/.test(n)) return 'daily'
    if (/(螺丝刀|钳子|锤子|扳手|电钻|胶带|尺子|电池|工具)/.test(n)) return 'tool'
    return 'other'
  }

  // emoji 猜测
  function guessEmoji(name, category) {
    for (const key in EMOJI_MAP) {
      if (name.includes(key)) return EMOJI_MAP[key]
    }
    return CATEGORY_EMOJI[category] || '📦'
  }

  // 中文 → category 标识
  function categoryFromChinese(text) {
    if (/药品/.test(text)) return 'medicine'
    if (/食品/.test(text)) return 'food'
    if (/日用品/.test(text)) return 'daily'
    if (/工具/.test(text)) return 'tool'
    if (/其他/.test(text)) return 'other'
    return null
  }

  // category 标识 → 中文
  function getCategoryLabel(category) {
    return CATEGORY_LABELS[category] || '其他'
  }

  // 双向 includes 模糊查找
  function findItemByName(items, name) {
    if (!name) return null
    return items.find(i => i.name.includes(name) || name.includes(i.name)) || null
  }

  // 全文搜索（name/location/notes/category）
  function searchItemsByText(items, keyword) {
    const k = (keyword || '').toLowerCase()
    return items.filter(i =>
      (i.name || '').toLowerCase().includes(k) ||
      (i.location || '').toLowerCase().includes(k) ||
      (i.notes || '').toLowerCase().includes(k) ||
      (i.category || '').toLowerCase().includes(k)
    )
  }

  // 支持 keywords 与 filters(category/location/borrowed/nearExpiry)
  function filterItemsByPayload(items, payload) {
    let result = items
    if (payload.keywords && payload.keywords.length > 0) {
      const k = payload.keywords[0].toLowerCase()
      result = result.filter(i =>
        (i.name || '').toLowerCase().includes(k) ||
        (i.location || '').toLowerCase().includes(k) ||
        (i.notes || '').toLowerCase().includes(k)
      )
    }
    if (payload.filters) {
      const f = payload.filters
      result = result.filter(i => {
        if (f.category && i.category !== f.category) return false
        if (f.location && !(i.location || '').includes(f.location)) return false
        if (f.borrowed !== undefined && i.borrowed !== f.borrowed) return false
        if (f.nearExpiry && (!i.expiry || getExpiryInfo(i.expiry).diff === null || getExpiryInfo(i.expiry).diff > 30)) return false
        return true
      })
    }
    return result
  }

  // "YYYY-MM-DD HH:mm" 格式化
  function formatDateTime(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
  }

  // ID 生成
  function generateId(items) {
    return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1
  }

  return {
    getExpiryInfo, guessCategory, guessEmoji,
    categoryFromChinese, getCategoryLabel,
    findItemByName, searchItemsByText, filterItemsByPayload,
    formatDateTime, generateId
  }
})()
