const app = getApp()

function getBaseUrl() {
  return (app.globalData && app.globalData.baseUrl) || 'http://127.0.0.1:8001'
}

function request(options) {
  const {
    url,
    method = 'GET',
    data = {},
    loading = false,
    loadingText = '加载中...'
  } = options

  if (loading) {
    wx.showLoading({
      title: loadingText,
      mask: true
    })
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getBaseUrl()}${url}`,
      method,
      data,
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
          return
        }

        const message = (res.data && (res.data.detail || res.data.message)) || `请求失败 (${res.statusCode})`
        wx.showToast({
          title: message,
          icon: 'none'
        })
        reject(new Error(message))
      },
      fail(err) {
        const message = err.errMsg || '网络连接失败'
        wx.showToast({
          title: message,
          icon: 'none'
        })
        reject(err)
      },
      complete() {
        if (loading) {
          wx.hideLoading()
        }
      }
    })
  })
}

module.exports = {
  request,
  get(url, options = {}) {
    return request({
      ...options,
      url,
      method: 'GET'
    })
  },
  post(url, data, options = {}) {
    return request({
      ...options,
      url,
      method: 'POST',
      data
    })
  }
}
