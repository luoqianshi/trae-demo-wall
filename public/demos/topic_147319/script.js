const foods = Array.isArray(window.HONGLOU_FOODS) ? window.HONGLOU_FOODS : [];

let currentFoodId = foods[0]?.id || null;
let recentRandomIds = [];
let lastFocusElement = null;

const reduceMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileMedia = window.matchMedia("(max-width: 900px)");

// 菜品错峰延迟：开启后等盒盖先动，再按顺序淡入上浮
function getDishDelay(index) {
  if (reduceMotionMedia.matches) return "0ms";
  const isMobile = mobileMedia.matches;
  const initial = isMobile ? 120 : 180;
  const step = isMobile ? 35 : 70;
  return `${initial + index * step}ms`;
}

const foodBox = document.querySelector("[data-food-box]");
const foodGrid = document.querySelector("[data-food-grid]");
const cardList = document.querySelector("[data-card-list]");
const dialog = document.querySelector("[data-dialog]");
const randomCard = document.querySelector("[data-random-card]");
const randomDetailButton = document.querySelector("[data-random-detail]");
const openBoxButton = document.querySelector("[data-open-box]");
const randomButton = document.querySelector("[data-random]");
const closeButton = document.querySelector("[data-close]");
const toast = document.querySelector("[data-toast]");

function safeImage(image, food) {
  image.onerror = () => {
    image.onerror = null;
    image.removeAttribute("src");
    image.alt = `${food.name}图片暂未加载`;
    image.classList.add("image-fallback");
  };
  image.onload = () => image.classList.remove("image-fallback");
}

function createFoodButton(food, index, compact = false) {
  const button = document.createElement("button");
  button.className = compact ? "dish-cell" : "dish-card";
  button.type = "button";
  button.dataset.foodId = food.id;
  button.setAttribute("aria-label", `查看${food.name}的文学场景`);

  const image = document.createElement("img");
  image.src = food.image;
  image.alt = food.name;
  image.loading = "lazy";
  image.decoding = "async";
  safeImage(image, food);

  const title = document.createElement(compact ? "strong" : "h3");
  title.textContent = food.name;
  const subtitle = document.createElement("p");
  subtitle.textContent = food.subtitle;
  if (compact) {
    subtitle.className = "cell-subtitle";
    // 开启前：菜品不可被键盘聚焦，也不读屏，直到 openBox() 释放
    button.tabIndex = -1;
    button.setAttribute("aria-hidden", "true");
    button.style.transitionDelay = getDishDelay(index);
  }

  button.append(image, title, subtitle);
  button.addEventListener("click", () => openDetail(food.id, button));
  return button;
}

function renderFoods() {
  foodGrid.innerHTML = "";
  cardList.innerHTML = "";

  if (!foods.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "菜品数据暂未载入，请确认 foods-data.js 与网页位于同一目录。";
    cardList.append(empty);
    openBoxButton.disabled = true;
    randomButton.disabled = true;
    return;
  }

  foods.forEach((food, index) => {
    foodGrid.append(createFoodButton(food, index, true));
    cardList.append(createFoodButton(food, index, false));
  });
}

function openBox({ announce = true } = {}) {
  foodBox.classList.add("is-open");
  foodGrid.querySelectorAll(".dish-cell").forEach((cell) => {
    cell.tabIndex = 0;
    cell.removeAttribute("aria-hidden");
  });
  openBoxButton.setAttribute("aria-expanded", "true");
  openBoxButton.textContent = "食盒已开启";
  if (announce) showToast("食盒已开启");
}

function pickRandomFood() {
  if (!foods.length) return;
  const excludeIds = recentRandomIds;
  const candidates = foods.filter((food) => !excludeIds.includes(food.id));
  const pool = candidates.length >= 1 ? candidates : foods;
  const food = pool[Math.floor(Math.random() * pool.length)];
  recentRandomIds = [food.id, ...recentRandomIds].slice(0, 3);
  currentFoodId = food.id;
  renderRandom(food);
  openBox({ announce: false });
  showToast(`抽到：${food.name}`);
  animateRandomCard();
  document.querySelector(".random-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function animateRandomCard() {
  randomCard.classList.remove("is-changing", "is-pulse", "is-shake");
  window.requestAnimationFrame(() => {
    randomCard.classList.add("is-changing");
    if (!reduceMotionMedia.matches) {
      window.setTimeout(() => randomCard.classList.add("is-pulse"), 100);
      window.setTimeout(() => randomCard.classList.add("is-shake"), 200);
    }
  });
}

function renderRandom(food) {
  const image = randomCard.querySelector("img");
  image.classList.remove("image-fallback");
  image.src = food.image || "";
  image.alt = food.name || "菜品";
  if (!food.image) {
    image.classList.add("image-fallback");
    image.alt = `${food.name || "菜品"}图片暂未提供`;
  }
  safeImage(image, food);
  randomCard.querySelector(".random-name").textContent = food.name || "未知菜品";
  randomCard.querySelector(".random-desc").textContent = food.subtitle || "";
  const peopleText = Array.isArray(food.people) && food.people.length ? food.people.join("、") : "未提及";
  const placeText = food.place || "未提及";
  randomCard.querySelector(".random-meta").textContent = `人物：${peopleText} · 地点：${placeText}`;
}

function openDetail(foodId, trigger = document.activeElement) {
  const food = foods.find((item) => item.id === foodId) || foods[0];
  if (!food) return;
  currentFoodId = food.id;
  lastFocusElement = trigger instanceof HTMLElement ? trigger : null;

  setText("[data-detail-chapter]", food.chapter);
  setText("[data-detail-title]", food.name);
  setText("[data-detail-summary]", food.subtitle);
  setText("[data-detail-scene]", food.scene);
  setText("[data-detail-relationship]", food.relationship);
  setText("[data-detail-meaning]", food.meaning);
  setText("[data-detail-modern]", food.modern);
  setText("[data-detail-quote]", food.quote);
  setText("[data-detail-culture]", food.culture);

  const image = document.querySelector("[data-detail-image]");
  image.classList.remove("image-fallback");
  image.src = food.image;
  image.alt = food.name;
  safeImage(image, food);

  const source = document.querySelector("[data-detail-source]");
  if (food.sourceUrl) {
    source.href = food.sourceUrl;
    source.hidden = false;
  } else {
    source.hidden = true;
  }

  const tagRow = document.querySelector("[data-detail-tags]");
  tagRow.innerHTML = "";
  [...new Set([...food.tags, food.place, ...food.people.slice(0, 2)])].forEach((tagText) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = tagText;
    tagRow.append(tag);
  });

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
  replaceHashSafely(`#detail=${encodeURIComponent(food.id)}`);
  window.requestAnimationFrame(() => closeButton.focus());
}

function closeDetail({ restoreHash = true } = {}) {
  if (dialog.open && typeof dialog.close === "function") dialog.close();
  dialog.removeAttribute("open");
  if (restoreHash && window.location.hash.startsWith("#detail=")) {
    replaceHashSafely("");
  }
  window.requestAnimationFrame(() => {
    if (lastFocusElement && typeof lastFocusElement.focus === "function") {
      lastFocusElement.focus();
    }
  });
}

function replaceHashSafely(hash) {
  try {
    const base = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", hash || base);
  } catch {
    // file://、受限预览器或空来源环境可能禁止 History API。
    // 地址栏状态不是核心功能，失败时保持当前页面即可。
  }
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value || "";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

openBoxButton.addEventListener("click", () => openBox());
randomButton.addEventListener("click", pickRandomFood);
closeButton.addEventListener("click", () => closeDetail());
randomDetailButton.addEventListener("click", () => openDetail(currentFoodId, randomDetailButton));

dialog.addEventListener("click", (event) => {
  const rect = dialog.getBoundingClientRect();
  const inDialog =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom;
  if (!inDialog) closeDetail();
});

dialog.addEventListener("close", () => {
  if (window.location.hash.startsWith("#detail=")) {
    replaceHashSafely("");
  }
  lastFocusElement?.focus?.();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && dialog.open) closeDetail();
});

renderFoods();
if (foods[0]) renderRandom(foods[0]);

window.addEventListener("hashchange", applyHashState);
window.requestAnimationFrame(applyHashState);

function applyHashState() {
  const hash = decodeURIComponent(window.location.hash || "");
  if (hash === "#open") {
    openBox();
    return;
  }
  if (hash === "#random") {
    pickRandomFood();
    return;
  }
  if (hash.startsWith("#detail=")) {
    openBox({ announce: false });
    openDetail(hash.slice("#detail=".length), null);
  }
}
