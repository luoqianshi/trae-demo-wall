// 订单相关类型定义
export type OrderStatus = 'recruiting' | 'matched' | 'ongoing' | 'completed' | 'cancelled';

export type FishType = '鲫鱼' | '鲤鱼' | '草鱼' | '青鱼' | '黑鱼' | '翘嘴' | '鲈鱼' | '罗非' | '鳜鱼' | '鲶鱼';

export type FishingType = '台钓' | '路亚' | '矶钓' | '海钓' | '筏钓' | '冰钓' | '传统钓';

export interface Order {
  id: string;
  publisherId: string;
  publisherName: string;
  publisherAvatar: string;
  publisherLevel: number;
  publisherYears: number;
  title: string;
  spot: string; // 钓点
  city: string;
  spotImage: string;
  date: string; // 出行日期 YYYY-MM-DD
  duration: string; // 时长 如 "1天"
  fishTypes: FishType[];
  fishingType: FishingType;
  peopleNeeded: number; // 招募人数
  peopleJoined: number; // 已加入人数
  price: number; // 每人费用（元）
  description: string;
  requirements?: string; // 要求/备注
  status: OrderStatus;
  matchedUserId?: string; // 撮合成功的用户id
  matchedUserName?: string;
  matchedUserAvatar?: string;
  createdAt: string;
  invitationCount: number;
}

export interface OrderFilter {
  city?: string;
  fishingType?: FishingType;
  dateRange?: 'all' | 'weekend' | 'week';
  priceRange?: 'all' | 'free' | 'low' | 'mid' | 'high';
}
