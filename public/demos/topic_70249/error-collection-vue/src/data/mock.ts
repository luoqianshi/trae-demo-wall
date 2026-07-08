export interface ErrorItem {
  id: number
  subject: string
  topic: string
  subTopic: string
  difficulty: 'easy' | 'medium' | 'hard'
  reason: string[]
  content: string
  wrongAnswer?: string
  correctAnswer?: string
  status: 'unmastered' | 'reviewing' | 'mastered'
  createdAt: string
  imageUrl?: string
}

export const mockErrors: ErrorItem[] = [
  {
    id: 1,
    subject: '数学',
    topic: '三角函数',
    subTopic: '诱导公式',
    difficulty: 'medium',
    reason: ['公式记错'],
    content: '已知函数 f(x) = 2sin(2x + π/3)，求其在 [0, π] 上的最大值。',
    wrongAnswer: 'f(x) = sin(2x) + √3/2',
    correctAnswer: '最大值为 2',
    status: 'unmastered',
    createdAt: '2026-07-02',
  },
  {
    id: 2,
    subject: '物理',
    topic: '力学',
    subTopic: '动量守恒',
    difficulty: 'hard',
    reason: ['思路受阻'],
    content: '如图，光滑水平面上有一质量为 M 的木板，一质量为 m 的滑块以速度 v0 滑上木板...',
    status: 'unmastered',
    createdAt: '2026-06-28',
  },
  {
    id: 3,
    subject: '化学',
    topic: '氧化还原',
    subTopic: '方程式配平',
    difficulty: 'easy',
    reason: ['计算失误'],
    content: '配平下列氧化还原反应：KMnO4 + HCl → KCl + MnCl2 + Cl2 + H2O',
    status: 'mastered',
    createdAt: '2026-06-20',
  },
  {
    id: 4,
    subject: '数学',
    topic: '函数与导数',
    subTopic: '单调性',
    difficulty: 'medium',
    reason: ['概念不清'],
    content: '判断函数 f(x) = x³ - 3x 的单调递增区间。',
    status: 'reviewing',
    createdAt: '2026-07-01',
  },
  {
    id: 5,
    subject: '物理',
    topic: '电磁学',
    subTopic: '电磁感应',
    difficulty: 'hard',
    reason: ['概念不清', '公式记错'],
    content: '一导体棒在匀强磁场中切割磁感线，求感应电动势的大小和方向。',
    status: 'unmastered',
    createdAt: '2026-06-25',
  },
  {
    id: 6,
    subject: '数学',
    topic: '数列',
    subTopic: '等差数列',
    difficulty: 'easy',
    reason: ['审题偏差'],
    content: '已知等差数列 {an} 中，a3 = 5，a7 = 13，求通项公式。',
    status: 'mastered',
    createdAt: '2026-06-15',
  },
  {
    id: 7,
    subject: '数学',
    topic: '解析几何',
    subTopic: '椭圆',
    difficulty: 'hard',
    reason: ['思路受阻'],
    content: '已知椭圆 C: x²/4 + y²/3 = 1，过右焦点 F 的直线交椭圆于 A, B 两点，求 |AB| 的最大值。',
    status: 'unmastered',
    createdAt: '2026-06-30',
  },
  {
    id: 8,
    subject: '物理',
    topic: '力学',
    subTopic: '牛顿定律',
    difficulty: 'medium',
    reason: ['计算失误'],
    content: '质量为 2kg 的物体在水平面上受 10N 拉力作用，摩擦系数 μ=0.3，求加速度。',
    status: 'reviewing',
    createdAt: '2026-07-03',
  },
]

export const subjectColors: Record<string, string> = {
  '数学': 'bg-blue-50 text-blue-700 border-blue-200',
  '物理': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '化学': 'bg-amber-50 text-amber-700 border-amber-200',
  '英语': 'bg-purple-50 text-purple-700 border-purple-200',
  '语文': 'bg-rose-50 text-rose-700 border-rose-200',
}

export const difficultyMap: Record<string, {label: string, class: string}> = {
  easy: { label: '简单', class: 'bg-green-50 text-green-700 border-green-200' },
  medium: { label: '中等', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  hard: { label: '困难', class: 'bg-red-50 text-red-700 border-red-200' },
}

export const statusMap: Record<string, {label: string, class: string}> = {
  unmastered: { label: '未掌握', class: 'bg-red-50 text-red-700' },
  reviewing: { label: '复习中', class: 'bg-blue-50 text-blue-700' },
  mastered: { label: '已掌握', class: 'bg-green-50 text-green-700' },
}

export const reviewItems = [
  { id: 1, title: '三角函数诱导公式', subject: '数学', daysLeft: 0, priority: 'high' },
  { id: 2, title: '动量守恒综合题', subject: '物理', daysLeft: 1, priority: 'high' },
  { id: 4, title: '函数单调性判断', subject: '数学', daysLeft: 2, priority: 'medium' },
  { id: 5, title: '电磁感应方向判断', subject: '物理', daysLeft: 3, priority: 'medium' },
  { id: 7, title: '椭圆弦长最值', subject: '数学', daysLeft: 5, priority: 'low' },
]

export const knowledgeData = {
  math: [
    { name: '函数与导数', value: 65 },
    { name: '三角函数', value: 80 },
    { name: '数列', value: 45 },
    { name: '立体几何', value: 55 },
    { name: '解析几何', value: 70 },
    { name: '概率统计', value: 30 },
  ],
  physics: [
    { name: '力学', value: 60 },
    { name: '电磁学', value: 75 },
    { name: '热学', value: 40 },
    { name: '光学', value: 35 },
    { name: '近代物理', value: 25 },
  ],
  chemistry: [
    { name: '氧化还原', value: 50 },
    { name: '化学平衡', value: 45 },
    { name: '有机化学', value: 55 },
    { name: '电化学', value: 60 },
  ],
}
