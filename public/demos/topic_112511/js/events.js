// 事件配置数据
const EVENTS = {
  // === 工作类事件 ===
  work_normal: {
    id: 'work_normal',
    name: '正常上班',
    category: 'work',
    description: '认真工作8小时，获得日薪',
    durationMinutes: 480,
    successRate: 0.95,
    effects: { goldDelta: 200, healthDelta: -5, energyDelta: -35, abilityDelta: 1 },
    prerequisites: { minHealth: 20, minEnergy: 30 },
    message: '你完成了今天的工作，获得了日薪。'
  },
  work_overtime: {
    id: 'work_overtime',
    name: '加班',
    category: 'work',
    description: '留下来加班，能获得额外收入但消耗大量精力',
    durationMinutes: 120,
    successRate: 0.85,
    effects: { goldDelta: 80, healthDelta: -10, energyDelta: -25, abilityDelta: 2 },
    prerequisites: { minHealth: 30, minEnergy: 40 },
    repeatPenalty: { consecutiveLimit: 3, penaltyMessage: '连续加班太多了，身体发出警报！' },
    message: '加班结束，额外收入到手，但真的很累。'
  },
  meeting: {
    id: 'meeting',
    name: '参加会议',
    category: 'work',
    description: '参加部门会议，提升工作能力',
    durationMinutes: 60,
    successRate: 0.9,
    effects: { goldDelta: 0, healthDelta: -3, energyDelta: -15, abilityDelta: 3 },
    prerequisites: { minEnergy: 20 },
    message: '会议结束，学到了不少东西。'
  },
  slack_off: {
    id: 'slack_off',
    name: '摸鱼',
    category: 'work',
    description: '偷偷休息一会儿，恢复少量精力',
    durationMinutes: 30,
    successRate: 0.7,
    effects: { goldDelta: -20, healthDelta: 0, energyDelta: 10, abilityDelta: 0 },
    prerequisites: { minEnergy: 10 },
    message: '偷偷刷了一会儿手机，精神好了点，但如果被老板发现就惨了。'
  },

  // === 生活类事件 ===
  sleep: {
    id: 'sleep',
    name: '睡觉',
    category: 'life',
    description: '好好休息一晚，恢复精力和健康',
    durationMinutes: 480,
    successRate: 1.0,
    effects: { goldDelta: 0, healthDelta: 15, energyDelta: 80, abilityDelta: 0 },
    repeatPenalty: { consecutiveLimit: 2, penaltyMessage: '睡太久了，你感到头晕目眩...' },
    message: '一觉睡到自然醒，感觉精神焕发！'
  },
  cook: {
    id: 'cook',
    name: '做饭',
    category: 'life',
    description: '自己动手做顿好吃的',
    durationMinutes: 60,
    successRate: 0.8,
    effects: { goldDelta: -30, healthDelta: 10, energyDelta: -10, abilityDelta: 0 },
    prerequisites: { minEnergy: 15 },
    message: '做出了一顿美味的饭菜，既省钱又健康。'
  },
  rest: {
    id: 'rest',
    name: '休息',
    category: 'life',
    description: '坐着休息一会儿',
    durationMinutes: 30,
    successRate: 1.0,
    effects: { goldDelta: 0, healthDelta: 3, energyDelta: 15, abilityDelta: 0 },
    message: '休息了一会儿，感觉好了点。'
  },
  watch_tv: {
    id: 'watch_tv',
    name: '看电视',
    category: 'life',
    description: '看会儿电视放松一下',
    durationMinutes: 60,
    successRate: 1.0,
    effects: { goldDelta: 0, healthDelta: -2, energyDelta: 5, abilityDelta: 0 },
    message: '追剧时光总是过得飞快。'
  },

  // === 消费类事件 ===
  eat_fast: {
    id: 'eat_fast',
    name: '快餐',
    category: 'consume',
    description: '吃顿快餐，便宜快捷',
    durationMinutes: 20,
    successRate: 1.0,
    effects: { goldDelta: -25, healthDelta: -3, energyDelta: 20, abilityDelta: 0 },
    prerequisites: { minGold: 25 },
    message: '快餐填饱肚子，但感觉不太健康。'
  },
  eat_good: {
    id: 'eat_good',
    name: '正常用餐',
    category: 'consume',
    description: '吃一顿正常的饭菜',
    durationMinutes: 40,
    successRate: 1.0,
    effects: { goldDelta: -50, healthDelta: 5, energyDelta: 25, abilityDelta: 0 },
    prerequisites: { minGold: 50 },
    message: '一顿营养均衡的饭菜，身心愉悦。'
  },
  eat_fancy: {
    id: 'eat_fancy',
    name: '大餐',
    category: 'consume',
    description: '犒劳自己一顿大餐',
    durationMinutes: 90,
    successRate: 1.0,
    effects: { goldDelta: -150, healthDelta: 8, energyDelta: 30, abilityDelta: 0 },
    prerequisites: { minGold: 150 },
    message: '美味的大餐让心情变好了！'
  },
  drink: {
    id: 'drink',
    name: '喝饮料',
    category: 'consume',
    description: '买杯饮料解渴',
    durationMinutes: 5,
    successRate: 1.0,
    effects: { goldDelta: -10, healthDelta: -1, energyDelta: 5, abilityDelta: 0 },
    prerequisites: { minGold: 10 },
    message: '冰凉的饮料下肚，瞬间清醒。'
  },

  // === 公园事件 ===
  walk: {
    id: 'walk',
    name: '散步',
    category: 'life',
    description: '在公园里散散步',
    durationMinutes: 30,
    successRate: 1.0,
    effects: { goldDelta: 0, healthDelta: 5, energyDelta: -5, abilityDelta: 0 },
    message: '散步让心情平静了许多。'
  },
  jog: {
    id: 'jog',
    name: '慢跑',
    category: 'life',
    description: '慢跑锻炼身体',
    durationMinutes: 45,
    successRate: 0.9,
    effects: { goldDelta: 0, healthDelta: 10, energyDelta: -20, abilityDelta: 0 },
    prerequisites: { minHealth: 30, minEnergy: 25 },
    message: '跑完步出了一身汗，感觉身体更强健了。'
  },
  sit_bench: {
    id: 'sit_bench',
    name: '坐长椅休息',
    category: 'life',
    description: '在长椅上休息一会儿',
    durationMinutes: 20,
    successRate: 1.0,
    effects: { goldDelta: 0, healthDelta: 2, energyDelta: 10, abilityDelta: 0 },
    message: '坐在长椅上，看着人来人往，很惬意。'
  },
  enjoy_scenery: {
    id: 'enjoy_scenery',
    name: '欣赏风景',
    category: 'life',
    description: '看看公园的风景，放松心情',
    durationMinutes: 15,
    successRate: 1.0,
    effects: { goldDelta: 0, healthDelta: 3, energyDelta: 5, abilityDelta: 0 },
    message: '风景如画，让人心旷神怡。'
  },

  // === 医院事件 ===
  see_doctor: {
    id: 'see_doctor',
    name: '看医生',
    category: 'life',
    description: '找医生看病，恢复健康',
    durationMinutes: 60,
    successRate: 0.95,
    effects: { goldDelta: -100, healthDelta: 30, energyDelta: -5, abilityDelta: 0 },
    prerequisites: { minGold: 100 },
    message: '医生开了药，感觉好多了。'
  },
  buy_medicine: {
    id: 'buy_medicine',
    name: '买药',
    category: 'consume',
    description: '买点常备药',
    durationMinutes: 10,
    successRate: 1.0,
    effects: { goldDelta: -50, healthDelta: 10, energyDelta: 0, abilityDelta: 0 },
    prerequisites: { minGold: 50 },
    message: '买了一些常备药，以备不时之需。'
  },

  // === 健身房事件 ===
  run: {
    id: 'run',
    name: '跑步',
    category: 'life',
    description: '在跑步机上跑步',
    durationMinutes: 30,
    successRate: 0.9,
    effects: { goldDelta: 0, healthDelta: 8, energyDelta: -15, abilityDelta: 0 },
    prerequisites: { minHealth: 25, minEnergy: 20 },
    message: '跑完步大汗淋漓，很有成就感。'
  },
  lift_weights: {
    id: 'lift_weights',
    name: '举铁',
    category: 'life',
    description: '力量训练',
    durationMinutes: 45,
    successRate: 0.85,
    effects: { goldDelta: 0, healthDelta: 12, energyDelta: -25, abilityDelta: 0 },
    prerequisites: { minHealth: 30, minEnergy: 30 },
    message: '举铁让你的肌肉更加结实。'
  },
  swim: {
    id: 'swim',
    name: '游泳',
    category: 'life',
    description: '游泳锻炼全身',
    durationMinutes: 40,
    successRate: 0.9,
    effects: { goldDelta: -30, healthDelta: 15, energyDelta: -20, abilityDelta: 0 },
    prerequisites: { minHealth: 30, minEnergy: 25, minGold: 30 },
    message: '游泳是最佳的全身运动！'
  },
  get_membership: {
    id: 'get_membership',
    name: '办健身卡',
    category: 'consume',
    description: '办一张健身会员卡',
    durationMinutes: 15,
    successRate: 1.0,
    effects: { goldDelta: -500, healthDelta: 0, energyDelta: 0, abilityDelta: 0 },
    prerequisites: { minGold: 500 },
    message: '办了健身卡，以后健身更便宜了。'
  },

  // === 学习类事件 ===
  study: {
    id: 'study',
    name: '学习',
    category: 'growth',
    description: '看书学习，提升工作能力',
    durationMinutes: 120,
    successRate: 0.9,
    effects: { goldDelta: 0, healthDelta: -3, energyDelta: -20, abilityDelta: 5 },
    prerequisites: { minEnergy: 20 },
    message: '学习让人进步，工作能力提升了。'
  },
  drink_water: {
    id: 'drink_water',
    name: '喝水',
    category: 'life',
    description: '喝杯水休息一下',
    durationMinutes: 5,
    successRate: 1.0,
    effects: { goldDelta: 0, healthDelta: 1, energyDelta: 2, abilityDelta: 0 },
    message: '多喝水有益健康。'
  },

  // === 培训机构事件 ===
  take_exam: {
    id: 'take_exam',
    name: '考证',
    category: 'growth',
    description: '参加职业资格考试',
    durationMinutes: 180,
    successRate: 0.7,
    effects: { goldDelta: -200, healthDelta: -5, energyDelta: -30, abilityDelta: 15 },
    prerequisites: { minEnergy: 40, minGold: 200 },
    message: '考证成功！工作能力大幅提升。'
  },
  attend_lecture: {
    id: 'attend_lecture',
    name: '听课',
    category: 'growth',
    description: '参加专业讲座',
    durationMinutes: 90,
    successRate: 0.9,
    effects: { goldDelta: -100, healthDelta: -2, energyDelta: -15, abilityDelta: 8 },
    prerequisites: { minEnergy: 20, minGold: 100 },
    message: '学到了很多专业知识。'
  },

  // === 咖啡厅事件 ===
  drink_coffee: {
    id: 'drink_coffee',
    name: '喝咖啡',
    category: 'consume',
    description: '来杯提神的咖啡',
    durationMinutes: 15,
    successRate: 1.0,
    effects: { goldDelta: -30, healthDelta: -1, energyDelta: 20, abilityDelta: 0 },
    prerequisites: { minGold: 30 },
    message: '咖啡因让精神为之一振！'
  },
  read_book: {
    id: 'read_book',
    name: '看书',
    category: 'growth',
    description: '在咖啡厅安静看书',
    durationMinutes: 60,
    successRate: 1.0,
    effects: { goldDelta: -20, healthDelta: 2, energyDelta: -5, abilityDelta: 3 },
    prerequisites: { minGold: 20 },
    message: '安静的阅读时光让人放松。'
  },
  part_time_job: {
    id: 'part_time_job',
    name: '咖啡厅兼职',
    category: 'work',
    description: '在咖啡厅做兼职赚外快',
    durationMinutes: 240,
    successRate: 0.9,
    effects: { goldDelta: 150, healthDelta: -5, energyDelta: -25, abilityDelta: 1 },
    prerequisites: { minEnergy: 30 },
    message: '兼职结束，赚到了额外的收入。'
  },
  socialize: {
    id: 'socialize',
    name: '社交',
    category: 'social',
    description: '和朋友聊天放松',
    durationMinutes: 60,
    successRate: 1.0,
    effects: { goldDelta: -50, healthDelta: 3, energyDelta: 5, abilityDelta: 0 },
    prerequisites: { minGold: 50 },
    message: '和朋友聊天很开心。'
  },

  // === 房产中心事件 ===
  view_house: {
    id: 'view_house',
    name: '看房',
    category: 'consume',
    description: '去看看房子',
    durationMinutes: 60,
    successRate: 1.0,
    effects: { goldDelta: 0, healthDelta: 0, energyDelta: -10, abilityDelta: 0 },
    message: '看了一圈房子，有了心仪的目标。'
  },
  buy_house: {
    id: 'buy_house',
    name: '买房',
    category: 'consume',
    description: '买一套属于自己的房子',
    durationMinutes: 120,
    successRate: 1.0,
    effects: { goldDelta: -500000, healthDelta: 10, energyDelta: -10, abilityDelta: 0 },
    prerequisites: { minGold: 500000 },
    message: '终于有了自己的房子！睡眠质量提升了。'
  },
  rent_house: {
    id: 'rent_house',
    name: '租房',
    category: 'consume',
    description: '租一套更好的房子',
    durationMinutes: 60,
    successRate: 1.0,
    effects: { goldDelta: -3000, healthDelta: 5, energyDelta: 0, abilityDelta: 0 },
    prerequisites: { minGold: 3000 },
    message: '搬到了新住处，环境好多了。'
  },

  // === 4S店事件 ===
  view_car: {
    id: 'view_car',
    name: '看车',
    category: 'consume',
    description: '去4S店看车',
    durationMinutes: 45,
    successRate: 1.0,
    effects: { goldDelta: 0, healthDelta: 0, energyDelta: -5, abilityDelta: 0 },
    message: '看中了几款车，正在考虑中。'
  },
  car_maintenance: {
    id: 'car_maintenance',
    name: '汽车保养',
    category: 'consume',
    description: '给爱车做保养',
    durationMinutes: 90,
    successRate: 1.0,
    effects: { goldDelta: -500, healthDelta: 0, energyDelta: -5, abilityDelta: 0 },
    prerequisites: { minGold: 500 },
    message: '汽车保养完毕，状态良好。'
  },

  // === 商场事件 ===
  buy_clothes: {
    id: 'buy_clothes',
    name: '买衣服',
    category: 'consume',
    description: '买几件新衣服',
    durationMinutes: 45,
    successRate: 1.0,
    effects: { goldDelta: -300, healthDelta: 3, energyDelta: -5, abilityDelta: 0 },
    prerequisites: { minGold: 300 },
    message: '新衣服让人心情大好。'
  },
  buy_electronics: {
    id: 'buy_electronics',
    name: '买电子产品',
    category: 'consume',
    description: '买最新款的电子产品',
    durationMinutes: 60,
    successRate: 1.0,
    effects: { goldDelta: -2000, healthDelta: 2, energyDelta: -5, abilityDelta: 2 },
    prerequisites: { minGold: 2000 },
    message: '新设备让工作效率提升了。'
  },
  buy_furniture: {
    id: 'buy_furniture',
    name: '买家具',
    category: 'consume',
    description: '添置新家具',
    durationMinutes: 60,
    successRate: 1.0,
    effects: { goldDelta: -1500, healthDelta: 5, energyDelta: -10, abilityDelta: 0 },
    prerequisites: { minGold: 1500 },
    message: '新家具让家更温馨了。'
  },
  window_shopping: {
    id: 'window_shopping',
    name: '逛街',
    category: 'consume',
    description: '随便逛逛，不买也行',
    durationMinutes: 30,
    successRate: 1.0,
    effects: { goldDelta: 0, healthDelta: 2, energyDelta: -5, abilityDelta: 0 },
    message: ' window shopping 也很开心。'
  },

  // === 医院额外事件 ===
  health_check: {
    id: 'health_check',
    name: '体检',
    category: 'life',
    description: '做一次全面体检',
    durationMinutes: 90,
    successRate: 1.0,
    effects: { goldDelta: -200, healthDelta: 15, energyDelta: -5, abilityDelta: 0 },
    prerequisites: { minGold: 200 },
    message: '体检结果良好，身体状况不错。'
  },
  rest_hospital: {
    id: 'rest_hospital',
    name: '在医院休息',
    category: 'life',
    description: '在医院休息区坐一会儿',
    durationMinutes: 20,
    successRate: 1.0,
    effects: { goldDelta: 0, healthDelta: 2, energyDelta: 8, abilityDelta: 0 },
    message: '在安静的医院休息了一会儿。'
  },

  // === 健身房额外事件 ===
  yoga: {
    id: 'yoga',
    name: '瑜伽',
    category: 'life',
    description: '做瑜伽放松身心',
    durationMinutes: 60,
    successRate: 0.9,
    effects: { goldDelta: -20, healthDelta: 10, energyDelta: -10, abilityDelta: 0 },
    prerequisites: { minHealth: 20, minEnergy: 15, minGold: 20 },
    message: '瑜伽让身心都得到了放松。'
  }
};
