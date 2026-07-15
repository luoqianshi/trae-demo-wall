import { exportCurrentLogs, syncLogs } from "./logs.js";
import { deleteProject, saveProject } from "./project.js";
import { saveSettings } from "./settings.js";
import { showToast } from "./toast.js";
import { inspectLatestTaskDebug, inspectTaskDebug, previewBatchRequest, startBatch } from "./videoTasks.js";
import { generateVideoPrompts } from "./videoPrompts.js";

export async function saveProjectAction() {
  return saveProject();
}

export async function deleteProjectAction() {
  try {
    const result = await deleteProject();
    showToast("项目已删除，列表和当前视图已经更新。", {
      title: "删除成功",
      tone: "success",
    });
    return result;
  } catch (error) {
    showToast(error.message || "项目删除失败。", {
      title: "删除失败",
      tone: "error",
      duration: 4200,
    });
    return null;
  }
}

export async function startBatchAction() {
  try {
    const result = await startBatch();
    showToast("视频批任务已经启动，任务流会持续刷新。", {
      title: "启动成功",
      tone: "success",
    });
    return result;
  } catch (error) {
    showToast(error.message || "视频批任务启动失败，请稍后重试。", {
      title: "启动失败",
      tone: "error",
      duration: 4200,
    });
    return null;
  }
}

export async function previewBatchRequestAction() {
  try {
    const result = await previewBatchRequest();
    showToast(`已生成 ${result.adapter} 的请求预览，可以先检查再启动批任务。`, {
      title: "预览成功",
      tone: "success",
    });
    return result;
  } catch (error) {
    showToast(error.message || "请求预览失败，请稍后重试。", {
      title: "预览失败",
      tone: "error",
      duration: 4200,
    });
    return null;
  }
}

export async function inspectLatestTaskDebugAction() {
  try {
    const result = await inspectLatestTaskDebug();
    showToast(`已读取任务 ${result?.task?.task_id || ""} 的调试详情。`, {
      title: "调试详情已加载",
      tone: "success",
    });
    return result;
  } catch (error) {
    showToast(error.message || "读取任务调试详情失败。", {
      title: "读取失败",
      tone: "error",
      duration: 4200,
    });
    return null;
  }
}

export async function inspectTaskDebugAction(taskId) {
  try {
    const result = await inspectTaskDebug(taskId);
    showToast(`已读取任务 ${result?.task?.task_id || ""} 的调试详情。`, {
      title: "调试详情已加载",
      tone: "success",
    });
    return result;
  } catch (error) {
    showToast(error.message || "读取任务调试详情失败。", {
      title: "读取失败",
      tone: "error",
      duration: 4200,
    });
    return null;
  }
}

export async function syncLogsAction(date = "", event = "", failed = false, page = 1) {
  return syncLogs(date, event, failed, page);
}

export function generateVideoPromptsAction() {
  return generateVideoPrompts();
}

export async function saveSettingsAction() {
  try {
    const result = await saveSettings();
    showToast("模型设置和配置档已保存，新的 provider 与批任务偏好已经生效。", {
      title: "保存成功",
      tone: "success",
    });
    return result;
  } catch (error) {
    showToast(error.message || "模型设置保存失败。", {
      title: "保存失败",
      tone: "error",
      duration: 4200,
    });
    return null;
  }
}

export function exportLogsAction() {
  try {
    const result = exportCurrentLogs();
    showToast(`已导出 ${result.entries?.length || 0} 条当前筛选日志。`, {
      title: "导出成功",
      tone: "success",
    });
    return result;
  } catch (error) {
    showToast(error.message || "日志导出失败。", {
      title: "导出失败",
      tone: "error",
      duration: 4200,
    });
    return null;
  }
}
