import type { User, Gift, Certificate, Stats, Knowledge, Activity, Badge, LeaderboardEntry, Checkin } from '@/types';

export const currentUser: User = {
  id: 'user-1',
  name: '网球爱好者',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  points: 2580,
  totalTennis: 129,
  badges: ['beginner', 'eco-warrior', 'weekly-champion'],
  joinDate: '2026-01-15',
};

export const gifts: Gift[] = [
  {
    id: 'gift-1',
    name: '环保网球袋',
    price: 500,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=eco%20friendly%20tennis%20bag%20green%20color%20recycled%20material&image_size=square',
    stock: 100,
    description: '使用回收材料制作的环保网球袋，轻便耐用',
  },
  {
    id: 'gift-2',
    name: '有机网球',
    price: 800,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=organic%20tennis%20ball%20eco%20friendly%20green%20packaging&image_size=square',
    stock: 50,
    description: '采用环保材料生产的有机网球，性能优异',
  },
  {
    id: 'gift-3',
    name: '环保运动水壶',
    price: 600,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=eco%20friendly%20sports%20water%20bottle%20stainless%20steel%20green&image_size=square',
    stock: 80,
    description: '不锈钢环保水壶，可重复使用',
  },
  {
    id: 'gift-4',
    name: '网球主题T恤',
    price: 700,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tennis%20theme%20tshirt%20eco%20friendly%20organic%20cotton%20green%20design&image_size=square',
    stock: 60,
    description: '有机棉制作的网球主题T恤',
  },
  {
    id: 'gift-5',
    name: '环保毛巾',
    price: 400,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=eco%20friendly%20sports%20towel%20organic%20cotton%20green%20color&image_size=square',
    stock: 120,
    description: '有机棉环保运动毛巾',
  },
  {
    id: 'gift-6',
    name: '网球钥匙扣',
    price: 200,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tennis%20ball%20keychain%20eco%20friendly%20recycled%20material&image_size=square',
    stock: 200,
    description: '用回收网球制作的钥匙扣',
  },
];

export const certificates: Certificate[] = [
  {
    id: 'cert-1',
    name: '环保新星',
    requiredPoints: 1000,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=environmental%20certificate%20award%20green%20star%20medal&image_size=square',
    description: '累计回收50个网球，成为环保新星',
  },
  {
    id: 'cert-2',
    name: '绿色卫士',
    requiredPoints: 3000,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=environmental%20certificate%20green%20guardian%20shield%20award&image_size=square',
    description: '累计回收150个网球，守护绿色家园',
  },
  {
    id: 'cert-3',
    name: '环保先锋',
    requiredPoints: 5000,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=environmental%20certificate%20pioneer%20gold%20medal%20green&image_size=square',
    description: '累计回收250个网球，引领环保风尚',
  },
  {
    id: 'cert-4',
    name: '地球守护者',
    requiredPoints: 10000,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=environmental%20certificate%20earth%20guardian%20platinum%20award&image_size=square',
    description: '累计回收500个网球，成为地球守护者',
  },
];

export const stats: Stats = {
  totalTennis: 125680,
  totalUsers: 8542,
  totalPoints: 2513600,
  savedResources: {
    plastic: 37704,
    rubber: 25136,
    carbonReduction: 1256800,
  },
};

export const knowledgeList: Knowledge[] = [
  {
    id: 'k-1',
    title: '旧网球的环境危害',
    content: '一个网球的寿命大约是2-3个月，但它的降解时间却需要400-500年！网球的核心材料是橡胶和尼龙，这些材料在自然环境中很难分解，会长期污染土壤和水源。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tennis%20ball%20waste%20environmental%20pollution%20landfill&image_size=square',
  },
  {
    id: 'k-2',
    title: '回收网球的处理方式',
    content: '回收的网球可以通过专业处理重新利用。橡胶部分可以制成跑道、地板等材料；尼龙纤维可以用于制作地毯、绳索等产品。每回收一个网球，就相当于节约了约30克橡胶和20克塑料。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=recycled%20tennis%20ball%20materials%20rubber%20floor%20eco%20friendly&image_size=square',
  },
  {
    id: 'k-3',
    title: '全球网球浪费现状',
    content: '据统计，全球每年约有1.2亿个网球被丢弃。如果这些网球全部被回收，可以节省约3600吨橡胶和2400吨塑料，相当于减少了12万吨碳排放。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=global%20tennis%20waste%20statistics%20chart%20environmental%20impact&image_size=square',
  },
  {
    id: 'k-4',
    title: '如何正确回收网球',
    content: '收集旧网球时，请确保它们没有明显的破损。将网球放入专门的回收箱，或通过我们的平台预约上门回收。不要将网球随意丢弃或混入其他垃圾。',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tennis%20ball%20recycling%20bin%20collection%20point%20eco%20friendly&image_size=square',
  },
];

export const activities: Activity[] = [
  {
    id: 'act-1',
    title: '夏季回收挑战赛',
    description: '在这个夏天，收集更多的旧网球，赢取丰厚奖品！前100名参与者将获得环保大礼包。',
    deadline: '2026-08-31',
    participants: 1256,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=summer%20tennis%20recycling%20challenge%20event%20green%20banner&image_size=square',
  },
  {
    id: 'act-2',
    title: '校园环保行动',
    description: '走进校园，向同学们宣传网球回收的重要性，共同守护绿色校园。',
    deadline: '2026-09-15',
    participants: 892,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=school%20environmental%20activity%20students%20recycling%20tennis&image_size=square',
  },
  {
    id: 'act-3',
    title: '周末打卡活动',
    description: '周末打卡双倍积分！邀请好友一起参与，还能获得额外奖励。',
    deadline: '2026-07-20',
    participants: 2156,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=weekend%20checkin%20event%20tennis%20recycling%20celebration&image_size=square',
  },
];

export const badges: Badge[] = [
  {
    id: 'beginner',
    name: '初出茅庐',
    description: '完成第一次打卡',
    icon: 'Star',
    requiredTennis: 1,
  },
  {
    id: 'eco-warrior',
    name: '环保战士',
    description: '累计回收50个网球',
    icon: 'Shield',
    requiredTennis: 50,
  },
  {
    id: 'weekly-champion',
    name: '周冠军',
    description: '本周回收数量最多',
    icon: 'Trophy',
    requiredTennis: 30,
  },
  {
    id: 'monthly-star',
    name: '月之星',
    description: '本月回收数量最多',
    icon: 'Moon',
    requiredTennis: 100,
  },
  {
    id: 'team-player',
    name: '团队之星',
    description: '邀请3位好友加入',
    icon: 'Users',
    requiredTennis: 0,
  },
];

export const friendLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: 'user-2', name: '小明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', totalTennis: 180, points: 3600 },
  { rank: 2, userId: 'user-1', name: '网球爱好者', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', totalTennis: 129, points: 2580 },
  { rank: 3, userId: 'user-3', name: '阿杰', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bailey', totalTennis: 95, points: 1900 },
  { rank: 4, userId: 'user-4', name: '小雨', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Blake', totalTennis: 78, points: 1560 },
  { rank: 5, userId: 'user-5', name: '教练老王', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie', totalTennis: 65, points: 1300 },
];

export const nationalLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: 'pro-1', name: '网球达人', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dakota', totalTennis: 520, points: 10400 },
  { rank: 2, userId: 'pro-2', name: '绿色使者', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan', totalTennis: 485, points: 9700 },
  { rank: 3, userId: 'pro-3', name: '环保先锋', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Frankie', totalTennis: 420, points: 8400 },
  { rank: 4, userId: 'pro-4', name: '球场守护者', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace', totalTennis: 395, points: 7900 },
  { rank: 5, userId: 'pro-5', name: '生态战士', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Harley', totalTennis: 350, points: 7000 },
  { rank: 6, userId: 'pro-6', name: '回收专家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Indigo', totalTennis: 320, points: 6400 },
  { rank: 7, userId: 'pro-7', name: '网球之友', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan', totalTennis: 295, points: 5900 },
  { rank: 8, userId: 'pro-8', name: '地球卫士', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kai', totalTennis: 270, points: 5400 },
];

export const userCheckins: Checkin[] = [
  { id: 'c-1', userId: 'user-1', imageUrl: '', tennisCount: 15, pointsEarned: 300, createdAt: '2026-07-12' },
  { id: 'c-2', userId: 'user-1', imageUrl: '', tennisCount: 10, pointsEarned: 200, createdAt: '2026-07-10' },
  { id: 'c-3', userId: 'user-1', imageUrl: '', tennisCount: 20, pointsEarned: 400, createdAt: '2026-07-08' },
  { id: 'c-4', userId: 'user-1', imageUrl: '', tennisCount: 8, pointsEarned: 160, createdAt: '2026-07-05' },
];
