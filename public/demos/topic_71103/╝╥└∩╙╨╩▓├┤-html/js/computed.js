// ===== Computed 模块 (所有计算属性) =====
window.HomeStash = window.HomeStash || {}
HomeStash.computed = function (state) {
  const { computed } = Vue
  const { CATEGORIES, CATEGORY_LABELS, CATEGORY_EMOJI } = HomeStash.constants
  const { getExpiryInfo, getCategoryLabel } = HomeStash.helpers

  // 4 tab 配置
  const navItems = computed(() => [
    { key: 'home', label: '首页', icon: '🏠' },
    { key: 'list', label: '清单', icon: '📋' },
    { key: 'stats', label: '统计', icon: '📊' },
    { key: 'profile', label: '我的', icon: '👤' }
  ])

  // 含"全部"的 6 项分类
  const categories = computed(() => CATEGORIES)

  // 收藏物品
  const favoriteItems = computed(() => state.items.filter(i => i.favorite))

  // 最近 5 件（按 createdAt 降序）
  const recentItems = computed(() =>
    [...state.items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5)
  )

  // 5 个分类卡片（不含"全部"）
  const categorySummary = computed(() => {
    return CATEGORIES.filter(c => c.value !== 'all').map(c => ({
      ...c,
      count: state.items.filter(i => i.category === c.value).length
    }))
  })

  // 所有物品 tags 去重
  const allTags = computed(() => {
    const s = new Set()
    state.items.forEach(i => (i.tags || []).forEach(t => s.add(t)))
    return Array.from(s)
  })

  // 清单页综合筛选
  const listFilteredItems = computed(() => {
    let arr = state.items
    // 搜索关键词
    if (state.listSearchKeyword) {
      const k = state.listSearchKeyword.toLowerCase()
      arr = arr.filter(i =>
        (i.name || '').toLowerCase().includes(k) ||
        (i.location || '').toLowerCase().includes(k) ||
        (i.notes || '').toLowerCase().includes(k)
      )
    }
    // 标签筛选
    if (state.filterTag) arr = arr.filter(i => (i.tags || []).includes(state.filterTag))
    // 分类筛选
    if (state.filterCategory !== 'all') arr = arr.filter(i => i.category === state.filterCategory)
    // 提醒过滤
    if (state.reminderFilter === 'expiry') {
      arr = arr.filter(i => {
        if (!i.expiry) return false
        const info = getExpiryInfo(i.expiry)
        return info.diff !== null && info.diff <= 30
      })
    } else if (state.reminderFilter === 'borrow') {
      arr = arr.filter(i => i.borrowed)
    }
    return arr
  })

  // 按分类分组
  const listCategoryGroups = computed(() => {
    const filtered = listFilteredItems.value
    return CATEGORIES.filter(c => c.value !== 'all').map(c => ({
      ...c,
      items: filtered.filter(i => i.category === c.value)
    })).filter(g => g.items.length > 0)
  })

  // 按位置首段分组（"冰箱 › 冷藏" → "冰箱"）
  const groupedItems = computed(() => {
    const filtered = listFilteredItems.value
    const map = {}
    filtered.forEach(i => {
      const loc = (i.location || '未分类').split('›')[0].trim()
      if (!map[loc]) map[loc] = []
      map[loc].push(i)
    })
    return map
  })

  // 历史位置去重（最多 20，用于编辑页 datalist）
  const locationSuggestions = computed(() => {
    const s = new Set()
    state.items.forEach(i => i.location && s.add(i.location))
    state.customLocations.forEach(l => s.add(l))
    return Array.from(s).slice(0, 20)
  })

  // 提醒物品
  const reminderItems = computed(() => {
    const expiryItems = state.items.filter(i => {
      if (!i.expiry) return false
      const info = getExpiryInfo(i.expiry)
      return info.diff !== null && info.diff <= (state.appConfig.reminder.expiryDays || 7)
    })
    const borrowItems = state.items.filter(i => {
      if (!i.borrowed || !i.borrowDate) return false
      const days = Math.floor((Date.now() - new Date(i.borrowDate).getTime()) / 86400000)
      return days >= (state.appConfig.reminder.borrowDays || 30)
    })
    return { expiryItems, borrowItems }
  })

  // 总提醒数
  const reminderCount = computed(() =>
    reminderItems.value.expiryItems.length + reminderItems.value.borrowItems.length
  )

  // 第一位管理员
  const profileMember = computed(() => {
    return state.members.find(m => m.role === 'admin') || state.members[0] || { name: '我', role: 'admin', avatar: '😊' }
  })

  // 基础统计
  const stats = computed(() => ({
    total: state.items.length,
    nearExpired: reminderItems.value.expiryItems.length,
    borrowed: state.items.filter(i => i.borrowed).length,
    categoryCount: new Set(state.items.map(i => i.category)).size
  }))

  // 物品数量总和
  const totalQty = computed(() => state.items.reduce((s, i) => s + (parseInt(i.qty) || 0), 0))

  // 本月新增数
  const addedThisMonth = computed(() => {
    const now = new Date()
    return state.items.filter(i => {
      if (!i.createdAt) return false
      const d = new Date(i.createdAt)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).length
  })

  // 健康分摘要（多维度加权：临期 40% + 借出 20% + 库存 20% + 分类均衡 20%）
  const healthSummary = computed(() => {
    const total = state.items.length || 1
    const nearExpiry = reminderItems.value.expiryItems.length
    const borrowed = state.items.filter(i => i.borrowed).length
    const lowStock = state.items.filter(i => (i.qty || 0) <= (state.appConfig.lowStockThreshold || 2)).length
    const cats = new Set(state.items.map(i => i.category)).size

    const expiryScore = Math.max(0, 100 - (nearExpiry / total) * 200)
    const borrowScore = Math.max(0, 100 - (borrowed / total) * 100)
    const stockScore = Math.max(0, 100 - (lowStock / total) * 100)
    const catScore = Math.min(100, (cats / 5) * 100)

    const score = Math.round(expiryScore * 0.4 + borrowScore * 0.2 + stockScore * 0.2 + catScore * 0.2)
    let emoji = '😊', text = '健康'
    if (score >= 85) { emoji = '😊'; text = '库存健康' }
    else if (score >= 60) { emoji = '⚠️'; text = '需要关注' }
    else { emoji = '🚨'; text = '需要整理' }
    return { emoji, text, score }
  })

  // 分类分布
  const categoryList = computed(() => {
    const total = state.items.length || 1
    const colors = { food: '#34C759', daily: '#5AC8FA', medicine: '#FF9500', tool: '#5856D6', other: '#8E8E93' }
    return CATEGORIES.filter(c => c.value !== 'all').map(c => {
      const count = state.items.filter(i => i.category === c.value).length
      return {
        name: c.value, label: c.label, emoji: c.emoji,
        count, percent: Math.round((count / total) * 100),
        color: colors[c.value]
      }
    })
  })

  // 保质期状态
  const expiryStats = computed(() => {
    let expired = 0, expiring7 = 0, expiring30 = 0
    state.items.forEach(i => {
      if (!i.expiry) return
      const info = getExpiryInfo(i.expiry)
      if (info.diff === null) return
      if (info.diff < 0) expired++
      else if (info.diff <= 7) expiring7++
      else if (info.diff <= 30) expiring30++
    })
    return { expired, expiring7, expiring30, safe: state.items.filter(i => i.expiry).length - expired - expiring7 - expiring30 }
  })

  // 位置 TOP5
  const locationList = computed(() => {
    const map = {}
    state.items.forEach(i => {
      const loc = (i.location || '未分类').split('›')[0].trim()
      map[loc] = (map[loc] || 0) + 1
    })
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5)
  })

  // 高频使用 Top10
  const topUsedItems = computed(() =>
    [...state.items].sort((a, b) => (b.use_count || 0) - (a.use_count || 0)).slice(0, 10).filter(i => (i.use_count || 0) > 0)
  )

  // 低库存物品
  const lowStockItems = computed(() =>
    state.items.filter(i => (i.qty || 0) <= (state.appConfig.lowStockThreshold || 2))
  )

  // 借出记录筛选
  const filteredBorrowItems = computed(() => {
    const arr = state.items.filter(i => i.borrower || i.borrowed)
    if (state.borrowFilter === 'borrowed') return arr.filter(i => i.borrowed)
    if (state.borrowFilter === 'returned') return arr.filter(i => !i.borrowed)
    return arr
  })

  // 真实 AI 启用判断
  const isRealAIEnabled = computed(() =>
    !!state.aiConfig.apiKey && !state.aiConfig.mockEnabled
  )

  // 当前详情物品
  const detailItem = computed(() =>
    state.items.find(i => i.id === state.detailItemId) || null
  )

  return {
    navItems, categories, favoriteItems, recentItems,
    categorySummary, allTags, listFilteredItems, listCategoryGroups,
    groupedItems, locationSuggestions, reminderItems, reminderCount,
    profileMember, stats, totalQty, addedThisMonth, healthSummary,
    categoryList, expiryStats, locationList, topUsedItems, lowStockItems,
    filteredBorrowItems, isRealAIEnabled, detailItem
  }
}
