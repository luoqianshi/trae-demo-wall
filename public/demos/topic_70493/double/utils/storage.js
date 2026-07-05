const APP_KEY = 'memoryUserData'

function getUserData() {
  try {
    const data = wx.getStorageSync(APP_KEY)
    return data || null
  } catch (e) {
    console.error('读取数据失败', e)
    return null
  }
}

function saveUserData(data) {
  try {
    wx.setStorageSync(APP_KEY, data)
    return true
  } catch (e) {
    console.error('保存数据失败', e)
    return false
  }
}

function createRiver(name, relationType, friendName) {
  let data = getUserData()
  if (!data) {
    data = { userId: 'user_' + Date.now(), rivers: [], currentSeason: 'spring' }
  }
  
  const river = {
    id: 'river_' + Date.now(),
    name: name || friendName,
    relationType: relationType,
    friendName: friendName,
    status: 'pending',
    createTime: Date.now(),
    lastUpdate: Date.now(),
    bottles: [],
    season: data.currentSeason
  }
  
  data.rivers.push(river)
  saveUserData(data)
  
  return river
}

function addBottle(riverId, content, images, bottleType) {
  const data = getUserData()
  if (!data) return null
  
  let river = null
  data.rivers.forEach(function(r) {
    if (r.id === riverId) river = r
  })
  if (!river) return null
  
  const bottle = {
    id: 'bottle_' + Date.now(),
    riverId: riverId,
    owner: data.userId,
    content: content,
    images: images || [],
    bottleType: bottleType || 'personal',
    status: 'floating',
    createTime: Date.now(),
    keywords: []
  }
  
  river.bottles.push(bottle)
  river.lastUpdate = Date.now()
  saveUserData(data)
  
  return bottle
}

function updateRiverStatus(riverId, status) {
  const data = getUserData()
  if (!data) return false
  
  let river = null
  data.rivers.forEach(function(r) {
    if (r.id === riverId) river = r
  })
  if (!river) return false
  
  river.status = status
  saveUserData(data)
  
  return true
}

function getRiverById(riverId) {
  const data = getUserData()
  if (!data) return null
  
  let river = null
  data.rivers.forEach(function(r) {
    if (r.id === riverId) river = r
  })
  return river
}

function deleteBottle(riverId, bottleId) {
  const data = getUserData()
  if (!data) return false
  
  let river = null
  data.rivers.forEach(function(r) {
    if (r.id === riverId) river = r
  })
  if (!river) return false
  
  const newBottles = []
  river.bottles.forEach(function(b) {
    if (b.id !== bottleId) newBottles.push(b)
  })
  river.bottles = newBottles
  saveUserData(data)
  
  return true
}

function updateBottleStatus(riverId, bottleId, status) {
  const data = getUserData()
  if (!data) return false
  
  let river = null
  data.rivers.forEach(function(r) {
    if (r.id === riverId) river = r
  })
  if (!river) return false
  
  let bottle = null
  river.bottles.forEach(function(b) {
    if (b.id === bottleId) bottle = b
  })
  if (!bottle) return false
  
  bottle.status = status
  saveUserData(data)
  
  return true
}

function updateSeason(season) {
  const data = getUserData()
  if (!data) return false
  
  data.currentSeason = season
  
  data.rivers.forEach(function(river) {
    river.season = season
  })
  
  saveUserData(data)
  
  return true
}

module.exports = {
  getUserData: getUserData,
  saveUserData: saveUserData,
  createRiver: createRiver,
  addBottle: addBottle,
  updateRiverStatus: updateRiverStatus,
  getRiverById: getRiverById,
  deleteBottle: deleteBottle,
  updateBottleStatus: updateBottleStatus,
  updateSeason: updateSeason
}