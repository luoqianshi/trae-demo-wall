/* 智慧家 AI - 家庭 AI 事务管家。全部能力为本地静态模拟：不接入外部模型、API、网络图片或真实摄像头。 */

const STORE_KEY = 'jiayouju-memory-space-v1';
const TODAY = '2026-06-27';
const REAL_HOME_SCENE_VERSION = '20260702-home-digital-twin-v21-product-copy-value-polish';

const REAL_HOME_SPEC = {
  netHeight: 2800,
  wall: { inner: 200, outer: 240 },
  door: { interior: { w: 800, h: 2100 }, entry: { w: 900, h: 2100 } },
  skirting: 80,
  sill: 900,
  circulation: { main: 1200, secondary: 900, betweenFurniture: 600 },
  rooms: {
    entry: { w: 2400, d: 2000, shoeCabinet: { w: 1200, d: 350 } },
    living: {
      w: 3900,
      d: 4200,
      window: { wall: 'south', w: 3200, h: 2400, sill: 100 },
      sofa: { w: 2200, d: 900, h: 820, wall: 'north' },
      coffeeTable: { w: 1200, d: 600, h: 420, gapFromSofa: 400 },
      tvCabinet: { w: 2000, d: 350, h: 260, bottom: 180, wall: 'south' },
      sideTable: { w: 500, d: 500, h: 520, side: 'west' }
    },
    dining: {
      w: 3000,
      d: 3600,
      window: { wall: 'north', w: 1800, h: 1500 },
      table: { w: 1600, d: 800 },
      chair: { w: 450, d: 500, count: 4 },
      sideboard: { w: 1200, d: 400, wall: 'east' }
    },
    kitchen: {
      w: 2400,
      d: 3600,
      counter: { d: 600, h: 850 },
      wallCabinet: { d: 350, bottomFromCounter: 700 },
      fridge: { w: 650, d: 650 }
    },
    publicBath: {
      w: 2100,
      d: 2700,
      window: { wall: 'west', w: 600, h: 1500 },
      vanity: { w: 800, d: 500, h: 850 },
      toilet: { w: 400, d: 700, frontClearance: 600 },
      shower: { w: 900, d: 1200 }
    },
    masterBedroom: {
      w: 3600,
      d: 4500,
      bayWindow: { wall: 'south', w: 1800, d: 600, sill: 450 },
      bed: { w: 1800, d: 2000, h: 620, wall: 'north' },
      nightstand: { w: 500, d: 400, h: 500, count: 2 },
      wardrobe: { w: 2400, d: 600, h: 2400, wall: 'east' },
      vanity: { w: 1000, d: 500, h: 760, wall: 'west' }
    },
    masterBath: {
      w: 2400,
      d: 2400,
      vanity: { w: 1000, d: 500 },
      toilet: { w: 400 },
      shower: { w: 1000, d: 1200 }
    },
    secondaryBedroom1: {
      w: 3000,
      d: 3600,
      bed: { w: 1500, d: 2000 },
      nightstand: { w: 500, d: 400 },
      wardrobe: { w: 600, d: 1800 },
      desk: { w: 1200, d: 600 }
    },
    secondaryBedroom2: {
      w: 2800,
      d: 3300,
      desk: { w: 1400, d: 700 },
      bookcase: { w: 350, d: 2000 },
      loungeChair: { w: 800, d: 800 }
    }
  }
};

const CATEGORIES = {
  '家电保修': { ico:'<i data-lucide="zap"></i>', color:'#1c5f54', bg:'#e7f1ee' },
  '房屋合同': { ico:'<i data-lucide="home"></i>', color:'#6f568d', bg:'#f2eef7' },
  '物业水电': { ico:'<i data-lucide="droplet"></i>', color:'#a35c19', bg:'#fff0dc' },
  '保险续费': { ico:'<i data-lucide="shield"></i>', color:'#287a4c', bg:'#e9f6ee' },
  '车辆年检': { ico:'<i data-lucide="car"></i>', color:'#2f6f87', bg:'#e8f2f6' },
  '儿童学籍': { ico:'<i data-lucide="book-open"></i>', color:'#9b5c0c', bg:'#fff4df' },
  '老人复诊': { ico:'<i data-lucide="heart"></i>', color:'#a63b32', bg:'#fff0ee' },
  '旅行证件': { ico:'<i data-lucide="plane"></i>', color:'#5c5aa5', bg:'#f0f0fb' },
  '报销票据': { ico:'<i data-lucide="receipt"></i>', color:'#7a5b24', bg:'#fff7df' },
  '维修工单': { ico:'<i data-lucide="wrench"></i>', color:'#5c6864', bg:'#edf0ed' },
  '大额采购': { ico:'<i data-lucide="shopping-cart"></i>', color:'#1f6b76', bg:'#e8f4f2' },
  '证照到期': { ico:'<i data-lucide="file-text"></i>', color:'#8d3c34', bg:'#fff0ee' }
};

const SPACE_ZONES = [
  { id:'entry', name:'玄关', room:'玄关', short:'玄关', color:'#d8c49a' },
  { id:'study', name:'书房资料', room:'书房', short:'书房', color:'#b9d3c7' },
  { id:'living', name:'客厅抽屉', room:'客厅', short:'客厅', color:'#c9d7e0' },
  { id:'bedroom', name:'卧室收纳', room:'卧室', short:'卧室', color:'#d7c4d8' },
  { id:'safe', name:'隐私资料', room:'隐私遮罩', short:'隐私', color:'#e1c66f' }
];

const FLOOR_ROOMS = [
  { id:'entry-room', name:'玄关', type:'过渡收纳', zones:['entry'], rect:[34,228,132,112], hint:'鞋柜、票据盒、车务文件夹通常从这里取放' },
  { id:'living-room', name:'客厅', type:'公共活动', zones:['living'], rect:[168,174,226,166], hint:'抽屉里常放维修单、临时报销票据和近期待处理资料' },
  { id:'utility-room', name:'储物', type:'家政收纳', zones:[], rect:[34,68,180,158], hint:'备用工具、清洁耗材和家政用品集中收纳，不参与今日处理页室内漫游' },
  { id:'study-room', name:'次卧 / 书房', type:'档案工作', zones:['study'], rect:[216,68,178,104], hint:'资料柜集中放家电保修、入学材料和大额采购合同' },
  { id:'master-room', name:'主卧', type:'成人卧室', zones:['bedroom'], rect:[396,54,204,128], hint:'卧室收纳只显示区域，不暴露医疗或证件精确容器' },
  { id:'kid-room', name:'儿童', type:'儿童资料', zones:['study'], rect:[396,184,122,156], hint:'儿童学籍资料实际归到书房资料柜，儿童房只作为事务关联房间' },
  { id:'elder-room', name:'长辈', type:'照护资料', zones:['bedroom'], rect:[520,184,112,156], hint:'复诊、药盒和照护交接只显示房间级位置' },
  { id:'bath-room', name:'卫浴', type:'维修关联', zones:['living'], rect:[602,54,98,128], hint:'水管、角阀等维修工单从这里产生，归到客厅抽屉待处理' },
  { id:'balcony', name:'生活阳台', type:'家电关联', zones:['study'], rect:[216,12,384,40], hint:'洗衣机相关保修仍归书房资料柜，不在阳台暴露实物位置' }
];

const CAMERA_STEPS = ['识别区域','发现档案容器','判断资料类型','隐私遮罩','多摄像头融合','合并到家庭记忆空'];

/* 3D安防摄像头配置（公共视图北墙/南墙高位安装） */
const SECURITY_CAMERAS = [
  {id:0, zone:'study',  label:'书房资料柜视', x:5.5, y:2.55, z:0.04, dir:1,  sweepX:5.5, sweepZ:3.0},
  {id:1, zone:'entry',  label:'玄关柜视',     x:0.35,y:2.55, z:0.04, dir:1,  sweepX:1.0, sweepZ:3.0},
  {id:2, zone:'living', label:'客厅抽屉视角',   x:3.5, y:2.55, z:0.04, dir:1,  sweepX:3.5, sweepZ:3.5},
  {id:3, zone:'balcony',label:'阳台监控',       x:6.88, y:2.58, z:4.72, dir:-1, sweepX:4.96, sweepZ:4.86, clickProxyY:2.02, clickProxyW:.44, clickProxyH:.34}
];

const CAMERA_RESULTS = [
  { zone:'study', camera:'书房资料柜视', container:'家电保修', archiveId:'A001', confidence:.91, suggestion:'建议关联洗衣机保修卡', source:'书房空间线索采集 + AI 归位建议', privacy:'public' },
  { zone:'entry', camera:'玄关柜视', container:'票据', archiveId:'A004', confidence:.84, suggestion:'建议关联车险续费', source:'玄关柜空间线索采集 + AI 归位建议', privacy:'room_only' },
  { zone:'living', camera:'客厅抽屉视角', container:'临时维修单夹', archiveId:'A010', confidence:.76, suggestion:'建议人工确认客厅维修工单', source:'客厅抽屉空间线索采集 + AI 归位建议', privacy:'public' },
  { zone:'safe', camera:'隐私资料遮罩', container:'已遮', archiveId:null, confidence:.88, suggestion:'敏感资料不作为房间功能区展示，只保留隐藏位置状态', source:'隐私遮罩结果', privacy:'hidden' }
];

const TOUR_NODES = [
  {
    id:'living-node', name:'客厅', zone:'living', room:'客厅', icon:'<i data-lucide="home"></i>', yaw:0, lookYaw:-18, pos:[-.65,1.54,3.15], map:[48,58],
    desc:'站在入户到客餐厅的中轴，可以同时看到玄关、客厅、阳台采光面和通往书房/卧室的真实动线',
    exits:[{to:'entry-node', label:'去玄关柜', x:.16, y:.62},{to:'study-node', label:'进书', x:.36, y:.46},{to:'bedroom-node', label:'去卧', x:.72, y:.45},{to:'balcony-node', label:'去阳', x:.52, y:.31},{to:'bath-node', label:'看卫生间', x:.84, y:.55}]
  },
  {
    id:'entry-node', name:'玄关', zone:'entry', room:'玄关', icon:'<i data-lucide="door-open"></i>', yaw:22, lookYaw:72, pos:[-5.15,1.52,3.35], map:[18,68],
    desc:'玄关面向客厅开放，能看到鞋柜、入户门和通向客餐厅的连续过道',
    exits:[{to:'living-node', label:'进客', x:.56, y:.55},{to:'balcony-node', label:'看阳', x:.69, y:.36},{to:'study-node', label:'看书', x:.44, y:.48},{to:'bedroom-node', label:'卧室门口', x:.82, y:.48}]
  },
  {
    id:'study-node', name:'书房', zone:'study', room:'次卧 / 书房', icon:'<i data-lucide="book"></i>', yaw:-12, lookYaw:116, pos:[-4.85,1.54,-2.55], map:[42,28],
    desc:'书房从门口向内看资料柜和书桌，左侧仍能感知回到客厅的门洞',
    exits:[{to:'living-node', label:'回客', x:.28, y:.58},{to:'balcony-node', label:'看阳', x:.72, y:.36}]
  },
  {
    id:'bedroom-node', name:'卧室', zone:'bedroom', room:'主卧 / 长辈', icon:'<i data-lucide="bed"></i>', yaw:-28, lookYaw:-8, pos:[3.82,1.54,-2.05], map:[72,34],
    desc:'卧室从门口看向床、衣柜和窗面，右侧动线回到客厅与公共卫生间',
    exits:[{to:'living-node', label:'回客', x:.32, y:.58},{to:'bath-node', label:'去卫生间', x:.7, y:.45}]
  },
  {
    id:'balcony-node', name:'生活阳台', zone:'study', room:'生活阳台', icon:'<i data-lucide="sun"></i>', yaw:8, lookYaw:168, pos:[.55,1.52,-4.68], map:[52,12],
    desc:'生活阳台沿采光面展开，能看到洗衣机、晾衣区和返回客厅/书房的推拉门',
    exits:[{to:'living-node', label:'回客', x:.32, y:.58},{to:'study-node', label:'回书', x:.66, y:.5}]
  },
  {
    id:'bath-node', name:'卫生', zone:'living', room:'卫生', icon:'<i data-lucide="bath"></i>', yaw:-16, lookYaw:-42, pos:[4.85,1.52,.78], map:[86,24],
    desc:'卫生间从门口看向洗手台、淋浴玻璃和高窗，只作为维修工单发生空间',
    exits:[{to:'living-node', label:'回客', x:.3, y:.58},{to:'bedroom-node', label:'去卧', x:.72, y:.5}]
  }
];

const SOURCE_TEXT = {
  ocr:'原始识别',
  inferred:'AI 推断',
  manual:'人工补全',
  seed:'初始档案',
  camera:'空间线索采集',
  import:'导入识别'
};

const PRIVACY_TEXT = {
  public:'可显示精确容器',
  room_only:'只显示房间或区域',
  hidden:'隐藏精确位置'
};

const SEED_ARCHIVES = [
  {
    id:'A001', title:'海尔洗衣机发票与保修', category:'家电保修', status:'archived', riskLevel:'medium',
    familyMember:'周先生（爸爸）', date:'2024-03-15', amountOrTerm:'¥3,299 / 保修至 2027-03-15',
    sourceMaterial:'电子发票、保修卡、售后维修记录', rawType:'发票 + 保修',
    rawPreview:'海尔滚筒洗衣机 EG100MAX5 / 金额 ¥3,299 / 购买 2024-03-15 / 整机保修 3 年',
    fields:[
      f('购买日期','2024-03-15','ocr',.98), f('金额','¥3,299','ocr',.97), f('品牌','海尔','ocr',.98),
      f('型号','EG100MAX5','ocr',.95), f('保修','3 年','ocr',.93), f('保修到期','2027-03-15','inferred',.91),
      f('售后电话','400-000-9001','ocr',.89), f('家庭成员','周先生（爸爸）','manual',1)
    ],
    evidence:['电子发票','保修卡照片','2025 年排水泵维修单','售后短信回执'],
    events:[
      ev('2024-03-15','购买','京东自营购入海尔洗衣机','周先生（爸爸）','¥3,299'),
      ev('2025-08-02','维修','保修内更换排水泵，维修单已补齐','林女士','¥0'),
      ev('2026-06-18','空间复核','AI 建议将保修卡归到书房资料柜的家电保修夹','系统','')
    ],
    reminders:[rem('R001','2027-02-13','保修到期 30 天前确认是否延保','pending')],
    operations:[op('2024-03-15 10:22','AI 归档生成档案','系统'), op('2026-06-18 20:10','空间位置复核：书房资料柜 / 家电保修','系统')],
    handover:'洗衣机由林女士日常使用，售后联系人为周先生。保修卡和维修单归在书房资料柜的家电保修夹。',
    ai:ai('家电保修资料',['购买日期、金额、品牌、型号来自发票 OCR','保修到期由购买日和保修期推断','家庭成员由人工确认'],'发票与保修卡同时出现，型号、保修期和售后电话完整，适合归为家电保修','2027-03-15 保修到期，建议提前 30 天提醒','书房资料 / 家电保修','不含证照或贵重物品，允许显示精确容器',['是否购买过延保？','维修单号是否需要补充？']),
    memoryRoom:'书房', memoryZone:'study', memoryContainer:'家电保修', locationPrivacy:'public', locationConfidence:.82, locationSource:'手动记忆位置 + AI 归位建议',
    nextActions:['开始处理提醒','生成家电维修交接说明'], searchKeywords:['洗衣机','爸爸','保修','2027','家电保修','书房资料']
  },
  {
    id:'A002', title:'上海市某区房屋租赁合同与押金凭证', category:'房屋合同', status:'archived', riskLevel:'high',
    familyMember:'全家', date:'2024-09-01', amountOrTerm:'租期至 2026-08-31 / 押金 ¥12,000',
    sourceMaterial:'租赁合同、押金收据、水电表底数记录', rawType:'合同 + 押金凭证',
    rawPreview:'租期 2024-09-01 至 2026-08-31 / 押金 ¥12,000 / 地址已脱敏',
    fields:[
      f('合同编号','SH-ZL-2024-0821','ocr',.94), f('租期开始','2024-09-01','ocr',.97), f('租期结束','2026-08-31','ocr',.96),
      f('月租','¥6,000','ocr',.94), f('押金','¥12,000','ocr',.95), f('房屋地址','上海市某区某 8 号（脱敏）','ocr',.9),
      f('房东','王女士','ocr',.88), f('家庭成员','全家','manual',1)
    ],
    evidence:['合同首页','签字页','押金收据','入住水电表底数'],
    events:[ev('2024-09-01','签约','签订房屋租赁合同并支付押金','周先生','¥12,000'), ev('2026-08-31','到期','合同到期，需要退租交接并追回押金','全家','')],
    reminders:[rem('R002','2026-07-02','退租前 60 天整理交接清单','pending'), rem('R003','2026-08-16','退租前 15 天预约验房','pending')],
    operations:[op('2024-09-01 15:40','AI 归档生成房屋合同档案','系统'), op('2026-06-10 21:04','补充水电表底数记录','周先生')],
    handover:'退租交接由周先生负责。押金收据、合同签字页和水电底数需要一起带上；精确存放柜格默认隐藏。',
    ai:ai('房屋合同资料',['租期、押金、房屋地址来自合同 OCR','退租提醒由租期结束日期推断','水电表底数来自人工补充'],'合同、押金凭证和水电底数构成同一退租证据链，应合并归档','2026-08-31 到期，押金追回和验房是高风险事项','隐私资料位置','房屋合同默认不展示精确容器',['是否已经确认续租？','押金收据是否有原件？']),
    memoryRoom:'隐私资料位置', memoryZone:'safe', memoryContainer:'防火文件袋第 2 层', locationPrivacy:'hidden', locationConfidence:.95, locationSource:'人工设置为隐私遮罩',
    nextActions:['开始处理提醒','生成退租交接说明'], searchKeywords:['房屋合同','押金','租赁','退租','水电']
  },
  {
    id:'A003', title:'2026 上半年物业水电缴费凭证', category:'物业水电', status:'archived', riskLevel:'low',
    familyMember:'林女士', date:'2026-06-05', amountOrTerm:'¥1,286 / 2026 年 1-6 月',
    sourceMaterial:'物业缴费单、水电费电子回执', rawType:'缴费凭证',
    rawPreview:'物业 ¥980 / 水电 ¥306 / 缴费日期 2026-06-05 / 小区名称已脱敏',
    fields:[f('缴费日期','2026-06-05','ocr',.96), f('缴费周期','2026 年 1-6 月','ocr',.93), f('金额','¥1,286','ocr',.97), f('缴费方式','微信支付','ocr',.9), f('家庭成员','林女士','manual',1)],
    evidence:['物业缴费单','水费电子回执','电费电子回执'],
    events:[ev('2026-06-05','缴费','完成 2026 上半年物业水电缴费','林女士','¥1,286')],
    reminders:[rem('R004','2026-12-20','下半年物业水电缴费提醒','pending')],
    operations:[op('2026-06-05 19:20','AI 归档生成缴费档案','系统')],
    handover:'物业水电由林女士处理。退租或报销时可从此档案找回缴费凭证。',
    ai:ai('物业水电缴费资料',['缴费日期、周期、金额来自回执','下次缴费日期由周期推断'],'同一周期内的物业、水费、电费可以合并为物业水电档案','下半年仍需缴费，风险低','玄关 / 票据','普通缴费凭证允许显示容器',['下半年是否仍按半年缴费？']),
    memoryRoom:'玄关', memoryZone:'entry', memoryContainer:'票据', locationPrivacy:'public', locationConfidence:.87, locationSource:'人工记忆位置',
    nextActions:['设置下半年缴费提醒','复制缴费信息'], searchKeywords:['物业','水电','缴费','票据']
  },
  {
    id:'A004', title:'2026 车险续费通知与保单', category:'保险续费', status:'archived', riskLevel:'high',
    familyMember:'周先生（爸爸）', date:'2026-06-12', amountOrTerm:'保期至 2026-07-20 / 保费 ¥4,280',
    sourceMaterial:'续费短信、电子保单、支付记录', rawType:'车险保单 + 续费通知',
    rawPreview:'沪 A***21 / 商业险 + 交强险 / 保期至 2026-07-20 / 保费 ¥4,280',
    fields:[f('车牌','沪 A***21','ocr',.93), f('保险公司','人保财险','ocr',.9), f('保期结束','2026-07-20','ocr',.95), f('保费','¥4,280','ocr',.92), f('家庭成员','周先生（爸爸）','manual',1)],
    evidence:['电子保单','续费短信','支付记录截图'],
    events:[ev('2025-07-20','投保','上一年度车险生效','周先生','¥4,120'), ev('2026-07-20','到期','车险到期，需要续费','周先生','')],
    reminders:[rem('R005','2026-07-05','车险到期 15 天前确认续费方案','pending'), rem('R006','2026-07-20','车险到期','pending')],
    operations:[op('2026-06-12 12:10','AI 归档生成保险续费档案','系统')],
    handover:'车险由周先生处理。保险类资料默认只显示房间或区域，不展示精确容器。',
    ai:ai('保险续费资料',['保期结束、保费、车牌来自保单 OCR','续费提醒由保期结束日期推断'],'车险具有明确到期日和费用，适合进入风险处理','2026-07-20 到期，属于近期高优先事项','玄关柜（精确容器隐藏）','保险资料建议只显示房间或区域',['是否已有新报价？','是否需要保留上一年度保单？']),
    memoryRoom:'玄关', memoryZone:'entry', memoryContainer:'票据', locationPrivacy:'room_only', locationConfidence:.8, locationSource:'人工记忆位置',
    nextActions:['开始处理提醒','复制保单摘要'], searchKeywords:['车险','续费','保单','什么时候续','玄关']
  },
  {
    id:'A005', title:'家庭车辆年检与行驶证记录', category:'车辆年检', status:'archived', riskLevel:'medium',
    familyMember:'周先生（爸爸）', date:'2026-03-12', amountOrTerm:'年检有效至 2026-09-15',
    sourceMaterial:'行驶证副页、年检回执、环保检验单', rawType:'车辆年检资料',
    rawPreview:'沪 A***21 / 年检有效期至 2026-09-15 / 行驶证尾号 4821',
    fields:[f('车辆','家庭轿车（沪 A***21）','ocr',.94), f('年检有效期至','2026-09-15','ocr',.95), f('行驶证尾号','4821','ocr',.9), f('家庭成员','周先生（爸爸）','manual',1)],
    evidence:['行驶证副页','年检回执','环保检验单'],
    events:[ev('2026-03-12','年检','完成本年度车辆年检','周先生','¥0'), ev('2026-09-15','到期','下次年检期限','周先生','')],
    reminders:[rem('R007','2026-08-16','车辆年检到期 30 天前提醒','pending')],
    operations:[op('2026-03-12 17:35','AI 归档生成车辆年检档案','系统')],
    handover:'车务资料由周先生保管。出险或年检时先查本档案，再带行驶证原件。',
    ai:ai('车辆年检资料',['有效期、车牌尾号来自行驶证副页','提醒日期由有效期推断'],'资料内容围绕车辆有效期，应归为车辆年检','9 月前需要再次确认年检','玄关 / 车务文件','普通车务资料可显示容器',['是否需要加入保险保单关联？']),
    memoryRoom:'玄关', memoryZone:'entry', memoryContainer:'车务文件', locationPrivacy:'public', locationConfidence:.88, locationSource:'人工记忆位置',
    nextActions:['设置年检提醒','复制车辆资料'], searchKeywords:['车辆','年检','行驶证','车务']
  },
  {
    id:'A006', title:'小雨小学入学材料核对', category:'儿童学籍', status:'supplement', riskLevel:'high',
    familyMember:'小雨', date:'2026-06-08', amountOrTerm:'补资料截止 2026-08-10',
    sourceMaterial:'入学通知、户口本复印件、居住登记回执', rawType:'入学材料',
    rawPreview:'一年级入学材料 / 户口本复印件已齐 / 居住登记回执页模糊 / 截止 2026-08-10',
    fields:[f('学生','小雨','ocr',.96), f('入学年级','一年级','ocr',.95), f('报到日期','2026-08-25','ocr',.91), f('户口本','已准备复印件','manual',1), f('缺失材料','居住登记回执清晰页','inferred',.72), f('家庭成员','小雨','manual',1)],
    evidence:['入学通知','户口本复印件','居住登记回执模糊页'],
    events:[ev('2026-06-08','归档','建立入学材料档案','林女士',''), ev('2026-08-10','截止','需补齐居住登记回执清晰页','小雨','')],
    reminders:[rem('R008','2026-08-01','入学材料补齐 9 天前提醒','pending'), rem('R009','2026-08-25','入学报到日提醒','pending')],
    operations:[op('2026-06-08 21:10','低置信度识别：居住登记回执页模糊','系统'), op('2026-06-09 08:40','人工确认户口本复印件已齐','林女士')],
    handover:'入学材料由林女士负责。户口本复印件已齐，仍需补拍居住登记回执清晰页。',
    lowConfidence:low('居住登记回执页边缘反光，地址和受理日期无法稳定识别',['居住登记回执受理日期','经办机构'],['请补拍清晰回执页','是否已有学校材料清单原件？'],'已人工确认户口本复印件已齐；缺失材料字段保留为待补','小雨小学入学材料核对','AI 标记低置信度后由林女士人工确认户口本'),
    ai:ai('儿童学籍资料',['学生姓名、年级、报到日期来自入学通知','缺失材料由材料清单推断','户口本状态由人工确认'],'入学通知和户口本复印件同属入学材料，需要合并并标出缺口','居住登记回执缺失会影响报到，当前为高风险','书房资料柜（精确容器隐藏）','儿童学籍资料建议只显示房间或区域',['居住登记回执是否已补拍？','学校是否要求疫苗证明？']),
    memoryRoom:'书房', memoryZone:'study', memoryContainer:'小雨入学材料', locationPrivacy:'room_only', locationConfidence:.73, locationSource:'人工补全 + AI 归位建议',
    nextActions:['开始补资料','生成入学材料清单'], searchKeywords:['入学','户口','小雨','缺什么','学籍']
  },
  {
    id:'A007', title:'外婆 7 月复诊与用药资料', category:'老人复诊', status:'archived', riskLevel:'high',
    familyMember:'外婆', date:'2026-06-15', amountOrTerm:'下次复诊 2026-07-12 / 检查费用约 ¥320',
    sourceMaterial:'门诊病历、处方单、检查单', rawType:'复诊资料',
    rawPreview:'外婆 / 内分泌复诊 / 2026-07-12 / 需带医保卡、上次处方、检查单',
    fields:[f('患者','外婆','ocr',.97), f('复诊科室','内分泌科','ocr',.93), f('复诊日期','2026-07-12','ocr',.95), f('需携带','医保卡、上次处方、血糖记录、检查单','manual',1), f('家庭成员','外婆','manual',1)],
    evidence:['门诊病历','处方单','血糖记录表','检查单'],
    events:[ev('2026-06-15','就诊','完成一次复诊并开 30 天用药','外婆','¥286'), ev('2026-07-12','复诊','下次复诊，需要携带既往资料','外婆','约 ¥320')],
    reminders:[rem('R010','2026-07-11','复诊前一天整理医保卡、处方和检查单','pending'), rem('R011','2026-07-05','提前一周确认挂号和陪同','pending')],
    operations:[op('2026-06-15 18:20','AI 归档生成老人复诊档案','系统'), op('2026-06-15 18:35','人工补充复诊要带材料','林女士')],
    handover:'外婆复诊由林女士陪同。药盒在卧室，病历和检查单只显示卧室区域，不展示精确容器。',
    ai:ai('老人复诊资料',['复诊日期和科室来自病历 OCR','需携带材料由处方、检查单和人工补充合并','提醒日期由复诊日期推断'],'医疗资料需要围绕复诊日期、带什么、谁陪同来组织','2026-07-12 即将复诊，需要提前准备材料','卧室收纳（精确容器隐藏）','医疗照护资料建议只显示房间或区域',['陪同人是否确定？','血糖记录是否已打印？']),
    memoryRoom:'卧室', memoryZone:'bedroom', memoryContainer:'外婆药盒旁文件袋', locationPrivacy:'room_only', locationConfidence:.86, locationSource:'人工记忆位置',
    nextActions:['开始处理提醒','生成复诊携带清单'], searchKeywords:['外婆','复诊','7 月','带什么','医保','处方']
  },
  {
    id:'A008', title:'全家旅行证件有效期核对', category:'旅行证件', status:'archived', riskLevel:'medium',
    familyMember:'全家', date:'2026-05-01', amountOrTerm:'最早到期 2027-01-10',
    sourceMaterial:'护照页、港澳通行证页、行程材料', rawType:'旅行证件',
    rawPreview:'周先生护照尾 19 / 林女士港澳通行证尾 62 / 小雨证件页反光',
    fields:[f('周先生护照尾号','19','ocr',.92), f('林女士港澳通行证尾号','62','ocr',.9), f('小雨证件有效期','2027-01-10','manual',.95), f('家庭成员','全家','manual',1)],
    evidence:['护照资料页脱敏照','港澳通行证页脱敏照片','行程材料'],
    events:[ev('2026-05-01','核对','完成全家旅行证件有效期核对','林女士',''), ev('2027-01-10','到期','小雨旅行证件最早到期','小雨','')],
    reminders:[rem('R012','2026-11-10','旅行证件最早到期前 60 天提醒','pending')],
    operations:[op('2026-05-01 09:20','低置信度识别：小雨证件页反光','系统'), op('2026-05-01 09:32','人工补全小雨证件有效期','林女士')],
    handover:'旅行证件属于敏感资料，系统只显示隐私遮罩状态。出行前由林女士统一核对。',
    lowConfidence:low('证件页反光导致有效期末位模糊',['小雨证件有效期末位','证件签发机关'],['请核对原件有效期','是否需要加入签证页？'],'人工补全小雨证件有效期为 2027-01-10','全家旅行证件有效期核对','AI 标记反光，林女士手动补全有效期'),
    ai:ai('旅行证件资料',['证件尾号来自 OCR','小雨有效期由人工补全','到期提醒由最早有效期推断'],'旅行证件应按家庭成员和最早到期日组织','最早 2027-01-10 到期，需提前 60 天提醒','隐私资料位置','证件默认隐藏精确位置',['是否有签证页需要一起归档？']),
    memoryRoom:'隐私资料位置', memoryZone:'safe', memoryContainer:'证件防水袋', locationPrivacy:'hidden', locationConfidence:.92, locationSource:'人工设置为隐私遮罩',
    nextActions:['设置证件到期提醒','生成出行证件清单'], searchKeywords:['旅行','证件','护照','通行证','有效期']
  },
  {
    id:'A009', title:'林女士门诊报销票据', category:'报销票据', status:'supplement', riskLevel:'medium',
    familyMember:'林女士', date:'2026-04-08', amountOrTerm:'报销金额待核 / 票据合计 ¥836',
    sourceMaterial:'门诊发票、支付小票、费用清单', rawType:'报销票据',
    rawPreview:'门诊发票折痕遮挡 / 金额疑似 ¥836 / 日期 2026-04-08 / 费用清单缺页',
    fields:[f('就诊日期','2026-04-08','ocr',.78), f('票据金额','¥836（待核对）','inferred',.63), f('费用清单','缺第 2 页','inferred',.56), f('家庭成员','林女士','manual',1)],
    evidence:['门诊发票折痕照片','支付小票','费用清单第 1 页'],
    events:[ev('2026-04-08','就诊','门诊票据待报销','林女士','¥836'), ev('2026-06-30','补资料','补齐费用清单第 2 页','林女士','')],
    reminders:[rem('R013','2026-06-30','补齐费用清单第 2 页并核对报销金额','pending')],
    operations:[op('2026-04-08 20:10','低置信度识别：发票折痕遮挡金额','系统')],
    handover:'报销资料由林女士处理。金额和费用清单仍需人工核对，精确位置只显示区域。',
    lowConfidence:low('发票折痕遮挡金额，小票与费用清单页数不一致',['票据最终金额','费用清单第 2 页'],['是否能补拍完整发票？','费用清单是否还有一页？'],'人工确认就诊日期，金额暂按 ¥836 待核对','林女士门诊报销票据','AI 标记折痕遮挡，等待补齐费用清单'),
    ai:ai('报销票据资料',['就诊日期来自发票 OCR','金额由小票和费用清单推断','缺页由页码连续性判断'],'报销票据需要金额、日期、费用清单组成完整证据链','费用清单缺页会影响报销，需补齐','客厅抽屉（精确容器隐藏）','医疗报销票据建议只显示区域',['是否已补齐费用清单第 2 页？','报销截止日是什么？']),
    memoryRoom:'客厅', memoryZone:'living', memoryContainer:'报销待处理夹', locationPrivacy:'room_only', locationConfidence:.69, locationSource:'人工记忆位置',
    nextActions:['开始补资料','复制报销摘要'], searchKeywords:['报销','票据','门诊','费用清单']
  },
  {
    id:'A010', title:'客厅水管维修工单', category:'维修工单', status:'archived', riskLevel:'medium',
    familyMember:'林女士', date:'2026-06-16', amountOrTerm:'¥480 / 维修质保至 2026-09-16',
    sourceMaterial:'维修工单、支付记录、师傅回访短信', rawType:'维修工单',
    rawPreview:'客厅水管渗漏 / 更换角阀与软管 / 维修 ¥480 / 质保 3 个月',
    fields:[f('维修日期','2026-06-16','ocr',.95), f('金额','¥480','ocr',.91), f('故障','客厅水管渗漏','ocr',.94), f('质保到期','2026-09-16','inferred',.85), f('家庭成员','林女士','manual',1)],
    evidence:['维修工单','支付记录','师傅回访短信'],
    events:[ev('2026-06-16','维修','维修客厅水管渗漏并更换角阀','林女士','¥480'), ev('2026-09-16','到期','维修质保到期','林女士','')],
    reminders:[rem('R014','2026-09-01','维修质保到期 15 天前检查是否复漏','pending')],
    operations:[op('2026-06-16 16:22','AI 归档生成维修工单档案','系统'), op('2026-06-16 16:35','位置待复核：暂放书房待整理维修夹','系统')],
    handover:'客厅水管维修联系人为林女士。空间线索确认后会将临时维修单从待整理位置归到客厅抽屉。',
    ai:ai('维修工单资料',['维修日期、金额、故障来自工单 OCR','质保到期由维修日加 3 个月推断'],'维修资料有明确质保期，应归为维修工单并设置复查提醒','质保到期前需要检查是否复漏','客厅抽屉 / 临时维修单夹','普通维修工单可显示容器',['是否还有施工前后照片？']),
    memoryRoom:'书房', memoryZone:'study', memoryContainer:'待整理维修夹', locationPrivacy:'public', locationConfidence:.48, locationSource:'低置信度临时位置',
    nextActions:['设置质保复查提醒','复制维修工单信息'], searchKeywords:['维修','水管','客厅','临时维修']
  },
  {
    id:'A011', title:'小雨学习桌大额采购凭证', category:'大额采购', status:'archived', riskLevel:'low',
    familyMember:'小雨', date:'2026-02-18', amountOrTerm:'¥5,680 / 五年结构保修',
    sourceMaterial:'采购合同、发票、安装验收单', rawType:'采购合同 + 发票',
    rawPreview:'儿童学习桌套装 / 金额 ¥5,680 / 五年结构保修 / 安装验收单已签收',
    fields:[f('购买日期','2026-02-18','ocr',.96), f('金额','¥5,680','ocr',.95), f('品类','儿童学习桌套装','ocr',.92), f('保修','5 年','ocr',.9), f('家庭成员','小雨','manual',1)],
    evidence:['采购合同','电子发票','安装验收单'],
    events:[ev('2026-02-18','购买','购入小雨学习桌套装','林女士','¥5,680'), ev('2026-02-20','安装','完成安装验收','周先生','')],
    reminders:[rem('R015','2031-01-18','结构保修到期 30 天前提醒','pending')],
    operations:[op('2026-02-18 22:05','AI 归档生成大额采购档案','系统')],
    handover:'学习桌采购和保修由林女士处理。安装验收单与合同在书房资料柜。',
    ai:ai('家庭大额采购资料',['购买日期、金额、品类来自发票 OCR','保修期来自合同条款'],'金额较高且带长期保修，应作为大额采购独立归档','当前风险低，主要保留保修与验收证据','书房资料 / 大额采购','普通采购资料可显示容器',['是否有安装照片？']),
    memoryRoom:'书房', memoryZone:'study', memoryContainer:'大额采购', locationPrivacy:'public', locationConfidence:.89, locationSource:'人工记忆位置',
    nextActions:['复制采购凭证摘要','生成保修交接说明'], searchKeywords:['大额采购','学习桌','小雨','发票']
  },
  {
    id:'A012', title:'周先生驾驶证到期换证提醒', category:'证照到期', status:'archived', riskLevel:'high',
    familyMember:'周先生（爸爸）', date:'2026-05-20', amountOrTerm:'有效期至 2026-10-09 / 尾号 4821',
    sourceMaterial:'驾驶证脱敏页、体检提醒短信', rawType:'驾驶证',
    rawPreview:'周先生驾驶证尾号 4821 / 有效期至 2026-10-09 / 需要提前体检换证',
    fields:[f('持有人','周先生（爸爸）','ocr',.96), f('证照类型','驾驶证','inferred',.95), f('证照尾号','4821','ocr',.92), f('有效期至','2026-10-09','ocr',.97), f('家庭成员','周先生（爸爸）','manual',1)],
    evidence:['驾驶证脱敏页','体检提醒短信','换证材料清单'],
    events:[ev('2026-05-20','核对','建立驾驶证到期提醒','周先生',''), ev('2026-10-09','到期','驾驶证有效期截止','周先生','')],
    reminders:[rem('R016','2026-08-10','驾驶证到期前 60 天安排体检换证','pending'), rem('R017','2026-09-09','驾驶证到期前 30 天确认受理','pending')],
    operations:[op('2026-05-20 12:28','AI 归档生成证照到期档案','系统')],
    handover:'证照资料由周先生本人保管。系统隐藏精确位置，只保留到期提醒和材料清单。',
    ai:ai('证照到期资料',['有效期和尾号来自证件 OCR','换证提醒由有效期推断'],'证照到期具备强时限性，应进入风险处理','2026-10-09 到期，需要提前体检换证','隐私资料位置','证照默认隐藏精确位置',['是否已预约体检？']),
    memoryRoom:'隐私资料位置', memoryZone:'safe', memoryContainer:'证照密封袋', locationPrivacy:'hidden', locationConfidence:.94, locationSource:'人工设置为隐私遮罩',
    nextActions:['开始处理提醒','生成换证材料清单'], searchKeywords:['证照','驾驶证','到期','换证','尾号4821']
  }
];

const DEMO_INCIDENTS = [
  {
    id:'water-leak-balcony',
    title:'生活阳台洗衣机水浸风险',
    severity:'urgent',
    room:'生活阳台',
    scene:'home-safety',
    device:{type:'water_leak_sensor', name:'水浸传感器', status:'triggered', locationLabel:'洗衣机排水口附近'},
    tourNode:'balcony-node',
    floorRoom:'balcony',
    incidentPoint:{x:.42,y:.18},
    evidenceZone:'study',
    evidenceArchiveIds:['A001'],
    reminderId:'R-WATER-001',
    ai:{
      what:'生活阳台水浸传感器已触发，位置靠近洗衣机排水口。',
      why:'系统同时找到洗衣机保修档案和上次排水泵维修记录，说明可以立即准备售后材料。',
      impact:'如果不及时处理，可能影响阳台地面、墙面和楼下邻里关系。',
      next:['检查排水管','拍照留存','打开洗衣机保修档案','联系售后','24 小时后复查']
    },
    commercial:{materialPack:'家电维修材料包', service:'用户授权后联系维修服务'}
  }
];

const HOME_SCENARIOS = [
  {
    id:'overview',
    title:'全屋一眼看懂',
    subtitle:'安全 / 舒适 / 能耗',
    className:'overview',
    tourNode:'living-node',
    zone:null,
    aiQuery:'家里现在最需要处理什么？',
    strip:'全屋状态总览：安全、舒适、能耗和待办事项在同一套空间里同步。',
    summary:'用空间视角看全屋状态，而不是在设备列表里逐项寻找。',
    apply:{lightOn:true, windowOpen:true, rightDoorOpen:false}
  },
  {
    id:'incident',
    title:'异常事件',
    subtitle:'洗衣机水浸闭环',
    className:'warning',
    tourNode:'balcony-node',
    zone:'study',
    aiQuery:'为什么判断阳台水浸风险？',
    strip:'异常事件：生活阳台水浸被定位到空间，AI 正在匹配保修证据。',
    summary:'3D 负责看见风险位置，2D 负责精确定位，AI 负责解释和行动。'
  },
  {
    id:'away',
    title:'离家模式',
    subtitle:'门锁 / 灯光 / 传感器',
    className:'automation',
    tourNode:'entry-node',
    zone:'entry',
    aiQuery:'离家模式做了什么？',
    strip:'离家模式：门锁、窗户、灯光和水浸传感器进入守护状态。',
    summary:'一键离家不只是开关设备，而是让空间状态变成可确认的安全闭环。',
    apply:{lightOn:false, windowOpen:false, rightDoorOpen:false}
  },
  {
    id:'sleep',
    title:'睡眠模式',
    subtitle:'卧室舒适 / 客厅降耗',
    className:'sleep',
    tourNode:'bedroom-node',
    zone:'bedroom',
    aiQuery:'睡眠模式怎么保护家人？',
    strip:'睡眠模式：卧室保持舒适，客厅降耗，门窗和水浸保持安静守护。',
    summary:'睡眠场景把舒适、能耗和安全放在同一个夜间状态里。',
    apply:{lightOn:false, windowOpen:false, rightDoorOpen:true}
  },
  {
    id:'elder-care',
    title:'老人夜起',
    subtitle:'路径灯 / 关怀提醒',
    className:'care',
    tourNode:'bedroom-node',
    zone:'bedroom',
    aiQuery:'老人夜起场景怎么工作？',
    strip:'老人夜起：卧室到卫浴路径灯亮起，长时间未活动再通知子女。',
    summary:'关怀不是弹一条通知，而是把人、路径、房间和家人通知连成闭环。',
    apply:{lightOn:false, windowOpen:false, rightDoorOpen:true}
  }
];

const FAMILY_MEMBERS = [
  {
    id:'zhou',
    name:'周先生',
    role:'Owner',
    badge:'爸爸 / Owner',
    responsibility:'保修、合同、外部服务确认',
    focus:'维修授权、合同与高价值资产',
    canView:'全屋设备状态、合同摘要、服务回执和授权日志',
    canControl:'门锁、服务确认、授权单和关键设备',
    privacyRule:'可查看敏感资料摘要，但默认不暴露外婆医疗原件和儿童资料细节',
    serviceRole:'对外服务确认人'
  },
  {
    id:'lin',
    name:'林女士',
    role:'Manager',
    badge:'妈妈 / Manager',
    responsibility:'现场处理、照护安排、家庭事务分工',
    focus:'水浸处理、老人复诊、夜起关怀',
    canView:'风险队列、复诊资料、照护状态、家庭待办',
    canControl:'处理事项、照护方案、服务草案和回执确认',
    privacyRule:'可见房间级敏感资料位置，默认不展开证照原件内容',
    serviceRole:'日常运营负责人'
  },
  {
    id:'grandma',
    name:'外婆',
    role:'Care Profile',
    badge:'被照护人 / Care Profile',
    responsibility:'夜起、复诊、用药与陪护记录',
    focus:'卧室到卫浴夜起路径、复诊资料与陪同安排',
    canView:'与本人相关的房间级提醒和复诊准备摘要',
    canControl:'无直接外部授权能力',
    privacyRule:'默认只显示房间或区域，不显示精确容器和全量病历',
    serviceRole:'照护场景主体'
  },
  {
    id:'xiaoyu',
    name:'小雨',
    role:'Child View',
    badge:'儿童 / Child View',
    responsibility:'入学资料和儿童房设备提醒',
    focus:'入学材料、学习桌保修和儿童房空间状态',
    canView:'与自己相关的提醒、儿童房状态和必要摘要',
    canControl:'无外部服务发起权',
    privacyRule:'儿童资料默认只允许监护人查看精细字段',
    serviceRole:'受限家庭成员'
  }
];

const AUTHORIZATION_SCOPES = [
  {
    id:'AUTH-001',
    title:'维修师傅单次授权',
    subject:'海尔授权维修',
    owner:'周先生',
    status:'待确认',
    tone:'warn',
    scenario:'阳台水浸上门检查',
    time:'2026-07-06 09:00-12:00',
    rooms:['生活阳台','玄关入户'],
    visible:['洗衣机型号与保修状态','水浸事件时间与位置摘要','用户确认后的联系方式'],
    hidden:['房屋合同原件','其他家庭成员档案','书房资料柜精确容器位置'],
    actions:'允许进门、查看报修摘要、提交维修回执',
    next:'确认授权后自动生效，工单结束即失效',
    revokeRule:'工单完成后自动失效，用户可随时手动撤回。',
    reason:'只为处理阳台洗衣机水浸，不授予其他空间或档案访问权。',
    linkedArchiveId:'A001',
    auditTrail:['生成草案后待周先生确认','维修完成后只回写回执与处理结果'],
    serviceDemo:'service-auth'
  },
  {
    id:'AUTH-002',
    title:'白天陪护授权',
    subject:'社区陪护张阿姨',
    owner:'林女士',
    status:'草案',
    tone:'brand',
    scenario:'外婆复诊前上门陪同',
    time:'2026-07-11 08:30-13:30',
    rooms:['卧室','卫浴','玄关'],
    visible:['夜起状态摘要','A007 复诊材料清单','紧急联系人与陪同说明'],
    hidden:['全量病历原件','儿童资料','房屋合同与证件原件'],
    actions:'允许查看陪同清单、到家确认、提交复诊回执',
    next:'建议与老人夜起关怀联动，避免重复沟通',
    revokeRule:'仅在复诊当日与陪护时段生效，到时自动关闭。',
    reason:'只开放照护必要信息，避免把外婆完整病历和全家资料暴露给外部陪护。',
    linkedArchiveId:'A007',
    auditTrail:['林女士为主跟进人','复诊完成后自动要求提交陪护回执'],
    serviceDemo:'care-plan'
  },
  {
    id:'AUTH-003',
    title:'物业验房授权',
    subject:'小区物业验房',
    owner:'周先生',
    status:'模板',
    tone:'gray',
    scenario:'退租 / 验房交接',
    time:'按工单生效',
    rooms:['玄关','客厅','卫浴'],
    visible:['租约摘要','水电底数','维修记录摘要'],
    hidden:['证件原件','儿童学籍资料','医疗与保险档案'],
    actions:'仅允许查看交接清单与记录结果',
    next:'到期自动失效，争议项回写事件记录',
    revokeRule:'只在验房工单期间生效，争议关闭后自动过期。',
    reason:'物业只需要交接摘要和空间问题，不需要家庭其他敏感档案。',
    linkedArchiveId:'A002',
    auditTrail:['模板状态，等待用户选择是否启用','争议项将单独留痕到事件记录'],
    serviceDemo:'moveout-pack'
  },
  {
    id:'AUTH-004',
    title:'入学材料代交授权',
    subject:'监护人代交 / 学校报名窗口',
    owner:'林女士',
    status:'草案',
    tone:'brand',
    scenario:'小雨入学材料补齐与报到提交',
    time:'2026-08-01 至 2026-08-25',
    rooms:['书房资料柜'],
    visible:['入学通知摘要','户口本复印件状态','居住登记回执缺失项','报到日期与联系人'],
    hidden:['其他家庭成员档案','医疗资料','证件原件与完整住址'],
    actions:'允许查看入学材料清单、确认补件状态、记录报到完成回执',
    next:'仅围绕 A006 生效，报到后自动关闭',
    revokeRule:'报到完成或用户手动撤回后立即失效。',
    reason:'学校或代办人只需要学生报名材料摘要，不应接触家庭其他敏感资料。',
    linkedArchiveId:'A006',
    auditTrail:['补件前只显示缺失项和报到日期','报到完成后回写提交回执与补件状态'],
    serviceDemo:'school-pack'
  },
  {
    id:'AUTH-005',
    title:'报销资料提交授权',
    subject:'商保理赔专员 / 公司报销助手',
    owner:'林女士',
    status:'草案',
    tone:'brand',
    scenario:'门诊报销资料补齐与提交',
    time:'2026-07-05 至 2026-07-12',
    rooms:['客厅抽屉'],
    visible:['就诊日期与票据金额摘要','缺失清单','报销提交状态','必要联系方式'],
    hidden:['完整病历原件','其他家庭成员档案','完整医保账号与证件原件'],
    actions:'允许查看报销材料清单、确认补件状态、记录提交回执',
    next:'仅围绕 A009 生效，提交完成后自动关闭',
    revokeRule:'报销提交完成或用户手动撤回后立即失效。',
    reason:'理赔或报销协作方只需要票据摘要和缺失项，不应接触完整医疗资料与家庭敏感信息。',
    linkedArchiveId:'A009',
    auditTrail:['补件前只显示缺页与待核金额','提交后回写报销回执与补件状态'],
    serviceDemo:'claim-pack'
  }
];

const CARE_WORKFLOW = {
  id:'care-grandma-night',
  title:'外婆夜起与复诊闭环',
  headline:'先低打扰确认状态，再围绕复诊资料、陪同责任人和最小授权组织照护。',
  summary:'过去 7 天记录到 2 次夜起路径灯触发，最近一次复诊日期为 2026-07-12。当前最缺的是确认陪同人和生成陪护授权。',
  stats:[
    ['夜起记录','近 7 天 2 次'],
    ['复诊日期','2026-07-12'],
    ['责任人','林女士主跟进'],
    ['下一步','确认陪同人与陪护授权']
  ],
  steps:[
    ['检测','卧室到卫浴路径灯自动亮起，只记录必要状态。'],
    ['判断','20 分钟未回卧室才升级提醒，避免普通夜起过度打扰。'],
    ['准备','自动关联 A007 复诊档案、医保卡、处方与血糖记录。'],
    ['授权','只向陪护服务开放卧室 / 卫浴动线和必要材料摘要。'],
    ['回写','到家确认、陪同完成和复诊回执写回事件记录。']
  ]
};

const SERVICE_PARTNERS = [
  {
    id:'SP-001',
    name:'海尔授权维修中心',
    category:'维修 / 上门',
    scene:'阳台水浸、洗衣机排水口故障、保修内报修',
    promise:'2 小时内确认工单，完成后提交维修回执与质保结果',
    visible:'设备型号、保修状态、水浸摘要、用户确认后的联系方式',
    hidden:'合同原件、其他家庭成员档案、书房精确容器位置',
    revenue:'履约分成 + 硬件安装转化',
    serviceDemo:'service-auth',
    authId:'AUTH-001'
  },
  {
    id:'SP-002',
    name:'社区陪护张阿姨',
    category:'照护 / 到家',
    scene:'外婆复诊前到家陪同、夜起关怀后的白天交接',
    promise:'只按预约时段生效，服务结束后提交到家确认与陪护回执',
    visible:'照护清单、紧急联系人摘要、必要动线与到家时间',
    hidden:'完整病历原件、儿童资料、房屋合同与证件原件',
    revenue:'安心订阅增值 + 按次陪护服务',
    serviceDemo:'care-plan',
    authId:'AUTH-002'
  },
  {
    id:'SP-003',
    name:'小区物业验房窗口',
    category:'物业 / 交接',
    scene:'退租验房、押金争议处理、水电底数确认',
    promise:'只查看交接摘要，验房后回写争议项、底数和押金处理进度',
    visible:'租约摘要、水电底数、维修记录摘要、交接清单',
    hidden:'证件原件、儿童学籍、医疗与保险档案',
    revenue:'高客单交接服务 + 周边保洁/维修协作',
    serviceDemo:'moveout-pack',
    authId:'AUTH-003'
  },
  {
    id:'SP-004',
    name:'商保理赔与报销助手',
    category:'理赔 / 行政',
    scene:'门诊报销、发票补件、商保理赔材料提交',
    promise:'先校验缺页与金额，再回写提交结果与到账状态',
    visible:'票据摘要、缺失清单、提交状态、必要联系方式',
    hidden:'完整病历原件、医保账号、其他家庭成员档案',
    revenue:'按次材料包 + 理赔协作分成',
    serviceDemo:'claim-pack',
    authId:'AUTH-005'
  }
];

const SEED_PENDING = [
  {
    id:'P001', title:'洗衣机发票与保修', category:'家电保修', rawType:'发票 + 保修', source:'seed',
    preview:'海尔滚筒洗衣机 EG100MAX5 / 购买 2024-03-15 / 保修 3 年 / 金额 ¥3,299',
    detectedFields:[f('购买日期','2024-03-15','ocr',.94), f('金额','¥3,299','ocr',.92), f('品牌','海尔','ocr',.95), f('型号','EG100MAX5','ocr',.91), f('保修到期','2027-03-15','inferred',.79), f('家庭成员','周先生（爸爸）','manual',1)],
    confidence:.88,
    ai:ai('家电保修资料',['购买日期、金额、型号来自发票 OCR','保修到期由保修期推断'],'资料同时出现发票和保修字段，适合归入家电保修','保修到期需要提醒','书房资料 / 家电保修','允许显示精确容器',['是否还有延保凭证？'])
  },
  {
    id:'P002', title:'低清晰入学材料扫描', category:'儿童学籍', rawType:'入学材料包（低清晰）', source:'sample-low-quality',
    preview:'入学通知 / 户口本复印件 / 居住登记回执页反光 / 截止日期疑似 2026-08-10',
    detectedFields:[f('学生','小雨','ocr',.9), f('报到日期','2026-08-25','ocr',.77), f('户口本','已准备复印件','manual',1), f('居住登记回执','', 'ocr',.18), f('截止日期','2026-08-10','inferred',.7)],
    confidence:.62,
    lowConfidence:low('扫描页反光，回执章和日期不稳定',['居住登记回执清晰页','经办机构'],['请补拍回执页','是否还有学校材料清单？'],'户口本状态由人工确认','小雨小学入学材料核对','AI 标记低置信度后等待人工补拍'),
    ai:ai('儿童学籍资料',['学生和报到日期来自 OCR','缺失材料由材料清单推断','户口本状态由人工确认'],'入学资料缺口必须突出展示，不能直接静默归档','缺少居住登记回执清晰页','书房资料柜（精确容器隐藏）','儿童资料建议隐藏精确容器',['居住登记回执是否能补拍？','是否需要疫苗接种证明？'])
  },
  {
    id:'P003', title:'折痕门诊报销票据', category:'报销票据', rawType:'报销票据（低清晰）', source:'sample-low-quality',
    preview:'门诊发票折痕遮挡 / 金额疑似 ¥836 / 费用清单缺页',
    detectedFields:[f('就诊日期','2026-04-08','ocr',.78), f('票据金额','', 'ocr',.2), f('费用清单','缺第 2 页','inferred',.56), f('家庭成员','林女士','manual',1)],
    confidence:.51,
    lowConfidence:low('票据折痕遮挡金额，小票与费用清单页码不连续',['票据金额','费用清单第 2 页'],['请补拍完整发票','是否有电子费用清单？'],'就诊日期已人工核对','林女士门诊报销票据','AI 仅生成待补资料，不自动判定报销金额'),
    ai:ai('报销票据资料',['日期来自发票 OCR','金额识别失败','缺页由页码判断'],'报销票据必须保持金额和清单完整','缺页会影响报销','客厅抽屉（精确容器隐藏）','医疗报销资料建议只显示区域',['能否补拍完整票据？'])
  },
  {
    id:'P004', title:'旅行证件反光照片', category:'旅行证件', rawType:'旅行证件页（低清晰）', source:'sample-low-quality',
    preview:'证件页反光 / 有效期末位模糊 / 证件号已脱敏',
    detectedFields:[f('持有人','小雨','ocr',.84), f('证件尾号','67','ocr',.79), f('有效期至','2027-01-1?', 'ocr',.43), f('家庭成员','全家','manual',1)],
    confidence:.62,
    lowConfidence:low('证件页反光，有效期末位无法确定',['有效期末位','签发机关'],['请核对原件有效期','是否需要加入签证页？'],'人工核对后生成旅行证件档案','全家旅行证件有效期核对','AI 标记反光，等待人工确认有效期'),
    ai:ai('旅行证件资料',['证件尾号来自 OCR','有效期需要人工确认'],'证件资料必须避免错误到期提醒','有效期不确定时不能生成确定提醒','隐私资料位置','证件默认隐藏精确位置',['请确认有效期末位'])
  }
];

/*
const SEED_ARCHIVES = [
  {
    id:'A001', title:'海尔洗衣机发票与保修', category:'家电保修', status:'archived', riskLevel:'medium',
    familyMember:'周先生（爸爸', date: 至 2024-03-15', amountOrTerm: ¥3,299 / 保修 2027-03-15',
    sourceMaterial:'电子发票、保修卡、售后维修记', rawType:'发票 + 保修',
    rawPreview:'海尔滚筒洗衣 EG100MAX5 / 金额 ¥3,299 / 购买 2024-03-15 / 整机保修 3 ',
    fields:[
      f('购买日期', 至 2024-03-15','ocr',.98), f('金额', ¥3,299','ocr',.97), f('品牌','海尔','ocr',.98),
      f('型号', EG100MAX5','ocr',.95), f('保修', 3 ','ocr',.93), f('保修到期', 至 2027-03-15','inferred',.91),
      f('售后电话', 400-000-9001','ocr',.89), f('家庭成员','周先生（爸爸','manual',1)
    ],
    evidence:['电子发票','保修卡照', 2025 年排水泵维修','售后短信回执'],
    events:[
      ev( 至 2024-03-15','购买','京东自营购入海尔洗衣','周先生（爸爸', ¥3,299'),
      ev( 至 2025-08-02','维修','保修内更换排水泵，维修单已补','林女', ¥0'),
      ev( 至 2026-06-18','空间复核','AI 建议将保修卡归到书房资料柜的家电保修','系统','')
    ],
    reminders:[rem('R001', 至 2027-02-13','保修到期 30 天确认是否延','pending')],
    operations:[op( 至 2024-03-15 10:22','AI 归档生成档案','系统'), op( 至 2026-06-18 20:10','空间位置复核：书房资料柜 / 家电保修','系统')],
    handover:'洗衣机由林女士日常使用，售后联系人为周先生。保修卡和维修单归在书房资料柜的家电保修夹',
    ai:ai('家电保修资料',['购买日期、金额、品牌、型号来自发 OCR','保修到期由购买日 保修期推','家庭成员由人工确'],'发票与保修卡同时出现，型号、保修期和售后电话完整，适合归为家电保修', 至 2027-03-15 保修到期，建议提 30 天提醒','书房资料 / 家电保修','不含证照或贵重物品，允许显示精确容器',['是否购买过延保？','维修单号是否需要补充？']),
    memoryRoom:'书房', memoryZone:'study', memoryContainer:'家电保修', locationPrivacy:'public', locationConfidence:.82, locationSource:'手动记忆位置 + AI 归位建议',
    nextActions:['开始处理提','生成家电维修交接说明'], searchKeywords:['洗衣','爸爸','保修','2026','家电保修','书房资料']
  },
  {
    id:'A002', title:'上海市某区房屋租赁合同与押金凭证', category:'房屋合同', status:'archived', riskLevel:'high',
    familyMember:'全家', date: 至 2024-09-01', amountOrTerm:'租期 2026-08-31 / 押金 ¥12,000',
    sourceMaterial:'租赁合同、押金收据、水电表底数记录', rawType:'合同 + 押金凭证',
    rawPreview:'上海市某区某 8 '/ 租期 2024-09-01  至 2026-08-31 / 押金 ¥12,000 / 地址已脱',
    fields:[
      f('合同编号','SH-ZL-2024-0821','ocr',.94), f('租期开', 至 2024-09-01','ocr',.97), f('租期结束', 至 2026-08-31','ocr',.96),
      f('月租', ¥6,000','ocr',.94), f('押金', ¥12,000','ocr',.95), f('房屋地址','上海市某区某 8 号（脱敏','ocr',.9),
      f('房东','王女士（虚构','ocr',.88), f('家庭成员','全家','manual',1)
    ],
    evidence:['合同首页','签字','押金收据','入住水电表底'],
    events:[ev( 至 2024-09-01','签约','签订房屋租赁合同并支付押','周先', ¥12,000'), ev( 至 2026-08-31','到期','合同到期，需要退租交接并追回押金','全家','')],
    reminders:[rem('R002', 至 2026-07-02','退租前 60 天整理交接清','pending'), rem('R003', 至 2026-08-16','退租前 15 天预约验','pending')],
    operations:[op( 至 2024-09-01 15:40','AI 归档生成房屋合同档案','系统'), op( 至 2026-06-10 21:04','补充水电表底数记','周先')],
    handover:'退租交接由周先生负责。押金收据、合同签字页和水电底数需要一起带上；精确存放柜格默认隐藏',
    ai:ai('房屋合同资料',['租期、押金、房屋地址来自合同 OCR','退租提醒由租期结束日期推断','水电表底数来自人工补'],'合同、押金凭证和水电底数构成同一退租证据链，应合并归档', 至 2026-08-31 到期，押金追回和验房是高风险事项','隐私资料位置','房屋合同默认不展示精确容器',['是否已经确认续租','押金收据是否有原件？']),
    memoryRoom:'隐私资料位置', memoryZone:'safe', memoryContainer:'防火文件袋第 2 ', locationPrivacy:'hidden', locationConfidence:.95, locationSource:'人工设置为隐私遮',
    nextActions:['开始处理提','生成退租交接说'], searchKeywords:['房屋合同','押金','租赁','退','水电']
  },
  {
    id:'A003', title: 2026 上半年物业水电缴费凭', category:'物业水电', status:'archived', riskLevel:'low',
    familyMember:'林女', date: 至 2026-06-05', amountOrTerm: ¥1,286 / 2026  1-6 ',
    sourceMaterial:'物业缴费单、水电费电子回执', rawType:'缴费凭证',
    rawPreview:'物业 ¥980 / 水电 ¥306 / 缴费日期 2026-06-05 / 小区名称已脱',
    fields:[f('缴费日期', 至 2026-06-05','ocr',.96), f('缴费周期', 2026  1-6 ','ocr',.93), f('金额', ¥1,286','ocr',.97), f('缴费方式','微信支付','ocr',.9), f('家庭成员','林女','manual',1)],
    evidence:['物业缴费','水费电子回执','电费电子回执'],
    events:[ev( 至 2026-06-05','缴费','完成 2026 上半年物业水电缴','林女', ¥1,286')],
    reminders:[rem('R004', 至 2026-12-20','下半年物业水电缴费提','pending')],
    operations:[op( 至 2026-06-05 19:20','AI 归档生成缴费档案','系统')],
    handover:'物业水电由林女士处理。退租或报销时可从此档案找回缴费凭证',
    ai:ai('物业水电缴费资料',['缴费日期、周期、金额来自回','下次缴费日期由周期推'],'同一周期内的物业、水费、电费可以合并为物业水电档案','下半年仍需缴费，风险低','玄关 / 票据','普通缴费凭证允许显示容器',['下半年是否按半年缴费']),
    memoryRoom:'玄关', memoryZone:'entry', memoryContainer:'票据', locationPrivacy:'public', locationConfidence:.87, locationSource:'人工记忆位置',
    nextActions:['设置下半年缴费提','复制缴费信息'], searchKeywords:['物业','水电','缴费','票据']
  },
  {
    id:'A004', title: 2026 车险续费通知与保', category:'保险续费', status:'archived', riskLevel:'high',
    familyMember:'周先生（爸爸', date: 至 2026-06-12', amountOrTerm:'保期 2026-07-20 / 保费 ¥4,280',
    sourceMaterial:'续费短信、电子保单、支付记', rawType:'车险保单 + 续费通知',
    rawPreview:' A***21 / 商业 交强 / 保期 2026-07-20 / 保费 ¥4,280',
    fields:[f('车牌',' A***21','ocr',.93), f('保险公司','人保财险（虚构）','ocr',.9), f('保期结束', 至 2026-07-20','ocr',.95), f('保费', ¥4,280','ocr',.92), f('家庭成员','周先生（爸爸','manual',1)],
    evidence:['电子保单','续费短信','支付记录截图'],
    events:[ev( 至 2025-07-20','投保','上一年度车险生效','周先', ¥4,120'), ev( 至 2026-07-20','到期','车险到期，需要续','周先','')],
    reminders:[rem('R005', 至 2026-07-05','车险到期 15 天确认续费方','pending'), rem('R006', 至 2026-07-20','车险到期','pending')],
    operations:[op( 至 2026-06-12 12:10','AI 归档生成保险续费档案','系统')],
    handover:'车险由周先生处理。保险类资料默认只显示房间或区域，不展示精确容器',
    ai:ai('保险续费资料',['保期结束、保费、车牌来自保 OCR','续费提醒由保期结束日期推'],'车险具有明确到期日和费用，适合进入风险处理', 至 2026-07-20 到期，属于近期高优先事项','玄关柜（精确容器隐藏','保险资料建议只显示房间或区域',['是否已有新报价？','是否需要保留上一年度保单']),
    memoryRoom:'玄关', memoryZone:'entry', memoryContainer:'票据', locationPrivacy:'room_only', locationConfidence:.8, locationSource:'人工记忆位置',
    nextActions:['开始处理提','复制保单摘要'], searchKeywords:['车险','续费','保单','什么时候续','玄关']
  },
  {
    id:'A005', title:'家庭车辆年检与行驶证记录', category:'车辆年检', status:'archived', riskLevel:'medium',
    familyMember:'周先生（爸爸', date: 至 2026-03-12', amountOrTerm:'年检有效 2026-09-15',
    sourceMaterial:'行驶证副页、年检回执、环保检验单', rawType:'车辆年检资料',
    rawPreview:' A***21 / 年检有效期至 2026-09-15 / 行驶证尾 4821',
    fields:[f('车辆','家庭轿车（沪 A***21','ocr',.94), f('年检有效期至', 至 2026-09-15','ocr',.95), f('行驶证尾','4821','ocr',.9), f('家庭成员','周先生（爸爸','manual',1)],
    evidence:['行驶证副','年检回执','环保检验单'],
    events:[ev( 至 2026-03-12','年检','完成本年度车辆年检','周先', ¥0'), ev( 至 2026-09-15','到期','下次年检期限','周先','')],
    reminders:[rem('R007', 至 2026-08-16','车辆年检到期 30 天提','pending')],
    operations:[op( 至 2026-03-12 17:35','AI 归档生成车辆年检档案','系统')],
    handover:'车务资料由周先生保管。出险或年检时先查本档案，再带行驶证原件',
    ai:ai('车辆年检资料',['有效期、车牌尾号来自行驶证副页','提醒日期由有效期推断'],'资料内容围绕车辆有效期，应归为车辆年检', 9 月前需要再次确认年检','玄关 / 车务文件','普通车务资料可显示容器',['是否需要加入保险保单关联？']),
    memoryRoom:'玄关', memoryZone:'entry', memoryContainer:'车务文件', locationPrivacy:'public', locationConfidence:.88, locationSource:'人工记忆位置',
    nextActions:['设置年检提醒','复制车辆资料'], searchKeywords:['车辆','年检','行驶','车务']
  },
  {
    id:'A006', title:'小雨小学入学材料核对', category:'儿童学籍', status:'supplement', riskLevel:'high',
    familyMember:'小雨', date: 至 2026-06-08', amountOrTerm:'补资料截 2026-08-10',
    sourceMaterial:'入学通知、户口本复印件、居住登记回', rawType:'入学材料',
    rawPreview:'一年级入学材料 / 户口本复印件已齐 / 居住登记回执页模 / 截止 2026-08-10',
    fields:[f('学生','小雨','ocr',.96), f('入学年级','一年级','ocr',.95), f('报到日期', 至 2026-08-25','ocr',.91), f('户口','已准备复印件','manual',1), f('缺失材料','居住登记回执清晰','inferred',.72), f('家庭成员','小雨','manual',1)],
    evidence:['入学通知','户口本复印件','居住登记回执模糊'],
    events:[ev( 至 2026-06-08','归档','建立入学材料档案','林女',''), ev( 至 2026-08-10','截止','需补齐居住登记回执清晰','小雨','')],
    reminders:[rem('R008', 至 2026-08-01','入学材料补齐 9 天提','pending'), rem('R009', 至 2026-08-25','入学报到日提','pending')],
    operations:[op( 至 2026-06-08 21:10','低置信度识别：居住登记回执页模糊','系统'), op( 至 2026-06-09 08:40','人工确认户口本复印件已齐','林女')],
    handover:'入学材料由林女士负责。户口本复印件已齐，仍需补拍居住登记回执清晰页',
    lowConfidence:low('居住登记回执页边缘反光，地址和受理日期无法稳定识别',['居住登记回执受理日期','经办机构'],['请补拍清晰回执页','是否已有学校材料清单原件'],'已人工确认户口本复印件已齐；缺失材料字段保留为待补','小雨小学入学材料核对','追溯记录 026-06-08 AI 标记低置信度 026-06-09 林女士人工确认户口本'),
    ai:ai('儿童学籍资料',['学生姓名、年级、报到日期来自入学通知','缺失材料由材料清单推','户口本状态由人工确认'],'入学通知和户口本复印件同属入学材料，需要合并并标出缺口','居住登记回执缺失会影响报到，当前为高风险','书房资料柜（精确容器隐藏','儿童学籍资料建议只显示房间或区域',['居住登记回执是否已补拍？','学校是否要求疫苗证明']),
    memoryRoom:'书房', memoryZone:'study', memoryContainer:'小雨入学材料', locationPrivacy:'room_only', locationConfidence:.73, locationSource:'人工补全 + AI 归位建议',
    nextActions:['开始补资料','生成入学材料清单'], searchKeywords:['入学','户口','小雨','缺什','学籍']
  },
  {
    id:'A007', title:'外婆 7 月复诊与用药资料', category:'老人复诊', status:'archived', riskLevel:'high',
    familyMember:'外婆', date: 至 2026-06-15', amountOrTerm:'下次复诊 2026-07-12 / 检查费用约 ¥320',
    sourceMaterial:'门诊病历、处方单、检查单', rawType:'复诊资料',
    rawPreview:'外婆 / 内分泌复 / 2026-07-12 / 需带医保卡、上次处方、检查单',
    fields:[f('患','外婆','ocr',.97), f('复诊科室','内分泌科','ocr',.93), f('复诊日期', 至 2026-07-12','ocr',.95), f('需携带','医保卡、上次处方、血糖记录、检查单','manual',1), f('家庭成员','外婆','manual',1)],
    evidence:['门诊病历','处方','血糖记录表','检查单'],
    events:[ev( 至 2026-06-15','就诊','完成一次复诊并开 30 天用','外婆', ¥286'), ev( 至 2026-07-12','复诊','下次复诊，需要携带既往资料','外婆',' ¥320')],
    reminders:[rem('R010', 至 2026-07-11','复诊前一天整理医保卡、处方和检查单','pending'), rem('R011', 至 2026-07-05','提前一周确认挂号和陪同','pending')],
    operations:[op( 至 2026-06-15 18:20','AI 归档生成老人复诊档案','系统'), op( 至 2026-06-15 18:35','人工补充复诊要带材料','林女')],
    handover:'外婆复诊由林女士陪同。药盒在卧室，病历和检查单只显示卧室区域，不展示精确容器',
    ai:ai('老人复诊资料',['复诊日期和科室来自病 OCR','需携带材料由处方、检查单和人工补充合','提醒日期由复诊日期推'],'医疗资料需要围绕复诊日期、带什么、谁陪同来组织', 至 2026-07-12 即将复诊，需要提前准备材料','卧室收纳（精确容器隐藏）','医疗照护资料建议只显示房间或区域',['陪同人是否确定？','血糖记录是否已打印']),
    memoryRoom:'卧室', memoryZone:'bedroom', memoryContainer:'外婆药盒旁文件袋', locationPrivacy:'room_only', locationConfidence:.86, locationSource:'人工记忆位置',
    nextActions:['开始处理提','生成复诊携带清单'], searchKeywords:['外婆','复诊','7','带什','医保','处方']
  },
  {
    id:'A008', title:'全家旅行证件有效期核', category:'旅行证件', status:'archived', riskLevel:'medium',
    familyMember:'全家', date: 至 2026-05-01', amountOrTerm:'最早到 2027-01-10',
    sourceMaterial:'护照页、港澳通行证页、行程材', rawType:'旅行证件',
    rawPreview:'周先生护照尾 19 / 林女士港澳通行证尾 62 / 小雨证件页反',
    fields:[f('周先生护照尾','19','ocr',.92), f('林女士港澳通行证尾','62','ocr',.9), f('小雨证件有效', 至 2027-01-10','manual',.95), f('家庭成员','全家','manual',1)],
    evidence:['护照资料页脱敏照','港澳通行证页脱敏照片','行程材料'],
    events:[ev( 至 2026-05-01','核对','完成全家旅行证件有效期核','林女',''), ev( 至 2027-01-10','到期','小雨旅行证件最早到','小雨','')],
    reminders:[rem('R012', 至 2026-11-10','旅行证件最早到期前 60 天提','pending')],
    operations:[op( 至 2026-05-01 09:20','低置信度识别：小雨证件页反光','系统'), op( 至 2026-05-01 09:32','人工补全小雨证件有效','林女')],
    handover:'旅行证件属于敏感资料，系统只显示隐私遮罩状态。出行前由林女士统一核对',
    lowConfidence:low('证件页反光导致有效期末位模糊',['小雨证件有效期末','证件签发'],['请核对原件有效期','是否需要加入签证页'],'人工补全小雨证件有效期为 2027-01-10','全家旅行证件有效期核','追溯记录：AI 标记反光，林女士手动补全有效期'),
    ai:ai('旅行证件资料',['证件尾号来自 OCR','小雨有效期由人工补全','到期提醒由最早有效期推断'],'旅行证件应按家庭成员和最早到期日组织','最 2027-01-10 到期，需提前 60 天提醒','隐私资料位置','证件默认隐藏精确位置',['是否有签证页需要一起归档？']),
    memoryRoom:'隐私资料位置', memoryZone:'safe', memoryContainer:'证件防水', locationPrivacy:'hidden', locationConfidence:.92, locationSource:'人工设置为隐私遮',
    nextActions:['设置证件到期提醒','生成出行证件清单'], searchKeywords:['旅行','证件','护照','通行','有效']
  },
  {
    id:'A009', title:'林女士门诊报销票据', category:'报销票据', status:'supplement', riskLevel:'medium',
    familyMember:'林女', date: 至 2026-04-08', amountOrTerm:'报销金额待核 / 票据合计 ¥836',
    sourceMaterial:'门诊发票、支付小票、费用清', rawType:'报销票据',
    rawPreview:'门诊发票折痕遮挡 / 金额疑似 ¥836 / 日期 2026-04-08 / 费用清单缺页',
    fields:[f('就诊日期', 至 2026-04-08','ocr',.78), f('票据金额', ¥836（待核对','inferred',.63), f('费用清单','缺第 2 ','inferred',.56), f('家庭成员','林女','manual',1)],
    evidence:['门诊发票折痕照片','支付小票','费用清单 1 '],
    events:[ev( 至 2026-04-08','就诊','门诊票据待报销','林女',' ¥836'), ev( 至 2026-06-30','补资','补齐费用清单 2 ','林女','')],
    reminders:[rem('R013', 至 2026-06-30','补齐费用清单 2 页并核对报销金额','pending')],
    operations:[op( 至 2026-04-08 20:10','低置信度识别：发票折痕遮挡金','系统')],
    handover:'报销资料由林女士处理。金额和费用清单仍需人工核对，精确位置只显示区域',
    lowConfidence:low('发票折痕遮挡金额，小票与费用清单页数不一致',['票据最终金','费用清单 2 '],['是否能补拍完整发票？','费用清单是否还有一页？'],'人工确认就诊日期，金额暂 ¥836 待核对','林女士门诊报销票据','追溯记录：AI 标记折痕遮挡，等待补齐费用清单'),
    ai:ai('报销票据资料',['就诊日期来自发票 OCR','金额由小票和费用清单推断','缺页由页码连续性判'],'报销票据需要金额、日期、费用清单组成完整证据链','费用清单缺页会影响报销，需补齐','客厅抽屉（精确容器隐藏）','医疗报销票据建议只显示区域',['是否已补齐费用清单第 2 页？','报销截止日是什么？']),
    memoryRoom:'客厅', memoryZone:'living', memoryContainer:'报销待处理夹', locationPrivacy:'room_only', locationConfidence:.69, locationSource:'人工记忆位置',
    nextActions:['开始补资料','复制报销摘要'], searchKeywords:['报销','票据','门诊','费用清单']
  },
  {
    id:'A010', title:'客厅水管维修工单', category:'维修工单', status:'archived', riskLevel:'medium',
    familyMember:'林女', date: 至 2026-06-16', amountOrTerm: ¥480 / 维修质保 2026-09-16',
    sourceMaterial:'维修工单、支付记录、师傅回访短', rawType:'维修工单',
    rawPreview:'客厅水管渗漏 / 更换角阀与软 / 维修 ¥480 / 质保 3 个月',
    fields:[f('维修日期', 至 2026-06-16','ocr',.95), f('金额', ¥480','ocr',.91), f('故障','客厅水管渗漏','ocr',.94), f('质保到期', 至 2026-09-16','inferred',.85), f('家庭成员','林女','manual',1)],
    evidence:['维修工单','支付记录','师傅回访短信'],
    events:[ev( 至 2026-06-16','维修','维修客厅水管渗漏并更换角阀','林女', ¥480'), ev( 至 2026-09-16','到期','维修质保到期','林女','')],
    reminders:[rem('R014', 至 2026-09-01','维修质保到期 15 天检查是否复','pending')],
    operations:[op( 至 2026-06-16 16:22','AI 归档生成维修工单档案','系统'), op( 至 2026-06-16 16:35','位置待复核：暂放书房待整理维修夹','系统')],
    handover:'客厅水管维修联系人为林女士。空间线索确认后会将临时维修单从待整理位置归到客厅抽屉',
    ai:ai('维修工单资料',['维修日期、金额、故障来自工 OCR','质保到期由维修日 3 个月推断'],'维修资料有明确质保期，应归为维修工单并设置复查提醒','质保到期前需要检查是否复漏','客厅抽屉 / 临时维修单夹','普通维修工单可显示容器',['是否还有施工前后照片']),
    memoryRoom:'书房', memoryZone:'study', memoryContainer:'待整理维修夹', locationPrivacy:'public', locationConfidence:.48, locationSource:'低置信度临时位置',
    nextActions:['设置质保复查提醒','复制维修工单信息'], searchKeywords:['维修','水管','客厅','临时维修']
  },
  {
    id:'A011', title:'小雨学习桌大额采购凭', category:'大额采购', status:'archived', riskLevel:'low',
    familyMember:'小雨', date: 至 2026-02-18', amountOrTerm: ¥5,680 / 五年结构保修',
    sourceMaterial:'采购合同、发票、安装验收单', rawType:'采购合同 + 发票',
    rawPreview:'儿童学习桌套 / 金额 ¥5,680 / 五年结构保修 / 安装验收单已签收',
    fields:[f('购买日期', 至 2026-02-18','ocr',.96), f('金额', ¥5,680','ocr',.95), f('品类','儿童学习桌套','ocr',.92), f('保修', 5 ','ocr',.9), f('家庭成员','小雨','manual',1)],
    evidence:['采购合同','电子发票','安装验收'],
    events:[ev( 至 2026-02-18','购买','购入小雨学习桌套','林女', ¥5,680'), ev( 至 2026-02-20','安装','完成安装验收','周先','')],
    reminders:[rem('R015', 至 2031-01-18','结构保修到期 30 天提','pending')],
    operations:[op( 至 2026-02-18 22:05','AI 归档生成大额采购档案','系统')],
    handover:'学习桌采购和保修由林女士处理。安装验收单与合同在书房资料柜',
    ai:ai('家庭大额采购资料',['购买日期、金额、品类来自发 OCR','保修期来自合同条'],'金额较高且带长期保修，应作为大额采购独立归档','当前风险低，主要保留保修与验收证据','书房资料 / 大额采购','普通采购资料可显示容器',['是否有安装照片？']),
    memoryRoom:'书房', memoryZone:'study', memoryContainer:'大额采购', locationPrivacy:'public', locationConfidence:.89, locationSource:'人工记忆位置',
    nextActions:['复制采购凭证摘要','生成保修交接说明'], searchKeywords:['大额采购','学习','小雨','发票']
  },
  {
    id:'A012', title:'周先生驾驶证到期换证提醒', category:'证照到期', status:'archived', riskLevel:'high',
    familyMember:'周先生（爸爸', date: 至 2026-05-20', amountOrTerm:'有效期至 2026-10-09 / 尾号 4821',
    sourceMaterial:'驾驶证脱敏页、体检提醒短信', rawType:'驾驶',
    rawPreview:'周先生驾驶证尾号 4821 / 有效期至 2026-10-09 / 需要提前体检换证',
    fields:[f('持有','周先生（爸爸','ocr',.96), f('证照类型','驾驶','inferred',.95), f('证照尾号','4821','ocr',.92), f('有效期至', 至 2026-10-09','ocr',.97), f('家庭成员','周先生（爸爸','manual',1)],
    evidence:['驾驶证脱敏页','体检提醒短信','换证材料清单'],
    events:[ev( 至 2026-05-20','核对','建立驾驶证到期提','周先',''), ev( 至 2026-10-09','到期','驾驶证有效期截止','周先','')],
    reminders:[rem('R016', 至 2026-08-10','驾驶证到期前 60 天安排体检换证','pending'), rem('R017', 至 2026-09-09','驾驶证到期前 30 天确认受','pending')],
    operations:[op( 至 2026-05-20 12:28','AI 归档生成证照到期档案','系统')],
    handover:'证照资料由周先生本人保管。系统隐藏精确位置，只保留到期提醒和材料清单',
    ai:ai('证照到期资料',['有效期和尾号来自证件 OCR','换证提醒由有效期推断'],'证照到期具备强时限性，应进入风险处理', 至 2026-10-09 到期，需要提前体检换证','隐私资料位置','证照默认隐藏精确位置',['是否已预约体检']),
    memoryRoom:'隐私资料位置', memoryZone:'safe', memoryContainer:'证照密封', locationPrivacy:'hidden', locationConfidence:.94, locationSource:'人工设置为隐私遮',
    nextActions:['开始处理提','生成换证材料清单'], searchKeywords:['证照','驾驶','到期','换证','尾号4821']
  }
];

const SEED_PENDING = [
  {
    id:'P001', title:'洗衣机发 保修', category:'家电保修', rawType:'发票 + 保修', source:'seed',
    preview:'海尔滚筒洗衣 EG100MAX5 / 购买 2024-03-15 / 保修 3 '/ 金额 ¥3,299',
    detectedFields:[f('购买日期', 至 2024-03-15','ocr',.94), f('金额', ¥3,299','ocr',.92), f('品牌','海尔','ocr',.95), f('型号', EG100MAX5','ocr',.91), f('保修到期', 至 2027-03-15','inferred',.79), f('家庭成员','周先生（爸爸','manual',1)],
    confidence:.88,
    ai:ai('家电保修资料',['购买日期、金额、型号来自发 OCR','保修到期由保修期推断'],'资料同时出现发票和保修字段，适合归入家电保修','保修到期需要提醒','书房资料 / 家电保修','允许显示精确容器',['是否还有延保凭证'])
  },
  {
    id:'P002', title:'低清晰入学材料扫', category:'儿童学籍', rawType:'入学材料包（低清晰）', source:'sample-low-quality',
    preview:'入学通知 / 户口本复印件 / 居住登记回执页反 / 截止日期疑似 2026-08-10',
    detectedFields:[f('学生','小雨','ocr',.9), f('报到日期', 至 2026-08-25','ocr',.77), f('户口','已准备复印件','manual',1), f('居住登记回执','', 'ocr',.18), f('截止日期', 至 2026-08-10','inferred',.7)],
    confidence:.62,
    lowConfidence:low('扫描页反光，回执章和日期不稳定',['居住登记回执清晰','经办机构'],['请补拍回执页','是否还有学校材料清单'],'户口本状态由人工确认','小雨小学入学材料核对','AI 标记低置信度后等待人工补拍'),
    ai:ai('儿童学籍资料',['学生和报到日期来 OCR','缺失材料由材料清单推','户口本状态由人工确认'],'入学资料缺口必须突出展示，不能直接静默归档','缺居住登记回执清晰页','书房资料柜（精确容器隐藏','儿童资料建议隐藏精确容器',['居住登记回执是否能补拍？','是否需要疫苗接种证明？'])
  },
  {
    id:'P003', title:'折痕门诊报销票据', category:'报销票据', rawType:'报销票据（低清晰', source:'sample-low-quality',
    preview:'门诊发票折痕遮挡 / 金额疑似 ¥836 / 费用清单缺页',
    detectedFields:[f('就诊日期', 至 2026-04-08','ocr',.78), f('票据金额','', 'ocr',.2), f('费用清单','缺第 2 ','inferred',.56), f('家庭成员','林女','manual',1)],
    confidence:.51,
    lowConfidence:low('票据折痕遮挡金额，小票与费用清单页码不连续',['票据金额','费用清单 2 '],['请补拍完整发','是否有电子费用清单？'],'就诊日期已人工核对','林女士门诊报销票据','AI 仅生成待补资料，不自动判定报销金额'),
    ai:ai('报销票据资料',['日期来自发票 OCR','金额识别失败','缺页由页码判'],'报销票据必须保持金额和清单完整','缺页会影响报销','客厅抽屉（精确容器隐藏）','医疗报销资料建议只显示区域',['能否补拍完整票据'])
  },
  {
    id:'P004', title:'旅行证件反光照片', category:'旅行证件', rawType:'旅行证件页（低清晰）', source:'sample-low-quality',
    preview:'证件页反 / 有效期末位模 / 证件号已脱敏',
    detectedFields:[f('持有','小雨','ocr',.84), f('证件尾号','67','ocr',.79), f('有效期至', 2027-01-1?', 'ocr',.43), f('家庭成员','全家','manual',1)],
    confidence:.62,
    lowConfidence:low('证件页反光，有效期末位无法确定',['有效期末','签发'],['请核对原件有效期','是否需要加入签证页'],'人工核对后生成旅行证件档案','全家旅行证件有效期核','AI 标记反光，等待人工确认有效期'),
    ai:ai('旅行证件资料',['证件尾号来自 OCR','有效期需要人工确'],'证件资料必须避免错误到期提醒','有效期不确定时不能生成确定提醒','隐私资料位置','证件默认隐藏精确位置',['请确认有效期末位'])
  }
];

*/

let state = {
  archives: [],
  pending: [],
  currentPendingId: null,
  aiStage: 'idle',
  currentView: 'home',
  libraryFilter: 'all',
  librarySearch: '',
  libraryMember: 'all',
  libraryView: 'space',
  libraryMoreOpen: false,
  categoryExpanded: false,
  memberExpanded: false,
  archivesPage: 1,
  spaceFilter: null,
  highlightedZone: null,
  activeIncidentId: 'water-leak-balcony',
  incidentFocus: false,
  incidentStatus: 'detected',
  tourNode: 'balcony-node',
  tourYaw: 0,
  tourPitch: 0,
  privacyMode: false,
  lightOn: true,
  windowOpen: true,
  rightDoorOpen: false,
  cameraPanelOpen: false,
  cameraStage: 'idle',
  cameraStep: -1,
  cameraSimulationComplete: false,
  cameraResultDisplay: false,
  cameraApplied: false,
  spaceCamera: { zoom: 1, rotate: 0, tilt: 0, panX: 0, panY: 0, mode: 'interior' },
  librarySpaceCamera: { zoom: .84, rotate: 0, tilt: 0, panX: 0, panY: 0, mode: 'top' },
  riskTab: 'pending',
  timelineFilter: 'all',
  drawerArchiveId: null,
  drawerEdit: false,
  lastArchiveResult: null,
  lastCameraResult: null,
  libraryRecentScanOnly: false,
  assistantQuery: '家里现在最需要处理什么？',
  serviceDemo: null,
  serviceRuns: {},
  serviceOrders: [], // 服务订单列表：{id, serviceId, status, createdAt, completedAt, progress, steps}
  activeHomeScenario: 'incident',
  memberFocus: 'lin',
  authorizationFocus: 'AUTH-002',
  layoutMode: 'auto',
  cameraScanIndex: -1,
  cameraScanStart: 0,
  cameraScanOrigin: null
};

let aiTimer = null;
let cameraTimer = null;
let cameraAutoCloseTimer = null;
let tourAnimation = null;
let webglTour = null;
let cameraLinkDelegateBound = false;
let pendingCameraLinkZone = null;
let zoneHighlightTimer = null;

const HOUSE_WALLS = [
  // outer shell, split at door/window openings
  [-6.6,-5.5,2.1,.18], [-3.95,-5.5,2.95,.18], [1.25,-5.5,1.8,.18], [5.15,-5.5,1.45,.18],
  [-6.6,5.0,1.65,.18], [-4.45,5.0,11.05,.18],
  [-6.6,-5.5,.18,8.2], [-6.6,3.85,.18,1.15], [6.6,-5.5,.18,10.5],
  // north room partitions with real openings to living room
  [-6.6,-1.05,2.35,.14], [-2.65,-1.05,.8,.14], [-.34,-1.05,2.12,.14], [3.68,-1.05,2.92,.14],
  [-2.35,-5.5,.14,2.88], [-2.35,-1.52,.14,.47],
  [2.25,-5.5,.14,2.92], [2.25,-1.42,.14,.37],
  // entry and southern service partitions
  [-3.9,1.65,.14,.75], [-3.9,3.86,.14,1.14],
  [-6.6,1.65,1.72,.14], [-3.72,1.65,.58,.14],
  [2.15,1.65,.78,.14], [5.18,1.65,1.42,.14],
  [2.15,1.65,.14,3.35],
  [4.15,-1.05,.14,.72], [4.15,.62,.14,.84],
  [4.15,2.0,.46,.14], [5.88,2.0,.72,.14]
];

const FLOOR_AREAS = [
  {name:'客厅', x:-3.9, z:-1.05, w:6.05, d:6.05, color:0xc8b08f},
  {name:'玄关', x:-6.6, z:1.65, w:2.7, d:3.35, color:0xc4ad91},
  {name:'书房', x:-6.6, z:-5.5, w:4.25, d:4.45, color:0xbea487},
  {name:'阳台', x:-2.35, z:-5.5, w:4.6, d:1.05, color:0xd5ddda},
  {name:'卧室', x:2.25, z:-5.5, w:4.35, d:4.45, color:0xcab092},
  {name:'卫浴', x:4.15, z:-1.05, w:2.45, d:3.05, color:0xd0d9d6},
  {name:'家政', x:4.15, z:2.0, w:2.45, d:3.0, color:0xd7bf91}
];

const HOUSE_WALL_HEIGHT = 2.82;
const HOUSE_CEILING_Y = 3.36;
const HOUSE_WALL_COLOR = 0xf2ece3;
const HOUSE_TRIM_COLOR = 0xd6c7b8;

const HOME_PALETTE = {
  wallWarm:0xf6efe4,
  wallSide:0xeadaca,
  ceiling:0xfff7ed,
  trim:0xe4d5c4,
  wood:0xc88e4f,
  woodLight:0xe3b572,
  woodDark:0x8f6239,
  sage:0xa9bd82,
  sageDeep:0x6f8a5f,
  curtainGreen:0x93a66f,
  curtainSheer:0xf5efe4,
  linen:0xd8c7ad,
  softGray:0xd9d9cf,
  glass:0xcfe4e4,
  tileGreen:0xbed2a8
};

/* Phase 2: Room-specific tone system (from reference image analysis) */
const ROOM_TONE = {
  living:  { accent:0xa9bd82, sofa:0xc8c5be, sofaBase:0x9a9590, rug:0xd7c4a1, curtain:0x8a9a6a, pillow1:0xe8d8c3, pillow2:0xa9bd82 },
  bedroom: { accent:0xb7c99c, mattress:0xd8d4cc, headboard:0x8a7a6e, quilt:0xd8d4cc, rug:0xe0d4bc, curtain:0x8a9a6a, wardrobe:0xb08da9 },
  kids:    { accent:0x8fb8d4, blue:0x8fb8d4, rug:0xc8dce8, fabric:0xb8c8d4 },
  bath:    { accent:0xb5d4c0, cabinet:0xb5d4c0, counter:0xf2f0ed, tile:0xa8c8b8, floor:0xbcc5c0, towel:0xa9bd82 },
  kitchen: { accent:0xb5d4c0, backsplash:0xa8d0b8, counter:0xf0ede8, cabinet:0xe3b572 },
  entry:   { accent:0xa9bd82, bench:0xa9bd82, mat:0xc5a06d, cabinet:0xe3b572 }
};

const REAL_SPACE_ASSET_ROOT = 'assets/models/';
const REAL_SPACE_REQUIRED_LOADER = 'vendor/GLTFLoader-r124.js';
const REAL_SPACE_ASSETS = {
  'living.sofa': {file:'living/sofa_2200x900.glb', dims:[2200,820,900]},
  'living.coffeeTable': {file:'living/coffee_table_1200x600.glb', dims:[1200,420,600]},
  'living.tvCabinet': {file:'living/floating_tv_cabinet_2000x350.glb', dims:[2000,260,350]},
  'living.sideTable': {file:'living/side_table_500x500.glb', dims:[500,520,500]},
  'entry.shoeCabinet': {file:'entry/shoe_cabinet_1200x350.glb', dims:[1200,1900,350]},
  'entry.bench': {file:'entry/shoe_bench_820x380.glb', dims:[820,360,380]},
  'entry.mirror': {file:'entry/full_height_mirror.glb', dims:[640,1340,60]},
  'study.desk': {file:'study/desk_1400x700.glb', dims:[1400,760,700]},
  'study.bookcase': {file:'study/bookcase_2000x350.glb', dims:[350,2150,2000]},
  'study.loungeChair': {file:'study/lounge_chair_800x800.glb', dims:[800,640,800]},
  'bedroom.bed': {file:'bedroom/bed_1800x2000.glb', dims:[1800,620,2000]},
  'bedroom.nightstand': {file:'bedroom/nightstand_500x400.glb', dims:[500,500,400]},
  'bedroom.wardrobe': {file:'bedroom/wardrobe_2400x600.glb', dims:[2400,2400,600]},
  'bedroom.vanity': {file:'bedroom/vanity_1000x500.glb', dims:[1000,760,500]},
  'bath.vanity': {file:'bath/vanity_800x500.glb', dims:[800,850,500]},
  'bath.toilet': {file:'bath/toilet_400x700.glb', dims:[400,760,700]},
  'bath.shower': {file:'bath/shower_900x1200.glb', dims:[900,2100,1200]}
};

const REAL_SPACE_FORCE_PROCEDURAL = true;

const REAL_SPACE_MATERIALS = {
  warmWood:{color:0xb58b55, rough:.76},
  darkWood:{color:0x6f4e35, rough:.64},
  walnut:{color:0x8a6443, rough:.7},
  linen:{color:0xa39182, rough:.96},
  sofaBase:{color:0x9a8777, rough:.94},
  sofaBack:{color:0x8f7d6e, rough:.94},
  creamFabric:{color:0xfff3cf, rough:.96},
  mirror:{color:0xcde0df, rough:.3, metalness:.02, transparent:true, opacity:.72},
  glass:{color:0xbcd6d7, rough:.34, transparent:true, opacity:.5, metalness:.02},
  ceramic:{color:0xf6f8f6, rough:.62},
  tile:{color:0xd8e4e2, rough:.78}
};

const TOUR_GRAPH = {
  'entry-node':['living-node'],
  'living-node':['entry-node','study-node','bedroom-node','balcony-node','bath-node'],
  'study-node':['living-node','balcony-node'],
  'bedroom-node':['living-node','bath-node'],
  'balcony-node':['living-node','study-node'],
  'bath-node':['living-node','bedroom-node']
};

const WALK_PATHS = {
  'entry-node>living-node':[[-5.15,3.35],[-4.2,3.28],[-3.0,3.16],[-1.7,3.18],[-.65,3.15]],
  'living-node>entry-node':[[-.65,3.15],[-1.7,3.18],[-3.0,3.16],[-4.2,3.28],[-5.15,3.35]],
  'living-node>study-node':[[-.65,3.15],[-.92,1.72],[-1.25,.22],[-1.9,-.9],[-3.15,-1.45],[-4.85,-2.55]],
  'study-node>living-node':[[-4.85,-2.55],[-3.15,-1.45],[-1.9,-.9],[-1.25,.22],[-.92,1.72],[-.65,3.15]],
  'living-node>bedroom-node':[[-.65,3.15],[.5,2.26],[1.45,1.08],[2.25,.02],[2.95,-1.02],[3.82,-2.05]],
  'bedroom-node>living-node':[[3.82,-2.05],[2.95,-1.02],[2.25,.02],[1.45,1.08],[.5,2.26],[-.65,3.15]],
  'living-node>balcony-node':[[-.65,3.15],[-.42,1.45],[-.14,-.65],[.18,-2.7],[.55,-4.68]],
  'balcony-node>living-node':[[.55,-4.68],[.18,-2.7],[-.14,-.65],[-.42,1.45],[-.65,3.15]],
  'study-node>balcony-node':[[-4.85,-2.55],[-3.65,-3.32],[-2.35,-4.05],[-.75,-4.55],[.55,-4.68]],
  'balcony-node>study-node':[[.55,-4.68],[-.75,-4.55],[-2.35,-4.05],[-3.65,-3.32],[-4.85,-2.55]],
  'living-node>bath-node':[[-.65,3.15],[.68,2.42],[1.82,1.7],[3.05,1.12],[4.85,.78]],
  'bath-node>living-node':[[4.85,.78],[3.05,1.12],[1.82,1.7],[.68,2.42],[-.65,3.15]],
  'bedroom-node>bath-node':[[3.82,-2.05],[4.14,-.95],[4.38,-.05],[4.85,.78]],
  'bath-node>bedroom-node':[[4.85,.78],[4.38,-.05],[4.14,-.95],[3.82,-2.05]]
};

function f(k,v,source,confidence){ return {k,v,source,confidence}; }
function ev(date,type,desc,member,amount){ return {date,type,desc,member,amount}; }
function rem(id,date,action,status){ return {id,date,action,status}; }
function op(time,action,member){ return {time,action,member}; }
function ai(type,fields,reason,risk,location,privacy,questions){ return {type,fields,reason,risk,location,privacy,questions}; }
function low(reason,missing,questions,manual,archiveName,trace){ return {reason,missing,questions,manual,archiveName,trace}; }

const $ = (s,p=document)=>p.querySelector(s);
const $$ = (s,p=document)=>[...p.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
function nowStr(){ return TODAY + ' ' + new Date().toTimeString().slice(0,5); }

/* 自动时间系统：根据真实时间调整灯光和氛围 */
function updateLightingByTime(){
  const hour = new Date().getHours();

  if(hour >= 6 && hour < 8){
    // 清晨 6:00-8:00：灯光关闭，窗户开启（自然光）
    state.lightOn = false;
    state.windowOpen = true;
  } else if(hour >= 8 && hour < 18){
    // 白天 8:00-18:00：灯光关闭，窗户开启
    state.lightOn = false;
    state.windowOpen = true;
  } else if(hour >= 18 && hour < 22){
    // 傍晚 18:00-22:00：灯光开启，窗户开启
    state.lightOn = true;
    state.windowOpen = true;
  } else {
    // 夜间 22:00-6:00：灯光开启，窗户关闭
    state.lightOn = true;
    state.windowOpen = false;
  }
}

/* 每10分钟更新一次时间状态 */
setInterval(function(){
  updateLightingByTime();
  render();
}, 600000);
function sourceLabel(s){ return SOURCE_TEXT[s] || s; }
function catColor(cat){ return CATEGORIES[cat] || {ico:'', color:'#5c6864', bg:'#edf0ed'}; }
function zoneName(id){ return SPACE_ZONES.find(z=>z.id===id)?.name || '未设置位置'; }
function daysUntil(dateStr){
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(TODAY + 'T00:00:00');
  return Math.ceil((d - today) / 86400000);
}
function confidenceLabel(v){
  if(v >= .9) return '可信，可直接采用';
  if(v >= .7) return '待确认，需要人工核对';
  return '低置信度，必须人工补全';
}
function riskTag(level){
  return {high:{c:'danger',t:'高风险'}, medium:{c:'warn',t:'中风险'}, low:{c:'brand',t:'低风险'}, none:{c:'gray',t:'无风险'}}[level] || {c:'gray',t:'无风险'};
}
function statusTag(status){
  return {archived:{c:'ok',t:'已归档'}, supplement:{c:'danger',t:'待补资料'}, supplement_in_progress:{c:'brand',t:'补资料中'}}[status] || {c:'ok',t:'已归档'};
}
function reminderPriority(days){
  if(days <= 7) return {c:'danger',t:'紧急'};
  if(days <= 30) return {c:'danger',t:'高优先级'};
  if(days <= 60) return {c:'warn',t:'中优先级'};
  return {c:'brand',t:'低优先级'};
}
function reminderStateText(status){ return {pending:'待处理', in_progress:'处理中', done:'已完成'}[status] || '待处理'; }
function fieldStatus(field){
  if(!field.v || String(field.v).includes('?')) return 'fail';
  if((field.confidence || 0) < .6) return 'fail';
  if((field.confidence || 0) < .85) return 'warn';
  return 'ok';
}
function fieldGet(a,key){
  const field = a.fields?.find(item=>item.k===key || item.k.includes(key));
  return field?.v || '';
}
function nextId(prefix,list){
  const nums = list.map(x=>parseInt(String(x.id || '').replace(/[^\d]/g,''),10)).filter(Boolean);
  return prefix + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3,'0');
}
function toast(msg){
  const wrap = $('#toast-wrap');
  if(!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .25s'; setTimeout(()=>el.remove(),260); },2200);
}

function cloneValue(value){
  return value === undefined ? undefined : clone(value);
}

function mergeUniqueArray(seedList=[], savedList=[]){
  const result = [];
  const seen = new Set();
  [...seedList, ...savedList].forEach(item=>{
    const key = typeof item === 'object' ? JSON.stringify(item) : String(item);
    if(seen.has(key)) return;
    seen.add(key);
    result.push(cloneValue(item));
  });
  return result;
}

function mergeFieldList(seedFields=[], savedFields=[]){
  const savedByKey = new Map((Array.isArray(savedFields) ? savedFields : []).map(field=>[field.k, field]));
  const used = new Set();
  const merged = (Array.isArray(seedFields) ? seedFields : []).map(field=>{
    const saved = savedByKey.get(field.k);
    if(saved) used.add(field.k);
    return saved ? Object.assign(clone(field), clone(saved)) : clone(field);
  });
  (Array.isArray(savedFields) ? savedFields : []).forEach(field=>{
    if(!used.has(field.k)) merged.push(clone(field));
  });
  return merged;
}

function mergeRecordList(seedList=[], savedList=[], keyFn){
  const savedByKey = new Map((Array.isArray(savedList) ? savedList : []).map(item=>[keyFn(item), item]));
  const used = new Set();
  const merged = (Array.isArray(seedList) ? seedList : []).map(item=>{
    const key = keyFn(item);
    const saved = savedByKey.get(key);
    if(saved) used.add(key);
    return saved ? Object.assign(clone(item), clone(saved)) : clone(item);
  });
  (Array.isArray(savedList) ? savedList : []).forEach(item=>{
    const key = keyFn(item);
    if(!used.has(key)) merged.push(clone(item));
  });
  return merged;
}

function mergeArchiveRecord(seedArchive, savedArchive){
  if(!savedArchive) return clone(seedArchive);
  const merged = clone(seedArchive);
  [
    'title','category','status','riskLevel','familyMember','date','amountOrTerm',
    'sourceMaterial','rawType','rawPreview','handover','memoryRoom','memoryZone',
    'memoryContainer','locationPrivacy','locationConfidence','locationSource',
    'lowConfidence','ai','lastReviewedAt'
  ].forEach(key=>{
    if(savedArchive[key] !== undefined) merged[key] = cloneValue(savedArchive[key]);
  });
  merged.fields = mergeFieldList(seedArchive.fields, savedArchive.fields);
  merged.evidence = mergeUniqueArray(seedArchive.evidence, savedArchive.evidence);
  merged.events = mergeRecordList(seedArchive.events, savedArchive.events, item=>`${item.date}|${item.type}|${item.desc}`);
  merged.reminders = mergeRecordList(seedArchive.reminders, savedArchive.reminders, item=>item.id || `${item.date}|${item.action}`);
  merged.operations = mergeRecordList(seedArchive.operations, savedArchive.operations, item=>`${item.time}|${item.action}|${item.member}`);
  merged.nextActions = mergeUniqueArray(seedArchive.nextActions, savedArchive.nextActions);
  merged.searchKeywords = mergeUniqueArray(seedArchive.searchKeywords, savedArchive.searchKeywords);
  return merged;
}

function mergeArchivesWithSeed(savedArchives){
  const savedList = Array.isArray(savedArchives) ? savedArchives : [];
  const savedById = new Map(savedList.map(archive=>[archive.id, archive]));
  const seedIds = new Set(SEED_ARCHIVES.map(archive=>archive.id));
  const merged = SEED_ARCHIVES.map(seedArchive=>mergeArchiveRecord(seedArchive, savedById.get(seedArchive.id)));
  savedList.forEach(archive=>{
    if(archive?.id && !seedIds.has(archive.id)) merged.push(clone(archive));
  });
  return merged;
}

function mergePendingWithSeed(savedPending){
  const savedList = Array.isArray(savedPending) ? savedPending : [];
  const savedById = new Map(savedList.map(item=>[item.id, item]));
  const seedIds = new Set(SEED_PENDING.map(item=>item.id));
  const merged = SEED_PENDING.map(seedItem=>{
    const saved = savedById.get(seedItem.id);
    return saved ? Object.assign(clone(seedItem), clone(saved)) : clone(seedItem);
  });
  savedList.forEach(item=>{
    if(item?.id && !seedIds.has(item.id)) merged.push(clone(item));
  });
  return merged;
}

function saveState(){
  try{
    localStorage.setItem(STORE_KEY, JSON.stringify({
      realHomeSceneVersion: REAL_HOME_SCENE_VERSION,
      archives: state.archives,
      pending: state.pending,
      currentPendingId: state.currentPendingId,
      riskTab: state.riskTab,
      timelineFilter: state.timelineFilter,
      privacyMode: state.privacyMode,
      lightOn: state.lightOn,
      windowOpen: state.windowOpen,
      rightDoorOpen: state.rightDoorOpen,
      cameraSimulationComplete: state.cameraSimulationComplete,
      cameraApplied: state.cameraApplied,
      spaceCamera: state.spaceCamera,
      librarySpaceCamera: state.librarySpaceCamera,
      activeIncidentId: state.activeIncidentId,
      incidentFocus: state.incidentFocus,
      incidentStatus: state.incidentStatus,
      tourNode: state.tourNode,
      tourYaw: state.tourYaw,
      tourPitch: state.tourPitch,
      serviceDemo: state.serviceDemo,
      serviceRuns: state.serviceRuns,
      activeHomeScenario: state.activeHomeScenario,
      memberFocus: state.memberFocus,
      authorizationFocus: state.authorizationFocus,
      lastArchiveResult: state.lastArchiveResult,
      lastCameraResult: state.lastCameraResult,
      layoutMode: state.layoutMode
    }));
  }catch(e){ console.warn('save failed', e); }
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw){
      const saved = JSON.parse(raw);
      if(Array.isArray(saved.archives)){
        state.archives = mergeArchivesWithSeed(saved.archives);
        state.pending = mergePendingWithSeed(saved.pending);
        state.currentPendingId = saved.currentPendingId && state.pending.some(p=>p.id === saved.currentPendingId && !p._done)
          ? saved.currentPendingId
          : (state.pending.find(p=>!p._done)?.id || null);
        state.riskTab = saved.riskTab || 'pending';
        state.timelineFilter = saved.timelineFilter || 'all';
        state.privacyMode = !!saved.privacyMode;
        state.lightOn = saved.lightOn !== false;
        state.windowOpen = !!saved.windowOpen;
        state.rightDoorOpen = !!saved.rightDoorOpen;
        state.cameraSimulationComplete = !!saved.cameraSimulationComplete;
        state.cameraApplied = !!saved.cameraApplied;
        state.spaceCamera = Object.assign(state.spaceCamera, saved.spaceCamera || {});
        state.librarySpaceCamera = Object.assign({ zoom: .84, rotate: 0, tilt: 0, panX: 0, panY: 0, mode: 'top' }, saved.librarySpaceCamera || {});
        state.activeIncidentId = saved.activeIncidentId || DEMO_INCIDENTS[0].id;
        state.incidentFocus = !!saved.incidentFocus;
        state.incidentStatus = saved.incidentStatus || 'detected';
        if(!DEMO_INCIDENTS.some(item=>item.id === state.activeIncidentId)) state.activeIncidentId = DEMO_INCIDENTS[0].id;
        state.tourNode = saved.tourNode || activeIncident().tourNode;
        if(!TOUR_NODES.some(node=>node.id === state.tourNode)) state.tourNode = activeIncident().tourNode;
        state.tourYaw = saved.tourYaw || 0;
        state.tourPitch = saved.tourPitch || 0;
        state.serviceDemo = saved.serviceDemo || null;
        state.serviceRuns = saved.serviceRuns && typeof saved.serviceRuns === 'object' ? saved.serviceRuns : {};
        state.activeHomeScenario = HOME_SCENARIOS.some(item=>item.id === saved.activeHomeScenario) ? saved.activeHomeScenario : 'incident';
        state.memberFocus = FAMILY_MEMBERS.some(item=>item.id === saved.memberFocus) ? saved.memberFocus : 'lin';
        state.authorizationFocus = AUTHORIZATION_SCOPES.some(item=>item.id === saved.authorizationFocus) ? saved.authorizationFocus : 'AUTH-002';
        if(saved.layoutMode) state.layoutMode = saved.layoutMode;
        if(saved.realHomeSceneVersion !== REAL_HOME_SCENE_VERSION){
          state.spaceCamera = { zoom: 1, rotate: 0, tilt: 0, panX: 0, panY: 0, mode: 'interior' };
          state.librarySpaceCamera = { zoom: .84, rotate: 0, tilt: 0, panX: 0, panY: 0, mode: 'top' };
          state.tourNode = activeIncident().tourNode;
          state.tourYaw = 0;
          state.tourPitch = 0;
          state.windowOpen = true;
          state.rightDoorOpen = false;
          state.activeHomeScenario = 'incident';
          state.serviceDemo = 'material-pack';
        }
        state.lastArchiveResult = saved.lastArchiveResult || null;
        state.lastCameraResult = saved.lastCameraResult || null;
        saveState();
        return;
      }
    }
  }catch(e){ console.warn('load failed', e); }
  resetState();
}

function resetState(){
  state.archives = clone(SEED_ARCHIVES);
  state.pending = clone(SEED_PENDING);
  state.currentPendingId = state.pending[0]?.id || null;
  state.aiStage = 'idle';
  state.riskTab = 'pending';
  state.timelineFilter = 'all';
  state.privacyMode = false;
  updateLightingByTime();
  state.windowOpen = true;
  state.rightDoorOpen = false;
  state.cameraSimulationComplete = false;
  state.cameraResultDisplay = false;
  state.cameraApplied = false;
  state.spaceCamera = { zoom: 1, rotate: 0, tilt: 0, panX: 0, panY: 0, mode: 'interior' };
  state.libraryView = 'space';
  state.librarySpaceCamera = { zoom: .84, rotate: 0, tilt: 0, panX: 0, panY: 0, mode: 'top' };
  state.activeIncidentId = DEMO_INCIDENTS[0].id;
  state.incidentFocus = false;
  state.incidentStatus = 'detected';
  state.tourNode = activeIncident().tourNode;
  state.tourYaw = 0;
  state.tourPitch = 0;
  state.serviceDemo = 'material-pack';
  state.serviceRuns = {};
  state.activeHomeScenario = 'incident';
  state.memberFocus = 'lin';
  state.authorizationFocus = 'AUTH-002';
  state.lastArchiveResult = null;
  state.lastCameraResult = null;
  state.libraryRecentScanOnly = false;
  saveState();
}

function applyUrlState(){
  // 支持hash路由 (#today) 和 query参数 (?view=today)
  const hash = window.location.hash.slice(1); // 移除#号
  if(hash && PAGE_TITLES[hash]) {
    state.currentView = hash;
  }

  const params = new URLSearchParams(window.location.search || '');
  const view = params.get('view');
  if(view && PAGE_TITLES[view]) state.currentView = view;
  const tourNode = params.get('tourNode');
  if(tourNode && TOUR_NODES.some(node=>node.id === tourNode)) state.tourNode = tourNode;
  const light = params.get('light');
  if(light === 'on') state.lightOn = true;
  if(light === 'off') state.lightOn = false;
  const windowState = params.get('window');
  if(windowState === 'open') state.windowOpen = true;
  if(windowState === 'closed') state.windowOpen = false;
  const door = params.get('door');
  if(door === 'open') state.rightDoorOpen = true;
  if(door === 'closed') state.rightDoorOpen = false;
  const scenario = params.get('scenario');
  if(scenario && HOME_SCENARIOS.some(item=>item.id === scenario)){
    const homeScenario = homeScenarioById(scenario);
    state.activeHomeScenario = homeScenario.id;
    state.tourNode = homeScenario.tourNode || state.tourNode;
    state.spaceFilter = homeScenario.zone || null;
    state.highlightedZone = homeScenario.zone || null;
    state.roomFilter = homeScenario.zone ? activeRoomId(homeScenario.zone) : null;
    if(homeScenario.apply){
      if(homeScenario.apply.lightOn !== undefined) state.lightOn = homeScenario.apply.lightOn;
      if(homeScenario.apply.windowOpen !== undefined) state.windowOpen = homeScenario.apply.windowOpen;
      if(homeScenario.apply.rightDoorOpen !== undefined) state.rightDoorOpen = homeScenario.apply.rightDoorOpen;
    }
  }
  const libraryView = params.get('libraryView');
  if(['list','space'].includes(libraryView)) state.libraryView = libraryView;
  const incidentParam = params.get('incident');
  if(incidentParam && DEMO_INCIDENTS.some(item=>item.id === incidentParam)){
    state.activeIncidentId = incidentParam;
    focusIncidentLocation(activeIncident());
  }
  const zone = params.get('zone');
  if(zone && SPACE_ZONES.some(item=>item.id === zone)){
    state.incidentFocus = false;
    state.spaceFilter = zone;
    state.highlightedZone = zone;
    state.roomFilter = activeRoomId(zone);
    const node = TOUR_NODES.find(item=>item.zone === zone);
    if(node) state.tourNode = node.id;
  }
}

const PAGE_TITLES = {
  home:['首页','现在要做什么 · 一目了然'],
  space:['空间','3D 数字孪生 · 档案在哪里'],
  archives:['档案','家庭资产库 · 查看所有档案'],
  services:['服务','连接服务商 · 授权与履约'],

  // 保留以下页面用于兼容（逐步废弃）
  dashboard:['今日家况','家庭数字孪生 OS · 安全、资产、风险和服务统一入口'],
  today:['AI 管家','从空间状态、家庭资产和风险证据生成下一步行动'],
  archive:['收件箱','接收新资料，AI 抽取字段并生成档案、事项和提醒'],
  members:['成员权限','谁能看、谁能控、谁能代办，一张视图说明白'],
  timeline:['事件记录','按时间回看家庭状态、档案和事务证据链'],
  validation:['验证台','把闭环、授权、SLA、回执和证据沉淀摊开验收']
};

function setView(view){
  if(aiTimer){ clearTimeout(aiTimer); aiTimer = null; }
  state.currentView = view;
  state.drawerEdit = false;
  syncViewChrome(view);
  setSidebarOpen(false);
  render();
}

// 进入3D空间的优雅转场：crossfade 交叉淡入淡出，快照层（2D）与3D内容同步淡入淡出，始终有内容无空屏
// 注意：WebGL canvas 创建独立合成层，会绕过父级 opacity，必须直接控制 canvas 自身 opacity
function enterSpaceWithTransition(btn){
  if(state.currentView === 'space') return;
  const content = $('#content');
  if(!content){ setView('space'); return; }
  const rect = content.getBoundingClientRect();
  const snapshot = content.cloneNode(true);
  snapshot.removeAttribute('id');
  snapshot.className += ' space-snapshot';
  snapshot.setAttribute('aria-hidden','true');
  Object.assign(snapshot.style, {
    position:'fixed',
    top: rect.top + 'px',
    left: rect.left + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px',
    margin:'0',
    zIndex:'50',
    pointerEvents:'none',
    overflow:'hidden'
  });
  document.body.appendChild(snapshot);
  // 切换到 3D 视图（同步：render + bindViewEvents + initWebGLTour）
  setView('space');
  // 找到 3D 容器（控制 UI 元素）和 canvas（控制 WebGL 渲染，绕过父级 opacity）
  const spaceEl = content.querySelector('.space-immersive');
  const canvases = content.querySelectorAll('[data-tour-webgl] canvas, [data-tour-canvas]');
  // 同步设置 opacity:0（浏览器还没渲染，用户看不到 3D 闪现）
  if(spaceEl){
    spaceEl.style.transition = 'none';
    spaceEl.style.opacity = '0';
  }
  canvases.forEach(c => {
    c.style.transition = 'none';
    c.style.opacity = '0';
  });
  // rAF 后，快照淡出 + 3D 容器和 canvas 同步淡入
  requestAnimationFrame(()=>{
    snapshot.classList.add('fading');
    if(spaceEl){
      void spaceEl.offsetWidth;
      spaceEl.style.transition = 'opacity .55s cubic-bezier(.2,.8,.2,1)';
      spaceEl.style.opacity = '1';
    }
    canvases.forEach(c => {
      void c.offsetWidth;
      c.style.transition = 'opacity .55s cubic-bezier(.2,.8,.2,1)';
      c.style.opacity = '1';
    });
  });
  // 清理
  window.setTimeout(()=>{
    if(snapshot.parentNode) snapshot.remove();
    if(spaceEl){
      spaceEl.style.transition = '';
      spaceEl.style.opacity = '';
    }
    canvases.forEach(c => {
      c.style.transition = '';
      c.style.opacity = '';
    });
  }, 820);
}

function setSidebarOpen(open){
  const sidebar = $('#sidebar');
  const mask = $('#app-sidebar-mask');
  const screen = document.querySelector('.app-phone-screen');
  const next = !!open;
  if(sidebar) sidebar.classList.toggle('open', next);
  if(mask) mask.classList.toggle('open', next);
  if(screen) screen.classList.toggle('sidebar-open', next);
}

function syncViewChrome(view=state.currentView){
  $$('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.view===view));
  $$('.mobile-tab .tab, .app-tabbar .tab').forEach(n=>n.classList.toggle('active', n.dataset.view===view));
  const title = PAGE_TITLES[view] || PAGE_TITLES.dashboard;
  $('#page-title').textContent = title[0];
  $('#page-sub').textContent = title[1];
  const globalSearch = $('#global-search');
  if(globalSearch){
    globalSearch.value = '';
    const searchWrap = globalSearch.closest('.search-global');
    if(searchWrap) searchWrap.hidden = view === 'dashboard';
  }
  const pending = $('#top-pending-action');
  if(pending){
    const pendingCount = state.pending.filter(p=>!p._done).length;
    pending.hidden = true;
    pending.textContent = `处理收件箱资料${pendingCount ? ` ${pendingCount}` : ''}`;
  }
  syncPrivacyToggleVisibility();
}

function render(){
  const c = $('#content');
  if(!c) return;
  syncViewChrome(state.currentView);

  // 所有页面都使用固定高度，除了today页面需要滚动
  c.classList.remove('dashboard-screen', 'full-screen');
  if(state.currentView !== 'today') {
    c.classList.add('full-screen');
  }

  if(state.currentView==='home') c.innerHTML = viewHome();
  if(state.currentView==='space') c.innerHTML = viewSpace();
  if(state.currentView==='archives') c.innerHTML = viewArchives();
  if(state.currentView==='dashboard') c.innerHTML = viewDashboard();
  if(state.currentView==='today') c.innerHTML = viewToday();
  if(state.currentView==='archive') c.innerHTML = viewArchive();
  if(state.currentView==='members') c.innerHTML = viewMembers();
  if(state.currentView==='timeline') c.innerHTML = viewTimeline();
  if(state.currentView==='services') c.innerHTML = viewServices();
  if(state.currentView==='validation') c.innerHTML = viewValidation();
  const privacy = $('#privacy-toggle');
  if(privacy) privacy.checked = state.privacyMode;
  syncPrivacyToggleVisibility();
  updateBadges();
  bindViewEvents();
  // 初始化Lucide图标
  if(typeof lucide !== 'undefined'){
    lucide.createIcons();
  }
}

function shouldShowPrivacyToggle(){
  return state.currentView === 'library' && state.libraryView === 'space';
}

function syncPrivacyToggleVisibility(){
  const wrap = $('#privacy-toggle-wrap');
  if(!wrap) return;
  wrap.hidden = !shouldShowPrivacyToggle();
}

function updateBadges(){
  const pending = state.pending.filter(p=>!p._done).length;
  const risk = getRiskItems().pending.length + getRiskItems().progress.length;
  const pb = $('#nav-pending'); if(pb) pb.textContent = pending;
  const rb = $('#nav-risk'); if(rb) rb.textContent = risk;
}

function brandSymbolHTML(cls='brand-symbol'){
  return `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true"><path d="M12 29 32 14l20 15v22H12Z" fill="#1c5f54"/><path d="M20 31 32 22l12 9v18H20Z" fill="#fff7df"/><path d="M27 34h11v14H27z" fill="#1c5f54" opacity=".16"/><path d="M29 38h8M29 43h6" stroke="#1c5f54" stroke-width="2.6" stroke-linecap="round"/><path d="m41 21 4 4 8-10" fill="none" stroke="#d9a441" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="18" cy="49" r="5" fill="#d9a441"/></svg>`;
}

/* Legacy damaged search/location block disabled after seed-data recovery.
function displayLocation(a){
  if(!a) return '未设置记忆位';
  const zone = zoneName(a.memoryZone);
  const mode = state.privacyMode;
  if(a.locationPrivacy === 'hidden') return '隐私资料（不展示精确位置';
  if(a.locationPrivacy === 'room_only') return `${zone}（精确容器已隐藏）`;
  if(mode && a.locationPrivacy !== 'public') return `${zone}（隐私模式隐藏容器）`;
  return `${zone} / ${a.memoryContainer || '未命名容'}`;
}

function displayCameraLocation(result){
  if(!result) return '';
  if(result.privacy === 'hidden') return '隐私资料（位置已遮罩';
  if(result.privacy === 'room_only' || state.privacyMode) return `${zoneName(result.zone)}（精确容器已隐藏）`;
  return `${zoneName(result.zone)} / ${result.container}`;
}

function describeStoredLocation(location){
  if(!location || !location.memoryZone) return '鏈缃綅缃?';
  if(location.locationPrivacy === 'hidden') return '闅愮璧勬枡锛堜綅缃凡閬僵锛?;
  if(location.locationPrivacy === 'room_only') return `${zoneName(location.memoryZone)}锛堢簿纭鍣ㄥ凡闅愯棌锛塦;
  if(shouldShowPrivacyToggle() && state.privacyMode && location.locationPrivacy !== 'public') return `${zoneName(location.memoryZone)}锛堥殣绉佹ā寮忛殣钘忓鍣級`;
  return `${zoneName(location.memoryZone)} / ${location.memoryContainer || '鏈懡鍚嶅鍣?}`;
}

function recentCameraUpdateForArchive(id){
  const changed = state.lastCameraResult?.changed || [];
  return changed.find(item=>item.id === id) || null;
}

function scanValueSummaryHTML(summary){
  if(!summary || !summary.changed?.length) return '';
  const readyCount = summary.changed.filter(item=>{
    const archive = state.archives.find(a=>a.id === item.id);
    return archive && archiveEvidenceScore(archive) >= 70 && archiveServiceRoute(archive);
  }).length;
  const dueSoonCount = summary.changed.filter(item=>{
    const archive = state.archives.find(a=>a.id === item.id);
    const nearest = archive ? nearestReminder(archive) : null;
    return nearest && nearest.days <= 45;
  }).length;
  const exposure = summary.changed.reduce((sum,item)=>{
    const archive = state.archives.find(a=>a.id === item.id);
    return sum + (archive ? archiveExposureAmount(archive) : 0);
  },0);
  return `<div class="scan-value-summary">
    <div class="scan-value-head">
      <strong>为什么要做关联扫描</strong>
      <span>它不是为了看动画，而是为了把“这份资料到底放在哪、能不能立刻拿去处理事项”变成确定状态。</span>
    </div>
    <div class="scan-value-grid">
      <div><b>${summary.totalChanged}</b><span>份家庭档案从“靠记忆找”变成“可定位、可打开、可交接”</span></div>
      <div><b>${readyCount}</b><span>份档案已具备服务入口，可直接转续保、报修、报销或材料包</span></div>
      <div><b>${dueSoonCount}</b><span>项近期事项减少翻找成本，避免到期前才找不到凭证</span></div>
      <div><b>${formatMoneyShort(exposure)}</b><span>相关资产/责任金额被重新挂回空间，家庭价值不再散落</span></div>
    </div>
  </div>`;
}

function cameraResultSummaryHTML(summary){
  if(!summary || !summary.changed || !summary.changed.length) return '';
  const headline = summary.reviewCount
    ? `宸叉洿鏂?${summary.totalChanged} 浠藉搴。妗堬紝鍏朵腑 ${summary.reviewCount} 椤瑰緟浜哄伐纭`
    : `宸叉洿鏂?${summary.totalChanged} 浠藉搴。妗?`;
  return `<div class="camera-result-summary">
    <div class="camera-result-head">
      <div>
        <strong>瀹跺涵璁板繂绌洪棿宸叉洿鏂?</strong>
        <span>${headline} 路 ${summary.timestamp}</span>
      </div>
      <div class="camera-result-actions">
        <button class="btn btn-primary btn-sm" data-camera-result-view>鏌ョ湅鏇存柊妗ｆ</button>
        ${summary.primaryZone ? `<button class="btn btn-outline btn-sm" data-space-zone="${summary.primaryZone}">杩涘叆绌洪棿瀹氫綅</button>` : ''}
        ${summary.reviewCount ? `<button class="btn btn-outline btn-sm" data-camera-result-review>浼樺厛纭寰呭鏍搁」</button>` : ''}
      </div>
    </div>
    <div class="camera-result-kpis">
      <div><span>褰掍綅鏇存柊</span><strong>${summary.relocatedCount}</strong></div>
      <div><span>缃俊鎻愬崌</span><strong>${summary.confidenceLiftCount}</strong></div>
      <div><span>寰呬汉宸ュ鏍?</span><strong>${summary.reviewCount}</strong></div>
      <div><span>闅愮閬僵淇濈暀</span><strong>${summary.maskedCount}</strong></div>
    </div>
    <div class="camera-result-list">
      ${summary.changed.map(item=>`<button class="camera-result-row ${item.needsReview?'review':''}" data-open="${item.id}">
        <span class="camera-result-main">
          <strong>${esc(item.title)}</strong>
          <em>${esc(item.beforeLocation)} 鈫?${esc(item.afterLocation)}</em>
          <small>${esc(item.source)}</small>
        </span>
        <span class="camera-result-meta">
          <b>${Math.round(item.beforeConfidence * 100)}% 鈫?${Math.round(item.confidence * 100)}%</b>
          <i>${item.needsReview ? '寰呭鏍? : '宸插綊浣?}</i>
        </span>
      </button>`).join('')}
    </div>
    ${summary.maskedCount ? `<div class="camera-result-note">鍙︽湁 ${summary.maskedCount} 澶勬晱鎰熻祫鏂欎粛淇濇寔閬僵锛屼笉杩涘叆鍏紑绌洪棿灞曠ず銆?</div>` : ''}
  </div>`;
}

function archiveHaystack(a){
  return [
    a.id,a.title,a.category,a.familyMember,a.date,a.amountOrTerm,a.sourceMaterial,a.rawType,a.rawPreview,a.handover,
    displayLocation(a), ...(a.searchKeywords||[]), ...(a.evidence||[]),
    ...(a.fields||[]).flatMap(f=>[f.k,f.v]),
    ...(a.events||[]).flatMap(e=>[e.date,e.type,e.desc,e.member,e.amount]),
    ...(a.reminders||[]).flatMap(r=>[r.date,r.action,r.status]),
    ...(a.operations||[]).flatMap(o=>[o.time,o.action,o.member]),
    a.ai?.type,a.ai?.reason,a.ai?.risk,a.ai?.location
  ].filter(Boolean).join(' ').toLowerCase();
}

function queryTokens(query){
  return String(query || '')
    .toLowerCase()
    .replace(/[''。]/g,' ')
    .split(/[\/\s]+/)
    .map(x=>x.trim())
    .filter(Boolean);
}

function archiveSearchHit(a, query){
  const q = String(query || '').trim().toLowerCase();
  if(!q) return true;
  const hay = archiveHaystack(a);
  const tokens = queryTokens(q);
  if(tokens.length > 1) return tokens.every(t=>tokenHit(hay, t));
  if(hay.includes(q)) return true;
  const known = ['洗衣','保修','爸爸','2026','外婆','复诊','7','车险','续费','入学','户口','缺什','在哪','什么时'];
  const pieces = known.filter(k=>q.includes(k));
  return pieces.length ? pieces.every(k=>['在哪','什么时','缺什'].includes(k) || hay.includes(k) || (k==='7' && hay.includes( 2026-07'))) : false;
}

function tokenHit(hay, token){
  if(hay.includes(token)) return true;
  const month = token.match(/^(\d{1,2}) /);
  if(month){
    const mm = month[1].padStart(2,'0');
    return hay.includes(`-${mm}-`) || hay.includes(`${Number(month[1])} 月`);
  }
  return false;
}

function getArchiveSearchMatches(a, query){
  const q = String(query || '').trim();
  if(!q) return [];
  const matches = [];
  const push = text => { if(text && !matches.includes(text)) matches.push(text); };
  if(a.title.includes(q)) push('命中标题');
  queryTokens(q).forEach(token=>{
    if(a.title.toLowerCase().includes(token)) push('命中标题');
    if(String(a.familyMember).toLowerCase().includes(token)) push('命中家庭成员');
    if((a.searchKeywords||[]).some(k=>String(k).toLowerCase().includes(token))) push('命中搜索关键');
    if((a.fields||[]).some(f=>String(f.k+' '+f.v).toLowerCase().includes(token))) push('命中字段');
    if((a.reminders||[]).some(r=>String(r.action+' '+r.date).toLowerCase().includes(token))) push('命中提醒');
    if(displayLocation(a).toLowerCase().includes(token)) push('命中记忆位置');
  });
  if(!matches.length && archiveSearchHit(a,q)) push('命中档案内容');
  return matches.slice(0,3);
}

function naturalAnswer(query){
  const q = String(query || '').replace(/\s/g,'').toLowerCase();
  let archive = null;
  let answer = null;
  let next = null;
  if(q.includes('洗衣') && q.includes('保修') && (q.includes('') || q.includes('位置') || q.includes('在哪'))){
    archive = state.archives.find(a=>a.id==='A001');
    const source = state.cameraSimulationComplete ? '来自空间线索采集 + AI 归位建议，并由保修卡字段交叉确认' : '来自手动记忆位置 + AI 归位建议，并由保修卡字段交叉确认';
    answer = `'${displayLocation(archive)}。保修到期日'${fieldGet(archive,'保修到期')}。`;
    next = '打开档案核对保修到期提醒';
    return answerObject(archive, answer, source, next);
  }
  if(q.includes('外婆') && q.includes('复诊')){
    archive = state.archives.find(a=>a.id==='A007');
    answer = `外婆下次复诊'${fieldGet(archive,'复诊日期')}，需要带 ${fieldGet(archive,'需携带')}。`;
    next = '复诊前一天整理材料并确认陪同人';
    return answerObject(archive, answer, '门诊病历、处方单、人工补充的复诊携带清单', next);
  }
  if(q.includes('车险') && (q.includes('续费') || q.includes('什么时'))){
    archive = state.archives.find(a=>a.id==='A004');
    answer = `车险 ${fieldGet(archive,'保期结束')} 到期，建 2026-07-05 前确认续费方案。`;
    next = '打开档案处理车险续费提醒';
    const source = state.cameraSimulationComplete ? '电子保单字段 + 玄关柜空间线索采集的票据盒线索' : '电子保单字段 + 初始记忆位置';
    return answerObject(archive, answer, source, next);
  }
  if(q.includes('入学') && (q.includes('') || q.includes('户口'))){
    archive = state.archives.find(a=>a.id==='A006');
    answer = '户口本复印件已齐，当前缺居住登记回执清晰页';
    next = '补拍回执页后把档案从待补资料恢复为已归档';
    return answerObject(archive, answer, '入学通知、户口本复印件人工确认记录、低置信度追溯记录', next);
  }
  return null;
}

function answerObject(archive, answer, evidence, next){
  if(archive) state.highlightedZone = archive.memoryZone;
  return {
    archive,
    direct: answer,
    hit: archive?.title || '未命中档',
    evidence,
    location: archive ? displayLocation(archive) : '无关联位',
    next
  };
}

function searchAnswerHTML(answer){
  if(!answer) return '';
  return `<div class="answer-card mb12">
    <div class="flex between gap12 wrap"><div><div class="tag warn">自然语言答案</div><div style="font-size:16px;font-weight:900;margin-top:8px">${esc(answer.direct)}</div></div>${answer.archive?`<button class="btn btn-primary btn-sm" data-open="${answer.archive.id}">打开命中档案</button>`:''}</div>
    <div class="answer-grid">
      <div class="answer-item"><span class="answer-k">命中档案</span><span class="answer-v">${esc(answer.hit)}</span></div>
      <div class="answer-item"><span class="answer-k">证据来源</span><span class="answer-v">${esc(answer.evidence)}</span></div>
      <div class="answer-item"><span class="answer-k">相关位置</span><span class="answer-v">${esc(answer.location)}</span></div>
      <div class="answer-item"><span class="answer-k">下一步动 /span><span class="answer-v">${esc(answer.next)}</span></div>
      <div class="answer-item"><span class="answer-k">空间联动</span><span class="answer-v">${answer.archive ? `${zoneName(answer.archive.memoryZone)} 已高亮` : ''}</span></div>
    </div>
  </div>`;
}

*/

function displayLocation(a){
  if(!a) return '未设置记忆位置';
  const zone = zoneName(a.memoryZone);
  if(a.locationPrivacy === 'hidden') return '隐私资料（不展示精确位置）';
  if(a.locationPrivacy === 'room_only') return `${zone}（精确容器已隐藏）`;
  if(shouldShowPrivacyToggle() && state.privacyMode && a.locationPrivacy !== 'public') return `${zone}（隐私模式隐藏容器）`;
  return `${zone} / ${a.memoryContainer || '未命名容器'}`;
}

function displayCameraLocation(result){
  if(!result) return '';
  if(result.privacy === 'hidden') return '隐私资料（位置已遮罩）';
  if(result.privacy === 'room_only' || (shouldShowPrivacyToggle() && state.privacyMode)) return `${zoneName(result.zone)}（精确容器已隐藏）`;
  return `${zoneName(result.zone)} / ${result.container}`;
}

function describeStoredLocation(location){
  if(!location || !location.memoryZone) return '未设置位置';
  if(location.locationPrivacy === 'hidden') return '隐私资料（位置已遮罩）';
  if(location.locationPrivacy === 'room_only') return `${zoneName(location.memoryZone)}（精确容器已隐藏）`;
  if(shouldShowPrivacyToggle() && state.privacyMode && location.locationPrivacy !== 'public') return `${zoneName(location.memoryZone)}（隐私模式隐藏容器）`;
  return `${zoneName(location.memoryZone)} / ${location.memoryContainer || '未命名容器'}`;
}

function recentCameraUpdateForArchive(id){
  const changed = state.lastCameraResult?.changed || [];
  return changed.find(item=>item.id === id) || null;
}

function scanValueSummaryHTML(summary){
  if(!summary || !summary.changed?.length) return '';
  const readyCount = summary.changed.filter(item=>{
    const archive = state.archives.find(a=>a.id === item.id);
    return archive && archiveEvidenceScore(archive) >= 70 && archiveServiceRoute(archive);
  }).length;
  const dueSoonCount = summary.changed.filter(item=>{
    const archive = state.archives.find(a=>a.id === item.id);
    const nearest = archive ? nearestReminder(archive) : null;
    return nearest && nearest.days <= 45;
  }).length;
  const exposure = summary.changed.reduce((sum,item)=>{
    const archive = state.archives.find(a=>a.id === item.id);
    return sum + (archive ? archiveExposureAmount(archive) : 0);
  },0);
  return `<div class="scan-value-summary">
    <div class="scan-value-head">
      <strong>为什么要做关联扫描</strong>
      <span>它不是为了看动画，而是为了把“这份资料到底放在哪、能不能立刻拿去处理事项”变成确定状态。</span>
    </div>
    <div class="scan-value-grid">
      <div><b>${summary.totalChanged}</b><span>份家庭档案从“靠记忆找”变成“可定位、可打开、可交接”</span></div>
      <div><b>${readyCount}</b><span>份档案已具备服务入口，可直接转续保、报修、报销或材料包</span></div>
      <div><b>${dueSoonCount}</b><span>项近期事项减少翻找成本，避免到期前才找不到凭证</span></div>
      <div><b>${formatMoneyShort(exposure)}</b><span>相关资产/责任金额被重新挂回空间，家庭价值不再散落</span></div>
    </div>
  </div>`;
}

function archiveHaystack(a){
  return [
    a.id,a.title,a.category,a.familyMember,a.date,a.amountOrTerm,a.sourceMaterial,a.rawType,a.rawPreview,a.handover,
    displayLocation(a), ...(a.searchKeywords||[]), ...(a.evidence||[]),
    ...(a.fields||[]).flatMap(field=>[field.k, field.v]),
    ...(a.events||[]).flatMap(event=>[event.date,event.type,event.desc,event.member,event.amount]),
    ...(a.reminders||[]).flatMap(reminder=>[reminder.date,reminder.action,reminder.status]),
    ...(a.operations||[]).flatMap(operation=>[operation.time,operation.action,operation.member]),
    a.ai?.type,a.ai?.reason,a.ai?.risk,a.ai?.location
  ].filter(Boolean).join(' ').toLowerCase();
}

function queryTokens(query){
  return String(query || '')
    .toLowerCase()
    .replace(/[，。？、；:：?]/g,' ')
    .split(/[\/\s]+/)
    .map(token=>token.trim())
    .filter(Boolean);
}

function archiveSearchHit(a, query){
  const q = String(query || '').trim().toLowerCase();
  if(!q) return true;
  const hay = archiveHaystack(a);
  const tokens = queryTokens(q);
  if(tokens.length > 1) return tokens.every(token=>tokenHit(hay, token));
  if(hay.includes(q)) return true;
  const known = ['洗衣','保修','爸爸','2026','外婆','复诊','7','车险','续费','入学','户口','缺什么','在哪','什么时候'];
  const pieces = known.filter(keyword=>q.includes(keyword));
  return pieces.length
    ? pieces.every(keyword=>['在哪','什么时候','缺什么'].includes(keyword) || hay.includes(keyword) || (keyword === '7' && hay.includes('2026-07')))
    : false;
}

function tokenHit(hay, token){
  if(hay.includes(token)) return true;
  const month = token.match(/^(\d{1,2})月?$/);
  if(month){
    const mm = month[1].padStart(2,'0');
    return hay.includes(`-${mm}-`) || hay.includes(`${Number(month[1])} 月`);
  }
  return false;
}

function getArchiveSearchMatches(a, query){
  const q = String(query || '').trim();
  if(!q) return [];
  const matches = [];
  const push = text => { if(text && !matches.includes(text)) matches.push(text); };
  if(a.title.includes(q)) push('命中标题');
  queryTokens(q).forEach(token=>{
    if(a.title.toLowerCase().includes(token)) push('命中标题');
    if(String(a.familyMember).toLowerCase().includes(token)) push('命中家庭成员');
    if((a.searchKeywords||[]).some(keyword=>String(keyword).toLowerCase().includes(token))) push('命中搜索关键字');
    if((a.fields||[]).some(field=>String(field.k+' '+field.v).toLowerCase().includes(token))) push('命中字段');
    if((a.reminders||[]).some(reminder=>String(reminder.action+' '+reminder.date).toLowerCase().includes(token))) push('命中提醒');
    if(displayLocation(a).toLowerCase().includes(token)) push('命中记忆位置');
  });
  if(!matches.length && archiveSearchHit(a,q)) push('命中档案内容');
  return matches.slice(0,3);
}

function naturalAnswer(query){
  const q = String(query || '').replace(/\s/g,'').toLowerCase();
  let archive = null;
  let answer = null;
  let next = null;
  if(q.includes('洗衣') && q.includes('保修') && (q.includes('位置') || q.includes('在哪'))){
    archive = state.archives.find(a=>a.id==='A001');
    const source = state.cameraSimulationComplete
      ? '来自书房空间线索采集、AI 归位建议和保修卡字段交叉确认'
      : '来自手动记忆位置、AI 归位建议和保修卡字段交叉确认';
    answer = `${displayLocation(archive)}。保修到期日是 ${fieldGet(archive,'保修到期')}。`;
    next = '打开档案核对保修到期提醒';
    return answerObject(archive, answer, source, next);
  }
  if(q.includes('外婆') && q.includes('复诊')){
    archive = state.archives.find(a=>a.id==='A007');
    answer = `外婆下次复诊是 ${fieldGet(archive,'复诊日期')}，需要带 ${fieldGet(archive,'需携带')}。`;
    next = '复诊前一天整理材料并确认陪同人';
    return answerObject(archive, answer, '门诊病历、处方单、检查单和人工补充的复诊携带清单', next);
  }
  if(q.includes('车险') && (q.includes('续费') || q.includes('什么时候'))){
    archive = state.archives.find(a=>a.id==='A004');
    answer = `车险 ${fieldGet(archive,'保期结束')} 到期，建议在 2026-07-05 前确认续费方案。`;
    next = '打开档案处理车险续费提醒';
    const source = state.cameraSimulationComplete ? '电子保单字段 + 玄关柜空间线索采集的票据盒线索' : '电子保单字段 + 初始记忆位置';
    return answerObject(archive, answer, source, next);
  }
  if(q.includes('入学') && (q.includes('缺') || q.includes('户口'))){
    archive = state.archives.find(a=>a.id==='A006');
    answer = '户口本复印件已齐，当前缺居住登记回执清晰页。';
    next = '补拍回执页后把档案从待补资料恢复为已归档';
    return answerObject(archive, answer, '入学通知、户口本复印件人工确认记录和低置信度追溯记录', next);
  }
  if((q.includes('报销') || q.includes('理赔') || q.includes('票据')) && (q.includes('缺') || q.includes('补件') || q.includes('提交'))){
    archive = state.archives.find(a=>a.id==='A009');
    answer = 'A009 当前缺费用清单第 2 页，票据金额还在待核，建议在 2026-07-08 前补齐后再提交报销。';
    next = '打开报销档案或进入报销材料包，先确认补件清单再授权提交';
    return answerObject(archive, answer, '门诊发票、支付小票、费用清单缺页记录和报销授权草案', next);
  }
  if(q.includes('协同台') || ((q.includes('服务商') || q.includes('合作方')) && !q.includes('工单') && !q.includes('sla') && !q.includes('编号'))){
    answer = `当前服务商协同台已经接入 ${SERVICE_PARTNERS.length} 类合作方，先看最小授权边界，再看工单编号、SLA 和回执字段。`;
    next = '进入家庭服务，分别查看维修、陪护、物业和理赔合作方的可见范围与回执要求';
    return answerObject(null, answer, `已配置合作方：${SERVICE_PARTNERS.map(item=>item.name).join(' / ')}`, next);
  }
  if(q.includes('工单') || q.includes('sla') || q.includes('编号') || q.includes('回执')){
    let kind = 'service-auth';
    archive = incidentArchive(activeIncident());
    if(q.includes('照护') || q.includes('复诊') || q.includes('老人')){ kind = 'care-plan'; archive = careArchive(); }
    if(q.includes('退租') || q.includes('押金') || q.includes('验房')){ kind = 'moveout-pack'; archive = moveoutArchive(); }
    if(q.includes('入学') || q.includes('学籍') || q.includes('补件')){ kind = 'school-pack'; archive = schoolArchive(); }
    if(q.includes('报销') || q.includes('理赔') || q.includes('票据')){ kind = 'claim-pack'; archive = claimArchive(); }
    const run = (state.serviceRuns || {})[kind] || null;
    const meta = serviceTicketMeta(kind, run);
    const sla = serviceRunSlaState(kind, run);
    answer = run
      ? `${serviceKindLabel(kind)}当前工单编号是 ${meta.jobId}，SLA 状态为${sla.label}，${sla.detail}。`
      : `${serviceKindLabel(kind)}当前还没有生成服务工单，先生成材料包后才会出现工单编号、SLA 和回执字段。`;
    next = run
      ? '进入家庭服务查看合作方、阶段状态和回执字段'
      : '进入家庭服务先生成对应服务单，再查看协同台中的工单编号和 SLA';
    return answerObject(
      archive,
      answer,
      run
        ? `合作方 ${meta.partner?.name || '家庭内部处理'}；回执字段 ${meta.receiptFields.join(' / ')}`
        : '服务运营台按“生成服务单 -> 家人确认 -> 服务回执”组织工单链路',
      next
    );
  }
  return null;
}

function answerObject(archive, answer, evidence, next){
  if(archive) state.highlightedZone = archive.memoryZone;
  return {
    archive,
    direct: answer,
    hit: archive?.title || '未命中档案',
    evidence,
    location: archive ? displayLocation(archive) : '无关联位置',
    next
  };
}

function searchAnswerHTML(answer){
  if(!answer) return '';
  return `<div class="answer-card mb12">
    <div class="flex between gap12 wrap"><div><div class="tag warn">自然语言答案</div><div style="font-size:16px;font-weight:900;margin-top:8px">${esc(answer.direct)}</div></div>${answer.archive?`<button class="btn btn-primary btn-sm" data-open="${answer.archive.id}">打开命中档案</button>`:''}</div>
    <div class="answer-grid">
      <div class="answer-item"><span class="answer-k">命中档案</span><span class="answer-v">${esc(answer.hit)}</span></div>
      <div class="answer-item"><span class="answer-k">证据来源</span><span class="answer-v">${esc(answer.evidence)}</span></div>
      <div class="answer-item"><span class="answer-k">相关位置</span><span class="answer-v">${esc(answer.location)}</span></div>
      <div class="answer-item"><span class="answer-k">下一步动作</span><span class="answer-v">${esc(answer.next)}</span></div>
      <div class="answer-item"><span class="answer-k">空间联动</span><span class="answer-v">${answer.archive ? `${zoneName(answer.archive.memoryZone)} 已高亮` : ''}</span></div>
    </div>
  </div>`;
}

function openReminderCount(a){
  return (a.reminders||[]).filter(r=>r.status!=='done' && daysUntil(r.date)>=0).length;
}

function zoneStats(){
  return SPACE_ZONES.filter(zone=>zone.id !== 'safe').map(zone=>{
    const archives = state.archives.filter(a=>a.memoryZone===zone.id);
    const incidentRisk = incidentIsOpen() && activeIncident().evidenceZone === zone.id ? 1 : 0;
    const riskCount = archives.filter(a=>a.riskLevel==='high' || a.status==='supplement' || a.status==='supplement_in_progress' || openReminderCount(a)>0 && (a.reminders||[]).some(r=>r.status!=='done' && daysUntil(r.date)<=45)).length + incidentRisk;
    const latest = archives.flatMap(a=>(a.operations||[]).map(o=>({...o, archive:a}))).sort((a,b)=>String(b.time).localeCompare(String(a.time)))[0];
    return {
      ...zone,
      count: archives.length,
      riskCount,
      recent: incidentRisk ? activeIncident().title : (latest ? `${latest.archive.title} · ${latest.action}` : '暂无动作')
    };
  });
}

function roomStats(){
  const zones = zoneStats();
  return FLOOR_ROOMS.map(room=>{
    const roomZones = zones.filter(z=>room.zones.includes(z.id));
    const zoneIds = new Set(room.zones);
    const archives = state.archives.filter(a=>zoneIds.has(a.memoryZone));
    const incidentRisk = incidentIsOpen() && activeIncident().floorRoom === room.id ? 1 : 0;
    const riskCount = roomZones.reduce((sum,z)=>sum + z.riskCount,0) + incidentRisk;
    const latest = archives.flatMap(a=>(a.operations||[]).map(o=>({...o, archive:a}))).sort((a,b)=>String(b.time).localeCompare(String(a.time)))[0];
    return {
      ...room,
      count: archives.length,
      riskCount,
      recent: incidentRisk ? activeIncident().title : (latest ? `${latest.archive.title} · ${latest.action}` : room.hint)
    };
  });
}

function activeRoomId(activeZone){
  const room = FLOOR_ROOMS.find(item=>item.zones.includes(activeZone));
  return room?.id || null;
}

function roomStatById(roomId){
  return roomStats().find(room=>room.id===roomId) || roomStats()[0];
}

function activeIncident(){
  return DEMO_INCIDENTS.find(item=>item.id === (state.activeIncidentId || DEMO_INCIDENTS[0].id)) || DEMO_INCIDENTS[0];
}

function incidentArchive(incident=activeIncident()){
  return state.archives.find(a=>incident.evidenceArchiveIds.includes(a.id)) || null;
}

function incidentIsOpen(){
  return state.incidentStatus !== 'done';
}

function incidentStatusText(){
  if(state.incidentStatus === 'done') return '已处理';
  if(state.incidentStatus === 'in_progress') return '处理中';
  return '待处理';
}

function incidentToneClass(){
  if(state.incidentStatus === 'done') return 'ok';
  if(state.incidentStatus === 'in_progress') return 'warn';
  return 'fail';
}

function homeOSValuePillars(){
  const incident = activeIncident();
  return [
    {
      id:'security',
      label:'家庭安全',
      title:'异常先发现',
      metric: incidentIsOpen() ? '1 个急需处理' : '0 个急需处理',
      body:`${incident.title} 被定位到 ${incident.room}，不再只是一条孤立告警。`,
      proof:'水浸、门锁、夜起路径和隐私遮罩共用同一套空间状态。'
    },
    {
      id:'asset',
      label:'家庭资产',
      title:'证据找得到',
      metric:`${state.archives.length} 份资产档案`,
      body:'家电、合同、保险、证照和医疗资料绑定到房间、存放点和责任人。',
      proof:'报修、理赔、退租、入学和复诊时能直接生成有据材料。'
    },
    {
      id:'risk',
      label:'家庭风险',
      title:'损失提前拦',
      metric:`${openRiskCount()} 个待处理`,
      body:'到期、缺资料、责任人缺失和服务延误被统一排进待办队列。',
      proof:'从“想起来再处理”变成“今天该做什么”的家庭运营机制。'
    },
    {
      id:'service',
      label:'家庭服务',
      title:'授权才外发',
      metric:'最小必要授权',
      body:'维修、安装、订阅和 B 端协作都从真实事件触发，不做泛广告。',
      proof:'服务方只看到故障、型号、保修状态和用户确认的联系方式。'
    }
  ];
}

function homeOSValueGridHTML(options={}){
  const compact = options.compact ? ' compact' : '';
  return `<section class="home-os-card${compact}" aria-label="家庭数字孪生操作系统能力">
    <div class="home-os-head">
      <div><strong>家庭数字孪生 OS</strong><span>把家庭安全、资产、风险和服务放进同一张可解释的家图谱。</span></div>
      <span class="tag brand">平台层</span>
    </div>
    <div class="home-os-grid">
      ${homeOSValuePillars().map(item=>`<div class="home-os-pillar ${esc(item.id)}">
        <b>${esc(item.label)}</b>
        <strong>${esc(item.title)}</strong>
        <em>${esc(item.metric)}</em>
        <span>${esc(compact ? item.body : item.proof)}</span>
      </div>`).join('')}
    </div>
  </section>`;
}

function paidPainPoints(){
  return [
    ['水浸/家电维修','避免漏水扩大、邻里赔付和售后扯皮','报修材料包 + 授权维修服务'],
    ['保险/理赔/退租','合同、票据和现场证据找不齐','有据材料包 + 证据链留痕'],
    ['老人复诊/夜起','家属不知道带什么、谁负责、何时跟进','AI 安心订阅 + 看护模式'],
    ['设备安装/房屋维护','不知道水浸、门锁、烟感该装在哪里','2D 蓝图布点 + 安装报价']
  ];
}

function paidPainPointsHTML(){
  return `<section class="card paid-pain-card"><div class="card-h"><span class="t">真实付费痛点</span><span class="sub">不是管理资料，而是减少损失、节省沟通、连接可信服务</span></div><div class="card-b">
    <div class="paid-pain-grid">
      ${paidPainPoints().map(([scene,pain,service])=>`<div>
        <strong>${esc(scene)}</strong>
        <span>${esc(pain)}</span>
        <em>${esc(service)}</em>
      </div>`).join('')}
    </div>
  </div></section>`;
}

function familyMemberById(id){
  return FAMILY_MEMBERS.find(item=>item.id === id) || FAMILY_MEMBERS[1];
}

function selectedFamilyMember(){
  return familyMemberById(state.memberFocus || 'lin');
}

function authorizationById(id){
  return AUTHORIZATION_SCOPES.find(item=>item.id === id) || AUTHORIZATION_SCOPES[0];
}

function selectedAuthorization(){
  return authorizationById(state.authorizationFocus || 'AUTH-002');
}

function authorizationForServiceDemo(kind){
  if(kind === 'care-plan') return authorizationById('AUTH-002');
  if(kind === 'service-auth') return authorizationById('AUTH-001');
  if(kind === 'moveout-pack') return authorizationById('AUTH-003');
  if(kind === 'school-pack') return authorizationById('AUTH-004');
  if(kind === 'claim-pack') return authorizationById('AUTH-005');
  return null;
}

function serviceTabForKind(kind, currentTab){
  const tabKinds = {
    '维修服务': ['risk-report', 'material-pack', 'service-auth', 'hardware-kit'],
    '照护服务': ['care-plan', 'subscription-plan', 'privacy-vault'],
    '理赔服务': ['claim-pack', 'moveout-pack'],
    '材料包': ['material-pack', 'school-pack', 'claim-pack', 'moveout-pack']
  };
  if(currentTab && tabKinds[currentTab] && tabKinds[currentTab].includes(kind)) return currentTab;
  for(const tab of Object.keys(tabKinds)){
    if(tabKinds[tab].includes(kind)) return tab;
  }
  return null;
}

function focusServiceDemo(kind){
  state.serviceDemo = kind;
  const tab = serviceTabForKind(kind, state.serviceTab);
  if(tab) state.serviceTab = tab;
  const auth = authorizationForServiceDemo(kind);
  if(auth) state.authorizationFocus = auth.id;
}

function careArchive(){
  return state.archives.find(item=>item.id === 'A007') || null;
}

function moveoutArchive(){
  return state.archives.find(item=>item.id === 'A002') || null;
}

function schoolArchive(){
  return state.archives.find(item=>item.id === 'A006') || null;
}

function claimArchive(){
  return state.archives.find(item=>item.id === 'A009') || null;
}

function authorizationStatusClass(tone){
  return tone === 'warn' ? 'warn' : tone === 'gray' ? 'gray' : 'brand';
}

function authorizationCardHTML(item){
  return `<article class="card">
    <div class="card-h">
      <span class="t">${esc(item.title)}</span>
      <span class="tag ${authorizationStatusClass(item.tone)}" style="margin-left:auto">${esc(item.status)}</span>
    </div>
    <div class="card-b">
      <div class="service-demo-rows">
        <div class="service-demo-row"><span>服务对象</span><strong>${esc(item.subject)}</strong></div>
        <div class="service-demo-row"><span>适用场景</span><strong>${esc(item.scenario)}</strong></div>
        <div class="service-demo-row"><span>生效时间</span><strong>${esc(item.time)}</strong></div>
        <div class="service-demo-row"><span>授权责任人</span><strong>${esc(item.owner)}</strong></div>
      </div>
      <div class="mt12">${authorizationBoundaryHTML(item)}</div>
      <div class="service-card-actions mt12">
        <button class="btn btn-outline btn-sm" data-auth-focus="${esc(item.id)}">查看详情</button>
        <button class="btn btn-outline btn-sm" data-service-demo-jump="${esc(item.serviceDemo)}">查看对应服务单</button>
        ${item.scenario.includes('复诊') ? `<button class="btn btn-primary btn-sm" data-home-scenario="elder-care">切换夜起关怀</button>` : ''}
      </div>
    </div>
  </article>`;
}

function authorizationBoundaryHTML(item){
  return `<section class="service-auth-boundary compact">
    <div class="service-auth-head">
      <div><strong>最小授权边界</strong><span>${esc(item.actions)}</span></div>
      <span class="tag warn">按房间 / 时间 / 对象生效</span>
    </div>
    <div class="service-boundary-grid">
      <div class="allow"><b>允许访问</b>${item.rooms.map(room=>`<span>${esc(room)}</span>`).join('')}${item.visible.map(v=>`<span>${esc(v)}</span>`).join('')}</div>
      <div class="deny"><b>不会披露</b>${item.hidden.map(v=>`<span>${esc(v)}</span>`).join('')}</div>
    </div>
  </section>`;
}

function selectedAuthorizationDetailHTML(item){
  return `<section class="card"><div class="card-h"><span class="t">授权详情</span><span class="sub">${esc(item.id)} · ${esc(item.subject)}</span></div><div class="card-b">
    <div class="service-demo-rows">
      <div class="service-demo-row"><span>授权目的</span><strong>${esc(item.reason)}</strong></div>
      <div class="service-demo-row"><span>适用场景</span><strong>${esc(item.scenario)}</strong></div>
      <div class="service-demo-row"><span>关联档案</span><strong>${esc(item.linkedArchiveId || '未绑定')}</strong></div>
      <div class="service-demo-row"><span>撤回规则</span><strong>${esc(item.revokeRule)}</strong></div>
      <div class="service-demo-row"><span>后续动作</span><strong>${esc(item.next)}</strong></div>
    </div>
    <div class="service-step-list mt12">
      ${item.auditTrail.map((step,i)=>`<div class="${i===0?'done':''}"><b>${i+1}</b><span>${esc(step)}</span></div>`).join('')}
    </div>
    <div class="service-card-actions mt12">
      <button class="btn btn-outline btn-sm" data-open="${esc(item.linkedArchiveId || 'A001')}">打开关联档案</button>
      <button class="btn btn-primary btn-sm" data-service-demo-jump="${esc(item.serviceDemo)}">进入服务单</button>
    </div>
  </div></section>`;
}

function viewMembers(){
  const member = selectedFamilyMember();
  const care = careArchive();
  const focusedAuth = selectedAuthorization();
  const activeAuthorizations = AUTHORIZATION_SCOPES.filter(item=>item.status !== '模板');
  return `<div class="grid">
    <section class="card today-hero"><div class="card-b">
      <div class="today-hero-main">
        <div>
          <div class="tag brand">家庭成员与权限</div>
          <h2>把谁负责什么、谁能看到什么、谁能代办什么，放进同一张家庭协作视图。</h2>
          <p>这不是账号设置页，而是家庭信任中台。成员角色、最小授权、照护交接和外部服务边界必须被清楚表达，否则 AI 和服务都无法真正进入家庭。</p>
        </div>
        <div class="today-actions">
          <button class="btn btn-primary btn-sm" data-service-demo-jump="care-plan">生成照护方案</button>
          <button class="btn btn-outline btn-sm" data-home-scenario="elder-care">切换夜起关怀</button>
          <button class="btn btn-outline btn-sm" data-jump="services">查看授权服务</button>
        </div>
      </div>
      <div class="today-kpi-row">
        <div><strong>${FAMILY_MEMBERS.length}</strong><span>已建模家庭成员与角色</span></div>
        <div><strong>${activeAuthorizations.length}</strong><span>待确认或草案中的授权单</span></div>
        <div><strong>1 条</strong><span>老人夜起与复诊照护闭环正在运行</span></div>
        <div><strong>${care ? 'A007' : '无'}</strong><span>当前照护核心档案编号</span></div>
      </div>
    </div></section>
    <div class="grid g-2">
      <section class="card"><div class="card-h"><span class="t">家庭角色面板</span><span class="sub">先把责任和边界讲清楚，再把服务放进来</span></div><div class="card-b">
        <div class="today-list">
          ${FAMILY_MEMBERS.map(item=>`<button class="today-row" data-member-focus="${esc(item.id)}">
            <span>
              <strong>${esc(item.name)} · ${esc(item.badge)}</strong>
              <em>${esc(item.responsibility)}</em>
            </span>
            <b class="tag ${item.id===member.id?'brand':'gray'}">${esc(item.role)}</b>
          </button>`).join('')}
        </div>
        <div class="mt12 card" style="box-shadow:none">
          <div class="card-b">
            <div class="tag ${member.role==='Owner'?'gold':member.role==='Manager'?'brand':'gray'}">${esc(member.badge)}</div>
            <div class="pain-list">
              <div class="pain-item"><div class="label">核心职责</div><div class="value">${esc(member.responsibility)}</div></div>
              <div class="pain-item"><div class="label">当前关注</div><div class="value">${esc(member.focus)}</div></div>
              <div class="pain-item"><div class="label">可见范围</div><div class="value">${esc(member.canView)}</div></div>
              <div class="pain-item"><div class="label">可执行动作</div><div class="value">${esc(member.canControl)}</div></div>
              <div class="pain-item"><div class="label">隐私规则</div><div class="value">${esc(member.privacyRule)}</div></div>
              <div class="pain-item"><div class="label">服务角色</div><div class="value">${esc(member.serviceRole)}</div></div>
            </div>
          </div>
        </div>
      </div></section>
      <section class="card"><div class="card-h"><span class="t">老人照护闭环</span><span class="sub">夜起、复诊、陪同和授权连成一条照护链</span></div><div class="card-b">
        <div class="notice info">${esc(CARE_WORKFLOW.headline)}</div>
        <div class="service-demo-rows mt12">
          ${CARE_WORKFLOW.stats.map(([k,v])=>`<div class="service-demo-row"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}
        </div>
        ${care ? `<div class="notice warn mt12">关联档案：${esc(care.id)} / ${esc(care.title)}。当前提醒的价值不是“多一个监控”，而是减少复诊前的沟通、漏带材料和陪同不清。</div>` : ''}
        <div class="service-step-list mt12">
          ${CARE_WORKFLOW.steps.map((step,i)=>`<div class="${i<3?'done':''}"><b>${i+1}</b><span><strong>${esc(step[0])}</strong> · ${esc(step[1])}</span></div>`).join('')}
        </div>
        <div class="service-card-actions mt12">
          <button class="btn btn-primary btn-sm" data-service-demo-jump="care-plan">生成照护方案</button>
          <button class="btn btn-outline btn-sm" data-jump="home">查看风险运营</button>
          <button class="btn btn-outline btn-sm" data-jump="library">查看照护资料位置</button>
        </div>
      </div></section>
    </div>
    <div class="grid g-2">
      <section class="card"><div class="card-h"><span class="t">当前授权单</span><span class="sub">服务前先说明白边界，服务后再回写结果</span></div><div class="card-b">
        <div class="grid g-2">
          ${AUTHORIZATION_SCOPES.map(item=>authorizationCardHTML(item)).join('')}
        </div>
      </div></section>
      <div class="grid">
        ${selectedAuthorizationDetailHTML(focusedAuth)}
        <section class="card"><div class="card-h"><span class="t">平台权限原则</span><span class="sub">默认本地、最小披露、授权可撤回</span></div><div class="card-b">
        <div class="risk-policy-list">
          <div><strong>1</strong><span>权限至少按房间、对象、动作、时间四个维度切分，不做“给了就全给”。</span></div>
          <div><strong>2</strong><span>老人医疗、儿童资料、合同证件默认只显示房间级或摘要级位置。</span></div>
          <div><strong>3</strong><span>外部服务看到的是任务上下文，不是完整家庭档案。</span></div>
          <div><strong>4</strong><span>每次查看、授权、确认和撤回都写入本地日志，便于家庭成员回看交接。</span></div>
        </div>
        <div class="mt12">${homeOSValueGridHTML({compact:true})}</div>
      </div></section>
      </div>
    </div>
  </div>`;
}

function homeScenarioById(id){
  return HOME_SCENARIOS.find(item=>item.id === id) || HOME_SCENARIOS[0];
}

function activeHomeScenario(){
  return homeScenarioById(state.activeHomeScenario || 'incident');
}

function scenarioStatusRows(scenario=activeHomeScenario()){
  const incident = activeIncident();
  const archive = incidentArchive(incident);
  if(scenario.id === 'away'){
    return [
      ['门锁','已上锁，入户门磁布防'],
      ['灯光','非必要灯光关闭，客厅进入低能耗'],
      ['传感器','水浸、门磁和玄关摄像头处于守护状态']
    ];
  }
  if(scenario.id === 'sleep'){
    return [
      ['卧室','睡眠舒适区保持安静'],
      ['客厅','灯光关闭，空调与插座降耗'],
      ['安全','门窗关闭，阳台水浸仍保留提醒']
    ];
  }
  if(scenario.id === 'elder-care'){
    return [
      ['路径','卧室到卫浴路径灯已点亮'],
      ['关怀','长时间未活动会生成子女提醒'],
      ['记录','夜起事件只记录状态，不采集真实画面']
    ];
  }
  if(scenario.id === 'incident'){
    return [
      ['空间风险',`${incident.room} · ${incident.device.locationLabel}`],
      ['AI 依据',incident.ai.why],
      ['证据档案',archive?.title || '待匹配']
    ];
  }
  return [
    ['安全','阳台风险、玄关门锁和敏感资料状态可见'],
    ['舒适','客厅、卧室、阳台采光和通风同步'],
    ['能耗','离家、睡眠和设备安装建议可继续展开']
  ];
}

function scenarioButtonHTML(id){
  const scenario = homeScenarioById(id);
  const active = activeHomeScenario().id === scenario.id;
  const cls = active ? `active ${scenario.className}` : scenario.className;
  return `<button class="home-mode ${cls}" data-home-scenario="${scenario.id}"><strong>${esc(scenario.title)}</strong><span>${esc(scenario.subtitle)}</span></button>`;
}

function scenarioModeGridHTML(){
  return HOME_SCENARIOS.map(item=>scenarioButtonHTML(item.id)).join('');
}

function scenarioTourChipsHTML(node=currentTourNode(), scenario=activeHomeScenario()){
  const lightOn = state.lightOn !== false;
  return `<div class="tour-status-chips">
    <span class="tour-state-chip room">${esc(node.room)}</span>
    <span class="tour-state-chip ${lightOn?'day':'night'}">${lightOn?'白天':'夜间'}</span>
    <span class="tour-state-chip ${state.windowOpen?'open':'closed'}">${state.windowOpen?'窗已开':'窗已关'}</span>
    <span class="tour-state-chip ${state.rightDoorOpen?'open':'closed'}">${state.rightDoorOpen?'门已开':'门已关'}</span>
    <span class="tour-state-chip ${scenario.id==='incident'?'closed':'open'}">${esc(scenario.title)}</span>
  </div>`;
}

function activateHomeScenario(id, options={}){
  const scenario = homeScenarioById(id);
  state.activeHomeScenario = scenario.id;
  state.assistantQuery = scenario.aiQuery || state.assistantQuery;
  if(scenario.apply){
    if(scenario.apply.lightOn !== undefined) state.lightOn = scenario.apply.lightOn;
    if(scenario.apply.windowOpen !== undefined) state.windowOpen = scenario.apply.windowOpen;
    if(scenario.apply.rightDoorOpen !== undefined) state.rightDoorOpen = scenario.apply.rightDoorOpen;
  }
  if(scenario.id === 'incident'){
    focusIncidentLocation(activeIncident());
  }else{
    state.tourNode = scenario.tourNode || state.tourNode;
    state.spaceFilter = scenario.zone || null;
    state.highlightedZone = scenario.zone || null;
    state.roomFilter = scenario.zone ? activeRoomId(scenario.zone) : null;
  }
  saveState();
  if(options.jumpToDashboard && state.currentView !== 'home') setView('home');
  else render();
  toast(`${scenario.title}已同步到空间视图`);
}

function scenarioHotspotsHTML(node, scenario=activeHomeScenario()){
  if(scenario.id === 'away'){
    const top = node.id === 'entry-node' ? 47 : 24;
    return `<button class="tour-hotspot-label scenario-hotspot automation" data-home-scenario="away" style="left:${node.id==='entry-node'?48:18}%;top:${top}%">门锁布防</button>
      <button class="tour-hotspot-label scenario-hotspot automation" data-home-scenario="away" style="left:${node.id==='living-node'?68:72}%;top:${node.id==='living-node'?62:35}%">低能耗</button>`;
  }
  if(scenario.id === 'sleep'){
    return `<button class="tour-hotspot-label scenario-hotspot sleep" data-home-scenario="sleep" style="left:${node.id==='bedroom-node'?47:74}%;top:${node.id==='bedroom-node'?54:34}%">睡眠舒适区</button>
      <button class="tour-hotspot-label scenario-hotspot sleep" data-home-scenario="sleep" style="left:${node.id==='living-node'?56:35}%;top:${node.id==='living-node'?64:58}%">客厅降耗</button>`;
  }
  if(scenario.id === 'elder-care'){
    return `<button class="tour-hotspot-label scenario-hotspot care" data-home-scenario="elder-care" style="left:${node.id==='bedroom-node'?42:70}%;top:${node.id==='bedroom-node'?58:36}%">夜起路径灯</button>
      <button class="tour-hotspot-label scenario-hotspot care" data-home-scenario="elder-care" style="left:${node.id==='bath-node'?46:84}%;top:${node.id==='bath-node'?56:50}%">卫浴到达点</button>`;
  }
  if(scenario.id === 'overview'){
    return `<button class="tour-hotspot-label scenario-hotspot overview" data-home-scenario="overview" style="left:50%;top:22%">全屋状态总览</button>`;
  }
  return '';
}

function scenarioSvgOverlay(scenario=activeHomeScenario()){
  if(scenario.id === 'away'){
    return `<g class="floor-scenario-overlay automation">
      <circle class="scenario-pulse" cx="104" cy="318" r="20"/>
      <path class="scenario-link" d="M104 318 C158 286 210 262 304 238"/>
      <text class="scenario-label" x="126" y="306">离家布防</text>
      <text class="scenario-mini" x="126" y="322">门锁 · 门磁 · 水浸守护</text>
    </g>`;
  }
  if(scenario.id === 'sleep'){
    return `<g class="floor-scenario-overlay sleep">
      <path class="scenario-link" d="M506 160 C456 184 404 210 304 238"/>
      <circle class="scenario-pulse" cx="506" cy="160" r="20"/>
      <text class="scenario-label" x="528" y="152">睡眠模式</text>
      <text class="scenario-mini" x="528" y="168">卧室舒适 · 客厅降耗</text>
    </g>`;
  }
  if(scenario.id === 'elder-care'){
    return `<g class="floor-scenario-overlay care">
      <path class="scenario-link" d="M506 160 C548 160 594 126 648 148"/>
      <circle class="scenario-pulse" cx="506" cy="160" r="18"/>
      <circle class="scenario-pulse" cx="648" cy="148" r="16"/>
      <text class="scenario-label" x="530" y="128">老人夜起路径</text>
      <text class="scenario-mini" x="530" y="144">卧室 → 卫浴 · 长时间未活动提醒</text>
    </g>`;
  }
  if(scenario.id === 'overview'){
    return `<g class="floor-scenario-overlay overview">
      <path class="scenario-link" d="M104 318 C216 242 390 214 506 160"/>
      <text class="scenario-label" x="348" y="236">全屋状态总览</text>
      <text class="scenario-mini" x="348" y="252">安全 · 舒适 · 能耗 · 待办</text>
    </g>`;
  }
  return '';
}

function incidentEvidenceText(incident=activeIncident()){
  const archives = incident.evidenceArchiveIds
    .map(id=>state.archives.find(a=>a.id===id))
    .filter(Boolean)
    .map(a=>a.title);
  return archives.length ? archives.join('、') : '证据档案待确认';
}

function incidentEventLocationText(incident=activeIncident()){
  return `${incident.room} · ${incident.device.locationLabel}`;
}

function incidentEvidenceLocationText(incident=activeIncident()){
  const archive = incidentArchive(incident);
  const archiveLabel = archive ? `${archive.id} / ${archive.title}` : incidentEvidenceText(incident);
  return `${archiveLabel} · ${zoneName(incident.evidenceZone)}`;
}

function incidentNextStepText(incident=activeIncident()){
  if(state.incidentStatus === 'done') return '处理记录已写入事件记录';
  if(state.incidentStatus === 'in_progress') return '继续处理事项 / 准备授权报修';
  return incident.ai.next.slice(0, 3).join(' / ');
}

function incidentPathRowsHTML(incident=activeIncident(), options={}){
  const compact = options.compact ? ' compact' : '';
  return `<div class="incident-path-flow${compact}" aria-label="当前事件处理路径">
    <div class="incident-path-row event"><b>发生点</b><span>${esc(incidentEventLocationText(incident))}</span></div>
    <div class="incident-path-row evidence"><b>证据</b><span>${esc(incidentEvidenceLocationText(incident))}</span></div>
    <div class="incident-path-row next"><b>下一步</b><span>${esc(incidentNextStepText(incident))}</span></div>
  </div>`;
}

function incidentChainStepsHTML(){
  const current = state.incidentStatus === 'done' ? 5 : state.incidentStatus === 'in_progress' ? 3 : 1;
  return ['3D 告警','AI 解释','2D 定位','处理事项','服务授权','档案沉淀'].map((step,i)=>`<span class="${i<=current?'done':''}">${esc(step)}</span>`).join('');
}

function incidentActionLabel(){
  if(state.incidentStatus === 'in_progress') return '查看处理事项';
  if(state.incidentStatus === 'done') return '查看事件记录';
  return '生成处理事项';
}

function focusIncidentLocation(incident=activeIncident()){
  state.activeIncidentId = incident.id;
  state.tourNode = incident.tourNode;
  state.libraryView = 'space';
  state.incidentFocus = true;
  state.highlightedZone = incident.evidenceZone;
  state.spaceFilter = null;
  state.roomFilter = incident.floorRoom;
}

function locateIncident2D(){
  focusIncidentLocation();
  saveState();
  setView('space');
}

function startIncidentHandling(options={}){
  const incident = activeIncident();
  const archive = incidentArchive(incident);
  if(!archive) return;
  state.incidentStatus = state.incidentStatus === 'done' ? 'done' : 'in_progress';
  focusIncidentLocation(incident);
  archive.riskLevel = 'high';
  archive.status = archive.status === 'supplement' ? 'supplement_in_progress' : archive.status;
  if(!archive.reminders.some(r=>r.id === incident.reminderId)){
    archive.reminders.unshift(rem(incident.reminderId, TODAY, '检查生活阳台排水并准备洗衣机保修材料', 'in_progress'));
  }else{
    const r = archive.reminders.find(item=>item.id === incident.reminderId);
    if(r.status === 'pending') r.status = 'in_progress';
  }
  if(!archive.events.some(e=>e.type === '水浸风险')){
    archive.events.push(ev(TODAY,'水浸风险','生活阳台水浸风险触发，AI 生成排水检查、保修材料和售后处理事项','系统',''));
  }
  if(!archive.operations.some(o=>o.action.includes(incident.title))){
    archive.operations.push(op(nowStr(),`生成处理事项：${incident.ai.next.join('、')}`,'AI 管家'));
  }
  archive.nextActions = mergeUniqueArray(archive.nextActions || [], incident.ai.next);
  saveState();
  if(options.jumpToRisk) setView('home');
  else render();
  toast('已生成水浸风险处理事项');
}

function completeIncidentIfNeeded(reminderId, archive){
  const incident = activeIncident();
  if(reminderId !== incident.reminderId || state.incidentStatus === 'done') return;
  state.incidentStatus = 'done';
  if(archive && !archive.events.some(e=>e.type === '风险处理完成')){
    archive.events.push(ev(TODAY,'风险处理完成','生活阳台水浸风险已完成现场检查和保修材料准备','当前用户',''));
    archive.operations.push(op(nowStr(),'完成生活阳台水浸风险处理闭环','当前用户'));
  }
}

/* Damaged space UI block disabled after encoding recovery.
function renderMemorySpace(options={}){
  const context = options.context || 'home';
  const compact = !!options.compact;
  const immersive = !!options.immersive;
  const libraryContext = context === 'library';
  const activeZone = options.activeZone || state.spaceFilter || state.highlightedZone;
  const stats = zoneStats();
  const rooms = roomStats();
  const activeRoom = activeRoomId(activeZone) || state.roomFilter || 'study-room';
  const focusRoom = roomStatById(activeRoom);
  const priority = context === 'home' ? highestPriority() : null;
  const showZoneRail = context !== 'library';
  const cameraDefaults = libraryContext
    ? { zoom:.84, rotate:0, tilt:0, panX:0, panY:0, mode:'top' }
    : { zoom:1, rotate:0, tilt:0, panX:0, panY:0, mode:'interior' };
  const camera = Object.assign({}, cameraDefaults, libraryContext ? (state.librarySpaceCamera || {}) : (state.spaceCamera || {}));
  const stageStyle = `transform:translate(calc(-50% + ${camera.panX}px), calc(-50% + ${camera.panY}px)) rotateX(${camera.tilt}deg) rotateZ(${camera.rotate}deg) scale(${camera.zoom});`;
  const spaceModeText = libraryContext ? '俯视平面' : (camera.mode==='top' ? '俯视定位' : '室内第一人称');
  const spaceHint = libraryContext ? '俯视平面'· 滚轮缩放 · 拖拽平移 · 点击区域筛' : '第一人称室内视角 · 滚轮缩放 · 拖拽平移 · 点击柜体筛';
  const tour = currentTourNode();
  const title = context === 'library' ? '家庭记忆空间' : '家庭记忆空间';
  const sub = context === 'home'
    ? '用虚构空间记录资料放在哪、哪些位置有风险、AI 最近如何归位'
    : '点击区域筛选档案；搜索命中时会高亮相关位置';
  if(immersive){
    return `<div class="card memory-card ${compact?'mb12':''} immersive-space">
      <div class="card-b">
        <div class="tour-workbench">
          ${aiTourStripHTML(tour, stats, priority)}
          <div class="tour-layout">
            ${tourSceneHTML(tour, stats)}
            ${spaceRiskPanelHTML(tour, stats)}
          </div>
          ${state.cameraPanelOpen ? cameraPanelHTML(true) : ''}
        </div>
      </div>
    </div>`;
  }
  return `<div class="card memory-card ${compact?'mb12':''} ${immersive?'immersive-space':''} ${libraryContext?'library-memory-card':''}">
    ${immersive ? '' : `<div class="card-h memory-head ${libraryContext?'library-memory-head':''}">
      <div><div class="memory-title">${title}</div><div class="memory-sub">${sub}</div></div>
    </div>`}
    <div class="card-b">
      ${priority && !immersive ? `<div class="filter-banner mb12"><span>当前最高优先级'{esc(priority.archive.title)} · ${esc(priority.title)} · ${esc(displayLocation(priority.archive))}</span><button class="btn btn-primary btn-sm" data-open="${priority.archive.id}">处理</button></div>` : ''}
      <div class="space-shell">
        ${immersive && camera.mode !== 'top' ? tourSceneHTML(tour, stats) : `<div class="space-map ${libraryContext?'library-space-map':''}">
          <div class="space-controls" aria-label="空间操作">
            <button class="space-control" data-space-cmd="zoom-in" title="放大">+</button>
            <button class="space-control" data-space-cmd="zoom-out" title="缩小">'/button>
            <button class="space-control" data-space-cmd="rotate-left" title="左旋">'/button>
            <button class="space-control" data-space-cmd="rotate-right" title="右旋">'/button>
            <button class="space-control ${camera.mode==='top'?'active':''}" data-space-cmd="toggle-mode" title="室内 / 俯视">'/button>
            <button class="space-control" data-space-cmd="reset" title="重置">'/button>
          </div>
          <div class="space-status">缩放 ${Math.round(camera.zoom*100)}%<br>视角 ${Math.round(camera.rotate)}°<br>${spaceModeText}</div>
          <div class="space-hint">${spaceHint}</div>
          <div class="floor-viewport" data-space-viewport data-space-context="${libraryContext?'library':'main'}">
            <div class="floor-stage" style="${stageStyle}">
              <div class="floor-shadow"></div>
              ${immersive && camera.mode !== 'top' ? interiorSceneSvg(stats, activeZone) : spaceSvg(stats, rooms, activeZone, activeRoom)}
            </div>
          </div>
          <div class="space-overlay ${libraryContext?'library-space-overlay':''}">
            <div class="room-focus">
            <div class="room-focus-title">${esc(focusRoom.name)} · ${esc(focusRoom.type)}</div>
            <div class="muted" style="font-size:11px;line-height:1.55;margin-top:5px">${esc(focusRoom.hint)}</div>
            <div class="room-focus-grid">
              <div><strong>${focusRoom.count}</strong><br>关联档案</div>
              <div><strong>${focusRoom.riskCount}</strong><br>风险事项</div>
            </div>
            </div>
          </div>
        </div>`}
        ${showZoneRail ? `<div class="space-side zone-rail">
          ${stats.map(s=>`<div class="zone-card ${activeZone===s.id?'active':''} ${s.scanHot?'scan-hot':''}" data-space-zone="${s.id}">
            <div class="top"><span class="name">${s.name}</span><span class="tag ${s.riskCount?'warn':'ok'}">${s.count} '/span></div>
            <div class="meta">风险 ${s.riskCount} '· ${privacyZoneHint(s.id)}</div>
            <div class="density-track"><i style="width:${Math.min(100, Math.max(14, s.count * 18 + s.riskCount * 12))}%"></i></div>
            <div class="last">${esc(s.recent)}</div>
          </div>`).join('')}
        </div>` : ''}
      </div>
    </div>
  </div>`;
}

function zoneArchives(zoneId, limit=3){
  if(!zoneId) return [];
  return state.archives.filter(a=>a.memoryZone === zoneId).slice(0, limit);
}

function librarySpaceOverviewHTML(stats, activeZone){
  const selected = activeZone ? stats.find(s=>s.id === activeZone) : null;
  const examples = zoneArchives(activeZone, 4);
  return `<div class="library-space-shell">
    <div class="library-space-stage">
      ${renderMemorySpace({context:'library', compact:true, activeZone})}
    </div>
    <aside class="library-space-panel">
      ${selected ? `<div class="library-space-heading">
        <div class="inspector-title">${esc(selected.name)}</div>
        <div class="inspector-sub">${selected.count} 份档'· 风险 ${selected.riskCount} '· ${privacyZoneHint(selected.id)}</div>
      </div>
      <div class="library-space-actions">
        <button class="btn btn-primary btn-sm" data-library-zone-list="${selected.id}">查看该区域档 /button>
        <button class="btn btn-outline btn-sm" data-clear-space-filter>清除选择</button>
      </div>
      <div class="library-zone-preview">
        ${examples.length ? examples.map(a=>`<button class="library-zone-row" data-open="${a.id}">
          <span>
            <strong>${esc(a.title)}</strong>
            <em>${esc(a.rawType)} · ${esc(a.familyMember)}</em>
          </span>
          <i class="${riskTag(a.riskLevel).c}">${riskTag(a.riskLevel).t}</i>
        </button>`).join('') : `<div class="library-space-empty">该区域暂无档案 /div>`}
      </div>` : `<div class="library-space-heading">
        <div class="inspector-title">先选择一个空间区 /div>
        <div class="inspector-sub">空间模式用于定位资料位置，不在初始态铺开所有档案卡 /div>
      </div>
      <div class="library-space-empty">点击右侧空间状态、地面区域或小地图节点后，再查看对应区域的档案 /div>`}
    </aside>
  </div>`;
}

function privacyZoneHint(zoneId){
  const hidden = state.archives.filter(a=>a.memoryZone===zoneId && a.locationPrivacy!=='public').length;
  return hidden ? `${hidden} 份隐藏精确位置` : '无敏感位';
}

*/

function renderMemorySpace(options={}){
  const context = options.context || 'home';
  const compact = !!options.compact;
  const immersive = !!options.immersive;
  const libraryContext = context === 'library';
  const activeZone = options.activeZone || state.spaceFilter || state.highlightedZone || (libraryContext ? 'living' : null);
  const stats = zoneStats();
  const rooms = roomStats();
  const activeRoom = options.activeRoom || state.roomFilter || activeRoomId(activeZone) || 'living-room';
  const focusRoom = roomStatById(activeRoom);
  const priority = context === 'home' ? highestPriority() : null;
  const showZoneRail = context !== 'library';
  const cameraDefaults = libraryContext
    ? { zoom:.84, rotate:0, tilt:0, panX:0, panY:0, mode:'top' }
    : { zoom:1, rotate:0, tilt:0, panX:0, panY:0, mode:'interior' };
  const camera = Object.assign({}, cameraDefaults, libraryContext ? (state.librarySpaceCamera || {}) : (state.spaceCamera || {}));
  const stageStyle = `transform:translate(calc(-50% + ${camera.panX}px), calc(-50% + ${camera.panY}px)) rotateX(${camera.tilt}deg) rotateZ(${camera.rotate}deg) scale(${camera.zoom});`;
  const spaceModeText = libraryContext ? '俯视平面图' : (camera.mode === 'top' ? '俯视定位' : '室内第一人称');
  const spaceHint = libraryContext ? '俯视平面图 · 默认 84% · 拖拽平移 · 点击区域筛选' : '室内第一人称视角 · 滚轮缩放 · 拖拽平移 · 点击柜体筛选';
  const tour = currentTourNode();
  const title = '家庭记忆空间';
  const sub = context === 'home'
    ? '资料位置、风险提醒和授权服务保持在同一个家庭事务视图里'
    : '俯视平面图用于定位资料位置，点击区域筛选档案';
  if(immersive){
    return `<div class="card memory-card ${compact?'mb12':''} immersive-space">
      <div class="card-b">
        <div class="tour-workbench">
          <div class="tour-layout">
            ${tourSceneHTML(tour, stats)}
          </div>
          ${homeTourDrawerHTML(tour, stats, priority)}
          ${aiTourStripHTML(tour, stats, priority)}
          ${state.cameraPanelOpen ? cameraPanelHTML(true) : ''}
        </div>
      </div>
    </div>`;
  }
  return `<div class="card memory-card ${compact?'mb12':''} ${libraryContext?'library-memory-card':''}">
    <div class="card-h memory-head ${libraryContext?'library-memory-head':''}">
      <div><div class="memory-title">${title}</div><div class="memory-sub">${sub}</div></div>
    </div>
    <div class="card-b">
      ${priority ? `<div class="filter-banner mb12"><span>当前最高优先级：${esc(priority.archive.title)} · ${esc(priority.title)} · ${esc(displayLocation(priority.archive))}</span><button class="btn btn-primary btn-sm" data-open="${priority.archive.id}">处理</button></div>` : ''}
      <div class="space-shell">
        <div class="space-map ${libraryContext?'library-space-map':''}">
          <div class="space-controls" aria-label="空间操作">
            <button class="space-control" data-space-cmd="zoom-in" title="放大">+</button>
            <button class="space-control" data-space-cmd="zoom-out" title="缩小">−</button>
            <button class="space-control" data-space-cmd="rotate-left" title="左旋">↺</button>
            <button class="space-control" data-space-cmd="rotate-right" title="右旋">↻</button>
            <button class="space-control ${camera.mode==='top'?'active':''}" data-space-cmd="toggle-mode" title="俯视 / 室内">⌂</button>
            <button class="space-control" data-space-cmd="reset" title="重置">⟲</button>
          </div>
          <div class="space-status">缩放 ${Math.round(camera.zoom*100)}%<br>视角 ${Math.round(camera.rotate)}°<br>${spaceModeText}</div>
          <div class="space-hint">${spaceHint}</div>
          <div class="floor-viewport" data-space-viewport data-space-context="${libraryContext?'library':'main'}">
            <div class="floor-stage" style="${stageStyle}">
              <div class="floor-shadow"></div>
              ${spaceSvg(stats, rooms, activeZone, activeRoom)}
            </div>
          </div>
          ${libraryContext ? '' : `<div class="space-overlay">
            <div class="room-focus">
              <div class="room-focus-title">${esc(focusRoom.name)} · ${esc(focusRoom.type)}</div>
              <div class="muted" style="font-size:11px;line-height:1.55;margin-top:5px">${esc(focusRoom.hint)}</div>
              <div class="room-focus-grid">
                <div><strong>${focusRoom.count}</strong><br>关联档案</div>
                <div><strong>${focusRoom.riskCount}</strong><br>风险事项</div>
              </div>
            </div>
          </div>`}
        </div>
        ${showZoneRail ? `<div class="space-side zone-rail">
          ${stats.map(s=>`<div class="zone-card ${activeZone===s.id?'active':''}" data-space-zone="${s.id}">
            <div class="top"><span class="name">${esc(s.name)}</span><span class="tag ${s.riskCount?'warn':'ok'}">${s.count} 份</span></div>
            <div class="meta">风险 ${s.riskCount} · ${privacyZoneHint(s.id)}</div>
            <div class="density-track"><i style="width:${Math.min(100, Math.max(14, s.count * 18 + s.riskCount * 12))}%"></i></div>
            <div class="last">${esc(s.recent)}</div>
          </div>`).join('')}
        </div>` : ''}
      </div>
    </div>
  </div>`;
}

function zoneArchives(zoneId, limit=3){
  if(!zoneId) return [];
  return state.archives.filter(a=>a.memoryZone === zoneId).slice(0, limit);
}

function libraryIncidentGuideHTML(incident=activeIncident()){
  const archive = incidentArchive(incident);
  return `<section class="library-incident-guide">
    <div class="incident-head">
      <div><strong>${esc(incident.title)}</strong><div class="inspector-sub">红点是事件发生点，金色资料点是证据存放点。</div></div>
      <span class="tag ${incidentToneClass()}">${incidentStatusText()}</span>
    </div>
    ${incidentPathRowsHTML(incident, {compact:true})}
    <div class="library-incident-legend" aria-label="蓝图图例">
      <span><i class="event"></i>水浸发生点</span>
      <span><i class="evidence"></i>证据存放点</span>
      <span><i class="link"></i>事件到证据链路</span>
    </div>
    <div class="library-space-actions">
      <button class="btn btn-primary btn-sm" data-incident-locate>定位水浸链路</button>
      ${archive ? `<button class="btn btn-outline btn-sm" data-open="${archive.id}">打开证据档案</button>` : ''}
      <button class="btn btn-outline btn-sm" data-jump="services">生成报修单</button>
    </div>
  </section>`;
}

function librarySpaceOverviewHTML(stats, activeZone){
  const incident = activeIncident();
  const incidentFocused = state.incidentFocus && state.roomFilter === incident.floorRoom;
  const selected = incidentFocused
    ? { id:'incident-balcony', name:'生活阳台', count:0, riskCount:1 }
    : (activeZone ? stats.find(s=>s.id === activeZone) : null);
  const examples = zoneArchives(activeZone, 4);
  const total = state.archives.length;
  return `<div class="library-space-shell">
    <div class="library-space-stage">
      ${renderMemorySpace({context:'library', compact:true, activeZone:activeZone || incident.evidenceZone || 'living', activeRoom:incidentFocused ? incident.floorRoom : undefined})}
    </div>
    <aside class="library-space-panel">
      ${incident ? libraryIncidentGuideHTML(incident) : ''}
      ${selected ? `<div class="library-space-heading">
        <div class="inspector-title">${esc(selected.name)}</div>
        <div class="inspector-sub">${incidentFocused ? '事件发生点 · 洗衣机排水口附近 · 证据在书房资料柜' : `当前区域预览 ${selected.count} 份 · 全库 ${total} 份 · 风险 ${selected.riskCount} · ${privacyZoneHint(selected.id)}`}</div>
      </div>
      <div class="notice info">${incidentFocused ? '红点表示生活阳台水浸发生点；金色点表示 A001 洗衣机保修档案在书房资料柜。点击证据点可直接打开档案。' : '空间模式只预览当前区域。需要看完整档案时，切到“档案列表”；需要只看当前区域时，点击“查看该区域档案”。'}</div>
      <div class="library-space-actions">
        ${incidentFocused ? `<button class="btn btn-primary btn-sm" data-incident-action>${incidentActionLabel()}</button>` : `<button class="btn btn-primary btn-sm" data-library-zone-list="${selected.id}">查看该区域档案</button>`}
        <button class="btn btn-outline btn-sm" data-library-view="list" data-library-clear="1">档案列表 ${total}</button>
        <button class="btn btn-outline btn-sm" data-clear-space-filter>清除选择</button>
      </div>
      <div class="library-zone-preview">
        ${examples.length ? examples.map(a=>`<button class="library-zone-row" data-open="${a.id}">
          <span>
            <strong>${esc(a.title)}</strong>
            <em>${esc(a.rawType)} · ${esc(a.familyMember)}</em>
          </span>
          <i class="${riskTag(a.riskLevel).c}">${riskTag(a.riskLevel).t}</i>
        </button>`).join('') : `<div class="library-space-empty">该区域暂无档案</div>`}
      </div>` : `<div class="library-space-heading">
        <div class="inspector-title">默认选中客厅</div>
        <div class="inspector-sub">俯视平面图用于定位资料与房间关系，全库 ${total} 份档案</div>
      </div>
      <div class="library-space-empty">点击平面图区域后查看对应档案。</div>`}
    </aside>
  </div>`;
}

function privacyZoneHint(zoneId){
  const hidden = state.archives.filter(a=>a.memoryZone===zoneId && a.locationPrivacy!=='public').length;
  return hidden ? `${hidden} 份隐藏精确位置` : '无敏感位置';
}

function currentTourNode(){
  return TOUR_NODES.find(node=>node.id===state.tourNode) || TOUR_NODES[0];
}

function homeTourDrawerHTML(node, stats, priority){
  return `<aside class="home-tour-drawer" aria-label="风险处置卡片">
    ${spaceRiskPanelHTML(node, stats)}
  </aside>`;
}

function aiTourStripHTML(node, stats, priority){
  const lightOn = state.lightOn !== false;
  const incident = activeIncident();
  const incidentOpen = incident && incidentIsOpen();
  const ops = [];
  if(incidentOpen) ops.push(`<button class="tour-chip primary" data-incident-action>${esc(incidentActionLabel())}</button>`);
  ops.push(`<button class="tour-chip" data-jump="services">服务入口</button>`);
  return `<div class="ai-tour-strip compact-controls" aria-label="3D 空间状态控制">
    <div class="ai-tour-meta">
      <button class="tour-top-action icon-only ${lightOn?'on':'off'}" data-tour-light-toggle title="${lightOn?'切换到夜间':'切换到白天'}" aria-label="${lightOn?'切换到夜间':'切换到白天'}" aria-pressed="${lightOn?'true':'false'}">
        <span class="light-icon"></span>
      </button>
      <button class="tour-top-action icon-only ${state.windowOpen?'open':'closed'}" data-tour-window-toggle title="${state.windowOpen?'关闭窗户':'打开窗户'}" aria-label="${state.windowOpen?'关闭窗户':'打开窗户'}" aria-pressed="${state.windowOpen?'true':'false'}">
        <span class="window-icon"></span>
      </button>
      <button class="tour-top-action icon-only ${state.rightDoorOpen?'open':'closed'}" data-tour-door-toggle title="${state.rightDoorOpen?'关闭右侧房门':'打开右侧房门'}" aria-label="${state.rightDoorOpen?'关闭右侧房门':'打开右侧房门'}" aria-pressed="${state.rightDoorOpen?'true':'false'}">
        <span class="door-icon"></span>
      </button>
      <button class="tour-top-action icon-only ai-camera-action ${state.cameraPanelOpen?'open':'closed'}" data-camera-panel title="${state.cameraPanelOpen?'收起空间采集':'打开空间采集'}" aria-label="${state.cameraPanelOpen?'收起空间采集':'打开空间采集'}">
        <span class="camera-icon"></span>
      </button>
    </div>
    <div class="ai-tour-ops">${ops.join('')}</div>
  </div>`;
}

function tourSceneHTML(node, stats){
  const active = stats.find(s=>s.id===node.zone) || stats[0];
  const exits = node.exits.map((exit,i)=>`<button class="tour-hotspot-label ${i===0 && active?.riskCount?'urgent':''}" data-tour-goto="${exit.to}" style="left:${exit.x*100}%;top:${exit.y*100}%">${esc(exit.label)}</button>`).join('');
  const incident = activeIncident();
  const scenario = activeHomeScenario();
  const incidentHotspot = incident && incidentIsOpen()
    ? `<button class="tour-hotspot-label incident-hotspot" data-incident-locate style="left:${node.id===incident.tourNode?'42':'52'}%;top:${node.id===incident.tourNode?'58':'31'}%">${node.id===incident.tourNode?'水浸风险':'阳台风险'}</button>`
    : '';
  const scenarioHotspots = scenarioHotspotsHTML(node, scenario);
  const lightOn = state.lightOn !== false;
  const doorToggle = node.id === 'living-node'
    ? `<button class="tour-hotspot-label door-toggle ${state.rightDoorOpen?'open':'closed'}" data-tour-door-toggle style="left:83%;top:49%" aria-pressed="${state.rightDoorOpen?'true':'false'}">${state.rightDoorOpen?'关门':'开门'}</button>`
    : '';
  return `<div class="space-map" data-tour-root>
    <div class="tour-canvas-wrap">
      <div class="tour-webgl" data-tour-webgl></div>
      <canvas class="tour-canvas" data-tour-canvas></canvas>
      <div class="tour-reticle"></div>
      <div class="tour-cinematic-overlay" data-tour-cinematic aria-hidden="true">
        <div class="tour-scan-beam"></div>
        <div class="tour-scan-lock"></div>
        <div class="tour-scan-readout">
          <strong data-scan-label>AI SCANNING</strong>
          <span data-scan-meta>SWEEP 00%</span>
        </div>
      </div>
      <div class="camera-hit-layer" data-camera-hit-layer></div>
      ${exits}
      ${incidentHotspot}
      ${scenarioHotspots}
      ${doorToggle}
      <div class="tour-minimap">
        <div style="font-size:11px;font-weight:900;margin-bottom:7px">家里位置</div>
        <div class="tour-map-grid">
          ${tourMiniMapRooms(node)}
        </div>
      </div>
    </div>
  </div>`;
}

function tourMiniMapRooms(node){
  const active = id => node.id===id ? ' active' : '';
  const dot = (id,x,y,label) => `<g class="clover-node${active(id)}" data-tour-goto="${id}" tabindex="0" role="button" aria-label="前往${label}">
    <circle cx="${x}" cy="${y}" r="5.5"/>
    <text x="${x}" y="${y-8}">${label}</text>
  </g>`;
  return `<svg class="clover-plan" viewBox="0 0 180 112" aria-label="四叶草户型漫游节点图">
    <defs>
      <filter id="cloverShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#000" flood-opacity=".22"/>
      </filter>
    </defs>
    <path class="clover-outline" d="M90 12c39 0 71 29 71 51s-32 37-71 37-71-15-71-37 32-51 71-51Z"/>
    <path class="clover-wing living${active('living-node')}" data-tour-goto="living-node" d="M58 45h64c6 0 10 4 10 10v30c0 6-4 10-10 10H58c-6 0-10-4-10-10V55c0-6 4-10 10-10Z"/>
    <path class="clover-wing entry${active('entry-node')}" data-tour-goto="entry-node" d="M16 68c0-13 11-24 25-24h23v51H41c-14 0-25-12-25-27Z"/>
    <path class="clover-wing study${active('study-node')}" data-tour-goto="study-node" d="M24 18h44c8 0 14 6 14 14v18H44c-12 0-22-10-22-22 0-4 1-7 2-10Z"/>
    <path class="clover-wing balcony${active('balcony-node')}" data-tour-goto="balcony-node" d="M65 12h50c7 0 12 5 12 12v20H53V24c0-7 5-12 12-12Z"/>
    <path class="clover-wing bedroom${active('bedroom-node')}" data-tour-goto="bedroom-node" d="M112 18h42c3 4 5 9 5 14 0 12-10 22-22 22h-39V32c0-8 6-14 14-14Z"/>
    <path class="clover-wing bath${active('bath-node')}" data-tour-goto="bath-node" d="M124 58h31c6 0 10 4 10 10v22c0 6-4 10-10 10h-31V58Z"/>
    <path class="clover-corridor" d="M44 72h30M74 72V51M74 51h32M90 45V24M106 51h31M122 72h18"/>
    <path class="clover-door" d="M48 72c8 0 14-6 14-14M75 51c0 8 6 14 14 14M98 45c0 7 5 12 12 12M122 58c8 0 13-5 13-13M122 80c7 0 12-5 12-12"/>
    ${dot('entry-node',41,77,'玄关')}
    ${dot('living-node',90,74,'客厅')}
    ${dot('study-node',51,34,'书房')}
    ${dot('balcony-node',90,29,'阳台')}
    ${dot('bedroom-node',133,37,'卧室')}
    ${dot('bath-node',145,80,'卫浴')}
  </svg>`;
}

function spaceRiskPanelHTML(node, stats){
  const risk = getRiskItems();
  const incident = activeIncident();
  const openMatters = risk.pending.length + risk.progress.length;
  const lightOn = state.lightOn !== false;
  return `<aside class="space-risk-panel" tabindex="0" aria-label="当前风险处置卡片">
    <div>
      <div class="inspector-title">当前只处理一件事</div>
      <div class="inspector-sub">${esc(node.room)} · ${incidentStatusText()} · ${lightOn?'白天采光':'夜间模式'} · ${state.windowOpen?'自然通风':'窗户关闭'}</div>
    </div>
    ${incident ? `<section class="incident-decision-card ${incidentToneClass()}">
      <div class="incident-head">
        <div><strong>${esc(incident.title)}</strong><div class="inspector-sub">${esc(incident.device.name)} · ${esc(incident.device.locationLabel)}</div></div>
        <span class="tag ${incidentToneClass()}">${incidentStatusText()}</span>
      </div>
      <div class="incident-copy">${esc(incident.ai.what)}</div>
      ${incidentPathRowsHTML(incident, {compact:true})}
      <div class="incident-detail">
        <div><b>AI 依据</b>${esc(incident.ai.why)}</div>
        <div><b>影响范围</b>${esc(incident.ai.impact)}</div>
      </div>
      <div class="incident-actions">
        <button class="btn btn-primary btn-sm" data-incident-locate>查看 2D 定位</button>
        <button class="btn btn-primary btn-sm" data-incident-action>${incidentActionLabel()}</button>
      </div>
    </section>` : ''}
    <div class="incident-mini-actions" aria-label="解释和沉淀入口">
      <button data-jump="home"><strong>AI 解释依据</strong><span>空间状态 + 保修档案 + 历史维修记录</span></button>
      <button data-jump="timeline"><strong>事件记录</strong><span>处理、报修和授权会留痕</span></button>
    </div>
    <details class="home-secondary-panel">
      <summary><span>报修和授权扩展</span><b>用户确认后生成</b></summary>
      <div class="home-secondary-body">
        <div class="home-state-grid primary" aria-label="水浸服务入口">
          <button data-jump="services"><strong>报修</strong><span>材料</span></button>
          <button data-jump="services"><strong>授权</strong><span>边界</span></button>
          <button data-jump="timeline"><strong>记录</strong><span>沉淀</span></button>
        </div>
      </div>
    </details>
  </aside>`;
}

function spaceSvg(stats, rooms, activeZone, activeRoom){
  const get = id => stats.find(s=>s.id===id) || {};
  const roomGet = id => rooms.find(r=>r.id===id) || {};
  const roomCls = id => `room-shape ${activeRoom===id?'is-active':''}`;
  const pinCls = id => `storage-pin ${activeZone===id?'is-active':''}`;
  const incident = activeIncident();
  const showIncident = !!incident;
  const incidentX = showIncident ? 216 + 384 * incident.incidentPoint.x : 0;
  const incidentY = showIncident ? 12 + 40 * incident.incidentPoint.y : 0;
  const incidentArchiveRecord = showIncident ? incidentArchive(incident) : null;
  const evidenceX = 282;
  const evidenceY = 150;
  const scenarioOverlay = scenarioSvgOverlay();
  const incidentMarker = showIncident ? `<g class="floor-incident-marker ${state.incidentStatus}" data-incident-locate>
      <path class="incident-link" d="M${incidentX} ${incidentY+10} C340 72 306 112 ${evidenceX} ${evidenceY}"/>
      <circle class="incident-halo" cx="${incidentX}" cy="${incidentY}" r="17"/>
      <circle class="incident-core" cx="${incidentX}" cy="${incidentY}" r="7"/>
      <text class="incident-label" x="${incidentX+18}" y="${Math.max(22, incidentY+5)}">${state.incidentStatus==='done'?'水浸已处理':'水浸风险'}</text>
    </g>` : '';
  const evidenceMarker = showIncident ? `<g class="floor-evidence-marker" ${incidentArchiveRecord ? `data-open="${esc(incidentArchiveRecord.id)}"` : `data-space-zone="${esc(incident.evidenceZone)}"`} tabindex="0" role="button" aria-label="打开水浸证据档案">
      <circle class="evidence-halo" cx="${evidenceX}" cy="${evidenceY}" r="18"/>
      <circle class="evidence-core" cx="${evidenceX}" cy="${evidenceY}" r="7"/>
      <text class="evidence-label" x="${evidenceX+18}" y="${evidenceY+22}">证据档案</text>
    </g>` : '';
  const roomLabel = (id,x,y) => {
    const r = roomGet(id);
    return `<text x="${x}" y="${y}" class="room-label">${r.name}</text><text x="${x}" y="${y+17}" class="room-mini">${r.count || 0} 档案 · ${r.riskCount || 0} 风险</text>`;
  };
  const pin = (id,x,y,label) => {
    const s = get(id);
    return `<g class="${pinCls(id)}" data-space-zone="${id}" transform="translate(${x} ${y})">
      <circle r="12" fill="#fff7df" stroke="#d9a441" stroke-width="4"/>
      <circle r="4" fill="#1c5f54"/>
      <text x="16" y="-4" class="pin-label">${label}</text>
      <text x="16" y="9" class="room-mini">${s.count || 0} 份档案 · ${s.riskCount || 0} 风险</text>
    </g>`;
  };
  return `<svg data-scene-mode="floorplan" viewBox="0 0 734 410" preserveAspectRatio="xMidYMid meet" aria-label="三室一厅家庭记忆空间">
    <g transform="translate(0 20)">
    <path d="M18 358h698l-26 26H42Z" class="wall-face"/>
    <path d="M716 12v346l-26 26V38Z" class="wall-face"/>
    <rect x="18" y="12" width="698" height="346" rx="10" fill="#f8f1e5"/>
    <path d="M18 12h698v346H18Z" class="outer-wall"/>
    <path d="M18 12h698l-26 26H42Z" class="wall-top"/>
    <path d="M18 12v346l24 26V38Z" class="wall-face"/>
    <path d="M214 12v160M394 54v286M600 12v170M214 226H18M394 182h322M518 182v176M632 182v176M214 54h502M166 226v132" class="wall-line"/>
    <path d="M34 228h132v112H34z" class="${roomCls('entry-room')}" data-room-zone="entry-room" fill="#d8c49a" stroke="#b69a58"/>
    <path d="M34 68h180v158H34z" class="${roomCls('utility-room')}" data-room-zone="utility-room" fill="#ead6bc" stroke="#c6a77d"/>
    <path d="M216 68h178v104H216z" class="${roomCls('study-room')}" data-room-zone="study-room" fill="#b9d3c7" stroke="#8fb9aa"/>
    <path d="M396 54h204v128H396z" class="${roomCls('master-room')}" data-room-zone="master-room" fill="#d7c4d8" stroke="#ae93b1"/>
    <path d="M602 54h98v128H602z" class="${roomCls('bath-room')}" data-room-zone="bath-room" fill="#d8e2e6" stroke="#9ab0ba"/>
    <path d="M168 174h226v166H168z" class="${roomCls('living-room')}" data-room-zone="living-room" fill="#c9d7e0" stroke="#90aabc"/>
    <path d="M396 184h122v156H396z" class="${roomCls('kid-room')}" data-room-zone="kid-room" fill="#e6d7a6" stroke="#c6a45b"/>
    <path d="M520 184h112v156H520z" class="${roomCls('elder-room')}" data-room-zone="elder-room" fill="#dec9c0" stroke="#b89589"/>
    <path d="M216 12h384v40H216z" class="${roomCls('balcony')}" data-room-zone="balcony" fill="#dbe8d8" stroke="#aac3a6"/>

    <path d="M166 264a42 42 0 0 1 42 42" class="door-swing"/>
    <path d="M214 132a38 38 0 0 0 38 38" class="door-swing"/>
    <path d="M394 122a38 38 0 0 1-38 38" class="door-swing"/>
    <path d="M518 224a36 36 0 0 0-36-36" class="door-swing"/>
    <path d="M600 118a34 34 0 0 0 34 34" class="door-swing"/>

    ${floorFurnitureSvg()}
    <path d="M312 52 C315 90 318 130 305 160 C291 192 256 206 252 238" class="route-line"/>
    <path d="M100 282 C150 280 195 264 244 250 C316 230 396 226 456 236" class="route-line"/>
    ${scenarioOverlay}

    ${roomLabel('entry-room',52,246)}
    ${roomLabel('utility-room',56,88)}
    ${roomLabel('study-room',232,84)}
    ${roomLabel('master-room',414,78)}
    ${roomLabel('bath-room',616,76)}
    ${roomLabel('living-room',190,198)}
    ${roomLabel('kid-room',412,204)}
    ${roomLabel('elder-room',536,204)}
    ${roomLabel('balcony',232,38)}

    ${incidentMarker}
    ${pin('entry',104,318,'玄关')}
    ${pin('study',282,150,'资料')}
    ${evidenceMarker}
    ${pin('living',304,314,'客厅抽屉')}
    ${pin('bedroom',506,160,'卧室收纳')}
    </g>
  </svg>`;
}

function floorFurnitureSvg(){
  return `
    <g class="floor-furniture" aria-hidden="true">
      <g class="entry-plan">
        <rect x="52" y="248" width="40" height="72" rx="5" class="furniture" style="fill:#c89b61"/>
        <path d="M60 264h24M60 282h24M60 300h24" stroke="#7d6042" stroke-width="2"/>
        <rect x="106" y="248" width="42" height="22" rx="4" class="furniture" style="fill:#8d6b4b"/>
        <path d="M111 276c12 5 25 5 36 0" stroke="#7d6042" stroke-width="2" fill="none"/>
      </g>

      <g class="utility-plan">
        <rect x="54" y="88" width="54" height="118" rx="5" class="furniture" style="fill:#c9a66c"/>
        <path d="M62 110h38M62 136h38M62 162h38M62 188h38" stroke="#7d6042" stroke-width="2"/>
        <rect x="126" y="94" width="54" height="78" rx="5" class="furniture" style="fill:#d6c0a1"/>
        <path d="M136 112h34M136 132h34M136 152h34" stroke="#8b6b4e" stroke-width="2"/>
        <rect x="126" y="184" width="66" height="24" rx="5" class="furniture" style="fill:#8d6b4b"/>
        <circle cx="68" cy="214" r="6" fill="#9a6f49"/><circle cx="94" cy="214" r="6" fill="#9a6f49"/>
      </g>

      <g class="study-plan">
        <rect x="232" y="84" width="46" height="78" rx="5" class="furniture" style="fill:#84a696"/>
        <path d="M240 100h30M240 118h30M240 136h30" stroke="#5b7f70" stroke-width="2"/>
        <rect x="296" y="92" width="78" height="30" rx="5" class="furniture" style="fill:#a77b4f"/>
        <rect x="316" y="128" width="22" height="26" rx="4" fill="#5d6b68" stroke="#4f5c59"/>
        <rect x="314" y="82" width="38" height="7" rx="2" fill="#25312e"/>
      </g>

      <g class="master-plan">
        <rect x="422" y="82" width="88" height="72" rx="7" class="furniture" style="fill:#e8dce8"/>
        <rect x="432" y="92" width="30" height="18" rx="5" fill="#fffdfa" stroke="#cfbed0"/>
        <rect x="468" y="92" width="30" height="18" rx="5" fill="#fffdfa" stroke="#cfbed0"/>
        <rect x="432" y="122" width="66" height="24" rx="8" fill="#d7c4d8" stroke="#bda6bf"/>
        <rect x="530" y="74" width="46" height="88" rx="5" class="furniture" style="fill:#c9b5c8"/>
        <path d="M553 78v80M536 118h34" stroke="#9b7fa0" stroke-width="2"/>
      </g>

      <g class="bath-plan">
        <rect x="614" y="76" width="68" height="46" rx="6" class="furniture" style="fill:#f4f7f6"/>
        <rect x="628" y="86" width="28" height="16" rx="6" fill="#cde0df" stroke="#9ab0ba"/>
        <circle cx="648" cy="148" r="19" class="furniture" style="fill:#f8fbf9"/>
        <circle cx="648" cy="148" r="10" fill="#d6e4e2" stroke="#9ab0ba"/>
        <rect x="666" y="128" width="18" height="42" rx="3" fill="#bcd6d7" opacity=".75" stroke="#91acaf"/>
      </g>

      <g class="living-plan">
        <rect x="190" y="214" width="104" height="50" rx="8" class="furniture" style="fill:#7f918a"/>
        <rect x="190" y="204" width="104" height="18" rx="7" fill="#70827b"/>
        <rect x="190" y="258" width="30" height="52" rx="7" fill="#65766f"/>
        <rect x="238" y="270" width="58" height="32" rx="14" class="furniture" style="fill:#e5d4b7"/>
        <rect x="314" y="210" width="54" height="92" rx="6" class="furniture" style="fill:#9fb8c8"/>
        <rect x="322" y="220" width="38" height="26" rx="3" fill="#1f2422"/>
        <circle cx="266" cy="302" r="23" fill="#d8c7ad" stroke="#b9aa98" stroke-width="2"/>
      </g>

      <g class="kid-plan">
        <rect x="418" y="204" width="74" height="54" rx="7" class="furniture" style="fill:#fff0c5"/>
        <rect x="428" y="212" width="24" height="14" rx="4" fill="#fffdfa" stroke="#dbc98c"/>
        <rect x="428" y="278" width="72" height="34" rx="5" class="furniture" style="fill:#a77b4f"/>
        <rect x="454" y="265" width="22" height="22" rx="4" fill="#9fb47e"/>
      </g>

      <g class="elder-plan">
        <rect x="536" y="212" width="72" height="58" rx="7" class="furniture" style="fill:#e6d6cf"/>
        <rect x="548" y="222" width="24" height="14" rx="4" fill="#fffdfa" stroke="#c8aaa0"/>
        <circle cx="574" cy="300" r="18" class="furniture" style="fill:#9fb47e"/>
        <rect x="594" y="288" width="20" height="32" rx="5" class="furniture" style="fill:#c9b5a8"/>
      </g>

      <g class="balcony-plan">
        <rect x="244" y="22" width="38" height="24" rx="6" class="furniture" style="fill:#edf0ed"/>
        <circle cx="263" cy="34" r="8" fill="#9fbfc1" stroke="#6f9699"/>
        <path d="M312 28h208" stroke="#5c6864" stroke-width="3" stroke-linecap="round"/>
        <rect x="352" y="31" width="20" height="17" rx="3" fill="#fff3cf" stroke="#dcc37a"/>
        <rect x="386" y="31" width="22" height="17" rx="3" fill="#dbe8d0" stroke="#aac3a6"/>
      </g>
    </g>`;
}

function zoneRiskClass(stat){
  if(!stat || !stat.riskCount) return 'risk-none';
  if(incidentIsOpen() && activeIncident().evidenceZone === stat.id) return 'risk-urgent';
  if(stat.id === 'entry' || stat.riskCount >= 3) return 'risk-urgent';
  if(stat.riskCount >= 2) return 'risk-high';
  return 'risk-medium';
}

function interiorSceneSvg(stats, activeZone){
  const get = id => stats.find(s=>s.id===id) || {};
  const cls = id => `scene-zone ${zoneRiskClass(get(id))} ${activeZone===id?'is-active':''}`;
  const label = (id,x,y,title) => {
    const s = get(id);
    return `<text x="${x}" y="${y}" class="scene-label">${title}</text><text x="${x}" y="${y+17}" class="scene-mini">${s.count || 0} 档案 · ${s.riskCount || 0} 风险</text>`;
  };
  const light = (id,x,y) => {
    const risk = zoneRiskClass(get(id));
    return `<circle cx="${x}" cy="${y}" r="18" class="risk-halo ${risk}" fill="${risk==='risk-urgent'?'#d33b32':risk==='risk-high'?'#a63b32':risk==='risk-medium'?'#d9a441':'#287a4c'}"/><circle cx="${x}" cy="${y}" r="8" class="risk-light ${risk}"/>`;
  };
  return `<svg data-scene-mode="interior" viewBox="0 0 1120 680" preserveAspectRatio="xMidYMid meet" aria-label="第一人称室内家庭记忆空间">
    <defs>
      <linearGradient id="wallGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f7efe3"/><stop offset="1" stop-color="#e7d8c5"/></linearGradient>
      <linearGradient id="floorGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d6c1a5"/><stop offset="1" stop-color="#8e755f"/></linearGradient>
      <linearGradient id="woodFront" x1="0" x2="1"><stop offset="0" stop-color="#b99764"/><stop offset="1" stop-color="#7c5f3c"/></linearGradient>
      <linearGradient id="cabinetFront" x1="0" x2="1"><stop offset="0" stop-color="#c8dfd5"/><stop offset="1" stop-color="#6e9c8b"/></linearGradient>
    </defs>
    <rect width="1120" height="680" fill="#eadccc"/>
    <polygon points="0,0 330,132 330,430 0,680" fill="#e2d0bc"/>
    <polygon points="1120,0 790,132 790,430 1120,680" fill="#d8c7b4"/>
    <polygon points="330,132 790,132 790,430 330,430" fill="url(#wallGrad)"/>
    <polygon points="0,680 330,430 790,430 1120,680" fill="url(#floorGrad)"/>
    <polygon points="0,0 330,132 790,132 1120,0" fill="#f6efe5"/>
    <path d="M330 132h460M330 430h460M330 132 0 0M790 132 1120 0M330 430 0 680M790 430 1120 680" stroke="rgba(72,62,52,.35)" stroke-width="3"/>
    <path d="M126 584 C285 488 398 440 560 430 C721 440 835 488 994 584" fill="none" stroke="rgba(255,255,255,.24)" stroke-width="12"/>
    <path d="M244 522 C384 462 455 440 560 430 C666 440 736 462 876 522" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="8"/>
  <text x="434" y="104" class="scene-wall-label">家庭风险运营空间</text>

    <g class="${cls('study')}" data-space-zone="study">
      <polygon points="378,162 610,142 620,402 364,428" class="scene-object" fill="url(#cabinetFront)"/>
      <polygon points="610,142 662,166 676,394 620,402" fill="#5f8d80" stroke="#476b61" stroke-width="2"/>
      <polygon points="378,162 430,185 676,166 610,142" fill="#d9eee7" stroke="#8fb9aa" stroke-width="2"/>
      <path d="M405 212h174M407 258h176M409 304h176M411 350h176" stroke="#477567" stroke-width="8" stroke-linecap="round"/>
      <rect x="438" y="222" width="96" height="24" rx="4" fill="#fffdfa" opacity=".8"/>
      <rect x="452" y="314" width="118" height="24" rx="4" fill="#fffdfa" opacity=".8"/>
      ${light('study',620,170)}
      ${label('study',398,454,'书房资料')}
    </g>

    <g class="${cls('entry')}" data-space-zone="entry">
      <polygon points="82,296 248,258 266,528 64,588" class="scene-object" fill="url(#woodFront)"/>
      <polygon points="248,258 310,286 330,520 266,528" fill="#765836" stroke="#5c432a" stroke-width="2"/>
      <polygon points="82,296 146,324 310,286 248,258" fill="#d4b27b" stroke="#8e6f45" stroke-width="2"/>
      <path d="M104 366h142M108 420h146M112 476h150" stroke="#5a4025" stroke-width="7" stroke-linecap="round"/>
      <rect x="130" y="324" width="74" height="30" rx="5" fill="#fff7df" opacity=".85"/>
      ${light('entry',270,300)}
      ${label('entry',78,620,'玄关')}
    </g>

    <g class="${cls('living')}" data-space-zone="living">
      <polygon points="678,294 870,268 918,490 700,532" class="scene-object" fill="#b7cbd7"/>
      <polygon points="870,268 946,300 1000,496 918,490" fill="#7e9bab" stroke="#5d7888" stroke-width="2"/>
      <polygon points="678,294 756,326 946,300 870,268" fill="#d2e2ea" stroke="#8aa6b7" stroke-width="2"/>
      <path d="M714 370h166M724 424h176" stroke="#5f7988" stroke-width="8" stroke-linecap="round"/>
      <rect x="744" y="333" width="92" height="28" rx="5" fill="#fffdfa" opacity=".82"/>
      ${light('living',906,300)}
      ${label('living',704,566,'客厅抽屉')}
    </g>

    <g class="${cls('bedroom')}" data-space-zone="bedroom">
      <polygon points="764,150 928,176 924,336 744,318" class="scene-object" fill="#d9c5db"/>
      <polygon points="928,176 982,210 980,340 924,336" fill="#9e80a4" stroke="#795d7e" stroke-width="2"/>
      <polygon points="764,150 820,184 982,210 928,176" fill="#ead8ec" stroke="#b997bd" stroke-width="2"/>
      <rect x="790" y="204" width="98" height="70" rx="8" fill="#fffdfa" opacity=".78"/>
      <path d="M778 292h126" stroke="#7d5f83" stroke-width="8" stroke-linecap="round"/>
      ${light('bedroom',948,206)}
      ${label('bedroom',742,366,'卧室收纳')}
    </g>

  </svg>`;
}

function cameraPanelHTML(overlay=false){
  const running = state.cameraStage === 'running';
  const done = state.cameraSimulationComplete;
  return `<div class="camera-panel ${overlay?'camera-overlay':''}">
    <div class="flex between center gap12 wrap">
      <div><div style="font-weight:900">空间线索采集</div><div class="muted" style="font-size:12px">只处理用户确认的空间线索，敏感位置默认遮罩。</div></div>
      <button class="btn btn-primary btn-sm" data-camera-start ${running?'disabled':''}>${done?'重新采集线索':'开始采集线索'}</button>
    </div>
    <div class="camera-grid mt12">
      ${CAMERA_RESULTS.slice(0,3).map(result=>cameraFeedHTML(result)).join('')}
    </div>
    <div class="ai-steps">
      ${CAMERA_STEPS.map((step,i)=>`<div class="ai-step ${done || state.cameraStep>i?'done':(state.cameraStep===i?'active':'')}">${step}</div>`).join('')}
    </div>
    <div class="camera-summary">
      ${CAMERA_RESULTS.map(result=>`<div><strong>${result.camera}</strong><br>${done ? `${displayCameraLocation(result)} · ${Math.round(result.confidence*100)}%<br>${result.suggestion}` : '等待采集'}</div>`).join('')}
    </div>
  </div>`;
}

function cameraFeedHTML(result){
  const name = result.camera;
  const label = result.zone === 'study' ? '家电保修' : result.zone === 'entry' ? '票据' : '临时维修';
  return `<div class="camera-feed">
    <div class="camera-name">${name}</div>
    <svg viewBox="0 0 220 116" aria-hidden="true">
      <rect width="220" height="116" fill="#15231f"/>
      <path d="M0 98 220 55v61H0Z" fill="#20352f"/>
      <path d="M20 25h54v72H20Z" fill="#2e4740" stroke="#6b8178"/>
      <path d="M88 42h102v50H88Z" fill="#314b45" stroke="#7d948c"/>
      <path d="M100 54h42M100 68h66M100 82h50" stroke="#d9a441" stroke-width="4" stroke-linecap="round"/>
      <circle cx="181" cy="31" r="7" fill="#d9a441"/>
      <text x="18" y="17" fill="#cbd8d2" font-size="10">PRIVATE</text>
      <text x="96" y="106" fill="#cbd8d2" font-size="11">${label}</text>
    </svg>
    <div class="camera-result">${state.cameraSimulationComplete ? `${result.suggestion} · ${Math.round(result.confidence*100)}%` : '等待线索确认'}</div>
    <button class="btn btn-outline btn-sm mt6" data-camera-link="${result.zone}" style="font-size:11px;padding:4px 10px">关联摄像头</button>
  </div>`;
}

/*
function cameraPanelProgress(){
  if(state.cameraSimulationComplete) return 1;
  if(state.cameraStep < 0) return 0;
  return Math.min(1, (state.cameraStep + 1) / CAMERA_STEPS.length);
}

function cameraPanelStageCopy(){
  if(state.cameraSimulationComplete) return 'Fusion locked · archived to household memory';
  if(state.cameraStage === 'running'){
    const step = CAMERA_STEPS[Math.min(state.cameraStep, CAMERA_STEPS.length - 1)] || CAMERA_STEPS[0];
    return `Scanning · ${step}`;
  }
  return 'Stand by · ready for room sweep';
}

function cameraFeedTone(result,index){
  const running = state.cameraStage === 'running';
  const done = state.cameraSimulationComplete;
  const phaseStart = Math.min(index * 2, CAMERA_STEPS.length - 1);
  const previewing = running && state.cameraStep >= phaseStart;
  const locked = done || (running && state.cameraStep > phaseStart);
  const alert = result.confidence < 0.8 || result.zone === 'living';
  return {
    previewing,
    locked,
    alert,
    cls:[
      previewing ? 'previewing' : '',
      locked ? 'locked' : '',
      done ? 'complete' : '',
      alert ? 'alert' : ''
    ].filter(Boolean).join(' ')
  };
}

function cameraTargetStyle(result){
  const box = {
    study:{left:18,top:18,width:28,height:54},
    entry:{left:10,top:24,width:22,height:58},
    living:{left:48,top:30,width:38,height:36},
    balcony:{left:58,top:16,width:28,height:30}
  }[result.zone] || {left:32,top:28,width:30,height:36};
  return `left:${box.left}%;top:${box.top}%;width:${box.width}%;height:${box.height}%`;
}

function cameraViewportSVG(result){
  const accent = result.zone === 'entry' ? '#d9a441' : result.zone === 'living' ? '#f0b66b' : '#78d8a7';
  const shelfFill = result.zone === 'entry' ? '#72573a' : result.zone === 'living' ? '#476562' : '#2e4740';
  const blockFill = result.zone === 'living' ? '#37544d' : '#314b45';
  const label = result.zone === 'study' ? 'WARRANTY' : result.zone === 'entry' ? 'RECEIPT' : 'WORK ORDER';
  return `<svg viewBox="0 0 220 116" aria-hidden="true">
    <defs>
      <linearGradient id="camera-feed-floor-${result.zone}" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#1f312b"/>
        <stop offset="100%" stop-color="#0a120f"/>
      </linearGradient>
    </defs>
    <rect width="220" height="116" fill="#0d1714"/>
    <path d="M0 104 220 58v58H0Z" fill="url(#camera-feed-floor-${result.zone})"/>
    <path d="M0 18h220" stroke="rgba(208,231,222,.14)" stroke-width="1"/>
    <path d="M18 24h54v72H18Z" fill="${shelfFill}" stroke="#8ca59b" stroke-opacity=".55"/>
    <path d="M86 38h106v54H86Z" fill="${blockFill}" stroke="#90a79f" stroke-opacity=".58"/>
    <path d="M96 50h42M96 64h70M96 78h54" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="186" cy="28" r="7" fill="${accent}" fill-opacity=".92"/>
    <path d="M138 20h26" stroke="rgba(255,255,255,.34)" stroke-width="2" stroke-linecap="round"/>
    <text x="16" y="16" fill="#c9d8d1" font-size="9">SECURE FEED</text>
    <text x="132" y="105" fill="#dceae3" font-size="10">${label}</text>
  </svg>`;
}

function cameraPanelHTML(overlay=false){
  const running = state.cameraStage === 'running';
  const done = state.cameraSimulationComplete;
  const progress = Math.round(cameraPanelProgress() * 100);
  const summary = done ? state.lastCameraResult : null;
  return `<div class="camera-panel ${overlay?'camera-overlay':''}">
    <div class="camera-panel-head">
      <div>
        <div class="camera-head-title">绌洪棿绾跨储閲囬泦</div>
        <div class="camera-head-copy muted">鍙鐞嗙敤鎴风‘璁ょ殑绌洪棿绾跨储锛屾晱鎰熶綅缃粯璁ら伄缃┿€?/div>
        <div class="camera-head-status">
          <span class="camera-live-badge">${running ? 'LIVE SWEEP' : done ? 'FUSION LOCKED' : 'ARMED'}</span>
          <span class="camera-stage-copy">${cameraPanelStageCopy()}</span>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" data-camera-start ${running?'disabled':''}>${done?'閲嶆柊閲囬泦绾跨储':'寮€濮嬮噰闆嗙嚎绱?}</button>
    </div>
    <div class="camera-progress"><span style="width:${progress}%"></span></div>
    <div class="camera-grid mt12">
      ${CAMERA_RESULTS.slice(0,3).map((result,index)=>cameraFeedHTML(result,index)).join('')}
    </div>
    <div class="ai-steps">
      ${CAMERA_STEPS.map((step,i)=>`<div class="ai-step ${done || state.cameraStep>i?'done':(state.cameraStep===i?'active':'')}">${step}</div>`).join('')}
    </div>
    <div class="camera-summary">
      ${CAMERA_RESULTS.map(result=>`<div><strong>${result.camera}</strong><br>${done ? `${displayCameraLocation(result)} 路 ${Math.round(result.confidence*100)}%<br>${result.suggestion}` : '绛夊緟閲囬泦'}</div>`).join('')}
    </div>
  </div>`;
}

function cameraFeedHTML(result,index){
  const tone = cameraFeedTone(result,index);
  const lockedText = state.cameraSimulationComplete ? 'Target confirmed' : tone.locked ? 'Object locked' : tone.previewing ? 'Sweeping' : 'Stand by';
  const resultCopy = state.cameraSimulationComplete ? `${result.suggestion} 路 ${Math.round(result.confidence*100)}%` : tone.previewing ? '姝ｅ湪鍚堟垚绌洪棿绾跨储涓庤祫鏂欓鐐? : '绛夊緟绾跨储纭';
  return `<div class="camera-feed ${tone.cls}">
    <div class="camera-feed-header">
      <div class="camera-name">${result.camera}</div>
      <div class="camera-feed-meta"><span class="camera-state-dot"></span><span>${lockedText}</span></div>
    </div>
    <div class="camera-viewport">
      ${cameraViewportSVG(result)}
      <div class="camera-viewport-grid"></div>
      <div class="camera-viewport-noise"></div>
      <div class="camera-frame"></div>
      <div class="camera-target" style="${cameraTargetStyle(result)}"></div>
      <div class="camera-scan-copy">ROI ${String((index || 0) + 1).padStart(2,'0')}<br>${Math.round(result.confidence * 100)}% match</div>
      <div class="camera-label-chip">${result.container}</div>
    </div>
    <div class="camera-feed-data">
      <div><span>Mode</span><strong>${tone.previewing ? 'Sweep' : 'Idle'}</strong></div>
      <div><span>Privacy</span><strong>${result.privacy === 'public' ? 'Public' : result.privacy === 'room_only' ? 'Mask' : 'Hidden'}</strong></div>
      <div><span>Fusion</span><strong>${tone.locked ? 'Ready' : 'Pending'}</strong></div>
    </div>
    <div class="camera-result"><strong>${resultCopy}</strong><small>${result.source}</small></div>
    <button class="btn btn-outline btn-sm" data-camera-link="${result.zone}" style="font-size:11px;padding:4px 10px">鍏宠仈鎽勫儚澶?/button>
  </div>`;
}

*/

function cameraPanelProgress(){
  if(state.cameraSimulationComplete) return 1;
  if(state.cameraStep < 0) return 0;
  return Math.min(1, (state.cameraStep + 1) / CAMERA_STEPS.length);
}

function cameraPanelStageCopy(){
  if(state.cameraSimulationComplete) return 'Fusion locked / archived to household memory';
  if(state.cameraStage === 'running'){
    const step = CAMERA_STEPS[Math.min(state.cameraStep, CAMERA_STEPS.length - 1)] || CAMERA_STEPS[0];
    return `Scanning / ${step}`;
  }
  return 'Stand by / ready for room sweep';
}

function cameraFeedTone(result,index){
  const running = state.cameraStage === 'running';
  const done = state.cameraSimulationComplete;
  const phaseStart = Math.min((index || 0) * 2, CAMERA_STEPS.length - 1);
  const previewing = running && state.cameraStep >= phaseStart;
  const locked = done || (running && state.cameraStep > phaseStart);
  const alert = result.confidence < 0.8 || result.zone === 'living';
  return {
    previewing,
    locked,
    alert,
    cls:[
      previewing ? 'previewing' : '',
      locked ? 'locked' : '',
      done ? 'complete' : '',
      alert ? 'alert' : ''
    ].filter(Boolean).join(' ')
  };
}

function cameraTargetStyle(result){
  const box = {
    study:{left:18,top:18,width:28,height:54},
    entry:{left:10,top:24,width:22,height:58},
    living:{left:48,top:30,width:38,height:36},
    balcony:{left:58,top:16,width:28,height:30}
  }[result.zone] || {left:32,top:28,width:30,height:36};
  return `left:${box.left}%;top:${box.top}%;width:${box.width}%;height:${box.height}%`;
}

function cameraViewportSVG(result){
  const accent = result.zone === 'entry' ? '#d9a441' : result.zone === 'living' ? '#f0b66b' : '#78d8a7';
  const shelfFill = result.zone === 'entry' ? '#72573a' : result.zone === 'living' ? '#476562' : '#2e4740';
  const blockFill = result.zone === 'living' ? '#37544d' : '#314b45';
  const label = result.zone === 'study' ? 'WARRANTY' : result.zone === 'entry' ? 'RECEIPT' : 'WORK ORDER';
  return `<svg viewBox="0 0 220 116" aria-hidden="true">
    <defs>
      <linearGradient id="camera-feed-floor-${result.zone}" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#1f312b"/>
        <stop offset="100%" stop-color="#0a120f"/>
      </linearGradient>
    </defs>
    <rect width="220" height="116" fill="#0d1714"/>
    <path d="M0 104 220 58v58H0Z" fill="url(#camera-feed-floor-${result.zone})"/>
    <path d="M0 18h220" stroke="rgba(208,231,222,.14)" stroke-width="1"/>
    <path d="M18 24h54v72H18Z" fill="${shelfFill}" stroke="#8ca59b" stroke-opacity=".55"/>
    <path d="M86 38h106v54H86Z" fill="${blockFill}" stroke="#90a79f" stroke-opacity=".58"/>
    <path d="M96 50h42M96 64h70M96 78h54" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="186" cy="28" r="7" fill="${accent}" fill-opacity=".92"/>
    <path d="M138 20h26" stroke="rgba(255,255,255,.34)" stroke-width="2" stroke-linecap="round"/>
    <text x="16" y="16" fill="#c9d8d1" font-size="9">SECURE FEED</text>
    <text x="132" y="105" fill="#dceae3" font-size="10">${label}</text>
  </svg>`;
}

function cameraPanelHTML(overlay=false){
  const running = state.cameraStage === 'running';
  const done = state.cameraSimulationComplete;
  const summary = done ? state.lastCameraResult : null;
  const progress = Math.round(cameraPanelProgress() * 100);
  const scanActive = state.cameraScanIndex >= 0 && (Date.now() - state.cameraScanStart) < 3200;
  const headCopy = running
    ? 'Sweep is active. 3D scene and archive state are updating together.'
    : done
      ? 'Last sweep is ready. Review the confirmed changes below.'
      : 'Panel is open. Start sweep or tap a camera target in the 3D scene.';
  const showResult = done && summary && state.cameraResultDisplay;
  if(overlay && (running || scanActive)){
    return `<div class="camera-panel camera-overlay panel-open-pop scan-compact">
      <div class="camera-panel-head">
        <div>
          <div class="camera-head-title">Space clue capture</div>
          <div class="camera-head-copy muted">Sweep is active. The 3D scan view stays visible while capture runs.</div>
          <div class="camera-head-status">
            <span class="camera-live-badge">LIVE SWEEP</span>
            <span class="camera-stage-copy">${cameraPanelStageCopy()}</span>
          </div>
        </div>
      </div>
      <div class="camera-progress"><span style="width:${progress}%"></span></div>
      <div class="camera-compact-meta">
        <div><span>Camera</span><strong>${esc(SECURITY_CAMERAS[state.cameraScanIndex]?.label || 'Scene sweep')}</strong></div>
        <div><span>Progress</span><strong>${progress}%</strong></div>
        <div><span>Next</span><strong>${esc(CAMERA_STEPS[Math.min(state.cameraStep + 1, CAMERA_STEPS.length - 1)] || 'Lock result')}</strong></div>
      </div>
    </div>`;
  }
  if(overlay && showResult){
    return `<div class="camera-panel camera-overlay panel-open-pop scan-compact scan-done">
      <div class="camera-panel-head">
        <div>
          <div class="camera-head-title">空间线索采集完成</div>
          <div class="camera-head-copy muted">已更新 ${summary.totalChanged} 份档案${summary.reviewCount ? `，${summary.reviewCount} 项待确认` : ''}，面板即将自动收起</div>
          <div class="camera-head-status">
            <span class="camera-live-badge done-badge">已完成</span>
            <span class="camera-stage-copy">${summary.relocatedCount} 项归位 · ${summary.confidenceLiftCount} 项置信提升</span>
          </div>
        </div>
      </div>
      <div class="camera-done-list">
        ${summary.changed.slice(0,3).map(item=>`<div class="camera-done-item ${item.needsReview?'review':''}">
          <strong>${esc(item.title)}</strong>
          <span>${esc(item.beforeLocation)} → ${esc(item.afterLocation)}</span>
          <em>${Math.round(item.confidence*100)}%${item.needsReview ? ' · 待复核' : ' · 已归位'}</em>
        </div>`).join('')}
      </div>
    </div>`;
  }
  return `<div class="camera-panel ${overlay?'camera-overlay panel-open-pop':''}">
    <div class="camera-panel-head">
      <div>
        <div class="camera-head-title">Space clue capture</div>
        <div class="camera-head-copy muted">${headCopy}</div>
        <div class="camera-head-status">
          <span class="camera-live-badge">${running ? 'LIVE SWEEP' : done ? 'FUSION LOCKED' : 'ARMED'}</span>
          <span class="camera-stage-copy">${cameraPanelStageCopy()}</span>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" data-camera-start ${running?'disabled':''}>${done?'Run again':'Start sweep'}</button>
    </div>
    <div class="camera-progress"><span style="width:${progress}%"></span></div>
    <div class="camera-grid mt12">
      ${CAMERA_RESULTS.slice(0,3).map((result,index)=>cameraFeedHTML(result,index)).join('')}
    </div>
    <div class="ai-steps">
      ${CAMERA_STEPS.map((step,i)=>`<div class="ai-step ${done || state.cameraStep>i?'done':(state.cameraStep===i?'active':'')}">${step}</div>`).join('')}
    </div>
    ${summary ? cameraResultSummaryHTML(summary) : ''}
    <div class="camera-summary">
      ${CAMERA_RESULTS.map(result=>`<div><strong>${result.camera}</strong><br>${done ? `${displayCameraLocation(result)} / ${Math.round(result.confidence*100)}%<br>${result.suggestion}` : 'Waiting for sweep'}</div>`).join('')}
    </div>
  </div>`;
}

function cameraFeedHTML(result,index){
  const tone = cameraFeedTone(result,index);
  const lockedText = state.cameraSimulationComplete ? 'Target confirmed' : tone.locked ? 'Object locked' : tone.previewing ? 'Sweeping' : 'Stand by';
  const resultCopy = state.cameraSimulationComplete ? `${result.suggestion} / ${Math.round(result.confidence*100)}%` : tone.previewing ? 'Fusing room clues with archive hints' : 'Waiting for clue confirmation';
  return `<div class="camera-feed ${tone.cls}">
    <div class="camera-feed-header">
      <div class="camera-name">${result.camera}</div>
      <div class="camera-feed-meta"><span class="camera-state-dot"></span><span>${lockedText}</span></div>
    </div>
    <div class="camera-viewport">
      ${cameraViewportSVG(result)}
      <div class="camera-viewport-grid"></div>
      <div class="camera-viewport-noise"></div>
      <div class="camera-frame"></div>
      <div class="camera-target" style="${cameraTargetStyle(result)}"></div>
      <div class="camera-scan-copy">ROI ${String((index || 0) + 1).padStart(2,'0')}<br>${Math.round(result.confidence * 100)}% match</div>
      <div class="camera-label-chip">${result.container}</div>
    </div>
    <div class="camera-feed-data">
      <div><span>Mode</span><strong>${tone.previewing ? 'Sweep' : 'Idle'}</strong></div>
      <div><span>Privacy</span><strong>${result.privacy === 'public' ? 'Public' : result.privacy === 'room_only' ? 'Mask' : 'Hidden'}</strong></div>
      <div><span>Fusion</span><strong>${tone.locked ? 'Ready' : 'Pending'}</strong></div>
    </div>
    <div class="camera-result"><strong>${resultCopy}</strong><small>${result.source}</small></div>
    <button class="btn btn-outline btn-sm" data-camera-link="${result.zone}" style="font-size:11px;padding:4px 10px">立即扫描定位</button>
  </div>`;
}

/* ========== 新版视图：3页核心架构 ========== */

function viewHome(){
  // APP 模式：针对手机场景的精简首页 — 今日要事 + 最近档案 + 快捷入口
  if(state.layoutMode === 'app'){
    return viewHomeApp();
  }

  const urgentTasks = getUrgentTasks().slice(0, 3);
  const upcomingTasks = getUpcomingTasks().slice(0, 8);
  const stats = {
    total: state.archives.length,
    highRisk: state.archives.filter(a => a.riskLevel === 'high').length,
    expiring: state.archives.filter(a => {
      const nearest = nearestReminder(a);
      return nearest && nearest.days <= 30;
    }).length,
    pending: getUrgentTasks().length
  };

  // 使用已有的zoneStats和roomStats函数
  const storageStats = zoneStats();
  const rooms = roomStats();

  return `<div class="home-overview">
    <!-- 上方：2D平面图 + 紧急任务 -->
    <div class="home-main">
      <!-- 左：2D 平面图 -->
      <div class="home-floorplan">
        <div class="floorplan-header">
          <h2>🏠 家庭布局概览</h2>
          <button class="btn btn-outline btn-sm" data-view="space" data-space-enter="1">进入3D空间</button>
        </div>
        <div class="floorplan-canvas" id="floorplan-canvas">
          ${spaceSvg(storageStats, rooms, null, null)}
        </div>
        <div class="floorplan-legend">
          <span><span class="legend-dot green"></span>正常房间</span>
          <span><span class="legend-dot red"></span>有风险</span>
          <span class="legend-tip">点击房间进入3D视图</span>
        </div>
      </div>

      <!-- 右：紧急任务 -->
      <div class="home-urgent">
        <h3 class="section-title">⚠️ 紧急事项 <span class="badge danger">${urgentTasks.length}</span></h3>
        ${urgentTasks.length > 0 ? `
          <div class="urgent-cards">
            ${urgentTasks.map(task => `
              <div class="urgent-card" data-task="${task.id}">
                <div class="urgent-header">
                  <span class="urgent-icon">${task.icon}</span>
                  <div class="urgent-info">
                    <h4>${esc(task.title)}</h4>
                    <span class="urgent-time">${task.daysLeft === 0 ? '今天' : task.daysLeft + '天后'}</span>
                  </div>
                </div>
                <p class="urgent-desc">${esc(task.description)}</p>
                <button class="btn btn-danger btn-sm" data-action="${task.action}">立即处理</button>
              </div>
            `).join('')}
          </div>
        ` : `<div class="empty-hint">✅ 暂无紧急事项</div>`}
      </div>
    </div>

    <!-- 下方：待办列表 + 统计 -->
    <div class="home-bottom">
      <!-- 待办列表 -->
      <div class="home-todo">
        <h3 class="section-title">📋 近期待办 <span class="badge">${upcomingTasks.length}</span></h3>
        ${upcomingTasks.length > 0 ? `
          <div class="todo-grid">
            ${upcomingTasks.map(task => `
              <div class="todo-card" data-open="${task.archiveId}">
                <span class="todo-icon">${task.icon}</span>
                <div class="todo-info">
                  <span class="todo-title">${esc(task.title)}</span>
                  <span class="todo-meta">${esc(task.member)} · ${task.daysLeft}天后</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `<div class="empty-hint">✅ 暂无待办</div>`}
      </div>

      <!-- 统计 -->
      <div class="home-stats">
        <div class="stat-card">
          <span class="stat-num">${stats.total}</span>
          <span class="stat-label">总档案</span>
        </div>
        <div class="stat-card">
          <span class="stat-num danger">${stats.highRisk}</span>
          <span class="stat-label">高风险</span>
        </div>
        <div class="stat-card">
          <span class="stat-num warn">${stats.expiring}</span>
          <span class="stat-label">本月到期</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">${stats.pending}</span>
          <span class="stat-label">待处理</span>
        </div>
      </div>
    </div>
  </div>`;
}

/* APP 模式首页：针对手机场景 — 今日要事 + 最近档案 + 快捷入口 */
function viewHomeApp(){
  const urgent = getUrgentTasks();
  const upcoming = getUpcomingTasks();
  // 合并紧急 + 近期待办，最多 5 条
  const todayTasks = [...urgent, ...upcoming].slice(0, 5);

  // 最近档案：按日期降序取前 3 份
  const recentArchives = [...state.archives]
    .sort((a,b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 3);

  // 统计数字（用于顶部摘要条）
  const totalArchives = state.archives.length;
  const pendingCount = urgent.length + upcoming.length;

  return `<div class="home-app">
    <!-- 顶部摘要条 -->
    <div class="app-summary-bar">
      <div class="app-summary-item">
        <span class="app-summary-num">${totalArchives}</span>
        <span class="app-summary-label">家庭档案</span>
      </div>
      <div class="app-summary-divider"></div>
      <div class="app-summary-item">
        <span class="app-summary-num ${pendingCount > 0 ? 'warn' : ''}">${pendingCount}</span>
        <span class="app-summary-label">待处理</span>
      </div>
    </div>

    <!-- 今日要事 -->
    <section class="app-section">
      <div class="app-section-head">
        <h3>今日要事</h3>
        ${todayTasks.length > 0 ? `<span class="app-section-count">${todayTasks.length}</span>` : ''}
      </div>
      ${todayTasks.length > 0 ? `
        <div class="app-todo-list">
          ${todayTasks.map((task, i) => `
            <div class="app-todo-item ${task.daysLeft === 0 ? 'is-urgent' : ''}" ${task.archiveId ? `data-open="${task.archiveId}"` : ''}>
              <div class="app-todo-icon">${task.icon}</div>
              <div class="app-todo-body">
                <span class="app-todo-title">${esc(task.title)}</span>
                <span class="app-todo-meta">${esc(task.description || task.member || '')}</span>
              </div>
              <div class="app-todo-time ${task.daysLeft === 0 ? 'danger' : ''}">
                ${task.daysLeft === 0 ? '今天' : task.daysLeft + '天'}
              </div>
            </div>
          `).join('')}
        </div>
      ` : `<div class="app-empty">暂无待处理事项</div>`}
    </section>

    <!-- 最近档案 -->
    <section class="app-section">
      <div class="app-section-head">
        <h3>最近档案</h3>
        <button class="app-section-link" data-view="archives">全部 ›</button>
      </div>
      <div class="app-archive-list">
        ${recentArchives.map(a => `
          <div class="app-archive-item" data-open="${a.id}">
            <div class="app-archive-icon">${catColor(a.category).ico}</div>
            <div class="app-archive-body">
              <span class="app-archive-title">${esc(a.title)}</span>
              <span class="app-archive-meta">${esc(a.category)} · ${esc(a.familyMember)}</span>
            </div>
            <i data-lucide="chevron-right" class="app-archive-arrow"></i>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- 快捷入口 -->
    <section class="app-section app-quick-section">
      <div class="app-quick-grid">
        <button class="app-quick-btn" data-view="archives">
          <i data-lucide="archive"></i>
          <span>找档案</span>
        </button>
        <button class="app-quick-btn" data-view="space">
          <i data-lucide="layout-grid"></i>
          <span>进空间</span>
        </button>
        <button class="app-quick-btn" data-view="services">
          <i data-lucide="sliders-horizontal"></i>
          <span>看工单</span>
        </button>
      </div>
    </section>
  </div>`;
}

/* APP 模式档案页：单栏列表 + 横向筛选标签 */
function viewArchivesApp(){
  const list = filteredArchives();
  const expiringCount = state.archives.filter(a => { const n = nearestReminder(a); return n && n.days <= 30; }).length;
  const highCount = state.archives.filter(a => a.riskLevel === 'high').length;
  const supCount = state.archives.filter(a => a.status === 'supplement').length;

  return `<div class="app-archives">
    <div class="app-search-bar">
      <i data-lucide="search"></i>
      <input type="text" placeholder="搜索档案标题、关键词..." value="${esc(state.librarySearch)}" id="archives-search" />
    </div>
    <div class="app-filter-chips">
      <button class="app-chip ${state.libraryFilter==='all'?'active':''}" data-filter="all">全部 ${state.archives.length}</button>
      <button class="app-chip ${state.libraryFilter==='expiring'?'active':''}" data-filter="expiring">到期 ${expiringCount}</button>
      <button class="app-chip ${state.libraryFilter==='high'?'active':''}" data-filter="high">高风险 ${highCount}</button>
      <button class="app-chip ${state.libraryFilter==='supplement'?'active':''}" data-filter="supplement">待补 ${supCount}</button>
    </div>
    <div class="app-archive-rows">
      ${list.length > 0 ? list.map(a => {
        const c = catColor(a.category);
        const nearest = nearestReminder(a);
        return `<div class="app-archive-row" data-open="${a.id}">
          <div class="app-archive-row-icon" style="background:${c.bg};color:${c.color}">${c.ico}</div>
          <div class="app-archive-row-body">
            <span class="app-archive-row-title">${esc(a.title)}</span>
            <span class="app-archive-row-meta">${esc(a.familyMember)} · ${esc(a.amountOrTerm || a.category)}</span>
          </div>
          ${nearest ? `<span class="app-archive-row-tag ${nearest.days <= 7 ? 'danger' : ''}">${nearest.days === 0 ? '今天' : nearest.days + '天'}</span>` : ''}
        </div>`;
      }).join('') : '<div class="app-empty">暂无档案</div>'}
    </div>
  </div>`;
}

/* APP 模式空间页：2D 平面图 + 房间快捷入口 */
function viewSpaceApp(){
  const stats = zoneStats();
  const rooms = roomStats();
  const totalArchives = state.archives.length;
  const locatedCount = state.archives.filter(a => a.memoryRoom).length;
  return `<div class="app-space">
    <div class="app-space-summary">
      <div class="app-space-stat"><span class="num">${totalArchives}</span><span class="label">档案</span></div>
      <div class="app-space-stat"><span class="num">${FLOOR_ROOMS.length}</span><span class="label">房间</span></div>
      <div class="app-space-stat"><span class="num">${locatedCount}</span><span class="label">已定位</span></div>
    </div>
    <div class="app-space-floorplan">${spaceSvg(stats, rooms, null, null)}</div>
    <div class="app-space-rooms">
      ${FLOOR_ROOMS.filter(r => r.zones.length > 0).map(r => {
        const count = state.archives.filter(a => a.memoryRoom === r.id || (r.zones && r.zones.includes(a.memoryZone))).length;
        return `<div class="app-room-item" data-room-zone="${r.id}">
          <i data-lucide="door-open"></i>
          <span class="app-room-name">${esc(r.name)}</span>
          <span class="app-room-count">${count}</span>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

/* APP 模式服务页：横向滚动 Tab + 单列卡片 */
function viewServicesApp(){
  const tabs = ['维修服务', '照护服务', '理赔服务', '材料包'];
  const tabKinds = {
    '维修服务': ['risk-report', 'material-pack', 'service-auth', 'hardware-kit'],
    '照护服务': ['care-plan', 'subscription-plan', 'privacy-vault'],
    '理赔服务': ['claim-pack', 'moveout-pack'],
    '材料包': ['material-pack', 'school-pack', 'claim-pack', 'moveout-pack']
  };
  const activeTab = state.serviceTab || tabs[0];
  const selectedDemo = state.serviceDemo || null;
  const kinds = tabKinds[activeTab] || [];
  const demoInTab = selectedDemo && kinds.includes(selectedDemo);
  const allCards = serviceCardDefinitions();
  const byId = id => allCards.find(c => c.id === id);
  const cards = kinds.map(byId).filter(Boolean);

  return `<div class="app-services">
    <div class="app-services-tabs">
      ${tabs.map(t => `<button class="app-service-tab ${t===activeTab?'active':''}" data-service-tab="${t}">${t}</button>`).join('')}
    </div>
    <div class="app-services-list">
      ${cards.map(card => {
        const run = serviceRunFor(card.id);
        const archive = serviceArchiveFor(card.id);
        const iconMap = {'risk-report':'shield-alert','subscription-plan':'heart-handshake','care-plan':'heart-pulse','material-pack':'package-check','school-pack':'graduation-cap','claim-pack':'receipt-text','moveout-pack':'home-minus','privacy-vault':'shield-check','service-auth':'user-round-check','hardware-kit':'cpu'};
        const icon = iconMap[card.id] || 'sparkles';
        return `<div class="app-service-card ${selectedDemo===card.id?'active':''} ${run?'generated':''}" data-service-demo="${card.id}">
          <div class="app-service-card-top">
            <div class="app-service-icon"><i data-lucide="${icon}"></i></div>
            <div class="app-service-head">
              <span class="app-service-role">${esc(card.role)}</span>
              <span class="app-service-meta">${esc(card.meta)}</span>
            </div>
          </div>
          <h3 class="app-service-title">${esc(card.title)}</h3>
          <p class="app-service-desc">${esc(card.desc)}</p>
          ${archive ? `<div class="app-service-archive" data-open="${archive.id}"><i data-lucide="link"></i><span>${esc(archive.title)}</span></div>` : ''}
          <div class="app-service-actions">
            <button class="btn ${selectedDemo===card.id?'btn-primary':'btn-outline'} btn-sm" data-service-demo="${card.id}"><i data-lucide="eye"></i><span>详情</span></button>
            <button class="btn btn-primary btn-sm" data-service-run="${card.id}"><i data-lucide="play"></i><span>${esc(card.action)}</span></button>
          </div>
        </div>`;
      }).join('')}
    </div>
    ${demoInTab ? `<div class="app-services-detail">${serviceDemoHTML(selectedDemo)}</div>` : ''}
  </div>`;
}

function viewSpace(){
  if(state.layoutMode === 'app') return viewSpaceApp();
  return `<div class="space-immersive">
    ${renderMemorySpace({context:'space', immersive:true})}
  </div>`;
}

function viewArchives(){
  if(state.layoutMode === 'app') return viewArchivesApp();
  const categories = Array.from(new Set(state.archives.map(a=>a.category))).map(cat => {
    const count = state.archives.filter(a=>a.category===cat).length;
    return {id:cat, name:cat, count, icon:catColor(cat).ico};
  });
  const members = ['all', ...new Set(state.archives.map(a=>a.familyMember))];
  const activeCat = state.libraryFilter === 'all' ? null : state.libraryFilter;
  const list = filteredArchives();

  // 分页逻辑
  const pageSize = 20;
  const currentPage = state.archivesPage || 1;
  const totalPages = Math.ceil(list.length / pageSize);
  const paginatedList = list.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return `<div class="archives-layout">
    <aside class="archives-sidebar">
      <div class="quick-filters">
        <button class="filter-chip ${state.libraryFilter==='expiring'?'active':''}" data-filter="expiring">
          ⚠️ 近期到期 (${state.archives.filter(a=>nearestReminder(a)?.days<=30).length})
        </button>
        <button class="filter-chip ${state.libraryFilter==='high'?'active':''}" data-filter="high">
          🔴 高风险 (${state.archives.filter(a=>a.riskLevel==='high').length})
        </button>
        <button class="filter-chip ${state.libraryFilter==='supplement'?'active':''}" data-filter="supplement">
          📝 待补资料 (${state.archives.filter(a=>a.status==='supplement').length})
        </button>
        <button class="filter-chip ${state.libraryFilter==='all'?'active':''}" data-filter="all">
          📁 全部 (${state.archives.length})
        </button>
      </div>

      <nav class="category-tree">
        <div class="tree-header" data-toggle="category">
          <h3>按类别</h3>
          <span class="toggle-icon">${state.categoryExpanded ? '▼' : '▶'}</span>
        </div>
        <div class="tree-content ${state.categoryExpanded ? '' : 'collapsed'}">
          ${categories.map(cat => `
            <div class="category-item ${activeCat===cat.id?'active':''}" data-filter="${cat.id}">
              <span class="category-label">${cat.icon} ${esc(cat.name)}</span>
              <span class="category-count">${cat.count}</span>
            </div>
          `).join('')}
        </div>
      </nav>

      <nav class="member-tree">
        <div class="tree-header" data-toggle="member">
          <h3>按成员</h3>
          <span class="toggle-icon">${state.memberExpanded ? '▼' : '▶'}</span>
        </div>
        <div class="tree-content ${state.memberExpanded ? '' : 'collapsed'}">
          ${members.map(m => `
            <div class="member-item ${state.libraryMember===m?'active':''}" data-member="${m}">
              <span class="member-label">${m==='all'?'全部成员':esc(m)}</span>
              <span class="member-count">${m==='all'?state.archives.length:state.archives.filter(a=>a.familyMember===m).length}</span>
            </div>
          `).join('')}
        </div>
      </nav>
    </aside>

    <main class="archives-main">
      <div class="archives-header">
        <h2>${activeCat || '全部档案'} (${list.length})</h2>
        <div class="archives-actions">
          <button class="btn btn-outline btn-sm" onclick="exportAllArchives()">📤 导出全部</button>
          <input type="text" placeholder="搜索..." value="${esc(state.librarySearch)}" id="archives-search" />
        </div>
      </div>

      <div class="archives-list">
        ${paginatedList.map(a => archiveRowHTML(a)).join('')}
      </div>

      ${totalPages > 1 ? `
      <div class="archives-pagination">
        <button class="pagination-btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}>← 上一页</button>
        <span class="pagination-info">第 ${currentPage} / ${totalPages} 页</span>
        <button class="pagination-btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}>下一页 →</button>
      </div>
      ` : ''}
    </main>
  </div>`;
}

function archiveRowHTML(a){
  const c = catColor(a.category);
  const nearest = nearestReminder(a);
  const asset = archiveAssetProfile(a);
  return `<div class="archive-row" data-open="${a.id}">
    <div class="archive-row-icon" style="background:${c.bg};color:${c.color}">${c.ico}</div>
    <div class="archive-row-main">
      <h3 class="archive-row-title">${esc(a.title)}</h3>
      <div class="archive-row-meta">
        <span>${esc(a.familyMember)}</span>
        <span>·</span>
        <span>${esc(a.amountOrTerm)}</span>
        <span>·</span>
        <span>${esc(displayLocation(a))}</span>
      </div>
    </div>
    <div class="archive-row-tags">
      <span class="tag ${riskTag(a.riskLevel).c}">${riskTag(a.riskLevel).t}</span>
      ${nearest ? `<span class="tag ${reminderPriority(nearest.days).c}">${nearest.days}天后</span>` : ''}
    </div>
  </div>`;
}

/* 获取紧急任务（0-3天） */
function getUrgentTasks(){
  const tasks = [];
  const incident = activeIncident();

  // 水浸事件
  if(incident){
    tasks.push({
      id: incident.id,
      icon: '<i data-lucide="alert-circle" class="icon-urgent"></i>',
      title: incident.title,
      description: incident.reason,
      daysLeft: 0,
      action: 'handle-incident',
      actionLabel: '立即处理',
      archiveId: incidentArchive(incident)?.id
    });
  }

  // 即将到期的提醒
  state.archives.forEach(a => {
    const nearest = nearestReminder(a);
    if(nearest && nearest.days >= 0 && nearest.days <= 3 && nearest.status !== 'done'){
      tasks.push({
        id: nearest.id,
        icon: catColor(a.category).ico,
        title: nearest.action,
        description: `${a.title} - ${a.amountOrTerm}`,
        daysLeft: nearest.days,
        action: `reminder-${nearest.id}`,
        actionLabel: '处理',
        archiveId: a.id
      });
    }
  });

  return tasks.slice(0, 3); // 最多显示3个
}

/* 获取近期待办（7-30天） */
function getUpcomingTasks(){
  const tasks = [];

  state.archives.forEach(a => {
    const nearest = nearestReminder(a);
    if(nearest && nearest.days > 3 && nearest.days <= 30 && nearest.status !== 'done'){
      tasks.push({
        id: nearest.id,
        icon: catColor(a.category).ico,
        title: nearest.action,
        member: a.familyMember,
        daysLeft: nearest.days,
        archiveId: a.id
      });
    }
  });

  return tasks.sort((a,b) => a.daysLeft - b.daysLeft).slice(0, 8); // 最多显示8个
}

/* ========== 旧版视图（保留兼容） ========== */

function viewDashboard(){
  return `<div class="home-immersive">
    ${renderMemorySpace({context:'home', immersive:true})}
  </div>`;
}

function viewToday(){
  const query = state.assistantQuery || '家里现在最需要处理什么？';
  const answer = assistantAnswer(query);
  const incident = activeIncident();
  const archive = incidentArchive(incident);
  const samples = ['家里现在最需要处理什么？','为什么判断阳台水浸风险？','老人夜起场景怎么工作？','退租交接怎么做？'];
  return `<div class="assistant-shell">
    <section class="assistant-panel">
      <div class="assistant-hero">
        <span class="tag brand">AI 家庭操作系统</span>
        <h2>阳台水浸风险，已合并证据、资产和授权服务。</h2>
        <div class="assistant-live-grid">
          <div><b>空间事件</b><span>${esc(incident.room)} · ${esc(incident.device.locationLabel)}</span></div>
          <div><b>证据档案</b><span>${esc(archive?.title || '待匹配')}</span></div>
          <div><b>处理状态</b><span>${incidentStatusText()}</span></div>
        </div>
        <div class="assistant-question-row">
          <input id="assistant-input" value="${esc(query)}" aria-label="询问 AI 管家" />
          <button class="btn btn-primary" data-assistant-submit>询问</button>
        </div>
        <div class="assistant-samples">${samples.map(s=>`<button data-ai-command="${esc(s)}">${esc(s)}</button>`).join('')}</div>
      </div>
      <div class="assistant-answer">
        <div class="assistant-answer-head"><div class="assistant-answer-title">${esc(answer.title)}</div><span class="tag warn">本地置信 91%</span></div>
        <div class="assistant-answer-main">${esc(answer.main)}</div>
        <div class="assistant-reason-grid">
          ${answer.reasons.map(item=>`<div><b>${esc(item.k)}</b>${esc(item.v)}</div>`).join('')}
        </div>
        <div class="assistant-route">
          <span>建议路径</span>
          <strong>2D 定位</strong>
          <i></i>
          <strong>生成事项</strong>
          <i></i>
          <strong>授权材料包</strong>
        </div>
        <div class="assistant-actions">
          ${answer.actions.map(action=>`<button class="btn ${action.primary?'btn-primary':'btn-outline'} btn-sm" ${action.attr || ''}>${esc(action.label)}</button>`).join('')}
        </div>
      </div>
      ${paidPainPointsHTML()}
    </section>
    <aside class="assistant-side">
      ${homeOSValueGridHTML({compact:true})}
      <div class="card"><div class="card-h"><span class="t">空间理解</span></div><div class="card-b">
        <div class="home-mode-grid">
          <button class="home-mode warning" data-incident-locate><strong>异常事件</strong><span>阳台水浸定位</span></button>
          <button class="home-mode active" data-jump="home"><strong>3D 家况</strong><span>回到家庭数字孪生</span></button>
          <button class="home-mode" data-jump="library"><strong>2D 蓝图</strong><span>查看证据位置</span></button>
          <button class="home-mode" data-jump="members"><strong>成员权限</strong><span>查看谁能代办什么</span></button>
          <button class="home-mode" data-jump="services"><strong>授权服务</strong><span>生成材料包</span></button>
        </div>
      </div></div>
      <div class="card"><div class="card-h"><span class="t">AI 能读取的本地状态</span></div><div class="card-b">
        <div class="assistant-trace-list">
          <div><strong>1</strong><span>3D 节点确认：${esc(currentTourNode().room)}</span></div>
          <div><strong>2</strong><span>事件总线：${esc(incident.title)} · ${incidentStatusText()}</span></div>
          <div><strong>3</strong><span>档案证据：${esc(incidentEvidenceText())}</span></div>
          <div><strong>4</strong><span>下一动作：${esc(incident.ai.next.join(' / '))}</span></div>
        </div>
      </div></div>
      <div class="card"><div class="card-h"><span class="t">通知草稿</span></div><div class="card-b">
        <div class="assistant-draft">林女士先检查洗衣机排水口并拍照，周先生准备 ${esc(archive?.title || '洗衣机保修档案')}。处理后我会把结果写入事件记录。</div>
        <div class="assistant-actions">
          <button class="btn btn-primary btn-sm" data-incident-action>生成处理事项</button>
          <button class="btn btn-outline btn-sm" data-jump="services">生成材料包</button>
        </div>
      </div></div>
    </aside>
  </div>`;
}

function assistantAnswer(query){
  const incident = activeIncident();
  const archive = incidentArchive(incident);
  const q = String(query || '');
  if(/材料包|服务|维修/.test(q)){
    return {
      title:'可以生成维修材料包，但必须先由用户授权。',
      main:`我会把 ${incident.title}、${archive?.title || '相关档案'}、历史维修记录和现场检查事项整理成最小必要材料，不会外发原始家庭资料。`,
      reasons:[
        {k:'材料范围',v:'洗衣机发票、保修卡、上次排水泵维修记录、今日水浸事件。'},
        {k:'隐私边界',v:'家人确认后才生成服务授权，只输出维修所需摘要，精确家庭资料位置默认不外露。'},
        {k:'服务价值',v:'可连接授权维修服务、硬件套餐或家庭风险体检。'}
      ],
      actions:[
        {label:'查看家庭服务',primary:true,attr:'data-jump="services"'},
        {label:'打开洗衣机档案',attr:`data-open="${archive?.id || 'A001'}"`}
      ]
    };
  }
  if(/资产|档案|保修|证据|家电/.test(q)){
    return {
      title:'家庭资产不是静态清单，而是风险和服务的证据底座。',
      main:'洗衣机这类资产一旦绑定购买凭证、保修期、维修记录、空间位置和责任人，水浸告警就能直接变成可处理的报修材料。',
      reasons:[
        {k:'资产对象',v:`${archive?.title || '洗衣机档案'} 记录型号、发票、保修和售后联系人。`},
        {k:'空间关系',v:'资产不要求暴露实物精确位置，但证据存放点和事件发生点要能被定位。'},
        {k:'业务价值',v:'维修、理赔、退租、入学和复诊都依赖这类“找得到、说得清、可交接”的证据。'}
      ],
      actions:[
        {label:'打开洗衣机档案',primary:true,attr:`data-open="${archive?.id || 'A001'}"`},
        {label:'查看 2D 证据点',attr:'data-incident-locate'},
        {label:'生成材料包',attr:'data-jump="services"'}
      ]
    };
  }
  if(/商业|付费|价值|模式|收入|赚钱|市场/.test(q)){
    return {
      title:'商业价值来自真实家庭损失场景，不来自泛资料订阅。',
      main:'优先打透“风险体检 -> 有据材料包 -> 用户授权服务 -> 履约回写”的闭环，再扩展到安心订阅、设备安装和 B 端协作。',
      reasons:[
        {k:'高频付费理由',v:'家庭安全周报、异常记录和老人/儿童看护让用户持续安心。'},
        {k:'低频高客单',v:'维修、理赔、装修、搬家、入学、复诊和退租都有材料整理与专业服务需求。'},
        {k:'服务分成',v:'维修、智能设备安装、保险/理赔协作只在用户授权后接收最小必要信息。'}
      ],
      actions:[
        {label:'查看家庭服务',primary:true,attr:'data-jump="services"'},
        {label:'生成安全体检',attr:'data-service-run="risk-report"'},
        {label:'生成安装建议',attr:'data-service-run="hardware-kit"'}
      ]
    };
  }
  if(/技术|架构|本地优先|云端|怎么实现/.test(q)){
    return {
      title:'技术方案的关键不是把家里连上云，而是把家庭状态、证据和授权变成一条可信执行链。',
      main:'平台底座按“本地事件层 -> 家庭图谱层 -> 数字孪生层 -> AI 编排层 -> 服务连接层”组织，先保证家庭状态可追溯，再让 AI 和服务接手。',
      reasons:[
        {k:'本地优先',v:'设备状态、风险判断和授权边界默认在本地保留，弱网或外部服务不可用时也不丢关键家况。'},
        {k:'对象模型',v:'Room、Device、Archive、Risk、Authorization、ServiceRun 统一进同一条事件链，任何动作都能回写。'},
        {k:'服务接口',v:'对外只输出材料包摘要、授权边界和回执字段，不把完整家庭资料直接暴露给服务商。'}
      ],
      actions:[
        {label:'查看家庭服务',primary:true,attr:'data-jump="services"'},
        {label:'查看空间视图',attr:'data-jump="library"'},
        {label:'查看成员权限',attr:'data-jump="members"'}
      ]
    };
  }
  if(/生态|合作|服务商|B端|渠道|养老社区|生态协同/.test(q)){
    return {
      title:'家庭生态要先标准化边界，再开放合作。',
      main:'平台先把材料包、授权单、工单上下文和回执回写做成标准对象，再接入物业、维修、保险、养老社区和安装服务，避免生态一开就变成导流页。',
      reasons:[
        {k:'家庭价值',v:'减少重复找资料、重复解释问题和把陌生人带进私密空间的焦虑。'},
        {k:'服务商价值',v:'服务前拿到标准上下文，服务中知道权限范围，服务后能提交结构化回执。'},
        {k:'平台收入',v:'订阅、单次材料包、履约分成和 B 端工具费可以并存，但前提是服务过程可信。'}
      ],
      actions:[
        {label:'查看家庭服务',primary:true,attr:'data-jump="services"'},
        {label:'查看风险运营',attr:'data-jump="home"'},
        {label:'回到 3D 家况',attr:'data-jump="home"'}
      ]
    };
  }
  if(/平台|系统|OS|操作系统|数字孪生/.test(q)){
    return {
      title:'核心是家庭数字孪生操作系统，而不是 3D 展示。',
      main:'空间图谱负责“家里哪里发生了什么”，家庭资产负责“依据是什么”，AI 负责“下一步怎么做”，授权服务负责“谁可以接手”。',
      reasons:[
        {k:'对象模型',v:'Home、Space、Asset、Archive、Risk、Action、ServiceOffer 被串在同一条事件链里。'},
        {k:'用户价值',v:'减少找资料、想流程、跨成员交接和服务授权不透明带来的真实成本。'},
        {k:'平台延展',v:'后续可接入传感器、智能家居、维修商、保险和养老社区，当前先把用户授权和证据闭环做实。'}
      ],
      actions:[
        {label:'回到 3D 家况',primary:true,attr:'data-jump="home"'},
        {label:'查看空间视图',attr:'data-jump="library"'},
        {label:'查看服务闭环',attr:'data-jump="services"'}
      ]
    };
  }
  if(/离家/.test(q)){
    const scenario = homeScenarioById('away');
    return {
      title:'离家模式会把“设备开关”变成一眼可确认的安全状态。',
      main:scenario.summary,
      reasons:[
        {k:'门口',v:'入户门锁、门磁和玄关摄像头进入守护状态。'},
        {k:'能耗',v:'客厅非必要灯光关闭，家里状态从列表变成空间可见。'},
        {k:'异常保留',v:'阳台水浸风险不会被离家模式静默掩盖。'}
      ],
      actions:[
        {label:'切换离家模式',primary:true,attr:'data-home-scenario="away"'},
        {label:'查看待办',attr:'data-jump="home"'}
      ]
    };
  }
  if(/睡眠/.test(q)){
    const scenario = homeScenarioById('sleep');
    return {
      title:'睡眠模式会同时处理舒适、能耗和安静守护。',
      main:scenario.summary,
      reasons:[
        {k:'卧室',v:'卧室进入夜间舒适区，右侧房门可打开，减少家人打扰。'},
        {k:'客厅',v:'公共区域灯光关闭并降耗，状态仍能在 3D 里看到。'},
        {k:'安全',v:'门窗和水浸传感器保持守护，不因为睡眠而关闭提醒。'}
      ],
      actions:[
        {label:'切换睡眠模式',primary:true,attr:'data-home-scenario="sleep"'},
        {label:'回到 3D 家况',attr:'data-jump="home"'}
      ]
    };
  }
  if(/夜起|老人|关怀/.test(q)){
    const scenario = homeScenarioById('elder-care');
    return {
      title:'老人夜起场景把路径、房间和家人提醒连成闭环。',
      main:scenario.summary,
      reasons:[
        {k:'路径',v:'卧室到卫浴路径灯亮起，2D 蓝图显示路线。'},
        {k:'关怀',v:'长时间未活动才提醒子女，避免普通夜起被过度打扰。'},
        {k:'隐私',v:'只记录必要状态，不展示或外发家庭原始画面。'}
      ],
      actions:[
        {label:'切换夜起关怀',primary:true,attr:'data-home-scenario="elder-care"'},
        {label:'查看成员权限',attr:'data-jump="members"'}
      ]
    };
  }
  if(/退租|押金|验房|交接/.test(q)){
    const lease = moveoutArchive();
    return {
      title:'退租闭环要先把合同、押金和验房证据组织成一条交接链。',
      main:'系统会把房屋合同、押金收据、水电底数、维修记录和物业验房授权收进同一条退租链路，先减少押金争议，再生成最小授权和交接包。',
      reasons:[
        {k:'高损失点',v:'押金 ¥12,000 和验房争议属于单次高损失事务。'},
        {k:'证据底座',v:`${lease?.title || '房屋合同档案'} 已把合同、押金和水电底数合并归档。`},
        {k:'服务价值',v:'退租交接包、物业验房授权和争议回写适合做单次高价值材料包服务。'}
      ],
      actions:[
        {label:'查看退租交接包',primary:true,attr:'data-service-demo-jump="moveout-pack"'},
        {label:'打开房屋合同档案',attr:`data-open="${lease?.id || 'A002'}"`},
        {label:'查看风险运营',attr:'data-jump="home"'}
      ]
    };
  }
  if(/入学|学籍|户口|报到/.test(q)){
    const school = schoolArchive();
    return {
      title:'入学闭环的关键不是记住日期，而是提前补齐材料缺口并留下提交回执。',
      main:'系统会把 A006 入学通知、户口本复印件、居住登记回执缺口和报到日期放在同一条材料链里，先提示缺什么，再生成入学材料包和代交授权。',
      reasons:[
        {k:'当前缺口',v:'居住登记回执清晰页仍缺失，会影响 2026-08-25 报到。'},
        {k:'证据组织',v:`${school?.title || '入学材料档案'} 已把通知、户口本和缺失项放进同一条入学链。`},
        {k:'服务价值',v:'入学材料包、补件提醒和代交授权适合做家庭行政事务类单次高价值服务。'}
      ],
      actions:[
        {label:'查看入学材料包',primary:true,attr:'data-service-demo-jump="school-pack"'},
        {label:'打开入学档案',attr:`data-open="${school?.id || 'A006'}"`},
        {label:'查看风险运营',attr:'data-jump="home"'}
      ]
    };
  }
  if(/报销|理赔|票据|费用清单/.test(q)){
    const claim = claimArchive();
    return {
      title:'报销闭环的关键不是记住金额，而是先补齐缺页、再带着最小材料边界去提交。',
      main:'系统会把 A009 的门诊发票、支付小票、费用清单缺页和待核金额组织成一条报销链，先提示缺什么，再生成报销材料包和提交授权。',
      reasons:[
        {k:'当前缺口',v:'费用清单第 2 页仍缺失，票据金额仍需人工核对，不补齐容易被退回。'},
        {k:'证据组织',v:`${claim?.title || '门诊报销档案'} 已把就诊日期、票据、小票和缺页状态放进同一条报销链。`},
        {k:'服务价值',v:'报销材料包、缺页提醒和提交授权适合做家庭行政事务与理赔协作类单次高价值服务。'}
      ],
      actions:[
        {label:'查看报销材料包',primary:true,attr:'data-service-demo-jump="claim-pack"'},
        {label:'打开报销档案',attr:`data-open="${claim?.id || 'A009'}"`},
        {label:'查看风险运营',attr:'data-jump="home"'}
      ]
    };
  }
  if(/自动化|场景/.test(q)){
    return {
      title:'先把待办处理打透，再展示可扩展场景。',
      main:'当前最优先仍是生活阳台水浸闭环；离家、睡眠和老人夜起可以作为可切换家庭场景，并同步到 2D 蓝图。',
      reasons:[
        {k:'异常事件',v:'水浸风险从 3D 空间定位到 2D 蓝图，再生成处理事项。'},
        {k:'场景联动',v:'离家、睡眠、老人夜起会改变门窗、灯光、路径和空间标注。'},
        {k:'完成度',v:'用一条闭环主线证明落地，再用场景说明可扩展性。'}
      ],
      actions:[
        {label:'查看待办',primary:true,attr:'data-jump="home"'},
        {label:'回到 3D 家况',attr:'data-jump="home"'}
      ]
    };
  }
  if(/为什么|依据|判断/.test(q)){
    return {
      title:'判断依据来自空间事件和档案证据的交叉验证。',
      main:incident.ai.why,
      reasons:[
        {k:'空间状态',v:`${incident.room} 的 ${incident.device.name} 已触发，位置在 ${incident.device.locationLabel}。`},
        {k:'档案证据',v:`已找到 ${incidentEvidenceText()}，可用于售后和保修。`},
        {k:'影响范围',v:incident.ai.impact}
      ],
      actions:[
        {label:'查看 2D 定位',primary:true,attr:'data-incident-locate'},
        {label:'生成处理事项',attr:'data-incident-action'}
      ]
    };
  }
  if(/通知|谁|家人/.test(q)){
    return {
      title:'建议通知日常使用者和资料负责人。',
      main:'当前建议由林女士先检查洗衣机排水口，由周先生准备保修材料；处理完成后写入时间线，其他家庭成员可回看。',
      reasons:[
        {k:'现场处理',v:'林女士日常使用洗衣机，最适合先做现场检查。'},
        {k:'资料准备',v:'A001 档案记录售后联系人为周先生。'},
        {k:'交接沉淀',v:'完成后自动写入档案操作日志和事件记录。'}
      ],
      actions:[
        {label:'生成处理事项',primary:true,attr:'data-incident-action'},
        {label:'打开事件记录',attr:'data-jump="timeline"'}
      ]
    };
  }
  return {
    title:'现在最需要处理的是生活阳台洗衣机水浸风险。',
    main:incident.ai.what,
    reasons:[
      {k:'发生了什么',v:`${incident.device.name} 在 ${incident.device.locationLabel} 已触发。`},
      {k:'为什么重要',v:incident.ai.impact},
      {k:'下一步',v:incident.ai.next.join('、')}
    ],
    actions:[
      {label:'查看 2D 定位',primary:true,attr:'data-incident-locate'},
      {label:state.incidentStatus === 'detected' ? '生成处理事项' : '查看处理事项',attr:'data-incident-action'},
      {label:'回到 3D 家况',attr:'data-jump="home"'}
    ]
  };
}

function todayRiskItemHTML(item){
  const a = item.archive;
  const pri = item.days === 999 ? {c:'brand',t:'待补资料'} : reminderPriority(item.days);
  return `<button class="today-row" data-open="${a.id}">
    <span><strong>${esc(item.title)}</strong><em>${esc(a.title)} · ${esc(displayLocation(a))}</em></span>
    <b class="tag ${pri.c}">${item.days===999?'待补':displayRiskDue(item)}</b>
  </button>`;
}

function todayPendingItemHTML(item){
  return `<button class="today-row" data-jump="archive" data-pending="${item.id}">
    <span><strong>${esc(item.title)}</strong><em>${esc(item.rawType)} · 置信 ${Math.round((item.confidence||0)*100)}%</em></span>
    <b class="tag ${item.lowConfidence?'fail':'brand'}">${item.lowConfidence?'需补全':'待确认'}</b>
  </button>`;
}

function viewArchive(){
  const queue = state.pending.filter(p=>!p._done);
  const p = state.pending.find(x=>x.id===state.currentPendingId && !x._done) || queue[0] || null;
  if(p && state.currentPendingId !== p.id) state.currentPendingId = p.id;
  const stageIdx = {idle:-1, scanning:0, extracting:1, judging:2, confirm:3, done:4}[state.aiStage] ?? -1;
  const stages = [
    ['识别资料','定位文本和版面区'],
    ['提取字段','保留原始识别与推断来源'],
    ['AI 判断','分类、风险、位置与隐私建议'],
    ['人工确认','补齐低置信度字段'],
    ['写入档案','生成提醒、位置和追溯记录']
  ];
  return `<div class="archive-layout">
    <aside>
      <div class="card mb12"><div class="card-h"><span class="t">智能收件箱</span></div><div class="card-b">
        <div class="import-zone" id="import-zone">
          <div class="import-title">接收新资料</div>
          <div class="import-sub">先接收新资料，再由 AI 提取字段、判断分类、建议位置，最后由用户确认写入档案、事项和提醒。</div>
          <div class="flex gap8 wrap mt12" style="justify-content:center">
            <button class="btn btn-primary btn-sm" id="pick-files">选择文件</button>
            <button class="btn btn-outline btn-sm" id="add-low-sample">加入待核验资料</button>
          </div>
          <input type="file" id="file-input" class="hidden-file" multiple accept="image/*,application/pdf" />
        </div>
      </div></div>
      <div class="card"><div class="card-h"><span class="t">待处理资料</span><span class="tag gray" style="margin-left:auto">${queue.length}</span></div><div class="card-b">
        ${queue.length ? `<div class="queue-list">${queue.map(item=>queueItemHTML(item)).join('')}</div>` : `<div class="empty"><div class="t">收件箱已清空</div><div class="s">可继续问 AI 查档案，或查看事项。</div></div>`}
      </div></div>
    </aside>
    <section>
      ${p ? `<div class="card mb12"><div class="card-h"><span class="t">${esc(p.title)}</span><span class="tag ${p.source==='sample-low-quality'?'fail':'brand'}" style="margin-left:auto">综合置信 ${Math.round((p.confidence||0)*100)}%</span></div><div class="card-b">
        <div class="grid g-2">
          <div class="preview-pane"><div class="doc-mock"><h4>${esc(p.title)}</h4><div class="ln l"></div><div class="ln m"></div><div class="ln l"></div><div class="ln s"></div><div class="ln m"></div><div class="doc-meta">${esc(p.preview)}</div><div class="stamp">${esc(p.rawType)}</div></div></div>
          <div><div class="stage-list">${stages.map((s,i)=>`<div class="stage ${stageIdx>i?'done':(stageIdx===i?'active':'')}"><div class="stage-ic">${stageIdx>i?'':i+1}</div><div style="min-width:0"><div style="font-size:13px;font-weight:850">${s[0]}</div><div class="muted" style="font-size:11px">${s[1]}</div></div>${stageIdx===i?'<div class="spinner"></div>':''}</div>`).join('')}</div>${state.aiStage==='idle'?`<button class="btn btn-primary btn-block mt12" id="start-ai">开始整理资料</button>`:''}${state.aiStage==='done'?`<button class="btn btn-primary btn-block mt12" data-jump="library">查看新档案</button>`:''}</div>
        </div>
      </div></div>
      ${aiJudgeCardHTML(p)}
      ${(state.aiStage==='extracting'||state.aiStage==='judging'||state.aiStage==='confirm'||state.aiStage==='done') ? fieldConfirmHTML(p) : ''}` : `<div class="card"><div class="empty"><div class="t">没有待处理资料</div><div class="s">可继续接收资料，或前往档案查看已有家庭资料。</div></div></div>`}
    </section>
  </div>`;
}

function queueItemHTML(item){
  const c = catColor(item.category);
  const active = item.id === state.currentPendingId;
  return `<div class="queue-item ${active?'active':''}" data-pending="${item.id}">
    <div class="queue-top"><div class="queue-ic" style="background:${c.bg};color:${c.color}">${c.ico}</div><div style="min-width:0;flex:1"><div class="queue-title">${esc(item.title)}</div><div class="queue-sub">${esc(item.rawType)}</div></div></div>
    <div class="queue-meta"><span class="tag ${item.source==='sample-low-quality'?'fail':'brand'}">核验 ${Math.round((item.confidence||0)*100)}%</span>${item.lowConfidence?'<span class="tag fail">需核验</span>':''}</div>
  </div>`;
}

function aiJudgeCardHTML(p){
  if(!p || state.aiStage==='idle' || state.aiStage==='scanning') return '';
  const raw = p.detectedFields.filter(x=>x.source==='ocr').map(x=>x.k).join('') || '';
  const inferred = p.detectedFields.filter(x=>x.source==='inferred').map(x=>x.k).join('') || '';
  const manual = p.detectedFields.filter(x=>x.source==='manual').map(x=>x.k).join('') || '';
  const confirm = p.detectedFields.filter(x=>fieldStatus(x)!=='ok').map(x=>x.k).join('') || '暂无';
  return `<div class="ai-card mb12">
    <div class="flex between gap12 wrap"><div><div class="tag warn">AI 判断</div><div style="font-size:16px;font-weight:900;margin-top:8px">我识别到：${esc(p.ai.type)}</div></div></div>
    <div class="ai-card-grid mt12">
      <div class="ai-judge-item"><div class="k">原始识别字段</div><div class="v">${esc(raw)}</div></div>
      <div class="ai-judge-item"><div class="k">AI 推断字段</div><div class="v">${esc(inferred)}</div></div>
      <div class="ai-judge-item"><div class="k">人工确认字段</div><div class="v">${esc(manual)}</div></div>
      <div class="ai-judge-item"><div class="k">需要确认</div><div class="v">${esc(confirm)}</div></div>
      <div class="ai-judge-item"><div class="k">归档理由</div><div class="v">${esc(p.ai.reason)}</div></div>
      <div class="ai-judge-item"><div class="k">发现的风险</div><div class="v">${esc(p.ai.risk)}</div></div>
      <div class="ai-judge-item"><div class="k">建议位置</div><div class="v">${esc(p.ai.location)}</div></div>
      <div class="ai-judge-item"><div class="k">隐私建议</div><div class="v">${esc(p.ai.privacy)}</div></div>
      <div class="ai-judge-item"><div class="k">追问</div><div class="v">${p.ai.questions.map(esc).join('<br>')}</div></div>
    </div>
  </div>`;
}

function fieldConfirmHTML(p){
  const editable = state.aiStage === 'confirm';
  const low = p.lowConfidence && (editable || state.aiStage==='done') ? `<div class="low-card mb12"><div class="low-title">低置信度场景：${esc(p.title)}</div><div class="low-grid"><div><strong>模糊原因</strong><br>${esc(p.lowConfidence.reason)}</div><div><strong>缺失字段</strong><br>${p.lowConfidence.missing.map(esc).join('、')}</div><div><strong>AI 追问</strong><br>${p.lowConfidence.questions.map(esc).join('<br>')}</div><div><strong>补全后档案名</strong><br>${esc(p.lowConfidence.archiveName)}</div></div><div class="notice mt10">${esc(p.lowConfidence.manual)}<br>${esc(p.lowConfidence.trace)}</div></div>` : '';
  return `<div class="card"><div class="card-h"><span class="t">字段结果与人工确认</span></div><div class="card-b">
    ${low}
    <div class="field-grid">${p.detectedFields.map((field,i)=>fieldHTML(field,i,editable)).join('')}</div>
    ${editable ? `<div class="flex gap8 wrap mt12"><button class="btn btn-primary" id="confirm-fields">确认并写入档案</button><button class="btn btn-outline" id="restart-ai">重新识别</button></div>` : ''}
    ${state.aiStage==='done' ? `<div class="notice info mt12">已生成档案：${esc(state.lastArchiveResult?.title || p.title)}。提醒、AI 解释、记忆位置和操作日志已写入本地状态。</div>` : ''}
  </div></div>`;
}

function fieldHTML(field, index, editable){
  const st = fieldStatus(field);
  const cls = st==='fail' ? 'fail' : st==='warn' ? 'warn' : '';
  const color = st==='fail' ? 'var(--danger)' : st==='warn' ? 'var(--warn)' : 'var(--ok)';
  return `<div class="field ${cls}"><div class="field-k">${esc(field.k)} ${st==='fail'?'· 必须补全':st==='warn'?'· 待确':''}</div>
    ${editable ? `<input data-fidx="${index}" value="${esc(field.v)}" placeholder="请输入${esc(field.k)}" />` : `<div class="field-v">${esc(field.v || '')}</div>`}
    <div class="field-source">${sourceLabel(field.source)} · ${confidenceLabel(field.confidence || 0)}</div>
    <div class="conf-bar"><div class="conf-track"><i style="width:${Math.round((field.confidence||0)*100)}%;background:${color}"></i></div><span class="conf-pct" style="color:${color}">${Math.round((field.confidence||0)*100)}%</span></div>
    <div class="field-reason">${st==='fail'?'AI 无法可靠读取，需要人工补全':st==='warn'?'AI 有候选值，但建议核对':'字段可信度充足'}</div>
  </div>`;
}

function moneyNumbers(text=''){
  const matches = String(text).match(/¥\s*[\d,]+(?:\.\d+)?/g) || [];
  return matches.map(token=>Number(token.replace(/[¥,\s]/g,''))).filter(Number.isFinite);
}

function archiveExposureAmount(a){
  const values = [
    ...moneyNumbers(a.amountOrTerm),
    ...moneyNumbers(a.rawPreview),
    ...(a.events || []).flatMap(e=>moneyNumbers(e.amount || e.desc))
  ];
  return values.length ? Math.max(...values) : 0;
}

function formatMoneyShort(amount){
  if(!amount) return '待量化';
  if(amount >= 10000) return `¥${(amount / 10000).toFixed(amount >= 100000 ? 0 : 1)}万`;
  return `¥${amount.toLocaleString('zh-CN')}`;
}

function archiveEvidenceScore(a){
  const fieldScore = Math.round(((a.fields || []).reduce((sum, field)=>sum + (field.confidence || 0), 0) / Math.max(1, (a.fields || []).length)) * 100);
  const evidenceScore = Math.min(100, (a.evidence || []).length * 18);
  const statusPenalty = (a.status === 'supplement' || a.status === 'supplement_in_progress') ? 22 : 0;
  const lowPenalty = a.lowConfidence ? 15 : 0;
  return Math.max(35, Math.min(99, Math.round(fieldScore * .62 + evidenceScore * .38 - statusPenalty - lowPenalty)));
}

function archiveRiskText(a){
  const nearest = nearestReminder(a);
  if(a.riskLevel === 'high') return nearest ? `${nearest.days} 天内影响处理` : '高风险待处理';
  if(a.status === 'supplement' || a.status === 'supplement_in_progress') return '证据缺口影响办理';
  if(nearest && nearest.days <= 45) return `${nearest.days} 天后到期`;
  if(nearest) return `${nearest.days} 天后提醒`;
  return '已沉淀为低扰动资料';
}

function archiveServiceRoute(a){
  const text = `${a.category} ${a.title} ${a.rawType}`;
  if(/家电|维修/.test(text)) return '维修材料包';
  if(/保险|车险|年检/.test(text)) return '续保/理赔材料';
  if(/房屋|合同|物业|水电/.test(text)) return '退租/缴费证据';
  if(/学籍|入学|儿童/.test(text)) return '入学材料包';
  if(/医疗|报销|复诊/.test(text)) return '复诊/报销材料';
  if(/证件|旅行/.test(text)) return '证照续期提醒';
  return '家庭交接材料';
}

function archiveAssetProfile(a){
  const amount = archiveExposureAmount(a);
  const score = archiveEvidenceScore(a);
  const service = archiveServiceRoute(a);
  const paid = amount >= 10000 || a.riskLevel === 'high' ? '高付费价值' : score < 75 ? '补证可收费' : '订阅留存';
  return {
    amount,
    exposure: formatMoneyShort(amount),
    evidenceScore: score,
    risk: archiveRiskText(a),
    service,
    paid,
    proof: `${score}% 完整`
  };
}

function assetLedgerHeroHTML(list){
  const total = state.archives.length;
  const exposure = list.reduce((sum, a)=>sum + archiveExposureAmount(a), 0);
  const protectedCount = list.filter(a=>archiveEvidenceScore(a) >= 82).length;
  const serviceReady = list.filter(a=>archiveEvidenceScore(a) >= 70 && archiveServiceRoute(a)).length;
  return `<section class="card asset-ledger-hero mb12"><div class="card-b">
    <div class="asset-ledger-main">
      <div>
        <span class="tag brand">家庭资产 OS</span>
        <h2>把家庭资产变成可处理的证据账本</h2>
        <p>不是把文件堆起来，而是把金额、期限、空间位置、责任人、证据完整度和服务入口连成一张可运营的家庭资产图谱。</p>
      </div>
      <div class="asset-ledger-actions">
        <button class="btn btn-primary btn-sm" data-jump="archive">补齐新资料</button>
        <button class="btn btn-outline btn-sm" data-jump="home">查看风险运营台</button>
      </div>
    </div>
    <div class="asset-ledger-grid">
      <div><b>${total}</b><span>家庭资产/证据档案</span></div>
      <div><b>${formatMoneyShort(exposure)}</b><span>当前筛选可量化金额</span></div>
      <div><b>${protectedCount}</b><span>证据完整度较高</span></div>
      <div><b>${serviceReady}</b><span>可生成服务材料包</span></div>
    </div>
  </div></section>`;
}

function assetValueMatrixHTML(list){
  const rows = [
    ['找不到凭证', list.filter(a=>archiveEvidenceScore(a) < 78).length, '补证、归档、追溯来源，可形成单次材料整理收费'],
    ['到期会损失', list.filter(a=>(a.reminders || []).some(r=>r.status !== 'done' && daysUntil(r.date) >= 0 && daysUntil(r.date) <= 90)).length, '订阅提醒、风险周报和家人交接降低遗忘成本'],
    ['需要外部办理', list.filter(a=>/材料|续保|理赔|退租|报销|复诊|维修/.test(archiveServiceRoute(a))).length, '用户授权后输出最小材料包，服务分成有边界'],
    ['金额责任明确', list.filter(a=>archiveExposureAmount(a) >= 1000).length, '押金、保费、维修和大额采购具备清晰付费动机']
  ];
  return `<section class="card asset-value-card mb12"><div class="card-h"><span class="t">真实付费痛点</span><span class="sub">按损失、证据和服务转化排序</span></div><div class="card-b">
    <div class="asset-value-grid">${rows.map(([title,count,desc])=>`<div><strong>${esc(title)} <em>${count}</em></strong><span>${esc(desc)}</span></div>`).join('')}</div>
  </div></section>`;
}

function viewLibrary(){
  const answer = naturalAnswer(state.librarySearch);
  let list = filteredArchives();
  const members = ['all', ...new Set(state.archives.map(a=>a.familyMember))];
  const recentCount = state.lastCameraResult?.changedIds?.length || 0;
  const searchZone = answer?.archive?.memoryZone || (state.librarySearch && list[0]?.memoryZone) || null;
  const isSpaceMode = state.libraryView === 'space';
  const showArchiveCards = !isSpaceMode;
  const activeLibraryZone = state.spaceFilter || searchZone || state.highlightedZone || 'living';
  const primaryFilters = [['all','全部'],['expiring','近期到期'],['supplement','待补资料'],['high','高风险']]
    .map(([k,v])=>`<button class="chip ${state.libraryFilter===k?'active':''}" data-filter="${k}">${v}</button>`)
    .join('');
  const moreFilters = `<button class="chip lib-filter-more-trigger ${state.libraryMoreOpen?'active':''}" data-toggle-library-more aria-expanded="${state.libraryMoreOpen ? 'true' : 'false'}">更多筛选</button>`;
  const moreFilterPanel = state.libraryMoreOpen ? `<div class="lib-filter-popover">
    <div class="lib-filter-section">
      <span class="filter-group-title">成员</span>
      <div class="lib-filter-options">${members.map(m=>`<button class="chip ${state.libraryMember===m?'active':''}" data-member-filter="${esc(m)}">${m==='all'?'全部成员':esc(m)}</button>`).join('')}</div>
    </div>
    <div class="lib-filter-section">
      <span class="filter-group-title">类型</span>
      <div class="lib-filter-options">${Object.keys(CATEGORIES).map(cat=>`<button class="chip ${state.libraryFilter===cat?'active':''}" data-filter="${cat}">${cat}</button>`).join('')}</div>
    </div>
  </div>` : '';
  return `${assetLedgerHeroHTML(list)}${!isSpaceMode ? assetValueMatrixHTML(list) : ''}
  <div class="card mb12 ${isSpaceMode?'library-space-toolbar-card':''}"><div class="card-b">
    <div class="library-toolbar mt12">
      <div class="library-filter-group">
        <div class="chips library-filter-row">${primaryFilters}${moreFilters}</div>
        ${moreFilterPanel}
      </div>
      <div class="segmented"><button class="seg-btn ${state.libraryView==='list'?'active':''}" data-library-view="list">全量档案 ${state.archives.length}</button><button class="seg-btn ${state.libraryView==='space'?'active':''}" data-library-view="space">空间定位</button></div>
    </div>
    ${isSpaceMode ? `<div class="notice info mt12">空间定位只展示当前区域的代表档案和风险位置；完整数据仍在“全量档案 ${state.archives.length}”中。</div>` : ''}
  </div></div>
  ${answer ? searchAnswerHTML(answer) : ''}
  ${searchZone ? renderMemorySpace({context:'search', compact:true, activeZone:searchZone}) : ''}
  ${state.libraryRecentScanOnly && recentCount ? `<div class="filter-banner mb12"><span>褰撳墠浠呮樉绀烘湰娆℃壂鎻忔洿鏂扮殑 ${recentCount} 浠芥。妗堬紝鏂板綊浣嶄笌缃俊鎻愬崌宸叉爣鍑恒€?</span><button class="btn btn-outline btn-sm" data-clear-recent-scan>鏌ョ湅鍏ㄩ儴</button></div>` : ''}
  ${state.spaceFilter ? `<div class="filter-banner mb12"><span>来自家庭记忆空间筛选：${zoneName(state.spaceFilter)}，当前显示 ${list.length} 份关联档案</span><button class="btn btn-outline btn-sm" data-clear-space-filter>清除筛选</button></div>` : ''}
  ${isSpaceMode ? `<div class="mb12">${librarySpaceOverviewHTML(zoneStats(), activeLibraryZone)}</div>` : ''}
  ${showArchiveCards ? `<div class="archive-grid">${list.length ? list.map(a=>archiveCardHTML(a, state.librarySearch)).join('') : `<div class="card"><div class="empty"><div class="t">未找到匹配档案</div><div class="s">试试“洗衣机保修在哪”或清除空间筛选。</div></div></div>`}</div>` : ''}`;
}

function librarySummaryHTML(list){
  const total = state.archives.length;
  const visible = list.length;
  const high = list.filter(a=>a.riskLevel === 'high').length;
  const supplement = list.filter(a=>a.status === 'supplement' || a.status === 'supplement_in_progress').length;
  const due = list.reduce((sum,a)=>sum + (a.reminders || []).filter(r=>r.status !== 'done' && daysUntil(r.date) >= 0 && daysUntil(r.date) <= 90).length,0);
  const exposure = list.reduce((sum,a)=>sum + archiveExposureAmount(a),0);
  const ready = list.filter(a=>archiveEvidenceScore(a) >= 80).length;
  return `<div class="library-summary">
    <div class="library-summary-item"><strong>${visible}</strong><span>当前显示 / ${total}</span></div>
    <div class="library-summary-item"><strong>${formatMoneyShort(exposure)}</strong><span>可量化资产/责任</span></div>
    <div class="library-summary-item"><strong>${ready}</strong><span>证据完整可交接</span></div>
    <div class="library-summary-item"><strong>${high + supplement + due}</strong><span>风险/到期/补证</span></div>
  </div>`;
}

function filteredArchives(){
  let list = state.archives.slice();
  if(state.libraryRecentScanOnly){
    const ids = new Set(state.lastCameraResult?.changedIds || []);
    list = list.filter(a=>ids.has(a.id));
  }
  if(state.libraryFilter === 'expiring') list = list.filter(a=>a.reminders.some(r=>r.status!=='done' && daysUntil(r.date)>=0 && daysUntil(r.date)<=90));
  else if(state.libraryFilter === 'supplement') list = list.filter(a=>a.status==='supplement' || a.status==='supplement_in_progress');
  else if(state.libraryFilter === 'high') list = list.filter(a=>a.riskLevel==='high');
  else if(state.libraryFilter !== 'all') list = list.filter(a=>a.category===state.libraryFilter);
  if(state.libraryMember !== 'all') list = list.filter(a=>a.familyMember===state.libraryMember);
  if(state.spaceFilter) list = list.filter(a=>a.memoryZone===state.spaceFilter);
  if(state.librarySearch) list = list.filter(a=>archiveSearchHit(a, state.librarySearch));
  return list;
}

function archiveCardHTML(a, query=''){
  const c = catColor(a.category);
  const hit = getArchiveSearchMatches(a, query);
  const fields = [a.amountOrTerm, displayLocation(a)].filter(Boolean).slice(0,2);
  const nearest = nearestReminder(a);
  const asset = archiveAssetProfile(a);
  const scanUpdate = recentCameraUpdateForArchive(a.id);
  const lowConf = a.lowConfidence;
  const cardClass = lowConf ? 'arc-card archive-low-confidence' : 'arc-card';
  const confidenceBadge = lowConf ? `<span class="confidence-badge">⚠️ 置信度 ${Math.round((a.confidence||0)*100)}%</span>` : '';
  return `<article class="${cardClass} arc-risk-${a.riskLevel || 'none'}" data-open="${a.id}">
    ${lowConf ? `<div class="confidence-alert"><span class="icon">⚠️</span><strong>识别置信度 ${Math.round((a.confidence||0)*100)}% - 需要人工确认</strong></div>` : ''}
    <div class="arc-head"><div class="arc-ic" style="background:${c.bg};color:${c.color}">${c.ico}</div><div style="flex:1;min-width:0"><div class="arc-title">${esc(a.title)}</div><div class="arc-meta">${esc(a.familyMember)} · ${esc(a.rawType)}</div></div><span class="tag ${riskTag(a.riskLevel).c}">${riskTag(a.riskLevel).t}</span>${confidenceBadge}</div>
    ${lowConf ? `<div class="missing-fields"><h4>无法识别的字段：</h4><ul>${lowConf.missing.map(m=>`<li>${esc(m)}</li>`).join('')}</ul></div>` : ''}
    <div class="arc-fields">${fields.map(x=>`<span class="arc-field">${esc(x)}</span>`).join('')}</div>
    <div class="asset-card-grid">
      <span><b>价值</b>${esc(asset.exposure)}</span>
      <span><b>证据</b>${esc(asset.proof)}</span>
      <span><b>风险</b>${esc(asset.risk)}</span>
      <span><b>服务</b>${esc(asset.service)}</span>
    </div>
    ${hit.length ? `<div class="arc-why">${hit.map(esc).join(' · ')}</div>` : `<div class="arc-why">${esc(a.ai.reason)}</div>`}
    <div class="arc-foot"><span class="tag ${statusTag(a.status).c}">${statusTag(a.status).t}</span>${nearest?`<span class="tag ${reminderPriority(nearest.days).c}">${nearest.days} 天后</span>`:''}<span class="tag gray">${esc(asset.paid)}</span></div>
    ${lowConf ? `<div class="confidence-actions"><button class="btn btn-sm btn-primary" data-action="supplement-${a.id}">补拍照片</button><button class="btn btn-sm btn-outline" data-action="manual-input-${a.id}">手动输入</button></div>` : ''}
  </article>`;
}

function nearestReminder(a){
  const rs = (a.reminders||[]).filter(r=>r.status!=='done' && daysUntil(r.date)>=0).map(r=>({...r,days:daysUntil(r.date)})).sort((x,y)=>x.days-y.days);
  return rs[0] || null;
}

/* Damaged archive/timeline/risk/drawer/import block disabled after encoding recovery.
function viewTimeline(){
  const items = [];
  state.archives.forEach(a=>{
    a.events.forEach(e=>items.push({...e, kind:'event', archive:a}));
    a.reminders.filter(r=>r.status!=='done').forEach(r=>items.push({date:r.date,type:'提醒',kind:'reminder',desc:r.action,member:a.familyMember,amount:'',archive:a}));
  });
  items.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  const filter = state.timelineFilter || 'all';
  const filtered = items.filter(item=>{
    if(filter === 'all') return true;
    if(filter === 'risk') return item.kind==='reminder' || item.archive.riskLevel==='high' || item.archive.status==='supplement';
    if(filter === 'money') return !!item.amount || /¥|押金|缴费|报销|采购|保险|房屋/.test(item.archive.category + item.desc);
    if(filter === 'location') return !!item.archive.memoryZone;
    return item.type === filter || item.archive.category === filter;
  });
  const clusters = timelineClusters(filtered);
  const summary = timelineSummary(filtered);
  const filters = [
    ['all','全部'],['risk','风险提醒'],['money','金额/合同'],['location','有记忆位'],
    ['购买','购买'],['维修','维修'],['复诊','复诊'],['提醒','提醒']
  ];
  return `<div class="timeline-shell">
    <aside class="card timeline-nav"><div class="card-b">
      <div class="timeline-title-main">生命周期记录</div>
      <div class="timeline-note">按事件簇看证据链，点击事件打开档案详情 /div>
      <div class="timeline-filter-list">
        ${filters.map(([k,v])=>`<button class="timeline-filter ${filter===k?'active':''}" data-timeline-filter="${k}"><span>${v}</span><strong>${timelineFilterCount(items,k)}</strong></button>`).join('')}
      </div>
    </div></aside>
    <section class="timeline-clusters">
      ${clusters.length ? clusters.map(cluster=>timelineClusterHTML(cluster)).join('') : `<div class="card"><div class="empty"><div class="t">没有匹配事件</div><div class="s">切换左侧筛选查看完整生命周期 /div></div></div>`}
    </section>
    <aside class="card timeline-evidence"><div class="card-b">
      <div class="timeline-title-main">证据链摘 /div>
      <div class="timeline-summary-grid">
        <div><strong>${summary.archives}</strong><span>关联档案</span></div>
        <div><strong>${summary.risk}</strong><span>风险事件</span></div>
        <div><strong>${summary.locations}</strong><span>记忆位置</span></div>
        <div><strong>${summary.members}</strong><span>家庭成员</span></div>
      </div>
      <div class="timeline-insight">
        <div class="inspector-title">AI 归纳</div>
        <div class="inspector-sub">${esc(summary.insight)}</div>
      </div>
    </div></aside>
  </div>`;
}

function timelineClusters(items){
  const groups = {};
  items.forEach(item=>{
    const quarter = Math.ceil(Number(item.date.slice(5,7))/3);
    const key = `${item.date.slice(0,4)} Q${quarter}`;
    (groups[key] ||= []).push(item);
  });
  return Object.keys(groups).sort().reverse().map(key=>({key, items:groups[key]}));
}

function timelineFilterCount(items, filter){
  if(filter === 'all') return items.length;
  return items.filter(item=>{
    if(filter === 'risk') return item.kind==='reminder' || item.archive.riskLevel==='high' || item.archive.status==='supplement';
    if(filter === 'money') return !!item.amount || /¥|押金|缴费|报销|采购|保险|房屋/.test(item.archive.category + item.desc);
    if(filter === 'location') return !!item.archive.memoryZone;
    return item.type === filter || item.archive.category === filter;
  }).length;
}

function timelineSummary(items){
  const archives = new Set(items.map(i=>i.archive.id));
  const members = new Set(items.map(i=>i.member || i.archive.familyMember));
  const locations = new Set(items.map(i=>i.archive.memoryZone).filter(Boolean));
  const risk = items.filter(i=>i.kind==='reminder' || i.archive.riskLevel==='high' || i.archive.status==='supplement').length;
  const next = items.find(i=>i.kind==='reminder' && daysUntil(i.date)>=0);
  return {
    archives: archives.size,
    members: members.size,
    locations: locations.size,
    risk,
    insight: next ? `最近需要关注'{next.archive.title}」：${next.desc}，位置为 ${displayLocation(next.archive)}。` : '当前筛选范围内没有未完成提醒'
  };
}

function timelineClusterHTML(cluster){
  const top = cluster.items.slice(0,4);
  const more = cluster.items.slice(4);
  const riskCount = cluster.items.filter(i=>i.kind==='reminder' || i.archive.riskLevel==='high' || i.archive.status==='supplement').length;
  return `<article class="card timeline-cluster">
    <div class="timeline-cluster-head">
      <div><div class="timeline-cluster-title">${esc(cluster.key)}</div><div class="timeline-note">${cluster.items.length} 个事'· ${riskCount} 个风险相 /div></div>
      <span class="tag ${riskCount?'warn':'ok'}">${riskCount?'需关注':'稳定'}</span>
    </div>
    <div class="timeline-event-grid">
      ${top.map(timelineEventCardHTML).join('')}
    </div>
    ${more.length ? `<details class="timeline-more"><summary>展开其余 ${more.length} 个事 /summary><div class="timeline-event-grid mt10">${more.map(timelineEventCardHTML).join('')}</div></details>` : ''}
  </article>`;
}

function timelineEventCardHTML(item){
  const c = catColor(item.archive.category);
  const pri = item.kind==='reminder' ? reminderPriority(daysUntil(item.date)) : riskTag(item.archive.riskLevel);
  return `<button class="timeline-event-card" data-open="${item.archive.id}">
    <span class="timeline-event-type" style="background:${c.bg};color:${c.color}">${esc(item.type.slice(0,2))}</span>
    <span class="timeline-event-main">
      <strong>${esc(item.desc)}</strong>
      <small>${esc(item.date)} · ${esc(item.member || item.archive.familyMember)}${item.amount?' · '+esc(item.amount):''}</small>
      <em>${esc(item.archive.title)} · ${esc(displayLocation(item.archive))}</em>
    </span>
    <span class="tag ${pri.c}">${item.kind==='reminder' ? (daysUntil(item.date)>=0 ? daysUntil(item.date)+' 天后' : '已过') : pri.t}</span>
  </button>`;
}

function getRiskItems(){
  const pending = [];
  const progress = [];
  const done = [];
  state.archives.forEach(a=>{
    if(a.status==='supplement' || a.status==='supplement_in_progress'){
      const item = {type:'supplement', archive:a, title:'补齐原始资料', days:999, impact:'证据不完整会影响后续报销、入学或交接', next:'补齐缺失材料并恢复为已归档状态', status:a.status};
      (a.status==='supplement_in_progress' ? progress : pending).push(item);
    }
    a.reminders.forEach(r=>{
      const days = daysUntil(r.date);
      const item = {type:'reminder', archive:a, reminder:r, title:r.action, days, impact:days<=30?'临近关键日期，需要优先处理':'需要提前安排，避免临期遗漏', next:'打开详情后处理该提醒', status:r.status};
      if(r.status==='done') done.push(item);
      else if(r.status==='in_progress') progress.push(item);
      else if(days>=0) pending.push(item);
    });
  });
  pending.sort((a,b)=>a.days-b.days);
  progress.sort((a,b)=>a.days-b.days);
  done.sort((a,b)=>String(b.reminder?.date || b.archive.date).localeCompare(String(a.reminder?.date || a.archive.date)));
  return {pending, progress, done};
}

function highestPriority(){
  const risk = getRiskItems();
  return risk.pending[0] || risk.progress[0] || null;
}

function openRiskCount(){
  const risk = getRiskItems();
  return risk.pending.length + risk.progress.length;
}

function viewRisk(){
  const risk = getRiskItems();
  const tab = ['pending','progress','done'].includes(state.riskTab) ? state.riskTab : 'pending';
  const focus = highestPriority();
  return `<div class="risk-shell">
    <section class="card risk-board"><div class="card-h"><span class="t">待办提醒</span><div class="segmented" style="margin-left:auto"><button class="seg-btn ${tab==='pending'?'active':''}" data-risk-tab="pending">待处'${risk.pending.length}</button><button class="seg-btn ${tab==='progress'?'active':''}" data-risk-tab="progress">处理'${risk.progress.length}</button><button class="seg-btn ${tab==='done'?'active':''}" data-risk-tab="done">已完'${risk.done.length}</button></div></div><div class="card-b">
      ${riskTabHTML(risk[tab], tab)}
    </div></section>
    <aside class="card risk-context"><div class="card-b">
      <div class="inspector-title">下一 /div>
      <div class="inspector-sub">${focus ? `${esc(focus.title)} · ${esc(focus.impact)}` : '今天没有必须马上处理的事，可以顺手补齐资料或交接说明'}</div>
      ${focus ? `<button class="btn btn-primary btn-block mt12" data-open="${focus.archive.id}">先处理这 /button>` : `<button class="btn btn-outline btn-block mt12" data-jump="archive">继续归档</button>`}
      <div class="risk-policy-list">
        <div><strong>1</strong><span>先看快到期和缺资料的事 /span></div>
        <div><strong>2</strong><span>隐私资料只显示到房间或遮罩，不暴露柜格 /span></div>
        <div><strong>3</strong><span>处理后自动留下记录，下次不用重新想 /span></div>
      </div>
    </div></aside>
  </div>`;
}

function riskTabHTML(items, tab){
  if(!items.length) return `<div class="empty"><div class="t">${tab==='done'?'还没有完成记':'当前没有事项'}</div><div class="s">处理后会自动留在详情和时间线里 /div></div>`;
  const buckets = riskBuckets(items, tab);
  return `<div class="risk-bucket-list">${buckets.map(bucket=>`<section class="risk-bucket">
    <div class="risk-bucket-head"><div><strong>${esc(bucket.title)}</strong><span>${esc(bucket.sub)}</span></div><em>${bucket.items.length}</em></div>
    <div class="risk-compact-list">${bucket.items.map(item=>{
    const a = item.archive;
    const pri = item.days===999 ? {c:'brand',t:'待补资料'} : reminderPriority(item.days);
    return `<div class="risk-card" data-open="${a.id}"><div class="risk-card-head"><div><div class="risk-title">${esc(item.title)}</div><div class="risk-sub">${esc(a.title)} · ${esc(a.familyMember)}</div></div><span class="tag ${pri.c}">${item.days===999?'待补资料':displayRiskDue(item)}</span></div>
      <div class="risk-card-meta"><span>${esc(displayLocation(a))}</span><span>${esc(item.next)}</span><span>${esc(a.operations[a.operations.length-1]?.action || '暂无动作')}</span></div></div>`;
  }).join('')}</div></section>`).join('')}</div>`;
}

function displayRiskDue(item){
  if(item.days === 999) return '待补资料';
  if(item.days < 0) return '已过';
  if(item.days === 0) return '今天';
  return `${item.days} 天后`;
}

function riskBuckets(items, tab){
  if(tab === 'done') return groupRiskByMonth(items);
  if(tab === 'progress') return [
    {title:'正在处理', sub:'已经开始，继续把它收尾', items:items.filter(i=>i.type==='reminder')},
    {title:'缺资', sub:'补齐后再归档', items:items.filter(i=>i.type==='supplement')}
  ].filter(b=>b.items.length);
  return [
    {title:'先处', sub: 15 天内或已过期', items:items.filter(i=>i.days!==999 && i.days<=15)},
    {title:'补齐资料', sub:'缺一页、缺一张先补上', items:items.filter(i=>i.days===999)},
    {title:'近期安排', sub: 16-45 天内需要看一', items:items.filter(i=>i.days!==999 && i.days>15 && i.days<=45)},
    {title:'后面再看', sub:'已有提醒，先不打', items:items.filter(i=>i.days!==999 && i.days>45)}
  ].filter(b=>b.items.length);
}

function groupRiskByMonth(items){
  const groups = {};
  items.forEach(item=>{
    const date = item.reminder?.date || item.archive.date || TODAY;
    const key = date.slice(0,7);
    (groups[key] ||= []).push(item);
  });
  return Object.keys(groups).sort().reverse().map(key=>({title:key, sub:'已处理记', items:groups[key]}));
}

function openDrawer(id){
  const a = state.archives.find(x=>x.id===id);
  if(!a) return;
  state.drawerArchiveId = id;
  state.drawerEdit = false;
  $('#drawer-title').textContent = a.title;
  renderDrawer(a);
  $('#drawer').classList.add('open');
  $('#drawer-mask').classList.add('open');
}

function renderDrawer(a){
  const c = catColor(a.category);
  const nearest = nearestReminder(a);
  const main = drawerMainAction(a, nearest);
  $('#drawer-body').innerHTML = `<div class="drawer-sec drawer-hero">
    <div class="flex gap8 wrap"><span class="tag" style="background:${c.bg};color:${c.color}">${c.ico} ${a.category}</span><span class="tag ${riskTag(a.riskLevel).c}">${riskTag(a.riskLevel).t}</span><span class="tag ${statusTag(a.status).c}">${statusTag(a.status).t}</span><span class="tag gray">${a.id}</span></div>
    <div class="drawer-summary-grid mt12">
      <div class="summary-card"><span class="summary-k">家庭成员</span><span class="summary-v">${esc(a.familyMember)}</span></div>
      <div class="summary-card"><span class="summary-k">金额或期 /span><span class="summary-v">${esc(a.amountOrTerm)}</span></div>
      <div class="summary-card"><span class="summary-k">记忆位置</span><span class="summary-v">${esc(displayLocation(a))}</span></div>
      <div class="summary-card"><span class="summary-k">隐私等级</span><span class="summary-v">${PRIVACY_TEXT[a.locationPrivacy]} · 置信'${Math.round((a.locationConfidence||0)*100)}%</span></div>
    </div>
    <div class="mt12">
      <button class="btn btn-primary btn-sm" ${main.attr}>${esc(main.label)}</button>
      <button class="btn btn-outline btn-sm" data-export-archive="${a.id}">📄 导出</button>
    </div>
  </div>
  <div class="drawer-sec">${aiExplainHTML(a)}</div>
  ${a.lowConfidence ? `<div class="drawer-sec">${lowDetailHTML(a)}</div>` : ''}
  <div class="drawer-sec"><h5>证据材料</h5><div class="preview-pane" style="min-height:auto"><div class="doc-mock" style="max-width:none"><h4>${esc(a.title)}</h4><div class="ln l"></div><div class="ln m"></div><div class="ln s"></div><div class="doc-meta">${esc(a.rawPreview)}</div><div class="stamp">${esc(a.rawType)}</div></div></div><div class="chips mt10">${a.evidence.map(e=>`<span class="arc-field">${esc(e)}</span>`).join('')}</div></div>
  <div class="drawer-sec"><h5>字段结果</h5><div class="field-grid">${a.fields.map((field,i)=>drawerFieldHTML(field,i,state.drawerEdit)).join('')}</div><div class="flex gap8 wrap mt12">${state.drawerEdit?`<button class="btn btn-primary btn-sm" id="save-fields">保存修正</button><button class="btn btn-outline btn-sm" id="cancel-edit">取消</button>`:`<button class="btn btn-outline btn-sm" id="edit-fields">修正字段</button>`}</div></div>
  <div class="drawer-sec"><h5>提醒处理</h5>${a.reminders.map(r=>reminderRowHTML(r)).join('') || '<div class="notice">暂无提醒 /div>'}</div>
  <div class="drawer-sec"><h5>交接说明</h5><div class="notice info">${esc(a.handover)}</div></div>
  <div class="drawer-sec"><h5>生命周期记录</h5>${a.events.map(e=>`<div class="row"><div class="arc-ic" style="background:${c.bg};color:${c.color}">${esc(e.type.slice(0,1))}</div><div class="row-main"><div class="row-title">${esc(e.desc)}</div><div class="row-sub">${esc(e.date)} · ${esc(e.member)}${e.amount?' · '+esc(e.amount):''}</div></div><span class="tag gray">${esc(e.type)}</span></div>`).join('')}</div>
  <div class="drawer-sec"><h5>操作日志</h5>${a.operations.map(o=>`<div class="op-log"><span class="op-time">${esc(o.time)}</span><span><b>${esc(o.member)}</b> ${esc(o.action)}</span></div>`).join('')}</div>`;
  bindDrawerEvents(a);
}

function drawerMainAction(a, nearest){
  if(a.status==='supplement') return {label:'开始补资料', attr:`data-drawer-supp-progress="${a.id}"`};
  if(a.status==='supplement_in_progress') return {label:'标记已补', attr:`data-drawer-supp-complete="${a.id}"`};
  if(nearest) return {label:nearest.status==='in_progress'?'完成处理中提':'开始处理提', attr:nearest.status==='in_progress'?`data-drawer-reminder-done="${nearest.id}"`:`data-drawer-reminder-progress="${nearest.id}"`};
  return {label:'生成交接说明', attr:`data-drawer-action="handover"`};
}

function aiExplainHTML(a){
  return `<h5>AI 解释</h5><div class="ai-card"><div class="ai-card-grid">
    <div class="ai-judge-item"><div class="k">识别类型</div><div class="v">${esc(a.ai.type)}</div></div>
    <div class="ai-judge-item"><div class="k">归档理由</div><div class="v">${esc(a.ai.reason)}</div></div>
    <div class="ai-judge-item"><div class="k">风险判断</div><div class="v">${esc(a.ai.risk)}</div></div>
    <div class="ai-judge-item"><div class="k">归位建议</div><div class="v">${esc(displayLocation(a))}<br>${esc(a.locationSource || '')}</div></div>
    <div class="ai-judge-item"><div class="k">隐私建议</div><div class="v">${esc(a.ai.privacy)}</div></div>
    <div class="ai-judge-item"><div class="k">需要补 /div><div class="v">${a.ai.questions.map(esc).join('<br>')}</div></div>
  </div></div>`;
}

function lowDetailHTML(a){
  const l = a.lowConfidence;
  return `<h5>低置信度追溯</h5><div class="low-card"><div class="low-title">${esc(l.archiveName)}</div><div class="low-grid"><div><strong>模糊原因</strong><br>${esc(l.reason)}</div><div><strong>缺失字段</strong><br>${l.missing.map(esc).join('')}</div><div><strong>AI 追问</strong><br>${l.questions.map(esc).join('<br>')}</div><div><strong>人工补全</strong><br>${esc(l.manual)}</div></div><div class="notice mt10">${esc(l.trace)}</div></div>`;
}

function drawerFieldHTML(field,index,editable){
  const st = fieldStatus(field);
  const cls = st==='fail'?'fail':st==='warn'?'warn':'';
  const color = st==='fail'?'var(--danger)':st==='warn'?'var(--warn)':'var(--ok)';
  return `<div class="field ${cls}"><div class="field-k">${esc(field.k)}</div>${editable?`<input data-dfidx="${index}" value="${esc(field.v)}" />`:`<div class="field-v">${esc(field.v || '')}</div>`}<div class="field-source">${sourceLabel(field.source)} · ${confidenceLabel(field.confidence||0)}</div><div class="conf-bar"><div class="conf-track"><i style="width:${Math.round((field.confidence||0)*100)}%;background:${color}"></i></div><span class="conf-pct" style="color:${color}">${Math.round((field.confidence||0)*100)}%</span></div></div>`;
}

function reminderRowHTML(r){
  const d = daysUntil(r.date);
  const tag = r.status==='done' ? {c:'ok',t:'已完'} : r.status==='in_progress' ? {c:'brand',t:'处理'} : reminderPriority(d);
  return `<div class="row"><div class="arc-ic" style="background:var(--warn-soft);color:var(--warn)">'/div><div class="row-main"><div class="row-title">${esc(r.action)}</div><div class="row-sub">${esc(r.date)} · ${d>=0?d+' 天后':'已过'}</div></div><span class="tag ${tag.c}">${reminderStateText(r.status)}</span>${r.status==='pending'?`<button class="btn btn-outline btn-sm" data-drawer-reminder-progress="${r.id}">转处理中</button>`:''}${r.status==='in_progress'?`<button class="btn btn-outline btn-sm" data-drawer-reminder-done="${r.id}">完成</button>`:''}</div>`;
}

function closeDrawer(){
  $('#drawer').classList.remove('open');
  $('#drawer-mask').classList.remove('open');
  state.drawerEdit = false;
}

function refreshCurrent(a){
  saveState();
  render();
  if(a && $('#drawer').classList.contains('open') && state.drawerArchiveId===a.id) renderDrawer(a);
}

function bindDrawerEvents(a){
  $$('#drawer-body [data-drawer-reminder-progress]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation();
    const r = a.reminders.find(x=>x.id===btn.dataset.drawerReminderProgress);
    if(r && r.status==='pending'){
      r.status = 'in_progress';
      a.operations.push(op(nowStr(),'开始处理提醒：'+r.action,'当前用户'));
      refreshCurrent(a);
      toast('事项已转为处理中');
    }
  }));
  $$('#drawer-body [data-drawer-reminder-done]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation();
    const r = a.reminders.find(x=>x.id===btn.dataset.drawerReminderDone);
    if(r && r.status!=='done'){
      r.status = 'done';
      a.operations.push(op(nowStr(),'完成提醒'+r.action,'当前用户'));
      refreshCurrent(a);
      toast('提醒已完');
    }
  }));
  const suppProgress = $('[data-drawer-supp-progress]');
  if(suppProgress) suppProgress.addEventListener('click',()=>{
    a.status = 'supplement_in_progress';
    a.operations.push(op(nowStr(),'开始补资料','当前用户'));
    refreshCurrent(a);
    toast('已开始补资料');
  });
  const suppComplete = $('[data-drawer-supp-complete]');
  if(suppComplete) suppComplete.addEventListener('click',()=>{
    a.status = 'archived';
    a.operations.push(op(nowStr(),'补资料完成并归档','当前用户'));
    refreshCurrent(a);
    toast('资料已补');
  });
  const action = $('[data-drawer-action]');
  if(action) action.addEventListener('click',()=>{
    a.handover += `\n'{nowStr()}】已生成最新交接说明：${a.title}，位'${displayLocation(a)}，下一'${nearestReminder(a)?.action || '暂无提醒'}。`;
    a.operations.push(op(nowStr(),'生成家庭交接说明','当前用户'));
    refreshCurrent(a);
    toast('已生成交接说');
  });
  const edit = $('#edit-fields');
  if(edit) edit.addEventListener('click',()=>{ state.drawerEdit = true; renderDrawer(a); });
  const cancel = $('#cancel-edit');
  if(cancel) cancel.addEventListener('click',()=>{ state.drawerEdit = false; renderDrawer(a); });
  const save = $('#save-fields');
  if(save) save.addEventListener('click',()=>{
    const changed = [];
    $$('#drawer-body input[data-dfidx]').forEach(input=>{
      const idx = Number(input.dataset.dfidx);
      if(a.fields[idx] && a.fields[idx].v !== input.value){
        changed.push(a.fields[idx].k);
        a.fields[idx].v = input.value;
        a.fields[idx].source = 'manual';
        a.fields[idx].confidence = .95;
      }
    });
    if(changed.length) a.operations.push(op(nowStr(),'人工修正字段'+changed.join(''),'当前用户'));
    state.drawerEdit = false;
    refreshCurrent(a);
    toast(changed.length ? '字段修正已保' : '没有字段变化');
  });
}

function startAI(){
  const p = state.pending.find(x=>x.id===state.currentPendingId && !x._done);
  if(!p) return;
  state.aiStage = 'scanning';
  render();
  aiTimer = setTimeout(()=>{ state.aiStage='extracting'; render();
    aiTimer = setTimeout(()=>{ state.aiStage='judging'; render();
      aiTimer = setTimeout(()=>{ state.aiStage='confirm'; render(); aiTimer=null; },700);
    },700);
  },700);
}

function confirmFields(){
  const p = state.pending.find(x=>x.id===state.currentPendingId && !x._done);
  if(!p) return;
  $$('.field input[data-fidx]').forEach(input=>{
    const idx = Number(input.dataset.fidx);
    if(p.detectedFields[idx] && p.detectedFields[idx].v !== input.value){
      p.detectedFields[idx].v = input.value;
      p.detectedFields[idx].source = 'manual';
      p.detectedFields[idx].confidence = .95;
    }
  });
  const missing = p.detectedFields.filter(x=>fieldStatus(x)==='fail');
  if(missing.length){
    toast('仍有字段未补全：'+missing.map(x=>x.k).join(''));
    return;
  }
  const newArchive = buildArchiveFromPending(p);
  state.archives.push(newArchive);
  p._done = true;
  state.aiStage = 'done';
  state.lastArchiveResult = {id:newArchive.id, title:newArchive.title};
  saveState();
  render();
  toast('已写入档案库'+newArchive.title);
}

function buildArchiveFromPending(p){
  const fields = p.detectedFields.map(x=>({...x}));
  const newId = nextId('A', state.archives);
  const dateField = fields.find(x=>/日期|购买|报到|就诊/.test(x.k));
  const amountField = fields.find(x=>/金额|保费/.test(x.k));
  const expire = fields.find(x=>/到期|有效期|截止|报到/.test(x.k));
  const zone = p.category==='儿童学籍' ? 'study' : p.category==='旅行证件' ? 'safe' : p.category==='报销票据' ? 'living' : 'study';
  const privacy = ['儿童学籍','旅行证件','报销票据'].includes(p.category) ? (p.category==='旅行证件'?'hidden':'room_only') : 'public';
  const title = p.lowConfidence?.archiveName || p.title;
  return {
    id:newId, title, category:p.category, status:p.lowConfidence?'supplement':'archived', riskLevel:p.lowConfidence?'high':'medium',
    familyMember:fieldValue(fields,'家庭成员') || '全家', date:dateField?.v || TODAY, amountOrTerm:(amountField?.v || '未识别金') + (expire?.v ? ` / ${expire.k} ${expire.v}` : ''),
    sourceMaterial:p.rawType, rawType:p.rawType, rawPreview:p.preview, fields,
    evidence:['导入资料识别','AI 字段结果','人工确认记录'],
    events:[ev(dateField?.v || TODAY,'归档',`${title} 完成 AI 归档`,fieldValue(fields,'家庭成员') || '全家',amountField?.v || '')],
    reminders:expire?.v && !String(expire.v).includes('?') ? [rem(nextId('R', state.archives.flatMap(a=>a.reminders)), expire.v, `${p.category}关键日期提醒`, 'pending')] : [],
    operations:[op(nowStr(),'AI 归档生成档案','系统'), op(nowStr(),p.lowConfidence?'人工补全后写入档':'用户确认字段后写入档','当前用户')],
    handover:'本档案由 AI 归档流程生成，家庭成员可继续补充交接说明。',
    lowConfidence:p.lowConfidence ? clone(p.lowConfidence) : null,
    ai:clone(p.ai),
    memoryRoom:SPACE_ZONES.find(z=>z.id===zone).room,
    memoryZone:zone,
    memoryContainer:p.category==='家电保修'?'家电保修':p.category==='报销票据'?'报销待处理夹':p.category==='旅行证件'?'证件防水':'资料',
    locationPrivacy:privacy,
    locationConfidence:p.lowConfidence?.confidence || .76,
    locationSource:'AI 归位建议 + 人工确认',
    nextActions:['开始处理提','生成交接说明'],
    searchKeywords:[p.title,p.category,p.rawType]
  };
}

function fieldValue(fields,key){ return fields.find(f=>f.k===key || f.k.includes(key))?.v || ''; }

function handleFiles(files){
  const arr = [...files];
  if(!arr.length) return;
  arr.forEach(file=>{
    const name = file.name.replace(/\.[^.]+$/,'');
    const lowQuality = /模糊|低清晰|反光|折痕/.test(name);
    const category = name.includes('车险') ? '保险续费' : name.includes('入学') ? '儿童学籍' : name.includes('证件') ? '旅行证件' : name.includes('维修') ? '维修工单' : '家电保修';
    const detectedFields = [
      f('资料日期',TODAY,'ocr',.82),
      f('金额',lowQuality ? '' :  ¥199','ocr',lowQuality ? .2 : .79),
      f('家庭成员',category==='儿童学籍'?'小雨':'全家','manual',1)
    ];
    state.pending.push({id:nextId('P',state.pending), title:name, category, rawType:'导入资料识别', source:'import', preview:`导入文件 ${file.name} / 文件名初步识别`, detectedFields, confidence:lowQuality ? .48 : .78, ai:ai(category, ['字段由文件名初步识别'], '导入后先生成字段草案，等待用户确认', lowQuality?'存在待核验字段':'需要确认字段', zoneName('study'), '按资料类型决定是否隐藏位置', ['是否需要补充原件？']), lowConfidence:lowQuality?low('文件名标记为低清晰资料',['金额或日期'],['请人工补全字段'],'等待人工补全',name,'导入后进入 AI 归档流程'):null});
  });
  state.currentPendingId = state.pending[state.pending.length-1].id;
  saveState();
  render();
  toast(`已加'${arr.length} 份待归档资料`);
}

function addLowSample(){
  const pool = SEED_PENDING.filter(p=>p.source==='sample-low-quality');
  const existing = new Set(state.pending.filter(p=>!p._done).map(p=>p.title));
  const template = pool.find(p=>!existing.has(p.title)) || pool[0];
  const sample = clone(template);
  sample.id = nextId('P', state.pending);
  state.pending.push(sample);
  state.currentPendingId = sample.id;
  state.aiStage = 'idle';
  saveState();
  render();
  toast('已加入低置信度样');
}

*/

function timelineIncidentCardHTML(incident=activeIncident()){
  const archive = incidentArchive(incident);
  return `<article class="card timeline-incident-card">
    <div class="timeline-incident-head">
      <div>
        <div class="timeline-cluster-title">阳台水浸闭环</div>
        <div class="timeline-note">${esc(incident.title)} · ${incidentStatusText()} · 事件、证据、服务和结果会沉淀到同一条记录。</div>
      </div>
      <span class="tag ${incidentToneClass()}">${incidentStatusText()}</span>
    </div>
    <div class="timeline-incident-body">
      ${incidentPathRowsHTML(incident, {compact:true})}
      <div class="timeline-incident-steps">${incidentChainStepsHTML()}</div>
      <div class="timeline-incident-actions">
        <button class="btn btn-primary btn-sm" data-incident-locate>查看 2D 定位</button>
        ${archive ? `<button class="btn btn-outline btn-sm" data-open="${archive.id}">打开证据档案</button>` : ''}
        <button class="btn btn-outline btn-sm" data-jump="services">查看服务授权</button>
      </div>
    </div>
  </article>`;
}

function viewTimeline(){
  const items = [];
  state.archives.forEach(a=>{
    (a.events||[]).forEach(e=>items.push({...e, kind:e.serviceEventKey ? 'service' : 'event', archive:a}));
    (a.reminders||[]).filter(r=>r.status!=='done').forEach(r=>items.push({date:r.date,type:'提醒',kind:'reminder',desc:r.action,member:a.familyMember,amount:'',archive:a}));
  });
  items.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  const filter = state.timelineFilter || 'all';
  const filtered = items.filter(item=>{
    if(filter === 'all') return true;
    if(filter === 'risk') return item.kind==='reminder' || item.archive.riskLevel==='high' || item.archive.status==='supplement';
    if(filter === 'service') return item.kind==='service';
    if(filter === 'money') return !!item.amount || /押金|缴费|报销|采购|保险|房屋/.test(item.archive.category + item.desc);
    if(filter === 'location') return !!item.archive.memoryZone;
    return item.type === filter || item.archive.category === filter;
  });
  const clusters = timelineClusters(filtered);
  const summary = timelineSummary(filtered);
  const filters = [
    ['all','全部'],['risk','风险提醒'],['service','服务回执'],['money','金额/合同'],['location','有记忆位置'],
    ['购买','购买'],['维修','维修'],['复诊','复诊'],['提醒','提醒']
  ];
  return `<div class="timeline-shell">
    <aside class="card timeline-nav"><div class="card-b">
      <div class="timeline-title-main">时间线记录</div>
      <div class="timeline-note">按事件簇查看档案和事项留下的证据链，点击事件打开详情。</div>
      <div class="timeline-filter-list">
        ${filters.map(([k,v])=>`<button class="timeline-filter ${filter===k?'active':''}" data-timeline-filter="${k}"><span>${v}</span><strong>${timelineFilterCount(items,k)}</strong></button>`).join('')}
      </div>
    </div></aside>
    <section class="timeline-clusters">
      ${timelineIncidentCardHTML(activeIncident())}
      ${clusters.length ? clusters.map(cluster=>timelineClusterHTML(cluster)).join('') : `<div class="card"><div class="empty"><div class="t">没有匹配事件</div><div class="s">切换左侧筛选查看完整生命周期。</div></div></div>`}
    </section>
    <aside class="card timeline-evidence"><div class="card-b">
      <div class="timeline-title-main">证据链摘要</div>
      <div class="timeline-summary-grid">
        <div><strong>${summary.archives}</strong><span>关联档案</span></div>
        <div><strong>${summary.risk}</strong><span>风险事件</span></div>
        <div><strong>${summary.services}</strong><span>服务回执</span></div>
        <div><strong>${summary.locations}</strong><span>记忆位置</span></div>
        <div><strong>${summary.members}</strong><span>家庭成员</span></div>
      </div>
      <div class="timeline-insight">
        <div class="inspector-title">AI 归纳</div>
        <div class="inspector-sub">${esc(summary.insight)}</div>
      </div>
    </div></aside>
  </div>`;
}

function timelineClusters(items){
  const groups = {};
  items.forEach(item=>{
    const quarter = Math.ceil(Number(item.date.slice(5,7))/3);
    const key = `${item.date.slice(0,4)} Q${quarter}`;
    (groups[key] ||= []).push(item);
  });
  return Object.keys(groups).sort().reverse().map(key=>({key, items:groups[key]}));
}

function timelineFilterCount(items, filter){
  if(filter === 'all') return items.length;
  return items.filter(item=>{
    if(filter === 'risk') return item.kind==='reminder' || item.archive.riskLevel==='high' || item.archive.status==='supplement';
    if(filter === 'service') return item.kind==='service';
    if(filter === 'money') return !!item.amount || /押金|缴费|报销|采购|保险|房屋/.test(item.archive.category + item.desc);
    if(filter === 'location') return !!item.archive.memoryZone;
    return item.type === filter || item.archive.category === filter;
  }).length;
}

function timelineSummary(items){
  const archives = new Set(items.map(i=>i.archive.id));
  const members = new Set(items.map(i=>i.member || i.archive.familyMember));
  const locations = new Set(items.map(i=>i.archive.memoryZone).filter(Boolean));
  const risk = items.filter(i=>i.kind==='reminder' || i.archive.riskLevel==='high' || i.archive.status==='supplement').length;
  const services = items.filter(i=>i.kind==='service').length;
  const latestService = items.find(i=>i.kind==='service');
  const next = items.find(i=>i.kind==='reminder' && daysUntil(i.date)>=0);
  return {
    archives: archives.size,
    members: members.size,
    locations: locations.size,
    risk,
    services,
    insight: latestService
      ? `最近完成的服务闭环是「${latestService.archive.title}」：${latestService.desc}。`
      : next
        ? `最近需要关注「${next.archive.title}」：${next.desc}，位置为 ${displayLocation(next.archive)}。`
        : '当前筛选范围内没有未完成提醒。'
  };
}

function timelineClusterHTML(cluster){
  const top = cluster.items.slice(0,4);
  const more = cluster.items.slice(4);
  const riskCount = cluster.items.filter(i=>i.kind==='reminder' || i.archive.riskLevel==='high' || i.archive.status==='supplement').length;
  return `<article class="card timeline-cluster">
    <div class="timeline-cluster-head">
      <div><div class="timeline-cluster-title">${esc(cluster.key)}</div><div class="timeline-note">${cluster.items.length} 个事件 · ${riskCount} 个风险相关</div></div>
      <span class="tag ${riskCount?'warn':'ok'}">${riskCount?'需关注':'稳定'}</span>
    </div>
    <div class="timeline-event-grid">
      ${top.map(timelineEventCardHTML).join('')}
    </div>
    ${more.length ? `<details class="timeline-more"><summary>展开其余 ${more.length} 个事件</summary><div class="timeline-event-grid mt10">${more.map(timelineEventCardHTML).join('')}</div></details>` : ''}
  </article>`;
}

function timelineEventCardHTML(item){
  const c = catColor(item.archive.category);
  const pri = item.kind==='reminder' ? reminderPriority(daysUntil(item.date)) : item.kind==='service' ? {c:'brand',t:'服务回执'} : riskTag(item.archive.riskLevel);
  return `<button class="timeline-event-card" data-open="${item.archive.id}">
    <span class="timeline-event-type" style="background:${c.bg};color:${c.color}">${esc(item.type.slice(0,2))}</span>
    <span class="timeline-event-main">
      <strong>${esc(item.desc)}</strong>
      <small>${esc(item.date)} · ${esc(item.member || item.archive.familyMember)}${item.amount?' · '+esc(item.amount):''}</small>
      <em>${esc(item.archive.title)} · ${esc(displayLocation(item.archive))}</em>
    </span>
    <span class="tag ${pri.c}">${item.kind==='reminder' ? (daysUntil(item.date)>=0 ? daysUntil(item.date)+' 天后' : '已过') : pri.t}</span>
  </button>`;
}

function getRiskItems(){
  const pending = [];
  const progress = [];
  const done = [];
  const incident = activeIncident();
  const incidentA = incidentArchive(incident);
  if(incident && incidentA){
    const item = {
      type:'incident',
      archive:incidentA,
      title:incident.title,
      days:0,
      date:TODAY,
      impact:incident.ai.impact,
      next:state.incidentStatus === 'detected' ? '生成排水检查、保修材料和售后处理事项' : '继续处理并完成事件记录',
      status:state.incidentStatus
    };
    if(state.incidentStatus === 'done') done.push(item);
    else if(state.incidentStatus === 'in_progress') progress.push(item);
    else pending.push(item);
  }
  state.archives.forEach(a=>{
    if(a.status==='supplement' || a.status==='supplement_in_progress'){
      const item = {type:'supplement', archive:a, title:'补齐原始资料', days:999, impact:'证据不完整会影响后续报销、入学或交接', next:'补齐缺失材料并恢复为已归档状态', status:a.status};
      (a.status==='supplement_in_progress' ? progress : pending).push(item);
    }
    (a.reminders||[]).forEach(r=>{
      const days = daysUntil(r.date);
      const item = {type:'reminder', archive:a, reminder:r, title:r.action, days, impact:days<=30?'临近关键日期，需要优先处理':'需要提前安排，避免临期遗漏', next:'打开详情后处理该提醒', status:r.status};
      if(r.status==='done') done.push(item);
      else if(r.status==='in_progress') progress.push(item);
      else if(days>=0) pending.push(item);
    });
  });
  pending.sort((a,b)=>a.days-b.days);
  progress.sort((a,b)=>a.days-b.days);
  done.sort((a,b)=>String(b.reminder?.date || b.archive.date).localeCompare(String(a.reminder?.date || a.archive.date)));
  return {pending, progress, done};
}

function highestPriority(){
  const risk = getRiskItems();
  return risk.pending[0] || risk.progress[0] || null;
}

function openRiskCount(){
  const risk = getRiskItems();
  return risk.pending.length + risk.progress.length;
}

function riskMatterContext(item){
  const a = item.archive || {};
  if(item.type === 'incident'){
    return {
      loss:'漏水扩大、墙地面损坏、楼下邻里赔付和售后扯皮',
      owner:'林女士现场检查，周先生准备保修材料',
      evidence:incidentEvidenceText(activeIncident()),
      service:'报修材料包 + 维修授权单',
      paid:'高：维修履约和硬件防护都有明确付费价值'
    };
  }
  if(item.type === 'supplement'){
    if(a.category === '报销票据'){
      return {
        loss:'缺页和金额待核会拖慢报销提交，时间一长就容易忘记或被退回',
        owner:a.familyMember || '报销责任人',
        evidence:`票据、小票、费用清单 · ${displayLocation(a)}`,
        service:'报销材料包 + 提交授权',
        paid:'中高：金额明确且手续繁琐，用户愿意为省心提交付费'
      };
    }
    return {
      loss:'材料缺口会拖慢报销、入学、理赔或家庭交接',
      owner:a.familyMember || '待确认',
      evidence:`${a.title || '待补资料'} · ${displayLocation(a)}`,
      service:'补资料清单 + 有据材料包',
      paid:'中：用户愿意为关键材料整理和低置信度复核付费'
    };
  }
  if(a.category === '房屋合同'){
    return {
      loss:'押金争议、退租证据缺失和验房交接成本',
      owner:a.familyMember || '全家',
      evidence:`合同、押金、水电底数 · ${displayLocation(a)}`,
      service:'退租交接材料包',
      paid:'高：押金金额明确，证据整理价值直接'
    };
  }
  if(a.category === '保险续费'){
    return {
      loss:'保障断档、临期续费选择仓促和保单版本混乱',
      owner:a.familyMember || '车主',
      evidence:`保单、续费通知、支付记录 · ${displayLocation(a)}`,
      service:'保障缺口体检 + 续费材料包',
      paid:'中高：家庭愿意为避免保障空窗付费'
    };
  }
  if(a.category === '老人复诊'){
    return {
      loss:'漏带病历/处方、家属交接不清和复诊延期',
      owner:a.familyMember || '照护人',
      evidence:`病历、处方、检查单 · ${displayLocation(a)}`,
      service:'复诊材料包 + 看护订阅',
      paid:'高：照护场景有持续安心订阅价值'
    };
  }
  if(a.category === '儿童学籍'){
    return {
      loss:'报名材料缺失、补件延期和家庭成员反复沟通',
      owner:a.familyMember || '监护人',
      evidence:`入学通知、户口本、回执 · ${displayLocation(a)}`,
      service:'入学材料包',
      paid:'中高：截止日期明确，材料缺口焦虑强'
    };
  }
  if(a.category === '证照到期' || a.category === '旅行证件' || a.category === '车辆年检'){
    return {
      loss:'证件或车辆资质临期，影响出行、年检或办理',
      owner:a.familyMember || '责任人',
      evidence:`证照资料与提醒 · ${displayLocation(a)}`,
      service:'证照/车务材料清单',
      paid:'中：时限明确，适合打包成安心提醒'
    };
  }
  return {
    loss:item.impact || '遗漏处理会增加家庭沟通和后续补救成本',
    owner:a.familyMember || '待确认',
    evidence:`${a.title || '相关档案'} · ${displayLocation(a)}`,
    service:'行动清单 + 证据链留存',
    paid:'中：减少遗漏和交接成本'
  };
}

function riskDecisionHeroHTML(focus, risk){
  const context = focus ? riskMatterContext(focus) : null;
  const generated = serviceRunFor('risk-report') ? '已生成' : '待生成';
  const careFocus = focus?.archive?.category === '老人复诊';
  const moveoutFocus = focus?.archive?.category === '房屋合同';
  const schoolFocus = focus?.archive?.category === '儿童学籍';
  const claimFocus = focus?.archive?.category === '报销票据';
  return `<section class="card risk-hero-card"><div class="card-b">
    <div class="risk-hero-main">
      <div>
        <span class="tag brand">家庭风险运营台</span>
        <h2>${focus ? esc(focus.title) : '今天没有必须马上处理的家庭风险'}</h2>
        <p>${focus ? esc(context.loss) : '可以继续补齐资料、整理交接说明，保持家庭资产和服务证据链完整。'}</p>
      </div>
      <div class="risk-hero-actions">
        ${focus ? `<button class="btn btn-primary btn-sm" data-open="${focus.archive.id}">打开证据档案</button>` : `<button class="btn btn-outline btn-sm" data-jump="archive">继续归档</button>`}
        <button class="btn btn-outline btn-sm" data-service-run="risk-report">生成家庭风险体检</button>
        ${careFocus ? `<button class="btn btn-outline btn-sm" data-service-demo-jump="care-plan">进入照护服务</button>` : ''}
        ${moveoutFocus ? `<button class="btn btn-outline btn-sm" data-service-demo-jump="moveout-pack">进入退租服务</button>` : ''}
        ${schoolFocus ? `<button class="btn btn-outline btn-sm" data-service-demo-jump="school-pack">进入入学服务</button>` : ''}
        ${claimFocus ? `<button class="btn btn-outline btn-sm" data-service-demo-jump="claim-pack">进入报销服务</button>` : ''}
        ${focus?.type === 'incident' ? `<button class="btn btn-outline btn-sm" data-jump="services">进入授权服务</button>` : ''}
      </div>
    </div>
    <div class="risk-hero-grid">
      <div><b>潜在损失</b><span>${esc(context?.loss || '暂无高优先级风险')}</span></div>
      <div><b>责任人</b><span>${esc(context?.owner || '暂无')}</span></div>
      <div><b>证据</b><span>${esc(context?.evidence || '暂无')}</span></div>
      <div><b>服务入口</b><span>${esc(context?.service || generated)}</span></div>
    </div>
  </div></section>`;
}

function riskCommercialLadderHTML(){
  const rows = [
    ['免费层','今天风险清单、空间定位、档案提醒'],
    ['订阅层','家庭风险周报、老人/儿童看护、异常记录'],
    ['按次服务','维修/理赔/退租/入学/复诊材料包'],
    ['履约分成','维修、安装、保险协作的最小授权服务']
  ];
  return `<div class="risk-commercial-ladder">
    ${rows.map(([k,v],i)=>`<div><strong>${i+1}</strong><span><b>${esc(k)}</b>${esc(v)}</span></div>`).join('')}
  </div>`;
}

function viewRisk(){
  const risk = getRiskItems();
  const tab = ['pending','progress','done'].includes(state.riskTab) ? state.riskTab : 'pending';
  const focus = highestPriority();
  const careFocus = focus?.archive?.category === '老人复诊';
  const moveoutFocus = focus?.archive?.category === '房屋合同';
  const schoolFocus = focus?.archive?.category === '儿童学籍';
  const claimFocus = focus?.archive?.category === '报销票据';
  return `<div class="risk-shell">
    <section class="risk-main">
      ${riskDecisionHeroHTML(focus, risk)}
      <section class="card risk-board"><div class="card-h"><span class="t">风险队列</span><span class="sub">按损失、责任人、证据和服务入口组织</span><div class="segmented" style="margin-left:auto"><button class="seg-btn ${tab==='pending'?'active':''}" data-risk-tab="pending">待处理 ${risk.pending.length}</button><button class="seg-btn ${tab==='progress'?'active':''}" data-risk-tab="progress">处理中 ${risk.progress.length}</button><button class="seg-btn ${tab==='done'?'active':''}" data-risk-tab="done">已完成 ${risk.done.length}</button></div></div><div class="card-b">
        ${riskTabHTML(risk[tab], tab)}
      </div></section>
    </section>
    <aside class="card risk-context"><div class="card-b">
      <div class="inspector-title">AI 风险判断</div>
      <div class="inspector-sub">${focus ? `${esc(focus.title)} · ${esc(riskMatterContext(focus).paid)}` : '今天没有必须马上处理的事，可以顺手补齐资料或交接说明'}</div>
      ${focus ? `<button class="btn btn-primary btn-block mt12" data-open="${focus.archive.id}">先处理这项</button>` : `<button class="btn btn-outline btn-block mt12" data-jump="archive">继续归档</button>`}
      ${careFocus ? `<button class="btn btn-outline btn-block mt8" data-service-demo-jump="care-plan">生成照护方案</button>` : ''}
      ${moveoutFocus ? `<button class="btn btn-outline btn-block mt8" data-service-demo-jump="moveout-pack">生成退租交接包</button>` : ''}
      ${schoolFocus ? `<button class="btn btn-outline btn-block mt8" data-service-demo-jump="school-pack">生成入学材料包</button>` : ''}
      ${claimFocus ? `<button class="btn btn-outline btn-block mt8" data-service-demo-jump="claim-pack">生成报销材料包</button>` : ''}
      ${focus?.type === 'incident' ? `<button class="btn btn-outline btn-block mt8" data-jump="services">生成报修服务单</button>` : ''}
      <div class="risk-policy-list">
        <div><strong>1</strong><span>先看真实损失：漏水、押金、保障断档、复诊延误。</span></div>
        <div><strong>2</strong><span>再看证据是否齐：档案、空间位置、责任人、最近动作。</span></div>
        <div><strong>3</strong><span>需要外部人接手时，先生成最小授权材料包。</span></div>
      </div>
      ${riskCommercialLadderHTML()}
    </div></aside>
  </div>`;
}

function serviceCardDefinitions(){
  const risk = getRiskItems();
  const highRisk = state.archives.filter(a=>a.riskLevel === 'high').length;
  const pendingCount = risk.pending.length + risk.progress.length;
  return [
    {
      id:'risk-report',
      title:'家庭安全体检',
      tag:'今日',
      group:'安心看护',
      role:'发现',
      scene:'今日先处理什么',
      desc:'把水浸、到期提醒、待处理事项放到一张清单里，告诉家人今天先处理什么，减少小事故拖成大损失。',
      action:'生成体检清单',
      meta:`${highRisk} 个高风险档案 · ${pendingCount} 个待处理事项`,
      next:'订阅价值：家庭安全周报、异常事件记录和 AI 行动建议'
    },
    {
      id:'subscription-plan',
      title:'AI 安心订阅',
      tag:'订阅',
      group:'安心看护',
      role:'长期',
      scene:'老人、儿童、宠物和异常事件',
      desc:'把异常记录、家庭周报、老人/儿童/宠物看护模式和 AI 行动建议打包成长期安心服务。',
      action:'生成订阅方案',
      meta:'¥29.9/月 · 高级安心包',
      next:'订阅价值：把一次提醒变成持续家庭运营服务'
    },
    {
      id:'care-plan',
      title:'老人照护方案',
      tag:'看护',
      group:'安心看护',
      role:'照护',
      scene:'夜起、复诊、陪同和回执',
      desc:'把夜起状态、复诊资料、陪同责任人和到家授权组织成一条照护服务链，减少“谁负责、带什么、何时跟进”的家庭摩擦。',
      action:'生成照护方案',
      meta:'外婆复诊 · 夜起关怀',
      next:'持续价值：安心订阅 + 陪护/复诊材料包 + 照护回写'
    },
    {
      id:'moveout-pack',
      title:'退租交接包',
      tag:'交接',
      group:'资产交接',
      role:'交接',
      scene:'退租、押金、验房和争议回写',
      desc:'把房屋合同、押金收据、水电底数、维修记录和物业验房授权整理成一条退租交接链，减少押金争议和家人反复找资料。',
      action:'生成交接包',
      meta:'押金 ¥12,000 · 物业验房',
      next:'单次价值：退租证据包 + 验房授权 + 争议回写'
    },
    {
      id:'school-pack',
      title:'入学材料包',
      tag:'学籍',
      group:'资产交接',
      role:'补件',
      scene:'入学、补件、报到与代交回执',
      desc:'把入学通知、户口本复印件、居住登记回执缺口和报到日期整理成一条入学材料链，减少补件延误和家人反复确认。',
      action:'生成材料包',
      meta:'A006 · 2026-08-25 报到',
      next:'单次价值：入学材料包 + 代交授权 + 报到回执'
    },
    {
      id:'claim-pack',
      title:'报销材料包',
      tag:'报销',
      group:'资产交接',
      role:'提交',
      scene:'门诊报销、理赔补件与提交回执',
      desc:'把门诊发票、支付小票、费用清单缺页和待核金额整理成一条报销链，减少反复补件和提交被退回的沟通成本。',
      action:'生成材料包',
      meta:'A009 · 票据合计 ¥836',
      next:'单次价值：报销材料包 + 提交授权 + 回执回写'
    },
    {
      id:'material-pack',
      title:'一键报修',
      tag:'常用',
      group:'维修履约',
      role:'证据',
      scene:'阳台水浸、家电故障',
      desc:'把洗衣机型号、保修记录、水浸事件和售后联系人整理成报修单，解决报修时“说不清、找不到凭证”的痛点。',
      action:'生成报修单',
      meta:'洗衣机水浸 · 保修材料',
      next:'单次服务价值：维修材料包、售后沟通和履约回写'
    },
    {
      id:'privacy-vault',
      title:'资料保护',
      tag:'隐私',
      group:'安心看护',
      role:'权限',
      scene:'证件、合同、医疗和保险资料',
      desc:'把合同、证件、医疗和保险资料的精确位置藏起来，降低家庭服务商业化时的隐私焦虑。',
      action:'检查隐私设置',
      meta:'敏感资料默认隐藏',
      next:'信任价值：默认本地、最小披露、授权可撤回'
    },
    {
      id:'service-auth',
      title:'给维修师傅授权',
      tag:'授权',
      group:'维修履约',
      role:'授权',
      scene:'外部维修、安装和上门服务',
      desc:'需要找外部服务时，只发必要信息，比如设备型号、故障描述和联系方式，服务完成后回写证据链。',
      action:'生成授权单',
      meta:'先确认，再发送',
      next:'服务分成价值：维修商只接收经用户确认的最小材料包'
    },
    {
      id:'hardware-kit',
      title:'智能设备安装',
      tag:'安装',
      group:'空间硬件',
      role:'方案',
      scene:'2D 蓝图布点和 3D 状态验证',
      desc:'按房间给出水浸、门锁、烟感和夜起灯的安装位置与费用预估，让数字孪生反向驱动硬件方案。',
      action:'生成安装建议',
      meta:'设备位置 · 费用预估',
      next:'硬件价值：设备销售、安装服务和 B 端渠道协作'
    }
  ];
}

function serviceRunFor(kind){
  return state.serviceRuns && state.serviceRuns[kind] ? state.serviceRuns[kind] : null;
}

// 服务订单管理系统
function createServiceOrder(serviceId, cardData){
  const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;
  const order = {
    id: orderId,
    serviceId: serviceId,
    title: cardData.title,
    status: 'pending', // pending, authorized, processing, completed, cancelled
    createdAt: Date.now(),
    authorizedAt: null,
    completedAt: null,
    progress: 0,
    currentStep: 0,
    steps: cardData.steps || [],
    data: cardData
  };
  state.serviceOrders.push(order);
  saveState();
  return order;
}

function getServiceOrder(orderId){
  return state.serviceOrders.find(o => o.id === orderId);
}

function updateServiceOrder(orderId, updates){
  const order = getServiceOrder(orderId);
  if(order){
    Object.assign(order, updates);
    saveState();
  }
  return order;
}

function authorizeServiceOrder(orderId){
  return updateServiceOrder(orderId, {
    status: 'authorized',
    authorizedAt: Date.now()
  });
}

function startServiceOrder(orderId){
  return updateServiceOrder(orderId, {
    status: 'processing',
    progress: 10
  });
}

function completeServiceOrder(orderId){
  return updateServiceOrder(orderId, {
    status: 'completed',
    completedAt: Date.now(),
    progress: 100
  });
}

function getServiceOrdersByServiceId(serviceId){
  return state.serviceOrders.filter(o => o.serviceId === serviceId);
}

function getActiveServiceOrders(){
  return state.serviceOrders.filter(o => ['pending','authorized','processing'].includes(o.status));
}

function showServiceOrderDetail(orderId){
  const order = getServiceOrder(orderId);
  if(!order){
    toast('订单不存在');
    return;
  }

  const statusText = {
    'pending': '等待授权',
    'authorized': '已授权',
    'processing': '处理中',
    'completed': '已完成',
    'cancelled': '已取消'
  };

  const progressBar = order.status === 'processing' || order.status === 'completed'
    ? `<div class="service-order-progress">
         <div class="progress-bar">
           <div class="progress-fill" style="width:${order.progress}%"></div>
         </div>
         <span class="progress-text">${order.progress}%</span>
       </div>`
    : '';

  const stepsHTML = order.steps && order.steps.length > 0
    ? `<div class="service-order-steps">
         <h4>处理步骤</h4>
         ${order.steps.map((step, i) => `
           <div class="step-item ${i < order.currentStep ? 'completed' : i === order.currentStep ? 'active' : ''}">
             <i data-lucide="${i < order.currentStep ? 'check-circle' : i === order.currentStep ? 'loader' : 'circle'}"></i>
             <span>${esc(step)}</span>
           </div>
         `).join('')}
       </div>`
    : '';

  const createdTime = new Date(order.createdAt).toLocaleString('zh-CN');
  const authorizedTime = order.authorizedAt ? new Date(order.authorizedAt).toLocaleString('zh-CN') : '-';
  const completedTime = order.completedAt ? new Date(order.completedAt).toLocaleString('zh-CN') : '-';

  openDrawer(`
    <div class="service-order-detail">
      <div class="service-order-header">
        <h2>${esc(order.title)}</h2>
        <span class="service-status-badge status-${order.status}">
          <i data-lucide="${order.status === 'processing' ? 'loader' : order.status === 'completed' ? 'check-circle' : order.status === 'authorized' ? 'check-circle' : 'clock'}"></i>
          <span>${statusText[order.status]}</span>
        </span>
      </div>
      ${progressBar}
      ${stepsHTML}
      <div class="service-order-info">
        <div class="info-row">
          <span class="label">订单编号</span>
          <span class="value">${esc(order.id)}</span>
        </div>
        <div class="info-row">
          <span class="label">创建时间</span>
          <span class="value">${createdTime}</span>
        </div>
        <div class="info-row">
          <span class="label">授权时间</span>
          <span class="value">${authorizedTime}</span>
        </div>
        <div class="info-row">
          <span class="label">完成时间</span>
          <span class="value">${completedTime}</span>
        </div>
      </div>
      <div class="service-order-actions">
        ${order.status === 'pending' ? '<button class="btn btn-primary" onclick="authorizeServiceOrder(\''+order.id+'\');render();closeDrawer();">授权服务</button>' : ''}
        ${order.status === 'processing' ? '<button class="btn btn-primary" onclick="completeServiceOrder(\''+order.id+'\');render();toast(\'服务已完成\');closeDrawer();">标记完成</button>' : ''}
        ${order.status !== 'completed' && order.status !== 'cancelled' ? '<button class="btn btn-outline" onclick="updateServiceOrder(\''+order.id+'\',{status:\'cancelled\'});render();closeDrawer();">取消订单</button>' : ''}
      </div>
    </div>
  `);

  setTimeout(() => {
    if(window.lucide) lucide.createIcons();
  }, 100);
}

function serviceLaneDefinitions(cards){
  const byId = id => cards.find(card=>card.id === id);
  return [
    {
      id:'care',
      title:'安心看护',
      sub:'把异常、到期和家人状态收敛成今天该做什么。',
      proof:'用户能看到 AI 不是聊天框，而是在替家庭判断优先级。',
      cards:['risk-report','subscription-plan','care-plan','privacy-vault'].map(byId).filter(Boolean)
    },
    {
      id:'repair',
      title:'维修履约',
      sub:'从水浸事件出发，整理证据、生成报修、控制授权。',
      proof:'把 3D 告警闭环到真实家庭服务，不停在可视化。',
      cards:['material-pack','service-auth'].map(byId).filter(Boolean)
    },
    {
      id:'handoff',
      title:'行政与交付',
      sub:'把合同、学校材料、报销票据和交接摘要组织成一次性高价值服务。',
      proof:'证明平台不依赖设备密度，同样能处理家庭行政事务、理赔协作与高客单交接场景。',
      cards:['moveout-pack','school-pack','claim-pack'].map(byId).filter(Boolean)
    },
    {
      id:'hardware',
      title:'空间硬件',
      sub:'用 2D 蓝图和 3D 状态反推设备清单、点位和报价。',
      proof:'形成硬件安装和 B 端渠道的商业入口。',
      cards:['hardware-kit'].map(byId).filter(Boolean)
    }
  ];
}

function serviceLaneHTML(lane, selectedDemo){
  return `<section class="service-lane">
    <div class="service-lane-head">
      <div>
        <strong>${esc(lane.title)}</strong>
        <span>${esc(lane.sub)}</span>
      </div>
      <em>${esc(lane.proof)}</em>
    </div>
    <div class="service-lane-list">
      ${lane.cards.map(card=>{
        const run = serviceRunFor(card.id);
        return `<article class="service-card service-scenario-card ${selectedDemo===card.id?'active':''} ${run?'generated':''}">
          <div class="service-card-head">
            <span class="tag ${card.tag==='授权'?'warn':'brand'}">${esc(card.role)}</span>
            <span>${esc(card.meta)}</span>
          </div>
          <h3>${esc(card.title)}</h3>
          <p>${esc(card.desc)}</p>
          <div class="service-card-next">${esc(card.next)}</div>
          <div class="service-card-actions">
            <button class="btn ${selectedDemo===card.id?'btn-primary':'btn-outline'} btn-sm" data-service-demo="${card.id}">查看</button>
            <button class="btn ${run?'btn-soft':'btn-outline'} btn-sm" data-service-run="${card.id}">${run?'重新生成':esc(card.action)}</button>
          </div>
        </article>`;
      }).join('')}
    </div>
  </section>`;
}

function serviceAuthBoundaryHTML(options={}){
  const incident = activeIncident();
  const archive = incidentArchive(incident);
  const compact = options.compact ? ' compact' : '';
  const allowed = [
    incident.title,
    archive ? `${archive.id} / ${archive.title}` : '洗衣机保修摘要',
    '设备型号、保修到期、事件时间',
    '用户确认后的联系方式'
  ];
  const blocked = [
    '其他家庭成员档案',
    '合同原件和证件原件',
    '书房资料柜的精确容器位置',
    '未确认的家庭联系方式'
  ];
  return `<section class="service-auth-boundary${compact}">
    <div class="service-auth-head">
      <div><strong>维修授权边界</strong><span>本地生成，家人确认后才用于外部服务。</span></div>
      <span class="tag warn">最小必要</span>
    </div>
    <div class="service-boundary-grid">
      <div class="allow"><b>可以给维修师傅看</b>${allowed.map(item=>`<span>${esc(item)}</span>`).join('')}</div>
      <div class="deny"><b>不会给对方看</b>${blocked.map(item=>`<span>${esc(item)}</span>`).join('')}</div>
    </div>
  </section>`;
}

function serviceBusinessModelHTML(){
  const models = [
    ['AI 安心订阅','¥29.9/月','家庭周报、异常记录、老人/儿童看护和 AI 行动建议'],
    ['高价值材料包','按次付费','维修、理赔、退租、入学、复诊和装修验收材料整理'],
    ['授权服务分成','履约分成','维修、安装、保险/理赔协作只收最小必要材料包'],
    ['硬件与安装','设备 + 安装','水浸、门锁、烟感、夜起灯按 2D 蓝图生成点位和报价'],
    ['B 端协作','项目/渠道','装修公司、长租公寓、养老社区和智能家居安装商接入家庭图谱'],
    ['隐私信任层','平台壁垒','默认本地、服务前授权、服务后回写、随时可撤回']
  ];
  return `<section class="card service-business-card"><div class="card-h"><span class="t">商业价值与服务模式</span><span class="sub">先打透一条水浸闭环，再复制到更多家庭高价值场景</span></div><div class="card-b">
    <div class="business-model-grid">
      ${models.map(([title,model,desc])=>`<div><strong>${esc(title)}</strong><span>${esc(desc)}</span><em>${esc(model)}</em></div>`).join('')}
    </div>
  </div></section>`;
}

function serviceTechArchitectureHTML(){
  const layers = [
    ['本地事件层','设备状态、风险信号和手动记录先在本地缓存，断网也不丢关键家况。','本地优先'],
    ['家庭图谱层','Room、Device、Archive、Risk、Authorization、ServiceRun 统一建模，任何对象都可跳转。','统一对象'],
    ['AI 编排层','AI 解释风险、补齐缺口、生成动作和授权边界，但不绕过用户直接对外发资料。','可解释'],
    ['服务连接层','只把材料包摘要、工单上下文和回执字段开放给外部服务，服务完成后必须回写。','最小暴露']
  ];
  return `<section class="card service-business-card"><div class="card-h"><span class="t">技术信任架构</span><span class="sub">让家庭状态、证据、授权和服务形成一条可追溯执行链</span></div><div class="card-b">
    <div class="paid-pain-grid">
      ${layers.map(([title,desc,tag])=>`<div>
        <strong>${esc(title)}</strong>
        <span>${esc(desc)}</span>
        <em>${esc(tag)}</em>
      </div>`).join('')}
    </div>
  </div></section>`;
}

function serviceEcosystemHTML(){
  const nodes = [
    ['家庭入口','从风险、资料、照护、交接四类高价值事务进入，不让用户先想“该找哪个功能”。','C 端体验'],
    ['物业 / 维修 / 安装','需要房间、设备、证据和短时授权，是最适合先接入的上门服务。','优先合作'],
    ['保险 / 理赔 / 养老社区','更看重证据链、过程留痕和责任交接，平台可提供标准上下文。','行业模板'],
    ['B 端协作层','输出材料包、授权单、回执和履约状态，不做无边界导流。','协作基础设施'],
    ['平台收益','订阅、单次材料包、履约分成和项目工具费可以并行，但都建立在信任边界上。','复合收入'],
    ['家庭放心感','默认本地、最小可见、服务前确认、服务后回写，决定生态能不能长期成立。','信任壁垒']
  ];
  return `<section class="card service-business-card"><div class="card-h"><span class="t">生态协作网络</span><span class="sub">不是给第三方开入口，而是把服务前、中、后的边界先标准化</span></div><div class="card-b">
    <div class="business-model-grid">
      ${nodes.map(([title,desc,tag])=>`<div><strong>${esc(title)}</strong><span>${esc(desc)}</span><em>${esc(tag)}</em></div>`).join('')}
    </div>
  </div></section>`;
}

function servicePartnerSnapshot(partner){
  const auth = authorizationById(partner.authId);
  const run = serviceRunFor(partner.serviceDemo);
  const archive = state.archives.find(item=>item.id === auth.linkedArchiveId) || null;
  const receipts = archive ? archiveServiceEvents(archive).filter(event=>serviceDemoKindFromEvent(event) === partner.serviceDemo) : [];
  const stage = !run
    ? {tone:'gray',tag:'待生成',detail:'材料包和授权草案还未生成，合作方还看不到任何家庭上下文。'}
    : run.phase === 'generated'
      ? {tone:'brand',tag:'待家人确认',detail:'草案已生成，但家人确认前不会把资料边界开放给外部合作方。'}
      : run.phase === 'receipt'
        ? {tone:'ok',tag:'已写回回执',detail:`当前状态：${run.status}。合作方已提交结构化回执，结果已沉淀到档案与时间线。`}
        : {tone:'warn',tag:'待服务回写',detail:`当前状态：${run.status}。下一步应由合作方按边界执行并提交结构化回执。`};
  return {auth, run, archive, receipts, stage};
}

function servicePartnerByDemo(kind){
  return SERVICE_PARTNERS.find(item=>item.serviceDemo === kind) || null;
}

function serviceTicketMeta(kind, run){
  const partner = servicePartnerByDemo(kind);
  const receiptFields = {
    'service-auth':['到场时间','故障结论','维修建议','离场确认'],
    'care-plan':['到家确认','陪护完成时间','复诊结果','家属交接备注'],
    'moveout-pack':['验房结论','争议项','押金进度','物业回执'],
    'school-pack':['补件状态','提交时间','学校回执','报到结果'],
    'claim-pack':['补件状态','提交时间','报销金额','到账状态']
  }[kind] || ['处理结果','回执时间','责任人'];
  const sla = partner?.promise || '生成材料包后由家人确认，再由合作方按边界执行。';
  const jobId = `JOB-${String(kind || 'service').replace(/[^a-z0-9]/gi,'').toUpperCase()}-${String(run?.generatedAt || TODAY).replace(/[^0-9]/g,'').slice(0,8)}`;
  return {partner, receiptFields, sla, jobId};
}

function serviceRunSlaState(kind, run){
  if(!run) return {tone:'gray',label:'未启动',detail:'服务单尚未生成'};
  const confirmPhase = serviceConfirmPhase(kind);
  if(run.phase === 'receipt') return {tone:'ok',label:'已达成',detail:'合作方已提交回执，SLA 完成'};
  if(run.phase === 'generated') return {tone:'brand',label:'待确认',detail:'等待家人确认后再启动合作方处理'};
  if(run.phase === confirmPhase) return {tone:'warn',label:'进行中',detail:'合作方应在承诺时限内提交结构化回执'};
  return {tone:'brand',label:'处理中',detail:'服务链路已启动，等待下一步动作'};
}

function serviceOpsSummary(){
  const runs = Object.entries(state.serviceRuns || {});
  const summary = {total:0, waitingConfirm:0, waitingReceipt:0, completed:0};
  runs.forEach(([kind, run])=>{
    if(!run) return;
    summary.total += 1;
    const confirmPhase = serviceConfirmPhase(kind);
    if(run.phase === 'generated') summary.waitingConfirm += 1;
    else if(run.phase === 'receipt') summary.completed += 1;
    else if(run.phase === confirmPhase) summary.waitingReceipt += 1;
  });
  return summary;
}

function serviceOpsSummaryHTML(){
  const summary = serviceOpsSummary();
  const receiptCount = state.archives.reduce((sum, archive)=>sum + archiveServiceEvents(archive).length, 0);
  return `<section class="card service-business-card"><div class="card-h"><span class="t">服务运营摘要</span><span class="sub">把材料包、授权、回执和生态履约当成一组真实工单来运营</span></div><div class="card-b">
    <div class="business-model-grid">
      <div><strong>${summary.total}</strong><span>已生成服务工单总数</span><em>工单池</em></div>
      <div><strong>${summary.waitingConfirm}</strong><span>等待家人确认的服务单，确认前不会开放给合作方</span><em>待确认</em></div>
      <div><strong>${summary.waitingReceipt}</strong><span>合作方处理中，下一步应提交结构化回执</span><em>待回执</em></div>
      <div><strong>${summary.completed}</strong><span>已完成回执沉淀的服务单，可回看完整证据链</span><em>已回写</em></div>
      <div><strong>${receiptCount}</strong><span>档案里累计沉淀的服务回执数量</span><em>证据留痕</em></div>
      <div><strong>最小授权</strong><span>每一单都按房间、对象、动作、时间限定边界</span><em>信任规则</em></div>
    </div>
  </div></section>`;
}

function serviceOpsMetaHTML(kind, run){
  const meta = serviceTicketMeta(kind, run);
  const slaState = serviceRunSlaState(kind, run);
  if(!run) return '';
  return `<div class="service-demo-rows mt12">
    <div class="service-demo-row"><span>工单编号</span><strong>${esc(meta.jobId)}</strong></div>
    <div class="service-demo-row"><span>合作方</span><strong>${esc(meta.partner?.name || '家庭内部处理')}</strong></div>
    <div class="service-demo-row"><span>SLA / 承诺</span><strong>${esc(meta.sla)}</strong></div>
    <div class="service-demo-row"><span>SLA 状态</span><strong>${esc(slaState.label)} · ${esc(slaState.detail)}</strong></div>
    <div class="service-demo-row"><span>回执字段</span><strong>${esc(meta.receiptFields.join(' / '))}</strong></div>
  </div>`;
}

function serviceConfirmPhase(kind){
  return {
    'care-plan':'careconfirm',
    'moveout-pack':'moveoutconfirm',
    'school-pack':'schoolconfirm',
    'claim-pack':'claimconfirm',
    'material-pack':'confirm',
    'service-auth':'authorize'
  }[kind] || 'confirm';
}

function servicePartnerActionHTML(partner, snapshot, active){
  if(!snapshot.run){
    return `<button class="btn ${active ? 'btn-primary' : 'btn-outline'} btn-sm" data-service-run="${esc(partner.serviceDemo)}">先生成服务单</button>`;
  }
  const confirmPhase = serviceConfirmPhase(partner.serviceDemo);
  if(snapshot.run.phase === 'generated'){
    return `<button class="btn btn-primary btn-sm" data-service-action="${esc(`${partner.serviceDemo}:${confirmPhase}`)}">先完成家人确认</button>`;
  }
  if(snapshot.run.phase === confirmPhase){
    return `<button class="btn btn-primary btn-sm" data-service-action="${esc(`${partner.serviceDemo}:receipt`)}">模拟服务回执</button>`;
  }
  return `<button class="btn btn-outline btn-sm" data-jump="timeline">查看回执时间线</button>`;
}

function servicePartnerWorkbenchHTML(selectedDemo){
  return `<section class="card service-business-card"><div class="card-h"><span class="t">服务商协同台</span><span class="sub">把合作方能看什么、要回写什么和平台怎么分成讲清楚</span></div><div class="card-b">
    <div class="partner-grid">
      ${SERVICE_PARTNERS.map(partner=>{
        const snapshot = servicePartnerSnapshot(partner);
        const auth = snapshot.auth;
        const active = selectedDemo === partner.serviceDemo;
        return `<article class="partner-card ${active ? 'active' : ''}">
          <div class="partner-head">
            <span class="tag ${snapshot.stage.tone}">${esc(snapshot.stage.tag)}</span>
            <strong>${esc(partner.name)}</strong>
          </div>
          <div class="partner-copy">${esc(partner.scene)}</div>
          <div class="partner-rows">
            <div><b>当前进度</b><span>${esc(snapshot.stage.detail)}</span></div>
            <div><b>服务承诺</b><span>${esc(partner.promise)}</span></div>
            <div><b>关联档案</b><span>${esc(snapshot.archive ? `${snapshot.archive.id} / ${snapshot.archive.title}` : auth.linkedArchiveId)}</span></div>
            <div><b>当前授权</b><span>${esc(auth.title)} · ${esc(auth.status)} · ${esc(auth.time)}</span></div>
            <div><b>工单编号</b><span>${esc(serviceTicketMeta(partner.serviceDemo, snapshot.run).jobId)}</span></div>
            <div><b>SLA 状态</b><span>${esc(serviceRunSlaState(partner.serviceDemo, snapshot.run).label)} · ${esc(serviceRunSlaState(partner.serviceDemo, snapshot.run).detail)}</span></div>
            <div><b>可见范围</b><span>${esc(partner.visible)}</span></div>
            <div><b>默认隐藏</b><span>${esc(partner.hidden)}</span></div>
            <div><b>已写回回执</b><span>${snapshot.receipts.length ? `已有 ${snapshot.receipts.length} 条服务回执留痕` : '尚无服务回执，处理完成后需回写结果。'}</span></div>
            <div><b>回执字段</b><span>${esc(serviceTicketMeta(partner.serviceDemo, snapshot.run).receiptFields.join(' / '))}</span></div>
            <div><b>平台价值</b><span>${esc(partner.revenue)}</span></div>
          </div>
          <div class="partner-actions">
            <button class="btn ${active ? 'btn-primary' : 'btn-outline'} btn-sm" data-service-demo-jump="${esc(partner.serviceDemo)}">查看对应服务单</button>
            ${servicePartnerActionHTML(partner, snapshot, active)}
            <button class="btn btn-outline btn-sm" data-auth-jump="${esc(auth.id)}">查看授权边界</button>
          </div>
        </article>`;
      }).join('')}
    </div>
  </div></section>`;
}

function validationToneClass(tone){
  return {ok:'ok', warn:'warn', brand:'brand', gray:'gray'}[tone] || 'gray';
}

function validationLoopDefinitions(){
  const waterAuth = authorizationById('AUTH-001');
  const waterArchive = state.archives.find(item=>item.id === waterAuth.linkedArchiveId) || incidentArchive(activeIncident()) || null;
  return [
    {
      id:'loop-water',
      title:'水浸 / 报修 / 授权',
      kind:'service-auth',
      archive:waterArchive,
      auth:waterAuth,
      bundle:'报修材料包 + 维修授权单',
      summary:'从阳台水浸风险直接生成报修材料和维修授权，避免现场说不清、找不到保修证据。',
      value:'报修速度 + 维修回执'
    },
    {
      id:'loop-care',
      title:'夜起 / 复诊 / 陪护授权',
      kind:'care-plan',
      archive:careArchive(),
      auth:authorizationById('AUTH-002'),
      bundle:'照护方案 + 陪护授权',
      summary:'把夜起状态、复诊资料、责任人和陪护授权串起来，减少临时沟通和漏带材料。',
      value:'照护连续性 + 到家回执'
    },
    {
      id:'loop-moveout',
      title:'退租 / 押金 / 验房交接',
      kind:'moveout-pack',
      archive:moveoutArchive(),
      auth:authorizationById('AUTH-003'),
      bundle:'退租交接包 + 验房授权',
      summary:'围绕押金、水电底数和物业验房，把高损失交接场景变成可回放的证据链。',
      value:'押金争议控制 + 验房回写'
    },
    {
      id:'loop-school',
      title:'入学 / 补件 / 代交授权',
      kind:'school-pack',
      archive:schoolArchive(),
      auth:authorizationById('AUTH-004'),
      bundle:'入学材料包 + 代交授权',
      summary:'把补件缺口、报到日期和代交边界组织成一条材料链，减少家人反复确认。',
      value:'报到效率 + 学校回执'
    },
    {
      id:'loop-claim',
      title:'报销 / 补件 / 提交授权',
      kind:'claim-pack',
      archive:claimArchive(),
      auth:authorizationById('AUTH-005'),
      bundle:'报销材料包 + 提交授权',
      summary:'把发票、小票、费用清单缺页和提交边界打包，减少反复补件和退回。',
      value:'补件效率 + 到账回写'
    }
  ];
}

function validationLoopCardHTML(loop){
  const partner = servicePartnerByDemo(loop.kind) || {serviceDemo:loop.kind, authId:loop.auth.id};
  const snapshot = servicePartnerSnapshot(partner);
  const meta = serviceTicketMeta(loop.kind, snapshot.run);
  const sla = serviceRunSlaState(loop.kind, snapshot.run);
  const card = serviceCardDefinitions().find(item=>item.id === loop.kind);
  const archiveId = loop.archive?.id || loop.auth.linkedArchiveId;
  return `<article class="partner-card ${snapshot.run ? 'active' : ''}">
    <div class="partner-head">
      <div class="flex between gap8 wrap">
        <strong>${esc(loop.title)}</strong>
        <span class="tag ${validationToneClass(snapshot.stage.tone)}">${esc(snapshot.stage.tag)}</span>
      </div>
      <div class="partner-copy">${esc(loop.summary)}</div>
    </div>
    <div class="asset-card-grid mt10">
      <span><b>主档案</b>${esc(archiveId)} / ${esc(loop.archive?.title || '待关联档案')}</span>
      <span><b>授权单</b>${esc(loop.auth.id)} / ${esc(loop.auth.title)}</span>
      <span><b>服务闭环</b>${esc(loop.bundle)}</span>
      <span><b>服务价值</b>${esc(loop.value)}</span>
    </div>
    <div class="partner-rows">
      <div><b>当前状态</b><span>${esc(snapshot.run?.status || '尚未生成，现场可一键跑通')} · ${esc(snapshot.stage.detail)}</span></div>
      <div><b>合作方 / SLA</b><span>${esc(meta.partner?.name || '家庭内部处理')} · ${esc(sla.label)} · ${esc(sla.detail)}</span></div>
      <div><b>工单与回执</b><span>${snapshot.run ? esc(meta.jobId) : '待生成工单'} · ${esc(meta.receiptFields.join(' / '))}</span></div>
      <div><b>证据沉淀</b><span>${snapshot.receipts.length ? `已有 ${snapshot.receipts.length} 条服务回执留痕` : '完成后会写回档案事件、服务回执和操作记录。'}</span></div>
      ${card ? `<div><b>场景定义</b><span>${esc(card.scene)} · ${esc(card.next || '')}</span></div>` : ''}
    </div>
    <div class="partner-actions">
      <button class="btn btn-primary btn-sm" data-service-demo-jump="${esc(loop.kind)}">查看服务单</button>
      <button class="btn btn-outline btn-sm" data-auth-jump="${esc(loop.auth.id)}">查看授权边界</button>
      <button class="btn btn-outline btn-sm" data-open="${esc(archiveId)}">打开档案</button>
    </div>
  </article>`;
}

function viewValidation(){
  const loops = validationLoopDefinitions();
  const ops = serviceOpsSummary();
  const highRisk = state.archives.filter(item=>item.riskLevel === 'high').length;
  const roomOnlyCount = state.archives.filter(item=>item.locationPrivacy === 'room_only').length;
  const hiddenCount = state.archives.filter(item=>item.locationPrivacy === 'hidden').length;
  const controlledCount = roomOnlyCount + hiddenCount;
  const receiptCount = state.archives.reduce((sum, archive)=>sum + archiveServiceEvents(archive).length, 0);
  const generatedLoops = loops.filter(loop=>!!serviceRunFor(loop.kind)).length;
  const risk = getRiskItems();
  const personas = [
    ['双职工有娃家庭','怕漏事、怕反复沟通、怕上门服务折腾，核心是“谁处理、资料在哪、什么时候要交”。','AI 管家、风险运营、入学材料包、报销材料包、家庭服务协同台','少沟通成本 + 不漏节点'],
    ['有老人照护需求的家庭','怕过度打扰，也怕真异常没人跟进；核心是夜起、复诊、陪同、回执不断链。','夜起 / 复诊 / 陪护授权闭环、成员权限、到家回执写回','安心感 + 责任清晰'],
    ['租住 / 改善型家庭','设备不一定多，但押金、合同、验房、交接容易一次损失很大。','退租交接包、押金证据链、物业验房授权、争议回写','强损失场景止损'],
    ['高价值家电 / 多服务家庭','怕保修资料分散、售后反复问、服务结果不沉淀。','阳台水浸报修主线、维修授权单、工单 / SLA / 回执留痕','一次处理，下次复用']
  ];
  const techProofs = [
    ['本地事件层','风险信号、档案、授权和服务都先留在本地静态前端，断网也不丢关键家况。','今日家况 / 风险运营 / 当前验证状态'],
    ['家庭对象图谱','Room、Archive、Risk、Authorization、ServiceRun 在同一数据模型中互相跳转。','空间视图、档案抽屉、授权页、服务单'],
    ['数字孪生界面','3D 用来理解现场位置，2D 用来高效查找证据，时间线用来回看处理结果。','今日家况、空间视图、事件记录'],
    ['AI 编排层','AI 不只回答问题，还把风险解释、补件提醒、工单入口和下一步动作组织到一起。','AI 管家、自然语言检索、风险判断面板'],
    ['服务连接层','对外只开放材料包摘要、工单上下文和回执字段，服务完成后必须回写。','家庭服务、服务商协同台、验证台']
  ];
  const ecosystemPaths = [
    ['安心订阅','面向老人照护、异常提醒、家庭周报的持续服务。','AI 安心订阅 / 关怀模式 / 安装建议'],
    ['单次材料包','围绕报修、退租、入学、报销等高价值事务提供一次性解决方案。','5 条闭环全部可生成材料包'],
    ['履约分成','维修、陪护、物业、理赔合作方按最小授权接单并回写结果。','服务商协同台 / 工单编号 / SLA / 回执字段'],
    ['B 端协作','把材料包、授权单、履约状态和结果回写做成标准上下文。','生态协作网络 / 验证台 / PRD 路线图']
  ];
  return `<div class="services-shell">
    <section class="card service-hero"><div class="card-b">
      <div>
        <div class="tag brand">演示验证台</div>
        <h2>把“便利、效率、放心”拆成当前可验收的对象。</h2>
        <p>这里不再讲概念，而是直接检查当前平台是否把风险定位、证据组织、最小授权、SLA、回执和服务沉淀跑通。</p>
        <div class="hero-actions">
          <button class="btn btn-primary" data-jump="services">查看服务闭环</button>
          <button class="btn btn-outline" data-jump="home">查看风险运营</button>
          <button class="btn btn-outline" data-jump="members">查看成员权限</button>
          <button class="btn btn-outline" data-jump="home">回到 3D 家况</button>
        </div>
      </div>
      <div class="service-trust">
        <div><strong>${loops.length} 条</strong><span>已定义并可现场演示的高价值闭环</span></div>
        <div><strong>${SERVICE_PARTNERS.length} 类</strong><span>服务商协同模板，先定义边界再谈生态</span></div>
        <div><strong>${controlledCount} 份</strong><span>敏感档案已进入房间级或隐藏级可见范围</span></div>
      </div>
    </div></section>
    <section class="card service-business-card"><div class="card-h"><span class="t">目标家庭与真实痛点</span><span class="sub">先看谁最需要这套平台，再看当前原型拿什么证明它不是空泛概念</span></div><div class="card-b">
      <div class="partner-grid">
        ${personas.map(([persona,pain,proof,value])=>`<article class="partner-card">
          <div class="partner-head">
            <span class="tag brand">${esc(persona)}</span>
            <strong>${esc(value)}</strong>
          </div>
          <div class="partner-rows">
            <div><b>切实痛点</b><span>${esc(pain)}</span></div>
            <div><b>当前产品证明</b><span>${esc(proof)}</span></div>
          </div>
        </article>`).join('')}
      </div>
    </div></section>
    <section class="card service-business-card"><div class="card-h"><span class="t">三项平台结果</span><span class="sub">目标不是做一个炫目的控制面板，而是让家庭真的更好操作、更高效、更放心</span></div><div class="card-b">
      <div class="business-model-grid">
        <div><strong>操作便利</strong><span>AI 管家已能直接回答保修、复诊、续费、入学、报销、协同台和工单 / SLA 问题，问答可直接跳到档案、风险或服务页。</span><em>问得到，也跳得过去</em></div>
        <div><strong>管理高效</strong><span>${openRiskCount()} 个待处理事项、${highRisk} 个高风险档案和 ${ops.total} 个服务工单可按风险、责任人、阶段和回执统一运营。</span><em>风险台 + 服务台</em></div>
        <div><strong>使用放心</strong><span>${AUTHORIZATION_SCOPES.length} 份授权模板、${receiptCount} 条服务留痕和 ${hiddenCount} 份完全隐藏资料，把边界、回写和可撤回做成默认能力。</span><em>最小授权 + 留痕回写</em></div>
        <div><strong>档案底座</strong><span>${state.archives.length} 份家庭档案覆盖家电、合同、保险、医疗、证照、报销和采购，能支撑真实家庭事务的证据链。</span><em>有据可查</em></div>
        <div><strong>现场可演示</strong><span>${generatedLoops}/${loops.length} 条闭环已经生成服务单；未生成的闭环也保留完整模板，可在演示时一键触发。</span><em>能跑通，不是静态图</em></div>
        <div><strong>本地优先</strong><span>空间、档案、风险、授权和服务逻辑都在本地静态前端完成，默认不接真实摄像头、外部 API 或云端推理。</span><em>默认克制</em></div>
      </div>
    </div></section>
    <section class="card service-business-card"><div class="card-h"><span class="t">技术落地链</span><span class="sub">研究里说的数字孪生和可信架构，在当前原型里已经有对应落点</span></div><div class="card-b">
      <div class="paid-pain-grid">
        ${techProofs.map(([title,desc,proof])=>`<div>
          <strong>${esc(title)}</strong>
          <span>${esc(desc)}</span>
          <em>${esc(proof)}</em>
        </div>`).join('')}
      </div>
    </div></section>
    <section class="card service-business-card"><div class="card-h"><span class="t">五条闭环验收</span><span class="sub">逐条检查档案、授权、合作方、SLA、回执字段和证据沉淀</span></div><div class="card-b">
      <div class="partner-grid">
        ${loops.map(loop=>validationLoopCardHTML(loop)).join('')}
      </div>
    </div></section>
    <section class="card service-business-card"><div class="card-h"><span class="t">服务延展与生态路径</span><span class="sub">先把高价值事务做深，再把材料包、授权和履约变成可扩展的服务网络</span></div><div class="card-b">
      <div class="business-model-grid">
        ${ecosystemPaths.map(([title,desc,proof])=>`<div><strong>${esc(title)}</strong><span>${esc(desc)}</span><em>${esc(proof)}</em></div>`).join('')}
      </div>
    </div></section>
    <section class="card service-business-card"><div class="card-h"><span class="t">运行边界与演示入口</span><span class="sub">让评审先看清平台边界，再进入 3D、风险和服务主线</span></div><div class="card-b">
      <div class="paid-pain-grid">
        <div><strong>本地运行边界</strong><span>当前原型由本地 index.html、app.js、vendor 和内嵌资产运行，不依赖 CDN，不调用外部 API。</span><em>静态前端原型</em></div>
        <div><strong>家庭隐私边界</strong><span>房屋合同、医疗、证照、学籍和报销资料默认进入房间级或隐藏级可见范围，服务前必须经家人确认。</span><em>默认最小披露</em></div>
        <div><strong>服务协作边界</strong><span>对外只开放材料包摘要、工单上下文和回执字段；服务完成后必须把结果写回档案和事件记录。</span><em>先授权，再协作</em></div>
        <div><strong>建议演示路径</strong><span>先看验证台，再跳 3D 家况、风险运营、家庭服务和成员权限，最后回到档案或时间线核对回执沉淀。</span><em>适合评审现场</em></div>
      </div>
      <div class="flex gap8 wrap mt12">
        <button class="btn btn-primary btn-sm" data-jump="home">先看 3D 家况</button>
        <button class="btn btn-outline btn-sm" data-jump="home">看 AI 管家</button>
        <button class="btn btn-outline btn-sm" data-jump="home">看风险运营</button>
        <button class="btn btn-outline btn-sm" data-jump="services">看服务运营摘要</button>
        <button class="btn btn-outline btn-sm" data-jump="timeline">回看事件与回执</button>
      </div>
      <div class="service-demo-rows mt12">
        <div class="service-demo-row"><span>当前风险队列</span><strong>待处理 ${risk.pending.length} · 处理中 ${risk.progress.length} · 已完成 ${risk.done.length}</strong></div>
        <div class="service-demo-row"><span>当前工单池</span><strong>总数 ${ops.total} · 待确认 ${ops.waitingConfirm} · 待回执 ${ops.waitingReceipt} · 已回写 ${ops.completed}</strong></div>
        <div class="service-demo-row"><span>当前证据沉淀</span><strong>${receiptCount} 条服务回执留痕，覆盖维修、照护、交接、入学和报销服务链。</strong></div>
      </div>
    </div></section>
  </div>`;
}

function viewServices(){
  if(state.layoutMode === 'app') return viewServicesApp();
  const tabs = ['维修服务', '照护服务', '理赔服务', '材料包'];
  const tabKinds = {
    '维修服务': ['risk-report', 'material-pack', 'service-auth', 'hardware-kit'],
    '照护服务': ['care-plan', 'subscription-plan', 'privacy-vault'],
    '理赔服务': ['claim-pack', 'moveout-pack'],
    '材料包': ['material-pack', 'school-pack', 'claim-pack', 'moveout-pack']
  };
  const activeTab = state.serviceTab || tabs[0];
  const selectedDemo = state.serviceDemo || null;
  const kinds = tabKinds[activeTab] || [];
  const demoInTab = selectedDemo && kinds.includes(selectedDemo);

  const allCards = serviceCardDefinitions();
  const byId = id => allCards.find(c => c.id === id);
  const cards = kinds.map(byId).filter(Boolean);

  return `<div class="services-layout">
    <div class="services-tabs">
      ${tabs.map(t => `
        <button class="service-tab ${t===activeTab?'active':''}" data-service-tab="${t}">
          ${t}
        </button>
      `).join('')}
    </div>
    <div class="services-content">
      <div class="services-grid services-grid-real">
        ${cards.map(card => serviceScenarioCardHTML(card, selectedDemo)).join('')}
      </div>
      ${demoInTab ? `<div class="services-detail-wrap">${serviceDemoHTML(selectedDemo)}</div>` : ''}
    </div>
  </div>`;
}

function serviceScenarioCardHTML(card, selectedDemo){
  const run = serviceRunFor(card.id);
  const archive = serviceArchiveFor(card.id);
  const orders = getServiceOrdersByServiceId(card.id);
  const activeOrder = orders.find(o => ['pending','authorized','processing'].includes(o.status));

  // 统一的图标映射，只保留图标差异
  const iconMap = {
    'risk-report': 'shield-alert',
    'subscription-plan': 'heart-handshake',
    'care-plan': 'heart-pulse',
    'material-pack': 'package-check',
    'school-pack': 'graduation-cap',
    'claim-pack': 'file-text',
    'moveout-pack': 'home',
    'privacy-vault': 'shield-check',
    'service-auth': 'user-check',
    'hardware-kit': 'cpu'
  };

  const icon = iconMap[card.id] || 'sparkles';

  const statusBadge = activeOrder
    ? `<div class="service-status-badge status-${activeOrder.status}">
         <i data-lucide="${activeOrder.status === 'processing' ? 'loader' : activeOrder.status === 'authorized' ? 'check-circle' : 'clock'}"></i>
         <span>${activeOrder.status === 'pending' ? '待授权' : activeOrder.status === 'authorized' ? '已授权' : '进行中'}</span>
       </div>`
    : '';

  return `<article class="service-card service-scenario-card ${selectedDemo===card.id?'active':''} ${run?'generated':''} ${activeOrder?'has-order':''}">
    <div class="service-card-top">
      <div class="service-card-icon">
        <i data-lucide="${icon}"></i>
      </div>
      <div class="service-card-head">
        <span class="service-role-tag">${esc(card.role)}</span>
        <span class="service-meta">${esc(card.meta)}</span>
      </div>
    </div>
    ${statusBadge}
    <div class="service-card-body">
      <h3>${esc(card.title)}</h3>
      <p>${esc(card.desc)}</p>
      ${archive ? `<div class="service-card-archive"><i data-lucide="link"></i><span data-open="${archive.id}">${esc(archive.title)}</span></div>` : ''}
    </div>
    <div class="service-card-actions">
      <button class="btn ${selectedDemo===card.id?'btn-primary':'btn-outline'} btn-sm" ${archive ? `data-open="${archive.id}"` : `data-service-demo="${card.id}"`}>
        <i data-lucide="eye"></i>
        <span>查看详情</span>
      </button>
      ${activeOrder
        ? `<button class="btn btn-soft btn-sm" data-service-order="${activeOrder.id}">
             <i data-lucide="file-text"></i>
             <span>查看订单</span>
           </button>`
        : `<button class="btn btn-primary btn-sm" data-service-run="${card.id}">
             <i data-lucide="play"></i>
             <span>${esc(card.action)}</span>
           </button>`
      }
    </div>
  </article>`;
}

function legacyServiceDemoHTML(kind){
  const incident = activeIncident();
  const archive = incidentArchive(incident);
  const demos = {
    'risk-report':{
      title:'家庭风险体检方案已生成',
      sub:`发现 ${incident.title}、${state.archives.filter(a=>a.riskLevel === 'high').length} 个高风险档案、${openRiskCount()} 个待处理事项。`,
      rows:[
        ['高优先级',incident.title],
        ['AI 建议','先检查排水口，准备保修材料，再设置 24 小时复查。'],
        ['空间依据',`${incident.room} · ${incident.device.locationLabel}`]
      ],
      actions:[['查看待办','risk'],['查看 2D 定位','library']]
    },
    'material-pack':{
      title:'有据材料包预览',
      sub:'本地生成维修材料摘要，不会外发原始家庭资料。',
      rows:[
        ['材料 1',archive?.title || '洗衣机保修档案'],
        ['材料 2','今日水浸风险事件记录'],
        ['材料 3','上次排水泵维修记录和售后联系人']
      ],
      actions:[['打开档案',archive?.id || 'A001'],['查看事件记录','timeline']]
    },
    'privacy-vault':{
      title:'隐私保险箱保护范围',
      sub:'证件、合同、医疗和保险资料默认隐藏精确容器，只显示必要摘要。',
      rows:[
        ['隐藏精确位置',`${state.archives.filter(a=>a.locationPrivacy !== 'public').length} 份资料`],
        ['可撤回授权','服务方只能看到用户确认后的最小必要信息。'],
        ['操作留痕','每次查看和授权都写入档案操作日志。']
      ],
      actions:[['进入空间视图','library'],['查看事件记录','timeline']]
    },
    'service-auth':{
      title:'授权服务摘要',
      sub:'维修服务方只接收水浸事件、设备型号、保修状态和联系需求，不接收完整家庭档案。',
      rows:[
        ['服务场景','洗衣机排水口水浸检查'],
        ['披露范围','设备型号、保修到期、事件时间、用户确认的联系方式'],
        ['回写结果','处理记录回写 A001 档案和事件记录']
      ],
      actions:[['生成处理事项','risk'],['查看事件记录','timeline']]
    },
    'hardware-kit':{
      title:'空间硬件套餐建议',
      sub:'基于当前三室一厅空间，生成设备布点清单。',
      rows:[
        ['阳台','水浸传感器 + 智能水阀建议点位'],
        ['玄关','门锁/门磁 + 入户摄像头建议点位'],
        ['卧室/卫浴','人体传感器 + 夜起路径灯建议点位']
      ],
      actions:[['查看空间蓝图','library'],['回到 3D 家况','dashboard']]
    }
  };
  const demo = demos[kind] || demos['risk-report'];
  return `<aside class="card service-demo-panel"><div class="card-h"><span class="t">${esc(demo.title)}</span><span class="tag brand" style="margin-left:auto">服务草案</span></div><div class="card-b">
    <div class="notice info">${esc(demo.sub)}</div>
    <div class="service-demo-rows mt12">
      ${demo.rows.map(([k,v])=>`<div class="service-demo-row"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}
    </div>
    <div class="flex gap8 wrap mt12">
      ${demo.actions.map(([label,target],i)=>target && target.startsWith && target.startsWith('A')
        ? `<button class="btn ${i===0?'btn-primary':'btn-outline'} btn-sm" data-open="${target}">${esc(label)}</button>`
        : `<button class="btn ${i===0?'btn-primary':'btn-outline'} btn-sm" data-jump="${target}">${esc(label)}</button>`).join('')}
    </div>
  </div></aside>`;
}

function buildServiceRun(kind){
  const incident = activeIncident();
  const archive = incidentArchive(incident);
  const care = careArchive();
  const moveout = moveoutArchive();
  const school = schoolArchive();
  const claim = claimArchive();
  const highRisk = state.archives.filter(a=>a.riskLevel === 'high').length;
  const hidden = state.archives.filter(a=>a.locationPrivacy !== 'public').length;
  const base = {kind, generatedAt:nowStr(), updatedAt:nowStr(), phase:'generated'};
  const runs = {
    'risk-report':{
      title:'家庭安全体检清单',
      status:'已生成',
      progress:82,
      summary:`今天最需要处理的是 ${incident.title}，还有 ${openRiskCount()} 个待处理事项；目标是把可能扩大的家庭损失提前拦住。`,
      steps:['扫描 12 份家庭档案','定位阳台水浸事件','匹配洗衣机保修证据','生成处置优先级'],
      rows:[
        ['最高优先级',incident.title],
        ['空间依据',`${incident.room} · ${incident.device.locationLabel}`],
        ['AI 建议','先检查排水口，准备保修材料，再设置 24 小时复查。'],
        ['付费理由','家庭愿意为避免漏水扩大、邻里赔付和售后扯皮付费。'],
        ['生成结果','今日处理清单、证据位置、家人分工建议']
      ],
      actions:[
        {label:'保存体检清单',action:'risk-report:archive',primary:true},
        {label:'查看待办事项',jump:'risk'},
        {label:'查看 2D 定位',jump:'library'}
      ]
    },
    'subscription-plan':{
      title:'AI 安心订阅方案',
      status:'方案草案',
      progress:78,
      summary:'已按当前家庭状态生成高级安心包建议，把低频事故处理沉淀为高频家庭安心服务。',
      steps:['读取家庭风险状态','匹配水浸与到期提醒','组合看护与周报能力','生成订阅权益'],
      rows:[
        ['基础版','免费：空间视图、档案检索、手动事项记录'],
        ['高级版','¥29.9/月：家庭安全报告、异常事件记录、AI 行动建议'],
        ['看护模式','老人夜起、儿童看护、宠物异常和云端录像摘要接口位'],
        ['续费动机','用户不是为工具付费，而是为家里有人持续记得、提醒和交接付费。'],
        ['商业边界','不售卖家庭隐私，不做广告定向，第三方服务必须主动授权']
      ],
      actions:[
        {label:'保存订阅方案',action:'subscription-plan:subscribe',primary:true},
        {label:'切换夜起关怀',action:'subscription-plan:elder'},
        {label:'查看家庭服务',jump:'services'}
      ]
    },
    'care-plan':{
      title:'外婆夜起照护方案',
      status:'待家人确认',
      progress:74,
      summary:'已把夜起路径、复诊资料、陪同责任人和陪护授权整理成一条照护方案，目标是减少临时沟通和漏带材料。',
      steps:['读取 A007 复诊档案','合并夜起与复诊状态','指定林女士为主跟进人','生成陪护授权草案'],
      rows:[
        ['照护对象',care ? `${care.id} / ${care.title}` : '外婆照护资料'],
        ['当前风险','2026-07-12 即将复诊，陪同人与材料仍需确认'],
        ['最小授权','仅开放卧室 / 卫浴动线、复诊清单与紧急联系人摘要'],
        ['商业价值','可形成长期安心订阅，也可形成按次陪护 / 复诊材料包服务。'],
        ['回写要求','到家确认、陪护完成和复诊结果都要写回事件记录。']
      ],
      actions:[
        {label:'确认照护方案',action:'care-plan:careconfirm',primary:true},
        {label:'切换夜起关怀',action:'care-plan:elder'},
        {label:'查看成员权限',jump:'members'}
      ]
    },
    'moveout-pack':{
      title:'退租验房交接包',
      status:'待家人确认',
      progress:73,
      summary:'已把房屋合同、押金收据、水电底数、维修记录和物业验房授权整理成退租交接包，目标是降低押金争议和交接混乱。',
      steps:['读取 A002 合同档案','合并押金与水电底数','生成验房检查清单','准备物业验房授权'],
      rows:[
        ['交接对象',moveout ? `${moveout.id} / ${moveout.title}` : '房屋合同档案'],
        ['当前风险','合同 2026-08-31 到期，押金 ¥12,000 追回和验房争议是高风险事项'],
        ['最小授权','物业只可查看交接摘要、水电底数和维修记录，不可见证件与医疗档案'],
        ['商业价值','可作为单次高价值退租证据包，也可延伸保洁、维修与搬家协作'],
        ['回写要求','验房结论、争议项和押金进度都要写回事件记录与合同档案']
      ],
      actions:[
        {label:'确认交接包',action:'moveout-pack:moveoutconfirm',primary:true},
        {label:'打开房屋合同档案',open:moveout?.id || 'A002'},
        {label:'查看成员权限',jump:'members'}
      ]
    },
    'school-pack':{
      title:'小雨入学材料包',
      status:'待补件确认',
      progress:71,
      summary:'已把入学通知、户口本复印件、居住登记回执缺口、报到日期和代交授权整理成入学材料包，目标是避免补件延误和报到前慌乱。',
      steps:['读取 A006 入学档案','识别缺失材料与截止日期','生成补件清单','准备代交授权与报到回执'],
      rows:[
        ['服务对象',school ? `${school.id} / ${school.title}` : '儿童学籍档案'],
        ['当前缺口','居住登记回执清晰页仍需补拍，补件截止 2026-08-10'],
        ['最小授权','代交人或学校窗口只可查看学生材料清单、报到日期和必要联系方式'],
        ['商业价值','适合做单次入学材料包，也可延伸到疫苗证明、补件提醒和长期家庭行政事务服务'],
        ['回写要求','补件完成、材料提交和报到完成都要写回事件记录与学籍档案']
      ],
      actions:[
        {label:'确认入学材料包',action:'school-pack:schoolconfirm',primary:true},
        {label:'打开入学档案',open:school?.id || 'A006'},
        {label:'查看成员权限',jump:'members'}
      ]
    },
    'claim-pack':{
      title:'林女士报销材料包',
      status:'待补件确认',
      progress:69,
      summary:'已把门诊发票、支付小票、费用清单缺页、待核金额和提交授权整理成报销材料包，目标是避免补件往返和报销提交被退回。',
      steps:['读取 A009 报销档案','识别缺页与待核金额','生成补件清单','准备提交授权与回执记录'],
      rows:[
        ['服务对象',claim ? `${claim.id} / ${claim.title}` : '门诊报销档案'],
        ['当前缺口','费用清单第 2 页仍缺失，票据金额待核，建议 2026-07-08 前完成提交'],
        ['最小授权','理赔或报销协作方只可查看票据摘要、缺失清单、提交状态和必要联系方式'],
        ['商业价值','适合做单次报销材料包，也可延伸到商保理赔、发票核对和长期家庭行政事务服务'],
        ['回写要求','补件完成、资料提交和报销结果都要写回事件记录与报销档案']
      ],
      actions:[
        {label:'确认报销材料包',action:'claim-pack:claimconfirm',primary:true},
        {label:'打开报销档案',open:claim?.id || 'A009'},
        {label:'查看成员权限',jump:'members'}
      ]
    },
    'material-pack':{
      title:'洗衣机报修单',
      status:'待用户确认',
      progress:76,
      summary:'已把水浸事件、洗衣机保修档案、历史维修记录和售后联系人整理成报修单，解决报修沟通成本。',
      steps:['读取洗衣机档案','提取保修到期与型号','关联今日水浸事件','生成报修信息'],
      rows:[
        ['设备资料',archive?.title || '洗衣机保修档案'],
        ['故障描述','生活阳台洗衣机附近出现水浸风险'],
        ['历史记录','上次排水泵维修记录和售后联系人'],
        ['业务价值','可作为单次付费材料包，也可作为维修服务履约入口。'],
        ['保护规则','只使用报修必要信息，不带出其他家庭档案']
      ],
      actions:[
        {label:'确认报修单',action:'material-pack:confirm',primary:true},
        {label:'打开洗衣机档案',open:archive?.id || 'A001'},
        {label:'查看事件记录',jump:'timeline'}
      ]
    },
    'privacy-vault':{
      title:'资料保护设置',
      status:'权限草案',
      progress:68,
      summary:'已检查敏感资料，默认隐藏精确位置，只保留必要摘要，确保服务商业化不破坏家庭信任。',
      steps:['识别敏感档案','隐藏精确位置','生成家人可见范围','准备撤回记录'],
      rows:[
        ['隐藏精确位置',`${hidden} 份资料`],
        ['家庭成员可见','只显示房间或遮罩位置，敏感字段默认折叠'],
        ['外部服务可见','仅在家人授权后读取必要摘要'],
        ['信任壁垒','隐私边界越清楚，维修、理赔和养老服务越容易被授权。'],
        ['审计记录','每次查看和授权都写入档案操作日志']
      ],
      actions:[
        {label:'保存保护设置',action:'privacy-vault:policy',primary:true},
        {label:'进入空间视图',jump:'library'},
        {label:'查看事件记录',jump:'timeline'}
      ]
    },
    'service-auth':{
      title:'维修师傅授权单',
      status:'等待确认',
      progress:72,
      summary:'维修师傅只会看到故障、设备型号、保修状态和联系方式，不会看到完整家庭档案；服务完成后回写证据链。',
      steps:['提取维修需求','压缩可见字段','生成家人确认项','准备回写处理结果'],
      rows:[
        ['要处理的事','洗衣机排水口水浸检查'],
        ['可以给对方看','设备型号、保修到期、事件时间、用户确认的联系方式'],
        ['禁止披露','其他家庭成员档案、合同原件、空间精确隐私位置'],
        ['商业入口','维修商接收用户授权后的最小材料包，平台获得履约分成空间。'],
        ['回写结果','处理记录回写 A001 档案和事件记录']
      ],
      actions:[
        {label:'确认授权单',action:'service-auth:authorize',primary:true},
        {label:'生成处理事项',jump:'risk'},
        {label:'查看事件记录',jump:'timeline'}
      ]
    },
    'hardware-kit':{
      title:'智能设备安装建议',
      status:'方案草案',
      progress:74,
      summary:'按当前三室一厅和阳台水浸风险，生成设备位置和费用预估，把家庭 OS 延展到硬件与安装服务。',
      steps:['读取 2D 空间蓝图','标记阳台/玄关/卧室/卫生间','生成设备清单','估算安装服务'],
      rows:[
        ['阳台','水浸传感器 1 个 + 智能水阀建议点位'],
        ['玄关','门锁/门磁 + 入户摄像头建议点位'],
        ['卧室/卫生间','人体传感器 + 夜起路径灯建议点位'],
        ['渠道价值','智能家居安装商可基于用户授权的蓝图生成方案和报价。'],
        ['参考报价','设备 ¥799 · 安装 ¥260 · AI 安心订阅 ¥29.9/月']
      ],
      actions:[
        {label:'保存安装建议',action:'hardware-kit:quote',primary:true},
        {label:'查看空间蓝图',jump:'library'},
        {label:'回到 3D 家况',jump:'dashboard'}
      ]
    }
  };
  return Object.assign(base, runs[kind] || runs['risk-report']);
}

function runServiceDemo(kind){
  focusServiceDemo(kind);
  state.serviceRuns = state.serviceRuns || {};
  const runData = buildServiceRun(kind);
  state.serviceRuns[kind] = runData;

  // 创建服务订单
  const cardData = serviceCardDefinitions().find(c => c.id === kind);
  if(cardData){
    const order = createServiceOrder(kind, {
      title: cardData.title,
      action: cardData.action,
      steps: runData.steps || [],
      ...runData
    });
    toast(`已创建服务订单：${cardData.title}`);

    // 模拟订单处理流程（演示用）
    setTimeout(() => {
      authorizeServiceOrder(order.id);
      render();
      toast('服务已授权，准备开始处理');
    }, 2000);

    setTimeout(() => {
      startServiceOrder(order.id);
      render();
      toast('服务处理中...');
    }, 4000);
  }

  recordServiceEvent(kind, 'generated', state.serviceRuns[kind]);
  saveState();
  render();
}

function serviceArchiveFor(kind){
  if(kind === 'care-plan') return careArchive();
  if(kind === 'moveout-pack') return moveoutArchive();
  if(kind === 'school-pack') return schoolArchive();
  if(kind === 'claim-pack') return claimArchive();
  return incidentArchive(activeIncident());
}

function recordServiceEvent(kind, phase, run){
  const archive = serviceArchiveFor(kind);
  if(!archive || !run) return;
  archive.events = archive.events || [];
  archive.operations = archive.operations || [];
  const eventKey = `${kind}:${phase}`;
  const eventType = kind === 'material-pack'
    ? '报修材料包'
    : kind === 'service-auth'
      ? '服务授权'
      : kind === 'risk-report'
        ? '安全体检'
        : kind === 'care-plan'
          ? '照护方案'
          : kind === 'subscription-plan'
            ? '安心订阅'
            : kind === 'moveout-pack'
              ? '退租交接包'
              : kind === 'school-pack'
                ? '入学材料包'
                : kind === 'claim-pack'
                  ? '报销材料包'
            : '家庭服务';
  const desc = phase === 'generated'
    ? `${run.title}已生成，等待家人确认，确认前不会发给外部服务。`
    : `${run.title}${servicePhaseText(phase)}，结果写入档案与事件记录。`;
  if(!archive.events.some(e=>e.serviceEventKey === eventKey)){
    archive.events.push(Object.assign(ev(TODAY, eventType, desc, '家庭服务', ''), {serviceEventKey:eventKey}));
  }
  if(!archive.operations.some(o=>o.action.includes(`${run.title} - ${phase}`))){
    archive.operations.push(op(nowStr(),`家庭服务：${run.title} - ${phase === 'generated' ? '生成草案' : servicePhaseText(phase)}`,'家庭服务'));
  }
}

function handleServiceAction(action){
  const [kind, phase] = String(action || '').split(':');
  if(!kind || !phase) return;
  state.serviceRuns = state.serviceRuns || {};
  if(!state.serviceRuns[kind]) state.serviceRuns[kind] = buildServiceRun(kind);
  const run = state.serviceRuns[kind];
  run.phase = phase;
  run.updatedAt = nowStr();
  run.progress = 100;
  run.status = servicePhaseText(phase);
  run.audit = `已在 ${run.updatedAt} 执行：${servicePhaseText(phase)}。`;
  recordServiceEvent(kind, phase, run);
  const care = careArchive();
  if(kind === 'care-plan' && care){
    care.nextActions = mergeUniqueArray(care.nextActions || [], ['确认陪同人','准备医保卡与血糖记录','陪护完成后回写复诊结果']);
    care.operations = care.operations || [];
    if(!care.operations.some(o=>o.action.includes('照护方案'))){
      care.operations.push(op(nowStr(),`家庭服务：${run.title} - ${servicePhaseText(phase)}`,'家庭服务'));
    }
    care.reminders = care.reminders || [];
    if(phase === 'careconfirm'){
      const reminderId = 'R-CARE-001';
      if(!care.reminders.some(r=>r.id === reminderId)){
        care.reminders.unshift(rem(reminderId,'2026-07-11','确认外婆复诊陪同人与到家陪护交接','in_progress'));
      }else{
        const existing = care.reminders.find(r=>r.id === reminderId);
        existing.status = 'in_progress';
      }
      care.handover = '林女士负责复诊前准备与陪同确认；陪护人员只可查看必要清单，完成后回写陪护回执。';
    }
  }
  const lease = moveoutArchive();
  if(kind === 'moveout-pack' && lease){
    lease.nextActions = mergeUniqueArray(lease.nextActions || [], ['确认验房时间','打印押金收据与合同签字页','回写押金进度与争议项']);
    lease.operations = lease.operations || [];
    if(!lease.operations.some(o=>o.action.includes('退租验房交接包'))){
      lease.operations.push(op(nowStr(),`家庭服务：${run.title} - ${servicePhaseText(phase)}`,'家庭服务'));
    }
    if(phase === 'moveoutconfirm'){
      const reminderId = 'R-MOVE-001';
      if(!lease.reminders.some(r=>r.id === reminderId)){
        lease.reminders.unshift(rem(reminderId,'2026-08-16','确认物业验房时间并带齐押金收据、水电底数','in_progress'));
      }else{
        const existing = lease.reminders.find(r=>r.id === reminderId);
        existing.status = 'in_progress';
      }
      lease.handover = '周先生负责退租交接与押金追回；物业验房只可查看交接摘要、水电底数和维修记录，争议项需回写事件记录。';
    }
  }
  const school = schoolArchive();
  if(kind === 'school-pack' && school){
    school.nextActions = mergeUniqueArray(school.nextActions || [], ['补拍居住登记回执清晰页','确认学校材料清单','回写报到完成状态']);
    school.operations = school.operations || [];
    if(!school.operations.some(o=>o.action.includes('入学材料包'))){
      school.operations.push(op(nowStr(),`家庭服务：${run.title} - ${servicePhaseText(phase)}`,'家庭服务'));
    }
    if(phase === 'schoolconfirm'){
      const reminderId = 'R-SCHOOL-001';
      if(!school.reminders.some(r=>r.id === reminderId)){
        school.reminders.unshift(rem(reminderId,'2026-08-10','确认居住登记回执清晰页已补拍并准备报到提交','in_progress'));
      }else{
        const existing = school.reminders.find(r=>r.id === reminderId);
        existing.status = 'in_progress';
      }
      school.handover = '入学材料由林女士负责。代交人或学校窗口只可查看入学清单与必要联系方式，补件和报到完成后需回写结果。';
    }
  }
  const claim = claimArchive();
  if(kind === 'claim-pack' && claim){
    claim.nextActions = mergeUniqueArray(claim.nextActions || [], ['补齐费用清单第 2 页','核对票据最终金额','回写报销提交与到账结果']);
    claim.operations = claim.operations || [];
    claim.reminders = claim.reminders || [];
    claim.status = 'supplement_in_progress';
    if(!claim.operations.some(o=>o.action.includes('报销材料包'))){
      claim.operations.push(op(nowStr(),`家庭服务：${run.title} - ${servicePhaseText(phase)}`,'家庭服务'));
    }
    if(phase === 'claimconfirm'){
      const reminderId = 'R-CLAIM-001';
      if(!claim.reminders.some(r=>r.id === reminderId)){
        claim.reminders.unshift(rem(reminderId,'2026-07-08','确认费用清单第 2 页已补齐并提交报销材料','in_progress'));
      }else{
        const existing = claim.reminders.find(r=>r.id === reminderId);
        existing.status = 'in_progress';
      }
      claim.handover = '报销资料由林女士负责。理赔或报销协作方只可查看票据摘要、缺失清单和必要联系方式，提交与到账结果需回写。';
    }
  }
  if(phase === 'receipt'){
    if(kind === 'service-auth'){
      state.incidentStatus = 'done';
      const incident = activeIncident();
      const reminderId = incident?.reminderId;
      const reminderArchive = incidentArchive(incident);
      if(reminderArchive && reminderId){
        const reminder = (reminderArchive.reminders || []).find(r=>r.id === reminderId);
        if(reminder) reminder.status = 'done';
      }
    }
    if(kind === 'moveout-pack' && lease){
      lease.nextActions = mergeUniqueArray(lease.nextActions || [], ['等待押金到账结果']);
    }
    if(kind === 'school-pack' && school){
      school.nextActions = mergeUniqueArray(school.nextActions || [], ['等待学校报到结果回写']);
    }
    if(kind === 'claim-pack' && claim){
      claim.nextActions = mergeUniqueArray(claim.nextActions || [], ['等待报销到账结果']);
    }
  }
  const jumpToScenario = (kind === 'subscription-plan' || kind === 'care-plan') && phase === 'elder';
  if(jumpToScenario){
    const scenario = homeScenarioById('elder-care');
    state.activeHomeScenario = scenario.id;
    state.assistantQuery = scenario.aiQuery;
    if(scenario.apply){
      state.lightOn = scenario.apply.lightOn;
      state.windowOpen = scenario.apply.windowOpen;
      state.rightDoorOpen = scenario.apply.rightDoorOpen;
    }
    state.tourNode = scenario.tourNode;
    state.spaceFilter = scenario.zone;
    state.highlightedZone = scenario.zone;
    state.roomFilter = activeRoomId(scenario.zone);
  }
  saveState();
  if(jumpToScenario) setView('home');
  else render();
  toast(servicePhaseText(phase));
}

function servicePhaseText(phase){
  return {
    archive:'已保存体检清单',
    subscribe:'已保存订阅方案',
    careconfirm:'已确认照护方案',
    moveoutconfirm:'已确认交接包',
    schoolconfirm:'已确认入学材料包',
    claimconfirm:'已确认报销材料包',
    receipt:'已提交服务回执',
    elder:'已切换夜起关怀',
    confirm:'已确认报修单',
    policy:'已保存保护设置',
    authorize:'已确认授权单',
    quote:'已保存安装建议'
  }[phase] || '已更新服务单';
}

function serviceDemoHTML(card){
  const kind = card.id || card;
  const meta = typeof card === 'string' ? serviceCardDefinitions().find(item=>item.id === kind) : card;
  const run = serviceRunFor(kind);
  const serviceAuth = authorizationForServiceDemo(kind);
  const authBoundary = kind === 'service-auth'
    ? serviceAuthBoundaryHTML({compact:true})
    : serviceAuth
      ? authorizationBoundaryHTML(serviceAuth)
      : '';
  if(!run){
    return `<aside class="card service-demo-panel"><div class="card-h"><span class="t">${esc(meta.title)}服务单</span><span class="tag gray" style="margin-left:auto">未生成</span></div><div class="card-b">
      ${authBoundary}
      <div class="service-empty-run">
        <strong>${esc(meta.action)}</strong>
        <span>点击后生成服务单草案，家人确认后才继续处理，确认前不会连接外部服务。</span>
        <button class="btn btn-primary btn-sm" data-service-run="${esc(kind)}">${esc(meta.action)}</button>
      </div>
    </div></aside>`;
  }
  return `<aside class="card service-demo-panel"><div class="card-h"><span class="t">${esc(run.title)}</span><span class="tag brand" style="margin-left:auto">${esc(run.status)}</span></div><div class="card-b">
    ${authBoundary}
    <div class="service-run-status">
      <div><strong>${esc(run.summary)}</strong><span>生成时间 ${esc(run.generatedAt)}${run.updatedAt && run.updatedAt !== run.generatedAt ? ` · 更新 ${esc(run.updatedAt)}` : ''}</span></div>
      <em>${run.progress}%</em>
    </div>
    <div class="service-progress"><i style="width:${Math.min(100, Math.max(4, run.progress || 0))}%"></i></div>
    ${serviceOpsMetaHTML(kind, run)}
    <div class="service-step-list mt12">
      ${run.steps.map((step,i)=>`<div class="${i < Math.ceil((run.progress || 0) / 25) ? 'done' : ''}"><b>${i+1}</b><span>${esc(step)}</span></div>`).join('')}
    </div>
    <div class="service-demo-rows mt12">
      ${run.rows.map(([k,v])=>`<div class="service-demo-row"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}
    </div>
    ${run.audit ? `<div class="service-audit mt12">${esc(run.audit)}</div>` : ''}
    <div class="service-card-actions mt12">
      ${run.actions.map(action=>serviceActionButtonHTML(action)).join('')}
    </div>
  </div></aside>`;
}

function serviceActionButtonHTML(action){
  const cls = action.primary ? 'btn-primary' : 'btn-outline';
  if(action.open) return `<button class="btn ${cls} btn-sm" data-open="${esc(action.open)}">${esc(action.label)}</button>`;
  if(action.jump) return `<button class="btn ${cls} btn-sm" data-jump="${esc(action.jump)}">${esc(action.label)}</button>`;
  if(action.action) return `<button class="btn ${cls} btn-sm" data-service-action="${esc(action.action)}">${esc(action.label)}</button>`;
  return '';
}

function riskTabHTML(items, tab){
  if(!items.length) return `<div class="empty"><div class="t">${tab==='done'?'还没有完成记录':'当前没有事项'}</div><div class="s">处理后会自动留在详情和时间线里。</div></div>`;
  const buckets = riskBuckets(items, tab);
  return `<div class="risk-bucket-list">${buckets.map(bucket=>`<section class="risk-bucket">
    <div class="risk-bucket-head"><div><strong>${esc(bucket.title)}</strong><span>${esc(bucket.sub)}</span></div><em>${bucket.items.length}</em></div>
    <div class="risk-compact-list">${bucket.items.map(item=>{
    const a = item.archive;
    const pri = item.days===999 ? {c:'brand',t:'待补资料'} : reminderPriority(item.days);
    const context = riskMatterContext(item);
    return `<div class="risk-card" data-open="${a.id}">
      <div class="risk-card-head">
        <div><div class="risk-title">${esc(item.title)}</div><div class="risk-sub">${esc(a.title)} · ${esc(a.familyMember)}</div></div>
        <span class="tag ${pri.c}">${item.days===999?'待补资料':displayRiskDue(item)}</span>
      </div>
      <div class="risk-decision-grid">
        <span><b>损失</b>${esc(context.loss)}</span>
        <span><b>责任</b>${esc(context.owner)}</span>
        <span><b>证据</b>${esc(context.evidence)}</span>
        <span><b>服务</b>${esc(context.service)}</span>
      </div>
      <div class="risk-card-meta"><span>${esc(item.next)}</span><span>${esc(context.paid)}</span><span>${esc(a.operations[a.operations.length-1]?.action || '暂无动作')}</span></div>
    </div>`;
  }).join('')}</div></section>`).join('')}</div>`;
}

function displayRiskDue(item){
  if(item.days === 999) return '待补资料';
  if(item.days < 0) return '已过';
  if(item.days === 0) return '今天';
  return `${item.days} 天后`;
}

function riskBuckets(items, tab){
  if(tab === 'done') return groupRiskByMonth(items);
  if(tab === 'progress') return [
    {title:'正在处理', sub:'已经开始，继续把它收尾', items:items.filter(i=>i.type==='reminder' || i.type==='incident')},
    {title:'补资料', sub:'补齐后再归档', items:items.filter(i=>i.type==='supplement')}
  ].filter(b=>b.items.length);
  return [
    {title:'先处理', sub:'15 天内或已过期', items:items.filter(i=>i.days!==999 && i.days<=15)},
    {title:'补齐资料', sub:'缺一项、缺一张先补上', items:items.filter(i=>i.days===999)},
    {title:'近期安排', sub:'16-45 天内需要看一眼', items:items.filter(i=>i.days!==999 && i.days>15 && i.days<=45)},
    {title:'后面再看', sub:'已有提醒，暂不打扰', items:items.filter(i=>i.days!==999 && i.days>45)}
  ].filter(b=>b.items.length);
}

function groupRiskByMonth(items){
  const groups = {};
  items.forEach(item=>{
    const date = item.date || item.reminder?.date || item.archive.date || TODAY;
    const key = date.slice(0,7);
    (groups[key] ||= []).push(item);
  });
  return Object.keys(groups).sort().reverse().map(key=>({title:key, sub:'已处理记录', items:groups[key]}));
}

function openDrawer(id){
  const a = state.archives.find(x=>x.id===id);
  if(!a) return;
  state.drawerArchiveId = id;
  state.drawerEdit = false;
  $('#drawer-title').textContent = a.title;
  renderDrawer(a);
  $('#drawer').classList.add('open');
  $('#drawer-mask').classList.add('open');
}

function renderDrawer(a){
  const c = catColor(a.category);
  const nearest = nearestReminder(a);
  const main = drawerMainAction(a, nearest);
  const asset = archiveAssetProfile(a);
  $('#drawer-body').innerHTML = `<div class="drawer-sec drawer-hero">
    <div class="flex gap8 wrap"><span class="tag" style="background:${c.bg};color:${c.color}">${c.ico} ${a.category}</span><span class="tag ${riskTag(a.riskLevel).c}">${riskTag(a.riskLevel).t}</span><span class="tag ${statusTag(a.status).c}">${statusTag(a.status).t}</span><span class="tag gray">${a.id}</span></div>
    <div class="drawer-summary-grid mt12">
      <div class="summary-card"><span class="summary-k">家庭成员</span><span class="summary-v">${esc(a.familyMember)}</span></div>
      <div class="summary-card"><span class="summary-k">金额或期限</span><span class="summary-v">${esc(a.amountOrTerm)}</span></div>
      <div class="summary-card"><span class="summary-k">记忆位置</span><span class="summary-v">${esc(displayLocation(a))}</span></div>
      <div class="summary-card"><span class="summary-k">隐私等级</span><span class="summary-v">${PRIVACY_TEXT[a.locationPrivacy]} · 置信 ${Math.round((a.locationConfidence||0)*100)}%</span></div>
    </div>
    <div class="mt12"><button class="btn btn-primary btn-sm" ${main.attr}>${esc(main.label)}</button></div>
  </div>
  <div class="drawer-sec"><h5>资产价值账本</h5><div class="asset-drawer-panel">
    <div><b>${esc(asset.exposure)}</b><span>可量化金额/责任</span></div>
    <div><b>${esc(asset.proof)}</b><span>证据完整度</span></div>
    <div><b>${esc(asset.risk)}</b><span>风险触发</span></div>
    <div><b>${esc(asset.service)}</b><span>服务入口</span></div>
  </div><div class="notice info mt10">商业价值：${esc(asset.paid)}。系统只在用户授权后输出最小材料包，服务方不接触完整家庭档案。</div></div>
  <div class="drawer-sec">${aiExplainHTML(a)}</div>
  ${archiveIncidentHTML(a)}
  ${a.lowConfidence ? `<div class="drawer-sec">${lowDetailHTML(a)}</div>` : ''}
  <div class="drawer-sec"><h5>证据材料</h5><div class="preview-pane" style="min-height:auto"><div class="doc-mock" style="max-width:none"><h4>${esc(a.title)}</h4><div class="ln l"></div><div class="ln m"></div><div class="ln s"></div><div class="doc-meta">${esc(a.rawPreview)}</div><div class="stamp">${esc(a.rawType)}</div></div></div><div class="chips mt10">${a.evidence.map(e=>`<span class="arc-field">${esc(e)}</span>`).join('')}</div></div>
  <div class="drawer-sec"><h5>字段结果</h5><div class="field-grid">${a.fields.map((field,i)=>drawerFieldHTML(field,i,state.drawerEdit)).join('')}</div><div class="flex gap8 wrap mt12">${state.drawerEdit?`<button class="btn btn-primary btn-sm" id="save-fields">保存修正</button><button class="btn btn-outline btn-sm" id="cancel-edit">取消</button>`:`<button class="btn btn-outline btn-sm" id="edit-fields">修正字段</button>`}</div></div>
  <div class="drawer-sec"><h5>提醒处理</h5>${a.reminders.map(r=>reminderRowHTML(r)).join('') || '<div class="notice">暂无提醒</div>'}</div>
  ${serviceReceiptSectionHTML(a)}
  <div class="drawer-sec"><h5>交接说明</h5><div class="notice info">${esc(a.handover)}</div></div>
  <div class="drawer-sec"><h5>时间线记录</h5>${a.events.map(e=>`<div class="row"><div class="arc-ic" style="background:${c.bg};color:${c.color}">${esc(e.type.slice(0,1))}</div><div class="row-main"><div class="row-title">${esc(e.desc)}</div><div class="row-sub">${esc(e.date)} · ${esc(e.member)}${e.amount?' · '+esc(e.amount):''}</div></div><span class="tag gray">${esc(e.type)}</span></div>`).join('')}</div>
  <div class="drawer-sec"><h5>操作日志</h5>${a.operations.map(o=>`<div class="op-log"><span class="op-time">${esc(o.time)}</span><span><b>${esc(o.member)}</b> ${esc(o.action)}</span></div>`).join('')}</div>`;
  bindDrawerEvents(a);
}

function drawerMainAction(a, nearest){
  if(a.status==='supplement') return {label:'开始补资料', attr:`data-drawer-supp-progress="${a.id}"`};
  if(a.status==='supplement_in_progress') return {label:'标记已补齐', attr:`data-drawer-supp-complete="${a.id}"`};
  if(nearest) return {label:nearest.status==='in_progress'?'完成处理中提醒':'开始处理提醒', attr:nearest.status==='in_progress'?`data-drawer-reminder-done="${nearest.id}"`:`data-drawer-reminder-progress="${nearest.id}"`};
  return {label:'生成交接说明', attr:`data-drawer-action="handover"`};
}

function serviceDemoKindFromEvent(event){
  const key = String(event?.serviceEventKey || '');
  return key.split(':')[0] || null;
}

function serviceKindLabel(kind){
  return {
    'risk-report':'家庭安全体检',
    'subscription-plan':'AI 安心订阅',
    'care-plan':'老人照护方案',
    'moveout-pack':'退租交接包',
    'school-pack':'入学材料包',
    'claim-pack':'报销材料包',
    'material-pack':'报修材料包',
    'service-auth':'维修授权单',
    'hardware-kit':'安装建议'
  }[kind] || '家庭服务';
}

function archiveServiceEvents(a){
  return (a.events || []).filter(event=>!!event.serviceEventKey);
}

function serviceReceiptSectionHTML(a){
  const events = archiveServiceEvents(a).slice().reverse();
  if(!events.length) return `<div class="drawer-sec"><h5>服务回执</h5><div class="notice">当前档案还没有生成服务单或授权回执。</div></div>`;
  return `<div class="drawer-sec"><h5>服务回执</h5>
    ${events.map(event=>{
      const kind = serviceDemoKindFromEvent(event);
      const run = kind ? serviceRunFor(kind) : null;
      return `<div class="row">
        <div class="arc-ic" style="background:var(--brand-soft);color:var(--brand-deep)">服</div>
        <div class="row-main">
          <div class="row-title">${esc(serviceKindLabel(kind))} · ${esc(event.desc)}</div>
          <div class="row-sub">${esc(event.date)} · ${esc(event.member || '家庭服务')}${run?.status ? ` · ${esc(run.status)}` : ''}</div>
        </div>
        ${kind ? `<button class="btn btn-outline btn-sm" data-service-demo-jump="${esc(kind)}">查看服务单</button>` : `<span class="tag gray">留痕</span>`}
      </div>`;
    }).join('')}
  </div>`;
}

function aiExplainHTML(a){
  return `<h5>AI 解释</h5><div class="ai-card"><div class="ai-card-grid">
    <div class="ai-judge-item"><div class="k">识别类型</div><div class="v">${esc(a.ai.type)}</div></div>
    <div class="ai-judge-item"><div class="k">归档理由</div><div class="v">${esc(a.ai.reason)}</div></div>
    <div class="ai-judge-item"><div class="k">风险判断</div><div class="v">${esc(a.ai.risk)}</div></div>
    <div class="ai-judge-item"><div class="k">归位建议</div><div class="v">${esc(displayLocation(a))}<br>${esc(a.locationSource || '')}</div></div>
    <div class="ai-judge-item"><div class="k">隐私建议</div><div class="v">${esc(a.ai.privacy)}</div></div>
    <div class="ai-judge-item"><div class="k">需要补充</div><div class="v">${a.ai.questions.map(esc).join('<br>')}</div></div>
  </div></div>`;
}

function archiveIncidentHTML(a){
  const incident = DEMO_INCIDENTS.find(item=>item.evidenceArchiveIds.includes(a.id));
  if(!incident) return '';
  return `<div class="drawer-sec"><h5>关联空间事件</h5><div class="incident-decision-card ${incidentToneClass()}">
    <div class="incident-head"><div><strong>${esc(incident.title)}</strong><div class="inspector-sub">${esc(incident.room)} · ${esc(incident.device.locationLabel)}</div></div><span class="tag ${incidentToneClass()}">${incidentStatusText()}</span></div>
    <div class="incident-copy">${esc(incident.ai.what)}</div>
    <div class="incident-detail">
      <div><b>AI 依据</b>${esc(incident.ai.why)}</div>
      <div><b>下一步</b>${incident.ai.next.map(esc).join('、')}</div>
    </div>
    <div class="incident-actions"><button class="btn btn-primary btn-sm" data-incident-locate>查看 2D 定位</button><button class="btn btn-outline btn-sm" data-incident-action>${state.incidentStatus==='done'?'查看事件记录':'处理事件'}</button></div>
  </div></div>`;
}

function lowDetailHTML(a){
  const l = a.lowConfidence;
  return `<h5>低置信度追溯</h5><div class="low-card"><div class="low-title">${esc(l.archiveName)}</div><div class="low-grid"><div><strong>模糊原因</strong><br>${esc(l.reason)}</div><div><strong>缺失字段</strong><br>${l.missing.map(esc).join('')}</div><div><strong>AI 追问</strong><br>${l.questions.map(esc).join('<br>')}</div><div><strong>人工补全</strong><br>${esc(l.manual)}</div></div><div class="notice mt10">${esc(l.trace)}</div></div>`;
}

function drawerFieldHTML(field,index,editable){
  const st = fieldStatus(field);
  const cls = st==='fail'?'fail':st==='warn'?'warn':'';
  const color = st==='fail'?'var(--danger)':st==='warn'?'var(--warn)':'var(--ok)';
  return `<div class="field ${cls}"><div class="field-k">${esc(field.k)}</div>${editable?`<input data-dfidx="${index}" value="${esc(field.v)}" />`:`<div class="field-v">${esc(field.v || '')}</div>`}<div class="field-source">${sourceLabel(field.source)} · ${confidenceLabel(field.confidence||0)}</div><div class="conf-bar"><div class="conf-track"><i style="width:${Math.round((field.confidence||0)*100)}%;background:${color}"></i></div><span class="conf-pct" style="color:${color}">${Math.round((field.confidence||0)*100)}%</span></div></div>`;
}

function reminderRowHTML(r){
  const d = daysUntil(r.date);
  const tag = r.status==='done' ? {c:'ok',t:'已完成'} : r.status==='in_progress' ? {c:'brand',t:'处理中'} : reminderPriority(d);
  return `<div class="row"><div class="arc-ic" style="background:var(--warn-soft);color:var(--warn)">!</div><div class="row-main"><div class="row-title">${esc(r.action)}</div><div class="row-sub">${esc(r.date)} · ${d>=0?d+' 天后':'已过'}</div></div><span class="tag ${tag.c}">${reminderStateText(r.status)}</span>${r.status==='pending'?`<button class="btn btn-outline btn-sm" data-drawer-reminder-progress="${r.id}">转处理中</button>`:''}${r.status==='in_progress'?`<button class="btn btn-outline btn-sm" data-drawer-reminder-done="${r.id}">完成</button>`:''}</div>`;
}

function closeDrawer(){
  $('#drawer').classList.remove('open');
  $('#drawer-mask').classList.remove('open');
  state.drawerEdit = false;
}

function refreshCurrent(a){
  saveState();
  render();
  if(a && $('#drawer').classList.contains('open') && state.drawerArchiveId===a.id) renderDrawer(a);
}

function bindDrawerEvents(a){
  $$('#drawer-body [data-drawer-reminder-progress]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation();
    const r = a.reminders.find(x=>x.id===btn.dataset.drawerReminderProgress);
    if(r && r.status==='pending'){
      r.status = 'in_progress';
      a.operations.push(op(nowStr(),'开始处理提醒：'+r.action,'当前用户'));
      refreshCurrent(a);
      toast('事项已转为处理中');
    }
  }));
  $$('#drawer-body [data-drawer-reminder-done]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation();
    const r = a.reminders.find(x=>x.id===btn.dataset.drawerReminderDone);
    if(r && r.status!=='done'){
      r.status = 'done';
      a.operations.push(op(nowStr(),'完成提醒：'+r.action,'当前用户'));
      completeIncidentIfNeeded(r.id, a);
      refreshCurrent(a);
      toast('提醒已完成');
    }
  }));
  const suppProgress = $('[data-drawer-supp-progress]');
  if(suppProgress) suppProgress.addEventListener('click',()=>{
    a.status = 'supplement_in_progress';
    a.operations.push(op(nowStr(),'开始补资料','当前用户'));
    refreshCurrent(a);
    toast('已开始补资料');
  });
  const suppComplete = $('[data-drawer-supp-complete]');
  if(suppComplete) suppComplete.addEventListener('click',()=>{
    a.status = 'archived';
    a.operations.push(op(nowStr(),'补资料完成并归档','当前用户'));
    refreshCurrent(a);
    toast('资料已补齐');
  });
  const action = $('[data-drawer-action]');
  if(action) action.addEventListener('click',()=>{
    a.handover += `\n[${nowStr()}] 已生成最新交接说明：${a.title}，位置 ${displayLocation(a)}，下一步 ${nearestReminder(a)?.action || '暂无提醒'}。`;
    a.operations.push(op(nowStr(),'生成家庭交接说明','当前用户'));
    refreshCurrent(a);
    toast('已生成交接说明');
  });
  $$('#drawer-body [data-incident-action]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation();
    if(state.incidentStatus === 'done'){
      state.timelineFilter = 'risk';
      saveState();
      setView('timeline');
    }else{
      startIncidentHandling({jumpToRisk:false});
    }
  }));
  $$('#drawer-body [data-service-demo-jump]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation();
    focusServiceDemo(btn.dataset.serviceDemoJump);
    saveState();
    closeDrawer();
    setView('services');
  }));
  const edit = $('#edit-fields');
  if(edit) edit.addEventListener('click',()=>{ state.drawerEdit = true; renderDrawer(a); });
  const cancel = $('#cancel-edit');
  if(cancel) cancel.addEventListener('click',()=>{ state.drawerEdit = false; renderDrawer(a); });
  const save = $('#save-fields');
  if(save) save.addEventListener('click',()=>{
    const changed = [];
    $$('#drawer-body input[data-dfidx]').forEach(input=>{
      const idx = Number(input.dataset.dfidx);
      if(a.fields[idx] && a.fields[idx].v !== input.value){
        changed.push(a.fields[idx].k);
        a.fields[idx].v = input.value;
        a.fields[idx].source = 'manual';
        a.fields[idx].confidence = .95;
      }
    });
    if(changed.length) a.operations.push(op(nowStr(),'人工修正字段：'+changed.join('、'),'当前用户'));
    state.drawerEdit = false;
    refreshCurrent(a);
    toast(changed.length ? '字段修正已保存' : '没有字段变化');
  });
}

function startAI(){
  const p = state.pending.find(x=>x.id===state.currentPendingId && !x._done);
  if(!p) return;
  state.aiStage = 'scanning';
  render();
  aiTimer = setTimeout(()=>{ state.aiStage='extracting'; render();
    aiTimer = setTimeout(()=>{ state.aiStage='judging'; render();
      aiTimer = setTimeout(()=>{ state.aiStage='confirm'; render(); aiTimer=null; },700);
    },700);
  },700);
}

function confirmFields(){
  const p = state.pending.find(x=>x.id===state.currentPendingId && !x._done);
  if(!p) return;
  $$('.field input[data-fidx]').forEach(input=>{
    const idx = Number(input.dataset.fidx);
    if(p.detectedFields[idx] && p.detectedFields[idx].v !== input.value){
      p.detectedFields[idx].v = input.value;
      p.detectedFields[idx].source = 'manual';
      p.detectedFields[idx].confidence = .95;
    }
  });
  const missing = p.detectedFields.filter(x=>fieldStatus(x)==='fail');
  if(missing.length){
    toast('仍有字段未补全：'+missing.map(x=>x.k).join('、'));
    return;
  }
  const newArchive = buildArchiveFromPending(p);
  state.archives.push(newArchive);
  p._done = true;
  state.aiStage = 'done';
  state.lastArchiveResult = {id:newArchive.id, title:newArchive.title};
  saveState();
  render();
  toast('已写入档案：'+newArchive.title);
}

function buildArchiveFromPending(p){
  const fields = p.detectedFields.map(x=>({...x}));
  const newId = nextId('A', state.archives);
  const dateField = fields.find(x=>/日期|购买|报到|就诊/.test(x.k));
  const amountField = fields.find(x=>/金额|保费/.test(x.k));
  const expire = fields.find(x=>/到期|有效期|截止|报到/.test(x.k));
  const zone = p.category==='儿童学籍' ? 'study' : p.category==='旅行证件' ? 'safe' : p.category==='报销票据' ? 'living' : 'study';
  const privacy = ['儿童学籍','旅行证件','报销票据'].includes(p.category) ? (p.category==='旅行证件'?'hidden':'room_only') : 'public';
  const title = p.lowConfidence?.archiveName || p.title;
  return {
    id:newId, title, category:p.category, status:p.lowConfidence?'supplement':'archived', riskLevel:p.lowConfidence?'high':'medium',
    familyMember:fieldValue(fields,'家庭成员') || '全家', date:dateField?.v || TODAY, amountOrTerm:(amountField?.v || '未识别金额') + (expire?.v ? ` / ${expire.k} ${expire.v}` : ''),
    sourceMaterial:p.rawType, rawType:p.rawType, rawPreview:p.preview, fields,
    evidence:['导入资料识别','AI 字段结果','人工确认记录'],
    events:[ev(dateField?.v || TODAY,'归档',`${title} 完成 AI 归档`,fieldValue(fields,'家庭成员') || '全家',amountField?.v || '')],
    reminders:expire?.v && !String(expire.v).includes('?') ? [rem(nextId('R', state.archives.flatMap(a=>a.reminders)), expire.v, `${p.category}关键日期提醒`, 'pending')] : [],
    operations:[op(nowStr(),'AI 归档生成档案','系统'), op(nowStr(),p.lowConfidence?'人工补全后写入档案':'用户确认字段后写入档案','当前用户')],
    handover:'本档案由 AI 归档流程生成，家庭成员可继续补充交接说明。',
    lowConfidence:p.lowConfidence ? clone(p.lowConfidence) : null,
    ai:clone(p.ai),
    memoryRoom:SPACE_ZONES.find(z=>z.id===zone).room,
    memoryZone:zone,
    memoryContainer:p.category==='家电保修'?'家电保修':p.category==='报销票据'?'报销待处理夹':p.category==='旅行证件'?'证件防水袋':'资料',
    locationPrivacy:privacy,
    locationConfidence:p.lowConfidence?.confidence || .76,
    locationSource:'AI 归位建议 + 人工确认',
    nextActions:['开始处理提醒','生成交接说明'],
    searchKeywords:[p.title,p.category,p.rawType]
  };
}

function fieldValue(fields,key){ return fields.find(f=>f.k===key || f.k.includes(key))?.v || ''; }

function handleFiles(files){
  const arr = [...files];
  if(!arr.length) return;
  arr.forEach(file=>{
    const name = file.name.replace(/\.[^.]+$/,'');
    const lowQuality = /模糊|低清晰|反光|折痕/.test(name);
    const category = name.includes('车险') ? '保险续费' : name.includes('入学') ? '儿童学籍' : name.includes('证件') ? '旅行证件' : name.includes('维修') ? '维修工单' : '家电保修';
    const detectedFields = [
      f('资料日期',TODAY,'ocr',.82),
      f('金额',lowQuality ? '' : '¥199','ocr',lowQuality ? .2 : .79),
      f('家庭成员',category==='儿童学籍'?'小雨':'全家','manual',1)
    ];
    state.pending.push({
      id:nextId('P',state.pending),
      title:name,
      category,
      rawType:'导入资料识别',
      source:'import',
      preview:`导入文件 ${file.name} / 文件名初步识别`,
      detectedFields,
      confidence:lowQuality ? .48 : .78,
      ai:ai(category, ['字段由文件名初步识别'], '导入后先生成字段草案，等待用户确认', lowQuality?'存在低置信度字段':'需要确认字段', zoneName('study'), '按资料类型决定是否隐藏位置', ['是否需要补充原件？']),
      lowConfidence:lowQuality?low('文件名标记为低清晰资料',['金额或日期'],['请人工补全字段'],'等待人工补全',name,'导入后进入 AI 归档流程'):null
    });
  });
  state.currentPendingId = state.pending[state.pending.length-1].id;
  saveState();
  render();
  toast(`已加入 ${arr.length} 份收件箱资料`);
}

function addLowSample(){
  const pool = SEED_PENDING.filter(p=>p.source==='sample-low-quality');
  const existing = new Set(state.pending.filter(p=>!p._done).map(p=>p.title));
  const template = pool.find(p=>!existing.has(p.title)) || pool[0];
  const sample = clone(template);
  sample.id = nextId('P', state.pending);
  state.pending.push(sample);
  state.currentPendingId = sample.id;
  state.aiStage = 'idle';
  saveState();
  render();
  toast('已加入待核验资料');
}

function startCameraSimulation(){
  if(cameraTimer) clearTimeout(cameraTimer);
  state.cameraStage = 'running';
  state.cameraStep = 0;
  state.cameraSimulationComplete = false;
  state.lastCameraResult = null;
  state.libraryRecentScanOnly = false;
  render();
  const stageDurations = [520, 760, 660, 880, 940, 720];
  const advance = () => {
    if(state.cameraStep < CAMERA_STEPS.length - 1){
      state.cameraStep += 1;
      render();
      cameraTimer = setTimeout(advance, stageDurations[state.cameraStep] || 720);
    }else{
      state.cameraStage = 'done';
      state.cameraSimulationComplete = true;
      state.cameraStep = CAMERA_STEPS.length;
      applyCameraResults();
      saveState();
      render();
      toast('空间线索已合并到家庭记忆空间');
    }
  };
  cameraTimer = setTimeout(advance, stageDurations[0]);
}

function cameraIndexByZone(zone){
  for(var i=0;i<SECURITY_CAMERAS.length;i++){
    if(SECURITY_CAMERAS[i].zone === zone) return i;
  }
  return -1;
}

function runCameraLinkFlow(zone){
  var camIdx = cameraIndexByZone(zone);
  if(camIdx < 0){
    pendingCameraLinkZone = null;
    toast('未找到摄像头');
    return false;
  }
  if(state.currentView !== 'dashboard'){
    state.currentView = 'dashboard';
  }
  state.cameraPanelOpen = true;
  if(!webglTour || webglTour.sceneMode !== 'realHome'){
    pendingCameraLinkZone = zone;
    render();
    toast('正在进入 3D 场景并准备扫描');
    return false;
  }
  pendingCameraLinkZone = null;
  state.cameraScanIndex = camIdx;
  state.cameraScanStart = Date.now();
  if(state.cameraStage !== 'running' && !state.cameraSimulationComplete){
    startCameraSimulation();
  }else{
    render();
  }
  toast('正在扫描: ' + SECURITY_CAMERAS[camIdx].label);
  triggerCameraScan3D(camIdx);
  return true;
}

function flushPendingCameraLink(){
  if(!pendingCameraLinkZone) return false;
  if(!webglTour || webglTour.sceneMode !== 'realHome') return false;
  return runCameraLinkFlow(pendingCameraLinkZone);
}

function applyCameraResults(){
  const byId = id => state.archives.find(a=>a.id===id);
  CAMERA_RESULTS.forEach(result=>{
    const a = result.archiveId ? byId(result.archiveId) : null;
    if(!a) return;
    a.memoryZone = result.zone;
    a.memoryRoom = SPACE_ZONES.find(z=>z.id===result.zone).room;
    a.memoryContainer = result.container;
    a.locationConfidence = result.confidence;
    a.locationSource = result.source;
    if(result.privacy !== 'public') a.locationPrivacy = result.privacy;
    if(!a.operations.some(o=>o.action.includes(result.camera))){
      a.operations.push(op(nowStr(),`${result.camera}：识别到 ${result.container}，${result.suggestion}`,'AI 空间归位'));
    }
    if(a.id==='A010' && a.status==='archived'){
      a.riskLevel = 'medium';
      a.operations.push(op(nowStr(),'客厅抽屉视角置信 76%，建议人工复核维修单位置','AI 空间归位'));
    }
  });
  state.cameraApplied = true;
}

function clamp(value, min, max){
  return Math.min(max, Math.max(min, value));
}

function updateSpaceCamera(next){
  state.spaceCamera = Object.assign({zoom:1, rotate:0, tilt:0, panX:0, panY:0, mode:'interior'}, state.spaceCamera || {}, next || {});
}

function currentSpaceCameraKey(){
  return $('[data-space-viewport]')?.dataset.spaceContext === 'library' ? 'librarySpaceCamera' : 'spaceCamera';
}

function spaceCameraDefaults(key=currentSpaceCameraKey()){
  return key === 'librarySpaceCamera'
    ? {zoom:.84, rotate:0, tilt:0, panX:0, panY:0, mode:'top'}
    : {zoom:1, rotate:0, tilt:0, panX:0, panY:0, mode:'interior'};
}

function getActiveSpaceCamera(){
  const key = currentSpaceCameraKey();
  return Object.assign(spaceCameraDefaults(key), state[key] || {});
}

function updateActiveSpaceCamera(next){
  const key = currentSpaceCameraKey();
  state[key] = Object.assign(spaceCameraDefaults(key), state[key] || {}, next || {});
  return state[key];
}

function handleSpaceCommand(cmd){
  const key = currentSpaceCameraKey();
  const defaults = spaceCameraDefaults(key);
  const cam = getActiveSpaceCamera();
  const minZoom = key === 'librarySpaceCamera' ? .68 : .72;
  const maxZoom = key === 'librarySpaceCamera' ? 1.35 : 1.72;
  if(cmd === 'zoom-in') updateActiveSpaceCamera({zoom:clamp(cam.zoom + .08, minZoom, maxZoom)});
  if(cmd === 'zoom-out') updateActiveSpaceCamera({zoom:clamp(cam.zoom - .08, minZoom, maxZoom)});
  if(cmd === 'rotate-left') updateActiveSpaceCamera({rotate:cam.rotate - 12});
  if(cmd === 'rotate-right') updateActiveSpaceCamera({rotate:cam.rotate + 12});
  if(cmd === 'toggle-mode'){
    if(key === 'librarySpaceCamera') updateActiveSpaceCamera({mode:'top', tilt:0, rotate:0, panX:0, panY:0, zoom:defaults.zoom});
    else {
      const top = cam.mode !== 'top';
      updateActiveSpaceCamera({mode:top?'top':'interior', tilt:top?0:0, rotate:0, panX:0, panY:0, zoom:top?.82:1});
    }
  }
  if(cmd === 'reset') updateActiveSpaceCamera(defaults);
  render();
}

function bindSpaceViewport(){
  const viewport = $('[data-space-viewport]');
  if(!viewport) return;
  viewport.addEventListener('wheel', e=>{
    e.preventDefault();
    const key = currentSpaceCameraKey();
    const cam = getActiveSpaceCamera();
    const delta = e.deltaY < 0 ? .08 : -.08;
    updateActiveSpaceCamera({zoom:clamp((cam.zoom || 1) + delta, key === 'librarySpaceCamera' ? .68 : .72, key === 'librarySpaceCamera' ? 1.35 : 1.72)});
    render();
  }, {passive:false});
  let dragging = false;
  let start = null;
  viewport.addEventListener('pointerdown', e=>{
    if(e.target.closest('[data-space-zone], [data-room-zone]')) return;
    dragging = true;
    viewport.classList.add('dragging');
    viewport.setPointerCapture(e.pointerId);
    const cam = getActiveSpaceCamera();
    start = {x:e.clientX, y:e.clientY, panX:cam.panX || 0, panY:cam.panY || 0};
  });
  viewport.addEventListener('pointermove', e=>{
    if(!dragging || !start) return;
    const cam = updateActiveSpaceCamera({
      panX:clamp(start.panX + e.clientX - start.x, -180, 180),
      panY:clamp(start.panY + e.clientY - start.y, -120, 120)
    });
    const stage = viewport.querySelector('.floor-stage');
    if(stage){
      stage.style.transform = `translate(calc(-50% + ${cam.panX}px), calc(-50% + ${cam.panY}px)) rotateX(${cam.tilt}deg) rotateZ(${cam.rotate}deg) scale(${cam.zoom})`;
    }
  });
  const end = e=>{
    if(!dragging) return;
    dragging = false;
    viewport.classList.remove('dragging');
    try{ viewport.releasePointerCapture(e.pointerId); }catch(err){}
    saveState();
  };
  viewport.addEventListener('pointerup', end);
  viewport.addEventListener('pointercancel', end);
}

function bindTourCanvas(){
  const canvas = $('[data-tour-canvas]');
  if(!canvas) return;
  const webglRoot = $('[data-tour-webgl]');
  const webglReady = initWebGLTour(webglRoot);
  if(webglRoot) webglRoot.style.display = webglReady ? 'block' : 'none';
  canvas.style.display = webglReady ? 'none' : 'block';
  let dragging = false;
  let start = null;
  let moved = false;
  let lastDelta = {x:0, y:0, time:0};
  let momentumRAF = null;
  const target = webglReady ? webglRoot : canvas;
  target.addEventListener('pointerdown', e=>{
    dragging = true;
    moved = false;
    if(momentumRAF){ cancelAnimationFrame(momentumRAF); momentumRAF = null; }
    canvas.classList.add('dragging');
    target.setPointerCapture(e.pointerId);
    start = {x:e.clientX, y:e.clientY, lx:e.clientX, ly:e.clientY, lt:performance.now(), yaw:state.tourYaw || 0, pitch:state.tourPitch || 0};
  });
  target.addEventListener('pointermove', e=>{
    if(!dragging || !start) return;
    if(Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y) > 6) moved = true;
    var now = performance.now();
    var dt = Math.max(8, now - start.lt);
    var dx = e.clientX - start.lx;
    var dy = e.clientY - start.ly;
    lastDelta = {x:dx/dt, y:dy/dt, time:now};
    state.tourYaw = clamp(start.yaw + (e.clientX - start.x) * .085, -178, 178);
    state.tourPitch = clamp(start.pitch + (e.clientY - start.y) * .038, -26, 24);
    start.lx = e.clientX;
    start.ly = e.clientY;
    start.lt = now;
    if(webglReady){ webglTour._isDragging = true; updateWebGLCamera(); }
    else drawTourScene();
  });
  var applyMomentum = function(){
    var now = performance.now();
    var dt = Math.max(8, now - lastDelta.time);
    lastDelta.time = now;
    var decay = Math.exp(-dt / 180);
    var vyaw = lastDelta.x * 0.085 * decay;
    var vpitch = lastDelta.y * 0.038 * decay;
    if(Math.abs(vyaw) < 0.01 && Math.abs(vpitch) < 0.01){ momentumRAF = null; return; }
    state.tourYaw = clamp((state.tourYaw || 0) + vyaw * dt, -178, 178);
    state.tourPitch = clamp((state.tourPitch || 0) + vpitch * dt, -26, 24);
    lastDelta.x *= decay;
    lastDelta.y *= decay;
    if(webglReady) updateWebGLCamera();
    momentumRAF = requestAnimationFrame(applyMomentum);
  };
  const end = e=>{
    if(!dragging) return;
    dragging = false;
    if(webglTour) webglTour._isDragging = false;
    canvas.classList.remove('dragging');
    try{ target.releasePointerCapture(e.pointerId); }catch(err){}
    if(webglReady && !moved && handleCameraClickHit(e)){
      return;
    }
    if(webglReady && !moved && isLampHit(e)){
      toggleTourLight();
      return;
    }
    if(webglReady && !moved && isWindowHit(e)){
      toggleTourWindow();
      return;
    }
    if(webglReady && !moved && isRightDoorHit(e)){
      toggleRightDoor();
      return;
    }
    if(webglReady && !moved && handleMoveTargetHit(e)){
      return;
    }
    if(webglReady && !moved && handleFloorWalkHit(e)){
      return;
    }
    if(webglReady && (Math.abs(lastDelta.x) > 0.08 || Math.abs(lastDelta.y) > 0.08)){
      momentumRAF = requestAnimationFrame(applyMomentum);
    }
    saveState();
  };
  target.addEventListener('pointerup', end);
  target.addEventListener('pointercancel', end);
  target.addEventListener('wheel', e=>{
    e.preventDefault();
    var delta = e.deltaY < 0 ? .06 : -.06;
    if(e.deltaY < 0 && e.deltaY > -40) delta = .04;
    if(e.deltaY > 0 && e.deltaY < 40) delta = -.04;
    updateSpaceCamera({zoom:clamp((state.spaceCamera?.zoom || 1) + delta, .92, 1.55)});
    if(webglReady) updateWebGLCamera();
    else drawTourScene();
  }, {passive:false});
  $$('[data-tour-goto]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    moveToTourNode(el.dataset.tourGoto);
  }));
  const lightToggle = $('[data-tour-light-toggle]');
  if(lightToggle) lightToggle.addEventListener('click', e=>{
    e.stopPropagation();
    toggleTourLight();
  });
  const windowToggle = $('[data-tour-window-toggle]');
  if(windowToggle) windowToggle.addEventListener('click', e=>{
    e.stopPropagation();
    toggleTourWindow();
  });
  $$('[data-tour-door-toggle]').forEach(el=>el.addEventListener('click', e=>{
    e.stopPropagation();
    toggleRightDoor();
  }));
  if(webglReady){
    renderWebGLTourScene();
    flushPendingCameraLink();
  }
  else drawTourScene();
  if(tourAnimation) cancelAnimationFrame(tourAnimation);
  const animate = ()=>{
    if($('[data-tour-canvas]')){
      if(webglReady) renderWebGLTourScene();
      else drawTourScene();
      tourAnimation = requestAnimationFrame(animate);
    }
  };
  tourAnimation = requestAnimationFrame(animate);
}

function toggleTourLight(){
  state.lightOn = state.lightOn === false;
  saveState();
  if(webglTour) buildWebGLTourScene();
  else drawTourScene();
  render();
  toast(state.lightOn === false ? '已切换为夜间模式' : '已切换为白天模式');
}

function toggleTourWindow(){
  const nextOpen = !state.windowOpen;
  state.windowOpen = nextOpen;
  state._windowToggleAnimating = true;
  state._windowToggleDirection = nextOpen ? 'opening' : 'closing';
  saveState();
  if(webglTour) buildWebGLTourScene();
  else drawTourScene();
  state._windowToggleAnimating = false;
  state._windowToggleDirection = null;
  render();
  toast(state.windowOpen ? '窗户已打开，外部自然光进入' : '窗户已关闭');
}

function toggleRightDoor(){
  state.rightDoorOpen = !state.rightDoorOpen;
  saveState();
  if(webglTour) buildWebGLTourScene();
  render();
  toast(state.rightDoorOpen ? '右侧房门已打开' : '右侧房门已关闭');
}

function isLampHit(e){
  if(!webglTour || !webglTour.lampObjects?.length) return false;
  const rect = webglTour.root.getBoundingClientRect();
  webglTour.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  webglTour.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  webglTour.raycaster.setFromCamera(webglTour.pointer, webglTour.camera);
  return webglTour.raycaster.intersectObjects(webglTour.lampObjects, false).some(hit=>hit.object.userData?.lightFixture);
}

function isWindowHit(e){
  if(!webglTour || !webglTour.windowObjects?.length) return false;
  const rect = webglTour.root.getBoundingClientRect();
  webglTour.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  webglTour.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  webglTour.raycaster.setFromCamera(webglTour.pointer, webglTour.camera);
  return webglTour.raycaster.intersectObjects(webglTour.windowObjects, false).some(hit=>hit.object.userData?.windowToggle);
}

function isRightDoorHit(e){
  if(!webglTour || !webglTour.doorObjects?.length) return false;
  const hit = webglHit(e, webglTour.doorObjects);
  return !!hit?.object?.userData?.rightDoorToggle;
}

function handleCameraClickHit(e){
  if(!webglTour || !webglTour.cameraClickTargets?.length) return false;
  const hit = webglHit(e, webglTour.cameraClickTargets);
  if(!hit?.object?.userData?.cameraClick && hit?.object?.userData?.cameraClick !== 0) return false;
  var camId = hit.object.userData.cameraClick;
  var cam = (webglTour.securityCameras || []).find(function(c){ return c.id === camId; });
  if(!cam) return false;
  state.cameraScanIndex = camId;
  state.cameraScanStart = Date.now();
  toast('正在扫描: ' + cam.config.label);
  triggerCameraScan3D(camId);
  return true;
}

function handleCameraClickHit(e){
  if(!webglTour || !webglTour.cameraClickTargets?.length) return false;
  const hit = webglHit(e, webglTour.cameraClickTargets);
  if(!hit?.object?.userData?.cameraClick && hit?.object?.userData?.cameraClick !== 0) return false;
  var camId = hit.object.userData.cameraClick;
  var cam = (webglTour.securityCameras || []).find(function(c){ return c.id === camId; });
  if(!cam) return false;
  state.cameraPanelOpen = true;
  if(state.cameraStage !== 'running' && !state.cameraSimulationComplete){
    startCameraSimulation();
  }else{
    render();
  }
  state.cameraScanIndex = camId;
  state.cameraScanStart = Date.now();
  toast('正在扫描: ' + cam.config.label);
  triggerCameraScan3D(camId);
  return true;
}

function handleMoveTargetHit(e){
  const hit = webglHit(e, webglTour?.moveTargets || []);
  const nodeId = hit?.object?.userData?.tourNode;
  if(!nodeId || nodeId === state.tourNode) return false;
  if(!canWalkTo(nodeId)) return false;
  moveToTourNode(nodeId);
  return true;
}

function handleFloorWalkHit(e){
  const hit = webglHit(e, webglTour?.floorTargets || []);
  if(!hit?.point) return false;
  const reachableIds = TOUR_GRAPH[state.tourNode] || [];
  const nearest = TOUR_NODES
    .filter(node=>reachableIds.includes(node.id))
    .map(node=>({node, dist:Math.hypot((node.pos?.[0] || 0) - hit.point.x, (node.pos?.[2] || 0) - hit.point.z)}))
    .sort((a,b)=>a.dist-b.dist)[0];
  if(!nearest || nearest.node.id === state.tourNode || nearest.dist > 4.4 || !canWalkTo(nearest.node.id)) return false;
  moveToTourNode(nearest.node.id);
  return true;
}

function webglHit(e, objects){
  if(!webglTour || !objects.length) return null;
  const rect = webglTour.root.getBoundingClientRect();
  webglTour.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  webglTour.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  webglTour.raycaster.setFromCamera(webglTour.pointer, webglTour.camera);
  return webglTour.raycaster.intersectObjects(objects, false)[0] || null;
}

function moveToTourNode(nodeId){
  const target = TOUR_NODES.find(node=>node.id===nodeId);
  if(!target) return;
  const fromId = state.tourNode;
  const path = walkingPath(fromId, nodeId);
  if(webglTour) state._tourCameraFrom = path;
  state.tourNode = target.id;
  state.highlightedZone = target.zone;
  state.spaceFilter = null;
  state.tourYaw = 0;
  state.tourPitch = 0;
  if(webglTour) webglTour.moveStart = null;
  saveState();
  render();
}

function canWalkTo(nodeId){
  const from = state.tourNode;
  return !!(TOUR_GRAPH[from] || []).includes(nodeId);
}

function walkingPath(fromId, toId){
  const explicit = WALK_PATHS[`${fromId}>${toId}`];
  if(explicit) return explicit.map(([x,z])=>[x, 1.56, z]);
  const from = TOUR_NODES.find(node=>node.id===fromId)?.pos || [0,1.56,2.55];
  const to = TOUR_NODES.find(node=>node.id===toId)?.pos || from;
  return [[from[0],from[1],from[2]],[to[0],to[1],to[2]]];
}

function initWebGLTour(root){
  if(!root || !window.THREE) return false;
  try{
    ensureRealSpaceGLTFLoader();
    const renderer = new THREE.WebGLRenderer({antialias:true, alpha:false, powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xf4efe6, 1);
    if(THREE.ACESFilmicToneMapping) renderer.toneMapping = THREE.ACESFilmicToneMapping;
    if(renderer.toneMappingExposure !== undefined) renderer.toneMappingExposure = 1.0;
    if(renderer.shadowMap){
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap || THREE.PCFShadowMap;
    }
    if(THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    if(THREE.ACESFilmicToneMapping) renderer.toneMapping = THREE.ACESFilmicToneMapping;
    root.innerHTML = '';
    root.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(64, 1, .1, 80);
    webglTour = {root, renderer, scene, camera, nodeId:null, objects:[], hotspots:[], floorTargets:[], moveTargets:[], raycaster:new THREE.Raycaster(), pointer:new THREE.Vector2(), lampObjects:[], windowObjects:[], doorObjects:[], moveStart:null};
    buildWebGLTourScene();
    return true;
  }catch(err){
    console.warn('WebGL tour fallback to canvas', err);
    webglTour = null;
    if(root) root.innerHTML = '';
    return false;
  }
}

function ensureRealSpaceGLTFLoader(){
  if(window.realSpaceGLTFLoader?.load) return window.realSpaceGLTFLoader;
  if(window.THREE?.GLTFLoader){
    window.realSpaceGLTFLoader = new window.THREE.GLTFLoader();
    return window.realSpaceGLTFLoader;
  }
  if(!window.__realSpaceLoaderLoading && !window.__realSpaceLoaderFailed){
    window.__realSpaceLoaderLoading = true;
    const script = document.createElement('script');
    script.src = REAL_SPACE_REQUIRED_LOADER;
    script.async = true;
    script.onload = ()=>{
      window.__realSpaceLoaderLoading = false;
      if(window.THREE?.GLTFLoader){
        window.realSpaceGLTFLoader = new window.THREE.GLTFLoader();
        if(webglTour) {
          buildWebGLTourScene();
          renderWebGLTourScene();
        }
      }
    };
    script.onerror = ()=>{
      window.__realSpaceLoaderLoading = false;
      window.__realSpaceLoaderFailed = true;
      console.info(`Real-space GLB loader file was not found at ${REAL_SPACE_REQUIRED_LOADER}; procedural fallback remains active.`);
    };
    document.head.appendChild(script);
  }
  if(!window.__realSpaceLoaderWarned){
    window.__realSpaceLoaderWarned = true;
    console.info(`Real-space GLB loading is pending. Add ${REAL_SPACE_REQUIRED_LOADER} to enable model assets.`);
  }
  return null;
}

function buildWebGLTourScene(){
  if(!webglTour) return;
  const node = currentTourNode();
  const lightOn = state.lightOn !== false;
  webglTour.nodeId = node.id;
  webglTour.sceneMode = 'focused';
  webglTour.realHomeLights = null;
  const scene = webglTour.scene;
  while(scene.children.length) scene.remove(scene.children[0]);
  webglTour.lampObjects = [];
  webglTour.windowObjects = [];
  webglTour.doorObjects = [];
  webglTour.floorTargets = [];
  webglTour.moveTargets = [];
  webglTour.cameraClickTargets = [];
  const realHomeNode = isRealHomeTourNode(node);
  scene.background = new THREE.Color(lightOn ? 0xf7f1e8 : 0x111822);
  scene.fog = new THREE.Fog(lightOn ? 0xf7f1e8 : 0x111822, lightOn ? 30 : 14, lightOn ? 70 : 34);
  if(webglTour.renderer.toneMappingExposure !== undefined){
    webglTour.renderer.toneMappingExposure = realHomeNode ? (lightOn ? .7 : .34) : (lightOn ? .78 : .5);
    webglTour.baseExposure = webglTour.renderer.toneMappingExposure;
  }

  if(realHomeNode){
    webglTour.sceneMode = 'realHome';
    addRealHomeRoomModel3D(scene, node);
    reportRealSpaceSceneIssues(scene, node);
  }else{
    const ambient = new THREE.HemisphereLight(lightOn ? 0xf2e6d4 : 0xa8bac2, lightOn ? 0x8d7660 : 0x182022, lightOn ? .72 : .34);
    scene.add(ambient);
    const mainLight = new THREE.PointLight(0xf0bd84, lightOn ? .42 : .05, 13);
    mainLight.position.set(0, 3.18, .35);
    mainLight.castShadow = true;
    if(mainLight.shadow){
      mainLight.shadow.mapSize.width = 1024;
      mainLight.shadow.mapSize.height = 1024;
      mainLight.shadow.bias = -.0008;
    }
    scene.add(mainLight);
    const windowFill = new THREE.DirectionalLight(0xf0d0a4, lightOn ? .78 : .28);
    windowFill.position.set(-3.6, 5.4, -7.8);
    windowFill.castShadow = true;
    if(windowFill.shadow){
      windowFill.shadow.mapSize.width = 1024;
      windowFill.shadow.mapSize.height = 1024;
      windowFill.shadow.camera.near = 1;
      windowFill.shadow.camera.far = 24;
      windowFill.shadow.camera.left = -8;
      windowFill.shadow.camera.right = 8;
      windowFill.shadow.camera.top = 8;
      windowFill.shadow.camera.bottom = -8;
    }
    scene.add(windowFill);
    const bounce = new THREE.DirectionalLight(0xd6e7d2, lightOn ? .28 : .1);
    bounce.position.set(3.4, 1.3, 3.8);
    scene.add(bounce);
    addFocusedRoomModel3D(scene, node);
  }
  applySceneDebugVisibility(scene);
  updateWebGLCamera();
  exposeRealSpaceDebug(scene, node);
  if(webglTour.sceneMode === 'realHome') flushPendingCameraLink();
}

function applySceneDebugVisibility(scene){
  const params = new URLSearchParams(window.location.search || '');
  const pattern = params.get('hideScene');
  if(!pattern) return;
  let rx = null;
  try{ rx = new RegExp(pattern); }catch(err){ return; }
  scene.traverse(obj=>{
    if(rx.test(obj.name || '') || rx.test(obj.parent?.name || '')) obj.visible = false;
  });
}

function exposeRealSpaceDebug(scene,node){
  if(!/[?&]debugScene=1\b/.test(window.location.search || '')) return;
  const rows = [];
  scene.traverse(obj=>{
    if(!obj.isMesh) return;
    const box = new THREE.Box3().setFromObject(obj);
    if(!Number.isFinite(box.min.x) || !Number.isFinite(box.max.x)) return;
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const color = obj.material?.color ? `#${obj.material.color.getHexString()}` : '';
    const opacity = obj.material?.opacity ?? 1;
    const area = Math.max(size.x,0) * Math.max(size.y,0) + Math.max(size.x,0) * Math.max(size.z,0) + Math.max(size.y,0) * Math.max(size.z,0);
    if(area < .35 && Math.max(size.x,size.y,size.z) < 1.2) return;
    rows.push({
      name: obj.name || obj.parent?.name || '(unnamed)',
      parent: obj.parent?.name || '',
      color,
      opacity:Number(opacity.toFixed?.(3) ?? opacity),
      center:[center.x,center.y,center.z].map(v=>Number(v.toFixed(3))),
      size:[size.x,size.y,size.z].map(v=>Number(v.toFixed(3))),
      area:Number(area.toFixed(3)),
      visible:obj.visible,
      material:obj.material?.type || ''
    });
  });
  rows.sort((a,b)=>b.area-a.area);
  let pre = document.getElementById('__real_space_debug__');
  if(!pre){
    pre = document.createElement('pre');
    pre.id = '__real_space_debug__';
    pre.style.cssText = 'position:fixed;left:250px;top:76px;z-index:9999;max-width:760px;max-height:720px;overflow:auto;background:rgba(0,0,0,.76);color:#fff;font:11px/1.35 monospace;padding:8px;white-space:pre-wrap;pointer-events:none';
    document.body.appendChild(pre);
  }
  pre.textContent = JSON.stringify({node:node.id, mode:webglTour?.sceneMode, rows:rows.slice(0,24)}, null, 2);
}

function reportRealSpaceSceneIssues(scene,node){
  const ctx = scene.userData.realSpace;
  if(!ctx || ctx._reported) return;
  finalizeRealSpaceContext(ctx);
  ctx._reported = true;
  if(ctx.issues?.length && window.console){
    console.info(`[real-space:${node.id}]`, {
      loaderReady:ctx.loaderReady,
      placements:ctx.placements.length,
      issues:ctx.issues
    });
  }
}

function renderWebGLTourScene(){
  if(!webglTour) return;
  const rect = webglTour.root.getBoundingClientRect();
  const w = Math.max(640, Math.floor(rect.width));
  const h = Math.max(420, Math.floor(rect.height));
  if(webglTour.renderer.domElement.width !== Math.floor(w * webglTour.renderer.getPixelRatio()) || webglTour.renderer.domElement.height !== Math.floor(h * webglTour.renderer.getPixelRatio())){
    webglTour.renderer.setSize(w, h, false);
    webglTour.camera.aspect = w / h;
    webglTour.camera.updateProjectionMatrix();
  }
  if(webglTour.nodeId !== currentTourNode().id) buildWebGLTourScene();
  updateWebGLCamera();
  animateOpenWindowEffects3D();
  updateCameraScan3D();
  webglTour.renderer.render(webglTour.scene, webglTour.camera);
  syncCameraHitLayer();
}

function syncCameraHitLayer(){
  if(!webglTour?.root) return;
  const layer = webglTour.root.querySelector('[data-camera-hit-layer]');
  if(!layer) return;
  const cams = webglTour.securityCameras || [];
  const realHome = webglTour.sceneMode === 'realHome' && isRealHomeTourNode(currentTourNode());
  if(!realHome || !cams.length){
    layer.innerHTML = '';
    return;
  }
  const current = new Map(Array.from(layer.querySelectorAll('[data-camera-hit-id]')).map(el=>[el.dataset.cameraHitId, el]));
  cams.forEach(cam=>{
    const source = cam.emitPoint || cam.panPivot;
    if(!source) return;
    const world = new THREE.Vector3();
    source.getWorldPosition(world);
    const screen = projectWorldToTourScreen(world);
    if(!screen) return;
    let btn = current.get(String(cam.id));
    if(!btn){
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'camera-hit-chip';
      btn.dataset.cameraHitId = String(cam.id);
      btn.title = `扫描 ${cam.config.label}`;
      btn.setAttribute('aria-label', `扫描 ${cam.config.label}`);
      btn.addEventListener('click', e=>{
        e.stopPropagation();
        runCameraLinkFlow(cam.config.zone);
      });
      layer.appendChild(btn);
    }
    btn.style.left = `${screen.x}%`;
    btn.style.top = `${screen.y}%`;
    btn.classList.toggle('active', state.cameraScanIndex === cam.id && (Date.now() - state.cameraScanStart) < 2600);
    current.delete(String(cam.id));
  });
  current.forEach(el=>el.remove());
}

function animateOpenWindowEffects3D(){
  if(!webglTour?.scene) return;
  const t = performance.now() * .001;
  webglTour.scene.traverse(obj=>{
    if(obj.userData?.windowSlide){
      const slide = obj.userData;
      const elapsed = Math.max(0, t - (slide.start || t));
      const p = smoothEase(clamp(elapsed / (slide.duration || .7),0,1));
      obj.position.x = slide.fromX + (slide.toX - slide.fromX) * p;
      return;
    }
    if(obj.userData?.curtainBreathe){
      const phase = obj.userData.phase || 0;
      obj.position.z = obj.userData.baseZ + Math.sin(t*1.15 + phase) * .018;
      return;
    }
    if(obj.userData?.waterRipple){
      var rp = obj.userData.phase || 0;
      var cycle = (t * 0.6 + rp) % 2.5;
      var prog = cycle / 2.5;
      var rr = 0.3 + prog * 0.9;
      obj.scale.set(rr * (obj.userData.maxR / 0.3), rr * (obj.userData.maxR / 0.3) * 0.55, 1);
      obj.material.opacity = (1 - prog) * 0.5;
      return;
    }
    if(obj.userData?.waterRisk){
      var wrPhase = obj.userData.phase || 0;
      var wrPulse = Math.sin(t * 2.5 + wrPhase);
      var wrBaseOp = obj.userData.baseOpacity || 0.3;
      if(obj.material && obj.material.opacity !== undefined){
        obj.material.opacity = Math.max(0.05, wrBaseOp + wrPulse * 0.15);
      }
      if(obj.material && obj.material.emissiveIntensity !== undefined){
        obj.material.emissiveIntensity = 0.3 + wrPulse * 0.3;
      }
      var wrBS = obj.userData.baseScale;
      if(typeof wrBS === 'number' && wrBS > 0){
        obj.scale.setScalar(wrBS + wrPulse * 0.04);
      }
      return;
    }
    if(obj.userData?.skyCloud){
      const phase = obj.userData.phase || 0;
      const drift = obj.userData.drift || .045;
      obj.position.x = obj.userData.baseX + Math.sin(t*.26 + phase) * drift + ((t*.018 + phase*.021) % .12);
      obj.position.y = obj.userData.baseY + Math.sin(t*.34 + phase) * .012;
      const opacity = Math.max(.04, obj.userData.baseOpacity + Math.sin(t*.42 + phase) * .035);
      if(obj.material) obj.material.opacity = opacity;
      else if(obj.traverse) obj.traverse(child=>{ if(child.material) child.material.opacity = opacity; });
      return;
    }
    if(obj.userData?.balconyGlow){
      const phase = obj.userData.phase || 0;
      const baseOpacity = obj.userData.baseOpacity || .1;
      if(obj.material) obj.material.opacity = Math.max(.025, baseOpacity + Math.sin(t*.55 + phase) * .025);
      return;
    }
    if(obj.userData?.sunPulse){
      const phase = obj.userData.phase || 0;
      const pulse = Math.sin(t*1.65 + phase);
      const scale = obj.userData.baseScale || 1;
      obj.scale.setScalar(scale + pulse * .085);
      if(obj.material) obj.material.opacity = Math.max(.46, (obj.userData.baseOpacity || 1) + pulse * .14);
      return;
    }
    if(obj.userData?.sunBurstGroup){
      obj.rotation.z = (obj.userData.baseRotation || 0) + Math.sin(t*.9 + (obj.userData.phase || 0)) * .11;
      return;
    }
    if(obj.userData?.sunRayBurst){
      const phase = obj.userData.phase || 0;
      const pulse = (Math.sin(t*3.15 + phase) + 1) / 2;
      const angle = obj.userData.angle || 0;
      const radius = obj.userData.baseRadius || .38;
      const outward = radius + pulse * (obj.userData.travel || .045);
      obj.position.set(Math.sin(angle) * outward, Math.cos(angle) * outward, obj.userData.baseZ || 0);
      obj.scale.set(1 + pulse*.06, .48 + pulse*.72, 1);
      if(obj.material) obj.material.opacity = Math.max(.1, (obj.userData.baseOpacity || .42) * (.58 + pulse*.74));
      return;
    }
    if(obj.userData?.digitalPulse){
      var dp = (t * 0.4) % 1;
      var dr = 0.3 + dp * 5;
      obj.scale.setScalar(dr);
      obj.material.opacity = (1 - dp) * 0.06;
      return;
    }
    if(obj.userData?.balconyBird){
      const phase = obj.userData.phase || 0;
      const speed = obj.userData.speed || .08;
      const progress = ((t * speed + phase) % 1);
      obj.position.x = obj.userData.baseX + (progress - .5) * (obj.userData.drift || 1.2);
      obj.position.y = obj.userData.baseY + Math.sin(t*1.25 + phase*6.28) * .022;
      const flap = .18 + Math.sin(t*2.8 + phase*6.28) * .07;
      obj.children.forEach(part=>{
        if(part.userData?.wingSide === 'left') part.rotation.z = flap;
        else if(part.userData?.wingSide === 'right') part.rotation.z = Math.PI - flap;
      });
      return;
    }
    if(!obj.userData?.breeze) return;
    const phase = obj.userData.phase || 0;
    obj.position.x = obj.userData.baseX + Math.sin(t*1.6 + phase) * (obj.userData.drift || .06);
    obj.position.y = obj.userData.baseY + Math.sin(t*1.25 + phase) * .018;
    obj.position.z = obj.userData.baseZ - ((t*.16 + phase*.11) % .22);
    obj.material.opacity = .08 + (Math.sin(t*2.1 + phase) + 1) * .04;
  });
}

function updateWebGLCamera(){
  if(!webglTour) return;
  const node = currentTourNode();
  if(isRealHomeTourNode(node)){
    updateRealHomeWebGLCamera(node);
    return;
  }
  const zoom = clamp(state.spaceCamera?.zoom || 1, .92, 1.55);
  const focusedYaw = {
    'living-node':0,
    'entry-node':8,
    'study-node':8,
    'bedroom-node':-8,
    'balcony-node':0,
    'bath-node':0
  }[node.id];
  const yaw = ((state.tourYaw || 0) + (focusedYaw ?? node.lookYaw ?? node.yaw ?? 0)) * Math.PI / 180;
  const pitch = clamp(state.tourPitch || 0, -24, 22) * Math.PI / 180;
  const focusedPos = {
    'living-node':[0,1.54,3.35],
    'entry-node':[0,1.54,3.1],
    'study-node':[0,1.54,3.35],
    'bedroom-node':[0,1.54,3.35],
    'balcony-node':[0,1.54,3.2],
    'bath-node':[0,1.54,3.1]
  }[node.id];
  const targetPos = focusedPos || node.pos || [0,1.58,2.6];
  const current = webglTour.camera.position;
  if(!webglTour.moveStart || webglTour.moveStart.nodeId !== node.id){
    const route = normalizeWalkRoute(state._tourCameraFrom, current, targetPos);
    state._tourCameraFrom = null;
    webglTour.moveStart = {nodeId:node.id, time:performance.now(), route, duration:Math.max(420, route.length * 185)};
  }
  const t = Math.min(1, (performance.now() - webglTour.moveStart.time) / webglTour.moveStart.duration);
  const eased = smoothEase(t);
  const routePos = pointOnRoute(webglTour.moveStart.route, eased);
  current.copy(routePos);
  const radius = 5.25 / zoom;
  const routeLook = routeForward(webglTour.moveStart.route, eased);
  const routeYaw = routeLook ? Math.atan2(routeLook.x, -routeLook.z) : yaw;
  const blendedYaw = t < .72 ? routeYaw * (1 - t) + yaw * t : yaw;
  const look = new THREE.Vector3(
    current.x + Math.sin(blendedYaw) * radius,
    1.34 + Math.sin(pitch) * 2.1,
    current.z - Math.cos(blendedYaw) * radius
  );
  const now = performance.now();
  const lookSmooth = webglTour.focusLookSmooth || {};
  if(!lookSmooth.look || lookSmooth.nodeId !== node.id){
    webglTour.focusLookSmooth = {nodeId:node.id, look:look.clone(), lastTime:now};
  }else{
    const dt = Math.min(64, Math.max(12, now - (lookSmooth.lastTime || now)));
    var ltc = webglTour._isDragging ? 45 : 80;
    const factor = 1 - Math.exp(-dt / ltc);
    lookSmooth.look.lerp(look, factor);
    lookSmooth.nodeId = node.id;
    lookSmooth.lastTime = now;
  }
  webglTour.camera.lookAt(webglTour.focusLookSmooth.look);
}

function updateRealHomeWebGLCamera(node){
  const cfg = realHome3DConfig(node);
  const zoom = clamp(state.spaceCamera?.zoom || 1, .92, 1.35);
  const yawLimit = cfg.yawLimit || 120;
  const pitchLimit = cfg.pitchLimit || 20;
  const yaw = clamp(state.tourYaw || 0, -yawLimit, yawLimit) * Math.PI / 180;
  const pitch = clamp(state.tourPitch || 0, -pitchLimit, pitchLimit) * Math.PI / 180;
  const basePos = new THREE.Vector3(cfg.camera[0], cfg.camera[1], cfg.camera[2]);
  const baseLook = new THREE.Vector3(cfg.look[0], cfg.look[1], cfg.look[2]);
  const dir = baseLook.clone().sub(basePos).normalize();
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const rotated = new THREE.Vector3(
    dir.x * cos - dir.z * sin,
    dir.y + Math.sin(pitch) * .55,
    dir.x * sin + dir.z * cos
  ).normalize();
  const focusDistance = Math.min(6.2, Math.max(2.8, basePos.distanceTo(baseLook))) / zoom;
  let targetFov = cfg.fov || 56;
  webglTour.camera.fov = targetFov;
  webglTour.camera.near = .03;
  webglTour.camera.far = 35;
  const targetLook = basePos.clone().add(rotated.multiplyScalar(focusDistance));
  const scanFx = cameraScanCinematicState();
  const scanPOV = cameraScanPOV(scanFx);
  if(scanFx.active){
    const t = performance.now() * .001;
    const pushDir = targetLook.clone().sub(basePos).normalize();
    const side = new THREE.Vector3(pushDir.z, 0, -pushDir.x).normalize();
    const swayX = Math.sin(t * 5.8 + scanFx.elapsed * 1.4) * scanFx.sway;
    const swayY = Math.cos(t * 7.4 + .6) * scanFx.shake * .9 + Math.sin(t * 2.8) * scanFx.sway * .3;
    const swayZ = Math.cos(t * 4.9 + 1.1) * scanFx.shake * .34;
    const handheld = side.multiplyScalar(swayX).add(new THREE.Vector3(0, swayY, swayZ));
    const push = pushDir.clone().multiplyScalar(scanFx.push);
    basePos.add(push).add(handheld);
    targetLook.add(pushDir.clone().multiplyScalar(scanFx.push * 1.6)).add(handheld.clone().multiplyScalar(.55));
    targetFov = Math.max(47, targetFov - scanFx.fovNarrow);
  }
  if(scanPOV.active){
    const emitWorld = new THREE.Vector3();
    scanPOV.cam.emitPoint.getWorldPosition(emitWorld);
    const lockTarget = scanPOV.cam.spotlight?.target?.position?.clone?.() || new THREE.Vector3(scanPOV.cam.baseTargetX, 0.55, scanPOV.cam.baseTargetZ);
    const camDir = lockTarget.clone().sub(emitWorld).normalize();
    const povPos = emitWorld.clone().add(camDir.clone().multiplyScalar(.1)).add(new THREE.Vector3(0, 0.01, 0));
    const povLook = emitWorld.clone().add(camDir.clone().multiplyScalar(4.4));
    const povBlend = clamp(scanPOV.blend * (1 - scanPOV.release * .55), 0, .96);
    basePos.lerp(povPos, povBlend);
    targetLook.lerp(povLook, povBlend);
    targetFov = targetFov + (34 - targetFov) * povBlend;
  }
  const smooth = webglTour.realCameraSmooth || {};
  const now = performance.now();
  const firstFrame = !smooth.pos || !smooth.look;
  if(firstFrame){
    webglTour.realCameraSmooth = {nodeId:node.id, pos:basePos.clone(), look:targetLook.clone(), fov:targetFov, lastTime:now};
  }else{
    const nodeChanged = smooth.nodeId !== node.id;
    const dt = Math.min(80, Math.max(12, now - (smooth.lastTime || now)));
    var tc = nodeChanged ? 300 : (webglTour._isDragging ? 55 : (scanFx.active ? 78 : 110));
    var factor = 1 - Math.exp(-dt / tc);
    smooth.pos.lerp(basePos, factor);
    smooth.look.lerp(targetLook, factor);
    smooth.fov = (smooth.fov ?? targetFov) + (targetFov - (smooth.fov ?? targetFov)) * factor;
    smooth.nodeId = node.id;
    smooth.lastTime = now;
  }
  webglTour.camera.position.copy(webglTour.realCameraSmooth.pos);
  webglTour.camera.fov = webglTour.realCameraSmooth.fov || targetFov;
  webglTour.camera.lookAt(webglTour.realCameraSmooth.look);
  webglTour.camera.updateProjectionMatrix();
}

function normalizeWalkRoute(route, current, targetPos){
  if(Array.isArray(route) && Array.isArray(route[0])){
    return route.map(p=>new THREE.Vector3(p[0], p[1] ?? 1.56, p[2]));
  }
  return [current.clone(), new THREE.Vector3(targetPos[0], targetPos[1], targetPos[2])];
}

function smoothEase(t){
  return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
}

function cameraScanCinematicState(){
  const inactive = {
    active:false,
    complete:false,
    duration:7.6,
    elapsed:0,
    progress:0,
    pursuit:0,
    lock:0,
    release:0,
    pulse:0,
    entryFlash:0,
    lockFlash:0,
    flash:0,
    dim:0,
    vignette:0,
    beamY:12,
    beamOpacity:0,
    beamHeight:0,
    noise:0,
    push:0,
    sway:0,
    shake:0,
    fovNarrow:0,
    exposure:1,
    sweepAngle:0,
    targetSpread:0,
    lineScale:1,
    spotlightBoost:0,
    coneBoost:0,
    reticle:0
  };
  if(state.cameraScanIndex < 0) return inactive;
  const duration = inactive.duration;
  const elapsed = (Date.now() - state.cameraScanStart) / 1000;
  if(elapsed > duration) return Object.assign({}, inactive, { complete:true, elapsed, duration });
  const progress = clamp(elapsed / duration, 0, 1);
  const pursuit = smoothEase(clamp((progress - .06) / .56, 0, 1));
  const lock = smoothEase(clamp((progress - .66) / .18, 0, 1));
  const release = smoothEase(clamp((progress - .965) / .035, 0, 1));
  const sweepProgress = progress < .74 ? smoothEase(progress / .74) : 1;
  const entryFlash = progress < .06 ? 1 - progress / .06 : 0;
  const rawLockFlash = Math.max(0, 1 - Math.abs(progress - .82) / .08);
  const pulse = (Math.sin(elapsed * 8.6) + 1) / 2;
  const dim = .12 + pursuit * .2 + lock * .16 - release * .08;
  const lockFlash = Math.max(rawLockFlash, lock * .24 * (1 - release * .5));
  const beamTravel = progress < .72 ? smoothEase(progress / .72) : 1 - lock * .16;
  return {
    active:true,
    complete:false,
    duration,
    elapsed,
    progress,
    pursuit,
    lock,
    release,
    pulse,
    entryFlash,
    lockFlash,
    flash:Math.max(entryFlash, lockFlash),
    dim,
    vignette:.24 + pursuit * .18 + lock * .14,
    beamY:8 + beamTravel * 58,
    beamOpacity:.24 + pursuit * .22 + lock * .2,
    beamHeight:24 + pursuit * 14 + lock * 12,
    noise:.16 + pursuit * .18 + lock * .16,
    push:.03 + pursuit * .12 + lock * .08 - release * .04,
    sway:(.016 + pursuit * .014 + lock * .007) * (1 - release * .48),
    shake:(.007 + pursuit * .012 + lock * .006) * (1 - release * .32),
    fovNarrow:1 + pursuit * 2 + lock * 2.9 - release * 1,
    exposure:1 - dim * .26 + entryFlash * .12 + lockFlash * .22,
    sweepAngle:Math.sin((sweepProgress * Math.PI * 2.8) + Math.sin(elapsed * 1.3) * .18) * .84 * (1 - lock * .58),
    targetSpread:2.05 - pursuit * .5 - lock * 1.08 + release * .26,
    lineScale:progress < .84 ? 1.18 - lock * .16 : .68 + release * .1,
    spotlightBoost:.4 + pursuit * .48 + lock * .74,
    coneBoost:.06 + pursuit * .08 + lock * .1,
    reticle:.18 + pursuit * .22 + lock * .38
  };
}

function updateTourCinematicOverlay(scanFx, targetScreen){
  if(!webglTour?.root) return;
  const host = webglTour.root.parentElement;
  const overlay = host?.querySelector('[data-tour-cinematic]');
  if(!overlay) return;
  if(!scanFx?.active){
    overlay.classList.remove('active', 'locking');
    overlay.style.removeProperty('--scan-dim');
    overlay.style.removeProperty('--scan-vignette');
    overlay.style.removeProperty('--scan-flash');
    overlay.style.removeProperty('--scan-lock-flash');
    overlay.style.removeProperty('--scan-beam-y');
    overlay.style.removeProperty('--scan-beam-opacity');
    overlay.style.removeProperty('--scan-beam-height');
    overlay.style.removeProperty('--scan-noise');
    overlay.style.removeProperty('--scan-reticle');
    overlay.style.removeProperty('--scan-target-x');
    overlay.style.removeProperty('--scan-target-y');
    return;
  }
  overlay.classList.add('active');
  overlay.classList.toggle('locking', scanFx.lock > .2 || scanFx.lockFlash > .12);
  overlay.style.setProperty('--scan-dim', scanFx.dim.toFixed(3));
  overlay.style.setProperty('--scan-vignette', scanFx.vignette.toFixed(3));
  overlay.style.setProperty('--scan-flash', scanFx.entryFlash.toFixed(3));
  overlay.style.setProperty('--scan-lock-flash', scanFx.lockFlash.toFixed(3));
  overlay.style.setProperty('--scan-beam-y', `${scanFx.beamY.toFixed(1)}%`);
  overlay.style.setProperty('--scan-beam-opacity', scanFx.beamOpacity.toFixed(3));
  overlay.style.setProperty('--scan-beam-height', `${scanFx.beamHeight.toFixed(1)}%`);
  overlay.style.setProperty('--scan-noise', scanFx.noise.toFixed(3));
  overlay.style.setProperty('--scan-reticle', scanFx.reticle.toFixed(3));
  overlay.style.setProperty('--scan-target-x', `${(targetScreen?.x ?? 50).toFixed(1)}%`);
  overlay.style.setProperty('--scan-target-y', `${(targetScreen?.y ?? 50).toFixed(1)}%`);
  const label = overlay.querySelector('[data-scan-label]');
  const meta = overlay.querySelector('[data-scan-meta]');
  if(label) label.textContent = scanFx.lock > .78 ? 'TARGET LOCK' : 'AI SCANNING';
  if(meta) meta.textContent = `${scanFx.lock > .64 ? 'FOCUS' : 'SWEEP'} ${String(Math.round(scanFx.progress * 100)).padStart(2, '0')}%`;
}

function applyCameraScanSceneFX(scanFx){
  if(webglTour?.renderer?.toneMappingExposure !== undefined){
    const baseExposure = webglTour.baseExposure ?? webglTour.renderer.toneMappingExposure ?? 1;
    webglTour.renderer.toneMappingExposure = scanFx?.active ? baseExposure * scanFx.exposure : baseExposure;
  }
  const lights = webglTour?.realHomeLights;
  if(!lights) return;
  ['hemi','sun','fill','windowBounce','lamp','moonFill'].forEach(function(key){
    const light = lights[key];
    if(!light) return;
    const base = light.userData?.baseIntensity ?? light.intensity ?? 0;
    if(!scanFx?.active){
      light.intensity = base;
      return;
    }
    let multiplier = 1;
    if(key === 'hemi') multiplier = .9 - scanFx.dim * .42;
    else if(key === 'sun') multiplier = .92 - scanFx.dim * .14 + scanFx.lock * .08;
    else if(key === 'fill') multiplier = .78 - scanFx.dim * .24;
    else if(key === 'windowBounce') multiplier = .84 - scanFx.dim * .08 + scanFx.lock * .14;
    else if(key === 'lamp') multiplier = .72 - scanFx.dim * .18 + scanFx.pulse * .08;
    else if(key === 'moonFill') multiplier = .74 - scanFx.dim * .08 + scanFx.lock * .12;
    light.intensity = Math.max(0, base * multiplier);
  });
}

function wrapAngle(angle){
  while(angle > Math.PI) angle -= Math.PI * 2;
  while(angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function easeAngle(current, target, factor){
  return current + wrapAngle(target - current) * factor;
}

function updateSecurityCameraPose(c, targetPoint, active){
  if(!c?.panPivot || !c?.headGroup || !c?.emitPoint) return;
  const emitWorld = new THREE.Vector3();
  c.emitPoint.getWorldPosition(emitWorld);
  const desiredYaw = targetPoint ? Math.atan2(targetPoint.x - emitWorld.x, targetPoint.z - emitWorld.z) : (c.restYaw ?? 0);
  const horiz = targetPoint ? Math.max(.001, Math.hypot(targetPoint.x - emitWorld.x, targetPoint.z - emitWorld.z)) : 1;
  const desiredPitch = targetPoint ? clamp(-Math.atan2(emitWorld.y - targetPoint.y, horiz), -.68, .18) : (c.restPitch ?? -.18);
  const factor = active ? .18 : .12;
  c.panYaw = c.panYaw == null ? desiredYaw : easeAngle(c.panYaw, desiredYaw, factor);
  c.headPitch = c.headPitch == null ? desiredPitch : c.headPitch + (desiredPitch - c.headPitch) * factor;
  c.panPivot.rotation.y = c.panYaw;
  c.headGroup.rotation.x = c.headPitch;
}

function projectWorldToTourScreen(point){
  if(!webglTour?.camera || !point?.clone) return null;
  const projected = point.clone().project(webglTour.camera);
  return {
    x: clamp((projected.x + 1) * 50, 22, 78),
    y: clamp((1 - projected.y) * 50, 18, 78)
  };
}

function cameraScanPOV(scanFx){
  const inactive = { active:false, blend:0, release:0, flash:0, cam:null };
  if(!scanFx?.active || !webglTour?.securityCameras?.length) return inactive;
  const cam = webglTour.securityCameras.find(function(item){ return item.id === state.cameraScanIndex; });
  if(!cam?.emitPoint) return inactive;
  return {
    active:true,
    blend:Math.max(scanFx.pursuit * .9, scanFx.lock),
    release:scanFx.release,
    flash:scanFx.flash,
    cam
  };
}

function pointOnRoute(route, t){
  if(!route.length) return new THREE.Vector3();
  if(route.length === 1) return route[0].clone();
  const scaled = t * (route.length - 1);
  const i = Math.min(route.length - 2, Math.floor(scaled));
  const local = scaled - i;
  return route[i].clone().lerp(route[i+1], smoothEase(local));
}

function routeForward(route, t){
  if(!route || route.length < 2) return null;
  const scaled = Math.min(route.length - 1.001, Math.max(0, t * (route.length - 1)));
  const i = Math.min(route.length - 2, Math.floor(scaled));
  return route[i+1].clone().sub(route[i]).normalize();
}

/* === Phase 1: Procedural Texture System (CanvasTexture, zero external deps) === */
const _texCache = {};

function _hexToCss(hex){
  return '#' + (hex & 0xffffff).toString(16).padStart(6,'0');
}

function _adjustCss(css, amount){
  const hex = css.replace('#','');
  const r = Math.max(0,Math.min(255,parseInt(hex.substring(0,2),16)+amount));
  const g = Math.max(0,Math.min(255,parseInt(hex.substring(2,4),16)+amount));
  const b = Math.max(0,Math.min(255,parseInt(hex.substring(4,6),16)+amount));
  return 'rgb('+Math.round(r)+','+Math.round(g)+','+Math.round(b)+')';
}

function _texRepeat(texture, rx, ry){
  const t = texture.clone();
  t.needsUpdate = true;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(Math.max(1,rx), Math.max(1,ry));
  return t;
}

function createWoodGrainTexture(baseColor, opts){
  opts = opts || {};
  var key = 'wood_'+baseColor+'_'+(opts.grainStrength||.5);
  if(_texCache[key]) return _texCache[key];
  var size = 512, canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  var ctx = canvas.getContext('2d');
  var baseCss = _hexToCss(baseColor);
  ctx.fillStyle = baseCss;
  ctx.fillRect(0,0,size,size);
  var grainCount = opts.grainCount || 35;
  var strength = opts.grainStrength || .5;
  for(var i=0;i<grainCount;i++){
    var y = (i/grainCount)*size + (Math.random()-.5)*6;
    var alpha = .04 + Math.random()*strength*.12;
    ctx.strokeStyle = Math.random()>.5 ? 'rgba(50,32,16,'+alpha+')' : 'rgba(255,240,218,'+(alpha*.5)+')';
    ctx.lineWidth = .4 + Math.random()*1.2;
    ctx.beginPath();
    ctx.moveTo(0,y);
    for(var x=0;x<=size;x+=8){
      ctx.lineTo(x, y + Math.sin(x*.018+i*.7)*2.5);
    }
    ctx.stroke();
  }
  for(var k=0;k<2;k++){
    var cx = Math.random()*size, cy = Math.random()*size;
    var rings = 3+Math.floor(Math.random()*3);
    for(var r=1;r<=rings;r++){
      ctx.strokeStyle = 'rgba(70,45,22,'+(.06+(1-r/rings)*.1)+')';
      ctx.lineWidth = .7;
      ctx.beginPath();
      ctx.arc(cx,cy,r*7+Math.random()*4,0,Math.PI*2);
      ctx.stroke();
    }
  }
  var imgData = ctx.getImageData(0,0,size,size);
  var d = imgData.data;
  for(var p=0;p<d.length;p+=4){
    var n = (Math.random()-.5)*10*strength;
    d[p]=Math.max(0,Math.min(255,d[p]+n));
    d[p+1]=Math.max(0,Math.min(255,d[p+1]+n));
    d[p+2]=Math.max(0,Math.min(255,d[p+2]+n));
  }
  ctx.putImageData(imgData,0,0);
  var texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  _texCache[key] = texture;
  return texture;
}

function createTileTexture(tileColor, groutColor, opts){
  opts = opts || {};
  var key = 'tile_'+tileColor+'_'+groutColor+'_'+(opts.tileSize||64);
  if(_texCache[key]) return _texCache[key];
  var size = 512, tileSize = opts.tileSize || 64;
  var canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = _hexToCss(groutColor);
  ctx.fillRect(0,0,size,size);
  var groutW = opts.groutWidth || 3;
  var tileCss = _hexToCss(tileColor);
  for(var y=0;y<size;y+=tileSize){
    for(var x=0;x<size;x+=tileSize){
      ctx.fillStyle = _adjustCss(tileCss, (Math.random()-.5)*14);
      ctx.fillRect(x+groutW/2, y+groutW/2, tileSize-groutW, tileSize-groutW);
    }
  }
  var texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  _texCache[key] = texture;
  return texture;
}

function createRugTexture(type, baseColor){
  var key = 'rug_'+type+'_'+baseColor;
  if(_texCache[key]) return _texCache[key];
  var size = 512, canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  var ctx = canvas.getContext('2d');
  var baseCss = _hexToCss(baseColor);
  ctx.fillStyle = baseCss;
  ctx.fillRect(0,0,size,size);
  if(type==='woven'){
    var tc = 28, tw = size/tc;
    for(var i=0;i<tc;i++){
      ctx.fillStyle = _adjustCss(baseCss,(Math.random()-.5)*18);
      ctx.fillRect(0,i*tw,size,tw*.85);
      ctx.fillStyle = _adjustCss(baseCss,(Math.random()-.5)*14);
      ctx.fillRect(i*tw,0,tw*.85,size);
    }
  }else if(type==='striped'){
    var sc = 10, sh = size/sc;
    for(var s=0;s<sc;s++){
      ctx.fillStyle = _adjustCss(baseCss,(s%2?1:-1)*10+(Math.random()-.5)*6);
      ctx.fillRect(0,s*sh,size,sh);
    }
  }else if(type==='cloud'){
    for(var ci=0;ci<7;ci++){
      var ccx = Math.random()*size, ccy = Math.random()*size;
      var cr = 25+Math.random()*35;
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      for(var cj=0;cj<5;cj++){
        ctx.beginPath();
        ctx.arc(ccx+(Math.random()-.5)*cr, ccy+(Math.random()-.5)*cr*.5, cr*(.4+Math.random()*.6),0,Math.PI*2);
        ctx.fill();
      }
    }
  }else if(type==='floral'){
    var cols = ['#e8a0a0','#f0d090','#a0c878','#c8a8d0'];
    for(var fi=0;fi<10;fi++){
      var fcx = Math.random()*size, fcy = Math.random()*size;
      var fr = 18+Math.random()*22;
      ctx.fillStyle = cols[Math.floor(Math.random()*cols.length)];
      for(var fp=0;fp<5;fp++){
        var fa = (fp/5)*Math.PI*2;
        ctx.beginPath();
        ctx.arc(fcx+Math.cos(fa)*fr*.6, fcy+Math.sin(fa)*fr*.6, fr*.45,0,Math.PI*2);
        ctx.fill();
      }
      ctx.fillStyle = '#f0e060';
      ctx.beginPath();
      ctx.arc(fcx,fcy,fr*.28,0,Math.PI*2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = _adjustCss(baseCss,-30);
  ctx.lineWidth = 8;
  ctx.strokeRect(4,4,size-8,size-8);
  var texture = new THREE.CanvasTexture(canvas);
  _texCache[key] = texture;
  return texture;
}

function createMarbleTexture(baseColor, veinColor){
  var key = 'marble_'+baseColor+'_'+veinColor;
  if(_texCache[key]) return _texCache[key];
  var size = 512, canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = _hexToCss(baseColor);
  ctx.fillRect(0,0,size,size);
  var veinCss = _hexToCss(veinColor);
  for(var v=0;v<4;v++){
    ctx.strokeStyle = veinCss;
    ctx.lineWidth = 1+Math.random()*2;
    ctx.globalAlpha = .12+Math.random()*.2;
    ctx.beginPath();
    var mx = Math.random()*size, my = Math.random()*size;
    ctx.moveTo(mx,my);
    for(var s=0;s<8;s++){
      var mcx = mx+(Math.random()-.5)*80;
      var mcy = my+(Math.random()-.5)*80;
      mx = mcx+(Math.random()-.5)*60;
      my = mcy+(Math.random()-.5)*60;
      ctx.quadraticCurveTo(mcx,mcy,mx,my);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  var imgData = ctx.getImageData(0,0,size,size);
  var d = imgData.data;
  for(var p=0;p<d.length;p+=4){
    var n = (Math.random()-.5)*5;
    d[p]=Math.max(0,Math.min(255,d[p]+n));
    d[p+1]=Math.max(0,Math.min(255,d[p+1]+n));
    d[p+2]=Math.max(0,Math.min(255,d[p+2]+n));
  }
  ctx.putImageData(imgData,0,0);
  var texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  _texCache[key] = texture;
  return texture;
}

function mat3D(color, rough, options){
  rough = rough || .78; options = options || {};
  var material = new THREE.MeshStandardMaterial({
    color: options.texture ? 0xffffff : color,
    roughness: rough,
    metalness: options.metalness ?? .025,
    side: options.side ?? THREE.DoubleSide,
    transparent: !!options.transparent,
    opacity: options.opacity ?? 1
  });
  if(options.texture) material.map = options.texture;
  if(options.emissive !== undefined) material.emissive = new THREE.Color(options.emissive);
  if(options.emissiveIntensity !== undefined) material.emissiveIntensity = options.emissiveIntensity;
  if(options.depthWrite !== undefined) material.depthWrite = options.depthWrite;
  if(options.depthTest !== undefined) material.depthTest = options.depthTest;
  return material;
}

function box3D(scene, x,y,z, w,h,d, color, name, options={}){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), options.material || mat3D(color, options.rough ?? .78, options));
  mesh.position.set(x,y,z);
  if(options.rotX) mesh.rotation.x = options.rotX;
  if(options.rotY) mesh.rotation.y = options.rotY;
  if(options.rotZ) mesh.rotation.z = options.rotZ;
  mesh.name = name || '';
  mesh.castShadow = options.castShadow ?? (h > .08);
  mesh.receiveShadow = options.receiveShadow ?? true;
  if(options.renderOrder !== undefined) mesh.renderOrder = options.renderOrder;
  scene.add(mesh);
  return mesh;
}

function plane3D(scene, x,y,z, w,h, color, rotX=0, rotY=0, name='', options={}){
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w,h), options.material || mat3D(color, options.rough, options));
  mesh.position.set(x,y,z);
  mesh.rotation.x = rotX;
  mesh.rotation.y = rotY;
  mesh.name = name;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function roundedBox3D(scene, x,y,z, w,h,d, color, name, radius=.09, options={}){
  const group = new THREE.Group();
  group.position.set(x,y,z);
  group.name = name || '';
  if(options.renderOrder !== undefined) group.renderOrder = options.renderOrder;
  const coreW = Math.max(.01, w - radius*2);
  const coreD = Math.max(.01, d - radius*2);
  const mat = options.material || mat3D(color, options.rough ?? .78, options);
  const add = mesh => {
    mesh.castShadow = options.castShadow ?? true;
    mesh.receiveShadow = options.receiveShadow ?? true;
    group.add(mesh);
  };
  add(new THREE.Mesh(new THREE.BoxGeometry(coreW,h,d), mat));
  add(new THREE.Mesh(new THREE.BoxGeometry(w,h,coreD), mat));
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{
    const post = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,h,18), mat);
    post.position.set(sx*(w/2-radius),0,sz*(d/2-radius));
    add(post);
  });
  scene.add(group);
  return group;
}

function planeMat3D(scene, x,y,z, w,h, color, rotX=0, rotY=0, name='', options={}){
  const material = options.material || mat3D(color, options.rough ?? .78, options);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w,h), material);
  mesh.position.set(x,y,z);
  mesh.rotation.x = rotX;
  mesh.rotation.y = rotY;
  if(options.rotZ) mesh.rotation.z = options.rotZ;
  mesh.name = name;
  mesh.castShadow = options.castShadow ?? false;
  mesh.receiveShadow = options.receiveShadow ?? true;
  if(options.renderOrder !== undefined) mesh.renderOrder = options.renderOrder;
  scene.add(mesh);
  return mesh;
}

function realSpaceRoomContext(scene,cfg,roomName){
  const ctx = {
    scene,
    cfg,
    roomName,
    placements:[],
    issues:[],
    loaderReady:!!(window.realSpaceGLTFLoader || window.GLTFLoaderInstance)?.load
  };
  if(!ctx.loaderReady) ctx.issues.push('GLTF loader unavailable; using procedural fallback assets');
  scene.userData.realSpace = ctx;
  return ctx;
}

function placeRealAsset3D(ctx,key,placement,fallback){
  const assetDims = REAL_SPACE_ASSETS[key]?.dims?.map(mm3D);
  const dims = placement.dims || assetDims || [placement.w || .5, placement.h || .5, placement.d || .5];
  const itemH = placement.h ?? dims[1];
  const itemY = placement.y ?? itemH/2;
  const item = {
    key,
    x:placement.x,
    y:itemY,
    z:placement.z,
    w:placement.w ?? dims[0],
    h:itemH,
    d:placement.d ?? dims[2],
    floorY:placement.floorY ?? (itemY - itemH/2),
    rotY:placement.rotY || 0
  };
  validateRealPlacement(ctx,item);
  addContactShadow3D(ctx.scene,item.x,item.z,item.w*.96,item.d*.92,Math.min(.24, .12 + item.h*.08));
  const before = new Set(ctx.scene.children);
  const glb = maybePlaceGLBAsset3D(ctx,key,item,()=>fallback?.(item));
  if(glb) return glb;
  const fallbackObject = fallback?.(item);
  if(fallbackObject) return tagFallbackAsset3D(fallbackObject,key,item);
  const grouped = groupFallbackAdditions3D(ctx,before,key,item);
  if(grouped) return grouped;
  ctx.issues.push(`${key} using untagged procedural fallback`);
  return null;
}

function maybePlaceGLBAsset3D(ctx,key,item,onFallback){
  if(REAL_SPACE_FORCE_PROCEDURAL) return null;
  const asset = REAL_SPACE_ASSETS[key];
  const loader = window.realSpaceGLTFLoader || window.GLTFLoaderInstance;
  if(!asset || !loader?.load) return null;
  const group = new THREE.Group();
  group.name = `${key}-asset-slot`;
  group.position.set(item.x,item.floorY,item.z);
  group.rotation.y = item.rotY || 0;
  ctx.scene.add(group);
  loader.load(realSpaceAssetUrl(asset), gltf=>{
    const model = gltf.scene || gltf.scenes?.[0];
    if(!model) return;
    fitAssetToBox3D(model,item.w,item.h,item.d);
    prepareLoadedRealAsset3D(model);
    group.add(model);
  }, undefined, ()=>{
    ctx.issues.push(`${key} GLB load failed; procedural fallback used`);
    ctx.scene.remove(group);
    onFallback?.();
  });
  return group;
}

function realSpaceAssetUrl(asset){
  return window.REAL_SPACE_EMBEDDED_ASSETS?.[asset.file] || (REAL_SPACE_ASSET_ROOT + asset.file);
}

function fitAssetToBox3D(model,w,h,d){
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const scale = Math.min(w/(size.x || 1), h/(size.y || 1), d/(size.z || 1));
  model.scale.multiplyScalar(scale);
  const fitted = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  fitted.getCenter(center);
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= fitted.min.y;
}

function prepareLoadedRealAsset3D(model){
  model.traverse?.(child=>{
    if(child.isMesh){
      child.castShadow = true;
      child.receiveShadow = true;
      if(child.material){
        child.material.needsUpdate = true;
      }
    }
  });
}

function validateRealPlacement(ctx,item){
  const cfg = ctx.cfg;
  if(item.floorY < -.01) ctx.issues.push(`${item.key} below floor`);
  if(item.x - item.w/2 < -.03 || item.x + item.w/2 > cfg.w+.03 || item.z - item.d/2 < -.03 || item.z + item.d/2 > cfg.d+.03){
    ctx.issues.push(`${item.key} outside ${ctx.roomName}`);
  }
  ctx.placements.push(item);
}

function finalizeRealSpaceContext(ctx){
  if(!ctx || ctx._finalized) return ctx;
  ctx._finalized = true;
  for(let i=0;i<ctx.placements.length;i++){
    for(let j=i+1;j<ctx.placements.length;j++){
      const a = ctx.placements[i];
      const b = ctx.placements[j];
      if(realPlacementOverlap(a,b) > .04){
        ctx.issues.push(`${a.key} overlaps ${b.key}`);
      }
    }
  }
  pruneProblemFallbackAssets(ctx);
  return ctx;
}

function pruneProblemFallbackAssets(ctx){
  if(!ctx?.scene || !ctx.issues?.length) return;
  const badKeys = new Set();
  ctx.issues.forEach(issue=>{
    const m = String(issue || '').match(/^([a-z0-9_-]+)\s(?:below floor|outside|overlaps)/i);
    if(m?.[1]) badKeys.add(m[1]);
  });
  if(!badKeys.size) return;
  ctx.scene.traverse(obj=>{
    if(!obj?.userData?.fallback) return;
    if(!badKeys.has(obj.userData.realAssetKey)) return;
    obj.visible = false;
  });
}

function realPlacementOverlap(a,b){
  const ox = Math.min(a.x+a.w/2,b.x+b.w/2) - Math.max(a.x-a.w/2,b.x-b.w/2);
  const oz = Math.min(a.z+a.d/2,b.z+b.d/2) - Math.max(a.z-a.d/2,b.z-b.d/2);
  return Math.max(0,ox) * Math.max(0,oz);
}

function groupFallbackAdditions3D(ctx,before,key,item){
  const added = ctx.scene.children.filter(child=>!before.has(child));
  if(!added.length) return null;
  const group = new THREE.Group();
  group.name = `${key}-procedural-fallback`;
  ctx.scene.add(group);
  added.forEach(child=>{
    if(child === group) return;
    if(typeof group.attach === 'function') group.attach(child);
    else group.add(child);
  });
  return tagFallbackAsset3D(group,key,item);
}

function tagFallbackAsset3D(object,key,item){
  object.name = object.name || `${key}-fallback`;
  object.userData = Object.assign({}, object.userData, {realAssetKey:key, fallback:true, footprint:{w:item.w,d:item.d,h:item.h}});
  return object;
}

function cylinder3D(scene, x,y,z, radius, height, color, name, radial=24, options={}){
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,radial), options.material || mat3D(color, options.rough ?? .78, options));
  mesh.position.set(x,y,z);
  if(options.rotX) mesh.rotation.x = options.rotX;
  if(options.rotY) mesh.rotation.y = options.rotY;
  if(options.rotZ) mesh.rotation.z = options.rotZ;
  mesh.name = name || '';
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  scene.add(mesh);
  return mesh;
}

function addWoodGrain3D(scene, x,y,z, w,d, vertical=false, count=5, color=0x9b6a3d){
  for(let i=0;i<count;i++){
    const offset = (i - (count-1)/2) * (vertical ? d : w) / count;
    const line = box3D(
      scene,
      x + (vertical ? 0 : offset),
      y,
      z + (vertical ? offset : 0),
      vertical ? w*.86 : .018,
      .018,
      vertical ? .018 : d*.86,
      color,
      'wood-grain',
      {rough:.92, castShadow:false}
    );
    line.material.transparent = true;
    line.material.opacity = .28;
  }
}

function addCabinetHandle3D(scene,x,y,z,w,d,vertical=false){
  if(vertical){
    cylinder3D(scene,x,y,z,.025,w,HOME_PALETTE.woodDark,'cabinet-handle',16,{rotX:Math.PI/2, metalness:.08, rough:.48});
  }else{
    cylinder3D(scene,x,y,z,.025,w,HOME_PALETTE.woodDark,'cabinet-handle',16,{rotZ:Math.PI/2, metalness:.08, rough:.48});
  }
  if(d){
    box3D(scene,x,y-.09,z,.035,.035,d,HOME_PALETTE.woodDark,'handle-post',{rough:.54});
    box3D(scene,x,y+.09,z,.035,.035,d,HOME_PALETTE.woodDark,'handle-post',{rough:.54});
  }
}

function addHouseModel3D(scene, activeNode){
  addHouseFloors3D(scene);
  addHouseWalls3D(scene);
  addHouseCeiling3D(scene);
  addHouseDoorsAndWindows3D(scene);
  addRoomAccentSurfaces3D(scene);
  addSightlineGuides3D(scene);
  addHouseFurniture3D(scene);
  addWalkablePath3D(scene, activeNode);
  addHouseMoveTargets3D(scene, activeNode);
  addPendant3D(scene, 0, HOUSE_CEILING_Y - .18, .2);
  addPendant3D(scene, -4.25, HOUSE_CEILING_Y - .24, -2.85);
  addPendant3D(scene, 4.35, HOUSE_CEILING_Y - .24, -2.35);
}

function addFocusedRoomModel3D(scene, node){
  addRoomShell3D(scene, node);
  addRoomIdentitySurfaces3D(scene, node);
  addNodeFurniture3D(scene, node);
  addFocusedRoomDetails3D(scene, node);
  addHouseMoveTargets3D(scene, node);
}

function mm3D(value){
  return value / 1000;
}

function addRealHomeRoomModel3D(scene, node){
  const cfg = realHome3DConfig(node);
  addRealHomeLights3D(scene, cfg);
  if(cfg.id === 'public') {
    addRealPublicHome3D(scene, cfg);
    return;
  }
  addRealHomeShell3D(scene, cfg);
  if(cfg.id === 'living') addRealLivingRoom3D(scene, cfg);
  if(cfg.id === 'entry') addRealEntryRoom3D(scene, cfg);
  if(cfg.id === 'study') addRealStudyRoom3D(scene, cfg);
  if(cfg.id === 'bedroom') addRealBedroomRoom3D(scene, cfg);
  if(cfg.id === 'bath') addRealBathRoom3D(scene, cfg);
}

function realHome3DConfig(node){
  if(['living-node','entry-node','study-node','bedroom-node','balcony-node'].includes(node.id)){
    const living = REAL_HOME_SPEC.rooms.living;
    const entry = REAL_HOME_SPEC.rooms.entry;
    const study = REAL_HOME_SPEC.rooms.secondaryBedroom2;
    const dining = REAL_HOME_SPEC.rooms.dining;
    const bedroom = REAL_HOME_SPEC.rooms.masterBedroom;
    const publicWindowW = 5.08;
    const publicWindowX = 1.38;
    const floorWindowSill = .025;
    const floorWindowH = 2.64;
    const cfg = {
      id:'public',
      nodeId:node.id,
      spec:{living, entry, study, dining, bedroom},
      w:8.4,
      d:6.25,
      livingOrigin:{x:2.0,z:1.35},
      entryOrigin:{x:.05,z:2.1},
      studyOrigin:{x:4.9,z:1.05},
      diningOrigin:{x:5.2,z:3.15},
      bedroomOrigin:{x:6.7,z:1.34},
      balcony:{x:publicWindowX-.08,z:5.45,w:publicWindowW+.16,d:.9},
      window:{wall:'south', x:publicWindowX, z:1.35+mm3D(living.d), w:publicWindowW, h:floorWindowH, sill:floorWindowSill, floorToCeiling:true}
    };
    if(node.id === 'balcony-node') return Object.assign(cfg,{camera:[4.02,1.47,4.42],look:[4.0,1.34,7.18],fov:58,yawLimit:130,pitchLimit:14});
    if(node.id === 'entry-node') return Object.assign(cfg,{camera:[.62,1.52,2.86],look:[3.42,1.08,5.92],fov:72,yawLimit:180,pitchLimit:22});
    if(node.id === 'study-node') return Object.assign(cfg,{camera:[5.18,1.54,3.22],look:[6.52,1.12,1.56],fov:64,yawLimit:180,pitchLimit:22});
    if(node.id === 'bedroom-node') return Object.assign(cfg,{camera:[5.72,1.52,3.28],look:[7.12,1.06,2.34],fov:70,yawLimit:180,pitchLimit:22});
    return Object.assign(cfg,{camera:[2.64,1.54,2.62],look:[4.02,1.28,5.9],fov:62,yawLimit:145,pitchLimit:16});
  }
  if(node.id === 'bath-node'){
    const spec = REAL_HOME_SPEC.rooms.publicBath;
    return {
      id:'bath',
      spec,
      w:mm3D(spec.w),
      d:mm3D(spec.d),
      camera:[.35,1.52,.9],
      look:[1.5,.85,2.0],
      fov:70,
      yawLimit:180,
      pitchLimit:22,
      window:{wall:'west', x:0, z:mm3D((spec.d-spec.window.w)/2), w:mm3D(spec.window.w), h:mm3D(spec.window.h), sill:mm3D(REAL_HOME_SPEC.sill)}
    };
  }
  const spec = REAL_HOME_SPEC.rooms.living;
  return {
    id:'living',
    spec,
    w:mm3D(spec.w),
    d:mm3D(spec.d),
    camera:[.42,1.52,-.52],
    look:[2.82,1.14,3.86],
    fov:58,
    window:{wall:'south', x:mm3D((spec.w-spec.window.w)/2), z:mm3D(spec.d), w:mm3D(spec.window.w), h:2.64, sill:.025, floorToCeiling:true, sun:true}
  };
}

function addRealHomeLights3D(scene,cfg){
  const lightOn = state.lightOn !== false;
  const windowOpen = state.windowOpen === true;
  const warmPublic = cfg.id === 'living' || cfg.id === 'public';
  const dayBg = warmPublic ? 0xf6eadb : 0xefdcc8;
  const nightBg = warmPublic ? 0x151d28 : 0x171a1f;
  scene.background = new THREE.Color(lightOn ? dayBg : nightBg);
  scene.fog = new THREE.Fog(lightOn ? dayBg : nightBg, lightOn ? (cfg.id === 'public' ? 54 : 24) : 12, lightOn ? (cfg.id === 'public' ? 104 : 44) : 34);
  const hemiBoost = windowOpen ? 1.12 : .9;
  const hemi = new THREE.HemisphereLight(
    lightOn ? 0xffead0 : 0x8fa8c6,
    lightOn ? 0xa98665 : 0x11151c,
    lightOn ? (warmPublic ? .82 * hemiBoost : .68 * hemiBoost) : (warmPublic ? .18 : .14)
  );
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffd6a0, lightOn ? (warmPublic ? (windowOpen ? .86 : .54) : (windowOpen ? .68 : .46)) : .045);
  if(cfg.window?.wall === 'west'){
    sun.position.set(-2.4,3.8,cfg.d*.64);
    sun.target.position.set(cfg.w*.58,0.1,cfg.d*.56);
  }else if(cfg.id === 'public'){
    sun.position.set(1.15,5.15,9.1);
    sun.target.position.set(3.1,0.06,3.0);
  }else{
    sun.position.set(-2.25,4.85,cfg.d+3.4);
    sun.target.position.set(cfg.w*.38,0.04,cfg.d*.28);
  }
  sun.castShadow = true;
  if(sun.shadow){
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -4.5;
    sun.shadow.camera.right = 4.5;
    sun.shadow.camera.top = 4.5;
    sun.shadow.camera.bottom = -4.5;
    sun.shadow.camera.near = .5;
    sun.shadow.camera.far = 12;
    sun.shadow.bias = -.0006;
  }
  scene.add(sun);
  scene.add(sun.target);
  const fill = new THREE.DirectionalLight(warmPublic ? 0xf1d2ac : 0xd8c1a0, lightOn ? (warmPublic ? (windowOpen ? .26 : .16) : (windowOpen ? .18 : .12)) : .025);
  fill.position.set(3,2.2,-2.4);
  scene.add(fill);
  const windowBounce = new THREE.DirectionalLight(lightOn ? 0xe1f5ff : 0x3b4f68, lightOn ? (windowOpen ? .34 : .15) : .04);
  windowBounce.position.set(-2.8,1.7,7.5);
  scene.add(windowBounce);
  let lamp = null;
  let moonFill = null;
  if(lightOn){
    lamp = new THREE.PointLight(0xffc889,warmPublic ? .035 : .06,4.8);
    lamp.position.set(cfg.w/2,2.55,(cfg.d || 5.8)*.42);
    lamp.castShadow = true;
    scene.add(lamp);
  }else{
    moonFill = new THREE.DirectionalLight(0x9eb8d8, .13);
    moonFill.position.set(-2.6,4.2,8.2);
    scene.add(moonFill);
  }
  [hemi, sun, fill, windowBounce, lamp, moonFill].forEach(light=>{
    if(!light) return;
    light.userData = light.userData || {};
    light.userData.baseIntensity = light.intensity;
  });
  if(webglTour){
    webglTour.realHomeLights = { hemi, sun, fill, windowBounce, lamp, moonFill };
  }
}

function addRealHomeShell3D(scene,cfg){
  const lightOn = state.lightOn !== false;
  const living = cfg.id === 'living';
  const wallColor = cfg.id === 'bath' ? (lightOn ? 0xd5d7d0 : 0x666b66) : (lightOn ? (living ? 0xe0d2bf : 0xddc2a6) : 0x5c4f43);
  const sideColor = cfg.id === 'bath' ? (lightOn ? 0xc9d0c9 : 0x565d58) : (lightOn ? (living ? 0xc4ad92 : 0xc6a487) : 0x473c33);
  const floorColor = cfg.id === 'bath' ? (lightOn ? 0xbcc5c0 : 0x4e5551) : (lightOn ? (living ? 0x8a6244 : 0x8d5f3f) : 0x3b2b22);
  const ceilingColor = lightOn ? (living ? 0xe5d8c8 : 0xe6d4c3) : 0x625950;
  const roomH = mm3D(REAL_HOME_SPEC.netHeight);
  const w = cfg.w;
  const d = cfg.d;
  var _isBathRoom = cfg.id === 'bath';
  var _roomFloorTex;
  if(_isBathRoom){
    _roomFloorTex = _texRepeat(createTileTexture(floorColor, 0x9eaaa8, {tileSize:128}), Math.max(1,Math.round(w/.6)), Math.max(1,Math.round(d/.6)));
  }else{
    _roomFloorTex = _texRepeat(createWoodGrainTexture(floorColor, {grainStrength:.5}), Math.max(1,Math.round(w/1.5)), Math.max(1,Math.round(d/1.5)));
  }
  planeMat3D(scene,w/2,0,d/2,w,d,floorColor,-Math.PI/2,0,'real-floor',{rough:.84,texture:_roomFloorTex});
  addRealSouthWall3D(scene,cfg,wallColor,roomH);
  if(cfg.id === 'entry') addRealEntryNorthDoor3D(scene,cfg,wallColor,roomH);
  else if(cfg.window?.wall === 'north') addRealNorthWindowWall3D(scene,cfg,wallColor,roomH);
  else if(cfg.id === 'bedroom' || cfg.id === 'bath') addRealNorthWall3D(scene,cfg,wallColor,roomH);
  addRealWestWall3D(scene,cfg,sideColor,roomH);
  planeMat3D(scene,w,roomH/2,d/2,d,roomH,shade3D(sideColor,12),0,-Math.PI/2,'real-east-wall',{rough:.88});
  addRealViewingEdge3D(scene,cfg,roomH);
  if(living) addRealLivingCeiling3D(scene,cfg,roomH,ceilingColor);
  else planeMat3D(scene,w/2,roomH,d/2,w,d,ceilingColor,Math.PI/2,0,'real-ceiling',{rough:.9});
  addRealFloorGrid3D(scene,cfg);
  addRealBaseboard3D(scene,cfg);
  addRealWindow3D(scene,cfg);
  addRealCeilingFixture3D(scene,cfg);
}

/* === 3D安防摄像头系统 === */
function addSecurityCameras3D(scene, cfg){
  if(cfg.id !== 'public') return;
  var cameras = [];
  SECURITY_CAMERAS.forEach(function(cam){
    /* 摄像头模型: 更大的半球形安防摄像头 */
    var mountY = cam.y;
    var bodyY = cam.y - 0.04;
    var panPivot = new THREE.Group();
    panPivot.position.set(cam.x, bodyY, cam.z + 0.04 * cam.dir);
    panPivot.name = 'cam-pan-'+cam.id;
    scene.add(panPivot);
    var headGroup = new THREE.Group();
    headGroup.rotation.x = -.18;
    panPivot.add(headGroup);
    /* 壁挂底座 */
    box3D(scene, cam.x, mountY, cam.z, 0.09, 0.05, 0.04, 0x333333, 'cam-mount-'+cam.id, {castShadow:false, rough:.6, metalness:.1});
    /* 摄像头主体(圆柱形) */
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.07, 20), mat3D(0x2a2a2a, .4, {metalness:.2, castShadow:false}));
    body.rotation.x = Math.PI / 2;
    body.name = 'cam-body-'+cam.id;
    body.castShadow = false;
    body.receiveShadow = true;
    headGroup.add(body);
    /* 镜头(黑色半球) */
    var lensMesh = new THREE.Mesh(new THREE.SphereGeometry(0.028, 20, 12), new THREE.MeshStandardMaterial({color:0x0a0a0a, roughness:.1, metalness:.5}));
    lensMesh.position.set(0, 0, 0.04);
    lensMesh.name = 'cam-lens-'+cam.id;
    headGroup.add(lensMesh);
    /* 镜头外环 */
    var lensRing = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.015, 20), mat3D(0x444444, .3, {metalness:.3, castShadow:false}));
    lensRing.position.set(0, 0, 0.035);
    lensRing.rotation.x = Math.PI / 2;
    lensRing.name = 'cam-lens-ring-'+cam.id;
    lensRing.castShadow = false;
    headGroup.add(lensRing);
    /* LED指示灯(更大更亮) */
    var led = new THREE.Mesh(new THREE.SphereGeometry(0.01, 16, 12), new THREE.MeshBasicMaterial({color:0x333333}));
    led.position.set(0.035, 0.01, 0.012);
    led.name = 'cam-led-'+cam.id;
    headGroup.add(led);
    var emitPoint = new THREE.Object3D();
    emitPoint.position.set(0, 0, 0.05);
    headGroup.add(emitPoint);
    /* 扫描聚光灯(初始关闭) */
    var spot = new THREE.SpotLight(0x00ff88, 0, 8, Math.PI/4, 0.6, 1.2);
    var targetZ = cam.z + 2.8 * cam.dir;
    spot.target.position.set(cam.x, 0.5, targetZ);
    spot.visible = false;
    scene.add(spot);
    scene.add(spot.target);
    /* 可见扫描锥(半透明绿色锥体) */
    var coneHeight = bodyY;
    var coneGeom = new THREE.ConeGeometry(1.0, coneHeight, 28, 1, true);
    var coneMat = new THREE.MeshBasicMaterial({color:0x00ff88, transparent:true, opacity:0, side:THREE.DoubleSide, depthWrite:false});
    var cone = new THREE.Mesh(coneGeom, coneMat);
    cone.position.set(cam.x, bodyY - coneHeight/2, cam.z + (coneHeight/2) * 0.3 * cam.dir);
    cone.rotation.x = Math.PI * (cam.dir > 0 ? 1 : 0);
    cone.rotation.z = cam.dir > 0 ? 0 : Math.PI;
    cone.visible = false;
    cone.renderOrder = 8;
    cone.name = 'scan-cone-'+cam.id;
    scene.add(cone);
    /* 地板扫描线(更宽更亮) */
    var lineMat = new THREE.MeshBasicMaterial({color:0x00ff88, transparent:true, opacity:0, side:THREE.DoubleSide, depthWrite:false});
    var line = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.08), lineMat);
    line.position.set(cam.x, 0.03, targetZ);
    line.rotation.x = -Math.PI/2;
    line.renderOrder = 9;
    scene.add(line);
    /* 地板光晕(更大范围) */
    var glowMat = new THREE.MeshBasicMaterial({color:0x00ff88, transparent:true, opacity:0, side:THREE.DoubleSide, depthWrite:false});
    var glow = new THREE.Mesh(new THREE.CircleGeometry(1.2, 32), glowMat);
    glow.rotation.x = -Math.PI/2;
    glow.position.set(cam.x, 0.025, targetZ);
    glow.renderOrder = 7;
    scene.add(glow);
    cameras.push({id:cam.id, config:cam, spotlight:spot, cone:cone, led:led, line:line, glow:glow, baseTargetX:cam.x, baseTargetZ:targetZ, bodyY:bodyY, panPivot:panPivot, headGroup:headGroup, emitPoint:emitPoint, restYaw:cam.dir > 0 ? 0 : Math.PI, restPitch:-.18, coneHeight:coneHeight});
    /* 注册可点击目标 */
    [lensMesh].forEach(function(m){ m.userData.cameraClick = cam.id; if(webglTour.cameraClickTargets) webglTour.cameraClickTargets.push(m); });
    addCameraClickProxy3D(scene, cam);
  });
  webglTour.securityCameras = cameras;
}

function updateCameraScan3D(){
  if(!webglTour || !webglTour.securityCameras) return;
  var cams = webglTour.securityCameras;
  if(state.cameraScanIndex < 0){
    for(var i=0;i<cams.length;i++){
      if(cams[i].spotlight.visible || cams[i].cone.visible || cams[i].line.material.opacity > 0){
        cams[i].spotlight.visible = false;
        cams[i].cone.visible = false;
        cams[i].line.material.opacity = 0;
        cams[i].glow.material.opacity = 0;
        cams[i].led.material.color.setHex(0x333333);
      }
    }
    return;
  }
  var elapsed = (Date.now() - state.cameraScanStart) / 1000;
  var duration = 4.5;
  if(elapsed > duration){
    state.cameraScanIndex = -1;
    for(var j=0;j<cams.length;j++){
      cams[j].spotlight.visible = false;
      cams[j].cone.visible = false;
      cams[j].line.material.opacity = 0;
      cams[j].glow.material.opacity = 0;
      cams[j].led.material.color.setHex(0x333333);
    }
    return;
  }
  var progress = elapsed / duration;
  /* 扫摆角度: 2.5个来回 */
  var sweepAngle = Math.sin(progress * Math.PI * 2.5) * 0.5;
  /* 开场闪光(前0.5秒) */
  var flash = progress < 0.1 ? (1 - progress/0.1) : 0;
  for(var k=0;k<cams.length;k++){
    var c = cams[k];
    if(c.id === state.cameraScanIndex){
      /* 聚光灯 */
      c.spotlight.visible = true;
      c.spotlight.intensity = 1.2 + Math.sin(elapsed * 6) * 0.3 + flash * 2;
      c.spotlight.target.position.x = c.baseTargetX + Math.sin(sweepAngle) * 1.5;
      c.spotlight.target.position.z = c.baseTargetZ + (1 - Math.cos(sweepAngle)) * 0.5 * c.config.dir;
      c.spotlight.target.updateMatrixWorld();
      /* 可见锥体 */
      c.cone.visible = true;
      c.cone.rotation.y = sweepAngle * 0.6;
      c.cone.material.opacity = 0.08 + Math.sin(elapsed * 5) * 0.03 + flash * 0.15;
      /* 地板扫描线 */
      c.line.position.x = c.spotlight.target.position.x;
      c.line.position.z = c.spotlight.target.position.z;
      c.line.material.opacity = 0.5 + Math.sin(elapsed * 8) * 0.2;
      /* 地板光晕 */
      c.glow.position.x = c.spotlight.target.position.x;
      c.glow.position.z = c.spotlight.target.position.z;
      c.glow.material.opacity = 0.12 + Math.sin(elapsed * 4) * 0.05;
      /* LED绿色闪烁 */
      c.led.material.color.setHex(Math.sin(elapsed * 8) > 0 ? 0x00ff44 : 0x008822);
    }else{
      c.spotlight.visible = false;
      c.cone.visible = false;
      c.line.material.opacity = 0;
      c.glow.material.opacity = 0;
      c.led.material.color.setHex(0x333333);
    }
  }
}

function updateCameraScan3D(){
  if(!webglTour || !webglTour.securityCameras) return;
  var cams = webglTour.securityCameras;
  var scanFx = cameraScanCinematicState();
  if(scanFx.complete){
    state.cameraScanIndex = -1;
    scanFx = cameraScanCinematicState();
  }
  applyCameraScanSceneFX(scanFx);
  if(state.cameraScanIndex < 0){
    for(var i=0;i<cams.length;i++){
      updateSecurityCameraPose(cams[i], null, false);
      if(cams[i].spotlight.visible || cams[i].cone.visible || cams[i].line.material.opacity > 0){
        cams[i].spotlight.visible = false;
        cams[i].cone.visible = false;
        cams[i].line.material.opacity = 0;
        cams[i].glow.material.opacity = 0;
        cams[i].led.material.color.setHex(0x333333);
      }
    }
    updateTourCinematicOverlay(scanFx, null);
    return;
  }
  var overlayTarget = null;
  for(var k=0;k<cams.length;k++){
    var c = cams[k];
    if(c.id === state.cameraScanIndex){
      var targetPoint = new THREE.Vector3(
        c.baseTargetX + Math.sin(scanFx.sweepAngle) * scanFx.targetSpread,
        0.5 + scanFx.lock * 0.1,
        c.baseTargetZ + (1 - Math.cos(scanFx.sweepAngle)) * 0.82 * c.config.dir * (scanFx.lock < .85 ? 1 : .55)
      );
      updateSecurityCameraPose(c, targetPoint, true);
      var emitWorld = new THREE.Vector3();
      c.emitPoint?.getWorldPosition(emitWorld);
      c.spotlight.visible = true;
      c.spotlight.intensity = 1.28 + Math.sin(scanFx.elapsed * 7.5) * 0.18 + scanFx.spotlightBoost + scanFx.entryFlash * 1.6 + scanFx.lockFlash * 1.9;
      c.spotlight.angle = Math.PI / (3.45 + scanFx.lock * 1.9);
      c.spotlight.penumbra = 0.34 + scanFx.lock * 0.34;
      if(c.spotlight.position?.copy) c.spotlight.position.copy(emitWorld);
      c.spotlight.target.position.copy(targetPoint);
      c.spotlight.target.updateMatrixWorld();
      c.cone.visible = true;
      var beamVector = targetPoint.clone().sub(emitWorld);
      var beamMid = emitWorld.clone().add(beamVector.clone().multiplyScalar(0.5));
      c.cone.position.copy(beamMid);
      c.cone.scale.set(1, Math.max(.68, beamVector.length() / Math.max(.001, c.coneHeight || 1)), 1);
      c.cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), beamVector.clone().normalize());
      c.cone.rotateX(Math.PI);
      c.cone.material.opacity = 0.1 + Math.sin(scanFx.elapsed * 5.4) * 0.02 + scanFx.coneBoost + scanFx.entryFlash * 0.14 + scanFx.lockFlash * 0.08;
      c.line.position.x = targetPoint.x;
      c.line.position.z = targetPoint.z;
      c.line.scale.x = scanFx.lineScale;
      c.line.material.opacity = 0.48 + scanFx.pulse * 0.16 + scanFx.lock * 0.14 + scanFx.lockFlash * 0.2;
      c.glow.position.x = targetPoint.x;
      c.glow.position.z = targetPoint.z;
      c.glow.scale.setScalar(0.96 + scanFx.lock * 0.2 + scanFx.lockFlash * 0.16);
      c.glow.material.opacity = 0.12 + scanFx.pulse * 0.06 + scanFx.lock * 0.14 + scanFx.lockFlash * 0.28;
      c.led.material.color.setHex(scanFx.lockFlash > .1 ? 0xdfffe8 : (scanFx.lock > .72 ? 0x9dffbf : (Math.sin(scanFx.elapsed * 9) > 0 ? 0x00ff66 : 0x0f7f3f)));
      overlayTarget = projectWorldToTourScreen(targetPoint);
    }else{
      updateSecurityCameraPose(c, null, false);
      c.spotlight.visible = false;
      c.cone.visible = false;
      c.line.material.opacity = 0;
      c.glow.material.opacity = 0;
      c.led.material.color.setHex(0x333333);
    }
  }
  updateTourCinematicOverlay(scanFx, overlayTarget);
}

function triggerCameraScan3D(camIdx){
  if(webglTour?.camera){
    state.cameraScanOrigin = {
      pos:[webglTour.camera.position.x, webglTour.camera.position.y, webglTour.camera.position.z],
      look:webglTour.realCameraSmooth?.look ? [webglTour.realCameraSmooth.look.x, webglTour.realCameraSmooth.look.y, webglTour.realCameraSmooth.look.z] : null,
      fov:webglTour.camera.fov
    };
  }
  state.cameraScanIndex = camIdx;
  state.cameraScanStart = Date.now();
  var scanLoop = function(){
    if(state.cameraScanIndex < 0) return;
    updateCameraScan3D();
    if(webglTour && webglTour.renderer && webglTour.scene && webglTour.camera){
      webglTour.renderer.render(webglTour.scene, webglTour.camera);
    }
    if(state.cameraScanIndex >= 0){
      requestAnimationFrame(scanLoop);
    }
  };
  requestAnimationFrame(scanLoop);
}

function addRealPublicHome3D(scene,cfg){
  const lightOn = state.lightOn !== false;
  const roomH = mm3D(REAL_HOME_SPEC.netHeight);
  realSpaceRoomContext(scene,cfg,'public');
  const floorColor = lightOn ? 0x9c7048 : 0x322a28;
  const wallColor = lightOn ? 0xf5eadc : 0x4a4750;
  const sideColor = lightOn ? 0xecddcb : 0x383845;
  var _pubFloorTex = _texRepeat(createWoodGrainTexture(floorColor, {grainStrength:.5}), Math.max(1,Math.round(cfg.w/1.5)), Math.max(1,Math.round(cfg.d/1.5)));
  planeMat3D(scene,cfg.w/2,0,cfg.d/2,cfg.w,cfg.d,floorColor,-Math.PI/2,0,'real-public-floor',{rough:.84,texture:_pubFloorTex});
  addRealPublicFloorGrid3D(scene,cfg);
  addRealPublicBoundaries3D(scene,cfg,wallColor,sideColor,roomH);
  addRealPublicZoneSurfaces3D(scene,cfg);
  addRealPublicSightlines3D(scene,cfg);
  addRealPublicOpenPortals3D(scene,cfg,roomH);
  addRealPublicWindow3D(scene,cfg);
  addRealPublicEntry3D(scene,cfg);
  addRealPublicLiving3D(scene,cfg);
  addRealPublicDining3D(scene,cfg);
  addRealPublicStudy3D(scene,cfg);
  addRealPublicBedroomGlimpse3D(scene,cfg);
  addRealPublicBalcony3D(scene,cfg);
  addRealPublicBalanceDecor3D(scene,cfg);
  addRealPublicAreaLabels3D(scene,cfg);
  addRealPublicCeilingGuides3D(scene,cfg,roomH);
  addSecurityCameras3D(scene, cfg);
  addDigitalTwinGrid3D(scene, cfg);
}

function addDigitalTwinGrid3D(scene, cfg){
  /* 数字孪生地板网格: 极淡的青色网格叠加 */
  var gridMat = new THREE.MeshBasicMaterial({color:0x4a8a7a, transparent:true, opacity:.025, side:THREE.DoubleSide, depthWrite:false});
  var gridSize = .5;
  var lines = [];
  for(var x = 0; x <= cfg.w; x += gridSize){
    lines.push(x, 0, 0, x, 0, cfg.d);
  }
  for(var z = 0; z <= cfg.d; z += gridSize){
    lines.push(0, 0, z, cfg.w, 0, z);
  }
  var gridGeom = new THREE.BufferGeometry();
  gridGeom.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
  var grid = new THREE.LineSegments(gridGeom, new THREE.LineBasicMaterial({color:0x4a8a7a, transparent:true, opacity:.035, depthWrite:false}));
  grid.position.y = .03;
  grid.name = 'digital-twin-grid';
  grid.renderOrder = 3;
  scene.add(grid);
  /* 中心脉冲圆环 */
  var pulseMat = new THREE.MeshBasicMaterial({color:0x4a8a7a, transparent:true, opacity:0, side:THREE.DoubleSide, depthWrite:false});
  var pulse = new THREE.Mesh(new THREE.RingGeometry(.5, .55, 48), pulseMat);
  pulse.rotation.x = -Math.PI/2;
  pulse.position.set(cfg.w/2, .035, cfg.d/2);
  pulse.name = 'digital-twin-pulse';
  pulse.renderOrder = 4;
  pulse.userData = {digitalPulse:true};
  scene.add(pulse);
}

function addRealPublicFloorGrid3D(scene,cfg){
  const lightOn = state.lightOn !== false;
  const depth = lightOn ? 0x755538 : 0x30251f;
  const cross = lightOn ? 0x684a31 : 0x2a211c;
  for(let x=.62;x<cfg.w;x+=.62) box3D(scene,x,.012,cfg.d/2,.004,.006,cfg.d,depth,'real-public-floor-depth-joint',{rough:.94,castShadow:false});
  for(let z=.84;z<cfg.d;z+=.84) box3D(scene,cfg.w/2,.014,z,cfg.w,.004,.006,cross,'real-public-floor-width-joint',{rough:.94,castShadow:false});
  for(let x=.31;x<cfg.w;x+=.62){
    const shade = (Math.floor(x*10) % 3 === 0) ? 0x9b6b45 : 0x855a38;
    const plank = box3D(scene,x,.016,cfg.d/2,.014,.003,cfg.d*.94,lightOn ? shade : 0x352820,'real-public-floor-subtle-plank',{rough:.96,castShadow:false,receiveShadow:false});
    plank.material.transparent = true;
    plank.material.opacity = lightOn ? .1 : .055;
  }
}

function addRealPublicZoneSurfaces3D(scene,cfg){
  const on = state.lightOn !== false;
  const zones = [
    {name:'real-zone-entry', x:cfg.entryOrigin.x+1.0, z:cfg.entryOrigin.z+.94, w:1.82, d:1.58, color:0xd0b789, opacity:on ? .022 : .016},
    {name:'real-zone-living', x:cfg.livingOrigin.x+1.95, z:cfg.livingOrigin.z+2.35, w:3.55, d:3.72, color:0xc2c8bd, opacity:on ? .014 : .01},
    {name:'real-zone-study', x:cfg.studyOrigin.x+1.28, z:cfg.studyOrigin.z+1.28, w:2.26, d:2.42, color:0xaec3b5, opacity:on ? .018 : .012},
    {name:'real-zone-dining', x:cfg.diningOrigin.x+.96, z:cfg.diningOrigin.z+.82, w:2.32, d:1.9, color:0xd1b46f, opacity:on ? .016 : .011},
    {name:'real-zone-bedroom-door', x:cfg.bedroomOrigin.x+.62, z:cfg.bedroomOrigin.z+1.32, w:1.28, d:2.28, color:0xcab8c9, opacity:on ? .016 : .011},
    {name:'real-zone-balcony', x:cfg.balcony.x+cfg.balcony.w/2, z:cfg.balcony.z+cfg.balcony.d/2, w:cfg.balcony.w, d:cfg.balcony.d, color:0xb8c6be, opacity:on ? .026 : .014}
  ];
  zones.forEach(zone=>{
    const mat = new THREE.MeshBasicMaterial({color:zone.color, transparent:true, opacity:zone.opacity, side:THREE.DoubleSide, depthWrite:false});
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(zone.w,zone.d),mat);
    plane.position.set(zone.x,.018,zone.z);
    plane.rotation.x = -Math.PI/2;
    plane.name = zone.name;
    plane.renderOrder = 5;
    scene.add(plane);
  });
}

function addRealPublicSightlines3D(scene,cfg){
  const color = state.lightOn !== false ? 0xc39a4f : 0x7a6541;
  const alpha = state.lightOn !== false ? .032 : .022;
  const path = [
    [cfg.entryOrigin.x+1.22,cfg.entryOrigin.z+1.18],
    [cfg.livingOrigin.x+.86,cfg.livingOrigin.z+2.2],
    [cfg.livingOrigin.x+1.92,cfg.livingOrigin.z+3.18],
    [cfg.window.x+cfg.window.w*.5,cfg.window.z-.35]
  ];
  for(let i=0;i<path.length-1;i++){
    addFloorGuideSegment3D(scene,path[i][0],path[i][1],path[i+1][0],path[i+1][1],color,`real-main-sightline-${i}`,alpha,.034);
  }
  addFloorGuideSegment3D(scene,cfg.livingOrigin.x+1.55,cfg.livingOrigin.z+2.6,cfg.studyOrigin.x+.38,cfg.studyOrigin.z+1.28,0x2f8075,'real-study-sightline',alpha*.72,.028);
  addFloorGuideSegment3D(scene,cfg.livingOrigin.x+2.42,cfg.livingOrigin.z+2.76,cfg.bedroomOrigin.x+.42,cfg.bedroomOrigin.z+1.28,0x6f568d,'real-bedroom-corridor-sightline',alpha*.64,.028);
}

function addFloorGuideSegment3D(scene,x1,z1,x2,z2,color,name,opacity=.24,width=.045){
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.sqrt(dx*dx + dz*dz);
  if(len < .05) return;
  const mat = new THREE.MeshBasicMaterial({color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false});
  const guide = new THREE.Mesh(new THREE.BoxGeometry(len,.012,width),mat);
  guide.position.set((x1+x2)/2,.035,(z1+z2)/2);
  guide.rotation.y = -Math.atan2(dz,dx);
  guide.name = name;
  guide.renderOrder = 7;
  scene.add(guide);
}

function addRealPublicBoundaries3D(scene,cfg,wallColor,sideColor,roomH){
  addRealPublicWallShell3D(scene,cfg,wallColor,sideColor,roomH);
  addRealPublicBaseboards3D(scene,cfg);
  addRealPublicCeilingPlane3D(scene,cfg,roomH);
}

function addRealPublicCeilingPlane3D(scene,cfg,roomH){
  const lightOn = state.lightOn !== false;
  const ceiling = lightOn ? 0xeee5d8 : 0x5d554c;
  const band = lightOn ? 0xe0d3c2 : 0x4b4239;
  const cove = lightOn ? 0xf0c98c : 0x6b5a45;
  planeMat3D(scene,cfg.w/2,roomH,cfg.d/2,cfg.w,cfg.d,ceiling,Math.PI/2,0,'real-public-ceiling-main',{material:mat3D(ceiling,.92,{emissive:ceiling,emissiveIntensity:lightOn ? .012 : .008}),castShadow:false,receiveShadow:false});
  box3D(scene,cfg.w/2,roomH-.032,.14,cfg.w,.064,.28,band,'real-public-ceiling-front-band',{rough:.88,castShadow:false,receiveShadow:false});
  box3D(scene,cfg.w/2,roomH-.032,cfg.d-.14,cfg.w,.064,.28,band,'real-public-ceiling-window-band',{rough:.88,castShadow:false,receiveShadow:false});
  box3D(scene,.14,roomH-.032,cfg.d/2,.28,.064,cfg.d,band,'real-public-ceiling-left-band',{rough:.88,castShadow:false,receiveShadow:false});
  box3D(scene,cfg.w-.14,roomH-.032,cfg.d/2,.28,.064,cfg.d,band,'real-public-ceiling-right-band',{rough:.88,castShadow:false,receiveShadow:false});
  const glowMat = new THREE.MeshBasicMaterial({color:cove, transparent:true, opacity:lightOn ? .075 : .035, side:THREE.DoubleSide, depthWrite:false});
  planeMat3D(scene,cfg.w/2,roomH-.095,.36,cfg.w-.72,.055,cove,Math.PI/2,0,'real-public-ceiling-cove-front',{material:glowMat,castShadow:false,receiveShadow:false,renderOrder:4});
  planeMat3D(scene,cfg.w/2,roomH-.095,cfg.d-.36,cfg.w-.72,.055,cove,Math.PI/2,0,'real-public-ceiling-cove-window',{material:glowMat,castShadow:false,receiveShadow:false,renderOrder:4});
  planeMat3D(scene,.36,roomH-.095,cfg.d/2,.055,cfg.d-.72,cove,Math.PI/2,0,'real-public-ceiling-cove-left',{material:glowMat,castShadow:false,receiveShadow:false,renderOrder:4});
  planeMat3D(scene,cfg.w-.36,roomH-.095,cfg.d/2,.055,cfg.d-.72,cove,Math.PI/2,0,'real-public-ceiling-cove-right',{material:glowMat,castShadow:false,receiveShadow:false,renderOrder:4});
  addCeilingDownlight3D(scene,cfg.livingOrigin.x+1.0,roomH-.06,cfg.livingOrigin.z+1.35);
  addCeilingDownlight3D(scene,cfg.livingOrigin.x+2.8,roomH-.06,cfg.livingOrigin.z+2.85);
  addCeilingDownlight3D(scene,cfg.diningOrigin.x+.9,roomH-.06,cfg.diningOrigin.z+.82);
  addCeilingDownlight3D(scene,cfg.studyOrigin.x+1.0,roomH-.06,cfg.studyOrigin.z+.95);
}

function addRealPublicWallShell3D(scene,cfg,wallColor,sideColor,roomH){
  const lightOn = state.lightOn !== false;
  const north = shade3D(wallColor,8);
  const south = shade3D(wallColor,-2);
  const east = shade3D(sideColor,12);
  const west = shade3D(sideColor,-2);
  const trim = lightOn ? 0xb89466 : 0x5c4937;
  const wainscot = lightOn ? 0xd8cbb9 : 0x51463b;
  const wallMat = color=>mat3D(color,.94,{emissive:color,emissiveIntensity:lightOn ? .028 : .014});
  planeMat3D(scene,cfg.w/2,roomH/2,.02,cfg.w,roomH,north,0,Math.PI,'real-public-north-wall',{material:wallMat(north),castShadow:false,receiveShadow:false});
  planeMat3D(scene,.02,roomH/2,cfg.d/2,cfg.d,roomH,west,0,Math.PI/2,'real-public-west-wall',{material:wallMat(west),castShadow:false,receiveShadow:false});
  addRealPublicEastWallAroundDoor3D(scene,cfg,east,roomH,wallMat(east));
  addRealPublicSouthWallAroundWindow3D(scene,cfg,south,roomH);
  box3D(scene,cfg.w/2,.035,.05,cfg.w,.07,.1,trim,'real-public-entry-threshold',{rough:.76});
  box3D(scene,cfg.w/2,.42,.032,cfg.w*.86,.36,.024,wainscot,'real-public-north-low-wall-panel',{rough:.9,transparent:true,opacity:lightOn ? .18 : .12,castShadow:false});
  box3D(scene,.035,.42,cfg.d/2,.024,.36,cfg.d*.86,wainscot,'real-public-west-low-wall-panel',{rough:.9,transparent:true,opacity:lightOn ? .14 : .1,castShadow:false});
  addRealPublicEastWainscotAroundDoor3D(scene,cfg,wainscot,lightOn);
  addRealPublicWallDecor3D(scene,cfg,roomH);
}

function rightLivingDoorSpec3D(cfg){
  return {x:cfg.w-.035, z:cfg.livingOrigin.z+3.08, w:.06, d:1.46, h:2.1};
}

function addRealPublicEastWallAroundDoor3D(scene,cfg,color,roomH,material){
  const door = rightLivingDoorSpec3D(cfg);
  const z1 = clamp(door.z - door.d/2,0,cfg.d);
  const z2 = clamp(door.z + door.d/2,0,cfg.d);
  const addPanel = (a,b,y1,y2,name,mat=material)=>{
    const span = b - a;
    const h = y2 - y1;
    if(span <= .025 || h <= .025) return;
    planeMat3D(scene,cfg.w-.02,y1+h/2,a+span/2,span,h,color,0,-Math.PI/2,name,{material:mat,castShadow:false,receiveShadow:false});
  };
  addPanel(0,z1,0,roomH,'real-public-east-wall-before-door');
  addPanel(z2,cfg.d,0,roomH,'real-public-east-wall-after-door');
  addPanel(z1,z2,door.h,roomH,'real-public-east-wall-above-door');
}

function addRealPublicEastWainscotAroundDoor3D(scene,cfg,color,lightOn){
  const door = rightLivingDoorSpec3D(cfg);
  const z1 = clamp(door.z - door.d/2 -.05,0,cfg.d);
  const z2 = clamp(door.z + door.d/2 +.05,0,cfg.d);
  const addRun = (a,b,name)=>{
    if(b-a <= .08) return;
    box3D(scene,cfg.w-.035,.42,(a+b)/2,.024,.36,b-a,color,name,{rough:.9,transparent:true,opacity:lightOn ? .14 : .1,castShadow:false});
  };
  addRun(.08,z1,'real-public-east-low-wall-panel-before-door');
  addRun(z2,cfg.d-.08,'real-public-east-low-wall-panel-after-door');
}

function addRealPublicSouthWallAroundWindow3D(scene,cfg,color,roomH){
  const win = cfg.window;
  const lightOn = state.lightOn !== false;
  const southMat = colorValue=>mat3D(colorValue,.92,{emissive:colorValue,emissiveIntensity:lightOn ? .038 : .018});
  const x1 = clamp(win.x,0,cfg.w);
  const x2 = clamp(win.x + win.w,0,cfg.w);
  const y1 = clamp(win.sill,0,roomH);
  const y2 = clamp(win.sill + win.h,0,roomH);
  addWallPanelSouth3D(scene,0,x1,0,roomH,win.z,color,'real-public-south-wall-left',{material:southMat(color),castShadow:false,receiveShadow:false});
  addWallPanelSouth3D(scene,x2,cfg.w,0,roomH,win.z,color,'real-public-south-wall-right',{material:southMat(color),castShadow:false,receiveShadow:false});
  if(!win.floorToCeiling && y1 > .03){
    addWallPanelSouth3D(scene,x1,x2,0,y1,win.z,shade3D(color,-4),'real-public-south-wall-under-window',{material:southMat(shade3D(color,-4)),castShadow:false,receiveShadow:false});
  }
  addWallPanelSouth3D(scene,x1,x2,y2,roomH,win.z,shade3D(color,5),'real-public-south-wall-over-window',{material:southMat(shade3D(color,5)),castShadow:false,receiveShadow:false});
  addSouthOpeningReturns3D(scene,cfg,win,color,roomH,{opacity:.5});
}

function addRealPublicBaseboards3D(scene,cfg){
  const lightOn = state.lightOn !== false;
  const color = lightOn ? 0x9d734f : 0x4e3c2f;
  const h = mm3D(REAL_HOME_SPEC.skirting);
  box3D(scene,cfg.w/2,h/2,.035,cfg.w,h,.05,color,'real-public-north-baseboard',{rough:.78});
  box3D(scene,.035,h/2,cfg.d/2,.05,h,cfg.d,color,'real-public-west-baseboard',{rough:.78});
  addRealPublicEastBaseboardAroundDoor3D(scene,cfg,color,h);
  box3D(scene,cfg.w/2,h/2,cfg.d-.035,cfg.w,h,.05,color,'real-public-south-baseboard',{rough:.78});
}

function addRealPublicEastBaseboardAroundDoor3D(scene,cfg,color,h){
  const door = rightLivingDoorSpec3D(cfg);
  const z1 = clamp(door.z - door.d/2 -.04,0,cfg.d);
  const z2 = clamp(door.z + door.d/2 +.04,0,cfg.d);
  const addRun = (a,b,name)=>{
    if(b-a <= .08) return;
    box3D(scene,cfg.w-.035,h/2,(a+b)/2,.05,h,b-a,color,name,{rough:.78});
  };
  addRun(0,z1,'real-public-east-baseboard-before-door');
  addRun(z2,cfg.d,'real-public-east-baseboard-after-door');
}

function addRealPublicWallDecor3D(scene,cfg,roomH){
  return;
  const lightOn = state.lightOn !== false;
  const frame = lightOn ? 0x8f7458 : 0x46372c;
  const art = lightOn ? 0xe6d9c8 : 0x5d554e;
  box3D(scene,cfg.livingOrigin.x+.92,1.48,.045,.78,.52,.03,frame,'real-public-north-art-frame-a',{rough:.78,castShadow:false});
  planeMat3D(scene,cfg.livingOrigin.x+.92,1.48,.063,.66,.4,art,0,Math.PI,'real-public-north-art-a',{rough:.9,castShadow:false});
  box3D(scene,cfg.studyOrigin.x+.98,1.46,.045,.64,.46,.03,frame,'real-public-north-art-frame-b',{rough:.78,castShadow:false});
  planeMat3D(scene,cfg.studyOrigin.x+.98,1.46,.063,.52,.34,lightOn ? 0xc7d4ca : 0x4d5b54,0,Math.PI,'real-public-north-art-b',{rough:.9,castShadow:false});
  box3D(scene,cfg.w-.055,1.36,cfg.diningOrigin.z-.92,.03,.54,.72,frame,'real-public-east-dining-art-frame',{rough:.78,castShadow:false});
  planeMat3D(scene,cfg.w-.073,1.36,cfg.diningOrigin.z-.92,.58,.4,lightOn ? 0xe8dfcf : 0x544c44,0,-Math.PI/2,'real-public-east-dining-art',{rough:.9,castShadow:false});
  box3D(scene,.055,1.32,cfg.entryOrigin.z+1.06,.03,.5,.58,frame,'real-public-west-entry-mirror-frame',{rough:.62,metalness:.03,castShadow:false});
  planeMat3D(scene,.073,1.32,cfg.entryOrigin.z+1.06,.44,.48,lightOn ? 0xc4d2d0 : 0x465250,0,Math.PI/2,'real-public-west-entry-mirror',{rough:.42,metalness:.02,castShadow:false});
  box3D(scene,cfg.livingOrigin.x+2.25,1.34,.046,.74,.44,.028,frame,'real-public-north-living-wide-frame',{rough:.78,castShadow:false});
  planeMat3D(scene,cfg.livingOrigin.x+2.25,1.34,.064,.62,.32,lightOn ? 0xd9cdbf : 0x4f4840,0,Math.PI,'real-public-north-living-wide-art',{rough:.9,castShadow:false});
  box3D(scene,.054,1.42,cfg.livingOrigin.z+2.88,.026,.58,.62,frame,'real-public-west-living-frame',{rough:.78,castShadow:false});
  planeMat3D(scene,.073,1.42,cfg.livingOrigin.z+2.88,.5,.42,lightOn ? 0xc9d7c4 : 0x46534a,0,Math.PI/2,'real-public-west-living-art',{rough:.9,castShadow:false});
}

function addRealPublicBalanceDecor3D(scene,cfg){
  addWallSconce3D(scene,2.5,1.5,.03);
  addWallSconce3D(scene,7.5,1.5,.03);
  return;
  addNarrowWallShelf3D(scene,cfg.livingOrigin.x+1.14,.045,1.82,.68,'real-public-north-living-shelf',Math.PI);
  addNarrowWallShelf3D(scene,cfg.studyOrigin.x+.62,.045,1.72,.58,'real-public-north-study-shelf',Math.PI);
  roundedBox3D(scene,cfg.entryOrigin.x+1.86,.24,cfg.entryOrigin.z+1.7,.42,.38,.3,0xc7a06c,'real-public-entry-low-stool',.06,{rough:.86});
  addRealGroundedStorageBench3D(scene,cfg.studyOrigin.x+1.98,cfg.studyOrigin.z+1.82,.72,.3,.32,'real-public-study-low-storage-bench');
  /* 精简: 走廊壁灯(保留2个) */
  addWallSconce3D(scene,2.5,1.5,.03);
  addWallSconce3D(scene,7.5,1.5,.03);
  /* 精简: 绿植(保留入口地面植物，客厅角植物移到不挡路的位置) */
  addCompactFloorPlant3D(scene,cfg.entryOrigin.x+2.4,cfg.entryOrigin.z+.4,.7,'real-public-entry-floor-plant');
  addCompactFloorPlant3D(scene,cfg.livingOrigin.x+3.8,cfg.livingOrigin.z+3.5,.85,'real-public-living-corner-plant');
}

function addRealGroundedStorageBench3D(scene,x,z,w,d,h,name){
  addContactShadow3D(scene,x,z,w*.92,d*.86,.12);
  roundedBox3D(scene,x,h/2,z,w,h,d,0xb4895c,name,.045,{rough:.82});
  box3D(scene,x,h*.58,z-d/2-.012,w*.74,.018,.022,0x6f4d35,`${name}-drawer-line`,{rough:.72,castShadow:false});
  [[-.42,-.34],[.42,-.34],[-.42,.34],[.42,.34]].forEach(([px,pz])=>box3D(scene,x+px*w,.045,z+pz*d,.03,.09,.03,0x4d382c,`${name}-short-leg`,{rough:.66}));
}

function addCompactFloorPlant3D(scene,x,z,scale,name){
  addContactShadow3D(scene,x,z,.34*scale,.34*scale,.08);
  const potColor = state.lightOn !== false ? 0x9b7552 : 0x4d3c31;
  const rimColor = state.lightOn !== false ? 0xc49b6a : 0x655044;
  cylinder3D(scene,x,.1*scale,z,.13*scale,.2*scale,potColor,`${name}-ceramic-pot`,24,{rough:.86});
  cylinder3D(scene,x,.22*scale,z,.15*scale,.045*scale,rimColor,`${name}-pot-rim`,24,{rough:.8});
  cylinder3D(scene,x,.245*scale,z,.115*scale,.025*scale,0x4b3b2c,`${name}-soil`,24,{rough:.96});
  const stemMat = mat3D(0x4d6f3a,.78);
  [[0,0,.36],[-.055,.035,.28],[.06,-.02,.3]].forEach(([dx,dz,h],i)=>{
    const stem = cylinder3D(scene,x+dx*scale,.27*scale+h*scale/2,z+dz*scale,.008*scale,h*scale,0x4d6f3a,`${name}-thin-stem-${i}`,10,{material:stemMat,rough:.78});
    stem.rotation.z = (i-1)*.12;
  });
  const leafMat = mat3D(0x3f7440,.9,{side:THREE.FrontSide});
  [
    [-.12,.05,.09,.035,.56],
    [.1,.035,.085,.034,-.5],
    [-.055,-.08,.075,.03,.9],
    [.06,-.075,.072,.03,-.85],
    [0,.02,.082,.032,.12]
  ].forEach(([dx,dz,w,d,rot],i)=>{
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(.055*scale,16,12), leafMat);
    leaf.scale.set(w/.055,d/.055,.4);
    leaf.position.set(x+dx*scale,.57*scale+i*.018,z+dz*scale);
    leaf.rotation.set(.12,rot,i*.18);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    scene.add(leaf);
  });
}

function addNarrowWallShelf3D(scene,x,z,y,w,name,rotY=0){
  box3D(scene,x,y,z,w,.04,.12,0xb58b55,`${name}-board`,{rough:.74,castShadow:false,rotY});
  [x-w*.26,x+w*.2].forEach((px,i)=>{
    box3D(scene,px,y+.09,z+.018,.08,.14,.06,[0x8a6443,0xcfa067][i],`${name}-small-object-${i}`,{rough:.86,castShadow:false,rotY});
  });
}

function addRealPublicOpenPortals3D(scene,cfg,roomH){
  const portalColor = state.lightOn !== false ? 0xc5a06f : 0x66513c;
  addOpenPortalFrame3D(scene,cfg.entryOrigin.x+1.82,cfg.entryOrigin.z+1.08,.06,1.42,portalColor,'real-entry-living-open-portal',true,.18);
  addOpenPortalFrame3D(scene,cfg.studyOrigin.x-.12,cfg.studyOrigin.z+1.24,.06,1.68,portalColor,'real-study-open-portal',true,.17);
  addRightLivingDoor3D(scene,cfg,roomH,portalColor);
  addOpenPortalFrame3D(scene,cfg.bedroomOrigin.x+.12,cfg.bedroomOrigin.z+1.32,.06,1.54,portalColor,'real-bedroom-door-open-portal',true,.17);
}

function addRightLivingDoor3D(scene,cfg,roomH,portalColor){
  const lightOn = state.lightOn !== false;
  const open = state.rightDoorOpen === true;
  const spec = rightLivingDoorSpec3D(cfg);
  const x = spec.x;
  const z = spec.z;
  const w = spec.w;
  const d = spec.d;
  if(open) addRightRoomBeyond3D(scene,x,z,d,lightOn);
  addRightWallDoorSurface3D(scene,x,z,d,lightOn,open);
  addOpenPortalFrame3D(scene,x,z,w,d,portalColor,'real-right-wall-clickable-door-frame',true,.78);
  addDoorToggleHit3D(scene,x-.08,1.16,z,d+1.0,2.35,'real-right-wall-door-toggle-hit',{rotY:Math.PI/2});
  addDoorToggleHit3D(scene,x-.48,.28,z,d+1.12,.42,'real-right-wall-door-floor-toggle-hit',{rotX:-Math.PI/2});
  const doorColor = lightOn ? 0x9d7049 : 0x514039;
  const doorW = d * .88;
  const doorH = 1.96;
  const doorT = .06;
  const hingeZ = z - d/2 + .07;
  const angle = open ? -1.04 : 0;
  const leafX = open ? x-.06 + Math.sin(angle) * doorW/2 : x-.06;
  const leafZ = open ? hingeZ + Math.cos(angle) * doorW/2 : hingeZ + doorW/2;
  const slab = box3D(scene,leafX,doorH/2+.06,leafZ,doorT,doorH,doorW,doorColor,'real-right-wall-clickable-door-leaf',{rough:.78,rotY:angle,castShadow:true,renderOrder:21});
  slab.userData = {rightDoorToggle:true};
  const inset = box3D(scene,leafX-.008,1.1,leafZ,doorT*.34,doorH*.58,doorW*.62,lightOn ? 0xb58a61 : 0x604b41,'real-right-wall-door-leaf-inset',{rough:.84,rotY:angle,castShadow:false,renderOrder:22});
  inset.userData = {rightDoorToggle:true};
  const handleT = .83;
  const handleX = open ? x-.06 + Math.sin(angle) * doorW * handleT - Math.cos(angle)*.04 : x-.105;
  const handleZ = open ? hingeZ + Math.cos(angle) * doorW * handleT + Math.sin(angle)*.04 : z + d*.24;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.045,18,12), mat3D(0xd2ae76,.42,{metalness:.18}));
  knob.position.set(handleX,1.04,handleZ);
  knob.name = 'real-right-wall-door-visible-knob';
  knob.userData = {rightDoorToggle:true};
  knob.renderOrder = 23;
  scene.add(knob);
  webglTour?.doorObjects?.push(slab, inset, knob);
  const cueMat = new THREE.MeshBasicMaterial({color:open ? 0x1a5c52 : 0x6b4c2f, transparent:true, opacity:lightOn ? .2 : .14, side:THREE.DoubleSide, depthWrite:false});
  const cue = new THREE.Mesh(new THREE.RingGeometry(.13,.2,32),cueMat);
  cue.position.set(x-.48,.18,z);
  cue.rotation.x = -Math.PI/2;
  cue.name = 'real-right-door-floor-click-cue';
  cue.userData = {rightDoorToggle:true};
  scene.add(cue);
  webglTour?.doorObjects?.push(cue);
}

function addRightWallDoorSurface3D(scene,x,z,d,lightOn,open){
  const surfaceX = x - .032;
  addRightWallDoorReadableFace3D(scene,surfaceX,z,d,lightOn,open);
  if(!open){
    const shadowColor = lightOn ? 0x8f6646 : 0x473831;
    const recess = box3D(scene,surfaceX+.012,1.05,z,.035,2.08,d*.92,shadowColor,'real-right-wall-door-visible-opening',{rough:.88,castShadow:false,receiveShadow:true,renderOrder:17});
    recess.userData = {rightDoorToggle:true};
    webglTour?.doorObjects?.push(recess);
  }
  const trimColor = lightOn ? 0x8d623f : 0x67513c;
  [
    box3D(scene,surfaceX-.028,1.08,z-d*.5,.064,2.18,.07,trimColor,'real-right-wall-door-jamb-near',{rough:.72,castShadow:false,renderOrder:20}),
    box3D(scene,surfaceX-.028,1.08,z+d*.5,.064,2.18,.07,trimColor,'real-right-wall-door-jamb-far',{rough:.72,castShadow:false,renderOrder:20}),
    box3D(scene,surfaceX-.028,.08,z,.064,.1,d+.12,trimColor,'real-right-wall-door-wood-threshold',{rough:.72,castShadow:false,renderOrder:20}),
    box3D(scene,surfaceX-.028,2.17,z,.064,.1,d+.12,trimColor,'real-right-wall-door-header',{rough:.72,castShadow:false,renderOrder:20})
  ].forEach(mesh=>{
    mesh.userData = {rightDoorToggle:true};
    webglTour?.doorObjects?.push(mesh);
  });
  if(open){
    const revealMat = new THREE.MeshBasicMaterial({color:lightOn ? 0xffd69a : 0x6f8fb4, transparent:true, opacity:lightOn ? .06 : .045, side:THREE.DoubleSide, depthWrite:false});
    const reveal = new THREE.Mesh(new THREE.PlaneGeometry(d*.7,1.62),revealMat);
    reveal.position.set(surfaceX-.018,1.04,z);
    reveal.rotation.y = -Math.PI/2;
    reveal.name = 'real-right-wall-door-soft-interior-light';
    reveal.renderOrder = 18;
    reveal.userData = {rightDoorToggle:true};
    scene.add(reveal);
    webglTour?.doorObjects?.push(reveal);
  }
}

function addRightWallDoorReadableFace3D(scene,surfaceX,z,d,lightOn,open){
  const faceMat = new THREE.MeshBasicMaterial({
    color:open ? (lightOn ? 0xbfd1cd : 0x263747) : (lightOn ? 0x8f6646 : 0x473831),
    transparent:true,
    opacity:open ? (lightOn ? .36 : .34) : .76,
    side:THREE.DoubleSide,
    depthWrite:false
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(d*.82,1.94),faceMat);
  face.position.set(surfaceX-.055,1.05,z);
  face.rotation.y = -Math.PI/2;
  face.name = open ? 'real-right-wall-door-open-readable-depth' : 'real-right-wall-door-closed-readable-panel';
  face.renderOrder = 18;
  face.userData = {rightDoorToggle:true};
  scene.add(face);
  webglTour?.doorObjects?.push(face);
  const dark = open ? (lightOn ? 0x36514f : 0x151f2b) : (lightOn ? 0x6b4730 : 0x271f1b);
  [
    box3D(scene,surfaceX-.075,1.05,z-d*.41,.05,1.96,.035,dark,'real-right-door-readable-inner-edge-near',{rough:.76,castShadow:false,renderOrder:19}),
    box3D(scene,surfaceX-.075,1.05,z+d*.41,.05,1.96,.035,dark,'real-right-door-readable-inner-edge-far',{rough:.76,castShadow:false,renderOrder:19}),
    box3D(scene,surfaceX-.075,2.02,z,.05,.05,d*.84,dark,'real-right-door-readable-inner-head',{rough:.76,castShadow:false,renderOrder:19})
  ].forEach(mesh=>{
    mesh.userData = {rightDoorToggle:true};
    webglTour?.doorObjects?.push(mesh);
  });
  const threshold = new THREE.Mesh(
    new THREE.PlaneGeometry(.72,d*.88),
    new THREE.MeshBasicMaterial({color:lightOn ? 0xb89062 : 0x514036, transparent:true, opacity:open ? .44 : .3, side:THREE.DoubleSide, depthWrite:false})
  );
  threshold.position.set(surfaceX-.44,.026,z);
  threshold.rotation.x = -Math.PI/2;
  threshold.name = 'real-right-door-readable-floor-threshold';
  threshold.renderOrder = 18;
  threshold.userData = {rightDoorToggle:true};
  scene.add(threshold);
  webglTour?.doorObjects?.push(threshold);
}

function addRightRoomBeyond3D(scene,x,z,w,lightOn){
  const floorMat = mat3D(lightOn ? 0xcbd6cf : 0x2f3336,.9);
  const wallMat = mat3D(lightOn ? 0xe2ece8 : 0x343943,.9);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w*1.05,1.95),wallMat);
  back.position.set(x+.9,1.04,z);
  back.rotation.y = -Math.PI/2;
  back.name = 'real-right-room-beyond-tile-wall';
  back.receiveShadow = true;
  scene.add(back);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1.55,w*1.08),floorMat);
  floor.position.set(x+.56,.018,z);
  floor.rotation.x = -Math.PI/2;
  floor.name = 'real-right-room-beyond-tile-floor';
  floor.receiveShadow = true;
  scene.add(floor);
  const line = lightOn ? 0xaebeba : 0x4b555c;
  [-.32,0,.32].forEach((dz,i)=>box3D(scene,x+.895,.86+i*.28,z+dz,.012,.008,w*.24,line,'real-right-room-tile-joint-horizontal',{rough:.9,castShadow:false}));
  [-.32,0,.32].forEach(dz=>box3D(scene,x+.895,1.34,z+dz,.012,.94,.006,line,'real-right-room-tile-joint-vertical',{rough:.9,castShadow:false}));
  roundedBox3D(scene,x+.48,.42,z+.28,.46,.62,.32,lightOn ? 0xf5f6f2 : 0x596164,'real-right-room-vanity-glimpse',.045,{rough:.74});
  roundedBox3D(scene,x+.48,.76,z+.1,.34,.07,.2,lightOn ? 0xd8e5e2 : 0x758285,'real-right-room-basin-glimpse',.035,{rough:.46});
  box3D(scene,x+.73,1.36,z+.22,.035,.58,.38,lightOn ? 0xbdd0cf : 0x52606a,'real-right-room-mirror-glimpse',{rough:.34,metalness:.02,transparent:true,opacity:lightOn ? .72 : .42,castShadow:false});
  const lamp = new THREE.PointLight(lightOn ? 0xffd7a0 : 0x728cb0, lightOn ? .07 : .04,2.2);
  lamp.position.set(x+.44,1.76,z+.05);
  scene.add(lamp);
}

function addOpenHeader3D(scene,x,y,z,w,name){
  const color = 0xb99064;
  box3D(scene,x,y,z,w,.06,.055,color,name,{rough:.74});
}

function addOpenPortalFrame3D(scene,x,z,w,d,color,name,vertical=false,opacity=.92){
  const mat = mat3D(color,.72,{transparent:opacity < 1, opacity});
  if(vertical){
    box3D(scene,x,.045,z,w,.09,d,color,`${name}-floor-threshold`,{material:mat,castShadow:false});
    box3D(scene,x,1.12,z-d/2,w,2.18,.055,color,`${name}-near-post`,{material:mat,castShadow:false});
    box3D(scene,x,1.12,z+d/2,w,2.18,.055,color,`${name}-far-post`,{material:mat,castShadow:false});
    box3D(scene,x,2.18,z,w,.065,d,color,`${name}-top-line`,{material:mat,castShadow:false});
  }else{
    box3D(scene,x,.045,z,w,.09,d,color,`${name}-floor-threshold`,{material:mat,castShadow:false});
    box3D(scene,x-w/2,1.12,z,.055,2.18,d,color,`${name}-left-post`,{material:mat,castShadow:false});
    box3D(scene,x+w/2,1.12,z,.055,2.18,d,color,`${name}-right-post`,{material:mat,castShadow:false});
    box3D(scene,x,2.18,z,w,.065,d,color,`${name}-top-line`,{material:mat,castShadow:false});
  }
}

function addRealPublicSouthOpening3D(scene,cfg,color,roomH){
  const win = cfg.window;
  box3D(scene,win.x+win.w/2,.025,win.z-.035,win.w+.18,.05,.08,0xd7c095,'real-public-window-low-track',{rough:.72,castShadow:false});
}

function addRealPublicWindow3D(scene,cfg){
  const win = cfg.window;
  const open = state.windowOpen === true;
  const balconyFocus = cfg.nodeId === 'balcony-node';
  if(balconyFocus){
    addFocusedBalconyWindowForeground3D(scene,cfg,win);
  }else{
    if(open){
      addOpenSouthWindowPanels3D(scene,win,'real-public-south');
    }else{
      addClosedSouthWindowPanels3D(scene,win,'real-public-south');
    }
  }
  addWindowToggleHit3D(
    scene,
    win.x+win.w/2,
    balconyFocus ? (win.sill + win.h*.42) : (win.sill + win.h/2),
    win.z-.03,
    win.w,
    win.h,
    'real-public-window-toggle-hit',
    balconyFocus ? {hitW:win.w*.68, hitH:win.h*.74} : {}
  );
  if(!balconyFocus) addLargeSlidingDoorDetails3D(scene,cfg,win,{simple:true, open});
  if(!balconyFocus) addRealPublicWindowReveal3D(scene,cfg,win);
  if(open && !balconyFocus) {
    addOpenWindowAirPanel3D(scene,win,'real-public-south');
    addSubtleFloorDaylight3D(scene,cfg,win);
    addWindowLightBands3D(scene,cfg,win);
    addRealInteriorSunVolume3D(scene,cfg,win);
  }
}

function addFocusedBalconyWindowForeground3D(scene,cfg,win){
  const lightOn = state.lightOn !== false;
  const open = state.windowOpen === true;
  const rail = lightOn ? 0xbfb3a4 : 0x625950;
  const deepRail = lightOn ? 0x776d62 : 0x38342f;
  const z = win.z - .07;
  const cx = win.x + win.w/2;
  const glassMat = new THREE.MeshBasicMaterial({
    color:lightOn ? 0xd8ece8 : 0x52666e,
    transparent:true,
    opacity:open ? (lightOn ? .034 : .07) : (lightOn ? .14 : .22),
    side:THREE.DoubleSide,
    depthWrite:false
  });
  if(open){
    const animate = state._windowToggleAnimating === true;
    const panelW = win.w * .12;
    addSlidingDoorPanel3D(scene,win,win.x+win.w*.065,z-.14,panelW,'real-balcony-focus-left-open-window-panel',{handle:'right',fromX:animate ? win.x+win.w*.34 : undefined,glassOpacity:lightOn ? .03 : .065,open:true});
    addSlidingDoorPanel3D(scene,win,win.x+win.w*.935,z-.14,panelW,'real-balcony-focus-right-open-window-panel',{handle:'left',fromX:animate ? win.x+win.w*.66 : undefined,glassOpacity:lightOn ? .03 : .065,open:true});
    addOpenWindowGapFrame3D(scene,win,'real-balcony-focus');
    addOpenWindowAirPanel3D(scene,win,'real-balcony-focus');
    addWindowBreeze3D(scene,cfg,win);
  }else{
    const animate = state._windowToggleAnimating === true && state._windowToggleDirection === 'closing';
    const lowerPane = new THREE.Mesh(new THREE.PlaneGeometry(win.w*.88,win.h*.92),glassMat);
    lowerPane.position.set(cx,win.sill+win.h*.47,z-.018);
    lowerPane.name = 'real-balcony-focus-floor-to-ceiling-glass';
    lowerPane.renderOrder = 15;
    scene.add(lowerPane);
    addSlidingDoorPanel3D(scene,win,win.x+win.w*.34,z-.032,win.w*.32,'real-balcony-focus-left-closed-window-panel',{handle:'right',fromX:animate ? win.x+win.w*.065 : undefined,glassOpacity:lightOn ? .105 : .18});
    addSlidingDoorPanel3D(scene,win,win.x+win.w*.66,z-.038,win.w*.32,'real-balcony-focus-right-closed-window-panel',{handle:'left',fromX:animate ? win.x+win.w*.935 : undefined,glassOpacity:lightOn ? .105 : .18});
  }
  box3D(scene,cx,win.sill+.02,z,win.w+.16,.04,.07,rail,'real-balcony-focus-heavy-floor-track',{rough:.62,metalness:.04,castShadow:false,renderOrder:17});
  box3D(scene,cx,win.sill+.065,z-.04,win.w-.28,.012,.025,deepRail,'real-balcony-focus-inner-track-groove',{rough:.5,metalness:.08,castShadow:false,renderOrder:18});
  box3D(scene,cx,win.sill+.86,z-.01,win.w*.9,.022,.04,rail,'real-balcony-focus-low-cross-rail',{rough:.62,metalness:.035,castShadow:false,renderOrder:17});
  box3D(scene,cx,win.sill+win.h*.5,z-.012,.028,win.h*.92,.042,rail,'real-balcony-focus-center-mullion',{rough:.62,metalness:.035,castShadow:false,renderOrder:17});
  box3D(scene,cx,win.sill+win.h-.03,z,win.w+.08,.025,.05,rail,'real-balcony-focus-top-track',{rough:.64,metalness:.035,castShadow:false,renderOrder:17});
  box3D(scene,win.x+.02,win.sill+win.h/2,z,.035,win.h+.02,.05,rail,'real-balcony-focus-left-jamb',{rough:.68,metalness:.025,castShadow:false,renderOrder:17});
  box3D(scene,win.x+win.w-.02,win.sill+win.h/2,z,.035,win.h+.02,.05,rail,'real-balcony-focus-right-jamb',{rough:.68,metalness:.025,castShadow:false,renderOrder:17});
  const reflectionMat = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:open ? (lightOn ? .055 : .025) : (lightOn ? .2 : .075), side:THREE.DoubleSide, depthWrite:false});
  [.28,.62].forEach((t,i)=>{
    const shine = new THREE.Mesh(new THREE.PlaneGeometry(.16,1.42-i*.26),reflectionMat.clone());
    shine.position.set(win.x+win.w*t,1.28+i*.12,z-.035-i*.006);
    shine.rotation.z = -.08;
    shine.name = 'real-balcony-focus-glass-vertical-reflection';
    shine.renderOrder = 19;
    scene.add(shine);
  });
}

function addWindowToggleHit3D(scene,x,y,z,w,h,name,options={}){
  const hitW = options.hitW || w;
  const hitH = options.hitH || h;
  const hitMat = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.001, depthWrite:false, side:THREE.DoubleSide});
  const hit = new THREE.Mesh(new THREE.PlaneGeometry(hitW,hitH), hitMat);
  hit.position.set(x,y,z);
  if(options.rotY) hit.rotation.y = options.rotY;
  if(options.rotX) hit.rotation.x = options.rotX;
  hit.name = name;
  hit.userData = {windowToggle:true};
  hit.renderOrder = 20;
  scene.add(hit);
  webglTour?.windowObjects?.push(hit);
  return hit;
}

function addCameraClickProxy3D(scene,cam){
  if(!cam) return null;
  const proxyW = cam.clickProxyW || .42;
  const proxyH = cam.clickProxyH || .38;
  const proxyY = cam.clickProxyY || (cam.y - .3);
  const proxyZ = cam.z + (cam.dir < 0 ? -.16 : .16);
  const proxyMat = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.001, depthWrite:false, side:THREE.DoubleSide});
  const proxy = new THREE.Mesh(new THREE.PlaneGeometry(proxyW, proxyH), proxyMat);
  proxy.position.set(cam.x, proxyY, proxyZ);
  if(cam.dir < 0) proxy.rotation.y = Math.PI;
  proxy.name = 'cam-click-proxy-'+cam.id;
  proxy.userData = {cameraClick:cam.id, cameraClickProxy:true};
  proxy.renderOrder = 21;
  scene.add(proxy);
  if(webglTour?.cameraClickTargets) webglTour.cameraClickTargets.push(proxy);
  return proxy;
}

function addDoorToggleHit3D(scene,x,y,z,w,h,name,options={}){
  const hitMat = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.001, depthWrite:false, side:THREE.DoubleSide});
  const hit = new THREE.Mesh(new THREE.PlaneGeometry(w,h), hitMat);
  hit.position.set(x,y,z);
  if(options.rotY) hit.rotation.y = options.rotY;
  if(options.rotX) hit.rotation.x = options.rotX;
  hit.name = name;
  hit.userData = {rightDoorToggle:true};
  hit.renderOrder = 22;
  scene.add(hit);
  webglTour?.doorObjects?.push(hit);
  return hit;
}

function addOpenSouthWindowPanels3D(scene,win,prefix='real-south-window'){
  const lightOn = state.lightOn !== false;
  const panelW = win.w * .09;
  const slideZ = win.z - .22;
  const animate = state._windowToggleAnimating === true;
  addSlidingDoorPanel3D(scene,win,win.x+win.w*.045,slideZ,panelW,`${prefix}-left-slid-panel`,{handle:'right',fromX:animate ? win.x+win.w*.38 : undefined,glassOpacity:0,open:true});
  addSlidingDoorPanel3D(scene,win,win.x+win.w*.955,slideZ,panelW,`${prefix}-right-slid-panel`,{handle:'left',fromX:animate ? win.x+win.w*.62 : undefined,glassOpacity:0,open:true});
  addOpenWindowGapFrame3D(scene,win,prefix);
}

function addClosedSouthWindowPanels3D(scene,win,prefix='real-south-window'){
  const lightOn = state.lightOn !== false;
  const panelW = win.w * .34;
  const z = win.z - .055;
  const animate = state._windowToggleAnimating === true && state._windowToggleDirection === 'closing';
  addSlidingDoorPanel3D(scene,win,win.x+win.w*.33,z,panelW,`${prefix}-left-closed-panel`,{handle:'right',fromX:animate ? win.x+win.w*.045 : undefined,glassOpacity:lightOn ? .13 : .21});
  addSlidingDoorPanel3D(scene,win,win.x+win.w*.67,z,panelW,`${prefix}-right-closed-panel`,{handle:'left',fromX:animate ? win.x+win.w*.955 : undefined,glassOpacity:lightOn ? .13 : .21});
}

function addSlidingDoorPanel3D(scene,win,cx,z,w,name,options={}){
  const lightOn = state.lightOn !== false;
  const group = new THREE.Group();
  group.position.set(cx,0,z);
  group.name = name;
  if(options.fromX !== undefined){
    group.userData = {windowSlide:true, fromX:options.fromX, toX:cx, start:performance.now()*.001, duration:.72};
    group.position.x = options.fromX;
  }
  scene.add(group);
  const openPanel = options.open === true;
  const frameColor = lightOn ? 0xbeb4a6 : 0x625950;
  const glassColor = lightOn ? 0xb7c8c5 : 0x526566;
  const frameMat = mat3D(frameColor,.64,{metalness:.035,transparent:openPanel,opacity:openPanel ? .46 : 1});
  const sealMat = mat3D(0x7d8682,.48,{metalness:.12,transparent:openPanel,opacity:openPanel ? .44 : 1});
  const glassOpacity = options.glassOpacity ?? (lightOn ? .18 : .3);
  const glassMat = mat3D(glassColor,.12,{transparent:true,opacity:glassOpacity,metalness:.01,depthWrite:false});
  if(glassOpacity > .002){
    addPanelBox3D(group,0,win.sill+win.h/2,0,w-.08,win.h-.16,.01,glassMat,`${name}-glass`,false,13);
  }
  const stileW = openPanel ? .014 : .028;
  const railH = openPanel ? .022 : .042;
  addPanelBox3D(group,-w/2+stileW/2,win.sill+win.h/2,0,stileW,win.h,.034,frameMat,`${name}-left-stile`,false,14);
  addPanelBox3D(group,w/2-stileW/2,win.sill+win.h/2,0,stileW,win.h,.034,frameMat,`${name}-right-stile`,false,14);
  addPanelBox3D(group,0,win.sill+railH/2,0,w,railH,.034,frameMat,`${name}-bottom-rail`,false,14);
  addPanelBox3D(group,0,win.sill+win.h-railH/2,0,w,railH,.034,frameMat,`${name}-top-rail`,false,14);
  if(!openPanel) addPanelBox3D(group,0,win.sill+win.h*.52,0,w-.055,.016,.028,frameMat,`${name}-slim-midrail`,false,14);
  if(options.handle){
    const sx = options.handle === 'left' ? -1 : 1;
    addPanelBox3D(group,sx*(w*.5-.065),win.sill+win.h*.47,-.03,.022,.42,.026,sealMat,`${name}-pull-handle`,false,15);
  }else{
    addPanelBox3D(group,0,win.sill+win.h*.48,-.03,.02,.32,.022,sealMat,`${name}-fixed-slim-seal`,false,15);
  }
  return group;
}

function addPanelBox3D(group,x,y,z,w,h,d,material,name,castShadow=false,renderOrder){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(x,y,z);
  mesh.name = name;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  if(renderOrder !== undefined) mesh.renderOrder = renderOrder;
  group.add(mesh);
  return mesh;
}

function addOpenWindowAirPanel3D(scene,win,prefix){
  const lightOn = state.lightOn !== false;
  const cy = win.sill + win.h*.49;
  const mat = new THREE.MeshBasicMaterial({color:lightOn ? 0xe4f2ec : 0x63706c, transparent:true, opacity:lightOn ? .002 : .01, side:THREE.DoubleSide, depthWrite:false});
  const air = new THREE.Mesh(new THREE.PlaneGeometry(win.w*.58,win.h*.74),mat);
  air.position.set(win.x+win.w*.5,cy,win.z-.17);
  air.name = `${prefix}-open-air-clear-gap`;
  air.renderOrder = 11;
  scene.add(air);
}

function addOpenWindowGapFrame3D(scene,win,prefix){
  const rail = state.lightOn !== false ? 0xbdb2a2 : 0x6d645b;
  const cx = win.x + win.w/2;
  const z = win.z - .116;
  const gapW = win.w * .74;
  box3D(scene,cx,win.sill+.035,z,gapW,.024,.038,rail,`${prefix}-open-gap-low-threshold`,{rough:.62,metalness:.03,castShadow:false});
  box3D(scene,cx,win.sill+win.h-.035,z,gapW,.022,.032,rail,`${prefix}-open-gap-top-track`,{rough:.62,metalness:.03,castShadow:false});
}

function addOpenWindowCurtains3D(scene,win,prefix){
  const mat = mat3D(0xe4dfd2,.94,{transparent:true,opacity:state.lightOn !== false ? .46 : .28,depthWrite:false});
  const y = win.sill + win.h*.47;
  const h = win.h*.88;
  const z = win.z - .18;
  const left = roundedBox3D(scene,win.x+.08,y,z,.13,h,.11,0xe4dfd2,`${prefix}-left-curtain-stack`,.025,{material:mat,castShadow:false,renderOrder:12});
  const right = roundedBox3D(scene,win.x+win.w-.08,y,z,.13,h,.11,0xe4dfd2,`${prefix}-right-curtain-stack`,.025,{material:mat,castShadow:false,renderOrder:12});
  left.userData = {curtainBreathe:true, baseZ:z, phase:.2};
  right.userData = {curtainBreathe:true, baseZ:z, phase:1.1};
}

function addWindowBreeze3D(scene,cfg,win){
  const mat = new THREE.MeshBasicMaterial({color:0xbfded8, transparent:true, opacity:.13, side:THREE.DoubleSide, depthWrite:false});
  [0.22,0.4,0.58,0.76].forEach((t,i)=>{
    const breeze = new THREE.Mesh(new THREE.PlaneGeometry(.58+i*.12,.028+i*.004),mat.clone());
    breeze.position.set(win.x+win.w*t,.78+i*.23,win.z-.44-i*.3);
    breeze.rotation.y = .18;
    breeze.rotation.z = -.12+i*.08;
    breeze.renderOrder = 10;
    breeze.userData = {breeze:true, baseX:breeze.position.x, baseY:breeze.position.y, baseZ:breeze.position.z, phase:i*.9, drift:.06+i*.018};
    scene.add(breeze);
  });
}

function addRealPublicWindowReveal3D(scene,cfg,win){
  box3D(scene,win.x+win.w/2,win.sill-.02,win.z-.04,win.w+.2,.04,.06,0xd4b882,'real-public-window-floor-track-soft',{rough:.72,castShadow:false});
}

function addLargeSlidingDoorDetails3D(scene,cfg,win,options={}){
  const z = win.z - .028;
  const cx = win.x + win.w/2;
  const rail = state.lightOn !== false ? 0xbdb2a2 : 0x6f665d;
  const groove = state.lightOn !== false ? 0x726c63 : 0x3a3631;
  box3D(scene,cx,win.sill+.016,z,win.w+.05,.02,.046,rail,'real-sliding-door-floor-track',{rough:.62,metalness:.035,castShadow:false});
  box3D(scene,cx,win.sill+.032,z-.018,win.w-.18,.006,.01,groove,'real-sliding-door-inner-groove',{rough:.5,metalness:.08,castShadow:false,renderOrder:15});
  box3D(scene,cx,win.sill+win.h-.018,z,win.w+.05,.02,.042,rail,'real-sliding-door-top-track',{rough:.64,metalness:.035,castShadow:false});
  box3D(scene,win.x,win.sill+win.h/2,z,.028,win.h+.025,.038,rail,'real-sliding-door-left-jamb',{rough:.68,metalness:.025,castShadow:false});
  box3D(scene,win.x+win.w,win.sill+win.h/2,z,.028,win.h+.025,.038,rail,'real-sliding-door-right-jamb',{rough:.68,metalness:.025,castShadow:false});
  if(options.open) return;
  if(options.simple) return;
  box3D(scene,cx,win.sill+win.h*.52,z,win.w+.02,.012,.026,rail,'real-sliding-door-mid-rail',{rough:.62,metalness:.03,castShadow:false});
}

function addSubtleFloorDaylight3D(scene,cfg,win){
  const mat = new THREE.MeshBasicMaterial({color:0xd8e8f5, transparent:true, opacity:state.lightOn !== false ? .058 : .014, side:THREE.DoubleSide, depthWrite:false});
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(cfg.w*.46,2.25),Math.min(cfg.d*.28,1.28)),mat);
  patch.position.set(win.x+win.w*.5,.028,win.z-.92);
  patch.rotation.x = -Math.PI/2;
  patch.rotation.z = -.18;
  patch.renderOrder = 6;
  scene.add(patch);
}

function addWindowLightBands3D(scene,cfg,win){
  const mat = new THREE.MeshBasicMaterial({color:0xe6c486, transparent:true, opacity:state.lightOn !== false ? .018 : .008, side:THREE.DoubleSide, depthWrite:false});
  [0.34,0.68].forEach((t,i)=>{
    const band = new THREE.Mesh(new THREE.PlaneGeometry(.5,3.05-i*.2),mat);
    band.position.set(win.x+win.w*t,1.22,win.z-1.02-i*.2);
    band.rotation.x = -1.02;
    band.rotation.z = -.26;
    band.renderOrder = 9;
    scene.add(band);
  });
}

function addRealInteriorSunVolume3D(scene,cfg,win){
  const on = state.lightOn !== false;
  const volumeMat = new THREE.MeshBasicMaterial({color:0xf0d7a8, transparent:true, opacity:on ? .006 : .004, side:THREE.DoubleSide, depthWrite:false});
  const cx = win.x + win.w/2;
  for(let i=0;i<2;i++){
    const ray = new THREE.Mesh(new THREE.PlaneGeometry(win.w*(.18+i*.035),cfg.d*.62),volumeMat);
    ray.position.set(cx - .72 + i*.48,1.55-i*.13,cfg.d*.68-i*.18);
    ray.rotation.x = -.92;
    ray.rotation.z = -.34;
    ray.renderOrder = 9;
    scene.add(ray);
  }
  const reflectedMat = new THREE.MeshBasicMaterial({color:0xf0dfc5, transparent:true, opacity:on ? .01 : .006, side:THREE.DoubleSide, depthWrite:false});
  const sheen = new THREE.Mesh(new THREE.PlaneGeometry(cfg.w*.72,.24),reflectedMat);
  sheen.position.set(cfg.w*.52,.031,cfg.d*.35);
  sheen.rotation.x = -Math.PI/2;
  sheen.rotation.z = -.2;
  sheen.renderOrder = 9;
  scene.add(sheen);
}

function addRealLivingCeiling3D(scene,cfg,roomH,color){
  const tray = shade3D(color,-5);
  planeMat3D(scene,cfg.w/2,roomH,cfg.d/2,cfg.w,cfg.d,color,Math.PI/2,0,'real-living-ceiling-main',{rough:.9});
  box3D(scene,cfg.w/2,roomH-.035,.16,cfg.w,.07,.32,tray,'real-living-ceiling-front-band',{rough:.88,castShadow:false});
  box3D(scene,cfg.w/2,roomH-.035,cfg.d-.16,cfg.w,.07,.32,tray,'real-living-ceiling-window-band',{rough:.88,castShadow:false});
  box3D(scene,.16,roomH-.035,cfg.d/2,.32,.07,cfg.d,tray,'real-living-ceiling-left-band',{rough:.88,castShadow:false});
  box3D(scene,cfg.w-.16,roomH-.035,cfg.d/2,.32,.07,cfg.d,tray,'real-living-ceiling-right-band',{rough:.88,castShadow:false});
  const coveMat = new THREE.MeshBasicMaterial({color:state.lightOn !== false ? 0xffdfad : 0x6f6960, transparent:true, opacity:state.lightOn !== false ? .28 : .06, side:THREE.DoubleSide});
  planeMat3D(scene,cfg.w/2,roomH-.082,.34,cfg.w-.72,.055,0xffdfad,Math.PI/2,0,'real-living-ceiling-cove-front',{material:coveMat,castShadow:false,receiveShadow:false});
  planeMat3D(scene,cfg.w/2,roomH-.082,cfg.d-.34,cfg.w-.72,.055,0xffdfad,Math.PI/2,0,'real-living-ceiling-cove-window',{material:coveMat,castShadow:false,receiveShadow:false});
  planeMat3D(scene,.34,roomH-.082,cfg.d/2,.055,cfg.d-.72,0xffdfad,Math.PI/2,0,'real-living-ceiling-cove-left',{material:coveMat,castShadow:false,receiveShadow:false});
  planeMat3D(scene,cfg.w-.34,roomH-.082,cfg.d/2,.055,cfg.d-.72,0xffdfad,Math.PI/2,0,'real-living-ceiling-cove-right',{material:coveMat,castShadow:false,receiveShadow:false});
  addCeilingDownlight3D(scene,cfg.w*.25,roomH-.06,cfg.d*.28);
  addCeilingDownlight3D(scene,cfg.w*.75,roomH-.06,cfg.d*.28);
  addCeilingDownlight3D(scene,cfg.w*.25,roomH-.06,cfg.d*.72);
  addCeilingDownlight3D(scene,cfg.w*.75,roomH-.06,cfg.d*.72);
}

function addCeilingDownlight3D(scene,x,y,z){
  const on = state.lightOn !== false;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.018,28), mat3D(0xf2eee7,.48,{metalness:.06}));
  ring.position.set(x,y-.008,z);
  ring.name = 'real-ceiling-flush-downlight-ring';
  ring.castShadow = false;
  ring.receiveShadow = false;
  scene.add(ring);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(.062,24), new THREE.MeshBasicMaterial({color:on ? 0xffdfad : 0x8a8177, transparent:true, opacity:on ? .36 : .08, side:THREE.DoubleSide}));
  glow.position.set(x,y-.019,z);
  glow.rotation.x = Math.PI/2;
  glow.name = 'real-ceiling-flush-downlight-glow';
  glow.renderOrder = 4;
  scene.add(glow);
}

function addRealPublicEntry3D(scene,cfg){
  const ctx = scene.userData.realSpace || realSpaceRoomContext(scene,cfg,'public');
  const spec = cfg.spec.entry;
  const ox = cfg.entryOrigin.x;
  const oz = cfg.entryOrigin.z;
  box3D(scene,ox+.04,1.05,oz+1.0,.075,2.1,.86,0x76523a,'real-entry-door',{rough:.74});
  box3D(scene,ox+.095,1.05,oz+1.0,.018,1.72,.62,0x6b4a35,'real-entry-door-inset-panel',{rough:.78,castShadow:false});
  cylinder3D(scene,ox+.105,1.02,oz+.68,.025,.035,0xc7a266,'real-entry-door-handle-public',18,{rotX:Math.PI/2,rough:.42,metalness:.18});
  const cabW = mm3D(spec.shoeCabinet.w);
  const cabD = mm3D(spec.shoeCabinet.d);
  placeRealAsset3D(ctx,'entry.shoeCabinet',{x:ox+1.0,z:oz+.2,w:cabW,h:1.72,d:cabD}, item=>addEntryShoeCabinet3D(scene,item.x,item.z,item.w,item.d,item.h));
  roundedBox3D(scene,ox+1.08,.036,oz+1.54,1.14,.045,.44,0xb99769,'real-entry-mat',.04,{rough:.94});
  box3D(scene,ox+.52,.09,oz+1.48,.28,.06,.13,0x4d443b,'real-entry-slipper-left',{rough:.9});
  box3D(scene,ox+.82,.09,oz+1.5,.28,.06,.13,0x6a5a4b,'real-entry-slipper-right',{rough:.9});
}

function addRealPublicLiving3D(scene,cfg){
  const ctx = scene.userData.realSpace || realSpaceRoomContext(scene,cfg,'public');
  const living = cfg.spec.living;
  const ox = cfg.livingOrigin.x;
  const oz = cfg.livingOrigin.z;
  const local = {
    id:'living-public',
    spec:living,
    w:mm3D(living.w),
    d:mm3D(living.d),
    window:cfg.window
  };
  const sofaW = mm3D(living.sofa.w);
  const sofaD = mm3D(living.sofa.d);
  const sofaZ = oz+.06;
  placeRealAsset3D(ctx,'living.sofa',{x:ox+local.w/2,z:sofaZ+sofaD/2,w:sofaW,h:mm3D(living.sofa.h),d:sofaD}, item=>addRealSofa3D(scene,item.x,item.z,item.w,item.d,item.h));
  const tableZ = sofaZ+sofaD+mm3D(living.coffeeTable.gapFromSofa);
  placeRealAsset3D(ctx,'living.coffeeTable',{x:ox+local.w/2,z:tableZ+mm3D(living.coffeeTable.d)/2,w:mm3D(living.coffeeTable.w)*.94,h:mm3D(390),d:mm3D(living.coffeeTable.d)*.92}, item=>addRealCoffeeTable3D(scene,item.x,item.z,item.w,item.d));
  const tv = living.tvCabinet;
  const tvX = ox + local.w - .28;
  const tvZ = oz + local.d * .31;
  const mediaBottom = 0;
  const livingFocus = cfg.nodeId === 'living-node';
  if(livingFocus){
    placeRealAsset3D(ctx,'living.tvCabinet',{x:tvX,z:tvZ,w:mm3D(tv.d),h:mm3D(tv.h),d:mm3D(tv.w),y:mediaBottom+mm3D(tv.h)/2}, item=>addRealFloatingCabinet3D(scene,item.x,item.z,item.w,item.d,item.h,mediaBottom));
    addRealTvWallAssembly3D(scene,tvX,tvZ,local);
  }else{
    addQuietTvWallReference3D(scene,tvX,tvZ);
  }
  addRug3D(scene,ox+local.w/2,.028,tableZ+.55,2.16,1.24,0xcfc2ad,'real-public-living-rug');
  addRealLivingSideDetails3D(scene,ox,oz,sofaZ,local);
}

function addRealLivingWindowSeat3D(scene,x,z,w){
  roundedBox3D(scene,x,.17,z,Math.min(2.45,w*.68),.22,.34,0xd8c4a6,'real-living-low-window-bench',.05,{rough:.86});
  roundedBox3D(scene,x,.32,z,Math.min(2.1,w*.58),.08,.28,0xe8d7c2,'real-living-window-bench-cushion',.04,{rough:.94});
  addContactShadow3D(scene,x,z,Math.min(2.45,w*.68),.34,.16);
}

function addEntryShoeCabinet3D(scene,x,z,w,d,h){
  addContactShadow3D(scene,x,z,w*.94,d*.86,.18);
  var _entryTone = (window.ROOM_TONE || ROOM_TONE).entry;
  roundedBox3D(scene,x,h/2,z,w,h,d,_entryTone.cabinet,'real-public-entry-shoe-cabinet',.045,{rough:.8});
  box3D(scene,x,h-.16,z-d/2-.016,w*.78,.035,.028,0x6f4d35,'real-entry-cabinet-shadow-gap',{rough:.72,castShadow:false});
  for(let i=1;i<4;i++) box3D(scene,x-w/2+i*w/4,h*.49,z-d/2-.018,.02,h*.68,.024,0x76543a,'real-entry-cabinet-door-reveal',{rough:.72,castShadow:false});
  box3D(scene,x,h+.055,z,w*.82,.07,d*.82,0xd7c1a2,'real-entry-cabinet-stone-top',{rough:.62});
  addCabinetHandle3D(scene,x-w*.18,.86,z-d/2-.035,.34,.06,false);
  addCabinetHandle3D(scene,x+w*.18,.86,z-d/2-.035,.34,.06,false);
  var _benchY = .36;
  roundedBox3D(scene,x+w*.15,_benchY,z,w*.28,.08,d*.9,_entryTone.bench,'real-entry-bench-cushion',.06,{rough:.94,transparent:true,opacity:.9});
  box3D(scene,x-w*.3,.18,z,.1,.36,.04,0x7c6651,'real-entry-mirror-mount',{rough:.6});
  var _mirrorMesh = new THREE.Mesh(new THREE.PlaneGeometry(.38,.72), mat3D(0xcde0df,.3,{metalness:.05}));
  _mirrorMesh.position.set(x-w*.3,1.1,z+d/2+.02);
  _mirrorMesh.name = 'real-entry-mirror';
  scene.add(_mirrorMesh);
}

function addRealLivingSideDetails3D(scene,ox,oz,sofaZ,local){
  const sideX = ox + .5;
  const sideZ = sofaZ + .66;
  addRealSideTable3D(scene,sideX,sideZ,.38,.38,.46);
  roundedBox3D(scene,ox+local.w*.52,.065,oz+3.7,1.18,.045,.34,0xe1d6c9,'real-window-walkoff-runner',.06,{rough:.96});
}

function addRealTvWallAssembly3D(scene,wallX,tvZ,local){
  const lightOn = state.lightOn !== false;
  const screenX = wallX - .055;
  const screenY = 1.12;
  const screenW = 1.12;
  const screenH = .62;
  box3D(scene,wallX-.022,screenY,tvZ,.018,.16,.28,0x303633,'real-tv-wall-slim-bracket',{rough:.56,metalness:.06,castShadow:false});
  box3D(scene,screenX,screenY,tvZ,screenW,screenH,.042,0x1f2422,'real-wall-mounted-tv-screen',{rough:.48,metalness:.02,rotY:-Math.PI/2});
  box3D(scene,screenX-.025,screenY,tvZ,screenW*.9,screenH*.84,.012,0x0d1110,'real-wall-mounted-tv-dark-glass',{rough:.42,metalness:.04,rotY:-Math.PI/2,castShadow:false});
  box3D(scene,wallX-.22,.42,tvZ,.064,.045,.68,0x252a27,'real-console-single-soundbar',{rough:.52,metalness:.02});
}

function addQuietTvWallReference3D(scene,wallX,tvZ){
  const color = state.lightOn !== false ? 0x8f806d : 0x45413a;
  box3D(scene,wallX-.028,.78,tvZ,.026,.52,.9,color,'real-tv-wall-quiet-reference-panel',{rough:.82,transparent:true,opacity:state.lightOn !== false ? .18 : .12,castShadow:false});
}

function addRealTvWallDecor3D(scene,wallX,oz,local){
}

function addEastWallShelf3D(scene,wallX,y,z,w,name,options={}){
  box3D(scene,wallX-.045,y,z,.08,.04,w,0xb58b55,`${name}-board`,{rough:.74,castShadow:false});
  box3D(scene,wallX-.024,y-.08,z-w*.32,.035,.14,.035,0x6f4d35,`${name}-bracket-a`,{rough:.68,castShadow:false});
  box3D(scene,wallX-.024,y-.08,z+w*.32,.035,.14,.035,0x6f4d35,`${name}-bracket-b`,{rough:.68,castShadow:false});
  if(options.objects === false) return;
  box3D(scene,wallX-.08,y+.09,z-w*.18,.09,.14,.07,0x8a6443,`${name}-book-stack`,{rough:.86});
  roundedBox3D(scene,wallX-.08,y+.09,z+w*.19,.08,.14,.08,0xcfa067,`${name}-small-vase`,.025,{rough:.82});
}

function addPublicStudyDesk3D(scene,x,z,w,d,h){
  var _deskTex = createWoodGrainTexture(0xc99d67, {grainStrength:.35});
  addContactShadow3D(scene,x,z,w*.95,d*.85,.16);
  roundedBox3D(scene,x,h,z,w,.08,d,0xc99d67,'real-public-study-desk-top',.04,{rough:.74,texture:_deskTex});
  box3D(scene,x-w*.38,h*.49,z-d*.34,.05,h*.98,.05,0x7b563a,'real-public-study-desk-leg',{rough:.64});
  box3D(scene,x+w*.38,h*.49,z-d*.34,.05,h*.98,.05,0x7b563a,'real-public-study-desk-leg',{rough:.64});
  box3D(scene,x-w*.38,h*.49,z+d*.34,.05,h*.98,.05,0x7b563a,'real-public-study-desk-leg',{rough:.64});
  box3D(scene,x+w*.38,h*.49,z+d*.34,.05,h*.98,.05,0x7b563a,'real-public-study-desk-leg',{rough:.64});
  roundedBox3D(scene,x+w*.24,h*.57,z+d*.18,w*.32,.26,d*.26,0xae7e51,'real-public-study-desk-drawer',.025,{rough:.78});
  box3D(scene,x+w*.24,h*.57,z+d*.315,w*.2,.02,.022,0x5d4432,'real-public-study-desk-handle',{rough:.62});
}

function addPublicLoungeChair3D(scene,x,z,w,d,h){
  var _kt = (window.ROOM_TONE || ROOM_TONE).kids;
  addContactShadow3D(scene,x,z,w*.86,d*.86,.16);
  roundedBox3D(scene,x,.34,z,w,.38,d,_kt.blue,'real-public-study-lounge-chair-seat',.09,{rough:.94});
  roundedBox3D(scene,x,.62,z-d*.36,w*.92,.56,.1,0x9b8473,'real-public-study-lounge-chair-back',.055,{rough:.94});
  roundedBox3D(scene,x-w*.45,.45,z,.08,.42,d*.82,0x8f7968,'real-public-study-lounge-chair-left-arm',.04,{rough:.92});
  roundedBox3D(scene,x+w*.45,.45,z,.08,.42,d*.82,0x8f7968,'real-public-study-lounge-chair-right-arm',.04,{rough:.92});
}

function addDiningSurfaceDetails3D(scene,x,z){
  return;
  cylinder3D(scene,x-.16,.83,z+.05,.09,.09,0xf4efe6,'real-dining-small-bowl',24,{rough:.6});
  cylinder3D(scene,x+.15,.83,z-.02,.08,.11,0xc9d7d1,'real-dining-cup',20,{rough:.62});
  box3D(scene,x+.34,.82,z+.18,.32,.018,.18,0xe8dcc8,'real-dining-placemat',{rough:.92,castShadow:false});
  addVaseWithFlowers3D(scene,x,.84,z-.12,.9);
  addSmallPottedPlant3D(scene,x-.32,.82,z+.16,.7);
}

function addRealPublicStudy3D(scene,cfg){
  const ctx = scene.userData.realSpace || realSpaceRoomContext(scene,cfg,'public');
  const ox = cfg.studyOrigin.x;
  const oz = cfg.studyOrigin.z;
  if(cfg.nodeId === 'bedroom-node'){
    addRealPublicStudyLowEdge3D(scene,ox+2.18,oz+1.02);
    return;
  }
  const focus = cfg.nodeId === 'study-node';
  placeRealAsset3D(ctx,'study.desk',{x:ox+.96,z:oz+.48,w:1.36,h:.76,d:.66}, item=>addPublicStudyDesk3D(scene,item.x,item.z,item.w,item.d,item.h));
  /* 书桌椅: 位于书桌南侧(面向书桌),填补原本无椅的不真实感 */
  addPublicStudyDeskChair3D(scene, ox+.96, oz+.92);
  addRealPublicStudyBookWall3D(scene,ox+2.22,oz+1.02);
  if(!focus) placeRealAsset3D(ctx,'study.loungeChair',{x:ox+.38,z:oz+1.74,w:.72,h:.64,d:.74}, item=>addPublicLoungeChair3D(scene,item.x,item.z,item.w,item.d,item.h));
  /* 焦点模式: 用落地灯与绿植丰富休闲椅角落,避免空旷 */
  if(focus){
    addPublicFloorLamp3D(scene, ox+1.9, oz+1.85, 'real-public-study-floor-lamp');
    addCompactFloorPlant3D(scene, ox+.32, oz+1.66, .62, 'real-public-study-corner-plant');
  }
  addPublicStudyIdentityDetails3D(scene,ox,oz,focus);
}

function addPublicStudyIdentityDetails3D(scene,ox,oz,focus){
  focus = focus || false;
  var _kt2 = (window.ROOM_TONE || ROOM_TONE).kids;
  addRug3D(scene,ox+1.12,.024,oz+1.28,focus ? 1.72 : 1.42,focus ? 1.28 : 1.02,_kt2.rug,'real-public-study-room-rug','cloud');
  addStudyDeskWallDetails3D(scene,ox,oz);
  /* 显示器居中于书桌(桌面顶部 y=.80) */
  var dx = ox+.96;
  var dz = oz+.48;
  /* 显示器屏幕: 底部贴支架顶部(.98) */
  box3D(scene,dx,1.15,oz+.25,.58,.34,.035,0x24302e,'real-public-study-monitor-screen',{rough:.48,metalness:.03});
  /* 显示器支架: 底部贴桌面(.80) */
  box3D(scene,dx,.89,oz+.27,.08,.18,.06,0x4f4a43,'real-public-study-monitor-stand',{rough:.68});
  /* 键盘/触控板: 贴桌面 */
  box3D(scene,dx-.08,.812,oz+.56,.54,.024,.16,0x2c3331,'real-public-study-keyboard',{rough:.64,metalness:.02});
  box3D(scene,dx+.22,.813,oz+.56,.16,.025,.2,0x303b3a,'real-public-study-trackpad',{rough:.58});
  addCompactTaskLamp3D(scene,dx+.42,.80,oz+.42,'real-public-study-compact-lamp');
  roundedBox3D(scene,dx-.42,.83,oz+.52,.4,.045,.24,0xfff7df,'real-public-study-single-notebook',.02,{rough:.88});
  /* 北墙装饰画: 位于书桌背板上方,提升书房墙面完整度 */
  addWallArt3D(scene, ox+.96, 1.74, .05, .62, .42, focus ? 0xc7d4ca : 0xb8c5bc, 'real-public-study-north-art');
}

function addRealPublicStudyLowEdge3D(scene,x,z){
  roundedBox3D(scene,x,.32,z,.26,.64,1.32,0xb58b55,'real-public-study-low-edge-cabinet',.035,{rough:.78,transparent:true,opacity:.42});
  box3D(scene,x-.14,.68,z,.025,.34,1.18,0x7b583e,'real-public-study-low-edge-line',{rough:.72,transparent:true,opacity:.38});
}

function addRealPublicStudyBookWall3D(scene,x,z){
  addContactShadow3D(scene,x,z,1.5,.32,.18);
  var h = 1.86;
  var bw = 1.5;
  var bd = 0.3;
  var carcass = state.lightOn !== false ? 0xa07846 : 0x4a3828;
  var shelfMat = state.lightOn !== false ? 0x8a6440 : 0x3c2e22;
  var _bcTex = createWoodGrainTexture(carcass, {grainStrength:.3});
  roundedBox3D(scene,x,h/2,z,bw,h,bd,carcass,'real-public-study-bookcase-carcass',.03,{rough:.78,texture:_bcTex});
  box3D(scene,x,h/2,z+bd/2-.008,bw*.94,h*.94,.015,0x6f4d35,'real-public-study-bookcase-back-panel',{rough:.82,castShadow:false});
  box3D(scene,x,h-.02,z,bw*.98,.04,bd*1.05,shelfMat,'real-public-study-bookcase-top-cap',{rough:.72});
  box3D(scene,x,.02,z,bw*.98,.04,bd*1.05,shelfMat,'real-public-study-bookcase-base',{rough:.72});
  [-.45,0,.45].forEach(function(dx){
    box3D(scene,x+dx,h/2,z-.01,.025,h*.88,bd*.8,shelfMat,'real-public-study-bookcase-vertical-divider',{rough:.72,castShadow:false});
  });
  for(var row=0;row<5;row++){
    var sy = .28 + row*.34;
    box3D(scene,x,sy,z,bw*.94,.028,bd*.88,shelfMat,'real-public-study-bookcase-shelf',{rough:.72,castShadow:false});
  }
  var bookColors = [0x8a6443,0xf4ead9,0xcfa067,0x789198,0x9b6b61,0x5a7a52,0xc87850,0xd9c78f];
  for(var row=0;row<4;row++){
    var bx = x - bw*.42;
    for(var i=0;i<7;i++){
      var bc = bookColors[(row+i)%bookColors.length];
      var bookH = .2 + ((i*7+row)%3)*.04;
      var bookW = .048 + ((i+row)%2)*.012;
      box3D(scene,bx+i*.185,.4+row*.34+bookH/2,z-bd*.3,bookW,bookH,.085,bc,'real-public-study-book-spine',{rough:.86,castShadow:false});
    }
  }
  roundedBox3D(scene,x-bw*.35,.46,z-bd*.1,.07,.22,.2,0xd9c78f,'real-public-study-bookcase-file-box-a',.018,{rough:.82,castShadow:false});
  roundedBox3D(scene,x+bw*.3,1.14,z-bd*.1,.07,.22,.2,0xc8d1c7,'real-public-study-bookcase-file-box-b',.018,{rough:.82,castShadow:false});
  addSmallPottedPlant3D(scene,x+bw*.35,h+.05,z,.6);
}

function addStudyDeskWallDetails3D(scene,ox,oz){
  box3D(scene,ox+.96,1.06,oz+.13,1.22,.52,.035,0xe7ded0,'real-study-desk-wall-panel',{rough:.9,castShadow:false});
  box3D(scene,ox+.78,1.13,oz+.105,.32,.18,.028,0xf4ead9,'real-study-note-a',{rough:.92,castShadow:false});
  box3D(scene,ox+1.2,1.03,oz+.105,.28,.16,.028,0xcbd8d4,'real-study-note-b',{rough:.92,castShadow:false});
}

function addRealStudyBookcase3D(scene,x,z){
  addContactShadow3D(scene,x,z,.5,1.72,.24);
  roundedBox3D(scene,x,1.1,z,.5,2.2,1.72,0xb58b55,'real-study-bookcase-carcass',.04,{rough:.78});
  const frontX = x - .265;
  for(let row=0;row<5;row++){
    const y = .34 + row*.38;
    box3D(scene,frontX,y,z,.04,.035,1.52,0x7b583e,'real-study-bookcase-shelf',{rough:.72});
  }
  for(let row=0;row<4;row++){
    for(let i=0;i<8;i++){
      const color = [0x8a6443,0xfff7df,0xcfa067,0x8fa7ae,0x9b6b61][(row+i)%5];
      const bookH = .22 + ((i+row)%3)*.055;
      box3D(scene,frontX-.025,.48+row*.38+bookH/2,z-.62+i*.16,.055,bookH,.08,color,'real-study-book-spine',{rough:.86});
    }
  }
  [z+.48,z+.68].forEach((pz,i)=>{
    roundedBox3D(scene,frontX-.035,.62+i*.38,pz,.06,.26,.34,0xd9c78f,'real-study-file-box',.02,{rough:.82});
  });
  box3D(scene,frontX-.045,1.98,z,.035,.32,1.48,0x8a6443,'real-study-bookcase-side-front',{rough:.72});
}

function addRealPublicDining3D(scene,cfg){
  const dining = cfg.spec.dining;
  const dx = cfg.diningOrigin.x;
  const dz = cfg.diningOrigin.z;
  const quietForLiving = cfg.nodeId === 'living-node';
  addContactShadow3D(scene,dx+.94,dz+.82,1.72,1.08,.16);
  roundedBox3D(scene,dx+.94,.755,dz+.82,mm3D(dining.table.w)*.96,.075,mm3D(dining.table.d)*.96,0xcfa46b,'real-dining-table-top',.045,{rough:.68,texture:createWoodGrainTexture(0xcfa46b,{grainStrength:.3})});
  [[-.38,-.18],[.38,-.18],[-.38,.18],[.38,.18]].forEach(([x,z])=>box3D(scene,dx+.94+x,.38,dz+.82+z,.05,.68,.05,0x7b563a,'real-dining-table-leg',{rough:.62}));
  const chair = dining.chair;
  const chairs = quietForLiving ? [
    [dx+.94,dz+1.42,Math.PI],
    [dx+1.7,dz+.82,-Math.PI/2]
  ] : [
    [dx+.94,dz+.22,0],
    [dx+.94,dz+1.42,Math.PI],
    [dx+.18,dz+.82,Math.PI/2],
    [dx+1.7,dz+.82,-Math.PI/2]
  ];
  chairs.forEach(([x,z,rot],i)=>addDiningChair3D(scene,x,z,mm3D(chair.w),mm3D(chair.d),rot,`real-dining-chair-${i}`));
  roundedBox3D(scene,dx+2.56,.4,dz+.82,mm3D(dining.sideboard.d)*.88,.8,mm3D(dining.sideboard.w)*.9,0xa8794f,'real-dining-sideboard',.05,{rough:.8});
  box3D(scene,dx+2.38,.61,dz+.82,.025,.34,mm3D(dining.sideboard.w)*.62,0x6e4d35,'real-dining-sideboard-line',{rough:.72});
  if(!quietForLiving) addDiningSurfaceDetails3D(scene,dx+.94,dz+.82);
}

function addRealPublicBedroomGlimpse3D(scene,cfg){
  if(cfg.nodeId === 'study-node') return;
  const bx = cfg.bedroomOrigin.x;
  const bz = cfg.bedroomOrigin.z;
  const focus = cfg.nodeId === 'bedroom-node';
  const bedX = bx + (focus ? .58 : .86);
  const bedZ = bz + (focus ? 1.52 : 1.34);
  const bedW = focus ? 1.58 : 1.12;
  const bedD = focus ? 2.02 : 1.58;
  addContactShadow3D(scene,bedX,bedZ,bedW,bedD,.22);
  var _bedTone = (window.ROOM_TONE || ROOM_TONE).bedroom;
  roundedBox3D(scene,bedX,.26,bedZ,bedW,.28,bedD,0x8f735c,'real-public-bedroom-bed-frame-glimpse',.06,{rough:.78});
  roundedBox3D(scene,bedX,.5,bedZ+.08,bedW*.92,.2,bedD*.86,_bedTone.mattress,'real-public-bedroom-mattress-glimpse',.06,{rough:.94});
  roundedBox3D(scene,bedX,.74,bedZ-bedD*.45,bedW*1.04,.7,.14,_bedTone.headboard,'real-public-bedroom-headboard-glimpse',.055,{rough:.82});
  addPublicBedroomIdentityDetails3D(scene,bx,bz,bedX,bedZ,bedW,bedD,focus);
}

function addPublicBedroomIdentityDetails3D(scene,bx,bz,bedX,bedZ,bedW,bedD,focus){
  focus = focus || false;
  var _bedTone = (window.ROOM_TONE || ROOM_TONE).bedroom;
  roundedBox3D(scene,bedX-bedW*.23,.71,bedZ-bedD*.28,bedW*.32,.14,bedD*.16,0xfffdfa,'real-public-bedroom-left-pillow',.06,{rough:.96});
  roundedBox3D(scene,bedX+bedW*.23,.71,bedZ-bedD*.28,bedW*.32,.14,bedD*.16,_bedTone.accent,'real-public-bedroom-right-pillow-green',.06,{rough:.96});
  roundedBox3D(scene,bedX,.67,bedZ+bedD*.2,bedW*.84,.13,bedD*.48,_bedTone.quilt,'real-public-bedroom-folded-quilt',.07,{rough:.96});
  roundedBox3D(scene,bedX,.75,bedZ+bedD*.02,bedW*.82,.055,.08,0xbfa68f,'real-public-bedroom-quilt-fold-line',.035,{rough:.96});
  const leftStandX = bedX - bedW/2 - .2;
  const rightStandX = Math.min(bx+1.68, bedX + bedW/2 + .2);
  const standZ = bedZ - bedD*.36;
  if(!focus) roundedBox3D(scene,leftStandX,.26,standZ,.32,.42,.32,0xd9a96d,'real-public-bedroom-left-nightstand',.04,{rough:.76});
  roundedBox3D(scene,rightStandX,.24,standZ,.28,.38,.28,0xd9a96d,'real-public-bedroom-right-nightstand',.04,{rough:.76});
  if(!focus) addPublicBedroomLamp3D(scene,leftStandX,.48,standZ,'real-public-bedroom-left-lamp',focus);
  addPublicBedroomLamp3D(scene,rightStandX,.44,standZ,'real-public-bedroom-right-lamp',focus);
  const wardrobeX = bx + 1.55;
  const wardrobeZ = bz + 1.72;
  addContactShadow3D(scene,wardrobeX,wardrobeZ,.38,1.18,.16);
  roundedBox3D(scene,wardrobeX,.96,wardrobeZ,.34,1.78,1.08,0xb08da9,'real-public-bedroom-wardrobe-glimpse',.04,{rough:.84,transparent:focus,opacity:focus ? .68 : 1});
  [-.26,0,.26].forEach(offset=>box3D(scene,wardrobeX-.205,.98,wardrobeZ+offset,.024,1.24,.026,0xf4eaf4,'real-public-bedroom-wardrobe-door-gap',{rough:.74,castShadow:false}));
  box3D(scene,wardrobeX-.215,1.04,wardrobeZ-.18,.024,.54,.032,0x6c5b68,'real-public-bedroom-wardrobe-handle-a',{rough:.56,metalness:.08});
  box3D(scene,wardrobeX-.215,1.04,wardrobeZ+.18,.024,.54,.032,0x6c5b68,'real-public-bedroom-wardrobe-handle-b',{rough:.56,metalness:.08});
  if(false && !focus){
    roundedBox3D(scene,bx+.32,.42,bz+2.38,.56,.42,.34,0xd9a96d,'real-public-bedroom-vanity-glimpse',.045,{rough:.76});
    box3D(scene,bx+.32,1.08,bz+2.18,.48,.48,.035,0xcde0df,'real-public-bedroom-vanity-mirror-glimpse',{rough:.36,metalness:.02,transparent:true,opacity:.78});
  }
  addRug3D(scene,bedX,.026,bedZ+bedD*.5,focus ? 1.42 : 1.16,focus ? .62 : .5,0xe5d7de,'real-public-bedroom-bedside-rug');
  /* 北墙床头装饰画: 位于床头板上方,补全卧室墙面 */
  addWallArt3D(scene, bedX, 1.58, .05, focus ? .72 : .52, focus ? .46 : .32, focus ? 0xd9cdbf : 0xc4b8ad, 'real-public-bedroom-headboard-art');
  /* 焦点模式: 床尾搭毯 + 床头吊灯 + 角落绿植,丰富卧室层次 */
  if(focus){
    roundedBox3D(scene,bedX,.74,bedZ+bedD*.38,bedW*.7,.04,bedD*.13,0xc9a98c,'real-public-bedroom-throw-blanket',.025,{rough:.94});
    addPublicCeilingPendant3D(scene, bedX, bedZ-bedD*.18, mm3D(REAL_HOME_SPEC.netHeight), 'real-public-bedroom-pendant');
    addCompactFloorPlant3D(scene, bx+1.42, bz+.34, .6, 'real-public-bedroom-corner-plant');
  }
}

function addPublicBedroomLamp3D(scene,x,y,z,name,focus=false){
  const shadeR = focus ? .15 : .19;
  const shadeH = focus ? .13 : .16;
  cylinder3D(scene,x,y+.14,z,.02,.28,0x6a5847,`${name}-stem`,12,{rough:.52,metalness:.06});
  cylinder3D(scene,x,y+.01,z,.09,.035,0x8a725c,`${name}-base`,18,{rough:.6});
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(shadeR*.72,shadeR,shadeH,20), mat3D(0xfff3cf,.78,{transparent:true,opacity:.9}));
  shade.position.set(x,y+.32,z);
  shade.name = `${name}-small-shade`;
  shade.castShadow = true;
  shade.receiveShadow = true;
  scene.add(shade);
}

function addPublicStudyDeskChair3D(scene,x,z){
  /* 书桌办公椅: 五星脚轮 + 气压杆 + 座垫 + 靠背(面向书桌/北) */
  addContactShadow3D(scene,x,z,.46,.46,.16);
  const baseColor = state.lightOn !== false ? 0x2a2a2a : 0x161616;
  const metalColor = state.lightOn !== false ? 0x4a4a4a : 0x2a2a2a;
  const seatColor = state.lightOn !== false ? 0x3f3f3f : 0x222222;
  /* 五星脚 */
  for(let i=0;i<5;i++){
    const angle = (i/5)*Math.PI*2;
    const wx = x + Math.cos(angle)*.17;
    const wz = z + Math.sin(angle)*.17;
    box3D(scene,wx,.045,wz,.2,.03,.05,baseColor,'real-public-study-chair-wheel-arm',{rough:.56,metalness:.12,rotY:angle,castShadow:false});
    cylinder3D(scene,wx+Math.cos(angle)*.1,.035,wz+Math.sin(angle)*.1,.022,.04,0x161616,'real-public-study-chair-wheel',{rough:.5,metalness:.2,castShadow:false});
  }
  /* 气压杆 */
  cylinder3D(scene,x,.26,z,.024,.42,metalColor,'real-public-study-chair-gas-lift',10,{rough:.48,metalness:.3});
  /* 座垫 */
  roundedBox3D(scene,x,.5,z,.44,.09,.4,seatColor,'real-public-study-chair-seat-cushion',.05,{rough:.86});
  /* 靠背(中背,顶部避开显示器视线): 位于座垫南侧(人背后,背离书桌) */
  roundedBox3D(scene,x,.72,z+.18,.4,.44,.06,seatColor,'real-public-study-chair-backrest',.05,{rough:.86});
  /* 扶手(简化,左右各一) */
  box3D(scene,x-.24,.56,z+.02,.06,.07,.3,baseColor,'real-public-study-chair-left-arm',{rough:.7,castShadow:false});
  box3D(scene,x+.24,.56,z+.02,.06,.07,.3,baseColor,'real-public-study-chair-right-arm',{rough:.7,castShadow:false});
}

function addPublicFloorLamp3D(scene,x,z,name){
  name = name || 'real-public-floor-lamp';
  addContactShadow3D(scene,x,z,.32,.32,.1);
  cylinder3D(scene,x,.03,z,.13,.045,0x4a3f33,`${name}-base`,18,{rough:.6});
  cylinder3D(scene,x,.88,z,.022,1.66,0x4a3f33,`${name}-pole`,10,{rough:.5,metalness:.1});
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.11,.18,.22,18), mat3D(0xfff3cf,.8,{transparent:true,opacity:.9}));
  shade.position.set(x,1.74,z);
  shade.name = `${name}-shade`;
  shade.castShadow = true;
  shade.receiveShadow = true;
  scene.add(shade);
  if(state.lightOn !== false){
    const light = new THREE.PointLight(0xffd6a0,.18,2.8);
    light.position.set(x,1.64,z);
    scene.add(light);
  }
}

function addPublicCeilingPendant3D(scene,x,z,roomH,name){
  name = name || 'real-public-pendant';
  /* 灯线 */
  cylinder3D(scene,x,(roomH+2.35)/2,z,.006,roomH-2.35,0x2a2a2a,`${name}-cord`,6,{rough:.7,castShadow:false});
  /* 灯罩(倒锥) */
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.085,.18,.16,20), mat3D(0xfff3cf,.8,{transparent:true,opacity:.9}));
  shade.position.set(x,2.36,z);
  shade.name = `${name}-shade`;
  shade.castShadow = false;
  shade.receiveShadow = true;
  scene.add(shade);
  /* 灯顶盖 */
  cylinder3D(scene,x,2.45,z,.085,.012,0x4a3f33,`${name}-cap`,12,{rough:.5,castShadow:false});
  if(state.lightOn !== false){
    const light = new THREE.PointLight(0xffd6a0,.22,3);
    light.position.set(x,2.18,z);
    scene.add(light);
  }
}

function addCompactTaskLamp3D(scene,x,y,z,name){
  name = name || 'compact-task-lamp';
  /* 底座 */
  cylinder3D(scene,x,y+.01,z,.04,.02,0x4a3f33,name+'-base',16,{rough:.56,metalness:.1});
  /* 灯杆 */
  cylinder3D(scene,x,y+.15,z,.018,.26,0x6a5847,name+'-stem',12,{rough:.52,metalness:.08});
  /* 灯罩(直接在灯杆顶部) */
  var shade = new THREE.Mesh(new THREE.CylinderGeometry(.06,.1,.1,18), mat3D(0xfff3cf,.76,{transparent:true,opacity:.92}));
  shade.position.set(x,y+.32,z);
  shade.name = name+'-shade';
  shade.castShadow = true;
  scene.add(shade);
}

function addRealPublicAreaLabels3D(scene,cfg){
  return;
  addFloorLabel3D(scene,'玄关',cfg.entryOrigin.x+1.12,cfg.entryOrigin.z+1.72,0xd8c49a);
  addFloorLabel3D(scene,'客厅',cfg.livingOrigin.x+1.32,cfg.livingOrigin.z+3.0,0xc9d7e0);
  addFloorLabel3D(scene,'阳台',cfg.window.x+cfg.window.w*.18,cfg.window.z-.2,0xc8d8d3);
  addFloorLabel3D(scene,'书房',cfg.studyOrigin.x+.72,cfg.studyOrigin.z+.34,0xb9d3c7);
  addFloorLabel3D(scene,'卧室门口',cfg.bedroomOrigin.x+.42,cfg.bedroomOrigin.z+.34,0xd7c4d8);
}

function addFloorLabel3D(scene,text,x,z,color){
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = 'rgba(255,253,248,.86)';
  ctx.strokeStyle = `#${color.toString(16).padStart(6,'0')}`;
  ctx.lineWidth = 4;
  roundRect(ctx,28,22,200,52,18,true,true);
  ctx.fillStyle = '#24312d';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text,128,48);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const mat = new THREE.MeshBasicMaterial({map:texture, transparent:true, opacity:.92, depthWrite:false, side:THREE.DoubleSide});
  const label = new THREE.Mesh(new THREE.PlaneGeometry(.9,.34),mat);
  label.position.set(x,.05,z);
  label.rotation.x = -Math.PI/2;
  label.rotation.z = -.08;
  label.name = `real-floor-label-${text}`;
  label.renderOrder = 15;
  scene.add(label);
}

function addDiningChair3D(scene,x,z,w,d,rot,name){
  const group = new THREE.Group();
  group.position.set(x,0,z);
  group.rotation.y = rot;
  group.name = name;
  scene.add(group);
  const mat = mat3D(0x8d725f,.84);
  var _chairTone = (window.ROOM_TONE || ROOM_TONE).living;
  const cushionMat = mat3D(_chairTone.accent,.94);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(w*.92,.08,d*.78),cushionMat);
  seat.position.y = .42;
  seat.castShadow = true;
  seat.receiveShadow = true;
  group.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(w*.92,.62,.08),mat);
  back.position.set(0,.72,-d*.37);
  back.rotation.x = -.12;
  back.castShadow = true;
  back.receiveShadow = true;
  group.add(back);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(w*.78,.055,.06),mat);
  rail.position.set(0,.54,-d*.34);
  rail.castShadow = true;
  group.add(rail);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.017,.022,.42,12),mat);
    leg.position.set(sx*w*.34,.2,sz*d*.3);
    leg.castShadow = true;
    group.add(leg);
  });
}

function addRealPublicBalcony3D(scene,cfg){
  const b = cfg.balcony;
  const focus = cfg.nodeId === 'balcony-node';
  const open = state.windowOpen === true;
  roundedBox3D(scene,b.x+b.w/2,.035,b.z+b.d/2,b.w,.07,b.d,0xcbb084,'real-balcony-floor-lip',.04,{rough:.82});
  if(!focus) planeMat3D(scene,b.x+b.w/2,.012,b.z+b.d+.5,b.w*.96,.92,0xafbba9,-Math.PI/2,0,'real-balcony-outdoor-slab',{rough:.9});
  addBalconyPictureView3D(scene,cfg,b);
  if(focus){
    addFocusedBalconyGuard3D(scene,b);
  }else{
    addBalconyGlassGuard3D(scene,b);
  }
  addBalconyLifeDetails3D(scene,b);
  addRealBalconyWaterRisk3D(scene,b,focus);
  if(!focus && !open){
    const horizonMat = new THREE.MeshBasicMaterial({color:state.lightOn !== false ? 0x8fa18d : 0x344844, transparent:true, opacity:state.lightOn !== false ? .18 : .1, side:THREE.DoubleSide, depthWrite:false});
    [0.18,0.48,0.76].forEach((t,i)=>{
      const hill = new THREE.Mesh(new THREE.PlaneGeometry(b.w*(.22+i*.08),.18+i*.05),horizonMat);
      hill.position.set(b.x+b.w*t,.78+i*.16,b.z+b.d+1.05+i*.02);
      hill.renderOrder = 2;
      scene.add(hill);
    });
  }
}

function addBalconyInteriorShell3D(scene,b,focus=false){
  const lightOn = state.lightOn !== false;
  const wall = lightOn ? 0xe9e1d3 : 0x4c4c4a;
  const trim = lightOn ? 0xb79a72 : 0x5c4d3e;
  const tileA = lightOn ? 0xbfae95 : 0x3c3934;
  const tileB = lightOn ? 0xd6c7ae : 0x4a443c;
  const backZ = b.z + b.d - .035;
  const doorZ = b.z - .03;
  planeMat3D(scene,b.x+b.w/2,1.34,backZ,b.w,2.46,wall,0,0,'real-balcony-interior-back-wall',{rough:.9,transparent:true,opacity:focus ? .72 : .38,castShadow:false});
  box3D(scene,b.x+b.w/2,.08,backZ-.018,b.w,.16,.035,trim,'real-balcony-back-baseboard',{rough:.78,castShadow:false});
  box3D(scene,b.x+.03,1.2,b.z+b.d/2,.06,2.2,b.d,shade3D(wall,-8),'real-balcony-left-return-wall',{rough:.9,transparent:true,opacity:focus ? .82 : .46,castShadow:false});
  box3D(scene,b.x+b.w-.03,1.2,b.z+b.d/2,.06,2.2,b.d,shade3D(wall,-6),'real-balcony-right-return-wall',{rough:.9,transparent:true,opacity:focus ? .7 : .4,castShadow:false});
  box3D(scene,b.x+b.w/2,.04,doorZ,b.w,.08,.08,trim,'real-balcony-sliding-door-threshold',{rough:.72,castShadow:false});
  for(let x=b.x+.46;x<b.x+b.w-.18;x+=.46){
    box3D(scene,x,.018,b.z+b.d/2,.006,.006,b.d*.86,tileA,'real-balcony-floor-tile-long-joint',{rough:.96,castShadow:false,receiveShadow:false});
  }
  for(let z=b.z+.22;z<b.z+b.d-.08;z+=.26){
    box3D(scene,b.x+b.w/2,.019,z,b.w*.92,.005,.006,tileB,'real-balcony-floor-tile-cross-joint',{rough:.96,castShadow:false,receiveShadow:false});
  }
}

function addRealBalconyWaterRisk3D(scene,b,focus){
  focus = focus || false;
  const incident = activeIncident();
  if(!incident || !incidentIsOpen()) return;
  const washerX = b.x + .28;
  const washerZ = b.z + .2;
  const x = washerX + .16;
  const z = washerZ + .13;
  /* 水渍: 更大更明显 */
  var puddleR = focus ? .32 : .26;
  var puddleMat = new THREE.MeshBasicMaterial({color:0x3a9bc4, transparent:true, opacity:focus ? .56 : .48, side:THREE.DoubleSide, depthWrite:false});
  var water = new THREE.Mesh(new THREE.CircleGeometry(puddleR,48), puddleMat);
  water.rotation.x = -Math.PI/2;
  water.scale.set(focus ? 1.6 : 1.3, focus ? .82 : .66, 1);
  water.position.set(x, .026, z);
  water.name = 'real-balcony-water-leak-puddle';
  water.renderOrder = 24;
  water.userData = {waterRisk:true, baseOpacity:puddleMat.opacity, baseScale:[focus?1.6:1.3, focus?.82:.66, 1], phase:.2};
  scene.add(water);
  /* 涟漪环×3 */
  for(var ri=0;ri<3;ri++){
    var rippleMat = new THREE.MeshBasicMaterial({color:0x5eb7cf, transparent:true, opacity:0, side:THREE.DoubleSide, depthWrite:false});
    var ripple = new THREE.Mesh(new THREE.RingGeometry(puddleR*.3, puddleR*.35, 48), rippleMat);
    ripple.rotation.x = -Math.PI/2;
    ripple.scale.set(focus?1.6:1.3, focus?.82:.66, 1);
    ripple.position.set(x, .03, z);
    ripple.name = 'water-ripple-'+ri;
    ripple.renderOrder = 25;
    ripple.userData = {waterRipple:true, phase: ri*0.8, maxR:puddleR*(focus?1.6:1.3)};
    scene.add(ripple);
  }
  /* 红色警告发光区 */
  var glowMat = new THREE.MeshBasicMaterial({color:0xd33b32, transparent:true, opacity:.08, side:THREE.DoubleSide, depthWrite:false});
  var glow = new THREE.Mesh(new THREE.CircleGeometry(puddleR*1.8, 32), glowMat);
  glow.rotation.x = -Math.PI/2;
  glow.scale.set(focus?1.6:1.3, focus?.82:.66, 1);
  glow.position.set(x, .02, z);
  glow.name = 'water-leak-glow';
  glow.renderOrder = 23;
  glow.userData = {waterRisk:true, baseOpacity:.08, phase:2.5};
  scene.add(glow);
  /* 警报环 */
  var ringMat = new THREE.MeshBasicMaterial({color:0xff3b30, transparent:true, opacity:focus ? .85 : .72, side:THREE.DoubleSide, depthWrite:false});
  var ring = new THREE.Mesh(new THREE.RingGeometry(focus ? .12 : .09, focus ? .17 : .13, 42), ringMat);
  ring.rotation.x = -Math.PI/2;
  ring.position.set(x+.04, .035, z-.08);
  ring.name = 'real-balcony-water-leak-alert-ring';
  ring.renderOrder = 26;
  ring.userData = {waterRisk:true, baseOpacity:ringMat.opacity, baseScale:1, phase:1.1};
  scene.add(ring);
  cylinder3D(scene,x+.04,.08,z-.08,.026,.048,0xd33b32,'real-balcony-water-leak-sensor',20,{rough:.4,metalness:.04,castShadow:false});
  /* 警示柱: 更亮更明显 */
  var beacon = box3D(scene,x+.19,.36,z-.08,.022,.56,.022,0xff3b30,'real-balcony-water-leak-beacon',{rough:.3,transparent:true,opacity:focus?.85:.72,castShadow:false,renderOrder:25,emissive:0xff3b30,emissiveIntensity:.5});
  beacon.userData = {waterRisk:true, baseOpacity:focus?.55:.42, baseScale:1, phase:1.8};
  /* 顶部警示灯 */
  var beaconLight = new THREE.Mesh(new THREE.SphereGeometry(.015,12,8), new THREE.MeshBasicMaterial({color:0xff3b30, transparent:true, opacity:.9}));
  beaconLight.position.set(x+.19, .65, z-.08);
  beaconLight.name = 'beacon-light';
  beaconLight.userData = {waterRisk:true, baseOpacity:.9, phase:0};
  scene.add(beaconLight);
}

function addBalconyGlassGuard3D(scene,b){
  const lightOn = state.lightOn !== false;
  const open = state.windowOpen === true;
  const glassMat = new THREE.MeshBasicMaterial({
    color:lightOn ? 0xcfe2dd : 0x42545e,
    transparent:true,
    opacity:open ? .018 : .095,
    side:THREE.DoubleSide,
    depthWrite:false
  });
  const guard = new THREE.Mesh(new THREE.PlaneGeometry(b.w*.72,.56),glassMat);
  guard.position.set(b.x+b.w*.5,.62,b.z+b.d-.055);
  guard.name = 'real-balcony-clear-glass-guard';
  guard.renderOrder = 7;
  scene.add(guard);
  if(open) return;
  const railColor = lightOn ? 0x7f8a84 : 0x36424a;
  cylinder3D(scene,b.x+b.w/2,.93,b.z+b.d-.065,.006,b.w*.58,railColor,'real-balcony-thin-top-rail',14,{rotZ:Math.PI/2,rough:.58,metalness:.06,castShadow:false,transparent:true,opacity:.36});
  [.28,.72].forEach(t=>cylinder3D(scene,b.x+b.w*t,.58,b.z+b.d-.066,.004,.58,railColor,'real-balcony-minimal-guard-post',10,{rough:.58,metalness:.06,castShadow:false,transparent:true,opacity:.28}));
}

function addBalconyPictureView3D(scene,cfg,b){
  const lightOn = state.lightOn !== false;
  const focus = cfg.nodeId === 'balcony-node';
  const open = state.windowOpen === true;
  const alpha = focus ? 1 : (open ? .94 : .68);
  const z = b.z + b.d + 1.04;
  const x = b.x + b.w/2;
  const w = b.w * (focus ? 1.42 : 1.26);
  const skyH = 2.08;
  const skyY = 1.48;
  const skyMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x87d1fb : 0x172844, transparent:true, opacity:lightOn ? (focus ? .78 : open ? .84 : .56*alpha) : (focus ? .72 : .42*alpha), side:THREE.DoubleSide, depthWrite:false});
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(w,skyH),skyMat);
  sky.position.set(x,skyY,z);
  sky.name = 'real-balcony-picture-sky';
  sky.renderOrder = 1;
  scene.add(sky);
  addBalconyOutdoorDepth3D(scene,b,z,w,focus,alpha,lightOn);
  addBalconySkyDepthBands3D(scene,b,z,w,focus,alpha,lightOn);

  const lightBandMat = new THREE.MeshBasicMaterial({color:lightOn ? 0xffe5ad : 0x7d9aca, transparent:true, opacity:lightOn ? (focus ? .12 : .045)*alpha : .055*alpha, side:THREE.DoubleSide, depthWrite:false});
  const lightBand = new THREE.Mesh(new THREE.PlaneGeometry(w*.92,.46),lightBandMat);
  lightBand.position.set(x,2.18,z+.014);
  lightBand.name = 'real-balcony-picture-upper-light';
  lightBand.renderOrder = 2;
  lightBand.userData = {balconyGlow:true, baseOpacity:lightBandMat.opacity, phase:focus ? .3 : 1.2};
  scene.add(lightBand);
  if(focus) addBalconyWindowAtmosphere3D(scene,b,z,w,alpha,lightOn,open);
  if(focus) addBalconyNearViewDepth3D(scene,b,z,w,alpha,lightOn,open);

  if(lightOn) addBalconyPictureSun3D(scene,b,z,alpha);
  else addBalconyPictureMoon3D(scene,b,z,alpha);

  const hillBackMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x8bb485 : 0x22344a, transparent:true, opacity:lightOn ? (focus ? .34 : .42)*alpha : (focus ? .22 : .28)*alpha, side:THREE.DoubleSide, depthWrite:false});
  const hillFrontMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x6f9a68 : 0x152d2b, transparent:true, opacity:lightOn ? (focus ? .28 : .5)*alpha : (focus ? .18 : .34)*alpha, side:THREE.DoubleSide, depthWrite:false});
  [
    [x-w*.24,.76,w*.42,.36,hillBackMat,2],
    [x+w*.08,.83,w*.54,.44,hillBackMat,2],
    [x+w*.33,.72,w*.32,.32,hillFrontMat,3],
    [x-w*.02,.62,w*.7,.34,hillFrontMat,3]
  ].forEach(([hx,hy,hw,hh,mat,order],i)=>{
    const hill = new THREE.Mesh(new THREE.CircleGeometry(.5,36),mat);
    hill.scale.set(hw,hh,1);
    hill.position.set(hx,hy,z+.05+i*.025);
    hill.name = `real-balcony-picture-hill-${i}`;
    hill.renderOrder = order;
    scene.add(hill);
  });

  if(!focus){
    const groundMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x5e874c : 0x182820, transparent:true, opacity:lightOn ? .34*alpha : .22*alpha, side:THREE.DoubleSide, depthWrite:false});
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(w*.9,.22),groundMat);
    ground.position.set(x,.34,z+.1);
    ground.name = 'real-balcony-picture-garden-band';
    ground.renderOrder = 4;
    scene.add(ground);
  }else{
    const mistMat = new THREE.MeshBasicMaterial({color:lightOn ? 0xdfecca : 0x2e3d4f, transparent:true, opacity:lightOn ? .055 : .04, side:THREE.DoubleSide, depthWrite:false});
    const mist = new THREE.Mesh(new THREE.PlaneGeometry(w*.82,.16),mistMat);
    mist.position.set(x,.46,z+.12);
    mist.name = 'real-balcony-picture-soft-horizon-mist';
    mist.renderOrder = 4;
    scene.add(mist);
    addBalconyLowerExterior3D(scene,b,z,w,alpha,lightOn);
  }

  const cloudWin = {x:x-w*.5,w,sill:.42,h:1.95};
  addSkyCloudPuffSouth3D(scene,cloudWin,z,.28,.75,.92,new THREE.MeshBasicMaterial({color:lightOn ? 0xffffff : 0xaebed4, transparent:true, opacity:lightOn ? .42*alpha : .11*alpha, side:THREE.DoubleSide, depthWrite:false}),'real-balcony-picture-drifting-cloud-left',{phase:.4,order:8,opacity:lightOn ? .42*alpha : .11*alpha,drift:w*(focus ? .06 : .022),thin:!lightOn});
  addSkyCloudPuffSouth3D(scene,cloudWin,z,.64,.9,.72,new THREE.MeshBasicMaterial({color:lightOn ? 0xffffff : 0xaebed4, transparent:true, opacity:lightOn ? .3*alpha : .085*alpha, side:THREE.DoubleSide, depthWrite:false}),'real-balcony-picture-drifting-cloud-right',{phase:2.2,order:8,opacity:lightOn ? .3*alpha : .085*alpha,drift:w*(focus ? .048 : .018),thin:true});

  if(!lightOn) addBalconyPictureStars3D(scene,b,z,alpha);
  addBalconyPictureBirds3D(scene,b,z,lightOn,alpha);

  const frame = lightOn ? 0xd0b58a : 0x59636a;
  if(!focus && !open){
    box3D(scene,x,2.54,z-.035,w*.92,.035,.035,frame,'real-balcony-picture-top-frame',{rough:.64,metalness:.04,castShadow:false,renderOrder:10,transparent:open,opacity:open ? .28 : 1});
    box3D(scene,x,.42,z-.035,w*.92,.035,.035,frame,'real-balcony-picture-bottom-frame',{rough:.64,metalness:.04,castShadow:false,renderOrder:10,transparent:open,opacity:open ? .22 : 1});
  }
  const sideFrameOpacity = focus ? .28 : (open ? .08 : .9);
  if(!open){
    box3D(scene,x-w*.46,1.48,z-.035,.024,2.04,.024,frame,'real-balcony-picture-left-frame',{rough:.64,metalness:.04,castShadow:false,renderOrder:10,transparent:focus,opacity:sideFrameOpacity});
    box3D(scene,x+w*.46,1.48,z-.035,.024,2.04,.024,frame,'real-balcony-picture-right-frame',{rough:.64,metalness:.04,castShadow:false,renderOrder:10,transparent:focus,opacity:sideFrameOpacity});
  }
}

function addBalconyWindowAtmosphere3D(scene,b,z,w,alpha,lightOn,open){
  const x = b.x + b.w/2;
  const veilMat = new THREE.MeshBasicMaterial({
    color:lightOn ? 0xf7efe0 : 0x7f9ab2,
    transparent:true,
    opacity:(open ? .028 : .018) * alpha,
    side:THREE.DoubleSide,
    depthWrite:false
  });
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(w*.86,1.62),veilMat);
  veil.position.set(x,1.38,z+.24);
  veil.name = open ? 'real-balcony-open-window-air-light-veil' : 'real-balcony-closed-window-soft-glass-veil';
  veil.renderOrder = 9;
  scene.add(veil);

  if(lightOn){
    const rayMat = new THREE.MeshBasicMaterial({color:0xffd79a, transparent:true, opacity:open ? .05 : .024, side:THREE.DoubleSide, depthWrite:false});
    [.38,.58].forEach((t,i)=>{
      const ray = new THREE.Mesh(new THREE.PlaneGeometry(w*(.12+i*.035),1.22-i*.18),rayMat.clone());
      ray.position.set(b.x+b.w*t,1.18-i*.04,z-.34-i*.1);
      ray.rotation.x = -.74;
      ray.rotation.z = -.16;
      ray.name = 'real-balcony-window-soft-sun-volume';
      ray.renderOrder = 12;
      scene.add(ray);
    });
  }
}

function addBalconyNearViewDepth3D(scene,b,z,w,alpha,lightOn,open){
  const x = b.x + b.w/2;
  const frameColor = lightOn ? 0xb7aa9b : 0x4d5961;
  const ledgeColor = lightOn ? 0x9c8970 : 0x39444c;
  const glassColor = lightOn ? 0xe2f1ed : 0x718997;
  const lowerLedge = new THREE.Mesh(
    new THREE.PlaneGeometry(w*.78,.075),
    new THREE.MeshBasicMaterial({color:ledgeColor, transparent:true, opacity:(lightOn ? .42 : .28)*alpha, side:THREE.DoubleSide, depthWrite:false})
  );
  lowerLedge.position.set(x,.315,z+.34);
  lowerLedge.name = 'real-balcony-near-exterior-stone-ledge';
  lowerLedge.renderOrder = 13;
  scene.add(lowerLedge);
  const sillShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(w*.72,.035),
    new THREE.MeshBasicMaterial({color:0x1f2a28, transparent:true, opacity:(lightOn ? .12 : .22)*alpha, side:THREE.DoubleSide, depthWrite:false})
  );
  sillShadow.position.set(x,.285,z+.38);
  sillShadow.name = 'real-balcony-near-ledge-shadow-line';
  sillShadow.renderOrder = 14;
  scene.add(sillShadow);
  const railMat = new THREE.MeshBasicMaterial({color:frameColor, transparent:true, opacity:(open ? .18 : .26)*alpha, side:THREE.DoubleSide, depthWrite:false});
  [.18,.5,.82].forEach((t,i)=>{
    const post = new THREE.Mesh(new THREE.PlaneGeometry(.018,.62),railMat.clone());
    post.position.set(b.x+b.w*t,.61,z+.31+i*.014);
    post.name = 'real-balcony-near-glass-guard-aligned-post';
    post.renderOrder = 15;
    scene.add(post);
  });
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(w*.68,.44),
    new THREE.MeshBasicMaterial({color:glassColor, transparent:true, opacity:(open ? .035 : .075)*alpha, side:THREE.DoubleSide, depthWrite:false})
  );
  glass.position.set(x,.61,z+.29);
  glass.name = open ? 'real-balcony-near-open-guard-clear-glass' : 'real-balcony-near-closed-guard-reflection';
  glass.renderOrder = 14;
  scene.add(glass);
}

function addFocusedBalconyGuard3D(scene,b){
  const lightOn = state.lightOn !== false;
  const glassMat = new THREE.MeshBasicMaterial({
    color:lightOn ? 0xd7ebe6 : 0x455660,
    transparent:true,
    opacity:lightOn ? .105 : .16,
    side:THREE.DoubleSide,
    depthWrite:false
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(b.w*.82,.62),glassMat);
  glass.position.set(b.x+b.w*.5,.62,b.z+b.d-.075);
  glass.name = 'real-balcony-focus-lower-guard-glass';
  glass.renderOrder = 18;
  scene.add(glass);
  const rail = lightOn ? 0x7f8a84 : 0x36424a;
  cylinder3D(scene,b.x+b.w/2,.95,b.z+b.d-.09,.007,b.w*.72,rail,'real-balcony-focus-top-rail',16,{rotZ:Math.PI/2,rough:.56,metalness:.08,castShadow:false,transparent:true,opacity:lightOn ? .52 : .34});
  cylinder3D(scene,b.x+b.w/2,.34,b.z+b.d-.09,.005,b.w*.72,rail,'real-balcony-focus-bottom-rail',14,{rotZ:Math.PI/2,rough:.56,metalness:.06,castShadow:false,transparent:true,opacity:lightOn ? .28 : .22});
  [.18,.38,.62,.82].forEach(t=>{
    cylinder3D(scene,b.x+b.w*t,.61,b.z+b.d-.092,.004,.58,rail,'real-balcony-focus-guard-post',10,{rough:.58,metalness:.06,castShadow:false,transparent:true,opacity:lightOn ? .32 : .24});
  });
}

function addBalconySkyDepthBands3D(scene,b,z,w,focus,alpha,lightOn){
  const x = b.x + b.w/2;
  const bands = lightOn
    ? [[2.28,.36,0xffe7b5,.1],[1.74,.62,0xb7ddf0,.12],[1.08,.42,0xddeedc,.08]]
    : [[2.18,.38,0x24395a,.12],[1.58,.62,0x1b2c46,.14],[.98,.42,0x15283a,.1]];
  bands.forEach(([y,h,color,opacity],i)=>{
    const mat = new THREE.MeshBasicMaterial({color, transparent:true, opacity:opacity * alpha * (focus ? 1.1 : .82), side:THREE.DoubleSide, depthWrite:false});
    const band = new THREE.Mesh(new THREE.PlaneGeometry(w*(.98-i*.08),h),mat);
    band.position.set(x,y,z+.025+i*.02);
    band.name = `real-balcony-sky-depth-band-${i}`;
    band.renderOrder = 2+i;
    scene.add(band);
  });
}

function addBalconyLowerExterior3D(scene,b,z,w,alpha,lightOn){
  const x = b.x + b.w/2;
  const ledgeMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x9f8f78 : 0x354049, transparent:true, opacity:lightOn ? .34*alpha : .22*alpha, side:THREE.DoubleSide, depthWrite:false});
  const ledge = new THREE.Mesh(new THREE.PlaneGeometry(w*.72,.08),ledgeMat);
  ledge.position.set(x,.38,z+.22);
  ledge.name = 'real-balcony-lower-outdoor-ledge';
  ledge.renderOrder = 6;
  scene.add(ledge);
  const planterY = .43;
  const planterZ = z + .29;
  const planterColor = lightOn ? 0x8e6c4c : 0x3b3129;
  const rimColor = lightOn ? 0xa98763 : 0x57473b;
  const soilColor = lightOn ? 0x5f4937 : 0x2a241f;
  const leafColors = lightOn ? [0x5f8751,0x7aa267,0x88ad71] : [0x223428,0x2a4031,0x314838];
  [-.24,.24].forEach((dx,idx)=>{
    const px = x + w*dx;
    roundedBox3D(scene,px,planterY,planterZ,.42,.11,.16,planterColor,`real-balcony-lower-planter-${idx}`,.03,{rough:.88,castShadow:false,transparent:true,opacity:lightOn ? .86*alpha : .46*alpha});
    box3D(scene,px,planterY+.052,planterZ,.38,.018,.13,rimColor,`real-balcony-lower-planter-rim-${idx}`,{rough:.76,castShadow:false,transparent:true,opacity:lightOn ? .9*alpha : .52*alpha});
    box3D(scene,px,planterY+.065,planterZ,.34,.016,.1,soilColor,`real-balcony-lower-planter-soil-${idx}`,{rough:.96,castShadow:false,transparent:true,opacity:lightOn ? .82*alpha : .44*alpha});
    [[-.1,.06,.06],[0,.09,.075],[.11,.05,.058],[-.04,.13,.05],[.06,.14,.048]].forEach(([ox,oy,r],leafIdx)=>{
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(r,14,10), new THREE.MeshBasicMaterial({color:leafColors[(leafIdx+idx)%leafColors.length], transparent:true, opacity:lightOn ? .72*alpha : .34*alpha, side:THREE.DoubleSide, depthWrite:false}));
      leaf.scale.set(1.18,.72,.92);
      leaf.position.set(px+ox,planterY+oy,planterZ+.01*leafIdx);
      leaf.renderOrder = 8;
      scene.add(leaf);
    });
  });
}

function addBalconyOutdoorDepth3D(scene,b,z,w,focus,alpha,lightOn){
  const x = b.x + b.w/2;
  const depthAlpha = (focus ? .9 : .48) * alpha;
  const cityBaseMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x91a6a0 : 0x263444, transparent:true, opacity:(lightOn ? .12 : .18)*depthAlpha, side:THREE.DoubleSide, depthWrite:false});
  [
    [.5,.68,.72,.055,z+.58],
    [.47,.77,.56,.045,z+.78],
    [.54,.86,.62,.038,z+1.02]
  ].forEach(([tx,ty,tw,th,tz],i)=>{
    const band = new THREE.Mesh(new THREE.PlaneGeometry(w*tw,th),cityBaseMat.clone());
    band.position.set(x+w*(tx-.5),ty,tz);
    band.name = `real-balcony-outdoor-parallax-ground-line-${i}`;
    band.renderOrder = 4;
    scene.add(band);
  });
  const railMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x62746b : 0x243443, transparent:true, opacity:lightOn ? .34*depthAlpha : .22*depthAlpha, side:THREE.DoubleSide, depthWrite:false});
  const railY = .54;
  const railZ = z + .32;
  const rail = new THREE.Mesh(new THREE.PlaneGeometry(w*.78,.026),railMat);
  rail.position.set(x,railY,railZ);
  rail.name = 'real-balcony-outdoor-depth-rail';
  rail.renderOrder = 5;
  scene.add(rail);
  [0.2,0.38,0.58,0.78].forEach((t,i)=>{
    const post = new THREE.Mesh(new THREE.PlaneGeometry(.018,.32),railMat.clone());
    post.position.set(x-w*.39+w*.78*t,railY-.12,railZ+.015*i);
    post.name = 'real-balcony-outdoor-depth-post';
    post.renderOrder = 5;
    scene.add(post);
  });
  const buildingMat = new THREE.MeshBasicMaterial({color:lightOn ? 0xb8b0a2 : 0x1d2630, transparent:true, opacity:lightOn ? .13*depthAlpha : .2*depthAlpha, side:THREE.DoubleSide, depthWrite:false});
  const windowMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x6e8586 : 0xffd98a, transparent:true, opacity:lightOn ? .08*depthAlpha : .34*depthAlpha, side:THREE.DoubleSide, depthWrite:false});
  [
    [-.3,.92,.34,.62,z+.68],
    [.06,1.02,.26,.52,z+.82],
    [.34,.88,.32,.72,z+.98]
  ].forEach(([dx,cy,bw,bh,bz],i)=>{
    const bx = x + w*dx;
    const body = new THREE.Mesh(new THREE.PlaneGeometry(w*bw,bh),buildingMat.clone());
    body.position.set(bx,cy,bz);
    body.name = `real-balcony-outdoor-depth-building-${i}`;
    body.renderOrder = 3;
    scene.add(body);
    for(let row=0; row<3; row++){
      [-.22,0,.22].forEach(col=>{
        const pane = new THREE.Mesh(new THREE.PlaneGeometry(w*bw*.11,bh*.052),windowMat.clone());
        pane.position.set(bx+col*w*bw,cy-bh*.18+row*bh*.18,bz+.01);
        pane.renderOrder = 4;
        scene.add(pane);
      });
    }
  });
  const treeMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x4f7f4b : 0x16251f, transparent:true, opacity:lightOn ? .24*depthAlpha : .18*depthAlpha, side:THREE.DoubleSide, depthWrite:false});
  [0.16,0.46,0.72].forEach((t,i)=>{
    const canopy = new THREE.Mesh(new THREE.CircleGeometry(.16+i*.025,24),treeMat.clone());
    canopy.scale.set(1.32,.7,1);
    canopy.position.set(x-w*.42+w*.84*t,.48+i*.04,z+.46+i*.11);
    canopy.name = 'real-balcony-outdoor-depth-greenery';
    canopy.renderOrder = 6;
    scene.add(canopy);
  });
  if(focus) addBalconyDistantLandscapeDetails3D(scene,b,z,w,alpha,lightOn);
}

function addBalconyDistantLandscapeDetails3D(scene,b,z,w,alpha,lightOn){
  const x = b.x + b.w/2;
  const lineMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x7f9188 : 0x273748, transparent:true, opacity:(lightOn ? .12 : .2) * alpha, side:THREE.DoubleSide, depthWrite:false});
  [
    [-.34,1.12,.26,.018,z+1.1],
    [.02,1.22,.18,.016,z+1.18],
    [.27,1.06,.22,.017,z+1.28]
  ].forEach(([dx,y,ww,hh,zz],i)=>{
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(w*ww,hh),lineMat.clone());
    roof.position.set(x+w*dx,y,zz);
    roof.name = `real-balcony-distant-roofline-${i}`;
    roof.renderOrder = 4;
    scene.add(roof);
  });
  const foregroundMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x5f8b5a : 0x1a2a23, transparent:true, opacity:(lightOn ? .16 : .12) * alpha, side:THREE.DoubleSide, depthWrite:false});
  [.22,.36,.64,.78].forEach((t,i)=>{
    const shrub = new THREE.Mesh(new THREE.CircleGeometry(.055+i*.006,18),foregroundMat.clone());
    shrub.scale.set(1.85,.62,1);
    shrub.position.set(x-w*.43+w*.86*t,.57+(i%2)*.035,z+.34+i*.024);
    shrub.name = 'real-balcony-distant-shrub-layer';
    shrub.renderOrder = 7;
    scene.add(shrub);
  });
}

function createCartoonSunRayGeometry3D(width,length){
  const half = width / 2;
  const cap = Math.min(half, length / 2);
  const shape = new THREE.Shape();
  shape.moveTo(-half, cap);
  shape.lineTo(-half, length - cap);
  shape.quadraticCurveTo(-half, length, 0, length);
  shape.quadraticCurveTo(half, length, half, length - cap);
  shape.lineTo(half, cap);
  shape.quadraticCurveTo(half, 0, 0, 0);
  shape.quadraticCurveTo(-half, 0, -half, cap);
  return new THREE.ShapeGeometry(shape, 10);
}

function addCartoonSunBurst3D(scene,x,y,z,options={}){
  const count = options.count || 18;
  const radius = options.radius || .32;
  const length = options.length || .085;
  const width = options.width || .024;
  const alpha = options.alpha ?? 1;
  const color = options.color || 0xffcf63;
  const opacityEven = options.opacityEven ?? .62;
  const opacityOdd = options.opacityOdd ?? .46;
  const group = new THREE.Group();
  group.position.set(x,y,z);
  group.name = options.name || 'cartoon-sun-burst';
  group.renderOrder = options.renderOrder ?? 10;
  group.userData = {sunBurstGroup:true, baseRotation:options.rotation || 0, phase:options.phase || 0};
  scene.add(group);
  for(let i=0;i<count;i++){
    const angle = i * Math.PI * 2 / count;
    const rayLength = length * (i % 2 ? .78 : 1);
    const geom = createCartoonSunRayGeometry3D(width * (i % 2 ? .86 : 1), rayLength);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent:true,
      opacity:(i % 2 ? opacityOdd : opacityEven) * alpha,
      side:THREE.DoubleSide,
      depthWrite:false
    });
    const ray = new THREE.Mesh(geom, mat);
    ray.position.set(Math.sin(angle) * radius, Math.cos(angle) * radius, i * .001);
    ray.rotation.z = -angle;
    ray.name = `${group.name}-ray-${i}`;
    ray.renderOrder = (options.renderOrder ?? 10) + 1;
    ray.userData = {sunRayBurst:true, angle, baseRadius:radius, baseZ:i*.001, travel:options.travel || .022, baseOpacity:mat.opacity, phase:(options.phase || 0) + i*.06};
    group.add(ray);
  }
  return group;
}

function addBalconyPictureSun3D(scene,b,z,alpha){
  const sx = b.x + b.w*.72;
  const sy = 2.18;
  const glow = new THREE.Mesh(new THREE.CircleGeometry(.5,56),new THREE.MeshBasicMaterial({color:0xffe1a0, transparent:true, opacity:.28*alpha, side:THREE.DoubleSide, depthWrite:false}));
  glow.position.set(sx,sy,z+.18);
  glow.renderOrder = 9;
  scene.add(glow);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(.28,56),new THREE.MeshBasicMaterial({color:0xffb12f, transparent:true, opacity:1*alpha, side:THREE.DoubleSide, depthWrite:false}));
  sun.position.set(sx,sy,z+.2);
  sun.renderOrder = 12;
  sun.userData = {sunPulse:true, baseOpacity:1*alpha, baseScale:1, phase:.5};
  scene.add(sun);
  addCartoonSunBurst3D(scene,sx,sy,z+.185,{count:14,radius:.31,length:.05,width:.014,travel:.028,alpha:alpha*.7,name:'real-balcony-cartoon-sun-rays',renderOrder:10,phase:.5,color:0xffd57a,opacityEven:.22,opacityOdd:.12});
}

function addBalconyPictureMoon3D(scene,b,z,alpha){
  const mx = b.x + b.w*.73;
  const my = 2.16;
  addCrescentMoon3D(scene,mx,my,z+.2,.2,alpha,'real-balcony-picture-crescent-moon',{renderOrder:10});
}

function addCrescentMoon3D(scene,x,y,z,r,alpha,name,options={}){
  const shape = new THREE.Shape();
  const tipX = r * .34;
  shape.moveTo(tipX,r*.96);
  shape.bezierCurveTo(-r*1.08,r*.82,-r*1.08,-r*.82,tipX,-r*.96);
  shape.bezierCurveTo(-r*.46,-r*.58,-r*.46,r*.58,tipX,r*.96);
  const moon = new THREE.Mesh(
    new THREE.ShapeGeometry(shape,36),
    new THREE.MeshBasicMaterial({color:options.color || 0xf2eccf, transparent:true, opacity:(options.opacity ?? .92) * alpha, side:THREE.DoubleSide, depthWrite:false})
  );
  moon.position.set(x,y,z);
  moon.rotation.z = options.rotation ?? -.08;
  moon.name = name;
  moon.renderOrder = options.renderOrder ?? 10;
  scene.add(moon);
  return moon;
}

function addBalconyPictureStars3D(scene,b,z,alpha){
  const starMat = new THREE.MeshBasicMaterial({color:0xfff4c8, transparent:true, opacity:.72*alpha, side:THREE.DoubleSide, depthWrite:false});
  [[.14,2.18,.01],[.24,1.86,.007],[.36,2.32,.008],[.48,1.98,.006],[.58,2.38,.009],[.86,1.9,.007],[.9,2.28,.006]].forEach(([t,y,r],i)=>{
    const star = new THREE.Mesh(new THREE.CircleGeometry(r,10),starMat);
    star.position.set(b.x+b.w*t,y,z+.16+i*.006);
    star.renderOrder = 9;
    scene.add(star);
  });
}

function addBalconyPictureBirds3D(scene,b,z,lightOn,alpha){
  if(!lightOn) return;
  const color = 0x465654;
  [[.3,1.92,.68],[.43,2.05,.58],[.57,1.87,.5]].forEach(([t,y,s],i)=>{
    const x = b.x + b.w*t;
    const bird = new THREE.Group();
    bird.name = `real-balcony-picture-moving-bird-${i}`;
    bird.position.set(x,y,z+.22+i*.01);
    bird.rotation.z = -.018 + i*.012;
    bird.userData = {balconyBird:true, baseX:x, baseY:y, phase:i*.21, drift:b.w*.34, speed:.048+i*.009};
    scene.add(bird);
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0,0);
    wingShape.quadraticCurveTo(.032*s,.012*s,.084*s,.018*s,.126*s,.008*s);
    wingShape.quadraticCurveTo(.098*s,-.01*s,.05*s,-.014*s,0,-.004*s);
    const wingGeom = new THREE.ShapeGeometry(wingShape,12);
    const wingMat = new THREE.MeshBasicMaterial({color, transparent:true, opacity:.54*alpha, side:THREE.DoubleSide, depthWrite:false});
    const left = new THREE.Mesh(wingGeom,wingMat);
    const right = new THREE.Mesh(wingGeom.clone(),wingMat.clone());
    left.position.x = -.012*s;
    right.position.x = .012*s;
    left.rotation.z = .18;
    right.rotation.z = Math.PI - .18;
    left.userData = {wingSide:'left'};
    right.userData = {wingSide:'right'};
    left.renderOrder = 11;
    right.renderOrder = 11;
    const body = new THREE.Mesh(
      new THREE.CircleGeometry(.012*s,14),
      new THREE.MeshBasicMaterial({color, transparent:true, opacity:.6*alpha, depthWrite:false})
    );
    body.scale.set(1.9,.72,1);
    body.position.set(.002*s,0,.002);
    body.renderOrder = 12;
    const head = new THREE.Mesh(
      new THREE.CircleGeometry(.005*s,10),
      new THREE.MeshBasicMaterial({color, transparent:true, opacity:.62*alpha, depthWrite:false})
    );
    head.position.set(.024*s,.004*s,.003);
    head.renderOrder = 12;
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0,0);
    tailShape.lineTo(-.026*s,.011*s);
    tailShape.lineTo(-.018*s,0);
    tailShape.lineTo(-.03*s,-.012*s);
    tailShape.closePath();
    const tail = new THREE.Mesh(
      new THREE.ShapeGeometry(tailShape,8),
      new THREE.MeshBasicMaterial({color, transparent:true, opacity:.56*alpha, side:THREE.DoubleSide, depthWrite:false})
    );
    tail.position.set(-.018*s,-.001*s,.001);
    tail.renderOrder = 11;
    bird.add(left);
    bird.add(right);
    bird.add(body);
    bird.add(head);
    bird.add(tail);
  });
}

function addBalconyLifeDetails3D(scene,b){
  const focus = currentTourNode()?.id === 'balcony-node';
  const open = state.windowOpen === true;
  const washerX = b.x + .28;
  const washerZ = b.z + .2;
  addContactShadow3D(scene,washerX,washerZ,focus ? .68 : .46,focus ? .54 : .4,focus ? .18 : .1);
  roundedBox3D(scene,washerX,.43,washerZ,.58,.86,.5,0xf2f2ed,'real-balcony-washer',.06,{rough:.64});
  box3D(scene,washerX,.88,washerZ-.252,.5,.055,.028,0xd9dcd6,'real-balcony-washer-top-seam',{rough:.56,castShadow:false});
  cylinder3D(scene,washerX,.52,washerZ-.258,.17,.024,0xa9c8cc,'real-balcony-washer-door-glass',40,{rotX:Math.PI/2,rough:.26,metalness:.03});
  cylinder3D(scene,washerX,.52,washerZ-.272,.195,.018,0xd6d8d3,'real-balcony-washer-door-ring',40,{rotX:Math.PI/2,rough:.4,metalness:.04});
  box3D(scene,washerX-.13,.76,washerZ-.26,.2,.03,.025,0xc8cbc5,'real-balcony-washer-control-panel',{rough:.5,castShadow:false});
  box3D(scene,washerX+.16,.77,washerZ-.26,.034,.034,.026,0x59615c,'real-balcony-washer-button',{rough:.44,castShadow:false});
  addBalconyUtilityCabinet3D(scene,b,focus);
  addBalconyDrainAndPipe3D(scene,b,washerX,washerZ,focus);
  if(false) addCompactFloorPlant3D(scene,b.x+b.w-.34,b.z+.22,focus ? .38 : .5,'real-balcony-shaped-plant');
  if(false && !focus && !open){
    cylinder3D(scene,b.x+b.w*.78,1.48,b.z+.58,.016,b.w*.3,0xb6b0a2,'real-balcony-side-drying-rail',16,{rotZ:Math.PI/2,rough:.52,metalness:.08});
    [0.7,0.8,0.9].forEach((t,i)=>{
      const x = b.x + b.w*t;
      roundedBox3D(scene,x,1.13,b.z+.58,.14,.42,.016,[0xe8d7c2,0xcfded8,0xd7c4d8][i],'real-balcony-side-hanging-cloth',.018,{rough:.94,transparent:true,opacity:.58});
    });
  }
}

function addBalconyUtilityCabinet3D(scene,b,focus=false){
  const x = b.x + .78;
  const z = b.z + .22;
  roundedBox3D(scene,x,.88,z,.42,1.32,.36,0xd9c7a6,'real-balcony-utility-tall-cabinet',.045,{rough:.82,transparent:focus,opacity:focus ? .86 : .72});
  box3D(scene,x,.88,z-.19,.34,1.06,.026,0xb18a5e,'real-balcony-utility-cabinet-door',{rough:.78,castShadow:false,transparent:focus,opacity:focus ? .72 : .58});
  box3D(scene,x+.11,.92,z-.208,.025,.52,.018,0x6f4d35,'real-balcony-utility-cabinet-handle',{rough:.62,castShadow:false});
}

function addBalconyDrainAndPipe3D(scene,b,washerX,washerZ,focus=false){
  const drainX = washerX + .36;
  const drainZ = washerZ + .08;
  cylinder3D(scene,drainX,.028,drainZ,.075,.012,0x66736f,'real-balcony-floor-drain-ring',30,{rough:.46,metalness:.12,castShadow:false});
  cylinder3D(scene,drainX,.036,drainZ,.045,.01,0x2d3835,'real-balcony-floor-drain-dark-core',24,{rough:.52,castShadow:false});
  box3D(scene,washerX+.23,.09,washerZ+.24,.045,.045,.44,0xc7c0b4,'real-balcony-drain-hose',{rough:.82,castShadow:false,transparent:true,opacity:focus ? .86 : .68});
  box3D(scene,b.x+.08,.82,b.z+.32,.05,1.18,.05,0xd8d2c7,'real-balcony-wall-water-pipe',{rough:.7,castShadow:false});
  box3D(scene,b.x+.08,.34,b.z+.32,.09,.055,.09,0x9f8f7b,'real-balcony-pipe-valve',{rough:.52,metalness:.08,castShadow:false});
}

function addRealPublicCeilingGuides3D(scene,cfg,roomH){
}

function addRealSouthWall3D(scene,cfg,color,roomH){
  const win = cfg.window?.wall === 'south' ? cfg.window : null;
  if(!win){
    planeMat3D(scene,cfg.w/2,roomH/2,cfg.d,cfg.w,roomH,color,0,0,'real-south-wall',{rough:.88});
    return;
  }
  const x1 = clamp(win.x,0,cfg.w);
  const x2 = clamp(win.x + win.w,0,cfg.w);
  const y1 = clamp(win.sill,0,roomH);
  const y2 = clamp(win.sill + win.h,0,roomH);
  addWallPanelSouth3D(scene,0,x1,0,roomH,cfg.d,color,'real-south-wall-left');
  addWallPanelSouth3D(scene,x2,cfg.w,0,roomH,cfg.d,color,'real-south-wall-right');
  addWallPanelSouth3D(scene,x1,x2,0,y1,cfg.d,color,'real-south-wall-under-window');
  addWallPanelSouth3D(scene,x1,x2,y2,roomH,cfg.d,color,'real-south-wall-over-window');
  addSouthOpeningReturns3D(scene,cfg,win,color,roomH);
}

function addRealNorthWall3D(scene,cfg,color,roomH){
  planeMat3D(scene,cfg.w/2,roomH/2,0,cfg.w,roomH,shade3D(color,8),0,Math.PI,'real-north-wall',{rough:.88});
}

function addRealNorthWindowWall3D(scene,cfg,color,roomH){
  const win = cfg.window;
  const x1 = clamp(win.x,0,cfg.w);
  const x2 = clamp(win.x + win.w,0,cfg.w);
  const y1 = clamp(win.sill,0,roomH);
  const y2 = clamp(win.sill + win.h,0,roomH);
  addWallPanelNorth3D(scene,0,x1,0,roomH,color,'real-north-wall-left');
  addWallPanelNorth3D(scene,x2,cfg.w,0,roomH,color,'real-north-wall-right');
  addWallPanelNorth3D(scene,x1,x2,0,y1,shade3D(color,-3),'real-north-wall-under-window');
  addWallPanelNorth3D(scene,x1,x2,y2,roomH,shade3D(color,8),'real-north-wall-over-window');
  addNorthOpeningReturns3D(scene,cfg,win,color,roomH);
}

function addWallPanelNorth3D(scene,x1,x2,y1,y2,color,name){
  const w = x2 - x1;
  const h = y2 - y1;
  if(w <= .025 || h <= .025) return;
  planeMat3D(scene,x1+w/2,y1+h/2,0,w,h,color,0,Math.PI,name,{rough:.88});
}

function addNorthOpeningReturns3D(scene,cfg,win,color,roomH){
  const x1 = clamp(win.x,0,cfg.w);
  const x2 = clamp(win.x + win.w,0,cfg.w);
  const y1 = clamp(win.sill,0,roomH);
  const y2 = clamp(win.sill + win.h,0,roomH);
  const h = Math.max(.02,y2-y1);
  const midY = y1 + h/2;
  const reveal = shade3D(color,-10);
  box3D(scene,x1,midY,.04,.08,h,.18,reveal,'real-north-window-left-return',{rough:.9});
  box3D(scene,x2,midY,.04,.08,h,.18,reveal,'real-north-window-right-return',{rough:.9});
  if(roomH - y2 > .03) box3D(scene,(x1+x2)/2,y2,.04,x2-x1+.14,.08,.18,reveal,'real-north-window-top-return',{rough:.9});
  if(y1 > .03) box3D(scene,(x1+x2)/2,y1,.04,x2-x1+.14,.08,.18,reveal,'real-north-window-bottom-return',{rough:.9});
}

function addRealEntryNorthDoor3D(scene,cfg,color,roomH){
  const doorW = mm3D(REAL_HOME_SPEC.door.entry.w);
  const doorH = mm3D(REAL_HOME_SPEC.door.entry.h);
  const x1 = (cfg.w-doorW)/2;
  const x2 = x1 + doorW;
  addWallPanelNorth3D(scene,0,x1,0,roomH,color,'real-entry-north-wall-left');
  addWallPanelNorth3D(scene,x2,cfg.w,0,roomH,color,'real-entry-north-wall-right');
  addWallPanelNorth3D(scene,x1,x2,doorH,roomH,shade3D(color,8),'real-entry-north-wall-above-door');
  box3D(scene,cfg.w/2,doorH/2,.018,doorW,doorH,.05,0x7c5840,'real-entry-front-door',{rough:.72});
  box3D(scene,x1,doorH/2,.055,.07,doorH+.12,.11,0xb99064,'real-entry-door-left-frame',{rough:.7});
  box3D(scene,x2,doorH/2,.055,.07,doorH+.12,.11,0xb99064,'real-entry-door-right-frame',{rough:.7});
  box3D(scene,cfg.w/2,doorH+.035,.055,doorW+.16,.07,.11,0xb99064,'real-entry-door-top-frame',{rough:.7});
  box3D(scene,cfg.w/2,.04,.13,doorW+.24,.08,.18,0x9a6f49,'real-entry-door-threshold',{rough:.76});
  cylinder3D(scene,x2-.18,1.04,.095,.035,.045,0xd0ae68,'real-entry-door-handle',18,{rotX:Math.PI/2,rough:.42,metalness:.16});
}

function addWallPanelSouth3D(scene,x1,x2,y1,y2,z,color,name,options={}){
  const w = x2 - x1;
  const h = y2 - y1;
  if(w <= .025 || h <= .025) return;
  planeMat3D(scene,x1+w/2,y1+h/2,z,w,h,color,0,0,name,Object.assign({rough:.88},options));
}

function addSouthOpeningReturns3D(scene,cfg,win,color,roomH,options={}){
  const x1 = clamp(win.x,0,cfg.w);
  const x2 = clamp(win.x + win.w,0,cfg.w);
  const y1 = clamp(win.sill,0,roomH);
  const y2 = clamp(win.sill + win.h,0,roomH);
  const h = Math.max(.02,y2-y1);
  const midY = y1 + h/2;
  const reveal = shade3D(color,-10);
  const matOptions = options.opacity !== undefined ? {material:mat3D(reveal,.9,{transparent:true,opacity:options.opacity,depthWrite:false}),castShadow:false} : {};
  box3D(scene,x1,midY,cfg.d-.04,.08,h,.18,reveal,'real-window-left-return',Object.assign({rough:.9},matOptions));
  box3D(scene,x2,midY,cfg.d-.04,.08,h,.18,reveal,'real-window-right-return',Object.assign({rough:.9},matOptions));
  if(roomH - y2 > .03) box3D(scene,(x1+x2)/2,y2,cfg.d-.04,x2-x1+.14,.08,.18,reveal,'real-window-top-return',Object.assign({rough:.9},matOptions));
  if(y1 > .03) box3D(scene,(x1+x2)/2,y1,cfg.d-.04,x2-x1+.14,.08,.18,reveal,'real-window-bottom-return',Object.assign({rough:.9},matOptions));
}

function addRealWestWall3D(scene,cfg,color,roomH){
  const win = cfg.window?.wall === 'west' ? cfg.window : null;
  if(!win){
    planeMat3D(scene,0,roomH/2,cfg.d/2,cfg.d,roomH,color,0,Math.PI/2,'real-west-wall',{rough:.88});
    return;
  }
  const z1 = clamp(win.z,0,cfg.d);
  const z2 = clamp(win.z + win.w,0,cfg.d);
  const y1 = clamp(win.sill,0,roomH);
  const y2 = clamp(win.sill + win.h,0,roomH);
  addWallPanelWest3D(scene,0,z1,0,roomH,color,'real-west-wall-near');
  addWallPanelWest3D(scene,z2,cfg.d,0,roomH,color,'real-west-wall-far');
  addWallPanelWest3D(scene,z1,z2,0,y1,color,'real-west-wall-under-window');
  addWallPanelWest3D(scene,z1,z2,y2,roomH,color,'real-west-wall-over-window');
  addWestOpeningReturns3D(scene,cfg,win,color,roomH);
}

function addWallPanelWest3D(scene,z1,z2,y1,y2,color,name){
  const d = z2 - z1;
  const h = y2 - y1;
  if(d <= .025 || h <= .025) return;
  planeMat3D(scene,0,y1+h/2,z1+d/2,d,h,color,0,Math.PI/2,name,{rough:.88});
}

function addWestOpeningReturns3D(scene,cfg,win,color,roomH){
  const z1 = clamp(win.z,0,cfg.d);
  const z2 = clamp(win.z + win.w,0,cfg.d);
  const y1 = clamp(win.sill,0,roomH);
  const y2 = clamp(win.sill + win.h,0,roomH);
  const h = Math.max(.02,y2-y1);
  const midY = y1 + h/2;
  const reveal = shade3D(color,-10);
  box3D(scene,.04,midY,z1,.18,h,.08,reveal,'real-west-window-near-return',{rough:.9});
  box3D(scene,.04,midY,z2,.18,h,.08,reveal,'real-west-window-far-return',{rough:.9});
  if(roomH - y2 > .03) box3D(scene,.04,y2,(z1+z2)/2,.18,.08,z2-z1+.14,reveal,'real-west-window-top-return',{rough:.9});
  if(y1 > .03) box3D(scene,.04,y1,(z1+z2)/2,.18,.08,z2-z1+.14,reveal,'real-west-window-bottom-return',{rough:.9});
}

function addRealViewingEdge3D(scene,cfg,roomH){
  const trim = cfg.id === 'bath' ? 0xb7c5c1 : 0xb99064;
  box3D(scene,.035,roomH/2,.035,.07,roomH,.07,trim,'real-open-wall-left-edge',{rough:.76});
  box3D(scene,cfg.w-.035,roomH/2,.035,.07,roomH,.07,trim,'real-open-wall-right-edge',{rough:.76});
  box3D(scene,cfg.w/2,.04,.035,cfg.w,.08,.07,trim,'real-open-floor-threshold',{rough:.76});
}

function shade3D(hex,amt){
  const r = clamp(((hex >> 16) & 255) + amt,0,255);
  const g = clamp(((hex >> 8) & 255) + amt,0,255);
  const b = clamp((hex & 255) + amt,0,255);
  return (r << 16) + (g << 8) + b;
}

function addRealFloorGrid3D(scene,cfg){
  const tile = cfg.id === 'bath';
  const lightOn = state.lightOn !== false;
  const joint = tile ? (lightOn ? 0xa4b4af : 0x66716e) : (lightOn ? 0x73553c : 0x3d3028);
  const cross = tile ? (lightOn ? 0xb7c4c0 : 0x56615e) : (lightOn ? 0x5f432f : 0x302721);
  const step = tile ? .34 : .48;
  for(let x=step;x<cfg.w;x+=step) box3D(scene,x,.012,cfg.d/2,.008,.01,cfg.d,joint,'real-floor-depth-joint',{rough:.92,castShadow:false});
  for(let z=tile ? .34 : .72;z<cfg.d;z+=(tile ? .34 : .72)) box3D(scene,cfg.w/2,.014,z,cfg.w,.008,.01,cross,'real-floor-width-joint',{rough:.92,castShadow:false});
}

function addRealBaseboard3D(scene,cfg){
  const color = cfg.id === 'bath' ? 0xe2ebe7 : 0x9a6f49;
  const h = mm3D(REAL_HOME_SPEC.skirting);
  box3D(scene,cfg.w/2,h/2,cfg.d-.025,cfg.w,h,.05,color,'real-back-baseboard',{rough:.78});
  if(cfg.id === 'bedroom' || cfg.id === 'bath') box3D(scene,cfg.w/2,h/2,.025,cfg.w,h,.05,color,'real-north-baseboard',{rough:.78});
  box3D(scene,.025,h/2,cfg.d/2,.05,h,cfg.d,color,'real-left-baseboard',{rough:.78});
  box3D(scene,cfg.w-.025,h/2,cfg.d/2,.05,h,cfg.d,color,'real-right-baseboard',{rough:.78});
}

function addRealWindow3D(scene,cfg){
  const win = cfg.window;
  if(!win) return;
  const lightOn = state.lightOn !== false;
  const open = state.windowOpen === true;
  const floorWindow = !!win.floorToCeiling;
  const glassMat = mat3D(lightOn ? (floorWindow ? 0xc9d9d6 : 0xb5cdcc) : 0x617779,.18,{transparent:true,opacity:lightOn ? (open ? (floorWindow ? .01 : .08) : (floorWindow ? .22 : .36)) : (open ? .08 : .3),metalness:.01,depthWrite:false});
  const glowOpacity = open && floorWindow ? 0 : (lightOn ? (open ? .018 : .01) : .012);
  const glowMat = new THREE.MeshBasicMaterial({color:lightOn ? 0xc8a978 : 0x625b54, transparent:true, opacity:glowOpacity, side:THREE.DoubleSide, depthWrite:false});
  const frame = 0xd8d0c4;
  if(win.wall === 'south'){
    const cx = win.x + win.w/2;
    const cy = win.sill + win.h/2;
    addOutsideViewSouth3D(scene,cfg,win);
    if(open && floorWindow) addOpenSouthWindowPanels3D(scene,win,'real-south-window');
    else if(floorWindow) addClosedSouthWindowPanels3D(scene,win,'real-south-window');
    else box3D(scene,cx,cy,cfg.d+.012,win.w,win.h,.035,0xb9dce0,'real-south-window-glass',{material:glassMat,castShadow:false});
    if(glowOpacity > 0) planeMat3D(scene,cx,cy,cfg.d+.025,win.w*(floorWindow ? 1.02 : 1.18),win.h*(floorWindow ? 1.02 : 1.12),0xfff2c9,0,0,'real-window-glow',{material:glowMat,castShadow:false,receiveShadow:false});
    addRealWindowFrameSouth(scene,cfg,win,frame);
    if(win.floorToCeiling) addLargeSlidingDoorDetails3D(scene,cfg,win);
    if(!win.floorToCeiling) addOutsideHintSouth(scene,cfg,win);
    addWindowToggleHit3D(scene,cx,cy,cfg.d-.04,win.w,win.h,'real-south-window-toggle-hit');
    if(open && floorWindow) addOpenWindowAirPanel3D(scene,win,'real-south-window');
    if(open) addRealSunPatch3D(scene,cfg,win);
    if(open) addWindowBreeze3D(scene,cfg,win);
  }else if(win.wall === 'west'){
    const cz = win.z + win.w/2;
    const cy = win.sill + win.h/2;
    addOutsideViewWest3D(scene,cfg,win);
    box3D(scene,-.012,cy,cz,.035,win.h,win.w,0xb9dce0,'real-west-window-glass',{material:glassMat,castShadow:false});
    planeMat3D(scene,-.025,cy,cz,win.w*1.18,win.h*1.12,0xfff2c9,0,Math.PI/2,'real-west-window-glow',{material:glowMat,castShadow:false,receiveShadow:false});
    addRealWindowFrameWest(scene,cfg,win,frame);
    addWindowToggleHit3D(scene,.04,cy,cz,win.w,win.h,'real-west-window-toggle-hit',{rotY:Math.PI/2});
    if(open) addRealSunPatch3D(scene,cfg,win);
  }else if(win.wall === 'north'){
    const cx = win.x + win.w/2;
    const cy = win.sill + win.h/2;
    addOutsideViewNorth3D(scene,cfg,win);
    box3D(scene,cx,cy,-.012,win.w,win.h,.035,0xb9dce0,'real-north-window-glass',{material:glassMat,castShadow:false});
    planeMat3D(scene,cx,cy,-.025,win.w*1.18,win.h*1.12,0xfff2c9,0,Math.PI,'real-north-window-glow',{material:glowMat,castShadow:false,receiveShadow:false});
    addRealWindowFrameNorth(scene,cfg,win,frame);
    addWindowToggleHit3D(scene,cx,cy,.04,win.w,win.h,'real-north-window-toggle-hit');
    if(open) addRealSunPatchNorth3D(scene,cfg,win);
  }
}

function addOutsideViewSouth3D(scene,cfg,win){
  const lightOn = state.lightOn !== false;
  const open = state.windowOpen === true;
  const publicScene = cfg.id === 'public';
  const balconyFocus = publicScene && cfg.nodeId === 'balcony-node';
  const outZ = (cfg.window?.z || cfg.d) + (open ? 1.18 : .52);
  const skyMat = new THREE.MeshBasicMaterial({
    color:lightOn ? 0x8fd2fb : 0x14243c,
    transparent:!open || !lightOn,
    opacity:lightOn ? (open ? 1 : .24) : (open ? .82 : .24),
    side:THREE.DoubleSide,
    depthWrite:false
  });
  planeMat3D(scene,win.x+win.w/2,win.sill+win.h*.66,outZ+.06,win.w*1.34,win.h*.96,lightOn ? 0x8fd2fb : 0x14243c,0,0,'real-south-visible-sky',{material:skyMat,castShadow:false,receiveShadow:false,renderOrder:1});
  if(!publicScene && lightOn) addDaySunSouth3D(scene,win,outZ,open);
  if(!publicScene && !lightOn) addNightSkySouth3D(scene,win,outZ,open);
  const horizonMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x6f9c5c : 0x243045, transparent:true, opacity:lightOn ? (open ? .54 : .12) : (open ? .26 : .1), side:THREE.DoubleSide, depthWrite:false});
  [0.23,0.5,0.77].forEach((t,i)=>{
    const hill = new THREE.Mesh(new THREE.PlaneGeometry(win.w*(.22+i*.055),.14+i*.035),horizonMat);
    hill.position.set(win.x+win.w*t,win.sill+win.h*(.24+i*.03),outZ+.32+i*.075);
    hill.rotation.z = (i-.8)*.035;
    hill.renderOrder = 2;
    scene.add(hill);
  });
  if(open && lightOn && !publicScene) addSoftSkyCloudsSouth3D(scene,win,outZ,true);
  if(!balconyFocus){
    const groundMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x6e955c : 0x27342a, transparent:true, opacity:lightOn ? (open ? .38 : .12) : (open ? .2 : .08), side:THREE.DoubleSide, depthWrite:false});
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(win.w*.9,.14),groundMat);
    ground.position.set(win.x+win.w/2,win.sill+.08,outZ+.28);
    ground.renderOrder = 2;
    scene.add(ground);
    const railMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x4f5c55 : 0x1d2830, transparent:true, opacity:lightOn ? (open ? .36 : .12) : (open ? .24 : .12), side:THREE.DoubleSide, depthWrite:false});
    [0.18,0.82].forEach((t,i)=>{
      const post = new THREE.Mesh(new THREE.PlaneGeometry(.012,.34),railMat);
      post.position.set(win.x+win.w*t,win.sill+.3,outZ-.16+i*.003);
      post.renderOrder = 5;
      scene.add(post);
    });
  }
  const buildingMat = new THREE.MeshBasicMaterial({color:lightOn ? 0xb8b0a4 : 0x1d2630, transparent:true, opacity:lightOn ? (open ? .12 : .08) : (open ? .24 : .1), side:THREE.DoubleSide, depthWrite:false});
  const windowMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x6e8586 : 0xffd98a, transparent:true, opacity:lightOn ? (open ? .09 : .06) : (open ? .36 : .12), side:THREE.DoubleSide, depthWrite:false});
  [
    {t:.2,w:.26,h:.62,base:.42},
    {t:.42,w:.2,h:.46,base:.38},
    {t:.78,w:.3,h:.7,base:.44}
  ].forEach((b,i)=>{
    const bx = win.x + win.w*b.t;
    const body = new THREE.Mesh(new THREE.PlaneGeometry(b.w,b.h),buildingMat);
    body.position.set(bx,win.sill+b.base+b.h*.5,outZ+.58+i*.08);
    body.renderOrder = 3;
    scene.add(body);
    for(let row=0; row<3; row++){
      const wy = win.sill+b.base+b.h*(.25+row*.22);
      [-.26,0,.26].forEach(col=>{
        const pane = new THREE.Mesh(new THREE.PlaneGeometry(b.w*.13,b.h*.045),windowMat);
        pane.position.set(bx+col*b.w,wy,outZ+.575+i*.08);
        pane.renderOrder = 4;
        scene.add(pane);
      });
    }
  });
  if(!balconyFocus){
    const trunkMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x4a3a2a : 0x161817, transparent:true, opacity:lightOn ? (open ? .46 : .1) : (open ? .22 : .1), side:THREE.DoubleSide, depthWrite:false});
    const treeMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x3f7440 : 0x15251e, transparent:true, opacity:lightOn ? (open ? .42 : .12) : (open ? .26 : .1), side:THREE.DoubleSide, depthWrite:false});
    [0.09,0.91,0.52].forEach((t,i)=>{
      const tx = win.x+win.w*t;
      const trunk = new THREE.Mesh(new THREE.PlaneGeometry(.018,.18+i*.018),trunkMat);
      trunk.position.set(tx,win.sill+.18+(i%2)*.035,outZ+.18+i*.04);
      trunk.renderOrder = 3;
      scene.add(trunk);
      const tree = new THREE.Mesh(new THREE.CircleGeometry(.075+(i%2)*.016,18),treeMat);
      tree.position.set(tx,win.sill+.36+(i%2)*.04,outZ+.2+i*.04);
      tree.scale.y = 1.2;
      tree.renderOrder = 4;
      scene.add(tree);
    });
    if(open) addOutsideGardenDetailsSouth3D(scene,win,outZ,lightOn);
  }
}

function addDaySunSouth3D(scene,win,outZ,open){
  const alpha = open ? 1 : .28;
  const sx = win.x + win.w*.79;
  const sy = win.sill + win.h*.8;
  const glowMat = new THREE.MeshBasicMaterial({color:0xffe3a0, transparent:true, opacity:.34 * alpha, side:THREE.DoubleSide, depthWrite:false});
  const glow = new THREE.Mesh(new THREE.CircleGeometry(open ? .46 : .36,54),glowMat);
  glow.position.set(sx,sy,outZ+.16);
  glow.renderOrder = 7;
  scene.add(glow);
  const haloMat = new THREE.MeshBasicMaterial({color:0xfff0ba, transparent:true, opacity:.22 * alpha, side:THREE.DoubleSide, depthWrite:false});
  const halo = new THREE.Mesh(new THREE.CircleGeometry(open ? .28 : .22,48),haloMat);
  halo.position.set(sx,sy,outZ+.175);
  halo.renderOrder = 8;
  scene.add(halo);
  const sunMat = new THREE.MeshBasicMaterial({color:0xffbf3f, transparent:true, opacity:1 * alpha, side:THREE.DoubleSide, depthWrite:false});
  const sun = new THREE.Mesh(new THREE.CircleGeometry(open ? .21 : .15,56),sunMat);
  sun.position.set(sx,sy,outZ+.19);
  sun.renderOrder = 12;
  sun.userData = {sunPulse:true, baseOpacity:1*alpha, baseScale:1, phase:1.1};
  scene.add(sun);
  addCartoonSunBurst3D(scene,sx,sy,outZ+.18,{count:16,radius:open ? .245 : .185,length:open ? .058 : .044,width:open ? .019 : .016,travel:open ? .048 : .032,alpha,name:'real-south-cartoon-sun-rays',renderOrder:10,phase:1.1,color:0xffd16a});
}

function addSoftSkyCloudsSouth3D(scene,win,outZ,day=true){
  const baseColor = day ? 0xffffff : 0xb9c6d8;
  const cloudMat = new THREE.MeshBasicMaterial({color:baseColor, transparent:true, opacity:day ? .5 : .16, side:THREE.DoubleSide, depthWrite:false});
  [
    [.22,.7,.86,0],
    [.54,.84,1.06,1.7],
    [.84,.66,.74,3.1]
  ].forEach(([t,y,scale,phase],i)=>{
    addSkyCloudPuffSouth3D(scene,win,outZ,t,y,scale,cloudMat.clone(),`real-south-${day?'day':'night'}-cloud-${i}`,{
      phase,
      order:day ? 9 : 7,
      opacity:day ? .5 : .16,
      drift:win.w*(day ? .024 : .014),
      thin:!day
    });
  });
}

function addSkyCloudPuffSouth3D(scene,win,outZ,t,y,scale,material,name,options={}){
  const group = new THREE.Group();
  group.name = name;
  group.position.set(win.x+win.w*t,win.sill+win.h*y,outZ+.38+(options.phase || 0)*.018);
  const thin = options.thin === true;
  const puffs = thin
    ? [[-.12,0,.11,.026],[-.02,.018,.16,.034],[.12,.004,.13,.028],[.24,-.008,.08,.02]]
    : [[-.16,-.006,.12,.05],[-.06,.026,.16,.072],[.08,.034,.19,.08],[.23,.012,.13,.055],[.02,-.02,.28,.036]];
  puffs.forEach(([dx,dy,rx,ry],idx)=>{
    const puff = new THREE.Mesh(new THREE.CircleGeometry(rx*scale,28),material.clone());
    puff.scale.y = Math.max(.16, ry / rx);
    puff.position.set(dx*scale,dy*scale,idx*.002);
    puff.renderOrder = options.order ?? 9;
    group.add(puff);
  });
  group.userData = {
    skyCloud:true,
    baseX:group.position.x,
    baseY:group.position.y,
    baseOpacity:options.opacity ?? material.opacity ?? .35,
    phase:options.phase || 0,
    drift:options.drift || win.w*.02
  };
  scene.add(group);
}

function addNightSkySouth3D(scene,win,outZ,open){
  const alpha = open ? 1 : .32;
  addSoftSkyCloudsSouth3D(scene,win,outZ,false);
  addCrescentMoon3D(scene,win.x+win.w*.77,win.sill+win.h*.79,outZ+.19,.16,alpha,'real-south-night-crescent-moon',{renderOrder:9,color:0xf4efd0,opacity:.9});
  const starMat = new THREE.MeshBasicMaterial({color:0xfff7d7, transparent:true, opacity:.78 * alpha, side:THREE.DoubleSide, depthWrite:false});
  const stars = [
    [.18,.82,.012],[.27,.66,.008],[.36,.77,.01],[.48,.86,.007],[.58,.69,.009],
    [.68,.86,.007],[.82,.65,.009],[.9,.78,.006],[.12,.58,.007],[.42,.61,.006]
  ];
  stars.forEach(([tx,ty,r],i)=>{
    const star = new THREE.Mesh(new THREE.CircleGeometry(r,10),starMat);
    star.position.set(win.x+win.w*tx,win.sill+win.h*ty,outZ+.14+i*.006);
    star.renderOrder = 10;
    scene.add(star);
  });
}

function addOutsideGardenDetailsSouth3D(scene,win,outZ,lightOn){
  const alpha = state.windowOpen === true ? 1 : .56;
  const planterColor = lightOn ? 0xa07e58 : 0x4a3d31;
  const rimColor = lightOn ? 0x735d46 : 0x352d27;
  const soilColor = lightOn ? 0x5c4736 : 0x261f1b;
  const planter = roundedBox3D(scene,win.x+win.w*.5,win.sill+.105,outZ+.24,win.w*.58,.1,.18,planterColor,'real-south-window-planter-box',.03,{rough:.86,castShadow:false,transparent:true,opacity:lightOn ? .88*alpha : .42*alpha});
  if(planter?.material) planter.material.depthWrite = false;
  const rim = box3D(scene,win.x+win.w*.5,win.sill+.15,outZ+.24,win.w*.54,.016,.14,rimColor,'real-south-window-planter-rim',{rough:.72,castShadow:false,transparent:true,opacity:lightOn ? .9*alpha : .48*alpha});
  if(rim?.material) rim.material.depthWrite = false;
  const soil = box3D(scene,win.x+win.w*.5,win.sill+.16,outZ+.24,win.w*.5,.014,.11,soilColor,'real-south-window-planter-soil',{rough:.96,castShadow:false,transparent:true,opacity:lightOn ? .82*alpha : .4*alpha});
  if(soil?.material) soil.material.depthWrite = false;
  const foliageColors = lightOn ? [0x5f8550,0x759e63,0x8db174,0xd98c74,0xebc86d] : [0x24362b,0x2b4031,0x36503c,0x5a4742,0x655443];
  [0.14,0.28,0.44,0.58,0.74,0.86].forEach((t,i)=>{
    const x = win.x + win.w*t;
    const y = win.sill + .2 + (i%2)*.045;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(.07 + (i%3)*.012,16,12), new THREE.MeshBasicMaterial({color:foliageColors[i%3], transparent:true, opacity:lightOn ? .76*alpha : .34*alpha, side:THREE.DoubleSide, depthWrite:false}));
    leaf.scale.set(1.24,.74,.94);
    leaf.position.set(x,y,outZ+.27+i*.01);
    leaf.renderOrder = 7;
    scene.add(leaf);
    if(lightOn){
      [-.028,.024].forEach((dx,j)=>{
        const flower = new THREE.Mesh(new THREE.CircleGeometry(.014 + j*.002,10), new THREE.MeshBasicMaterial({color:foliageColors[3 + ((i+j)%2)], transparent:true, opacity:.68*alpha, side:THREE.DoubleSide, depthWrite:false}));
        flower.position.set(x+dx,y+.028+j*.018,outZ+.31+i*.01+j*.002);
        flower.renderOrder = 8;
        scene.add(flower);
      });
    }
  });
}

function addOutsideViewWest3D(scene,cfg,win){
  const lightOn = state.lightOn !== false;
  const open = state.windowOpen === true;
  const sky = new THREE.MeshBasicMaterial({color:lightOn ? 0xb8d5dc : 0x425960, transparent:true, opacity:lightOn ? (open ? 1 : .52) : .34, side:THREE.DoubleSide, depthWrite:false});
  planeMat3D(scene,-.09,win.sill+win.h/2,win.z+win.w/2,win.w*1.08,win.h*1.04,0xb8d5dc,0,Math.PI/2,'real-west-sky',{material:sky,castShadow:false,receiveShadow:false});
  const outsideMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x8fa18d : 0x344844, transparent:true, opacity:lightOn ? (open ? .24 : .07) : .06, side:THREE.DoubleSide, depthWrite:false});
  [0.32,0.62].forEach((t,i)=>{
    const line = new THREE.Mesh(new THREE.PlaneGeometry(win.w*(.38+i*.12),.05),outsideMat);
    line.position.set(-.11,win.sill+win.h*(.36+i*.16),win.z+win.w*t);
    line.rotation.y = Math.PI/2;
    scene.add(line);
  });
}

function addOutsideViewNorth3D(scene,cfg,win){
  const lightOn = state.lightOn !== false;
  const open = state.windowOpen === true;
  const sky = new THREE.MeshBasicMaterial({color:lightOn ? 0xbfd9df : 0x445c66, transparent:true, opacity:lightOn ? (open ? 1 : .5) : .34, side:THREE.DoubleSide, depthWrite:false});
  planeMat3D(scene,win.x+win.w/2,win.sill+win.h/2,-.1,win.w*1.12,win.h*1.06,0xbfd9df,0,Math.PI,'real-north-sky',{material:sky,castShadow:false,receiveShadow:false});
  const outsideMat = new THREE.MeshBasicMaterial({color:lightOn ? 0x92a893 : 0x344844, transparent:true, opacity:lightOn ? (open ? .26 : .075) : .06, side:THREE.DoubleSide, depthWrite:false});
  [0.28,0.58].forEach((t,i)=>{
    const line = new THREE.Mesh(new THREE.PlaneGeometry(win.w*(.34+i*.16),.055),outsideMat);
    line.position.set(win.x+win.w*t,win.sill+win.h*(.34+i*.17),-.12);
    scene.add(line);
  });
}

function addRealWindowFrameSouth(scene,cfg,win,color){
  const z = cfg.d - .018;
  const cx = win.x + win.w/2;
  const cy = win.sill + win.h/2;
  const openFloorWindow = state.windowOpen === true && win.floorToCeiling;
  const frameColor = win.floorToCeiling ? 0xded4c6 : color;
  const metal = win.floorToCeiling ? 0xc7beb0 : frameColor;
  box3D(scene,cx,win.sill,z,win.w+.12,.055,.05,metal,'window-bottom-frame',{rough:.54,metalness:.04});
  box3D(scene,cx,win.sill+win.h,z,win.w+.12,.055,.05,frameColor,'window-top-frame',{rough:.62,metalness:.02});
  box3D(scene,win.x,cy,z,.055,win.h+.08,.05,color,'window-left-frame',{rough:.7});
  box3D(scene,win.x+win.w,cy,z,.055,win.h+.08,.05,color,'window-right-frame',{rough:.7});
  const panes = win.floorToCeiling ? 2 : 2;
  if(!openFloorWindow){
    for(let i=1;i<panes;i++){
      const x = win.x + win.w*i/panes;
      box3D(scene,x,cy,z,.026,win.h,.035,frameColor,'window-mullion',{rough:.62,metalness:.03});
    }
  }
  if(!win.floorToCeiling) box3D(scene,cx,win.sill+win.h*.52,z,win.w,.035,.04,frameColor,'window-midrail',{rough:.62,metalness:.03});
  if(!win.floorToCeiling) box3D(scene,cx,win.sill-.06,z+.08,win.w+.34,.12,.28,0xe6ddcf,'window-sill',{rough:.86});
}

function addRealWindowFrameWest(scene,cfg,win,color){
  const x = .018;
  const cz = win.z + win.w/2;
  const cy = win.sill + win.h/2;
  box3D(scene,x,win.sill,cz,.05,.055,win.w+.12,color,'west-window-bottom-frame',{rough:.7});
  box3D(scene,x,win.sill+win.h,cz,.05,.055,win.w+.12,color,'west-window-top-frame',{rough:.7});
  box3D(scene,x,cy,win.z,.05,win.h+.08,.055,color,'west-window-side-frame',{rough:.7});
  box3D(scene,x,cy,win.z+win.w,.05,win.h+.08,.055,color,'west-window-side-frame',{rough:.7});
  box3D(scene,x,win.sill+win.h*.52,cz,.04,.035,win.w,color,'west-window-midrail',{rough:.7});
}

function addRealWindowFrameNorth(scene,cfg,win,color){
  const z = .018;
  const cx = win.x + win.w/2;
  const cy = win.sill + win.h/2;
  box3D(scene,cx,win.sill,z,win.w+.12,.055,.05,color,'north-window-bottom-frame',{rough:.7});
  box3D(scene,cx,win.sill+win.h,z,win.w+.12,.055,.05,color,'north-window-top-frame',{rough:.7});
  box3D(scene,win.x,cy,z,.055,win.h+.08,.05,color,'north-window-left-frame',{rough:.7});
  box3D(scene,win.x+win.w,cy,z,.055,win.h+.08,.05,color,'north-window-right-frame',{rough:.7});
  box3D(scene,cx,win.sill+win.h*.52,z,win.w,.035,.04,color,'north-window-midrail',{rough:.7});
  box3D(scene,cx,win.sill-.06,z+.08,win.w+.28,.12,.22,0xe6ddcf,'north-window-sill',{rough:.86});
}

function addOutsideHintSouth(scene,cfg,win){
  const mat = new THREE.MeshBasicMaterial({color:0xdce9e7, transparent:true, opacity:state.lightOn !== false ? .12 : .055, side:THREE.DoubleSide, depthWrite:false});
  [0.28,0.48,0.68].forEach((t,i)=>{
    const line = new THREE.Mesh(new THREE.PlaneGeometry(win.w*(.35+i*.08),.025),mat);
    line.position.set(win.x+win.w*t,win.sill+win.h*(.52+i*.08),cfg.d+.13+i*.01);
    line.renderOrder = 13;
    scene.add(line);
  });
}

function addRealSunPatch3D(scene,cfg,win){
  const floorWindow = !!win.floorToCeiling;
  const mat = new THREE.MeshBasicMaterial({color:0xe9bf7e, transparent:true, opacity:state.lightOn !== false ? (floorWindow ? .18 : .16) : .08, side:THREE.DoubleSide, depthWrite:false});
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(cfg.w*.86,3.15),Math.min(cfg.d*.52,2.25)),mat);
  patch.rotation.x = -Math.PI/2;
  patch.rotation.z = win.wall === 'south' ? -.34 : .48;
  patch.position.set(win.wall === 'south' ? cfg.w*.48 : cfg.w*.38,.026,win.wall === 'south' ? cfg.d*.54 : cfg.d*.54);
  scene.add(patch);
  const beamMat = new THREE.MeshBasicMaterial({color:0xf0d7a5, transparent:true, opacity:state.lightOn !== false ? (floorWindow ? .06 : .07) : .03, side:THREE.DoubleSide, depthWrite:false});
  for(let i=0;i<3;i++){
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(.48+i*.14,Math.min(cfg.d*.78,3.15)),beamMat);
    beam.position.set(cfg.w*(.34+i*.16),1.18,cfg.d*.63-i*.16);
    beam.rotation.x = -.82;
    beam.rotation.z = win.wall === 'south' ? -.28 : .4;
    scene.add(beam);
  }
}

function addRealSunPatchNorth3D(scene,cfg,win){
  const mat = new THREE.MeshBasicMaterial({color:0xffdda0, transparent:true, opacity:state.lightOn !== false ? .16 : .07, side:THREE.DoubleSide});
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(cfg.w*.62,1.9),Math.min(cfg.d*.42,1.4)),mat);
  patch.rotation.x = -Math.PI/2;
  patch.rotation.z = .18;
  patch.position.set(cfg.w*.5,.026,cfg.d*.42);
  scene.add(patch);
}

/* Phase 3: LED strip lighting helpers */
function addLEDStrip3D(scene, x, y, z, w, h, d, color, name, opts){
  opts = opts || {};
  var lightOn = state.lightOn !== false;
  var ledColor = color || 0xfff5e0;
  var mat = new THREE.MeshBasicMaterial({
    color: lightOn ? ledColor : 0x2a2a2a,
    transparent: true,
    opacity: lightOn ? .82 : .25
  });
  var strip = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  strip.position.set(x, y, z);
  strip.name = name || 'led-strip';
  scene.add(strip);
  if(lightOn && opts.light !== false){
    var light = new THREE.PointLight(ledColor, opts.intensity || .12, opts.distance || 2.2);
    light.position.set(x, y + (opts.lightOffset || -.04), z);
    scene.add(light);
  }
  return strip;
}

function addRealCeilingFixture3D(scene,cfg){
  const lightOn = state.lightOn !== false;
  const x = cfg.w/2;
  const z = cfg.d*.42;
  box3D(scene,x,2.63,z,.035,.34,.035,0x5f5142,'real-lamp-wire',{rough:.5});
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.22,.34,.16,32), mat3D(lightOn ? 0xd9a441 : 0x6b655d,.72));
  shade.position.set(x,2.42,z);
  shade.userData = {lightFixture:true};
  scene.add(shade);
  webglTour?.lampObjects?.push(shade);
  if(cfg.id === 'bath'){
    addLEDStrip3D(scene, cfg.w/2, 2.68, .3, cfg.w*.7, .015, .03, 0xfff0d0, 'real-bath-ceiling-led-strip', {intensity:.08, distance:3});
    addLEDStrip3D(scene, cfg.w/2, 2.68, cfg.d-.3, cfg.w*.7, .015, .03, 0xfff0d0, 'real-bath-ceiling-led-strip-back', {intensity:.08, distance:3});
  }
}

function addRealLivingRoom3D(scene,cfg){
  const ctx = realSpaceRoomContext(scene,cfg,'living');
  const spec = cfg.spec;
  const sofa = spec.sofa;
  const sofaW = mm3D(sofa.w);
  const sofaD = mm3D(sofa.d);
  const sofaX = (cfg.w-sofaW)/2;
  const sofaZ = .1;
  placeRealAsset3D(ctx,'living.sofa',{x:sofaX+sofaW/2,z:sofaZ+sofaD/2,w:sofaW,h:mm3D(sofa.h),d:sofaD}, item=>addRealSofa3D(scene,item.x,item.z,item.w,item.d,item.h));
  const table = spec.coffeeTable;
  const tableW = mm3D(table.w);
  const tableD = mm3D(table.d);
  const tableZ = sofaZ + sofaD + mm3D(table.gapFromSofa);
  placeRealAsset3D(ctx,'living.coffeeTable',{x:cfg.w/2,z:tableZ+tableD/2,w:tableW,h:mm3D(420),d:tableD}, item=>addRealCoffeeTable3D(scene,item.x,item.z,item.w,item.d));
  const side = spec.sideTable;
  placeRealAsset3D(ctx,'living.sideTable',{x:Math.max(.24,sofaX-mm3D(side.w)/2-.1),z:sofaZ+sofaD*.58,w:mm3D(side.w),h:mm3D(side.h),d:mm3D(side.d)}, item=>addRealSideTable3D(scene,item.x,item.z,item.w,item.d,item.h));
  addLivingCurtains3D(scene,cfg);
  addRug3D(scene,cfg.w/2,.028,tableZ+.72,2.35,1.42,0xd8cbb8,'real-living-rug');
}

function addRealEntryRoom3D(scene,cfg){
  const ctx = realSpaceRoomContext(scene,cfg,'entry');
  const spec = cfg.spec;
  const cabinetW = mm3D(spec.shoeCabinet.w);
  const cabinetD = mm3D(spec.shoeCabinet.d);
  const cabX = cfg.w/2;
  const cabZ = .1 + cabinetD/2;
  placeRealAsset3D(ctx,'entry.shoeCabinet',{x:cabX,z:cabZ,w:cabinetW,h:1.9,d:cabinetD}, item=>{
    addContactShadow3D(scene,item.x,item.z,item.w,item.d,.22);
    roundedBox3D(scene,item.x,item.h/2,item.z,item.w,item.h,item.d,0xb58b55,'real-entry-shoe-cabinet',.045,{rough:.78});
    box3D(scene,item.x,.72,item.z+item.d/2+.018,item.w*.9,.035,.035,0x7f583b,'real-entry-shoe-cabinet-mid-line',{rough:.72});
    for(let i=1;i<3;i++) box3D(scene,item.x-item.w/2+i*item.w/3,.95,item.z+item.d/2+.02,.025,1.48,.032,0x7f583b,'real-entry-shoe-cabinet-door-gap',{rough:.72});
    addCabinetHandle3D(scene,item.x-.24,.92,item.z+item.d/2+.04,.28,.055,false);
    addCabinetHandle3D(scene,item.x+.24,.92,item.z+item.d/2+.04,.28,.055,false);
  });

  placeRealAsset3D(ctx,'entry.bench',{x:.58,z:1.22,w:.82,h:.36,d:.38}, item=>{
    roundedBox3D(scene,item.x,.24,item.z,item.w,.16,item.d,0xc99d67,'real-entry-shoe-bench-seat',.055,{rough:.78});
    [[-.3,-.13],[.3,-.13],[-.3,.13],[.3,.13]].forEach(([dx,dz])=>box3D(scene,item.x+dx,.12,item.z+dz,.04,.24,.04,0x6f4e35,'real-entry-bench-leg',{rough:.64}));
  });
  placeRealAsset3D(ctx,'entry.mirror',{x:.16,z:1.25,w:.06,h:1.34,d:.64}, item=>{
    box3D(scene,item.x,1.38,item.z,.045,1.25,.55,0xcde0df,'real-entry-full-mirror',{rough:.3,metalness:.02,transparent:true,opacity:.72});
    box3D(scene,item.x,1.38,item.z,item.w,item.h,item.d,0x8a6a4d,'real-entry-mirror-frame',{rough:.64,transparent:true,opacity:.34});
  });
  roundedBox3D(scene,cfg.w/2,.032,1.54,1.36,.035,.54,0xc7a06c,'real-entry-floor-mat',.035,{rough:.92});
}

function addRealStudyRoom3D(scene,cfg){
  const ctx = realSpaceRoomContext(scene,cfg,'study');
  const spec = cfg.spec;
  const deskW = mm3D(spec.desk.w);
  const deskD = mm3D(spec.desk.d);
  const deskX = cfg.w/2;
  const deskZ = .18 + deskD/2;
  placeRealAsset3D(ctx,'study.desk',{x:deskX,z:deskZ,w:deskW,h:mm3D(760),d:deskD}, item=>{
    addContactShadow3D(scene,item.x,item.z,item.w,item.d,.2);
    roundedBox3D(scene,item.x,.38,item.z,item.w,.08,item.d,0xc99d67,'real-study-room-desk-top',.04,{rough:.74});
    [[-item.w*.4,-item.d*.34],[item.w*.4,-item.d*.34],[-item.w*.4,item.d*.34],[item.w*.4,item.d*.34]].forEach(([dx,dz])=>box3D(scene,item.x+dx,.18,item.z+dz,.045,.36,.045,0x6f4e35,'real-study-room-desk-leg',{rough:.64}));
  });
  addTaskLamp3D(scene,deskX-.38,.56,deskZ-.04);
  addBooksOnSurface3D(scene,deskX+.22,.46,deskZ+.06,'real-study-room-desk-books');

  const bookcaseD = mm3D(spec.bookcase.w);
  const bookcaseW = mm3D(spec.bookcase.d);
  placeRealAsset3D(ctx,'study.bookcase',{x:cfg.w-bookcaseD/2,z:1.48,w:bookcaseD,h:2.15,d:bookcaseW}, item=>addRealStudyBookcaseEast3D(scene,item.x,item.z,item.w,item.d,item.h));
  placeRealAsset3D(ctx,'study.loungeChair',{x:.48,z:cfg.d-.55,w:.8,h:.64,d:.8}, item=>roundedBox3D(scene,item.x,.4,item.z,item.w,.5,item.d,0xb49a80,'real-study-room-lounge-chair',.08,{rough:.94}));
  addRug3D(scene,cfg.w/2,.028,1.88,1.6,1.1,0xd8cfbd,'real-study-room-rug');
}

function addRealStudyBookcaseEast3D(scene,x,z,w,d,h){
  addContactShadow3D(scene,x,z,w,d,.22);
  roundedBox3D(scene,x,h/2,z,w,h,d,0xb58b55,'real-study-east-bookcase-carcass',.04,{rough:.78});
  const frontX = x - w/2 - .018;
  for(let row=0;row<5;row++){
    const y = .34 + row*.36;
    box3D(scene,frontX,y,z,.035,.035,d*.88,0x7b583e,'real-study-east-bookcase-shelf',{rough:.72});
  }
  for(let row=0;row<4;row++){
    for(let i=0;i<8;i++){
      const color = [0x8a6443,0xfff7df,0xcfa067,0x8fa7ae,0x9b6b61][(row+i)%5];
      const bookH = .2 + ((i+row)%3)*.055;
      box3D(scene,frontX-.024,.46+row*.36+bookH/2,z-d*.38+i*d*.095,.052,bookH,.07,color,'real-study-east-book-spine',{rough:.86});
    }
  }
}

function addRealBedroomRoom3D(scene,cfg){
  const ctx = realSpaceRoomContext(scene,cfg,'bedroom');
  const spec = cfg.spec;
  const bed = spec.bed;
  const bedW = mm3D(bed.w);
  const bedD = mm3D(bed.d);
  const bedX = cfg.w/2 - .3;
  const bedZ = .18 + bedD/2;
  placeRealAsset3D(ctx,'bedroom.bed',{x:bedX,z:bedZ,w:bedW,h:mm3D(bed.h),d:bedD}, item=>addRealBed3D(scene,item.x,item.z,item.w,item.d,item.h));
  const ns = spec.nightstand;
  const nsW = mm3D(ns.w);
  const nsD = mm3D(ns.d);
  placeRealAsset3D(ctx,'bedroom.nightstand',{x:bedX-bedW/2-nsW/2-.07,z:.2+nsD/2,w:nsW,h:mm3D(ns.h),d:nsD}, item=>addRealNightstand3D(scene,item.x,item.z,item.w,item.d,item.h));
  placeRealAsset3D(ctx,'bedroom.nightstand',{x:bedX+bedW/2+nsW/2+.07,z:.2+nsD/2,w:nsW,h:mm3D(ns.h),d:nsD}, item=>addRealNightstand3D(scene,item.x,item.z,item.w,item.d,item.h));
  const ward = spec.wardrobe;
  placeRealAsset3D(ctx,'bedroom.wardrobe',{x:cfg.w-mm3D(ward.d)/2,z:.76+mm3D(ward.w)/2,w:mm3D(ward.d),h:mm3D(ward.h),d:mm3D(ward.w)}, item=>addRealWardrobe3D(scene,item.x,item.z,item.w,item.d,item.h));
  const vanity = spec.vanity;
  placeRealAsset3D(ctx,'bedroom.vanity',{x:mm3D(vanity.d)/2,z:2.82,w:mm3D(vanity.d),h:mm3D(vanity.h),d:mm3D(vanity.w)}, item=>addRealVanity3D(scene,item.x,item.z,item.w,item.d,item.h));
  addRealBayWindowBench3D(scene,cfg.window.x+cfg.window.w/2,cfg.d-mm3D(spec.bayWindow.d)/2,cfg.window.w,mm3D(spec.bayWindow.d),mm3D(spec.bayWindow.sill));
  addRug3D(scene,cfg.w/2,.028,2.4,2.25,1.25,0xe5d7de,'real-bedroom-rug');
}

function addRealForegroundDepthMarkers3D(scene,cfg){
  addContactShadow3D(scene,.34,.72,.42,.62,.18);
  roundedBox3D(scene,.34,.26,.72,.42,.52,.62,0xb58b55,'real-living-near-console-edge',.04,{rough:.78});
  box3D(scene,.04,1.22,2.42,.055,2.35,.055,0xb99064,'real-left-wall-near-corner',{rough:.76});
}

function addBedroomDepthMarkers3D(scene,cfg,bedX,bedZ,bedW,bedD){
  roundedBox3D(scene,bedX,.28,bedZ+bedD/2+.34,1.18,.32,.36,0xc0a184,'real-bed-end-bench',.06,{rough:.82});
  addContactShadow3D(scene,bedX,bedZ+bedD/2+.34,1.18,.36,.2);
  box3D(scene,.04,1.25,2.72,.055,2.3,.055,0xb99064,'real-bedroom-left-near-corner',{rough:.76});
  addPlant3D(scene,cfg.w-.34,.1,cfg.d-.82);
}

function addRealBathRoom3D(scene,cfg){
  const ctx = realSpaceRoomContext(scene,cfg,'bath');
  const spec = cfg.spec;
  placeRealAsset3D(ctx,'bath.vanity',{x:cfg.w-mm3D(spec.vanity.w)/2-.12,z:.24+mm3D(spec.vanity.d)/2,w:mm3D(spec.vanity.w),h:mm3D(spec.vanity.h),d:mm3D(spec.vanity.d)}, item=>addRealBathVanity3D(scene,item.x,item.z,item.w,item.d,item.h,'north'));
  placeRealAsset3D(ctx,'bath.toilet',{x:cfg.w*.56,z:1.22,w:mm3D(spec.toilet.w),h:.76,d:.7}, item=>addRealToilet3D(scene,item.x,item.z,item.w,item.d,item.h));
  placeRealAsset3D(ctx,'bath.shower',{x:.12+mm3D(spec.shower.w)/2,z:cfg.d-mm3D(spec.shower.d)/2-.08,w:mm3D(spec.shower.w),h:2.1,d:mm3D(spec.shower.d)}, item=>addRealShower3D(scene,item.x,item.z,item.w,item.d,item.h));
  addBathTileAccent3D(scene,cfg);
}

function addRealSofa3D(scene,x,z,w,d,h){
  addContactShadow3D(scene,x,z,w*.98,d*.92,.28);
  var _sofaTone = (window.ROOM_TONE || ROOM_TONE).living;
  roundedBox3D(scene,x,.26,z,w,.32,d*.86,_sofaTone.sofaBase,'real-sofa-grounded-base',.1,{rough:.96});
  roundedBox3D(scene,x,.49,z+.08,w*.92,.24,d*.62,_sofaTone.sofa,'real-sofa-single-seat-cushion',.09,{rough:.98});
  roundedBox3D(scene,x,.76,z-d/2+.05,w*.96,.66,.16,0xb8b3ac,'real-sofa-clean-back',.075,{rough:.96});
  roundedBox3D(scene,x-w/2+.09,.55,z,.18,.58,d*.78,0xa5a09a,'real-sofa-left-arm-clean',.06,{rough:.96});
  roundedBox3D(scene,x+w/2-.09,.55,z,.18,.58,d*.78,0xa5a09a,'real-sofa-right-arm-clean',.06,{rough:.96});
  box3D(scene,x,.61,z+d*.38,w*.76,.026,.022,0x8a857d,'real-sofa-front-single-seam',{rough:.98,castShadow:false});
}

function addRealCoffeeTable3D(scene,x,z,w,d){
  addContactShadow3D(scene,x,z,w*.94,d*.86,.22);
  var _tableColor = 0xc79a63;
  var _tableWoodTex = createWoodGrainTexture(_tableColor, {grainStrength:.35});
  var _tableMat = mat3D(_tableColor, .62, {texture:_tableWoodTex, metalness:.015});
  var topRadius = Math.max(w,d)/2;
  var topMesh = new THREE.Mesh(new THREE.CylinderGeometry(topRadius, topRadius, .04, 32), _tableMat);
  topMesh.position.set(x, .42, z);
  topMesh.castShadow = true;
  topMesh.receiveShadow = true;
  topMesh.name = 'real-coffee-table-top-round';
  scene.add(topMesh);
  var lowerRadius = topRadius * .68;
  var lowerMesh = new THREE.Mesh(new THREE.CylinderGeometry(lowerRadius, lowerRadius, .028, 28), mat3D(0x795b43, .76, {texture:_tableWoodTex}));
  lowerMesh.position.set(x, .2, z);
  lowerMesh.castShadow = true;
  lowerMesh.name = 'real-coffee-table-lower-tier';
  scene.add(lowerMesh);
  cylinder3D(scene, x, .28, z, .04, .24, 0x604432, 'real-coffee-table-center-column', 20, {rough:.66});
  addBooksOnSurface3D(scene,x-.16,.46,z-.04,'real-coffee-books');
  cylinder3D(scene,x+.28,.47,z+.08,.055,.06,0xe8e0d2,'real-coffee-table-mug',20,{rough:.66});
  addVaseWithFlowers3D(scene,x+.1,.46,z,.8);
  addSmallPottedPlant3D(scene,x-.2,.46,z+.12,.65);
}

function addRealSideTable3D(scene,x,z,w,d,h){
  addContactShadow3D(scene,x,z,w*.82,d*.82,.24);
  roundedBox3D(scene,x,h/2,z,w,h,d,0xb58b55,'real-side-table',.05,{rough:.78});
  box3D(scene,x,h*.62,z-d/2-.012,w*.72,.025,.025,0x6f4e35,'real-side-table-drawer-line',{rough:.62});
  addSmallTableLamp3D(scene,x,h+.05,z,'real-side-lamp');
}

function addRealFloatingCabinet3D(scene,x,z,w,d,h,bottom){
  var _cabTex = createWoodGrainTexture(0xb7814f, {grainStrength:.3});
  addContactShadow3D(scene,x,z,w*.94,d*.72,.18);
  roundedBox3D(scene,x,bottom+h/2+.04,z,w,h,d,0xb7814f,'real-grounded-tv-console',.045,{rough:.8,texture:_cabTex});
  box3D(scene,x,bottom+h+.07,z,w*.96,.06,d*.96,0xd0aa78,'real-tv-console-thick-top',{rough:.68});
  box3D(scene,x,bottom+h*.58+.04,z-d/2-.012,w*.68,.018,.022,0x684933,'real-tv-cabinet-clean-reveal',{rough:.74,castShadow:false});
}

function addRealBed3D(scene,x,z,w,d,h){
  var _bt = (window.ROOM_TONE || ROOM_TONE).bedroom;
  addContactShadow3D(scene,x,z,w*.98,d*.98,.32);
  roundedBox3D(scene,x,.18,z,w,.28,d,0x8f735c,'real-bed-frame',.08,{rough:.78});
  roundedBox3D(scene,x,.45,z+.08,w*.94,.22,d*.88,_bt.mattress,'real-mattress',.08,{rough:.94});
  roundedBox3D(scene,x,.78,z-d/2+.045,w*1.04,1.08,.16,_bt.headboard,'real-headboard',.07,{rough:.82});
  roundedBox3D(scene,x-w*.24,.67,z-d*.32,w*.32,.13,d*.16,0xfffdfa,'real-left-bed-pillow',.06,{rough:.96});
  roundedBox3D(scene,x+w*.24,.67,z-d*.32,w*.32,.13,d*.16,_bt.accent,'real-right-bed-pillow-green',.06,{rough:.96});
  roundedBox3D(scene,x,.61,z+d*.2,w*.86,.11,d*.42,0xcbb7cf,'real-blanket-main',.07,{rough:.96});
  roundedBox3D(scene,x,.69,z+d*.02,w*.86,.055,.08,0xb79cbd,'real-blanket-fold-edge',.035,{rough:.96});
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>box3D(scene,x+sx*w*.42,.14,z+sz*d*.42,.06,.28,.06,0x654936,'real-bed-leg',{rough:.7}));
}

function addRealNightstand3D(scene,x,z,w,d,h){
  addContactShadow3D(scene,x,z,w*.86,d*.86,.22);
  roundedBox3D(scene,x,h/2,z,w,h,d,0xd9a96d,'real-nightstand',.05,{rough:.76});
  box3D(scene,x,h*.62,z-d/2-.012,w*.68,.025,.025,0x8b6040,'real-nightstand-drawer-line',{rough:.72});
  addSmallTableLamp3D(scene,x,h+.04,z,'real-nightstand-lamp');
}

function addRealWardrobe3D(scene,x,z,w,d,h){
  addContactShadow3D(scene,x,z,w*.98,d*.98,.3);
  roundedBox3D(scene,x,h/2,z,w,h,d,0xb997bd,'real-wardrobe',.04,{rough:.82});
  const frontZ = z - d/2 - .014;
  for(let i=1;i<4;i++) box3D(scene,x-w/2+i*w/4,h*.5,frontZ,.018,h*.74,.024,0xf4eaf4,'real-wardrobe-door-gap',{rough:.74});
  box3D(scene,x,h*.88,frontZ,w*.88,.028,.025,0xf4eaf4,'real-wardrobe-top-line',{rough:.74});
  [-.18,.18].forEach(offset=>box3D(scene,x+offset*w,.98,frontZ,.035,.56,.024,0x6c5b68,'real-wardrobe-handle',{rough:.56,metalness:.08}));
}

function addRealVanity3D(scene,x,z,w,d,h){
  addContactShadow3D(scene,x,z,w*.88,d*.82,.2);
  roundedBox3D(scene,x,h/2,z,w,h,d,0xd9a96d,'real-vanity',.05,{rough:.76});
  box3D(scene,x,h*.64,z+d/2+.012,w*.72,.026,.025,0x8b6040,'real-vanity-drawer-line',{rough:.72});
  const mirror = new THREE.Mesh(new THREE.CircleGeometry(.28,32),mat3D(0xcde0df,.36,{metalness:.02}));
  mirror.position.set(.018,1.38,z);
  mirror.rotation.y = Math.PI/2;
  scene.add(mirror);
  roundedBox3D(scene,x+.34,.22,z+d*.44,.38,.28,.32,0xe8dfd0,'real-vanity-stool',.06,{rough:.88});
}

function addRealBayWindowBench3D(scene,x,z,w,d,h){
  addContactShadow3D(scene,x,z,w*.96,d*.9,.18);
  roundedBox3D(scene,x,h/2,z,w,h,d,0xead6c2,'real-bay-window-bench',.04,{rough:.86});
  roundedBox3D(scene,x,h+.055,z,w*.72,.08,d*.72,0xe8d4bd,'real-bay-window-cushion',.05,{rough:.94});
}

function addBedroomWallArt3D(scene,x,y,z){
  box3D(scene,x,y,z,.92,.48,.035,0xb68d72,'real-bedroom-art-frame',{rough:.76,castShadow:false});
  planeMat3D(scene,x,y,z+.022,.82,.38,0xe8d8cd,0,0,'real-bedroom-art',{rough:.9,castShadow:false});
}

function addRealBathVanity3D(scene,x,z,w,d,h,wall='north'){
  addContactShadow3D(scene,x,z,w*.9,d*.86,.22);
  var _bathTone = (window.ROOM_TONE || ROOM_TONE).bath;
  roundedBox3D(scene,x,h/2,z,w,h,d,_bathTone.cabinet,'real-bath-vanity',.06,{rough:.7});
  roundedBox3D(scene,x,h+.04,z,w*.56,.06,d*.38,0xd8e5e2,'real-bath-basin',.05,{rough:.42,metalness:.02});
  cylinder3D(scene,x+.16,h+.13,z-d*.02,.035,.22,0x6f7772,'real-bath-faucet',16,{rough:.42,metalness:.18});
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(w*.8,.72),mat3D(0xcde0df,.34,{metalness:.02}));
  mirror.position.set(x,1.45,wall === 'north' ? z-d/2-.018 : z+d/2+.018);
  if(wall !== 'north') mirror.rotation.y = Math.PI;
  scene.add(mirror);
  var _ledY = 1.45;
  var _ledH = .72;
  addLEDStrip3D(scene, x-w*.42, _ledY+_ledH*.5, wall === 'north' ? z-d/2-.02 : z+d/2+.02, .012, _ledH*.9, .02, 0xfff5e0, 'real-bath-mirror-led-left', {intensity:.06, distance:1.5, lightOffset:0});
  addLEDStrip3D(scene, x+w*.42, _ledY+_ledH*.5, wall === 'north' ? z-d/2-.02 : z+d/2+.02, .012, _ledH*.9, .02, 0xfff5e0, 'real-bath-mirror-led-right', {intensity:.06, distance:1.5, lightOffset:0});
}

function addRealToilet3D(scene,x,z,w,d,h){
  addContactShadow3D(scene,x,z,w*1.3,d*.78,.18);
  roundedBox3D(scene,x,.34,z-d*.28,w*.96,.68,d*.25,0xf4f7f6,'real-toilet-tank',.06,{rough:.7});
  roundedBox3D(scene,x,.32,z+d*.02,w*1.18,.24,d*.44,0xfffdfa,'real-toilet-bowl',.12,{rough:.7});
  cylinder3D(scene,x,.47,z+d*.02,w*.34,.045,0xd8e4e2,'real-toilet-ring',32,{rough:.62});
  cylinder3D(scene,x,.39,z+d*.02,w*.24,.035,0xffffff,'real-toilet-water-hole',28,{rough:.5});
}

function addRealShower3D(scene,x,z,w,d,h){
  addContactShadow3D(scene,x,z,w*.98,d*.98,.18);
  roundedBox3D(scene,x,.035,z,w,.07,d,0xd9e3e1,'real-shower-pan',.04,{rough:.66});
  const glassMat = mat3D(0xbcd6d7,.28,{transparent:true,opacity:.42});
  box3D(scene,x-w/2,.95,z,.035,1.9,d,0xbcd6d7,'real-shower-glass-side',{material:glassMat,castShadow:false});
  box3D(scene,x,.95,z-d/2,w,1.9,.035,0xbcd6d7,'real-shower-glass-front',{material:glassMat,castShadow:false});
  box3D(scene,x-w/2+.015,.96,z-d/2,.04,1.88,.04,0x76827f,'real-shower-glass-post',{rough:.44,metalness:.12});
  box3D(scene,x+w/2-.015,.96,z-d/2,.04,1.88,.04,0x76827f,'real-shower-glass-post',{rough:.44,metalness:.12});
  box3D(scene,x,.98,z-d/2+.018,w*.78,.035,.035,0x76827f,'real-shower-door-handle',{rough:.44,metalness:.12});
  cylinder3D(scene,x+w*.28,1.62,z-d*.38,.035,.72,0x5c6864,'real-shower-pipe',16,{rough:.42,metalness:.14});
  cylinder3D(scene,x+w*.28,1.98,z-d*.38,.12,.04,0x5c6864,'real-shower-head',24,{rotX:Math.PI/2,rough:.42,metalness:.14});
}

function addLivingCurtains3D(scene,cfg){
  const win = cfg.window;
  if(!win || win.wall !== 'south') return;
  var _curtainColor = (window.ROOM_TONE || ROOM_TONE).living.curtain;
  const color = state.lightOn !== false ? _curtainColor : 0x4a5238;
  box3D(scene,win.x+win.w/2,2.62,cfg.d-.035,win.w+.38,.04,.05,0x5f5142,'real-curtain-rod',{rough:.52});
  roundedBox3D(scene,win.x+.12,1.34,cfg.d-.06,.18,2.22,.07,color,'real-left-curtain',.025,{rough:.94,transparent:true,opacity:.86});
  roundedBox3D(scene,win.x+win.w-.12,1.34,cfg.d-.06,.18,2.22,.07,color,'real-right-curtain',.025,{rough:.94,transparent:true,opacity:.86});
  for(let i=0;i<4;i++){
    box3D(scene,win.x+.1+i*.04,1.34,cfg.d-.105,.018,2.1,.025,0xb99f89,'real-curtain-fold',{rough:.92});
    box3D(scene,win.x+win.w-.1-i*.04,1.34,cfg.d-.105,.018,2.1,.025,0xb99f89,'real-curtain-fold',{rough:.92});
  }
  var _sheerMat = mat3D(0xf5efe4,.86,{transparent:true,opacity:.32});
  var _sheerL = new THREE.Mesh(new THREE.PlaneGeometry(win.w*.44,2.0), _sheerMat);
  _sheerL.position.set(win.x+win.w*.26,1.42,cfg.d-.085);
  _sheerL.name = 'real-sheer-curtain-left';
  _sheerL.receiveShadow = true;
  scene.add(_sheerL);
  var _sheerR = new THREE.Mesh(new THREE.PlaneGeometry(win.w*.44,2.0), _sheerMat);
  _sheerR.position.set(win.x+win.w*.74,1.42,cfg.d-.085);
  _sheerR.name = 'real-sheer-curtain-right';
  _sheerR.receiveShadow = true;
  scene.add(_sheerR);
}

function addLivingWallShelves3D(scene,x,z){
  box3D(scene,x-1.05,1.48,z,.72,.045,.12,0xc99d67,'real-tv-left-shelf',{rough:.7});
  box3D(scene,x+1.05,1.48,z,.72,.045,.12,0xc99d67,'real-tv-right-shelf',{rough:.7});
  [x-1.2,x-1.02,x+.92,x+1.1].forEach((px,i)=>{
    box3D(scene,px,1.56,z+.02,.08,.16,.08,[0x8a6443,0xfff7df,0xcfa067,0x8fa7ae][i],'real-living-shelf-book',{rough:.86});
  });
}

function addLivingWindowSideShelves3D(scene,cfg){
  const z = cfg.d - .09;
  const leftX = cfg.window.x*.5;
  const rightX = cfg.window.x + cfg.window.w + (cfg.w - cfg.window.x - cfg.window.w)*.5;
  if(leftX > .32) addLivingSlimDisplayShelf3D(scene,leftX,z,.58,'real-living-left-window-shelf');
  if(cfg.w - rightX > .32) addLivingSlimDisplayShelf3D(scene,rightX,z,.58,'real-living-right-window-shelf');
}

function addLivingSlimDisplayShelf3D(scene,x,z,w,name){
  box3D(scene,x,1.16,z,w,.045,.12,0xc99d67,`${name}-lower`,{rough:.7});
  box3D(scene,x,1.58,z,w,.045,.12,0xc99d67,`${name}-upper`,{rough:.7});
  [x-w*.24,x,x+w*.22].forEach((px,i)=>{
    box3D(scene,px,1.25,z+.02,.07,.16,.06,[0x8a6443,0xfff7df,0x8fa7ae][i],`${name}-object`,{rough:.86});
  });
}

function addLowMediaBar3D(scene,x,y,z,w,h){
  roundedBox3D(scene,x,y,z,w,h,.05,0x252a27,'real-low-media-bar',.025,{rough:.52,metalness:.02});
  box3D(scene,x,y+.02,z+.03,w*.86,.028,.012,0x3c443f,'real-low-media-bar-highlight',{rough:.5,castShadow:false});
}

function addBathTileAccent3D(scene,cfg){
  const lineColor = state.lightOn !== false ? 0xaab9b5 : 0x657370;
  for(let y=.45;y<2.4;y+=.3){
    box3D(scene,cfg.w/2,y,cfg.d-.018,cfg.w*.92,.01,.018,lineColor,'real-bath-wall-horizontal-tile',{rough:.92,castShadow:false});
  }
  for(let x=.3;x<cfg.w;x+=.3){
    box3D(scene,x,1.35,cfg.d-.019,.01,1.95,.018,lineColor,'real-bath-wall-vertical-tile',{rough:.92,castShadow:false});
  }
}

function addLowTv3D(scene,x,y,z,w,h,options={}){
  const screen = new THREE.Mesh(new THREE.BoxGeometry(w,h,.045),mat3D(0x202624,.44,{metalness:.02}));
  screen.position.set(x,y,z);
  if(options.rotY) screen.rotation.y = options.rotY;
  screen.name = 'real-tv-screen';
  screen.castShadow = true;
  screen.receiveShadow = true;
  scene.add(screen);
  const rotY = options.rotY || 0;
  const nx = Math.sin(rotY);
  const nz = Math.cos(rotY);
  box3D(scene,x+nx*.028,y,z+nz*.028,w*.94,h*.9,.012,0x0f1312,'real-tv-dark-panel',{rough:.52,castShadow:false,rotY});
  box3D(scene,x+nx*.02,y-h/2-.08,z+nz*.02,.1,.16,.04,0x2f352f,'real-tv-stand-neck',{rough:.52,rotY});
  box3D(scene,x+nx*.06,y-h/2-.18,z+nz*.06,.58,.04,.22,0x2f352f,'real-tv-stand-base',{rough:.52,rotY});
}

function addContactShadow3D(scene,x,z,w,d,opacity=.24){
  const mat = new THREE.MeshBasicMaterial({color:0x21170f, transparent:true, opacity, depthWrite:false, side:THREE.DoubleSide});
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);
  shadow.position.set(x,.019,z);
  shadow.rotation.x = -Math.PI/2;
  shadow.name = 'real-contact-shadow';
  scene.add(shadow);
}

function addRoomIdentitySurfaces3D(scene, node){
  if(node.id === 'living-node'){
    planeMat3D(scene,0,1.74,-5.145,3.7,2.2,0xe7d8c5,0,0,'living-focused-warm-tv-wall',{rough:.88,transparent:true,opacity:.82});
  }
  if(node.id === 'study-node'){
    planeMat3D(scene,0,1.74,-5.145,3.4,2.05,0xdde8d6,0,0,'study-focused-soft-wall',{rough:.9,transparent:true,opacity:.82});
  }
  if(node.id === 'bedroom-node'){
    planeMat3D(scene,-1.8,1.7,-5.145,3.0,2.0,0xeadfce,0,0,'bedroom-focused-headboard-wall',{rough:.9,transparent:true,opacity:.85});
  }
  if(node.id === 'bath-node'){
    planeMat3D(scene,0,1.55,-5.145,5.4,2.15,0xc8d8d3,0,0,'bath-focused-tile-wall',{rough:.92,transparent:true,opacity:.8});
    addTileGridOnWall3D(scene,0,1.55,-5.13,5.4,2.15,false);
  }
  if(node.id === 'balcony-node'){
    planeMat3D(scene,0,1.75,-5.145,5.6,2.4,0xdcebea,0,0,'balcony-focused-window-glow',{rough:.92,transparent:true,opacity:.46});
  }
}

function addFocusedRoomDetails3D(scene, node){
  if(node.id === 'living-node') addFocusedLivingDetails3D(scene);
  if(node.id === 'entry-node') addFocusedEntryDetails3D(scene);
  if(node.id === 'study-node') addFocusedStudyDetails3D(scene);
  if(node.id === 'bedroom-node') addFocusedBedroomDetails3D(scene);
  if(node.id === 'balcony-node') addFocusedBalconyDetails3D(scene);
  if(node.id === 'bath-node') addFocusedBathDetails3D(scene);
}

function addFocusedLivingDetails3D(scene){
  addContactShadow3D(scene,-2.1,1.55,2.95,.96,.24);
  roundedBox3D(scene,-2.1,.36,1.58,2.9,.38,.9,0x8f8175,'focused-living-sofa-grounded-base',.13,{rough:.96});
  [-1,0,1].forEach(i=>{
    roundedBox3D(scene,-2.1+i*.72,.62,1.42,.68,.2,.56,0xd0c5b7,'focused-living-sofa-seat-cushion',.09,{rough:.98});
    roundedBox3D(scene,-2.1+i*.72,.94,1.91,.68,.46,.16,0xbfb5a8,'focused-living-sofa-back-cushion',.07,{rough:.98,rotX:-.08});
  });
  roundedBox3D(scene,-2.1,1.02,2.0,2.95,.58,.22,0xa99c90,'focused-living-sofa-structural-back',.09,{rough:.96});
  roundedBox3D(scene,-3.42,.67,1.55,.22,.55,.82,0x8a7b70,'focused-living-sofa-left-arm',.07,{rough:.96});
  roundedBox3D(scene,-.78,.67,1.55,.22,.55,.82,0x8a7b70,'focused-living-sofa-right-arm',.07,{rough:.96});
  roundedBox3D(scene,-2.82,.88,1.21,.44,.26,.18,0xe0bf82,'focused-living-warm-pillow',.08,{rough:.96});
  roundedBox3D(scene,-2.12,.88,1.2,.44,.26,.18,0xf0e5d2,'focused-living-cream-pillow',.08,{rough:.96});
  roundedBox3D(scene,-1.44,.88,1.21,.42,.26,.18,0xc9d7c4,'focused-living-green-pillow',.08,{rough:.96});
  addContactShadow3D(scene,-.1,.78,1.45,.86,.16);
  roundedBox3D(scene,-.1,.36,.78,1.38,.16,.82,HOME_PALETTE.woodLight,'focused-living-rounded-coffee-table-top',.16,{rough:.72});
  cylinder3D(scene,-.52,.18,.52,.045,.32,HOME_PALETTE.wood,'focused-living-table-leg-a',16,{rough:.72});
  cylinder3D(scene,.32,.18,.52,.045,.32,HOME_PALETTE.wood,'focused-living-table-leg-b',16,{rough:.72});
  cylinder3D(scene,-.52,.18,1.04,.045,.32,HOME_PALETTE.wood,'focused-living-table-leg-c',16,{rough:.72});
  cylinder3D(scene,.32,.18,1.04,.045,.32,HOME_PALETTE.wood,'focused-living-table-leg-d',16,{rough:.72});
  box3D(scene,0,1.28,-5.02,2.55,1.36,.08,0x1f2422,'focused-living-wall-mounted-tv',{rough:.48,metalness:.02});
  box3D(scene,0,1.28,-4.965,2.28,1.14,.018,0x0d1110,'focused-living-tv-dark-glass',{rough:.42,metalness:.04,castShadow:false});
  box3D(scene,0,.92,-5.04,.34,.62,.035,0x4f4a43,'focused-living-tv-cable-cover',{rough:.76,castShadow:false});
  roundedBox3D(scene,0,.36,-4.52,2.9,.44,.62,HOME_PALETTE.woodLight,'focused-living-grounded-tv-cabinet',.08,{rough:.78});
  [[-.4,-.36],[.4,-.36],[-.4,.32],[.4,.32]].forEach(([dx,dz])=>box3D(scene,dx*2.9,.08,-4.52+dz*.62,.05,.16,.05,0x4d382c,'focused-living-tv-cabinet-leg',{rough:.66}));
  box3D(scene,0,.68,-4.16,1.45,.08,.08,0x252a27,'focused-living-soundbar-on-cabinet',{rough:.52,metalness:.02});
  box3D(scene,-1.6,1.85,-5.04,.72,.4,.055,0xb58b55,'focused-living-left-wall-art-frame',{rough:.78,castShadow:false});
  box3D(scene,1.55,1.86,-5.04,.72,.42,.055,0xb58b55,'focused-living-right-wall-art-frame',{rough:.78,castShadow:false});
  addFocusedLivingIdentity3D(scene);
}

function addFocusedEntryDetails3D(scene){
  roundedBox3D(scene,-3.15,1.45,-2.36,1.45,2.9,.66,HOME_PALETTE.woodLight,'focused-entry-full-cabinet',.08,{rough:.8});
  addCabinetLines3D(scene,-3.15,1.5,-2.02,1.1,4,'focused-entry-cabinet-line');
  roundedBox3D(scene,.84,.36,.86,2.2,.44,.58,HOME_PALETTE.wood,'focused-entry-shoe-bench',.08,{rough:.82});
  roundedBox3D(scene,2.64,1.6,-2.78,.86,1.7,.08,0xd1e2df,'focused-entry-mirror',.08,{rough:.35,metalness:.02});
  addWindowPlant3D(scene,.22,.68,.72);
}

function addFocusedStudyDetails3D(scene){
  roundedBox3D(scene,-2.95,1.55,-2.72,1.38,3.1,.58,HOME_PALETTE.woodLight,'focused-study-bookcase-left',.07,{rough:.78});
  roundedBox3D(scene,-1.45,1.55,-2.72,1.38,3.1,.58,0xa9bf8a,'focused-study-file-cabinet',.07,{rough:.84});
  addShelfBooks3D(scene,-2.25,-2.44);
  roundedBox3D(scene,1.08,.74,.9,2.75,.56,1.14,HOME_PALETTE.woodLight,'focused-study-large-desk',.08,{rough:.76});
  addTableLegs3D(scene,1.08,.9,2.35,.88,.72);
  box3D(scene,.9,1.45,.38,1.0,.7,.12,0x25312e,'focused-study-monitor',{rough:.52});
  box3D(scene,.9,.98,.78,.82,.04,.24,0x303b3a,'focused-study-keyboard',{rough:.64,metalness:.02});
  box3D(scene,1.54,1.0,.78,.2,.035,.22,0x2f3938,'focused-study-trackpad',{rough:.58});
  box3D(scene,1.06,1.9,-2.98,1.18,.58,.04,0xe7ded0,'focused-study-cork-board',{rough:.9,castShadow:false});
  box3D(scene,.92,1.94,-3.01,.34,.18,.028,0xfff2cf,'focused-study-board-note-a',{rough:.92,castShadow:false});
  roundedBox3D(scene,.1,.58,1.4,.58,1.08,.58,0x93a66f,'focused-study-task-chair',.08,{rough:.86});
  addCompactTaskLamp3D(scene,1.78,.9,.36,'focused-study-compact-lamp');
}

function addFocusedBedroomDetails3D(scene){
  var _bt = (window.ROOM_TONE || ROOM_TONE).bedroom;
  roundedBox3D(scene,-1.55,.96,.16,3.12,1.02,.18,_bt.headboard,'focused-bedroom-upholstered-headboard',.1,{rough:.84});
  roundedBox3D(scene,-1.55,.46,1.16,3.0,.58,2.1,HOME_PALETTE.woodLight,'focused-bedroom-bed-frame',.12,{rough:.78});
  roundedBox3D(scene,-1.55,.84,1.16,2.7,.36,1.78,_bt.quilt,'focused-bedroom-quilt',.16,{rough:.96});
  roundedBox3D(scene,-2.25,1.04,.34,.62,.28,.22,0xf2eee4,'focused-bedroom-pillow-left',.1,{rough:.96});
  roundedBox3D(scene,-1.45,1.04,.34,.62,.28,.22,_bt.accent,'focused-bedroom-pillow-green',.1,{rough:.96});
  roundedBox3D(scene,2.7,1.55,-2.04,1.55,3.1,.68,HOME_PALETTE.woodLight,'focused-bedroom-wardrobe',.08,{rough:.78});
  addWoodGrain3D(scene,2.7,2.06,-1.68,1.18,.08,false,5,0x9d6f42);
  for(let i=-1;i<=1;i++) addCabinetHandle3D(scene,3.5,1.04+i*.46,-2.04,.24,.08,true);
  roundedBox3D(scene,.28,.48,1.46,.58,.72,.52,HOME_PALETTE.woodLight,'focused-bedroom-bedside',.06,{rough:.78});
  addSideLamp3D(scene,.28,.76,1.48);
  addFocusedBedroomIdentity3D(scene);
}

function addFocusedBalconyDetails3D(scene){
  roundedBox3D(scene,-2.82,.72,-1.4,1.12,1.45,1.0,0xf1f3ef,'focused-balcony-washer',.08,{rough:.78});
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.08,32), mat3D(0x9fbfc1,.6,{transparent:true,opacity:.82}));
  drum.rotation.x = Math.PI/2;
  drum.position.set(-2.82,.78,-.88);
  scene.add(drum);
  const waterMat = new THREE.MeshBasicMaterial({color:0x5eb7cf, transparent:true, opacity:.44, side:THREE.DoubleSide, depthWrite:false});
  const water = new THREE.Mesh(new THREE.CircleGeometry(.58,48), waterMat);
  water.rotation.x = -Math.PI/2;
  water.scale.set(1.34,.72,1);
  water.position.set(-2.34,.061,-.86);
  water.name = 'focused-balcony-water-leak-puddle';
  water.renderOrder = 20;
  water.userData = {waterRisk:true, baseOpacity:.36, baseScale:[1.34,.72,1], phase:.4};
  scene.add(water);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.18,.24,42), new THREE.MeshBasicMaterial({color:0xd33b32, transparent:true, opacity:.72, side:THREE.DoubleSide, depthWrite:false}));
  ring.rotation.x = -Math.PI/2;
  ring.position.set(-2.28,.072,-.62);
  ring.name = 'focused-balcony-water-leak-sensor-ring';
  ring.renderOrder = 22;
  ring.userData = {waterRisk:true, baseOpacity:.62, baseScale:1, phase:1.2};
  scene.add(ring);
  cylinder3D(scene,-2.28,.12,-.62,.055,.08,0xd33b32,'focused-balcony-water-leak-sensor',24,{rough:.42,metalness:.04});
  box3D(scene,-2.07,.46,-.62,.03,.72,.03,0xd33b32,'focused-balcony-water-risk-beacon',{rough:.4,transparent:true,opacity:.72});
  box3D(scene,.7,2.4,-2.7,3.4,.05,.05,0x5c6864,'focused-balcony-drying-rod',{rough:.56});
  box3D(scene,.1,1.7,-2.7,.42,1.1,.05,0xfff3cf,'focused-balcony-cloth-a',{rough:.92});
  box3D(scene,.75,1.65,-2.7,.42,1.0,.05,0xdbe8d0,'focused-balcony-cloth-b',{rough:.92});
  roundedBox3D(scene,2.55,.52,-1.35,1.1,.5,.55,HOME_PALETTE.woodLight,'focused-balcony-storage-bench',.06,{rough:.78});
  addPlant3D(scene,3.5,.1,-1.4);
}

function addFocusedBathDetails3D(scene){
  roundedBox3D(scene,-2.82,.75,-2.4,1.18,.72,.66,0xf6f8f6,'focused-bath-vanity',.08,{rough:.74});
  roundedBox3D(scene,-2.82,1.66,-4.92,1.18,1.26,.08,0xcde0df,'focused-bath-mirror',.06,{rough:.32,metalness:.02});
  roundedBox3D(scene,.2,.46,-1.38,.92,.9,.9,0xf7f8f4,'focused-bath-toilet',.12,{rough:.74});
  box3D(scene,2.62,1.55,-3.08,1.25,3.1,.08,0xbcd6d7,'focused-bath-shower-glass',{rough:.34,transparent:true,opacity:.54});
  box3D(scene,3.35,1.7,-4.7,.08,1.7,.08,0x5c6864,'focused-bath-shower',{rough:.54,metalness:.12});
  addFocusedBathIdentity3D(scene);
}

function addFocusedStorageBoxes3D(scene,x,y,z){
  [0x9fb47e,0xc9d3bd,0xd8bd83,0x95a98f].forEach((color,i)=>{
    roundedBox3D(scene,x+i*.36,y,z,.28,.28,.38,color,`focused-storage-box-${i}`,.04,{rough:.86});
    box3D(scene,x+i*.36,y+.12,z+.2,.12,.025,.02,0x415044,`focused-storage-box-label-${i}`,{rough:.7});
  });
}

function addWalkablePath3D(scene, activeNode){
  const reachable = TOUR_GRAPH[activeNode.id] || [];
  reachable.forEach(nextId=>{
    const path = walkingPath(activeNode.id, nextId);
    for(let i=0;i<path.length-1;i++){
      const a = path[i];
      const b = path[i+1];
      const dx = b[0]-a[0];
      const dz = b[2]-a[2];
      const len = Math.hypot(dx,dz);
      if(len < .05) continue;
      const seg = new THREE.Mesh(
        new THREE.PlaneGeometry(.12, len),
        new THREE.MeshBasicMaterial({color:0xfff2cf, transparent:true, opacity:.18, side:THREE.DoubleSide})
      );
      seg.position.set((a[0]+b[0])/2, .052, (a[2]+b[2])/2);
      seg.rotation.x = -Math.PI/2;
      seg.rotation.z = Math.atan2(dx,dz);
      scene.add(seg);
    }
  });
}

function addHouseFloors3D(scene){
  FLOOR_AREAS.forEach(area=>{
    var isTile = area.name.indexOf('卫浴')>=0 || area.name.indexOf('阳台')>=0;
    var floorMat;
    if(isTile){
      var tileTex = _texRepeat(createTileTexture(area.color, 0x9eaaa8, {tileSize:128}), Math.max(1,Math.round(area.w/.6)), Math.max(1,Math.round(area.d/.6)));
      floorMat = mat3D(area.color, .82, {texture:tileTex});
    }else{
      var woodTex = _texRepeat(createWoodGrainTexture(area.color, {grainStrength:.45}), Math.max(1,Math.round(area.w/1.5)), Math.max(1,Math.round(area.d/1.5)));
      floorMat = mat3D(area.color, .8, {texture:woodTex});
    }
    const floor = box3D(scene, area.x + area.w/2, -.035, area.z + area.d/2, area.w, .07, area.d, area.color, `${area.name}-floor`, {material:floorMat});
    floor.userData = {floorTarget:true, room:area.name};
    webglTour?.floorTargets?.push(floor);
    addFloorGrain3D(scene, area);
    addFloorPerimeterTrim3D(scene, area);
  });
  roundedBox3D(scene,-.55,.055,1.62,2.75,.045,1.42,0xd9cfbc,'living-rug-soft',.08,{rough:.96});
  addWoodGrain3D(scene,-.55,.09,1.62,2.55,1.2,false,7,0xf5ead8);
  roundedBox3D(scene,-4.85,.055,3.95,1.5,.042,.52,0xc9a66c,'entry-mat-soft',.06,{rough:.92});
  box3D(scene,-.45,.018,1.55,2.35,.025,1.25,0xd9c9ad,'客厅地毯');
  var entryMatTex = createRugTexture('floral', 0xc5a06d);
  box3D(scene,-4.85,.018,3.95,1.5,.025,.52,0xc5a06d,'玄关脚垫',{texture:entryMatTex});
  box3D(scene,-1.8,.035,-1.0,1.05,.08,.1,0x8e725a,'书房门槛');
  box3D(scene,2.6,.035,-1.0,1.05,.08,.1,0x8e725a,'卧室门槛');
  box3D(scene,4.12,.035,.72,.1,.08,1.0,0x8e725a,'卫浴门槛');
}

function addSightlineGuides3D(scene){
  const material = new THREE.MeshBasicMaterial({color:0xfff3cf, transparent:true, opacity:.11, side:THREE.DoubleSide});
  [
    [[-5.15,3.35],[-.65,3.15]],
    [[-.65,3.15],[-4.85,-2.55]],
    [[-.65,3.15],[3.82,-2.05]],
    [[-.65,3.15],[.55,-4.68]],
    [[-.65,3.15],[5.2,2.9]]
  ].forEach(([a,b])=>{
    const dx = b[0]-a[0];
    const dz = b[1]-a[1];
    const len = Math.hypot(dx,dz);
    const path = new THREE.Mesh(new THREE.PlaneGeometry(.42,len), material);
    path.position.set((a[0]+b[0])/2,.024,(a[1]+b[1])/2);
    path.rotation.x = -Math.PI/2;
    path.rotation.z = Math.atan2(dx,dz);
    path.name = '全屋可视动线';
    scene.add(path);
  });
}

function addFloorGrain3D(scene, area){
  addReferenceFloorDetail3D(scene, area);
  const isTile = area.name.includes('卫浴') || area.name.includes('阳台');
  const lineColor = isTile ? 0xb2c0bd : 0xa78d72;
  const count = Math.max(3, Math.floor(area.w / .42));
  for(let i=1;i<count;i++){
    const x = area.x + i * area.w / count;
    box3D(scene, x, .012, area.z + area.d/2, .01, .012, area.d-.08, lineColor, 'floor-joint');
  }
  const rows = Math.max(2, Math.floor(area.d / .7));
  for(let i=1;i<rows;i++){
    const z = area.z + i * area.d / rows;
    box3D(scene, area.x + area.w/2, .014, z, area.w-.08, .012, .01, lineColor, 'floor-joint');
  }
}

function addReferenceFloorDetail3D(scene, area){
  const isTile = area.name.includes('') || area.name.includes('') || area.name.includes('') || area.name.includes('');
  if(isTile){
    const count = Math.max(3, Math.floor(area.w / .42));
    for(let i=1;i<count;i++){
      const x = area.x + i * area.w / count;
      box3D(scene, x, .02, area.z + area.d/2, .012, .012, area.d-.1, 0xaebdb6, 'reference-tile-joint',{rough:.92, castShadow:false});
    }
    const rows = Math.max(2, Math.floor(area.d / .55));
    for(let i=1;i<rows;i++){
      const z = area.z + i * area.d / rows;
      box3D(scene, area.x + area.w/2, .022, z, area.w-.1, .012, .012, 0xc5d2ce, 'reference-tile-joint',{rough:.92, castShadow:false});
    }
    return;
  }
  const count = Math.max(4, Math.floor(area.w / .36));
  for(let i=1;i<count;i++){
    const x = area.x + i * area.w / count;
    box3D(scene, x, .021, area.z + area.d/2, .012, .012, area.d-.1, 0xb88852, 'reference-wood-joint',{rough:.9, castShadow:false});
  }
  const rows = Math.max(2, Math.floor(area.d / .88));
  for(let i=1;i<rows;i++){
    const z = area.z + i * area.d / rows;
    box3D(scene, area.x + area.w/2, .023, z, area.w-.1, .012, .012, 0xd0a16a, 'reference-board-end',{rough:.9, castShadow:false});
  }
}

function addFloorPerimeterTrim3D(scene, area){
  const isTile = area.name.includes('') || area.name.includes('') || area.name.includes('') || area.name.includes('');
  const color = isTile ? 0xd5ded9 : HOME_PALETTE.woodLight;
  box3D(scene, area.x + area.w/2, .055, area.z+.05, area.w, .05, .055, color, 'floor-perimeter-trim',{rough:.78});
  box3D(scene, area.x + area.w/2, .055, area.z+area.d-.05, area.w, .05, .055, color, 'floor-perimeter-trim',{rough:.78});
  box3D(scene, area.x+.05, .055, area.z + area.d/2, .055, .05, area.d, color, 'floor-perimeter-trim',{rough:.78});
  box3D(scene, area.x+area.w-.05, .055, area.z + area.d/2, .055, .05, area.d, color, 'floor-perimeter-trim',{rough:.78});
}

function addHouseWalls3D(scene){
  HOUSE_WALLS.forEach(([x,z,w,d])=>{
    const wall = box3D(scene, x + w/2, HOUSE_WALL_HEIGHT/2, z + d/2, w, HOUSE_WALL_HEIGHT, d, HOME_PALETTE.wallWarm, 'house-wall',{rough:.86});
    wall.castShadow = true;
    wall.receiveShadow = true;
    box3D(scene, x + w/2, HOUSE_WALL_HEIGHT + .055, z + d/2, w, .11, d, 0xfff8ee, 'wall-cornice',{rough:.82});
  });
  HOUSE_WALLS.forEach(([x,z,w,d])=>{
    box3D(scene, x + w/2, .11, z + d/2, Math.max(.07,w), .18, Math.max(.07,d), HOUSE_TRIM_COLOR, '踢脚');
  });
  box3D(scene,0,HOUSE_CEILING_Y,-5.45,13.1,.14,.14,0xfaf4ea,'north-ceiling-beam');
  box3D(scene,0,HOUSE_CEILING_Y,4.95,13.1,.14,.14,0xf5eee4,'south-ceiling-beam');
  addCeilingCoveLines3D(scene);
  addWallOpeningsDetail3D(scene);
}

function addHouseCeiling3D(scene){
  const lightOn = state.lightOn !== false;
  const mat = mat3D(lightOn ? HOME_PALETTE.ceiling : 0x8f8980, .88);
  FLOOR_AREAS.forEach(area=>{
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(area.w, area.d), mat);
    mesh.position.set(area.x + area.w/2, HOUSE_CEILING_Y, area.z + area.d/2);
    mesh.rotation.x = Math.PI/2;
    mesh.name = `${area.name}-ceiling`;
    mesh.receiveShadow = true;
    scene.add(mesh);
  });
}

function addCeilingCoveLines3D(scene){
  const color = 0xe7dccd;
  [
    [0,-5.18,13.0,.045],
    [0,4.72,13.0,.045],
    [-6.38,-.25,.045,10.0],
    [6.38,-.25,.045,10.0],
    [-.55,-1.18,5.95,.04],
    [4.58,1.84,.04,3.05],
    [-2.1,1.82,.04,3.05]
  ].forEach(([x,z,w,d])=>box3D(scene,x,HOUSE_CEILING_Y-.32,z,w,.055,d,color,'ceiling-cove-line',{rough:.84}));
}

function addRoomAccentSurfaces3D(scene){
  const panelMat = mat3D(0xe7d8c5,.9,{transparent:true,opacity:.82});
  planeMat3D(scene,1.72,1.55,-1.115,2.75,2.12,0xe7d8c5,0,0,'living-warm-tv-wall',{material:panelMat});
  box3D(scene,1.72,.16,-1.08,2.86,.09,.065,HOME_PALETTE.woodLight,'living-tv-wall-base',{rough:.8});

  planeMat3D(scene,-5.08,1.66,-1.125,1.36,1.18,0xd8e4ce,0,0,'study-soft-green-wall',{rough:.9,transparent:true,opacity:.56});
  planeMat3D(scene,3.74,1.64,-1.125,1.42,1.1,0xe5dbcf,0,0,'bedroom-headboard-wall',{rough:.9,transparent:true,opacity:.6});
  planeMat3D(scene,5.42,1.52,1.945,1.18,1.05,0xd7e2df,0,Math.PI,'bath-soft-tile-wall',{rough:.9,transparent:true,opacity:.64});
}

function addTileGridOnWall3D(scene,x,y,z,w,h,vertical=false){
  const color = 0xe6eee2;
  const cols = Math.max(4, Math.floor(w/.22));
  const rows = Math.max(3, Math.floor(h/.22));
  for(let i=1;i<cols;i++){
    const offset = -w/2 + i*w/cols;
    if(vertical) box3D(scene,x+.012,y,z+offset,.018,h,.01,color,'tile-wall-joint',{rough:.92,castShadow:false});
    else box3D(scene,x+offset,y,z+.012,.018,h,.01,color,'tile-wall-joint',{rough:.92,castShadow:false});
  }
  for(let i=1;i<rows;i++){
    const yy = y - h/2 + i*h/rows;
    if(vertical) box3D(scene,x+.014,yy,z,.018,.012,w,color,'tile-wall-joint',{rough:.92,castShadow:false});
    else box3D(scene,x,yy,z+.014,w,.012,.018,color,'tile-wall-joint',{rough:.92,castShadow:false});
  }
}

function addWallOpeningsDetail3D(scene){
  const trim = 0xe0d3c5;
  const headerY = 2.58;
  [
    [-2.25,-1.02,.98,.08,'书房门洞'],
    [2.75,-1.02,.98,.08,'卧室门洞'],
    [-5.25,4.94,1.1,.08,'入户门洞']
  ].forEach(([x,z,w,d,label])=>{
    box3D(scene,x,headerY,z,w,.12,d,trim,`${label}-过梁`);
    box3D(scene,x-w/2,1.28,z,.055,2.38,d,trim,`${label}-门套`);
    box3D(scene,x+w/2,1.28,z,.055,2.38,d,trim,`${label}-门套`);
  });
  box3D(scene,4.12,headerY,.72,.08,.12,1.02,trim,'卫浴门洞-过梁');
  box3D(scene,4.12,1.28,.2,.08,2.38,.055,trim,'卫浴门洞-门套');
  box3D(scene,4.12,1.28,1.24,.08,2.38,.055,trim,'卫浴门洞-门套');
  [
    [-.72,-1.04,1.1,.03,'客厅到北向房间开'],
    [3.18,-1.04,.9,.03,'卧室走廊开'],
    [-3.9,3.0,.03,1.0,'玄关到客厅开'],
    [4.15,.26,.03,.72,'卫生间开']
  ].forEach(([x,z,w,d,label])=>{
    const mat = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.18, side:THREE.DoubleSide});
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(w,d),1.9), mat);
    glow.position.set(x,1.45,z);
    if(d > w) glow.rotation.y = Math.PI/2;
    glow.name = `${label}-开口光`;
    scene.add(glow);
  });
}

function addHouseDoorsAndWindows3D(scene){
  const glass = (x,z,w,d,label)=>{
    const pane = box3D(scene,x,1.82,z,w,1.62,d,0xc7dadd,label);
    pane.material = mat3D(0xc7dadd,.28,{transparent:true,opacity:.46});
    pane.castShadow = false;
    return pane;
  };
  addDoorFrame3D(scene,-5.25,4.93,1.05,.12,'入户门框');
  addDoorFrame3D(scene,-2.25,-1.0,.92,.12,'书房门洞');
  addDoorFrame3D(scene,2.75,-1.0,.92,.12,'卧室门洞');
  addDoorFrame3D(scene,4.1,.72,.12,.92,'卫浴门洞', true);
  glass(-.1,-5.48,2.1,.06,'阳台推拉');
  glass(-4.6,-5.48,1.45,.06,'书房');
  glass(4.25,-5.48,1.8,.06,'卧室');
  glass(-6.52,3.25,.06,1.2,'玄关窄窗');
  glass(5.42,-1.0,.06,1.05,'卫浴高窗');
  addWindowGlow3D(scene,-.1,-5.35,2.2);
  addWindowGlow3D(scene,-4.6,-5.35,1.45);
  addWindowGlow3D(scene,4.25,-5.35,1.8);
  addCurtains3D(scene);
  addWindowFramesAndSills3D(scene);
  addReferenceCurtains3D(scene);
}

function addDoorFrame3D(scene,x,z,w,d,label,vertical=false){
  const color = 0x8b6b4e;
  if(vertical){
    box3D(scene,x,1.35,z-d/2,.12,2.55,.08,color,`${label}-side`);
    box3D(scene,x,1.35,z+d/2,.12,2.55,.08,color,`${label}-side`);
    box3D(scene,x,2.62,z,.12,.18,d,color,`${label}-top`);
    box3D(scene,x,.035,z,.14,.07,d,0x8e725a,`${label}-threshold`);
  }else{
    box3D(scene,x-w/2,1.35,z,.08,2.55,.12,color,`${label}-side`);
    box3D(scene,x+w/2,1.35,z,.08,2.55,.12,color,`${label}-side`);
    box3D(scene,x,2.62,z,w,.18,.12,color,`${label}-top`);
    box3D(scene,x,.035,z,w,.07,.14,0x8e725a,`${label}-threshold`);
  }
}

function addWindowGlow3D(scene,x,z,w){
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(w,1.82),
    new THREE.MeshBasicMaterial({color:0xfff7df, transparent:true, opacity:state.lightOn !== false ? .24 : .08, side:THREE.DoubleSide})
  );
  glow.position.set(x,1.8,z+.035);
  glow.rotation.x = 0;
  scene.add(glow);
}

function addCurtains3D(scene){
  var _curtainTone = (window.ROOM_TONE || ROOM_TONE).living;
  const curtainMat = mat3D(_curtainTone.curtain,.86,{transparent:true,opacity:.55});
  const panel = (x,z,w,label)=>{
    const left = new THREE.Mesh(new THREE.PlaneGeometry(w*.18,1.8), curtainMat);
    left.position.set(x-w*.43,1.78,z+.05);
    left.name = `${label}-窗帘`;
    left.receiveShadow = true;
    scene.add(left);
    const right = new THREE.Mesh(new THREE.PlaneGeometry(w*.18,1.8), curtainMat);
    right.position.set(x+w*.43,1.78,z+.05);
    right.name = `${label}-窗帘`;
    right.receiveShadow = true;
    scene.add(right);
    box3D(scene,x,2.74,z+.06,w+.28,.035,.035,0x7b6a57,`${label}-窗帘杆`);
  };
  panel(-.1,-5.35,2.2,'阳台');
  panel(-4.6,-5.35,1.45,'书房');
  panel(4.25,-5.35,1.8,'卧室');
}

function addReferenceCurtains3D(scene){
  const sheer = mat3D(HOME_PALETTE.curtainSheer,.86,{transparent:true,opacity:.5});
  const green = mat3D(HOME_PALETTE.curtainGreen,.9,{transparent:true,opacity:.78});
  const panel = (x,z,w,label)=>{
    const center = new THREE.Mesh(new THREE.PlaneGeometry(w*.62,1.7), sheer);
    center.position.set(x,1.75,z+.09);
    center.name = `${label}-reference-sheer`;
    center.receiveShadow = true;
    scene.add(center);
    for(let i=0;i<4;i++){
      const inset = i*w*.028;
      const lw = new THREE.Mesh(new THREE.PlaneGeometry(w*.045,1.88), green);
      lw.position.set(x-w*.52+inset,1.72,z+.11+i*.003);
      lw.name = `${label}-reference-curtain-fold`;
      lw.receiveShadow = true;
      scene.add(lw);
      const rw = new THREE.Mesh(new THREE.PlaneGeometry(w*.045,1.88), green);
      rw.position.set(x+w*.52-inset,1.72,z+.11+i*.003);
      rw.name = `${label}-reference-curtain-fold`;
      rw.receiveShadow = true;
      scene.add(rw);
    }
    box3D(scene,x,2.78,z+.12,w+.48,.04,.04,HOME_PALETTE.woodDark,`${label}-curtain-rod`,{rough:.54});
  };
  panel(-.1,-5.35,2.2,'balcony');
  panel(-4.6,-5.35,1.45,'study');
  panel(4.25,-5.35,1.8,'bedroom');
}

function addWindowFramesAndSills3D(scene){
  const frame = 0xf8f3ea;
  const metal = 0x6f7772;
  const window = (x,z,w,label)=>{
    box3D(scene,x,1.82,z+.08,w+.18,.08,.055,frame,`${label}-window-mid-rail`,{rough:.72});
    box3D(scene,x,2.2,z+.08,w+.22,.06,.055,frame,`${label}-window-top-rail`,{rough:.72});
    box3D(scene,x,1.18,z+.08,w+.22,.08,.055,frame,`${label}-window-bottom-rail`,{rough:.72});
    box3D(scene,x-w/2,1.68,z+.08,.055,1.2,.055,frame,`${label}-window-side-rail`,{rough:.72});
    box3D(scene,x+w/2,1.68,z+.08,.055,1.2,.055,frame,`${label}-window-side-rail`,{rough:.72});
    box3D(scene,x,1.02,z+.18,w+.42,.11,.28,0xe6ddcf,`${label}-window-sill`,{rough:.86});
    box3D(scene,x,1.68,z+.1,.045,1.12,.055,metal,`${label}-window-center-rail`,{rough:.54,metalness:.08});
  };
  window(-.1,-5.35,2.2,'balcony');
  window(-4.6,-5.35,1.45,'study');
  window(4.25,-5.35,1.8,'bedroom');
  addWindowPlant3D(scene,-.72,1.08,-5.08);
  addWindowPlant3D(scene,-4.22,1.08,-5.08);
  addWindowPlant3D(scene,4.82,1.08,-5.08);
}

function addWindowPlant3D(scene,x,y,z){
  return;
}

function addWallDisc3D(scene,x,y,z,r,color,name){
  return cylinder3D(scene,x,y,z,r,.035,color,name,32,{rotX:Math.PI/2,rough:.42,metalness:.08});
}

function addFloorLamp3D(scene,x,z,name='floor-lamp'){
  cylinder3D(scene,x,.86,z,.035,1.52,0x5c5144,`${name}-stand`,16,{rough:.48,metalness:.08});
  cylinder3D(scene,x,.14,z,.22,.05,0x7b6a57,`${name}-base`,28,{rough:.52,metalness:.08});
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.28,.42,.34,28), mat3D(0xfff1c7,.72,{transparent:true,opacity:.92}));
  shade.position.set(x,1.66,z);
  shade.name = `${name}-shade`;
  shade.castShadow = true;
  shade.receiveShadow = true;
  scene.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.08,18,12), new THREE.MeshBasicMaterial({color:0xffe49a}));
  bulb.position.set(x,1.52,z);
  bulb.name = `${name}-warm-bulb`;
  scene.add(bulb);
}

function addSmallTableLamp3D(scene,x,y,z,name='table-lamp'){
  cylinder3D(scene,x,y+.2,z,.025,.36,0x6a5847,`${name}-stem`,12,{rough:.52,metalness:.06});
  cylinder3D(scene,x,y+.02,z,.12,.04,0x8a725c,`${name}-base`,20,{rough:.6});
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.15,.23,.18,20), mat3D(0xfff3cf,.76,{transparent:true,opacity:.92}));
  shade.position.set(x,y+.42,z);
  shade.name = `${name}-shade`;
  shade.castShadow = true;
  scene.add(shade);
}

function addBooksOnSurface3D(scene,x,y,z,name='surface-books'){
  [0x8a6443,0xfff7df,0xcfa067].forEach((color,i)=>{
    roundedBox3D(scene,x+i*.18,y+i*.035,z,.38,.045,.25,color,`${name}-${i}`,.025,{rough:.88});
  });
}

function addLivingRoomIdentity3D(scene){
  roundedBox3D(scene,-2.34,.52,2.34,.58,.58,1.1,0x9a8777,'living-left-chaise',.08,{rough:.95});
  roundedBox3D(scene,-.06,.52,2.34,.58,.58,1.1,0x9a8777,'living-right-chaise',.08,{rough:.95});
  roundedBox3D(scene,-1.72,.88,2.58,.5,.26,.18,0xfff3cf,'living-yellow-pillow',.07,{rough:.96});
  roundedBox3D(scene,-.7,.88,2.58,.48,.26,.18,0xe8d8c3,'living-warm-pillow',.07,{rough:.96});
  roundedBox3D(scene,.35,.44,1.45,1.38,.12,.78,HOME_PALETTE.woodLight,'living-coffee-table-warm-top',.18,{rough:.74});
  addBooksOnSurface3D(scene,.04,.54,1.42,'living-coffee-table-books');
  box3D(scene,1.72,1.62,-.91,2.55,.06,.08,0xe9c283,'living-tv-wall-top-shelf',{rough:.78});
  box3D(scene,.55,1.22,-.84,.18,.86,.12,0x303734,'living-left-speaker',{rough:.54});
  box3D(scene,2.9,1.22,-.84,.18,.86,.12,0x303734,'living-right-speaker',{rough:.54});
  addFloorLamp3D(scene,-2.88,3.74,'living-reading-floor-lamp');
  roundedBox3D(scene,-2.75,.38,3.55,.42,.18,.42,0xe3b572,'living-sofa-side-table',.06,{rough:.78});
}

function addBedroomIdentity3D(scene){
  roundedBox3D(scene,3.72,.82,-4.18,2.55,.92,.18,0xb89673,'bedroom-upholstered-headboard',.09,{rough:.86});
  roundedBox3D(scene,3.12,.96,-4.04,.62,.24,.18,0xfff8ef,'bedroom-pillow-left',.08,{rough:.96});
  roundedBox3D(scene,4.3,.96,-4.04,.62,.24,.18,0xfff8ef,'bedroom-pillow-right',.08,{rough:.96});
  roundedBox3D(scene,3.72,.94,-3.04,1.82,.12,.92,0xcbb7cf,'bedroom-folded-blanket',.08,{rough:.96});
  roundedBox3D(scene,2.55,.42,-4.02,.5,.58,.42,HOME_PALETTE.woodLight,'bedroom-left-bedside',.06,{rough:.78});
  roundedBox3D(scene,4.92,.42,-4.02,.5,.58,.42,HOME_PALETTE.woodLight,'bedroom-right-bedside',.06,{rough:.78});
  addSmallTableLamp3D(scene,2.55,.72,-4.02,'bedroom-left-bedside-lamp');
  addSmallTableLamp3D(scene,4.92,.72,-4.02,'bedroom-right-bedside-lamp');
  for(let i=-1;i<=1;i++) addCabinetHandle3D(scene,5.58,1.08+i*.42,-2.04,.26,.08,true);
  addWallDisc3D(scene,4.88,1.42,3.68,.32,0xcde0df,'bedroom-vanity-mirror-glass');
  roundedBox3D(scene,3.72,.08,-2.14,1.95,.045,.52,0xe8dbe6,'bedroom-foot-rug',.08,{rough:.96});
}

function addBathIdentity3D(scene){
  roundedBox3D(scene,5.45,.94,-.18,.72,.08,.38,0xd8e4e2,'bath-sink-basin',.06,{rough:.45,metalness:.02});
  cylinder3D(scene,5.45,1.08,-.42,.025,.26,0x7d8784,'bath-faucet-post',14,{rough:.4,metalness:.16});
  cylinder3D(scene,5.55,1.2,-.42,.022,.2,0x7d8784,'bath-faucet-neck',14,{rotZ:Math.PI/2,rough:.4,metalness:.16});
  roundedBox3D(scene,4.82,.82,.78,.66,.22,.36,0xf8fbf9,'bath-toilet-tank',.06,{rough:.72});
  cylinder3D(scene,4.82,.88,1.12,.25,.04,0xd8e4e2,'bath-toilet-seat',28,{rough:.62});
  box3D(scene,5.98,1.82,1.86,.54,.06,.08,0x7d8784,'bath-towel-rail',{rough:.42,metalness:.12});
  box3D(scene,5.98,1.42,1.86,.42,.72,.04,0xe3b1aa,'bath-hanging-towel',{rough:.94});
  cylinder3D(scene,5.86,2.14,.05,.16,.04,0x7d8784,'bath-shower-head',24,{rotX:Math.PI/2,rough:.38,metalness:.14});
}

function addFocusedLivingIdentity3D(scene){
  roundedBox3D(scene,-3.35,.62,1.52,.56,.82,.88,0xd1c6b5,'focused-living-left-armchair',.12,{rough:.95});
  roundedBox3D(scene,-2.1,.94,1.18,.54,.24,.18,0xe8d8c3,'focused-living-extra-pillow-a',.08,{rough:.96});
  roundedBox3D(scene,-1.5,.94,1.18,.54,.24,.18,0xfff3cf,'focused-living-extra-pillow-b',.08,{rough:.96});
  addBooksOnSurface3D(scene,-.42,.5,.72,'focused-living-table-books');
  box3D(scene,-1.52,1.84,-4.92,.86,.06,.08,0xe7c179,'focused-living-floating-shelf-left',{rough:.78});
  box3D(scene,1.52,1.84,-4.92,.86,.06,.08,0xe7c179,'focused-living-floating-shelf-right',{rough:.78});
  box3D(scene,-1.34,1.36,-4.86,.16,.62,.08,0x303734,'focused-living-left-speaker',{rough:.54});
  box3D(scene,1.34,1.36,-4.86,.16,.62,.08,0x303734,'focused-living-right-speaker',{rough:.54});
  addFloorLamp3D(scene,3.62,1.7,'focused-living-floor-lamp');
}

function addFocusedBedroomIdentity3D(scene){
  roundedBox3D(scene,-1.55,.9,.12,3.04,.94,.18,0xb99672,'focused-bedroom-tall-headboard',.1,{rough:.86});
  roundedBox3D(scene,-2.18,1.05,.22,.64,.22,.2,0xfff8ef,'focused-bedroom-pillow-cream-left',.08,{rough:.96});
  roundedBox3D(scene,-.92,1.05,.22,.64,.22,.2,0xfff8ef,'focused-bedroom-pillow-cream-right',.08,{rough:.96});
  roundedBox3D(scene,-1.55,.96,1.62,2.0,.12,.64,0xcbb7cf,'focused-bedroom-folded-blanket',.08,{rough:.96});
  roundedBox3D(scene,-3.25,.48,1.36,.58,.7,.52,HOME_PALETTE.woodLight,'focused-bedroom-left-bedside',.06,{rough:.78});
  addSmallTableLamp3D(scene,-3.25,.84,1.36,'focused-bedroom-left-lamp');
  addSmallTableLamp3D(scene,.28,.84,1.48,'focused-bedroom-right-lamp');
  for(let i=-1;i<=1;i++) addCabinetHandle3D(scene,2.08,1.08+i*.52,-1.72,.28,.08,true);
  addWallDisc3D(scene,3.55,1.48,.94,.26,0xcde0df,'focused-bedroom-mirror-glass');
  roundedBox3D(scene,-1.55,.06,2.55,2.4,.04,.54,0xe8dbe6,'focused-bedroom-bedside-rug',.08,{rough:.96});
}

function addFocusedBathIdentity3D(scene){
  roundedBox3D(scene,-2.82,.96,-2.38,.74,.08,.38,0xd8e4e2,'focused-bath-sink-basin',.06,{rough:.45,metalness:.02});
  cylinder3D(scene,-2.82,1.1,-2.66,.025,.26,0x7d8784,'focused-bath-faucet-post',14,{rough:.4,metalness:.16});
  cylinder3D(scene,-2.72,1.22,-2.66,.022,.2,0x7d8784,'focused-bath-faucet-neck',14,{rotZ:Math.PI/2,rough:.4,metalness:.16});
  roundedBox3D(scene,.2,.82,-1.74,.66,.22,.36,0xf8fbf9,'focused-bath-toilet-tank',.06,{rough:.72});
  cylinder3D(scene,.2,.88,-1.3,.25,.04,0xd8e4e2,'focused-bath-toilet-seat',28,{rough:.62});
  box3D(scene,2.18,1.18,-3.08,.05,.08,1.28,0x8ca7a8,'focused-bath-shower-base-rail',{rough:.38,metalness:.1});
  box3D(scene,3.24,1.94,-4.7,.46,.06,.08,0x7d8784,'focused-bath-towel-rail',{rough:.42,metalness:.12});
  box3D(scene,3.24,1.52,-4.7,.36,.68,.04,0xe3b1aa,'focused-bath-towel',{rough:.94});
}

function addHouseFurniture3D(scene){
  addLivingFurniturePlaced3D(scene);
  addEntryFurniturePlaced3D(scene);
  addStudyFurniturePlaced3D(scene);
  addBedroomFurniturePlaced3D(scene);
  addBalconyFurniturePlaced3D(scene);
  addBathFurniturePlaced3D(scene);
  addLivingRoomIdentity3D(scene);
  addBedroomIdentity3D(scene);
  addBathIdentity3D(scene);
}

function addLivingFurniturePlaced3D(scene){
  box3D(scene,-1.2,.42,2.85,2.8,.84,.78,0x9a8777,'沙发坐垫');
  box3D(scene,-1.2,.95,3.22,2.9,1.05,.22,0x8f7d6e,'沙发靠背');
  box3D(scene,-2.35,.38,2.38,.28,.6,.18,0x8a7869,'沙发扶手');
  box3D(scene,-.05,.38,2.38,.28,.6,.18,0x8a7869,'沙发扶手');
  box3D(scene,.35,.28,1.45,1.28,.26,.72,0xb08a63,'茶几');
  addTableLegs3D(scene,.35,1.45,1.1,.54,.26);
  box3D(scene,1.72,.85,-.82,2.1,1.25,.16,0x202826,'电视');
  box3D(scene,1.72,.34,-.52,2.45,.5,.58,0x9fb8c8,'客厅抽屉');
  addCabinetLines3D(scene,1.72,.59,-.22,2.1,3,'tv-drawer-line');
  box3D(scene,-2.58,.95,.42,.18,1.55,1.25,0xb69b7b,'半高隔断');
}

function addEntryFurniturePlaced3D(scene){
  box3D(scene,-6.05,1.28,3.1,.72,2.56,2.25,0xb88f5f,'玄关');
  addCabinetLines3D(scene,-5.68,1.38,3.1,2.0,4,'entry-cabinet-line', true);
  box3D(scene,-4.78,.28,4.15,1.55,.36,.44,0x8d6b4b,'换鞋');
  box3D(scene,-4.08,1.52,3.62,.08,1.75,.9,0xa8c8c8,'穿衣');
}

function addStudyFurniturePlaced3D(scene){
  box3D(scene,-6.0,1.45,-3.35,.72,2.9,2.4,0x84a696,'整墙书柜');
  box3D(scene,-5.1,1.5,-1.65,.82,3.0,1.15,0x91b6a6,'书房资料');
  addCabinetLines3D(scene,-4.68,1.64,-1.65,1.04,3,'study-file-cabinet-line', true);
  addShelfBooks3D(scene,-5.65,-2.9);
  addShelfBooks3D(scene,-5.65,-1.9);
  box3D(scene,-3.55,.42,-3.85,1.6,.44,.72,0xa77b4f,'书桌');
  addTableLegs3D(scene,-3.55,-3.85,1.38,.54,.42);
  box3D(scene,-3.55,1.03,-4.15,.78,.62,.1,0x25312e,'显示');
  box3D(scene,-2.78,.55,-2.98,.55,1.1,.55,0x5d6b68,'办公');
}

function addBedroomFurniturePlaced3D(scene){
  box3D(scene,3.72,.38,-3.3,2.4,.55,1.85,0xa08366,'卧室床架');
  box3D(scene,3.72,.72,-3.3,2.22,.32,1.62,0xe0cfdc,'卧室床品');
  box3D(scene,3.72,.95,-4.05,2.15,.32,.22,0xcbb7cf,'枕头');
  box3D(scene,5.95,1.45,-2.42,.68,2.9,2.42,0xc9b5c8,'卧室收纳');
  addCabinetLines3D(scene,5.6,1.55,-2.42,2.2,4,'bedroom-closet-line', true);
  box3D(scene,2.52,.42,-2.1,.52,.62,.46,0x9d7958,'床头');
  addPlant3D(scene,2.7,.1,-4.72);
}

function addBalconyFurniturePlaced3D(scene){
  box3D(scene,-1.52,.62,-5.0,.9,1.25,.72,0xedf0ed,'洗衣');
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.08,32), mat3D(0x9fbfc1));
  drum.rotation.x = Math.PI/2;
  drum.position.set(-1.52,.66,-4.62);
  scene.add(drum);
  box3D(scene,.95,1.85,-5.0,2.2,.05,.05,0x5c6864,'晾衣');
  box3D(scene,.55,1.28,-5.0,.35,.84,.05,0xfff3cf,'晾晒');
  box3D(scene,1.18,1.22,-5.0,.38,.76,.05,0xe7f1ee,'晾晒');
}

function addBathFurniturePlaced3D(scene){
  box3D(scene,5.45,.62,-.2,.95,.62,.56,0xf4f7f6,'洗手');
  box3D(scene,5.45,1.52,-.52,.95,1.02,.08,0xa8c8c8,'镜柜');
  box3D(scene,4.82,.42,1.12,.72,.72,.72,0xf4f7f6,'马桶');
  box3D(scene,6.05,1.2,1.25,.08,1.65,1.25,0xa8c8c8,'淋浴玻璃');
  box3D(scene,5.98,1.72,.05,.08,1.25,.08,0x5c6864,'花洒');
}

function addReferenceInteriorDetails3D(scene){
  addLivingReferenceSkin3D(scene);
  addStudyReferenceDetails3D(scene);
  addBedroomReferenceDetails3D(scene);
  addEntryReferenceDetails3D(scene);
  addBalconyReferenceDetails3D(scene);
  addWallArtSet3D(scene);
}

function addLivingReferenceSkin3D(scene){
  roundedBox3D(scene,-1.2,.91,2.55,.58,.3,.18,0xe8d8c3,'sofa-warm-pillow-left',.08,{rough:.96});
  roundedBox3D(scene,-.66,.91,2.55,.44,.28,.18,0xe7dcc8,'sofa-cream-pillow',.08,{rough:.96});
  roundedBox3D(scene,.35,.42,1.45,1.36,.12,.78,HOME_PALETTE.woodLight,'coffee-table-soft-top',.18,{rough:.72});
  cylinder3D(scene,.35,.2,1.45,.12,.52,HOME_PALETTE.wood,'coffee-table-center-leg',20,{rough:.7});
  roundedBox3D(scene,1.72,.62,-.22,2.35,.26,.08,0xe9c283,'living-tv-cabinet-front',.05,{rough:.76});
  for(let i=-1;i<=1;i++) addCabinetHandle3D(scene,1.72+i*.54,.66,-.16,.24,.06,false);
}

function addStudyReferenceDetails3D(scene){
  const colors = [0x9fb47e,0xc9d3bd,0xd8bd83,0x95a98f];
  for(let i=0;i<4;i++){
    roundedBox3D(scene,-4.6+i*.36,.33,-.92,.28,.28,.38,colors[i],`study-storage-box-${i}`,.04,{rough:.86});
    box3D(scene,-4.6+i*.36,.45,-.71,.12,.025,.02,0x415044,`study-box-label-${i}`,{rough:.7});
  }
  addTaskLamp3D(scene,-4.08,.72,-3.62);
  addBookStack3D(scene,-3.12,.67,-3.58);
}

function addBedroomReferenceDetails3D(scene){
  roundedBox3D(scene,4.88,.78,3.92,1.32,.38,.42,HOME_PALETTE.woodLight,'bedroom-vanity',.07,{rough:.78});
  cylinder3D(scene,4.88,1.43,3.72,.34,.035,0xcfa067,'round-vanity-mirror',32,{rotX:Math.PI/2,rough:.46,metalness:.12});
  cylinder3D(scene,4.88,1.43,3.69,.28,.025,0xcde0df,'mirror-glass',32,{rotX:Math.PI/2,rough:.32,metalness:.02});
  roundedBox3D(scene,4.88,.33,3.25,.42,.28,.36,0xe8dfd0,'vanity-stool',.08,{rough:.88});
  for(let i=-1;i<=1;i++) addCabinetHandle3D(scene,5.57,1.02+i*.42,-2.08,.24,.08,true);
  roundedBox3D(scene,3.0,.98,-3.58,.48,.24,.16,0xb7c99c,'bedroom-accent-pillow',.08,{rough:.96});
}

function addEntryReferenceDetails3D(scene){
  roundedBox3D(scene,-5.98,2.18,3.74,.12,.72,.72,0xf4efe6,'entry-cabinet-light-panel',.03,{rough:.82});
  addCabinetHandle3D(scene,-5.62,1.48,2.46,.8,.08,true);
  addCabinetHandle3D(scene,-5.62,1.48,3.68,.8,.08,true);
}

function addBalconyReferenceDetails3D(scene){
  roundedBox3D(scene,1.82,.54,-5.02,.72,.48,.5,HOME_PALETTE.woodLight,'balcony-low-storage',.05,{rough:.78});
}

function addWallArtSet3D(scene){
  addBotanicalArt3D(scene,3.52,1.82,-1.16,.52,.46,'bedroom-clover-art');
  addBotanicalArt3D(scene,-4.96,1.86,-1.16,.52,.46,'study-clover-art');
}

function addBotanicalArt3D(scene,x,y,z,w,h,name){
  box3D(scene,x,y,z,w+.08,h+.08,.035,HOME_PALETTE.wood,'art-frame',{rough:.76});
  planeMat3D(scene,x,y,z+.025,w,h,0xfafff5,0,0,name,{rough:.88});
  var _leafMat = mat3D(HOME_PALETTE.sageDeep,.92,{transparent:true,opacity:.82});
  [[-.08,.04,.05,.08],[.05,.06,.04,.06],[.08,-.02,.05,.07],[-.03,-.07,.04,.05]].forEach(function(arr,i){
    var leaf = new THREE.Mesh(new THREE.CircleGeometry(arr[2],16), _leafMat);
    leaf.position.set(x+arr[0], y+arr[1], z+.04);
    leaf.rotation.z = i*.7 + .4;
    scene.add(leaf);
  });
  var _stemMat = mat3D(HOME_PALETTE.sage,.9,{transparent:true,opacity:.6});
  var stem = new THREE.Mesh(new THREE.PlaneGeometry(.008,.16), _stemMat);
  stem.position.set(x, y, z+.038);
  scene.add(stem);
}

function addTaskLamp3D(scene,x,y,z){
  cylinder3D(scene,x,y,z,.045,.75,0xe6ded0,'task-lamp-arm',16,{rotZ:.55,rough:.52,metalness:.12});
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.12,.2,.16,24), mat3D(0xf4efe6,.72));
  shade.position.set(x+.28,y+.42,z-.08);
  shade.rotation.z = .55;
  shade.castShadow = true;
  scene.add(shade);
}

function addBookStack3D(scene,x,y,z){
  [0xe6d8b8,0xa8bd90,0x7ea0a7,0xd0b170].forEach((color,i)=>{
    box3D(scene,x,y+i*.045,z,.5-.04*i,.04,.32,color,`book-stack-${i}`,{rough:.88});
  });
}

function addHomeDecor3D(scene){
  addRug3D(scene,-.55,.024,1.78,2.65,1.42,0xd7c4a1,'客厅编织地毯','woven');
  addRug3D(scene,3.72,.024,-3.18,2.15,1.72,0xe5d7de,'卧室床边地毯','striped');
  addWallArt3D(scene,-1.35,1.82,-1.13,.7,.46,0xd8a85b,'客厅装饰');
  addWallArt3D(scene,-4.95,1.88,-1.13,.62,.5,0x9fb7b0,'书房装饰');
  addThrowPillow3D(scene,-1.95,.88,2.62,0xf0e1c8);
  addThrowPillow3D(scene,-.78,.88,2.62,0xe8d8c3);
  addThrowPillow3D(scene,3.0,.98,-3.68,0xf3dfe8);
  addSideLamp3D(scene,2.56,.72,-2.1);
  addPlant3D(scene,5.8,.1,-4.7);
}

function addRug3D(scene,x,y,z,w,d,color,name,rugType){
  var tex = rugType ? createRugTexture(rugType, color) : null;
  var matOpts = tex ? {texture:tex} : {};
  const rug = new THREE.Mesh(new THREE.BoxGeometry(w,.028,d), mat3D(color,.96,matOpts));
  rug.position.set(x,y,z);
  rug.name = name;
  rug.receiveShadow = true;
  scene.add(rug);
  if(!tex){
    for(let i=-2;i<=2;i++){
      box3D(scene,x + i*w/6,y+.018,z,w*.015,.018,d*.9,0xf4ead9,`${name}-织线`);
    }
  }
}

function addWallArt3D(scene,x,y,z,w,h,color,name){
  const frame = box3D(scene,x,y,z,w+.08,h+.08,.035,0x8f7458,`${name}-画框`);
  frame.castShadow = false;
  const art = new THREE.Mesh(new THREE.PlaneGeometry(w,h), mat3D(color,.72));
  art.position.set(x,y,z+.025);
  art.name = name;
  art.receiveShadow = true;
  scene.add(art);
}

function addThrowPillow3D(scene,x,y,z,color){
  const pillow = new THREE.Mesh(new THREE.SphereGeometry(.24,24,12), mat3D(color,.9));
  pillow.scale.set(1.45,.42,.88);
  pillow.position.set(x,y,z);
  pillow.rotation.y = .15;
  pillow.castShadow = true;
  pillow.receiveShadow = true;
  scene.add(pillow);
}

function addSideLamp3D(scene,x,y,z){
  box3D(scene,x,.45,z,.14,.9,.14,0x7c6651,'床头台灯灯杆');
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.22,.32,.24,24), mat3D(0xe6d4bd,.82));
  shade.position.set(x,y+.52,z);
  shade.castShadow = true;
  shade.receiveShadow = true;
  scene.add(shade);
}

function addTableLegs3D(scene,x,z,w,d,h){
  const xs = [x-w/2+.12, x+w/2-.12];
  const zs = [z-d/2+.1, z+d/2-.1];
  xs.forEach(px=>zs.forEach(pz=>box3D(scene,px,h/2,pz,.06,h,.06,0x5f4634,'桌腿')));
}

function addCabinetLines3D(scene,x,y,z,width,count,name,vertical=false){
  for(let i=1;i<count;i++){
    if(vertical){
      box3D(scene,x,y,z - width/2 + i*width/count,.035,1.6,.02,0x5f5142,name);
    }else{
      box3D(scene,x - width/2 + i*width/count,y,z,.025,.36,.035,0x5f5142,name);
    }
  }
}

function addHouseMoveTargets3D(scene, activeNode){
  TOUR_NODES.forEach(node=>{
    const [x,,z] = node.pos || [0,1.56,0];
    const active = node.id === activeNode.id;
    const reachable = active || (TOUR_GRAPH[activeNode.id] || []).includes(node.id);
    const color = active ? 0xd9a441 : reachable ? 0xffffff : 0x9fa6a3;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(.2,.42,40),
      new THREE.MeshBasicMaterial({color, transparent:true, opacity:active ? .72 : reachable ? .42 : .08, side:THREE.DoubleSide})
    );
    ring.position.set(x,.045,z);
    ring.rotation.x = -Math.PI/2;
    ring.name = `${node.name}-移动节点`;
    ring.userData = {moveTarget:true, tourNode:node.id};
    scene.add(ring);
    webglTour?.moveTargets?.push(ring);

    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(.62,40),
      new THREE.MeshBasicMaterial({color, transparent:true, opacity:active ? .16 : reachable ? .075 : .018, side:THREE.DoubleSide})
    );
    glow.position.set(x,.04,z);
    glow.rotation.x = -Math.PI/2;
    glow.userData = {moveTarget:true, tourNode:node.id};
    scene.add(glow);
    webglTour?.moveTargets?.push(glow);
    if(reachable && !active){
      const route = walkingPath(activeNode.id, node.id);
      const prev = route[Math.max(0, route.length-2)] || route[0];
      const arrowYaw = Math.atan2(x - prev[0], z - prev[2]);
      const arrow = new THREE.Mesh(
        new THREE.ConeGeometry(.12,.36,3),
        new THREE.MeshBasicMaterial({color, transparent:true, opacity:.42, side:THREE.DoubleSide})
      );
      arrow.position.set(x,.058,z);
      arrow.rotation.x = -Math.PI/2;
      arrow.rotation.z = arrowYaw;
      arrow.userData = {moveTarget:true, tourNode:node.id};
      scene.add(arrow);
      webglTour?.moveTargets?.push(arrow);
    }
  });
}

function addRoomShell3D(scene, node){
  const lightOn = state.lightOn !== false;
  const isBath = node.id==='bath-node';
  const floorColor = isBath ? 0xd8dfdc : (lightOn ? 0xd49b5e : 0x6c5647);
  var focusedFloorTex;
  if(isBath){
    focusedFloorTex = _texRepeat(createTileTexture(floorColor, 0x9eaaa8, {tileSize:128}), 8, 9);
  }else{
    focusedFloorTex = _texRepeat(createWoodGrainTexture(floorColor, {grainStrength:.5}), 4, 5);
  }
  var floorRough = isBath ? .82 : .8;
    plane3D(scene,0,0,0,9.6,10.8,floorColor,-Math.PI/2,0,'floor',{texture:focusedFloorTex,rough:floorRough});
  plane3D(scene,0,3.05,-5.2,9.6,6.1,lightOn ? HOME_PALETTE.wallWarm : 0x8b8176,0,0,'back-wall');
  plane3D(scene,-4.8,3.05,0,10.8,6.1,lightOn ? 0xf0e3d2 : 0x71675f,0,Math.PI/2,'left-wall');
  plane3D(scene,4.8,3.05,0,10.8,6.1,lightOn ? 0xf7ecdf : 0x786e64,0,-Math.PI/2,'right-wall');
  plane3D(scene,0,3.05,5.4,9.6,6.1,lightOn ? 0xe6d5bf : 0x665a4f,0,Math.PI,'front-wall');
  plane3D(scene,0,6.1,0,9.6,10.8,lightOn ? HOME_PALETTE.ceiling : 0x90877d,Math.PI/2,0,'ceiling');
  addFloorBoards3D(scene, node.id==='bath-node');
  addFocusedBaseboards3D(scene, isBath);
  addDoorAndWindow3D(scene, node);
  addPendant3D(scene, 0, 3.05, -1.2);
}

function addFocusedBaseboards3D(scene, isBath=false){
  const color = isBath ? 0xe3ebe7 : HOME_PALETTE.woodLight;
  box3D(scene,0,.13,-5.06,9.3,.16,.08,color,'focused-back-baseboard',{rough:.78});
  box3D(scene,-4.66,.13,0,.08,.16,10.3,color,'focused-left-baseboard',{rough:.78});
  box3D(scene,4.66,.13,0,.08,.16,10.3,color,'focused-right-baseboard',{rough:.78});
  box3D(scene,0,HOUSE_CEILING_Y-.34,-5.05,9.3,.06,.08,0xf5eadc,'focused-back-cove',{rough:.84});
}

function addFloorBoards3D(scene, tiled=false){
  const lightOn = state.lightOn !== false;
  const color = tiled ? (lightOn ? 0xdfe7e4 : 0xaeb9b7) : (lightOn ? 0xc09262 : 0x80624b);
  for(let i=-5;i<=5;i++){
    const line = box3D(webglTour.scene, i*.9, .012, .05, .018, .018, 10.3, color, 'floor-line');
    line.material = mat3D(color, .9);
  }
  for(let z=-5;z<=5;z++){
    box3D(webglTour.scene, 0, .014, z, 9.4, .016, .018, tiled ? (lightOn ? 0xa8b8b6 : 0x687675) : (lightOn ? 0x7b573b : 0x4d3b2f), 'floor-cross');
  }
}

function addDoorAndWindow3D(scene, node){
  const door = (x,z,label,color=0x5b4434)=>box3D(scene,x,1.55,z,1.05,3.1,.12,color,label);
  const glass = (x,z,w=1.8)=>box3D(scene,x,1.9,z,w,2.7,.08,0x9fc5c4,'glass-door');
  if(node.id==='living-node'){
    glass(0,-5.12,2.2);
    door(-2.6,-5.08,'书房',0x6b513d);
    door(3.0,-5.08,'卧室',0x6b513d);
    door(4.72,-1.4,'卫浴',0x60706f);
  }else if(node.id==='entry-node'){
    door(2.0,-5.08,'回客',0x6b513d);
    box3D(scene,-2.6,1.8,-5.1,1.1,2.3,.08,0xa8c8c8,'窄窗');
  }else if(node.id==='study-node'){
    door(-3.1,-5.08,'回客',0x6b513d);
    box3D(scene,1.6,2.05,-5.1,2.2,1.5,.08,0xa8c8c8,'书房');
  }else if(node.id==='bedroom-node'){
    door(-3.1,-5.08,'回客',0x6b513d);
    door(3.0,-5.08,'卫生',0x60706f);
    box3D(scene,1.1,2.08,-5.1,2.2,1.45,.08,0xa8c8c8,'卧室');
  }else if(node.id==='balcony-node'){
    box3D(scene,0,2.15,-5.08,5.8,2.8,.08,0xa8c8c8,'阳台');
    door(-3.8,-5.08,'客厅',0x6b513d);
  }else if(node.id==='bath-node'){
    door(-3.3,-5.08,'回客',0x60706f);
  }else{
    door(-3.1,-5.08,'回客',0x6b513d);
  }
}

function addPendant3D(scene,x,y,z){
  const lightOn = state.lightOn !== false;
  const wire = box3D(scene,x,y+.55,z,.04,1.1,.04,0x5f5142,'lamp-wire');
  wire.userData = {lightFixture:true};
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.42,.62,.32,32), mat3D(lightOn ? 0xd9a441 : 0x6b655d));
  shade.position.set(x,y,z);
  shade.userData = {lightFixture:true};
  scene.add(shade);
  webglTour?.lampObjects?.push(shade, wire);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.13,24,16), new THREE.MeshBasicMaterial({color: lightOn ? 0xffefb6 : 0x737b7e}));
  bulb.position.set(x,y-.2,z);
  bulb.userData = {lightFixture:true};
  scene.add(bulb);
  webglTour?.lampObjects?.push(bulb);
  const light = new THREE.PointLight(0xffdfa0, lightOn ? .95 : .03, 7);
  light.position.set(x,y-.28,z);
  scene.add(light);
}

function addNodeFurniture3D(scene,node){
  if(node.id==='living-node') addLivingFurniture3D(scene);
  if(node.id==='entry-node') addEntryFurniture3D(scene);
  if(node.id==='study-node') addStudyFurniture3D(scene);
  if(node.id==='bedroom-node') addBedroomFurniture3D(scene);
  if(node.id==='balcony-node') addBalconyFurniture3D(scene);
  if(node.id==='bath-node') addBathFurniture3D(scene);
}

function addLivingFurniture3D(scene){
  box3D(scene,-2.1,.55,1.55,2.7,1.1,.85,0x9a8777,'sofa');
  box3D(scene,-2.1,1.12,1.95,2.75,.75,.25,0x8f7d6e,'sofa-back');
  box3D(scene,-.15,.32,.65,1.25,.28,.75,0x8a6443,'coffee-table');
  box3D(scene,2.15,1.15,-4.75,2.45,1.4,.18,0x222827,'tv');
  box3D(scene,2.15,.55,-4.35,2.7,.58,.65,0x9fb8c8,'客厅抽屉');
  box3D(scene,-4.05,1.35,-1.6,.8,2.7,.55,0xb58b55,'玄关方向');
  box3D(scene,-4.25,1.65,-3.4,.65,2.6,.42,0x8b6748,'书柜');
  addPlant3D(scene,3.95,.1,-1.6);
}

function addEntryFurniture3D(scene){
  box3D(scene,-3.25,1.45,-2.4,1.35,2.9,.6,0xa77842,'玄关');
  box3D(scene,.9,.35,.8,2.1,.45,.55,0x8a6849,'鞋凳');
  box3D(scene,2.7,1.6,-2.8,.9,1.7,.08,0xa8c8c8,'穿衣');
}

function addStudyFurniture3D(scene){
  box3D(scene,-3.0,1.55,-2.6,1.35,3.1,.55,0x6b8f80,'书柜');
  box3D(scene,-1.5,1.55,-2.6,1.35,3.1,.55,0x75a390,'书房资料');
  addShelfBooks3D(scene,-2.25,-2.28);
  box3D(scene,1.6,.75,1.0,2.2,.55,1.05,0xa77b4f,'书桌');
  box3D(scene,1.4,1.45,.45,.9,.7,.12,0x25312e,'显示');
  box3D(scene,1.4,.96,.86,.72,.035,.22,0x303b3a,'study-keyboard-fallback',{rough:.64});
  roundedBox3D(scene,.28,.56,1.52,.62,.82,.62,0x93a66f,'study-task-chair-fallback',.08,{rough:.86});
  addTaskLamp3D(scene,2.22,.9,.58);
  addBookStack3D(scene,2.18,1.02,1.18);
  box3D(scene,1.18,1.92,-5.04,1.28,.52,.05,0xe7ded0,'study-note-wall-fallback',{rough:.9,castShadow:false});
}

function addBedroomFurniture3D(scene){
  box3D(scene,-1.8,.45,1.1,2.8,.55,2.0,0x8f735c,'床架');
  box3D(scene,-1.8,.82,1.1,2.55,.35,1.75,0xd7c4d8,'床品');
  roundedBox3D(scene,-1.8,.98,.28,2.92,.74,.18,0x9f755e,'bedroom-headboard-fallback',.08,{rough:.84});
  roundedBox3D(scene,-2.34,1.06,.42,.56,.22,.18,0xfffdfa,'bedroom-pillow-left-fallback',.08,{rough:.96});
  roundedBox3D(scene,-1.42,1.06,.42,.56,.22,.18,0xfffdfa,'bedroom-pillow-right-fallback',.08,{rough:.96});
  roundedBox3D(scene,-1.8,.9,1.42,1.78,.11,.7,0xcbb7cf,'bedroom-folded-quilt-fallback',.08,{rough:.96});
  box3D(scene,2.85,1.55,-2.1,1.45,3.1,.65,0xb997bd,'卧室收纳');
  box3D(scene,3.58,1.15,-2.1,.04,.82,.08,0x6c5b68,'bedroom-wardrobe-handle-fallback',{rough:.56,metalness:.08});
  roundedBox3D(scene,-3.42,.48,1.38,.52,.68,.48,0xd9a96d,'bedroom-left-nightstand-fallback',.05,{rough:.76});
  addSideLamp3D(scene,-3.42,.76,1.4);
  box3D(scene,.4,.55,1.5,.55,.7,.5,0x9d7958,'床头');
  addSideLamp3D(scene,.4,.82,1.5);
}

function addBalconyFurniture3D(scene){
  box3D(scene,-2.8,.72,-1.4,1.1,1.45,1.0,0xedf0ed,'洗衣');
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.08,32), mat3D(0x9fbfc1));
  drum.rotation.x = Math.PI/2;
  drum.position.set(-2.8,.78,-.88);
  scene.add(drum);
  box3D(scene,.7,2.4,-2.7,3.4,.05,.05,0x5c6864,'晾衣');
  box3D(scene,.1,1.7,-2.7,.42,1.1,.05,0xfff3cf,'晾晒');
  box3D(scene,.75,1.65,-2.7,.42,1.0,.05,0xe7f1ee,'晾晒');
  addPlant3D(scene,3.5,.1,-1.4);
}

function addBathFurniture3D(scene){
  var marbleTex = createMarbleTexture(0xf2f0ed, 0x8a9a98);
  box3D(scene,-2.8,.75,-2.4,1.15,.72,.65,0xf2f0ed,'洗手',{texture:marbleTex,rough:.42});
  box3D(scene,-2.8,1.65,-4.92,1.15,1.25,.08,0xa8c8c8,'镜柜',{transparent:true,opacity:.35,rough:.15});
  box3D(scene,.2,.45,-1.4,.9,.9,.9,0xf4f7f6,'马桶',{rough:.32});
  box3D(scene,2.65,1.55,-3.1,1.25,3.1,.08,0xa8c8c8,'淋浴玻璃',{transparent:true,opacity:.3,rough:.12});
  box3D(scene,3.35,1.7,-4.7,.08,1.7,.08,0x5c6864,'花洒',{metalness:.3,rough:.4});
}

/* Phase 4: Enhanced decoration helpers */
function addSmallPottedPlant3D(scene,x,y,z,scale){
  scale = scale || 1;
  var _lit = state.lightOn !== false;
  var potColor = _lit ? 0xf5efe4 : 0x6a625a;
  cylinder3D(scene,x,y+.06*scale,z,.055*scale,.12*scale,potColor,'small-plant-pot',20,{rough:.82,side:THREE.FrontSide});
  cylinder3D(scene,x,y+.13*scale,z,.07*scale,.02*scale,_lit?0xe8dcc8:0x5a544c,'small-plant-rim',20,{rough:.78,side:THREE.FrontSide});
  var leafMat = mat3D(_lit?0x5a8a4a:0x2a4a30,.82,{side:THREE.FrontSide});
  for(var i=0;i<5;i++){
    var leaf = new THREE.Mesh(new THREE.SphereGeometry(.08*scale,16,12), leafMat);
    leaf.scale.set(.5,.4,.5);
    leaf.position.set(x+Math.cos(i*1.3)*.045*scale, y+.19*scale+(i%2)*.035*scale, z+Math.sin(i*1.3)*.045*scale);
    leaf.rotation.y = i*1.1;
    leaf.rotation.z = (i%2?1:-1)*.3;
    leaf.castShadow = true;
    scene.add(leaf);
  }
}

function addVaseWithFlowers3D(scene,x,y,z,scale){
  scale = scale || 1;
  var _lit = state.lightOn !== false;
  var vaseColor = _lit ? 0xf8f5f0 : 0x8a8580;
  cylinder3D(scene,x,y+.055*scale,z,.035*scale,.11*scale,vaseColor,'vase-body',16,{rough:.42});
  cylinder3D(scene,x,y+.12*scale,z,.022*scale,.035*scale,vaseColor,'vase-neck',12,{rough:.42});
  var fcols = [0xfff5e0,0xf0d090,0xc8d8a0];
  for(var i=0;i<3;i++){
    var angle = i*2.1;
    var flower = new THREE.Mesh(new THREE.SphereGeometry(.022*scale,12,8), mat3D(_lit?fcols[i]:0x8a8580,.88));
    flower.position.set(x+Math.cos(angle)*.028*scale, y+.17*scale, z+Math.sin(angle)*.028*scale);
    scene.add(flower);
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(.003*scale,.003*scale,.08*scale,6), mat3D(_lit?0x6a8a4a:0x3a4a30,.8));
    stem.position.set(x+Math.cos(angle)*.014*scale, y+.13*scale, z+Math.sin(angle)*.014*scale);
    scene.add(stem);
  }
}

function addWallSconce3D(scene,x,y,z){
  var _lit = state.lightOn !== false;
  box3D(scene,x,y,z,.08,.14,.05,0x7c6651,'wall-sconce-backplate',{rough:.56});
  var shade = new THREE.Mesh(new THREE.CylinderGeometry(.055,.1,.14,20), mat3D(_lit?0xfff3cf:0x5a5550,.72,{transparent:true,opacity:.82}));
  shade.position.set(x,y,z+.035);
  shade.rotation.x = .3;
  scene.add(shade);
  if(_lit){
    var light = new THREE.PointLight(0xffd6a0,.12,2);
    light.position.set(x,y,z+.12);
    scene.add(light);
  }
}

function addPlant3D(scene,x,y,z){
  addCompactFloorPlant3D(scene,x,z,.72,`legacy-floor-plant-${Math.round(x*100)}-${Math.round(z*100)}`);
}

function addShelfBooks3D(scene,x,z){
  const colors = [0xfffdfa,0xd9a441,0xe7f1ee,0xf2eef7,0xc9d7e0];
  for(let row=0; row<4; row++){
    for(let i=0; i<5; i++){
      box3D(scene,x-.45+i*.22,.55+row*.55,z+.31,.12,.34,.08,colors[(row+i)%colors.length], '书脊');
    }
  }
}

function drawTourScene(){
  const canvas = $('[data-tour-canvas]');
  if(!canvas) return;
  const wrap = canvas.parentElement;
  const rect = wrap.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(640, Math.floor(rect.width));
  const height = Math.max(420, Math.floor(rect.height));
  if(canvas.width !== Math.floor(width*dpr) || canvas.height !== Math.floor(height*dpr)){
    canvas.width = Math.floor(width*dpr);
    canvas.height = Math.floor(height*dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const zoom = clamp(state.spaceCamera?.zoom || 1, 1, 1.48);
  canvas.style.transform = `scale(${zoom})`;
  canvas.style.transformOrigin = 'center center';
  const node = currentTourNode();
  const yaw = (state.tourYaw || 0) + (node.yaw || 0);
  renderRoomCanvas(ctx, width, height, node, yaw);
}

function renderRoomCanvas(ctx, w, h, node, yaw){
  ctx.clearRect(0,0,w,h);
  const cx = w/2 + Math.sin(yaw * Math.PI/180) * Math.min(130, w*.11);
  const horizon = h * .43 + (state.tourPitch || 0);
  const room = {
    cx,
    horizon,
    backTop:w*.24,
    backRight:w*.76,
    backBottom:h*.6,
    ceil:h*.11,
    floor:h*.98
  };
  if(isRealHomeTourNode(node)){
    renderRealHomeRoomCanvas(ctx,w,h,node,room,yaw);
    return;
  }
  drawRoomShell(ctx,w,h,room,node);
  drawCeilingLight(ctx,w,h,room);
  drawWallPanel(ctx,w,h,room,node);
  drawRoomSunlight(ctx,w,h,room,node);
  drawPerspectiveLines(ctx,w,h,room);
  if(node.id==='living-node') drawLivingScene(ctx,w,h,room);
  if(node.id==='entry-node') drawEntryScene(ctx,w,h,room);
  if(node.id==='study-node') drawStudyScene(ctx,w,h,room);
  if(node.id==='bedroom-node') drawBedroomScene(ctx,w,h,room);
  if(node.id==='balcony-node') drawBalconyScene(ctx,w,h,room);
  if(node.id==='bath-node') drawBathScene(ctx,w,h,room);
  drawLightStateOverlay(ctx,w,h);
  drawVignette(ctx,w,h);
}

function isRealHomeTourNode(node){
  return ['living-node','entry-node','study-node','balcony-node','bedroom-node','bath-node'].includes(node?.id);
}

function renderRealHomeRoomCanvas(ctx,w,h,node,r,yaw){
  const scene = realHomeSceneConfig(node);
  const p = makeInteriorCamera(w,h,scene.room.w,scene.room.d,{
    cameraZ: scene.cameraZ,
    eyeY: scene.eyeY || 1540,
    fov: scene.fov || 50,
    yawDeg: clamp((yaw || 0) * .22 + (scene.yawDeg || 0), -18, 18),
    pitchDeg: clamp((state.tourPitch || 0) * .12, -4, 4),
    cameraX: scene.cameraX
  });
  drawRealRoomShell(ctx,p,scene);
  scene.draw(ctx,p,scene);
  drawLightStateOverlay(ctx,w,h);
  drawVignette(ctx,w,h);
}

function realHomeSceneConfig(node){
  if(node.id === 'entry-node'){
    const room = REAL_HOME_SPEC.rooms.living;
    return {
      id:'entry-open',
      room,
      material:'wood',
      openRightSide:true,
      cameraZ:-1180,
      cameraX:room.w*.18,
      yawDeg:4,
      fov:64,
      farWindow:{x:(room.w-room.window.w)/2, y:room.window.sill, w:room.window.w, h:room.window.h, floorToCeiling:true},
      draw:drawRealEntryToLivingScene
    };
  }
  if(node.id === 'study-node'){
    const room = REAL_HOME_SPEC.rooms.secondaryBedroom2;
    return {
      id:'study',
      room,
      material:'wood',
      cameraZ:-2100,
      cameraX:room.w*.5,
      fov:52,
      farWindow:{x:(room.w-1200)/2, y:REAL_HOME_SPEC.sill, w:1200, h:1500},
      draw:drawRealStudyScene
    };
  }
  if(node.id === 'bedroom-node'){
    const room = REAL_HOME_SPEC.rooms.masterBedroom;
    return {
      id:'bedroom',
      room,
      material:'wood',
      openRightSide:true,
      cameraZ:-2550,
      cameraX:room.w*.34,
      fov:54,
      farWindow:{x:(room.w-room.bayWindow.w)/2, y:room.bayWindow.sill, w:room.bayWindow.w, h:1500, bay:true},
      draw:drawRealBedroomScene
    };
  }
  if(node.id === 'bath-node'){
    const room = REAL_HOME_SPEC.rooms.publicBath;
    return {
      id:'bath',
      room,
      material:'tile',
      cameraZ:-1350,
      cameraX:room.w/2 + 130,
      fov:54,
      sideWindow:{wall:'west', z:(room.d-room.window.w)/2, y:REAL_HOME_SPEC.sill, w:room.window.w, h:room.window.h},
      draw:drawRealBathScene
    };
  }
  if(node.id === 'balcony-node'){
    const room = REAL_HOME_SPEC.rooms.living;
    return {
      id:'balcony',
      room,
      material:'wood',
      openRightSide:true,
      cameraZ:-2820,
      cameraX:room.w*.5,
      yawDeg:0,
      fov:46,
      farWindow:{x:(room.w-room.window.w)/2, y:room.window.sill, w:room.window.w, h:room.window.h, floorToCeiling:true},
      draw:drawRealBalconySceneCanvas
    };
  }
  const room = REAL_HOME_SPEC.rooms.living;
  return {
    id:'living',
    room,
    material:'wood',
    openRightSide:true,
    cameraZ:-2600,
    cameraX:room.w*.28,
    fov:48,
    farWindow:{x:(room.w-room.window.w)/2, y:room.window.sill, w:room.window.w, h:room.window.h, floorToCeiling:true},
    draw:drawRealLivingScene
  };
}

function makeInteriorCamera(w,h,roomW,roomD,opts={}){
  const fov = (opts.fov || 50) * Math.PI / 180;
  const focal = h / (2 * Math.tan(fov / 2));
  const cam = {
    x: opts.cameraX ?? roomW/2,
    y: opts.eyeY ?? 1540,
    z: opts.cameraZ ?? -2200
  };
  const yaw = (opts.yawDeg || 0) * Math.PI / 180;
  const pitch = (opts.pitchDeg || 0) * Math.PI / 180;
  const cy = h * .5;
  const project = (x,y,z)=>{
    const dx = x - cam.x;
    const dy = y - cam.y;
    const dz = z - cam.z;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const x0 = dx * cosY - dz * sinY;
    const z0 = dx * sinY + dz * cosY;
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const y1 = dy * cosP - z0 * sinP;
    const z1 = dy * sinP + z0 * cosP;
    if(z1 < 80) return null;
    return {
      x: w/2 + x0 / z1 * focal,
      y: cy - y1 / z1 * focal,
      depth: z1,
      scale: focal / z1
    };
  };
  return {
    w,h,roomW,roomD,height:REAL_HOME_SPEC.netHeight,cam,focal,project,
    depth:(x,y,z)=>{
      const dx = x - cam.x;
      const dy = y - cam.y;
      const dz = z - cam.z;
      const x0 = dx * Math.cos(yaw) - dz * Math.sin(yaw);
      const z0 = dx * Math.sin(yaw) + dz * Math.cos(yaw);
      return dy * Math.sin(pitch) + z0 * Math.cos(pitch);
    }
  };
}

function drawRealRoomShell(ctx,p,scene){
  const lightOn = state.lightOn !== false;
  const wall = scene.material === 'tile'
    ? (lightOn ? '#dfe7e4' : '#8d9997')
    : (lightOn ? '#f6eadd' : '#756b62');
  const side = scene.material === 'tile'
    ? (lightOn ? '#cddbd8' : '#74817f')
    : (lightOn ? '#e6d3bd' : '#62564b');
  const floor = scene.material === 'tile'
    ? (lightOn ? '#c9d8d4' : '#65716f')
    : (lightOn ? '#bd8551' : '#574236');
  const ceiling = lightOn ? '#fff8ee' : '#7e7974';

  const bg = ctx.createLinearGradient(0,0,0,p.h);
  bg.addColorStop(0, lightOn ? '#dcecee' : '#65787c');
  bg.addColorStop(.45, lightOn ? '#f7ecde' : '#665f58');
  bg.addColorStop(1, lightOn ? '#8b5a3b' : '#302823');
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,p.w,p.h);

  draw3DPoly(ctx,p,[[0,p.height,0],[p.roomW,p.height,0],[p.roomW,p.height,p.roomD],[0,p.height,p.roomD]],ceiling);
  if(scene.sideWindow?.wall === 'west') drawWestWallWithWindow(ctx,p,scene,side);
  else draw3DPoly(ctx,p,[[0,0,0],[0,0,p.roomD],[0,p.height,p.roomD],[0,p.height,0]],side);
  if(!scene.openRightSide){
    draw3DPoly(ctx,p,[[p.roomW,0,p.roomD],[p.roomW,0,0],[p.roomW,p.height,0],[p.roomW,p.height,p.roomD]],shade(side,14));
  }
  drawSouthWall(ctx,p,scene,wall);
  draw3DPoly(ctx,p,[[0,0,0],[p.roomW,0,0],[p.roomW,0,p.roomD],[0,0,p.roomD]],floor);

  if(scene.material === 'tile'){
    drawRealTileGrid(ctx,p);
    drawRealWallTileGrid(ctx,p);
  }else{
    drawRealWoodFloor(ctx,p);
  }
  if(scene.farWindow) drawAmbientWindowWash(ctx,p,scene.farWindow);
  drawRealSkirting(ctx,p,scene.material === 'tile' ? '#a6b5b2' : '#8f6644');
  drawRealCeilingLight(ctx,p,scene);
}

function drawAmbientWindowWash(ctx,p,win){
  ctx.save();
  const top = p.project(win.x + win.w*.5, win.y + win.h*.75, p.roomD + 10);
  const floor = p.project(win.x + win.w*.52, 8, p.roomD - 900);
  if(!top || !floor){ ctx.restore(); return; }
  const glow = ctx.createRadialGradient(top.x,top.y,0,floor.x,floor.y,Math.min(p.w,p.h)*.55);
  glow.addColorStop(0,state.lightOn !== false ? 'rgba(255,247,222,.28)' : 'rgba(162,194,202,.14)');
  glow.addColorStop(.5,state.lightOn !== false ? 'rgba(255,238,199,.12)' : 'rgba(162,194,202,.06)');
  glow.addColorStop(1,'rgba(255,238,199,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0,0,p.w,p.h);
  ctx.restore();
}

function drawSouthWall(ctx,p,scene,color){
  const win = scene.farWindow;
  if(!win){
    draw3DPoly(ctx,p,[[0,0,p.roomD],[p.roomW,0,p.roomD],[p.roomW,p.height,p.roomD],[0,p.height,p.roomD]],color);
    return;
  }
  drawWindowOpening(ctx,p,'south',win);
  if(!scene.openRightSide){
    drawFarWallRect(ctx,p,0,0,win.x,p.height,p.roomD,color);
    drawFarWallRect(ctx,p,win.x+win.w,0,p.roomW,p.height,p.roomD,color);
    if(win.y > 0) drawFarWallRect(ctx,p,win.x,0,win.x+win.w,win.y,p.roomD,shade(color,-5));
    if(win.y + win.h < p.height) drawFarWallRect(ctx,p,win.x,win.y+win.h,win.x+win.w,p.height,p.roomD,shade(color,8));
    drawWindowReveal(ctx,p,'south',win,color);
  }
  drawWindowFrame(ctx,p,'south',win);
}

function drawWestWallWithWindow(ctx,p,scene,color){
  const win = scene.sideWindow;
  drawWindowOpening(ctx,p,'west',win);
  drawWestWallRect(ctx,p,0,0,win.z,p.height,color);
  drawWestWallRect(ctx,p,win.z+win.w,0,p.roomD,p.height,color);
  if(win.y > 0) drawWestWallRect(ctx,p,win.z,0,win.z+win.w,win.y,shade(color,-4));
  if(win.y + win.h < p.height) drawWestWallRect(ctx,p,win.z,win.y+win.h,win.z+win.w,p.height,shade(color,8));
  drawWindowReveal(ctx,p,'west',win,color);
  drawWindowFrame(ctx,p,'west',win);
}

function drawFarWallRect(ctx,p,x1,y1,x2,y2,z,color){
  if(x2 <= x1 || y2 <= y1) return;
  draw3DPoly(ctx,p,[[x1,y1,z],[x2,y1,z],[x2,y2,z],[x1,y2,z]],color);
}

function drawWestWallRect(ctx,p,z1,y1,z2,y2,color){
  if(z2 <= z1 || y2 <= y1) return;
  draw3DPoly(ctx,p,[[0,y1,z1],[0,y1,z2],[0,y2,z2],[0,y2,z1]],color);
}

function drawWindowOpening(ctx,p,wall,win){
  const pts = wall === 'south'
    ? [[win.x,win.y,p.roomD+28],[win.x+win.w,win.y,p.roomD+28],[win.x+win.w,win.y+win.h,p.roomD+28],[win.x,win.y+win.h,p.roomD+28]]
    : [[-28,win.y,win.z],[-28,win.y,win.z+win.w],[-28,win.y+win.h,win.z+win.w],[-28,win.y+win.h,win.z]];
  const screen = pts.map(([x,y,z])=>p.project(x,y,z)).filter(Boolean);
  if(screen.length !== 4) return;
  const minY = Math.min(...screen.map(pt=>pt.y));
  const maxY = Math.max(...screen.map(pt=>pt.y));
  const sky = ctx.createLinearGradient(0,minY,0,maxY);
  sky.addColorStop(0,state.lightOn !== false ? '#e5f5f6' : '#8ca5ab');
  sky.addColorStop(.58,state.lightOn !== false ? '#b9dbdf' : '#62777d');
  sky.addColorStop(1,state.lightOn !== false ? '#fff2d6' : '#5a5c5d');
  draw3DPoly(ctx,p,pts,sky);
  drawWindowGlow(ctx,p,wall,win);
  drawOutdoorHints(ctx,p,wall,win);
}

function drawWindowGlow(ctx,p,wall,win){
  const pts = wall === 'south'
    ? [[win.x,win.y,p.roomD+32],[win.x+win.w,win.y,p.roomD+32],[win.x+win.w,win.y+win.h,p.roomD+32],[win.x,win.y+win.h,p.roomD+32]]
    : [[-32,win.y,win.z],[-32,win.y,win.z+win.w],[-32,win.y+win.h,win.z+win.w],[-32,win.y+win.h,win.z]];
  const projected = pts.map(([x,y,z])=>p.project(x,y,z)).filter(Boolean);
  if(projected.length !== 4) return;
  const cx = projected.reduce((sum,pt)=>sum+pt.x,0)/4;
  const cy = projected.reduce((sum,pt)=>sum+pt.y,0)/4;
  ctx.save();
  const glow = ctx.createRadialGradient(cx,cy,0,cx,cy,Math.min(p.w,p.h)*.34);
  glow.addColorStop(0,state.lightOn !== false ? 'rgba(255,246,218,.42)' : 'rgba(174,205,213,.22)');
  glow.addColorStop(.52,state.lightOn !== false ? 'rgba(255,232,176,.18)' : 'rgba(120,152,160,.1)');
  glow.addColorStop(1,'rgba(255,232,176,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0,0,p.w,p.h);
  ctx.restore();
}

function drawWindowReveal(ctx,p,wall,win,color){
  const reveal = REAL_HOME_SPEC.wall.outer;
  if(wall === 'south'){
    const z0 = p.roomD - 2;
    const z1 = p.roomD + reveal;
    draw3DPoly(ctx,p,[[win.x,win.y,z0],[win.x,win.y,z1],[win.x,win.y+win.h,z1],[win.x,win.y+win.h,z0]],shade(color,-18));
    draw3DPoly(ctx,p,[[win.x+win.w,win.y,z1],[win.x+win.w,win.y,z0],[win.x+win.w,win.y+win.h,z0],[win.x+win.w,win.y+win.h,z1]],shade(color,-9));
    draw3DPoly(ctx,p,[[win.x,win.y+win.h,z0],[win.x+win.w,win.y+win.h,z0],[win.x+win.w,win.y+win.h,z1],[win.x,win.y+win.h,z1]],shade(color,10));
    if(win.y > 0){
      draw3DPoly(ctx,p,[[win.x,win.y,z1],[win.x+win.w,win.y,z1],[win.x+win.w,win.y,z0],[win.x,win.y,z0]],shade(color,-22));
    }
    return;
  }
  const x0 = 2;
  const x1 = -reveal;
  draw3DPoly(ctx,p,[[x0,win.y,win.z],[x1,win.y,win.z],[x1,win.y+win.h,win.z],[x0,win.y+win.h,win.z]],shade(color,-18));
  draw3DPoly(ctx,p,[[x1,win.y,win.z+win.w],[x0,win.y,win.z+win.w],[x0,win.y+win.h,win.z+win.w],[x1,win.y+win.h,win.z+win.w]],shade(color,-8));
  draw3DPoly(ctx,p,[[x0,win.y+win.h,win.z],[x0,win.y+win.h,win.z+win.w],[x1,win.y+win.h,win.z+win.w],[x1,win.y+win.h,win.z]],shade(color,10));
  if(win.y > 0){
    draw3DPoly(ctx,p,[[x1,win.y,win.z],[x1,win.y,win.z+win.w],[x0,win.y,win.z+win.w],[x0,win.y,win.z]],shade(color,-22));
  }
}

function drawOutdoorHints(ctx,p,wall,win){
  const y = win.y + win.h * .34;
  const y2 = win.y + win.h * .58;
  if(wall === 'south'){
    if(state.windowOpen === true){
      drawOutdoorCloud(ctx,p,win.x+win.w*.28,win.y+win.h*.72,p.roomD+36,260);
      drawOutdoorCloud(ctx,p,win.x+win.w*.58,win.y+win.h*.66,p.roomD+38,320);
      drawOutdoorCloud(ctx,p,win.x+win.w*.78,win.y+win.h*.76,p.roomD+37,210);
    }
    draw3DLine(ctx,p,[win.x+120,y,p.roomD+32],[win.x+win.w-120,y,p.roomD+32],'rgba(88,112,112,.22)',2);
    draw3DLine(ctx,p,[win.x+260,y2,p.roomD+34],[win.x+win.w*.42,y2+80,p.roomD+34],'rgba(88,112,112,.18)',2);
    draw3DLine(ctx,p,[win.x+win.w*.58,y2+40,p.roomD+34],[win.x+win.w-240,y2-20,p.roomD+34],'rgba(88,112,112,.16)',2);
    draw3DLine(ctx,p,[win.x+160,720,p.roomD+30],[win.x+win.w-160,720,p.roomD+30],'rgba(105,91,76,.24)',3);
  }else{
    draw3DLine(ctx,p,[-30,y,win.z+80],[-30,y,win.z+win.w-80],'rgba(88,112,112,.2)',2);
    draw3DLine(ctx,p,[-30,720,win.z+70],[-30,720,win.z+win.w-70],'rgba(105,91,76,.22)',3);
  }
}

function drawOutdoorCloud(ctx,p,x,y,z,w){
  const c = p.project(x,y,z);
  if(!c) return;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.72)';
  const scale = Math.max(.28, Math.min(1.2, c.scale * w / 430));
  [[0,0,80,30],[-52,8,58,22],[48,10,66,24]].forEach(([dx,dy,rx,ry])=>{
    ctx.beginPath();
    ctx.ellipse(c.x+dx*scale,c.y+dy*scale,rx*scale,ry*scale,0,0,Math.PI*2);
    ctx.fill();
  });
  ctx.restore();
}

function drawWindowFrame(ctx,p,wall,win){
  const frame = state.lightOn !== false ? '#f5f1e8' : '#889193';
  const mull = state.lightOn !== false ? 'rgba(72,86,84,.5)' : 'rgba(38,47,48,.55)';
  const lines = [];
  if(wall === 'south'){
    const z = p.roomD - 4;
    lines.push([[win.x,win.y,z],[win.x+win.w,win.y,z]]);
    lines.push([[win.x+win.w,win.y,z],[win.x+win.w,win.y+win.h,z]]);
    lines.push([[win.x+win.w,win.y+win.h,z],[win.x,win.y+win.h,z]]);
    lines.push([[win.x,win.y+win.h,z],[win.x,win.y,z]]);
    const panes = win.floorToCeiling ? 4 : 2;
    for(let i=1;i<panes;i++){
      const x = win.x + win.w * i / panes;
      lines.push([[x,win.y,z],[x,win.y+win.h,z]]);
    }
    lines.push([[win.x,win.y+win.h*.52,z],[win.x+win.w,win.y+win.h*.52,z]]);
  }else{
    const x = 4;
    lines.push([[x,win.y,win.z],[x,win.y,win.z+win.w]]);
    lines.push([[x,win.y,win.z+win.w],[x,win.y+win.h,win.z+win.w]]);
    lines.push([[x,win.y+win.h,win.z+win.w],[x,win.y+win.h,win.z]]);
    lines.push([[x,win.y+win.h,win.z],[x,win.y,win.z]]);
    lines.push([[x,win.y+win.h*.52,win.z],[x,win.y+win.h*.52,win.z+win.w]]);
  }
  lines.forEach((line,i)=>draw3DLine(ctx,p,line[0],line[1],i < 4 ? frame : mull,i < 4 ? 5 : 2.5));
}

function drawRealWoodFloor(ctx,p){
  for(let x=260;x<p.roomW;x+=260){
    draw3DLine(ctx,p,[x,2,0],[x,2,p.roomD],'rgba(73,48,31,.22)',1.2);
  }
  for(let z=420;z<p.roomD;z+=420){
    draw3DLine(ctx,p,[0,2,z],[p.roomW,2,z],'rgba(255,238,210,.16)',1);
  }
}

function drawRealTileGrid(ctx,p){
  for(let x=300;x<p.roomW;x+=300){
    draw3DLine(ctx,p,[x,3,0],[x,3,p.roomD],'rgba(76,93,93,.24)',1.2);
  }
  for(let z=300;z<p.roomD;z+=300){
    draw3DLine(ctx,p,[0,3,z],[p.roomW,3,z],'rgba(255,255,255,.18)',1.2);
  }
}

function drawRealWallTileGrid(ctx,p){
  for(let y=300;y<p.height;y+=300){
    draw3DLine(ctx,p,[0,y,p.roomD],[p.roomW,y,p.roomD],'rgba(82,105,104,.18)',1);
    draw3DLine(ctx,p,[0,y,0],[0,y,p.roomD],'rgba(82,105,104,.14)',1);
    draw3DLine(ctx,p,[p.roomW,y,0],[p.roomW,y,p.roomD],'rgba(82,105,104,.14)',1);
  }
  for(let x=300;x<p.roomW;x+=300) draw3DLine(ctx,p,[x,0,p.roomD],[x,p.height,p.roomD],'rgba(82,105,104,.16)',1);
}

function drawRealSkirting(ctx,p,color){
  const h = REAL_HOME_SPEC.skirting;
  draw3DPoly(ctx,p,[[0,0,p.roomD],[p.roomW,0,p.roomD],[p.roomW,h,p.roomD],[0,h,p.roomD]],color);
  draw3DPoly(ctx,p,[[0,0,0],[0,0,p.roomD],[0,h,p.roomD],[0,h,0]],shade(color,-12));
  draw3DPoly(ctx,p,[[p.roomW,0,p.roomD],[p.roomW,0,0],[p.roomW,h,0],[p.roomW,h,p.roomD]],shade(color,8));
}

function drawRealCeilingLight(ctx,p,scene){
  const lightOn = state.lightOn !== false;
  const center = p.project(p.roomW/2, p.height-90, p.roomD*.44);
  if(!center) return;
  ctx.save();
  if(lightOn){
    const glow = ctx.createRadialGradient(center.x,center.y,0,center.x,center.y,Math.min(p.w,p.h)*(scene.id==='bath'?.22:.32));
    glow.addColorStop(0,'rgba(255,222,156,.24)');
    glow.addColorStop(.62,'rgba(255,214,143,.08)');
    glow.addColorStop(1,'rgba(255,214,143,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,p.w,p.h*.64);
  }
  ctx.fillStyle = lightOn ? '#d9a441' : '#70797a';
  ctx.beginPath();
  ctx.ellipse(center.x,center.y,scene.id==='bath'?26:38,scene.id==='bath'?9:13,0,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = lightOn ? '#fff3cf' : '#8f9797';
  ctx.beginPath();
  ctx.ellipse(center.x,center.y+6,scene.id==='bath'?17:25,scene.id==='bath'?5:8,0,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawRealSunBeam(ctx,p,wall,win,opts={}){
  const alpha = state.lightOn !== false ? (opts.alpha || .34) : (opts.offAlpha || .2);
  const floorPts = wall === 'south'
    ? [
        [win.x+win.w*.1,4,p.roomD-60],
        [win.x+win.w*.92,4,p.roomD-60],
        [win.x+win.w*.76,4,Math.max(620,p.roomD-2500)],
        [win.x+win.w*.28,4,Math.max(620,p.roomD-2400)]
      ]
    : [
        [80,4,win.z+win.w*.08],
        [80,4,win.z+win.w*.92],
        [p.roomW*.58,4,win.z+win.w*.72],
        [p.roomW*.48,4,win.z+win.w*.22]
      ];
  ctx.save();
  const a = p.project(...floorPts[0]);
  const c = p.project(...floorPts[2]);
  const grad = ctx.createLinearGradient(a?.x || p.w*.5,a?.y || p.h*.7,c?.x || p.w*.4,c?.y || p.h*.84);
  grad.addColorStop(0,`rgba(255,236,180,${alpha})`);
  grad.addColorStop(.58,`rgba(255,222,145,${alpha*.46})`);
  grad.addColorStop(1,'rgba(255,222,145,0)');
  draw3DPoly(ctx,p,floorPts,grad);
  drawWindowLightShadows(ctx,p,wall,win,alpha*.42);
  ctx.restore();
}

function drawWindowLightShadows(ctx,p,wall,win,alpha){
  const color = `rgba(64,48,38,${alpha})`;
  if(wall === 'south'){
    const panes = win.floorToCeiling ? 4 : 2;
    for(let i=1;i<panes;i++){
      const x = win.x + win.w * i / panes;
      draw3DLine(ctx,p,[x,8,p.roomD-80],[lerp(x,p.roomW/2,.52),8,Math.max(620,p.roomD-2300)],color,2.2);
    }
    draw3DLine(ctx,p,[win.x+120,8,p.roomD-80],[win.x+win.w*.38,8,Math.max(620,p.roomD-2100)],`rgba(64,48,38,${alpha*.55})`,1.5);
    return;
  }
  draw3DLine(ctx,p,[70,8,win.z+win.w*.52],[p.roomW*.52,8,win.z+win.w*.34],color,2);
}

function drawRealLivingScene(ctx,p,scene){
  const room = scene.room;
  drawRealSunBeam(ctx,p,'south',scene.farWindow,{alpha:.4,offAlpha:.24});
  drawRealRug(ctx,p,760,1360,2300,1500,'#d8cbb8');
  const sofa = room.sofa;
  const sofaX = (room.w - sofa.w) / 2;
  const sofaZ = 80;
  const table = room.coffeeTable;
  const tableZ = sofaZ + sofa.d + table.gapFromSofa;
  const tableX = (room.w - table.w) / 2;
  const tv = room.tvCabinet;
  const tvX = (room.w - tv.w) / 2;
  const side = room.sideTable;
  const sideX = Math.max(120, sofaX - side.w - 100);
  const objects = [
    {z:room.d-350, draw:()=>drawRealTvCabinet(ctx,p,tvX,room.d-tv.d,tv.w,tv.d,tv.h,tv.bottom)},
    {z:tableZ, draw:()=>drawRealCoffeeTable(ctx,p,tableX,tableZ,table.w,table.d)},
    {z:sofaZ+180, draw:()=>drawRealSideTable(ctx,p,sideX,sofaZ+180,side.w,side.d,side.h)},
    {z:sofaZ, draw:()=>drawRealSofa(ctx,p,sofaX,sofaZ,sofa.w,sofa.d,sofa.h)}
  ];
  drawRealObjects(objects);
}

function drawRealEntryScene(ctx,p,scene){
  const room = scene.room;
  drawRealEntryDoorCanvas(ctx,p,room);
  drawRealRug(ctx,p,520,1280,1360,520,'#c7a06c');
  const cab = room.shoeCabinet;
  const cabX = (room.w - cab.w) / 2;
  const objects = [
    {z:1500, draw:()=>drawRealEntryMirror(ctx,p,80,900,70,560,1380)},
    {z:1180, draw:()=>drawRealEntryBench(ctx,p,260,1080,820,420,360)},
    {z:120, draw:()=>drawRealShoeCabinet(ctx,p,cabX,90,cab.w,cab.d,1850)}
  ];
  drawRealObjects(objects);
}

function drawRealEntryToLivingScene(ctx,p,scene){
  const room = scene.room;
  drawRealSunBeam(ctx,p,'south',scene.farWindow,{alpha:.42,offAlpha:.24});
  drawEntrySightlineCanvas(ctx,p,room);
  drawRealRug(ctx,p,720,1460,2260,1440,'#d8cbb8');
  const tv = room.tvCabinet;
  const table = room.coffeeTable;
  const sofa = room.sofa;
  const objects = [
    {z:room.d-350, draw:()=>drawRealTvCabinet(ctx,p,(room.w-tv.w)/2,room.d-tv.d,tv.w,tv.d,tv.h,tv.bottom)},
    {z:2240, draw:()=>drawRealCoffeeTable(ctx,p,(room.w-table.w)/2+130,2050,table.w,table.d)},
    {z:760, draw:()=>drawRealSofa(ctx,p,1060,260,Math.round(sofa.w*.72),sofa.d,sofa.h)},
    {z:650, draw:()=>drawRealEntryBench(ctx,p,520,680,760,360,320)},
    {z:480, draw:()=>drawRealEntryMirror(ctx,p,72,720,60,520,1260)},
    {z:250, draw:()=>drawRealShoeCabinet(ctx,p,85,360,340,980,1620)}
  ];
  drawRealObjects(objects);
}

function drawRealBalconySceneCanvas(ctx,p,scene){
  const room = scene.room;
  const win = scene.farWindow;
  drawBalconyCanvasPictureView(ctx,p,win);
  if(state.windowOpen === true) drawRealSunBeam(ctx,p,'south',win,{alpha:.46,offAlpha:.22});
  else drawClosedWindowSoftShade(ctx,p,win);
  drawBalconyCanvasFloorBand(ctx,p,room,win);
  const objects = [
    {z:room.d-720, draw:()=>drawBalconyCanvasGuard(ctx,p,win)},
    {z:room.d-980, draw:()=>drawBalconyCanvasUtilityCabinet(ctx,p,win.x+win.w*.56,room.d-1120,520,380,1320)},
    {z:room.d-1260, draw:()=>drawBalconyCanvasWasher(ctx,p,win.x+win.w*.2,room.d-1320,620,560,860)},
    {z:room.d-1420, draw:()=>drawBalconyCanvasDrainRisk(ctx,p,win.x+win.w*.34,room.d-1150)}
  ];
  drawRealObjects(objects);
}

function drawBalconyCanvasPictureView(ctx,p,win){
  const lightOn = state.lightOn !== false;
  const open = state.windowOpen === true;
  const z = p.roomD + (open ? 60 : 34);
  drawWindowOpening(ctx,p,'south',win);
  const skyTop = p.project(win.x+win.w*.5,win.y+win.h*.96,z);
  const skyBottom = p.project(win.x+win.w*.5,win.y+win.h*.08,z);
  if(skyTop && skyBottom){
    ctx.save();
    const glow = ctx.createRadialGradient(skyTop.x,skyTop.y,0,skyTop.x,skyTop.y,Math.min(p.w,p.h)*.46);
    glow.addColorStop(0,lightOn ? 'rgba(255,229,158,.34)' : 'rgba(170,197,229,.16)');
    glow.addColorStop(.62,lightOn ? 'rgba(149,209,240,.14)' : 'rgba(45,64,95,.12)');
    glow.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,p.w,p.h);
    ctx.restore();
  }
  drawBalconyCanvasHills(ctx,p,win,z);
  drawBalconyCanvasBuildings(ctx,p,win,z);
  if(lightOn) drawBalconyCanvasSun(ctx,p,win,z);
  else drawBalconyCanvasMoon(ctx,p,win,z);
  drawBalconyCanvasCloud(ctx,p,win,win.x+win.w*.3,win.y+win.h*.74,z+80,300,.68);
  drawBalconyCanvasCloud(ctx,p,win,win.x+win.w*.64,win.y+win.h*.83,z+94,230,.48);
  if(lightOn) drawBalconyCanvasBirds(ctx,p,win,z+110);
}

function drawBalconyCanvasHills(ctx,p,win,z){
  const lightOn = state.lightOn !== false;
  const bands = [
    {y:.34,h:260,color:lightOn?'rgba(122,166,115,.42)':'rgba(32,48,68,.42)'},
    {y:.25,h:210,color:lightOn?'rgba(84,138,85,.34)':'rgba(18,42,42,.42)'}
  ];
  bands.forEach((band,i)=>{
    const pts = [];
    const baseY = win.y + win.h*band.y;
    for(let n=0;n<=8;n++){
      const x = win.x + win.w*n/8;
      const y = baseY + Math.sin(n*.9+i)*band.h*.22;
      pts.push([x,y,z+90+i*35]);
    }
    pts.push([win.x+win.w,win.y,z+90+i*35],[win.x,win.y,z+90+i*35]);
    draw3DPoly(ctx,p,pts,band.color);
  });
}

function drawBalconyCanvasBuildings(ctx,p,win,z){
  const lightOn = state.lightOn !== false;
  [
    [win.x+win.w*.14,win.y+win.h*.18,win.w*.16,win.h*.34,z+190],
    [win.x+win.w*.44,win.y+win.h*.23,win.w*.14,win.h*.3,z+240],
    [win.x+win.w*.72,win.y+win.h*.16,win.w*.18,win.h*.38,z+285]
  ].forEach(([x,y,w,h,bz],i)=>{
    draw3DPoly(ctx,p,[[x,y,bz],[x+w,y,bz],[x+w,y+h,bz],[x,y+h,bz]],lightOn?'rgba(178,176,164,.16)':'rgba(25,36,48,.28)');
    for(let row=1;row<4;row++){
      for(let col=1;col<3;col++){
        const wx = x+w*col/3;
        const wy = y+h*row/5;
        draw3DLine(ctx,p,[wx,wy,bz+2],[wx+w*.08,wy,bz+2],lightOn?'rgba(83,103,106,.12)':'rgba(255,212,129,.28)',2);
      }
    }
  });
}

function drawBalconyCanvasSun(ctx,p,win,z){
  const c = p.project(win.x+win.w*.72,win.y+win.h*.82,z+140);
  if(!c) return;
  ctx.save();
  const pulse = (Math.sin(Date.now()/650)+1)/2;
  ctx.fillStyle = `rgba(255,225,154,${.24+pulse*.08})`;
  ctx.beginPath();
  ctx.arc(c.x,c.y,52,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#ffb12f';
  ctx.beginPath();
  ctx.arc(c.x,c.y,25,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,207,99,.72)';
  ctx.lineWidth = 3;
  for(let i=0;i<16;i++){
    const a = i*Math.PI*2/16 + pulse*.16;
    ctx.beginPath();
    ctx.moveTo(c.x+Math.cos(a)*32,c.y+Math.sin(a)*32);
    ctx.lineTo(c.x+Math.cos(a)*42,c.y+Math.sin(a)*42);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBalconyCanvasMoon(ctx,p,win,z){
  const c = p.project(win.x+win.w*.73,win.y+win.h*.82,z+140);
  if(!c) return;
  ctx.save();
  ctx.fillStyle = 'rgba(242,236,207,.9)';
  ctx.beginPath();
  ctx.arc(c.x,c.y,22,0,Math.PI*2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(c.x+10,c.y-2,22,0,Math.PI*2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(255,244,200,.72)';
  [[.18,.8],[.32,.68],[.52,.88],[.86,.72]].forEach(([tx,ty])=>{
    const s = p.project(win.x+win.w*tx,win.y+win.h*ty,z+130);
    if(s){ ctx.beginPath(); ctx.arc(s.x,s.y,2.2,0,Math.PI*2); ctx.fill(); }
  });
  ctx.restore();
}

function drawBalconyCanvasCloud(ctx,p,win,x,y,z,width,opacity){
  const c = p.project(x,y,z);
  if(!c) return;
  const scale = Math.max(.35, Math.min(1.2, c.scale * width / 420));
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${state.lightOn !== false ? opacity : opacity*.24})`;
  [[0,0,82,28],[-54,7,58,22],[50,9,64,23],[18,-8,52,21]].forEach(([dx,dy,rx,ry])=>{
    ctx.beginPath();
    ctx.ellipse(c.x+dx*scale,c.y+dy*scale,rx*scale,ry*scale,0,0,Math.PI*2);
    ctx.fill();
  });
  ctx.restore();
}

function drawBalconyCanvasBirds(ctx,p,win,z){
  ctx.save();
  ctx.strokeStyle = 'rgba(52,70,66,.52)';
  ctx.lineWidth = 2;
  [[.3,.66],[.42,.73],[.55,.64]].forEach(([tx,ty],i)=>{
    const c = p.project(win.x+win.w*tx+Math.sin(Date.now()/1400+i)*50,win.y+win.h*ty,z+i*18);
    if(!c) return;
    ctx.beginPath();
    ctx.moveTo(c.x-12,c.y);
    ctx.quadraticCurveTo(c.x-5,c.y-7,c.x,c.y);
    ctx.quadraticCurveTo(c.x+7,c.y-7,c.x+14,c.y);
    ctx.stroke();
  });
  ctx.restore();
}

function drawBalconyCanvasFloorBand(ctx,p,room,win){
  draw3DPoly(ctx,p,[[win.x-120,4,room.d-900],[win.x+win.w+120,4,room.d-900],[win.x+win.w+180,4,room.d-140],[win.x-180,4,room.d-140]],state.lightOn !== false ? '#cdbb9d' : '#4b423a','rgba(92,66,42,.2)');
  for(let x=win.x-80;x<win.x+win.w+120;x+=360){
    draw3DLine(ctx,p,[x,8,room.d-900],[x,8,room.d-140],state.lightOn !== false ? 'rgba(113,91,67,.2)' : 'rgba(255,255,255,.08)',1.2);
  }
}

function drawBalconyCanvasGuard(ctx,p,win){
  const color = state.lightOn !== false ? 'rgba(82,96,91,.46)' : 'rgba(184,199,205,.24)';
  const glass = state.lightOn !== false ? 'rgba(215,235,230,.16)' : 'rgba(80,102,113,.2)';
  const z = p.roomD - 620;
  draw3DPoly(ctx,p,[[win.x+win.w*.08,360,z],[win.x+win.w*.92,360,z],[win.x+win.w*.92,980,z],[win.x+win.w*.08,980,z]],glass,'rgba(255,255,255,.2)');
  draw3DLine(ctx,p,[win.x+win.w*.08,980,z+8],[win.x+win.w*.92,980,z+8],color,4);
  [.2,.38,.62,.8].forEach(t=>draw3DLine(ctx,p,[win.x+win.w*t,360,z+8],[win.x+win.w*t,980,z+8],color,2));
}

function drawBalconyCanvasWasher(ctx,p,x,z,w,d,h){
  drawRealBox(ctx,p,x,z,w,d,h,'#f2f2ed',{shadowAlpha:.16,stroke:'rgba(90,96,92,.22)'});
  drawRealBox(ctx,p,x+70,z+d+8,w-140,22,70,'#d9dcd6',{y:h-90,shadow:false});
  const c = p.project(x+w*.5,h*.48,z+d+12);
  if(c){
    ctx.save();
    ctx.fillStyle = '#a9c8cc';
    ctx.strokeStyle = 'rgba(86,98,98,.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(c.x,c.y,32,22,0,0,Math.PI*2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawBalconyCanvasUtilityCabinet(ctx,p,x,z,w,d,h){
  drawRealBox(ctx,p,x,z,w,d,h,'#d9c7a6',{shadowAlpha:.12,stroke:'rgba(107,82,55,.22)'});
  draw3DLine(ctx,p,[x+w*.5,120,z+d+8],[x+w*.5,h-80,z+d+8],'rgba(111,77,53,.38)',2);
  draw3DLine(ctx,p,[x+w*.72,520,z+d+10],[x+w*.72,920,z+d+10],'rgba(91,65,45,.46)',3);
}

function drawBalconyCanvasDrainRisk(ctx,p,x,z){
  const openIncident = incidentIsOpen();
  const c = p.project(x,16,z);
  if(!c) return;
  ctx.save();
  ctx.fillStyle = 'rgba(92,183,207,.32)';
  ctx.beginPath();
  ctx.ellipse(c.x,c.y,70,22,-.12,0,Math.PI*2);
  ctx.fill();
  if(openIncident){
    const pulse = (Math.sin(Date.now()/180)+1)/2;
    ctx.strokeStyle = `rgba(211,59,50,${.55+pulse*.32})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(c.x+42,c.y-18,14+pulse*7,0,Math.PI*2);
    ctx.stroke();
    ctx.fillStyle = '#d33b32';
    ctx.beginPath();
    ctx.arc(c.x+42,c.y-18,5,0,Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

function drawClosedWindowSoftShade(ctx,p,win){
  const topLeft = p.project(win.x,win.y+win.h,p.roomD-10);
  const bottomRight = p.project(win.x+win.w,win.y,p.roomD-10);
  if(!topLeft || !bottomRight) return;
  ctx.save();
  ctx.fillStyle = state.lightOn !== false ? 'rgba(201,217,214,.12)' : 'rgba(36,47,54,.18)';
  ctx.fillRect(Math.min(topLeft.x,bottomRight.x),Math.min(topLeft.y,bottomRight.y),Math.abs(bottomRight.x-topLeft.x),Math.abs(bottomRight.y-topLeft.y));
  ctx.restore();
}

function drawEntrySightlineCanvas(ctx,p,room){
  draw3DLine(ctx,p,[520,12,220],[room.w*.52,12,room.d-260],'rgba(217,164,65,.42)',4);
  draw3DLine(ctx,p,[700,10,360],[room.w*.74,10,room.d-520],'rgba(255,242,207,.26)',2);
  draw3DLine(ctx,p,[430,0,260],[430,2100,260],'rgba(185,137,81,.46)',4);
  draw3DLine(ctx,p,[430,2100,260],[430,2100,1520],'rgba(185,137,81,.32)',3);
  draw3DLine(ctx,p,[430,0,1520],[430,2100,1520],'rgba(185,137,81,.32)',3);
}

function drawRealStudyScene(ctx,p,scene){
  const room = scene.room;
  drawRealSunBeam(ctx,p,'south',scene.farWindow,{alpha:.2,offAlpha:.1});
  drawRealRug(ctx,p,600,1540,1600,1080,'#d8cfbd');
  const desk = room.desk;
  const deskX = (room.w - desk.w) / 2;
  const deskZ = room.d - desk.d - 170;
  const objects = [
    {z:room.d-930, draw:()=>drawRealLoungeChair(ctx,p,120,room.d-1120,800,800,640)},
    {z:1050, draw:()=>drawRealStudyBookcaseCanvas(ctx,p,room.w-room.bookcase.w,720,room.bookcase.w,room.bookcase.d,2200)},
    {z:deskZ, draw:()=>drawRealStudyDesk(ctx,p,deskX,deskZ,desk.w,desk.d,760)}
  ];
  drawRealObjects(objects);
}

function drawRealBedroomScene(ctx,p,scene){
  const room = scene.room;
  drawRealSunBeam(ctx,p,'south',scene.farWindow,{alpha:.32,offAlpha:.2});
  drawRealBayBench(ctx,p,(room.w-room.bayWindow.w)/2,room.d-room.bayWindow.d,room.bayWindow.w,room.bayWindow.d,room.bayWindow.sill);
  const bed = room.bed;
  const bedX = (room.w - bed.w) / 2;
  const bedZ = 110;
  const stand = room.nightstand;
  const standGap = 70;
  drawRealRug(ctx,p,720,1320,2160,2050,'#e5d7de');
  const objects = [
    {z:2860, draw:()=>drawRealVanity(ctx,p,0,2680,room.vanity.w,room.vanity.d,room.vanity.h)},
    {z:2200, draw:()=>drawRealWardrobe(ctx,p,room.w-560,1500,520,1500,2180)},
    {z:bedZ+140, draw:()=>drawRealNightstand(ctx,p,bedX-stand.w-standGap,bedZ+160,stand.w,stand.d,stand.h)},
    {z:bedZ+140, draw:()=>drawRealNightstand(ctx,p,bedX+bed.w+standGap,bedZ+160,stand.w,stand.d,stand.h)},
    {z:bedZ, draw:()=>drawRealBed(ctx,p,bedX,bedZ,bed.w,bed.d,bed.h)}
  ];
  drawRealObjects(objects);
}

function drawRealBathScene(ctx,p,scene){
  const room = scene.room;
  drawRealSunBeam(ctx,p,'west',scene.sideWindow,{alpha:.18,offAlpha:.12});
  const objects = [
    {z:room.d-1220, draw:()=>drawRealShower(ctx,p,80,room.d-room.shower.d,room.shower.w,room.shower.d,2100)},
    {z:1040, draw:()=>drawRealToilet(ctx,p,(room.w-room.toilet.w)/2,980,room.toilet.w,720,760)},
    {z:240, draw:()=>drawRealBathVanity(ctx,p,room.w-room.vanity.w-120,220,room.vanity.w,room.vanity.d,room.vanity.h)}
  ];
  drawRealObjects(objects);
}

function drawRealObjects(objects){
  objects.sort((a,b)=>b.z-a.z).forEach(item=>item.draw());
}

function drawRealRug(ctx,p,x,z,w,d,color){
  draw3DPoly(ctx,p,[[x,5,z],[x+w,5,z],[x+w,5,z+d],[x,5,z+d]],'rgba(45,31,24,.12)');
  const inset = 45;
  draw3DPoly(ctx,p,[[x+inset,7,z+inset],[x+w-inset,7,z+inset],[x+w-inset,7,z+d-inset],[x+inset,7,z+d-inset]],color);
}

function drawRealSofa(ctx,p,x,z,w,d,h){
  drawRealCushionBlock(ctx,p,x,z,w,d,360,'#71857e',{shadowAlpha:.24});
  drawRealCushionBlock(ctx,p,x,z,w,190,h,'#61756e',{shadow:false});
  drawRealCushionBlock(ctx,p,x,z,170,d,590,'#5f716b',{shadow:false});
  drawRealCushionBlock(ctx,p,x+w-170,z,170,d,590,'#5f716b',{shadow:false});
  const cushionW = (w - 320) / 3;
  for(let i=0;i<3;i++) drawRealCushionBlock(ctx,p,x+185+i*cushionW,z+270,cushionW-34,430,150,i===1?'#80928b':'#889a93',{y:340,shadow:false});
  drawSoftPillow(ctx,p,x+360,z+120,360,80,420,'#fff3cf');
  drawSoftPillow(ctx,p,x+840,z+120,330,80,420,'#b6c798');
  drawSoftPillow(ctx,p,x+1290,z+120,330,80,420,'#f0e1c8');
}

function drawRealCoffeeTable(ctx,p,x,z,w,d){
  drawRealBox(ctx,p,x+120,z+110,70,d-220,330,'#6f4e35',{shadow:false});
  drawRealBox(ctx,p,x+w-190,z+110,70,d-220,330,'#6f4e35',{shadow:false});
  drawRealTableSlab(ctx,p,x,z,w,d,70,'#d1a76a',{y:350,shadowAlpha:.17});
  drawRealBox(ctx,p,x+w*.42,z+d*.34,w*.18,d*.12,20,'#fffdfa',{y:428,shadow:false});
}

function drawRealSideTable(ctx,p,x,z,w,d,h){
  drawRealBox(ctx,p,x,z,w,d,h,'#b58b55',{shadowAlpha:.16});
  drawRealBox(ctx,p,x+w*.28,z+d*.28,w*.44,d*.44,80,'#fff3cf',{y:h,shadow:false});
}

function drawRealEntryDoorCanvas(ctx,p,room){
  const doorW = REAL_HOME_SPEC.door.entry.w;
  const x = (room.w - doorW) / 2;
  drawRealBox(ctx,p,x,0,doorW,80,REAL_HOME_SPEC.door.entry.h,'#7c5840',{shadow:false,stroke:'rgba(74,52,36,.32)'});
  draw3DLine(ctx,p,[x+doorW-150,980,84],[x+doorW-150,1070,84],'rgba(218,184,112,.82)',4);
}

function drawRealShoeCabinet(ctx,p,x,z,w,d,h){
  drawRealBox(ctx,p,x,z,w,d,h,'#b58b55',{shadowAlpha:.16});
  for(let i=1;i<3;i++){
    const px = x + w*i/3;
    draw3DLine(ctx,p,[px,180,z+d+4],[px,h-120,z+d+4],'rgba(86,58,38,.46)',1.8);
  }
  draw3DLine(ctx,p,[x+90,720,z+d+5],[x+w-90,720,z+d+5],'rgba(86,58,38,.42)',1.6);
}

function drawRealEntryBench(ctx,p,x,z,w,d,h){
  drawRealBox(ctx,p,x,z,w,d,h,'#c99d67',{shadowAlpha:.14});
  drawRealBox(ctx,p,x+80,z+70,65,d-140,320,'#6f4e35',{shadow:false});
  drawRealBox(ctx,p,x+w-145,z+70,65,d-140,320,'#6f4e35',{shadow:false});
}

function drawRealEntryMirror(ctx,p,x,z,w,d,h){
  drawRealBox(ctx,p,x,z,w,d,h,'#8a6a4d',{shadowAlpha:.08});
  drawRealBox(ctx,p,x+12,z+32,w*.45,d-64,h-120,'#cde0df',{y:40,shadow:false,stroke:'rgba(120,150,150,.26)'});
}

function drawRealStudyDesk(ctx,p,x,z,w,d,h){
  drawRealBox(ctx,p,x,z,w,d,70,'#c99d67',{y:h,shadowAlpha:.16});
  drawRealBox(ctx,p,x+80,z+70,55,d-140,h,'#6f4e35',{shadow:false});
  drawRealBox(ctx,p,x+w-135,z+70,55,d-140,h,'#6f4e35',{shadow:false});
  drawRealBox(ctx,p,x+w*.18,z+d*.34,w*.22,d*.12,45,'#fffdfa',{y:h+80,shadow:false});
  drawRealBox(ctx,p,x+w*.48,z+d*.32,w*.18,d*.12,36,'#8a6443',{y:h+120,shadow:false});
}

function drawRealStudyBookcaseCanvas(ctx,p,x,z,w,d,h){
  drawRealBox(ctx,p,x,z,w,d,h,'#b58b55',{shadowAlpha:.18});
  for(let i=1;i<5;i++){
    const y = i*h/5;
    draw3DLine(ctx,p,[x+10,y,z+d+5],[x+w-10,y,z+d+5],'rgba(90,61,40,.48)',1.8);
  }
  for(let row=0;row<4;row++){
    for(let i=0;i<7;i++){
      const bx = x + 40 + i*(w-100)/7;
      const by = 260 + row*h/5;
      const bh = 180 + ((i+row)%3)*42;
      drawRealBox(ctx,p,bx,z+d+8,32,42,bh,['#8a6443','#fff7df','#cfa067','#8fa7ae'][i%4],{y:by,shadow:false,stroke:'rgba(62,45,34,.2)'});
    }
  }
}

function drawRealLoungeChair(ctx,p,x,z,w,d,h){
  drawRealBox(ctx,p,x,z,w,d,h*.62,'#b49a80',{shadowAlpha:.15});
  drawRealBox(ctx,p,x+80,z+d*.12,w-160,120,h,'#9f876f',{shadow:false});
}

function drawRealTvCabinet(ctx,p,x,z,w,d,h,y){
  drawRealBox(ctx,p,x,z,w,d,h,'#d2a36a',{y,shadowAlpha:.1});
  draw3DLine(ctx,p,[x,y-35,z+d+8],[x+w,y-35,z+d+8],'rgba(40,31,24,.22)',5);
  draw3DLine(ctx,p,[x+90,y+h+14,z+d+10],[x+w-90,y+h+14,z+d+10],'rgba(255,253,250,.26)',2);
}

function drawRealBed(ctx,p,x,z,w,d,h){
  drawRealBox(ctx,p,x,z,w,d,310,'#8f735c',{shadowAlpha:.22});
  drawRealMattress(ctx,p,x+85,z+150,w-170,d-260,190,'#ead8ec',{y:300});
  drawRealCushionBlock(ctx,p,x+90,z,w-180,150,900,'#a77c62',{shadow:false});
  drawSoftPillow(ctx,p,x+250,z+230,430,260,160,'#fffdfa',{y:490});
  drawSoftPillow(ctx,p,x+w-680,z+230,430,260,160,'#fffdfa',{y:490});
  drawRealBlanket(ctx,p,x+360,z+760,w-720,720,110,'#cbb7cf',{y:510});
}

function drawRealNightstand(ctx,p,x,z,w,d,h){
  drawRealBox(ctx,p,x,z,w,d,h,'#d9a96d',{shadowAlpha:.14});
  drawRealBox(ctx,p,x+w*.28,z+d*.25,w*.44,d*.2,70,'#fff3cf',{y:h,shadow:false});
}

function drawRealWardrobe(ctx,p,x,z,w,d,h){
  drawRealBox(ctx,p,x,z,w,d,h,'#b997bd',{shadowAlpha:.18});
  draw3DLine(ctx,p,[x,20,z],[x,20,z+d],'rgba(74,55,74,.24)',4);
  draw3DLine(ctx,p,[x+w*.5,40,z],[x+w*.5,h-80,z],'rgba(255,253,250,.35)',2);
  draw3DLine(ctx,p,[x+w*.33,40,z],[x+w*.33,h-80,z],'rgba(255,253,250,.25)',1.5);
  draw3DLine(ctx,p,[x+w*.67,40,z],[x+w*.67,h-80,z],'rgba(255,253,250,.25)',1.5);
}

function drawRealVanity(ctx,p,x,z,w,d,h){
  drawRealBox(ctx,p,x,z,w,d,h,'#d9a96d',{shadowAlpha:.16});
  draw3DPoly(ctx,p,[[4,980,z+120],[4,980,z+760],[4,1660,z+760],[4,1660,z+120]],'#d8ece8','rgba(185,137,81,.6)');
}

function drawRealBayBench(ctx,p,x,z,w,d,h){
  drawRealBox(ctx,p,x,z,w,d,h,'#ead6c2',{shadowAlpha:.12});
}

function drawRealBathVanity(ctx,p,x,z,w,d,h){
  drawRealBox(ctx,p,x,z,w,d,h,'#edf2f0',{shadowAlpha:.16});
  drawRealTableSlab(ctx,p,x+50,z+d*.08,w-100,d*.82,55,'#f7fbfa',{y:h,shadow:false});
  drawRealBox(ctx,p,x+120,z+d*.28,w-240,d*.38,55,'#cde0df',{y:h+35,shadow:false,stroke:'rgba(112,138,138,.22)'});
  draw3DPoly(ctx,p,[[p.roomW-4,1030,z+80],[p.roomW-4,1030,z+d-80],[p.roomW-4,1780,z+d-80],[p.roomW-4,1780,z+80]],'#d8ece8','rgba(126,151,149,.5)');
  draw3DLine(ctx,p,[x+w*.45,h+120,z+d*.48],[x+w*.58,h+170,z+d*.48],'rgba(93,111,112,.55)',2);
}

function drawRealToilet(ctx,p,x,z,w,d,h){
  drawRealBox(ctx,p,x,z,w,180,620,'#f4f7f6',{shadowAlpha:.12});
  drawRealBox(ctx,p,x-w*.18,z+d*.22,w*1.36,d*.5,160,'#fffdfa',{y:360,shadowAlpha:.08});
  draw3DLine(ctx,p,[x-w*.06,530,z+d*.48],[x+w*1.06,530,z+d*.48],'rgba(93,111,112,.28)',3);
}

function drawRealShower(ctx,p,x,z,w,d,h){
  drawRealBox(ctx,p,x,z,w,d,60,'#d9e3e1',{shadowAlpha:.1});
  drawGlassPanel(ctx,p,[[x,0,z],[x+w,0,z],[x+w,h,z],[x,h,z]]);
  drawGlassPanel(ctx,p,[[x+w,0,z],[x+w,0,z+d],[x+w,h,z+d],[x+w,h,z]]);
  draw3DLine(ctx,p,[x+w*.04,h-80,z+20],[x+w*.96,h-80,z+20],'rgba(255,255,255,.45)',2);
  draw3DLine(ctx,p,[x+w-18,120,z+d*.12],[x+w-18,h-160,z+d*.12],'rgba(255,255,255,.28)',1.6);
  draw3DLine(ctx,p,[x+w*.24,1480,z+90],[x+w*.24,1880,z+90],'#5c6864',3);
  const head = p.project(x+w*.24,1880,z+90);
  if(head){
    ctx.save();
    ctx.fillStyle = '#5c6864';
    ctx.beginPath();
    ctx.arc(head.x,head.y,6,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

function drawGlassPanel(ctx,p,pts){
  draw3DPoly(ctx,p,pts,'rgba(188,214,215,.24)','rgba(93,111,112,.52)');
}

function drawRealCushionBlock(ctx,p,x,z,w,d,h,color,opts={}){
  drawRealBox(ctx,p,x,z,w,d,h,color,opts);
  const y = opts.y || 0;
  draw3DLine(ctx,p,[x+w*.08,y+h+6,z+d*.12],[x+w*.92,y+h+6,z+d*.12],`rgba(255,253,250,.22)`,2);
  draw3DLine(ctx,p,[x+w*.08,y+h+6,z+d*.88],[x+w*.92,y+h+6,z+d*.88],`rgba(38,31,28,.12)`,1.5);
}

function drawSoftPillow(ctx,p,x,z,w,d,h,color,opts={}){
  const y = opts.y || 0;
  drawRealBox(ctx,p,x,z,w,d,h,color,{y,shadow:false,stroke:'rgba(90,72,62,.14)'});
  draw3DLine(ctx,p,[x+w*.12,y+h+8,z+d*.18],[x+w*.88,y+h+8,z+d*.18],'rgba(255,255,255,.32)',2);
}

function drawRealTableSlab(ctx,p,x,z,w,d,h,color,opts={}){
  const y = opts.y || 0;
  if(opts.shadow !== false) draw3DPoly(ctx,p,[[x-45,3,z+35],[x+w+45,3,z+25],[x+w+70,3,z+d+60],[x-60,3,z+d+75]],`rgba(42,31,24,${opts.shadowAlpha ?? .15})`);
  draw3DPoly(ctx,p,[[x,y+h,z],[x+w,y+h,z],[x+w,y+h,z+d],[x,y+h,z+d]],shade(color,28),'rgba(94,67,41,.26)');
  draw3DPoly(ctx,p,[[x,y,z+d],[x+w,y,z+d],[x+w,y+h,z+d],[x,y+h,z+d]],shade(color,-10),'rgba(94,67,41,.22)');
  draw3DLine(ctx,p,[x+w*.08,y+h+8,z+d*.12],[x+w*.92,y+h+8,z+d*.12],'rgba(255,255,255,.28)',2);
}

function drawRealMattress(ctx,p,x,z,w,d,h,color,opts={}){
  const y = opts.y || 0;
  drawRealBox(ctx,p,x,z,w,d,h,color,{y,shadow:false,stroke:'rgba(122,92,122,.12)'});
  draw3DLine(ctx,p,[x+w*.06,y+h+8,z+d*.12],[x+w*.94,y+h+8,z+d*.12],'rgba(255,255,255,.35)',2);
  draw3DLine(ctx,p,[x+w*.06,y+h+7,z+d*.86],[x+w*.94,y+h+7,z+d*.86],'rgba(151,124,151,.18)',1.5);
}

function drawRealBlanket(ctx,p,x,z,w,d,h,color,opts={}){
  const y = opts.y || 0;
  drawRealBox(ctx,p,x,z,w,d,h,color,{y,shadow:false,stroke:'rgba(116,88,121,.14)'});
  for(let i=1;i<4;i++){
    const px = x + w * i / 4;
    draw3DLine(ctx,p,[px,y+h+7,z+d*.08],[px+w*.03,y+h+7,z+d*.92],'rgba(255,255,255,.18)',1.2);
  }
}

function drawRealBox(ctx,p,x,z,w,d,h,color,opts={}){
  const y = opts.y || 0;
  if(opts.shadow !== false){
    draw3DPoly(ctx,p,[[x-30,3,z+20],[x+w+25,3,z+5],[x+w+70,3,z+d+70],[x-55,3,z+d+85]],`rgba(42,31,24,${(opts.shadowAlpha ?? .14)*.55})`);
    draw3DPoly(ctx,p,[[x,4,z],[x+w,4,z],[x+w,4,z+d],[x,4,z+d]],`rgba(42,31,24,${opts.shadowAlpha ?? .14})`);
  }
  const v = {
    a:[x,y,z], b:[x+w,y,z], c:[x+w,y,z+d], d:[x,y,z+d],
    A:[x,y+h,z], B:[x+w,y+h,z], C:[x+w,y+h,z+d], D:[x,y+h,z+d]
  };
  const faces = [
    {pts:[v.d,v.c,v.C,v.D], color:shade(color,8)},
    {pts:[v.b,v.c,v.C,v.B], color:shade(color,-16)},
    {pts:[v.a,v.d,v.D,v.A], color:shade(color,-10)},
    {pts:[v.a,v.b,v.B,v.A], color:shade(color,-22)},
    {pts:[v.A,v.B,v.C,v.D], color:shade(color,22)}
  ];
  faces
    .map(face=>({...face, depth:face.pts.reduce((sum,pt)=>sum+p.depth(pt[0],pt[1],pt[2]),0)/face.pts.length}))
    .sort((a,b)=>b.depth-a.depth)
    .forEach(face=>draw3DPoly(ctx,p,face.pts,face.color,opts.stroke || 'rgba(55,42,34,.24)'));
}

function draw3DPoly(ctx,p,pts,fill,stroke){
  const projected = pts.map(([x,y,z])=>p.project(x,y,z));
  if(projected.some(pt=>!pt)) return;
  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath();
  projected.forEach((pt,i)=>i?ctx.lineTo(pt.x,pt.y):ctx.moveTo(pt.x,pt.y));
  ctx.closePath();
  ctx.fill();
  if(stroke){
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  ctx.restore();
}

function draw3DLine(ctx,p,a,b,color,width=1){
  const pa = p.project(a[0],a[1],a[2]);
  const pb = p.project(b[0],b[1],b[2]);
  if(!pa || !pb) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(pa.x,pa.y);
  ctx.lineTo(pb.x,pb.y);
  ctx.stroke();
  ctx.restore();
}

function drawLightStateOverlay(ctx,w,h){
  if(state.lightOn !== false) return;
  ctx.save();
  const dim = ctx.createLinearGradient(0,0,0,h);
  dim.addColorStop(0,'rgba(18,24,28,.14)');
  dim.addColorStop(.58,'rgba(18,24,28,.24)');
  dim.addColorStop(1,'rgba(18,24,28,.36)');
  ctx.fillStyle = dim;
  ctx.fillRect(0,0,w,h);
  ctx.fillStyle = 'rgba(120,146,156,.1)';
  ctx.fillRect(0,0,w,h*.42);
  ctx.restore();
}

function drawRoomShell(ctx,w,h,r,node){
  const lightOn = state.lightOn !== false;
  const wallTop = r.ceil;
  const wallBottom = r.backBottom;
  const leftBack = r.backTop;
  const rightBack = r.backRight;
  const wallGrad = ctx.createLinearGradient(0,0,0,wallBottom);
  wallGrad.addColorStop(0, lightOn ? '#fff9ef' : '#8a8176');
  wallGrad.addColorStop(.52, lightOn ? '#f7eadc' : '#746c63');
  wallGrad.addColorStop(1, lightOn ? '#e8d6c0' : '#5d544d');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0,0,w,wallBottom+8);

  const leftWall = ctx.createLinearGradient(0,0,leftBack,wallBottom);
  leftWall.addColorStop(0, lightOn ? '#f2e1cf' : '#675f57');
  leftWall.addColorStop(1, lightOn ? '#d8c1a6' : '#524941');
  drawPoly(ctx,[[0,0],[leftBack,wallTop],[leftBack,wallBottom],[0,h]],leftWall);

  const rightWall = ctx.createLinearGradient(rightBack,0,w,wallBottom);
  rightWall.addColorStop(0, lightOn ? '#fff3e5' : '#746b62');
  rightWall.addColorStop(1, lightOn ? '#dfc7ac' : '#574e45');
  drawPoly(ctx,[[rightBack,wallTop],[w,0],[w,h],[rightBack,wallBottom]],rightWall);

  const ceiling = ctx.createLinearGradient(0,0,0,wallTop+90);
  ceiling.addColorStop(0, lightOn ? '#fffaf2' : '#969089');
  ceiling.addColorStop(1, lightOn ? '#f5ecdf' : '#79736d');
  drawPoly(ctx,[[0,0],[w,0],[rightBack,wallTop],[leftBack,wallTop]],ceiling);

  const floor = ctx.createLinearGradient(0,wallBottom,0,h);
  floor.addColorStop(0, lightOn ? '#e1bb82' : '#75604e');
  floor.addColorStop(.55, lightOn ? '#bc834e' : '#584438');
  floor.addColorStop(1, lightOn ? '#845337' : '#302823');
  drawPoly(ctx,[[leftBack,wallBottom],[rightBack,wallBottom],[w,h],[0,h]],floor);

  ctx.save();
  ctx.strokeStyle = 'rgba(75,54,39,.45)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(leftBack,wallBottom);
  ctx.lineTo(rightBack,wallBottom);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(leftBack,wallTop);
  ctx.lineTo(rightBack,wallTop);
  ctx.stroke();
  ctx.restore();

  const tint = {
    'living-node':'rgba(159,184,200,.08)',
    'entry-node':'rgba(167,120,66,.09)',
    'study-node':'rgba(117,163,144,.09)',
    'bedroom-node':'rgba(185,151,189,.09)'
  }[node.id] || 'rgba(255,255,255,0)';
  ctx.fillStyle = tint;
  ctx.fillRect(0,0,w,h);
  if(!lightOn){
    ctx.fillStyle = 'rgba(15,25,28,.28)';
    ctx.fillRect(0,0,w,h);
  }
}

function drawRoomSunlight(ctx,w,h,r,node){
  if(state.lightOn === false) return;
  const windowNodes = ['living-node','study-node','bedroom-node','balcony-node','entry-node'];
  if(!windowNodes.includes(node.id)) return;
  if(state.windowOpen !== true){
    ctx.save();
    const muted = ctx.createLinearGradient(w*.45,h*.18,w*.66,h*.9);
    muted.addColorStop(0,'rgba(218,232,226,.12)');
    muted.addColorStop(1,'rgba(218,232,226,0)');
    ctx.fillStyle = muted;
    drawPoly(ctx,[[w*.44,h*.2],[w*.62,h*.18],[w*.7,h*.9],[w*.5,h*.92]],muted);
    ctx.restore();
    return;
  }
  ctx.save();
  const left = node.id === 'living-node' || node.id === 'balcony-node' ? w*.43 : w*.5;
  const top = node.id === 'balcony-node' ? h*.11 : h*.18;
  const width = node.id === 'balcony-node' ? w*.32 : w*.2;
  const beam = ctx.createLinearGradient(left,top,left+w*.18,h*.92);
  beam.addColorStop(0,'rgba(255,237,185,.42)');
  beam.addColorStop(.42,'rgba(255,225,158,.2)');
  beam.addColorStop(1,'rgba(255,225,158,0)');
  ctx.fillStyle = beam;
  drawPoly(ctx,[
    [left,top+width*.28],
    [left+width,top+width*.12],
    [w*.82,h*.92],
    [w*.38,h*.92]
  ],beam);
  ctx.fillStyle = 'rgba(255,234,171,.22)';
  ctx.beginPath();
  ctx.ellipse(w*.6,h*.82,w*.28,h*.07,-.12,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawPerspectiveLines(ctx,w,h,r){
  ctx.save();
  const originY = r.backBottom + 2;
  ctx.strokeStyle = 'rgba(255,247,223,.18)';
  ctx.lineWidth = 1.3;
  for(let i=0;i<13;i++){
    const x = w * (i/12);
    ctx.beginPath();
    ctx.moveTo(r.cx,originY);
    ctx.lineTo(x,h);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(70,47,32,.24)';
  for(let step=1; step<=8; step++){
    const t = step / 8;
    const y = originY + Math.pow(t, 1.85) * (h-originY);
    const inset = (y-originY) * .26;
    ctx.beginPath();
    ctx.moveTo(Math.max(0,w*.22-inset),y);
    ctx.lineTo(Math.min(w,w*.78+inset),y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCeilingLight(ctx,w,h,r){
  const x = r.cx;
  const y = h*.105;
  const lightOn = state.lightOn !== false;
  const glow = ctx.createRadialGradient(x,y,0,x,y,Math.min(w,h)*.38);
  glow.addColorStop(0, lightOn ? 'rgba(255,238,190,.28)' : 'rgba(160,184,194,.1)');
  glow.addColorStop(.5, lightOn ? 'rgba(255,232,178,.08)' : 'rgba(160,184,194,.03)');
  glow.addColorStop(1,'rgba(255,246,211,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0,0,w,h*.55);
  ctx.save();
  ctx.fillStyle = lightOn ? '#f7ddb0' : '#6f7779';
  ctx.strokeStyle = 'rgba(112,91,66,.24)';
  ctx.lineWidth = 3;
  roundRect(ctx,x-54,y-11,108,22,11,true,true);
  ctx.restore();
}

function drawWallPanel(ctx,w,h,r,node){
  if(node.id === 'living-node'){
    return;
  }
  if(node.id === 'entry-node'){
    drawDoorway(ctx,w*.59,h*.2,w*.2,h*.48,'客厅');
    drawNarrowWindow(ctx,w*.18,h*.17,w*.16,h*.32);
    return;
  }
  if(node.id === 'study-node'){
    drawWindow(ctx,w*.52,h*.14,w*.22,h*.17);
    drawDoorway(ctx,w*.12,h*.22,w*.13,h*.38,'回客');
    return;
  }
  if(node.id === 'bedroom-node'){
    return;
  }
  if(node.id === 'balcony-node'){
    drawWideWindow(ctx,w*.18,h*.08,w*.58,h*.36);
    drawDoorway(ctx,w*.08,h*.26,w*.12,h*.38,'客厅');
    return;
  }
  if(node.id === 'bath-node'){
    return;
  }
  drawDoorway(ctx,w*.16,h*.24,w*.13,h*.38,'回客');
  drawWallSafeLines(ctx,w,h,r);
}

function drawWindow(ctx,x,y,wid,hei){
  ctx.save();
  const open = state.windowOpen === true;
  const sky = ctx.createLinearGradient(0,y,0,y+hei);
  sky.addColorStop(0,open ? '#d8ebed' : '#bdc9c8');
  sky.addColorStop(1,open ? '#9fbfc1' : '#7f9395');
  ctx.fillStyle = sky;
  roundRect(ctx,x,y,wid,hei,6,true,false);
  ctx.strokeStyle = 'rgba(58,78,77,.42)';
  ctx.lineWidth = 5;
  roundRect(ctx,x,y,wid,hei,6,false,true);
  ctx.beginPath();
  ctx.moveTo(x+wid/2,y);
  ctx.lineTo(x+wid/2,y+hei);
  ctx.moveTo(x,y+hei*.52);
  ctx.lineTo(x+wid,y+hei*.52);
  ctx.stroke();
  ctx.fillStyle = open ? 'rgba(255,255,255,.36)' : 'rgba(255,255,255,.48)';
  ctx.fillRect(x+12,y+10,wid*.28,hei-20);
  if(!open){
    ctx.fillStyle = 'rgba(46,63,66,.18)';
    ctx.fillRect(x+wid*.54,y+8,wid*.36,hei-16);
  }
  drawCanvasCurtains(ctx,x,y,wid,hei);
  ctx.restore();
}

function drawNarrowWindow(ctx,x,y,wid,hei){
  drawWindow(ctx,x,y,wid,hei);
  ctx.save();
  ctx.fillStyle = 'rgba(31,42,39,.08)';
  roundRect(ctx,x+wid+10,y+hei*.08,10,hei*.84,5,true,false);
  ctx.restore();
}

function drawWideWindow(ctx,x,y,wid,hei){
  ctx.save();
  const open = state.windowOpen === true;
  const sky = ctx.createLinearGradient(0,y,0,y+hei);
  sky.addColorStop(0,open ? '#dfeff0' : '#c3cdcc');
  sky.addColorStop(1,open ? '#a8c8c8' : '#829596');
  ctx.fillStyle = sky;
  roundRect(ctx,x,y,wid,hei,8,true,false);
  ctx.strokeStyle = 'rgba(58,78,77,.42)';
  ctx.lineWidth = 6;
  roundRect(ctx,x,y,wid,hei,8,false,true);
  ctx.lineWidth = 4;
  for(let i=1;i<4;i++){
    ctx.beginPath();
    ctx.moveTo(x+wid*i/4,y);
    ctx.lineTo(x+wid*i/4,y+hei);
    ctx.stroke();
  }
  ctx.fillStyle = open ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.46)';
  ctx.fillRect(x+wid*.08,y+12,wid*.2,hei-24);
  if(!open){
    ctx.fillStyle = 'rgba(45,62,66,.18)';
    ctx.fillRect(x+wid*.42,y+12,wid*.46,hei-24);
  }
  drawCanvasCurtains(ctx,x,y,wid,hei);
  ctx.restore();
}

function drawCanvasCurtains(ctx,x,y,wid,hei){
  ctx.save();
  ctx.fillStyle = 'rgba(147,166,111,.72)';
  roundRect(ctx,x-wid*.08,y-6,wid*.11,hei+20,8,true,false);
  roundRect(ctx,x+wid*.97,y-6,wid*.11,hei+20,8,true,false);
  ctx.fillStyle = 'rgba(255,253,247,.42)';
  roundRect(ctx,x+wid*.2,y+4,wid*.6,hei-8,8,true,false);
  ctx.restore();
}

function drawGlassDoor(ctx,x,y,wid,hei,label){
  ctx.save();
  const glass = ctx.createLinearGradient(x,y,x+wid,y+hei);
  glass.addColorStop(0,'rgba(220,240,240,.86)');
  glass.addColorStop(1,'rgba(132,170,170,.7)');
  ctx.fillStyle = glass;
  roundRect(ctx,x,y,wid,hei,5,true,false);
  ctx.strokeStyle = 'rgba(58,78,77,.42)';
  ctx.lineWidth = 5;
  roundRect(ctx,x,y,wid,hei,5,false,true);
  ctx.beginPath();
  ctx.moveTo(x+wid*.5,y+6);
  ctx.lineTo(x+wid*.5,y+hei-6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,253,250,.88)';
  ctx.font = `700 ${Math.max(11, wid*.1)}px sans-serif`;
  ctx.fillText(label,x+12,y+hei+20);
  ctx.restore();
}

function drawTileWall(ctx,w,h){
  ctx.save();
  ctx.strokeStyle = 'rgba(93,111,112,.18)';
  ctx.lineWidth = 1;
  for(let y=h*.12;y<h*.68;y+=h*.055){
    ctx.beginPath();
    ctx.moveTo(w*.22,y);
    ctx.lineTo(w*.78,y+h*.012);
    ctx.stroke();
  }
  for(let x=w*.24;x<w*.78;x+=w*.07){
    ctx.beginPath();
    ctx.moveTo(x,h*.12);
    ctx.lineTo(x+w*.025,h*.68);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDoorway(ctx,x,y,wid,hei,label){
  ctx.save();
  ctx.fillStyle = '#5b4434';
  roundRect(ctx,x,y,wid,hei,3,true,false);
  const inner = ctx.createLinearGradient(x,y,x+wid,y+hei);
  inner.addColorStop(0,'#2f2823');
  inner.addColorStop(.62,'#6f5745');
  inner.addColorStop(1,'#a9855f');
  ctx.fillStyle = inner;
  roundRect(ctx,x+8,y+8,wid-16,hei-8,2,true,false);
  ctx.strokeStyle = '#d8c3aa';
  ctx.lineWidth = 5;
  roundRect(ctx,x,y,wid,hei,3,false,true);
  ctx.fillStyle = 'rgba(255,253,250,.86)';
  ctx.font = `700 ${Math.max(11, wid*.095)}px sans-serif`;
  ctx.fillText(label,x+12,y+hei+20);
  ctx.restore();
}

function drawWallSafeLines(ctx,w,h,r){
  ctx.save();
  ctx.strokeStyle = 'rgba(123,96,25,.22)';
  ctx.lineWidth = 2;
  for(let i=0;i<6;i++){
    const y = h*.18 + i*h*.065;
    ctx.beginPath();
    ctx.moveTo(w*.38,y);
    ctx.lineTo(w*.83,y+h*.02);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLivingScene(ctx,w,h,r){
  drawLivingCanvasSceneV2(ctx,w,h,r);
  return;
  drawWarmSunPatch(ctx,w,h);
  drawRug(ctx,w*.3,h*.76,w*.42,h*.16,'#d8cbb8');
  drawSofa(ctx,w*.08,h*.6,w*.34,h*.24);
  drawCoffeeTable(ctx,w*.42,h*.72,w*.18,h*.08);
  drawTvWall(ctx,w*.55,h*.32,w*.28,h*.28);
  drawCabinet(ctx,w*.58,h*.59,w*.28,h*.16,'#dca96c','客厅抽屉','living',{depth:.04});
  drawDiningCorner2D(ctx,w*.76,h*.58,w*.17,h*.18);
  drawPendant(ctx,w*.52,h*.06,w*.08,h*.16);
  drawPlant(ctx,w*.82,h*.48,w*.08,h*.22);
  drawPlant(ctx,w*.2,h*.49,w*.07,h*.18);
  drawLivingCanvasIdentity(ctx,w,h);
  return;
  drawRug(ctx,w*.32,h*.73,w*.36,h*.14,'#c1a45d');
  drawSofa(ctx,w*.18,h*.62,w*.28,h*.2);
  drawCoffeeTable(ctx,w*.44,h*.72,w*.16,h*.075);
  drawTvWall(ctx,w*.59,h*.38,w*.22,h*.24);
  drawPendant(ctx,w*.5,h*.07,w*.08,h*.16);
  drawPlant(ctx,w*.84,h*.58,w*.07,h*.18);
  drawBookshelf(ctx,w*.08,h*.29,w*.13,h*.25,'#8b6748');
  drawCabinet(ctx,w*.6,h*.58,w*.24,h*.16,'#9fb8c8','客厅抽屉','living',{depth:.07});
  drawCabinet(ctx,w*.08,h*.48,w*.14,h*.28,'#b58b55','玄关方向','entry',{depth:.05});
}

function drawEntryScene(ctx,w,h,r){
  drawPendant(ctx,w*.48,h*.08,w*.06,h*.13);
  drawMirror(ctx,w*.5,h*.22,w*.13,h*.25);
  drawCabinet(ctx,w*.13,h*.24,w*.34,h*.54,'#a77842','玄关','entry',{depth:.09,vertical:true});
  drawShoeBench(ctx,w*.49,h*.62,w*.28,h*.12);
  drawCabinet(ctx,w*.63,h*.48,w*.2,h*.2,'#9fb8c8','客厅抽屉方向','living',{depth:.05});
  drawFloorRunner(ctx,w*.34,h*.75,w*.42,h*.12);
}

function drawStudyScene(ctx,w,h,r){
  drawWarmSunPatch(ctx,w,h);
  drawPendant(ctx,w*.48,h*.07,w*.07,h*.14);
  drawBookshelf(ctx,w*.08,h*.2,w*.2,h*.48,'#d9a96d');
  drawBookshelf(ctx,w*.3,h*.2,w*.2,h*.48,'#9fb47e');
  drawCabinet(ctx,w*.08,h*.28,w*.42,h*.46,'#9fb47e','书房资料','study',{depth:.06,vertical:true});
  drawDesk(ctx,w*.46,h*.62,w*.34,h*.15);
  drawOfficeChair2D(ctx,w*.56,h*.66,w*.12,h*.18);
  drawBookStack(ctx,w*.58,h*.55,w*.22,h*.13);
  drawPlant(ctx,w*.78,h*.48,w*.08,h*.2);
  return;
  drawPendant(ctx,w*.48,h*.07,w*.07,h*.14);
  drawBookshelf(ctx,w*.12,h*.18,w*.18,h*.5,'#6b8f80');
  drawBookshelf(ctx,w*.31,h*.18,w*.2,h*.5,'#75a390');
  drawCabinet(ctx,w*.14,h*.22,w*.42,h*.56,'#75a390','书房资料','study',{depth:.1,vertical:true});
  drawDesk(ctx,w*.55,h*.62,w*.3,h*.14);
  drawBookStack(ctx,w*.22,h*.5,w*.24,h*.16);
}

function drawBedroomScene(ctx,w,h,r){
  drawBedroomCanvasSceneV2(ctx,w,h,r);
  return;
  drawWarmSunPatch(ctx,w,h);
  drawPendant(ctx,w*.48,h*.07,w*.07,h*.13);
  drawBed(ctx,w*.13,h*.5,w*.45,h*.31);
  drawWardrobe(ctx,w*.62,h*.24,w*.24,h*.5);
  drawBedside(ctx,w*.52,h*.62,w*.08,h*.12);
  drawVanity2D(ctx,w*.76,h*.55,w*.16,h*.18);
  drawPlant(ctx,w*.1,h*.48,w*.07,h*.18);
  drawBedroomCanvasIdentity(ctx,w,h);
  return;
  drawPendant(ctx,w*.48,h*.07,w*.07,h*.13);
  drawBed(ctx,w*.12,h*.53,w*.42,h*.27);
  drawCabinet(ctx,w*.6,h*.26,w*.24,h*.46,'#b997bd','卧室收纳','bedroom',{depth:.08,vertical:true});
  drawWardrobe(ctx,w*.61,h*.24,w*.24,h*.48);
  drawBedside(ctx,w*.5,h*.61,w*.08,h*.12);
}

function drawBalconyScene(ctx,w,h,r){
  drawPendant(ctx,w*.48,h*.07,w*.07,h*.12);
  drawWasher(ctx,w*.18,h*.52,w*.18,h*.22);
  drawWaterLeakCanvas(ctx,w*.2,h*.74,w*.22,h*.08);
  drawDryingRack(ctx,w*.42,h*.3,w*.36,h*.22);
  drawPlant(ctx,w*.78,h*.58,w*.1,h*.22);
  drawCabinet(ctx,w*.58,h*.5,w*.2,h*.2,'#75a390','保修归书','study',{depth:.05});
}

function drawWaterLeakCanvas(ctx,x,y,w,h){
  ctx.save();
  const pulse = (Math.sin(Date.now()/180)+1)/2;
  const grad = ctx.createRadialGradient(x+w*.44,y+h*.45,0,x+w*.44,y+h*.45,w*.68);
  grad.addColorStop(0,`rgba(92,183,207,${.5+pulse*.12})`);
  grad.addColorStop(.65,'rgba(92,183,207,.22)');
  grad.addColorStop(1,'rgba(92,183,207,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x+w*.42,y+h*.5,w*.62,h*(1.15+pulse*.12),-.12,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = `rgba(211,59,50,${.65+pulse*.25})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x+w*.82,y+h*.18,12+pulse*6,0,Math.PI*2);
  ctx.stroke();
  ctx.fillStyle = '#d33b32';
  ctx.beginPath();
  ctx.arc(x+w*.82,y+h*.18,5,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#a63b32';
  ctx.font = '900 13px system-ui';
  ctx.fillText('水浸风险',x+w*.92,y+h*.18+4);
  ctx.restore();
}

function drawBathScene(ctx,w,h,r){
  drawBathCanvasSceneV2(ctx,w,h,r);
  return;
  drawPendant(ctx,w*.5,h*.07,w*.06,h*.12);
  drawSink(ctx,w*.22,h*.5,w*.2,h*.2);
  drawToilet(ctx,w*.48,h*.52,w*.16,h*.22);
  drawShower(ctx,w*.67,h*.2,w*.18,h*.46);
  drawCabinet(ctx,w*.63,h*.5,w*.18,h*.18,'#9fb8c8','维修单归客厅','living',{depth:.04});
  drawBathCanvasIdentity(ctx,w,h);
}

function drawCabinet(ctx,x,y,w,h,color,label,zone,opts={}){
  const stat = zoneStats().find(s=>s.id===zone) || {riskCount:0,count:0};
  const depth = (opts.depth || .06) * Math.max(900, ctx.canvas.width || 900);
  const dx = Math.min(42, depth);
  const dy = Math.min(30, depth*.7);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.28)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 14;
  drawPoly(ctx,[[x+w,y+dy],[x+w+dx,y],[x+w+dx,y+h-dy],[x+w,y+h]],shade(color,-18));
  drawPoly(ctx,[[x,y],[x+dx,y-dy],[x+w+dx,y-dy],[x+w,y]],shade(color,18));
  ctx.fillStyle = color;
  roundRect(ctx,x,y,w,h,10,true,false);
  ctx.shadowColor = 'transparent';
  const front = ctx.createLinearGradient(x,y,x+w,y+h);
  front.addColorStop(0,shade(color,26));
  front.addColorStop(.5,color);
  front.addColorStop(1,shade(color,-20));
  ctx.fillStyle = front;
  roundRect(ctx,x,y,w,h,10,true,false);
  ctx.strokeStyle = 'rgba(31,42,39,.38)';
  ctx.lineWidth = 3;
  roundRect(ctx,x,y,w,h,10,false,true);
  ctx.fillStyle = 'rgba(255,255,255,.25)';
  roundRect(ctx,x+Math.max(10,w*.06),y+Math.max(10,h*.08),w*.36,h*.2,6,true,false);
  ctx.beginPath();
  const rows = opts.vertical ? [.24,.43,.62,.81] : [.45,.67];
  rows.forEach(row=>{
    ctx.moveTo(x+12,y+h*row);
    ctx.lineTo(x+w-12,y+h*row);
  });
  if(opts.vertical){
    ctx.moveTo(x+w*.5,y+12);
    ctx.lineTo(x+w*.5,y+h-14);
  }
  ctx.stroke();
  drawRiskLamp(ctx,x+w-24,y+24,stat.riskCount,zone==='entry' || stat.riskCount>=2);
  ctx.fillStyle = '#fffdfa';
  ctx.font = `bold ${Math.max(12,Math.min(15,w*.08))}px sans-serif`;
  ctx.fillText(label,x+14,y+h-24);
  ctx.font = `${Math.max(10,Math.min(12,w*.06))}px sans-serif`;
  ctx.fillText(`${stat.count} 份档案 · ${stat.riskCount} 风险`,x+14,y+h-8);
  ctx.restore();
}

function drawSofa(ctx,x,y,w,h){
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.22)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#6f7f78';
  roundRect(ctx,x,y,w,h,18,true,false);
  ctx.fillStyle = '#84958e';
  roundRect(ctx,x+w*.06,y-h*.12,w*.88,h*.32,16,true,false);
  ctx.fillStyle = '#e9dccb';
  roundRect(ctx,x+w*.08,y+h*.1,w*.23,h*.34,10,true,false);
  roundRect(ctx,x+w*.38,y+h*.1,w*.23,h*.34,10,true,false);
  roundRect(ctx,x+w*.68,y+h*.1,w*.2,h*.34,10,true,false);
  ctx.restore();
}

function drawLivingCanvasSceneV2(ctx,w,h,r){
  const spec = REAL_HOME_SPEC.rooms.living;
  const p = makeRoomProjection(w,h,r,spec.w,spec.d,{nearLeft:w*.035, nearRight:w*.965, nearY:h*.97, verticalFactor:.58});
  const sofa = spec.sofa;
  const sofaX = (spec.w - sofa.w) / 2;
  const sofaZ = 120;
  const table = spec.coffeeTable;
  const tableX = (spec.w - table.w) / 2;
  const tableZ = sofaZ + sofa.d + table.gapFromSofa;
  const tv = spec.tvCabinet;
  const tvX = (spec.w - tv.w) / 2;
  const side = spec.sideTable;
  const sideX = Math.max(120, sofaX - side.w - 100);

  drawProjectedBackWindow(ctx,p,(spec.w - spec.window.w)/2,spec.window.sill,spec.window.w,spec.window.h,{floorToCeiling:true});
  drawProjectedSunBeam(ctx,p,{x:(spec.w - spec.window.w)/2,w:spec.window.w,zNear:700,zFar:spec.d});
  drawProjectedCeilingGlow(ctx,w,h,r);
  drawProjectedRug(ctx,p,720,tableZ-160,2460,1650,'#d8cbb8');
  drawProjectedFloatingBackCabinet(ctx,p,tvX,tv.bottom,tv.w,tv.h,'#d2a36a');
  drawProjectedTvScreen(ctx,p,(spec.w-1460)/2,780,1460,820);
  drawProjectedCoffeeTable(ctx,p,tableX,tableZ,table.w,table.d);
  drawProjectedSideTable(ctx,p,sideX,sofaZ+180,side.w,side.d,side.h);
  drawProjectedSofa(ctx,p,sofaX,sofaZ,sofa.w,sofa.d,sofa.h);
}

function drawBedroomCanvasSceneV2(ctx,w,h,r){
  const spec = REAL_HOME_SPEC.rooms.masterBedroom;
  const p = makeRoomProjection(w,h,r,spec.w,spec.d,{nearLeft:w*.04, nearRight:w*.96, nearY:h*.97, verticalFactor:.57});
  const bed = spec.bed;
  const bedX = (spec.w - bed.w) / 2;
  const bedZ = 140;
  const stand = spec.nightstand;
  const standGap = 50;

  drawProjectedBackWindow(ctx,p,(spec.w - spec.bayWindow.w)/2,spec.bayWindow.sill,spec.bayWindow.w,1500,{bay:true});
  drawProjectedSunBeam(ctx,p,{x:(spec.w - spec.bayWindow.w)/2,w:spec.bayWindow.w,zNear:1150,zFar:spec.d});
  drawProjectedCeilingGlow(ctx,w,h,r);
  drawProjectedBayBench(ctx,p,(spec.w - spec.bayWindow.w)/2,spec.d-spec.bayWindow.d,spec.bayWindow.w,spec.bayWindow.d,spec.bayWindow.sill);
  drawProjectedRug(ctx,p,760,bedZ+1260,2080,1900,'#e5d7de');
  drawProjectedWardrobe(ctx,p,spec.w-spec.wardrobe.w,1160,spec.wardrobe.w,spec.wardrobe.d,spec.wardrobe.h);
  drawProjectedVanity(ctx,p,0,2680,spec.vanity.w,spec.vanity.d,spec.vanity.h);
  drawProjectedNightstand(ctx,p,bedX-stand.w-standGap,bedZ+140,stand.w,stand.d,stand.h);
  drawProjectedNightstand(ctx,p,bedX+bed.w+standGap,bedZ+140,stand.w,stand.d,stand.h);
  drawProjectedBed(ctx,p,bedX,bedZ,bed.w,bed.d,bed.h);
}

function drawBathCanvasSceneV2(ctx,w,h,r){
  const spec = REAL_HOME_SPEC.rooms.publicBath;
  const p = makeRoomProjection(w,h,r,spec.w,spec.d,{nearLeft:w*.06, nearRight:w*.94, nearY:h*.965, verticalFactor:.6});
  drawProjectedTileBackWall(ctx,p);
  drawProjectedBackWindow(ctx,p,(spec.w - spec.window.w)/2,900,spec.window.w,spec.window.h,{bath:true});
  drawProjectedCeilingGlow(ctx,w,h,r,{bath:true});
  drawProjectedShower(ctx,p,1150,1350,spec.shower.w,spec.shower.d,2100);
  drawProjectedToilet(ctx,p,(spec.w - spec.toilet.w)/2,1040,spec.toilet.w,720,760);
  drawProjectedBathVanity(ctx,p,130,160,spec.vanity.w,spec.vanity.d,spec.vanity.h);
}

function makeRoomProjection(w,h,r,roomW,roomD,opts={}){
  const nearLeft = opts.nearLeft ?? w*.05;
  const nearRight = opts.nearRight ?? w*.95;
  const nearY = opts.nearY ?? h*.965;
  const farLeft = r.backTop;
  const farRight = r.backRight;
  const farY = r.backBottom;
  const verticalFactor = opts.verticalFactor ?? .58;
  const yawOffset = ((r.cx || w/2) - w/2) * .08;
  const point = (xMm,zMm)=>{
    const t = clamp(zMm / roomD, 0, 1);
    const depth = Math.pow(1 - t, .74);
    const y = farY + depth * (nearY - farY);
    const left = lerp(farLeft, nearLeft, depth);
    const right = lerp(farRight, nearRight, depth);
    return {
      x: left + (xMm / roomW) * (right - left) + yawOffset * (1 - depth),
      y,
      depth,
      scale: (right - left) / roomW
    };
  };
  const wallScale = (farRight - farLeft) / roomW;
  const wallHeight = farY - r.ceil;
  return {
    roomW,
    roomD,
    r,
    floor: point,
    heightPx: (heightMm,zMm)=>heightMm * point(roomW/2,zMm).scale * verticalFactor,
    wallX: xMm=>farLeft + (xMm / roomW) * (farRight - farLeft) + yawOffset,
    wallY: yMm=>farY - (yMm / REAL_HOME_SPEC.netHeight) * wallHeight,
    wallScale,
    wallTop: r.ceil,
    wallBottom: farY
  };
}

function lerp(a,b,t){
  return a + (b-a) * t;
}

function projectedFloorRect(p,x,z,w,d){
  const a = p.floor(x,z);
  const b = p.floor(x+w,z);
  const c = p.floor(x+w,z+d);
  const dpt = p.floor(x,z+d);
  return {a,b,c,d:dpt};
}

function elevatedPoint(p,pt,heightMm,zMm){
  return [pt.x, pt.y - p.heightPx(heightMm,zMm)];
}

function drawProjectedShadow(ctx,p,x,z,w,d,alpha=.16){
  const rect = projectedFloorRect(p,x,z,w,d);
  ctx.save();
  drawPoly(ctx,[[rect.a.x,rect.a.y],[rect.b.x,rect.b.y],[rect.c.x,rect.c.y],[rect.d.x,rect.d.y]],`rgba(42,31,24,${alpha})`);
  ctx.restore();
}

function drawProjectedBox(ctx,p,x,z,w,d,h,color,opts={}){
  const rect = projectedFloorRect(p,x,z,w,d);
  const at = elevatedPoint(p,rect.a,h,z);
  const bt = elevatedPoint(p,rect.b,h,z);
  const ct = elevatedPoint(p,rect.c,h,z+d);
  const dt = elevatedPoint(p,rect.d,h,z+d);
  if(opts.shadow !== false) drawProjectedShadow(ctx,p,x,z,w,d,opts.shadowAlpha ?? .13);
  ctx.save();
  drawPoly(ctx,[[rect.d.x,rect.d.y],[rect.c.x,rect.c.y],ct,dt],shade(color,-18));
  drawPoly(ctx,[[rect.b.x,rect.b.y],[rect.c.x,rect.c.y],ct,bt],shade(color,-24));
  drawPoly(ctx,[[rect.a.x,rect.a.y],[rect.d.x,rect.d.y],dt,at],shade(color,-12));
  drawPoly(ctx,[[rect.a.x,rect.a.y],[rect.b.x,rect.b.y],bt,at],shade(color,-6));
  drawPoly(ctx,[at,bt,ct,dt],shade(color,22));
  ctx.strokeStyle = opts.stroke || 'rgba(55,42,34,.28)';
  ctx.lineWidth = Math.max(1.2, Math.min(3, p.floor(p.roomW/2,z).scale*18));
  ctx.beginPath();
  [at,bt,ct,dt].forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
  return {rect,top:{at,bt,ct,dt},height:h};
}

function drawProjectedRug(ctx,p,x,z,w,d,color){
  const rect = projectedFloorRect(p,x,z,w,d);
  ctx.save();
  drawPoly(ctx,[[rect.a.x,rect.a.y],[rect.b.x,rect.b.y],[rect.c.x,rect.c.y],[rect.d.x,rect.d.y]],'rgba(45,31,24,.12)');
  const insetX = w*.035;
  const insetZ = d*.035;
  const inner = projectedFloorRect(p,x+insetX,z+insetZ,w-insetX*2,d-insetZ*2);
  drawPoly(ctx,[[inner.a.x,inner.a.y],[inner.b.x,inner.b.y],[inner.c.x,inner.c.y],[inner.d.x,inner.d.y]],color);
  ctx.strokeStyle = 'rgba(255,253,250,.48)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  [inner.a,inner.b,inner.c,inner.d].forEach((pt,i)=>i?ctx.lineTo(pt.x,pt.y):ctx.moveTo(pt.x,pt.y));
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawProjectedBackWindow(ctx,p,x,y,w,h,opts={}){
  const x1 = p.wallX(x);
  const x2 = p.wallX(x+w);
  const yTop = p.wallY(y+h);
  const yBottom = p.wallY(y);
  ctx.save();
  const sky = ctx.createLinearGradient(0,yTop,0,yBottom);
  sky.addColorStop(0, opts.bath ? '#dcebed' : '#e3f2f2');
  sky.addColorStop(1, opts.bath ? '#a7bbbb' : '#a7c8c8');
  ctx.fillStyle = sky;
  roundRect(ctx,x1,yTop,x2-x1,yBottom-yTop,6,true,false);
  ctx.strokeStyle = opts.bath ? 'rgba(79,101,101,.54)' : 'rgba(58,78,77,.46)';
  ctx.lineWidth = opts.floorToCeiling ? 5 : 4;
  roundRect(ctx,x1,yTop,x2-x1,yBottom-yTop,6,false,true);
  const panes = opts.floorToCeiling ? 4 : 2;
  ctx.lineWidth = 2.5;
  for(let i=1;i<panes;i++){
    const px = lerp(x1,x2,i/panes);
    ctx.beginPath();
    ctx.moveTo(px,yTop+4);
    ctx.lineTo(px,yBottom-4);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x1+6,lerp(yTop,yBottom,.52));
  ctx.lineTo(x2-6,lerp(yTop,yBottom,.52));
  ctx.stroke();
  if(opts.bay){
    ctx.fillStyle = 'rgba(255,253,247,.34)';
    roundRect(ctx,x1+(x2-x1)*.08,yTop+8,(x2-x1)*.84,yBottom-yTop-16,5,true,false);
  }
  ctx.restore();
}

function drawProjectedSunBeam(ctx,p,opts){
  const daylight = state.lightOn !== false ? .24 : .18;
  const leftBack = p.floor(opts.x,p.roomD);
  const rightBack = p.floor(opts.x+opts.w,p.roomD);
  const leftNear = p.floor(opts.x + opts.w*.12,opts.zNear);
  const rightNear = p.floor(opts.x + opts.w*.88,opts.zNear);
  ctx.save();
  const beam = ctx.createLinearGradient((leftBack.x+rightBack.x)/2,leftBack.y,(leftNear.x+rightNear.x)/2,leftNear.y);
  beam.addColorStop(0,`rgba(255,235,176,${daylight})`);
  beam.addColorStop(.72,`rgba(255,222,146,${daylight*.42})`);
  beam.addColorStop(1,'rgba(255,222,146,0)');
  drawPoly(ctx,[[leftBack.x,leftBack.y],[rightBack.x,rightBack.y],[rightNear.x,rightNear.y],[leftNear.x,leftNear.y]],beam);
  ctx.fillStyle = `rgba(255,229,161,${daylight*.52})`;
  const patch = projectedFloorRect(p,opts.x+opts.w*.2,opts.zNear*.86,opts.w*.6,640);
  drawPoly(ctx,[[patch.a.x,patch.a.y],[patch.b.x,patch.b.y],[patch.c.x,patch.c.y],[patch.d.x,patch.d.y]],ctx.fillStyle);
  ctx.restore();
}

function drawProjectedCeilingGlow(ctx,w,h,r,opts={}){
  const lightOn = state.lightOn !== false;
  ctx.save();
  const cx = r.cx;
  const cy = h*.15;
  if(lightOn){
    const glow = ctx.createRadialGradient(cx,cy,0,cx,cy,Math.min(w,h)*(opts.bath ? .28 : .36));
    glow.addColorStop(0,'rgba(255,226,162,.22)');
    glow.addColorStop(.55,'rgba(255,214,143,.08)');
    glow.addColorStop(1,'rgba(255,214,143,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,w,h*.58);
  }
  ctx.strokeStyle = 'rgba(86,68,48,.32)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx,h*.065);
  ctx.lineTo(cx,cy);
  ctx.stroke();
  ctx.fillStyle = lightOn ? '#d9a441' : '#6f7779';
  ctx.beginPath();
  ctx.ellipse(cx,cy,opts.bath ? 28 : 38,opts.bath ? 11 : 14,0,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = lightOn ? '#fff3cf' : '#8d9494';
  ctx.beginPath();
  ctx.ellipse(cx,cy+7,opts.bath ? 19 : 26,opts.bath ? 7 : 9,0,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawProjectedSofa(ctx,p,x,z,w,d,h){
  drawProjectedBox(ctx,p,x,z,w,d,360,'#71857e',{shadowAlpha:.22});
  drawProjectedBox(ctx,p,x,z+d-210,w,210,h,'#61756e',{shadow:false});
  drawProjectedBox(ctx,p,x,z,160,d,600,'#5f716b',{shadow:false});
  drawProjectedBox(ctx,p,x+w-160,z,160,d,600,'#5f716b',{shadow:false});
  const cushionZ = z + 210;
  const cushionW = (w-280) / 3;
  for(let i=0;i<3;i++){
    drawProjectedBox(ctx,p,x+170+i*cushionW,cushionZ,cushionW-28,430,120,i===1?'#7f918a':'#879891',{shadow:false,stroke:'rgba(255,255,255,.18)'});
  }
  drawProjectedBox(ctx,p,x+360,z+420,360,90,500,'#fff3cf',{shadow:false});
  drawProjectedBox(ctx,p,x+820,z+430,330,90,480,'#b6c798',{shadow:false});
  drawProjectedBox(ctx,p,x+1280,z+420,330,90,480,'#f0e1c8',{shadow:false});
}

function drawProjectedCoffeeTable(ctx,p,x,z,w,d){
  drawProjectedBox(ctx,p,x+70,z+70,110,d-140,350,'#6f4e35',{shadow:false});
  drawProjectedBox(ctx,p,x+w-180,z+70,110,d-140,350,'#6f4e35',{shadow:false});
  drawProjectedBox(ctx,p,x,z,w,d,420,'#cda56d',{shadowAlpha:.18});
  const rect = projectedFloorRect(p,x+w*.42,z+d*.36,w*.16,d*.12);
  ctx.save();
  drawPoly(ctx,[[rect.a.x,rect.a.y-p.heightPx(432,z)],[rect.b.x,rect.b.y-p.heightPx(432,z)],[rect.c.x,rect.c.y-p.heightPx(432,z+d)],[rect.d.x,rect.d.y-p.heightPx(432,z+d)]],'rgba(255,253,250,.7)');
  ctx.restore();
}

function drawProjectedSideTable(ctx,p,x,z,w,d,h){
  drawProjectedBox(ctx,p,x,z,w,d,h,'#b58b55',{shadowAlpha:.16});
  drawProjectedBox(ctx,p,x+w*.28,z+d*.28,w*.44,d*.44,h+90,'#fff3cf',{shadow:false});
}

function drawProjectedFloatingBackCabinet(ctx,p,x,bottom,w,h,color){
  const x1 = p.wallX(x);
  const x2 = p.wallX(x+w);
  const y1 = p.wallY(bottom+h);
  const y2 = p.wallY(bottom);
  ctx.save();
  ctx.fillStyle = 'rgba(49,32,22,.18)';
  roundRect(ctx,x1+5,y2+7,x2-x1,10,5,true,false);
  const grad = ctx.createLinearGradient(x1,y1,x2,y2);
  grad.addColorStop(0,shade(color,18));
  grad.addColorStop(1,shade(color,-14));
  ctx.fillStyle = grad;
  roundRect(ctx,x1,y1,x2-x1,y2-y1,7,true,false);
  ctx.strokeStyle = 'rgba(74,55,34,.32)';
  ctx.lineWidth = 2;
  roundRect(ctx,x1,y1,x2-x1,y2-y1,7,false,true);
  [1/3,2/3].forEach(pos=>{
    const px = lerp(x1,x2,pos);
    ctx.beginPath();
    ctx.moveTo(px,y1+5);
    ctx.lineTo(px,y2-5);
    ctx.stroke();
  });
  ctx.restore();
}

function drawProjectedTvScreen(ctx,p,x,bottom,w,h){
  const x1 = p.wallX(x);
  const x2 = p.wallX(x+w);
  const y1 = p.wallY(bottom+h);
  const y2 = p.wallY(bottom);
  ctx.save();
  ctx.fillStyle = '#151b1a';
  roundRect(ctx,x1,y1,x2-x1,y2-y1,7,true,false);
  ctx.fillStyle = 'rgba(255,255,255,.1)';
  ctx.fillRect(x1+(x2-x1)*.09,y1+(y2-y1)*.12,(x2-x1)*.24,(y2-y1)*.58);
  ctx.strokeStyle = 'rgba(255,255,255,.12)';
  ctx.lineWidth = 2;
  roundRect(ctx,x1,y1,x2-x1,y2-y1,7,false,true);
  ctx.restore();
}

function drawProjectedBed(ctx,p,x,z,w,d,h){
  drawProjectedBox(ctx,p,x,z,w,d,300,'#8f735c',{shadowAlpha:.2});
  drawProjectedBox(ctx,p,x+90,z+140,w-180,d-230,430,'#ead8ec',{shadow:false,stroke:'rgba(255,255,255,.2)'});
  drawProjectedBox(ctx,p,x+150,z+d-230,w-300,230,h,'#a77c62',{shadow:false});
  drawProjectedBox(ctx,p,x+260,z+d-420,420,260,520,'#fffdfa',{shadow:false});
  drawProjectedBox(ctx,p,x+w-680,z+d-420,420,260,520,'#fffdfa',{shadow:false});
  drawProjectedBox(ctx,p,x+390,z+520,w-780,620,500,'#cbb7cf',{shadow:false,stroke:'rgba(255,255,255,.2)'});
}

function drawProjectedNightstand(ctx,p,x,z,w,d,h){
  drawProjectedBox(ctx,p,x,z,w,d,h,'#d9a96d',{shadowAlpha:.14});
  drawProjectedBox(ctx,p,x+w*.26,z+d*.2,w*.48,d*.18,h+90,'#fff3cf',{shadow:false});
}

function drawProjectedWardrobe(ctx,p,x,z,w,d,h){
  drawProjectedBox(ctx,p,x,z,w,d,h,'#b997bd',{shadowAlpha:.18});
  const frontA = p.floor(x,z);
  const frontB = p.floor(x+w,z);
  const topA = elevatedPoint(p,frontA,h,z);
  const topB = elevatedPoint(p,frontB,h,z);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,253,250,.4)';
  ctx.lineWidth = 2;
  [1/3,2/3].forEach(pos=>{
    const bx = lerp(frontA.x,frontB.x,pos);
    const tx = lerp(topA[0],topB[0],pos);
    ctx.beginPath();
    ctx.moveTo(tx,topA[1]+10);
    ctx.lineTo(bx,frontA.y-8);
    ctx.stroke();
  });
  ctx.restore();
}

function drawProjectedVanity(ctx,p,x,z,w,d,h){
  drawProjectedBox(ctx,p,x,z,w,d,h,'#d9a96d',{shadowAlpha:.16});
  const mirrorBottom = h + 120;
  const mirrorHeight = 720;
  const a = p.floor(x+w*.18,z+d*.08);
  const b = p.floor(x+w*.82,z+d*.08);
  const at = elevatedPoint(p,a,mirrorBottom+mirrorHeight,z);
  const bt = elevatedPoint(p,b,mirrorBottom+mirrorHeight,z);
  const ab = elevatedPoint(p,a,mirrorBottom,z);
  const bb = elevatedPoint(p,b,mirrorBottom,z);
  ctx.save();
  const glass = ctx.createLinearGradient(at[0],at[1],bb[0],bb[1]);
  glass.addColorStop(0,'#eaf5f2');
  glass.addColorStop(1,'#aac8c4');
  drawPoly(ctx,[at,bt,bb,ab],glass);
  ctx.strokeStyle = '#b98951';
  ctx.lineWidth = 3;
  ctx.beginPath();
  [at,bt,bb,ab].forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawProjectedBayBench(ctx,p,x,z,w,d,h){
  drawProjectedBox(ctx,p,x,z,w,d,h,'#ead6c2',{shadowAlpha:.12});
}

function drawProjectedTileBackWall(ctx,p){
  ctx.save();
  ctx.strokeStyle = 'rgba(93,111,112,.2)';
  ctx.lineWidth = 1;
  for(let i=1;i<7;i++){
    const x = p.wallX(p.roomW*i/7);
    ctx.beginPath();
    ctx.moveTo(x,p.wallTop+8);
    ctx.lineTo(x,p.wallBottom-4);
    ctx.stroke();
  }
  for(let i=1;i<6;i++){
    const y = lerp(p.wallTop,p.wallBottom,i/6);
    ctx.beginPath();
    ctx.moveTo(p.wallX(0)+2,y);
    ctx.lineTo(p.wallX(p.roomW)-2,y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawProjectedBathVanity(ctx,p,x,z,w,d,h){
  drawProjectedBox(ctx,p,x,z,w,d,h,'#edf2f0',{shadowAlpha:.14});
  drawProjectedBox(ctx,p,x+w*.22,z+d*.18,w*.56,d*.38,h+90,'#cde0df',{shadow:false});
}

function drawProjectedToilet(ctx,p,x,z,w,d,h){
  drawProjectedBox(ctx,p,x,z,w,d,380,'#f4f7f6',{shadowAlpha:.14});
  const rect = projectedFloorRect(p,x-w*.2,z+d*.22,w*1.4,d*.56);
  const seat = [
    [rect.a.x,rect.a.y-p.heightPx(h,z)],
    [rect.b.x,rect.b.y-p.heightPx(h,z)],
    [rect.c.x,rect.c.y-p.heightPx(h,z+d)],
    [rect.d.x,rect.d.y-p.heightPx(h,z+d)]
  ];
  ctx.save();
  drawPoly(ctx,seat,'#fffdfa');
  ctx.strokeStyle = 'rgba(93,111,112,.32)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  seat.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawProjectedShower(ctx,p,x,z,w,d,h){
  drawProjectedShadow(ctx,p,x,z,w,d,.1);
  const rect = projectedFloorRect(p,x,z,w,d);
  const at = elevatedPoint(p,rect.a,h,z);
  const bt = elevatedPoint(p,rect.b,h,z);
  const ct = elevatedPoint(p,rect.c,h,z+d);
  const dt = elevatedPoint(p,rect.d,h,z+d);
  ctx.save();
  drawPoly(ctx,[[rect.a.x,rect.a.y],[rect.b.x,rect.b.y],bt,at],'rgba(182,214,216,.24)');
  drawPoly(ctx,[[rect.b.x,rect.b.y],[rect.c.x,rect.c.y],ct,bt],'rgba(182,214,216,.32)');
  ctx.strokeStyle = 'rgba(93,111,112,.58)';
  ctx.lineWidth = 3;
  [[rect.a,rect.b,bt,at],[rect.b,rect.c,ct,bt]].forEach(face=>{
    ctx.beginPath();
    face.forEach((pt,i)=>{
      const px = Array.isArray(pt) ? pt[0] : pt.x;
      const py = Array.isArray(pt) ? pt[1] : pt.y;
      i?ctx.lineTo(px,py):ctx.moveTo(px,py);
    });
    ctx.closePath();
    ctx.stroke();
  });
  const head = elevatedPoint(p,p.floor(x+w*.24,z+d*.18),1550,z+d*.18);
  ctx.fillStyle = '#5c6864';
  ctx.beginPath();
  ctx.arc(head[0],head[1],6,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawSunlitWindowPatch2D(ctx,x,y,w,h){
  ctx.save();
  const glow = ctx.createRadialGradient(x+w*.5,y+h*.45,0,x+w*.5,y+h*.45,w*.9);
  glow.addColorStop(0,'rgba(255,246,210,.3)');
  glow.addColorStop(1,'rgba(255,246,210,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x-w*.4,y-h*.3,w*1.8,h*1.8);
  ctx.restore();
}

function drawGroundShadow2D(ctx,cx,cy,w,h){
  ctx.save();
  ctx.fillStyle = 'rgba(43,32,24,.18)';
  ctx.beginPath();
  ctx.ellipse(cx,cy,w*.5,h*.5,0,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawRugPerspective2D(ctx,x,y,w,h,color){
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  drawPoly(ctx,[
    [x+w*.12,y+h*.18],
    [x+w*.88,y+h*.12],
    [x+w,y+h*.78],
    [x,y+h*.86]
  ],'rgba(0,0,0,.12)');
  drawPoly(ctx,[
    [x+w*.14,y],
    [x+w*.86,y],
    [x+w*.98,y+h*.68],
    [x+w*.02,y+h*.72]
  ],color);
  ctx.strokeStyle = 'rgba(255,253,250,.42)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x+w*.2,y+h*.1);
  ctx.lineTo(x+w*.8,y+h*.1);
  ctx.lineTo(x+w*.9,y+h*.58);
  ctx.lineTo(x+w*.1,y+h*.62);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawLShapeSofaGrounded2D(ctx,x,floorY,w,h){
  const y = floorY - h;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.22)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 12;
  drawPoly(ctx,[[x+w*.08,y+h*.28],[x+w,y+h*.2],[x+w*.96,y+h*.72],[x+w*.04,y+h*.78]],'#667a73');
  drawPoly(ctx,[[x+w*.04,y+h*.55],[x+w*.42,y+h*.5],[x+w*.4,y+h],[x,y+h*.98]],'#5b6d67');
  ctx.fillStyle = '#7f918a';
  roundRect(ctx,x+w*.06,y+h*.06,w*.86,h*.24,14,true,false);
  ctx.fillStyle = '#71857e';
  roundRect(ctx,x+w*.06,y+h*.3,w*.86,h*.27,14,true,false);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#556760';
  roundRect(ctx,x+w*.02,y+h*.34,w*.07,h*.38,8,true,false);
  roundRect(ctx,x+w*.88,y+h*.28,w*.07,h*.36,8,true,false);
  [['#fff3cf',.1,.34],['#b6c798',.31,.32],['#f0e1c8',.53,.35]].forEach(([c,px,py])=>{
    ctx.fillStyle = c;
    roundRect(ctx,x+w*px,y+h*py,w*.14,h*.14,7,true,false);
  });
  ctx.restore();
}

function drawCoffeeTableGrounded2D(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = 'rgba(49,32,22,.18)';
  ctx.beginPath();
  ctx.ellipse(x+w*.5,y+h*.82,w*.56,h*.42,0,0,Math.PI*2);
  ctx.fill();
  drawPoly(ctx,[[x,y+h*.25],[x+w*.92,y],[x+w,y+h*.62],[x+w*.08,y+h*.88]],'#8d633f');
  ctx.fillStyle = '#e2b573';
  drawPoly(ctx,[[x+w*.04,y],[x+w*.94,y-h*.06],[x+w*.86,y+h*.32],[x+w*.12,y+h*.38]],'#e2b573');
  ctx.fillStyle = '#6f4e35';
  roundRect(ctx,x+w*.2,y+h*.44,w*.06,h*.5,3,true,false);
  roundRect(ctx,x+w*.72,y+h*.4,w*.06,h*.5,3,true,false);
  ctx.restore();
}

function drawTvWallGrounded2D(ctx,x,y,w,h,floorY){
  ctx.save();
  ctx.fillStyle = '#2e3432';
  roundRect(ctx,x,y,w,h*.52,8,true,false);
  ctx.fillStyle = '#101514';
  roundRect(ctx,x+w*.08,y+h*.08,w*.84,h*.34,5,true,false);
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.fillRect(x+w*.14,y+h*.12,w*.22,h*.25);
  ctx.fillStyle = '#303734';
  roundRect(ctx,x-w*.08,y+h*.12,w*.05,h*.34,3,true,false);
  roundRect(ctx,x+w*1.03,y+h*.12,w*.05,h*.34,3,true,false);
  ctx.restore();
}

function drawStorageCabinetSimple2D(ctx,x,y,w,h,color){
  ctx.save();
  ctx.fillStyle = color;
  roundRect(ctx,x,y,w,h,9,true,false);
  ctx.strokeStyle = 'rgba(74,55,34,.3)';
  ctx.lineWidth = 2;
  roundRect(ctx,x,y,w,h,9,false,true);
  ctx.beginPath();
  ctx.moveTo(x+w*.33,y+8);
  ctx.lineTo(x+w*.33,y+h-8);
  ctx.moveTo(x+w*.66,y+8);
  ctx.lineTo(x+w*.66,y+h-8);
  ctx.stroke();
  ctx.restore();
}

function drawFloorLampGrounded2D(ctx,x,floorY,w,h){
  drawFloorLamp2D(ctx,x,floorY-h,w,h);
}

function drawBedGrounded2D(ctx,x,floorY,w,h){
  const y = floorY - h;
  ctx.save();
  ctx.fillStyle = 'rgba(43,32,24,.17)';
  ctx.beginPath();
  ctx.ellipse(x+w*.52,floorY,w*.55,h*.13,0,0,Math.PI*2);
  ctx.fill();
  drawPoly(ctx,[[x+w*.08,y+h*.28],[x+w*.96,y+h*.2],[x+w,y+h*.92],[x+w*.04,y+h]],'#8f735c');
  drawPoly(ctx,[[x+w*.12,y+h*.25],[x+w*.88,y+h*.22],[x+w*.94,y+h*.82],[x+w*.08,y+h*.9]],'#ead8ec');
  ctx.fillStyle = '#fffdfa';
  roundRect(ctx,x+w*.16,y+h*.3,w*.22,h*.14,8,true,false);
  roundRect(ctx,x+w*.42,y+h*.29,w*.22,h*.14,8,true,false);
  ctx.fillStyle = '#cbb7cf';
  drawPoly(ctx,[[x+w*.24,y+h*.58],[x+w*.8,y+h*.55],[x+w*.84,y+h*.76],[x+w*.22,y+h*.8]],'#cbb7cf');
  ctx.restore();
}

function drawBedLampGrounded2D(ctx,x,floorY,w,h){
  drawBedLamp2D(ctx,x,floorY-h,w,h);
}

function drawWardrobeGrounded2D(ctx,x,floorY,w,h){
  drawWardrobe(ctx,x,floorY-h,w,h);
  drawWardrobeDetails2D(ctx,x,floorY-h,w,h);
}

function drawVanityGrounded2D(ctx,x,floorY,w,h){
  drawVanity2D(ctx,x,floorY-h,w,h);
  drawVanityDetails2D(ctx,x,floorY-h,w,h);
}

function drawBathVanityGrounded2D(ctx,x,floorY,w,h){
  drawSink(ctx,x,floorY-h,w,h);
  drawSinkDetails2D(ctx,x,floorY-h,w,h);
}

function drawToiletGrounded2D(ctx,x,floorY,w,h){
  drawToilet(ctx,x,floorY-h,w,h);
  drawToiletDetails2D(ctx,x,floorY-h,w,h);
}

function drawShowerGrounded2D(ctx,x,y,w,h){
  drawShower(ctx,x,y,w,h);
  drawShowerDetails2D(ctx,x,y,w,h);
}

function drawLivingCanvasIdentity(ctx,w,h){
  ctx.save();
  drawFeaturePanel2D(ctx,w*.545,h*.245,w*.33,h*.37,'#a9bd82');
  drawFloorLamp2D(ctx,w*.145,h*.42,w*.075,h*.31);
  drawLShapeSofa2D(ctx,w*.065,h*.555,w*.39,h*.29);
  drawMediaDetails2D(ctx,w*.56,h*.32,w*.31,h*.43);
  drawTableObjects2D(ctx,w*.43,h*.675,w*.18,h*.075);
  drawDiningSet2D(ctx,w*.755,h*.535,w*.2,h*.23);
  ctx.restore();
}

function drawBedroomCanvasIdentity(ctx,w,h){
  ctx.save();
  drawHeadboardPanel2D(ctx,w*.11,h*.36,w*.5,h*.22);
  drawBedLinens2D(ctx,w*.13,h*.5,w*.45,h*.31);
  drawBedLamp2D(ctx,w*.105,h*.61,w*.07,h*.16);
  drawBedLamp2D(ctx,w*.54,h*.61,w*.07,h*.16);
  drawWardrobeDetails2D(ctx,w*.62,h*.24,w*.24,h*.5);
  drawVanityDetails2D(ctx,w*.76,h*.55,w*.16,h*.18);
  drawSoftRug2D(ctx,w*.19,h*.79,w*.34,h*.08,'#e5d7de');
  ctx.restore();
}

function drawBathCanvasIdentity(ctx,w,h){
  ctx.save();
  drawBathTileBand2D(ctx,w*.58,h*.22,w*.32,h*.42);
  drawSinkDetails2D(ctx,w*.22,h*.5,w*.2,h*.2);
  drawToiletDetails2D(ctx,w*.48,h*.52,w*.16,h*.22);
  drawShowerDetails2D(ctx,w*.67,h*.2,w*.18,h*.46);
  drawTowelRail2D(ctx,w*.58,h*.38,w*.12,h*.18);
  ctx.restore();
}

function drawFeaturePanel2D(ctx,x,y,w,h,color){
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = .28;
  roundRect(ctx,x,y,w,h,10,true,false);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(63,76,58,.22)';
  ctx.lineWidth = 2;
  for(let i=1;i<4;i++){
    ctx.beginPath();
    ctx.moveTo(x+w*i/4,y+10);
    ctx.lineTo(x+w*i/4,y+h-10);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLShapeSofa2D(ctx,x,y,w,h){
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.2)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#667a73';
  roundRect(ctx,x,y,w,h*.62,18,true,false);
  roundRect(ctx,x,y+h*.42,w*.42,h*.5,18,true,false);
  ctx.fillStyle = '#7f918a';
  roundRect(ctx,x+w*.04,y-h*.12,w*.9,h*.28,16,true,false);
  ctx.shadowColor = 'transparent';
  const pillows = [
    [x+w*.09,y+h*.12,w*.17,h*.22,'#fff3cf'],
    [x+w*.31,y+h*.1,w*.15,h*.22,'#b6c798'],
    [x+w*.52,y+h*.12,w*.14,h*.2,'#f0e1c8']
  ];
  pillows.forEach(([px,py,pw,ph,c])=>{
    ctx.fillStyle = c;
    roundRect(ctx,px,py,pw,ph,9,true,false);
  });
  ctx.restore();
}

function drawMediaDetails2D(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = '#101514';
  roundRect(ctx,x+w*.1,y+h*.08,w*.78,h*.26,5,true,false);
  ctx.fillStyle = 'rgba(255,255,255,.14)';
  ctx.fillRect(x+w*.16,y+h*.12,w*.22,h*.18);
  ctx.fillStyle = '#e3b572';
  roundRect(ctx,x+w*.1,y+h*.55,w*.78,h*.16,8,true,false);
  ctx.strokeStyle = 'rgba(74,55,34,.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x+w*.36,y+h*.57);
  ctx.lineTo(x+w*.36,y+h*.69);
  ctx.moveTo(x+w*.62,y+h*.57);
  ctx.lineTo(x+w*.62,y+h*.69);
  ctx.stroke();
  ctx.fillStyle = '#303734';
  roundRect(ctx,x+w*.02,y+h*.14,w*.05,h*.38,3,true,false);
  roundRect(ctx,x+w*.93,y+h*.14,w*.05,h*.38,3,true,false);
  ctx.restore();
}

function drawTableObjects2D(ctx,x,y,w,h){
  ctx.save();
  const colors = ['#fffdfa','#e7f1ee','#fff3cf'];
  colors.forEach((c,i)=>{
    ctx.fillStyle = c;
    roundRect(ctx,x+i*w*.12,y+i*h*.16,w*(.48-i*.04),h*.25,4,true,false);
    ctx.strokeStyle = 'rgba(31,42,39,.16)';
    ctx.stroke();
  });
  ctx.fillStyle = '#9fb47e';
  ctx.beginPath();
  ctx.arc(x+w*.76,y+h*.38,Math.max(6,w*.055),0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawDiningSet2D(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  ctx.beginPath();
  ctx.ellipse(x+w*.5,y+h*.72,w*.55,h*.26,0,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#d9a96d';
  roundRect(ctx,x+w*.18,y+h*.2,w*.64,h*.24,12,true,false);
  ctx.fillStyle = '#9fb47e';
  [[.02,.5],[.74,.5],[.34,.02],[.34,.7]].forEach(([cx,cy])=>{
    roundRect(ctx,x+w*cx,y+h*cy,w*.24,h*.22,9,true,false);
  });
  ctx.fillStyle = '#fffdfa';
  roundRect(ctx,x+w*.36,y+h*.24,w*.12,h*.08,4,true,false);
  roundRect(ctx,x+w*.52,y+h*.24,w*.12,h*.08,4,true,false);
  ctx.restore();
}

function drawFloorLamp2D(ctx,x,y,w,h){
  ctx.save();
  ctx.strokeStyle = '#5c5144';
  ctx.lineWidth = Math.max(2,w*.05);
  ctx.beginPath();
  ctx.moveTo(x+w*.5,y+h*.22);
  ctx.lineTo(x+w*.5,y+h*.92);
  ctx.stroke();
  ctx.fillStyle = '#7b6a57';
  ctx.beginPath();
  ctx.ellipse(x+w*.5,y+h*.95,w*.34,h*.08,0,0,Math.PI*2);
  ctx.fill();
  const glow = ctx.createRadialGradient(x+w*.5,y+h*.2,0,x+w*.5,y+h*.2,w*.8);
  glow.addColorStop(0,'rgba(255,229,158,.36)');
  glow.addColorStop(1,'rgba(255,229,158,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x-w*.35,y-h*.25,w*1.7,h*.9);
  ctx.fillStyle = '#fff3cf';
  ctx.beginPath();
  ctx.moveTo(x+w*.22,y+h*.04);
  ctx.lineTo(x+w*.78,y+h*.04);
  ctx.lineTo(x+w*.68,y+h*.28);
  ctx.lineTo(x+w*.32,y+h*.28);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(112,91,66,.24)';
  ctx.stroke();
  ctx.restore();
}

function drawHeadboardPanel2D(ctx,x,y,w,h){
  ctx.save();
  const grad = ctx.createLinearGradient(x,y,x+w,y+h);
  grad.addColorStop(0,'rgba(178,142,108,.72)');
  grad.addColorStop(1,'rgba(235,218,199,.82)');
  ctx.fillStyle = grad;
  roundRect(ctx,x,y,w,h,12,true,false);
  ctx.strokeStyle = 'rgba(116,82,57,.22)';
  ctx.lineWidth = 2;
  for(let i=1;i<4;i++){
    ctx.beginPath();
    ctx.moveTo(x+w*i/4,y+8);
    ctx.lineTo(x+w*i/4,y+h-8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBedLinens2D(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = '#fffdfa';
  roundRect(ctx,x+w*.12,y+h*.1,w*.24,h*.2,8,true,false);
  roundRect(ctx,x+w*.39,y+h*.1,w*.24,h*.2,8,true,false);
  ctx.fillStyle = '#cbb7cf';
  roundRect(ctx,x+w*.2,y+h*.46,w*.58,h*.22,12,true,false);
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  roundRect(ctx,x+w*.24,y+h*.5,w*.5,h*.06,4,true,false);
  ctx.restore();
}

function drawBedLamp2D(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = '#e3b572';
  roundRect(ctx,x,y+h*.45,w,h*.35,7,true,false);
  ctx.strokeStyle = '#6a5847';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x+w*.5,y+h*.45);
  ctx.lineTo(x+w*.5,y+h*.24);
  ctx.stroke();
  ctx.fillStyle = '#fff3cf';
  ctx.beginPath();
  ctx.ellipse(x+w*.5,y+h*.18,w*.32,h*.16,0,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawWardrobeDetails2D(ctx,x,y,w,h){
  ctx.save();
  ctx.strokeStyle = 'rgba(255,253,250,.42)';
  ctx.lineWidth = 2;
  [1/3,2/3].forEach(pos=>{
    ctx.beginPath();
    ctx.moveTo(x+w*pos,y+12);
    ctx.lineTo(x+w*pos,y+h-12);
    ctx.stroke();
  });
  ctx.fillStyle = '#fff7df';
  roundRect(ctx,x+w*.43,y+h*.46,w*.035,h*.18,3,true,false);
  roundRect(ctx,x+w*.53,y+h*.46,w*.035,h*.18,3,true,false);
  ctx.restore();
}

function drawVanityDetails2D(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.36)';
  ctx.beginPath();
  ctx.ellipse(x+w*.42,y+h*.17,w*.09,h*.07,-.6,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#b6c798';
  roundRect(ctx,x+w*.16,y+h*.44,w*.16,h*.12,4,true,false);
  ctx.restore();
}

function drawSoftRug2D(ctx,x,y,w,h,color){
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x+w*.5,y+h*.5,w*.5,h*.45,0,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,253,250,.48)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawBathTileBand2D(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = 'rgba(200,216,211,.5)';
  roundRect(ctx,x,y,w,h,8,true,false);
  ctx.strokeStyle = 'rgba(126,151,149,.28)';
  ctx.lineWidth = 1.5;
  for(let i=1;i<5;i++){
    ctx.beginPath();
    ctx.moveTo(x+w*i/5,y);
    ctx.lineTo(x+w*i/5,y+h);
    ctx.stroke();
  }
  for(let i=1;i<4;i++){
    ctx.beginPath();
    ctx.moveTo(x,y+h*i/4);
    ctx.lineTo(x+w,y+h*i/4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSinkDetails2D(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = '#cde0df';
  ctx.beginPath();
  ctx.ellipse(x+w*.5,y+h*.2,w*.22,h*.1,0,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#778b8b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x+w*.5,y-h*.1);
  ctx.quadraticCurveTo(x+w*.66,y-h*.12,x+w*.64,y+h*.08);
  ctx.stroke();
  ctx.restore();
}

function drawToiletDetails2D(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = '#d8e4e2';
  ctx.beginPath();
  ctx.ellipse(x+w*.5,y+h*.58,w*.26,h*.18,0,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(93,111,112,.28)';
  ctx.stroke();
  ctx.restore();
}

function drawShowerDetails2D(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = 'rgba(188,214,215,.28)';
  roundRect(ctx,x,y,w,h,6,true,false);
  ctx.strokeStyle = '#5c6864';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x+w*.25,y+h*.2);
  ctx.lineTo(x+w*.25,y+h*.52);
  ctx.stroke();
  for(let i=0;i<4;i++){
    ctx.beginPath();
    ctx.arc(x+w*(.36+i*.1),y+h*.32+i*5,2,0,Math.PI*2);
    ctx.fillStyle = 'rgba(92,104,100,.46)';
    ctx.fill();
  }
  ctx.restore();
}

function drawTowelRail2D(ctx,x,y,w,h){
  ctx.save();
  ctx.strokeStyle = '#7d8784';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x,y);
  ctx.lineTo(x+w,y);
  ctx.stroke();
  ctx.fillStyle = '#e3b1aa';
  roundRect(ctx,x+w*.18,y+h*.08,w*.56,h*.75,5,true,false);
  ctx.restore();
}

function drawWarmSunPatch(ctx,w,h){
  ctx.save();
  const g = ctx.createRadialGradient(w*.18,h*.18,0,w*.18,h*.18,Math.min(w,h)*.62);
  g.addColorStop(0,'rgba(255,238,193,.42)');
  g.addColorStop(.55,'rgba(255,238,193,.16)');
  g.addColorStop(1,'rgba(255,238,193,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,w,h);
  ctx.restore();
}

function drawDiningCorner2D(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = '#d9a96d';
  roundRect(ctx,x+w*.14,y+h*.2,w*.72,h*.28,12,true,false);
  ctx.fillStyle = '#9fb47e';
  roundRect(ctx,x,y+h*.48,w*.28,h*.38,10,true,false);
  roundRect(ctx,x+w*.72,y+h*.48,w*.28,h*.38,10,true,false);
  ctx.fillStyle = '#f7efe2';
  roundRect(ctx,x+w*.28,y+h*.13,w*.18,h*.08,5,true,false);
  roundRect(ctx,x+w*.54,y+h*.13,w*.18,h*.08,5,true,false);
  ctx.restore();
}

function drawOfficeChair2D(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = '#9fb47e';
  roundRect(ctx,x+w*.2,y,w*.6,h*.55,12,true,false);
  ctx.fillStyle = '#59635d';
  roundRect(ctx,x+w*.36,y+h*.5,w*.28,h*.4,8,true,false);
  ctx.strokeStyle = '#59635d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x+w*.5,y+h*.8);
  ctx.lineTo(x+w*.25,y+h);
  ctx.moveTo(x+w*.5,y+h*.8);
  ctx.lineTo(x+w*.75,y+h);
  ctx.stroke();
  ctx.restore();
}

function drawVanity2D(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = '#d9a96d';
  roundRect(ctx,x,y+h*.36,w,h*.32,10,true,false);
  ctx.strokeStyle = '#b98951';
  ctx.lineWidth = 3;
  ctx.stroke();
  const mirror = ctx.createLinearGradient(x+w*.24,y,x+w*.76,y+h*.42);
  mirror.addColorStop(0,'#eaf5f2');
  mirror.addColorStop(1,'#aac8c4');
  ctx.fillStyle = mirror;
  ctx.beginPath();
  ctx.ellipse(x+w*.5,y+h*.18,w*.22,h*.18,0,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#b98951';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#f7efe2';
  roundRect(ctx,x+w*.28,y+h*.72,w*.44,h*.28,8,true,false);
  ctx.restore();
}

function drawPendant(ctx,x,y,w,h){
  ctx.save();
  ctx.strokeStyle = 'rgba(86,68,48,.38)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x+w*.5,y-h*.28);
  ctx.lineTo(x+w*.5,y+h*.15);
  ctx.stroke();
  const glow = ctx.createRadialGradient(x+w*.5,y+h*.5,0,x+w*.5,y+h*.5,w*1.2);
  glow.addColorStop(0,'rgba(255,242,184,.32)');
  glow.addColorStop(1,'rgba(255,242,184,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x+w*.5,y+h*.58,w*1.2,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.ellipse(x+w*.5,y+h*.38,w*.48,h*.24,0,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#fff7df';
  ctx.beginPath();
  ctx.ellipse(x+w*.5,y+h*.44,w*.34,h*.14,0,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawBookshelf(ctx,x,y,w,h,color){
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.18)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 9;
  ctx.fillStyle = color;
  roundRect(ctx,x,y,w,h,8,true,false);
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(31,42,39,.32)';
  ctx.lineWidth = 3;
  roundRect(ctx,x,y,w,h,8,false,true);
  const rows = 4;
  for(let i=1;i<rows;i++){
    ctx.beginPath();
    ctx.moveTo(x+8,y+h*i/rows);
    ctx.lineTo(x+w-8,y+h*i/rows);
    ctx.stroke();
  }
  const colors = ['#fffdfa','#d9a441','#e7f1ee','#f2eef7','#c9d7e0','#fff3cf'];
  for(let r=0;r<rows;r++){
    for(let i=0;i<5;i++){
      const bw = w*.08 + (i%2)*w*.025;
      const bx = x+w*.08+i*w*.16;
      const by = y+h*r/rows+h*.07;
      ctx.fillStyle = colors[(r+i)%colors.length];
      roundRect(ctx,bx,by,bw,h*.13,2,true,false);
    }
  }
  ctx.restore();
}

function drawPlant(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = '#7d6044';
  roundRect(ctx,x+w*.25,y+h*.58,w*.5,h*.38,8,true,false);
  ctx.fillStyle = '#2f8075';
  for(let i=0;i<7;i++){
    const angle = -Math.PI/2 + (i-3)*.28;
    ctx.beginPath();
    ctx.ellipse(x+w*.5+Math.cos(angle)*w*.22,y+h*.42+Math.sin(angle)*h*.16,w*.13,h*.32,angle,0,Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMirror(ctx,x,y,w,h){
  ctx.save();
  const g = ctx.createLinearGradient(x,y,x+w,y+h);
  g.addColorStop(0,'#e7f1ee');
  g.addColorStop(1,'#9fbfc1');
  ctx.fillStyle = g;
  roundRect(ctx,x,y,w,h,999,true,false);
  ctx.strokeStyle = '#b58b55';
  ctx.lineWidth = 5;
  roundRect(ctx,x,y,w,h,999,false,true);
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.fillRect(x+w*.22,y+h*.14,w*.22,h*.68);
  ctx.restore();
}

function drawWardrobe(ctx,x,y,w,h){
  ctx.save();
  const grad = ctx.createLinearGradient(x,y,x+w,y+h);
  grad.addColorStop(0,'#e4d2e6');
  grad.addColorStop(1,'#9d7aa4');
  ctx.fillStyle = grad;
  roundRect(ctx,x,y,w,h,10,true,false);
  ctx.strokeStyle = 'rgba(31,42,39,.3)';
  ctx.lineWidth = 3;
  roundRect(ctx,x,y,w,h,10,false,true);
  ctx.beginPath();
  ctx.moveTo(x+w*.5,y+12);
  ctx.lineTo(x+w*.5,y+h-12);
  ctx.moveTo(x+w*.44,y+h*.48);
  ctx.lineTo(x+w*.47,y+h*.48);
  ctx.moveTo(x+w*.53,y+h*.48);
  ctx.lineTo(x+w*.56,y+h*.48);
  ctx.stroke();
  ctx.restore();
}

function drawCoffeeTable(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = 'rgba(49,32,22,.2)';
  ctx.beginPath();
  ctx.ellipse(x+w*.5,y+h*.72,w*.58,h*.58,0,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#8a6443';
  roundRect(ctx,x,y,w,h,12,true,false);
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  roundRect(ctx,x+w*.12,y+h*.12,w*.76,h*.18,8,true,false);
  ctx.restore();
}

function drawWasher(ctx,x,y,w,h){
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.22)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#edf0ed';
  roundRect(ctx,x,y,w,h,10,true,false);
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(31,42,39,.28)';
  ctx.lineWidth = 3;
  roundRect(ctx,x,y,w,h,10,false,true);
  ctx.fillStyle = '#2f4d52';
  ctx.beginPath();
  ctx.arc(x+w*.5,y+h*.52,Math.min(w,h)*.28,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#9fbfc1';
  ctx.beginPath();
  ctx.arc(x+w*.5,y+h*.52,Math.min(w,h)*.19,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#fffdfa';
  roundRect(ctx,x+w*.12,y+h*.1,w*.25,h*.08,4,true,false);
  ctx.restore();
}

function drawDryingRack(ctx,x,y,w,h){
  ctx.save();
  ctx.strokeStyle = 'rgba(31,42,39,.42)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x,y);
  ctx.lineTo(x+w,y);
  ctx.moveTo(x+w*.12,y);
  ctx.lineTo(x+w*.12,y+h*.9);
  ctx.moveTo(x+w*.88,y);
  ctx.lineTo(x+w*.88,y+h*.9);
  ctx.stroke();
  const fabrics = ['#fffdfa','#e7f1ee','#fff3cf'];
  fabrics.forEach((c,i)=>{
    ctx.fillStyle = c;
    roundRect(ctx,x+w*(.2+i*.18),y+h*.1,w*.12,h*.55,4,true,false);
  });
  ctx.restore();
}

function drawSink(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = '#f4f7f6';
  roundRect(ctx,x,y,w,h*.52,12,true,false);
  ctx.strokeStyle = 'rgba(93,111,112,.35)';
  ctx.lineWidth = 3;
  roundRect(ctx,x,y,w,h*.52,12,false,true);
  ctx.fillStyle = '#9fbfc1';
  ctx.beginPath();
  ctx.ellipse(x+w*.5,y+h*.22,w*.28,h*.13,0,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#778b8b';
  ctx.beginPath();
  ctx.moveTo(x+w*.5,y-h*.08);
  ctx.quadraticCurveTo(x+w*.62,y-h*.1,x+w*.62,y+h*.08);
  ctx.stroke();
  ctx.fillStyle = '#8a8f8f';
  roundRect(ctx,x+w*.2,y+h*.52,w*.6,h*.42,6,true,false);
  ctx.restore();
}

function drawToilet(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = '#f4f7f6';
  roundRect(ctx,x+w*.12,y,w*.76,h*.34,8,true,false);
  ctx.fillStyle = '#fffdfa';
  ctx.beginPath();
  ctx.ellipse(x+w*.5,y+h*.58,w*.42,h*.32,0,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(93,111,112,.35)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawShower(ctx,x,y,w,h){
  ctx.save();
  ctx.strokeStyle = 'rgba(93,111,112,.55)';
  ctx.lineWidth = 4;
  roundRect(ctx,x,y,w,h,6,false,true);
  ctx.strokeStyle = 'rgba(93,111,112,.28)';
  ctx.lineWidth = 2;
  for(let i=1;i<4;i++){
    ctx.beginPath();
    ctx.moveTo(x+w*i/4,y+8);
    ctx.lineTo(x+w*i/4,y+h-8);
    ctx.stroke();
  }
  ctx.strokeStyle = '#5c6864';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x+w*.22,y+h*.2);
  ctx.lineTo(x+w*.22,y+h*.52);
  ctx.stroke();
  ctx.fillStyle = '#5c6864';
  ctx.beginPath();
  ctx.arc(x+w*.22,y+h*.18,8,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawRug(ctx,x,y,w,h,color){
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.16)';
  ctx.beginPath();
  ctx.ellipse(x+w*.5,y+h*.55,w*.55,h*.5,0,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x+w*.5,y+h*.48,w*.5,h*.42,0,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,253,250,.42)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawTvWall(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = '#2e3432';
  roundRect(ctx,x,y,w,h*.56,8,true,false);
  ctx.fillStyle = '#121716';
  roundRect(ctx,x+w*.08,y+h*.09,w*.84,h*.38,5,true,false);
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.fillRect(x+w*.14,y+h*.13,w*.22,h*.3);
  ctx.fillStyle = '#9f856b';
  roundRect(ctx,x+w*.12,y+h*.68,w*.76,h*.18,8,true,false);
  ctx.restore();
}

function drawDesk(ctx,x,y,w,h){
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.22)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 10;
  drawPoly(ctx,[[x,y],[x+w*.96,y-h*.05],[x+w,y+h],[x+w*.05,y+h*.12]],'#7c5f3c');
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#a77b4f';
  roundRect(ctx,x,y,w,h,8,true,false);
  ctx.fillStyle = '#fffdfa';
  roundRect(ctx,x+w*.12,y-38,w*.42,32,5,true,false);
  ctx.fillStyle = '#25312e';
  roundRect(ctx,x+w*.6,y-54,w*.22,46,5,true,false);
  ctx.fillStyle = '#d8c29c';
  roundRect(ctx,x+w*.1,y+h,w*.06,h*.75,3,true,false);
  roundRect(ctx,x+w*.82,y+h,w*.06,h*.75,3,true,false);
  ctx.restore();
}

function drawBookStack(ctx,x,y,w,h){
  ctx.save();
  const colors = ['#fffdfa','#e7f1ee','#fff3cf','#f2eef7'];
  colors.forEach((c,i)=>{
    ctx.fillStyle = c;
    roundRect(ctx,x+i*w*.06,y+i*h*.17,w*(.84-i*.04),h*.14,4,true,false);
    ctx.strokeStyle = 'rgba(31,42,39,.18)';
    ctx.stroke();
  });
  ctx.restore();
}

function drawBed(ctx,x,y,w,h){
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.22)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#8f735c';
  roundRect(ctx,x,y,w,h,12,true,false);
  ctx.fillStyle = '#ead8ec';
  roundRect(ctx,x+16,y+14,w-32,h-28,10,true,false);
  ctx.fillStyle = '#fffdfa';
  roundRect(ctx,x+26,y+22,w*.34,h*.28,8,true,false);
  ctx.fillStyle = '#d7c4d8';
  roundRect(ctx,x+w*.44,y+h*.18,w*.42,h*.54,10,true,false);
  ctx.restore();
}

function drawBedside(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = '#9d7958';
  roundRect(ctx,x,y,w,h,8,true,false);
  ctx.fillStyle = '#fff7df';
  ctx.beginPath();
  ctx.arc(x+w*.5,y-h*.18,w*.22,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawShoeBench(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = '#8a6849';
  roundRect(ctx,x,y,w,h,8,true,false);
  ctx.fillStyle = '#d9c4ad';
  roundRect(ctx,x+w*.08,y-h*.08,w*.84,h*.28,8,true,false);
  ctx.strokeStyle = 'rgba(31,42,39,.28)';
  ctx.beginPath();
  ctx.moveTo(x+w*.25,y+h*.2);
  ctx.lineTo(x+w*.25,y+h*.86);
  ctx.moveTo(x+w*.5,y+h*.2);
  ctx.lineTo(x+w*.5,y+h*.86);
  ctx.moveTo(x+w*.75,y+h*.2);
  ctx.lineTo(x+w*.75,y+h*.86);
  ctx.stroke();
  ctx.restore();
}

function drawFloorRunner(ctx,x,y,w,h){
  ctx.save();
  ctx.fillStyle = '#8e6d4b';
  roundRect(ctx,x,y,w,h,18,true,false);
  ctx.strokeStyle = 'rgba(255,247,223,.36)';
  ctx.lineWidth = 2;
  roundRect(ctx,x+w*.08,y+h*.18,w*.84,h*.64,14,false,true);
  ctx.restore();
}

function drawRiskLamp(ctx,x,y,risk,urgent){
  const color = urgent || risk>=2 ? '#d33b32' : risk===1 ? '#d9a441' : '#287a4c';
  const pulse = urgent ? (Math.sin(Date.now()/180)+1)/2 : risk ? .45 : .25;
  ctx.save();
  ctx.globalAlpha = urgent ? .28 + pulse*.3 : .18 + pulse*.12;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x,y,urgent ? 22 + pulse*12 : risk ? 18 + pulse*4 : 14,0,Math.PI*2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x,y,8,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawVignette(ctx,w,h){
  ctx.save();
  const lightOn = state.lightOn !== false;
  const g = ctx.createRadialGradient(w/2,h*.46,Math.min(w,h)*.18,w/2,h*.48,Math.max(w,h)*.72);
  g.addColorStop(0,'rgba(0,0,0,0)');
  g.addColorStop(.7, lightOn ? 'rgba(0,0,0,.035)' : 'rgba(0,0,0,.18)');
  g.addColorStop(1, lightOn ? 'rgba(0,0,0,.12)' : 'rgba(0,0,0,.48)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,w,h);
  ctx.restore();
}

function drawPoly(ctx,points,fill){
  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath();
  points.forEach(([x,y],i)=>{
    if(i) ctx.lineTo(x,y);
    else ctx.moveTo(x,y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function shade(hex,amt){
  const c = String(hex || '#999999').replace('#','');
  const n = parseInt(c.length===3 ? c.split('').map(x=>x+x).join('') : c,16);
  const r = clamp(((n>>16)&255)+amt,0,255);
  const g = clamp(((n>>8)&255)+amt,0,255);
  const b = clamp((n&255)+amt,0,255);
  return `rgb(${r},${g},${b})`;
}

function roundRect(ctx,x,y,w,h,r,fill,stroke){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
  if(fill) ctx.fill();
  if(stroke) ctx.stroke();
}

function bindViewEvents(){
  /* 新版首页事件 */
  const homeSearch = $('#home-search');
  const searchPreview = $('#search-preview');

  if(homeSearch){
    // 实时搜索预览
    homeSearch.addEventListener('input', e => {
      const query = homeSearch.value.trim();
      if(query.length >= 2){
        showSearchPreview(query);
      } else {
        hideSearchPreview();
      }
    });

    // Enter 直接跳转
    homeSearch.addEventListener('keydown', e => {
      if(e.key === 'Enter'){
        const query = homeSearch.value.trim();
        if(query){
          hideSearchPreview();
          state.librarySearch = query;
          setView('archives');
        }
      } else if(e.key === 'Escape'){
        hideSearchPreview();
      }
    });

    // 失焦隐藏预览
    homeSearch.addEventListener('blur', () => {
      setTimeout(() => hideSearchPreview(), 200);
    });
  }

  // 点击搜索预览外部关闭
  document.addEventListener('click', e => {
    if(searchPreview && !e.target.closest('.search-hero-input')){
      hideSearchPreview();
    }
  });

  /* 服务页标签切换 */
  $$('[data-service-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.serviceTab = btn.dataset.serviceTab;
      render();
    });
  });

  $$('.search-suggestions button').forEach(btn => {
    btn.addEventListener('click', e => {
      const query = btn.dataset.search;
      state.librarySearch = query;
      setView('archives');
    });
  });

  // 展开全部待办
  const expandBtn = $('[data-expand-upcoming]');
  if(expandBtn){
    expandBtn.addEventListener('click', () => {
      const list = $('#upcoming-list');
      const allTasks = getUpcomingTasks();

      // 渲染所有待办
      list.innerHTML = allTasks.map(task => `
        <div class="upcoming-item" data-task="${task.id}">
          <div class="upcoming-left">
            <span class="upcoming-icon">${task.icon}</span>
            <div class="upcoming-info">
              <h4>${esc(task.title)}</h4>
              <span class="upcoming-meta">${esc(task.member)} · ${task.daysLeft}天后</span>
            </div>
          </div>
          <div class="upcoming-right">
            <button class="btn btn-outline btn-sm" data-open="${task.archiveId}">查看</button>
          </div>
        </div>
      `).join('');

      // 隐藏展开按钮
      expandBtn.style.display = 'none';

      // 重新绑定事件
      bindViewEvents();
    });
  }

  $$('[data-goto-room]').forEach(el => {
    el.addEventListener('click', e => {
      const roomId = el.dataset.gotoRoom;
      const node = TOUR_NODES.find(n => n.id === roomId);
      if(node){
        state.tourNode = node.id;
        setView('space');
      }
    });
  });

  $$('[data-task]').forEach(el => {
    el.addEventListener('click', e => {
      if(e.target.closest('button')) return;
      const taskId = el.dataset.task;
    });
  });

  /* 档案页事件 */
  const archivesSearch = $('#archives-search');
  if(archivesSearch){
    archivesSearch.addEventListener('input', e => {
      state.librarySearch = e.target.value.trim();
      state.archivesPage = 1; // 重置到第一页
      render();
    });
  }

  $$('[data-filter]').forEach(btn => {
    btn.addEventListener('click', e => {
      state.libraryFilter = btn.dataset.filter;
      state.archivesPage = 1; // 重置到第一页
      saveState();
      render();
    });
  });

  $$('[data-member]').forEach(btn => {
    btn.addEventListener('click', e => {
      state.libraryMember = btn.dataset.member;
      state.archivesPage = 1; // 重置到第一页
      saveState();
      render();
    });
  });

  // 分类折叠
  const categoryToggle = $('[data-toggle="category"]');
  if(categoryToggle){
    categoryToggle.addEventListener('click', () => {
      state.categoryExpanded = !state.categoryExpanded;
      render();
    });
  }

  // 成员折叠
  const memberToggle = $('[data-toggle="member"]');
  if(memberToggle){
    memberToggle.addEventListener('click', () => {
      state.memberExpanded = !state.memberExpanded;
      render();
    });
  }

  // 分页
  $$('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.page;
      if(action === 'prev' && state.archivesPage > 1){
        state.archivesPage--;
        render();
        // 滚动到顶部
        $('.archives-main').scrollTop = 0;
      } else if(action === 'next'){
        state.archivesPage++;
        render();
        $('.archives-main').scrollTop = 0;
      }
    });
  });

  /* Slide-in 面板事件 */
  const detailPanel = $('#detail-panel');
  const detailOverlay = $('#detail-panel-overlay');
  const detailClose = $('#detail-panel-close');

  if(detailClose){
    detailClose.addEventListener('click', closeDetailPanel);
  }
  if(detailOverlay){
    detailOverlay.addEventListener('click', closeDetailPanel);
  }

  // 为所有 data-open 绑定打开详情面板（而非抽屉）
  $$('[data-open]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      openDetailPanel(el.dataset.open);
    });
  });

  // 为动态渲染的 data-view 按钮绑定视图切换（APP 首页快捷入口等）
  $$('[data-view]').forEach(el => {
    if(!el.dataset.viewBound){
      el.addEventListener('click', () => setView(el.dataset.view));
      el.dataset.viewBound = '1';
    }
  });

  /* 通用事件 */
  $$('[data-space-enter]').forEach(btn=>btn.addEventListener('click',e=>{
    e.preventDefault(); e.stopPropagation();
    enterSpaceWithTransition(btn);
  }));
  $$('[data-jump]').forEach(el=>el.addEventListener('click',e=>{ e.stopPropagation(); setView(el.dataset.jump); }));
  $$('[data-camera-result-view]').forEach(el=>el.addEventListener('click',e=>{ e.stopPropagation(); showRecentCameraUpdates(); }));
  $$('[data-camera-result-review]').forEach(el=>el.addEventListener('click',e=>{ e.stopPropagation(); showRecentCameraUpdates({reviewFirst:true}); }));
  $$('[data-space-zone]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    state.incidentFocus = false;
    state.spaceFilter = el.dataset.spaceZone;
    state.highlightedZone = el.dataset.spaceZone;
    state.roomFilter = activeRoomId(el.dataset.spaceZone);
    const node = TOUR_NODES.find(item=>item.zone===el.dataset.spaceZone);
    if(node) state.tourNode = node.id;
    state.libraryFilter = 'all';
    if(state.currentView === 'library') render();
    else if(state.currentView === 'dashboard') render();
    else setView('library');
  }));
  $$('[data-room-zone]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    const room = FLOOR_ROOMS.find(item=>item.id===el.dataset.roomZone);
    if(!room) return;
    state.incidentFocus = false;
    state.roomFilter = room.id;
    state.highlightedZone = room.zones[0] || null;
    state.spaceFilter = room.zones[0] || null;
    state.libraryFilter = 'all';
    // 2D 平面图点击房间 → 进入 3D 空间对应视角
    const zone = room.zones[0];
    if(zone){
      const node = TOUR_NODES.find(item=>item.zone===zone && item.id!==el.dataset.roomZone);
      if(node) state.tourNode = node.id;
      if(state.currentView === 'space') render();
      else enterSpaceWithTransition(null);
    } else {
      // 无 zone 的房间（如储物间）仍跳转档案列表
      if(state.layoutMode === 'app') setView('archives');
      else setView('library');
    }
  }));
  $$('[data-library-zone-list]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    state.incidentFocus = false;
    state.spaceFilter = el.dataset.libraryZoneList;
    state.highlightedZone = el.dataset.libraryZoneList;
    state.libraryView = 'list';
    state.libraryFilter = 'all';
    render();
  }));
  $$('[data-incident-action]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    if(state.incidentStatus === 'done'){
      state.timelineFilter = 'risk';
      saveState();
      setView('timeline');
    }else if(state.incidentStatus === 'in_progress'){
      // 不跳转到risk页面
    }else{
      startIncidentHandling({jumpToRisk:false});
    }
  }));
  $$('[data-home-scenario]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    activateHomeScenario(el.dataset.homeScenario, {jumpToDashboard: state.currentView !== 'dashboard'});
  }));
  $$('[data-ai-command]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    state.assistantQuery = el.dataset.aiCommand;
    render();
  }));
  $$('[data-member-focus]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    state.memberFocus = el.dataset.memberFocus;
    saveState();
    render();
  }));
  $$('[data-auth-focus]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    state.authorizationFocus = el.dataset.authFocus;
    saveState();
    render();
  }));
  $$('[data-auth-jump]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    state.authorizationFocus = el.dataset.authJump;
    saveState();
    setView('members');
  }));
  $$('[data-service-demo-jump]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    focusServiceDemo(el.dataset.serviceDemoJump);
    saveState();
    setView('services');
  }));
  const assistantInput = $('#assistant-input');
  const submitAssistant = ()=>{
    if(!assistantInput) return;
    state.assistantQuery = assistantInput.value.trim() || '家里现在最需要处理什么？';
    render();
  };
  if(assistantInput) assistantInput.addEventListener('keydown',e=>{
    if(e.key === 'Enter') submitAssistant();
  });
  const assistantSubmit = $('[data-assistant-submit]');
  if(assistantSubmit) assistantSubmit.addEventListener('click',e=>{
    e.stopPropagation();
    submitAssistant();
  });
  $$('[data-service-demo]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    focusServiceDemo(el.dataset.serviceDemo);
    saveState();
    render();
  }));
  $$('[data-service-run]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    runServiceDemo(el.dataset.serviceRun);
  }));
  $$('[data-service-order]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    showServiceOrderDetail(el.dataset.serviceOrder);
  }));
  $$('[data-service-action]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    handleServiceAction(el.dataset.serviceAction);
  }));
  $$('[data-space-cmd]').forEach(btn=>btn.addEventListener('click',e=>{ e.stopPropagation(); handleSpaceCommand(btn.dataset.spaceCmd); }));
  bindSpaceViewport();
  bindTourCanvas();
  const clearSpace = $('[data-clear-space-filter]');
  if(clearSpace) clearSpace.addEventListener('click',()=>{ state.incidentFocus=false; state.spaceFilter=null; state.highlightedZone=null; state.roomFilter=null; render(); });
  const clearRecentScan = $('[data-clear-recent-scan]');
  if(clearRecentScan) clearRecentScan.addEventListener('click',()=>{ state.libraryRecentScanOnly = false; render(); });
  $$('[data-toggle-library-more]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    state.libraryMoreOpen = !state.libraryMoreOpen;
    render();
  }));
  $$('[data-filter]').forEach(el=>el.addEventListener('click',e=>{ e.stopPropagation(); state.libraryFilter=el.dataset.filter; render(); }));
  $$('[data-member-filter]').forEach(el=>el.addEventListener('click',e=>{ e.stopPropagation(); state.libraryMember=el.dataset.memberFilter; render(); }));
  $$('[data-library-view]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    state.libraryView = el.dataset.libraryView;
    if(state.libraryView === 'list' && (!el.closest('.library-space-actions') || el.dataset.libraryClear === '1')){
      state.incidentFocus = false;
      state.spaceFilter = null;
      state.highlightedZone = null;
      state.libraryFilter = 'all';
    }
    render();
  }));
  $$('[data-risk-tab]').forEach(el=>el.addEventListener('click',e=>{ e.stopPropagation(); state.riskTab=el.dataset.riskTab; saveState(); render(); }));
  $$('[data-timeline-filter]').forEach(el=>el.addEventListener('click',e=>{ e.stopPropagation(); state.timelineFilter=el.dataset.timelineFilter; saveState(); render(); }));
  const libSearch = $('#lib-search');
  if(libSearch) libSearch.addEventListener('keydown',e=>{
    if(e.key==='Enter'){
      state.incidentFocus = false;
      state.librarySearch = e.target.value;
      const answer = naturalAnswer(state.librarySearch);
      if(answer?.archive) state.highlightedZone = answer.archive.memoryZone;
      render();
    }
  });
  const searchSample = $('[data-search-sample]');
  if(searchSample) searchSample.addEventListener('click',()=>{
    state.incidentFocus = false;
    state.librarySearch = searchSample.dataset.searchSample;
    state.libraryFilter = 'all';
    state.spaceFilter = null;
    const answer = naturalAnswer(state.librarySearch);
    if(answer?.archive) state.highlightedZone = answer.archive.memoryZone;
    setView('library');
  });
  $$('[data-camera-panel]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation();
    state.cameraPanelOpen = !state.cameraPanelOpen;
    if(state.cameraPanelOpen) state.cameraResultDisplay = false;
    if(!state.cameraPanelOpen && cameraAutoCloseTimer){ clearTimeout(cameraAutoCloseTimer); }
    refreshCameraPanel();
    toast(state.cameraPanelOpen ? '空间采集面板已打开' : '空间采集面板已收起');
  }));
  $$('[data-camera-start]').forEach(btn=>btn.addEventListener('click',e=>{ e.stopPropagation(); startCameraSimulation(); }));
  if(!cameraLinkDelegateBound){
    cameraLinkDelegateBound = true;
    /* 关联摄像头: 事件委托(按钮动态创建) */
    document.addEventListener('click', function(e){
      var btn = e.target.closest('[data-camera-link]');
      if(!btn) return;
      e.stopPropagation();
      runCameraLinkFlow(btn.dataset.cameraLink);
    });
  }
  const start = $('#start-ai'); if(start) start.addEventListener('click',startAI);
  const confirm = $('#confirm-fields'); if(confirm) confirm.addEventListener('click',confirmFields);
  const restart = $('#restart-ai'); if(restart) restart.addEventListener('click',()=>{ state.aiStage='idle'; render(); });
  const pick = $('#pick-files'); const file = $('#file-input');
  if(pick && file){ pick.addEventListener('click',()=>file.click()); file.addEventListener('change',e=>{ handleFiles(e.target.files); e.target.value=''; }); }
  const addLow = $('#add-low-sample'); if(addLow) addLow.addEventListener('click',addLowSample);
  const drop = $('#import-zone');
  if(drop){
    drop.addEventListener('dragover',e=>{ e.preventDefault(); drop.classList.add('dragover'); });
    drop.addEventListener('dragleave',()=>drop.classList.remove('dragover'));
    drop.addEventListener('drop',e=>{ e.preventDefault(); drop.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
  }
}

function applyLayoutMode(){
  document.body.classList.remove('force-pc','force-app');
  if(state.layoutMode === 'pc') document.body.classList.add('force-pc');
  else if(state.layoutMode === 'app') document.body.classList.add('force-app');
  document.querySelectorAll('#layout-toggle button').forEach(btn=>{
    btn.classList.toggle('active', state.layoutMode === btn.dataset.mode);
  });
}

function cameraResultSummaryHTML(summary){
  if(!summary || !summary.changed || !summary.changed.length) return '';
  const headline = summary.reviewCount
    ? `已更新 ${summary.totalChanged} 份家庭档案，其中 ${summary.reviewCount} 项待确认`
    : `已更新 ${summary.totalChanged} 份家庭档案`;
  return `<div class="camera-result-summary">
    <div class="camera-result-head">
      <div>
        <strong>家庭记忆空间已更新</strong>
        <span>${headline} · ${summary.timestamp}</span>
      </div>
      <div class="camera-result-actions">
        <button class="btn btn-primary btn-sm" data-camera-result-view>查看更新档案</button>
        ${summary.primaryZone ? `<button class="btn btn-outline btn-sm" data-space-zone="${summary.primaryZone}">进入空间定位</button>` : ''}
        ${summary.reviewCount ? `<button class="btn btn-outline btn-sm" data-camera-result-review>优先处理待确认</button>` : ''}
      </div>
    </div>
    <div class="camera-result-kpis">
      <div><span>归位更新</span><strong>${summary.relocatedCount}</strong></div>
      <div><span>置信提升</span><strong>${summary.confidenceLiftCount}</strong></div>
      <div><span>待人工复核</span><strong>${summary.reviewCount}</strong></div>
      <div><span>隐私遮罩保留</span><strong>${summary.maskedCount}</strong></div>
    </div>
    <div class="camera-result-list">
      ${summary.changed.map(item=>`<button class="camera-result-row ${item.needsReview ? 'review' : ''}" data-open="${item.id}">
        <span class="camera-result-main">
          <strong>${esc(item.title)}</strong>
          <em>${esc(item.beforeLocation)} -> ${esc(item.afterLocation)}</em>
          <small>${esc(item.source)}</small>
        </span>
        <span class="camera-result-meta">
          <b>${Math.round(item.beforeConfidence * 100)}% -> ${Math.round(item.confidence * 100)}%</b>
          <i>${item.needsReview ? '待复核' : '已归位'}</i>
        </span>
      </button>`).join('')}
    </div>
    ${summary.maskedCount ? `<div class="camera-result-note">敏感资料仍保持遮罩，不会直接出现在公开空间视图中。</div>` : ''}
    ${scanValueSummaryHTML(summary)}
  </div>`;
}


function archiveCardHTML(a, query=''){
  const c = catColor(a.category);
  const hit = getArchiveSearchMatches(a, query);
  const fields = [a.amountOrTerm, displayLocation(a)].filter(Boolean).slice(0,2);
  const nearest = nearestReminder(a);
  const asset = archiveAssetProfile(a);
  const scanUpdate = recentCameraUpdateForArchive(a.id);
  return `<article class="arc-card arc-risk-${a.riskLevel || 'none'}" data-open="${a.id}">
    <div class="arc-head">
      <div class="arc-ic" style="background:${c.bg};color:${c.color}">${c.ico}</div>
      <div style="flex:1;min-width:0">
        <div class="arc-title">${esc(a.title)}</div>
        <div class="arc-meta">${esc(a.familyMember)} · ${esc(a.rawType)}</div>
      </div>
      <div class="arc-head-tags">
        ${scanUpdate ? `<span class="tag ${scanUpdate.needsReview ? 'warn' : 'brand'}">${scanUpdate.needsReview ? 'AI 待复核' : 'AI 新归位'}</span>` : ''}
        <span class="tag ${riskTag(a.riskLevel).c}">${riskTag(a.riskLevel).t}</span>
      </div>
    </div>
    <div class="arc-fields">${fields.map(x=>`<span class="arc-field">${esc(x)}</span>`).join('')}</div>
    ${scanUpdate ? `<div class="arc-scan-note ${scanUpdate.needsReview?'review':''}"><strong>${scanUpdate.needsReview ? '扫描返回待确认位置' : '扫描已更新档案位置'}</strong><span>${esc(scanUpdate.beforeLocation)} -> ${esc(scanUpdate.afterLocation)} · 置信 ${Math.round(scanUpdate.beforeConfidence * 100)}% -> ${Math.round(scanUpdate.confidence * 100)}%</span></div>` : ''}
    <div class="asset-card-grid">
      <span><b>价值</b>${esc(asset.exposure)}</span>
      <span><b>证据</b>${esc(asset.proof)}</span>
      <span><b>风险</b>${esc(asset.risk)}</span>
      <span><b>服务</b>${esc(asset.service)}</span>
    </div>
    ${hit.length ? `<div class="arc-why">${hit.map(esc).join(' · ')}</div>` : `<div class="arc-why">${esc(a.ai.reason)}</div>`}
    <div class="arc-foot"><span class="tag ${statusTag(a.status).c}">${statusTag(a.status).t}</span>${nearest?`<span class="tag ${reminderPriority(nearest.days).c}">${nearest.days} 天后</span>`:''}<span class="tag gray">${esc(asset.paid)}</span></div>
  </article>`;
}

/* 轻量级面板刷新: 只更新摄像头面板DOM,不重建3D场景,避免扫描过程中卡顿 */
function refreshCameraPanel(){
  if(state.currentView !== 'space'){ render(); return; }
  const existing = document.querySelector('.camera-panel.camera-overlay');
  const workbench = document.querySelector('.tour-workbench');
  if(!workbench){ render(); return; }
  if(!state.cameraPanelOpen){
    if(existing){
      existing.classList.add('panel-fading-out');
      setTimeout(()=>{ if(existing.parentNode) existing.remove(); }, 360);
    }
    document.querySelectorAll('[data-camera-panel]').forEach(btn=>{
      btn.classList.remove('open'); btn.classList.add('closed');
    });
    return;
  }
  const html = cameraPanelHTML(true);
  if(existing){
    const wasDone = existing.classList.contains('scan-done');
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const newPanel = temp.firstElementChild;
    /* 从扫描中→完成的过渡: 短暂淡入,其余即时替换 */
    if(!wasDone && newPanel.classList.contains('scan-done')){
      newPanel.style.opacity = '0';
      existing.replaceWith(newPanel);
      requestAnimationFrame(()=>{
        newPanel.style.transition = 'opacity .4s ease';
        newPanel.style.opacity = '1';
      });
    }else{
      existing.replaceWith(newPanel);
    }
  }else{
    workbench.insertAdjacentHTML('beforeend', html);
  }
  document.querySelectorAll('[data-camera-panel]').forEach(btn=>{
    btn.classList.add('open'); btn.classList.remove('closed');
  });
}

function startCameraSimulation(){
  if(cameraTimer) clearTimeout(cameraTimer);
  if(cameraAutoCloseTimer) clearTimeout(cameraAutoCloseTimer);
  state.cameraStage = 'running';
  state.cameraStep = 0;
  state.cameraSimulationComplete = false;
  state.cameraResultDisplay = false;
  state.lastCameraResult = null;
  state.libraryRecentScanOnly = false;
  refreshCameraPanel();
  const stageDurations = [620, 680, 640, 720, 680, 640];
  const advance = () => {
    if(state.cameraStep < CAMERA_STEPS.length - 1){
      state.cameraStep += 1;
      refreshCameraPanel();
      cameraTimer = setTimeout(advance, stageDurations[state.cameraStep] || 660);
    }else{
      state.cameraStage = 'done';
      state.cameraSimulationComplete = true;
      state.cameraResultDisplay = true;
      state.cameraStep = CAMERA_STEPS.length;
      applyCameraResults();
      saveState();
      refreshCameraPanel();
      const summary = state.lastCameraResult;
      toast(summary ? `已更新 ${summary.totalChanged} 份档案${summary.reviewCount ? `，${summary.reviewCount} 项待确认` : ''}` : '空间线索已合并到家庭记忆空间');
      /* 扫描成果展示后自动收起面板,避免遮挡3D视图 */
      cameraAutoCloseTimer = setTimeout(()=>{
        if(state.cameraResultDisplay){
          state.cameraResultDisplay = false;
          state.cameraPanelOpen = false;
          refreshCameraPanel();
        }
      }, 6000);
    }
  };
  cameraTimer = setTimeout(advance, stageDurations[0]);
}

function applyCameraResults(){
  const byId = id => state.archives.find(a=>a.id===id);
  const changed = [];
  CAMERA_RESULTS.forEach(result=>{
    const a = result.archiveId ? byId(result.archiveId) : null;
    if(!a) return;
    const before = {
      memoryZone: a.memoryZone,
      memoryRoom: a.memoryRoom,
      memoryContainer: a.memoryContainer,
      locationPrivacy: a.locationPrivacy,
      locationConfidence: a.locationConfidence || 0
    };
    a.memoryZone = result.zone;
    a.memoryRoom = SPACE_ZONES.find(z=>z.id===result.zone).room;
    a.memoryContainer = result.container;
    a.locationConfidence = result.confidence;
    a.locationSource = result.source;
    if(result.privacy !== 'public') a.locationPrivacy = result.privacy;
    const after = {
      memoryZone: a.memoryZone,
      memoryContainer: a.memoryContainer,
      locationPrivacy: a.locationPrivacy,
      locationConfidence: a.locationConfidence || 0
    };
    if(!a.operations.some(o=>o.action.includes(result.camera))){
      a.operations.push(op(nowStr(),`${result.camera}：识别到 ${result.container}，${result.suggestion}`,'AI 空间归位'));
    }
    if(a.id==='A010' && a.status==='archived'){
      a.riskLevel = 'medium';
      a.operations.push(op(nowStr(),'客厅抽屉视角置信 76%，建议人工复核维修工单位置','AI 空间归位'));
    }
    changed.push({
      id: a.id,
      title: a.title,
      zone: result.zone,
      camera: result.camera,
      source: result.source,
      confidence: result.confidence,
      beforeConfidence: before.locationConfidence || 0,
      beforeLocation: describeStoredLocation(before),
      afterLocation: describeStoredLocation(after),
      relocated: before.memoryZone !== after.memoryZone || before.memoryContainer !== after.memoryContainer || before.locationPrivacy !== after.locationPrivacy,
      needsReview: result.confidence < .8 || /人工|复核|确认/.test(result.suggestion || '')
    });
  });
  state.cameraApplied = true;
  state.lastCameraResult = {
    changed,
    changedIds: changed.map(item=>item.id),
    reviewIds: changed.filter(item=>item.needsReview).map(item=>item.id),
    totalChanged: changed.length,
    relocatedCount: changed.filter(item=>item.relocated).length,
    confidenceLiftCount: changed.filter(item=>item.confidence > item.beforeConfidence).length,
    reviewCount: changed.filter(item=>item.needsReview).length,
    maskedCount: CAMERA_RESULTS.filter(item=>item.privacy === 'hidden').length,
    primaryZone: changed[0]?.zone || null,
    timestamp: nowStr()
  };
  state.highlightedZone = state.lastCameraResult.primaryZone || state.highlightedZone;
  state.libraryRecentScanOnly = false;
  activateScanZoneHighlights(changed.map(item=>item.zone));
}

function showRecentCameraUpdates(options={}){
  const summary = state.lastCameraResult;
  if(!summary || !summary.changedIds || !summary.changedIds.length) return;
  state.incidentFocus = false;
  state.libraryView = 'list';
  state.libraryFilter = 'all';
  state.librarySearch = '';
  state.spaceFilter = null;
  state.highlightedZone = summary.primaryZone || state.highlightedZone;
  state.libraryRecentScanOnly = true;
  setView('library');
  if(options.reviewFirst && summary.reviewIds && summary.reviewIds.length) openDrawer(summary.reviewIds[0]);
}

function activateScanZoneHighlights(zones){
  const nextZones = [...new Set((zones || []).filter(Boolean))];
  state.scanHighlightedZones = nextZones;
  state.scanHighlightUntil = nextZones.length ? Date.now() + 5200 : 0;
  if(zoneHighlightTimer) clearTimeout(zoneHighlightTimer);
  if(nextZones.length){
    zoneHighlightTimer = setTimeout(()=>{
      state.scanHighlightedZones = [];
      state.scanHighlightUntil = 0;
      zoneHighlightTimer = null;
      render();
    }, 5400);
  }
}

function zoneHighlightActive(zoneId){
  return !!(zoneId && state.scanHighlightedZones?.includes(zoneId) && (state.scanHighlightUntil || 0) > Date.now());
}

function tourMiniMapRooms(node){
  const active = id => node.id===id ? ' active' : '';
  const hot = zoneId => zoneHighlightActive(zoneId) ? ' scan-hot' : '';
  const dot = (id,x,y,label) => `<g class="clover-node${active(id)}" data-tour-goto="${id}" tabindex="0" role="button" aria-label="前往${label}">
    <circle cx="${x}" cy="${y}" r="5.5"/>
    <text x="${x}" y="${y-8}">${label}</text>
  </g>`;
  return `<svg class="clover-plan" viewBox="0 0 180 112" aria-label="四叶草户型漫游节点图">
    <defs>
      <filter id="cloverShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#000" flood-opacity=".22"/>
      </filter>
    </defs>
    <path class="clover-outline" d="M90 12c39 0 71 29 71 51s-32 37-71 37-71-15-71-37 32-51 71-51Z"/>
    <path class="clover-wing living${active('living-node')}${hot('living')}" data-tour-goto="living-node" d="M58 45h64c6 0 10 4 10 10v30c0 6-4 10-10 10H58c-6 0-10-4-10-10V55c0-6 4-10 10-10Z"/>
    <path class="clover-wing entry${active('entry-node')}${hot('entry')}" data-tour-goto="entry-node" d="M16 68c0-13 11-24 25-24h23v51H41c-14 0-25-12-25-27Z"/>
    <path class="clover-wing study${active('study-node')}${hot('study')}" data-tour-goto="study-node" d="M24 18h44c8 0 14 6 14 14v18H44c-12 0-22-10-22-22 0-4 1-7 2-10Z"/>
    <path class="clover-wing balcony${active('balcony-node')}${hot('balcony')}" data-tour-goto="balcony-node" d="M65 12h50c7 0 12 5 12 12v20H53V24c0-7 5-12 12-12Z"/>
    <path class="clover-wing bedroom${active('bedroom-node')}${hot('bedroom')}" data-tour-goto="bedroom-node" d="M112 18h42c3 4 5 9 5 14 0 12-10 22-22 22h-39V32c0-8 6-14 14-14Z"/>
    <path class="clover-wing bath${active('bath-node')}${hot('bath')}" data-tour-goto="bath-node" d="M124 58h31c6 0 10 4 10 10v22c0 6-4 10-10 10h-31V58Z"/>
    <path class="clover-corridor" d="M44 72h30M74 72V51M74 51h32M90 45V24M106 51h31M122 72h18"/>
    <path class="clover-door" d="M48 72c8 0 14-6 14-14M75 51c0 8 6 14 14 14M98 45c0 7 5 12 12 12M122 58c8 0 13-5 13-13M122 80c7 0 12-5 12-12"/>
    ${dot('entry-node',41,77,'玄关')}
    ${dot('living-node',90,74,'客厅')}
    ${dot('study-node',51,34,'书房')}
    ${dot('balcony-node',90,29,'阳台')}
    ${dot('bedroom-node',133,37,'卧室')}
    ${dot('bath-node',145,80,'卫浴')}
  </svg>`;
}

const _zoneStatsBase = zoneStats;
zoneStats = function(){
  return _zoneStatsBase().map(zone=>Object.assign({}, zone, {
    scanHot: zoneHighlightActive(zone.id)
  }));
};

const _archiveCardHTMLBase = archiveCardHTML;
archiveCardHTML = function(a, query=''){
  return _archiveCardHTMLBase(a, query);
};

function init(){
  loadState();
  const sidebar = $('#sidebar');
  const sidebarSlot = $('#app-sidebar-slot');
  if(sidebar && sidebarSlot && sidebar.parentNode !== sidebarSlot) sidebarSlot.appendChild(sidebar);
  applyLayoutMode();
  applyUrlState();
  syncViewChrome();
  $$('[data-view]').forEach(n=>n.addEventListener('click',()=>setView(n.dataset.view)));
  $('#menu-toggle').addEventListener('click',()=>{
    const sidebar = $('#sidebar');
    setSidebarOpen(!(sidebar && sidebar.classList.contains('open')));
  });
  const appSidebarMask = $('#app-sidebar-mask');
  if(appSidebarMask) appSidebarMask.addEventListener('click',()=>setSidebarOpen(false));
  $('#drawer-close').addEventListener('click',closeDrawer);
  $('#drawer-mask').addEventListener('click',closeDrawer);
  $('#privacy-toggle').addEventListener('change',e=>{ state.privacyMode = e.target.checked; saveState(); render(); toast(state.privacyMode?'隐私模式已开':'隐私模式已关'); });
  /* PC/APP 模式切换 */
  document.querySelectorAll('#layout-toggle button').forEach(btn=>{
    btn.addEventListener('click',()=>{
      var mode = btn.dataset.mode;
      state.layoutMode = (state.layoutMode === mode) ? 'auto' : mode;
      applyLayoutMode();
      saveState();
      render();
    });
  });
  $('#global-search').addEventListener('keydown',e=>{
    if(e.key==='Enter'){
      state.librarySearch = e.target.value.trim();
      state.libraryFilter = 'all';
      state.incidentFocus = false;
      state.spaceFilter = null;
      const answer = naturalAnswer(state.librarySearch);
      if(answer?.archive) state.highlightedZone = answer.archive.memoryZone;
      setView('library');
      if(state.currentView !== 'library') e.target.value = '';
    }
  });
  $('#global-search').addEventListener('input',e=>{
    if(state.currentView !== 'library') return;
    state.librarySearch = e.target.value.trim();
    state.incidentFocus = false;
    const answer = naturalAnswer(state.librarySearch);
    if(answer?.archive) state.highlightedZone = answer.archive.memoryZone;
    render();
  });
  const topPending = $('#top-pending-action');
  if(topPending) topPending.addEventListener('click',()=>setView('archive'));
  document.addEventListener('keydown',e=>{
    if(e.key === 'Escape'){
      const sidebar = $('#sidebar');
      if(sidebar && sidebar.classList.contains('open')) setSidebarOpen(false);
    }
  });
  render();

  /* 监听hash变化，支持#today等hash路由 */
  window.addEventListener('hashchange', () => {
    applyUrlState();
    render();
  });

  /* 首次访问启动引导教程 */
  setTimeout(()=>{
    if(!localStorage.getItem('jiayouju-tutorial-completed')){
      startTutorial();
    }
  }, 1000);
}

document.addEventListener('DOMContentLoaded', init);

/* ========== 新手引导教程系统 ========== */
const TUTORIAL_STEPS = [
  {
    target: '.search-hero-input input',
    title: '欢迎使用智慧家 AI',
    content: '输入问题如"洗衣机保修到什么时候"，AI会帮您找到答案并定位到空间位置。',
    position: 'bottom',
    highlight: true
  },
  {
    target: '.urgent-section',
    title: '紧急事项',
    content: '这里显示0-3天内需要处理的重要事项，一键直达处理流程。',
    position: 'right',
    highlight: true
  },
  {
    target: '.nav-item[data-view="space"]',
    title: '3D空间',
    content: '点击这里进入3D数字孪生空间，漫游您的家并查看档案位置。',
    position: 'right',
    highlight: true
  },
  {
    target: '.nav-item[data-view="archives"]',
    title: '档案库',
    content: '查看所有家庭档案，按类别、成员、到期时间筛选。',
    position: 'right',
    highlight: true
  },
  {
    target: '.privacy-toggle',
    title: '隐私保护',
    content: '开启隐私模式后，敏感资料（如证件、合同）不会显示精确位置。',
    position: 'bottom',
    highlight: true
  }
];

let currentTutorialStep = 0;
let tutorialOverlay = null;
let tutorialSpotlight = null;
let tutorialTooltip = null;

function startTutorial(){
  if(document.querySelector('.tutorial-overlay')) return;

  currentTutorialStep = 0;

  // 创建蒙层
  tutorialOverlay = document.createElement('div');
  tutorialOverlay.className = 'tutorial-overlay';

  // 创建高亮框
  tutorialSpotlight = document.createElement('div');
  tutorialSpotlight.className = 'tutorial-spotlight';

  // 创建提示框
  tutorialTooltip = document.createElement('div');
  tutorialTooltip.className = 'tutorial-tooltip';

  document.body.appendChild(tutorialOverlay);
  tutorialOverlay.appendChild(tutorialSpotlight);
  tutorialOverlay.appendChild(tutorialTooltip);

  setTimeout(()=>{
    tutorialOverlay.classList.add('active');
    showTutorialStep(0);
  }, 100);
}

function showTutorialStep(stepIndex){
  if(stepIndex >= TUTORIAL_STEPS.length){
    completeTutorial();
    return;
  }

  const step = TUTORIAL_STEPS[stepIndex];
  const target = document.querySelector(step.target);

  if(!target){
    // 如果目标元素不存在，跳到下一步
    showTutorialStep(stepIndex + 1);
    return;
  }

  // 更新高亮位置
  const rect = target.getBoundingClientRect();
  tutorialSpotlight.style.left = `${rect.left - 8}px`;
  tutorialSpotlight.style.top = `${rect.top - 8}px`;
  tutorialSpotlight.style.width = `${rect.width + 16}px`;
  tutorialSpotlight.style.height = `${rect.height + 16}px`;

  // 更新提示框内容
  tutorialTooltip.innerHTML = `
    <div class="tutorial-header">
      <div class="tutorial-title">
        <span class="tutorial-step-badge">${stepIndex + 1}/${TUTORIAL_STEPS.length}</span>
        ${esc(step.title)}
      </div>
    </div>
    <div class="tutorial-content">${esc(step.content)}</div>
    <div class="tutorial-actions">
      <span class="tutorial-skip">跳过教程</span>
      <button class="btn btn-sm btn-outline tutorial-prev" ${stepIndex === 0 ? 'disabled' : ''}>上一步</button>
      <button class="btn btn-sm btn-primary tutorial-next">${stepIndex === TUTORIAL_STEPS.length - 1 ? '完成' : '下一步'}</button>
    </div>
  `;

  // 计算提示框位置
  tutorialTooltip.className = `tutorial-tooltip ${step.position}`;
  positionTooltip(tutorialTooltip, rect, step.position);

  // 绑定事件
  tutorialTooltip.querySelector('.tutorial-next').addEventListener('click', ()=>{
    showTutorialStep(stepIndex + 1);
  });

  const prevBtn = tutorialTooltip.querySelector('.tutorial-prev');
  if(prevBtn && stepIndex > 0){
    prevBtn.addEventListener('click', ()=>{
      showTutorialStep(stepIndex - 1);
    });
  }

  tutorialTooltip.querySelector('.tutorial-skip').addEventListener('click', ()=>{
    completeTutorial();
  });
}

function positionTooltip(tooltip, targetRect, position){
  const padding = 20;

  switch(position){
    case 'right':
      tooltip.style.left = `${targetRect.right + padding}px`;
      tooltip.style.top = `${targetRect.top + targetRect.height / 2}px`;
      tooltip.style.transform = 'translateY(-50%)';
      break;
    case 'left':
      tooltip.style.left = `auto`;
      tooltip.style.right = `${window.innerWidth - targetRect.left + padding}px`;
      tooltip.style.top = `${targetRect.top + targetRect.height / 2}px`;
      tooltip.style.transform = 'translateY(-50%)';
      break;
    case 'bottom':
      tooltip.style.left = `${targetRect.left + targetRect.width / 2}px`;
      tooltip.style.top = `${targetRect.bottom + padding}px`;
      tooltip.style.transform = 'translateX(-50%)';
      break;
    case 'top':
      tooltip.style.left = `${targetRect.left + targetRect.width / 2}px`;
      tooltip.style.top = `auto`;
      tooltip.style.bottom = `${window.innerHeight - targetRect.top + padding}px`;
      tooltip.style.transform = 'translateX(-50%)';
      break;
  }
}

function completeTutorial(){
  if(tutorialOverlay){
    tutorialOverlay.classList.remove('active');
    setTimeout(()=>{
      tutorialOverlay.remove();
      tutorialOverlay = null;
      tutorialSpotlight = null;
      tutorialTooltip = null;
    }, 300);
  }
  localStorage.setItem('jiayouju-tutorial-completed', 'true');
  toast('✅ 教程完成！开始探索您的智慧家吧');
}

/* 重置教程（用于测试） */
window.resetTutorial = function(){
  localStorage.removeItem('jiayouju-tutorial-completed');
  location.reload();
};

/* ========== 档案导出功能 ========== */
function exportArchive(archiveId){
  const archive = state.archives.find(a => a.id === archiveId);
  if(!archive) return;

  // 生成文本格式导出
  const text = generateArchiveText(archive);

  // 创建下载
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${archive.title}_${archive.id}_${TODAY}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast('✅ 档案已导出');
}

function generateArchiveText(a){
  const lines = [
    '========================================',
    `档案标题：${a.title}`,
    `档案ID：${a.id}`,
    `类别：${a.category}`,
    `状态：${statusTag(a.status).t}`,
    `风险等级：${riskTag(a.riskLevel).t}`,
    '========================================',
    '',
    '【基本信息】',
    `家庭成员：${a.familyMember}`,
    `日期：${a.date}`,
    `金额或期限：${a.amountOrTerm}`,
    `原始类型：${a.rawType}`,
    `原始预览：${a.rawPreview}`,
    '',
    '【记忆位置】',
    `房间：${a.memoryRoom || '未设置'}`,
    `区域：${a.memoryZone || '未设置'}`,
    `容器：${a.memoryContainer || '未设置'}`,
    `隐私等级：${PRIVACY_TEXT[a.locationPrivacy]}`,
    `位置置信度：${Math.round((a.locationConfidence||0)*100)}%`,
    `位置来源：${a.locationSource}`,
    '',
    '【证据材料】',
    `来源：${a.sourceMaterial}`,
    `证据清单：`,
    ...a.evidence.map(e => `  - ${e}`),
    '',
    '【字段识别结果】',
    ...a.fields.map(f => `  ${f.label}：${f.value} (${SOURCE_TEXT[f.source]} ${Math.round((f.confidence||0)*100)}%)`),
    ''
  ];

  if(a.lowConfidence){
    lines.push('【低置信度说明】');
    lines.push(`模糊原因：${a.lowConfidence.reason}`);
    lines.push(`缺失字段：${a.lowConfidence.missing.join('、')}`);
    lines.push(`AI追问：`);
    a.lowConfidence.questions.forEach(q => lines.push(`  - ${q}`));
    lines.push(`人工补全：${a.lowConfidence.manual}`);
    lines.push('');
  }

  lines.push('【提醒事项】');
  if(a.reminders.length > 0){
    a.reminders.forEach(r => {
      lines.push(`  [${r.status === 'done' ? '已完成' : '待处理'}] ${r.date} - ${r.action}`);
    });
  } else {
    lines.push('  （无提醒）');
  }
  lines.push('');

  lines.push('【生命周期记录】');
  a.events.forEach(e => {
    lines.push(`  ${e.date} | ${e.type} | ${e.member}${e.amount ? ' | '+e.amount : ''}`);
    lines.push(`    ${e.desc}`);
  });
  lines.push('');

  lines.push('【交接说明】');
  lines.push(a.handover);
  lines.push('');

  lines.push('【AI解释】');
  lines.push(`识别类型：${a.ai.type}`);
  lines.push(`归档理由：${a.ai.reason}`);
  lines.push(`风险判断：${a.ai.risk}`);
  lines.push(`归位建议：${displayLocation(a)}`);
  lines.push(`隐私建议：${a.ai.privacy}`);
  lines.push('');

  lines.push('【操作日志】');
  a.operations.forEach(o => {
    lines.push(`  ${o.time} | ${o.member} | ${o.action}`);
  });
  lines.push('');

  lines.push('========================================');
  lines.push(`导出时间：${new Date().toLocaleString('zh-CN')}`);
  lines.push(`导出来源：智慧家 AI - 家庭事务管家`);
  lines.push('========================================');

  return lines.join('\n');
}

/* 批量导出所有档案 */
window.exportAllArchives = function(){
  const data = {
    version: '1.0',
    exportTime: new Date().toISOString(),
    archives: state.archives,
    reminders: state.archives.flatMap(a => a.reminders.map(r => ({...r, archiveId: a.id}))),
    incidents: DEMO_INCIDENTS
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `jiayouju_backup_${TODAY}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast('✅ 所有档案已导出为JSON格式');
};

/* 在抽屉事件绑定中添加导出按钮处理 */
const originalBindDrawerEvents = window.bindDrawerEvents || function(){};
window.bindDrawerEvents = function(a){
  if(originalBindDrawerEvents) originalBindDrawerEvents(a);

  const exportBtn = document.querySelector('[data-export-archive]');
  if(exportBtn){
    exportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const archiveId = exportBtn.dataset.exportArchive;
      exportArchive(archiveId);
    });
  }
};

/* ========== 搜索实时预览 ========== */
function showSearchPreview(query){
  const preview = $('#search-preview');
  if(!preview) return;

  const results = state.archives.filter(a => archiveSearchHit(a, query)).slice(0, 5);

  if(results.length === 0){
    preview.innerHTML = `<div class="search-preview-empty">未找到匹配的档案</div>`;
  } else {
    const header = `
      <div class="search-preview-header">
        <h4>搜索结果</h4>
        <span class="search-preview-count">${results.length} 个档案</span>
      </div>
    `;
    const items = results.map(a => {
      const c = catColor(a.category);
      const nearest = nearestReminder(a);
      return `
        <div class="search-preview-item" data-open="${a.id}">
          <div class="search-preview-icon" style="background:${c.bg};color:${c.color}">${c.ico}</div>
          <div class="search-preview-main">
            <div class="search-preview-title">${esc(a.title)}</div>
            <div class="search-preview-meta">${esc(a.familyMember)} · ${esc(a.amountOrTerm)}</div>
          </div>
          ${nearest && nearest.days <= 30 ? `<span class="search-preview-badge">${nearest.days}天后</span>` : ''}
        </div>
      `;
    }).join('');

    preview.innerHTML = header + items;

    // 绑定点击事件
    $$('.search-preview-item').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        hideSearchPreview();
        openDetailPanel(el.dataset.open);
      });
    });
  }

  preview.classList.add('active');
}

function hideSearchPreview(){
  const preview = $('#search-preview');
  if(preview){
    preview.classList.remove('active');
  }
}

/* ========== Slide-in 详情面板 ========== */
function openDetailPanel(archiveId){
  const archive = state.archives.find(a => a.id === archiveId);
  if(!archive) return;

  const panel = $('#detail-panel');
  const overlay = $('#detail-panel-overlay');
  const title = $('#detail-panel-title');
  const body = $('#detail-panel-body');
  const footer = $('#detail-panel-footer');

  if(!panel || !overlay || !title || !body) return;

  // 设置标题
  title.textContent = archive.title;

  // 渲染内容（复用原有的详情渲染逻辑）
  body.innerHTML = renderArchiveDetailBody(archive);

  // 设置底部按钮
  const nearest = nearestReminder(archive);
  const main = drawerMainAction(archive, nearest);

  footer.innerHTML = `
    <button class="btn btn-outline btn-sm" data-export-archive="${archive.id}">📄 导出</button>
    <button class="btn btn-primary btn-sm flex-1" ${main.attr}>${esc(main.label)}</button>
  `;

  // 绑定导出按钮
  const exportBtn = footer.querySelector('[data-export-archive]');
  if(exportBtn){
    exportBtn.addEventListener('click', () => {
      exportArchive(archive.id);
    });
  }

  // 显示面板
  panel.classList.add('active');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDetailPanel(){
  const panel = $('#detail-panel');
  const overlay = $('#detail-panel-overlay');

  if(panel) panel.classList.remove('active');
  if(overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}

function renderArchiveDetailBody(a){
  const c = catColor(a.category);
  const nearest = nearestReminder(a);
  const asset = archiveAssetProfile(a);

  return `
    <div class="detail-panel-section">
      <div class="flex gap8 wrap">
        <span class="tag" style="background:${c.bg};color:${c.color}">${c.ico} ${a.category}</span>
        <span class="tag ${riskTag(a.riskLevel).c}">${riskTag(a.riskLevel).t}</span>
        <span class="tag ${statusTag(a.status).c}">${statusTag(a.status).t}</span>
        <span class="tag gray">${a.id}</span>
      </div>
    </div>

    <div class="detail-panel-section">
      <h3>📋 基本信息</h3>
      <div class="summary-grid">
        <div class="summary-card"><span class="summary-k">家庭成员</span><span class="summary-v">${esc(a.familyMember)}</span></div>
        <div class="summary-card"><span class="summary-k">金额或期限</span><span class="summary-v">${esc(a.amountOrTerm)}</span></div>
        <div class="summary-card"><span class="summary-k">记忆位置</span><span class="summary-v">${esc(displayLocation(a))}</span></div>
        <div class="summary-card"><span class="summary-k">隐私等级</span><span class="summary-v">${PRIVACY_TEXT[a.locationPrivacy]}</span></div>
      </div>
    </div>

    <div class="detail-panel-section">
      <h3>💎 资产价值</h3>
      <div class="asset-card-grid">
        <span><b>价值</b>${esc(asset.exposure)}</span>
        <span><b>证据</b>${esc(asset.proof)}</span>
        <span><b>风险</b>${esc(asset.risk)}</span>
        <span><b>服务</b>${esc(asset.service)}</span>
      </div>
    </div>

    ${nearest ? `
    <div class="detail-panel-section">
      <h3>⏰ 提醒事项</h3>
      <div class="reminder-card ${nearest.days <= 7 ? 'urgent' : ''}">
        <div class="reminder-header">
          <span class="reminder-date">${nearest.date}</span>
          <span class="tag ${reminderPriority(nearest.days).c}">${nearest.days}天后</span>
        </div>
        <div class="reminder-action">${esc(nearest.action)}</div>
      </div>
    </div>
    ` : ''}

    <div class="detail-panel-section">
      <h3>📄 识别字段</h3>
      <div class="field-list">
        ${a.fields.map(f => `
          <div class="field-row">
            <span class="field-label">${esc(f.label)}</span>
            <span class="field-value">${esc(f.value)}</span>
            <span class="field-confidence">${Math.round((f.confidence||0)*100)}%</span>
          </div>
        `).join('')}
      </div>
    </div>

    ${a.lowConfidence ? `
    <div class="detail-panel-section">
      <h3>⚠️ 低置信度说明</h3>
      <div class="low-confidence-box">
        <p><strong>模糊原因：</strong>${esc(a.lowConfidence.reason)}</p>
        <p><strong>缺失字段：</strong>${a.lowConfidence.missing.join('、')}</p>
        <p><strong>人工补全：</strong>${esc(a.lowConfidence.manual)}</p>
      </div>
    </div>
    ` : ''}

    <div class="detail-panel-section">
      <h3>📦 证据材料</h3>
      <div class="evidence-list">
        ${a.evidence.map(e => `<span class="evidence-tag">📎 ${esc(e)}</span>`).join('')}
      </div>
    </div>

    <div class="detail-panel-section">
      <h3>🤖 AI 解释</h3>
      <div class="ai-explanation">
        <p><strong>归档理由：</strong>${esc(a.ai.reason)}</p>
        <p><strong>风险判断：</strong>${esc(a.ai.risk)}</p>
        <p><strong>隐私建议：</strong>${esc(a.ai.privacy)}</p>
      </div>
    </div>
  `;
}
