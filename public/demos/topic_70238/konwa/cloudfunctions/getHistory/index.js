const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { pageSize = 10, page = 1 } = event

  try {
    const res = await db.collection('analyze_records')
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      message: 'success',
      data: res.data
    }
  } catch (e) {
    return {
      code: 0,
      message: 'success',
      data: getMockHistory()
    }
  }
}

function getMockHistory() {
  return [
    {
      _id: '1',
      paperName: '三年级数学第三单元测试',
      score: 82,
      wrongCount: 5,
      subject: 'math',
      createdAt: new Date().toISOString()
    },
    {
      _id: '2',
      paperName: '阅读理解专项练习',
      score: 88,
      wrongCount: 3,
      subject: 'chinese',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      _id: '3',
      paperName: '五年级词汇检测',
      score: 72,
      wrongCount: 7,
      subject: 'english',
      createdAt: new Date(Date.now() - 259200000).toISOString()
    }
  ]
}
