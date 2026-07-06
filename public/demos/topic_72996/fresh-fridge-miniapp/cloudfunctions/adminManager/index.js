const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const MAX_LIMIT = 100

// 管理员 openid 列表（在此硬编码配置）
const ADMIN_OPENIDS = [
  'admin_openid_placeholder_1',
  'admin_openid_placeholder_2'
]

const PAGE_SIZE = 20

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action } = event

  try {
    // checkAdmin 不需要预先鉴权
    if (action === 'checkAdmin') {
      return checkAdmin(OPENID)
    }

    // 其余操作均需管理员权限
    if (ADMIN_OPENIDS.indexOf(OPENID) === -1) {
      return {
        success: false,
        message: '无管理员权限',
        code: 'NO_PERMISSION'
      }
    }

    switch (action) {
      case 'auditSubmission':
        return await auditSubmission(event)
      case 'getAuditList':
        return await getAuditList(event)
      case 'getSubmissionDetail':
        return await getSubmissionDetail(event)
      case 'manageFood':
        return await manageFood(event)
      case 'listFoods':
        return await listFoods(event)
      case 'riskControl':
        return await riskControl(event)
      case 'listRiskAccounts':
        return await listRiskAccounts(event)
      case 'getDashboard':
        return await getDashboard(event)
      case 'pushMessage':
        return await pushMessage(event)
      case 'getPushHistory':
        return await getPushHistory(event)
      default:
        return { success: false, message: '不支持的操作类型' }
    }
  } catch (err) {
    console.error('adminManager error:', err)
    return {
      success: false,
      error: err.message,
      message: '操作失败'
    }
  }
}

// ============ 管理员鉴权 ============
function checkAdmin(openid) {
  const isAdmin = ADMIN_OPENIDS.indexOf(openid) > -1
  return {
    success: true,
    isAdmin,
    openid,
    message: isAdmin ? '管理员' : '非管理员'
  }
}

// ============ 内容审核 ============

// 获取待审核列表（投稿 / 纠错）
async function getAuditList(event) {
  const { type = 'all', status = 'pending', page = 1, pageSize = PAGE_SIZE } = event
  const pageNumber = Math.max(parseInt(page, 10) || 1, 1)
  const size = Math.max(parseInt(pageSize, 10) || PAGE_SIZE, 1)

  const where = {}
  if (status) {
    where.status = status
  }
  if (type && type !== 'all') {
    where.submissionType = type
  }

  const countResult = await db.collection('submissions').where(where).count()
  const total = countResult.total

  const listResult = await db.collection('submissions')
    .where(where)
    .orderBy('createTime', 'desc')
    .skip((pageNumber - 1) * size)
    .limit(size)
    .get()

  const list = listResult.data.map(item => ({
    ...item,
    createTimeText: formatTime(item.createTime)
  }))

  return {
    success: true,
    data: {
      list,
      total,
      page: pageNumber,
      pageSize: size,
      hasMore: pageNumber * size < total
    }
  }
}

// 获取投稿详情
async function getSubmissionDetail(event) {
  const { submissionId } = event
  if (!submissionId) {
    return { success: false, message: '缺少投稿ID' }
  }
  const result = await db.collection('submissions').doc(submissionId).get()
  return {
    success: true,
    data: result.data,
    message: '获取详情成功'
  }
}

// 审核投稿：通过 / 驳回
async function auditSubmission(event) {
  const { submissionId, auditAction, rejectReason } = event

  if (!submissionId) {
    return { success: false, message: '缺少投稿ID' }
  }
  if (auditAction !== 'approve' && auditAction !== 'reject') {
    return { success: false, message: '无效的审核操作' }
  }

  const subRes = await db.collection('submissions').doc(submissionId).get()
  const submission = subRes.data

  if (!submission) {
    return { success: false, message: '投稿不存在' }
  }
  if (submission.status !== 'pending') {
    return { success: false, message: '该投稿已审核' }
  }

  const now = new Date()

  if (auditAction === 'reject') {
    await db.collection('submissions').doc(submissionId).update({
      data: {
        status: 'rejected',
        rejectReason: rejectReason || '未填写原因',
        auditTime: now,
        updateTime: now
      }
    })
    return { success: true, message: '已驳回' }
  }

  // 通过：写入 foods 集合并更新 status
  const foodData = {
    name: submission.name,
    category: submission.category,
    images: submission.images || [],
    origin: submission.originFull || '',
    originProvince: submission.originProvince || '',
    originCity: submission.originCity || '',
    originDistrict: submission.originDistrict || '',
    description: submission.tips || '',
    tips: submission.tips || '',
    seasonMonths: submission.bestTasteMonths || [],
    onShelfMonth: submission.onShelfMonth || 0,
    offShelfMonth: submission.offShelfMonth || 0,
    bestTasteMonths: submission.bestTasteMonths || [],
    priceMin: submission.priceMin || 0,
    priceMax: submission.priceMax || 0,
    priceUnit: submission.priceUnit || '元/斤',
    canMail: submission.canMail || false,
    mailPackage: submission.mailPackage || '',
    mailType: submission.mailPackage || '',
    express: (submission.expressCompanies || []).join(','),
    expressCompanies: submission.expressCompanies || [],
    shelfLifeDays: submission.shelfLifeDays || 0,
    shippingFee: 0,
    shippingRule: submission.shippingRule || '',
    remoteArea: submission.remoteAreaShip ? '支持' : '',
    shopName: submission.shopName || '',
    shopAddress: submission.shopAddress || '',
    shopYears: submission.shopYears || 0,
    shopTags: [],
    buyChannels: [],
    mailTips: submission.mailTips || '',
    bossWechat: submission.bossWechat || '',
    taobaoShop: submission.taobaoShop || '',
    pddShop: submission.pddShop || '',
    voteCount: 0,
    mailVoteCount: 0,
    favoriteCount: 0,
    wantCount: 0,
    hotScore: 0,
    status: 'approved',
    isOfficial: false,
    submissionId: submissionId,
    submitUserId: submission.userId,
    createTime: now,
    updateTime: now
  }

  // 纠错类型：更新已有美食而非新增
  if (submission.submissionType === 'correction' && submission.targetFoodId) {
    await db.collection('foods').doc(submission.targetFoodId).update({
      data: {
        ...foodData,
        updateTime: now
      }
    }).catch(() => {})
    await db.collection('submissions').doc(submissionId).update({
      data: {
        status: 'approved',
        rejectReason: '',
        auditTime: now,
        updateTime: now
      }
    })
    return { success: true, message: '纠错信息已应用', data: { foodId: submission.targetFoodId } }
  }

  const addResult = await db.collection('foods').add({ data: foodData })

  await db.collection('submissions').doc(submissionId).update({
    data: {
      status: 'approved',
      rejectReason: '',
      auditTime: now,
      foodId: addResult._id,
      updateTime: now
    }
  })

  return {
    success: true,
    message: '审核通过，已写入美食库',
    data: { foodId: addResult._id }
  }
}

// ============ 美食库管理 ============

async function listFoods(event) {
  const { keyword, category, isOfficial, page = 1, pageSize = PAGE_SIZE } = event
  const pageNumber = Math.max(parseInt(page, 10) || 1, 1)
  const size = Math.max(parseInt(pageSize, 10) || PAGE_SIZE, 1)

  const where = {}
  if (category && category !== 'all') {
    where.category = category
  }
  if (isOfficial !== undefined && isOfficial !== null && isOfficial !== 'all') {
    where.isOfficial = !!isOfficial
  }
  if (keyword) {
    where.name = db.RegExp({ regexp: keyword, options: 'i' })
  }

  const countResult = await db.collection('foods').where(where).count()
  const total = countResult.total

  const listResult = await db.collection('foods')
    .where(where)
    .orderBy('hotScore', 'desc')
    .orderBy('createTime', 'desc')
    .skip((pageNumber - 1) * size)
    .limit(size)
    .get()

  return {
    success: true,
    data: {
      list: listResult.data,
      total,
      page: pageNumber,
      pageSize: size,
      hasMore: pageNumber * size < total
    }
  }
}

async function manageFood(event) {
  const { op, foodId, data, hotScore } = event

  switch (op) {
    case 'create':
      return await createFood(data)
    case 'update':
      return await updateFood(foodId, data)
    case 'delete':
      return await deleteFood(foodId)
    case 'pin':
      return await pinFood(foodId, hotScore)
    default:
      return { success: false, message: '不支持的操作' }
  }
}

async function createFood(data) {
  if (!data || !data.name || !data.category) {
    return { success: false, message: '缺少必填字段' }
  }
  const now = new Date()
  const foodData = {
    name: data.name,
    category: data.category,
    images: data.images || [],
    origin: data.origin || '',
    description: data.description || '',
    tips: data.tips || '',
    seasonMonths: data.seasonMonths || [],
    onShelfMonth: data.onShelfMonth || 0,
    offShelfMonth: data.offShelfMonth || 0,
    bestTasteMonths: data.bestTasteMonths || [],
    priceMin: data.priceMin || 0,
    priceMax: data.priceMax || 0,
    priceUnit: data.priceUnit || '元/斤',
    canMail: data.canMail || false,
    mailType: data.mailType || '',
    shopName: data.shopName || '',
    shopAddress: data.shopAddress || '',
    voteCount: 0,
    mailVoteCount: 0,
    favoriteCount: 0,
    wantCount: 0,
    hotScore: 0,
    status: 'approved',
    isOfficial: true,
    createTime: now,
    updateTime: now
  }
  const result = await db.collection('foods').add({ data: foodData })
  return { success: true, data: { _id: result._id }, message: '新增成功' }
}

async function updateFood(foodId, data) {
  if (!foodId) {
    return { success: false, message: '缺少美食ID' }
  }
  const updateData = { ...data }
  delete updateData._id
  delete updateData.createTime
  updateData.updateTime = new Date()
  await db.collection('foods').doc(foodId).update({ data: updateData })
  return { success: true, message: '更新成功' }
}

async function deleteFood(foodId) {
  if (!foodId) {
    return { success: false, message: '缺少美食ID' }
  }
  await db.collection('foods').doc(foodId).remove()
  return { success: true, message: '删除成功' }
}

// 官方置顶：更新 hotScore
async function pinFood(foodId, hotScore) {
  if (!foodId) {
    return { success: false, message: '缺少美食ID' }
  }
  const score = parseInt(hotScore, 10)
  const updateData = {
    updateTime: new Date()
  }
  if (!isNaN(score)) {
    updateData.hotScore = score
    updateData.isOfficial = true
  } else {
    // 默认置顶：将 hotScore 提升至当前最大值 + 100
    const topRes = await db.collection('foods')
      .orderBy('hotScore', 'desc')
      .limit(1)
      .get()
    const maxScore = (topRes.data[0] && topRes.data[0].hotScore) || 0
    updateData.hotScore = maxScore + 100
    updateData.isOfficial = true
  }
  await db.collection('foods').doc(foodId).update({ data: updateData })
  return { success: true, message: '置顶成功', data: { hotScore: updateData.hotScore } }
}

// ============ 风控管理 ============

// 异常投票账号 + 广告限流账号列表
async function listRiskAccounts(event) {
  const { type = 'abnormalVote', page = 1, pageSize = PAGE_SIZE } = event
  const pageNumber = Math.max(parseInt(page, 10) || 1, 1)
  const size = Math.max(parseInt(pageSize, 10) || PAGE_SIZE, 1)

  if (type === 'abnormalVote') {
    // 每日投票次数过多的账号：单日投票 >= 10 视为异常
    const today = new Date()
    const dateStr = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()

    // 聚合按 openid 分组统计今日投票
    const voteRes = await db.collection('voteRecords')
      .where({ voteDate: dateStr })
      .limit(MAX_LIMIT)
      .get()

    const countMap = {}
    voteRes.data.forEach(item => {
      countMap[item.openid] = (countMap[item.openid] || 0) + 1
    })

    const abnormalOpenids = Object.keys(countMap).filter(o => countMap[o] >= 10)
    const list = abnormalOpenids.map(o => ({
      openid: o,
      todayVoteCount: countMap[o],
      isAbnormal: true
    })).sort((a, b) => b.todayVoteCount - a.todayVoteCount)

    const total = list.length
    const paged = list.slice((pageNumber - 1) * size, pageNumber * size)

    // 补充用户信息 + 是否封禁
    const enriched = await enrichUsers(paged)

    return {
      success: true,
      data: {
        list: enriched,
        total,
        page: pageNumber,
        pageSize: size,
        hasMore: pageNumber * size < total,
        threshold: 10
      }
    }
  }

  if (type === 'adLimited') {
    // 广告账号限流列表
    const where = { isAdLimited: true }
    const countResult = await db.collection('users').where(where).count()
    const total = countResult.total

    const listResult = await db.collection('users')
      .where(where)
      .orderBy('updateTime', 'desc')
      .skip((pageNumber - 1) * size)
      .limit(size)
      .get()

    const list = listResult.data.map(u => ({
      openid: u.openid,
      nickname: u.nickname || '',
      avatarUrl: u.avatarUrl || '',
      isAdLimited: true,
      isBanned: !!u.isBanned,
      adReason: u.adReason || '',
      limitTime: u.limitTime || null
    }))

    return {
      success: true,
      data: {
        list,
        total,
        page: pageNumber,
        pageSize: size,
        hasMore: pageNumber * size < total
      }
    }
  }

  return { success: false, message: '未知的风控类型' }
}

async function enrichUsers(list) {
  if (!list.length) return list
  const openids = list.map(i => i.openid)
  // 分批查询用户信息
  const result = []
  for (let i = 0; i < openids.length; i += MAX_LIMIT) {
    const batch = openids.slice(i, i + MAX_LIMIT)
    const res = await db.collection('users').where({ openid: _.in(batch) }).get()
    res.data.forEach(u => {
      const item = list.find(it => it.openid === u.openid)
      if (item) {
        item.nickname = u.nickname || ''
        item.avatarUrl = u.avatarUrl || ''
        item.isBanned = !!u.isBanned
        item.totalVoteCount = u.totalSaved || 0
      }
    })
  }
  return list
}

async function riskControl(event) {
  const { op, openid, days } = event
  if (!openid) {
    return { success: false, message: '缺少账号 openid' }
  }

  switch (op) {
    case 'ban':
      return await banAccount(openid, event.reason)
    case 'unban':
      return await unbanAccount(openid)
    case 'limitAd':
      return await limitAdAccount(openid, event.reason)
    case 'unlimitAd':
      return await unlimitAdAccount(openid)
    case 'cleanVotes':
      return await cleanAbnormalVotes(openid, days)
    default:
      return { success: false, message: '不支持的风控操作' }
  }
}

async function banAccount(openid, reason) {
  const now = new Date()
  await db.collection('users').where({ openid }).update({
    data: {
      isBanned: true,
      banReason: reason || '管理员封禁',
      banTime: now,
      updateTime: now
    }
  }).catch(() => {})
  return { success: true, message: '账号已封禁' }
}

async function unbanAccount(openid) {
  const now = new Date()
  await db.collection('users').where({ openid }).update({
    data: {
      isBanned: false,
      banReason: '',
      banTime: null,
      updateTime: now
    }
  }).catch(() => {})
  return { success: true, message: '账号已解封' }
}

async function limitAdAccount(openid, reason) {
  const now = new Date()
  await db.collection('users').where({ openid }).update({
    data: {
      isAdLimited: true,
      adReason: reason || '广告账号限流',
      limitTime: now,
      updateTime: now
    }
  }).catch(() => {})
  return { success: true, message: '已加入限流列表' }
}

async function unlimitAdAccount(openid) {
  const now = new Date()
  await db.collection('users').where({ openid }).update({
    data: {
      isAdLimited: false,
      adReason: '',
      limitTime: null,
      updateTime: now
    }
  }).catch(() => {})
  return { success: true, message: '已移出限流列表' }
}

// 清理异常票数：删除该账号在指定天数内的投票记录，并扣减对应美食票数
async function cleanAbnormalVotes(openid, days = 7) {
  const now = new Date()
  const startDate = new Date(now.getTime() - parseInt(days, 10) * 24 * 60 * 60 * 1000)

  const records = await db.collection('voteRecords').where({
    openid: openid,
    createTime: _.gte(startDate)
  }).limit(MAX_LIMIT).get()

  if (records.data.length === 0) {
    return { success: true, message: '无可清理的异常票数', data: { cleaned: 0 } }
  }

  // 按美食聚合扣减
  const foodCountMap = {}
  records.data.forEach(r => {
    foodCountMap[r.foodId] = (foodCountMap[r.foodId] || 0) + 1
  })

  for (const foodId of Object.keys(foodCountMap)) {
    const dec = foodCountMap[foodId]
    await db.collection('foods').doc(foodId).update({
      data: {
        voteCount: _.inc(-dec),
        hotScore: _.inc(-dec),
        updateTime: now
      }
    }).catch(() => {})
  }

  // 删除异常投票记录
  const ids = records.data.map(r => r._id)
  for (let i = 0; i < ids.length; i += MAX_LIMIT) {
    const batch = ids.slice(i, i + MAX_LIMIT)
    await db.collection('voteRecords').where({ _id: _.in(batch) }).remove()
  }

  return {
    success: true,
    message: `已清理 ${records.data.length} 条异常票数`,
    data: { cleaned: records.data.length }
  }
}

// ============ 数据看板 ============

async function getDashboard(event) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // 并发获取核心数据
  const [
    totalUsersRes,
    todayNewUsersRes,
    totalSubmissionsRes,
    pendingSubmissionsRes,
    totalFoodsRes,
    totalFridgeRes,
    expiredFridgeRes
  ] = await Promise.all([
    db.collection('users').count(),
    db.collection('users').where({ createTime: _.gte(todayStart) }).count(),
    db.collection('submissions').count(),
    db.collection('submissions').where({ status: 'pending' }).count(),
    db.collection('foods').where({ status: 'approved' }).count(),
    db.collection('fridge').count(),
    db.collection('fridge').where({ isExpired: true }).count()
  ])

  // 投稿量趋势（近7天）
  const trend = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dayStart0 = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate())
    const dayEnd = new Date(dayStart0.getTime() + 24 * 60 * 60 * 1000)
    const dayRes = await db.collection('submissions').where({
      createTime: _.gte(dayStart0).and(_.lt(dayEnd))
    }).count()
    trend.push({
      date: `${dayStart0.getMonth() + 1}-${dayStart0.getDate()}`,
      count: dayRes.total
    })
  }

  // 平均每用户囤货数 & 过期率
  const totalUsers = totalUsersRes.total || 1
  const totalFridge = totalFridgeRes.total
  const expiredFridge = expiredFridgeRes.total
  const avgFridgePerUser = +(totalFridge / totalUsers).toFixed(2)
  const expiryRate = totalFridge > 0 ? +((expiredFridge / totalFridge) * 100).toFixed(2) : 0

  // 提醒打开率：notification=true 的用户占比
  const notificationOnRes = await db.collection('users').where({ notification: true }).count()
  const reminderOpenRate = totalUsersRes.total > 0
    ? +((notificationOnRes.total / totalUsersRes.total) * 100).toFixed(2)
    : 0

  // 热门美食 TOP10
  const topFoodsRes = await db.collection('foods')
    .where({ status: 'approved' })
    .orderBy('hotScore', 'desc')
    .limit(10)
    .get()

  const topFoods = topFoodsRes.data.map((item, index) => ({
    rank: index + 1,
    _id: item._id,
    name: item.name,
    image: (item.images && item.images[0]) || '',
    origin: item.origin || '',
    hotScore: item.hotScore || 0,
    voteCount: item.voteCount || 0
  }))

  return {
    success: true,
    data: {
      core: {
        totalUsers: totalUsersRes.total,
        todayNewUsers: todayNewUsersRes.total,
        totalSubmissions: totalSubmissionsRes.total,
        pendingSubmissions: pendingSubmissionsRes.total,
        totalFoods: totalFoodsRes.total
      },
      fridge: {
        totalFridge,
        expiredFridge,
        avgFridgePerUser,
        expiryRate
      },
      submissionTrend: trend,
      reminder: {
        reminderOpenRate,
        notificationOn: notificationOnRes.total,
        totalUsers: totalUsersRes.total
      },
      topFoods
    }
  }
}

// ============ 消息推送 ============

async function pushMessage(event) {
  const { title, content, scope = 'all', region, isPreview = false } = event

  if (!title || !content) {
    return { success: false, message: '标题和内容不能为空' }
  }
  if (scope !== 'all' && scope !== 'region') {
    return { success: false, message: '无效的发送范围' }
  }
  if (scope === 'region' && !region) {
    return { success: false, message: '请选择指定地区' }
  }

  // 查询目标用户
  let where = { notification: true }
  if (scope === 'region') {
    // region 形如 { province, city }
    if (region.province) {
      where['region.province'] = region.province
    }
    if (region.city) {
      where['region.city'] = region.city
    }
  }

  // 预览：仅返回目标用户数，不实际发送
  if (isPreview) {
    const countRes = await db.collection('users').where(where).count()
    return {
      success: true,
      isPreview: true,
      data: { targetCount: countRes.total },
      message: `预览：将推送至 ${countRes.total} 位用户`
    }
  }

  const countRes = await db.collection('users').where(where).count()
  const total = countRes.total
  if (total === 0) {
    return { success: false, message: '没有符合条件的用户' }
  }

  // 分批拉取用户并写入消息
  const now = new Date()
  let sentCount = 0
  const pageSize = MAX_LIMIT
  let processed = 0

  while (processed < total) {
    const batch = await db.collection('users')
      .where(where)
      .skip(processed)
      .limit(pageSize)
      .get()

    if (!batch.data.length) break

    const tasks = batch.data.map(user => {
      return db.collection('messages').add({
        data: {
          userId: user.openid,
          type: 'system',
          title: title,
          content: content,
          isRead: false,
          isDeleted: false,
          isPush: true,
          pushScope: scope,
          pushRegion: region || null,
          createTime: now,
          updateTime: now
        }
      })
    })

    await Promise.all(tasks)
    sentCount += batch.data.length
    processed += batch.data.length

    if (batch.data.length < pageSize) break
  }

  // 记录推送历史
  await db.collection('pushHistory').add({
    data: {
      title,
      content,
      scope,
      region: region || null,
      targetCount: sentCount,
      senderTime: now,
      createTime: now
    }
  })

  return {
    success: true,
    message: `推送成功，已发送至 ${sentCount} 位用户`,
    data: { targetCount: sentCount }
  }
}

async function getPushHistory(event) {
  const { page = 1, pageSize = PAGE_SIZE } = event
  const pageNumber = Math.max(parseInt(page, 10) || 1, 1)
  const size = Math.max(parseInt(pageSize, 10) || PAGE_SIZE, 1)

  const countResult = await db.collection('pushHistory').count()
  const total = countResult.total

  const listResult = await db.collection('pushHistory')
    .orderBy('createTime', 'desc')
    .skip((pageNumber - 1) * size)
    .limit(size)
    .get()

  const list = listResult.data.map(item => ({
    ...item,
    createTimeText: formatTime(item.createTime)
  }))

  return {
    success: true,
    data: {
      list,
      total,
      page: pageNumber,
      pageSize: size,
      hasMore: pageNumber * size < total
    }
  }
}

// ============ 工具函数 ============

function formatTime(date) {
  const d = new Date(date)
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (isSameDay(d, now)) {
    return `今天 ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameDay(d, yesterday)) {
    return `昨天 ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
