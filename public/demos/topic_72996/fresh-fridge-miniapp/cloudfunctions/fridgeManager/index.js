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

const shelfLifeMap = {
  seasonal_fruit: { days: 5, name: '时令鲜果', layer: 'fresh' },
  cold_chain_cooked: { days: 7, name: '冷链真空熟食', layer: 'cold' },
  room_temp_pastry: { days: 30, name: '常温真空糕点', layer: 'cold' },
  dried_sausage: { days: 90, name: '风干腊味特产', layer: 'cold' },
  fruit: { days: 7, name: '水果类', layer: 'fresh' },
  vegetable: { days: 5, name: '蔬菜类', layer: 'fresh' },
  meat: { days: 3, name: '肉类', layer: 'cold' },
  seafood: { days: 2, name: '海鲜类', layer: 'cold' },
  dairy: { days: 7, name: '蛋奶类', layer: 'cold' },
  grain: { days: 30, name: '粮油类', layer: 'cold' },
  snack: { days: 15, name: '零食类', layer: 'cold' },
  drink: { days: 30, name: '饮品类', layer: 'cold' },
  seasoning: { days: 180, name: '调味类', layer: 'cold' },
  frozen: { days: 90, name: '冷冻类', layer: 'cold' }
}

function getShelfLife(food) {
  if (food.category === 'fruit') {
    return shelfLifeMap.seasonal_fruit
  }

  if (food.category === 'meat' || food.category === 'seafood') {
    if (food.mailInfo && food.mailInfo.packaging && food.mailInfo.packaging.includes('真空')) {
      return shelfLifeMap.cold_chain_cooked
    }
  }

  if (food.category === 'snack') {
    if (food.subCategory === 'biscuit') {
      return shelfLifeMap.room_temp_pastry
    }
  }

  if (food.category === 'meat') {
    if (food.subCategory === 'pork' && food.name && (food.name.includes('腊') || food.name.includes('风干'))) {
      return shelfLifeMap.dried_sausage
    }
  }

  if (food.shelfLifeDays) {
    return { days: food.shelfLifeDays, name: '自定义', layer: 'cold' }
  }

  if (food.mailInfo && food.mailInfo.shelfLife) {
    return { days: food.mailInfo.shelfLife, name: '参考邮寄保质期', layer: food.category === 'fruit' || food.category === 'vegetable' ? 'fresh' : 'cold' }
  }

  if (food.category && shelfLifeMap[food.category]) {
    return shelfLifeMap[food.category]
  }

  return { days: 7, name: '默认保质期', layer: 'cold' }
}

function getExpireStatus(expireDate) {
  const now = new Date()
  const expire = new Date(expireDate)
  const diffTime = expire - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { status: 'expired', days: Math.abs(diffDays) }
  if (diffDays === 0) return { status: 'today', days: 0 }
  if (diffDays <= 3) return { status: 'warning', days: diffDays }
  return { status: 'fresh', days: diffDays }
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action } = event

  try {
    switch (action) {
      case 'getList':
        return await getList(OPENID)
      case 'addItem':
        return await addItem(OPENID, event)
      case 'deleteItem':
        return await deleteItem(OPENID, event)
      case 'batchMoveFromWant':
        return await batchMoveFromWant(OPENID, event)
      case 'clearExpired':
        return await clearExpired(OPENID)
      case 'updateNote':
        return await updateNote(OPENID, event)
      case 'checkCapacity':
        return await checkCapacity(OPENID, event)
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

async function getList(userId) {
  const result = await db.collection('fridge').where({
    userId: userId,
    status: 'active'
  }).orderBy('expireDate', 'asc').get()

  const items = result.data.map(item => {
    const statusInfo = getExpireStatus(item.expireDate)
    return {
      ...item,
      status: statusInfo.status,
      daysRemaining: statusInfo.days,
      isExpired: statusInfo.status === 'expired'
    }
  })

  const coldItems = items.filter(item => (item.layer === 'cold' || !item.layer) && !item.isExpired)
  const freshItems = items.filter(item => item.layer === 'fresh' && !item.isExpired)
  const expiredItems = items.filter(item => item.isExpired)

  const stats = {
    total: items.length,
    coldCount: coldItems.length,
    freshCount: freshItems.length,
    expiredCount: expiredItems.length,
    coldCapacity: CAPACITY.cold,
    freshCapacity: CAPACITY.fresh
  }

  return {
    success: true,
    data: {
      coldItems,
      freshItems,
      expiredItems,
      stats
    }
  }
}

async function addItem(userId, event) {
  const { foodId, foodDetail, layer, note } = event

  if (!foodId) {
    return { success: false, message: '缺少美食ID' }
  }

  let food = foodDetail
  if (!food) {
    const foodResult = await db.collection('foods').doc(foodId).get()
    food = foodResult.data
  }

  const shelfLife = getShelfLife(food)
  const targetLayer = layer || shelfLife.layer || 'cold'

  const capacityResult = await checkCapacity(userId, { layer: targetLayer })
  if (!capacityResult.data.available) {
    return {
      success: false,
      message: `${targetLayer === 'cold' ? '冷藏层' : '保鲜层'}容量已满`,
      isFull: true
    }
  }

  const existingItem = await db.collection('fridge').where({
    userId: userId,
    foodId: foodId,
    status: 'active'
  }).get()

  if (existingItem.data.length > 0) {
    return {
      success: false,
      message: '该美食已在冰箱中',
      isInFridge: true
    }
  }

  const now = new Date()
  const expireDate = new Date(now.getTime() + shelfLife.days * 24 * 60 * 60 * 1000)

  const result = await db.collection('fridge').add({
    data: {
      userId: userId,
      foodId: foodId,
      name: food.name,
      category: food.category,
      subCategory: food.subCategory,
      image: food.images && food.images[0] ? food.images[0] : '',
      origin: food.origin || '',
      shelfLifeTemplate: shelfLife.name,
      shelfLifeDays: shelfLife.days,
      purchaseDate: now,
      expireDate: expireDate,
      layer: targetLayer,
      note: note || '',
      quantity: 1,
      unit: '份',
      status: 'active',
      isExpired: false,
      createTime: now,
      updateTime: now
    }
  })

  return {
    success: true,
    message: '已成功加入冰箱',
    fridgeItemId: result._id
  }
}

async function deleteItem(userId, event) {
  const { itemId } = event

  if (!itemId) {
    return { success: false, message: '缺少食材ID' }
  }

  await db.collection('fridge').doc(itemId).update({
    data: {
      status: 'deleted',
      updateTime: new Date()
    }
  })

  return {
    success: true,
    message: '删除成功'
  }
}

async function batchMoveFromWant(userId, event) {
  const { wantIds } = event

  if (!wantIds || wantIds.length === 0) {
    return { success: false, message: '请选择要移入的美食' }
  }

  const wantResult = await db.collection('wantList').where({
    userId: userId,
    _id: _.in(wantIds)
  }).get()

  if (wantResult.data.length === 0) {
    return { success: false, message: '未找到想吃清单数据' }
  }

  const coldCountResult = await db.collection('fridge').where({
    userId: userId,
    status: 'active',
    layer: 'cold',
    isExpired: false
  }).count()

  const freshCountResult = await db.collection('fridge').where({
    userId: userId,
    status: 'active',
    layer: 'fresh',
    isExpired: false
  }).count()

  let coldUsed = coldCountResult.total
  let freshUsed = freshCountResult.total

  const successItems = []
  const failedItems = []
  const now = new Date()

  for (const wantItem of wantResult.data) {
    const shelfLife = getShelfLife(wantItem)
    const targetLayer = shelfLife.layer || 'cold'

    if (targetLayer === 'cold' && coldUsed >= CAPACITY.cold) {
      failedItems.push({ name: wantItem.name, reason: '冷藏层容量已满' })
      continue
    }
    if (targetLayer === 'fresh' && freshUsed >= CAPACITY.fresh) {
      failedItems.push({ name: wantItem.name, reason: '保鲜层容量已满' })
      continue
    }

    const existingItem = await db.collection('fridge').where({
      userId: userId,
      foodId: wantItem.foodId,
      status: 'active'
    }).get()

    if (existingItem.data.length > 0) {
      failedItems.push({ name: wantItem.name, reason: '已在冰箱中' })
      continue
    }

    const expireDate = new Date(now.getTime() + shelfLife.days * 24 * 60 * 60 * 1000)

    await db.collection('fridge').add({
      data: {
        userId: userId,
        foodId: wantItem.foodId,
        name: wantItem.name,
        category: wantItem.category,
        subCategory: wantItem.subCategory,
        image: wantItem.image || '',
        origin: wantItem.origin || '',
        shelfLifeTemplate: shelfLife.name,
        shelfLifeDays: shelfLife.days,
        purchaseDate: now,
        expireDate: expireDate,
        layer: targetLayer,
        note: '',
        quantity: 1,
        unit: '份',
        status: 'active',
        isExpired: false,
        createTime: now,
        updateTime: now
      }
    })

    await db.collection('wantList').doc(wantItem._id).update({
      data: {
        status: 'moved',
        updateTime: now
      }
    })

    successItems.push(wantItem.name)
    if (targetLayer === 'cold') {
      coldUsed++
    } else {
      freshUsed++
    }
  }

  return {
    success: true,
    message: `成功移入${successItems.length}件`,
    data: {
      successCount: successItems.length,
      failedCount: failedItems.length,
      successItems,
      failedItems
    }
  }
}

async function clearExpired(userId) {
  const result = await db.collection('fridge').where({
    userId: userId,
    status: 'active'
  }).get()

  const now = new Date()
  let count = 0

  for (const item of result.data) {
    const statusInfo = getExpireStatus(item.expireDate)
    if (statusInfo.status === 'expired') {
      await db.collection('fridge').doc(item._id).update({
        data: {
          status: 'cleared',
          updateTime: now
        }
      })
      count++
    }
  }

  return {
    success: true,
    message: `已清理${count}件过期食材`,
    data: { count }
  }
}

async function updateNote(userId, event) {
  const { itemId, note } = event

  if (!itemId) {
    return { success: false, message: '缺少食材ID' }
  }

  await db.collection('fridge').doc(itemId).update({
    data: {
      note: note || '',
      updateTime: new Date()
    }
  })

  return {
    success: true,
    message: '备注已更新'
  }
}

async function checkCapacity(userId, event) {
  const { layer } = event

  const coldResult = await db.collection('fridge').where({
    userId: userId,
    status: 'active',
    layer: 'cold'
  }).count()

  const freshResult = await db.collection('fridge').where({
    userId: userId,
    status: 'active',
    layer: 'fresh'
  }).count()

  const coldCount = coldResult.total
  const freshCount = freshResult.total

  if (layer) {
    const capacity = layer === 'cold' ? CAPACITY.cold : CAPACITY.fresh
    const used = layer === 'cold' ? coldCount : freshCount
    return {
      success: true,
      data: {
        layer,
        used,
        capacity,
        available: used < capacity,
        remaining: capacity - used
      }
    }
  }

  return {
    success: true,
    data: {
      cold: {
        used: coldCount,
        capacity: CAPACITY.cold,
        available: coldCount < CAPACITY.cold,
        remaining: CAPACITY.cold - coldCount
      },
      fresh: {
        used: freshCount,
        capacity: CAPACITY.fresh,
        available: freshCount < CAPACITY.fresh,
        remaining: CAPACITY.fresh - freshCount
      }
    }
  }
}
