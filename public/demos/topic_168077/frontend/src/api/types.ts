// ---- API Response Types ----

export interface Child {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  school?: string;
  class?: string;
  avatar?: string;
  birthday?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Schedule {
  id: string;
  child_id: string;
  date: string;
  start_time: string;
  end_time?: string;
  activity: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  items?: ScheduleTemplateItem[];
  created_at?: string;
  updated_at?: string;
}

export interface ScheduleTemplateItem {
  start_time: string;
  end_time?: string;
  activity: string;
}

export interface AllowanceTransaction {
  id: string;
  child_id: string;
  amount: number;
  type: string;
  description: string;
  created_at?: string;
}

export interface RewardRule {
  id: string;
  name: string;
  type: 'reward' | 'punishment';
  amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface RewardRecord {
  id: string;
  child_id: string;
  rule_id?: string;
  rule_name?: string;
  amount: number;
  type: 'reward' | 'punishment';
  created_at?: string;
}

export interface ClockInRecord {
  id: string;
  child_id: string;
  device_id?: string;
  event_type: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'rejected';
  math_problem?: string;
  math_user_answer?: string;
  math_correct?: boolean | null;
  rfid_uid?: string;
  created_at?: string;
}

export interface Device {
  id: string;
  name: string;
  device_id: string;
  chip_id?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RFIDBinding {
  id: string;
  child_id: string;
  rfid_uid: string;
  label?: string;
  created_at?: string;
}

export interface SleepConfig {
  sleep_start: string;
  sleep_end: string;
  enabled?: boolean;
}

export interface DeviceLog {
  id: string;
  child_id?: string;
  device_id: string;
  event_type: string;
  status: string;
  math_problem?: string;
  math_user_answer?: string;
  math_correct?: boolean | null;
  rfid_uid?: string;
  created_at?: string;
}

export interface Stats {
  total: number;
  confirmed: number;
  rejected: number;
  streak_days: number;
}

export interface Settings {
  ai?: {
    api_endpoint: string;
    api_key: string;
    model: string;
  };
  theme?: string;
}

// Festival types
export interface FestivalItem {
  key: string;
  name: string;
  date: string;
  type: 'solar' | 'lunar';
  is_start: boolean;
  theme: string;
}

export interface FestivalInfo {
  festivals: FestivalItem[];
  theme: string;
  label: string;
}

export interface ThemeInfo {
  theme: string;
  name: string;
  label: string;
  current?: boolean;
}

// Birthday API types
export interface BirthdayCheckResult {
  is_birthday: boolean;
  age: number;
  next_birthday: string;
  days_until: number;
}

export interface BirthdayAgeResult {
  age: number;
  birthday: string;
  next_birthday: string;
  days_until_next: number;
}

export interface BirthdayUpcomingItem {
  birthday: string;
  age: number;
  next_birthday: string;
  days_until: number;
}

// Request types
export interface CreateChildRequest {
  name: string;
  age?: number;
  gender?: string;
  school?: string;
  class?: string;
  avatar?: string;
  birthday?: string;
}

export interface ClockInRequest {
  child_id: string;
  device_id: string;
  event_type: string;
  timestamp?: string;
}

export interface SpendRequest {
  amount: number;
  description: string;
}

export interface CreateRFIDBindingRequest {
  child_id: string;
  rfid_uid: string;
  label?: string;
}

export interface UpdateRFIDBindingRequest {
  child_id?: string;
  rfid_uid?: string;
  label?: string;
}

export interface DeviceCommandRequest {
  cmd: string;
}