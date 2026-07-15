import { appStore } from "./appStore.js";
import { authStore } from "./authStore.js";
import {
  createProjectRecord,
  deleteProjectRecord,
  fetchCurrentUser,
  fetchProject,
  fetchProjects,
  saveProjectRecord,
} from "./projectPersistence.js";
import { fetchVideoHistory } from "./taskCenter.js";
import { renderProject, renderUserSummary } from "./ui.js";
import { renderProjectListView } from "./projectListView.js";

const AUTO_SAVE_DELAY_MS = 1200;
let autoSaveTimer = 0;
let autoSaveInFlight = false;

export async function loadMe() {
  const result = await fetchCurrentUser();
  if (result.detail) throw new Error(result.detail);
  authStore.setUser(result.user);
  renderUserSummary();
}

export async function loadProjects() {
  const projects = await fetchProjects();
  appStore.setProjects(projects);
  renderProjectListView();
  const { project } = appStore.getState();
  const activeProjectStillExists = project?.id && projects.some((item) => item.id === project.id);
  const firstId = activeProjectStillExists ? project.id : projects[0]?.id;
  if (firstId) {
    await loadProject(firstId);
  }
}

export async function loadProject(projectId) {
  const project = await fetchProject(projectId);
  applyLoadedProject(project, { status: "saved", message: "已载入最新项目内容" });
  await fetchVideoHistory(project.id);
}

export async function createProject() {
  const result = await createProjectRecord({});
  const { projects } = appStore.getState();
  appStore.setProjects([result, ...projects]);
  renderProjectListView();
  await loadProject(result.id);
  return result;
}

export async function saveProject() {
  const draft = readProjectDraft();
  if (!draft) return null;
  clearAutoSaveTimer();
  appStore.setProjectSave({
    projectId: draft.id,
    status: "saving",
    dirty: true,
    message: "正在保存项目变更...",
  });
  try {
    const result = await saveProjectRecord(draft);
    const savedProject = {
      ...draft,
      version: Number(result.version || draft.version || 0),
      updatedAt: Number(result.updatedAt || Date.now()),
    };
    appStore.patchProjectInList(savedProject);
    applyLoadedProject(savedProject, {
      status: "saved",
      message: "所有修改已保存",
    });
    return savedProject;
  } catch (error) {
    if (error?.status === 401) {
      throw error;
    }
    if (error?.code === "STALE_VERSION" || error?.status === 409) {
      await loadProject(draft.id);
      appStore.setProjectSave({
        projectId: draft.id,
        status: "conflict",
        dirty: false,
        message: "检测到版本冲突，已为你重新加载最新版本。",
      });
      throw new Error("项目版本已落后，已重新加载最新版本。");
    }
    appStore.setProjectSave({
      projectId: draft.id,
      status: "error",
      dirty: true,
      message: error.message || "项目保存失败",
    });
    throw error;
  }
}

export async function deleteProject() {
  const { project, projects } = appStore.getState();
  if (!project?.id) return null;
  const confirmed = window.confirm(`确定删除项目“${project.name || project.id}”吗？`);
  if (!confirmed) return null;
  const result = await deleteProjectRecord(project.id);
  if (result?.error || result?.detail) {
    throw new Error(result.error || result.detail);
  }
  const remaining = projects.filter((item) => item.id !== project.id);
  appStore.setProject(null);
  appStore.setProjectSave({
    projectId: "",
    baseline: "",
    dirty: false,
    status: "idle",
    lastSavedAt: 0,
    message: "",
  });
  appStore.setTasks([]);
  appStore.replaceBatchStream(null);
  appStore.setProjects(remaining);
  renderProjectListView();
  if (remaining.length > 0) {
    await loadProject(remaining[0].id);
    return result;
  }
  const created = await createProject();
  return created || result;
}

export function bindProjectDraftInputs() {
  ["projectName", "projectIdea", "scriptText"].forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.addEventListener("input", () => {
      refreshProjectSaveState();
    });
  });
  window.addEventListener("beforeunload", (event) => {
    const { projectSave } = appStore.getState();
    if (!projectSave.dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });
}

export function readProjectDraft() {
  const { project } = appStore.getState();
  if (!project) return null;
  const draft = cloneProject(project);
  const nameInput = document.getElementById("projectName");
  const ideaInput = document.getElementById("projectIdea");
  const scriptInput = document.getElementById("scriptText");
  if (nameInput) draft.name = nameInput.value.trim();
  if (ideaInput) draft.idea = ideaInput.value.trim();
  if (scriptInput) draft.script = scriptInput.value;
  return draft;
}

export function refreshProjectSaveState(overrides = {}) {
  const draft = readProjectDraft();
  if (!draft) return;
  const { projectSave } = appStore.getState();
  const baseline = projectSave.projectId === draft.id ? projectSave.baseline : createProjectBaseline(draft);
  const dirty = createProjectBaseline(draft) !== baseline;
  appStore.setProjectSave({
    projectId: draft.id,
    baseline,
    dirty,
    status: overrides.status || (dirty ? "dirty" : "saved"),
    lastSavedAt: overrides.lastSavedAt ?? projectSave.lastSavedAt,
    message: overrides.message || (dirty ? "你有未保存的项目改动" : "所有修改已保存"),
  });
  if (dirty) {
    scheduleAutoSave();
  } else {
    clearAutoSaveTimer();
  }
}

export function applyLoadedProject(project, options = {}) {
  clearAutoSaveTimer();
  appStore.setProject(project);
  appStore.setProjectSave({
    projectId: project?.id || "",
    baseline: createProjectBaseline(project),
    dirty: false,
    status: options.status || "saved",
    lastSavedAt: Number(project?.updatedAt || Date.now()),
    message: options.message || "所有修改已保存",
  });
  renderProjectListView();
  renderProject();
}

export function applyDirtyProjectMutation(mutator) {
  appStore.updateProject(mutator);
  renderProject();
  refreshProjectSaveState();
}

function createProjectBaseline(project) {
  if (!project) return "";
  const clone = cloneProject(project);
  delete clone.version;
  delete clone.updatedAt;
  return JSON.stringify(clone);
}

function cloneProject(project) {
  return JSON.parse(JSON.stringify(project));
}

function scheduleAutoSave() {
  clearAutoSaveTimer();
  autoSaveTimer = window.setTimeout(() => {
    flushAutoSave({ source: "auto" }).catch(() => {
      // Save state already reflects the failure; avoid noisy unhandled promise errors.
    });
  }, AUTO_SAVE_DELAY_MS);
}

function clearAutoSaveTimer() {
  if (!autoSaveTimer) return;
  window.clearTimeout(autoSaveTimer);
  autoSaveTimer = 0;
}

export async function flushAutoSave(options = {}) {
  const { projectSave } = appStore.getState();
  if (!projectSave?.dirty || autoSaveInFlight) return null;
  clearAutoSaveTimer();
  autoSaveInFlight = true;
  const isAuto = options.source !== "manual";
  if (isAuto) {
    appStore.setProjectSave({
      status: "saving",
      message: "正在自动保存项目变更...",
    });
  }
  try {
    return await saveProject();
  } finally {
    autoSaveInFlight = false;
    const latest = appStore.getState().projectSave;
    if (latest?.dirty) {
      scheduleAutoSave();
    }
  }
}
