const EDITOR_NAMES = new Set(["童星灿", "王冰鑫"]);
const DB_NAME = "love-universe-db";
const DB_VERSION = 1;
const STORE_PHOTOS = "photos";
const STORE_MUSIC = "music";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  db: null,
  photos: [],
  musicList: [],
  currentMusicIndex: -1,
  currentMusicId: null,
  isEditor: false,
  currentPhotoId: null,
  pendingFiles: [],
  photoUrls: new Set(),
  detailImageUrl: "",
  editPreviewUrl: "",
  musicUrl: "",
  audio: new Audio(),
  toastTimer: null,
  memoryMotionStarted: false
};

class StarScene {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.options = options;
    this.stars = [];
    this.dust = [];
    this.pointer = { x: 0, y: 0 };
    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    window.addEventListener("resize", this.resize);
    window.addEventListener("mousemove", (event) => {
      this.pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      this.pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    });
    window.addEventListener("touchmove", (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      this.pointer.x = (touch.clientX / window.innerWidth - 0.5) * 2;
      this.pointer.y = (touch.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    this.resize();
    requestAnimationFrame(this.frame);
  }

  resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * ratio);
    this.canvas.height = Math.floor(this.height * ratio);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const area = this.width * this.height;
    const minStars = this.options.identity ? 80 : 95;
    const maxStars = this.options.identity ? 210 : 320;
    const density = this.options.identity ? 9000 : 7200;
    const starCount = Math.max(minStars, Math.min(maxStars, Math.floor(area / density)));
    const dustCount = Math.min(this.options.identity ? 28 : 44, Math.floor(area / 34000));
    this.stars = Array.from({ length: starCount }, () => this.makeStar());
    this.dust = Array.from({ length: dustCount }, () => this.makeDust());
  }

  makeStar() {
    const bright = Math.random() > 0.88;
    return {
      x: Math.random(),
      y: Math.random(),
      depth: Math.random(),
      size: bright ? 0.9 + Math.random() * 1.45 : 0.22 + Math.random() * 0.72,
      phase: Math.random() * Math.PI * 2,
      speed: bright ? 0.002 + Math.random() * 0.008 : 0.001 + Math.random() * 0.006,
      hue: bright ? 198 + Math.random() * 72 : 205 + Math.random() * 42,
      bright
    };
  }

  makeDust() {
    return {
      x: Math.random(),
      y: Math.random(),
      length: 36 + Math.random() * 110,
      alpha: 0.01 + Math.random() * 0.038,
      angle: -0.35 + Math.random() * 0.25,
      speed: 0.04 + Math.random() * 0.18
    };
  }

  frame(time) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.globalCompositeOperation = "lighter";

    for (const dust of this.dust) {
      dust.x += dust.speed / this.width;
      if (dust.x > 1.08) dust.x = -0.08;
      const x = dust.x * this.width + this.pointer.x * 8;
      const y = dust.y * this.height + this.pointer.y * 6;
      const dx = Math.cos(dust.angle) * dust.length;
      const dy = Math.sin(dust.angle) * dust.length;
      const gradient = ctx.createLinearGradient(x, y, x + dx, y + dy);
      gradient.addColorStop(0, "rgba(157,204,255,0)");
      gradient.addColorStop(0.5, `rgba(200,230,255,${dust.alpha})`);
      gradient.addColorStop(1, "rgba(169,255,242,0)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y + dy);
      ctx.stroke();
    }

    for (const star of this.stars) {
      star.phase += star.speed;
      const parallax = 4 + star.depth * 18;
      const x = star.x * this.width + this.pointer.x * parallax;
      const y = star.y * this.height + this.pointer.y * parallax;
      const pulse = (star.bright ? 0.42 : 0.22)
        + Math.sin(time * 0.0009 + star.phase) * (star.bright ? 0.18 : 0.07)
        + star.depth * (star.bright ? 0.2 : 0.1);
      const alpha = Math.max(0.05, Math.min(star.bright ? 0.82 : 0.38, pulse));
      const radius = star.size * (0.75 + star.depth * 0.9);
      ctx.fillStyle = `hsla(${star.hue}, 90%, 86%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (star.bright && radius > 1.1 && alpha > 0.5) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 8);
        glow.addColorStop(0, `hsla(${star.hue}, 100%, 82%, ${alpha * 0.16})`);
        glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, radius * 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(this.frame);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  new StarScene($("#identityCanvas"), { identity: true });
  new StarScene($("#spaceCanvas"));
  bindEvents();
  bindPlanetParallax();

  if (!("indexedDB" in window)) {
    toast("当前浏览器不支持本地数据库，照片和音乐无法保存。");
    return;
  }

  state.db = await openDatabase();
  await loadStoredData();
  renderGallery();
  renderMusic();
});

function bindEvents() {
  $("#enterBtn").addEventListener("click", enterApp);
  $("#guestEnterBtn").addEventListener("click", enterGuestApp);
  $("#nameInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") enterApp();
  });

  $("#importPhotoBtn").addEventListener("click", () => openModal("importModal"));
  $("#emptyImportBtn").addEventListener("click", () => openModal("importModal"));
  $("#confirmImportBtn").addEventListener("click", importPendingPhotos);
  $("#clearAllPhotosBtn").addEventListener("click", clearAllPhotos);
  $("#photoInput").addEventListener("change", (event) => setPendingFiles([...event.target.files]));

  $("#dropZone").addEventListener("dragover", (event) => {
    event.preventDefault();
    $("#dropZone").classList.add("is-dragging");
  });
  $("#dropZone").addEventListener("dragleave", () => $("#dropZone").classList.remove("is-dragging"));
  $("#dropZone").addEventListener("drop", (event) => {
    event.preventDefault();
    $("#dropZone").classList.remove("is-dragging");
    setPendingFiles([...event.dataTransfer.files].filter((file) => file.type.startsWith("image/")));
  });

  $("#editPhotoBtn").addEventListener("click", () => {
    closeModal("photoModal");
    openEditor(getCurrentPhoto());
  });
  $("#deletePhotoBtn").addEventListener("click", deleteCurrentPhoto);
  $("#editForm").addEventListener("submit", savePhotoEdit);

  $("#manageMusicBtn").addEventListener("click", () => openModal("musicModal"));
  $("#musicInput").addEventListener("change", importMusic);
  $("#deleteMusicBtn").addEventListener("click", deleteMusic);
  $("#clearAllMusicBtn")?.addEventListener("click", clearAllMusic);
  $("#playBtn").addEventListener("click", toggleMusic);
  $("#prevBtn")?.addEventListener("click", playPrevious);
  $("#nextBtn")?.addEventListener("click", playNext);
  $("#progressTrack").addEventListener("click", seekMusic);

  $("#exportBtn").addEventListener("click", exportBackup);
  $("#restoreBtn").addEventListener("click", () => $("#restoreInput").click());
  $("#restoreInput").addEventListener("change", restoreBackup);

  $$("[data-close]").forEach((node) => {
    node.addEventListener("click", () => closeModal(node.dataset.close));
  });

  state.audio.addEventListener("timeupdate", updateProgress);
  state.audio.addEventListener("ended", () => {
    playNext();
  });
}

function bindPlanetParallax() {
  const app = $("#app");
  const apply = (clientX, clientY) => {
    const x = (clientX / window.innerWidth - 0.5) * 2;
    const y = (clientY / window.innerHeight - 0.5) * 2;
    app.style.setProperty("--planet-primary-x", `${x * -10}px`);
    app.style.setProperty("--planet-primary-y", `${y * -8}px`);
    app.style.setProperty("--planet-ring-x", `${x * 14}px`);
    app.style.setProperty("--planet-ring-y", `${y * 10}px`);
    app.style.setProperty("--planet-distant-x", `${x * -22}px`);
    app.style.setProperty("--planet-distant-y", `${y * -16}px`);
  };

  window.addEventListener("mousemove", (event) => apply(event.clientX, event.clientY));
  window.addEventListener("touchmove", (event) => {
    const touch = event.touches[0];
    if (touch) apply(touch.clientX, touch.clientY);
  }, { passive: true });
}

function enterApp() {
  const name = $("#nameInput").value.trim();
  if (!name) {
    $("#identityTip").textContent = "先把姓名填上。仪式感不是摆设。";
    return;
  }

  state.isEditor = EDITOR_NAMES.has(name);
  document.body.classList.toggle("is-editor", state.isEditor);
  $("#modeBadge").textContent = state.isEditor ? `${name}，编辑模式` : `${name}，访客模式`;
  $("#identityScreen").classList.add("is-hidden");
  $("#app").classList.remove("is-hidden");

  if (!state.isEditor) {
    toast("你可以观看这片宇宙，但不能编辑内容。");
  } else {
    toast("欢迎回来，可以编辑照片和音乐。");
  }
}

function enterGuestApp() {
  state.isEditor = false;
  document.body.classList.remove("is-editor");
  $("#modeBadge").textContent = "公开查看";
  $("#identityScreen").classList.add("is-hidden");
  $("#app").classList.remove("is-hidden");
  toast("已进入公开查看模式，不能编辑内容。");
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        db.createObjectStore(STORE_PHOTOS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_MUSIC)) {
        db.createObjectStore(STORE_MUSIC, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function storeRequest(storeName, mode, callback) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = callback(store);
    // 如果回调返回了请求对象（单条操作），监听请求；否则监听事务完成（批量操作）
    if (request) {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } else {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    }
  });
}

async function loadStoredData() {
  let rawPhotos = await storeRequest(STORE_PHOTOS, "readonly", (store) => store.getAll());

  // 过滤掉数据损坏的照片（imageBlob 为空或无效）
  const validPhotos = [];
  const brokenIds = [];
  for (const photo of rawPhotos) {
    if (!photo.imageBlob || !(photo.imageBlob instanceof Blob) || photo.imageBlob.size === 0) {
      brokenIds.push(photo.id);
      continue;
    }
    validPhotos.push(photo);
  }
  // 清理损坏的照片
  if (brokenIds.length > 0) {
    for (const id of brokenIds) {
      await removePhoto(id);
    }
    console.warn(`已清理 ${brokenIds.length} 张损坏的照片`);
  }

  // 修补缺失 id 的照片，保证所有照片都有唯一ID
  let needSave = false;
  for (const photo of validPhotos) {
    if (!photo.id) {
      photo.id = crypto.randomUUID();
      needSave = true;
    }
  }
  if (needSave) {
    for (const photo of validPhotos) {
      await savePhoto(photo);
    }
  }

  state.photos = validPhotos;
  state.photos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // 加载歌单（支持多首歌曲）
  state.musicList = await storeRequest(STORE_MUSIC, "readonly", (store) => store.getAll());
  state.musicList.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // 从 localStorage 恢复播放索引
  const savedIndex = localStorage.getItem("lu_currentMusicIndex");
  if (savedIndex !== null) {
    const idx = parseInt(savedIndex, 10);
    if (idx >= 0 && idx < state.musicList.length) {
      state.currentMusicIndex = idx;
    } else {
      state.currentMusicIndex = state.musicList.length > 0 ? 0 : -1;
    }
  } else {
    state.currentMusicIndex = state.musicList.length > 0 ? 0 : -1;
  }
}

async function savePhoto(photo) {
  await storeRequest(STORE_PHOTOS, "readwrite", (store) => store.put(photo));
}

async function removePhoto(id) {
  await storeRequest(STORE_PHOTOS, "readwrite", (store) => store.delete(id));
}

async function saveMusic(musicItem) {
  await storeRequest(STORE_MUSIC, "readwrite", (store) => store.put(musicItem));
}

async function removeMusic(id) {
  await storeRequest(STORE_MUSIC, "readwrite", (store) => store.delete(id));
}

async function clearAllMusicStore() {
  await storeRequest(STORE_MUSIC, "readwrite", (store) => store.clear());
}

function renderGallery() {
  cleanupPhotoUrls();
  const gallery = $("#gallery");
  gallery.innerHTML = "";
  $("#emptyState").style.display = state.photos.length ? "none" : "block";

  state.photos.forEach((photo) => {
    try {
      normalizePhoto(photo);
      if (!photo.imageBlob || !(photo.imageBlob instanceof Blob)) return;
      const url = URL.createObjectURL(photo.imageBlob);
      state.photoUrls.add(url);
      const card = document.createElement("article");
      card.className = "memory";
      card.tabIndex = 0;
      card.style.left = `${photo.position.x}%`;
      card.style.top = `${photo.position.y}%`;
      card.style.zIndex = Math.max(1, Math.round((photo.position.z + 260) / 4));
      card.dataset.z = photo.position.z ?? 0;
      card.dataset.rot = photo.rotation ?? 0;
      card.dataset.scale = photo.scale ?? 1;
      card.dataset.ampX = Math.abs(photo.position.driftX ?? randomBetween(12, 34));
      card.dataset.ampY = Math.abs(photo.position.driftY ?? randomBetween(10, 30));
      card.dataset.speed = photo.position.speed ?? randomBetween(0.16, 0.36);
      card.dataset.phase = photo.position.phase ?? randomBetween(0, Math.PI * 2);
      card.dataset.tilt = randomBetween(1.4, 3.8);
      card.innerHTML = `
        <button class="memory-open" type="button" aria-label="查看${escapeHtml(photo.title || "照片详情")}">
          <img src="${url}" alt="${escapeHtml(photo.title || "照片")}">
          <span class="memory-caption">
            <strong>${escapeHtml(photo.title || "未命名")}</strong>
            <small>${escapeHtml(formatPhotoStamp(photo))}</small>
          </span>
        </button>
        <button class="memory-delete editor-only" type="button" aria-label="删除${escapeHtml(photo.title || "照片")}">删除</button>
      `;
      card.querySelector(".memory-open").addEventListener("click", () => openPhoto(photo.id));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") openPhoto(photo.id);
      });
      card.querySelector(".memory-delete").addEventListener("click", (event) => {
        event.stopPropagation();
        deletePhotoById(photo.id);
      });
      gallery.appendChild(card);
    } catch (err) {
      console.warn("照片卡片渲染失败:", photo.title || photo.id, err);
    }
  });
  startMemoryMotion();
}

function normalizePhoto(photo) {
  photo.position ||= randomPosition();
  photo.position.x ??= randomBetween(12, 88);
  photo.position.y ??= randomBetween(18, 82);
  photo.position.z ??= randomBetween(-180, 260);
  photo.position.driftX ??= randomBetween(-58, 58);
  photo.position.driftY ??= randomBetween(-48, 48);
  photo.position.speed ??= randomBetween(0.28, 0.68);
  photo.position.phase ??= randomBetween(0, Math.PI * 2);
  photo.rotation ??= randomBetween(-12, 12);
  photo.scale ??= randomBetween(0.78, 1.18);
  photo.exactTime ??= "";
  photo.weather ??= "";
}

function formatPhotoStamp(photo) {
  const parts = [photo.time, photo.exactTime, photo.location].filter(Boolean);
  return parts.length ? parts.join(" · ") : "点击写下这一刻";
}

function cleanupPhotoUrls() {
  state.photoUrls.forEach((url) => URL.revokeObjectURL(url));
  state.photoUrls.clear();
}

function setPendingFiles(files) {
  const images = files.filter((f) => f.type.startsWith("image/"));
  // 去重（按文件名 + 大小）
  for (const file of images) {
    const exists = state.pendingFiles.some(
      (f) => f.name === file.name && f.size === file.size
    );
    if (!exists) state.pendingFiles.push(file);
  }
  $("#confirmImportBtn").disabled = state.pendingFiles.length === 0;
  renderPendingList();
}

function renderPendingList() {
  const list = $("#importList");
  // 清理旧的 ObjectURL
  list.querySelectorAll("img").forEach((img) => {
    if (img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
  });
  list.innerHTML = "";

  state.pendingFiles.forEach((file, index) => {
    const url = URL.createObjectURL(file);
    const wrapper = document.createElement("div");
    wrapper.className = "pending-item";
    wrapper.innerHTML = `
      <img src="${url}" alt="${escapeHtml(file.name)}">
      <button class="pending-remove" type="button" data-index="${index}" aria-label="移除">\u00d7</button>
    `;
    wrapper.querySelector("img").onload = () => URL.revokeObjectURL(url);
    wrapper.querySelector(".pending-remove").addEventListener("click", (event) => {
      event.stopPropagation();
      removePendingFile(index);
    });
    list.appendChild(wrapper);
  });
}

function removePendingFile(index) {
  state.pendingFiles.splice(index, 1);
  $("#confirmImportBtn").disabled = state.pendingFiles.length === 0;
  renderPendingList();
}

async function importPendingPhotos() {
  if (!state.isEditor) return toast("访客不能导入照片。");
  if (!state.pendingFiles.length) return;

  const total = state.pendingFiles.length;
  $("#confirmImportBtn").disabled = true;
  $("#dropZone").style.pointerEvents = "none";
  $("#importProgress").style.display = "flex";
  updateImportProgress(0, total);

  const blobs = new Array(total).fill(null);
  let done = 0;

  await Promise.all(
    state.pendingFiles.map(async (file, i) => {
      try {
        blobs[i] = await compressImage(file);
      } catch (err) {
        console.warn(`压缩失败: ${file.name}`, err);
      }
      done++;
      updateImportProgress(done, total);
    })
  );

  const successCount = blobs.filter((b) => b !== null).length;

  if (successCount === 0) {
    $("#confirmImportBtn").disabled = false;
    $("#dropZone").style.pointerEvents = "";
    $("#importProgress").style.display = "none";
    return toast("所有照片压缩失败，请检查图片格式。");
  }

  toast(`正在保存 ${successCount} 张照片。`);

  const photos = [];
  await storeRequest(STORE_PHOTOS, "readwrite", (store) => {
    for (let i = 0; i < blobs.length; i++) {
      const blob = blobs[i];
      if (!blob) continue;
      const photo = {
        id: crypto.randomUUID(),
        title: state.pendingFiles[i].name.replace(/\.[^.]+$/, ""),
        time: "",
        exactTime: "",
        location: "",
        weather: "",
        mood: "",
        event: "",
        tags: [],
        imageBlob: blob,
        createdAt: new Date().toISOString(),
        position: randomPosition(),
        rotation: randomBetween(-12, 12),
        scale: randomBetween(0.78, 1.18)
      };
      store.put(photo);
      photos.push(photo);
    }
  });

  state.photos.push(...photos);

  state.pendingFiles = [];
  $("#photoInput").value = "";
  $("#importList").innerHTML = "";
  $("#importProgress").style.display = "none";
  $("#dropZone").style.pointerEvents = "";
  closeModal("importModal");
  renderGallery();

  const msg = total > successCount
    ? `成功导入 ${photos.length} 张，${total - successCount} 张失败已跳过`
    : `照片已经进入宇宙。点击照片可以补时间、地点和故事。`;
  toast(msg);
}

function updateImportProgress(done, total) {
  const pct = Math.round((done / total) * 100);
  $("#importProgressFill").style.width = `${pct}%`;
  $("#importProgressText").textContent = `${done} / ${total}`;
}

function randomPosition() {
  return {
    x: randomBetween(12, 88),
    y: randomBetween(18, 82),
    z: randomBetween(-180, 260),
    driftX: randomBetween(-58, 58),
    driftY: randomBetween(-48, 48),
    speed: randomBetween(0.28, 0.68),
    phase: randomBetween(0, Math.PI * 2)
  };
}

function startMemoryMotion() {
  if (state.memoryMotionStarted) return;
  state.memoryMotionStarted = true;

  const animate = (time) => {
    const seconds = time / 1000;
    $$(".memory").forEach((card) => {
      const baseRot = Number(card.dataset.rot);
      const baseScale = Number(card.dataset.scale);
      const ampX = Number(card.dataset.ampX);
      const ampY = Number(card.dataset.ampY);
      const speed = Number(card.dataset.speed);
      const phase = Number(card.dataset.phase);
      const tilt = Number(card.dataset.tilt);
      const x = Math.sin(seconds * speed + phase) * ampX
        + Math.sin(seconds * speed * 0.43 + phase * 1.7) * ampX * 0.36;
      const y = Math.cos(seconds * speed * 0.82 + phase) * ampY
        + Math.sin(seconds * speed * 0.31 + phase * 2.1) * ampY * 0.42;
      const rotation = baseRot + Math.sin(seconds * speed * 0.76 + phase) * tilt;
      card.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${baseScale})`;
    });
    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

function randomBetween(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    let settled = false;
    // 超时兜底：30 秒后如果还没完成，用原始文件
    const fallback = setTimeout(() => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      console.warn(`压缩超时，使用原始文件: ${file.name}`);
      resolve(file);
    }, 30000);
    img.onload = () => {
      if (settled) return;
      const maxSide = 1200;
      const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
      if (ratio >= 1) {
        // 小图不需要压缩，直接用原始文件
        settled = true;
        clearTimeout(fallback);
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (settled) return;
        settled = true;
        clearTimeout(fallback);
        URL.revokeObjectURL(url);
        resolve(blob || file);
      }, "image/jpeg", 0.86);
    };
    img.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(fallback);
      URL.revokeObjectURL(url);
      reject(new Error("图片读取失败"));
    };
    img.src = url;
  });
}

function openPhoto(id) {
  const photo = state.photos.find((item) => item.id === id);
  if (!photo) return;
  state.currentPhotoId = id;
  // 先撤销上一个 detail image 的 URL，避免泄漏
  if (state.detailImageUrl) {
    URL.revokeObjectURL(state.detailImageUrl);
    state.detailImageUrl = "";
  }
  const url = URL.createObjectURL(photo.imageBlob);
  state.detailImageUrl = url;
  $("#detailImage").src = url;
  $("#detailImage").onload = () => {
    if (state.detailImageUrl === url) {
      URL.revokeObjectURL(url);
      state.detailImageUrl = "";
    }
  };
  $("#detailTitle").textContent = photo.title || "未命名的记忆";
  $("#detailTime").textContent = photo.time || "还没有写下日期";
  $("#detailExactTime").textContent = photo.exactTime || "还没有写下具体时间";
  $("#detailLocation").textContent = photo.location || "还没有写下地点";
  $("#detailWeather").textContent = photo.weather || "还没有写下天气";
  $("#detailMood").textContent = photo.mood || "还没有写下心情";
  $("#detailEvent").textContent = photo.event || "这张照片还没有写下故事。";
  $("#detailTags").textContent = photo.tags?.length ? photo.tags.map((tag) => `#${tag}`).join("  ") : "";
  openModal("photoModal");
}

function getCurrentPhoto() {
  return state.photos.find((item) => item.id === state.currentPhotoId);
}

function openEditor(photo) {
  if (!photo || !state.isEditor) return;
  $("#editHeading").textContent = "编辑照片";
  $("#photoTitle").value = photo.title || "";
  $("#photoTime").value = photo.time || "";
  $("#photoExactTime").value = photo.exactTime || "";
  $("#photoLocation").value = photo.location || "";
  $("#photoWeather").value = photo.weather || "";
  $("#photoMood").value = photo.mood || "";
  $("#photoTags").value = photo.tags?.join("，") || "";
  $("#photoEvent").value = photo.event || "";
  // 先撤销上一个编辑预览的 URL，避免泄漏
  if (state.editPreviewUrl) {
    URL.revokeObjectURL(state.editPreviewUrl);
    state.editPreviewUrl = "";
  }
  const url = URL.createObjectURL(photo.imageBlob);
  state.editPreviewUrl = url;
  $("#editPreview").innerHTML = `<img src="${url}" alt="">`;
  $("#editPreview img").onload = () => {
    if (state.editPreviewUrl === url) {
      URL.revokeObjectURL(url);
      state.editPreviewUrl = "";
    }
  };
  openModal("editModal");
}

async function savePhotoEdit(event) {
  event.preventDefault();
  if (!state.isEditor) return toast("访客不能编辑照片。");
  const photoId = state.currentPhotoId;
  if (!photoId) return;

  // 从 IndexedDB 重新查找照片，避免依赖缓存对象
  const photo = await storeRequest(STORE_PHOTOS, "readonly", (store) => store.get(photoId));
  if (!photo) return toast("照片数据异常，请刷新页面。");

  photo.title = $("#photoTitle").value.trim();
  photo.time = $("#photoTime").value;
  photo.exactTime = $("#photoExactTime").value;
  photo.location = $("#photoLocation").value.trim();
  photo.weather = $("#photoWeather").value.trim();
  photo.mood = $("#photoMood").value.trim();
  photo.tags = splitTags($("#photoTags").value);
  photo.event = $("#photoEvent").value.trim();
  await savePhoto(photo);

  // 同步更新内存中的照片
  const idx = state.photos.findIndex((item) => item.id === photoId);
  if (idx !== -1) state.photos[idx] = photo;

  closeModal("editModal");
  renderGallery();
  openPhoto(photo.id);
  toast("这张照片的故事已经保存。");
}

function splitTags(value) {
  return value
    .split(/[，,]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

async function deleteCurrentPhoto() {
  if (!state.isEditor) return toast("访客不能删除照片。");
  const photo = getCurrentPhoto();
  if (!photo) return;
  await deletePhotoById(photo.id);
}

async function deletePhotoById(id) {
  if (!state.isEditor) return toast("访客不能删除照片。");
  const photo = state.photos.find((item) => item.id === id);
  if (!photo) return;
  if (!confirm(`确定删除「${photo.title || "这张照片"}」吗？删除后不能从网页里恢复。`)) return;
  await removePhoto(photo.id);
  state.photos = state.photos.filter((item) => item.id !== photo.id);
  if (state.currentPhotoId === photo.id) state.currentPhotoId = null;
  closeModal("photoModal");
  renderGallery();
  toast("照片已删除。");
}

// ========== 音乐系统：歌单 ==========

async function importMusic(event) {
  if (!state.isEditor) return toast("访客不能导入音乐。");
  const files = [...event.target.files];
  if (!files.length) return;

  let added = 0;
  for (const file of files) {
    if (!file.type.startsWith("audio/")) continue;
    const musicItem = {
      id: crypto.randomUUID(),
      name: file.name.replace(/\.[^.]+$/, ""),
      blob: file,
      createdAt: new Date().toISOString()
    };
    await saveMusic(musicItem);
    state.musicList.push(musicItem);
    added++;
  }

  // 如果之前没有歌曲在播放，自动选中第一首
  if (state.currentMusicIndex === -1 && state.musicList.length > 0) {
    state.currentMusicIndex = 0;
    localStorage.setItem("lu_currentMusicIndex", "0");
  }

  renderMusic();
  renderPlaylist();
  event.target.value = "";
  toast(`已导入 ${added} 首音乐。`);
}

function renderMusic() {
  if (state.musicList.length === 0) {
    if (state.musicUrl) {
      URL.revokeObjectURL(state.musicUrl);
      state.musicUrl = "";
    }
    state.currentMusicId = null;
    state.audio.removeAttribute("src");
    $("#musicName").textContent = "未导入音乐";
    $("#currentMusic").textContent = "当前没有音乐";
    $("#deleteMusicBtn").style.display = "none";
    renderPlaylist();
    return;
  }

  // 只有当歌曲切换了才重新加载音频源
  const currentMusic = state.musicList[state.currentMusicIndex];
  if (currentMusic && currentMusic.id !== state.currentMusicId) {
    if (state.musicUrl) URL.revokeObjectURL(state.musicUrl);
    const url = URL.createObjectURL(currentMusic.blob);
    state.musicUrl = url;
    state.currentMusicId = currentMusic.id;
    state.audio.src = url;
    state.audio.load();
  }
  if (currentMusic) {
    $("#musicName").textContent = currentMusic.name;
    $("#currentMusic").textContent = `当前音乐：${currentMusic.name}（共 ${state.musicList.length} 首）`;
  }
  $("#deleteMusicBtn").style.display = "inline-flex";
  renderPlaylist();
}

function renderPlaylist() {
  const container = $("#playlistContainer");
  if (!container) return;

  if (state.musicList.length === 0) {
    container.innerHTML = '<p class="playlist-empty">歌单为空，导入音乐后会在这里显示。</p>';
    return;
  }

  container.innerHTML = state.musicList.map((item, index) => {
    const isActive = index === state.currentMusicIndex;
    return `
      <div class="playlist-item${isActive ? ' is-active' : ''}" data-index="${index}">
        <span class="playlist-item-name">${escapeHtml(item.name)}</span>
        <button class="playlist-item-delete editor-only" type="button" data-delete-index="${index}" aria-label="删除${escapeHtml(item.name)}">\u00d7</button>
      </div>
    `;
  }).join("");

  // 绑定点击播放
  container.querySelectorAll(".playlist-item").forEach((el) => {
    el.addEventListener("click", (event) => {
      if (event.target.closest(".playlist-item-delete")) return;
      const index = parseInt(el.dataset.index, 10);
      playSongAtIndex(index);
    });
  });

  // 绑定删除单首
  container.querySelectorAll(".playlist-item-delete").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const index = parseInt(btn.dataset.deleteIndex, 10);
      deleteMusicByIndex(index);
    });
  });

  // 更新删除按钮可见性
  if (!state.isEditor) {
    container.querySelectorAll(".playlist-item-delete").forEach((btn) => {
      btn.style.display = "none";
    });
  }
}

function playSongAtIndex(index) {
  if (index < 0 || index >= state.musicList.length) return;
  state.currentMusicIndex = index;
  localStorage.setItem("lu_currentMusicIndex", String(index));
  const musicItem = state.musicList[index];

  if (state.musicUrl) URL.revokeObjectURL(state.musicUrl);
  const url = URL.createObjectURL(musicItem.blob);
  state.musicUrl = url;
  state.currentMusicId = musicItem.id;
  state.audio.src = url;

  state.audio.play()
    .then(() => {
      $("#playIcon").textContent = "暂停";
      $("#musicName").textContent = musicItem.name;
    })
    .catch(() => {
      $("#musicName").textContent = musicItem.name;
      toast("浏览器阻止了自动播放，请点击播放按钮。");
    });

  renderPlaylist();
}

function playPrevious() {
  if (state.musicList.length === 0) return toast("歌单为空。");
  let index = state.currentMusicIndex - 1;
  if (index < 0) index = state.musicList.length - 1;
  playSongAtIndex(index);
}

function playNext() {
  if (state.musicList.length === 0) return toast("歌单为空。");
  let index = state.currentMusicIndex + 1;
  if (index >= state.musicList.length) index = 0;
  playSongAtIndex(index);
}

function toggleMusic() {
  if (state.musicList.length === 0) return toast("还没有导入音乐。");
  if (state.currentMusicIndex === -1) {
    state.currentMusicIndex = 0;
    localStorage.setItem("lu_currentMusicIndex", "0");
  }
  if (!state.audio.src || state.audio.src === window.location.href) {
    playSongAtIndex(state.currentMusicIndex);
    return;
  }
  if (state.audio.paused) {
    state.audio.play()
      .then(() => $("#playIcon").textContent = "暂停")
      .catch(() => toast("浏览器阻止了播放，请再点一次播放按钮。"));
  } else {
    state.audio.pause();
    $("#playIcon").textContent = "播放";
  }
}

function seekMusic(event) {
  if (!state.audio.duration) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;
  state.audio.currentTime = state.audio.duration * Math.max(0, Math.min(1, percent));
}

function updateProgress() {
  const duration = state.audio.duration || 0;
  const current = state.audio.currentTime || 0;
  const percent = duration ? (current / duration) * 100 : 0;
  $("#progressFill").style.width = `${percent}%`;
  $("#timeLabel").textContent = `${formatTime(current)} / ${formatTime(duration)}`;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minute = Math.floor(seconds / 60);
  const second = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minute}:${second}`;
}

async function deleteMusicByIndex(index) {
  if (!state.isEditor) return toast("访客不能删除音乐。");
  if (index < 0 || index >= state.musicList.length) return;
  const item = state.musicList[index];
  if (!confirm(`确定删除「${item.name}」吗？`)) return;

  await removeMusic(item.id);
  state.musicList.splice(index, 1);

  if (state.musicList.length === 0) {
    state.currentMusicIndex = -1;
    state.audio.pause();
    state.audio.removeAttribute("src");
    if (state.musicUrl) {
      URL.revokeObjectURL(state.musicUrl);
      state.musicUrl = "";
    }
    $("#playIcon").textContent = "播放";
    $("#musicName").textContent = "未导入音乐";
    localStorage.removeItem("lu_currentMusicIndex");
  } else if (index === state.currentMusicIndex) {
    state.currentMusicIndex = Math.min(index, state.musicList.length - 1);
    localStorage.setItem("lu_currentMusicIndex", String(state.currentMusicIndex));
    playSongAtIndex(state.currentMusicIndex);
    return;
  } else if (index < state.currentMusicIndex) {
    state.currentMusicIndex--;
    localStorage.setItem("lu_currentMusicIndex", String(state.currentMusicIndex));
  }

  renderMusic();
  toast(`已删除「${item.name}」。`);
}

async function deleteMusic() {
  if (!state.isEditor) return toast("访客不能删除音乐。");
  if (state.musicList.length === 0) return;
  if (!confirm("确定删除当前播放的歌曲吗？")) return;

  if (state.currentMusicIndex >= 0 && state.currentMusicIndex < state.musicList.length) {
    await deleteMusicByIndex(state.currentMusicIndex);
  }
}

async function clearAllMusic() {
  if (!state.isEditor) return toast("访客不能删除音乐。");
  if (state.musicList.length === 0) return;
  if (!confirm("确定清空全部歌单吗？")) return;

  state.audio.pause();
  state.audio.removeAttribute("src");
  if (state.musicUrl) {
    URL.revokeObjectURL(state.musicUrl);
    state.musicUrl = "";
  }

  await clearAllMusicStore();
  state.musicList = [];
  state.currentMusicIndex = -1;
  localStorage.removeItem("lu_currentMusicIndex");
  $("#playIcon").textContent = "播放";

  renderMusic();
  toast("歌单已清空。");
}

// ========== 备份与恢复 ==========

async function exportBackup() {
  if (!state.isEditor) return toast("访客不能导出备份。");
  const photos = [];
  for (const photo of state.photos) {
    photos.push({
      ...photo,
      imageBlob: await blobToDataUrl(photo.imageBlob)
    });
  }
  // 导出整个歌单
  const musicList = [];
  for (const item of state.musicList) {
    musicList.push({
      ...item,
      blob: await blobToDataUrl(item.blob)
    });
  }
  const backup = {
    app: "love-universe",
    version: 2,
    exportedAt: new Date().toISOString(),
    photos,
    musicList,
    currentMusicIndex: state.currentMusicIndex,
    // 向后兼容旧格式
    music: musicList.length > 0 ? musicList[0] : null
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `love-universe-backup-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  toast("备份文件已导出。");
}

async function restoreBackup(event) {
  if (!state.isEditor) return toast("访客不能恢复备份。");
  const file = event.target.files[0];
  if (!file) return;
  if (!confirm("恢复备份会覆盖当前网页里的照片和音乐，确定继续吗？")) return;

  try {
    const backup = JSON.parse(await file.text());
    const photos = [];
    for (const photo of backup.photos || []) {
      if (!photo.id) photo.id = crypto.randomUUID();
      photos.push({
        ...photo,
        imageBlob: dataUrlToBlob(photo.imageBlob)
      });
    }

    // 支持新旧歌单格式
    let musicList = [];
    if (backup.musicList && backup.musicList.length > 0) {
      musicList = backup.musicList.map((item) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        blob: dataUrlToBlob(item.blob)
      }));
    } else if (backup.music && backup.music.blob) {
      musicList = [{
        ...backup.music,
        id: backup.music.id || crypto.randomUUID(),
        blob: dataUrlToBlob(backup.music.blob)
      }];
    }

    await clearStore(STORE_PHOTOS);
    await clearStore(STORE_MUSIC);
    for (const photo of photos) await savePhoto(photo);
    for (const item of musicList) await saveMusic(item);

    state.photos = photos;
    state.musicList = musicList;
    state.currentMusicIndex = musicList.length > 0
      ? Math.min(backup.currentMusicIndex || 0, musicList.length - 1)
      : -1;
    localStorage.setItem("lu_currentMusicIndex", String(state.currentMusicIndex));

    renderGallery();
    renderMusic();
    closeModal("musicModal");
    toast("备份已恢复。");
  } catch (error) {
    toast("备份文件读取失败。");
  } finally {
    event.target.value = "";
  }
}

function clearStore(storeName) {
  return storeRequest(storeName, "readwrite", (store) => store.clear());
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const type = header.match(/data:(.*?);base64/)?.[1] || "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

function openModal(id) {
  const modal = $(`#${id}`);
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(id) {
  const modal = $(`#${id}`);
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("is-visible");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => node.classList.remove("is-visible"), 2600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function clearAllPhotos() {
  if (!state.isEditor) return toast("访客不能清空照片。");
  if (state.photos.length === 0) return toast("没有照片可以清空。");
  if (!confirm(`确定清空全部 ${state.photos.length} 张照片吗？此操作不可恢复。`)) return;

  await storeRequest(STORE_PHOTOS, "readwrite", (store) => store.clear());

  state.photos = [];
  state.currentPhotoId = null;
  closeModal("importModal");
  renderGallery();
  toast("全部照片已清空。");
}
