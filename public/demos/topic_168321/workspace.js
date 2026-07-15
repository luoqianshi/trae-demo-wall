import { extractAssets } from "./modules/assets.js";
import {
  deleteProjectAction,
  exportLogsAction,
  generateVideoPromptsAction,
  inspectLatestTaskDebugAction,
  inspectTaskDebugAction,
  previewBatchRequestAction,
  saveProjectAction,
  saveSettingsAction,
  startBatchAction,
  syncLogsAction,
} from "./modules/actions.js";
import {
  bindProjectDraftInputs,
  createProject,
  flushAutoSave,
  loadMe,
  loadProject,
  loadProjects,
} from "./modules/project.js";
import { appStore } from "./modules/appStore.js";
import { renderProjectListView } from "./modules/projectListView.js";
import { bindSettingsInputs, loadSettings } from "./modules/settings.js";
import { logoutSession, requireSession } from "./modules/session.js";
import { generateScript } from "./modules/script.js";
import { bindStoryboardsFilters } from "./modules/storyboardsView.js";
import { seedStoryboardsFromShots, generateAllStoryboardImages } from "./modules/storyboard.js";
import { activatePage, bindNavigation, renderProjectSaveFeedback } from "./modules/ui.js";
import { SAMPLE_SCRIPTS } from "./modules/sample-scripts.js";
import { showToast } from "./modules/toast.js";

requireSession();

boot().catch((error) => {
  console.error(error);
  alert("工作台初始化失败，请重新登录。");
  logout();
});

async function boot() {
  bindNavigation();
  bindActions();
  bindUiShortcuts();
  activatePage(document.querySelector(".nav-btn.active")?.dataset.page || "overview");
  renderProjectListView();
  renderProjectSaveFeedback();
  appStore.subscribe(() => {
    renderProjectSaveFeedback();
  });
  bindProjectDraftInputs();
  bindSettingsInputs();
  bindStoryboardsFilters();
  await loadMe();
  await loadSettings();
  await loadProjects();
  await syncLogsAction();
}

function bindActions() {
  document.getElementById("logoutBtn").addEventListener("click", logout);
  bindProjectManageMenu();
  bindClick("newProjectBtn", createProject);
  bindClick("deleteProjectBtn", deleteProjectAction);
  bindClick("saveProjectBtn", saveProjectAction);
  bindClick("saveProjectScriptBtn", saveProjectAction);
  bindClick("saveProjectAssetsBtn", saveProjectAction);
  bindClick("saveProjectStoryboardsBtn", saveProjectAction);
  document.getElementById("projectSelect").addEventListener("change", (event) => {
    if (event.target.value) {
      loadProject(event.target.value);
    }
  });
  document.getElementById("projectFilterInput")?.addEventListener("input", (event) => {
    appStore.setProjectFilter(event.target.value);
    renderProjectListView();
  });
  bindClick("generateScriptBtn", generateScript);
  bindClick("overviewGenerateScriptBtn", generateScript);
  bindClick("extractAssetsBtn", extractAssets);
  document.getElementById("sampleScriptSelect").addEventListener("change", (event) => {
    const scriptId = event.target.value;
    if (!scriptId) return;
    const script = SAMPLE_SCRIPTS.find(s => s.id === scriptId);
    if (script) {
      const scriptText = document.getElementById("scriptText");
      if (scriptText.value.trim() && !confirm(`当前剧本内容将被覆盖，确定要载入「${script.title}」吗？`)) {
        event.target.value = "";
        return;
      }
      scriptText.value = script.content;
      event.target.value = "";
      showToast(`已载入「${script.title}」`, { tone: "success" });
    }
  });
  bindClick("seedStoryboardsBtn", seedStoryboardsFromShots);
  bindClick("generateAllStoryboardImagesBtn", generateAllStoryboardImages);
  bindClick("generateVideoPromptsBtn", generateVideoPromptsAction);
  bindClick("saveSettingsBtn", saveSettingsAction);
  bindClick("previewBatchRequestBtn", previewBatchRequestAction);
  bindClick("inspectLatestTaskBtn", inspectLatestTaskDebugAction);
  bindClick("startBatchBtn", startBatchAction);
  document.getElementById("gotoVideoSettingsBtn").addEventListener("click", () => {
    activatePage("settings");
    document.getElementById("video-adapter")?.focus();
  });
  bindClick("exportLogsBtn", exportLogsAction);
  bindClick("refreshLogsBtn", () => {
    syncLogsAction(
      document.getElementById("logDateSelect").value,
      document.getElementById("logEventFilter").value.trim(),
      document.querySelector("#logEventChips .chip-btn.active")?.dataset.failed === "1",
    );
  });
  document.getElementById("logDateSelect").addEventListener("change", (event) => {
    syncLogsAction(
      event.target.value,
      document.getElementById("logEventFilter").value.trim(),
      document.querySelector("#logEventChips .chip-btn.active")?.dataset.failed === "1",
    );
  });
  document.getElementById("logEventFilter").addEventListener("change", (event) => {
    syncLogsAction(
      document.getElementById("logDateSelect").value,
      event.target.value.trim(),
      document.querySelector("#logEventChips .chip-btn.active")?.dataset.failed === "1",
    );
  });
  document.querySelectorAll("#logEventChips .chip-btn").forEach((chip) => {
    chip.addEventListener("click", () => {
      syncLogsAction(
        document.getElementById("logDateSelect").value,
        chip.dataset.event || "",
        chip.dataset.failed === "1",
      );
    });
  });
}

function logout() {
  const { batchStream } = appStore.getState();
  if (batchStream) {
    batchStream.close();
  }
  logoutSession();
}

function bindClick(id, handler) {
  const element = document.getElementById(id);
  if (!element) return;
  element.addEventListener("click", handler);
}

function bindProjectManageMenu() {
  const trigger = document.getElementById("projectManageBtn");
  const menu = document.getElementById("projectManageMenu");
  if (!trigger || !menu) return;

  const closeMenu = () => {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
  };

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    if (menu.hidden) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  menu.addEventListener("click", () => {
    closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (!menu.hidden && !menu.contains(event.target) && event.target !== trigger) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

function bindUiShortcuts() {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-trigger-id]");
    if (trigger) {
      const target = document.getElementById(trigger.dataset.triggerId);
      if (target) {
        target.click();
      }
      return;
    }

    const pageJump = event.target.closest("[data-go-page]");
    if (pageJump) {
      activatePage(pageJump.dataset.goPage);
      return;
    }

    const taskDebug = event.target.closest("[data-task-debug-id]");
    if (taskDebug) {
      inspectTaskDebugAction(taskDebug.dataset.taskDebugId);
    }
  });

  document.addEventListener("keydown", async (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      try {
        await flushAutoSave({ source: "manual" });
      } catch (_error) {
        // Save feedback UI already shows the failure state.
      }
    }
  });
}
