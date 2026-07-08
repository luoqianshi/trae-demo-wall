// 用户相关类型定义
export interface User {
  id: string;
  nickname: string;
  avatar: string;
  level: number; // 钓技等级 1-5
  bio: string; // 个人简介
  location: string; // 常驻城市
  orderCount: number; // 已完成订单数
  rating: number; // 评分 1-5
  tags: string[]; // 擅长标签：路亚、矶钓、台钓等
  years: number; // 钓龄
  gender?: 'male' | 'female';
  joinedAt: string; // 加入时间
}

export interface UserStats {
  publishedOrders: number;
  matchedOrders: number;
  ongoingOrders: number;
  completedOrders: number;
  articles: number;
}
