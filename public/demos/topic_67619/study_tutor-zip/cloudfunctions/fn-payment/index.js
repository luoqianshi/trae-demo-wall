const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  // W1 stub: W2 替换为真实微信支付下单 + 回调验签
  console.log('[payment] stub called with', event)
  return {
    ok: false,
    error: 'payment not enabled in W1',
    stub: true
  }
}
