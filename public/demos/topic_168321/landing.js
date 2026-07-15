const authDialog = document.getElementById("authDialog");
const authStatus = document.getElementById("authStatus");
restoreAuthFlashMessage();

document.getElementById("openAuthBtn").addEventListener("click", () => {
  authDialog.showModal();
});

document.getElementById("demoLoginBtn").addEventListener("click", async () => {
  const result = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ login: "demo", password: "demo123" }),
  });
  if (result.error || result.detail) {
    setStatus(result.error || result.detail);
    authDialog.showModal();
    return;
  }
  persistSession(result);
});

document.getElementById("sendOtpBtn").addEventListener("click", async () => {
  const email = document.getElementById("registerEmail").value.trim();
  if (!email) {
    setStatus("请先填写注册邮箱。");
    return;
  }
  const result = await api("/api/auth/register/send-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (result.error) {
    setStatus(result.error);
    return;
  }
  setStatus(`模拟验证码已生成：${result.previewCode}`);
});

document.getElementById("loginBtn").addEventListener("click", async () => {
  const login = document.getElementById("loginInput").value.trim();
  const password = document.getElementById("passwordInput").value;
  const result = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ login, password }),
  });
  if (result.error || result.detail) {
    setStatus(result.error || result.detail);
    return;
  }
  persistSession(result);
});

document.getElementById("registerBtn").addEventListener("click", async () => {
  const username = document.getElementById("registerUsername").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("passwordInput").value;
  const code = document.getElementById("registerOtp").value.trim();
  const result = await api("/api/auth/register/verify", {
    method: "POST",
    body: JSON.stringify({ username, email, password, code }),
  });
  if (result.error || result.detail) {
    setStatus(result.error || result.detail);
    return;
  }
  persistSession(result);
});

function persistSession(result) {
  localStorage.setItem("sw_auth_token", result.token);
  localStorage.setItem("sw_auth_user", JSON.stringify(result.user));
  window.location.href = "/workspace";
}

function setStatus(message) {
  authStatus.textContent = message;
}

function restoreAuthFlashMessage() {
  try {
    const message = sessionStorage.getItem("sw_auth_flash");
    if (!message) return;
    sessionStorage.removeItem("sw_auth_flash");
    setStatus(message);
    authDialog.showModal();
  } catch (_error) {
    // ignore storage read failures
  }
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  return response.json();
}
