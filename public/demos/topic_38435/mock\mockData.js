window.CityPulseData = {
  currentCity: { name: '北京', code: 'beijing', lat: 39.9042, lng: 116.4074 },
  weather: {
    current: { city: '北京', temp: -3, condition: '小雪', icon: '❄️', high: 1, low: -8, humidity: '72%', wind: '北风 3级', aqi: 45, aqiLevel: '优', updateTime: '2026-06-18 16:30' },
    alerts: [
      { id: 'alert_001', level: 'yellow', title: '暴雪黄色预警', content: '预计今晚至明天白天，本市将出现大到暴雪，累计降雪量8-12毫米，请注意防范。', time: '2026-06-18 14:00', icon: '⚠️' },
      { id: 'alert_002', level: 'blue', title: '道路结冰蓝色预警', content: '受降雪影响，地表温度低于0°C，道路可能出现结冰，出行请注意安全。', time: '2026-06-18 15:30', icon: '❄️' }
    ],
    forecast: [
      { day: '今天', date: '06/18', icon: '❄️', condition: '小雪', high: 1, low: -8 },
      { day: '明天', date: '06/19', icon: '🌨️', condition: '大雪', high: -2, low: -10 },
      { day: '周六', date: '06/20', icon: '☁️', condition: '多云', high: 2, low: -6 },
      { day: '周日', date: '06/21', icon: '☀️', condition: '晴', high: 5, low: -4 },
      { day: '周一', date: '06/22', icon: '☀️', condition: '晴', high: 7, low: -2 },
      { day: '周二', date: '06/23', icon: '⛅', condition: '多云', high: 6, low: -3 },
      { day: '周三', date: '06/24', icon: '☁️', condition: '阴', high: 4, low: -5 }
    ]
  },
  highways: [
    { id: 'g6', name: '京藏高速', code: 'G6', status: 'partial', reason: '降雪导致路面结冰', directions: [{ name: '北京方向', status: 'open', note: '正常通行' }, { name: '包头方向', status: 'closed', note: '因降雪封闭，预计明日12:00恢复' }], updateTime: '2026-06-18 16:00' },
    { id: 'g4', name: '京港澳高速', code: 'G4', status: 'limited', reason: '部分路段积雪', directions: [{ name: '北京方向', status: 'limited', note: '限速60km/h，请保持车距' }, { name: '石家庄方向', status: 'open', note: '正常通行' }], updateTime: '2026-06-18 15:45' },
    { id: 'g1', name: '京哈高速', code: 'G1', status: 'open', reason: '', directions: [{ name: '北京方向', status: 'open', note: '正常通行' }, { name: '哈尔滨方向', status: 'open', note: '正常通行' }], updateTime: '2026-06-18 16:20' },
    { id: 'g2', name: '京沪高速', code: 'G2', status: 'limited', reason: '桥面结冰', directions: [{ name: '北京方向', status: 'limited', note: '限速80km/h' }, { name: '上海方向', status: 'limited', note: '限速80km/h' }], updateTime: '2026-06-18 15:30' },
    { id: 'g45', name: '大广高速', code: 'G45', status: 'closed', reason: '暴雪导致能见度不足50米', directions: [{ name: '北京方向', status: 'closed', note: '全线封闭，恢复时间待定' }, { name: '广州方向', status: 'closed', note: '全线封闭，恢复时间待定' }], updateTime: '2026-06-18 14:00' }
  ],
  bus: { lineId: '56', lineName: '56路', startStation: '大观园', endStation: '定慧桥南', currentStation: '和平里南口', nextStation: { name: '地坛西门', arrivalMinutes: 3, distance: '800米' }, followingStations: ['安定门', '鼓楼', '地安门', '景山东门', '故宫', '天安门西'], status: '运行中', updateTime: '2026-06-18 16:33' },
  tags: [
    { id: 'emergency', name: '突发应急', icon: '🚨', color: '#ef4444' },
    { id: 'traffic', name: '交通出行', icon: '🚗', color: '#3b82f6' },
    { id: 'weather_alert', name: '天气预警', icon: '⚠️', color: '#f59e0b' },
    { id: 'livelihood', name: '民生服务', icon: '🏥', color: '#10b981' },
    { id: 'news', name: '本地资讯', icon: '📰', color: '#8b5cf6' },
    { id: 'bus_info', name: '公交信息', icon: '🚌', color: '#06b6d4' }
  ],
  messages: [
    { id: 'msg_001', title: '朝阳区某商场发生火灾，消防已控制火势', summary: '今日下午2时许，朝阳区某商场地下一层发生火灾，消防部门迅速赶到现场，目前火势已得到控制，无人员伤亡报告。', content: '今日下午2时许，朝阳区某商场地下一层因电路故障引发火灾。消防部门接到报警后，迅速调派8辆消防车和40余名消防员赶赴现场。经过2小时的紧张扑救，火势已完全扑灭。商场内人员已全部安全疏散，无人员伤亡。目前，消防部门正在调查火灾原因，商场暂停营业。', time: '2026-06-18 15:30', tags: ['emergency', 'news'], image: null, source: '北京消防' },
    { id: 'msg_002', title: '北京市发布暴雪黄色预警', summary: '市气象台发布暴雪黄色预警信号，预计今晚至明天白天将出现大到暴雪，市民出行请注意安全。', content: '北京市气象台2026年6月18日14时发布暴雪黄色预警信号：受强冷空气影响，预计今晚至明天白天，本市大部分地区将出现大到暴雪，累计降雪量8-12毫米，局地可达15毫米以上。气温将下降至-10°C左右，道路可能出现结冰。请市民减少外出，注意防寒保暖。', time: '2026-06-18 14:00', tags: ['weather_alert', 'traffic'], image: null, source: '北京市气象台' },
    { id: 'msg_003', title: '明日海淀区部分区域停水通知', summary: '因供水管道检修，明日（6月19日）上午9:00-17:00，海淀区中关村、五道口部分区域将暂停供水。', content: '北京市自来水集团发布停水通知：因供水管道检修施工，明日（6月19日）上午9:00至下午17:00，海淀区中关村大街、五道口区域将暂停供水。请相关居民提前做好储水准备。恢复供水后，可能出现短暂水质浑浊，建议放水后再使用。如有疑问请拨打供水热线：96116。', time: '2026-06-18 12:00', tags: ['livelihood'], image: null, source: '北京市自来水集团' },
    { id: 'msg_004', title: '今日尾号限行3和8', summary: '工作日机动车尾号限行措施继续执行，今日限行尾号为3和8，限行时间为7:00-20:00。', content: '根据北京市工作日高峰时段区域限行交通管理措施，今日（6月18日）限行尾号为3和8。限行时间为7:00-20:00，限行范围为五环路以内道路（不含五环路）。请广大驾驶员遵守限行规定，违者将被处以100元罚款。新能源汽车不受限行措施限制。', time: '2026-06-18 07:00', tags: ['traffic'], image: null, source: '北京市交管局' },
    { id: 'msg_005', title: '56路公交因降雪临时调整线路', summary: '受降雪影响，56路公交车临时绕行地安门内大街，取消景山东门、故宫两站。', content: '受降雪天气影响，地安门东大街部分路段积雪较厚，公交车通行困难。自今日15:00起，56路公交车临时调整线路，绕行地安门内大街。临时取消景山东门站、故宫站，新增地安门内站。恢复时间视道路情况而定，请乘客留意站牌通知。', time: '2026-06-18 15:00', tags: ['bus_info', 'traffic'], image: null, source: '北京公交集团' },
    { id: 'msg_006', title: '北京胡同文化节本周六开幕', summary: '2026北京胡同文化节将于6月21日在南锣鼓巷开幕，届时将有非遗展示、传统美食、民俗表演等活动。', content: '2026北京胡同文化节将于本周六（6月21日）上午10:00在南锣鼓巷开幕。本届文化节为期3天，将举办非遗手工艺展示、传统京味美食市集、京剧脸谱绘制体验、老北京民俗表演等丰富多彩的活动。市民可免费入场参加，建议乘坐地铁6号线或8号线前往。', time: '2026-06-18 10:00', tags: ['news'], image: null, source: '北京市文旅局' },
    { id: 'msg_007', title: '京藏高速包头方向因降雪封闭', summary: '受降雪影响，京藏高速（G6）包头方向已封闭，北京方向正常通行，预计明日中午恢复。', content: '受持续降雪影响，京藏高速（G6）包头方向K120-K180路段积雪严重，已实施封闭管制。北京方向目前正常通行，但限速60km/h。养护部门正在全力除雪，预计明日（6月19日）中午12:00恢复通行。请前往包头方向的车辆提前绕行京新高速或国道110线。', time: '2026-06-18 14:30', tags: ['traffic', 'weather_alert'], image: null, source: '北京高速交警' },
    { id: 'msg_008', title: '东城区某小区电梯故障，居民被困已获救', summary: '今日上午，东城区某小区电梯突发故障，3名居民被困，消防和物业迅速救援，人员已安全获救。', content: '今日上午11时许，东城区某小区12号楼电梯突发故障，3名居民被困在8层。物业和消防部门接到报警后，迅速赶到现场，通过手动盘车将电梯降至7层，成功将被困人员救出。被困人员身体状况良好，无大碍。目前，电梯已停运检修，物业承诺今日内完成维修。', time: '2026-06-18 12:30', tags: ['emergency', 'livelihood'], image: null, source: '东城区应急管理局' },
    { id: 'msg_009', title: '本市新增3条社区便民公交线路', summary: '为方便市民出行，本周起新增3条社区便民公交线路，覆盖回龙观、天通苑、望京等大型社区。', content: '北京市公交集团宣布，自本周一（6月16日）起，新增3条社区便民公交线路：专201路（回龙观-西二旗）、专202路（天通苑北-立水桥）、专203路（望京西-阜通）。线路运营时间为6:30-22:00，票价2元，可使用公交卡或手机支付。线路设置充分考虑了社区与地铁站的接驳需求。', time: '2026-06-18 09:00', tags: ['bus_info', 'news'], image: null, source: '北京公交集团' },
    { id: 'msg_010', title: '明日大风蓝色预警，阵风可达7级', summary: '市气象台发布大风蓝色预警，预计明日白天阵风可达7级，请注意防范高空坠物。', content: '北京市气象台发布大风蓝色预警信号：预计明日（6月19日）白天，本市大部分地区将有4-5级偏北风，阵风可达7级。请市民注意防范高空坠物，加固室外搭建物，远离广告牌和临时建筑。驾车出行请注意横风影响，保持安全车距。', time: '2026-06-18 16:00', tags: ['weather_alert'], image: null, source: '北京市气象台' }
  ],
  userSettings: { pushEnabled: true, alertTypes: ['emergency', 'weather_alert', 'traffic'], followedTags: ['emergency', 'weather_alert', 'traffic', 'bus_info'], city: '北京' },
  adminStats: { totalMessages: 10, totalTags: 6, todayVisits: 128, totalVisits: 3456, messageByTag: { 'emergency': 2, 'traffic': 3, 'weather_alert': 3, 'livelihood': 2, 'news': 2, 'bus_info': 2 } }
};

window.CityPulseUtils = {
  getTagById(tagId) { return window.CityPulseData.tags.find(t => t.id === tagId); },
  getTagNames(tagIds) { return tagIds.map(id => { const tag = this.getTagById(id); return tag ? `${tag.icon} ${tag.name}` : id; }); },
  formatTime(timeStr) { const now = new Date(); const msgTime = new Date(timeStr.replace(/-/g, '/')); const diff = now - msgTime; const hours = Math.floor(diff / (1000 * 60 * 60)); if (hours < 1) return '刚刚'; if (hours < 24) return `${hours}小时前`; return timeStr.split(' ')[0]; },
  getStatusStyle(status) { const styles = { open: { text: '开放', icon: '✅', color: '#10b981', bg: '#d1fae5' }, limited: { text: '限速', icon: '⚠️', color: '#f59e0b', bg: '#fef3c7' }, closed: { text: '封闭', icon: '❌', color: '#ef4444', bg: '#fee2e2' } }; return styles[status] || styles.open; }
};
