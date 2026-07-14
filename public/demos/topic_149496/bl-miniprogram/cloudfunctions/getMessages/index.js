// 云函数：getMessages - 获取聊天消息列表
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { sessionId, page = 1, pageSize = 50 } = event

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
      return { success: false, message: '无权访问该会话' }
    }

    // 查询消息（按时间正序）
    const skip = (page - 1) * pageSize
    const msgRes = await db.collection('chat_messages')
      .where({ session_id: sessionId })
      .orderBy('create_time', 'asc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 查询对方用户信息
    const otherUserId = session.user_a === openid ? session.user_b : session.user_a
    const otherUserRes = await db.collection('users').where({ _id: otherUserId }).get()
    const otherUser = otherUserRes.data[0] || null

    return {
      success: true,
      messages: msgRes.data,
      otherUser,
      session,
      page,
      pageSize,
      hasMore: msgRes.data.length === pageSize
    }
  } catch (err) {
    return { success: false, message: '获取消息失败：' + err.message }
  }
}
