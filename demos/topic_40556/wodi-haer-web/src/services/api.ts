// API 请求封装（增强版）

// API 基础地址（注意：后端路由在 /api/v1/ 下）
const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api/v1';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>;
  skipAuth?: boolean;
  retryCount?: number; // 新增：请求重试次数，默认2次
}

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
}

class ApiError extends Error {
  code: number;
  status: number;

  constructor(message: string, code: number, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

// ========== 同步状态指示器 ==========
export const syncStatus = {
  isSyncing: false,
  lastSyncTime: null as Date | null,
  pendingCount: 0,
  error: null as string | null,
};

// 更新同步状态
function updateSyncStatus(partial: Partial<typeof syncStatus>) {
  Object.assign(syncStatus, partial);
}

// ========== 离线队列 ==========
interface PendingRequest {
  url: string;
  options: RequestOptions;
  timestamp: number;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

const pendingQueue: PendingRequest[] = [];
const MAX_QUEUE_SIZE = 100;

// 添加请求到队列
function enqueueRequest(url: string, options: RequestOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    // 超出最大长度时丢弃最旧的
    if (pendingQueue.length >= MAX_QUEUE_SIZE) {
      pendingQueue.shift();
    }

    pendingQueue.push({
      url,
      options,
      timestamp: Date.now(),
      resolve,
      reject,
    });

    updateSyncStatus({
      pendingCount: pendingQueue.length,
      error: '网络断开，请求已加入离线队列',
    });
  });
}

// 处理队列中的请求
async function processQueue() {
  if (pendingQueue.length === 0 || syncStatus.isSyncing) return;

  updateSyncStatus({ isSyncing: true, error: null });

  while (pendingQueue.length > 0) {
    const request = pendingQueue.shift();
    if (!request) break;

    try {
      // 直接发送请求，不经过重试逻辑（避免无限循环）
      const result = await fetchWithRetry(request.url, request.options, 0);
      request.resolve(result);
      updateSyncStatus({ lastSyncTime: new Date(), pendingCount: pendingQueue.length });
    } catch (error) {
      // 如果还是网络错误，重新入队
      if (isNetworkError(error)) {
        pendingQueue.unshift(request);
        updateSyncStatus({
          error: '同步失败，网络仍然不可用',
          pendingCount: pendingQueue.length,
        });
        break;
      } else {
        request.reject(error);
        updateSyncStatus({
          error: error instanceof Error ? error.message : '同步失败',
          pendingCount: pendingQueue.length,
        });
      }
    }

    // 稍微延迟，避免请求过于密集
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  updateSyncStatus({ isSyncing: false });
}

// 监听网络状态变化
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[API] 网络已恢复，开始处理离线队列');
    processQueue();
  });

  window.addEventListener('offline', () => {
    console.log('[API] 网络已断开');
    updateSyncStatus({ error: '网络连接已断开' });
  });
}

// 获取待发送数量
export function getPendingCount(): number {
  return pendingQueue.length;
}

// ========== 错误分类处理 ==========
function isNetworkError(error: any): boolean {
  if (error instanceof ApiError && (error.status === 0 || error.code === -1)) {
    return true;
  }
  if (error?.message?.includes('ERR_NETWORK') || error?.message?.includes('timeout')) {
    return true;
  }
  return false;
}

function isTimeoutError(error: any): boolean {
  return error?.message?.includes('timeout') || error?.message?.includes('超时');
}

function handleErrorResponse(error: ApiError): never {
  switch (true) {
    case isNetworkError(error):
      console.error('[API] 网络错误:', error.message);
      showToast('网络连接失败，请检查网络');
      break;

    case error.status === 401:
      console.error('[API] 未授权:', error.message);
      handleUnauthorized();
      break;

    case error.status === 404:
      console.error('[API] 资源不存在:', error.message);
      showToast('资源不存在');
      break;

    case error.status >= 500:
      console.error('[API] 服务器错误:', error.message);
      showToast('服务器繁忙，请稍后再试');
      break;

    case isTimeoutError(error):
      console.error('[API] 请求超时:', error.message);
      showToast('请求超时，请检查网络');
      break;

    default:
      console.error('[API] 其他错误:', error.message);
      showToast(error.message || '请求失败');
  }

  throw error;
}

// Toast提示函数（简单实现）
function showToast(message: string) {
  // 检查是否在浏览器环境且是否有现成的toast库
  if (typeof window !== 'undefined') {
    // 尝试使用Element Plus的ElMessage或其他toast库
    try {
      // 动态导入或使用全局变量
      if ((window as any).ElMessage) {
        (window as any).ElMessage.error(message);
        return;
      }
      if ((window as any).$message) {
        (window as any).$message.error(message);
        return;
      }
    } catch {}

    // 回退到原生alert（仅用于开发环境）
    if (import.meta.env?.DEV) {
      console.warn(`[Toast] ${message}`);
    }
  }
}

// 处理401未授权
function handleUnauthorized() {
  // 清除token
  try {
    const userData = JSON.parse(localStorage.getItem('wodi_haer_user') || '{}');
    if (userData.state) {
      userData.state.token = null;
      localStorage.setItem('wodi_haer_user', JSON.stringify(userData));
    }
  } catch {}

  // 跳转到登录页
  if (typeof window !== 'undefined') {
    // 使用路由跳转
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  }
}

// ========== 请求重试机制 ==========
async function fetchWithRetry<T>(
  url: string,
  options: RequestOptions,
  maxRetries: number
): Promise<ApiResponse<T>> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await doFetch<T>(url, options);
    } catch (error) {
      lastError = error as Error;
      
      // 只有网络错误才重试
      if (!isNetworkError(error) || attempt === maxRetries) {
        throw error;
      }
      
      // 指数退避：1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`[API] 请求失败，${delay}ms后重试 (${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// 实际的fetch请求
async function doFetch<T>(url: string, options: RequestOptions): Promise<ApiResponse<T>> {
  const { params, skipAuth = false, retryCount = 2, ...fetchOptions } = options;

  // 构建完整URL
  let fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    fullUrl += `?${searchParams.toString()}`;
  }

  // 构建Headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // 添加认证头
  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(fullUrl, {
    ...fetchOptions,
    headers,
  });

  const result: ApiResponse<T> = await response.json();

  // HTTP错误处理
  if (!response.ok) {
    throw new ApiError(
      result.message || '请求失败',
      result.code || response.status,
      response.status
    );
  }

  // 业务错误处理
  if (result.code !== 0 && result.code !== 200) {
    throw new ApiError(
      result.message || '业务异常',
      result.code,
      response.status
    );
  }

  return result;
}

// ========== 核心请求函数（增强版）==========
// 获取Token
function getToken(): string | null {
  try {
    const data = JSON.parse(localStorage.getItem('wodi_haer_user') || '{}');
    return data?.state?.token || null;
  } catch {
    return null;
  }
}

async function request<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { retryCount = 2 } = options;
  const method = options.method?.toUpperCase() || 'GET';

  // 检查网络状态和请求方法
  const isWriteOperation = ['POST', 'PUT', 'DELETE'].includes(method);
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  // 如果是写操作且网络断开，加入离线队列
  if (isWriteOperation && isOffline) {
    console.log('[API] 网络断开，请求加入离线队列:', endpoint);
    return enqueueRequest(endpoint, options);
  }

  try {
    // 使用带重试机制的fetch
    const result = await fetchWithRetry<T>(endpoint, options, retryCount);

    // 更新同步状态
    updateSyncStatus({
      lastSyncTime: new Date(),
      error: null,
    });

    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      // 错误分类处理
      return handleErrorResponse(error);
    }

    // 其他未知错误
    throw new ApiError(
      error instanceof Error ? error.message : '未知错误',
      -1,
      0
    );
  }
}

// ========== 便捷方法 ==========
export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, string | number>, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, params, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body: data ? JSON.stringify(data) : undefined }),

  put: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body: data ? JSON.stringify(data) : undefined }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  // 文件上传（保持原逻辑不变）
  upload: async <T = any>(endpoint: string, file: File, onProgress?: (percent: number) => void): Promise<ApiResponse<T>> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE_URL}${endpoint}`);

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const result = JSON.parse(xhr.responseText) as ApiResponse<T>;
          if (xhr.status >= 200 && xhr.status < 300 && (result.code === 0 || result.code === 200)) {
            resolve(result);
          } else {
            reject(new ApiError(result.message || '上传失败', result.code || xhr.status, xhr.status));
          }
        } catch {
          reject(new ApiError('解析响应失败', -1, xhr.status));
        }
      };

      xhr.onerror = () => reject(new ApiError('网络错误', -1, 0));
      xhr.ontimeout = () => reject(new ApiError('请求超时', -1, 0));

      xhr.send(formData);
    });
  },
};

export { ApiError };
export type { ApiResponse, RequestOptions };
