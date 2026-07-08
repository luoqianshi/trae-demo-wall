// =====================================================================
// TRPG Desk v2.4.37 - 客户端
// v2.4.37: 服务端 30s 重连宽限 + 客户端 Wake Lock + 指数退避重连 + 跨平台优化
// =====================================================================
'use strict';

const $ = (id) => document.getElementById(id);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// v2.4.32: 玩家 ID + 配色(与服务端保持一致)
const PLAYER_IDS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
const PLAYER_COLORS = {
  p1: { color: '#e74c3c', icon: '🔴', label: 'P1' },
  p2: { color: '#3498db', icon: '🔵', label: 'P2' },
  p3: { color: '#2ecc71', icon: '🟢', label: 'P3' },
  p4: { color: '#f39c12', icon: '🟡', label: 'P4' },
  p5: { color: '#9b59b6', icon: '🟣', label: 'P5' },
  p6: { color: '#e67e22', icon: '🟠', label: 'P6' }
};
const MAX_PLAYERS = PLAYER_IDS.length;
function isPlayerId(s) { return typeof s === 'string' && PLAYER_IDS.indexOf(s) !== -1; }
// v2.4.34: 本局游戏激活玩家(根据 state.maxPlayers 动态)
let ACTIVE_PLAYER_IDS = PLAYER_IDS.slice();
function getActivePlayerIds() {
  return ACTIVE_PLAYER_IDS;
}

// ---------- 状态 ----------
let myRole = null;            // 'host' | 'pad' | 'p1'~'p6' | null
let lastState = null;         // 服务端最新 state(已按角色裁剪)
let padFeedOpen = false;
let dragState = null;         // { kind: 'pad-piece' | 'host-item', id, offsetX, offsetY }
let hostSelectedTab = 'map';
let bgmAudioEl = null;        // 共享 BGM audio 元素
let bgmCurrentSrc = null;     // 当前正在播放的 URL(避免重复设置)
let bgmUserPaused = false;    // 用户主动暂停标记
let isReconnecting = false;   // 重连状态
let lastConnected = false;    // 上一次是否处于连接态
let idCounter = 0;            // v1.2:静态模式下的 ID 计数器
let hostSelectedMapItem = null;  // v2.0:主持人当前选中的版图项(用于缩放)
let hostNpcEditorTarget = null;  // v2.0:正在编辑的 NPC ID
let playerActiveTab = 'inbox';   // v2.0:玩家当前 tab
// v2.4.19: 选点模式 (null/mark/startP1/startP2/movePos/placeItem/placeNpc)
let hostPickMode = null;
let hostPickMovePos = null;      // 选点时缓存的 X/Y
// v2.4.48: 内联 NPC 卡片监控 - 当前正在选位置(移动玩家)的 NPC ID
let hostNpcMonitorTargetNpcId = null;

// localStorage 键
const LS_ROLE = 'trpg-desk-role';
const LS_LAST_STATE = 'trpg-desk-last-state';
const LS_STATE = 'trpg-desk-state';  // v1.2:静态模式完整状态

// ---------- 工具 ----------
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}
function fmtTime(ts) {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
function typeLabel(t) {
  return ({ text: '📝 文字', image: '🖼️ 图片', audio: '🎵 音频', video: '🎬 视频', clue: '🔍 线索', dice: '🎲 骰子' })[t] || t;
}
function isHttpUrl(s) {
  return typeof s === 'string' && /^https?:\/\//i.test(s);
}
function isHttpOrLocalUrl(s) {
  return typeof s === 'string' && (/^https?:\/\//i.test(s.trim()) || s.startsWith('/uploads/'));
}
function roleLabel(r) {
  if (r === 'host') return '主持人';
  if (r === 'pad') return 'Pad 桌面';
  if (isPlayerId(r)) return '玩家 ' + r.substring(1);
  return r;
}

// ---------- 模式检测(v1.2) ----------
// 默认走实时模式(socket.io + 服务端)。
// 静态模式仅在以下情况触发:
//  1. URL 显式带 ?static=1
//  2. file:// 协议(浏览器直接打开本地 html,无服务器可连)
// 用 ?static=0 强制走实时模式(file:// 也可)。
// 注意:Trae IDE 预览(http:///) 不会再自动进静态模式,
//      会明确报错告诉用户用 http://localhost:3000/ 或局域网 IP。
const _sp = new URLSearchParams(location.search).get('static');
const STATIC_MODE = (_sp === '1') ||
                    (location.protocol === 'file:' && _sp !== '0');

// ---------- 业务逻辑(从 server.js 移植,静态模式用) ----------
function sanitizeText(s, max) {
  if (typeof max !== 'number') max = 2000;
  if (typeof s !== 'string') return '';
  return s.trim().slice(0, max);
}
function newId() { return 'tc_' + (++idCounter) + '_' + Date.now().toString(36); }
function appendLog(s, msg) {
  s.eventLog.unshift({ id: newId(), msg, ts: Date.now() });
  if (s.eventLog.length > 80) s.eventLog.length = 80;
}
// 严格按 type 隔离 URL 字段(老 bug 根因)
function buildContentItem(p) {
  const item = {
    id: newId(),
    type: p.type,
    title: '',
    body: '',
    imageUrl: '',
    audioUrl: '',
    videoUrl: '',
    from: p.from || null,
    ts: Date.now()
  };
  if (p.type === 'text') {
    item.body = sanitizeText(p.body || '', 4000);
  } else if (p.type === 'image') {
    item.imageUrl = sanitizeText(p.body || '', 2000);
  } else if (p.type === 'audio') {
    item.audioUrl = sanitizeText(p.body || '', 2000);
  } else if (p.type === 'video') {
    item.videoUrl = sanitizeText(p.body || '', 2000);
  } else if (p.type === 'clue') {
    item.title = sanitizeText(p.title || '', 200);
    item.body = sanitizeText(p.body || '', 4000);
    item.imageUrl = sanitizeText(p.imageUrl || '', 2000);
  } else {
    item.body = sanitizeText(p.body || '', 4000);
  }
  if (p.title && p.type !== 'clue') item.title = sanitizeText(p.title, 200);
  return item;
}

// v2.4: 版图内容 (4+1 类: item/clue/event/image)
// v2.4.29: 新增 video 类(6 种)
function buildMapItem(p) {
  const type = ['item', 'clue', 'event', 'image', 'video'].includes(p.type) ? p.type : 'image';
  const item = {
    id: newId(),
    type,
    title: sanitizeText(p.title || '', 200),
    body: '',
    imageUrl: '',
    audioUrl: '',
    videoUrl: '',
    x: parseFloat(p.x) || 0.5,
    y: parseFloat(p.y) || 0.5,
    scale: 1.0,
    target: 'pad',
    ts: Date.now()
  };
  if (type === 'image') {
    item.imageUrl = sanitizeText(p.imageUrl || p.body || '', 2000);
    if (item.imageUrl) item.body = '';
    else item.body = sanitizeText(p.body || '', 4000);
  } else if (type === 'video') {
    // v2.4.29: 视频类型
    item.videoUrl = sanitizeText(p.videoUrl || p.body || '', 2000);
    if (item.videoUrl) item.body = '';
  } else if (type === 'event') {
    item.body = sanitizeText(p.body || '', 4000);
    item.imageUrl = sanitizeText(p.imageUrl || '', 2000);
    item.audioUrl = sanitizeText(p.audioUrl || '', 2000);
    item.videoUrl = sanitizeText(p.videoUrl || '', 2000);
    item.effects = p.effects || null;
    item.switchMapId = p.switchMapId || null;
    item.switchPlayer = p.switchPlayer || null;
    item.durationMs = parseInt(p.durationMs) || 0;
  } else {
    // item / clue: 正文是 body, 可选 imageUrl
    item.body = sanitizeText(p.body || '', 4000);
    item.imageUrl = sanitizeText(p.imageUrl || '', 2000);
  }
  return item;
}
// 解析骰子表达式:2D6+1D20+3
function parseDiceNotation(notation) {
  if (!notation || typeof notation !== 'string') return null;
  const clean = notation.replace(/\s+/g, '').toUpperCase();
  if (!/^[\dD+\-]+$/.test(clean)) return null;
  let modifier = 0;
  let body = clean;
  const m = clean.match(/([+\-]\d+)$/);
  if (m) {
    modifier = parseInt(m[1], 10) || 0;
    body = clean.slice(0, m.index);
  }
  if (!body) return { rolls: [], modifier, notation: clean };
  const rolls = [];
  for (const part of body.split('+')) {
    if (!part) continue;
    if (part.startsWith('-')) continue; // MVP 不支持负数骰子
    const mt = part.match(/^(\d+)?D(\d+)$/);
    if (!mt) return null;
    rolls.push({
      count: Math.min(50, parseInt(mt[1] || '1', 10)),
      sides: parseInt(mt[2], 10)
    });
  }
  if (rolls.length === 0) return null;
  return { rolls, modifier, notation: clean };
}
function rollDice(rngSpec) {
  const detail = [];
  let total = 0;
  for (const r of rngSpec.rolls) {
    const results = [];
    for (let i = 0; i < r.count; i++) {
      const v = 1 + Math.floor(Math.random() * r.sides);
      results.push(v);
    }
    const sum = results.reduce((a, b) => a + b, 0);
    detail.push({ sides: r.sides, results, sum });
    total += sum;
  }
  total += rngSpec.modifier || 0;
  return { detail, total, modifier: rngSpec.modifier || 0, notation: rngSpec.notation || '' };
}
function initialState() {
  const sDefault = {
    scriptTitle: '跑团模组',
    script: { url: '', file: '', fileName: '' },
    // v2.4.32: 多版图系统 - 6 玩家通用
    maps: [
      { id: 'map_default', name: '起始版图', url: null, bgm: null,
        startPieces: {}, items: [], npcs: [],
        pieces: {} }
    ],
    activeMapId: 'map_default',
    playerMap: {},
    // 兼容字段
    map: { url: null, updatedAt: 0 },
    mapItems: [],
    padFeed: [],
    padHighlight: null,
    bgm: null,
    pieces: {},
    players: {},
    characters: {},
    backpack: {},
    notes: {},
    npcs: [],
    turn: { order: [...PLAYER_IDS], current: 'p1', round: 1 },
    hostDiceLog: [],
    hostDicePublic: false,  // v2.1: 默认私投
    eventLog: [],
    // v2.4.18: 新字段
    mapMarker: null,
    followers: [...PLAYER_IDS],
    npcDialog: null,
    // v2.4.19: 私聊频道
    chat: {},
    online: { host: false, pad: false }
  };
  // v2.4.32: 用循环填充 6 玩家默认 slot
  for (const pid of PLAYER_IDS) {
    sDefault.maps[0].startPieces[pid] = { x: 0.5, y: 0.5 };
    sDefault.maps[0].pieces[pid] = { x: 0.5, y: 0.5, color: PLAYER_COLORS[pid].color, label: PLAYER_COLORS[pid].icon + PLAYER_COLORS[pid].label };
    sDefault.playerMap[pid] = 'map_default';
    sDefault.pieces[pid] = { x: 0.5, y: 0.5 };
    sDefault.players[pid] = { privateContent: [] };
    sDefault.characters[pid] = defaultCharacter();
    sDefault.backpack[pid] = [];
    sDefault.notes[pid] = '';
    sDefault.chat[pid] = [];
    sDefault.online[pid] = false;
  }
  return sDefault;
}
function defaultCharacter() {
  return {
    name: '', gender: '', avatar: '',
    hp: { current: 10, max: 10 },
    mp: { current: 0, max: 0 },
    san: { current: 50, max: 50 },
    attributes: [
      { id: 'str', name: '力量 STR', value: 50 },
      { id: 'con', name: '体质 CON', value: 50 },
      { id: 'siz', name: '体型 SIZ', value: 50 },
      { id: 'dex', name: '敏捷 DEX', value: 50 },
      { id: 'app', name: '外貌 APP', value: 50 },
      { id: 'int', name: '智力 INT', value: 50 },
      { id: 'pow', name: '意志 POW', value: 50 },
      { id: 'edu', name: '教育 EDU', value: 50 },
      { id: 'luc', name: '幸运 LUC', value: 50 }
    ],
    intro: ''
  };
}
function loadState() {
  try {
    const raw = localStorage.getItem(LS_STATE);
    if (!raw) return initialState();
    const s = JSON.parse(raw);
    return Object.assign(initialState(), s);
  } catch (e) {
    return initialState();
  }
}
function saveState(s) {
  try { localStorage.setItem(LS_STATE, JSON.stringify(s)); } catch (e) {}
}
// 按角色裁剪(模拟服务端 buildStateForRole)
function buildStateForRole(s, role) {
  if (role === 'host') {
    return JSON.parse(JSON.stringify({
      ...s,
      mapItems: s.mapItems,
      padFeed: s.padFeed,
      npcs: s.npcs,
      hostDiceLog: s.hostDiceLog,
      hostDicePublic: s.hostDicePublic,
      // v2.4.18: 主持人端需要看 playerMap/activeMapId/followers
      activeMapId: s.activeMapId,
      playerMap: s.playerMap,
      followers: s.followers,
      mapMarker: s.mapMarker,
      npcDialog: s.npcDialog,
      // v2.4.19: 主持人端需要看聊天频道
      chat: s.chat || { p1: [], p2: [] },
      // v2.1: 主持人端不展示玩家笔记
      players: {
        p1: {
          privateContent: s.players.p1.privateContent,
          character: s.characters.p1,
          backpack: s.backpack.p1
        },
        p2: {
          privateContent: s.players.p2.privateContent,
          character: s.characters.p2,
          backpack: s.backpack.p2
        }
      }
    }));
  }
  if (role === 'pad') {
    // v2.4.18: pad 端用 activeMap 的 BGM
    const activeMap = s.maps.find(m => m.id === s.activeMapId) || s.maps[0];
    return {
      scriptTitle: s.scriptTitle,
      map: s.map,
      mapItems: s.mapItems,
      padFeed: s.padFeed,
      padHighlight: s.padHighlight,
      bgm: activeMap && activeMap.bgm ? activeMap.bgm : null,
      npcs: s.npcs,
      turn: s.turn,
      pieces: s.pieces,
      publicCharacters: {
        p1: { name: s.characters.p1.name, avatar: s.characters.p1.avatar, hp: { ...s.characters.p1.hp } },
        p2: { name: s.characters.p2.name, avatar: s.characters.p2.avatar, hp: { ...s.characters.p2.hp } }
      },
      // v2.4.18: pad 端需要知道 activeMapId + playerMap + mapMarker + npcDialog
      activeMapId: s.activeMapId,
      activeMapName: activeMap ? activeMap.name : '',
      playerMap: s.playerMap,
      mapMarker: s.mapMarker,
      npcDialog: s.npcDialog,
      online: s.online
    };
  }
  if (isPlayerId(role)) {
    // v2.4.18: 玩家用所在版图的 BGM
    const myMap = s.maps.find(m => m.id === s.playerMap[role]) || s.maps[0];
    // v2.4.32: 动态生成 publicCharacters(6 个玩家)
    const publicCharacters = {};
    for (const pid of PLAYER_IDS) {
      const ch = s.characters[pid];
      publicCharacters[pid] = { name: ch.name, avatar: ch.avatar, hp: { ...ch.hp } };
    }
    return {
      scriptTitle: s.scriptTitle,
      character: s.characters[role],
      backpack: s.backpack[role],
      note: s.notes[role],
      // v2.2: 玩家端需要看到版图(可移动棋子 / 拾取线索 / 触发NPC)
      map: s.map,
      mapItems: s.mapItems,
      pieces: s.pieces,
      npcs: s.npcs,
      publicCharacters: publicCharacters,
      myPiece: s.pieces[role],
      privateContent: s.players[role].privateContent,
      bgm: myMap && myMap.bgm ? myMap.bgm : null,
      currentMapId: s.playerMap[role],
      currentMapName: myMap ? myMap.name : '',
      turn: s.turn,
      // v2.4.19: 玩家端需要看到自己的聊天频道
      chat: { [role]: (s.chat && s.chat[role]) || [] },
      // v2.4.19: 玩家端需要看自己的 role 以便私聊渲染
      role: role,
      online: s.online
    };
  }
  return s;
}

// ---------- Toast ----------
let toastTimer = null;
function showToast(msg, kind) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast' + (kind === 'error' ? ' error' : '');
  t.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.display = 'none'; }, 2400);
}

// v2.4.30: 预加载图库 - 主持人进入版图 tab 时,后台预取图库数据
//   避免点击图库按钮时还要等服务器响应
let imageLibraryPreloaded = false;
function preloadImageLibrary() {
  if (imageLibraryPreloaded) return;
  if (!socket || !socket.connected) return;
  // 静默预取 - 不显示 modal
  socket.emit('host:listImageLibrary', { q: '', type: 'all', mediaType: 'all' });
  imageLibraryPreloaded = true;
}
// v2.4.30: 修复图库无法加载问题 - 加载状态、错误处理、预加载
let imageLibraryData = [];
let imageLibraryTarget = 'hostAddBody';  // 选中的资源填到哪个 input
let imageLibraryMediaType = 'all';      // v2.4.29: all / image / video
let imageLibraryLoading = false;        // v2.4.30: 加载状态
let imageLibraryLastError = null;       // v2.4.30: 上次错误

function openImageLibrary(targetId, mediaType) {
  imageLibraryTarget = targetId || 'hostAddBody';
  imageLibraryMediaType = mediaType || 'all';
  const modal = $('imageLibraryModal');
  if (modal) modal.style.display = 'flex';
  // 清空搜索框
  const s = $('imageLibrarySearch');
  if (s) s.value = '';
  const ty = $('imageLibraryType');
  if (ty) ty.value = 'all';
  // v2.4.29: 同步媒体类型过滤器
  const mt = $('imageLibraryMediaType');
  if (mt) mt.value = imageLibraryMediaType;
  // v2.4.30: 立即显示加载状态
  showImageLibraryLoading();
  requestImageLibrary();
}

function showImageLibraryLoading() {
  imageLibraryLoading = true;
  imageLibraryLastError = null;
  const grid = $('imageLibraryGrid');
  const empty = $('imageLibraryEmpty');
  const countEl = $('imageLibraryCount');
  if (empty) {
    empty.style.display = 'block';
    empty.innerHTML = '⏳ 加载中,请稍候…';
    empty.style.color = '#888';
  }
  if (countEl) countEl.textContent = '加载中…';
  if (grid) grid.innerHTML = '';
}

function showImageLibraryError(msg) {
  imageLibraryLoading = false;
  imageLibraryLastError = msg;
  const empty = $('imageLibraryEmpty');
  const countEl = $('imageLibraryCount');
  if (empty) {
    empty.style.display = 'block';
    empty.innerHTML = '❌ ' + msg + '<br><br><button class="host-btn" onclick="requestImageLibrary()">🔄 重试</button>';
    empty.style.color = '#c0392b';
  }
  if (countEl) countEl.textContent = '加载失败';
}

function requestImageLibrary() {
  showImageLibraryLoading();
  // v2.4.30: 检查 socket 状态
  if (!socket || !socket.connected) {
    showImageLibraryError('未连接到服务器 - 请先在终端运行 "node server.js"');
    return;
  }
  const payload = {
    q: ($('imageLibrarySearch') && $('imageLibrarySearch').value || '').trim(),
    type: ($('imageLibraryType') && $('imageLibraryType').value || 'all'),
    mediaType: ($('imageLibraryMediaType') && $('imageLibraryMediaType').value || imageLibraryMediaType || 'all')
  };
  console.log('[imageLibrary] 发送请求:', payload);
  socket.emit('host:listImageLibrary', payload);
}
function renderImageLibrary(items) {
  imageLibraryLoading = false;
  imageLibraryData = items || [];
  const grid = $('imageLibraryGrid');
  const empty = $('imageLibraryEmpty');
  const countEl = $('imageLibraryCount');
  if (!grid) return;
  grid.innerHTML = '';
  if (!items || items.length === 0) {
    if (empty) {
      empty.style.display = 'block';
      empty.style.color = '#888';
      empty.innerHTML = '📭 媒体库为空<br><br><small style="color:#999;">请先上传图片/视频,或添加一个 item 引用了媒体 URL</small>';
    }
    if (countEl) countEl.textContent = '0 个';
    console.log('[imageLibrary] 媒体库为空 - 没有匹配的资源');
    return;
  }
  if (empty) empty.style.display = 'none';
  if (countEl) countEl.textContent = items.length + ' 个';
  for (const it of items) {
    const div = document.createElement('div');
    div.className = 'image-library-item';
    div.style.cssText = 'position:relative;cursor:pointer;border:1px solid #ddd;border-radius:6px;overflow:hidden;background:#f8f8f8;aspect-ratio:1;display:flex;align-items:center;justify-content:center;';
    div.title = (it.displayName || it.name) + '\n' + it.url;
    // v2.4.29: 视频用 video 标签预览,图片用 img
    if (it.mediaType === 'video') {
      const v = document.createElement('video');
      v.src = it.url;
      v.muted = true;
      v.playsInline = true;
      v.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      v.onerror = () => { v.style.display = 'none'; div.textContent = '❓'; div.style.fontSize = '24px'; };
      div.appendChild(v);
      // 视频角标
      const playIcon = document.createElement('div');
      playIcon.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:24px;background:rgba(0,0,0,0.55);border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;pointer-events:none;';
      playIcon.textContent = '▶';
      div.appendChild(playIcon);
    } else {
      const img = document.createElement('img');
      img.src = it.url;
      img.alt = it.displayName || it.name;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => { img.style.display = 'none'; div.textContent = '❓'; div.style.fontSize = '24px'; };
      div.appendChild(img);
    }
    // 角标(类型)
    const badge = document.createElement('div');
    badge.style.cssText = 'position:absolute;top:2px;left:2px;background:rgba(0,0,0,0.65);color:#fff;font-size:10px;padding:1px 4px;border-radius:3px;';
    const typeLabelMap = { uploaded: '📁', item: '📦', 'npc-avatar': '👤', map: '🗺️' };
    const icon = it.mediaType === 'video' ? '🎬' : (typeLabelMap[it.type] || '🖼️');
    badge.textContent = icon;
    div.appendChild(badge);
    // 名称
    const label = document.createElement('div');
    label.style.cssText = 'position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.65);color:#fff;font-size:10px;padding:2px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    label.textContent = it.displayName || it.name;
    div.appendChild(label);
    div.addEventListener('click', () => {
      const target = $(imageLibraryTarget);
      if (target) target.value = it.url;
      const kind = it.mediaType === 'video' ? '视频' : '图片';
      showToast('已选择' + kind + ': ' + (it.displayName || it.name), 'info');
      $('imageLibraryModal').style.display = 'none';
    });
    grid.appendChild(div);
  }
}

// ---------- v2.4.29: 角色模板 ----------
// 用于玩家手机端角色卡 tab: 一键应用预设模板(COC/DND)
let characterTemplatesData = [];
let characterTemplatesGame = 'all';
function openCharacterTemplates(game) {
  characterTemplatesGame = game || 'all';
  const sel = $('charTemplateGameSel');
  if (sel) sel.value = characterTemplatesGame;
  const m = $('charTemplateModal');
  if (m) m.style.display = 'flex';
  requestCharacterTemplates();
}
function requestCharacterTemplates() {
  socket.emit('player:listCharacterTemplates', { game: characterTemplatesGame });
}
function renderCharacterTemplates(items) {
  characterTemplatesData = items || [];
  const grid = $('charTemplateGrid');
  const empty = $('charTemplateEmpty');
  if (!grid) return;
  grid.innerHTML = '';
  if (!items || items.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  for (const tpl of items) {
    const card = document.createElement('div');
    card.className = 'char-template-card';
    const gameColor = tpl.game === 'COC' ? '#8e44ad' : '#e67e22';
    card.style.cssText = `position:relative;background:#fff;border:2px solid ${gameColor};border-radius:10px;padding:12px;cursor:pointer;display:flex;flex-direction:column;gap:6px;transition:transform 0.15s,box-shadow 0.15s;`;
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:28px;">${escapeHtml(tpl.icon || '👤')}</span>
        <div style="flex:1;">
          <div style="font-weight:bold;font-size:15px;color:${gameColor};">${escapeHtml(tpl.name)}</div>
          <div style="font-size:11px;color:#888;">${escapeHtml(tpl.game)} · ${escapeHtml(tpl.gender || '?')}</div>
        </div>
      </div>
      <div style="display:flex;gap:6px;font-size:11px;">
        <span style="color:#e74c3c;">❤️ ${tpl.hp.current}</span>
        <span style="color:#3498db;">🔵 ${tpl.mp.current}</span>
        <span style="color:#9b59b6;">🧠 ${tpl.san.current}</span>
      </div>
      <div style="font-size:11px;color:#666;line-height:1.3;max-height:48px;overflow:hidden;">${escapeHtml((tpl.intro || '').slice(0, 60))}${(tpl.intro || '').length > 60 ? '…' : ''}</div>
      <div style="font-size:10px;color:#999;">📊 ${tpl.attributes.length} 个属性</div>
    `;
    card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; card.style.boxShadow = ''; });
    card.addEventListener('click', () => applyCharacterTemplate(tpl));
    grid.appendChild(card);
  }
}
function applyCharacterTemplate(tpl) {
  if (!confirm(`应用模板「${tpl.icon} ${tpl.name}」?\n将覆盖当前角色卡的名称/性别/HP/MP/SAN/属性(头像不变)。`)) return;
  socket.emit('player:applyCharacterTemplate', { templateId: tpl.id });
  $('charTemplateModal').style.display = 'none';
}
function setReconnectBanner(state, msg) {
  const banner = $('reconnectBanner');
  const text = $('reconnectText');
  if (state === 'hidden') {
    banner.style.display = 'none';
    return;
  }
  banner.style.display = 'block';
  if (state === 'reconnecting') {
    banner.classList.remove('connected');
    text.textContent = msg || '⚠️ 与服务器断开,正在重连…';
  } else if (state === 'connected') {
    banner.classList.add('connected');
    text.textContent = msg || '✅ 已重新连接';
    setTimeout(() => { banner.style.display = 'none'; }, 1500);
  }
}

// ---------- 文件上传 ----------
async function uploadFile(file) {
  // 静态模式:用 FileReader 把文件转成 data: URL(本机内嵌,无法跨设备共享)
  if (STATIC_MODE) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          url: reader.result,
          mimetype: file.type || '',
          size: file.size,
          originalName: file.name,
          _staticMode: true
        });
      };
      reader.onerror = () => {
        showToast('❌ 读取文件失败', 'error');
        reject(new Error('FileReader failed'));
      };
      reader.readAsDataURL(file);
    });
  }
  // 正常模式:走 /upload
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch('/upload', { method: 'POST', body: fd });
    if (!res.ok) {
      let err = '上传失败 (HTTP ' + res.status + ')';
      try { const j = await res.json(); err = j.error || err; } catch (e) {}
      throw new Error(err);
    }
    const data = await res.json();
    return { url: data.url, mimetype: data.mimetype || '', size: data.size, originalName: data.originalName };
  } catch (e) {
    // 区分网络错误和服务端错误
    if (e instanceof TypeError && /fetch|network/i.test(e.message)) {
      showToast('❌ 上传失败:无法连接到服务器,请确认 node server.js 已启动', 'error');
      throw new Error('无法连接到 /upload');
    }
    showToast('❌ ' + e.message, 'error');
    throw e;
  }
}

// 根据 MIME type 推断出 content type
function detectTypeFromMime(mime) {
  if (!mime) return 'text';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  return 'text';
}

function bindUploadButtons() {
  // 通用上传按钮:点击 [data-target] 关联的 input
  $$('button[data-target]').forEach(btn => {
    if (btn.dataset.uploadBound) return;
    // 跳过 v2.4 新加的事件上传按钮(它们有专用 handler)
    if (btn.dataset.target === 'hostAddBody' ||
        btn.dataset.target === 'hostAddEventImage' ||
        btn.dataset.target === 'hostAddEventVideo' ||
        btn.dataset.target === 'hostAddEventAudio') {
      btn.dataset.uploadBound = '1';
      return;
    }
    btn.dataset.uploadBound = '1';
    btn.addEventListener('click', async () => {
      const targetId = btn.dataset.target;
      const fileInputId = btn.id.replace('UploadBtn', 'File');
      const fileInput = $(fileInputId);
      if (!fileInput) return;
      fileInput.onchange = null;
      fileInput.onchange = async () => {
        const f = fileInput.files && fileInput.files[0];
        if (!f) return;
        const origText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⏳ 上传中…';
        try {
          const result = await uploadFile(f);
          const target = $(targetId);
          if (target) {
            target.value = result.url;
          }
          // 自动根据文件 MIME 类型设置 type 下拉框(在按钮同一行的 select)
          const row = btn.closest('.host-row');
          if (row) {
            const sel = row.querySelector('select');
            if (sel) {
              const t = detectTypeFromMime(result.mimetype);
              if (t !== 'text') sel.value = t;
            }
          }
          showToast('✅ 上传成功:' + f.name);
        } catch (e) {
          // 已 toast
        } finally {
          btn.disabled = false;
          btn.textContent = origText;
          fileInput.value = '';
        }
      };
      fileInput.click();
    });
  });
  // 特殊的 hostMapUploadBtn(版图专用的 input)
  // v2.4.30: 版图背景支持图片和视频
  const mapUploadBtn = $('hostMapUploadBtn');
  if (mapUploadBtn && !mapUploadBtn.dataset.bound) {
    mapUploadBtn.dataset.bound = '1';
    mapUploadBtn.addEventListener('click', () => {
      const f = $('hostMapFile');
      f.onchange = async () => {
        const file = f.files && f.files[0];
        if (!file) return;
        mapUploadBtn.disabled = true;
        mapUploadBtn.textContent = '⏳ 上传中…';
        try {
          // v2.4.30: 客户端校验 - 允许 image/* 和 video/*
          if (!file.type || (!file.type.startsWith('image/') && !file.type.startsWith('video/'))) {
            showToast('⚠️ 请选择图片或视频文件(jpg/png/mp4/webm 等),当前类型: ' + (file.type || '未知'), 'error');
            console.error('[map upload] 客户端拒绝非媒体:', file.name, file.type);
            return;
          }
          if (file.size > 50 * 1024 * 1024) {
            showToast('⚠️ 文件超过 50MB 上限,当前 ' + Math.round(file.size / 1024 / 1024) + 'MB', 'error');
            return;
          }
          const result = await uploadFile(file);
          // 二次校验:服务端 mimetype - 接受 image/* 和 video/*
          if (!result.mimetype || (!result.mimetype.startsWith('image/') && !result.mimetype.startsWith('video/'))) {
            showToast('⚠️ 服务端判定为非媒体,拒绝设为版图: ' + (result.mimetype || ''), 'error');
            console.error('[map upload] 服务端 mimetype 异常:', result.mimetype);
            return;
          }
          $('hostMapUrl').value = result.url;
          showToast('✅ 上传成功,点击"设为版图"应用');
        } catch (e) {
          console.error('[map upload] 失败:', e);
          showToast('❌ 上传失败: ' + (e.message || e), 'error');
        } finally {
          mapUploadBtn.disabled = false;
          mapUploadBtn.textContent = '📁 上传';
          f.value = '';
        }
      };
      f.click();
    });
  }
  // BGM 专用上传
  const bgmUploadBtn = $('hostBgmUploadBtn');
  if (bgmUploadBtn && !bgmUploadBtn.dataset.bound) {
    bgmUploadBtn.dataset.bound = '1';
    bgmUploadBtn.addEventListener('click', () => {
      const f = $('hostBgmFile');
      f.onchange = async () => {
        const file = f.files && f.files[0];
        if (!file) return;
        bgmUploadBtn.disabled = true;
        bgmUploadBtn.textContent = '⏳ 上传中…';
        try {
          // 客户端预校验
          if (!file.type || !file.type.startsWith('audio/')) {
            showToast('⚠️ 请选择音频文件(mp3/wav/ogg 等),当前类型: ' + (file.type || '未知'), 'error');
            return;
          }
          if (file.size > 50 * 1024 * 1024) {
            showToast('⚠️ 音频文件超过 50MB', 'error');
            return;
          }
          const result = await uploadFile(file);
          if (!result.mimetype || !result.mimetype.startsWith('audio/')) {
            showToast('⚠️ 服务端判定为非音频,拒绝设为 BGM', 'error');
            return;
          }
          $('hostBgmUrl').value = result.url;
          showToast('✅ 上传成功,点击"开始播放"应用');
        } catch (e) {
          console.error('[bgm upload] 失败:', e);
          // uploadFile 已经 toast,这里只记录
        } finally {
          bgmUploadBtn.disabled = false;
          bgmUploadBtn.textContent = '📁 上传';
          f.value = '';
        }
      };
      f.click();
    });
  }
}

// ---------- 骰子模态框 ----------
function openDiceModal() {
  $('diceModal').style.display = 'flex';
  setTimeout(() => $('diceNotation')?.focus(), 200);
}
function closeDiceModal() {
  $('diceModal').style.display = 'none';
}
function bindDiceEvents() {
  if ($('diceClose').dataset.bound) return;
  $('diceClose').dataset.bound = '1';
  $('diceClose').addEventListener('click', closeDiceModal);
  $('diceBackdrop').addEventListener('click', closeDiceModal);
  // 预设骰子按钮
  $$('.dice-btn[data-sides]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sides = parseInt(btn.dataset.sides, 10);
      if (Number.isFinite(sides)) {
        socket.emit('player:rollDice', { rolls: [{ count: 1, sides }] });
        closeDiceModal();
      }
    });
  });
  // 自定义
  $('diceRollBtn').addEventListener('click', () => {
    const notation = $('diceNotation').value.trim();
    if (!notation) return showToast('请输入骰子表达式', 'error');
    socket.emit('player:rollDice', { notation });
    closeDiceModal();
  });
  $('diceNotation').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('diceRollBtn').click();
  });
  // 玩家 header 骰子按钮
  const pDice = $('playerDiceBtn');
  if (pDice && !pDice.dataset.bound) {
    pDice.dataset.bound = '1';
    pDice.addEventListener('click', openDiceModal);
  }
  // ESC 关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('diceModal').style.display === 'flex') closeDiceModal();
  });
}

// ---------- BGM 播放器 ----------
function initBgm() {
  if (bgmAudioEl) return;
  bgmAudioEl = $('bgmAudio');
  $('bgmToggle').addEventListener('click', () => {
    if (!bgmAudioEl.src) return;
    if (bgmAudioEl.paused) {
      bgmAudioEl.play().catch(() => showToast('⚠️ 播放失败,请再次点击', 'error'));
      bgmUserPaused = false;
    } else {
      bgmAudioEl.pause();
      bgmUserPaused = true;
    }
  });
  bgmAudioEl.addEventListener('play', () => { $('bgmToggle').textContent = '⏸'; });
  bgmAudioEl.addEventListener('pause', () => { $('bgmToggle').textContent = '▶'; });
}

function syncBgm(bgm) {
  if (!bgmAudioEl) initBgm();
  const indicator = $('bgmIndicator');
  // v2.2: BGM 仅在 pad 端播放,其他端不响
  const isPad = myRole === 'pad';
  if (!isPad) {
    // 主持人/玩家端:不播放,清空 src
    if (bgmAudioEl.src) {
      bgmAudioEl.pause();
      bgmAudioEl.removeAttribute('src');
      bgmCurrentSrc = null;
    }
    if (indicator) indicator.style.display = 'none';
    return;
  }
  if (!bgm) {
    bgmAudioEl.pause();
    bgmAudioEl.removeAttribute('src');
    bgmCurrentSrc = null;
    if (indicator) indicator.style.display = 'none';
    return;
  }
  // 切换 URL
  if (bgmCurrentSrc !== bgm.url) {
    bgmAudioEl.src = bgm.url;
    bgmCurrentSrc = bgm.url;
  }
  bgmAudioEl.volume = bgm.volume != null ? bgm.volume : 0.5;
  $('bgmName').textContent = bgm.title || '背景音乐';
  if (indicator) indicator.style.display = 'flex';
  // v2.2: 主持人暂停了就不播放
  if (bgm.paused) {
    bgmAudioEl.pause();
    $('bgmToggle').textContent = '▶';
    return;
  }
  // 尝试播放(autoplay 可能在某些浏览器失败,需要用户交互)
  if (!bgmUserPaused) {
    const playPromise = bgmAudioEl.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(() => {
        // 静默失败:用户首次访问需交互,显示提示
        $('bgmToggle').textContent = '▶';
      });
    }
  }
}


// =====================================================================
// v1.2 Socket - 双模式(实时 / 静态演示)
// =====================================================================
let socket;

// 静态模式 mock 状态
const mockSocket = {
  id: 'mock-' + Math.random().toString(36).slice(2, 8),
  connected: true,
  _handlers: {},
  on(event, cb) {
    (this._handlers[event] = this._handlers[event] || []).push(cb);
    if (event === 'state') {
      // 注册时立即触发一次当前 state
      const s = loadState();
      setTimeout(() => cb(buildStateForRole(s, myRole)), 0);
    }
  },
  emit(event, data) {
    if (event === 'join' || event === 'leave' || event === 'pad:closeFeed' ||
        event === 'pad:closeHighlight' || event === 'pad:movePiece' ||
        event === 'pad:nextTurn' ||
        event === 'host:setMap' || event === 'host:setScriptTitle' ||
        event === 'host:setScript' ||
        event === 'host:sendToPad' || event === 'host:sendToPlayer' ||
        event === 'host:sendClue' || event === 'host:pinClueAsCard' ||
        event === 'host:pinFeed' ||
        event === 'host:addMapItem' || event === 'host:deleteMapItem' ||
        event === 'host:moveMapItem' || event === 'host:scaleMapItem' ||
        event === 'host:setBgm' || event === 'host:stopBgm' ||
        event === 'host:pauseBgm' || event === 'host:resumeBgm' ||
        event === 'host:setBgmVolume' ||
        event === 'host:log' || event === 'host:clearAll' ||
        event === 'host:shutdown' || event === 'host:restart' ||
        event === 'host:nextTurn' || event === 'host:prevTurn' || event === 'host:resetTurn' ||
        event === 'host:addNpc' || event === 'host:updateNpc' ||
        event === 'host:moveNpc' || event === 'host:deleteNpc' ||
        event === 'host:addNpcDialogue' || event === 'host:deleteNpcDialogue' ||
        event === 'host:rollDice' || event === 'host:toggleDiceVisible' ||
        event === 'host:setDicePublic' ||
        event === 'host:deductHp' ||
        event === 'host:adjustStat' ||
        event === 'host:addToPlayerBackpack' ||
        // v2.4 多版图系统
        event === 'host:addMap' || event === 'host:deleteMap' || event === 'host:renameMap' ||
        event === 'host:switchMap' || event === 'host:setMapUrl' ||
        event === 'host:movePlayerToMap' || event === 'host:triggerEvent' ||
        event === 'host:exportMaps' || event === 'host:importMaps' ||
        // v2.4.18
        event === 'host:setMapBgm' || event === 'host:toggleFollower' ||
        event === 'host:setMapStartPiece' || event === 'host:markPiece' ||
        event === 'pad:nextNpcDialogue' || event === 'pad:closeNpcDialog' ||
        // v2.4 玩家端
        event === 'player:triggerEvent' ||
        event === 'player:rollDice' ||
        event === 'player:setCharacter' || event === 'player:setNote' ||
        event === 'player:pickupClue' || event === 'player:discardClue' ||
        event === 'player:sendClueToPlayer' || event === 'player:npcInteract' ||
        // v2.4.28: 图库
        event === 'host:listImageLibrary' ||
        // v2.4.29: 角色模板
        event === 'host:listCharacterTemplates' ||
        event === 'player:listCharacterTemplates' ||
        event === 'player:applyCharacterTemplate') {
      mockApplyEvent(event, data || {});
    }
  },
  disconnect() {},  // mock 不实现
};

function mockFire(event, payload) {
  (mockSocket._handlers[event] || []).forEach(cb => {
    try { cb(payload); } catch (e) { console.error('handler err:', e); }
  });
}

function mockApplyEvent(event, data) {
  const s = loadState();
  let didChange = false;
  switch (event) {
    case 'join': {
      const role = data.role;
      if (role && ['host', 'pad', 'p1', 'p2'].includes(role)) {
        s.online[role] = true;
        didChange = true;
      }
      break;
    }
    case 'leave': {
      if (myRole && s.online[myRole] !== undefined) {
        s.online[myRole] = false;
        didChange = true;
      }
      break;
    }
    case 'pad:closeFeed': {
      const before = s.padFeed.length;
      s.padFeed = s.padFeed.filter(f => f.id !== data.feedId);
      if (s.padFeed.length !== before) didChange = true;
      break;
    }
    case 'pad:closeHighlight': {
      if (s.padHighlight) { s.padHighlight = null; didChange = true; }
      break;
    }
    case 'pad:movePiece': {
      if (s.pieces[data.playerId]) {
        s.pieces[data.playerId].x = data.x;
        s.pieces[data.playerId].y = data.y;
        didChange = true;
      }
      break;
    }
    case 'host:setMap': {
      // v2.4: setMapUrl 作用于 activeMap
      const activeMap = s.maps.find(m => m.id === s.activeMapId) || s.maps[0];
      activeMap.url = sanitizeText(data.url || '', 2000) || null;
      s.map = { url: activeMap.url, updatedAt: Date.now() };
      appendLog(s, '主持人设置了版图背景');
      didChange = true;
      break;
    }
    case 'host:setMapUrl': {
      const m = s.maps.find(x => x.id === data.mapId) || s.maps.find(x => x.id === s.activeMapId) || s.maps[0];
      m.url = sanitizeText(data.url || '', 2000) || null;
      if (m.id === s.activeMapId) s.map = { url: m.url, updatedAt: Date.now() };
      didChange = true;
      break;
    }
    case 'host:addMap': {
      const newMap = {
        id: 'map_' + newId().slice(3),
        name: sanitizeText(data.name || '', 30) || ('版图 ' + (s.maps.length + 1)),
        url: null,
        bgm: null,
        startPieces: { p1: { x: 0.5, y: 0.5 }, p2: { x: 0.5, y: 0.5 } },
        items: [], npcs: [],
        pieces: {
          p1: { x: 0.5, y: 0.5, color: '#e74c3c', label: '🔴P1' },
          p2: { x: 0.5, y: 0.5, color: '#3498db', label: '🔵P2' }
        }
      };
      s.maps.push(newMap);
      appendLog(s, '主持人添加了版图: ' + newMap.name);
      didChange = true;
      break;
    }
    case 'host:deleteMap': {
      if (s.maps.length <= 1) break;
      const idx = s.maps.findIndex(m => m.id === data.mapId);
      if (idx < 0) break;
      const name = s.maps[idx].name;
      s.maps.splice(idx, 1);
      for (const pid of ['p1', 'p2']) {
        if (s.playerMap[pid] === data.mapId) s.playerMap[pid] = s.maps[0].id;
      }
      if (s.activeMapId === data.mapId) s.activeMapId = s.maps[0].id;
      // 同步 compat 字段
      const active = s.maps.find(m => m.id === s.activeMapId) || s.maps[0];
      s.map = { url: active.url, updatedAt: Date.now() };
      s.mapItems = active.items;
      s.npcs = active.npcs;
      s.pieces = active.pieces;
      appendLog(s, '主持人删除了版图: ' + name);
      didChange = true;
      break;
    }
    case 'host:renameMap': {
      const m = s.maps.find(x => x.id === data.mapId);
      if (m) m.name = sanitizeText(data.name || '', 30) || m.name;
      didChange = true;
      break;
    }
    case 'host:switchMap': {
      const m = s.maps.find(x => x.id === data.mapId);
      if (!m) break;
      s.activeMapId = m.id;
      // 同步 compat 字段
      s.map = { url: m.url, updatedAt: Date.now() };
      s.mapItems = m.items;
      s.npcs = m.npcs;
      s.pieces = m.pieces;
      // v2.4.32: 接收 followers 列表(主持人弹框选中的) - 6 玩家通用
      const followers = Array.isArray(data.followers) ? data.followers.filter(p => isPlayerId(p)) : [];
      if (!m._playerEverSet) m._playerEverSet = {};
      for (const pid of followers) {
        s.playerMap[pid] = m.id;
        if (!m.pieces[pid]) m.pieces[pid] = { x: 0.5, y: 0.5, color: PLAYER_COLORS[pid].color, label: PLAYER_COLORS[pid].icon + PLAYER_COLORS[pid].label };
        if (!m._playerEverSet[pid] && m.startPieces && m.startPieces[pid]) {
          m.pieces[pid].x = Math.max(0, Math.min(1, m.startPieces[pid].x));
          m.pieces[pid].y = Math.max(0, Math.min(1, m.startPieces[pid].y));
          m._playerEverSet[pid] = true;
        }
      }
      // 切版图后旧标记清除
      s.mapMarker = null;
      appendLog(s, '主持人切换到版图: ' + m.name);
      didChange = true;
      break;
    }
    case 'host:movePlayerToMap': {
      const pid = data.playerId;
      if (!isPlayerId(pid)) break;
      const m = s.maps.find(x => x.id === data.mapId);
      if (!m) break;
      s.playerMap[pid] = m.id;
      if (!m.pieces[pid]) m.pieces[pid] = { x: 0.5, y: 0.5, color: PLAYER_COLORS[pid].color, label: PLAYER_COLORS[pid].icon + PLAYER_COLORS[pid].label };
      if (Number.isFinite(parseFloat(data.x))) m.pieces[pid].x = Math.max(0, Math.min(1, parseFloat(data.x)));
      if (Number.isFinite(parseFloat(data.y))) m.pieces[pid].y = Math.max(0, Math.min(1, parseFloat(data.y)));
      didChange = true;
      break;
    }
    case 'host:triggerEvent': {
      // mock 端:把事件从 activeMap 移除 + 给目标玩家加入线索栏
      const activeMap = s.maps.find(m => m.id === s.activeMapId) || s.maps[0];
      const ev = activeMap.items.find(it => it.id === data.itemId && it.type === 'event');
      if (!ev) break;
      const targetPlayer = data.targetPlayer || s.turn.current || 'p1';
      // 应用 effects
      if (ev.effects && s.characters[targetPlayer]) {
        const c = s.characters[targetPlayer];
        for (const k of ['hp', 'mp', 'san']) {
          const delta = parseInt(ev.effects[k]);
          if (Number.isFinite(delta) && delta !== 0 && c[k] && Number.isFinite(c[k].max)) {
            c[k].current = Math.max(0, Math.min(c[k].max, c[k].current + delta));
          }
        }
      }
      // 切版图
      if (ev.switchMapId) {
        const targetMap = s.maps.find(m => m.id === ev.switchMapId);
        if (targetMap) {
          const switchTo = ev.switchPlayer || targetPlayer;
          if (switchTo === 'p1' || switchTo === 'p2') s.playerMap[switchTo] = targetMap.id;
        }
      }
      // 一次性事件 → 移除
      activeMap.items = activeMap.items.filter(it => it.id !== ev.id);
      s.mapItems = activeMap.items;
      // v2.4.26: 事件信息(任何类型)都进入 pad 公开信息流,from='kp'
      // 但 videoUrl/audioUrl 不放在 feedItem 中(已在高亮弹窗播放,避免重复)
      if (ev.body || ev.imageUrl || ev.audioUrl || ev.videoUrl) {
        const feedItem = {
          id: newId(),
          type: 'clue',
          title: ev.title || '事件',
          body: ev.body || '',
          imageUrl: ev.imageUrl || '',
          from: 'kp',
          ts: Date.now()
        };
        s.padFeed.unshift(feedItem);
        if (s.padFeed.length > 30) s.padFeed.length = 30;
      }
      // v2.4.24: 玩家手机端事件高亮弹窗(视频/音频自动播放)
      if (myRole === targetPlayer || (targetPlayer === 'p1' && myRole === 'p1') || (targetPlayer === 'p2' && myRole === 'p2')) {
        showPlayerEventHighlight({
          id: ev.id,
          title: ev.title || '?',
          body: ev.body || '',
          imageUrl: ev.imageUrl || '',
          audioUrl: ev.audioUrl || '',
          videoUrl: ev.videoUrl || '',
          effects: ev.effects || null
        });
      }
      didChange = true;
      break;
    }
    case 'host:setMapBgm': {
      const activeMap = s.maps.find(m => m.id === s.activeMapId) || s.maps[0];
      if (data.clear) {
        activeMap.bgm = null;
        s.bgm = null;
      } else {
        activeMap.bgm = {
          url: sanitizeText(data.url || '', 2000),
          title: sanitizeText(data.title || '背景音乐', 100),
          volume: Math.max(0, Math.min(1, parseFloat(data.volume) || 0.5)),
          ts: Date.now()
        };
        s.bgm = activeMap.bgm;
      }
      didChange = true;
      break;
    }
    case 'host:toggleFollower': {
      if (!Array.isArray(s.followers)) s.followers = [...PLAYER_IDS];
      const pid = data.playerId;
      const idx = s.followers.indexOf(pid);
      if (idx >= 0) s.followers.splice(idx, 1);
      else s.followers.push(pid);
      didChange = true;
      break;
    }
    case 'host:setMapStartPiece': {
      const activeMap = s.maps.find(m => m.id === s.activeMapId) || s.maps[0];
      const pid = data.playerId;
      if (!activeMap.startPieces) activeMap.startPieces = {};
      if (!activeMap._playerEverSet) activeMap._playerEverSet = {};
      // v2.4.32: 6 玩家默认 slot
      for (const pp of PLAYER_IDS) {
        if (!activeMap.startPieces[pp]) activeMap.startPieces[pp] = { x: 0.5, y: 0.5 };
        if (activeMap._playerEverSet[pp] === undefined) activeMap._playerEverSet[pp] = true;
      }
      if (!isPlayerId(pid)) break;
      if (Number.isFinite(parseFloat(data.x))) activeMap.startPieces[pid].x = Math.max(0, Math.min(1, parseFloat(data.x)));
      if (Number.isFinite(parseFloat(data.y))) activeMap.startPieces[pid].y = Math.max(0, Math.min(1, parseFloat(data.y)));
      activeMap._playerEverSet[pid] = false;  // 下次进入重新应用
      didChange = true;
      break;
    }
    case 'host:markPiece': {
      const x = Math.max(0, Math.min(1, parseFloat(data.x) || 0.5));
      const y = Math.max(0, Math.min(1, parseFloat(data.y) || 0.5));
      const color = sanitizeText(data.color || '#e74c3c', 20) || '#e74c3c';
      const durationMs = Math.max(500, Math.min(30000, parseInt(data.durationMs) || 3000));
      s.mapMarker = { id: newId(), x, y, color, ts: Date.now(), expiresAt: Date.now() + durationMs };
      didChange = true;
      // 本地兜底
      setTimeout(() => {
        const s2 = loadState();
        if (s2.mapMarker && s2.mapMarker.id === s.mapMarker.id) {
          s2.mapMarker = null;
          saveState(s2);
          mockFire('state', buildStateForRole(s2, myRole));
        }
      }, durationMs + 100);
      break;
    }
    case 'pad:nextNpcDialogue': {
      if (!s.npcDialog || !s.npcDialog.dialogues || s.npcDialog.dialogues.length === 0) break;
      const dir = data.direction === 'prev' ? -1 : 1;
      const total = s.npcDialog.dialogues.length;
      s.npcDialog.index = (s.npcDialog.index + dir + total) % total;
      didChange = true;
      break;
    }
    case 'pad:closeNpcDialog': {
      if (s.npcDialog) { s.npcDialog = null; didChange = true; }
      break;
    }
    case 'host:exportMaps':
    case 'host:importMaps': {
      // mock 端: importMaps 直接替换
      if (event === 'host:importMaps' && data && data.data && Array.isArray(data.data.maps)) {
        s.maps = data.data.maps.map(m => {
          // v2.4.32: 动态 startPieces / pieces 默认
          const startPieces = m.startPieces || {};
          const pieces = m.pieces || {};
          const playerEverSet = {};
          for (const pp of PLAYER_IDS) {
            if (!startPieces[pp]) startPieces[pp] = { x: 0.5, y: 0.5 };
            if (!pieces[pp]) pieces[pp] = { x: 0.5, y: 0.5, color: PLAYER_COLORS[pp].color };
            playerEverSet[pp] = false;
          }
          return {
            id: m.id, name: m.name, url: m.url || null,
            bgm: m.bgm || null,
            startPieces: startPieces,
            items: m.items || [], npcs: m.npcs || [],
            pieces: pieces,
            _playerEverSet: playerEverSet  // 导入后重新应用出生点
          };
        });
        s.activeMapId = data.data.activeMapId || s.maps[0].id;
        if (data.data.playerMap) s.playerMap = data.data.playerMap;
        const active = s.maps.find(m => m.id === s.activeMapId) || s.maps[0];
        s.map = { url: active.url, updatedAt: Date.now() };
        s.mapItems = active.items;
        s.npcs = active.npcs;
        s.pieces = active.pieces;
        didChange = true;
      }
      break;
    }
    case 'host:setScriptTitle': {
      s.scriptTitle = sanitizeText(data || '', 80) || '跑团模组';
      didChange = true;
      break;
    }
    case 'host:setPlayerInit': {
      const pid = data.playerId;
      if (!isPlayerId(pid)) break;
      const c = s.characters[pid];
      if (!c) break;
      const hp = Math.max(0, parseInt(data.hp) || 10);
      const mp = Math.max(0, parseInt(data.mp) || 0);
      const san = Math.max(0, parseInt(data.san) || 50);
      c.hp = { cur: hp, max: hp, current: hp };
      c.mp = { cur: mp, max: mp, current: mp };
      c.san = { cur: san, max: san, current: san };
      didChange = true;
      break;
    }
    case 'host:chatToPlayer': {
      const target = data.target;
      if (!isPlayerId(target)) break;
      if (!s.chat[target]) s.chat[target] = [];
      s.chat[target].push({ from: 'host', text: sanitizeText(data.text || '', 500), ts: Date.now() });
      if (s.chat[target].length > 200) s.chat[target].length = 200;
      didChange = true;
      break;
    }
    case 'host:clearChat': {
      const target = data.target;
      if (!isPlayerId(target)) break;
      s.chat[target] = [];
      didChange = true;
      break;
    }
    case 'player:chatToHost': {
      const myRole = getMyRoleFromPath();
      if (!isPlayerId(myRole)) break;
      if (!s.chat[myRole]) s.chat[myRole] = [];
      s.chat[myRole].push({ from: 'player', text: sanitizeText(data.text || '', 500), ts: Date.now() });
      if (s.chat[myRole].length > 200) s.chat[myRole].length = 200;
      didChange = true;
      break;
    }
    case 'host:sendToPad': {
      const item = buildContentItem({ ...data, from: 'host' });
      // v2.1: 所有类型都进 padHighlight (2.5s) + 提示音
      s.padHighlight = {
        id: item.id,
        type: item.type,
        title: item.title,
        body: item.body,
        imageUrl: item.imageUrl,
        audioUrl: item.audioUrl,
        videoUrl: item.videoUrl,
        from: 'host',
        ts: Date.now(),
        expiresAt: Date.now() + 2500
      };
      // 媒体类同步进投喂流
      if (item.type === 'image' || item.type === 'audio' || item.type === 'video') {
        s.padFeed.unshift(item);
        if (s.padFeed.length > 80) s.padFeed.length = 80;
      }
      setTimeout(() => {
        const s2 = loadState();
        if (s2.padHighlight && s2.padHighlight.id === item.id) {
          s2.padHighlight = null;
          saveState(s2);
          mockFire('state', buildStateForRole(s2, myRole));
        }
      }, 2600);
      didChange = true;
      break;
    }
    case 'host:sendToPlayer': {
      const targets = data.targets || [];
      const itemTemplate = { type: data.type, title: data.title, body: data.body };
      for (const tid of targets) {
        if (s.players[tid]) {
          const item = buildContentItem({ ...itemTemplate, from: tid });
          s.players[tid].privateContent.unshift(item);
          if (s.players[tid].privateContent.length > 100) s.players[tid].privateContent.length = 100;
        }
      }
      didChange = true;
      break;
    }
    case 'host:sendClue': {
      // v2.4.32: 多选 targets(数组或单值), 桌面公开线索加到大屏高亮 + 版图(可拾取)
      let targets;
      if (Array.isArray(data.targets)) {
        targets = data.targets.filter(t => isPlayerId(t) || t === 'pad');
      } else if (data.target) {
        if (data.target === 'all') targets = PLAYER_IDS.slice();
        else if (isPlayerId(data.target)) targets = [data.target];
        else if (data.target === 'pad') targets = ['pad'];
        else targets = [data.target];
      } else {
        targets = ['pad'];
      }
      for (const t of targets) {
        if (t === 'pad') {
          // 桌面:大屏高亮 + 版图卡片
          const item = buildContentItem({
            type: 'clue',
            title: data.title,
            body: data.body,
            imageUrl: data.imageUrl,
            from: 'host'
          });
          s.padHighlight = {
            id: item.id, type: 'clue',
            title: item.title, body: item.body, imageUrl: item.imageUrl,
            from: 'host', ts: Date.now(), expiresAt: Date.now() + 2500
          };
          s.mapItems.push({
            id: newId(), type: 'clue_card',
            title: sanitizeText(data.title || '', 60) || '?',
            body: sanitizeText(data.body || '', 2000),
            imageUrl: isHttpOrLocalUrl(data.imageUrl) ? data.imageUrl : '',
            x: 0.5, y: 0.5, scale: 1.0, target: 'pad'
          });
          setTimeout(() => {
            const s2 = loadState();
            if (s2.padHighlight && s2.padHighlight.id === item.id) {
              s2.padHighlight = null;
              saveState(s2);
              mockFire('state', buildStateForRole(s2, myRole));
            }
          }, 2600);
        } else if (s.players[t]) {
          // 私人线索(只发给对应玩家)
          const item = buildContentItem({
            type: 'clue', title: data.title, body: data.body, imageUrl: data.imageUrl, from: t
          });
          s.players[t].privateContent.unshift(item);
          if (s.players[t].privateContent.length > 100) s.players[t].privateContent.length = 100;
        }
      }
      didChange = true;
      break;
    }
    case 'host:pinFeed': {
      const feedItem = s.padFeed.find(f => f.id === data.feedId);
      if (feedItem) {
        s.mapItems.push({
          id: newId(),
          type: feedItem.type,
          title: feedItem.title,
          body: feedItem.body,
          imageUrl: feedItem.imageUrl,
          audioUrl: feedItem.audioUrl,
          videoUrl: feedItem.videoUrl,
          x: data.x,
          y: data.y,
          pinnedFrom: feedItem.id
        });
        didChange = true;
      }
      break;
    }
    case 'host:addMapItem': {
      // v2.4: 添加到 activeMap.items
      const activeMap = s.maps.find(m => m.id === s.activeMapId) || s.maps[0];
      const item = buildMapItem(data);
      item.target = data.target || 'pad';
      // v2.3.1: 唯一颜色 (mock 端简化:用 hash)
      const palette = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#34495e','#d35400','#16a085','#c0392b','#27ae60','#2980b9','#8e44ad','#f1c40f'];
      const used = new Set();
      s.maps.forEach(m => {
        (m.items || []).forEach(it => it.color && used.add(it.color));
        (m.npcs || []).forEach(n => n.color && used.add(n.color));
      });
      let color = palette[Math.floor(Math.random() * palette.length)];
      let tries = 0;
      while (used.has(color) && tries < palette.length) {
        color = palette[(palette.indexOf(color) + 1) % palette.length];
        tries++;
      }
      item.color = color;
      // v2.4.27: 玩家点击图片后自动跳转版图(棋子不跟)
      if (data.switchMapId) {
        const targetMap = s.maps.find(m => m.id === data.switchMapId);
        if (targetMap) item.switchMapId = data.switchMapId;
      }
      activeMap.items.push(item);
      s.mapItems = activeMap.items;
      didChange = true;
      break;
    }
    case 'host:updateMapItem': {
      // v2.4.27: 主持人更新版图项属性(switchMapId)
      const it = s.mapItems.find(x => x.id === data.id);
      if (it) {
        if ('switchMapId' in data) {
          it.switchMapId = data.switchMapId || null;
        }
        if (Number.isFinite(parseFloat(data.x))) it.x = data.x;
        if (Number.isFinite(parseFloat(data.y))) it.y = data.y;
        if (Number.isFinite(parseFloat(data.scale))) it.scale = data.scale;
        if (typeof data.title === 'string') it.title = data.title;
        didChange = true;
      }
      break;
    }
    case 'host:deleteMapItem': {
      const before = s.mapItems.length;
      s.mapItems = s.mapItems.filter(it => it.id !== data.id);
      if (s.mapItems.length !== before) didChange = true;
      break;
    }
    case 'host:moveMapItem': {
      const it = s.mapItems.find(x => x.id === data.id);
      if (it) { it.x = data.x; it.y = data.y; didChange = true; }
      break;
    }
    case 'host:setBgm': {
      s.bgm = {
        url: sanitizeText(data.url || '', 2000),
        title: sanitizeText(data.title || '背景音乐', 100),
        volume: Math.max(0, Math.min(1, parseFloat(data.volume) || 0.5)),
        paused: false,
        ts: Date.now()
      };
      didChange = true;
      break;
    }
    case 'host:stopBgm': {
      if (s.bgm) { s.bgm = null; didChange = true; }
      break;
    }
    case 'host:pauseBgm': {
      if (s.bgm) { s.bgm.paused = true; didChange = true; }
      break;
    }
    case 'host:resumeBgm': {
      if (s.bgm) { s.bgm.paused = false; s.bgm.ts = Date.now(); didChange = true; }
      break;
    }
    case 'host:setBgmVolume': {
      if (s.bgm) { s.bgm.volume = Math.max(0, Math.min(1, parseFloat(data.volume) || 0.5)); didChange = true; }
      break;
    }
    case 'host:log': {
      appendLog(s, sanitizeText(data || '', 200));
      didChange = true;
      break;
    }
    case 'host:clearAll': {
      // 重置但保留脚本名
      const title = s.scriptTitle;
      const fresh = initialState();
      fresh.scriptTitle = title;
      Object.keys(s).forEach(k => { s[k] = fresh[k]; });
      didChange = true;
      break;
    }
    case 'host:shutdown':
    case 'host:restart': {
      showToast('ℹ️ 静态模式下,服务器操作无效', 'error');
      return; // 不写状态
    }
    case 'player:rollDice': {
      let rngSpec;
      if (data.rolls && Array.isArray(data.rolls)) {
        rngSpec = { rolls: data.rolls, modifier: 0, notation: data.rolls.map(r => `${r.count}D${r.sides}`).join('+') };
      } else if (data.notation) {
        rngSpec = parseDiceNotation(data.notation);
        if (!rngSpec) { showToast('❌ 骰子表达式格式错误', 'error'); return; }
      } else {
        return;
      }
      const result = rollDice(rngSpec);
      const item = {
        id: newId(),
        type: 'dice',
        from: myRole,  // 'p1' or 'p2'
        detail: result.detail,
        total: result.total,
        modifier: result.modifier,
        notation: result.notation,
        ts: Date.now()
      };
      s.padFeed.unshift(item);
      if (s.padFeed.length > 80) s.padFeed.length = 80;
      s.padHighlight = {
        id: item.id,
        type: 'dice',
        from: item.from,
        notation: result.notation,
        detail: result.detail,
        total: result.total,
        ts: Date.now(),
        expiresAt: Date.now() + 2500
      };
      setTimeout(() => {
        const s2 = loadState();
        if (s2.padHighlight && s2.padHighlight.id === item.id) {
          s2.padHighlight = null;
          saveState(s2);
          mockFire('state', buildStateForRole(s2, myRole));
        }
      }, 2600);
      didChange = true;
      break;
    }
    // v2.0 新增
    case 'host:nextTurn': {
      if (!s.turn.order || s.turn.order.length === 0) break;
      const curIdx = s.turn.order.indexOf(s.turn.current);
      const nextIdx = (curIdx + 1) % s.turn.order.length;
      if (nextIdx <= curIdx && s.turn.order.length > 1) s.turn.round += 1;
      s.turn.current = s.turn.order[nextIdx];
      didChange = true;
      break;
    }
    case 'host:prevTurn': {
      if (!s.turn.order || s.turn.order.length === 0) break;
      const curIdx = s.turn.order.indexOf(s.turn.current);
      const prevIdx = (curIdx - 1 + s.turn.order.length) % s.turn.order.length;
      s.turn.current = s.turn.order[prevIdx];
      didChange = true;
      break;
    }
    case 'host:resetTurn': {
      s.turn = { order: ['p1', 'p2'], current: 'p1', round: 1 };
      didChange = true;
      break;
    }
    case 'pad:nextTurn': {
      if (!s.turn.order || s.turn.order.length === 0) break;
      const curIdx = s.turn.order.indexOf(s.turn.current);
      const nextIdx = (curIdx + 1) % s.turn.order.length;
      if (nextIdx <= curIdx && s.turn.order.length > 1) s.turn.round += 1;
      s.turn.current = s.turn.order[nextIdx];
      didChange = true;
      break;
    }
    case 'host:addNpc': {
      const npc = {
        id: newId(),
        name: sanitizeText(data.name || 'NPC', 30) || 'NPC',
        avatar: isHttpOrLocalUrl(data.avatar) ? data.avatar : '',
        x: typeof data.x === 'number' ? data.x : 0.5,
        y: typeof data.y === 'number' ? data.y : 0.5,
        scale: parseFloat(data.scale) || 1.0,
        switchMapId: data.switchMapId || null,  // v2.4.24
        switchMapTarget: data.switchMapTarget || 'none',  // v2.4.25
        dialogues: []
      };
      s.npcs.push(npc);
      didChange = true;
      break;
    }
    case 'host:updateNpc': {
      const npc = s.npcs.find(n => n.id === data.id);
      if (npc) {
        if (typeof data.name === 'string') npc.name = sanitizeText(data.name, 30) || npc.name;
        if (typeof data.avatar === 'string') npc.avatar = isHttpOrLocalUrl(data.avatar) ? data.avatar : '';
        if (Number.isFinite(parseFloat(data.scale))) npc.scale = Math.max(0.3, Math.min(3, parseFloat(data.scale)));
        // v2.4.24: switchMapId
        if ('switchMapId' in data) {
          npc.switchMapId = data.switchMapId || null;
        }
        // v2.4.25: switchMapTarget
        if ('switchMapTarget' in data) {
          const allowed = ['none', 'p1', 'p2', 'all'];
          npc.switchMapTarget = allowed.includes(data.switchMapTarget) ? data.switchMapTarget : 'none';
        }
        didChange = true;
      }
      break;
    }
    case 'host:moveNpc': {
      const npc = s.npcs.find(n => n.id === data.id);
      if (npc) { npc.x = data.x; npc.y = data.y; didChange = true; }
      break;
    }
    case 'host:deleteNpc': {
      const before = s.npcs.length;
      s.npcs = s.npcs.filter(n => n.id !== data.id);
      if (s.npcs.length !== before) didChange = true;
      break;
    }
    case 'host:addNpcDialogue': {
      const npc = s.npcs.find(n => n.id === data.npcId);
      if (npc) {
        const d = {
          id: newId(),
          title: sanitizeText(data.title || '', 60) || '对话',
          type: data.type === 'image' ? 'image' : 'text',
          content: data.type === 'image' ? (isHttpOrLocalUrl(data.content) ? data.content : '') : sanitizeText(data.content || '', 2000),
          target: data.target === 'all' ? 'all' : 'current'
        };
        if (d.content) { npc.dialogues.push(d); didChange = true; }
      }
      break;
    }
    case 'host:deleteNpcDialogue': {
      const npc = s.npcs.find(n => n.id === data.npcId);
      if (npc) {
        const before = npc.dialogues.length;
        npc.dialogues = npc.dialogues.filter(d => d.id !== data.dialogueId);
        if (npc.dialogues.length !== before) didChange = true;
      }
      break;
    }
    case 'player:npcInteract': {
      const role = myRole || 'p1';
      const npc = s.npcs.find(n => n.id === data.npcId);
      const dlg = npc && npc.dialogues.find(d => d.id === data.dialogueId);
      if (npc && dlg) {
        const targets = dlg.target === 'all' ? ['p1', 'p2'] : [s.turn.current || role];
        // v2.4: NPC 信息支持 text/image/audio
        const item = {
          id: newId(),
          type: dlg.type,
          title: dlg.title,
          body: dlg.type === 'text' ? dlg.content : '',
          imageUrl: dlg.type === 'image' ? dlg.content : '',
          audioUrl: dlg.type === 'audio' ? dlg.content : '',
          from: 'npc:' + npc.id,
          ts: Date.now()
        };
        for (const t of targets) {
          if (s.players[t]) {
            s.players[t].privateContent.unshift({ ...item });
            if (s.players[t].privateContent.length > 50) s.players[t].privateContent.length = 50;
          }
        }
        // v2.4.18: 广播 npcDialog 到 pad 端大屏
        const dlgIndex = npc.dialogues.findIndex(d => d.id === dlg.id);
        s.npcDialog = {
          id: newId(),
          npcId: npc.id,
          npcName: npc.name,
          npcAvatar: npc.avatar || '',
          dialogues: npc.dialogues.map(d => ({ id: d.id, title: d.title, type: d.type, content: d.content })),
          index: dlgIndex >= 0 ? dlgIndex : 0,
          ts: Date.now()
        };
        // v2.4.25: NPC 上配置了 switchMapId 时,根据 switchMapTarget 决定带哪些玩家过去
        // switchMapTarget: 'none'(默认,都不带) | 'p1'..'p6' | 'all'
        if (npc.switchMapId && s.maps) {
          const targetMap = s.maps.find(m => m.id === npc.switchMapId);
          if (targetMap) {
            const target = npc.switchMapTarget || 'none';
            let followers = [];
            if (isPlayerId(target)) followers = [target];
            else if (target === 'all') followers = PLAYER_IDS.slice();
            s.playerMap = s.playerMap || {};
            for (const pid of followers) {
              s.playerMap[pid] = targetMap.id;
              if (targetMap.startPieces && targetMap.startPieces[pid]) {
                if (!targetMap.pieces) targetMap.pieces = {};
                targetMap.pieces[pid] = { ...targetMap.startPieces[pid] };
              }
            }
            if (followers.length === 0) {
              showToast(`🗺️ NPC「${npc.name}」触发了版图切换(无玩家跟随):${targetMap.name}`);
            } else if (followers.length === 1) {
              showToast(`🗺️ NPC「${npc.name}」将你带到了版图「${targetMap.name}」`);
            } else {
              showToast(`🗺️ NPC「${npc.name}」将所有玩家带到了版图「${targetMap.name}」`);
            }
          }
        }
        didChange = true;
      }
      break;
    }
    case 'host:setScript': {
      s.script = {
        url: typeof data.url === 'string' ? (isHttpOrLocalUrl(data.url) ? data.url : (data.url === '' ? '' : s.script.url)) : s.script.url,
        file: typeof data.file === 'string' ? (isHttpOrLocalUrl(data.file) ? data.file : (data.file === '' ? '' : s.script.file)) : s.script.file,
        fileName: sanitizeText(data.fileName || s.script.fileName || '', 200)
      };
      didChange = true;
      break;
    }
    case 'host:rollDice': {
      // 解析 notation
      let rolls = [], modifier = 0, notation = '';
      if (Array.isArray(data.rolls)) {
        rolls = data.rolls;
        notation = rolls.map(r => `${r.count || 1}D${r.sides}`).join('+');
      } else if (data.notation) {
        const parsed = parseDiceNotation(data.notation);
        if (parsed) { rolls = parsed.rolls; modifier = parsed.modifier; notation = data.notation; }
      }
      if (rolls.length === 0) break;
      const detail = [];
      let total = modifier;
      for (const r of rolls) {
        const results = [];
        for (let i = 0; i < (r.count || 1); i++) {
          const v = 1 + Math.floor(Math.random() * r.sides);
          results.push(v); total += v;
        }
        detail.push({ sides: r.sides, results, sum: results.reduce((a, b) => a + b, 0) });
      }
      // v2.1: 公开性取决于 s.hostDicePublic
      const visible = !!s.hostDicePublic;
      const diceItem = {
        id: newId(), type: 'dice', from: 'host', notation, detail, modifier, total, visible, ts: Date.now()
      };
      s.hostDiceLog.unshift(diceItem);
      if (s.hostDiceLog.length > 50) s.hostDiceLog.length = 50;
      // v2.1: 即使公开也不再进 padFeed/padHighlight(只进主持人历史)
      didChange = true;
      break;
    }
    case 'host:setDicePublic': {
      s.hostDicePublic = !!data.public;
      didChange = true;
      break;
    }
    case 'host:addToPlayerBackpack': {
      // v2.4.32: 主持人给玩家背包直接添加物品(多选 targets)
      const targets = Array.isArray(data.targets) ? data.targets.filter(t => isPlayerId(t)) : [];
      if (targets.length === 0) break;
      const title = sanitizeText(data.title || '', 60) || '未命名物品';
      const body = sanitizeText(data.body || '', 2000);
      const imageUrl = isHttpOrLocalUrl(data.imageUrl) ? data.imageUrl : '';
      for (const t of targets) {
        s.backpack[t].unshift({
          id: newId(), title, body, imageUrl, ts: Date.now()
        });
        if (s.backpack[t].length > 50) s.backpack[t].length = 50;
      }
      didChange = true;
      break;
    }
    case 'host:toggleDiceVisible': {
      const item = s.hostDiceLog.find(x => x.id === data.id);
      if (item) { item.visible = !item.visible; didChange = true; }
      break;
    }
    case 'player:setCharacter': {
      const role = myRole || 'p1';
      const c = s.characters[role] || {};
      if (typeof data.name === 'string') c.name = sanitizeText(data.name, 30);
      if (typeof data.gender === 'string') c.gender = sanitizeText(data.gender, 10);
      if (typeof data.avatar === 'string') c.avatar = isHttpOrLocalUrl(data.avatar) ? data.avatar : '';
      if (typeof data.intro === 'string') c.intro = sanitizeText(data.intro, 2000);
      if (data.hp && c.hp) {
        if (Number.isFinite(parseInt(data.hp.max))) c.hp.max = Math.max(0, parseInt(data.hp.max));
        if (Number.isFinite(parseInt(data.hp.current))) c.hp.current = Math.max(0, Math.min(c.hp.max, parseInt(data.hp.current)));
      }
      if (data.mp && c.mp) {
        if (Number.isFinite(parseInt(data.mp.max))) c.mp.max = Math.max(0, parseInt(data.mp.max));
        if (Number.isFinite(parseInt(data.mp.current))) c.mp.current = Math.max(0, Math.min(c.mp.max, parseInt(data.mp.current)));
      }
      if (data.san && c.san) {
        if (Number.isFinite(parseInt(data.san.max))) c.san.max = Math.max(0, parseInt(data.san.max));
        if (Number.isFinite(parseInt(data.san.current))) c.san.current = Math.max(0, Math.min(c.san.max, parseInt(data.san.current)));
      }
      if (Array.isArray(data.attributes)) {
        c.attributes = data.attributes.slice(0, 30).map(a => ({
          id: a.id || newId(), name: sanitizeText(a.name, 30) || '属性', value: parseInt(a.value) || 0
        }));
      }
      s.characters[role] = c;
      didChange = true;
      break;
    }
    case 'player:setNote': {
      const role = myRole || 'p1';
      s.notes[role] = sanitizeText(data.note || '', 20000);
      // 静默保存,不广播
      saveState(s);
      return;
    }
    case 'player:triggerEvent': {
      // v2.4: 事件触发 - 模拟服务端:从玩家当前版图移除 + 应用 effects + 切版图
      const role = myRole || 'p1';
      const myMap = s.maps.find(m => m.id === s.playerMap[role]) || s.maps[0];
      const ev = myMap.items.find(it => it.id === data.itemId && it.type === 'event');
      if (!ev) break;
      // 应用 effects
      const targetPlayer = data.targetPlayer || role;
      if (ev.effects && s.characters[targetPlayer]) {
        const c = s.characters[targetPlayer];
        for (const k of ['hp', 'mp', 'san']) {
          const delta = parseInt(ev.effects[k]);
          if (Number.isFinite(delta) && delta !== 0 && c[k] && Number.isFinite(c[k].max)) {
            c[k].current = Math.max(0, Math.min(c[k].max, c[k].current + delta));
          }
        }
      }
      // 切版图
      if (ev.switchMapId) {
        const targetMap = s.maps.find(m => m.id === ev.switchMapId);
        if (targetMap) {
          const switchTo = ev.switchPlayer || targetPlayer;
          if (switchTo === 'p1' || switchTo === 'p2') s.playerMap[switchTo] = targetMap.id;
        }
      }
      // 一次性事件 → 移除
      myMap.items = myMap.items.filter(it => it.id !== ev.id);
      if (myMap.id === s.activeMapId) s.mapItems = myMap.items;
      // 同步到 compat (host/pad view 看到的)
      const activeMap = s.maps.find(m => m.id === s.activeMapId) || s.maps[0];
      s.mapItems = activeMap.items;
      // v2.4.26: 事件信息(任何类型)都进入 pad 公开信息流,from=role
      if (ev.body || ev.imageUrl || ev.audioUrl || ev.videoUrl) {
        const feedItem = {
          id: newId(),
          type: 'clue',
          title: ev.title || '事件',
          body: ev.body || '',
          imageUrl: ev.imageUrl || '',
          audioUrl: ev.audioUrl || '',
          videoUrl: ev.videoUrl || '',
          from: role,
          ts: Date.now()
        };
        s.padFeed.unshift(feedItem);
        if (s.padFeed.length > 30) s.padFeed.length = 30;
      }
      // v2.4.24: 玩家手机端事件高亮弹窗(视频/音频自动播放)
      showPlayerEventHighlight({
        id: ev.id,
        title: ev.title || '?',
        body: ev.body || '',
        imageUrl: ev.imageUrl || '',
        audioUrl: ev.audioUrl || '',
        videoUrl: ev.videoUrl || '',
        effects: ev.effects || null
      });
      didChange = true;
      break;
    }
    case 'player:clickMapItem': {
      // v2.4.28: 玩家点击版图上的 item(图片配了 switchMapId)
      // 改的是 activeMap(让 pad/host 看到新场景),不是 playerMap
      // 玩家还在原地图,棋子不动
      const item = s.mapItems.find(it => it.id === data.itemId);
      if (item && item.switchMapId) {
        const targetMap = (s.maps || []).find(m => m.id === item.switchMapId);
        if (targetMap) {
          s.activeMapId = targetMap.id;
          // 同步 compat 字段
          s.map = { url: targetMap.url, updatedAt: Date.now() };
          s.mapItems = targetMap.items;
          s.npcs = targetMap.npcs;
          s.pieces = targetMap.pieces;
          showToast(`🖼️ 已切到「${targetMap.name}」`);
          didChange = true;
        }
      }
      break;
    }
    case 'player:pickupClue': {
      const role = myRole || 'p1';
      // v2.3: 线索 + 物品 都可拾取
      const idx = s.mapItems.findIndex(it =>
        it.id === data.itemId && (it.type === 'clue_card' || it.type === 'clue' || it.type === 'item')
      );
      if (idx < 0) break;
      const item = s.mapItems[idx];
      // v2.4.32: 必须在玩家自己的回合(target=pad)或 target=myRole 才能拾取
      let canPick = false;
      if (isPlayerId(item.target) && item.target === role) canPick = true;
      else if (item.target === 'pad' && s.turn.current === role) canPick = true;
      if (!canPick) break;
      // v2.3: 物品类型保留完整内容(URL 等),线索类型保留 body
      s.backpack[role].unshift({
        id: newId(),
        type: item.type === 'item' ? 'item' : 'clue',
        title: item.title || '?',
        body: item.body || '',
        imageUrl: item.imageUrl || '',
        audioUrl: item.audioUrl || '',
        videoUrl: item.videoUrl || '',
        pickedAt: Date.now()
      });
      if (s.backpack[role].length > 50) s.backpack[role].length = 50;
      s.mapItems.splice(idx, 1);
      didChange = true;
      break;
    }
    case 'player:discardClue': {
      const role = myRole || 'p1';
      const before = s.backpack[role].length;
      s.backpack[role] = s.backpack[role].filter(c => c.id !== data.clueId);
      if (s.backpack[role].length !== before) didChange = true;
      break;
    }
    case 'player:sendClueToPlayer': {
      const role = myRole || (isPlayerId(myRole) ? myRole : 'p1');
      const target = data.target;
      if (!isPlayerId(target) || target === role) break;
      const title = sanitizeText(data.title || '', 60) || '线索';
      const body = sanitizeText(data.body || '', 2000);
      const imageUrl = isHttpOrLocalUrl(data.imageUrl) ? data.imageUrl : '';
      if (!body && !imageUrl) break;
      s.players[target].privateContent.unshift({
        id: newId(), type: 'clue', title, body, imageUrl, from: role, ts: Date.now()
      });
      if (s.players[target].privateContent.length > 50) s.players[target].privateContent.length = 50;
      didChange = true;
      break;
    }
    case 'host:scaleMapItem': {
      const item = s.mapItems.find(it => it.id === data.id);
      if (item) {
        const sc = parseFloat(data.scale);
        if (Number.isFinite(sc)) { item.scale = Math.max(0.2, Math.min(5, sc)); didChange = true; }
      }
      break;
    }
    // v2.4.28: 图库 - 静态模式直接返回(空数组,无后端)
    case 'host:listImageLibrary': {
      mockFire('imageLibrary', { items: [], total: 0 });
      break;
    }
    // v2.4.29: 角色模板 - 静态模式不返回(让用户切到实时模式使用)
    case 'host:listCharacterTemplates':
    case 'player:listCharacterTemplates': {
      mockFire('characterTemplates', { items: [], total: 0, game: data?.game || 'all' });
      break;
    }
    case 'player:applyCharacterTemplate': {
      // 静态模式下不应用
      break;
    }
    case 'host:deductHp': {
      const target = data.target;
      if (!isPlayerId(target)) break;
      const amount = parseInt(data.amount);
      if (!Number.isFinite(amount) || amount === 0) break;
      const c = s.characters[target];
      if (!c || !c.hp) break;
      c.hp.current = Math.max(0, Math.min(c.hp.max, c.hp.current - amount));
      didChange = true;
      break;
    }
    case 'host:adjustStat': {
      const target = data.target;
      if (!isPlayerId(target)) break;
      const stat = data.stat;
      if (stat !== 'hp' && stat !== 'mp' && stat !== 'san') break;
      const amount = parseInt(data.amount);
      if (!Number.isFinite(amount) || amount === 0) break;
      const c = s.characters[target];
      if (!c || !c[stat]) break;
      c[stat].current = Math.max(0, Math.min(c[stat].max, c[stat].current + amount));
      didChange = true;
      break;
    }
    case 'host:pinClueAsCard': {
      // v2.4.32: 支持 p1~p6 玩家
      let targets;
      if (Array.isArray(data.targets)) {
        targets = data.targets.filter(t => isPlayerId(t) || t === 'pad');
      } else if (typeof data.target === 'string') {
        if (data.target === 'all') targets = PLAYER_IDS.slice();
        else if (isPlayerId(data.target) || data.target === 'pad') targets = [data.target];
        else targets = [data.target];
      } else {
        targets = ['pad'];
      }
      for (const t of targets) {
        s.mapItems.push({
          id: newId(),
          type: 'clue_card',
          title: sanitizeText(data.title || '', 60),
          body: sanitizeText(data.body || '', 2000),
          imageUrl: isHttpOrLocalUrl(data.imageUrl) ? data.imageUrl : '',
          x: typeof data.x === 'number' ? data.x : 0.5,
          y: typeof data.y === 'number' ? data.y : 0.5,
          scale: 1.0,
          target: t
        });
      }
      didChange = true;
      break;
    }
  }
  if (didChange) {
    saveState(s);
    mockFire('state', buildStateForRole(s, myRole));
    mockFire('status', { online: s.online });
  }
}

// ---------- 模式选择 ----------
if (STATIC_MODE) {
  // 显示 demo banner
  const banner = $('demoBanner');
  if (banner) banner.style.display = 'block';
  document.querySelectorAll('.view').forEach(v => v.classList.add('has-demo-banner'));
  // 用 mock
  socket = mockSocket;
  console.log('[TRPG Desk] 静态演示模式启动 - 数据存本机 localStorage');
  // 首页状态
  $('homeStatus').textContent = '🎭 静态演示模式';
  $('homeStatus').classList.add('online', 'static-mode');
  if ($('homeUrl')) $('homeUrl').textContent = '(本机浏览器)';
} else {
  // 实时模式:必须 socket.io 加载成功
  if (typeof io === 'undefined') {
    const fileUrl = 'file://' + (location.pathname || '/index.html');
    const localUrl = 'http://localhost:3000/';
    document.body.innerHTML = `
      <div style="position:fixed;inset:0;background:#1a120b;color:#f5e6d3;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:24px;font-family:sans-serif;text-align:center;overflow-y:auto;">
        <h1 style="font-size:26px;margin-bottom:12px;color:#f5b942;">⚠️ 实时模式失败:无法加载 socket.io</h1>
        <p style="margin-bottom:8px;">当前协议: <code style="background:#000;padding:2px 6px;border-radius:4px;">${location.protocol}//${location.host || '<空 host>'}${location.pathname}</code></p>
        <hr style="width:60%;border:1px solid #444;margin:14px 0;">
        <p style="font-size:16px;color:#f5b942;margin-bottom:8px;">可能原因 & 解决方案</p>
        <ol style="text-align:left;max-width:540px;line-height:1.8;font-size:14px;">
          <li>当前协议 <code>${location.protocol}//${location.host || ''}</code> 下没有 socket.io 服务(典型:Trae IDE 预览)</li>
          <li>请先在终端运行 <code style="background:#000;padding:2px 6px;border-radius:4px;">cd e:\\game\\trpg-desk && node server.js</code> 启动服务器</li>
          <li>然后用浏览器打开 <a href="${localUrl}" style="color:#5dade2;">${localUrl}</a></li>
        </ol>
        <p style="margin-top:14px;font-size:14px;">本机其他设备访问:用本机局域网 IP(例如 <code>http://192.168.x.x:3000/</code>)</p>
        <p style="margin-top:14px;font-size:13px;color:#a89880;">如果只是要看 UI 不想启动服务器,可加 <code>?static=1</code> 走静态演示模式(无法跨设备同步)</p>
        <p style="margin-top:18px;">
          <button onclick="location.reload()" style="background:#c08a4e;color:#1a120b;border:none;padding:10px 24px;border-radius:6px;font-size:15px;cursor:pointer;margin-right:8px;">🔄 重试</button>
          <a href="${localUrl}?static=1" style="display:inline-block;background:#5dade2;color:#1a120b;border:none;padding:10px 24px;border-radius:6px;font-size:15px;text-decoration:none;">🎭 进入静态演示</a>
        </p>
      </div>
    `;
    throw new Error('socket.io not loaded in live mode');
  }
  // v2.4.37: 指数退避重连(1s -> 2s -> 4s -> 8s,最大 30s)+ 大量重连次数
  //   - 之前固定 1-5s,网络差时容易卡死
  //   - 现在最多尝试 30 次(覆盖 5+ 分钟断网)
  let reconnectAttempt = 0;
  socket = io({
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    randomizationFactor: 0.3,  // 30% 随机抖动,避免多端同时重连
    timeout: 20000,
    reconnectionAttempts: 30,
    // v2.4.34: 手机端熄屏稳定性 - 关闭 transport 降级,防止 WebSocket 被静默替换
    transports: ['websocket', 'polling'],
    upgrade: true,
    rememberUpgrade: true
  });

  // v2.4.34: 手机熄屏唤醒后,主动检测断线并重连
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (socket && !socket.connected) {
        console.log('[visibility] 页面唤醒,主动触发重连…');
        socket.connect();
      } else if (socket && socket.connected) {
        // 已连接则发一次心跳,确保 session 没掉
        try { socket.emit('ping'); } catch (e) { /* ignore */ }
      }
    }
  });
  // v2.4.34: 唤醒/网络恢复事件
  window.addEventListener('online', () => {
    if (socket && !socket.connected) socket.connect();
    showToast('📶 网络已恢复', 'info');
  });
  window.addEventListener('offline', () => {
    showToast('📴 网络已断开,稍后将自动重连…', 'error');
  });

  // v2.4.34: 周期性健康检查 - 如果 socket 显示 connected 但实际不通(常见于手机端后台被系统挂起后)
  // v2.4.37: 可见时 5s 检查,隐藏时 15s(避免无意义唤醒)
  // v2.4.38: 修复 ReferenceError - visible 之前在 setInterval 回调内声明,导致第三个参数评估时变量未定义
  const startHealthCheck = () => setInterval(() => {
    if (!socket) return;
    const visible = document.visibilityState === 'visible';
    if (visible && !socket.connected) {
      console.log('[health] 检测到断开,主动重连…');
      socket.connect();
    } else if (visible && socket.connected) {
      // 主动 ping 服务器,确保连接是活的(应对某些路由器空闲踢连接)
      try { socket.emit('client:heartbeat', { ts: Date.now() }); } catch (e) { /* ignore */ }
    }
  }, document.visibilityState === 'visible' ? 5000 : 15000);
  startHealthCheck();

  // v2.4.37: Wake Lock API - 防止手机/Pad 息屏
  //   - 申请屏幕唤醒锁,只要页面在前台就保持屏幕常亮
  //   - 仅在支持的浏览器生效(iOS Safari 16.4+ / Android Chrome 84+ / Desktop Chrome 84+)
  //   - 用户主动切到后台时自动释放
  let wakeLock = null;
  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('[wakeLock] 已申请屏幕唤醒锁');
      wakeLock.addEventListener('release', () => {
        console.log('[wakeLock] 屏幕唤醒锁已释放');
      });
    } catch (e) {
      console.warn('[wakeLock] 申请失败(可能权限被拒或不支持):', e.message);
    }
  }
  // 页面可见时申请,隐藏时释放
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && !wakeLock) {
      await requestWakeLock();
    } else if (document.visibilityState === 'hidden' && wakeLock) {
      try { await wakeLock.release(); wakeLock = null; } catch (e) { /* ignore */ }
    }
  });
  // 首次加载如果页面可见,申请一次
  if (document.visibilityState === 'visible') {
    requestWakeLock();
  }

  // 连接失败时的友好提示
  let connectFailed = false;
  socket.on('connect_error', (err) => {
    if (!connectFailed) {
      connectFailed = true;
      const banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#c0392b;color:#fff;padding:12px 16px;font-family:sans-serif;font-size:13px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.4);';
      banner.innerHTML = '❌ 无法连接到服务器 <code style="background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;">' +
        location.origin + '</code> · 请先在终端运行 <code style="background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;">node server.js</code>' +
        ' <button onclick="location.reload()" style="margin-left:12px;background:#fff;color:#c0392b;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;">🔄 重试</button>';
      document.body.appendChild(banner);
    }
  });
  socket.on('connect', () => {
    connectFailed = false;
    const banners = document.querySelectorAll('[data-conn-banner]');
    banners.forEach(b => b.remove());
    $('homeStatus').textContent = '已连接 · ' + socket.id.slice(0, 6);
    $('homeStatus').classList.add('online');
    $('homeUrl').textContent = location.origin;
    isReconnecting = false;
    if (!myRole) {
      const cached = localStorage.getItem(LS_ROLE);
      const validRoles = ['host', 'pad', ...PLAYER_IDS];
      if (cached && validRoles.includes(cached)) {
        console.log('[reconnect] auto-join as', cached);
        joinAs(cached, true);
        setReconnectBanner('connected', '✅ 已重新连接并恢复角色');
      } else {
        hideBannerIfConnected();
      }
    } else {
      console.log('[reconnect] re-join as', myRole);
      socket.emit('join', { role: myRole });
      hideBannerIfConnected();
    }
  });
  socket.on('disconnect', () => {
    $('homeStatus').textContent = '连接断开,正在重连…';
    $('homeStatus').classList.remove('online');
    isReconnecting = true;
    setReconnectBanner('reconnecting');
    showToast('⚠️ 与服务器断开,正在重连…', 'error');
  });
  socket.on('reconnect_attempt', (n) => {
    $('reconnectText').textContent = `⚠️ 与服务器断开,正在第 ${n} 次重连…`;
  });
  socket.on('reconnect_failed', () => {
    $('reconnectText').textContent = '❌ 重连失败,请检查网络';
  });
  function hideBannerIfConnected() {
    if (lastConnected) {
      setReconnectBanner('hidden');
    } else {
      setReconnectBanner('connected');
      lastConnected = true;
    }
  }
}

// 通用:服务器推送事件
socket.on('status', (s) => renderHomeOnline(s.online || {}));
socket.on('toast', (m) => showToast(m.msg));
socket.on('error', (m) => showToast('❌ ' + m.msg, 'error'));
// v2.4.40: 服务端强制踢出(玩家槽位被删/被主持人重置等)
socket.on('forceLeave', (data) => {
  const reason = (data && data.reason) || 'unknown';
  showToast(`🚪 你已离开角色(${reason === 'slot_removed' ? '本局玩家数已调整' : '被强制离开'})`, 'info');
  myRole = null;
  try { localStorage.removeItem(LS_ROLE); } catch (e) {}
  showView('home');
});
// v2.4.32: 服务端确认加入,带真实分配的角色(auto 模式时返回具体位置)
socket.on('joined', (data) => {
  if (data && data.role) {
    const oldRole = myRole;
    myRole = data.role;
    try { localStorage.setItem(LS_ROLE, myRole); } catch (e) {}
    if (oldRole === 'auto' && myRole && isPlayerId(myRole)) {
      showToast(`✅ 已加入: ${roleLabel(myRole)} (位置 ${myRole})`, 'info');
    }
    // v2.4.37: 服务端确认是"重连"时,显示友好的恢复提示
    if (data.reconnected) {
      showToast(`🔄 已重新连接(身份保留): ${roleLabel(myRole)}`, 'success');
    }
  }
});
// v2.4.28: 图库响应
socket.on('imageLibrary', (data) => renderImageLibrary(data && data.items));
socket.on('state', (s) => {
  lastState = s;
  // v2.4.34: 同步本局激活玩家列表
  if (s && Array.isArray(s.activePlayerIds)) {
    ACTIVE_PLAYER_IDS = s.activePlayerIds.slice();
  } else if (s && typeof s.maxPlayers === 'number') {
    ACTIVE_PLAYER_IDS = PLAYER_IDS.slice(0, s.maxPlayers);
  }
  try { localStorage.setItem(LS_LAST_STATE, JSON.stringify({ role: myRole, ts: Date.now() })); } catch (e) {}
  renderView();
  // v2.4.36: 如果当前在角色选择页,刷新卡片状态
  const joinView = $('joinView');
  if (joinView && joinView.style.display !== 'none') {
    renderJoinRoomInfo();
    renderJoinCards();
  }
});

// v2.4.29: 角色模板响应
socket.on('characterTemplates', (data) => {
  renderCharacterTemplates(data && data.items);
});
socket.on('toast', (m) => showToast(m.msg));

// v2.4.45: NPC AI 对话事件
// v2.4.46: pad/host 端实时接收 + 共享模式下其他玩家也接收
socket.on('npcAiChat', (data) => {
  if (myRole === 'pad' || myRole === 'host') {
    appendPadAiChatMsg(data);
    // v2.4.48: 主持人 NPC tab 内联卡片实时追加对话
    if (myRole === 'host') appendNpcCardChatMsg(data);
    return;
  }
  // v2.4.46: 共享对话模式下,其他玩家在 galgame 界面看到对话
  if (isPlayerId(myRole) && galgameState.active && galgameState.npcId === data.npcId && galgameState.shared) {
    if (data.type === 'user' && data.playerId !== myRole) {
      // 其他玩家的发言
      addGalgameLogEntry('user', roleLabel(data.playerId), data.message || '');
      $('galgameText').textContent = data.message || '';
    } else if (data.type === 'npc' && data.playerId !== myRole) {
      // NPC 对其他玩家的回复(自己没参与这轮)
      galgameTypewriter(data.message || '', () => {
        if (galgameState.ttsEnabled) galgameSpeak(data.message || '');
      });
      addGalgameLogEntry('npc', galgameState.npcName, data.message || '');
    }
  }
});
// 玩家端:AI 回复
socket.on('npcChatReply', (data) => {
  if (!galgameState.active || galgameState.npcId !== data.npcId) return;
  galgameState.thinking = false;
  // v2.4.46: 更新音色配置(主持人可能改过)
  if (data.gender) galgameState.npcGender = data.gender;
  if (data.age) galgameState.npcAge = data.age;
  hideGalgameThinking();
  galgameTypewriter(data.message || '', () => {
    // 打字结束后,如果启用了 TTS,朗读
    if (galgameState.ttsEnabled) galgameSpeak(data.message || '');
  });
  // 记录到本地对话历史
  addGalgameLogEntry('npc', galgameState.npcName || '', data.message || '');
});
// 玩家端:思考中
socket.on('npcChatThinking', (data) => {
  if (!galgameState.active || galgameState.npcId !== data.npcId) return;
  galgameState.thinking = true;
  showGalgameThinking();
  // v2.4.48: 手动模式下提示等待主持人回复
  if (data.manual) {
    const t = $('galgameThinking');
    if (t) {
      const label = t.querySelector('.galgame-thinking-label');
      if (label) label.textContent = '⏳ 等待主持人回复…';
    }
  }
});
// 玩家端:错误
socket.on('npcChatError', (data) => {
  if (!galgameState.active || galgameState.npcId !== data.npcId) return;
  galgameState.thinking = false;
  hideGalgameThinking();
  showToast('❌ ' + (data.error || 'AI 回复失败'), 'error');
  setGalgameSendEnabled(true);
});
// 玩家端:历史对话
socket.on('npcChatHistory', (data) => {
  if (!galgameState.active || galgameState.npcId !== data.npcId) return;
  // v2.4.46: 更新音色 + 共享模式
  if (data.gender) galgameState.npcGender = data.gender;
  if (data.age) galgameState.npcAge = data.age;
  if (typeof data.shared === 'boolean') galgameState.shared = data.shared;
  const log = (data.history || []).slice(-20);
  const npcName = galgameState.npcName || 'NPC';
  log.forEach(m => addGalgameLogEntry(m.role === 'user' ? 'user' : 'npc', npcName, m.content || ''));
  // 如果有历史,显示最后一条 NPC 消息
  const lastNpc = [...log].reverse().find(m => m.role === 'assistant');
  if (lastNpc) {
    $('galgameText').textContent = lastNpc.content || '';
  } else if (data.greeting) {
    galgameTypewriter(data.greeting, () => {
      if (galgameState.ttsEnabled) galgameSpeak(data.greeting);
    });
    addGalgameLogEntry('npc', npcName, data.greeting);
  }
});
// ---------- 视图切换 ----------
function showView(name) {
  ['homeView', 'joinView', 'padView', 'playerView', 'hostView'].forEach(v => {
    const el = $(v);
    if (el) el.style.display = 'none';
  });
  const map = { home: 'homeView', join: 'joinView', pad: 'padView', player: 'playerView', host: 'hostView' };
  const el = $(map[name]);
  if (el) el.style.display = 'flex';
  if (name !== 'pad') padFeedOpen = false;
  // 视图切换后刷新 BGM 指示器
  if (lastState) syncBgm(lastState.bgm);
}

function renderView() {
  if (!myRole || !lastState) return;
  if (myRole === 'pad') renderPad();
  else if (myRole === 'host') renderHost();
  else if (isPlayerId(myRole)) renderPlayer();
  // BGM 同步
  syncBgm(lastState.bgm);
}

// ---------- 首页 ----------
function renderHomeOnline(online) {
  // v2.4.34: 根据本局激活玩家,过滤 home 页角色按钮
  const active = getActivePlayerIds();
  for (const pid of PLAYER_IDS) {
    const el = $('rs' + pid.charAt(0).toUpperCase() + pid.slice(1));
    const btn = document.querySelector(`.role-btn[data-role="${pid}"]`);
    if (!el || !btn) continue;
    const isActive = active.indexOf(pid) !== -1;
    // v2.4.34: 隐藏未启用的玩家位置
    if (!isActive) {
      el.textContent = '本局未启用';
      el.classList.remove('online');
      btn.classList.add('hidden');
      btn.classList.remove('taken');
      continue;
    }
    btn.classList.remove('hidden');
    if (online[pid]) {
      el.textContent = '已就位';
      el.classList.add('online');
      btn.classList.add('taken');
    } else {
      el.textContent = '空闲';
      el.classList.remove('online');
      btn.classList.remove('taken');
    }
  }
  // host / pad 不变
  for (const r of ['host', 'pad']) {
    const el = $('rs' + r.charAt(0).toUpperCase() + r.slice(1));
    const btn = document.querySelector(`.role-btn[data-role="${r}"]`);
    if (!el || !btn) continue;
    if (online[r]) {
      el.textContent = '已就位';
      el.classList.add('online');
      btn.classList.add('taken');
    } else {
      el.textContent = '空闲';
      el.classList.remove('online');
      btn.classList.remove('taken');
    }
  }
}

function bindHomeEvents() {
  $$('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.role;
      joinAs(role, false);
    });
  });
  // v2.4.32: 扫码加入按钮(主持人端)
  const qrBtn = $('homeQrBtn');
  if (qrBtn) qrBtn.addEventListener('click', showJoinQrModal);
  const qrClose = $('joinQrClose');
  if (qrClose) qrClose.addEventListener('click', () => { $('joinQrModal').style.display = 'none'; });
  // v2.4.36: 处理 /join 路径 / URL 参数
  handleJoinQueryParam();
}

// v2.4.36: 根据 URL 路径决定是否进入角色选择页
//   - 路径 = /join 或 ?from=qr  → 角色选择页(手机扫码用)
//   - 路径 = /                  → 主页(主持人/pad/玩家完整列表)
function handleJoinQueryParam() {
  try {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const fromQr = params.get('from') === 'qr' || path.indexOf('/join') === 0;
    const join = params.get('join');
    if (fromQr) {
      // 角色选择页
      initJoinView();
    } else if (join) {
      // 旧版兼容:?join=auto|p3 直接加入
      const tryJoin = () => {
        if (socket && socket.connected) {
          joinAs(join, false);
          params.delete('join');
          const newQuery = params.toString();
          const newUrl = window.location.pathname + (newQuery ? '?' + newQuery : '');
          window.history.replaceState({}, '', newUrl);
        } else {
          setTimeout(tryJoin, 300);
        }
      };
      setTimeout(tryJoin, 200);
    }
  } catch (e) { console.warn('handleJoinQueryParam error', e); }
}

// v2.4.36: 初始化角色选择页(/join)
function initJoinView() {
  // 显示 joinView(不显示 homeView)
  showView('join');
  // 隐藏 homeView(避免两个 view 同时显示)
  const homeView = $('homeView');
  if (homeView) homeView.style.display = 'none';
  // 状态
  const statusEl = $('joinStatus');
  if (statusEl) {
    statusEl.textContent = socket && socket.connected ? '已连接' : '连接中...';
    statusEl.classList.toggle('online', !!(socket && socket.connected));
    statusEl.classList.toggle('offline', !(socket && socket.connected));
  }
  // 版本号
  const verEl = $('joinVersion');
  if (verEl) verEl.textContent = 'TRPG Desk ' + (window.GAME_VERSION || 'v2.4.36');
  // 房间信息
  renderJoinRoomInfo();
  // 卡片状态
  renderJoinCards();
  // 绑定点击
  bindJoinCards();
}

function renderJoinRoomInfo() {
  const titleEl = $('joinRoomTitle');
  const metaEl = $('joinRoomMeta');
  if (!titleEl) return;
  if (!lastState) {
    titleEl.textContent = '— 房间加载中 —';
    if (metaEl) metaEl.innerHTML = '';
    return;
  }
  // 房间名 / 玩家人数 / 已就位
  const roomName = lastState.roomName || lastState.gameName || (lastState.host && lastState.host.name) || '跑团房间';
  const maxP = lastState.maxPlayers || 6;
  const online = lastState.online || {};
  const activeIds = lastState.activePlayerIds || [];
  const taken = activeIds.filter(pid => online[pid]).length;
  const free = activeIds.length - taken;
  titleEl.textContent = '🎭 ' + roomName;
  if (metaEl) {
    metaEl.innerHTML =
      '本局玩家上限:<b>' + maxP + '</b> 人 · 已就位 <b style="color:#2ecc71">' + taken + '</b> / ' + activeIds.length +
      (free > 0 ? ' · <span style="color:#f39c12">剩 ' + free + ' 个空位</span>' :
                   ' · <span style="color:#c0392b">房间已满</span>');
  }
}

function renderJoinCards() {
  if (!lastState) return;
  const activeIds = lastState.activePlayerIds || PLAYER_IDS;
  const online = lastState.online || {};
  // 玩家 1-6
  for (const pid of PLAYER_IDS) {
    const card = document.querySelector('[data-join-role="' + pid + '"]');
    if (!card) continue;
    const isActive = activeIds.indexOf(pid) !== -1;
    const isOnline = !!online[pid];
    if (!isActive) {
      card.classList.add('hidden');
      continue;
    }
    card.classList.remove('hidden');
    card.classList.toggle('taken', isOnline);
    const statusEl = card.querySelector('[data-status]');
    if (statusEl) {
      statusEl.textContent = isOnline ? '已有人' : '空闲';
      statusEl.classList.toggle('online', isOnline);
    }
  }
  // pad
  const padCard = document.querySelector('[data-join-role="pad"]');
  if (padCard) {
    const isOnline = !!online.pad;
    padCard.classList.toggle('taken', isOnline);
    const statusEl = padCard.querySelector('[data-status]');
    if (statusEl) {
      statusEl.textContent = isOnline ? '已有人' : '空闲';
      statusEl.classList.toggle('online', isOnline);
    }
  }
}

function bindJoinCards() {
  document.querySelectorAll('[data-join-role]').forEach(card => {
    if (card._binded) return;
    card._binded = true;
    card.addEventListener('click', (ev) => {
      // 防误触:如果卡片被标记为 taken,直接提示
      if (card.classList.contains('taken')) {
        showToast('该位置已被占用,请选其他角色', 'error');
        return;
      }
      const role = card.getAttribute('data-join-role');
      if (!role) return;
      // 加入并切换到对应视图
      joinAs(role, false);
    });
  });
}

// v2.4.32: 显示扫码加入弹窗(主持人)
async function showJoinQrModal() {
  const modal = $('joinQrModal');
  const qrImg = $('joinQrImg');
  const urlBox = $('joinQrUrl');
  if (!modal || !qrImg) return;
  try {
    const res = await fetch('/api/info');
    const info = await res.json();
    // v2.4.36: QR 码 URL 指向 /join(角色选择页),不再用 ?join=auto
    const baseUrl = info.joinUrl || (info.serverUrl + '/join');
    const joinUrl = baseUrl;  // 直接是 /join,客户端会渲染角色选择页
    urlBox.textContent = joinUrl;
    // 大尺寸二维码,带 URL 编码
    qrImg.src = '/api/qrcode?text=' + encodeURIComponent(joinUrl) + '&size=320';
    // v2.4.33: 填充手动 IP 列表(兑底) - 也用 /join
    const manualList = $('joinQrManualList');
    if (manualList && info.addresses) {
      manualList.innerHTML = '';
      info.addresses.forEach(addr => {
        const full = 'http://' + addr + '/join';
        const row = document.createElement('div');
        row.className = 'join-qr-manual-item';
        row.innerHTML = `<code>${addr}</code> <button class="join-qr-copy-mini" data-url="${full}">📋</button>`;
        const btn = row.querySelector('.join-qr-copy-mini');
        btn.addEventListener('click', () => {
          try { navigator.clipboard.writeText(full); showToast('✅ 已复制: ' + full, 'info'); }
          catch (e) { showToast('复制失败', 'error'); }
        });
        manualList.appendChild(row);
      });
    }
    // v2.4.36: 提示文字更新 - 现在扫码会进选择页
    const hintEl = document.querySelector('.join-qr-hint');
    if (hintEl) hintEl.textContent = '玩家用手机摄像头扫描下方二维码,会自动打开浏览器并进入角色选择页(可自己选玩家几)。';
    modal.style.display = 'flex';
  } catch (e) {
    showToast('❌ 获取房间信息失败: ' + e.message, 'error');
  }
}

function joinAs(role, isReconnect) {
  // v2.4.32: 接受 auto 模式(由服务端分配空闲位置)
  myRole = role;
  socket.emit('join', { role });
  // v2.4.34: 重连时也保存,确保最新角色被记录(熄屏唤醒用)
  try { localStorage.setItem(LS_ROLE, role); } catch (e) {}
  if (role === 'pad') {
    showView('pad');
    bindPadEvents();
    setTimeout(setupPadPieces, 100);
  } else if (role === 'host') {
    showView('host');
    bindHostEvents();
    // v2.4.30: 主持人进入后预加载图库
    setTimeout(preloadImageLibrary, 500);
  } else {
    // v2.4.32: auto 模式时还不知道真实 role,先按 player 处理;joined 事件后会重新切换
    showView('player');
    bindPlayerEvents();
    bindDiceEvents();
  }
  renderView();
}

function leaveRole() {
  socket.emit('leave');
  myRole = null;
  lastState = null;
  try { localStorage.removeItem(LS_ROLE); } catch (e) {}
  showView('home');
}

// =====================================================================
// Pad 视图
// =====================================================================
function renderPad() {
  if (!lastState) return;
  const s = lastState;
  $('padScriptTitle').textContent = s.scriptTitle || '跑团模组';

  // 回合按钮:显示当前回合玩家姓名
  renderPadTurnBtn(s);

  // 版图
  const mapImg = $('padMapImg');
  const placeholder = $('padMapPlaceholder');
  // v2.4.29: pad 版图背景也支持视频
  let padVideo = $('padMapVideo');
  if (!padVideo && mapImg && mapImg.parentNode) {
    padVideo = document.createElement('video');
    padVideo.id = 'padMapVideo';
    padVideo.muted = true;
    padVideo.loop = true;
    padVideo.autoplay = true;
    padVideo.playsInline = true;
    padVideo.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:none;background:#000;';
    mapImg.parentNode.insertBefore(padVideo, mapImg);
  }
  if (s.map && s.map.url) {
    const isVideoUrl = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(s.map.url);
    if (isVideoUrl) {
      if (padVideo) {
        if (padVideo.src !== s.map.url) padVideo.src = s.map.url;
        padVideo.style.display = 'block';
      }
      mapImg.style.display = 'none';
    } else {
      if (padVideo) { padVideo.style.display = 'none'; padVideo.removeAttribute('src'); }
      mapImg.src = s.map.url;
      mapImg.style.display = 'block';
    }
    placeholder.style.display = 'none';
  } else {
    mapImg.style.display = 'none';
    if (padVideo) { padVideo.style.display = 'none'; padVideo.removeAttribute('src'); }
    placeholder.style.display = 'flex';
  }

  // 版图内容项
  const itemsBox = $('padMapItems');
  itemsBox.innerHTML = '';
  (s.mapItems || []).forEach(item => {
    // v2.3: 线索/物品都是可拾取,共享渲染逻辑(只显示标题)
    if (item.type === 'clue' || item.type === 'clue_card' || item.type === 'item') {
      const card = document.createElement('div');
      card.className = item.type === 'item' ? 'pad-item-card' : 'pad-clue-card';
      card.style.left = (item.x * 100) + '%';
      card.style.top = (item.y * 100) + '%';
      const sc = item.scale || 1;
      card.style.transform = `translate(-50%, -50%) scale(${sc})`;
      // v2.3.1: 套用主持人分配的唯一颜色(覆盖 CSS 默认色)
      if (item.color) {
        if (item.type === 'item') {
          card.style.background = `linear-gradient(135deg, ${item.color}cc 0%, ${item.color}88 100%)`;
          card.style.borderColor = item.color;
        } else {
          card.style.background = `linear-gradient(135deg, ${item.color} 0%, ${item.color}cc 100%)`;
          card.style.borderColor = item.color;
        }
      }
      const isPlayer = isPlayerId(myRole);
      // v2.3: 必须在玩家自己的回合才能拾取
      const canPick = isPlayer && (
        item.target === myRole ||
        (item.target === 'pad' && s.turn?.current === myRole)
      );
      const labelName = item.type === 'item' ? '物品' : '线索';
      // v2.4.32: 通用化 - 任意玩家都是给该玩家
      const targetLabel = isPlayerId(item.target) ? roleLabel(item.target) : labelName;
      const turnLabel = isPlayerId(s.turn?.current) ? roleLabel(s.turn.current) : '当前玩家';
      card.title = canPick ? '点击加入背包' : (
        isPlayerId(item.target) ? `给 ${targetLabel} 的${labelName}` :
        item.target === 'pad' ? `当前回合(${turnLabel})可拾取` :
        labelName
      );
      const title = document.createElement('div');
      title.className = 'clue-card-title';
      title.textContent = item.title && item.title.trim() ? item.title : (item.type === 'item' ? '?' : '?');
      card.appendChild(title);
      // 玩家可点击加入背包
      if (canPick) {
        card.classList.add('clickable');
        card.addEventListener('click', (e) => {
          e.stopPropagation();
          // v2.3.1: 单击直接拾取(item→背包,clue→收件箱)
          if (window.__isPickingUp) return;
          window.__isPickingUp = true;
          socket.emit('player:pickupClue', { itemId: item.id });
          setTimeout(() => { window.__isPickingUp = false; }, 300);
        });
      }
      itemsBox.appendChild(card);
      return;
    }
    // v2.4: 事件类型 - 问号图标,可触发
    if (item.type === 'event') {
      const card = document.createElement('div');
      card.className = 'pad-event-card';
      card.style.left = (item.x * 100) + '%';
      card.style.top = (item.y * 100) + '%';
      const sc = item.scale || 1;
      card.style.transform = `translate(-50%, -50%) scale(${sc})`;
      if (item.color) {
        card.style.background = `linear-gradient(135deg, ${item.color} 0%, ${item.color}cc 100%)`;
        card.style.borderColor = item.color;
      }
      const icon = document.createElement('div');
      icon.className = 'pad-event-icon';
      icon.textContent = '?';
      card.appendChild(icon);
      const title = document.createElement('div');
      title.className = 'pad-event-title';
      title.textContent = item.title || '?';
      card.appendChild(title);
      const isPlayer = isPlayerId(myRole);
      const canTrigger = isPlayer && (
        item.target === myRole ||
        (item.target === 'pad' && s.turn?.current === myRole)
      );
      card.title = canTrigger ? '点击触发事件' : '事件 (请等你的回合)';
      if (canTrigger) {
        card.classList.add('clickable');
        card.addEventListener('click', (e) => {
          e.stopPropagation();
          socket.emit('player:triggerEvent', { itemId: item.id });
        });
      }
      itemsBox.appendChild(card);
      return;
    }
    // v2.4: 图片(纯装饰,不可拾)
    if (item.type === 'image' && item.imageUrl) {
      const div = document.createElement('div');
      div.className = 'pad-image-overlay';
      div.style.left = (item.x * 100) + '%';
      div.style.top = (item.y * 100) + '%';
      const sc = item.scale || 1;
      div.style.transform = `translate(-50%, -50%) scale(${sc})`;
      const img = document.createElement('img');
      img.src = item.imageUrl;
      img.alt = '';
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        openZoom({ ...item, _zoomImage: true });
      });
      div.appendChild(img);
      itemsBox.appendChild(div);
      return;
    }
    const div = document.createElement('div');
    div.className = 'pad-map-item ' + (item.type || 'text');
    div.style.left = (item.x * 100) + '%';
    div.style.top = (item.y * 100) + '%';
    const sc = item.scale || 1;
    div.style.transform = `translate(-50%, -50%) scale(${sc})`;
    if (item.title) {
      const t = document.createElement('div');
      t.className = 'item-title';
      t.textContent = item.title;
      div.appendChild(t);
    }
    if (item.body) {
      const b = document.createElement('div');
      b.className = 'item-body';
      b.textContent = item.body;
      div.appendChild(b);
    }
    if (item.imageUrl) {
      const img = document.createElement('img');
      img.className = 'item-thumb';
      img.src = item.imageUrl;
      img.alt = '';
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        openZoom({ ...item, _zoomImage: true });
      });
      div.appendChild(img);
    }
    if (item.audioUrl) {
      const a = document.createElement('audio');
      a.controls = true;
      a.src = item.audioUrl;
      div.appendChild(a);
    }
    if (item.videoUrl) {
      const v = document.createElement('video');
      v.controls = true;
      v.src = item.videoUrl;
      v.style.maxWidth = '200px';
      div.appendChild(v);
    }
    itemsBox.appendChild(div);
  });

  // 渲染 NPC
  const npcsBox = $('padNpcs');
  if (npcsBox) {
    npcsBox.innerHTML = '';
    (s.npcs || []).forEach(npc => {
      const div = document.createElement('div');
      div.className = 'pad-npc';
      div.style.left = (npc.x * 100) + '%';
      div.style.top = (npc.y * 100) + '%';
      const sc = npc.scale || 1;
      div.style.transform = `translate(-50%, -50%) scale(${sc})`;
      const ringColor = npc.color || 'var(--amber)';
      if (npc.avatar) {
        const img = document.createElement('img');
        img.src = npc.avatar;
        img.alt = '';
        img.className = 'pad-npc-avatar';
        img.style.borderColor = ringColor;
        div.appendChild(img);
      } else {
        const initial = document.createElement('div');
        initial.className = 'pad-npc-initial';
        initial.textContent = (npc.name || '?').charAt(0);
        // v2.3.1: 使用主持人分配的唯一颜色
        if (npc.color) {
          initial.style.background = `linear-gradient(135deg, ${npc.color} 0%, ${npc.color}cc 100%)`;
        }
        initial.style.borderColor = ringColor;
        div.appendChild(initial);
      }
      const name = document.createElement('div');
      name.className = 'pad-npc-name';
      name.textContent = npc.name || 'NPC';
      if (npc.color) {
        name.style.background = npc.color;
      }
      div.appendChild(name);
      // v2.4: NPC 始终可点击
      div.classList.add('clickable');
      div.addEventListener('click', () => {
        // v2.4.47: 移除原对话功能,大屏点击 NPC 仅提示
        showToast(`${npc.name}:请在玩家端与 NPC 进行 AI 对话`, 'info');
      });
      npcsBox.appendChild(div);
    });
  }

  // 棋子(带玩家信息) - v2.4.32: 6 玩家通用化
  const pubChars = s.publicCharacters || {};
  const playerMap = s.playerMap || {};
  const activeMapId = s.activeMapId;
  const hasMap = s.map && s.map.url;
  for (const pid of PLAYER_IDS) {
    const pieceEl = $('padPiece' + pid.charAt(0).toUpperCase() + pid.slice(1));
    if (!pieceEl) continue;
    const visible = hasMap && (!activeMapId || playerMap[pid] === activeMapId);
    pieceEl.style.display = visible ? 'flex' : 'none';
    if (hasMap) {
      const pe = s.pieces && s.pieces[pid];
      if (pe) { pieceEl.style.left = (pe.x * 100) + '%'; pieceEl.style.top = (pe.y * 100) + '%'; }
      const ch = pubChars[pid] || {};
      const avatarEl = $('padPiece' + pid.charAt(0).toUpperCase() + pid.slice(1) + 'Avatar');
      if (avatarEl) {
        if (ch.avatar) {
          avatarEl.innerHTML = `<img src="${ch.avatar}" alt="">`;
          avatarEl.classList.add('has-img');
        } else {
          avatarEl.innerHTML = (ch.name || pid.toUpperCase()).charAt(0);
          avatarEl.classList.remove('has-img');
        }
      }
      const labelEl = $('padPiece' + pid.charAt(0).toUpperCase() + pid.slice(1) + 'Label');
      if (labelEl) labelEl.textContent = ch.name || ('玩家 ' + pid.substring(1));
      const hpEl = $('padPiece' + pid.charAt(0).toUpperCase() + pid.slice(1) + 'Hp');
      if (hpEl) {
        if (ch.hp && ch.hp.max > 0) {
          hpEl.textContent = `❤️ ${ch.hp.current}/${ch.hp.max}`;
          hpEl.style.display = 'block';
          const ratio = ch.hp.max > 0 ? ch.hp.current / ch.hp.max : 1;
          hpEl.classList.remove('hp-high', 'hp-mid', 'hp-low');
          if (ratio > 0.5) hpEl.classList.add('hp-high');
          else if (ratio > 0.2) hpEl.classList.add('hp-mid');
          else hpEl.classList.add('hp-low');
        } else {
          hpEl.style.display = 'none';
        }
      }
    }
    // 回合高亮
    pieceEl.classList.remove('active-turn', 'not-your-turn');
    if (s.turn && s.turn.current === pid) pieceEl.classList.add('active-turn');
    else if (s.turn && s.turn.current) pieceEl.classList.add('not-your-turn');
  }

  // 投喂流
  const feed = s.padFeed || [];
  $('padFeedCount').textContent = feed.length;
  $('padFeedCount').style.display = feed.length > 0 ? 'inline-block' : 'none';
  const feedList = $('padFeedList');
  if (feed.length === 0) {
    feedList.innerHTML = '<div class="pad-feed-empty">暂无内容</div>';
  } else {
    feedList.innerHTML = '';
    feed.forEach(item => feedList.appendChild(renderPadFeedCard(item)));
  }

  // 临时大屏高亮(文字/骰子/线索)
  renderPadHighlight(s.padHighlight);

  // v2.4.18: NPC 对话弹窗
  renderPadNpcDialog(s.npcDialog);

  // v2.4.18: 地图标记(主持人标记的箭头)
  renderPadMapMarker(s.mapMarker);
}

// Pad 端:渲染"当前回合"按钮(显示当前玩家姓名,点击切到下一位)
function renderPadTurnBtn(s) {
  const el = $('padTurnCurrentName');
  const btn = $('padNextTurn');
  if (!el || !btn) return;
  const turn = s.turn || { order: ['p1', 'p2'], current: 'p1', round: 1 };
  const order = turn.order && turn.order.length ? turn.order : ['p1', 'p2'];
  const curIdx = Math.max(0, order.indexOf(turn.current));
  const nextIdx = (curIdx + 1) % order.length;
  const curId = order[curIdx];
  const nextId = order[nextIdx];
  // v2.4.32: 用 roleLabel 通用化
  const pubChars = s.publicCharacters || {};
  const curChar = pubChars[curId] || {};
  const nextChar = pubChars[nextId] || {};
  const curName = curChar.name && curChar.name.trim() ? curChar.name.trim() : (isPlayerId(curId) ? roleLabel(curId) : '当前');
  const nextName = nextChar.name && nextChar.name.trim() ? nextChar.name.trim() : (isPlayerId(nextId) ? roleLabel(nextId) : '下一位');
  el.textContent = `${curName} (第 ${turn.round || 1} 轮)`;
  el.dataset.current = curId;
  el.dataset.next = nextId;
  btn.title = `当前: ${curName}\n点击切换到 ${nextName} 的回合`;
  // 配色:按当前玩家高亮(turn-p1..turn-p6 class 由 CSS 决定)
  for (const pid of PLAYER_IDS) btn.classList.toggle('turn-' + pid, curId === pid);
}

// 临时大屏高亮(文字/骰子/线索)
let padHighlightTimer = null;
let _lastPadHighlightId = null;  // v2.1:追踪 padHighlight id 以触发提示音
let padSoundCtx = null;          // v2.1:Pad 端提示音 AudioContext

// v2.1: 播放 Pad 端收到内容时的提示音(WebAudio 合成,不依赖外部文件)
function playPadNotifySound() {
  try {
    if (!padSoundCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      padSoundCtx = new Ctx();
    }
    const ctx = padSoundCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const beep = (freq, t0, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + t0);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + t0 + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + t0 + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t0);
      osc.stop(ctx.currentTime + t0 + dur + 0.02);
    };
    beep(660, 0, 0.12);
    beep(880, 0.15, 0.18);
  } catch (e) { /* no-op */ }
}

function renderPadHighlight(h) {
  const overlay = $('padHighlight');
  const content = $('padHighlightContent');
  if (!h || !h.expiresAt || h.expiresAt <= Date.now()) {
    overlay.style.display = 'none';
    if (h && h.id) _lastPadHighlightId = h.id;
    return;
  }
  // 计算剩余时长并设置本地自动消失
  const remain = h.expiresAt - Date.now();
  if (remain <= 0) {
    overlay.style.display = 'none';
    return;
  }
  // v2.1: 新 ID 触发提示音
  if (h.id && h.id !== _lastPadHighlightId) {
    _lastPadHighlightId = h.id;
    playPadNotifySound();
  }
  overlay.style.display = 'flex';
  // 本地兜底:超过 expiresAt 自动隐藏(防止服务端广播延迟)
  clearTimeout(padHighlightTimer);
  padHighlightTimer = setTimeout(() => {
    overlay.style.display = 'none';
  }, remain + 100);
  content.className = 'pad-highlight-content type-' + (h.type || 'text');
  if (h.type === 'dice') {
    // v2.4.32: 通用化 from label
    const fromLabel = isPlayerId(h.from) ? (PLAYER_COLORS[h.from].icon + ' ' + roleLabel(h.from)) : '📢 主持人';
    const notationHtml = h.notation
      ? `<div class="ph-notation">${escapeHtml(h.notation)}</div>`
      : '';
    const detailHtml = (h.detail && h.detail.length)
      ? `<div class="ph-detail">${h.detail.map(d => {
          if (d.results.length === 1) return `D${d.sides}=${d.results[0]}`;
          return `${d.results.length}D${d.sides}=${d.sum}(${d.results.join(',')})`;
        }).join(' + ')}</div>`
      : '';
    content.innerHTML = `
      <div class="ph-dice">
        <div class="ph-from">${fromLabel} 投掷</div>
        ${notationHtml}
        ${detailHtml}
        <div class="ph-total">${h.total}</div>
      </div>
      <div class="ph-tip">点击屏幕提前关闭</div>
    `;
  } else if (h.type === 'clue') {
    const titleHtml = h.title ? `<div class="ph-title">🔍 ${escapeHtml(h.title)}</div>` : '';
    const imgHtml = h.imageUrl ? `<img class="ph-img" src="${escapeHtml(h.imageUrl)}" alt="">` : '';
    const bodyHtml = h.body ? `<div class="ph-body">${escapeHtml(h.body)}</div>` : '';
    content.innerHTML = `${titleHtml}${imgHtml}${bodyHtml}<div class="ph-tip">点击屏幕提前关闭</div>`;
  } else if (h.type === 'image') {
    const titleHtml = h.title ? `<div class="ph-title">${escapeHtml(h.title)}</div>` : '';
    const imgHtml = h.imageUrl ? `<img class="ph-img" src="${escapeHtml(h.imageUrl)}" alt="">` : '';
    content.innerHTML = `${titleHtml}${imgHtml}<div class="ph-tip">点击屏幕提前关闭</div>`;
  } else if (h.type === 'video') {
    const titleHtml = h.title ? `<div class="ph-title">${escapeHtml(h.title)}</div>` : '';
    // v2.4.23: 视频加 muted 才能在移动浏览器(iOS Safari)自动播放
    const videoHtml = h.videoUrl
      ? `<video class="ph-video" controls playsinline muted autoplay src="${escapeHtml(h.videoUrl)}"></video>`
      : '';
    content.innerHTML = `${titleHtml}${videoHtml}<div class="ph-tip">视频播放结束后自动关闭 / 点击屏幕提前关闭</div>`;
  } else if (h.type === 'audio') {
    const titleHtml = h.title ? `<div class="ph-title">${escapeHtml(h.title)}</div>` : '';
    const audioHtml = h.audioUrl
      ? `<audio class="ph-audio" controls autoplay src="${escapeHtml(h.audioUrl)}"></audio>`
      : '';
    content.innerHTML = `${titleHtml}${audioHtml}<div class="ph-tip">音频播放结束后自动关闭 / 点击屏幕提前关闭</div>`;
  } else if (h.type === 'event') {
    // v2.4: 事件高亮 - 显示图/文/视频/音频 + 效果信息
    const titleHtml = `<div class="ph-title">❓ ${escapeHtml(h.title || '事件')}</div>`;
    const imgHtml = h.imageUrl ? `<img class="ph-img" src="${escapeHtml(h.imageUrl)}" alt="">` : '';
    const bodyHtml = h.body ? `<div class="ph-body">${escapeHtml(h.body)}</div>` : '';
    // v2.4.23: 视频加 muted 才能在移动浏览器(iOS Safari)自动播放
    // v2.4.26: 用户点击视频时尝试取消静音
    const videoHtml = h.videoUrl
      ? `<video class="ph-video event-ph-video" controls autoplay muted playsinline src="${escapeHtml(h.videoUrl)}"></video>`
      : '';
    const audioHtml = h.audioUrl
      ? `<audio class="ph-audio" controls autoplay src="${escapeHtml(h.audioUrl)}"></audio>`
      : '';
    // 效果摘要
    let effectsHtml = '';
    if (h.effects && (h.effects.hp || h.effects.mp || h.effects.san)) {
      const parts = [];
      if (h.effects.hp) parts.push(`❤️ HP ${h.effects.hp > 0 ? '+' : ''}${h.effects.hp}`);
      if (h.effects.mp) parts.push(`🔵 MP ${h.effects.mp > 0 ? '+' : ''}${h.effects.mp}`);
      if (h.effects.san) parts.push(`🧠 SAN ${h.effects.san > 0 ? '+' : ''}${h.effects.san}`);
      effectsHtml = `<div class="ph-effects">⚡ 效果: ${parts.join(' · ')}</div>`;
    }
    content.innerHTML = `${titleHtml}${imgHtml}${bodyHtml}${videoHtml}${audioHtml}${effectsHtml}<div class="ph-tip">${(h.videoUrl || h.audioUrl) ? '播放结束后自动关闭 / ' : ''}点击屏幕提前关闭</div>`;
  } else {
    // text
    const titleHtml = h.title ? `<div class="ph-title">${escapeHtml(h.title)}</div>` : '';
    const bodyHtml = h.body ? `<div class="ph-body-large">${escapeHtml(h.body)}</div>` : '';
    content.innerHTML = `${titleHtml}${bodyHtml}<div class="ph-tip">点击屏幕提前关闭</div>`;
  }
  // 点击关闭
  overlay.onclick = () => {
    socket.emit('pad:closeHighlight');
  };

  // v2.4.26: 大屏视频用户点击时尝试取消静音(让用户能听到声音)
  content.querySelectorAll('video').forEach(videoEl => {
    videoEl.addEventListener('click', () => {
      try { videoEl.muted = false; } catch (e) {}
    });
    videoEl.addEventListener('play', () => {
      if (typeof _userInteracted !== 'undefined' && _userInteracted) {
        try { videoEl.muted = false; } catch (e) {}
      }
    });
  });

  // v2.4.18: 视频/音频播放结束后自动关闭
  if (h.type === 'video' || h.type === 'audio' || h.type === 'event') {
    const mediaEls = content.querySelectorAll('video, audio');
    mediaEls.forEach(media => {
      // 避免重复绑定
      if (media.__endedBound) return;
      media.__endedBound = true;
      const onEnded = () => {
        // v2.4.23: 媒体播完后,先把这条媒体推入 pad 信息流(让玩家过后还能看到)
        if (h.videoUrl || h.audioUrl) {
          try {
            socket.emit('pad:pushFeed', {
              type: h.videoUrl ? 'video' : 'audio',
              title: h.title || '媒体',
              body: h.body || '',
              imageUrl: h.imageUrl || '',
              audioUrl: h.audioUrl || '',
              videoUrl: h.videoUrl || ''
            });
          } catch (e) {}
        }
        try { socket.emit('pad:closeHighlight'); } catch (e) {}
        // v2.4.20: 播完媒体后,通知 server 从版图移除该事件 item(如果 from 是 event:xxx)
        if (h.type === 'event' && h.from && h.from.startsWith('event:')) {
          try { socket.emit('pad:eventEnded', { eventId: h.from.slice(6) }); } catch (e) {}
        }
      };
      media.addEventListener('ended', onEnded);
      // v2.4.18: 视频/音频事件高亮超过 10 分钟则强制关闭
      if (h.type === 'event' && h.videoUrl || h.audioUrl) {
        setTimeout(() => {
          if (overlay.style.display !== 'none') {
            try { socket.emit('pad:closeHighlight'); } catch (e) {}
            if (h.from && h.from.startsWith('event:')) {
              try { socket.emit('pad:eventEnded', { eventId: h.from.slice(6) }); } catch (e) {}
            }
          }
        }, 10 * 60 * 1000);
      }
    });
  }
}

// v2.4.18: 在 pad 端大屏上显示 NPC 对话(玩家点击 NPC 后,pad 显示,玩家可点 "下一条" 切换)
function renderPadNpcDialog(npcDialog) {
  const overlay = $('padNpcDialog');
  if (!overlay) return;
  if (!npcDialog || !npcDialog.dialogues || npcDialog.dialogues.length === 0) {
    overlay.style.display = 'none';
    return;
  }
  const dlg = npcDialog.dialogues[npcDialog.index] || npcDialog.dialogues[0];
  const total = npcDialog.dialogues.length;
  const idx = npcDialog.index;
  overlay.style.display = 'flex';
  const avatarHtml = npcDialog.npcAvatar
    ? `<img class="pad-npc-dialog-avatar" src="${escapeHtml(npcDialog.npcAvatar)}" alt="">`
    : `<div class="pad-npc-dialog-avatar pad-npc-initial" style="background: linear-gradient(135deg, #f1c40f, #e67e22);">${escapeHtml((npcDialog.npcName || '?').charAt(0))}</div>`;
  let bodyHtml = '';
  if (dlg.type === 'text') {
    bodyHtml = `<div class="pad-npc-dialog-body">${escapeHtml(dlg.content || '')}</div>`;
  } else if (dlg.type === 'image') {
    bodyHtml = `<img class="pad-npc-dialog-image" src="${escapeHtml(dlg.content)}" alt="">`;
  } else if (dlg.type === 'audio') {
    bodyHtml = `<audio class="pad-npc-dialog-audio" controls autoplay src="${escapeHtml(dlg.content)}"></audio>`;
  }
  const titleHtml = dlg.title ? `<div class="pad-npc-dialog-title">${escapeHtml(dlg.title)}</div>` : '';
  const navHtml = total > 1
    ? `
      <button class="pad-npc-dialog-nav" id="padNpcDialogPrev">◀ 上一条</button>
      <span class="pad-npc-dialog-counter">${idx + 1} / ${total}</span>
      <button class="pad-npc-dialog-nav" id="padNpcDialogNext">下一条 ▶</button>
    `
    : '';
  overlay.innerHTML = `
    <div class="pad-npc-dialog-card" id="padNpcDialogCard">
      <div class="pad-npc-dialog-header">
        ${avatarHtml}
        <div class="pad-npc-dialog-name">${escapeHtml(npcDialog.npcName || 'NPC')}</div>
        <button class="pad-npc-dialog-close" id="padNpcDialogClose" title="关闭">✕</button>
      </div>
      ${titleHtml}
      ${bodyHtml}
      <div class="pad-npc-dialog-footer">${navHtml}</div>
      ${total > 1 ? '<div class="pad-npc-dialog-hint">👉 点击屏幕任意位置切换下一条</div>' : ''}
    </div>
  `;
  // 事件
  const prev = $('padNpcDialogPrev');
  const next = $('padNpcDialogNext');
  if (prev) prev.onclick = (e) => { e.stopPropagation(); socket.emit('pad:nextNpcDialogue', { direction: 'prev' }); };
  if (next) next.onclick = (e) => { e.stopPropagation(); socket.emit('pad:nextNpcDialogue', { direction: 'next' }); };
  const close = $('padNpcDialogClose');
  if (close) close.onclick = (e) => { e.stopPropagation(); socket.emit('pad:closeNpcDialog'); };
  // v2.4.21: 点击卡片区域(非按钮)切换下一条
  const card = $('padNpcDialogCard');
  if (card) {
    card.onclick = (e) => {
      // 不处理按钮点击
      if (e.target.closest('button')) return;
      if (total > 1) {
        socket.emit('pad:nextNpcDialogue', { direction: 'next' });
      } else {
        // 只有一条时,直接关闭
        socket.emit('pad:closeNpcDialog');
      }
    };
  }
  // 音频播放完自动关闭
  const audioEl = overlay.querySelector('audio');
  if (audioEl && !audioEl.__endedBound) {
    audioEl.__endedBound = true;
    audioEl.addEventListener('ended', () => {
      try { socket.emit('pad:closeNpcDialog'); } catch (e) {}
    });
    // 超过 5 分钟强制关闭
    setTimeout(() => {
      if (overlay.style.display !== 'none') {
        try { socket.emit('pad:closeNpcDialog'); } catch (e) {}
      }
    }, 5 * 60 * 1000);
  }
}

// v2.4.24: 玩家端事件高亮弹窗(视频/音频/图片自动播放)
// v2.4.26: 视频自动播放必须 muted (iOS Safari),但用户首次交互后尝试取消静音
let _lastPlayerEventHighlightId = null;
let _userInteracted = false;
// v2.4.26: 监听首次用户交互,触发后尝试取消所有 autoplay 视频的 muted
function _onFirstUserInteraction() {
  if (_userInteracted) return;
  _userInteracted = true;
  // 取消所有正在播放的视频的静音(iOS Safari 解锁后允许带声音播放)
  document.querySelectorAll('video[autoplay]').forEach(v => {
    try { v.muted = false; } catch (e) {}
  });
}
if (typeof document !== 'undefined' && document.addEventListener) {
  ['touchstart', 'click', 'keydown'].forEach(ev => {
    document.addEventListener(ev, _onFirstUserInteraction, { once: false, passive: true });
  });
}

function showPlayerEventHighlight(ev) {
  if (!ev) return;
  const overlay = $('eventHighlight');
  if (!overlay) return;
  // 避免重复弹出
  if (_lastPlayerEventHighlightId === ev.id) {
    return;
  }
  _lastPlayerEventHighlightId = ev.id;
  // 填充内容
  $('eventHighlightTitle').textContent = `❓ ${ev.title || '事件'}`;
  const bodyEl = $('eventHighlightBody');
  let bodyHtml = '';
  if (ev.body) bodyHtml += `<div>${escapeHtml(ev.body)}</div>`;
  if (ev.imageUrl) bodyHtml += `<img src="${escapeHtml(ev.imageUrl)}" style="max-width:100%;border-radius:6px;margin-top:8px;">`;
  if (ev.audioUrl) bodyHtml += `<audio controls autoplay src="${escapeHtml(ev.audioUrl)}" style="width:100%;margin-top:8px;"></audio>`;
  // v2.4.26: 视频 muted 自动播放(iOS Safari 限制),用户点击视频时尝试取消静音
  if (ev.videoUrl) bodyHtml += `<video id="eventHighlightVideo" controls autoplay muted playsinline src="${escapeHtml(ev.videoUrl)}" style="width:100%;max-height:50vh;border-radius:6px;margin-top:8px;"></video>`;
  bodyEl.innerHTML = bodyHtml;
  // 效果
  const fxEl = $('eventHighlightEffects');
  if (ev.effects && (ev.effects.hp || ev.effects.mp || ev.effects.san)) {
    const parts = [];
    if (ev.effects.hp) parts.push(`HP ${ev.effects.hp > 0 ? '+' : ''}${ev.effects.hp}`);
    if (ev.effects.mp) parts.push(`MP ${ev.effects.mp > 0 ? '+' : ''}${ev.effects.mp}`);
    if (ev.effects.san) parts.push(`SAN ${ev.effects.san > 0 ? '+' : ''}${ev.effects.san}`);
    fxEl.textContent = '⚡ ' + parts.join(' / ');
    fxEl.style.display = 'block';
  } else {
    fxEl.style.display = 'none';
  }
  // meta
  $('eventHighlightMeta').textContent = new Date(ev.ts || Date.now()).toLocaleTimeString();
  // 显示
  overlay.style.display = 'flex';
  // 关闭按钮
  $('eventHighlightClose').onclick = () => {
    overlay.style.display = 'none';
    _lastPlayerEventHighlightId = null;
  };
  // 媒体播完自动关闭
  const mediaEls = overlay.querySelectorAll('video, audio');
  mediaEls.forEach(m => {
    if (m.__endedBound) return;
    m.__endedBound = true;
    m.addEventListener('ended', () => {
      overlay.style.display = 'none';
      _lastPlayerEventHighlightId = null;
    });
  });
  // v2.4.26: 用户点击视频时尝试取消静音(让用户能听到声音)
  const v = overlay.querySelector('#eventHighlightVideo');
  if (v) {
    v.addEventListener('click', () => {
      try { v.muted = false; } catch (e) {}
    });
    v.addEventListener('play', () => {
      if (_userInteracted) { try { v.muted = false; } catch (e) {} }
    });
  }
  // 点击背景关闭
  overlay.onclick = (e) => {
    if (e.target.classList && e.target.classList.contains('event-highlight-backdrop')) {
      overlay.style.display = 'none';
      _lastPlayerEventHighlightId = null;
    }
  };
  // 10 分钟兜底关闭
  setTimeout(() => {
    if (_lastPlayerEventHighlightId === ev.id) {
      overlay.style.display = 'none';
      _lastPlayerEventHighlightId = null;
    }
  }, 10 * 60 * 1000);
}

// v2.4.24: 玩家端 NPC 对话流(地图下方,galgame 风格,点击卡片切换下一条)
function renderPlayerNpcDialog(npcDialog) {
  const overlay = $('playerNpcDialog');
  if (!overlay) return;
  if (!npcDialog || !npcDialog.dialogues || npcDialog.dialogues.length === 0) {
    overlay.style.display = 'none';
    overlay.innerHTML = '';
    return;
  }
  // v2.4.26: 在对话卡片上方加一个明显的标识,让用户知道这是 NPC 对话区
  const sectionLabel = '<div class="player-npc-dialog-label">💬 NPC 对话</div>';
  const dlg = npcDialog.dialogues[npcDialog.index] || npcDialog.dialogues[0];
  const total = npcDialog.dialogues.length;
  const idx = npcDialog.index;
  overlay.style.display = 'block';
  const avatarHtml = npcDialog.npcAvatar
    ? `<img class="player-npc-dialog-avatar" src="${escapeHtml(npcDialog.npcAvatar)}" alt="">`
    : `<div class="player-npc-dialog-avatar player-npc-initial" style="background: linear-gradient(135deg, #f1c40f, #e67e22);">${escapeHtml((npcDialog.npcName || '?').charAt(0))}</div>`;
  let bodyHtml = '';
  if (dlg.type === 'text') {
    bodyHtml = `<div class="player-npc-dialog-body">${escapeHtml(dlg.content || '')}</div>`;
  } else if (dlg.type === 'image') {
    bodyHtml = `<img class="player-npc-dialog-image" src="${escapeHtml(dlg.content)}" alt="">`;
  } else if (dlg.type === 'audio') {
    bodyHtml = `<audio class="player-npc-dialog-audio" controls autoplay src="${escapeHtml(dlg.content)}"></audio>`;
  } else if (dlg.type === 'video') {
    bodyHtml = `<video class="player-npc-dialog-video" controls autoplay muted playsinline src="${escapeHtml(dlg.content)}"></video>`;
  }
  // v2.4.25: 对话标题默认就是 NPC 名字,不再单独显示 dialogue.title
  const counterHtml = total > 1
    ? `<div class="player-npc-dialog-counter">${idx + 1} / ${total}</div>`
    : '';
  overlay.innerHTML = sectionLabel + `
    <div class="player-npc-dialog-card" id="playerNpcDialogCard">
      <div class="player-npc-dialog-header">
        ${avatarHtml}
        <div class="player-npc-dialog-info">
          <div class="player-npc-dialog-name">${escapeHtml(npcDialog.npcName || 'NPC')}</div>
        </div>
        <button class="player-npc-dialog-close" id="playerNpcDialogClose" title="关闭">✕</button>
      </div>
      <div class="player-npc-dialog-body-wrap">${bodyHtml}</div>
      ${counterHtml}
      ${total > 1 ? '<div class="player-npc-dialog-hint">👉 点击卡片切换下一条</div>' : ''}
    </div>
  `;
  const close = $('playerNpcDialogClose');
  if (close) close.onclick = (e) => { e.stopPropagation(); socket.emit('pad:closeNpcDialog'); };
  // 点击卡片:切换下一条/关闭
  const card = $('playerNpcDialogCard');
  if (card) {
    card.onclick = (e) => {
      if (e.target.closest('button, audio, video')) return;
      if (total > 1) {
        socket.emit('pad:nextNpcDialogue', { direction: 'next' });
      } else {
        socket.emit('pad:closeNpcDialog');
      }
    };
  }
  // 音频播完自动关闭
  const audioEl = overlay.querySelector('audio');
  if (audioEl && !audioEl.__endedBound) {
    audioEl.__endedBound = true;
    audioEl.addEventListener('ended', () => {
      try { socket.emit('pad:closeNpcDialog'); } catch (e) {}
    });
  }
}

// v2.4.18: 主持人在版图上点击位置打标记(箭头/圆形),几秒后自动消失
function renderPadMapMarker(marker) {
  const layer = $('padMapMarkerLayer');
  if (!layer) return;
  layer.innerHTML = '';
  if (!marker || !marker.expiresAt || marker.expiresAt <= Date.now()) {
    return;
  }
  const div = document.createElement('div');
  div.className = 'pad-map-marker';
  div.style.left = (marker.x * 100) + '%';
  div.style.top = (marker.y * 100) + '%';
  div.style.color = marker.color || '#e74c3c';
  div.innerHTML = `<div class="pad-map-marker-pulse"></div><div class="pad-map-marker-arrow">▼</div>`;
  layer.appendChild(div);
  // 本地兜底:超过 expiresAt 自动移除
  const remain = Math.max(0, marker.expiresAt - Date.now());
  setTimeout(() => {
    if (layer.contains(div)) layer.removeChild(div);
  }, remain + 100);
}

function renderPadFeedCard(item) {
  const div = document.createElement('div');
  div.className = 'pad-feed-card ' + (item.type || 'text');
  // v2.4.32: 通用化 from 标签
  let from = '📢 主持人';
  if (isPlayerId(item.from)) from = PLAYER_COLORS[item.from].icon + ' ' + roleLabel(item.from);
  else if (item.from === 'kp') from = '🎩 主持人';
  else if (typeof item.from === 'string' && item.from.startsWith('event:')) from = '❓ 事件';
  else if (typeof item.from === 'string' && item.from.startsWith('npc:')) from = '💬 NPC';
  else if (item.from === 'dice') from = '🎲 骰子';
  else if (item.from) from = '📢 主持人';
  const fromHtml = `<div class="feed-from">${escapeHtml(from)}</div>`;
  let main = '';
  if (item.type === 'dice') {
    // 骰子结果:大字 + emoji + modifier
    const d = (item.detail && item.detail[0]) || { sides: '?', results: [], sum: 0 };
    const modHtml = item.modifier ? `<span class="dice-mod">${item.modifier > 0 ? '+' : ''}${item.modifier}</span>` : '';
    main = `<div class="dice-result">
        <span class="dice-emoji">🎲</span>
        <span class="dice-total">${item.total}</span>
        ${modHtml}
      </div>
      <div class="dice-detail">${escapeHtml(formatDiceText(item))}</div>`;
  } else {
    const titleHtml = item.title ? `<div class="feed-title">${escapeHtml(item.title)}</div>` : '';
    const bodyHtml = item.body ? `<div class="feed-body">${escapeHtml(item.body)}</div>` : '';
    const imgHtml = item.imageUrl ? `<img class="feed-img" src="${escapeHtml(item.imageUrl)}" alt="">` : '';
    const audioHtml = item.audioUrl ? `<audio class="feed-audio" controls src="${escapeHtml(item.audioUrl)}"></audio>` : '';
    const videoHtml = item.videoUrl ? `<video class="feed-video" controls src="${escapeHtml(item.videoUrl)}"></video>` : '';
    main = titleHtml + bodyHtml + imgHtml + audioHtml + videoHtml;
  }
  // Pad 端没有 pin 按钮(只有 host 有);Pad 关闭按钮
  div.innerHTML = fromHtml + main + `<button class="feed-close" data-close="${item.id}">✕</button>`;
  div.querySelector('.feed-close').addEventListener('click', (e) => {
    e.stopPropagation();
    socket.emit('pad:closeFeed', { feedId: item.id });
  });
  if (item.type === 'image' && item.imageUrl) {
    const img = div.querySelector('.feed-img');
    if (img) img.addEventListener('click', () => openZoom({ ...item, _zoomImage: true }));
  }
  if (item.type === 'video' && item.videoUrl) {
    const v = div.querySelector('.feed-video');
    if (v) v.addEventListener('click', (e) => {
      // 点击视频时如果还没播放,就打开放大(否则不干扰原生控制)
      if (v.paused) {
        e.preventDefault();
        openZoom({ ...item, _zoomVideo: true });
      }
    });
  }
  return div;
}

function formatDiceText(item) {
  if (!item.detail) return '';
  const parts = item.detail.map(d => {
    if (d.results.length === 1) return `D${d.sides}=${d.results[0]}`;
    return `${d.results.length}D${d.sides}=${d.sum}(${d.results.join(',')})`;
  });
  let s = parts.join('+');
  if (item.modifier) s += item.modifier > 0 ? `+${item.modifier}` : `${item.modifier}`;
  return s;
}

function bindPadEvents() {
  if ($('padExit').dataset.bound) return;
  $('padExit').dataset.bound = '1';
  $('padExit').addEventListener('click', leaveRole);
  $('padToggleFeed').addEventListener('click', () => {
    padFeedOpen = !padFeedOpen;
    $('padFeed').classList.toggle('open', padFeedOpen);
  });
  $('padFeedClose').addEventListener('click', () => {
    padFeedOpen = false;
    $('padFeed').classList.remove('open');
  });
  $('padFullscreen').addEventListener('click', () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  });
  // v2.4.45: Pad 端 AI 对话浮窗折叠/展开
  bindPadAiChatEvents();
  // v2.0:下一回合按钮
  $('padNextTurn').addEventListener('click', () => {
    socket.emit('pad:nextTurn');
  });
  // v2.0:关闭模态背景
  $$('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', (e) => {
      if (e.target === ov) ov.style.display = 'none';
    });
  });
  $$('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.close;
      if (id) $(id).style.display = 'none';
    });
  });
  // 线索卡拾取
  $('clueCardPickupBtn').addEventListener('click', () => {
    if (window.__currentClueCard) {
      socket.emit('player:pickupClue', { itemId: window.__currentClueCard.id });
      $('clueCardModal').style.display = 'none';
      window.__currentClueCard = null;
    }
  });
  bindZoomEvents();
}

function openClueCardModal(item) {
  window.__currentClueCard = item;
  $('clueCardTitle').textContent = item.title || '线索';
  const body = $('clueCardBody');
  body.innerHTML = '';
  if (item.imageUrl) {
    const img = document.createElement('img');
    img.src = item.imageUrl;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '300px';
    body.appendChild(img);
  }
  if (item.body) {
    const text = document.createElement('div');
    text.textContent = item.body;
    text.style.marginTop = '12px';
    text.style.whiteSpace = 'pre-wrap';
    body.appendChild(text);
  }
  if (!item.imageUrl && !item.body) {
    body.innerHTML = '<div class="modal-empty">该线索没有额外内容</div>';
  }
  $('clueCardModal').style.display = 'flex';
}

// =====================================================================
// v2.4.45: NPC AI 对话 - Galgame 风格全屏对话框(手机端玩家)
// =====================================================================
const galgameState = {
  active: false,
  npcId: null,
  npcName: '',
  npcAvatar: '',
  thinking: false,
  ttsEnabled: false,
  recognizing: false,
  recognition: null,
  typewriterTimer: null,
  // v2.4.46: 语音音色
  npcGender: 'neutral',
  npcAge: 'adult',
  shared: false
};

function openGalgameDialog(npc) {
  const overlay = $('galgameDialog');
  if (!overlay) return;
  galgameState.active = true;
  galgameState.npcId = npc.id;
  galgameState.npcName = npc.name || 'NPC';
  galgameState.npcAvatar = npc.avatar || '';
  galgameState.thinking = false;
  // v2.4.46: 语音音色 + 共享模式
  galgameState.npcGender = npc.aiGender || 'neutral';
  galgameState.npcAge = npc.aiAge || 'adult';
  galgameState.shared = !!npc.aiSharedChat;

  // 名称
  $('galgameNpcName').textContent = galgameState.npcName;

  // 立绘
  const charImg = $('galgameCharImg');
  const charPh = $('galgameCharPlaceholder');
  if (galgameState.npcAvatar) {
    charImg.src = galgameState.npcAvatar;
    charImg.style.display = 'block';
    charPh.style.display = 'none';
  } else {
    charImg.style.display = 'none';
    charPh.style.display = 'flex';
    charPh.textContent = (galgameState.npcName || '?').charAt(0);
  }

  // 背景图(用版图作为背景)
  const bg = overlay.querySelector('.galgame-bg');
  if (bg && lastState && lastState.map && lastState.map.url) {
    bg.style.backgroundImage = `url("${lastState.map.url}")`;
  } else {
    bg.style.backgroundImage = '';
  }

  // 清空对话框 + 隐藏思考
  $('galgameText').textContent = '';
  $('galgameText').classList.remove('is-typing');
  hideGalgameThinking();
  // 清空对话记录
  $('galgameChatLog').innerHTML = '';
  $('galgameChatLog').style.display = 'none';
  // 输入框
  $('galgameInput').value = '';
  setGalgameSendEnabled(true);

  // 显示
  overlay.style.display = 'flex';

  // 请求历史对话
  socket.emit('player:getNpcChatHistory', { npcId: npc.id });

  // 绑定事件(只绑一次)
  bindGalgameEvents();

  // 自动聚焦输入框
  setTimeout(() => { try { $('galgameInput').focus(); } catch (e) {} }, 300);
}

function closeGalgameDialog() {
  const overlay = $('galgameDialog');
  if (!overlay) return;
  overlay.style.display = 'none';
  galgameState.active = false;
  galgameState.npcId = null;
  galgameState.thinking = false;
  // 停止打字机
  if (galgameState.typewriterTimer) {
    clearInterval(galgameState.typewriterTimer);
    galgameState.typewriterTimer = null;
  }
  // 停止语音识别
  if (galgameState.recognition && galgameState.recognizing) {
    try { galgameState.recognition.stop(); } catch (e) {}
  }
  // 停止 TTS
  if (galgameState.ttsEnabled) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }
}

let galgameEventsBound = false;
function bindGalgameEvents() {
  if (galgameEventsBound) return;
  galgameEventsBound = true;

  // 关闭
  $('galgameCloseBtn').addEventListener('click', closeGalgameDialog);
  // 发送
  $('galgameSendBtn').addEventListener('click', sendGalgameMessage);
  $('galgameInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendGalgameMessage();
    }
  });
  // 语音输入
  $('galgameVoiceBtn').addEventListener('click', toggleGalgameVoice);
  // TTS 朗读
  $('galgameTtsBtn').addEventListener('click', toggleGalgameTts);
  // 对话记录
  $('galgameLogBtn').addEventListener('click', toggleGalgameLog);
  const logClose = $('galgameChatLogClose');
  if (logClose) logClose.addEventListener('click', toggleGalgameLog);
  // v2.4.47: NPC 商店
  const shopBtn = $('galgameShopBtn');
  if (shopBtn) shopBtn.addEventListener('click', toggleGalgameShop);
  const shopClose = $('galgameShopClose');
  if (shopClose) shopClose.addEventListener('click', toggleGalgameShop);
  // v2.4.49: 商店手动刷新按钮
  const shopRefresh = $('galgameShopRefresh');
  if (shopRefresh && !shopRefresh.dataset.bound) {
    shopRefresh.dataset.bound = '1';
    shopRefresh.addEventListener('click', () => {
      renderGalgameShop();
      showToast('🔄 商店已刷新');
    });
  }
}

// v2.4.47: NPC 商店面板开关
function toggleGalgameShop() {
  const shop = $('galgameShop');
  if (!shop) return;
  if (shop.style.display === 'none' || !shop.style.display) {
    renderGalgameShop();
    shop.style.display = 'flex';
  } else {
    shop.style.display = 'none';
  }
}

// v2.4.47: 渲染 NPC 商店
function renderGalgameShop() {
  if (!galgameState.npcId) return;
  const npc = findNpcById(galgameState.npcId);
  const body = $('galgameShopBody');
  const nameEl = $('galgameShopNpcName');
  const goldEl = $('galgameShopMyGold');
  if (!body) return;
  if (nameEl) nameEl.textContent = galgameState.npcName || (npc && npc.name) || 'NPC';
  // 我的金币
  const myGold = (lastState && lastState.character && lastState.character.gold) || 0;
  if (goldEl) goldEl.textContent = myGold;
  body.innerHTML = '';
  // v2.4.49: 调试日志 - 检查 NPC 和 shop 数据
  console.log('[shop] renderGalgameShop npcId:', galgameState.npcId, 'npc found:', !!npc, 'shop:', npc ? npc.shop : 'N/A');
  const shop = Array.isArray(npc && npc.shop) ? npc.shop : [];
  if (shop.length === 0) {
    body.innerHTML = '<div class="galgame-shop-empty">该 NPC 没有出售的商品</div>';
    return;
  }
  shop.forEach(item => {
    const card = document.createElement('div');
    card.className = 'galgame-shop-item';
    // v2.4.48: 用金币图标 + 库存图标显示,而不是纯文字
    const stockIcon = item.stock === -1 ? '∞' : item.stock;
    const stockLabel = item.stock === -1 ? '无限' : '库存';
    const imgHtml = item.imageUrl
      ? `<img class="galgame-shop-item-img" src="${escapeHtml(item.imageUrl)}" alt="">`
      : `<div class="galgame-shop-item-img placeholder">📦</div>`;
    const canAfford = myGold >= item.price && (item.stock === -1 || item.stock > 0);
    const buyBtnText = !canAfford
      ? (myGold < item.price ? '金币不足' : '已售罄')
      : `🛒 购买`;
    card.innerHTML = `
      ${imgHtml}
      <div class="galgame-shop-item-info">
        <div class="galgame-shop-item-title">${escapeHtml(item.title || '商品')}</div>
        ${item.body ? `<div class="galgame-shop-item-body">${escapeHtml(item.body).slice(0, 100)}</div>` : ''}
        <div class="galgame-shop-item-meta">
          <span class="galgame-shop-item-price">🪙 ${item.price}</span>
          <span class="galgame-shop-item-stock">📦 ${stockIcon} ${stockLabel}</span>
        </div>
      </div>
      <button class="galgame-shop-item-buy" ${canAfford ? '' : 'disabled'}>${buyBtnText}</button>
    `;
    const buyBtn = card.querySelector('.galgame-shop-item-buy');
    if (buyBtn && canAfford) {
      buyBtn.addEventListener('click', () => {
        if (!galgameState.npcId) return;
        socket.emit('player:buyNpcItem', { npcId: galgameState.npcId, itemId: item.id });
        // 购买后刷新商店(服务器会 broadcastAll,触发 renderView → renderGalgameShop)
      });
    }
    body.appendChild(card);
  });
}

function sendGalgameMessage() {
  if (!galgameState.active || !galgameState.npcId) return;
  if (galgameState.thinking) return showToast('正在等待回复,请稍等…', 'info');
  const input = $('galgameInput');
  const msg = (input.value || '').trim();
  if (!msg) return;
  input.value = '';
  setGalgameSendEnabled(false);
  // 本地立即显示玩家消息
  $('galgameText').classList.remove('is-typing');
  $('galgameText').textContent = msg;
  addGalgameLogEntry('user', '我', msg);
  // 发送到服务器(无论 AI 是否启用,服务器都会处理)
  socket.emit('player:chatNpc', { npcId: galgameState.npcId, message: msg });
}

function setGalgameSendEnabled(enabled) {
  const btn = $('galgameSendBtn');
  if (btn) btn.disabled = !enabled;
  const input = $('galgameInput');
  if (input) input.disabled = !enabled;
}

function showGalgameThinking() {
  const t = $('galgameThinking');
  if (t) t.style.display = 'flex';
  const txt = $('galgameText');
  if (txt) txt.textContent = '';
  setGalgameSendEnabled(false);
}

function hideGalgameThinking() {
  const t = $('galgameThinking');
  if (t) t.style.display = 'none';
  setGalgameSendEnabled(true);
}

// 打字机效果
function galgameTypewriter(text, onDone) {
  const el = $('galgameText');
  if (!el) return;
  if (galgameState.typewriterTimer) {
    clearInterval(galgameState.typewriterTimer);
    galgameState.typewriterTimer = null;
  }
  el.textContent = '';
  el.classList.add('is-typing');
  const chars = Array.from(text || '');
  let i = 0;
  // 跳过动画直接显示完整文本(点击对话框时)
  const skip = () => {
    if (galgameState.typewriterTimer) {
      clearInterval(galgameState.typewriterTimer);
      galgameState.typewriterTimer = null;
      el.textContent = text;
      el.classList.remove('is-typing');
      el.removeEventListener('click', skip);
      if (onDone) onDone();
    }
  };
  el.addEventListener('click', skip);
  galgameState.typewriterTimer = setInterval(() => {
    if (i >= chars.length) {
      clearInterval(galgameState.typewriterTimer);
      galgameState.typewriterTimer = null;
      el.classList.remove('is-typing');
      el.removeEventListener('click', skip);
      if (onDone) onDone();
      return;
    }
    el.textContent += chars[i++];
  }, 35);
}

// 对话记录
function addGalgameLogEntry(type, name, text) {
  const log = $('galgameChatLogBody') || $('galgameChatLog');
  if (!log) return;
  const item = document.createElement('div');
  item.className = 'log-item ' + (type === 'user' ? 'log-user' : 'log-npc');
  item.innerHTML = `<div class="log-name">${escapeHtml(name)}</div>${escapeHtml(text)}`;
  log.appendChild(item);
  log.scrollTop = log.scrollHeight;
}

function toggleGalgameLog() {
  const log = $('galgameChatLog');
  if (!log) return;
  const isShown = log.style.display !== 'none';
  log.style.display = isShown ? 'none' : 'flex';
  if (!isShown) {
    const body = $('galgameChatLogBody');
    if (body) body.scrollTop = body.scrollHeight;
  }
}

// 语音输入(Web Speech API)
// v2.4.48: 改进麦克风权限处理 - 先请求 getUserMedia 权限,再启动识别
function toggleGalgameVoice() {
  const btn = $('galgameVoiceBtn');
  if (!btn) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    showToast('当前浏览器不支持语音输入,请用 Chrome/Edge/Safari', 'warn');
    return;
  }
  // v2.4.48: 检查是否在 HTTPS 或 localhost 环境下(移动端必须 HTTPS)
  const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const isHttps = location.protocol === 'https:';
  if (!isLocalhost && !isHttps) {
    showToast('⚠️ 语音识别需要 HTTPS 环境或 localhost 访问。手机端请通过 localhost 或配置 HTTPS 访问', 'warn');
    return;
  }
  if (galgameState.recognizing) {
    try { galgameState.recognition.stop(); } catch (e) {}
    return;
  }
  // v2.4.48: 先请求麦克风权限(getUserMedia),触发浏览器权限弹窗
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('浏览器不支持麦克风权限请求', 'error');
    return;
  }
  showToast('🎤 正在请求麦克风权限…', 'info');
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
      // 权限获取成功,停止音轨(不需要实际录音,只是为了触发权限)
      stream.getTracks().forEach(t => t.stop());
      // 启动语音识别
      startSpeechRecognition(SR, btn);
    })
    .catch((err) => {
      console.warn('[麦克风权限] denied:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        showToast('❌ 麦克风权限被拒绝。请点击地址栏的🔒图标,允许麦克风权限后重试', 'error');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        showToast('❌ 未找到麦克风设备', 'error');
      } else {
        showToast('❌ 麦克风权限错误: ' + (err.message || err.name), 'error');
      }
    });
}

function startSpeechRecognition(SR, btn) {
  const rec = new SR();
  rec.lang = 'zh-CN';
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  galgameState.recognition = rec;
  let finalText = '';
  let lastInterim = '';
  rec.onstart = () => {
    galgameState.recognizing = true;
    btn.classList.add('is-recording');
    showToast('🎤 正在聆听…(再次点击按钮停止)', 'info');
  };
  rec.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const transcript = e.results[i][0].transcript;
      if (e.results[i].isFinal) {
        finalText += transcript;
      } else {
        interim += transcript;
      }
    }
    const input = $('galgameInput');
    if (input) {
      input.value = finalText + interim;
      lastInterim = interim;
    }
  };
  rec.onerror = (e) => {
    console.warn('[语音识别] error:', e.error);
    if (e.error === 'no-speech') return;
    if (e.error === 'aborted') return;
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      showToast('麦克风权限被拒绝,请在浏览器设置中允许', 'error');
      galgameState.recognizing = false;
      btn.classList.remove('is-recording');
      return;
    }
    if (e.error === 'network') {
      showToast('语音识别网络错误,请检查网络', 'error');
      return;
    }
    showToast('语音识别错误: ' + (e.error || '未知'), 'warn');
  };
  rec.onend = () => {
    galgameState.recognizing = false;
    btn.classList.remove('is-recording');
    const input = $('galgameInput');
    if (input && finalText && !input.value.trim()) {
      input.value = finalText;
    }
  };
  try {
    rec.start();
  } catch (e) {
    console.warn('[语音识别] start failed:', e);
    showToast('无法启动语音识别: ' + e.message, 'error');
    galgameState.recognizing = false;
    btn.classList.remove('is-recording');
  }
}

// TTS 语音朗读
function toggleGalgameTts() {
  const btn = $('galgameTtsBtn');
  if (!btn) return;
  galgameState.ttsEnabled = !galgameState.ttsEnabled;
  btn.classList.toggle('is-active', galgameState.ttsEnabled);
  if (galgameState.ttsEnabled) {
    showToast('🔊 已开启语音朗读', 'info');
    // 立即朗读当前文本
    const txt = $('galgameText').textContent;
    if (txt) galgameSpeak(txt);
  } else {
    try { window.speechSynthesis.cancel(); } catch (e) {}
    showToast('🔇 已关闭语音朗读', 'info');
  }
}

function galgameSpeak(text) {
  if (!text || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    // v2.4.47: 根据性别/年龄调整音色,确保至少 4 种明显不同的声音
    // (男年轻 / 男年老 / 女年轻 / 女年老)
    const gender = galgameState.npcGender || 'neutral';
    const age = galgameState.npcAge || 'adult';
    if (gender === 'male') {
      // 男性:低 pitch,年老更低更慢
      u.pitch = age === 'old' ? 0.5 : (age === 'young' ? 0.85 : 0.7);
      u.rate = age === 'old' ? 0.8 : (age === 'young' ? 1.05 : 0.95);
    } else if (gender === 'female') {
      // 女性:高 pitch,年老稍低更慢,年轻更高更活泼
      u.pitch = age === 'old' ? 0.8 : (age === 'young' ? 1.5 : 1.2);
      u.rate = age === 'old' ? 0.85 : (age === 'young' ? 1.1 : 1.0);
    } else {
      // 中性:成年默认
      u.pitch = 1.0;
      u.rate = 1.0;
    }
    // v2.4.47: 尝试选择匹配的中文语音(更精确的男/女声匹配)
    const voices = window.speechSynthesis.getVoices() || [];
    const zhVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('zh'));
    if (zhVoices.length > 0) {
      // 优先选与性别匹配的语音(部分浏览器语音名含 male/female/男/女)
      const matchVoice = zhVoices.find(v => {
        const name = (v.name || '').toLowerCase();
        if (gender === 'male') {
          return name.includes('male') || name.includes('男') || name.includes('yunxi') || name.includes('yunyang');
        }
        if (gender === 'female') {
          return name.includes('female') || name.includes('女') || name.includes('xiaoxiao') || name.includes('xiaoyi');
        }
        return false;
      });
      if (matchVoice) {
        u.voice = matchVoice;
        // 选到精确语音后,pitch 调整幅度减小(语音本身已有性别特征)
        if (gender === 'male') {
          u.pitch = age === 'old' ? 0.7 : (age === 'young' ? 0.95 : 0.85);
        } else if (gender === 'female') {
          u.pitch = age === 'old' ? 0.9 : (age === 'young' ? 1.3 : 1.1);
        }
      } else if (zhVoices.length > 0) {
        // 没匹配到性别语音,用第一个中文语音 + pitch 调整
        u.voice = zhVoices[0];
      }
    }
    window.speechSynthesis.speak(u);
  } catch (e) {
    console.warn('[galgameSpeak] TTS failed:', e);
  }
}

// =====================================================================
// v2.4.45: Pad 端 NPC AI 对话浮窗
// =====================================================================
function appendPadAiChatMsg(data) {
  const box = $('padAiChatBox');
  const body = $('padAiChatBody');
  if (!box || !body) return;
  box.style.display = 'flex';
  // 清空空状态提示
  const empty = body.querySelector('.pad-ai-chat-empty');
  if (empty) empty.remove();
  const msg = document.createElement('div');
  const isUser = data.type === 'user';
  msg.className = 'pad-ai-chat-msg ' + (isUser ? 'msg-user' : 'msg-npc');
  const playerName = isPlayerId(data.playerId) ? roleLabel(data.playerId) : (data.playerId || '玩家');
  const meta = isUser ? `${playerName} → ${data.npcName || 'NPC'}` : `${data.npcName || 'NPC'} → ${playerName}`;
  msg.innerHTML = `<div class="msg-meta">${escapeHtml(meta)}</div>${escapeHtml(data.message || '')}`;
  body.appendChild(msg);
  body.scrollTop = body.scrollHeight;
  // 限制最多保留 50 条
  while (body.children.length > 50) body.removeChild(body.firstChild);
}

function bindPadAiChatEvents() {
  const box = $('padAiChatBox');
  if (!box || box.dataset.bound) return;
  box.dataset.bound = '1';
  // 折叠/展开
  const header = $('padAiChatHeader') || box.querySelector('.pad-ai-chat-header');
  const toggle = $('padAiChatToggle');
  if (header) {
    header.addEventListener('click', (e) => {
      if (e.target === toggle) return;
      box.classList.toggle('is-collapsed');
    });
  }
  if (toggle) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      box.classList.toggle('is-collapsed');
      toggle.textContent = box.classList.contains('is-collapsed') ? '+' : '—';
    });
  }
}

// v2.4.48: NPC 监控弹窗相关函数已移除(openNpcMonitorModal/populateNpcMonitorMapSelect/
//   bindNpcMonitorEvents/switchNpcMonitorTab),改为在 NPC 卡片内联展示

function findNpcById(npcId) {
  if (!lastState) return null;
  // v2.4.48: 玩家端没有 maps 字段,只有 npcs 数组(当前版图上的 NPC)
  if (Array.isArray(lastState.npcs)) {
    const found = lastState.npcs.find(n => n.id === npcId);
    if (found) return found;
  }
  // host 端有 maps 字段
  if (Array.isArray(lastState.maps)) {
    for (const m of lastState.maps) {
      const found = (m.npcs || []).find(n => n.id === npcId);
      if (found) return found;
    }
  }
  return null;
}

// v2.4.48: 渲染 NPC 卡片内联对话记录(根据 npcId 定位到正确的卡片)
function renderNpcCardChat(data) {
  const list = document.querySelector(`.npc-card-chat-list[data-chat-list="${data.npcId}"]`);
  if (!list) return;
  list.innerHTML = '';
  const logs = data.logs || {};
  const keys = Object.keys(logs);
  if (keys.length === 0 || keys.every(k => logs[k].length === 0)) {
    list.innerHTML = '<div class="npc-monitor-empty">暂无对话记录</div>';
    return;
  }
  keys.forEach(key => {
    const log = logs[key];
    if (log.length === 0) return;
    // 标题:共享模式用"共享对话",否则用玩家名
    const title = key === '_shared' ? '👥 共享对话' : (key === '_all' ? '📢 全体' : roleLabel(key));
    const group = document.createElement('div');
    group.className = 'npc-monitor-chat-group';
    const head = document.createElement('div');
    head.className = 'npc-monitor-chat-group-head';
    head.textContent = title;
    group.appendChild(head);
    log.forEach(m => {
      const item = document.createElement('div');
      const isUser = m.role === 'user';
      item.className = 'npc-monitor-chat-item ' + (isUser ? 'msg-user' : 'msg-npc');
      const label = isUser ? (m.from ? roleLabel(m.from) : '玩家') : (m.hostInjected ? '🎭 主持人' : 'NPC');
      const time = new Date(m.ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      item.innerHTML = `<span class="msg-meta">${escapeHtml(label)} · ${time}</span><div class="msg-text">${escapeHtml(m.content || '')}</div>`;
      group.appendChild(item);
    });
    list.appendChild(group);
  });
  list.scrollTop = list.scrollHeight;
}

// v2.4.48: 实时追加单条 AI 对话消息到 NPC 卡片的对话区(npcAiChat 事件用)
function appendNpcCardChatMsg(data) {
  const list = document.querySelector(`.npc-card-chat-list[data-chat-list="${data.npcId}"]`);
  if (!list) return;
  // 清除空状态提示
  const empty = list.querySelector('.npc-monitor-empty');
  if (empty) empty.remove();
  // 确定分组 key(共享模式用 _shared,否则用玩家 ID)
  const npc = findNpcById(data.npcId);
  const groupKey = (npc && npc.aiSharedChat) ? '_shared' : (data.playerId || '_all');
  // 查找或创建分组
  let group = list.querySelector(`.npc-monitor-chat-group[data-key="${groupKey}"]`);
  if (!group) {
    group = document.createElement('div');
    group.className = 'npc-monitor-chat-group';
    group.dataset.key = groupKey;
    const head = document.createElement('div');
    head.className = 'npc-monitor-chat-group-head';
    head.textContent = groupKey === '_shared' ? '👥 共享对话' : (groupKey === '_all' ? '📢 全体' : roleLabel(groupKey));
    group.appendChild(head);
    list.appendChild(group);
  }
  // 追加消息
  const isUser = data.type === 'user';
  const item = document.createElement('div');
  item.className = 'npc-monitor-chat-item ' + (isUser ? 'msg-user' : 'msg-npc');
  const label = isUser ? (data.playerId ? roleLabel(data.playerId) : '玩家') : 'NPC';
  const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  item.innerHTML = `<span class="msg-meta">${escapeHtml(label)} · ${time}</span><div class="msg-text">${escapeHtml(data.message || '')}</div>`;
  group.appendChild(item);
  list.scrollTop = list.scrollHeight;
}
socket.on('npcClue', (data) => {
  if (!isPlayerId(myRole)) return;
  // 显示线索卡
  if ($('clueCardTitle')) $('clueCardTitle').textContent = '🔍 ' + (data.title || '线索');
  if ($('clueCardBody')) {
    $('clueCardBody').innerHTML = `<div style="margin-bottom:8px;color:#d4a574;font-size:13px;">${escapeHtml(data.npcName || 'NPC')} 给了你一个线索:</div>${escapeHtml(data.body || '')}`;
  }
  if ($('clueCardModal')) $('clueCardModal').style.display = 'flex';
  // 加入背包按钮
  const pickupBtn = $('clueCardPickupBtn');
  if (pickupBtn) {
    pickupBtn.onclick = () => {
      socket.emit('player:pickupClue', { title: data.title, body: data.body, from: data.npcName });
      $('clueCardModal').style.display = 'none';
      showToast('✅ 已加入背包');
    };
  }
});

// 主持人收到对话历史(v2.4.48: 路由到对应 NPC 卡片的对话区)
socket.on('npcChatLogForHost', (data) => {
  renderNpcCardChat(data);
});

// v2.4.47: 已移除原 openNpcDialogModal 函数(玩家点击 NPC 触发的旧对话功能)
// 现在统一使用 AI 对话(galgame 风格),主持人可在 NPC 管理中开启

// 棋子拖拽
function setupPadPieces() {
  // v2.4.32: 用 PLAYER_IDS 循环绑定所有玩家
  PLAYER_IDS.forEach(pid => {
    // padPieceP1..P6
    const el = $('padPiece' + pid.charAt(0).toUpperCase() + pid.slice(1));
    if (!el || el.dataset.drag) return;
    el.dataset.drag = '1';
    el.addEventListener('mousedown', (e) => startPieceDrag(e, pid, el));
    el.addEventListener('touchstart', (e) => startPieceDrag(e, pid, el), { passive: false });
  });
}

function startPieceDrag(e, pid, el) {
  if (!lastState || !lastState.map || !lastState.map.url) return;
  // v2.1: 只能拖动当前回合玩家的棋子
  const turn = lastState.turn || { current: 'p1' };
  if (turn.current !== pid) {
    const turnLabel = isPlayerId(turn.current) ? roleLabel(turn.current) : (turn.current || '当前');
    showToast(`现在是 ${turnLabel} 的回合才能移动`, 'warn');
    return;
  }
  e.preventDefault();
  const stage = $('padStage');
  const rect = stage.getBoundingClientRect();
  const pieceRect = el.getBoundingClientRect();
  const point = e.touches ? e.touches[0] : e;
  const offX = (point.clientX - pieceRect.left) - pieceRect.width / 2;
  const offY = (point.clientY - pieceRect.top) - pieceRect.height / 2;
  dragState = { kind: 'pad-piece', id: pid, stageRect: rect, offX, offY, el };

  const move = (ev) => {
    if (!dragState) return;
    const pt = ev.touches ? ev.touches[0] : ev;
    const x = (pt.clientX - dragState.stageRect.left - dragState.offX) / dragState.stageRect.width;
    const y = (pt.clientY - dragState.stageRect.top - dragState.offY) / dragState.stageRect.height;
    const cx = Math.max(0, Math.min(1, x));
    const cy = Math.max(0, Math.min(1, y));
    dragState.el.style.left = (cx * 100) + '%';
    dragState.el.style.top = (cy * 100) + '%';
    dragState.lastX = cx;
    dragState.lastY = cy;
  };
  const end = () => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', end);
    document.removeEventListener('touchmove', move);
    document.removeEventListener('touchend', end);
    if (dragState && dragState.lastX != null) {
      socket.emit('pad:movePiece', { playerId: dragState.id, x: dragState.lastX, y: dragState.lastY });
    }
    dragState = null;
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', end);
  document.addEventListener('touchmove', move, { passive: false });
  document.addEventListener('touchend', end);
}

// =====================================================================
// 玩家视图
// =====================================================================
function renderPlayer() {
  if (!lastState) return;
  const s = lastState;
  // v2.4.32: 用 PLAYER_COLORS 通用化(任意玩家)
  const pc = (isPlayerId(myRole) && PLAYER_COLORS[myRole]) || { color: '#999', icon: '⚪', label: 'P?' };
  $('playerEmoji').textContent = pc.icon;
  $('playerName').textContent = '玩家 ' + (isPlayerId(myRole) ? myRole.substring(1) : '?');
  $('playerScriptTitle').textContent = s.scriptTitle || '跑团模组';

  // 线索(原"收件箱",统一展示主持人推送 + 玩家互发 + 从版图拾取的线索)
  const list = s.privateContent || [];
  const listEl = $('playerList');
  const emptyEl = $('playerEmpty');
  if (list.length === 0) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';
    listEl.innerHTML = '';
    list.forEach(item => listEl.appendChild(renderPlayerCard(item)));
  }

  // 分享:发送目标下拉框(隐藏自己) - v2.4.32: 6 玩家通用
  const targetSel = $('playerShareTarget');
  if (targetSel) {
    targetSel.innerHTML = '';
    for (const pid of PLAYER_IDS) {
      if (pid === myRole) continue;
      const pcc = PLAYER_COLORS[pid];
      const opt = document.createElement('option');
      opt.value = pid;
      opt.textContent = pcc.icon + ' 玩家 ' + pid.substring(1);
      targetSel.appendChild(opt);
    }
  }

  // v2.2: 玩家端版图
  renderPlayerMap(s);

  // v2.4: 玩家版图徽章
  const myMapId = s.currentMapId || (s.playerMap && s.playerMap[myRole]);
  const myMap = (s.maps || []).find(m => m.id === myMapId) || (s.maps || [])[0];
  const badge = $('playerMapBadge');
  if (badge && myMap) {
    badge.textContent = '🗺️ ' + (myMap.name || '未命名版图');
    badge.style.display = '';
  }

  // 角色卡
  renderPlayerChar(s.character || {});

  // 背包
  renderPlayerBag(s.backpack || []);

  // v2.4.35: 渲染"别人给我看的"线索副本(在 inbox 区,不占用背包空间)
  renderPlayerViewedClues(s.viewedClues || []);

  // 笔记
  renderPlayerNote(s.note || '');

  // v2.4.24: 玩家端 NPC 对话流(地图下方)
  renderPlayerNpcDialog(s.npcDialog);

  // v2.4.48: 如果商店面板打开,实时刷新(主持人加商品/玩家购买后同步)
  if (galgameState.active && galgameState.npcId && $('galgameShop') && $('galgameShop').style.display !== 'none') {
    renderGalgameShop();
  }
}

// v2.2: 玩家端版图(可移动棋子 / 拾取线索 / 触发NPC)
function renderPlayerMap(s) {
  if (!myRole || !isPlayerId(myRole)) return;
  const stage = $('playerMapStage');
  if (!stage) return;
  const mapImg = $('playerMapImg');
  const placeholder = $('playerMapPlaceholder');
  const itemsBox = $('playerMapItems');
  const npcsBox = $('playerMapNpcs');
  const piece = $('playerMapPiece');
  // v2.4.29: 玩家端版图背景也支持视频
  let mapVideo = $('playerMapVideo');
  if (!mapVideo && mapImg && mapImg.parentNode) {
    mapVideo = document.createElement('video');
    mapVideo.id = 'playerMapVideo';
    mapVideo.muted = true;
    mapVideo.loop = true;
    mapVideo.autoplay = true;
    mapVideo.playsInline = true;
    mapVideo.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:none;background:#000;';
    mapImg.parentNode.insertBefore(mapVideo, mapImg);
  }
  // 版图
  if (s.map && s.map.url) {
    const isVideoUrl = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(s.map.url);
    if (isVideoUrl) {
      if (mapVideo) {
        if (mapVideo.src !== s.map.url) mapVideo.src = s.map.url;
        mapVideo.style.display = 'block';
      }
      mapImg.style.display = 'none';
    } else {
      if (mapVideo) {
        mapVideo.style.display = 'none';
        mapVideo.removeAttribute('src');
      }
      if (mapImg.src !== s.map.url) mapImg.src = s.map.url;
      mapImg.style.display = 'block';
    }
    placeholder.style.display = 'none';
  } else {
    mapImg.style.display = 'none';
    if (mapVideo) { mapVideo.style.display = 'none'; mapVideo.removeAttribute('src'); }
    placeholder.style.display = 'flex';
    if (piece) piece.style.display = 'none';
    itemsBox.innerHTML = '';
    npcsBox.innerHTML = '';
    return;
  }
  // 棋子
  const myPiece = s.pieces && s.pieces[myRole];
  if (myPiece) {
    piece.style.display = 'flex';
    piece.style.left = (myPiece.x * 100) + '%';
    piece.style.top = (myPiece.y * 100) + '%';
    const ch = s.publicCharacters && s.publicCharacters[myRole] || {};
    const avatar = $('playerMapPieceAvatar');
    // v2.4.32: 通用化 - 用 PLAYER_COLORS
    const myPc = isPlayerId(myRole) ? PLAYER_COLORS[myRole] : { icon: '⚪', label: 'P?' };
    if (ch.avatar) {
      avatar.innerHTML = `<img src="${ch.avatar}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    } else {
      avatar.textContent = (ch.name || myPc.label).charAt(0);
    }
    $('playerMapPieceLabel').textContent = ch.name || (isPlayerId(myRole) ? roleLabel(myRole) : '玩家');
    const hp = $('playerMapPieceHp');
    if (ch.hp && ch.hp.max > 0) {
      hp.textContent = `❤️ ${ch.hp.current}/${ch.hp.max}`;
      hp.style.display = 'block';
    } else {
      hp.style.display = 'none';
    }
    // 回合标记
    const turn = s.turn && s.turn.current;
    piece.classList.remove('active-turn', 'not-your-turn');
    if (turn) {
      if (turn === myRole) piece.classList.add('active-turn');
      else piece.classList.add('not-your-turn');
    }
    // 拖动:玩家随时可以拖动自己的棋子(无回合限制,与 pad 端行为一致)
    if (!piece.dataset.drag) {
      piece.dataset.drag = '1';
      piece.addEventListener('mousedown', (e) => startPlayerPieceDrag(e, myRole, piece, stage));
      piece.addEventListener('touchstart', (e) => startPlayerPieceDrag(e, myRole, piece, stage), { passive: false });
    }
  } else {
    piece.style.display = 'none';
  }
  // 版图内容项
  itemsBox.innerHTML = '';
  (s.mapItems || []).forEach(item => {
    // v2.3: 线索/物品都是可拾取,共享渲染逻辑(只显示标题)
    if (item.type === 'clue' || item.type === 'clue_card' || item.type === 'item') {
      const card = document.createElement('div');
      card.className = item.type === 'item' ? 'pad-item-card' : 'pad-clue-card';
      card.style.left = (item.x * 100) + '%';
      card.style.top = (item.y * 100) + '%';
      const sc = item.scale || 1;
      card.style.transform = `translate(-50%, -50%) scale(${sc})`;
      // v2.3.1: 套用主持人分配的唯一颜色
      if (item.color) {
        if (item.type === 'item') {
          card.style.background = `linear-gradient(135deg, ${item.color}cc 0%, ${item.color}88 100%)`;
          card.style.borderColor = item.color;
        } else {
          card.style.background = `linear-gradient(135deg, ${item.color} 0%, ${item.color}cc 100%)`;
          card.style.borderColor = item.color;
        }
      }
      // v2.3: 必须在玩家自己的回合才能拾取
      const canPick = item.target === myRole ||
        (item.target === 'pad' && s.turn && s.turn.current === myRole);
      const labelName = item.type === 'item' ? '物品' : '线索';
      // v2.4.32: 通用化 tooltip
      const targetLabel = isPlayerId(item.target) ? roleLabel(item.target) : labelName;
      const turnLabel2 = isPlayerId(s.turn?.current) ? roleLabel(s.turn.current) : '当前';
      card.title = canPick ? '点击拾取加入背包' : (
        isPlayerId(item.target) ? `${targetLabel} 的${labelName}` :
        item.target === 'pad' ? `当前回合(${turnLabel2})可拾取` :
        labelName
      );
      const title = document.createElement('div');
      title.className = 'clue-card-title';
      title.textContent = item.title && item.title.trim() ? item.title : '?';
      card.appendChild(title);
      if (canPick) {
        card.classList.add('clickable');
        card.addEventListener('click', (e) => {
          e.stopPropagation();
          // v2.3.1: 单击直接拾取(item→背包,clue→收件箱)
          if (window.__isPickingUp) return;
          window.__isPickingUp = true;
          socket.emit('player:pickupClue', { itemId: item.id });
          setTimeout(() => { window.__isPickingUp = false; }, 300);
        });
      }
      itemsBox.appendChild(card);
      return;
    }
    // v2.4: 事件 - 问号图标
    if (item.type === 'event') {
      const card = document.createElement('div');
      card.className = 'pad-event-card';
      card.style.left = (item.x * 100) + '%';
      card.style.top = (item.y * 100) + '%';
      const sc = item.scale || 1;
      card.style.transform = `translate(-50%, -50%) scale(${sc})`;
      if (item.color) {
        card.style.background = `linear-gradient(135deg, ${item.color} 0%, ${item.color}cc 100%)`;
        card.style.borderColor = item.color;
      }
      const icon = document.createElement('div');
      icon.className = 'pad-event-icon';
      icon.textContent = '?';
      card.appendChild(icon);
      const title = document.createElement('div');
      title.className = 'pad-event-title';
      title.textContent = item.title || '?';
      card.appendChild(title);
      const canTrigger = item.target === myRole ||
        (item.target === 'pad' && s.turn && s.turn.current === myRole);
      card.title = canTrigger ? '点击触发事件' : '事件 (请等你的回合)';
      if (canTrigger) {
        card.classList.add('clickable');
        card.addEventListener('click', (e) => {
          e.stopPropagation();
          socket.emit('player:triggerEvent', { itemId: item.id });
        });
      }
      itemsBox.appendChild(card);
      return;
    }
    // v2.4: 图片叠加
    // v2.4.27: 如果图片配了 switchMapId,玩家点击图片会切换到目标版图(棋子不跟)
    if (item.type === 'image' && item.imageUrl) {
      const div = document.createElement('div');
      div.className = 'pad-image-overlay';
      div.style.left = (item.x * 100) + '%';
      div.style.top = (item.y * 100) + '%';
      const sc = item.scale || 1;
      div.style.transform = `translate(-50%, -50%) scale(${sc})`;
      const img = document.createElement('img');
      img.src = item.imageUrl;
      img.alt = '';
      // v2.4.27: 如果有 switchMapId,提示切换版图
      if (item.switchMapId) {
        const targetMap = (s.maps || []).find(m => m.id === item.switchMapId);
        img.title = targetMap ? `点击切换到「${targetMap.name}」` : '点击切换版图';
        img.classList.add('clickable');
        img.addEventListener('click', (e) => {
          e.stopPropagation();
          // v2.4.27: 玩家点击图片 → 切换版图(棋子不跟)
          socket.emit('player:clickMapItem', { itemId: item.id });
        });
      } else {
        img.addEventListener('click', (e) => {
          e.stopPropagation();
          openZoom({ ...item, _zoomImage: true });
        });
      }
      div.appendChild(img);
      itemsBox.appendChild(div);
      return;
    }
    // v2.4.29: 视频叠加(类似图片,但用 video 标签)
    if (item.type === 'video' && item.videoUrl) {
      const div = document.createElement('div');
      div.className = 'pad-video-overlay';
      div.style.left = (item.x * 100) + '%';
      div.style.top = (item.y * 100) + '%';
      const sc = item.scale || 1;
      div.style.transform = `translate(-50%, -50%) scale(${sc})`;
      const v = document.createElement('video');
      v.src = item.videoUrl;
      v.autoplay = true;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.style.cssText = 'max-width:240px;max-height:240px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.4);background:#000;display:block;';
      if (item.switchMapId) {
        const targetMap = (s.maps || []).find(m => m.id === item.switchMapId);
        v.title = targetMap ? `点击切换到「${targetMap.name}」` : '点击切换版图';
        v.classList.add('clickable');
        v.addEventListener('click', (e) => {
          e.stopPropagation();
          socket.emit('player:clickMapItem', { itemId: item.id });
        });
      }
      div.appendChild(v);
      itemsBox.appendChild(div);
      return;
    }
    const div = document.createElement('div');
    div.className = 'pad-map-item ' + (item.type || 'text');
    div.style.left = (item.x * 100) + '%';
    div.style.top = (item.y * 100) + '%';
    const sc = item.scale || 1;
    div.style.transform = `translate(-50%, -50%) scale(${sc})`;
    if (item.title) {
      const t = document.createElement('div');
      t.className = 'item-title';
      t.textContent = item.title;
      div.appendChild(t);
    }
    if (item.body) {
      const b = document.createElement('div');
      b.className = 'item-body';
      b.textContent = item.body;
      div.appendChild(b);
    }
    if (item.imageUrl) {
      const img = document.createElement('img');
      img.className = 'item-thumb';
      img.src = item.imageUrl;
      img.alt = '';
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        openZoom({ ...item, _zoomImage: true });
      });
      div.appendChild(img);
    }
    itemsBox.appendChild(div);
  });
  // NPC
  npcsBox.innerHTML = '';
  (s.npcs || []).forEach(npc => {
    const div = document.createElement('div');
    div.className = 'pad-npc';
    div.style.left = (npc.x * 100) + '%';
    div.style.top = (npc.y * 100) + '%';
    const sc = npc.scale || 1;
    div.style.transform = `translate(-50%, -50%) scale(${sc})`;
    const ringColor = npc.color || 'var(--amber)';
    if (npc.avatar) {
      const img = document.createElement('img');
      img.src = npc.avatar;
      img.alt = '';
      img.className = 'pad-npc-avatar';
      img.style.borderColor = ringColor;
      div.appendChild(img);
    } else {
      const initial = document.createElement('div');
      initial.className = 'pad-npc-initial';
      initial.textContent = (npc.name || '?').charAt(0);
      if (npc.color) {
        initial.style.background = `linear-gradient(135deg, ${npc.color} 0%, ${npc.color}cc 100%)`;
      }
      initial.style.borderColor = ringColor;
      div.appendChild(initial);
    }
    const name = document.createElement('div');
    name.className = 'pad-npc-name';
    name.textContent = npc.name || 'NPC';
    if (npc.color) {
      name.style.background = npc.color;
    }
    div.appendChild(name);
    // v2.4: NPC 始终可点击
    // v2.4.48: 无论是否启用 AI 对话,都打开 galgame 风格对话界面
    // 未启用 AI 时,主持人手动回复(和干预效果类似)
    div.classList.add('clickable');
    div.addEventListener('click', () => {
      openGalgameDialog(npc);
    });
    npcsBox.appendChild(div);
  });
}

// v2.2: 玩家端棋子拖动
function startPlayerPieceDrag(e, pid, el, stage) {
  if (!lastState || !lastState.map || !lastState.map.url) return;
  // v2.3: 只能在当前回合拖动自己的棋子
  const turn = lastState.turn || { current: 'p1' };
  if (turn.current !== pid) {
    const turnLabel = isPlayerId(turn.current) ? roleLabel(turn.current) : (turn.current || '当前');
    showToast(`现在是 ${turnLabel} 的回合才能移动`, 'warn');
    return;
  }
  e.preventDefault();
  const rect = stage.getBoundingClientRect();
  const pieceRect = el.getBoundingClientRect();
  const point = e.touches ? e.touches[0] : e;
  const offX = (point.clientX - pieceRect.left) - pieceRect.width / 2;
  const offY = (point.clientY - pieceRect.top) - pieceRect.height / 2;
  dragState = { kind: 'player-piece', id: pid, stageRect: rect, offX, offY, el };

  const move = (ev) => {
    if (!dragState) return;
    const pt = ev.touches ? ev.touches[0] : ev;
    const x = (pt.clientX - dragState.stageRect.left - dragState.offX) / dragState.stageRect.width;
    const y = (pt.clientY - dragState.stageRect.top - dragState.offY) / dragState.stageRect.height;
    const cx = Math.max(0, Math.min(1, x));
    const cy = Math.max(0, Math.min(1, y));
    dragState.el.style.left = (cx * 100) + '%';
    dragState.el.style.top = (cy * 100) + '%';
    dragState.lastX = cx;
    dragState.lastY = cy;
  };
  const end = () => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', end);
    document.removeEventListener('touchmove', move);
    document.removeEventListener('touchend', end);
    if (dragState && dragState.lastX != null) {
      socket.emit('pad:movePiece', { playerId: dragState.id, x: dragState.lastX, y: dragState.lastY });
    }
    dragState = null;
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', end);
  document.addEventListener('touchmove', move, { passive: false });
  document.addEventListener('touchend', end);
}

function renderPlayerChar(c) {
  // 头像
  const avatarImg = $('charAvatar');
  const avatarPh = $('charAvatarPlaceholder');
  if (c.avatar) {
    avatarImg.src = c.avatar;
    avatarImg.style.display = 'block';
    avatarPh.style.display = 'none';
  } else {
    avatarImg.style.display = 'none';
    avatarPh.style.display = 'flex';
  }
  if ($('charName') && document.activeElement !== $('charName')) $('charName').value = c.name || '';
  if ($('charGender') && document.activeElement !== $('charGender')) $('charGender').value = c.gender || '';
  if ($('charIntro') && document.activeElement !== $('charIntro')) $('charIntro').value = c.intro || '';
  // HP/MP/SAN - v2.4.21: 默认 10/10
  if ($('charHpCur') && document.activeElement !== $('charHpCur')) $('charHpCur').value = c.hp?.current ?? 10;
  if ($('charHpMax') && document.activeElement !== $('charHpMax')) $('charHpMax').value = c.hp?.max ?? 10;
  if ($('charMpCur') && document.activeElement !== $('charMpCur')) $('charMpCur').value = c.mp?.current ?? 10;
  if ($('charMpMax') && document.activeElement !== $('charMpMax')) $('charMpMax').value = c.mp?.max ?? 10;
  if ($('charSanCur') && document.activeElement !== $('charSanCur')) $('charSanCur').value = c.san?.current ?? 10;
  if ($('charSanMax') && document.activeElement !== $('charSanMax')) $('charSanMax').value = c.san?.max ?? 10;
  // v2.4.31: 金币(初始 100,边界 0~999999)
  if ($('charGold') && document.activeElement !== $('charGold')) $('charGold').value = c.gold ?? 100;
  // 属性列表
  renderPlayerAttrs(c.attributes || []);
  // v2.4.30: 技能列表
  renderPlayerSkills(c.skills || []);
}

function renderPlayerSkills(skills) {
  const box = $('charSkillsList');
  if (!box) return;
  box.innerHTML = '';
  if (!skills.length) {
    const hint = document.createElement('div');
    hint.className = 'char-skill-empty';
    hint.textContent = '暂无技能,使用下方"快速添加"或"+ 添加技能"按钮';
    hint.style.cssText = 'color:#888;font-size:12px;padding:6px 0;font-style:italic;';
    box.appendChild(hint);
    return;
  }
  skills.forEach((s, idx) => {
    const row = document.createElement('div');
    row.className = 'char-skill-row';
    row.innerHTML = `
      <input class="host-input char-skill-name" type="text" value="${escapeHtml(s.name || '')}" maxlength="30" data-idx="${idx}" placeholder="技能名(可中英)">
      <input class="host-input-num char-skill-val" type="number" value="${Number.isFinite(parseInt(s.value)) ? parseInt(s.value) : 0}" data-idx="${idx}" title="COC: 1-100, DND: +N">
      <input class="host-input char-skill-group" type="text" value="${escapeHtml(s.group || '')}" maxlength="20" data-idx="${idx}" placeholder="分类(可选)" list="charSkillGroupList-${idx}">
      <button class="mini-del char-skill-del" data-idx="${idx}" title="删除该技能">×</button>
    `;
    // 注入 datalist(供分类自动补全)
    const groups = Array.from(new Set(skills.map(x => x.group).filter(Boolean)));
    const dlId = `charSkillGroupList-${idx}`;
    let dl = row.querySelector('datalist');
    if (!dl) {
      dl = document.createElement('datalist');
      dl.id = dlId;
      groups.forEach(g => { const o = document.createElement('option'); o.value = g; dl.appendChild(o); });
      row.appendChild(dl);
    }
    box.appendChild(row);
  });
}

function renderPlayerAttrs(attrs) {
  const box = $('charAttrsList');
  if (!box) return;
  box.innerHTML = '';
  attrs.forEach((a, idx) => {
    const row = document.createElement('div');
    row.className = 'char-attr-row';
    row.innerHTML = `<input class="host-input char-attr-name" type="text" value="${escapeHtml(a.name || '')}" maxlength="30" data-idx="${idx}">
      <input class="host-input-num char-attr-val" type="number" value="${Number.isFinite(parseInt(a.value)) ? parseInt(a.value) : 0}" data-idx="${idx}">
      <button class="mini-del" data-del-attr="${idx}">×</button>`;
    box.appendChild(row);
  });
  // 绑定删除按钮
  box.querySelectorAll('[data-del-attr]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.delAttr);
      const list = (lastState.character && lastState.character.attributes) || [];
      if (idx < 0 || idx >= list.length) return;
      const newAttrs = list.slice();
      newAttrs.splice(idx, 1);
      socket.emit('player:setCharacter', { attributes: newAttrs });
    });
  });
}

function renderPlayerBag(bag) {
  const list = $('playerBagList');
  const empty = $('playerBagEmpty');
  if (!list) return;
  list.innerHTML = '';
  // v2.4.47: 防御性处理 - bag 可能不是数组
  if (!Array.isArray(bag)) bag = [];
  // 玩家交易目标 - 列出所有在线玩家(排除自己)
  const myRole2 = isPlayerId(myRole) ? myRole : 'p1';
  const onlinePlayers = PLAYER_IDS.filter(p => p !== myRole2 && lastState && lastState.online && lastState.online[p]);
  const myGold = (lastState && lastState.character && lastState.character.gold) || 0;
  if (bag.length === 0) {
    if (empty) empty.style.display = 'block';
  } else {
    if (empty) empty.style.display = 'none';
    bag.forEach(item => {
      const d = document.createElement('div');
      d.className = 'player-bag-item' + (item.type === 'item' ? ' bag-item' : ' bag-clue');
      const isItem = item.type === 'item';
      const icon = isItem ? '🎒' : '🔍';
      const titleHtml = `<div class="bag-title">${icon} ${escapeHtml(item.title || (isItem ? '未命名物品' : '未命名线索'))}</div>`;
      const imgHtml = item.imageUrl ? `<img class="bag-img" src="${escapeHtml(item.imageUrl)}" alt="">` : '';
      // 物品/线索都支持 图片+音频+视频
      const audioHtml = item.audioUrl ? `<audio controls src="${escapeHtml(item.audioUrl)}" class="bag-media"></audio>` : '';
      const videoHtml = item.videoUrl ? `<video controls src="${escapeHtml(item.videoUrl)}" class="bag-media"></video>` : '';
      // 物品不显示 body 文本
      const bodyHtml = (item.body && !isItem) ? `<div class="bag-body">${escapeHtml(item.body)}</div>` : '';
      // 来源标签
      const fromHtml = item.from === 'trade'
        ? `<div class="bag-from">🤝 来自 ${isPlayerId(item.tradedFrom) ? roleLabel(item.tradedFrom) : (item.tradedFrom || '其他玩家')}</div>`
        : (item.from === 'host' ? `<div class="bag-from">🎁 主持人赠送</div>`
        : (item.from === 'map' ? `<div class="bag-from">🗺️ 从版图拾取</div>` : ''));
      const timeHtml = item.pickedAt ? `<div class="bag-time">📅 ${fmtTime(item.pickedAt)}</div>` : '';
      // v2.4.35: 物品 = 转赠/卖给/交易 (3个按钮 + 金币输入)
      //          线索 = 转赠/给看 (2个按钮,无金币输入)
      const itemId = escapeHtml(item.id);
      let actionsHtml;
      if (onlinePlayers.length === 0) {
        actionsHtml = `<div class="bag-no-target">无其他在线玩家可交易</div>`;
      } else {
        const optPlayer = (p) => {
          const pc = PLAYER_COLORS[p];
          const label = (pc && pc.icon) ? (pc.icon + ' 玩家 ' + p.substring(1)) : ('玩家 ' + p.substring(1));
          return `<option value="${p}">${label}</option>`;
        };
        const opts = onlinePlayers.map(optPlayer).join('');
        if (isItem) {
          // 物品: 目标 + 金币 + 3个按钮 (转赠/卖给/交易)
          actionsHtml = `<div class="bag-trade-grid bag-trade-item">` +
            `<select class="bag-trade-target" data-item="${itemId}">${opts}</select>` +
            `<input class="bag-trade-gold" data-gold="${itemId}" type="number" min="1" max="999999" placeholder="💰 金币" value="10">` +
            `<button class="mini-trade" data-trade-give="${itemId}" title="免费转赠物品(自己会失去)">🤝 转赠</button>` +
            `<button class="mini-trade" data-trade-sell="${itemId}" title="以金币卖给目标(你获得金币,失去物品)">💰 卖给</button>` +
            `<button class="mini-trade" data-trade-swap="${itemId}" title="用此物品换对方背包中的某个物品">🔄 交易</button>` +
            `</div>`;
        } else {
          // 线索: 目标 + 2个按钮 (转赠/给看)
          actionsHtml = `<div class="bag-trade-grid bag-trade-clue">` +
            `<select class="bag-trade-target" data-item="${itemId}">${opts}</select>` +
            `<button class="mini-trade" data-trade-give="${itemId}" title="免费转赠线索(自己会失去)">🤝 转赠</button>` +
            `<button class="mini-trade" data-trade-show="${itemId}" title="让目标看一眼(自己保留)">👁️ 给看</button>` +
            `</div>`;
        }
      }
      d.innerHTML = titleHtml + imgHtml + bodyHtml + audioHtml + videoHtml + fromHtml + timeHtml +
        `<div class="bag-actions">` + actionsHtml + `<button class="mini-del" data-discard="${itemId}">🗑️ 丢弃</button></div>`;
      d.querySelector('[data-discard]').addEventListener('click', () => {
        if (confirm(isItem ? '丢弃这件物品?' : '丢弃这条线索?')) socket.emit('player:discardClue', { clueId: item.id });
      });
      const getTarget = (root) => {
        const sel = root.querySelector('.bag-trade-target');
        return sel ? sel.value : '';
      };
      const getGold = (root) => {
        const inp = root.querySelector('.bag-trade-gold');
        return inp ? parseInt(inp.value, 10) || 0 : 0;
      };
      // 转赠 (玩家给玩家,免费,失去)
      const tradeGive = d.querySelector('[data-trade-give]');
      if (tradeGive) tradeGive.addEventListener('click', () => {
        const target = getTarget(d); if (!target) return showToast('请选择目标玩家', 'error');
        const sel = d.querySelector('.bag-trade-target');
        const labelText = sel.options[sel.selectedIndex].text;
        if (confirm(`确认把「${item.title || (isItem ? '物品' : '线索')}」转赠给${labelText}? (你将失去这个)`)) {
          socket.emit('player:tradeItem', { itemId: item.id, target });
        }
      });
      // 卖给 (玩家给玩家,需金币,失去物品,获得金币)
      const tradeSell = d.querySelector('[data-trade-sell]');
      if (tradeSell) tradeSell.addEventListener('click', () => {
        const target = getTarget(d); if (!target) return showToast('请选择目标玩家', 'error');
        const gold = getGold(d);
        if (!gold || gold <= 0) return showToast('请填写金币数(>0)', 'error');
        const sel = d.querySelector('.bag-trade-target');
        const labelText = sel.options[sel.selectedIndex].text;
        const tgtState = lastState && lastState.publicCharacters && lastState.publicCharacters[target];
        const tgtGold = (tgtState && typeof tgtState.gold === 'number') ? tgtState.gold : '?';
        if (confirm(`确认把「${item.title || '物品'}」以 ${gold} 💰 卖给${labelText}?(目标当前 ${tgtGold} 💰)`)) {
          socket.emit('player:tradeItemForGold', { itemId: item.id, target, gold });
        }
      });
      // 交易 (物换物)
      const tradeSwap = d.querySelector('[data-trade-swap]');
      if (tradeSwap) tradeSwap.addEventListener('click', () => {
        const target = getTarget(d); if (!target) return showToast('请选择目标玩家', 'error');
        // 弹出选择对方物品的对话框
        showSwapItemPicker(item, target);
      });
      // 给看 (线索专用)
      const tradeShow = d.querySelector('[data-trade-show]');
      if (tradeShow) tradeShow.addEventListener('click', () => {
        const target = getTarget(d); if (!target) return showToast('请选择目标玩家', 'error');
        const sel = d.querySelector('.bag-trade-target');
        const labelText = sel.options[sel.selectedIndex].text;
        if (confirm(`让${labelText}查看「${item.title || '线索'}」?(你自己仍保留副本)`)) {
          socket.emit('player:showClue', { itemId: item.id, target });
        }
      });
      list.appendChild(d);
    });
  }

  // v2.4.34: 渲染"赠金币"独立区域
  renderPlayerGoldPanel(bag, onlinePlayers);

  // v2.4.19: 渲染玩家聊天日志
  renderPlayerChatLog();
}

// v2.4.35: 物换物 - 弹出选择对方物品的对话框
function showSwapItemPicker(myItem, target) {
  const modal = $('swapPickerModal');
  if (!modal) {
    // 首次创建
    const m = document.createElement('div');
    m.id = 'swapPickerModal';
    m.className = 'modal';
    m.style.display = 'none';
    m.innerHTML = `
      <div class="modal-content">
        <h3>🔄 物换物 - 选择对方要给你的物品</h3>
        <p id="swapPickerHint"></p>
        <div id="swapPickerList" class="swap-picker-list"></div>
        <div class="modal-actions">
          <button class="host-btn" id="swapPickerCancel">取消</button>
        </div>
      </div>
    `;
    document.body.appendChild(m);
    m.querySelector('#swapPickerCancel').addEventListener('click', () => { m.style.display = 'none'; });
  }
  const modalEl = $('swapPickerModal');
  const list = $('swapPickerList');
  const hint = $('swapPickerHint');
  // 找到对方的背包
  const tgtBag = (lastState && lastState.online && lastState.online[target] && lastState.publicCharacters && lastState.publicCharacters[target])
    ? (lastState.publicCharacters[target].backpack || [])
    : (lastState && lastState.otherBackpacks && lastState.otherBackpacks[target]) || [];
  // 实际上, 客户端没有对方背包数据 - 需要服务器提供一个 "获取对方背包" 接口
  // v2.4.35: 先用服务器接口拉取对方背包
  socket.emit('player:getOtherBag', { target });
  socket.once('player:otherBag', (resp) => {
    if (resp && resp.target === target) {
      const otherBag = resp.bag || [];
      hint.textContent = `用「${myItem.title || '物品'}」换${roleLabel(target)}的:`;
      list.innerHTML = '';
      if (otherBag.length === 0) {
        list.innerHTML = `<div class="player-empty">${roleLabel(target)} 的背包是空的</div>`;
      } else {
        otherBag.forEach(oi => {
          const r = document.createElement('div');
          r.className = 'player-bag-item mini';
          const oIsItem = oi.type === 'item';
          const icon = oIsItem ? '🎒' : '🔍';
          r.innerHTML = `<div class="bag-title">${icon} ${escapeHtml(oi.title || (oIsItem ? '物品' : '线索'))}</div>` +
            `<button class="host-btn host-btn-primary" data-swap-id="${escapeHtml(oi.id)}">换这个</button>`;
          r.querySelector('[data-swap-id]').addEventListener('click', () => {
            if (confirm(`确认用「${myItem.title || '物品'}」换${roleLabel(target)}的「${oi.title || (oIsItem ? '物品' : '线索')}」?`)) {
              socket.emit('player:tradeItemForItem', { itemId: myItem.id, target, targetItemId: oi.id });
              modalEl.style.display = 'none';
            }
          });
          list.appendChild(r);
        });
      }
      modalEl.style.display = 'flex';
    }
  });
}

// v2.4.34: 玩家赠金币面板(独立于物品)
function renderPlayerGoldPanel(bag, onlinePlayers) {
  const panel = $('playerGoldPanel');
  if (!panel) return;
  const myGold = (lastState && lastState.character && lastState.character.gold) || 0;
  if (onlinePlayers.length === 0) {
    panel.innerHTML = `<div class="player-gold-panel-empty">💰 我的金币: <b>${myGold}</b> | 无其他在线玩家可赠金币</div>`;
    return;
  }
  const opts = onlinePlayers.map(p => {
    const pc = PLAYER_COLORS[p];
    const label = (pc && pc.icon) ? (pc.icon + ' 玩家 ' + p.substring(1)) : ('玩家 ' + p.substring(1));
    return `<option value="${p}">${label}</option>`;
  }).join('');
  panel.innerHTML = `<div class="player-gold-panel-row">` +
    `<span class="player-gold-label">💰 我的金币: <b>${myGold}</b></span>` +
    `<select class="bag-trade-target" id="playerGoldTarget">${opts}</select>` +
    `<input class="bag-trade-gold" id="playerGoldAmount" type="number" min="1" max="999999" placeholder="金币数" value="10">` +
    `<button class="mini-trade" id="playerGoldGiveBtn">💝 赠与金币</button>` +
    `</div>`;
  const btn = $('playerGoldGiveBtn');
  if (btn && !btn.dataset.bound) {
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const target = $('playerGoldTarget').value;
      const gold = parseInt($('playerGoldAmount').value, 10) || 0;
      if (!target) return showToast('请选择目标玩家', 'error');
      if (!gold || gold <= 0) return showToast('请填写金币数(>0)', 'error');
      const sel = $('playerGoldTarget');
      const labelText = sel.options[sel.selectedIndex].text;
      if (confirm(`确认赠与 ${labelText} ${gold} 💰? (你将失去 ${gold})`)) {
        socket.emit('player:tradeGold', { target, gold });
      }
    });
  }
}

// v2.4.34: 渲染"查看副本"列表
function renderPlayerViewedClues(views) {
  const list = $('playerViewedList');
  const empty = $('playerViewedEmpty');
  if (!list) return;
  list.innerHTML = '';
  if (!views || views.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  views.forEach(v => {
    const d = document.createElement('div');
    d.className = 'player-bag-item viewed-clue';
    const isItem = v.type === 'item';
    const icon = isItem ? '🎒' : '🔍';
    const titleHtml = `<div class="bag-title">${icon} ${escapeHtml(v.title || '查看')}</div>`;
    const imgHtml = v.imageUrl ? `<img class="bag-img" src="${escapeHtml(v.imageUrl)}" alt="">` : '';
    const audioHtml = v.audioUrl ? `<audio controls src="${escapeHtml(v.audioUrl)}" class="bag-media"></audio>` : '';
    const videoHtml = v.videoUrl ? `<video controls src="${escapeHtml(v.videoUrl)}" class="bag-media"></video>` : '';
    const bodyHtml = v.body ? `<div class="bag-body">${escapeHtml(v.body)}</div>` : '';
    const fromHtml = `<div class="bag-from">👁️ ${isPlayerId(v.shownBy) ? roleLabel(v.shownBy) : (v.shownBy || '其他玩家')} 给你看的(只读)</div>`;
    const timeHtml = v.shownAt ? `<div class="bag-time">📅 ${fmtTime(v.shownAt)}</div>` : '';
    d.innerHTML = titleHtml + imgHtml + bodyHtml + audioHtml + videoHtml + fromHtml + timeHtml +
      `<div class="bag-actions"><button class="mini-del" data-discard-view="${escapeHtml(v.id)}">🗑️ 丢弃</button></div>`;
    const delBtn = d.querySelector('[data-discard-view]');
    if (delBtn) delBtn.addEventListener('click', () => {
      if (confirm('丢弃这条查看?')) socket.emit('player:discardViewed', { viewId: v.id });
    });
    list.appendChild(d);
  });
}

function renderPlayerNote(note) {
  const area = $('playerNoteArea');
  if (!area) return;
  if (document.activeElement !== area) {
    area.value = note || '';
  }
}

function renderPlayerCard(item) {
  const div = document.createElement('div');
  div.className = 'player-card ' + (item.type || 'text');
  div.dataset.id = item.id;
  const isClue = item.type === 'clue';
  const isScript = item.type === 'script';

  const typeHtml = `<div class="card-type">${escapeHtml(typeLabel(item.type || 'text'))}</div>`;
  const titleHtml = item.title ? `<div class="card-title">${escapeHtml(item.title)}</div>` : '';
  // v2.3: 剧本类型 body 是 URL,显示为可点击链接
  const bodyHtml = item.body
    ? (isScript
        ? `<div class="card-body"><a href="${escapeHtml(item.body)}" target="_blank" rel="noopener">📜 打开剧本(新窗口)</a><div class="card-script-url">${escapeHtml(item.body)}</div></div>`
        : `<div class="card-body">${escapeHtml(item.body)}</div>`)
    : '';
  const imgHtml = item.imageUrl ? `<img class="card-img" src="${escapeHtml(item.imageUrl)}" alt="">` : '';
  // v2.4.24: 事件线索(有 videoUrl/audioUrl)自动播放
  const isEventClue = (item.from && String(item.from).indexOf('event:') === 0);
  const audioHtml = item.audioUrl
    ? `<audio ${isEventClue ? 'autoplay' : ''} controls src="${escapeHtml(item.audioUrl)}"></audio>`
    : '';
  const videoHtml = item.videoUrl
    ? `<video ${isEventClue ? 'autoplay muted playsinline' : ''} controls src="${escapeHtml(item.videoUrl)}"></video>`
    : '';
  // v2.1: 移除"投到 Pad"按钮,改为只分享线索给其他玩家
  // v2.3: 剧本(script)类型不允许分享
  const shareHtml = isClue
    ? `<button class="card-share" data-share="${item.id}">📤 分享给其他玩家</button>`
    : '';
  const timeHtml = `<div class="card-time">${fmtTime(item.ts)}</div>`;
  div.innerHTML = typeHtml + titleHtml + bodyHtml + imgHtml + audioHtml + videoHtml + shareHtml + timeHtml;

  div.addEventListener('click', (e) => {
    if (e.target.closest('button') || e.target.closest('audio') || e.target.closest('video')) return;
    openZoom(item);
  });
  if (isClue) {
    const shareBtn = div.querySelector('[data-share]');
    if (shareBtn) {
      shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // 滚到分享表单,自动填充
        $('playerShareTitle').value = item.title || '';
        $('playerShareBody').value = item.body || '';
        $('playerShareImageUrl').value = item.imageUrl || '';
        // 切到分享 tab
        $$('.player-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === 'share'));
        $$('.player-tab-panel').forEach(p => p.style.display = (p.dataset.tab === 'share' ? 'flex' : 'none'));
        $('playerShareForm')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast('已填入分享表单,选择目标后点击发送');
      });
    }
  }
  return div;
}

function bindPlayerEvents() {
  if ($('playerExit').dataset.bound) return;
  $('playerExit').dataset.bound = '1';
  $('playerExit').addEventListener('click', leaveRole);

  // Tab 切换
  $$('.player-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchPlayerTab(tab);
      // v2.4.21: 打开私聊 tab 时标记已读
      if (tab === 'chat') {
        if (lastState) {
          const me = (lastState.role || (window.location.pathname.indexOf('p2') >= 0 ? 'p2' : 'p1'));
          const channels = (lastState.chat || {});
          const msgs = channels[me] || [];
          if (msgs.length > 0) {
            // 把 lastRead 设为最新一条主持人消息的时间
            const lastHost = msgs.filter(m => m.from === 'host').pop();
            if (lastHost) playerChatLastReadTs = lastHost.ts || 0;
            else playerChatLastReadTs = Date.now();
          }
        }
        updatePlayerChatBadge();
      }
    });
  });

  // 角色卡:头像上传
  $('charAvatarUploadBtn').addEventListener('click', () => $('charAvatarFile').click());
  $('charAvatarFile').addEventListener('change', async () => {
    const f = $('charAvatarFile');
    const file = f.files && f.files[0];
    if (!file) return;
    try {
      const result = await uploadFile(file);
      socket.emit('player:setCharacter', { avatar: result.url });
      showToast('✅ 头像已上传');
    } catch (e) { /* uploadFile already toasted */ }
    f.value = '';
  });

  // v2.4.48: 玩家端头像 AI 生图(从 bindHostEvents 移过来,修复玩家端无法使用的问题)
  const charAvatarAiBtn = $('charAvatarAiBtn');
  if (charAvatarAiBtn && !charAvatarAiBtn.dataset.bound) {
    charAvatarAiBtn.dataset.bound = '1';
    charAvatarAiBtn.addEventListener('click', () => {
      if (charAvatarAiBtn.disabled) return;
      const name = $('charName').value.trim();
      const defaultPrompt = name ? `人物头像:${name},半身像,清晰五官,游戏立绘风格` : '';
      showAIGenerateModal({
        kind: 'npc',
        hint: '🎨 描述角色外观,AI 生成头像',
        defaultSize: '512x512',
        defaultPrompt,
        onUse: (url) => {
          socket.emit('player:setCharacter', { avatar: url });
          showToast('🎨 头像已设置');
        }
      });
    });
  }

  // 角色卡:添加属性
  $('charAttrAddBtn').addEventListener('click', () => {
    const list = (lastState.character && lastState.character.attributes) || [];
    const newAttrs = list.concat([{ id: 'attr_' + Date.now().toString(36), name: '新属性', value: 0 }]);
    socket.emit('player:setCharacter', { attributes: newAttrs });
  });

  // v2.4.30: 角色卡 - 添加技能
  const charSkillAddBtn = $('charSkillAddBtn');
  if (charSkillAddBtn) {
    charSkillAddBtn.addEventListener('click', () => {
      const list = (lastState.character && lastState.character.skills) || [];
      const newSkills = list.concat([{ id: 'skill_' + Date.now().toString(36), name: '新技能', value: 0, group: '' }]);
      socket.emit('player:setCharacter', { skills: newSkills });
    });
  }
  // v2.4.30: 角色卡 - 技能预设(常见技能一键添加)
  const charSkillPresets = $('charSkillPresets');
  if (charSkillPresets) {
    charSkillPresets.addEventListener('change', (e) => {
      const v = e.target.value;
      if (!v) return;
      const list = (lastState.character && lastState.character.skills) || [];
      // 解析: "侦察 SPOT|65|调查"
      const parts = v.split('|');
      const name = parts[0];
      const value = parseInt(parts[1]) || 0;
      const group = parts[2] || '';
      // 防止重复
      if (list.some(s => s.name === name)) {
        showToast('技能「' + name + '」已存在', 'error');
        e.target.value = '';
        return;
      }
      const newSkills = list.concat([{ id: 'skill_' + Date.now().toString(36), name, value, group }]);
      socket.emit('player:setCharacter', { skills: newSkills });
      e.target.value = '';
    });
  }

  // 角色卡:保存整张卡
  $('charSaveBtn').addEventListener('click', () => {
    const name = $('charName').value.trim();
    const gender = $('charGender').value;
    const intro = $('charIntro').value;
    const hpMax = Math.max(0, parseInt($('charHpMax').value) || 0);
    const hpCur = Math.max(0, Math.min(hpMax, parseInt($('charHpCur').value) || 0));
    const mpMax = Math.max(0, parseInt($('charMpMax').value) || 0);
    const mpCur = Math.max(0, Math.min(mpMax, parseInt($('charMpCur').value) || 0));
    const sanMax = Math.max(0, parseInt($('charSanMax').value) || 0);
    const sanCur = Math.max(0, Math.min(sanMax, parseInt($('charSanCur').value) || 0));
    // v2.4.31: 金币(0~999999)
    const gold = Math.max(0, Math.min(999999, parseInt($('charGold').value) || 0));
    // 收集自定义属性
    const oldAttrs = (lastState.character && lastState.character.attributes) || [];
    const newAttrs = [];
    $$('.char-attr-row').forEach(row => {
      const idx = parseInt(row.querySelector('.char-attr-name').dataset.idx);
      const name = row.querySelector('.char-attr-name').value.trim() || '属性';
      const val = parseInt(row.querySelector('.char-attr-val').value) || 0;
      const orig = oldAttrs[idx] || {};
      newAttrs.push({ id: orig.id || ('attr_' + Date.now().toString(36) + idx), name, value: val });
    });
    // v2.4.30: 收集技能(支持内联编辑)
    const oldSkills = (lastState.character && lastState.character.skills) || [];
    const newSkills = [];
    $$('.char-skill-row').forEach(row => {
      const idx = parseInt(row.querySelector('.char-skill-name').dataset.idx);
      const name = row.querySelector('.char-skill-name').value.trim() || '技能';
      const val = parseInt(row.querySelector('.char-skill-val').value) || 0;
      const group = (row.querySelector('.char-skill-group') && row.querySelector('.char-skill-group').value || '').trim();
      const orig = oldSkills[idx] || {};
      newSkills.push({ id: orig.id || ('skill_' + Date.now().toString(36) + idx), name, value: val, group });
    });
    socket.emit('player:setCharacter', {
      name, gender, intro,
      hp: { current: hpCur, max: hpMax },
      mp: { current: mpCur, max: mpMax },
      san: { current: sanCur, max: sanMax },
      // v2.4.31: 发送金币
      gold,
      attributes: newAttrs,
      skills: newSkills
    });
    showToast('✅ 角色卡已保存(💰' + gold + ')');
  });

  // v2.4.30: 角色卡 - 技能删除按钮(委托)
  document.addEventListener('click', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('char-skill-del')) {
      const idx = parseInt(e.target.dataset.idx);
      const list = (lastState.character && lastState.character.skills) || [];
      const newList = list.filter((_, i) => i !== idx);
      socket.emit('player:setCharacter', { skills: newList });
    }
  });

  // 角色卡:打开模板选择
  const charTemplateBtn = $('charTemplateBtn');
  if (charTemplateBtn) {
    charTemplateBtn.addEventListener('click', () => {
      openCharacterTemplates('all');
    });
  }
  // 模板:游戏类型切换
  const charTemplateGameSel = $('charTemplateGameSel');
  if (charTemplateGameSel) {
    charTemplateGameSel.addEventListener('change', () => {
      characterTemplatesGame = charTemplateGameSel.value;
      requestCharacterTemplates();
    });
  }
  // 模板:关闭按钮
  document.querySelectorAll('[data-close="charTemplateModal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      $('charTemplateModal').style.display = 'none';
    });
  });

  // 笔记:保存
  $('playerNoteSaveBtn').addEventListener('click', () => {
    const note = $('playerNoteArea').value;
    socket.emit('player:setNote', { note });
    showToast('✅ 笔记已保存');
  });
  // 笔记:自动保存(失焦时)
  $('playerNoteArea').addEventListener('blur', () => {
    const note = $('playerNoteArea').value;
    socket.emit('player:setNote', { note });
  });

  // 分享:发送线索
  $('playerShareSendBtn').addEventListener('click', () => {
    const target = $('playerShareTarget').value;
    const title = $('playerShareTitle').value.trim();
    const body = $('playerShareBody').value.trim();
    const imageUrl = $('playerShareImageUrl').value.trim();
    if (!body && !imageUrl) return showToast('请填写内容或图片URL', 'error');
    socket.emit('player:sendClueToPlayer', { target, title, body, imageUrl });
    $('playerShareTitle').value = '';
    $('playerShareBody').value = '';
    $('playerShareImageUrl').value = '';
    showToast('✅ 线索已发送');
  });

  // v2.4.19: 玩家 → 主持人 私聊
  $('playerChatSendBtn').addEventListener('click', () => {
    const input = $('playerChatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    socket.emit('player:chatToHost', { text });
    input.value = '';
  });
  $('playerChatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('playerChatSendBtn').click();
  });
  // 分享:图片上传
  $('playerShareUploadBtn').addEventListener('click', () => $('playerShareFile').click());
  $('playerShareFile').addEventListener('change', async () => {
    const f = $('playerShareFile');
    const file = f.files && f.files[0];
    if (!file) return;
    try {
      const result = await uploadFile(file);
      $('playerShareImageUrl').value = result.url;
      showToast('✅ 图片已上传');
    } catch (e) { /* uploadFile already toasted */ }
    f.value = '';
  });

  bindZoomEvents();
  bindUploadButtons();
}

function switchPlayerTab(tab) {
  playerActiveTab = tab;
  $$('.player-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  $$('.player-pane').forEach(p => p.style.display = (p.dataset.pane === tab ? 'block' : 'none'));
}

// =====================================================================
// v2.4.19: 主持人「选点模式」系统
// 进入模式后,点击 hostMapPreview 触发对应操作
// v2.4.46: 新增 repositionNpc 模式(在 NPC 编辑器中重新定位 NPC)
// =====================================================================
function setHostPickMode(mode) {
  hostPickMode = mode;
  // 更新按钮高亮(动态:mark / placeItem / placeNpc / repositionNpc / movePos)
  const pickModes = ['mark', 'placeItem', 'placeNpc', 'repositionNpc', 'movePos'];
  for (const m of pickModes) {
    const btn = document.querySelector(`[data-pick-mode="${m}"]`);
    if (btn) btn.classList.toggle('active-pick', hostPickMode === m);
  }
  for (const pid of PLAYER_IDS) {
    const m = 'start' + pid.charAt(0).toUpperCase() + pid.slice(1);
    const btn = document.querySelector(`[data-pick-mode="${m}"]`);
    if (btn) btn.classList.toggle('active-pick', hostPickMode === m);
  }
  const cancelBtn = $('hostCancelPickBtn');
  if (cancelBtn) cancelBtn.style.display = hostPickMode ? '' : 'none';
  // 提示信息(v2.4.46: hostPickStatus 现在是 span,不再有 hostPickStatusRow)
  const status = $('hostPickStatus');
  if (status) {
    const messages = {
      mark: '🖱️ 标记模式:在版图上点击任意位置 → 在 pad 端显示箭头 3 秒',
      movePos: '🖱️ 点击版图 → 设置玩家要移动到的位置(然后点「移动」按钮)',
      placeItem: '🖱️ 点击版图 → 用当前表单内容在该位置放置物品/线索/事件/图片',
      placeNpc: '🖱️ 点击版图 → 用当前 NPC 名字/头像在该位置添加 NPC',
      repositionNpc: '🖱️ 点击版图 → 将当前编辑的 NPC 移动到该位置'
    };
    for (const pid of PLAYER_IDS) {
      messages['start' + pid.charAt(0).toUpperCase() + pid.slice(1)] = `🖱️ 点击版图 → 设置 ${PLAYER_COLORS[pid].icon} ${roleLabel(pid)} 出生点`;
    }
    if (hostPickMode && messages[hostPickMode]) {
      status.textContent = messages[hostPickMode];
      status.style.display = '';
    } else {
      status.style.display = 'none';
    }
  }
  // 标记模式按钮文案
  const markLabel = $('hostMarkModeLabel');
  if (markLabel) markLabel.textContent = hostPickMode === 'mark' ? '开启' : '关闭';
  // 版图预览加视觉提示
  const preview = $('hostMapPreview');
  if (preview) preview.classList.toggle('pick-mode-active', !!hostPickMode);
}

// 处理 hostMapPreview 的点击(根据当前选点模式)
function handleHostMapPreviewClick(e) {
  if (!hostPickMode) return;  // 没开选点模式就忽略
  if (e.target.closest('.host-map-preview-item') || e.target.closest('.host-map-npc')) return;  // 点中物品/NPC 不触发
  const preview = $('hostMapPreview');
  if (!preview) return;
  const rect = preview.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
  if (x < 0 || x > 1 || y < 0 || y > 1) return;
  // v2.4.32: 动态匹配 startP1..P6
  let startPlayer = null;
  for (const pid of PLAYER_IDS) {
    if (hostPickMode === 'start' + pid.charAt(0).toUpperCase() + pid.slice(1)) {
      startPlayer = pid;
      break;
    }
  }
  if (startPlayer) {
    socket.emit('host:setMapStartPiece', { playerId: startPlayer, x, y });
    showToast(`📍 已设置 ${PLAYER_COLORS[startPlayer].icon} ${roleLabel(startPlayer)} 出生点`, 'info');
    setHostPickMode(null);
    return;
  }
  switch (hostPickMode) {
    case 'mark':
      socket.emit('host:markPiece', { x, y, durationMs: 3000 });
      showToast('📍 已在版图上标记一个点 (3秒后消失)', 'info');
      break;
    case 'movePos':
      hostPickMovePos = { x, y };
      const dsp = $('hostMovePosDisplay');
      if (dsp) dsp.textContent = `${x.toFixed(2)}, ${y.toFixed(2)}`;
      // v2.4.48: 同步更新 NPC 卡片内联监控的位置显示(根据 hostNpcMonitorTargetNpcId 定位)
      if (hostNpcMonitorTargetNpcId) {
        const cardDsp = document.querySelector(`[data-field="pos-display"][data-npc-id="${hostNpcMonitorTargetNpcId}"]`);
        if (cardDsp) cardDsp.textContent = `${x.toFixed(2)}, ${y.toFixed(2)}`;
      }
      showToast(`📍 已选位置: ${x.toFixed(2)}, ${y.toFixed(2)}`, 'info');
      // 不退出模式,让用户选完地图后点移动
      break;
    case 'placeItem':
      // v2.4.46: 使用「在版图上放内容」表单的值,在该位置放置内容
      if (submitAddMapItem(x, y)) {
        setHostPickMode(null);
      }
      break;
    case 'placeNpc':
      // v2.4.46: 使用「NPC 管理」表单的值,在该位置添加 NPC
      const npcName = $('hostNpcName').value.trim();
      const npcAvatar = $('hostNpcAvatarUrl').value.trim();
      if (!npcName) {
        showToast('请先在「NPC 管理」中输入 NPC 名字', 'error');
        setHostPickMode(null);
        return;
      }
      socket.emit('host:addNpc', { name: npcName, avatar: npcAvatar, x, y });
      $('hostNpcName').value = '';
      $('hostNpcAvatarUrl').value = '';
      // v2.4.47: 同时清空「在版图上放内容」中的快速放置输入框
      const qn = $('hostQuickNpcName'); if (qn) qn.value = '';
      const qa = $('hostQuickNpcAvatarUrl'); if (qa) qa.value = '';
      showToast('👤 NPC 已添加到版图', 'info');
      setHostPickMode(null);
      break;
    case 'repositionNpc':
      // v2.4.46: 将当前编辑的 NPC 移动到点击位置
      if (!hostNpcEditorTarget) {
        showToast('请先在 NPC 管理中点击一个 NPC 打开编辑器', 'error');
        setHostPickMode(null);
        return;
      }
      socket.emit('host:moveNpc', { id: hostNpcEditorTarget, x, y });
      showToast(`✅ NPC 已移动到 (${x.toFixed(2)}, ${y.toFixed(2)})`, 'info');
      setHostPickMode(null);
      break;
  }
}

// v2.4.46: 提交「在版图上放内容」表单(从 hostAddMapItemBtn 提取,供 placeItem 选点模式调用)
// 返回 true 表示成功提交,false 表示校验失败
function submitAddMapItem(x, y) {
  const type = $('hostAddType').value;
  const bodyText = $('hostAddBody').value.trim();
  const title = $('hostAddTitle').value.trim();
  if (type === 'item' || type === 'clue') {
    if (!title) { showToast('请填写物品/线索标题', 'error'); return false; }
  } else if (type === 'event') {
    if (!title) { showToast('请填写事件标题', 'error'); return false; }
  } else if (type === 'image') {
    if (!bodyText && !$('hostAddBody').value.trim().match(/^https?:\/\//)) {
      showToast('请填写图片 URL', 'error'); return false;
    }
  } else if (type === 'video') {
    if (!bodyText && !$('hostAddBody').value.trim().match(/^https?:\/\//)) {
      showToast('请填写视频 URL', 'error'); return false;
    }
  }
  const payload = { type, title, body: bodyText, x, y };
  if (type === 'event') {
    payload.imageUrl = $('hostAddEventImage').value.trim();
    payload.videoUrl = $('hostAddEventVideo').value.trim();
    payload.audioUrl = $('hostAddEventAudio').value.trim();
    payload.durationMs = parseInt($('hostAddEventDuration').value) || 5000;
    payload.effects = {
      hp: parseInt($('hostAddEventHp').value) || 0,
      mp: parseInt($('hostAddEventMp').value) || 0,
      san: parseInt($('hostAddEventSan').value) || 0
    };
    payload.target = $('hostAddEventTarget').value;
    const switchMapId = $('hostAddEventSwitchMap').value;
    if (switchMapId) payload.switchMapId = switchMapId;
    const switchPlayer = $('hostAddEventSwitchPlayer').value;
    if (switchPlayer) payload.switchPlayer = switchPlayer;
  } else if (type === 'image') {
    const imgSwitchMap = $('hostAddImageSwitchMap');
    if (imgSwitchMap && imgSwitchMap.value) payload.switchMapId = imgSwitchMap.value;
  } else if (type === 'video') {
    const videoSwitchMap = $('hostAddVideoSwitchMap');
    if (videoSwitchMap && videoSwitchMap.value) payload.switchMapId = videoSwitchMap.value;
  }
  socket.emit('host:addMapItem', payload);
  showToast(`📦 已添加 ${type} 到版图 (${x.toFixed(2)}, ${y.toFixed(2)})`, 'info');
  // v2.4.46: 提交成功后清空表单
  $('hostAddTitle').value = '';
  $('hostAddBody').value = '';
  if ($('hostAddEventImage')) $('hostAddEventImage').value = '';
  if ($('hostAddEventVideo')) $('hostAddEventVideo').value = '';
  if ($('hostAddEventAudio')) $('hostAddEventAudio').value = '';
  return true;
}

// =====================================================================
// 主持人视图
// =====================================================================
function renderHost() {
  if (!lastState) return;
  const s = lastState;
  // v2.4.19: 找到 activeMap (BGM 现在是 per-map,不存在顶层 s.bgm)
  const activeMap = (s.maps || []).find(m => m.id === s.activeMapId) || null;
  const activeMapBgm = activeMap && activeMap.bgm ? activeMap.bgm : null;

  // 标题
  const titleInput = $('hostTitleInput');
  if (document.activeElement !== titleInput) {
    titleInput.value = s.scriptTitle || '';
  }

  // 在线状态
  ['host', 'pad', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'].forEach(r => {
    const Upper = r === 'pad' ? 'Pad' : r === 'host' ? 'Host' : r.toUpperCase();
    const dot = $('hostDot' + Upper);
    if (dot) dot.classList.toggle('online', !!(s.online && s.online[r]));
  });

  // v2.4.33: 按 online 动态显示/隐藏 所有 data-pid 行
  if (s.online) {
    // v2.4.34: 合并 active 列表(未启用位置直接隐藏)
    const active = getActivePlayerIds();
    const isActivePid = (pid) => active.indexOf(pid) !== -1;
    const activeAndOnline = (pid) => isActivePid(pid) && !!s.online[pid];
    const anyOnline = PLAYER_IDS.some(p => activeAndOnline(p));
    for (const pid of PLAYER_IDS) {
      const visible = isActivePid(pid) && !!s.online[pid];
      // 1) HP/MP/SAN 扣减面板
      document.querySelectorAll('.host-hp-panel [data-pid="' + pid + '"]').forEach(el => {
        el.style.display = visible ? '' : 'none';
      });
      // 2) 起始属性
      document.querySelectorAll('#hostInitPropsList [data-pid="' + pid + '"]').forEach(el => {
        el.style.display = visible ? '' : 'none';
      });
      // 3) 金币调整
      document.querySelectorAll('#hostGoldList [data-pid="' + pid + '"]').forEach(el => {
        el.style.display = visible ? '' : 'none';
      });
      // 4) 玩家跟随勾选
      document.querySelectorAll('#hostFollowList [data-pid="' + pid + '"]').forEach(el => {
        el.style.display = visible ? '' : 'none';
      });
      // 5) 出生点选点按钮
      document.querySelectorAll('#hostStartPickList [data-pid="' + pid + '"]').forEach(el => {
        el.style.display = visible ? '' : 'none';
      });
      // 6) 出生点坐标显示
      document.querySelectorAll('#hostStartCoordList [data-pid="' + pid + '"]').forEach(el => {
        el.style.display = visible ? '' : 'none';
      });
      // 7) 已收内容卡片
      document.querySelectorAll('#hostReceivedList [data-pid="' + pid + '"]').forEach(el => {
        el.style.display = visible ? '' : 'none';
      });
    }
    // 8) 移动玩家下拉框 - 只显示激活且在线的玩家
    const movePlayerSel = $('hostMovePlayer');
    if (movePlayerSel) {
      const cur = movePlayerSel.value;
      movePlayerSel.innerHTML = '';
      PLAYER_IDS.forEach(pid => {
        if (!activeAndOnline(pid)) return;
        const pc = PLAYER_COLORS[pid];
        const opt = document.createElement('option');
        opt.value = pid;
        opt.textContent = (pc && pc.icon ? pc.icon + ' ' : '') + roleLabel(pid);
        movePlayerSel.appendChild(opt);
      });
      if (cur && activeAndOnline(cur)) movePlayerSel.value = cur;
      else if (anyOnline) movePlayerSel.value = PLAYER_IDS.find(p => activeAndOnline(p));
    }
    // 9) 主持人私聊目标 - 只显示激活且在线的玩家
    const chatTargetSel = $('hostChatTarget');
    if (chatTargetSel) {
      const cur = chatTargetSel.value;
      chatTargetSel.innerHTML = '';
      PLAYER_IDS.forEach(pid => {
        if (!activeAndOnline(pid)) return;
        const pc = PLAYER_COLORS[pid];
        const opt = document.createElement('option');
        opt.value = pid;
        opt.textContent = (pc && pc.icon ? pc.icon + ' ' : '') + roleLabel(pid);
        chatTargetSel.appendChild(opt);
      });
      if (cur && activeAndOnline(cur)) chatTargetSel.value = cur;
    }
    // 10) 发送内容给玩家(checkbox) - v2.4.35: 启用且在线才可选 (含 hostClueTarget)
    document.querySelectorAll('input[name="hostPlayerSendTarget"], input[name="hostBagTarget"], input[name="hostClueTarget"]').forEach(cb => {
      const val = cb.value;
      const label = cb.parentElement;
      if (!label) return;
      // 'pad' 是信息流,不受 maxPlayers 限制
      let usable;
      if (val === 'pad') {
        usable = true;
      } else if (isPlayerId(val)) {
        const isActive = isActivePid(val);
        const isOnline = !!s.online[val];
        usable = isActive && isOnline;
      } else {
        usable = true;
      }
      label.style.display = '';
      // v2.4.35: 未启用 + 离线 都算不可用
      label.classList.toggle('host-offline', !usable);
      cb.disabled = !usable;
      // 启用+在线默认勾选; 启用但离线不勾选; 离线不影响已勾选
      if (cb.checked) {
        // 保持现状(已勾选的不改)
      } else if (usable) {
        // 启用+在线时仅在 defaultChecked 状态下默认勾选
        if (cb.defaultChecked) cb.checked = true;
      }
    });
    // 11) 全选/全不选 - 检查是否所有在线都已勾选
    // (这里由用户手动操作,不自动处理)
    // 空状态 - 没有任何玩家在线
    document.querySelectorAll('.host-empty-rows').forEach(el => {
      el.style.display = anyOnline ? 'none' : '';
    });
  }

  // v2.4.34: 同步本局玩家数 UI
  const maxSel = $('hostMaxPlayersSel');
  const maxHint = $('hostMaxPlayersHint');
  if (maxSel && typeof s.maxPlayers === 'number') {
    const n = s.maxPlayers;
    if (maxSel.value !== String(n)) maxSel.value = String(n);
    if (maxHint) maxHint.textContent = '当前: ' + n + ' 人 (激活: ' + getActivePlayerIds().join(', ') + ')';
  }

  // 版图预览(图/视频)
  const previewImg = $('hostMapPreviewImg');
  const previewEmpty = $('hostMapPreviewEmpty');
  // v2.4.29: 版图背景也支持视频
  let previewVideo = $('hostMapPreviewVideo');
  if (!previewVideo) {
    previewVideo = document.createElement('video');
    previewVideo.id = 'hostMapPreviewVideo';
    previewVideo.muted = true;
    previewVideo.loop = true;
    previewVideo.autoplay = true;
    previewVideo.playsInline = true;
    previewVideo.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:none;background:#000;';
    const preview = $('hostMapPreview');
    if (preview) preview.insertBefore(previewVideo, preview.firstChild);
  }
  if (s.map && s.map.url) {
    const isVideoUrl = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(s.map.url);
    if (isVideoUrl) {
      previewVideo.src = s.map.url;
      previewVideo.style.display = 'block';
      previewImg.style.display = 'none';
    } else {
      previewImg.src = s.map.url;
      previewImg.style.display = 'block';
      previewVideo.style.display = 'none';
      previewVideo.removeAttribute('src');
    }
    previewEmpty.style.display = 'none';
  } else {
    previewImg.style.display = 'none';
    previewVideo.style.display = 'none';
    previewVideo.removeAttribute('src');
    previewEmpty.style.display = 'block';
  }
  // v2.4.19: 选点模式系统,只有开启 hostPickMode 时点击版图才生效
  const previewContainer = $('hostMapPreview');
  if (previewContainer && !previewContainer.dataset.markBound) {
    previewContainer.dataset.markBound = '1';
    previewContainer.addEventListener('click', handleHostMapPreviewClick);
  }
  // v2.4.18: 渲染当前标记(主持人端预览)
  const markerLayer = $('hostMapPreviewMarker');
  if (markerLayer) {
    markerLayer.innerHTML = '';
    if (s.mapMarker && s.mapMarker.expiresAt > Date.now()) {
      const m = s.mapMarker;
      const div = document.createElement('div');
      div.className = 'pad-map-marker';
      div.style.left = (m.x * 100) + '%';
      div.style.top = (m.y * 100) + '%';
      div.style.color = m.color || '#e74c3c';
      div.innerHTML = `<div class="pad-map-marker-pulse"></div><div class="pad-map-marker-arrow">▼</div>`;
      markerLayer.appendChild(div);
      const remain = Math.max(0, m.expiresAt - Date.now());
      setTimeout(() => { if (markerLayer.contains(div)) markerLayer.removeChild(div); }, remain + 100);
    }
  }
  // 版图上的项
  const prevItems = $('hostMapPreviewItems');
  prevItems.innerHTML = '';
  (s.mapItems || []).forEach(item => {
    const d = document.createElement('div');
    d.className = 'host-map-preview-item ' + (item.type || 'text') + (hostSelectedMapItem === item.id ? ' selected' : '');
    d.style.left = (item.x * 100) + '%';
    d.style.top = (item.y * 100) + '%';
    d.dataset.id = item.id;
    // v2.4.29: 视频/图片用实际媒体预览
    if (item.type === 'video' && item.videoUrl) {
      const v = document.createElement('video');
      v.src = item.videoUrl;
      v.muted = true;
      v.playsInline = true;
      v.style.cssText = 'max-width:160px;max-height:120px;border-radius:4px;background:#000;display:block;';
      d.appendChild(v);
    } else if (item.type === 'image' && item.imageUrl) {
      const img = document.createElement('img');
      img.src = item.imageUrl;
      img.alt = '';
      img.style.cssText = 'max-width:160px;max-height:120px;border-radius:4px;display:block;';
      d.appendChild(img);
    } else {
      const txt = document.createElement('div');
      txt.textContent = item.title || item.body || typeLabel(item.type);
      d.appendChild(txt);
    }
    const delBtn = document.createElement('span');
    delBtn.className = 'del';
    delBtn.dataset.del = item.id;
    delBtn.textContent = '×';
    d.appendChild(delBtn);
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('删除该内容项?')) socket.emit('host:deleteMapItem', { id: item.id });
    });
    d.addEventListener('click', (e) => {
      if (e.target.classList.contains('del')) return;
      hostSelectedMapItem = item.id;
      const sc = item.scale || 1;
      const range = $('hostScaleRange');
      if (range) range.value = String(sc);
      $('hostScaleValue').textContent = sc.toFixed(2) + '×';
      $('hostScalePanel').style.display = 'flex';
      // 高亮选中
      $$('.host-map-preview-item').forEach(el => el.classList.toggle('selected', el.dataset.id === item.id));
    });
    d.addEventListener('mousedown', (e) => startHostItemDrag(e, item.id, d));
    d.addEventListener('touchstart', (e) => startHostItemDrag(e, item.id, d), { passive: false });
    prevItems.appendChild(d);
  });
  // v2.1: NPC 也渲染到版图预览(可拖动改位置)
  (s.npcs || []).forEach(npc => {
    const d = document.createElement('div');
    d.className = 'host-map-npc';
    d.style.left = (npc.x * 100) + '%';
    d.style.top = (npc.y * 100) + '%';
    d.dataset.npcId = npc.id;
    const sc = npc.scale || 1;
    d.style.transform = `translate(-50%, -50%) scale(${sc})`;
    if (npc.avatar) {
      d.innerHTML = `<img class="host-map-npc-img" src="${escapeHtml(npc.avatar)}" alt=""><div class="host-map-npc-name">${escapeHtml(npc.name || '?')}</div>`;
    } else {
      const initial = (npc.name || '?').charAt(0);
      d.innerHTML = `<div class="host-map-npc-initial">${escapeHtml(initial)}</div><div class="host-map-npc-name">${escapeHtml(npc.name || '?')}</div>`;
    }
    d.title = `${npc.name || 'NPC'} - 拖动移动位置`;
    d.addEventListener('mousedown', (e) => startHostNpcDrag(e, npc.id, d));
    d.addEventListener('touchstart', (e) => startHostNpcDrag(e, npc.id, d), { passive: false });
    // 双击打开编辑器
    d.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      openNpcEditorModal(npc.id);
    });
    prevItems.appendChild(d);
  });

  // v2.4.28: 主持人端版图上显示玩家棋子(只读,不可拖动)
  // 显示逻辑:在 activeMap 上的玩家 → 显示
  //          在其他版图的玩家 → 不显示(host 切到对应版图才能看到)
  const prevPieces = $('hostMapPreviewPieces');
  if (prevPieces) {
    prevPieces.innerHTML = '';
    const pubChars = s.publicCharacters || {};
    const playerMap = s.playerMap || {};
    const activeMapId = s.activeMapId;
    const pieces = s.pieces || {};
    ['p1', 'p2'].forEach(pid => {
      // 只显示在 activeMap 上的玩家
      if (playerMap[pid] !== activeMapId) return;
      const pe = pieces[pid];
      if (!pe) return;
      const ch = pubChars[pid] || {};
      const d = document.createElement('div');
      d.className = 'host-map-piece host-map-piece-readonly';
      d.style.left = (pe.x * 100) + '%';
      d.style.top = (pe.y * 100) + '%';
      d.style.borderColor = pe.color || (pid === 'p1' ? '#e74c3c' : '#3498db');
      // 头像 / 名字
      if (ch.avatar) {
        d.innerHTML = `<img class="host-map-piece-img" src="${escapeHtml(ch.avatar)}" alt=""><div class="host-map-piece-label">${escapeHtml(ch.name || pid)}</div>`;
      } else {
        const initial = (ch.name || pid).charAt(0);
        d.innerHTML = `<div class="host-map-piece-initial">${escapeHtml(initial)}</div><div class="host-map-piece-label">${escapeHtml(ch.name || pid)}</div>`;
      }
      d.title = `${ch.name || pid} 位置: (${(pe.x || 0).toFixed(2)}, ${(pe.y || 0).toFixed(2)})\n只读 - 玩家自己拖动`;
      prevPieces.appendChild(d);
    });
  }
  // 版图项列表
  $('hostMapItemsCount').textContent = (s.mapItems || []).length;
  const itemsList = $('hostMapItemsList');
  itemsList.innerHTML = '';
  if ((s.mapItems || []).length === 0) {
    itemsList.innerHTML = '<div class="host-mini-empty">版图上还没有内容</div>';
  } else {
    (s.mapItems || []).forEach(item => {
      const d = document.createElement('div');
      d.className = 'host-mini-item ' + (item.type || 'text');
      d.innerHTML = `<span class="mini-type">${escapeHtml(typeLabel(item.type))}</span>
        <span class="mini-title">${escapeHtml(item.title || item.body || '(无标题)')}</span>
        <button class="mini-del" data-del="${item.id}">×</button>`;
      d.querySelector('.mini-del').addEventListener('click', () => {
        socket.emit('host:deleteMapItem', { id: item.id });
      });
      itemsList.appendChild(d);
    });
  }

  // v2.4: 多版图列表
  const mapsList = $('hostMapsList');
  if (mapsList) {
    mapsList.innerHTML = '';
    const maps = s.maps || [];
    if (maps.length === 0) {
      mapsList.innerHTML = '<div class="host-mini-empty">还没有版图</div>';
    } else {
      maps.forEach(m => {
        const isActive = m.id === s.activeMapId;
        const d = document.createElement('div');
        d.className = 'host-map-card' + (isActive ? ' active' : '');
        const itemCount = (m.items || []).length;
        const npcCount = (m.npcs || []).length;
        d.innerHTML = `
          <div class="host-map-card-name">${isActive ? '🟢 ' : ''}${escapeHtml(m.name || '未命名')}</div>
          <div class="host-map-card-meta">📦 ${itemCount} 物品/线索/事件 · 👥 ${npcCount} NPC</div>
          <div class="host-map-card-actions">
            <button class="mini-btn" data-action="switch" data-id="${m.id}">切换</button>
            <button class="mini-btn" data-action="rename" data-id="${m.id}">改名</button>
            <button class="mini-btn" data-action="url" data-id="${m.id}">背景</button>
            <button class="mini-btn mini-btn-danger" data-action="del" data-id="${m.id}">删除</button>
          </div>
        `;
        d.querySelectorAll('button').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            if (action === 'switch') {
              // v2.4.24: 智能切换版图弹窗
              // v2.4.32: 通用化 - 6 玩家都用同一逻辑
              const sourceMapId = s.activeMapId;
              const followers = [];
              const onSourceIds = PLAYER_IDS.filter(pid => s.playerMap && s.playerMap[pid] === sourceMapId);
              const onSourceCount = onSourceIds.length;
              if (onSourceCount === 0) {
                // 没人在当前版图,直接切换
                socket.emit('host:switchMap', { mapId: id, followers: [] });
              } else if (onSourceCount === 1) {
                // 只有一个人在当前版图,只问那一个
                const pid = onSourceIds[0];
                const pc = PLAYER_COLORS[pid];
                if (confirm(`切换到「${m.name}」?\n\n当前版图上只有 ${pc.icon} ${roleLabel(pid)},是否让他跟随?`)) {
                  followers.push(pid);
                }
                socket.emit('host:switchMap', { mapId: id, followers });
              } else {
                // 多人在当前版图,挨个问
                for (const pid of onSourceIds) {
                  const pc = PLAYER_COLORS[pid];
                  if (confirm(`切换到「${m.name}」?\n\n让 ${pc.icon} ${roleLabel(pid)} 跟随到「${m.name}」吗?`)) {
                    followers.push(pid);
                  }
                }
                socket.emit('host:switchMap', { mapId: id, followers });
              }
            } else if (action === 'rename') {
              const newName = prompt('输入新名称:', m.name);
              if (newName && newName.trim()) {
                socket.emit('host:renameMap', { mapId: id, name: newName.trim() });
              }
            } else if (action === 'url') {
              const url = prompt('输入版图背景 URL (http://... 或 /uploads/...):', m.url || '');
              if (url !== null) {
                if (!url) {
                  socket.emit('host:setMapUrl', { mapId: id, url: '' });
                } else if (isHttpOrLocalUrl(url)) {
                  socket.emit('host:setMapUrl', { mapId: id, url });
                } else {
                  showToast('URL 必须以 http:// https:// 或 /uploads/ 开头', 'error');
                }
              }
            } else if (action === 'del') {
              if (confirm(`确定删除版图「${m.name}」?`)) {
                socket.emit('host:deleteMap', { mapId: id });
              }
            }
          });
        });
        mapsList.appendChild(d);
      });
    }
  }
  // v2.4: 同步切换版图下拉(事件配置 + 移动玩家 + v2.4.27 图片切换版图)
  ['hostAddEventSwitchMap', 'hostMovePlayerMap', 'hostAddImageSwitchMap'].forEach(id => {
    const sel = $(id);
    if (sel) {
      const cur = sel.value;
      const first = sel.options[0] ? sel.options[0].cloneNode(true) : null;
      sel.innerHTML = '';
      if (first) sel.appendChild(first);
      (s.maps || []).forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        sel.appendChild(opt);
      });
      sel.value = cur;
    }
  });

  // v2.4.18: 玩家跟随版图切换的开关
  const followers = s.followers || ['p1', 'p2'];
  const p1Follow = $('hostFollowP1Toggle');
  const p2Follow = $('hostFollowP2Toggle');
  if (p1Follow && p1Follow.checked !== followers.includes('p1')) p1Follow.checked = followers.includes('p1');
  if (p2Follow && p2Follow.checked !== followers.includes('p2')) p2Follow.checked = followers.includes('p2');

  // v2.4.18: 当前版图(出生点改用选点模式,这里不读 X/Y 输入框了)
  const activeMap2 = (s.maps || []).find(m => m.id === s.activeMapId);
  // (旧 X/Y 出生点输入框已废弃,改用点击版图选点)
  if (activeMap2) { /* keep ref alive for bgm */ }

  // v2.4.18: BGM 当前版图名 + BGM 状态
  const bgmLabel = $('hostBgmCurrentMapLabel');
  if (bgmLabel) {
    bgmLabel.dataset.mapName = activeMap2 ? activeMap2.name : '当前版图';
    bgmLabel.textContent = `(${activeMap2 ? activeMap2.name : '当前版图'})`;
  }
  const bgmStatus = $('hostBgmStatus');
  if (bgmStatus) {
    if (activeMap2 && activeMap2.bgm) {
      bgmStatus.textContent = `当前: ${activeMap2.bgm.title || '背景音乐'} (${Math.round((activeMap2.bgm.volume || 0.5) * 100)}%)`;
    } else {
      bgmStatus.textContent = '当前:无';
    }
  }

  // 投喂流(可钉到版图)
  $('hostPadFeedCount').textContent = (s.padFeed || []).length;
  const feedList = $('hostPadFeedList');
  feedList.innerHTML = '';
  if ((s.padFeed || []).length === 0) {
    feedList.innerHTML = '<div class="host-mini-empty">投喂流为空</div>';
  } else {
    (s.padFeed || []).forEach(item => {
      const d = document.createElement('div');
      let main = '';
      if (item.type === 'dice') {
        const t = item.total != null ? `= ${item.total}` : '';
        main = `<span class="mini-title">🎲 ${escapeHtml(formatDiceText(item))} ${t}</span>`;
      } else {
        const from = item.from ? (item.from === 'p1' ? '🔴 玩家1' : '🔵 玩家2') : '📢 主持人';
        main = `<span class="mini-type">${escapeHtml(from)} · ${escapeHtml(typeLabel(item.type))}</span>
          <span class="mini-title">${escapeHtml(item.title || item.body || '(无标题)')}</span>`;
      }
      const pinHtml = `<button class="mini-pin" data-pin="${item.id}" title="钉到版图">📌</button>`;
      d.className = 'host-mini-item ' + (item.type || 'text') + ' has-pin';
      d.innerHTML = main + pinHtml + `<button class="mini-del" data-del="${item.id}">×</button>`;
      d.querySelector('.mini-pin').addEventListener('click', (e) => {
        e.stopPropagation();
        const x = parseFloat(prompt('钉到版图的 X 坐标 (0-1):', '0.5'));
        if (x == null || isNaN(x)) return;
        const y = parseFloat(prompt('钉到版图的 Y 坐标 (0-1):', '0.5'));
        if (y == null || isNaN(y)) return;
        socket.emit('host:pinFeed', { feedId: item.id, x, y });
      });
      d.querySelector('.mini-del').addEventListener('click', () => {
        socket.emit('pad:closeFeed', { feedId: item.id });
      });
      feedList.appendChild(d);
    });
  }

  // v2.4.32: 通用化 - 6 玩家列表
  for (const pid of PLAYER_IDS) {
    const list = (s.players && s.players[pid] && s.players[pid].privateContent) || [];
    const countEl = $('host' + pid.charAt(0).toUpperCase() + pid.slice(1) + 'Count');
    if (countEl) countEl.textContent = list.length;
    renderHostPlayerList('host' + pid.charAt(0).toUpperCase() + pid.slice(1) + 'List', list);
  }

  // v2.0 回合显示
  if (s.turn) {
    const cur = s.turn.current;
    let curLabel = '—';
    if (isPlayerId(cur)) curLabel = PLAYER_COLORS[cur].icon + ' ' + roleLabel(cur);
    if ($('hostTurnCurrent')) $('hostTurnCurrent').textContent = curLabel;
    if ($('hostTurnRound')) $('hostTurnRound').textContent = s.turn.round || 1;
  }

  // v2.4.32: 通用化 - 6 玩家 HP/金币显示
  for (const pid of PLAYER_IDS) {
    const ch = (s.players && s.players[pid] && s.players[pid].character) || {};
    const hpDisp = $('host' + pid.charAt(0).toUpperCase() + pid.slice(1) + 'HpDisplay');
    if (hpDisp) hpDisp.textContent = `${ch.hp?.current ?? 0}/${ch.hp?.max ?? 0}`;
    const statDisp = $('host' + pid.charAt(0).toUpperCase() + pid.slice(1) + 'StatDisplay');
    if (statDisp) statDisp.textContent = `${ch.hp?.current ?? 0}/${ch.hp?.max ?? 0}`;
    const goldCur = $('host' + pid.charAt(0).toUpperCase() + pid.slice(1) + 'GoldCurrent');
    if (goldCur) goldCur.textContent = '💰 ' + (ch.gold ?? 100);
  }

  // v2.1: 主持人端不展示玩家笔记(移除 hostP1Note / hostP2Note)

  // v2.4.48: NPC 列表 - 内联展示完整卡片(无弹窗、无折叠)
  const npcList = $('hostNpcList');
  if (npcList) {
    npcList.innerHTML = '';
    if (!(s.npcs || []).length) {
      npcList.innerHTML = '<div class="host-mini-empty">还没有 NPC</div>';
    } else {
      // 玩家选项(预生成)
      let playerOptsAll = '<option value="">所有玩家</option>';
      let playerOpts = '';
      PLAYER_IDS.forEach(pid => {
        const c = PLAYER_COLORS[pid];
        const o = `<option value="${pid}">${c.icon} 玩家 ${pid.substring(1)}</option>`;
        playerOptsAll += o;
        playerOpts += o;
      });
      // 版图选项(预生成)
      let mapOpts = '<option value="">-- 不切换 --</option>';
      (s.maps || []).forEach(m => {
        mapOpts += `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name || '未命名版图')}</option>`;
      });
      (s.npcs || []).forEach(npc => {
        // v2.4.49: 为控制玩家/发线索/干预生成带默认选中项的玩家选项
        const defaultPid = npc.lastChatter || 'p1';
        let playerOptsSelected = '';
        let playerOptsAllSelected = '<option value="">所有玩家</option>';
        PLAYER_IDS.forEach(pid => {
          const c = PLAYER_COLORS[pid];
          const sel = pid === defaultPid ? ' selected' : '';
          playerOptsSelected += `<option value="${pid}"${sel}>${c.icon} 玩家 ${pid.substring(1)}</option>`;
          playerOptsAllSelected += `<option value="${pid}"${sel}>${c.icon} 玩家 ${pid.substring(1)}</option>`;
        });
        const card = document.createElement('div');
        card.className = 'npc-card';
        card.dataset.npcId = npc.id;
        const avatar = npc.avatar
          ? `<img class="npc-mini-avatar" src="${escapeHtml(npc.avatar)}" alt="">`
          : `<div class="npc-mini-initial">${escapeHtml((npc.name || '?').charAt(0))}</div>`;
        // 商品列表(内联 renderNpcEditorShop 逻辑)
        const shop = Array.isArray(npc.shop) ? npc.shop : [];
        let shopHtml = '';
        if (shop.length === 0) {
          shopHtml = '<div class="host-mini-empty">该 NPC 还没有商品</div>';
        } else {
          shop.forEach(item => {
            const stockIcon = item.stock === -1 ? '∞' : item.stock;
            const stockLabel = item.stock === -1 ? '无限' : '库存';
            const imgHtml = item.imageUrl
              ? `<img class="npc-shop-row-img" src="${escapeHtml(item.imageUrl)}" alt="">`
              : `<div class="npc-shop-row-img placeholder">📦</div>`;
            shopHtml += `<div class="npc-shop-row">
              ${imgHtml}
              <div class="npc-shop-row-info">
                <div class="npc-shop-row-title">${escapeHtml(item.title || '商品')}</div>
                <div class="npc-shop-row-meta">
                  <span class="price">🪙 ${item.price}</span>
                  <span>📦 ${stockIcon} ${stockLabel}</span>
                </div>
                ${item.body ? `<div class="npc-shop-row-body">${escapeHtml(item.body).slice(0, 80)}</div>` : ''}
              </div>
              <button class="npc-shop-row-del" data-action="shop-delete" data-npc-id="${npc.id}" data-item-id="${item.id}">🗑️</button>
            </div>`;
          });
        }
        card.innerHTML = `
          <div class="npc-card-header">
            ${avatar}
            <div class="npc-card-name">${escapeHtml(npc.name || 'NPC')}</div>
            <button class="host-btn host-btn-danger" data-action="delete-npc" data-npc-id="${npc.id}">🗑️ 删除</button>
          </div>

          <div class="npc-card-section">
            <h4 class="npc-card-section-title">📋 基本信息</h4>
            <div class="host-row">
              <label>名称 <input class="host-input" data-field="name" data-npc-id="${npc.id}" type="text" maxlength="30" value="${escapeHtml(npc.name || '')}"></label>
            </div>
            <div class="host-row">
              <label>头像URL <input class="host-input" data-field="avatar" data-npc-id="${npc.id}" type="text" placeholder="https://..." value="${escapeHtml(npc.avatar || '')}"></label>
              <label>大小 <input class="host-input-num" data-field="scale" data-npc-id="${npc.id}" type="number" min="0.3" max="3" step="0.05" value="${npc.scale || 1}"></label>
              <button class="host-btn host-btn-primary" data-action="save-npc" data-npc-id="${npc.id}">💾 保存</button>
            </div>
          </div>

          <div class="npc-card-section">
            <h4 class="npc-card-section-title">🤖 AI 对话(Agnes AI)</h4>
            <div class="host-row">
              <label style="display:flex;align-items:center;gap:6px;">
                <input type="checkbox" data-field="aiEnabled" data-npc-id="${npc.id}" ${npc.aiEnabled ? 'checked' : ''}>
                <span>启用 AI 对话(玩家可与 NPC 自由对话)</span>
              </label>
              <button class="host-btn host-btn-danger" data-action="clear-chat" data-npc-id="${npc.id}" title="清除所有玩家的对话历史">🧹 清除对话记录</button>
            </div>
            <div class="host-row">
              <label class="host-label">⚧ 性别(影响语音音色)
                <select class="host-input" data-field="aiGender" data-npc-id="${npc.id}">
                  <option value="neutral" ${npc.aiGender === 'neutral' ? 'selected' : ''}>中性</option>
                  <option value="male" ${npc.aiGender === 'male' ? 'selected' : ''}>男性</option>
                  <option value="female" ${npc.aiGender === 'female' ? 'selected' : ''}>女性</option>
                </select>
              </label>
              <label class="host-label">📅 年龄(影响语音音色)
                <select class="host-input" data-field="aiAge" data-npc-id="${npc.id}">
                  <option value="adult" ${(npc.aiAge || 'adult') === 'adult' ? 'selected' : ''}>成年</option>
                  <option value="young" ${npc.aiAge === 'young' ? 'selected' : ''}>年轻</option>
                  <option value="old" ${npc.aiAge === 'old' ? 'selected' : ''}>老年</option>
                </select>
              </label>
            </div>
            <div class="host-row">
              <label class="host-label">🎭 性格特点
                <textarea class="host-input host-textarea" data-field="aiPersonality" data-npc-id="${npc.id}" rows="2" placeholder="例:神秘莫测,说话总是模棱两可,对陌生人保持警惕,但喜欢猜谜语">${escapeHtml(npc.aiPersonality || '')}</textarea>
              </label>
            </div>
            <div class="host-row">
              <label class="host-label">🧠 记忆/背景
                <textarea class="host-input host-textarea" data-field="aiMemory" data-npc-id="${npc.id}" rows="3" placeholder="例:曾是王国骑士团团长,因一次失败的任务失去了一切,现在隐居在森林小屋中">${escapeHtml(npc.aiMemory || '')}</textarea>
              </label>
            </div>
            <div class="host-row">
              <label class="host-label">🎯 目的(可选)
                <textarea class="host-input host-textarea" data-field="aiGoal" data-npc-id="${npc.id}" rows="2" placeholder="例:你需要阻止玩家进入学校,除非玩家能证明自己是这里的老师">${escapeHtml(npc.aiGoal || '')}</textarea>
              </label>
            </div>
            <div class="host-row">
              <label class="host-label">👋 开场白(可选)
                <input class="host-input" data-field="aiGreeting" data-npc-id="${npc.id}" type="text" maxlength="200" placeholder="例:旅行者,你为何来到这片荒芜之地?" value="${escapeHtml(npc.aiGreeting || '')}">
              </label>
            </div>
            <div class="host-row">
              <label style="display:flex;align-items:center;gap:6px;">
                <input type="checkbox" data-field="aiPadSync" data-npc-id="${npc.id}" ${npc.aiPadSync !== false ? 'checked' : ''}>
                <span>Pad 端同步显示对话</span>
              </label>
              <label style="display:flex;align-items:center;gap:6px;">
                <input type="checkbox" data-field="aiSharedChat" data-npc-id="${npc.id}" ${npc.aiSharedChat ? 'checked' : ''}>
                <span>共享对话(所有玩家加入同一对话)</span>
              </label>
            </div>
          </div>

          <div class="npc-card-section">
            <h4 class="npc-card-section-title">🛒 商品列表 <small class="host-hint">玩家与该 NPC 对话时可购买</small></h4>
            <div class="host-npc-shop-list" data-shop-list="${npc.id}">
              ${shopHtml}
            </div>
            <div class="host-row">
              <input class="host-input" data-field="shopTitle" data-npc-id="${npc.id}" type="text" placeholder="商品名称(例:治疗药水)" maxlength="60">
              <input class="host-input-num" data-field="shopPrice" data-npc-id="${npc.id}" type="number" min="0" max="999999" placeholder="价格" value="10">
              <input class="host-input-num" data-field="shopStock" data-npc-id="${npc.id}" type="number" min="-1" max="9999" placeholder="库存(-1=无限)" value="-1">
            </div>
            <div class="host-row">
              <textarea class="host-input host-textarea" data-field="shopBody" data-npc-id="${npc.id}" placeholder="商品描述(可选)"></textarea>
            </div>
            <div class="host-row">
              <input class="host-input" data-field="shopImage" data-npc-id="${npc.id}" type="text" placeholder="商品图片 URL (可选)">
              <button class="host-btn" data-action="shop-upload" data-npc-id="${npc.id}" title="上传图片">📁</button>
              <button class="host-btn" data-action="shop-ai" data-npc-id="${npc.id}" title="AI 生成商品图">🎨 AI</button>
              <input type="file" data-action="shop-file" data-npc-id="${npc.id}" accept="image/*" style="display:none;">
              <button class="host-btn host-btn-primary" data-action="shop-add" data-npc-id="${npc.id}">+ 添加商品</button>
            </div>
          </div>

          <div class="npc-card-section">
            <h4 class="npc-card-section-title">📊 对话监控/干预</h4>
            <div class="npc-card-chat-list" data-chat-list="${npc.id}">
              <div class="npc-monitor-empty">暂无对话记录</div>
            </div>
            <div class="host-row">
              <button class="host-btn" data-action="refresh-chat" data-npc-id="${npc.id}">🔄 刷新对话</button>
            </div>

            <h5 class="npc-card-subtitle">🎭 干预</h5>
            <div class="host-row">
              <label class="host-label">🎯 目标玩家
                <select class="host-input" data-field="intervene-target" data-npc-id="${npc.id}">${playerOptsAllSelected}</select>
              </label>
            </div>
            <div class="host-row">
              <label class="host-label">💬 以 NPC 身份发言(玩家会收到)
                <textarea class="host-input host-textarea" data-field="intervene-speak" data-npc-id="${npc.id}" rows="2" placeholder="例:好吧,我相信你,你可以进去了。"></textarea>
              </label>
            </div>
            <div class="host-row">
              <button class="host-btn host-btn-primary" data-action="intervene-speak" data-npc-id="${npc.id}">📢 发送</button>
            </div>
            <div class="host-row">
              <label class="host-label">🤫 注入隐藏指令(玩家不可见,影响 AI 后续回复)
                <textarea class="host-input host-textarea" data-field="intervene-inject" data-npc-id="${npc.id}" rows="2" placeholder="例:接下来对玩家态度变得友好,暗示钥匙在图书馆。"></textarea>
              </label>
            </div>
            <div class="host-row">
              <button class="host-btn" data-action="intervene-inject" data-npc-id="${npc.id}">🤫 注入指令</button>
            </div>

            <h5 class="npc-card-subtitle">🎁 发线索</h5>
            <div class="host-row">
              <label class="host-label">🎯 目标玩家
                <select class="host-input" data-field="clue-target" data-npc-id="${npc.id}">${playerOptsSelected}</select>
              </label>
            </div>
            <div class="host-row">
              <label class="host-label">📋 线索标题
                <input class="host-input" data-field="clue-title" data-npc-id="${npc.id}" type="text" maxlength="60" placeholder="例:一把生锈的钥匙">
              </label>
            </div>
            <div class="host-row">
              <label class="host-label">📝 线索内容
                <textarea class="host-input host-textarea" data-field="clue-body" data-npc-id="${npc.id}" rows="3" placeholder="例:这把钥匙上刻着图书馆三个字,似乎能打开某扇门..."></textarea>
              </label>
            </div>
            <div class="host-row">
              <button class="host-btn host-btn-primary" data-action="send-clue" data-npc-id="${npc.id}">🎁 通过 NPC 发送</button>
            </div>

            <h5 class="npc-card-subtitle">⚙️ 控制玩家</h5>
            <div class="host-row">
              <label class="host-label">🎯 目标玩家
                <select class="host-input" data-field="control-target" data-npc-id="${npc.id}">${playerOptsSelected}</select>
              </label>
            </div>
            <div class="host-row">
              <label class="host-label">HP 变化
                <input class="host-input-num" data-field="hp-delta" data-npc-id="${npc.id}" type="number" value="0" step="1">
              </label>
              <label class="host-label">MP 变化
                <input class="host-input-num" data-field="mp-delta" data-npc-id="${npc.id}" type="number" value="0" step="1">
              </label>
              <label class="host-label">SAN 变化
                <input class="host-input-num" data-field="san-delta" data-npc-id="${npc.id}" type="number" value="0" step="1">
              </label>
              <label class="host-label">金币变化
                <input class="host-input-num" data-field="gold-delta" data-npc-id="${npc.id}" type="number" value="0" step="1">
              </label>
            </div>
            <div class="host-row">
              <button class="host-btn host-btn-primary" data-action="apply-stats" data-npc-id="${npc.id}">⚙️ 应用属性变化</button>
            </div>
            <div class="host-row">
              <label class="host-label">🗺️ 切换到版图
                <select class="host-input" data-field="control-map" data-npc-id="${npc.id}">${mapOpts}</select>
              </label>
              <button class="host-btn" data-action="pick-pos" data-npc-id="${npc.id}" data-pick-mode="movePos">📍 在版图上选位置</button>
            </div>
            <div class="host-row" style="font-size:12px;color:#7f8c8d;">
              <span>已选位置: (<span data-field="pos-display" data-npc-id="${npc.id}">未选</span>)</span>
            </div>
            <div class="host-row">
              <button class="host-btn host-btn-primary" data-action="move-player" data-npc-id="${npc.id}">🧭 移动玩家到新版图</button>
            </div>
          </div>
        `;
        npcList.appendChild(card);
      });
      // v2.4.48: 自动请求有 AI 对话的 NPC 的聊天记录
      (s.npcs || []).forEach(npc => {
        if (npc.aiEnabled) socket.emit('host:getNpcChatLog', { npcId: npc.id });
      });
    }
  }

  // v2.0 主持人骰子历史
  const diceLog = $('hostDiceLog');
  if (diceLog) {
    diceLog.innerHTML = '';
    const log = s.hostDiceLog || [];
    if ($('hostDiceLogCount')) $('hostDiceLogCount').textContent = log.length;
    if (log.length === 0) {
      diceLog.innerHTML = '<div class="host-mini-empty">暂无骰子历史</div>';
    } else {
      log.forEach(item => {
        const d = document.createElement('div');
        d.className = 'host-dice-log-item' + (item.visible ? ' visible' : ' hidden');
        const detailStr = (item.detail || []).map(x =>
          x.results.length === 1 ? `D${x.sides}=${x.results[0]}` : `${x.results.length}D${x.sides}=${x.sum}`
        ).join('+');
        const modStr = item.modifier ? (item.modifier > 0 ? `+${item.modifier}` : `${item.modifier}`) : '';
        d.innerHTML = `<span class="hd-time">${fmtTime(item.ts)}</span>
          <span class="hd-notation">${escapeHtml(item.notation || '')}</span>
          <span class="hd-detail">${escapeHtml(detailStr + modStr)}</span>
          <span class="hd-total">= ${item.total}</span>
          <button class="hd-toggle" data-toggle="${item.id}" title="切换公开/隐藏">${item.visible ? '👁️ 公开' : '🔒 私'}</button>`;
        d.querySelector('[data-toggle]').addEventListener('click', () => {
          socket.emit('host:toggleDiceVisible', { id: item.id });
        });
        diceLog.appendChild(d);
      });
    }
  }

  // v2.0 剧本查看器
  renderHostScriptViewer(s);

  // v2.1 公投开关显示
  if ($('hostDicePublicToggle') && s.hostDicePublic != null) {
    $('hostDicePublicToggle').checked = !!s.hostDicePublic;
  }

  // BGM 状态显示(在版图 section 已设置过 label/status,这里同步 url + title 输入框)
  const bgmInput = $('hostBgmUrl');
  const bgmTitle = $('hostBgmTitle');
  const bgmVol = $('hostBgmVolume');
  const activeMapForBgm = (s.maps || []).find(m => m.id === s.activeMapId);
  if (activeMapForBgm && activeMapForBgm.bgm) {
    if (bgmInput && document.activeElement !== bgmInput) bgmInput.value = activeMapForBgm.bgm.url || '';
    if (bgmTitle && document.activeElement !== bgmTitle) bgmTitle.value = activeMapForBgm.bgm.title || '';
    if (bgmVol && document.activeElement !== bgmVol) bgmVol.value = String(activeMapForBgm.bgm.volume ?? 0.5);
  }
  const pauseBtn = $('hostPauseBgmBtn');
  const resumeBtn = $('hostResumeBgmBtn');
  const volRange = $('hostBgmVolumeRange');
  const volLabel = $('hostBgmVolumeLabel');
  if (bgmStatus) {
    if (activeMapBgm) {
      bgmStatus.classList.add('active');
      const pauseMark = activeMapBgm.paused ? ' [已暂停]' : '';
      bgmStatus.textContent = `当前版图BGM: ${activeMapBgm.title || '背景音乐'} (音量 ${Math.round((activeMapBgm.volume || 0) * 100)}%)${pauseMark} [Pad 端播放]`;
      if ($('hostBgmUrl') && document.activeElement !== $('hostBgmUrl')) $('hostBgmUrl').value = activeMapBgm.url;
      if ($('hostBgmTitle') && document.activeElement !== $('hostBgmTitle')) $('hostBgmTitle').value = activeMapBgm.title || '';
      if ($('hostBgmVolume') && document.activeElement !== $('hostBgmVolume')) $('hostBgmVolume').value = activeMapBgm.volume != null ? activeMapBgm.volume : 0.5;
      if (volRange && document.activeElement !== volRange) volRange.value = activeMapBgm.volume != null ? activeMapBgm.volume : 0.5;
      if (volLabel) volLabel.textContent = Math.round((activeMapBgm.volume || 0.5) * 100) + '%';
      if (pauseBtn) pauseBtn.style.display = activeMapBgm.paused ? 'none' : '';
      if (resumeBtn) resumeBtn.style.display = activeMapBgm.paused ? '' : 'none';
    } else {
      bgmStatus.classList.remove('active');
      bgmStatus.textContent = '当前版图无 BGM';
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (resumeBtn) resumeBtn.style.display = 'none';
    }
  }

  // 日志
  const log = $('hostLog');
  log.innerHTML = '';
  (s.eventLog || []).forEach(e => {
    const row = document.createElement('div');
    row.className = 'log-row';
    row.innerHTML = `<span class="log-time">${fmtTime(e.ts)}</span><span class="log-msg">${escapeHtml(e.msg)}</span>`;
    log.appendChild(row);
  });

  // v2.4.19: 渲染聊天日志 + 玩家当前位置 + 出生点
  renderHostChatLog();
  // 出生点显示 - v2.4.32: 6 玩家通用循环
  const activeMapStart = (activeMap && activeMap.startPieces) || {};
  for (const pid of PLAYER_IDS) {
    const dsp = $('hostStart' + pid.charAt(0).toUpperCase() + pid.slice(1) + 'Display');
    if (!dsp) continue;
    const pp = activeMapStart[pid] || { x: 0.5, y: 0.5 };
    dsp.textContent = `${pp.x.toFixed(2)}, ${pp.y.toFixed(2)}`;
  }
  // 玩家当前所在版图
  const playerMap = s.playerMap || {};
  const mapName = (id) => {
    const m = (s.maps || []).find(x => x.id === id);
    return m ? m.name : '-';
  };
  if ($('hostP1CurrentMap')) $('hostP1CurrentMap').textContent = mapName(playerMap.p1);
  if ($('hostP2CurrentMap')) $('hostP2CurrentMap').textContent = mapName(playerMap.p2);
  // BGM 当前版图标签
  if ($('hostBgmCurrentMapLabel') && activeMap) {
    $('hostBgmCurrentMapLabel').textContent = `(当前:${activeMap.name || '未命名版图'})`;
  }
}

function renderHostPlayerList(elId, list) {
  const el = $(elId);
  el.innerHTML = '';
  if (list.length === 0) {
    el.innerHTML = '<div class="host-mini-empty">无</div>';
    return;
  }
  list.forEach(item => {
    const d = document.createElement('div');
    d.className = 'host-mini-item ' + (item.type || 'text');
    d.innerHTML = `<span class="mini-type">${escapeHtml(typeLabel(item.type))}</span>
      <span class="mini-title">${escapeHtml(item.title || item.body || '(无标题)')}</span>`;
    el.appendChild(d);
  });
}

// v2.0 剧本查看器
// v2.4.19: 主持人聊天日志渲染
function renderHostChatLog() {
  const log = $('hostChatLog');
  if (!log || !lastState) return;
  const target = ($('hostChatTarget') || {}).value || 'p1';
  const channels = (lastState.chat || {});
  const msgs = channels[target] || [];
  if (msgs.length === 0) {
    log.innerHTML = '<div class="host-chat-empty" style="color:#888;">暂无消息</div>';
    return;
  }
  const html = msgs.map(m => {
    const time = new Date(m.ts || Date.now()).toLocaleTimeString();
    const cls = m.from === 'host' ? 'host-msg' : 'player-msg';
    // v2.4.32: 通用化 who 标签
    const who = m.from === 'host' ? '我' : (isPlayerId(target) ? roleLabel(target) : '玩家');
    const safeText = escapeHtml(m.text || '');
    return `<div class="${cls}" style="margin-bottom:6px;">
      <span style="color:#95a5a6;font-size:11px;">[${time}]</span>
      <strong style="color:${m.from === 'host' ? '#3498db' : '#e67e22'};">${who}:</strong>
      <span style="color:#eee;">${safeText}</span>
    </div>`;
  }).join('');
  log.innerHTML = html;
  log.scrollTop = log.scrollHeight;
}

// v2.4.21: 玩家私聊未读跟踪
let playerChatLastReadTs = 0;

function updatePlayerChatBadge() {
  const badge = $('playerChatBadge');
  if (!badge || !lastState) return;
  const me = (lastState.role || (window.location.pathname.indexOf('p2') >= 0 ? 'p2' : 'p1'));
  const channels = (lastState.chat || {});
  const msgs = channels[me] || [];
  // 统计主持人发的、且晚于 lastRead 的未读
  const unread = msgs.filter(m => m.from === 'host' && (m.ts || 0) > playerChatLastReadTs).length;
  if (unread > 0) {
    badge.textContent = unread > 99 ? '99+' : String(unread);
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

// v2.4.19: 玩家聊天日志渲染
function renderPlayerChatLog() {
  const log = $('playerChatLog');
  if (!log || !lastState) return;
  const me = (lastState.role || (window.location.pathname.indexOf('p2') >= 0 ? 'p2' : 'p1'));
  const channels = (lastState.chat || {});
  const msgs = channels[me] || [];
  // 渲染前更新未读徽章
  updatePlayerChatBadge();
  if (msgs.length === 0) {
    log.innerHTML = '<div class="player-chat-empty" style="color:#888;text-align:center;padding:30px;">💬 暂无消息,跟主持人私聊吧</div>';
    return;
  }
  const html = msgs.map(m => {
    const time = new Date(m.ts || Date.now()).toLocaleTimeString();
    const cls = m.from === 'host' ? 'host-msg' : 'me-msg';
    const align = m.from === 'host' ? 'flex-start' : 'flex-end';
    const bg = m.from === 'host' ? '#34495e' : '#3498db';
    const safeText = escapeHtml(m.text || '');
    return `<div style="display:flex;justify-content:${align};margin-bottom:8px;">
      <div style="max-width:75%;background:${bg};padding:6px 10px;border-radius:8px;color:#fff;">
        <div style="font-size:11px;color:#bdc3c7;">${m.from === 'host' ? '主持人' : '我'} · ${time}</div>
        <div>${safeText}</div>
      </div>
    </div>`;
  }).join('');
  log.innerHTML = html;
  log.scrollTop = log.scrollHeight;
}

function renderHostScriptViewer(s) {
  return renderHostScriptViewerTo(s && s.script || {}, $('hostScriptViewer'));
}

// v2.4.18: 渲染剧本到指定容器(支持浮窗)
function renderHostScriptViewerTo(script, viewer) {
  if (!viewer) return;
  const fileName = script.fileName || '';
  const url = script.url || '';
  const file = script.file || '';
  if (!url && !file) {
    viewer.innerHTML = '<div class="host-script-empty">尚未设置剧本(URL 或上传文档)</div>';
    return;
  }
  if (url) {
    // 内嵌 URL 预览
    viewer.innerHTML = `<div class="host-script-bar">🌐 已加载 URL:<code>${escapeHtml(url)}</code></div>
      <iframe class="host-script-iframe" src="${escapeHtml(url)}" referrerpolicy="no-referrer"></iframe>`;
  } else if (file) {
    // 上传的文件
    const isPdf = /\.pdf(\?|$)/i.test(file) || /\/uploads\/.*\.pdf$/i.test(file);
    const isText = /\.(txt|json|md|ya?ml|js|csv|log)(\?|$)/i.test(file) || /text\//i.test(file);
    let content = '';
    if (isPdf) {
      content = `<iframe class="host-script-iframe" src="${escapeHtml(file)}"></iframe>`;
    } else if (isText) {
      content = `<div class="host-script-loading">⏳ 加载中…</div>`;
      // 异步取文本
      fetch(file).then(r => r.text()).then(t => {
        const el = viewer.querySelector('.host-script-loading');
        if (el) el.outerHTML = `<pre class="host-script-text">${escapeHtml(t).slice(0, 50000)}</pre>`;
      }).catch(err => {
        const el = viewer.querySelector('.host-script-loading');
        if (el) el.textContent = '❌ 加载失败: ' + err.message;
      });
    } else {
      // 其它(Word 等):用 Google Docs viewer(可能受限于外网)
      content = `<iframe class="host-script-iframe" src="https://docs.google.com/gview?url=${encodeURIComponent(file)}&embedded=1"></iframe>`;
    }
    viewer.innerHTML = `<div class="host-script-bar">📄 已上传文件:<code>${escapeHtml(fileName || file)}</code> <a href="${escapeHtml(file)}" target="_blank" rel="noopener">🔗 在新窗口打开</a></div>${content}`;
  }
}

// v2.4.48: openNpcEditorModal / renderNpcEditorShop 已移除,
//   NPC 编辑改为在 NPC 卡片内联展示(data-npc-id + 事件委托)

function startHostItemDrag(e, id, el) {
  e.preventDefault();
  e.stopPropagation();
  const stage = $('hostMapPreview');
  const rect = stage.getBoundingClientRect();
  const itemRect = el.getBoundingClientRect();
  const point = e.touches ? e.touches[0] : e;
  const offX = (point.clientX - itemRect.left) - itemRect.width / 2;
  const offY = (point.clientY - itemRect.top) - itemRect.height / 2;

  const move = (ev) => {
    const pt = ev.touches ? ev.touches[0] : ev;
    const x = (pt.clientX - rect.left - offX) / rect.width;
    const y = (pt.clientY - rect.top - offY) / rect.height;
    el.style.left = (Math.max(0, Math.min(1, x)) * 100) + '%';
    el.style.top = (Math.max(0, Math.min(1, y)) * 100) + '%';
    el._lastX = Math.max(0, Math.min(1, x));
    el._lastY = Math.max(0, Math.min(1, y));
  };
  const end = () => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', end);
    document.removeEventListener('touchmove', move);
    document.removeEventListener('touchend', end);
    if (el._lastX != null) {
      socket.emit('host:moveMapItem', { id, x: el._lastX, y: el._lastY });
    }
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', end);
  document.addEventListener('touchmove', move, { passive: false });
  document.addEventListener('touchend', end);
}

// v2.1: 主持人拖动 NPC 改变位置
function startHostNpcDrag(e, npcId, el) {
  e.preventDefault();
  e.stopPropagation();
  const stage = $('hostMapPreview');
  const rect = stage.getBoundingClientRect();
  const itemRect = el.getBoundingClientRect();
  const point = e.touches ? e.touches[0] : e;
  const offX = (point.clientX - itemRect.left) - itemRect.width / 2;
  const offY = (point.clientY - itemRect.top) - itemRect.height / 2;

  const move = (ev) => {
    const pt = ev.touches ? ev.touches[0] : ev;
    const x = (pt.clientX - rect.left - offX) / rect.width;
    const y = (pt.clientY - rect.top - offY) / rect.height;
    el.style.left = (Math.max(0, Math.min(1, x)) * 100) + '%';
    el.style.top = (Math.max(0, Math.min(1, y)) * 100) + '%';
    el._lastX = Math.max(0, Math.min(1, x));
    el._lastY = Math.max(0, Math.min(1, y));
  };
  const end = () => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', end);
    document.removeEventListener('touchmove', move);
    document.removeEventListener('touchend', end);
    if (el._lastX != null) {
      socket.emit('host:moveNpc', { id: npcId, x: el._lastX, y: el._lastY });
    }
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', end);
  document.addEventListener('touchmove', move, { passive: false });
  document.addEventListener('touchend', end);
}

function bindHostEvents() {
  if ($('hostExit').dataset.bound) return;
  $('hostExit').dataset.bound = '1';
  console.log('[bindHostEvents] start');

  // v2.4.44: 图库按钮绑定提前到最前面,防止后续代码抛错导致图库无法使用
  const libBtn = $('hostAddLibraryBtn');
  const mapLibBtn = $('hostMapLibraryBtn');
  console.log('[bindHostEvents] libBtn:', !!libBtn, 'mapLibBtn:', !!mapLibBtn);
  if (libBtn && !libBtn.dataset.bound) {
    libBtn.dataset.bound = '1';
    libBtn.addEventListener('click', () => {
      const currentType = ($('hostAddType') && $('hostAddType').value) || 'image';
      const mediaType = currentType === 'video' ? 'video' : (currentType === 'image' ? 'image' : 'all');
      openImageLibrary('hostAddBody', mediaType);
    });
  }
  if (mapLibBtn && !mapLibBtn.dataset.bound) {
    mapLibBtn.dataset.bound = '1';
    mapLibBtn.addEventListener('click', () => {
      openImageLibrary('hostMapUrl', 'image');
    });
  }
  const videoLibBtn = $('hostAddVideoLibraryBtn');
  if (videoLibBtn && !videoLibBtn.dataset.bound) {
    videoLibBtn.dataset.bound = '1';
    videoLibBtn.addEventListener('click', () => {
      openImageLibrary('hostAddBody', 'video');
    });
  }
  // 图库 modal 内的交互
  const libSearch = $('imageLibrarySearch');
  const libType = $('imageLibraryType');
  const libMedia = $('imageLibraryMediaType');
  if (libSearch) libSearch.addEventListener('input', requestImageLibrary);
  if (libType) libType.addEventListener('change', requestImageLibrary);
  if (libMedia) libMedia.addEventListener('change', requestImageLibrary);
  const libRefresh = $('imageLibraryRefreshBtn');
  if (libRefresh) libRefresh.addEventListener('click', requestImageLibrary);
  document.querySelectorAll('[data-close="imageLibraryModal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      $('imageLibraryModal').style.display = 'none';
    });
  });
  console.log('[bindHostEvents] library buttons bound');

  $$('.host-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchHostTab(btn.dataset.tab));
  });

  // v2.4.34: 设定本局玩家数
  const maxSel = $('hostMaxPlayersSel');
  const applyBtn = $('hostApplyMaxPlayersBtn');
  if (maxSel && applyBtn && !applyBtn.dataset.bound) {
    applyBtn.dataset.bound = '1';
    applyBtn.addEventListener('click', () => {
      const n = parseInt(maxSel.value, 10);
      if (!n || n < 1 || n > 6) {
        return showToast('玩家数必须 1~6', 'error');
      }
      socket.emit('host:setMaxPlayers', { maxPlayers: n });
      showToast('✅ 已设置本局玩家数: ' + n + ' 人', 'info');
    });
  }

  $('hostTitleInput').addEventListener('change', (e) => {
    socket.emit('host:setScriptTitle', e.target.value);
  });
  $('hostTitleInput').addEventListener('blur', (e) => {
    socket.emit('host:setScriptTitle', e.target.value);
  });

  // Tab A: 版图
  $('hostSetMapBtn').addEventListener('click', () => {
    const url = $('hostMapUrl').value.trim();
    if (!isHttpOrLocalUrl(url)) return showToast('版图URL必须以http(s):// 或 /uploads/ 开头', 'error');
    socket.emit('host:setMap', { url });
    $('hostMapUrl').value = '';
  });
  // v2.4.46: hostAddMapItemBtn 已移除,改为 hostPlaceItemBtn 触发选点模式(见 bindHostEvents 末尾)
  // v2.4: type 切换时显示/隐藏事件配置
  $('hostAddType').addEventListener('change', () => {
    const isEvent = $('hostAddType').value === 'event';
    const isImage = $('hostAddType').value === 'image';
    const isVideo = $('hostAddType').value === 'video';
    ['hostAddEventConfig', 'hostAddEventConfig2', 'hostAddEventConfig3', 'hostAddEventConfig4'].forEach(id => {
      const el = $(id);
      if (el) el.style.display = isEvent ? '' : 'none';
    });
    // v2.4.27: 图片专用 - 切换版图
    const imgCfg = $('hostAddImageConfig');
    if (imgCfg) imgCfg.style.display = isImage ? '' : 'none';
    // v2.4.29: 视频专用 - 切换版图
    const videoCfg = $('hostAddVideoConfig');
    if (videoCfg) videoCfg.style.display = isVideo ? '' : 'none';
  });

  // v2.4: 上传事件配图/视频/音频
  const uploadBtnMap = [
    ['hostAddUploadBtn', 'hostAddFile', 'hostAddBody'],
    ['hostAddEventImageUploadBtn', 'hostAddEventImageFile', 'hostAddEventImage'],
    ['hostAddEventVideoUploadBtn', 'hostAddEventVideoFile', 'hostAddEventVideo'],
    ['hostAddEventAudioUploadBtn', 'hostAddEventAudioFile', 'hostAddEventAudio']
  ];
  uploadBtnMap.forEach(([btnId, fileId, targetId]) => {
    const btn = $(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => $(fileId).click());
    $(fileId).addEventListener('change', async () => {
      const f = $(fileId).files && $(fileId).files[0];
      if (!f) return;
      try {
        const result = await uploadFile(f);
        $(targetId).value = result.url;
        showToast('上传成功', 'info');
      } catch (e) {
        showToast('上传失败: ' + e.message, 'error');
      }
      $(fileId).value = '';
    });
  });

  // v2.4.28: 图库按钮已提前到 bindHostEvents 开头绑定(防止后续抛错导致图库不可用)
  // v2.4: 多版图管理
  $('hostAddMapBtn').addEventListener('click', () => {
    const name = $('hostNewMapName').value.trim();
    if (!name) return showToast('请填写版图名', 'error');
    socket.emit('host:addMap', { name });
    $('hostNewMapName').value = '';
  });
  $('hostExportMapsBtn').addEventListener('click', () => {
    socket.emit('host:exportMaps');
  });
  $('hostImportMapsBtn').addEventListener('click', () => {
    $('hostImportMapsFile').click();
  });
  $('hostImportMapsFile').addEventListener('change', async () => {
    const f = $('hostImportMapsFile').files && $('hostImportMapsFile').files[0];
    if (!f) return;
    try {
      const text = await f.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data.maps)) {
        return showToast('JSON 格式错误:需要 maps 数组', 'error');
      }
      if (!confirm(`确定要导入 ${data.maps.length} 个版图?现有版图会被覆盖!`)) return;
      socket.emit('host:importMaps', { data });
    } catch (e) {
      showToast('JSON 解析失败: ' + e.message, 'error');
    }
    $('hostImportMapsFile').value = '';
  });
  $('hostMovePlayerBtn').addEventListener('click', () => {
    const playerId = $('hostMovePlayer').value;
    const mapId = $('hostMovePlayerMap').value;
    if (!mapId) return showToast('请选择目标版图', 'error');
    // v2.4.19: 如果用户没在版图上选点,使用 (0.5, 0.5)
    const x = hostPickMovePos ? hostPickMovePos.x : 0.5;
    const y = hostPickMovePos ? hostPickMovePos.y : 0.5;
    socket.emit('host:movePlayerToMap', { playerId, mapId, x, y });
    hostPickMovePos = null;
    const dsp = $('hostMovePosDisplay');
    if (dsp) dsp.textContent = '未选';
  });
  // v2.4.19: 玩家起始属性 (HP/MP/SAN)
  // v2.4.21: 默认值改为 10(与 defaultCharacter 一致)
  // v2.4.31: 增加 gold 字段
  // v2.4.32: 6 玩家通用循环
  for (const pid of PLAYER_IDS) {
    const btn = $('hostSet' + pid.charAt(0).toUpperCase() + pid.slice(1) + 'InitBtn');
    if (!btn) continue;
    btn.addEventListener('click', () => {
      const Upper = pid.charAt(0).toUpperCase() + pid.slice(1);
      const hpVal = parseInt($('host' + Upper + 'InitHp').value) || 10;
      const mpVal = parseInt($('host' + Upper + 'InitMp').value) || 10;
      const sanVal = parseInt($('host' + Upper + 'InitSan').value) || 50;
      const goldVal = parseInt($('host' + Upper + 'InitGold').value) || 100;
      socket.emit('host:setPlayerInit', {
        playerId: pid,
        hp: hpVal, mp: mpVal, san: sanVal, gold: goldVal
      });
      showToast(`✅ 已应用 ${pid.toUpperCase()} 起始属性(💰${goldVal})`, 'info');
    });
  }

  // v2.4.31: 玩家金币调整 - 快速按钮(±10/±50/自定义)
  // v2.4.32: 用 PLAYER_IDS 循环绑定所有玩家
  document.addEventListener('click', (e) => {
    if (!e.target || !e.target.dataset || !e.target.dataset.goldAction) return;
    const action = e.target.dataset.goldAction;
    const playerId = e.target.dataset.goldPlayer;
    if (!isPlayerId(playerId)) return;
    let delta = 0;
    if (action === 'plus' || action === 'minus') {
      const amt = parseInt(e.target.dataset.goldAmount) || 0;
      delta = action === 'plus' ? amt : -amt;
    } else if (action === 'custom') {
      const inputId = 'host' + playerId.charAt(0).toUpperCase() + playerId.slice(1) + 'GoldDelta';
      const inp = $(inputId);
      delta = inp ? (parseInt(inp.value) || 0) : 0;
    }
    if (delta === 0) {
      showToast('请输入非零增量(正=加,负=减)', 'error');
      return;
    }
    socket.emit('host:adjustPlayerGold', { playerId, delta });
  });

  // v2.4.19: 主持人 → 玩家 私聊
  $('hostChatSendBtn').addEventListener('click', () => {
    const input = $('hostChatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    const target = $('hostChatTarget').value;
    socket.emit('host:chatToPlayer', { target, text });
    input.value = '';
  });
  $('hostChatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('hostChatSendBtn').click();
  });
  $('hostChatClearBtn').addEventListener('click', () => {
    const target = $('hostChatTarget').value;
    if (!confirm('清空该玩家频道?')) return;
    socket.emit('host:clearChat', { target });
  });
  $('hostChatTarget').addEventListener('change', () => {
    renderHostChatLog();
  });
  // 监听 host 端导出 JSON 自动下载
  socket.on('maps:exported', (data) => {
    try {
      const blob = new Blob([data.json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName || 'trpg-maps.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('已导出 JSON', 'info');
    } catch (e) {
      showToast('导出失败: ' + e.message, 'error');
    }
  });

  // Tab B: 发到桌面
  $('hostSendPadBtn').addEventListener('click', () => {
    const bodyText = $('hostPadBody').value.trim();
    const payload = {
      type: $('hostPadType').value,
      title: $('hostPadTitle').value.trim(),
      body: bodyText
    };
    if (!bodyText) {
      return showToast('请填写内容或URL', 'error');
    }
    socket.emit('host:sendToPad', payload);
    $('hostPadTitle').value = '';
    $('hostPadBody').value = '';
  });

  // v2.4.20: 旧 hostSendPlayerBtn 已被 hostPlayerSendBtn 取代,删除旧代码

  // v2.3: 主持人发送内容给玩家(多类型,含剧本)
  $('hostPlayerSendBtn')?.addEventListener('click', () => {
    const targets = $$('input[name="hostPlayerSendTarget"]:checked').map(c => c.value);
    if (targets.length === 0) return showToast('请至少勾选一个玩家', 'error');
    const type = $('hostPlayerSendType').value;
    const title = $('hostPlayerSendTitle').value.trim();
    const body = $('hostPlayerSendBody').value.trim();
    if (!body && !title && type !== 'script') return showToast('请填写内容或URL', 'error');
    if (type === 'script' && !isHttpOrLocalUrl(body)) return showToast('剧本类型必须提供 URL (http://... 或 /uploads/...)', 'error');
    socket.emit('host:sendToPlayer', { targets, type, title, body });
    $('hostPlayerSendTitle').value = '';
    $('hostPlayerSendBody').value = '';
  });

  // v2.1 线索多选分发
  $('hostSendClueBtn').addEventListener('click', () => {
    const targets = $$('input[name="hostClueTarget"]:checked').map(c => c.value);
    if (targets.length === 0) return showToast('请至少勾选一个目标', 'error');
    const payload = {
      targets,
      title: $('hostClueTitle').value.trim(),
      body: $('hostClueBody').value.trim(),
      imageUrl: $('hostClueImage').value.trim()
    };
    if (!payload.body && !payload.imageUrl) return showToast('线索内容或配图至少填一个', 'error');
    socket.emit('host:sendClue', payload);
    $('hostClueTitle').value = '';
    $('hostClueBody').value = '';
    $('hostClueImage').value = '';
  });

  // v2.1 主持人给玩家背包添加物品(多选)
  $('hostAddBagBtn').addEventListener('click', () => {
    const targets = $$('input[name="hostBagTarget"]:checked').map(c => c.value);
    if (targets.length === 0) return showToast('请至少勾选一个玩家', 'error');
    const payload = {
      targets,
      title: $('hostBagTitle').value.trim(),
      body: $('hostBagBody').value.trim(),
      imageUrl: $('hostBagImage').value.trim()
    };
    if (!payload.title) return showToast('请填写物品名称', 'error');
    socket.emit('host:addToPlayerBackpack', payload);
    $('hostBagTitle').value = '';
    $('hostBagBody').value = '';
    $('hostBagImage').value = '';
  });
  $('hostBagUploadBtn').addEventListener('click', () => $('hostBagFile').click());
  $('hostBagFile').addEventListener('change', async () => {
    const f = $('hostBagFile');
    const file = f.files && f.files[0];
    if (!file) return;
    try {
      const result = await uploadFile(file);
      $('hostBagImage').value = result.url;
      showToast('✅ 配图已上传');
    } catch (e) { /* uploadFile already toasted */ }
    f.value = '';
  });
  $('hostLogBtn').addEventListener('click', () => {
    const msg = $('hostLogInput').value.trim();
    if (!msg) return;
    socket.emit('host:log', msg);
    $('hostLogInput').value = '';
  });
  $('hostLogInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('hostLogBtn').click();
  });
  $('hostClearAllBtn').addEventListener('click', () => {
    if (confirm('确定重置本局?所有内容将被清空,版图也会清除!')) {
      socket.emit('host:clearAll');
    }
  });
  $('hostShutdownBtn').addEventListener('click', () => {
    if (confirm('确定关闭服务器?\n所有连接会断开,需要手动重新启动才能继续使用!')) {
      showToast('🛑 服务器正在关闭…');
      socket.emit('host:shutdown');
      setTimeout(() => {
        showToast('❌ 连接已断开');
      }, 1500);
    }
  });
  $('hostRestartBtn').addEventListener('click', () => {
    if (confirm('确定重启服务器?\n所有连接会断开,约 3 秒后会自动恢复(可手动刷新页面)。')) {
      showToast('🔄 服务器正在重启…');
      socket.emit('host:restart');
      setTimeout(() => {
        showToast('❌ 连接已断开,3秒后自动重连…');
      }, 1500);
    }
  });

  // v2.4.18: 主持人 BGM 按钮 (现在设置的是当前版图的专属 BGM)
  $('hostSetBgmBtn').addEventListener('click', () => {
    const url = $('hostBgmUrl').value.trim();
    if (!isHttpOrLocalUrl(url)) return showToast('BGM URL 必须以 http(s):// 或 /uploads/ 开头', 'error');
    const title = $('hostBgmTitle').value.trim() || '背景音乐';
    const volume = Math.max(0, Math.min(1, parseFloat($('hostBgmVolume').value) || 0.5));
    const mapName = ($('hostBgmCurrentMapLabel') && $('hostBgmCurrentMapLabel').dataset.mapName) || '当前版图';
    socket.emit('host:setMapBgm', { url, title, volume });
    showToast(`🎵 已为「${mapName}」设置 BGM`, 'info');
  });
  $('hostStopBgmBtn').addEventListener('click', () => {
    socket.emit('host:setMapBgm', { clear: true });
  });
  // v2.2: 暂停 / 继续 BGM (v2.4.18 改用客户端控制,不再发 server)
  // v2.4.20: 修复 - BGM audio 元素的 id 是 'bgmAudio',不是 'padBgmAudio' / 'playerBgmAudio'
  $('hostPauseBgmBtn').addEventListener('click', () => {
    const audio = $('bgmAudio');
    if (audio) audio.pause();
    bgmUserPaused = true;
    showToast('⏸ 已暂停 BGM', 'info');
  });
  $('hostResumeBgmBtn').addEventListener('click', () => {
    const audio = $('bgmAudio');
    if (audio && audio.src) {
      audio.play().catch(() => showToast('⚠️ 播放失败', 'error'));
    }
    bgmUserPaused = false;
    showToast('▶ 已继续 BGM', 'info');
  });
  // v2.2: 音量滑杆调节 (客户端即时)
  const volRange = $('hostBgmVolumeRange');
  if (volRange) {
    volRange.addEventListener('input', () => {
      const v = parseFloat(volRange.value);
      const label = $('hostBgmVolumeLabel');
      if (label) label.textContent = Math.round(v * 100) + '%';
      const volInput = $('hostBgmVolume');
      if (volInput) volInput.value = v;
    });
    volRange.addEventListener('change', () => {
      const v = parseFloat(volRange.value);
      const audio = $('bgmAudio');
      if (audio) audio.volume = v;
      // v2.4.19: 把音量同步到服务端,让其他端也生效
      const volInput = $('hostBgmVolume');
      if (volInput) volInput.value = v;
      const url = ($('hostBgmUrl') || {}).value || '';
      const title = ($('hostBgmTitle') || {}).value || '背景音乐';
      if (url) socket.emit('host:setMapBgm', { url, title, volume: v });
    });
  }

  // v2.4.20: 主持人回合控制按钮已移除(回合自动跟随)

  // v2.0 HP 扣血按钮
  $$('[data-hp-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.hpTarget;
      const deltaBtn = parseInt(btn.dataset.hpDelta);
      const amountInput = $('host' + (target === 'p1' ? 'P1' : 'P2') + 'HpDelta');
      const val = Math.abs(parseInt(amountInput.value) || 1);
      socket.emit('host:deductHp', { target, amount: deltaBtn * val });
    });
  });
  // v2.4.20: HP/MP/SAN 通用增减按钮(下拉选属性)
  // v2.4.32: 通用化 6 玩家
  $$('[data-stat-delta-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.statDeltaTarget;
      const deltaBtn = parseInt(btn.dataset.statDelta);
      // 取同行的 select
      const row = btn.closest('.host-hp-row');
      const sel = row ? row.querySelector('select[data-stat-target]') : null;
      const stat = sel ? sel.value : 'hp';
      const amountInput = $('host' + (isPlayerId(target) ? target.charAt(0).toUpperCase() + target.slice(1) : 'P1') + 'StatDelta');
      const val = Math.abs(parseInt(amountInput ? amountInput.value : 1) || 1);
      socket.emit('host:adjustStat', { target, stat, amount: deltaBtn * val });
      const sign = deltaBtn > 0 ? '+' : '-';
      const targetLabel = isPlayerId(target) ? roleLabel(target) : '玩家';
      showToast(`💔 ${targetLabel} ${stat.toUpperCase()} ${sign}${val}`, 'info');
    });
  });

  // v2.4.18: 玩家跟随版图切换的开关
  // v2.4.32: 6 玩家都用同一选择器
  for (const pid of PLAYER_IDS) {
    const tgl = $('hostFollow' + pid.charAt(0).toUpperCase() + pid.slice(1) + 'Toggle');
    if (tgl) {
      tgl.addEventListener('change', () => {
        socket.emit('host:toggleFollower', { playerId: pid });
      });
    }
    const startBtn = $('hostPickStart' + pid.charAt(0).toUpperCase() + pid.slice(1) + 'Btn');
    if (startBtn) startBtn.addEventListener('click', () => setHostPickMode('start' + pid.charAt(0).toUpperCase() + pid.slice(1)));
  }
  $('hostPickMovePosBtn').addEventListener('click', () => { hostNpcMonitorTargetNpcId = null; setHostPickMode('movePos'); });
  // 标记模式
  $('hostMarkModeToggle').addEventListener('click', () => {
    if (hostPickMode === 'mark') setHostPickMode(null);
    else setHostPickMode('mark');
  });
  // 放置内容项
  $('hostPlaceItemBtn').addEventListener('click', () => setHostPickMode('placeItem'));
  // 放置 NPC
  $('hostPlaceNpcBtn').addEventListener('click', () => setHostPickMode('placeNpc'));
  // 取消选点
  $('hostCancelPickBtn').addEventListener('click', () => setHostPickMode(null));

  // v2.4.18: 全局剧本浮窗(任何页面都能打开)
  $('hostScriptFab').addEventListener('click', () => {
    const f = $('hostScriptFloating');
    if (f.style.display === 'none' || !f.style.display) {
      f.style.display = 'flex';
      // 同步浮动窗内容
      const script = (lastState && lastState.script) || { url: '', file: '', fileName: '' };
      renderHostScriptViewerTo(script, $('hostScriptViewerFloating'));
    } else {
      f.style.display = 'none';
    }
  });
  $('hostScriptFloatingClose').addEventListener('click', () => {
    $('hostScriptFloating').style.display = 'none';
  });

  // v2.4.46: hostAddNpcBtn 已移除,改为 hostPlaceNpcBtn 触发选点模式(在 bindHostEvents 末尾绑定)
  // NPC 头像上传按钮仍保留
  $('hostNpcAvatarUploadBtn').addEventListener('click', () => $('hostNpcAvatarFile').click());
  $('hostNpcAvatarFile').addEventListener('change', async () => {
    const f = $('hostNpcAvatarFile');
    const file = f.files && f.files[0];
    if (!file) return;
    try {
      const result = await uploadFile(file);
      $('hostNpcAvatarUrl').value = result.url;
      showToast('✅ 头像已上传');
    } catch (e) { /* uploadFile already toasted */ }
    f.value = '';
  });

  // v2.4.47: 「在版图上放内容」中的快速放置 NPC
  const quickNpcPlaceBtn = $('hostQuickPlaceNpcBtn');
  if (quickNpcPlaceBtn) {
    quickNpcPlaceBtn.addEventListener('click', () => {
      // 同步快速输入框的值到主 NPC 输入框,然后触发 placeNpc 选点模式
      const quickName = $('hostQuickNpcName').value.trim();
      const quickAvatar = $('hostQuickNpcAvatarUrl').value.trim();
      if (!quickName) {
        showToast('请先输入 NPC 名字', 'error');
        return;
      }
      $('hostNpcName').value = quickName;
      $('hostNpcAvatarUrl').value = quickAvatar;
      setHostPickMode('placeNpc');
    });
  }
  const quickNpcUploadBtn = $('hostQuickNpcAvatarUploadBtn');
  if (quickNpcUploadBtn) {
    quickNpcUploadBtn.addEventListener('click', () => $('hostQuickNpcAvatarFile').click());
  }
  const quickNpcFile = $('hostQuickNpcAvatarFile');
  if (quickNpcFile) {
    quickNpcFile.addEventListener('change', async () => {
      const file = quickNpcFile.files && quickNpcFile.files[0];
      if (!file) return;
      try {
        const result = await uploadFile(file);
        $('hostQuickNpcAvatarUrl').value = result.url;
        showToast('✅ 头像已上传');
      } catch (e) { /* uploadFile already toasted */ }
      quickNpcFile.value = '';
    });
  }
  const quickNpcAiBtn = $('hostQuickNpcAvatarAiBtn');
  if (quickNpcAiBtn && !quickNpcAiBtn.dataset.bound) {
    quickNpcAiBtn.dataset.bound = '1';
    quickNpcAiBtn.addEventListener('click', () => {
      if (quickNpcAiBtn.disabled) return;
      const name = $('hostQuickNpcName').value.trim();
      const defaultPrompt = name ? `人物头像:${name},半身像,清晰五官,游戏立绘风格` : '';
      showAIGenerateModal({
        kind: 'npc',
        hint: '🎨 描述 NPC 外观,AI 生成头像',
        defaultSize: '512x512',
        defaultPrompt,
        onUse: (url) => {
          $('hostQuickNpcAvatarUrl').value = url;
          showToast('🎨 头像已填入,点 "+ 添加 NPC" 选点放置');
        }
      });
    });
  }

  // v2.0 版图项缩放
  $('hostScaleRange').addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    $('hostScaleValue').textContent = v.toFixed(2) + '×';
    if (hostSelectedMapItem) {
      socket.emit('host:scaleMapItem', { id: hostSelectedMapItem, scale: v });
    }
  });
  $('hostScaleResetBtn').addEventListener('click', () => {
    if (hostSelectedMapItem) {
      socket.emit('host:scaleMapItem', { id: hostSelectedMapItem, scale: 1.0 });
      $('hostScaleRange').value = '1';
      $('hostScaleValue').textContent = '1.00×';
    }
  });

  // v2.1 主持人骰子(单按钮 + 公投开关)
  $$('[data-host-dice]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sides = parseInt(btn.dataset.hostDice);
      socket.emit('host:rollDice', { rolls: [{ count: 1, sides }] });
    });
  });
  $('hostDiceRollBtn').addEventListener('click', () => {
    const notation = $('hostDiceNotation').value.trim();
    if (!notation) return showToast('请输入骰子表达式或点预设按钮', 'error');
    socket.emit('host:rollDice', { notation });
  });
  $('hostDicePublicToggle').addEventListener('change', (e) => {
    socket.emit('host:setDicePublic', { public: !!e.target.checked });
    showToast(e.target.checked ? '🌐 已切换为公投模式(所有骰子公开)' : '🔒 已切换为私投模式(所有骰子仅自己可见)');
  });

  // v2.0 剧本
  $('hostScriptLoadBtn').addEventListener('click', () => {
    const url = $('hostScriptUrl').value.trim();
    if (!isHttpOrLocalUrl(url)) return showToast('剧本网址必须以 http(s):// 开头', 'error');
    socket.emit('host:setScript', { url, file: '', fileName: '' });
  });
  $('hostScriptClearUrlBtn').addEventListener('click', () => {
    socket.emit('host:setScript', { url: '', file: '', fileName: '' });
    $('hostScriptUrl').value = '';
  });
  $('hostScriptUploadBtn').addEventListener('click', () => $('hostScriptFile').click());
  $('hostScriptFile').addEventListener('change', async () => {
    const f = $('hostScriptFile');
    const file = f.files && f.files[0];
    if (!file) return;
    try {
      const result = await uploadFile(file);
      socket.emit('host:setScript', { url: '', file: result.url, fileName: file.name });
      $('hostScriptFileUrl').value = result.url;
      showToast('✅ 剧本已上传');
    } catch (e) { /* uploadFile already toasted */ }
    f.value = '';
  });
  $('hostScriptClearFileBtn').addEventListener('click', () => {
    socket.emit('host:setScript', { url: lastState.script?.url || '', file: '', fileName: '' });
    $('hostScriptFileUrl').value = '';
  });

  // v2.4.48: NPC 卡片内联编辑 - 事件委托(替代原 npcEditor*/npcMonitor* 弹窗绑定)
  const npcListEl = $('hostNpcList');
  if (npcListEl && !npcListEl.dataset.bound) {
    npcListEl.dataset.bound = '1';
    // 点击事件委托
    npcListEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const npcId = btn.dataset.npcId;
      if (!npcId || action === 'shop-file') return;
      const card = btn.closest('.npc-card');
      const f = (field) => card && card.querySelector(`[data-field="${field}"]`);
      switch (action) {
        case 'delete-npc': {
          const npc = findNpcById(npcId);
          if (confirm(`删除 NPC "${npc ? npc.name : ''}"?`)) socket.emit('host:deleteNpc', { id: npcId });
          break;
        }
        case 'save-npc': {
          const payload = {
            id: npcId,
            name: f('name') ? f('name').value.trim() : '',
            avatar: f('avatar') ? f('avatar').value.trim() : '',
            scale: f('scale') ? parseFloat(f('scale').value) || 1 : 1,
            aiEnabled: f('aiEnabled') ? f('aiEnabled').checked : false,
            aiPersonality: f('aiPersonality') ? f('aiPersonality').value.trim() : '',
            aiMemory: f('aiMemory') ? f('aiMemory').value.trim() : '',
            aiGoal: f('aiGoal') ? f('aiGoal').value.trim() : '',
            aiGreeting: f('aiGreeting') ? f('aiGreeting').value.trim() : '',
            aiGender: f('aiGender') ? f('aiGender').value : 'neutral',
            aiAge: f('aiAge') ? f('aiAge').value : 'adult',
            aiPadSync: f('aiPadSync') ? f('aiPadSync').checked : true,
            aiSharedChat: f('aiSharedChat') ? f('aiSharedChat').checked : false
          };
          socket.emit('host:updateNpc', payload);
          showToast('✅ NPC 已保存');
          break;
        }
        case 'clear-chat': {
          if (!confirm('确定清除所有玩家与该 NPC 的 AI 对话记录?此操作不可撤销。')) return;
          socket.emit('host:clearNpcChat', { npcId });
          showToast('🧹 已清除对话记录');
          break;
        }
        case 'shop-delete': {
          const itemId = btn.dataset.itemId;
          socket.emit('host:deleteNpcShopItem', { npcId, itemId });
          break;
        }
        case 'shop-upload': {
          const fileInput = card && card.querySelector('[data-action="shop-file"]');
          if (fileInput) fileInput.click();
          break;
        }
        case 'shop-ai': {
          if (btn.disabled) return;
          const titleEl = f('shopTitle');
          const title = titleEl ? titleEl.value.trim() : '';
          const defaultPrompt = title ? `物品图标:${title},游戏道具图标,清晰,正面视角` : '';
          showAIGenerateModal({
            kind: 'item',
            hint: '🎨 描述商品外观,AI 生成商品图',
            defaultSize: '512x512',
            defaultPrompt,
            onUse: (url) => { const imgEl = f('shopImage'); if (imgEl) imgEl.value = url; showToast('🎨 商品图已填入'); }
          });
          break;
        }
        case 'shop-add': {
          const titleEl = f('shopTitle');
          const title = titleEl ? titleEl.value.trim() : '';
          if (!title) return showToast('请输入商品名称', 'error');
          const payload = {
            npcId,
            title,
            body: f('shopBody') ? f('shopBody').value.trim() : '',
            imageUrl: f('shopImage') ? f('shopImage').value.trim() : '',
            price: f('shopPrice') ? parseInt(f('shopPrice').value) || 0 : 0,
            stock: f('shopStock') ? parseInt(f('shopStock').value) : -1
          };
          socket.emit('host:addNpcShopItem', payload);
          if (titleEl) titleEl.value = '';
          const bodyEl = f('shopBody'); if (bodyEl) bodyEl.value = '';
          const imgEl = f('shopImage'); if (imgEl) imgEl.value = '';
          break;
        }
        case 'refresh-chat': {
          socket.emit('host:getNpcChatLog', { npcId });
          break;
        }
        case 'intervene-speak': {
          const textEl = f('intervene-speak');
          const text = textEl ? textEl.value.trim() : '';
          if (!text) return showToast('请输入发言内容', 'error');
          const target = f('intervene-target') ? (f('intervene-target').value || null) : null;
          socket.emit('host:interveneNpc', { npcId, mode: 'speak', message: text, targetPlayer: target });
          if (textEl) textEl.value = '';
          break;
        }
        case 'intervene-inject': {
          const textEl = f('intervene-inject');
          const text = textEl ? textEl.value.trim() : '';
          if (!text) return showToast('请输入指令内容', 'error');
          const target = f('intervene-target') ? (f('intervene-target').value || null) : null;
          socket.emit('host:interveneNpc', { npcId, mode: 'inject', message: text, targetPlayer: target });
          if (textEl) textEl.value = '';
          break;
        }
        case 'send-clue': {
          const targetEl = f('clue-target');
          const target = targetEl ? targetEl.value : '';
          const titleEl = f('clue-title');
          const title = titleEl ? titleEl.value.trim() : '';
          const bodyEl = f('clue-body');
          const body = bodyEl ? bodyEl.value.trim() : '';
          if (!target) return showToast('请选择目标玩家', 'error');
          if (!title) return showToast('请输入线索标题', 'error');
          socket.emit('host:interveneNpc', { npcId, mode: 'clue', targetPlayer: target, clueTitle: title, clueBody: body });
          if (titleEl) titleEl.value = '';
          if (bodyEl) bodyEl.value = '';
          break;
        }
        case 'apply-stats': {
          const targetEl = f('control-target');
          const target = targetEl ? targetEl.value : '';
          if (!target) return showToast('请选择目标玩家', 'error');
          const hpDelta = f('hp-delta') ? parseInt(f('hp-delta').value) || 0 : 0;
          const mpDelta = f('mp-delta') ? parseInt(f('mp-delta').value) || 0 : 0;
          const sanDelta = f('san-delta') ? parseInt(f('san-delta').value) || 0 : 0;
          const goldDelta = f('gold-delta') ? parseInt(f('gold-delta').value) || 0 : 0;
          if (hpDelta === 0 && mpDelta === 0 && sanDelta === 0 && goldDelta === 0) {
            return showToast('请输入非零的变化值', 'error');
          }
          socket.emit('host:controlPlayerStats', { target, hpDelta, mpDelta, sanDelta, goldDelta });
          ['hp-delta', 'mp-delta', 'san-delta', 'gold-delta'].forEach(k => { const el = f(k); if (el) el.value = '0'; });
          break;
        }
        case 'pick-pos': {
          hostNpcMonitorTargetNpcId = npcId;
          setHostPickMode('movePos');
          showToast('🖱️ 请在版图上点击玩家要移动到的位置', 'info');
          break;
        }
        case 'move-player': {
          const targetEl = f('control-target');
          const target = targetEl ? targetEl.value : '';
          if (!target) return showToast('请选择目标玩家', 'error');
          const mapEl = f('control-map');
          const mapId = mapEl ? mapEl.value : '';
          if (!mapId) return showToast('请选择目标版图', 'error');
          const posEl = f('pos-display');
          const posText = posEl ? posEl.textContent : '';
          let x = 0.5, y = 0.5;
          if (posText && posText !== '未选') {
            const parts = posText.split(',').map(s => parseFloat(s.trim()));
            if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
              x = parts[0]; y = parts[1];
            }
          } else if (hostPickMovePos) {
            x = hostPickMovePos.x; y = hostPickMovePos.y;
          }
          socket.emit('host:controlMovePlayer', { target, mapId, x, y });
          if (posEl) posEl.textContent = '未选';
          hostPickMovePos = null;
          hostNpcMonitorTargetNpcId = null;
          break;
        }
      }
    });
    // 文件上传事件委托(change 事件)
    npcListEl.addEventListener('change', async (e) => {
      const fileInput = e.target.closest('[data-action="shop-file"]');
      if (!fileInput) return;
      const card = fileInput.closest('.npc-card');
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      try {
        const result = await uploadFile(file);
        const imgEl = card && card.querySelector('[data-field="shopImage"]');
        if (imgEl) imgEl.value = result.url;
        showToast('✅ 商品图已上传');
      } catch (err) { /* uploadFile already toasted */ }
      fileInput.value = '';
    });
  }

  // v2.4.47: 桌面信息流 AI 生图
  const hostPadAiBtn = $('hostPadAiBtn');
  if (hostPadAiBtn && !hostPadAiBtn.dataset.bound) {
    hostPadAiBtn.dataset.bound = '1';
    hostPadAiBtn.addEventListener('click', () => {
      if (hostPadAiBtn.disabled) return;
      const title = $('hostPadTitle').value.trim();
      const defaultPrompt = title ? `场景插图:${title},游戏插画风格` : '';
      showAIGenerateModal({
        kind: 'item',
        hint: '🎨 描述图片内容,AI 生成后填入正文 URL',
        defaultSize: '1024x576',
        defaultPrompt,
        onUse: (url) => { $('hostPadBody').value = url; showToast('🎨 图片 URL 已填入正文'); }
      });
    });
  }
  // v2.4.47: 分发线索 AI 生图
  const hostClueAiBtn = $('hostClueAiBtn');
  if (hostClueAiBtn && !hostClueAiBtn.dataset.bound) {
    hostClueAiBtn.dataset.bound = '1';
    hostClueAiBtn.addEventListener('click', () => {
      if (hostClueAiBtn.disabled) return;
      const title = $('hostClueTitle').value.trim();
      const defaultPrompt = title ? `线索物品图:${title},神秘风格,游戏插画` : '';
      showAIGenerateModal({
        kind: 'item',
        hint: '🎨 描述线索图,AI 生成后填入配图 URL',
        defaultSize: '512x512',
        defaultPrompt,
        onUse: (url) => { $('hostClueImage').value = url; showToast('🎨 配图 URL 已填入'); }
      });
    });
  }
  // v2.4.47: 玩家背包 AI 生图
  const hostBagAiBtn = $('hostBagAiBtn');
  if (hostBagAiBtn && !hostBagAiBtn.dataset.bound) {
    hostBagAiBtn.dataset.bound = '1';
    hostBagAiBtn.addEventListener('click', () => {
      if (hostBagAiBtn.disabled) return;
      const title = $('hostBagTitle').value.trim();
      const defaultPrompt = title ? `物品图标:${title},游戏道具,清晰` : '';
      showAIGenerateModal({
        kind: 'item',
        hint: '🎨 描述物品外观,AI 生成后填入配图 URL',
        defaultSize: '512x512',
        defaultPrompt,
        onUse: (url) => { $('hostBagImage').value = url; showToast('🎨 配图 URL 已填入'); }
      });
    });
  }
  // v2.4.47: 玩家端头像 AI 生图 - 已移到 bindPlayerEvents(此处在 host 端不会执行,玩家端才需要)

  // v2.1 通用:data-close 按钮关闭对应 modal
  $$('[data-close]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-close');
      if (!id) return;
      const modal = $(id);
      if (modal) modal.style.display = 'none';
      // 关闭 NPC 编辑器时清空 target
      if (id === 'npcEditorModal') hostNpcEditorTarget = null;
    });
  });

  $('hostExit').addEventListener('click', leaveRole);
  bindZoomEvents();
  bindUploadButtons();
  console.log('[bindHostEvents] done - all events bound');
}

function switchHostTab(tab) {
  hostSelectedTab = tab;
  $$('.host-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  $$('.host-tab').forEach(t => t.style.display = (t.dataset.tab === tab ? 'flex' : 'none'));
  // v2.4.30: 进入版图 tab 时,后台预加载图库
  if (tab === 'map') preloadImageLibrary();
}

// =====================================================================
// Zoom Modal
// =====================================================================
function openZoom(item) {
  const modal = $('zoomModal');
  const titleEl = $('zoomTitle');
  const bodyEl = $('zoomBody');
  const metaEl = $('zoomMeta');
  titleEl.textContent = item.title || typeLabel(item.type);
  bodyEl.innerHTML = '';
  if (item.body) {
    const p = document.createElement('div');
    p.textContent = item.body;
    p.style.whiteSpace = 'pre-wrap';
    p.style.marginBottom = '12px';
    bodyEl.appendChild(p);
  }
  if (item.imageUrl) {
    const img = document.createElement('img');
    img.src = item.imageUrl;
    img.alt = '';
    bodyEl.appendChild(img);
  }
  if (item.audioUrl) {
    const a = document.createElement('audio');
    a.controls = true;
    a.autoplay = true;
    a.src = item.audioUrl;
    bodyEl.appendChild(a);
  }
  if (item.videoUrl) {
    const v = document.createElement('video');
    v.controls = true;
    v.autoplay = true;
    v.src = item.videoUrl;
    bodyEl.appendChild(v);
  }
  metaEl.textContent = fmtTime(item.ts) + ' · ' + typeLabel(item.type);
  modal.style.display = 'flex';
}

function closeZoom() {
  $('zoomModal').style.display = 'none';
  $$('#zoomBody audio, #zoomBody video').forEach(m => {
    try { m.pause(); m.currentTime = 0; } catch (e) {}
  });
  $('zoomBody').innerHTML = '';
}

function bindZoomEvents() {
  if ($('zoomClose').dataset.bound) return;
  $('zoomClose').dataset.bound = '1';
  $('zoomClose').addEventListener('click', closeZoom);
  $('zoomBackdrop').addEventListener('click', closeZoom);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('zoomModal').style.display === 'flex') closeZoom();
  });
}

// =====================================================================
// 启动
// =====================================================================
bindHomeEvents();
bindZoomEvents();
bindDiceEvents();
initBgm();
bindUploadButtons();
bindAIGenerateEvents();
bindNpcAiBtn();
bindAddItemAiBtn();
bindAddMapAiBtn();
// v2.4.43: 修复手机扫码 - 如果 URL 是 /join,不要覆盖 showView('join')
// handleJoinQueryParam() 已在 bindHomeEvents 里调用,这里只在非 /join 路径时显示 home
if (window.location.pathname !== '/join' && !new URLSearchParams(window.location.search).get('from')) {
  showView('home');
}

// =====================================================================
// v2.4.41: AI 图片生成(Agnes AI 接入) - 通用模态框
//   - 调用方: showAIGenerateModal({ kind, hint, defaultSize, defaultPrompt, onUse })
//   - 用户在模态框内输入描述 + 选 size,生成后点"使用此图片" → 回调 onUse(url, prompt)
// =====================================================================
window.__aiGenCtx = window.__aiGenCtx || null;   // { kind, onUse, url, prompt, originalPrompt }

async function checkAIAvailable() {
  try {
    const r = await fetch('/api/ai/status');
    const j = await r.json();
    return j.available === true;
  } catch (e) { return false; }
}

async function bindAIGenerateEvents() {
  if ($('aiGenSubmitBtn').dataset.bound) return;
  $('aiGenSubmitBtn').dataset.bound = '1';
  $('aiGenCloseBtn').addEventListener('click', closeAIGenModal);
  $('aiGenCancelBtn').addEventListener('click', closeAIGenModal);
  $('aiGenSubmitBtn').addEventListener('click', doAIGenerate);
  $('aiGenUseBtn').addEventListener('click', useAIGenResult);
  // 点 backdrop 关闭
  $('aiGenModal').addEventListener('click', (e) => {
    if (e.target === $('aiGenModal')) closeAIGenModal();
  });
  // Esc 关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('aiGenModal').style.display === 'flex') closeAIGenModal();
  });
  // 检测 AI 可用性,在所有"AI 生成"按钮上启用/禁用
  const available = await checkAIAvailable();
  document.querySelectorAll('[data-ai-generate]').forEach(btn => {
    btn.disabled = !available;
    btn.title = available ? '' : 'AI 未配置(在 config.json 设 agnesApiKey)';
  });
  if (typeof window !== 'undefined') window.__aiAvailable = available;
}

// v2.4.41: AI 模态框 - 通用入口
// 用法:showAIGenerateModal({ kind: 'npc'|'item'|'map', hint, defaultSize, defaultPrompt, onUse: (url, prompt)=>... })
function showAIGenerateModal(opts) {
  opts = opts || {};
  window.__aiGenCtx = { onUse: opts.onUse || null, kind: opts.kind || '' };
  const hint = opts.hint || '输入描述(中文/英文均可),AI 会自动翻译成英文 prompt 生成图片';
  const defaultSize = opts.defaultSize || '1024x576';
  const defaultPrompt = opts.defaultPrompt || '';
  $('aiGenHint').textContent = hint;
  $('aiGenPrompt').value = defaultPrompt;
  $('aiGenSize').value = defaultSize;
  $('aiGenTranslate').checked = true;
  $('aiGenStatus').style.display = 'none';
  $('aiGenStatus').textContent = '';
  $('aiGenStatus').className = 'ai-gen-status';
  $('aiGenPreview').style.display = 'none';
  $('aiGenPreviewImg').src = '';
  $('aiGenPromptDisplay').textContent = '';
  $('aiGenUseBtn').style.display = 'none';
  $('aiGenSubmitBtn').disabled = false;
  $('aiGenSubmitBtn').textContent = '🚀 生成';
  $('aiGenModal').style.display = 'flex';
  setTimeout(() => { try { $('aiGenPrompt').focus(); } catch (e) {} }, 50);
}

function closeAIGenModal() {
  $('aiGenModal').style.display = 'none';
  window.__aiGenCtx = null;
}

// v2.4.42: AI 状态显示 - 支持 spinner + 进度条 + 阶段文字
function setAIGenStatus(text, kind, opts) {
  opts = opts || {};
  const el = $('aiGenStatus');
  el.style.display = 'block';
  el.className = 'ai-gen-status ai-gen-' + (kind || 'loading');
  // 阶段名(如"翻译中" / "生成中")在第一行,带 spinner
  const stage = opts.stage || text;
  const detail = opts.detail || '';
  const progress = typeof opts.progress === 'number' ? opts.progress : null;
  el.innerHTML = '';
  if (kind === 'loading') {
    const wrap = document.createElement('div');
    wrap.innerHTML = '<span class="ai-gen-spinner"></span><strong>' + escapeHtml(stage) + '</strong>';
    if (detail) wrap.appendChild(document.createTextNode(' ' + detail));
    el.appendChild(wrap);
    if (progress !== null) {
      const bar = document.createElement('div');
      bar.className = 'ai-gen-progress';
      const barInner = document.createElement('div');
      barInner.className = 'ai-gen-progress-bar';
      barInner.style.width = Math.max(2, Math.min(100, progress)) + '%';
      bar.appendChild(barInner);
      el.appendChild(bar);
    }
  } else {
    el.textContent = text;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function doAIGenerate() {
  console.log('[AI] doAIGenerate called');
  const prompt = $('aiGenPrompt').value.trim();
  if (!prompt) return setAIGenStatus('请输入图片描述', 'error');
  const size = $('aiGenSize').value;
  const translate = $('aiGenTranslate').checked;
  console.log('[AI] prompt:', prompt, 'size:', size, 'translate:', translate);
  $('aiGenSubmitBtn').disabled = true;
  $('aiGenSubmitBtn').textContent = '⏳ 生成中...';
  $('aiGenUseBtn').style.display = 'none';
  $('aiGenPreview').style.display = 'none';

  // v2.4.42: 阶段 1 - 翻译(如果需要)
  if (translate && /[一-龥]/.test(prompt)) {
    setAIGenStatus('正在翻译中文 → 英文...', 'loading', { stage: '步骤 1/2:翻译中', detail: '~ 5-10 秒', progress: 15 });
  } else {
    setAIGenStatus('正在生成图片...', 'loading', { stage: '生成中', detail: '~ 10-30 秒', progress: 10 });
  }

  const t0 = Date.now();
  // 计时器 - 实时更新状态文字,让用户看到还在跑
  let timer = setInterval(() => {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
    const el = $('aiGenStatus');
    if (el && el.classList.contains('ai-gen-loading')) {
      const stage1 = translate && /[一-龥]/.test(prompt);
      // 进度条:0-20s 慢慢爬到 80%,20s+ 保持 90% 等待
      let p = Math.min(90, 10 + elapsed * 4);
      if (elapsed > 20) p = 90 + Math.min(8, (elapsed - 20) * 0.4);
      const stageText = stage1 ? '步骤 2/2:生成中' : '生成中';
      setAIGenStatus(el.firstChild ? el.firstChild.textContent : '', 'loading', {
        stage: stageText,
        detail: `已等待 ${elapsed} 秒,大图可能需要 30-90 秒`,
        progress: p
      });
    }
  }, 1000);

  try {
    console.log('[AI] sending fetch /api/ai/image...');
    // v2.4.49: 增加 AbortController 超时控制(120秒),防止手机浏览器默认超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    const r = await fetch('/api/ai/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, size, translate }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    console.log('[AI] response status:', r.status);
    const j = await r.json();
    console.log('[AI] response body:', j);
    clearInterval(timer);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    if (!r.ok) {
      setAIGenStatus('❌ 生成失败: ' + (j.error || ('HTTP ' + r.status)) + ' (耗时 ' + elapsed + 's)', 'error');
      $('aiGenSubmitBtn').disabled = false;
      $('aiGenSubmitBtn').textContent = '🚀 重新生成';
      return;
    }
    // 成功
    let statusText = '✅ 生成成功!耗时 ' + elapsed + 's,大小 ' + (j.size / 1024).toFixed(0) + 'KB';
    if (j.originalPrompt && j.originalPrompt !== j.prompt) {
      statusText += `\n已翻译: "${j.prompt.slice(0, 60)}${j.prompt.length > 60 ? '...' : ''}"`;
    }
    setAIGenStatus(statusText, 'success');
    $('aiGenPreviewImg').src = j.url + '?t=' + Date.now();
    let displayPrompt = 'Prompt: ' + j.prompt;
    if (j.originalPrompt && j.originalPrompt !== j.prompt) {
      displayPrompt = `原文: ${j.originalPrompt}\n英文: ${j.prompt}`;
    }
    $('aiGenPromptDisplay').textContent = displayPrompt;
    $('aiGenPreview').style.display = 'block';
    // 暂存结果
    window.__aiGenCtx = Object.assign({}, window.__aiGenCtx || {}, {
      url: j.url,
      prompt: j.prompt,
      originalPrompt: j.originalPrompt
    });
    $('aiGenUseBtn').style.display = 'inline-block';
    $('aiGenSubmitBtn').disabled = false;
    $('aiGenSubmitBtn').textContent = '🔄 重新生成';
  } catch (e) {
    clearInterval(timer);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    // v2.4.49: 更详细的错误信息,帮助诊断手机端问题
    let errMsg = e.message || String(e);
    if (e.name === 'AbortError') {
      errMsg = '请求超时(120秒),可能是网络较慢或 AI 服务响应时间长。请重试或使用更小的图片尺寸';
    } else if (e.name === 'TypeError' && /Failed to fetch|NetworkError/i.test(errMsg)) {
      errMsg = '网络连接失败: ' + errMsg + '。请检查手机和电脑是否在同一 WiFi,以及服务器是否正在运行';
    }
    console.error('[AI] error:', e);
    setAIGenStatus('❌ ' + errMsg + ' (耗时 ' + elapsed + 's)', 'error');
    $('aiGenSubmitBtn').disabled = false;
    $('aiGenSubmitBtn').textContent = '🚀 重新生成';
  }
}

function useAIGenResult() {
  const ctx = window.__aiGenCtx;
  if (!ctx || !ctx.url) return setAIGenStatus('没有可用的图片', 'error');
  if (typeof ctx.onUse === 'function') {
    try { ctx.onUse(ctx.url, ctx.prompt, ctx.originalPrompt); } catch (e) { console.error(e); }
  }
  closeAIGenModal();
  showToast('✅ 已使用 AI 生成的图片');
}

// v2.4.41: NPC 头像 AI 按钮
function bindNpcAiBtn() {
  const btn = $('hostNpcAvatarAiBtn');
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    const name = $('hostNpcName').value.trim();
    const defaultPrompt = name ? `人物头像:${name},半身像,清晰五官,游戏立绘风格` : '';
    showAIGenerateModal({
      kind: 'npc',
      hint: '🎨 描述 NPC 外观(例:中世纪女骑士,银发,穿红色披风),AI 生成头像',
      defaultSize: '512x512',
      defaultPrompt,
      onUse: (url) => {
        $('hostNpcAvatarUrl').value = url;
        showToast('🎨 头像已填入,点 "+ 添加 NPC" 保存');
      }
    });
  });
}

// v2.4.41: MapItem AI 按钮(物品/线索/事件/图片 通用)
function bindAddItemAiBtn() {
  const btn = $('hostAddAiBtn');
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    const type = $('hostAddType') ? $('hostAddType').value : 'item';
    const title = $('hostAddTitle').value.trim();
    let hint = '🎨 描述要生成的图(可填中文),AI 会自动翻译';
    let defaultPrompt = '';
    if (type === 'item') {
      hint = '🎨 描述物品外观(例:一个发光的金色怀表,链子很精致)';
      defaultPrompt = title ? `游戏物品图:${title}` : '';
    } else if (type === 'clue') {
      hint = '🎨 描述线索物品外观(例:一张发黄的羊皮纸地图)';
      defaultPrompt = title ? `线索物品:${title}` : '';
    } else if (type === 'event') {
      hint = '🎨 描述事件配图(事件触发时显示)';
      defaultPrompt = title ? `场景图:${title}` : '';
    } else if (type === 'image') {
      hint = '🎨 描述装饰图(直接作为版图项)';
      defaultPrompt = title || '';
    }
    showAIGenerateModal({
      kind: 'item',
      hint,
      defaultSize: '512x512',
      defaultPrompt,
      onUse: (url) => {
        if (type === 'event') {
          // 事件类型的图,填到 imageUrl 字段
          if ($('hostAddEventImage')) $('hostAddEventImage').value = url;
          else $('hostAddBody').value = url;
        } else {
          $('hostAddBody').value = url;
        }
        showToast('🎨 图片 URL 已填入,点 "+ 添加到版图" 保存');
      }
    });
  });
}

// v2.4.41: 版图 AI 按钮(自动创建版图 + 设为背景)
function bindAddMapAiBtn() {
  const btn = $('hostAddMapAiBtn');
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    const existingName = $('hostNewMapName').value.trim();
    showAIGenerateModal({
      kind: 'map',
      hint: '🗺️ 描述版图场景(例:哥特式城堡大厅,月光从彩窗透入,石柱林立)',
      defaultSize: '1024x576',
      defaultPrompt: existingName || '',
      onUse: (url, prompt) => {
        // v2.4.43: 修复 - 先新建版图(带 url),server 会自动设为 activeMap,然后再 setMapUrl 确保背景生效
        const mapName = existingName || (prompt ? prompt.slice(0, 12).trim() : 'AI 版图');
        // host:addMap 支持 url 字段,server 会设到新 map 上
        socket.emit('host:addMap', { name: mapName, url: url });
        // 同时填入 hostMapUrl 输入框(视觉反馈)
        $('hostMapUrl').value = url;
        if (!existingName) $('hostNewMapName').value = '';
        showToast('🗺️ 已创建版图「' + mapName + '」并设置 AI 背景');
      }
    });
  });
}
