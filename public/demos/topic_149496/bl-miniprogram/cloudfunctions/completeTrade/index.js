// 云函数：completeTrade - 完成交易
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

async function updateCreditLevel(user_id) {
  const userRes = await db.collection('users').where({ _id: user_id }).get()
  if (userRes.data.length === 0) return
  const user = userRes.data[0]
  let credit_level = '新邻居'
  if (user.credit_score >= 501) credit_level = '社区之星'
  else if (user.credit_score >= 201) credit_level = '邻里达人'
  else if (user.credit_score >= 101) credit_level = '活跃邻居'
  else if (user.credit_score >= 51) credit_level = '热心邻居'
  await db.collection('users').where({ _id: user_id }).update({ data: { credit_level } })
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { id, buyerId } = event

  try {
    const res = await db.collection('idle_items').where({ _id: id }).get()
    if (res.data.length === 0) {
      return { success: false, message: '物品不存在' }
    }
    const item = res.data[0]

    if (item.user_id !== openid) {
      return { success: false, message: '只有卖家可以标记完成' }
    }
    if (item.status === '已出售') {
      return { success: false, message: '该物品已出售' }
    }

    await db.collection('idle_items').where({ _id: id }).update({
      data: {
        status: '已出售',
        buyer_id: buyerId || item.buyer_id || '',
        complete_time: db.serverDate(),
        update_time: db.serverDate()
      }
    })

    // 卖家+10积分，交易次数+1
    await db.collection('users').where({ _id: openid }).update({
      data: {
        trade_count: db.command.inc(1),
        credit_score: db.command.inc(10),
        update_time: db.serverDate()
      }
    })
    await db.collection('credit_records').add({
      data: { user_id: openid, points_change: 10, change_type: '完成交易卖家', related_id: id, create_time: db.serverDate() }
    })
    await updateCreditLevel(openid)

    // 买家+5积分
    const finalBuyerId = buyerId || item.buyer_id
    if (finalBuyerId && finalBuyerId !== openid) {
      await db.collection('users').where({ _id: finalBuyerId }).update({
        data: {
          trade_count: db.command.inc(1),
          credit_score: db.command.inc(5),
          update_time: db.serverDate()
        }
      })
      await db.collection('credit_records').add({
        data: { user_id: finalBuyerId, points_change: 5, change_type: '完成交易买家', related_id: id, create_time: db.serverDate() }
      })
      await updateCreditLevel(finalBuyerId)
    }

    return { success: true, message: '交易已完成' }
  } catch (err) {
    return { success: false, message: '操作失败：' + err.message }
  }
}
