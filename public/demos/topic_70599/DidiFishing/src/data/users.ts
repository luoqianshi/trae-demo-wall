import type { User } from '../types/user';

// 当前登录用户（我自己）
export const currentUser: User = {
  id: 'u_current',
  nickname: '浪里白条',
  avatar: 'https://picsum.photos/id/177/200/200',
  level: 4,
  bio: '十年路亚老炮，常驻千岛湖，主攻翘嘴和鳜鱼。',
  location: '杭州',
  orderCount: 23,
  rating: 4.9,
  tags: ['路亚', '翘嘴', '鳜鱼'],
  years: 10,
  gender: 'male',
  joinedAt: '2023-03-12'
};

// 其他钓友列表
export const users: User[] = [
  {
    id: 'u_001',
    nickname: '临安老张',
    avatar: 'https://picsum.photos/id/64/200/200',
    level: 5,
    bio: '临安本地通，熟悉周边水库，主攻大物。',
    location: '杭州',
    orderCount: 86,
    rating: 4.9,
    tags: ['台钓', '鲤鱼', '草鱼'],
    years: 18,
    gender: 'male',
    joinedAt: '2022-01-08'
  },
  {
    id: 'u_002',
    nickname: '海钓阿杰',
    avatar: 'https://picsum.photos/id/91/200/200',
    level: 5,
    bio: '东海船钓 15 年，专攻大物。',
    location: '舟山',
    orderCount: 134,
    rating: 5.0,
    tags: ['海钓', '船钓', '大物'],
    years: 15,
    gender: 'male',
    joinedAt: '2021-05-20'
  },
  {
    id: 'u_003',
    nickname: '西溪小师妹',
    avatar: 'https://picsum.photos/id/338/200/200',
    level: 3,
    bio: '野钓爱好者，喜欢拍鱼获美照。',
    location: '杭州',
    orderCount: 28,
    rating: 4.8,
    tags: ['台钓', '鲫鱼', '野钓'],
    years: 5,
    gender: 'female',
    joinedAt: '2023-09-15'
  },
  {
    id: 'u_004',
    nickname: '路亚强子',
    avatar: 'https://picsum.photos/id/1027/200/200',
    level: 5,
    bio: '竞技路亚选手，全国巡回赛常客。',
    location: '苏州',
    orderCount: 67,
    rating: 4.7,
    tags: ['路亚', '竞技', '鲈鱼'],
    years: 12,
    gender: 'male',
    joinedAt: '2022-07-30'
  },
  {
    id: 'u_005',
    nickname: '青鱼王老李',
    avatar: 'https://picsum.photos/id/177/200/200',
    level: 5,
    bio: '专攻青鱼巨物，常在湖州、嘉兴一带。',
    location: '湖州',
    orderCount: 52,
    rating: 4.9,
    tags: ['台钓', '青鱼', '大物'],
    years: 20,
    gender: 'male',
    joinedAt: '2021-11-03'
  },
  {
    id: 'u_006',
    nickname: '千岛湖飞侠',
    avatar: 'https://picsum.photos/id/64/200/200',
    level: 4,
    bio: '千岛湖本地钓友，熟悉各岛屿钓点。',
    location: '杭州',
    orderCount: 41,
    rating: 4.8,
    tags: ['路亚', '翘嘴', '鳜鱼'],
    years: 8,
    gender: 'male',
    joinedAt: '2023-01-22'
  },
  {
    id: 'u_007',
    nickname: '矶钓大刘',
    avatar: 'https://picsum.photos/id/91/200/200',
    level: 4,
    bio: '东海矶钓专家，擅长石斑、黑鲷。',
    location: '宁波',
    orderCount: 33,
    rating: 4.7,
    tags: ['矶钓', '石斑', '黑鲷'],
    years: 9,
    gender: 'male',
    joinedAt: '2022-04-10'
  },
  {
    id: 'u_008',
    nickname: '筏钓老陈',
    avatar: 'https://picsum.photos/id/338/200/200',
    level: 4,
    bio: '南方筏钓高手，主攻鲫鱼、鲤鱼。',
    location: '广州',
    orderCount: 45,
    rating: 4.8,
    tags: ['筏钓', '鲫鱼', '鲤鱼'],
    years: 11,
    gender: 'male',
    joinedAt: '2022-08-08'
  }
];

export default function mockUsers() {
  return {
    code: 0,
    message: 'ok',
    data: {
      currentUser,
      users
    }
  };
}
