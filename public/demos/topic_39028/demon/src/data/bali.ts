import type { TravelDetail } from './types';

const IMG = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_16_9`;

const IMG_P = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=portrait_4_3`;

const IMG_S = (prompt: string) =>
    `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square`;

// Unsplash real Bali photos
const U = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop&q=80`;

export const baliDetail: TravelDetail = {
  id: 'bali',
  title: '巴厘岛7日游',
  location: '印度尼西亚·巴厘岛',
  startDate: '2024-07-15',
  endDate: '2024-07-21',
  coverImage: U('photo-1537996194471-e657df975ab4', 1600),
  aiAnalysisStatus: 'completed',
  aiProgress: 100,
  days: 7,
  timeline: [
    {
      date: '2024-07-15', day: '第一天',
      activities: [
        { id: 'a1', time: '09:00', title: '抵达巴厘岛', description: '乘坐印尼鹰航抵达登巴萨国际机场，专车接机前往酒店', location: '登巴萨国际机场', image: U('photo-1530789253388-582c481c54b0') },
        { id: 'a2', time: '14:00', title: '入住酒店', description: '入住巴厘岛努沙杜瓦海滩豪华度假村，享受热带风情', location: '努沙杜瓦海滩度假村', image: U('photo-1573843981267-be1999ff37cd') },
        { id: 'a3', time: '18:00', title: '日落晚餐', description: '在海边餐厅享用印尼特色美食，欣赏绝美日落', location: 'Jimbaran Beach', image: U('photo-1544551763-46a013bb70d5') },
      ],
    },
    {
      date: '2024-07-16', day: '第二天',
      activities: [
        { id: 'a4', time: '08:00', title: '乌布皇宫', description: '参观乌布皇宫，感受巴厘岛传统建筑艺术', location: '乌布皇宫', image: U('photo-1555400038-63f5ba517a47') },
        { id: 'a5', time: '11:00', title: '猴林公园', description: '与可爱的猴子亲密接触，探索热带雨林', location: 'Sacred Monkey Forest', image: U('photo-1540202404-a2f29016b523') },
        { id: 'a6', time: '15:00', title: '梯田日落', description: '前往德格拉朗梯田，欣赏层层叠叠的稻田美景', location: 'Tegallalang Rice Terraces', image: U('photo-1531591022136-eb8b0da1e6d0') },
      ],
    },
    {
      date: '2024-07-17', day: '第三天',
      activities: [
        { id: 'a7', time: '09:00', title: '蓝梦岛一日游', description: '乘坐快艇前往蓝梦岛，体验浮潜和水上运动', location: 'Lembongan Island', image: U('photo-1559128010-7c1ad6e1b6a5') },
        { id: 'a8', time: '14:00', title: "恶魔的眼泪", description: '观赏壮观的海浪拍打悬崖，形成美丽的彩虹', location: 'Devils Tears', image: U('photo-1518548419970-58e3b4079ab2') },
      ],
    },
    {
      date: '2024-07-18', day: '第四天',
      activities: [
        { id: 'a9', time: '10:00', title: '水明漾购物', description: '逛水明漾精品店，购买巴厘岛特色手工艺品', location: 'Seminyak', image: U('photo-1559628233-100c798642d4') },
        { id: 'a10', time: '15:00', title: 'SPA体验', description: '享受正宗巴厘岛按摩SPA，放松身心', location: 'Bali SPA Center', image: U('photo-1544161515-4ab6ce6db874') },
        { id: 'a17', time: '15:20', title: '到达乌鲁瓦图神庙', description: '参观建在悬崖上的古老神庙，感受巴厘岛印度教文化', location: '乌鲁瓦图神庙', image: U('photo-1474302770737-173ee21bab63'), aiAdded: true },
        { id: 'a18', time: '16:45', title: '悬崖步道观景', description: '沿着悬崖步道行走，俯瞰印度洋的壮丽景色', location: '乌鲁瓦图悬崖步道', image: U('photo-1506905925346-21bda4d32df4'), aiAdded: true },
        { id: 'a19', time: '18:10', title: '悬崖日落', description: '在乌鲁瓦图悬崖上欣赏巴厘岛最美的日落之一', location: '乌鲁瓦图悬崖', image: U('photo-1507525428034-b723cf961d3e'), aiAdded: true },
        { id: 'a20', time: '18:40', title: '火舞表演', description: '观看传统的Kecak火舞表演，感受巴厘岛独特的文化魅力', location: '乌鲁瓦图神庙剧场', image: U('photo-1540979388789-6cee28a1cdc9'), aiAdded: true },
      ],
    },
    {
      date: '2024-07-19', day: '第五天',
      activities: [
        { id: 'a11', time: '08:00', title: '火山徒步', description: '徒步巴杜尔火山，俯瞰火山口湖美景', location: 'Mount Batur', image: U('photo-1501785888041-af3ef285b470') },
        { id: 'a12', time: '14:00', title: '温泉放松', description: '泡在火山温泉中，缓解徒步疲劳', location: 'Batur Hot Springs', image: U('photo-1545579133-99bb5ab189bd') },
      ],
    },
    {
      date: '2024-07-20', day: '第六天',
      activities: [
        { id: 'a13', time: '09:00', title: '库塔海滩', description: '在库塔海滩冲浪，享受阳光沙滩', location: 'Kuta Beach', image: U('photo-1519046904884-53103b34b206') },
        { id: 'a14', time: '18:00', title: '告别晚宴', description: '在海景餐厅享用最后一顿晚餐，回顾精彩旅程', location: 'Bali Hai Restaurant', image: U('photo-1414235077428-338989a2e8c0') },
      ],
    },
    {
      date: '2024-07-21', day: '第七天',
      activities: [
        { id: 'a15', time: '08:00', title: '机场送机', description: '结束美好的巴厘岛之旅，返回温暖的家', location: '登巴萨国际机场' },
      ],
    },
  ],
  hotels: [
    {
      name: '巴厘岛努沙杜瓦海滩豪华度假村',
      address: 'Jl. Pratama, Nusa Dua, Bali',
      checkIn: '2024-07-15',
      checkOut: '2024-07-21',
      price: 1280,
      rating: 4.8,
      image: U('photo-1582719478250-c89cae4dc85b'),
    },
  ],
  flights: [
    { airline: '印尼鹰航', flightNumber: 'GA891', departure: '上海浦东', arrival: '登巴萨', departureTime: '09:30', arrivalTime: '15:45', price: 3580 },
    { airline: '印尼鹰航', flightNumber: 'GA890', departure: '登巴萨', arrival: '上海浦东', departureTime: '17:30', arrivalTime: '23:45', price: 3280 },
  ],
  photos: [
    { id: 'p1', url: U('photo-1507525428034-b723cf961d3e', 600), caption: '美丽的海滩日落', date: '2024-07-15' },
    { id: 'p2', url: U('photo-1555400038-63f5ba517a47', 600), caption: '乌布神庙', date: '2024-07-16' },
    { id: 'p3', url: U('photo-1537996194471-e657df975ab4', 600), caption: '德格拉朗梯田', date: '2024-07-16' },
    { id: 'p4', url: U('photo-1544551763-46a013bb70d5', 600), caption: '蓝梦岛浮潜', date: '2024-07-17' },
    { id: 'p5', url: U('photo-1501785888041-af3ef285b470', 600), caption: '巴杜尔火山日出', date: '2024-07-19' },
    { id: 'p6', url: U('photo-1540979388789-6cee28a1cdc9', 600), caption: '传统舞蹈表演', date: '2024-07-18' },
    { id: 'p7', url: U('photo-1504674900247-0877df9cc836', 600), caption: '印尼美食', date: '2024-07-15' },
    { id: 'p8', url: U('photo-1573843981267-be1999ff37cd', 600), caption: '酒店无边泳池', date: '2024-07-16' },
    { id: 'p9', url: U('photo-1518548419970-58e3b4079ab2', 600), caption: '恶魔的眼泪', date: '2024-07-17' },
    { id: 'p10', url: U('photo-1544161515-4ab6ce6db874', 600), caption: 'SPA体验', date: '2024-07-18' },
    { id: 'p11', url: U('photo-1519046904884-53103b34b206', 600), caption: '库塔海滩冲浪', date: '2024-07-20' },
    { id: 'p12', url: U('photo-1555396273-367ea4eb4db5', 600), caption: '夜市逛吃', date: '2024-07-19' },
  ],
  aiDiary: {
    summary: '巴厘岛的七天，你从海滩到火山，从梯田到日落。AI 从你拍摄的 126 张照片、18 段视频、3 份订单中识别出 42 个关键事件，串联成这段属于你的海岛故事。',
    entries: [
      {
        date: '2024-07-15',
        paragraphs: [
          '这是你抵达巴厘岛的第一天。',
          '午后阳光很好，你在努沙杜瓦办理入住后前往海边。',
          '傍晚时分拍摄了大量日落照片，系统检测到你在此停留超过 2 小时。',
          '这里很可能是本次旅行最喜欢的地点之一。',
        ],
      },
      {
        date: '2024-07-16',
        paragraphs: [
          '乌布的早晨带着清新的稻香。',
          '你走过了乌布皇宫、猴林公园，在德格拉朗梯田停留了 1 小时 32 分钟。',
          'AI 检测到你对绿色景观的偏好，今天的 24 张照片里有一半是稻田与植物。',
        ],
      },
      {
        date: '2024-07-17',
        paragraphs: [
          '蓝梦岛的海水清澈见底。',
          '你在浮潜时拍下了 31 张海底照片，AI 识别出 18 种不同的珊瑚和鱼类。',
          '"恶魔的眼泪" 让你驻足了 47 分钟，浪花与彩虹同框的瞬间被自动标记为高光时刻。',
        ],
      },
      {
        date: '2024-07-18',
        paragraphs: [
          '今天你只拍了一个地方：Melasti Beach。',
          '连续 42 张照片，停留 2 小时 14 分钟。',
          'AI 推断这是本次旅行你最幸福的一刻——日落场景出现频率最高，金色光线反复出现。',
          '下午你去了乌鲁瓦图神庙，在悬崖上看了日落，还观看了传统的 Kecak 火舞表演。',
          'AI 从新上传的 12 张照片中识别出 4 个新地点，行程已自动更新。',
        ],
      },
      {
        date: '2024-07-19',
        paragraphs: [
          '凌晨 4 点你出发去爬巴杜尔火山。',
          '当太阳从火山口升起时，你拍了 18 张延时素材。',
          '下山后泡在火山温泉里，AI 识别出这一段视频的回放次数最多。',
        ],
      },
      {
        date: '2024-07-20',
        paragraphs: [
          '库塔海滩的浪很大。',
          '你尝试了人生第一次冲浪，AI 在 12 段视频里识别出 3 次成功站立的瞬间。',
          '海边的告别晚宴，是这一程最安静的收尾。',
        ],
      },
      {
        date: '2024-07-21',
        paragraphs: [
          '回程的航班在 17:30 起飞。',
          'AI 在你的相册里找到了 9 张窗外的云海照片。',
          '巴厘岛的故事先暂存到这里，下一次出发，AI 会在目的地机场等你。',
        ],
      },
    ],
  },
  expenses: [
    { category: '机票', amount: 6860, color: '#FF6B35' },
    { category: '酒店', amount: 12800, color: '#4ECDC4' },
    { category: '餐饮', amount: 3200, color: '#F7931E' },
    { category: '交通', amount: 1500, color: '#9B59B6' },
    { category: '景点门票', amount: 1800, color: '#3498DB' },
    { category: '购物', amount: 4500, color: '#E74C3C' },
    { category: 'SPA娱乐', amount: 2200, color: '#1ABC9C' },
  ],
  memoryCards: [
    { id: 'm1', image: U('photo-1507525428034-b723cf961d3e', 600), title: '最美日落', description: '在Jimbaran海滩见证了人生中最美的日落，金色的阳光洒在海面上，波光粼粼', date: '2024-07-15' },
    { id: 'm2', image: U('photo-1501785888041-af3ef285b470', 600), title: '火山日出', description: '凌晨4点的徒步挑战，换来的是令人窒息的火山日出美景', date: '2024-07-19' },
    { id: 'm3', image: U('photo-1544551763-46a013bb70d5', 600), title: '海底世界', description: '蓝梦岛浮潜时，五彩斑斓的珊瑚和热带鱼环绕身旁', date: '2024-07-17' },
    { id: 'm4', image: U('photo-1540979388789-6cee28a1cdc9', 600), title: '文化盛宴', description: '欣赏了传统巴厘岛舞蹈表演，精美的服饰和动人的舞姿令人难忘', date: '2024-07-18' },
  ],
  mapTrack: {
    start: { lat: -8.7832, lng: 115.1889 },
    end: { lat: -8.6705, lng: 115.2127 },
    points: [
      { lat: -8.7832, lng: 115.1889, name: '登巴萨机场' },
      { lat: -8.7716, lng: 115.1642, name: '努沙杜瓦' },
      { lat: -8.5011, lng: 115.2614, name: '乌布' },
      { lat: -8.8316, lng: 115.0886, name: '乌鲁瓦图' },
      { lat: -8.6705, lng: 115.2127, name: '库塔' },
    ],
  },
  journalEntries: [
    {
      date: '2024-07-15',
      newPhotos: 31,
      aiSummary: '今天新增 31 张照片。AI 识别出你抵达了巴厘岛登巴萨机场，随后前往努沙杜瓦海滩度假村。',
      locationCount: 2,
      stayDuration: '2小时',
      insight: '抵达后 6 小时内拍摄了 31 张照片，远高于平时水平。你对这次旅行充满期待。',
    },
    {
      date: '2024-07-16',
      newPhotos: 24,
      aiSummary: '今天新增 24 张照片。AI 识别出你前往了乌布皇宫、猴林公园、德格拉朗梯田。',
      locationCount: 3,
      stayDuration: '1小时32分钟',
      insight: '今天的照片里有一半是稻田与植物，AI 检测到你对绿色景观的偏好。',
    },
    {
      date: '2024-07-17',
      newPhotos: 31,
      aiSummary: '今天新增 31 张海底照片。AI 识别出 18 种不同的珊瑚和鱼类。',
      locationCount: 2,
      stayDuration: '47分钟',
      insight: '"恶魔的眼泪" 让你驻足了 47 分钟，浪花与彩虹同框的瞬间被自动标记为高光时刻。',
    },
    {
      date: '2024-07-18',
      newPhotos: 12,
      aiSummary: '今天新增 12 张照片。AI 识别出你前往了乌鲁瓦图神庙。这是本次旅行第 5 个景点。',
      locationCount: 3,
      stayDuration: '3小时20分钟',
      insight: '系统检测到大量日落照片。你在这里停留约 2 小时。这可能是一次令人印象深刻的体验。',
    },
  ],
  completion: {
    totalDays: 7,
    recordedDays: 5,
    photos: 138,
    videos: 21,
    locations: 10,
    events: 46,
  },
};
