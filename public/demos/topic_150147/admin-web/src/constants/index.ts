// ========== 分类标签 ==========
export const categoryLabels: Record<string, string> = {
  science: '科学实验',
  nature: '自然探索',
  creative: '创意制作',
  programming: '编程入门',
  humanities: '人文社科',
  life: '生活实践',
  math: '数学思维',
  chinese: '语文素养',
  english: '英语启蒙',
  history: '历史探秘',
  geography: '地理世界',
  politics: '道德法治',
  physics: '物理探秘',
  chemistry: '化学魔法',
  biology: '生物世界',
  computer: '计算机基础',
  ai: 'AI初体验',
  other: '其他',
};

export const categoryColors: Record<string, string> = {
  science: 'blue',
  nature: 'green',
  creative: 'orange',
  programming: 'purple',
  humanities: 'volcano',
  life: 'cyan',
  math: 'geekblue',
  chinese: 'red',
  english: 'lime',
  history: 'gold',
  geography: 'green',
  politics: 'magenta',
  physics: 'blue',
  chemistry: 'orange',
  biology: 'green',
  computer: 'purple',
  ai: 'volcano',
  other: 'default',
};

// ========== 难度标签 ==========
export const difficultyLabels: Record<string, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
};

export const difficultyColors: Record<string, string> = {
  beginner: 'green',
  intermediate: 'orange',
  advanced: 'red',
};

// ========== 分类选项列表 ==========
export const categoryOptions = [
  { value: 'science', label: '科学实验' },
  { value: 'physics', label: '物理探秘' },
  { value: 'chemistry', label: '化学魔法' },
  { value: 'biology', label: '生物世界' },
  { value: 'nature', label: '自然探索' },
  { value: 'math', label: '数学思维' },
  { value: 'chinese', label: '语文素养' },
  { value: 'english', label: '英语启蒙' },
  { value: 'history', label: '历史探秘' },
  { value: 'geography', label: '地理世界' },
  { value: 'politics', label: '道德法治' },
  { value: 'computer', label: '计算机基础' },
  { value: 'programming', label: '编程入门' },
  { value: 'ai', label: 'AI初体验' },
  { value: 'creative', label: '创意制作' },
  { value: 'humanities', label: '人文社科' },
  { value: 'life', label: '生活实践' },
];

export const difficultyOptions = [
  { value: 'beginner', label: '初级' },
  { value: 'intermediate', label: '中级' },
  { value: 'advanced', label: '高级' },
];

export const gradeLevelOptions = [
  { value: '1-3', label: '1-3年级' },
  { value: '1-4', label: '1-4年级' },
  { value: '2-5', label: '2-5年级' },
  { value: '3-6', label: '3-6年级' },
  { value: '4-7', label: '4-7年级' },
  { value: '5-8', label: '5-8年级' },
  { value: '6-9', label: '6-9年级' },
];

// ========== 排序选项 ==========
export const sortOptions = [
  { value: 'created_at_desc', label: '最新发布' },
  { value: 'created_at_asc', label: '最早发布' },
  { value: 'submissions_desc', label: '最多提交' },
  { value: 'submissions_asc', label: '最少提交' },
];