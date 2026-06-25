// ============================================================
// 战锤40K银河征兵中心 - 测试题库
// ============================================================

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: '当你面对一个强大的敌人时，你的第一反应是？',
    options: [
      { text: '为帝皇冲锋！死战不退！', scores: { imperium: 3, chaos: 1 } },
      { text: '分析敌人弱点，制定精确战术', scores: { tau: 3, eldar: 2, votann: 1 } },
      { text: 'WAAAGH!!!冲上去揍他！', scores: { orks: 4 } },
      { text: '从暗处偷袭，让他永远不知道是谁杀了他', scores: { 'dark-eldar': 3, eldar: 1 } },
      { text: '吞噬他，吸收他的基因', scores: { tyranids: 4 } }
    ]
  },
  {
    id: 2,
    question: '你更看重什么？',
    options: [
      { text: '信仰与忠诚', scores: { imperium: 4, chaos: 1 } },
      { text: '自由与力量', scores: { chaos: 3, 'dark-eldar': 2 } },
      { text: '知识与智慧', scores: { eldar: 3, tau: 2, votann: 2 } },
      { text: '生存与利润', scores: { votann: 3, orks: 1 } },
      { text: '进化与完美', scores: { tyranids: 4, necrons: 1 } }
    ]
  },
  {
    id: 3,
    question: '你对"死亡"的态度是？',
    options: [
      { text: '为帝皇而死是最高荣耀', scores: { imperium: 4 } },
      { text: '死亡只是开始，永生才是目标', scores: { necrons: 4, chaos: 1 } },
      { text: '尽量避免，但必要时绝不退缩', scores: { tau: 3, eldar: 2 } },
      { text: '死就死了，重要的是死得够响', scores: { orks: 4 } },
      { text: '死亡？我的灵魂会被色孽吞噬……', scores: { eldar: 3, 'dark-eldar': 1 } }
    ]
  },
  {
    id: 4,
    question: '你最理想的战斗方式是？',
    options: [
      { text: '排枪齐射，人海冲锋', scores: { imperium: 4 } },
      { text: '高科技火力覆盖，精确打击', scores: { tau: 4, votann: 2 } },
      { text: '近身肉搏，用拳头说话', scores: { orks: 4, chaos: 1 } },
      { text: '快速突击，优雅而致命', scores: { eldar: 3, 'dark-eldar': 2 } },
      { text: '虫海淹没一切', scores: { tyranids: 4 } }
    ]
  },
  {
    id: 5,
    question: '你如何对待弱者？',
    options: [
      { text: '保护他们，这是帝皇的旨意', scores: { imperium: 3, tau: 2 } },
      { text: '弱者只配被淘汰', scores: { chaos: 3, tyranids: 2, necrons: 2 } },
      { text: '弱者的痛苦是美味的', scores: { 'dark-eldar': 4 } },
      { text: '每个人都有价值，应该被合理利用', scores: { tau: 3, votann: 2 } },
      { text: '弱者？只要够多也能赢！', scores: { orks: 3, imperium: 1 } }
    ]
  },
  {
    id: 6,
    question: '你的理想生活环境是？',
    options: [
      { text: '宏伟的哥特大教堂，金色穹顶', scores: { imperium: 4 } },
      { text: '高科技城市，一切井然有序', scores: { tau: 4, votann: 2 } },
      { text: '广阔的荒野，自由自在', scores: { orks: 3, 'dark-eldar': 1 } },
      { text: '幽暗的地下世界，充满神秘', scores: { 'dark-eldar': 3, necrons: 2 } },
      { text: '古老的遗迹，充满历史感', scores: { eldar: 3, necrons: 2 } }
    ]
  },
  {
    id: 7,
    question: '如果让你选择一件武器，你会选？',
    options: [
      { text: '一把可靠的拉斯枪', scores: { imperium: 4 } },
      { text: '一把会说话的恶魔之剑', scores: { chaos: 4 } },
      { text: '一把优雅的碎星镖', scores: { eldar: 4 } },
      { text: '一把巨大的切克卡（越大约好）', scores: { orks: 4 } },
      { text: '一把分解分子的高斯枪', scores: { necrons: 4 } }
    ]
  },
  {
    id: 8,
    question: '你对"秩序"的看法是？',
    options: [
      { text: '秩序是文明的基石，必须维护', scores: { imperium: 3, tau: 3, votann: 2 } },
      { text: '秩序是枷锁，混沌才是自由', scores: { chaos: 4 } },
      { text: '秩序只是另一种形式的控制', scores: { 'dark-eldar': 3, eldar: 1 } },
      { text: '秩序？俺们只需要WAAAGH!', scores: { orks: 4 } },
      { text: '秩序是效率的保障', scores: { necrons: 3, votann: 2 } }
    ]
  },
  {
    id: 9,
    question: '你最大的恐惧是什么？',
    options: [
      { text: '被异端腐蚀，背叛帝皇', scores: { imperium: 4 } },
      { text: '失去力量，变得软弱', scores: { chaos: 3, 'dark-eldar': 2 } },
      { text: '种族灭绝，文明消亡', scores: { eldar: 4, tau: 2 } },
      { text: '无聊——没有仗打的日子太无聊了', scores: { orks: 4 } },
      { text: '永远沉睡，无法苏醒', scores: { necrons: 4 } }
    ]
  },
  {
    id: 10,
    question: '如果银河即将毁灭，你会怎么做？',
    options: [
      { text: '召集所有人类，做最后的抵抗', scores: { imperium: 4 } },
      { text: '拥抱毁灭，在混沌中重生', scores: { chaos: 4 } },
      { text: '制定一个万年级别的逃生计划', scores: { eldar: 3, tau: 2, votann: 2 } },
      { text: '毁灭？那正好是最盛大的WAAAGH!', scores: { orks: 4 } },
      { text: '先吃饱再说', scores: { tyranids: 4 } }
    ]
  },
  {
    id: 11,
    question: '你最欣赏的品质是？',
    options: [
      { text: '忠诚与牺牲精神', scores: { imperium: 4 } },
      { text: '狡诈与野心', scores: { chaos: 2, 'dark-eldar': 2, necrons: 2 } },
      { text: '智慧与远见', scores: { eldar: 3, tau: 3, votann: 1 } },
      { text: '蛮力与勇气', scores: { orks: 4 } },
      { text: '适应力与进化能力', scores: { tyranids: 4 } }
    ]
  },
  {
    id: 12,
    question: '你对"科技"的态度是？',
    options: [
      { text: '科技是帝皇赐予的神圣礼物，不可随意更改', scores: { imperium: 4 } },
      { text: '科技应该不断进步和创新', scores: { tau: 4, votann: 3 } },
      { text: '我们的科技远超你们的理解', scores: { eldar: 2, necrons: 4 } },
      { text: '不需要科技，拳头就够了！', scores: { orks: 4 } },
      { text: '生物进化比机械科技更高级', scores: { tyranids: 4 } }
    ]
  }
];

// 适配结果描述
const QUIZ_RESULT_DESC = {
  imperium: {
    title: '帝国的忠实子民',
    desc: '你对帝皇有着坚定不移的信仰，愿意为人类的未来献出一切。你的忠诚和勇气使你成为帝国最可靠的战士。虽然帝国可能并不完美——好吧，它充满了腐败和低效——但正是像你这样的人类，在黑暗的银河中守护着文明的最后火光。',
    rank: '星界军列兵'
  },
  chaos: {
    title: '混沌的选民',
    desc: '你内心深处渴望着超越凡人的力量，对现有的秩序感到不满。混沌的力量正在召唤你，虽然这条路充满了疯狂和变异，但那些愿意付出代价的人将获得无与伦比的力量。记住：在亚空间中，疯狂就是清醒。',
    rank: '混沌战士'
  },
  eldar: {
    title: '远古智慧的继承者',
    desc: '你拥有超越常人的洞察力和优雅气质，能够在混乱中看到秩序，在绝望中找到希望。你深知情感的力量，也明白控制情感的重要性。作为灵族的盟友，你将以千年为单位思考问题，在银河的棋局中运筹帷幄。',
    rank: '战争之道学徒'
  },
  'dark-eldar': {
    title: '痛苦的鉴赏家',
    desc: '你对权力和控制有着近乎病态的渴望，享受着他人的恐惧和痛苦。你的残忍不是无脑的暴力，而是一种精心设计的艺术。在康莫拉夫的暗巷中，你将找到志同道合的灵魂——以及无数可供你"欣赏"的对象。',
    rank: '卡巴利特战士'
  },
  orks: {
    title: '天生的战士',
    desc: 'WAAAGH!!!你就是为战斗而生的！简单、直接、暴力——这就是你的风格。你不需要复杂的战术，不需要精密的装备，你只需要一个足够大的敌人和足够响的战吼。在战场上，你将是最快乐的那个人（如果你能活下来的话）。',
    rank: '兽人小子'
  },
  tau: {
    title: '上上善道的践行者',
    desc: '你相信理性、科技和合作可以改变银河。你是一个理想主义者，但你的理想有着先进科技和严密组织作为支撑。虽然帝国的信徒们可能认为你天真，但你的战斗记录说明了一切：在火力的支持下，任何理想都不是空谈。',
    rank: '火氏战士'
  },
  necrons: {
    title: '永恒的守望者',
    desc: '你对永生有着独特的理解——不是灵魂的不朽，而是存在的永恒。你欣赏秩序和效率，对情感的波动不屑一顾。虽然你可能看起来冷酷无情，但在这个混乱的银河中，也许正是这种绝对的理性才是最需要的。',
    rank: '死灵战士'
  },
  tyranids: {
    title: '终极掠食者',
    desc: '你拥有强大的适应力和进化本能，能够在任何环境中生存并变得更强。你不在乎个体的存亡，只关心整体的进化。虽然你可能被认为"没有感情"，但谁又能说吞噬不是一种爱呢？（认真的）',
    rank: '猎杀虫'
  },
  votann: {
    title: '利润的追寻者',
    desc: '你是一个务实的人，相信契约、科技和利润的力量。你不会被空洞的信仰所迷惑，也不会被疯狂的情绪所左右。在你的字典里，没有"不可能"这个词——只有"利润不够高"。在银河的边缘，你将开拓出属于自己的商业帝国。',
    rank: '契约战士'
  }
};
