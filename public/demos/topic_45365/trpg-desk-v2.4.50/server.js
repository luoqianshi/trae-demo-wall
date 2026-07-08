// =====================================================================
// TRPG Desk v1.1 - 跑团主持人辅助器 服务端
// v1.1 新增:心跳保活 / 文件上传 / 背景音乐 / 骰子 / 投喂钉到版图
// =====================================================================
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;
const GAME_VERSION = '2.4.50';
// v2.4.32: 支持 1~6 玩家(未来扩展到 10)
//   - 主持人(host) / Pad(pad) / 玩家(p1~p6)
//   - 未来扩展只需改 PLAYER_IDS + PLAYER_COLORS + initialState
const ROLES = ['host', 'pad', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
const PLAYER_IDS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
const MAX_PLAYERS = PLAYER_IDS.length;
// 6 个玩家的颜色 + 图标 + 默认 label(版图上显示)
const PLAYER_COLORS = {
  p1: { color: '#e74c3c', icon: '🔴', label: 'P1' },
  p2: { color: '#3498db', icon: '🔵', label: 'P2' },
  p3: { color: '#2ecc71', icon: '🟢', label: 'P3' },
  p4: { color: '#f39c12', icon: '🟡', label: 'P4' },
  p5: { color: '#9b59b6', icon: '🟣', label: 'P5' },
  p6: { color: '#e67e22', icon: '🟠', label: 'P6' }
};
// 工具:判断一个 role 是不是玩家(1~6)
function isPlayerId(s) { return PLAYER_IDS.indexOf(s) !== -1; }
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// 允许上传的文档类型(剧本)
const DOC_MIMES = /^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|json|xml|javascript|x-yaml|octet-stream)$/;

// ---------- v2.4.41: Agnes AI 图片生成配置 ----------
// v2.4.50: 支持自定义 OpenAI 兼容 API
// API key 优先级: 环境变量 > config.json > config.example.json
let AGNES_API_KEY = process.env.AGNES_API_KEY || null;
const AGNES_CONFIG_PATH = path.join(__dirname, 'config.json');
const AGNES_CONFIG_EXAMPLE_PATH = path.join(__dirname, 'config.example.json');
let AI_CONFIG = null;
if (!AGNES_API_KEY) {
  // 优先读 config.json,没有再读 config.example.json(发布包用)
  const cfgPath = fs.existsSync(AGNES_CONFIG_PATH) ? AGNES_CONFIG_PATH
    : fs.existsSync(AGNES_CONFIG_EXAMPLE_PATH) ? AGNES_CONFIG_EXAMPLE_PATH : null;
  if (cfgPath) {
    try {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      AI_CONFIG = cfg;
      if (cfg && cfg.agnesApiKey) AGNES_API_KEY = cfg.agnesApiKey;
    } catch (e) { /* 忽略 JSON 错误 */ }
  }
}

// v2.4.50: 自定义 API 配置(覆盖 Agnes AI)
const CUSTOM_API = AI_CONFIG?.customApi;
const USE_CUSTOM_API = !!(CUSTOM_API && CUSTOM_API.enabled && CUSTOM_API.apiKey && CUSTOM_API.baseUrl);
const AI_BASE = USE_CUSTOM_API ? CUSTOM_API.baseUrl.replace(/\/+$/, '') : 'https://apihub.agnes-ai.com';
const AI_API_KEY = USE_CUSTOM_API ? CUSTOM_API.apiKey : AGNES_API_KEY;
const AI_MODEL_IMG = USE_CUSTOM_API ? (CUSTOM_API.imageModel || 'dall-e-3') : 'agnes-image-2.1-flash';
const AI_MODEL_TEXT = USE_CUSTOM_API ? (CUSTOM_API.textModel || 'gpt-4o-mini') : 'agnes-2.0-flash';
const AI_DEFAULT_IMG_SIZE = USE_CUSTOM_API ? (CUSTOM_API.imageSize || '1024x1024') : '1024x768';
const AGNES_AVAILABLE = !!AI_API_KEY;
console.log(`[ai] ${USE_CUSTOM_API ? '自定义 API' : 'Agnes AI'} ${AGNES_AVAILABLE ? '已配置' : '未配置'} (model: ${AI_MODEL_IMG}, text: ${AI_MODEL_TEXT})`);

// 调用 AI chat completions (text) - 兼容 OpenAI / Agnes 格式
async function agnesText(systemPrompt, userPrompt) {
  if (!AI_API_KEY) throw new Error('AI API Key 未配置');
  const r = await fetch(`${AI_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: AI_MODEL_TEXT,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 500,
      temperature: 0.5
    })
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`AI text ${r.status}: ${t.slice(0, 200)}`);
  }
  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() || '';
}

// v2.4.45: AI 多轮对话(用于 NPC AI 对话)
// messages: [{ role: 'system'|'user'|'assistant', content: '...' }]
async function agnesChat(messages, opts = {}) {
  if (!AI_API_KEY) throw new Error('AI API Key 未配置');
  const r = await fetch(`${AI_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: AI_MODEL_TEXT,
      messages,
      max_tokens: opts.max_tokens || 800,
      temperature: opts.temperature ?? 0.8
    })
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`AI chat ${r.status}: ${t.slice(0, 200)}`);
  }
  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() || '';
}
async function agnesImage(prompt, size) {
  if (!AI_API_KEY) throw new Error('AI API Key 未配置');
  const imgSize = size || AI_DEFAULT_IMG_SIZE;
  const body = USE_CUSTOM_API
    ? { model: AI_MODEL_IMG, prompt, n: 1, size: imgSize, response_format: 'url' }
    : { model: AI_MODEL_IMG, prompt, size: imgSize, extra_body: { response_format: 'url' } };
  const r = await fetch(`${AI_BASE}/v1/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const t = await r.text();
    // v2.4.49: 解析 AI API 错误,返回更友好的提示
    let friendlyMsg = `AI image ${r.status}: ${t.slice(0, 200)}`;
    try {
      const errJson = JSON.parse(t);
      const errCode = errJson.error?.code || errJson.code || '';
      const errMsg = errJson.error?.message || errJson.message || '';
      if (errCode === 'content_policy_violation' || /content.policy|unable to generate/i.test(errMsg)) {
        friendlyMsg = '内容策略违规:AI 拒绝生成此内容。请修改描述后重试(避免敏感、暴力、色情等内容)';
      } else if (r.status === 401 || r.status === 403) {
        friendlyMsg = 'API Key 无效或已过期,请检查 config.json 中的 apiKey';
      } else if (r.status === 429) {
        friendlyMsg = 'API 调用频率过高,请稍等几秒后重试';
      } else if (r.status >= 500) {
        friendlyMsg = `AI 服务暂时不可用(${r.status}),请稍后重试`;
      } else if (errMsg) {
        friendlyMsg = `AI 生成失败(${r.status}):${errMsg}`;
      }
    } catch (e) { /* 解析失败,用原始错误 */ }
    throw new Error(friendlyMsg);
  }
  const j = await r.json();
  // 兼容多种返回结构(OpenAI / Agnes / 其他)
  let url = null;
  if (j.data && Array.isArray(j.data) && j.data[0]) {
    url = j.data[0].url || j.data[0].b64_json;
  } else if (j.url) {
    url = j.url;
  } else if (Array.isArray(j.data)) {
    url = j.data[0];
  }
  if (!url) throw new Error('AI 未返回图片 URL: ' + JSON.stringify(j).slice(0, 200));
  if (url.startsWith('data:')) {
    // base64 内嵌,直接解码
    const m = url.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!m) throw new Error('base64 图片格式不识别');
    return { buffer: Buffer.from(m[2], 'base64'), ext: m[1] };
  }
  return { remoteUrl: url };
}

// 下载远程图片到 uploads/ai-XXX.ext
async function downloadImageToUploads(remoteUrl) {
  const r = await fetch(remoteUrl);
  if (!r.ok) throw new Error(`下载图片失败: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  // 从 URL 或 content-type 推断扩展名
  let ext = (remoteUrl.match(/\.(png|jpg|jpeg|webp|gif)(?:\?|$)/i) || [])[1] || 'png';
  ext = ext.toLowerCase();
  const filename = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buf);
  return { url: '/uploads/' + filename, size: buf.length, filename };
}

// ---------- Multer 文件上传 ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    // 文件名: ts_random_原名
    const ext = path.extname(file.originalname).slice(0, 12);
    const safe = path.basename(file.originalname, ext).replace(/[^\w\u4e00-\u9fa5-]/g, '_').slice(0, 40);
    cb(null, Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6) + '_' + safe + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },  // 50 MB
  fileFilter: (req, file, cb) => {
    // 允许:图片/音频/视频(媒体)
    if (/^(image|audio|video)\//.test(file.mimetype)) cb(null, true);
    // 允许:剧本文档(pdf/doc/docx/文本/JSON 等)
    else if (DOC_MIMES.test(file.mimetype) || /^text\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('不支持的文件类型: ' + file.mimetype));
  }
});

// ---------- 初始状态 ----------
// v2.4.40: 接受 maxPlayers 参数(默认 1),只初始化前 N 个玩家,确保版图棋子数量与玩家数一致
function initialState(maxPlayersOverride) {
  // v2.4: 多版图系统 - 每个版图独立 items / npcs / pieces
  // - 物品(item): 卡片图标, 点击 → 玩家背包
  // - 线索(clue): 正方形图标, 点击 → 玩家线索栏
  // - NPC(npc):   圆形图标, 点击 → 对话互动
  // - 事件(event): 问号图标, 点击 → 播放媒体+效果
  // - 图片(image): 纯装饰图(不可拾)
  const defaultMapId = 'map_default';
  // v2.4.40: 默认 1 玩家,主持人可改 1~6
  const n = Math.max(1, Math.min(MAX_PLAYERS, maxPlayersOverride || 1));
  const activePids = PLAYER_IDS.slice(0, n);
  // v2.4.32: 通用化 - N 个玩家的 startPieces/pieces/playerMap/etc
  const startPieces = {};
  const pieces = {};
  const playerMap = {};
  const players = {};
  const characters = {};
  const backpack = {};
  const notes = {};
  const chat = {};
  const online = { host: false, pad: false };
  for (const pid of activePids) {
    startPieces[pid] = { x: 0.5, y: 0.5 };
    pieces[pid] = { x: 0.5, y: 0.5, color: PLAYER_COLORS[pid].color, label: PLAYER_COLORS[pid].icon + PLAYER_COLORS[pid].label };
    playerMap[pid] = defaultMapId;
    players[pid] = { privateContent: [] };
    characters[pid] = defaultCharacter();
    backpack[pid] = [];
    notes[pid] = '';
    chat[pid] = [];
    online[pid] = false;
  }
  return {
    scriptTitle: '跑团模组',
    script: { url: '', file: '', fileName: '' },
    // v2.4: 多版图
    maps: [
      {
        id: defaultMapId,
        name: '起始版图',
        url: null,
        // v2.4.18: 每个版图独立的 BGM
        bgm: null,         // { url, title, volume } | null
        // v2.4.18: 玩家首次进入该版图的出生点(每玩家一份)
        startPieces,
        // 版图上的可交互内容(物品/线索/事件/图片)
        items: [],
        npcs: [],
        // 每玩家在当前版图的位置(可独立于其他版图)
        pieces: { ...pieces }
      }
    ],
    activeMapId: defaultMapId,                          // 主持人/pad 当前查看的版图
    playerMap,                                          // 每玩家所在版图
    // 兼容字段 - 派生自 activeMap
    map: { url: null, updatedAt: 0 },
    mapItems: [],
    padFeed: [],
    padHighlight: null,      // { id, type, title, body, from, detail, modifier, total, ts, expiresAt } | null
    bgm: null,              // { url, title, volume } | null
    pieces: { ...pieces },
    players,
    // v2.0 新增
    characters,                                       // 玩家角色卡
    backpack,                                         // 玩家背包(捡到的物品)
    notes,                                            // 玩家笔记
    // npcs 字段已废弃(移到 maps[].npcs)
    npcs: [],
    turn: { order: activePids.slice(), current: activePids[0], round: 1 },  // v2.4.40: 只包含激活玩家
    hostDiceLog: [],                                  // 主持人骰子历史
    hostDicePublic: false,                            // v2.1: 主持人骰子默认"私投"(关闭公开)
    eventLog: [],
    // v2.4.18: 主持人临时标记(箭头) - { id, x, y, color, ts, expiresAt }
    mapMarker: null,
    // v2.4.18: 跟随版图切换的玩家 (本局激活玩家子集)
    followers: activePids.slice(),                    // v2.4.40: 默认 1 玩家
    // v2.4.18: NPC 对话广播 (玩家点击后,pad 端大屏显示) - { id, npcId, npcName, dialogueId, index, total, title, type, content }
    npcDialog: null,
    // v2.4.19: 私聊频道
    chat,
    online,
    // v2.4.40: 本局游戏玩家人数默认 1,主持人可设置 1~MAX_PLAYERS
    maxPlayers: n,
    // v2.4.34: 玩家"查看"副本(给看线索功能)
    viewedClues: {}
  };
}

// v2.4.34: 取得本局游戏激活的玩家 ID 列表
//   - 不传参: 使用 state.maxPlayers
//   - 传参: 直接使用指定数字(用于 state 还没初始化时,如 initialState 内)
function getActivePlayerIds(maxOverride) {
  let max = MAX_PLAYERS;
  if (typeof maxOverride === 'number' && maxOverride >= 1 && maxOverride <= MAX_PLAYERS) {
    max = maxOverride;
  } else if (typeof state !== 'undefined' && state && state.maxPlayers) {
    max = state.maxPlayers;
  }
  const n = Math.max(1, Math.min(MAX_PLAYERS, max));
  return PLAYER_IDS.slice(0, n);
}

// v2.4.40: 同步玩家槽位 - 当 maxPlayers 变化时,增/删玩家所有相关数据
//   - 删: p[N..MAX] 的 pieces / players / characters / backpack / notes / chat / online / startPieces / playerMap / viewedClues
//   - 踢人: 已连接的多余玩家被强制断开(去到首页)
//   - 增: 现有 < N 时,补齐到 N (用 defaultCharacter 初始化)
function syncPlayerSlots(newMax) {
  const n = Math.max(1, Math.min(MAX_PLAYERS, newMax || 1));
  const keepPids = PLAYER_IDS.slice(0, n);
  const defaultMapId = (state.maps && state.maps[0]) ? state.maps[0].id : 'map_default';
  // 1) 删: 移除多余玩家所有数据,并踢出已连接的 socket
  for (let i = n; i < PLAYER_IDS.length; i++) {
    const pid = PLAYER_IDS[i];
    if (state.players) delete state.players[pid];
    if (state.characters) delete state.characters[pid];
    if (state.backpack) delete state.backpack[pid];
    if (state.notes) delete state.notes[pid];
    if (state.chat) delete state.chat[pid];
    if (state.online) delete state.online[pid];
    if (state.playerMap) delete state.playerMap[pid];
    if (state.pieces) delete state.pieces[pid];
    if (state.viewedClues) delete state.viewedClues[pid];
    // 每个版图上的棋子/出生点
    for (const m of (state.maps || [])) {
      if (m && m.startPieces) delete m.startPieces[pid];
      if (m && m.pieces) delete m.pieces[pid];
    }
    // 踢人: 通知客户端角色已不存在
    if (sockets[pid]) {
      try {
        const s = io.sockets.sockets.get(sockets[pid]);
        if (s) {
          s.emit('toast', { msg: `主持人把本局玩家数改为 ${n},你已不在场` });
          s.emit('forceLeave', { reason: 'slot_removed' });
          s.disconnect(true);
        }
      } catch (e) { /* ignore */ }
      sockets[pid] = null;
    }
  }
  // 2) 增: 补齐新玩家数据
  for (let i = 0; i < n; i++) {
    const pid = PLAYER_IDS[i];
    if (state.players && !state.players[pid]) state.players[pid] = { privateContent: [] };
    if (state.characters && !state.characters[pid]) state.characters[pid] = defaultCharacter();
    if (state.backpack && !state.backpack[pid]) state.backpack[pid] = [];
    if (state.notes && !(pid in state.notes)) state.notes[pid] = '';
    if (state.chat && !state.chat[pid]) state.chat[pid] = [];
    if (state.online && !(pid in state.online)) state.online[pid] = false;
    if (state.playerMap && !state.playerMap[pid]) state.playerMap[pid] = defaultMapId;
    if (state.pieces && !state.pieces[pid]) {
      state.pieces[pid] = { x: 0.5, y: 0.5, color: PLAYER_COLORS[pid].color, label: PLAYER_COLORS[pid].icon + PLAYER_COLORS[pid].label };
    }
    if (state.viewedClues && !state.viewedClues[pid]) state.viewedClues[pid] = [];
    for (const m of (state.maps || [])) {
      if (m && m.startPieces && !m.startPieces[pid]) m.startPieces[pid] = { x: 0.5, y: 0.5 };
      if (m && m.pieces && !m.pieces[pid]) {
        m.pieces[pid] = { x: 0.5, y: 0.5, color: PLAYER_COLORS[pid].color, label: PLAYER_COLORS[pid].icon + PLAYER_COLORS[pid].label };
      }
    }
  }
  // 3) 同步 turn.order / followers
  if (!state.turn) state.turn = { order: [], current: null, round: 1 };
  state.turn.order = keepPids.slice();
  if (!state.turn.current || state.turn.current.indexOf === undefined || keepPids.indexOf(state.turn.current) === -1) {
    state.turn.current = keepPids[0] || null;
  }
  if (Array.isArray(state.followers)) {
    state.followers = state.followers.filter(p => keepPids.indexOf(p) !== -1);
  } else {
    state.followers = keepPids.slice();
  }
  // 4) 主动断开玩家 → 客户端需要监听 'forceLeave' 回到首页
  // (已在上面处理踢人)
  return keepPids;
}

function defaultCharacter() {
  return {
    name: '',
    gender: '',
    avatar: '',           // 图片 URL(/uploads/...)
    // v2.4.21: 默认 HP/MP/SAN 上限都是 10
    hp: { current: 10, max: 10 },
    mp: { current: 10, max: 10 },
    san: { current: 10, max: 10 },
    // v2.4.31: 金币数量(初始 100,主持人可调整;可作为交易/任务奖励)
    gold: 100,
    attributes: [
      // COC 7 版默认属性(玩家可改/删/加)
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
    // v2.4.30: 技能列表 (COC/DND 通用)
    //   - 名称可自定义(侦察/搜索/建筑学/医学/聆听/说服/潜行/心理学 等)
    //   - 值: COC 用 1-100 成功率, DND 用 +1 ~ +10 加成
    //   - 最多 50 个技能
    skills: [],
    intro: ''             // 角色介绍
  };
}

let state = initialState();
// v2.4.32: 动态 socket 列表(host/pad + 6 个玩家)
const sockets = { host: null, pad: null };
for (const pid of PLAYER_IDS) sockets[pid] = null;
let idCounter = 0;
function newId() { return 'tc_' + (++idCounter) + '_' + Date.now().toString(36); }

// v2.4.29: 预设角色模板 - COC(克苏鲁的呼唤) 5 个 + DND(龙与地下城) 5 个
// 玩家手机端可以一键应用,快速建立可玩角色卡
const CHARACTER_TEMPLATES = [
  // ========== COC 调查员模板 (5 个) ==========
  {
    id: 'coc_detective',
    game: 'COC',
    icon: '🕵️',
    name: '私家侦探',
    gender: '男',
    hp: { current: 11, max: 11 },
    mp: { current: 10, max: 10 },
    san: { current: 60, max: 60 },
    // v2.4.31: 金币(私家侦探收入不错)
    gold: 150,
    intro: '前警局探员,因某次执法的灰色地带事件被开除,转行做私家侦探。习惯随身携带左轮手枪、笔记本和烟斗,见多识广但话不多,眼神总在评估危险。',
    attributes: [
      { id: 'str', name: '力量 STR', value: 55 },
      { id: 'con', name: '体质 CON', value: 60 },
      { id: 'siz', name: '体型 SIZ', value: 60 },
      { id: 'dex', name: '敏捷 DEX', value: 65 },
      { id: 'app', name: '外貌 APP', value: 50 },
      { id: 'int', name: '智力 INT', value: 70 },
      { id: 'pow', name: '意志 POW', value: 60 },
      { id: 'edu', name: '教育 EDU', value: 75 },
      { id: 'luc', name: '幸运 LUC', value: 50 }
    ],
    // v2.4.30: COC 技能 (1-100 成功率)
    skills: [
      { name: '侦查 SPOT', value: 65, group: '调查' },
      { name: '聆听 LISTEN', value: 60, group: '调查' },
      { name: '搜索 SEARCH', value: 70, group: '调查' },
      { name: '说服 PERSUADE', value: 55, group: '社交' },
      { name: '心理学 PSYCH', value: 45, group: '学术' },
      { name: '手枪射击 HANDGUN', value: 60, group: '战斗' },
      { name: '斗殴 BRAWL', value: 50, group: '战斗' }
    ]
  },
  {
    id: 'coc_professor',
    game: 'COC',
    icon: '📚',
    name: '民俗学教授',
    gender: '男',
    hp: { current: 9, max: 9 },
    mp: { current: 12, max: 12 },
    san: { current: 55, max: 55 },
    // v2.4.31: 金币(教授稳定工资,但买书花费大)
    gold: 100,
    intro: '某大学民俗学终身教授,长期研究偏远地区的邪教崇拜和古老仪式,藏书万卷但体力欠佳。戴着厚底眼镜,说话喜欢掉书袋,但在神秘学方面是真正的权威。',
    attributes: [
      { id: 'str', name: '力量 STR', value: 35 },
      { id: 'con', name: '体质 CON', value: 45 },
      { id: 'siz', name: '体型 SIZ', value: 50 },
      { id: 'dex', name: '敏捷 DEX', value: 50 },
      { id: 'app', name: '外貌 APP', value: 50 },
      { id: 'int', name: '智力 INT', value: 80 },
      { id: 'pow', name: '意志 POW', value: 65 },
      { id: 'edu', name: '教育 EDU', value: 90 },
      { id: 'luc', name: '幸运 LUC', value: 45 }
    ],
    skills: [
      { name: '神秘学 OCCULT', value: 85, group: '学术' },
      { name: '图书馆学 LIBRARY', value: 80, group: '学术' },
      { name: '人类学 ANTHRO', value: 75, group: '学术' },
      { name: '说服 PERSUADE', value: 50, group: '社交' },
      { name: '考古学 ARCHAEOLOGY', value: 70, group: '学术' },
      { name: '母语 NATIVE', value: 80, group: '语言' },
      { name: '拉丁语 LATIN', value: 45, group: '语言' }
    ]
  },
  {
    id: 'coc_nurse',
    game: 'COC',
    icon: '💉',
    name: '战地护士',
    gender: '女',
    hp: { current: 10, max: 10 },
    mp: { current: 11, max: 11 },
    san: { current: 65, max: 65 },
    // v2.4.31: 金币(护士工资一般)
    gold: 60,
    intro: '一战退役战地护士,战壕里见过太多血肉与死亡,反而变得异常冷静。随身带着急救包和手术刀,擅长外科包扎,失眠严重时靠安眠药入睡。',
    attributes: [
      { id: 'str', name: '力量 STR', value: 50 },
      { id: 'con', name: '体质 CON', value: 60 },
      { id: 'siz', name: '体型 SIZ', value: 55 },
      { id: 'dex', name: '敏捷 DEX', value: 65 },
      { id: 'app', name: '外貌 APP', value: 60 },
      { id: 'int', name: '智力 INT', value: 60 },
      { id: 'pow', name: '意志 POW', value: 70 },
      { id: 'edu', name: '教育 EDU', value: 65 },
      { id: 'luc', name: '幸运 LUC', value: 55 }
    ],
    skills: [
      { name: '急救 FIRST AID', value: 80, group: '医疗' },
      { name: '医学 MEDICINE', value: 70, group: '医疗' },
      { name: '心理学 PSYCH', value: 50, group: '学术' },
      { name: '说服 PERSUADE', value: 45, group: '社交' },
      { name: '聆听 LISTEN', value: 55, group: '调查' },
      { name: '潜行 STEALTH', value: 40, group: '行动' }
    ]
  },
  {
    id: 'coc_journalist',
    game: 'COC',
    icon: '📰',
    name: '战地记者',
    gender: '女',
    hp: { current: 10, max: 10 },
    mp: { current: 10, max: 10 },
    san: { current: 50, max: 50 },
    // v2.4.31: 金币(记者收入中上)
    gold: 120,
    intro: '为追求独家新闻不择手段的女记者,常出没于危险地区。随身带着相机和速记本,擅长套话和伪装,但意志力在接连目睹灵异事件后已经接近崩溃。',
    attributes: [
      { id: 'str', name: '力量 STR', value: 45 },
      { id: 'con', name: '体质 CON', value: 50 },
      { id: 'siz', name: '体型 SIZ', value: 50 },
      { id: 'dex', name: '敏捷 DEX', value: 60 },
      { id: 'app', name: '外貌 APP', value: 65 },
      { id: 'int', name: '智力 INT', value: 70 },
      { id: 'pow', name: '意志 POW', value: 55 },
      { id: 'edu', name: '教育 EDU', value: 70 },
      { id: 'luc', name: '幸运 LUC', value: 60 }
    ],
    skills: [
      { name: '说服 PERSUADE', value: 70, group: '社交' },
      { name: '骗术 DECEPTION', value: 60, group: '社交' },
      { name: '速记 TYPEWRITING', value: 75, group: '学术' },
      { name: '摄影 PHOTOGRAPHY', value: 65, group: '学术' },
      { name: '侦查 SPOT', value: 55, group: '调查' },
      { name: '心理学 PSYCH', value: 45, group: '学术' },
      { name: '外语 FOREIGN', value: 50, group: '语言' }
    ]
  },
  {
    id: 'coc_occultist',
    game: 'COC',
    icon: '🔮',
    name: '神秘学家',
    gender: '其他',
    hp: { current: 10, max: 10 },
    mp: { current: 15, max: 15 },
    san: { current: 48, max: 48 },
    // v2.4.31: 金币(富家子弟,大把钱挥霍)
    gold: 500,
    intro: '自费研究神秘学的富家子弟,购买了大量禁忌典籍,行为举止神秘。懂拉丁语、希腊语、古埃及语,会画魔法阵,经常单独去旧货市场淘古物。精神状态不稳,偶尔自言自语。',
    attributes: [
      { id: 'str', name: '力量 STR', value: 40 },
      { id: 'con', name: '体质 CON', value: 50 },
      { id: 'siz', name: '体型 SIZ', value: 50 },
      { id: 'dex', name: '敏捷 DEX', value: 50 },
      { id: 'app', name: '外貌 APP', value: 55 },
      { id: 'int', name: '智力 INT', value: 75 },
      { id: 'pow', name: '意志 POW', value: 80 },
      { id: 'edu', name: '教育 EDU', value: 80 },
      { id: 'luc', name: '幸运 LUC', value: 40 }
    ],
    skills: [
      { name: '神秘学 OCCULT', value: 90, group: '学术' },
      { name: '图书馆学 LIBRARY', value: 65, group: '学术' },
      { name: '艺术与手艺 CRAFT', value: 50, group: '通用' },
      { name: '心理学 PSYCH', value: 60, group: '学术' },
      { name: '说服 PERSUADE', value: 45, group: '社交' },
      { name: '拉丁语 LATIN', value: 70, group: '语言' },
      { name: '希腊语 GREEK', value: 60, group: '语言' },
      { name: '古埃及语 EGYPTIAN', value: 40, group: '语言' }
    ]
  },
  // ========== DND 冒险者模板 (5 个) ==========
  {
    id: 'dnd_fighter',
    game: 'DND',
    icon: '⚔️',
    name: '人类战士',
    gender: '男',
    hp: { current: 30, max: 30 },
    mp: { current: 5, max: 5 },
    san: { current: 20, max: 20 },
    // v2.4.31: 金币(雇佣兵退役,身家一般)
    gold: 80,
    intro: '王国的退役士兵,持剑与盾,擅长近身格斗。会多种武器,精通重甲穿戴,在战场上不惧死亡。性格直率,说话简短有力。',
    attributes: [
      { id: 'str', name: '力量 STR', value: 16 },
      { id: 'con', name: '体质 CON', value: 15 },
      { id: 'dex', name: '敏捷 DEX', value: 12 },
      { id: 'wis', name: '感知 WIS', value: 11 },
      { id: 'int', name: '智力 INT', value: 10 },
      { id: 'cha', name: '魅力 CHA', value: 13 }
    ],
    // v2.4.30: DND 技能 (基于熟练加值 +2)
    skills: [
      { name: '运动 ATHLETICS', value: 6, group: '力量' },
      { name: '察觉 PERCEPTION', value: 2, group: '感知' },
      { name: '威慑 INTIMIDATION', value: 4, group: '魅力' },
      { name: '生存 SURVIVAL', value: 2, group: '感知' },
      { name: '医疗 MEDICINE', value: 2, group: '感知' },
      { name: '历史 HISTORY', value: 2, group: '智力' }
    ]
  },
  {
    id: 'dnd_mage',
    game: 'DND',
    icon: '🪄',
    name: '精灵法师',
    gender: '女',
    hp: { current: 18, max: 18 },
    mp: { current: 35, max: 35 },
    san: { current: 20, max: 20 },
    // v2.4.31: 金币(精灵贵族出身,资产雄厚)
    gold: 300,
    intro: '来自永聚岛的精灵法师,寿命悠长,精通奥术魔法。身材修长,银发及腰,耳朵尖长。手持橡木法杖,会火球术、魔法飞弹、护盾术。性格冷漠但不失礼貌。',
    attributes: [
      { id: 'str', name: '力量 STR', value: 8 },
      { id: 'con', name: '体质 CON', value: 12 },
      { id: 'dex', name: '敏捷 DEX', value: 14 },
      { id: 'wis', name: '感知 WIS', value: 13 },
      { id: 'int', name: '智力 INT', value: 17 },
      { id: 'cha', name: '魅力 CHA', value: 11 }
    ],
    skills: [
      { name: '奥秘 ARCANA', value: 7, group: '智力' },
      { name: '历史 HISTORY', value: 7, group: '智力' },
      { name: '调查 INVESTIGATION', value: 5, group: '智力' },
      { name: '察觉 PERCEPTION', value: 3, group: '感知' },
      { name: '说服 PERSUADE', value: 3, group: '魅力' },
      { name: '通用语 COMMON', value: 4, group: '语言' },
      { name: '精灵语 ELVISH', value: 6, group: '语言' }
    ]
  },
  {
    id: 'dnd_rogue',
    game: 'DND',
    icon: '🗡️',
    name: '半身人游侠',
    gender: '男',
    hp: { current: 22, max: 22 },
    mp: { current: 10, max: 10 },
    san: { current: 20, max: 20 },
    // v2.4.31: 金币(盗贼,只信金币)
    gold: 250,
    intro: '出身盗贼世家的半身人,身材矮小但身手灵活。惯用双匕首,精通开锁、潜行、扒窃。机警、狡黠,擅长各种小把戏,只信任金币。',
    attributes: [
      { id: 'str', name: '力量 STR', value: 10 },
      { id: 'con', name: '体质 CON', value: 13 },
      { id: 'dex', name: '敏捷 DEX', value: 17 },
      { id: 'wis', name: '感知 WIS', value: 12 },
      { id: 'int', name: '智力 INT', value: 13 },
      { id: 'cha', name: '魅力 CHA', value: 14 }
    ],
    skills: [
      { name: '巧手 SLEIGHT', value: 7, group: '敏捷' },
      { name: '潜行 STEALTH', value: 7, group: '敏捷' },
      { name: '调查 INVESTIGATION', value: 5, group: '智力' },
      { name: '察觉 PERCEPTION', value: 5, group: '感知' },
      { name: '骗术 DECEPTION', value: 6, group: '魅力' },
      { name: '奥秘 ARCANA', value: 3, group: '智力' },
      { name: '开锁 LOCKPICK', value: 4, group: '工具' }
    ]
  },
  {
    id: 'dnd_cleric',
    game: 'DND',
    icon: '⛪',
    name: '圣武士牧师',
    gender: '女',
    hp: { current: 25, max: 25 },
    mp: { current: 28, max: 28 },
    san: { current: 25, max: 25 },
    // v2.4.31: 金币(教堂供奉)
    gold: 50,
    intro: '信仰光明之神的人类牧师,手持战锤与圣徽,身穿白金盔甲。会治疗术、神圣之火、祝福术、驱散亡灵。性格坚毅、富有同情心,绝不抛弃队友。',
    attributes: [
      { id: 'str', name: '力量 STR', value: 14 },
      { id: 'con', name: '体质 CON', value: 13 },
      { id: 'dex', name: '敏捷 DEX', value: 10 },
      { id: 'wis', name: '感知 WIS', value: 16 },
      { id: 'int', name: '智力 INT', value: 11 },
      { id: 'cha', name: '魅力 CHA', value: 15 }
    ],
    skills: [
      { name: '医疗 MEDICINE', value: 7, group: '感知' },
      { name: '宗教 RELIGION', value: 6, group: '智力' },
      { name: '洞察 INSIGHT', value: 6, group: '感知' },
      { name: '说服 PERSUADE', value: 5, group: '魅力' },
      { name: '察觉 PERCEPTION', value: 5, group: '感知' },
      { name: '运动 ATHLETICS', value: 4, group: '力量' },
      { name: '历史 HISTORY', value: 3, group: '智力' }
    ]
  },
  {
    id: 'dnd_bard',
    game: 'DND',
    icon: '🎻',
    name: '提夫林吟游诗人',
    gender: '其他',
    hp: { current: 20, max: 20 },
    mp: { current: 25, max: 25 },
    san: { current: 22, max: 22 },
    // v2.4.31: 金币(卖艺赚的,加上小费)
    gold: 75,
    intro: '四处流浪的提夫林吟游诗人,携带一把鲁特琴,歌声能让巨龙沉睡。懂多种语言,会用魅惑、治疗、增益魔法。脸上有角与尾巴,常被误解,但内心善良。',
    attributes: [
      { id: 'str', name: '力量 STR', value: 11 },
      { id: 'con', name: '体质 CON', value: 12 },
      { id: 'dex', name: '敏捷 DEX', value: 14 },
      { id: 'wis', name: '感知 WIS', value: 12 },
      { id: 'int', name: '智力 INT', value: 13 },
      { id: 'cha', name: '魅力 CHA', value: 17 }
    ],
    skills: [
      { name: '表演 PERFORMANCE', value: 7, group: '魅力' },
      { name: '说服 PERSUADE', value: 7, group: '魅力' },
      { name: '欺骗 DECEPTION', value: 5, group: '魅力' },
      { name: '杂技 ACROBATICS', value: 4, group: '敏捷' },
      { name: '历史 HISTORY', value: 4, group: '智力' },
      { name: '察觉 PERCEPTION', value: 3, group: '感知' },
      { name: '通用语 COMMON', value: 4, group: '语言' },
      { name: '龙语 DRACONIC', value: 4, group: '语言' }
    ]
  }
];

// ---------- 工具 ----------
function appendLog(msg) {
  state.eventLog.unshift({ id: newId(), msg, ts: Date.now() });
  if (state.eventLog.length > 80) state.eventLog.length = 80;
}
function isValidUrl(s) {
  return typeof s === 'string' && /^https?:\/\//i.test(s.trim()) || (typeof s === 'string' && s.startsWith('/uploads/'));
}
function isHttpOrLocalUrl(s) {
  // 允许 http(s):// 和 /uploads/...
  return typeof s === 'string' && (/^https?:\/\//i.test(s.trim()) || s.startsWith('/uploads/'));
}
function sanitizeText(s, max = 2000) {
  if (typeof s !== 'string') return '';
  return s.trim().slice(0, max);
}
function clamp01(v, dflt) {
  const n = parseFloat(v);
  if (Number.isFinite(n)) return Math.max(0, Math.min(1, n));
  return dflt;
}
function roleLabel(role) {
  // v2.4.32: 通用化 - 支持 6 个玩家
  if (role === 'host') return '主持人';
  if (role === 'pad') return 'Pad桌面';
  if (isPlayerId(role)) {
    const num = role.substring(1);
    return '玩家' + num;
  }
  return role;
}
function getSocketRole(sock) {
  for (const r of ROLES) if (sockets[r] === sock.id) return r;
  return null;
}

// v2.3.1: 版图颜色调色板(用于线索/物品/NPC 不重复分配)
const MAP_COLOR_PALETTE = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#34495e', '#d35400', '#16a085',
  '#8e44ad', '#27ae60', '#c0392b', '#f1c40f', '#7f8c8d',
  '#e84393', '#00b894', '#fdcb6e', '#6c5ce7', '#fd79a8',
  '#00cec9', '#ffeaa7', '#fab1a0', '#74b9ff', '#a29bfe',
  '#ff7675', '#55efc4', '#fdcb6e', '#636e72', '#b2bec3'
];

// v2.4: 多版图系统辅助函数
function getMapById(id) {
  return state.maps.find(m => m.id === id);
}
function getActiveMap() {
  return getMapById(state.activeMapId) || state.maps[0];
}
function getPlayerMap(playerId) {
  const mapId = state.playerMap[playerId];
  return getMapById(mapId) || getActiveMap();
}
// 把 activeMap 的 items/npcs/pieces 同步到 state 的兼容字段(用于旧的 buildStateForRole)
function syncCompatFields() {
  const m = getActiveMap();
  if (m) {
    state.map = { url: m.url, updatedAt: 0 };
    state.mapItems = m.items;
    state.npcs = m.npcs;
    // 兼容:pieces 取 activeMap.pieces(若玩家在不同版图,可能取不到)
    // 改用 buildStateForRole 自行处理
  }
}
function getUsedColors() {
  // 收集所有版图上已用的颜色(线索/物品/普通内容)
  const used = new Set();
  for (const m of state.maps) {
    for (const it of (m.items || [])) if (it.color) used.add(it.color);
    for (const n of (m.npcs || [])) if (n.color) used.add(n.color);
  }
  return used;
}
function pickUniqueColor() {
  // 从调色板选第一个未使用的颜色;全部用完则循环
  const used = getUsedColors();
  for (const c of MAP_COLOR_PALETTE) {
    if (!used.has(c)) return c;
  }
  // 调色板全部用完,使用基于时间戳的随机色
  return MAP_COLOR_PALETTE[Math.floor(Math.random() * MAP_COLOR_PALETTE.length)];
}

// ---------- 状态裁剪(权限隔离核心) ----------
// v2.4: 多版图系统 - 状态按角色裁剪
// v2.4.32: 通用化 - 支持 6 个玩家(p1~p6)
//   - host: 看到 activeMap + 所有 maps 列表
//   - pad:  看到 activeMap
//   - 玩家: 看到 playerMap[me] (自己的版图)
function buildStateForRole(role) {
  // v2.4.45: 过滤 NPC 的 aiChatLog(不发给客户端,避免数据量过大 + 隐私)
  const stripNpc = (npc) => {
    const n = { ...npc, dialogues: (npc.dialogues || []).map(d => ({ ...d })) };
    // v2.4.49: 深拷贝 shop 数组,防止引用问题导致玩家端看不到商品
    if (Array.isArray(n.shop)) n.shop = n.shop.map(s => ({ ...s }));
    delete n.aiChatLog;
    return n;
  };
  const host = role === 'host';
  if (host) {
    // 主持人: 返回所有版图的精简摘要 + 当前 activeMap 的完整内容
    const active = getActiveMap();
    const out = { ...state };
    // v2.4.18: 顶层 bgm 字段已被移除,BGM 在 maps[].bgm
    delete out.bgm;
    // v2.4.32: 通用化 - 所有玩家的公开数据
    // v2.4.40: 用 getActivePlayerIds() 避免访问未激活玩家的 undefined 字段
    const activePids = getActivePlayerIds();
    const playersOut = {};
    for (const pid of activePids) {
      const ch = state.characters[pid];
      playersOut[pid] = {
        privateContent: state.players[pid].privateContent.map(x => ({ ...x })),
        character: { ...ch, attributes: ch.attributes.map(a => ({ ...a })) },
        backpack: state.backpack[pid].map(x => ({ ...x }))
      };
    }
    const chatOut = {};
    for (const pid of activePids) chatOut[pid] = (state.chat[pid] || []).map(m => ({ ...m }));
    return {
      ...out,
      // v2.4: maps 字段替换为每个 map 的元数据 + 完整数据(activeMap)
      maps: state.maps.map(m => {
        const startPieces = {};
        for (const pid of activePids) startPieces[pid] = { ...(m.startPieces?.[pid] || { x: 0.5, y: 0.5 }) };
        const pieces = {};
        for (const pid of activePids) pieces[pid] = { ...(m.pieces[pid] || { x: 0.5, y: 0.5, color: PLAYER_COLORS[pid].color, label: PLAYER_COLORS[pid].icon + PLAYER_COLORS[pid].label }) };
        return {
          id: m.id, name: m.name, url: m.url, bgm: m.bgm ? { ...m.bgm } : null,
          startPieces,
          items: m.items.map(x => ({ ...x })),
          npcs: m.npcs.map(x => stripNpc(x)),
          pieces
        };
      }),
      // 兼容字段
      map: { url: active.url, updatedAt: 0 },
      mapItems: active.items.map(x => ({ ...x })),
      npcs: active.npcs.map(x => stripNpc(x)),
      // v2.4: 主持人端也看到 activeMap 上的棋子(兼容老逻辑)
      pieces: (() => {
        const p = {};
        for (const pid of activePids) p[pid] = { ...(active.pieces[pid] || { x: 0.5, y: 0.5, color: PLAYER_COLORS[pid].color, label: PLAYER_COLORS[pid].icon + PLAYER_COLORS[pid].label }) };
        return p;
      })(),
      padFeed: state.padFeed.map(x => ({ ...x })),
      eventLog: state.eventLog.map(x => ({ ...x })),
      hostDiceLog: state.hostDiceLog.map(x => ({ ...x })),
      hostDicePublic: state.hostDicePublic,
      // v2.1: 主持人端不展示玩家笔记
      players: playersOut,
      // v2.4.19: 主持人端看到所有玩家的私聊频道
      chat: chatOut,
      // v2.4.34: 主持人端看到所有玩家的"查看"副本
      viewedClues: (() => {
        const out = {};
        for (const pid of activePids) out[pid] = (state.viewedClues[pid] || []).map(x => ({ ...x }));
        return out;
      })(),
      // v2.4.34: 本局激活玩家 ID 列表
      activePlayerIds: activePids
    };
  }
  if (role === 'pad') {
    // pad: 看到 activeMap
    const active = getActiveMap();
    const activePids = getActivePlayerIds();
    const pieces = {};
    for (const pid of activePids) pieces[pid] = { ...(active.pieces[pid] || { x: 0.5, y: 0.5, color: PLAYER_COLORS[pid].color, label: PLAYER_COLORS[pid].icon + PLAYER_COLORS[pid].label }) };
    const publicCharacters = {};
    for (const pid of activePids) {
      const ch = state.characters[pid];
      publicCharacters[pid] = { name: ch.name, avatar: ch.avatar, hp: { ...ch.hp } };
    }
    return {
      scriptTitle: state.scriptTitle,
      map: { url: active.url, updatedAt: 0 },
      mapItems: active.items.map(x => ({ ...x })),
      pieces,
      padFeed: state.padFeed.map(x => ({ ...x })),
      padHighlight: state.padHighlight ? { ...state.padHighlight } : null,
      // v2.4.18: pad 端用 activeMap 的 BGM
      bgm: active.bgm ? { ...active.bgm } : null,
      npcs: active.npcs.map(x => stripNpc(x)),
      // v2.4.18: 标记 + 当前 NPC 对话(玩家点击后)
      mapMarker: state.mapMarker ? { ...state.mapMarker } : null,
      npcDialog: state.npcDialog ? { ...state.npcDialog } : null,
      activeMapId: state.activeMapId,
      activeMapName: active.name,
      turn: { ...state.turn },
      // v2.0:pad 上显示玩家棋子信息(只显示公开字段)
      publicCharacters,
      // v2.4.18: pad 端知道每玩家所在版图(只显示当前版图的玩家棋子)
      playerMap: { ...state.playerMap },
      // v2.4.19: pad 端不需要看聊天
      online: { ...state.online }
    };
  }
  // 玩家 (p1~p6) - 看到 playerMap[me]
  const me = role;
  const myMap = getPlayerMap(me);
  // v2.4.40: 只遍历激活玩家
  const activePids = getActivePlayerIds();
  // 玩家端也需要看 publicCharacters(用于看队友血量)
  const publicCharacters = {};
  for (const pid of activePids) {
    const ch = state.characters[pid];
    publicCharacters[pid] = { name: ch.name, avatar: ch.avatar, hp: { ...ch.hp } };
  }
  // 玩家端也看自己版图上所有玩家的棋子(可以显示队友)
  const pieces = {};
  for (const pid of activePids) pieces[pid] = { ...(myMap.pieces[pid] || { x: 0.5, y: 0.5, color: PLAYER_COLORS[pid].color, label: PLAYER_COLORS[pid].icon + PLAYER_COLORS[pid].label }) };
  return {
    scriptTitle: state.scriptTitle,
    eventLog: state.eventLog.map(x => ({ ...x })),
    myPiece: { ...myMap.pieces[me] },
    // v2.2: 玩家端也需要看到版图(可移动棋子 / 拾取线索 / 触发NPC)
    map: { url: myMap.url, updatedAt: 0 },
    mapItems: myMap.items.map(x => ({ ...x })),
    pieces,
    npcs: myMap.npcs.map(x => stripNpc(x)),
    // v2.4: 玩家也看到自己在哪个版图
    currentMapId: state.playerMap[me],
    currentMapName: myMap.name,
    publicCharacters,
    privateContent: state.players[me].privateContent.map(x => ({ ...x })),
    bgm: myMap.bgm ? { ...myMap.bgm } : null,
    character: { ...state.characters[me], attributes: state.characters[me].attributes.map(a => ({ ...a })) },
    backpack: state.backpack[me].map(x => ({ ...x })),
    note: state.notes[me],
    turn: { ...state.turn },
    // v2.4.19: 玩家端只看自己的聊天频道
    chat: { [me]: (state.chat[me] || []).map(m => ({ ...m })) },
    // v2.4.22: 玩家端也能看到 NPC 对话(在玩家自己屏幕上显示)
    npcDialog: state.npcDialog ? {
      id: state.npcDialog.id,
      npcId: state.npcDialog.npcId,
      npcName: state.npcDialog.npcName,
      npcAvatar: state.npcDialog.npcAvatar,
      dialogues: state.npcDialog.dialogues,
      index: state.npcDialog.index
    } : null,
    // v2.4.34: 玩家端只看到自己的"查看"副本
    viewedClues: (state.viewedClues[me] || []).map(x => ({ ...x })),
    role: me,
    // v2.4.34: 本局玩家数 + 激活玩家 ID 列表(过滤房间 UI)
    maxPlayers: state.maxPlayers || MAX_PLAYERS,
    activePlayerIds: getActivePlayerIds(),
    online: { ...state.online }
  };
}

function broadcastAll() {
  for (const [sid, sock] of io.sockets.sockets) {
    if (!sock.connected) continue;
    let role = null;
    for (const r of ROLES) if (sockets[r] === sid) { role = r; break; }
    if (role) sock.emit('state', buildStateForRole(role));
    sock.emit('status', { online: { ...state.online } });
  }
}

// ---------- 主持人事件 ----------
function hostSetMap(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const url = sanitizeText(payload?.url || '', 1000);
  if (!isHttpOrLocalUrl(url)) return sock.emit('error', { msg: '版图URL必须以http(s):// 或 /uploads/ 开头' });
  const m = getActiveMap();
  if (m) m.url = url;
  appendLog('🗺️ 主持人设置了版图');
  broadcastAll();
  sock.emit('toast', { msg: '已设置版图' });
}

function hostSetScriptTitle(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const title = sanitizeText(payload, 40) || '跑团模组';
  state.scriptTitle = title;
  appendLog('📜 模组名已更新');
  broadcastAll();
}

function buildMapItem(p) {
  // v2.4.29: 版图内容支持 6 种类型
  //   item  - 物品 (卡片形状, 点击 → 玩家背包)
  //   clue  - 线索 (正方形, 点击 → 玩家线索栏)
  //   npc   - NPC  (已转用 hostAddNpc, 不在这里处理)
  //   event - 事件 (问号, 点击 → 媒体+效果)
  //   image - 图片 (纯装饰, 不可拾)
  //   video - 视频 (纯装饰, 不可拾;v2.4.29 新增)
  let type = ['item', 'clue', 'event', 'image', 'video'].includes(p.type) ? p.type : 'image';
  let imageUrl = '', audioUrl = '', videoUrl = '';
  let body = sanitizeText(p.body || '', 2000);
  // v2.4.21: 玩家在"正文"框里贴了图片 URL,自动识别为 imageUrl(否则只能看到链接)
  if (type === 'image') {
    imageUrl = isHttpOrLocalUrl(p.imageUrl) ? p.imageUrl : (isHttpOrLocalUrl(p.body) ? p.body : '');
    if (imageUrl) body = '';
  } else if (type === 'video') {
    // v2.4.29: 视频类型 - 必填 videoUrl
    videoUrl = isHttpOrLocalUrl(p.videoUrl) ? p.videoUrl : (isHttpOrLocalUrl(p.body) ? p.body : '');
    if (videoUrl) body = '';
  } else if (type === 'event') {
    // 事件: 媒体 + 效果 + 可切换版图
    if (p.imageUrl && isHttpOrLocalUrl(p.imageUrl)) imageUrl = p.imageUrl;
    if (p.audioUrl && isHttpOrLocalUrl(p.audioUrl)) audioUrl = p.audioUrl;
    if (p.videoUrl && isHttpOrLocalUrl(p.videoUrl)) videoUrl = p.videoUrl;
  } else if (type === 'item') {
    if (p.imageUrl && isHttpOrLocalUrl(p.imageUrl)) imageUrl = p.imageUrl;
    if (p.audioUrl && isHttpOrLocalUrl(p.audioUrl)) audioUrl = p.audioUrl;
    if (p.videoUrl && isHttpOrLocalUrl(p.videoUrl)) videoUrl = p.videoUrl;
    // 兜底:body 是 URL 时,自动识别为 image
    if (!imageUrl && isHttpOrLocalUrl(p.body)) {
      imageUrl = p.body;
      body = '';
    }
  } else if (type === 'clue') {
    if (p.imageUrl && isHttpOrLocalUrl(p.imageUrl)) imageUrl = p.imageUrl;
    // 兜底:body 是 URL 时,自动识别为 image
    if (!imageUrl && isHttpOrLocalUrl(p.body)) {
      imageUrl = p.body;
      body = '';
    }
  }
  return {
    id: newId(),
    type,
    title: sanitizeText(p.title || '', 100),
    body,
    imageUrl,
    audioUrl,
    videoUrl,
    // 事件专属字段
    effects: p.effects || null,        // { hp: 0, mp: 0, san: 0 } 任意 key
    switchMapId: p.switchMapId || null,// 触发后切换到指定版图
    switchPlayer: p.switchPlayer || null, // 切换哪个玩家
    target: p.target || 'pad',         // 谁可以触发
    durationMs: parseInt(p.durationMs) || 0,  // 图/文显示时长(毫秒),0=不自动消失
    ts: Date.now()
  };
}

function buildContentItem(p) {
  // 兼容旧接口: 玩家私发内容(剧本/文字/图片/音频/视频)
  let type = ['text', 'image', 'audio', 'video', 'clue', 'script', 'item'].includes(p.type) ? p.type : 'text';
  let imageUrl = '', audioUrl = '', videoUrl = '';
  let body = sanitizeText(p.body || '', 2000);
  if (type === 'image') {
    imageUrl = isHttpOrLocalUrl(p.imageUrl) ? p.imageUrl : (isHttpOrLocalUrl(p.body) ? p.body : '');
    if (imageUrl) body = '';
  } else if (type === 'audio') {
    audioUrl = isHttpOrLocalUrl(p.audioUrl) ? p.audioUrl : (isHttpOrLocalUrl(p.body) ? p.body : '');
    if (audioUrl) body = '';
  } else if (type === 'video') {
    videoUrl = isHttpOrLocalUrl(p.videoUrl) ? p.videoUrl : (isHttpOrLocalUrl(p.body) ? p.body : '');
    if (videoUrl) body = '';
  } else if (type === 'clue') {
    imageUrl = isHttpOrLocalUrl(p.imageUrl) ? p.imageUrl : '';
    // v2.4.21: 兜底:body 是 URL 时自动识别
    if (!imageUrl && isHttpOrLocalUrl(p.body)) { imageUrl = p.body; body = ''; }
  } else if (type === 'script') {
    body = isHttpOrLocalUrl(p.body) ? p.body : (isHttpOrLocalUrl(p.scriptUrl) ? p.scriptUrl : '');
    if (!body) {
      type = 'text';
    } else {
      body = sanitizeText(body, 2000);
    }
  } else if (type === 'item') {
    if (p.body) body = sanitizeText(p.body, 2000);
    if (p.imageUrl && isHttpOrLocalUrl(p.imageUrl)) imageUrl = p.imageUrl;
    if (p.audioUrl && isHttpOrLocalUrl(p.audioUrl)) audioUrl = p.audioUrl;
    if (p.videoUrl && isHttpOrLocalUrl(p.videoUrl)) videoUrl = p.videoUrl;
    // v2.4.21: 兜底:body 是 URL 时自动识别为 image
    if (!imageUrl && isHttpOrLocalUrl(p.body)) { imageUrl = p.body; body = ''; }
  }
  return {
    id: newId(),
    type,
    title: sanitizeText(p.title || '', 100),
    body,
    imageUrl,
    audioUrl,
    videoUrl,
    ts: Date.now()
    // v2.4.27: switchMapId 在 hostAddMapItem 中处理(在 buildMapItem 之外,因为需要 getMapById)
  };
}

function hostAddMapItem(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const item = buildMapItem(p);
  item.x = clamp01(p.x, 0.5);
  item.y = clamp01(p.y, 0.5);
  item.scale = Math.max(0.2, Math.min(5, parseFloat(p.scale) || 1.0));
  // v2.3.1: 物品/线索/事件分配唯一颜色(避免版图上色块重复)
  // v2.4.21: 事件也需要分配唯一颜色
  if (item.type === 'item' || item.type === 'clue' || item.type === 'event') {
    item.color = pickUniqueColor();
  }
  // v2.4.27: 支持 switchMapId(玩家点击图片后自动切换版图,玩家棋子不跟)
  if (p.switchMapId && getMapById(p.switchMapId)) {
    item.switchMapId = p.switchMapId;
  }
  // 验证:不同类型有不同的必填项
  if (item.type === 'item') {
    if (!item.title || !item.title.trim()) {
      return sock.emit('error', { msg: '物品必须填写标题' });
    }
    item.target = 'pad';
  }
  if (item.type === 'clue') {
    if (!item.title || !item.title.trim()) item.title = '?';
    if (!item.target) item.target = 'pad';
  }
  if (item.type === 'event') {
    if (!item.title || !item.title.trim()) item.title = '?';
    if (!item.target) item.target = 'pad';
  }
  if (item.type === 'image') {
    if (!item.imageUrl) return sock.emit('error', { msg: '图片必须上传' });
  }
  if (item.type === 'video') {
    // v2.4.29: 视频必须填 URL
    if (!item.videoUrl) return sock.emit('error', { msg: '视频必须上传' });
  }
  const m = getActiveMap();
  if (!m) return sock.emit('error', { msg: '版图不存在' });
  m.items.push(item);
  appendLog(`📍 主持人在版图上添加了${typeZh(item.type)}`);
  broadcastAll();
  sock.emit('toast', { msg: '已添加到版图' });
}

function hostMoveMapItem(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const m = getActiveMap();
  if (!m) return;
  const item = m.items.find(it => it.id === payload?.id);
  if (!item) return;
  item.x = clamp01(payload.x, item.x);
  item.y = clamp01(payload.y, item.y);
  broadcastAll();
}

function hostScaleMapItem(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const m = getActiveMap();
  if (!m) return;
  const item = m.items.find(it => it.id === payload?.id);
  if (!item) return;
  item.scale = Math.max(0.2, Math.min(5, parseFloat(payload.scale) || 1.0));
  broadcastAll();
}

function hostDeleteMapItem(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const m = getActiveMap();
  if (!m) return;
  const idx = m.items.findIndex(it => it.id === payload?.id);
  if (idx < 0) return;
  m.items.splice(idx, 1);
  appendLog(`🗑️ 主持人删除了版图项`);
  broadcastAll();
}

// v2.4.27: 主持人更新版图项的属性(主要更新 switchMapId)
function hostUpdateMapItem(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const m = getActiveMap();
  if (!m) return;
  const item = m.items.find(it => it.id === payload?.id);
  if (!item) return;
  // 更新 switchMapId
  if ('switchMapId' in (payload || {})) {
    if (payload.switchMapId === null || payload.switchMapId === '') {
      item.switchMapId = null;
    } else if (getMapById(payload.switchMapId)) {
      item.switchMapId = payload.switchMapId;
    }
  }
  // 更新 scale / x / y
  if (Number.isFinite(parseFloat(payload.x))) item.x = clamp01(payload.x, item.x);
  if (Number.isFinite(parseFloat(payload.y))) item.y = clamp01(payload.y, item.y);
  if (Number.isFinite(parseFloat(payload.scale))) item.scale = Math.max(0.2, Math.min(5, parseFloat(payload.scale)));
  // 更新 title
  if (typeof payload.title === 'string') item.title = sanitizeText(payload.title, 100);
  appendLog(`✏️ 主持人更新了版图项: ${item.title || item.type}`);
  broadcastAll();
}

// v2.4.28: 玩家点击版图上的 item
// - 玩家点击 item 上的图片(配了 switchMapId)→
//   主持人/pad 端的 activeMap 切到目标版图(让全桌看到新场景)
//   玩家的 playerMap 不动,玩家棋子不跟
function playerClickMapItem(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const myMap = getPlayerMap(role);
  if (!myMap) return sock.emit('error', { msg: '所在版图不存在' });
  const item = myMap.items.find(it => it.id === payload?.itemId);
  if (!item) return sock.emit('error', { msg: '物品不存在' });
  // v2.4.28: 图片配了 switchMapId 时,玩家点击 → 切 activeMap(玩家棋子不跟)
  if (item.switchMapId) {
    const targetMap = getMapById(item.switchMapId);
    if (targetMap) {
      // 改的是 activeMap(主持人/pad 看到的版图),不是 playerMap
      // 这样玩家还在原地图,棋子位置不变
      state.activeMapId = targetMap.id;
      // 不修改 state.playerMap[role] — 玩家所在的版图不变
      // 不修改 targetMap.pieces[role] — 玩家棋子不跟过去
      appendLog(`🖼️ ${roleLabel(role)} 点击图片「${item.title || ''}」,版图已切到「${targetMap.name}」(${roleLabel(role)} 还在「${myMap.name}」)`);
      sock.emit('toast', { msg: `已切到「${targetMap.name}」(你还在「${myMap.name}」)` });
      broadcastAll();
    } else {
      sock.emit('error', { msg: '目标版图不存在' });
    }
  } else {
    sock.emit('toast', { msg: '这个物品没有配置跳转版图' });
  }
}

// v2.4.28: 图库 - 收集所有已上传/已使用的图片资源
// v2.4.29: 扩展为"媒体库",同时收集图片和视频
//   - mediaType: 'image' | 'video'
//   - 扫描 uploads/ 目录(本地上传)
//   - 从 state.maps[*].items / npcs 中提取外部 URL
//   - 版图本身的 url
function buildImageLibrary() {
  const library = [];
  const seen = new Set();
  const push = (item) => {
    if (!item.url || seen.has(item.url)) return;
    seen.add(item.url);
    library.push(item);
  };
  // 1. 扫描 uploads 目录(图片 + 视频)
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    for (const f of files) {
      const isImg = /\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(f);
      const isVid = /\.(mp4|webm|ogg|mov|m4v)$/i.test(f);
      if (!isImg && !isVid) continue;
      try {
        const stat = fs.statSync(path.join(UPLOADS_DIR, f));
        push({
          url: '/uploads/' + f,
          name: f,
          displayName: f.replace(/^[a-z0-9_]+_/, ''),  // 去掉前缀
          type: 'uploaded',
          mediaType: isImg ? 'image' : 'video',
          size: stat.size,
          ts: stat.mtime.getTime()
        });
      } catch (e) {}
    }
  } catch (e) { console.error('[imageLibrary] read uploads err:', e.message); }
  // 2. 从 state 收集已使用的图片/视频 URL
  for (const m of state.maps) {
    // items
    for (const it of (m.items || [])) {
      if (it.imageUrl) push({ url: it.imageUrl, name: it.title || it.type, displayName: it.title || it.type, type: 'item', mediaType: 'image', source: m.name });
      if (it.videoUrl) push({ url: it.videoUrl, name: it.title || it.type, displayName: it.title || it.type, type: 'item', mediaType: 'video', source: m.name });
    }
    // npcs
    for (const n of (m.npcs || [])) {
      if (n.avatar) push({ url: n.avatar, name: n.name, displayName: n.name, type: 'npc-avatar', mediaType: 'image', source: m.name });
    }
    // 版图本身(图片或视频)
    if (m.url) {
      const isVideoUrl = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(m.url);
      push({ url: m.url, name: m.name, displayName: m.name, type: 'map', mediaType: isVideoUrl ? 'video' : 'image', source: m.name });
    }
  }
  // 按时间倒序
  library.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  return library;
}

// v2.4.28: 主持人请求图库
// v2.4.29: 支持 mediaType 过滤 (all/image/video) + type (all/uploaded/item/npc-avatar/map)
function hostListImageLibrary(sock, query) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  let lib = buildImageLibrary();
  if (query && query.q) {
    const q = String(query.q).toLowerCase();
    lib = lib.filter(x =>
      (x.name && x.name.toLowerCase().includes(q)) ||
      (x.displayName && x.displayName.toLowerCase().includes(q)) ||
      (x.url && x.url.toLowerCase().includes(q))
    );
  }
  if (query && query.type && query.type !== 'all') {
    lib = lib.filter(x => x.type === query.type);
  }
  // v2.4.29: 按 mediaType 过滤 (图片 vs 视频)
  if (query && query.mediaType && query.mediaType !== 'all') {
    lib = lib.filter(x => x.mediaType === query.mediaType);
  }
  sock.emit('imageLibrary', { items: lib, total: lib.length });
}

function hostSendToPad(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const item = buildContentItem(p);
  if (!item.body && !item.imageUrl && !item.audioUrl && !item.videoUrl) {
    return sock.emit('error', { msg: '内容不能为空' });
  }
  // 推送到桌面信息流(不再放到版图上,版图由"在版图上放内容"专门管理)
  state.padFeed.unshift(item);
  if (state.padFeed.length > 30) state.padFeed.length = 30;
  appendLog(`📢 主持人向桌面推送了${typeZh(item.type)}`);
  // v2.1: 所有类型(文字/图片/视频/音频)都先在桌面顶部高亮 2.5 秒,客户端会播提示音
  setPadHighlight({
    type: item.type,
    title: item.title || '',
    body: item.body || '',
    imageUrl: item.imageUrl || '',
    audioUrl: item.audioUrl || '',
    videoUrl: item.videoUrl || '',
    from: 'host',
    ts: item.ts
  }, 2500);
  sock.emit('toast', { msg: '已发送到桌面' });
}

// v2.4.23: Pad 端媒体播完后推一条到信息流(让玩家过后还能看到)
function padPushFeed(sock, payload) {
  if (getSocketRole(sock) !== 'pad') return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  if (p.type !== 'video' && p.type !== 'audio' && p.type !== 'image') {
    return sock.emit('error', { msg: '只能推视频/音频/图片' });
  }
  if (!p.videoUrl && !p.audioUrl && !p.imageUrl) {
    return sock.emit('error', { msg: '媒体内容不能为空' });
  }
  const item = buildContentItem({
    type: p.type,
    title: p.title || '媒体',
    body: p.body || '',
    imageUrl: p.imageUrl || '',
    audioUrl: p.audioUrl || '',
    videoUrl: p.videoUrl || ''
  });
  state.padFeed.unshift(item);
  if (state.padFeed.length > 30) state.padFeed.length = 30;
  appendLog(`📥 Pad 媒体播完,已加入桌面信息流:${item.title || typeZh(item.type)}`);
  broadcastAll();
}

function hostSendToPlayer(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  if (p.type === 'video') return sock.emit('error', { msg: '视频请发送到大屏,不能发送给玩家' });
  let targets = Array.isArray(p.targets) ? p.targets : [];
  // v2.4.32: 支持 p1~p6
  targets = targets.filter(t => isPlayerId(t));
  if (targets.length === 0) return sock.emit('error', { msg: '请选择至少一个玩家' });
  const item = buildContentItem(p);
  if (item.type === 'clue') item.type = 'text';
  if (item.type === 'script' && !isHttpOrLocalUrl(item.body)) {
    return sock.emit('error', { msg: '剧本类型必须提供 URL' });
  }
  if (!item.body && !item.imageUrl && !item.audioUrl) {
    return sock.emit('error', { msg: '内容不能为空' });
  }
  for (const t of targets) {
    state.players[t].privateContent.unshift({ ...item });
    if (state.players[t].privateContent.length > 50) state.players[t].privateContent.length = 50;
  }
  const label = targets.length === 2 ? '玩家1+玩家2' : roleLabel(targets[0]);
  appendLog(`📨 主持人向${label}发送了${typeZh(item.type)}`);
  broadcastAll();
  sock.emit('toast', { msg: '已发送' });
}

function hostSendClue(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  // v2.2: 支持多选 targets 数组 + 兼容老单值 target
  let targets;
  if (Array.isArray(p.targets)) {
    // v2.4.32: 通用化 - 支持 p1~p6
    targets = p.targets.filter(t => isPlayerId(t) || t === 'pad');
  } else if (typeof p.target === 'string') {
    targets = [p.target];
  } else {
    targets = ['pad'];
  }
  if (targets.length === 0) return sock.emit('error', { msg: '目标无效' });
  const title = sanitizeText(p.title || '', 100) || '线索';
  const body = sanitizeText(p.body || '', 2000);
  const imageUrl = isHttpOrLocalUrl(p.imageUrl) ? p.imageUrl : '';
  if (!body && !imageUrl) {
    return sock.emit('error', { msg: '线索内容不能为空' });
  }
  const labels = [];
  for (const target of targets) {
    if (!(target === 'pad' || isPlayerId(target))) continue;
    const clue = {
      id: newId(),
      type: 'clue',
      title,
      body,
      imageUrl,
      ts: Date.now()
    };
    if (target === 'pad') {
      state.padFeed.unshift(clue);
      if (state.padFeed.length > 30) state.padFeed.length = 30;
      setPadHighlight({
        type: 'clue',
        title: clue.title,
        body: clue.body,
        imageUrl: clue.imageUrl,
        from: 'host',
        ts: clue.ts
      });
      labels.push('桌面');
    } else {
      state.players[target].privateContent.unshift({ ...clue });
      if (state.players[target].privateContent.length > 50) state.players[target].privateContent.length = 50;
      labels.push(roleLabel(target));
    }
  }
  appendLog(`🔍 主持人向 ${labels.join('+')} 发送了线索「${title}」`);
  broadcastAll();
  sock.emit('toast', { msg: `已发送线索给 ${labels.join('+')}` });
}

function hostSetBgm(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const url = sanitizeText(p.url || '', 1000);
  if (!isHttpOrLocalUrl(url)) return sock.emit('error', { msg: 'BGM URL 必须以 http(s):// 或 /uploads/ 开头' });
  const title = sanitizeText(p.title || '背景音乐', 50) || '背景音乐';
  const volume = clamp01(p.volume, 0.5);
  state.bgm = { url, title, volume, paused: false, ts: Date.now() };
  appendLog(`🎵 主持人设置了背景音乐: ${title}`);
  broadcastAll();
  sock.emit('toast', { msg: '已设置背景音乐' });
}

function hostStopBgm(sock) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  if (!state.bgm) return;
  state.bgm = null;
  appendLog('🎵 主持人停止了背景音乐');
  broadcastAll();
  sock.emit('toast', { msg: '已停止背景音乐' });
}

// v2.2: 暂停 / 继续 BGM
function hostPauseBgm(sock) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  if (!state.bgm) return;
  state.bgm.paused = true;
  appendLog('🎵 主持人暂停了背景音乐');
  broadcastAll();
  sock.emit('toast', { msg: '已暂停' });
}

function hostResumeBgm(sock) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  if (!state.bgm) return;
  state.bgm.paused = false;
  state.bgm.ts = Date.now();  // 换 ts 触发客户端重新加载
  appendLog('🎵 主持人继续了背景音乐');
  broadcastAll();
  sock.emit('toast', { msg: '已继续' });
}

// v2.2: 调节 BGM 音量
function hostSetBgmVolume(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  if (!state.bgm) return;
  state.bgm.volume = clamp01(payload?.volume, state.bgm.volume || 0.5);
  broadcastAll();
}

function hostPinFeed(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const idx = state.padFeed.findIndex(f => f.id === payload?.feedId);
  if (idx < 0) return sock.emit('error', { msg: '投喂项不存在' });
  const item = state.padFeed[idx];
  // v2.4: 移到 activeMap.items
  const m = getActiveMap();
  if (!m) return sock.emit('error', { msg: '版图不存在' });
  // v2.4: 投喂内容钉到版图上时强制为 item 类型(可拾取)
  const newItem = {
    id: newId(),
    type: 'item',
    title: item.title || '物品',
    body: item.body || '',
    imageUrl: item.imageUrl || '',
    audioUrl: item.audioUrl || '',
    videoUrl: item.videoUrl || '',
    x: clamp01(payload.x, 0.5),
    y: clamp01(payload.y, 0.5),
    scale: 1.0,
    target: 'pad',
    color: pickUniqueColor(),  // v2.3.1: 唯一颜色
    ts: Date.now()
  };
  m.items.push(newItem);
  state.padFeed.splice(idx, 1);
  appendLog(`📌 主持人将投喂内容钉到版图`);
  broadcastAll();
  sock.emit('toast', { msg: '已钉到版图' });
}

function hostClearAll(sock) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  // v2.4.40: 保留用户已设置的玩家数,避免每次重置都回到 6
  const keepMax = state.maxPlayers || 1;
  state = initialState(keepMax);
  appendLog(`♻️ 主持人重置了本局(玩家数: ${keepMax})`);
  broadcastAll();
  sock.emit('toast', { msg: '已重置' });
}

function hostShutdown(sock) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  appendLog('🛑 主持人请求关闭服务器');
  broadcastAll();
  // 短暂延迟让客户端收到广播后再断开
  setTimeout(() => {
    console.log('[server] 收到主持人关闭请求,正在关闭...');
    process.exit(0);
  }, 600);
}

function hostRestart(sock) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  appendLog('🔄 主持人请求重启服务器');
  broadcastAll();
  setTimeout(() => {
    console.log('[server] 收到主持人重启请求,正在重启...');
    const { spawn } = require('child_process');
    const isWin = process.platform === 'win32';
    // 在 Windows 上用 cmd.exe 显式 /d /c start 来真正脱离父进程
    // 关键:加 start /B 之后,新进程会脱离 cmd 关系独立运行
    let child;
    if (isWin) {
      // 用 cmd.exe start 真正脱离,新进程会独立
      child = spawn('cmd.exe', ['/d', '/c', 'start', '""', '/B', process.execPath, __filename], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        env: process.env,
        cwd: process.cwd()
      });
    } else {
      child = spawn(process.execPath, [__filename], {
        detached: true,
        stdio: 'ignore',
        env: process.env,
        cwd: process.cwd()
      });
    }
    child.unref();
    console.log(`[server] 新进程已派生 (PID ${child.pid}),${isWin ? '将独立运行' : '已脱离'}`);
    setTimeout(() => process.exit(0), 500);
  }, 600);
}

function hostLog(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const msg = sanitizeText(payload, 200);
  if (!msg) return;
  appendLog('📝 ' + msg);
  broadcastAll();
}

function typeZh(t) {
  return ({ text: '文字', image: '图片', audio: '音频', video: '视频', clue: '线索', dice: '骰子', script: '剧本', item: '物品' })[t] || t;
}

// 临时高亮(大屏 2 秒),文字/骰子用
// v2.4: 支持 durationMs (0 = 不自动关闭,等客户端 sendHostCmd/pad:closeHighlight)
// v2.4: media-driven auto-close: 当高亮含 videoUrl/audioUrl 时,客户端会在 onended 时关
function setPadHighlight(highlightData, durationMs = 2000) {
  const id = newId();
  // durationMs > 0: 定时自动关闭
  // durationMs === 0: 客户端 driven (视频/音频 ended 事件触发关闭)
  // 关键修复:即使是客户端驱动,也要给 expiresAt 一个未来时间,否则客户端会立即隐藏
  const SAFETY_MS = 10 * 60 * 1000;  // 10 分钟兜底
  const expiresAt = durationMs > 0 ? Date.now() + durationMs : Date.now() + SAFETY_MS;
  state.padHighlight = { ...highlightData, id, expiresAt };
  if (durationMs > 0) {
    setTimeout(() => {
      if (state.padHighlight && state.padHighlight.id === id) {
        state.padHighlight = null;
        broadcastAll();
      }
    }, durationMs + 100);
  } else {
    // 客户端驱动也加个兜底:超过 SAFETY_MS 强制关闭,防止视频卡住时永远不消失
    setTimeout(() => {
      if (state.padHighlight && state.padHighlight.id === id) {
        state.padHighlight = null;
        broadcastAll();
      }
    }, SAFETY_MS + 100);
  }
  broadcastAll();
}
// v2.1: 文字 / 图片标题 / 视频标题 / 音频标题 全部用统一时长(2.5 秒)
function setPadHighlightText(highlightData) {
  setPadHighlight({ ...highlightData, type: highlightData.type || 'text' }, 2500);
}

// ---------- Pad 事件 ----------
function padMovePiece(sock, payload) {
  // v2.4: 玩家在 playerMap[role] 版图上移动自己的棋子
  //   - pad 端:可以移动当前回合玩家的棋子
  //   - 玩家端(p1/p2):必须移动自己的棋子,仅在自己的回合才允许
  const role = getSocketRole(sock);
  const p = payload || {};
  const pid = p.playerId;
  if (!isPlayerId(pid)) return;
  if (state.turn.current !== pid) {
    return sock.emit('error', { msg: `现在是 ${roleLabel(state.turn.current)} 的回合,不能移动` });
  }
  if (isPlayerId(role)) {
    // 玩家只能移动自己的棋子
    if (role !== pid) {
      return sock.emit('error', { msg: '只能移动自己的棋子' });
    }
  } else if (role !== 'pad') {
    return sock.emit('error', { msg: '无权操作' });
  }
  // v2.4: 操作 playerMap[pid] 的 pieces(玩家所在版图的位置)
  const playerMap = getPlayerMap(pid);
  if (!playerMap || !playerMap.pieces || !playerMap.pieces[pid]) {
    return sock.emit('error', { msg: '玩家当前版图不存在' });
  }
  playerMap.pieces[pid].x = clamp01(p.x, playerMap.pieces[pid].x);
  playerMap.pieces[pid].y = clamp01(p.y, playerMap.pieces[pid].y);
  broadcastAll();
}

function padCloseFeed(sock, payload) {
  if (getSocketRole(sock) !== 'pad') return sock.emit('error', { msg: '无权操作' });
  const idx = state.padFeed.findIndex(f => f.id === payload?.feedId);
  if (idx < 0) return;
  state.padFeed.splice(idx, 1);
  broadcastAll();
}

function padCloseHighlight(sock) {
  // v2.4: 任何角色都能关闭高亮(pad 端、玩家端、主持人端点屏幕都关)
  state.padHighlight = null;
  broadcastAll();
}

// v2.4.20: 媒体播完后从版图移除事件
function padEventEnded(sock, payload) {
  if (getSocketRole(sock) !== 'pad') return sock.emit('error', { msg: '无权操作' });
  const eventId = payload?.eventId;
  if (!eventId) return;
  let removed = false;
  for (const m of state.maps) {
    const idx = m.items.findIndex(it => it.id === eventId);
    if (idx >= 0) {
      m.items.splice(idx, 1);
      removed = true;
      appendLog(`🧹 Pad 端媒体播完,事件已从「${m.name}」移除`);
      break;
    }
  }
  if (removed) broadcastAll();
}

// ---------- 玩家事件 ----------
function playerPushToPad(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const item = state.players[role].privateContent.find(it => it.id === payload?.itemId);
  if (!item) return sock.emit('error', { msg: '未找到该内容' });
  if (item.type !== 'image' && item.type !== 'audio' && item.type !== 'video') {
    return sock.emit('error', { msg: '只能投喂图片/音频/视频' });
  }
  const feedItem = { ...item, id: newId(), from: role, ts: Date.now() };
  state.padFeed.unshift(feedItem);
  if (state.padFeed.length > 30) state.padFeed.length = 30;
  appendLog(`📤 ${roleLabel(role)} 投喂了${typeZh(item.type)}到桌面`);
  broadcastAll();
  sock.emit('toast', { msg: '已投到桌面' });
}

function playerRollDice(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  // 解析骰子表达式: e.g. { notation: "2D6+1D20+3" } 或 { rolls: [{sides:6,count:2},{sides:20,count:1}], modifier: 3 }
  let rolls = [];
  let modifier = 0;
  if (Array.isArray(p.rolls) && p.rolls.length > 0) {
    rolls = p.rolls.filter(r => r && Number.isFinite(r.sides) && r.sides >= 2 && r.sides <= 1000);
  } else if (typeof p.notation === 'string') {
    const parsed = parseDiceNotation(p.notation);
    rolls = parsed.rolls;
    modifier = parsed.modifier;
  }
  if (rolls.length === 0) return sock.emit('error', { msg: '骰子表达式无效' });
  // 投掷
  const detail = [];
  let total = modifier;
  for (const r of rolls) {
    const count = Math.max(1, Math.min(20, r.count || 1));
    const sides = Math.max(2, Math.min(1000, r.sides));
    const results = [];
    for (let i = 0; i < count; i++) {
      const v = Math.floor(Math.random() * sides) + 1;
      results.push(v);
      total += v;
    }
    detail.push({ sides, results, sum: results.reduce((a, b) => a + b, 0) });
  }
  const diceItem = {
    id: newId(),
    type: 'dice',
    from: role,
    title: `${roleLabel(role)} 投掷`,
    body: '',
    detail,
    modifier,
    total,
    ts: Date.now()
  };
  state.padFeed.unshift(diceItem);
  if (state.padFeed.length > 30) state.padFeed.length = 30;
  const notation = formatDiceNotation(detail, modifier);
  appendLog(`🎲 ${roleLabel(role)} 投掷 ${notation} = ${total}`);
  // 骰子:大屏 2 秒高亮(玩家名+骰子表达式+结果)
  setPadHighlight({
    type: 'dice',
    from: role,
    title: `${roleLabel(role)} 投掷`,
    notation,
    detail,
    modifier,
    total,
    ts: diceItem.ts
  });
  sock.emit('toast', { msg: `🎲 ${notation} = ${total}` });
}

function parseDiceNotation(s) {
  // 解析 "2D6+1D20+3" 之类 (MVP: 不支持负数骰子,负数会用 modifier 处理)
  const rolls = [];
  let modifier = 0;
  s = s.toUpperCase().replace(/\s/g, '');
  // 找 + 和 - 分段
  const re = /([+-]?)(\d*)D(\d+)/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    const sign = m[1] === '-' ? -1 : 1;
    const count = parseInt(m[2] || '1', 10);
    const sides = parseInt(m[3], 10);
    // 只接受正数骰子;负数会被忽略(MVP 简化)
    if (sign > 0 && sides >= 2 && sides <= 1000 && count >= 1 && count <= 20) {
      rolls.push({ count, sides });
    }
  }
  // 处理纯数字 modifier (剩余字符串)
  const remain = s.replace(/[+-]?\d*D\d+/g, '').replace(/^[+-]/, '').trim();
  if (remain) {
    const n = parseInt(remain, 10);
    if (Number.isFinite(n)) modifier = n;
  }
  return { rolls, modifier };
}

function formatDiceNotation(detail, modifier) {
  const parts = detail.map(d => {
    if (d.results.length === 1) return `D${d.sides}=${d.results[0]}`;
    return `${d.results.length}D${d.sides}=${d.sum}(${d.results.join(',')})`;
  });
  let s = parts.join('+');
  if (modifier > 0) s += `+${modifier}`;
  else if (modifier < 0) s += `${modifier}`;
  return s;
}

// ---------- 加入/离开 ----------
// v2.4.32: 支持 auto 自动分配空闲玩家位置
//   payload.role: 'host' | 'pad' | 'p1' ~ 'p6' | 'auto' (自动分配下一个空闲位置)
function onJoin(sock, payload) {
  let role = payload?.role;
  // v2.4.34: 取得本局激活玩家列表(主持人设过人数后,只允许这些玩家加入)
  const activeIds = getActivePlayerIds();
  if (role === 'auto' || role === undefined) {
    for (const pid of activeIds) {
      if (!sockets[pid]) { role = pid; break; }
    }
    if (role === 'auto' || !role) {
      return sock.emit('error', { msg: '房间已满(本局 ' + activeIds.length + ' 人)' });
    }
  } else if (isPlayerId(role) && activeIds.indexOf(role) === -1) {
    return sock.emit('error', { msg: '本局游戏限制 ' + activeIds.length + ' 人,该位置不开放' });
  }
  if (!ROLES.includes(role)) return sock.emit('error', { msg: '无效角色' });
  if (sockets[role] && sockets[role] !== sock.id) {
    const oldSock = io.sockets.sockets.get(sockets[role]);
    if (oldSock) oldSock.emit('toast', { msg: '该角色被新连接顶替' });
  }
  // v2.4.37: 如果是重连(在 grace 期内),取消计时器并显示"恢复"日志
  const wasReconnect = !!disconnectTimers[role];
  if (wasReconnect) {
    clearTimeout(disconnectTimers[role]);
    delete disconnectTimers[role];
  }
  sockets[role] = sock.id;
  state.online[role] = true;
  appendLog(wasReconnect ? `🔄 ${roleLabel(role)} 重新连接` : `🚪 ${roleLabel(role)} 加入`);
  // v2.4.32: 把分配的角色告诉客户端
  sock.emit('joined', { role, reconnected: wasReconnect });
  broadcastAll();
}

// v2.4.37: 玩家离开时给一个 grace 期(30s),期间内重连可恢复身份
//   - 解决手机/Pad 锁屏后短暂掉线被踢的问题
const RECONNECT_GRACE_MS = 30000;
const disconnectTimers = {};

function onDisconnect(sock) {
  for (const r of ROLES) {
    if (sockets[r] === sock.id) {
      // 不立即清空,给一个宽限期
      disconnectTimers[r] = setTimeout(() => {
        // 30s 后还连不上,真的下线
        if (sockets[r] === sock.id || sockets[r] === null) {
          sockets[r] = null;
          state.online[r] = false;
          appendLog(`🚪 ${roleLabel(r)} 离开(超时)`);
          broadcastAll();
        }
        delete disconnectTimers[r];
      }, RECONNECT_GRACE_MS);
      // 暂时标记为"等待重连"状态
      appendLog(`⏳ ${roleLabel(r)} 短暂离线,等待重连…`);
      broadcastAll();
      break;
    }
  }
}

// =====================================================================
// v2.0 新增功能
// =====================================================================

// ---------- 回合机制 ----------
function getCurrentTurn() {
  if (!state.turn.order || state.turn.order.length === 0) return null;
  if (!state.turn.order.includes(state.turn.current)) state.turn.current = state.turn.order[0];
  return state.turn.current;
}
function hostNextTurn(sock) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  if (state.turn.order.length === 0) return;
  const curIdx = state.turn.order.indexOf(state.turn.current);
  const nextIdx = (curIdx + 1) % state.turn.order.length;
  // 循环到起点 → 轮数 +1
  if (nextIdx <= curIdx && state.turn.order.length > 1) {
    state.turn.round += 1;
    appendLog(`🔄 第 ${state.turn.round} 轮开始`);
  }
  state.turn.current = state.turn.order[nextIdx];
  // v2.4.19: 自动切换 activeMap 到当前玩家所在版图(若跟随)
  autoSwitchToCurrentPlayerMap();
  appendLog(`➡️ 轮到 ${roleLabel(state.turn.current)}`);
  broadcastAll();
}
function hostPrevTurn(sock) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  if (state.turn.order.length === 0) return;
  const curIdx = state.turn.order.indexOf(state.turn.current);
  const prevIdx = (curIdx - 1 + state.turn.order.length) % state.turn.order.length;
  if (prevIdx >= curIdx && curIdx === 0 && state.turn.round > 1) {
    state.turn.round -= 1;
  }
  state.turn.current = state.turn.order[prevIdx];
  // v2.4.19: 自动切换 activeMap 到当前玩家所在版图
  autoSwitchToCurrentPlayerMap();
  appendLog(`⬅️ 回退到 ${roleLabel(state.turn.current)}`);
  broadcastAll();
}
function hostResetTurn(sock) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  state.turn = { order: getActivePlayerIds(), current: getActivePlayerIds()[0], round: 1 };
  autoSwitchToCurrentPlayerMap();
  appendLog('🔄 主持人重置了回合');
  broadcastAll();
}

// v2.4.34: 主持人设置本局游戏玩家人数(1~MAX_PLAYERS)
// v2.4.40: 重写 - 调 syncPlayerSlots 同步增/删所有玩家相关数据(棋子/角色卡/背包/版图)
function hostSetMaxPlayers(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const n = parseInt(payload?.maxPlayers, 10);
  if (!n || n < 1 || n > MAX_PLAYERS) {
    return sock.emit('error', { msg: '本局玩家数必须在 1~' + MAX_PLAYERS + ' 之间' });
  }
  const before = state.maxPlayers || MAX_PLAYERS;
  state.maxPlayers = n;
  // 同步增/删所有玩家相关数据 + 踢出被删玩家
  syncPlayerSlots(n);
  appendLog(`🎮 主持人设置本局玩家数: ${before} → ${n}`);
  broadcastAll();
}
function padNextTurn(sock) {
  if (getSocketRole(sock) !== 'pad') return sock.emit('error', { msg: '无权操作' });
  if (state.turn.order.length === 0) return;
  const curIdx = state.turn.order.indexOf(state.turn.current);
  const nextIdx = (curIdx + 1) % state.turn.order.length;
  if (nextIdx <= curIdx && state.turn.order.length > 1) state.turn.round += 1;
  state.turn.current = state.turn.order[nextIdx];
  // v2.4.19: 自动切换 activeMap 到当前玩家所在版图
  autoSwitchToCurrentPlayerMap();
  appendLog(`➡️ (Pad) 轮到 ${roleLabel(state.turn.current)}`);
  broadcastAll();
}
// v2.4.19: 切换回合时,自动把 activeMap 切到当前玩家所在版图
function autoSwitchToCurrentPlayerMap() {
  const cur = state.turn.current;
  if (!cur) return;
  const playerMap = state.playerMap && state.playerMap[cur];
  if (!playerMap) return;
  if (state.activeMapId !== playerMap) {
    state.activeMapId = playerMap;
    appendLog(`🗺️ 大屏切到 ${roleLabel(cur)} 所在版图`);
  }
}

// ---------- NPC 系统 ----------
// v2.4: NPC 现在按版图隔离,所有 NPC handlers 操作 activeMap.npcs
function hostAddNpc(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const name = sanitizeText(p.name || '', 30) || 'NPC';
  const m = getActiveMap();
  if (!m) return sock.emit('error', { msg: '版图不存在' });
  // v2.4.24: 支持 switchMapId(玩家点击 NPC 后自动跳转到该版图)
  // 目标版图必须存在,否则忽略
  let switchMapId = null;
  if (p.switchMapId && getMapById(p.switchMapId)) {
    switchMapId = p.switchMapId;
  }
  const npc = {
    id: newId(),
    name,
    avatar: isHttpOrLocalUrl(p.avatar) ? p.avatar : '',
    x: clamp01(p.x, 0.5),
    y: clamp01(p.y, 0.5),
    scale: Math.max(0.3, Math.min(3, parseFloat(p.scale) || 1.0)),
    color: pickUniqueColor(),  // v2.3.1: 分配唯一颜色
    switchMapId,  // v2.4.24: 玩家点击后跳转的版图
    dialogues: [],  // { id, title, type: 'text'|'image', content, target: 'all'|'current' }
    // v2.4.45: AI 对话配置
    aiEnabled: false,
    aiPersonality: '',   // 性格特点
    aiMemory: '',        // 记忆/背景故事
    aiGreeting: '',      // 开场白
    aiChatLog: {},       // { playerId: [{ role, content, ts }] } 每个玩家的对话历史
    // v2.4.46: 扩展 AI 配置
    aiGender: 'neutral',     // male / female / neutral - 影响 TTS 音色
    aiAge: 'adult',          // young / adult / old - 影响 TTS 音色
    aiGoal: '',              // NPC 目的(例:阻止玩家进入学校除非证明是老师)
    aiPadSync: true,         // 是否在 Pad 端同步显示对话
    aiSharedChat: false,     // 是否共享对话(所有玩家加入同一对话而非各自独立)
    // v2.4.47: NPC 商品列表(玩家可向 NPC 购买)
    shop: []                 // [{ id, title, body, imageUrl, price, stock }]  stock=-1 表示无限
  };
  m.npcs.push(npc);
  appendLog(`👤 主持人在版图上创建了 NPC: ${name}`);
  broadcastAll();
  sock.emit('toast', { msg: `已创建 NPC: ${name}` });
}
function hostUpdateNpc(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const m = getActiveMap();
  if (!m) return;
  const npc = m.npcs.find(n => n.id === payload?.id);
  if (!npc) return;
  if (typeof payload.name === 'string') npc.name = sanitizeText(payload.name, 30) || npc.name;
  if (typeof payload.avatar === 'string') npc.avatar = isHttpOrLocalUrl(payload.avatar) ? payload.avatar : '';
  if (Number.isFinite(parseFloat(payload.scale))) npc.scale = Math.max(0.3, Math.min(3, parseFloat(payload.scale)));
  // v2.4.24: 支持更新 switchMapId(空字符串或 null 表示清除)
  if ('switchMapId' in payload) {
    if (payload.switchMapId === null || payload.switchMapId === '') {
      npc.switchMapId = null;
    } else if (getMapById(payload.switchMapId)) {
      npc.switchMapId = payload.switchMapId;
    }
  }
  // v2.4.25: 支持更新 switchMapTarget
  if ('switchMapTarget' in payload) {
    // v2.4.32: 通用化 - 支持 p1~p6
    const allowed = ['none', ...PLAYER_IDS, 'all'];
    npc.switchMapTarget = allowed.includes(payload.switchMapTarget) ? payload.switchMapTarget : 'none';
  }
  // v2.4.45: 支持 AI 对话配置
  if ('aiEnabled' in payload) npc.aiEnabled = !!payload.aiEnabled;
  if (typeof payload.aiPersonality === 'string') npc.aiPersonality = sanitizeText(payload.aiPersonality, 1000);
  if (typeof payload.aiMemory === 'string') npc.aiMemory = sanitizeText(payload.aiMemory, 2000);
  if (typeof payload.aiGreeting === 'string') npc.aiGreeting = sanitizeText(payload.aiGreeting, 500);
  // v2.4.46: 扩展 AI 配置
  if (typeof payload.aiGender === 'string') {
    npc.aiGender = ['male', 'female', 'neutral'].includes(payload.aiGender) ? payload.aiGender : 'neutral';
  }
  if (typeof payload.aiAge === 'string') {
    npc.aiAge = ['young', 'adult', 'old'].includes(payload.aiAge) ? payload.aiAge : 'adult';
  }
  if (typeof payload.aiGoal === 'string') npc.aiGoal = sanitizeText(payload.aiGoal, 500);
  if ('aiPadSync' in payload) npc.aiPadSync = !!payload.aiPadSync;
  if ('aiSharedChat' in payload) npc.aiSharedChat = !!payload.aiSharedChat;
  broadcastAll();
}
function hostMoveNpc(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const m = getActiveMap();
  if (!m) return;
  const npc = m.npcs.find(n => n.id === payload?.id);
  if (!npc) return;
  npc.x = clamp01(payload.x, npc.x);
  npc.y = clamp01(payload.y, npc.y);
  broadcastAll();
}
function hostDeleteNpc(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const m = getActiveMap();
  if (!m) return;
  const idx = m.npcs.findIndex(n => n.id === payload?.id);
  if (idx < 0) return;
  const n = m.npcs[idx];
  m.npcs.splice(idx, 1);
  appendLog(`🗑️ 主持人删除了 NPC: ${n.name}`);
  broadcastAll();
}
function hostAddNpcDialogue(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const m = getActiveMap();
  if (!m) return;
  const npc = m.npcs.find(n => n.id === payload?.npcId);
  if (!npc) return;
  const d = {
    id: newId(),
    title: sanitizeText(payload.title || '', 60) || '对话',
    type: payload.type === 'image' ? 'image' : 'text',
    content: payload.type === 'image' ? (isHttpOrLocalUrl(payload.content) ? payload.content : '') : sanitizeText(payload.content || '', 2000),
    target: payload.target === 'all' ? 'all' : 'current'  // 'all'=所有玩家 / 'current'=当前回合玩家
  };
  if (!d.content) return sock.emit('error', { msg: '对话内容不能为空' });
  npc.dialogues.push(d);
  broadcastAll();
  sock.emit('toast', { msg: '已添加对话' });
}
function hostDeleteNpcDialogue(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const m = getActiveMap();
  if (!m) return;
  const npc = m.npcs.find(n => n.id === payload?.npcId);
  if (!npc) return;
  const idx = npc.dialogues.findIndex(d => d.id === payload.dialogueId);
  if (idx < 0) return;
  npc.dialogues.splice(idx, 1);
  broadcastAll();
}

// v2.4.45: 玩家与 NPC AI 对话
// v2.4.46: 支持共享对话模式 + 主持人干预 + Pad 同步开关
async function playerChatNpc(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const npcId = p.npcId;
  const message = sanitizeText(p.message || '', 500);
  if (!message) return sock.emit('error', { msg: '消息不能为空' });

  // 在所有版图中查找 NPC(玩家可能在任意版图)
  let npc = null;
  for (const m of state.maps) {
    const found = m.npcs.find(n => n.id === npcId);
    if (found) { npc = found; break; }
  }
  if (!npc) return sock.emit('error', { msg: 'NPC 不存在' });
  // v2.4.49: 记录最后聊天的玩家(用于主持人 NPC 控制面板默认选择)
  npc.lastChatter = role;
  // v2.4.48: 未启用 AI 对话时,玩家消息转发给主持人手动回复(不再报错)
  if (!npc.aiEnabled) {
    // 存入对话历史(手动模式)
    const chatKey = npc.aiSharedChat ? '_shared' : role;
    if (!npc.aiChatLog[chatKey]) npc.aiChatLog[chatKey] = [];
    if (npc.aiChatLog[chatKey].length === 0 && npc.aiGreeting) {
      npc.aiChatLog[chatKey].push({ role: 'assistant', content: npc.aiGreeting, ts: Date.now() });
    }
    const userLabel = npc.aiSharedChat ? `${roleLabel(role)}说: ` : '';
    npc.aiChatLog[chatKey].push({ role: 'user', content: userLabel + message, ts: Date.now(), from: role });
    // 广播给 pad 端和 host:玩家消息
    const chatMsg = {
      npcId, npcName: npc.name, npcAvatar: npc.avatar,
      playerId: role, message, type: 'user', ts: Date.now(),
      shared: !!npc.aiSharedChat, manual: true
    };
    broadcastNpcAiChat(npc, chatMsg);
    // 通知玩家:等待主持人回复
    sock.emit('npcChatThinking', { npcId, npcName: npc.name, manual: true });
    return;
  }
  if (!AGNES_AVAILABLE) return sock.emit('error', { msg: 'AI 服务未配置' });

  // v2.4.46: 共享对话模式 - 所有玩家共用一个 chatLog
  const chatKey = npc.aiSharedChat ? '_shared' : role;
  if (!npc.aiChatLog[chatKey]) npc.aiChatLog[chatKey] = [];

  // 如果是第一次对话且有开场白,先加入 assistant 消息
  if (npc.aiChatLog[chatKey].length === 0 && npc.aiGreeting) {
    npc.aiChatLog[chatKey].push({ role: 'assistant', content: npc.aiGreeting, ts: Date.now() });
  }

  // 加入玩家消息(标注是哪个玩家说的,便于共享模式下区分)
  const userLabel = npc.aiSharedChat ? `${roleLabel(role)}说: ` : '';
  npc.aiChatLog[chatKey].push({ role: 'user', content: userLabel + message, ts: Date.now(), from: role });

  // 构建 system prompt
  const sysParts = [`你是一个角色扮演游戏中的 NPC,名叫「${npc.name}」。请始终保持角色,用第一人称说话。`];
  if (npc.aiPersonality) sysParts.push(`你的性格特点:${npc.aiPersonality}`);
  if (npc.aiMemory) sysParts.push(`你的记忆/背景:${npc.aiMemory}`);
  if (npc.aiGoal) sysParts.push(`你的目的:${npc.aiGoal}`);
  sysParts.push('回复要简洁自然,像真实对话一样,不超过 150 字。不要说"作为AI"之类的话。');
  const systemPrompt = sysParts.join('\n');

  // 构建消息数组(取最近 20 条防止 token 过多)
  const recentLog = npc.aiChatLog[chatKey].slice(-20);
  const messages = [
    { role: 'system', content: systemPrompt },
    ...recentLog.map(m => ({ role: m.role, content: m.content }))
  ];

  // 通知玩家:正在思考
  sock.emit('npcChatThinking', { npcId, npcName: npc.name });

  // 广播给 pad 端和 host:玩家消息
  const chatMsg = {
    npcId, npcName: npc.name, npcAvatar: npc.avatar,
    playerId: role, message, type: 'user', ts: Date.now(),
    shared: !!npc.aiSharedChat
  };
  broadcastNpcAiChat(npc, chatMsg);

  try {
    const reply = await agnesChat(messages, { max_tokens: 500, temperature: 0.85 });
    // 存入历史
    npc.aiChatLog[chatKey].push({ role: 'assistant', content: reply, ts: Date.now() });
    // 限制历史长度(保留最近 40 条)
    if (npc.aiChatLog[chatKey].length > 40) {
      npc.aiChatLog[chatKey] = npc.aiChatLog[chatKey].slice(-40);
    }
    // 返回给玩家
    sock.emit('npcChatReply', {
      npcId, npcName: npc.name, npcAvatar: npc.avatar,
      message: reply, ts: Date.now(),
      gender: npc.aiGender, age: npc.aiAge
    });
    // 广播给 pad 端和 host:NPC 回复
    const replyMsg = {
      npcId, npcName: npc.name, npcAvatar: npc.avatar,
      playerId: role, message: reply, type: 'npc', ts: Date.now(),
      shared: !!npc.aiSharedChat
    };
    broadcastNpcAiChat(npc, replyMsg);
  } catch (e) {
    sock.emit('npcChatError', { npcId, error: 'AI 回复失败: ' + e.message });
  }
}

// v2.4.46: 广播 NPC AI 对话(根据 aiPadSync 决定是否发到 pad)
function broadcastNpcAiChat(npc, msg) {
  for (const [sid, s] of io.sockets.sockets) {
    if (!s.connected) continue;
    const r = getSocketRole(s);
    // host 始终收到(用于监控)
    if (r === 'host') { s.emit('npcAiChat', msg); continue; }
    // pad 根据 aiPadSync 开关
    if (r === 'pad' && npc.aiPadSync) { s.emit('npcAiChat', msg); continue; }
    // v2.4.46: 共享对话模式下,其他在线玩家也能收到(可加入对话)
    if (npc.aiSharedChat && isPlayerId(r) && r !== msg.playerId) {
      s.emit('npcAiChat', msg);
    }
  }
}

// v2.4.46: 主持人干预 NPC 对话 - 以 NPC 身份发消息或注入指令
async function hostInterveneNpc(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const npcId = p.npcId;
  const mode = p.mode || 'speak';  // speak(以NPC身份说话) | inject(注入隐藏指令影响AI) | clue(给玩家发线索/物品)
  let npc = null;
  for (const m of state.maps) {
    const found = m.npcs.find(n => n.id === npcId);
    if (found) { npc = found; break; }
  }
  if (!npc) return sock.emit('error', { msg: 'NPC 不存在' });

  if (mode === 'speak') {
    // 以 NPC 身份直接发消息给所有相关玩家
    const text = sanitizeText(p.message || '', 500);
    if (!text) return sock.emit('error', { msg: '消息不能为空' });
    const targetPlayer = p.targetPlayer || null;  // null = 所有正在和该NPC对话的玩家
    const msg = {
      npcId, npcName: npc.name, npcAvatar: npc.avatar,
      playerId: targetPlayer || 'host', message: text, type: 'npc',
      ts: Date.now(), hostInjected: true, shared: !!npc.aiSharedChat
    };
    // 存入共享对话历史
    const chatKey = npc.aiSharedChat ? '_shared' : (targetPlayer || '_all');
    if (!npc.aiChatLog[chatKey]) npc.aiChatLog[chatKey] = [];
    npc.aiChatLog[chatKey].push({ role: 'assistant', content: text, ts: Date.now(), hostInjected: true });
    // 发给目标玩家
    for (const [sid, s] of io.sockets.sockets) {
      if (!s.connected) continue;
      const r = getSocketRole(s);
      if (r === 'host') { s.emit('npcAiChat', msg); continue; }
      if (r === 'pad' && npc.aiPadSync) { s.emit('npcAiChat', msg); continue; }
      if (isPlayerId(r) && (!targetPlayer || r === targetPlayer)) {
        s.emit('npcChatReply', {
          npcId, npcName: npc.name, npcAvatar: npc.avatar,
          message: text, ts: Date.now(),
          gender: npc.aiGender, age: npc.aiAge, hostInjected: true
        });
      }
    }
    appendLog(`🎭 主持人以 NPC「${npc.name}」身份发言: ${text.slice(0, 50)}`);
    sock.emit('toast', { msg: '已以 NPC 身份发言' });
  } else if (mode === 'inject') {
    // 注入隐藏指令 - 影响后续 AI 回复(不直接显示给玩家)
    const directive = sanitizeText(p.message || '', 500);
    if (!directive) return sock.emit('error', { msg: '指令不能为空' });
    const targetPlayer = p.targetPlayer || null;
    const chatKey = npc.aiSharedChat ? '_shared' : (targetPlayer || '_all');
    if (!npc.aiChatLog[chatKey]) npc.aiChatLog[chatKey] = [];
    // 以 system 角色注入(OpenAI 格式中 system 消息会影响后续回复)
    npc.aiChatLog[chatKey].push({ role: 'system', content: '(主持人指令,玩家不可见)' + directive, ts: Date.now(), hidden: true });
    appendLog(`🎭 主持人向 NPC「${npc.name}」注入指令: ${directive.slice(0, 50)}`);
    sock.emit('toast', { msg: '已注入指令,将影响后续回复' });
  } else if (mode === 'clue') {
    // 通过 NPC 给玩家发线索/物品
    const targetPlayer = p.targetPlayer;
    const clueTitle = sanitizeText(p.clueTitle || '', 60);
    const clueBody = sanitizeText(p.clueBody || '', 1000);
    if (!targetPlayer || !clueTitle) return sock.emit('error', { msg: '需要目标玩家和线索标题' });
    // 发送给目标玩家
    for (const [sid, s] of io.sockets.sockets) {
      if (!s.connected) continue;
      if (getSocketRole(s) === targetPlayer) {
        s.emit('npcClue', {
          npcId, npcName: npc.name, npcAvatar: npc.avatar,
          title: clueTitle, body: clueBody, ts: Date.now()
        });
      }
    }
    appendLog(`🎁 NPC「${npc.name}」给 ${roleLabel(targetPlayer)} 发了线索: ${clueTitle}`);
    sock.emit('toast', { msg: `已通过 NPC 发送线索给 ${roleLabel(targetPlayer)}` });
  }
}

// v2.4.46: 主持人获取 NPC 对话历史(监控用)
function hostGetNpcChatLog(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const npcId = payload?.npcId;
  for (const m of state.maps) {
    const npc = m.npcs.find(n => n.id === npcId);
    if (npc) {
      // 返回所有玩家的对话历史
      const logs = {};
      for (const [key, log] of Object.entries(npc.aiChatLog)) {
        logs[key] = log.filter(m => !m.hidden).map(m => ({ ...m }));
      }
      sock.emit('npcChatLogForHost', { npcId, npcName: npc.name, logs, shared: !!npc.aiSharedChat });
      return;
    }
  }
}

// v2.4.45: 玩家请求 NPC 对话历史(重连后恢复)
// v2.4.46: 支持共享对话模式
function playerGetNpcChatHistory(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return;
  const npcId = payload?.npcId;
  for (const m of state.maps) {
    const npc = m.npcs.find(n => n.id === npcId);
    if (npc) {
      const chatKey = npc.aiSharedChat ? '_shared' : role;
      const history = (npc.aiChatLog[chatKey] || []).filter(x => !x.hidden);
      sock.emit('npcChatHistory', {
        npcId, history, greeting: npc.aiGreeting || '',
        shared: !!npc.aiSharedChat,
        gender: npc.aiGender, age: npc.aiAge
      });
      return;
    }
  }
}

// v2.4.45: 主持人清除 NPC 对话历史
function hostClearNpcChat(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const npcId = payload?.npcId;
  for (const m of state.maps) {
    const npc = m.npcs.find(n => n.id === npcId);
    if (npc) {
      npc.aiChatLog = {};
      appendLog(`🧹 主持人清除了 NPC ${npc.name} 的对话历史`);
      broadcastAll();
      sock.emit('toast', { msg: '已清除对话历史' });
      return;
    }
  }
}

// v2.4.47: NPC 商品管理 - 主持人添加/删除商品
function hostAddNpcShopItem(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const npcId = payload?.npcId;
  for (const m of state.maps) {
    const npc = m.npcs.find(n => n.id === npcId);
    if (npc) {
      if (!Array.isArray(npc.shop)) npc.shop = [];
      const item = {
        id: newId(),
        title: sanitizeText(payload.title || '商品', 60),
        body: sanitizeText(payload.body || '', 500),
        imageUrl: isHttpOrLocalUrl(payload.imageUrl) ? payload.imageUrl : '',
        price: Math.max(0, Math.min(999999, parseInt(payload.price) || 0)),
        stock: Math.max(-1, Math.min(9999, parseInt(payload.stock) === -1 ? -1 : (parseInt(payload.stock) || 0)))
      };
      npc.shop.push(item);
      appendLog(`🛒 NPC「${npc.name}」新增商品: ${item.title} (价格 ${item.price})`);
      console.log(`[shop] NPC ${npc.id} (${npc.name}) shop now has ${npc.shop.length} items`);
      broadcastAll();
      sock.emit('toast', { msg: `已添加商品: ${item.title}` });
      return;
    }
  }
  sock.emit('error', { msg: 'NPC 不存在' });
}

function hostDeleteNpcShopItem(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const npcId = payload?.npcId;
  const itemId = payload?.itemId;
  for (const m of state.maps) {
    const npc = m.npcs.find(n => n.id === npcId);
    if (npc) {
      if (!Array.isArray(npc.shop)) npc.shop = [];
      const before = npc.shop.length;
      npc.shop = npc.shop.filter(s => s.id !== itemId);
      if (npc.shop.length !== before) {
        appendLog(`🗑️ NPC「${npc.name}」删除了商品`);
        broadcastAll();
        sock.emit('toast', { msg: '已删除商品' });
      }
      return;
    }
  }
}

// v2.4.47: 玩家购买 NPC 商品
function playerBuyNpcItem(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const npcId = payload?.npcId;
  const itemId = payload?.itemId;
  const c = state.characters[role];
  if (!c) return sock.emit('error', { msg: '角色不存在' });
  for (const m of state.maps) {
    const npc = m.npcs.find(n => n.id === npcId);
    if (npc) {
      if (!Array.isArray(npc.shop)) return sock.emit('error', { msg: '该 NPC 没有商品' });
      const item = npc.shop.find(s => s.id === itemId);
      if (!item) return sock.emit('error', { msg: '商品不存在' });
      if (item.stock !== -1 && item.stock <= 0) return sock.emit('error', { msg: '库存不足' });
      if ((c.gold || 0) < item.price) return sock.emit('error', { msg: `金币不足(需要 ${item.price},当前 ${c.gold || 0})` });
      // 扣金币
      c.gold = Math.max(0, (c.gold || 0) - item.price);
      // 扣库存
      if (item.stock !== -1) item.stock -= 1;
      // 加入玩家背包
      if (!state.backpack[role]) state.backpack[role] = [];
      state.backpack[role].unshift({
        id: newId(),
        type: 'item',
        title: item.title,
        body: item.body || '',
        imageUrl: item.imageUrl || '',
        audioUrl: '', videoUrl: '',
        from: 'shop',
        boughtFrom: npc.name,
        price: item.price,
        pickedAt: Date.now()
      });
      if (state.backpack[role].length > 50) state.backpack[role].length = 50;
      appendLog(`💰 ${roleLabel(role)} 从 NPC「${npc.name}」购买了 ${item.title}(花费 ${item.price} 金币)`);
      broadcastAll();
      sock.emit('toast', { msg: `✅ 已购买 ${item.title}(-${item.price} 金币)` });
      return;
    }
  }
  sock.emit('error', { msg: 'NPC 不存在' });
}

// v2.4.47: 主持人通过 NPC 监控面板控制玩家属性(HP/MP/SAN/Gold)
function hostControlPlayerStats(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const target = payload?.target;
  if (!isPlayerId(target)) return sock.emit('error', { msg: '目标玩家无效' });
  const c = state.characters[target];
  if (!c) return sock.emit('error', { msg: '角色不存在' });
  const hpDelta = parseInt(payload.hpDelta) || 0;
  const mpDelta = parseInt(payload.mpDelta) || 0;
  const sanDelta = parseInt(payload.sanDelta) || 0;
  const goldDelta = parseInt(payload.goldDelta) || 0;
  const changes = [];
  if (hpDelta !== 0 && c.hp) {
    const before = c.hp.current;
    c.hp.current = Math.max(0, Math.min(c.hp.max, c.hp.current + hpDelta));
    if (c.hp.current !== before) changes.push(`HP ${before}→${c.hp.current}`);
  }
  if (mpDelta !== 0 && c.mp) {
    const before = c.mp.current;
    c.mp.current = Math.max(0, Math.min(c.mp.max, c.mp.current + mpDelta));
    if (c.mp.current !== before) changes.push(`MP ${before}→${c.mp.current}`);
  }
  if (sanDelta !== 0 && c.san) {
    const before = c.san.current;
    c.san.current = Math.max(0, Math.min(c.san.max, c.san.current + sanDelta));
    if (c.san.current !== before) changes.push(`SAN ${before}→${c.san.current}`);
  }
  if (goldDelta !== 0) {
    const before = c.gold || 0;
    c.gold = Math.max(0, Math.min(999999, before + goldDelta));
    if (c.gold !== before) changes.push(`金币 ${before}→${c.gold}`);
  }
  if (changes.length === 0) return sock.emit('toast', { msg: '没有变化' });
  appendLog(`⚙️ 主持人通过 NPC 面板调整 ${roleLabel(target)}: ${changes.join(', ')}`);
  broadcastAll();
  sock.emit('toast', { msg: `${roleLabel(target)} 已调整: ${changes.join(', ')}` });
}

// v2.4.47: 主持人通过 NPC 监控面板移动玩家到指定版图位置
function hostControlMovePlayer(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const target = payload?.target;
  const mapId = payload?.mapId;
  const x = parseFloat(payload.x);
  const y = parseFloat(payload.y);
  if (!isPlayerId(target)) return sock.emit('error', { msg: '目标玩家无效' });
  const destMap = state.maps.find(m => m.id === mapId);
  if (!destMap) return sock.emit('error', { msg: '目标版图不存在' });
  // 切换玩家所在版图
  state.playerMap[target] = mapId;
  // 设置玩家位置
  if (state.pieces[target] && Number.isFinite(x) && Number.isFinite(y)) {
    state.pieces[target].x = clamp01(x, state.pieces[target].x);
    state.pieces[target].y = clamp01(y, state.pieces[target].y);
  }
  appendLog(`🧭 主持人通过 NPC 面板将 ${roleLabel(target)} 移动到版图「${destMap.name}」`);
  broadcastAll();
  sock.emit('toast', { msg: `${roleLabel(target)} 已移动到 ${destMap.name}` });
}

// 玩家/NPC 交互:点击 NPC 后把对话分发给目标玩家 + pad 端大屏显示
// v2.4.18: 同时把当前对话广播到 pad 端,玩家在 pad 端点击可切换下一条
function playerNpcInteract(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const myMap = getPlayerMap(role);
  if (!myMap) return sock.emit('error', { msg: '所在版图不存在' });
  const npc = myMap.npcs.find(n => n.id === payload?.npcId);
  if (!npc) return;
  const dialogue = npc.dialogues.find(d => d.id === payload?.dialogueId);
  if (!dialogue) return;
  // 决定目标
  let targets;
  if (dialogue.target === 'all') {
    targets = PLAYER_IDS.slice();
  } else {
    // 'current' = 当前回合玩家
    const cur = state.turn.current;
    targets = [cur];
  }
  // 找到该 dialogue 在 npc.dialogues 数组中的 index (用于 pad 端切换下一条)
  const dlgIndex = npc.dialogues.findIndex(d => d.id === dialogue.id);
  const item = {
    id: newId(),
    type: dialogue.type,
    title: dialogue.title,
    body: dialogue.type === 'text' ? dialogue.content : '',
    imageUrl: dialogue.type === 'image' ? dialogue.content : '',
    audioUrl: dialogue.type === 'audio' ? dialogue.content : '',
    videoUrl: '',
    from: 'npc:' + npc.id,
    ts: Date.now()
  };
  for (const t of targets) {
    state.players[t].privateContent.unshift({ ...item });
    if (state.players[t].privateContent.length > 50) state.players[t].privateContent.length = 50;
  }
  // v2.4.18: 广播 NPC 对话到 pad 端大屏
  state.npcDialog = {
    id: newId(),
    npcId: npc.id,
    npcName: npc.name,
    npcAvatar: npc.avatar || '',
    dialogues: npc.dialogues.map(d => ({
      id: d.id, title: d.title, type: d.type, content: d.content
    })),
    index: dlgIndex >= 0 ? dlgIndex : 0,
    ts: Date.now()
  };
  // v2.4.25: NPC 上配置了 switchMapId 时,根据 switchMapTarget 决定带哪些玩家过去
  // v2.4.32: 通用化 - switchMapTarget: 'none'(默认,都不带) | 'p1'~'p6' | 'all'
  if (npc.switchMapId) {
    const targetMap = getMapById(npc.switchMapId);
    if (targetMap) {
      const target = npc.switchMapTarget || 'none';
      // 决定要带哪些玩家
      let followers = [];
      if (isPlayerId(target)) followers = [target];
      else if (target === 'all') followers = PLAYER_IDS.slice();
      // target === 'none' 或未配置 → followers = [],不带任何玩家
      for (const pid of followers) {
        state.playerMap[pid] = targetMap.id;
        // 玩家在新版图的位置:优先 startPieces,否则默认中心
        if (!targetMap.pieces[pid]) {
          targetMap.pieces[pid] = {
            x: 0.5, y: 0.5,
            color: PLAYER_COLORS[pid].color,
            label: PLAYER_COLORS[pid].icon + PLAYER_COLORS[pid].label
          };
        }
        if (targetMap.startPieces && targetMap.startPieces[pid]) {
          targetMap.pieces[pid].x = clamp01(targetMap.startPieces[pid].x, 0.5);
          targetMap.pieces[pid].y = clamp01(targetMap.startPieces[pid].y, 0.5);
        }
      }
      if (followers.length === 0) {
        appendLog(`🗺️ NPC「${npc.name}」触发了版图切换(无玩家跟随):${targetMap.name}`);
      } else if (followers.length === 1) {
        appendLog(`🗺️ NPC「${npc.name}」将 ${roleLabel(followers[0])} 带到了版图「${targetMap.name}」`);
      } else {
        appendLog(`🗺️ NPC「${npc.name}」将所有玩家带到了版图「${targetMap.name}」`);
      }
    }
  }
  appendLog(`💬 ${npc.name} 给出对话「${dialogue.title}」给 ${targets.length === 2 ? '所有玩家' : roleLabel(targets[0])}`);
  broadcastAll();
  sock.emit('toast', { msg: '已获得 NPC 的回应' });
}

// v2.4.18: pad / 玩家在 npcDialog 弹窗上点 "下一条"
function padNextNpcDialogue(sock, payload) {
  const dir = (payload && payload.direction) === 'prev' ? -1 : 1;
  if (!state.npcDialog) return;
  const npcMap = getActiveMap();
  if (!npcMap) return;
  const npc = npcMap.npcs.find(n => n.id === state.npcDialog.npcId);
  if (!npc || npc.dialogues.length === 0) return;
  const next = (state.npcDialog.index + dir + npc.dialogues.length) % npc.dialogues.length;
  state.npcDialog.index = next;
  broadcastAll();
}

function padCloseNpcDialog(sock) {
  state.npcDialog = null;
  broadcastAll();
}

// ---------- 剧本 ----------
function hostSetScript(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  state.script = {
    url: isHttpOrLocalUrl(p.url) ? p.url : (p.url === '' ? '' : state.script.url),
    file: isHttpOrLocalUrl(p.file) ? p.file : (p.file === '' ? '' : state.script.file),
    fileName: sanitizeText(p.fileName || state.script.fileName || '', 200)
  };
  appendLog('📜 主持人更新了剧本');
  broadcastAll();
  sock.emit('toast', { msg: '已更新剧本' });
}

// ---------- 主持人骰子 ----------
function hostRollDice(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  let rolls = [], modifier = 0, notation = '';
  if (Array.isArray(p.rolls) && p.rolls.length > 0) {
    rolls = p.rolls.filter(r => r && Number.isFinite(r.sides) && r.sides >= 2 && r.sides <= 1000);
    notation = rolls.map(r => `${r.count || 1}D${r.sides}`).join('+');
  } else if (typeof p.notation === 'string') {
    const parsed = parseDiceNotation(p.notation);
    rolls = parsed.rolls;
    modifier = parsed.modifier;
    notation = p.notation;
  }
  if (rolls.length === 0) return sock.emit('error', { msg: '骰子表达式无效' });
  const detail = [];
  let total = modifier;
  for (const r of rolls) {
    const count = Math.max(1, Math.min(20, r.count || 1));
    const sides = Math.max(2, Math.min(1000, r.sides));
    const results = [];
    for (let i = 0; i < count; i++) {
      const v = Math.floor(Math.random() * sides) + 1;
      results.push(v);
      total += v;
    }
    detail.push({ sides, results, sum: results.reduce((a, b) => a + b, 0) });
  }
  // v2.1: 主持人骰子公/私投由 state.hostDicePublic 统一控制(开关)
  const visible = state.hostDicePublic === true;
  const diceItem = {
    id: newId(),
    type: 'dice',
    from: 'host',
    notation,
    detail,
    modifier,
    total,
    visible,
    ts: Date.now()
  };
  state.hostDiceLog.unshift(diceItem);
  if (state.hostDiceLog.length > 50) state.hostDiceLog.length = 50;
  appendLog(`🎲 (KP) 投掷 ${notation} = ${total} ${visible ? '公开' : '🔒隐藏'}`);
  // v2.2: 公开投时在 pad 端临时大屏显示(2.5s),但不进入信息流
  if (visible) {
    const hlId = newId();
    state.padHighlight = {
      id: hlId,
      type: 'dice',
      from: 'host',
      notation,
      detail,
      modifier,
      total,
      ts: Date.now(),
      expiresAt: Date.now() + 2500
    };
    // 自动清除
    setTimeout(() => {
      if (state.padHighlight && state.padHighlight.id === hlId) {
        state.padHighlight = null;
        broadcastAll();
      }
    }, 2500 + 100);
  }
  broadcastAll();
  sock.emit('toast', { msg: `🎲 ${notation} = ${total} ${visible ? '(公开)' : '(私投)'}` });
}

function hostToggleDiceVisible(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const item = state.hostDiceLog.find(x => x.id === payload?.id);
  if (!item) return;
  item.visible = !item.visible;
  appendLog(`🎲 主持人${item.visible ? '公开' : '隐藏'}了一条骰子: ${item.notation}=${item.total}`);
  broadcastAll();
}

// v2.1: 主持人骰子公/私投总开关
function hostSetDicePublic(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  state.hostDicePublic = !!payload?.public;
  appendLog(`🎲 主持人骰子切换为: ${state.hostDicePublic ? '公开' : '私投'}`);
  broadcastAll();
  sock.emit('toast', { msg: state.hostDicePublic ? '主持人投骰: 公开' : '主持人投骰: 私投(不公开)' });
}

// ---------- 角色卡(玩家自己改) ----------
function playerSetCharacter(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const c = state.characters[role];
  if (typeof p.name === 'string') c.name = sanitizeText(p.name, 30);
  if (typeof p.gender === 'string') c.gender = sanitizeText(p.gender, 10);
  if (typeof p.avatar === 'string') c.avatar = isHttpOrLocalUrl(p.avatar) ? p.avatar : '';
  if (typeof p.intro === 'string') c.intro = sanitizeText(p.intro, 2000);
  if (p.hp && typeof p.hp === 'object') {
    if (Number.isFinite(parseInt(p.hp.max))) c.hp.max = Math.max(0, parseInt(p.hp.max));
    if (Number.isFinite(parseInt(p.hp.current))) c.hp.current = Math.max(0, Math.min(c.hp.max, parseInt(p.hp.current)));
  }
  if (p.mp && typeof p.mp === 'object') {
    if (Number.isFinite(parseInt(p.mp.max))) c.mp.max = Math.max(0, parseInt(p.mp.max));
    if (Number.isFinite(parseInt(p.mp.current))) c.mp.current = Math.max(0, Math.min(c.mp.max, parseInt(p.mp.current)));
  }
  if (p.san && typeof p.san === 'object') {
    if (Number.isFinite(parseInt(p.san.max))) c.san.max = Math.max(0, parseInt(p.san.max));
    if (Number.isFinite(parseInt(p.san.current))) c.san.current = Math.max(0, Math.min(c.san.max, parseInt(p.san.current)));
  }
  // v2.4.31: 金币(玩家可自己设一个数,但应>=0,上限 999999)
  if (Number.isFinite(parseInt(p.gold))) {
    c.gold = Math.max(0, Math.min(999999, parseInt(p.gold)));
  }
  if (Array.isArray(p.attributes)) {
    c.attributes = p.attributes
      .filter(a => a && typeof a.name === 'string')
      .map(a => ({ id: a.id || newId(), name: sanitizeText(a.name, 30) || '属性', value: parseInt(a.value) || 0 }))
      .slice(0, 30);
  }
  // v2.4.30: 技能列表 (COC 成功率 / DND 加成 / 自定义)
  if (Array.isArray(p.skills)) {
    c.skills = p.skills
      .filter(s => s && typeof s.name === 'string')
      .map(s => ({
        id: s.id || newId(),
        name: sanitizeText(s.name, 30) || '技能',
        value: parseInt(s.value) || 0,
        // v2.4.30: 可选 - 技能分类(COC战斗/调查/DND技能/自定义)
        group: sanitizeText(s.group || '', 20)
      }))
      .slice(0, 50);
  }
  appendLog(`📝 ${roleLabel(role)} 更新了角色卡`);
  broadcastAll();
  sock.emit('toast', { msg: '已保存角色卡' });
}

// v2.4.29: 玩家请求角色模板列表 (公开,任何端都可查)
// v2.4.30: 返回字段加上 skills
function listCharacterTemplates(sock, query) {
  // 不限制角色(主持人/玩家都能查)
  const game = (query && query.game) || 'all';
  let list = CHARACTER_TEMPLATES;
  if (game !== 'all') list = list.filter(t => t.game === game);
  // 简化返回(去掉 attributes 详情中的 id,只保留 name+value)
  const simple = list.map(t => ({
    id: t.id,
    game: t.game,
    icon: t.icon,
    name: t.name,
    gender: t.gender,
    hp: { ...t.hp },
    mp: { ...t.mp },
    san: { ...t.san },
    // v2.4.31: 模板初始金币
    gold: typeof t.gold === 'number' ? t.gold : 100,
    intro: t.intro,
    attributes: t.attributes.map(a => ({ name: a.name, value: a.value })),
    // v2.4.30: 技能列表(每个模板 3-8 项)
    skills: (t.skills || []).map(s => ({ name: s.name, value: s.value, group: s.group || '' }))
  }));
  sock.emit('characterTemplates', { items: simple, total: simple.length, game });
}

// v2.4.29: 玩家应用一个角色模板(覆盖自己的角色卡)
function playerApplyCharacterTemplate(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const tid = payload && payload.templateId;
  const tpl = CHARACTER_TEMPLATES.find(t => t.id === tid);
  if (!tpl) return sock.emit('error', { msg: '模板不存在' });
  const c = state.characters[role];
  // 应用模板(avatar 不动,只覆盖文字字段)
  c.name = tpl.name;
  c.gender = tpl.gender;
  c.hp = { ...tpl.hp };
  c.mp = { ...tpl.mp };
  c.san = { ...tpl.san };
  // v2.4.31: 应用模板金币
  c.gold = typeof tpl.gold === 'number' ? tpl.gold : 100;
  c.intro = tpl.intro;
  c.attributes = tpl.attributes.map(a => ({ id: newId(), name: a.name, value: a.value }));
  // v2.4.30: 应用技能
  c.skills = (tpl.skills || []).map(s => ({ id: newId(), name: s.name, value: s.value, group: s.group || '' }));
  appendLog(`📋 ${roleLabel(role)} 应用了角色模板: ${tpl.icon} ${tpl.name} (${tpl.game})`);
  broadcastAll();
  sock.emit('toast', { msg: `已应用模板: ${tpl.name}` });
}
function hostDeductHp(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const target = payload?.target;
  if (!isPlayerId(target)) return sock.emit('error', { msg: '目标无效' });
  const amount = parseInt(payload.amount);
  if (!Number.isFinite(amount) || amount === 0) return sock.emit('error', { msg: '伤害值无效' });
  const c = state.characters[target];
  const before = c.hp.current;
  // amount 是 HP 变化量(正数=治疗,负数=扣血)
  c.hp.current = Math.max(0, Math.min(c.hp.max, c.hp.current + amount));
  const delta = c.hp.current - before;
  const verb = amount > 0 ? '治疗' : '扣血';
  appendLog(`🩸 主持人对 ${roleLabel(target)} ${verb} ${Math.abs(amount)} (HP ${before} → ${c.hp.current}/${c.hp.max})`);
  broadcastAll();
  sock.emit('toast', { msg: `${roleLabel(target)} HP: ${c.hp.current}/${c.hp.max}` });
}

// v2.4.20: 通用 HP / MP / SAN 增减
function hostAdjustStat(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const target = payload?.target;
  if (!isPlayerId(target)) return sock.emit('error', { msg: '目标无效' });
  const stat = payload?.stat;
  if (stat !== 'hp' && stat !== 'mp' && stat !== 'san') return sock.emit('error', { msg: '属性无效(只支持 hp/mp/san)' });
  const amount = parseInt(payload.amount);
  if (!Number.isFinite(amount) || amount === 0) return sock.emit('error', { msg: '数值无效' });
  const c = state.characters[target];
  if (!c[stat]) return sock.emit('error', { msg: '属性不存在' });
  const before = c[stat].current;
  c[stat].current = Math.max(0, Math.min(c[stat].max, c[stat].current + amount));
  const icon = stat === 'hp' ? '❤️' : stat === 'mp' ? '🔵' : '🧠';
  const verb = amount > 0 ? '增加' : '扣减';
  const k = stat.toUpperCase();
  appendLog(`${icon} 主持人对 ${roleLabel(target)} ${verb} ${k} ${Math.abs(amount)} (${before} → ${c[stat].current}/${c[stat].max})`);
  broadcastAll();
  sock.emit('toast', { msg: `${roleLabel(target)} ${k}: ${c[stat].current}/${c[stat].max}` });
}

// ---------- 玩家笔记 ----------
function playerSetNote(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  state.notes[role] = sanitizeText(payload?.note || '', 20000);
  appendLog(`📓 ${roleLabel(role)} 保存了笔记`);
  // 广播(主持人端可以查看玩家笔记)
  broadcastAll();
  sock.emit('toast', { msg: '已保存笔记' });
}

// ---------- 玩家拾取版图上的物品/线索 ----------
// v2.3.1: 单击拾取
//   - item 类型 → 进入背包(可拾取,丢失/交易)
//   - clue 类型 → 进入收件箱(玩家私密线索)
//   - event 类型 → 触发事件(媒体+效果+换图),不进入背包
// v2.4: 在玩家所在版图上查找
function playerPickupClue(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const myMap = getPlayerMap(role);
  if (!myMap) return sock.emit('error', { msg: '所在版图不存在' });
  // 玩家可拾取版图上的线索(clue/clue_card)或物品(item)
  // 事件(event) 和 图片(image) 不可拾
  const item = myMap.items.find(it =>
    it.id === payload?.itemId && (it.type === 'clue_card' || it.type === 'clue' || it.type === 'item')
  );
  if (!item) return sock.emit('error', { msg: '该物品不可拾取' });
  // target 语义
  if (isPlayerId(item.target) && item.target !== role) {
    return sock.emit('error', { msg: `这个物品是给 ${roleLabel(item.target)} 的` });
  }
  if (item.target === 'pad' && state.turn.current !== role) return sock.emit('error', { msg: `现在是 ${roleLabel(state.turn.current)} 的回合` });
  // 根据类型决定去向:
  //   - 物品(item) → 背包
  //   - 线索(clue/clue_card) → 收件箱(privateContent)
  const ts = Date.now();
  if (item.type === 'item') {
    const itemEntry = {
      id: newId(),
      type: 'item',
      title: item.title || '未命名物品',
      body: item.body || '',
      imageUrl: item.imageUrl || '',
      audioUrl: item.audioUrl || '',
      videoUrl: item.videoUrl || '',
      from: 'map',
      pickedAt: ts
    };
    state.backpack[role].unshift(itemEntry);
    if (state.backpack[role].length > 50) state.backpack[role].length = 50;
    appendLog(`🎒 ${roleLabel(role)} 拾取了物品: ${item.title || ''}`);
    sock.emit('toast', { msg: '已加入背包' });
  } else {
    const clueEntry = {
      id: newId(),
      type: 'clue',
      title: item.title || '未命名线索',
      body: item.body || '',
      imageUrl: item.imageUrl || '',
      from: 'map',
      ts
    };
    state.players[role].privateContent.unshift(clueEntry);
    if (state.players[role].privateContent.length > 50) state.players[role].privateContent.length = 50;
    appendLog(`🔍 ${roleLabel(role)} 拾取了线索: ${item.title || ''}`);
    sock.emit('toast', { msg: '已加入线索' });
  }
  // 从版图上移除
  myMap.items = myMap.items.filter(it => it.id !== item.id);
  broadcastAll();
}

// v2.3: 玩家间互赠物品(交易)
function playerTradeItem(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const target = p.target;
  if (!isPlayerId(target)) return sock.emit('error', { msg: '目标玩家无效' });
  if (target === role) return sock.emit('error', { msg: '不能交易给自己' });
  const itemId = p.itemId;
  if (!itemId) return sock.emit('error', { msg: '缺少物品 ID' });
  const idx = state.backpack[role].findIndex(c => c.id === itemId);
  if (idx < 0) return sock.emit('error', { msg: '物品不在你的背包中' });
  const item = state.backpack[role][idx];
  // 移除自己背包中的物品
  state.backpack[role].splice(idx, 1);
  // 推入对方背包(用新 id 避免冲突)
  const newItem = {
    ...item,
    id: newId(),
    from: 'trade',
    originalFrom: item.from || '',
    tradedFrom: role,
    tradedAt: Date.now(),
    pickedAt: item.pickedAt || Date.now()
  };
  state.backpack[target].unshift(newItem);
  if (state.backpack[target].length > 50) state.backpack[target].length = 50;
  appendLog(`🤝 ${roleLabel(role)} 把「${item.title || '物品'}」交易给了${roleLabel(target)}`);
  broadcastAll();
  sock.emit('toast', { msg: `已赠送给${roleLabel(target)}` });
}

// v2.4.34: 玩家用物品换金币(卖给另一玩家)
function playerTradeItemForGold(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const target = p.target;
  if (!isPlayerId(target)) return sock.emit('error', { msg: '目标玩家无效' });
  if (target === role) return sock.emit('error', { msg: '不能交易给自己' });
  const itemId = p.itemId;
  const goldAmt = parseInt(p.gold, 10);
  if (!itemId) return sock.emit('error', { msg: '缺少物品 ID' });
  if (!Number.isFinite(goldAmt) || goldAmt <= 0) return sock.emit('error', { msg: '金币数必须 > 0' });
  if (goldAmt > 999999) return sock.emit('error', { msg: '金币数过大' });
  const idx = state.backpack[role].findIndex(c => c.id === itemId);
  if (idx < 0) return sock.emit('error', { msg: '物品不在你的背包中' });
  const tgt = state.characters[target];
  if (!tgt) return sock.emit('error', { msg: '目标玩家不存在' });
  if ((tgt.gold || 0) < goldAmt) return sock.emit('error', { msg: `${roleLabel(target)} 金币不足(只有 ${tgt.gold || 0})` });
  const item = state.backpack[role][idx];
  // 扣金币 -> 加给卖方
  tgt.gold -= goldAmt;
  const me = state.characters[role];
  me.gold = (me.gold || 0) + goldAmt;
  // 转移物品
  state.backpack[role].splice(idx, 1);
  const newItem = {
    ...item,
    id: newId(),
    from: 'trade',
    originalFrom: item.from || '',
    tradedFrom: role,
    tradedAt: Date.now(),
    pickedAt: item.pickedAt || Date.now(),
    tradeGold: goldAmt
  };
  state.backpack[target].unshift(newItem);
  if (state.backpack[target].length > 50) state.backpack[target].length = 50;
  appendLog(`💱 ${roleLabel(role)} 把「${item.title || '物品'}」以 ${goldAmt} 金币卖给了${roleLabel(target)}`);
  broadcastAll();
  sock.emit('toast', { msg: `已卖给${roleLabel(target)}, 获得 ${goldAmt} 💰` });
  // 通知目标
  const tgtSock = io.sockets.sockets.get(sockets[target]);
  if (tgtSock) tgtSock.emit('toast', { msg: `💱 ${roleLabel(role)} 把「${item.title || '物品'}」以 ${goldAmt} 💰 卖给你` });
}

// v2.4.34: 玩家用物品换物品(双方互换)
function playerTradeItemForItem(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const target = p.target;
  if (!isPlayerId(target)) return sock.emit('error', { msg: '目标玩家无效' });
  if (target === role) return sock.emit('error', { msg: '不能交易给自己' });
  const myItemId = p.itemId;
  const tgtItemId = p.targetItemId;
  if (!myItemId) return sock.emit('error', { msg: '缺少自己的物品 ID' });
  if (!tgtItemId) return sock.emit('error', { msg: '缺少目标物品 ID' });
  const myIdx = state.backpack[role].findIndex(c => c.id === myItemId);
  if (myIdx < 0) return sock.emit('error', { msg: '物品不在你的背包中' });
  const tgtIdx = state.backpack[target].findIndex(c => c.id === tgtItemId);
  if (tgtIdx < 0) return sock.emit('error', { msg: '目标物品不在对方背包中' });
  const myItem = state.backpack[role][myIdx];
  const tgtItem = state.backpack[target][tgtIdx];
  // 移除
  state.backpack[role].splice(myIdx, 1);
  state.backpack[target].splice(tgtIdx, 1);
  // 互推(各自拿对方的物品)
  // role 把 myItem 给 target;target 把 tgtItem 给 role
  const roleGiveToTarget = {
    ...myItem,
    id: newId(),
    from: 'trade',
    originalFrom: myItem.from || '',
    tradedFrom: role,
    tradedAt: Date.now(),
    pickedAt: myItem.pickedAt || Date.now()
  };
  const targetGiveToRole = {
    ...tgtItem,
    id: newId(),
    from: 'trade',
    originalFrom: tgtItem.from || '',
    tradedFrom: target,
    tradedAt: Date.now(),
    pickedAt: tgtItem.pickedAt || Date.now()
  };
  state.backpack[target].unshift(roleGiveToTarget);  // target 拿到 role 的物品
  state.backpack[role].unshift(targetGiveToRole);    // role 拿到 target 的物品
  if (state.backpack[role].length > 50) state.backpack[role].length = 50;
  if (state.backpack[target].length > 50) state.backpack[target].length = 50;
  appendLog(`🔄 ${roleLabel(role)} 与${roleLabel(target)} 互换了物品(「${myItem.title || '?'}」↔「${tgtItem.title || '?'}」)`);
  broadcastAll();
  sock.emit('toast', { msg: `已与${roleLabel(target)}互换物品` });
  const tgtSock = io.sockets.sockets.get(sockets[target]);
  if (tgtSock) tgtSock.emit('toast', { msg: `🔄 ${roleLabel(role)} 与你互换物品` });
}

// v2.4.34: 玩家单纯赠与金币给另一玩家
function playerTradeGold(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const target = p.target;
  if (!isPlayerId(target)) return sock.emit('error', { msg: '目标玩家无效' });
  if (target === role) return sock.emit('error', { msg: '不能赠与自己' });
  const goldAmt = parseInt(p.gold, 10);
  if (!Number.isFinite(goldAmt) || goldAmt <= 0) return sock.emit('error', { msg: '金币数必须 > 0' });
  if (goldAmt > 999999) return sock.emit('error', { msg: '金币数过大' });
  const me = state.characters[role];
  const tgt = state.characters[target];
  if (!tgt) return sock.emit('error', { msg: '目标玩家不存在' });
  if ((me.gold || 0) < goldAmt) return sock.emit('error', { msg: `你的金币不足(只有 ${me.gold || 0})` });
  me.gold -= goldAmt;
  tgt.gold = (tgt.gold || 0) + goldAmt;
  appendLog(`💰 ${roleLabel(role)} 赠与 ${roleLabel(target)} ${goldAmt} 金币`);
  broadcastAll();
  sock.emit('toast', { msg: `已赠与${roleLabel(target)} ${goldAmt} 💰` });
  const tgtSock = io.sockets.sockets.get(sockets[target]);
  if (tgtSock) tgtSock.emit('toast', { msg: `💰 ${roleLabel(role)} 赠与你 ${goldAmt} 金币` });
}

// v2.4.34: 玩家给另一玩家"看"线索(不消耗, 双方都有副本)
// v2.4.35: 限制为只能给看线索, 物品不能"给看"
function playerShowClue(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const target = p.target;
  if (!isPlayerId(target)) return sock.emit('error', { msg: '目标玩家无效' });
  if (target === role) return sock.emit('error', { msg: '不能给自己看' });
  const itemId = p.itemId;
  if (!itemId) return sock.emit('error', { msg: '缺少物品 ID' });
  const idx = state.backpack[role].findIndex(c => c.id === itemId);
  if (idx < 0) return sock.emit('error', { msg: '物品不在你的背包中' });
  const item = state.backpack[role][idx];
  // v2.4.35: 物品不能"给看"(只有线索 type='clue' 可以)
  if (item.type !== 'clue') {
    return sock.emit('error', { msg: '物品不能用"给看"功能,只能转赠/卖/交易。' });
  }
  // v2.4.34: 推送一个"只读副本"到对方 viewedClues,不消耗自己的物品
  if (!state.viewedClues) state.viewedClues = {};
  if (!state.viewedClues[target]) state.viewedClues[target] = [];
  const viewCopy = {
    id: newId(),
    type: item.type,
    title: item.title || '',
    body: item.body || '',
    imageUrl: item.imageUrl || '',
    audioUrl: item.audioUrl || '',
    videoUrl: item.videoUrl || '',
    from: 'show',
    shownBy: role,
    shownAt: Date.now(),
    originalId: item.id
  };
  state.viewedClues[target].unshift(viewCopy);
  if (state.viewedClues[target].length > 50) state.viewedClues[target].length = 50;
  appendLog(`👁️ ${roleLabel(role)} 把「${item.title || '线索'}」给${roleLabel(target)}看了看(未转移)`);
  broadcastAll();
  sock.emit('toast', { msg: `已让${roleLabel(target)}查看「${item.title || '线索'}」` });
  const tgtSock = io.sockets.sockets.get(sockets[target]);
  if (tgtSock) tgtSock.emit('toast', { msg: `👁️ ${roleLabel(role)} 给你看了「${item.title || '线索'}」(只读)` });
}

// v2.4.34: 玩家丢弃"查看"副本
function playerDiscardViewed(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const viewId = p.viewId;
  if (!viewId) return sock.emit('error', { msg: '缺少查看 ID' });
  if (!state.viewedClues || !state.viewedClues[role]) return sock.emit('error', { msg: '没有可丢弃的查看' });
  const idx = state.viewedClues[role].findIndex(c => c.id === viewId);
  if (idx < 0) return sock.emit('error', { msg: '查看不在列表中' });
  state.viewedClues[role].splice(idx, 1);
  broadcastAll();
  sock.emit('toast', { msg: '已丢弃' });
}

// v2.4.35: 获取对方背包(物换物时调用,只返回 id/title/type/icon,不泄露 body 内容)
function playerGetOtherBag(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const target = p.target;
  if (!isPlayerId(target)) return sock.emit('error', { msg: '目标玩家无效' });
  if (target === role) return sock.emit('error', { msg: '不能交易给自己' });
  if (!state.backpack[target]) return sock.emit('error', { msg: '目标玩家背包为空' });
  // 只返回必要字段(防止身体内容泄露)
  const safe = state.backpack[target].map(x => ({
    id: x.id,
    type: x.type,
    title: x.title || (x.type === 'item' ? '物品' : '线索')
  }));
  sock.emit('player:otherBag', { target, bag: safe });
}


function hostAddToPlayerBackpack(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  let targets = Array.isArray(p.targets) ? p.targets : (typeof p.target === 'string' ? [p.target] : []);
  targets = targets.filter(t => isPlayerId(t));
  if (targets.length === 0) return sock.emit('error', { msg: '请选择至少一个玩家' });
  const title = sanitizeText(p.title || '', 60);
  if (!title) return sock.emit('error', { msg: '请填写物品名称' });
  const body = sanitizeText(p.body || '', 2000);
  const imageUrl = isHttpOrLocalUrl(p.imageUrl) ? p.imageUrl : '';
  // v2.4.35: 支持 type (item / clue),默认 'item'(物品)
  const type = p.type === 'clue' ? 'clue' : 'item';
  const item = {
    id: newId(),
    type,
    title,
    body,
    imageUrl,
    from: 'host',
    pickedAt: Date.now()
  };
  for (const t of targets) {
    state.backpack[t].unshift({ ...item });
    if (state.backpack[t].length > 50) state.backpack[t].length = 50;
  }
  appendLog(`🎒 主持人向 ${targets.map(roleLabel).join('+')} 背包中加入了「${title}」`);
  broadcastAll();
  sock.emit('toast', { msg: `已向 ${targets.map(roleLabel).join('+')} 背包中添加「${title}」` });
}

// v2.4.19: 主持人设置玩家起始属性
// v2.4.21: 修正使用 current 字段(与 defaultCharacter 一致),默认 10
// v2.4.31: 增加 gold 字段支持
function hostSetPlayerInit(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const playerId = p.playerId;
  if (!isPlayerId(playerId)) return sock.emit('error', { msg: '无效玩家' });
  const ch = state.characters[playerId];
  if (!ch) return;
  const hp = Math.max(0, parseInt(p.hp) || 10);
  const mp = Math.max(0, parseInt(p.mp) || 10);
  const san = Math.max(0, parseInt(p.san) || 10);
  const gold = Math.max(0, Math.min(999999, parseInt(p.gold) || 100));
  // 修复:使用 current 字段(与其他函数一致)
  ch.hp = { current: hp, max: hp };
  ch.mp = { current: mp, max: mp };
  ch.san = { current: san, max: san };
  ch.gold = gold;
  appendLog(`🩸 主持人将 ${roleLabel(playerId)} 起始属性设为 HP=${hp} MP=${mp} SAN=${san} 💰${gold}`);
  broadcastAll();
  sock.emit('toast', { msg: `${roleLabel(playerId)} 起始属性已设置(💰${gold})` });
}

// v2.4.31: 主持人调整玩家金币(增量)
//   payload: { playerId, delta }  delta 可正(奖励)可负(扣款/购买)
//   - delta=null 或没传 → 等价 setGold
//   - 正数 → 加金币(完成任务/奖励)
//   - 负数 → 扣金币(购买/罚款)
//   - 边界:0 ~ 999999
function hostAdjustPlayerGold(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const playerId = p.playerId;
  if (!isPlayerId(playerId)) return sock.emit('error', { msg: '无效玩家' });
  const ch = state.characters[playerId];
  if (!ch) return;
  const before = typeof ch.gold === 'number' ? ch.gold : 100;
  let after = before;
  if (Number.isFinite(parseInt(p.delta))) {
    after = before + parseInt(p.delta);
  } else if (Number.isFinite(parseInt(p.gold))) {
    after = parseInt(p.gold);
  } else {
    return sock.emit('error', { msg: '请提供 delta(增量)或 gold(目标值)' });
  }
  after = Math.max(0, Math.min(999999, after));
  ch.gold = after;
  const diff = after - before;
  const sign = diff > 0 ? '+' : (diff < 0 ? '' : '±');
  const icon = diff > 0 ? '💰' : (diff < 0 ? '💸' : '💰');
  if (diff !== 0) {
    appendLog(`${icon} 主持人调整 ${roleLabel(playerId)} 金币 ${sign}${diff} → 当前 💰${after}`);
  } else {
    appendLog(`💰 主持人将 ${roleLabel(playerId)} 金币设为 ${after}`);
  }
  broadcastAll();
  sock.emit('toast', { msg: `${roleLabel(playerId)} 金币 ${diff !== 0 ? sign + diff + ' = ' : ''}💰${after}` });
}

// v2.4.19: 主持人 → 玩家 私聊
function hostChatToPlayer(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const target = p.target;
  const text = sanitizeText(p.text || '', 500);
  if (!isPlayerId(target)) return;
  if (!text) return;
  if (!state.chat[target]) state.chat[target] = [];
  state.chat[target].push({ from: 'host', text, ts: Date.now() });
  if (state.chat[target].length > 200) state.chat[target].length = 200;
  appendLog(`💬 主持人 → ${roleLabel(target)}: ${text.slice(0, 30)}`);
  broadcastAll();
}

// v2.4.19: 主持人清空玩家聊天
function hostClearChat(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const target = p.target;
  if (!isPlayerId(target)) return;
  state.chat[target] = [];
  appendLog(`🗑️ 主持人清空与 ${roleLabel(target)} 的私聊记录`);
  broadcastAll();
}

// v2.4.19: 玩家 → 主持人 私聊
function playerChatToHost(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const text = sanitizeText(p.text || '', 500);
  if (!text) return;
  if (!state.chat[role]) state.chat[role] = [];
  state.chat[role].push({ from: 'player', text, ts: Date.now() });
  if (state.chat[role].length > 200) state.chat[role].length = 200;
  appendLog(`💬 ${roleLabel(role)} → 主持人: ${text.slice(0, 30)}`);
  broadcastAll();
}

function playerDiscardClue(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const before = state.backpack[role].length;
  state.backpack[role] = state.backpack[role].filter(c => c.id !== payload?.clueId);
  if (state.backpack[role].length !== before) {
    broadcastAll();
    sock.emit('toast', { msg: '已丢弃线索' });
  }
}

// ---------- 玩家向其他玩家发送线索(新功能,替代 player:pushToPad) ----------
function playerSendClueToPlayer(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const target = payload?.target;
  if (!isPlayerId(target) || target === role) {
    return sock.emit('error', { msg: '目标无效' });
  }
  const title = sanitizeText(payload?.title || '', 60) || '线索';
  const body = sanitizeText(payload?.body || '', 2000);
  const imageUrl = isHttpOrLocalUrl(payload?.imageUrl) ? payload.imageUrl : '';
  if (!body && !imageUrl) return sock.emit('error', { msg: '线索内容不能为空' });
  const clue = {
    id: newId(),
    type: 'clue',
    title,
    body,
    imageUrl,
    from: role,
    ts: Date.now()
  };
  state.players[target].privateContent.unshift(clue);
  if (state.players[target].privateContent.length > 50) state.players[target].privateContent.length = 50;
  appendLog(`💌 ${roleLabel(role)} 向 ${roleLabel(target)} 发送了线索「${title}」`);
  broadcastAll();
  sock.emit('toast', { msg: `已发送给 ${roleLabel(target)}` });
}

// ---------- 线索钉到版图(卡牌形态) ----------
// v2.4: 现在操作 activeMap.items,类型为 'clue' 或 'clue_card'
function hostPinClueAsCard(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  // 目标支持多选: 'pad' / 'p1' / 'p2' / 'all' / 数组
  let targets;
  if (Array.isArray(p.targets)) {
    // v2.4.32: 通用化 - 支持 p1~p6
    targets = p.targets.filter(t => isPlayerId(t) || t === 'pad');
  } else if (typeof p.target === 'string') {
    if (p.target === 'all') targets = PLAYER_IDS.slice();
    else if (isPlayerId(p.target) || p.target === 'pad') targets = [p.target];
    else targets = [p.target];
  } else {
    targets = ['pad'];  // 默认放到桌面(当前回合)
  }
  if (targets.length === 0) return sock.emit('error', { msg: '请选择至少一个分发目标' });
  const title = sanitizeText(p.title || '', 60) || '线索';
  const body = sanitizeText(p.body || '', 2000);
  const imageUrl = isHttpOrLocalUrl(p.imageUrl) ? p.imageUrl : '';
  const m = getActiveMap();
  if (!m) return sock.emit('error', { msg: '版图不存在' });
  // 每个目标都生成一张卡: target=具体玩家表示只有该玩家可拾, target='pad' 表示当前回合玩家
  for (const t of targets) {
    const card = {
      id: newId(),
      type: 'clue_card',
      title,
      body,
      imageUrl,
      x: clamp01(p.x, 0.5),
      y: clamp01(p.y, 0.5),
      scale: 1.0,
      target: t,
      pinner: 'host',
      color: pickUniqueColor(),  // v2.3.1: 唯一颜色
      ts: Date.now()
    };
    m.items.push(card);
  }
  appendLog(`🃏 主持人在版图上分发了线索「${title}」给 ${targets.map(t => t === 'pad' ? '桌面(当前回合)' : roleLabel(t)).join('+')}`);
  broadcastAll();
  sock.emit('toast', { msg: `线索「${title}」已分发(${targets.length}份)` });
}

// =====================================================================
// v2.4: 多版图系统 + 事件类型  + 保存/导出
// =====================================================================

// ---------- 版图增/删/切换 ----------
function hostAddMap(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const p = payload || {};
  const name = sanitizeText(p.name || '', 30) || `版图 ${state.maps.length + 1}`;
  const url = isHttpOrLocalUrl(p.url) ? p.url : null;
  const newMap = {
    id: 'map_' + newId().slice(3),
    name,
    url,
    bgm: null,
    startPieces: {
      p1: { x: 0.5, y: 0.5 },
      p2: { x: 0.5, y: 0.5 }
    },
    items: [],
    npcs: [],
    pieces: {
      p1: { x: 0.5, y: 0.5, color: '#e74c3c', label: '🔴P1' },
      p2: { x: 0.5, y: 0.5, color: '#3498db', label: '🔵P2' }
    }
  };
  state.maps.push(newMap);
  appendLog(`🗺️ 主持人添加了版图: ${name}`);
  broadcastAll();
  sock.emit('toast', { msg: `已添加版图: ${name}` });
}

function hostDeleteMap(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const mapId = payload?.mapId;
  const m = getMapById(mapId);
  if (!m) return sock.emit('error', { msg: '版图不存在' });
  if (state.maps.length <= 1) return sock.emit('error', { msg: '至少保留一个版图' });
  // 玩家若在当前版图,先移到第一个版图
  // v2.4.32: 通用化 - 所有玩家
  for (const pid of PLAYER_IDS) {
    if (state.playerMap[pid] === mapId) {
      state.playerMap[pid] = state.maps[0].id;
    }
  }
  if (state.activeMapId === mapId) {
    state.activeMapId = state.maps[0].id;
  }
  const idx = state.maps.findIndex(x => x.id === mapId);
  const name = m.name;
  state.maps.splice(idx, 1);
  appendLog(`🗑️ 主持人删除了版图: ${name}`);
  broadcastAll();
  sock.emit('toast', { msg: `已删除版图: ${name}` });
}

function hostRenameMap(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const m = getMapById(payload?.mapId);
  if (!m) return sock.emit('error', { msg: '版图不存在' });
  const name = sanitizeText(payload?.name || '', 30);
  if (!name) return sock.emit('error', { msg: '版图名不能为空' });
  m.name = name;
  appendLog(`✏️ 主持人重命名版图为: ${name}`);
  broadcastAll();
}

function hostSwitchMap(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const mapId = payload?.mapId;
  const m = getMapById(mapId);
  if (!m) return sock.emit('error', { msg: '版图不存在' });
  state.activeMapId = mapId;
  // v2.4.20: 支持客户端传 followers 列表(弹窗选择)
  // 如果没传,则不移动任何玩家(老的 followers 默认行为已取消)
  // v2.4.32: 通用化 - followers 支持 p1~p6
  const followers = Array.isArray(payload?.followers) ? payload.followers.filter(p => isPlayerId(p)) : [];
  if (!m._playerEverSet) {
    m._playerEverSet = {};
    for (const pid of PLAYER_IDS) m._playerEverSet[pid] = false;
  }
  for (const pid of followers) {
    state.playerMap[pid] = m.id;
    // 首次进入版图:使用 startPieces
    if (!m._playerEverSet[pid] && m.startPieces && m.startPieces[pid]) {
      if (!m.pieces[pid]) m.pieces[pid] = { x: 0.5, y: 0.5, color: PLAYER_COLORS[pid].color, label: PLAYER_COLORS[pid].icon + PLAYER_COLORS[pid].label };
      m.pieces[pid].x = clamp01(m.startPieces[pid].x, 0.5);
      m.pieces[pid].y = clamp01(m.startPieces[pid].y, 0.5);
      m._playerEverSet[pid] = true;
    } else {
      if (!m.pieces[pid]) m.pieces[pid] = { x: 0.5, y: 0.5, color: PLAYER_COLORS[pid].color, label: PLAYER_COLORS[pid].icon + PLAYER_COLORS[pid].label };
    }
  }
  // 临时标记清除
  state.mapMarker = null;
  if (followers.length > 0) {
    appendLog(`🗺️ 主持人切换到版图: ${m.name} (并把 ${followers.map(roleLabel).join('+')} 移过去)`);
  } else {
    appendLog(`🗺️ 主持人切换到版图: ${m.name}`);
  }
  broadcastAll();
  sock.emit('toast', { msg: `已切换到: ${m.name}` });
}

function hostSetMapUrl(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const m = getActiveMap();
  if (!m) return sock.emit('error', { msg: '版图不存在' });
  const url = sanitizeText(payload?.url || '', 1000);
  if (url && !isHttpOrLocalUrl(url)) return sock.emit('error', { msg: '版图URL必须以http(s):// 或 /uploads/ 开头' });
  m.url = url || null;
  appendLog('🖼️ 主持人设置了版图背景');
  broadcastAll();
  sock.emit('toast', { msg: '已设置版图背景' });
}

// v2.4.18: 设置 activeMap 的专属 BGM
function hostSetMapBgm(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const m = getActiveMap();
  if (!m) return sock.emit('error', { msg: '版图不存在' });
  const p = payload || {};
  if (p.clear === true) {
    m.bgm = null;
    appendLog(`🎵 主持人清空了版图「${m.name}」BGM`);
    broadcastAll();
    sock.emit('toast', { msg: '已清空版图 BGM' });
    return;
  }
  const url = sanitizeText(p.url || '', 1000);
  if (!isHttpOrLocalUrl(url)) return sock.emit('error', { msg: 'BGM URL 必须以 http(s):// 或 /uploads/ 开头' });
  const title = sanitizeText(p.title || '背景音乐', 50) || '背景音乐';
  const volume = clamp01(p.volume, 0.5);
  m.bgm = { url, title, volume, ts: Date.now() };
  appendLog(`🎵 主持人设置版图「${m.name}」BGM: ${title}`);
  broadcastAll();
  sock.emit('toast', { msg: `版图 BGM 已设置 (切到「${m.name}」后自动播放)` });
}

// v2.4.18: 切换某玩家是否跟随版图
function hostToggleFollower(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const pid = payload?.playerId;
  if (!isPlayerId(pid)) return sock.emit('error', { msg: '玩家无效' });
  if (!Array.isArray(state.followers)) state.followers = PLAYER_IDS.slice();
  const idx = state.followers.indexOf(pid);
  if (idx >= 0) {
    state.followers.splice(idx, 1);
    appendLog(`🚫 主持人关闭了 ${roleLabel(pid)} 跟随版图`);
  } else {
    state.followers.push(pid);
    appendLog(`✅ 主持人开启了 ${roleLabel(pid)} 跟随版图`);
  }
  broadcastAll();
}

// v2.4.18: 设置某玩家在 activeMap 的出生点
function hostSetMapStartPiece(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '版图不存在' });
  const m = getActiveMap();
  if (!m) return sock.emit('error', { msg: '版图不存在' });
  const pid = payload?.playerId;
  if (!isPlayerId(pid)) return sock.emit('error', { msg: '玩家无效' });
  if (!m.startPieces) m.startPieces = { p1: { x: 0.5, y: 0.5 }, p2: { x: 0.5, y: 0.5 } };
  const x = clamp01(payload?.x, m.startPieces[pid].x);
  const y = clamp01(payload?.y, m.startPieces[pid].y);
  m.startPieces[pid] = { x, y };
  // 重置"首次进入"标记,这样玩家下次进入版图时会使用新的出生点
  if (!m._playerEverSet) m._playerEverSet = { p1: true, p2: true };
  m._playerEverSet[pid] = false;
  appendLog(`📍 主持人设置了 ${roleLabel(pid)} 在版图「${m.name}」的出生点 (${x.toFixed(2)}, ${y.toFixed(2)})`);
  broadcastAll();
  sock.emit('toast', { msg: '出生点已更新' });
}

// v2.4.18: 主持人在版图上点击位置打标记(pad 端显示一个箭头,几秒后自动消失)
function hostMarkPiece(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const x = clamp01(payload?.x, 0.5);
  const y = clamp01(payload?.y, 0.5);
  const color = sanitizeText(payload?.color || '#e74c3c', 20) || '#e74c3c';
  const durationMs = Math.max(500, Math.min(30000, parseInt(payload?.durationMs) || 3000));
  const id = newId();
  state.mapMarker = { id, x, y, color, ts: Date.now(), expiresAt: Date.now() + durationMs };
  appendLog(`📍 主持人在版图上标记了一个点`);
  setTimeout(() => {
    if (state.mapMarker && state.mapMarker.id === id) {
      state.mapMarker = null;
      broadcastAll();
    }
  }, durationMs + 100);
  broadcastAll();
}

// 把指定玩家移动到指定版图(可指定起始位置)
function hostMovePlayerToMap(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const pid = payload?.playerId;
  if (!isPlayerId(pid)) return sock.emit('error', { msg: '玩家无效' });
  const m = getMapById(payload?.mapId);
  if (!m) return sock.emit('error', { msg: '版图不存在' });
  state.playerMap[pid] = m.id;
  // 重置该玩家在目标版图上的位置
  if (!m.pieces[pid]) {
    m.pieces[pid] = { x: 0.5, y: 0.5, color: PLAYER_COLORS[pid].color, label: PLAYER_COLORS[pid].icon + PLAYER_COLORS[pid].label };
  }
  // 支持指定起始位置
  if (Number.isFinite(parseFloat(payload?.x))) m.pieces[pid].x = clamp01(payload.x, m.pieces[pid].x);
  if (Number.isFinite(parseFloat(payload?.y))) m.pieces[pid].y = clamp01(payload.y, m.pieces[pid].y);
  appendLog(`🧭 主持人将 ${roleLabel(pid)} 移到了版图「${m.name}」`);
  broadcastAll();
  sock.emit('toast', { msg: `${roleLabel(pid)} → ${m.name}` });
}

// ---------- 事件触发 (event 类型) ----------
// v2.4: 事件 = 媒体(图/文/视频/音频) + 效果(HP/MP/SAN) + 切版图
//  - 媒体播放:
//      * 图/文:主持人控制 durationMs
//      * 视频/音频:由文件长度决定
//  - 效果:应用到当前回合玩家(或指定 player 字段)
//  - 切版图:可指定 switchMapId 和 switchPlayer
function playerTriggerEvent(sock, payload) {
  const role = getSocketRole(sock);
  if (!isPlayerId(role)) return sock.emit('error', { msg: '无权操作' });
  const myMap = getPlayerMap(role);
  if (!myMap) return sock.emit('error', { msg: '所在版图不存在' });
  const ev = myMap.items.find(it => it.id === payload?.itemId && it.type === 'event');
  if (!ev) return sock.emit('error', { msg: '事件不存在' });
  // target 限制
  if (isPlayerId(ev.target) && ev.target !== role) {
    return sock.emit('error', { msg: `这个事件是给 ${roleLabel(ev.target)} 的` });
  }
  if (ev.target === 'pad' && state.turn.current !== role) return sock.emit('error', { msg: `现在是 ${roleLabel(state.turn.current)} 的回合` });
  // 应用效果(默认作用于当前触发玩家)
  const targetPlayer = (payload && payload.targetPlayer) || role;
  const c = state.characters[targetPlayer];
  if (c) {
    if (ev.effects && typeof ev.effects === 'object') {
      for (const k of ['hp', 'mp', 'san']) {
        const delta = parseInt(ev.effects[k]);
        if (Number.isFinite(delta) && delta !== 0) {
          const stat = c[k];
          if (stat && Number.isFinite(stat.max)) {
            const before = stat.current;
            stat.current = Math.max(0, Math.min(stat.max, stat.current + delta));
            appendLog(`⚡ 事件「${ev.title}」让 ${roleLabel(targetPlayer)} ${k.toUpperCase()} ${delta > 0 ? '+' : ''}${delta} (${before} → ${stat.current})`);
          }
        }
      }
    }
  }
  // v2.4.26: 事件给到的信息(任何类型)都进入 pad 公开信息流
  // 但 videoUrl/audioUrl 不放在 feedItem 中(已在高亮弹窗播放,避免重复)
  // from=role 标记为触发玩家(让信息流显示玩家头像)
  if (ev.body || ev.imageUrl || ev.audioUrl || ev.videoUrl) {
    const feedItem = buildContentItem({
      type: 'clue',
      title: ev.title || '事件',
      body: ev.body || '',
      imageUrl: ev.imageUrl || ''
      // v2.4.26: 视频/音频不在信息流中重复显示(高亮弹窗已经放过)
    });
    feedItem.from = role;  // v2.4.24: 标记为触发玩家(让信息流显示玩家头像)
    state.padFeed.unshift(feedItem);
    if (state.padFeed.length > 30) state.padFeed.length = 30;
  }
  // 切版图(可选)
  if (ev.switchMapId) {
    const targetMap = getMapById(ev.switchMapId);
    if (targetMap) {
      const switchTo = ev.switchPlayer || targetPlayer;
      // v2.4.32: 通用化 - 支持 p1~p6
      if (isPlayerId(switchTo)) {
        state.playerMap[switchTo] = targetMap.id;
        appendLog(`🗺️ 事件「${ev.title}」将 ${roleLabel(switchTo)} 传送到了「${targetMap.name}」`);
      }
    }
  }
  // v2.4.22: 事件触发后立即从版图移除(用户反馈"打开后图标应消失")
  // 媒体(视频/音频/图片)仍然通过 padHighlight 推给 pad 端播放
  const evIdx = myMap.items.findIndex(it => it.id === ev.id);
  if (evIdx >= 0) {
    myMap.items.splice(evIdx, 1);
    appendLog(`🧹 事件「${ev.title}」已从「${myMap.name}」移除(已触发)`);
  }
  appendLog(`❓ ${roleLabel(role)} 触发了事件「${ev.title}」`);
  // pad 端大屏高亮
  // 媒体驱动:视频/音频 → durationMs=0(客户端 ended 时关)
  // 图/文 → durationMs(主持人控制)
  const hasMedia = !!(ev.videoUrl || ev.audioUrl);
  const durationMs = hasMedia ? 0 : (parseInt(ev.durationMs) || 5000);
  setPadHighlight({
    type: 'event',
    title: ev.title || '?',
    body: ev.body || '',
    imageUrl: ev.imageUrl || '',
    audioUrl: ev.audioUrl || '',
    videoUrl: ev.videoUrl || '',
    from: 'event:' + ev.id,
    durationMs,
    effects: ev.effects || null,
    switchMapId: ev.switchMapId || null,
    targetPlayer,
    ts: Date.now()
  }, durationMs);
  broadcastAll();
  sock.emit('toast', { msg: `触发事件: ${ev.title}` });
}

// 主持人可手动触发事件(给任意玩家)
function hostTriggerEvent(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const m = getActiveMap();
  if (!m) return sock.emit('error', { msg: '版图不存在' });
  const ev = m.items.find(it => it.id === payload?.itemId && it.type === 'event');
  if (!ev) return sock.emit('error', { msg: '事件不存在' });
  const targetPlayer = payload?.targetPlayer || state.turn.current;
  if (!isPlayerId(targetPlayer)) return sock.emit('error', { msg: '目标玩家无效' });
  // 应用效果
  if (ev.effects && typeof ev.effects === 'object') {
    const c = state.characters[targetPlayer];
    for (const k of ['hp', 'mp', 'san']) {
      const delta = parseInt(ev.effects[k]);
      if (Number.isFinite(delta) && delta !== 0) {
        const stat = c[k];
        if (stat && Number.isFinite(stat.max)) {
          const before = stat.current;
          stat.current = Math.max(0, Math.min(stat.max, stat.current + delta));
          appendLog(`⚡ (KP)事件「${ev.title}」让 ${roleLabel(targetPlayer)} ${k.toUpperCase()} ${delta > 0 ? '+' : ''}${delta} (${before} → ${stat.current})`);
        }
      }
    }
  }
  // v2.4.26: 事件给到的信息(任何类型)都进入 pad 公开信息流,from='kp'
  if (ev.body || ev.imageUrl || ev.audioUrl || ev.videoUrl) {
    const feedItem = buildContentItem({
      type: 'clue',
      title: ev.title || '事件',
      body: ev.body || '',
      imageUrl: ev.imageUrl || '',
      audioUrl: ev.audioUrl || '',
      videoUrl: ev.videoUrl || ''
    });
    feedItem.from = 'kp';  // v2.4.24: 标记为 KP 触发
    state.padFeed.unshift(feedItem);
    if (state.padFeed.length > 30) state.padFeed.length = 30;
  }
  // 切版图
  if (ev.switchMapId) {
    const targetMap = getMapById(ev.switchMapId);
    if (targetMap) {
      const switchTo = ev.switchPlayer || targetPlayer;
      // v2.4.32: 通用化 - 支持 p1~p6
      if (isPlayerId(switchTo)) {
        state.playerMap[switchTo] = targetMap.id;
      }
    }
  }
  // v2.4.22: 事件触发后立即从版图移除
  const evIdx = m.items.findIndex(it => it.id === ev.id);
  if (evIdx >= 0) {
    m.items.splice(evIdx, 1);
    appendLog(`🧹 事件「${ev.title}」已从「${m.name}」移除(KP 触发)`);
  }
  let highlightDurationMs = parseInt(ev.durationMs) || 0;
  if (ev.videoUrl || ev.audioUrl) highlightDurationMs = 0;
  setPadHighlight({
    type: 'event',
    title: ev.title || '?',
    body: ev.body || '',
    imageUrl: ev.imageUrl || '',
    audioUrl: ev.audioUrl || '',
    videoUrl: ev.videoUrl || '',
    from: 'event:' + ev.id,
    durationMs: highlightDurationMs,
    effects: ev.effects || null,
    switchMapId: ev.switchMapId || null,
    targetPlayer,
    ts: Date.now()
  }, highlightDurationMs > 0 ? highlightDurationMs : 600000);
  appendLog(`❓ (KP) 主持人触发了事件「${ev.title}」(目标 ${roleLabel(targetPlayer)})`);
  broadcastAll();
}

// ---------- 保存 / 导出 / 导入 ----------
// 导出当前所有版图(完整状态: items/npcs/pieces + 玩家所在版图 + 棋子在每版图的位置)
function hostExportMaps(sock) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const data = {
    version: '2.4.18',
    exportedAt: new Date().toISOString(),
    scriptTitle: state.scriptTitle,
    maps: state.maps.map(m => ({
      id: m.id, name: m.name, url: m.url,
      bgm: m.bgm ? { ...m.bgm } : null,
      startPieces: { p1: { ...(m.startPieces?.p1 || { x: 0.5, y: 0.5 }) }, p2: { ...(m.startPieces?.p2 || { x: 0.5, y: 0.5 }) } },
      items: m.items.map(x => ({ ...x })),
      npcs: m.npcs.map(x => stripNpc(x)),
      pieces: { p1: { ...m.pieces.p1 }, p2: { ...m.pieces.p2 } }
    })),
    activeMapId: state.activeMapId,
    playerMap: { ...state.playerMap }
  };
  const json = JSON.stringify(data, null, 2);
  sock.emit('maps:exported', { json, fileName: `trpg-maps-${Date.now()}.json` });
  appendLog('💾 主持人导出版图数据');
  sock.emit('toast', { msg: '版图已导出(JSON 已下载)' });
}

function hostImportMaps(sock, payload) {
  if (getSocketRole(sock) !== 'host') return sock.emit('error', { msg: '无权操作' });
  const data = payload?.data;
  if (!data || !Array.isArray(data.maps)) {
    return sock.emit('error', { msg: '数据格式无效(需要 {maps: [...]})' });
  }
  if (data.maps.length === 0) return sock.emit('error', { msg: '至少需要一个版图' });
  // 验证每个版图必需字段
  for (const m of data.maps) {
    if (!m.id || !m.name) return sock.emit('error', { msg: '版图缺 id 或 name' });
    if (!Array.isArray(m.items)) m.items = [];
    if (!Array.isArray(m.npcs)) m.npcs = [];
    if (!m.pieces) m.pieces = { p1: { x: 0.5, y: 0.5, color: '#e74c3c' }, p2: { x: 0.5, y: 0.5, color: '#3498db' } };
    if (!m.startPieces) m.startPieces = { p1: { x: 0.5, y: 0.5 }, p2: { x: 0.5, y: 0.5 } };
    for (const n of m.npcs) if (!Array.isArray(n.dialogues)) n.dialogues = [];
  }
  // 替换
  state.maps = data.maps.map(m => ({
    id: m.id, name: m.name, url: m.url || null,
    bgm: m.bgm ? { ...m.bgm } : null,
    startPieces: { p1: { ...(m.startPieces?.p1 || { x: 0.5, y: 0.5 }) }, p2: { ...(m.startPieces?.p2 || { x: 0.5, y: 0.5 }) } },
    items: m.items.map(x => ({ ...x })),
    npcs: m.npcs.map(x => stripNpc(x)),
    pieces: {
      p1: { ...m.pieces.p1 },
      p2: { ...m.pieces.p2 }
    }
  }));
  state.activeMapId = data.activeMapId && state.maps.find(x => x.id === data.activeMapId)
    ? data.activeMapId
    : state.maps[0].id;
  // v2.4.32: 通用化 - 所有玩家
  for (const pid of PLAYER_IDS) {
    state.playerMap[pid] = (data.playerMap && data.playerMap[pid] && state.maps.find(x => x.id === data.playerMap[pid]))
      ? data.playerMap[pid]
      : state.maps[0].id;
  }
  if (typeof data.scriptTitle === 'string' && data.scriptTitle.trim()) {
    state.scriptTitle = data.scriptTitle.trim();
  }
  // 重置首次进入标记(导入后玩家需要重新应用出生点)
  for (const m of state.maps) {
    m._playerEverSet = { p1: false, p2: false };
  }
  appendLog(`📥 主持人导入了 ${state.maps.length} 个版图`);
  broadcastAll();
  sock.emit('toast', { msg: `已导入 ${state.maps.length} 个版图` });
}

// ---------- 启动 ----------
const app = express();
const server = http.createServer(app);
// v2.4.37: 长心跳(60s 超时,25s 间隔)+ 增加升级超时(应对慢网/WiFi切换)
//   - 之前 60s 已能容忍普通息屏;v2.4.37 进一步放宽 upgrade 等待时间,防止 iOS Safari 锁屏后回来
//   - 允许 WebSocket 空闲更久,避免误踢
const io = new Server(server, {
  cors: { origin: '*' },
  pingInterval: 25000,
  pingTimeout: 60000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 8e6
});

// v2.4.37: 给静态资源加 no-cache,避免浏览器缓存老版本 client.js 导致"未连接"假象
app.use((req, res, next) => {
  if (req.path.endsWith('.js') || req.path.endsWith('.html') || req.path.endsWith('.css')) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});
// v2.4.41: 解析 JSON body(给 /api/ai/image 用)
app.use(express.json({ limit: '4mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));
app.get('/healthz', (req, res) => res.json({ ok: true, version: GAME_VERSION }));

// 文件上传接口
app.post('/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.log('[upload] error:', err.message);
      return res.status(400).json({ error: err.message || '上传失败' });
    }
    if (!req.file) return res.status(400).json({ error: '未收到文件' });
    const url = '/uploads/' + req.file.filename;
    console.log(`[upload] ${req.file.originalname} -> ${url} (${req.file.size} bytes)`);
    res.json({ url, size: req.file.size, mimetype: req.file.mimetype, originalName: req.file.originalname });
  });
});

// v2.4.41: AI 图片生成 HTTP 端点
//   body: { prompt: string, size?: '1024x768'|'512x512'|..., translate?: bool }
//   - 中文 prompt 自动调 agnes-2.0-flash 翻译成英文(更稳定)
//   - 生成的图片下载到 uploads/ai-XXX.png,返回本地 URL(不依赖外网,离线后仍可用)
app.post('/api/ai/image', async (req, res) => {
  if (!AGNES_AVAILABLE) {
    return res.status(503).json({
      error: '未配置 AGNES_API_KEY',
      hint: '设置环境变量 AGNES_API_KEY=sk-... 或在项目根目录创建 config.json: {"agnesApiKey":"sk-..."}'
    });
  }
  const { prompt, size = '1024x768', translate = true } = req.body || {};
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'prompt 不能为空' });
  }
  if (!/^\d{3,4}x\d{3,4}$/.test(size)) {
    return res.status(400).json({ error: 'size 格式应为 1024x768' });
  }
  let originalPrompt = prompt.trim();
  let finalPrompt = originalPrompt;
  let translatedFrom = null;
  let translateError = null;
  try {
    // 1) 翻译(中文 → 英文) - 失败回退到原文,不中断生成
    if (translate && /[一-龥]/.test(finalPrompt)) {
      try {
        // v2.4.41: 用清晰的英文指令,Agnes 不会用非英文 system prompt 理解任务
        const sysPrompt = 'You are a translator. The user will give a Chinese image description. Output ONLY the English translation as a single concise image-generation prompt. Do not reply, do not explain, do not apologize. Just translate.';
        const translated = await agnesText(sysPrompt, finalPrompt);
        // 过滤掉 apologetic / 询问类回答
        const isApology = /^(I'?m sorry|Unfortunately|However|Hello|Sure|OK|Okay|As an AI|AI assistant|I can|Yes|No|Hi|Thank you)/i.test(translated);
        if (translated && !isApology && translated.length >= 5) {
          finalPrompt = translated;
          translatedFrom = originalPrompt;
        } else {
          console.log('[ai-image] translate returned unhelpful response, fallback to original:', translated.slice(0, 80));
        }
      } catch (te) {
        translateError = te.message;
        console.warn('[ai-image] translate failed, fallback to original:', te.message);
      }
    }
    // 2) 生成图片
    const imgResult = await agnesImage(finalPrompt, size);
    // 3) 保存到本地 uploads/
    let local;
    if (imgResult.buffer) {
      // base64 内嵌,直接写入
      const ext = imgResult.ext || 'png';
      const filename = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      fs.writeFileSync(path.join(UPLOADS_DIR, filename), imgResult.buffer);
      local = { url: '/uploads/' + filename, size: imgResult.buffer.length, filename };
    } else {
      local = await downloadImageToUploads(imgResult.remoteUrl);
    }
    console.log(`[ai-image] ${local.url} (${local.size} bytes, ${size}) prompt="${finalPrompt.slice(0, 80)}"${translateError ? ' (translate failed)' : ''}`);
    res.json({
      url: local.url,
      size: local.size,
      prompt: finalPrompt,
      originalPrompt: translatedFrom,
      translateError,
      model: AGNES_MODEL_IMG
    });
  } catch (e) {
    console.error('[ai-image] error:', e.message);
    res.status(500).json({ error: e.message || 'AI 图片生成失败' });
  }
});

// v2.4.41: AI 状态查询(前端用,显示"AI 生成"按钮是否可用)
app.get('/api/ai/status', (req, res) => {
  res.json({
    available: AGNES_AVAILABLE,
    model: AGNES_MODEL_IMG,
    textModel: AGNES_MODEL_TEXT
  });
});

io.on('connection', (sock) => {
  console.log(`[+] ${sock.id}`);
  sock.emit('status', { online: { ...state.online } });

  sock.on('join', p => onJoin(sock, p));
  sock.on('leave', () => onDisconnect(sock));
  // v2.4.37: 客户端心跳(可选,纯 ping-pong,不修改状态)
  sock.on('client:heartbeat', p => { sock.emit('server:heartbeat', { ts: Date.now(), echo: p?.ts || 0 }); });
  sock.on('host:setMap', p => hostSetMap(sock, p));
  sock.on('host:setScriptTitle', p => hostSetScriptTitle(sock, p));
  sock.on('host:addMapItem', p => hostAddMapItem(sock, p));
  sock.on('host:moveMapItem', p => hostMoveMapItem(sock, p));
  sock.on('host:scaleMapItem', p => hostScaleMapItem(sock, p));        // v2.0
  sock.on('host:deleteMapItem', p => hostDeleteMapItem(sock, p));
  // v2.4.27: 主持人更新版图项属性(switchMapId)
  sock.on('host:updateMapItem', p => hostUpdateMapItem(sock, p));
  // v2.4.28: 主持人获取图库
  sock.on('host:listImageLibrary', p => hostListImageLibrary(sock, p));
  sock.on('host:sendToPad', p => hostSendToPad(sock, p));
  sock.on('host:sendToPlayer', p => hostSendToPlayer(sock, p));
  sock.on('host:sendClue', p => hostSendClue(sock, p));
  sock.on('host:pinClueAsCard', p => hostPinClueAsCard(sock, p));      // v2.0
  sock.on('host:setBgm', p => hostSetBgm(sock, p));
  sock.on('host:stopBgm', () => hostStopBgm(sock));
  sock.on('host:pauseBgm', () => hostPauseBgm(sock));
  sock.on('host:resumeBgm', () => hostResumeBgm(sock));
  sock.on('host:setBgmVolume', p => hostSetBgmVolume(sock, p));
  sock.on('host:pinFeed', p => hostPinFeed(sock, p));
  sock.on('host:clearAll', () => hostClearAll(sock));
  sock.on('host:shutdown', () => hostShutdown(sock));
  sock.on('host:restart', () => hostRestart(sock));
  sock.on('host:log', p => hostLog(sock, p));
  // v2.0 新事件
  sock.on('host:nextTurn', () => hostNextTurn(sock));
  sock.on('host:prevTurn', () => hostPrevTurn(sock));
  sock.on('host:resetTurn', () => hostResetTurn(sock));
  // v2.4.34: 设置本局玩家人数
  sock.on('host:setMaxPlayers', p => hostSetMaxPlayers(sock, p));
  sock.on('host:addNpc', p => hostAddNpc(sock, p));
  sock.on('host:updateNpc', p => hostUpdateNpc(sock, p));
  sock.on('host:moveNpc', p => hostMoveNpc(sock, p));
  sock.on('host:deleteNpc', p => hostDeleteNpc(sock, p));
  sock.on('host:addNpcDialogue', p => hostAddNpcDialogue(sock, p));
  sock.on('host:deleteNpcDialogue', p => hostDeleteNpcDialogue(sock, p));
  // v2.4.45: NPC AI 对话
  sock.on('player:chatNpc', p => playerChatNpc(sock, p));
  sock.on('player:getNpcChatHistory', p => playerGetNpcChatHistory(sock, p));
  sock.on('host:clearNpcChat', p => hostClearNpcChat(sock, p));
  // v2.4.46: 主持人干预 + 获取对话历史
  sock.on('host:interveneNpc', p => hostInterveneNpc(sock, p));
  sock.on('host:getNpcChatLog', p => hostGetNpcChatLog(sock, p));
  // v2.4.47: NPC 商品 + 主持人控制玩家属性/移动
  sock.on('host:addNpcShopItem', p => hostAddNpcShopItem(sock, p));
  sock.on('host:deleteNpcShopItem', p => hostDeleteNpcShopItem(sock, p));
  sock.on('player:buyNpcItem', p => playerBuyNpcItem(sock, p));
  sock.on('host:controlPlayerStats', p => hostControlPlayerStats(sock, p));
  sock.on('host:controlMovePlayer', p => hostControlMovePlayer(sock, p));
  sock.on('host:setScript', p => hostSetScript(sock, p));
  sock.on('host:rollDice', p => hostRollDice(sock, p));
  sock.on('host:toggleDiceVisible', p => hostToggleDiceVisible(sock, p));
  sock.on('host:setDicePublic', p => hostSetDicePublic(sock, p));          // v2.1
  sock.on('host:deductHp', p => hostDeductHp(sock, p));
  // v2.4.20: HP/MP/SAN 通用增减
  sock.on('host:adjustStat', p => hostAdjustStat(sock, p));
  sock.on('host:addToPlayerBackpack', p => hostAddToPlayerBackpack(sock, p)); // v2.1
  // v2.4 新增:多版图系统
  sock.on('host:addMap', p => hostAddMap(sock, p));
  sock.on('host:deleteMap', p => hostDeleteMap(sock, p));
  sock.on('host:renameMap', p => hostRenameMap(sock, p));
  sock.on('host:switchMap', p => hostSwitchMap(sock, p));
  sock.on('host:setMapUrl', p => hostSetMapUrl(sock, p));
  sock.on('host:setMapBgm', p => hostSetMapBgm(sock, p));
  sock.on('host:toggleFollower', p => hostToggleFollower(sock, p));
  sock.on('host:setMapStartPiece', p => hostSetMapStartPiece(sock, p));
  sock.on('host:markPiece', p => hostMarkPiece(sock, p));
  sock.on('host:movePlayerToMap', p => hostMovePlayerToMap(sock, p));
  sock.on('host:triggerEvent', p => hostTriggerEvent(sock, p));
  sock.on('host:exportMaps', () => hostExportMaps(sock));
  sock.on('host:importMaps', p => hostImportMaps(sock, p));
  // v2.4.19: 玩家起始属性 + 私聊
  sock.on('host:setPlayerInit', p => hostSetPlayerInit(sock, p));
  // v2.4.31: 主持人调整玩家金币
  sock.on('host:adjustPlayerGold', p => hostAdjustPlayerGold(sock, p));
  sock.on('host:chatToPlayer', p => hostChatToPlayer(sock, p));
  sock.on('host:clearChat', p => hostClearChat(sock, p));

  sock.on('pad:movePiece', p => padMovePiece(sock, p));
  sock.on('pad:closeFeed', p => padCloseFeed(sock, p));
  sock.on('pad:closeHighlight', () => padCloseHighlight(sock));
  // v2.4.20: 媒体播完后从版图移除事件
  sock.on('pad:eventEnded', p => padEventEnded(sock, p));
  sock.on('pad:nextTurn', () => padNextTurn(sock));                     // v2.0
  sock.on('pad:nextNpcDialogue', p => padNextNpcDialogue(sock, p));     // v2.4.18
  sock.on('pad:closeNpcDialog', () => padCloseNpcDialog(sock));         // v2.4.18
  sock.on('pad:pushFeed', p => padPushFeed(sock, p));                   // v2.4.23

  sock.on('player:pushToPad', p => playerPushToPad(sock, p));           // 保留兼容,但 UI 上不再提供
  sock.on('player:rollDice', p => playerRollDice(sock, p));
  sock.on('player:setCharacter', p => playerSetCharacter(sock, p));     // v2.0
  // v2.4.29: 角色模板(任何端可查;仅玩家可应用)
  sock.on('host:listCharacterTemplates', p => listCharacterTemplates(sock, p));
  sock.on('player:listCharacterTemplates', p => listCharacterTemplates(sock, p));
  sock.on('player:applyCharacterTemplate', p => playerApplyCharacterTemplate(sock, p));
  sock.on('player:setNote', p => playerSetNote(sock, p));               // v2.0
  sock.on('player:pickupClue', p => playerPickupClue(sock, p));         // v2.0
  sock.on('player:discardClue', p => playerDiscardClue(sock, p));       // v2.0
  sock.on('player:tradeItem', p => playerTradeItem(sock, p));           // v2.3
  // v2.4.34: 玩家间交易扩展(卖、换、赠金币、给看)
  sock.on('player:tradeItemForGold', p => playerTradeItemForGold(sock, p));
  sock.on('player:tradeItemForItem', p => playerTradeItemForItem(sock, p));
  sock.on('player:tradeGold', p => playerTradeGold(sock, p));
  sock.on('player:showClue', p => playerShowClue(sock, p));
  sock.on('player:discardViewed', p => playerDiscardViewed(sock, p));
  // v2.4.35: 物换物时,获取对方背包(只返回标题和id,隐藏 body 等)
  sock.on('player:getOtherBag', p => playerGetOtherBag(sock, p));
  sock.on('player:sendClueToPlayer', p => playerSendClueToPlayer(sock, p));  // v2.0
  sock.on('player:npcInteract', p => playerNpcInteract(sock, p));       // v2.0
  sock.on('player:triggerEvent', p => playerTriggerEvent(sock, p));      // v2.4
  // v2.4.27: 玩家点击版图上的 item(支持图片配 switchMapId 切版图)
  sock.on('player:clickMapItem', p => playerClickMapItem(sock, p));
  // v2.4.19: 玩家 → 主持人 私聊
  sock.on('player:chatToHost', p => playerChatToHost(sock, p));

  sock.on('disconnect', (reason) => {
    console.log(`[-] ${sock.id} reason=${reason}`);
    onDisconnect(sock);
  });
});

// v2.4.32: 玩家进入房间的端点 - 返回带角色参数的 URL(给前端拼二维码用)
//   模式 1: /join              → 手机扫码进入,客户端显示角色选择页
//   模式 2: /join?role=p3      → 强制进入 p3 位置(用于特殊链接)
//   模式 3: /                  → 主持人/pad 主页(显示完整功能选择)
app.get('/join', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// v2.4.32: 二维码 API - 返回 SVG 格式的二维码(可直接放在 <img> 里)
//   GET /api/qrcode?text=<URL>&size=<px>
//   text 缺省:当前服务地址 + /join
const QRCode = require('qrcode');
app.get('/api/qrcode', async (req, res) => {
  const size = Math.max(120, Math.min(800, parseInt(req.query.size) || 240));
  // v2.4.44: 强制用 LAN_IP,不能用 req.headers.host(主持人可能用 localhost 打开,手机访问不到)
  const text = req.query.text || ('http://' + (LAN_IP || 'localhost') + ':' + PORT + '/join');
  try {
    const svg = await QRCode.toString(text, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      width: size,
      margin: 1,
      color: { dark: '#1a1a1a', light: '#ffffff' }
    });
    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'no-store');
    res.send(svg);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// v2.4.32: 服务端信息 - 给客户端(也包括前端 mock)动态获取服务地址
app.get('/api/info', (req, res) => {
  // v2.4.44: 优先用 LAN_IP,保证手机扫码能访问(不能用 req.headers.host,因为主持人可能用 localhost 打开)
  const url = 'http://' + (LAN_IP || 'localhost') + ':' + PORT;
  res.json({
    version: GAME_VERSION,
    maxPlayers: state.maxPlayers || MAX_PLAYERS,    // v2.4.34: 本局玩家数
    hardMaxPlayers: MAX_PLAYERS,                    // 硬上限(系统支持)
    playerIds: PLAYER_IDS,
    activePlayerIds: getActivePlayerIds(),          // v2.4.34: 本局激活玩家
    serverUrl: url,
    joinUrl: url + '/join',
    // v2.4.33: 返回所有可访问 IP(便于手动输入兑底)
    addresses: getAllAccessUrls(req)
  });
});

// v2.4.32: 探测本机的可访问 IP(优先 LAN IP,用于二维码显示)
function getServerUrl(req) {
  // v2.4.32: 优先用请求 host(可能是反向代理或 LAN IP)
  if (req && req.headers && req.headers.host) {
    const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0];
    return proto + '://' + req.headers.host;
  }
  // 回退到启动时探测的 LAN IP
  return 'http://' + (LAN_IP || 'localhost') + ':' + PORT;
}
// 启动时探测 LAN IP
const os = require('os');
let LAN_IP = null;
(function detectLanIp() {
  try {
    const ifaces = os.networkInterfaces();
    // v2.4.44: 优先选 192.168.x.x(物理网卡),避免选到 WSL/Hyper-V 虚拟网卡(172.x.x.x)
    const candidates = [];
    for (const name of Object.keys(ifaces)) {
      for (const i of ifaces[name]) {
        if (i.family === 'IPv4' && !i.internal) {
          candidates.push({ addr: i.address, name });
        }
      }
    }
    // 优先级:192.168 > 10. > 172. > 其他
    const prefer = candidates.find(c => c.addr.startsWith('192.168.'))
      || candidates.find(c => c.addr.startsWith('10.'))
      || candidates.find(c => c.addr.startsWith('172.'))
      || candidates[0];
    if (prefer) LAN_IP = prefer.addr;
  } catch (e) { /* ignore */ }
})();

// v2.4.33: 返回所有可访问 IP(用于扫码弹窗的"手动输入 IP"列表)
function getAllAccessUrls(req) {
  const port = (req && req.headers && req.headers.host && req.headers.host.includes(':'))
    ? req.headers.host.split(':')[1]
    : String(PORT);
  const addrs = [];
  // localhost
  addrs.push('localhost:' + port);
  // 启动时探测的 LAN IP
  if (LAN_IP) addrs.push(LAN_IP + ':' + port);
  // v2.4.33: 探测所有 IPv4 接口(给多网卡机器)
  try {
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
      for (const i of ifaces[name] || []) {
        if (i.family === 'IPv4' && !i.internal) {
          const a = i.address + ':' + port;
          if (addrs.indexOf(a) === -1) addrs.push(a);
        }
      }
    }
  } catch (e) { /* ignore */ }
  return addrs;
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`TRPG Desk v${GAME_VERSION} 端口 ${PORT}`);
  console.log(`  本机访问: http://localhost:${PORT}/`);
  if (LAN_IP) console.log(`  局域网访问: http://${LAN_IP}:${PORT}/  ← 玩家用此地址加入`);
  console.log(`  玩家扫码加入: http://${LAN_IP || 'localhost'}:${PORT}/join`);
});
