/**
 * API配置文件
 * 百度OCR文字识别接口配置
 * 
 * 使用说明：
 * 1. 前往 https://cloud.baidu.com/product/ocr 注册百度智能云账号
 * 2. 创建应用，获取 API Key 和 Secret Key
 * 3. 将下面的 YOUR_API_KEY 和 YOUR_SECRET_KEY 替换为你自己的密钥
 * 4. 免费额度：通用文字识别每天可调用1000次，足够日常使用
 */

const config = {
  // 百度OCR API密钥（请替换为你自己的）
  apiKey: 'YOUR_API_KEY',
  secretKey: 'YOUR_SECRET_KEY',

  // 百度OCR接口地址
  tokenUrl: 'https://aip.baidubce.com/oauth/2.0/token',
  ocrUrl: 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic',
}

module.exports = config
