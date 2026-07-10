export interface NotificationSettings {
  id: number;
  userId: number;
  safetyAlert: boolean;
  medicationReminder: boolean;
  deviceOffline: boolean;
  healthAnomaly: boolean;
  doNotDisturbStart: string | null;
  doNotDisturbEnd: string | null;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountInfo {
  phone: string;
  name: string;
  avatarUrl?: string;
  role: string;
  passwordMasked: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  role: 'admin' | 'assistant' | 'elderly';
  roleLabel: string;
  avatarColor: string;
}

export interface EmergencyContact {
  id: number;
  userId: number;
  name: string;
  relation: string;
  phone: string;
  backupPhone?: string | null;
}

export interface AppInfo {
  version: string;
  buildNumber: string;
  platform: string;
  name: string;
}
