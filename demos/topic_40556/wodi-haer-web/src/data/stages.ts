﻿// 吾滴孩儿 - 四大阶段详细数据

export interface StageModule {
  icon: string;
  title: string;
  description: string;
  features: string[];
  color: string;
}

export interface StageData {
  key: string;
  name: string;
  slogan: string;
  icon: string;
  gradient: string;
  duration: string;
  description: string;
  modules: StageModule[];
  timeline: { week: string; title: string; content: string }[];
  tips: string[];
}

export const stages: StageData[] = [
  // ==================== 备孕阶段 ====================
  {
    key: 'preparing',
    name: '备孕',
    slogan: '科学备孕，迎接新生命',
    icon: '🌱',
    gradient: 'from-mint to-soft-blue',
    duration: '孕前3-6个月',
    description: '从身体调理到心理准备，科学规划每一步，为健康宝宝打下基础',
    modules: [
      {
        icon: '🩺',
        title: '孕前检查',
        description: '全面的孕前健康检查，排查潜在风险',
        features: ['夫妻双方体检套餐', '遗传病筛查', '口腔检查', 'TORCH优生检查'],
        color: 'soft-blue',
      },
      {
        icon: '💊',
        title: '营养补充',
        description: '科学补充叶酸及关键营养素',
        features: ['叶酸补充计划', '复合维生素建议', '饮食营养指导', '微量元素检测'],
        color: 'mint',
      },
      {
        icon: '📅',
        title: '排卵追踪',
        description: '精准预测排卵期，提高受孕几率',
        features: ['月经周期记录', '基础体温追踪', '排卵试纸记录', '受孕窗口预测'],
        color: 'soft-pink',
      },
      {
        icon: '🏃',
        title: '生活方式',
        description: '调整生活习惯，营造最佳受孕环境',
        features: ['运动计划制定', '戒酒戒烟指导', '睡眠管理', '压力调节方案'],
        color: 'light-yellow',
      },
      {
        icon: '🧠',
        title: '心理准备',
        description: '做好心理建设，迎接角色转变',
        features: ['情绪状态评估', '夫妻沟通指导', '育儿心理准备', '焦虑情绪疏导'],
        color: 'light-blue',
      },
      {
        icon: '💰',
        title: '经济规划',
        description: '合理规划家庭财务，为育儿做准备',
        features: ['孕期预算规划', '育儿费用预估', '保险方案建议', '产假财务规划'],
        color: 'powder-blue',
      },
    ],
    timeline: [
      { week: '孕前6月', title: '全面体检', content: '夫妻双方完成全面孕前检查，了解身体状况' },
      { week: '孕前5月', title: '调整生活方式', content: '戒烟戒酒，规律作息，开始适度运动' },
      { week: '孕前3月', title: '开始补充叶酸', content: '每日补充0.4-0.8mg叶酸，预防神经管缺陷' },
      { week: '孕前2月', title: '营养调理', content: '均衡饮食，补充关键营养素，调理身体' },
      { week: '孕前1月', title: '排卵期追踪', content: '开始记录基础体温，使用排卵试纸预测受孕窗口' },
    ],
    tips: [
      '叶酸最好在孕前3个月开始补充，每天0.4-0.8mg',
      '备孕期间避免接触有害化学物质和放射线',
      '保持BMI在18.5-24的健康范围内',
      '男性也要注意戒烟戒酒，提高精子质量',
    ],
  },

  // ==================== 怀孕阶段 ====================
  {
    key: 'pregnancy',
    name: '怀孕',
    slogan: '280天的奇妙旅程',
    icon: '🤰',
    gradient: 'from-soft-pink to-soft-blue',
    duration: '孕1-40周',
    description: '从早孕反应到胎动感知，全程陪伴每一次产检和成长里程碑',
    modules: [
      {
        icon: '📋',
        title: '产检管理',
        description: '产检时间规划与记录，不漏掉每一次检查',
        features: ['产检时间表自动提醒', '检查结果记录', '产检报告解读', '异常指标预警'],
        color: 'soft-pink',
      },
      {
        icon: '📅',
        title: '孕期周历',
        description: '每周宝宝发育和妈妈身体变化',
        features: ['宝宝每周大小可视化', '妈妈身体变化提示', '本周注意事项', '发育里程碑记录'],
        color: 'soft-blue',
      },
      {
        icon: '🍎',
        title: '孕期营养',
        description: '分阶段营养指导，吃对吃好',
        features: ['孕早/中/晚期食谱', '禁忌食物清单', '营养素补充指南', '体重增长管理'],
        color: 'mint',
      },
      {
        icon: '👣',
        title: '胎动记录',
        description: '记录胎动，监测宝宝健康',
        features: ['每日胎动计数', '胎动规律分析', '异常胎动提醒', '胎心监护记录'],
        color: 'light-yellow',
      },
      {
        icon: '😰',
        title: '不适缓解',
        description: '应对孕吐、水肿等孕期不适',
        features: ['孕吐缓解方案', '水肿管理建议', '腰痛缓解运动', '失眠应对策略'],
        color: 'light-blue',
      },
      {
        icon: '🧘',
        title: '孕期运动',
        description: '安全的孕期运动指导',
        features: ['孕期瑜伽教程', '散步计划', '凯格尔运动', '分娩呼吸练习'],
        color: 'powder-blue',
      },
    ],
    timeline: [
      { week: '第1-4周', title: '受精着床', content: '受精卵形成并着床，开始分泌HCG' },
      { week: '第5-8周', title: '器官初成', content: '心脏开始跳动，主要器官开始发育' },
      { week: '第12周', title: '早孕结束', content: 'NT检查，胎儿基本成型，进入稳定期' },
      { week: '第16周', title: '感知胎动', content: '可能感受到胎动，进行唐筛检查' },
      { week: '第20周', title: '大排畸', content: '四维彩超，全面检查胎儿发育' },
      { week: '第24周', title: '糖耐量', content: '妊娠糖尿病筛查，关注血糖' },
      { week: '第28周', title: '进入孕晚期', content: '胎动规律，开始数胎动' },
      { week: '第36周', title: '每周产检', content: '胎心监护，关注胎位和入盆情况' },
      { week: '第40周', title: '预产期', content: '准备分娩，随时迎接宝宝到来' },
    ],
    tips: [
      '孕早期避免剧烈运动和长途旅行',
      '孕中期是补充钙和铁的关键时期',
      '每天数胎动，正常胎动每小时3-5次',
      '孕晚期注意观察见红、破水、规律宫缩三大临产征兆',
    ],
  },

  // ==================== 生产阶段 ====================
  {
    key: 'birth',
    name: '生产',
    slogan: '迎接新生命的到来',
    icon: '🏥',
    gradient: 'from-light-blue to-soft-pink',
    duration: '分娩前后',
    description: '从待产准备到产后恢复，全程指导，安心迎接宝宝',
    modules: [
      {
        icon: '🎒',
        title: '待产包清单',
        description: '完整的待产包准备清单，不遗漏',
        features: ['妈妈用品清单', '宝宝用品清单', '证件资料清单', '待产包进度跟踪'],
        color: 'soft-pink',
      },
      {
        icon: '📖',
        title: '分娩知识',
        description: '了解分娩全过程，消除恐惧',
        features: ['分娩三大征兆识别', '产程详解', '顺产vs剖腹产', '无痛分娩指南'],
        color: 'soft-blue',
      },
      {
        icon: '🏥',
        title: '入院准备',
        description: '提前了解入院流程',
        features: ['医院路线规划', '入院手续指南', '病房选择建议', '陪产人员安排'],
        color: 'mint',
      },
      {
        icon: '👶',
        title: '新生儿护理',
        description: '新生儿照护全攻略',
        features: ['脐带护理', '黄疸观察', '洗澡指导', '睡眠安全'],
        color: 'light-yellow',
      },
      {
        icon: '🤱',
        title: '开奶与喂养',
        description: '母乳喂养的顺利开始',
        features: ['尽早开奶指导', '正确衔乳姿势', '初乳的重要性', '按需喂养原则'],
        color: 'light-blue',
      },
      {
        icon: '💆',
        title: '产后恢复',
        description: '科学坐月子，身体恢复',
        features: ['恶露观察', '伤口护理', '产后运动', '心理调适防抑郁'],
        color: 'powder-blue',
      },
    ],
    timeline: [
      { week: '孕37周', title: '准备待产包', content: '整理待产包，随时可以出发去医院' },
      { week: '孕38周', title: '了解临产征兆', content: '学习识别见红、破水、规律宫缩' },
      { week: '孕39周', title: '最终准备', content: '确认医院路线，安排陪产人员' },
      { week: '分娩日', title: '迎接宝宝', content: '保持冷静，配合医生，迎接新生命' },
      { week: '产后1周', title: '初期恢复', content: '开奶、恶露排出、伤口愈合' },
      { week: '产后2周', title: '适应喂养', content: '建立喂养规律，观察黄疸' },
      { week: '产后6周', title: '产后复查', content: '42天产后复查，评估恢复情况' },
    ],
    tips: [
      '见红后通常24-48小时内分娩，不用着急去医院',
      '破水后需立即平躺并尽快就医，防止感染',
      '初乳非常珍贵，一定要让宝宝尽早吸吮',
      '产后情绪低落是正常的，严重时需及时寻求帮助',
    ],
  },

  // ==================== 养育阶段 ====================
  {
    key: 'parenting',
    name: '养育',
    slogan: '陪伴成长的每一天',
    icon: '👶',
    gradient: 'from-soft-blue to-mint',
    duration: '0-6岁',
    description: '从日常记录到成长里程碑，科学养育，记录每一个珍贵瞬间',
    modules: [
      {
        icon: '🍼',
        title: '喂养记录',
        description: '母乳、奶粉、辅食全记录',
        features: ['母乳/奶粉喂养记录', '辅食添加日历', '奶量统计', '过敏食物标记'],
        color: 'soft-pink',
      },
      {
        icon: '😴',
        title: '睡眠管理',
        description: '培养良好睡眠习惯',
        features: ['睡眠时长记录', '入睡仪式建立', '夜醒分析', '睡眠规律建议'],
        color: 'light-blue',
      },
      {
        icon: '💩',
        title: '排便记录',
        description: '关注消化健康',
        features: ['排便次数记录', '便便状态分析', '消化问题预警', '如厕训练指导'],
        color: 'mint',
      },
      {
        icon: '💉',
        title: '疫苗接种',
        description: '疫苗计划不遗漏',
        features: ['接种时间表', '免费/自费疫苗', '接种后护理', '接种记录管理'],
        color: 'light-yellow',
      },
      {
        icon: '📏',
        title: '生长发育',
        description: '身高体重头围追踪',
        features: ['生长曲线图', '发育里程碑', '大运动发展', '精细动作评估'],
        color: 'soft-blue',
      },
      {
        icon: '🧩',
        title: '早教启蒙',
        description: '分月龄早教方案',
        features: ['感官训练', '语言启蒙', '认知发展', '社交能力培养'],
        color: 'powder-blue',
      },
      {
        icon: '📸',
        title: '成长相册',
        description: '记录每一个珍贵瞬间',
        features: ['时光轴相册', '里程碑记录', '成长对比', '云端备份'],
        color: 'soft-pink',
      },
      {
        icon: '🏥',
        title: '健康档案',
        description: '完整的健康记录',
        features: ['体检记录', '用药记录', '过敏史', '就医档案'],
        color: 'light-blue',
      },
    ],
    timeline: [
      { week: '0-1月', title: '新生儿期', content: '按需喂养，每天睡眠16-20小时，关注黄疸' },
      { week: '1-3月', title: '抬头翻身', content: '练习抬头，开始社交微笑，建立作息' },
      { week: '4-6月', title: '添加辅食', content: '从高铁米粉开始添加辅食，练习翻身坐' },
      { week: '7-9月', title: '坐爬学语', content: '独立坐稳，开始爬行，咿呀学语' },
      { week: '10-12月', title: '站立行走', content: '扶站到独走，叫爸爸妈妈，断奶过渡' },
      { week: '1-2岁', title: '语言爆发', content: '词汇量爆发，自主进食，如厕训练' },
      { week: '2-3岁', title: '自我意识', content: '自我意识增强，入园准备，规则建立' },
      { week: '3-6岁', title: '学龄前', content: '社交发展，兴趣培养，幼小衔接' },
    ],
    tips: [
      '6个月内宝宝建议纯母乳喂养，无需额外喂水',
      '辅食添加每次只加一种，观察3-5天确认无过敏',
      '疫苗一定要按时接种，保护宝宝健康',
      '每个宝宝发育节奏不同，不要过度焦虑对比',
    ],
  },
];

export const getStageByKey = (key: string): StageData | undefined => {
  return stages.find((s) => s.key === key);
};
