import { fetchItems, fetchItem, createItem, deleteItem, fetchItemCount } from './api.js';

const state = {
  page: "home",
  prevPage: "home",
  activeTab: "home",
  currentClosetId: "mine",
  filter: "全部",
  selectionMode: false,
  selected: new Set(),
  upload: ["T恤", "衬衫", "外套", "裤", "裙"],
  analysisIndex: 2,
  items: [],
  loading: false
};

const closets = [
  { id: "mine", name: "我的衣橱", owner: "self", count: 0, matchRate: 80 }
];

const tabMap = {
  home: "home",
  wardrobe: "wardrobe",
  newUpload: "newUpload",
  inspiration: "inspiration",
  profile: "profile"
};

function el(selector, root = document) {
  return root.querySelector(selector);
}

function els(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function itemById(id) {
  return state.items.find(item => item.id === id) || state.items[0];
}

function currentCloset() {
  return closets.find(closet => closet.id === state.currentClosetId) || closets[0];
}

async function loadItems() {
  try {
    state.loading = true;
    state.items = await fetchItems();
    const count = await fetchItemCount();
    currentCloset().count = count.count;
    updateClosetCount();
  } catch (error) {
    console.error('Failed to load items:', error);
    state.items = [];
  } finally {
    state.loading = false;
  }
}

function updateClosetCount() {
  const countEl = el("#closetCount");
  if (countEl) {
    countEl.textContent = currentCloset().count;
  }
}

function showPage(page, tab = null) {
  state.prevPage = state.page;
  state.page = page;
  els(".page").forEach(section => section.classList.toggle("active", section.id === "page-" + page));
  const newTab = tab || Object.keys(tabMap).find(key => tabMap[key] === page) || state.activeTab;
  state.activeTab = newTab;
  els(".tab").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === newTab));
  if (page === "wardrobe") renderWardrobe();
  if (page === "home") renderToday();
  if (page === "inspiration") renderInspiration();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function showToast(message) {
  const toast = el("#toast");
  toast.textContent = message;
  toast.classList.add("active");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("active"), 1800);
}

function openModal(name) {
  const modal = name === "newCloset" ? el("#newClosetModal") : name === "report" ? el("#reportModal") : el("#batchModal");
  modal.classList.add("active");
  if (name === "newCloset") validateClosetName();
}

function closeModals() {
  els(".modal-backdrop").forEach(modal => modal.classList.remove("active"));
}

function garmentButton(item, className = "garment-card") {
  return `
    <button class="${className} item-${item.id}" data-item="${item.id}">
      <div class="garment-art"><span class="emoji">${item.emoji}</span></div>
      <strong class="garment-name">${item.name}</strong>
      <span class="garment-meta">${item.color} · ${item.cat}</span>
    </button>`;
}

function renderToday(scene = "commute") {
  if (state.items.length === 0) {
    el("#todayOutfit").innerHTML = `<div class="muted">暂无衣物数据</div>`;
    return;
  }

  const shirts = state.items.filter(i => i.cat === "上装");
  const pants = state.items.filter(i => i.cat === "下装");

  let data;
  if (scene === "commute") {
    const shirt = shirts.find(i => i.name.includes("衬衫")) || shirts[0];
    const pant = pants.find(i => i.name.includes("西裤")) || pants[0];
    data = {
      ids: shirt && pant ? [shirt.id, pant.id] : [],
      reason: shirt && pant ? `${shirt.name} + ${pant.name}，经典通勤组合` : "衣橱单品不足，无法生成搭配",
      score: 92
    };
  } else {
    const shirt = shirts.find(i => i.name.includes("T恤") || i.name.includes("卫衣")) || shirts[0];
    const pant = pants.find(i => i.name.includes("牛仔")) || pants[0];
    data = {
      ids: shirt && pant ? [shirt.id, pant.id] : [],
      reason: shirt && pant ? `${shirt.name} + ${pant.name}，周末休闲更轻松` : "衣橱单品不足，无法生成搭配",
      score: 88
    };
  }

  el("#todayOutfit").innerHTML = data.ids.map(id => garmentButton(itemById(id))).join('<span class="plus-dot">+</span>');
  el("#todayReason").textContent = data.reason;
  el(".hero-outfit .match-ring").style.background = `conic-gradient(var(--sage) 0 ${data.score}%, #e8e0cf ${data.score}% 100%)`;
  el(".hero-outfit .match-ring span").innerHTML = `${data.score}%<small>匹配</small>`;
}

function renderFilters() {
  const filters = ["全部", "上装", "下装", "鞋包", "配饰"];
  el("#wardrobeFilters").innerHTML = filters.map(filter =>
    `<button class="chip filter-chip ${filter === state.filter ? "active" : ""}" data-filter="${filter}">${filter}</button>`
  ).join("");
}

function renderWardrobe() {
  renderFilters();
  let list = state.filter === "全部" ? state.items : state.items.filter(item => item.cat === state.filter);
  el("#closetCount").textContent = currentCloset().count;
  el("#wardrobeGrid").innerHTML = list.map(item => {
    const checked = state.selected.has(item.id);
    return `
      <button class="closet-card" data-closet-item="${item.id}">
        <span class="swipe-action edit">编辑</span>
        <span class="swipe-action delete">删除</span>
        ${state.selectionMode ? `<span class="check-badge">${checked ? "✓" : ""}</span>` : ""}
        <div class="garment-art"><span class="emoji">${item.emoji}</span></div>
        <strong class="garment-name">${item.name}</strong>
        <span class="garment-meta">${item.color}</span>
      </button>`;
  }).join("");
  el("#bulkbar").classList.toggle("active", state.selectionMode);
  updateBulkButtons();
  bindWardrobeGestures();
}

function updateBulkButtons() {
  const count = state.selected.size;
  el("#deleteSelected").textContent = `删除选中 ${count}件`;
  el("#batchEdit").textContent = `批量编辑 ${count}件`;
  el("#selectAll").textContent = count >= state.items.length ? "☑ 全选" : "☐ 全选";
}

function setSelectionMode(enabled) {
  state.selectionMode = enabled;
  renderWardrobe();
}

function openItem(id) {
  const item = itemById(id);
  if (!item) return;
  el("#detailEmoji").textContent = item.emoji;
  el("#detailName").textContent = item.name;
  el("#detailCategory").textContent = item.cat;
  el("#detailColor").textContent = item.color;
  showPage("itemDetail", state.activeTab);
}

function bindWardrobeGestures() {
  els("[data-closet-item]").forEach(card => {
    let timer = null;
    let startX = 0;
    card.addEventListener("pointerdown", event => {
      startX = event.clientX;
      timer = setTimeout(() => setSelectionMode(true), 560);
    });
    card.addEventListener("pointerup", event => {
      clearTimeout(timer);
      const dx = event.clientX - startX;
      if (!state.selectionMode && Math.abs(dx) > 52) {
        card.classList.remove("swiped-left", "swiped-right");
        card.classList.add(dx < 0 ? "swiped-left" : "swiped-right");
      }
    });
    card.addEventListener("pointerleave", () => clearTimeout(timer));
    card.addEventListener("contextmenu", event => {
      event.preventDefault();
      setSelectionMode(true);
    });
  });
}

function renderThumbs() {
  el("#thumbStrip").innerHTML = state.upload.map((name, index) => `<div class="thumb">${name}<button data-remove-thumb="${index}">×</button></div>`).join("");
  el("#uploadCount").textContent = state.upload.length;
  el("#analysisCount").textContent = state.upload.length;
}

function renderAnalysis() {
  el("#analysisIndex").textContent = state.analysisIndex;
  el("#analysisBar").style.width = `${state.analysisIndex / 5 * 100}%`;
  el("#nextAnalysis").textContent = state.analysisIndex >= 5 ? "✅ 保存" : "✅ 保存并下一件 ›";
}

function generateOutfits() {
  if (state.items.length < 2) return [];

  const outfits = [];
  const shirts = state.items.filter(i => i.cat === "上装");
  const pants = state.items.filter(i => i.cat === "下装");
  const shoes = state.items.filter(i => i.cat === "鞋包");

  for (let i = 0; i < shirts.length && outfits.length < 5; i++) {
    for (let j = 0; j < pants.length && outfits.length < 5; j++) {
      const shirt = shirts[i];
      const pant = pants[j];
      
      let matchScore = 70;
      if (shirt.scene === pant.scene) matchScore += 15;
      if (shirt.season === pant.season || shirt.season === "四季" || pant.season === "四季") matchScore += 10;
      
      const colors = [shirt.color, pant.color];
      if (colors.includes("白色") || colors.includes("黑色")) matchScore += 5;
      
      const outfit = {
        items: [shirt, pant],
        scene: shirt.scene,
        matchScore: Math.min(matchScore, 95),
        mark: Math.random() > 0.3 ? "✓ 你标记了“喜欢”" : Math.random() > 0.5 ? "○ 未标记" : "✗ 你标记了“不喜欢”"
      };

      if (shoes.length > 0) {
        const shoe = shoes[Math.floor(Math.random() * shoes.length)];
        outfit.items.push(shoe);
        if (shoe.scene === shirt.scene) outfit.matchScore += 3;
      }

      outfits.push(outfit);
    }
  }

  return outfits.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
}

function getTopItems() {
  const counts = {};
  state.items.forEach(item => {
    counts[item.id] = (counts[item.id] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => state.items.find(i => i.id === id))
    .filter(Boolean);
}

function renderInspiration() {
  const topItems = getTopItems();
  const outfits = generateOutfits();

  el("#historyList").innerHTML = outfits.map((outfit, index) => {
    const dateOptions = ["今天", "昨天", "前天", "本周一", "上周五"];
    const date = dateOptions[index] || "近期";
    const itemNames = outfit.items.map(i => i.name);
    
    return `
      <button class="outfit-row" data-history="${index}">
        <strong>${date}</strong>
        <div class="outfit-mini">${itemNames.map(name => `<span class="tile">${name}</span>`).join("")}</div>
        <div class="outfit-line"><span>${outfit.scene}</span><span>${outfit.mark}</span><span>›</span></div>
      </button>
    `;
  }).join("");
}

function validateClosetName() {
  el("#createCloset").disabled = !el("#closetName").value.trim();
}

async function handleAddItem() {
  const name = el("#addItemName")?.value || "";
  const cat = el("#addItemCat")?.value || "上装";
  const color = el("#addItemColor")?.value || "白色";
  const season = el("#addItemSeason")?.value || "四季";
  const scene = el("#addItemScene")?.value || "通勤";
  const note = el("#addItemNote")?.value || "";

  const emojiMap = {
    "上装": "👕",
    "下装": "👖",
    "鞋包": "👟",
    "配饰": "🧣"
  };

  if (!name.trim()) {
    return showToast("请输入衣物名称");
  }

  try {
    await createItem({
      name: name.trim(),
      cat,
      color,
      emoji: emojiMap[cat] || "👕",
      season,
      scene,
      note
    });
    await loadItems();
    renderToday();
    renderInspiration();
    showToast("已保存到我的衣橱，推荐已更新");
    showPage("wardrobe", "wardrobe");
  } catch (error) {
    showToast("保存失败，请重试");
  }
}

async function handleDeleteItem(id) {
  try {
    await deleteItem(id);
    await loadItems();
    renderToday();
    renderInspiration();
    showToast("已删除单品记录，推荐已更新");
    if (state.page === "itemDetail") {
      showPage(state.prevPage || "wardrobe", state.activeTab);
    }
  } catch (error) {
    showToast("删除失败，请重试");
  }
}

async function handleDeleteSelected() {
  if (!state.selected.size) return showToast("请先选择单品");
  if (confirm(`确认删除选中的 ${state.selected.size} 件单品？`)) {
    try {
      for (const id of state.selected) {
        await deleteItem(id);
      }
      state.selected.clear();
      setSelectionMode(false);
      await loadItems();
      renderToday();
      renderInspiration();
      showToast("已删除选中单品，推荐已更新");
    } catch (error) {
      showToast("删除失败，请重试");
    }
  }
}

document.addEventListener("click", event => {
  const target = event.target.closest("button, [data-go], [data-item], [data-modal], [data-toast], [data-close-modal]");
  if (!target) return;

  if (target.dataset.tab) {
    showPage(tabMap[target.dataset.tab], target.dataset.tab);
    return;
  }
  if (target.dataset.go) {
    showPage(target.dataset.go, target.dataset.go in tabMap ? target.dataset.go : state.activeTab);
    return;
  }
  if (target.hasAttribute("data-go-back")) {
    showPage(state.prevPage || state.activeTab, state.activeTab);
    return;
  }
  if (target.dataset.item) {
    openItem(parseInt(target.dataset.item));
    return;
  }
  if (target.dataset.modal) {
    openModal(target.dataset.modal);
    return;
  }
  if (target.dataset.toast) {
    showToast(target.dataset.toast);
  }
  if (target.hasAttribute("data-close-modal")) {
    closeModals();
  }
});

document.addEventListener("click", event => {
  const scene = event.target.closest(".scene-chip");
  if (scene) {
    els(".scene-chip").forEach(chip => chip.classList.toggle("active", chip === scene));
    renderToday(scene.dataset.scene);
  }

  const filter = event.target.closest(".filter-chip");
  if (filter) {
    state.filter = filter.dataset.filter;
    renderWardrobe();
  }

  const closetCard = event.target.closest("[data-closet-item]");
  if (closetCard) {
    const id = parseInt(closetCard.dataset.closetItem);
    if (state.selectionMode) {
      state.selected.has(id) ? state.selected.delete(id) : state.selected.add(id);
      renderWardrobe();
    } else if (!closetCard.classList.contains("swiped-left") && !closetCard.classList.contains("swiped-right")) {
      openItem(id);
    }
  }

  const thumb = event.target.closest("[data-remove-thumb]");
  if (thumb) {
    state.upload.splice(Number(thumb.dataset.removeThumb), 1);
    renderThumbs();
  }

  const history = event.target.closest("[data-history]");
  if (history) {
    history.classList.toggle("expanded");
    if (history.classList.contains("expanded")) showToast("已展开当日搭配详情");
    else showPage("outfitDetail", "inspiration");
  }
});

el("#wardrobeGrid").addEventListener("click", event => {
  if (event.target === el("#wardrobeGrid") && state.selectionMode) setSelectionMode(false);
});

el("#selectAll").addEventListener("click", () => {
  if (state.selected.size >= state.items.length) state.selected.clear();
  else state.items.forEach(item => state.selected.add(item.id));
  renderWardrobe();
});

el("#deleteSelected").addEventListener("click", handleDeleteSelected);

el("#batchEdit").addEventListener("click", () => openModal("batch"));

el("#prevAnalysis").addEventListener("click", () => {
  state.analysisIndex = Math.max(1, state.analysisIndex - 1);
  renderAnalysis();
});

el("#nextAnalysis").addEventListener("click", () => {
  if (state.analysisIndex >= 5) {
    showToast("5件已存入我的衣橱");
    state.analysisIndex = 2;
    renderAnalysis();
    showPage("newUpload", "newUpload");
  } else {
    state.analysisIndex += 1;
    renderAnalysis();
  }
});

el("#closetName").addEventListener("input", validateClosetName);
el("#createCloset").addEventListener("click", () => {
  if (!el("#closetName").value.trim()) return;
  const jumpProfile = el("#profileMode").value === "立即设置";
  closeModals();
  showToast("衣橱创建成功");
  showPage(jumpProfile ? "bodyProfile" : "profile", "profile");
});

els(".modal-backdrop").forEach(backdrop => {
  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) closeModals();
  });
});

el("#saveAddItem").addEventListener("click", handleAddItem);

el("#deleteDetailItem").addEventListener("click", () => {
  const detailName = el("#detailName").textContent;
  const item = state.items.find(i => i.name === detailName);
  if (item) {
    handleDeleteItem(item.id);
  }
});

async function initApp() {
  await loadItems();
  renderToday();
  renderWardrobe();
  renderThumbs();
  renderAnalysis();
  renderInspiration();
}

initApp();
