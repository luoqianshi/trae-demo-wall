export interface UserProfile {
  topicPreference: string[];     // 最频繁的标签，Top 3
  emotionBaseline: string;       // 近期主导情绪
  growthStage: string;           // 基于雪球阶段的成长阶段
  selfTalkPattern: string;       // 基于用词分析的自我对话模式：positive/neutral/negative
}

export interface ProfileRecord {
  content: string;
  tags: string[];
  mood: string;
  created_at: string;
}

// 消极自我对话关键词
const NEGATIVE_SELF_TALK_WORDS = ['做不到', '没用', '失败', '不行', '太差', '废物', '没用', '做不好', '不可能', '放弃', '没希望'];
// 积极自我对话关键词
const POSITIVE_SELF_TALK_WORDS = ['做到了', '可以', '进步', '坚持', '努力', '成长', '越来越好', '能行', '没问题', '有信心'];

// mood 到情绪类别的映射
const MOOD_TO_EMOTION: Record<string, string> = {
  'happy': 'positive',
  'proud': 'positive',
  'excited': 'positive',
  'grateful': 'positive',
  'calm': 'neutral',
  'neutral': 'neutral',
  'okay': 'neutral',
  'sad': 'depressed',
  'depressed': 'depressed',
  'anxious': 'anxious',
  'stressed': 'anxious',
  'angry': 'negative',
  'frustrated': 'negative',
};

export function buildUserProfile(records: ProfileRecord[]): UserProfile {
  if (!records || records.length === 0) {
    return {
      topicPreference: [],
      emotionBaseline: 'neutral',
      growthStage: 'newcomer',
      selfTalkPattern: 'neutral',
    };
  }

  // 只分析最近7天的记录
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentRecords = records.filter(r => new Date(r.created_at) >= sevenDaysAgo);

  // 如果最近7天没有记录，使用全部记录
  const analysisRecords = recentRecords.length > 0 ? recentRecords : records;

  // 1. 话题偏好：统计标签频率，返回 Top 3
  const tagCount: Record<string, number> = {};
  for (const record of analysisRecords) {
    if (record.tags && Array.isArray(record.tags)) {
      for (const tag of record.tags) {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      }
    }
  }
  const topicPreference = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);

  // 2. 情绪基线：统计 mood 分布，返回主导情绪
  const emotionCount: Record<string, number> = {};
  for (const record of analysisRecords) {
    const emotion = MOOD_TO_EMOTION[record.mood] || 'neutral';
    emotionCount[emotion] = (emotionCount[emotion] || 0) + 1;
  }
  const emotionBaseline = Object.entries(emotionCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

  // 3. 成长阶段：基于记录总数
  const totalRecords = records.length;
  let growthStage: string;
  if (totalRecords < 10) {
    growthStage = 'newcomer';
  } else if (totalRecords < 50) {
    growthStage = 'growing';
  } else {
    growthStage = 'mature';
  }

  // 4. 自我对话模式：分析内容中的积极/消极用词
  let positiveCount = 0;
  let negativeCount = 0;
  for (const record of analysisRecords) {
    const content = record.content || '';
    for (const word of POSITIVE_SELF_TALK_WORDS) {
      if (content.includes(word)) {
        positiveCount++;
      }
    }
    for (const word of NEGATIVE_SELF_TALK_WORDS) {
      if (content.includes(word)) {
        negativeCount++;
      }
    }
  }

  let selfTalkPattern: string;
  if (negativeCount > positiveCount * 1.5) {
    selfTalkPattern = 'negative';
  } else if (positiveCount > negativeCount * 1.5) {
    selfTalkPattern = 'positive';
  } else {
    selfTalkPattern = 'neutral';
  }

  return {
    topicPreference,
    emotionBaseline,
    growthStage,
    selfTalkPattern,
  };
}

// 生成用户画像摘要文本，用于 AI prompt
export function buildProfileSummary(profile: UserProfile): string {
  const stageLabels: Record<string, string> = {
    newcomer: '新手期（记录较少）',
    growing: '成长期（持续记录中）',
    mature: '成熟期（长期坚持者）',
  };

  const emotionLabels: Record<string, string> = {
    positive: '积极',
    neutral: '平稳',
    negative: '消极',
    anxious: '焦虑',
    depressed: '低落',
  };

  const selfTalkLabels: Record<string, string> = {
    positive: '积极自我对话',
    neutral: '中性自我对话',
    negative: '消极自我对话',
  };

  const parts: string[] = [];
  parts.push(`成长阶段：${stageLabels[profile.growthStage] || profile.growthStage}`);
  parts.push(`近期情绪基线：${emotionLabels[profile.emotionBaseline] || profile.emotionBaseline}`);
  parts.push(`自我对话模式：${selfTalkLabels[profile.selfTalkPattern] || profile.selfTalkPattern}`);
  if (profile.topicPreference.length > 0) {
    parts.push(`关注话题：${profile.topicPreference.join('、')}`);
  }

  return parts.join('；');
}
