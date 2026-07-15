/* =====================================================
 *  叮咚学 v3 · 乐园 3.0 建造引擎 (world.js)
 *  纯前端 / ES5 语法 / IIFE 模块化
 *  依赖：window.DD (data.js) 中的 MATERIALS 和 PARK_SCENES
 *  暴露：window.World
 *
 *  功能总览：
 *    1. 等距视角网格渲染（20x20 菱形方块）
 *    2. 方块操作（放置 / 移除 / 撤销 / 重做）
 *    3. 视角控制（拖拽平移 / 滚轮缩放 / 触摸双指缩放）
 *    4. 材料栏（按场景解锁分类）
 *    5. 场景系统（6 种场景切换）
 *    6. 材料商店（扣叮咚币 / 批量购买 / localStorage）
 *    7. 世界数据（序列化 / 分享码 base64 / 导入）
 *    8. 社交分享（分享到广场 / 只读浏览模式）
 * ===================================================== */
(function (window) {
  'use strict';

  // ===================================================
  // 0. 常量与工具函数
  // ===================================================

  var TILE_W = 64;          // 菱形方块的宽度（像素）
  var TILE_H = 32;          // 菱形方块的高度（像素）
  var GRID_SIZE = 20;       // 网格大小 20 x 20
  var MAX_UNDO = 50;        // 撤销 / 重做栈最多保存 50 步
  var BLOCK_H = 16;         // 方块侧面高度（让方块看起来有立体感）
  var STORAGE_KEY = 'dd.world';        // 世界存档在 localStorage 的 key
  var INVENTORY_KEY = 'dd.world.inv';  // 库存数据在 localStorage 的 key

  /** 把数值限制在 [a, b] 范围内 */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /** 安全地从 localStorage 读取 JSON */
  function safeGet(key, def) {
    try {
      var v = localStorage.getItem(key);
      return v == null ? def : JSON.parse(v);
    } catch (e) { return def; }
  }

  /** 安全地把 JSON 写入 localStorage */
  function safeSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { return false; }
  }

  /** base64 编码（支持中文，先 encodeURIComponent 再转） */
  function b64Encode(str) {
    try {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (m, p) {
        return String.fromCharCode('0x' + p);
      }));
    } catch (e) { return ''; }
  }

  /** base64 解码（支持中文） */
  function b64Decode(b64) {
    try {
      var str = atob(b64);
      return decodeURIComponent(str.split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch (e) { return ''; }
  }

  /** 把 #RRGGBB 颜色变暗，amt 是变暗比例 0~1 */
  function darken(hex, amt) {
    var c = hexToRgb(hex);
    if (!c) return hex;
    var r = Math.floor(c.r * (1 - amt));
    var g = Math.floor(c.g * (1 - amt));
    var b = Math.floor(c.b * (1 - amt));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  /** #RRGGBB → {r,g,b} */
  function hexToRgb(hex) {
    if (!hex) return null;
    var m = /^#([0-9a-fA-F]{6})$/.exec(hex);
    if (m) {
      return {
        r: parseInt(m[1].substring(0, 2), 16),
        g: parseInt(m[1].substring(2, 4), 16),
        b: parseInt(m[1].substring(4, 6), 16)
      };
    }
    return null;
  }

  // ===================================================
  // 1. 引擎状态（把所有变量集中管理）
  // ===================================================

  var engine = {
    canvas: null,         // Canvas 元素
    ctx: null,            // 2D 绘图上下文
    dpr: 1,               // 设备像素比（高分屏适配）
    width: 0,             // 画布 CSS 宽度
    height: 0,            // 画布 CSS 高度
    // 视角变换参数
    offsetX: 0,           // 平移 X
    offsetY: 0,           // 平移 Y
    scale: 1,             // 缩放比例
    // 网格数据：blocks[y][x] = matId 或 null
    blocks: null,
    // 当前场景
    sceneId: 'street',
    scene: null,
    // 当前操作模式与选中材料
    mode: 'place',        // 'place' | 'erase' | 'move'
    curMatId: 'grass',
    // 撤销 / 重做栈（存放每一步操作）
    undoStack: [],
    redoStack: [],
    // 库存：{ matId: count }
    inventory: {},
    // 外部回调（由 app.js 传入）
    opts: {},
    // 状态标志
    viewOnly: false,      // 是否只读浏览模式
    destroyed: false,
    // 渲染防抖
    rafId: 0,
    // 拖拽相关
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragOriginX: 0,
    dragOriginY: 0,
    dragMoved: false,     // 是否真的移动了（用于区分点击和拖拽）
    // 触摸双指缩放
    lastTouchDist: 0,
    // 鼠标悬停的格子
    hoverX: -1,
    hoverY: -1
  };

  // ===================================================
  // 2. 等距视角坐标转换
  //   网格坐标 (x, y) → 等距屏幕坐标 (sx, sy)
  //   想象把正方形格子旋转 45° 压扁，就变成菱形
  // ===================================================

  function toIso(x, y) {
    return {
      sx: (x - y) * TILE_W / 2,
      sy: (x + y) * TILE_H / 2
    };
  }

  function fromIso(sx, sy) {
    return {
      x: (sx / (TILE_W / 2) + sy / (TILE_H / 2)) / 2,
      y: (sy / (TILE_H / 2) - sx / (TILE_W / 2)) / 2
    };
  }

  /** 屏幕坐标 → 等距世界坐标（减去平移、除以缩放） */
  function screenToWorld(sx, sy) {
    return {
      sx: (sx - engine.offsetX) / engine.scale,
      sy: (sy - engine.offsetY) / engine.scale
    };
  }

  /** 屏幕坐标 → 网格坐标（取整） */
  function screenToGrid(sx, sy) {
    var w = screenToWorld(sx, sy);
    var g = fromIso(w.sx, w.sy);
    return { x: Math.floor(g.x), y: Math.floor(g.y) };
  }

  // ===================================================
  // 3. 数据查找辅助
  // ===================================================

  /** 初始化空的 20x20 网格 */
  function initBlocks() {
    var arr = [];
    for (var y = 0; y < GRID_SIZE; y++) {
      var row = [];
      for (var x = 0; x < GRID_SIZE; x++) row.push(null);
      arr.push(row);
    }
    return arr;
  }

  /** 根据 matId 查材料 */
  function findMaterial(matId) {
    if (!window.DD || !DD.MATERIALS) return null;
    for (var i = 0; i < DD.MATERIALS.length; i++) {
      if (DD.MATERIALS[i].id === matId) return DD.MATERIALS[i];
    }
    return null;
  }

  /** 根据 sceneId 查场景 */
  function findScene(sceneId) {
    if (!window.DD || !DD.PARK_SCENES) return null;
    for (var i = 0; i < DD.PARK_SCENES.length; i++) {
      if (DD.PARK_SCENES[i].id === sceneId) return DD.PARK_SCENES[i];
    }
    return null;
  }

  /** 当前场景解锁的材料分类 */
  function getUnlockedCats() {
    if (!engine.scene) return ['basic'];
    return engine.scene.unlockCats || ['basic'];
  }

  /** 当前场景解锁的材料列表 */
  function getUnlockedMaterials() {
    var cats = getUnlockedCats();
    var list = [];
    if (!window.DD || !DD.MATERIALS) return list;
    for (var i = 0; i < DD.MATERIALS.length; i++) {
      if (cats.indexOf(DD.MATERIALS[i].cat) >= 0) list.push(DD.MATERIALS[i]);
    }
    return list;
  }

  // ===================================================
  // 4. 暗色模式检测
  // ===================================================

  function isDarkMode() {
    try {
      var t = document.documentElement.getAttribute('data-theme') ||
              document.body.getAttribute('data-theme');
      if (t === 'night' || t === 'cyber' || t === 'galaxy') return true;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
    } catch (e) {}
    return false;
  }

  /** 从场景背景渐变里提取第一个 #xxxxxx 颜色作为画布底色 */
  function getSceneBgColor() {
    if (isDarkMode()) return '#1A1726';
    var bg = engine.scene ? engine.scene.bg : '';
    var m = /#([0-9a-fA-F]{6})/.exec(bg);
    if (m) return '#' + m[1];
    return '#FAF8FF';
  }

  // ===================================================
  // 5. 渲染（带 requestAnimationFrame 防抖）
  // ===================================================

  /** 请求重绘（一帧内多次调用只会渲染一次） */
  function requestRender() {
    if (engine.rafId) return;
    engine.rafId = requestAnimationFrame(function () {
      engine.rafId = 0;
      render();
    });
  }

  /** 重新设置画布尺寸（适配高分屏和窗口缩放） */
  function resizeCanvas() {
    var cv = engine.canvas;
    if (!cv) return;
    var parent = cv.parentElement;
    var w = parent ? parent.clientWidth : cv.clientWidth || 600;
    var h = parent ? parent.clientHeight : cv.clientHeight || 400;
    engine.dpr = window.devicePixelRatio || 1;
    engine.width = w;
    engine.height = h;
    cv.width = Math.floor(w * engine.dpr);
    cv.height = Math.floor(h * engine.dpr);
    cv.style.width = w + 'px';
    cv.style.height = h + 'px';
    engine.ctx.setTransform(engine.dpr, 0, 0, engine.dpr, 0, 0);
    requestRender();
  }

  /** 绘制菱形顶面 */
  function drawTileTop(ctx, cx, cy, color) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - TILE_H / 2);
    ctx.lineTo(cx + TILE_W / 2, cy);
    ctx.lineTo(cx, cy + TILE_H / 2);
    ctx.lineTo(cx - TILE_W / 2, cy);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /** 绘制立体方块（左侧面 + 右侧面 + 顶面 + emoji） */
  function drawBlock(ctx, cx, cy, color, emoji) {
    var h = BLOCK_H;
    // 左侧面（最暗）
    ctx.beginPath();
    ctx.moveTo(cx - TILE_W / 2, cy);
    ctx.lineTo(cx, cy + TILE_H / 2);
    ctx.lineTo(cx, cy + TILE_H / 2 + h);
    ctx.lineTo(cx - TILE_W / 2, cy + h);
    ctx.closePath();
    ctx.fillStyle = darken(color, 0.4);
    ctx.fill();
    // 右侧面（中等暗）
    ctx.beginPath();
    ctx.moveTo(cx + TILE_W / 2, cy);
    ctx.lineTo(cx, cy + TILE_H / 2);
    ctx.lineTo(cx, cy + TILE_H / 2 + h);
    ctx.lineTo(cx + TILE_W / 2, cy + h);
    ctx.closePath();
    ctx.fillStyle = darken(color, 0.2);
    ctx.fill();
    // 顶面（原色最亮）
    drawTileTop(ctx, cx, cy, color);
    // 画 emoji 图标
    if (emoji) {
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, cx, cy);
    }
  }

  /** 主渲染函数 */
  function render() {
    var ctx = engine.ctx;
    if (!ctx) return;
    // 1. 清屏 + 背景色
    ctx.clearRect(0, 0, engine.width, engine.height);
    ctx.fillStyle = getSceneBgColor();
    ctx.fillRect(0, 0, engine.width, engine.height);

    // 2. 应用视角变换（平移 + 缩放）
    ctx.save();
    ctx.translate(engine.offsetX, engine.offsetY);
    ctx.scale(engine.scale, engine.scale);

    // 3. 画网格底面
    drawGrid(ctx);

    // 4. 画方块（从远到近：y 从小到大，x 从小到大）
    for (var y = 0; y < GRID_SIZE; y++) {
      for (var x = 0; x < GRID_SIZE; x++) {
        var matId = engine.blocks[y][x];
        if (!matId) continue;
        var mat = findMaterial(matId);
        if (!mat) continue;
        var iso = toIso(x, y);
        drawBlock(ctx, iso.sx, iso.sy, mat.color, mat.emoji);
      }
    }

    // 5. 画鼠标悬停高亮（只在可编辑模式）
    if (!engine.viewOnly && engine.hoverX >= 0 && engine.hoverX < GRID_SIZE &&
        engine.hoverY >= 0 && engine.hoverY < GRID_SIZE) {
      drawHover(ctx, engine.hoverX, engine.hoverY);
    }

    ctx.restore();
  }

  /** 画网格底面（菱形格子线） */
  function drawGrid(ctx) {
    var dark = isDarkMode();
    var lineColor = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
    var fillColor = dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.25)';
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    for (var y = 0; y < GRID_SIZE; y++) {
      for (var x = 0; x < GRID_SIZE; x++) {
        var iso = toIso(x, y);
        ctx.beginPath();
        ctx.moveTo(iso.sx, iso.sy - TILE_H / 2);
        ctx.lineTo(iso.sx + TILE_W / 2, iso.sy);
        ctx.lineTo(iso.sx, iso.sy + TILE_H / 2);
        ctx.lineTo(iso.sx - TILE_W / 2, iso.sy);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  /** 画悬停高亮（放置模式紫色，橡皮擦模式红色） */
  function drawHover(ctx, x, y) {
    var iso = toIso(x, y);
    ctx.beginPath();
    ctx.moveTo(iso.sx, iso.sy - TILE_H / 2);
    ctx.lineTo(iso.sx + TILE_W / 2, iso.sy);
    ctx.lineTo(iso.sx, iso.sy + TILE_H / 2);
    ctx.lineTo(iso.sx - TILE_W / 2, iso.sy);
    ctx.closePath();
    var isErase = (engine.mode === 'erase');
    ctx.fillStyle = isErase ? 'rgba(244,67,54,0.4)' : 'rgba(124,92,255,0.4)';
    ctx.fill();
    ctx.strokeStyle = isErase ? '#F44336' : '#7C5CFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // ===================================================
  // 6. 事件处理（鼠标 + 触摸）
  // ===================================================

  /** 从事件中取出相对画布的坐标（兼容鼠标和触摸） */
  function getEventPos(e) {
    var cv = engine.canvas;
    var rect = cv.getBoundingClientRect();
    var t;
    if (e.touches && e.touches.length) {
      t = e.touches[0];
    } else if (e.changedTouches && e.changedTouches.length) {
      t = e.changedTouches[0];
    } else {
      t = e;
    }
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }

  /** 计算双指距离（用于触摸缩放） */
  function touchDist(e) {
    var dx = e.touches[0].clientX - e.touches[1].clientX;
    var dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onPointerDown(e) {
    // 双指 → 进入缩放模式
    if (e.touches && e.touches.length === 2) {
      engine.lastTouchDist = touchDist(e);
      engine.dragging = false;
      if (e.cancelable) e.preventDefault();
      return;
    }
    var p = getEventPos(e);
    // 记录拖拽起点（任何模式都可以拖拽，松手时再判断是点击还是拖拽）
    engine.dragging = true;
    engine.dragStartX = p.x;
    engine.dragStartY = p.y;
    engine.dragOriginX = engine.offsetX;
    engine.dragOriginY = engine.offsetY;
    engine.dragMoved = false;
    if (e.cancelable) e.preventDefault();
  }

  function onPointerMove(e) {
    // 双指缩放
    if (e.touches && e.touches.length === 2) {
      var d = touchDist(e);
      if (engine.lastTouchDist > 0) {
        zoomAt(engine.width / 2, engine.height / 2, d / engine.lastTouchDist);
      }
      engine.lastTouchDist = d;
      if (e.cancelable) e.preventDefault();
      return;
    }
    var p = getEventPos(e);
    // 拖拽中
    if (engine.dragging) {
      var dx = p.x - engine.dragStartX;
      var dy = p.y - engine.dragStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) engine.dragMoved = true;
      // 拖拽就平移地图（任何模式都允许，更友好）
      engine.offsetX = engine.dragOriginX + dx;
      engine.offsetY = engine.dragOriginY + dy;
      requestRender();
    }
    // 更新悬停格子（只读模式不需要）
    if (!engine.viewOnly) {
      var g = screenToGrid(p.x, p.y);
      var hx = -1, hy = -1;
      if (g.x >= 0 && g.x < GRID_SIZE && g.y >= 0 && g.y < GRID_SIZE) {
        hx = g.x; hy = g.y;
      }
      if (hx !== engine.hoverX || hy !== engine.hoverY) {
        engine.hoverX = hx;
        engine.hoverY = hy;
        requestRender();
      }
    }
  }

  function onPointerUp(e) {
    var wasDragging = engine.dragging;
    var moved = engine.dragMoved;
    engine.dragging = false;
    engine.lastTouchDist = 0;
    // 只读模式不处理点击
    if (engine.viewOnly) return;
    // 没有真正移动 → 视为点击
    if (wasDragging && !moved) {
      var p = getEventPos(e);
      var g = screenToGrid(p.x, p.y);
      if (g.x >= 0 && g.x < GRID_SIZE && g.y >= 0 && g.y < GRID_SIZE) {
        handleCellClick(g.x, g.y);
      }
    }
  }

  function onWheel(e) {
    var delta = e.deltaY > 0 ? 0.9 : 1.1;
    var p = getEventPos(e);
    zoomAt(p.x, p.y, delta);
    if (e.cancelable) e.preventDefault();
  }

  /** 以屏幕点 (sx, sy) 为中心缩放 ratio 倍 */
  function zoomAt(sx, sy, ratio) {
    var newScale = clamp(engine.scale * ratio, 0.3, 3);
    if (newScale === engine.scale) return;
    // 保持鼠标位置对应的世界坐标不变
    var wx = (sx - engine.offsetX) / engine.scale;
    var wy = (sy - engine.offsetY) / engine.scale;
    engine.scale = newScale;
    engine.offsetX = sx - wx * newScale;
    engine.offsetY = sy - wy * newScale;
    requestRender();
  }

  // ===================================================
  // 7. 方块操作（放置 / 移除 / 撤销 / 重做）
  // ===================================================

  function handleCellClick(x, y) {
    if (engine.mode === 'place') {
      placeBlock(x, y, engine.curMatId);
    } else if (engine.mode === 'erase') {
      eraseBlock(x, y);
    }
    // move 模式不处理点击（只用于拖拽）
  }

  /** 放置方块（会扣库存；如果格子已有方块则返还旧方块） */
  function placeBlock(x, y, matId) {
    if (engine.blocks[y][x] === matId) return;
    var inv = engine.inventory[matId] || 0;
    if (inv <= 0) {
      notify('warn', '库存不足，请先到商店购买');
      return;
    }
    var oldMat = engine.blocks[y][x];
    if (oldMat) {
      engine.inventory[oldMat] = (engine.inventory[oldMat] || 0) + 1;
    }
    engine.blocks[y][x] = matId;
    engine.inventory[matId] = inv - 1;
    pushUndo({ type: 'place', x: x, y: y, old: oldMat, now: matId });
    persistInventory();
    requestRender();
  }

  /** 移除方块（返还库存） */
  function eraseBlock(x, y) {
    var oldMat = engine.blocks[y][x];
    if (!oldMat) return;
    engine.blocks[y][x] = null;
    engine.inventory[oldMat] = (engine.inventory[oldMat] || 0) + 1;
    pushUndo({ type: 'erase', x: x, y: y, old: oldMat, now: null });
    persistInventory();
    requestRender();
  }

  /** 把操作压入撤销栈（超过 50 步丢弃最旧的） */
  function pushUndo(op) {
    engine.undoStack.push(op);
    if (engine.undoStack.length > MAX_UNDO) engine.undoStack.shift();
    engine.redoStack = [];  // 新操作清空重做栈
  }

  function undo() {
    if (engine.viewOnly) return;
    var op = engine.undoStack.pop();
    if (!op) { notify('warn', '没有可撤销的操作'); return; }
    applyOp(op, true);
    engine.redoStack.push(op);
    persistInventory();
    requestRender();
    notify('info', '已撤销');
  }

  function redo() {
    if (engine.viewOnly) return;
    var op = engine.redoStack.pop();
    if (!op) { notify('warn', '没有可重做的操作'); return; }
    applyOp(op, false);
    engine.undoStack.push(op);
    persistInventory();
    requestRender();
    notify('info', '已重做');
  }

  /** 应用操作（undo 时反向恢复 old，redo 时正向变成 now） */
  function applyOp(op, isUndo) {
    var x = op.x, y = op.y;
    var cur = engine.blocks[y][x];
    var target = isUndo ? op.old : op.now;
    if (cur === target) return;
    // 当前方块返还库存
    if (cur) engine.inventory[cur] = (engine.inventory[cur] || 0) + 1;
    engine.blocks[y][x] = target;
    // 目标方块扣库存
    if (target) engine.inventory[target] = (engine.inventory[target] || 0) - 1;
  }

  // ===================================================
  // 8. 通知 / 叮咚币回调（与外部 app.js 解耦）
  // ===================================================

  function notify(type, msg) {
    var cb = engine.opts.onNotify;
    if (cb) { try { cb(type, msg); } catch (e) {} }
  }

  /** 获取当前用户的叮咚币（优先用回调，否则读 localStorage） */
  function callCoinGet() {
    var cb = engine.opts.getCoin;
    if (cb) { try { return cb() || 0; } catch (e) {} }
    try {
      var accs = JSON.parse(localStorage.getItem('dd.accounts') || '[]');
      var cur = localStorage.getItem('dd.current');
      for (var i = 0; i < accs.length; i++) {
        if (accs[i].name === cur) return (accs[i].state && accs[i].state.coin) || 0;
      }
    } catch (e) {}
    return 0;
  }

  /** 扣叮咚币（优先用回调，否则操作 localStorage） */
  function callCoinSpend(n) {
    var cb = engine.opts.spendCoin;
    if (cb) { try { return cb(n); } catch (e) { return false; } }
    try {
      var accs = JSON.parse(localStorage.getItem('dd.accounts') || '[]');
      var cur = localStorage.getItem('dd.current');
      for (var i = 0; i < accs.length; i++) {
        if (accs[i].name === cur) {
          var coin = (accs[i].state && accs[i].state.coin) || 0;
          if (coin < n) return false;
          accs[i].state.coin = coin - n;
          localStorage.setItem('dd.accounts', JSON.stringify(accs));
          return true;
        }
      }
    } catch (e) {}
    return false;
  }

  // ===================================================
  // 9. 库存与商店
  // ===================================================

  function persistInventory() {
    safeSet(INVENTORY_KEY, engine.inventory);
  }

  function loadInventory() {
    engine.inventory = safeGet(INVENTORY_KEY, {});
    // 新用户首次进入赠送一些基础材料
    if (!engine.inventory._init) {
      engine.inventory._init = 1;
      engine.inventory.grass = (engine.inventory.grass || 0) + 50;
      engine.inventory.dirt = (engine.inventory.dirt || 0) + 50;
      engine.inventory.stone = (engine.inventory.stone || 0) + 30;
      engine.inventory.wood = (engine.inventory.wood || 0) + 20;
      persistInventory();
    }
  }

  /** 购买材料（扣叮咚币，加库存），count 支持 1/5/10 */
  function buyMaterial(matId, count) {
    var mat = findMaterial(matId);
    if (!mat) { notify('warn', '材料不存在'); return false; }
    count = count || 1;
    var total = mat.price * count;
    if (callCoinGet() < total) {
      notify('warn', '叮咚币不足，需要 ' + total + ' 枚');
      return false;
    }
    if (!callCoinSpend(total)) {
      notify('warn', '扣款失败');
      return false;
    }
    engine.inventory[matId] = (engine.inventory[matId] || 0) + count;
    persistInventory();
    notify('ok', '购买成功：' + mat.name + ' x' + count);
    return true;
  }

  function getInventory() {
    return engine.inventory;
  }

  // ===================================================
  // 10. 序列化与分享码
  // ===================================================

  /** 把当前世界序列化成可保存 / 可分享的数据 */
  function serialize() {
    var blocks = [];
    for (var y = 0; y < GRID_SIZE; y++) {
      for (var x = 0; x < GRID_SIZE; x++) {
        if (engine.blocks[y][x]) {
          blocks.push({ x: x, y: y, matId: engine.blocks[y][x] });
        }
      }
    }
    return {
      scene: engine.sceneId,
      blocks: blocks,
      inventory: engine.inventory
    };
  }

  function save() {
    var data = serialize();
    safeSet(STORAGE_KEY, data);
    notify('ok', '世界已保存');
    return data;
  }

  function load() {
    var data = safeGet(STORAGE_KEY, null);
    if (!data) { notify('warn', '没有存档'); return false; }
    loadFromData(data);
    notify('ok', '已加载存档');
    return true;
  }

  /** 从数据对象恢复世界（不弹通知） */
  function loadFromData(data) {
    if (!data) return;
    if (data.scene) setScene(data.scene);
    engine.blocks = initBlocks();
    if (data.blocks) {
      for (var i = 0; i < data.blocks.length; i++) {
        var b = data.blocks[i];
        if (b.x >= 0 && b.x < GRID_SIZE && b.y >= 0 && b.y < GRID_SIZE) {
          engine.blocks[b.y][b.x] = b.matId;
        }
      }
    }
    if (data.inventory) {
      engine.inventory = data.inventory;
      persistInventory();
    }
    engine.undoStack = [];
    engine.redoStack = [];
    requestRender();
  }

  /** 生成分享码（base64 编码，只含场景和方块，不含库存） */
  function getShareCode() {
    var data = serialize();
    var mini = { s: data.scene, b: data.blocks };
    return b64Encode(JSON.stringify(mini));
  }

  /** 从分享码加载世界 */
  function loadFromShareCode(code) {
    if (!code) { notify('warn', '分享码为空'); return false; }
    var json = b64Decode(code);
    if (!json) { notify('warn', '分享码无效'); return false; }
    try {
      var mini = JSON.parse(json);
      if (!mini.s || !mini.b) { notify('warn', '分享码格式错误'); return false; }
      loadFromData({ scene: mini.s, blocks: mini.b, inventory: engine.inventory });
      notify('ok', '已从分享码加载');
      return true;
    } catch (e) {
      notify('warn', '分享码解析失败');
      return false;
    }
  }

  // ===================================================
  // 11. 场景 / 模式 / 材料切换
  // ===================================================

  function setScene(sceneId) {
    var sc = findScene(sceneId);
    if (!sc) { notify('warn', '场景不存在'); return; }
    engine.sceneId = sceneId;
    engine.scene = sc;
    // 切换场景后，如果当前材料不在解锁分类里，就切到第一个解锁材料
    var mat = findMaterial(engine.curMatId);
    if (!mat || sc.unlockCats.indexOf(mat.cat) < 0) {
      var list = getUnlockedMaterials();
      if (list.length) engine.curMatId = list[0].id;
    }
    requestRender();
  }

  function setMaterial(matId) {
    if (!findMaterial(matId)) { notify('warn', '材料不存在'); return; }
    engine.curMatId = matId;
  }

  function setMode(mode) {
    if (mode !== 'place' && mode !== 'erase' && mode !== 'move') return;
    engine.mode = mode;
  }

  // ===================================================
  // 12. 初始化 / 居中视角 / 销毁
  // ===================================================

  /** 把网格中心放到画布中心 */
  function centerView() {
    var c = toIso(GRID_SIZE / 2, GRID_SIZE / 2);
    engine.offsetX = engine.width / 2 - c.sx * engine.scale;
    engine.offsetY = engine.height / 2 - c.sy * engine.scale;
    requestRender();
  }

  function init(canvas, opts) {
    if (!canvas) return false;
    engine.canvas = canvas;
    engine.ctx = canvas.getContext('2d');
    engine.opts = opts || {};
    engine.viewOnly = false;
    engine.destroyed = false;
    // 数据初始化
    engine.blocks = initBlocks();
    loadInventory();
    setScene(engine.opts.scene || 'street');
    if (engine.opts.material) setMaterial(engine.opts.material);
    if (engine.opts.mode) setMode(engine.opts.mode);
    // 视角
    resizeCanvas();
    engine.scale = 1;
    centerView();
    // 绑定事件
    bindEvents();
    // 自动加载存档
    if (engine.opts.autoLoad !== false) {
      var data = safeGet(STORAGE_KEY, null);
      if (data) loadFromData(data);
    }
    requestRender();
    return true;
  }

  function bindEvents() {
    var cv = engine.canvas;
    cv.addEventListener('mousedown', onPointerDown);
    cv.addEventListener('mousemove', onPointerMove);
    cv.addEventListener('mouseup', onPointerUp);
    cv.addEventListener('mouseleave', onPointerUp);
    cv.addEventListener('wheel', onWheel, { passive: false });
    cv.addEventListener('touchstart', onPointerDown, { passive: false });
    cv.addEventListener('touchmove', onPointerMove, { passive: false });
    cv.addEventListener('touchend', onPointerUp);
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    window.addEventListener('resize', resizeCanvas);
  }

  function unbindEvents() {
    var cv = engine.canvas;
    if (!cv) return;
    cv.removeEventListener('mousedown', onPointerDown);
    cv.removeEventListener('mousemove', onPointerMove);
    cv.removeEventListener('mouseup', onPointerUp);
    cv.removeEventListener('mouseleave', onPointerUp);
    cv.removeEventListener('wheel', onWheel);
    cv.removeEventListener('touchstart', onPointerDown);
    cv.removeEventListener('touchmove', onPointerMove);
    cv.removeEventListener('touchend', onPointerUp);
    window.removeEventListener('resize', resizeCanvas);
  }

  function destroy() {
    if (engine.rafId) { cancelAnimationFrame(engine.rafId); engine.rafId = 0; }
    unbindEvents();
    engine.canvas = null;
    engine.ctx = null;
    engine.blocks = null;
    engine.destroyed = true;
  }

  // ===================================================
  // 13. 社交分享 / 只读浏览
  // ===================================================

  /** 分享到广场：生成一个 post 对象交给外部回调 */
  function shareToSquare() {
    var data = serialize();
    var post = {
      type: 'world',
      scene: engine.sceneId,
      sceneName: engine.scene ? engine.scene.name : '',
      sceneIcon: engine.scene ? engine.scene.icon : '',
      shareCode: getShareCode(),
      blockCount: data.blocks.length,
      time: Date.now()
    };
    var cb = engine.opts.onShare;
    if (cb) { try { cb(post); } catch (e) {} }
    notify('ok', '已分享到广场');
    return post;
  }

  /** 进入只读浏览模式（浏览他人世界） */
  function enterViewOnly(worldData) {
    if (!worldData) { notify('warn', '世界数据为空'); return false; }
    engine.viewOnly = true;
    engine.mode = 'move';
    if (worldData.scene) setScene(worldData.scene);
    engine.blocks = initBlocks();
    if (worldData.blocks) {
      for (var i = 0; i < worldData.blocks.length; i++) {
        var b = worldData.blocks[i];
        if (b.x >= 0 && b.x < GRID_SIZE && b.y >= 0 && b.y < GRID_SIZE) {
          engine.blocks[b.y][b.x] = b.matId;
        }
      }
    }
    engine.undoStack = [];
    engine.redoStack = [];
    engine.hoverX = -1;
    engine.hoverY = -1;
    centerView();
    return true;
  }

  // ===================================================
  // 14. 暴露 window.World 接口
  // ===================================================
  window.World = {
    // 核心
    init: init,
    setScene: setScene,
    setMaterial: setMaterial,
    setMode: setMode,
    undo: undo,
    redo: redo,
    save: save,
    load: load,
    getShareCode: getShareCode,
    loadFromShareCode: loadFromShareCode,
    buyMaterial: buyMaterial,
    getInventory: getInventory,
    render: requestRender,
    destroy: destroy,
    shareToSquare: shareToSquare,
    enterViewOnly: enterViewOnly,
    // 额外辅助接口（方便 UI 调用）
    serialize: serialize,
    loadFromData: loadFromData,
    getUnlockedMaterials: getUnlockedMaterials,
    getUnlockedCats: getUnlockedCats,
    exitViewOnly: function () {
      engine.viewOnly = false;
      engine.mode = 'place';
      requestRender();
    },
    isViewOnly: function () { return engine.viewOnly; },
    getScene: function () { return engine.scene; },
    getMode: function () { return engine.mode; },
    getMaterial: function () { return engine.curMatId; },
    zoomIn: function () { zoomAt(engine.width / 2, engine.height / 2, 1.2); },
    zoomOut: function () { zoomAt(engine.width / 2, engine.height / 2, 0.8); },
    resetView: function () { engine.scale = 1; centerView(); },
    GRID_SIZE: GRID_SIZE
  };

})(window);
