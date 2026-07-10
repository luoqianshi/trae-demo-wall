export type UserRole = 'admin' | 'assistant' | 'child' | 'elder';

export interface User {
  id: number;
  phone: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  name: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user?: User;
}
