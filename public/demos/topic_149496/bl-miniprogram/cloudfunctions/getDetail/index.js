// 云函数：getDetail - 查询互助/闲置详情（含距离）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

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
  const { type, id, userLocation } = event

  try {
    let collectionName
    if (type === 'help') collectionName = 'help_requests'
    else if (type === 'idle') collectionName = 'idle_items'
    else return { success: false, message: '类型参数错误' }

    const res = await db.collection(collectionName).where({ _id: id }).get()
    if (res.data.length === 0) {
      return { success: false, message: '记录不存在' }
    }

    const detail = res.data[0]

    if (detail.hidden === true && detail.user_id !== openid) {
      return { success: false, message: '该内容已被发布者隐藏' }
    }

    // 查询发布者信息
    const userRes = await db.collection('users').where({ _id: detail.user_id }).get()
    detail.userInfo = userRes.data[0] || null

    // 计算距离
    let myLocation = userLocation
    if (!myLocation || !myLocation.lat) {
      const myUserRes = await db.collection('users').where({ _id: openid }).get()
      if (myUserRes.data.length > 0 && myUserRes.data[0].location) {
        myLocation = myUserRes.data[0].location
      }
    }
    if (myLocation && myLocation.lat && detail.location && detail.location.lat) {
      detail.distance = calcDistance(myLocation.lat, myLocation.lng, detail.location.lat, detail.location.lng)
    } else {
      detail.distance = null
    }

    return { success: true, detail }
  } catch (err) {
    return { success: false, message: '查询失败：' + err.message }
  }
}
