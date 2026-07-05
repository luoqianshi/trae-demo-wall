/* ============================================================
   暖伴 NuanBan · Mock 数据
   ============================================================ */

const MockData = {
  // 服务类型
  services: [
    { id: 'halfday', name: '半日陪诊', desc: '4小时·挂号候诊取药', price: 299, unit: '次', icon: 'clock', color: '#1E7A6F' },
    { id: 'fullday', name: '全日陪诊', desc: '8小时·全程陪伴无忧', price: 499, unit: '次', icon: 'heart', color: '#F2994A' },
    { id: 'errand', name: '代办跑腿', desc: '代取报告·代开药', price: 99, unit: '次', icon: 'route', color: '#2D9CDB' },
    { id: 'remote', name: '异地就医', desc: '跨城就医·一站搞定', price: 899, unit: '次', icon: 'car', color: '#9B6DFF' },
    { id: 'transfer', name: '专车接送', desc: '往返接送·安全便捷', price: 159, unit: '次', icon: 'car', color: '#27AE60' },
    { id: 'checkup', name: '体检陪诊', desc: '体检全程·贴心指引', price: 399, unit: '次', icon: 'shield', color: '#EB5757' },
  ],

  // 热门医院
  hospitals: [
    { id: 1, name: '北京协和医院', level: '三甲', dept: '48个科室', distance: '2.3km', hot: true },
    { id: 2, name: '北京同仁医院', level: '三甲', dept: '36个科室', distance: '3.1km', hot: true },
    { id: 3, name: '北京大学第一医院', level: '三甲', dept: '42个科室', distance: '4.5km', hot: true },
    { id: 4, name: '北京天坛医院', level: '三甲', dept: '39个科室', distance: '5.2km', hot: false },
    { id: 5, name: '北京阜外医院', level: '三甲', dept: '28个科室', distance: '6.8km', hot: false },
  ],

  // 科室
  departments: ['内科', '外科', '骨科', '心血管内科', '神经内科', '内分泌科', '呼吸内科', '消化内科', '肿瘤科', '眼科', '耳鼻喉科', '口腔科', '皮肤科', '妇产科', '儿科', '泌尿外科'],

  // 陪诊师列表
  companions: [
    { id: 1, name: '李慧敏', avatar: '李', gender: '女', age: 38, rating: 4.9, orders: 1286, exp: '3年', price: 199, hospital: '协和医院', tags: ['护士背景', '急救证书', '好评99%'], online: true, desc: '三甲医院5年护理经验,擅长老人陪诊' },
    { id: 2, name: '王建国', avatar: '王', gender: '男', age: 42, rating: 4.8, orders: 968, exp: '2年', price: 179, hospital: '同仁医院', tags: ['急救证书', '异地就医', '好评98%'], online: true, desc: '细心负责,熟悉异地就医全流程' },
    { id: 3, name: '张丽华', avatar: '张', gender: '女', age: 35, rating: 4.9, orders: 1567, exp: '4年', price: 219, hospital: '北大第一', tags: ['护士背景', '金牌陪诊', '好评99%'], online: false, desc: '金牌陪诊师,服务超1500单零投诉' },
    { id: 4, name: '陈晓东', avatar: '陈', gender: '男', age: 29, rating: 4.7, orders: 532, exp: '1年', price: 159, hospital: '天坛医院', tags: ['医学硕士', '急救证书', '好评97%'], online: true, desc: '医学硕士在读,专业素养过硬' },
    { id: 5, name: '赵秀英', avatar: '赵', gender: '女', age: 45, rating: 5.0, orders: 2103, exp: '5年', price: 239, hospital: '协和医院', tags: ['护士背景', '资深陪诊', '好评100%'], online: true, desc: '从业5年,老人和家属最信赖的陪诊师' },
  ],

  // 用户评价标签
  evalTags: ['专业耐心', '沟通顺畅', '准时到达', '照顾周到', '熟悉流程', '态度温和', '让人安心', '报告清晰'],

  // 用户评价
  reviews: [
    { user: '王*芳', rating: 5, date: '2026-06-28', tags: ['专业耐心', '照顾周到'], content: '李姐陪我妈去协和看心内科,全程非常细心,帮我们挂号、缴费、取药,还把医生说的注意事项都记下来发给我,真的太感谢了!' },
    { user: '张*伟', rating: 5, date: '2026-06-25', tags: ['熟悉流程', '让人安心'], content: '异地来北京看病,多亏了王师傅,从火车站接到医院全程安排得明明白白,少走了很多弯路。' },
    { user: '刘*琴', rating: 4, date: '2026-06-20', tags: ['准时到达', '态度温和'], content: '服务整体不错,陪诊师准时到了,态度也很好,就是取报告等了比较久。' },
  ],

  // 订单状态机
  orderStatus: {
    'pending_pay': { label: '待支付', color: 'warning', step: 0 },
    'pending_accept': { label: '待接单', color: 'info', step: 1 },
    'accepted': { label: '已接单', color: 'info', step: 2 },
    'in_service': { label: '服务中', color: 'accent', step: 3 },
    'pending_review': { label: '待评价', color: 'warning', step: 4 },
    'completed': { label: '已完成', color: 'success', step: 5 },
    'refunded': { label: '已退款', color: 'alert', step: -1 },
  },

  // 服务节点 timeline
  serviceNodes: [
    { key: 'start', label: '陪诊师出发', time: '08:30', desc: '陪诊师已出发前往您所在位置', done: true },
    { key: 'arrive', label: '到达接应', time: '09:00', desc: '陪诊师已到达,与您汇合', done: true },
    { key: 'register', label: '挂号签到', time: '09:15', desc: '已完成挂号,等待叫号', done: true },
    { key: 'wait', label: '候诊中', time: '09:30', desc: '当前排队第8位,预计30分钟', done: true, active: true },
    { key: 'consult', label: '就诊', time: '—', desc: '医生叫号后进入诊室就诊', done: false },
    { key: 'pay', label: '缴费', time: '—', desc: '完成就诊后缴费', done: false },
    { key: 'medicine', label: '取药', time: '—', desc: '缴费后前往药房取药', done: false },
    { key: 'report', label: '取报告', time: '—', desc: '检查报告出具后代取', done: false },
    { key: 'end', label: '服务完成', time: '—', desc: '送您安全返回,服务结束', done: false },
  ],

  // 会员等级
  memberLevels: [
    { name: '普通会员', threshold: '注册即享', color: '#9A9A9A', perks: ['基础服务', '在线客服'] },
    { name: '银卡会员', threshold: '累计消费满1000元', color: '#B0ABA3', perks: ['优先派单', '9.8折优惠', '专属客服'] },
    { name: '金卡会员', threshold: '累计消费满5000元', color: '#F2C94C', perks: ['金牌陪诊师', '9.5折优惠', '免费改期', '24h热线'] },
    { name: '钻石会员', threshold: '累计消费满20000元', color: '#2D9CDB', perks: ['专属陪诊师', '9折优惠', '免费取消', '健康管家', '上门服务'] },
  ],

  // 营销活动
  promotions: [
    { id: 1, title: '新人首单立减50', desc: '注册即享,首单专享优惠', tag: '新人专享', color: 'accent' },
    { id: 2, title: '邀请好友得返现', desc: '好友下单,双方各得30元', tag: '限时活动', color: 'primary' },
    { id: 3, title: '重阳敬老8.8折', desc: '60岁以上老人专享', tag: '节日活动', color: 'accent' },
    { id: 4, title: '亲情卡3次套餐', desc: '包月3次,低至799元', tag: '超值套餐', color: 'primary' },
  ],

  // 健康档案
  healthRecords: [
    { date: '2026-06-15', hospital: '北京协和医院', dept: '心内科', type: '就诊记录', summary: '高血压复诊,血压控制平稳' },
    { date: '2026-05-20', hospital: '北京同仁医院', dept: '眼科', type: '检查报告', summary: '眼底检查正常,建议半年复查' },
    { date: '2026-04-08', hospital: '北大第一医院', dept: '内分泌科', type: '检查报告', summary: '血糖略高,建议控制饮食' },
    { date: '2026-03-12', hospital: '北京协和医院', dept: '骨科', type: '就诊记录', summary: '膝关节退行性病变,保守治疗' },
  ],

  // 用药清单
  medications: [
    { name: '苯磺酸氨氯地平片', dose: '5mg', freq: '每日1次', time: '早晨', remind: true },
    { name: '阿托伐他汀钙片', dose: '20mg', freq: '每日1次', time: '睡前', remind: true },
    { name: '二甲双胍缓释片', dose: '0.5g', freq: '每日2次', time: '早晚饭后', remind: false },
  ],

  // 后台数据看板
  dashboardStats: {
    todayOrders: 342,
    todayRevenue: 128560,
    activeCompanions: 186,
    satisfaction: 98.6,
    monthlyGrowth: 12.5,
    orderTrend: [120, 145, 168, 152, 189, 210, 243, 228, 267, 289, 312, 342],
    revenueTrend: [45200, 52300, 61800, 56700, 70200, 78500, 91200, 85600, 99800, 108300, 117600, 128560],
    cityDistribution: [
      { city: '北京', orders: 89, percent: 26 },
      { city: '上海', orders: 72, percent: 21 },
      { city: '广州', orders: 58, percent: 17 },
      { city: '深圳', orders: 51, percent: 15 },
      { city: '成都', orders: 38, percent: 11 },
      { city: '其他', orders: 34, percent: 10 },
    ],
  },

  // 订单列表 (后台)
  adminOrders: [
    { id: 'NB20260704001', user: '王秀芳', companion: '李慧敏', hospital: '协和医院', service: '半日陪诊', amount: 299, status: 'in_service', time: '2026-07-04 09:00' },
    { id: 'NB20260704002', user: '张伟', companion: '王建国', hospital: '同仁医院', service: '全日陪诊', amount: 499, status: 'accepted', time: '2026-07-04 08:30' },
    { id: 'NB20260704003', user: '刘琴', companion: '—', hospital: '天坛医院', service: '代办跑腿', amount: 99, status: 'pending_accept', time: '2026-07-04 10:00' },
    { id: 'NB20260704004', user: '陈明', companion: '张丽华', hospital: '北大第一', service: '半日陪诊', amount: 299, status: 'completed', time: '2026-07-03 14:00' },
    { id: 'NB20260704005', user: '赵芳', companion: '—', hospital: '阜外医院', service: '全日陪诊', amount: 499, status: 'pending_pay', time: '2026-07-04 11:00' },
  ],

  // 陪诊师管理 (后台)
  adminCompanions: [
    { id: 'C001', name: '李慧敏', gender: '女', age: 38, rating: 4.9, orders: 1286, status: '在岗', level: '金牌', city: '北京' },
    { id: 'C002', name: '王建国', gender: '男', age: 42, rating: 4.8, orders: 968, status: '在岗', level: '银牌', city: '北京' },
    { id: 'C003', name: '张丽华', gender: '女', age: 35, rating: 4.9, orders: 1567, status: '休息', level: '金牌', city: '上海' },
    { id: 'C004', name: '陈晓东', gender: '男', age: 29, rating: 4.7, orders: 532, status: '审核中', level: '—', city: '北京' },
    { id: 'C005', name: '赵秀英', gender: '女', age: 45, rating: 5.0, orders: 2103, status: '在岗', level: '钻石', city: '北京' },
  ],
};
