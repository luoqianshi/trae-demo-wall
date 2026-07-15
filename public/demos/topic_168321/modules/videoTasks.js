import { api } from "./api.js";
import { appStore } from "./appStore.js";
import { loadProject } from "./project.js";
import { canStartVideoBatch, readSettingsFromDom } from "./settings.js";
import { attachBatchStream } from "./taskCenter.js";
import { pushTaskFeedEntry } from "./taskFeedView.js";
import { escapeHtml } from "./utils.js";

function buildBatchPayload() {
  const { project, settings } = appStore.getState();
  return {
    batchType: "videos",
    projectId: project.id,
    storyboardIndices: project.storyboards.map((_, idx) => idx),
    options: {
      quality: settings.videoBatch.videoQuality,
      videoModel: settings.videoBatch.videoModel,
      ratio: settings.videoBatch.videoRatio,
      genAudio: settings.videoBatch.genAudio,
      watermark: settings.videoBatch.watermark,
    },
  };
}

function renderBatchPreview(preview) {
  const panel = document.getElementById("batchPreviewPanel");
  const meta = document.getElementById("batchPreviewMeta");
  const body = document.getElementById("batchPreviewBody");
  if (!panel || !meta || !body) return;
  panel.hidden = false;
  meta.innerHTML = [
    `Adapter: <code>${escapeHtml(preview.adapter || "-")}</code>`,
    `Model: <code>${escapeHtml(preview.model || "-")}</code>`,
    `Auth: <code>${escapeHtml(preview.authMode || "-")}</code>`,
    `Submit: <code>${escapeHtml(preview.submitPath || "-")}</code>`,
    `Poll: <code>${escapeHtml(preview.pollPathExample || "-")}</code>`,
  ].join(" · ");
  body.textContent = JSON.stringify(preview.requestPreview || {}, null, 2);
}

function renderTaskDebugDetail(payload) {
  const panel = document.getElementById("taskDebugPanel");
  const meta = document.getElementById("taskDebugMeta");
  const body = document.getElementById("taskDebugBody");
  if (!panel || !meta || !body) return;
  const task = payload?.task || {};
  const debug = payload?.debug || {};
  panel.hidden = false;
  meta.innerHTML = [
    `Task: <code>${escapeHtml(task.task_id || "-")}</code>`,
    `Status: <code>${escapeHtml(task.status || "-")}</code>`,
    `Adapter: <code>${escapeHtml(debug.adapter || "-")}</code>`,
    `Provider Task: <code>${escapeHtml(debug.providerTaskId || "-")}</code>`,
    `Provider Status: <code>${escapeHtml(debug.providerStatus || "-")}</code>`,
  ].join(" · ");
  body.textContent = JSON.stringify({
    submitPath: debug.submitPath || "",
    pollPath: debug.pollPath || "",
    submitRequest: debug.submitRequest || null,
    lastResponse: debug.lastResponse || null,
    task,
  }, null, 2);
}

export async function previewBatchRequest() {
  const { project } = appStore.getState();
  if (!project?.storyboards?.length) {
    throw new Error("请先准备至少一个分镜组。");
  }
  readSettingsFromDom();
  const { settings } = appStore.getState();
  const storyboardIdx = project.storyboards.findIndex((board) => String(board?.videoPrompt || "").trim());
  const targetIdx = storyboardIdx >= 0 ? storyboardIdx : 0;
  const result = await api("/api/video/provider-preview", {
    method: "POST",
    body: JSON.stringify({
      projectId: project.id,
      storyboardIdx: targetIdx,
      options: {
        quality: settings.videoBatch.videoQuality,
        videoModel: settings.videoBatch.videoModel,
        ratio: settings.videoBatch.videoRatio,
        genAudio: settings.videoBatch.genAudio,
        watermark: settings.videoBatch.watermark,
      },
    }),
  });
  renderBatchPreview(result);
  pushTaskFeedEntry(`已预览分镜 ${targetIdx + 1} 的 Provider 请求：${result.adapter} / ${result.submitPath}`, "running");
  return result;
}

export async function inspectLatestTaskDebug() {
  const { project } = appStore.getState();
  if (!project?.id) {
    throw new Error("当前没有已打开的项目。");
  }
  let { tasks } = appStore.getState();
  if (!Array.isArray(tasks) || tasks.length === 0) {
    tasks = await api(`/api/tasks/video-by-project?projectId=${encodeURIComponent(project.id)}`);
    appStore.setTasks(tasks);
  }
  const projectTasks = (tasks || [])
    .filter((task) => task.project_id === project?.id && task.task_type === "video")
    .sort((a, b) => Number(b.updated_at || b.created_at || 0) - Number(a.updated_at || a.created_at || 0));
  const latestTask = projectTasks[0];
  if (!latestTask?.task_id) {
    throw new Error("当前项目还没有可查看的任务记录。");
  }
  return inspectTaskDebug(latestTask.task_id);
}

export async function inspectTaskDebug(taskId) {
  const safeTaskId = String(taskId || "").trim();
  if (!safeTaskId) {
    throw new Error("缺少任务 ID。");
  }
  const result = await api(`/api/tasks/${encodeURIComponent(safeTaskId)}`);
  renderTaskDebugDetail(result);
  pushTaskFeedEntry(`已载入任务 ${safeTaskId} 的调试详情`, "running");
  return result;
}

export async function startBatch() {
  const { project } = appStore.getState();
  if (!project?.storyboards?.length) {
    throw new Error("请先准备分镜组。");
  }
  readSettingsFromDom();
  const gate = canStartVideoBatch();
  if (!gate.ok) {
    throw new Error(gate.reason);
  }
  const result = await api("/api/batch/start", {
    method: "POST",
    body: JSON.stringify(buildBatchPayload()),
  });
  if (result.error) {
    throw new Error(result.error);
  }
  attachBatchStream(result.batchId, {
    async onTaskCompletedRefresh() {
      await loadProject(appStore.getState().project.id);
    },
  });
  return result;
}
