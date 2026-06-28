export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  trace_id?: string | null;
  pagination?: {
    total: number;
    page: number;
    page_size: number;
  } | null;
}
