export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface OptionItem {
  label: string;
  value: string;
}
