/* =====================================================================
   Memora — 应用逻辑
   原生 JS SPA（hash 路由） + API 对接 + Markdown 渲染
   ===================================================================== */

/* ============ 配置 ============ */
const API_BASE = 'http://localhost:3000';
const USER_ID = 'demo-user';

// 运行模式：'auto' 优先在线，失败回退静态；'static' 强制纯静态
const RUN_MODE = (() => {
  const url = new URL(location.href);
  const param = url.searchParams.get('mode');
  if (param === 'static') return 'static';
  if (param === 'online') return 'online';
  return 'auto';
})();
let _onlineAvailable = null; // null=未知 true=可用 false=不可用

const SCENE_TYPES = {
  client:    { emoji: '🤝', name: '客户拜访', gradient: 'linear-gradient(135deg, #6366f1, #a855f7)', glow: 'rgba(99,102,241,.22)', shadow: 'rgba(99,102,241,.4)' },
  project:   { emoji: '📋', name: '项目会议', gradient: 'linear-gradient(135deg, #a855f7, #ec4899)', glow: 'rgba(168,85,247,.22)', shadow: 'rgba(168,85,247,.4)' },
  interview: { emoji: '👤', name: '招聘面试', gradient: 'linear-gradient(135deg, #ec4899, #f59e0b)', glow: 'rgba(236,72,153,.22)', shadow: 'rgba(236,72,153,.4)' },
  study:     { emoji: '📚', name: '课程学习', gradient: 'linear-gradient(135deg, #10b981, #6366f1)', glow: 'rgba(16,185,129,.22)', shadow: 'rgba(16,185,129,.4)' },
  general:   { emoji: '💬', name: '通用沟通', gradient: 'linear-gradient(135deg, #64748b, #6366f1)', glow: 'rgba(100,116,139,.22)', shadow: 'rgba(100,116,139,.4)' },
};

const KNOWLEDGE_FILES = [
  { key: 'summary',      name: '场景摘要', emoji: '📝', desc: '跨录音核心摘要与时间线' },
  { key: 'decisions',    name: '决策追踪', emoji: '🎯', desc: '关键决策的演进记录' },
  { key: 'promises',     name: '承诺记录', emoji: '🤝', desc: '已兑现与未兑现承诺' },
  { key: 'conflicts',    name: '冲突检测', emoji: '⚡', desc: 'AI 发现的矛盾与异常' },
  { key: 'profiles',     name: '人物画像', emoji: '👤', desc: '参与者画像与关系网络' },
  { key: 'risk-trends',  name: '风险趋势', emoji: '📊', desc: '风险信号与趋势变化' },
];

const TABS = [
  { key: 'report',   name: '最新报告', icon: '📄' },
  { key: 'knowledge',name: '知识文件', icon: '🧠' },
  { key: 'history',  name: '历史报告', icon: '🕓' },
  { key: 'upload',   name: '上传录音', icon: '⬆️' },
];

/* ============ 状态 ============ */
const state = {
  scenes: null,        // 缓存场景列表
  loadingTimer: null,
  tabIndicator: { left: 0, width: 0 },
};

/* ============ 工具函数 ============ */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function timeAgo(iso) {
  if (!iso) return '从未';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} 天前`;
  return formatTime(iso).slice(0, 10);
}

function reportDateLabel(filename) {
  // 尝试从文件名提取日期，否则返回文件名
  const m = String(filename || '').match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return filename;
}

function inferSceneType(sceneId, info) {
  if (info?.sceneType && SCENE_TYPES[info.sceneType]) return info.sceneType;
  const id = String(sceneId || '').toLowerCase();
  for (const k of Object.keys(SCENE_TYPES)) {
    if (id.includes(k)) return k;
  }
  return 'general';
}

function sceneStyle(sceneType) {
  const t = SCENE_TYPES[sceneType] || SCENE_TYPES.general;
  return {
    gradient: t.gradient,
    glow: t.glow,
    shadow: t.shadow,
    style: `--scene-gradient:${t.gradient};--scene-glow:${t.glow};--scene-shadow:${t.shadow};`,
  };
}

/* ============ API 客户端（支持在线 + 静态双模式） ============ */
let _staticScenesCache = null; // 静态模式场景列表缓存
let _staticSceneDataCache = {}; // 静态模式单场景数据缓存
let _staticV2DataCache = {}; // 静态模式 v2 数据缓存（用户创建的场景用）

async function checkOnline() {
  if (RUN_MODE === 'static') return _onlineAvailable = false;
  if (_onlineAvailable !== null) return _onlineAvailable;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch(`${API_BASE}/health`, { signal: ctrl.signal });
    clearTimeout(t);
    _onlineAvailable = res.ok;
  } catch {
    _onlineAvailable = false;
  }
  return _onlineAvailable;
}

// 静态模式：优先从 window.MEMORA_DEMO_DATA 读取（写死在前端），fetch 作为兜底
const staticApi = {
  _getDemoData() {
    return window.MEMORA_DEMO_DATA || null;
  },
  _getDemoV1(type) {
    const d = this._getDemoData();
    return d?.v1?.[type] || null;
  },
  _getDemoV2(type) {
    const d = this._getDemoData();
    return d?.v2?.[type] || null;
  },
  async getScenes() {
    if (_staticScenesCache) return { scenes: _staticScenesCache };
    // 从写死的数据读取
    const d = this._getDemoData();
    if (d?.scenes) {
      _staticScenesCache = d.scenes;
      return { scenes: d.scenes };
    }
    throw new Error('演示数据未加载，请检查 demo-data.js 是否引入');
  },
  async getOverview(sceneId) {
    const data = await this._loadScene(sceneId);
    return data.overview;
  },
  async getReport(sceneId, reportName) {
    const data = await this._loadScene(sceneId);
    const content = data.reports[reportName];
    if (!content) throw new Error(`报告不存在: ${reportName}`);
    return { success: true, content };
  },
  async analyze(body) {
    const { sceneId, sceneType } = body || {};
    if (!sceneId) throw new Error('缺少 sceneId');
    // 获取当前场景数据，判断是第一次还是第二次上传
    const current = _staticSceneDataCache[sceneId] || await this._loadScene(sceneId);
    const isFirstUpload = !current.overview || !current.overview.reports || current.overview.reports.length === 0;
    const type = sceneType || current.sceneInfo?.sceneType || 'general';

    if (isFirstUpload) {
      // 第一次上传：从写死的 v1 数据读取
      const v1Data = this._getDemoV1(type);
      if (!v1Data) throw new Error(`没有 ${type} 类型的演示数据`);
      const newData = JSON.parse(JSON.stringify(v1Data));
      // 保留用户场景的元数据
      newData.sceneId = sceneId;
      newData.sceneInfo = newData.sceneInfo || {};
      newData.sceneInfo.sceneId = sceneId;
      newData.sceneInfo.sceneName = current.sceneInfo?.sceneName || sceneId;
      newData.sceneInfo.sceneType = type;
      newData.sceneInfo.recordingCount = 1;
      newData.sceneInfo.lastActivity = new Date().toISOString();
      _staticSceneDataCache[sceneId] = newData;
      // 更新场景列表中的 recordingCount
      if (_staticScenesCache) {
        const s = _staticScenesCache.find(x => x.sceneId === sceneId);
        if (s) { s.recordingCount = 1; s.lastActivity = newData.sceneInfo.lastActivity; }
      }
      await new Promise(r => setTimeout(r, 4500));
      return { success: true, reportName: newData.overview.reports[0] };
    }

    // 第二次上传：从写死的 v2 数据读取
    let v2 = this._getDemoV2(type);
    if (!v2 && _staticV2DataCache[sceneId]) {
      v2 = JSON.parse(JSON.stringify(_staticV2DataCache[sceneId]));
    }
    if (!v2) throw new Error('该场景暂无第二份演示录音数据');
    // 合并到缓存：overview 用 v2 的最新状态；reports 合并 v1+v2 两份报告
    const v1 = _staticSceneDataCache[sceneId] || await this._loadScene(sceneId);
    _staticSceneDataCache[sceneId] = {
      ...v2,
      sceneId,
      sceneInfo: v1.sceneInfo,
      overview: v2.overview,
      reports: { ...v1.reports, ...v2.reports },
    };
    // 更新场景列表
    if (_staticScenesCache) {
      const s = _staticScenesCache.find(x => x.sceneId === sceneId);
      if (s) { s.recordingCount = 2; s.lastActivity = new Date().toISOString(); }
    }
    await new Promise(r => setTimeout(r, 4500));
    return { success: true, reportName: v2.overview.reports[0] };
  },
  async createScene(body) {
    const { sceneId, sceneName, sceneType } = body || {};
    if (!sceneId || !sceneName) throw new Error('参数缺失');
    const now = new Date().toISOString();
    const type = sceneType || 'general';
    // 创建空场景：无报告、无知识文件内容
    const emptyData = {
      sceneId,
      sceneInfo: {
        sceneId,
        sceneName,
        sceneType: type,
        userId: USER_ID,
        createdAt: now,
        recordingCount: 0,
        lastActivity: now,
      },
      overview: {
        summary: '',
        decisions: '',
        promises: '',
        conflicts: '',
        profiles: '',
        riskTrends: '',
        recordingCount: 0,
        reports: [],
      },
      recordingCount: 0,
      reports: {},
    };
    _staticSceneDataCache[sceneId] = emptyData;
    // 预加载 v2 数据缓存（从写死的数据读取）
    const v2Demo = this._getDemoV2(type);
    if (v2Demo) {
      const newV2 = JSON.parse(JSON.stringify(v2Demo));
      newV2.sceneId = sceneId;
      newV2.sceneInfo = newV2.sceneInfo || {};
      newV2.sceneInfo.sceneId = sceneId;
      newV2.sceneInfo.sceneName = sceneName;
      newV2.sceneInfo.sceneType = type;
      _staticV2DataCache[sceneId] = newV2;
    }
    // 加入场景列表缓存
    if (_staticScenesCache) {
      _staticScenesCache.push({
        sceneId,
        sceneName,
        sceneType: type,
        userId: USER_ID,
        createdAt: now,
        recordingCount: 0,
        lastActivity: now,
      });
    }
    await new Promise(r => setTimeout(r, 1200));
    return { success: true, sceneId };
  },
  async _loadScene(sceneId) {
    if (_staticSceneDataCache[sceneId]) return _staticSceneDataCache[sceneId];
    // 判断是否是 demo 场景（sceneId 以 "demo-" 开头）
    const demoMatch = String(sceneId).match(/^demo-(client|project|interview|study|general)$/);
    if (demoMatch) {
      const type = demoMatch[1];
      const v1Data = this._getDemoV1(type);
      if (v1Data) {
        // 构造完整的场景数据
        const sceneInfo = (window.MEMORA_DEMO_DATA?.scenes || []).find(s => s.sceneId === sceneId) || {};
        const data = {
          sceneId,
          sceneInfo,
          overview: v1Data.overview,
          recordingCount: v1Data.overview.recordingCount || 1,
          reports: v1Data.reports,
        };
        _staticSceneDataCache[sceneId] = data;
        return data;
      }
    }
    // 非演示场景，返回空数据
    const emptyData = {
      sceneId,
      sceneInfo: { sceneId, sceneName: sceneId, sceneType: 'general', recordingCount: 0 },
      overview: { summary: '', decisions: '', promises: '', conflicts: '', profiles: '', riskTrends: '', recordingCount: 0, reports: [] },
      recordingCount: 0,
      reports: {},
    };
    _staticSceneDataCache[sceneId] = emptyData;
    return emptyData;
  },
};

const api = {
  async _fetch(url, opts = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    let data;
    try { data = await res.json(); } catch { data = {}; }
    if (!res.ok) {
      const msg = data?.error || `请求失败 (${res.status})`;
      const err = new Error(msg);
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  },
  async _dispatch(method, ...args) {
    // demo 场景强制走静态数据，避免后端旧 sceneName 覆盖
    const isDemoCall = method === 'getScenes' || (args[0] && /^demo-(client|project|interview|study|general)$/.test(args[0]));
    if (isDemoCall && staticApi[method] && window.MEMORA_DEMO_DATA) {
      return await staticApi[method].apply(staticApi, args);
    }
    const online = await checkOnline();
    if (online) {
      try {
        return await this[`_${method}Online`].apply(this, args);
      } catch (err) {
        // 在线失败，回退静态
        if (RUN_MODE === 'auto' && staticApi[method]) {
          _onlineAvailable = false;
          return await staticApi[method].apply(staticApi, args);
        }
        throw err;
      }
    }
    if (staticApi[method]) return await staticApi[method].apply(staticApi, args);
    throw new Error('后端服务未启动，且该方法无静态实现');
  },
  _getScenesOnline() {
    return this._fetch(`${API_BASE}/api/scenes/${encodeURIComponent(USER_ID)}`);
  },
  _getOverviewOnline(sceneId) {
    return this._fetch(`${API_BASE}/api/scenes/${encodeURIComponent(USER_ID)}/${encodeURIComponent(sceneId)}/overview`);
  },
  _getReportOnline(sceneId, reportName) {
    return this._fetch(`${API_BASE}/api/scenes/${encodeURIComponent(USER_ID)}/${encodeURIComponent(sceneId)}/reports/${encodeURIComponent(reportName)}`);
  },
  _analyzeOnline(body) {
    return this._fetch(`${API_BASE}/api/analyze`, { method: 'POST', body: JSON.stringify(body) });
  },
  _createSceneOnline(body) {
    return this._fetch(`${API_BASE}/api/scenes`, { method: 'POST', body: JSON.stringify(body) });
  },
  getScenes() { return this._dispatch('getScenes'); },
  getOverview(sceneId) { return this._dispatch('getOverview', sceneId); },
  getReport(sceneId, reportName) { return this._dispatch('getReport', sceneId, reportName); },
  analyze(body) { return this._dispatch('analyze', body); },
  createScene(body) { return this._dispatch('createScene', body); },
};

/* ============ Toast ============ */
function showToast(message, type = 'info', duration = 3200) {
  const root = $('#toast-root');
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="t-ico">${icons[type] || icons.info}</span><span>${escapeHtml(message)}</span>`;
  root.appendChild(el);
  setTimeout(() => {
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

/* ============ 加载遮罩 ============ */
function showLoading(title = 'AI 正在分析录音', sub = '正在恢复长期记忆并生成洞察…') {
  const overlay = $('#loading-overlay');
  $('#loading-title').textContent = title;
  $('#loading-sub').textContent = sub;
  // 重置步骤
  $$('#loading-steps .step').forEach(s => s.classList.remove('is-active', 'is-done'));
  overlay.classList.remove('is-hidden');
  // 步骤动画
  const steps = $$('#loading-steps .step');
  let i = 0;
  steps[0]?.classList.add('is-active');
  state.loadingTimer = setInterval(() => {
    if (i >= steps.length) {
      // 循环：全部完成后重新开始
      steps.forEach(s => s.classList.remove('is-done', 'is-active'));
      i = 0;
      steps[0]?.classList.add('is-active');
      return;
    }
    steps[i]?.classList.remove('is-active');
    steps[i]?.classList.add('is-done');
    i++;
    if (i < steps.length) steps[i]?.classList.add('is-active');
    const subs = [
      '正在读取 knowledge/ 下所有历史文件…',
      '正在分析本次录音并提取关键信息…',
      '正在更新记忆、决策与人物画像…',
      '正在生成本次业务分析报告…',
    ];
    if (i < subs.length) $('#loading-sub').textContent = subs[i];
  }, 1000);
}

function hideLoading() {
  if (state.loadingTimer) { clearInterval(state.loadingTimer); state.loadingTimer = null; }
  $('#loading-overlay').classList.add('is-hidden');
}

/* ============ Markdown 渲染 ============ */
function renderMarkdown(md) {
  const wrapper = document.createElement('div');
  wrapper.className = 'md-content';
  try {
    wrapper.innerHTML = marked.parse(md || '_暂无内容_');
  } catch {
    wrapper.textContent = md || '暂无内容';
  }
  // 代码高亮
  wrapper.querySelectorAll('pre code').forEach(block => {
    try { hljs.highlightElement(block); } catch {}
  });
  return wrapper;
}

/* ============ 路由 ============ */
function parseHash() {
  let hash = window.location.hash.replace(/^#/, '');
  if (!hash.startsWith('/')) hash = '/' + hash;
  const parts = hash.split('/').filter(Boolean); // ['scene', id, tab?]
  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'new') return { name: 'new' };
  if (parts[0] === 'scene' && parts[1]) {
    const sceneId = decodeURIComponent(parts[1]);
    const tab = parts[2] || 'report';
    const sub = parts[3] ? decodeURIComponent(parts[3]) : null;
    return { name: 'scene', sceneId, tab, sub };
  }
  return { name: 'home' };
}

async function handleRoute() {
  const route = parseHash();
  const view = $('#view');

  // 滚动到顶
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

  // 高亮侧栏
  updateNavActive(route);
  try {
    if (route.name === 'home') {
      await renderHome(view);
    } else if (route.name === 'new') {
      await renderNew(view);
    } else if (route.name === 'scene') {
      await renderSceneDetail(view, route.sceneId, route.tab, route.sub);
    } else {
      await renderHome(view);
    }
  } catch (err) {
    console.error(err);
    view.innerHTML = renderErrorCard(err.message || '页面加载失败');
  }
}

function updateNavActive(route) {
  // 只更新发生变化的项，避免全部移除再添加造成视觉闪烁
  const homeActive = route.name === 'home';
  const newActive = route.name === 'new';
  $('.nav-item[data-nav="home"]')?.classList.toggle('is-active', homeActive);
  $('.nav-item[data-nav="new"]')?.classList.toggle('is-active', newActive);

  // 场景导航：逐个 toggle，不全部清空
  $$('.nav-scene').forEach(n => {
    n.classList.toggle('is-active', route.name === 'scene' && n.dataset.sceneId === route.sceneId);
  });
}

/* ============ 错误卡片 ============ */
function renderErrorCard(msg) {
  return `
    <div class="empty-state" style="margin-top:40px;">
      <div class="es-emoji">⚠️</div>
      <div class="es-title">出错了</div>
      <div class="es-sub">${escapeHtml(msg)}</div>
      <div class="mt-24"><a class="btn btn-ghost" href="#/">返回场景空间</a></div>
    </div>`;
}

/* ============ 场景列表页 ============ */
async function ensureScenes() {
  if (!state.scenes) {
    const data = await api.getScenes();
    state.scenes = data.scenes || [];
  }
  return state.scenes;
}

async function renderHome(view) {
  view.innerHTML = `
    <section class="hero">
      <div class="hero-inner stagger">
        <div class="hero-badge"><span class="dot"></span>TRAE AI 创造力大赛 · 长期记忆引擎</div>
        <h1 class="hero-title">Memora</h1>
        <p class="hero-sub">越用越懂你的 AI 录音分析 — 跨录音持续上下文、业务洞察、AI 主动质疑、人物画像演进。不只是转录工具，是你的业务记忆空间。</p>
        <div class="hero-cta">
          <a class="btn btn-primary" href="#/new">＋ 新建记忆空间</a>
          <a class="btn btn-ghost" href="#/scene/demo-client">查看示例场景</a>
        </div>
      </div>
    </section>

    <div class="section-title">记忆空间</div>
    <div id="stats" class="stats stagger"></div>
    <div id="scenes-grid" class="scenes-grid stagger"></div>
  `;

  // 统计 + 卡片
  let scenes = [];
  try {
    scenes = await ensureScenes();
  } catch (err) {
    $('#scenes-grid').innerHTML = renderErrorCard(err.message);
    $('#stats').innerHTML = '';
    return;
  }

  renderStats(scenes);
  renderSceneCards(scenes);

  // 后台拉取报告数以更新统计
  refreshReportCount(scenes);
}

function renderStats(scenes) {
  const totalScenes = scenes.length;
  const totalRecordings = scenes.reduce((s, x) => s + (x.recordingCount || 0), 0);
  $('#stats').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">记忆空间</div>
      <div class="stat-value">${totalScenes}</div>
      <div class="stat-foot">个场景</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">累计录音</div>
      <div class="stat-value">${totalRecordings}</div>
      <div class="stat-foot">条已分析</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">分析报告</div>
      <div class="stat-value" id="stat-reports">—</div>
      <div class="stat-foot">份业务洞察</div>
    </div>
  `;
}

async function refreshReportCount(scenes) {
  if (!scenes.length) { const el = $('#stat-reports'); if (el) el.textContent = '0'; return; }
  try {
    const overviews = await Promise.all(scenes.map(s => api.getOverview(s.sceneId).catch(() => ({ reports: [] }))));
    const total = overviews.reduce((s, o) => s + (o.reports?.length || 0), 0);
    const el = $('#stat-reports');
    if (el) el.textContent = total;
  } catch {
    const el = $('#stat-reports');
    if (el) el.textContent = '—';
  }
}

function renderSceneCards(scenes) {
  const grid = $('#scenes-grid');
  if (!scenes.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="es-emoji">🌌</div>
        <div class="es-title">还没有记忆空间</div>
        <div class="es-sub">创建第一个场景，让 Memora 开始为你积累跨录音的长期记忆</div>
        <div class="mt-24"><a class="btn btn-primary" href="#/new">＋ 新建场景</a></div>
      </div>`;
    return;
  }
  grid.innerHTML = scenes.map(s => {
    const type = inferSceneType(s.sceneId, s);
    const t = SCENE_TYPES[type];
    const st = sceneStyle(type);
    const name = s.sceneName || s.sceneId;
    return `
      <a class="scene-card" href="#/scene/${encodeURIComponent(s.sceneId)}" style="${st.style}">
        <div class="scene-head">
          <div class="scene-emoji">${t.emoji}</div>
          <span class="scene-type-tag">${t.name}</span>
        </div>
        <h3 class="scene-name">${escapeHtml(name)}</h3>
        <div class="scene-id">${escapeHtml(s.sceneId)}</div>
        <div class="scene-meta">
          <div class="scene-meta-item">
            <span class="mi-ico">🎙</span>
            <span>录音</span>
            <span class="mi-val">${s.recordingCount || 0}</span>
          </div>
          <div class="scene-meta-item">
            <span class="mi-ico">🕑</span>
            <span>${timeAgo(s.lastActivity)}</span>
          </div>
          <span class="scene-arrow">→</span>
        </div>
      </a>`;
  }).join('');
}

/* ============ 场景详情页 ============ */
// 场景渲染缓存：避免同场景内切 Tab 闪烁
let _sdCache = { sceneId: null, overview: null, sceneInfo: null };
// 报告内容缓存：key = `${sceneId}/${reportName}`，避免切换 Tab 重新 fetch
let _reportCache = {};
// 知识文件 Tab 子项缓存：避免切回时丢失状态
let _knowledgeLastKey = 'summary';

async function renderSceneDetail(view, sceneId, tab, sub) {
  // 同一场景且已有缓存 → 只切 Tab，不重渲染头部/Tab栏
  const sameScene = _sdCache.sceneId === sceneId && _sdCache.overview;

  if (!sameScene) {
    // 先取数据，再渲染
    let scenes, overview;
    try {
      [scenes, overview] = await Promise.all([
        ensureScenes().catch(() => []),
        api.getOverview(sceneId),
      ]);
    } catch (err) {
      view.innerHTML = `<a class="back-link" href="#/">← 返回场景空间</a>${renderErrorCard(err.message || '场景不存在')}`;
      return;
    }

    const sceneInfo = scenes.find(s => s.sceneId === sceneId) || {};
    _sdCache = { sceneId, overview, sceneInfo };

    // 渲染过程中隐藏，避免中间帧暴露空 DOM
    view.style.visibility = 'hidden';
    view.innerHTML = `
      <a class="back-link" href="#/">← 返回场景空间</a>
      <div id="sd-head"></div>
      <div class="tabs-wrap" id="tabs-wrap"></div>
      <div id="tab-body"></div>
    `;

    renderSceneHead(sceneId, sceneInfo, overview);
    renderTabs(tab, sceneId);
  } else {
    // 复用缓存：只更新 Tab active 状态 + 内容
    const { sceneInfo, overview } = _sdCache;
    const type = inferSceneType(sceneId, sceneInfo);
    const name = sceneInfo.sceneName || sceneId;

    // 更新 Tab active 状态（不重建 DOM）
    document.querySelectorAll('.tab').forEach(btn => {
      const key = btn.getAttribute('data-tab');
      btn.classList.toggle('is-active', key === tab);
    });
    requestAnimationFrame(() => moveTabIndicator());

    // 渲染 Tab 内容
    const body = $('#tab-body');
    if (tab === 'report') {
      await renderTabReport(body, sceneId, overview);
    } else if (tab === 'knowledge') {
      renderTabKnowledge(body, sceneId, overview, sub);
    } else if (tab === 'history') {
      await renderTabHistory(body, sceneId, overview, sub);
    } else if (tab === 'upload') {
      await renderTabUpload(body, sceneId, type, name);
    } else {
      await renderTabReport(body, sceneId, overview);
    }
    return;
  }

  // 首次渲染：渲染 Tab 内容
  const { sceneInfo, overview } = _sdCache;
  const type = inferSceneType(sceneId, sceneInfo);
  const name = sceneInfo.sceneName || sceneId;
  const body = $('#tab-body');
  if (tab === 'report') {
    await renderTabReport(body, sceneId, overview);
  } else if (tab === 'knowledge') {
    renderTabKnowledge(body, sceneId, overview, sub);
  } else if (tab === 'history') {
    await renderTabHistory(body, sceneId, overview, sub);
  } else if (tab === 'upload') {
    await renderTabUpload(body, sceneId, type, name);
  } else {
    await renderTabReport(body, sceneId, overview);
  }
  // 渲染完成，恢复可见
  view.style.visibility = '';
}

function renderSceneHead(sceneId, sceneInfo, overview) {
  const type = inferSceneType(sceneId, sceneInfo);
  const st = sceneStyle(type);
  const t = SCENE_TYPES[type];
  const name = sceneInfo.sceneName || sceneId;

  $('#sd-head').innerHTML = `
    <div class="scene-detail-head" style="${st.style}">
      <div class="sd-title-row">
        <div class="sd-emoji">${t.emoji}</div>
        <div>
          <h2 class="sd-title">${escapeHtml(name)}</h2>
          <div class="sd-sub">${escapeHtml(sceneId)} · 创建于 ${formatTime(sceneInfo.createdAt)}</div>
        </div>
        <span class="sd-type-tag">${t.name}</span>
      </div>
      <div class="metrics-row">
        <div class="metric">
          <div class="m-label">累计录音</div>
          <div class="m-value grad">${overview.recordingCount || 0}</div>
          <div class="m-trend">已分析</div>
        </div>
        <div class="metric">
          <div class="m-label">分析报告</div>
          <div class="m-value">${(overview.reports || []).length}</div>
          <div class="m-trend">份业务洞察</div>
        </div>
        <div class="metric">
          <div class="m-label">知识文件</div>
          <div class="m-value">6</div>
          <div class="m-trend">持续更新中</div>
        </div>
        <div class="metric">
          <div class="m-label">最后活动</div>
          <div class="m-value" style="font-size:15px; margin-top:10px;">${timeAgo(sceneInfo.lastActivity)}</div>
          <div class="m-trend">${formatTime(sceneInfo.lastActivity)}</div>
        </div>
      </div>
    </div>
  `;
}

function renderTabs(activeTab, sceneId) {
  const wrap = $('#tabs-wrap');
  wrap.innerHTML = `
    <div class="tabs" id="tabs">
      <div class="tab-indicator" id="tab-indicator"></div>
      ${TABS.map(tb => `
        <button class="tab ${tb.key === activeTab ? 'is-active' : ''}" data-tab="${tb.key}" data-scene="${encodeURIComponent(sceneId)}">
          <span class="tab-ico">${tb.icon}</span>
          <span>${tb.name}</span>
        </button>
      `).join('')}
    </div>
  `;
  // 滑动指示器
  requestAnimationFrame(() => moveTabIndicator());

  // 绑定 Tab 点击事件
  wrap.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabKey = btn.getAttribute('data-tab');
      const sid = decodeURIComponent(btn.getAttribute('data-scene') || '');
      if (tabKey && sid) {
        location.hash = `#/scene/${encodeURIComponent(sid)}/${tabKey}`;
      }
    });
  });
}

function moveTabIndicator() {
  const active = $('.tab.is-active');
  const indicator = $('#tab-indicator');
  if (!active || !indicator) return;
  const tabs = $('#tabs');
  const rect = active.getBoundingClientRect();
  const parentRect = tabs.getBoundingClientRect();
  indicator.style.left = (rect.left - parentRect.left) + 'px';
  indicator.style.width = rect.width + 'px';
}

/* ---- Tab: 最新报告 ---- */
async function renderTabReport(body, sceneId, overview) {
  const reports = overview.reports || [];
  if (!reports.length) {
    body.innerHTML = `
      <div class="md-panel">
        <div class="empty-state" style="border:0;padding:40px 0;">
          <div class="es-emoji">📄</div>
          <div class="es-title">还没有分析报告</div>
          <div class="es-sub">上传第一份录音，AI 将生成业务分析报告并建立记忆</div>
          <div class="mt-24"><a class="btn btn-primary" href="#/scene/${encodeURIComponent(sceneId)}/upload">上传录音</a></div>
        </div>
      </div>`;
    return;
  }

  // 最新报告 = reports[0]（后端已按倒序返回）
  const latest = reports[0];
  const cacheKey = `${sceneId}/${latest}`;
  const cached = _reportCache[cacheKey];

  if (cached) {
    body.innerHTML = `<div class="md-panel" id="report-panel"></div>`;
    const panel = $('#report-panel');
    panel.appendChild(reportHeader(latest, reports.length));
    panel.appendChild(renderMarkdown(cached));
    return;
  }

  // 先取数据，再渲染（不先清空 body，避免闪烁）
  try {
    const data = await api.getReport(sceneId, latest);
    _reportCache[cacheKey] = data.content;
    body.innerHTML = `<div class="md-panel" id="report-panel"></div>`;
    const panel = $('#report-panel');
    panel.appendChild(reportHeader(latest, reports.length));
    panel.appendChild(renderMarkdown(data.content));
  } catch (err) {
    body.innerHTML = renderErrorCard(err.message);
  }
}

function reportHeader(reportName, total) {
  const head = document.createElement('div');
  head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--glass-border);';
  head.innerHTML = `
    <div>
      <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);">最新分析报告</div>
      <div class="mono" style="font-size:13px;color:var(--text-1);margin-top:4px;">${escapeHtml(reportName)}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;color:var(--text-3);">报告序号</div>
      <div class="mono" style="font-size:14px;color:var(--brand-pink);font-weight:600;">#${total}</div>
    </div>
  `;
  return head;
}

/* ---- Tab: 知识文件 ---- */
function renderTabKnowledge(body, sceneId, overview, sub) {
  const activeKey = sub && KNOWLEDGE_FILES.some(f => f.key === sub) ? sub : 'summary';
  const file = KNOWLEDGE_FILES.find(f => f.key === activeKey);
  const content = activeKey === 'risk-trends' ? (overview.riskTrends || '') : (overview[activeKey] || '');

  // 空场景：没有知识文件内容
  if (!content) {
    body.innerHTML = `
      <div class="md-panel">
        <div class="empty-state" style="border:0;padding:40px 0;">
          <div class="es-emoji">🧠</div>
          <div class="es-title">还没有知识文件</div>
          <div class="es-sub">上传第一份录音后，AI 将自动建立 6 个知识文件：<br/>场景摘要、决策追踪、承诺记录、冲突检测、人物画像、风险趋势</div>
          <div class="mt-24"><a class="btn btn-primary" href="#/scene/${encodeURIComponent(sceneId)}/upload">上传录音</a></div>
        </div>
      </div>`;
    return;
  }

  body.innerHTML = `
    <div class="knowledge-layout">
      <aside class="k-side">
        <div class="k-side-head">6 个持续记忆文件</div>
        ${KNOWLEDGE_FILES.map(f => `
          <a class="k-file ${f.key === activeKey ? 'is-active' : ''}" href="#/scene/${encodeURIComponent(sceneId)}/knowledge/${f.key}">
            <span class="kf-emoji">${f.emoji}</span>
            <div class="kf-body">
              <div class="kf-name">${f.name}</div>
              <div class="kf-desc">${f.desc}</div>
            </div>
          </a>
        `).join('')}
      </aside>
      <div class="md-panel" id="knowledge-panel"></div>
    </div>
  `;

  const panel = $('#knowledge-panel');
  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;gap:14px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--glass-border);';
  header.innerHTML = `
    <div style="font-size:24px;">${file.emoji}</div>
    <div>
      <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-weight:700;font-size:18px;color:var(--text-1);">${file.name}</div>
      <div style="font-size:12.5px;color:var(--text-3);">${file.desc} · <span class="mono">knowledge/${activeKey}.md</span></div>
    </div>
  `;
  panel.appendChild(header);
  panel.appendChild(renderMarkdown(content));
}

/* ---- Tab: 历史报告 ---- */
async function renderTabHistory(body, sceneId, overview, sub) {
  const reports = overview.reports || [];
  if (!reports.length) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="es-emoji">🕓</div>
        <div class="es-title">暂无历史报告</div>
        <div class="es-sub">上传录音后，每次分析都会在此形成时间线节点</div>
        <div class="mt-24"><a class="btn btn-primary" href="#/scene/${encodeURIComponent(sceneId)}/upload">上传录音</a></div>
      </div>`;
    return;
  }

  const selected = sub && reports.includes(sub) ? sub : reports[0];
  const cacheKey = `${sceneId}/${selected}`;
  const cached = _reportCache[cacheKey];

  body.innerHTML = `
    <div style="display:grid;grid-template-columns:340px 1fr;gap:24px;align-items:start;">
      <div>
        <div class="section-title" style="margin-bottom:14px;">报告时间线</div>
        <div class="timeline" id="timeline">
          ${reports.map((r, i) => `
            <div class="tl-item ${r === selected ? 'is-active' : ''}">
              <div class="tl-node"></div>
              <a class="tl-card" href="#/scene/${encodeURIComponent(sceneId)}/history/${encodeURIComponent(r)}">
                <div class="tl-row">
                  <span class="tl-name">${escapeHtml(r)}</span>
                  <span class="tl-date">${i === 0 ? '最新' : '#' + (reports.length - i)}</span>
                </div>
                <div class="tl-preview">${reportDateLabel(r)} · 点击查看完整报告</div>
              </a>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="md-panel tl-viewer" id="history-panel"></div>
    </div>
  `;

  const renderPanel = (content) => {
    const panel = $('#history-panel');
    panel.innerHTML = '';
    const h = document.createElement('div');
    h.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid var(--glass-border);';
    h.innerHTML = `
      <div>
        <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);">历史报告</div>
        <div class="mono" style="font-size:13px;color:var(--text-1);margin-top:4px;">${escapeHtml(selected)}</div>
      </div>
      <span class="scene-type-tag" style="background:var(--grad-brand);">${selected === reports[0] ? '最新' : '历史'}</span>
    `;
    panel.appendChild(h);
    panel.appendChild(renderMarkdown(content));
  };

  if (cached) {
    renderPanel(cached);
    return;
  }

  // 右侧面板显示 loading
  const panel = $('#history-panel');
  panel.innerHTML = `
    <div class="tab-loading">
      <div class="tab-loading-spinner"></div>
      <div class="tab-loading-text">正在加载报告…</div>
    </div>
  `;
  try {
    const data = await api.getReport(sceneId, selected);
    _reportCache[cacheKey] = data.content;
    renderPanel(data.content);
  } catch (err) {
    panel.innerHTML = renderErrorCard(err.message);
  }
}

/* ---- Tab: 上传录音 ---- */
async function renderTabUpload(body, sceneId, currentType, sceneName) {
  // 优先检查是否有写死的录音文本（demo 模式），不管是否在线
  const type = currentType || 'general';
  // 主动加载场景数据，确保能正确判断是第一次还是第二次上传
  let current = _staticSceneDataCache[sceneId];
  if (!current) {
    try { current = await staticApi._loadScene(sceneId); } catch {}
  }
  const isFirstUpload = !current?.overview?.reports || current.overview.reports.length === 0;

  let recordingText = '';
  let uploadTitle = '';
  let uploadDesc = '';

  if (isFirstUpload) {
    // 第一次上传：从写死的前端数据读取录音文本
    recordingText = (window.MEMORA_RECORDINGS?.v1?.[type]) || '';
    uploadTitle = '上传第一份录音';
    uploadDesc = '点击「开始 AI 分析」，AI 将分析录音内容，生成第一份业务分析报告，并建立 6 个知识文件作为<strong style="color:var(--text-1);">长期记忆基线</strong>。后续上传录音时，AI 将基于这些记忆进行跨录音分析。';
  } else {
    // 第二次上传：从写死的前端数据读取录音文本
    recordingText = (window.MEMORA_RECORDINGS?.v2?.[type]) || '';
    // 兜底：新建场景的 v2 数据缓存
    if (!recordingText && _staticV2DataCache[sceneId]) {
      recordingText = _staticV2DataCache[sceneId].recordingText || '';
    }
    uploadTitle = '上传第二份录音';
    uploadDesc = 'AI 将基于上次沟通的<strong style="color:var(--text-1);">历史记忆</strong>生成第二份报告，并更新 6 个知识文件——体现 Memora <strong style="color:var(--text-1);">跨录音的持续上下文</strong>能力：承诺兑现追踪、决策变更对比、人物画像演进、AI 主动质疑。';
  }

  if (recordingText) {
    // 有写死的录音文本，使用 mock 上传流程
    body.innerHTML = `
      <div class="md-panel" style="padding:32px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
          <span style="font-size:26px;">📤</span>
          <h3 style="margin:0;font-size:18px;color:var(--text-1);font-weight:600;">${uploadTitle}</h3>
          <span class="badge badge-info" style="margin-left:auto;">演示模式</span>
        </div>
        <p style="color:var(--text-2);margin:0 0 22px;line-height:1.7;font-size:13.5px;">
          ${uploadDesc}
        </p>
        <div class="field-label">
          <span>录音转写文本</span>
          <span class="field-hint">已预填 · 只读 · ${recordingText.length} 字</span>
        </div>
        <textarea class="input" id="transcript" readonly style="min-height:300px;resize:vertical;font-family:ui-monospace,Consolas,monospace;font-size:12.5px;line-height:1.75;color:var(--text-2);">${escapeHtml(recordingText)}</textarea>
        <div class="upload-actions" style="margin-top:18px;">
          <button class="btn btn-primary" id="analyze-btn">🚀 开始 AI 分析</button>
          <span class="upload-tip">演示模式约 5 秒完成 · 自动跳转最新报告</span>
        </div>
      </div>
    `;

    $('#analyze-btn').addEventListener('click', async () => {
      const btn = $('#analyze-btn');
      btn.disabled = true;
      btn.textContent = 'AI 分析中…';
      showLoading('AI 正在分析录音', '正在恢复长期记忆并生成洞察…');

      try {
        const res = await staticApi.analyze({
          userId: USER_ID,
          sceneId,
          sceneType: currentType,
          transcript: recordingText,
        });
        hideLoading();
        if (res?.success !== false) {
          const msg = isFirstUpload
            ? '分析完成 · 第一份报告已生成 · 6 个知识文件已建立'
            : '分析完成 · 第二份报告已生成 · 知识文件已更新';
          showToast(msg, 'success', 4000);
          // 清除缓存，强制下次进入时使用最新数据
          _sdCache = { sceneId: null, overview: null, sceneInfo: null };
          _reportCache = {};
          // 跳转到最新报告
          window.location.hash = `#/scene/${encodeURIComponent(sceneId)}/report`;
        } else {
          showToast(res?.result || '分析未返回结果', 'info');
          btn.disabled = false;
          btn.textContent = '🚀 开始 AI 分析';
        }
      } catch (err) {
        hideLoading();
        btn.disabled = false;
        btn.textContent = '🚀 开始 AI 分析';
        showToast(err.message || '分析失败，请重试', 'error', 5000);
      }
    });
    return;
  }

  // 没有写死的录音文本，走在线模式
  const online = await checkOnline();
  if (!online) {
    body.innerHTML = `
      <div class="md-panel" style="text-align:center;padding:60px 24px;">
        <div style="font-size:48px;margin-bottom:16px;">🔒</div>
        <div style="font-size:18px;font-weight:600;color:var(--text-1);margin-bottom:8px;">实时分析需要后端服务</div>
        <div style="color:var(--text-2);max-width:520px;margin:0 auto 24px;line-height:1.7;">
          当前为静态演示版本，仅展示已生成的分析报告与知识文件。<br/>
          如需体验"上传录音 → AI 实时分析"完整流程，请启动后端服务。
        </div>
        <div style="display:inline-flex;gap:12px;flex-wrap:wrap;justify-content:center;">
          <a class="btn btn-primary" href="#/scene/${encodeURIComponent(sceneId)}/report">查看最新报告</a>
          <a class="btn btn-ghost" href="#/scene/${encodeURIComponent(sceneId)}/knowledge">浏览知识文件</a>
        </div>
      </div>
    `;
    return;
  }

  body.innerHTML = `
    <div class="upload-grid">
      <div>
        <div class="field-label">
          <span>场景类型</span>
          <span class="field-hint">将作为本次分析的业务上下文</span>
        </div>
        <div class="type-selector" id="type-selector">
          ${Object.entries(SCENE_TYPES).map(([k, v]) => `
            <div class="type-card ${k === currentType ? 'is-selected' : ''}" data-type="${k}" style="--tc-grad:${v.gradient};">
              <span class="tc-emoji">${v.emoji}</span>
              <span class="tc-name">${v.name}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div>
        <div class="field-label">
          <span>录音转写文本</span>
          <span class="req">*</span>
          <span class="field-hint">粘贴会议/对话的完整转写内容</span>
        </div>
        <textarea class="input" id="transcript" placeholder="在此粘贴录音转写文本…&#10;&#10;示例：&#10;张经理：这次我们想讨论 Q3 的合作方案…&#10;李总：预算方面我们需要再确认一下…"></textarea>
      </div>

      <div>
        <div class="field-label">
          <span>任务提示词</span>
          <span class="field-hint">可选 · 告诉 AI 本次分析的重点</span>
        </div>
        <input class="input" id="task-prompt" placeholder="例如：重点关注预算变化与未兑现承诺，对比上次沟通" />
      </div>

      <div class="upload-actions">
        <button class="btn btn-primary" id="analyze-btn">启动 AI 分析</button>
        <span class="upload-tip">分析约需 1-2 分钟，AI 将读取历史记忆并更新 6 个知识文件</span>
      </div>
    </div>
  `;

  // 类型选择
  let selectedType = currentType;
  $$('#type-selector .type-card').forEach(card => {
    card.addEventListener('click', () => {
      $$('#type-selector .type-card').forEach(c => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      selectedType = card.dataset.type;
    });
  });

  // 提交
  $('#analyze-btn').addEventListener('click', async () => {
    const transcript = $('#transcript').value.trim();
    const taskPrompt = $('#task-prompt').value.trim();
    if (!transcript) {
      showToast('请粘贴录音转写文本', 'error');
      $('#transcript').focus();
      return;
    }
    if (transcript.length < 20) {
      showToast('转写文本过短，请提供更完整的内容', 'error');
      return;
    }

    const btn = $('#analyze-btn');
    btn.disabled = true;
    showLoading('AI 正在分析录音', '正在恢复长期记忆并生成洞察…');

    try {
      const res = await api.analyze({
        userId: USER_ID,
        sceneId,
        sceneType: selectedType,
        transcript,
        taskPrompt: taskPrompt || undefined,
      });
      hideLoading();
      // 失效缓存
      state.scenes = null;
      if (res?.success !== false) {
        showToast('分析完成，报告已生成', 'success');
        // 清除所有缓存，强制下次进入时重新拉取数据
        _sdCache = { sceneId: null, overview: null, sceneInfo: null };
        _reportCache = {};
        // 跳转到最新报告
        window.location.hash = `#/scene/${encodeURIComponent(sceneId)}/report`;
      } else {
        showToast(res?.result || '分析未返回结果', 'info');
      }
    } catch (err) {
      hideLoading();
      btn.disabled = false;
      showToast(err.message || '分析失败，请重试', 'error', 5000);
    }
  });
}

/* ============ 新建场景页 ============ */
async function renderNew(view) {
  view.innerHTML = `
    <a class="back-link" href="#/">← 返回场景空间</a>
    <div class="new-shell">
      <div class="section-title">新建记忆空间</div>
      <div class="glass new-card">
        <h2 style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-weight:700;font-size:24px;margin:0 0 6px;">创建新的场景</h2>
        <p style="font-size:13.5px;color:var(--text-3);margin:0 0 26px;">每个场景独立维护 6 个知识文件，AI 会跨录音持续积累上下文。</p>

        <div style="background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.25);border-radius:10px;padding:14px 18px;margin:0 0 24px;font-size:12.5px;color:var(--text-2);line-height:1.75;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:16px;">💡</span>
            <strong style="color:var(--brand-indigo,#6366f1);font-size:13px;">演示说明</strong>
          </div>
          <div>本 Demo 为纯前端静态版本，<strong style="color:var(--text-1);">创建场景不会真正调用 AI</strong>。系统将根据所选场景类型，复制一份预设的示例数据作为初始状态：</div>
          <ul style="margin:8px 0 0;padding-left:22px;color:var(--text-3);">
            <li>初始为空场景，无报告与知识文件</li>
            <li>「上传第一份录音」将载入该类型的<strong style="color:var(--text-2);">真实录音转写（约 3 万字）</strong>，点击分析后生成第一份报告 + 6 个知识文件</li>
            <li>「上传第二份录音」将载入<strong style="color:var(--text-2);">承接第一次内容的第二份录音</strong>，分析后生成第二份报告，6 个知识文件随之演进（决策变更、承诺兑现、人物画像更新等）</li>
          </ul>
        </div>

        <div class="field">
          <div class="field-label"><span>场景名称</span><span class="req">*</span></div>
          <input class="input" id="new-name" placeholder="例如：星辰科技 Q3 合作" />
        </div>

        <div class="field">
          <div class="field-label">
            <span>场景 ID</span>
            <span class="field-hint">小写字母/数字/连字符，留空将自动生成</span>
          </div>
          <input class="input" id="new-id" placeholder="例如：star-tech-q3" />
        </div>

        <div class="field">
          <div class="field-label"><span>场景类型</span><span class="field-hint">将决定复制哪一套预设录音与分析结果</span></div>
          <div class="type-selector" id="new-type-selector">
            ${Object.entries(SCENE_TYPES).map(([k, v], i) => `
              <div class="type-card ${i === 0 ? 'is-selected' : ''}" data-type="${k}" style="--tc-grad:${v.gradient};">
                <span class="tc-emoji">${v.emoji}</span>
                <span class="tc-name">${v.name}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="modal-actions" style="margin-top:8px;">
          <a class="btn btn-ghost" href="#/">取消</a>
          <button class="btn btn-primary" id="create-btn">创建场景</button>
        </div>
      </div>
    </div>
  `;

  let selectedType = 'client';
  $$('#new-type-selector .type-card').forEach(card => {
    card.addEventListener('click', () => {
      $$('#new-type-selector .type-card').forEach(c => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      selectedType = card.dataset.type;
    });
  });

  $('#create-btn').addEventListener('click', async () => {
    const name = $('#new-name').value.trim();
    let id = $('#new-id').value.trim();
    if (!name) { showToast('请输入场景名称', 'error'); $('#new-name').focus(); return; }
    if (!id) {
      id = 'scene-' + Math.random().toString(36).slice(2, 8);
    }
    if (!/^[a-z0-9-]+$/.test(id)) {
      showToast('场景 ID 只能包含小写字母、数字和连字符', 'error');
      $('#new-id').focus();
      return;
    }

    const btn = $('#create-btn');
    btn.disabled = true;
    btn.textContent = '创建中…';
    try {
      await api.createScene({ userId: USER_ID, sceneId: id, sceneName: name, sceneType: selectedType });
      state.scenes = null;
      loadRecentScenes();
      showToast('场景创建成功', 'success');
      window.location.hash = `#/scene/${encodeURIComponent(id)}/report`;
    } catch (err) {
      showToast(err.message || '创建失败', 'error', 5000);
      btn.disabled = false;
      btn.textContent = '创建场景';
    }
  });
}

/* ============ 骨架屏 ============ */
function renderSkeleton() {
  return `
    <div style="padding:4px 0;">
      <div class="skeleton sk-line h"></div>
      <div class="skeleton sk-line" style="width:90%"></div>
      <div class="skeleton sk-line" style="width:78%"></div>
      <div class="skeleton sk-block"></div>
      <div class="skeleton sk-line" style="width:60%"></div>
      <div class="skeleton sk-line" style="width:85%"></div>
    </div>`;
}
/* ============ 侧栏最近场景 ============ */
async function loadRecentScenes() {
  const container = $('#recent-scenes');
  try {
    const scenes = await ensureScenes();
    if (!scenes.length) {
      container.innerHTML = `<div class="nav-empty">暂无场景</div>`;
      return;
    }
    container.innerHTML = scenes.slice(0, 8).map(s => {
      const type = inferSceneType(s.sceneId, s);
      const t = SCENE_TYPES[type];
      const name = s.sceneName || s.sceneId;
      return `
        <a class="nav-scene" href="#/scene/${encodeURIComponent(s.sceneId)}" data-scene-id="${escapeHtml(s.sceneId)}">
          <span class="ns-emoji">${t.emoji}</span>
          <span class="ns-name">${escapeHtml(name)}</span>
        </a>`;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="nav-empty" title="${escapeHtml(err.message)}">无法加载</div>`;
  } finally {
    updateNavActive(parseHash());
  }
}

/* ============ 初始化 ============ */
function init() {
  // marked 配置
  if (window.marked) {
    marked.setOptions({ gfm: true, breaks: false, headerIds: false, mangle: false });
  }
  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('resize', () => moveTabIndicator());
  // 首次加载触发一次 fade-in
  $('#view').classList.add('fade-in');
  handleRoute();
  loadRecentScenes();
}

init();
