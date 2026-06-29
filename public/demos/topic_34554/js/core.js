/**
 * SpiritBuddy - 共享数据层与记忆系统
 * 所有页面通过 localStorage 共享数据
 */

// ============ 精灵配置 ============
const SPIRIT_CONFIG = {
  stages: [
    { level: 1, name: '小芽芽', stage: '萌芽期', maxXP: 100, color: '#A8E6CF' },
    { level: 2, name: '小苗苗', stage: '幼苗期', maxXP: 200, color: '#7FD8BE' },
    { level: 3, name: '小花苞', stage: '成长期', maxXP: 300, color: '#FF8FAB' },
    { level: 4, name: '小精灵', stage: '成熟期', maxXP: 400, color: '#C77DFF' },
    { level: 5, name: '精灵王', stage: '完全体', maxXP: 500, color: '#FFD700' }
  ],
  taskTypes: {
    reading: { name: '阅读打卡', icon: '📖', baseXP: 30, color: '#FF8FAB' },
    math: { name: '数学练习', icon: '🔢', baseXP: 25, color: '#4ECDC4' },
    writing: { name: '书写作业', icon: '✏️', baseXP: 20, color: '#A8E6CF' },
    art: { name: '创意手工', icon: '🎨', baseXP: 35, color: '#FFD93D' }
  },
  // 精灵图鉴配置
  spirits: [
    { id: 'sprout', name: '小芽芽', type: '自然系', desc: '充满生命力的萌芽精灵', unlockTasks: 0, color: '#A8E6CF', icon: '🌱' },
    { id: 'flame', name: '小火苗', type: '火焰系', desc: '热情似火的精灵', unlockTasks: 5, color: '#FF8FAB', icon: '🔥' },
    { id: 'bubble', name: '小泡泡', type: '水系', desc: '温柔治愈的水精灵', unlockTasks: 10, color: '#4ECDC4', icon: '💧' },
    { id: 'spark', name: '小星星', type: '光系', desc: '闪耀夜空的光精灵', unlockTasks: 20, color: '#FFD93D', icon: '⭐' },
    { id: 'shadow', name: '小影子', type: '暗系', desc: '神秘莫测的暗精灵', unlockTasks: 35, color: '#C77DFF', icon: '🌙' },
    { id: 'wind', name: '小风风', type: '风系', desc: '自由翱翔的风精灵', unlockTasks: 50, color: '#7FD8BE', icon: '🌪️' }
  ]
};

// ============ 数据存储 ============
const Storage = {
  key: 'spiritbuddy_data',
  
  get() {
    const raw = localStorage.getItem(this.key);
    if (raw) {
      const saved = JSON.parse(raw);
      const defaults = this.getDefault();
      // Merge saved data with defaults to ensure new fields exist
      return { ...defaults, ...saved, 
        spirit: { ...defaults.spirit, ...saved.spirit },
        userProfile: { ...defaults.userProfile, ...saved.userProfile },
        spiritMemory: { ...defaults.spiritMemory, ...saved.spiritMemory },
        stats: { ...defaults.stats, ...saved.stats }
      };
    }
    return this.getDefault();
  },
  
  set(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  },
  
  getDefault() {
    return {
      // 精灵状态
      spirit: {
        level: 1,
        xp: 50,
        energy: 80,
        name: '小芽芽',
        id: 'sprout'
      },
      // 已解锁精灵
      unlockedSpirits: ['sprout'],
      // 当前选择的精灵
      currentSpirit: 'sprout',
      // 用户积分
      points: 100,
      // 用户画像（记忆系统）
      userProfile: {
        nickname: '小朋友',
        preferredTasks: [],
        strongSubjects: [],
        weakSubjects: [],
        totalSessions: 0,
        lastMood: 'happy',
        firstVisit: new Date().toISOString()
      },
      // 对话历史
      chatHistory: [],
      // 精灵自我认知
      spiritMemory: {
        evolutionCount: 0,
        favoritePhrase: '',
        userImpression: ''
      },
      // 任务历史
      taskHistory: [
        { type: 'reading', title: '阅读打卡：完成《小王子》第5章', xp: 30, time: '今天 14:30' },
        { type: 'math', title: '数学练习：完成20道加减法', xp: 20, time: '今天 10:15' }
      ],
      // 统计数据
      stats: {
        todayTasks: 2,
        todayXP: 50,
        streakDays: 3,
        totalTasks: 12,
        weeklyXP: [30, 50, 45, 60, 40, 80, 50]
      },
      // 社区帖子（模拟数据）
      communityPosts: [
        { id: 1, user: '小明', avatar: '👦', spirit: '小火苗', content: '今天完成了数学练习，获得了25XP！', xp: 25, likes: 5, liked: false, time: '10分钟前' },
        { id: 2, user: '小红', avatar: '👧', spirit: '小芽芽', content: '阅读打卡：《西游记》第三章', xp: 30, likes: 8, liked: false, time: '30分钟前' },
        { id: 3, user: '小刚', avatar: '👦', spirit: '小泡泡', content: '画了一幅水彩画，获得35XP！', xp: 35, likes: 12, liked: false, time: '1小时前' },
        { id: 4, user: '小美', avatar: '👧', spirit: '小芽芽', content: '连续打卡第5天，精灵升级了！', xp: 50, likes: 15, liked: false, time: '2小时前' },
        { id: 5, user: '小华', avatar: '👦', spirit: '小火苗', content: '完成了20道加减法，全对！', xp: 25, likes: 6, liked: false, time: '3小时前' }
      ]
    };
  },
  
  reset() {
    localStorage.removeItem(this.key);
  }
};

// ============ 记忆系统 ============
const MemorySystem = {
  // 获取完整数据
  getData() {
    return Storage.get();
  },
  
  // 保存数据
  saveData(data) {
    Storage.set(data);
  },
  
  // 更新精灵状态
  updateSpirit(updates) {
    const data = this.getData();
    Object.assign(data.spirit, updates);
    this.saveData(data);
  },
  
  // 切换精灵
  switchSpirit(spiritId) {
    const data = this.getData();
    if (data.unlockedSpirits.includes(spiritId)) {
      data.currentSpirit = spiritId;
      const spirit = SPIRIT_CONFIG.spirits.find(s => s.id === spiritId);
      data.spirit.name = spirit.name;
      data.spirit.id = spiritId;
      this.saveData(data);
      return true;
    }
    return false;
  },
  
  // 解锁精灵
  unlockSpirit(spiritId) {
    const data = this.getData();
    if (!data.unlockedSpirits.includes(spiritId)) {
      data.unlockedSpirits.push(spiritId);
      this.saveData(data);
      return true;
    }
    return false;
  },
  
  // 检查解锁条件
  checkUnlocks() {
    const data = this.getData();
    const totalTasks = data.stats.totalTasks;
    const newlyUnlocked = [];
    
    SPIRIT_CONFIG.spirits.forEach(spirit => {
      if (!data.unlockedSpirits.includes(spirit.id) && totalTasks >= spirit.unlockTasks) {
        data.unlockedSpirits.push(spirit.id);
        newlyUnlocked.push(spirit);
      }
    });
    
    if (newlyUnlocked.length > 0) {
      this.saveData(data);
    }
    
    return newlyUnlocked;
  },
  
  // 添加积分
  addPoints(points) {
    const data = this.getData();
    data.points += points;
    this.saveData(data);
  },
  
  // 点赞帖子
  likePost(postId) {
    const data = this.getData();
    const post = data.communityPosts.find(p => p.id === postId);
    if (post && !post.liked) {
      post.liked = true;
      post.likes++;
      // 点赞获得积分
      data.points += 2;
      // 积分转化为精灵经验
      data.spirit.xp += 1;
      this.saveData(data);
      return { success: true, points: 2, xp: 1 };
    }
    return { success: false };
  },
  
  // 添加任务记录
  addTask(task) {
    const data = this.getData();
    data.taskHistory.unshift(task);
    if (data.taskHistory.length > 50) data.taskHistory.pop();
    
    // 更新统计
    data.stats.todayTasks++;
    data.stats.todayXP += task.xp;
    data.stats.totalTasks++;
    
    // 更新用户偏好
    if (!data.userProfile.preferredTasks.includes(task.type)) {
      data.userProfile.preferredTasks.push(task.type);
    }
    
    // 完成任务获得积分
    data.points += Math.floor(task.xp / 2);
    
    this.saveData(data);
    
    // 检查是否有新解锁
    return this.checkUnlocks();
  },
  
  // 添加对话记录
  addChat(role, message) {
    const data = this.getData();
    data.chatHistory.push({
      role,
      message,
      time: new Date().toISOString()
    });
    if (data.chatHistory.length > 100) {
      data.chatHistory = data.chatHistory.slice(-50);
    }
    data.userProfile.totalSessions++;
    this.saveData(data);
  },
  
  // 获取精灵当前配置
  getSpiritStage() {
    const data = this.getData();
    return SPIRIT_CONFIG.stages.find(s => s.level === data.spirit.level) || SPIRIT_CONFIG.stages[0];
  },
  
  // 检查是否升级
  checkLevelUp() {
    const data = this.getData();
    const stage = this.getSpiritStage();
    if (data.spirit.xp >= stage.maxXP && data.spirit.level < 5) {
      data.spirit.xp -= stage.maxXP;
      data.spirit.level++;
      const newStage = this.getSpiritStage();
      data.spirit.name = newStage.name;
      data.spiritMemory.evolutionCount++;
      this.saveData(data);
      return { leveledUp: true, from: stage, to: newStage };
    }
    return { leveledUp: false };
  }
};

// ============ 图片分析引擎 ============
const ImageAnalyzer = {
  // 分析图片特征（前端模拟）
  async analyze(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 100, 100);
        
        const imageData = ctx.getImageData(0, 0, 100, 100);
        const features = this.extractFeatures(imageData.data);
        
        // 根据特征判断任务类型
        const result = this.classifyTask(features, file);
        resolve(result);
      };
      img.src = URL.createObjectURL(file);
    });
  },
  
  extractFeatures(pixels) {
    let totalR = 0, totalG = 0, totalB = 0;
    let colorCount = 0;
    let textLikePixels = 0;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i], g = pixels[i+1], b = pixels[i+2];
      totalR += r; totalG += g; totalB += b;
      
      // 检测文字特征（高对比度区域）
      const brightness = (r + g + b) / 3;
      if (brightness < 50 || brightness > 200) textLikePixels++;
      
      // 检测色彩丰富度
      if (Math.abs(r - g) > 30 || Math.abs(g - b) > 30) colorCount++;
    }
    
    const pixelCount = pixels.length / 4;
    return {
      avgR: totalR / pixelCount,
      avgG: totalG / pixelCount,
      avgB: totalB / pixelCount,
      textRatio: textLikePixels / pixelCount,
      colorVariety: colorCount / pixelCount,
      brightness: (totalR + totalG + totalB) / (3 * pixelCount)
    };
  },
  
  classifyTask(features, file) {
    const { textRatio, colorVariety, brightness } = features;
    
    // 判断逻辑
    if (textRatio > 0.4 && brightness > 100) {
      return { type: 'writing', confidence: 0.85, reason: '检测到大量文字内容' };
    }
    if (colorVariety > 0.3 && textRatio < 0.2) {
      return { type: 'art', confidence: 0.8, reason: '色彩丰富，可能是手工作品' };
    }
    if (textRatio > 0.2 && textRatio < 0.4) {
      return { type: 'math', confidence: 0.75, reason: '检测到数字和符号' };
    }
    if (brightness > 150 && colorVariety < 0.2) {
      return { type: 'reading', confidence: 0.7, reason: '页面整洁，可能是书本' };
    }
    
    // 默认根据文件名判断
    const name = file.name.toLowerCase();
    if (name.includes('read') || name.includes('book')) return { type: 'reading', confidence: 0.6, reason: '文件名提示' };
    if (name.includes('math') || name.includes('calc')) return { type: 'math', confidence: 0.6, reason: '文件名提示' };
    if (name.includes('write') || name.includes('homework')) return { type: 'writing', confidence: 0.6, reason: '文件名提示' };
    if (name.includes('art') || name.includes('draw')) return { type: 'art', confidence: 0.6, reason: '文件名提示' };
    
    return { type: 'reading', confidence: 0.5, reason: '默认分类' };
  },
  
  // 计算 XP
  calculateXP(taskType, confidence) {
    const config = SPIRIT_CONFIG.taskTypes[taskType];
    const qualityBonus = Math.floor(confidence * 20); // 0-20
    return config.baseXP + qualityBonus;
  }
};

// ============ 对话引擎 ============
const ChatEngine = {
  // 生成回复 - 像真人一样对话
  generateResponse(userInput) {
    const data = MemorySystem.getData();
    const { userProfile, spirit, chatHistory, taskHistory } = data;
    const nickname = userProfile.nickname || '小伙伴';
    const input = userInput.toLowerCase();
    
    // 意图识别 - 更自然的匹配
    if (this.match(input, ['你好', '嗨', 'hello', 'hi', '在吗', '在不在'])) {
      return this.greeting(userProfile, spirit, nickname);
    }
    
    if (this.match(input, ['我是谁', '我叫', '名字', '我是'])) {
      return this.aboutUser(userProfile, nickname);
    }
    
    if (this.match(input, ['你是谁', '你叫', '是什么', '介绍一下'])) {
      return this.aboutSpirit(spirit, nickname);
    }
    
    if (this.match(input, ['升级', '进化', '等级', '多少级', '经验'])) {
      return this.aboutLevel(spirit, nickname);
    }
    
    if (this.match(input, ['任务', '做什么', '学习', '打卡', '作业'])) {
      return this.suggestTask(userProfile, taskHistory, nickname);
    }
    
    if (this.match(input, ['历史', '记录', '做过', '上次', '之前'])) {
      return this.aboutHistory(taskHistory, nickname);
    }
    
    if (this.match(input, ['累', '难', '不想', '讨厌', '无聊', '烦'])) {
      return this.encourage(userProfile, spirit, nickname);
    }
    
    if (this.match(input, ['开心', '棒', '厉害', '喜欢', '爱', '好玩'])) {
      return this.celebrate(userProfile, spirit, nickname);
    }
    
    if (this.match(input, ['积分', '分数', '点数', 'points', '多少分'])) {
      return this.aboutPoints(data, nickname);
    }
    
    if (this.match(input, ['精灵', '宠物', '伙伴', '换精灵', '图鉴'])) {
      return this.aboutSpirits(data, nickname);
    }
    
    if (this.match(input, ['谢谢', '感谢', '谢了'])) {
      return this.thanks(nickname);
    }
    
    if (this.match(input, ['再见', '拜拜', 'bye', '走了'])) {
      return this.goodbye(nickname, spirit);
    }
    
    // 默认回复 - 更像真人
    return this.defaultReply(userProfile, spirit, nickname, input);
  },
  
  match(input, keywords) {
    return keywords.some(k => input.includes(k));
  },
  
  greeting(profile, spirit, nickname) {
    const stage = SPIRIT_CONFIG.stages.find(s => s.level === spirit.level);
    const isFirst = profile.totalSessions < 3;
    
    if (isFirst) {
      return `哇！${nickname}！终于见到你啦！我是${spirit.name}，你的学习伙伴！\n\n我会记住你的喜好，陪你一起学习。今天想聊聊什么？`;
    }
    
    const time = new Date().getHours();
    let timeGreeting = time < 12 ? '早上好' : time < 18 ? '下午好' : '晚上好';
    
    const greetings = [
      `${timeGreeting}！${nickname}！今天也要一起学习吗？`,
      `${timeGreeting}呀！${nickname}！我刚还在想你今天会不会来呢！`,
      `${timeGreeting}！${nickname}！准备好今天的学习任务了吗？`
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  },
  
  aboutUser(profile, nickname) {
    if (!profile.nickname || profile.nickname === '小朋友') {
      return `我还不知道你的名字呢！告诉我你的名字，这样我就能记住你啦！`;
    }
    
    const prefs = profile.preferredTasks.map(t => SPIRIT_CONFIG.taskTypes[t].name).join('、') || '学习';
    
    return `你是${nickname}呀！我当然记得你！\n\n你喜欢${prefs}，已经和我一起聊了${profile.totalSessions}次天。每次和你聊天我都很开心！`;
  },
  
  aboutSpirit(spirit, nickname) {
    const stage = SPIRIT_CONFIG.stages.find(s => s.level === spirit.level);
    return `我是${spirit.name}呀！${nickname}不记得我了吗？\n\n我现在是${stage.stage}，已经陪伴你经历了${stage.level - 1}次进化。每次你完成学习任务，我就会成长一点点。\n\n继续加油，我会变成更厉害的形态哦！`;
  },
  
  aboutLevel(spirit, nickname) {
    const stage = SPIRIT_CONFIG.stages.find(s => s.level === spirit.level);
    const nextStage = SPIRIT_CONFIG.stages.find(s => s.level === spirit.level + 1);
    const remaining = stage.maxXP - spirit.xp;
    
    if (!nextStage) {
      return `${nickname}！我已经达到最高等级——精灵王！你真是太厉害了，和我一起完成了这么多学习旅程！\n\n接下来我们可以一起解锁更多精灵伙伴！`;
    }
    
    return `${nickname}，我现在是${stage.name}（Level ${spirit.level}）。\n\n还需要${remaining}点经验就能进化成${nextStage.name}了！再完成几个任务就可以升级啦！`;
  },
  
  suggestTask(profile, history, nickname) {
    const recent = history.slice(0, 3);
    const types = recent.map(t => t.type);
    
    const allTypes = Object.keys(SPIRIT_CONFIG.taskTypes);
    const missing = allTypes.find(t => !types.includes(t));
    
    if (missing) {
      const task = SPIRIT_CONFIG.taskTypes[missing];
      return `${nickname}，最近你做了很多${recent.map(t => SPIRIT_CONFIG.taskTypes[t.type].name).join('、')}，要不要试试${task.name}？\n\n完成${task.name}可以获得${task.baseXP}点经验值，我就能更快升级啦！`;
    }
    
    return `${nickname}，你最近学习很全面呢！今天想挑战什么？\n\n阅读、数学、书写还是创意手工？我都可以陪你！`;
  },
  
  aboutHistory(history, nickname) {
    if (history.length === 0) {
      return `${nickname}，我们还没有一起完成过任务呢！快去「学习打卡」页面，上传你的学习成果吧！\n\n我会一直在那里等你！`;
    }
    const last = history[0];
    return `${nickname}，你最近一次完成的是「${last.title}」，获得了${last.xp}点经验值！\n\n要继续加油哦，我等着和你一起升级！`;
  },
  
  encourage(profile, spirit, nickname) {
    const phrases = [
      `${nickname}，学习确实有时候会觉得累呢...但你之前完成了那么多任务，我知道你很厉害的！\n\n要不要先做个简单的任务，找回感觉？`,
      `没关系的，${nickname}！每个人都会有不想学习的时候。我可以陪你聊聊天，等你想开始的时候我们再一起努力！`,
      `${nickname}累了就休息一下吧！你已经很棒了，${spirit.name}会一直陪着你的。\n\n等你准备好了，我们再一起出发！`
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  },
  
  celebrate(profile, spirit, nickname) {
    const phrases = [
      `太棒了！${nickname}！我就知道你是最厉害的！${spirit.name}为你感到超级骄傲！`,
      `耶！${nickname}！看到你开心，我也好开心！我们继续一起加油，让我快点进化吧！`,
      `${nickname}你是最棒的！有你在，我觉得自己也变得更强了！\n\n我们一起继续加油！`
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  },
  
  aboutPoints(data, nickname) {
    return `${nickname}，你目前有${data.points}点积分！\n\n积分可以通过完成任务和给社区好友点赞获得。积分可以兑换道具，还能转化为精灵经验值哦！\n\n想要更多积分的话，多去社区给朋友们点赞吧！`;
  },
  
  aboutSpirits(data, nickname) {
    const unlocked = data.unlockedSpirits.length;
    const total = SPIRIT_CONFIG.spirits.length;
    return `${nickname}，你已经解锁了${unlocked}个精灵，还有${total - unlocked}个等待解锁！\n\n完成更多任务就能解锁新的精灵伙伴。去「精灵图鉴」看看吧！`;
  },
  
  thanks(nickname) {
    return `${nickname}不用谢！能陪着你学习，我也很开心！\n\n有什么需要随时找我哦！`;
  },
  
  goodbye(nickname, spirit) {
    return `${nickname}再见！${spirit.name}会一直在这里等你！\n\n记得明天再来找我学习哦！`;
  },
  
  defaultReply(profile, spirit, nickname, input) {
    // 更像真人的默认回复，根据输入内容给出不同回应
    if (input.length < 5) {
      return `${nickname}，你说得太简短了，我没太明白...\n\n可以多告诉我一些吗？比如你今天学了什么，或者想聊什么？`;
    }
    
    if (input.includes('?') || input.includes('？')) {
      return `${nickname}，这个问题很有意思！\n\n虽然我不太确定答案，但我们可以一起想想。或者你可以去「学习打卡」页面，完成一个任务，我们边做边聊？`;
    }
    
    const phrases = [
      `${nickname}，我在听呢！你说的这些很有意思。\n\n想聊聊学习，还是有什么任务想完成？`,
      `${nickname}，你可以问我关于任务、等级、积分的事情，或者告诉我你今天学了什么！\n\n我会记住的！`,
      `${nickname}，我在哦！要不要去看看「学习打卡」页面，完成一个任务让我成长一下？\n\n我等着和你一起升级呢！`
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
};

// ============ 工具函数 ============
const Utils = {
  // 格式化时间
  formatTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },
  
  // 创建 SVG 精灵（洛克王国风格）
  createSpiritSVG(level, size = 200) {
    const colors = {
      1: { main: '#A8E6CF', light: '#C8F6E0', dark: '#7FD8BE', accent: '#69C9A8' },
      2: { main: '#7FD8BE', light: '#A8E8D0', dark: '#5BC8A0', accent: '#4DB88E' },
      3: { main: '#FF8FAB', light: '#FFB3C6', dark: '#E85D8E', accent: '#D14D7E' },
      4: { main: '#C77DFF', light: '#E0B3FF', dark: '#A855F7', accent: '#9333EA' },
      5: { main: '#FFD700', light: '#FFE55C', dark: '#E6C200', accent: '#CCAA00' }
    };
    
    const c = colors[level] || colors[1];
    
    // 根据等级生成不同的 SVG 图案
    const shapes = {
      1: `<circle cx="100" cy="110" r="45" fill="${c.main}"/><circle cx="100" cy="75" r="35" fill="${c.light}"/><circle cx="85" cy="70" r="8" fill="${c.dark}"/><circle cx="115" cy="70" r="8" fill="${c.dark}"/><ellipse cx="100" cy="85" rx="6" ry="4" fill="${c.accent}"/><path d="M70 50 Q85 30 100 45 Q115 30 130 50" fill="${c.main}" stroke="${c.dark}" stroke-width="2"/>`,
      
      2: `<ellipse cx="100" cy="115" rx="50" ry="40" fill="${c.main}"/><ellipse cx="100" cy="70" rx="40" ry="35" fill="${c.light}"/><circle cx="82" cy="65" r="9" fill="${c.dark}"/><circle cx="118" cy="65" r="9" fill="${c.dark}"/><ellipse cx="100" cy="80" rx="7" ry="5" fill="${c.accent}"/><path d="M60 55 Q80 25 100 40 Q120 25 140 55" fill="${c.main}" stroke="${c.dark}" stroke-width="2"/><path d="M55 100 Q45 80 55 70" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/><path d="M145 100 Q155 80 145 70" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/>`,
      
      3: `<ellipse cx="100" cy="120" rx="55" ry="42" fill="${c.main}"/><ellipse cx="100" cy="65" rx="42" ry="38" fill="${c.light}"/><circle cx="80" cy="58" r="10" fill="${c.dark}"/><circle cx="120" cy="58" r="10" fill="${c.dark}"/><ellipse cx="100" cy="75" rx="8" ry="6" fill="${c.accent}"/><path d="M55 50 Q75 15 100 35 Q125 15 145 50" fill="${c.main}" stroke="${c.dark}" stroke-width="2"/><path d="M50 110 Q35 85 50 65" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/><path d="M150 110 Q165 85 150 65" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/><circle cx="100" cy="40" r="8" fill="${c.accent}" opacity="0.6"/>`,
      
      4: `<ellipse cx="100" cy="125" rx="58" ry="45" fill="${c.main}"/><ellipse cx="100" cy="60" rx="45" ry="40" fill="${c.light}"/><circle cx="78" cy="52" r="11" fill="${c.dark}"/><circle cx="122" cy="52" r="11" fill="${c.dark}"/><ellipse cx="100" cy="70" rx="9" ry="7" fill="${c.accent}"/><path d="M50 45 Q70 5 100 25 Q130 5 150 45" fill="${c.main}" stroke="${c.dark}" stroke-width="2"/><path d="M45 115 Q25 85 45 60" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/><path d="M155 115 Q175 85 155 60" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/><path d="M85 25 L100 10 L115 25" fill="${c.accent}" opacity="0.7"/><circle cx="100" cy="35" r="10" fill="${c.accent}" opacity="0.5"/>`,
      
      5: `<ellipse cx="100" cy="130" rx="60" ry="48" fill="${c.main}"/><ellipse cx="100" cy="55" rx="48" ry="42" fill="${c.light}"/><circle cx="75" cy="47" r="12" fill="${c.dark}"/><circle cx="125" cy="47" r="12" fill="${c.dark}"/><ellipse cx="100" cy="65" rx="10" ry="8" fill="${c.accent}"/><path d="M45 40 Q65 0 100 20 Q135 0 155 40" fill="${c.main}" stroke="${c.dark}" stroke-width="2"/><path d="M40 120 Q15 85 40 55" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/><path d="M160 120 Q185 85 160 55" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/><path d="M80 15 L100 0 L120 15" fill="${c.accent}"/><circle cx="100" cy="30" r="12" fill="${c.accent}" opacity="0.6"/><path d="M70 140 L100 155 L130 140" fill="${c.accent}" opacity="0.4"/>`
    };
    
    return `<svg width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow${level}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${c.light}" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="${c.main}" stop-opacity="0"/>
        </radialGradient>
        <filter id="shadow${level}">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="${c.dark}" flood-opacity="0.3"/>
        </filter>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#glow${level})" opacity="0.5"/>
      <g filter="url(#shadow${level})">${shapes[level] || shapes[1]}</g>
    </svg>`;
  },
  
  // 创建精灵蛋 SVG
  createEggSVG(color, size = 120) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="eggGlow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.3"/>
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="55" rx="35" ry="42" fill="url(#eggGlow)" stroke="${color}" stroke-width="2"/>
      <ellipse cx="50" cy="35" rx="20" ry="12" fill="${color}" opacity="0.3"/>
      <circle cx="42" cy="45" r="3" fill="#fff" opacity="0.6"/>
    </svg>`;
  },
  
  // 粒子特效 HTML
  createParticles(color, count = 30) {
    let html = '';
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const size = Math.random() * 6 + 2;
      const delay = Math.random() * 2;
      const duration = Math.random() * 2 + 1;
      html += `<div style="position:absolute;left:${x}%;top:${y}%;width:${size}px;height:${size}px;background:${color};border-radius:50%;animation:particle ${duration}s ${delay}s ease-out forwards;opacity:0;"></div>`;
    }
    return html;
  }
};

// 导出供其他页面使用
if (typeof window !== 'undefined') {
  window.SpiritBuddy = { SPIRIT_CONFIG, Storage, MemorySystem, ImageAnalyzer, ChatEngine, Utils };
}
