// 云函数：markRead - 标记消息已读
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { sessionId } = event

  if (!sessionId) {
    return { success: false, message: '缺少会话ID' }
  }

  try {
    // 验证会话归属
    const sessionRes = await db.collection('chat_sessions').where({ _id: sessionId }).get()
    if (sessionRes.data.length === 0) {
      return { success: false, message: '会话不存在' }
    }
    const session = sessionRes.data[0]
    if (session.user_a !== openid && session.user_b !== openid) {
      return { success: false, message: '无权操作该会话' }
    }

    // 将该会话中发给当前用户的所有未读消息标记为已读
    await db.collection('chat_messages').where({
      session_id: sessionId,
      to: openid,
      is_read: false
    }).update({
      data: { is_read: true }
    })

    // 重置当前用户的未读数
    const updateData = {}
    if (session.user_a === openid) {
      updateData.unread_a = 0
    } else {
      updateData.unread_b = 0
    }
    await db.collection('chat_sessions').where({ _id: sessionId }).update({ data: updateData })

    return { success: true, message: '已标记已读' }
  } catch (err) {
    return { success: false, message: '操作失败：' + err.message }
  }
}
