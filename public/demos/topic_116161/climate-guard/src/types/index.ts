// ==================== 核心类型定义 ====================

export type RiskLevel = '低' | '中' | '高' | '极高';
export type RiskMode = '高温' | '寒潮' | '湿冷' | '风寒' | '昼夜温差' | '正常';

export interface WeatherData {
  city: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  feelsLike: number;
  condition: string;
  uvIndex?: number;
  pressure?: number;
  visibility?: number;
}

export interface DayForecast {
  date: string;
  highTemp: number;
  lowTemp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
}

export interface RiskProfile {
  identity: IdentityType;
  ageGroup: AgeGroup;
  outdoorHours: OutdoorHours;
  chronicDisease: ChronicDisease;
  mainTimeSlot: TimeSlot;
  city: string;
  isAlone: boolean;
  hasAC: boolean;
}

export type IdentityType = 
  | '普通居民' | '外卖骑手' | '快递员' | '环卫工' 
  | '建筑工' | '学生' | '通勤族' | '独居老人' | '慢病人群';

export type AgeGroup = '儿童' | '青年' | '中年' | '老人';
export type OutdoorHours = '0-1小时' | '1-3小时' | '3-6小时' | '6小时以上';
export type ChronicDisease = '无' | '心脑血管' | '呼吸系统' | '糖尿病' | '其他';
export type TimeSlot = '上午' | '中午' | '下午' | '晚上';

export interface RiskResult {
  score: number;
  level: RiskLevel;
  mode: RiskMode;
  reasons: string[];
  actions: string[];
  dangerousTimeSlot?: string;
  careMessage?: string;
}

export interface CaredPerson {
  id: string;
  nickname: string;
  relation: RelationType;
  city: string;
  ageGroup: AgeGroup;
  healthTags: string[];
  isAlone: boolean;
  hasAC: boolean;
  lastSafeCheck?: string;
  phone?: string;
  riskResult?: RiskResult;
}

export type RelationType = '父母' | '孩子' | '伴侣' | '独居老人' | '同事' | '朋友';

export interface SafePoint {
  id: string;
  name: string;
  type: SafePointType;
  distance: string;
  address: string;
  openTime: string;
  services: string[];
  suitableFor: string[];
  phone?: string;
  lat: number;
  lng: number;
}

export type SafePointType = 
  | '清凉驿站' | '暖心驿站' | '社区服务中心' 
  | '地铁站' | '商场' | '便利店' | '药店' | '医院' | '急救点';

export interface EmergencySymptom {
  id: string;
  name: string;
  severity: '轻度' | '中度' | '重度';
}

export interface EmergencyAdvice {
  riskStatement: string;
  immediateActions: string[];
  warningSigns: string[];
  contactFamily: boolean;
  contactManager: boolean;
  call120: boolean;
  nearbySafePoints: SafePoint[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  riskResult: RiskResult;
  status: '正常' | '需关注' | '异常';
  lastCheckIn?: string;
  phone?: string;
}

export interface TeamConfig {
  id: string;
  name: string;
  type: '外卖站点' | '快递网点' | '环卫班组' | '工地班组' | '园区巡检队';
  members: TeamMember[];
  city: string;
}

export interface UserSettings {
  city: string;
  identity: IdentityType;
  ageGroup: AgeGroup;
  healthTags: string[];
  isAlone: boolean;
  hasAC: boolean;
  notifications: boolean;
  familyAuth: boolean;
  stationMode: boolean;
}

export interface CityWeather {
  city: string;
  current: WeatherData;
  forecast: DayForecast[];
  riskMode: RiskMode;
  riskLevel: RiskLevel;
  dangerousTimeSlot: string;
  aiReminder: string;
}
