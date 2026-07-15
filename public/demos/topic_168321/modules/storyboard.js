import { api } from "./api.js";
import { appStore } from "./appStore.js";
import { applyDirtyProjectMutation, loadProject } from "./project.js";
import { showToast } from "./toast.js";

const SHOT_TYPE_MAP = {
  "Insert": "insert shot",
  "Close-up": "close-up shot",
  "POV": "POV shot",
  "Wide": "wide shot",
  "Medium": "medium shot",
  "Tracking": "tracking shot",
  "Full": "full shot",
};

function buildSeedVideoPrompt(shot) {
  const camera = SHOT_TYPE_MAP[shot.shotType] || `${shot.shotType || "medium"} shot`;
  const visual = shot.imagePrompt || shot.visual || "cinematic scene";
  const emotion = shot.emotion ? `, mood: ${shot.emotion}` : "";
  return `${camera}, ${visual}${emotion}, smooth camera movement, cinematic lighting.`;
}

export function seedStoryboardsFromShots() {
  applyDirtyProjectMutation((draft) => {
    const shots = Array.isArray(draft.shots) ? draft.shots : [];
    if (!shots.length) {
      showToast("当前项目没有镜头数据，请先生成剧本。", { tone: "warn" });
      return;
    }
    draft.storyboards = shots.map((shot, idx) => ({
      imageUrl:
        draft.storyboards?.[idx]?.imageUrl ||
        `https://picsum.photos/seed/qd-sb-${draft.id}-${idx}/960/540`,
      rawUrl: draft.storyboards?.[idx]?.rawUrl || null,
      imageAssetId: null,
      videoPrompt:
        draft.storyboards?.[idx]?.videoPrompt ||
        buildSeedVideoPrompt(shot),
      narrationsUsed: [],
      shotIndices: [idx],
      videoUrl: draft.storyboards?.[idx]?.videoUrl || null,
      videoAssetId: draft.storyboards?.[idx]?.videoAssetId || null,
      fetchStatus: draft.storyboards?.[idx]?.fetchStatus || "pending",
    }));
    showToast(`已补齐 ${shots.length} 个分镜组。`, { tone: "success" });
  });
}

export async function generateAllStoryboardImages() {
  const { project, settings } = appStore.getState();
  if (!project) {
    showToast("请先选择一个项目。", { tone: "warn" });
    return;
  }
  if (!project.storyboards?.length) {
    showToast("请先补齐分镜组。", { tone: "warn" });
    return;
  }
  if (!settings?.models?.image?.key) {
    showToast("请先在「模型设置」中配置 Image 槽位的 API Key。", { tone: "error", duration: 5000 });
    return;
  }

  const btn = document.getElementById("generateAllStoryboardImagesBtn");
  let prevText = "";
  if (btn) { prevText = btn.textContent; btn.disabled = true; }
  const total = project.storyboards.length;

  try {
    for (let i = 0; i < total; i++) {
      if (btn) btn.textContent = `生成参考图 ${i + 1}/${total}…`;
      showToast(`正在生成分镜 ${i + 1}/${total} 的参考图…`, { tone: "info", duration: 4000 });
      await api("/api/storyboard/generate-image", {
        method: "POST",
        body: JSON.stringify({ projectId: project.id, storyboardIdx: i }),
        timeoutMs: 120000,
      });
    }
    await loadProject(project.id);
    showToast(`全部 ${total} 张参考图生成完成！`, { tone: "success" });
  } catch (error) {
    showToast(error.message || "参考图生成失败。", { tone: "error", duration: 5000 });
    await loadProject(project.id);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = prevText || "生成全部参考图"; }
  }
}

export async function generateSingleStoryboardImage(idx, btn) {
  const { project, settings } = appStore.getState();
  if (!project) return;
  if (!settings?.models?.image?.key) {
    showToast("请先在「模型设置」中配置 Image 槽位的 API Key。", { tone: "error", duration: 5000 });
    return;
  }

  const prevText = btn?.textContent || "";
  if (btn) { btn.disabled = true; btn.textContent = "生成中…"; }
  showToast(`正在生成分镜 ${idx + 1} 的参考图，可能需要 1-3 分钟…`, { tone: "info", duration: 8000 });

  try {
    const result = await api("/api/storyboard/generate-image", {
      method: "POST",
      body: JSON.stringify({ projectId: project.id, storyboardIdx: idx }),
      timeoutMs: 300000,
    });
    await loadProject(project.id);
    showToast(`分镜 ${idx + 1} 参考图生成成功！`, { tone: "success" });
  } catch (error) {
    showToast(error.message || `分镜 ${idx + 1} 参考图生成失败。`, { tone: "error", duration: 5000 });
    if (btn) { btn.disabled = false; btn.textContent = prevText; }
  }
}
