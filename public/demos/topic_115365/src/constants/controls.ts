import type { ControlMeta, ControlType } from "@/types";

// 控件库元数据
export const CONTROL_LIBRARY: ControlMeta[] = [
  { type: "input", name: "输入框", icon: "Type", category: "基础", defaultJavaType: "String", defaultDbType: "VARCHAR", defaultLength: 255 },
  { type: "textarea", name: "文本域", icon: "AlignLeft", category: "基础", defaultJavaType: "String", defaultDbType: "TEXT" },
  { type: "number", name: "数字", icon: "Hash", category: "基础", defaultJavaType: "Integer", defaultDbType: "INT" },
  { type: "switch", name: "开关", icon: "ToggleRight", category: "基础", defaultJavaType: "Integer", defaultDbType: "TINYINT", defaultLength: 1 },
  { type: "select", name: "下拉选择", icon: "ChevronDownSquare", category: "选择", defaultJavaType: "String", defaultDbType: "VARCHAR", defaultLength: 64, hasOptions: true },
  { type: "radio", name: "单选", icon: "CircleDot", category: "选择", defaultJavaType: "String", defaultDbType: "VARCHAR", defaultLength: 64, hasOptions: true },
  { type: "checkbox", name: "多选", icon: "CheckSquare", category: "选择", defaultJavaType: "String", defaultDbType: "VARCHAR", defaultLength: 255, hasOptions: true },
  { type: "date", name: "日期", icon: "Calendar", category: "时间", defaultJavaType: "LocalDate", defaultDbType: "DATE" },
  { type: "time", name: "时间", icon: "Clock", category: "时间", defaultJavaType: "LocalTime", defaultDbType: "TIME" },
  { type: "datetime", name: "日期时间", icon: "CalendarClock", category: "时间", defaultJavaType: "LocalDateTime", defaultDbType: "DATETIME" },
  { type: "upload", name: "附件上传", icon: "Paperclip", category: "高级", defaultJavaType: "String", defaultDbType: "VARCHAR", defaultLength: 500 },
  { type: "table", name: "表格", icon: "Table", category: "高级", defaultJavaType: "String", defaultDbType: "VARCHAR", defaultLength: 255 },
];

// 控件类型 -> 中文映射
export const CONTROL_NAME_MAP: Record<ControlType, string> = {
  input: "输入框",
  textarea: "文本域",
  number: "数字",
  select: "下拉选择",
  radio: "单选",
  checkbox: "多选",
  date: "日期",
  time: "时间",
  datetime: "日期时间",
  switch: "开关",
  upload: "附件上传",
  table: "表格",
};

// 默认项目配置
export const DEFAULT_PROJECT_CONFIG = {
  projectName: "demo",
  outputPath: "/output",
  packageName: "com.example.demo",
  frontendType: "pc" as const,
  moduleName: "user",
  entityName: "User",
  tableName: "sys_user",
  pageType: "form" as const,
  apiPrefix: "/api",
};

// 创建新控件的工厂
export function createControl(type: ControlType, index: number): import("@/types").Control {
  const meta = CONTROL_LIBRARY.find((c) => c.type === type)!;
  const fieldSuffix = type === "table" ? "list" : "";
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    field: `field${index}${fieldSuffix}`,
    label: `${meta.name}${index}`,
    placeholder: `请输入${meta.name}`,
    required: false,
    defaultValue: "",
    dbType: meta.defaultDbType,
    javaType: meta.defaultJavaType,
    length: meta.defaultLength,
    width: 24,
    options: meta.hasOptions
      ? [
          { label: "选项一", value: "1" },
          { label: "选项二", value: "2" },
        ]
      : undefined,
  };
}
