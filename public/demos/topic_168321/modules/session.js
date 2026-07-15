import { authStore } from "./authStore.js";
import { clearSession } from "./utils.js";

const EXPIRED_SESSION_MESSAGE = "认证已过期，请重新登录。";
let redirectingToLogin = false;

export function requireSession() {
  const { token } = authStore.getState();
  if (!token) {
    window.location.href = "/";
    throw new Error("未登录");
  }
  return token;
}

export function logoutSession() {
  redirectingToLogin = false;
  clearSession();
  authStore.clear();
  window.location.href = "/";
}

export function handleExpiredSession(message = EXPIRED_SESSION_MESSAGE) {
  if (redirectingToLogin) return;
  redirectingToLogin = true;
  try {
    sessionStorage.setItem("sw_auth_flash", message || EXPIRED_SESSION_MESSAGE);
  } catch (_error) {
    // ignore storage write failures
  }
  clearSession();
  authStore.clear();
  window.location.href = "/";
}
