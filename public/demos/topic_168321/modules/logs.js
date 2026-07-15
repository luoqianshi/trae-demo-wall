import { api } from "./api.js";
import { renderLogsView, setLogsPageHandler } from "./logsView.js";

let lastLogsResult = null;

setLogsPageHandler((date, event, failed, page) => {
  syncLogs(date, event, failed, page);
});

export async function syncLogs(date = "", event = "", failed = false, page = 1) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (event) params.set("event", event);
  if (failed) params.set("failed", "1");
  if (page > 1) params.set("page", String(page));
  params.set("pageSize", "50");
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const result = await api(`/api/logs${suffix}`);
  lastLogsResult = result;
  renderLogsView(result);
  return result;
}

export function exportCurrentLogs() {
  if (!lastLogsResult) {
    return null;
  }
  const exportPayload = {
    exportedAt: Date.now(),
    filters: {
      date: lastLogsResult.date || "",
      event: lastLogsResult.event || "",
      failed: Boolean(lastLogsResult.failed),
    },
    counts: lastLogsResult.counts || {},
    failureCount: Number(lastLogsResult.failureCount || 0),
    entries: lastLogsResult.entries || [],
  };
  const datePart = lastLogsResult.date || new Date().toISOString().slice(0, 10);
  const eventPart = (lastLogsResult.event || "all").replace(/[^\w.-]+/g, "_");
  const failedPart = lastLogsResult.failed ? "-failed" : "";
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `behavior-logs-${datePart}-${eventPart}${failedPart}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return exportPayload;
}
