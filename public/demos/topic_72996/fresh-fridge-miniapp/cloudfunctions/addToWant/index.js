const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { foodId } = event

  if (!foodId) {
    return {
      success: false,
      message: '缺少美食ID'
    }
  }

  try {
    const wantRecord = await db.collection('wantList').where({
      openid: OPENID,
      foodId: foodId
    }).get()

    if (wantRecord.data.length > 0) {
      await db.collection('wantList').doc(wantRecord.data[0]._id).remove()

      await db.collection('foods').doc(foodId).update({
        data: {
          wantCount: _.inc(-1)
        }
      })

      const foodResult = await db.collection('foods').doc(foodId).get()

      return {
        success: true,
        message: '已从想吃清单移除',
        isWanted: false,
        wantCount: foodResult.data.wantCount || 0
      }
    }

    await db.collection('wantList').add({
      data: {
        openid: OPENID,
        foodId: foodId,
        createTime: new Date()
      }
    })

    await db.collection('foods').doc(foodId).update({
      data: {
        wantCount: _.inc(1)
      }
    })

    const foodResult = await db.collection('foods').doc(foodId).get()

    return {
      success: true,
      message: '已加入想吃清单',
      isWanted: true,
      wantCount: foodResult.data.wantCount || 0
    }
  } catch (err) {
    return {
      success: false,
      error: err.message,
      message: '操作失败'
    }
  }
}
