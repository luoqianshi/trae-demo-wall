const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

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

function isOutOfSeason(food) {
  if (!food.bestMonths || food.bestMonths.length === 0) return false
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  return !food.bestMonths.includes(currentMonth)
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
      case 'batchDelete':
        return await batchDelete(OPENID, event)
      case 'batchMoveToFridge':
        return await batchMoveToFridge(OPENID, event)
      case 'updateSortOrder':
        return await updateSortOrder(OPENID, event)
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
  const result = await db.collection('wantList').where({
    userId: userId,
    status: 'active'
  }).orderBy('sortOrder', 'asc').get()

  const items = result.data.map(item => {
    const outOfSeason = isOutOfSeason(item)
    const shelfLife = getShelfLife(item)
    return {
      ...item,
      outOfSeason,
      outOfSeasonText: outOfSeason ? '本年度已下市' : '',
      shelfLifeDays: shelfLife.days,
      shelfLifeName: shelfLife.name
    }
  })

  return {
    success: true,
    data: items
  }
}

async function addItem(userId, event) {
  const { foodId, foodDetail } = event

  if (!foodId) {
    return { success: false, message: '缺少美食ID' }
  }

  let food = foodDetail
  if (!food) {
    const foodResult = await db.collection('foods').doc(foodId).get()
    food = foodResult.data
  }

  const existingItem = await db.collection('wantList').where({
    userId: userId,
    foodId: foodId,
    status: 'active'
  }).get()

  if (existingItem.data.length > 0) {
    return {
      success: false,
      message: '已在想吃清单中',
      isInWantList: true
    }
  }

  const countResult = await db.collection('wantList').where({
    userId: userId,
    status: 'active'
  }).count()

  const now = new Date()
  const sortOrder = countResult.total + 1

  const result = await db.collection('wantList').add({
    data: {
      userId: userId,
      foodId: foodId,
      name: food.name,
      category: food.category,
      subCategory: food.subCategory,
      image: food.images && food.images[0] ? food.images[0] : '',
      origin: food.origin || '',
      bestMonths: food.bestMonths || [],
      season: food.season || '',
      tasteTags: food.tasteTags || [],
      sortOrder: sortOrder,
      status: 'active',
      createTime: now,
      updateTime: now
    }
  })

  return {
    success: true,
    message: '已加入想吃清单',
    wantItemId: result._id
  }
}

async function deleteItem(userId, event) {
  const { itemId } = event

  if (!itemId) {
    return { success: false, message: '缺少ID' }
  }

  await db.collection('wantList').doc(itemId).update({
    data: {
      status: 'deleted',
      updateTime: new Date()
    }
  })

  return {
    success: true,
    message: '已从想吃清单移除'
  }
}

async function batchDelete(userId, event) {
  const { itemIds } = event

  if (!itemIds || itemIds.length === 0) {
    return { success: false, message: '请选择要删除的美食' }
  }

  const now = new Date()
  const tasks = itemIds.map(id =>
    db.collection('wantList').doc(id).update({
      data: {
        status: 'deleted',
        updateTime: now
      }
    })
  )

  await Promise.all(tasks)

  return {
    success: true,
    message: `已删除${itemIds.length}件`,
    data: { count: itemIds.length }
  }
}

async function batchMoveToFridge(userId, event) {
  const { itemIds } = event

  if (!itemIds || itemIds.length === 0) {
    return { success: false, message: '请选择要移入的美食' }
  }

  const wantResult = await db.collection('wantList').where({
    userId: userId,
    _id: _.in(itemIds),
    status: 'active'
  }).get()

  if (wantResult.data.length === 0) {
    return { success: false, message: '未找到想吃清单数据' }
  }

  const successItems = []
  const failedItems = []
  const now = new Date()

  for (const wantItem of wantResult.data) {
    const shelfLife = getShelfLife(wantItem)
    const targetLayer = shelfLife.layer || 'cold'

    const existingFridgeItem = await db.collection('fridge').where({
      userId: userId,
      foodId: wantItem.foodId,
      status: 'active'
    }).get()

    if (existingFridgeItem.data.length > 0) {
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

async function updateSortOrder(userId, event) {
  const { items } = event

  if (!items || items.length === 0) {
    return { success: false, message: '缺少排序数据' }
  }

  const now = new Date()
  const tasks = items.map((item, index) =>
    db.collection('wantList').doc(item.id).update({
      data: {
        sortOrder: index + 1,
        updateTime: now
      }
    })
  )

  await Promise.all(tasks)

  return {
    success: true,
    message: '排序已更新'
  }
}
