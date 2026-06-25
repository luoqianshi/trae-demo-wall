export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  category: string;
  icon: string;
  url?: string;
}

export const newsData: NewsItem[] = [
  {
    id: 'news_1',
    title: '全国志愿服务信息系统升级上线',
    summary: '新系统支持志愿者注册、服务记录、证书生成等功能，让志愿服务更便捷。',
    source: '民政部',
    date: '2024-01-15',
    category: '政策',
    icon: '📋',
  },
  {
    id: 'news_2',
    title: '2024年度"最美志愿者"评选启动',
    summary: '全国范围内寻找最美志愿者，弘扬志愿服务精神，传递社会正能量。',
    source: '中国志愿服务联合会',
    date: '2024-01-12',
    category: '活动',
    icon: '🏆',
  },
  {
    id: 'news_3',
    title: '大学生志愿服务西部计划招募开启',
    summary: '号召青年学子投身西部建设，用青春书写奉献篇章。',
    source: '共青团中央',
    date: '2024-01-10',
    category: '招募',
    icon: '🎓',
  },
  {
    id: 'news_4',
    title: '社区志愿服务新模式：时间银行',
    summary: '志愿者服务时间可存储兑换，让爱心有回报，公益可持续。',
    source: '社会工作杂志',
    date: '2024-01-08',
    category: '创新',
    icon: '💡',
  },
  {
    id: 'news_5',
    title: '环保志愿服务：守护绿水青山',
    summary: '全国环保志愿者累计清理河道垃圾超万吨，植树造林百万棵。',
    source: '生态环境部',
    date: '2024-01-05',
    category: '环保',
    icon: '🌿',
  },
  {
    id: 'news_6',
    title: '关爱留守儿童：爱心包裹温暖童心',
    summary: '公益组织发起爱心包裹计划，为山区儿童送去新年礼物。',
    source: '中国儿童少年基金会',
    date: '2024-01-03',
    category: '帮扶',
    icon: '🎁',
  },
];