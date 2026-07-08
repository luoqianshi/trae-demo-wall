const { getMockResult, getMockOverview } = require('./mockData.js')

function callCloudFunction(name, data = {}) {
  return new Promise((resolve, reject) => {
    if (!wx.cloud) {
      console.warn('云开发未初始化，使用Mock数据')
      setTimeout(() => {
        resolve(getMockResponse(name, data))
      }, 800)
      return
    }

    wx.cloud.callFunction({
      name: name,
      data: data,
      success: (res) => {
        if (res.result && res.result.code === 0) {
          resolve(res.result.data)
        } else {
          resolve(getMockResponse(name, data))
        }
      },
      fail: (err) => {
        console.warn('云函数调用失败，使用Mock数据:', err)
        setTimeout(() => {
          resolve(getMockResponse(name, data))
        }, 500)
      }
    })
  })
}

function getMockResponse(name, data) {
  switch (name) {
    case 'analyzePaper':
      return getMockResult()
    case 'getHistory':
      return getMockOverview().history
    default:
      return null
  }
}

function analyzePaper(imageUrl, grade, subject) {
  return callCloudFunction('analyzePaper', { imageUrl, grade, subject })
}

function getHistoryList(page, pageSize) {
  return callCloudFunction('getHistory', { page, pageSize })
}

module.exports = {
  analyzePaper,
  getHistoryList,
  callCloudFunction
}
