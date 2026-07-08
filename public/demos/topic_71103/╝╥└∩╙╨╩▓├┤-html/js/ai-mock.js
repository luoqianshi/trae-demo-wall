// ===== AI Mock 模块 (mockAIAction 完整复刻) =====
// 6 类动作识别：删除 → 修改 → where查询 → search查询 → 临期/借出 → 位置 → 新增 → 默认聊天
window.HomeStash = window.HomeStash || {}
HomeStash.aiMock = (function () {
  const { findItemByName, searchItemsByText, getExpiryInfo, categoryFromChinese, guessCategory, guessEmoji } = HomeStash.helpers

  function mockAIAction(text, items) {
    const t = (text || '').toLowerCase().replace(/[，。？！,.?!]/g, ' ').trim()
    if (!t) return { action: 'chat', payload: {}, reply: '请输入指令' }

    // 1. 删除
    const delMatch = t.match(/(?:删除|移除|删掉)\s*(.+)/)
    if (delMatch) {
      const target = delMatch[1].trim()
      const item = findItemByName(items, target)
      if (item) return { action: 'delete', payload: { id: item.id }, reply: '已删除「' + item.name + '」。' }
      return { action: 'chat', payload: {}, reply: '没有找到「' + target + '」,无法删除。' }
    }

    // 2. 修改
    const updateMatch = t.match(/(?:把|将)?(.+?)改[成为]\s*(\d+)\s*(个|瓶|包|袋|盒|卷|支|把|套|粒|片|根|件|台|张)?/)
    if (updateMatch && !t.includes('在哪')) {
      const target = updateMatch[1].trim()
      const qty = parseInt(updateMatch[2])
      const unit = updateMatch[3] || ''
      const item = findItemByName(items, target)
      if (item) {
        return { action: 'update', payload: { id: item.id, qty, ...(unit ? { unit } : {}) }, reply: '已把「' + item.name + '」改为 ' + qty + (unit || '个') + '。' }
      }
      return { action: 'chat', payload: {}, reply: '没有找到「' + target + '」。' }
    }

    // 3. where 查询
    const whereMatch = t.match(/(.+?)在哪[里儿]?/)
    if (whereMatch) {
      const target = whereMatch[1].trim()
      const found = searchItemsByText(items, target)
      if (found.length > 0) return { action: 'search', payload: { keywords: [target] }, items: found, reply: '找到了 ' + found.length + ' 件相关物品:' }
      return { action: 'chat', payload: {}, reply: '没有找到「' + target + '」相关物品。' }
    }

    // 4. search 查询
    const searchMatch = t.match(/(?:找[一]?下?|搜索|查询|查找)\s*(.+)/)
    if (searchMatch) {
      const target = searchMatch[1].trim()
      const found = searchItemsByText(items, target)
      if (found.length > 0) return { action: 'search', payload: { keywords: [target] }, items: found, reply: '找到了 ' + found.length + ' 件相关物品:' }
      return { action: 'chat', payload: {}, reply: '没有找到「' + target + '」相关物品。' }
    }

    // 5. 临期/借出
    if (t.includes('快过期') || t.includes('临期') || t.includes('即将过期')) {
      const cat = categoryFromChinese(text)
      const found = items.filter(i => {
        if (!i.expiry) return false
        const info = getExpiryInfo(i.expiry)
        return info.diff !== null && info.diff <= 30
      }).filter(i => !cat || i.category === cat)
      if (found.length > 0) return { action: 'search', payload: { nearExpiry: true, category: cat }, items: found, reply: '有 ' + found.length + ' 件物品即将过期:' }
      return { action: 'chat', payload: {}, reply: '暂无即将过期的物品。' }
    }
    if (t.includes('借出') || t.includes('借走') || t.includes('借出去')) {
      const found = items.filter(i => i.borrowed)
      if (found.length > 0) return { action: 'search', payload: { borrowed: true }, items: found, reply: '有 ' + found.length + ' 件物品借出中:' }
      return { action: 'chat', payload: {}, reply: '当前没有借出的物品。' }
    }

    // 6. 位置查询
    const locMatch = text.match(/(.+?)里[的|面]?东西?/)
    if (locMatch) {
      const loc = locMatch[1].trim()
      const found = items.filter(i => (i.location || '').includes(loc))
      if (found.length > 0) return { action: 'search', payload: { location: loc }, items: found, reply: '在「' + loc + '」找到 ' + found.length + ' 件物品:' }
      return { action: 'chat', payload: {}, reply: '在「' + loc + '」没有找到物品。' }
    }

    // 7. 新增
    if (/(新增|添加|加入|录入|^\d+)/.test(t)) {
      let content = t.replace(/^(新增|添加|加入|录入)\s*/, '')
      let qty = 1, unit = ''
      const qtyMatch = content.match(/^(\d+)\s*(个|瓶|包|袋|盒|卷|支|把|套|粒|片|根|件|台|张)?/)
      if (qtyMatch) {
        qty = parseInt(qtyMatch[1])
        unit = qtyMatch[2] || ''
        content = content.replace(qtyMatch[0], '').trim()
      }
      let location = '未分类'
      const locMarkers = ['在', '位于', '放到', '放在', '存入']
      for (const marker of locMarkers) {
        const idx = content.indexOf(marker)
        if (idx >= 0) {
          const after = content.substring(idx + marker.length).trim()
          const parts = after.split(/\s+/)
          location = parts[0] || after
          content = content.substring(0, idx).trim()
          break
        }
      }
      const name = content.trim().replace(/^[,，]+|[,，]+$/g, '').trim()
      if (!name) return { action: 'chat', payload: {}, reply: '请告诉我要添加什么物品。' }
      const category = guessCategory(name)
      const emoji = guessEmoji(name, category)
      return { action: 'add', payload: { name, category, qty, unit: unit || '个', location, emoji, expiry: null, notes: '' }, reply: '好的,已添加「' + name + '」(' + qty + unit + '),放在「' + location + '」。' }
    }

    // 8. 默认聊天
    return {
      action: 'chat', payload: {},
      reply: '我是你的家庭物品助手,你可以对我说:\n• 新增 2 瓶牛奶在冰箱冷藏室\n• 雨伞在哪里\n• 把生抽改成 3 瓶\n• 删除方便面\n• 快过期的药品\n• 借出的东西\n• 冰箱里的东西'
    }
  }

  return { mockAIAction }
})()
