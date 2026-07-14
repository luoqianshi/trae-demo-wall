// 云函数：publishHelp - 发布互助信息
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 更新信用等级
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
  const { type, title, description, community, contact, location } = event

  // 参数校验
  if (!type || !title || !contact) {
    return { success: false, message: '请填写完整信息' }
  }

  try {
    // 防刷：检查1小时内发布次数
    const oneHourAgo = new Date(Date.now() - 3600000)
    const recentCount = await db.collection('help_requests')
      .where({ user_id: openid, create_time: db.command.gte(oneHourAgo) })
      .count()
    if (recentCount.total >= 10) {
      return { success: false, message: '发布过于频繁，请稍后再试' }
    }

    // 获取用户信息（社区和定位）
    const userRes = await db.collection('users').where({ _id: openid }).get()
    const user = userRes.data[0] || {}
    const userCommunity = community || user.community || ''
    const userLocation = location || user.location || null

    // 生成互助编号
    const today = new Date()
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    const countRes = await db.collection('help_requests')
      .where({ help_no: db.RegExp({ regexp: `^HP${dateStr}`, options: 'i' }) })
      .count()
    const help_no = `HP${dateStr}${String(countRes.total + 1).padStart(4, '0')}`

    // 保存互助信息
    await db.collection('help_requests').add({
      data: {
        help_no, user_id: openid, type, title,
        description: description || '',
        community: userCommunity,
        location: userLocation,
        contact, status: '待帮助',
        helper_id: '',
        create_time: db.serverDate(),
        update_time: db.serverDate(),
        complete_time: null
      }
    })

    // 更新用户积分和发布次数
    await db.collection('users').where({ _id: openid }).update({
      data: {
        help_publish_count: db.command.inc(1),
        credit_score: db.command.inc(2),
        update_time: db.serverDate()
      }
    })

    // 记录积分变动
    await db.collection('credit_records').add({
      data: {
        user_id: openid, points_change: 2,
        change_type: '发布互助', related_id: help_no,
        create_time: db.serverDate()
      }
    })

    await updateCreditLevel(openid)
    return { success: true, help_no, message: '发布成功' }
  } catch (err) {
    return { success: false, message: '发布失败：' + err.message }
  }
}
