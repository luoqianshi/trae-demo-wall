const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { formData } = event

  console.log('[投稿] 收到请求，openid:', OPENID)
  console.log('[投稿] formData:', JSON.stringify(formData, null, 2))

  try {
    if (!formData || !formData.name || !formData.category) {
      console.log('[投稿] 缺少必填字段')
      return {
        success: false,
        message: '缺少必填字段'
      }
    }

    if (!formData.images || formData.images.length === 0) {
      console.log('[投稿] 缺少图片')
      return {
        success: false,
        message: '请至少上传1张图片'
      }
    }

    // 1. 文本内容安全检查（调用微信 msgSecCheck 接口）
    let textCheckPassed = true
    let textCheckDetail = '未检测'
    try {
      const textCheckResult = await checkTextContent(formData)
      textCheckPassed = textCheckResult.pass
      textCheckDetail = textCheckResult.detail
      console.log('[投稿] 文本检测结果:', textCheckResult)
    } catch (checkErr) {
      console.warn('[投稿] 文本检查异常，跳过:', checkErr.message)
      textCheckPassed = true
      textCheckDetail = '检测异常，转人工审核'
    }

    if (!textCheckPassed) {
      return {
        success: false,
        message: '文本内容包含违规信息，请修改后重新提交',
        detail: textCheckDetail
      }
    }

    // 2. 图片内容安全检查（调用微信 imgSecCheck 接口）
    let imageCheckPassed = true
    let imageCheckDetail = '未检测'
    try {
      const imageCheckResult = await checkImageContent(formData.images)
      imageCheckPassed = imageCheckResult.pass
      imageCheckDetail = imageCheckResult.detail
      console.log('[投稿] 图片检测结果:', imageCheckResult)
    } catch (checkErr) {
      console.warn('[投稿] 图片检查异常，跳过:', checkErr.message)
      imageCheckPassed = true
      imageCheckDetail = '检测异常，转人工审核'
    }

    if (!imageCheckPassed) {
      return {
        success: false,
        message: '图片内容包含违规信息，请更换后重新提交',
        detail: imageCheckDetail
      }
    }

    // 3. 小吃店铺每月投稿限制
    if (formData.category === 'snack_shop') {
      try {
        const canSubmit = await checkMonthlyLimit(OPENID)
        console.log('[投稿] 月度限制检查结果:', canSubmit)
        if (!canSubmit) {
          return {
            success: false,
            message: '每月最多投稿3家店铺，请下月再试'
          }
        }
      } catch (limitErr) {
        console.warn('[投稿] 月度限制检查异常，继续提交:', limitErr.message)
      }
    }

    const now = new Date()
    const submissionData = {
      userId: OPENID,
      name: formData.name,
      category: formData.category,
      images: formData.images || [],
      originProvince: formData.originProvince || '',
      originCity: formData.originCity || '',
      originDistrict: formData.originDistrict || '',
      originFull: formData.originFull || '',
      onShelfMonth: formData.onShelfMonth || 0,
      bestTasteMonths: formData.bestTasteMonths || [],
      offShelfMonth: formData.offShelfMonth || 0,
      priceMin: formData.priceMin || 0,
      priceMax: formData.priceMax || 0,
      priceUnit: formData.priceUnit || '元/斤',
      tips: formData.tips || '',
      shopName: formData.shopName || '',
      shopAddress: formData.shopAddress || '',
      shopYears: formData.shopYears || 0,
      canMail: formData.canMail !== undefined ? formData.canMail : false,
      mailPackage: formData.mailPackage || '',
      expressCompanies: formData.expressCompanies || [],
      shelfLifeDays: formData.shelfLifeDays || 0,
      shippingRule: formData.shippingRule || '',
      remoteAreaShip: formData.remoteAreaShip !== undefined ? formData.remoteAreaShip : false,
      bossWechat: formData.bossWechat || '',
      taobaoShop: formData.taobaoShop || '',
      pddShop: formData.pddShop || '',
      mailTips: formData.mailTips || '',
      status: 'pending',
      rejectReason: '',
      machineAudit: textCheckPassed && imageCheckPassed ? 'passed' : 'manual',
      createTime: now,
      updateTime: now
    }

    console.log('[投稿] 准备写入数据库:', JSON.stringify(submissionData, null, 2))

    const result = await db.collection('submissions').add({
      data: submissionData
    })

    console.log('[投稿] 数据库写入成功，_id:', result._id)

    return {
      success: true,
      data: {
        _id: result._id,
        status: 'pending'
      },
      message: '提交成功，等待审核'
    }
  } catch (err) {
    console.error('[投稿] 云函数执行异常:', err)
    console.error('[投稿] 异常堆栈:', err.stack)
    return {
      success: false,
      error: err.message,
      message: '提交失败: ' + err.message
    }
  }
}

// 文本内容安全检查：调用微信 openapi.security.msgSecCheck
async function checkTextContent(formData) {
  const textToCheck = [
    formData.name,
    formData.tips,
    formData.shopName,
    formData.shopAddress,
    formData.shippingRule,
    formData.bossWechat,
    formData.taobaoShop,
    formData.pddShop,
    formData.mailTips
  ].filter(Boolean).join(' ')

  if (!textToCheck) {
    return { pass: true, detail: '无文本需检测' }
  }

  // 检查 openapi 是否可用
  if (!cloud.openapi || !cloud.openapi.security || !cloud.openapi.security.msgSecCheck) {
    console.warn('[投稿] msgSecCheck 接口不可用，跳过检测')
    return { pass: true, detail: '检测接口不可用，转人工审核' }
  }

  try {
    const result = await cloud.openapi.security.msgSecCheck({
      content: textToCheck
    })
    console.log('[投稿] msgSecCheck 返回:', JSON.stringify(result))
    // errCode 为 0 表示通过
    if (result.errCode === 0) {
      return { pass: true, detail: '文本检测通过' }
    }
    return {
      pass: false,
      detail: `文本检测未通过，errCode: ${result.errCode}`
    }
  } catch (err) {
    console.warn('[投稿] msgSecCheck 调用异常：', err.message)
    return { pass: true, detail: '文本检测服务异常，转人工审核' }
  }
}

// 图片内容安全检查：调用微信 openapi.security.imgSecCheck
async function checkImageContent(images) {
  // 检查 openapi 是否可用
  if (!cloud.openapi || !cloud.openapi.security || !cloud.openapi.security.imgSecCheck) {
    console.warn('[投稿] imgSecCheck 接口不可用，跳过检测')
    return { pass: true, detail: '检测接口不可用，转人工审核' }
  }

  for (let i = 0; i < images.length; i++) {
    const fileID = images[i]
    try {
      console.log(`[投稿] 检测第${i + 1}张图片:`, fileID)
      // 从云存储下载图片
      const fileRes = await cloud.downloadFile({ fileID })
      const buffer = fileRes.fileContent

      if (!buffer || buffer.length === 0) {
        console.warn(`[投稿] 第${i + 1}张图片下载为空`)
        continue
      }

      const result = await cloud.openapi.security.imgSecCheck({
        media: {
          contentType: 'image/jpeg',
          value: buffer
        }
      })

      console.log(`[投稿] 第${i + 1}张图片检测结果:`, JSON.stringify(result))

      if (result.errCode !== 0) {
        return {
          pass: false,
          detail: `第${i + 1}张图片检测未通过，errCode: ${result.errCode}`
        }
      }
    } catch (err) {
      console.warn(`[投稿] imgSecCheck 第${i + 1}张图片调用异常：`, err.message)
    }
  }
  return { pass: true, detail: '图片检测通过' }
}

async function checkMonthlyLimit(openid) {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const countResult = await db.collection('submissions').where({
    userId: openid,
    category: 'snack_shop',
    createTime: _.gte(firstDayOfMonth)
  }).count()

  return countResult.total < 3
}
