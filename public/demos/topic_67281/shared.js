/* 不三迁 · 共享数据模块
   包含：知识图谱、学生画像、兴趣画像、记忆系统、间隔重复队列、性格向量
   两端APP共享同一数据源（LocalStorage持久化）
*/

/* ===== 知识图谱 ===== */
const KnowledgeGraph = {
  // 实体 → 知识点
  entities: {
    'book': { name: '书本', knowledge: ['造纸术', '印刷术', '文学阅读'], subject: '历史' },
    'bottle': { name: '水瓶', knowledge: ['大气压强', '流体力学'], subject: '物理' },
    'cat': { name: '猫咪', knowledge: ['角动量守恒', '动物脊柱力学', '协同进化'], subject: '生物' },
    'dog': { name: '狗狗', knowledge: ['协同进化', '动物行为学'], subject: '生物' },
    'chair': { name: '椅子', knowledge: ['人体工学', '压强分布'], subject: '物理' },
    'table': { name: '桌子', knowledge: ['三角形稳定性', '结构力学'], subject: '物理' },
    'laptop': { name: '笔记本电脑', knowledge: ['CPU频率', '半导体原理', '二进制'], subject: '信息技术' },
    'cell phone': { name: '手机', knowledge: ['电磁波', '通信代际', '无线电'], subject: '物理' },
    'tv': { name: '电视', knowledge: ['光的三原色', '像素原理', 'LED显示'], subject: '物理' },
    'car': { name: '汽车', knowledge: ['能量守恒', '内燃机', '摩擦力'], subject: '物理' },
    'bicycle': { name: '自行车', knowledge: ['陀螺效应', '角动量守恒', '杠杆原理'], subject: '物理' },
    'person': { name: '人', knowledge: ['骨骼杠杆系统', '细胞分工', '肌肉力学'], subject: '生物' },
    'tree': { name: '树', knowledge: ['光合作用', '碳循环', '年轮'], subject: '生物' },
    'flower': { name: '花', knowledge: ['花青素酸碱变色', '授粉机制', '植物繁殖'], subject: '生物' },
    'cup': { name: '杯子', knowledge: ['圆形容器优化', '表面张力'], subject: '数学' },
    'spoon': { name: '勺子', knowledge: ['杠杆原理', '力矩平衡'], subject: '物理' },
    'clock': { name: '钟', knowledge: ['石英晶体振动', '日晷原理', '时间测量'], subject: '物理' },
    'keyboard': { name: '键盘', knowledge: ['电路开关', '字符编码', '输入输出'], subject: '信息技术' },
    'mouse': { name: '鼠标', knowledge: ['光学传感器', '位移计算', '光电转换'], subject: '信息技术' },
    'bowl': { name: '碗', knowledge: ['表面积与散热', '热传导'], subject: '物理' },
  },

  // 兴趣锚点 → 知识点
  interests: {
    'minecraft': { name: '我的世界', bridges: { '红石电路': '并联电路', '建筑搭建': '结构力学', '矿物分布': '地质学' } },
    'genshin': { name: '原神', bridges: { '璃月港': '宋代贸易', '元素反应': '化学反应', '地图探索': '地理学' } },
    'threebody': { name: '三体', bridges: { '黑暗森林': '博弈论', '降维打击': '维度概念', '智子': '量子力学' } },
    'lego': { name: '乐高', bridges: { '齿轮传动': '机械传动', '结构稳定': '工程力学', '对称设计': '几何学' } },
  },

  // 知识点详情
  knowledge: {
    '造纸术': { subject: '历史', difficulty: 2, ageMin: 6, desc: '公元105年蔡伦改进造纸术，中国古代四大发明之一。' },
    '印刷术': { subject: '历史', difficulty: 2, ageMin: 6, desc: '毕昇发明活字印刷术，让知识传播成本大幅降低。' },
    '光合作用': { subject: '生物', difficulty: 3, ageMin: 9, desc: '植物利用光能将二氧化碳和水转化为葡萄糖，释放氧气。' },
    '能量守恒': { subject: '物理', difficulty: 4, ageMin: 12, desc: '能量不会凭空产生或消失，只会从一种形式转化为另一种。' },
    '并联电路': { subject: '物理', difficulty: 3, ageMin: 12, desc: '并联电路中各支路电压相等，一条断开不影响其他。' },
    '杠杆原理': { subject: '物理', difficulty: 2, ageMin: 9, desc: '动力×动力臂=阻力×阻力臂，支点位置决定省力程度。' },
    '三角形稳定性': { subject: '数学', difficulty: 1, ageMin: 6, desc: '三角形三边确定后形状唯一，是最稳定的几何结构。' },
    '电磁波': { subject: '物理', difficulty: 4, ageMin: 13, desc: '变化的电场产生磁场，变化的磁场产生电场，形成电磁波。' },
    '角动量守恒': { subject: '物理', difficulty: 5, ageMin: 15, desc: '不受外力矩时，旋转物体的角动量保持不变。' },
    '光的三原色': { subject: '物理', difficulty: 2, ageMin: 8, desc: '红、绿、蓝三种光按不同比例混合可产生各种颜色。' },
    '陀螺效应': { subject: '物理', difficulty: 4, ageMin: 13, desc: '旋转的物体有保持原来方向的倾向，转速越快越稳定。' },
    '花青素酸碱变色': { subject: '生物', difficulty: 3, ageMin: 10, desc: '花青素遇酸变红，遇碱变蓝，是天然的酸碱指示剂。' },
    '石英晶体振动': { subject: '物理', difficulty: 4, ageMin: 13, desc: '石英晶体通电后以稳定频率振动，是钟表计时的核心。' },
    'CPU频率': { subject: '信息技术', difficulty: 3, ageMin: 10, desc: 'CPU频率表示每秒执行的时钟周期数，如2.5GHz=25亿次/秒。' },
    '协同进化': { subject: '生物', difficulty: 3, ageMin: 12, desc: '两个物种在漫长岁月里互相适应、共同进化的现象。' },
    '骨骼杠杆系统': { subject: '生物', difficulty: 3, ageMin: 10, desc: '人体运动时骨骼是杠杆，肌肉提供动力，关节是支点。' },
    '碳循环': { subject: '生物', difficulty: 4, ageMin: 12, desc: '碳元素在大气、生物、土壤和海洋之间循环流动。' },
    '大气压强': { subject: '物理', difficulty: 3, ageMin: 11, desc: '大气受重力产生压强，约101325帕斯卡。' },
    '人体工学': { subject: '物理', difficulty: 3, ageMin: 12, desc: '研究人体与工具环境的适配，减少疲劳和损伤。' },
    '二进制': { subject: '信息技术', difficulty: 2, ageMin: 8, desc: '计算机用0和1表示所有信息，逢2进1。' },
    '文学阅读': { subject: '语文', difficulty: 2, ageMin: 6, desc: '通过阅读文学作品培养理解力、想象力和共情能力。' },
    '流体力学': { subject: '物理', difficulty: 4, ageMin: 13, desc: '研究流体（液体和气体）的受力与运动规律。' },
    '动物脊柱力学': { subject: '生物', difficulty: 4, ageMin: 14, desc: '动物脊柱的结构使其在奔跑跳跃时能有效缓冲和传递力量。' },
    '动物行为学': { subject: '生物', difficulty: 3, ageMin: 10, desc: '研究动物在自然条件下的行为模式及其进化意义。' },
    '压强分布': { subject: '物理', difficulty: 3, ageMin: 11, desc: '压力作用在接触面上产生的压强与面积成反比，面积越大压强越小。' },
    '结构力学': { subject: '物理', difficulty: 4, ageMin: 13, desc: '研究结构在载荷作用下的受力、变形和稳定性。' },
    '半导体原理': { subject: '信息技术', difficulty: 4, ageMin: 14, desc: '半导体材料导电性介于导体和绝缘体之间，是芯片的基础。' },
    '通信代际': { subject: '信息技术', difficulty: 2, ageMin: 8, desc: '移动通信从1G到5G，每代速度更快、延迟更低、连接更多。' },
    '无线电': { subject: '物理', difficulty: 3, ageMin: 11, desc: '利用电磁波在空间中传输信息，无需物理导线。' },
    '像素原理': { subject: '物理', difficulty: 2, ageMin: 8, desc: '屏幕由大量小发光点（像素）组成，每个像素可独立显示颜色。' },
    'LED显示': { subject: '物理', difficulty: 3, ageMin: 10, desc: 'LED是发光二极管，通电后直接将电能转化为光，效率高寿命长。' },
    '内燃机': { subject: '物理', difficulty: 4, ageMin: 13, desc: '燃料在气缸内燃烧产生高温高压气体推动活塞，将热能转为机械能。' },
    '摩擦力': { subject: '物理', difficulty: 2, ageMin: 8, desc: '两个接触面相对运动时产生的阻碍力，分静摩擦和动摩擦。' },
    '细胞分工': { subject: '生物', difficulty: 3, ageMin: 10, desc: '多细胞生物中不同细胞分化为不同形态，执行不同功能。' },
    '肌肉力学': { subject: '生物', difficulty: 4, ageMin: 13, desc: '肌肉通过肌纤维收缩产生力，其效率与杠杆系统配合决定。' },
    '年轮': { subject: '生物', difficulty: 1, ageMin: 6, desc: '树木每年生长一圈，年轮的宽窄记录了当年的气候条件。' },
    '授粉机制': { subject: '生物', difficulty: 2, ageMin: 8, desc: '植物通过风、昆虫等方式传播花粉，完成有性繁殖。' },
    '植物繁殖': { subject: '生物', difficulty: 2, ageMin: 7, desc: '植物可通过种子、孢子、扦插等多种方式繁衍后代。' },
    '圆形容器优化': { subject: '数学', difficulty: 2, ageMin: 9, desc: '相同周长下圆形面积最大，容器用圆形最省材料。' },
    '表面张力': { subject: '物理', difficulty: 3, ageMin: 11, desc: '液体表面分子间吸引力使表面像一层弹性薄膜。' },
    '力矩平衡': { subject: '物理', difficulty: 3, ageMin: 11, desc: '顺时针力矩等于逆时针力矩时，物体处于平衡状态。' },
    '日晷原理': { subject: '物理', difficulty: 2, ageMin: 7, desc: '利用太阳投影方向变化来计时的古代仪器。' },
    '时间测量': { subject: '物理', difficulty: 2, ageMin: 8, desc: '从日晷到原子钟，人类用越来越精确的工具测量时间。' },
    '电路开关': { subject: '信息技术', difficulty: 1, ageMin: 7, desc: '开关控制电路通断，是计算机最基础的控制元件。' },
    '字符编码': { subject: '信息技术', difficulty: 3, ageMin: 10, desc: '用数字代表字符，如ASCII用65代表大写字母A。' },
    '输入输出': { subject: '信息技术', difficulty: 1, ageMin: 6, desc: '计算机接收数据（输入）并返回结果（输出）的基本过程。' },
    '光学传感器': { subject: '信息技术', difficulty: 3, ageMin: 11, desc: '通过光学原理检测物体位置或移动的器件，鼠标就是一例。' },
    '位移计算': { subject: '数学', difficulty: 2, ageMin: 9, desc: '通过位置变化量计算移动距离，是运动分析的基础。' },
    '光电转换': { subject: '物理', difficulty: 4, ageMin: 13, desc: '光信号与电信号相互转换，是通信和显示技术的核心。' },
    '表面积与散热': { subject: '物理', difficulty: 3, ageMin: 11, desc: '物体表面积越大散热越快，碗的宽口设计利于热量散发。' },
    '热传导': { subject: '物理', difficulty: 2, ageMin: 9, desc: '热量从高温部分传向低温部分，金属导热性好于非金属。' },
  },

  query(entityClass) {
    const entity = this.entities[entityClass];
    if (!entity) return null;
    return {
      entity: entity.name,
      subject: entity.subject,
      knowledgePoints: entity.knowledge.map(k => ({
        name: k,
        detail: this.knowledge[k]
      }))
    };
  },

  bridgeWithInterest(entityClass, interestKey) {
    const result = this.query(entityClass);
    if (!result) return null;
    const interest = this.interests[interestKey];
    if (interest) {
      result.interestBridge = interest.name;
      result.bridges = interest.bridges;
    }
    return result;
  }
};

/* ===== 学生画像 ===== */
const StudentProfile = {
  name: '小明',
  age: 12,
  stage: '基础期', // 6-8启蒙期 / 9-12基础期 / 13-15深化期 / 16-18冲刺期

  // 学科掌握度
  subjects: {
    '语文': { score: 82, trend: '→', genius: false },
    '数学': { score: 88, trend: '↑', genius: false },
    '英语': { score: 79, trend: '↑', genius: false },
    '物理': { score: 91, trend: '↑↑', genius: true },
    '历史': { score: 74, trend: '↓', genius: false },
    '生物': { score: 86, trend: '↑', genius: false },
  },

  // 六维能力
  abilities: {
    '推理力': 82, '创造力': 75, '空间力': 90,
    '记忆力': 78, '观察力': 85, '计算力': 88
  },

  // 定性评价
  qualitative: {
    '品行': 88, '能力': 82, '成绩': 85,
    '表现': 80, '特长': 78, '潜能': 84
  },

  // 兴趣画像
  interests: ['minecraft', 'lego', 'threebody'],

  // 薄弱学科（自动计算）
  get weakSubjects() {
    return Object.entries(this.subjects)
      .filter(([_, v]) => v.score < 80 && !v.genius)
      .sort((a, b) => a[1].score - b[1].score)
      .map(([k]) => k);
  },

  // 天才学科
  get geniusSubjects() {
    return Object.entries(this.subjects).filter(([_, v]) => v.genius).map(([k]) => k);
  },

  // 学习风格
  learningStyle: 'visual', // visual / auditory / kinesthetic

  // 性格倾向
  personalityType: 'curious', // curious / steady / creative / social
};

/* ===== AI搭子性格向量 ===== */
const Personality = {
  // 6维向量 (0-1)
  vector: {
    warmth: 0.8,
    humor: 0.6,
    patience: 0.9,
    proactivity: 0.5,
    formality: 0.3,
    curiosity: 0.7
  },

  // 安全边界
  bounds: {
    warmth: { min: 0.5, max: 1.0 },
    humor: { min: 0.0, max: 1.0 },
    patience: { min: 0.7, max: 1.0 },
    proactivity: { min: 0.0, max: 1.0 },
    formality: { min: 0.0, max: 0.6 },
    curiosity: { min: 0.0, max: 1.0 }
  },

  // 锁定状态（家长可锁定）
  locked: {},

  // 演化更新
  evolve(dimension, signal) {
    if (this.locked[dimension]) return;
    const bound = this.bounds[dimension];
    if (!bound) return;
    const lr = 0.02; // 学习率
    if (signal === 'positive') {
      this.vector[dimension] = Math.min(bound.max, this.vector[dimension] + lr);
    } else if (signal === 'negative') {
      this.vector[dimension] = Math.max(bound.min, this.vector[dimension] - lr * 1.5);
    }
    this.save();
  },

  // 获取话术风格
  getStyle() {
    const v = this.vector;
    if (v.humor > 0.7 && v.warmth > 0.7) return 'playful';
    if (v.formality > 0.5) return 'formal';
    if (v.curiosity > 0.7) return 'curious';
    return 'balanced';
  },

  save() {
    localStorage.setItem('bsq_personality', JSON.stringify(this.vector));
  },

  load() {
    const saved = localStorage.getItem('bsq_personality');
    if (saved) {
      try { Object.assign(this.vector, JSON.parse(saved)); } catch(e) {}
    }
  }
};

/* ===== 间隔重复队列（艾宾浩斯） ===== */
const SpacedRepetition = {
  // 复习队列
  queue: [],

  // 4轮复习时间节点（小时）
  intervals: [0, 8, 72, 168], // 首次 / 当天晚间 / 3天后 / 7天后

  add(knowledge, scene) {
    const item = {
      id: 'k_' + Date.now(),
      knowledge: knowledge,
      scene: scene,
      createdAt: Date.now(),
      round: 0,
      nextReview: Date.now(),
      strength: 1.0, // 记忆强度
      history: []
    };
    this.queue.push(item);
    this.save();
    return item;
  },

  // 获取待复习项
  getDue() {
    const now = Date.now();
    return this.queue.filter(item => item.nextReview <= now && item.round < 4);
  },

  // 标记复习结果
  review(itemId, result) {
    const item = this.queue.find(i => i.id === itemId);
    if (!item) return;
    item.round++;
    item.history.push({ time: Date.now(), result: result });
    if (result === 'correct') {
      item.strength *= 2.0;
    } else if (result === 'partial') {
      item.strength *= 1.2;
    } else {
      item.strength = Math.max(item.strength * 0.5, 1.0);
    }
    if (item.round < 4) {
      let interval = this.intervals[item.round];
      // 根据复习结果调整间隔：忘了缩短到一半，部分记得不变，完全记得延长1.5倍
      if (result === 'forgot') {
        interval = Math.max(interval * 0.5, 1);
        item.round = Math.max(0, item.round - 1); // 忘了不进入下一轮
      } else if (result === 'correct') {
        interval = interval * 1.5;
      }
      item.nextReview = Date.now() + interval * 3600 * 1000;
    }
    this.save();
  },

  save() {
    localStorage.setItem('bsq_sr_queue', JSON.stringify(this.queue));
  },

  load() {
    const saved = localStorage.getItem('bsq_sr_queue');
    if (saved) {
      try { this.queue = JSON.parse(saved); } catch(e) { this.queue = []; }
    }
    // 添加示例数据（首次使用）
    if (this.queue.length === 0) {
      this.add('光合作用', '户外观察树木');
      this.add('并联电路', '游戏红石电路');
      this.add('能量守恒', '观察汽车');
    }
  }
};

/* ===== 记忆系统 ===== */
const Memory = {
  // 情景记忆（近90天互动事件）
  episodes: [],

  // 语义记忆（学生稳定特征摘要）
  semantic: [],

  // 添加情景记忆
  addEpisode(event) {
    const episode = {
      id: 'e_' + Date.now(),
      timestamp: Date.now(),
      scene: event.scene || '',
      topic: event.topic || '',
      knowledge: event.knowledge || '',
      response: event.response || 'neutral', // positive / negative / neutral
      emotion: event.emotion || 'neutral',
      duration: event.duration || 0,
      followUp: event.followUp || false
    };
    this.episodes.push(episode);
    // 保留90天
    const cutoff = Date.now() - 90 * 24 * 3600 * 1000;
    this.episodes = this.episodes.filter(e => e.timestamp > cutoff);
    this.save();
    return episode;
  },

  // 检索相关记忆
  retrieve(context, topK = 3) {
    const contextLower = (context || '').toLowerCase();
    return this.episodes
      .filter(e => {
        const text = (e.topic + e.knowledge + e.scene).toLowerCase();
        return contextLower.split(/\s+/).some(word => word.length > 1 && text.includes(word));
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, topK);
  },

  // 获取今日动态
  getToday() {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    return this.episodes.filter(e => e.timestamp >= todayStart);
  },

  save() {
    localStorage.setItem('bsq_memory', JSON.stringify(this.episodes));
  },

  load() {
    const saved = localStorage.getItem('bsq_memory');
    if (saved) {
      try { this.episodes = JSON.parse(saved); } catch(e) { this.episodes = []; }
    }
    // 添加示例数据
    if (this.episodes.length === 0) {
      const now = Date.now();
      this.episodes = [
        { id: 'e1', timestamp: now - 2*3600*1000, scene: '通勤', topic: '宋代古塔', knowledge: '宋代建筑', response: 'positive', emotion: 'curious', duration: 180, followUp: true },
        { id: 'e2', timestamp: now - 4*3600*1000, scene: '课间', topic: '数学题讨论', knowledge: '一元二次方程', response: 'positive', emotion: 'engaged', duration: 300, followUp: true },
        { id: 'e3', timestamp: now - 6*3600*1000, scene: '学习', topic: '物理专注', knowledge: '能量守恒', response: 'neutral', emotion: 'focused', duration: 2520, followUp: false },
      ];
      this.save();
    }
  }
};

/* ===== 场景引擎 ===== */
const SceneEngine = {
  // 学生参与度状态机
  states: {
    DEEP_FOCUS: { name: '深度专注', canIntervene: false },
    LIGHT_TASK: { name: '轻量任务', canIntervene: true, priority: 'low' },
    TRANSITION: { name: '任务切换', canIntervene: true, priority: 'high' },
    BORED: { name: '无聊发呆', canIntervene: true, priority: 'high' },
    FRUSTRATED: { name: '挫败烦躁', canIntervene: true, priority: 'high', mode: 'comfort' }
  },

  // 频率控制
  lastIntervention: 0,
  interventionCount: 0,
  ignoreStreak: 0,
  cooldownUntil: 0,

  // 仲裁器优先级
  priority: {
    P0: '安全',
    P1: '健康',
    P2: '场景+兴趣协同',
    P3: '单引擎'
  },

  // 判断是否可以干预
  canIntervene(currentState) {
    const now = Date.now();
    // 冷却期
    if (now < this.cooldownUntil) return { can: false, reason: '冷却中（连续忽略）' };
    // 频率抑制：距上次<15分钟
    if (now - this.lastIntervention < 15 * 60 * 1000) return { can: false, reason: '距上次话题不足15分钟' };
    // 日上限
    if (this.interventionCount >= 20) return { can: false, reason: '今日已达上限' };
    // 状态判断
    const state = this.states[currentState];
    if (!state || !state.canIntervene) return { can: false, reason: (state && state.name ? state.name : '未知') + '状态不适合干预' };
    return { can: true, state };
  },

  // 内容选择评分
  scoreKnowledge(knowledge, entityClass, studentProfile) {
    let score = 0;
    // 关联度 (0.25)
    score += 0.25 * 0.9;
    // 兴趣桥接 (0.30)
    score += 0.30 * 0.7;
    // 薄弱学科加权 (0.20) - 弱科1.5x
    const subject = knowledge.detail?.subject;
    const weakBoost = studentProfile.weakSubjects.includes(subject) ? 1.5 : 1.0;
    score += 0.20 * weakBoost;
    // 新鲜度 (0.15) - 近期未讲过
    const recent = Memory.episodes.filter(e => e.knowledge === knowledge.name).length;
    score += 0.15 * Math.max(0, 1 - recent * 0.3);
    // 年龄适配 (0.10)
    score += 0.10 * (knowledge.detail && knowledge.detail.ageMin <= studentProfile.age ? 1 : 0.5);
    return score;
  },

  // 参与度预测
  predictEngagement(state, topic) {
    let score = 0.5;
    if (state === 'TRANSITION') score += 0.2;
    if (state === 'BORED') score += 0.15;
    if (state === 'FRUSTRATED') score -= 0.2;
    // 历史接受率
    const recent = Memory.episodes.slice(-10);
    const positiveRate = recent.length > 0
      ? recent.filter(e => e.response === 'positive').length / recent.length
      : 0.5;
    score += positiveRate * 0.15;
    // 忽略连击惩罚
    score -= this.ignoreStreak * 0.1;

    if (score < 0.35) return 'SKIP';
    if (score < 0.6) return 'WHISPER';
    return 'ENGAGE';
  },

  // 记录干预结果
  recordIntervention(response) {
    this.lastIntervention = Date.now();
    this.interventionCount++;
    if (response === 'positive') {
      this.ignoreStreak = 0;
    } else if (response === 'negative' || response === 'ignore') {
      this.ignoreStreak++;
      if (this.ignoreStreak >= 2) {
        this.cooldownUntil = Date.now() + 30 * 60 * 1000; // 30分钟冷却
        this.ignoreStreak = 0;
      }
    }
  },

  reset() {
    this.lastIntervention = 0;
    this.interventionCount = 0;
    this.ignoreStreak = 0;
    this.cooldownUntil = 0;
  },

  /* ===== 多模态场景状态推断引擎 =====
     输入信号：人脸情绪 + 声音情绪 + 专注时长 + 摄像头活动 + 交互历史
     输出：场景状态 + 置信度 + 推荐策略
     算法：加权多信号融合 + 状态转移概率矩阵
  */
  // 多模态信号缓冲区
  signals: {
    faceEmotion: 'neutral',      // 当前人脸情绪
    faceConfidence: 0,           // 情绪置信度
    voiceEmotion: '中性',        // 当前声音情绪
    voiceEnergy: 0,              // 声音能量
    focusMinutes: 0,             // 专注分钟数
    lastInteractionTime: 0,      // 上次互动时间
    cameraActivity: 'idle',      // 摄像头活动 idle/detecting/learning
    recentResponses: []          // 最近5次互动响应
  },

  // 状态转移概率矩阵（基于历史统计的先验）
  // 从某状态在不同信号下转移到其他状态的概率
  stateTransitions: {
    TRANSITION: { LIGHT_TASK: 0.4, BORED: 0.2, DEEP_FOCUS: 0.1, FRUSTRATED: 0.05, TRANSITION: 0.25 },
    LIGHT_TASK: { DEEP_FOCUS: 0.3, BORED: 0.15, FRUSTRATED: 0.1, TRANSITION: 0.15, LIGHT_TASK: 0.3 },
    DEEP_FOCUS: { LIGHT_TASK: 0.2, FRUSTRATED: 0.15, TRANSITION: 0.1, DEEP_FOCUS: 0.55 },
    BORED: { LIGHT_TASK: 0.25, TRANSITION: 0.2, FRUSTRATED: 0.1, BORED: 0.45 },
    FRUSTRATED: { TRANSITION: 0.3, BORED: 0.15, LIGHT_TASK: 0.1, FRUSTRATED: 0.45 }
  },

  // 情绪→状态影响权重
  emotionStateImpact: {
    'happy': { BORED: -0.3, FRUSTRATED: -0.4, DEEP_FOCUS: 0.2, LIGHT_TASK: 0.1 },
    'sad': { DEEP_FOCUS: -0.3, BORED: 0.3, FRUSTRATED: 0.2, LIGHT_TASK: -0.1 },
    'angry': { DEEP_FOCUS: -0.5, FRUSTRATED: 0.5, BORED: -0.1, LIGHT_TASK: -0.2 },
    'fearful': { DEEP_FOCUS: -0.3, FRUSTRATED: 0.3, BORED: 0.1 },
    'surprised': { LIGHT_TASK: 0.2, TRANSITION: 0.2, DEEP_FOCUS: -0.1 },
    'neutral': {},
    'disgusted': { FRUSTRATED: 0.3, BORED: 0.1 }
  },

  /* 核心算法：多模态信号融合推断场景状态
     返回：{ state, confidence, reasons, strategy }
  */
  inferState() {
    const sig = this.signals;
    const stateScores = { DEEP_FOCUS: 0, LIGHT_TASK: 0, TRANSITION: 0, BORED: 0, FRUSTRATED: 0 };

    // 信号1：专注时长（长专注→深度专注，超时→挫败）
    if (sig.focusMinutes > 40) {
      stateScores.FRUSTRATED += 0.4;
      stateScores.DEEP_FOCUS -= 0.2;
    } else if (sig.focusMinutes > 20) {
      stateScores.DEEP_FOCUS += 0.4;
      stateScores.LIGHT_TASK += 0.1;
    } else if (sig.focusMinutes < 5 && sig.cameraActivity === 'idle') {
      stateScores.TRANSITION += 0.3;
      stateScores.BORED += 0.1;
    }

    // 信号2：人脸情绪（权重0.35）
    const faceImpact = this.emotionStateImpact[sig.faceEmotion] || {};
    for (const st in faceImpact) {
      stateScores[st] += faceImpact[st] * 0.35 * (sig.faceConfidence || 0.5);
    }

    // 信号3：声音情绪（权重0.25）
    if (sig.voiceEmotion === '激动/生气') {
      stateScores.FRUSTRATED += 0.25;
    } else if (sig.voiceEmotion === '兴奋/开心') {
      stateScores.LIGHT_TASK += 0.15;
      stateScores.DEEP_FOCUS += 0.1;
    } else if (sig.voiceEmotion === '低落/疲惫') {
      stateScores.BORED += 0.2;
      stateScores.FRUSTRATED += 0.1;
    } else if (sig.voiceEmotion === '焦虑/紧张') {
      stateScores.FRUSTRATED += 0.2;
    } else if (sig.voiceEmotion === '平静') {
      stateScores.DEEP_FOCUS += 0.1;
    }

    // 信号4：摄像头活动（权重0.15）
    if (sig.cameraActivity === 'learning') {
      stateScores.DEEP_FOCUS += 0.15;
    } else if (sig.cameraActivity === 'detecting') {
      stateScores.LIGHT_TASK += 0.1;
      stateScores.TRANSITION += 0.05;
    } else if (sig.cameraActivity === 'idle') {
      stateScores.TRANSITION += 0.1;
      stateScores.BORED += 0.05;
    }

    // 信号5：交互历史（权重0.15）
    const recent = sig.recentResponses.slice(-5);
    if (recent.length >= 3) {
      const ignoreCount = recent.filter(r => r === 'ignore' || r === 'negative').length;
      const ignoreRate = ignoreCount / recent.length;
      if (ignoreRate > 0.6) {
        stateScores.FRUSTRATED += 0.15;
        stateScores.BORED += 0.1;
      } else if (ignoreRate < 0.2) {
        stateScores.LIGHT_TASK += 0.1;
        stateScores.DEEP_FOCUS += 0.05;
      }
    }

    // 叠加状态转移先验（权重0.10）
    const currentState = this.currentState || 'TRANSITION';
    const transitions = this.stateTransitions[currentState] || {};
    for (const st in transitions) {
      stateScores[st] += transitions[st] * 0.10;
    }

    // 选出得分最高的状态
    let bestState = 'TRANSITION', bestScore = -1;
    const reasons = [];
    for (const st in stateScores) {
      if (stateScores[st] > bestScore) { bestScore = stateScores[st]; bestState = st; }
    }

    // 生成推断理由
    if (sig.focusMinutes > 40) reasons.push('专注超40分钟，可能疲惫');
    if (sig.faceEmotion === 'sad' && sig.faceConfidence > 0.5) reasons.push('面部识别到难过表情');
    if (sig.faceEmotion === 'angry' && sig.faceConfidence > 0.5) reasons.push('面部识别到生气表情');
    if (sig.voiceEmotion === '激动/生气') reasons.push('声音情绪激动');
    if (sig.voiceEmotion === '低落/疲惫') reasons.push('声音低落');
    if (sig.cameraActivity === 'idle' && sig.focusMinutes < 5) reasons.push('摄像头未开启，疑似任务切换');
    if (sig.cameraActivity === 'learning') reasons.push('正在苏格拉底引导学习中');
    if (reasons.length === 0) reasons.push('多信号综合判定');

    // 置信度归一化
    const totalAbs = Object.values(stateScores).reduce((a, b) => a + Math.abs(b), 0);
    const confidence = totalAbs > 0 ? Math.round(Math.min(0.95, (bestScore / totalAbs + 0.3) * 100)) : 50;

    // 生成交互策略
    const strategy = this.getInteractionStrategy(bestState, sig);

    return {
      state: bestState,
      stateName: this.states[bestState] ? this.states[bestState].name : bestState,
      confidence: confidence,
      scores: stateScores,
      reasons: reasons,
      strategy: strategy
    };
  },

  /* 基于场景状态的交互策略生成 */
  getInteractionStrategy(state, sig) {
    const strategies = {
      DEEP_FOCUS: {
        action: '静默守护',
        desc: '学生正在深度专注，不打扰',
        speak: '',
        tone: 'silent',
        priority: 0
      },
      LIGHT_TASK: {
        action: '轻量互动',
        desc: '可发起兴趣桥接或知识植入',
        speak: '嘿，看到这个了吗？它背后有个有趣的知识～',
        tone: 'playful',
        priority: 1
      },
      TRANSITION: {
        action: '主动引导',
        desc: '任务切换间隙，适合发起话题',
        speak: '刚好有空，要不要一起探索点什么？',
        tone: 'curious',
        priority: 2
      },
      BORED: {
        action: '激活兴趣',
        desc: '学生无聊，用兴趣锚点激活',
        speak: '我们来玩个游戏吧，你最近喜欢的《我的世界》里藏着不少科学知识哦～',
        tone: 'playful',
        priority: 2
      },
      FRUSTRATED: {
        action: '安抚降频',
        desc: '学生挫败，先安抚再降低难度',
        speak: '看起来有点累了，先休息一下。深呼吸，你已经做得很好了。',
        tone: 'warm',
        priority: 3
      }
    };
    const s = strategies[state] || strategies.TRANSITION;
    // 叠加情绪微调
    if (sig.faceEmotion === 'angry' && state !== 'FRUSTRATED') {
      s.desc += '（检测到生气表情，降频）';
      s.priority = Math.max(s.priority, 2);
    }
    if (sig.focusMinutes > 40 && state !== 'FRUSTRATED') {
      s.desc += '（专注超时，建议休息）';
    }
    return s;
  },

  /* 更新多模态信号 */
  updateSignal(type, value, extra) {
    if (type === 'faceEmotion') {
      this.signals.faceEmotion = value;
      this.signals.faceConfidence = (extra && extra.confidence) || 0.5;
    } else if (type === 'voiceEmotion') {
      this.signals.voiceEmotion = value;
      this.signals.voiceEnergy = (extra && extra.energy) || 0;
    } else if (type === 'focusMinutes') {
      this.signals.focusMinutes = value;
    } else if (type === 'cameraActivity') {
      this.signals.cameraActivity = value;
    } else if (type === 'interactionResponse') {
      this.signals.recentResponses.push(value);
      if (this.signals.recentResponses.length > 10) this.signals.recentResponses.shift();
      this.signals.lastInteractionTime = Date.now();
    }
    // 触发状态推断并缓存
    this.currentState = this.inferState().state;
    return this.currentState;
  },

  currentState: 'TRANSITION'
};

/* ===== 苏格拉底对话管理器 ===== */
const SocraticDM = {
  // 7状态
  states: ['INIT', 'PROBE', 'GUIDE', 'HINT', 'VERIFY', 'REINFORCE', 'CLOSE'],

  // 脚手架层级
  scaffoldLevels: {
    L0: { name: '提问', trigger: '初始引导', strategy: '只问不答' },
    L1: { name: '类比', trigger: '卡住1次', strategy: '用熟悉场景类比' },
    L2: { name: '部分提示', trigger: '卡住2次', strategy: '给出第一步' },
    L3: { name: '方法提示', trigger: '卡住3次', strategy: '给出方法名' },
    L4: { name: '近答案', trigger: '卡住4次/情绪差', strategy: '给框架不给答案' }
  },

  // 误解库
  misconceptions: [
    { id: 'MC_001', pattern: /x\s*\(\s*x\s*\+/i, type: '提取公因式误用', subject: '数学', strategy: 'L1类比' },
    { id: 'MC_002', pattern: /加.*减.*乘/i, type: '运算顺序错误', subject: '数学', strategy: 'L2部分提示' },
    { id: 'MC_003', pattern: /面积.*周长/i, type: '面积周长混淆', subject: '数学', strategy: 'L1类比' },
    { id: 'MC_004', pattern: /正.*负|同号|异号/i, type: '符号判断错误', subject: '数学', strategy: 'L2部分提示' },
  ],

  // 检测误解
  detectMisconception(studentAnswer) {
    for (const mc of this.misconceptions) {
      if (mc.pattern.test(studentAnswer)) return mc;
    }
    return null;
  },

  // 获取脚手架层级
  getScaffoldLevel(stuckCount, mastery) {
    if (mastery > 0.85) return 'L0'; // 高掌握直接提问
    if (mastery > 0.6) return 'L0';
    if (mastery > 0.3) return 'L0';
    // 低掌握根据卡住次数
    if (stuckCount === 0) return 'L0';
    if (stuckCount === 1) return 'L1';
    if (stuckCount === 2) return 'L2';
    if (stuckCount === 3) return 'L3';
    return 'L4';
  }
};

/* ===== 安全引擎 ===== */
const SafetyEngine = {
  riskTypes: {
    traffic: { name: '交通危险', level: 'P0', response: '立即语音提醒注意安全' },
    stranger: { name: '陌生人接近', level: 'P0', response: '提醒保持距离，通知家长' },
    stay: { name: '异常滞留', level: 'P1', response: '推送家长，记录位置' },
    fall: { name: '跌倒碰撞', level: 'P0', response: '询问状况，通知家长' },
    weather: { name: '恶劣环境', level: 'P1', response: '提醒避险，推送家长' }
  },

  // 模拟安全事件日志
  events: [],

  addEvent(type, detail) {
    const event = {
      id: 's_' + Date.now(),
      type: type,
      typeName: this.riskTypes[type]?.name || type,
      level: this.riskTypes[type]?.level || 'P2',
      detail: detail,
      timestamp: Date.now(),
      resolved: false
    };
    this.events.unshift(event);
    this.save();
    return event;
  },

  resolve(id) {
    const event = this.events.find(e => e.id === id);
    if (event) event.resolved = true;
    this.save();
  },

  save() {
    localStorage.setItem('bsq_safety', JSON.stringify(this.events));
  },

  load() {
    const saved = localStorage.getItem('bsq_safety');
    if (saved) {
      try { this.events = JSON.parse(saved); } catch(e) { this.events = []; }
    }
  }
};

/* ===== 健康守护 ===== */
const HealthGuardian = {
  focusStartTime: null,
  totalFocusToday: 0,
  restReminders: 0,
  maxContinuousFocus: 40 * 60 * 1000, // 40分钟

  startFocus() {
    this.focusStartTime = Date.now();
  },

  checkFocus() {
    if (!this.focusStartTime) return null;
    const elapsed = Date.now() - this.focusStartTime;
    if (elapsed >= this.maxContinuousFocus) {
      return { shouldRest: true, elapsed: Math.floor(elapsed / 60000) };
    }
    return { shouldRest: false, elapsed: Math.floor(elapsed / 60000) };
  },

  endFocus() {
    if (this.focusStartTime) {
      this.totalFocusToday += Date.now() - this.focusStartTime;
      this.focusStartTime = null;
    }
  },

  reset() {
    this.focusStartTime = null;
    this.totalFocusToday = 0;
    this.restReminders = 0;
  }
};

/* ===== MBTI 性格评测库 ===== */
const MBTIAssessment = {
  // 16 型性格完整库
  types: {
    'INTJ': {
      name: '建筑师', letters: 'INTJ', axis: 'I N T J',
      traits: ['战略思维', '独立理性', '远见卓识', '完美主义'],
      desc: '富有想象力又有战略思维的计划者，对一切持怀疑态度，独立且果断。',
      famous: [
        { name: '伊隆·马斯克', role: '企业家', field: '科技/航天', achievement: 'SpaceX、Tesla 创始人，推动电动车与火星殖民' },
        { name: '尼古拉·特斯拉', role: '发明家', field: '电气工程', achievement: '交流电系统发明者，拥有300余项专利' },
        { name: '弗里达·卡罗', role: '艺术家', field: '绘画', achievement: '墨西哥国宝级画家，以自画像闻名' }
      ],
      strengths: '善于长远规划，逻辑分析能力强，能独立解决复杂问题',
      growth: '需注意人际沟通与情感表达，避免过度追求完美',
      fitTracks: ['数据与逻辑推理', '工程与结构设计'],
      fitJobs: ['数据科学家', '机器人工程师', 'AI叙事设计师'],
      cultivate: '提供独立探索空间，鼓励参与编程/建模类项目，引导学会团队协作'
    },
    'INTP': {
      name: '逻辑学家', letters: 'INTP', axis: 'I N T P',
      traits: ['逻辑思辨', '好奇求知', '理论建构', '灵活开放'],
      desc: '对知识有强烈渴望的创新发明者，喜欢用逻辑分析一切。',
      famous: [
        { name: '阿尔伯特·爱因斯坦', role: '物理学家', field: '理论物理', achievement: '相对论创立者，诺贝尔物理学奖得主' },
        { name: '比尔·盖茨', role: '企业家', field: '计算机', achievement: '微软创始人，推动个人电脑革命' },
        { name: '玛丽·居里', role: '科学家', field: '物理/化学', achievement: '两次诺贝尔奖得主，放射性研究先驱' }
      ],
      strengths: '深度思考与理论建构能力突出，善于发现底层规律',
      growth: '需注意执行力和时间管理，避免陷入空想',
      fitTracks: ['数据与逻辑推理', '自然观察与生命科学'],
      fitJobs: ['数据科学家', 'AI叙事设计师'],
      cultivate: '鼓励提问与探索，提供实验与编程资源，帮助建立项目完成习惯'
    },
    'ENTJ': {
      name: '指挥官', letters: 'ENTJ', axis: 'E N T J',
      traits: ['领导力', '战略规划', '果断高效', '挑战驱动'],
      desc: '大胆且富有想象力的领导者，总能找到或创造解决方案。',
      famous: [
        { name: '史蒂夫·乔布斯', role: '企业家', field: '科技/设计', achievement: 'Apple 创始人，定义了智能手机时代' },
        { name: '玛格丽特·撒切尔', role: '政治家', field: '政治', achievement: '英国首位女首相，铁娘子' }
      ],
      strengths: '天生的领导者，善于组织资源与推动执行',
      growth: '需学会倾听他人意见，避免过于强势',
      fitTracks: ['工程与结构设计', '数据与逻辑推理'],
      fitJobs: ['机器人工程师', '数据科学家'],
      cultivate: '给予领导项目的机会，培养同理心与协作意识'
    },
    'ENTP': {
      name: '辩论家', letters: 'ENTP', axis: 'E N T P',
      traits: ['创新思维', '善于辩论', '灵活多变', '探索驱动'],
      desc: '聪明好奇的思想者，无法抗拒智力上的挑战。',
      famous: [
        { name: '托马斯·爱迪生', role: '发明家', field: '电气工程', achievement: '留声机、白炽灯发明者，1093项专利' },
        { name: '莱昂纳多·达·芬奇', role: '博学家', field: '艺术/科学', achievement: '文艺复兴全才，蒙娜丽莎作者' }
      ],
      strengths: '创意发散能力强，善于发现新可能性',
      growth: '需专注深耕，避免浅尝辄止',
      fitTracks: ['数据与逻辑推理', '自然观察与生命科学'],
      fitJobs: ['AI叙事设计师', '教育游戏化设计师'],
      cultivate: '鼓励参加辩论与创新赛事，培养专注力与项目坚持能力'
    },
    'INFJ': {
      name: '提倡者', letters: 'INFJ', axis: 'I N F J',
      traits: ['理想主义', '深刻洞察', '共情关怀', '坚定信念'],
      desc: '安静而神秘，同时鼓舞人心且不知疲倦的理想主义者。',
      famous: [
        { name: '特蕾莎修女', role: '慈善家', field: '人道主义', achievement: '诺贝尔和平奖得主，毕生服务穷人' },
        { name: '马丁·路德·金', role: '社会活动家', field: '民权运动', achievement: '诺贝尔和平奖得主，我有一个梦想' },
        { name: '鲁迅', role: '文学家', field: '文学', achievement: '中国现代文学奠基人，以笔为枪' }
      ],
      strengths: '深刻的人文关怀与洞察力，善于启发他人',
      growth: '需注意自我关怀，避免过度承担他人情绪',
      fitTracks: ['自然观察与生命科学'],
      fitJobs: ['教育游戏化设计师', 'AI叙事设计师'],
      cultivate: '鼓励阅读与写作，参与公益活动，保护其内心世界'
    },
    'INFP': {
      name: '调停者', letters: 'INFP', axis: 'I N F P',
      traits: ['理想主义', '创造力', '共情力', '价值驱动'],
      desc: '诗意而善良的利他主义者，渴望帮助善因。',
      famous: [
        { name: '威廉·莎士比亚', role: '剧作家', field: '文学', achievement: '英国文学巨匠，37部戏剧传世' },
        { name: 'J.R.R.托尔金', role: '作家', field: '文学', achievement: '《魔戒》《霍比特人》作者' },
        { name: '宫崎骏', role: '动画导演', field: '动画', achievement: '吉卜力工作室创始人，千与千寻导演' }
      ],
      strengths: '丰富的想象力与创造力，价值观坚定',
      growth: '需增强现实感与执行力，避免逃避',
      fitTracks: ['自然观察与生命科学'],
      fitJobs: ['AI叙事设计师', '教育游戏化设计师'],
      cultivate: '提供创作空间（写作/绘画/动画），鼓励表达内心世界'
    },
    'ENFJ': {
      name: '主人公', letters: 'ENFJ', axis: 'E N F J',
      traits: ['魅力领导', '共情激励', '组织力', '使命感'],
      desc: '富有魅力和鼓舞力的领导者，能让听众如痴如醉。',
      famous: [
        { name: '巴拉克·奥巴马', role: '政治家', field: '政治', achievement: '美国首位非裔总统' },
        { name: '奥普拉·温弗瑞', role: '媒体人', field: '传媒', achievement: '脱口秀女王，媒体帝国缔造者' }
      ],
      strengths: '天生的沟通者与激励者，善于凝聚团队',
      growth: '需学会拒绝，避免过度付出',
      fitTracks: ['工程与结构设计'],
      fitJobs: ['教育游戏化设计师'],
      cultivate: '鼓励演讲与社团活动，培养独立判断力'
    },
    'ENFP': {
      name: '竞选者', letters: 'ENFP', axis: 'E N F P',
      traits: ['热情洋溢', '创意无限', '共情力', '自由探索'],
      desc: '热情有创造力爱社交的自由灵魂，总能找到理由微笑。',
      famous: [
        { name: '沃尔特·迪士尼', role: '企业家', field: '动画/娱乐', achievement: '迪士尼帝国创始人，改变动画产业' },
        { name: '罗宾·威廉姆斯', role: '演员', field: '影视', achievement: '奥斯卡得主，喜剧天才' }
      ],
      strengths: '热情感染力强，创意丰富，善于人际连接',
      growth: '需增强专注力与执行力，避免三分钟热度',
      fitTracks: ['自然观察与生命科学'],
      fitJobs: ['AI叙事设计师', '教育游戏化设计师'],
      cultivate: '鼓励多元探索与创作，帮助建立长期项目习惯'
    },
    'ISTJ': {
      name: '物流师', letters: 'ISTJ', axis: 'I S T J',
      traits: ['务实严谨', '责任心强', '条理分明', '传统可靠'],
      desc: '实际而注重事实的人，可靠性不容怀疑。',
      famous: [
        { name: '乔治·华盛顿', role: '政治家', field: '政治', achievement: '美国开国总统' },
        { name: '安吉拉·默克尔', role: '政治家', field: '政治', achievement: '德国首位女总理，执政16年' }
      ],
      strengths: '执行力强，注重细节与规则，值得信赖',
      growth: '需增强灵活性，尝试新方法',
      fitTracks: ['工程与结构设计', '数据与逻辑推理'],
      fitJobs: ['数据科学家', '机器人工程师'],
      cultivate: '提供结构化学习任务，鼓励尝试创新方法'
    },
    'ISFJ': {
      name: '守卫者', letters: 'ISFJ', axis: 'I S F J',
      traits: ['温暖关怀', '勤勉尽责', '记忆细致', '传统守护'],
      desc: '非常专注而温暖的守护者，时刻准备保护爱着的人。',
      famous: [
        { name: '特蕾莎修女', role: '慈善家', field: '人道主义', achievement: '诺贝尔和平奖得主' },
        { name: '凯特·米德尔顿', role: '王室成员', field: '公益', achievement: '英国王妃，关注儿童心理健康' }
      ],
      strengths: '细心负责，善于照顾他人，记忆力强',
      growth: '需学会表达自身需求，避免过度牺牲',
      fitTracks: ['自然观察与生命科学'],
      fitJobs: ['教育游戏化设计师'],
      cultivate: '鼓励表达自我，参与志愿服务，建立自信'
    },
    'ESTJ': {
      name: '总经理', letters: 'ESTJ', axis: 'E S T J',
      traits: ['组织管理', '务实高效', '传统秩序', '果断执行'],
      desc: '出色的管理者，在管理事物或人员方面无与伦比。',
      famous: [
        { name: '亨利·福特', role: '企业家', field: '汽车工业', achievement: '流水线生产开创者，福特汽车创始人' },
        { name: '詹姆斯·门罗', role: '政治家', field: '政治', achievement: '美国第五任总统' }
      ],
      strengths: '组织执行力强，注重效率与秩序',
      growth: '需增强同理心，倾听不同声音',
      fitTracks: ['工程与结构设计'],
      fitJobs: ['机器人工程师'],
      cultivate: '给予管理任务，培养倾听与包容能力'
    },
    'ESFJ': {
      name: '执政官', letters: 'ESFJ', axis: 'E S F J',
      traits: ['热心助人', '社交达人', '传统和谐', '尽责可靠'],
      desc: '极有同情心，爱社交受欢迎的人，总是热心帮助他人。',
      famous: [
        { name: '泰勒·斯威夫特', role: '歌手', field: '音乐', achievement: '格莱美奖得主，全球畅销歌手' },
        { name: '比尔·克林顿', role: '政治家', field: '政治', achievement: '美国第42任总统' }
      ],
      strengths: '人际交往能力强，善于营造和谐氛围',
      growth: '需增强独立判断，避免过度在意他人评价',
      fitTracks: ['自然观察与生命科学'],
      fitJobs: ['教育游戏化设计师'],
      cultivate: '鼓励社交与组织活动，培养独立思考能力'
    },
    'ISTP': {
      name: '鉴赏家', letters: 'ISTP', axis: 'I S T P',
      traits: ['动手实践', '灵活冷静', '技术专精', '探索精神'],
      desc: '大胆而实际的实验家，擅长使用各种工具。',
      famous: [
        { name: '贝尔·格里尔斯', role: '探险家', field: '户外生存', achievement: '荒野求生主持人，前特种兵' },
        { name: '迈克尔·乔丹', role: '运动员', field: '篮球', achievement: '篮球之神，6次NBA总冠军' },
        { name: '克林特·伊斯特伍德', role: '导演/演员', field: '影视', achievement: '奥斯卡最佳导演' }
      ],
      strengths: '动手能力强，冷静应对危机，善于工具运用',
      growth: '需增强长期规划，避免冲动',
      fitTracks: ['工程与结构设计'],
      fitJobs: ['机器人工程师'],
      cultivate: '提供动手实验与机械类项目，培养规划意识'
    },
    'ISFP': {
      name: '探险家', letters: 'ISFP', axis: 'I S F P',
      traits: ['艺术审美', '温和自由', '感官敏锐', '当下体验'],
      desc: '灵活有魅力的艺术家，时刻准备探索新事物。',
      famous: [
        { name: '弗里达·卡罗', role: '画家', field: '艺术', achievement: '墨西哥国宝级画家' },
        { name: '鲍勃·迪伦', role: '音乐人', field: '音乐', achievement: '诺贝尔文学奖得主，民谣之父' },
        { name: '迈克尔·杰克逊', role: '艺术家', field: '音乐/舞蹈', achievement: '流行音乐之王' }
      ],
      strengths: '艺术感知力强，审美独特，善于活在当下',
      growth: '需增强规划与执行力',
      fitTracks: ['自然观察与生命科学'],
      fitJobs: ['AI叙事设计师'],
      cultivate: '提供艺术创作空间，鼓励参加审美类活动'
    },
    'ESTP': {
      name: '企业家', letters: 'ESTP', axis: 'E S T P',
      traits: ['行动派', '冒险精神', '社交魅力', '临场应变'],
      desc: '聪明精力充沛的人，真正享受生活在边缘地带。',
      famous: [
        { name: '麦当娜', role: '歌手', field: '音乐', achievement: '流行天后，全球销量3亿' },
        { name: '唐纳德·特朗普', role: '企业家', field: '商业', achievement: '地产大亨，美国第45任总统' },
        { name: '塞雷娜·威廉姆斯', role: '运动员', field: '网球', achievement: '23个大满贯冠军' }
      ],
      strengths: '行动力强，善于把握机会，临场应变好',
      growth: '需增强耐心与长远规划',
      fitTracks: ['工程与结构设计'],
      fitJobs: ['机器人工程师'],
      cultivate: '鼓励参加竞技类活动，培养耐心与反思习惯'
    },
    'ESFP': {
      name: '表演者', letters: 'ESFP', axis: 'E S F P',
      traits: ['热情活泼', '表现力强', '享受当下', '社交达人'],
      desc: '自发的精力充沛的表演者——生活在他们周围永远不会无聊。',
      famous: [
        { name: '玛丽莲·梦露', role: '演员', field: '影视', achievement: '好莱坞传奇女星' },
        { name: '埃尔顿·约翰', role: '音乐人', field: '音乐', achievement: '摇滚传奇，格莱美终身成就奖' },
        { name: '贾米·福克斯', role: '演员', field: '影视', achievement: '奥斯卡最佳男主角' }
      ],
      strengths: '表现力与感染力强，善于活跃气氛',
      growth: '需增强专注力与深度思考',
      fitTracks: ['自然观察与生命科学'],
      fitJobs: ['教育游戏化设计师'],
      cultivate: '鼓励参加表演与演讲，培养深度阅读习惯'
    }
  },

  // 基于学生画像进行 MBTI 评测
  assess(studentProfile) {
    const a = studentProfile.abilities;
    const p = Personality.vector;
    const pt = studentProfile.personalityType;

    // E/I 维度：外向 vs 内向
    // 依据：性格向量(warmth, proactivity) + personalityType + 社交类碎片
    let eiScore = 0;
    eiScore += p.proactivity * 30;
    eiScore += p.warmth * 20;
    if (pt === 'social') eiScore += 25;
    else if (pt === 'curious') eiScore += 10;
    else if (pt === 'steady') eiScore -= 10;
    else if (pt === 'creative') eiScore -= 5;
    const isE = eiScore >= 35;

    // S/N 维度：实感 vs 直觉
    // 依据：观察力(S) vs 创造力(N) + 记忆力(S) + 兴趣画像
    let snScore = 0;
    snScore += (a['创造力'] - a['观察力']) * 0.5;
    snScore += (a['推理力'] - a['记忆力']) * 0.3;
    if (studentProfile.interests.includes('threebody')) snScore += 8;
    if (studentProfile.interests.includes('minecraft')) snScore += 5;
    if (studentProfile.interests.includes('lego')) snScore -= 3;
    const isN = snScore >= 0;

    // T/F 维度：思考 vs 情感
    // 依据：推理力+计算力(T) vs warmth+curiosity(F)
    let tfScore = 0;
    tfScore += (a['推理力'] + a['计算力']) * 0.3;
    tfScore -= p.warmth * 25;
    tfScore -= p.curiosity * 10;
    if (pt === 'curious') tfScore += 5;
    const isT = tfScore >= 35;

    // J/P 维度：判断 vs 知觉
    // 依据：学习风格 + patience + formality
    let jpScore = 0;
    jpScore += p.patience * 20;
    jpScore += p.formality * 25;
    if (studentProfile.learningStyle === 'visual') jpScore += 8;
    if (studentProfile.learningStyle === 'kinesthetic') jpScore -= 10;
    const isJ = jpScore >= 30;

    const type = (isE ? 'E' : 'I') + (isN ? 'N' : 'S') + (isT ? 'T' : 'F') + (isJ ? 'J' : 'P');
    return {
      type: type,
      info: this.types[type],
      scores: { ei: eiScore, sn: snScore, tf: tfScore, jp: jpScore },
      isE: isE, isN: isN, isT: isT, isJ: isJ
    };
  },

  // 获取与天赋赛道匹配的榜样名人
  getRoleModels(mbtiType, trackName) {
    const info = this.types[mbtiType];
    if (!info) return [];
    // 优先返回与指定赛道匹配的名人
    var models = [];
    for (var i = 0; i < info.famous.length; i++) {
      models.push(info.famous[i]);
    }
    return models;
  },

  // 综合培养方向：名人榜样 + 职业方向
  getCultivationPlan(mbtiType, trackName) {
    const info = this.types[mbtiType];
    if (!info) return null;

    // 找到匹配的天赋赛道
    var matchedTrack = null;
    for (var i = 0; i < TalentTracks.tracks.length; i++) {
      if (TalentTracks.tracks[i].name === trackName) {
        matchedTrack = TalentTracks.tracks[i];
        break;
      }
    }

    // 找到匹配的职业
    var matchedJobs = [];
    for (var j = 0; j < TalentTracks.jobFit.length; j++) {
      if (info.fitJobs.indexOf(TalentTracks.jobFit[j].name) >= 0) {
        matchedJobs.push(TalentTracks.jobFit[j]);
      }
    }

    return {
      mbti: info,
      track: matchedTrack,
      jobs: matchedJobs,
      roleModels: info.famous,
      cultivate: info.cultivate
    };
  }
};

/* ===== 天赋赛道库 ===== */
const TalentTracks = {
  tracks: [
    {
      name: '工程与结构设计',
      match: 92,
      requirements: { '推理力': 0.7, '创造力': 0.6, '空间力': 0.9, '记忆力': 0.5, '观察力': 0.6, '计算力': 0.8 },
      short: '空间力 + 计算力主导',
      advice: '推荐参与机器人、航模或建筑类项目，补强创造力表达。',
      bridge: '从《我的世界》红石电路 → 基础电路 → 物理建模 → 工程设计'
    },
    {
      name: '数据与逻辑推理',
      match: 85,
      requirements: { '推理力': 0.9, '创造力': 0.5, '空间力': 0.6, '记忆力': 0.6, '观察力': 0.5, '计算力': 0.9 },
      short: '推理力 + 计算力主导',
      advice: '可接触编程与数据分析，保持数学竞赛训练节奏。',
      bridge: '从数独/棋类 → 算法思维 → 数据科学 → 人工智能应用'
    },
    {
      name: '自然观察与生命科学',
      match: 76,
      requirements: { '推理力': 0.6, '创造力': 0.7, '空间力': 0.5, '记忆力': 0.7, '观察力': 0.9, '计算力': 0.5 },
      short: '观察力 + 创造力主导',
      advice: '多进行户外观察记录，培养实验设计与报告写作能力。',
      bridge: '从动植物观察 → 生态笔记 → 实验设计 → 生物研究'
    }
  ],

  jobFit: [
    { name: 'AI叙事设计师', fit: 88, gap: '叙事表达、心理学基础', trend: '↑', targetMatch: 0.85, jobDemand: 0.90, growthTrend: 0.95 },
    { name: '教育游戏化设计师', fit: 84, gap: '教育学、项目管理', trend: '↑', targetMatch: 0.80, jobDemand: 0.85, growthTrend: 0.88 },
    { name: '机器人工程师', fit: 79, gap: '机械加工、团队协作', trend: '→', targetMatch: 0.90, jobDemand: 0.75, growthTrend: 0.70 },
    { name: '数据科学家', fit: 75, gap: '统计学、商业分析', trend: '↑', targetMatch: 0.88, jobDemand: 0.92, growthTrend: 0.85 }
  ],

  /* 算法1：余弦相似度计算学生能力向量与赛道需求向量的匹配度 */
  cosineSimilarity(studentAbilities, trackRequirements) {
    const dims = ['推理力', '创造力', '空间力', '记忆力', '观察力', '计算力'];
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < dims.length; i++) {
      const a = (studentAbilities[dims[i]] || 0) / 100;
      const b = trackRequirements[dims[i]] || 0;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    if (normA === 0 || normB === 0) return 0;
    return Math.round((dotProduct / (normA * normB)) * 100);
  },

  /* 动态计算所有赛道的真实匹配度 */
  computeTrackMatches(studentProfile) {
    const results = [];
    for (let i = 0; i < this.tracks.length; i++) {
      const track = this.tracks[i];
      const realMatch = this.cosineSimilarity(studentProfile.abilities, track.requirements);
      results.push({
        track: track,
        realMatch: realMatch,
        originalMatch: track.match
      });
    }
    results.sort((a, b) => b.realMatch - a.realMatch);
    return results;
  },

  /* 算法2：三因子加权计算岗位贴合度（目标匹配30% + 岗位需求40% + 成长趋势30%） */
  computeJobFit(studentProfile, mbtiType) {
    const mbtiInfo = MBTIAssessment.types[mbtiType];
    const results = [];
    for (let i = 0; i < this.jobFit.length; i++) {
      const job = this.jobFit[i];
      // 因子1：目标匹配度（学生能力与岗位的匹配，30%）
      const targetScore = job.targetMatch;
      // 因子2：岗位市场需求（40%）
      const demandScore = job.jobDemand;
      // 因子3：行业成长趋势（30%）
      const trendScore = job.growthTrend;
      // 三因子加权
      const weightedFit = Math.round((targetScore * 0.30 + demandScore * 0.40 + trendScore * 0.30) * 100);
      // MBTI加成（匹配+5%，不匹配-3%）
      const mbtiBoost = (mbtiInfo && mbtiInfo.fitJobs.indexOf(job.name) >= 0) ? 5 : -3;
      const finalFit = Math.max(0, Math.min(100, weightedFit + mbtiBoost));
      results.push({
        name: job.name,
        fit: finalFit,
        gap: job.gap,
        trend: job.trend,
        detail: '目标' + Math.round(targetScore * 100) + '% × 需求' + Math.round(demandScore * 100) + '% × 趋势' + Math.round(trendScore * 100) + '%' + (mbtiBoost > 0 ? ' +MBTI加成' : '')
      });
    }
    results.sort((a, b) => b.fit - a.fit);
    return results;
  }
};

/* ===== 心理分析数据 ===== */
const PsychologyData = {
  emotionTrend: [
    { day: '周一', value: 72 }, { day: '周二', value: 75 }, { day: '周三', value: 68 },
    { day: '周四', value: 70 }, { day: '周五', value: 78 }, { day: '周六', value: 82 },
    { day: '周日', value: 80 }
  ],

  catchphrases: [
    { phrase: '我觉得', freq: 45, baseline: 40, zScore: 0.3, status: '正常' },
    { phrase: '然后呢', freq: 38, baseline: 35, zScore: 0.4, status: '正常' },
    { phrase: '烦死了', freq: 12, baseline: 8, zScore: 1.2, status: '关注' },
    { phrase: '随便', freq: 22, baseline: 15, zScore: 1.5, status: '关注' }
  ],

  languageMetrics: {
    '激烈言辞频率': { value: '低（本周 2 次）', trend: '→' },
    '用词丰富度': { value: '中上（词汇量约同龄人 1.1x）', trend: '↑' },
    '表达力趋势': { value: '平稳上升', trend: '↑' },
    '句式复杂度': { value: '中等偏上', trend: '↑' },
    '环境敏感词': { value: '无异常', trend: '→' }
  },

  stressIndex: 35, // 0-100
  emotionState: '平稳',

  /* 算法3：真实NLP心理分析引擎 */
  analyzer: {
    // 情感词典（正面/负面词库）
    positiveWords: ['开心', '快乐', '喜欢', '有趣', '棒', '好', '厉害', '进步', '成功', '满意', '兴奋', '期待', '感谢', '棒极了', '太好了', '学到了', '明白了', '懂了', '有趣', '好玩', '酷', '赞', '优秀', '聪明', '努力', '坚持', '希望', '梦想', '目标', '信心'],
    negativeWords: ['烦', '累', '讨厌', '无聊', '难', '不会', '不懂', '失败', '失望', '害怕', '担心', '焦虑', '生气', '愤怒', '难过', '哭', '放弃', '没用', '笨', '差', '糟糕', '讨厌', '不想', '没办法', '太难', '不行', '错了', '失败', '沮丧', '压力'],

    // 激烈/消极口头禅基线库
    intenseWords: ['烦死了', '气死了', '累死了', '无聊透顶', '受不了', '崩溃', '绝望', '恨', '讨厌透'],

    /* TTR (Type-Token Ratio) 词汇多样性计算 */
    computeTTR(text) {
      if (!text || text.length === 0) return 0;
      // 中文分词：按字符切分（简化版，实际应用应使用jieba等分词器）
      var tokens = text.replace(/[，。！？、；：""''（）\s]/g, ' ').split(/\s+/).filter(function(t) { return t.length > 0; });
      if (tokens.length === 0) return 0;
      var uniqueTokens = {};
      for (var i = 0; i < tokens.length; i++) {
        uniqueTokens[tokens[i]] = true;
      }
      var ttr = Object.keys(uniqueTokens).length / tokens.length;
      return Math.round(ttr * 100) / 100;
    },

    /* 情感分数计算（基于词典的情感分析） */
    computeSentiment(text) {
      if (!text) return { score: 0, label: '中性', positiveCount: 0, negativeCount: 0 };
      var posCount = 0, negCount = 0;
      var lowerText = text.toLowerCase();
      for (var i = 0; i < this.positiveWords.length; i++) {
        var idx = 0;
        while ((idx = lowerText.indexOf(this.positiveWords[i], idx)) >= 0) { posCount++; idx += this.positiveWords[i].length; }
      }
      for (var j = 0; j < this.negativeWords.length; j++) {
        var idx2 = 0;
        while ((idx2 = lowerText.indexOf(this.negativeWords[j], idx2)) >= 0) { negCount++; idx2 += this.negativeWords[j].length; }
      }
      var total = posCount + negCount;
      var score = total === 0 ? 0 : Math.round(((posCount - negCount) / total) * 100);
      var label = score > 30 ? '积极' : score < -30 ? '消极' : '中性';
      return { score: score, label: label, positiveCount: posCount, negativeCount: negCount };
    },

    /* 激烈言辞检测 */
    detectIntenseWords(text) {
      if (!text) return [];
      var found = [];
      for (var i = 0; i < this.intenseWords.length; i++) {
        if (text.indexOf(this.intenseWords[i]) >= 0) found.push(this.intenseWords[i]);
      }
      return found;
    },

    /* 句式复杂度估算（平均句长 + 标点多样性） */
    computeComplexity(text) {
      if (!text || text.length === 0) return { avgLen: 0, punctuation: 0, level: '低' };
      var sentences = text.split(/[。！？]/).filter(function(s) { return s.trim().length > 0; });
      if (sentences.length === 0) return { avgLen: 0, punctuation: 0, level: '低' };
      var totalLen = 0;
      for (var i = 0; i < sentences.length; i++) totalLen += sentences[i].length;
      var avgLen = Math.round(totalLen / sentences.length);
      var punctTypes = (text.match(/[，。！？、；：""''（）—…]/g) || []).filter(function(v, i, a) { return a.indexOf(v) === i; }).length;
      var level = avgLen > 20 && punctTypes > 4 ? '高' : avgLen > 12 && punctTypes > 2 ? '中' : '低';
      return { avgLen: avgLen, punctuation: punctTypes, level: level };
    },

    /* 综合心理分析 */
    analyze(text) {
      var ttr = this.computeTTR(text);
      var sentiment = this.computeSentiment(text);
      var intense = this.detectIntenseWords(text);
      var complexity = this.computeComplexity(text);
      // 综合情绪状态评估
      var stressEstimate = 0;
      if (sentiment.score < -50) stressEstimate = 70;
      else if (sentiment.score < -20) stressEstimate = 50;
      else if (sentiment.score < 0) stressEstimate = 35;
      else stressEstimate = 20;
      if (intense.length > 0) stressEstimate += intense.length * 10;
      stressEstimate = Math.min(100, stressEstimate);
      var emotionState = stressEstimate > 60 ? '需关注' : stressEstimate > 40 ? '波动' : '平稳';
      return {
        ttr: ttr,
        ttrLevel: ttr > 0.7 ? '高' : ttr > 0.5 ? '中' : '低',
        sentiment: sentiment,
        intenseWords: intense,
        complexity: complexity,
        stressEstimate: stressEstimate,
        emotionState: emotionState,
        wordCount: text ? text.length : 0
      };
    }
  }
};

/* ===== 共育决策记录 ===== */
const DecisionLog = {
  records: [],

  add(topic, analysis, suggestion, consensus, strategy) {
    const record = {
      id: 'd_' + Date.now(),
      timestamp: Date.now(),
      topic,
      analysis,
      suggestion,
      consensus: consensus || '讨论中',
      strategy: strategy || '',
      status: 'active'
    };
    this.records.unshift(record);
    this.save();
  },

  save() {
    localStorage.setItem('bsq_decisions', JSON.stringify(this.records));
  },

  load() {
    const saved = localStorage.getItem('bsq_decisions');
    if (saved) {
      try { this.records = JSON.parse(saved); } catch(e) { this.records = []; }
    }
    // 示例数据
    if (this.records.length === 0) {
      this.records = [
        { id: 'd1', timestamp: Date.now() - 7*24*3600*1000, topic: '数学竞赛班选择', analysis: '数学88分，计算力88，推理力82', suggestion: '先尝试校内竞赛，观察投入度', consensus: '已达成共识', strategy: '降低数学场景趣味桥接频率，增加竞赛级内容', status: 'completed' },
        { id: 'd2', timestamp: Date.now() - 3*24*3600*1000, topic: '历史学科提升', analysis: '历史74分，下降趋势', suggestion: '用场景旅行方式切入', consensus: '讨论中', strategy: '', status: 'active' },
      ];
      this.save();
    }
  }
};

/* ===== 学生画像 Embedding + 协同过滤相似学生匹配 =====
   设计文档 2.16 定义：5维子向量拼接 + 相似学生匹配
   实现：32维 Embedding + KNN 协同过滤 + 路径推荐
   算法亮点：
   1) 多维异构数据统一向量化（能力/定性/学科/MBTI/兴趣/性格）
   2) 基于种子的确定性伪随机生成模拟学生群体（保证结果可复现）
   3) KNN 近邻搜索 + 加权投票的协同过滤推荐
   4) 基于近邻群体成长轨迹的概率路径推荐
*/
const StudentEmbedding = {
  // 向量维度构成（共32维）
  // [0-5]   能力6维 (推理/创造/空间/记忆/观察/计算)
  // [6-11]  定性6维 (品行/能力/成绩/表现/特长/潜能)
  // [12-17] 学科6维 (语文/数学/英语/物理/历史/生物)
  // [18-21] MBTI 4维 (E/I, N/S, T/F, J/P)
  // [22-25] 兴趣 4维 one-hot (minecraft/genshin/threebody/lego)
  // [26-31] 性格 6维 (warmth/humor/patience/proactivity/formality/curiosity)
  DIM: 32,
  abilityDims: ['推理力', '创造力', '空间力', '记忆力', '观察力', '计算力'],
  qualDims: ['品行', '能力', '成绩', '表现', '特长', '潜能'],
  subjectDims: ['语文', '数学', '英语', '物理', '历史', '生物'],
  interestKeys: ['minecraft', 'genshin', 'threebody', 'lego'],
  personaDims: ['warmth', 'humor', 'patience', 'proactivity', 'formality', 'curiosity'],

  /* 构建学生 32 维 Embedding 向量 */
  buildVector(profile, mbtiResult) {
    const v = new Array(this.DIM);
    let i = 0;
    // 能力6维 [0-5]
    for (let k = 0; k < 6; k++) v[i++] = (profile.abilities[this.abilityDims[k]] || 0) / 100;
    // 定性6维 [6-11]
    for (let k = 0; k < 6; k++) v[i++] = (profile.qualitative[this.qualDims[k]] || 0) / 100;
    // 学科6维 [12-17]
    for (let k = 0; k < 6; k++) v[i++] = ((profile.subjects[this.subjectDims[k]] || {}).score || 0) / 100;
    // MBTI 4维 [18-21]
    v[i++] = mbtiResult.isE ? 1 : 0;
    v[i++] = mbtiResult.isN ? 1 : 0;
    v[i++] = mbtiResult.isT ? 1 : 0;
    v[i++] = mbtiResult.isJ ? 1 : 0;
    // 兴趣 one-hot [22-25]
    for (let k = 0; k < 4; k++) v[i++] = profile.interests.indexOf(this.interestKeys[k]) >= 0 ? 1 : 0;
    // 性格6维 [26-31]
    const pv = Personality.vector;
    for (let k = 0; k < 6; k++) v[i++] = pv[this.personaDims[k]];
    return v;
  },

  /* 余弦相似度 */
  cosine(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
    na = Math.sqrt(na); nb = Math.sqrt(nb);
    if (na === 0 || nb === 0) return 0;
    return dot / (na * nb);
  },

  /* 基于种子的确定性伪随机数（mulberry32）——保证群体可复现 */
  seededRandom(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  /* 生成模拟学生群体（确定性，可复现）
     每个模拟学生：32维向量 + 选择的赛道 + 培养路径 + 成长成果
     生成逻辑有内在因果关系：能力强的学生成果更好，能力维度匹配赛道的学生走得更远
  */
  generateCohort(size, seed) {
    seed = seed || 20260624;
    const rand = this.seededRandom(seed);
    const names = ['小航', '小琪', '小宇', '小桐', '小彦', '小璐', '小韬', '小妍', '小辰', '小玥',
      '小桓', '小蕊', '小铮', '小萌', '小驰', '小璇', '小楷', '小冉', '小瀚', '小蓓'];
    const tracks = ['工程与结构设计', '数据与逻辑推理', '自然观察与生命科学'];
    const paths = {
      '工程与结构设计': ['机器人社团→省赛集训→STEM夏令营', '航模兴趣班→物理实验组→科创大赛', '乐高机器人→编程社团→工程师种子计划'],
      '数据与逻辑推理': ['数学竞赛班→信息学奥赛→集训队', '编程启蒙→数据科学营→AI夏校', '棋类训练→算法社团→数模竞赛'],
      '自然观察与生命科学': ['自然观察营→生物竞赛→科研所实习', '生态记录→实验设计→科创项目', '植物图谱→生物奥赛→生命科学营']
    };
    const outcomes = ['省级二等奖', '省级一等奖', '全国铜奖', '全国银奖', '全国金奖', '自主招生加分', '强基计划入围', '名校录取'];

    const cohort = [];
    for (let n = 0; n < size; n++) {
      const v = new Array(this.DIM);
      // 生成能力（均值70，标准差12）
      let abilitySum = 0;
      for (let k = 0; k < 6; k++) {
        const val = Math.max(30, Math.min(99, 70 + (rand() - 0.5) * 24));
        v[k] = val / 100;
        abilitySum += val;
      }
      // 定性（与能力正相关）
      for (let k = 0; k < 6; k++) {
        v[6 + k] = Math.max(0.3, Math.min(0.99, v[k] * 0.6 + rand() * 0.4));
      }
      // 学科（与对应能力维度相关）
      v[12] = Math.max(0.3, Math.min(0.99, v[5] * 0.5 + rand() * 0.5)); // 语文-记忆力
      v[13] = Math.max(0.3, Math.min(0.99, v[0] * 0.4 + v[5] * 0.3 + rand() * 0.3)); // 数学
      v[14] = Math.max(0.3, Math.min(0.99, v[3] * 0.6 + rand() * 0.4)); // 英语-记忆力
      v[15] = Math.max(0.3, Math.min(0.99, v[0] * 0.4 + v[4] * 0.3 + rand() * 0.3)); // 物理
      v[16] = Math.max(0.3, Math.min(0.99, v[3] * 0.4 + rand() * 0.6)); // 历史
      v[17] = Math.max(0.3, Math.min(0.99, v[4] * 0.5 + rand() * 0.5)); // 生物-观察力
      // MBTI 4维
      v[18] = rand() > 0.5 ? 1 : 0;
      v[19] = rand() > 0.5 ? 1 : 0;
      v[20] = rand() > 0.5 ? 1 : 0;
      v[21] = rand() > 0.5 ? 1 : 0;
      // 兴趣 one-hot（1-2个）
      const interestCount = 1 + Math.floor(rand() * 2);
      for (let k = 0; k < 4; k++) v[22 + k] = 0;
      for (let k = 0; k < interestCount; k++) v[22 + Math.floor(rand() * 4)] = 1;
      // 性格6维
      v[26] = 0.5 + rand() * 0.5;
      v[27] = rand();
      v[28] = 0.6 + rand() * 0.4;
      v[29] = rand();
      v[30] = rand() * 0.6;
      v[31] = 0.4 + rand() * 0.6;

      // 根据能力优势选择赛道
      let trackIdx = 0;
      if (v[2] > v[0] && v[2] > v[4]) trackIdx = 0; // 空间力最高→工程
      else if (v[0] > v[4] && v[5] > v[4]) trackIdx = 1; // 推理+计算→数据
      else if (v[4] > v[0]) trackIdx = 2; // 观察力→生命科学
      else trackIdx = Math.floor(rand() * 3);

      const track = tracks[trackIdx];
      const pathList = paths[track];
      const path = pathList[Math.floor(rand() * pathList.length)];

      // 成果由能力总和决定（高能力→高成果）
      const abilityAvg = abilitySum / 6;
      let outcomeIdx;
      if (abilityAvg > 88) outcomeIdx = 4 + Math.floor(rand() * 4); // 全国金/银/自主/强基
      else if (abilityAvg > 80) outcomeIdx = 2 + Math.floor(rand() * 4); // 全国铜/金/银/自主
      else if (abilityAvg > 72) outcomeIdx = 1 + Math.floor(rand() * 3); // 省一/铜/银
      else outcomeIdx = Math.floor(rand() * 2); // 省二/省一
      const outcome = outcomes[outcomeIdx];

      // 能力提升幅度（培养后比培养前）
      const improvement = Math.round(8 + rand() * 22 + (abilityAvg - 70) * 0.3);

      cohort.push({
        id: 's_' + n,
        name: names[n % names.length] + (n >= names.length ? (Math.floor(n / names.length) + 1) : ''),
        age: 9 + Math.floor(rand() * 9),
        vector: v,
        track: track,
        path: path,
        outcome: outcome,
        outcomeLevel: outcomeIdx,
        improvement: improvement,
        abilityAvg: Math.round(abilityAvg)
      });
    }
    return cohort;
  },

  /* KNN 近邻搜索：找到最相似的 K 个学生 */
  findSimilar(targetVec, cohort, k) {
    k = k || 5;
    const scored = [];
    for (let i = 0; i < cohort.length; i++) {
      const sim = this.cosine(targetVec, cohort[i].vector);
      scored.push({ student: cohort[i], similarity: sim });
    }
    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, k);
  },

  /* 协同过滤路径推荐：基于相似学生群体的成长轨迹加权投票 */
  recommendPath(similarStudents) {
    if (!similarStudents || similarStudents.length === 0) return null;

    // 1) 路径加权投票（相似度作为权重）
    const pathScores = {};
    const trackScores = {};
    let totalSim = 0;
    let totalImprovement = 0;
    let totalOutcomeLevel = 0;

    for (let i = 0; i < similarStudents.length; i++) {
      const item = similarStudents[i];
      const w = Math.max(0.01, item.similarity);
      totalSim += w;
      totalImprovement += item.student.improvement * w;
      totalOutcomeLevel += item.student.outcomeLevel * w;
      pathScores[item.student.path] = (pathScores[item.student.path] || 0) + w;
      trackScores[item.student.track] = (trackScores[item.student.track] || 0) + w;
    }

    // 2) 选出得分最高的赛道和路径
    let bestTrack = null, bestTrackScore = 0;
    for (const t in trackScores) {
      if (trackScores[t] > bestTrackScore) { bestTrackScore = trackScores[t]; bestTrack = t; }
    }
    let bestPath = null, bestPathScore = 0;
    for (const p in pathScores) {
      if (pathScores[p] > bestPathScore) { bestPathScore = pathScores[p]; bestPath = p; }
    }

    // 3) 预测成长幅度和成果概率
    const predictedImprovement = Math.round(totalImprovement / totalSim);
    const predictedOutcomeLevel = totalOutcomeLevel / totalSim;
    let outcomePrediction;
    if (predictedOutcomeLevel >= 6) outcomePrediction = '有望冲击名校录取/强基计划';
    else if (predictedOutcomeLevel >= 4) outcomePrediction = '有潜力获得全国级奖项';
    else if (predictedOutcomeLevel >= 2) outcomePrediction = '可冲击省级一等奖/全国铜奖';
    else outcomePrediction = '可获得省级奖项/能力显著提升';

    // 4) 路径置信度（相似度越高且一致性越高，置信度越高）
    const topSim = similarStudents[0].similarity;
    const pathConsistency = bestPathScore / totalSim;
    const confidence = Math.round(Math.min(95, topSim * 60 + pathConsistency * 40));

    return {
      recommendedTrack: bestTrack,
      recommendedPath: bestPath,
      predictedImprovement: predictedImprovement,
      outcomePrediction: outcomePrediction,
      confidence: confidence,
      pathConsistency: Math.round(pathConsistency * 100),
      avgSimilarity: Math.round((totalSim / similarStudents.length) * 100),
      supporters: similarStudents.length
    };
  },

  /* 可视化：将32维向量降为8个分块摘要（每4维取平均）便于展示 */
  vectorSummary(vec) {
    const blockNames = ['能力', '定性', '学科', 'MBTI', '兴趣', '性格'];
    const summary = [];
    for (let b = 0; b < 6; b++) {
      let sum = 0;
      const start = b * 4;
      // MBTI和兴趣是0/1，单独处理
      if (b === 3) {
        // MBTI: 显示类型代码
        summary.push({ name: 'MBTI', value: (vec[18] ? 'E' : 'I') + (vec[19] ? 'N' : 'S') + (vec[20] ? 'T' : 'F') + (vec[21] ? 'J' : 'P') });
        continue;
      }
      if (b === 4) {
        // 兴趣: 显示数量
        let cnt = 0;
        for (let k = 22; k < 26; k++) cnt += vec[k];
        summary.push({ name: '兴趣', value: cnt + '项' });
        continue;
      }
      // 能力/定性/学科/性格: 取平均
      const blockSize = b === 5 ? 6 : (b === 0 ? 6 : 6); // 实际各自的维度数
      // 重新按真实分块
      const ranges = [[0, 6], [6, 12], [12, 18], [26, 32]];
      if (b < 3) {
        for (let k = ranges[b][0]; k < ranges[b][1]; k++) sum += vec[k];
        summary.push({ name: blockNames[b], value: Math.round((sum / 6) * 100) });
      } else if (b === 5) {
        for (let k = 26; k < 32; k++) sum += vec[k];
        summary.push({ name: '性格', value: Math.round((sum / 6) * 100) });
      }
    }
    return summary;
  }
};

/* ===== 初始化 ===== */
function initSharedData() {
  Personality.load();
  SpacedRepetition.load();
  Memory.load();
  SafetyEngine.load();
  DecisionLog.load();
}
