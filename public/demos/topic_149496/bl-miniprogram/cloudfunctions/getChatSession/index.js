// 云函数：getChatSession - 获取或创建聊天会话（按发布信息区分）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { toUserId, itemId, itemType, itemTitle } = event

  if (!toUserId) {
    return { success: false, message: '缺少对方用户ID' }
  }

  if (toUserId === openid) {
    return { success: false, message: '不能和自己聊天' }
  }

  try {
    // 查找已有会话（按 item_id 区分不同信息）
    let query = _.or([
      { user_a: openid, user_b: toUserId },
      { user_a: toUserId, user_b: openid }
    ])

    if (itemId) {
      query = _.and([query, { item_id: itemId }])
    }

    const existRes = await db.collection('chat_sessions').where(query).get()

    let session
    if (existRes.data.length > 0) {
      session = existRes.data[0]
    } else {
      // 创建新会话
      const newSessionData = {
        user_a: openid,
        user_b: toUserId,
        last_message: '',
        last_time: db.serverDate(),
        unread_a: 0,
        unread_b: 0,
        create_time: db.serverDate(),
        update_time: db.serverDate()
      }
      if (itemId) {
        newSessionData.item_id = itemId
        newSessionData.item_type = itemType || ''
        newSessionData.item_title = itemTitle || ''
      }
      const newRes = await db.collection('chat_sessions').add({ data: newSessionData })
      session = {
        _id: newRes._id,
        ...newSessionData,
        last_time: new Date()
      }
    }

    // 查询对方用户信息
    const otherUserRes = await db.collection('users').where({ _id: toUserId }).get()
    const otherUser = otherUserRes.data[0] || null

    return {
      success: true,
      session,
      otherUser,
      sessionId: session._id
    }
  } catch (err) {
    return { success: false, message: '获取会话失败：' + err.message }
  }
}
