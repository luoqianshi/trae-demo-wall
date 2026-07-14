// 云函数：completeHelp - 完成互助
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
  const { id, helperId } = event

  try {
    const res = await db.collection('help_requests').where({ _id: id }).get()
    if (res.data.length === 0) {
      return { success: false, message: '互助信息不存在' }
    }
    const help = res.data[0]

    // 只有发布者可以标记完成
    if (help.user_id !== openid) {
      return { success: false, message: '只有发布者可以标记完成' }
    }
    if (help.status === '已完成') {
      return { success: false, message: '该互助已完成' }
    }

    // 更新互助状态
    await db.collection('help_requests').where({ _id: id }).update({
      data: {
        status: '已完成',
        helper_id: helperId || help.helper_id || '',
        complete_time: db.serverDate(),
        update_time: db.serverDate()
      }
    })

    // 发布者（求助者）+5积分，互助次数+1
    await db.collection('users').where({ _id: openid }).update({
      data: {
        help_count: db.command.inc(1),
        credit_score: db.command.inc(5),
        update_time: db.serverDate()
      }
    })
    await db.collection('credit_records').add({
      data: { user_id: openid, points_change: 5, change_type: '完成互助求助者', related_id: id, create_time: db.serverDate() }
    })
    await updateCreditLevel(openid)

    // 帮助者+10积分，互助次数+1
    const finalHelperId = helperId || help.helper_id
    if (finalHelperId && finalHelperId !== openid) {
      await db.collection('users').where({ _id: finalHelperId }).update({
        data: {
          help_count: db.command.inc(1),
          credit_score: db.command.inc(10),
          update_time: db.serverDate()
        }
      })
      await db.collection('credit_records').add({
        data: { user_id: finalHelperId, points_change: 10, change_type: '完成互助帮助者', related_id: id, create_time: db.serverDate() }
      })
      await updateCreditLevel(finalHelperId)
    }

    return { success: true, message: '互助已完成' }
  } catch (err) {
    return { success: false, message: '操作失败：' + err.message }
  }
}
