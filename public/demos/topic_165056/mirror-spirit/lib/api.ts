const API_BASE = "http://localhost:8000/api";

export interface AnalysisResponse {
  ideal_self: string;
  actual_self: string;
  discrepancy_score: number;
  suggested_action: string;
  location_keyword: string;
  emotion_dimensions?: {
    energy: number;
    anxiety: number;
    happiness: number;
    calmness: number;
    motivation: number;
    confidence: number;
  };
  strengths?: string[];
  growth_areas?: string[];
  mirror_insight?: string;
  personality_traits?: string[];
}

export interface HardwareUploadRequest {
  timestamp: string;
  gps_latitude: number;
  gps_longitude: number;
  image_base64?: string;
  audio_transcript?: string;
  description_text?: string;
}

export interface SpatialPlanTask {
  id: string;
  name: string;
  description: string;
  type: string;
  latitude: number;
  longitude: number;
  priority: "high" | "medium" | "low";
  suggested_duration: string;
}

export interface SpatialPlanResponse {
  discrepancy_score: number;
  location_keyword: string;
  total_tasks: number;
  tasks: SpatialPlanTask[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  insight?: string;
  created_at?: string;
}

export interface ChatResponse {
  response: string;
  insight: string;
  history: ChatMessage[];
}

export interface TrendData {
  dates: string[];
  scores: number[];
}

export interface OverviewStats {
  total_analyses: number;
  avg_week_score: number;
  avg_month_score: number;
  total_chats: number;
  top_locations: { keyword: string; count: number }[];
}

export async function healthCheck() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export async function analyzeSelf(
  diaryText: string,
  audioTranscript?: string,
  imageDescription?: string,
  gpsCoordinates?: string
): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/analyze_self`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      diary_text: diaryText,
      audio_transcript: audioTranscript,
      image_description: imageDescription,
      gps_coordinates: gpsCoordinates,
    }),
  });
  if (!res.ok) throw new Error("Analysis failed");
  return res.json();
}

export async function uploadHardwareData(
  data: HardwareUploadRequest
): Promise<{ analysis: AnalysisResponse; spatial_plan: SpatialPlanResponse }> {
  const res = await fetch(`${API_BASE}/hardware/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Hardware upload failed");
  return res.json();
}

export async function generateSpatialPlan(
  discrepancyScore: number,
  locationKeyword: string,
  userLat: number,
  userLng: number
): Promise<SpatialPlanResponse> {
  const res = await fetch(`${API_BASE}/generate_spatial_plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      discrepancy_score: discrepancyScore,
      location_keyword: locationKeyword,
      user_lat: userLat,
      user_lng: userLng,
    }),
  });
  if (!res.ok) throw new Error("Spatial plan generation failed");
  return res.json();
}

export async function chatWithMirror(
  message: string,
  userId: string = "default_user",
  history: ChatMessage[] = []
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      user_id: userId,
      history,
    }),
  });
  if (!res.ok) throw new Error("Chat failed");
  return res.json();
}

export async function getChatHistory(userId: string = "default_user"): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE}/chat/history?user_id=${userId}`);
  if (!res.ok) throw new Error("Failed to get chat history");
  const data = await res.json();
  return data.messages;
}

export async function getTrendData(days: number = 7): Promise<TrendData> {
  const res = await fetch(`${API_BASE}/history/trend?days=${days}`);
  if (!res.ok) throw new Error("Failed to get trend data");
  return res.json();
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const res = await fetch(`${API_BASE}/stats/overview`);
  if (!res.ok) throw new Error("Failed to get stats");
  return res.json();
}

export interface DailySummary {
  id: number;
  user_id: string;
  date: string;
  avg_discrepancy_score: number;
  avg_emotion_dimensions?: {
    energy: number;
    anxiety: number;
    happiness: number;
    calmness: number;
    motivation: number;
    confidence: number;
  };
  top_location_keyword: string;
  summary_text: string;
  mirror_insight: string;
  suggestions: string[];
  analysis_count: number;
  chat_count: number;
  emotion_label?: string;
  created_at: string;
}

export interface PushNotification {
  id: number;
  user_id: string;
  type: string;
  title: string;
  content: string;
  insight: string;
  is_read: number;
  priority: string;
  related_date: string;
  created_at: string;
}

export interface UserSettings {
  id: number;
  user_id: string;
  push_enabled: number;
  morning_push_time: string;
  evening_push_time: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
  max_daily_pushes: number;
  created_at: string;
  updated_at: string;
}

export async function getDailySummaries(limit: number = 30): Promise<DailySummary[]> {
  const res = await fetch(`${API_BASE}/daily-summaries?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to get daily summaries");
  const data = await res.json();
  return data.summaries;
}

export async function getDailySummary(date: string): Promise<DailySummary> {
  const res = await fetch(`${API_BASE}/daily-summaries/${date}`);
  if (!res.ok) throw new Error("Failed to get daily summary");
  return res.json();
}

export async function generateDailySummary(date?: string): Promise<DailySummary> {
  const url = date
    ? `${API_BASE}/daily-summaries/generate?date=${date}`
    : `${API_BASE}/daily-summaries/generate`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error("Failed to generate daily summary");
  return res.json();
}

export async function getNotifications(unreadOnly: boolean = false, limit: number = 50): Promise<{
  notifications: PushNotification[];
  unread_count: number;
  total: number;
}> {
  const res = await fetch(`${API_BASE}/notifications?unread_only=${unreadOnly}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to get notifications");
  return res.json();
}

export async function markNotificationRead(notifId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/notifications/${notifId}/read`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to mark notification read");
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch(`${API_BASE}/notifications/read-all`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to mark all read");
}

export async function getUserSettings(): Promise<UserSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error("Failed to get settings");
  return res.json();
}

export async function updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  const data = await res.json();
  return data.settings;
}
