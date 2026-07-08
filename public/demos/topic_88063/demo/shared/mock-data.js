/**
 * 路见 Demo - 模拟数据生成
 * 生成 30 条上报记录、用户列表、统计数据等
 * 挂载到 window.LJ.mockData
 */
(function (global) {
  const LJ = global.LJ || (global.LJ = {})

  /**
   * 当前登录用户（小程序端模拟用户）
   */
  const currentUser = {
    openid: 'user_demo_001',
    nickName: ' demo 体验用户',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lujian',
    city: '北京市',
    registerTime: '2026-05-01 09:00'
  }

  /**
   * 上报者列表（后台管理用）
   */
  const reporters = [
    { openid: 'user_001', nickName: '李明', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liming', phone: '138****1234', totalReports: 12, fixedCount: 8, verifyCount: 5 },
    { openid: 'user_002', nickName: '王芳', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangfang', phone: '139****5678', totalReports: 8, fixedCount: 6, verifyCount: 3 },
    { openid: 'user_003', nickName: '张伟', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangwei', phone: '137****9012', totalReports: 15, fixedCount: 10, verifyCount: 7 },
    { openid: 'user_004', nickName: '陈静', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenjing', phone: '136****3456', totalReports: 5, fixedCount: 3, verifyCount: 2 },
    { openid: 'user_005', nickName: '刘洋', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liuyang', phone: '135****7890', totalReports: 20, fixedCount: 15, verifyCount: 12 },
    { openid: 'user_demo_001', nickName: 'demo 体验用户', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lujian', phone: '188****8888', totalReports: 3, fixedCount: 1, verifyCount: 1 }
  ]

  /**
   * 处理人列表（后台管理用）
   */
  const handlers = [
    { id: 'handler_001', name: '张工', role: '市政维修员', department: '东城区城管局' },
    { id: 'handler_002', name: '李师傅', role: '设施维护员', department: '西城区城管局' },
    { id: 'handler_003', name: '王队长', role: '施工队长', department: '朝阳区市政中心' },
    { id: 'handler_004', name: '赵主管', role: '物业主管', department: '海淀物业管理处' }
  ]

  /**
   * 北京地点列表（用于上报位置）
   */
  const locations = [
    { latitude: 39.908823, longitude: 116.397470, address: '北京市东城区天安门广场' },
    { latitude: 39.914860, longitude: 116.417230, address: '北京市东城区王府井大街' },
    { latitude: 39.904200, longitude: 116.370820, address: '北京市西城区西单北大街' },
    { latitude: 39.924090, longitude: 116.435460, address: '北京市朝阳区朝阳门外大街' },
    { latitude: 39.909840, longitude: 116.434180, address: '北京市朝阳区建国门外大街' },
    { latitude: 39.939720, longitude: 116.457080, address: '北京市朝阳区工体北路' },
    { latitude: 39.984700, longitude: 116.307600, address: '北京市海淀区中关村大街' },
    { latitude: 39.959700, longitude: 116.298200, address: '北京市海淀区学院路' },
    { latitude: 39.875000, longitude: 116.397000, address: '北京市丰台区南三环中路' },
    { latitude: 39.937200, longitude: 116.397500, address: '北京市东城区东单北大街' },
    { latitude: 39.902700, longitude: 116.427500, address: '北京市东城区崇文门外大街' },
    { latitude: 39.941200, longitude: 116.419500, address: '北京市东城区安定门内大街' }
  ]

  /**
   * 上报数据模板
   * 每条记录定义关键字段，其他字段由生成函数补全
   * status 分布：pending 6, approved 4, processing 4, fixed 5, verified 5, rejected 2
   */
  const reportTemplates = [
    // 待审核 6 条
    { typeId: 'blind_path_blocked', desc: '该处盲道被共享单车大面积占用，影响视障人士通行', locIdx: 1, status: 'pending', daysAgo: 0, reporterIdx: 0 },
    { typeId: 'ramp_damaged', desc: '商场入口坡道破损严重，轮椅无法通行', locIdx: 3, status: 'pending', daysAgo: 0, reporterIdx: 2 },
    { typeId: 'elevator_broken', desc: '地铁站无障碍电梯停运，老年人无法出站', locIdx: 4, status: 'pending', daysAgo: 1, reporterIdx: 4 },
    { typeId: 'parking_blocked', desc: '无障碍停车位被私家车长期占用', locIdx: 6, status: 'pending', daysAgo: 1, reporterIdx: 1 },
    { typeId: 'handrail_missing', desc: '天桥扶手松动脱落，存在安全隐患', locIdx: 8, status: 'pending', daysAgo: 2, reporterIdx: 3 },
    { typeId: 'blind_path_damaged', desc: '盲道砖块缺失，路面不平整', locIdx: 9, status: 'pending', daysAgo: 2, reporterIdx: 5 },

    // 已审核待处理 4 条
    { typeId: 'blind_path_blocked', desc: '盲道被施工围挡占用，已持续一周', locIdx: 2, status: 'approved', daysAgo: 3, reporterIdx: 0, auditor: '审核员A', auditRemark: '情况属实，需尽快处理', handler: '张工' },
    { typeId: 'toilet_inaccessible', desc: '无障碍卫生间长期关闭，门锁损坏', locIdx: 5, status: 'approved', daysAgo: 3, reporterIdx: 2, auditor: '审核员A', auditRemark: '已通知物业处理', handler: '赵主管' },
    { typeId: 'ramp_missing', desc: '人行道缺少坡道，婴儿车无法上下', locIdx: 7, status: 'approved', daysAgo: 4, reporterIdx: 4, auditor: '审核员B', auditRemark: '需增设坡道', handler: '李师傅' },
    { typeId: 'tactile_paving_missing', desc: '路口缺少触觉指示砖', locIdx: 10, status: 'approved', daysAgo: 4, reporterIdx: 1, auditor: '审核员A', auditRemark: '列入改造计划', handler: '王队长' },

    // 处理中 4 条
    { typeId: 'blind_path_blocked', desc: '盲道被流动摊贩占用', locIdx: 0, status: 'processing', daysAgo: 5, reporterIdx: 3, auditor: '审核员B', auditRemark: '情况属实', handler: '张工', processRemark: '已安排执法人员清理' },
    { typeId: 'elevator_broken', desc: '商场无障碍电梯故障', locIdx: 1, status: 'processing', daysAgo: 5, reporterIdx: 5, auditor: '审核员A', auditRemark: '通知维修', handler: '赵主管', processRemark: '维修人员已到场检修' },
    { typeId: 'ramp_damaged', desc: '坡道防滑条脱落', locIdx: 4, status: 'processing', daysAgo: 6, reporterIdx: 2, auditor: '审核员A', auditRemark: '需重新铺设', handler: '李师傅', processRemark: '材料已采购，明日施工' },
    { typeId: 'handrail_missing', desc: '公交站缺少无障碍扶手', locIdx: 11, status: 'processing', daysAgo: 6, reporterIdx: 4, auditor: '审核员B', auditRemark: '需增设扶手', handler: '王队长', processRemark: '施工队已进场' },

    // 已修复待验证 5 条
    { typeId: 'blind_path_blocked', desc: '盲道被共享单车占用', locIdx: 9, status: 'fixed', daysAgo: 7, reporterIdx: 0, auditor: '审核员A', auditRemark: '情况属实', handler: '张工', processRemark: '已清理占用车辆', fixRemark: '清理完毕，盲道恢复畅通' },
    { typeId: 'ramp_damaged', desc: '坡道表面破损', locIdx: 3, status: 'fixed', daysAgo: 8, reporterIdx: 2, auditor: '审核员B', auditRemark: '需修复', handler: '李师傅', processRemark: '已重新铺设', fixRemark: '坡道修复完成，可正常使用' },
    { typeId: 'parking_blocked', desc: '无障碍停车位被占', locIdx: 6, status: 'fixed', daysAgo: 8, reporterIdx: 4, auditor: '审核员A', auditRemark: '通知物业', handler: '赵主管', processRemark: '已加强管理', fixRemark: '增设标识，加强巡查' },
    { typeId: 'elevator_broken', desc: '电梯按钮失灵', locIdx: 5, status: 'fixed', daysAgo: 9, reporterIdx: 1, auditor: '审核员A', auditRemark: '需维修', handler: '赵主管', processRemark: '已更换按钮', fixRemark: '电梯恢复正常运行' },
    { typeId: 'blind_path_damaged', desc: '盲道砖块松动', locIdx: 8, status: 'fixed', daysAgo: 9, reporterIdx: 3, auditor: '审核员B', auditRemark: '需修复', handler: '王队长', processRemark: '已重新固定', fixRemark: '盲道修复完成' },

    // 已验证通过 5 条
    { typeId: 'blind_path_blocked', desc: '盲道被施工材料占用', locIdx: 2, status: 'verified', daysAgo: 12, reporterIdx: 5, auditor: '审核员A', auditRemark: '情况属实', handler: '张工', processRemark: '已清理', fixRemark: '清理完成', verifyRemark: '确认已恢复畅通', verifyResult: true },
    { typeId: 'ramp_missing', desc: '缺少无障碍坡道', locIdx: 7, status: 'verified', daysAgo: 14, reporterIdx: 4, auditor: '审核员B', auditRemark: '需增设', handler: '李师傅', processRemark: '已新建坡道', fixRemark: '坡道建设完成', verifyRemark: '坡道符合标准', verifyResult: true },
    { typeId: 'handrail_missing', desc: '扶手损坏', locIdx: 10, status: 'verified', daysAgo: 16, reporterIdx: 0, auditor: '审核员A', auditRemark: '需更换', handler: '王队长', processRemark: '已更换扶手', fixRemark: '扶手安装完成', verifyRemark: '扶手牢固可用', verifyResult: true },
    { typeId: 'toilet_inaccessible', desc: '卫生间门锁坏', locIdx: 11, status: 'verified', daysAgo: 18, reporterIdx: 2, auditor: '审核员A', auditRemark: '需维修', handler: '赵主管', processRemark: '已更换门锁', fixRemark: '门锁修复完成', verifyRemark: '卫生间已开放使用', verifyResult: true },
    { typeId: 'parking_blocked', desc: '停车位被长期占用', locIdx: 1, status: 'verified', daysAgo: 20, reporterIdx: 1, auditor: '审核员B', auditRemark: '情况属实', handler: '赵主管', processRemark: '已设置警示标识', fixRemark: '标识设置完成', verifyRemark: '停车位已规范使用', verifyResult: true },

    // 已驳回 2 条
    { typeId: 'other', desc: '路面有积水', locIdx: 4, status: 'rejected', daysAgo: 3, reporterIdx: 3, auditor: '审核员A', auditRemark: '不属于无障碍设施问题' },
    { typeId: 'other', desc: '路灯不亮', locIdx: 6, status: 'rejected', daysAgo: 5, reporterIdx: 5, auditor: '审核员B', auditRemark: '非无障碍设施范畴' }
  ]

  /**
   * 根据模板生成完整的上报记录
   * @param {Object} template - 模板数据
   * @param {number} index - 索引
   * @returns {Object} 完整的上报记录
   */
  function buildReport(template, index) {
    const { PROBLEM_TYPES, PROBLEM_CATEGORIES } = LJ.constants
    const typeInfo = PROBLEM_TYPES.find((t) => t.id === template.typeId) || PROBLEM_TYPES[0]
    const categoryInfo = PROBLEM_CATEGORIES.find((c) => c.id === typeInfo.category) || PROBLEM_CATEGORIES[0]
    const location = locations[template.locIdx]
    const reporter = reporters[template.reporterIdx]
    const now = new Date()
    const createTime = new Date(now.getTime() - template.daysAgo * 24 * 60 * 60 * 1000)

    // 构建时间线
    const timeline = [{
      action: 'submit',
      time: LJ.utils.formatDate(createTime),
      description: '提交上报',
      operator: reporter.nickName
    }]

    if (template.status === 'rejected' || template.status === 'approved' ||
        template.status === 'processing' || template.status === 'fixed' ||
        template.status === 'verified') {
      const auditTime = new Date(createTime.getTime() + 2 * 60 * 60 * 1000)
      timeline.push({
        action: 'audit',
        time: LJ.utils.formatDate(auditTime),
        description: template.status === 'rejected' ? `审核驳回：${template.auditRemark}` : `审核通过：${template.auditRemark}`,
        operator: template.auditor
      })
    }

    if (template.status === 'processing' || template.status === 'fixed' || template.status === 'verified') {
      const assignTime = new Date(createTime.getTime() + 4 * 60 * 60 * 1000)
      timeline.push({
        action: 'assign',
        time: LJ.utils.formatDate(assignTime),
        description: `派单给 ${template.handler}`,
        operator: template.auditor
      })
      const processTime = new Date(createTime.getTime() + 8 * 60 * 60 * 1000)
      timeline.push({
        action: 'process',
        time: LJ.utils.formatDate(processTime),
        description: `开始处理：${template.processRemark}`,
        operator: template.handler
      })
    }

    if (template.status === 'fixed' || template.status === 'verified') {
      const fixTime = new Date(createTime.getTime() + 24 * 60 * 60 * 1000)
      timeline.push({
        action: 'fix',
        time: LJ.utils.formatDate(fixTime),
        description: `标记已修复：${template.fixRemark}`,
        operator: template.handler
      })
    }

    if (template.status === 'verified') {
      const verifyTime = new Date(createTime.getTime() + 48 * 60 * 60 * 1000)
      timeline.push({
        action: 'verify',
        time: LJ.utils.formatDate(verifyTime),
        description: `验证${template.verifyResult ? '通过' : '未通过'}：${template.verifyRemark}`,
        operator: reporter.nickName
      })
    }

    return {
      _id: `report_${String(index + 1).padStart(3, '0')}`,
      orderId: `LJ${LJ.utils.formatDate(createTime, 'YYYYMMDD')}${String(index + 1).padStart(4, '0')}`,
      openid: reporter.openid,
      reporterName: reporter.nickName,
      reporterAvatar: reporter.avatarUrl,
      reporterPhone: reporter.phone,
      title: typeInfo.name,
      typeId: template.typeId,
      typeName: typeInfo.name,
      categoryId: categoryInfo.id,
      categoryName: categoryInfo.name,
      description: template.desc,
      location: { ...location },
      images: ['../shared/img/test.png'],
      fixImages: (template.status === 'fixed' || template.status === 'verified')
        ? ['../shared/img/test.png']
        : [],
      status: template.status,
      createTime: LJ.utils.formatDate(createTime),
      updateTime: LJ.utils.formatDate(new Date(now.getTime() - template.daysAgo * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000)),
      timeline,
      auditor: template.auditor || '',
      auditRemark: template.auditRemark || '',
      handler: template.handler || '',
      processRemark: template.processRemark || '',
      fixRemark: template.fixRemark || '',
      verifyRemark: template.verifyRemark || '',
      verifyResult: template.verifyResult || null,
      distance: Math.round(Math.random() * 2000)
    }
  }

  /**
   * 生成所有上报记录
   */
  const reports = reportTemplates.map(buildReport)

  /**
   * 后台管理员账号
   */
  const adminUsers = [
    { username: 'admin', password: '123456', name: '超级管理员', role: 'super_admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin' },
    { username: 'auditor', password: '123456', name: '审核员A', role: 'auditor', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=auditor' },
    { username: 'handler', password: '123456', name: '张工', role: 'handler', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=handler' }
  ]

  /**
   * 获取当前用户的统计数据
   */
  function getCurrentUserStats() {
    return {
      totalReports: 3,
      fixedCount: 1,
      verifyCount: 1
    }
  }

  LJ.mockData = {
    currentUser,
    reporters,
    handlers,
    locations,
    reports,
    adminUsers,
    getCurrentUserStats
  }
})(window)
