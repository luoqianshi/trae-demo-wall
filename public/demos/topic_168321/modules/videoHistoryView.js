import { appStore } from "./appStore.js";
import { renderPageSummaries } from "./ui.js";
import { escapeHtml } from "./utils.js";

export function renderVideoHistoryView() {
  const { tasks } = appStore.getState();
  const root = document.getElementById("recentTasks");
  root.innerHTML = tasks.length
    ? tasks
        .slice(0, 8)
        .map(
          (task) => `
            <div class="task-entry data-card data-card-compact">
              <div class="data-card-head">
                <strong>${escapeHtml(task.task_id)}</strong>
                <span class="status-badge status-badge-${escapeHtml(task.status || "pending")}">${escapeHtml(task.status || "-")}</span>
              </div>
              <div class="muted">分镜 ${escapeHtml(String(task.target_idx ?? "-"))} · 更新时间 ${new Date(task.updated_at || task.created_at || Date.now()).toLocaleString("zh-CN")}</div>
              <div class="muted">Adapter: ${escapeHtml(task.extra?.videoModel || "-")} · Provider Status: ${escapeHtml(task.extra?.providerStatus || "-")}</div>
              <div class="muted">Provider Task: ${escapeHtml(task.extra?.providerTaskId || "-")}</div>
              <div class="muted">Submit Path: ${escapeHtml(task.extra?.providerSubmitPath || "-")}</div>
              <div class="muted">Poll Path: ${escapeHtml(task.extra?.providerPollPath || "-")}</div>
              ${task.error_msg ? `<div class="muted">失败原因：${escapeHtml(task.error_msg)}</div>` : ""}
              <div class="topbar-actions">
                <button class="ghost-btn" type="button" data-task-debug-id="${escapeHtml(task.task_id)}">查看调试详情</button>
                ${task.result_url ? `<a class="ghost-btn" href="${escapeHtml(task.result_url)}" target="_blank" rel="noreferrer">打开结果视频</a>` : ""}
              </div>
            </div>
          `,
        )
        .join("")
    : [
        `<div class="empty-state">`,
        `<strong>暂无任务历史</strong>`,
        `<div class="muted">批任务开始执行后，这里会展示最近的视频任务状态。</div>`,
        `<div class="empty-state-actions">`,
        `<button class="ghost-btn" type="button" data-go-page="settings">检查模型配置</button>`,
        `<button class="primary-btn" type="button" data-go-page="batch">前往批任务页</button>`,
        `</div>`,
        `</div>`,
      ].join("");
  renderPageSummaries();
}
