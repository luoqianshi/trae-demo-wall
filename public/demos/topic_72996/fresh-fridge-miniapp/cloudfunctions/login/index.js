const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  
  try {
    const userResult = await db.collection('users').where({
      openid: OPENID
    }).get()
    
    let user = null
    
    if (userResult.data.length === 0) {
      const now = new Date()
      const addResult = await db.collection('users').add({
        data: {
          openid: OPENID,
          nickname: '',
          avatarUrl: '',
          gender: 0,
          region: {},
          preferences: {
            tastes: [],
            categories: [],
            notification: true
          },
          tastes: [],
          categories: [],
          notification: true,
          totalSaved: 0,
          totalExpired: 0,
          joinTime: now,
          lastActiveTime: now,
          createTime: now,
          updateTime: now,
          isGuideCompleted: false
        }
      })
      
      user = {
        _id: addResult._id,
        openid: OPENID,
        nickname: '',
        avatarUrl: '',
        gender: 0,
        region: {},
        preferences: {
          tastes: [],
          categories: [],
          notification: true
        },
        tastes: [],
        categories: [],
        notification: true,
        totalSaved: 0,
        totalExpired: 0,
        joinTime: now,
        lastActiveTime: now,
        isGuideCompleted: false
      }
    } else {
      user = userResult.data[0]
      
      await db.collection('users').where({
        openid: OPENID
      }).update({
        data: {
          lastActiveTime: new Date(),
          updateTime: new Date()
        }
      })
      
      user.lastActiveTime = new Date()
    }
    
    return {
      success: true,
      openid: OPENID,
      user: user,
      message: '登录成功'
    }
  } catch (err) {
    return {
      success: false,
      error: err.message,
      message: '登录失败'
    }
  }
}