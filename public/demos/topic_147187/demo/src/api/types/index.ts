export type ApiResponse<T = unknown> = {
  code: number;
  message: string;
  data: T;
};

export type UserRole = 'super_admin' | 'parent' | 'student' | 'guest';

export type Permission =
  | 'classroom.view'
  | 'classroom.create'
  | 'classroom.update'
  | 'classroom.delete'
  | 'classroom.control'
  | 'classroom.join'
  | 'ai.use'
  | 'ocr.use'
  | 'records.view'
  | 'records.manage'
  | 'user.manage';

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  role: UserRole;
  email?: string;
  children?: User[];
  createdAt: string;
}

export interface Child {
  id: string;
  parentId: string;
  nickname: string;
  avatar?: string;
  grade: string;
  age?: number;
  subjects: string[];
}

export interface AuthSession {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export type ClassroomStatus = 'upcoming' | 'ongoing' | 'ended';

export interface Classroom {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  status: ClassroomStatus;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  participantCount: number;
  participants?: Participant[];
  subject?: string;
  agoraChannel?: string;
  coverImage?: string;
}

export interface Participant {
  id: string;
  userId?: string;
  classroomId: string;
  name: string;
  avatar?: string;
  role: 'host' | 'co_host' | 'student';
  isOnline: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  isHandRaised: boolean;
  joinedAt?: string;
}

export interface AgoraToken {
  appId: string;
  channel: string;
  token: string;
  uid: number;
  expiresIn: number;
}

export interface LearningRecord {
  id: string;
  classroomId?: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  date: string;
  duration: number;
  content: string;
  score: number;
  subject: string;
}

export interface GrowthReport {
  weeklyHours: number[];
  weeklyScores: number[];
  subjectScores: Record<string, number>;
  totalStudyTime: number;
  avgScore: number;
  learningDays: number;
  maxScore: number;
  improvements: string[];
  recentActivities: Array<{
    date: string;
    activity: string;
    duration: number;
    subject?: string;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    earnedAt: string;
  }>;
}

export type AIProvider = 'deepseek' | 'qwen' | 'ernie' | 'zhipu' | 'kimi' | 'doubao';

export interface AIProviderInfo {
  id: AIProvider;
  name: string;
  description: string;
  models: string[];
  enabled: boolean;
  strengths: string[];
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  provider?: AIProvider;
  model?: string;
}

export interface AIChatRequest {
  messages: AIMessage[];
  provider: AIProvider;
  model?: string;
  subject?: string;
  studentId?: string;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  blocks?: Array<{
    text: string;
    bbox: [number, number, number, number];
  }>;
}

export interface DictionaryEntry {
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
  partOfSpeech: string;
  translation?: Record<string, string>;
}

export interface ApiError {
  code: number;
  message: string;
}
