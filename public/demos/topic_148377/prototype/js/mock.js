/**
 * 全民守护·全域寻亲智慧打拐一体化平台 - 模拟数据
 * 包含所有原型系统所需的 Mock 数据
 */

// ==================== 1. 失踪人员档案 ====================
const MISSING_PERSONS = [
  {
    id: 'MP20260701001',
    name: '张子涵',
    age: 5,
    gender: '男',
    type: '低龄儿童',
    status: '已立案',
    photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ZiHan',
    lastLocation: '四川省成都市武侯区人民南路四段',
    missingDate: '2026-06-28',
    description: '身高约110cm，短发，走失时身穿蓝色条纹短袖T恤和深灰色短裤，脚穿白色运动鞋，能说简单普通话和四川方言',
    aiMatchScore: 72,
    features: '左耳后有一颗小黑痣，说话时喜欢咬下嘴唇'
  },
  {
    id: 'MP20260701002',
    name: '李梦瑶',
    age: 7,
    gender: '女',
    type: '低龄儿童',
    status: '处理中',
    photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MengYao',
    lastLocation: '广东省广州市天河区体育西路',
    missingDate: '2026-07-02',
    description: '身高约120cm，扎双马尾，走失时穿粉色连衣裙，背小兔子书包，疑似被陌生女子带走',
    aiMatchScore: 85,
    features: '右手中指有烫伤疤痕，门牙有一颗缺角'
  },
  {
    id: 'MP20260701003',
    name: '王浩然',
    age: 15,
    gender: '男',
    type: '青少年',
    status: '已立案',
    photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=HaoRan',
    lastLocation: '湖南省长沙市岳麓区麓山南路',
    missingDate: '2026-06-15',
    description: '身高约165cm，戴黑框眼镜，离家出走，可能与网友见面，随身携带手机但已关机',
    aiMatchScore: 41,
    features: '左小臂有长约5cm手术疤痕，近视约400度'
  },
  {
    id: 'MP20260701004',
    name: '陈秀兰',
    age: 78,
    gender: '女',
    type: '走失老人',
    status: '已找回',
    photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=XiuLan',
    lastLocation: '江苏省南京市鼓楼区中山北路',
    missingDate: '2026-07-05',
    description: '患有阿尔茨海默症，身高约155cm，灰白短发，走失时穿碎花棉布上衣和黑色布鞋，未携带手机',
    aiMatchScore: 93,
    features: '右手腕戴有红色住院识别手环，口音为安徽合肥方言'
  },
  {
    id: 'MP20260701005',
    name: '赵小蝶',
    age: 3,
    gender: '女',
    type: '低龄儿童',
    status: '待审核',
    photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=XiaoDie',
    lastLocation: '云南省昆明市盘龙区白云路',
    missingDate: '2026-07-10',
    description: '身高约95cm，短发带蝴蝶结发卡，穿黄色卡通连体裤，由奶奶看护时在小区游乐场走失',
    aiMatchScore: 28,
    features: '额头有一小撮白毛（白癜风），说话较晚仅能说单字'
  },
  {
    id: 'MP20260701006',
    name: '刘芳',
    age: 32,
    gender: '女',
    type: '成年女性',
    status: '已立案',
    photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=LiuFang',
    lastLocation: '河南省郑州市二七区德化步行街',
    missingDate: '2026-06-20',
    description: '身高约162cm，长发，智力障碍约相当于8岁儿童水平，外出购物后未归，疑似被诱骗',
    aiMatchScore: 56,
    features: '智力障碍，随身携带写有家人电话的纸条但可能已遗失'
  },
  {
    id: 'MP20260701007',
    name: '孙建国',
    age: 82,
    gender: '男',
    type: '走失老人',
    status: '处理中',
    photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=JianGuo',
    lastLocation: '山东省济南市历下区趵突泉南路',
    missingDate: '2026-07-08',
    description: '患有轻度认知障碍，身高约170cm，花白头发，穿深蓝色中山装，戴老花镜，晨练后未归',
    aiMatchScore: 64,
    features: '左手无名指缺失（旧伤），习惯沿护城河散步'
  },
  {
    id: 'MP20260701008',
    name: '周明轩',
    age: 6,
    gender: '男',
    type: '低龄儿童',
    status: '待审核',
    photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MingXuan',
    lastLocation: '浙江省杭州市余杭区良渚文化村',
    missingDate: '2026-07-12',
    description: '身高约115cm，平头，穿白色POLO衫和牛仔短裤，在社区超市附近走失，监控显示被一中年男子牵走',
    aiMatchScore: 79,
    features: '右脚六趾（已手术留疤），下巴有一处摔伤淡疤'
  },
  {
    id: 'MP20260701009',
    name: '吴婷婷',
    age: 14,
    gender: '女',
    type: '青少年',
    status: '已立案',
    photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=TingTing',
    lastLocation: '福建省厦门市思明区中山路',
    missingDate: '2026-07-01',
    description: '身高约158cm，长发扎马尾，穿校服（白衬衫+深蓝裙子），放学后未回家，手机最后定位在厦门北站',
    aiMatchScore: 38,
    features: '右耳有两个耳洞，书包上挂有星巴克钥匙扣'
  },
  {
    id: 'MP20260701010',
    name: '杨志强',
    age: 45,
    gender: '男',
    type: '成年男性',
    status: '处理中',
    photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ZhiQiang',
    lastLocation: '陕西省西安市雁塔区小寨东路',
    missingDate: '2026-06-25',
    description: '身高约175cm，短发微秃，穿灰色夹克和黑色西裤，精神状态不稳定，家属反映有抑郁倾向',
    aiMatchScore: 22,
    features: '左手虎口有纹身"志"字，说话带浓重陕西方言'
  }
];

// ==================== 2. 预警列表 ====================
const ALERTS = [
  {
    id: 'ALT20260714001',
    type: '摄像头预警',
    level: '紧急',
    personName: '李梦瑶',
    location: '广东省广州市越秀区北京路步行街',
    time: '2026-07-14 09:32:15',
    status: '待处理',
    description: 'AI人脸比对系统在越秀区北京路摄像头CAM-GZ-YX-0237处检测到与失踪儿童李梦瑶面部相似度达94%的目标人员，同行有一名中年女性',
    cameraId: 'CAM-GZ-YX-0237'
  },
  {
    id: 'ALT20260714002',
    type: 'AI比对命中',
    level: '紧急',
    personName: '周明轩',
    location: '浙江省杭州市西湖区龙井路',
    time: '2026-07-14 08:17:42',
    status: '处理中',
    description: '跨省AI人脸比对系统命中，在杭州西湖景区入口摄像头捕获的人脸与周明轩档案照相似度91%，目标由一名中年男性牵引',
    cameraId: 'CAM-HZ-XH-0089'
  },
  {
    id: 'ALT20260713003',
    type: '群众线索',
    level: '高',
    personName: '孙建国',
    location: '山东省济南市历下区黑虎泉西路',
    time: '2026-07-13 19:45:00',
    status: '已处理',
    description: '热心市民张女士报警称在黑虎泉西路看到一名老人与走失的孙建国体貌高度相似，老人独自坐在路边，正在安排附近民警前往确认',
    cameraId: null
  },
  {
    id: 'ALT20260714004',
    type: '摄像头预警',
    level: '高',
    personName: '赵小蝶',
    location: '云南省昆明市官渡区世纪城金源大道',
    time: '2026-07-14 10:05:33',
    status: '待处理',
    description: '智能穿戴设备"小蝶守护手环"发出越区预警，设备定位突然从盘龙区移动至官渡区且移动速度异常（约60km/h），疑似乘坐机动车',
    cameraId: 'CAM-KM-GD-0156'
  },
  {
    id: 'ALT20260713005',
    type: 'AI比对命中',
    level: '中',
    personName: '吴婷婷',
    location: '福建省泉州市丰泽区刺桐路',
    time: '2026-07-13 14:22:08',
    status: '处理中',
    description: 'AI跨区域比对系统在泉州刺桐路一网吧监控画面中检测到与吴婷婷相似度76%的目标，已通知厦门、泉州两地警方联合排查',
    cameraId: 'CAM-QZ-FZ-0412'
  },
  {
    id: 'ALT20260714006',
    type: '群众线索',
    level: '低',
    personName: '王浩然',
    location: '湖南省湘潭市雨湖区建设北路',
    time: '2026-07-14 07:30:00',
    status: '待处理',
    description: '一出租车司机反映搭载过一名与王浩然相似的少年，从长沙出发至湘潭，该信息尚待进一步核实',
    cameraId: null
  },
  {
    id: 'ALT20260712007',
    type: '摄像头预警',
    level: '中',
    personName: '刘芳',
    location: '河南省洛阳市西工区中州中路',
    time: '2026-07-12 16:48:29',
    status: '已处理',
    description: '郑州-洛阳跨市摄像头联动预警，在洛阳中州中路发现疑似刘芳身影，经民警现场确认为误报（路人相似）',
    cameraId: 'CAM-LY-XG-0278'
  }
];

// ==================== 3. 线索列表 ====================
const CLUES = [
  {
    id: 'CLUE20260714001',
    caseId: 'MP20260701002',
    reporter: '实名-张丽华',
    content: '7月3日下午在广州南站B2进站口看到一个小女孩很像寻人启事上的李梦瑶，身边有个穿红色外套的女人拉着她，女孩好像在哭',
    location: '广东省广州市番禺区广州南站B2进站口',
    time: '2026-07-03 15:20:00',
    status: '已核实',
    reward: 500
  },
  {
    id: 'CLUE20260714002',
    caseId: 'MP20260701003',
    reporter: '匿名',
    content: '在长沙岳麓区一网吧见过一个戴黑框眼镜的男孩，看起来15岁左右，在网上和陌生人聊天，待了大概两小时后离开',
    location: '湖南省长沙市岳麓区阜埠河路网鱼网咖',
    time: '2026-07-10 22:05:00',
    status: '待核实',
    reward: 200
  },
  {
    id: 'CLUE20260713003',
    caseId: 'MP20260701004',
    reporter: '实名-李国强',
    content: '在南京鼓楼医院附近看到一位老人很像陈秀兰，她独自一人在医院门口徘徊，看起来很迷茫，我给了她一杯水并报了警',
    location: '江苏省南京市鼓楼区中山路321号鼓楼医院门口',
    time: '2026-07-05 11:30:00',
    status: '已核实',
    reward: 300
  },
  {
    id: 'CLUE20260714004',
    caseId: 'MP20260701008',
    reporter: '实名-王德明',
    content: '我是良渚文化村小区保安，7月12日下午在小区北门监控里看到一个不认识的中年男子牵着一个小男孩出门，小男孩穿白色POLO衫，和您发的寻人信息很像',
    location: '浙江省杭州市余杭区良渚文化村北门',
    time: '2026-07-12 14:38:00',
    status: '已核实',
    reward: 800
  },
  {
    id: 'CLUE20260714005',
    caseId: 'MP20260701006',
    reporter: '匿名',
    content: '在郑州二七广场看到一个女人很像寻人启事上的刘芳，她跟着一个摆摊的中年男人，好像不太清醒的样子',
    location: '河南省郑州市二七区二七广场',
    time: '2026-07-08 09:15:00',
    status: '待核实',
    reward: 200
  },
  {
    id: 'CLUE20260714006',
    caseId: 'MP20260701001',
    reporter: '实名-陈卫东',
    content: '在成都武侯区火车南站附近的快餐店看到一个男孩很像张子涵，但穿的衣服不一样了，穿的是灰色卫衣，身边没有大人',
    location: '四川省成都市武侯区火车南站肯德基',
    time: '2026-07-09 12:45:00',
    status: '无效',
    reward: 0
  }
];

// ==================== 4. 志愿者统计 ====================
const VOLUNTEERS = {
  total: 128756,
  activeToday: 8432,
  totalClues: 34521,
  totalRewards: 1867500
};

// ==================== 5. 智能穿戴设备 ====================
const DEVICES = [
  {
    id: 'DEV-SH-001',
    deviceName: '小蝶守护手环',
    brand: '守护星',
    childName: '赵小蝶',
    status: '在线',
    lastLocation: '云南省昆明市官渡区世纪城金源大道',
    batteryLevel: 67,
    lastUpdate: '2026-07-14 10:05:33'
  },
  {
    id: 'DEV-SH-002',
    deviceName: '子涵定位手表',
    brand: '小天才',
    childName: '张子涵',
    status: '离线',
    lastLocation: '四川省成都市武侯区火车南站',
    batteryLevel: 12,
    lastUpdate: '2026-07-09 12:30:00'
  },
  {
    id: 'DEV-SH-003',
    deviceName: '梦瑶安全手环',
    brand: '守护星',
    childName: '李梦瑶',
    status: '在线',
    lastLocation: '广东省广州市越秀区北京路步行街',
    batteryLevel: 85,
    lastUpdate: '2026-07-14 09:32:15'
  },
  {
    id: 'DEV-SH-004',
    deviceName: '建国防走失手环',
    brand: '安护通',
    childName: '孙建国',
    status: '在线',
    lastLocation: '山东省济南市历下区黑虎泉西路',
    batteryLevel: 43,
    lastUpdate: '2026-07-14 06:20:00'
  }
];

// ==================== 6. 系统统计数据 ====================
const STATS = {
  totalMissing: 2347,
  foundThisMonth: 186,
  cameraOnline: 45230,
  volunteerCount: 128756,
  pendingAlerts: 23,
  aiMatchRate: 78.5
};

// ==================== 7. 民警用户列表 ====================
const POLICE_USERS = [
  {
    id: 'PO-001',
    name: '刘伟',
    rank: '一级警督',
    department: '广州市公安局越秀分局刑侦大队',
    status: '在线'
  },
  {
    id: 'PO-002',
    name: '马超',
    rank: '二级警督',
    department: '杭州市公安局西湖分局打拐专案组',
    status: '在线'
  },
  {
    id: 'PO-003',
    name: '何军',
    rank: '三级警督',
    department: '成都市公安局武侯分局社区警务室',
    status: '离线'
  },
  {
    id: 'PO-004',
    name: '周敏',
    rank: '二级警督',
    department: '济南市公安局历下分局指挥中心',
    status: '在线'
  }
];

// ==================== 8. 消息通知列表 ====================
const NOTIFICATIONS = [
  {
    id: 'NTF-001',
    type: '预警通知',
    title: '紧急：AI比对命中李梦瑶',
    content: '越秀区北京路摄像头检测到与失踪儿童李梦瑶面部相似度94%的目标，请立即查看并安排处置',
    time: '2026-07-14 09:32:15',
    read: false
  },
  {
    id: 'NTF-002',
    type: '案件更新',
    title: '陈秀兰已被成功找回',
    content: '走失老人陈秀兰已于7月5日12:15在南京鼓楼医院门口被热心市民发现并护送至派出所，家属已接到老人',
    time: '2026-07-05 12:30:00',
    read: true
  },
  {
    id: 'NTF-003',
    type: '系统通知',
    title: '智能穿戴设备越区预警',
    content: '赵小蝶的守护手环定位异常，设备从盘龙区快速移动至官渡区，速度约60km/h，疑似被带离，请关注',
    time: '2026-07-14 10:05:33',
    read: false
  },
  {
    id: 'NTF-004',
    type: '预警通知',
    title: '跨省AI比对命中周明轩',
    content: '杭州西湖景区入口摄像头捕获人脸与周明轩档案照相似度91%，目标由一名中年男性牵引，已通知属地警方',
    time: '2026-07-14 08:17:42',
    read: false
  },
  {
    id: 'NTF-005',
    type: '系统通知',
    title: '线索核实结果通知',
    content: '您提交的线索CLUE20260714001已核实通过，线索提供者张丽华获得500积分奖励，感谢您的关注',
    time: '2026-07-14 08:00:00',
    read: true
  },
  {
    id: 'NTF-006',
    type: '案件更新',
    title: '王浩然案件新增线索',
    content: '有出租车司机反映在长沙至湘潭的路线上搭载过疑似王浩然的少年，线索正在核实中',
    time: '2026-07-14 07:30:00',
    read: false
  }
];

// ==================== 9. 安全区域 ====================
const SAFE_ZONES = [
  {
    id: 'SZ-001',
    name: '良渚文化村安全区',
    address: '浙江省杭州市余杭区良渚文化村',
    radius: 1500,
    childName: '周明轩'
  },
  {
    id: 'SZ-002',
    name: '世纪城金源安全区',
    address: '云南省昆明市官渡区世纪城金源大道',
    radius: 800,
    childName: '赵小蝶'
  },
  {
    id: 'SZ-003',
    name: '武侯区火车南站安全区',
    address: '四川省成都市武侯区人民南路四段',
    radius: 1000,
    childName: '张子涵'
  }
];

// ==================== 10. 案件流程步骤 ====================
const CASE_FLOWS = {
  childTrafficking: [
    { step: 1, title: '失踪报告', desc: '家属/学校/社区报案，系统自动创建失踪人员档案', status: 'completed' },
    { step: 2, title: 'AI快速比对', desc: '系统自动启动AI人脸比对，在全国摄像头网络中搜索匹配目标', status: 'completed' },
    { step: 3, title: '黄金72小时预警', desc: '自动触发紧急预警，推送至周边民警、志愿者及智能摄像头', status: 'completed' },
    { step: 4, title: '线索收集与核实', desc: '群众线索、摄像头预警、穿戴设备数据汇聚，AI辅助研判', status: 'in_progress' },
    { step: 5, title: '跨区域协查', desc: '跨省/跨市警方协查联动，人贩子出行轨迹追踪', status: 'pending' },
    { step: 6, title: '定位锁定', desc: '综合AI比对、设备定位、群众线索精确定位可疑目标', status: 'pending' },
    { step: 7, title: '解救行动', desc: '警方组织解救行动，优先保障儿童人身安全', status: 'pending' },
    { step: 8, title: '身份确认与交接', desc: 'DNA比对确认身份，完成家属交接，启动心理援助', status: 'pending' }
  ],
  elderlyLost: [
    { step: 1, title: '走失报案', desc: '家属报案，登记老人基本信息、体貌特征及认知状况', status: 'completed' },
    { step: 2, title: '常走路线分析', desc: 'AI分析老人日常活动轨迹和常去地点，预测可能走失范围', status: 'completed' },
    { step: 3, title: '周边推送寻人', desc: '向走失地点周边志愿者、商户、社区网格员推送寻人信息', status: 'in_progress' },
    { step: 4, title: '监控追踪', desc: '调取周边摄像头录像，AI识别老人行进方向和路线', status: 'pending' },
    { step: 5, title: '智能设备定位', desc: '如佩戴智能手环，实时追踪设备位置和移动轨迹', status: 'pending' },
    { step: 6, title: '找到并护送', desc: '确认老人位置，安排民警或志愿者护送至派出所/家属处', status: 'pending' }
  ],
  suspectTracking: [
    { step: 1, title: '嫌疑人识别', desc: '通过监控画面、目击证人描述，AI辅助生成嫌疑人特征画像', status: 'completed' },
    { step: 2, title: '轨迹回溯', desc: '调取事发前后周边所有监控，AI还原嫌疑人行动轨迹', status: 'completed' },
    { step: 3, title: '出行信息追踪', desc: '联动交通系统，追踪嫌疑人火车/飞机/长途车出行记录', status: 'in_progress' },
    { step: 4, title: '关系网分析', desc: 'AI分析嫌疑人社交网络、通讯记录，识别同伙及销赃渠道', status: 'pending' },
    { step: 5, title: '跨省缉捕', desc: '锁定嫌疑人藏匿地点，跨省协调部署抓捕行动', status: 'pending' },
    { step: 6, title: '审讯与解救', desc: '审讯获取被拐儿童下落，组织解救并追回更多被拐人员', status: 'pending' }
  ],
  deviceTracking: [
    { step: 1, title: '设备越区预警', desc: '智能穿戴设备检测到异常移动或越出安全区域，自动触发预警', status: 'completed' },
    { step: 2, title: '实时位置追踪', desc: '持续获取设备GPS/BDS定位，实时更新移动轨迹', status: 'completed' },
    { step: 3, title: '轨迹异常研判', desc: 'AI分析移动速度、路线合理性，判断是否被带离或正常移动', status: 'in_progress' },
    { step: 4, title: '联动摄像头确认', desc: '根据设备位置调取附近摄像头，AI比对确认佩戴者身份', status: 'pending' },
    { step: 5, title: '紧急响应', desc: '确认异常后紧急通知家属和辖区民警，启动应急处置', status: 'pending' },
    { step: 6, title: '持续跟踪至安全', desc: '持续追踪直至儿童安全回到家属身边，全程记录轨迹作为证据', status: 'pending' }
  ]
};

// ==================== 统一导出 ====================
window.MockData = {
  MISSING_PERSONS,
  ALERTS,
  CLUES,
  VOLUNTEERS,
  DEVICES,
  STATS,
  POLICE_USERS,
  NOTIFICATIONS,
  SAFE_ZONES,
  CASE_FLOWS
};
