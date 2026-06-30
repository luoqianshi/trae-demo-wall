// 菇管家小程序 — 全局类型定义

/** 环境指标状态：正常 / 警告 / 危险 / 离线 */
export type MetricStatus = "normal" | "warning" | "danger" | "offline";

/** 告警等级 */
export type AlertLevel = "warning" | "danger";

/** 单个环境指标 */
export interface Metric {
  value: number;
  unit: string;
  status: MetricStatus;
  /** 该指标在正常状态下的文字描述，如"正常" / "偏高" / "过低" */
  label: string;
  target: string;
}

/** 指标类型 key */
export type MetricKey = "temperature" | "humidity" | "co2" | "light" | "soilTemp";

/** 告警项 */
export interface AlertItem {
  type: string;
  level: AlertLevel;
  message: string;
  suggestion: string;
  timestamp?: string;
  /** 用于告警列表 */
  alertId?: string;
  shedName?: string;
  status?: "pending" | "resolved";
  createdAt?: string;
  resolvedAt?: string;
}

/** 首页看板数据 */
export interface Dashboard {
  shedId: string;
  shedName: string;
  mushroomType: string;
  growthStage: string;
  stageDay: number;
  metrics: Record<MetricKey, Metric>;
  alerts: AlertItem[];
  status: MetricStatus;
  updateTime: string;
  /** 离线相关 */
  offlineDuration?: string;
  lastOnline?: string;
}

/** 多棚概览行 */
export interface ShedSummary {
  id: string;
  name: string;
  mushroomType: string;
  temp: number;
  humidity: number;
  status: MetricStatus;
  alertCount: number;
  offlineDuration?: string;
}

/** 诊断结果 */
export interface DiagnosisResult {
  diagnosisId: string;
  imageUrl: string;
  diseaseName: string;
  diseaseEn: string;
  confidence: number;
  confidenceLevel: "high" | "medium" | "low";
  symptoms: string;
  cause: string;
  treatment: {
    immediate: string[];
    medication: {
      name: string;
      dosage: string;
      method: string;
      duration: string;
    };
    prevention: string[];
  };
  severity: "low" | "medium" | "high";
  humanReview: boolean;
  timestamp: string;
}

/** 语音问答结果 */
export interface VoiceQAResult {
  question: string;
  answer: string;
  relatedVideos: string[];
  source: string;
  timestamp: string;
}

/** 生长阶段 */
export type GrowthStage = "菌丝期" | "转色期" | "出菇期" | "已采收";

/** 批次列表项 */
export interface Batch {
  batchId: string;
  mushroomType: string;
  variety: string;
  shedName: string;
  quantity: number;
  startDate: string;
  currentStage: GrowthStage;
  stageDay: number;
  expectedHarvest: string;
  status: "growing" | "harvested";
  lastAction: string;
  /** 已采收 */
  yield?: number;
  unitCost?: number;
}

/** 时间轴节点 */
export interface TimelineNode {
  date: string;
  event: string;
  detail: string;
  /** 是否为预计节点（虚线样式） */
  expected?: boolean;
}

/** 批次详情 */
export interface BatchDetail extends Batch {
  timeline: TimelineNode[];
  envAvg7d: {
    temp: number;
    humidity: number;
    co2Peak: number;
  };
  alertCount: number;
}

/** 设备 */
export interface Device {
  id: string;
  name: string;
  shed: string;
  status: "online" | "offline";
  battery: number;
  signal: number;
  lastUpdate: string;
  /** 设备详情扩展 */
  model?: string;
  firmware?: string;
  otaAvailable?: boolean;
}

/** 用户信息 */
export interface UserProfile {
  userId: string;
  name: string;
  phone: string;
  plan: "professional" | "standard";
  planName: string;
  expiresAt: string;
  devices: Device[];
  alertSettings: AlertSettings;
}

/** 告警设置 */
export interface AlertSettings {
  tempMax: number;
  tempMin: number;
  humidityMax: number;
  humidityMin: number;
  co2Max: number;
  notifyPush: boolean;
  notifySMS: boolean;
  notifyCall: boolean;
}

/** AI 助手历史记录 */
export interface AIHistoryItem {
  id: string;
  kind: "diagnosis" | "voice";
  icon: string;
  title: string;
  time: string;
  confidence?: number;
}

/** 农技课堂内容 */
export interface CourseItem {
  id: string;
  title: string;
  category: "视频教程" | "病害图鉴" | "专家直播";
  cover: string;
  duration?: string;
  views: number;
  live?: boolean;
}

/** 历史曲线点 */
export interface ChartPoint {
  label: string;
  value: number;
}
