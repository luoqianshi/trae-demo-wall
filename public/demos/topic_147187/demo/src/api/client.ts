import type { ApiResponse } from './types';

const USE_MOCK = true;
const BASE_URL = '/api/v1';
const TOKEN_KEY = 'rt-software-token';
const SESSION_KEY = 'rt-software-session';

const latency = () => 200 + Math.random() * 400;

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function setStoredSession(session: { user: any; token: string } | null): void {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  setToken(session?.token || null);
}

export function getStoredSession(): { user: any; token: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  code: number;
  constructor(message: string, code = 5000) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

export class ApiClient {
  static async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, params);
  }

  static async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data);
  }

  static async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data);
  }

  static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }

  static async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, formData, undefined, true);
  }

  static async request<T>(
    method: string,
    endpoint: string,
    body?: any,
    params?: Record<string, any>,
    isFormData = false
  ): Promise<ApiResponse<T>> {
    if (!USE_MOCK) {
      const url = new URL(`${BASE_URL}${endpoint}`, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.append(k, String(v)));
      }

      const headers: Record<string, string> = {};
      const token = getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (!isFormData) headers['Content-Type'] = 'application/json';

      try {
        const res = await fetch(url.toString(), {
          method,
          headers,
          body: body && !isFormData ? JSON.stringify(body) : body,
        });
        const json = await res.json();
        if (json.code !== 0) throw new ApiError(json.message || '请求失败', json.code);
        return json;
      } catch (e: any) {
        if (e instanceof ApiError) throw e;
        throw new ApiError(e.message || '网络错误');
      }
    }

    await delay(latency());
    return mockRouter(method, endpoint, body, params);
  }
}

type MockHandler = (params?: Record<string, any>, body?: any) => Promise<ApiResponse<any>> | ApiResponse<any>;

const mockRouter = async (
  method: string,
  endpoint: string,
  body?: any,
  params?: Record<string, any>
): Promise<ApiResponse<any>> => {
  const routeKey = `${method} ${endpoint}`;
  const handler = MOCK_HANDLERS[routeKey];
  if (!handler) {
    return {
      code: 404,
      message: `接口不存在: ${routeKey}`,
      data: null,
    };
  }
  const result = await handler(params, body);
  return result;
};

import { MOCK_HANDLERS } from './mock/handlers';
