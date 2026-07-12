// 兴趣标签
export interface InterestTag {
  id: string;
  name: string;
  icon: string;
  category: string;
}

// 用户信息
export interface User {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  avatar: string;
  bio: string;
  interests: string[]; // tag ids
  location: string;
  occupation: string;
  matchCount: number;
}

// 当前登录用户
export interface CurrentUser extends User {
  email: string;
}
