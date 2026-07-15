import { api } from "./api.js";
import { appStore } from "./appStore.js";
import { applyLoadedProject, readProjectDraft } from "./project.js";
import { showToast } from "./toast.js";
import { activatePage } from "./ui.js";

export async function extractAssets() {
  const { project } = appStore.getState();
  if (!project) {
    showToast("请先选择或创建一个项目。", { tone: "warn" });
    return;
  }
  if (!String(project.script || "").trim()) {
    showToast("请先生成剧本，再抽取资产。", { tone: "warn" });
    return;
  }

  const btn = document.getElementById("extractAssetsBtn");
  let prevText = "";
  if (btn) { prevText = btn.textContent; btn.disabled = true; btn.textContent = "资产抽取中…"; }
  showToast("正在从剧本中抽取角色、场景和道具…", { tone: "info", duration: 6000 });

  try {
    const result = await api("/api/assets/extract", {
      method: "POST",
      body: JSON.stringify({
        projectId: project.id,
        script: project.script,
      }),
      timeoutMs: 120000,
    });
    if (result.assets) {
      const draft = readProjectDraft();
      if (!draft) return;
      applyLoadedProject({
        ...draft,
        assets: result.assets,
        assetsApproved: true,
        version: Number(result.serverVersion || draft.version || 0),
        updatedAt: Date.now(),
      }, {
        status: "saved",
        message: "资产抽取结果已保存",
      });
      const count = (result.assets.characters?.length || 0) + (result.assets.scenes?.length || 0) + (result.assets.props?.length || 0);
      activatePage("assets");
      showToast(`资产抽取成功！共提取 ${count} 项资产。`, { tone: "success" });
    } else {
      showToast("资产抽取未返回有效结果，请重试。", { tone: "warn", duration: 5000 });
    }
  } catch (error) {
    showToast(error.message || "资产抽取失败，请稍后重试。", { tone: "error", duration: 5000 });
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = prevText || "从剧本抽取资产"; }
  }
}
