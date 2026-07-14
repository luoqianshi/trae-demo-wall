// 云函数：getUnreadCount - 获取未读消息数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 查询当前用户的所有会话
    const sessionRes = await db.collection('chat_sessions').where(
      _.or([
        { user_a: openid },
        { user_b: openid }
      ])
    ).get()

    let totalUnread = 0
    sessionRes.data.forEach(s => {
      if (s.user_a === openid) {
        totalUnread += s.unread_a || 0
      } else {
        totalUnread += s.unread_b || 0
      }
    })

    return {
      success: true,
      unreadCount: totalUnread,
      sessionCount: sessionRes.data.length
    }
  } catch (err) {
    return { success: false, message: '获取未读数失败：' + err.message }
  }
}
