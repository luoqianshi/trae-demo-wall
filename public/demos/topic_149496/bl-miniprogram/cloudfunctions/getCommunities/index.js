// 云函数：getCommunities - 获取社区列表
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const res = await db.collection('communities').orderBy('sort_order', 'asc').get()
    return { success: true, communities: res.data }
  } catch (err) {
    return { success: false, message: '获取失败：' + err.message }
  }
}
