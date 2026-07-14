// 云函数：deleteRecord - 删除发布记录
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { type, id } = event

  try {
    let collectionName
    if (type === 'help') collectionName = 'help_requests'
    else if (type === 'idle') collectionName = 'idle_items'
    else return { success: false, message: '类型参数错误' }

    // 验证所有权
    const res = await db.collection(collectionName).where({ _id: id }).get()
    if (res.data.length === 0) {
      return { success: false, message: '记录不存在' }
    }
    if (res.data[0].user_id !== openid) {
      return { success: false, message: '无权删除他人记录' }
    }

    await db.collection(collectionName).where({ _id: id }).remove()
    return { success: true, message: '删除成功' }
  } catch (err) {
    return { success: false, message: '删除失败：' + err.message }
  }
}
