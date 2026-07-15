import { authStore } from "./authStore.js";

const MAX_RETRIES = 3;

function buildUrl(pathname) {
  const token = authStore.getState().token;
  return pathname + (token ? `?token=${encodeURIComponent(token)}` : "");
}

function unwrapData(event) {
  try {
    const parsed = JSON.parse(event.data);
    return parsed?.data ?? parsed;
  } catch (_error) {
    return {};
  }
}

function openStream(url, handlers = {}, onClose) {
  let source = null;
  let retries = 0;
  let closed = false;

  function connect() {
    if (closed) return;
    source = new EventSource(url);

    source.onerror = function () {
      source.close();
      if (closed) return;
      if (retries < MAX_RETRIES) {
        retries += 1;
        const delay = Math.min(1000 * 2 ** (retries - 1), 8000);
        setTimeout(connect, delay);
      } else {
        closed = true;
        if (onClose) onClose();
      }
    };

    Object.entries(handlers).forEach(([eventName, handler]) => {
      if (!handler) return;
      source.addEventListener(eventName, (event) => {
        const payload = unwrapData(event);
        Promise.resolve(handler(payload))
          .then((shouldClose) => {
            if (shouldClose === true) {
              closed = true;
              source.close();
              if (onClose) onClose();
            }
          })
          .catch(() => {
            // Keep the stream alive even if one handler fails.
          });
      });
    });
  }

  connect();
  return {
    close() {
      closed = true;
      if (source) source.close();
    },
  };
}

export function subscribeTask(taskId, callbacks = {}) {
  const url = buildUrl(`/api/tasks/${encodeURIComponent(taskId)}/stream`);
  const { onProgress, onCompleted, onFailed, onClose } = callbacks;
  return openStream(
    url,
    {
      task_progress: onProgress,
      task_completed: (data) => {
        if (onCompleted) onCompleted(data);
        return true;
      },
      task_failed: (data) => {
        if (onFailed) onFailed(data);
        return true;
      },
      task_cancelled: (data) => {
        if (onFailed) onFailed({ reason: "已取消", ...(data || {}) });
        return true;
      },
    },
    onClose,
  );
}

export function subscribeBatch(batchId, callbacks = {}) {
  const url = buildUrl(`/api/batch/${encodeURIComponent(batchId)}/stream`);
  const {
    onSnapshot,
    onTaskStarted,
    onTaskProgress,
    onTaskCompleted,
    onTaskFailed,
    onTaskCancelled,
    onBatchCompleted,
    onClose,
  } = callbacks;

  return openStream(
    url,
    {
      snapshot: onSnapshot,
      task_started: onTaskStarted,
      task_progress: onTaskProgress,
      task_completed: onTaskCompleted,
      task_failed: onTaskFailed,
      task_cancelled: onTaskCancelled,
      batch_completed: (data) => {
        if (onBatchCompleted) onBatchCompleted(data);
      },
      batch_cancelled: (data) => {
        if (onBatchCompleted) onBatchCompleted(data);
      },
    },
    onClose,
  );
}
