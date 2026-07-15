import { appStore } from "./appStore.js";
import { escapeHtml } from "./utils.js";

function renderAssetList(id, items, field) {
  const root = document.getElementById(id);
  root.innerHTML = items.length
    ? items
        .map(
          (item) => `
            <div class="task-entry data-card">
              <div class="data-card-head">
                <strong>${escapeHtml(item.name || "未命名")}</strong>
                <span class="page-pill">${escapeHtml(idToTypeLabel(id))}</span>
              </div>
              <div class="muted">${escapeHtml(item[field] || item.imagePrompt || "暂无描述")}</div>
            </div>
          `,
        )
        .join("")
    : [
        `<div class="empty-state">`,
        `<strong>暂无内容</strong>`,
        `<div class="muted">当前分类还没有可展示的资产，先从剧本中抽取，或补充上游内容。</div>`,
        `<div class="empty-state-actions">`,
        `<button class="ghost-btn" type="button" data-go-page="script">先看剧本</button>`,
        `<button class="primary-btn" type="button" data-trigger-id="extractAssetsBtn">立即抽取资产</button>`,
        `</div>`,
        `</div>`,
      ].join("");
}

export function renderAssetsView() {
  const { project } = appStore.getState();
  renderAssetList("charactersList", project?.assets?.characters || [], "description");
  renderAssetList("scenesList", project?.assets?.scenes || [], "description");
  renderAssetList("propsList", project?.assets?.props || [], "description");
}

function idToTypeLabel(id) {
  if (id === "charactersList") return "角色";
  if (id === "scenesList") return "场景";
  if (id === "propsList") return "道具";
  return "资产";
}
