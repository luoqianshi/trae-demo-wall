/// <reference types="vite/client" />

// ==================== 环境变量类型声明 ====================

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ==================== API 响应类型 ====================

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
}

interface PaginatedResponse<T = any> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface ApiError {
  message: string;
  code: number;
  status?: number;
}

// ==================== 用户相关类型 ====================

interface UserInfo {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  avatarUrl?: string;
  createdAt: string;
}

// ==================== 宝宝相关类型 ====================

interface BabyInfo {
  id: string;
  name: string;
  gender: '男' | '女';
  birthDate: string;
  height?: number;
  weight?: number;
  headCircumference?: number;
  avatar?: string;
}

// ==================== 记录相关类型 ====================

interface FeedingRecordInput {
  babyId: string;
  type: 'breast' | 'formula' | 'solid';
  duration?: number;
  amount?: number;
  startTime: string;
  endTime?: string;
  notes?: string;
}

interface SleepRecordInput {
  babyId: string;
  startTime: string;
  endTime: string;
  quality: 'good' | 'normal' | 'bad';
  notes?: string;
}

interface DiaperRecordInput {
  babyId: string;
  type: 'pee' | 'poop' | 'both';
  time: string;
  color?: string;
  notes?: string;
}

// ==================== 健康相关类型 ====================

interface VaccinationRecord {
  id: string;
  vaccineName: string;
  type: 'free' | 'paid';
  scheduledDate: string;
  actualDate?: string;
  status: 'scheduled' | 'completed' | 'missed';
  batchNumber?: string;
  notes?: string;
}

interface CheckupRecord {
  id: string;
  date: string;
  checkupType: 'routine' | 'follow_up' | 'specialist';
  height?: number;
  weight?: number;
  headCircumference?: number;
  doctorNotes?: string;
  doctorName?: string;
}

interface GrowthDataPoint {
  ageInMonths: number;
  height: number;
  weight: number;
  headCircumference?: number;
  recordedAt: string;
}

// ==================== 知识库相关类型 ====================

interface KnowledgeArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  stage: string[];
  ageRange?: string;
  readTime: string;
  author?: string;
  createdAt?: string;
}

interface KnowledgeCategory {
  key: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

// ==================== 新闻相关类型 ====================

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  categoryLabel: string;
  urgency: 'high' | 'medium' | 'low';
  source: string;
  date: string;
  url?: string;
  tags: string[];
  safetyTips?: string[];
}

interface NewsCategory {
  key: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

// ==================== 阶段相关类型 ====================

interface StageModule {
  icon: string;
  title: string;
  description: string;
  color: string;
  features: string[];
}

interface StageTimelineItem {
  week: string;
  title: string;
  content: string;
}

interface StageDetailInfo {
  key: string;
  name: string;
  slogan: string;
  icon: string;
  gradient: string;
  duration: string;
  description: string;
  modules: StageModule[];
  timeline: StageTimelineItem[];
  tips: string[];
}

// ==================== 统计相关类型 ====================

interface DailyStats {
  feedingCount: number;
  totalAmount: number;
  sleepHours: number;
  diaperCount: number;
}

interface WeeklyTrend {
  day: string;
  feeding: number;
  sleep: number;
  diaper: number;
}

interface MonthlySummary {
  totalFeedings: number;
  averageSleepHours: number;
  totalDiapers: number;
  bestSleepDay: string;
  worstSleepDay: string;
}

// ==================== 设置相关类型 ====================

interface NotificationSettings {
  feeding: boolean;
  sleep: boolean;
  vaccine: boolean;
  news: boolean;
}

// ==================== 四阶段定义 ====================
export type StageKey = 'preparing' | 'pregnancy' | 'birth' | 'parenting';

export interface StageInfo {
  key: StageKey;
  name: string;
  icon: string;
  color: string;       // Tailwind色类
  gradientFrom: string;
  gradientTo: string;
  description: string;
  duration: string;
}

export const STAGE_LIST: StageInfo[] = [
  { key: 'preparing', name: '备孕期', icon: '🌱', color: 'mint', gradientFrom: '#E8F5E9', gradientTo: '#C8E6C9', description: '科学备孕，迎接新生命', duration: '孕前0-12个月' },
  { key: 'pregnancy', name: '怀孕期', icon: '🤰', color: 'soft-pink', gradientFrom: '#FFE4EC', gradientTo: '#FFB6C1', description: '呵护孕期每一天', duration: '约40周' },
  { key: 'birth', name: '生产期', icon: '🏥', color: 'light-blue', gradientFrom: '#E6F4FF', gradientTo: '#BBDEFB', description: '迎接宝宝降生', duration: '产前至产后42天' },
  { key: 'parenting', name: '养育期', icon: '👶', color: 'soft-blue', gradientFrom: '#E8EAF6', gradientTo: '#C5CAE9', description: '陪伴宝宝成长', duration: '0-36个月' },
];

// ==================== 四阶段统一记录类型 ====================
export type RecordCategory =
  // 备孕期
  | 'ovulation' | 'basal_temp' | 'pre_weight' | 'folic_acid' | 'menstrual' | 'prenatal_checkup'
  // 怀孕期
  | 'fetal_movement' | 'fundal_height' | 'pregnancy_weight' | 'fetal_heart' | 'discomfort'
  | 'nutrition' | 'pregnancy_mood' | 'belly_photo'
  // 生产期
  | 'contraction' | 'water_break' | 'labor_progress' | 'apgar_score' | 'postpartum_recovery'
  // 养育期（保留原有）
  | 'feeding' | 'sleep' | 'diaper';

// 所有记录项的元数据
export interface RecordFieldMeta {
  key: RecordCategory;
  name: string;
  icon: string;
  stage: StageKey;
  unit?: string;           // 显示单位
  inputType: 'text' | 'number' | 'time' | 'date' | 'select' | 'textarea' | 'toggle';
  options?: string[];     // select类型的选项
  placeholder?: string;
  defaultValue?: any;
}

// 四阶段所有可记录项的完整配置
export const RECORD_FIELDS_CONFIG: Record<StageKey, RecordFieldMeta[]> = {
  preparing: [
    { key: 'ovulation', name: '排卵日', icon: '🥚', stage: 'preparing', inputType: 'date', placeholder: '选择排卵日期' },
    { key: 'basal_temp', name: '基础体温', icon: '🌡️', stage: 'preparing', unit: '°C', inputType: 'number', placeholder: '如：36.7' },
    { key: 'pre_weight', name: '体重', icon: '⚖️', stage: 'preparing', unit: 'kg', inputType: 'number', placeholder: '如：55.5' },
    { key: 'folic_acid', name: '叶酸服用', icon: '💊', stage: 'preparing', inputType: 'select', options: ['已服用', '忘记', '无'], defaultValue: '已服用' },
    { key: 'menstrual', name: '月经记录', icon: '🩸', stage: 'preparing', inputType: 'select', options: ['已来潮', '未到', '量少', '正常', '偏多'] },
    { key: 'prenatal_checkup', name: '产检预约/结果', icon: '🏥', stage: 'preparing', inputType: 'textarea', placeholder: '记录产检项目或结果' },
  ],
  pregnancy: [
    { key: 'fetal_movement', name: '胎动次数', icon: '💓', stage: 'pregnancy', unit: '次/小时', inputType: 'number', placeholder: '如：8' },
    { key: 'fundal_height', name: '宫高腹围', icon: '📏', stage: 'pregnancy', inputType: 'text', placeholder: '宫高XXcm 腹围XXcm' },
    { key: 'pregnancy_weight', name: '孕期体重', icon: '⚖️', stage: 'pregnancy', unit: 'kg', inputType: 'number', placeholder: '当前体重' },
    { key: 'fetal_heart', name: '胎心率', icon: '❤️', stage: 'pregnancy', unit: 'bpm', inputType: 'number', placeholder: '如：145' },
    { key: 'discomfort', name: '不适症状', icon: '😣', stage: 'pregnancy', inputType: 'textarea', placeholder: '记录不适症状' },
    { key: 'nutrition', name: '营养摄入', icon: '🥗', stage: 'pregnancy', inputType: 'textarea', placeholder: '今日饮食记录' },
    { key: 'pregnancy_mood', name: '心情状态', icon: '😊', stage: 'pregnancy', inputType: 'select', options: ['很好', '一般', '焦虑', '疲惫', '开心'] },
    { key: 'belly_photo', name: '肚肚日记', icon: '📸', stage: 'pregnancy', inputType: 'text', placeholder: '记录本周变化感受' },
  ],
  birth: [
    { key: 'contraction', name: '宫缩情况', icon: '⏱️', stage: 'birth', inputType: 'text', placeholder: '频率/强度/持续时间' },
    { key: 'water_break', name: '破水情况', icon: '💧', stage: 'birth', inputType: 'select', options: ['未破水', '已破水(清)', '已破水(浑浊)'] },
    { key: 'labor_progress', name: '分娩进程', icon: '🏥', stage: 'birth', inputType: 'select', options: ['未开始', '潜伏期', '活跃期', '过渡期', '第二产程', '已分娩'] },
    { key: 'apgar_score', name: '新生儿评分', icon: '👶', stage: 'birth', unit: '分', inputType: 'number', placeholder: 'Apgar评分(0-10)' },
    { key: 'postpartum_recovery', name: '产后恢复', icon: '💪', stage: 'birth', inputType: 'textarea', placeholder: '记录产后恢复情况' },
  ],
  parenting: [
    { key: 'feeding', name: '喂养', icon: '🍼', stage: 'parenting', inputType: 'select', options: ['母乳', '奶粉', '辅食'] },
    { key: 'sleep', name: '睡眠', icon: '😴', stage: 'parenting', inputType: 'time-range', placeholder: '入睡-醒来时间' },
    { key: 'diaper', name: '排便', icon: '💩', stage: 'parenting', inputType: 'select', options: ['小便', '大便', '都有'] },
  ],
};

// 统一记录条目接口
export interface UnifiedRecord {
  id: string;
  category: RecordCategory;
  stage: StageKey;
  value: string | number;
  note?: string;
  time: string;
  date: string;        // YYYY-MM-DD
  createdAt: number;   // timestamp
}
