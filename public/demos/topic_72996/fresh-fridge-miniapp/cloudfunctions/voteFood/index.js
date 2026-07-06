const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { foodId, voteType } = event

  if (!foodId) {
    return {
      success: false,
      message: '缺少美食ID'
    }
  }

  const today = new Date()
  const dateStr = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()

  try {
    const voteRecord = await db.collection('voteRecords').where({
      openid: OPENID,
      foodId: foodId,
      voteDate: dateStr
    }).get()

    if (voteRecord.data.length > 0) {
      return {
        success: false,
        message: '今天已经投过票了',
        hasVoted: true
      }
    }

    const updateData = {
      voteCount: _.inc(1),
      hotScore: _.inc(1)
    }

    if (voteType === 'mail') {
      updateData.mailVoteCount = _.inc(1)
    }

    await db.collection('foods').doc(foodId).update({
      data: updateData
    })

    await db.collection('voteRecords').add({
      data: {
        openid: OPENID,
        foodId: foodId,
        voteType: voteType || 'general',
        voteDate: dateStr,
        createTime: new Date()
      }
    })

    const foodResult = await db.collection('foods').doc(foodId).get()

    return {
      success: true,
      message: '投票成功',
      voteCount: foodResult.data.voteCount || 0,
      mailVoteCount: foodResult.data.mailVoteCount || 0,
      hasVoted: true
    }
  } catch (err) {
    return {
      success: false,
      error: err.message,
      message: '投票失败'
    }
  }
}
