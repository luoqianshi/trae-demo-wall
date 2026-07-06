const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  
  const { region, categories, tastes } = event
  
  try {
    const userResult = await db.collection('users').where({
      openid: OPENID
    }).get()
    
    if (userResult.data.length === 0) {
      const now = new Date()
      await db.collection('users').add({
        data: {
          openid: OPENID,
          nickname: '',
          avatarUrl: '',
          gender: 0,
          region: region || {},
          preferences: {
            tastes: tastes || [],
            categories: categories || [],
            notification: true
          },
          tastes: tastes || [],
          categories: categories || [],
          notification: true,
          totalSaved: 0,
          totalExpired: 0,
          joinTime: now,
          lastActiveTime: now,
          createTime: now,
          updateTime: now,
          isGuideCompleted: true
        }
      })
      
      return {
        success: true,
        message: '用户偏好保存成功',
        user: {
          openid: OPENID,
          region: region || {},
          tastes: tastes || [],
          categories: categories || [],
          isGuideCompleted: true
        }
      }
    } else {
      await db.collection('users').where({
        openid: OPENID
      }).update({
        data: {
          region: region || userResult.data[0].region,
          tastes: tastes || userResult.data[0].tastes,
          categories: categories || userResult.data[0].categories,
          preferences: {
            tastes: tastes || userResult.data[0].preferences?.tastes || [],
            categories: categories || userResult.data[0].preferences?.categories || [],
            notification: userResult.data[0].preferences?.notification ?? true
          },
          lastActiveTime: new Date(),
          updateTime: new Date(),
          isGuideCompleted: true
        }
      })
      
      return {
        success: true,
        message: '用户偏好更新成功',
        user: {
          ...userResult.data[0],
          region: region || userResult.data[0].region,
          tastes: tastes || userResult.data[0].tastes,
          categories: categories || userResult.data[0].categories,
          isGuideCompleted: true
        }
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err.message,
      message: '保存用户偏好失败'
    }
  }
}