// Bristol 7 型定义
const BRISTOL_TYPES = [
  { type: 1, name: '坚果状', description: '硬球，像坚果，难以排出', shortDesc: '便秘倾向' },
  { type: 2, name: '香肠状但硬', description: '香肠状但多块状', shortDesc: '偏干' },
  { type: 3, name: '香肠状有裂纹', description: '香肠状，表面有裂纹', shortDesc: '正常偏低' },
  { type: 4, name: '光滑香肠', description: '光滑柔软的香肠', shortDesc: '正常' },
  { type: 5, name: '柔软块状', description: '软块，边缘清晰', shortDesc: '正常' },
  { type: 6, name: '边缘毛糙', description: '柔软，边缘毛糙', shortDesc: '偏稀' },
  { type: 7, name: '水样', description: '完全水样，无固体', shortDesc: '腹泻倾向' }
];

// Bristol 类型健康判断
function getBristolHealthStatus(type) {
  if (type === 1 || type === 2) return { status: '偏干', color: '#FBBC04', advice: '建议多喝水、增加膳食纤维' };
  if (type === 3 || type === 4 || type === 5) return { status: '正常', color: '#34A853', advice: '您的排便看起来正常，继续保持！' };
  if (type === 6 || type === 7) return { status: '偏稀', color: '#FBBC04', advice: '如持续出现建议咨询医生' };
  return { status: '未知', color: '#80868b', advice: '' };
}

// Bristol 类型颜色（用于日历点）
const BRISTOL_COLORS = {
  1: '#A0522D',
  2: '#8B4513',
  3: '#D2691E',
  4: '#34A853',
  5: '#228B22',
  6: '#DAA520',
  7: '#CD853F'
};

// 粪便颜色选项
const STOOL_COLORS = [
  { key: 'brown', name: '棕色', hex: '#8B4513', meaning: '正常' },
  { key: 'yellow', name: '黄色', hex: '#DAA520', meaning: '可能脂肪吸收不良' },
  { key: 'green', name: '绿色', hex: '#228B22', meaning: '可能食物通过过快' },
  { key: 'black', name: '黑色', hex: '#2F2F2F', meaning: '可能上消化道出血' },
  { key: 'red', name: '红色', hex: '#DC143C', meaning: '可能下消化道出血' },
  { key: 'gray', name: '灰色', hex: '#A9A9A9', meaning: '可能胆汁分泌问题' },
  { key: 'white', name: '白色', hex: '#F5F5F5', meaning: '可能胆管阻塞' }
];

// 颜色键到名称的映射
const STOOL_COLOR_NAME_MAP = {
  brown: '棕色', yellow: '黄色', green: '绿色',
  black: '黑色', red: '红色', gray: '灰色', white: '白色'
};

// 主题颜色
const COLORS = {
  PRIMARY: '#4285F4',
  PRIMARY_DARK: '#1a73e8',
  PRIMARY_LIGHT: '#e8f0fe',
  SECONDARY: '#34A853',
  WARNING: '#FBBC04',
  ERROR: '#EA4335',
  TEXT_PRIMARY: '#202124',
  TEXT_SECONDARY: '#5f6368',
  TEXT_HINT: '#80868b',
  TEXT_DISABLED: '#bdc1c6',
  DIVIDER: '#e8eaed',
  BACKGROUND: '#f8f9fa',
  SURFACE: '#ffffff',
  ON_PRIMARY: '#ffffff'
};

module.exports = {
  BRISTOL_TYPES, BRISTOL_COLORS, getBristolHealthStatus,
  STOOL_COLORS, STOOL_COLOR_NAME_MAP, COLORS
};
