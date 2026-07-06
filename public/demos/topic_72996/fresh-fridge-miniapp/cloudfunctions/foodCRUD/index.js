const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data, id, query, page, pageSize, sortBy, sortOrder } = event

  try {
    switch (action) {
      case 'list':
        return await listFoods(query, page, pageSize, sortBy, sortOrder)
      case 'detail':
        return await getFoodDetail(id)
      case 'create':
        return await createFood(data)
      case 'update':
        return await updateFood(id, data)
      case 'delete':
        return await deleteFood(id)
      default:
        return {
          success: false,
          message: '不支持的操作类型'
        }
    }
  } catch (err) {
    return {
      success: false,
      error: err.message,
      message: '操作失败'
    }
  }
}

async function listFoods(query = {}, page = 1, pageSize = 20, sortBy = 'hotScore', sortOrder = 'desc') {
  const where = buildQuery(query)
  const skip = (page - 1) * pageSize

  const countResult = await db.collection('foods').where(where).count()
  const total = countResult.total

  let queryBuilder = db.collection('foods').where(where)

  if (sortBy && sortOrder) {
    queryBuilder = queryBuilder.orderBy(sortBy, sortOrder)
  }

  const listResult = await queryBuilder.skip(skip).limit(pageSize).get()

  return {
    success: true,
    data: {
      list: listResult.data,
      total,
      page,
      pageSize,
      hasMore: skip + pageSize < total
    },
    message: '查询成功'
  }
}

function buildQuery(query) {
  const where = {
    status: 'approved'
  }

  if (query.category) {
    where.category = query.category
  }

  if (query.subCategory) {
    where.subCategory = query.subCategory
  }

  if (query.originProvince || query.originCity) {
    if (query.originProvince && query.originCity) {
      where.origin = db.RegExp({
        regexp: query.originProvince + '.*' + query.originCity,
        options: 'i'
      })
    } else if (query.originProvince) {
      where.origin = db.RegExp({
        regexp: query.originProvince,
        options: 'i'
      })
    }
  }

  if (query.months && Array.isArray(query.months) && query.months.length > 0) {
    where.seasonMonths = _.in(query.months)
  } else if (query.month !== undefined && query.month !== null) {
    where.seasonMonths = _.in([query.month])
  }

  if (query.canMail !== undefined && query.canMail !== null) {
    where.canMail = query.canMail
  }

  if (query.mailType) {
    where.mailType = query.mailType
  }

  if (query.keyword) {
    where.name = db.RegExp({
      regexp: query.keyword,
      options: 'i'
    })
  }

  if (query.isOfficial !== undefined && query.isOfficial !== null) {
    where.isOfficial = query.isOfficial
  }

  return where
}

async function getFoodDetail(id) {
  if (!id) {
    return {
      success: false,
      message: '缺少美食ID'
    }
  }

  const result = await db.collection('foods').doc(id).get()

  return {
    success: true,
    data: result.data,
    message: '获取详情成功'
  }
}

async function createFood(data) {
  if (!data.name || !data.category) {
    return {
      success: false,
      message: '缺少必填字段'
    }
  }

  const now = new Date()
  const foodData = {
    name: data.name,
    category: data.category,
    subCategory: data.subCategory || '',
    images: data.images || [],
    origin: data.origin || '',
    description: data.description || '',
    seasonMonths: data.seasonMonths || [],
    onShelfDate: data.onShelfDate || null,
    offShelfDate: data.offShelfDate || null,
    priceMin: data.priceMin || 0,
    priceMax: data.priceMax || 0,
    priceUnit: data.priceUnit || '元/斤',
    canMail: data.canMail !== undefined ? data.canMail : false,
    mailType: data.mailType || '',
    express: data.express || '',
    shelfLifeDays: data.shelfLifeDays || 0,
    shippingFee: data.shippingFee || 0,
    remoteArea: data.remoteArea || '',
    shopName: data.shopName || '',
    shopAddress: data.shopAddress || '',
    shopYears: data.shopYears || 0,
    shopTags: data.shopTags || [],
    buyChannels: data.buyChannels || [],
    mailTips: data.mailTips || '',
    voteCount: data.voteCount || 0,
    mailVoteCount: data.mailVoteCount || 0,
    favoriteCount: data.favoriteCount || 0,
    wantCount: data.wantCount || 0,
    hotScore: data.hotScore || 0,
    status: data.status || 'pending',
    isOfficial: data.isOfficial !== undefined ? data.isOfficial : false,
    createTime: now,
    updateTime: now
  }

  const result = await db.collection('foods').add({
    data: foodData
  })

  return {
    success: true,
    data: {
      _id: result._id
    },
    message: '创建成功'
  }
}

async function updateFood(id, data) {
  if (!id) {
    return {
      success: false,
      message: '缺少美食ID'
    }
  }

  const updateData = { ...data }
  delete updateData._id
  delete updateData.createTime
  updateData.updateTime = new Date()

  await db.collection('foods').doc(id).update({
    data: updateData
  })

  return {
    success: true,
    message: '更新成功'
  }
}

async function deleteFood(id) {
  if (!id) {
    return {
      success: false,
      message: '缺少美食ID'
    }
  }

  await db.collection('foods').doc(id).remove()

  return {
    success: true,
    message: '删除成功'
  }
}
