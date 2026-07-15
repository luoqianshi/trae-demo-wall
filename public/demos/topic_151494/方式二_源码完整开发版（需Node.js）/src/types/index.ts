export type VideoCategory = 'opera' | 'health' | 'food' | 'square-dance' | 'countryside' | 'fraud-demo' | 'other'

export interface DouyinVideo {
  id: string
  title: string
  coverUrl: string
  videoUrl: string
  duration: number
  subtitle: string[]
  author: string
  likes: number
  category: VideoCategory
  description: string
}

export type FraudRiskLevel = 'safe' | 'low' | 'medium' | 'high'

export interface FraudDetectResult {
  isRisk: boolean
  riskLevel: FraudRiskLevel
  matchedKeywords: string[]
  riskDescription: string
  suggestion: string
  score: number
}

export type TemplateCategory = 'square-dance' | 'countryside' | 'cooking' | 'family'

export interface CreationTemplate {
  id: string
  category: TemplateCategory
  name: string
  emoji: string
  coverPreview: string
  bgGradient: string
  bgmOptions: { name: string; url: string }[]
  titleSamples: string[]
  hashtagSamples: string[]
}

export interface GeneratedVideo {
  id: string
  coverUrl: string
  title: string
  hashtags: string[]
  subtitle: string
  bgmName: string
  templateId: string
  createdAt: number
}

export type UserMode = 'elder' | 'child' | 'community'

export interface UserSettings {
  fontSize: 'normal' | 'large' | 'xlarge'
  speechRate: 'slow' | 'normal' | 'fast'
  currentMode: UserMode
  elderName: string
  childName: string
  dailyLimitMinutes: number
  eyeReminderEnabled: boolean
  exerciseReminderEnabled: boolean
}

export interface PushedVideo {
  id: string
  videoId: string
  fromChild: string
  remark: string
  pushedAt: number
  category: 'opera' | 'health' | 'food' | 'other'
  video?: DouyinVideo
}

export interface VoiceMessage {
  id: string
  fromChild: string
  text: string
  createdAt: number
  read: boolean
}

export interface WatchRecord {
  date: string
  durationMinutes: number
}

export interface HealthReminder {
  type: 'eye-rest' | 'exercise'
  enabled: boolean
  intervalMinutes: number
}

export interface LightExercise {
  id: string
  name: string
  description: string
  image: string
  duration: string
  steps: string[]
  emoji: string
}

export interface VideoCollection {
  id: string
  name: string
  coverUrl: string
  videoIds: string[]
  createdAt: number
  qrCodeDataUrl?: string
}

export interface CommunityEvent {
  id: string
  title: string
  date: string
  location: string
  description: string
  coverUrl: string
  emoji: string
  createdAt: number
}

export enum StorageKeys {
  USER_SETTINGS = 'silver_tiktok_settings',
  WATCH_HISTORY = 'silver_tiktok_watch_records',
  PUSHED_VIDEOS = 'silver_tiktok_pushed',
  VOICE_MESSAGES = 'silver_tiktok_messages',
  COLLECTIONS = 'silver_tiktok_collections',
  GENERATED_VIDEOS = 'silver_tiktok_generated',
  EVENTS = 'silver_tiktok_events',
  REMINDERS = 'silver_tiktok_reminders'
}
