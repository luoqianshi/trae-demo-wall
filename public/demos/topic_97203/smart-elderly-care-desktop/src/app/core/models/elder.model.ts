export type SafetyStatus = 'safe' | 'normal' | 'warning' | 'danger';
export type Gender = 'male' | 'female';

export interface Elder {
  id: number;
  name: string;
  avatarUrl?: string | null;
  relation?: string | null;
  birthDate?: string | null;
  gender?: Gender | null;
  address?: string | null;
  safetyStatus: SafetyStatus;
  lastActivityAt?: Date | null;
  devicesOnline: number;
  totalDevices: number;
  createdAt: Date;
  updatedAt: Date;
}
