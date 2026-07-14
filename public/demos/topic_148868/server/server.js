/**
 * 成长漂流瓶 — 后端服务器
 * Express + SQLite 实现用户认证及全部业务 API
 */
const express = require('express'); // 引入 express 框架
const cors = require('cors'); // 引入 cors 中间件，处理跨域
const path = require('path'); // 引入 path 模块，处理文件路径
const { saveImage, deleteImage } = require('./upload'); // 引入图片上传工具模块
const {
    // 用户认证相关
    initDatabase, // 初始化数据库
    createUser, // 创建用户
    getUserByUsername, // 根据用户名获取用户
    getUserByEmail, // 根据邮箱获取用户
    verifyUser, // 验证用户密码
    updatePassword, // 更新密码
    resetPasswordByIdentifier, // 通过标识符重置密码
    updateUser, // 更新用户信息
    sanitizeUser, // 清洗用户信息（去除密码）
    getUserById, // 根据 ID 获取用户
    getPartners, // 获取搭子匹配列表（真实用户数据）
    acceptPartner, // 接受结伴（双向存储搭子关系）
    getMyPartners, // 获取用户搭子列表
    isPartner, // 检查是否已结伴
    removePartner, // 移除搭子关系（双向删除）
    getPendingPartnerRequest, // 查询待处理的搭子申请
    // 任务点赞与评论
    toggleTaskLike, // 切换任务点赞
    isTaskLiked, // 检查是否已点赞任务
    getTaskLikeCount, // 获取任务点赞数
    createTaskComment, // 创建任务评论
    getTaskComments, // 获取任务评论列表
    getTaskCommentCount, // 获取任务评论数
    // 任务相关
    createTask, // 创建任务
    getTasksByUserId, // 获取用户任务列表
    getOceanTasks, // 获取漂流海洋任务（show_in_ocean=1）
    getTaskById, // 根据 ID 获取任务
    updateTask, // 更新任务
    deleteTask, // 删除任务
    toggleTaskStatus, // 切换任务完成状态
    getTodayTasks, // 获取今日任务
    getTasksByDate, // 根据日期获取任务
    getTaskDatesByMonth, // 获取某月有任务的日期
    // 每日任务统计相关
    updateDailyTaskStats, // 更新每日任务统计
    getDailyTaskStats, // 获取某日任务统计
    getMonthlyDailyStats, // 获取某月每日统计
    getWeeklyDailyStats, // 获取本周每日统计
    // 打卡相关
    createCheckin, // 创建打卡
    getCheckinsByUserId, // 获取用户打卡记录
    getCheckinsByDate, // 获取指定日期打卡
    getCheckinHistory, // 获取打卡历史
    getCheckinStreak, // 获取连续打卡天数
    // 漂流瓶相关
    createBottle, // 创建漂流瓶
    getBottles, // 获取漂流瓶列表（分页）
    getBottleById, // 根据 ID 获取漂流瓶
    getBottlesByUserId, // 获取用户漂流瓶
    removeBottle, // 移除漂流瓶
    incrementBottleLikes, // 点赞数 +1
    decrementBottleLikes, // 点赞数 -1
    // 点赞相关
    toggleLike, // 切换点赞
    isLiked, // 是否已点赞
    getLikesByBottleId, // 获取点赞列表
    // 评论相关
    createComment, // 创建评论
    getCommentsByBottleId, // 获取评论列表
    // 挑战相关
    createChallenge, // 创建挑战
    getChallenges, // 获取所有挑战
    getChallengeById, // 根据 ID 获取挑战
    getOngoingChallenges, // 获取进行中的挑战
    incrementParticipants, // 参与人数 +1
    // 挑战参与相关
    joinChallenge, // 加入挑战
    getParticipant, // 获取参与记录
    getParticipantsByChallengeId, // 获取挑战参与者
    getChallengesByUserId, // 获取用户参与的挑战（带打卡次数和今日打卡状态）
    updateParticipantProgress, // 更新参与者进度
    getChallengeRanking, // 获取挑战排行榜（按打卡次数降序）
    // 挑战打卡相关
    hasCheckedInChallengeToday, // 检查今日是否已打卡
    getChallengeCheckinCount, // 获取用户对某挑战的打卡次数
    getChallengeCheckinRecords, // 获取用户对某挑战的打卡记录
    checkinChallenge, // 挑战打卡（核心函数）
    getChallengeDetail, // 获取挑战详情（含用户参与状态和打卡信息）
    getCompletedChallengesByUserId, // 获取用户往期挑战（成功和失败）
    getChallengeStatsByUserId, // 获取用户挑战统计（成功次数和失败次数）
    checkAndUpdateFailedChallenges, // 检测并更新失败的挑战
    // 挑战营友动态相关
    createChallengeMoment, // 创建挑战营友动态
    getChallengeMoments, // 获取挑战动态列表
    toggleChallengeMomentLike, // 切换挑战动态点赞
    // 时间胶囊相关
    createCapsule, // 创建胶囊
    getCapsulesByUserId, // 获取用户胶囊
    getCapsuleById, // 根据 ID 获取胶囊
    openCapsule, // 开启胶囊
    getOpenableCapsules, // 获取可开启的胶囊
    deleteCapsule, // 删除胶囊
    // 消息相关
    createMessage, // 创建消息
    getMessagesByUserId, // 获取用户消息
    markMessageRead, // 标记消息已读
    markAllRead, // 全部已读
    getUnreadCount, // 获取未读数量
    getMessagesByType, // 按类型获取消息
    // 徽章相关
    createBadge, // 创建徽章
    getBadges, // 获取所有徽章
    getBadgeById, // 根据 ID 获取徽章
    // 用户徽章相关
    awardBadge, // 授予徽章
    getUserBadges, // 获取用户徽章
    hasBadge, // 判断是否拥有徽章
    // 专注记录相关
    createFocusSession, // 创建专注记录
    getFocusSessionsByUserId, // 获取专注记录
    getFocusStats, // 获取专注统计
    // 周统计相关
    createOrUpdateWeeklyStats, // 创建或更新周统计
    getWeeklyStats, // 获取周统计
    // 等级系统相关
    getUserLevel, // 获取用户等级信息
    getAllLevelConfigs, // 获取所有等级配置
    getGrowthTasks, // 获取所有成长任务
    awardXp, // 发放经验
    awardXpByCondition, // 根据条件类型发放经验
    getUserGrowthLogs, // 获取用户经验日志
    getTodayXpGained, // 获取今日已获经验
    // 漂流瓶收藏相关
    addBottleFavorite, // 收藏漂流瓶
    removeBottleFavorite, // 取消收藏
    toggleBottleFavorite, // 切换收藏
    isBottleFavorited, // 是否已收藏
    getBottleFavoritesByUserId, // 获取用户收藏列表
    getBottleFavoriteCount, // 获取收藏数量
    // 意见反馈相关
    createFeedback, // 创建反馈
    getFeedbacksByUserId, // 获取用户反馈列表
    // 挑战打卡全记录
    getAllChallengeCheckinsByUserId, // 获取用户所有挑战打卡记录
    db // 数据库实例（用于直接查询）
} = require('./db'); // 从 db.js 导入所有数据库函数

const app = express(); // 创建 express 应用
const PORT = process.env.PORT || 4736; // 服务端口，默认 4736

// 中间件
app.use(cors()); // 启用跨域
app.use(express.json({ limit: '10mb' })); // 解析 JSON 请求体（限制 10mb，支持 base64 图片上传）
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // 解析 URL 编码请求体

// 静态文件服务（前端页面）
const distPath = path.join(__dirname, '..', 'dist'); // 前端 dist 目录
app.use(express.static(distPath)); // 托管静态资源

// 静态文件服务（上传的图片）—— 让 /uploads 路径可直接访问图片
const uploadsPath = path.join(__dirname, '..', 'uploads'); // 上传目录
app.use('/uploads', express.static(uploadsPath)); // 托管上传的图片

// 初始化数据库
initDatabase(); // 启动时初始化数据库表与默认数据

// ==================== 工具函数 ====================

/**
 * 统一成功响应
 */
function success(res, data = null, message = '操作成功') {
    res.json({ code: 0, message, data }); // 返回统一格式
}

/**
 * 统一失败响应
 */
function error(res, message = '操作失败', code = 1, status = 400) {
    res.status(status).json({ code, message, data: null }); // 返回错误格式
}

/**
 * 验证邮箱格式
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // 标准邮箱正则
}

/**
 * 验证用户名格式
 * 规则：2-20 位，字母、数字、下划线或中文
 */
function isValidUsername(username) {
    return /^[a-zA-Z0-9_\u4e00-\u9fa5]{2,20}$/.test(username); // 用户名正则
}

/**
 * 验证密码强度
 * 规则：至少 6 位
 */
function isValidPassword(password) {
    return typeof password === 'string' && password.length >= 6; // 密码长度校验
}

/**
 * 校验 userId 是否存在
 * @returns {object|null} 用户对象；不存在时已响应错误并返回 null
 */
function validateUserId(req, res, userIdStr) {
    if (!userIdStr) { // 未提供 userId
        error(res, '请提供用户ID'); // 返回错误
        return null; // 返回 null
    }
    const userId = parseInt(userIdStr); // 转为整数
    if (isNaN(userId)) { // 不是合法数字
        error(res, '用户ID格式不正确'); // 返回错误
        return null; // 返回 null
    }
    const user = getUserById(userId); // 查询用户
    if (!user) { // 用户不存在
        error(res, '用户不存在', 1, 404); // 返回 404
        return null; // 返回 null
    }
    return user; // 返回用户对象
}

// ==================== 用户认证 API ====================

// 健康检查
app.get('/api/health', (req, res) => {
    success(res, { status: 'ok', timestamp: new Date().toISOString() }); // 返回服务状态
});

// ==================== 图片上传 API ====================

/**
 * @api {post} /api/upload 上传图片到服务器
 * @body { image: base64字符串, folder?: 子目录名 }
 * @returns { path: '/uploads/xxx.jpg' } 相对路径，用于数据库存储和前端渲染
 */
app.post('/api/upload', (req, res) => {
    try {
        const { image, folder } = req.body; // 解构参数：base64 图片数据、子目录
        if (!image) return error(res, '请提供图片数据'); // 图片必填

        // 调用上传工具保存图片
        const result = saveImage(image, folder || ''); // 保存图片
        if (!result.success) return error(res, result.error); // 保存失败

        success(res, { path: result.path }, '上传成功'); // 返回相对路径
    } catch (err) {
        console.error('图片上传失败:', err); // 记录错误
        error(res, '图片上传失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {delete} /api/upload 删除已上传的图片
 * @body { path: '/uploads/xxx.jpg' } 图片相对路径
 */
app.delete('/api/upload', (req, res) => {
    try {
        const { path: relativePath } = req.body; // 解构参数：图片路径
        if (!relativePath) return error(res, '请提供图片路径'); // 路径必填

        const deleted = deleteImage(relativePath); // 删除图片
        if (!deleted) return error(res, '图片不存在或删除失败'); // 删除失败

        success(res, null, '删除成功'); // 返回成功
    } catch (err) {
        console.error('图片删除失败:', err); // 记录错误
        error(res, '图片删除失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/register 用户注册
 * @body { username, password, email?, nickname? }
 */
app.post('/api/register', (req, res) => {
    try {
        const { username, password, email, nickname } = req.body; // 解构请求参数

        // 参数校验
        if (!username) return error(res, '请输入用户名'); // 用户名必填
        if (!isValidUsername(username)) return error(res, '用户名格式不正确（2-20位字母、数字、下划线或中文）'); // 用户名格式
        if (!password) return error(res, '请输入密码'); // 密码必填
        if (!isValidPassword(password)) return error(res, '密码长度不能少于6位'); // 密码强度
        if (email && !isValidEmail(email)) return error(res, '邮箱格式不正确'); // 邮箱格式

        // 检查用户名是否已存在
        if (getUserByUsername(username)) {
            return error(res, '该用户名已被注册'); // 用户名重复
        }

        // 检查邮箱是否已存在
        if (email && getUserByEmail(email)) {
            return error(res, '该邮箱已被注册'); // 邮箱重复
        }

        // 创建用户
        const user = createUser(username, password, { email, nickname }); // 调用 db 创建用户

        success(res, sanitizeUser(user), '注册成功'); // 返回安全用户信息
    } catch (err) {
        console.error('注册失败:', err); // 记录错误
        error(res, '注册失败，请稍后重试', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/login 用户登录
 * @body { username, password }
 */
app.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body; // 解构请求参数

        // 参数校验
        if (!username) return error(res, '请输入账号'); // 账号必填
        if (!password) return error(res, '请输入密码'); // 密码必填

        // 验证用户
        const user = verifyUser(username, password); // 校验账号密码
        if (!user) {
            return error(res, '账号或密码错误'); // 验证失败
        }

        success(res, user, '登录成功'); // 返回用户信息
    } catch (err) {
        console.error('登录失败:', err); // 记录错误
        error(res, '登录失败，请稍后重试', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/forgot-password 忘记密码（重置密码）
 * @body { identifier, newPassword }
 * identifier 可以是用户名或邮箱
 */
app.post('/api/forgot-password', (req, res) => {
    try {
        const { identifier, newPassword } = req.body; // 解构请求参数

        // 参数校验
        if (!identifier) return error(res, '请输入用户名或邮箱'); // 标识符必填
        if (!newPassword) return error(res, '请输入新密码'); // 新密码必填
        if (!isValidPassword(newPassword)) return error(res, '新密码长度不能少于6位'); // 密码强度

        // 查找用户
        let user = getUserByUsername(identifier); // 先按用户名查
        if (!user) {
            user = getUserByEmail(identifier); // 再按邮箱查
        }
        if (!user) {
            return error(res, '未找到对应用户'); // 用户不存在
        }

        // 更新密码
        const successFlag = updatePassword(user.id, newPassword); // 更新密码
        if (!successFlag) {
            return error(res, '密码重置失败'); // 更新失败
        }

        success(res, null, '密码重置成功'); // 返回成功
    } catch (err) {
        console.error('重置密码失败:', err); // 记录错误
        error(res, '重置密码失败，请稍后重试', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/user/profile 获取用户信息
 * @query { id } 用户 ID
 */
app.get('/api/user/profile', (req, res) => {
    try {
        const { id } = req.query; // 从查询参数获取 id
        if (!id) return error(res, '请提供用户ID'); // id 必填

        const user = getUserById(parseInt(id)); // 查询用户
        if (!user) return error(res, '用户不存在', 1, 404); // 用户不存在

        success(res, sanitizeUser(user)); // 返回安全用户信息
    } catch (err) {
        console.error('获取用户信息失败:', err); // 记录错误
        error(res, '获取失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {put} /api/user/profile 更新用户信息
 * @body { id, nickname?, email?, bio?, avatar? }
 */
app.put('/api/user/profile', (req, res) => {
    try {
        const { id, nickname, email, bio, avatar, gender, birthday, city } = req.body; // 解构请求参数
        if (!id) return error(res, '请提供用户ID'); // id 必填

        // 验证邮箱
        if (email && !isValidEmail(email)) {
            return error(res, '邮箱格式不正确'); // 邮箱格式错误
        }

        const updates = {}; // 待更新字段
        if (nickname !== undefined) updates.nickname = nickname; // 昵称
        if (email !== undefined) updates.email = email; // 邮箱
        if (bio !== undefined) updates.bio = bio; // 简介
        if (avatar !== undefined) updates.avatar = avatar; // 头像
        if (gender !== undefined) updates.gender = gender; // 性别
        if (birthday !== undefined) updates.birthday = birthday; // 生日
        if (city !== undefined) updates.city = city; // 所在城市

        if (Object.keys(updates).length === 0) {
            return error(res, '没有需要更新的字段'); // 无更新字段
        }

        const result = updateUser(parseInt(id), updates); // 更新用户
        if (!result) return error(res, '更新失败'); // 更新失败

        const user = getUserById(parseInt(id)); // 重新获取用户
        success(res, sanitizeUser(user), '更新成功'); // 返回更新后的用户
    } catch (err) {
        console.error('更新用户信息失败:', err); // 记录错误
        error(res, '更新失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/users/partners 获取搭子匹配列表（真实用户数据）
 * @query { userId } 当前用户 ID（排除自己）
 */
app.get('/api/users/partners', (req, res) => {
    try {
        const { userId } = req.query; // 从查询参数获取用户 ID
        const excludeUserId = userId ? parseInt(userId) : 0; // 转为整数
        const partners = getPartners(excludeUserId); // 查询搭子列表
        success(res, partners); // 返回搭子列表
    } catch (err) {
        console.error('获取搭子列表失败:', err); // 记录错误
        error(res, '获取失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/partners/accept 接受结伴（实际创建搭子关系）
 * @body { userId, partnerId } 当前用户 ID 和搭子用户 ID
 */
app.post('/api/partners/accept', (req, res) => {
    try {
        const { userId, partnerId } = req.body; // 解构参数
        if (!userId || !partnerId) return error(res, '请提供用户ID和搭子ID'); // 参数校验
        const uid = parseInt(userId); // 当前用户 ID
        const pid = parseInt(partnerId); // 搭子用户 ID
        if (isNaN(uid) || isNaN(pid)) return error(res, 'ID 格式不正确'); // 格式校验
        if (uid === pid) return error(res, '不能和自己结伴'); // 不能和自己结伴

        // 检查搭子用户是否存在
        const partnerUser = getUserById(pid); // 查询搭子用户
        if (!partnerUser) return error(res, '搭子用户不存在', 1, 404); // 不存在

        // 检查是否已结伴
        if (isPartner(uid, pid)) return error(res, '你们已经是搭子了'); // 已结伴

        // 执行结伴
        const result = acceptPartner(uid, pid); // 双向存储搭子关系
        if (!result) return error(res, '结伴失败'); // 失败

        success(res, { partnerId: pid, partnerName: partnerUser.nickname || partnerUser.username }, '结伴成功'); // 返回成功
    } catch (err) {
        console.error('接受结伴失败:', err); // 记录错误
        error(res, '结伴失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/partners/my 获取我的搭子列表
 * @query { userId } 用户 ID
 */
app.get('/api/partners/my', (req, res) => {
    try {
        const { userId } = req.query; // 从查询参数获取用户 ID
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const partners = getMyPartners(user.id); // 查询搭子列表
        success(res, partners); // 返回搭子列表
    } catch (err) {
        console.error('获取搭子列表失败:', err); // 记录错误
        error(res, '获取失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {delete} /api/partners/remove 移除搭子关系（双向删除）
 * @body { userId, partnerId } 当前用户 ID 和搭子用户 ID
 */
app.delete('/api/partners/remove', (req, res) => {
    try {
        const { userId, partnerId } = req.body; // 解构参数
        if (!userId || !partnerId) return error(res, '请提供用户ID和搭子ID'); // 参数校验
        const uid = parseInt(userId); // 当前用户 ID
        const pid = parseInt(partnerId); // 搭子用户 ID
        if (isNaN(uid) || isNaN(pid)) return error(res, 'ID 格式不正确'); // 格式校验

        const result = removePartner(uid, pid); // 移除搭子关系
        if (!result) return error(res, '移除失败'); // 失败
        success(res, null, '已移除搭子'); // 返回成功
    } catch (err) {
        console.error('移除搭子失败:', err); // 记录错误
        error(res, '移除失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/partners/request 发送搭子申请（需要对方同意）
 * @body { userId, partnerId } 当前用户 ID 和对方用户 ID
 * 向对方发送一条 type='partner' 的消息，对方在消息中心接受/拒绝
 */
app.post('/api/partners/request', (req, res) => {
    try {
        const { userId, partnerId } = req.body; // 解构参数
        const user = validateUserId(req, res, userId); // 校验当前用户
        if (!user) return; // 校验失败已响应
        const pid = parseInt(partnerId); // 对方用户 ID
        if (isNaN(pid)) return error(res, '搭子 ID 不正确'); // 格式校验
        if (user.id === pid) return error(res, '不能和自己结伴'); // 不能和自己

        const partnerUser = getUserById(pid); // 查询对方用户
        if (!partnerUser) return error(res, '用户不存在', 1, 404); // 不存在

        // 已是搭子则无需再申请
        if (isPartner(user.id, pid)) return error(res, '你们已经是搭子了'); // 已结伴

        // 检查是否已发送过未读申请
        const existing = getPendingPartnerRequest(pid, user.id); // 查询已有申请
        if (existing) return error(res, '已发送过申请，等待对方同意'); // 已发送

        // 创建搭子申请消息（type='partner'，link 标识申请来源）
        createMessage({
            user_id: pid, // 接收方
            type: 'partner',
            title: '搭子申请',
            content: (user.nickname || user.username) + ' 想和你成为搭子，一起成长',
            sender_name: user.nickname || user.username,
            sender_avatar: user.avatar || '',
            icon: 'users',
            link: 'partner_request:fromUserId:' + user.id // 申请标识，用于消息中心识别
        });
        success(res, null, '申请已发送，等待对方同意'); // 返回成功
    } catch (err) {
        console.error('发送搭子申请失败:', err); // 记录错误
        error(res, '发送申请失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/partners/accept-request 接受搭子申请（由接收方点击）
 * @body { messageId, userId } 消息 ID 和当前用户 ID
 * 创建双向搭子关系，标记消息已读，并通知申请方
 */
app.post('/api/partners/accept-request', (req, res) => {
    try {
        const { messageId, userId } = req.body; // 解构参数
        const user = validateUserId(req, res, userId); // 校验当前用户（接收方）
        if (!user) return; // 校验失败已响应
        if (!messageId) return error(res, '请提供消息 ID'); // 参数校验

        // 查询申请消息，提取申请方 ID
        const msg = db.prepare('SELECT * FROM messages WHERE id = ? AND user_id = ?').get(messageId, user.id); // 查询消息
        if (!msg) return error(res, '申请消息不存在'); // 不存在
        // 从 link 字段解析申请方 ID
        const match = msg.link && msg.link.match(/fromUserId:(\d+)/); // 解析
        if (!match) return error(res, '申请信息异常'); // 解析失败
        const fromUserId = parseInt(match[1]); // 申请方 ID

        // 创建双向搭子关系
        acceptPartner(user.id, fromUserId); // 双向存储
        // 标记申请消息已读
        markMessageRead(msg.id); // 已读
        // 向申请方发送通知消息
        const fromUser = getUserById(fromUserId); // 查询申请方
        createMessage({
            user_id: fromUserId, // 接收方为申请方
            type: 'partner',
            title: '搭子申请已通过',
            content: (user.nickname || user.username) + ' 已同意你的搭子申请，一起成长吧',
            sender_name: user.nickname || user.username,
            sender_avatar: user.avatar || '',
            icon: 'users',
            link: 'my-partners.html' // 跳转到我的搭子页
        });
        success(res, { partnerId: fromUserId, partnerName: fromUser ? (fromUser.nickname || fromUser.username) : '' }, '结伴成功'); // 返回成功
    } catch (err) {
        console.error('接受搭子申请失败:', err); // 记录错误
        error(res, '接受失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/messages/dm 发送私信给搭子
 * @body { userId, partnerId, content } 当前用户 ID、搭子 ID、消息内容
 */
app.post('/api/messages/dm', (req, res) => {
    try {
        const { userId, partnerId, content } = req.body; // 解构参数
        const user = validateUserId(req, res, userId); // 校验当前用户
        if (!user) return; // 校验失败已响应
        const pid = parseInt(partnerId); // 搭子 ID
        if (isNaN(pid)) return error(res, '搭子 ID 不正确'); // 格式校验
        if (!content || !content.trim()) return error(res, '请输入消息内容'); // 内容必填

        // 校验是否为搭子关系
        if (!isPartner(user.id, pid)) return error(res, '只能给搭子发私信'); // 非搭子

        // 创建私信消息
        createMessage({
            user_id: pid, // 接收方
            type: 'partner',
            title: '搭子私信',
            content: content.trim(),
            sender_name: user.nickname || user.username,
            sender_avatar: user.avatar || '',
            icon: 'message-circle',
            link: 'dm:fromUserId:' + user.id // 私信标识
        });
        success(res, null, '已发送'); // 返回成功
    } catch (err) {
        console.error('发送私信失败:', err); // 记录错误
        error(res, '发送失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/user/change-password 修改密码
 * @body { id, oldPassword, newPassword }
 */
app.post('/api/user/change-password', (req, res) => {
    try {
        const { id, oldPassword, newPassword } = req.body; // 解构请求参数

        if (!id) return error(res, '请提供用户ID'); // id 必填
        if (!oldPassword) return error(res, '请输入原密码'); // 原密码必填
        if (!newPassword) return error(res, '请输入新密码'); // 新密码必填
        if (!isValidPassword(newPassword)) return error(res, '新密码长度不能少于6位'); // 密码强度

        const user = getUserById(parseInt(id)); // 查询用户
        if (!user) return error(res, '用户不存在'); // 用户不存在

        // 验证原密码
        const bcrypt = require('bcryptjs'); // 引入 bcryptjs
        const isValid = bcrypt.compareSync(oldPassword, user.password_hash); // 校验原密码
        if (!isValid) return error(res, '原密码错误'); // 原密码错误

        // 更新密码
        const result = updatePassword(parseInt(id), newPassword); // 更新密码
        if (!result) return error(res, '修改失败'); // 修改失败

        success(res, null, '密码修改成功'); // 返回成功
    } catch (err) {
        console.error('修改密码失败:', err); // 记录错误
        error(res, '修改失败', 500, 500); // 返回服务器错误
    }
});

// ==================== 任务 API ====================

/**
 * @api {get} /api/tasks 获取用户任务列表
 * @query { userId }
 */
app.get('/api/tasks', (req, res) => {
    try {
        const { userId } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const tasks = getTasksByUserId(user.id); // 查询任务列表
        success(res, tasks); // 返回任务列表
    } catch (err) {
        console.error('获取任务列表失败:', err); // 记录错误
        error(res, '获取任务列表失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/tasks/today 获取今日任务
 * @query { userId }
 */
app.get('/api/tasks/today', (req, res) => {
    try {
        const { userId } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const tasks = getTodayTasks(user.id); // 查询今日任务
        success(res, tasks); // 返回今日任务
    } catch (err) {
        console.error('获取今日任务失败:', err); // 记录错误
        error(res, '获取今日任务失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/tasks/ocean 获取漂流海洋任务（show_in_ocean=1 的任务）
 * @query { page, limit }
 */
app.get('/api/tasks/ocean', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // 页码，默认 1
        const limit = parseInt(req.query.limit) || 20; // 每页数量，默认 20
        // 如果传了 userId，返回 is_liked 字段
        let currentUserId = null;
        if (req.query.userId) {
            const uid = parseInt(req.query.userId);
            if (!isNaN(uid)) currentUserId = uid;
        }
        const result = getOceanTasks(page, limit, currentUserId); // 查询漂流海洋任务
        success(res, result); // 返回 { list, total }
    } catch (err) {
        console.error('获取漂流海洋任务失败:', err); // 记录错误
        error(res, '获取漂流海洋任务失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/tasks/:id/like 切换任务点赞（点赞/取消点赞）
 * @body { userId } 当前用户 ID
 */
app.post('/api/tasks/:id/like', (req, res) => {
    try {
        const taskId = parseInt(req.params.id); // 任务 ID
        const { userId } = req.body; // 用户 ID
        if (isNaN(taskId)) return error(res, '任务 ID 不正确'); // 校验
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const result = toggleTaskLike(taskId, user.id); // 切换点赞
        success(res, result, result.liked ? '点赞成功' : '已取消点赞'); // 返回结果
    } catch (err) {
        console.error('任务点赞失败:', err); // 记录错误
        error(res, '点赞失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/tasks/:id/comments 获取任务评论列表
 */
app.get('/api/tasks/:id/comments', (req, res) => {
    try {
        const taskId = parseInt(req.params.id); // 任务 ID
        if (isNaN(taskId)) return error(res, '任务 ID 不正确'); // 校验
        const comments = getTaskComments(taskId); // 查询评论列表
        success(res, comments); // 返回评论列表
    } catch (err) {
        console.error('获取任务评论失败:', err); // 记录错误
        error(res, '获取评论失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/tasks/:id/comments 创建任务评论
 * @body { userId, content } 当前用户 ID 和评论内容
 */
app.post('/api/tasks/:id/comments', (req, res) => {
    try {
        const taskId = parseInt(req.params.id); // 任务 ID
        const { userId, content } = req.body; // 用户 ID 和评论内容
        if (isNaN(taskId)) return error(res, '任务 ID 不正确'); // 校验
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应
        if (!content || !content.trim()) return error(res, '请输入评论内容'); // 内容必填

        const comment = createTaskComment({ // 创建评论
            task_id: taskId,
            user_id: user.id,
            user_name: user.nickname || user.username,
            user_avatar: user.avatar || '',
            content: content.trim()
        });
        success(res, comment, '评论成功'); // 返回创建的评论
    } catch (err) {
        console.error('创建任务评论失败:', err); // 记录错误
        error(res, '评论失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/tasks 创建任务
 * @body { userId, title, description?, category?, frequency?, reminderTime?, showInOcean?, taskDate? }
 */
app.post('/api/tasks', (req, res) => {
    try {
        const { userId, title, description, category, frequency, reminderTime, showInOcean, taskDate } = req.body; // 解构请求参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        if (!title) return error(res, '请输入任务标题'); // 标题必填

        const task = createTask({ // 创建任务
            user_id: user.id, // 用户 ID
            title, // 标题
            description: description || '', // 任务描述
            category, // 分类
            frequency, // 频率
            reminder_time: reminderTime, // 提醒时间
            show_in_ocean: showInOcean ? 1 : 0, // 是否在漂流海洋展示
            task_date: taskDate || new Date().toISOString().split('T')[0] // 任务日期，默认今天
        });
        success(res, task, '任务创建成功'); // 返回创建的任务
    } catch (err) {
        console.error('创建任务失败:', err); // 记录错误
        error(res, '创建任务失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {put} /api/tasks/:id 更新任务
 * @body { title?, description?, category?, frequency?, reminderTime?, status?, showInOcean?, taskDate?, completionNote?, completionImages?, isCancelled?, isDeleted? }
 */
app.put('/api/tasks/:id', (req, res) => {
    try {
        const { id } = req.params; // 任务 ID
        const {
            title, description, category, frequency, reminderTime, status, showInOcean,
            taskDate, completionNote, completionImages, isCancelled, isDeleted
        } = req.body; // 待更新字段（含新字段）

        const task = getTaskById(parseInt(id)); // 查询任务是否存在
        if (!task) return error(res, '任务不存在', 1, 404); // 任务不存在

        const updates = {}; // 待更新字段对象
        if (title !== undefined) updates.title = title; // 标题
        if (description !== undefined) updates.description = description; // 任务描述
        if (category !== undefined) updates.category = category; // 分类
        if (frequency !== undefined) updates.frequency = frequency; // 频率
        if (reminderTime !== undefined) updates.reminder_time = reminderTime; // 提醒时间
        if (status !== undefined) updates.status = status; // 状态
        if (showInOcean !== undefined) updates.show_in_ocean = showInOcean ? 1 : 0; // 是否在漂流海洋展示
        if (taskDate !== undefined) updates.task_date = taskDate; // 任务日期
        if (completionNote !== undefined) updates.completion_note = completionNote; // 完成感受
        if (completionImages !== undefined) { // 完成图片列表
            // 支持数组或 JSON 字符串，统一存为 JSON 字符串
            updates.completion_images = Array.isArray(completionImages)
                ? JSON.stringify(completionImages)
                : completionImages;
        }
        if (isCancelled !== undefined) updates.is_cancelled = isCancelled ? 1 : 0; // 是否取消
        if (isDeleted !== undefined) updates.is_deleted = isDeleted ? 1 : 0; // 是否删除（软删除）

        if (Object.keys(updates).length === 0) {
            return error(res, '没有需要更新的字段'); // 无更新字段
        }

        const result = updateTask(parseInt(id), updates); // 更新任务
        if (!result) return error(res, '更新失败'); // 更新失败

        // 若涉及任务日期、状态、取消、删除等，需同步更新对应日期的每日统计
        const finalTask = getTaskById(parseInt(id));
        if (finalTask && finalTask.task_date) {
            updateDailyTaskStats(finalTask.user_id, finalTask.task_date);
        }
        // 若旧任务日期与新日期不同，也需更新旧日期统计
        if (task.task_date && taskDate && task.task_date !== taskDate) {
            updateDailyTaskStats(task.user_id, task.task_date);
        }

        success(res, finalTask, '更新成功'); // 返回更新后的任务
    } catch (err) {
        console.error('更新任务失败:', err); // 记录错误
        error(res, '更新任务失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {delete} /api/tasks/:id 删除任务
 */
app.delete('/api/tasks/:id', (req, res) => {
    try {
        const { id } = req.params; // 任务 ID
        const task = getTaskById(parseInt(id)); // 查询任务
        if (!task) return error(res, '任务不存在', 1, 404); // 任务不存在

        const result = deleteTask(parseInt(id)); // 删除任务
        if (!result) return error(res, '删除失败'); // 删除失败

        success(res, null, '删除成功'); // 返回成功
    } catch (err) {
        console.error('删除任务失败:', err); // 记录错误
        error(res, '删除任务失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/tasks/:id/toggle 切换任务完成状态（仅 待完成 -> 已完成，不可撤回）
 * @body { userId, completionNote?, completionImages? }
 * completionImages: 字符串数组，多张图片链接
 */
app.post('/api/tasks/:id/toggle', (req, res) => {
    try {
        const { id } = req.params; // 任务 ID
        const { userId, completionNote, completionImages } = req.body; // 用户 ID 及完成数据
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const task = getTaskById(parseInt(id)); // 查询任务
        if (!task) return error(res, '任务不存在', 1, 404); // 任务不存在
        if (task.user_id !== user.id) return error(res, '无权操作该任务'); // 非本人任务
        if (task.status === 1) return error(res, '任务已完成，不可撤回'); // 已完成不可撤回

        // 若提供了完成感受或完成图片，先写入任务记录
        if (completionNote !== undefined || completionImages !== undefined) {
            const completionUpdates = {}; // 完成数据更新对象
            if (completionNote !== undefined) completionUpdates.completion_note = completionNote; // 完成感受
            if (completionImages !== undefined) { // 完成图片列表
                completionUpdates.completion_images = Array.isArray(completionImages)
                    ? JSON.stringify(completionImages) // 数组转 JSON 字符串存储
                    : completionImages; // 字符串直接存储
            }
            updateTask(parseInt(id), completionUpdates); // 写入完成数据
        }

        const updated = toggleTaskStatus(parseInt(id)); // 标记为已完成（内部会更新每日统计）
        // 通过成长任务系统发放经验（condition_type: daily_task_complete，每日上限校验）
        const xpResult = awardXpByCondition(user.id, 'daily_task_complete', 'task', parseInt(id), '完成任务: ' + (task.title || ''));
        const xpGained = xpResult ? xpResult.xpGained : 0; // 实际获得经验
        const newTotalXp = xpResult ? xpResult.newTotalXp : (user.xp || 0); // 新总经验
        const newLevel = xpResult ? xpResult.newLevel : (user.level || 1); // 新等级
        const levelUp = xpResult ? xpResult.levelUp : false; // 是否升级
        // 返回更新后的任务和经验值信息
        success(res, { ...updated, xpGained: xpGained, newxp: newTotalXp, newLevel: newLevel, levelUp: levelUp, awarded: xpResult ? xpResult.awarded : false }, '任务已完成');
    } catch (err) {
        console.error('切换任务状态失败:', err); // 记录错误
        error(res, '切换任务状态失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/tasks/date 获取指定日期任务列表
 * @query { userId, date } date 格式 YYYY-MM-DD
 */
app.get('/api/tasks/date', (req, res) => {
    try {
        const { userId, date } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应
        if (!date) return error(res, '请提供日期'); // 日期必填

        const tasks = getTasksByDate(user.id, date); // 按日期查询任务
        success(res, tasks); // 返回任务列表
    } catch (err) {
        console.error('按日期获取任务失败:', err); // 记录错误
        error(res, '按日期获取任务失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/tasks/month-dates 获取某月有任务的日期（用于日历打卡点）
 * @query { userId, year, month } month 为 1-12
 */
app.get('/api/tasks/month-dates', (req, res) => {
    try {
        const { userId, year, month } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应
        if (!year || !month) return error(res, '请提供年份和月份'); // 参数校验

        const yearNum = parseInt(year); // 年
        const monthNum = parseInt(month); // 月（1-12）
        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return error(res, '年份或月份参数不正确'); // 参数非法
        }

        // getTaskDatesByMonth 接收 0-11 月份，这里转换
        const dates = getTaskDatesByMonth(user.id, yearNum, monthNum - 1);
        success(res, dates); // 返回日期数组
    } catch (err) {
        console.error('获取月度任务日期失败:', err); // 记录错误
        error(res, '获取月度任务日期失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/stats/daily 获取某日任务统计
 * @query { userId, date } date 格式 YYYY-MM-DD
 */
app.get('/api/stats/daily', (req, res) => {
    try {
        const { userId, date } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应
        if (!date) return error(res, '请提供日期'); // 日期必填

        // 先刷新该日统计，再返回最新数据
        updateDailyTaskStats(user.id, date);
        const stats = getDailyTaskStats(user.id, date);
        success(res, stats || { user_id: user.id, task_date: date, total_tasks: 0, completed_tasks: 0, published_bottles: 0 });
    } catch (err) {
        console.error('获取每日统计失败:', err); // 记录错误
        error(res, '获取每日统计失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/stats/monthly-daily 获取某月每日统计列表
 * @query { userId, year, month } month 为 1-12
 */
app.get('/api/stats/monthly-daily', (req, res) => {
    try {
        const { userId, year, month } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应
        if (!year || !month) return error(res, '请提供年份和月份'); // 参数校验

        const yearNum = parseInt(year); // 年
        const monthNum = parseInt(month); // 月
        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return error(res, '年份或月份参数不正确'); // 参数非法
        }

        // getMonthlyDailyStats 接收 0-11 月份，这里转换
        const stats = getMonthlyDailyStats(user.id, yearNum, monthNum - 1);
        success(res, stats); // 返回月度每日统计列表
    } catch (err) {
        console.error('获取月度每日统计失败:', err); // 记录错误
        error(res, '获取月度每日统计失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/stats/weekly-daily 获取本周每日统计列表
 * @query { userId }
 */
app.get('/api/stats/weekly-daily', (req, res) => {
    try {
        const { userId } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const stats = getWeeklyDailyStats(user.id);
        success(res, stats); // 返回本周每日统计列表
    } catch (err) {
        console.error('获取本周每日统计失败:', err); // 记录错误
        error(res, '获取本周每日统计失败', 500, 500); // 返回服务器错误
    }
});

// ==================== 打卡 API ====================

/**
 * @api {post} /api/checkins 创建打卡
 * @body { userId, taskId?, date, note?, image?, mood?, published?, bottleId? }
 */
app.post('/api/checkins', (req, res) => {
    try {
        const { userId, taskId, date, note, image, mood, published, bottleId } = req.body; // 解构参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        if (!date) return error(res, '请提供打卡日期'); // 日期必填

        const checkin = createCheckin({ // 创建打卡
            user_id: user.id, // 用户 ID
            task_id: taskId, // 关联任务
            date, // 打卡日期
            note, // 备注
            image, // 图片
            mood, // 心情
            published, // 是否公开
            bottle_id: bottleId // 关联漂流瓶
        });
        success(res, checkin, '打卡成功'); // 返回创建的打卡
    } catch (err) {
        console.error('创建打卡失败:', err); // 记录错误
        error(res, '创建打卡失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/checkins 获取用户打卡记录
 * @query { userId }
 */
app.get('/api/checkins', (req, res) => {
    try {
        const { userId } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        // 支持自定义 limit（默认 100，往年今日页需拉取全部历史记录）
        const limit = req.query.limit ? parseInt(req.query.limit) : 100; // 解析 limit
        const checkins = getCheckinsByUserId(user.id, limit); // 查询打卡记录
        success(res, checkins); // 返回打卡列表
    } catch (err) {
        console.error('获取打卡记录失败:', err); // 记录错误
        error(res, '获取打卡记录失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/checkins/date 获取指定日期打卡
 * @query { userId, date }
 */
app.get('/api/checkins/date', (req, res) => {
    try {
        const { userId, date } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        if (!date) return error(res, '请提供日期'); // 日期必填

        const checkins = getCheckinsByDate(user.id, date); // 查询指定日期打卡
        success(res, checkins); // 返回打卡列表
    } catch (err) {
        console.error('获取指定日期打卡失败:', err); // 记录错误
        error(res, '获取指定日期打卡失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/checkins/history 获取打卡历史
 * @query { userId, limit? }
 */
app.get('/api/checkins/history', (req, res) => {
    try {
        const { userId, limit } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const days = limit ? parseInt(limit) : 30; // 默认 30 天
        const checkins = getCheckinHistory(user.id, days); // 查询历史
        success(res, checkins); // 返回历史列表
    } catch (err) {
        console.error('获取打卡历史失败:', err); // 记录错误
        error(res, '获取打卡历史失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/checkins/streak 获取连续打卡天数
 * @query { userId }
 */
app.get('/api/checkins/streak', (req, res) => {
    try {
        const { userId } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const streak = getCheckinStreak(user.id); // 查询连续天数
        success(res, { streak }); // 返回连续天数
    } catch (err) {
        console.error('获取连续打卡天数失败:', err); // 记录错误
        error(res, '获取连续打卡天数失败', 500, 500); // 返回服务器错误
    }
});

// ==================== 漂流瓶 API ====================

/**
 * @api {get} /api/bottles 获取漂流瓶列表（分页）
 * @query { page?, limit? }
 */
app.get('/api/bottles', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // 页码，默认 1
        const limit = parseInt(req.query.limit) || 10; // 每页数量，默认 10
        const result = getBottles(page, limit); // 查询列表
        success(res, result); // 返回列表和总数
    } catch (err) {
        console.error('获取漂流瓶列表失败:', err); // 记录错误
        error(res, '获取漂流瓶列表失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/bottles/my/:userId 获取用户发布的漂流瓶（时间倒序）
 * @remark 必须放在 /api/bottles/:id 之前，否则 "my" 会被当作 :id
 */
app.get('/api/bottles/my/:userId', (req, res) => {
    try {
        const { userId } = req.params; // 用户 ID
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const bottles = getBottlesByUserId(user.id); // 查询用户漂流瓶（已按时间倒序）
        success(res, bottles); // 返回列表
    } catch (err) {
        console.error('获取我的漂流瓶失败:', err); // 记录错误
        error(res, '获取我的漂流瓶失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/bottles/favorites/:userId 获取用户收藏的漂流瓶列表
 * @remark 必须放在 /api/bottles/:id 之前，否则 "favorites" 会被当作 :id
 */
app.get('/api/bottles/favorites/:userId', (req, res) => {
    try {
        const { userId } = req.params; // 用户 ID
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const favorites = getBottleFavoritesByUserId(user.id); // 查询用户收藏列表
        success(res, favorites); // 返回收藏列表
    } catch (err) {
        console.error('获取我的收藏失败:', err); // 记录错误
        error(res, '获取我的收藏失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/bottles/:id 获取漂流瓶详情
 */
app.get('/api/bottles/:id', (req, res) => {
    try {
        const { id } = req.params; // 漂流瓶 ID
        const bottle = getBottleById(parseInt(id)); // 查询漂流瓶
        if (!bottle) return error(res, '漂流瓶不存在', 1, 404); // 不存在

        success(res, bottle); // 返回详情
    } catch (err) {
        console.error('获取漂流瓶详情失败:', err); // 记录错误
        error(res, '获取漂流瓶详情失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/bottles 创建漂流瓶
 * @body { userId, content, image?, mood?, tag? }
 */
app.post('/api/bottles', (req, res) => {
    try {
        const { userId, content, image, mood, tag } = req.body; // 解构参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        if (!content) return error(res, '请输入内容'); // 内容必填

        const bottle = createBottle({ // 创建漂流瓶
            user_id: user.id, // 用户 ID
            author_name: user.nickname || user.username, // 作者名
            author_avatar: user.avatar, // 作者头像
            content, // 内容
            image, // 图片
            mood, // 心情
            tag // 标签
        });
        // 发布漂流瓶后，更新当日每日任务统计（published_bottles +1）
        const today = new Date().toISOString().split('T')[0]; // 今日日期
        updateDailyTaskStats(user.id, today);
        // 通过成长任务系统发放经验（condition_type: daily_publish_bottle）
        const xpResult = awardXpByCondition(user.id, 'daily_publish_bottle', 'bottle', bottle.id, '发布漂流瓶');
        success(res, { ...bottle, xpGained: xpResult ? xpResult.xpGained : 0, awarded: xpResult ? xpResult.awarded : false }, '发布成功'); // 返回创建的漂流瓶
    } catch (err) {
        console.error('创建漂流瓶失败:', err); // 记录错误
        error(res, '创建漂流瓶失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {delete} /api/bottles/:id 删除漂流瓶
 */
app.delete('/api/bottles/:id', (req, res) => {
    try {
        const { id } = req.params; // 漂流瓶 ID
        const bottle = getBottleById(parseInt(id)); // 查询漂流瓶
        if (!bottle) return error(res, '漂流瓶不存在', 1, 404); // 不存在

        const result = removeBottle(parseInt(id)); // 移除漂流瓶
        if (!result) return error(res, '删除失败'); // 删除失败

        success(res, null, '删除成功'); // 返回成功
    } catch (err) {
        console.error('删除漂流瓶失败:', err); // 记录错误
        error(res, '删除漂流瓶失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/bottles/:id/like 切换点赞
 * @body { userId }
 */
app.post('/api/bottles/:id/like', (req, res) => {
    try {
        const { id } = req.params; // 漂流瓶 ID
        const { userId } = req.body; // 用户 ID
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const bottle = getBottleById(parseInt(id)); // 查询漂流瓶
        if (!bottle) return error(res, '漂流瓶不存在', 1, 404); // 不存在

        const liked = toggleLike(parseInt(id), user.id); // 切换点赞
        const updated = getBottleById(parseInt(id)); // 重新获取

        // 仅在点赞成功时（非取消点赞）发放经验
        let xpGained = 0; // 经验值
        let awarded = false; // 是否发放
        if (liked) { // 点赞成功
            const xpResult = awardXpByCondition(user.id, 'daily_like', 'bottle', parseInt(id), '点赞漂流瓶');
            xpGained = xpResult ? xpResult.xpGained : 0; // 获得经验
            awarded = xpResult ? xpResult.awarded : false; // 是否发放
        }

        success(res, { liked, likes_count: updated.likes_count, xpGained: xpGained, awarded: awarded }, liked ? '点赞成功' : '取消点赞'); // 返回点赞状态
    } catch (err) {
        console.error('点赞失败:', err); // 记录错误
        error(res, '点赞失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/bottles/:id/comments 获取评论列表
 */
app.get('/api/bottles/:id/comments', (req, res) => {
    try {
        const { id } = req.params; // 漂流瓶 ID
        const bottle = getBottleById(parseInt(id)); // 查询漂流瓶
        if (!bottle) return error(res, '漂流瓶不存在', 1, 404); // 不存在

        const comments = getCommentsByBottleId(parseInt(id)); // 查询评论
        success(res, comments); // 返回评论列表
    } catch (err) {
        console.error('获取评论失败:', err); // 记录错误
        error(res, '获取评论失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/bottles/:id/comments 创建评论
 * @body { userId, content }
 */
app.post('/api/bottles/:id/comments', (req, res) => {
    try {
        const { id } = req.params; // 漂流瓶 ID
        const { userId, content } = req.body; // 解构参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        if (!content) return error(res, '请输入评论内容'); // 内容必填

        const bottle = getBottleById(parseInt(id)); // 查询漂流瓶
        if (!bottle) return error(res, '漂流瓶不存在', 1, 404); // 不存在

        const comment = createComment({ // 创建评论
            bottle_id: parseInt(id), // 漂流瓶 ID
            user_id: user.id, // 用户 ID
            user_name: user.nickname || user.username, // 用户名
            user_avatar: user.avatar, // 用户头像
            content // 评论内容
        });
        success(res, comment, '评论成功'); // 返回创建的评论
    } catch (err) {
        console.error('创建评论失败:', err); // 记录错误
        error(res, '创建评论失败', 500, 500); // 返回服务器错误
    }
});

// ==================== 漂流瓶收藏 API ====================

/**
 * @api {post} /api/bottles/:id/favorite 切换收藏漂流瓶
 * @body { userId }
 */
app.post('/api/bottles/:id/favorite', (req, res) => {
    try {
        const { id } = req.params; // 漂流瓶 ID
        const { userId } = req.body; // 用户 ID
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const bottle = getBottleById(parseInt(id)); // 查询漂流瓶
        if (!bottle) return error(res, '漂流瓶不存在', 1, 404); // 不存在

        const result = toggleBottleFavorite(user.id, parseInt(id)); // 切换收藏
        success(res, result, result.favorited ? '收藏成功' : '已取消收藏'); // 返回结果
    } catch (err) {
        console.error('收藏操作失败:', err); // 记录错误
        error(res, '收藏操作失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/bottles/:id/favorite 检查是否已收藏
 * @query { userId }
 */
app.get('/api/bottles/:id/favorite', (req, res) => {
    try {
        const { id } = req.params; // 漂流瓶 ID
        const { userId } = req.query; // 用户 ID
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const favorited = isBottleFavorited(user.id, parseInt(id)); // 检查收藏
        success(res, { favorited }); // 返回状态
    } catch (err) {
        console.error('检查收藏失败:', err); // 记录错误
        error(res, '检查收藏失败', 500, 500); // 返回服务器错误
    }
});

// ==================== 意见反馈 API ====================

/**
 * @api {post} /api/feedback 提交意见反馈
 * @body { userId, content, contact? }
 */
app.post('/api/feedback', (req, res) => {
    try {
        const { userId, content, contact } = req.body; // 解构参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        if (!content) return error(res, '请输入反馈内容'); // 内容必填

        const feedback = createFeedback(user.id, content, contact); // 创建反馈
        success(res, feedback, '提交成功，感谢您的反馈'); // 返回成功
    } catch (err) {
        console.error('提交反馈失败:', err); // 记录错误
        error(res, '提交反馈失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/feedback 获取用户反馈列表
 * @query { userId }
 */
app.get('/api/feedback', (req, res) => {
    try {
        const { userId } = req.query; // 用户 ID
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const list = getFeedbacksByUserId(user.id); // 查询反馈列表
        success(res, list); // 返回列表
    } catch (err) {
        console.error('获取反馈列表失败:', err); // 记录错误
        error(res, '获取反馈列表失败', 500, 500); // 返回服务器错误
    }
});

// ==================== 挑战打卡记录 API ====================

/**
 * @api {get} /api/challenges/checkins/all 获取用户所有挑战打卡记录
 * @query { userId }
 */
app.get('/api/challenges/checkins/all', (req, res) => {
    try {
        const { userId } = req.query; // 用户 ID
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const list = getAllChallengeCheckinsByUserId(user.id); // 查询所有打卡记录
        success(res, list); // 返回列表
    } catch (err) {
        console.error('获取挑战打卡记录失败:', err); // 记录错误
        error(res, '获取挑战打卡记录失败', 500, 500); // 返回服务器错误
    }
});

// ==================== 挑战 API ====================

/**
 * @api {get} /api/challenges 获取所有挑战
 */
app.get('/api/challenges', (req, res) => {
    try {
        const challenges = getChallenges(); // 查询所有挑战
        success(res, challenges); // 返回挑战列表
    } catch (err) {
        console.error('获取挑战列表失败:', err); // 记录错误
        error(res, '获取挑战列表失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/challenges/user/:userId 获取用户参加的挑战（带打卡次数和今日打卡状态）
 */
app.get('/api/challenges/user/:userId', (req, res) => {
    try {
        const { userId } = req.params; // 用户 ID
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const list = getChallengesByUserId(user.id); // 查询用户挑战
        success(res, list); // 返回挑战列表
    } catch (err) {
        console.error('获取用户挑战失败:', err); // 记录错误
        error(res, '获取用户挑战失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/challenges/my/past 获取用户已完成的往期挑战
 * @query { userId }
 */
app.get('/api/challenges/my/past', (req, res) => {
    try {
        const { userId } = req.query; // 用户 ID
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const list = getCompletedChallengesByUserId(user.id); // 查询往期挑战（成功和失败）
        const stats = getChallengeStatsByUserId(user.id); // 查询统计（成功次数和失败次数）
        success(res, { list: list, success_count: stats.success_count, failed_count: stats.failed_count }); // 返回列表和统计
    } catch (err) {
        console.error('获取往期挑战失败:', err); // 记录错误
        error(res, '获取往期挑战失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/challenges/:id 获取挑战详情（含用户参与状态和打卡信息）
 * @query { userId } 当前用户 ID（可选）
 */
app.get('/api/challenges/:id', (req, res) => {
    try {
        const { id } = req.params; // 挑战 ID
        const { userId } = req.query; // 当前用户 ID（可选）
        let uid = null; // 用户 ID
        if (userId) { // 如果传了 userId
            const user = getUserById(parseInt(userId)); // 查询用户
            if (user) uid = user.id; // 设置 uid
        }
        const detail = getChallengeDetail(parseInt(id), uid); // 获取详情
        if (!detail) return error(res, '挑战不存在', 1, 404); // 不存在

        success(res, detail); // 返回挑战详情
    } catch (err) {
        console.error('获取挑战详情失败:', err); // 记录错误
        error(res, '获取挑战详情失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/challenges/:id/join 加入挑战
 * @body { userId }
 */
app.post('/api/challenges/:id/join', (req, res) => {
    try {
        const { id } = req.params; // 挑战 ID
        const { userId } = req.body; // 用户 ID
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const challenge = getChallengeById(parseInt(id)); // 查询挑战
        if (!challenge) return error(res, '挑战不存在', 1, 404); // 不存在

        const participant = joinChallenge(parseInt(id), user.id); // 加入挑战
        success(res, participant, '加入成功'); // 返回参与记录
    } catch (err) {
        console.error('加入挑战失败:', err); // 记录错误
        error(res, '加入挑战失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/challenges/:id/ranking 获取排行榜（按打卡次数降序，Top 10）
 */
app.get('/api/challenges/:id/ranking', (req, res) => {
    try {
        const { id } = req.params; // 挑战 ID
        const challenge = getChallengeById(parseInt(id)); // 查询挑战
        if (!challenge) return error(res, '挑战不存在', 1, 404); // 不存在

        const ranking = getChallengeRanking(parseInt(id), 10); // 查询 Top 10 排行榜
        success(res, ranking); // 返回排行榜
    } catch (err) {
        console.error('获取排行榜失败:', err); // 记录错误
        error(res, '获取排行榜失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/challenges/:id/participant 获取参与状态
 * @query { userId }
 */
app.get('/api/challenges/:id/participant', (req, res) => {
    try {
        const { id } = req.params; // 挑战 ID
        const { userId } = req.query; // 用户 ID
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const participant = getParticipant(parseInt(id), user.id); // 查询参与记录
        success(res, participant); // 返回参与状态（未参与则为 null）
    } catch (err) {
        console.error('获取参与状态失败:', err); // 记录错误
        error(res, '获取参与状态失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/challenges/:id/checkin 挑战打卡（不跳转，直接触发）
 * @body { userId }
 */
app.post('/api/challenges/:id/checkin', (req, res) => {
    try {
        const { id } = req.params; // 挑战 ID
        const { userId } = req.body; // 用户 ID
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const challengeId = parseInt(id); // 挑战 ID 转数字
        const result = checkinChallenge(user.id, challengeId); // 执行打卡
        if (!result.success) {
            return error(res, result.message); // 打卡失败
        }
        success(res, result.data, result.message); // 返回打卡结果
    } catch (err) {
        console.error('挑战打卡失败:', err); // 记录错误
        error(res, '挑战打卡失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/challenges/:id/moments 获取挑战营友动态
 * @query { userId, limit, offset }
 */
app.get('/api/challenges/:id/moments', (req, res) => {
    try {
        const { id } = req.params; // 挑战 ID
        const { userId } = req.query; // 当前用户 ID
        const limit = Math.min(parseInt(req.query.limit) || 20, 100); // 限制条数
        const offset = parseInt(req.query.offset) || 0; // 偏移量

        let uid = null; // 当前用户 ID
        if (userId) { // 如果传了 userId
            const user = getUserById(parseInt(userId)); // 查询用户
            if (user) uid = user.id; // 设置 uid
        }
        const moments = getChallengeMoments(limit, offset, uid, parseInt(id)); // 查询动态
        success(res, moments); // 返回动态列表
    } catch (err) {
        console.error('获取挑战动态失败:', err); // 记录错误
        error(res, '获取挑战动态失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/challenges/moments/:momentId/like 切换挑战动态点赞
 * @body { userId }
 */
app.post('/api/challenges/moments/:momentId/like', (req, res) => {
    try {
        const { momentId } = req.params; // 动态 ID
        const { userId } = req.body; // 用户 ID
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const result = toggleChallengeMomentLike(user.id, parseInt(momentId)); // 切换点赞
        success(res, result, result.liked ? '点赞成功' : '已取消点赞'); // 返回结果
    } catch (err) {
        console.error('挑战动态点赞失败:', err); // 记录错误
        error(res, '挑战动态点赞失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/challenges/moments 获取所有挑战动态（营友动态流）
 * @query { userId, limit, offset }
 */
app.get('/api/challenges/moments', (req, res) => {
    try {
        const { userId } = req.query; // 当前用户 ID
        const limit = Math.min(parseInt(req.query.limit) || 20, 100); // 限制条数
        const offset = parseInt(req.query.offset) || 0; // 偏移量

        let uid = null; // 当前用户 ID
        if (userId) { // 如果传了 userId
            const user = getUserById(parseInt(userId)); // 查询用户
            if (user) uid = user.id; // 设置 uid
        }
        const moments = getChallengeMoments(limit, offset, uid); // 查询所有动态
        success(res, moments); // 返回动态列表
    } catch (err) {
        console.error('获取挑战动态失败:', err); // 记录错误
        error(res, '获取挑战动态失败', 500, 500); // 返回服务器错误
    }
});

// ==================== 时间胶囊 API ====================

/**
 * @api {get} /api/capsules/openable 获取可开启的胶囊
 * @query { userId }
 */
app.get('/api/capsules/openable', (req, res) => {
    try {
        const { userId } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const capsules = getOpenableCapsules(user.id); // 查询可开启胶囊
        success(res, capsules); // 返回胶囊列表
    } catch (err) {
        console.error('获取可开启胶囊失败:', err); // 记录错误
        error(res, '获取可开启胶囊失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/capsules 获取用户胶囊列表
 * @query { userId }
 */
app.get('/api/capsules', (req, res) => {
    try {
        const { userId } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const capsules = getCapsulesByUserId(user.id); // 查询胶囊列表
        success(res, capsules); // 返回胶囊列表
    } catch (err) {
        console.error('获取胶囊列表失败:', err); // 记录错误
        error(res, '获取胶囊列表失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/capsules/:id 获取胶囊详情
 */
app.get('/api/capsules/:id', (req, res) => {
    try {
        const { id } = req.params; // 胶囊 ID
        const capsule = getCapsuleById(parseInt(id)); // 查询胶囊
        if (!capsule) return error(res, '胶囊不存在', 1, 404); // 不存在

        success(res, capsule); // 返回胶囊详情
    } catch (err) {
        console.error('获取胶囊详情失败:', err); // 记录错误
        error(res, '获取胶囊详情失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/capsules 创建胶囊
 * @body { userId, title, content?, voiceNote?, openDate }
 */
app.post('/api/capsules', (req, res) => {
    try {
        const { userId, title, content, voiceNote, openDate } = req.body; // 解构参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        if (!title) return error(res, '请输入标题'); // 标题必填
        if (!openDate) return error(res, '请选择开启日期'); // 开启日期必填

        const capsule = createCapsule({ // 创建胶囊
            user_id: user.id, // 用户 ID
            title, // 标题
            content, // 内容
            voice_note: voiceNote, // 语音备注
            open_date: openDate // 开启日期
        });
        success(res, capsule, '胶囊创建成功'); // 返回创建的胶囊
    } catch (err) {
        console.error('创建胶囊失败:', err); // 记录错误
        error(res, '创建胶囊失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/capsules/:id/open 开启胶囊
 */
app.post('/api/capsules/:id/open', (req, res) => {
    try {
        const { id } = req.params; // 胶囊 ID
        const capsule = getCapsuleById(parseInt(id)); // 查询胶囊
        if (!capsule) return error(res, '胶囊不存在', 1, 404); // 不存在
        if (capsule.status === 'opened') return error(res, '胶囊已开启'); // 已开启

        // 校验是否到了开启日期
        const today = new Date().toISOString().slice(0, 10); // 今日日期
        if (capsule.open_date > today) {
            return error(res, '尚未到开启日期'); // 未到日期
        }

        const opened = openCapsule(parseInt(id)); // 开启胶囊
        success(res, opened, '开启成功'); // 返回开启后的胶囊
    } catch (err) {
        console.error('开启胶囊失败:', err); // 记录错误
        error(res, '开启胶囊失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {delete} /api/capsules/:id 删除时间胶囊
 * @query { userId } 当前用户 ID（用于归属权校验）
 */
app.delete('/api/capsules/:id', (req, res) => {
    try {
        const { id } = req.params; // 胶囊 ID
        const { userId } = req.query; // 用户 ID
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const result = deleteCapsule(parseInt(id), user.id); // 删除胶囊（含归属权校验）
        if (!result.success) {
            return error(res, result.error || '删除失败', 1, 400); // 删除失败
        }
        success(res, { deleted: result.deleted }, '删除成功'); // 返回删除结果
    } catch (err) {
        console.error('删除胶囊失败:', err); // 记录错误
        error(res, '删除胶囊失败', 500, 500); // 返回服务器错误
    }
});

// ==================== 消息 API ====================

/**
 * @api {get} /api/messages/unread 获取未读数量
 * @query { userId }
 */
app.get('/api/messages/unread', (req, res) => {
    try {
        const { userId } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const count = getUnreadCount(user.id); // 查询未读数量
        success(res, { count }); // 返回未读数量
    } catch (err) {
        console.error('获取未读数量失败:', err); // 记录错误
        error(res, '获取未读数量失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/messages/type 按类型获取消息
 * @query { userId, type }
 */
app.get('/api/messages/type', (req, res) => {
    try {
        const { userId, type } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        if (!type) return error(res, '请提供消息类型'); // 类型必填

        const messages = getMessagesByType(user.id, type); // 按类型查询
        success(res, messages); // 返回消息列表
    } catch (err) {
        console.error('按类型获取消息失败:', err); // 记录错误
        error(res, '按类型获取消息失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/messages 获取用户消息
 * @query { userId }
 */
app.get('/api/messages', (req, res) => {
    try {
        const { userId } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const messages = getMessagesByUserId(user.id); // 查询消息
        success(res, messages); // 返回消息列表
    } catch (err) {
        console.error('获取消息列表失败:', err); // 记录错误
        error(res, '获取消息列表失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {put} /api/messages/read-all 全部已读
 * @query { userId }
 */
app.put('/api/messages/read-all', (req, res) => {
    try {
        const { userId } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const result = markAllRead(user.id); // 全部已读
        if (!result) return error(res, '操作失败'); // 操作失败

        success(res, null, '全部已读'); // 返回成功
    } catch (err) {
        console.error('全部已读失败:', err); // 记录错误
        error(res, '全部已读失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {put} /api/messages/:id/read 标记消息已读
 */
app.put('/api/messages/:id/read', (req, res) => {
    try {
        const { id } = req.params; // 消息 ID
        const result = markMessageRead(parseInt(id)); // 标记已读
        if (!result) return error(res, '消息不存在或已读'); // 操作失败

        success(res, null, '已标记已读'); // 返回成功
    } catch (err) {
        console.error('标记消息已读失败:', err); // 记录错误
        error(res, '标记消息已读失败', 500, 500); // 返回服务器错误
    }
});

// ==================== 徽章 API ====================

/**
 * @api {get} /api/badges 获取所有徽章
 */
app.get('/api/badges', (req, res) => {
    try {
        const badges = getBadges(); // 查询所有徽章
        success(res, badges); // 返回徽章列表
    } catch (err) {
        console.error('获取徽章列表失败:', err); // 记录错误
        error(res, '获取徽章列表失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/badges/user/:userId 获取用户徽章
 */
app.get('/api/badges/user/:userId', (req, res) => {
    try {
        const { userId } = req.params; // 用户 ID
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const badges = getUserBadges(user.id); // 查询用户徽章
        success(res, badges); // 返回徽章列表
    } catch (err) {
        console.error('获取用户徽章失败:', err); // 记录错误
        error(res, '获取用户徽章失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {post} /api/badges/award 授予用户徽章
 * @body { userId, badgeId }
 */
app.post('/api/badges/award', (req, res) => {
    try {
        const { userId, badgeId } = req.body; // 解构参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        if (!badgeId) return error(res, '请提供徽章ID'); // 徽章ID必填

        const badge = getBadgeById(parseInt(badgeId)); // 查询徽章
        if (!badge) return error(res, '徽章不存在', 1, 404); // 不存在

        if (hasBadge(user.id, parseInt(badgeId))) { // 已拥有
            return success(res, null, '已拥有该徽章'); // 返回成功
        }

        const awarded = awardBadge(user.id, parseInt(badgeId)); // 授予徽章
        success(res, awarded, '徽章授予成功'); // 返回成功
    } catch (err) {
        console.error('授予徽章失败:', err); // 记录错误
        error(res, '授予徽章失败', 500, 500); // 返回服务器错误
    }
});

// ==================== 专注记录 API ====================

/**
 * @api {post} /api/focus 创建专注记录
 * @body { userId, durationMinutes, taskName?, completed? }
 */
app.post('/api/focus', (req, res) => {
    try {
        const { userId, durationMinutes, taskName, completed } = req.body; // 解构参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        if (durationMinutes === undefined || durationMinutes === null) {
            return error(res, '请提供专注时长'); // 时长必填
        }

        const session = createFocusSession({ // 创建专注记录
            user_id: user.id, // 用户 ID
            duration_minutes: parseInt(durationMinutes), // 时长（分钟）
            task_name: taskName, // 任务名
            completed: completed ? 1 : 0 // 是否完成
        });
        success(res, session, '专注记录已保存'); // 返回创建的记录
    } catch (err) {
        console.error('创建专注记录失败:', err); // 记录错误
        error(res, '创建专注记录失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/focus/stats 获取专注统计
 * @query { userId }
 */
app.get('/api/focus/stats', (req, res) => {
    try {
        const { userId } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const stats = getFocusStats(user.id); // 查询专注统计
        success(res, stats); // 返回统计结果
    } catch (err) {
        console.error('获取专注统计失败:', err); // 记录错误
        error(res, '获取专注统计失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/focus 获取专注记录
 * @query { userId, limit? }
 */
app.get('/api/focus', (req, res) => {
    try {
        const { userId, limit } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const limitNum = limit ? parseInt(limit) : 100; // 默认 100 条
        const sessions = getFocusSessionsByUserId(user.id, limitNum); // 查询记录
        success(res, sessions); // 返回记录列表
    } catch (err) {
        console.error('获取专注记录失败:', err); // 记录错误
        error(res, '获取专注记录失败', 500, 500); // 返回服务器错误
    }
});

// ==================== 统计 API ====================

/**
 * @api {get} /api/stats/profile 获取用户主页统计数据
 * @query { userId }
 * 返回累计打卡数、漂流瓶数、点赞数、打卡热力图、月度统计
 */
app.get('/api/stats/profile', (req, res) => {
    try {
        const { userId } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const checkins = getCheckinsByUserId(user.id, 100000); // 查询全部打卡
        const userTasks = getTasksByUserId(user.id); // 查询用户全部任务
        const oceanTaskCount = userTasks.filter(t => t.show_in_ocean === 1).length; // 投入漂流海洋的任务数

        // 打卡热力图数据：按日期分组计数
        const heatmapMap = {}; // 日期 -> 数量
        for (const c of checkins) { // 遍历打卡
            if (c.date) { // 日期存在
                heatmapMap[c.date] = (heatmapMap[c.date] || 0) + 1; // 计数 +1
            }
        }
        const heatmap = Object.entries(heatmapMap).map(([date, count]) => ({ date, count })); // 转数组

        // 月度统计：本月打卡数
        const now = new Date(); // 当前时间
        const yearMonth = now.toISOString().slice(0, 7); // 当前年月 YYYY-MM
        const monthCheckins = checkins.filter(c => c.date && c.date.startsWith(yearMonth)).length; // 本月打卡数

        success(res, {
            totalCheckins: checkins.length, // 累计打卡数
            totalBottles: oceanTaskCount, // 投入漂流海洋的任务数（原 bottles 表已废弃）
            totalLikes: 0, // 点赞数（bottles 表已废弃，固定为 0）
            heatmap, // 热力图数据
            monthCheckins // 本月打卡数
        });
    } catch (err) {
        console.error('获取主页统计失败:', err); // 记录错误
        error(res, '获取主页统计失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/stats/today 获取今日页统计数据
 * @query { userId }
 * 返回任务完成情况、连续打卡天数、等级信息
 */
app.get('/api/stats/today', (req, res) => {
    try {
        const { userId } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const todayTasks = getTodayTasks(user.id); // 查询今日任务
        const completedTasks = todayTasks.filter(t => t.status === 1).length; // 已完成任务数
        const streak = getCheckinStreak(user.id); // 连续打卡天数

        success(res, {
            tasks: {
                total: todayTasks.length, // 今日任务总数
                completed: completedTasks, // 已完成数
                pending: todayTasks.length - completedTasks // 待完成数
            },
            streak, // 连续打卡天数
            level: {
                level: user.level || 1, // 等级
                xp: user.xp || 0 // 经验值
            }
        });
    } catch (err) {
        console.error('获取今日统计失败:', err); // 记录错误
        error(res, '获取今日统计失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/stats/weekly 获取周报数据
 * @query { userId }
 */
app.get('/api/stats/weekly', (req, res) => {
    try {
        const { userId } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const weeklyStats = getWeeklyStats(user.id); // 查询周统计
        success(res, weeklyStats); // 返回周报数据
    } catch (err) {
        console.error('获取周报数据失败:', err); // 记录错误
        error(res, '获取周报数据失败', 500, 500); // 返回服务器错误
    }
});

// ==================== 等级系统 API ====================

/**
 * @api {get} /api/level/info 获取用户等级信息
 * @query { userId }
 */
app.get('/api/level/info', (req, res) => {
    try {
        const { userId } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const levelInfo = getUserLevel(user.id); // 查询用户等级信息
        const todayXpGained = getTodayXpGained(user.id); // 今日已获经验
        success(res, { ...levelInfo, today_xp_gained: todayXpGained }); // 返回等级信息
    } catch (err) {
        console.error('获取等级信息失败:', err); // 记录错误
        error(res, '获取等级信息失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/level/configs 获取所有等级配置
 */
app.get('/api/level/configs', (req, res) => {
    try {
        const configs = getAllLevelConfigs(); // 查询所有等级配置
        success(res, configs); // 返回配置列表
    } catch (err) {
        console.error('获取等级配置失败:', err); // 记录错误
        error(res, '获取等级配置失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/level/growth-tasks 获取成长任务列表
 * @query { category } 可选，daily 或 cumulative
 */
app.get('/api/level/growth-tasks', (req, res) => {
    try {
        const { category } = req.query; // 获取分类参数
        const tasks = getGrowthTasks(category || null); // 查询成长任务
        success(res, tasks); // 返回任务列表
    } catch (err) {
        console.error('获取成长任务失败:', err); // 记录错误
        error(res, '获取成长任务失败', 500, 500); // 返回服务器错误
    }
});

/**
 * @api {get} /api/level/growth-logs 获取用户经验日志
 * @query { userId, limit?, offset? }
 */
app.get('/api/level/growth-logs', (req, res) => {
    try {
        const { userId, limit, offset } = req.query; // 获取查询参数
        const user = validateUserId(req, res, userId); // 校验用户
        if (!user) return; // 校验失败已响应

        const logs = getUserGrowthLogs(user.id, parseInt(limit) || 50, parseInt(offset) || 0); // 查询日志
        success(res, logs); // 返回日志列表
    } catch (err) {
        console.error('获取经验日志失败:', err); // 记录错误
        error(res, '获取经验日志失败', 500, 500); // 返回服务器错误
    }
});

// 处理前端路由（所有非 API 的 GET 请求都返回 index.html，让前端处理）
app.get(/^(?!\/api\/).+/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html')); // 返回前端入口
});

// 启动服务器
app.listen(PORT, () => {
    console.log(''); // 空行
    console.log('  ┌─────────────────────────────────────────┐'); // 边框
    console.log('  │  🌱 成长漂流瓶 - 后端服务已启动         │'); // 服务名
    console.log('  ├─────────────────────────────────────────┤'); // 分隔线
    console.log(`  │  🌐 本地地址: http://localhost:${PORT}       │`); // 本地地址
    console.log(`  │  📁 前端页面: ${distPath.slice(0, 40)}…  │`); // 前端路径
    console.log('  │  🗃️  数据库: SQLite                      │'); // 数据库类型
    console.log('  ├─────────────────────────────────────────┤'); // 分隔线
    console.log('  │  默认测试账号: demo / 123456            │'); // 测试账号
    console.log('  └─────────────────────────────────────────┘'); // 边框
    console.log(''); // 空行
});
