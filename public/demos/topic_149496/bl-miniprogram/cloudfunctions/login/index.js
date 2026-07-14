// 云函数：login - 用户登录（先查询，新用户需完善信息后创建）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { nickname, avatar, community, location } = event

  try {
    const userRes = await db.collection('users').where({ _id: openid }).get()

    if (userRes.data.length > 0) {
      // 老用户，直接返回，不更新
      return { success: true, isNewUser: false, user: userRes.data[0] }
    }

    // 新用户：未提供完整信息时，返回需要注册
    if (!community || !location) {
      return { success: true, isNewUser: true, needRegister: true }
    }

    // 创建新用户
    const newUser = {
      _id: openid,
      nickname: nickname || '邻居' + openid.slice(-6),
      avatar: avatar || '',
      community: community,
      location: location,
      location_time: db.serverDate(),
      help_count: 0,
      trade_count: 0,
      help_publish_count: 0,
      trade_publish_count: 0,
      credit_score: 0,
      credit_level: '新邻居',
      create_time: db.serverDate(),
      update_time: db.serverDate()
    }
    await db.collection('users').add({ data: newUser })
    return { success: true, isNewUser: true, user: newUser }
  } catch (err) {
    return { success: false, message: '登录失败：' + err.message }
  }
}
