/*
  MySpace Studio 交互脚本
  功能包括：自由换肤、番茄专注时钟、实时进程 localStorage、本地文件临时接收、轻量音乐播放器
*/

// ==============================
// 通用工具
// ==============================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const storageKeys = {
  tasks: "myspace-studio-tasks",
  background: "myspace-studio-background",
  backgroundSlides: "myspace-studio-background-slides",
  city: "myspace-studio-city",
  focusMinutes: "myspace-studio-focus-minutes",
  customTracks: "myspace-studio-custom-tracks",
  dailyFocus: "myspace-studio-daily-focus"
};

let toastTimer = null;

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

// 将秒数格式化为 00:00
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

// 文件大小转为更友好的显示格式
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ==============================
// 今日专注值
// ==============================

let dailyFocusState = {
  date: "",
  value: 0,
  focusRemainderMs: 0
};

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function loadDailyFocusState() {
  const today = getTodayKey();

  try {
    const saved = JSON.parse(localStorage.getItem(storageKeys.dailyFocus));
    if (saved?.date === today) {
      dailyFocusState = {
        date: today,
        value: Math.min(Math.max(Number(saved.value) || 0, 0), 100),
        focusRemainderMs: Math.max(Number(saved.focusRemainderMs) || 0, 0)
      };
    } else {
      dailyFocusState = { date: today, value: 0, focusRemainderMs: 0 };
    }
  } catch {
    dailyFocusState = { date: today, value: 0, focusRemainderMs: 0 };
  }
}

function saveDailyFocusState() {
  localStorage.setItem(storageKeys.dailyFocus, JSON.stringify(dailyFocusState));
}

function renderDailyFocus() {
  const fill = $("#dailyFocusFill");
  const text = $("#dailyFocusText");
  if (!fill || !text) return;

  const value = Math.min(Math.max(dailyFocusState.value, 0), 100);
  fill.style.width = `${value}%`;
  text.textContent = `${value}%`;
}

function addDailyFocus(amount = 10) {
  dailyFocusState.value = Math.min(100, dailyFocusState.value + amount);
  saveDailyFocusState();
  renderDailyFocus();

  const bar = $(".daily-focus-bar");
  if (bar) {
    bar.classList.remove("is-boosting");
    void bar.offsetWidth;
    bar.classList.add("is-boosting");
  }
}

function initDailyFocus() {
  loadDailyFocusState();
  renderDailyFocus();
}

// ==============================
// 1. 自由换肤系统
// ==============================

const presetBackgrounds = {
  forest: [
    "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2400&q=85",
    "https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=2400&q=85",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=85",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=85"
  ],
  cyber: [
    "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2400&q=85",
    "https://images.unsplash.com/photo-1515630278258-407f66498911?auto=format&fit=crop&w=2400&q=85",
    "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=2400&q=85",
    "https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?auto=format&fit=crop&w=2400&q=85"
  ],
  city: [
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=2400&q=85",
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=2400&q=85",
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?auto=format&fit=crop&w=2400&q=85",
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=2400&q=85"
  ]
};

const cityBackgroundLibrary = {
  "上海": [
    "https://images.unsplash.com/photo-1548919973-5cef591cdbc9?auto=format&fit=crop&w=2400&q=85",
    "https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?auto=format&fit=crop&w=2400&q=85"
  ],
  "shanghai": [
    "https://images.unsplash.com/photo-1548919973-5cef591cdbc9?auto=format&fit=crop&w=2400&q=85",
    "https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?auto=format&fit=crop&w=2400&q=85"
  ],
  "北京": ["https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=2400&q=85"],
  "beijing": ["https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=2400&q=85"],
  "深圳": presetBackgrounds.city,
  "shenzhen": presetBackgrounds.city,
  "东京": ["https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=2400&q=85"],
  "tokyo": ["https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=2400&q=85"],
  "纽约": ["https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=2400&q=85"],
  "new york": ["https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=2400&q=85"],
  "香港": ["https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=2400&q=85"],
  "hong kong": ["https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=2400&q=85"],
  "伦敦": ["https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=2400&q=85"],
  "london": ["https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=2400&q=85"],
  "巴黎": ["https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=2400&q=85"],
  "paris": ["https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=2400&q=85"],
  "新加坡": ["https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=2400&q=85"],
  "singapore": ["https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=2400&q=85"]
};

const presetBackgroundLabels = {
  forest: "静谧森林",
  cyber: "赛博朋克",
  city: "现代都市"
};

const themeSearchProfiles = {
  forest: {
    theme: "forest",
    searches: [
      { host: "commons.wikimedia.org", query: "forest landscape wallpaper nature" },
      { host: "en.wikipedia.org", query: "forest landscape nature" },
      { host: "commons.wikimedia.org", query: "misty forest trail" }
    ]
  },
  cyber: {
    theme: "city",
    searches: [
      { host: "commons.wikimedia.org", query: "night city neon skyline" },
      { host: "commons.wikimedia.org", query: "cyberpunk neon city night" },
      { host: "en.wikipedia.org", query: "neon city night skyline" }
    ]
  },
  city: {
    theme: "city",
    searches: [
      { host: "commons.wikimedia.org", query: "modern city skyline architecture night" },
      { host: "en.wikipedia.org", query: "modern city skyline architecture" },
      { host: "commons.wikimedia.org", query: "urban skyline downtown night city" }
    ]
  }
};

const defaultBackground = presetBackgrounds.forest[0];
let citySearchToken = 0;
let themeSearchToken = 0;
let backgroundSlideUrls = [];
let backgroundSlideIndex = 0;
let backgroundSlideTimer = null;

const themeValidationRules = {
  forest: {
    required: ["forest", "woodland", "trees", "nature", "landscape", "trail", "mist", "green"],
    blocked: ["logo", "flag", "map", "diagram", "portrait", "person", "animal", "svg"]
  },
  city: {
    required: ["city", "skyline", "urban", "downtown", "architecture", "building", "tower", "night", "street", "metropolis", "neon", "cyberpunk", "城市", "天际线", "建筑", "市中心"],
    blocked: ["flag", "logo", "seal", "map", "coat_of_arms", "portrait", "person", "animal", "diagram", "locator", "地圖", "地图", "旗帜", "svg"]
  }
};

function updateBackgroundSlideshowStatus(message) {
  const status = $("#bgSlideshowStatus");
  if (status) status.textContent = message;
}

function normalizeBackgroundUrls(urls) {
  return [...new Set((Array.isArray(urls) ? urls : [urls]).filter(Boolean))];
}

function isKnownThemeUrl(url, theme) {
  if (!theme) return true;
  if (normalizeBackgroundUrls(presetBackgrounds[theme]).includes(url)) return true;
  if (theme === "city") {
    return Object.values(cityBackgroundLibrary)
      .flatMap((item) => normalizeBackgroundUrls(item))
      .includes(url);
  }
  return false;
}

function hasBlockedImageFormat(url) {
  return /\.(svg|gif)(\?|#|$)/i.test(url) || /\/thumb\/.*\.svg\//i.test(url);
}

function looksLikeThemeCandidate(candidate, theme) {
  if (!theme || !themeValidationRules[theme]) return true;
  const url = typeof candidate === "string" ? candidate : candidate.url;
  const title = typeof candidate === "string" ? "" : candidate.title || "";
  if (!url) return false;
  if (theme && url.startsWith("data:image")) return false;
  if (hasBlockedImageFormat(url)) return false;
  if (isKnownThemeUrl(url, theme)) return true;

  const haystack = `${url} ${title}`.toLowerCase();
  const rules = themeValidationRules[theme];
  const hasBlockedWord = rules.blocked.some((word) => haystack.includes(word.toLowerCase()));
  if (hasBlockedWord) return false;

  return rules.required.some((word) => haystack.includes(word.toLowerCase()));
}

function filterBackgroundUrlsByTheme(items, theme, fallbackUrls = []) {
  const normalizedItems = (Array.isArray(items) ? items : [items]).filter(Boolean);
  const filteredUrls = normalizedItems
    .filter((item) => looksLikeThemeCandidate(item, theme))
    .map((item) => typeof item === "string" ? item : item.url)
    .filter(Boolean);

  return normalizeBackgroundUrls(filteredUrls.length > 0 ? filteredUrls : fallbackUrls);
}

function stopBackgroundSlideshow() {
  if (backgroundSlideTimer) {
    clearInterval(backgroundSlideTimer);
    backgroundSlideTimer = null;
  }
}

function applyBackgroundImage(url) {
  if (!url) return;
  document.documentElement.style.setProperty("--bg-image", `url("${url}")`);
  localStorage.setItem(storageKeys.background, url);
}

function testWallpaperImage(url) {
  return new Promise((resolve) => {
    if (!url || hasBlockedImageFormat(url) || url.startsWith("data:image")) {
      resolve(false);
      return;
    }

    const image = new Image();
    const timer = setTimeout(() => {
      image.onload = null;
      image.onerror = null;
      resolve(false);
    }, 6500);

    image.onload = () => {
      clearTimeout(timer);
      resolve(image.naturalWidth > 0 && image.naturalHeight > 0);
    };

    image.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };

    image.referrerPolicy = "no-referrer";
    image.src = url;
  });
}

async function validateWallpaperUrls(urls, limit = 6) {
  const normalizedUrls = normalizeBackgroundUrls(urls);
  const validUrls = [];

  for (const url of normalizedUrls) {
    if (validUrls.length >= limit) break;
    if (await testWallpaperImage(url)) {
      validUrls.push(url);
    }
  }

  return validUrls;
}

function setBackground(url) {
  stopBackgroundSlideshow();
  backgroundSlideUrls = [];
  backgroundSlideIndex = 0;
  localStorage.removeItem(storageKeys.backgroundSlides);
  applyBackgroundImage(url);
  updateBackgroundSlideshowStatus("当前为单张自定义背景。选择预设或城市后会重新开启壁纸轮播。");
}

function saveBackgroundSlideshow(urls, label, theme = "") {
  localStorage.setItem(storageKeys.backgroundSlides, JSON.stringify({
    urls,
    label,
    theme,
    validated: true,
    index: backgroundSlideIndex,
    savedAt: new Date().toISOString()
  }));
}

function setBackgroundSlideshow(urls, label = "背景", theme = "") {
  const fallbackUrls = theme && presetBackgrounds[theme] ? presetBackgrounds[theme] : urls;
  const normalizedUrls = theme
    ? filterBackgroundUrlsByTheme(urls, theme, fallbackUrls)
    : normalizeBackgroundUrls(urls);
  if (normalizedUrls.length === 0) return;

  stopBackgroundSlideshow();
  backgroundSlideUrls = normalizedUrls;
  backgroundSlideIndex = 0;
  applyBackgroundImage(backgroundSlideUrls[backgroundSlideIndex]);
  saveBackgroundSlideshow(backgroundSlideUrls, label, theme);

  if (backgroundSlideUrls.length === 1) {
    updateBackgroundSlideshowStatus(`${label} 目前只有 1 张可用壁纸，已作为固定背景显示。`);
    return;
  }

  updateBackgroundSlideshowStatus(`${label} 轮播已开启，共 ${backgroundSlideUrls.length} 张壁纸，每 18 秒自动切换。`);
  backgroundSlideTimer = setInterval(() => {
    backgroundSlideIndex = (backgroundSlideIndex + 1) % backgroundSlideUrls.length;
    applyBackgroundImage(backgroundSlideUrls[backgroundSlideIndex]);
    saveBackgroundSlideshow(backgroundSlideUrls, label, theme);
    updateBackgroundSlideshowStatus(`${label} 轮播中：第 ${backgroundSlideIndex + 1} / ${backgroundSlideUrls.length} 张。`);
  }, 18000);
}

function restoreBackgroundSlideshow() {
  try {
    const savedSlides = JSON.parse(localStorage.getItem(storageKeys.backgroundSlides));
    if (Array.isArray(savedSlides?.urls) && savedSlides.urls.length > 0) {
      if (savedSlides.label === "二次元动漫" || savedSlides.theme === "anime") {
        localStorage.removeItem(storageKeys.backgroundSlides);
        return false;
      }
      if (["静谧森林", "赛博朋克", "现代都市"].includes(savedSlides.label) && savedSlides.theme) {
        localStorage.removeItem(storageKeys.backgroundSlides);
        return false;
      }
      if (savedSlides.theme && !savedSlides.validated) {
        localStorage.removeItem(storageKeys.backgroundSlides);
        return false;
      }
      if (savedSlides.theme && savedSlides.urls.some((url) => String(url).startsWith("data:image"))) {
        localStorage.removeItem(storageKeys.backgroundSlides);
        return false;
      }
      setBackgroundSlideshow(savedSlides.urls, savedSlides.label || "背景", savedSlides.theme || "");
      backgroundSlideIndex = Math.min(Math.max(Number(savedSlides.index) || 0, 0), savedSlides.urls.length - 1);
      applyBackgroundImage(savedSlides.urls[backgroundSlideIndex]);
      return true;
    }
  } catch {
    // 保存的轮播状态不可用时忽略，继续走单张背景兼容逻辑
  }

  return false;
}

function getCuratedCityBackgroundUrls(cityName) {
  const normalizedCity = cityName.trim();
  if (!normalizedCity) return [];

  const cityKey = normalizedCity.toLowerCase();
  return normalizeBackgroundUrls(cityBackgroundLibrary[normalizedCity] || cityBackgroundLibrary[cityKey] || []);
}

async function searchCityBackgroundOnline(cityName) {
  const normalizedCity = cityName.trim();
  if (!normalizedCity) return [];

  const searches = [
    {
      host: "zh.wikipedia.org",
      query: `${normalizedCity} 城市 天际线`
    },
    {
      host: "en.wikipedia.org",
      query: `${normalizedCity} skyline city`
    },
    {
      host: "commons.wikimedia.org",
      query: `${normalizedCity} skyline city architecture`
    }
  ];

  return searchBackgroundImagesOnline(searches, "city");
}

async function searchBackgroundImagesOnline(searches, theme = "") {
  for (const search of searches) {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: search.query,
      gsrlimit: "8",
      prop: "pageimages",
      piprop: "thumbnail",
      pithumbsize: "2400",
      format: "json",
      origin: "*"
    });

    try {
      const response = await fetch(`https://${search.host}/w/api.php?${params.toString()}`);
      if (!response.ok) continue;

      const data = await response.json();
      const pages = Object.values(data.query?.pages || {});
      const candidates = pages
        .map((page) => ({
          url: page.thumbnail?.source,
          title: page.title || "",
          width: page.thumbnail?.width,
          height: page.thumbnail?.height
        }))
        .filter((item) => item.url)
        .filter((item) => looksLikeThemeCandidate(item, theme));

      const urls = [...new Set(
        candidates
          .map((item) => item.url)
      )].slice(0, 6);

      const relaxedUrls = [...new Set(
        pages
          .map((page) => ({
            url: page.thumbnail?.source,
            title: page.title || "",
            width: page.thumbnail?.width,
            height: page.thumbnail?.height
          }))
          .filter((item) => item.url)
          .filter((item) => !/logo|flag|seal|map|locator|portrait|person|poster|cover/i.test(`${item.url} ${item.title}`))
          .filter((item) => !hasBlockedImageFormat(item.url))
          .map((item) => item.url)
      )].slice(0, 6);

      if (urls.length > 0) {
        const validUrls = await validateWallpaperUrls(urls);
        if (validUrls.length > 0) return validUrls;
      }
      if (relaxedUrls.length > 0 && search.host === "commons.wikimedia.org") {
        const filteredUrls = theme ? filterBackgroundUrlsByTheme(relaxedUrls, theme, []) : relaxedUrls;
        const validUrls = await validateWallpaperUrls(filteredUrls);
        if (validUrls.length > 0) return validUrls;
      }
    } catch {
      // 当前图源不可用时继续尝试下一个图源
    }
  }

  return [];
}

async function resolveThemeBackgroundUrls(key) {
  const profile = themeSearchProfiles[key];
  if (!profile) {
    return {
      urls: normalizeBackgroundUrls(presetBackgrounds[key] || []),
      source: "fallback"
    };
  }

  const onlineUrls = await searchBackgroundImagesOnline(profile.searches, profile.theme);
  const validOnlineUrls = await validateWallpaperUrls(onlineUrls);
  if (validOnlineUrls.length > 0) {
    return {
      urls: validOnlineUrls,
      source: "online",
      theme: profile.theme
    };
  }

  return {
    urls: normalizeBackgroundUrls(presetBackgrounds[key] || []),
    source: "fallback",
    theme: profile.theme
  };
}

async function resolveCityBackgroundUrl(cityName) {
  const onlineUrls = await searchCityBackgroundOnline(cityName);
  const validOnlineUrls = await validateWallpaperUrls(onlineUrls);
  if (validOnlineUrls.length > 0) {
    return {
      urls: validOnlineUrls,
      source: "online"
    };
  }

  return {
    urls: presetBackgrounds.city,
    source: "fallback"
  };
}

async function applyCityBackground(cityName) {
  const normalizedCity = cityName.trim();
  if (!normalizedCity) {
    showToast("请先输入你想使用的城市名。");
    return;
  }

  const currentToken = citySearchToken + 1;
  citySearchToken = currentToken;
  const button = $("#applyCityBgBtn");
  const previousButtonText = button?.textContent || "";

  if (button) {
    button.disabled = true;
    button.textContent = "搜索中...";
  }
  showToast(`正在联网搜索 ${normalizedCity} 的城市背景...`);

  try {
    const result = await resolveCityBackgroundUrl(normalizedCity);
    if (currentToken !== citySearchToken) return;

    setBackgroundSlideshow(result.urls, `${normalizedCity} 城市背景`, "city");
    localStorage.setItem(storageKeys.city, normalizedCity);

    if (result.source === "curated") {
      showToast(`已切换为 ${normalizedCity} 精选城市轮播背景。`);
    } else if (result.source === "online") {
      showToast(`已联网找到 ${normalizedCity} 城市轮播背景。`);
    } else {
      showToast(`暂未搜索到 ${normalizedCity}，已使用现代都市轮播背景。`);
    }
  } finally {
    if (button && currentToken === citySearchToken) {
      button.disabled = false;
      button.textContent = previousButtonText || "联网搜索城市背景";
    }
  }
}

function applyPresetBackground(key) {
  const label = presetBackgroundLabels[key] || "背景";
  const urls = normalizeBackgroundUrls(presetBackgrounds[key] || []);
  if (urls.length === 0) {
    showToast(`${label}背景暂不可用。`);
    return;
  }

  setBackgroundSlideshow(urls, label, "");
  if (key === "city") localStorage.removeItem(storageKeys.city);
  showToast(`已切换为${label}轮播背景。`);
}

function resetBackground() {
  localStorage.removeItem(storageKeys.city);
  applyPresetBackground("forest");
}

function initBackgroundSwitcher() {
  const hasRestoredSlides = restoreBackgroundSlideshow();
  const savedBackground = localStorage.getItem(storageKeys.background);
  if (!hasRestoredSlides && savedBackground) {
    applyBackgroundImage(savedBackground);
    updateBackgroundSlideshowStatus("当前为上次保存的单张背景。选择预设或城市后会开启壁纸轮播。");
  } else if (!hasRestoredSlides) {
    applyPresetBackground("forest");
  }

  const savedCity = localStorage.getItem(storageKeys.city);
  if (savedCity && $("#cityBgInput")) $("#cityBgInput").value = savedCity;

  $$(".chip[data-bg]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.bg;
      applyPresetBackground(key);
    });
  });

  $("#applyBgBtn").addEventListener("click", () => {
    const url = $("#bgUrlInput").value.trim();
    if (!url) {
      showToast("请先粘贴一张网络图片 URL。");
      return;
    }
    setBackground(url);
    $("#bgUrlInput").value = "";
    showToast("背景已更新。");
  });

  $("#applyCityBgBtn")?.addEventListener("click", () => {
    applyCityBackground($("#cityBgInput").value);
  });

  $("#cityBgInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyCityBackground(event.currentTarget.value);
    }
  });

  $$(".city-presets [data-city]").forEach((button) => {
    button.addEventListener("click", () => {
      const cityName = button.dataset.city;
      $("#cityBgInput").value = cityName;
      applyCityBackground(cityName);
    });
  });

  $("#resetBgBtn")?.addEventListener("click", resetBackground);
}

// 将本地选择的图片压缩成适合保存为工作台背景的数据
function compressImageToDataUrl(file, maxSize = 1800, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.onerror = reject;
      image.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function initLocalWallpaperPicker() {
  const input = $("#localWallpaperInput");
  const button = $("#localWallpaperBtn");

  if (!input || !button) return;

  button.addEventListener("click", () => input.click());
  input.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("请选择图片文件。");
      return;
    }

    try {
      const dataUrl = await compressImageToDataUrl(file);
      setBackground(dataUrl);
      showToast("本地图片已设为工作台壁纸。");
    } catch {
      showToast("壁纸设置失败，请换一张图片重试。");
    } finally {
      input.value = "";
    }
  });
}

// ==============================
// 2. 番茄专注时钟
// ==============================

let focusMinutes = Number(localStorage.getItem(storageKeys.focusMinutes)) || 25;
let remainingSeconds = focusMinutes * 60;
let timerId = null;
let expectedEndTime = null;
let lastFocusProgressAt = null;
let currentMood = "";
let tiredTimeChangeAttempts = 0;
let exitGuardAttempts = 0;
let allowLeavingWorkspace = false;
let focusSessionStarted = false;

const timerDisplay = $("#timerDisplay");
const timerStatus = $("#timerStatus");

const companionMessages = {
  start: [
    "很好，现在只需要把注意力轻轻放回眼前这一件事。",
    "这一轮不用追求完美，只要稳稳开始就已经很棒。",
    "把世界调成静音，我们一起进入一段安静的专注。",
    "慢慢来，先做一点点，状态会在行动里长出来。",
    "你已经按下开始了，剩下的交给节奏和时间。"
  ],
  pause: [
    "暂停不是退后，是给自己一点呼吸的空间。",
    "没关系，先缓一缓，等心安静下来再继续。",
    "你可以停一会儿，专注也需要被温柔地照顾。",
    "休息片刻也很好，重新开始时依然算数。",
    "把肩膀放松一下，你已经做得够认真了。"
  ],
  reset: [
    "重新开始没有关系，每一次重置都是新的入口。",
    "我们把刚才放下，从这一刻重新整理节奏。",
    "清空计时，不清空努力；下一轮可以更轻盈。",
    "没完成也没关系，愿意再来一次就是很好的力量。",
    "新的时间已经准备好，你可以按自己的速度再出发。"
  ],
  finish: [
    "这一轮完成了，辛苦你了，记得给自己一点肯定。",
    "你刚刚守住了一段专注时间，这很值得被看见。",
    "做得很好，现在可以安心休息一下了。",
    "时间抵达终点，你也完成了一次温柔而坚定的陪跑。",
    "恭喜完成这一轮，哪怕只是推进一点点，也很珍贵。"
  ]
};

function getRandomMessage(scene) {
  const messages = companionMessages[scene] || companionMessages.start;
  return messages[Math.floor(Math.random() * messages.length)];
}

function updateCompanionBubble(scene) {
  const bubble = $("#companionBubble");
  const note = $("#kindNote");
  if (!bubble) return;

  bubble.classList.add("is-changing");

  setTimeout(() => {
    const message = getRandomMessage(scene);
    bubble.textContent = message;
    if (note) note.textContent = message;
    bubble.classList.remove("is-changing");
  }, 180);
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(remainingSeconds);
}

function shouldBlockTiredTimeChange(minutes, force = false) {
  if (force || currentMood !== "tired") return false;
  if (Number(minutes) === 10) return false;
  if (tiredTimeChangeAttempts >= 3) return false;

  tiredTimeChangeAttempts += 1;
  const messages = [
    "先别急着加时长。你刚刚选择了疲惫，我们只做一个 10 分钟的小任务，完成一点点就很好。",
    "我再拦你一次：疲惫的时候更需要轻量开始。先守住这 10 分钟，如果结束后还想继续，我们再加时长。",
    "我感受到了你的意志，长风破浪会有时，直挂云帆济沧海。既然你仍然想继续，我会尊重你的选择；这一次之后，你就可以修改时长了。"
  ];
  const message = messages[tiredTimeChangeAttempts - 1];
  timerStatus.textContent = "疲惫模式：建议保持 10 分钟";
  showToast(message);
  const bubble = $("#companionBubble");
  const note = $("#kindNote");
  if (bubble) bubble.textContent = message;
  if (note) note.textContent = message;
  return true;
}

function setFocusMinutes(minutes, options = {}) {
  if (shouldBlockTiredTimeChange(minutes, options.force)) {
    $$(".quick-times button").forEach((button) => {
      button.classList.toggle("active", Number(button.dataset.minutes) === focusMinutes);
    });
    return false;
  }

  const safeMinutes = Math.min(Math.max(Number(minutes), 1), 180);
  focusMinutes = safeMinutes;
  remainingSeconds = safeMinutes * 60;
  localStorage.setItem(storageKeys.focusMinutes, String(safeMinutes));
  updateTimerDisplay();
  timerStatus.textContent = `已设定 ${safeMinutes} 分钟专注`;

  $$(".quick-times button").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.minutes) === safeMinutes);
  });
  return true;
}

// 使用 Web Audio API 生成柔和提示音，避免依赖外部音效文件
function playSoftBell() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const audioContext = new AudioContext();
  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  gain.connect(audioContext.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.08);
    oscillator.connect(gain);
    oscillator.start(now + index * 0.08);
    oscillator.stop(now + 1.8);
  });
}

function finishTimer() {
  clearInterval(timerId);
  timerId = null;
  lastFocusProgressAt = null;
  remainingSeconds = 0;
  updateTimerDisplay();
  timerStatus.textContent = "本轮专注已完成，辛苦了";
  updateCompanionBubble("finish");
  playSoftBell();
  showToast("专注时间结束，休息一下吧。");
}

function startTimer() {
  if (timerId) return;
  if (remainingSeconds <= 0) remainingSeconds = focusMinutes * 60;

  focusSessionStarted = true;
  expectedEndTime = Date.now() + remainingSeconds * 1000;
  lastFocusProgressAt = Date.now();
  timerStatus.textContent = "正在专注中，请保持节奏";
  updateCompanionBubble("start");
  showToast("专注开始，先把注意力放在眼前这一件事。");

  timerId = setInterval(() => {
    const now = Date.now();
    if (lastFocusProgressAt) {
      dailyFocusState.focusRemainderMs += now - lastFocusProgressAt;
      lastFocusProgressAt = now;

      while (dailyFocusState.focusRemainderMs >= 5 * 60 * 1000) {
        dailyFocusState.focusRemainderMs -= 5 * 60 * 1000;
        addDailyFocus(10);
      }

      saveDailyFocusState();
    }

    remainingSeconds = Math.max(0, Math.ceil((expectedEndTime - Date.now()) / 1000));
    updateTimerDisplay();

    if (remainingSeconds <= 0) {
      finishTimer();
    }
  }, 250);
}

function pauseTimer() {
  if (!timerId) return;
  clearInterval(timerId);
  timerId = null;
  lastFocusProgressAt = null;
  timerStatus.textContent = "已暂停，随时可以继续";
  updateCompanionBubble("pause");
  showToast("已暂停，喘口气也很重要。");
}

function resetTimer() {
  clearInterval(timerId);
  timerId = null;
  lastFocusProgressAt = null;
  remainingSeconds = focusMinutes * 60;
  updateTimerDisplay();
  timerStatus.textContent = "已重置本轮专注";
  updateCompanionBubble("reset");
  showToast("已重置，随时可以重新开始。");
}

function hasUnfinishedFocusTime() {
  return focusSessionStarted && remainingSeconds > 0;
}

function initTimer() {
  setFocusMinutes(focusMinutes);

  $("#startBtn").addEventListener("click", startTimer);
  $("#pauseBtn").addEventListener("click", pauseTimer);
  $("#resetBtn").addEventListener("click", resetTimer);

  $$(".quick-times button").forEach((button) => {
    button.addEventListener("click", () => {
      pauseTimer();
      setFocusMinutes(button.dataset.minutes);
    });
  });

  $("#setCustomTimeBtn").addEventListener("click", () => {
    const value = $("#customMinutes").value;
    if (!value) {
      showToast("请输入 1 到 180 之间的分钟数。");
      return;
    }
    pauseTimer();
    setFocusMinutes(value);
    $("#customMinutes").value = "";
    showToast("自定义专注时长已设定。");
  });
}

// ==============================
// 3. 实时进程备忘录
// ==============================

let tasks = [];

function saveTasks() {
  localStorage.setItem(storageKeys.tasks, JSON.stringify(tasks));
}

function updateTaskSummary() {
  const summary = $("#taskSummaryText");
  const clearBtn = $("#clearDoneTasksBtn");
  if (!summary || !clearBtn) return;

  const total = tasks.length;
  const done = tasks.filter((task) => task.done).length;
  const pending = total - done;

  if (total === 0) {
    summary.textContent = "今天先写下一件小事就很好。";
  } else if (pending === 0) {
    summary.textContent = `已完成 ${done} 件，今天的你很稳。`;
  } else {
    summary.textContent = `待办 ${pending} 件，已完成 ${done} 件。`;
  }

  clearBtn.hidden = done === 0;
}

function playTaskPop() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const audioContext = new AudioContext();
  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  gain.connect(audioContext.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);

  const pop = audioContext.createOscillator();
  pop.type = "sine";
  pop.frequency.setValueAtTime(660, now);
  pop.frequency.exponentialRampToValueAtTime(1180, now + 0.08);
  pop.frequency.exponentialRampToValueAtTime(880, now + 0.24);
  pop.connect(gain);
  pop.start(now);
  pop.stop(now + 0.52);
}

function launchTaskFirework(targetElement) {
  const rect = targetElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const firework = document.createElement("div");
  firework.className = "task-firework";
  firework.style.left = `${centerX}px`;
  firework.style.top = `${centerY}px`;

  for (let index = 0; index < 24; index += 1) {
    const particle = document.createElement("span");
    const angle = (Math.PI * 2 * index) / 24;
    const distance = 42 + Math.random() * 58;
    particle.className = "task-particle";
    particle.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--h", `${Math.floor(Math.random() * 360)}`);
    firework.appendChild(particle);
  }

  document.body.appendChild(firework);
  setTimeout(() => firework.remove(), 900);
}

function celebrateTaskCompletion(targetElement) {
  launchTaskFirework(targetElement);
  playTaskPop();
  addDailyFocus(10);
}

function renderTasks() {
  const taskList = $("#taskList");
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "task-item";
    empty.innerHTML = `<span class="task-text">还没有任务。可以先写一件 5 分钟内能开始的小事。</span>`;
    taskList.appendChild(empty);
    updateTaskSummary();
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = `task-item ${task.done ? "done" : ""}`;
    item.innerHTML = `
      <input type="checkbox" ${task.done ? "checked" : ""} aria-label="标记任务完成" />
      <span class="task-text"></span>
      <button class="delete-task" aria-label="删除任务">×</button>
    `;

    item.querySelector(".task-text").textContent = task.text;

    item.querySelector("input").addEventListener("change", (event) => {
      task.done = event.target.checked;

      if (event.target.checked) {
        celebrateTaskCompletion(item);
        showToast("完成一件事了，给自己一点肯定。");
      }

      saveTasks();
      renderTasks();
    });

    item.querySelector(".delete-task").addEventListener("click", () => {
      tasks = tasks.filter((current) => current.id !== task.id);
      saveTasks();
      renderTasks();
      showToast("任务已移除。");
    });

    taskList.appendChild(item);
  });

  updateTaskSummary();
}

function initTasks() {
  try {
    tasks = JSON.parse(localStorage.getItem(storageKeys.tasks)) || [];
  } catch {
    tasks = [];
  }

  $("#taskForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = $("#taskInput");
    const text = input.value.trim();
    if (!text) return;

    tasks.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      text,
      done: false
    });

    input.value = "";
    saveTasks();
    renderTasks();
    showToast("已加入任务，慢慢推进就好。");
  });

  $("#clearDoneTasksBtn")?.addEventListener("click", () => {
    const doneCount = tasks.filter((task) => task.done).length;
    if (doneCount === 0) return;

    tasks = tasks.filter((task) => !task.done);
    saveTasks();
    renderTasks();
    showToast(`已清理 ${doneCount} 个完成项。`);
  });

  renderTasks();
}

// ==============================
// 4. 轻量文件接收系统
// ==============================

let acceptedFiles = [];

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function getFileExtension(fileName = "") {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

function getPreviewKind(fileItem) {
  const type = fileItem.type || "";
  const ext = getFileExtension(fileItem.name);

  if (type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (type === "application/pdf" || ext === "pdf") return "pdf";
  if (type.startsWith("text/") || ["txt", "md", "csv", "json", "html", "css", "js"].includes(ext)) return "text";
  if (type.startsWith("audio/")) return "audio";
  if (type.startsWith("video/")) return "video";
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx", "wps", "et", "dps"].includes(ext)) return "office";
  return "unknown";
}

function createSessionFileItem(file) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name: file.name,
    type: file.type,
    size: file.size,
    createdAt: new Date().toISOString(),
    url: URL.createObjectURL(file),
    file,
    source: "session"
  };
}

function decodeXmlText(xmlText) {
  try {
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    const parserError = doc.querySelector("parsererror");
    if (!parserError) {
      return doc.documentElement?.textContent || "";
    }
  } catch {
    // XML 解析失败时走正则兜底
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = xmlText
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
  return textarea.value;
}

function cleanDocumentText(text) {
  return text
    .replace(/\u0000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function inflateZipEntry(bytes, method) {
  if (method === 0) return bytes;
  if (method !== 8) throw new Error("unsupported compression");
  if (!("DecompressionStream" in window)) throw new Error("decompression unavailable");

  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

function getZipEntries(buffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let eocdOffset = -1;

  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset < 0) throw new Error("zip end not found");

  const entryCount = view.getUint16(eocdOffset + 10, true);
  let centralOffset = view.getUint32(eocdOffset + 16, true);
  const decoder = new TextDecoder("utf-8");
  const entries = [];

  for (let i = 0; i < entryCount; i += 1) {
    if (view.getUint32(centralOffset, true) !== 0x02014b50) break;

    const method = view.getUint16(centralOffset + 10, true);
    const compressedSize = view.getUint32(centralOffset + 20, true);
    const fileNameLength = view.getUint16(centralOffset + 28, true);
    const extraLength = view.getUint16(centralOffset + 30, true);
    const commentLength = view.getUint16(centralOffset + 32, true);
    const localHeaderOffset = view.getUint32(centralOffset + 42, true);
    const nameBytes = bytes.slice(centralOffset + 46, centralOffset + 46 + fileNameLength);
    const name = decoder.decode(nameBytes);

    if (view.getUint32(localHeaderOffset, true) === 0x04034b50) {
      const localNameLength = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      entries.push({
        name,
        method,
        bytes: bytes.slice(dataStart, dataStart + compressedSize)
      });
    }

    centralOffset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function getOfficeTextEntryNames(fileName) {
  const ext = getFileExtension(fileName);
  if (ext === "docx") {
    return (name) => /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/i.test(name);
  }
  if (ext === "pptx") {
    return (name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name) || /^ppt\/notesSlides\/notesSlide\d+\.xml$/i.test(name);
  }
  if (ext === "xlsx") {
    return (name) => /^xl\/sharedStrings\.xml$/i.test(name) || /^xl\/worksheets\/sheet\d+\.xml$/i.test(name);
  }
  return () => false;
}

async function extractOfficeText(fileItem) {
  if (!fileItem.file) throw new Error("missing original file");
  const ext = getFileExtension(fileItem.name);
  if (!["docx", "pptx", "xlsx"].includes(ext)) {
    throw new Error("legacy office format");
  }

  const buffer = await readFileAsArrayBuffer(fileItem.file);
  const entries = getZipEntries(buffer);
  const shouldRead = getOfficeTextEntryNames(fileItem.name);
  const decoder = new TextDecoder("utf-8");
  const chunks = [];

  for (const entry of entries.filter((item) => shouldRead(item.name)).slice(0, 80)) {
    try {
      const inflated = await inflateZipEntry(entry.bytes, entry.method);
      const xmlText = decoder.decode(inflated);
      const text = cleanDocumentText(decodeXmlText(xmlText));
      if (text) chunks.push(text);
    } catch {
      // 单个 XML 读取失败时跳过，不影响其他页面/幻灯片
    }
  }

  return cleanDocumentText(chunks.join("\n"));
}

function buildLocalDocumentSummary(text, fileName) {
  const cleanText = cleanDocumentText(text);
  if (!cleanText) return "我没有从这个文件里读取到足够的正文内容，可能它主要由图片、扫描件或复杂对象组成。";

  const sentences = cleanText
    .split(/(?<=[。！？.!?])\s+|[\n\r]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 8);
  const intro = sentences.slice(0, 3).join("\n");
  const keywords = [...new Set((cleanText.match(/[\u4e00-\u9fa5A-Za-z0-9]{2,}/g) || [])
    .filter((word) => !/^(the|and|for|with|this|that|一个|以及|或者|因为|所以)$/.test(word.toLowerCase()))
    .slice(0, 12))];

  return `我已经帮你读完《${fileName}》里能提取到的文字了。\n\n这份文件整体上主要围绕这些内容展开：${intro || cleanText.slice(0, 220)}\n\n我先帮你抓出几个可能的关键词：${keywords.join("、") || "暂无明显关键词"}。\n\n如果你愿意，可以继续点开 AI 助手，让我帮你把它整理成待办、汇报提纲或学习笔记。`;
}

async function summarizeDocumentWithAi(text, fileName) {
  const clippedText = cleanDocumentText(text).slice(0, 9000);
  if (!clippedText) return buildLocalDocumentSummary(text, fileName);

  if (!aiConfig?.apiKey) {
    return buildLocalDocumentSummary(clippedText, fileName);
  }

  return callExternalAI(`请你用温柔但清晰的方式总结这份文件《${fileName}》。请包含：1. 全文主旨；2. 关键内容；3. 可以继续处理的下一步。文件正文如下：\n${clippedText}`);
}

async function previewFile(fileItem) {
  const preview = $("#filePreview");
  const title = $("#filePreviewTitle");
  const body = $("#filePreviewBody");
  const kind = getPreviewKind(fileItem);
  const fileUrl = `${fileItem.url}?t=${Date.now()}`;

  title.textContent = fileItem.name;
  body.innerHTML = "";
  preview.hidden = false;

  if (kind === "image") {
    body.innerHTML = `
      <figure class="image-preview-frame">
        <img src="${fileUrl}" alt="${fileItem.name}" />
        <figcaption>${escapeHtml(fileItem.name)}</figcaption>
      </figure>
    `;
    return;
  }

  if (kind === "pdf") {
    body.innerHTML = `<iframe src="${fileUrl}" title="${fileItem.name}"></iframe>`;
    return;
  }

  if (kind === "audio") {
    body.innerHTML = `<audio src="${fileUrl}" controls style="width:100%"></audio>`;
    return;
  }

  if (kind === "video") {
    body.innerHTML = `<video src="${fileUrl}" controls></video>`;
    return;
  }

  if (kind === "text") {
    try {
      const response = await fetch(fileUrl);
      const text = await response.text();
      const pre = document.createElement("pre");
      pre.textContent = text;
      body.appendChild(pre);
    } catch {
      body.innerHTML = `<div class="file-preview-message">文本读取失败，请点击“下载”或“编辑”。</div>`;
    }
    return;
  }

  if (kind === "office") {
    const ext = getFileExtension(fileItem.name);
    if (!["docx", "pptx", "xlsx"].includes(ext)) {
      body.innerHTML = `
        <div class="file-preview-message">
          <strong>这个文件是旧版 Office 格式，浏览器不能直接读取全文。</strong>
          <span>你可以先用 Word / WPS / PowerPoint 另存为 ${ext === "doc" ? "docx" : ext === "ppt" ? "pptx" : "xlsx"}，再上传后我就能帮你总结全文。</span>
          <a class="file-action" href="${fileItem.url}" download="${fileItem.name}">下载文件</a>
        </div>
      `;
      return;
    }

    body.innerHTML = `
      <div class="file-preview-message office-summary-loading">
        <strong>正在读取文档并生成总结…</strong>
        <span>我会先提取文件里的文字，再帮你整理主旨和重点。</span>
      </div>
    `;

    try {
      const extractedText = await extractOfficeText(fileItem);
      if (!extractedText) {
        body.innerHTML = `
          <div class="file-preview-message">
            <strong>没有读取到足够的正文内容。</strong>
            <span>这个文件可能主要由图片、扫描件或复杂排版组成。你可以下载后用 Office / WPS 打开查看。</span>
            <a class="file-action" href="${fileItem.url}" download="${fileItem.name}">下载文件</a>
          </div>
        `;
        return;
      }

      const summary = await summarizeDocumentWithAi(extractedText, fileItem.name);
      body.innerHTML = `
        <article class="office-summary-card">
          <h3>AI 全文总结</h3>
          <div class="office-summary-text">${summary.split("\n").filter(Boolean).map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>
          <details>
            <summary>查看提取到的正文片段</summary>
            <pre>${escapeHtml(extractedText.slice(0, 6000))}${extractedText.length > 6000 ? "\n\n……后文已省略" : ""}</pre>
          </details>
        </article>
      `;
    } catch {
      body.innerHTML = `
        <div class="file-preview-message">
          <strong>文档读取失败。</strong>
          <span>可能是文件加密、格式过旧，或浏览器暂不支持解压读取。你可以下载后用 Office / WPS 打开。</span>
          <a class="file-action" href="${fileItem.url}" download="${fileItem.name}">下载文件</a>
        </div>
      `;
    }
    return;
  }

  body.innerHTML = `
    <div class="file-preview-message">
      <strong>当前文件类型不支持页面内预览。</strong>
      <span>你可以下载文件，或点击“编辑”用系统默认程序打开。</span>
      <a class="file-action" href="${fileItem.url}" download="${fileItem.name}">下载文件</a>
    </div>
  `;
}

function renderFiles() {
  const fileList = $("#fileList");
  fileList.innerHTML = "";

  if (acceptedFiles.length === 0) {
    const empty = document.createElement("li");
    empty.className = "file-item";
    empty.innerHTML = `<div class="file-meta"><strong>还没有文件</strong><small>静态模式下也可以先使用任务、专注、壁纸和音乐功能。</small></div>`;
    fileList.appendChild(empty);
    return;
  }

  acceptedFiles.forEach((fileItem) => {
    const item = document.createElement("li");
    item.className = "file-item";
    item.innerHTML = `
      <div class="file-meta">
        <strong></strong>
        <small></small>
      </div>
      <div class="file-actions">
        <button class="file-action preview-file" type="button">查看</button>
        <a class="file-action download-file" download>下载</a>
      </div>
    `;

    item.querySelector("strong").textContent = fileItem.name;
    item.querySelector("small").textContent = `${formatFileSize(fileItem.size)} · ${formatDateTime(fileItem.createdAt)}`;

    item.querySelector(".preview-file").addEventListener("click", () => {
      previewFile(fileItem);
    });

    const downloadLink = item.querySelector(".download-file");
    downloadLink.href = fileItem.url;
    downloadLink.download = fileItem.name;

    fileList.appendChild(item);
  });
}

async function refreshFileList() {
  $("#fileStatus").textContent = "可以从任意位置拖拽文件到页面，或点击右下角“上传文件”。文件会保存在当前浏览器会话中。";
  renderFiles();
}

async function handleFiles(files) {
  const selectedFiles = Array.from(files);
  if (selectedFiles.length === 0) return;

  acceptedFiles = [
    ...selectedFiles.map(createSessionFileItem),
    ...acceptedFiles
  ];
  $("#fileStatus").textContent = `已加入 ${selectedFiles.length} 个文件。刷新页面后会话文件会清空，请及时下载需要保留的文件。`;
  renderFiles();
  showToast(`已上传 ${selectedFiles.length} 个文件到当前会话。`);
}

function initDropZone() {
  const dropZone = $("#dropZone");
  const fileInput = $("#fileInput");
  const globalUploadBtn = $("#globalUploadBtn");
  const globalDropOverlay = $("#globalDropOverlay");
  let dragDepth = 0;

  $("#uploadBtn").addEventListener("click", () => fileInput.click());
  globalUploadBtn?.addEventListener("click", () => fileInput.click());
  $("#closePreviewBtn").addEventListener("click", () => {
    $("#filePreview").hidden = true;
    $("#filePreviewBody").innerHTML = "";
  });
  fileInput.addEventListener("change", (event) => {
    handleFiles(event.target.files);
    fileInput.value = "";
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove("drag-over");
    });
  });

  dropZone.addEventListener("drop", (event) => {
    handleFiles(event.dataTransfer.files);
  });

  document.addEventListener("dragenter", (event) => {
    if (!event.dataTransfer?.types?.includes("Files")) return;
    dragDepth += 1;
    globalDropOverlay.hidden = false;
  });

  document.addEventListener("dragover", (event) => {
    if (!event.dataTransfer?.types?.includes("Files")) return;
    event.preventDefault();
  });

  document.addEventListener("dragleave", (event) => {
    if (!event.dataTransfer?.types?.includes("Files")) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) {
      globalDropOverlay.hidden = true;
    }
  });

  document.addEventListener("drop", (event) => {
    if (!event.dataTransfer?.types?.includes("Files")) return;
    event.preventDefault();
    dragDepth = 0;
    globalDropOverlay.hidden = true;
    dropZone.classList.remove("drag-over");
    handleFiles(event.dataTransfer.files);
  });

  refreshFileList();
}

// ==============================
// 5. 沉浸式听歌系统
// ==============================

const tracks = [
  {
    id: "time-morning",
    title: "Morning Light 轻快纯音乐",
    generator: "morning"
  },
  {
    id: "time-night",
    title: "Night Guitar Canon 吉他和弦卡农",
    generator: "night"
  },
  {
    title: "Soft Bell Loop",
    url: "https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/bell_ring.mp3"
  },
  {
    title: "Water Drop Ambience",
    url: "https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/water_droplet.mp3"
  },
  {
    title: "Tiny Button Pulse",
    url: "https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/button_tiny.mp3"
  },
  {
    title: "Forest Branch Texture",
    url: "https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/branch_break.mp3"
  }
];

let currentTrackIndex = 0;
let isPlaying = false;
let customTracks = [];
let generatedAmbient = null;

function applyTimeMood() {
  const hour = new Date().getHours();
  const greeting = $("#timeGreeting");
  document.body.classList.remove("time-morning", "time-night");

  if (hour >= 5 && hour < 11) {
    document.body.classList.add("time-morning");
    if (greeting) greeting.textContent = "早上好，今天也是元气满满的一天";
    currentTrackIndex = tracks.findIndex((track) => track.id === "time-morning");
    return;
  }

  if (hour >= 22 || hour < 5) {
    document.body.classList.add("time-night");
    if (greeting) greeting.textContent = "很晚了，辛苦了，再坚持一下就去睡吧";
    currentTrackIndex = tracks.findIndex((track) => track.id === "time-night");
    return;
  }

  if (greeting) greeting.textContent = "欢迎回来，准备好进入今天的节奏了吗？";
  currentTrackIndex = Math.max(currentTrackIndex, 0);
}

function stopGeneratedAmbient() {
  if (!generatedAmbient) return;

  generatedAmbient.intervals.forEach((id) => clearInterval(id));
  generatedAmbient.nodes.forEach((node) => {
    try {
      node.stop?.();
      node.disconnect?.();
    } catch {
      // 音频节点可能已经停止，忽略即可
    }
  });
  generatedAmbient.context.close?.();
  generatedAmbient = null;
}

function playTone(context, destination, frequency, startTime, duration, type = "sine", volume = 0.08) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.04);
}

function playGuitarPluck(context, destination, frequency, startTime, volume = 0.055) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.detune.setValueAtTime((Math.random() - 0.5) * 8, startTime);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, startTime);
  filter.Q.value = 0.8;

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.35);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + 1.45);
}

async function startGeneratedAmbient(kind) {
  stopGeneratedAmbient();

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) throw new Error("当前浏览器不支持 Web Audio");

  const context = new AudioContext();
  await context.resume();
  const master = context.createGain();
  master.gain.value = kind === "morning" ? 0.22 : 0.16;
  master.connect(context.destination);

  const nodes = [master];
  const intervals = [];

  if (kind === "morning") {
    const notes = [523.25, 659.25, 783.99, 987.77];
    let step = 0;
    const playMorningPhrase = () => {
      const now = context.currentTime;
      playTone(context, master, notes[step % notes.length], now, 0.42, "triangle", 0.08);
      playTone(context, master, notes[(step + 2) % notes.length] / 2, now + 0.02, 0.8, "sine", 0.035);
      step += 1;
    };
    playMorningPhrase();
    intervals.push(setInterval(playMorningPhrase, 820));
  } else {
    const canonChords = [
      [146.83, 220.0, 293.66, 369.99],   // D
      [110.0, 220.0, 277.18, 329.63],    // A
      [123.47, 246.94, 293.66, 369.99],  // Bm
      [92.5, 185.0, 277.18, 369.99],     // F#m
      [98.0, 196.0, 246.94, 392.0],      // G
      [146.83, 220.0, 293.66, 369.99],   // D
      [98.0, 196.0, 246.94, 392.0],      // G
      [110.0, 220.0, 277.18, 329.63]     // A
    ];
    const arpeggioPattern = [0, 2, 3, 1, 2, 3, 2, 1];
    let chordIndex = 0;

    const playCanonChord = () => {
      const now = context.currentTime;
      const chord = canonChords[chordIndex % canonChords.length];

      arpeggioPattern.forEach((noteIndex, step) => {
        const frequency = chord[noteIndex];
        playGuitarPluck(context, master, frequency, now + step * 0.34, noteIndex === 0 ? 0.045 : 0.055);
        playGuitarPluck(context, master, frequency * 2, now + step * 0.34 + 0.012, 0.018);
      });

      chordIndex += 1;
    };

    playCanonChord();
    intervals.push(setInterval(playCanonChord, 2800));
  }

  generatedAmbient = { context, nodes, intervals };
}

function loadTrack(index) {
  const audioPlayer = $("#audioPlayer");
  currentTrackIndex = (index + tracks.length) % tracks.length;
  const track = tracks[currentTrackIndex];
  stopGeneratedAmbient();
  audioPlayer.pause();
  audioPlayer.removeAttribute("src");

  if (track.url) {
    audioPlayer.src = track.url;
  }

  audioPlayer.loop = true;
  $("#trackTitle").textContent = track.title;
}

async function togglePlay() {
  const audioPlayer = $("#audioPlayer");
  const playPauseBtn = $("#playPauseBtn");
  const track = tracks[currentTrackIndex];

  try {
    if (track.generator) {
      if (isPlaying) {
        stopGeneratedAmbient();
        isPlaying = false;
        playPauseBtn.textContent = "播放";
      } else {
        await startGeneratedAmbient(track.generator);
        isPlaying = true;
        playPauseBtn.textContent = "暂停";
      }
      return;
    }

    if (audioPlayer.paused) {
      await audioPlayer.play();
      isPlaying = true;
      playPauseBtn.textContent = "暂停";
    } else {
      audioPlayer.pause();
      isPlaying = false;
      playPauseBtn.textContent = "播放";
    }
  } catch {
    alert("浏览器阻止了自动播放，请再次点击播放按钮。");
  }
}

async function nextTrack() {
  const audioPlayer = $("#audioPlayer");
  const shouldKeepPlaying = isPlaying && (tracks[currentTrackIndex]?.generator || !audioPlayer.paused);
  loadTrack(currentTrackIndex + 1);

  if (shouldKeepPlaying) {
    try {
      const track = tracks[currentTrackIndex];
      if (track.generator) {
        await startGeneratedAmbient(track.generator);
      } else {
        await audioPlayer.play();
      }
      isPlaying = true;
      $("#playPauseBtn").textContent = "暂停";
    } catch {
      isPlaying = false;
      $("#playPauseBtn").textContent = "播放";
    }
  }
}

function saveCustomUrlTracks() {
  const urlTracks = customTracks.filter((track) => track.kind === "url");
  localStorage.setItem(storageKeys.customTracks, JSON.stringify(urlTracks));
}

function renderCustomTracks() {
  const list = $("#customTrackList");
  if (!list) return;

  list.innerHTML = "";

  if (customTracks.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "还没有自定义音乐。";
    list.appendChild(empty);
    return;
  }

  customTracks.forEach((track) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <span></span>
      <button type="button">播放</button>
    `;

    item.querySelector("span").textContent = track.title;
    item.querySelector("button").addEventListener("click", async () => {
      currentTrackIndex = tracks.findIndex((current) => current.id === track.id);
      loadTrack(currentTrackIndex);

      try {
        await $("#audioPlayer").play();
        isPlaying = true;
        $("#playPauseBtn").textContent = "暂停";
      } catch {
        alert("浏览器阻止了播放，请点击底部播放按钮重试。");
      }
    });

    list.appendChild(item);
  });
}

function addCustomTrack(track, shouldPersist = false) {
  const normalizedTrack = {
    id: track.id || `custom-${Date.now()}-${Math.random()}`,
    title: track.title,
    url: track.url,
    kind: track.kind
  };

  customTracks.push(normalizedTrack);
  tracks.push(normalizedTrack);

  if (shouldPersist) {
    saveCustomUrlTracks();
  }

  renderCustomTracks();
}

function initCustomMusic() {
  try {
    const savedTracks = JSON.parse(localStorage.getItem(storageKeys.customTracks)) || [];
    savedTracks.forEach((track) => addCustomTrack(track, false));
  } catch {
    customTracks = [];
  }

  $("#musicFileInput").addEventListener("change", (event) => {
    Array.from(event.target.files).forEach((file) => {
      if (!file.type.startsWith("audio/")) return;

      addCustomTrack({
        title: file.name.replace(/\.[^.]+$/, ""),
        url: URL.createObjectURL(file),
        kind: "file"
      });
    });

    event.target.value = "";
  });

  $("#addMusicUrlBtn").addEventListener("click", () => {
    const input = $("#musicUrlInput");
    const url = input.value.trim();

    if (!url) {
      alert("请先粘贴音频直链。");
      return;
    }

    addCustomTrack({
      title: `自定义音乐 ${customTracks.length + 1}`,
      url,
      kind: "url"
    }, true);

    input.value = "";
  });

  renderCustomTracks();
}

function initMusicPlayer() {
  const audioPlayer = $("#audioPlayer");
  const volumeSlider = $("#volumeSlider");

  applyTimeMood();
  loadTrack(currentTrackIndex);
  audioPlayer.volume = Number(volumeSlider.value);

  $("#playPauseBtn").addEventListener("click", togglePlay);
  $("#nextTrackBtn").addEventListener("click", nextTrack);
  volumeSlider.addEventListener("input", () => {
    audioPlayer.volume = Number(volumeSlider.value);
  });

  // 如果网络音频加载失败，保留界面可用并提示用户换下一首
  audioPlayer.addEventListener("error", () => {
    $("#trackTitle").textContent = "当前音频加载失败，请切换下一首";
    isPlaying = false;
    $("#playPauseBtn").textContent = "播放";
  });

  initCustomMusic();
}

// ==============================
// 6. AI 智能助手
// ==============================

const AI_STORAGE_KEY = "myspace-studio-ai";

let aiConfig = {
  apiUrl: "",
  apiKey: "",
  model: "",
  messages: []
};

function loadAiConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(AI_STORAGE_KEY));
    if (saved) {
      aiConfig = { ...aiConfig, ...saved };
    }
  } catch {
    // ignore
  }
}

function saveAiConfig() {
  localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(aiConfig));
}

function getAppContext() {
  const hour = new Date().getHours();
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.done).length;
  const pendingTasks = totalTasks - doneTasks;
  const isTimerRunning = !!timerId;
  const focusPercent = dailyFocusState.value;

  let timeDesc = "白天";
  if (hour >= 5 && hour < 11) timeDesc = "早晨";
  else if (hour >= 11 && hour < 14) timeDesc = "中午";
  else if (hour >= 14 && hour < 18) timeDesc = "下午";
  else if (hour >= 18 && hour < 22) timeDesc = "晚上";
  else timeDesc = "深夜";

  return {
    timeDesc,
    hour,
    totalTasks,
    doneTasks,
    pendingTasks,
    isTimerRunning,
    focusPercent,
    remainingTime: formatTime(remainingSeconds),
    hasFiles: acceptedFiles.length > 0
  };
}

function buildLocalReply(userText) {
  const text = userText.toLowerCase();
  const ctx = getAppContext();

  // 问候
  if (/你好|嗨|hello|hi|在吗|在嘛/.test(text)) {
    const greetings = [
      `你好呀，我在这里。\n\n现在是${ctx.timeDesc}，你不用一下子把状态调整到最好。可以先把肩膀放松一点，喝一口水，然后告诉我：你现在最想让我陪你处理的是任务、情绪，还是专注？`,
      `嗨，我听见你来了。\n\n今天不管过得顺不顺，都可以先在这里停一下。我们不用急着进入“高效率模式”，先把当下的状态接住，再慢慢整理下一步。`,
      `在的，我会陪着你。\n\n如果你现在脑子有点乱，我们就先不急着做决定。你可以只说一句“我有点累”或者“我不知道从哪开始”，我会顺着你的状态帮你往下拆。`
    ];
    return pickRandom(greetings);
  }

  // 专注 / 分心
  if (/专注|分心|集中|走神|静不下心|效率|拖延/.test(text)) {
    if (ctx.isTimerRunning) {
      return `我看到你的专注时钟还在运行中，还剩 ${ctx.remainingTime}。\n\n如果你现在有点分心，不代表你失败了，只是大脑在寻找出口。我们先不要责怪自己，轻轻把注意力拉回来就好。\n\n可以试试这样做：先把视线放回屏幕上，把手放到键盘或鼠标上，然后只问自己一个问题：“接下来 30 秒，我能做的最小动作是什么？”\n\n不用一下子进入完美状态。只要你愿意回来一次，就已经是在重新专注了。`;
    }
    return `现在还没有启动专注时钟，所以我们可以很轻地开始。\n\n如果你状态还不错，可以选 25 分钟；如果你有点累、心里有阻力，就先选 10 或 15 分钟也完全可以。专注不是逼自己坐住很久，而是给自己一个温和的边界：这段时间里，我只照顾眼前这一件事。\n\n你可以先写下一个小到不能再小的动作，比如“打开文档”“写标题”“整理第一条资料”。开始得越轻，越容易真的走下去。`;
  }

  // 任务相关
  if (/任务|待办|todo|事情|工作|作业/.test(text)) {
    if (ctx.totalTasks === 0) {
      return `你现在还没有写下任务，这其实是一个很好的空白起点。\n\n不用一开始就列完整计划。我们先写一件“马上能开始、不会吓到自己”的小事就好，比如：打开资料、写一个标题、整理桌面、回复一条消息，甚至只是喝一口水。\n\n任务写下来，不是为了给自己压力，而是为了让脑子不用一直背着它。你可以先放一件最轻的小事到待办里，我们慢慢来。`;
    }
    if (ctx.pendingTasks === 0) {
      return `你已经完成了今天全部 ${ctx.doneTasks} 个任务，这真的很值得被看见。\n\n完成任务不只是把列表清空，也意味着你今天一次次把注意力带回了现实里。现在可以不用急着加码，先给自己一点停顿：伸展一下、喝点水，或者只是安静坐一会儿。\n\n如果你还想继续，也建议只加一个很小的新任务。好的节奏不是一直冲，而是知道什么时候该收一收。`;
    }
    return `我看了一下，你现在还有 ${ctx.pendingTasks} 个待办，已经完成了 ${ctx.doneTasks} 个。\n\n先别急着把所有事情一起想完，那样很容易让人心里发紧。我们可以只挑一个“最容易开始”的任务，把它当成今天的入口。\n\n如果你愿意，可以先选那个阻力最小的：不用最重要，也不用最完美，只要能让你动起来。等第一件小事完成，后面的节奏通常会自己顺一点。`;
  }

  // 鼓励
  if (/鼓励|加油|撑不住|累|难受|心情不好|低落|焦虑|压力/.test(text)) {
    const encouragements = [
      `我知道你现在可能真的有点累，甚至不是睡一觉就能立刻恢复的那种累。\n\n但你能来到这里、能说出自己需要一点鼓励，已经说明你没有完全放弃自己。我们今天可以不用很厉害，也不用表现得很稳定。先把标准放低一点：只做一点点，只前进一小步，也算数。\n\n如果现在心里很重，就先别急着解决所有问题。你可以把最压着你的那件事告诉我，我们一起把它拆小。`,
      `压力大的时候，人很容易觉得“我必须马上处理好一切”。但其实你不需要一次解决整座山。\n\n我们先把呼吸放慢一点。吸气，停一下，再慢慢呼出来。然后只看眼前最近的一步，不看全部路程。\n\n你不是不够努力，你只是承受了很多。接下来我们不硬扛，换一种更温柔的方式继续。`,
      `每个人都有自己的节奏，有时候快一点，有时候慢一点，这都不是问题。\n\n你不需要和任何人比较，也不需要用今天的状态否定自己。状态低的时候，就把任务切小；心里乱的时候，就先整理一句话；身体累的时候，就把时间缩短。\n\n我会在这里陪你，不催你，也不评判你。我们只需要一起找到下一步。`,
      `如果你现在有点低落，我想先告诉你：这种感觉可以被允许存在。\n\n你不用立刻振作，也不用假装没事。人有时候就是会陷进一段暗一点的情绪里，这不代表你不好，也不代表你做不到。\n\n今天我们可以把目标改成“照顾自己并完成一点点”。哪怕只是打开页面、写下一件小事，也已经是你在往外走。`
    ];
    return pickRandom(encouragements);
  }

  // 时间 / 作息
  if (/时间|几点|作息|睡觉|休息|熬夜|早起/.test(text)) {
    if (ctx.hour >= 22 || ctx.hour < 5) {
      return `现在已经是${ctx.timeDesc}了，你还在这里，说明今天可能真的不轻松。\n\n如果任务还没做完，我们可以先不要继续硬撑。你可以写下“明天醒来第一件要做的事”，把它从脑子里放到纸面或待办里。这样不是逃避，而是在给明天的自己留一个入口。\n\n今晚能休息一点，就已经是在修复。睡眠不是浪费时间，它是你重新拥有力气的方式。`;
    }
    if (ctx.hour >= 5 && ctx.hour < 11) {
      return `早晨好。这个时间段通常比较适合做需要脑力的事情，但我们也不用一开始就把任务安排得太满。\n\n你可以先选一件今天最值得推进的事，把它拆成一个很小的开头。比如先打开文件、看一遍材料、写三行草稿。\n\n早晨的好处不是一定要高强度，而是可以用一个清爽的小开始，给今天定一个温和的方向。`;
    }
    return `现在是${ctx.timeDesc}。如果你已经坐了一会儿，可以稍微检查一下身体：肩膀是不是紧着，眼睛是不是有点累，水有没有喝。\n\n专注不是一直绷紧。很多时候，短暂地站起来、看远一点、活动一下手腕，反而会让后面的效率更稳。\n\n你可以把接下来的一轮当成“温和推进”，不追求一口气完成，只保持节奏。`;
  }

  // 音乐
  if (/音乐|歌|听歌|声音|安静/.test(text)) {
    return `音乐可以帮你把环境慢慢调成适合自己的样子。\n\n底部播放器会根据时间切换不同氛围：早晨偏轻快，深夜会更柔和。你也可以导入自己的音乐，把音量调到“能感觉到陪伴，但不会打扰思考”的程度。\n\n如果你现在心里比较乱，建议先用低一点的音量，不要选太强烈的歌。让声音像背景里的光一样，轻轻托住你就好。`;
  }

  // 文件
  if (/文件|上传|文档|资料/.test(text)) {
    return `文件这块你可以很随意地使用，不需要先整理得很完美。\n\n你可以把文件直接拖到页面任意位置，或者点右下角“上传文件”。图片点击“查看”会直接显示大图；PDF、文本、音频、视频也可以预览。像 docx、pptx、xlsx 这类新版 Office 文件，我会尽量读取里面的文字，并帮你生成一份温柔清晰的全文总结。\n\n我的建议是：先把和当前任务有关的资料放进来，不用一次上传全部。让工作台先服务眼前这件事，会更不容易乱。`;
  }

  // 壁纸 / 背景
  if (/壁纸|背景|皮肤|换肤|主题/.test(text)) {
    return `背景可以按你今天的状态来选，不一定要选“最好看”的，而是选让你最容易安定下来的。\n\n右上角可以切换静谧森林、赛博朋克、现代都市三种稳定轮播背景。如果你想要更有归属感，也可以输入自己的城市，或者上传一张本地图片当壁纸。\n\n如果哪天觉得背景太刺激，就换回森林；如果想要一点行动感，可以试试都市或赛博。这个空间是给你用的，不需要固定成一种样子。`;
  }

  // 专注值
  if (/专注值|进度|百分比|多少/.test(text)) {
    return `今天你的专注值是 ${ctx.focusPercent}%。\n\n这个数字不是用来催你的，它更像一个小小的记录：你今天有在回来，有在尝试，有在一点点照顾自己的节奏。\n\n每完成一个任务，或者专注 5 分钟，它都会涨一点。但不用执着到 100%。有些日子能到 30% 就已经很不容易了，尤其是在你累、焦虑或低落的时候。我们看见进步，但不拿它压你。`;
  }

  // 帮助
  if (/怎么|如何|help|用法|功能|做什么|能干嘛/.test(text)) {
    return `我是星语，会尽量像一个安静陪在旁边的助手，而不是冷冰冰的工具。\n\n我可以帮你看任务、陪你进入专注、根据当前时间提醒你休息，也可以在你焦虑、低落、疲惫的时候，先接住你的情绪，再一起拆下一步。\n\n你不需要把问题说得很完整。你可以直接说“我有点乱”“我不想做”“我不知道先做什么”，我会根据你的状态和工作台里的任务，帮你慢慢整理。`;
  }

  // 默认回复
  const defaults = [
    `我在认真听你说。\n\n这件事可能不一定能马上被完整解决，但我们可以先把它放到桌面上，不让它一直在你脑子里打转。现在你的专注值是 ${ctx.focusPercent}%，还有 ${ctx.pendingTasks} 个任务待办。如果你愿意，我可以先帮你把当下最重要的一件事拆小一点。`,
    `我理解你可能不是只想要一个“标准答案”，而是想有人帮你一起理一理。\n\n我们可以慢一点来：先说清楚你现在最卡的地方是什么，是事情太多、情绪太重，还是不知道从哪一步开始？你不用说得很完美，我会顺着你的话陪你整理。`,
    `我在这里。\n\n如果这句话背后其实有一点累、一点烦，或者一点不知道怎么办，也没关系。你可以继续说，我不会催你马上变好。我们先把心里的东西说出来一点点，再决定下一步怎么走。`,
    `这个问题我可以陪你慢慢看。\n\n先不用急着得到一个很漂亮的结论。很多时候，我们只需要找到一个能开始的缝隙。你可以告诉我：你希望我更偏向安慰你、帮你拆任务，还是帮你做一个很小的开始？`
  ];
  return pickRandom(defaults);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function callExternalAI(userText) {
  const url = aiConfig.apiUrl || "https://api.openai.com/v1/chat/completions";
  const model = aiConfig.model || "gpt-3.5-turbo";

  const systemPrompt = `你是 MySpace Studio 工作台的智能助手“星语”。你的语气要非常温柔、细腻、像一个真正坐在用户旁边陪伴的人，而不是冷冰冰的客服或工具。先承接用户的情绪，再给建议；少用命令句，多用“我们可以”“先不急”“慢慢来”。回答可以稍微长一点，通常 2 到 4 个自然段，每段不要太长。不要只给清单，不要像机器人模板。你熟悉番茄工作法、任务管理、时间管理，也能在用户焦虑、低落、疲惫时先安抚，再把事情拆成一个很小的下一步。`;

  const ctx = getAppContext();
  const contextMessage = `【工作台状态】时间：${ctx.timeDesc}，待办任务：${ctx.pendingTasks}，已完成：${ctx.doneTasks}，专注值：${ctx.focusPercent}%，专注时钟：${ctx.isTimerRunning ? "运行中（" + ctx.remainingTime + "）" : "未启动"}。`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...aiConfig.messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: contextMessage + "\n用户说：" + userText }
  ];

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${aiConfig.apiKey}`
    },
    body: JSON.stringify({ model, messages, temperature: 0.9, max_tokens: 700 })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "（AI 没有返回内容）";
}

function addAiMessage(role, text) {
  const container = $("#aiMessages");
  if (!container) return;

  const msgDiv = document.createElement("div");
  msgDiv.className = `ai-message ai-${role}`;
  msgDiv.innerHTML = `<div class="ai-bubble"></div>`;

  const bubble = msgDiv.querySelector(".ai-bubble");

  // 支持简单换行
  const paragraphs = text.split("\n").filter((line) => line.trim() !== "");
  if (paragraphs.length <= 1) {
    bubble.textContent = text;
  } else {
    bubble.innerHTML = paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  }

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;

  aiConfig.messages.push({ role, content: text });
  if (aiConfig.messages.length > 40) {
    aiConfig.messages = aiConfig.messages.slice(-40);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showAiTyping() {
  const container = $("#aiMessages");
  if (!container) return null;

  const typing = document.createElement("div");
  typing.className = "ai-message ai-typing";
  typing.id = "aiTypingIndicator";
  typing.innerHTML = `<span></span><span></span><span></span>`;
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
  return typing;
}

function hideAiTyping() {
  $("#aiTypingIndicator")?.remove();
}

async function handleAiSend(userText) {
  if (!userText.trim()) return;

  addAiMessage("user", userText);

  const typing = showAiTyping();

  // 模拟思考延迟，更自然
  const thinkTime = 600 + Math.random() * 800;

  try {
    let reply;

    if (aiConfig.apiKey) {
      try {
        reply = await Promise.race([
          callExternalAI(userText),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 15000))
        ]);
      } catch {
        reply = buildLocalReply(userText) + "\n\n（外部 AI 连接失败，已切换为本地回复。）";
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, thinkTime));
      reply = buildLocalReply(userText);
    }

    hideAiTyping();
    addAiMessage("assistant", reply);
  } catch {
    hideAiTyping();
    addAiMessage("assistant", "抱歉，我刚才走神了…能再说一遍吗？");
  }
}

function initAiAssistant() {
  loadAiConfig();

  const toggleBtn = $("#aiToggleBtn");
  const panel = $("#aiPanel");
  const closeBtn = $("#aiCloseBtn");
  const inputForm = $("#aiInputForm");
  const input = $("#aiInput");
  const quickPrompts = $(".ai-quick-prompts");

  if (!toggleBtn || !panel) return;

  // 首次打开时显示欢迎语
  let hasWelcomed = false;

  function openPanel() {
    panel.hidden = false;
    toggleBtn.setAttribute("aria-expanded", "true");
    panel.classList.remove("is-closing");

    if (!hasWelcomed) {
      hasWelcomed = true;
      const ctx = getAppContext();
      const hour = new Date().getHours();
      let welcome = `你好，我是星语助手。`;
      if (hour >= 5 && hour < 11) {
        welcome += `早晨是一天中最清新的时刻，准备好开始了吗？`;
      } else if (hour >= 22 || hour < 5) {
        welcome += `夜深了，如果你还在工作，记得对自己温柔一点。`;
      } else {
        welcome += `有什么我可以帮你的吗？`;
      }

      if (ctx.pendingTasks > 0) {
        welcome += ` 你现在有 ${ctx.pendingTasks} 个任务待办，需要我帮你梳理一下吗？`;
      }

      setTimeout(() => {
        addAiMessage("assistant", welcome);
      }, 400);
    }

    setTimeout(() => input?.focus(), 300);
  }

  function closePanel() {
    panel.classList.add("is-closing");
    setTimeout(() => {
      panel.hidden = true;
      toggleBtn.setAttribute("aria-expanded", "false");
    }, 300);
  }

  window.openAiAssistantWithConcern = (concernText = "", mood = "") => {
    openPanel();
    const trimmedConcern = concernText.trim();

    if (trimmedConcern) {
      const prompt = `我现在选择了${mood === "anxious" ? "焦虑" : "低落"}，我的烦恼是：${trimmedConcern}。请你用很温柔、像朋友一样的语气先陪我说一会儿，不要太快给结论。先帮我把情绪接住，再慢慢帮我把这件事拆成一个很小、现在就能开始的步骤。`;
      setTimeout(() => handleAiSend(prompt), 420);
    } else {
      const message = mood === "anxious"
        ? "我看到你选择了焦虑。先不急着解决问题，也不急着让自己冷静下来。你可以只把最让你不安的那一小块说给我听，我会先陪你把心稳住，再一起找一个很小的下一步。"
        : "我看到你选择了低落。你不用马上变好，也不用把话说得很清楚。可以先把心里最沉的那件事放到这里，我会陪你慢慢看，不催你。";
      setTimeout(() => addAiMessage("assistant", message), 420);
    }
  };

  toggleBtn.addEventListener("click", () => {
    if (panel.hidden) {
      openPanel();
    } else {
      closePanel();
    }
  });

  closeBtn?.addEventListener("click", closePanel);

  // 点击面板外部关闭
  document.addEventListener("click", (event) => {
    if (!panel.hidden && !panel.contains(event.target) && !toggleBtn.contains(event.target)) {
      closePanel();
    }
  });

  inputForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    handleAiSend(text);
  });

  // 快捷提示按钮
  quickPrompts?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-prompt]");
    if (!btn) return;
    handleAiSend(btn.dataset.prompt);
  });

  // API 设置
  const apiUrlInput = $("#aiApiUrl");
  const apiKeyInput = $("#aiApiKey");
  const modelInput = $("#aiModel");

  if (apiUrlInput) apiUrlInput.value = aiConfig.apiUrl || "";
  if (apiKeyInput) apiKeyInput.value = aiConfig.apiKey || "";
  if (modelInput) modelInput.value = aiConfig.model || "";

  $("#aiSaveSettingsBtn")?.addEventListener("click", () => {
    aiConfig.apiUrl = apiUrlInput?.value.trim() || "";
    aiConfig.apiKey = apiKeyInput?.value.trim() || "";
    aiConfig.model = modelInput?.value.trim() || "";
    saveAiConfig();
    showToast("AI 设置已保存。");
  });

  $("#aiClearSettingsBtn")?.addEventListener("click", () => {
    aiConfig.apiUrl = "";
    aiConfig.apiKey = "";
    aiConfig.model = "";
    if (apiUrlInput) apiUrlInput.value = "";
    if (apiKeyInput) apiKeyInput.value = "";
    if (modelInput) modelInput.value = "";
    saveAiConfig();
    showToast("已清除外部 AI 设置，使用本地回复。");
  });
}

// ==============================
// 7. 开场心情入口
// ==============================

const moodEncouragements = {
  steady: [
    "平静很好，它像一盏不刺眼的小灯。今天不用急着证明什么，顺着这个稳定的节奏，先把一件小事做好就够了。",
    "你现在的状态很适合慢慢进入专注。把目标放小一点，让行动自然接上来。"
  ],
  bright: [
    "今天的你带着一点光，可以趁这股劲先推进最重要的那一件事。别急着做很多，先把能量用在值得的地方。",
    "元气是很珍贵的开场。让它带你开始，但也记得给自己留一点余裕。"
  ],
  tired: [
    "累的时候，不需要用力冲刺。今天可以轻一点开始，先做一个很小的动作，剩下的慢慢来。",
    "疲惫不是失败，它只是身体在提醒你温柔一点。我们先从最不费力的一步开始。"
  ],
  anxious: [
    "焦虑的时候，先不用解决所有事。把呼吸放慢，把任务缩小到下一步，你只需要先完成眼前这一点点。",
    "心里很乱也没关系。我们不和焦虑硬碰硬，只把注意力轻轻放回可控的一件事。"
  ],
  low: [
    "低落的时候还能来到这里，已经很不容易了。今天不需要表现得很好，愿意开始一点点，就值得被肯定。",
    "如果状态不高，就把今天当成温柔维护的一天。慢慢来，我会陪你进入工作台。"
  ]
};

const moodOpeningLines = [
  "门后的世界不要求你立刻变得强大，它只邀请你慢慢开始。",
  "请把今天交给这一小步。光会进来，节奏也会回来。",
  "你不需要准备得完美，愿意推开这扇门，就已经很好。",
  "把刚才的心情带上吧，它不是负担，它会成为今天被照顾的一部分。",
  "我们不追赶时间，只和时间并肩走一小段。"
];

let selectedMoodMessage = "";
let selectedMood = "";

function initMoodGate() {
  const gate = $("#moodGate");
  const moodCard = gate?.querySelector(".mood-card");
  const doorScene = $("#moodCurtainScene");
  const curtainPullBtn = $("#curtainPullBtn");
  const openingLine = $("#openingLine");
  const encouragement = $("#moodEncouragement");
  const enterBtn = $("#enterWorkspaceBtn");
  const concernBox = $("#moodConcernBox");
  const concernInput = $("#moodConcernInput");
  if (!gate || !encouragement || !enterBtn) return;

  document.body.classList.add("mood-gate-open", "workspace-hidden");
  let doorSequenceStarted = false;

  function completeMoodGateEntry() {
    const bubble = $("#companionBubble");
    const note = $("#kindNote");
    const greeting = $("#timeGreeting");
    if (bubble) bubble.textContent = selectedMoodMessage;
    if (note) note.textContent = selectedMoodMessage;
    if (greeting) greeting.textContent = "欢迎回来，按现在的心情慢慢进入节奏。";

    gate.classList.add("is-wallpaper-reveal");
    doorScene?.classList.add("is-wallpaper-reveal");

    setTimeout(() => {
      document.body.classList.remove("workspace-hidden");
      document.body.classList.add("workspace-panels-visible");
    }, 1050);

    setTimeout(() => {
      gate.classList.add("is-leaving");
      document.body.classList.remove("mood-gate-open");
    }, 1900);

    setTimeout(() => {
      gate.hidden = true;
      document.body.classList.remove("workspace-panels-visible");
    }, 3600);

    if (selectedMood === "anxious" || selectedMood === "low") {
      setTimeout(() => {
        window.openAiAssistantWithConcern?.(concernInput?.value || "", selectedMood);
      }, 3900);
      showToast("已打开 AI 助手，先把烦恼慢慢说出来。");
    } else if (selectedMood === "tired") {
      showToast("疲惫模式已开启：我们只做一个 10 分钟的小任务。");
    } else {
      showToast("已进入工作台，先从一件小事开始。");
    }
  }

  function startDoorSequence() {
    if (doorSequenceStarted || !doorScene || !curtainPullBtn || !openingLine) return;
    doorSequenceStarted = true;
    enterBtn.disabled = true;
    enterBtn.textContent = "正在进入…";
    moodCard?.classList.add("is-folding");

    setTimeout(() => {
      if (moodCard) moodCard.hidden = true;
      doorScene.hidden = false;
      gate.classList.add("is-door-stage");
      curtainPullBtn.focus();
    }, 420);
  }

  function setCurtainProgress(progress) {
    const safeProgress = Math.min(Math.max(progress, 0), 1);
    doorScene?.style.setProperty("--left-shift", `${-104 * safeProgress}%`);
    doorScene?.style.setProperty("--right-shift", `${104 * safeProgress}%`);
    doorScene?.style.setProperty("--pull-x", `${50 + 32 * safeProgress}%`);
  }

  function startCurtainOpening() {
    if (!doorScene || !openingLine || doorScene.classList.contains("is-opening")) return;
    if (curtainPullBtn) curtainPullBtn.disabled = true;
    setCurtainProgress(1);
    openingLine.textContent = pickRandom(moodOpeningLines);
    doorScene.classList.add("is-opening");

    setTimeout(() => {
      doorScene.classList.add("is-blackout");
    }, 1900);

    setTimeout(() => {
      doorScene.classList.add("is-lighting");
    }, 3900);

    setTimeout(() => {
      completeMoodGateEntry();
    }, 6100);
  }

  let curtainDragging = false;
  let curtainStartX = 0;
  let curtainCurrentProgress = 0;

  curtainPullBtn?.addEventListener("pointerdown", (event) => {
    if (!doorScene || doorScene.classList.contains("is-opening")) return;
    curtainDragging = true;
    curtainStartX = event.clientX;
    doorScene.classList.add("is-dragging");
    curtainPullBtn.setPointerCapture?.(event.pointerId);
  });

  curtainPullBtn?.addEventListener("pointermove", (event) => {
    if (!curtainDragging || !doorScene) return;
    const dragDistance = Math.max(0, event.clientX - curtainStartX);
    const neededDistance = Math.min(window.innerWidth * 0.42, 360);
    curtainCurrentProgress = Math.min(dragDistance / neededDistance, 1);
    setCurtainProgress(curtainCurrentProgress);
    if (curtainCurrentProgress >= 0.82) {
      curtainDragging = false;
      doorScene.classList.remove("is-dragging");
      startCurtainOpening();
    }
  });

  function releaseCurtain(event) {
    if (!curtainDragging || !doorScene) return;
    curtainDragging = false;
    doorScene.classList.remove("is-dragging");
    curtainPullBtn?.releasePointerCapture?.(event.pointerId);
    if (curtainCurrentProgress >= 0.72) {
      startCurtainOpening();
      return;
    }

    curtainCurrentProgress = 0;
    setCurtainProgress(0);
  }

  curtainPullBtn?.addEventListener("pointerup", releaseCurtain);
  curtainPullBtn?.addEventListener("pointercancel", releaseCurtain);

  curtainPullBtn?.addEventListener("click", () => {
    if (!doorScene || doorScene.classList.contains("is-opening")) return;
    if (curtainCurrentProgress === 0) {
      showToast("按住透明小箭头向右轻轻拖动。");
    }
  });

  $$(".mood-option").forEach((button) => {
    button.addEventListener("click", () => {
      const mood = button.dataset.mood;
      const messages = moodEncouragements[mood] || moodEncouragements.steady;
      selectedMoodMessage = pickRandom(messages);
      selectedMood = mood;
      currentMood = mood;

      $$(".mood-option").forEach((item) => item.classList.remove("is-selected"));
      button.classList.add("is-selected");

      if (mood === "tired") {
        tiredTimeChangeAttempts = 0;
        setFocusMinutes(10, { force: true });
        selectedMoodMessage = "你选择了疲惫，所以我们今天先不硬撑。默认设为 10 分钟：我们只做一个 10 分钟的小任务，完成一点点就可以停下来。";
        timerStatus.textContent = "疲惫模式：10 分钟小任务";
      }

      const needsConcern = mood === "anxious" || mood === "low";
      if (concernBox) concernBox.hidden = !needsConcern;
      if (needsConcern) {
        selectedMoodMessage += " 如果愿意，可以先写下你的烦恼。进入工作台后，我会自动打开 AI 助手陪你一起拆解。";
        setTimeout(() => concernInput?.focus(), 80);
      } else if (concernInput) {
        concernInput.value = "";
      }

      encouragement.textContent = selectedMoodMessage;
      encouragement.classList.add("is-ready");
      enterBtn.disabled = false;
      enterBtn.textContent = needsConcern ? "带着它继续" : "继续";
    });
  });

  enterBtn.addEventListener("click", () => {
    if (!selectedMoodMessage) return;
    startDoorSequence();
  });
}

// ==============================
// 8. 手机 / 平板 App 化导航
// ==============================

function initMobileAppNavigation() {
  const nav = $(".mobile-app-nav");
  if (!nav) return;

  nav.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.openAi) {
      $("#aiToggleBtn")?.click();
    } else {
      const target = $(`[data-app-section="${button.dataset.targetSection}"]`);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    nav.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });

  const sections = [...$$("[data-app-section]")];
  if (!("IntersectionObserver" in window) || sections.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;

    const sectionName = visible.target.dataset.appSection;
    nav.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("active", button.dataset.targetSection === sectionName);
    });
  }, {
    threshold: [0.3, 0.55, 0.75],
    rootMargin: "-22% 0px -45% 0px"
  });

  sections.forEach((section) => observer.observe(section));
}

function registerAppServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  navigator.serviceWorker.register("service-worker.js").catch(() => {
    // 本地文件打开或浏览器限制时忽略，不影响正常使用
  });
}

// ==============================
// 9. 离开守护
// ==============================

function showExitGuard() {
  const guard = $("#exitGuard");
  const title = $("#exitGuardTitle");
  const message = $("#exitGuardMessage");
  const choices = $("#exitChoiceGroup");
  const continueBtn = $("#exitContinueBtn");
  if (!guard || !title || !message || !choices || !continueBtn) return;

  if (!hasUnfinishedFocusTime()) {
    exitGuardAttempts = 3;
  } else {
    exitGuardAttempts += 1;
  }

  const remainingText = formatTime(remainingSeconds);
  const reminders = [
    `时间还没有到，还剩 ${remainingText}。先别急着离开，我们只需要把这一小段守完。`,
    `我再提醒你一次：这一轮还没有结束。很多时候，真正改变节奏的就是“多留下这一会儿”。`,
    `这是第三次提醒了。时间仍未结束，但我也尊重你现在的需要。如果你确实要离开，可以先选择你接下来要去做什么。`
  ];

  guard.hidden = false;
  title.textContent = hasUnfinishedFocusTime() ? "时间还没有到" : "准备离开吗？";
  message.textContent = hasUnfinishedFocusTime()
    ? reminders[Math.min(exitGuardAttempts - 1, reminders.length - 1)]
    : "如果你已经准备好离开，可以选择接下来要做的事。";

  const canChoose = exitGuardAttempts >= 3 || !hasUnfinishedFocusTime();
  choices.hidden = !canChoose;
  continueBtn.hidden = canChoose;
}

function hideExitGuard() {
  const guard = $("#exitGuard");
  if (guard) guard.hidden = true;
}

function handleExitChoice(choice) {
  allowLeavingWorkspace = true;

  if (choice === "files") {
    hideExitGuard();
    $("#filePanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("好的，先去处理文件。专注可以换一种形式继续。");
    return;
  }

  if (choice === "code") {
    hideExitGuard();
    $("#aiToggleBtn")?.click();
    setTimeout(() => {
      handleAiSend("我现在想去写代码，请你帮我把接下来要做的代码任务拆成一个清晰的小步骤。");
    }, 400);
    showToast("我帮你打开 AI 助手，一起把写代码的下一步拆清楚。");
    return;
  }

  if (choice === "rest") {
    hideExitGuard();
    pauseTimer();
    showToast("好的，先休息一下。休息不是逃避，是为了回来时更稳。");
    return;
  }

  $("#exitGuardTitle").textContent = "已经允许离开";
  $("#exitGuardMessage").textContent = "我知道你已经认真做过选择了。现在可以关闭页面，或者把它放到后台，等你愿意的时候再回来。";
  $("#exitChoiceGroup").hidden = true;
  $("#exitContinueBtn").hidden = true;
  $("#exitStayBtn").textContent = "我再留一会儿";
}

function initExitGuard() {
  $("#appExitBtn")?.addEventListener("click", showExitGuard);

  $(".mobile-app-nav")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-exit-app]");
    if (button) showExitGuard();
  });

  $("#exitStayBtn")?.addEventListener("click", () => {
    hideExitGuard();
    showToast("好，我们继续留在这里，把这一小段走完。");
  });

  $("#exitContinueBtn")?.addEventListener("click", () => {
    hideExitGuard();
    showToast("先回来继续这一轮，等第三次提醒后我会给你选择。");
  });

  $("#exitChoiceGroup")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-exit-choice]");
    if (!button) return;
    handleExitChoice(button.dataset.exitChoice);
  });

  window.addEventListener("beforeunload", (event) => {
    if (allowLeavingWorkspace || !hasUnfinishedFocusTime()) return;
    event.preventDefault();
    event.returnValue = "专注时间还没有到，确定要离开吗？";
  });
}

// ==============================
// 页面初始化
// ==============================

document.addEventListener("DOMContentLoaded", () => {
  initMoodGate();
  initBackgroundSwitcher();
  initLocalWallpaperPicker();
  initDailyFocus();
  initTimer();
  initTasks();
  initDropZone();
  initMusicPlayer();
  initAiAssistant();
  initMobileAppNavigation();
  initExitGuard();
  registerAppServiceWorker();
});
