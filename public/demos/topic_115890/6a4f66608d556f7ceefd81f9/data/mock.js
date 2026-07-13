const mockData = {
  baby: {
    id: 'baby_001',
    name: '小糯米',
    birthday: '2025-07-09',
    gender: 'girl',
    age: '12个月',
    currentWeight: 9.2,
    currentHeight: 75
  },
  feedRecords: [
    { id: 'feed_001', type: 'breast', side: 'left', duration: 15, amount: null, time: '2026-07-09 08:00', user: '妈妈' },
    { id: 'feed_002', type: 'bottle', side: null, duration: null, amount: 150, time: '2026-07-09 12:30', user: '奶奶' },
    { id: 'feed_003', type: 'breast', side: 'right', duration: 12, amount: null, time: '2026-07-09 16:00', user: '妈妈' },
    { id: 'feed_004', type: 'bottle', side: null, duration: null, amount: 180, time: '2026-07-09 20:00', user: '爸爸' },
    { id: 'feed_005', type: 'breast', side: 'left', duration: 10, amount: null, time: '2026-07-08 07:30', user: '妈妈' },
    { id: 'feed_006', type: 'bottle', side: null, duration: null, amount: 160, time: '2026-07-08 11:00', user: '奶奶' },
    { id: 'feed_007', type: 'breast', side: 'right', duration: 18, amount: null, time: '2026-07-08 15:30', user: '妈妈' },
    { id: 'feed_008', type: 'bottle', side: null, duration: null, amount: 170, time: '2026-07-08 19:30', user: '爸爸' },
  ],
  supplementRecords: [
    { id: 'supp_001', name: '维生素D', dose: '400IU', time: '2026-07-09 09:00', user: '妈妈' },
    { id: 'supp_002', name: '铁剂', dose: '5ml', time: '2026-07-09 17:00', user: '奶奶' },
    { id: 'supp_003', name: '维生素D', dose: '400IU', time: '2026-07-08 09:30', user: '妈妈' },
  ],
  excretionRecords: [
    { id: 'ex_001', type: 'poop', color: 'yellow', consistency: 'soft', urineCount: 4, time: '2026-07-09 10:00', user: '妈妈' },
    { id: 'ex_002', type: 'poop', color: 'yellow', consistency: 'normal', urineCount: 3, time: '2026-07-09 15:30', user: '奶奶' },
    { id: 'ex_003', type: 'urine', color: null, consistency: null, urineCount: 2, time: '2026-07-09 18:00', user: '爸爸' },
    { id: 'ex_004', type: 'poop', color: 'yellow', consistency: 'soft', urineCount: 5, time: '2026-07-08 08:30', user: '妈妈' },
  ],
  sleepRecords: [
    { id: 'sleep_001', startTime: '2026-07-09 14:00', endTime: '2026-07-09 15:30', quality: 'good', duration: 90, user: '妈妈' },
    { id: 'sleep_002', startTime: '2026-07-09 21:00', endTime: '2026-07-10 05:30', quality: 'normal', duration: 510, user: '爸爸' },
    { id: 'sleep_003', startTime: '2026-07-08 13:30', endTime: '2026-07-08 15:00', quality: 'good', duration: 90, user: '奶奶' },
    { id: 'sleep_004', startTime: '2026-07-08 20:30', endTime: '2026-07-09 06:00', quality: 'poor', duration: 510, user: '妈妈' },
  ],
  growthRecords: [
    { id: 'growth_001', date: '2026-07-09', height: 75, weight: 9.2, headCircumference: 46 },
    { id: 'growth_002', date: '2026-06-09', height: 73, weight: 8.8, headCircumference: 45 },
    { id: 'growth_003', date: '2026-05-09', height: 71, weight: 8.3, headCircumference: 44 },
    { id: 'growth_004', date: '2026-04-09', height: 69, weight: 7.8, headCircumference: 43 },
    { id: 'growth_005', date: '2026-03-09', height: 67, weight: 7.3, headCircumference: 42 },
    { id: 'growth_006', date: '2026-02-09', height: 65, weight: 6.8, headCircumference: 41 },
  ],
  temperatureRecords: [
    { id: 'temp_001', value: 36.5, time: '2026-07-09 07:00' },
    { id: 'temp_002', value: 36.8, time: '2026-07-09 12:00' },
    { id: 'temp_003', value: 36.6, time: '2026-07-09 18:00' },
  ],
  medicationRecords: [
    { id: 'med_001', name: '退烧药', dose: '5ml', time: '2026-07-05 14:00', note: '体温38.5度' },
  ],
  milestoneRecords: [
    { id: 'milestone_001', name: '翻身', date: '2026-02-15' },
    { id: 'milestone_002', name: '独坐', date: '2026-04-20' },
    { id: 'milestone_003', name: '长牙', date: '2026-05-10' },
    { id: 'milestone_004', name: '爬行', date: '2026-06-01' },
    { id: 'milestone_005', name: '站立', date: '2026-07-01' },
  ],
  communityPosts: [
    { id: 'post_001', type: 'community', monthGroup: '12个月', tags: ['亲测有效', '辅食'], content: '分享一个超好用的辅食食谱！南瓜小米粥，宝宝超爱吃，营养又好消化。做法很简单：南瓜去皮切块蒸熟，小米淘洗干净煮20分钟，加入南瓜泥搅拌均匀即可。', author: '甜甜妈', avatar: 'person', time: '2026-07-09 09:00', likes: 128, likedByMe: false, commentList: [
      { id: 'c001', author: '果果妈', avatar: 'person', content: '谢谢分享！我家宝宝也爱吃南瓜', time: '2026-07-09 09:30' },
      { id: 'c002', author: '安安妈', avatar: 'person', content: '请问小米要提前泡吗？', time: '2026-07-09 10:00' },
      { id: 'c003', author: '甜甜妈', avatar: 'person', content: '不用泡，直接煮就好，煮出来很软糯', time: '2026-07-09 10:15' }
    ]},
    { id: 'post_002', type: 'community', monthGroup: '12个月', tags: ['睡眠', '亲测有效'], content: '经过一个月的调整，终于把宝宝的夜奶戒掉了！分享一下我的方法：首先逐渐减少夜奶次数，从3次减到2次再到1次，每次减少奶量。然后建立固定的睡前仪式，洗澡、讲故事、喂奶、睡觉。最重要的是家人要统一战线！', author: '星星妈', avatar: 'person', time: '2026-07-09 10:30', likes: 256, likedByMe: false, commentList: [
      { id: 'c004', author: '月月妈', avatar: 'person', content: '太厉害了！我也在戒夜奶，快坚持不住了', time: '2026-07-09 11:00' },
      { id: 'c005', author: '星星妈', avatar: 'person', content: '加油！坚持一周就有效果了', time: '2026-07-09 11:20' }
    ]},
    { id: 'post_003', type: 'community', monthGroup: '11个月', tags: ['出牙', '护理'], content: '宝宝出牙期真的太难熬了！牙龈红肿、口水多、脾气暴躁。我试了很多方法，发现牙胶和磨牙饼干最有效，还有冷敷牙龈也能缓解不适。', author: '乐乐妈', avatar: 'person', time: '2026-07-09 11:00', likes: 89, likedByMe: false, commentList: [
      { id: 'c006', author: '轩轩妈', avatar: 'person', content: '牙胶有推荐的牌子吗？', time: '2026-07-09 11:30' }
    ]},
    { id: 'post_004', type: 'community', monthGroup: '13个月', tags: ['走路', '学步'], content: '宝宝13个月了还不会走路，有点着急。去医院检查了说没问题，每个宝宝发育节奏不一样。有没有同款宝宝？求安慰！', author: '豆豆妈', avatar: 'person', time: '2026-07-09 14:00', likes: 67, likedByMe: false, commentList: [
      { id: 'c007', author: '萌萌妈', avatar: 'person', content: '我们家14个月才会走，现在跑得飞快！别担心', time: '2026-07-09 14:30' },
      { id: 'c008', author: '豆豆妈', avatar: 'person', content: '谢谢安慰，心里好受多了', time: '2026-07-09 14:45' }
    ]},
    { id: 'post_005', type: 'treehole', content: '今天崩溃了...宝宝从凌晨2点醒到5点，一直哭闹不止。我一个人抱着他在房间里走来走去，眼泪止不住地流。老公睡得像猪一样，婆婆说明天还要早起买菜。真的好累，不知道还能坚持多久...', author: '匿名', avatar: 'user-secret', time: '2026-07-09 05:30', likes: 234, likedByMe: false, commentList: [
      { id: 'c009', author: '匿名', avatar: 'user-secret', content: '抱抱你，我也经历过，会好起来的', time: '2026-07-09 06:00' },
      { id: 'c010', author: '匿名', avatar: 'user-secret', content: '找个机会让自己休息一下，哪怕只有半小时', time: '2026-07-09 06:30' },
      { id: 'c011', author: '匿名', avatar: 'user-secret', content: '你已经很棒了，别给自己太大压力', time: '2026-07-09 07:00' }
    ]},
    { id: 'post_006', type: 'treehole', content: '昨天和老公吵架了，就因为我让他夜里起来换一次尿布。他说他上班累，我带孩子轻松。呵呵，轻松？从宝宝出生到现在，我没睡过一个整觉，没吃过一顿安稳饭，身材走样、满脸痘痘，他居然说我轻松！', author: '匿名', avatar: 'user-secret', time: '2026-07-09 08:00', likes: 189, likedByMe: false, commentList: [
      { id: 'c012', author: '匿名', avatar: 'user-secret', content: '同款老公，已经不想说了', time: '2026-07-09 08:30' },
      { id: 'c013', author: '匿名', avatar: 'user-secret', content: '让他体验一个人带娃一天，他就知道了', time: '2026-07-09 09:00' }
    ]},
    { id: 'post_007', type: 'treehole', content: '宝宝今天突然发烧了，38.5度。我一个人带他去医院，排队、挂号、抽血、拿药，跑上跑下。看着宝宝哭，我也跟着哭。真的好怕宝宝生病，宁愿生病的是我...', author: '匿名', avatar: 'user-secret', time: '2026-07-09 12:00', likes: 156, likedByMe: false, commentList: [
      { id: 'c014', author: '匿名', avatar: 'user-secret', content: '宝宝会好起来的，你也要保重身体', time: '2026-07-09 12:30' }
    ]},
    { id: 'post_008', type: 'community', monthGroup: '12个月', tags: ['亲测有效', '湿疹'], content: '宝宝湿疹终于好了！试了无数种方法，最后发现保湿是关键。每天早晚厚涂保湿霜，配合医生开的弱效激素药膏，一周就好转了。提醒各位妈妈，湿疹不能捂，要保持皮肤干爽！', author: '糖糖妈', avatar: 'person', time: '2026-07-09 16:00', likes: 198, likedByMe: false, commentList: [
      { id: 'c015', author: '米米妈', avatar: 'person', content: '请问用的什么保湿霜？', time: '2026-07-09 16:30' },
      { id: 'c016', author: '糖糖妈', avatar: 'person', content: '丝塔芙大白罐，厚涂！', time: '2026-07-09 16:45' }
    ]},
  ],
  family: {
    id: 'family_001',
    name: '幸福小家',
    members: [
      { id: 'user_001', name: '妈妈', role: 'admin', avatar: 'fa-person', roleType: '妈妈' },
      { id: 'user_002', name: '爸爸', role: 'member', avatar: 'fa-person', roleType: '爸爸' },
      { id: 'user_003', name: '奶奶', role: 'member', avatar: 'fa-person', roleType: '奶奶' },
    ],
    activityLog: [
      { user: '妈妈', action: '记录喂奶(母乳左侧15分钟)', time: '2026-07-09 08:00' },
      { user: '奶奶', action: '记录喂奶(瓶喂150ml)', time: '2026-07-09 12:30' },
      { user: '奶奶', action: '记录大便(黄色软便)', time: '2026-07-09 15:30' },
      { user: '妈妈', action: '记录喂奶(母乳右侧12分钟)', time: '2026-07-09 16:00' },
      { user: '爸爸', action: '记录喂奶(瓶喂180ml)', time: '2026-07-09 20:00' },
    ]
  },
  momRecords: {
    mood: [
      { id: 'mood_001', date: '2026-07-09', value: 7, note: '今天心情不错' },
      { id: 'mood_002', date: '2026-07-08', value: 5, note: '有点累' },
      { id: 'mood_003', date: '2026-07-07', value: 4, note: '情绪低落' },
      { id: 'mood_004', date: '2026-07-06', value: 6, note: '还好' },
      { id: 'mood_005', date: '2026-07-05', value: 8, note: '开心' },
    ],
    lochia: [
      { id: 'loch_001', date: '2026-07-09', amount: '少量', color: '白色' },
      { id: 'loch_002', date: '2026-07-08', amount: '少量', color: '白色' },
    ],
    waterIntake: [
      { id: 'water_001', date: '2026-07-09', amount: 800 },
      { id: 'water_002', date: '2026-07-08', amount: 600 },
      { id: 'water_003', date: '2026-07-07', amount: 900 },
    ],
    pelvicFloor: [
      { id: 'pelvic_001', date: '2026-07-09', sets: 3, reps: 15 },
      { id: 'pelvic_002', date: '2026-07-07', sets: 2, reps: 15 },
      { id: 'pelvic_003', date: '2026-07-05', sets: 3, reps: 15 },
    ]
  },
  reminders: [
    { id: 'rem_001', type: 'feed', message: '该喂奶了', time: '2026-07-10 06:00', status: 'pending' },
    { id: 'rem_002', type: 'supplement', message: '别忘了吃维生素D', time: '2026-07-10 09:00', status: 'pending' },
    { id: 'rem_003', type: 'vaccine', message: '还有3天接种水痘疫苗', time: '2026-07-12', status: 'pending' },
    { id: 'rem_004', type: 'excretion', message: '宝宝超过3天没拉臭，请留意', time: '2026-07-10', status: 'warning' },
    { id: 'rem_005', type: 'childFund', message: '少儿互助金缴纳月即将到期', time: '2026-09-01', status: 'pending' },
  ],
  vaccines: [
    { id: 'vacc_001', name: '乙肝疫苗', dose: '第1针', dueDate: '2025-07-09', status: 'completed', monthGroup: 'birth', type: 'planned', completedDate: '2025-07-09', lotNumber: '202506001', manufacturer: '北京生物', site: '右上臂', doctor: '李医生' },
    { id: 'vacc_002', name: '卡介苗', dose: '第1针', dueDate: '2025-07-09', status: 'completed', monthGroup: 'birth', type: 'planned', completedDate: '2025-07-09', lotNumber: '202506011', manufacturer: '上海生物', site: '左上臂', doctor: '李医生' },
    { id: 'vacc_003', name: '乙肝疫苗', dose: '第2针', dueDate: '2025-08-09', status: 'completed', monthGroup: '1m', type: 'planned', completedDate: '2025-08-10', lotNumber: '202507002', manufacturer: '北京生物', site: '右上臂', doctor: '王医生' },
    { id: 'vacc_004', name: '脊灰疫苗', dose: '第1针', dueDate: '2025-09-09', status: 'completed', monthGroup: '2m', type: 'planned', completedDate: '2025-09-09', lotNumber: '202508015', manufacturer: '北京科兴', site: '口服', doctor: '王医生' },
    { id: 'vacc_005', name: '脊灰疫苗', dose: '第2针', dueDate: '2025-10-09', status: 'completed', monthGroup: '3m', type: 'planned', completedDate: '2025-10-09', lotNumber: '202509012', manufacturer: '北京科兴', site: '口服', doctor: '张医生' },
    { id: 'vacc_006', name: '百白破疫苗', dose: '第1针', dueDate: '2025-10-09', status: 'completed', monthGroup: '3m', type: 'planned', completedDate: '2025-10-09', lotNumber: '202509022', manufacturer: '武汉生物', site: '左大腿', doctor: '张医生' },
    { id: 'vacc_007', name: '脊灰疫苗', dose: '第3针', dueDate: '2025-11-09', status: 'completed', monthGroup: '4m', type: 'planned', completedDate: '2025-11-09', lotNumber: '202510018', manufacturer: '北京科兴', site: '口服', doctor: '李医生' },
    { id: 'vacc_008', name: '百白破疫苗', dose: '第2针', dueDate: '2025-11-09', status: 'completed', monthGroup: '4m', type: 'planned', completedDate: '2025-11-09', lotNumber: '202510028', manufacturer: '武汉生物', site: '右大腿', doctor: '李医生' },
    { id: 'vacc_009', name: '百白破疫苗', dose: '第3针', dueDate: '2025-12-09', status: 'completed', monthGroup: '5m', type: 'planned', completedDate: '2025-12-10', lotNumber: '202511035', manufacturer: '武汉生物', site: '左大腿', doctor: '王医生' },
    { id: 'vacc_010', name: '乙肝疫苗', dose: '第3针', dueDate: '2026-01-09', status: 'completed', monthGroup: '6m', type: 'planned', completedDate: '2026-01-09', lotNumber: '202512042', manufacturer: '北京生物', site: '右上臂', doctor: '张医生' },
    { id: 'vacc_011', name: '脊灰疫苗', dose: '第4针', dueDate: '2026-01-09', status: 'completed', monthGroup: '6m', type: 'planned', completedDate: '2026-01-09', lotNumber: '202512055', manufacturer: '北京科兴', site: '口服', doctor: '张医生' },
    { id: 'vacc_012', name: '麻腮风疫苗', dose: '第1针', dueDate: '2026-03-09', status: 'completed', monthGroup: '8m', type: 'planned', completedDate: '2026-03-10', lotNumber: '202602041', manufacturer: '上海生物', site: '左上臂', doctor: '李医生' },
    { id: 'vacc_013', name: '乙脑疫苗', dose: '第1针', dueDate: '2026-04-09', status: 'completed', monthGroup: '9m', type: 'planned', completedDate: '2026-04-09', lotNumber: '202603055', manufacturer: '北京生物', site: '右上臂', doctor: '王医生' },
    { id: 'vacc_014', name: '手足口病疫苗', dose: '第1针', dueDate: '2026-07-09', status: 'pending', monthGroup: '12m', type: 'planned', lotNumber: null, manufacturer: null, site: null, doctor: null },
    { id: 'vacc_015', name: '水痘疫苗', dose: '第1针', dueDate: '2026-07-15', status: 'pending', monthGroup: '12m', type: 'planned', lotNumber: null, manufacturer: null, site: null, doctor: null },
    { id: 'vacc_016', name: '乙脑疫苗', dose: '第2针', dueDate: '2026-07-20', status: 'pending', monthGroup: '12m', type: 'planned', lotNumber: null, manufacturer: null, site: null, doctor: null },
    { id: 'vacc_017', name: '百白破疫苗', dose: '第4针', dueDate: '2027-01-09', status: 'pending', monthGroup: '18m', type: 'planned', lotNumber: null, manufacturer: null, site: null, doctor: null },
    { id: 'vacc_018', name: '麻腮风疫苗', dose: '第2针', dueDate: '2027-01-09', status: 'pending', monthGroup: '18m', type: 'planned', lotNumber: null, manufacturer: null, site: null, doctor: null },
    { id: 'vacc_019', name: '甲肝疫苗', dose: '第1针', dueDate: '2027-07-09', status: 'pending', monthGroup: '2y', type: 'planned', lotNumber: null, manufacturer: null, site: null, doctor: null },
    { id: 'vacc_020', name: '脊灰疫苗', dose: '第5针', dueDate: '2029-07-09', status: 'pending', monthGroup: '4y', type: 'planned', lotNumber: null, manufacturer: null, site: null, doctor: null },
    { id: 'vacc_021', name: '白破疫苗', dose: '第1针', dueDate: '2031-07-09', status: 'pending', monthGroup: '6y', type: 'planned', lotNumber: null, manufacturer: null, site: null, doctor: null },
    { id: 'vacc_022', name: '麻腮风疫苗', dose: '第3针', dueDate: '2031-07-09', status: 'pending', monthGroup: '6y', type: 'planned', lotNumber: null, manufacturer: null, site: null, doctor: null },
    { id: 'vacc_023', name: '流感疫苗', dose: '第1针', dueDate: '2026-09-01', status: 'pending', monthGroup: 'custom', type: 'custom', lotNumber: null, manufacturer: null, site: null, doctor: null },
  ],
  aiAnalysis: {
    weightTrend: [
      { date: '2026-02', value: 6.8 },
      { date: '2026-03', value: 7.3 },
      { date: '2026-04', value: 7.8 },
      { date: '2026-05', value: 8.3 },
      { date: '2026-06', value: 8.8 },
      { date: '2026-07', value: 9.2 },
    ],
    heightTrend: [
      { date: '2026-02', value: 65 },
      { date: '2026-03', value: 67 },
      { date: '2026-04', value: 69 },
      { date: '2026-05', value: 71 },
      { date: '2026-06', value: 73 },
      { date: '2026-07', value: 75 },
    ],
    sleepTrend: [
      { date: '2026-07-03', value: 480 },
      { date: '2026-07-04', value: 500 },
      { date: '2026-07-05', value: 450 },
      { date: '2026-07-06', value: 520 },
      { date: '2026-07-07', value: 490 },
      { date: '2026-07-08', value: 510 },
      { date: '2026-07-09', value: 600 },
    ],
    feedTrend: [
      { date: '2026-07-03', value: 620 },
      { date: '2026-07-04', value: 650 },
      { date: '2026-07-05', value: 600 },
      { date: '2026-07-06', value: 680 },
      { date: '2026-07-07', value: 640 },
      { date: '2026-07-08', value: 660 },
      { date: '2026-07-09', value: 680 },
    ],
    insights: [
      { type: 'normal', title: '生长发育良好', content: '宝宝的体重和身高增长曲线符合WHO标准，处于正常范围内。' },
      { type: 'warning', title: '夜醒增多', content: '最近一周夜醒次数有所增加，可能与12月龄猛长期有关。建议增加白天活动量，睡前适当增加奶量。' },
      { type: 'normal', title: '睡眠时长充足', content: '宝宝日均睡眠时长约10小时，符合12月龄宝宝的睡眠需求。' },
      { type: 'info', title: '奶量稳定', content: '近一周奶量稳定在650ml左右，建议逐渐增加辅食种类和量。' },
    ]
  }
};

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadData(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

function initMockData() {
  if (!loadData('baby')) saveData('baby', mockData.baby);
  if (!loadData('feedRecords')) saveData('feedRecords', mockData.feedRecords);
  if (!loadData('supplementRecords')) saveData('supplementRecords', mockData.supplementRecords);
  if (!loadData('excretionRecords')) saveData('excretionRecords', mockData.excretionRecords);
  if (!loadData('sleepRecords')) saveData('sleepRecords', mockData.sleepRecords);
  if (!loadData('growthRecords')) saveData('growthRecords', mockData.growthRecords);
  if (!loadData('temperatureRecords')) saveData('temperatureRecords', mockData.temperatureRecords);
  if (!loadData('medicationRecords')) saveData('medicationRecords', mockData.medicationRecords);
  if (!loadData('milestoneRecords')) saveData('milestoneRecords', mockData.milestoneRecords);
  if (!loadData('communityPosts')) saveData('communityPosts', mockData.communityPosts);
  if (!loadData('family')) saveData('family', mockData.family);
  if (!loadData('momRecords')) saveData('momRecords', mockData.momRecords);
  if (!loadData('reminders')) saveData('reminders', mockData.reminders);
  if (!loadData('vaccines')) saveData('vaccines', mockData.vaccines);
  if (!loadData('aiAnalysis')) saveData('aiAnalysis', mockData.aiAnalysis);
}

initMockData();