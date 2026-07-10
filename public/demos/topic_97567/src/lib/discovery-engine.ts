import type { ProfileRecord } from './user-profile';

export type DiscoveryType = 'pattern' | 'comparison';

export interface Discovery {
  type: DiscoveryType;
  title: string;
  content: string;
  relatedRecordIndices?: number[];
}

export interface DiscoveryResult {
  hasDiscovery: boolean;
  discovery?: Discovery;
}

const PATTERN_THRESHOLD = 3;
const PATTERN_WINDOW = 5;
const COMPARISON_THRESHOLD = 0.3;

const CONTENT_KEYWORDS: Record<string, string[]> = {
  '学习': ['学习', '学', '读书', '课程', '练习', '复习', '笔记', '知识'],
  '运动': ['运动', '跑步', '健身', '锻炼', '散步', '游泳', '瑜伽', '打球'],
  '工作': ['工作', '项目', '任务', '开会', '加班', '汇报', '完成', '交付'],
  '习惯': ['习惯', '坚持', '每天', '打卡', '早起', '规律', '日常'],
  '编程': ['编程', '代码', '开发', '调试', '部署', '功能', 'bug', '技术'],
  '健康': ['健康', '睡眠', '饮食', '休息', '体检', '养生', '喝水'],
  '情绪': ['开心', '焦虑', '压力', '放松', '平静', '感恩', '满足', '烦躁'],
  '社交': ['朋友', '家人', '聚会', '聊天', '陪伴', '见面'],
};

function extractContentTopics(content: string): string[] {
  const topics: string[] = [];
  for (const [topic, keywords] of Object.entries(CONTENT_KEYWORDS)) {
    if (keywords.some(kw => content.includes(kw))) {
      topics.push(topic);
    }
  }
  return topics;
}

export function detectPattern(records: ProfileRecord[]): Discovery | null {
  if (records.length < PATTERN_THRESHOLD) return null;

  const recentRecords = records.slice(0, PATTERN_WINDOW);
  const tagCounts: Record<string, number> = {};

  for (const record of recentRecords) {
    const sources: string[][] = [];
    if (record.tags && Array.isArray(record.tags) && record.tags.length > 0) {
      sources.push(record.tags);
    }
    if (record.content && typeof record.content === 'string') {
      sources.push(extractContentTopics(record.content));
    }
    for (const tags of sources) {
      for (const tag of tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
  }

  const dominantTag = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])[0];

  if (!dominantTag || dominantTag[1] < PATTERN_THRESHOLD) {
    return null;
  }

  const relatedIndices = recentRecords
    .map((r, i) => {
      const hasTag = r.tags?.includes(dominantTag[0]);
      const hasContent = r.content && extractContentTopics(r.content).includes(dominantTag[0]);
      return (hasTag || hasContent) ? i : -1;
    })
    .filter(i => i >= 0);

  return {
    type: 'pattern',
    title: `你在持续关注「${dominantTag[0]}」`,
    content: `我注意到你最近${dominantTag[1]}次记录都和「${dominantTag[0]}」有关。这种持续的关注，说明你正在这个方向上积累力量 🦋`,
    relatedRecordIndices: relatedIndices,
  };
}

export function detectComparison(records: ProfileRecord[]): Discovery | null {
  if (records.length < 3) return null;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentRecords = records.filter(r => new Date(r.created_at) >= sevenDaysAgo);
  const previousRecords = records.filter(r => {
    const date = new Date(r.created_at);
    return date >= fourteenDaysAgo && date < sevenDaysAgo;
  });

  if (previousRecords.length === 0) return null;

  const recentCount = recentRecords.length;
  const previousCount = previousRecords.length;
  const changeRatio = (recentCount - previousCount) / previousCount;

  if (Math.abs(changeRatio) < COMPARISON_THRESHOLD) return null;

  const direction = changeRatio > 0 ? '多了' : '少了';
  const changeAmount = Math.abs(recentCount - previousCount);
  const emoji = changeRatio > 0 ? '👏' : '🌱';

  return {
    type: 'comparison',
    title: changeRatio > 0 ? '你在加速成长' : '放慢脚步也没关系',
    content: `相比上周，这周你的记录${direction}${changeAmount}条。${
      changeRatio > 0
        ? '你正在从"想"变成"做"，这种转变让我很开心！'
        : '有时候慢下来也是一种智慧，我会一直在这里等你~'
    } ${emoji}`,
  };
}

export function discover(records: ProfileRecord[]): DiscoveryResult {
  const pattern = detectPattern(records);
  if (pattern) {
    return { hasDiscovery: true, discovery: pattern };
  }

  const comparison = detectComparison(records);
  if (comparison) {
    return { hasDiscovery: true, discovery: comparison };
  }

  return { hasDiscovery: false };
}
