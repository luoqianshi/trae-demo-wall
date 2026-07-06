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
    const favoriteRecord = await db.collection('favorites').where({
      openid: OPENID,
      foodId: foodId
    }).get()

    if (favoriteRecord.data.length > 0) {
      await db.collection('favorites').doc(favoriteRecord.data[0]._id).remove()

      await db.collection('foods').doc(foodId).update({
        data: {
          favoriteCount: _.inc(-1)
        }
      })

      const foodResult = await db.collection('foods').doc(foodId).get()

      return {
        success: true,
        message: '已取消收藏',
        isFavorited: false,
        favoriteCount: foodResult.data.favoriteCount || 0
      }
    }

    await db.collection('favorites').add({
      data: {
        openid: OPENID,
        foodId: foodId,
        createTime: new Date()
      }
    })

    await db.collection('foods').doc(foodId).update({
      data: {
        favoriteCount: _.inc(1)
      }
    })

    const foodResult = await db.collection('foods').doc(foodId).get()

    return {
      success: true,
      message: '收藏成功',
      isFavorited: true,
      favoriteCount: foodResult.data.favoriteCount || 0
    }
  } catch (err) {
    return {
      success: false,
      error: err.message,
      message: '操作失败'
    }
  }
}
