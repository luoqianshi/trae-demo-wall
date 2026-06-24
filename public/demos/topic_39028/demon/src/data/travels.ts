import type { Travel } from './types';

const IMG = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_16_9`;

const U = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop&q=80`;

export const travels: Travel[] = [
  {
    id: 'bali',
    title: '巴厘岛7日游',
    location: '印度尼西亚·巴厘岛',
    startDate: '2024-07-15',
    endDate: '2024-07-21',
    coverImage: U('photo-1537996194471-e657df975ab4', 1200),
    aiAnalysisStatus: 'completed',
    aiProgress: 100,
    days: 7,
    aiData: {
      photos: 138,
      videos: 21,
      orders: 3,
      aiEvents: 46,
      distance: 87,
      locations: 10,
      days: 7,
      happinessMoment: {
        date: '2024-07-18',
        time: '18:21',
        location: 'Melasti Beach',
        image: U('photo-1507525428034-b723cf961d3e', 800),
        reason: '连续拍摄42张照片，停留时间最长，日落场景出现频率最高',
        photosTaken: 42,
        stayDuration: '2小时14分钟',
      },
    },
  },
  {
    id: 'tokyo',
    title: '东京自由行',
    location: '日本·东京',
    startDate: '2024-08-20',
    endDate: '2024-08-25',
    coverImage: IMG('Tokyo city skyline at night with Tokyo Tower and neon lights modern urban Japan'),
    aiAnalysisStatus: 'completed',
    aiProgress: 100,
    days: 6,
    aiData: {
      photos: 89,
      videos: 12,
      orders: 2,
      aiEvents: 35,
      distance: 124,
      locations: 11,
      days: 6,
      happinessMoment: {
        date: '2024-08-22',
        time: '06:42',
        location: '河口湖',
        image: IMG('Mount Fuji Lake Kawaguchi sunrise reflection beautiful'),
        reason: '清晨5点起床拍摄，识别到富士山云雾散开的瞬间',
        photosTaken: 28,
        stayDuration: '1小时48分钟',
      },
    },
  },
  {
    id: 'shanghai',
    title: '上海周末游',
    location: '中国·上海',
    startDate: '2024-09-07',
    endDate: '2024-09-08',
    coverImage: IMG('Shanghai skyline with Oriental Pearl Tower and modern skyscrapers at sunset China'),
    aiAnalysisStatus: 'processing',
    aiProgress: 75,
    days: 2,
    aiData: {
      photos: 56,
      videos: 6,
      orders: 2,
      aiEvents: 18,
      distance: 32,
      locations: 5,
      days: 2,
    },
  },
];
