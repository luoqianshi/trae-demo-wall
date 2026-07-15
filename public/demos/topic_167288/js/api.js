// ===== API 接口封装（操作 localStorage） =====
const API = {
  // 获取当前用户
  getCurrentUser() {
    const cu = Store.getValue('current_user')
    if (!cu) return MockData.getCurrentUser()
    return Store.findById('users', cu.id) || MockData.getCurrentUser()
  },

  // 更新当前用户信息（支持任意字段，与小程序 updateInfo 对齐）
  updateCurrentUser(data) {
    const user = this.getCurrentUser()
    // 兼容旧调用方式 updateCurrentUser(nickname, avatar)
    if (typeof data === 'string') {
      data = { nickname: data, avatar: arguments[1] }
    }
    // 昵称长度校验（最多 12 字符，使用 Array.from 处理多字节）
    if (data.nickname != null) {
      const chars = Array.from(data.nickname)
      if (chars.length > 12) {
        data.nickname = chars.slice(0, 12).join('')
      }
    }
    const updated = Store.updateById('users', user.id, data)
    return Promise.resolve(updated)
  },

  // ===== 用户积分概览（对齐 user.getPoints） =====
  getUserPoints() {
    const user = this.getCurrentUser()
    const pts = user.points || { base: 0, friendly: 0 }
    return Promise.resolve({
      base: pts.base || 0,
      friendly: pts.friendly || 0,
      total: (pts.base || 0) + (pts.friendly || 0)
    })
  },

  // ===== 标记相关 =====
  getMarkers(params = {}) {
    let markers = Store.get('markers')
    const { lat, lng, radius, type, filter } = params

    // 距离筛选
    if (lat && lng && radius && radius > 0) {
      markers = markers.filter(m => Util.getDistance(lat, lng, m.lat, m.lng) <= radius)
    }

    // 类型筛选
    if (type && type !== 'all') {
      if (type === 'urgent') {
        markers = markers.filter(m => m.isUrgent)
      } else {
        markers = markers.filter(m => m.type === type)
      }
    }

    // 排序：紧急优先，然后按时间
    markers.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1
      if (!a.isUrgent && b.isUrgent) return 1
      return b.createdAt - a.createdAt
    })

    return Promise.resolve(markers)
  },

  getMarkerById(id) {
    return Promise.resolve(Store.findById('markers', id))
  },

  createMarker(data) {
    const user = this.getCurrentUser()
    const marker = {
      ...data,
      userId: user.id,
      userName: user.nickname,
      userAvatar: user.avatar,
      status: 'active',
      adoptionId: data.adoptionId || '',
      // 与小程序对齐：location/geo/address 字段
      location: data.location || { lat: data.lat, lng: data.lng },
      geo: data.geo || { type: 'Point', coordinates: [data.lng, data.lat] },
      address: data.address || '',
      area: data.area || '',
      street: data.street || '',
      updatedAt: Date.now(),
      createdAt: Date.now()
    }
    const created = Store.insert('markers', marker)
    return Promise.resolve(created)
  },

  updateMarkerStatus(id, status) {
    Store.updateById('markers', id, { status, updatedAt: Date.now() })
    return Promise.resolve(true)
  },

  // 追踪（返回字段与小程序对齐：isTracking）
  toggleTrack(markerId) {
    const user = this.getCurrentUser()
    const tracks = Store.get('tracks')
    const existing = tracks.find(t => t.userId === user.id && t.markerId === markerId)
    if (existing) {
      Store.deleteById('tracks', existing.id)
      return Promise.resolve({ success: true, isTracking: false })
    }
    Store.insert('tracks', { userId: user.id, markerId, createdAt: Date.now() })
    return Promise.resolve({ success: true, isTracking: true })
  },

  getTracks() {
    const user = this.getCurrentUser()
    const tracks = Store.query('tracks', { userId: user.id })
    const markers = tracks.map(t => {
      const m = Store.findById('markers', t.markerId)
      return m ? { ...m, trackId: t.id, trackTime: t.createdAt } : null
    }).filter(Boolean)
    return Promise.resolve(markers)
  },

  // 收藏（返回字段与小程序对齐：isFavorite）
  toggleFavorite(markerId) {
    const user = this.getCurrentUser()
    const favs = Store.get('favorites')
    const existing = favs.find(f => f.userId === user.id && f.markerId === markerId)
    if (existing) {
      Store.deleteById('favorites', existing.id)
      return Promise.resolve({ success: true, isFavorite: false })
    }
    Store.insert('favorites', { userId: user.id, markerId, createdAt: Date.now() })
    return Promise.resolve({ success: true, isFavorite: true })
  },

  getFavorites() {
    const user = this.getCurrentUser()
    const favs = Store.query('favorites', { userId: user.id })
    const markers = favs.map(f => {
      const m = Store.findById('markers', f.markerId)
      return m ? { ...m, favoriteId: f.id, favoriteTime: f.createdAt } : null
    }).filter(Boolean)
    return Promise.resolve(markers)
  },

  // ===== 领养相关 =====
  getAdoptionList(params = {}) {
    let adoptions = Store.get('adoptions')
    const { type, urgent } = params
    if (type) adoptions = adoptions.filter(a => a.type === type)
    if (urgent) adoptions = adoptions.filter(a => a.isUrgent)
    // 只显示可领养的
    adoptions = adoptions.filter(a => !a.status || a.status === 'available')
    adoptions.sort((a, b) => b.createdAt - a.createdAt)
    return Promise.resolve(adoptions)
  },

  getAdoptionById(id) {
    const adoption = Store.findById('adoptions', id)
    if (adoption) {
      // 附加申请人数
      const apps = Store.query('applications', { listingId: id })
      adoption.applicantCount = apps.length
    }
    return Promise.resolve(adoption)
  },

  createAdoption(data) {
    const user = this.getCurrentUser()
    const adoption = {
      ...data,
      ownerId: user.id,
      ownerName: user.nickname,
      ownerAvatar: user.avatar,
      status: 'available',
      applicantCount: 0,
      // 与小程序对齐：补齐所有字段
      breed: data.breed || '',
      gender: data.gender || '',
      age: data.age || '',
      tags: data.tags || [],
      requirements: data.requirements || ['有稳定住所', '科学喂养', '定期回访', '不弃养'],
      minPoints: data.minPoints || 0,
      isUrgent: data.isUrgent || false,
      updatedAt: Date.now(),
      createdAt: Date.now()
    }
    const created = Store.insert('adoptions', adoption)
    return Promise.resolve(created)
  },

  applyAdoption(listingId, message, confirmations) {
    const user = this.getCurrentUser()
    // 重复申请校验
    const existing = Store.query('applications', { listingId, applicantId: user.id })
    if (existing.length > 0) {
      return Promise.resolve({ success: false, message: '您已申请过该领养' })
    }
    const application = {
      listingId,
      applicantId: user.id,
      applicantName: user.nickname,
      applicantAvatar: user.avatar,
      message,
      confirmations,
      status: 'pending',
      createdAt: Date.now()
    }
    Store.insert('applications', application)
    // 更新申请人数
    const adoption = Store.findById('adoptions', listingId)
    if (adoption) {
      Store.updateById('adoptions', listingId, {
        applicantCount: (adoption.applicantCount || 0) + 1,
        updatedAt: Date.now()
      })
    }
    return Promise.resolve({ success: true })
  },

  getMyApplications() {
    const user = this.getCurrentUser()
    const apps = Store.query('applications', { applicantId: user.id })
    const list = apps.map(app => {
      const adoption = Store.findById('adoptions', app.listingId)
      return {
        ...app,
        petName: adoption ? adoption.name : '未知宠物',
        petIcon: adoption ? adoption.icon || '🐾' : '🐾'
      }
    }).sort((a, b) => b.createdAt - a.createdAt)
    return Promise.resolve(list)
  },

  // 新增：获取领养申请列表（发布者视角，对齐 adoption.getApplications）
  getApplications(listingId) {
    const apps = Store.query('applications', { listingId })
    const list = apps.map(app => {
      const adoption = Store.findById('adoptions', app.listingId)
      return {
        ...app,
        petName: adoption ? adoption.name : '未知宠物',
        petIcon: adoption ? adoption.icon || '🐾' : '🐾'
      }
    }).sort((a, b) => b.createdAt - a.createdAt)
    return Promise.resolve(list)
  },

  // 新增：审核领养申请（对齐 adoption.reviewApplication）
  reviewApplication(applicationId, action, reviewNote = '') {
    const app = Store.findById('applications', applicationId)
    if (!app) return Promise.resolve({ success: false, message: '申请不存在' })
    const status = action === 'approve' ? 'approved' : 'rejected'
    Store.updateById('applications', applicationId, {
      status,
      reviewNote,
      reviewedAt: Date.now()
    })
    // 如果通过，更新领养状态
    if (status === 'approved') {
      Store.updateById('adoptions', app.listingId, {
        status: 'adopted',
        adoptedBy: app.applicantId,
        updatedAt: Date.now()
      })
      // 申请人加 300 积分
      const applicant = Store.findById('users', app.applicantId)
      if (applicant) {
        const pts = applicant.points || { base: 0, friendly: 0 }
        pts.friendly = (pts.friendly || 0) + 300
        Store.updateById('users', app.applicantId, { points: pts })
        Store.insert('points', {
          userId: app.applicantId,
          type: 'friendly',
          points: 300,
          reason: '完成领养',
          createdAt: Date.now()
        })
      }
    }
    return Promise.resolve({ success: true })
  },

  // 新增：我发布的领养列表（对齐 adoption.myListings）
  getMyListings() {
    const user = this.getCurrentUser()
    const list = Store.query('adoptions', { ownerId: user.id })
    list.forEach(a => {
      const apps = Store.query('applications', { listingId: a.id })
      a.applicantCount = apps.length
    })
    list.sort((a, b) => b.createdAt - a.createdAt)
    return Promise.resolve(list)
  },

  getMyRescueRecords() {
    const user = this.getCurrentUser()
    const records = Store.query('rescue', { responderId: user.id })
    const list = records.map(r => {
      const marker = Store.findById('markers', r.markerId)
      return {
        ...r,
        markerTitle: marker ? marker.title : '未知标记',
        marker: marker
      }
    }).sort((a, b) => b.createdAt - a.createdAt)
    return Promise.resolve(list)
  },

  // ===== 救助相关 =====
  // 修复：增加 message 参数（对齐 rescue.respond）
  respondRescue(markerId, message = '已响应救助') {
    const user = this.getCurrentUser()
    const existing = Store.query('rescue', { markerId, responderId: user.id })
    if (existing.length > 0) return Promise.resolve({ success: false, message: '已响应过' })
    Store.insert('rescue', {
      markerId,
      responderId: user.id,
      responderName: user.nickname,
      status: 'rescuing',
      progress: [{ time: Date.now(), content: message, author: user.nickname, images: [] }],
      createdAt: Date.now()
    })
    Store.updateById('markers', markerId, { status: 'rescuing', rescueStatus: 'rescuing', updatedAt: Date.now() })
    this.addPoints('friendly', 50, '响应救助')
    return Promise.resolve({ success: true })
  },

  getRescueProgress(markerId) {
    const records = Store.query('rescue', { markerId })
    return Promise.resolve(records[0] || null)
  },

  // 修复：增加 images 参数（对齐 rescue.updateProgress）
  updateRescueProgress(markerId, content, images = []) {
    const user = this.getCurrentUser()
    const records = Store.query('rescue', { markerId, responderId: user.id })
    if (records.length === 0) return Promise.resolve({ success: false, message: '未参与救助' })
    const record = records[0]
    const progress = record.progress || []
    progress.push({ time: Date.now(), content, author: user.nickname, images })
    Store.updateById('rescue', record.id, { progress })
    return Promise.resolve({ success: true })
  },

  completeRescue(markerId, summary = '') {
    const user = this.getCurrentUser()
    const records = Store.query('rescue', { markerId, responderId: user.id })
    if (records.length === 0) return Promise.resolve({ success: false, message: '未参与救助' })
    const record = records[0]
    const progress = record.progress || []
    progress.push({ time: Date.now(), content: '救助完成：' + summary, author: user.nickname, images: [] })
    Store.updateById('rescue', record.id, { status: 'resolved', progress })
    Store.updateById('markers', markerId, { status: 'resolved', rescueStatus: 'resolved', updatedAt: Date.now() })
    this.addPoints('friendly', 200, '完成救助')
    return Promise.resolve({ success: true })
  },

  // ===== 积分相关 =====
  addPoints(type, points, reason) {
    const user = this.getCurrentUser()
    Store.insert('points', {
      userId: user.id,
      type,
      points,
      reason,
      createdAt: Date.now()
    })
    // 更新用户积分
    const updated = Store.findById('users', user.id)
    if (updated) {
      const pts = updated.points || { base: 0, friendly: 0 }
      pts[type] = (pts[type] || 0) + points
      Store.updateById('users', user.id, { points: pts })
    }
    return Promise.resolve(true)
  },

  getPointRecords(params = {}) {
    const user = this.getCurrentUser()
    let records = Store.query('points', { userId: user.id })
    const { type, page = 1, pageSize = 20 } = params
    if (type) records = records.filter(r => r.type === type)
    records.sort((a, b) => b.createdAt - a.createdAt)
    const total = records.length
    const start = (page - 1) * pageSize
    const list = records.slice(start, start + pageSize)
    return Promise.resolve({ list, total, page, hasMore: start + pageSize < total })
  },

  getExchangeOptions() {
    return Promise.resolve([
      { id: 'sterilization', name: '流浪动物绝育', icon: '🐾', points: 10000, desc: '为流浪动物提供绝育手术', category: '公益' },
      { id: 'cat_feeding', name: '上门喂猫', icon: '🐱', points: 500, desc: '志愿者上门喂猫服务', category: '服务' },
      { id: 'dog_walking', name: '上门遛狗', icon: '🐶', points: 800, desc: '志愿者上门遛狗服务', category: '服务' },
      { id: 'coupon_200', name: '200积分券', icon: '🎫', points: 200, desc: '可抵扣合作商家消费', category: '券' },
      { id: 'coupon_500', name: '500积分券', icon: '🎫', points: 500, desc: '可抵扣合作商家消费', category: '券' },
      { id: 'pet_food', name: '宠物粮礼包', icon: '🍖', points: 2000, desc: '一袋宠物粮（5kg）', category: '实物' }
    ])
  },

  // 修复：返回 exchangeId（对齐 points.exchange）
  exchangePoints(optionId) {
    const user = this.getCurrentUser()
    return this.getExchangeOptions().then(options => {
      const option = options.find(o => o.id === optionId)
      if (!option) return { success: false, message: '兑换选项不存在' }
      const friendly = user.points?.friendly || 0
      if (friendly < option.points) return { success: false, message: '友善积分不足' }

      // 创建兑换记录
      const exchange = Store.insert('exchanges', {
        userId: user.id,
        optionId,
        optionName: option.name,
        points: option.points,
        status: 'pending',
        createdAt: Date.now()
      })

      // 扣减积分
      this.addPoints('friendly', -option.points, '积分兑换：' + option.name)

      return { success: true, data: { exchangeId: exchange.id, remainingPoints: friendly - option.points } }
    })
  },

  getExchangeRecords() {
    const user = this.getCurrentUser()
    const records = Store.query('exchanges', { userId: user.id })
    records.sort((a, b) => b.createdAt - a.createdAt)
    return Promise.resolve(records)
  },

  getLeaderboard(period = 'all') {
    const users = Store.get('users')
    let pointsData = []

    if (period === 'all') {
      // 总榜：直接用用户友善积分
      pointsData = users.map(u => ({
        userId: u.id,
        nickname: u.nickname,
        avatar: u.avatar,
        points: u.points?.friendly || 0
      }))
    } else {
      // 周/月榜：聚合积分记录
      const now = Date.now()
      const days = period === 'weekly' ? 7 : 30
      const startTime = now - days * 86400000
      const records = Store.get('points').filter(p =>
        p.type === 'friendly' && p.createdAt > startTime
      )
      const userMap = {}
      records.forEach(r => {
        userMap[r.userId] = (userMap[r.userId] || 0) + r.points
      })
      pointsData = users.map(u => ({
        userId: u.id,
        nickname: u.nickname,
        avatar: u.avatar,
        points: userMap[u.id] || 0
      }))
    }

    // 排序并添加排名
    pointsData.sort((a, b) => b.points - a.points)
    const currentUser = this.getCurrentUser()
    pointsData.forEach((item, index) => {
      item.rank = index + 1
      item.isCurrentUser = item.userId === currentUser.id
    })

    return Promise.resolve(pointsData.filter(u => u.points > 0).slice(0, 100))
  },

  getLoveHours() {
    const user = this.getCurrentUser()
    const friendly = user.points?.friendly || 0
    return Promise.resolve({ hours: Math.floor(friendly / 100), friendly })
  },

  getRank() {
    return this.getLeaderboard('all').then(list => {
      const currentUser = this.getCurrentUser()
      const found = list.find(u => u.userId === currentUser.id)
      return { rank: found ? found.rank : list.length + 1, total: list.length }
    })
  },

  getContributions() {
    const user = this.getCurrentUser()
    const marks = Store.query('markers', { userId: user.id }).length
    const apps = Store.query('applications', { applicantId: user.id, status: 'approved' }).length
    return Promise.resolve({ marks, adoptions: apps, posts: 0, reviews: 0 })
  },

  // ===== 聊天相关 =====
  getConversations() {
    const user = this.getCurrentUser()
    const chats = Store.get('chats').filter(c => c.fromId === user.id || c.toId === user.id)
    // 按会话分组
    const convMap = {}
    chats.forEach(c => {
      const otherId = c.fromId === user.id ? c.toId : c.fromId
      if (!convMap[otherId] || c.createdAt > convMap[otherId].lastTime) {
        const otherUser = Store.findById('users', otherId)
        convMap[otherId] = {
          otherId,
          otherName: otherUser ? otherUser.nickname : '未知用户',
          otherAvatar: otherUser ? otherUser.avatar : '🐾',
          lastMessage: c.content,
          lastTime: c.createdAt,
          unread: 0
        }
      }
      if (c.toId === user.id && !c.read) convMap[otherId].unread++
    })
    return Promise.resolve(Object.values(convMap).sort((a, b) => b.lastTime - a.lastTime))
  },

  // 修复：增加 page 分页参数（对齐 chat.history）
  getChatHistory(otherId, page = 1, pageSize = 20) {
    const user = this.getCurrentUser()
    const all = Store.get('chats').filter(c =>
      (c.fromId === user.id && c.toId === otherId) ||
      (c.fromId === otherId && c.toId === user.id)
    ).sort((a, b) => a.createdAt - b.createdAt)
    const total = all.length
    const start = Math.max(0, total - page * pageSize)
    const list = all.slice(start, start + pageSize)
    return Promise.resolve({ list, total, hasMore: start > 0 })
  },

  // 修复：增加 extra 参数（对齐 chat.send）
  sendMessage(receiverId, content, type = 'text', extra = null) {
    const user = this.getCurrentUser()
    const msg = Store.insert('chats', {
      fromId: user.id,
      toId: receiverId,
      content,
      type,
      extra,
      read: false,
      createdAt: Date.now()
    })
    return Promise.resolve(msg)
  },

  markRead(otherId) {
    const user = this.getCurrentUser()
    const chats = Store.get('chats')
    chats.forEach(c => {
      if (c.fromId === otherId && c.toId === user.id && !c.read) {
        c.read = true
      }
    })
    Store.set('chats', chats)
    return Promise.resolve(true)
  },

  // ===== 宠物相关 =====
  getPetList() {
    const user = this.getCurrentUser()
    return Promise.resolve(Store.query('pets', { ownerId: user.id }).sort((a, b) => b.createdAt - a.createdAt))
  },

  getPetById(id) {
    return Promise.resolve(Store.findById('pets', id))
  },

  createPet(data) {
    const user = this.getCurrentUser()
    const iconMap = { cat: '🐱', dog: '🐶', other: '🐾' }
    const pet = Store.insert('pets', {
      ...data,
      ownerId: user.id,
      icon: data.icon || iconMap[data.type] || '🐾',
      album: data.album || [],
      breed: data.breed || '',
      gender: data.gender || 'unknown',
      birthday: data.birthday || '',
      weight: data.weight || '',
      personality: data.personality || '',
      updatedAt: Date.now(),
      createdAt: Date.now()
    })
    this.addPoints('friendly', 10, '创建宠物档案')
    return Promise.resolve(pet)
  },

  updatePet(id, data) {
    Store.updateById('pets', id, { ...data, updatedAt: Date.now() })
    return Promise.resolve(true)
  },

  deletePet(id) {
    Store.deleteById('pets', id)
    Store.deleteByCondition('diaries', { petId: id })
    return Promise.resolve(true)
  },

  getPetDiaries(petId, page = 1, pageSize = 20) {
    const diaries = Store.query('diaries', { petId }).sort((a, b) => b.date - a.date)
    const total = diaries.length
    const start = (page - 1) * pageSize
    return Promise.resolve({ list: diaries.slice(start, start + pageSize), total, hasMore: start + pageSize < total })
  },

  addPetDiary(data) {
    const user = this.getCurrentUser()
    const diary = Store.insert('diaries', {
      ...data,
      userId: user.id,
      date: data.date || Date.now(),
      mood: data.mood || '😊',
      weight: data.weight || '',
      images: data.images || [],
      createdAt: Date.now()
    })
    this.addPoints('friendly', 5, '添加宠物日记')
    return Promise.resolve(diary)
  },

  deletePetDiary(id) {
    Store.deleteById('diaries', id)
    return Promise.resolve(true)
  },

  getBirthdayReminders() {
    const user = this.getCurrentUser()
    const pets = Store.query('pets', { ownerId: user.id })
    return Promise.resolve(pets.filter(p => p.birthday).map(p => ({
      petId: p.id,
      name: p.name,
      icon: p.icon,
      birthday: p.birthday,
      daysUntilBirthday: Util.daysUntilBirthday(p.birthday)
    })))
  },

  // ===== 实名认证 =====
  submitVerification(data) {
    const user = this.getCurrentUser()
    Store.insert('verifications', {
      userId: user.id,
      ...data,
      status: 'pending',
      createdAt: Date.now()
    })
    Store.updateById('users', user.id, { verified: true })
    this.addPoints('base', 500, '实名认证')
    return Promise.resolve({ success: true })
  },

  getVerificationStatus() {
    const user = this.getCurrentUser()
    const record = Store.query('verifications', { userId: user.id }).sort((a, b) => b.createdAt - a.createdAt)[0]
    return Promise.resolve({
      verified: user.verified || false,
      status: record ? record.status : (user.verified ? 'approved' : 'unverified')
    })
  }
}
