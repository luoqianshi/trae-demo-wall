// ========== 任务相关类型 ==========
export interface Task {
  id: number;
  title: string;
  description: string;
  category: 'science' | 'nature' | 'creative' | 'programming' | 'humanities' | 'life' | 'other';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  requirements: string;
  reference_materials: string;
  cover_image: string;
  grade_level: string;
  estimated_time: string;
  steps_json: string;
  steps?: Step[];
  ai_video_url: string;
  ai_video?: string;
  external_video_url: string;
  external_video?: string;
  demo_html: string;
  display_order: number;
  status: 'draft' | 'published' | 'archived';
  created_by: number | null;
  creator_name: string | null;
  submission_count: number;
  created_at: string;
  updated_at: string;
}

export interface Step {
  step: number;
  title: string;
  content: string;
  image_prompt?: string;
}

export interface TaskListResponse {
  list: Task[];
  total: number;
  page: number;
  pageSize: number;
}

// ========== 用户相关类型 ==========
export interface User {
  userId: number;
  username: string;
  realName: string;
  role: 'student' | 'teacher' | 'institution_admin' | 'platform_admin';
  phone: string;
  email: string;
  avatar: string;
  institutionId: number | null;
  token: string;
}

// ========== 提交相关类型 ==========
export interface Submission {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  file_urls: string[];
  status: 'draft' | 'submitted' | 'evaluated';
  score: number | null;
  feedback: string;
  evaluator_id: number | null;
  submitted_at: string;
  evaluated_at: string | null;
  task_title?: string;
  category?: string;
  difficulty?: string;
  student_name?: string;
  student_username?: string;
}

export interface SubmissionListResponse {
  list: Submission[];
  total: number;
  page: number;
  pageSize: number;
}

// ========== API 通用响应 ==========
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message?: string;
}

// ========== 学习进度 ==========
export interface TaskProgress {
  id: number;
  user_id: number;
  task_id: number;
  current_step: number;
  total_steps: number;
  completed: number;  // 0=学习中 1=已完成
  started_at: string;
  updated_at: string;
  task_title?: string;
  category?: string;
  cover_image?: string;
}