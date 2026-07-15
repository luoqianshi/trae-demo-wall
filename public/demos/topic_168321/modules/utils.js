export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("sw_auth_user") || "null");
  } catch (_error) {
    return null;
  }
}

export function getAuthToken() {
  return localStorage.getItem("sw_auth_token") || "";
}

export function requireAuthToken() {
  const token = getAuthToken();
  if (!token) {
    window.location.href = "/";
    throw new Error("未登录");
  }
  return token;
}

export function clearSession() {
  localStorage.removeItem("sw_auth_token");
  localStorage.removeItem("sw_auth_user");
}

export function statCard(label, value) {
  return `<div class="stat-card"><div class="muted">${escapeHtml(label)}</div><strong>${escapeHtml(String(value))}</strong></div>`;
}

export function deriveProjectCurrentStep(project) {
  if (!String(project?.idea || "").trim()) return 1;
  if (!String(project?.script || "").trim()) return 2;
  if (getProjectAssetCount(project) <= 0) return 3;
  if (Number(project?.counts?.shots || project?.shots?.length || 0) <= 0) return 4;
  if (Number(project?.counts?.storyboards || project?.storyboards?.length || 0) <= 0) return 5;
  if (getProjectPromptCount(project) <= 0) return 6;
  return 7;
}

export function getProjectStageMeta(project) {
  const step = deriveProjectCurrentStep(project);
  const stages = {
    1: "创意",
    2: "剧本",
    3: "资产",
    4: "镜头",
    5: "分镜",
    6: "视频提示词",
    7: "批任务/出片",
  };
  return {
    step,
    label: stages[step] || `步骤 ${step}`,
  };
}

export function getProjectStages() {
  return [
    { step: 1, label: "创意" },
    { step: 2, label: "剧本" },
    { step: 3, label: "资产" },
    { step: 4, label: "镜头" },
    { step: 5, label: "分镜" },
    { step: 6, label: "提示词" },
    { step: 7, label: "出片" },
  ];
}

export function getProjectCompleteness(project) {
  const checks = [
    Boolean(String(project?.idea || "").trim()),
    Boolean(String(project?.script || "").trim()),
    getProjectAssetCount(project) > 0,
    Number(project?.counts?.shots || project?.shots?.length || 0) > 0,
    Number(project?.counts?.storyboards || project?.storyboards?.length || 0) > 0,
    getProjectPromptCount(project) > 0,
  ];
  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

export function projectProgressText(project) {
  const stage = getProjectStageMeta(project);
  const completeness = getProjectCompleteness(project);
  return `${stage.label} · ${completeness}%`;
}

function getProjectAssetCount(project) {
  return Number(project?.counts?.assets || project?.assets?.characters?.length || 0)
    + Number(project?.assets?.scenes?.length || 0)
    + Number(project?.assets?.props?.length || 0);
}

function getProjectPromptCount(project) {
  const promptListCount = Number(project?.counts?.videoPrompts || project?.videoPrompts?.length || 0);
  const storyboardPromptCount = Array.isArray(project?.storyboards)
    ? project.storyboards.filter((board) => String(board?.videoPrompt || "").trim()).length
    : 0;
  return Math.max(promptListCount, storyboardPromptCount);
}
