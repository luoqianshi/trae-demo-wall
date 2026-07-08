/* ===== RoomVerse App - Mature UI Edition ===== */

var screens = document.querySelectorAll(".screen");
var tabs = document.querySelectorAll(".tab");
var roomStage = document.getElementById("room-stage");
var pixiCanvas = document.getElementById("pixi-canvas");
var furnitureList = document.getElementById("furniture-list");
var feed = document.getElementById("feed");
var toast = document.getElementById("toast");
var photoInput = document.getElementById("photo-input");

/* ===== Constants ===== */
var TILE = 32;
var WALL_H = 40;

/* ===== Furniture Catalog ===== */
var furnitureCatalog = [
  { type: "bed",    name: "木质软床",   w: 3, h: 2, d: 2, color: 0xb88758, colorName: "#b88758", fabric: "#d8a7a2", size: "large" },
  { type: "desk",   name: "暖木书桌",   w: 2, h: 1, d: 2, color: 0xaa7848, colorName: "#aa7848", size: "large", surface: true },
  { type: "sofa",   name: "奶油沙发",   w: 3, h: 1, d: 1, color: 0xc8b89f, colorName: "#c8b89f", fabric: "#d6c9b6", size: "large" },
  { type: "closet", name: "原木收纳柜", w: 2, h: 1, d: 3, color: 0x9f7048, colorName: "#9f7048", size: "large", container: true, surface: true },
  { type: "shelf",  name: "圆角置物架", w: 2, h: 1, d: 3, color: 0xa57b51, colorName: "#a57b51", size: "large", container: true, surface: true },
  { type: "plant",  name: "治愈绿植",   w: 1, h: 1, d: 1, color: 0x8fae7f, colorName: "#8fae7f", size: "small", stackable: true },
  { type: "book",   name: "手账书本",   w: 1, h: 1, d: 1, color: 0xb9a7c8, colorName: "#b9a7c8", size: "small", stackable: true },
  { type: "rug",    name: "编织地毯",   w: 3, h: 2, d: 1, color: 0xc8a994, colorName: "#c8a994", size: "large" },
  { type: "box",    name: "藤编收纳盒", w: 1, h: 1, d: 1, color: 0xc49a68, colorName: "#c49a68", size: "small", stackable: true },
  { type: "lamp",   name: "暖光台灯",   w: 1, h: 1, d: 1, color: 0xe8c77f, colorName: "#e8c77f", size: "small", stackable: true }
];

/* ===== Room Shape Templates ===== */
var roomShapes = {
  rectangle: {
    name: "矩形房间", gridW: 8, gridH: 6,
    tiles: function() {
      var t = [];
      for (var y = 0; y < 6; y++) for (var x = 0; x < 8; x++) t.push({ x: x, y: y, type: "floor" });
      return t;
    },
    walls: function() {
      return [
        { x: 3, y: -1, w: 2, h: 1, type: "door" },
        { x: 6, y: -1, w: 2, h: 1, type: "window" }
      ];
    }
  },
  "l-shape": {
    name: "L 型房间", gridW: 8, gridH: 7,
    tiles: function() {
      var t = [];
      for (var y = 0; y < 7; y++) for (var x = 0; x < 8; x++) {
        if (x >= 5 && y >= 4) continue;
        t.push({ x: x, y: y, type: "floor" });
      }
      return t;
    },
    walls: function() {
      return [
        { x: 0, y: 3, w: 1, h: 1, type: "door" },
        { x: 2, y: -1, w: 2, h: 1, type: "window" }
      ];
    }
  },
  irregular: {
    name: "异形房间", gridW: 8, gridH: 7,
    tiles: function() {
      var t = [];
      for (var y = 0; y < 7; y++) for (var x = 0; x < 8; x++) {
        if ((x === 0 && y === 0) || (x === 7 && y === 6) || (x === 7 && y === 0)) continue;
        t.push({ x: x, y: y, type: "floor" });
      }
      return t;
    },
    walls: function() {
      return [
        { x: 3, y: -1, w: 2, h: 1, type: "door" },
        { x: 5, y: 6, w: 2, h: 1, type: "window" }
      ];
    }
  },
  balcony: {
    name: "带阳台房间", gridW: 9, gridH: 7,
    tiles: function() {
      var t = [];
      for (var y = 0; y < 7; y++) for (var x = 0; x < 9; x++) {
        if (y >= 5 && (x < 3 || x > 7)) continue;
        t.push({ x: x, y: y, type: y >= 5 ? "balcony" : "floor" });
      }
      return t;
    },
    walls: function() {
      return [
        { x: 4, y: -1, w: 2, h: 1, type: "door" },
        { x: 1, y: -1, w: 2, h: 1, type: "window" },
        { x: 4, y: 4, w: 2, h: 1, type: "door" }
      ];
    }
  }
};

/* ===== App State ===== */
var state = {
  activeScreen: "home",
  selectedShape: "rectangle",
  theme: "cozy",
  savedCount: 0,
  itemSeq: 0,
  selectedFurnitureId: null,
  roomData: null,
  pixiApp: null,
  isoContainer: null,
  furnitureSprites: [],
  dragging: null,
  dragOffset: { x: 0, y: 0 },
  communityFilter: "hot",
  communitySearch: "",
  historyStack: [],
  historyIndex: -1,
  maxHistory: 20,
  challengeProgress: {},
  roomLevel: 1,
  roomXP: 0,
  navStack: [],
  currentTab: "home",
  archives: [
    { id: "arch-1", name: "温馨阁楼 01", shape: "rectangle", theme: "cozy", shapeName: "矩形房间", time: "今天 09:40", furnitureCount: 12 },
    { id: "arch-2", name: "赛博宿舍", shape: "l-shape", theme: "cyber", shapeName: "L型房间", time: "昨天 22:18", furnitureCount: 10 }
  ],
  lastScanRoomData: null,
  drawColor: "#b88758",
  drawTool: "pen",
  importedFurniture: [],
  drawCanvasInited: false,
  myPosts: [],
  furnitureCollection: [
    { id: "fc-1", name: "木质软床", color: "#b88758", isSystem: true, source: "system" },
    { id: "fc-2", name: "暖木书桌", color: "#aa7848", isSystem: true, source: "system" },
    { id: "fc-3", name: "奶油沙发", color: "#c8b89f", isSystem: true, source: "system" },
    { id: "fc-4", name: "治愈绿植", color: "#8fae7f", isSystem: true, source: "system" },
    { id: "fc-5", name: "暖光台灯", color: "#e8c77f", isSystem: true, source: "system" },
    { id: "fc-6", name: "编织地毯", color: "#c8a994", isSystem: true, source: "system" }
  ]
};

/* ===== Challenge System ===== */
var challenges = [
  { id: "clear_path", title: "清出主通道", desc: "确保房间中央留出 2x2 通行空间", reward: 15, check: function(data) {
    var cx = Math.floor(data.grid_width / 2) - 1;
    var cy = Math.floor(data.grid_height / 2) - 1;
    for (var x = cx; x < cx + 2; x++) for (var y = cy; y < cy + 2; y++) {
      var occupied = data.furniture.some(function(f) {
        return f.gx <= x && x < f.gx + f.w && f.gy <= y && y < f.gy + f.h && (f.z || 0) === 0;
      });
      if (occupied) return false;
    }
    return true;
  }},
  { id: "storage_zone", title: "杂物归入收纳区", desc: "将收纳柜/置物架靠墙放置", reward: 15, check: function(data) {
    return data.furniture.some(function(f) {
      return (f.type === "closet" || f.type === "shelf") && (f.gx === 0 || f.gy === 0 || f.gx >= data.grid_width - f.w || f.gy >= data.grid_height - f.h);
    });
  }},
  { id: "desk_window", title: "书桌靠窗", desc: "将书桌放置在窗户附近", reward: 20, check: function(data) {
    var winX = data.wall_tiles.filter(function(w) { return w.type === "window"; }).map(function(w) { return w.x; });
    return data.furniture.some(function(f) {
      return f.type === "desk" && winX.some(function(wx) { return Math.abs(f.gx - wx) <= 2; });
    });
  }},
  { id: "storage_score", title: "收纳效率 80+", desc: "整洁度达到 80 分以上", reward: 25, check: function(data) {
    var storage = data.furniture.filter(function(f) { return f.type === "closet" || f.type === "box"; }).length;
    var count = data.furniture.length;
    var clean = Math.min(99, 62 + storage * 12 - Math.max(0, count - 7) * 3);
    return clean >= 80;
  }},
  { id: "theme_share", title: "切换主题保存分享卡", desc: "切换任意主题并保存房间", reward: 25, check: function(data) {
    return state.savedCount > 0;
  }}
];

/* ===== Community Seed ===== */
var communitySeed = [
  { user: "阿眠", title: "3 平米宿舍角落改造", text: "分享了自己导入的藤编柜和床边摆放方案，可一键套用。", likes: 248, tags: ["宿舍", "收纳", "薄荷木屋"], theme: "cozy", type: "hot", comments: ["这个柜子可以放书吗？", "可以，小物件会自动吸附到柜体上层。"], visibility: "full", furnitureList: [{"name":"藤编柜","color":"#c49a68"},{"name":"木质床","color":"#b88758"}], liked: false, likedCount: 248, myComments: [] },
  { user: "橘子岛民", title: "租房客的低预算温暖房间", text: "没有真的买家具前，先用 RoomVerse 试了三版布局。", likes: 193, tags: ["租房", "橘子小镇", "低预算"], theme: "vintage", type: "latest", comments: ["书桌靠窗这版更舒服。"], visibility: "furniture", furnitureList: [{"name":"复古书桌","color":"#a89068"},{"name":"布艺沙发","color":"#c8a088"},{"name":"落地灯","color":"#d4c4a8"}], liked: false, likedCount: 193, myComments: [] },
  { user: "矿洞猫", title: "星夜工作台挑战", text: "导入了自己的台灯模型，放在书桌上不会与桌面冲突。", likes: 311, tags: ["工作区", "像素风", "挑战"], theme: "cyber", type: "events", comments: ["想要同款台灯！", "已开放复制到我的家居库。"], visibility: "image", furnitureList: [{"name":"金属台灯","color":"#989090"},{"name":"电竞椅","color":"#78a8e0"}], liked: false, likedCount: 311, myComments: [] },
  { user: "小鹿", title: "架子收纳模板", text: "三层置物架支持书本、植物、台灯堆叠，小房间很实用。", likes: 176, tags: ["导入家具", "置物架", "收纳"], theme: "minimal", type: "hot", comments: ["可以直接用你的架子吗？"], visibility: "full", furnitureList: [{"name":"三层置物架","color":"#b4aca4"},{"name":"绿植","color":"#8fae7f"},{"name":"小台灯","color":"#e8c77f"}], liked: false, likedCount: 176, myComments: [] }
];

/* ===== Navigation ===== */
function navigateTo(screenName) {
  var targetEl = document.querySelector('.screen[data-screen="' + screenName + '"]');
  if (!targetEl) return;
  var isSubpage = targetEl.classList.contains("subpage");

  if (isSubpage) {
    state.navStack.push(state.activeScreen);
    state.activeScreen = screenName;
    targetEl.classList.add("active");
    targetEl.classList.remove("exiting");
    if (screenName === "room-editor") initEditor();
    if (screenName === "challenges") renderChallengesFull();
    if (screenName === "post-detail") renderPostDetail();
    if (screenName === "room-detail") renderRoomDetail();
    if (screenName === "archives") renderArchivesFullList();
  } else {
    state.navStack = [];
    state.currentTab = screenName;
    state.activeScreen = screenName;
    document.querySelectorAll(".screen.primary").forEach(function(s) {
      s.classList.toggle("active", s.dataset.screen === screenName);
    });
    tabs.forEach(function(t) {
      t.classList.toggle("active", t.dataset.nav === screenName);
    });
  }
}

function goBack() {
  if (state.navStack.length === 0) return;
  var prev = state.navStack.pop();
  var currentEl = document.querySelector('.screen.subpage.active');
  if (currentEl) {
    currentEl.classList.remove("active");
    currentEl.classList.add("exiting");
    setTimeout(function() {
      currentEl.classList.remove("exiting");
    }, 350);
  }
  state.activeScreen = prev;
}

/* ===== Toast ===== */
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(function() { toast.classList.remove("show"); }, 2000);
}

/* ===== Overlay ===== */
function showOverlay(id) {
  var el = document.getElementById(id);
  if (el) { el.style.display = "flex"; el.classList.add("active"); }
}
function hideOverlay(id) {
  var el = document.getElementById(id);
  if (el) { el.style.display = "none"; el.classList.remove("active"); }
}

/* ===== History / Undo-Redo ===== */
function pushHistory() {
  if (!state.roomData) return;
  var snapshot = JSON.stringify(state.roomData);
  if (state.historyIndex >= 0 && state.historyStack[state.historyIndex] === snapshot) return;
  state.historyIndex++;
  state.historyStack = state.historyStack.slice(0, state.historyIndex);
  state.historyStack.push(snapshot);
  if (state.historyStack.length > state.maxHistory) {
    state.historyStack.shift();
    state.historyIndex--;
  }
  updateUndoRedoButtons();
}

function undo() {
  if (state.historyIndex <= 0) return showToast("没有可撤销的操作");
  state.historyIndex--;
  state.roomData = JSON.parse(state.historyStack[state.historyIndex]);
  rebuildFurnitureSprites();
  renderIsoRoom();
  updateScores();
  updateUndoRedoButtons();
  showToast("已撤销");
}

function redo() {
  if (state.historyIndex >= state.historyStack.length - 1) return showToast("没有可重做的操作");
  state.historyIndex++;
  state.roomData = JSON.parse(state.historyStack[state.historyIndex]);
  rebuildFurnitureSprites();
  renderIsoRoom();
  updateScores();
  updateUndoRedoButtons();
  showToast("已重做");
}

function updateUndoRedoButtons() {
  var undoBtn = document.querySelector("[data-action='undo']");
  var redoBtn = document.querySelector("[data-action='redo']");
  if (undoBtn) undoBtn.style.opacity = state.historyIndex > 0 ? "1" : "0.35";
  if (redoBtn) redoBtn.style.opacity = state.historyIndex < state.historyStack.length - 1 ? "1" : "0.35";
}

function rebuildFurnitureSprites() {
  state.furnitureSprites = [];
}

/* ===== Photo Upload & AI Scan ===== */
function handlePhoto(file) {
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById("preview-img").src = e.target.result;
    document.getElementById("photo-preview").style.display = "block";
    startAIScanAnimation();
  };
  reader.readAsDataURL(file);
}

function startAIScanAnimation() {
  var scanOverlay = document.getElementById("scan-overlay");
  var scanProgress = document.getElementById("scan-progress");
  var scanStage = document.getElementById("scan-stage");
  var scanBoxes = document.getElementById("scan-boxes");
  var scanImg = document.getElementById("scan-img");
  var previewImg = document.getElementById("preview-img");
  if (!scanOverlay) return;

  if (scanImg && previewImg) scanImg.src = previewImg.src;
  scanOverlay.style.display = "flex";
  scanProgress.style.width = "0%";
  scanStage.textContent = "正在识别房间轮廓...";
  scanBoxes.innerHTML = "";

  var stages = [
    { pct: 20, text: "正在识别房间轮廓...", boxes: [{l:10,t:20,w:30,h:25}] },
    { pct: 45, text: "正在检测门窗位置...", boxes: [{l:50,t:15,w:20,h:15},{l:15,t:55,w:25,h:20}] },
    { pct: 70, text: "正在识别家具类型与尺寸...", boxes: [{l:30,t:40,w:35,h:30},{l:65,t:60,w:20,h:18}] },
    { pct: 95, text: "正在生成像素网格...", boxes: [{l:10,t:20,w:30,h:25},{l:50,t:15,w:20,h:15},{l:30,t:40,w:35,h:30}] }
  ];

  var stageIdx = 0;
  function nextStage() {
    if (stageIdx >= stages.length) {
      setTimeout(function() {
        scanOverlay.style.display = "none";
        simulateAIAnalysis();
      }, 400);
      return;
    }
    var s = stages[stageIdx];
    scanProgress.style.width = s.pct + "%";
    scanStage.textContent = s.text;
    scanBoxes.innerHTML = s.boxes.map(function(b) {
      return '<div class="scan-box" style="left:' + b.l + '%;top:' + b.t + '%;width:' + b.w + '%;height:' + b.h + '%;"></div>';
    }).join("");
    stageIdx++;
    setTimeout(nextStage, 700);
  }
  nextStage();
}

function simulateAIAnalysis() {
  var shapes = ["rectangle", "l-shape", "irregular", "balcony"];
  var shapeNames = { rectangle: "矩形", "l-shape": "L 型", irregular: "异形", balcony: "带阳台" };
  var picked = shapes[Math.floor(Math.random() * shapes.length)];
  state.selectedShape = picked;

  var shape = roomShapes[picked];
  document.getElementById("ai-shape").textContent = shapeNames[picked];
  document.getElementById("ai-size").textContent = shape.gridW + "x" + shape.gridH;
  document.getElementById("ai-doors").textContent = shape.walls().filter(function(w) { return w.type === "door"; }).length + "门 / " + shape.walls().filter(function(w) { return w.type === "window"; }).length + "窗";
  document.getElementById("ai-furniture").textContent = (Math.floor(Math.random() * 4) + 2) + "件";

  /* Pre-generate room data so editor loads the scanned room */
  state.lastScanRoomData = generateRoomData();

  document.getElementById("ai-result").style.display = "block";
  showToast("AI 分析完成（模拟数据）");
}

/* ===== Generate Room Data ===== */
function generateRoomData() {
  var shape = roomShapes[state.selectedShape];
  var floorTiles = shape.tiles();
  var wallDefs = shape.walls();

  var wallTiles = [];
  var doors = [];
  var windows = [];

  wallDefs.forEach(function(w) {
    if (w.type === "door") {
      doors.push({ x: w.x, y: w.y, width: w.w, height: w.h });
    } else {
      windows.push({ x: w.x, y: w.y, width: w.w, height: w.h });
    }
    for (var dx = 0; dx < w.w; dx++) {
      wallTiles.push({ x: w.x + dx, y: w.y, type: w.type });
    }
  });

  var furniture = [
    { type: "bed", name: "木质软床", gx: 1, gy: 1, z: 0, w: 3, h: 2, d: 2, color: "#b88758", fabric: "#d8a7a2", rotation: 0, size: "large" },
    { type: "desk", name: "暖木书桌", gx: 5, gy: 1, z: 0, w: 2, h: 1, d: 2, color: "#aa7848", rotation: 0, size: "large", surface: true },
    { type: "plant", name: "治愈绿植", gx: 5, gy: 1, z: 2, w: 1, h: 1, d: 1, color: "#8fae7f", rotation: 0, size: "small", stackable: true },
    { type: "shelf", name: "圆角置物架", gx: 1, gy: 4, z: 0, w: 2, h: 1, d: 3, color: "#a57b51", rotation: 0, size: "large", surface: true, container: true }
  ];

  state.roomData = {
    room_shape: state.selectedShape,
    grid_width: shape.gridW,
    grid_height: shape.gridH,
    floor_tiles: floorTiles,
    wall_tiles: wallTiles,
    doors: doors,
    windows: windows,
    furniture: furniture
  };

  state.itemSeq = furniture.length;
  pushHistory();
  return state.roomData;
}

/* ===== PixiJS Isometric Engine - Refined Geometric Pixel Style ===== */
function isoX(gx, gy) { return (gx - gy) * TILE * 0.5; }
function isoY(gx, gy) { return (gx + gy) * TILE * 0.25; }

function hexToRgb(hex) {
  var r = (hex >> 16) & 255;
  var g = (hex >> 8) & 255;
  var b = hex & 255;
  return { r: r, g: g, b: b };
}

function darken(hex, factor) {
  var c = hexToRgb(hex);
  return (Math.floor(c.r * factor) << 16) | (Math.floor(c.g * factor) << 8) | Math.floor(c.b * factor);
}

function lighten(hex, factor) {
  var c = hexToRgb(hex);
  var r = Math.min(255, Math.floor(c.r + (255 - c.r) * factor));
  var g = Math.min(255, Math.floor(c.g + (255 - c.g) * factor));
  var b = Math.min(255, Math.floor(c.b + (255 - c.b) * factor));
  return (r << 16) | (g << 8) | b;
}

function blendColor(hex, target, t) {
  var a = hexToRgb(hex), b = hexToRgb(target);
  var r = Math.floor(a.r + (b.r - a.r) * t);
  var g = Math.floor(a.g + (b.g - a.g) * t);
  var bl = Math.floor(a.b + (b.b - a.b) * t);
  return (r << 16) | (g << 8) | bl;
}

var themeColors = {
  cozy:    { bg: 0xead8c0, floor: 0xd8c4a4, floorAlt: 0xccb892, grid: 0x9a8260, wall: 0xf8edd8, wallSide: 0xd8c4a4, window: 0xc0d0d8, balcony: 0xc8d8c4, accent: 0xc8a070, glow: 0xffe4b0, glowAlt: 0xffd898, shadow: 0x8a7050, highlight: 0xfff8ee, name: "温馨阁楼" },
  vintage: { bg: 0xd8c8ac, floor: 0xbca880, floorAlt: 0xac9470, grid: 0x7a6248, wall: 0xece0cc, wallSide: 0xbca880, window: 0xb0c0c8, balcony: 0xbcc4ac, accent: 0x9a7048, glow: 0xf4cc98, glowAlt: 0xe8c088, shadow: 0x6a5438, highlight: 0xf8f0e0, name: "复古书房" },
  cyber:   { bg: 0xc4bcb4, floor: 0xaca8a4, floorAlt: 0x9c9898, grid: 0x706868, wall: 0xdcd4cc, wallSide: 0xaca098, window: 0xb8a8c8, balcony: 0xbcb8c4, accent: 0xa890b8, glow: 0xe4c8a8, glowAlt: 0xd8bca0, shadow: 0x585050, highlight: 0xf0ece8, name: "赛博宿舍" },
  minimal: { bg: 0xdcd4cc, floor: 0xc4bcb4, floorAlt: 0xb8b0a8, grid: 0x807870, wall: 0xece4dc, wallSide: 0xc4b8a4, window: 0xb0c0c8, balcony: 0xbcc4bc, accent: 0x948c7c, glow: 0xf4dca8, glowAlt: 0xe8d098, shadow: 0x706860, highlight: 0xf8f4f0, name: "极简租房" }
};

function initPixi() {
  if (state.pixiApp) { state.pixiApp.destroy(true); state.pixiApp = null; }

  var w = roomStage.clientWidth;
  var h = roomStage.clientHeight;

  state.pixiApp = new PIXI.Application({
    width: w, height: h,
    backgroundColor: (themeColors[state.theme] || themeColors.cozy).bg,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true
  });

  pixiCanvas.style.display = "none";
  var pixiView = state.pixiApp.view;
  pixiView.style.position = "absolute";
  pixiView.style.top = "0";
  pixiView.style.left = "0";
  pixiView.style.width = w + "px";
  pixiView.style.height = h + "px";
  pixiView.style.touchAction = "none";
  roomStage.appendChild(pixiView);

  state.isoContainer = new PIXI.Container();
  state.isoContainer.sortableChildren = true;
  state.pixiApp.stage.addChild(state.isoContainer);

  renderIsoRoom();
  setupPixiInteraction();
}

function renderIsoRoom() {
  if (!state.roomData || !state.isoContainer) return;
  state.isoContainer.removeChildren();
  state.furnitureSprites = [];

  var data = state.roomData;
  var tc = themeColors[state.theme] || themeColors.cozy;
  var centerX = state.pixiApp.screen.width / 2;
  var centerY = state.pixiApp.screen.height * 0.42;

  state.pixiApp.renderer.background.color = tc.bg;

  /* Ambient light layers */
  var ambient = new PIXI.Graphics();
  ambient.beginFill(tc.glow, 0.12);
  ambient.drawEllipse(centerX + 80, centerY - 40, 200, 100);
  ambient.endFill();
  ambient.beginFill(tc.glowAlt, 0.08);
  ambient.drawEllipse(centerX + 60, centerY - 20, 240, 120);
  ambient.endFill();
  ambient.zIndex = -10;
  state.isoContainer.addChild(ambient);

  /* Floor tiles with refined geometry */
  data.floor_tiles.forEach(function(tile) {
    var px = centerX + isoX(tile.x, tile.y);
    var py = centerY + isoY(tile.x, tile.y);
    var isAlt = (tile.x + tile.y) % 2 === 0;
    var isBalcony = tile.type === "balcony";
    var baseColor = isBalcony ? tc.balcony : (isAlt ? tc.floor : tc.floorAlt);
    var edgeColor = darken(baseColor, 0.82);

    var g = new PIXI.Graphics();
    var hw = TILE * 0.5;
    var hh = TILE * 0.25;

    /* Main tile face */
    g.beginFill(baseColor);
    g.moveTo(0, -hh);
    g.lineTo(hw, 0);
    g.lineTo(0, hh);
    g.lineTo(-hw, 0);
    g.closePath();
    g.endFill();

    /* Subtle inner bevel - top-left highlight edge */
    g.lineStyle(0.8, lighten(baseColor, 0.12), 0.5);
    g.moveTo(0, -hh);
    g.lineTo(-hw, 0);

    /* Subtle inner bevel - bottom-right shadow edge */
    g.lineStyle(0.8, edgeColor, 0.4);
    g.moveTo(hw, 0);
    g.lineTo(0, hh);

    /* Geometric pixel cross detail */
    g.lineStyle(0.5, tc.grid, 0.18);
    g.moveTo(-hw * 0.5, -hh * 0.5);
    g.lineTo(0, -hh * 0.25);
    g.lineTo(hw * 0.5, -hh * 0.5);
    g.moveTo(-hw * 0.5, hh * 0.5);
    g.lineTo(0, hh * 0.25);
    g.lineTo(hw * 0.5, hh * 0.5);

    /* Corner pixel dots */
    g.lineStyle(0);
    g.beginFill(tc.grid, 0.15);
    g.drawCircle(-hw * 0.5, -hh * 0.5, 1);
    g.drawCircle(hw * 0.5, -hh * 0.5, 1);
    g.endFill();

    g.x = px;
    g.y = py;
    g.zIndex = tile.y * 100 + tile.x;
    state.isoContainer.addChild(g);
  });

  /* Walls with refined lighting */
  data.wall_tiles.forEach(function(w) {
    var px = centerX + isoX(w.x, w.y);
    var py = centerY + isoY(w.x, w.y);
    var isDoor = w.type === "door";
    var isWindow = w.type === "window";
    var color = isDoor ? 0xdab87f : isWindow ? tc.window : tc.wall;
    var sideColor = isDoor ? 0xba9458 : isWindow ? darken(tc.window, 0.78) : tc.wallSide;
    var darkSide = darken(color, 0.68);

    var g = new PIXI.Graphics();
    var hw = TILE * 0.5;
    var hh = TILE * 0.25;

    /* Top face */
    g.beginFill(color);
    g.moveTo(0, -hh);
    g.lineTo(hw, 0);
    g.lineTo(0, hh);
    g.lineTo(-hw, 0);
    g.closePath();
    g.endFill();

    /* Top face highlight edge */
    g.lineStyle(0.8, lighten(color, 0.15), 0.6);
    g.moveTo(0, -hh);
    g.lineTo(-hw, 0);
    g.lineTo(0, hh);

    /* Left face with gradient simulation */
    g.beginFill(sideColor);
    g.moveTo(-hw, 0);
    g.lineTo(0, hh);
    g.lineTo(0, hh + WALL_H);
    g.lineTo(-hw, WALL_H);
    g.closePath();
    g.endFill();

    /* Left face shadow strip at bottom */
    g.beginFill(darkSide, 0.3);
    g.moveTo(-hw, WALL_H * 0.7);
    g.lineTo(0, hh + WALL_H * 0.7);
    g.lineTo(0, hh + WALL_H);
    g.lineTo(-hw, WALL_H);
    g.closePath();
    g.endFill();

    /* Right face darker */
    g.beginFill(darken(color, 0.72));
    g.moveTo(hw, 0);
    g.lineTo(0, hh);
    g.lineTo(0, hh + WALL_H);
    g.lineTo(hw, WALL_H);
    g.closePath();
    g.endFill();

    /* Right face deep shadow at bottom */
    g.beginFill(darken(color, 0.55), 0.25);
    g.moveTo(hw, WALL_H * 0.6);
    g.lineTo(0, hh + WALL_H * 0.6);
    g.lineTo(0, hh + WALL_H);
    g.lineTo(hw, WALL_H);
    g.closePath();
    g.endFill();

    /* Window glass effect */
    if (isWindow) {
      g.beginFill(lighten(tc.window, 0.35), 0.4);
      g.moveTo(0, -hh * 0.6);
      g.lineTo(hw * 0.6, -hh * 0.2);
      g.lineTo(0, hh * 0.2);
      g.lineTo(-hw * 0.6, -hh * 0.2);
      g.closePath();
      g.endFill();
      /* Window cross bar */
      g.lineStyle(1.2, darken(tc.window, 0.6), 0.5);
      g.moveTo(0, -hh * 0.7);
      g.lineTo(0, hh * 0.7);
      g.moveTo(-hw * 0.5, -hh * 0.15);
      g.lineTo(hw * 0.5, -hh * 0.15);
    }

    /* Door panel detail */
    if (isDoor) {
      g.lineStyle(0.8, darken(0xdab87f, 0.7), 0.4);
      g.moveTo(-hw * 0.3, WALL_H * 0.15);
      g.lineTo(-hw * 0.3, WALL_H * 0.85);
      g.moveTo(hw * 0.3, WALL_H * 0.15);
      g.lineTo(hw * 0.3, WALL_H * 0.85);
      /* Door handle */
      g.lineStyle(0);
      g.beginFill(0xf2d99a, 0.9);
      g.drawCircle(hw * 0.15, WALL_H * 0.55, 2);
      g.endFill();
    }

    g.x = px;
    g.y = py - WALL_H;
    g.zIndex = w.y * 100 + w.x + 500;
    state.isoContainer.addChild(g);
  });

  /* Furniture with refined pixel style */
  data.furniture.forEach(function(f, idx) {
    var sprite = createFurnitureSprite(f, idx);
    state.furnitureSprites.push(sprite);
    state.isoContainer.addChild(sprite);
  });

  drawAxisIndicator(centerX, centerY);
}

function createFurnitureSprite(f, idx) {
  var centerX = state.pixiApp.screen.width / 2;
  var centerY = state.pixiApp.screen.height * 0.42;
  var px = centerX + isoX(f.gx, f.gy);
  var py = centerY + isoY(f.gx, f.gy) - ((f.z || 0) * 9);

  var fw = f.w * TILE;
  var fh = f.h * TILE;
  var fd = f.d * (TILE * 0.5);
  var colorHex = parseInt(f.color.replace("#", "0x"));
  var woodBase = colorHex;
  var topColor = lighten(woodBase, 0.22);
  var topHighlight = lighten(woodBase, 0.35);
  var leftColor = woodBase;
  var leftDark = darken(woodBase, 0.72);
  var rightColor = darken(woodBase, 0.78);
  var rightDark = darken(woodBase, 0.58);
  var fabricHex = f.fabric ? parseInt(f.fabric.replace("#", "0x")) : null;

  var container = new PIXI.Container();
  container.interactive = true;
  container.buttonMode = true;
  container._furnitureData = f;
  container._idx = idx;

  var g = new PIXI.Graphics();
  var shw = fw * 0.5;
  var shh = fh * 0.25;

  /* Soft shadow - offset and blurred look */
  g.beginFill(0x3a2a1a, 0.08);
  g.moveTo(0, -shh + 6);
  g.lineTo(shw + 6, 6);
  g.lineTo(0, shh + 6);
  g.lineTo(-shw + 6, 6);
  g.closePath();
  g.endFill();

  /* Top face - clean geometric */
  g.beginFill(topColor);
  g.moveTo(0, -shh);
  g.lineTo(shw, 0);
  g.lineTo(0, shh);
  g.lineTo(-shw, 0);
  g.closePath();
  g.endFill();

  /* Top face highlight bevel - top-left edge */
  g.lineStyle(1.2, topHighlight, 0.7);
  g.moveTo(0, -shh);
  g.lineTo(-shw, 0);

  /* Top face shadow bevel - bottom-right edge */
  g.lineStyle(1, darken(woodBase, 0.65), 0.4);
  g.moveTo(shw, 0);
  g.lineTo(0, shh);

  /* Left face with gradient bands */
  g.beginFill(leftColor);
  g.moveTo(-shw, 0);
  g.lineTo(0, shh);
  g.lineTo(0, shh + fd);
  g.lineTo(-shw, fd);
  g.closePath();
  g.endFill();

  /* Left face bottom shadow band */
  g.beginFill(leftDark, 0.35);
  g.moveTo(-shw, fd * 0.65);
  g.lineTo(0, shh + fd * 0.65);
  g.lineTo(0, shh + fd);
  g.lineTo(-shw, fd);
  g.closePath();
  g.endFill();

  /* Left face top highlight strip */
  g.lineStyle(0.8, lighten(woodBase, 0.1), 0.4);
  g.moveTo(-shw, 0);
  g.lineTo(0, shh);

  /* Right face - darker with gradient */
  g.beginFill(rightColor);
  g.moveTo(shw, 0);
  g.lineTo(0, shh);
  g.lineTo(0, shh + fd);
  g.lineTo(shw, fd);
  g.closePath();
  g.endFill();

  /* Right face deep shadow band */
  g.beginFill(rightDark, 0.3);
  g.moveTo(shw, fd * 0.55);
  g.lineTo(0, shh + fd * 0.55);
  g.lineTo(0, shh + fd);
  g.lineTo(shw, fd);
  g.closePath();
  g.endFill();

  /* Geometric edge highlight on right face top */
  g.lineStyle(0.6, lighten(rightColor, 0.08), 0.3);
  g.moveTo(shw, 0);
  g.lineTo(0, shh);

  /* Pixel grid lines on top face - subtle geometric pattern */
  g.lineStyle(0.5, darken(woodBase, 0.6), 0.15);
  for (var i = 1; i < f.w; i++) {
    var lx = -shw + (shw * 2 / f.w) * i;
    g.moveTo(lx, -shh + (shh / f.w) * i);
    g.lineTo(lx, fd - shh + (shh / f.w) * i);
  }
  for (var j = 1; j < f.h; j++) {
    var ly = -shh + (shh * 2 / f.h) * j;
    g.moveTo(-shw + (shw / f.h) * j, ly);
    g.lineTo(shw - (shw / f.h) * j, ly);
  }

  /* Wood grain - minimal geometric lines */
  g.lineStyle(0.6, darken(woodBase, 0.55), 0.18);
  for (var grain = 1; grain <= Math.max(1, f.h); grain++) {
    var gy2 = -shh + (shh * 2 / (Math.max(1, f.h) + 1)) * grain;
    g.moveTo(-shw * 0.7, gy2);
    g.lineTo(shw * 0.5, gy2 + (grain % 2 ? 1.5 : -1.5));
  }

  /* Edge highlight dots - pixel style corners */
  g.lineStyle(0);
  g.beginFill(lighten(woodBase, 0.3), 0.4);
  g.drawRect(-1, -shh - 1, 2, 2);
  g.endFill();

  /* ===== Type-specific details ===== */

  if (f.type === "bed" && fabricHex) {
    /* Fabric cushion - geometric shape */
    g.beginFill(lighten(fabricHex, 0.15));
    g.moveTo(-shw * 0.5, -shh * 0.15);
    g.lineTo(shw * 0.3, -shh * 0.55);
    g.lineTo(shw * 0.6, -shh * 0.18);
    g.lineTo(-shw * 0.15, shh * 0.2);
    g.closePath();
    g.endFill();
    /* Pillow */
    g.beginFill(0xfff8ee, 0.95);
    g.drawRoundedRect(-shw * 0.52, -shh * 0.35, 18, 11, 2);
    g.endFill();
    /* Pillow highlight */
    g.lineStyle(0.6, 0xffffff, 0.3);
    g.moveTo(-shw * 0.48, -shh * 0.3);
    g.lineTo(-shw * 0.35, -shh * 0.28);
  }

  if (f.type === "closet" || f.type === "shelf" || f.type === "desk") {
    /* Panel lines */
    g.lineStyle(0.8, darken(woodBase, 0.55), 0.35);
    g.moveTo(-shw * 0.4, fd * 0.5);
    g.lineTo(shw * 0.15, shh * 0.3 + fd * 0.6);
    /* Drawer handle dots */
    g.lineStyle(0);
    g.beginFill(0xf4dca0, 0.95);
    g.drawRoundedRect(-shw * 0.32, fd * 0.75, 4, 4, 1);
    g.drawRoundedRect(-shw * 0.06, fd * 0.83, 4, 4, 1);
    g.endFill();
    /* Handle highlight */
    g.beginFill(0xffffff, 0.3);
    g.drawRoundedRect(-shw * 0.31, fd * 0.74, 2, 1.5, 0.5);
    g.endFill();
  }

  if (f.type === "sofa") {
    /* Sofa back cushion */
    g.beginFill(darken(woodBase, 0.88));
    g.moveTo(-shw * 0.8, -shh * 0.6);
    g.lineTo(shw * 0.2, -shh * 0.9);
    g.lineTo(shw * 0.8, -shh * 0.5);
    g.lineTo(-shw * 0.2, -shh * 0.2);
    g.closePath();
    g.endFill();
    /* Cushion highlight */
    g.lineStyle(0.6, lighten(woodBase, 0.15), 0.4);
    g.moveTo(-shw * 0.6, -shh * 0.5);
    g.lineTo(shw * 0.1, -shh * 0.78);
  }

  if (f.type === "plant") {
    /* Geometric pixel leaves */
    g.beginFill(0x5a9a68);
    g.drawRect(-8, -16, 6, 6);
    g.drawRect(-2, -18, 6, 6);
    g.drawRect(5, -14, 5, 5);
    g.endFill();
    /* Lighter leaf accents */
    g.beginFill(0x7aba88, 0.8);
    g.drawRect(-6, -14, 3, 3);
    g.drawRect(0, -16, 3, 3);
    g.endFill();
    /* Pot */
    g.beginFill(0x8a6848);
    g.drawRoundedRect(-6, -3, 12, 10, 2);
    g.endFill();
    /* Pot highlight */
    g.lineStyle(0.6, lighten(0x8a6848, 0.2), 0.5);
    g.moveTo(-5, -2);
    g.lineTo(-5, 6);
  }

  if (f.type === "lamp") {
    /* Lamp glow - radial */
    g.beginFill(0xffe8b8, 0.15);
    g.drawCircle(0, -8, 16);
    g.endFill();
    /* Lamp shade - geometric */
    g.beginFill(0xffe4b0, 0.95);
    g.moveTo(-8, -6);
    g.lineTo(0, -16);
    g.lineTo(8, -6);
    g.lineTo(6, -4);
    g.lineTo(0, -12);
    g.lineTo(-6, -4);
    g.closePath();
    g.endFill();
    /* Shade highlight */
    g.lineStyle(0.8, 0xffffff, 0.4);
    g.moveTo(-6, -5);
    g.lineTo(0, -14);
    /* Pole */
    g.lineStyle(2, 0x8a6848, 0.8);
    g.moveTo(0, -4);
    g.lineTo(0, 8);
    /* Base */
    g.lineStyle(0);
    g.beginFill(0x7a5838);
    g.drawRoundedRect(-5, 6, 10, 4, 2);
    g.endFill();
  }

  if (f.type === "rug") {
    /* Rug pattern - geometric border */
    g.lineStyle(1, darken(woodBase, 0.6), 0.3);
    var inset = 0.15;
    g.moveTo(-shw * (1 - inset), -shh * (1 - inset));
    g.lineTo(shw * (1 - inset), -shh * (1 - inset) * 0.1);
    g.moveTo(-shw * (1 - inset), shh * (1 - inset));
    g.lineTo(shw * (1 - inset), shh * (1 - inset) * 0.1);
    /* Center pattern dot */
    g.lineStyle(0);
    g.beginFill(darken(woodBase, 0.5), 0.2);
    g.drawCircle(0, 0, 3);
    g.endFill();
  }

  if (f.type === "book") {
    /* Book stack - geometric blocks */
    g.beginFill(0xa888c0);
    g.drawRect(-5, -8, 10, 4);
    g.endFill();
    g.beginFill(0xc0a8d0);
    g.drawRect(-4, -12, 8, 4);
    g.endFill();
    /* Spine highlight */
    g.lineStyle(0.5, 0xffffff, 0.3);
    g.moveTo(-4, -12);
    g.lineTo(-4, -8);
  }

  if (f.type === "box") {
    /* Box lid line */
    g.lineStyle(0.8, darken(woodBase, 0.5), 0.4);
    g.moveTo(-shw * 0.6, -shh * 0.3);
    g.lineTo(shw * 0.6, shh * 0.1);
    /* Weave pattern */
    g.lineStyle(0.4, darken(woodBase, 0.45), 0.2);
    for (var wi = 0; wi < 3; wi++) {
      var wy = -shh * 0.2 + wi * 3;
      g.moveTo(-shw * 0.5, wy);
      g.lineTo(shw * 0.3, wy + shh * 0.3);
    }
  }

  /* Custom furniture - geometric crystal style */
  if (f.type && f.type.indexOf("custom-") === 0) {
    g.beginFill(lighten(woodBase, 0.3), 0.5);
    g.moveTo(0, -10);
    g.lineTo(6, -4);
    g.lineTo(4, 4);
    g.lineTo(-4, 4);
    g.lineTo(-6, -4);
    g.closePath();
    g.endFill();
    /* Inner glow */
    g.beginFill(lighten(woodBase, 0.5), 0.3);
    g.drawCircle(0, -2, 3);
    g.endFill();
  }

  container.addChild(g);
  container.x = px;
  container.y = py;
  container.zIndex = f.gy * 100 + f.gx + (f.z || 0) * 40 + 1000;
  container.pivot.set(0, 0);

  return container;
}

function drawAxisIndicator(cx, cy) {
  var g = new PIXI.Graphics();
  var ox = 20;
  var oy = state.pixiApp.screen.height - 50;

  /* Background pill */
  g.beginFill(0xfff8ee, 0.85);
  g.lineStyle(1, 0xd8c8b0, 0.5);
  g.drawRoundedRect(ox - 14, oy - 40, 78, 70, 14);
  g.endFill();

  /* X axis */
  g.lineStyle(2.5, 0xd07068);
  g.moveTo(ox, oy);
  g.lineTo(ox + 28, oy);
  g.lineStyle(0);
  g.beginFill(0xd07068);
  g.drawCircle(ox + 28, oy, 3.5);
  g.endFill();

  /* Y axis */
  g.lineStyle(2.5, 0x68a878);
  g.moveTo(ox, oy);
  g.lineTo(ox - 14, oy + 16);
  g.beginFill(0x68a878);
  g.drawCircle(ox - 14, oy + 16, 3.5);
  g.endFill();

  /* Z axis */
  g.lineStyle(2.5, 0x88b8c8);
  g.moveTo(ox, oy);
  g.lineTo(ox, oy - 22);
  g.beginFill(0x88b8c8);
  g.drawCircle(ox, oy - 22, 3.5);
  g.endFill();

  var style = new PIXI.TextStyle({ fontSize: 9, fontWeight: "bold", fill: 0x5a4a3a });
  var lx = new PIXI.Text("X", style); lx.x = ox + 31; lx.y = oy - 5; g.addChild(lx);
  var ly = new PIXI.Text("Y", style); ly.x = ox - 27; ly.y = oy + 10; g.addChild(ly);
  var lz = new PIXI.Text("Z", style); lz.x = ox + 4; lz.y = oy - 32; g.addChild(lz);

  state.isoContainer.addChild(g);
}

function setupPixiInteraction() {
  state.pixiApp.stage.eventMode = "static";
  state.pixiApp.stage.hitArea = state.pixiApp.screen;
  state.pixiApp.stage.on("pointerdown", onPointerDown);
  state.pixiApp.stage.on("pointermove", onPointerMove);
  state.pixiApp.stage.on("pointerup", onPointerUp);
}

function onPointerDown(e) {
  var target = e.target;
  while (target && !target._furnitureData) target = target.parent;
  if (!target || !target._furnitureData) return;

  state.dragging = target;
  state.selectedFurnitureId = target._idx;
  document.getElementById("selected-name").textContent = target._furnitureData.name;
  activateTool("item");

  var pos = state.pixiApp.stage.toLocal(e.global);
  state.dragOffset.x = pos.x - target.x;
  state.dragOffset.y = pos.y - target.y;
  target._origin = {
    gx: target._furnitureData.gx,
    gy: target._furnitureData.gy,
    z: target._furnitureData.z || 0,
    x: target.x,
    y: target.y
  };

  target.zIndex = 9999;
  target.alpha = 0.85;
}

function onPointerMove(e) {
  if (!state.dragging) return;
  var pos = state.pixiApp.stage.toLocal(e.global);
  state.dragging.x = pos.x - state.dragOffset.x;
  state.dragging.y = pos.y - state.dragOffset.y;
}

function onPointerUp(e) {
  if (!state.dragging) return;
  var sprite = state.dragging;
  sprite.alpha = 1;

  var centerX = state.pixiApp.screen.width / 2;
  var centerY = state.pixiApp.screen.height * 0.42;
  var relX = sprite.x - centerX;
  var relY = sprite.y - centerY;

  var gx = Math.round((relX / (TILE * 0.5) + relY / (TILE * 0.25)) / 2);
  var gy = Math.round((relY / (TILE * 0.25) - relX / (TILE * 0.5)) / 2);

  gx = Math.max(0, Math.min(state.roomData.grid_width - sprite._furnitureData.w, gx));
  gy = Math.max(0, Math.min(state.roomData.grid_height - sprite._furnitureData.h, gy));

  var placement = resolvePlacement(sprite._furnitureData, gx, gy, sprite._idx);
  if (!placement.ok) {
    gx = sprite._origin.gx;
    gy = sprite._origin.gy;
    sprite._furnitureData.z = sprite._origin.z;
    showToast(placement.message);
  } else {
    sprite._furnitureData.z = placement.z;
    if (placement.message) showToast(placement.message);
  }

  sprite._furnitureData.gx = gx;
  sprite._furnitureData.gy = gy;
  sprite.x = centerX + isoX(gx, gy);
  sprite.y = centerY + isoY(gx, gy) - ((sprite._furnitureData.z || 0) * 9);
  sprite.zIndex = gy * 100 + gx + (sprite._furnitureData.z || 0) * 40 + 1000;

  state.dragging = null;
  pushHistory();
  updateScores();
  checkChallenges();
}

function rectsOverlap(a, b) {
  return a.gx < b.gx + b.w && a.gx + a.w > b.gx && a.gy < b.gy + b.h && a.gy + a.h > b.gy;
}

function findSupportFor(item, gx, gy, selfIdx) {
  return state.roomData.furniture.find(function(other, idx) {
    if (idx === selfIdx) return false;
    if (!other.surface && !other.container) return false;
    var probe = { gx: gx, gy: gy, w: item.w, h: item.h };
    return rectsOverlap(probe, other);
  });
}

function resolvePlacement(item, gx, gy, selfIdx) {
  var probe = { gx: gx, gy: gy, w: item.w, h: item.h };
  var overlap = state.roomData.furniture.find(function(other, idx) {
    if (idx === selfIdx) return false;
    return rectsOverlap(probe, other);
  });

  if (!overlap) return { ok: true, z: 0 };

  var isSmall = item.size === "small" || item.stackable;
  if (isSmall) {
    var support = findSupportFor(item, gx, gy, selfIdx);
    if (support) {
      return {
        ok: true,
        z: (support.z || 0) + support.d,
        message: item.name + " 已放在 " + support.name + " 上层"
      };
    }
  }

  return { ok: false, z: item.z || 0, message: "大件家具不可重叠；小物件只能放入柜子或架子等承载物" };
}

/* ===== Editor Init ===== */
function initEditor() {
  if (!state.roomData) generateRoomData();
  if (!state.pixiApp) {
    setTimeout(initPixi, 50);
  } else {
    renderIsoRoom();
  }
  updateScores();
  updateLevelDisplay();
  updateUndoRedoButtons();
  var shapeNames = { rectangle: "矩形房间", "l-shape": "L 型房间", irregular: "异形房间", balcony: "带阳台房间" };
  var titleEl = document.getElementById("editor-room-title");
  var subEl = document.getElementById("editor-room-subtitle");
  if (titleEl) titleEl.textContent = shapeNames[state.selectedShape];
  if (subEl) subEl.textContent = (themeColors[state.theme] || themeColors.cozy).name;
}

/* ===== Challenge System ===== */
function checkChallenges() {
  if (!state.roomData) return;
  var completed = [];
  challenges.forEach(function(ch) {
    if (state.challengeProgress[ch.id]) return;
    if (ch.check(state.roomData)) {
      state.challengeProgress[ch.id] = true;
      state.roomXP += ch.reward;
      completed.push(ch);
    }
  });

  if (completed.length > 0) {
    var totalReward = completed.reduce(function(sum, c) { return sum + c.reward; }, 0);
    showToast("任务完成！+" + totalReward + " XP");
    renderChallenges();
    checkLevelUp();
  }
}

function checkLevelUp() {
  var needed = state.roomLevel * 50;
  if (state.roomXP >= needed) {
    state.roomXP -= needed;
    state.roomLevel++;
    showLevelUpAnimation();
  }
  updateLevelDisplay();
}

function showLevelUpAnimation() {
  var overlay = document.getElementById("levelup-overlay");
  if (!overlay) return;
  var numEl = document.getElementById("levelup-level-num");
  if (numEl) numEl.textContent = "Lv." + state.roomLevel;
  showOverlay("levelup-overlay");
}

function updateLevelDisplay() {
  var levelEl = document.getElementById("room-level");
  var xpEl = document.getElementById("room-xp");
  var xpBar = document.getElementById("xp-bar");
  var mineLevel = document.getElementById("mine-level");
  var mineChallenges = document.getElementById("mine-challenges");
  var completedCount = Object.keys(state.challengeProgress).length;
  if (levelEl) levelEl.textContent = "Lv." + state.roomLevel;
  if (mineLevel) mineLevel.textContent = state.roomLevel;
  if (xpEl) xpEl.textContent = state.roomXP + "/" + (state.roomLevel * 50);
  if (xpBar) xpBar.style.width = (state.roomXP / (state.roomLevel * 50) * 100) + "%";
  if (mineChallenges) mineChallenges.textContent = completedCount;
}

function renderChallenges() {
  var list = document.getElementById("challenge-list");
  if (!list) return;
  list.innerHTML = challenges.map(function(ch) {
    var done = state.challengeProgress[ch.id];
    return '<div class="challenge-item ' + (done ? "done" : "") + '">' +
      '<div class="challenge-info"><strong>' + ch.title + '</strong><small>' + ch.desc + '</small></div>' +
      '<span class="challenge-reward">+' + ch.reward + '</span>' +
      '</div>';
  }).join("");
}

function renderChallengesFull() {
  var list = document.getElementById("challenge-list-full");
  var fill = document.getElementById("challenge-progress-fill");
  var text = document.getElementById("challenge-progress-text");
  if (!list) return;
  var completed = Object.keys(state.challengeProgress).length;
  var pct = (completed / challenges.length * 100);
  if (fill) fill.style.width = pct + "%";
  if (text) text.textContent = completed + " / " + challenges.length + " 已完成";
  list.innerHTML = challenges.map(function(ch) {
    var done = state.challengeProgress[ch.id];
    return '<div class="challenge-item ' + (done ? "done" : "") + '">' +
      '<div class="challenge-info"><strong>' + ch.title + '</strong><small>' + ch.desc + '</small></div>' +
      '<span class="challenge-reward">+' + ch.reward + ' XP</span>' +
      '</div>';
  }).join("");
}

/* ===== Tool Tabs ===== */
function activateTool(name) {
  document.querySelectorAll(".tool-tab").forEach(function(t) {
    t.classList.toggle("active", t.dataset.tool === name);
  });
  document.querySelectorAll(".drawer").forEach(function(d) { d.classList.remove("active"); });
  var drawer = document.getElementById(name + "-drawer");
  if (drawer) drawer.classList.add("active");
}

/* ===== Furniture Management ===== */
function renderFurnitureCatalog() {
  furnitureList.innerHTML = furnitureCatalog.map(function(item) {
    return '<button class="furniture-btn" data-add="' + item.type + '">' +
      '<span class="furniture-swatch" style="background:' + item.colorName + '"></span>' +
      item.name + '</button>';
  }).join("");
}

function addFurniture(type) {
  var cat = furnitureCatalog.find(function(c) { return c.type === type; });
  if (!cat || !state.roomData) return showToast("请先生成房间");
  state.itemSeq++;
  var newItem = {
    type: cat.type, name: cat.name,
    gx: 1 + (state.itemSeq * 2) % (state.roomData.grid_width - 2),
    gy: 1 + (state.itemSeq) % (state.roomData.grid_height - 2),
    z: 0,
    w: cat.w, h: cat.h, d: cat.d,
    color: cat.colorName, rotation: 0,
    size: cat.size, stackable: cat.stackable, surface: cat.surface, container: cat.container
  };
  state.roomData.furniture.push(newItem);
  var sprite = createFurnitureSprite(newItem, state.roomData.furniture.length - 1);
  state.furnitureSprites.push(sprite);
  state.isoContainer.addChild(sprite);
  state.selectedFurnitureId = state.roomData.furniture.length - 1;
  document.getElementById("selected-name").textContent = newItem.name;
  activateTool("item");
  pushHistory();
  updateScores();
  checkChallenges();
  showToast(cat.name + " 已加入房间");
}

function rotateItem() {
  if (state.selectedFurnitureId == null || !state.roomData) return showToast("请先选择一个家具");
  var f = state.roomData.furniture[state.selectedFurnitureId];
  if (!f) return;
  var temp = f.w; f.w = f.h; f.h = temp;
  f.rotation = (f.rotation + 90) % 360;
  var oldSprite = state.furnitureSprites[state.selectedFurnitureId];
  if (oldSprite) state.isoContainer.removeChild(oldSprite);
  var newSprite = createFurnitureSprite(f, state.selectedFurnitureId);
  state.furnitureSprites[state.selectedFurnitureId] = newSprite;
  state.isoContainer.addChild(newSprite);
  pushHistory();
  showToast(f.name + " 已旋转");
}

function colorItem() {
  if (state.selectedFurnitureId == null || !state.roomData) return showToast("请先选择一个家具");
  var f = state.roomData.furniture[state.selectedFurnitureId];
  if (!f) return;
  var palette = ["#b88758", "#9f7048", "#c8b89f", "#8fae7f", "#a9c7cf", "#b9a7c8"];
  var ci = palette.indexOf(f.color);
  f.color = palette[(ci + 1) % palette.length];
  var oldSprite = state.furnitureSprites[state.selectedFurnitureId];
  if (oldSprite) state.isoContainer.removeChild(oldSprite);
  var newSprite = createFurnitureSprite(f, state.selectedFurnitureId);
  state.furnitureSprites[state.selectedFurnitureId] = newSprite;
  state.isoContainer.addChild(newSprite);
  pushHistory();
  showToast(f.name + " 已换色");
}

function deleteItem() {
  if (state.selectedFurnitureId == null || !state.roomData) return showToast("请先选择一个家具");
  var f = state.roomData.furniture[state.selectedFurnitureId];
  var sprite = state.furnitureSprites[state.selectedFurnitureId];
  if (sprite) state.isoContainer.removeChild(sprite);
  state.roomData.furniture.splice(state.selectedFurnitureId, 1);
  state.furnitureSprites.splice(state.selectedFurnitureId, 1);
  state.selectedFurnitureId = null;
  document.getElementById("selected-name").textContent = "未选择";
  pushHistory();
  updateScores();
  showToast((f ? f.name : "家具") + " 已移除");
}

function randomLayout() {
  if (!state.roomData) return;
  var positions = [[1,1],[4,1],[1,3],[4,3],[2,5],[6,2],[1,5],[5,5]];
  state.roomData.furniture.forEach(function(f, i) {
    var p = positions[i % positions.length];
    f.gx = p[0]; f.gy = p[1]; f.z = 0;
  });
  pushHistory();
  renderIsoRoom();
  updateScores();
  checkChallenges();
  showToast("AI 已生成一版更整洁的摆放方案");
}

/* ===== Custom Furniture ===== */
function addCustomFurniture() {
  var customColors = ["#e07878", "#78a8e0", "#a878e0", "#e0c878", "#78e0b8", "#e0a878"];
  var customNames = ["自定义方块 A", "自定义方块 B", "自定义方块 C", "自定义装饰 D", "自定义模块 E", "自定义配件 F"];
  var idx = state.itemSeq % customNames.length;
  var cat = {
    type: "custom-" + state.itemSeq,
    name: customNames[idx],
    w: 1, h: 1, d: 1,
    colorName: customColors[idx],
    size: "small",
    stackable: true
  };
  if (!state.roomData) { generateRoomData(); }
  state.itemSeq++;
  var newItem = {
    type: cat.type, name: cat.name,
    gx: 1 + (state.itemSeq * 2) % (state.roomData.grid_width - 2),
    gy: 1 + (state.itemSeq) % (state.roomData.grid_height - 2),
    z: 0,
    w: cat.w, h: cat.h, d: cat.d,
    color: cat.colorName, rotation: 0,
    size: cat.size, stackable: cat.stackable
  };
  state.roomData.furniture.push(newItem);
  var sprite = createFurnitureSprite(newItem, state.roomData.furniture.length - 1);
  state.furnitureSprites.push(sprite);
  state.isoContainer.addChild(sprite);
  state.selectedFurnitureId = state.roomData.furniture.length - 1;
  document.getElementById("selected-name").textContent = newItem.name;
  activateTool("item");
  pushHistory();
  updateScores();
  checkChallenges();
  showToast(cat.name + " 已加入房间");
}

/* ===== Scores ===== */
function updateScores() {
  if (!state.roomData) return;
  var count = state.roomData.furniture.length;
  var storage = state.roomData.furniture.filter(function(f) { return f.type === "closet" || f.type === "box"; }).length;
  var plants = state.roomData.furniture.filter(function(f) { return f.type === "plant"; }).length;
  var clean = Math.min(99, 62 + storage * 12 - Math.max(0, count - 7) * 3);
  var cozy = Math.min(99, 58 + plants * 8 + count * 2);
  var flow = Math.max(45, 88 - Math.max(0, count - 4) * 5);
  document.getElementById("clean-score").textContent = clean;
  document.getElementById("cozy-score").textContent = cozy;
  document.getElementById("flow-score").textContent = flow;
  // Also update detail scores if visible
  var detailScores = document.getElementById("detail-scores");
  if (detailScores) {
    detailScores.innerHTML = '<div><strong>' + clean + '</strong><span>整洁度</span></div>' +
      '<div><strong>' + cozy + '</strong><span>舒适度</span></div>' +
      '<div><strong>' + flow + '</strong><span>通行度</span></div>';
  }
}

/* ===== Theme ===== */
function changeTheme(theme) {
  state.theme = theme;
  document.querySelectorAll(".theme-card, .theme-chip").forEach(function(c) {
    c.classList.toggle("active", c.dataset.theme === theme);
  });
  if (state.pixiApp) {
    state.pixiApp.renderer.background.color = (themeColors[theme] || themeColors.cozy).bg;
    renderIsoRoom();
  }
  var subEl = document.getElementById("editor-room-subtitle");
  if (subEl) subEl.textContent = (themeColors[theme] || themeColors.cozy).name;
}

/* ===== JSON View ===== */
function viewJSON() {
  if (!state.roomData) return showToast("请先生成房间");
  document.getElementById("json-output").textContent = JSON.stringify(state.roomData, null, 2);
  navigateTo("json");
}

function copyJSON() {
  if (!state.roomData) return;
  var text = JSON.stringify(state.roomData, null, 2);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() { showToast("JSON 已复制"); });
  } else {
    showToast("当前环境不支持复制");
  }
}

/* ===== Save & Share ===== */
function saveRoom() {
  state.savedCount++;
  var savedCount = document.getElementById("saved-count");
  if (savedCount) savedCount.textContent = state.savedCount;
  checkChallenges();
  showToast("成果已保存");
}

function autoCreateArchive(source) {
  var shapeNames = { rectangle: "矩形房间", "l-shape": "L 型房间", irregular: "异形房间", balcony: "带阳台房间" };
  var themeNames = { cozy: "温馨阁楼", vintage: "复古书房", cyber: "赛博宿舍", minimal: "极简租房" };
  var now = new Date();
  var timeStr = "今天 " + now.getHours() + ":" + (now.getMinutes() < 10 ? "0" : "") + now.getMinutes();
  var nameBase = source === "scan" ? "AI 扫描房间" : themeNames[state.theme] || "我的房间";
  var archiveName = nameBase + " " + (state.archives.length + 1);

  var newArchive = {
    id: "arch-" + Date.now(),
    name: archiveName,
    shape: state.selectedShape,
    theme: state.theme,
    shapeName: shapeNames[state.selectedShape] || state.selectedShape,
    time: timeStr,
    furnitureCount: state.roomData ? state.roomData.furniture.length : 0
  };

  state.archives.unshift(newArchive);
  state.savedCount++;
  updateArchiveCount();
  renderArchives();
  updateHomeRecentRooms();
}

function deleteArchive(archiveId) {
  state.archives = state.archives.filter(function(a) { return a.id !== archiveId; });
  if (state.savedCount > 0) state.savedCount--;
  updateArchiveCount();
  renderArchives();
  updateHomeRecentRooms();
  showToast("存档已删除");
}

function updateArchiveCount() {
  var el = document.getElementById("mine-room-count");
  if (el) el.textContent = state.archives.length;
  var savedEl = document.getElementById("mine-saved");
  if (savedEl) savedEl.textContent = state.archives.length;
}

function renderArchives() {
  var container = document.getElementById("mine-room-list");
  if (!container) return;

  if (state.archives.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:24px 0;color:var(--muted);font-size:13px;">暂无存档，去创造一个房间吧</div>';
    return;
  }

  container.innerHTML = state.archives.map(function(arch) {
    return '<div class="archive-row-wrap">' +
      '<button class="archive-row" data-action="open-editor" data-room="' + arch.id + '">' +
        '<div class="archive-row-thumb">' + miniIsoThumb(arch.shape, arch.theme) + '</div>' +
        '<div class="archive-row-info">' +
          '<strong>' + arch.name + '</strong>' +
          '<span>' + arch.shapeName + ' · ' + arch.time + '</span>' +
        '</div>' +
        '<span class="option-arrow">&rsaquo;</span>' +
      '</button>' +
      '<button class="archive-delete-btn" data-action="delete-archive" data-archive-id="' + arch.id + '" aria-label="删除">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>' +
      '</button>' +
    '</div>';
  }).join("");
}

function miniIsoThumb(shape, theme) {
  var tc = { cozy:["#d8c4a4","#dcc8a8","#f5ead6"], vintage:["#b8a078","#c0a878","#e0d4c0"], cyber:["#a8a0a0","#b0a8a0","#d0c8c8"], minimal:["#c0b8b0","#c8c0b8","#e0dcd4"] };
  var c = tc[theme] || tc.cozy;
  var floor = c[0], floor2 = c[1], wall = c[2];
  if (shape === "l-shape") {
    return '<svg viewBox="0 0 80 56" style="width:100%;height:100%"><polygon points="40,4 76,22 40,40 4,22" fill="'+floor+'" stroke="#9a8260" stroke-width="0.5"/><polygon points="20,14 56,32 40,40 4,22" fill="'+floor2+'" stroke="#9a8260" stroke-width="0.3"/><polygon points="56,32 76,22 76,30 56,40" fill="'+wall+'" stroke="#8a7050" stroke-width="0.5" opacity="0.8"/></svg>';
  }
  if (shape === "balcony") {
    return '<svg viewBox="0 0 80 56" style="width:100%;height:100%"><polygon points="40,4 76,22 40,40 4,22" fill="'+floor+'" stroke="#9a8260" stroke-width="0.5"/><polygon points="40,4 56,12 40,20 24,12" fill="'+floor2+'" stroke="#9a8260" stroke-width="0.3"/><rect x="60" y="24" width="16" height="12" rx="1" fill="'+wall+'" opacity="0.5"/></svg>';
  }
  if (shape === "irregular") {
    return '<svg viewBox="0 0 80 56" style="width:100%;height:100%"><polygon points="40,6 74,22 40,38 6,22" fill="'+floor+'" stroke="#9a8260" stroke-width="0.5"/><polygon points="30,12 50,22 40,28 20,18" fill="'+floor2+'" stroke="#9a8260" stroke-width="0.3"/></svg>';
  }
  return '<svg viewBox="0 0 80 56" style="width:100%;height:100%"><polygon points="40,4 76,22 40,40 4,22" fill="'+floor+'" stroke="#9a8260" stroke-width="0.5"/><polygon points="40,4 56,12 40,20 24,12" fill="'+floor2+'" stroke="#9a8260" stroke-width="0.3"/><rect x="4" y="22" width="8" height="14" rx="1" fill="'+wall+'" opacity="0.6"/><rect x="64" y="22" width="8" height="14" rx="1" fill="'+wall+'" opacity="0.6"/></svg>';
}

function updateHomeRecentRooms() {
  var container = document.getElementById("recent-rooms");
  if (!container) return;
  var recent = state.archives.slice(0, 5);
  if (recent.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px;">暂无最近编辑的房间</div>';
    return;
  }
  container.innerHTML = recent.map(function(arch) {
    return '<article class="room-thumb-card" data-action="open-editor" data-room="' + arch.id + '">' +
      '<div class="room-thumb-visual">' + miniIsoThumb(arch.shape, arch.theme) + '</div>' +
      '<div class="room-thumb-info">' +
        '<strong>' + arch.name + '</strong>' +
        '<span>' + arch.shapeName + ' · ' + arch.furnitureCount + '件</span>' +
      '</div>' +
    '</article>';
  }).join("");
}

function shareRoom() {
  if (!state.roomData) return;
  hideOverlay("share-card-overlay");

  var archives = state.archives || [];
  var furnitures = state.furnitureCollection || [];

  /* Build archive checkboxes */
  var archiveHtml = archives.length === 0 ?
    '<p style="color:var(--muted);font-size:12px;text-align:center;padding:8px;">暂无存档</p>' :
    archives.map(function(a, i) {
      return '<label class="share-checkbox-row">' +
        '<input type="checkbox" class="share-arch-cb" data-idx="' + i + '" />' +
        '<div class="share-checkbox-thumb">' + miniIsoThumb(a.shape, a.theme) + '</div>' +
        '<div class="share-checkbox-info"><strong>' + a.name + '</strong><span>' + a.shapeName + '</span></div>' +
      '</label>';
    }).join("");

  /* Build furniture checkboxes */
  var furnitureHtml = furnitures.length === 0 ?
    '<p style="color:var(--muted);font-size:12px;text-align:center;padding:8px;">暂无家具收藏</p>' :
    furnitures.map(function(f, i) {
      return '<label class="share-checkbox-row">' +
        '<input type="checkbox" class="share-furn-cb" data-idx="' + i + '" />' +
        '<div class="share-checkbox-swatch" style="background:' + f.color + '"></div>' +
        '<div class="share-checkbox-info"><strong>' + f.name + '</strong><span>' + (f.isSystem ? "系统" : "自定") + '</span></div>' +
      '</label>';
    }).join("");

  var overlay = document.createElement("div");
  overlay.className = "share-modal-overlay";
  overlay.id = "share-modal-overlay";
  overlay.innerHTML =
    '<div class="share-modal">' +
      '<h3>分享到社区</h3>' +
      '<div class="share-type-row">' +
        '<button class="share-type-btn active" data-share-type="room">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>' +
          '分享存档' +
        '</button>' +
        '<button class="share-type-btn" data-share-type="furniture">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20H7L3 16l10-10 8 8-6 6z"/><path d="M6 11l8 8"/></svg>' +
          '分享家具' +
        '</button>' +
      '</div>' +
      '<div class="share-select-area" id="share-arch-area">' +
        '<div style="font-size:11px;color:var(--muted);font-weight:700;margin-bottom:6px;">选择要分享的存档（可多选）</div>' +
        '<div class="share-checkbox-list">' + archiveHtml + '</div>' +
      '</div>' +
      '<div class="share-select-area" id="share-furn-area" style="display:none">' +
        '<div style="font-size:11px;color:var(--muted);font-weight:700;margin-bottom:6px;">选择要分享的家具（可多选）</div>' +
        '<div class="share-checkbox-list">' + furnitureHtml + '</div>' +
      '</div>' +
      '<textarea id="share-message-input" placeholder="说点什么...（选填）" style="margin-top:10px"></textarea>' +
      '<div class="share-modal-actions">' +
        '<button class="ghost-btn" style="flex:1" id="share-cancel-btn">取消</button>' +
        '<button class="primary-btn" style="flex:1" id="share-confirm-btn">发布</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  var selectedType = "room";

  /* Type toggle */
  overlay.querySelectorAll("[data-share-type]").forEach(function(btn) {
    btn.addEventListener("click", function() {
      selectedType = btn.dataset.shareType;
      overlay.querySelectorAll("[data-share-type]").forEach(function(b) { b.classList.toggle("active", b === btn); });
      document.getElementById("share-arch-area").style.display = selectedType === "room" ? "block" : "none";
      document.getElementById("share-furn-area").style.display = selectedType === "furniture" ? "block" : "none";
    });
  });

  /* Cancel */
  document.getElementById("share-cancel-btn").addEventListener("click", function() {
    document.getElementById("share-modal-overlay").remove();
  });

  /* Confirm */
  document.getElementById("share-confirm-btn").addEventListener("click", function() {
    var msg = document.getElementById("share-message-input").value.trim();
    var shapeNames = { rectangle: "矩形房间", "l-shape": "L 型房间", irregular: "异形房间", balcony: "带阳台房间" };

    if (selectedType === "room") {
      var checkedArchs = [];
      overlay.querySelectorAll(".share-arch-cb:checked").forEach(function(cb) {
        checkedArchs.push(archives[parseInt(cb.dataset.idx)]);
      });
      if (checkedArchs.length === 0) { showToast("请至少选择一个存档"); return; }
      var title = checkedArchs.length === 1 ? checkedArchs[0].name : "我的 " + checkedArchs.length + " 个房间存档";
      var furnitureList = [];
      checkedArchs.forEach(function(a) {
        furnitureCatalog.forEach(function(f) {
          if (!furnitureList.find(function(fl) { return fl.name === (f.name || f.type); })) {
            furnitureList.push({ name: f.name || f.type, color: "#" + ((f.color || 0xb88758) & 0xFFFFFF).toString(16).padStart(6, "0") });
          }
        });
      });
      furnitureList = furnitureList.slice(0, 8);
      communitySeed.unshift({
        user: "我", title: title,
        text: msg || "分享了 " + checkedArchs.length + " 个房间存档，共 " + furnitureList.length + " 件家具。",
        likes: 1, tags: ["我的作品", "房间分享"],
        theme: checkedArchs[0].theme || "cozy", type: "latest", comments: [],
        visibility: "full", furnitureList: furnitureList,
        liked: false, likedCount: 1, myComments: []
      });
    } else {
      var checkedFurns = [];
      overlay.querySelectorAll(".share-furn-cb:checked").forEach(function(cb) {
        checkedFurns.push(furnitures[parseInt(cb.dataset.idx)]);
      });
      if (checkedFurns.length === 0) { showToast("请至少选择一个家具"); return; }
      var title2 = checkedFurns.length === 1 ? checkedFurns[0].name : "我的 " + checkedFurns.length + " 件家具收藏";
      var flist = checkedFurns.map(function(f) { return { name: f.name, color: f.color }; });
      communitySeed.unshift({
        user: "我", title: title2,
        text: msg || "分享了 " + checkedFurns.length + " 件家具收藏。",
        likes: 1, tags: ["家具收藏", "分享"],
        theme: "cozy", type: "latest", comments: [],
        visibility: "full", furnitureList: flist,
        liked: false, likedCount: 1, myComments: []
      });
    }
    state.myPosts.unshift(communitySeed[0]);
    renderMyPostsList();
    renderFeed();
    renderHomeWaterfall();
    document.getElementById("share-modal-overlay").remove();
    showToast("已发布到社区");
  });

  /* Click backdrop to close */
  overlay.addEventListener("click", function(e) {
    if (e.target === overlay) overlay.remove();
  });
}

/* ===== Share Card ===== */
function generateShareCard() {
  if (!state.roomData) return showToast("请先生成房间");
  var shapeNames = { rectangle: "矩形房间", "l-shape": "L 型房间", irregular: "异形房间", balcony: "带阳台房间" };
  var tc = themeColors[state.theme] || themeColors.cozy;
  document.getElementById("share-card-title").textContent = shapeNames[state.selectedShape] + " · " + tc.name;
  document.getElementById("share-card-furniture").textContent = state.roomData.furniture.length + " 件家具";
  document.getElementById("share-card-clean").textContent = document.getElementById("clean-score").textContent;
  document.getElementById("share-card-cozy").textContent = document.getElementById("cozy-score").textContent;
  document.getElementById("share-card-flow").textContent = document.getElementById("flow-score").textContent;
  showOverlay("share-card-overlay");
}

/* ===== Room Detail ===== */
var currentDetailRoom = null;
function renderRoomDetail() {
  if (!currentDetailRoom) currentDetailRoom = "cozy-bedroom";
  var nameMap = { "cozy-bedroom": "温馨阁楼 01", "vintage-studio": "复古书房", "cyber-dorm": "赛博宿舍" };
  var shapeMap = { "cozy-bedroom": "rectangle", "vintage-studio": "balcony", "cyber-dorm": "l-shape" };
  document.getElementById("detail-room-name").textContent = nameMap[currentDetailRoom] || "房间详情";
  updateScores();
}

/* ===== Archives Full List Page ===== */
function renderArchivesFullList() {
  var list = document.getElementById("archives-full-list");
  var countEl = document.getElementById("arch-total-count");
  var furnEl = document.getElementById("arch-total-furniture");
  if (!list) return;

  if (countEl) countEl.textContent = state.archives.length;
  var totalFurn = 0;
  state.archives.forEach(function(a) { totalFurn += (a.furnitureCount || 0); });
  if (furnEl) furnEl.textContent = totalFurn;

  if (state.archives.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--muted);font-size:13px;">暂无存档，去创造一个房间吧</div>';
    return;
  }

  list.innerHTML = state.archives.map(function(arch) {
    var themeNames = { cozy: "温馨阁楼", vintage: "复古书房", cyber: "赛博宿舍", minimal: "极简空间" };
    var themeName = themeNames[arch.theme] || "默认主题";
    return '<div class="archive-card">' +
      '<div class="archive-card-thumb">' + miniIsoThumb(arch.shape, arch.theme) + '</div>' +
      '<div class="archive-card-body">' +
        '<h3>' + arch.name + '</h3>' +
        '<div class="archive-card-meta">' +
          '<span class="archive-card-tag">' + arch.shapeName + '</span>' +
          '<span class="archive-card-tag">' + arch.furnitureCount + ' 件家具</span>' +
          '<span class="archive-card-tag">' + themeName + '</span>' +
          '<span class="archive-card-tag">' + arch.time + '</span>' +
        '</div>' +
        '<div class="archive-card-actions">' +
          '<button class="archive-card-btn primary" data-action="open-editor" data-room="' + arch.id + '">编辑</button>' +
          '<button class="archive-card-btn" data-action="view-archive-detail" data-room="' + arch.id + '">详情</button>' +
          '<button class="archive-card-btn" data-action="share-single-archive" data-room="' + arch.id + '">分享</button>' +
          '<button class="archive-card-btn" data-action="duplicate-archive" data-room="' + arch.id + '">复制</button>' +
          '<button class="archive-card-btn danger" data-action="delete-archive" data-archive-id="' + arch.id + '">删除</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join("");
}

/* ===== Enhanced Room Detail ===== */
function renderRoomDetail() {
  if (!currentDetailRoom) currentDetailRoom = state.archives.length > 0 ? state.archives[0].id : "cozy-bedroom";
  var arch = state.archives.find(function(a) { return a.id === currentDetailRoom; });

  if (arch) {
    document.getElementById("detail-room-name").textContent = arch.name;
    var metaEl = document.getElementById("detail-meta");
    if (metaEl) {
      var themeNames = { cozy: "温馨阁楼", vintage: "复古书房", cyber: "赛博宿舍", minimal: "极简空间" };
      metaEl.innerHTML =
        '<span>' + arch.shapeName + '</span>' +
        '<span>' + arch.furnitureCount + ' 件家具</span>' +
        '<span>' + (themeNames[arch.theme] || "默认主题") + '</span>' +
        '<span>' + arch.time + '</span>';
    }

    /* Render furniture list */
    var furnList = document.getElementById("detail-furniture-list");
    var furnCount = document.getElementById("detail-furn-count");
    if (furnList) {
      var sampleFurn = [
        { name: "木质软床", color: "#b88758" },
        { name: "暖木书桌", color: "#aa7848" },
        { name: "奶油沙发", color: "#c8b89f" },
        { name: "治愈绿植", color: "#8fae7f" },
        { name: "暖光台灯", color: "#e8c77f" },
        { name: "编织地毯", color: "#c8a994" }
      ].slice(0, arch.furnitureCount || 3);
      if (furnCount) furnCount.textContent = sampleFurn.length;
      furnList.innerHTML = sampleFurn.map(function(f) {
        return '<div class="detail-furn-item">' +
          '<span class="detail-furn-swatch" style="background:' + f.color + '"></span>' +
          f.name + '</div>';
      }).join("");
    }
  } else {
    document.getElementById("detail-room-name").textContent = "房间详情";
  }
  updateScores();
}

/* ===== Post Detail ===== */
var currentPostIdx = 0;
function renderPostDetail() {
  var post = communitySeed[currentPostIdx];
  if (!post) return;
  var el = document.getElementById("post-detail-content");
  if (!el) return;

  /* Like button */
  var heartIcon = post.liked ? "&#10084;" : "&#9825;";
  var likeClass = post.liked ? "like-btn liked" : "like-btn";
  var likeCount = post.liked ? (post.likedCount + 1) : post.likedCount;

  /* Privacy badge */
  var badgeText = post.visibility === "full" ? "完全公开" : post.visibility === "furniture" ? "仅家具" : "仅图片";

  /* Room thumbnail using miniIsoThumb */
  var roomShape = "rectangle";
  var thumbSvg = miniIsoThumb(roomShape, post.theme);

  /* Content based on visibility */
  var contentHtml = "";
  if (post.visibility === "full") {
    contentHtml =
      '<div class="post-room-thumb" data-action="view-post-room" data-post-idx="' + currentPostIdx + '" style="cursor:pointer;margin-bottom:12px;border-radius:16px;overflow:hidden;box-shadow:0 2px 10px var(--shadow);">' +
        thumbSvg +
        '<div class="post-room-overlay"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> 点击查看房间</div>' +
      '</div>' +
      '<div class="post-furniture-list">' +
        (post.furnitureList || []).map(function(f) {
          return '<div class="post-furniture-item"><span class="post-furniture-swatch" style="background:' + f.color + '"></span>' + f.name + '</div>';
        }).join("") + '</div>';
  } else if (post.visibility === "furniture") {
    contentHtml =
      '<div class="post-room-thumb locked" style="margin-bottom:12px;border-radius:16px;overflow:hidden;position:relative;box-shadow:0 2px 10px var(--shadow);">' +
        thumbSvg +
        '<div class="post-room-lock-overlay"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>仅公开家具，房间布局不可查看</span></div>' +
      '</div>' +
      '<div class="post-furniture-list">' +
        (post.furnitureList || []).map(function(f) {
          return '<div class="post-furniture-item"><span class="post-furniture-swatch" style="background:' + f.color + '"></span>' + f.name + '</div>';
        }).join("") + '</div>';
  } else {
    contentHtml =
      '<div class="post-room-thumb" style="margin-bottom:12px;border-radius:16px;overflow:hidden;box-shadow:0 2px 10px var(--shadow);">' +
        thumbSvg +
      '</div>' +
      '<p style="color:var(--muted);font-size:12px;margin-bottom:12px;text-align:center;">该用户未公开房间数据</p>';
  }

  /* Tags */
  var tagsHtml = '<div class="tag-row" style="margin-bottom:12px;">' +
    post.tags.map(function(t) { return '<span style="cursor:pointer" data-action="tag-search" data-tag="' + t + '">#' + t + '</span>'; }).join("") + '</div>';

  /* Comments with reply/like/report */
  var allComments = [];
  (post.comments || []).forEach(function(cmt) {
    allComments.push({ user: post.user, text: cmt, likes: 0, replies: [], myLike: false });
  });
  (post.myComments || []).forEach(function(cmt) {
    allComments.push({ user: "我", text: cmt, likes: 0, replies: [], myLike: false });
  });

  var commentsHtml = '<div style="margin-top:16px;">';
  if (allComments.length > 0) {
    commentsHtml += '<div style="margin-bottom:8px;font-size:14px;font-weight:700;">评论 (' + allComments.length + ')</div>';
    allComments.forEach(function(cmt, ci) {
      var heartC = cmt.myLike ? "&#10084;" : "&#9825;";
      commentsHtml +=
        '<div class="comment-item" id="cmt-' + ci + '">' +
          '<div class="comment-avatar">' + cmt.user[0] + '</div>' +
          '<div class="comment-body">' +
            '<strong>' + cmt.user + '</strong>' +
            '<p>' + cmt.text + '</p>' +
            '<div class="comment-actions">' +
              '<button class="comment-action-btn" data-action="like-comment" data-cmt-idx="' + ci + '">' + heartC + ' ' + (cmt.likes + (cmt.myLike ? 1 : 0)) + '</button>' +
              '<button class="comment-action-btn" data-action="reply-comment" data-cmt-idx="' + ci + '">回复</button>' +
              '<button class="comment-action-btn" data-action="report-comment" data-cmt-idx="' + ci + '">举报</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    });
  }
  commentsHtml +=
    '<div class="comment-input-row">' +
      '<input type="text" id="comment-input" placeholder="写点什么..." />' +
      '<button class="comment-send-btn" data-action="post-comment">发送</button>' +
    '</div></div>';

  el.innerHTML =
    '<div class="feed-head" style="margin-bottom:12px;">' +
      '<div class="feed-user"><span class="avatar">' + post.user[0] + '</span>' + post.user + '</div>' +
      '<button class="' + likeClass + '" data-action="like-post">' + heartIcon + ' ' + likeCount + '</button></div>' +
    '<span class="post-privacy-badge">' + badgeText + '</span>' +
    contentHtml +
    '<h3 style="font-size:17px;margin-bottom:8px;">' + post.title + '</h3>' +
    '<p style="color:var(--muted);line-height:1.6;margin-bottom:12px;">' + post.text + '</p>' +
    tagsHtml +
    commentsHtml;
}

/* ===== Community ===== */
function renderFeed() {
  var keyword = state.communitySearch.trim();
  var filtered = communitySeed.filter(function(post) {
    var matchesFilter = state.communityFilter === "hot" ? post.type === "hot" :
      state.communityFilter === "latest" ? post.type === "latest" :
      post.type === "events";
    var text = (post.title + post.text + post.tags.join("")).toLowerCase();
    var matchesSearch = !keyword || text.indexOf(keyword.toLowerCase()) >= 0;
    return matchesFilter && matchesSearch;
  });
  feed.innerHTML = filtered.map(function(post, i) {
    var palettes = [["#f5a3c7","#ffd166","#8be6b4"],["#f79d65","#fff08a","#7fc8ff"],["#9284ff","#8be6b4","#ffd166"]];
    var c = palettes[i % palettes.length];
    return '<article class="feed-card" data-post-idx="' + i + '"><div class="feed-head">' +
      '<div class="feed-user"><span class="avatar">' + post.user[0] + '</span>' + post.user + '</div>' +
      '<span class="likes">&#9825; ' + post.likes + '</span></div>' +
      '<div class="mini-room ' + post.theme + '">' +
      '<span style="left:22px;top:22px;width:62px;height:42px;background:' + c[0] + '"></span>' +
      '<span style="right:28px;top:34px;width:48px;height:54px;background:' + c[1] + '"></span>' +
      '<span style="left:96px;bottom:24px;width:86px;height:42px;background:' + c[2] + '"></span></div>' +
      '<p><strong>' + post.title + '</strong></p>' +
      '<div class="tag-row">' + post.tags.slice(0, 2).map(function(t) { return '<span>#' + t + '</span>'; }).join("") + '</div>' +
      '</article>';
  }).join("");
}

function renderHomeWaterfall() {
  var el = document.getElementById("home-waterfall");
  if (!el) return;
  el.innerHTML = communitySeed.map(function(post, i) {
    return '<article class="masonry-card ' + (i % 2 ? "tall" : "") + '" data-post-idx="' + i + '">' +
      '<div class="masonry-thumb"></div>' +
      '<h3>' + post.title + '</h3>' +
      '<p>' + post.text + '</p>' +
      '<div class="tag-row">' + post.tags.slice(0, 2).map(function(t) { return '<span>#' + t + '</span>'; }).join("") + '</div>' +
      '</article>';
  }).join("");
}

/* ===== Tag Search Feed ===== */
function renderTagSearchFeed(tag) {
  var el = document.getElementById("tag-search-feed");
  if (!el) return;
  var filtered = communitySeed.filter(function(post) {
    return post.tags.indexOf(tag) >= 0;
  });
  if (filtered.length === 0) {
    el.innerHTML = '<p style="text-align:center;color:var(--muted);padding:40px 0;">没有找到相关帖子</p>';
    return;
  }
  el.innerHTML = filtered.map(function(post, i) {
    var realIdx = communitySeed.indexOf(post);
    var palettes = [["#f5a3c7","#ffd166","#8be6b4"],["#f79d65","#fff08a","#7fc8ff"],["#9284ff","#8be6b4","#ffd166"]];
    var c = palettes[realIdx % palettes.length];
    return '<article class="feed-card" data-post-idx="' + realIdx + '"><div class="feed-head">' +
      '<div class="feed-user"><span class="avatar">' + post.user[0] + '</span>' + post.user + '</div>' +
      '<span class="likes">&#9825; ' + post.likes + '</span></div>' +
      '<div class="mini-room ' + post.theme + '">' +
      '<span style="left:22px;top:22px;width:62px;height:42px;background:' + c[0] + '"></span>' +
      '<span style="right:28px;top:34px;width:48px;height:54px;background:' + c[1] + '"></span>' +
      '<span style="left:96px;bottom:24px;width:86px;height:42px;background:' + c[2] + '"></span></div>' +
      '<p><strong>' + post.title + '</strong></p>' +
      '<div class="tag-row">' + post.tags.slice(0, 2).map(function(t) { return '<span>#' + t + '</span>'; }).join("") + '</div>' +
      '</article>';
  }).join("");
}

/* ===== Global Events ===== */
document.addEventListener("click", function(e) {
  var nav = e.target.closest("[data-nav]");
  var action = e.target.closest("[data-action]");
  var add = e.target.closest("[data-add]");
  var tool = e.target.closest("[data-tool]");
  var theme = e.target.closest("[data-theme]");
  var shape = e.target.closest("[data-shape]");
  var communityFilter = e.target.closest("[data-community-filter]");
  var importMode = e.target.closest("[data-import-mode]");
  var drawColor = e.target.closest("[data-draw-color]");
  var drawTool = e.target.closest("[data-draw-tool]");
  var room = e.target.closest("[data-room]");
  var postIdx = e.target.closest("[data-post-idx]");

  if (nav) navigateTo(nav.dataset.nav);
  if (add) addFurniture(add.dataset.add);
  if (tool) activateTool(tool.dataset.tool);
  if (theme) changeTheme(theme.dataset.theme);
  if (shape) {
    state.selectedShape = shape.dataset.shape;
    document.querySelectorAll(".template-card").forEach(function(b) {
      b.classList.toggle("active", b.dataset.shape === state.selectedShape);
    });
    generateRoomData();
    navigateTo("room-editor");
    showToast("已选择「" + roomShapes[state.selectedShape].name + "」");
  }
  if (postIdx) {
    currentPostIdx = parseInt(postIdx.dataset.postIdx);
    navigateTo("post-detail");
  }

  /* Like post */
  if (action && action.dataset.action === "like-post") {
    var post = communitySeed[currentPostIdx];
    if (post) {
      post.liked = !post.liked;
      if (post.liked) {
        post.likes = post.likedCount + 1;
      } else {
        post.likes = post.likedCount;
      }
      renderPostDetail();
    }
  }

  /* Tag search */
  if (action && action.dataset.action === "tag-search") {
    var tag = action.dataset.tag;
    state._tagSearchTag = tag;
    var titleEl = document.getElementById("tag-search-title");
    if (titleEl) titleEl.textContent = "#" + tag;
    renderTagSearchFeed(tag);
    navigateTo("tag-search");
  }

  /* Post comment */
  if (action && action.dataset.action === "post-comment") {
    var input = document.getElementById("comment-input");
    if (input && input.value.trim()) {
      var post = communitySeed[currentPostIdx];
      if (post) {
        if (!post.myComments) post.myComments = [];
        post.myComments.push(input.value.trim());
        if (!post.comments) post.comments = [];
        input.value = "";
        renderPostDetail();
        showToast("评论成功");
      }
    }
  }
    if (a === "like-comment") {
      var cmtIdx = parseInt(action.dataset.cmtIdx);
      var post2 = communitySeed[currentPostIdx];
      if (!post2._commentLikes) post2._commentLikes = {};
      post2._commentLikes[cmtIdx] = !post2._commentLikes[cmtIdx];
      renderPostDetail();
    }
    if (a === "reply-comment") {
      var cmtIdx2 = parseInt(action.dataset.cmtIdx);
      var cmtEl = document.getElementById("cmt-" + cmtIdx2);
      if (cmtEl && !cmtEl.querySelector(".reply-input-row")) {
        var replyRow = document.createElement("div");
        replyRow.className = "reply-input-row";
        replyRow.innerHTML = '<input type="text" placeholder="回复..." class="reply-input" />' +
          '<button class="comment-send-btn" data-action="send-reply" data-cmt-idx="' + cmtIdx2 + '">发送</button>';
        cmtEl.querySelector(".comment-body").appendChild(replyRow);
        replyRow.querySelector("input").focus();
      }
    }
    if (a === "send-reply") {
      var cmtIdx3 = parseInt(action.dataset.cmtIdx);
      var replyInput = action.parentElement.querySelector(".reply-input");
      if (replyInput && replyInput.value.trim()) {
        var replyText = replyInput.value.trim();
        var post3 = communitySeed[currentPostIdx];
        var allCmts = (post3.comments || []).concat(post3.myComments || []);
        if (!post3._replies) post3._replies = {};
        if (!post3._replies[cmtIdx3]) post3._replies[cmtIdx3] = [];
        post3._replies[cmtIdx3].push({ user: "我", text: replyText });
        /* Insert reply visually */
        var cmtBody = document.getElementById("cmt-" + cmtIdx3).querySelector(".comment-body");
        var replyDiv = document.createElement("div");
        replyDiv.className = "comment-reply";
        replyDiv.innerHTML = '<div class="comment-avatar" style="width:22px;height:22px;font-size:10px;">我</div><div class="comment-body"><strong>我</strong><p>' + replyText + '</p></div>';
        action.parentElement.parentElement.querySelector(".reply-input-row").remove();
        cmtBody.appendChild(replyDiv);
        showToast("回复成功");
      }
    }
    if (a === "report-comment") {
      showToast("已举报，我们会尽快处理");
    }
    if (a === "view-post-room") {
      var postIdx = parseInt(action.dataset.postIdx);
      var post4 = communitySeed[postIdx];
      if (post4 && post4.visibility === "full") {
        state.selectedShape = "rectangle";
        state.theme = post4.theme || "cozy";
        generateRoomData();
        navigateTo("room-editor");
      }
    }

  if (communityFilter) {
    state.communityFilter = communityFilter.dataset.communityFilter;
    document.querySelectorAll(".pill").forEach(function(btn) {
      btn.classList.toggle("active", btn.dataset.communityFilter === state.communityFilter);
    });
    renderFeed();
  }

  if (importMode) {
    var mode = importMode.dataset.importMode;
    document.querySelectorAll(".import-mode-tab").forEach(function(t) { t.classList.toggle("active", t.dataset.importMode === mode); });
    document.getElementById("camera-import-panel").classList.toggle("active", mode === "camera");
    document.getElementById("draw-import-panel").classList.toggle("active", mode === "draw");
    if (mode === "draw") setTimeout(initDrawCanvas, 100);
  }

  if (drawColor) {
    var color = drawColor.dataset.drawColor;
    state.drawColor = color;
    document.querySelectorAll(".draw-color").forEach(function(c) { c.classList.toggle("active", c.dataset.drawColor === color); });
  }

  if (drawTool) {
    var dtool = drawTool.dataset.drawTool;
    if (dtool === "clear") {
      clearDrawCanvas();
      return;
    }
    state.drawTool = dtool;
    document.querySelectorAll(".draw-tool-btn[data-draw-tool='pen'],.draw-tool-btn[data-draw-tool='fill']").forEach(function(b) {
      b.classList.toggle("active", b.dataset.drawTool === dtool);
    });
  }

  if (action) {
    var a = action.dataset.action;

    /* Navigation */
    if (a === "back") goBack();
    if (a === "start-scan") navigateTo("scan-process");
    if (a === "start-template") navigateTo("explore");
    if (a === "start-import") {
      navigateTo("import-furniture");
      setTimeout(initDrawCanvas, 100);
    }
    if (a === "open-editor") navigateTo("room-editor");
    if (a === "open-archives") navigateTo("archives");
    if (a === "open-settings") navigateTo("settings");
    if (a === "open-help") showToast("帮助页面开发中");
    if (a === "open-challenges") navigateTo("challenges");
    if (a === "open-theme-preview") navigateTo("theme-preview");
    if (a === "open-furniture-collection") openFurnitureCollection();
    if (a === "edit-this-room") { navigateTo("room-editor"); }

    /* Scan process */
    if (a === "pick-photo") photoInput.click();
    if (a === "retake-photo") {
      document.getElementById("photo-preview").style.display = "none";
      document.getElementById("ai-result").style.display = "none";
      photoInput.value = "";
    }
    if (a === "use-template") navigateTo("explore");
    if (a === "quick-create") {
      var shape = action.dataset.shape;
      if (shape) {
        state.selectedShape = shape;
        generateRoomData();
        autoCreateArchive("template");
        /* Close scan-process subpage if open */
        var scanEl = document.querySelector('.screen.subpage[data-screen="scan-process"]');
        if (scanEl && scanEl.classList.contains("active")) {
          scanEl.classList.remove("active");
          scanEl.classList.add("exiting");
          setTimeout(function() { scanEl.classList.remove("exiting"); }, 350);
          if (state.navStack.length > 0) state.navStack.pop();
        }
        navigateTo("room-editor");
      }
    }
    if (a === "enter-editor") {
      /* Use pre-generated scan data if available */
      if (state.lastScanRoomData) {
        state.roomData = JSON.parse(JSON.stringify(state.lastScanRoomData));
        state.historyStack = [JSON.stringify(state.roomData)];
        state.historyIndex = 0;
        state.itemSeq = state.roomData.furniture.length;
      } else {
        generateRoomData();
      }
      /* Close scan-process subpage first, then enter editor */
      var scanEl = document.querySelector('.screen.subpage[data-screen="scan-process"]');
      if (scanEl && scanEl.classList.contains("active")) {
        scanEl.classList.remove("active");
        scanEl.classList.add("exiting");
        setTimeout(function() { scanEl.classList.remove("exiting"); }, 350);
        /* Remove scan from navStack and replace with explore */
        if (state.navStack.length > 0) {
          state.navStack.pop();
        }
      }
      /* Auto-create archive for scanned room */
      autoCreateArchive("scan");
      navigateTo("room-editor");
    }

    /* Editor actions */
    if (a === "save-room") saveRoom();
    if (a === "show-share-card") generateShareCard();
    if (a === "close-share-card") hideOverlay("share-card-overlay");
    if (a === "share-room") shareRoom();
    if (a === "close-levelup") hideOverlay("levelup-overlay");

    /* Item actions */
    if (a === "rotate-item") rotateItem();
    if (a === "color-item") colorItem();
    if (a === "delete-item") deleteItem();
    if (a === "undo") undo();
    if (a === "redo") redo();
    if (a === "random-layout") randomLayout();
    if (a === "add-custom-furniture") addCustomFurniture();
    if (a === "pick-furniture-photo") simulateFurniturePhoto();
    if (a === "confirm-import-photo") confirmImportPhoto();
    if (a === "confirm-import-draw") confirmImportDraw();

    /* Furniture collection actions */
    if (a === "edit-furniture") {
      var furnitureId = action.dataset.furnitureId;
      if (furnitureId) editFurnitureItem(furnitureId);
    }
    if (a === "delete-furniture") {
      var furnitureId = action.dataset.furnitureId;
      if (furnitureId) deleteFurnitureItem(furnitureId);
    }

    /* My posts actions */
    if (a === "save-post-visibility") {
      var postIdx = action.dataset.postIdx;
      if (postIdx !== undefined) togglePostVisibility(parseInt(postIdx));
    }
    if (a === "delete-my-post") {
      var postIdx = action.dataset.postIdx;
      if (postIdx !== undefined) deleteMyPost(parseInt(postIdx));
    }

    /* Other */
    if (a === "view-json") viewJSON();
    if (a === "copy-json") copyJSON();
    if (a === "more-options") showToast("更多选项开发中");
    if (a === "delete-archive") {
      var archiveId = action.dataset.archiveId;
      deleteArchive(archiveId);
    }
    if (a === "view-archive-detail") {
      var room2 = action.dataset.room;
      currentDetailRoom = room2;
      navigateTo("room-detail");
    }
    if (a === "duplicate-archive") {
      var room3 = action.dataset.room;
      var srcArch = state.archives.find(function(a) { return a.id === room3; });
      if (srcArch) {
        var dup = JSON.parse(JSON.stringify(srcArch));
        dup.id = "arch-" + Date.now();
        dup.name = srcArch.name + " 副本";
        dup.time = new Date().getHours() + ":" + (new Date().getMinutes() < 10 ? "0" : "") + new Date().getMinutes();
        state.archives.unshift(dup);
        autoCreateArchive("duplicate");
        renderArchives();
        renderArchivesFullList();
        updateHomeRecentRooms();
        showToast("已复制为「" + dup.name + "」");
      }
    }
    if (a === "share-single-archive") {
      var room4 = action.dataset.room;
      state.selectedShape = (state.archives.find(function(a) { return a.id === room4; }) || {}).shape || "rectangle";
      state.theme = (state.archives.find(function(a) { return a.id === room4; }) || {}).theme || "cozy";
      generateRoomData();
      shareRoom();
    }
    if (a === "delete-room") { goBack(); showToast("房间已删除"); }
    return;
  }

  if (room) {
    currentDetailRoom = room.dataset.room;
    /* If room id matches an archive, load its data into editor */
    var arch = state.archives.find(function(a) { return a.id === currentDetailRoom; });
    if (arch) {
      state.selectedShape = arch.shape;
      state.theme = arch.theme;
    }
    navigateTo("room-detail");
  }
});

photoInput.addEventListener("change", function() {
  if (photoInput.files.length) handlePhoto(photoInput.files[0]);
});

/* ===== Clock ===== */
function updateClock() {
  var now = new Date();
  var h = now.getHours();
  var m = now.getMinutes();
  var el = document.getElementById("clock");
  if (el) el.textContent = h + ":" + (m < 10 ? "0" : "") + m;
}
setInterval(updateClock, 60000);
updateClock();

/* ===== Import Furniture - Camera Mode ===== */
function simulateFurniturePhoto() {
  var types = ["椅子", "小桌", "台灯", "花瓶", "书架", "收纳箱", "装饰画", "床头柜"];
  var colors = [["#b88758","#d4a078"],["#8fae7f","#a8c898"],["#b9a7c8","#c8b8d8"],["#c8a994","#b89878"],["#e8c77f","#f0d898"]];
  var t = types[Math.floor(Math.random() * types.length)];
  var c = colors[Math.floor(Math.random() * colors.length)];

  document.getElementById("scan-furniture-type").textContent = t;
  document.getElementById("scan-furniture-size").textContent = "1x1";
  document.getElementById("scan-furniture-name").textContent = "我的" + t;
  document.getElementById("scan-furniture-colors").innerHTML = c.map(function(col) {
    return '<div class="import-color-dot" style="background:' + col + '"></div>';
  }).join("");

  document.getElementById("furniture-scan-result").style.display = "block";
  state._lastPhotoType = t;
  state._lastPhotoColor = c[0];
  showToast("家具识别完成（模拟数据）");
}

function confirmImportPhoto() {
  var name = "我的" + (state._lastPhotoType || "家具");
  var color = state._lastPhotoColor || "#b88758";
  addImportedFurniture(name, color, "photo");
  document.getElementById("furniture-scan-result").style.display = "none";
  showToast(name + " 已添加到家具库");
}

/* ===== Import Furniture - Draw Mode ===== */
var DRAW_GRID = 14;
var DRAW_CELL = 20;

function initDrawCanvas() {
  if (state.drawCanvasInited) return;
  var canvas = document.getElementById("pixel-draw-canvas");
  if (!canvas) return;
  state.drawCanvasInited = true;

  canvas.width = DRAW_GRID * DRAW_CELL;
  canvas.height = DRAW_GRID * DRAW_CELL;
  var ctx = canvas.getContext("2d");

  /* Clear to white */
  ctx.fillStyle = "#f8f4f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  /* Draw grid */
  ctx.strokeStyle = "rgba(61,48,40,0.08)";
  ctx.lineWidth = 0.5;
  for (var i = 0; i <= DRAW_GRID; i++) {
    ctx.beginPath(); ctx.moveTo(i * DRAW_CELL, 0); ctx.lineTo(i * DRAW_CELL, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * DRAW_CELL); ctx.lineTo(canvas.width, i * DRAW_CELL); ctx.stroke();
  }

  /* Touch/Mouse events */
  var drawing = false;
  var lastCell = null;

  function getCellPos(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var x, y;
    if (e.touches) {
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }
    return { cx: Math.floor(x / DRAW_CELL), cy: Math.floor(y / DRAW_CELL) };
  }

  function paintCell(cx, cy) {
    if (cx < 0 || cx >= DRAW_GRID || cy < 0 || cy >= DRAW_GRID) return;
    var key = cx + "," + cy;
    if (lastCell === key) return;
    lastCell = key;

    var color = state.drawColor;
    if (color === "eraser") {
      ctx.fillStyle = "#f8f4f0";
    } else {
      ctx.fillStyle = color;
    }
    ctx.fillRect(cx * DRAW_CELL, cy * DRAW_CELL, DRAW_CELL, DRAW_CELL);

    /* Redraw grid lines */
    ctx.strokeStyle = "rgba(61,48,40,0.08)";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(cx * DRAW_CELL, cy * DRAW_CELL, DRAW_CELL, DRAW_CELL);
  }

  function startDraw(e) {
    e.preventDefault();
    drawing = true;
    lastCell = null;
    var pos = getCellPos(e);
    if (state.drawTool === "fill") {
      floodFill(pos.cx, pos.cy, state.drawColor === "eraser" ? "#f8f4f0" : state.drawColor);
    } else {
      paintCell(pos.cx, pos.cy);
    }
  }

  function moveDraw(e) {
    if (!drawing) return;
    e.preventDefault();
    var pos = getCellPos(e);
    paintCell(pos.cx, pos.cy);
  }

  function endDraw() { drawing = false; lastCell = null; }

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", moveDraw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseleave", endDraw);
  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", moveDraw, { passive: false });
  canvas.addEventListener("touchend", endDraw);
}

function floodFill(startCx, startCy, fillColor) {
  var canvas = document.getElementById("pixel-draw-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var data = imageData.data;
  var w = canvas.width;

  function getPixel(x, y) {
    var idx = (y * w + x) * 4;
    return "rgb(" + data[idx] + "," + data[idx+1] + "," + data[idx+2] + ")";
  }

  function setPixel(x, y, color) {
    /* Parse fill color */
    var temp = document.createElement("canvas").getContext("2d");
    temp.fillStyle = color;
    temp.fillRect(0, 0, 1, 1);
    var cd = temp.getImageData(0, 0, 1, 1).data;

    var sx = x * DRAW_CELL;
    var sy = y * DRAW_CELL;
    for (var dy = 0; dy < DRAW_CELL; dy++) {
      for (var dx = 0; dx < DRAW_CELL; dx++) {
        var idx = ((sy + dy) * w + (sx + dx)) * 4;
        data[idx] = cd[0]; data[idx+1] = cd[1]; data[idx+2] = cd[2]; data[idx+3] = 255;
      }
    }
  }

  /* Sample center of start cell */
  var scx = startCx * DRAW_CELL + Math.floor(DRAW_CELL / 2);
  var scy = startCy * DRAW_CELL + Math.floor(DRAW_CELL / 2);
  var targetColor = getPixel(scx, scy);

  /* Temp canvas to parse fillColor */
  var tc = document.createElement("canvas").getContext("2d");
  tc.fillStyle = fillColor;
  tc.fillRect(0, 0, 1, 1);
  var fc = tc.getImageData(0, 0, 1, 1).data;
  var fillRGB = "rgb(" + fc[0] + "," + fc[1] + "," + fc[2] + ")";

  if (targetColor === fillRGB) return;

  var stack = [[startCx, startCy]];
  var visited = {};

  while (stack.length > 0 && stack.length < 500) {
    var p = stack.pop();
    var px = p[0], py = p[1];
    var key = px + "," + py;
    if (visited[key]) continue;
    if (px < 0 || px >= DRAW_GRID || py < 0 || py >= DRAW_GRID) continue;

    var pcx = px * DRAW_CELL + Math.floor(DRAW_CELL / 2);
    var pcy = py * DRAW_CELL + Math.floor(DRAW_CELL / 2);
    if (getPixel(pcx, pcy) !== targetColor) continue;

    visited[key] = true;
    setPixel(px, py, fillColor);

    stack.push([px+1, py]);
    stack.push([px-1, py]);
    stack.push([px, py+1]);
    stack.push([px, py-1]);
  }

  ctx.putImageData(imageData, 0, 0);

  /* Redraw grid */
  ctx.strokeStyle = "rgba(61,48,40,0.08)";
  ctx.lineWidth = 0.5;
  for (var i = 0; i <= DRAW_GRID; i++) {
    ctx.beginPath(); ctx.moveTo(i * DRAW_CELL, 0); ctx.lineTo(i * DRAW_CELL, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * DRAW_CELL); ctx.lineTo(canvas.width, i * DRAW_CELL); ctx.stroke();
  }
}

function clearDrawCanvas() {
  var canvas = document.getElementById("pixel-draw-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f8f4f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(61,48,40,0.08)";
  ctx.lineWidth = 0.5;
  for (var i = 0; i <= DRAW_GRID; i++) {
    ctx.beginPath(); ctx.moveTo(i * DRAW_CELL, 0); ctx.lineTo(i * DRAW_CELL, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * DRAW_CELL); ctx.lineTo(canvas.width, i * DRAW_CELL); ctx.stroke();
  }
  showToast("画布已清空");
}

function confirmImportDraw() {
  var canvas = document.getElementById("pixel-draw-canvas");
  if (!canvas) return;
  var nameInput = document.getElementById("draw-furniture-name");
  var name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "手绘家具";

  /* Get dominant color from canvas */
  var ctx = canvas.getContext("2d");
  var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  var r = 0, g = 0, b = 0, count = 0;
  for (var i = 0; i < data.length; i += 16) {
    if (data[i] !== 248 || data[i+1] !== 244 || data[i+2] !== 240) {
      r += data[i]; g += data[i+1]; b += data[i+2]; count++;
    }
  }
  var color = count > 0 ?
    "#" + ("0" + Math.round(r/count).toString(16)).slice(-2) +
         ("0" + Math.round(g/count).toString(16)).slice(-2) +
         ("0" + Math.round(b/count).toString(16)).slice(-2) : "#b88758";

  /* Save thumbnail */
  var thumbCanvas = document.createElement("canvas");
  thumbCanvas.width = 56;
  thumbCanvas.height = 56;
  var tctx = thumbCanvas.getContext("2d");
  tctx.drawImage(canvas, 0, 0, 56, 56);
  var thumbData = thumbCanvas.toDataURL();

  addImportedFurniture(name, color, "draw", thumbData);
  clearDrawCanvas();
  if (nameInput) nameInput.value = "";
  showToast(name + " 已添加到家具库");
}

/* ===== Imported Furniture Management ===== */
function addImportedFurniture(name, color, source, thumbData) {
  var item = {
    id: "imp-" + Date.now(),
    name: name,
    color: color,
    source: source,
    thumb: thumbData || null,
    time: new Date().getHours() + ":" + (new Date().getMinutes() < 10 ? "0" : "") + new Date().getMinutes()
  };
  state.importedFurniture.push(item);

  /* Also add to furniture catalog so it shows in editor */
  furnitureCatalog.push({
    type: "imported-" + item.id,
    name: name,
    w: 1, h: 1, d: 1,
    color: parseInt(color.replace("#", "0x")),
    colorName: color,
    size: "small",
    stackable: true
  });

  renderImportedList();
  renderFurnitureCatalog();
}

function renderImportedList() {
  var section = document.getElementById("imported-list-section");
  var grid = document.getElementById("imported-grid");
  var countEl = document.getElementById("imported-count");

  if (state.importedFurniture.length === 0) {
    if (section) section.style.display = "none";
    return;
  }

  if (section) section.style.display = "block";
  if (countEl) countEl.textContent = state.importedFurniture.length;

  if (!grid) return;
  grid.innerHTML = state.importedFurniture.map(function(item) {
    var thumbHtml;
    if (item.thumb) {
      thumbHtml = '<img class="imported-item-canvas" src="' + item.thumb + '" alt="' + item.name + '">';
    } else {
      thumbHtml = '<div class="imported-item-canvas" style="background:' + item.color + ';display:grid;place-items:center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/></svg></div>';
    }
    var srcLabel = item.source === "photo" ? "拍照导入" : "手绘创作";
    return '<div class="imported-item">' +
      thumbHtml +
      '<strong>' + item.name + '</strong>' +
      '<span>' + srcLabel + '</span>' +
    '</div>';
  }).join("");
}

/* ===== My Posts & Furniture Collection ===== */

function renderMyPosts() {
  var posts = state.myPosts.length > 0 ? state.myPosts : communitySeed.filter(function(p) {
    return p.user === "像素房间设计师" || p.user === "我";
  });
  return posts;
}

function saveMyPost(postData) {
  communitySeed.unshift(postData);
  state.myPosts.unshift(postData);
  renderMyPostsList();
  renderFeed();
  renderHomeWaterfall();
}

function deleteMyPost(postIdx) {
  var posts = state.myPosts.length > 0 ? state.myPosts : communitySeed.filter(function(p) {
    return p.user === "像素房间设计师" || p.user === "我";
  });
  if (postIdx < 0 || postIdx >= posts.length) return;
  var post = posts[postIdx];
  /* Remove from communitySeed */
  var seedIdx = communitySeed.indexOf(post);
  if (seedIdx >= 0) communitySeed.splice(seedIdx, 1);
  /* Remove from state.myPosts */
  var myIdx = state.myPosts.indexOf(post);
  if (myIdx >= 0) state.myPosts.splice(myIdx, 1);
  renderMyPostsList();
  renderFeed();
  renderHomeWaterfall();
  showToast("动态已删除");
}

function togglePostVisibility(postIdx) {
  var posts = state.myPosts.length > 0 ? state.myPosts : communitySeed.filter(function(p) {
    return p.user === "像素房间设计师" || p.user === "我";
  });
  if (postIdx < 0 || postIdx >= posts.length) return;
  var post = posts[postIdx];
  if (!post.visibility) post.visibility = "full";
  post.visibility = post.visibility === "public" ? "private" : "public";
  renderMyPostsList();
  var label = post.visibility === "public" ? "公开" : "私密";
  showToast("已切换为" + label);
}

function renderMyPostsList() {
  var section = document.getElementById("my-posts-section");
  var container = document.getElementById("my-posts-list");
  if (!section || !container) return;

  var posts = state.myPosts.length > 0 ? state.myPosts : communitySeed.filter(function(p) {
    return p.user === "像素房间设计师" || p.user === "我";
  });

  if (posts.length === 0) {
    section.style.display = "none";
    return;
  }
  section.style.display = "block";

  container.innerHTML = posts.map(function(post, idx) {
    var visibility = post.visibility === "private" ? "private" : "public";
    var visLabel = visibility === "public" ? "公开" : "私密";
    var seedIdx = communitySeed.indexOf(post);
    return '<div class="my-post-row">' +
      '<div class="my-post-thumb">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>' +
      '</div>' +
      '<div class="my-post-info">' +
        '<strong>' + post.title + '</strong>' +
        '<span><span class="visibility-badge ' + visibility + '">' + visLabel + '</span></span>' +
      '</div>' +
      '<div class="my-post-actions">' +
        '<button class="my-post-action-btn" data-action="save-post-visibility" data-post-idx="' + seedIdx + '" title="切换可见性">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
        '</button>' +
        '<button class="my-post-action-btn danger" data-action="delete-my-post" data-post-idx="' + seedIdx + '" title="删除">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
        '</button>' +
      '</div>' +
    '</div>';
  }).join("");
}

function renderFurnitureCollection() {
  var container = document.getElementById("furniture-collection-list");
  if (!container) return;

  var items = state.furnitureCollection.slice(0, 6);
  container.innerHTML = items.map(function(item) {
    return '<div class="room-thumb-card" style="flex:0 0 100px">' +
      '<div class="room-thumb-visual" style="background:' + item.color + ';display:grid;place-items:center">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="4"/></svg>' +
      '</div>' +
      '<div class="room-thumb-info"><strong>' + item.name + '</strong><span>' + (item.isSystem ? '系统' : '自定义') + '</span></div>' +
    '</div>';
  }).join("");
}

function openFurnitureCollection() {
  navigateTo("furniture-collection");
  renderFurnitureCollectionGrid();
}

function renderFurnitureCollectionGrid() {
  var grid = document.getElementById("furniture-collection-grid");
  if (!grid) return;

  grid.innerHTML = state.furnitureCollection.map(function(item) {
    var actionsHtml = '';
    if (item.isSystem) {
      actionsHtml = '<div class="fc-actions">' +
        '<button class="fc-action-btn" data-action="edit-furniture" data-furniture-id="' + item.id + '">另存为</button>' +
      '</div>';
    } else {
      actionsHtml = '<div class="fc-actions">' +
        '<button class="fc-action-btn" data-action="edit-furniture" data-furniture-id="' + item.id + '">编辑</button>' +
        '<button class="fc-action-btn danger" data-action="delete-furniture" data-furniture-id="' + item.id + '">删除</button>' +
      '</div>';
    }
    return '<div class="fc-card">' +
      '<div class="fc-swatch" style="background:' + item.color + '"></div>' +
      '<strong>' + item.name + '</strong>' +
      '<span class="fc-source">' + (item.isSystem ? '<span class="fc-system-badge">系统</span>' : '自定义') + '</span>' +
      actionsHtml +
    '</div>';
  }).join("");
}

function editFurnitureItem(itemId) {
  var item = state.furnitureCollection.find(function(f) { return f.id === itemId; });
  if (!item) return;

  if (item.isSystem) {
    /* Create a copy */
    var newId = "fc-custom-" + Date.now();
    var copy = {
      id: newId,
      name: item.name + " (副本)",
      color: item.color,
      isSystem: false,
      source: "custom"
    };
    state.furnitureCollection.push(copy);
    renderFurnitureCollection();
    renderFurnitureCollectionGrid();
    showToast("已另存为副本，原系统家具不可修改");
  } else {
    /* Direct edit - for now just show toast */
    showToast("正在编辑「" + item.name + "」");
  }
}

function deleteFurnitureItem(itemId) {
  var item = state.furnitureCollection.find(function(f) { return f.id === itemId; });
  if (!item) return;

  if (item.isSystem) {
    showToast("系统家具不可删除");
    return;
  }

  state.furnitureCollection = state.furnitureCollection.filter(function(f) { return f.id !== itemId; });
  renderFurnitureCollection();
  renderFurnitureCollectionGrid();
  showToast("已删除「" + item.name + "」");
}

function addSystemFurnitureToCollection(furnitureItem) {
  /* Check if already in collection */
  var exists = state.furnitureCollection.find(function(f) {
    return f.name === furnitureItem.name;
  });
  if (exists) return;

  state.furnitureCollection.push({
    id: "fc-auto-" + Date.now(),
    name: furnitureItem.name,
    color: furnitureItem.color || furnitureItem.colorName || "#b88758",
    isSystem: false,
    source: "system"
  });
  renderFurnitureCollection();
}

/* ===== Init ===== */
renderFurnitureCatalog();
renderFeed();
renderHomeWaterfall();
renderChallenges();
updateLevelDisplay();
renderArchives();
updateHomeRecentRooms();
generateRoomData();
renderPostDetail();
renderMyPostsList();
renderFurnitureCollection();

var communitySearch = document.getElementById("community-search");
if (communitySearch) {
  communitySearch.addEventListener("input", function() {
    state.communitySearch = communitySearch.value;
    renderFeed();
  });
}
