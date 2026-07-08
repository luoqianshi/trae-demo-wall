/**
 * 路见 Demo - 后台管理端模拟 API
 * 提供工单管理、统计分析、用户管理等接口
 * 与 mobile 端共享 localStorage 数据
 * 挂载到 window.LJ.mockAdminApi
 */
(function (global) {
  const LJ = global.LJ || (global.LJ = {})
  const { STORAGE_KEYS } = LJ.constants
  const { getStorage, setStorage, delay, formatDate } = LJ.utils

  /**
   * 初始化数据（复用 mobile 端初始化）
   * 若数据损坏自动重新初始化
   */
  function initData() {
    const initialized = getStorage(STORAGE_KEYS.initialized)
    const reports = getStorage(STORAGE_KEYS.reports, null)
    if (!initialized || !Array.isArray(reports) || reports.length === 0) {
      LJ.mockApi.initData()
    }
  }

  /**
   * 获取所有上报记录
   */
  function getAllReports() {
    return getStorage(STORAGE_KEYS.reports, [])
  }

  /**
   * 保存所有上报记录
   */
  function saveReports(reports) {
    setStorage(STORAGE_KEYS.reports, reports)
  }

  /**
   * 成功响应
   */
  function success(data) {
    return { code: 0, message: 'success', data }
  }

  /**
   * 失败响应
   */
  function fail(message) {
    return { code: -1, message, data: null }
  }

  /**
   * 后台登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   */
  async function login(username, password) {
    await delay(400, 700)
    const admin = LJ.mockData.adminUsers.find(
      (u) => u.username === username && u.password === password
    )
    if (!admin) {
      return fail('用户名或密码错误')
    }
    const { password: _, ...safeAdmin } = admin
    setStorage(STORAGE_KEYS.adminUser, safeAdmin)
    return success(safeAdmin)
  }

  /**
   * 退出登录
   */
  async function logout() {
    await delay(100, 200)
    localStorage.removeItem(STORAGE_KEYS.adminUser)
    return success(null)
  }

  /**
   * 获取当前登录管理员
   */
  function getCurrentAdmin() {
    return getStorage(STORAGE_KEYS.adminUser)
  }

  /**
   * 获取数据看板数据
   */
  async function getDashboardData() {
    await delay(300, 500)
    initData()
    const reports = getAllReports()
    const now = new Date()

    // 状态统计
    const statusCount = {
      pending: 0, approved: 0, processing: 0, fixed: 0, verified: 0, rejected: 0
    }
    reports.forEach((r) => { statusCount[r.status] = (statusCount[r.status] || 0) + 1 })

    // 近 7 天趋势
    const trend = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = formatDate(date, 'MM-DD')
      const count = reports.filter((r) => {
        const rDate = new Date(r.createTime)
        return rDate.toDateString() === date.toDateString()
      }).length
      trend.push({ date: dateStr, count })
    }

    // 类型分布
    const { PROBLEM_TYPES } = LJ.constants
    const typeDistribution = PROBLEM_TYPES.map((t) => ({
      name: t.name,
      count: reports.filter((r) => r.typeId === t.id).length
    })).filter((item) => item.count > 0)

    // 区域分布
    const regionDistribution = {}
    reports.forEach((r) => {
      const region = r.location.address.match(/北京市(.*?区)/)
      const name = region ? region[1] : '其他'
      regionDistribution[name] = (regionDistribution[name] || 0) + 1
    })

    // 处理效率
    const verifiedReports = reports.filter((r) => r.status === 'verified')
    let avgProcessDays = 0
    if (verifiedReports.length > 0) {
      const totalDays = verifiedReports.reduce((sum, r) => {
        const start = new Date(r.createTime)
        const end = new Date(r.timeline[r.timeline.length - 1].time)
        return sum + (end - start) / (24 * 60 * 60 * 1000)
      }, 0)
      avgProcessDays = Math.round((totalDays / verifiedReports.length) * 24) / 24
    }

    return success({
      total: reports.length,
      statusCount,
      trend,
      typeDistribution,
      regionDistribution,
      avgProcessDays,
      verifiedCount: statusCount.verified,
      pendingCount: statusCount.pending + statusCount.approved
    })
  }

  /**
   * 获取工单列表（带筛选）
   * @param {Object} params - { page, pageSize, status, typeId, keyword, startDate, endDate }
   */
  async function getReportList(params = {}) {
    await delay(300, 600)
    initData()
    let reports = getAllReports()

    // 状态筛选
    if (params.status) {
      reports = reports.filter((r) => r.status === params.status)
    }
    // 类型筛选
    if (params.typeId) {
      reports = reports.filter((r) => r.typeId === params.typeId)
    }
    // 关键字搜索
    if (params.keyword) {
      const kw = params.keyword.toLowerCase()
      reports = reports.filter((r) =>
        r.title.toLowerCase().includes(kw) ||
        r.description.toLowerCase().includes(kw) ||
        r.orderId.toLowerCase().includes(kw) ||
        r.location.address.toLowerCase().includes(kw)
      )
    }
    // 时间范围
    if (params.startDate) {
      reports = reports.filter((r) => new Date(r.createTime) >= new Date(params.startDate))
    }
    if (params.endDate) {
      reports = reports.filter((r) => new Date(r.createTime) <= new Date(params.endDate + ' 23:59:59'))
    }

    // 按创建时间倒序
    reports.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))

    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const start = (page - 1) * pageSize
    const list = reports.slice(start, start + pageSize)

    return success({
      list,
      total: reports.length,
      hasMore: start + pageSize < reports.length
    })
  }

  /**
   * 获取工单详情
   */
  async function getReportDetail(reportId) {
    await delay(200, 400)
    initData()
    const report = getAllReports().find((r) => r._id === reportId)
    if (!report) return fail('工单不存在')
    return success(report)
  }

  /**
   * 审核工单
   * @param {string} reportId - 工单ID
   * @param {boolean} passed - 是否通过
   * @param {string} remark - 审核备注
   */
  async function auditReport(reportId, passed, remark) {
    await delay(300, 500)
    initData()
    const reports = getAllReports()
    const index = reports.findIndex((r) => r._id === reportId)
    if (index === -1) return fail('工单不存在')

    const admin = getCurrentAdmin()
    const report = reports[index]
    const now = formatDate(new Date())
    report.status = passed ? 'approved' : 'rejected'
    report.auditRemark = remark
    report.auditor = admin ? admin.name : '审核员'
    report.updateTime = now
    report.timeline.push({
      action: 'audit',
      time: now,
      description: passed ? `审核通过：${remark}` : `审核驳回：${remark}`,
      operator: report.auditor
    })

    reports[index] = report
    saveReports(reports)
    return success(report)
  }

  /**
   * 派单（指派处理人）
   * @param {string} reportId - 工单ID
   * @param {string} handler - 处理人
   * @param {string} remark - 派单备注
   */
  async function assignReport(reportId, handler, remark = '') {
    await delay(300, 500)
    initData()
    const reports = getAllReports()
    const index = reports.findIndex((r) => r._id === reportId)
    if (index === -1) return fail('工单不存在')

    const admin = getCurrentAdmin()
    const report = reports[index]
    const now = formatDate(new Date())
    report.status = 'processing'
    report.handler = handler
    report.processRemark = remark || `已派单给 ${handler}`
    report.updateTime = now
    report.timeline.push({
      action: 'assign',
      time: now,
      description: `派单给 ${handler}：${remark}`,
      operator: admin ? admin.name : '管理员'
    })
    report.timeline.push({
      action: 'process',
      time: now,
      description: `开始处理：${report.processRemark}`,
      operator: handler
    })

    reports[index] = report
    saveReports(reports)
    return success(report)
  }

  /**
   * 标记已修复
   * @param {string} reportId - 工单ID
   * @param {string} remark - 修复说明
   */
  async function markFixed(reportId, remark) {
    await delay(300, 500)
    initData()
    const reports = getAllReports()
    const index = reports.findIndex((r) => r._id === reportId)
    if (index === -1) return fail('工单不存在')

    const report = reports[index]
    const now = formatDate(new Date())
    report.status = 'fixed'
    report.fixRemark = remark
    report.updateTime = now
    report.timeline.push({
      action: 'fix',
      time: now,
      description: `标记已修复：${remark}`,
      operator: report.handler || '处理员'
    })

    reports[index] = report
    saveReports(reports)
    return success(report)
  }

  /**
   * 获取统计分析数据
   */
  async function getStatistics() {
    await delay(300, 500)
    initData()
    const reports = getAllReports()
    const { PROBLEM_TYPES, PROBLEM_CATEGORIES } = LJ.constants

    // 类型统计
    const typeStats = PROBLEM_TYPES.map((t) => ({
      name: t.name,
      total: reports.filter((r) => r.typeId === t.id).length,
      verified: reports.filter((r) => r.typeId === t.id && r.status === 'verified').length
    })).filter((s) => s.total > 0)

    // 分类统计
    const categoryStats = PROBLEM_CATEGORIES.map((c) => ({
      name: c.name,
      total: reports.filter((r) => r.categoryId === c.id).length,
      verified: reports.filter((r) => r.categoryId === c.id && r.status === 'verified').length
    })).filter((s) => s.total > 0)

    // 处理人统计
    const handlerStats = {}
    reports.forEach((r) => {
      if (r.handler) {
        if (!handlerStats[r.handler]) {
          handlerStats[r.handler] = { name: r.handler, total: 0, fixed: 0 }
        }
        handlerStats[r.handler].total++
        if (r.status === 'verified' || r.status === 'fixed') {
          handlerStats[r.handler].fixed++
        }
      }
    })

    return success({
      typeStats,
      categoryStats,
      handlerStats: Object.values(handlerStats),
      totalReports: reports.length,
      verifiedReports: reports.filter((r) => r.status === 'verified').length
    })
  }

  /**
   * 获取上报者列表
   */
  async function getUserList() {
    await delay(300, 500)
    initData()
    const reports = getAllReports()
    const userMap = {}
    reports.forEach((r) => {
      if (!userMap[r.openid]) {
        userMap[r.openid] = {
          openid: r.openid,
          nickName: r.reporterName,
          avatarUrl: r.reporterAvatar,
          phone: r.reporterPhone,
          totalReports: 0,
          verifiedCount: 0,
          lastReportTime: r.createTime
        }
      }
      userMap[r.openid].totalReports++
      if (r.status === 'verified') userMap[r.openid].verifiedCount++
      if (new Date(r.createTime) > new Date(userMap[r.openid].lastReportTime)) {
        userMap[r.openid].lastReportTime = r.createTime
      }
    })
    const list = Object.values(userMap).sort((a, b) => b.totalReports - a.totalReports)
    return success(list)
  }

  LJ.mockAdminApi = {
    initData,
    login,
    logout,
    getCurrentAdmin,
    getDashboardData,
    getReportList,
    getReportDetail,
    auditReport,
    assignReport,
    markFixed,
    getStatistics,
    getUserList
  }
})(window)
