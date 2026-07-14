// 云函数：getChatList - 获取聊天会话列表
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 查询当前用户参与的所有会话
    const sessionRes = await db.collection('chat_sessions')
      .where(_.or([
        { user_a: openid },
        { user_b: openid }
      ]))
      .orderBy('last_time', 'desc')
      .limit(50)
      .get()

    const sessions = sessionRes.data

    // 收集所有对方用户ID
    const otherUserIds = sessions.map(s => s.user_a === openid ? s.user_b : s.user_a)
    const uniqueIds = [...new Set(otherUserIds)]

    // 批量查询用户信息
    const usersMap = {}
    if (uniqueIds.length > 0) {
      const usersRes = await db.collection('users').where({ _id: _.in(uniqueIds) }).get()
      usersRes.data.forEach(u => { usersMap[u._id] = u })
    }

    // 组装返回数据
    const list = sessions.map(s => {
      const otherUserId = s.user_a === openid ? s.user_b : s.user_a
      const otherUser = usersMap[otherUserId] || { _id: otherUserId, nickname: '未知用户', avatar: '' }
      const unread = s.user_a === openid ? s.unread_a : s.unread_b
      return {
        sessionId: s._id,
        otherUser,
        lastMessage: s.last_message,
        lastTime: s.last_time,
        unread: unread || 0,
        createTime: s.create_time,
        itemId: s.item_id || '',
        itemType: s.item_type || '',
        itemTitle: s.item_title || ''
      }
    })

    return {
      success: true,
      list,
      total: list.length
    }
  } catch (err) {
    return { success: false, message: '获取会话列表失败：' + err.message }
  }
}
