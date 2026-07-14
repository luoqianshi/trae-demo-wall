// 云函数：getList - 基于距离查询互助/闲置列表
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// Haversine距离计算（公里）
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { type, status, page = 1, pageSize = 10, sortBy, helpType, category, keyword, maxDistance = 10, userLocation } = event

  try {
    let collectionName, query = {}

    if (type === 'help') {
      collectionName = 'help_requests'
      if (helpType) query.type = helpType
    } else if (type === 'idle') {
      collectionName = 'idle_items'
      if (category) query.category = category
    } else {
      return { success: false, message: '类型参数错误' }
    }

    if (status) query.status = status
    // 过滤掉已隐藏的记录（他人不可见）
    query.hidden = _.neq(true)
    if (keyword) {
      const searchField = type === 'help' ? 'title' : 'name'
      query[searchField] = db.RegExp({ regexp: keyword, options: 'i' })
    }

    // 获取查询位置：优先使用传入的userLocation，否则从用户记录获取
    let myLocation = userLocation
    if (!myLocation || !myLocation.lat) {
      const userRes = await db.collection('users').where({ _id: openid }).get()
      if (userRes.data.length > 0 && userRes.data[0].location) {
        myLocation = userRes.data[0].location
      }
    }

    const collection = db.collection(collectionName)

    // 查询所有匹配条件的记录（需要计算距离）
    // 先查较多数量，计算距离后过滤再分页
    const fetchLimit = Math.min(pageSize * 5 * page, 200)
    const listRes = await collection
      .where(query)
      .orderBy('create_time', 'desc')
      .limit(fetchLimit)
      .get()

    let list = listRes.data

    // 计算距离并过滤
    if (myLocation && myLocation.lat && myLocation.lng) {
      list = list.map(item => {
        let distance = null
        if (item.location && item.location.lat && item.location.lng) {
          distance = calcDistance(myLocation.lat, myLocation.lng, item.location.lat, item.location.lng)
        }
        return { ...item, distance }
      })
      // 过滤掉超过最大距离的（但保留没有位置的记录）
      list = list.filter(item => item.distance === null || item.distance <= maxDistance)
    } else {
      list = list.map(item => ({ ...item, distance: null }))
    }

    // 排序：闲置支持价格排序，否则按距离排序（距离近的优先，无距离的排后）
    if (type === 'idle' && sortBy === 'priceAsc') {
      list.sort((a, b) => a.price - b.price)
    } else if (type === 'idle' && sortBy === 'priceDesc') {
      list.sort((a, b) => b.price - a.price)
    } else {
      // 按距离排序（null排最后），距离相同按时间倒序
      list.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0
        if (a.distance === null) return 1
        if (b.distance === null) return -1
        return a.distance - b.distance
      })
    }

    const total = list.length
    // 分页
    const paged = list.slice((page - 1) * pageSize, page * pageSize)

    // 查询发布者信息
    const userIds = [...new Set(paged.map(item => item.user_id))]
    const usersMap = {}
    if (userIds.length > 0) {
      const usersRes = await db.collection('users').where({ _id: _.in(userIds) }).get()
      usersRes.data.forEach(u => { usersMap[u._id] = u })
    }
    paged.forEach(item => {
      item.userInfo = usersMap[item.user_id] || null
    })

    return {
      success: true,
      list: paged,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total
    }
  } catch (err) {
    return { success: false, message: '查询失败：' + err.message }
  }
}
