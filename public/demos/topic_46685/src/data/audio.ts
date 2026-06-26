import { AudioItem, AudioCategory } from '@/types/audio';

export const audioCategories: AudioCategory[] = [
  { id: 'news', name: '新闻资讯', icon: '📰' },
  { id: 'book', name: '有声小说', icon: '📚' },
  { id: 'music', name: '经典音乐', icon: '🎵' }
];

export const audioList: AudioItem[] = [
  {
    id: '1',
    title: '今日新闻联播',
    description: '了解最新国内外大事',
    category: 'news',
    duration: '30分钟',
    coverUrl: 'https://picsum.photos/id/1025/300/300'
  },
  {
    id: '2',
    title: '红楼梦有声版',
    description: '经典文学名著，娓娓道来',
    category: 'book',
    duration: '45分钟',
    coverUrl: 'https://picsum.photos/id/24/300/300'
  },
  {
    id: '3',
    title: '邓丽君精选集',
    description: '甜美的歌声，永恒的经典',
    category: 'music',
    duration: '60分钟',
    coverUrl: 'https://picsum.photos/id/96/300/300'
  },
  {
    id: '4',
    title: '早间新闻简报',
    description: '每天10分钟，知晓天下事',
    category: 'news',
    duration: '10分钟',
    coverUrl: 'https://picsum.photos/id/1074/300/300'
  },
  {
    id: '5',
    title: '三国演义',
    description: '四大名著，英雄故事',
    category: 'book',
    duration: '50分钟',
    coverUrl: 'https://picsum.photos/id/1044/300/300'
  },
  {
    id: '6',
    title: '怀旧金曲合集',
    description: '80年代经典歌曲回忆',
    category: 'music',
    duration: '90分钟',
    coverUrl: 'https://picsum.photos/id/91/300/300'
  }
];
