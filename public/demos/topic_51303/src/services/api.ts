import {
  aiHistory,
  alerts as mockAlerts,
  batchDetails,
  batches,
  chartDataByMetric,
  courses,
  dashboards,
  delay,
  diagnosisResult,
  devices,
  knowledgeTags,
  shedSummaries,
  userProfile,
  voiceQAResult,
} from "@/mock/data";
import type {
  AlertItem,
  AlertSettings,
  AIHistoryItem,
  Batch,
  BatchDetail,
  CourseItem,
  Dashboard,
  Device,
  DiagnosisResult,
  MetricKey,
  ShedSummary,
  UserProfile,
  VoiceQAResult,
} from "@/types";

const ok = <T>(data: T) => ({ code: 0, data });

// ============ 首页看板 ============
export async function getDashboard(shedId: string): Promise<Dashboard> {
  await delay(500);
  const d = dashboards[shedId] ?? dashboards.S001;
  return ok(d).data;
}

export async function getSheds(): Promise<ShedSummary[]> {
  await delay(300);
  return ok(shedSummaries).data;
}

// ============ AI 诊断 & 语音 ============
export async function diagnose(_imageUrl: string): Promise<DiagnosisResult> {
  await delay(2800); // 约 3 秒识别
  return ok(diagnosisResult).data;
}

export async function voiceAsk(_question: string): Promise<VoiceQAResult> {
  await delay(1200);
  return ok(voiceQAResult).data;
}

export async function getAIHistory(): Promise<AIHistoryItem[]> {
  await delay(200);
  return ok(aiHistory).data;
}

export function getKnowledgeTags() {
  return knowledgeTags;
}

// ============ 种植档案 ============
export async function getBatches(stage?: string): Promise<Batch[]> {
  await delay(400);
  let list = batches;
  if (stage && stage !== "全部") list = list.filter((b) => b.currentStage === stage);
  return ok(list).data;
}

export async function getBatchDetail(id: string): Promise<BatchDetail> {
  await delay(400);
  return ok(batchDetails[id] ?? batchDetails["2026-A001"]).data;
}

// ============ 告警 ============
export async function getAlerts(filter: "pending" | "resolved" | "all" = "all"): Promise<AlertItem[]> {
  await delay(300);
  let list = mockAlerts;
  if (filter !== "all") list = list.filter((a) => a.status === filter);
  return ok(list).data;
}

// ============ 设备 ============
export async function getDevices(): Promise<Device[]> {
  await delay(300);
  return ok(devices).data;
}

export async function getDeviceDetail(id: string): Promise<Device> {
  await delay(300);
  return ok(devices.find((d) => d.id === id) ?? devices[0]).data;
}

// ============ 用户 ============
export async function getUser(): Promise<UserProfile> {
  await delay(300);
  return ok(userProfile).data;
}

export async function saveAlertSettings(settings: AlertSettings): Promise<AlertSettings> {
  await delay(400);
  userProfile.alertSettings = settings;
  return ok(settings).data;
}

// ============ 农技课堂 ============
export async function getCourses(category?: string): Promise<CourseItem[]> {
  await delay(300);
  let list = courses;
  if (category && category !== "全部") list = list.filter((c) => c.category === category);
  return ok(list).data;
}

// ============ 历史曲线 ============
export async function getChartData(
  metric: MetricKey,
  range: "24h" | "7d" | "30d"
): Promise<{ label: string; value: number }[]> {
  await delay(300);
  return ok(chartDataByMetric[metric][range]).data;
}
