// ===== Methods 模块 (所有方法函数) =====
// 包含: Toast/Modal/ActionSheet、导航、提醒、Header、物品 CRUD、成员管理、
//       分类/位置管理、AI 对话(含流式)、提醒设置、统计/导出、工具
window.HomeStash = window.HomeStash || {}
HomeStash.methods = function (state, allComputed, helpers, storage, aiMock, aiReal, aiVoice, aiMessagesRef) {
  const { nextTick } = Vue
  const { getExpiryInfo, getCategoryLabel, findItemByName, searchItemsByText, guessEmoji, guessCategory, generateId, formatDateTime } = helpers
  const { reminderItems, isRealAIEnabled } = allComputed

  // ----- Toast / Modal / ActionSheet -----
  let toastTimer = null
  function showToast(text, icon = '', duration = 2000) {
    state.toast = { visible: true, text, icon }
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { state.toast.visible = false }, duration)
  }
  function showModal(title, content, onConfirm) {
    state.modal = { visible: true, title, content, onConfirm }
  }
  function hideModal() { state.modal.visible = false }
  function showActionSheet(items) { state.actionSheet = { visible: true, items } }
  function hideActionSheet() { state.actionSheet.visible = false }

  // ----- 导航 -----
  function goToDetail(id) { state.detailItemId = id; state.overlayPage = 'detail' }
  function goToEdit(id) {
    const item = state.items.find(i => i.id === id)
    if (!item) return
    state.editMode = 'edit'
    state.editForm = JSON.parse(JSON.stringify(item))
    if (!state.editForm.tags) state.editForm.tags = []
    state.overlayPage = 'edit'
  }
  function goToAdd() {
    state.editMode = 'add'
    state.editForm = { name: '', emoji: '📦', category: 'other', location: '', qty: 1, unit: '个', expiry: '', notes: '', tags: [], favorite: false }
    state.overlayPage = 'edit'
  }
  function goToMemberEdit(idx) {
    state.memberEditMode = 'edit'
    state.memberEditIndex = idx
    const m = state.members[idx]
    state.memberEditForm = { name: m.name, role: m.role, avatar: m.avatar || '😊' }
    state.overlayPage = 'memberEdit'
  }
  function goToMemberAdd() {
    state.memberEditMode = 'add'
    state.memberEditIndex = -1
    state.memberEditForm = { name: '', role: 'member', avatar: '😊' }
    state.overlayPage = 'memberEdit'
  }
  function goToListWithCategory(cat) {
    state.currentPage = 'list'
    state.filterCategory = cat
    state.reminderFilter = ''
  }
  function closeOverlay() { state.overlayPage = null }

  // ----- 提醒 -----
  function onReminderClick() { state.reminderPanelVisible = !state.reminderPanelVisible }
  function goToReminderList(filter) {
    state.reminderPanelVisible = false
    state.currentPage = 'list'
    state.reminderFilter = filter
    state.filterCategory = 'all'
    state.filterTag = ''
    state.listSearchKeyword = ''
  }
  function clearReminderFilter() { state.reminderFilter = '' }

  // ----- 系统通知推送（新增）-----
  function requestNotificationPermission() {
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }
  function checkAndNotify() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    const { expiryItems, borrowItems } = reminderItems.value
    const now = Date.now()
    // 临期物品
    expiryItems.forEach(item => {
      const key = 'expiry_' + item.id
      if (state.notifiedItemIds.has(key)) return
      try {
        new Notification('⏰ 物品即将到期', {
          body: '「' + item.name + '」' + getExpiryInfo(item.expiry).text,
          icon: '/favicon.ico'
        })
        state.notifiedItemIds.add(key)
      } catch (e) { /* ignore */ }
    })
    // 借出超期
    borrowItems.forEach(item => {
      const key = 'borrow_' + item.id
      if (state.notifiedItemIds.has(key)) return
      try {
        new Notification('📤 物品借出超期', {
          body: '「' + item.name + '」借给 ' + (item.borrower || '他人') + ' 已超期',
          icon: '/favicon.ico'
        })
        state.notifiedItemIds.add(key)
      } catch (e) { /* ignore */ }
    })
  }
  let notificationTimer = null
  function startNotificationPolling() {
    requestNotificationPermission()
    checkAndNotify()
    notificationTimer = setInterval(checkAndNotify, 60000) // 60 秒
    return notificationTimer
  }

  // ----- Header -----
  function toggleAddMenu() {
    showActionSheet([
      { icon: '✏️', text: '手动添加', handler: goToAdd },
      { icon: '🤖', text: 'AI 助手', handler: () => { state.aiDrawerVisible = true } },
      { icon: '🔍', text: '扫码识别', handler: onScan }
    ])
  }
  function onShare() {
    const text = '家里有什么 - 物品清单\n\n' + state.items.map(i =>
      i.emoji + ' ' + i.name + ' x' + i.qty + i.unit + ' @ ' + (i.location || '未分类')
    ).join('\n')
    if (navigator.share) {
      navigator.share({ title: '家里有什么', text }).catch(() => {})
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => showToast('清单已复制到剪贴板', '📋'),
        () => showToast('复制失败,请手动选择', '⚠️')
      )
    } else {
      showToast('当前浏览器不支持分享', '⚠️')
    }
  }
  function onScan() {
    // Mock 扫码：从预设物品随机一个,确认后添加
    const presets = [
      { name: '牛奶', emoji: '🥛', category: 'food', qty: 1, unit: '瓶', location: '冰箱' },
      { name: '苹果', emoji: '🍎', category: 'food', qty: 6, unit: '个', location: '冰箱' },
      { name: '牙膏', emoji: '🪥', category: 'daily', qty: 1, unit: '支', location: '卫生间' },
      { name: '创可贴', emoji: '🩹', category: 'medicine', qty: 10, unit: '片', location: '药箱' }
    ]
    const preset = presets[Math.floor(Math.random() * presets.length)]
    showModal('扫码识别结果', '识别到物品:「' + preset.name + '」(' + preset.qty + preset.unit + '),是否添加到「' + preset.location + '」?', () => {
      const newId = generateId(state.items)
      state.items.push({
        id: newId, name: preset.name, emoji: preset.emoji, category: preset.category,
        location: preset.location, qty: preset.qty, unit: preset.unit, expiry: null,
        notes: '扫码识别', tags: ['扫码'], favorite: false, borrowed: false, borrower: '',
        use_count: 0, createdAt: new Date().toISOString()
      })
      storage.saveItems(state.items)
      showToast('已添加「' + preset.name + '」', '✅')
      goToDetail(newId)
    })
  }

  // ----- 搜索历史 -----
  function addSearchHistory(kw) {
    if (!kw) return
    storage.addSearchHistory(kw)
    state.searchHistory = storage.loadSearchHistory()
  }

  // ----- 物品 CRUD -----
  function saveItem() {
    if (!state.editForm.name || !state.editForm.name.trim()) { showToast('请输入物品名称', '⚠️'); return }
    if (!state.editForm.qty || state.editForm.qty < 1) { showToast('数量必须大于 0', '⚠️'); return }
    if (state.editMode === 'edit') {
      const idx = state.items.findIndex(i => i.id === state.editForm.id)
      if (idx >= 0) {
        state.items[idx] = { ...state.items[idx], ...state.editForm, updatedAt: new Date().toISOString() }
        showToast('已更新', '✅')
      }
    } else {
      const newId = generateId(state.items)
      const newItem = {
        ...state.editForm,
        id: newId, borrowed: false, borrower: '', use_count: 0,
        createdAt: new Date().toISOString()
      }
      state.items.push(newItem)
      showToast('已添加「' + newItem.name + '」', '✅')
      state.detailItemId = newId
    }
    storage.saveItems(state.items)
    state.overlayPage = 'detail'
  }
  function confirmDelete(item) {
    showModal('删除物品', '确定删除「' + item.name + '」吗?此操作不可撤销。', () => {
      const idx = state.items.findIndex(i => i.id === item.id)
      if (idx >= 0) state.items.splice(idx, 1)
      storage.saveItems(state.items)
      state.overlayPage = null
      showToast('已删除', '🗑️')
    })
  }
  function toggleFavorite(item) { item.favorite = !item.favorite; storage.saveItems(state.items) }
  function recordUse(item) {
    item.use_count = (item.use_count || 0) + 1
    storage.saveItems(state.items)
    showToast('已记录使用,共 ' + item.use_count + ' 次', '📝')
  }
  function confirmBorrow() {
    if (!state.borrowDialog.borrower.trim()) { showToast('请输入借用人', '⚠️'); return }
    const item = state.borrowDialog.item
    item.borrowed = true
    item.borrower = state.borrowDialog.borrower.trim()
    item.borrowDate = new Date().toISOString()
    storage.saveItems(state.items)
    state.borrowDialog.visible = false
    state.borrowDialog.borrower = ''
    showToast('已借出给「' + item.borrower + '」', '📤')
  }
  function returnItem(item) {
    item.borrowed = false
    item.borrower = ''
    item.borrowDate = null
    storage.saveItems(state.items)
    showToast('已归还', '📥')
  }
  function restock(item) {
    item.qty += 1
    storage.saveItems(state.items)
    showToast('已补货,当前 ' + item.qty + item.unit, '📦')
  }
  function addTag() {
    if (!state.tagInput.trim()) return
    if (!state.editForm.tags) state.editForm.tags = []
    const t = state.tagInput.trim()
    if (!state.editForm.tags.includes(t)) state.editForm.tags.push(t)
    state.tagInput = ''
  }
  function removeTag(tag) {
    const idx = state.editForm.tags.indexOf(tag)
    if (idx >= 0) state.editForm.tags.splice(idx, 1)
  }

  // ----- 成员管理 -----
  function addMember() { goToMemberAdd() }
  function editMember(idx) { goToMemberEdit(idx) }
  function saveMember() {
    if (!state.memberEditForm.name || !state.memberEditForm.name.trim()) {
      showToast('请输入成员姓名', '⚠️'); return
    }
    if (state.memberEditMode === 'edit' && state.memberEditIndex >= 0) {
      const m = state.members[state.memberEditIndex]
      m.name = state.memberEditForm.name.trim()
      m.role = state.memberEditForm.role
      m.avatar = state.memberEditForm.avatar
      showToast('已更新成员', '✅')
    } else {
      const newId = state.members.length > 0 ? Math.max(...state.members.map(m => m.id)) + 1 : 1
      state.members.push({
        id: newId,
        name: state.memberEditForm.name.trim(),
        role: state.memberEditForm.role,
        avatar: state.memberEditForm.avatar
      })
      showToast('已添加成员', '✅')
    }
    storage.saveMembers(state.members)
    state.overlayPage = 'family'
  }
  function deleteMember(idx) {
    const m = state.members[idx]
    if (m.role === 'admin' && state.members.filter(x => x.role === 'admin').length <= 1) {
      showToast('至少保留一位管理员', '⚠️'); return
    }
    showModal('删除成员', '确定删除成员「' + m.name + '」?', () => {
      state.members.splice(idx, 1)
      storage.saveMembers(state.members)
      showToast('已删除', '🗑️')
    })
  }

  // ----- 分类管理（新增）-----
  function addCategory() {
    if (!state.categoryInput.name || !state.categoryInput.name.trim()) {
      showToast('请输入分类名称', '⚠️'); return
    }
    state.customCategories.push({
      emoji: state.categoryInput.emoji || '📦',
      name: state.categoryInput.name.trim()
    })
    localStorage.setItem('home_stash_custom_categories', JSON.stringify(state.customCategories))
    state.categoryInput = { emoji: '📦', name: '' }
    showToast('已添加分类', '✅')
  }
  function deleteCategory(idx) {
    state.customCategories.splice(idx, 1)
    localStorage.setItem('home_stash_custom_categories', JSON.stringify(state.customCategories))
    showToast('已删除', '🗑️')
  }

  // ----- 位置管理（新增）-----
  function addLocation() {
    if (!state.locationInput || !state.locationInput.trim()) {
      showToast('请输入位置名称', '⚠️'); return
    }
    state.customLocations.push(state.locationInput.trim())
    localStorage.setItem('home_stash_custom_locations', JSON.stringify(state.customLocations))
    state.locationInput = ''
    showToast('已添加位置', '✅')
  }
  function deleteLocation(idx) {
    state.customLocations.splice(idx, 1)
    localStorage.setItem('home_stash_custom_locations', JSON.stringify(state.customLocations))
    showToast('已删除', '🗑️')
  }

  // ----- AI 对话 -----
  async function scrollAIBottom() {
    await nextTick()
    if (aiMessagesRef.value) aiMessagesRef.value.scrollTop = aiMessagesRef.value.scrollHeight
  }

  async function sendAIMessage() {
    const text = state.aiInput.trim()
    if (!text || state.aiThinking) return
    state.aiMessages.push({ role: 'user', content: text })
    state.aiInput = ''
    state.aiThinking = true
    addSearchHistory(text)
    await scrollAIBottom()

    if (isRealAIEnabled.value) {
      // 真实 AI 流式响应
      let aiMsg = { role: 'ai', content: '', items: [] }
      state.aiMessages.push(aiMsg)
      try {
        await aiReal.callRealAIStream(
          text, state.items, state.aiConfig,
          (token) => { aiMsg.content += token; scrollAIBottom() },
          (result) => {
            executeAIAction(result)
            if (!aiMsg.content && result.reply) aiMsg.content = result.reply
            if (result.items && result.items.length) aiMsg.items = result.items
            state.chatHistory = state.aiMessages.slice(-100)
            storage.saveChatHistory(state.chatHistory)
          },
          (err) => {
            aiMsg.content = '出错了: ' + err.message
          }
        )
      } catch (e) {
        aiMsg.content = '出错了: ' + e.message
      } finally {
        state.aiThinking = false
        await scrollAIBottom()
      }
    } else {
      // Mock 模式
      setTimeout(() => {
        try {
          const result = aiMock.mockAIAction(text, state.items)
          executeAIAction(result)
          state.aiMessages.push({ role: 'ai', content: result.reply || '已处理', items: result.items || [] })
          state.chatHistory = state.aiMessages.slice(-100)
          storage.saveChatHistory(state.chatHistory)
        } catch (e) {
          state.aiMessages.push({ role: 'ai', content: '出错了: ' + e.message })
        } finally {
          state.aiThinking = false
          scrollAIBottom()
        }
      }, 500)
    }
  }

  function executeAIAction(result) {
    if (!result || !result.action) return
    const p = result.payload || {}
    if (result.action === 'add') {
      const newId = generateId(state.items)
      state.items.push({
        id: newId, name: p.name || '未命名',
        emoji: p.emoji || guessEmoji(p.name || '', p.category || 'other'),
        category: p.category || 'other', location: p.location || '未分类',
        qty: parseInt(p.qty) || 1, unit: p.unit || '个',
        expiry: p.expiry || null, notes: p.notes || '', tags: [],
        favorite: false, borrowed: false, borrower: '', use_count: 0,
        createdAt: new Date().toISOString()
      })
      storage.saveItems(state.items)
    } else if (result.action === 'update') {
      let item = p.id ? state.items.find(i => i.id === p.id) : findItemByName(state.items, p.name)
      if (item) {
        if (p.qty !== undefined) item.qty = parseInt(p.qty) || item.qty
        if (p.unit) item.unit = p.unit
        if (p.location) item.location = p.location
        if (p.expiry !== undefined) item.expiry = p.expiry
        if (p.notes !== undefined) item.notes = p.notes
        item.updatedAt = new Date().toISOString()
        storage.saveItems(state.items)
      }
    } else if (result.action === 'delete') {
      let item = p.id ? state.items.find(i => i.id === p.id) : findItemByName(state.items, p.name)
      if (item) {
        const idx = state.items.indexOf(item)
        state.items.splice(idx, 1)
        storage.saveItems(state.items)
      }
    } else if (result.action === 'search') {
      if (!result.items || result.items.length === 0) {
        if (p.keywords && p.keywords[0]) {
          result.items = searchItemsByText(state.items, p.keywords[0])
        } else if (p.filters) {
          result.items = state.items.filter(i => {
            if (p.filters.category && i.category !== p.filters.category) return false
            if (p.filters.location && !(i.location || '').includes(p.filters.location)) return false
            if (p.filters.borrowed !== undefined && i.borrowed !== p.filters.borrowed) return false
            if (p.filters.nearExpiry && (!i.expiry || getExpiryInfo(i.expiry).diff === null || getExpiryInfo(i.expiry).diff > 30)) return false
            return true
          })
        }
      }
    }
  }

  let recognition = null
  function toggleVoice() {
    if (state.isRecording) {
      aiVoice.stop(recognition)
      state.isRecording = false
      return
    }
    if (!aiVoice.isSupported()) {
      showToast('浏览器不支持语音识别,请用 Chrome/Edge', '⚠️'); return
    }
    recognition = aiVoice.createRecorder({
      onResult: (text, isFinal) => {
        state.aiInput = text
        if (isFinal) { state.isRecording = false; sendAIMessage() }
      },
      onError: (err) => {
        state.isRecording = false
        if (err !== 'aborted') showToast('语音识别失败: ' + err, '⚠️')
      },
      onEnd: () => { state.isRecording = false }
    })
    aiVoice.start(recognition)
    state.isRecording = true
  }

  function pickImage() {
    if (!isRealAIEnabled.value) {
      // Mock 图片识别
      const presets = [
        { name: '牛奶', category: 'food', qty: 1, unit: '瓶', emoji: '🥛', location: '冰箱' },
        { name: '苹果', category: 'food', qty: 6, unit: '个', emoji: '🍎', location: '冰箱' },
        { name: '牙膏', category: 'daily', qty: 1, unit: '支', emoji: '🪥', location: '卫生间' },
        { name: '创可贴', category: 'medicine', qty: 10, unit: '片', emoji: '🩹', location: '药箱' }
      ]
      const preset = presets[Math.floor(Math.random() * presets.length)]
      state.aiMessages.push({ role: 'system', content: '📷 图片识别中...' })
      state.aiThinking = true
      scrollAIBottom()
      setTimeout(() => {
        state.aiThinking = false
        state.aiMessages.push({
          role: 'ai',
          content: '识别到物品:「' + preset.name + '」(' + preset.qty + preset.unit + '),已为你添加到「' + preset.location + '」。'
        })
        const newId = generateId(state.items)
        state.items.push({
          id: newId, name: preset.name, emoji: preset.emoji, category: preset.category,
          location: preset.location, qty: preset.qty, unit: preset.unit, expiry: null,
          notes: 'AI 图片识别', tags: ['AI识别'], favorite: false, borrowed: false,
          borrower: '', use_count: 0, createdAt: new Date().toISOString()
        })
        storage.saveItems(state.items)
        scrollAIBottom()
      }, 800)
      return
    }
    // 真实 AI 图片识别
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(',')[1]
        state.aiThinking = true
        try {
          const preset = await aiReal.recognizeImage(base64, state.aiConfig)
          if (preset) {
            const newId = generateId(state.items)
            state.items.push({
              id: newId, name: preset.name, emoji: preset.emoji, category: preset.category,
              location: preset.location, qty: preset.qty, unit: preset.unit, expiry: null,
              notes: 'AI 图片识别', tags: ['AI识别'], favorite: false, borrowed: false,
              borrower: '', use_count: 0, createdAt: new Date().toISOString()
            })
            storage.saveItems(state.items)
            state.aiMessages.push({ role: 'ai', content: '识别到物品:「' + preset.name + '」,已添加。' })
          } else {
            state.aiMessages.push({ role: 'ai', content: '未能识别图片中的物品' })
          }
        } catch (err) {
          state.aiMessages.push({ role: 'ai', content: '识别失败: ' + err.message })
        } finally {
          state.aiThinking = false
          scrollAIBottom()
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  function saveAIConfigFn() {
    storage.saveAIConfig(state.aiConfig)
    showToast('AI 设置已保存', '✅')
  }
  async function testAIConnection() {
    if (!state.aiConfig.apiKey) { state.aiTestResult = '❌ 请先填写 API Key'; return }
    state.aiTestResult = '⏳ 测试中...'
    const result = await aiReal.testAIConnection(state.aiConfig)
    state.aiTestResult = result.message
  }

  // ----- 提醒设置 / 统计 / 导出 -----
  function saveReminderConfig() {
    storage.saveAppConfig(state.appConfig)
    showToast('提醒设置已保存', '✅')
  }
  function exportJSON() {
    const data = JSON.stringify(state.items, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'homestash-items-' + new Date().toISOString().split('T')[0] + '.json'
    a.click()
    URL.revokeObjectURL(url)
    showToast('已导出 JSON', '📦')
  }
  function exportCSV() {
    const header = 'ID,名称,分类,位置,数量,单位,保质期,借出,借用人,备注,标签\n'
    const rows = state.items.map(i =>
      [i.id, i.name, i.category, i.location || '', i.qty, i.unit || '', i.expiry || '',
       i.borrowed ? '是' : '否', i.borrower || '',
       (i.notes || '').replace(/,/g, ';'), (i.tags || []).join('|')].join(',')
    ).join('\n')
    const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'homestash-items-' + new Date().toISOString().split('T')[0] + '.csv'
    a.click()
    URL.revokeObjectURL(url)
    showToast('已导出 CSV', '📊')
  }
  function importJSON(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!Array.isArray(data)) throw new Error('格式错误')
        data.forEach(item => {
          const newId = generateId(state.items)
          state.items.push({ ...item, id: newId, createdAt: new Date().toISOString() })
        })
        storage.saveItems(state.items)
        showToast('已导入 ' + data.length + ' 件物品', '📥')
      } catch (err) {
        showToast('导入失败: ' + err.message, '❌')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return {
    // Toast/Modal/ActionSheet
    showToast, showModal, hideModal, showActionSheet, hideActionSheet,
    // 导航
    goToDetail, goToEdit, goToAdd, goToMemberEdit, goToMemberAdd,
    goToListWithCategory, closeOverlay,
    // 提醒
    onReminderClick, goToReminderList, clearReminderFilter,
    requestNotificationPermission, checkAndNotify, startNotificationPolling,
    // Header
    toggleAddMenu, onShare, onScan,
    // 物品 CRUD
    saveItem, confirmDelete, toggleFavorite, recordUse, confirmBorrow, returnItem,
    restock, addTag, removeTag,
    // 成员管理
    addMember, editMember, saveMember, deleteMember,
    // 分类/位置管理
    addCategory, deleteCategory, addLocation, deleteLocation,
    // AI 对话
    sendAIMessage, executeAIAction, toggleVoice, pickImage,
    saveAIConfigFn, testAIConnection,
    // 提醒设置/导出
    saveReminderConfig, exportJSON, exportCSV, importJSON,
    // 工具
    scrollAIBottom, formatDateTime
  }
}
