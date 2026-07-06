const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

const CAPACITY = {
  cold: 20,
  fresh: 15
}

const MAX_SEASONAL_PER_USER = 5

exports.main = async (event, context) => {
  const stats = {
    users: 0,
    seasonal: 0,
    expiry: 0,
    overstock: 0,
    skipped: 0
  }

  try {
    const allFoods = await getAll('foods', { status: 'approved' })
    const allPrefs = await getAll('userPreferences', {})

    for (const prefs of allPrefs) {
      if (!prefs.userId) {
        stats.skipped++
        continue
      }

      const settings = getNotificationSettings(prefs)

      if (settings.seasonal) {
        stats.seasonal += await processSeasonalReminders(prefs, allFoods)
      }
      if (settings.expiry) {
        stats.expiry += await processExpiryReminders(prefs)
      }
      if (settings.overstock) {
        stats.overstock += await processOverstockReminders(prefs)
      }

      stats.users++
    }

    return {
      success: true,
      message: '定时提醒执行完成',
      data: stats
    }
  } catch (err) {
    return {
      success: false,
      error: err.message,
      message: '定时提醒执行失败',
      data: stats
    }
  }
}

function getNotificationSettings(prefs) {
  const ns = prefs.notificationSettings || {}
  return {
    seasonal: ns.seasonal !== false,
    expiry: ns.expiry !== false,
    overstock: ns.overstock !== false
  }
}

async function processSeasonalReminders(prefs, allFoods) {
  const now = new Date()
  const today = startOfDay(now)
  let count = 0

  const candidates = filterSeasonalCandidates(allFoods, prefs)

  for (const food of candidates) {
    if (count >= MAX_SEASONAL_PER_USER) break
    if (!food.onShelfDate || !food.offShelfDate) continue

    const onShelfDay = startOfDay(new Date(food.onShelfDate))
    const offShelfDay = startOfDay(new Date(food.offShelfDate))

    const daysToOnShelf = daysDiff(today, onShelfDay)
    const daysToOffShelf = daysDiff(today, offShelfDay)

    let reminder = null

    if (daysToOnShelf === 15) {
      reminder = {
        key: `seasonal_preheat_${food._id}_${dateStr(today)}`,
        title: `${food.name}即将上市`,
        content: `再等15天，${food.name}就要上市啦！${food.origin ? '来自' + food.origin + '的' : ''}时令美味，准备好尝鲜了吗？`
      }
    } else if (daysToOnShelf <= 0 && daysToOffShelf > 7 && isInBestSeason(food, now)) {
      const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`
      reminder = {
        key: `seasonal_peak_${food._id}_${monthKey}`,
        title: `${food.name}正值最佳赏味期`,
        content: `${food.name}现在吃正好！${food.origin ? food.origin + '直供，' : ''}鲜甜当季，错过等一年。`
      }
    } else if (daysToOffShelf === 7) {
      reminder = {
        key: `seasonal_closing_${food._id}_${dateStr(today)}`,
        title: `${food.name}即将下市`,
        content: `仅剩7天，${food.name}本季就要下市了，抓紧最后尝鲜机会！`
      }
    }

    if (reminder) {
      const sent = await createMessageIfNotExists({
        userId: prefs.userId,
        type: 'seasonal',
        title: reminder.title,
        content: reminder.content,
        foodId: food._id,
        foodName: food.name,
        reminderKey: reminder.key
      })
      if (sent) count++
    }
  }

  return count
}

function filterSeasonalCandidates(allFoods, prefs) {
  const favoriteCategories = prefs.favoriteCategories || []
  const province = (prefs.hometown || '').split(' ')[0] || ''

  const matched = []

  for (const food of allFoods) {
    const isPreferredCategory = favoriteCategories.length > 0 &&
      favoriteCategories.indexOf(food.category) > -1
    const isHometownFood = province && food.origin &&
      food.origin.indexOf(province) > -1

    if (isPreferredCategory || isHometownFood) {
      matched.push({
        ...food,
        _priority: (isPreferredCategory ? 2 : 0) + (isHometownFood ? 1 : 0) + (food.hotScore || 0) / 10000
      })
    }
  }

  if (matched.length === 0) {
    const fallback = allFoods
      .filter(f => f.onShelfDate && f.offShelfDate)
      .map(f => ({ ...f, _priority: (f.hotScore || 0) / 10000 }))
      .sort((a, b) => b._priority - a._priority)
      .slice(0, MAX_SEASONAL_PER_USER)
    return fallback
  }

  return matched.sort((a, b) => b._priority - a._priority)
}

function isInBestSeason(food, now) {
  if (!food.seasonMonths || food.seasonMonths.length === 0) return true
  const currentMonth = now.getMonth() + 1
  return food.seasonMonths.indexOf(currentMonth) > -1
}

async function processExpiryReminders(prefs) {
  const now = new Date()
  const today = startOfDay(now)
  let count = 0

  const fridgeItems = await getAll('fridge', {
    userId: prefs.userId,
    status: 'active'
  })

  for (const item of fridgeItems) {
    if (!item.expireDate) continue

    const expireDay = startOfDay(new Date(item.expireDate))
    const daysToExpire = daysDiff(today, expireDay)

    let reminder = null

    if (daysToExpire === 0) {
      reminder = {
        key: `expiry_today_${item._id}_${dateStr(today)}`,
        title: `${item.name}今天到期`,
        content: `冰箱里的${item.name}今天到期，请尽快食用或处理。`
      }
    } else if (daysToExpire > 0 && daysToExpire <= getExpiryLeadDays(item)) {
      reminder = {
        key: `expiry_soon_${item._id}_${dateStr(today)}`,
        title: `${item.name}即将到期`,
        content: `冰箱里的${item.name}还有${daysToExpire}天到期${item.shelfLifeTemplate ? '（' + item.shelfLifeTemplate + '）' : ''}，记得及时享用。`
      }
    } else if (daysToExpire < 0) {
      const expiredDays = Math.abs(daysToExpire)
      if (expiredDays <= 3) {
        reminder = {
          key: `expiry_past_${item._id}_${dateStr(today)}`,
          title: `${item.name}已过期${expiredDays}天`,
          content: `冰箱里的${item.name}已过期${expiredDays}天，建议清理避免浪费。`
        }
      }
    }

    if (reminder) {
      const sent = await createMessageIfNotExists({
        userId: prefs.userId,
        type: 'expiry',
        title: reminder.title,
        content: reminder.content,
        foodId: item.foodId || '',
        foodName: item.name,
        reminderKey: reminder.key
      })
      if (sent) count++
    }
  }

  return count
}

function getExpiryLeadDays(item) {
  if (item.shelfLifeTemplate === '冷链真空熟食') {
    return 5
  }
  if (item.mailType && item.mailType.indexOf('冷链') > -1) {
    if (item.category === 'meat' || item.category === 'seafood' || item.category === 'snack') {
      return 5
    }
  }
  if (item.category === 'fruit' || item.category === 'vegetable') {
    return 3
  }
  return 3
}

async function processOverstockReminders(prefs) {
  const todayStr = dateStr(new Date())
  let count = 0

  for (const layer of ['cold', 'fresh']) {
    const countResult = await db.collection('fridge').where({
      userId: prefs.userId,
      status: 'active',
      layer: layer,
      isExpired: false
    }).count()

    const used = countResult.total
    const capacity = CAPACITY[layer]
    const ratio = capacity > 0 ? used / capacity : 0

    if (ratio >= 0.9) {
      const layerName = layer === 'cold' ? '冷藏层' : '保鲜层'
      const sent = await createMessageIfNotExists({
        userId: prefs.userId,
        type: 'overstock',
        title: `${layerName}已接近满载`,
        content: `你的${layerName}已存放${used}/${capacity}件食材，容量达${Math.round(ratio * 100)}%，建议尽快清理或食用，避免囤积过多。`,
        foodId: '',
        foodName: '',
        reminderKey: `overstock_${layer}_${todayStr}`
      })
      if (sent) count++
    }
  }

  return count
}

async function createMessageIfNotExists(data) {
  const now = new Date()
  const messageData = {
    userId: data.userId,
    type: data.type,
    title: data.title,
    content: data.content,
    foodId: data.foodId || '',
    foodName: data.foodName || '',
    isRead: false,
    isDeleted: false,
    reminderKey: data.reminderKey || '',
    createTime: now,
    updateTime: now
  }

  if (data.reminderKey) {
    const existing = await db.collection('messages').where({
      userId: data.userId,
      reminderKey: data.reminderKey
    }).count()

    if (existing.total > 0) return false
  }

  await db.collection('messages').add({ data: messageData })
  return true
}

async function getAll(collectionName, where) {
  const pageSize = 100
  let page = 1
  let all = []

  while (true) {
    const result = await db.collection(collectionName)
      .where(where)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    all = all.concat(result.data)

    if (result.data.length < pageSize) break
    page++

    if (page > 50) break
  }

  return all
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function dateStr(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysDiff(startDay, endDay) {
  const ms = endDay.getTime() - startDay.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}
