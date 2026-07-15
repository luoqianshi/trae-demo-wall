import { appStore } from "./appStore.js";
import { authStore } from "./authStore.js";
import { renderAssetsView } from "./assetsView.js";
import { renderLogsView } from "./logsView.js";
import { renderOverviewView } from "./overviewView.js";
import { renderProjectListView } from "./projectListView.js";
import { bindStoryboardsFilters, renderStoryboardsView } from "./storyboardsView.js";
import { escapeHtml, getProjectCompleteness, getProjectStageMeta } from "./utils.js";

const PAGE_TITLES = {
  overview: "总览",
  script: "剧本",
  assets: "资产",
  storyboards: "分镜组",
  settings: "模型设置",
  batch: "视频批任务",
  logs: "行为日志",
};

export function bindNavigation() {
  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => {
      activatePage(button.dataset.page);
    });
  });
}

export function activatePage(page) {
  document.querySelectorAll(".nav-btn").forEach((node) => {
    node.classList.toggle("active", node.dataset.page === page);
  });
  document.querySelectorAll(".page").forEach((node) => {
    node.classList.toggle("active", node.id === `page-${page}`);
  });
  document.querySelectorAll("[data-topbar-page]").forEach((node) => {
    node.hidden = node.dataset.topbarPage !== page;
  });
  document.body.dataset.activePage = page;
  renderWorkspaceContext(page);
  renderPageSummaries();
}

export function renderUserSummary() {
  const { user } = authStore.getState();
  if (!user) return;
  document.getElementById("userSummary").textContent = `${user.username} · ${user.email}`;
}

export function hydrateProjectFromForm() {
  const { project } = appStore.getState();
  if (!project) return;
  project.name = document.getElementById("projectName").value.trim();
  project.idea = document.getElementById("projectIdea").value.trim();
  project.script = document.getElementById("scriptText").value;
}

export function renderProject() {
  const { project } = appStore.getState();
  if (!project) return;
  document.getElementById("projectSelect").value = project.id;
  document.getElementById("projectName").value = project.name || "";
  document.getElementById("projectIdea").value = project.idea || "";
  document.getElementById("scriptText").value = project.script || "";
  renderProjectListView();
  renderOverviewView();
  renderAssetsView();
  renderStoryboardsView();
  bindStoryboardsFilters();
  renderWorkspaceContext();
  renderPageSummaries();
  renderProjectSaveFeedback();
}

export { renderLogsView, renderPageSummaries, renderProjectSaveFeedback };

function renderWorkspaceContext(activePage = document.body.dataset.activePage || "overview") {
  const node = document.getElementById("workspaceContextMeta");
  if (!node) return;
  const { project } = appStore.getState();
  const pageTitle = PAGE_TITLES[activePage] || "工作台";
  if (!project) {
    node.textContent = `当前页面：${pageTitle}`;
    return;
  }
  const stage = getProjectStageMeta(project);
  const completeness = getProjectCompleteness(project);
  node.textContent = `当前页面：${pageTitle} · 阶段：${stage.label} · 完整度 ${completeness}%`;
}

function renderPageSummaries() {
  const { project, settings, tasks } = appStore.getState();
  if (!project) return;
  const stage = getProjectStageMeta(project);
  const completeness = getProjectCompleteness(project);
  const storyboardPromptCount = (project.storyboards || []).filter((board) => String(board.videoPrompt || "").trim()).length;
  setSummary(
    "scriptPageSummary",
    [
      ["当前阶段", stage.label],
      ["剧本状态", String(project.script || "").trim() ? "已填写" : "待生成"],
      ["完整度", `${completeness}%`],
    ],
  );
  setSummary(
    "assetsPageSummary",
    [
      ["角色", String(project.assets?.characters?.length || 0)],
      ["场景", String(project.assets?.scenes?.length || 0)],
      ["道具", String(project.assets?.props?.length || 0)],
    ],
  );
  setSummary(
    "storyboardsPageSummary",
    [
      ["分镜组", String(project.storyboards?.length || 0)],
      ["提示词", String(Number(project.videoPrompts?.length || 0) || storyboardPromptCount)],
      ["当前阶段", stage.label],
    ],
  );
  const tests = settings?.connectionTests || {};
  const passedCount = ["text", "image", "multimodal", "video"].filter((slot) => tests[slot]?.ok).length;
  setSummary(
    "settingsPageSummary",
    [
      ["配置档", String(settings?.profiles?.length || 0)],
      ["通过测试", `${passedCount}/4`],
      ["视频门禁", settings?.videoBatch?.requireVideoTest ? "已开启" : "未开启"],
    ],
  );
  const succeededCount = (tasks || []).filter((task) => task.status === "succeeded").length;
  const failedCount = (tasks || []).filter((task) => task.status === "failed").length;
  setSummary(
    "batchPageSummary",
    [
      ["历史任务", String((tasks || []).length)],
      ["成功", String(succeededCount)],
      ["失败", String(failedCount)],
    ],
  );
}

function setSummary(id, pairs) {
  const node = document.getElementById(id);
  if (!node) return;
  node.innerHTML = pairs
    .map(([label, value]) => [
      `<div class="summary-chip">`,
      `<span class="summary-chip-label">${escapeHtml(label)}</span>`,
      `<strong class="summary-chip-value">${escapeHtml(value)}</strong>`,
      `</div>`,
    ].join(""))
    .join("");
}

function renderProjectSaveFeedback() {
  const node = document.getElementById("projectSaveFeedback");
  if (!node) return;
  const { project, projectSave } = appStore.getState();
  if (!project?.id) {
    node.innerHTML = "";
    return;
  }
  const status = projectSave?.status || "idle";
  const dirty = Boolean(projectSave?.dirty);
  const message = projectSave?.message || (dirty ? "你有未保存的项目改动" : "所有修改已保存");
  const savedAtText = projectSave?.lastSavedAt
    ? new Date(projectSave.lastSavedAt).toLocaleTimeString("zh-CN")
    : "";
  const metaText = status === "saved" && savedAtText ? `最近保存 ${savedAtText}` : statusLabel(status);
  node.innerHTML = [
    `<div class="save-feedback-card save-feedback-${status}">`,
    `<span class="save-feedback-dot"></span>`,
    `<div class="save-feedback-copy">`,
    `<strong>${message}</strong>`,
    `<span>${metaText}</span>`,
    `</div>`,
    `</div>`,
  ].join("");
  setProjectSaveButtonsDisabled(status === "saving");
}

function setProjectSaveButtonsDisabled(disabled) {
  [
    "saveProjectBtn",
    "saveProjectScriptBtn",
    "saveProjectAssetsBtn",
    "saveProjectStoryboardsBtn",
  ].forEach((id) => {
    const button = document.getElementById(id);
    if (!button) return;
    button.disabled = disabled;
    if (disabled) {
      button.dataset.originalLabel = button.dataset.originalLabel || button.textContent;
      button.textContent = "保存中...";
    } else if (button.dataset.originalLabel) {
      button.textContent = button.dataset.originalLabel;
    }
  });
}

function statusLabel(status) {
  const map = {
    idle: "待编辑",
    dirty: "未保存",
    saving: "正在保存",
    saved: "已保存",
    error: "保存失败",
    conflict: "版本冲突",
  };
  return map[status] || "项目状态";
}
