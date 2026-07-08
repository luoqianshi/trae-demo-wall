/**
 * 路见 Demo - 小程序端模拟 API
 * 替代小程序云函数，提供 Promise 风格的接口
 * 数据持久化到 localStorage，与 admin 端共享
 * 挂载到 window.LJ.mockApi
 */
(function (global) {
    const LJ = global.LJ || (global.LJ = {})
    const { STORAGE_KEYS, PAGE_SIZE } = LJ.constants
    const { getStorage, setStorage, delay, generateId, generateOrderId, formatDate, calcDistance } = LJ.utils

    /**
     * 初始化数据
     * 首次访问时将模拟数据写入 localStorage
     * 若 reports 数据损坏或为空，自动重新初始化
     */
    function initData() {
        const initialized = getStorage(STORAGE_KEYS.initialized)
        const reports = getStorage(STORAGE_KEYS.reports, null)
        const storedVersion = getStorage(STORAGE_KEYS.dataVersion, '')
        const currentVersion = LJ.constants.DATA_VERSION
        // 数据未初始化、损坏为空、或版本号不匹配时，重新写入模拟数据
        if (!initialized || !Array.isArray(reports) || reports.length === 0 || storedVersion !== currentVersion) {
            setStorage(STORAGE_KEYS.reports, LJ.mockData.reports)
            setStorage(STORAGE_KEYS.currentUser, LJ.mockData.currentUser)
            setStorage(STORAGE_KEYS.userStats, LJ.mockData.getCurrentUserStats())
            // 初始化时设置 lastViewedTime 为当前时间，避免初始所有工单都算未读
            setStorage(STORAGE_KEYS.lastViewedTime, LJ.utils.formatDate(new Date()))
            setStorage(STORAGE_KEYS.dataVersion, currentVersion)
            setStorage(STORAGE_KEYS.initialized, true)
        }
    }

    /**
     * 获取所有上报记录
     * @returns {Array} 上报记录数组
     */
    function getAllReports() {
        return getStorage(STORAGE_KEYS.reports, [])
    }

    /**
     * 保存所有上报记录
     * @param {Array} reports - 上报记录数组
     */
    function saveReports(reports) {
        setStorage(STORAGE_KEYS.reports, reports)
    }

    /**
     * 统一成功响应
     */
    function success(data) {
        return { code: 0, message: 'success', data }
    }

    /**
     * 统一失败响应
     */
    function fail(message) {
        return { code: -1, message, data: null }
    }

    /**
     * 登录 - 获取当前用户信息
     * 模拟微信静默授权登录
     */
    async function login() {
        await delay(200, 400)
        initData()
        const user = getStorage(STORAGE_KEYS.currentUser)
        return success(user)
    }

    /**
     * 提交上报
     * @param {Object} reportData - 上报数据
     */
    async function submitReport(reportData) {
        await delay(400, 800)
        initData()
        const reports = getAllReports()
        const user = getStorage(STORAGE_KEYS.currentUser)
        const now = new Date()
        const { getTypeInfo, getCategoryInfo } = LJ.utils

        const typeInfo = getTypeInfo(reportData.typeId)
        const categoryInfo = getCategoryInfo(typeInfo.category)

        const newReport = {
            _id: generateId('report_'),
            orderId: generateOrderId(),
            openid: user.openid,
            reporterName: user.nickName,
            reporterAvatar: user.avatarUrl,
            reporterPhone: '188****8888',
            title: typeInfo.name,
            typeId: reportData.typeId,
            typeName: typeInfo.name,
            categoryId: categoryInfo.id,
            categoryName: categoryInfo.name,
            description: reportData.description || '',
            location: reportData.location,
            images: reportData.imageIds || [],
            fixImages: [],
            status: 'pending',
            createTime: formatDate(now),
            updateTime: formatDate(now),
            timeline: [{
                action: 'submit',
                time: formatDate(now),
                description: '提交上报',
                operator: user.nickName
            }],
            auditor: '',
            auditRemark: '',
            handler: '',
            processRemark: '',
            fixRemark: '',
            verifyRemark: '',
            verifyResult: null,
            distance: 0
        }

        reports.unshift(newReport)
        saveReports(reports)

        // 更新用户统计
        const stats = getStorage(STORAGE_KEYS.userStats, { totalReports: 0, fixedCount: 0, verifyCount: 0 })
        stats.totalReports = (stats.totalReports || 0) + 1
        setStorage(STORAGE_KEYS.userStats, stats)

        return success({ reportId: newReport._id, orderId: newReport.orderId })
    }

    /**
     * 获取我的上报列表
     * @param {Object} params - 查询参数 { page, pageSize, status }
     */
    async function getMyReports(params = {}) {
        await delay(300, 600)
        initData()
        const user = getStorage(STORAGE_KEYS.currentUser)
        const reports = getAllReports().filter((r) => r.openid === user.openid)

        // 状态筛选
        let filtered = reports
        if (params.status) {
            filtered = reports.filter((r) => r.status === params.status)
        }

        // 分页
        const page = params.page || 1
        const pageSize = params.pageSize || PAGE_SIZE
        const start = (page - 1) * pageSize
        const list = filtered.slice(start, start + pageSize)

        return success({
            list,
            total: filtered.length,
            hasMore: start + pageSize < filtered.length
        })
    }

    /**
     * 获取附近的上报列表
     * @param {Object} params - { latitude, longitude, radius, page, pageSize }
     */
    async function getNearbyReports(params) {
        await delay(300, 600)
        initData()
        const reports = getAllReports()

        // 计算距离并筛选
        const withDistance = reports.map((r) => ({
            ...r,
            distance: Math.round(calcDistance(
                params.latitude, params.longitude,
                r.location.latitude, r.location.longitude
            ))
        }))

        const radius = params.radius || 5000
        const nearby = withDistance
            .filter((r) => r.distance <= radius)
            .sort((a, b) => a.distance - b.distance)

        // 分页
        const page = params.page || 1
        const pageSize = params.pageSize || PAGE_SIZE
        const start = (page - 1) * pageSize
        const list = nearby.slice(start, start + pageSize)

        return success({
            list,
            total: nearby.length,
            hasMore: start + pageSize < nearby.length
        })
    }

    /**
     * 获取上报详情
     * @param {string} reportId - 上报记录ID
     */
    async function getReportDetail(reportId) {
        await delay(300, 500)
        initData()
        const reports = getAllReports()
        const report = reports.find((r) => r._id === reportId)
        if (!report) {
            return fail('上报记录不存在')
        }
        return success(report)
    }

    /**
     * 修复验证
     * @param {string} reportId - 上报记录ID
     * @param {boolean} verified - 是否确认已修复
     * @param {string} photoId - 验证照片ID
     * @param {string} comment - 验证备注
     */
    async function verifyReport(reportId, verified, photoId = '', comment = '') {
        await delay(400, 700)
        initData()
        const reports = getAllReports()
        const index = reports.findIndex((r) => r._id === reportId)
        if (index === -1) {
            return fail('上报记录不存在')
        }

        const report = reports[index]
        const now = formatDate(new Date())
        report.status = verified ? 'verified' : 'processing'
        report.verifyResult = verified
        report.verifyRemark = comment || (verified ? '确认已修复' : '未修复，需继续处理')
        report.updateTime = now
        if (photoId) {
            report.fixImages = [photoId]
        }
        report.timeline.push({
            action: 'verify',
            time: now,
            description: `验证${verified ? '通过' : '未通过'}：${report.verifyRemark}`,
            operator: report.reporterName
        })

        reports[index] = report
        saveReports(reports)

        // 更新用户统计
        if (verified) {
            const stats = getStorage(STORAGE_KEYS.userStats, { totalReports: 0, fixedCount: 0, verifyCount: 0 })
            stats.verifyCount = (stats.verifyCount || 0) + 1
            setStorage(STORAGE_KEYS.userStats, stats)
        }

        return success({ status: report.status })
    }

    /**
     * AI 图像识别（模拟）
     * 根据图片返回随机的设施类型和问题类型
     * @param {string} imagePath - 图片路径
     */
    async function recognizeImage(imagePath = '') {
        await delay(1200, 2000)
        initData()
        const { PROBLEM_TYPES } = LJ.constants

        // 根据文件名 hash 选择类型，保证同一图片识别结果一致
        let hash = 0
        for (let i = 0; i < imagePath.length; i++) {
            hash = ((hash << 5) - hash) + imagePath.charCodeAt(i)
            hash |= 0
        }
        const typeIndex = Math.abs(hash) % PROBLEM_TYPES.length
        const typeInfo = PROBLEM_TYPES[typeIndex]
        const categoryInfo = LJ.utils.getCategoryInfo(typeInfo.category)
        const confidence = Math.round((0.75 + Math.random() * 0.2) * 100) / 100

        return success({
            facilityType: categoryInfo.name,
            facilityTypeId: categoryInfo.id,
            problemType: typeInfo.name,
            problemTypeId: typeInfo.id,
            confidence
        })
    }

    /**
     * 获取用户统计
     */
    async function getUserStats() {
        await delay(200, 400)
        initData()
        const stats = getStorage(STORAGE_KEYS.userStats, { totalReports: 0, fixedCount: 0, verifyCount: 0 })
        return success(stats)
    }

    /**
     * 重置所有数据（调试用）
     */
    function resetData() {
        Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
        initData()
    }

    /**
     * 获取未读反馈数量（工单 updateTime > lastViewedTime 的数量）
     * 用于 footer 我的上报角标提示
     * @returns {Promise<{success: boolean, data: number}>}
     */
    async function getUnreadFeedbackCount() {
        await delay(100, 200)
        initData()
        const user = getStorage(STORAGE_KEYS.currentUser)
        if (!user) return success({ count: 0 })
        const reports = getAllReports().filter((r) => r.openid === user.openid)
        const lastViewedTime = getStorage(STORAGE_KEYS.lastViewedTime) || ''
        // 工单 updateTime 晚于最后查看时间，说明有新反馈
        const unreadCount = reports.filter((r) => r.updateTime && r.updateTime > lastViewedTime).length
        return success({ count: unreadCount })
    }

    /**
     * 标记所有反馈为已读（更新 lastViewedTime 为当前时间）
     */
    function markFeedbackViewed() {
        setStorage(STORAGE_KEYS.lastViewedTime, LJ.utils.formatDate(new Date()))
    }

    LJ.mockApi = {
        initData,
        login,
        submitReport,
        getMyReports,
        getNearbyReports,
        getReportDetail,
        verifyReport,
        recognizeImage,
        getUserStats,
        resetData,
        getUnreadFeedbackCount,
        markFeedbackViewed
    }
})(window)
