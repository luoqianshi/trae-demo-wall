import { ApiClient } from '../client';
import type {
  User,
  Classroom,
  AgoraToken,
  LearningRecord,
  GrowthReport,
  AIProviderInfo,
  AIMessage,
  OCRResult,
  DictionaryEntry,
  AuthSession,
  AIProvider,
} from '../types';

export const authService = {
  sendSmsCode: (phone: string) =>
    ApiClient.post<{ sent: boolean; debugCode?: string }>('/auth/sms-code', { phone }),

  register: (data: {
    phone: string;
    password: string;
    nickname: string;
    role: 'parent' | 'student';
    verifyCode: string;
  }) => ApiClient.post<AuthSession>('/auth/register', data),

  login: (data: { phone: string; password: string; role: string }) =>
    ApiClient.post<AuthSession | { requireRegister: boolean; message: string }>(
      '/auth/login',
      data
    ),

  logout: () => ApiClient.post('/auth/logout'),

  getProfile: () => ApiClient.get<User>('/auth/profile'),

  getPermissions: () => ApiClient.get<{ role: string; permissions: string[] }>('/auth/permissions'),
};

export const classroomService = {
  list: (params?: { status?: string; hostId?: string }) =>
    ApiClient.get<{ list: Classroom[]; total: number }>('/classrooms', params),

  detail: (id: string) => ApiClient.get<Classroom>(`/classrooms/${id}`),

  create: (data: {
    name: string;
    description: string;
    startTime: string;
    endTime: string;
    subject?: string;
  }) => ApiClient.post<Classroom>('/classrooms', data),

  delete: (id: string) => ApiClient.delete(`/classrooms/${id}`),
};

export const rtcService = {
  getToken: (classroomId: string) =>
    ApiClient.get<AgoraToken>('/rtc/token', { classroomId }),
};

export const aiService = {
  getProviders: () => ApiClient.get<AIProviderInfo[]>('/ai/providers'),

  chat: (data: {
    messages: AIMessage[];
    provider: AIProvider;
    model?: string;
    subject?: string;
    stream?: boolean;
  }) => ApiClient.post<{ message: AIMessage; usage: any }>('/ai/chat', data),
};

export const toolsService = {
  ocr: (imageFile: File, classroomId?: string) => {
    const form = new FormData();
    form.append('image', imageFile);
    if (classroomId) form.append('classroomId', classroomId);
    return ApiClient.upload<OCRResult>('/tools/ocr', form);
  },

  dictionary: (word: string) =>
    ApiClient.get<DictionaryEntry>('/tools/dictionary', { word }),
};

export const recordsService = {
  list: (params?: { studentId?: string; subject?: string }) =>
    ApiClient.get<{ list: LearningRecord[]; total: number }>('/records', params),

  getGrowth: (studentId?: string) =>
    ApiClient.get<GrowthReport>('/records/growth', { studentId }),
};
