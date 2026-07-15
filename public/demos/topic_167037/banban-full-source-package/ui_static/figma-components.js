/* ================================================================
   伴伴 Figma 共享组件 V2 — 悬浮窗 AI 面板 + 眼睛表情系统
   所有页面通过 <script src="figma-components.js"></script> 引入
   ================================================================ */

// 页面专属 CSS 均已解析后再加载响应式覆盖层，保证所有新版界面使用同一断点。
/*
 * Desktop display-density normalization.
 * Windows 150%/200% scaling reports a 1920px display as 1280/960 CSS px,
 * which otherwise triggers the narrow-screen layout. Restore the physical
 * desktop design space and map it back to the current viewport.
 */
function applyDisplayDensityNormalization() {
  const dpr = Math.max(1, Number(window.devicePixelRatio) || 1);
  const physicalWidth = Math.round(window.innerWidth * dpr);
  const physicalHeight = Math.round(window.innerHeight * dpr);
  const finePointer = !window.matchMedia || window.matchMedia('(pointer: fine)').matches;
  const shouldNormalize = dpr > 1.05
    && finePointer
    && physicalWidth >= 1280
    && physicalHeight >= 700;

  // The original interface was designed around a maximum 2048px-wide stage.
  // Do not turn a 4K panel at 200% into a 3840px design canvas: doing so makes
  // every control half the intended size. Extra physical pixels improve
  // sharpness; they do not create additional layout space beyond this cap.
  const designWidth = shouldNormalize ? Math.min(physicalWidth, 2048) : window.innerWidth;
  const displayScale = shouldNormalize ? window.innerWidth / designWidth : 1;
  const designHeight = shouldNormalize ? window.innerHeight / displayScale : window.innerHeight;

  const root = document.documentElement;
  root.classList.toggle('density-normalized', shouldNormalize);
  root.classList.toggle('density-physical-compact', shouldNormalize && designWidth <= 1600);
  root.classList.toggle('density-physical-medium', shouldNormalize && designWidth <= 1280);
  root.classList.toggle('density-physical-short', shouldNormalize && designHeight <= 780);
  root.style.setProperty('--display-scale', String(displayScale));
  root.style.setProperty('--display-width', shouldNormalize ? `${designWidth}px` : '100vw');
  root.style.setProperty('--display-height', shouldNormalize ? `${designHeight}px` : '100vh');
}

applyDisplayDensityNormalization();
let densityResizeFrame = 0;
window.addEventListener('resize', () => {
  cancelAnimationFrame(densityResizeFrame);
  densityResizeFrame = requestAnimationFrame(applyDisplayDensityNormalization);
});

(function loadResponsiveLayout() {
  if (document.querySelector('link[data-banban-responsive]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/responsive-layout.css';
  link.dataset.banbanResponsive = 'true';
  document.head.appendChild(link);
})();

function toggleResponsiveAI(forceOpen) {
  const panel = document.querySelector('.ai-panel');
  const backdrop = document.querySelector('.responsive-ai-backdrop');
  if (!panel || !backdrop) return;
  const shouldOpen = typeof forceOpen === 'boolean'
    ? forceOpen
    : !panel.classList.contains('responsive-open');
  panel.classList.toggle('responsive-open', shouldOpen);
  backdrop.classList.toggle('visible', shouldOpen);
}

function initResponsiveAIToggle() {
  if (document.querySelector('.responsive-ai-toggle')) return;
  const panel = document.querySelector('.ai-panel');
  if (!panel) return;

  const backdrop = document.createElement('div');
  backdrop.className = 'responsive-ai-backdrop';
  backdrop.addEventListener('click', () => toggleResponsiveAI(false));

  const button = document.createElement('button');
  button.className = 'responsive-ai-toggle';
  button.type = 'button';
  button.title = '打开 AI 助手';
  button.setAttribute('aria-label', '打开 AI 助手');
  button.innerHTML = '✦';
  button.addEventListener('click', () => toggleResponsiveAI());

  document.body.append(backdrop, button);
}

window.addEventListener('load', () => {
  // 各页面会在 load 回调中把占位元素替换成 AI 面板，延后一帧再创建入口。
  setTimeout(initResponsiveAIToggle, 0);
});

// ================================================================
//  零、导航上下文（轻量级参数传递，禁止传完整对象）
// ================================================================
/*
 * 设计原则：
 * - 只传 entity_id / 日期 / 筛选条件等轻量参数
 * - 目标页从 Store 按 ID 取完整数据
 * - 使用 sessionStorage，刷新不丢，关窗即清
 */
const NavContext = {
  KEY: 'banban_nav_context',

  // 设置导航上下文（跳转前调用）
  set(pageId, params) {
    try {
      // 安全检查：禁止传完整对象（只允许基本类型和一维数组）
      const safe = {};
      for (const [k, v] of Object.entries(params || {})) {
        if (v == null) continue;
        if (typeof v === 'object' && !Array.isArray(v)) {
          console.warn(`[NavContext] 忽略对象类型参数: ${k}，只允许传 ID/字符串/数字`);
          continue;
        }
        if (Array.isArray(v) && v.some(item => typeof item === 'object')) {
          console.warn(`[NavContext] 忽略对象数组: ${k}`);
          continue;
        }
        safe[k] = v;
      }
      const ctx = JSON.parse(sessionStorage.getItem(this.KEY) || '{}');
      ctx[pageId] = safe;
      ctx._lastFrom = ctx._currentFrom || null;
      ctx._currentFrom = pageId;
      sessionStorage.setItem(this.KEY, JSON.stringify(ctx));
    } catch (e) {
      console.warn('[NavContext] set 失败:', e);
    }
  },

  // 获取导航上下文（目标页加载时调用）
  get(pageId) {
    try {
      const ctx = JSON.parse(sessionStorage.getItem(this.KEY) || '{}');
      return ctx[pageId] || {};
    } catch (e) {
      return {};
    }
  },

  // 获取来源页面
  getFrom() {
    try {
      const ctx = JSON.parse(sessionStorage.getItem(this.KEY) || '{}');
      return ctx._lastFrom || null;
    } catch (e) {
      return null;
    }
  },

  // 清除指定页面上下文
  clear(pageId) {
    try {
      const ctx = JSON.parse(sessionStorage.getItem(this.KEY) || '{}');
      delete ctx[pageId];
      sessionStorage.setItem(this.KEY, JSON.stringify(ctx));
    } catch (e) {}
  },

  // 带上下文跳转
  goTo(pageId, params) {
    const pageMap = {
      canvas:   '/canvas-v3',
      plan:     '/today',
      today:    '/today',
      compass:  '/compass',
      timeline: '/compass#timeline',
      review:   '/review-evening',
      insight:  '/review-summary',
      weekly:   '/weekly',
      databus:  '/data-bus',
      settings: '/settings.html',
      overview: '/overview',
    };
    const href = pageMap[pageId];
    if (!href) {
      console.warn('[NavContext] 未知页面:', pageId);
      return;
    }
    this.set(pageId, params || {});
    window.location.href = href;
  },
};

// ================================================================
//  一、导航配置 & 侧边栏（保持向后兼容）
// ================================================================

const NAV_ITEMS = [
  { id: 'canvas',   iconKey: 'nav_canvas',  label: '画板',   href: '/canvas-v3',       badge: null },
  { id: 'plan',     iconKey: 'nav_plan',    label: '规划',   href: '/today',           badge: null },
  { id: 'compass',  iconKey: 'nav_compass', label: '今日',   href: '/compass',         badge: null },
  { id: 'review',   iconKey: 'nav_review',  label: '复盘',   href: '/review-evening',  badge: '113' },
  { id: 'insight',  iconKey: 'nav_insight', label: '洞察',   href: '/review-summary',  badge: null },
];

const NAV_BOTTOM = [
  { id: 'settings', iconKey: 'nav_settings', label: '设置',     href: '/settings.html' },
  { id: 'overview', iconKey: 'nav_grid',     label: '功能总览', href: '/overview' },
];

// 侧边栏状态
let sidebarExpanded = false;

function toggleSidebar() {
  sidebarExpanded = !sidebarExpanded;
  const sidebar = document.querySelector('.app-sidebar');
  if (sidebar) {
    sidebar.classList.toggle('expanded', sidebarExpanded);
  }
}

function renderSidebar(activeId) {
  const iconFn = typeof BanbanIcon !== 'undefined'
    ? (key) => BanbanIcon.get(key)
    : (key) => '<i class="ti ti-circle"></i>';

  const items = NAV_ITEMS.map(item => `
    <a class="nav-item ${item.id === activeId ? 'active' : ''}" href="${item.href}">
      <span class="nav-icon">${iconFn(item.iconKey)}</span>
      <span class="nav-label">${item.label}</span>
      ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
    </a>
  `).join('');

  const bottom = NAV_BOTTOM.map(item => `
    <a class="nav-item ${item.id === activeId ? 'active' : ''}" href="${item.href}">
      <span class="nav-icon">${iconFn(item.iconKey)}</span>
      <span class="nav-label">${item.label}</span>
    </a>
  `).join('');

  return `
    <aside class="app-sidebar${sidebarExpanded ? ' expanded' : ''}" id="appSidebar" onclick="toggleSidebar()">
      <div class="sidebar-brand">
        <div class="sidebar-brand-inner">
          <div class="sidebar-brand-icon">伴</div>
        </div>
        <div class="sidebar-brand-text-wrap">
          <span class="sidebar-brand-title">伴伴</span>
          <span class="sidebar-brand-subtitle">work space</span>
        </div>
      </div>
      <nav class="nav-list">${items}</nav>
      <div class="sidebar-spacer"></div>
      <div class="sidebar-divider"></div>
      <div class="sidebar-bottom">${bottom}</div>
      <div class="sidebar-user">
        <div class="sidebar-user-inner">
          <div class="sidebar-avatar">
            L
            <span class="sidebar-avatar-badge">28</span>
          </div>
        </div>
        <div class="user-info">
          <span class="user-name">Lemon</span>
          <span class="user-plan">Pro</span>
        </div>
      </div>
    </aside>
  `;
}

// ================================================================
//  二、UCM-8 八维定义（前端展示用 + 详情数据）
// ================================================================

const UCM8_DIMENSIONS_META = [
  { id: 'cognitive_mode', label: '认知模式', icon: '🧠', desc: '你处理信息和做决策的方式' },
  { id: 'motivation_system', label: '动机系统', icon: '🔥', desc: '驱动你长期投入的核心动力' },
  { id: 'action_mode', label: '行动模式', icon: '⚡', desc: '你开始、推进和完成任务的方式' },
  { id: 'time_rhythm', label: '时间节律', icon: '⏰', desc: '你的高效时段和时间管理方式' },
  { id: 'energy_model', label: '能量模型', icon: '🔋', desc: '你的精力消耗模式和恢复方式' },
  { id: 'emotional_state', label: '情绪状态', icon: '🌊', desc: '你的情绪基线和压力调节方式' },
  { id: 'env_social', label: '环境社交', icon: '🏢', desc: '最能让你发挥的工作环境' },
  { id: 'ai_pref', label: 'AI交互偏好', icon: '🤖', desc: '你偏好的AI角色和交互方式' },
];

// 六维（雷达图用）
const RADAR_DIMENSIONS = [
  'cognitive_mode',
  'action_mode',
  'time_rhythm',
  'energy_model',
  'emotional_state',
  'env_social',
];

// 维度详细描述（用于详情面板）
const DIMENSION_DETAILS = {
  cognitive_mode: {
    label: '认知模式',
    icon: '🧠',
    description: '你倾向于先理解整体结构和框架，再深入细节。做决策时更依赖逻辑分析而非直觉感受。',
    evidence: [
      { text: '每次接到新任务都会先画思维导图理清结构', date: '3天前', confirmed: true },
      { text: '喜欢用表格和列表整理信息', date: '5天前', confirmed: true },
      { text: '做决定前会列出优缺点对比', date: '1周前', confirmed: false },
    ],
    impact: '这意味着你在需要深度分析的任务上表现出色，但可能在需要快速反应的场景中显得迟缓。建议在紧急任务时设定"决策时间限制"。',
  },
  action_mode: {
    label: '行动模式',
    icon: '⚡',
    description: '你倾向于先行动再调整，而不是准备万全才开始。执行速度快，但有时会忽略细节。',
    evidence: [
      { text: '任务接到当天就开始推进', date: '2天前', confirmed: true },
      { text: '经常在行动中发现问题并修正', date: '4天前', confirmed: true },
      { text: '不喜欢过度规划，觉得浪费时间', date: '1周前', confirmed: false },
    ],
    impact: '你的行动力很强，适合快速迭代的工作方式。但需要注意：复杂项目建议先做10分钟规划再动手，可以减少返工。',
  },
  time_rhythm: {
    label: '时间节律',
    icon: '⏰',
    description: '你是典型的"夜猫子"，晚上8点到12点是效率高峰。早晨需要较长时间进入状态。',
    evidence: [
      { text: '最近一周有5天在晚上10点后完成核心任务', date: '3天前', confirmed: true },
      { text: '早晨前2小时主要处理邮件和简单事务', date: '5天前', confirmed: true },
    ],
    impact: '建议把需要深度思考的工作安排在晚间。如果必须早起，可以用运动或冷水澡快速激活状态。',
  },
  energy_model: {
    label: '能量模型',
    icon: '🔋',
    description: '你的精力消耗较快，需要短而频繁的休息。连续工作90分钟后效率明显下降。',
    evidence: [
      { text: '每工作1-1.5小时会主动休息', date: '2天前', confirmed: true },
      { text: '长时间会议后需要独处恢复', date: '4天前', confirmed: false },
    ],
    impact: '番茄工作法（50/10）很适合你。避免连续3小时以上的深度工作，中间安排散步或拉伸休息。',
  },
  emotional_state: {
    label: '情绪状态',
    icon: '🌊',
    description: '情绪整体稳定偏积极。压力大时会通过整理环境或运动来调节。',
    evidence: [
      { text: '上周3次在压力大时主动去跑步', date: '3天前', confirmed: true },
      { text: '心情不好时会整理桌面和文件', date: '1周前', confirmed: true },
    ],
    impact: '你的情绪调节能力不错。继续保持运动习惯，它是你最好的情绪出口。',
  },
  env_social: {
    label: '环境社交',
    icon: '🏢',
    description: '你在安静、有秩序的环境中效率最高。适度的社交能激发灵感，但过多会消耗能量。',
    evidence: [
      { text: '更喜欢独立办公室而非开放工位', date: '5天前', confirmed: true },
      { text: '每周1-2次头脑风暴效果最好', date: '1周前', confirmed: false },
    ],
    impact: '尽量为自己创造安静的工作空间。社交活动主动控制频率，把能量留给最重要的人。',
  },
};

// 默认人格画像数据
const DEFAULT_PERSONA = {
  summary: '你是一个先理解结构，再投入深度行动的人。',
  dimensions: {
    cognitive_mode: 72,
    action_mode: 65,
    time_rhythm: 58,
    energy_model: 55,
    emotional_state: 68,
    env_social: 60,
  },
};

// ================================================================
//  三、眼睛表情系统（V4 胶囊 pill 风格 - 简洁 div 实现）
// ================================================================

const EyeSystem = (() => {
  "use strict";

  // 工具函数
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, t) => from + (to - from) * t;
  const damp = (from, to, lambda, dt) => lerp(from, to, 1 - Math.exp(-lambda * dt));

  // 表情状态定义（V4 胶囊风格）
  const STATES = {
    neutral:   { className: 'state-neutral',   label: '平静',     gazeRange: 1.0 },
    listening: { className: 'state-listening', label: '正在听...', gazeRange: 1.0 },
    focus:     { className: 'state-focus',     label: '专注',     gazeRange: 0.7 },
    thinking:  { className: 'state-thinking',  label: '思考中',   gazeRange: 0.5 },
    happy:     { className: 'state-happy',     label: '开心',     gazeRange: 0.3 },
    surprised: { className: 'state-surprised', label: '惊讶',     gazeRange: 1.0 },
    confused:  { className: 'state-confused',  label: '疑惑',     gazeRange: 0.5 },
    concerned: { className: 'state-confused',  label: '担忧',     gazeRange: 0.4 },
    success:   { className: 'state-success',   label: '完成',     gazeRange: 0.2 },
    error:     { className: 'state-error',     label: '出错了',   gazeRange: 0.2 },
    sleepy:    { className: 'state-sleepy',    label: '困倦',     gazeRange: 0.1 },
    speaking:  { className: 'state-speaking',  label: '表达中',   gazeRange: 0.7 },
    attentive: { className: 'state-listening', label: '注意',     gazeRange: 1.0 },
  };

  class PillEyeController {
    constructor({ wrap, leftEye, rightEye, faceContainer }) {
      if (!wrap || !leftEye || !rightEye) return;

      this.wrap = wrap;
      this.leftEye = leftEye;
      this.rightEye = rightEye;
      this.faceContainer = faceContainer;

      this.stateName = "neutral";
      this.state = STATES.neutral;
      this.pointerEnabled = true;
      this.pointer = { x: 0, y: 0, active: false };
      this.gaze = { x: 0, y: 0 };
      this.gazeTarget = { x: 0, y: 0 };
      this.externalTarget = null;
      this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      this.lastTime = performance.now();
      this.temporaryUntil = 0;
      this.returnState = "neutral";

      this._bound = false;

      this.onPointerMove = this.onPointerMove.bind(this);
      this.onPointerLeave = this.onPointerLeave.bind(this);
      this.render = this.render.bind(this);
    }

    init() {
      if (this._bound) return;
      this._bound = true;

      window.addEventListener("pointermove", this.onPointerMove, { passive: true });
      document.addEventListener("pointerleave", this.onPointerLeave);

      this.registerInteractiveTargets();
      requestAnimationFrame(this.render);
    }

    destroy() {
      window.removeEventListener("pointermove", this.onPointerMove);
      document.removeEventListener("pointerleave", this.onPointerLeave);
      this._bound = false;
    }

    setPointerEnabled(enabled) {
      this.pointerEnabled = Boolean(enabled);
      if (!this.pointerEnabled) this.pointer.active = false;
    }

    setState(name, options = {}) {
      if (!STATES[name]) {
        console.warn(`Unknown eye state: ${name}`);
        return;
      }
      const previous = this.stateName;
      this.stateName = name;
      this.state = STATES[name];
      this.temporaryUntil = options.temporaryMs ? performance.now() + options.temporaryMs : 0;
      this.returnState = options.returnState || previous || "neutral";

      // 更新 CSS 类
      if (this.wrap) {
        // 移除所有状态类
        Object.values(STATES).forEach(s => {
          this.wrap.classList.remove(s.className);
        });
        // 添加新状态类
        this.wrap.classList.add(this.state.className);
      }
    }

    onPointerMove(event) {
      if (!this.pointerEnabled || event.pointerType === "touch") return;
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
      this.pointer.active = true;
    }

    onPointerLeave() {
      this.pointer.active = false;
      this.externalTarget = null;
    }

    registerInteractiveTargets() {
      document.querySelectorAll("button, a, [data-eye-target]").forEach((element) => {
        if (element._eyeTargetBound) return;
        element._eyeTargetBound = true;
        element.addEventListener("pointerenter", () => { this.externalTarget = element; });
        element.addEventListener("pointerleave", () => { if (this.externalTarget === element) this.externalTarget = null; });
      });
    }

    calculateTargetPoint() {
      if (this.externalTarget) {
        const rect = this.externalTarget.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, active: true };
      }
      return { ...this.pointer };
    }

    calculateGaze() {
      const target = this.calculateTargetPoint();
      if (!target.active || !this.pointerEnabled || this.reducedMotion) return { x: 0, y: 0 };

      const container = this.faceContainer || this.wrap;
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = clamp((target.x - cx) / Math.max(rect.width / 2, 1), -1, 1);
      const ny = clamp((target.y - cy) / Math.max(rect.height / 2, 1), -1, 1);
      const distance = Math.hypot(nx, ny) || 1;
      const normalizedX = distance > 1 ? nx / distance : nx;
      const normalizedY = distance > 1 ? ny / distance : ny;

      const maxX = 12 * (this.state.gazeRange ?? 1);
      const maxY = 8 * (this.state.gazeRange ?? 1);
      return { x: normalizedX * maxX, y: normalizedY * maxY };
    }

    render(now) {
      const dt = Math.min((now - this.lastTime) / 1000, .05);
      this.lastTime = now;

      // 临时状态恢复
      if (this.temporaryUntil && now >= this.temporaryUntil) {
        this.temporaryUntil = 0;
        this.setState(this.returnState || "neutral");
      }

      // 平滑注视移动
      const targetGaze = this.calculateGaze();
      this.gaze.x = damp(this.gaze.x, targetGaze.x, this.reducedMotion ? 100 : 10, dt);
      this.gaze.y = damp(this.gaze.y, targetGaze.y, this.reducedMotion ? 100 : 10, dt);

      // 应用移动到眼睛
      if (this.wrap && !this.reducedMotion) {
        this.wrap.style.transform = `translate(${this.gaze.x}px, ${this.gaze.y}px)`;
      }

      requestAnimationFrame(this.render);
    }
  }

  return {
    STATES,
    PillEyeController,
  };
})();

// 全局眼睛控制器实例（V4 胶囊版）
let _eyeController = null;

// ================================================================
//  四、AI 面板全局状态（V3 侧边栏版本）
// ================================================================

let _aiPanelOpen = true;        // 侧边栏是否显示（默认常驻显示）
let _personaExpanded = false;   // 人格罗盘是否展开
let _aiInsightVisible = false;  // 云朵是否可见
let _aiSuggestionVisible = false; // 建议是否可见
let _currentPageId = '';        // 当前页面标识
let _currentDetailDim = null;   // 当前详情面板显示的维度
let _personaData = null;        // 人格画像数据
let _insightAutoHideTimer = null;   // 云朵自动隐藏定时器
let _suggestionAutoHideTimer = null; // 建议自动隐藏定时器

// 获取当前页面 ID
function getCurrentPageId() {
  if (_currentPageId) return _currentPageId;
  const path = window.location.pathname;
  if (path.includes('today-timeline') || path.includes('timeline')) return 'timeline';
  if (path.includes('today')) return 'today';
  if (path.includes('canvas')) return 'canvas';
  if (path.includes('compass')) return 'compass';
  if (path.includes('review')) return 'review';
  if (path.includes('cognition')) return 'cognition';
  if (path.includes('app')) return 'app';
  return 'unknown';
}

function setCurrentPageId(id) {
  _currentPageId = id;
}

// ================================================================
//  五、渲染 AI 侧边栏面板（V4 极简柔和风格）
// ================================================================

function renderAIPanel(options = {}) {
  const {
    showInput = true,
    pageId = '',
  } = options;

  if (pageId) _currentPageId = pageId;

  const _icon = typeof BanbanIcon !== 'undefined'
    ? (k) => BanbanIcon.get(k)
    : () => '';

  return `
    <!-- AI 侧边栏（常驻右侧，宽度约 340px） -->
    <aside class="ai-panel" id="aiPanel">

      <!-- V4 顶部标题栏 -->
      <div class="ai-top-header">
        <div class="ai-title">AI Assistant</div>
        <div class="ai-status">
          <span class="ai-status-dot"></span>
          <span>在线</span>
        </div>
      </div>

      <!-- 顶部：眼睛区域（常驻，点击展开/收起人格罗盘） -->
      <div class="ai-eye-section" id="aiEyeSection" onclick="togglePersonaPanel()">
        <div class="eye-section-chevron">▾</div>
        <div class="eye-face-container" id="eyeFaceContainer">
          <div class="eye-pills-wrap state-neutral" id="eyePillsWrap">
            <div class="eye-pill left-eye" id="leftEye"></div>
            <div class="eye-pill right-eye" id="rightEye"></div>
          </div>
        </div>
        <div class="eye-face-label">
          <span class="label-dot"></span>
          <span id="eyeStatusLabel">平静</span>
        </div>
      </div>

      <!-- 人格罗盘区域（可展开/收起，从上往下滑出） -->
      <div class="ai-persona-section" id="aiPersonaSection">
        <div class="persona-inner">
          <!-- 人格画像大总结句（可点击） -->
          <div class="persona-summary" onclick="generatePersonaDetail(); event.stopPropagation();">
            <div class="persona-summary-text" id="personaSummary">
              你是一个先理解结构，再投入深度行动的人。
            </div>
            <div class="persona-summary-hint">
              <span>👆</span> 点击查看完整分析
            </div>
          </div>

          <!-- 雷达图区域（上移 + 底部状态总结） -->
          <div class="persona-chart-area-large">
            <div class="radar-chart-container-large">
              <svg class="radar-chart-large" id="radarChart" viewBox="0 0 340 340">
                <g class="radar-grid" id="radarGrid">
                  <!-- 由 JS 动态生成网格 -->
                </g>
                <polygon class="radar-data" id="radarData"
                  points="170,170 170,170 170,170 170,170 170,170 170,170" />
                <g class="radar-dots" id="radarDots"></g>
                <g class="radar-labels" id="radarLabels"></g>
              </svg>
            </div>

            <!-- 维度详情（点击维度后在雷达图区域内展示） -->
            <div class="ai-dimension-detail" id="aiDimensionDetail">
              <div class="dimension-detail-inner" id="dimensionDetailInner">
                <!-- 由 JS 动态渲染 -->
              </div>
            </div>
          </div>

          <!-- AI 当前状态总结（雷达图下方的一句话） -->
          <div class="persona-status-line" id="personaStatusLine">
            <span class="status-dot"></span>
            <span class="status-text">当前状态：节奏稳定，认知在线</span>
          </div>
        </div>
      </div>

      <!-- 动态内容区（中部，大部分时间空白） -->
      <div class="ai-dynamic-area" id="aiDynamicArea">
        <!-- 云朵 insight（AI 有新结论时才出现，自动消失） -->
        <div class="ai-insight-cloud" id="aiInsightCloud">
          <button class="cloud-close-btn" onclick="hideInsightWithClouds(); event.stopPropagation();">✕</button>
          <div class="cloud-shape">
            <div class="cloud-title">伴伴当前怎么看你</div>
            <div class="cloud-text" id="cloudText">
              伴伴正在观察你...
            </div>
          </div>
        </div>

        <!-- 建议卡片（AI 有建议时才弹出，带确认/忽略按钮） -->
        <div class="ai-suggestion-card" id="aiSuggestionCard">
          <button class="suggestion-close-btn" onclick="hideSuggestion(); event.stopPropagation();">✕</button>
          <div class="suggestion-header">
            <span class="suggestion-icon">💡</span>
            <span class="suggestion-label">伴伴建议</span>
          </div>
          <div class="suggestion-text" id="suggestionText">
            建议内容...
          </div>
          <div class="suggestion-actions">
            <button class="suggestion-confirm-btn" id="suggestionConfirmBtn" onclick="confirmSuggestion(); event.stopPropagation();">确认</button>
            <button class="suggestion-ignore-btn" onclick="hideSuggestion(); event.stopPropagation();">忽略</button>
          </div>
        </div>
      </div>

      <!-- 弹性空间 -->
      <div class="ai-spacer"></div>

      <!-- 底部：输入区域（常驻） -->
      <div class="ai-input-section">
        ${showInput ? `
        <div class="ai-input-area">
          <!-- 文字输入模式 -->
          <div class="ai-input-wrap" id="aiTextInputWrap">
            <input type="text" class="ai-input" id="aiInput" placeholder="你想做什么" onkeydown="if(event.key==='Enter') sendAIMessage(this.value, this)" />
            <button class="ai-input-mode-btn" id="aiModeBtn" onclick="toggleAIIO()" title="切换到语音输入">
              <span id="aiModeBtnIcon">🎤</span>
            </button>
          </div>
          <!-- 语音输入模式 -->
          <div class="ai-voice-wrap" id="aiVoiceWrap" style="display:none;">
            <button class="ai-keyboard-btn" onclick="toggleAIIO()" title="切换到键盘输入">
              ⌨️
            </button>
            <button class="ai-voice-btn" id="aiVoiceBtn"
                    onmousedown="startVoiceInput()"
                    onmouseup="stopVoiceInput()"
                    onmouseleave="if(_aiRecording) stopVoiceInput()"
                    ontouchstart="startVoiceInput()"
                    ontouchend="stopVoiceInput()">
              <span class="ai-voice-icon">🎙️</span>
              <span class="ai-voice-text">按下说话</span>
            </button>
          </div>
        </div>
        ` : ''}
      </div>
    </aside>
  `;
}

// ================================================================
//  六、人格罗盘展开/收起控制
// ================================================================

/**
 * 切换人格罗盘面板的展开/收起状态
 * 从上往下滑出动画
 */
function togglePersonaPanel() {
  _personaExpanded = !_personaExpanded;
  _updatePersonaPanelVisibility();
}

function openPersonaPanel() {
  if (!_personaExpanded) {
    _personaExpanded = true;
    _updatePersonaPanelVisibility();
  }
}

function closePersonaPanel() {
  if (_personaExpanded) {
    _personaExpanded = false;
    _updatePersonaPanelVisibility();
  }
}

function _updatePersonaPanelVisibility() {
  const personaSection = document.getElementById('aiPersonaSection');
  const aiPanel = document.getElementById('aiPanel');

  if (personaSection) {
    personaSection.classList.toggle('expanded', _personaExpanded);
  }
  if (aiPanel) {
    aiPanel.classList.toggle('persona-expanded', _personaExpanded);
  }

  // 展开时渲染人格画像数据
  if (_personaExpanded) {
    setTimeout(() => {
      renderPersonaData();
    }, 100);
  } else {
    // 收起时同时关闭维度详情
    closeDimensionDetail();
  }
}

// 兼容旧版函数名（保留 toggleAIPanel）
function toggleAIPanel() {
  togglePersonaPanel();
}

function openAIPanel() {
  openPersonaPanel();
}

function closeAIPanel() {
  closePersonaPanel();
}

// ================================================================
//  七、眼睛系统初始化（V4 胶囊版）
// ================================================================

function initEyeSystem() {
  if (_eyeController) return;

  const wrap = document.getElementById('eyePillsWrap');
  const leftEye = document.getElementById('leftEye');
  const rightEye = document.getElementById('rightEye');
  const faceContainer = document.getElementById('eyeFaceContainer');

  if (!wrap || !leftEye || !rightEye) return;

  _eyeController = new EyeSystem.PillEyeController({
    wrap,
    leftEye,
    rightEye,
    faceContainer,
  });
  _eyeController.init();

  // 注册交互动效目标
  setTimeout(() => {
    if (_eyeController) {
      _eyeController.registerInteractiveTargets();
    }
  }, 200);
}

// 更新眼睛状态标签
function updateEyeStatusLabel(text) {
  const label = document.getElementById('eyeStatusLabel');
  if (label) label.textContent = text;
}

// 状态中文映射
const EYE_STATE_LABELS = {
  neutral: '平静',
  attentive: '注意',
  focus: '专注',
  thinking: '思考中',
  happy: '开心',
  surprised: '惊讶',
  confused: '疑惑',
  concerned: '担忧',
  success: '完成',
  error: '出错了',
  sleepy: '困倦',
  listening: '正在听...',
  speaking: '表达中',
};

/**
 * 全局设置眼睛状态函数（同时更新控制器和状态标签）
 * @param {string} state - 表情状态名
 * @param {object} options - 可选配置 { temporaryMs, returnState }
 */
function setEyeState(state, options = {}) {
  if (_eyeController) {
    _eyeController.setState(state, options);
  }
  updateEyeStatusLabel(EYE_STATE_LABELS[state] || state);
}

// ================================================================
//  八、云朵动画系统（偶尔出现，自动消失）
// ================================================================

/**
 * 显示云朵 insight（AI 有新结论时调用）
 * 云朵形成 → 文字浮现 → 一段时间后自动消失
 * @param {string} text - 要显示的文字
 * @param {number} duration - 显示时长（毫秒），默认 8-15 秒随机
 */
function showInsightWithClouds(text, duration) {
  const cloudEl = document.getElementById('aiInsightCloud');
  const textEl = document.getElementById('cloudText');
  if (!cloudEl || !textEl) return;

  _aiInsightVisible = true;
  textEl.textContent = text || '伴伴正在观察你...';

  // 清除之前的自动隐藏定时器
  if (_insightAutoHideTimer) {
    clearTimeout(_insightAutoHideTimer);
    _insightAutoHideTimer = null;
  }

  // 移除隐藏状态，添加显示状态
  cloudEl.classList.remove('hiding');
  // 触发重绘
  cloudEl.offsetHeight;
  cloudEl.classList.add('visible');

  // 设置自动隐藏（8-15 秒随机）
  const autoHideDuration = duration || (8000 + Math.random() * 7000);
  _insightAutoHideTimer = setTimeout(() => {
    hideInsightWithClouds();
  }, autoHideDuration);
}

/**
 * 隐藏云朵 insight
 */
function hideInsightWithClouds() {
  const cloudEl = document.getElementById('aiInsightCloud');
  if (!cloudEl) return;

  _aiInsightVisible = false;

  if (_insightAutoHideTimer) {
    clearTimeout(_insightAutoHideTimer);
    _insightAutoHideTimer = null;
  }

  cloudEl.classList.remove('visible');
  cloudEl.classList.add('hiding');

  // 动画结束后完全隐藏
  setTimeout(() => {
    if (!_aiInsightVisible) {
      cloudEl.classList.remove('hiding');
    }
  }, 600);
}

// 兼容旧函数名
function showInsight(text) {
  showInsightWithClouds(text);
}

function hideInsight() {
  hideInsightWithClouds();
}

// ================================================================
//  八-补充、建议卡片系统（V4 增强版 - 带确认/忽略 + 命令执行）
// ================================================================

// 当前建议的关联命令
let _currentSuggestion = null;

/**
 * 显示建议卡片（V4 增强版）
 * @param {string} text - 建议内容
 * @param {object} options - 配置 { command, params, duration, autoHide }
 */
function showSuggestion(text, options = {}) {
  const cardEl = document.getElementById('aiSuggestionCard');
  const textEl = document.getElementById('suggestionText');
  if (!cardEl || !textEl) return;

  _aiSuggestionVisible = true;
  _currentSuggestion = {
    text: text,
    command: options.command || null,
    params: options.params || {},
  };
  textEl.textContent = text || '这是一条建议';

  // 清除之前的自动隐藏定时器
  if (_suggestionAutoHideTimer) {
    clearTimeout(_suggestionAutoHideTimer);
    _suggestionAutoHideTimer = null;
  }

  // 移除隐藏状态，添加显示状态
  cardEl.classList.remove('hiding');
  cardEl.offsetHeight;
  cardEl.classList.add('visible');

  // 设置自动隐藏（如果启用）
  const autoHide = options.autoHide !== false;
  if (autoHide) {
    const autoHideDuration = options.duration || (10000 + Math.random() * 10000);
    _suggestionAutoHideTimer = setTimeout(() => {
      hideSuggestion();
    }, autoHideDuration);
  }
}

/**
 * 隐藏建议卡片
 */
function hideSuggestion() {
  const cardEl = document.getElementById('aiSuggestionCard');
  if (!cardEl) return;

  _aiSuggestionVisible = false;
  _currentSuggestion = null;

  if (_suggestionAutoHideTimer) {
    clearTimeout(_suggestionAutoHideTimer);
    _suggestionAutoHideTimer = null;
  }

  cardEl.classList.remove('visible');
  cardEl.classList.add('hiding');

  setTimeout(() => {
    if (!_aiSuggestionVisible) {
      cardEl.classList.remove('hiding');
    }
  }, 500);
}

/**
 * 确认建议（执行关联的命令）
 */
function confirmSuggestion() {
  if (!_currentSuggestion) {
    hideSuggestion();
    return;
  }

  const { command, params, text } = _currentSuggestion;

  setEyeState('thinking');

  if (command) {
    // 执行关联的命令
    const result = executeCommandByName(command, params);
    if (result && result.success) {
      setEyeState('success', { temporaryMs: 1500, returnState: 'neutral' });
      showToast(result.message || '已执行', 'success');
    } else {
      setEyeState('error', { temporaryMs: 1500, returnState: 'neutral' });
      showToast(result?.message || '执行失败', 'error');
    }
  } else {
    // 没有关联命令，只是确认收到
    setEyeState('success', { temporaryMs: 1500, returnState: 'neutral' });
    showToast('已确认建议', 'success');
  }

  hideSuggestion();
}

// ================================================================
//  九、雷达图 + 维度条形图 + 维度详情（面板内部展开）
// ================================================================

// 雷达图配置（放大版 - 维度信息直接标注在图上）
const RADAR_CONFIG = {
  center: { x: 170, y: 170 },
  maxRadius: 125,
  levels: 4,
  angles: [
    -90,   // 认知模式 (顶部)
    -30,   // 行动模式 (右上)
    30,    // 时间节律 (右下)
    90,    // 能量模型 (底部)
    150,   // 情绪状态 (左下)
    -150,  // 环境社交 (左上)
  ],
  labels: ['认知模式', '行动模式', '时间节律', '能量模型', '情绪状态', '环境社交'],
};

function _degToRad(deg) {
  return deg * Math.PI / 180;
}

function _getRadarPoint(angleDeg, score) {
  const radius = (score / 100) * RADAR_CONFIG.maxRadius;
  const rad = _degToRad(angleDeg);
  return {
    x: RADAR_CONFIG.center.x + radius * Math.cos(rad),
    y: RADAR_CONFIG.center.y + radius * Math.sin(rad),
  };
}

// 渲染雷达图网格
function renderRadarGrid() {
  const gridGroup = document.getElementById('radarGrid');
  const labelsGroup = document.getElementById('radarLabels');
  if (!gridGroup || !labelsGroup) return;

  // 生成多层多边形网格
  let gridHTML = '';
  for (let i = 1; i <= RADAR_CONFIG.levels; i++) {
    const ratio = i / RADAR_CONFIG.levels;
    const points = RADAR_CONFIG.angles.map(angle => {
      const pt = _getRadarPoint(angle, ratio * 100);
      return `${pt.x},${pt.y}`;
    }).join(' ');
    gridHTML += `<polygon points="${points}" />`;
  }

  // 生成轴线
  RADAR_CONFIG.angles.forEach(angle => {
    const outer = _getRadarPoint(angle, 100);
    gridHTML += `<line x1="${RADAR_CONFIG.center.x}" y1="${RADAR_CONFIG.center.y}"
                    x2="${outer.x}" y2="${outer.y}" />`;
  });

  gridGroup.innerHTML = gridHTML;

  // 生成维度标签（带图标 + 名称 + 分数，直接显示在图上）
  // 根据角度动态调整标签距离，确保左右两侧不被遮挡
  let labelsHTML = '';
  RADAR_CONFIG.angles.forEach((angle, i) => {
    // 计算标签距离中心的半径：顶部/底部远一些，左右两侧近一些
    const absAngle = Math.abs(angle);
    let labelRadius;
    if (absAngle <= 30 || absAngle >= 150) {
      // 顶部和底部区域，标签可以放远一点
      labelRadius = 130;
    } else if (absAngle <= 60 || absAngle >= 120) {
      // 斜角区域
      labelRadius = 122;
    } else {
      // 左右两侧区域，向内收
      labelRadius = 115;
    }
    const labelPt = _getRadarPoint(angle, labelRadius);

    // 文字对齐方式
    let anchor = 'middle';
    if (angle > -60 && angle < 60) anchor = 'start';
    else if (angle > 120 || angle < -120) anchor = 'end';

    const dimId = RADAR_DIMENSIONS[i];
    const meta = UCM8_DIMENSIONS_META.find(m => m.id === dimId) || {};
    const score = Math.round(_personaData?.dimensions?.[dimId] || 50);

    // 标签分两行：图标+名称 在上，分数 在下
    labelsHTML += `
      <g class="radar-label-group" data-dim="${dimId}"
         onclick="selectDimension('${dimId}')" style="cursor:pointer;">
        <text x="${labelPt.x}" y="${labelPt.y - 1}" text-anchor="${anchor}"
              class="radar-label-name">
          <tspan class="radar-label-icon">${meta.icon || '📊'}</tspan>
          <tspan> ${RADAR_CONFIG.labels[i]}</tspan>
        </text>
        <text x="${labelPt.x}" y="${labelPt.y + 11}" text-anchor="${anchor}"
              class="radar-label-score">
          ${score}分
        </text>
      </g>
    `;
  });
  labelsGroup.innerHTML = labelsHTML;
}

// 渲染雷达图数据
function renderRadarChart(dimensions) {
  const dataPolygon = document.getElementById('radarData');
  const dotsGroup = document.getElementById('radarDots');
  if (!dataPolygon || !dotsGroup) return;

  const scores = RADAR_DIMENSIONS.map(dimId => {
    return Math.round(dimensions[dimId] || 50);
  });

  // 动画：从中心展开
  let progress = 0;
  const animate = () => {
    progress += 0.03;
    if (progress > 1) progress = 1;

    const animPoints = scores.map((score, i) => {
      const pt = _getRadarPoint(RADAR_CONFIG.angles[i], score * progress);
      return `${pt.x},${pt.y}`;
    });
    dataPolygon.setAttribute('points', animPoints.join(' '));

    // 更新数据点
    dotsGroup.innerHTML = scores.map((score, i) => {
      const pt = _getRadarPoint(RADAR_CONFIG.angles[i], score * progress);
      const dimId = RADAR_DIMENSIONS[i];
      return `<circle cx="${pt.x}" cy="${pt.y}" r="6"
                      data-dim="${dimId}"
                      onclick="selectDimension('${dimId}')"
                      style="opacity: ${progress}"/>`;
    }).join('');

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  animate();
}

// 渲染维度条形列表
function renderDimensionList(dimensions) {
  const list = document.getElementById('dimensionList');
  if (!list) return;

  let html = '';
  RADAR_DIMENSIONS.forEach(dimId => {
    const meta = UCM8_DIMENSIONS_META.find(m => m.id === dimId) || {};
    const score = Math.round(dimensions[dimId] || 50);

    html += `
      <div class="dimension-bar-item" data-dim="${dimId}" onclick="selectDimension('${dimId}')">
        <div class="dim-icon">${meta.icon || '📊'}</div>
        <div class="dim-info">
          <div class="dim-name">${meta.label || dimId}</div>
          <div class="dim-bar-track">
            <div class="dim-bar-fill" style="width: ${score}%"></div>
          </div>
        </div>
        <div class="dim-score">${score}</div>
      </div>
    `;
  });

  list.innerHTML = html;
}

/**
 * 选择维度（在人格罗盘内部展开详情，从底部滑入）
 * @param {string} dimId - 维度 ID
 */
function selectDimension(dimId) {
  _currentDetailDim = dimId;
  renderDimensionDetail(dimId);

  // 高亮选中的维度（条形列表 - 兼容旧代码）
  document.querySelectorAll('.dimension-bar-item').forEach(el => {
    el.classList.toggle('active', el.dataset.dim === dimId);
  });

  // 高亮雷达图数据点
  document.querySelectorAll('.radar-dots circle').forEach(el => {
    el.classList.toggle('active', el.dataset.dim === dimId);
  });

  // 高亮雷达图标签组
  document.querySelectorAll('.radar-label-group').forEach(el => {
    el.classList.toggle('active', el.dataset.dim === dimId);
  });

  // 显示维度详情面板（叠加在雷达图上）
  const detailPanel = document.getElementById('aiDimensionDetail');
  if (detailPanel) {
    detailPanel.classList.add('open');
  }
}

/**
 * 关闭维度详情面板
 */
function closeDimensionDetail() {
  _currentDetailDim = null;
  const detailPanel = document.getElementById('aiDimensionDetail');
  if (detailPanel) {
    detailPanel.classList.remove('open');
  }

  // 清除高亮
  document.querySelectorAll('.dimension-bar-item').forEach(el => {
    el.classList.remove('active');
  });
  document.querySelectorAll('.radar-dots circle').forEach(el => {
    el.classList.remove('active');
  });
  document.querySelectorAll('.radar-label-group').forEach(el => {
    el.classList.remove('active');
  });
}

// 兼容旧函数名
function closeDetailPanel() {
  closeDimensionDetail();
}

/**
 * 渲染维度详情内容
 * @param {string} dimId - 维度 ID
 */
function renderDimensionDetail(dimId) {
  const content = document.getElementById('dimensionDetailInner');
  if (!content) return;

  const detail = DIMENSION_DETAILS[dimId];
  if (!detail) {
    content.innerHTML = `<div style="padding:20px;text-align:center;color:#98A1AD;">暂无详情</div>`;
    return;
  }

  const score = _personaData?.dimensions?.[dimId] || 60;

  content.innerHTML = `
    <div class="detail-header">
      <div class="detail-title">
        <span>${detail.icon}</span>
        ${detail.label}
      </div>
      <button class="detail-back-btn" onclick="closeDimensionDetail()" title="返回">
        ←
      </button>
    </div>

    <div class="detail-score-big">
      <span class="detail-score-num">${score}</span>
      <span class="detail-score-unit">/ 100 分</span>
    </div>

    <div class="detail-desc">${detail.description}</div>

    <div class="detail-section">
      <div class="detail-section-title">
        <span class="icon">📝</span>
        行为证据
      </div>
      <div class="evidence-list">
        ${detail.evidence.map((ev, i) => `
          <div class="evidence-item ${ev.confirmed ? 'confirmed' : ''}"
               onclick="toggleEvidence('${dimId}', ${i}, this)">
            <div class="evidence-checkbox">✓</div>
            <div>
              <div class="evidence-text">${ev.text}</div>
              <div class="evidence-date">${ev.date}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">
        <span class="icon">💡</span>
        这会怎样影响你？
      </div>
      <div class="impact-card">
        <div class="impact-text">${detail.impact}</div>
      </div>
    </div>

    <button class="correct-btn" onclick="correctDimension('${dimId}')">
      🔄 修正当前理解
    </button>
  `;
}

// 切换证据确认状态
function toggleEvidence(dimId, index, el) {
  el.classList.toggle('confirmed');
  const detail = DIMENSION_DETAILS[dimId];
  if (detail && detail.evidence[index]) {
    detail.evidence[index].confirmed = !detail.evidence[index].confirmed;
  }
}

// 修正维度理解
function correctDimension(dimId) {
  const detail = DIMENSION_DETAILS[dimId];
  setEyeState('thinking');
  showInsightWithClouds(`好的，让我重新理解你的${detail?.label || dimId}...`);

  setTimeout(() => {
    setEyeState('success', { temporaryMs: 1500, returnState: 'neutral' });
    showInsightWithClouds(`已更新对你${detail?.label || dimId}的理解。`);
    showToast('修正成功，AI 会重新理解这个维度', 'success');
  }, 2000);
}

// 生成完整人格画像（点击总结句时触发）
function generatePersonaDetail() {
  setEyeState('thinking');
  showInsightWithClouds('正在生成你的人格画像...');

  setTimeout(() => {
    setEyeState('speaking');
    showInsightWithClouds(DEFAULT_PERSONA.summary + ' 你擅长结构化思考，行动力强，适合需要快速迭代的工作方式。');
    // 选中第一个维度作为入口
    selectDimension('cognitive_mode');
  }, 1500);
}

// 根据人格数据生成一句状态总结
function generateStatusSummary(dimensions) {
  if (!dimensions) return '正在观察你的状态...';

  const cognitive = dimensions.cognitive_mode || 50;
  const action = dimensions.action_mode || 50;
  const energy = dimensions.energy_model || 50;
  const emotion = dimensions.emotional_state || 50;

  let status = '';

  // 根据最高的两个维度生成描述
  const dims = [
    { key: 'cognitive', label: '认知', value: cognitive },
    { key: 'action', label: '行动', value: action },
    { key: 'energy', label: '能量', value: energy },
    { key: 'emotion', label: '情绪', value: emotion },
  ];
  dims.sort((a, b) => b.value - a.value);
  const top1 = dims[0];
  const top2 = dims[1];

  // 根据分数档位生成描述
  if (top1.value >= 70) {
    status = `${top1.label}在线，${top2.label}充盈`;
  } else if (top1.value >= 55) {
    status = `节奏稳定，${top1.label}在线`;
  } else if (top1.value >= 40) {
    status = `状态平稳，${top1.label}蓄能中`;
  } else {
    status = '正在恢复能量中';
  }

  return '当前状态：' + status;
}

// 渲染人格画像数据
function renderPersonaData() {
  // 优先使用真实数据，否则用默认数据
  if (!_personaData) {
    _personaData = { ...DEFAULT_PERSONA };
  }

  renderRadarGrid();
  renderRadarChart(_personaData.dimensions);

  const summaryEl = document.getElementById('personaSummary');
  if (summaryEl) {
    summaryEl.textContent = _personaData.summary;
  }

  // 更新底部状态总结行
  const statusLineEl = document.getElementById('personaStatusLine');
  if (statusLineEl) {
    const statusText = statusLineEl.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = generateStatusSummary(_personaData.dimensions);
    }
  }
}

// ================================================================
//  十、语音命令执行系统（V4 增强核心功能）
//  支持各页面命令集 + 按名称执行命令
// ================================================================

// 各页面支持的命令定义
const PAGE_COMMANDS = {
  today: {
    name: '今日页面',
    commands: [
      {
        id: 'add_task',
        patterns: ['添加任务', '新建任务', '创建任务', '加一个任务', '添加待办', '新任务', '加任务'],
        params: [{ name: 'title', type: 'text', prompt: '任务内容' }],
        description: '添加一个新任务',
        action: (params) => {
          const title = params.title || '新任务';
          if (typeof window.addTask === 'function') {
            window.addTask(title);
          }
          return { success: true, message: `已添加任务：${title}` };
        }
      },
      {
        id: 'delete_task',
        patterns: ['删除任务', '移除任务', '删掉任务'],
        params: [{ name: 'index', type: 'number', prompt: '第几个任务' }],
        description: '删除指定任务',
        action: (params) => {
          if (typeof window.deleteTask === 'function') {
            window.deleteTask(params.index);
          }
          return { success: true, message: `已删除第 ${params.index || 1} 个任务` };
        }
      },
      {
        id: 'complete_task',
        patterns: ['完成任务', '标记完成', '打勾', '搞定了', '做完了', '任务完成'],
        params: [{ name: 'index', type: 'number', prompt: '第几个任务' }],
        description: '标记任务为已完成',
        action: (params) => {
          if (typeof window.completeTask === 'function') {
            window.completeTask(params.index);
          }
          return { success: true, message: `已标记第 ${params.index || 1} 个任务为完成` };
        }
      },
      {
        id: 'generate_plan',
        patterns: ['生成计划', '生成今日计划', '安排今天', '规划今天', '今日计划'],
        params: [],
        description: '生成今日计划',
        action: () => {
          if (typeof window.generateTodayPlan === 'function') {
            window.generateTodayPlan();
          } else if (typeof window.generatePlan === 'function') {
            window.generatePlan();
          } else {
            // 模拟点击生成计划按钮
            const btn = document.querySelector('.gen-plan-btn');
            if (btn) btn.click();
          }
          return { success: true, message: '正在为你生成今日计划...' };
        }
      },
      {
        id: 'switch_view',
        patterns: ['切换视图', '切换日视图', '切换周视图', '日视图', '周视图'],
        params: [{ name: 'view', type: 'text', prompt: '日/周' }],
        description: '切换日/周视图',
        action: (params) => {
          const view = params.view?.includes('周') ? 'week' : 'day';
          if (typeof window.switchView === 'function') {
            window.switchView('today', view);
          }
          return { success: true, message: `已切换到${view === 'week' ? '周视图' : '日视图'}` };
        }
      },
      {
        id: 'set_deadline',
        patterns: ['修改截止时间', '改截止日期', '设置截止时间'],
        params: [
          { name: 'index', type: 'number', prompt: '第几个任务' },
          { name: 'time', type: 'text', prompt: '新的截止时间' }
        ],
        description: '修改任务截止时间',
        action: (params) => {
          return { success: true, message: `已修改第 ${params.index || 1} 个任务的截止时间为 ${params.time || '未指定'}` };
        }
      },
    ]
  },
  timeline: {
    name: '时间线页面',
    commands: [
      {
        id: 'add_event',
        patterns: ['添加事件', '新建事件', '添加活动', '新建活动', '加一个事件'],
        params: [
          { name: 'title', type: 'text', prompt: '事件标题' },
          { name: 'time', type: 'text', prompt: '时间' }
        ],
        description: '添加事件到时间线',
        action: (params) => {
          const title = params.title || '新事件';
          return { success: true, message: `已添加事件：${title}${params.time ? `（${params.time}）` : ''}` };
        }
      },
      {
        id: 'scroll_to_time',
        patterns: ['滚动到', '跳到', '跳转到', '定位到', '看一下'],
        params: [{ name: 'time', type: 'text', prompt: '时间点' }],
        description: '滚动到指定时间',
        action: (params) => {
          const time = params.time || '现在';
          // 如果页面有 scrollToTime 函数则调用
          if (typeof window.scrollToTime === 'function') {
            window.scrollToTime(time);
          }
          return { success: true, message: `已滚动到 ${time}` };
        }
      },
      {
        id: 'zoom_in',
        patterns: ['放大', '放大视图', '放大时间', '拉近', '更详细'],
        params: [],
        description: '放大时间线视图',
        action: () => {
          if (typeof window.zoomIn === 'function') {
            window.zoomIn();
          }
          return { success: true, message: '已放大视图' };
        }
      },
      {
        id: 'zoom_out',
        patterns: ['缩小', '缩小视图', '缩小时间', '拉远', '看整体', '看全天'],
        params: [],
        description: '缩小时间线视图',
        action: () => {
          if (typeof window.zoomOut === 'function') {
            window.zoomOut();
          }
          return { success: true, message: '已缩小视图' };
        }
      },
      {
        id: 'generate_plan',
        patterns: ['生成计划', '生成今日计划', '安排今天', '规划今天'],
        params: [],
        description: '生成今日计划',
        action: () => {
          const btn = document.getElementById('gen-plan-btn');
          if (btn) btn.click();
          return { success: true, message: '正在为你生成今日计划...' };
        }
      },
      {
        id: 'toggle_fast_mode',
        patterns: ['快速模式', '开启快速截图', '关闭快速截图', '快速截图'],
        params: [],
        description: '切换快速截图模式',
        action: () => {
          const toggle = document.getElementById('fast-mode-toggle');
          if (toggle) toggle.click();
          return { success: true, message: '已切换快速截图模式' };
        }
      },
    ]
  },
  compass: {
    name: '罗盘页面',
    commands: [
      {
        id: 'show_dimension',
        patterns: ['切换维度', '查看', '打开', '显示维度', '看一下'],
        params: [{ name: 'dimId', type: 'text', prompt: '维度名称' }],
        description: '显示某维度详情',
        action: (params) => {
          const dimName = params.dimId || '';
          if (typeof window.selectDimension === 'function') {
            // 尝试匹配维度
            const dimMap = {
              '认知': 'cognitive_mode', '认知模式': 'cognitive_mode',
              '行动': 'action_mode', '行动模式': 'action_mode',
              '时间': 'time_rhythm', '时间节律': 'time_rhythm',
              '能量': 'energy_model', '能量模型': 'energy_model',
              '情绪': 'emotional_state', '情绪状态': 'emotional_state',
              '环境': 'env_social', '环境社交': 'env_social',
            };
            let matchedDim = null;
            for (const [key, id] of Object.entries(dimMap)) {
              if (dimName.includes(key)) {
                matchedDim = id;
                break;
              }
            }
            if (matchedDim) {
              window.selectDimension(matchedDim);
            }
          }
          return { success: true, message: `正在打开${dimName || '指定'}维度详情` };
        }
      },
      {
        id: 'generate_report',
        patterns: ['生成报告', '导出报告', '生成分析报告', '人格报告'],
        params: [],
        description: '生成人格分析报告',
        action: () => {
          return { success: true, message: '正在生成你的人格分析报告...' };
        }
      },
    ]
  },
  review: {
    name: '复盘页面',
    commands: [
      {
        id: 'switch_review',
        patterns: ['切换早复盘', '切换晚复盘', '早上复盘', '晚上复盘', '早间复盘', '晚间复盘', '切换复盘'],
        params: [{ name: 'type', type: 'text', prompt: '早/晚' }],
        description: '切换早晚复盘',
        action: (params) => {
          const type = params.type?.includes('早') ? '早复盘' : '晚复盘';
          if (typeof window.switchView === 'function') {
            const viewId = params.type?.includes('早') ? 'morning' : 'evening';
            window.switchView('review', viewId);
          }
          return { success: true, message: `已切换到${type}` };
        }
      },
      {
        id: 'add_content',
        patterns: ['添加复盘', '写复盘', '记录复盘', '添加反思', '记一笔'],
        params: [{ name: 'text', type: 'text', prompt: '复盘内容' }],
        description: '添加复盘内容',
        action: (params) => {
          return { success: true, message: '已添加复盘内容' };
        }
      },
      {
        id: 'generate_summary',
        patterns: ['生成总结', '生成复盘总结', '生成本周总结', '总结一下'],
        params: [],
        description: '生成复盘总结',
        action: () => {
          return { success: true, message: '正在生成复盘总结...' };
        }
      },
    ]
  },
  canvas: {
    name: '画布页面',
    commands: [
      {
        id: 'add_note',
        patterns: ['添加便签', '新建便签', '加便签', '添加笔记', '新建笔记'],
        params: [{ name: 'content', type: 'text', prompt: '便签内容' }],
        description: '添加一个便签',
        action: (params) => {
          if (typeof window.addStickyNote === 'function') {
            window.addStickyNote(params.content);
          }
          return { success: true, message: `已添加便签：${params.content || '新便签'}` };
        }
      },
      {
        id: 'zoom_in',
        patterns: ['放大', '放大视图'],
        params: [],
        description: '放大画布',
        action: () => ({ success: true, message: '已放大画布' }),
      },
      {
        id: 'zoom_out',
        patterns: ['缩小', '缩小视图'],
        params: [],
        description: '缩小画布',
        action: () => ({ success: true, message: '已缩小画布' }),
      },
    ]
  },
};

/**
 * 按命令名称直接执行命令
 * @param {string} commandId - 命令 ID
 * @param {object} params - 命令参数
 * @returns {object} 执行结果
 */
function executeCommandByName(commandId, params) {
  const pageId = getCurrentPageId();
  const pageConfig = PAGE_COMMANDS[pageId];
  if (!pageConfig) {
    return { success: false, message: '当前页面暂不支持语音命令' };
  }

  const cmd = pageConfig.commands.find(c => c.id === commandId);
  if (!cmd) {
    return { success: false, message: `未找到命令：${commandId}` };
  }

  try {
    return cmd.action(params || {});
  } catch (e) {
    console.error('命令执行失败:', e);
    return { success: false, message: '命令执行失败' };
  }
}

// 解析并执行命令
function parseAndExecuteCommand(text, pageId) {
  const page = pageId || getCurrentPageId();
  const pageConfig = PAGE_COMMANDS[page];

  if (!pageConfig) {
    return { success: false, isCommand: false, message: '当前页面暂不支持语音命令' };
  }

  let matchedCommand = null;
  let matchedScore = 0;
  let matchedParams = {};

  // 遍历所有命令，匹配关键词
  for (const cmd of pageConfig.commands) {
    for (const pattern of cmd.patterns) {
      if (text.includes(pattern)) {
        const score = pattern.length; // 简单的匹配分数：关键词越长越精确
        if (score > matchedScore) {
          matchedScore = score;
          matchedCommand = cmd;

          // 提取参数
          matchedParams = _extractParams(text, pattern, cmd.params);
        }
      }
    }
  }

  if (!matchedCommand) {
    return { success: false, isCommand: false, message: '未识别到可执行命令' };
  }

  // 执行命令
  try {
    const result = matchedCommand.action(matchedParams);
    return {
      success: result.success,
      isCommand: true,
      command: matchedCommand.id,
      message: result.message,
      params: matchedParams,
    };
  } catch (e) {
    console.error('命令执行失败:', e);
    return { success: false, isCommand: true, command: matchedCommand.id, message: '命令执行失败' };
  }
}

// 简单的参数提取
function _extractParams(text, pattern, paramDefs) {
  const params = {};
  if (!paramDefs || paramDefs.length === 0) return params;

  // 移除匹配的关键词，剩余的作为第一个文本参数
  let remaining = text.replace(pattern, '').trim();

  // 去掉常见的前缀词
  remaining = remaining.replace(/^(给我|帮我|把|将|为|对|请)/, '').trim();

  for (const param of paramDefs) {
    if (param.type === 'text' && remaining) {
      params[param.name] = remaining;
      break; // 简单处理：只提取第一个文本参数
    }
    if (param.type === 'number') {
      const numMatch = text.match(/第?\s*(\d+)\s*[个条项]/);
      if (numMatch) {
        params[param.name] = parseInt(numMatch[1]);
      }
    }
  }

  return params;
}

// ================================================================
//  十一、AI 消息发送 & 语音输入（保留并增强）
// ================================================================

let _aiInputMode = 'text'; // 'text' | 'voice'
let _aiRecording = false;
let _aiPollTimer = null;
let _aiStreamId = null;
let _aiAudioContext = null;
let _aiAudioSource = null;
let _aiScriptProcessor = null;
let _aiAudioStream = null;
let _aiPCMBuffer = [];
const AI_TARGET_SAMPLE_RATE = 16000;

// 输入模式切换
function toggleAIIO() {
  const textWrap = document.getElementById('aiTextInputWrap');
  const voiceWrap = document.getElementById('aiVoiceWrap');

  if (_aiInputMode === 'text') {
    _aiInputMode = 'voice';
    if (textWrap) textWrap.style.display = 'none';
    if (voiceWrap) voiceWrap.style.display = 'flex';
  } else {
    _aiInputMode = 'text';
    if (textWrap) textWrap.style.display = '';
    if (voiceWrap) voiceWrap.style.display = 'none';
    if (_aiRecording) stopVoiceInput();
  }
}

// 启动语音输入
async function startVoiceInput() {
  if (_aiRecording) return;

  const voiceBtn = document.getElementById('aiVoiceBtn');
  const voiceText = voiceBtn ? voiceBtn.querySelector('.ai-voice-text') : null;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('当前浏览器不支持录音，请使用 Chrome 或 Edge 浏览器');
    return;
  }

  try {
    // 眼睛状态变为 listening
    setEyeState('listening');

    if (voiceBtn) voiceBtn.classList.add('recording');
    if (voiceText) voiceText.textContent = '正在听...';

    // 请求麦克风权限
    _aiAudioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    // 尝试调用后端开始流式语音识别
    try {
      const startResp = await fetch('/api/voice/stream-start', { method: 'POST' });
      const startData = await startResp.json();
      if (startData && startData.ok) {
        _aiStreamId = startData.stream_id || 'default';
      }
    } catch (e) {
      // 后端不可用时静默继续（演示模式）
    }

    _aiRecording = true;
    _aiPCMBuffer = [];

    // 使用 AudioContext 获取 PCM 数据
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    _aiAudioContext = new AudioContext({ sampleRate: AI_TARGET_SAMPLE_RATE });

    const actualSampleRate = _aiAudioContext.sampleRate;
    _aiAudioSource = _aiAudioContext.createMediaStreamSource(_aiAudioStream);

    const bufferSize = actualSampleRate === AI_TARGET_SAMPLE_RATE ? 4096 : 8192;
    _aiScriptProcessor = _aiAudioContext.createScriptProcessor(bufferSize, 1, 1);

    _aiScriptProcessor.onaudioprocess = (e) => {
      if (!_aiRecording) return;
      const inputData = e.inputBuffer.getChannelData(0);
      let pcm16;
      if (actualSampleRate === AI_TARGET_SAMPLE_RATE) {
        pcm16 = _floatToInt16PCM(inputData);
      } else {
        const resampled = _resample(inputData, actualSampleRate, AI_TARGET_SAMPLE_RATE);
        pcm16 = _floatToInt16PCM(resampled);
      }
      _sendPCMChunk(pcm16);
    };

    _aiAudioSource.connect(_aiScriptProcessor);
    _aiScriptProcessor.connect(_aiAudioContext.destination);

    // 轮询识别结果
    pollVoiceResult();

  } catch (err) {
    console.error('启动语音识别失败:', err);
    alert('无法访问麦克风，请检查权限设置');
    _cleanupVoiceInput();
    setEyeState('neutral');
    if (voiceBtn) voiceBtn.classList.remove('recording');
    if (voiceText) voiceText.textContent = '按下说话';
  }
}

function _floatToInt16PCM(floatData) {
  const int16 = new Int16Array(floatData.length);
  for (let i = 0; i < floatData.length; i++) {
    let s = Math.max(-1, Math.min(1, floatData[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16;
}

function _resample(inputData, fromRate, toRate) {
  const ratio = fromRate / toRate;
  const newLength = Math.round(inputData.length / ratio);
  const output = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const idx = i * ratio;
    const idx0 = Math.floor(idx);
    const idx1 = Math.min(idx0 + 1, inputData.length - 1);
    const frac = idx - idx0;
    output[i] = inputData[idx0] * (1 - frac) + inputData[idx1] * frac;
  }
  return output;
}

let _aiSendQueue = Promise.resolve();
function _sendPCMChunk(pcm16) {
  if (!_aiRecording) return;
  const buffer = pcm16.buffer;
  _aiSendQueue = _aiSendQueue.then(() => {
    if (!_aiRecording) return;
    return fetch('/api/voice/stream-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: buffer
    }).catch(() => {});
  });
}

function pollVoiceResult() {
  if (_aiPollTimer) clearInterval(_aiPollTimer);
  _aiPollTimer = setInterval(async () => {
    if (!_aiRecording) {
      clearInterval(_aiPollTimer);
      _aiPollTimer = null;
      return;
    }
    try {
      const resp = await fetch('/api/voice/stream-status');
      const data = await resp.json();
      const voiceBtn = document.getElementById('aiVoiceBtn');
      const voiceText = voiceBtn ? voiceBtn.querySelector('.ai-voice-text') : null;
      if (data.partial && voiceText) {
        voiceText.textContent = data.partial.length > 10 ? data.partial.slice(-10) + '...' : data.partial;
      }
      if (data.text && voiceText) {
        voiceText.textContent = data.text.length > 10 ? data.text.slice(-10) + '...' : data.text;
      }
    } catch (e) {}
  }, 300);
}

function _cleanupVoiceInput() {
  _aiRecording = false;
  if (_aiScriptProcessor) {
    try { _aiScriptProcessor.disconnect(); } catch(e) {}
    _aiScriptProcessor = null;
  }
  if (_aiAudioSource) {
    try { _aiAudioSource.disconnect(); } catch(e) {}
    _aiAudioSource = null;
  }
  if (_aiAudioContext) {
    try { _aiAudioContext.close(); } catch(e) {}
    _aiAudioContext = null;
  }
  if (_aiAudioStream) {
    _aiAudioStream.getTracks().forEach(t => t.stop());
    _aiAudioStream = null;
  }
  if (_aiPollTimer) {
    clearInterval(_aiPollTimer);
    _aiPollTimer = null;
  }
}

// 停止语音输入
async function stopVoiceInput() {
  if (!_aiRecording) return;

  const voiceBtn = document.getElementById('aiVoiceBtn');
  const voiceText = voiceBtn ? voiceBtn.querySelector('.ai-voice-text') : null;

  _cleanupVoiceInput();

  if (voiceBtn) voiceBtn.classList.remove('recording');
  if (voiceText) voiceText.textContent = '按下说话';

  // 等待发送队列完成
  try { await _aiSendQueue; } catch (e) {}

  // 通知后端停止并获取结果
  let recognizedText = '';
  try {
    const resp = await fetch('/api/voice/stream-stop', { method: 'POST' });
    const data = await resp.json();
    if (data && data.text && data.text.trim()) {
      recognizedText = data.text.trim();
    }
  } catch (e) {
    console.error('停止语音识别失败:', e);
  }

  // 眼睛状态：思考中
  setEyeState('thinking');

  if (recognizedText) {
    // 尝试解析并执行命令
    const cmdResult = parseAndExecuteCommand(recognizedText);

    if (cmdResult.isCommand) {
      // 是命令，直接执行
      if (cmdResult.success) {
        setEyeState('success', { temporaryMs: 1500, returnState: 'neutral' });
        showInsightWithClouds(cmdResult.message);
        showToast(cmdResult.message, 'success');
      } else {
        setEyeState('error', { temporaryMs: 1500, returnState: 'neutral' });
        showToast(cmdResult.message, 'error');
      }
    } else {
      // 不是命令，正常发送给 AI 聊天
      setTimeout(() => sendAIMessage(recognizedText, null), 300);
    }
  } else {
    setEyeState('neutral');
  }
}

// AI 消息发送
async function sendAIMessage(text, inputEl) {
  if (!text || !text.trim()) return;

  if (inputEl) {
    inputEl.value = '';
    inputEl.placeholder = '伴伴思考中...';
  }

  setEyeState('thinking');

  try {
    const pageId = getCurrentPageId();

    // 先尝试解析命令
    const cmdResult = parseAndExecuteCommand(text, pageId);
    if (cmdResult.isCommand) {
      if (cmdResult.success) {
        setEyeState('success', { temporaryMs: 1500, returnState: 'neutral' });
        showInsightWithClouds(cmdResult.message);
        showToast(cmdResult.message, 'success');
      } else {
        setEyeState('error', { temporaryMs: 1500, returnState: 'neutral' });
        showToast(cmdResult.message, 'error');
      }
      if (inputEl) inputEl.placeholder = '你想做什么';
      return;
    }

    // 不是命令，正常聊天
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        stream: false,
        page: pageId,
        context: { page: pageId }
      })
    });
    const data = await res.json();
    if (data.reply || data.response) {
      const reply = data.reply || data.response;
      setEyeState('speaking');
      showInsightWithClouds(reply);

      // 说完后恢复平静
      setTimeout(() => {
        setEyeState('neutral');
      }, 3000);
    }
  } catch (e) {
    console.error('AI 回复失败:', e);
    setEyeState('neutral');
  } finally {
    if (inputEl) {
      inputEl.placeholder = '你想做什么';
    }
  }
}

// ================================================================
//  十二、加载 AI 面板内容（API 调用）
// ================================================================

const AI_LOADING_TEXT = '伴伴正在思考...';
const AI_FALLBACK_INSIGHT = '还在了解你中...';
const AI_INSIGHT_REFRESH_INTERVAL = 30 * 60 * 1000;

async function loadAIInsight() {
  const data = await API.get('/api/engine/cognition');
  if (data && data.cognition_text) {
    showInsightWithClouds(data.cognition_text);
  }
}

async function loadUCM8Profile() {
  try {
    const data = await API.get('/api/ucm8/profile');
    if (data && data.ok && data.profile && data.profile.dimensions) {
      _personaData = {
        summary: data.profile.summary || DEFAULT_PERSONA.summary,
        dimensions: data.profile.dimensions,
      };
      // 只有人格罗盘展开时才渲染
      if (_personaExpanded) {
        renderPersonaData();
      }
    }
  } catch (e) {
    console.error('加载 UCM-8 画像失败:', e);
  }
}

function loadAIPanelContent() {
  // 加载人格画像数据（静默加载，展开时显示）
  loadUCM8Profile();
  // 加载认知 insight（显示云朵）
  setTimeout(() => {
    loadAIInsight();
  }, 2000); // 延迟 2 秒显示，给用户适应时间

  // 每 30 分钟自动刷新
  if (!window._aiSuggestionRefreshTimer) {
    window._aiSuggestionRefreshTimer = setInterval(() => {
      loadAIInsight();
    }, AI_INSIGHT_REFRESH_INTERVAL);
  }
}

// ================================================================
//  十三、通用工具函数
// ================================================================

function formatDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatTime(d = new Date()) {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function showToast(msg, type = 'info', duration = 2500) {
  let toast = document.getElementById('__toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = '__toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${msg}</span>`;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// API 调用封装
const API = {
  async get(url) {
    try {
      const res = await fetch(url);
      return res.ok ? await res.json() : null;
    } catch { return null; }
  },
  async post(url, body) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
      });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  },
  async put(url, body) {
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
      });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  },
  async del(url) {
    try {
      const res = await fetch(url, { method: 'DELETE' });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  }
};

// ================================================================
//  十四、页面头部渲染
// ================================================================

function renderPageHeader(title, date, subtitle, showControls = true) {
  const today = new Date();
  const dateStr = date || `${today.getFullYear()}年${today.getMonth()+1}月${today.getDate()}日 星期${'日一二三四五六'[today.getDay()]}`;
  const weekday = today.getDay() === 0 || today.getDay() === 6 ? '今天是休息日' : '今天是工作日';
  const _icon = typeof BanbanIcon !== 'undefined'
    ? (k) => BanbanIcon.get(k)
    : () => '';

  return `
    <div class="page-header">
      <div>
        <div class="page-title">${title}</div>
        <div class="page-date">${dateStr}</div>
      </div>
      ${showControls ? `
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
        <div class="header-controls">
          <div class="date-picker">${_icon('action_prev')} ${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')} 周${'日一二三四五六'[today.getDay()]} ${_icon('action_next')}</div>
          <div class="today-btn">${_icon('time_calendar')} 今天</div>
          <button class="gen-plan-btn">${_icon('action_generate')} 生成今日计划</button>
        </div>
        <div style="font-size:12px;color:var(--text-tertiary);">${weekday}</div>
      </div>
      ` : ''}
    </div>
    ${subtitle ? `<div class="page-subtitle">${subtitle}</div>` : ''}
  `;
}

// ================================================================
//  十五、页面初始化
// ================================================================

function initPage(activeNav, options = {}) {
  const sidebarHTML = renderSidebar(activeNav);
  const aiOptions = Object.assign({}, options.ai || {}, { pageId: activeNav });
  const aiHTML = renderAIPanel(aiOptions);
  const headerHTML = options.header ? renderPageHeader(
    options.header.title || '',
    options.header.date,
    options.header.subtitle,
    options.header.showControls !== false
  ) : '';

  // 替换 placeholder 元素
  const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
  if (sidebarPlaceholder) sidebarPlaceholder.outerHTML = sidebarHTML;

  const aiPlaceholder = document.getElementById('ai-placeholder');
  if (aiPlaceholder) aiPlaceholder.outerHTML = aiHTML;

  const headerPlaceholder = document.getElementById('header-placeholder');
  if (headerPlaceholder) headerPlaceholder.outerHTML = headerHTML;

  // 初始化动效系统 + 异步加载 AI 面板真实数据
  setTimeout(() => {
    initAnimationSystem();
    // 侧边栏常驻显示，立即初始化眼睛系统
    initEyeSystem();
    loadAIPanelContent();
  }, 50);
}

// ================================================================
//  十六、动效系统
// ================================================================

function initAnimationSystem() {
  initRipple();
  initScrollReveal();
  initButtonFeedback();
  initCheckboxAnim();
  initAIPanelInteractions();
  initGenPlanBtnNavigation();
}

// 为动态生成的列表补充分段入场动画；允许页面在数据加载后重复调用。
function addStaggerAnimation(container) {
  if (!container) return;
  container.classList.remove('stagger');
  // 强制刷新一次动画状态，确保异步替换内容后仍能播放。
  void container.offsetWidth;
  container.classList.add('stagger');
}

// 生成每日计划按钮导航：非今日计划页面点击后跳转到今日计划页面
function initGenPlanBtnNavigation() {
  const path = window.location.pathname;
  const isTodayPage = path === '/today' || path === '/today.html' || path.endsWith('/today');
  
  // 如果已经是今日计划页面，不做处理（由页面自身逻辑处理）
  if (isTodayPage) return;
  
  // 使用捕获阶段确保优先执行
  document.addEventListener('click', function(e) {
    // 同时匹配 class 和 id 为 gen-plan-btn 的按钮
    const btn = e.target.closest('.gen-plan-btn, #gen-plan-btn');
    if (!btn) return;
    
    // 阻止事件冒泡和默认行为，避免页面自身的逻辑执行
    e.stopPropagation();
    e.preventDefault();
    e.stopImmediatePropagation();
    
    // 跳转到今日计划页面
    window.location.href = '/today';
  }, true); // true = 捕获阶段
}

function initRipple() {
  document.querySelectorAll('.btn-primary, .btn-secondary, .gen-plan-btn, .ripple-btn').forEach(btn => {
    if (btn._rippleBound) return;
    btn._rippleBound = true;
    btn.classList.add('ripple-btn');
    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

function initScrollReveal() {
  const items = document.querySelectorAll('.scroll-reveal');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('revealed'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  items.forEach(el => observer.observe(el));
}

function initButtonFeedback() {
  document.querySelectorAll('.hover-shrink').forEach(btn => {
    if (btn._shrinkBound) return;
    btn._shrinkBound = true;
    btn.addEventListener('click', function() {
      this.style.transform = 'scale(0.96)';
      setTimeout(() => { this.style.transform = ''; }, 150);
    });
  });
}

function initCheckboxAnim() {
  document.querySelectorAll('.checkbox-anim').forEach(cb => {
    if (cb._cbBound) return;
    cb._cbBound = true;
    cb.addEventListener('click', function() {
      this.classList.toggle('checked');
      if (this.onToggle) this.onToggle(this.classList.contains('checked'));
    });
  });
}

function initAIPanelInteractions() {
  const aiInput = document.querySelector('.ai-input');
  if (!aiInput || aiInput._aiBound) return;
  aiInput._aiBound = true;

  aiInput.addEventListener('focus', function() {
    this.style.boxShadow = '0 0 0 3px rgba(47, 128, 237, 0.1)';
  });
  aiInput.addEventListener('blur', function() {
    this.style.boxShadow = '';
  });
}

// 数字滚动动画
function animateNumber(el, target, duration = 1200, suffix = '') {
  if (!el) return;
  const start = 0;
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(start + (target - start) * eased);
    el.innerHTML = value + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// 骨架屏
function createSkeleton(container, count = 3) {
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'skeleton skeleton-card';
    s.style.marginBottom = '12px';
    container.appendChild(s);
  }
}

// 打字机指示器
function showTypingIndicator(container) {
  if (!container) return;
  const dots = document.createElement('div');
  dots.className = 'typing-dots';
  dots.innerHTML = '<span></span><span></span><span></span>';
  container.appendChild(dots);
  return dots;
}

// 渐入替换内容
function fadeInReplace(container, newHTML) {
  if (!container) return;
  container.style.opacity = '0';
  container.style.transition = 'opacity 0.25s ease';
  setTimeout(() => {
    container.innerHTML = newHTML;
    container.style.opacity = '1';
  }, 250);
}

// ================================================================
//  十七、双视图切换系统
// ================================================================

let _currentView = {};

function initDualView(pageId, views, defaultView = null) {
  const container = document.querySelector('.view-container');
  const toggle = document.querySelector('.view-toggle');
  if (!container) return;

  const viewIds = views.map(v => v.id);
  const initialView = defaultView || viewIds[0];
  _currentView[pageId] = initialView;

  viewIds.forEach((id) => {
    const pane = document.getElementById(`view-${id}`);
    if (pane) {
      pane.classList.toggle('active', id === initialView);
    }
  });

  if (toggle) {
    const btns = toggle.querySelectorAll('.view-toggle-btn');
    btns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === initialView);
    });
  }
}

function switchView(pageId, viewId) {
  const container = document.querySelector('.view-container');
  const toggle = document.querySelector('.view-toggle');
  if (!container) return;

  const currentView = _currentView[pageId];
  if (currentView === viewId) return;

  const currentPane = document.getElementById(`view-${currentView}`);
  const targetPane = document.getElementById(`view-${viewId}`);
  if (!targetPane) return;

  const allPanes = container.querySelectorAll('.view-pane');
  const viewIds = Array.from(allPanes).map(p => p.id.replace('view-', ''));
  const currentIndex = viewIds.indexOf(currentView);
  const targetIndex = viewIds.indexOf(viewId);
  const direction = targetIndex > currentIndex ? 'up' : 'down';

  if (currentPane) currentPane.classList.remove('active');
  targetPane.classList.add('active');
  targetPane.classList.remove('slide-up', 'slide-down');
  targetPane.offsetHeight;
  targetPane.classList.add(direction === 'up' ? 'slide-up' : 'slide-down');

  _currentView[pageId] = viewId;

  if (toggle) {
    const btns = toggle.querySelectorAll('.view-toggle-btn');
    btns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewId);
    });
  }

  const event = new CustomEvent('viewchanged', {
    detail: { pageId, viewId, previousView: currentView, direction }
  });
  document.dispatchEvent(event);
}

function renderViewToggle(views, activeView, pageId) {
  const btns = views.map(v => `
    <button class="view-toggle-btn ${v.id === activeView ? 'active' : ''}"
            data-view="${v.id}"
            onclick="switchView('${pageId}', '${v.id}')">
      ${v.icon || ''}
      <span>${v.label}</span>
    </button>
  `).join('');

  return `
    <div class="view-toggle">
      ${btns}
    </div>
  `;
}

function renderFloatViewSwitch(pageId) {
  return `
    <div class="view-switch-float">
      <button class="view-switch-btn" data-direction="up" onclick="switchViewByDirection('${pageId}', 'up')" title="上一个视图">
        <i class="ti ti-chevron-up"></i>
      </button>
      <button class="view-switch-btn" data-direction="down" onclick="switchViewByDirection('${pageId}', 'down')" title="下一个视图">
        <i class="ti ti-chevron-down"></i>
      </button>
    </div>
  `;
}

function switchViewByDirection(pageId, direction) {
  const container = document.querySelector('.view-container');
  if (!container) return;
  const allPanes = container.querySelectorAll('.view-pane');
  const viewIds = Array.from(allPanes).map(p => p.id.replace('view-', ''));
  const currentView = _currentView[pageId] || viewIds[0];
  const currentIndex = viewIds.indexOf(currentView);
  let targetIndex;
  if (direction === 'up') {
    targetIndex = Math.max(0, currentIndex - 1);
  } else {
    targetIndex = Math.min(viewIds.length - 1, currentIndex + 1);
  }
  if (targetIndex !== currentIndex) {
    switchView(pageId, viewIds[targetIndex]);
  }
}
