// 云函数：deleteChatSession - 删除聊天会话及其所有消息
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
    // 验证会话归属（只有会话参与方才能删除）
    const sessionRes = await db.collection('chat_sessions').where({ _id: sessionId }).get()
    if (sessionRes.data.length === 0) {
      return { success: false, message: '会话不存在' }
    }
    const session = sessionRes.data[0]
    if (session.user_a !== openid && session.user_b !== openid) {
      return { success: false, message: '无权删除该会话' }
    }

    // 删除该会话下的所有消息
    const msgCount = await db.collection('chat_messages')
      .where({ session_id: sessionId })
      .count()

    // 云数据库单次最多删除20条，需要循环删除
    let deletedMsgs = 0
    while (true) {
      const batch = await db.collection('chat_messages')
        .where({ session_id: sessionId })
        .limit(20)
        .get()
      if (batch.data.length === 0) break
      const ids = batch.data.map(m => m._id)
      await db.collection('chat_messages')
        .where({ _id: _.in(ids) })
        .remove()
      deletedMsgs += batch.data.length
      if (batch.data.length < 20) break
    }

    // 删除会话本身
    await db.collection('chat_sessions').where({ _id: sessionId }).remove()

    return {
      success: true,
      message: '删除成功',
      deletedMessages: deletedMsgs
    }
  } catch (err) {
    return { success: false, message: '删除失败：' + err.message }
  }
}
