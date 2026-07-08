export interface HealthData {
  id: string;
  type: 'heartRate' | 'bloodPressure' | 'sleep';
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'danger';
  time: string;
}

export interface HealthTrend {
  date: string;
  value: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  relationship: string;
  phone: string;
  isOnline: boolean;
  lastContact: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  priority: number;
}

export interface WeatherInfo {
  city: string;
  temperature: number;
  weather: string;
  humidity: string;
  wind: string;
}

export interface QuickAction {
  id: string;
  name: string;
  icon: string;
  path: string;
}