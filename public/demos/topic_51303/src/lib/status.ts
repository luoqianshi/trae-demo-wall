import type { MetricStatus } from "@/types";

/** 状态 → 颜色变量映射（用于内联 style） */
export const statusColorVar: Record<MetricStatus, string> = {
  normal: "var(--state-success)",
  warning: "var(--state-warning)",
  danger: "var(--state-error)",
  offline: "var(--color-text-muted)",
};

export const statusBgVar: Record<MetricStatus, string> = {
  normal: "var(--state-success-light)",
  warning: "var(--state-warning-light)",
  danger: "var(--state-error-light)",
  offline: "var(--color-bg-deep)",
};

export const statusText: Record<MetricStatus, string> = {
  normal: "正常",
  warning: "警告",
  danger: "危险",
  offline: "离线",
};

/** 告警等级颜色 */
export const levelColorVar: Record<"warning" | "danger", string> = {
  warning: "var(--state-warning)",
  danger: "var(--state-error)",
};

export const levelBgVar: Record<"warning" | "danger", string> = {
  warning: "var(--state-warning-light)",
  danger: "var(--state-error-light)",
};

/** 格式化日期为 MM-DD */
export function fmtMD(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.slice(5, 10);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}-${day}`;
}

/** 格式化为 HH:mm */
export function fmtHM(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 相对时间描述 */
export function relTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 天前`;
  return fmtMD(dateStr);
}
