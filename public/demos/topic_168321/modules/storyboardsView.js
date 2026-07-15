import { appStore } from "./appStore.js";
import { escapeHtml } from "./utils.js";
import { generateSingleStoryboardImage } from "./storyboard.js";

let storyboardFilter = "all";

export function renderStoryboardsView() {
  const { project } = appStore.getState();
  const root = document.getElementById("storyboardsList");
  const meta = document.getElementById("storyboardsBoardMeta");
  const filterNode = document.getElementById("storyboardsFilters");
  const boards = project?.storyboards || [];
  const filteredBoards = boards
    .map((board, index) => ({ board, index }))
    .filter(({ board }) => matchesFilter(board, storyboardFilter));
  const readyImages = boards.filter((board) => board.imageUrl).length;
  const readyVideos = boards.filter((board) => board.videoUrl).length;
  const readyPrompts = boards.filter((board) => String(board.videoPrompt || "").trim()).length;
  if (meta) {
    meta.innerHTML = [
      renderMetaTile("分镜组", String(boards.length)),
      renderMetaTile("有图参考", String(readyImages)),
      renderMetaTile("有提示词", String(readyPrompts)),
      renderMetaTile("已出视频", String(readyVideos)),
    ].join("");
  }
  if (filterNode) {
    filterNode.innerHTML = renderFilterChips(boards);
  }
  root.innerHTML = filteredBoards.length
    ? filteredBoards
        .map(
          ({ board, index }, idx) => `
            <article class="story-card data-card story-card-product">
              <div class="data-card-head">
                <div class="story-card-title-block">
                  <span class="story-card-index">Board ${escapeHtml(String(index + 1))}</span>
                  <strong>分镜组 ${escapeHtml(String(index + 1))}</strong>
                </div>
                <span class="status-badge status-badge-${escapeHtml(board.fetchStatus || "pending")}">${escapeHtml(board.fetchStatus || "pending")}</span>
              </div>
              <div class="story-card-status-grid">
                <div class="story-status-pill ${board.imageUrl ? "story-status-ready" : "story-status-waiting"}">参考图 ${board.imageUrl ? "已就绪" : "待生成"}</div>
                <div class="story-status-pill ${String(board.videoPrompt || "").trim() ? "story-status-ready" : "story-status-waiting"}">提示词 ${String(board.videoPrompt || "").trim() ? "已生成" : "待生成"}</div>
                <div class="story-status-pill ${board.videoUrl ? "story-status-ready" : "story-status-waiting"}">视频 ${board.videoUrl ? "已返回" : "未返回"}</div>
              </div>
              <div class="story-prompt-block">
                <span class="story-prompt-label">视频提示词</span>
                <div class="muted">${escapeHtml(board.videoPrompt || "当前还没有视频提示词，可先批量生成。")}</div>
              </div>
              ${board.imageUrl ? `<img src="${escapeHtml(board.imageUrl)}" alt="storyboard-${idx}" />` : ""}
              ${board.videoUrl ? `<video src="${escapeHtml(board.videoUrl)}" controls></video>` : ""}
              <div class="story-card-foot">
                <span class="muted">画面参考 ${board.imageUrl ? "已就绪" : "未生成"} · 视频结果 ${board.videoUrl ? "已返回" : "未返回"}</span>
                <button class="ghost-btn story-gen-img-btn" data-board-idx="${index}" type="button">生成参考图</button>
              </div>
            </article>
          `,
        )
        .join("")
    : boards.length
      ? [
        `<div class="empty-state">`,
        `<strong>当前筛选下没有分镜组</strong>`,
        `<div class="muted">可以切回“全部”，或继续查看“未出图 / 未出视频 / 已有提示词”等执行切片。</div>`,
        `</div>`,
      ].join("")
      : [
        `<div class="empty-state">`,
        `<strong>还没有分镜组</strong>`,
        `<div class="muted">可先生成剧本，或点击“根据镜头快速补齐分镜组”建立第一批分镜卡。</div>`,
        `<div class="empty-state-actions">`,
        `<button class="ghost-btn" type="button" data-go-page="script">前往剧本页</button>`,
        `<button class="primary-btn" type="button" data-trigger-id="seedStoryboardsBtn">补齐分镜组</button>`,
        `</div>`,
        `</div>`,
      ].join("");
  bindStoryboardImageButtons();
}

function bindStoryboardImageButtons() {
  document.querySelectorAll(".story-gen-img-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.boardIdx);
      generateSingleStoryboardImage(idx, btn);
    }, { once: true });
  });
}

export function bindStoryboardsFilters() {
  const filterNode = document.getElementById("storyboardsFilters");
  if (!filterNode || filterNode.dataset.bound === "1") return;
  filterNode.dataset.bound = "1";
  filterNode.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("button[data-storyboard-filter]") : null;
    if (!button) return;
    storyboardFilter = button.dataset.storyboardFilter || "all";
    renderStoryboardsView();
  });
}

function renderMetaTile(label, value) {
  return [
    `<div class="storyboard-meta-card">`,
    `<span class="storyboard-meta-label">${escapeHtml(label)}</span>`,
    `<strong class="storyboard-meta-value">${escapeHtml(value)}</strong>`,
    `</div>`,
  ].join("");
}

function renderFilterChips(boards) {
  const filters = [
    { id: "all", label: "全部", count: boards.length },
    { id: "missing-image", label: "只看未出图", count: boards.filter((board) => !board.imageUrl).length },
    { id: "missing-video", label: "只看未出视频", count: boards.filter((board) => !board.videoUrl).length },
    { id: "with-prompt", label: "只看已有提示词", count: boards.filter((board) => String(board.videoPrompt || "").trim()).length },
  ];
  return filters
    .map((filter) => `
      <button
        class="chip-btn ${storyboardFilter === filter.id ? "active" : ""}"
        type="button"
        data-storyboard-filter="${escapeHtml(filter.id)}"
      >${escapeHtml(filter.label)} (${escapeHtml(String(filter.count))})</button>
    `)
    .join("");
}

function matchesFilter(board, filter) {
  switch (filter) {
    case "missing-image":
      return !board.imageUrl;
    case "missing-video":
      return !board.videoUrl;
    case "with-prompt":
      return Boolean(String(board.videoPrompt || "").trim());
    default:
      return true;
  }
}
