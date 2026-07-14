// 云函数：updateProfile - 更新个人信息（含定位）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { nickname, community, location } = event

  try {
    const updateData = { update_time: db.serverDate() }
    if (nickname !== undefined) updateData.nickname = nickname
    if (community !== undefined) updateData.community = community
    if (location && location.lat && location.lng) {
      updateData.location = location
      updateData.location_time = db.serverDate()
    }

    await db.collection('users').where({ _id: openid }).update({ data: updateData })

    const res = await db.collection('users').where({ _id: openid }).get()
    return { success: true, user: res.data[0], message: '更新成功' }
  } catch (err) {
    return { success: false, message: '更新失败：' + err.message }
  }
}
