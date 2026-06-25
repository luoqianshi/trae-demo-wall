export interface DiaryEntry {
  id: string;
  date: string;
  taskName: string;
  taskIcon: string;
  category: string;
  duration: number;
  reflection: string;
  mood: string;
  timestamp: number;
}

const moodPool: string[] = ['😊', '🌟', '💪', '❤️', '🌈', '✨', '🌱', '🔥'];

const reflectionPool: Record<string, string[]> = {
  '环保': [
    '今天为地球做了一件小事，感觉真好。',
    '环保不需要宏大叙事，从小事开始就够了。',
    '每一次垃圾分类，都是对自然的温柔。',
    '低碳生活其实很简单，从今天开始。',
    '守护绿水青山，从身边小事做起。',
  ],
  '捐赠': [
    '分享让价值流动，温暖在传递。',
    '旧物找到了新主人，我也找到了新的快乐。',
    '捐赠不只是给予，更是连接。',
    '让闲置物品重获新生，意义非凡。',
    '小小的分享，大大的温暖。',
  ],
  '帮扶': [
    '陪伴是最长情的告白，今天用心陪伴了。',
    '帮助他人，也温暖了自己。',
    '每一个微笑都是最好的回报。',
    '关爱他人，让世界更柔软。',
    '今天做了一件有意义的事。',
  ],
  '传播': [
    '让公益被看见，就是我的贡献。',
    '传播善意，让更多人加入。',
    '分享公益理念，传递正能量。',
    '影响力也是一种公益力量。',
    '让更多人知道公益的美好。',
  ],
};

export const generateDiaryEntry = (
  taskName: string,
  taskIcon: string,
  category: string,
  duration: number,
  timestamp: number
): DiaryEntry => {
  const date = new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const reflections = reflectionPool[category] || reflectionPool['环保'];
  const reflection = reflections[Math.floor(Math.random() * reflections.length)];
  const mood = moodPool[Math.floor(Math.random() * moodPool.length)];

  return {
    id: `diary_${timestamp}`,
    date,
    taskName,
    taskIcon,
    category,
    duration,
    reflection,
    mood,
    timestamp,
  };
};