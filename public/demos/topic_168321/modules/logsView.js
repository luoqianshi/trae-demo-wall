import { escapeHtml } from “./utils.js”;

let onPageChange = null;

export function setLogsPageHandler(handler) {
  onPageChange = handler;
}

const EVENT_LABELS = {
  “auth.login”: “登录成功”,
  “auth.login.failed”: “登录失败”,
  “auth.register”: “注册”,
  “settings.save”: “保存设置”,
  “settings.test”: “连通测试”,
  “project.list”: “项目列表”,
  “project.create”: “创建项目”,
  “project.open”: “打开项目”,
  “project.save”: “保存项目”,
  “project.delete”: “删除项目”,
  “script.generate.done”: “剧本生成成功”,
  “script.generate.failed”: “剧本生成失败”,
  “assets.extract.done”: “资产抽取成功”,
  “assets.extract.failed”: “资产抽取失败”,
  “storyboard.image.generated”: “参考图生成成功”,
  “storyboard.image.failed”: “参考图生成失败”,
  “storyboard.images.batch”: “批量参考图”,
  “video.provider.preview”: “视频预览”,
  “video.provider.preview.failed”: “视频预览失败”,
  “video.batch.start”: “批任务启动”,
  “video.task.started”: “视频任务启动”,
  “video.task.completed”: “视频任务完成”,
  “video.task.failed”: “视频任务失败”,
  “video.task.retry”: “视频任务重试”,
  “video.task.cancelled”: “视频任务取消”,
  “task.register”: “任务注册”,
  “task.status.update”: “任务状态更新”,
};

function eventLabel(event) {
  return EVENT_LABELS[event] || event;
}

function renderMetaSummary(entry) {
  const m = entry.meta || {};
  const parts = [];
  if (m.slot) parts.push(`槽位: ${m.slot}`);
  if (m.provider) parts.push(m.provider);
  if (m.model) parts.push(m.model);
  if (m.projectId) parts.push(`项目: ${m.projectId.slice(-6)}`);
  if (m.storyboardIdx !== undefined) parts.push(`分镜: ${m.storyboardIdx + 1}`);
  if (m.username) parts.push(`用户: ${m.username}`);
  if (m.login) parts.push(`尝试: ${m.login}`);
  if (m.shotCount !== undefined) parts.push(`${m.shotCount} 个镜头`);
  if (m.adapter) parts.push(m.adapter);
  if (m.ok === true) parts.push(“✓ 成功”);
  if (m.ok === false) parts.push(“✗ 失败”);
  if (m.error) parts.push(m.error);
  if (m.strategy) parts.push(m.strategy);
  return parts.length ? escapeHtml(parts.join(“ · “)) : “”;
}

export function renderLogsView(result) {
  const select = document.getElementById(“logDateSelect”);
  select.innerHTML = (result.dates || [])
    .map((date) => `<option value=”${escapeHtml(date)}”>${escapeHtml(date)}</option>`)
    .join(“”);
  if (result.date) {
    select.value = result.date;
  }
  const eventInput = document.getElementById(“logEventFilter”);
  if (eventInput && typeof result.event === “string”) {
    eventInput.value = result.event;
  }
  document.querySelectorAll(“#logEventChips .chip-btn”).forEach((chip) => {
    const chipFailed = chip.dataset.failed === “1”;
    chip.classList.toggle(
      “active”,
      chip.dataset.event === (result.event || “”) && chipFailed === Boolean(result.failed),
    );
    const label = chip.dataset.label || chip.textContent;
    chip.dataset.label = label;
    const key = chip.dataset.event || “”;
    let count = key
      ? Object.entries(result.counts || {}).reduce((sum, [eventName, value]) => sum + (eventName.includes(key) ? Number(value) : 0), 0)
      : Object.values(result.counts || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    if (chipFailed) {
      count = key ? count : Number(result.failureCount || 0);
    }
    chip.textContent = `${label} (${count})`;
  });
  document.getElementById(“logRoot”).innerHTML = `目录：<code>${escapeHtml(result.root || “-”)}</code>`;
  const summary = document.getElementById(“logsSummary”);
  if (summary) {
    const total = result.total || result.entries?.length || 0;
    const pageInfo = result.totalPages > 1 ? ` · 第 ${result.page}/${result.totalPages} 页` : “”;
    summary.textContent = `共 ${total} 条事件${pageInfo}${result.event ? ` · 事件：${result.event}` : “”}${result.failed ? “ · 仅失败事件” : “”}`;
  }
  const pageSummary = document.getElementById(“logsPageSummary”);
  if (pageSummary) {
    pageSummary.innerHTML = [
      renderSummaryChip(“日志总数”, String(result.total || result.entries?.length || 0)),
      renderSummaryChip(“失败事件”, String(result.failureCount || 0)),
      renderSummaryChip(“筛选”, result.event || (result.failed ? “仅失败事件” : “全部”)),
    ].join(“”);
  }
  const failureAggregation = document.getElementById(“logsFailureAggregation”);
  if (failureAggregation) {
    failureAggregation.innerHTML = renderFailureAggregation(result);
  }
  const emptyHint =
    result.failed && !(result.entries || []).length
      ? `
        <div class=”empty-state”>
          <strong>今天还没有失败事件</strong>
          <div class=”muted”>这是一个好信号。你可以切回”全部”查看完整行为流，或先在”模型设置”里运行一次测试连接，观察 <code>settings.test</code> 事件。</div>
        </div>
      `
      : `
        <div class=”empty-state”>
          <strong>当前日期没有日志</strong>
          <div class=”muted”>可以切换日期、调整事件筛选，或先在其他页面执行一次操作后再回来查看。</div>
        </div>
      `;
  document.getElementById(“logsList”).innerHTML = (result.entries || []).length
    ? result.entries
        .slice()
        .reverse()
        .map((entry) => renderLogEntry(entry))
        .join(“”)
    : emptyHint;
  const pagination = document.getElementById("logsPagination");
  if (pagination) {
    pagination.innerHTML = renderPagination(result);
    pagination.querySelectorAll("[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (onPageChange) onPageChange(result.date, result.event || "", Boolean(result.failed), Number(btn.dataset.page));
      });
    });
  }
}

function renderPagination(result) {
  const { page = 1, totalPages = 1, total = 0 } = result;
  if (totalPages <= 1) return "";
  const buttons = [];
  if (page > 1) {
    buttons.push(`<button class="ghost-btn pagination-btn" data-page="${page - 1}">上一页</button>`);
  }
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  if (start > 1) {
    buttons.push(`<button class="ghost-btn pagination-btn" data-page="1">1</button>`);
    if (start > 2) buttons.push(`<span class="pagination-ellipsis">…</span>`);
  }
  for (let i = start; i <= end; i++) {
    const active = i === page ? " pagination-btn-active" : "";
    buttons.push(`<button class="ghost-btn pagination-btn${active}" data-page="${i}">${i}</button>`);
  }
  if (end < totalPages) {
    if (end < totalPages - 1) buttons.push(`<span class="pagination-ellipsis">…</span>`);
    buttons.push(`<button class="ghost-btn pagination-btn" data-page="${totalPages}">${totalPages}</button>`);
  }
  if (page < totalPages) {
    buttons.push(`<button class="ghost-btn pagination-btn" data-page="${page + 1}">下一页</button>`);
  }
  return `<div class="pagination-row">${buttons.join("")}<span class="muted pagination-info">共 ${total} 条</span></div>`;
}

function renderLogEntry(entry) {
  const isFail = isFailureEntry(entry);
  const failClass = isFail ? “ log-entry-failed” : “”;
  const badge = isFail
    ? `<span class=”status-badge status-badge-failed”>失败</span>`
    : “”;
  const metaLine = renderMetaSummary(entry);
  const metaHtml = metaLine ? `<div class=”log-entry-meta”>${metaLine}</div>` : “”;
  return `
    <details class=”log-entry data-card${failClass}”>
      <summary class=”data-card-head”>
        <strong>${escapeHtml(eventLabel(entry.event))}</strong>
        <code class=”log-event-code”>${escapeHtml(entry.event)}</code>
        ${badge}
        <span class=”page-pill”>${new Date(entry.ts).toLocaleTimeString(“zh-CN”)}</span>
      </summary>
      ${metaHtml}
      <pre class=”log-entry-raw”>${escapeHtml(JSON.stringify(entry.meta || {}, null, 2))}</pre>
    </details>
  `;
}

function renderSummaryChip(label, value) {
  return [
    `<div class=”summary-chip”>`,
    `<span class=”summary-chip-label”>${escapeHtml(label)}</span>`,
    `<strong class=”summary-chip-value”>${escapeHtml(value)}</strong>`,
    `</div>`,
  ].join(“”);
}

function renderFailureAggregation(result) {
  const groups = new Map();
  (result.entries || []).forEach((entry) => {
    if (!isFailureEntry(entry)) return;
    const key = String(entry.event || “unknown”);
    const current = groups.get(key) || {
      event: key,
      count: 0,
      latestTs: 0,
      latestMessage: “”,
    };
    current.count += 1;
    current.latestTs = Math.max(current.latestTs, Number(entry.ts || 0));
    current.latestMessage = pickFailureMessage(entry) || current.latestMessage;
    groups.set(key, current);
  });
  const items = Array.from(groups.values()).sort((a, b) => b.count - a.count || b.latestTs - a.latestTs);
  if (!items.length) {
    return [
      `<div class=”task-entry logs-failure-empty”>`,
      `<strong>失败事件聚合</strong>`,
      `<div class=”muted”>当前筛选范围内没有失败事件，排查面板保持干净。</div>`,
      `</div>`,
    ].join(“”);
  }
  return items
    .map((item) => [
      `<article class=”task-entry logs-failure-card”>`,
      `<div class=”data-card-head”>`,
      `<strong>${escapeHtml(eventLabel(item.event))}</strong>`,
      `<code class=”log-event-code”>${escapeHtml(item.event)}</code>`,
      `<span class=”status-badge status-badge-failed”>失败 ${escapeHtml(String(item.count))} 次</span>`,
      `</div>`,
      `<div class=”muted”>最近一次：${escapeHtml(new Date(item.latestTs).toLocaleString(“zh-CN”))}</div>`,
      `<div>${escapeHtml(item.latestMessage || “请展开下方原始日志查看 meta 详情。”)}</div>`,
      `</article>`,
    ].join(“”))
    .join(“”);
}

function isFailureEntry(entry) {
  const eventName = String(entry?.event || “”).toLowerCase();
  if (eventName.includes(“failed”) || eventName.includes(“error”) || eventName.includes(“timeout”)) {
    return true;
  }
  const status = String(entry?.meta?.status || “”).toLowerCase();
  if (status === “failed” || status === “error” || status === “timeout”) {
    return true;
  }
  return entry?.meta?.ok === false;
}

function pickFailureMessage(entry) {
  return String(
    entry?.meta?.error
    || entry?.meta?.message
    || entry?.meta?.detail
    || entry?.meta?.reason
    || (entry?.meta?.ok === false ? “执行结果为失败” : “”),
  ).trim();
}
