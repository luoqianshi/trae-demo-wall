// 控件类型
export type ControlType =
  | "input"
  | "textarea"
  | "number"
  | "select"
  | "radio"
  | "checkbox"
  | "date"
  | "time"
  | "datetime"
  | "switch"
  | "upload"
  | "table";

// 前端类型
export type FrontendType = "pc" | "mobile";

// 页面类型
export type PageType = "form" | "list";

// 控件定义
export interface Control {
  id: string;
  type: ControlType;
  field: string; // 字段名 如 userName
  label: string; // 标签 如 用户名
  placeholder?: string;
  required: boolean;
  defaultValue?: string;
  dbType: string; // VARCHAR
  javaType: string; // String
  length?: number; // 字段长度
  width?: number; // 列宽 1-24
  options?: { label: string; value: string }[]; // 下拉/单选/多选选项
}

// 项目配置
export interface ProjectConfig {
  projectName: string;
  outputPath: string;
  packageName: string; // com.example.demo
  frontendType: FrontendType;
  moduleName: string; // user
  entityName: string; // User
  tableName: string; // sys_user
  pageType: PageType;
  apiPrefix: string; // /api
}

// 控件库元数据
export interface ControlMeta {
  type: ControlType;
  name: string; // 中文名
  icon: string; // lucide 图标名
  category: "基础" | "选择" | "时间" | "高级";
  defaultJavaType: string;
  defaultDbType: string;
  defaultLength?: number;
  hasOptions?: boolean;
}

// 生成文件
export interface GeneratedFile {
  path: string; // 相对路径
  content: string;
  lang: "vue" | "java" | "xml" | "sql" | "yaml" | "typescript";
  side: "frontend" | "backend";
}

// AI 对话消息
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
