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
    if (food.mailInfo && (food.mailInfo.packaging && food.mailInfo.packaging.includes('真空'))) {
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
    return { days: food.shelfLifeDays, name: '自定义', layer: food.category === 'fruit' || food.category === 'vegetable' ? 'fresh' : 'cold' }
  }

  if (food.mailInfo && food.mailInfo.shelfLife) {
    return { days: food.mailInfo.shelfLife, name: '参考邮寄保质期', layer: food.category === 'fruit' || food.category === 'vegetable' ? 'fresh' : 'cold' }
  }

  if (food.category && shelfLifeMap[food.category]) {
    return shelfLifeMap[food.category]
  }

  return { days: 7, name: '默认保质期', layer: 'cold' }
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { foodId, foodDetail } = event

  if (!foodId) {
    return {
      success: false,
      message: '缺少美食ID'
    }
  }

  try {
    let food = foodDetail

    if (!food) {
      const foodResult = await db.collection('foods').doc(foodId).get()
      food = foodResult.data
    }

    const existingItem = await db.collection('fridge').where({
      userId: OPENID,
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

    const shelfLife = getShelfLife(food)
    const targetLayer = shelfLife.layer || 'cold'
    const now = new Date()
    const expireDate = new Date(now.getTime() + shelfLife.days * 24 * 60 * 60 * 1000)

    const result = await db.collection('fridge').add({
      data: {
        userId: OPENID,
        foodId: foodId,
        name: food.name,
        category: food.category,
        subCategory: food.subCategory,
        image: food.images && food.images[0] ? food.images[0] : '',
        origin: food.origin || '',
        shelfLifeTemplate: shelfLife.name,
        shelfLifeDays: shelfLife.days,
        layer: targetLayer,
        purchaseDate: now,
        expireDate: expireDate,
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
      message: '已成功移入冰箱',
      isInFridge: true,
      fridgeItemId: result._id,
      shelfLifeDays: shelfLife.days,
      shelfLifeName: shelfLife.name,
      expireDate: expireDate
    }
  } catch (err) {
    return {
      success: false,
      error: err.message,
      message: '移入冰箱失败'
    }
  }
}
