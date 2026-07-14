/* ===========================================
   数据层：题库、Mock、社区数据、体质判定
   =========================================== */

// 5 道中医问诊题目（围绕痰湿体质的典型特征设计）
window.QUESTIONS = [
  {
    id: 1,
    eyebrow: '起居观察',
    title: '您日常的体感如何？',
    hint: '请根据最近一个月的整体情况选择',
    options: [
      { label: '身体沉重，容易疲倦乏力', value: 'heavy' },
      { label: '怕冷，手脚常年冰凉', value: 'cold' },
      { label: '手脚心发热，夜间盗汗', value: 'hot' },
      { label: '精神亢奋，睡眠偏少', value: 'restless' },
    ],
  },
  {
    id: 2,
    eyebrow: '饮食偏好',
    title: '您对下列哪类食物最有偏好？',
    hint: '一日三餐中渴望的口味',
    options: [
      { label: '油腻、甜腻、奶制品', value: 'greasy' },
      { label: '辛辣、煎炸、烧烤', value: 'spicy' },
      { label: '冰凉、生冷、瓜果', value: 'cold_food' },
      { label: '清淡蔬菜、五谷杂粮', value: 'light' },
    ],
  },
  {
    id: 3,
    eyebrow: '舌象自查',
    title: '照镜子观察，您的舌象更接近？',
    hint: '晨起未刷牙时观察最准',
    options: [
      { label: '舌苔白厚腻，有齿痕', value: 'thick_coat' },
      { label: '舌苔黄腻，舌边红', value: 'yellow_coat' },
      { label: '舌淡胖嫩，苔白润', value: 'pale_fat' },
      { label: '舌红少苔，或有裂纹', value: 'red_thin' },
    ],
  },
  {
    id: 4,
    eyebrow: '排泄状况',
    title: '您近期大便的形态？',
    hint: '粘马桶或成形但费力',
    options: [
      { label: '大便稀溏、粘滞不爽', value: 'loose' },
      { label: '大便干结、排出困难', value: 'dry' },
      { label: '先干后稀，腹胀', value: 'mixed' },
      { label: '成形顺畅，每日一行', value: 'normal' },
    ],
  },
  {
    id: 5,
    eyebrow: '体型与精神',
    title: '您觉得自己的身体状态？',
    hint: '综合评估',
    options: [
      { label: '体形偏胖，腹部松软', value: 'fat_soft' },
      { label: '体形中等，易上火', value: 'medium' },
      { label: '体形偏瘦，怕冷', value: 'thin_cold' },
      { label: '体形偏瘦，失眠多', value: 'thin_insomnia' },
    ],
  },
];

// 体质判定与饮食建议（每种体质的特征 + 4 条宜食 + 4 条少食）
window.CONSTITUTIONS = {
  痰湿: {
    name: '痰湿体质',
    pinyin: 'TAN SHI',
    description: '您属于痰湿体质，多因脾虚运化失常，水湿内停，日久凝聚成痰。常见表现为体型偏胖、面部油腻、舌苔白厚腻、大便粘滞不爽、容易疲倦、胸闷痰多。调理关键在于健脾祛湿，化痰理气。',
    features: [
      { label: '体型特征', value: '偏胖，腹部松软' },
      { label: '舌象', value: '舌淡胖，苔白腻' },
      { label: '易发问题', value: '疲倦、痰多、湿疹' },
      { label: '调理重点', value: '健脾 · 祛湿 · 化痰' },
    ],
    advice: [
      { tag: '宜食', icon: '✓', food: '薏苡仁 + 赤小豆', desc: '煮粥或打豆浆，健脾利湿，久服可化痰浊。', cls: 'good' },
      { tag: '宜食', icon: '✓', food: '陈皮 + 茯苓', desc: '日常泡水代茶饮，理气健脾、燥湿化痰。', cls: 'good' },
      { tag: '少食', icon: '✕', food: '肥甘厚腻（红烧肉、奶油）', desc: '滋腻碍脾，加重痰湿内生。', cls: 'bad' },
      { tag: '少食', icon: '✕', food: '生冷瓜果（西瓜、梨）', desc: '寒凉伤脾阳，助湿生痰。', cls: 'bad' },
    ],
  },
  湿热: {
    name: '湿热体质',
    pinyin: 'SHI RE',
    description: '您属于湿热体质，多因湿热内蕴于脾胃、肝胆。常见表现为面油有痤疮、口苦口干、舌苔黄腻、大便粘滞、小便短黄、易烦躁。调理关键在于清热利湿，疏肝利胆。',
    features: [
      { label: '体型特征', value: '中等或偏瘦' },
      { label: '舌象', value: '舌红，苔黄腻' },
      { label: '易发问题', value: '痤疮、口苦、烦躁' },
      { label: '调理重点', value: '清热 · 利湿 · 疏肝' },
    ],
    advice: [
      { tag: '宜食', icon: '✓', food: '绿豆 + 薏仁', desc: '煮汤常饮，清热解毒利湿。', cls: 'good' },
      { tag: '宜食', icon: '✓', food: '苦瓜、芹菜', desc: '凉拌或清炒，清肝泻火。', cls: 'good' },
      { tag: '少食', icon: '✕', food: '辛辣刺激（辣椒、酒精）', desc: '助火生热，加重湿热。', cls: 'bad' },
      { tag: '少食', icon: '✕', food: '温热滋补（羊肉、鹿茸）', desc: '火上浇油，不宜食用。', cls: 'bad' },
    ],
  },
  气虚: {
    name: '气虚体质',
    pinyin: 'QI XU',
    description: '您属于气虚体质，多因元气不足，脏腑功能减退。常见表现为容易疲倦、说话声音低弱、易感冒、舌淡有齿痕、脉虚弱。调理关键在于补气健脾。',
    features: [
      { label: '体型特征', value: '偏瘦或虚胖' },
      { label: '舌象', value: '舌淡胖有齿痕' },
      { label: '易发问题', value: '易感冒、疲倦' },
      { label: '调理重点', value: '补气 · 健脾 · 固表' },
    ],
    advice: [
      { tag: '宜食', icon: '✓', food: '黄芪 + 党参', desc: '炖鸡或泡水，补中益气。', cls: 'good' },
      { tag: '宜食', icon: '✓', food: '山药、大枣', desc: '煮粥常服，健脾益气。', cls: 'good' },
      { tag: '少食', icon: '✕', food: '生冷食物（冷饮、生鱼片）', desc: '耗伤阳气，加重气虚。', cls: 'bad' },
      { tag: '少食', icon: '✕', food: '难消化食物（糯米、炸物）', desc: '加重脾胃负担。', cls: 'bad' },
    ],
  },
  阳虚: {
    name: '阳虚体质',
    pinyin: 'YANG XU',
    description: '您属于阳虚体质，多因阳气不足，温煦功能减弱。常见表现为畏寒怕冷、手脚冰凉、喜热饮、大便溏薄、舌淡胖嫩。调理关键在于温阳散寒。',
    features: [
      { label: '体型特征', value: '偏瘦，面色苍白' },
      { label: '舌象', value: '舌淡胖嫩，苔白' },
      { label: '易发问题', value: '怕冷、便溏' },
      { label: '调理重点', value: '温阳 · 散寒 · 补肾' },
    ],
    advice: [
      { tag: '宜食', icon: '✓', food: '生姜、桂圆', desc: '煮水或煲汤，温阳散寒。', cls: 'good' },
      { tag: '宜食', icon: '✓', food: '羊肉、韭菜', desc: '温补肾阳，驱散寒邪。', cls: 'good' },
      { tag: '少食', icon: '✕', food: '寒凉食物（螃蟹、苦瓜）', desc: '损伤阳气，不宜多食。', cls: 'bad' },
      { tag: '少食', icon: '✕', food: '冰镇冷饮', desc: '寒邪直中脏腑。', cls: 'bad' },
    ],
  },
  阴虚: {
    name: '阴虚体质',
    pinyin: 'YIN XU',
    description: '您属于阴虚体质，多因阴液不足，虚火内扰。常见表现为手足心热、口燥咽干、失眠多梦、舌红少苔、大便干燥。调理关键在于滋阴润燥。',
    features: [
      { label: '体型特征', value: '偏瘦' },
      { label: '舌象', value: '舌红少苔' },
      { label: '易发问题', value: '失眠、盗汗' },
      { label: '调理重点', value: '滋阴 · 润燥 · 清虚热' },
    ],
    advice: [
      { tag: '宜食', icon: '✓', food: '麦冬、石斛', desc: '泡水或煲汤，滋阴生津。', cls: 'good' },
      { tag: '宜食', icon: '✓', food: '银耳、百合', desc: '煮羹常服，润肺养阴。', cls: 'good' },
      { tag: '少食', icon: '✕', food: '辛辣温热（胡椒、烧烤）', desc: '助火伤阴，加重虚热。', cls: 'bad' },
      { tag: '少食', icon: '✕', food: '煎炸油腻', desc: '耗伤阴液。', cls: 'bad' },
    ],
  },
};

// 体质判定算法
window.determineConstitution = function(answers) {
  // 答案到体质分数的映射（每个选项增加对应体质的权重）
  // 这里为了演示，题目顺序设计为引导出"痰湿体质"判定
  const scoreMap = {
    heavy:      { 痰湿: 3, 湿热: 1, 气虚: 1, 阳虚: 0, 阴虚: 0 },
    cold:       { 痰湿: 1, 湿热: 0, 气虚: 2, 阳虚: 3, 阴虚: 0 },
    hot:        { 痰湿: 0, 湿热: 2, 气虚: 0, 阳虚: 0, 阴虚: 3 },
    restless:   { 痰湿: 0, 湿热: 1, 气虚: 0, 阳虚: 0, 阴虚: 2 },
    greasy:     { 痰湿: 3, 湿热: 2, 气虚: 0, 阳虚: 0, 阴虚: 0 },
    spicy:      { 痰湿: 0, 湿热: 3, 气虚: 0, 阳虚: 0, 阴虚: 1 },
    cold_food:  { 痰湿: 2, 湿热: 0, 气虚: 1, 阳虚: 2, 阴虚: 0 },
    light:      { 痰湿: 0, 湿热: 0, 气虚: 1, 阳虚: 0, 阴虚: 1 },
    thick_coat: { 痰湿: 3, 湿热: 1, 气虚: 1, 阳虚: 1, 阴虚: 0 },
    yellow_coat:{ 痰湿: 1, 湿热: 3, 气虚: 0, 阳虚: 0, 阴虚: 1 },
    pale_fat:   { 痰湿: 1, 湿热: 0, 气虚: 2, 阳虚: 3, 阴虚: 0 },
    red_thin:   { 痰湿: 0, 湿热: 1, 气虚: 0, 阳虚: 0, 阴虚: 3 },
    loose:      { 痰湿: 2, 湿热: 0, 气虚: 2, 阳虚: 2, 阴虚: 0 },
    dry:        { 痰湿: 0, 湿热: 1, 气虚: 0, 阳虚: 0, 阴虚: 2 },
    mixed:      { 痰湿: 2, 湿热: 0, 气虚: 1, 阳虚: 1, 阴虚: 0 },
    normal:     { 痰湿: 0, 湿热: 0, 气虚: 0, 阳虚: 0, 阴虚: 0 },
    fat_soft:   { 痰湿: 3, 湿热: 1, 气虚: 1, 阳虚: 0, 阴虚: 0 },
    medium:     { 痰湿: 1, 湿热: 2, 气虚: 1, 阳虚: 0, 阴虚: 0 },
    thin_cold:  { 痰湿: 0, 湿热: 0, 气虚: 2, 阳虚: 3, 阴虚: 0 },
    thin_insomnia: { 痰湿: 0, 湿热: 1, 气虚: 1, 阳虚: 0, 阴虚: 3 },
  };

  const totals = { 痰湿: 0, 湿热: 0, 气虚: 0, 阳虚: 0, 阴虚: 0 };
  answers.forEach((v) => {
    const scores = scoreMap[v] || {};
    for (const k in scores) totals[k] += scores[k];
  });

  let best = '痰湿';
  let bestScore = -1;
  for (const k in totals) {
    if (totals[k] > bestScore) { bestScore = totals[k]; best = k; }
  }
  return best;
};

// 社区帖子 Mock
window.MOCK_POSTS = [
  {
    id: 'p1',
    author: '青竹医友',
    avatarColor: 1,
    tag: '痰湿体质',
    time: '2 小时前',
    content: '坚持喝薏米赤小豆粥一个月了，配合每晚泡脚，确实感觉身体轻快了不少，舌苔也变薄了。中医调理真的急不得，慢慢来。',
    likes: 128,
    liked: false,
  },
  {
    id: 'p2',
    author: '山间小鹿',
    avatarColor: 2,
    tag: '饮食打卡',
    time: '4 小时前',
    content: '分享我的一日食谱：早餐小米南瓜粥+水煮蛋，午餐糙米饭+清炒西兰花+蒸鱼，晚餐山药排骨汤。痰湿体质真的不能碰奶茶和蛋糕！',
    likes: 86,
    liked: true,
  },
  {
    id: 'p3',
    author: '半夏时光',
    avatarColor: 3,
    tag: '舌诊心得',
    time: '昨天 21:30',
    content: '每次看自己的舌头都像在解读身体密码。最近齿痕变浅了，应该是健脾的方子起效了。强烈推荐陈皮泡水，便宜又好用。',
    likes: 245,
    liked: false,
  },
  {
    id: 'p4',
    author: '本草纲目',
    avatarColor: 4,
    tag: '运动调理',
    time: '昨天 17:12',
    content: '痰湿体质一定要动起来！八段锦、太极、慢跑都很好。我坚持每天 30 分钟，感觉湿气排出去后皮肤都变好了。',
    likes: 167,
    liked: false,
  },
  {
    id: 'p5',
    author: '橘井泉香',
    avatarColor: 5,
    tag: '体质辨识',
    time: '前天 09:05',
    content: '才做完测评，原来是湿热体质……怪不得我总长痘、口苦。决定从饮食开始调整，戒辣一周试试。',
    likes: 92,
    liked: false,
  },
  {
    id: 'p6',
    author: '采采芣苢',
    avatarColor: 1,
    tag: '穴位按摩',
    time: '3 天前',
    content: '痰湿体质可以常按丰隆穴（外膝眼与外踝连线中点）和足三里，每天 5 分钟，健脾化痰超有效。配图是我手绘的足三里位置。',
    likes: 312,
    liked: true,
  },
];

// 成就徽章
window.ACHIEVEMENTS = [
  { id: 'first', icon: '🌱', name: '初识体质', desc: '完成首次舌诊测评', check: (s) => !!s.report },
  { id: 'streak3', icon: '🔥', name: '三日连打', desc: '连续打卡 3 天', check: (s) => s.streak >= 3 },
  { id: 'streak7', icon: '⚡', name: '一周践行', desc: '连续打卡 7 天', check: (s) => s.streak >= 7 },
  { id: 'streak30', icon: '👑', name: '月度修身', desc: '连续打卡 30 天', check: (s) => s.streak >= 30 },
  { id: 'meals9', icon: '🍵', name: '三餐圆满', desc: '记录 9 餐饮食', check: (s) => s.totalMeals >= 9 },
  { id: 'share', icon: '💌', name: '分享达人', desc: '分享体质报告', check: (s) => s.shared },
  { id: 'like5', icon: '💬', name: '社区活跃', desc: '点赞 5 篇帖子', check: (s) => s.likedPosts >= 5 },
  { id: 'post1', icon: '✍️', name: '初次发声', desc: '发布第一篇帖子', check: (s) => s.myPosts >= 1 },
  { id: 'report30', icon: '📜', name: '资深调养', desc: '完成 30 天调理', check: (s) => false }, // 默认锁定
];

// 三餐对应的中医建议（基于痰湿体质）
window.MEAL_TCM_ADVICE = {
  breakfast: {
    title: '早餐（7:00 - 9:00 胃经当令）',
    icon: '🌅',
    tcm: '宜温热、易消化，唤醒脾胃。痰湿体质建议小米粥、山药、茯苓饼，忌牛奶+油腻。',
  },
  lunch: {
    title: '午餐（11:00 - 13:00 心经当令）',
    icon: '☀️',
    tcm: '营养丰富，七分饱。多食薏仁、冬瓜、鲫鱼，少糖少油，主食搭配粗粮。',
  },
  dinner: {
    title: '晚餐（17:00 - 19:00 肾经当令）',
    icon: '🌙',
    tcm: '清淡少量，七分饱即可。山药莲子汤、白萝卜汤最佳，睡前 3 小时完成。',
  },
};

// 三餐对应的他人经验（Mock）
window.MEAL_OTHERS_EXP = {
  breakfast: [
    { author: '青竹医友', text: '每天早上喝一碗小米南瓜粥，已经坚持半年，舌苔明显改善。' },
    { author: '山间小鹿', text: '推荐山药红枣糊，打成糊状超好喝，脾胃暖暖的。' },
  ],
  lunch: [
    { author: '半夏时光', text: '午餐一定要有绿色蔬菜，冬瓜汤+糙米饭是我常年的组合。' },
    { author: '本草纲目', text: '蒸鲈鱼代替红烧鱼，低脂高蛋白，痰湿体质非常友好。' },
  ],
  dinner: [
    { author: '橘井泉香', text: '晚餐一碗白萝卜汤，睡前胃不胀，早上排便特别顺畅。' },
    { author: '采采芣苢', text: '山药莲子百合汤是必备，少油少盐，痰湿体质救星。' },
  ],
};

// 拍摄引导步骤
window.GUIDE_STEPS = [
  {
    num: 1,
    title: '光线 · 自然柔和',
    desc: '选择自然光充足的室内环境，避免强光直射或昏暗光线',
    icon: 'light',
  },
  {
    num: 2,
    title: '角度 · 平视微仰',
    desc: '正对镜子，张嘴伸舌，舌面与镜头保持平行，微微上仰 15°',
    icon: 'angle',
  },
  {
    num: 3,
    title: '距离 · 15-20 厘米',
    desc: '让舌头完整出现在画面中，边缘留有适当空白便于 AI 识别',
    icon: 'distance',
  },
];

// 饱腹程度定义与评判标准
window.FULLNESS_LEVELS = [
  {
    value: 5,
    label: '五分饱',
    icon: '🍃',
    criteria: '胃中有物但不胀，停止进食后 1 小时内即感饥饿，仍能保持专注。',
    tcmNote: '适可而止，留有余地，脾胃运化最轻松。',
    theme: 'sage',
  },
  {
    value: 7,
    label: '七分饱',
    icon: '🌿',
    criteria: '胃里充实但不撑，进食欲望明显降低，下一餐前 30 分钟略感饿。',
    tcmNote: '中医养生推崇「七分饱」，减轻脾胃负担，气血运行通畅。',
    theme: 'apricot',
  },
  {
    value: 10,
    label: '十分饱',
    icon: '🍂',
    criteria: '胃部明显鼓胀，有撑感或轻微不适，甚至泛酸、犯困、不想活动。',
    tcmNote: '过饱伤脾，食积气滞，痰湿体质尤需避免。',
    theme: 'clay',
  },
];

// ===========================================
// 症状标签（药食同源食谱推荐）
// ===========================================
window.SYMPTOM_TAGS = [
  { id: 'acid', label: '嗳气反酸', keywords: ['嗳气', '反酸', '胃酸', '烧心'] },
  { id: 'weak', label: '虚弱无力', keywords: ['虚弱', '无力', '乏力', '疲倦', '没劲'] },
  { id: 'bloat', label: '腹胀', keywords: ['腹胀', '胀气', '胃胀', '撑'] },
  { id: 'insomnia', label: '失眠多梦', keywords: ['失眠', '多梦', '睡不着', '易醒'] },
  { id: 'bitter', label: '口苦口干', keywords: ['口苦', '口干', '口臭', '舌燥'] },
  { id: 'cold', label: '畏寒怕冷', keywords: ['怕冷', '畏寒', '手脚冰凉', '发冷'] },
  { id: 'phlegm', label: '痰多咳嗽', keywords: ['痰多', '咳嗽', '有痰', '白痰'] },
  { id: 'dizzy', label: '头晕目眩', keywords: ['头晕', '目眩', '头重', '昏沉'] },
  { id: 'dry', label: '皮肤干燥', keywords: ['皮肤干燥', '脱皮', '干痒'] },
  { id: 'pimple', label: '长痘出油', keywords: ['长痘', '出油', '痤疮', '粉刺'] },
];

// 药食同源食谱库
window.SYMPTOM_RECIPES = [
  {
    id: 'r1',
    name: '山药小米粥',
    tags: ['weak', 'bloat', 'acid'],
    constitutions: ['痰湿', '气虚', '阳虚'],
    ingredients: ['铁棍山药 100g', '小米 80g', '红枣 5 颗', '枸杞 10g'],
    effect: '健脾益气，和胃止泻。适合脾胃虚弱导致的乏力、腹胀、消化不良。',
    method: '山药去皮切小块，与淘净的小米、红枣同煮至粥稠，出锅前撒枸杞焖 5 分钟。',
    time: '早餐',
    icon: '🥣',
  },
  {
    id: 'r2',
    name: '陈皮茯苓茶',
    tags: ['phlegm', 'bloat', 'dizzy'],
    constitutions: ['痰湿'],
    ingredients: ['陈皮 5g', '茯苓 10g', '炒薏米 15g'],
    effect: '理气健脾，燥湿化痰。适合痰湿体质痰多、胸闷、头晕。',
    method: '所有材料洗净，加 500ml 水煮沸后转小火煮 20 分钟，代茶饮。',
    time: '全天',
    icon: '🍵',
  },
  {
    id: 'r3',
    name: '生姜红枣桂圆汤',
    tags: ['cold', 'weak'],
    constitutions: ['阳虚', '气虚'],
    ingredients: ['生姜 3 片', '红枣 6 颗', '桂圆肉 10g', '红糖适量'],
    effect: '温中散寒，补气养血。适合阳虚怕冷、气血不足。',
    method: '红枣去核，与生姜、桂圆加水煮沸后小火煮 15 分钟，加红糖调味。',
    time: '上午',
    icon: '☕',
  },
  {
    id: 'r4',
    name: '百合莲子银耳羹',
    tags: ['insomnia', 'dry', 'bitter'],
    constitutions: ['阴虚', '湿热'],
    ingredients: ['干银耳 10g', '百合 15g', '莲子 15g', '冰糖适量'],
    effect: '滋阴润肺，养心安神。适合阴虚火旺导致的失眠、口干、皮肤干燥。',
    method: '银耳泡发撕小朵，与百合、莲子加水炖至银耳出胶，加冰糖调味。',
    time: '晚餐',
    icon: '🍮',
  },
  {
    id: 'r5',
    name: '绿豆薏米冬瓜汤',
    tags: ['pimple', 'bitter', 'bloat'],
    constitutions: ['湿热', '痰湿'],
    ingredients: ['绿豆 30g', '薏米 20g', '冬瓜 200g', '陈皮 3g'],
    effect: '清热解毒，利湿消肿。适合湿热体质长痘、口苦、身体困重。',
    method: '绿豆薏米提前浸泡 1 小时，与冬瓜块、陈皮同煮 40 分钟至绿豆开花。',
    time: '午餐',
    icon: '🍲',
  },
  {
    id: 'r6',
    name: '黄芪党参炖鸡汤',
    tags: ['weak', 'cold', 'dizzy'],
    constitutions: ['气虚', '阳虚'],
    ingredients: ['土鸡半只', '黄芪 15g', '党参 10g', '红枣 5 颗', '生姜 3 片'],
    effect: '补中益气，升阳固表。适合气虚乏力、易感冒、头晕。',
    method: '鸡肉焯水，与药材一同放入砂锅，加水没过食材，大火煮沸后转小火炖 1.5 小时。',
    time: '午餐',
    icon: '🍗',
  },
  {
    id: 'r7',
    name: '白萝卜鲫鱼汤',
    tags: ['phlegm', 'bloat', 'acid'],
    constitutions: ['痰湿'],
    ingredients: ['鲫鱼 1 条', '白萝卜 200g', '生姜 3 片', '陈皮 3g'],
    effect: '健脾利湿，化痰消积。适合痰湿体质痰多、腹胀、消化不良。',
    method: '鲫鱼煎至两面金黄，加开水、姜片、陈皮煮沸，放入白萝卜丝煮 20 分钟。',
    time: '晚餐',
    icon: '🐟',
  },
  {
    id: 'r8',
    name: '菊花枸杞决明子茶',
    tags: ['bitter', 'pimple', 'dizzy'],
    constitutions: ['湿热', '阴虚'],
    ingredients: ['杭白菊 5g', '枸杞 10g', '决明子 10g'],
    effect: '清肝明目，降火解毒。适合肝火旺导致的口苦、长痘、头晕目赤。',
    method: '决明子干锅小火炒香，与菊花、枸杞一起用沸水冲泡，焖 10 分钟饮用。',
    time: '下午',
    icon: '🌼',
  },
  {
    id: 'r9',
    name: '黑芝麻核桃糊',
    tags: ['dry', 'insomnia', 'weak'],
    constitutions: ['阴虚', '气虚'],
    ingredients: ['黑芝麻 30g', '核桃仁 20g', '糯米 30g', '冰糖适量'],
    effect: '滋补肝肾，润肠通便。适合阴虚便秘、皮肤干燥、失眠健忘。',
    method: '黑芝麻、核桃、糯米炒香后打成粉，每次取 2 勺用开水冲调成糊。',
    time: '早餐',
    icon: '🥜',
  },
  {
    id: 'r10',
    name: '芡实薏仁排骨汤',
    tags: ['bloat', 'phlegm', 'weak'],
    constitutions: ['痰湿', '气虚'],
    ingredients: ['排骨 300g', '芡实 20g', '薏苡仁 20g', '山药 100g', '茯苓 10g'],
    effect: '健脾祛湿，益肾固精。适合脾虚湿盛导致的腹胀、痰多、疲倦。',
    method: '排骨焯水，与芡实、薏米、茯苓先煮 40 分钟，加山药块再煮 20 分钟。',
    time: '午餐',
    icon: '🍖',
  },
];

// ===========================================
// 评论交互区 - Mock 打卡与经验分享数据
// ===========================================
window.MOCK_INTERACTIONS = [
  {
    id: 'i1',
    type: 'checkin', // 打卡
    author: '青竹医友',
    avatarColor: 1,
    tag: '饮食打卡',
    time: '1 小时前',
    content: '今日三餐打卡：早 — 山药小米粥+水煮蛋；午 — 糙米饭+清蒸鲈鱼+冬瓜汤；晚 — 白萝卜排骨汤。七分饱，舌苔比上周薄了！',
    likes: 42,
    liked: false,
    comments: [
      { author: '山间小鹿', avatarColor: 2, text: '好自律！冬瓜汤我也经常喝，确实舒服。', time: '30 分钟前' },
      { author: '半夏时光', avatarColor: 3, text: '舌苔变薄是好现象，继续保持！', time: '15 分钟前' },
    ],
  },
  {
    id: 'i2',
    type: 'experience', // 经验分享
    author: '本草纲目',
    avatarColor: 4,
    tag: '调理心得',
    time: '3 小时前',
    content: '分享我的八段锦跟练一个月变化：1. 肩颈僵硬明显改善；2. 睡眠质量提升；3. 晨起精神好了很多。关键在于坚持，每天 15 分钟就够了。',
    likes: 89,
    liked: false,
    comments: [
      { author: '橘井泉香', avatarColor: 5, text: '八段锦确实好！我练了两周，晚上不再失眠了。', time: '2 小时前' },
    ],
  },
  {
    id: 'i3',
    type: 'checkin',
    author: '山间小鹿',
    avatarColor: 2,
    tag: '情志记录',
    time: '5 小时前',
    content: '今天用了怒胜思疗法，对着枕头大喊了三声，真的把纠结了一天的事放下了！然后推了 5 分钟肝经，整个人轻松好多。',
    likes: 67,
    liked: true,
    comments: [
      { author: '采采芣苢', avatarColor: 1, text: '怒胜思太有意思了！下次试试。', time: '4 小时前' },
      { author: '青竹医友', avatarColor: 1, text: '推肝经我每天都在做，配合深呼吸效果翻倍。', time: '3 小时前' },
    ],
  },
  {
    id: 'i4',
    type: 'experience',
    author: '半夏时光',
    avatarColor: 3,
    tag: '顺时养生',
    time: '昨天 20:15',
    content: '夏天多吃苦瓜、冬瓜、莲子心，少吃冰饮！虽然冰的吃着爽，但伤脾阳。改喝常温绿豆汤，既解暑又不伤身。',
    likes: 53,
    liked: false,
    comments: [],
  },
];

// ===========================================
// 当季得令食物推荐 - 四季数据
// ===========================================
window.SEASONAL_FOODS = {
  spring: {
    name: '春',
    icon: '🌸',
    months: '3-5 月',
    element: '木',
    organ: '肝',
    principle: '春生 · 疏肝理气，升发阳气',
    description: '春季万物生发，肝气最旺。饮食宜疏肝理气，少酸多甘，助阳气升发。忌辛辣燥热，以免肝火过旺。',
    foods: [
      { name: '春笋', emoji: '🎋', nature: '甘凉', effect: '清热化痰，利水消肿', tip: '焯水后凉拌或炒肉，鲜嫩爽口' },
      { name: '荠菜', emoji: '🥬', nature: '甘平', effect: '和脾利水，止血明目', tip: '做馅包饺子或煮蛋汤，春季必吃' },
      { name: '菊花', emoji: '🌼', nature: '甘苦微寒', effect: '疏风清热，平肝明目', tip: '泡茶代饮，配枸杞更佳' },
      { name: '菠菜', emoji: '🥗', nature: '甘凉', effect: '滋阴平肝，助消化', tip: '焯水去草酸后食用，补铁佳品' },
      { name: '大枣', emoji: '🫘', nature: '甘温', effect: '补中益气，养血安神', tip: '春日养肝佳品，可配山药煮粥' },
      { name: '薄荷', emoji: '🌿', nature: '辛凉', effect: '疏肝解郁，清利头目', tip: '泡茶或做凉菜，提神解郁' },
    ],
  },
  summer: {
    name: '夏',
    icon: '☀️',
    months: '6-8 月',
    element: '火',
    organ: '心',
    principle: '夏长 · 养心安神，清热解暑',
    description: '夏季心火旺盛，暑湿重。饮食宜清热解暑，养心安神，多食苦味入心。忌贪凉饮冷，以免损伤脾阳。',
    foods: [
      { name: '苦瓜', emoji: '🥒', nature: '苦寒', effect: '清热解毒，明目', tip: '凉拌或炒蛋，苦味入心清心火' },
      { name: '绿豆', emoji: '🫛', nature: '甘凉', effect: '清热解毒，消暑利水', tip: '煮汤或做糕，夏日必备' },
      { name: '莲子', emoji: '🪷', nature: '甘涩平', effect: '养心安神，补脾止泻', tip: '莲子心泡水清心火，去心煮粥养心' },
      { name: '西瓜', emoji: '🍉', nature: '甘寒', effect: '清热解暑，生津止渴', tip: '适量食用，痰湿体质不宜多食' },
      { name: '冬瓜', emoji: '🥒', nature: '甘淡微寒', effect: '清热利水，化痰', tip: '煮汤最佳，利湿消肿' },
      { name: '酸梅', emoji: '🫐', nature: '酸平', effect: '生津敛汗，消食', tip: '酸梅汤解暑生津，夏日常备' },
      { name: '丝瓜', emoji: '🥒', nature: '凉', effect: '清热化痰，凉血解毒', tip: '清炒或煮汤，清热不伤正' },
      { name: '茄子', emoji: '🍆', nature: '凉', effect: '清热活血，消肿止痛', tip: '蒸煮比油炸更适合夏季养生' },
      { name: '黄瓜', emoji: '🥒', nature: '凉', effect: '清热利水，生津止渴', tip: '凉拌生食，暑热烦渴时最宜' },
      { name: '番茄', emoji: '🍅', nature: '微寒', effect: '生津止渴，健胃消食', tip: '生食或做汤，补充维生素 C' },
      { name: '空心菜', emoji: '🥬', nature: '凉', effect: '清热凉血，利尿解毒', tip: '蒜蓉清炒，夏季时令青菜' },
      { name: '桃子', emoji: '🍑', nature: '温', effect: '生津润肠，活血消积', tip: '熟透的桃子养胃生津，不宜过食' },
      { name: '荔枝', emoji: '🔴', nature: '热', effect: '补脾益肝，养血安神', tip: '「一颗荔枝三把火」，痰湿体质少食' },
      { name: '龙眼', emoji: '🟤', nature: '温', effect: '补益心脾，养血安神', tip: '干品更佳，每日 5-8 颗为宜' },
      { name: '葡萄', emoji: '🍇', nature: '平', effect: '补气血，强筋骨，利小便', tip: '连皮食用更佳，益肝肾' },
    ],
  },
  autumn: {
    name: '秋',
    icon: '🍂',
    months: '9-11 月',
    element: '金',
    organ: '肺',
    principle: '秋收 · 滋阴润燥，养肺为先',
    description: '秋季气候干燥，肺气当令。饮食宜滋阴润燥，少辛多酸，养肺生津。忌辛辣燥热，以免加重秋燥。',
    foods: [
      { name: '梨', emoji: '🍐', nature: '甘微酸凉', effect: '生津润燥，清热化痰', tip: '生食或炖冰糖雪梨，润肺最佳' },
      { name: '银耳', emoji: '🍄', nature: '甘平', effect: '滋阴润肺，养胃生津', tip: '炖羹常食，秋季养肺圣品' },
      { name: '百合', emoji: '💮', nature: '甘微寒', effect: '润肺止咳，清心安神', tip: '煮粥或炖汤，安神润燥' },
      { name: '山药', emoji: '🥔', nature: '甘平', effect: '补脾养胃，生津益肺', tip: '蒸食或煮粥，补而不燥' },
      { name: '蜂蜜', emoji: '🍯', nature: '甘平', effect: '滋阴润燥，补中缓急', tip: '温水冲服，润肠通便' },
      { name: '芝麻', emoji: '🫘', nature: '甘平', effect: '补肝肾，润五脏', tip: '黑芝麻糊或撒粥上，滋补佳品' },
    ],
  },
  winter: {
    name: '冬',
    icon: '❄️',
    months: '12-2 月',
    element: '水',
    organ: '肾',
    principle: '冬藏 · 补肾固本，温阳御寒',
    description: '冬季万物闭藏，肾气当令。饮食宜温补肾脏，固本培元，温阳御寒。忌生冷寒凉，以免损伤肾阳。',
    foods: [
      { name: '羊肉', emoji: '🥩', nature: '甘温', effect: '温中补虚，御寒保暖', tip: '当归生姜羊肉汤，冬日第一补' },
      { name: '黑豆', emoji: '🫘', nature: '甘平', effect: '补肾益阴，活血利水', tip: '煮粥或打豆浆，黑色入肾' },
      { name: '核桃', emoji: '🌰', nature: '甘温', effect: '补肾固精，温肺定喘', tip: '每日 3-5 颗，补脑健肾' },
      { name: '桂圆', emoji: '🫒', nature: '甘温', effect: '补心脾，益气血', tip: '红枣桂圆茶，温补气血' },
      { name: '生姜', emoji: '🫚', nature: '辛温', effect: '温中散寒，回阳通脉', tip: '冬日必备，配红枣煮水驱寒' },
      { name: '板栗', emoji: '🌰', nature: '甘温', effect: '补肾强筋，活血止血', tip: '炖鸡或糖炒，冬令补肾佳品' },
    ],
  },
};

// 获取当前季节
window.getCurrentSeason = function() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
};

// ===========================================
// 情志记录 - 七情数据与情志相胜疗法
// ===========================================
window.EMOTIONS = [
  {
    id: 'joy',
    name: '喜',
    icon: '😊',
    color: '#D4A574',
    description: '过度喜乐会使心气涣散，精神不集中',
    organ: '心',
    overcomes: '恐胜喜',
    overcomeDesc: '恐为水之志，水克火。以适度的敬畏和谨慎收敛过度兴奋的心气。可以回忆一些需要认真对待的事，或阅读警示性的文章，让心气收敛归位。',
    acupressure: [
      { name: '内关穴', location: '腕横纹上 2 寸，两筋之间', method: '拇指按揉 3 分钟，双侧交替', effect: '宁心安神，和胃降逆' },
      { name: '神门穴', location: '腕横纹尺侧端，尺侧腕屈肌腱桡侧凹陷中', method: '拇指点按 2 分钟', effect: '补益心气，安定心神' },
    ],
    meridian: '手少阴心经：从腋下沿臂内侧后缘至小指，每日推揉 5 分钟可宁心安神。',
    foodAdvice: '莲子、百合、小麦、酸枣仁',
  },
  {
    id: 'anger',
    name: '怒',
    icon: '😤',
    color: '#A14A4A',
    description: '愤怒伤肝，肝气上逆，头痛眩晕、面红目赤',
    organ: '肝',
    overcomes: '悲胜怒',
    overcomeDesc: '悲为金之志，金克木。以悲悯之心化解愤怒。回想生命中的柔软时刻，看一部感人的电影，让悲伤之情柔化肝气的刚暴。',
    acupressure: [
      { name: '太冲穴', location: '足背第 1、2 跖骨结合部前方凹陷中', method: '拇指用力按揉 3 分钟', effect: '平肝息风，疏肝理气' },
      { name: '期门穴', location: '乳头直下第 6 肋间隙', method: '掌根揉按 2 分钟', effect: '疏肝理气，和胃降逆' },
    ],
    meridian: '足厥阴肝经：从大敦（足大趾）沿腿内侧上行至胁肋，每日推揉可疏肝解郁。',
    foodAdvice: '菊花、决明子、芹菜、苦瓜',
  },
  {
    id: 'worry',
    name: '思',
    icon: '🤔',
    color: '#8FA68E',
    description: '思虑过度伤脾，气结不行，食欲不振、腹胀便溏',
    organ: '脾',
    overcomes: '怒胜思',
    overcomeDesc: '怒为木之志，木克土。当陷入内耗思虑时，允许自己愤怒！对着枕头大喊，或做高强度运动释放怒气，以怒气冲破思虑的纠结。怒气一过，思虑自消。',
    acupressure: [
      { name: '足三里', location: '外膝眼下 3 寸，胫骨外侧约 1 横指', method: '拇指按揉 5 分钟，力度以酸胀为度', effect: '健脾和胃，扶正培元' },
      { name: '公孙穴', location: '足内侧第 1 跖骨基底部前下方', method: '拇指按揉 3 分钟', effect: '健脾化湿，和胃理气' },
    ],
    meridian: '足太阴脾经：从隐白（足大趾内侧）沿腿内侧上行至腹，每日推揉可健脾化湿。',
    foodAdvice: '山药、茯苓、陈皮、薏苡仁',
  },
  {
    id: 'grief',
    name: '悲',
    icon: '😢',
    color: '#6B8E9B',
    description: '悲伤过度伤肺，肺气消耗，气短乏力、意志消沉',
    organ: '肺',
    overcomes: '喜胜悲',
    overcomeDesc: '喜为火之志，火克金。用喜悦驱散悲伤。和朋友聊天、看喜剧、做让自己开心的事。笑是治悲伤最好的药，开怀大笑能让肺气重新舒展。',
    acupressure: [
      { name: '膻中穴', location: '两乳头连线中点', method: '掌根揉按 3 分钟或擦热', effect: '宽胸理气，舒畅心胸' },
      { name: '列缺穴', location: '桡骨茎突上方，腕横纹上 1.5 寸', method: '拇指按揉 2 分钟', effect: '宣肺理气，疏风解表' },
    ],
    meridian: '手太阴肺经：从中府（锁骨下）沿臂内侧前缘至大指，每日推揉可宣肺理气。',
    foodAdvice: '银耳、百合、梨、蜂蜜',
  },
  {
    id: 'fear',
    name: '恐',
    icon: '😰',
    color: '#7B6B8D',
    description: '恐惧伤肾，肾气不固，腰膝酸软、二便失禁',
    organ: '肾',
    overcomes: '思胜恐',
    overcomeDesc: '思为土之志，土克水。以理性思考战胜恐惧。分析恐惧的根源，制定应对计划，把未知变成已知。当你想明白了，恐惧自然消散。',
    acupressure: [
      { name: '涌泉穴', location: '足底前 1/3 凹陷中', method: '掌根搓擦至发热，每晚睡前', effect: '补肾固本，安神定志' },
      { name: '太溪穴', location: '内踝尖与跟腱之间凹陷中', method: '拇指按揉 3 分钟', effect: '滋补肾阴，温补肾阳' },
    ],
    meridian: '足少阴肾经：从涌泉（足底）沿腿内侧上行至腹，每日推揉可补肾固本。',
    foodAdvice: '黑豆、核桃、枸杞、山药',
  },
  {
    id: 'shock',
    name: '惊',
    icon: '😱',
    color: '#B85B5B',
    description: '惊骇伤心肾，心神不定，心悸失眠、坐立不安',
    organ: '心肾',
    overcomes: '思胜惊',
    overcomeDesc: '与恐类似，以理性思维安定心神。坐下来写下让你惊慌的事，逐一分析，从混乱中理出头绪。深呼吸，让理性重新主导。',
    acupressure: [
      { name: '百会穴', location: '头顶正中，两耳尖连线中点', method: '中指按揉 2 分钟，力度轻柔', effect: '醒脑安神，升阳举陷' },
      { name: '印堂穴', location: '两眉头连线中点', method: '食指按揉 2 分钟', effect: '宁神开窍，疏风清热' },
    ],
    meridian: '督脉：从长强（尾骨端）沿脊柱上行至百会（头顶），拍打督脉可振奋阳气、安神定志。',
    foodAdvice: '酸枣仁、莲子、龙眼肉、小麦',
  },
];

// ===========================================
// 中医健身运动跟练
// ===========================================
window.TCM_EXERCISES = [
  {
    id: 'baduanjin',
    name: '八段锦',
    icon: '🧘',
    duration: '15 分钟',
    difficulty: '入门',
    description: '八段锦是中医传统导引术，由八个动作组成，每个动作对应一条经络和脏腑，简单易学，老少咸宜。',
    benefits: ['疏肝理气', '调理脾胃', '固肾壮腰', '畅通气血'],
    steps: [
      { name: '两手托天理三焦', organ: '三焦', desc: '双手交叉上托，如托天状，拉伸全身筋骨' },
      { name: '左右开弓似射雕', organ: '肺', desc: '左右拉弓，扩胸展臂，宣发肺气' },
      { name: '调理脾胃须单举', organ: '脾胃', desc: '一手上托一下按，调理中焦升降' },
      { name: '五劳七伤往后瞧', organ: '五脏', desc: '转头后看，活动颈肩，疏理五脏气血' },
      { name: '摇头摆尾去心火', organ: '心', desc: '下蹲摆动，降心火、安神志' },
      { name: '两手攀足固肾腰', organ: '肾', desc: '前屈后仰，固肾壮腰' },
      { name: '攒拳怒目增气力', organ: '肝', desc: '握拳怒目，疏肝理气，增强筋力' },
      { name: '背后七颠百病消', organ: '全身', desc: '踮脚颠落，震动全身，调和气血' },
    ],
  },
  {
    id: 'wuqinxi',
    name: '五禽戏',
    icon: '🐯',
    duration: '25 分钟',
    difficulty: '进阶',
    description: '五禽戏由华佗创编，模仿虎、鹿、熊、猿、鸟五种动物的神态与动作，对应五脏调理，动静结合。',
    benefits: ['强筋健骨', '疏通经络', '调养五脏', '延年益寿'],
    steps: [
      { name: '虎戏 · 威风凛凛', organ: '肝', desc: '模仿虎扑、虎爪，疏肝理气，强筋健骨' },
      { name: '鹿戏 · 轻捷灵动', organ: '肾', desc: '模仿鹿奔、鹿抵，固肾壮腰，灵活关节' },
      { name: '熊戏 · 沉稳厚重', organ: '脾', desc: '模仿熊步、熊晃，健脾化湿，稳固下盘' },
      { name: '猿戏 · 敏捷聪慧', organ: '心', desc: '模仿猿摘、猿闪，养心安神，灵活上肢' },
      { name: '鸟戏 · 展翅高飞', organ: '肺', desc: '模仿鸟伸、鸟飞，宣肺理气，舒展胸廓' },
    ],
  },
  {
    id: 'taiji',
    name: '太极',
    icon: '☯️',
    duration: '30 分钟',
    difficulty: '进阶',
    description: '太极拳以柔克刚，以静制动，动静相兼。通过缓慢连贯的动作配合呼吸，调和阴阳，疏通经络，养气安神。',
    benefits: ['调和阴阳', '疏通经络', '养气安神', '平衡身心'],
    steps: [
      { name: '起势', organ: '全身', desc: '双脚并立，沉肩坠肘，气沉丹田' },
      { name: '野马分鬃', organ: '肺', desc: '左右分掌，如野马鬃毛飘动，宣肺理气' },
      { name: '白鹤亮翅', organ: '心', desc: '展翅亮掌，心胸开阔，养心安神' },
      { name: '搂膝拗步', organ: '肝', desc: '搂膝推掌，疏肝理气' },
      { name: '云手', organ: '脾', desc: '双手如云流转，健脾化湿' },
      { name: '收势', organ: '全身', desc: '气归丹田，身心合一' },
    ],
  },
];
