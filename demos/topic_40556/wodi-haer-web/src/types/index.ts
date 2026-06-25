export interface User {
  id: string;
  openid: string;
  unionid?: string;
  nickname: string;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Baby {
  id: string;
  familyId: string;
  name: string;
  gender: 'male' | 'female';
  birthday: string;
  birthTime?: string;
  birthWeight?: number;
  birthHeight?: number;
  headCircum?: number;
  avatarUrl?: string;
  isPremie?: boolean;
  stage: 'preparation' | 'pregnancy' | 'birth' | 'parenting';
  createdAt: string;
  updatedAt: string;
}

export interface Family {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedingRecord {
  id: string;
  babyId: string;
  type: 'breast' | 'formula' | 'solid';
  startTime: string;
  endTime?: string;
  duration?: number;
  side?: 'left' | 'right' | 'both';
  amount?: number;
  formulaBrand?: string;
  formulaType?: string;
  waterTemp?: number;
  foodItems?: string;
  foodAmount?: string;
  allergyFlag?: boolean;
  notes?: string;
  createdById: string;
  createdAt: string;
}

export interface SleepRecord {
  id: string;
  babyId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  sleepType?: 'night' | 'nap';
  quality?: 'good' | 'normal' | 'bad';
  notes?: string;
  createdById: string;
  createdAt: string;
}

export interface DiaperRecord {
  id: string;
  babyId: string;
  time: string;
  type: 'pee' | 'poop' | 'both';
  color?: string;
  texture?: string;
  amount?: 'small' | 'medium' | 'large';
  notes?: string;
  createdById: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  babyId: string;
  title: string;
  description?: string;
  type: 'motor' | 'language' | 'social' | 'cognitive';
  date: string;
  photos?: string;
  notes?: string;
  createdById: string;
  createdAt: string;
}

export interface Stats {
  feedingCount: number;
  totalFeedingDuration: number;
  sleepCount: number;
  totalSleepDuration: number;
  diaperCount: number;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PagedResponse<T = unknown> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
