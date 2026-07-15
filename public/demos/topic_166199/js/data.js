// Soloist HTML Demo - Mock数据

const MockData = {
  // 用户信息
  user: {
    nickname: '声乐爱好者',
    avatar: '🎤',
    voiceType: '男中音',
    memberLevel: 'premium',
    streakDays: 7,
    totalPracticeMinutes: 2400,
    completedCourses: 3,
    highestScore: 92
  },

  // 今日进度
  todayProgress: { minutes: 15, target: 20, percent: 75 },

  // 快捷入口
  quickEntries: [
    { icon: '🎤', title: '开始检测', color: ['#6C63FF', '#8B5CF6'] },
    { icon: '📖', title: '继续课程', color: ['#4FACFE', '#00F2FE'] },
    { icon: '🎼', title: '识谱', color: ['#FF6584', '#FF9A8B'] },
    { icon: '🤖', title: 'AI私教', color: ['#43E97B', '#38F9D7'] }
  ],

  // 本周统计
  weeklyStats: { practiceMinutes: 180, completedCourses: 3, avgScore: 82 },

  // 检测模式
  detectionModes: [
    { mode: 'comprehensive', title: '综合演唱评测', description: '音准、节奏、气息、技巧、情感五维全面分析', icon: '🎤', gradient: ['#6C63FF', '#8B5CF6'], tags: ['五维评分', 'AI建议', '完整报告'] },
    { mode: 'pitch', title: '音准专项检测', description: '实时音高曲线追踪，精准识别音准偏差', icon: '🎵', gradient: ['#4FACFE', '#00F2FE'], tags: ['实时曲线', '音分偏差', '钢琴卷帘'] },
    { mode: 'posture', title: '姿态与口型检测', description: '摄像头实时检测演唱姿势与元音口型', icon: '📷', gradient: ['#FF6584', '#FF9A8B'], tags: ['姿态纠正', '口型分析', '共鸣指导'] }
  ],

  // 五维评分
  dimensionScores: [
    { dimension: 'pitch', name: '音准', score: 88, weight: 40, evaluation: '音准整体稳定，高音区略有偏差', details: [{ name: '平均音准偏差', value: '±15音分', score: 88, status: 'good' }, { name: '高音准确率', value: '82%', score: 75, status: 'normal' }, { name: '低音准确率', value: '95%', score: 95, status: 'good' }] },
    { dimension: 'rhythm', name: '节奏', score: 82, weight: 25, evaluation: '节奏基本稳定，副歌部分有轻微抢拍', details: [{ name: '节奏稳定性', value: '良好', score: 85, status: 'good' }, { name: '切分准确性', value: '78%', score: 78, status: 'normal' }, { name: '抢拍次数', value: '2次', score: 80, status: 'normal' }] },
    { dimension: 'breath', name: '气息', score: 75, weight: 15, evaluation: '气息支撑尚可，长音稳定性需提升', details: [{ name: '最长长音', value: '12秒', score: 75, status: 'normal' }, { name: '换气点合理度', value: '85%', score: 85, status: 'good' }, { name: '音量稳定性', value: '一般', score: 65, status: 'bad' }] },
    { dimension: 'technique', name: '技巧', score: 70, weight: 10, evaluation: '颤音自然度较好，滑音使用偏多', details: [{ name: '颤音频率', value: '5.8Hz', score: 80, status: 'good' }, { name: '颤音幅度', value: '适中', score: 75, status: 'normal' }, { name: '滑音使用', value: '偏多', score: 55, status: 'bad' }] },
    { dimension: 'emotion', name: '情感', score: 78, weight: 10, evaluation: '情感表达到位，动态范围可更大', details: [{ name: '动态范围', value: '12dB', score: 72, status: 'normal' }, { name: '音量起伏', value: '自然', score: 80, status: 'good' }, { name: '情感标注', value: '准确', score: 82, status: 'good' }] }
  ],

  // AI建议
  aiSuggestions: [
    '高音区练习时建议先用哼鸣热身，逐步过渡到元音演唱',
    '长音练习可配合腹式呼吸，提升气息支撑稳定性',
    '副歌部分注意控制节奏，可使用节拍器辅助练习',
    '颤音表现良好，保持当前发声位置，减少不必要的滑音',
    '建议增加动态范围训练，让情感表达更有层次'
  ],

  // 历史检测记录
  detectionHistory: [
    { id: 'h1', modeName: '综合演唱评测', timestamp: Date.now() - 86400000, score: 85, duration: 30 },
    { id: 'h2', modeName: '音准专项检测', timestamp: Date.now() - 172800000, score: 78, duration: 25 },
    { id: 'h3', modeName: '综合演唱评测', timestamp: Date.now() - 259200000, score: 82, duration: 28 },
    { id: 'h4', modeName: '姿态与口型检测', timestamp: Date.now() - 345600000, score: 90, duration: 22 },
    { id: 'h5', modeName: '音准专项检测', timestamp: Date.now() - 432000000, score: 76, duration: 26 }
  ],

  // 课程模块
  courseModules: [
    { id: 'm1', index: 1, phase: 'foundation', title: '歌唱认知与呼吸基础', description: '建立正确的歌唱观念，掌握腹式呼吸法', difficulty: 1, duration: 25, focus: '腹式呼吸检测', tools: ['呼吸计时器', '气息长度记录'], status: 'completed', progress: 100 },
    { id: 'm2', index: 2, phase: 'foundation', title: '呼吸进阶与气息控制', description: '提升气息支撑能力，学习换气技巧', difficulty: 1, duration: 30, focus: '气息稳定性', tools: ['长音练习', '换气点标注'], status: 'completed', progress: 100 },
    { id: 'm3', index: 3, phase: 'foundation', title: '发声位置与共鸣基础', description: '找到正确的发声位置，建立共鸣腔体', difficulty: 2, duration: 35, focus: '共鸣位置分析', tools: ['哼鸣练习', '元音塑形'], status: 'in_progress', progress: 40 },
    { id: 'm4', index: 4, phase: 'foundation', title: '共鸣开发与声音美化', description: '开发头腔、胸腔共鸣，美化音色', difficulty: 2, duration: 40, focus: '频谱特征', tools: ['共鸣检测', '音色对比'], status: 'available', progress: 0 },
    { id: 'm5', index: 5, phase: 'intermediate', title: '音准基础与音程训练', description: '建立音准概念，练习大小音程', difficulty: 3, duration: 35, focus: '音准偏差', tools: ['音阶跟唱', '音程练习'], status: 'locked', progress: 0 },
    { id: 'm6', index: 6, phase: 'intermediate', title: '音域拓展与高音开发', description: '科学拓展音域，安全开发高音', difficulty: 3, duration: 40, focus: '音域范围', tools: ['半音爬升', '高音热身'], status: 'locked', progress: 0 },
    { id: 'm7', index: 7, phase: 'intermediate', title: '节奏基础与节拍训练', description: '掌握基本节奏型，提升节拍稳定性', difficulty: 3, duration: 35, focus: '节奏稳定性', tools: ['节拍器跟唱', '节奏型练习'], status: 'locked', progress: 0 },
    { id: 'm8', index: 8, phase: 'intermediate', title: '复杂节奏与乐感培养', description: '掌握切分、连音等复杂节奏', difficulty: 4, duration: 40, focus: '切分准确性', tools: ['节奏型组合', '乐感训练'], status: 'locked', progress: 0 },
    { id: 'm9', index: 9, phase: 'advanced', title: '咬字与吐字规范', description: '规范演唱咬字，提升歌词清晰度', difficulty: 4, duration: 40, focus: '歌词清晰度', tools: ['朗读练习', '咬字检测'], status: 'locked', progress: 0 },
    { id: 'm10', index: 10, phase: 'advanced', title: '情感表达与动态控制', description: '学习情感标注，掌握动态范围', difficulty: 4, duration: 45, focus: '动态范围', tools: ['情感标注', '强弱对比'], status: 'locked', progress: 0 },
    { id: 'm11', index: 11, phase: 'advanced', title: '完整歌曲演绎(上)', description: '整合所学技巧，完整演绎歌曲', difficulty: 5, duration: 50, focus: '综合评分', tools: ['整曲评测', '逐句点评'], status: 'locked', progress: 0 },
    { id: 'm12', index: 12, phase: 'advanced', title: '完整歌曲演绎(下)', description: '舞台表现力提升，个性化演绎', difficulty: 5, duration: 55, focus: '综合表现', tools: ['舞台模拟', '录像回看'], status: 'locked', progress: 0 }
  ],

  // 曲谱列表
  scores: [
    { id: 's1', title: '月亮代表我的心', artist: '邓丽君', key: 'C大调', bpm: 72, difficulty: 2, isFavorite: true, coverColor: ['#FFE0B2', '#FFCC80'], notes: [{ pitch: 'E4', lyric: '你' }, { pitch: 'E4', lyric: '问' }, { pitch: 'E4', lyric: '我' }, { pitch: 'G4', lyric: '爱' }, { pitch: 'G4', lyric: '你' }, { pitch: 'E4', lyric: '有' }, { pitch: 'G4', lyric: '多' }, { pitch: 'A4', lyric: '深' }] },
    { id: 's2', title: '后来', artist: '刘若英', key: 'G大调', bpm: 80, difficulty: 3, isFavorite: false, coverColor: ['#B3E5FC', '#81D4FA'], notes: [{ pitch: 'G4', lyric: '后' }, { pitch: 'A4', lyric: '来' }, { pitch: 'B4', lyric: '我' }, { pitch: 'A4', lyric: '总' }] },
    { id: 's3', title: '青花瓷', artist: '周杰伦', key: 'A大调', bpm: 85, difficulty: 4, isFavorite: true, coverColor: ['#C8E6C9', '#81C784'], notes: [{ pitch: 'A4', lyric: '素' }, { pitch: 'C5', lyric: '胚' }, { pitch: 'B4', lyric: '勾' }, { pitch: 'A4', lyric: '勒' }] },
    { id: 's4', title: '童年', artist: '罗大佑', key: 'C大调', bpm: 90, difficulty: 1, isFavorite: false, coverColor: ['#FFF9C4', '#FFF176'], notes: [{ pitch: 'C4', lyric: '池' }, { pitch: 'E4', lyric: '塘' }, { pitch: 'G4', lyric: '边' }, { pitch: 'E4', lyric: '的' }] },
    { id: 's5', title: '小幸运', artist: '田馥甄', key: 'D大调', bpm: 78, difficulty: 3, isFavorite: false, coverColor: ['#F8BBD0', '#F48FB1'], notes: [{ pitch: 'D4', lyric: '我' }, { pitch: 'F4', lyric: '听' }, { pitch: 'A4', lyric: '见' }, { pitch: 'A4', lyric: '雨' }] },
    { id: 's6', title: '茉莉花', artist: '民歌', key: 'F大调', bpm: 70, difficulty: 2, isFavorite: true, coverColor: ['#E1BEE7', '#CE93D8'], notes: [{ pitch: 'F4', lyric: '好' }, { pitch: 'G4', lyric: '一' }, { pitch: 'A4', lyric: '朵' }, { pitch: 'C5', lyric: '美' }] }
  ],

  // 声乐DNA
  vocalDNA: {
    voiceType: '男中音',
    range: { lowest: 'C2', highest: 'G4', semitones: 28 },
    comfortable: { lowest: 'E2', highest: 'D4' },
    timbre: [
      { name: '亮度', value: 65 },
      { name: '厚度', value: 78 },
      { name: '沙哑度', value: 30 },
      { name: '穿透力', value: 58 },
      { name: '柔和度', value: 72 }
    ],
    description: '您的声部为男中音，音色温暖厚实，中低音区表现优异，适合演唱抒情类歌曲。舒适音区表现稳定，高音区可通过科学训练进一步拓展。'
  },

  // 成长数据
  growthData: {
    weekly: [72, 75, 78, 76, 80, 83, 85],
    weeklyLabels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    milestones: [
      { icon: '🎯', title: '完成第一节课', desc: '迈出声乐学习第一步', date: '70天前' },
      { icon: '🔥', title: '连续打卡7天', desc: '养成练习习惯', date: '50天前' },
      { icon: '📈', title: '音域拓展至G4', desc: '高音区突破', date: '30天前' },
      { icon: '⭐', title: '综合评分突破85', desc: '演唱水平提升', date: '10天前' }
    ]
  },

  // 成就
  achievements: [
    { icon: '🎓', title: '初出茅庐', desc: '完成第一节课程', unlocked: true },
    { icon: '📚', title: '勤学苦练', desc: '完成5节课程', unlocked: true },
    { icon: '🏆', title: '学霸登场', desc: '完成10节课程', unlocked: false, progress: 5, target: 10 },
    { icon: '🎵', title: '音域探索者', desc: '音域达到2个八度', unlocked: true },
    { icon: '🎤', title: '高音达人', desc: '稳定演唱G4以上', unlocked: true },
    { icon: '🐬', title: '海豚音', desc: '稳定演唱C5以上', unlocked: false, progress: 0, target: 1 },
    { icon: '🔥', title: '坚持一周', desc: '连续打卡7天', unlocked: true },
    { icon: '💪', title: '半月达人', desc: '连续打卡15天', unlocked: true },
    { icon: '🌙', title: '月度之星', desc: '连续打卡30天', unlocked: false, progress: 15, target: 30 }
  ],

  // 社区动态
  communityPosts: [
    { id: 'p1', nickname: '音乐梦想家', avatar: '🌟', content: '今天练习了高音，感觉进步很大！AI检测评分从70提升到了82，继续加油！', minutes: 35, score: 82, likes: 24, comments: 5, time: '2小时前' },
    { id: 'p2', nickname: '夜莺', avatar: '🐦', content: '分享一首刚学的《月亮代表我的心》，气息控制比之前好多了', minutes: 45, score: 88, likes: 56, comments: 12, time: '5小时前' },
    { id: 'p3', nickname: '声带修行者', avatar: '禅', content: '坚持打卡第30天！从五音不全到能完整唱一首歌，感谢Soloist的陪伴', minutes: 28, score: 76, likes: 128, comments: 32, time: '8小时前' }
  ],

  // 排行榜
  leaderboard: [
    { rank: 1, nickname: '天籁之音', avatar: '🎵', score: 96, trend: 'same' },
    { rank: 2, nickname: '歌神降临', avatar: '🎤', score: 94, trend: 'up' },
    { rank: 3, nickname: '音浪', avatar: '🌊', score: 93, trend: 'down' },
    { rank: 4, nickname: '麦霸', avatar: '🎙️', score: 91, trend: 'up' },
    { rank: 5, nickname: '夜曲', avatar: '🌙', score: 90, trend: 'same' },
    { rank: 42, nickname: '我', avatar: '🎤', score: 82, trend: 'up', isMe: true }
  ],

  // AI私教回复
  aiReplies: {
    '气息': '改善气息建议从以下几方面入手：\n1. 练习腹式呼吸：躺平感受腹部起伏\n2. 长音练习：从5秒开始，逐步延长到15-20秒\n3. 换气点规划：提前标记乐句换气位置\n4. 狗喘气练习：快速短促呼吸，锻炼横膈膜\n\n建议每天练习10-15分钟，坚持2周可见明显改善！',
    '高音': '高音上不去的常见原因和解决方案：\n1. 气息支撑不足：先练好气息\n2. 发声位置偏后：将声音位置前移\n3. 心理紧张：从略低于极限的音高开始\n4. 缺乏头声：练习哼鸣找到头腔共鸣\n\n建议每天做半音爬升练习！',
    '颤音': '颤音练习方法：\n1. 先稳定长音：能稳定唱出5秒以上再练\n2. 模仿警笛声：用"呜"音上下波动\n3. 腹部跳动：感受腹肌规律跳动\n4. 理想频率：每秒5-7次波动\n\n注意：颤音是放松状态下的自然产物！',
    '紧张': '演唱紧张缓解方法：\n1. 深呼吸放松：做3次深呼吸\n2. 身体扫描：逐步放松每个部位\n3. 充分热身：开嗓增强自信\n4. 接受不完美：专注于音乐表达'
  },

  // 标准音高
  noteFreqs: {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
    'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25
  }
};

// 音名转简谱数字
function noteToNumber(pitch) {
  const map = { 'C4': '1', 'D4': '2', 'E4': '3', 'F4': '4', 'G4': '5', 'A4': '6', 'B4': '7', 'C5': '1·' };
  return map[pitch] || pitch;
}

// 获取评分颜色
function getScoreColor(score) {
  if (score >= 90) return '#4CAF50';
  if (score >= 75) return '#6C63FF';
  if (score >= 60) return '#FF9800';
  return '#F44336';
}

// 获取评级
function getRating(score) {
  if (score >= 90) return '优秀';
  if (score >= 75) return '良好';
  if (score >= 60) return '合格';
  return '需努力';
}
