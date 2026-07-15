const budgetCategories = [
  { id: 'venue', name: '场地', iconType: 'building', defaultPercent: 25 },
  { id: 'catering', name: '餐饮', iconType: 'utensils', defaultPercent: 20 },
  { id: 'decoration', name: '布置', iconType: 'palette', defaultPercent: 15 },
  { id: 'performance', name: '演艺', iconType: 'music', defaultPercent: 10 },
  { id: 'materials', name: '物料', iconType: 'box', defaultPercent: 10 },
  { id: 'gifts', name: '礼品', iconType: 'gift', defaultPercent: 8 },
  { id: 'transport', name: '交通', iconType: 'car', defaultPercent: 5 },
  { id: 'contingency', name: '备用金', iconType: 'wallet', defaultPercent: 7 }
];

const activityTypes = [
  { id: 'annual', name: '企业年会', iconType: 'celebration', color: '#0D9488' },
  { id: 'wedding', name: '婚礼庆典', iconType: 'heart', color: '#C87941' },
  { id: 'conference', name: '发布会', iconType: 'microphone', color: '#0891B2' },
  { id: 'teambuilding', name: '团建活动', iconType: 'users', color: '#D97706' },
  { id: 'exhibition', name: '展会路演', iconType: 'tent', color: '#7C3AED' },
  { id: 'birthday', name: '生日派对', iconType: 'cake', color: '#DC2626' },
  { id: 'salon', name: '主题沙龙', iconType: 'messageCircle', color: '#059669' },
  { id: 'reading', name: '读书会', iconType: 'book', color: '#DB2777' },
  { id: 'movie', name: '观影会', iconType: 'film', color: '#6366F1' },
  { id: 'other', name: '其他自定义', iconType: 'moreHorizontal', color: '#6B7280' }
];

// 不同活动类型的预算分配比例（百分比，总和100）
const activityBudgetRatios = {
  annual:       { venue: 25, catering: 25, decoration: 10, performance: 15, materials: 8,  gifts: 7,  transport: 5, contingency: 5 },
  wedding:      { venue: 20, catering: 35, decoration: 15, performance: 8,  materials: 5,  gifts: 5,  transport: 7, contingency: 5 },
  conference:   { venue: 25, catering: 10, decoration: 15, performance: 25, materials: 10, gifts: 5,  transport: 5, contingency: 5 },
  teambuilding: { venue: 20, catering: 30, decoration: 5,  performance: 15, materials: 12, gifts: 8,  transport: 10, contingency: 5 },
  exhibition:   { venue: 20, catering: 5,  decoration: 25, performance: 10, materials: 15, gifts: 15, transport: 5, contingency: 5 },
  birthday:     { venue: 20, catering: 25, decoration: 20, performance: 15, materials: 5,  gifts: 10, transport: 5, contingency: 5 },
  salon:        { venue: 30, catering: 25, decoration: 10, performance: 10, materials: 10, gifts: 5,  transport: 5, contingency: 5 },
  reading:      { venue: 25, catering: 20, decoration: 5,  performance: 5,  materials: 25, gifts: 10, transport: 5, contingency: 5 },
  movie:        { venue: 40, catering: 20, decoration: 5,  performance: 5,  materials: 10, gifts: 10, transport: 5, contingency: 5 },
  other:        { venue: 20, catering: 20, decoration: 10, performance: 10, materials: 15, gifts: 10, transport: 10, contingency: 5 }
};

// 每个分类生成默认预算项的函数（通用版，按活动类型覆盖）
const categoryDefaultItemGen = {
  venue: (amt, ppl) => ({ name: '场地租赁', unitPrice: amt, quantity: 1, note: '按场计费' }),
  catering: (amt, ppl) => ({ name: '餐饮服务', unitPrice: Math.round(amt / ppl), quantity: ppl, note: '人均标准' }),
  decoration: (amt, ppl) => ({ name: '现场布置', unitPrice: amt, quantity: 1, note: '含物料及人工' }),
  performance: (amt, ppl) => ({ name: '演艺节目', unitPrice: amt, quantity: 1, note: '含表演及设备' }),
  materials: (amt, ppl) => ({ name: '活动物料', unitPrice: Math.round(amt / 10), quantity: 10, note: '宣传及签到物料' }),
  gifts: (amt, ppl) => ({ name: '伴手礼品', unitPrice: Math.round(amt / ppl), quantity: ppl, note: '人均礼品' }),
  transport: (amt, ppl) => ({ name: '交通费用', unitPrice: Math.round(amt / 2), quantity: 2, note: '往返接送' }),
  contingency: (amt, ppl) => ({ name: '备用金', unitPrice: amt, quantity: 1, note: '应急支出' })
};

// 各活动类型专属预算项模板（每个分类下定义多个具体项目，按比例分配金额）
const activityBudgetItemTemplates = {
  annual: {
    venue: [
      { name: '五星酒店宴会厅', ratio: 0.6, note: '5小时使用，含基础桌椅' },
      { name: '贵宾休息室', ratio: 0.2, note: 'VIP接待专用' },
      { name: '设备租赁费', ratio: 0.2, note: '音响灯光基础设备' }
    ],
    catering: [
      { name: '自助晚宴', ratio: 0.6, note: '中西式结合' },
      { name: '酒水饮料', ratio: 0.25, note: '红酒、软饮、茶水' },
      { name: '茶歇甜点', ratio: 0.15, note: '中场茶歇' }
    ],
    decoration: [
      { name: '舞台背景搭建', ratio: 0.4, note: 'LED大屏+KT板' },
      { name: '鲜花花艺', ratio: 0.25, note: '桌花、签到台花艺' },
      { name: '灯光氛围', ratio: 0.2, note: '追光、染色灯' },
      { name: '签到区布置', ratio: 0.15, note: '签到墙、拍照区' }
    ],
    performance: [
      { name: '专业主持人', ratio: 0.25, note: '含串词及流程把控' },
      { name: '乐队演出', ratio: 0.3, note: '晚宴暖场及互动' },
      { name: '节目表演', ratio: 0.3, note: '2-3个特色节目' },
      { name: '音效师/DJ', ratio: 0.15, note: '全程音乐把控' }
    ],
    materials: [
      { name: '年会背景板', ratio: 0.3, note: '主视觉设计制作' },
      { name: '签到物料', ratio: 0.25, note: '签到本、胸牌、桌卡' },
      { name: '邀请函设计', ratio: 0.2, note: '电子+纸质邀请' },
      { name: '宣传展架', ratio: 0.25, note: '易拉宝、X展架' }
    ],
    gifts: [
      { name: '定制伴手礼', ratio: 0.5, note: '印LOGO的实用礼品' },
      { name: '抽奖奖品', ratio: 0.5, note: '一、二、三等奖' }
    ],
    transport: [
      { name: '员工交通补贴', ratio: 0.6, note: '打车报销标准' },
      { name: '贵宾接送', ratio: 0.4, note: '重要嘉宾专车' }
    ],
    contingency: [
      { name: '应急备用金', ratio: 1, note: '临时增补支出' }
    ]
  },
  wedding: {
    venue: [
      { name: '婚宴酒店场地', ratio: 0.5, note: '含仪式区+用餐区' },
      { name: '化妆间/休息室', ratio: 0.15, note: '新人及伴娘团' },
      { name: '仪式草坪/花园', ratio: 0.2, note: '户外仪式场地' },
      { name: '停车位', ratio: 0.15, note: '宾客停车费用' }
    ],
    catering: [
      { name: '婚宴正餐', ratio: 0.65, note: '按桌计费，10人/桌' },
      { name: '酒水饮料', ratio: 0.2, note: '白酒、红酒、饮料' },
      { name: '甜品台', ratio: 0.15, note: '婚礼蛋糕+甜品' }
    ],
    decoration: [
      { name: '舞台/仪式区', ratio: 0.35, note: '主背景+花艺装饰' },
      { name: '迎宾签到区', ratio: 0.2, note: '签到墙+照片展示' },
      { name: '餐桌花艺', ratio: 0.2, note: '每桌中心花艺' },
      { name: '灯光设备', ratio: 0.15, note: '追光、泡泡机' },
      { name: '通道布置', ratio: 0.1, note: '红毯、路引花' }
    ],
    performance: [
      { name: '婚礼主持人', ratio: 0.3, note: '资深司仪+流程策划' },
      { name: '摄影摄像', ratio: 0.4, note: '双机位+快剪' },
      { name: '化妆师', ratio: 0.2, note: '新娘跟妆+妈妈妆' },
      { name: '音乐/灯光师', ratio: 0.1, note: '现场音效把控' }
    ],
    materials: [
      { name: '喜帖请柬', ratio: 0.3, note: '定制设计+印刷' },
      { name: '签到用品', ratio: 0.25, note: '签到本、签到笔' },
      { name: '席位图/桌卡', ratio: 0.2, note: '座位安排表' },
      { name: '婚品小物', ratio: 0.25, note: '戒枕、花篮、交杯酒' }
    ],
    gifts: [
      { name: '伴手礼/喜糖', ratio: 0.6, note: '人手一份喜糖盒' },
      { name: '互动小礼品', ratio: 0.4, note: '游戏环节奖品' }
    ],
    transport: [
      { name: '婚车租赁', ratio: 0.6, note: '主婚车+跟车' },
      { name: '宾客接送', ratio: 0.4, note: '大巴接送远道宾客' }
    ],
    contingency: [
      { name: '应急备用金', ratio: 1, note: '临时增补支出' }
    ]
  },
  conference: {
    venue: [
      { name: '主会场', ratio: 0.5, note: '发布会主舞台区' },
      { name: '分会场/媒体间', ratio: 0.2, note: '采访及媒体区' },
      { name: 'VIP休息区', ratio: 0.15, note: '嘉宾贵宾室' },
      { name: '展区场地', ratio: 0.15, note: '产品展示区' }
    ],
    catering: [
      { name: '商务茶歇', ratio: 0.5, note: '咖啡、甜点、水果' },
      { name: '工作午餐', ratio: 0.35, note: '自助/盒餐' },
      { name: '招待晚宴', ratio: 0.15, note: 'VIP客户晚宴' }
    ],
    decoration: [
      { name: '舞台搭建', ratio: 0.35, note: '主背景+LED屏' },
      { name: '展示区设计', ratio: 0.25, note: '产品展示台' },
      { name: '签到区', ratio: 0.15, note: '背景板+签到系统' },
      { name: '花艺绿植', ratio: 0.15, note: '商务绿植装饰' },
      { name: '指示系统', ratio: 0.1, note: '导视牌、易拉宝' }
    ],
    performance: [
      { name: '主持人/司仪', ratio: 0.2, note: '专业发布会主持人' },
      { name: '专业摄像', ratio: 0.3, note: '多机位直播录制' },
      { name: '摄影团队', ratio: 0.2, note: '活动跟拍+精修' },
      { name: '开场节目', ratio: 0.15, note: '科技感开场表演' },
      { name: '同声传译', ratio: 0.15, note: '中英文翻译设备' }
    ],
    materials: [
      { name: '主视觉设计', ratio: 0.3, note: 'KV设计及延展' },
      { name: '宣传物料', ratio: 0.25, note: '手册、宣传单页' },
      { name: '签到胸牌', ratio: 0.2, note: '参会证、挂绳' },
      { name: '媒体资料袋', ratio: 0.25, note: '资料夹+礼品' }
    ],
    gifts: [
      { name: '定制纪念品', ratio: 0.6, note: '印LOGO的周边产品' },
      { name: '媒体礼品', ratio: 0.4, note: '专属媒体礼包' }
    ],
    transport: [
      { name: '嘉宾接送', ratio: 0.6, note: 'VIP专车接送' },
      { name: '会务用车', ratio: 0.4, note: '工作团队用车' }
    ],
    contingency: [
      { name: '应急备用金', ratio: 1, note: '临时增补支出' }
    ]
  },
  teambuilding: {
    venue: [
      { name: '团建基地/场地', ratio: 0.5, note: '户外/室内团建场地' },
      { name: '住宿费用', ratio: 0.35, note: '酒店/民宿住宿' },
      { name: '会议室', ratio: 0.15, note: '总结分享会场' }
    ],
    catering: [
      { name: '团建正餐', ratio: 0.5, note: '桌餐/烧烤/自助' },
      { name: '烧烤BBQ', ratio: 0.25, note: '食材+设备' },
      { name: '酒水饮料', ratio: 0.25, note: '啤酒、饮料、零食' }
    ],
    decoration: [
      { name: '主题背景板', ratio: 0.4, note: '团建主题背景' },
      { name: '氛围布置', ratio: 0.35, note: '气球、彩旗、横幅' },
      { name: '拍照道具', ratio: 0.25, note: '趣味拍照道具' }
    ],
    performance: [
      { name: '团建教练', ratio: 0.4, note: '专业拓展教练' },
      { name: '活动主持人', ratio: 0.3, note: '游戏及晚会主持' },
      { name: '篝火晚会', ratio: 0.3, note: '篝火+烟花表演' }
    ],
    materials: [
      { name: '团建道具', ratio: 0.4, note: '游戏道具、队旗队服' },
      { name: '文化衫定制', ratio: 0.3, note: '印LOGO的T恤' },
      { name: '奖牌证书', ratio: 0.3, note: '优胜团队奖励' }
    ],
    gifts: [
      { name: '纪念礼品', ratio: 0.5, note: '团建纪念品' },
      { name: '游戏奖品', ratio: 0.5, note: '获胜队伍奖励' }
    ],
    transport: [
      { name: '大巴包车', ratio: 0.7, note: '往返集体接送' },
      { name: '应急车辆', ratio: 0.3, note: '备用车辆保障' }
    ],
    contingency: [
      { name: '应急备用金', ratio: 1, note: '临时增补支出' }
    ]
  },
  exhibition: {
    venue: [
      { name: '展位租赁', ratio: 0.6, note: '标准/特装展位费' },
      { name: '展馆管理费', ratio: 0.25, note: '水电、保洁、安保' },
      { name: '会议室', ratio: 0.15, note: '商务洽谈室' }
    ],
    catering: [
      { name: '工作人员餐', ratio: 0.5, note: '参展团队工作餐' },
      { name: '客户招待', ratio: 0.3, note: 'VIP客户餐饮' },
      { name: '茶歇饮品', ratio: 0.2, note: '展位咖啡茶水' }
    ],
    decoration: [
      { name: '展位特装搭建', ratio: 0.5, note: '设计+制作+搭建' },
      { name: '产品陈列柜', ratio: 0.2, note: '展柜、展示台' },
      { name: '灯光设备', ratio: 0.15, note: '重点照明、氛围灯' },
      { name: '绿植花艺', ratio: 0.15, note: '装饰绿植鲜花' }
    ],
    performance: [
      { name: '展位主持人', ratio: 0.25, note: '产品介绍及互动' },
      { name: '模特礼仪', ratio: 0.35, note: '迎宾、产品展示' },
      { name: '演艺表演', ratio: 0.25, note: '吸引人流的特色表演' },
      { name: '摄影师', ratio: 0.15, note: '展会全程跟拍' }
    ],
    materials: [
      { name: '宣传册/单页', ratio: 0.3, note: '产品手册、宣传单' },
      { name: '海报/背景板', ratio: 0.25, note: '展位主视觉' },
      { name: '名片/工作证', ratio: 0.15, note: '工作人员证件' },
      { name: '产品包装盒', ratio: 0.3, note: '样品包装设计' }
    ],
    gifts: [
      { name: '品牌周边礼品', ratio: 0.6, note: '印LOGO的实用礼品' },
      { name: 'VIP客户礼品', ratio: 0.4, note: '高端客户专属礼' }
    ],
    transport: [
      { name: '展品运输', ratio: 0.6, note: '物流运输费用' },
      { name: '人员差旅', ratio: 0.4, note: '参展团队交通' }
    ],
    contingency: [
      { name: '应急备用金', ratio: 1, note: '临时增补支出' }
    ]
  },
  birthday: {
    venue: [
      { name: '派对场地', ratio: 0.55, note: '餐厅/会所/轰趴馆' },
      { name: '娱乐设施', ratio: 0.3, note: 'KTV、游戏区' },
      { name: '化妆间', ratio: 0.15, note: '寿星专属休息' }
    ],
    catering: [
      { name: '生日宴正餐', ratio: 0.5, note: '定制生日菜单' },
      { name: '生日蛋糕', ratio: 0.2, note: '定制主题蛋糕' },
      { name: '甜品台', ratio: 0.15, note: ' cupcakes、甜点' },
      { name: '酒水饮料', ratio: 0.15, note: '饮料、酒水、零食' }
    ],
    decoration: [
      { name: '主题背景板', ratio: 0.3, note: '生日主题背景墙' },
      { name: '气球布置', ratio: 0.25, note: '气球链、气球拱门' },
      { name: '花艺装饰', ratio: 0.2, note: '鲜花花艺点缀' },
      { name: '灯光氛围', ratio: 0.15, note: '串灯、氛围灯' },
      { name: '桌卡餐具', ratio: 0.1, note: '定制桌卡、餐具' }
    ],
    performance: [
      { name: '派对主持人', ratio: 0.3, note: '带动气氛+游戏' },
      { name: '摄影跟拍', ratio: 0.35, note: '全程跟拍+精修' },
      { name: '小丑/魔术师', ratio: 0.25, note: '互动表演' },
      { name: '生日乐队', ratio: 0.1, note: '现场音乐演奏' }
    ],
    materials: [
      { name: '生日邀请函', ratio: 0.3, note: '电子+纸质邀请' },
      { name: '派对道具', ratio: 0.35, note: '生日帽、吹龙、眼镜' },
      { name: '签到板', ratio: 0.2, note: '签名祝福板' },
      { name: '回礼包装', ratio: 0.15, note: '礼品袋包装' }
    ],
    gifts: [
      { name: '寿星生日礼物', ratio: 0.4, note: '主生日礼物' },
      { name: '来宾回礼', ratio: 0.4, note: '感谢来宾小礼物' },
      { name: '游戏奖品', ratio: 0.2, note: '互动游戏奖品' }
    ],
    transport: [
      { name: '寿星接送', ratio: 0.5, note: '专车接送寿星' },
      { name: '贵宾接送', ratio: 0.5, note: '重要宾客接送' }
    ],
    contingency: [
      { name: '应急备用金', ratio: 1, note: '临时增补支出' }
    ]
  },
  salon: {
    venue: [
      { name: '沙龙场地', ratio: 0.6, note: '咖啡厅/会所/共享空间' },
      { name: '设备使用费', ratio: 0.25, note: '投影、音响' },
      { name: '茶水间', ratio: 0.15, note: '自助茶水区' }
    ],
    catering: [
      { name: '精致茶歇', ratio: 0.5, note: '甜点、水果、咖啡' },
      { name: '饮品供应', ratio: 0.35, note: '手冲咖啡、茶饮' },
      { name: '轻食简餐', ratio: 0.15, note: '三明治、小食' }
    ],
    decoration: [
      { name: '主题背景墙', ratio: 0.35, note: '沙龙主题背景' },
      { name: '花艺布置', ratio: 0.3, note: '精致桌花、绿植' },
      { name: '氛围灯光', ratio: 0.2, note: '暖光、蜡烛' },
      { name: '桌卡指引', ratio: 0.15, note: '席位卡、导视牌' }
    ],
    performance: [
      { name: '分享嘉宾', ratio: 0.4, note: '主题分享嘉宾费' },
      { name: '主持人', ratio: 0.25, note: '沙龙主持人' },
      { name: '摄影记录', ratio: 0.35, note: '活动摄影+直播' }
    ],
    materials: [
      { name: '宣传物料', ratio: 0.3, note: '海报、宣传单页' },
      { name: '伴读资料', ratio: 0.35, note: '手册、笔记本' },
      { name: '签到用品', ratio: 0.2, note: '签到本、名牌' },
      { name: '文具用品', ratio: 0.15, note: '笔、便签纸' }
    ],
    gifts: [
      { name: '主题纪念品', ratio: 0.5, note: '与主题相关的小物' },
      { name: '嘉宾伴手礼', ratio: 0.5, note: '答谢来宾礼品' }
    ],
    transport: [
      { name: '嘉宾接送', ratio: 0.6, note: '特邀嘉宾接送' },
      { name: '场地指引', ratio: 0.4, note: '停车券、交通补贴' }
    ],
    contingency: [
      { name: '应急备用金', ratio: 1, note: '临时增补支出' }
    ]
  },
  reading: {
    venue: [
      { name: '阅读空间', ratio: 0.55, note: '书店/图书馆/咖啡馆' },
      { name: '讨论区', ratio: 0.25, note: '分组讨论场地' },
      { name: '茶水服务区', ratio: 0.2, note: '自助茶歇区' }
    ],
    catering: [
      { name: '轻食茶歇', ratio: 0.5, note: '甜点、水果拼盘' },
      { name: '精品咖啡', ratio: 0.3, note: '手冲、意式咖啡' },
      { name: '茶饮果汁', ratio: 0.2, note: '各类茶饮、鲜榨果汁' }
    ],
    decoration: [
      { name: '主题展架', ratio: 0.3, note: '书单/主题展示' },
      { name: '花艺绿植', ratio: 0.35, note: '文艺绿植、干花' },
      { name: '氛围布置', ratio: 0.25, note: '暖光、蜡烛、布艺' },
      { name: '桌卡名牌', ratio: 0.1, note: '座位名牌' }
    ],
    performance: [
      { name: '领读嘉宾', ratio: 0.4, note: '特邀分享嘉宾' },
      { name: '主持人', ratio: 0.25, note: '读书会主持' },
      { name: '摄影记录', ratio: 0.35, note: '活动纪实摄影' }
    ],
    materials: [
      { name: '精选图书', ratio: 0.45, note: '本期主题图书' },
      { name: '读书笔记', ratio: 0.25, note: '定制笔记本、书签' },
      { name: '宣传物料', ratio: 0.15, note: '海报、书单页' },
      { name: '文具套装', ratio: 0.15, note: '笔、便签、贴纸' }
    ],
    gifts: [
      { name: '图书礼品', ratio: 0.5, note: '赠书、签名书' },
      { name: '文创周边', ratio: 0.5, note: '书签、帆布袋' }
    ],
    transport: [
      { name: '嘉宾接送', ratio: 0.5, note: '特邀作者接送' },
      { name: '图书运输', ratio: 0.5, note: '书籍物料运送' }
    ],
    contingency: [
      { name: '应急备用金', ratio: 1, note: '临时增补支出' }
    ]
  },
  movie: {
    venue: [
      { name: '影院包场', ratio: 0.7, note: '整厅包场观影' },
      { name: '映后交流区', ratio: 0.2, note: '讨论/互动场地' },
      { name: '休息等候区', ratio: 0.1, note: '候场休息空间' }
    ],
    catering: [
      { name: '爆米花套餐', ratio: 0.4, note: '大桶爆米花' },
      { name: '饮料饮品', ratio: 0.3, note: '可乐、果汁、咖啡' },
      { name: '零食小吃', ratio: 0.3, note: '薯片、糖果、热狗' }
    ],
    decoration: [
      { name: '主题背景墙', ratio: 0.35, note: '电影主题拍照区' },
      { name: '电影海报', ratio: 0.25, note: '原版海报装饰' },
      { name: '氛围布置', ratio: 0.25, note: '串灯、气球' },
      { name: '指引牌', ratio: 0.15, note: '检票、座位指引' }
    ],
    performance: [
      { name: '映前主持人', ratio: 0.3, note: '开场介绍+互动' },
      { name: '嘉宾分享', ratio: 0.4, note: '映后导演/影评人' },
      { name: '摄影记录', ratio: 0.3, note: '活动现场拍摄' }
    ],
    materials: [
      { name: '电影票根', ratio: 0.3, note: '定制纪念票根' },
      { name: '宣传海报', ratio: 0.25, note: '活动海报设计' },
      { name: '观影手册', ratio: 0.25, note: '影片介绍单页' },
      { name: '周边贴纸', ratio: 0.2, note: '电影主题贴纸' }
    ],
    gifts: [
      { name: '电影周边', ratio: 0.55, note: '海报、明信片、徽章' },
      { name: '互动奖品', ratio: 0.45, note: '问答抽奖礼品' }
    ],
    transport: [
      { name: '交通补贴', ratio: 0.7, note: '观众交通报销' },
      { name: '嘉宾接送', ratio: 0.3, note: '特邀嘉宾专车' }
    ],
    contingency: [
      { name: '应急备用金', ratio: 1, note: '临时增补支出' }
    ]
  },
  other: {
    venue: [
      { name: '场地租赁', ratio: 1, note: '按需选择场地' }
    ],
    catering: [
      { name: '餐饮服务', ratio: 1, note: '根据需求定制' }
    ],
    decoration: [
      { name: '现场布置', ratio: 1, note: '根据主题设计' }
    ],
    performance: [
      { name: '演艺/服务', ratio: 1, note: '按需配置' }
    ],
    materials: [
      { name: '活动物料', ratio: 1, note: '定制物料' }
    ],
    gifts: [
      { name: '纪念礼品', ratio: 1, note: '自选礼品' }
    ],
    transport: [
      { name: '交通费用', ratio: 1, note: '据实报销' }
    ],
    contingency: [
      { name: '应急备用金', ratio: 1, note: '灵活使用' }
    ]
  }
};

const budgetTemplates = [
  {
    id: 1,
    name: '经典企业年会方案',
    type: 'annual',
    typeName: '企业年会',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20corporate%20annual%20meeting%20stage%20with%20professional%20lighting%20and%20decoration&image_size=landscape_16_9',
    budgetMin: 50000,
    budgetMax: 80000,
    peopleMin: 50,
    peopleMax: 100,
    industry: '互联网',
    rating: 4.8,
    usageCount: 1256,
    tags: ['高端', '经典', '性价比高'],
    description: '适用于50-100人规模的企业年会，包含场地布置、餐饮、演艺等全套服务，打造专业隆重的年会体验。',
    suitableFor: '中型企业年度总结表彰大会',
    highlights: ['五星酒店场地', '专业舞美灯光', '知名主持人', '精彩节目表演'],
    items: [
      { category: 'venue', name: '五星酒店宴会厅', amount: 20000, note: '5小时使用，含基础桌椅' },
      { category: 'catering', name: '自助晚宴', amount: 15000, note: '100人，中西式结合' },
      { category: 'decoration', name: '舞台背景搭建', amount: 8000, note: 'LED大屏+鲜花布置' },
      { category: 'performance', name: '主持人+演出', amount: 10000, note: '专业主持人+乐队表演' },
      { category: 'materials', name: '签到及宣传物料', amount: 4000, note: '背景板、签到墙、邀请函' },
      { category: 'gifts', name: '年会伴手礼', amount: 5000, note: '100份定制礼品' },
      { category: 'transport', name: '交通补贴', amount: 2000, note: '员工打车报销' },
      { category: 'contingency', name: '备用金', amount: 6000, note: '应急支出' }
    ]
  },
  {
    id: 2,
    name: '温馨婚礼策划方案',
    type: 'wedding',
    typeName: '婚礼庆典',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=romantic%20wedding%20ceremony%20with%20flowers%20and%20elegant%20decoration%20warm%20lighting&image_size=landscape_16_9',
    budgetMin: 80000,
    budgetMax: 120000,
    peopleMin: 100,
    peopleMax: 200,
    industry: '婚庆',
    rating: 4.9,
    usageCount: 892,
    tags: ['浪漫', '精致', '难忘'],
    description: '为100-200人规模的婚礼提供全方位策划服务，从场地布置到餐饮演艺，打造梦幻婚礼。',
    suitableFor: '中高端婚礼庆典',
    highlights: ['主题婚礼策划', '鲜花现场布置', '专业摄影摄像', '婚礼司仪'],
    items: [
      { category: 'venue', name: '婚礼场地', amount: 30000, note: '酒店宴会厅8小时' },
      { category: 'catering', name: '婚宴酒席', amount: 40000, note: '20桌，每桌10人' },
      { category: 'decoration', name: '婚礼现场布置', amount: 15000, note: '鲜花+灯光+仪式区' },
      { category: 'performance', name: '司仪+乐队', amount: 8000, note: '资深司仪+弦乐四重奏' },
      { category: 'materials', name: '喜帖及糖盒', amount: 3000, note: '200份定制' },
      { category: 'gifts', name: '回礼', amount: 4000, note: '200份喜糖伴手礼' },
      { category: 'transport', name: '婚车租赁', amount: 5000, note: '主婚车+5辆跟车' },
      { category: 'contingency', name: '备用金', amount: 5000, note: '应急支出' }
    ]
  },
  {
    id: 3,
    name: '科技产品发布会',
    type: 'conference',
    typeName: '发布会',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20tech%20product%20launch%20event%20with%20LED%20screens%20and%20professional%20stage&image_size=landscape_16_9',
    budgetMin: 100000,
    budgetMax: 150000,
    peopleMin: 200,
    peopleMax: 500,
    industry: '科技',
    rating: 4.7,
    usageCount: 678,
    tags: ['科技感', '专业', '媒体传播'],
    description: '专为科技产品发布打造的专业方案，配备顶级视听设备和媒体传播支持，助力产品震撼发布。',
    suitableFor: '新品发布会、媒体见面会',
    highlights: ['专业舞台设备', '媒体邀请服务', '线上直播支持', '互动体验区'],
    items: [
      { category: 'venue', name: '会展中心场地', amount: 35000, note: '主会场+体验区' },
      { category: 'catering', name: '茶歇服务', amount: 10000, note: '500人茶歇' },
      { category: 'decoration', name: '展台搭建', amount: 25000, note: '主舞台+产品展示区' },
      { category: 'performance', name: '视听设备', amount: 30000, note: 'LED大屏+音响+灯光' },
      { category: 'materials', name: '宣传资料', amount: 8000, note: '手册、海报、礼品' },
      { category: 'gifts', name: '媒体礼品', amount: 12000, note: '100份高端礼品' },
      { category: 'transport', name: '媒体接待', amount: 5000, note: '接送机及住宿安排' },
      { category: 'contingency', name: '备用金', amount: 15000, note: '应急支出' }
    ]
  },
  {
    id: 4,
    name: '户外团建拓展方案',
    type: 'teambuilding',
    typeName: '团建活动',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=outdoor%20team%20building%20activity%20with%20people%20doing%20group%20games%20in%20nature&image_size=landscape_16_9',
    budgetMin: 20000,
    budgetMax: 40000,
    peopleMin: 30,
    peopleMax: 80,
    industry: '通用',
    rating: 4.6,
    usageCount: 2341,
    tags: ['户外', '互动', '凝聚力'],
    description: '丰富多彩的户外团建活动，通过趣味游戏和团队挑战，提升团队凝聚力和协作能力。',
    suitableFor: '企业团队建设、部门团建',
    highlights: ['专业拓展教练', '趣味团队游戏', '户外烧烤', '安全保障'],
    items: [
      { category: 'venue', name: '拓展基地场地', amount: 8000, note: '全天使用' },
      { category: 'catering', name: '户外烧烤', amount: 10000, note: '80人自助烧烤' },
      { category: 'decoration', name: '活动物料', amount: 3000, note: '横幅、队服、道具' },
      { category: 'performance', name: '拓展教练', amount: 6000, note: '2名专业教练' },
      { category: 'materials', name: '活动道具', amount: 4000, note: '游戏道具、安全装备' },
      { category: 'gifts', name: '纪念品', amount: 3000, note: '80份定制纪念章' },
      { category: 'transport', name: '大巴接送', amount: 4000, note: '2辆大巴往返' },
      { category: 'contingency', name: '备用金', amount: 2000, note: '应急支出' }
    ]
  },
  {
    id: 5,
    name: '品牌展会路演方案',
    type: 'exhibition',
    typeName: '展会路演',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20exhibition%20booth%20with%20brand%20display%20and%20visitors&image_size=landscape_16_9',
    budgetMin: 60000,
    budgetMax: 100000,
    peopleMin: 100,
    peopleMax: 500,
    industry: '市场营销',
    rating: 4.5,
    usageCount: 567,
    tags: ['品牌推广', '互动体验', '获客'],
    description: '专业的展会路演解决方案，从展台设计到现场运营，全方位提升品牌曝光和获客效果。',
    suitableFor: '品牌展会、商场路演、产品推广',
    highlights: ['创意展台设计', '互动体验装置', '专业运营团队', '数据化效果追踪'],
    items: [
      { category: 'venue', name: '展位费用', amount: 25000, note: '36平米标准展位' },
      { category: 'catering', name: '工作人员餐饮', amount: 3000, note: '10人3天工作餐' },
      { category: 'decoration', name: '展台搭建', amount: 20000, note: '特装展台设计搭建' },
      { category: 'performance', name: '舞台表演', amount: 8000, note: '互动演出、魔术表演' },
      { category: 'materials', name: '宣传物料', amount: 10000, note: '宣传单、样品、展示品' },
      { category: 'gifts', name: '扫码礼品', amount: 15000, note: '500份引流礼品' },
      { category: 'transport', name: '物料运输', amount: 4000, note: '展台物料往返运输' },
      { category: 'contingency', name: '备用金', amount: 5000, note: '应急支出' }
    ]
  },
  {
    id: 6,
    name: '儿童生日派对方案',
    type: 'birthday',
    typeName: '生日派对',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=colorful%20kids%20birthday%20party%20with%20balloons%20cake%20and%20decorations&image_size=landscape_16_9',
    budgetMin: 5000,
    budgetMax: 15000,
    peopleMin: 10,
    peopleMax: 30,
    industry: '生活服务',
    rating: 4.9,
    usageCount: 1890,
    tags: ['童趣', '欢乐', '省心'],
    description: '为小朋友打造梦幻生日派对，主题布置、精彩游戏、美味蛋糕，留下难忘的生日回忆。',
    suitableFor: '儿童生日派对、宝宝宴',
    highlights: ['主题场景布置', '小丑/魔术师', '生日蛋糕', '趣味游戏'],
    items: [
      { category: 'venue', name: '派对场地', amount: 3000, note: '亲子餐厅/轰趴馆4小时' },
      { category: 'catering', name: '餐饮服务', amount: 4000, note: '30人儿童餐+成人餐' },
      { category: 'decoration', name: '主题布置', amount: 2500, note: '气球、背景墙、主题装饰' },
      { category: 'performance', name: '派对娱乐', amount: 2000, note: '小丑表演+互动游戏' },
      { category: 'materials', name: '派对用品', amount: 1000, note: '餐具、吹龙、小礼品' },
      { category: 'gifts', name: '生日蛋糕', amount: 1500, note: '定制主题蛋糕' },
      { category: 'transport', name: '交通费用', amount: 500, note: '物料运输' },
      { category: 'contingency', name: '备用金', amount: 500, note: '应急支出' }
    ]
  },
  {
    id: 7,
    name: '简约小型年会',
    type: 'annual',
    typeName: '企业年会',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20small%20company%20annual%20dinner%20with%20warm%20atmosphere&image_size=landscape_16_9',
    budgetMin: 15000,
    budgetMax: 30000,
    peopleMin: 20,
    peopleMax: 50,
    industry: '通用',
    rating: 4.6,
    usageCount: 987,
    tags: ['简约', '温馨', '高性价比'],
    description: '适合小型团队的年会方案，简约而不简单，在温馨的氛围中总结过去，展望未来。',
    suitableFor: '小型企业、创业团队年会',
    highlights: ['精致餐厅包场', '互动抽奖环节', '精美伴手礼', '轻松氛围'],
    items: [
      { category: 'venue', name: '特色餐厅包场', amount: 8000, note: '4小时包场' },
      { category: 'catering', name: '精致晚宴', amount: 10000, note: '50人套餐' },
      { category: 'decoration', name: '简单布置', amount: 2000, note: '气球、横幅、桌花' },
      { category: 'performance', name: '互动主持', amount: 3000, note: '主持人+游戏设计' },
      { category: 'materials', name: '抽奖奖品', amount: 4000, note: '一二三等奖' },
      { category: 'gifts', name: '伴手礼', amount: 2000, note: '50份定制礼品' },
      { category: 'transport', name: '交通补贴', amount: 1000, note: '员工打车报销' },
      { category: 'contingency', name: '备用金', name: '备用金', amount: 0, note: '应急支出' }
    ]
  },
  {
    id: 8,
    name: '豪华婚礼套餐',
    type: 'wedding',
    typeName: '婚礼庆典',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20wedding%20ceremony%20in%20grand%20hall%20with%20crystal%20chandeliers&image_size=landscape_16_9',
    budgetMin: 200000,
    budgetMax: 300000,
    peopleMin: 200,
    peopleMax: 400,
    industry: '婚庆',
    rating: 4.9,
    usageCount: 234,
    tags: ['奢华', '定制', '梦幻'],
    description: '顶级婚礼策划团队为您打造独一无二的梦幻婚礼，每一个细节都彰显品质与用心。',
    suitableFor: '高端定制婚礼',
    highlights: ['顶级场地', '国际一线婚纱', '明星级摄影', '全程策划师'],
    items: [
      { category: 'venue', name: '五星酒店大宴会厅', amount: 80000, note: '全天使用' },
      { category: 'catering', name: '顶级婚宴', amount: 100000, note: '40桌高端宴席' },
      { category: 'decoration', name: '奢华花艺布置', amount: 40000, note: '进口鲜花+灯光设计' },
      { category: 'performance', name: '明星级团队', amount: 30000, note: '知名司仪+交响乐团' },
      { category: 'materials', name: '定制喜品', amount: 10000, note: '高端定制请柬糖盒' },
      { category: 'gifts', name: '高端回礼', amount: 20000, note: '400份进口礼品' },
      { category: 'transport', name: '豪华婚车队', amount: 10000, note: '劳斯莱斯+超跑车队' },
      { category: 'contingency', name: '备用金', amount: 10000, note: '应急支出' }
    ]
  }
];

const userPlans = [
  {
    id: 1,
    name: '我的2024年会方案',
    type: 'annual',
    typeName: '企业年会',
    totalBudget: 65000,
    people: 80,
    createdAt: '2024-12-01',
    status: '已完成',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=corporate%20annual%20meeting%20stage&image_size=landscape_16_9'
  },
  {
    id: 2,
    name: '小明10岁生日派对',
    type: 'birthday',
    typeName: '生日派对',
    totalBudget: 8000,
    people: 25,
    createdAt: '2024-11-15',
    status: '已完成',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=birthday%20party%20decorations&image_size=landscape_16_9'
  },
  {
    id: 3,
    name: 'Q1团建活动',
    type: 'teambuilding',
    typeName: '团建活动',
    totalBudget: 25000,
    people: 45,
    createdAt: '2024-10-20',
    status: '进行中',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=team%20building%20outdoor&image_size=landscape_16_9'
  }
];

const exportHistory = [
  { id: 1, planName: '我的2024年会方案', format: 'Excel', exportDate: '2024-12-05', size: '256KB' },
  { id: 2, planName: '我的2024年会方案', format: 'PDF', exportDate: '2024-12-05', size: '1.2MB' },
  { id: 3, planName: '小明10岁生日派对', format: 'Excel', exportDate: '2024-11-18', size: '128KB' }
];

function formatMoney(amount) {
  return '¥' + amount.toLocaleString('zh-CN');
}

function getCategoryById(id) {
  return budgetCategories.find(c => c.id === id);
}

function getTypeById(id) {
  return activityTypes.find(t => t.id === id);
}

function getTemplateById(id) {
  return budgetTemplates.find(t => t.id === parseInt(id));
}
