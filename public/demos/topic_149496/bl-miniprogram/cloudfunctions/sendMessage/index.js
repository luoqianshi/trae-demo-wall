// 云函数：sendMessage - 发送聊天消息
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { sessionId, toUserId, content, messageType = 'text', itemId, itemType, itemTitle } = event

  if (!toUserId || !content) {
    return { success: false, message: '参数不完整' }
  }

  if (toUserId === openid) {
    return { success: false, message: '不能给自己发消息' }
  }

  try {
    let finalSessionId = sessionId

    // 如果没有 sessionId，查找或创建会话
    if (!finalSessionId) {
      let query = db.command.or([
        { user_a: openid, user_b: toUserId },
        { user_a: toUserId, user_b: openid }
      ])
      if (itemId) {
        query = db.command.and([query, { item_id: itemId }])
      }

      const existSession = await db.collection('chat_sessions').where(query).get()

      if (existSession.data.length > 0) {
        finalSessionId = existSession.data[0]._id
      } else {
        const newSessionData = {
          user_a: openid,
          user_b: toUserId,
          last_message: content,
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
        const newSession = await db.collection('chat_sessions').add({ data: newSessionData })
        finalSessionId = newSession._id
      }
    }

    // 保存消息
    const msgRes = await db.collection('chat_messages').add({
      data: {
        session_id: finalSessionId,
        from: openid,
        to: toUserId,
        content,
        message_type: messageType,
        is_read: false,
        create_time: db.serverDate()
      }
    })

    // 更新会话最后消息和未读数
    const sessionRes = await db.collection('chat_sessions').where({ _id: finalSessionId }).get()
    if (sessionRes.data.length > 0) {
      const session = sessionRes.data[0]
      const updateData = {
        last_message: content,
        last_time: db.serverDate(),
        update_time: db.serverDate()
      }
      // 给接收方增加未读数
      if (session.user_a === toUserId) {
        updateData.unread_a = db.command.inc(1)
      } else if (session.user_b === toUserId) {
        updateData.unread_b = db.command.inc(1)
      }
      await db.collection('chat_sessions').where({ _id: finalSessionId }).update({ data: updateData })
    }

    return {
      success: true,
      message: '发送成功',
      msgId: msgRes._id,
      sessionId: finalSessionId
    }
  } catch (err) {
    return { success: false, message: '发送失败：' + err.message }
  }
}
