import { authStore } from "./modules/authStore.js";
import { api } from "./modules/api.js";
import { logoutSession, requireSession } from "./modules/session.js";
import { showToast } from "./modules/toast.js";
import { escapeHtml, statCard } from "./modules/utils.js";

let activePage = "users";

requireSession();

boot().catch((error) => {
  console.error(error);
  showToast(error.message || "后台初始化失败。", {
    title: "初始化失败",
    tone: "error",
    duration: 4200,
  });
});

async function boot() {
  bindAdminNavigation();
  bindActions();
  await ensureAdmin();
  renderAdminUserSummary();
  document.getElementById("adminLogDate").value = new Date().toISOString().slice(0, 10);
  await refreshAdminSummary();
  await refreshActivePage();
}

function bindAdminNavigation() {
  document.querySelectorAll("[data-admin-page]").forEach((button) => {
    button.addEventListener("click", () => activateAdminPage(button.dataset.adminPage));
  });
}

function bindActions() {
  document.getElementById("adminLogoutBtn").addEventListener("click", logoutSession);
  document.getElementById("refreshAdminBtn").addEventListener("click", refreshActivePage);
  document.getElementById("adminTaskStatus").addEventListener("change", refreshTasks);
  document.getElementById("adminTaskSearch").addEventListener("change", refreshTasks);
  document.getElementById("adminTasksList").addEventListener("click", handleAdminTaskAction);
  document.getElementById("adminLogDate").addEventListener("change", refreshLogs);
  document.getElementById("adminLogUser").addEventListener("change", refreshLogs);
  document.getElementById("adminLogEvent").addEventListener("change", refreshLogs);
  document.getElementById("adminLogFailed").addEventListener("change", refreshLogs);
}

async function ensureAdmin() {
  const me = await api("/api/auth/me");
  if (me?.error || me?.detail) {
    throw new Error(me.error || me.detail);
  }
  const user = me.user;
  authStore.setUser(user);
  if ((user.role || "user") !== "admin") {
    throw new Error("当前账号不是管理员，无法访问后台。");
  }
}

function renderAdminUserSummary() {
  const { user } = authStore.getState();
  document.getElementById("adminUserSummary").textContent = `${user?.username || "-"} · ${user?.role || "user"}`;
}

function activateAdminPage(page) {
  activePage = page;
  document.querySelectorAll("[data-admin-page]").forEach((button) => {
    button.classList.toggle("active", button.dataset.adminPage === page);
  });
  document.querySelectorAll('[id^="admin-page-"]').forEach((node) => {
    node.classList.toggle("active", node.id === `admin-page-${page}`);
  });
  refreshActivePage();
}

async function refreshActivePage() {
  await refreshAdminSummary();
  if (activePage === "users") {
    await refreshUsers();
    return;
  }
  if (activePage === "tasks") {
    await refreshTasks();
    return;
  }
  await refreshLogs();
}

async function refreshAdminSummary() {
  const result = await api("/api/admin/summary");
  if (result?.error) {
    throw new Error(result.error);
  }
  const summary = result.summary || {};
  document.getElementById("adminSummaryStats").innerHTML = [
    statCard("用户数", summary.users || 0),
    statCard("管理员", summary.admins || 0),
    statCard("项目总数", summary.totalProjects || 0),
    statCard("任务总数", summary.totalTasks || 0),
    statCard("运行中任务", summary.runningTasks || 0),
    statCard("今日日志", summary.todayLogs || 0),
  ].join("");
}

async function refreshUsers() {
  const result = await api("/api/admin/users");
  if (result?.error) {
    throw new Error(result.error);
  }
  document.getElementById("adminOverviewText").textContent = "查看所有注册用户及其项目、任务、今日日志概况";
  document.getElementById("adminUsersSummary").textContent = `共 ${result.users.length} 个用户`;
  document.getElementById("adminUsersList").innerHTML = result.users
    .map(
      (user) => `
        <div class="task-entry">
          <strong>${escapeHtml(user.username)}</strong> <span class="brand-badge ${user.role === "admin" ? "brand-openrouter" : "brand-custom"}">${escapeHtml(user.role)}</span>
          <div class="muted">${escapeHtml(user.email)}</div>
          <div>用户ID：<code>${escapeHtml(user.id)}</code></div>
          <div>项目数：<code>${user.projectCount}</code> · 任务数：<code>${user.taskCount}</code> · 今日日志：<code>${user.todayLogCount}</code></div>
          <div>最近项目更新时间：<code>${user.lastProjectAt ? new Date(user.lastProjectAt).toLocaleString("zh-CN") : "-"}</code></div>
        </div>
      `,
    )
    .join("");
}

async function refreshTasks() {
  const status = document.getElementById("adminTaskStatus").value.trim();
  const search = document.getElementById("adminTaskSearch").value.trim();
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const result = await api(`/api/admin/tasks${suffix}`);
  if (result?.error) {
    throw new Error(result.error);
  }
  document.getElementById("adminOverviewText").textContent = "查看全站视频任务、状态与归属用户";
  document.getElementById("adminTasksSummary").textContent = `共 ${result.tasks.length} 条任务`;
  document.getElementById("adminTasksList").innerHTML = result.tasks.length
    ? result.tasks
        .map(
          (task) => `
            <div class="task-entry">
              <strong>${escapeHtml(task.task_type || "task")}</strong>
              <div class="muted">${escapeHtml(task.owner?.username || "-")} · ${escapeHtml(task.owner?.email || "-")}</div>
              <div>任务ID：<code>${escapeHtml(task.task_id)}</code></div>
              <div>项目ID：<code>${escapeHtml(task.project_id)}</code> · 目标索引：<code>${task.target_idx ?? "-"}</code></div>
              <div>状态：<code>${escapeHtml(task.status || "-")}</code> · 更新时间：<code>${task.updated_at ? new Date(task.updated_at).toLocaleString("zh-CN") : "-"}</code></div>
              <div>重试次数：<code>${Number(task.retry_count || 0)}</code></div>
              <div>失败原因：<code>${escapeHtml(task.extra?.failureReason || task.error_msg || "-")}</code></div>
              <details class="task-details">
                <summary>任务详情</summary>
                <div class="task-detail-grid">
                  <div>retry_count：<code>${Number(task.retry_count || 0)}</code></div>
                  <div>failureReason：<code>${escapeHtml(task.extra?.failureReason || "-")}</code></div>
                  <div>archivedFailures：</div>
                  <pre>${escapeHtml(JSON.stringify(task.extra?.archivedFailures || [], null, 2))}</pre>
                </div>
              </details>
              <div class="topbar-actions">
                <button class="ghost-btn task-action-btn" data-action="retry" data-task-id="${escapeHtml(task.task_id)}" ${canRetryTask(task) ? "" : "disabled"}>重试</button>
                <button class="ghost-btn task-action-btn" data-action="cancel" data-task-id="${escapeHtml(task.task_id)}" ${canCancelTask(task) ? "" : "disabled"}>取消</button>
              </div>
            </div>
          `,
        )
        .join("")
    : '<div class="empty-state"><strong>没有匹配任务</strong><div class="muted">可以尝试清空状态过滤或搜索词。</div></div>';
}

async function refreshLogs() {
  const date = document.getElementById("adminLogDate").value;
  const userId = document.getElementById("adminLogUser").value;
  const event = document.getElementById("adminLogEvent").value.trim();
  const failed = document.getElementById("adminLogFailed").checked;
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (userId) params.set("userId", userId);
  if (event) params.set("event", event);
  if (failed) params.set("failed", "1");
  const result = await api(`/api/admin/logs?${params.toString()}`);
  if (result?.error) {
    throw new Error(result.error);
  }
  document.getElementById("adminOverviewText").textContent = "跨用户检索行为日志，可按日期、用户、事件和失败状态筛选";
  hydrateAdminLogUsers(result.users || []);
  document.getElementById("adminLogsSummary").textContent = `共 ${result.total || 0} 条日志${result.failed ? " · 仅失败事件" : ""}`;
  document.getElementById("adminLogsList").innerHTML = result.entries.length
    ? result.entries
        .map(
          (entry) => `
            <div class="log-entry">
              <strong>${escapeHtml(entry.event)}</strong>
              <div class="muted">${escapeHtml(entry.owner?.username || "-")} · ${new Date(entry.ts).toLocaleString("zh-CN")}</div>
              <div>用户：<code>${escapeHtml(entry.owner?.userId || entry.userId || "-")}</code></div>
              <pre>${escapeHtml(JSON.stringify(entry.meta || {}, null, 2))}</pre>
            </div>
          `,
        )
        .join("")
    : '<div class="empty-state"><strong>没有匹配日志</strong><div class="muted">可以切换到全部用户、清空事件筛选，或者关闭“仅失败事件”。</div></div>';
}

function hydrateAdminLogUsers(users) {
  const select = document.getElementById("adminLogUser");
  const current = select.value;
  select.innerHTML = [
    '<option value="">全部用户</option>',
    ...users.map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.username)} (${escapeHtml(user.id)})</option>`),
  ].join("");
  if (current) {
    select.value = current;
  }
}

async function handleAdminTaskAction(event) {
  const button = event.target.closest(".task-action-btn");
  if (!button) return;
  const taskId = button.dataset.taskId;
  const action = button.dataset.action;
  if (!taskId || !action) return;
  button.disabled = true;
  try {
    const endpoint = `/api/tasks/${encodeURIComponent(taskId)}/${action}`;
    const result = await api(endpoint, {
      method: "POST",
      body: JSON.stringify({
        reason: action === "cancel" ? "admin manual stop" : "admin retry",
      }),
    });
    if (result?.error) {
      throw new Error(result.error);
    }
    showToast(`任务 ${taskId} 已${action === "retry" ? "重试" : "取消"}。`, {
      title: "操作成功",
      tone: "success",
    });
    await refreshAdminSummary();
    await refreshTasks();
  } catch (error) {
    showToast(error.message || "任务操作失败。", {
      title: "操作失败",
      tone: "error",
      duration: 4200,
    });
  } finally {
    button.disabled = false;
  }
}

function canRetryTask(task) {
  return ["failed", "cancelled"].includes(String(task.status || ""));
}

function canCancelTask(task) {
  return !["succeeded", "done", "completed", "cancelled"].includes(String(task.status || ""));
}
