// 沟通场景
export const SCENES = [
  { id: 'progress', name: '成绩进步', icon: '📈' },
  { id: 'regress', name: '成绩退步', icon: '📉' },
  { id: 'homework', name: '作业情况', icon: '📝' },
  { id: 'classroom', name: '课堂表现', icon: '🎓' },
  { id: 'knowledge', name: '知识点', icon: '📚' },
  { id: 'cooperation', name: '家校配合', icon: '🤝' }
];

// 输出风格
export const STYLES = [
  { id: 'gentle', name: '温和鼓励型', desc: '以正面表达为主，适合敏感型家长' },
  { id: 'professional', name: '专业直接型', desc: '陈述事实为主，适合理性型家长' },
  { id: 'constructive', name: '建设性建议型', desc: '侧重具体改进方案，适合配合型家长' },
  { id: 'caring', name: '关怀提醒型', desc: '委婉提示，需要温和引导的家长' }
];

// 发送渠道
export const CHANNELS = [
  { id: 'wechat', name: '微信', maxLength: 300 },
  { id: 'sms', name: '短信', maxLength: 200 },
  { id: 'email', name: '邮件', maxLength: 800 },
  { id: 'phone', name: '电话要点', maxLength: 500 }
];

// 学科列表
export const SUBJECTS = [
  '语文', '数学', '英语', '物理', '化学', '生物',
  '历史', '地理', '政治', '音乐', '美术', '体育',
  '信息技术', '科学', '道德与法治'
];

// 年级列表
export const GRADES = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '初一', '初二', '初三',
  '高一', '高二', '高三'
];

// 存储键名
export const STORAGE_KEYS = {
  HISTORY: 'comm_history',
  SETTINGS: 'comm_settings'
};

// 历史记录上限
export const MAX_HISTORY = 500;

// 生成频率限制（次/分钟）
export const GENERATE_LIMIT = 5;
