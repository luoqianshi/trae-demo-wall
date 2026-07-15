import { appStore } from "./appStore.js";
import { applyDirtyProjectMutation } from "./project.js";
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

function findCharacterForShot(characters, shot) {
  const text = `${shot.visual || ""} ${shot.imagePrompt || ""}`.toLowerCase();
  return characters.find((c) => c.name && text.includes(c.name.toLowerCase())) || null;
}

function findSceneForShot(scenes, shot) {
  const text = `${shot.visual || ""} ${shot.imagePrompt || ""}`.toLowerCase();
  return scenes.find((s) => s.name && text.includes(s.name.toLowerCase())) || null;
}

function buildPromptFromContext(project, shot, idx) {
  const visual = shot.imagePrompt || shot.visual || `scene ${idx + 1}`;
  const emotion = shot.emotion ? `, mood: ${shot.emotion}` : "";
  return `${visual}${emotion}, cinematic motion, smooth camera movement.`;
}

export function generateVideoPrompts() {
  const { project } = appStore.getState();
  if (!project) return;
  const shots = Array.isArray(project.shots) ? project.shots : [];
  if (!shots.length) {
    showToast("当前项目没有镜头数据，请先生成剧本。", { tone: "warn" });
    return;
  }
  applyDirtyProjectMutation((draft) => {
    const existing = Array.isArray(draft.storyboards) ? draft.storyboards : [];
    draft.storyboards = shots.map((shot, idx) => ({
      ...existing[idx],
      shotIndices: existing[idx]?.shotIndices || [idx],
      imageUrl:
        existing[idx]?.imageUrl ||
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
      rawUrl: existing[idx]?.rawUrl || null,
      fetchStatus: existing[idx]?.fetchStatus || "pending",
      videoPrompt: buildPromptFromContext(draft, shot, idx),
      narrationsUsed: existing[idx]?.narrationsUsed || [],
      videoUrl: existing[idx]?.videoUrl || null,
      videoAssetId: existing[idx]?.videoAssetId || null,
    }));
    draft.videoPromptsApproved = true;
  });
  showToast(`已为 ${shots.length} 个分镜生成视频提示词。`, { tone: "success" });
}
