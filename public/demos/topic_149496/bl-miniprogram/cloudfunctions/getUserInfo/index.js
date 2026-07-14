// 云函数：getUserInfo - 获取用户信息及发布记录
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = event.openid || wxContext.OPENID

  try {
    // 获取用户信息
    const userRes = await db.collection('users').where({ _id: openid }).get()
    if (userRes.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }
    const user = userRes.data[0]

    // 获取发布记录
    const helpRes = await db.collection('help_requests')
      .where({ user_id: openid })
      .orderBy('create_time', 'desc')
      .limit(50)
      .get()

    const idleRes = await db.collection('idle_items')
      .where({ user_id: openid })
      .orderBy('create_time', 'desc')
      .limit(50)
      .get()

    // 获取积分记录
    const creditRes = await db.collection('credit_records')
      .where({ user_id: openid })
      .orderBy('create_time', 'desc')
      .limit(50)
      .get()

    return {
      success: true,
      user,
      helpRecords: helpRes.data,
      idleRecords: idleRes.data,
      creditRecords: creditRes.data
    }
  } catch (err) {
    return { success: false, message: '获取失败：' + err.message }
  }
}
