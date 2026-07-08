export type TransportType = 'flight' | 'train' | 'bus' | 'car';

export type RouteType = 'boomerang' | 'open_jaw' | 'same_train' | 'normal' | 'nunchaku';

export interface Segment {
  id: string;
  type: TransportType;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  carrier: string;
  flightNo?: string;
  trainNo?: string;
}

export interface Layover {
  city: string;
  duration: number;
  type: 'airport' | 'station' | 'city';
  tips?: string[];
}

export interface Route {
  id: string;
  type: RouteType;
  typeLabel: string;
  from: string;
  to: string;
  date: string;
  totalPrice: number;
  totalDuration: number;
  segments: Segment[];
  layovers: Layover[];
  savings: number;
  extraTime: number;
  highlights: string[];
  rating: number;
  reviewCount: number;
  directPrice?: number;
  directDuration?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  points: number;
  level: number;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  createdAt: string;
}

export interface SharedRoute {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  routeId: string;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  comments: Comment[];
  saves: number;
  createdAt: string;
  routeFrom?: string;
  routeTo?: string;
  routePrice?: number;
  isLiked?: boolean;
}

export interface SearchHistory {
  id: string;
  from: string;
  to: string;
  date: string;
  searchedAt: string;
}

export interface FavoriteRoute {
  id: string;
  routeId: string;
  route: Route;
  addedAt: string;
}

export type SortType = 'price' | 'duration' | 'layover';
