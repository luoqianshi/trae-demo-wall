export interface User {
  id: string;
  name: string;
  avatar: string;
  points: number;
  totalTennis: number;
  badges: string[];
  joinDate: string;
  rank?: number;
}

export interface Checkin {
  id: string;
  userId: string;
  imageUrl: string;
  tennisCount: number;
  pointsEarned: number;
  createdAt: string;
}

export interface Gift {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  description: string;
}

export interface Certificate {
  id: string;
  name: string;
  requiredPoints: number;
  image: string;
  description: string;
}

export interface Stats {
  totalTennis: number;
  totalUsers: number;
  totalPoints: number;
  savedResources: {
    plastic: number;
    rubber: number;
    carbonReduction: number;
  };
}

export interface Knowledge {
  id: string;
  title: string;
  content: string;
  image: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  deadline: string;
  participants: number;
  image: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredTennis: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  totalTennis: number;
  points: number;
}
