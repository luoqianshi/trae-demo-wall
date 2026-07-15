import axios from 'axios';
import type {
  Child,
  Schedule,
  ScheduleTemplate,
  AllowanceTransaction,
  RewardRule,
  RewardRecord,
  ClockInRecord,
  Device,
  RFIDBinding,
  SleepConfig,
  DeviceLog,
  Stats,
  Settings,
  FestivalInfo,
  ThemeInfo,
  BirthdayCheckResult,
  BirthdayAgeResult,
  BirthdayUpcomingItem,
  CreateChildRequest,
  ClockInRequest,
  SpendRequest,
  CreateRFIDBindingRequest,
  UpdateRFIDBindingRequest,
  DeviceCommandRequest,
} from './types';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
});

const birthdayApi = axios.create({
  baseURL: '/api/birthday',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

birthdayApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Birthday API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;

// ---- Child APIs ----
export const childAPI = {
  list: () => api.get<Child[]>('/children'),
  get: (id: string) => api.get<Child>(`/children/${id}`),
  create: (data: CreateChildRequest) => api.post<Child>('/children', data),
  update: (id: string, data: Partial<CreateChildRequest>) =>
    api.put<Child>(`/children/${id}`, data),
  delete: (id: string) => api.delete(`/children/${id}`),
};

// ---- Schedule APIs ----
export const scheduleAPI = {
  listByChildAndDate: (childId: string, date: string) =>
    api.get<Schedule[]>('/schedules', { params: { child_id: childId, date } }),
  listByDate: (date: string) => api.get<Schedule[]>('/schedules/date', { params: { date } }),
  create: (data: Partial<Schedule>) => api.post<Schedule>('/schedules', data),
  update: (id: string, data: Partial<Schedule>) =>
    api.put<Schedule>(`/schedules/${id}`, data),
  delete: (id: string) => api.delete(`/schedules/${id}`),
  generate: (childId: string, date: string, templateIds?: string[]) =>
    api.post<Schedule[]>('/schedules/generate', { child_id: childId, date, template_ids: templateIds }),

  // Templates
  listTemplates: () => api.get<ScheduleTemplate[]>('/schedule-templates'),
  createTemplate: (data: Partial<ScheduleTemplate>) =>
    api.post<ScheduleTemplate>('/schedule-templates', data),
  updateTemplate: (id: string, data: Partial<ScheduleTemplate>) =>
    api.put<ScheduleTemplate>(`/schedule-templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/schedule-templates/${id}`),
};

// ---- Allowance APIs ----
export const allowanceAPI = {
  getBalance: (childId: string) =>
    api.get<{ balance: number; child_id: string }>(`/allowance/${childId}`),
  listTransactions: (childId: string) =>
    api.get<AllowanceTransaction[]>(`/allowance/${childId}/transactions`),
  spend: (childId: string, amount: number, description: string) =>
    api.post<AllowanceTransaction>(`/allowance/${childId}/spend`, { amount, description } as SpendRequest),
};

// ---- Reward APIs ----
export const rewardAPI = {
  listRules: () => api.get<RewardRule[]>('/reward-rules'),
  createRule: (data: Partial<RewardRule>) => api.post<RewardRule>('/reward-rules', data),
  updateRule: (id: string, data: Partial<RewardRule>) =>
    api.put<RewardRule>(`/reward-rules/${id}`, data),
  deleteRule: (id: string) => api.delete(`/reward-rules/${id}`),
  listRecords: (childId?: string) =>
    api.get<RewardRecord[]>('/reward-records', {
      ...(childId ? { params: { child_id: childId } } : {}),
    }),
  createRecord: (data: Partial<RewardRecord>) =>
    api.post<RewardRecord>('/reward-records', data),
  updateRecord: (id: string, data: Partial<RewardRecord>) =>
    api.put<RewardRecord>(`/reward-records/${id}`, data),
  deleteRecord: (id: string) => api.delete(`/reward-records/${id}`),
};

// ---- Clock-in APIs ----
export const clockAPI = {
  clockIn: (data: ClockInRequest) => api.post<ClockInRecord>('/clock-in', data),
  confirm: (id: string) => api.post<ClockInRecord>(`/clock-in/${id}/confirm`),
  reject: (id: string) => api.post<ClockInRecord>(`/clock-in/${id}/reject`),
  listByChild: (childId: string) => api.get<ClockInRecord[]>(`/clock-in/child/${childId}`),
  listByDevice: (deviceId: string) =>
    api.get<ClockInRecord[]>('/clock-in/device', { params: { device_id: deviceId } }),
};

// ---- Device APIs ----
export const deviceAPI = {
  list: () => api.get<Device[]>('/devices'),
  create: (data: Partial<Device>) => api.post<Device>('/devices', data),
  update: (id: string, data: Partial<Device>) =>
    api.put<Device>(`/devices/${id}`, data),
  delete: (id: string) => api.delete(`/devices/${id}`),
};

// ---- RFID Binding APIs ----
export const rfidAPI = {
  list: () => api.get<RFIDBinding[]>('/rfid-bindings'),
  create: (data: CreateRFIDBindingRequest) =>
    api.post<RFIDBinding>('/rfid-bindings', data),
  update: (id: string, data: UpdateRFIDBindingRequest) =>
    api.put<RFIDBinding>(`/rfid-bindings/${id}`, data),
  delete: (id: string) => api.delete(`/rfid-bindings/${id}`),
};

// ---- Sleep Config APIs ----
export const sleepConfigAPI = {
  get: (deviceId: string) => api.get<SleepConfig>(`/devices/${deviceId}/sleep-config`),
  update: (deviceId: string, data: Partial<SleepConfig>) =>
    api.put<SleepConfig>(`/devices/${deviceId}/sleep-config`, data),
};

// ---- Device Log APIs ----
export const deviceLogAPI = {
  list: (params?: { child_id?: string; device_id?: string }) =>
    api.get<DeviceLog[]>('/device-logs', { params }),
};

// ---- Device Command APIs ----
export const deviceCommandAPI = {
  send: (deviceId: string, cmd: string) =>
    api.post<{ success: boolean }>(`/devices/${deviceId}/command`, { cmd } as DeviceCommandRequest),
};

// ---- Device Photo APIs ----
export const devicePhotoAPI = {
  list: (deviceId: string) =>
    api.get<Array<{ filename: string; size: number; mod_time: string }>>(`/devices/${deviceId}/photos`),
  getUrl: (deviceId: string, filename: string) =>
    `/api/v1/devices/${deviceId}/photos/${filename}`,
};

// ---- Stats APIs ----
export const statsAPI = {
  get: (childId: string) => api.get<Stats>('/stats', { params: { child_id: childId } }),
};

// ---- Settings APIs ----
export const settingsAPI = {
  get: () => api.get<Settings>('/settings'),
  update: (data: Partial<Settings>) => api.put<Settings>('/settings', data),
};

// ---- Birthday APIs ----
export const birthdayAPI = {
  check: (birthday: string) => birthdayApi.get<BirthdayCheckResult>('/check', { params: { birthday } }),
  age: (birthday: string) => birthdayApi.get<BirthdayAgeResult>('/age', { params: { birthday } }),
  upcoming: (birthdays: string[]) =>
    birthdayApi.get<BirthdayUpcomingItem[]>('/upcoming', { params: { birthdays: birthdays.join(',') } }),
};