const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

const PAGE_SIZE = 20

const VALID_TYPES = ['seasonal', 'expiry', 'overstock', 'system']

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action } = event

  if (!OPENID) {
    return { success: false, message: '未获取到用户身份' }
  }

  try {
    switch (action) {
      case 'getList':
        return await getList(OPENID, event)
      case 'markRead':
        return await markRead(OPENID, event)
      case 'markAllRead':
        return await markAllRead(OPENID, event)
      case 'clearAll':
        return await clearAll(OPENID, event)
      case 'getUnreadCount':
        return await getUnreadCount(OPENID, event)
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (err) {
    return {
      success: false,
      error: err.message,
      message: '操作失败'
    }
  }
}

async function getList(userId, event) {
  const { type, page = 1, pageSize = PAGE_SIZE } = event

  const where = {
    userId: userId,
    isDeleted: false
  }

  if (type && type !== 'all' && VALID_TYPES.indexOf(type) > -1) {
    where.type = type
  }

  const pageNumber = Math.max(parseInt(page, 10) || 1, 1)
  const size = Math.max(parseInt(pageSize, 10) || PAGE_SIZE, 1)

  const countResult = await db.collection('messages').where(where).count()
  const total = countResult.total

  const listResult = await db.collection('messages')
    .where(where)
    .orderBy('createTime', 'desc')
    .skip((pageNumber - 1) * size)
    .limit(size)
    .get()

  const list = listResult.data.map(item => ({
    ...item,
    createTimeText: formatTime(item.createTime)
  }))

  return {
    success: true,
    data: {
      list,
      total,
      page: pageNumber,
      pageSize: size,
      hasMore: pageNumber * size < total
    }
  }
}

async function markRead(userId, event) {
  const { messageId } = event

  if (!messageId) {
    return { success: false, message: '缺少消息ID' }
  }

  await db.collection('messages').doc(messageId).update({
    data: {
      isRead: true,
      updateTime: new Date()
    }
  })

  return {
    success: true,
    message: '已标记为已读'
  }
}

async function markAllRead(userId, event) {
  const { type } = event

  const where = {
    userId: userId,
    isRead: false,
    isDeleted: false
  }

  if (type && type !== 'all' && VALID_TYPES.indexOf(type) > -1) {
    where.type = type
  }

  const result = await db.collection('messages').where(where).update({
    data: {
      isRead: true,
      updateTime: new Date()
    }
  })

  return {
    success: true,
    message: '已全部标记为已读',
    data: { updated: result.stats ? result.stats.updated : 0 }
  }
}

async function clearAll(userId, event) {
  const { type } = event

  const where = {
    userId: userId,
    isDeleted: false
  }

  if (type && type !== 'all' && VALID_TYPES.indexOf(type) > -1) {
    where.type = type
  }

  const result = await db.collection('messages').where(where).update({
    data: {
      isDeleted: true,
      isRead: true,
      updateTime: new Date()
    }
  })

  return {
    success: true,
    message: '已清空消息',
    data: { cleared: result.stats ? result.stats.updated : 0 }
  }
}

async function getUnreadCount(userId, event) {
  const { type } = event

  const where = {
    userId: userId,
    isRead: false,
    isDeleted: false
  }

  if (type && type !== 'all' && VALID_TYPES.indexOf(type) > -1) {
    where.type = type
  }

  const countResult = await db.collection('messages').where(where).count()

  const breakdownResult = await db.collection('messages').where({
    userId: userId,
    isRead: false,
    isDeleted: false
  }).get()

  const breakdown = { seasonal: 0, expiry: 0, overstock: 0, system: 0 }
  breakdownResult.data.forEach(item => {
    if (breakdown[item.type] !== undefined) {
      breakdown[item.type]++
    }
  })

  return {
    success: true,
    data: {
      total: countResult.total,
      breakdown
    }
  }
}

function formatTime(date) {
  const d = new Date(date)
  const now = new Date()

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const pad = (n) => String(n).padStart(2, '0')

  if (isSameDay(d, now)) {
    return `今天 ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameDay(d, yesterday)) {
    return `昨天 ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  if (diffDays < 7) {
    return `${diffDays}天前`
  }

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
