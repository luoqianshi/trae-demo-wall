export function formatClock(timestamp) {
  if (!timestamp) {
    return "--";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

export function formatDuration(start, end) {
  if (!start || !end || end <= start) {
    return "--";
  }
  return `${((end - start) / 1000).toFixed(1)}s`;
}

export function textDirection(lang) {
  return lang === "ar" ? "rtl" : "ltr";
}
