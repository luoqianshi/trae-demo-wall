import { api } from "./api.js";
import { appStore } from "./appStore.js";
import { subscribeBatch } from "./backend_stream.js";
import { syncLogs } from "./logs.js";
import { pushTaskFeedEntry } from "./taskFeedView.js";
import { renderVideoHistoryView } from "./videoHistoryView.js";

export async function fetchVideoHistory(projectId) {
  if (!projectId) return [];
  const tasks = await api(`/api/tasks/video-by-project?projectId=${encodeURIComponent(projectId)}`);
  appStore.setTasks(tasks);
  renderVideoHistoryView();
  return tasks;
}

export function attachBatchStream(batchId, hooks = {}) {
  const { onTaskCompletedRefresh } = hooks;
  appStore.replaceBatchStream(
    subscribeBatch(batchId, {
      onSnapshot(payload) {
        pushTaskFeedEntry(`收到批任务快照，共 ${payload.tasks?.length || payload.total || 0} 项`, "running");
      },
      onTaskStarted(payload) {
        pushTaskFeedEntry(
          `任务 ${payload.taskId} 已开始，目标分镜 ${payload.target?.idx ?? payload.target?.groupIdx ?? "-"}`,
          "running",
        );
      },
      onTaskProgress(payload) {
        pushTaskFeedEntry(`任务 ${payload.taskId} 进度：${payload.status || payload.label || "running"}`, "running");
      },
      async onTaskCompleted(payload) {
        pushTaskFeedEntry(`任务 ${payload.taskId} 完成`, "done");
        if (onTaskCompletedRefresh) {
          await onTaskCompletedRefresh();
        }
        await syncLogs();
      },
      async onTaskFailed(payload) {
        pushTaskFeedEntry(`任务 ${payload.taskId} 失败：${payload.reason || payload.errorMsg || "unknown"}`, "failed");
        await syncLogs();
      },
      async onTaskCancelled(payload) {
        pushTaskFeedEntry(`任务 ${payload.taskId} 已取消：${payload.reason || "manual stop"}`, "cancelled");
        await syncLogs();
      },
      async onBatchCompleted() {
        pushTaskFeedEntry(`批任务 ${batchId} 已完成`, "done");
        await fetchVideoHistory(appStore.getState().project?.id);
        await syncLogs();
      },
    }),
  );
}
