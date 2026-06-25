import type { TravelDetail } from './types';

const IMG = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_16_9`;

const IMG_P = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=portrait_4_3`;

const IMG_S = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square`;

export const tokyoDetail: TravelDetail = {
  id: 'tokyo',
  title: '东京自由行',
  location: '日本·东京',
  startDate: '2024-08-20',
  endDate: '2024-08-25',
  coverImage: IMG('Tokyo city skyline at night with Tokyo Tower and neon lights modern urban Japan'),
  aiAnalysisStatus: 'completed',
  aiProgress: 100,
  days: 6,
  timeline: [
    {
      date: '2024-08-20', day: '第一天',
      activities: [
        { id: 't1', time: '14:00', title: '抵达东京', description: '成田机场落地，乘坐Skyliner前往市区', location: '成田国际机场', image: IMG_P('Narita airport Tokyo modern terminal') },
        { id: 't2', time: '18:00', title: '浅草寺', description: '参观东京最古老的寺庙，感受传统日式风情', location: '浅草寺', image: IMG_P('Senso-ji temple Tokyo traditional Japanese architecture') },
        { id: 't3', time: '20:00', title: '秋叶原', description: '漫步电器街，感受东京的繁华与活力', location: '秋叶原', image: IMG_P('Akihabara Tokyo neon lights electronics stores') },
      ],
    },
    {
      date: '2024-08-21', day: '第二天',
      activities: [
        { id: 't4', time: '09:00', title: '上野公园', description: '参观上野公园和东京国立博物馆', location: '上野公园', image: IMG_P('Ueno Park Tokyo cherry blossom museum') },
        { id: 't5', time: '14:00', title: '东京塔', description: '登上东京塔，俯瞰东京全景', location: '东京塔', image: IMG_P('Tokyo Tower landmark city view') },
        { id: 't6', time: '18:00', title: '筑地市场', description: '品尝新鲜的寿司和海鲜料理', location: '筑地市场', image: IMG_P('Tsukiji market Tokyo fresh sushi seafood') },
      ],
    },
    {
      date: '2024-08-22', day: '第三天',
      activities: [
        { id: 't7', time: '08:00', title: '富士山一日游', description: '前往富士山五合目，近距离观赏日本圣山', location: '富士山', image: IMG_P('Mount Fuji Japan iconic snow peak beautiful') },
        { id: 't8', time: '14:00', title: '河口湖', description: '在河口湖畔欣赏富士山倒影', location: '河口湖', image: IMG_P('Lake Kawaguchi Mount Fuji reflection beautiful') },
      ],
    },
    {
      date: '2024-08-23', day: '第四天',
      activities: [
        { id: 't9', time: '10:00', title: '涩谷十字路口', description: '体验世界最繁忙的十字路口', location: '涩谷', image: IMG_P('Shibuya crossing Tokyo busy intersection') },
        { id: 't10', time: '14:00', title: '原宿竹下通', description: '逛原宿潮流街，感受年轻人文化', location: '原宿', image: IMG_P('Harajuku Takeshita Street Tokyo fashion trendy') },
        { id: 't11', time: '18:00', title: '新宿夜景', description: '欣赏新宿繁华的夜景', location: '新宿', image: IMG_P('Shinjuku Tokyo night skyline neon lights') },
      ],
    },
    {
      date: '2024-08-24', day: '第五天',
      activities: [
        { id: 't12', time: '09:00', title: '皇居外苑', description: '参观日本天皇居所外围', location: '皇居外苑', image: IMG_P('Imperial Palace Tokyo Japanese garden traditional') },
        { id: 't13', time: '14:00', title: '银座购物', description: '逛银座奢侈品商店', location: '银座', image: IMG_P('Ginza Tokyo luxury shopping street') },
        { id: 't14', time: '19:00', title: '居酒屋体验', description: '在传统居酒屋品尝日式料理', location: '新桥', image: IMG_P('traditional Japanese izakaya dinner atmosphere') },
      ],
    },
    {
      date: '2024-08-25', day: '第六天',
      activities: [
        { id: 't15', time: '10:00', title: '返程', description: '结束东京之旅，返回上海', location: '成田国际机场' },
      ],
    },
  ],
  hotels: [
    {
      name: '东京新宿华盛顿酒店',
      address: '新宿区西新宿8-14-1',
      checkIn: '2024-08-20',
      checkOut: '2024-08-25',
      price: 7500,
      rating: 4.5,
      image: IMG_P('Tokyo hotel modern business district'),
    },
  ],
  flights: [
    { airline: '日本航空', flightNumber: 'JL086', departure: '上海浦东', arrival: '成田', departureTime: '10:30', arrivalTime: '15:45', price: 4280 },
    { airline: '日本航空', flightNumber: 'JL085', departure: '成田', arrival: '上海浦东', departureTime: '17:00', arrivalTime: '20:15', price: 3880 },
  ],
  photos: [
    { id: 'tp1', url: IMG_S('Tokyo Tower night lights beautiful'), caption: '东京塔夜景', date: '2024-08-21' },
    { id: 'tp2', url: IMG_S('Senso-ji temple Tokyo lantern'), caption: '浅草寺', date: '2024-08-20' },
    { id: 'tp3', url: IMG_S('Mount Fuji Japan iconic view'), caption: '富士山', date: '2024-08-22' },
    { id: 'tp4', url: IMG_S('Shibuya crossing busy street'), caption: '涩谷十字路口', date: '2024-08-23' },
    { id: 'tp5', url: IMG_S('Tsukiji market fresh sushi'), caption: '筑地寿司', date: '2024-08-21' },
    { id: 'tp6', url: IMG_S('Japanese traditional izakaya interior'), caption: '居酒屋', date: '2024-08-24' },
    { id: 'tp7', url: IMG_S('Akihabara Tokyo anime culture'), caption: '秋叶原', date: '2024-08-20' },
    { id: 'tp8', url: IMG_S('Harajuku fashion street Tokyo'), caption: '原宿街景', date: '2024-08-23' },
  ],
  aiDiary: {
    summary: '东京的六天里，AI 识别了你逛过的 11 个地点，捕捉到 35 个关键时刻。你对夜景、富士山、传统文化的偏好被系统悄悄记录下来。',
    entries: [
      {
        date: '2024-08-20',
        paragraphs: [
          '这是你第一次踏进东京的傍晚。',
          '浅草寺的雷门亮起红灯笼时，AI 自动识别出这是你最爱的画面之一。',
          '晚上在秋叶原拍了 18 张霓虹灯照片，停留时间 1 小时 12 分钟。',
        ],
      },
      {
        date: '2024-08-21',
        paragraphs: [
          '上午在上野公园的博物馆里走了 3 小时。',
          '下午登上东京塔，AI 检测到你在观景台停留了 48 分钟，拍了 22 张全景照片。',
          '筑地市场的寿司很新鲜，系统记录了这顿饭的 14 张照片。',
        ],
      },
      {
        date: '2024-08-22',
        paragraphs: [
          '凌晨 5 点你从新宿出发去河口湖。',
          '当云雾散开、富士山露出雪顶的那一瞬间，你按下了 28 次快门。',
          'AI 推断这是整段旅程里你最幸福的一刻。',
        ],
      },
      {
        date: '2024-08-23',
        paragraphs: [
          '涩谷十字路口的人潮如织。',
          'AI 在 12 段视频里识别出你专程拍下 3 次绿灯亮起时人群涌动的瞬间。',
          '原宿竹下通的下午，AI 标记了 6 家你拍照停留超过 5 分钟的潮流店铺。',
        ],
      },
      {
        date: '2024-08-24',
        paragraphs: [
          '皇居外苑的清晨格外安静。',
          '下午在银座逛了 4 小时，AI 识别出 9 件你驻足查看的橱窗设计。',
          '夜晚的居酒屋，清酒和烤串的组合被拍成一段 47 秒的视频。',
        ],
      },
      {
        date: '2024-08-25',
        paragraphs: [
          '回程的航班上，AI 在你的相册里又找到 8 张窗外的云。',
          '东京的故事先收进行李箱，下次再来的时候，AI 还会记得你。',
        ],
      },
    ],
  },
  expenses: [
    { category: '机票', amount: 8160, color: '#FF6B35' },
    { category: '酒店', amount: 7500, color: '#4ECDC4' },
    { category: '餐饮', amount: 4200, color: '#F7931E' },
    { category: '交通', amount: 1800, color: '#9B59B6' },
    { category: '景点门票', amount: 1200, color: '#3498DB' },
    { category: '购物', amount: 6500, color: '#E74C3C' },
  ],
  memoryCards: [
    { id: 'tm1', image: IMG_S('Mount Fuji beautiful landscape'), title: '富士山美景', description: '终于见到了日本的象征——富士山，云雾缭绕的山顶如梦似幻', date: '2024-08-22' },
    { id: 'tm2', image: IMG_S('Tokyo Tower night panorama'), title: '东京塔夜景', description: '登上东京塔俯瞰整个城市，灯火辉煌美不胜收', date: '2024-08-21' },
    { id: 'tm3', image: IMG_S('Shibuya crossing crowd busy'), title: '涩谷十字路口', description: '体验了世界最繁忙的十字路口，人潮涌动却秩序井然', date: '2024-08-23' },
  ],
  mapTrack: {
    start: { lat: 35.7720, lng: 140.3929 },
    end: { lat: 35.6895, lng: 139.6917 },
    points: [
      { lat: 35.7720, lng: 140.3929, name: '成田机场' },
      { lat: 35.7100, lng: 139.8107, name: '浅草' },
      { lat: 35.6895, lng: 139.6917, name: '新宿' },
      { lat: 35.6586, lng: 139.7010, name: '涩谷' },
    ],
  },
  journalEntries: [
    { date: '2024-08-20', newPhotos: 18, aiSummary: '今天新增 18 张照片。AI 识别出你抵达了东京，前往浅草寺和秋叶原。', locationCount: 3, stayDuration: '1小时12分钟', insight: '浅草寺雷门亮起红灯笼时，AI 自动识别出这是你最爱的画面之一。' },
    { date: '2024-08-21', newPhotos: 22, aiSummary: '今天新增 22 张照片。AI 识别出你参观了上野公园和东京塔。', locationCount: 3, stayDuration: '48分钟', insight: '东京塔观景台停留 48 分钟，拍了 22 张全景照片。' },
    { date: '2024-08-22', newPhotos: 28, aiSummary: '今天新增 28 张照片。AI 识别出你前往了河口湖。', locationCount: 1, stayDuration: '1小时48分钟', insight: '清晨 5 点出发拍摄富士山，当云雾散开、雪顶露出的那一瞬间，你按下了 28 次快门。' },
  ],
  completion: { totalDays: 6, recordedDays: 6, photos: 89, videos: 12, locations: 11, events: 35 },
};
