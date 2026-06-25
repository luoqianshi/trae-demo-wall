import type { TravelDetail } from './types';

const IMG = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_16_9`;

const IMG_P = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=portrait_4_3`;

const IMG_S = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square`;

export const shanghaiDetail: TravelDetail = {
  id: 'shanghai',
  title: '上海周末游',
  location: '中国·上海',
  startDate: '2024-09-07',
  endDate: '2024-09-08',
  coverImage: IMG('Shanghai skyline with Oriental Pearl Tower and modern skyscrapers at sunset China'),
  aiAnalysisStatus: 'processing',
  aiProgress: 75,
  days: 2,
  timeline: [
    {
      date: '2024-09-07', day: '第一天',
      activities: [
        { id: 's1', time: '10:00', title: '抵达上海', description: '乘坐高铁抵达上海虹桥站', location: '上海虹桥站', image: IMG_P('Shanghai Hongqiao railway station modern') },
        { id: 's2', time: '14:00', title: '外滩', description: '漫步外滩，欣赏万国建筑博览群', location: '外滩', image: IMG_P('Shanghai Bund historic buildings river view') },
        { id: 's3', time: '18:00', title: '陆家嘴夜景', description: '登上东方明珠塔，欣赏上海夜景', location: '陆家嘴', image: IMG_P('Shanghai Lujiazui skyline night lights modern') },
      ],
    },
    {
      date: '2024-09-08', day: '第二天',
      activities: [
        { id: 's4', time: '09:00', title: '豫园', description: '游览豫园，感受江南园林之美', location: '豫园', image: IMG_P('Shanghai Yu Garden traditional Chinese garden') },
        { id: 's5', time: '14:00', title: '田子坊', description: '逛田子坊，体验上海弄堂文化', location: '田子坊', image: IMG_P('Shanghai Tianzifang art district lanes') },
        { id: 's6', time: '18:00', title: '返程', description: '结束上海周末之旅', location: '上海虹桥站' },
      ],
    },
  ],
  hotels: [
    {
      name: '上海和平饭店',
      address: '黄浦区南京东路20号',
      checkIn: '2024-09-07',
      checkOut: '2024-09-08',
      price: 2800,
      rating: 4.7,
      image: IMG_P('Shanghai Peace Hotel historic landmark'),
    },
  ],
  flights: [
    { airline: '中国高铁', flightNumber: 'G101', departure: '北京南', arrival: '上海虹桥', departureTime: '07:00', arrivalTime: '11:29', price: 553 },
    { airline: '中国高铁', flightNumber: 'G110', departure: '上海虹桥', arrival: '北京南', departureTime: '19:00', arrivalTime: '23:29', price: 553 },
  ],
  photos: [
    { id: 'sp1', url: IMG_S('Shanghai Bund sunset beautiful'), caption: '外滩日落', date: '2024-09-07' },
    { id: 'sp2', url: IMG_S('Oriental Pearl Tower night'), caption: '东方明珠夜景', date: '2024-09-07' },
    { id: 'sp3', url: IMG_S('Shanghai Yu Garden traditional'), caption: '豫园', date: '2024-09-08' },
    { id: 'sp4', url: IMG_S('Shanghai Tianzifang art district'), caption: '田子坊', date: '2024-09-08' },
    { id: 'sp5', url: IMG_S('Shanghai skyline modern skyscrapers'), caption: '陆家嘴天际线', date: '2024-09-07' },
    { id: 'sp6', url: IMG_S('Shanghai local food xiaolongbao'), caption: '小笼包', date: '2024-09-07' },
  ],
  aiDiary: {
    summary: 'AI 正在为你整理这段周末。已识别 56 张照片、2 份订单，还差最后几次识别就完成了。',
    entries: [
      {
        date: '2024-09-07',
        paragraphs: [
          '这是你抵达上海的第一天。',
          '下午 2 点，你从虹桥站拖着行李来到外滩。',
          '黄浦江的江风很舒服，你拍了 18 张照片，停留 1 小时 24 分钟。',
          '傍晚登东方明珠，AI 还在解析你拍下的夜景素材……',
        ],
      },
      {
        date: '2024-09-08',
        paragraphs: [
          '第二天的行程 AI 还在识别中。',
          '豫园的小笼包、园林里的锦鲤、田子坊的弄堂，会成为这本周末册的最后一章。',
        ],
      },
    ],
  },
  expenses: [
    { category: '交通', amount: 1106, color: '#FF6B35' },
    { category: '酒店', amount: 2800, color: '#4ECDC4' },
    { category: '餐饮', amount: 800, color: '#F7931E' },
    { category: '景点门票', amount: 300, color: '#3498DB' },
    { category: '购物', amount: 1500, color: '#E74C3C' },
  ],
  memoryCards: [
    { id: 'sm1', image: IMG_S('Shanghai Bund night view beautiful'), title: '外滩夜景', description: '华灯初上的外滩，万国建筑与陆家嘴天际线交相辉映', date: '2024-09-07' },
    { id: 'sm2', image: IMG_S('Shanghai Yu Garden traditional chinese architecture'), title: '豫园古韵', description: '精致的江南园林，每一处都是一幅画', date: '2024-09-08' },
  ],
  mapTrack: {
    start: { lat: 31.2304, lng: 121.4737 },
    end: { lat: 31.2397, lng: 121.4998 },
    points: [
      { lat: 31.1975, lng: 121.3833, name: '虹桥站' },
      { lat: 31.2397, lng: 121.4998, name: '外滩' },
      { lat: 31.2304, lng: 121.4737, name: '豫园' },
    ],
  },
  journalEntries: [
    { date: '2024-09-07', newPhotos: 24, aiSummary: '今天新增 24 张照片。AI 识别出你前往了外滩和东方明珠。', locationCount: 3, stayDuration: '1小时24分钟', insight: '黄浦江的江风很舒服，你拍了 18 张照片，停留 1 小时 24 分钟。' },
  ],
  completion: { totalDays: 2, recordedDays: 2, photos: 56, videos: 6, locations: 5, events: 18 },
};
