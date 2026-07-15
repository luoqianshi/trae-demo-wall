import { api } from "./api.js";
import { appStore } from "./appStore.js";
import { applyLoadedProject, readProjectDraft } from "./project.js";
import { showToast } from "./toast.js";
import { activatePage } from "./ui.js";

export async function generateScript() {
  const project = readProjectDraft();
  if (!project) {
    showToast("请先选择或创建一个项目。", { tone: "warn" });
    return;
  }
  if (!String(project.idea || "").trim()) {
    showToast("请先填写一句话创意，再生成剧本。", { tone: "warn" });
    document.getElementById("projectIdea")?.focus();
    return;
  }

  const { settings } = appStore.getState();
  if (!settings?.models?.text?.key) {
    showToast("请先在「模型设置」中填写 Text 槽位的 API Key 并保存。", { tone: "error", duration: 6000 });
    activatePage("settings");
    return;
  }

  const btns = document.querySelectorAll("#generateScriptBtn, #overviewGenerateScriptBtn");
  btns.forEach((btn) => { btn.disabled = true; btn.dataset.prevText = btn.textContent; btn.textContent = "剧本生成中…"; });
  showToast("正在调用文本模型生成剧本，请稍候…", { tone: "info", duration: 6000 });

  try {
    const result = await api("/api/script/workflow/full-create", {
      method: "POST",
      body: JSON.stringify({
        projectId: project.id,
        idea: project.idea,
      }),
      timeoutMs: 120000,
    });
    if (result.script) {
      applyLoadedProject({
        ...project,
        script: result.script,
        shots: result.shots || project.shots || [],
        emotionSegments: result.emotionSegments || project.emotionSegments || [],
        version: Number(result.serverVersion || project.version || 0),
        updatedAt: Date.now(),
      }, {
        status: "saved",
        message: "剧本已生成并同步保存",
      });
      activatePage("script");
      showToast("剧本生成成功！", { tone: "success" });
    } else {
      showToast("文本模型未返回有效剧本，请检查模型配置后重试。", { tone: "warn", duration: 5000 });
    }
  } catch (error) {
    showToast(error.message || "剧本生成失败，请检查文本模型配置。", { tone: "error", duration: 5000 });
  } finally {
    btns.forEach((btn) => { btn.disabled = false; btn.textContent = btn.dataset.prevText || "从创意生成剧本"; });
  }
}
