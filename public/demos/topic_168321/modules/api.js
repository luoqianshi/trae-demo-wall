import { authStore } from "./authStore.js";
import { handleExpiredSession } from "./session.js";

export async function api(url, options = {}) {
  const { token } = authStore.getState();
  const headers = {
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (!("Content-Type" in headers) && !("content-type" in headers)) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(url, {
    ...options,
    headers,
    signal: options.signal || AbortSignal.timeout(options.timeoutMs || 30000),
  });
  const rawText = await response.text();
  const contentType = response.headers.get("content-type") || "";
  const isJsonLike = contentType.includes("application/json");

  let payload = null;
  if (rawText) {
    if (isJsonLike) {
      try {
        payload = JSON.parse(rawText);
      } catch (_error) {
        throw new Error(`服务端返回了无效 JSON：${rawText.slice(0, 120)}`);
      }
    } else {
      payload = { detail: rawText };
    }
  }

  if (!response.ok) {
    const error = new Error(payload?.detail || payload?.error || `请求失败（${response.status}）`);
    error.status = response.status;
    error.code = payload?.code || "";
    error.details = payload?.details || null;
    if (response.status === 401 && (error.code === "AUTH_EXPIRED" || error.code === "AUTH_INVALID" || error.code === "UNAUTHORIZED")) {
      handleExpiredSession(error.message || "认证已过期，请重新登录。");
    }
    throw error;
  }

  return payload || { ok: true };
}
