// 云函数入口文件
// 功能：接收小程序端传来的云存储文件ID，下载图片后调用百度OCR识别文字
// 云函数不受小程序5MB调用限制，可以处理大图片

const request = require('request-promise')
const cloud = require('wx-server-sdk')

// 百度OCR配置（在这里填写你的密钥）
const BAIDU_OCR = {
  API_KEY: 'YOUR_API_KEY',       // 替换为你的百度API Key
  SECRET_KEY: 'YOUR_SECRET_KEY',  // 替换为你的百度Secret Key
  TOKEN_URL: 'https://aip.baidubce.com/oauth/2.0/token',
  OCR_URL: 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic'
}

// 缓存token
let cachedToken = ''
let tokenExpireTime = 0

// 获取access_token
async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpireTime) {
    return cachedToken
  }
  const options = {
    method: 'POST',
    uri: BAIDU_OCR.TOKEN_URL,
    form: {
      grant_type: 'client_credentials',
      client_id: BAIDU_OCR.API_KEY,
      client_secret: BAIDU_OCR.SECRET_KEY
    },
    json: true
  }
  const response = await request(options)
  if (response.access_token) {
    cachedToken = response.access_token
    tokenExpireTime = Date.now() + (response.expires_in - 86400) * 1000
    return cachedToken
  } else {
    throw new Error('获取token失败: ' + JSON.stringify(response))
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { fileID } = event

  if (!fileID) {
    return { success: false, error: '未接收到图片文件ID' }
  }

  try {
    // 初始化云开发
    cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

    // 1. 从云存储下载图片
    const downloadResult = await cloud.downloadFile({
      fileID: fileID
    })
    const imageBuffer = downloadResult.fileContent

    // 2. 转为base64
    const base64Data = imageBuffer.toString('base64')

    // 3. 获取access_token
    const token = await getAccessToken()

    // 4. 调用百度OCR
    const ocrOptions = {
      method: 'POST',
      uri: BAIDU_OCR.OCR_URL + '?access_token=' + token,
      form: {
        image: base64Data,
        language_type: 'CHN_ENG'
      },
      json: true
    }

    const ocrResult = await request(ocrOptions)

    // 5. 删除云存储中的临时文件（清理）
    try {
      await cloud.deleteFile({ fileList: [fileID] })
    } catch (e) {
      // 清理失败不影响主流程
    }

    if (ocrResult.words_result) {
      const textLines = ocrResult.words_result.map(item => item.words)
      return {
        success: true,
        textLines: textLines,
        count: textLines.length
      }
    } else {
      return {
        success: false,
        error: 'OCR识别失败: ' + JSON.stringify(ocrResult)
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || '云函数调用失败'
    }
  }
}
