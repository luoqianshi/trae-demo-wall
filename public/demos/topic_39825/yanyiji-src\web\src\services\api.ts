import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || '请求失败';
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  },
);

export interface RecognizeResponse {
  task_id: string;
  latex: string;
  confidence: number;
  processing_time_ms: number;
  validation: {
    is_valid: boolean;
    errors: string[];
    formatted: string;
  };
}

export interface BatchRecognizeResponse {
  task_id: string;
  results: RecognizeResponse[];
  total_count: number;
}

export interface FormulaItem {
  id: string;
  latex_code: string;
  source_paper_title: string | null;
  source_paper_url: string | null;
  tags: string[];
  category: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// 识别 API
export async function recognizeImage(file: File): Promise<RecognizeResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<RecognizeResponse>('/recognize', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function recognizeBatch(files: File[]): Promise<BatchRecognizeResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const response = await api.post<BatchRecognizeResponse>('/recognize/batch', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function validateLatex(latex: string) {
  const response = await api.post('/recognize/validate', { latex });
  return response.data;
}

// 文档识别 API
export interface DocumentRecognizeResponse {
  task_id: string;
  document_name: string;
  results: RecognizeResponse[];
  total_count: number;
  result_images?: string[];   // 每个结果对应的原始图片 base64
}

export async function recognizeDocument(file: File): Promise<DocumentRecognizeResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<DocumentRecognizeResponse>('/recognize/document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5分钟超时，文档可能较大
  });
  return response.data;
}

// 重新识别 API（传入 base64 图片）
export async function reRecognizeImage(imageBase64: string): Promise<RecognizeResponse> {
  const response = await api.post<RecognizeResponse>('/recognize/rerender', {
    image_base64: imageBase64,
    auto_fix: true,
  }, { timeout: 120000 });
  return response.data;
}

// 公式库 API
export async function getFormulas(params?: {
  page?: number;
  page_size?: number;
  tag?: string;
  category?: string;
  search?: string;
}): Promise<FormulaItem[]> {
  const response = await api.get<FormulaItem[]>('/formulas', { params });
  return response.data;
}

export async function getFormula(id: string): Promise<FormulaItem> {
  const response = await api.get<FormulaItem>(`/formulas/${id}`);
  return response.data;
}

export async function createFormula(data: {
  latex_code: string;
  source_paper_title?: string;
  source_paper_url?: string;
  tags?: string[];
  category?: string;
  notes?: string;
}): Promise<FormulaItem> {
  const response = await api.post<FormulaItem>('/formulas', data);
  return response.data;
}

export async function updateFormula(id: string, data: Partial<FormulaItem>): Promise<FormulaItem> {
  const response = await api.put<FormulaItem>(`/formulas/${id}`, data);
  return response.data;
}

export async function deleteFormula(id: string): Promise<void> {
  await api.delete(`/formulas/${id}`);
}

// 批量保存公式
export async function saveFormulasBatch(data: {
  formulas: Array<{
    latex_code: string;
    confidence?: number;
  }>;
  source_paper_title: string;
  tags?: string[];
  category?: string;
}): Promise<{ count: number }> {
  const response = await api.post<{ count: number }>('/formulas/batch', data);
  return response.data;
}

// 系统 API
export async function getQuota() {
  const response = await api.get('/quota');
  return response.data;
}

export async function healthCheck() {
  const response = await api.get('/../health');
  return response.data;
}