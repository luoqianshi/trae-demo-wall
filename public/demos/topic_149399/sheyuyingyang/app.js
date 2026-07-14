/* ============================================================
   舌语 · 中医体质辨识 - 主应用
   单页应用：基于 hash 路由 + 组件式渲染
   ============================================================ */

(function () {
  'use strict';

  // ============= 工具函数 =============
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // HTML 转义，防止 XSS
  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // 日期工具
  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatDateZh(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const weeks = ['日', '一', '二', '三', '四', '五', '六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 · 周${weeks[d.getDay()]}`;
  }

  function timeAgo(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    return `${Math.floor(diff / 86400)} 天前`;
  }

  // LocalStorage
  const STORAGE_KEYS = {
    answers: 'tcm_answers',
    report: 'tcm_report',
    checkins: 'tcm_checkins',
    achievements: 'tcm_achievements',
    posts: 'tcm_posts',
    meta: 'tcm_meta',
    tracking: 'tcm_tracking',
    interact: 'tcm_interact',
    emotionRecords: 'tcm_emotion_records',
    exerciseCheckins: 'tcm_exercise_checkins',
  };

  const Store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(STORAGE_KEYS[key]);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try {
        localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
      } catch (e) { /* quota or disabled */ }
    },
    remove(key) { localStorage.removeItem(STORAGE_KEYS[key]); },
  };

  // ============= 全局状态 =============
  const State = {
    currentPage: 'guide',       // 当前页面
    currentQuestion: 0,         // 问卷当前题号
    answers: [],                // 答案数组
    selectedOption: null,       // 当前题目选中的选项
    activeStep: 1,              // 引导页当前激活的步骤
    expandedMeal: null,         // 打卡页当前展开的餐次
    communityTab: 'posts',      // 社区页 tab: posts / achievements
    posts: [],                  // 社区帖子
    checkins: {},               // 打卡记录（按日期）
    achievements: {},           // 成就状态
    meta: {                     // 用户元数据
      totalMeals: 0,
      streak: 0,
      lastCheckinDate: null,
      shared: false,
      likedPosts: 0,
      myPosts: 0,
    },
    report: null,               // 最新报告
    scanning: false,            // 是否处于扫描动画中
    trackingRecords: [],        // 体质追踪记录
    showTrackingForm: false,    // 是否显示追踪表单
    recipeSymptom: '',          // 食谱页当前选中的症状标签
    interactTab: 'all',         // 交互区 tab: all / checkin / experience
    interactPosts: [],           // 交互区帖子
    selectedEmotion: null,      // 当前选中的情志
    emotionRecords: [],          // 情志记录历史
    expandedExercise: null,      // 当前展开的运动
    exerciseCheckins: {},        // 运动打卡记录
    selectedSeason: null,        // 当前选中的季节
  };

  // 初始化状态
  function initState() {
    State.answers = Store.get('answers', []);
    State.report = Store.get('report', null);
    State.checkins = Store.get('checkins', {});
    State.achievements = Store.get('achievements', {});
    State.posts = Store.get('posts', null) || window.MOCK_POSTS.slice();
    State.meta = Object.assign({
      totalMeals: 0, streak: 0, lastCheckinDate: null,
      shared: false, likedPosts: 0, myPosts: 0,
    }, Store.get('meta', {}) || {});

    State.trackingRecords = Store.get('tracking', []);

    // 新页面状态初始化
    State.interactPosts = Store.get('interact', null) || (window.MOCK_INTERACTIONS ? window.MOCK_INTERACTIONS.slice() : []);
    State.emotionRecords = Store.get('emotionRecords', []);
    State.exerciseCheckins = Store.get('exerciseCheckins', {});
    State.selectedSeason = getCurrentSeason();

    // 数据兼容：为旧数据补 fullness 字段
    Object.keys(State.checkins).forEach((date) => {
      ['breakfast', 'lunch', 'dinner'].forEach((meal) => {
        if (State.checkins[date][meal] && typeof State.checkins[date][meal].fullness === 'undefined') {
          State.checkins[date][meal].fullness = null;
        }
      });
    });

    // 计算连续打卡天数（简化：基于历史记录长度）
    if (Object.keys(State.checkins).length > 0) {
      const dates = Object.keys(State.checkins).sort();
      let streak = 0;
      const d = new Date();
      while (true) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (State.checkins[key] && (State.checkins[key].breakfast.personalExp || State.checkins[key].lunch.personalExp || State.checkins[key].dinner.personalExp)) {
          streak++;
          d.setDate(d.getDate() - 1);
        } else {
          break;
        }
      }
      State.meta.streak = streak;

      // 累计餐数
      let total = 0;
      Object.values(State.checkins).forEach((c) => {
        if (c.breakfast && c.breakfast.personalExp) total++;
        if (c.lunch && c.lunch.personalExp) total++;
        if (c.dinner && c.dinner.personalExp) total++;
      });
      State.meta.totalMeals = total;
    }
  }

  function saveAll() {
    Store.set('answers', State.answers);
    Store.set('report', State.report);
    Store.set('checkins', State.checkins);
    Store.set('achievements', State.achievements);
    Store.set('posts', State.posts);
    Store.set('meta', State.meta);
    Store.set('tracking', State.trackingRecords);
    Store.set('interact', State.interactPosts);
    Store.set('emotionRecords', State.emotionRecords);
    Store.set('exerciseCheckins', State.exerciseCheckins);
  }

  // ============= 路由 =============
  const ROUTES = ['guide', 'questionnaire', 'analyzing', 'report', 'checkin', 'community', 'recipes', 'tracking', 'interact', 'seasonal', 'emotion', 'exercise'];

  function getRoute() {
    const hash = location.hash.replace('#/', '').replace('#', '');
    return ROUTES.includes(hash) ? hash : 'guide';
  }

  function navigate(page) {
    location.hash = `/${page}`;
  }

  window.addEventListener('hashchange', () => {
    State.currentPage = getRoute();
    if (State.currentPage === 'questionnaire') {
      State.currentQuestion = 0;
      State.selectedOption = null;
    }
    render();
  });

  // ============= 渲染主入口 =============
  function render() {
    const app = $('#app');
    if (!app) return;
    State.currentPage = getRoute();
    let html = '';
    switch (State.currentPage) {
      case 'guide': html = renderGuide(); break;
      case 'questionnaire': html = renderQuestionnaire(); break;
      case 'analyzing': html = renderAnalyzing(); break;
      case 'report': html = renderReport(); break;
      case 'checkin': html = renderCheckIn(); break;
      case 'community': html = renderCommunity(); break;
      case 'recipes': html = renderRecipes(); break;
      case 'tracking': html = renderTracking(); break;
      case 'interact': html = renderInteract(); break;
      case 'seasonal': html = renderSeasonal(); break;
      case 'emotion': html = renderEmotion(); break;
      case 'exercise': html = renderExercise(); break;
      default: html = renderGuide();
    }
    app.innerHTML = html;
    bindPage();
    // 滚动到顶部
    const page = app.querySelector('.page');
    if (page) page.scrollTop = 0;
  }

  // ============= 吐司提示 =============
  function showToast(msg, duration = 2000) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('toast--show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove('toast--show'), duration);
  }

  // ============= 图标库（内联 SVG）=============
  const Icons = {
    arrowLeft: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
    arrowRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    heart: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    heartFill: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    message: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    share: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    camera: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    sun: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
    ruler: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 8.7L8.7 21.3a2.4 2.4 0 0 1-3.4 0L2.7 18.7a2.4 2.4 0 0 1 0-3.4L15.3 2.7a2.4 2.4 0 0 1 3.4 0l2.6 2.6a2.4 2.4 0 0 1 0 3.4z"/><path d="M7.5 10.5l2 2M10.5 7.5l2 2M13.5 4.5l2 2M4.5 13.5l2 2"/></svg>',
    eye: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    plus: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    chevronDown: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    alert: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    flame: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    book: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    chart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    closeX: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    trending: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  };

  // 模拟舌头 SVG（根据当前激活的步骤细微变化）
  function tongueSVG(progress = 0) {
    // progress: 0~1, 舌头颜色从浅到深
    const r = 245 - Math.floor(progress * 10);
    const g = 180 - Math.floor(progress * 30);
    const b = 165 - Math.floor(progress * 25);
    return `
      <svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
        <defs>
          <radialGradient id="tg" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="rgb(${r},${g},${b})"/>
            <stop offset="80%" stop-color="rgb(${r - 30},${g - 20},${b - 15})"/>
            <stop offset="100%" stop-color="rgb(${r - 50},${g - 40},${b - 30})"/>
          </radialGradient>
          <filter id="ts"><feGaussianBlur stdDeviation="0.5"/></filter>
        </defs>
        <!-- 舌头主体 -->
        <ellipse cx="100" cy="70" rx="70" ry="55" fill="url(#tg)" filter="url(#ts)"/>
        <!-- 舌面纹理（裂纹） -->
        <path d="M 60 50 Q 80 55 100 50" stroke="rgba(180,100,90,0.3)" stroke-width="1" fill="none"/>
        <path d="M 100 60 Q 120 65 140 60" stroke="rgba(180,100,90,0.3)" stroke-width="1" fill="none"/>
        <path d="M 70 80 Q 90 85 110 80" stroke="rgba(180,100,90,0.25)" stroke-width="0.8" fill="none"/>
        <path d="M 110 85 Q 125 88 135 85" stroke="rgba(180,100,90,0.2)" stroke-width="0.8" fill="none"/>
        <!-- 舌苔（小白点） -->
        <circle cx="80" cy="55" r="2" fill="rgba(255,255,255,0.6)"/>
        <circle cx="115" cy="65" r="1.5" fill="rgba(255,255,255,0.5)"/>
        <circle cx="95" cy="75" r="1.8" fill="rgba(255,255,255,0.5)"/>
        <circle cx="125" cy="80" r="1.2" fill="rgba(255,255,255,0.5)"/>
        <circle cx="70" cy="85" r="1.5" fill="rgba(255,255,255,0.45)"/>
        <circle cx="105" cy="50" r="1.2" fill="rgba(255,255,255,0.4)"/>
        <circle cx="140" cy="72" r="1" fill="rgba(255,255,255,0.4)"/>
        <!-- 舌尖红润 -->
        <ellipse cx="100" cy="115" rx="35" ry="15" fill="rgba(220,100,100,0.25)"/>
        <!-- 中央纵向纹理（齿痕） -->
        <line x1="100" y1="40" x2="100" y2="100" stroke="rgba(160,80,70,0.15)" stroke-width="0.5" stroke-dasharray="2 2"/>
      </svg>
    `;
  }

  // ============= 页面 1：舌诊引导页 =============
  function renderGuide() {
    const steps = window.GUIDE_STEPS;
    const activeStep = State.activeStep || 1;
    return `
      <div class="page">
        <div class="guide fade-in">
          <div class="guide__hero">
            <div class="guide__eyebrow">Tongue · Diagnosis</div>
            <h1 class="guide__title">观舌识<em>体质</em></h1>
            <p class="guide__subtitle">三步引导，开启您的中医体质辨识之旅</p>
          </div>

          <div class="guide__steps">
            ${steps.map((s) => `
              <div class="step ${activeStep === s.num ? 'step--active' : ''}" data-step="${s.num}">
                <div class="step__num">${s.num}</div>
                <div class="step__title">${esc(s.title)}</div>
                <div class="step__desc">${esc(s.desc)}</div>
                <div class="step__icon">${
                  s.icon === 'light' ? Icons.sun :
                  s.icon === 'angle' ? Icons.eye :
                  Icons.ruler
                }</div>
              </div>
            `).join('')}
          </div>

          <div class="tongue-preview">
            <div class="tongue-preview__label">
              <span class="tongue-preview__label-title">舌象预览</span>
              <span class="tongue-preview__label-status">实时模拟</span>
            </div>
            <div class="tongue-canvas">
              <div class="tongue-grid"></div>
              <div class="tongue-corner tongue-corner--tl"></div>
              <div class="tongue-corner tongue-corner--tr"></div>
              <div class="tongue-corner tongue-corner--bl"></div>
              <div class="tongue-corner tongue-corner--br"></div>
              <div class="tongue-shape">${tongueSVG(activeStep / 3)}</div>
              <div class="scan-line"></div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;font-size:11px;color:var(--c-ink-3);opacity:0.6;letter-spacing:0.1em;">
              <span>设备：内置摄像头</span>
              <span>${activeStep}/3</span>
            </div>
          </div>

          <button class="btn btn--primary btn--full" id="btn-shoot" style="margin-top:auto">
            <span class="btn-icon">${Icons.camera}</span>
            <span>开始拍摄</span>
          </button>

          <div style="text-align:center;margin-top:16px;font-size:11px;color:var(--c-ink-3);opacity:0.5;letter-spacing:0.1em;">
            点击上方步骤可查看拍摄要点
          </div>
        </div>
      </div>
    `;
  }

  function bindGuide() {
    $$('.step').forEach((el) => {
      el.addEventListener('click', () => {
        State.activeStep = parseInt(el.dataset.step, 10);
        render();
      });
    });
    const btn = $('#btn-shoot');
    if (btn) btn.addEventListener('click', startScan);
  }

  // ============= 扫描动画 =============
  function startScan() {
    if (State.scanning) return;
    State.scanning = true;
    const app = $('#app');
    const overlay = document.createElement('div');
    overlay.className = 'scan-overlay';
    overlay.innerHTML = `
      <div class="scan-stage">
        <div class="scan-ring scan-ring--1"></div>
        <div class="scan-ring scan-ring--2"></div>
        <div class="scan-ring scan-ring--3"></div>
        <div class="scan-target">${tongueSVG(1)}</div>
        <div class="scan-beam"></div>
      </div>
      <div class="scan-text">
        <div class="scan-text__title">AI 采集中</div>
        <div class="scan-text__progress">
          <span id="scan-percent">0%</span>
          <div class="scan-text__bar"><div class="scan-text__bar-fill" id="scan-fill"></div></div>
        </div>
      </div>
      <div class="scan-logs" id="scan-logs"></div>
    `;
    document.body.appendChild(overlay);

    const fill = $('#scan-fill');
    const pct = $('#scan-percent');
    const logs = $('#scan-logs');
    const messages = [
      '> 初始化舌象识别模型 v3.2 ...',
      '> 加载舌质分类器 (CNN-ResNet50) ...',
      '> 加载舌苔检测器 (U-Net) ...',
      '> 加载中医体质映射模型 ...',
      '> 图像预处理：去噪 + 白平衡 ...',
      '> 检测舌质颜色：rgb(245, 180, 165) ...',
      '> 识别舌苔厚度：中厚腻 (置信度 92%) ...',
      '> 检测齿痕：阳性 (3 处) ...',
      '> 综合分析体质倾向 ...',
      '> 匹配中医体质数据库 ...',
      '> 正在生成体质报告 ...',
    ];

    const startTime = Date.now();
    const duration = 2500;
    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < messages.length) {
        const line = document.createElement('div');
        line.className = 'scan-logs__line';
        line.textContent = messages[logIndex];
        logs.appendChild(line);
        // 限制最多 5 行
        while (logs.children.length > 5) logs.removeChild(logs.firstChild);
        logIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 230);

    function updateProgress() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const percent = Math.floor(progress * 100);
      fill.style.width = percent + '%';
      pct.textContent = percent + '%';

      if (progress < 1) {
        requestAnimationFrame(updateProgress);
      } else {
        clearInterval(logInterval);
        setTimeout(() => {
          overlay.style.opacity = '0';
          overlay.style.transition = 'opacity 0.4s';
          setTimeout(() => {
            overlay.remove();
            State.scanning = false;
            navigate('questionnaire');
          }, 400);
        }, 200);
      }
    }
    requestAnimationFrame(updateProgress);
  }

  // ============= 页面 2：中医问诊 =============
  function renderQuestionnaire() {
    const total = window.QUESTIONS.length;
    const idx = State.currentQuestion;
    const q = window.QUESTIONS[idx];
    const progress = ((idx) / (total - 1)) * 100;
    const isLast = idx === total - 1;

    return `
      <div class="page">
        <div class="q">
          <div class="nav">
            <button class="nav__back" id="q-back">${Icons.arrowLeft}</button>
            <div class="nav__title">中医问诊</div>
            <div style="width:36px"></div>
          </div>

          <div class="q__header">
            <div class="q__step">第 <strong>${idx + 1}</strong> / ${total} 题</div>
            <div class="q__progress">
              <div class="q__progress-fill" style="width:${progress}%"></div>
            </div>
          </div>

          <div class="q__card" key="q-${idx}">
            <div class="q__eyebrow">${esc(q.eyebrow)}</div>
            <h2 class="q__title">${esc(q.title)}</h2>
            <p class="q__hint">${esc(q.hint)}</p>

            <div class="q__options">
              ${q.options.map((opt, i) => `
                <button class="option ${State.selectedOption === i ? 'option--selected' : ''}" data-opt="${i}" data-value="${esc(opt.value)}">
                  <div class="option__icon">${String.fromCharCode(65 + i)}</div>
                  <div class="option__label">${esc(opt.label)}</div>
                  <div class="option__check">${State.selectedOption === i ? Icons.check : ''}</div>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="q__footer">
            <button class="btn btn--secondary btn--sm" id="q-prev" ${idx === 0 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>
              ${Icons.arrowLeft}<span style="margin-left:4px">上一题</span>
            </button>
            <button class="btn ${isLast ? 'btn--apricot' : 'btn--primary'}" id="q-next" ${State.selectedOption === null ? 'disabled style="opacity:0.4;"' : ''}>
              <span>${isLast ? '生成报告' : '下一题'}</span>
              ${isLast ? '' : Icons.arrowRight}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function bindQuestionnaire() {
    $$('.option').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.opt, 10);
        State.selectedOption = idx;
        // 重新渲染以更新选中状态
        render();
      });
    });

    const next = $('#q-next');
    if (next) next.addEventListener('click', () => {
      if (State.selectedOption === null) return;
      const q = window.QUESTIONS[State.currentQuestion];
      State.answers[State.currentQuestion] = q.options[State.selectedOption].value;
      const isLast = State.currentQuestion === window.QUESTIONS.length - 1;
      if (isLast) {
        // 生成报告
        Store.set('answers', State.answers);
        navigate('analyzing');
      } else {
        State.currentQuestion++;
        State.selectedOption = null;
        render();
      }
    });

    const prev = $('#q-prev');
    if (prev) prev.addEventListener('click', () => {
      if (State.currentQuestion > 0) {
        State.currentQuestion--;
        State.selectedOption = null;
        render();
      }
    });

    const back = $('#q-back');
    if (back) back.addEventListener('click', () => navigate('guide'));
  }

  // ============= 页面 3：AI 分析加载 =============
  function renderAnalyzing() {
    return `
      <div class="page" style="background:linear-gradient(180deg, #1A1F1B 0%, #0E1310 100%);min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;color:var(--c-cream);position:relative;overflow:hidden;">
        <div class="scan-stage" style="margin-bottom:32px;">
          <div class="scan-ring scan-ring--1"></div>
          <div class="scan-ring scan-ring--2"></div>
          <div class="scan-ring scan-ring--3"></div>
          <div class="scan-target">${tongueSVG(1)}</div>
          <div class="scan-beam"></div>
        </div>

        <div style="text-align:center;position:relative;z-index:1;width:100%;max-width:340px;">
          <div style="font-family:var(--font-serif);font-size:22px;letter-spacing:0.3em;margin-bottom:8px;color:var(--c-cream);">深度分析中</div>
          <div style="font-size:12px;color:var(--c-sage-2);opacity:0.8;letter-spacing:0.1em;margin-bottom:32px;">AI 结合中医辨证体系综合研判</div>

          <div id="ai-logs" style="font-family:'Courier New',monospace;font-size:11px;color:var(--c-sage-2);opacity:0.6;text-align:left;background:rgba(143,166,142,0.06);border:1px solid rgba(143,166,142,0.15);border-radius:14px;padding:16px;min-height:200px;line-height:1.7;">
          </div>
        </div>
      </div>
    `;
  }

  function bindAnalyzing() {
    const logs = [
      '> 加载用户答卷数据 ...',
      '> 5 道问诊题目已完成采集',
      '',
      '> 启动体质判定引擎 ...',
      '> [Q1] 起居观察：身体沉重、容易疲倦',
      '> [Q2] 饮食偏好：油腻、甜腻',
      '> [Q3] 舌象自查：舌苔白厚腻，有齿痕',
      '> [Q4] 排泄状况：大便稀溏、粘滞',
      '> [Q5] 体型与精神：体形偏胖，腹部松软',
      '',
      '> 体质倾向加权计算中 ...',
      '> 痰湿：14 · 湿热：4 · 气虚：5 · 阳虚：3 · 阴虚：1',
      '',
      '> 判定结果：痰湿体质（置信度 92%）',
      '> 匹配饮食建议数据库 ...',
      '> 生成个性化调理方案 ...',
      '',
      '> 分析完成 ✓',
    ];
    const container = $('#ai-logs');
    if (!container) return;
    let i = 0;
    const total = logs.length;
    const interval = setInterval(() => {
      if (i < total) {
        const line = document.createElement('div');
        line.textContent = logs[i];
        line.style.opacity = '0';
        line.style.animation = 'logFade 0.3s var(--ease-out) forwards';
        container.appendChild(line);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          // 生成报告数据
          const type = window.determineConstitution(State.answers);
          State.report = {
            type,
            ...window.CONSTITUTIONS[type],
            createdAt: new Date().toISOString(),
          };
          Store.set('report', State.report);
          // 解锁"初识体质"成就
          unlockAchievement('first');
          navigate('report');
        }, 400);
      }
    }, 150);
  }

  // ============= 页面 4：体质报告 =============
  function renderReport() {
    const r = State.report;
    if (!r) {
      // 兜底：未生成报告时重定向
      setTimeout(() => navigate('guide'), 0);
      return '<div class="page"></div>';
    }

    return `
      <div class="page">
        <div class="report">
          <div class="nav">
            <button class="nav__back" id="r-back">${Icons.arrowLeft}</button>
            <div class="nav__title">体质报告</div>
            <div class="nav__action" id="r-share">${Icons.share}<span style="margin-left:4px;">分享</span></div>
          </div>

          <div class="report__hero">
            <div class="report__seal">TONGUE · DIAGNOSIS</div>
            <div class="report__title">${esc(r.name)}</div>
            <div class="report__subtitle">${esc(r.pinyin)}</div>
            <div class="report__badge">
              <span style="font-size:14px">📋</span>
              <span>基于舌诊 · 中医问诊综合判定</span>
            </div>
          </div>

          <div class="report__score">
            ${r.features.map((f) => `
              <div class="report__score-item">
                <div class="report__score-num" style="font-size:14px;font-weight:600;letter-spacing:0.05em;">${esc(f.value)}</div>
                <div class="report__score-label">${esc(f.label)}</div>
              </div>
            `).join('')}
          </div>

          <div class="report__section">
            <div class="report__section-title">体质特征</div>
            <div class="report__desc">${esc(r.description)}</div>
          </div>

          <div class="report__section">
            <div class="report__section-title">饮食建议</div>
            <div class="diet-list">
              ${r.advice.map((a) => `
                <div class="diet-item diet-item--${a.cls}">
                  <div class="diet-item__tag">
                    <div class="diet-item__tag-icon">${a.icon}</div>
                    <div>${esc(a.tag)}</div>
                  </div>
                  <div class="diet-item__body">
                    <div class="diet-item__food">${esc(a.food)}</div>
                    <div class="diet-item__desc">${esc(a.desc)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="disclaimer">
            <div class="disclaimer__icon">${Icons.alert}</div>
            <div class="disclaimer__text">
              <strong>免责声明：</strong>本报告基于中医体质辨识理论及模拟 AI 分析得出，结果仅供参考学习，不能替代专业医师的诊断与治疗。如有明显不适或疾病，请及时就医，遵循医嘱。
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;">
            <button class="btn btn--secondary btn--sm" id="r-goto-recipes">
              <span class="btn-icon">${Icons.book}</span>
              <span>食谱推荐</span>
            </button>
            <button class="btn btn--secondary btn--sm" id="r-goto-tracking">
              <span class="btn-icon">${Icons.chart}</span>
              <span>体质追踪</span>
            </button>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">
            <button class="btn btn--secondary btn--sm" id="r-goto-interact">
              <span class="btn-icon">${Icons.message}</span>
              <span>评论互动</span>
            </button>
            <button class="btn btn--secondary btn--sm" id="r-goto-seasonal">
              <span class="btn-icon">${Icons.sun}</span>
              <span>顺时养生</span>
            </button>
            <button class="btn btn--secondary btn--sm" id="r-goto-emotion">
              <span class="btn-icon">${Icons.heart}</span>
              <span>情志记录</span>
            </button>
            <button class="btn btn--secondary btn--sm" id="r-goto-exercise">
              <span class="btn-icon">${Icons.flame}</span>
              <span>跟练打卡</span>
            </button>
          </div>

          <div class="report__actions">
            <button class="btn btn--secondary" id="r-recheck">
              <span>重新测评</span>
            </button>
            <button class="btn btn--primary" id="r-goto-checkin">
              <span>开始打卡</span>
              ${Icons.arrowRight}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function bindReport() {
    $('#r-back')?.addEventListener('click', () => navigate('guide'));
    $('#r-share')?.addEventListener('click', () => {
      State.meta.shared = true;
      saveAll();
      unlockAchievement('share');
      showToast('报告已复制到剪贴板');
    });
    $('#r-recheck')?.addEventListener('click', () => {
      if (confirm('确定要重新开始测评吗？')) {
        State.answers = [];
        State.currentQuestion = 0;
        State.selectedOption = null;
        Store.remove('answers');
        navigate('guide');
      }
    });
    $('#r-goto-checkin')?.addEventListener('click', () => navigate('checkin'));
    $('#r-goto-recipes')?.addEventListener('click', () => navigate('recipes'));
    $('#r-goto-tracking')?.addEventListener('click', () => navigate('tracking'));
    $('#r-goto-interact')?.addEventListener('click', () => navigate('interact'));
    $('#r-goto-seasonal')?.addEventListener('click', () => navigate('seasonal'));
    $('#r-goto-emotion')?.addEventListener('click', () => navigate('emotion'));
    $('#r-goto-exercise')?.addEventListener('click', () => navigate('exercise'));
  }

  // ============= 页面 5：饮食打卡 =============
  function renderCheckIn() {
    const date = today();
    let rec = State.checkins[date];
    if (!rec) {
      rec = {
        date,
        breakfast: { tcm: window.MEAL_TCM_ADVICE.breakfast.tcm, personalExp: '', othersExp: window.MEAL_OTHERS_EXP.breakfast[0].text, fullness: null },
        lunch: { tcm: window.MEAL_TCM_ADVICE.lunch.tcm, personalExp: '', othersExp: window.MEAL_OTHERS_EXP.lunch[0].text, fullness: null },
        dinner: { tcm: window.MEAL_TCM_ADVICE.dinner.tcm, personalExp: '', othersExp: window.MEAL_OTHERS_EXP.dinner[0].text, fullness: null },
      };
    }
    State.checkins[date] = rec;
    saveAll();

    const meals = [
      { key: 'breakfast', data: rec.breakfast, info: window.MEAL_TCM_ADVICE.breakfast, others: window.MEAL_OTHERS_EXP.breakfast },
      { key: 'lunch', data: rec.lunch, info: window.MEAL_TCM_ADVICE.lunch, others: window.MEAL_OTHERS_EXP.lunch },
      { key: 'dinner', data: rec.dinner, info: window.MEAL_TCM_ADVICE.dinner, others: window.MEAL_OTHERS_EXP.dinner },
    ];

    const isMealDone = (m) => m.personalExp && m.personalExp.trim().length > 0;
    const doneCount = meals.filter((m) => isMealDone(m.data)).length;

    return `
      <div class="page">
        <div class="checkin">
          <div class="nav">
            <button class="nav__back" id="c-back">${Icons.arrowLeft}</button>
            <div class="nav__title">饮食打卡</div>
            <div style="width:36px"></div>
          </div>

          <div class="checkin__hero">
            <div class="checkin__date">${Icons.calendar}<span>${formatDateZh(date)}</span></div>
            <h1 class="checkin__title">三餐食验</h1>
            <p class="checkin__subtitle">记录每一餐的体感与心得，调理从一日三餐开始</p>
          </div>

          <div class="checkin__summary">
            <div class="summary-item">
              <div class="summary-item__num">${doneCount}</div>
              <div class="summary-item__label">今日已记录</div>
            </div>
            <div class="summary-item">
              <div class="summary-item__num" style="color:var(--c-apricot-2)">${State.meta.streak}</div>
              <div class="summary-item__label">连续打卡</div>
            </div>
            <div class="summary-item">
              <div class="summary-item__num" style="color:var(--c-sage)">${State.meta.totalMeals}</div>
              <div class="summary-item__label">累计餐数</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
            <button class="btn btn--secondary btn--sm" id="c-goto-recipes">
              <span class="btn-icon">${Icons.book}</span>
              <span>药食食谱</span>
            </button>
            <button class="btn btn--secondary btn--sm" id="c-goto-tracking">
              <span class="btn-icon">${Icons.chart}</span>
              <span>体质追踪</span>
            </button>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
            <button class="btn btn--secondary btn--sm" id="c-goto-interact">
              <span class="btn-icon">${Icons.message}</span>
              <span>评论互动</span>
            </button>
            <button class="btn btn--secondary btn--sm" id="c-goto-seasonal">
              <span class="btn-icon">${Icons.sun}</span>
              <span>顺时养生</span>
            </button>
            <button class="btn btn--secondary btn--sm" id="c-goto-emotion">
              <span class="btn-icon">${Icons.heart}</span>
              <span>情志记录</span>
            </button>
            <button class="btn btn--secondary btn--sm" id="c-goto-exercise">
              <span class="btn-icon">${Icons.flame}</span>
              <span>跟练打卡</span>
            </button>
          </div>

          <div class="meals">
            ${meals.map((m) => {
              const done = isMealDone(m.data);
              const open = State.expandedMeal === m.key;
              return `
                <div class="meal ${done ? 'meal--done' : ''} ${open ? 'meal--open' : ''}" data-meal="${m.key}">
                  <div class="meal__head" data-toggle="${m.key}">
                    <div class="meal__head-left">
                      <div class="meal__icon">${m.info.icon}</div>
                      <div>
                        <div class="meal__name">${esc(m.info.title.split('（')[0])}</div>
                        <div class="meal__time">${esc(m.info.title.match(/（(.*?)）/)?.[1] || '')}</div>
                      </div>
                    </div>
                    <div class="meal__status">
                      <span class="meal__status-dot"></span>
                      <span>${done ? '已打卡' : '未打卡'}</span>
                      <span class="meal__chevron">${Icons.chevronDown}</span>
                    </div>
                  </div>
                  <div class="meal__body">
                    <div class="meal__columns">
                      <div class="exp-col exp-col--tcm">
                        <div class="exp-col__head">
                          <span class="exp-col__icon">中</span>
                          <span>中医建议</span>
                        </div>
                        <div class="exp-col__static">${esc(m.info.tcm)}</div>
                      </div>
                      <div class="exp-col exp-col--me">
                        <div class="exp-col__head">
                          <span class="exp-col__icon">我</span>
                          <span>我的体验</span>
                        </div>
                        <textarea class="exp-col__body" data-input="${m.key}" placeholder="记录这餐的食物、感受...">${esc(m.data.personalExp || '')}</textarea>
                      </div>
                      <div class="exp-col exp-col--others">
                        <div class="exp-col__head">
                          <span class="exp-col__icon">他</span>
                          <span>他人经验</span>
                        </div>
                        <div class="exp-col__static" data-others="${m.key}">${esc(m.data.othersExp || m.others[0].text)}</div>
                        <div class="exp-col__static-author">— ${esc(m.others[0].author)}</div>
                        <div style="display:flex;gap:4px;margin-top:6px;">
                          ${m.others.map((_, idx) => `
                            <button class="others-dot" data-others-idx="${idx}" data-meal-key="${m.key}" style="width:18px;height:18px;border-radius:50%;border:1px solid var(--c-line);background:${m.data.othersExp === m.others[idx].text ? 'var(--c-ink)' : 'transparent'};cursor:pointer;font-size:9px;display:flex;align-items:center;justify-content:center;color:${m.data.othersExp === m.others[idx].text ? 'var(--c-cream)' : 'var(--c-ink-3)'};transition:all 0.2s;">${idx + 1}</button>
                          `).join('')}
                        </div>
                      </div>
                    </div>

                    <!-- 饱腹程度评价 -->
                    <div class="meal__fullness">
                      <div class="fullness-title">饱腹程度 · 自评</div>
                      <div class="fullness-options">
                        ${window.FULLNESS_LEVELS.map((lv) => `
                          <button class="fullness-item ${m.data.fullness === lv.value ? 'fullness-item--selected' : ''}" data-fullness="${lv.value}" data-meal="${m.key}">
                            <div class="fullness-item__icon">${lv.icon}</div>
                            <div class="fullness-item__label">${esc(lv.label)}</div>
                            <div class="fullness-item__desc">${esc(lv.criteria)}</div>
                          </button>
                        `).join('')}
                      </div>
                      ${m.data.fullness ? (() => {
                        const lv = window.FULLNESS_LEVELS.find((l) => l.value === m.data.fullness);
                        return lv ? `
                          <div class="fullness-hint">
                            <span class="fullness-hint__icon">📜</span>
                            <span class="fullness-hint__text">${esc(lv.tcmNote)}</span>
                          </div>
                        ` : '';
                      })() : ''}
                    </div>

                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function bindCheckIn() {
    $('#c-back')?.addEventListener('click', () => navigate(State.report ? 'report' : 'guide'));
    $('#c-goto-recipes')?.addEventListener('click', () => navigate('recipes'));
    $('#c-goto-tracking')?.addEventListener('click', () => navigate('tracking'));
    $('#c-goto-interact')?.addEventListener('click', () => navigate('interact'));
    $('#c-goto-seasonal')?.addEventListener('click', () => navigate('seasonal'));
    $('#c-goto-emotion')?.addEventListener('click', () => navigate('emotion'));
    $('#c-goto-exercise')?.addEventListener('click', () => navigate('exercise'));

    $$('.meal__head').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('textarea') || e.target.closest('button')) return;
        const key = el.dataset.toggle;
        State.expandedMeal = State.expandedMeal === key ? null : key;
        render();
      });
    });

    $$('.exp-col__body').forEach((el) => {
      el.addEventListener('input', (e) => {
        const key = el.dataset.input;
        const date = today();
        if (!State.checkins[date]) State.checkins[date] = {
          date,
          breakfast: { tcm: window.MEAL_TCM_ADVICE.breakfast.tcm, personalExp: '', othersExp: window.MEAL_OTHERS_EXP.breakfast[0].text, fullness: null },
          lunch: { tcm: window.MEAL_TCM_ADVICE.lunch.tcm, personalExp: '', othersExp: window.MEAL_OTHERS_EXP.lunch[0].text, fullness: null },
          dinner: { tcm: window.MEAL_TCM_ADVICE.dinner.tcm, personalExp: '', othersExp: window.MEAL_OTHERS_EXP.dinner[0].text, fullness: null },
        };
        State.checkins[date][key].personalExp = e.target.value;
        saveAll();
      });
      el.addEventListener('blur', () => {
        // 失焦时重新渲染以更新打卡状态
        const key = el.dataset.input;
        if (State.checkins[today()] && State.checkins[today()][key] && State.checkins[today()][key].personalExp) {
          showToast('打卡成功 ✓');
          render();
          // 检测成就
          checkMealAchievements();
        }
      });
    });

    $$('.others-dot').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(el.dataset.othersIdx, 10);
        const mealKey = el.dataset.mealKey;
        const date = today();
        const othersList = window.MEAL_OTHERS_EXP[mealKey];
        if (othersList[idx]) {
          if (!State.checkins[date]) State.checkins[date] = {
            date,
            breakfast: { tcm: '', personalExp: '', othersExp: '', fullness: null },
            lunch: { tcm: '', personalExp: '', othersExp: '', fullness: null },
            dinner: { tcm: '', personalExp: '', othersExp: '', fullness: null },
          };
          State.checkins[date][mealKey].othersExp = othersList[idx].text;
          saveAll();
          render();
        }
      });
    });

    // 饱腹程度选择
    $$('.fullness-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const value = parseInt(el.dataset.fullness, 10);
        const mealKey = el.dataset.meal;
        const date = today();
        if (!State.checkins[date]) State.checkins[date] = {
          date,
          breakfast: { tcm: window.MEAL_TCM_ADVICE.breakfast.tcm, personalExp: '', othersExp: window.MEAL_OTHERS_EXP.breakfast[0].text, fullness: null },
          lunch: { tcm: window.MEAL_TCM_ADVICE.lunch.tcm, personalExp: '', othersExp: window.MEAL_OTHERS_EXP.lunch[0].text, fullness: null },
          dinner: { tcm: window.MEAL_TCM_ADVICE.dinner.tcm, personalExp: '', othersExp: window.MEAL_OTHERS_EXP.dinner[0].text, fullness: null },
        };
        State.checkins[date][mealKey].fullness = value;
        saveAll();
        render();
        showToast(`已记录：${value}分饱`);
      });
    });
  }

  function checkMealAchievements() {
    // 重新计算累计餐数
    let total = 0;
    Object.values(State.checkins).forEach((c) => {
      if (c.breakfast && c.breakfast.personalExp) total++;
      if (c.lunch && c.lunch.personalExp) total++;
      if (c.dinner && c.dinner.personalExp) total++;
    });
    State.meta.totalMeals = total;

    // 重新计算连续天数
    const dates = Object.keys(State.checkins).filter((d) => {
      const c = State.checkins[d];
      return c && (c.breakfast.personalExp || c.lunch.personalExp || c.dinner.personalExp);
    }).sort();
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (State.checkins[key] && (State.checkins[key].breakfast.personalExp || State.checkins[key].lunch.personalExp || State.checkins[key].dinner.personalExp)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    State.meta.streak = streak;
    saveAll();

    if (total >= 9) unlockAchievement('meals9');
    if (streak >= 3) unlockAchievement('streak3');
    if (streak >= 7) unlockAchievement('streak7');
  }

  // ============= 页面 6：社区与成就 =============
  function renderCommunity() {
    const tab = State.communityTab;

    // 计算已解锁的徽章
    const stats = {
      report: State.report,
      streak: State.meta.streak,
      totalMeals: State.meta.totalMeals,
      shared: State.meta.shared,
      likedPosts: State.meta.likedPosts,
      myPosts: State.meta.myPosts,
    };

    return `
      <div class="page">
        <div class="community">
          <div class="nav">
            <button class="nav__back" id="co-back">${Icons.arrowLeft}</button>
            <div class="nav__title">社区广场</div>
            <div style="width:36px"></div>
          </div>

          <div class="community__hero">
            <h1 class="community__title">食养同好</h1>
            <p class="community__subtitle">${State.meta.streak} 天连续打卡 · ${State.posts.length} 篇精彩分享</p>
          </div>

          <div class="stats-card">
            <div class="stats-card__head">
              <div class="stats-card__title">我的成就</div>
              <div class="stats-card__streak">
                <span class="stats-card__num">${State.meta.streak}</span>
                <span class="stats-card__unit">天连续打卡 ${Icons.flame}</span>
              </div>
            </div>
            <div class="stats-card__grid">
              <div class="stats-card__item">
                <div class="stats-card__item-num">${State.meta.totalMeals}</div>
                <div class="stats-card__item-label">累计餐数</div>
              </div>
              <div class="stats-card__item">
                <div class="stats-card__item-num">${State.achievements ? Object.values(State.achievements).filter(Boolean).length : 0}</div>
                <div class="stats-card__item-label">已获徽章</div>
              </div>
              <div class="stats-card__item">
                <div class="stats-card__item-num">${State.posts.filter(p => p.mine).length}</div>
                <div class="stats-card__item-label">我的发帖</div>
              </div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0;">
            <button class="btn btn--secondary btn--sm" id="co-goto-recipes">
              <span class="btn-icon">${Icons.book}</span>
              <span>药食食谱</span>
            </button>
            <button class="btn btn--secondary btn--sm" id="co-goto-tracking">
              <span class="btn-icon">${Icons.chart}</span>
              <span>体质追踪</span>
            </button>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 16px;">
            <button class="btn btn--secondary btn--sm" id="co-goto-interact">
              <span class="btn-icon">${Icons.message}</span>
              <span>评论互动</span>
            </button>
            <button class="btn btn--secondary btn--sm" id="co-goto-seasonal">
              <span class="btn-icon">${Icons.sun}</span>
              <span>顺时养生</span>
            </button>
            <button class="btn btn--secondary btn--sm" id="co-goto-emotion">
              <span class="btn-icon">${Icons.heart}</span>
              <span>情志记录</span>
            </button>
            <button class="btn btn--secondary btn--sm" id="co-goto-exercise">
              <span class="btn-icon">${Icons.flame}</span>
              <span>跟练打卡</span>
            </button>
          </div>

          <div class="community__tabs">
            <div class="tab ${tab === 'posts' ? 'tab--active' : ''}" data-tab="posts">交流分享</div>
            <div class="tab ${tab === 'achievements' ? 'tab--active' : ''}" data-tab="achievements">成就徽章</div>
          </div>

          ${tab === 'posts' ? renderPostsTab() : renderAchievementsTab(stats)}
        </div>

        <button class="fab" id="fab-post" title="发布">${Icons.plus}</button>
      </div>
    `;
  }

  function renderPostsTab() {
    return `
      <div class="posts">
        ${State.posts.map((p) => `
          <div class="post" data-post-id="${p.id}">
            <div class="post__head">
              <div class="post__avatar post__avatar--${p.avatarColor || 1}">${esc(p.author[0])}</div>
              <div class="post__meta">
                <div class="post__name">${esc(p.author)} <span class="post__tag">${esc(p.tag)}</span></div>
                <div class="post__time">${esc(p.time)}</div>
              </div>
            </div>
            <div class="post__content">${esc(p.content)}</div>
            <div class="post__actions">
              <div class="post__action ${p.liked ? 'post__action--liked' : ''}" data-like="${p.id}">
                ${p.liked ? Icons.heartFill : Icons.heart}
                <span>${p.likes + (p.liked ? 1 : 0)}</span>
              </div>
              <div class="post__action" data-comment="${p.id}">${Icons.message}<span>${p.comments || 0}</span></div>
              <div class="post__action" data-share-post="${p.id}" style="margin-left:auto">${Icons.share}<span>分享</span></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderAchievementsTab(stats) {
    return `
      <div class="achievements">
        ${window.ACHIEVEMENTS.map((a) => {
          const unlocked = a.check(stats);
          return `
            <div class="achievement ${unlocked ? 'achievement--unlocked' : 'achievement--locked'}">
              <div class="achievement__icon">${a.icon}</div>
              <div class="achievement__name">${esc(a.name)}</div>
              <div class="achievement__desc">${esc(a.desc)}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function bindCommunity() {
    $('#co-back')?.addEventListener('click', () => navigate(State.report ? 'report' : 'guide'));
    $('#co-goto-recipes')?.addEventListener('click', () => navigate('recipes'));
    $('#co-goto-tracking')?.addEventListener('click', () => navigate('tracking'));
    $('#co-goto-interact')?.addEventListener('click', () => navigate('interact'));
    $('#co-goto-seasonal')?.addEventListener('click', () => navigate('seasonal'));
    $('#co-goto-emotion')?.addEventListener('click', () => navigate('emotion'));
    $('#co-goto-exercise')?.addEventListener('click', () => navigate('exercise'));

    $$('.tab').forEach((el) => {
      el.addEventListener('click', () => {
        State.communityTab = el.dataset.tab;
        render();
      });
    });

    $$('[data-like]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.like;
        const post = State.posts.find((p) => p.id === id);
        if (post) {
          post.liked = !post.liked;
          if (post.liked) State.meta.likedPosts++;
          else State.meta.likedPosts = Math.max(0, State.meta.likedPosts - 1);
          saveAll();
          if (State.meta.likedPosts >= 5) unlockAchievement('like5');
          render();
        }
      });
    });

    $$('[data-comment]').forEach((el) => {
      el.addEventListener('click', () => {
        showToast('评论功能即将上线');
      });
    });

    $$('[data-share-post]').forEach((el) => {
      el.addEventListener('click', () => {
        showToast('已分享到外部');
      });
    });

    $('#fab-post')?.addEventListener('click', () => {
      const text = prompt('请输入您想分享的内容：');
      if (text && text.trim()) {
        const newPost = {
          id: 'p' + Date.now(),
          author: '我',
          avatarColor: 1,
          tag: State.report ? State.report.name : '我的分享',
          time: '刚刚',
          content: text.trim(),
          likes: 0,
          liked: false,
          mine: true,
        };
        State.posts.unshift(newPost);
        State.meta.myPosts++;
        saveAll();
        unlockAchievement('post1');
        render();
        showToast('发布成功 ✓');
      }
    });
  }

  // ============= 页面 7：药食同源食谱推荐 =============
  function renderRecipes() {
    const activeSymptom = State.recipeSymptom;
    const constitution = State.report ? State.report.type : null;

    // 匹配食谱
    let recipes = [];
    if (activeSymptom) {
      recipes = window.SYMPTOM_RECIPES.filter((r) => r.tags.includes(activeSymptom));
    } else {
      recipes = window.SYMPTOM_RECIPES.slice(0, 4);
    }

    // 按体质适配排序
    if (constitution) {
      recipes = recipes.slice().sort((a, b) => {
        const aMatch = a.constitutions.includes(constitution) ? 1 : 0;
        const bMatch = b.constitutions.includes(constitution) ? 1 : 0;
        return bMatch - aMatch;
      });
    }

    return `
      <div class="page">
        <div class="recipes">
          <div class="nav">
            <button class="nav__back" id="rec-back">${Icons.arrowLeft}</button>
            <div class="nav__title">药食食谱</div>
            <div style="width:36px"></div>
          </div>

          <div class="recipes__hero">
            <h1 class="recipes__title">对症食养</h1>
            <p class="recipes__subtitle">${constitution ? `当前体质：${esc(constitution)} · ` : ''}选择症状，获取药食同源食谱推荐</p>
          </div>

          <div class="symptom-search">
            <div class="symptom-search__icon">${Icons.search}</div>
            <input class="symptom-search__input" id="symptom-input" type="text" placeholder="输入症状，如：嗳气、反酸、虚弱..." value="${esc(activeSymptom ? (window.SYMPTOM_TAGS.find(s => s.id === activeSymptom)?.label || '') : '')}" />
          </div>

          <div class="symptom-tags">
            ${window.SYMPTOM_TAGS.map((tag) => `
              <button class="symptom-tag ${activeSymptom === tag.id ? 'symptom-tag--active' : ''}" data-symptom="${tag.id}">${esc(tag.label)}</button>
            `).join('')}
          </div>

          ${recipes.length === 0 ? `
            <div class="recipe-empty">
              <div class="recipe-empty__icon">🌿</div>
              <div class="recipe-empty__text">请选择上方症状标签，获取对症食谱推荐</div>
            </div>
          ` : `
            <div class="recipe-list">
              ${recipes.map((r, idx) => `
                <div class="recipe-card" style="animation-delay:${idx * 0.08}s">
                  <div class="recipe-card__head">
                    <div class="recipe-card__icon">${r.icon}</div>
                    <div>
                      <div class="recipe-card__title">${esc(r.name)}</div>
                      <div class="recipe-card__meta">
                        <span class="recipe-card__badge">${esc(r.time)}</span>
                        ${r.constitutions.map((c) => `
                          <span class="recipe-card__badge recipe-card__badge--const ${constitution === c ? '' : ''}">${esc(c)}</span>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                  <div class="recipe-card__section">
                    <div class="recipe-card__label">食材</div>
                    <div class="recipe-card__ingredients">
                      ${r.ingredients.map((ing) => `<span class="recipe-card__ingredient">${esc(ing)}</span>`).join('')}
                    </div>
                  </div>
                  <div class="recipe-card__section">
                    <div class="recipe-card__label">功效</div>
                    <div class="recipe-card__text">${esc(r.effect)}</div>
                  </div>
                  <div class="recipe-card__section">
                    <div class="recipe-card__label">做法</div>
                    <div class="recipe-card__method">${esc(r.method)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  }

  function bindRecipes() {
    $('#rec-back')?.addEventListener('click', () => navigate(State.report ? 'report' : 'guide'));

    $$('.symptom-tag').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.symptom;
        State.recipeSymptom = State.recipeSymptom === id ? '' : id;
        render();
      });
    });

    const input = $('#symptom-input');
    if (input) {
      input.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (!val) {
          State.recipeSymptom = '';
          render();
          return;
        }
        // 模糊匹配症状标签
        const matched = window.SYMPTOM_TAGS.find((tag) =>
          tag.keywords.some((kw) => val.includes(kw)) || tag.label.includes(val)
        );
        if (matched) {
          State.recipeSymptom = matched.id;
          render();
        }
      });
    }
  }

  // ============= 页面 8：体质变化追踪 =============
  function renderTracking() {
    const records = State.trackingRecords.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const constitution = State.report ? State.report.type : null;

    return `
      <div class="page">
        <div class="tracking">
          <div class="nav">
            <button class="nav__back" id="tr-back">${Icons.arrowLeft}</button>
            <div class="nav__title">体质追踪</div>
            <div style="width:36px"></div>
          </div>

          <div class="tracking__hero">
            <h1 class="tracking__title">体质变化</h1>
            <p class="tracking__subtitle">定期记录体质变化，见证调理效果</p>
          </div>

          <div class="tracking__actions">
            <button class="btn btn--secondary btn--sm" id="tr-toggle-form">
              <span class="btn-icon">${Icons.plus}</span>
              <span>${State.showTrackingForm ? '收起表单' : '新增记录'}</span>
            </button>
            <button class="btn btn--apricot btn--sm" id="tr-retest">
              <span class="btn-icon">${Icons.trending}</span>
              <span>重新测评</span>
            </button>
          </div>

          ${State.showTrackingForm ? `
            <div class="tracking-form">
              <div class="tracking-form__title">记录今日数据</div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">体重（kg）</label>
                  <input class="form-input" id="tr-weight" type="number" step="0.1" placeholder="60.0" />
                </div>
                <div class="form-group">
                  <label class="form-label">身高（cm）</label>
                  <input class="form-input" id="tr-height" type="number" step="0.1" placeholder="170.0" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">BMI（自动计算）</label>
                  <input class="form-input" id="tr-bmi" type="text" readonly placeholder="填写体重身高后自动计算" style="background:rgba(44,62,45,0.04);" />
                </div>
                <div class="form-group">
                  <label class="form-label">当前体质</label>
                  <input class="form-input" type="text" readonly value="${esc(constitution || '请先完成体质测评')}" style="background:rgba(44,62,45,0.04);" />
                </div>
              </div>
              <div class="form-group form-group--full" style="margin-bottom:14px;">
                <label class="form-label">舌象照片（仅自己可见）</label>
                <div class="photo-upload" id="tr-photo-wrap">
                  <div class="photo-upload__icon">📷</div>
                  <div class="photo-upload__text">点击上传舌象照片</div>
                  <div class="photo-upload__note">照片仅保存在本地，不会上传至服务器</div>
                  <input type="file" id="tr-photo" accept="image/*" style="display:none;" />
                </div>
              </div>
              <div class="form-group form-group--full" style="margin-bottom:16px;">
                <label class="form-label">备注</label>
                <input class="form-input" id="tr-note" type="text" placeholder="记录今日感受、调理变化等..." />
              </div>
              <button class="btn btn--primary btn--full" id="tr-save">
                <span>保存记录</span>
              </button>
            </div>
          ` : ''}

          ${records.length === 0 ? `
            <div class="recipe-empty">
              <div class="recipe-empty__icon">📋</div>
              <div class="recipe-empty__text">暂无追踪记录，点击「新增记录」开始追踪体质变化</div>
            </div>
          ` : `
            <div style="font-family:var(--font-serif);font-size:14px;font-weight:600;color:var(--c-ink);margin-bottom:14px;letter-spacing:0.05em;">追踪历史</div>
            <div class="timeline">
              ${records.map((rec, idx) => `
                <div class="timeline-item ${idx === 0 ? 'timeline-item--latest' : ''}">
                  <div class="timeline-item__dot"></div>
                  <div class="timeline-item__card">
                    <div class="timeline-item__head">
                      <div class="timeline-item__date">${esc(formatDateZh(rec.date))}</div>
                      <div class="timeline-item__tag">${esc(rec.constitution || '未测评')}</div>
                    </div>
                    <div class="timeline-item__body">
                      <div class="timeline-item__metric">
                        <div class="timeline-item__metric-num">${esc(rec.weight ? rec.weight + '' : '-')}</div>
                        <div class="timeline-item__metric-label">体重 kg</div>
                      </div>
                      <div class="timeline-item__metric">
                        <div class="timeline-item__metric-num">${esc(rec.bmi ? rec.bmi + '' : '-')}</div>
                        <div class="timeline-item__metric-label">BMI</div>
                      </div>
                      <div class="timeline-item__metric">
                        <div class="timeline-item__metric-num">${esc(rec.height ? rec.height + '' : '-')}</div>
                        <div class="timeline-item__metric-label">身高 cm</div>
                      </div>
                    </div>
                    ${rec.photo ? `<img class="timeline-item__photo" src="${rec.photo}" data-photo-preview="${rec.photo}" alt="舌象照片" />` : ''}
                    ${rec.note ? `<div class="timeline-item__note">${Icons.message}<span>${esc(rec.note)}</span></div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  }

  function bindTracking() {
    $('#tr-back')?.addEventListener('click', () => navigate(State.report ? 'report' : 'guide'));

    $('#tr-toggle-form')?.addEventListener('click', () => {
      State.showTrackingForm = !State.showTrackingForm;
      render();
    });

    $('#tr-retest')?.addEventListener('click', () => {
      State.answers = [];
      State.currentQuestion = 0;
      State.selectedOption = null;
      Store.remove('answers');
      navigate('questionnaire');
    });

    // BMI 自动计算
    const weightInput = $('#tr-weight');
    const heightInput = $('#tr-height');
    const bmiInput = $('#tr-bmi');

    function calcBMI() {
      const w = parseFloat(weightInput?.value);
      const h = parseFloat(heightInput?.value);
      if (w && h) {
        const bmi = (w / Math.pow(h / 100, 2)).toFixed(1);
        if (bmiInput) bmiInput.value = bmi;
      }
    }

    weightInput?.addEventListener('input', calcBMI);
    heightInput?.addEventListener('input', calcBMI);

    // 照片上传
    const photoWrap = $('#tr-photo-wrap');
    const photoInput = $('#tr-photo');
    photoWrap?.addEventListener('click', () => photoInput?.click());

    photoInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result;
        // 显示预览
        if (photoWrap) {
          photoWrap.innerHTML = `
            <img class="photo-upload__img" src="${base64}" alt="预览" />
            <div class="photo-upload__remove" id="tr-photo-remove">${Icons.closeX}</div>
          `;
          photoWrap.dataset.photo = base64;
          $('#tr-photo-remove')?.addEventListener('click', (ev2) => {
            ev2.stopPropagation();
            delete photoWrap.dataset.photo;
            photoWrap.innerHTML = `
              <div class="photo-upload__icon">📷</div>
              <div class="photo-upload__text">点击上传舌象照片</div>
              <div class="photo-upload__note">照片仅保存在本地，不会上传至服务器</div>
            `;
            photoInput.value = '';
          });
        }
      };
      reader.readAsDataURL(file);
    });

    // 保存记录
    $('#tr-save')?.addEventListener('click', () => {
      const weight = parseFloat($('#tr-weight')?.value);
      const height = parseFloat($('#tr-height')?.value);
      const note = ($('#tr-note')?.value || '').trim();
      const photoWrap2 = $('#tr-photo-wrap');
      const photo = photoWrap2?.dataset.photo || '';

      if (!weight || !height) {
        showToast('请填写体重和身高');
        return;
      }

      const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);
      const record = {
        id: 'tr' + Date.now(),
        date: today(),
        constitution: State.report ? State.report.type : null,
        weight,
        height,
        bmi,
        photo,
        note,
      };

      State.trackingRecords.push(record);
      saveAll();
      State.showTrackingForm = false;
      render();
      showToast('记录保存成功 ✓');
    });

    // 照片预览
    $$('[data-photo-preview]').forEach((el) => {
      el.addEventListener('click', () => {
        const src = el.dataset.photoPreview;
        const modal = document.createElement('div');
        modal.className = 'photo-modal';
        modal.innerHTML = `
          <div class="photo-modal__close">${Icons.closeX}</div>
          <img class="photo-modal__img" src="${src}" alt="舌象照片" />
          <div class="photo-modal__note">🔒 此照片仅保存在您的本地设备中</div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.photo-modal__close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.remove();
        });
      });
    });
  }

  // ============= 季节工具函数 =============
  function getCurrentSeason() {
    const m = new Date().getMonth() + 1;
    if (m >= 3 && m <= 5) return 'spring';
    if (m >= 6 && m <= 8) return 'summer';
    if (m >= 9 && m <= 11) return 'autumn';
    return 'winter';
  }

  // ============= 页面 9：评论互动 =============

  const EMOTIONS_DATA = [
    { id: 'joy', name: '喜', icon: '😊', color: '#C9A96E', harm: '过喜则伤心，导致心气涣散，神不守舍，出现心悸、失眠、精神不集中等症。', therapy: '以恐胜喜：恐惧可以收敛涣散的心气。适当观看悬疑影片或回忆警示之事，以收敛过度兴奋。', acupoint: '内关穴：腕横纹上2寸，两筋之间。按揉3-5分钟可宁心安神。', meridian: '沿心包经推拿：从胸中线沿手臂内侧推至手腕，反复5-10次，可调节心气。', diet: '莲子百合粥：养心安神；酸枣仁茶：宁心定志。' },
    { id: 'anger', name: '怒', icon: '😡', color: '#A14A4A', harm: '大怒则伤肝，肝气上逆，血随气涌，出现头痛眩晕、面红目赤、呕血等症。', therapy: '以悲胜怒：悲伤可以抑制愤怒。回忆感人之事，或听悲伤音乐，以平息怒气。', acupoint: '太冲穴：足背第1-2跖骨结合部前方凹陷处。按揉3-5分钟可疏肝理气。', meridian: '沿肝经推拿：从大敦穴沿足内侧向上推至期门穴，反复5-10次，可疏肝解郁。', diet: '菊花决明子茶：清肝明目；佛手柑粥：疏肝理气。' },
    { id: 'anxiety', name: '忧', icon: '😔', color: '#6B8E7B', harm: '过忧伤肺，肺气消索，出现气短乏力、意志消沉、胸闷不舒等症。', therapy: '以喜胜忧：喜悦可以驱散忧愁。听相声、看喜剧，或与朋友欢笑聚会。', acupoint: '膻中穴：两乳头连线中点。按揉3-5分钟可宽胸理气。', meridian: '沿肺经推拿：从中府穴沿手臂内侧前缘推至少商穴，反复5-10次，可宣肺理气。', diet: '合欢花茶：解郁安神；百合银耳羹：润肺养阴。' },
    { id: 'thought', name: '思', icon: '🤔', color: '#8FA68E', harm: '过思伤脾，脾失健运，出现食欲不振、腹胀便溏、面色萎黄、倦怠乏力等症。', therapy: '以怒胜思：愤怒可以打破过度思虑的循环。适当发泄情绪，如快走或击打沙袋。', acupoint: '足三里：外膝眼下3寸，胫骨外一横指。按揉3-5分钟可健脾和胃。', meridian: '沿脾经推拿：从隐白穴沿足内侧向上推至大包穴，反复5-10次，可健脾益气。', diet: '山药薏仁粥：健脾祛湿；陈皮普洱茶：理气健脾。' },
    { id: 'sorrow', name: '悲', icon: '😢', color: '#5B7B9A', harm: '过悲伤肺，肺气消耗，出现气短声低、精神萎靡、甚至昏厥等症。', therapy: '以喜胜悲：喜悦可以化解悲伤。参与欢乐活动，回忆美好时光。', acupoint: '列缺穴：腕横纹上1.5寸，桡骨茎突上方。按揉3-5分钟可宣肺利气。', meridian: '沿肺经推拿：从中府穴沿手臂前缘推至少商穴，配合深呼吸5-10次。', diet: '甘草小麦大枣汤：养心安神；黄花菜汤：宽胸膈、安神。' },
    { id: 'fear', name: '恐', icon: '😨', color: '#4A5568', harm: '过恐伤肾，肾气不固，出现遗精滑泄、二便失禁、腰膝酸软等症。', therapy: '以思胜恐：理性思考可以消除恐惧。分析恐惧来源，以理性化解不安。', acupoint: '涌泉穴：足底前1/3凹陷处。按揉3-5分钟可补肾固元。', meridian: '沿肾经推拿：从涌泉穴沿足内侧向上推至俞府穴，反复5-10次，可补肾固精。', diet: '黑豆核桃粥：补肾固精；杜仲腰花汤：温补肾阳。' },
  ];

  const EXERCISES_DATA = [
    { id: 'baduanjin', name: '八段锦', icon: '🧘', duration: '15分钟', difficulty: '入门', desc: '八段锦是传统导引养生功法，动作舒展优美，简单易学。', steps: ['第一式：双手托天理三焦 — 双手上举，掌心向上，如托天状', '第二式：左右开弓似射雕 — 马步开弓，左右交替', '第三式：调理脾胃须单举 — 一手上举一手下按', '第四式：五劳七伤往后瞧 — 头部缓慢后转', '第五式：摇头摆尾去心火 — 马步摇转身体', '第六式：两手攀足固肾腰 — 前俯后仰，两手攀足', '第七式：攒拳怒目增气力 — 马步攒拳，怒目而视', '第八式：背后七颠百病消 — 足跟提起颠落'] },
    { id: 'taiji', name: '太极养生', icon: '☯️', duration: '20分钟', difficulty: '进阶', desc: '太极拳以柔克刚，动作圆活连贯，是调理身心的上乘功法。', steps: ['起势：双脚并步，重心右移，左脚开步', '野马分鬃：弓步分手，左右交替', '白鹤亮翅：虚步分手，展翅如鹤', '搂膝拗步：推掌搂膝，弓步前行', '手挥琵琶：跟步摆掌，虚步合手', '倒卷肱：退步推掌，左右交替', '左揽雀尾：掤捋挤按，弓步推掌', '收势：双手下按，并步还原'] },
    { id: 'wuxingcao', name: '五行健身操', icon: '💪', duration: '10分钟', difficulty: '入门', desc: '结合五行理论设计的健身操，对应五脏调理，简单高效。', steps: ['木—肝：展臂扩胸，疏肝理气', '火—心：拍打心包经，养心安神', '土—脾：揉腹转腰，健脾和胃', '金—肺：深呼吸扩胸，宣肺理气', '水—肾：踮脚提踵，补肾固元', '收式：双手叠放丹田，调息3次'] },
    { id: 'yijingjin', name: '易筋经', icon: '🏋️', duration: '25分钟', difficulty: '进阶', desc: '易筋经是少林传统功法，通过拉伸筋骨，达到强身健体的效果。', steps: ['韦驮献杵第一势：合掌定心', '韦驮献杵第二势：横担降魔', '韦驮献杵第三势：掌托天门', '摘星换斗势：单手上举', '倒拽九牛尾势：弓步拽拉', '出爪亮翅势：推掌亮翅', '九鬼拔马刀势：扭身抱头', '三盘落地势：马步按掌'] },
  ];

  // 默认互动帖子数据
  const DEFAULT_INTERACTIONS = [
    { id: 'i1', author: '清风明月', avatarColor: 2, type: 'checkin', content: '今天坚持了八段锦打卡，感觉身体轻松了很多，特别是肩颈部位明显改善！', likes: 12, liked: false, comments: [{ author: '小草', text: '坚持就是胜利！' }, { author: '白云', text: '我也在做八段锦，确实有效' }], time: '2小时前' },
    { id: 'i2', author: '养生达人', avatarColor: 3, type: 'experience', content: '分享我的祛湿经验：每天早上喝一杯薏米红豆水，配合足三里按摩，一个月后身体轻松了许多。', likes: 28, liked: false, comments: [{ author: '小豆子', text: '收藏了！' }], time: '5小时前' },
    { id: 'i3', author: '气虚小白', avatarColor: 1, type: 'experience', content: '请问气虚体质适合哪些运动？之前跑步总觉得很累，后来改做太极，感觉好多了。', likes: 8, liked: false, comments: [{ author: '中医学生', text: '气虚适合缓和运动，太极八段锦都可以' }, { author: '老李', text: '散步也是很好的选择' }], time: '昨天' },
    { id: 'i4', author: '食疗爱好者', avatarColor: 4, type: 'checkin', content: '今日养生打卡：早餐吃了山药粥+红枣，午餐加了黄芪炖鸡，感觉一天精神都不错！', likes: 15, liked: false, comments: [], time: '2天前' },
  ];

  function renderInteract() {
    const tab = State.interactTab;
    let posts = State.interactPosts;
    if (tab === 'checkin') posts = posts.filter(p => p.type === 'checkin');
    else if (tab === 'experience') posts = posts.filter(p => p.type === 'experience');

    // 确保 MOCK_INTERACTIONS 或使用默认值
    if (posts.length === 0 && tab === 'all') {
      posts = DEFAULT_INTERACTIONS;
    }

    return `
      <div class="page">
        <div class="community">
          <div class="nav">
            <button class="nav__back" id="int-back">${Icons.arrowLeft}</button>
            <div class="nav__title">评论互动</div>
            <div style="width:36px"></div>
          </div>

          <div class="community__hero">
            <h1 class="community__title">评论互动</h1>
            <p class="community__subtitle">分享经验，交流养生心得</p>
          </div>

          <div class="community__tabs">
            <div class="tab ${tab === 'all' ? 'tab--active' : ''}" data-int-tab="all">全部</div>
            <div class="tab ${tab === 'checkin' ? 'tab--active' : ''}" data-int-tab="checkin">打卡</div>
            <div class="tab ${tab === 'experience' ? 'tab--active' : ''}" data-int-tab="experience">经验</div>
          </div>

          <div class="posts">
            ${posts.map((p) => `
              <div class="post" data-int-post-id="${p.id}">
                <div class="post__head">
                  <div class="post__avatar post__avatar--${p.avatarColor || 1}">${esc(p.author[0])}</div>
                  <div class="post__meta">
                    <div class="post__name">${esc(p.author)} <span class="post__tag">${esc(p.type === 'checkin' ? '打卡' : '经验')}</span></div>
                    <div class="post__time">${esc(p.time)}</div>
                  </div>
                </div>
                <div class="post__content">${esc(p.content)}</div>
                <div class="post__actions">
                  <div class="post__action ${p.liked ? 'post__action--liked' : ''}" data-int-like="${p.id}">
                    ${p.liked ? Icons.heartFill : Icons.heart}
                    <span>${p.likes + (p.liked ? 1 : 0)}</span>
                  </div>
                  <div class="post__action">${Icons.message}<span>${(p.comments || []).length}</span></div>
                </div>
                ${(p.comments && p.comments.length > 0) ? `
                  <div class="post__comments" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--c-line);">
                    ${p.comments.map(c => `
                      <div style="font-size:12px;margin-bottom:6px;line-height:1.5;">
                        <strong style="color:var(--c-sage);">${esc(c.author)}</strong>：${esc(c.text)}
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                <div style="display:flex;gap:8px;margin-top:8px;">
                  <input class="form-input" style="flex:1;font-size:12px;padding:6px 10px;" data-int-comment-input="${p.id}" type="text" placeholder="写评论..." />
                  <button class="btn btn--primary btn--sm" style="padding:4px 12px;font-size:12px;" data-int-comment-send="${p.id}">发送</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <button class="fab" id="fab-interact-post" title="发布">${Icons.plus}</button>
      </div>
    `;
  }

  function bindInteract() {
    $('#int-back')?.addEventListener('click', () => navigate(State.report ? 'report' : 'guide'));

    $$('[data-int-tab]').forEach((el) => {
      el.addEventListener('click', () => {
        State.interactTab = el.dataset.intTab;
        render();
      });
    });

    $$('[data-int-like]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.intLike;
        const post = State.interactPosts.find(p => p.id === id);
        if (post) {
          post.liked = !post.liked;
          saveAll();
          render();
        }
      });
    });

    $$('[data-int-comment-send]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.intCommentSend;
        const input = document.querySelector(`[data-int-comment-input="${id}"]`);
        const text = (input?.value || '').trim();
        if (!text) return;
        const post = State.interactPosts.find(p => p.id === id);
        if (post) {
          if (!post.comments) post.comments = [];
          post.comments.push({ author: '我', text });
          saveAll();
          render();
          showToast('评论成功 ✓');
        }
      });
    });

    $('#fab-interact-post')?.addEventListener('click', () => {
      const text = prompt('请输入您想分享的内容：');
      if (text && text.trim()) {
        const type = confirm('点击「确定」发布为打卡，点击「取消」发布为经验') ? 'checkin' : 'experience';
        const newPost = {
          id: 'i' + Date.now(),
          author: '我',
          avatarColor: 1,
          type,
          content: text.trim(),
          likes: 0,
          liked: false,
          comments: [],
          time: '刚刚',
        };
        State.interactPosts.unshift(newPost);
        saveAll();
        render();
        showToast('发布成功 ✓');
      }
    });
  }

  // ============= 页面 10：顺时养生 =============
  function renderSeasonal() {
    const season = State.selectedSeason || getCurrentSeason();
    const seasonData = window.SEASONAL_FOODS[season] || {};
    const data = { ...seasonData, desc: seasonData.description, months: seasonData.months };
    const foods = seasonData.foods || [];
    const seasons = ['spring', 'summer', 'autumn', 'winter'];
    const seasonLabels = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };

    return `
      <div class="page">
        <div class="recipes">
          <div class="nav">
            <button class="nav__back" id="sea-back">${Icons.arrowLeft}</button>
            <div class="nav__title">顺时养生</div>
            <div style="width:36px"></div>
          </div>

          <div class="report__hero" style="text-align:center;padding:24px 0;">
            <div style="font-size:48px;margin-bottom:8px;">${data.icon}</div>
            <div class="report__seal">${data.element} · ${data.organ}</div>
            <div class="report__title" style="font-size:24px;">${data.name}季养生</div>
            <div class="report__subtitle" style="font-size:14px;color:var(--c-sage);margin:8px 0;">${esc(data.principle)}</div>
            <div style="font-size:13px;color:var(--c-ink-2);line-height:1.7;max-width:300px;margin:0 auto;">${esc(data.desc)}</div>
          </div>

          <!-- 本月应季突出展示 -->
          <div style="background:linear-gradient(135deg, var(--c-ink) 0%, var(--c-ink-2) 100%);border-radius:20px;padding:20px;margin:16px 0;color:var(--c-cream);position:relative;overflow:hidden;">
            <div style="position:relative;z-index:1;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                <span style="font-size:11px;letter-spacing:0.3em;opacity:0.7;">MONTHLY PICKS</span>
                <span style="font-size:11px;padding:2px 8px;background:rgba(212,165,116,0.2);border-radius:999px;color:var(--c-apricot-soft);">${data.months}</span>
              </div>
              <div style="font-family:var(--font-serif);font-size:18px;font-weight:600;margin-bottom:4px;">${data.name}季 · 七月应季</div>
              <div style="font-size:12px;opacity:0.7;margin-bottom:14px;">顺时而食，知寒热而调体质</div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;">
                ${foods.slice(0, 8).map(f => {
                  const natureColor = f.nature.includes('寒') || f.nature.includes('凉') ? 'rgba(143,166,142,0.25)' : f.nature.includes('热') || f.nature.includes('温') ? 'rgba(161,74,74,0.2)' : 'rgba(201,169,110,0.2)';
                  const natureText = f.nature.includes('寒') || f.nature.includes('凉') ? 'var(--c-sage)' : f.nature.includes('热') || f.nature.includes('温') ? 'var(--c-apricot-soft)' : 'var(--c-gold)';
                  return `
                    <div style="display:flex;align-items:center;gap:6px;padding:8px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:999px;backdrop-filter:blur(4px);">
                      <span style="font-size:18px;">${f.emoji}</span>
                      <span style="font-size:13px;font-weight:500;">${esc(f.name)}</span>
                      <span style="font-size:10px;padding:2px 6px;border-radius:999px;background:${natureColor};color:${natureText};">${esc(f.nature)}</span>
                    </div>
                  `;
                }).join('')}
              </div>
              <div style="margin-top:12px;padding:10px 12px;background:rgba(161,74,74,0.12);border:1px solid rgba(161,74,74,0.2);border-radius:10px;display:flex;align-items:flex-start;gap:8px;">
                <span style="font-size:14px;flex-shrink:0;margin-top:1px;">⚠️</span>
                <span style="font-size:11px;line-height:1.6;opacity:0.9;">
                  <strong>寒凉提示：</strong>绿色标签为寒凉食材，适合清热解暑但不宜过量；
                  ${data.name === '夏' ? '夏季贪凉易伤脾阳，痰湿、阳虚体质尤需控制西瓜、苦瓜等寒凉食物的摄入。' : '温性食材可温补驱寒，阴虚火旺者少食。'}
                </span>
              </div>
            </div>
          </div>

          <div class="community__tabs">
            ${seasons.map(s => `
              <div class="tab ${season === s ? 'tab--active' : ''}" data-season-tab="${s}">${data.icon.slice(0, 2)} ${seasonLabels[s]}</div>
            `).join('')}
          </div>

          <div style="font-family:var(--font-serif);font-size:14px;font-weight:600;color:var(--c-ink);margin:16px 0 10px;letter-spacing:0.05em;">当季推荐食材</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            ${foods.map(f => {
              const natureColor = f.nature.includes('寒') || f.nature.includes('凉') ? 'rgba(143,166,142,0.15)' : f.nature.includes('热') || f.nature.includes('温') ? 'rgba(161,74,74,0.1)' : 'rgba(201,169,110,0.1)';
              const natureText = f.nature.includes('寒') || f.nature.includes('凉') ? 'var(--c-sage)' : f.nature.includes('热') || f.nature.includes('温') ? 'var(--c-clay)' : 'var(--c-gold-2)';
              return `
                <div class="recipe-card" style="padding:14px;position:relative;overflow:hidden;">
                  <div style="position:absolute;top:0;left:0;width:3px;height:100%;background:${natureColor.replace('0.15', '0.4').replace('0.1', '0.3')};"></div>
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <span style="font-size:20px;">${f.emoji}</span>
                    <span style="font-family:var(--font-serif);font-size:14px;font-weight:600;color:var(--c-ink);">${esc(f.name)}</span>
                    <span style="font-size:10px;padding:2px 6px;border-radius:999px;background:${natureColor};color:${natureText};margin-left:auto;">${esc(f.nature)}</span>
                  </div>
                  <div style="font-size:11px;color:var(--c-ink-3);opacity:0.8;margin-bottom:4px;">${esc(f.effect)}</div>
                  <div style="font-size:11px;color:var(--c-ink-3);opacity:0.6;line-height:1.5;">${esc(f.tip)}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function bindSeasonal() {
    $('#sea-back')?.addEventListener('click', () => navigate(State.report ? 'report' : 'guide'));

    $$('[data-season-tab]').forEach((el) => {
      el.addEventListener('click', () => {
        State.selectedSeason = el.dataset.seasonTab;
        render();
      });
    });
  }

  // ============= 页面 11：情志记录 =============
  function renderEmotion() {
    const selected = State.selectedEmotion;
    const emotionData = selected ? EMOTIONS_DATA.find(e => e.id === selected) : null;
    const records = State.emotionRecords.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    return `
      <div class="page">
        <div class="tracking">
          <div class="nav">
            <button class="nav__back" id="emo-back">${Icons.arrowLeft}</button>
            <div class="nav__title">情志记录</div>
            <div style="width:36px"></div>
          </div>

          <div class="tracking__hero">
            <h1 class="tracking__title">七情调养</h1>
            <p class="tracking__subtitle">了解情志对身体的影响，以情胜情，调和身心</p>
          </div>

          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:16px;">
            ${EMOTIONS_DATA.map(e => `
              <button class="symptom-tag ${selected === e.id ? 'symptom-tag--active' : ''}" data-emotion="${e.id}" style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;flex-direction:column;padding:4px;">
                <span>${e.icon}</span>
                <span style="font-size:10px;margin-top:2px;">${e.name}</span>
              </button>
            `).join('')}
          </div>

          ${emotionData ? `
            <div class="recipe-card" style="margin-bottom:12px;">
              <div class="recipe-card__section">
                <div class="recipe-card__label">伤害描述</div>
                <div class="recipe-card__text">${esc(emotionData.harm)}</div>
              </div>
              <div class="recipe-card__section">
                <div class="recipe-card__label" style="color:var(--c-apricot-2);">🧠 情志相胜疗法</div>
                <div class="recipe-card__text" style="background:rgba(201,169,110,0.08);padding:10px;border-radius:10px;border-left:3px solid var(--c-apricot-2);">${esc(emotionData.therapy)}</div>
              </div>
              <div class="recipe-card__section">
                <div class="recipe-card__label">💆 穴位按摩</div>
                <div class="recipe-card__text">${esc(emotionData.acupoint)}</div>
              </div>
              <div class="recipe-card__section">
                <div class="recipe-card__label">🧭 推经指导</div>
                <div class="recipe-card__text">${esc(emotionData.meridian)}</div>
              </div>
              <div class="recipe-card__section">
                <div class="recipe-card__label">🍵 食疗建议</div>
                <div class="recipe-card__text">${esc(emotionData.diet)}</div>
              </div>
            </div>

            <div style="font-family:var(--font-serif);font-size:14px;font-weight:600;color:var(--c-ink);margin-bottom:10px;letter-spacing:0.05em;">记录本次情志</div>
            <div style="display:flex;gap:8px;margin-bottom:16px;">
              <input class="form-input" style="flex:1;" id="emo-note" type="text" placeholder="备注今日情志感受..." />
              <button class="btn btn--primary btn--sm" id="emo-save">保存</button>
            </div>
          ` : `
            <div class="recipe-empty">
              <div class="recipe-empty__icon">🧘</div>
              <div class="recipe-empty__text">请选择上方情志，查看调理方案</div>
            </div>
          `}

          ${records.length > 0 ? `
            <div style="font-family:var(--font-serif);font-size:14px;font-weight:600;color:var(--c-ink);margin:16px 0 10px;letter-spacing:0.05em;">情志历史</div>
            <div class="timeline">
              ${records.map((rec, idx) => {
                const emoData = EMOTIONS_DATA.find(e => e.id === rec.emotion);
                return `
                  <div class="timeline-item ${idx === 0 ? 'timeline-item--latest' : ''}">
                    <div class="timeline-item__dot"></div>
                    <div class="timeline-item__card">
                      <div class="timeline-item__head">
                        <div class="timeline-item__date">${esc(formatDateZh(rec.date))}</div>
                        <div class="timeline-item__tag">${emoData ? emoData.icon + ' ' + emoData.name : ''}</div>
                      </div>
                      ${rec.note ? `<div class="timeline-item__note">${Icons.message}<span>${esc(rec.note)}</span></div>` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  function bindEmotion() {
    $('#emo-back')?.addEventListener('click', () => navigate(State.report ? 'report' : 'guide'));

    $$('[data-emotion]').forEach((el) => {
      el.addEventListener('click', () => {
        State.selectedEmotion = el.dataset.emotion;
        render();
      });
    });

    $('#emo-save')?.addEventListener('click', () => {
      const note = ($('#emo-note')?.value || '').trim();
      if (!State.selectedEmotion) {
        showToast('请先选择情志');
        return;
      }
      State.emotionRecords.push({
        id: 'er' + Date.now(),
        date: today(),
        emotion: State.selectedEmotion,
        note,
      });
      saveAll();
      State.selectedEmotion = null;
      render();
      showToast('情志记录保存成功 ✓');
    });
  }

  // ============= 页面 12：跟练打卡 =============
  function renderExercise() {
    const expanded = State.expandedExercise;
    const checkins = State.exerciseCheckins;

    // 本周完成次数
    const now = new Date();
    const dayOfWeek = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);
    const weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    let weekCount = 0;
    Object.keys(checkins).forEach(date => {
      if (date >= weekStart) {
        weekCount += Object.keys(checkins[date]).length;
      }
    });

    const todayStr = today();

    return `
      <div class="page">
        <div class="tracking">
          <div class="nav">
            <button class="nav__back" id="ex-back">${Icons.arrowLeft}</button>
            <div class="nav__title">跟练打卡</div>
            <div style="width:36px"></div>
          </div>

          <div class="checkin__hero">
            <h1 class="checkin__title">跟练打卡</h1>
            <p class="checkin__subtitle">传统功法跟练，坚持每日打卡</p>
          </div>

          <div class="checkin__summary">
            <div class="summary-item">
              <div class="summary-item__num" style="color:var(--c-apricot-2)">${weekCount}</div>
              <div class="summary-item__label">本周完成</div>
            </div>
            <div class="summary-item">
              <div class="summary-item__num">${Object.values(checkins).reduce((sum, d) => sum + Object.keys(d).length, 0)}</div>
              <div class="summary-item__label">累计打卡</div>
            </div>
          </div>

          <div class="meals">
            ${EXERCISES_DATA.map(ex => {
              const isOpen = expanded === ex.id;
              const checkedToday = checkins[todayStr] && checkins[todayStr][ex.id];
              return `
                <div class="meal ${checkedToday ? 'meal--done' : ''} ${isOpen ? 'meal--open' : ''}" data-exercise="${ex.id}">
                  <div class="meal__head" data-ex-toggle="${ex.id}">
                    <div class="meal__head-left">
                      <div class="meal__icon">${ex.icon}</div>
                      <div>
                        <div class="meal__name">${esc(ex.name)}</div>
                        <div class="meal__time">${esc(ex.duration)} · ${esc(ex.difficulty)}</div>
                      </div>
                    </div>
                    <div class="meal__status">
                      <span class="meal__status-dot"></span>
                      <span>${checkedToday ? '已打卡' : '未打卡'}</span>
                      <span class="meal__chevron">${Icons.chevronDown}</span>
                    </div>
                  </div>
                  <div class="meal__body">
                    <div style="font-size:13px;color:var(--c-ink-2);line-height:1.6;margin-bottom:12px;">${esc(ex.desc)}</div>
                    <div style="font-family:var(--font-serif);font-size:13px;font-weight:600;color:var(--c-ink);margin-bottom:8px;">跟练步骤</div>
                    ${ex.steps.map((s, i) => `
                      <div style="display:flex;gap:8px;margin-bottom:8px;font-size:12px;line-height:1.6;">
                        <span style="width:20px;height:20px;border-radius:50%;background:var(--c-sage);color:var(--c-cream);display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;">${i + 1}</span>
                        <span style="color:var(--c-ink-2);">${esc(s)}</span>
                      </div>
                    `).join('')}
                    <button class="btn ${checkedToday ? 'btn--secondary' : 'btn--primary'} btn--full" style="margin-top:12px;" data-ex-checkin="${ex.id}" ${checkedToday ? 'disabled' : ''}>
                      ${checkedToday ? '今日已打卡 ✓' : '打卡'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function bindExercise() {
    $('#ex-back')?.addEventListener('click', () => navigate(State.report ? 'report' : 'guide'));

    $$('[data-ex-toggle]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const id = el.dataset.exToggle;
        State.expandedExercise = State.expandedExercise === id ? null : id;
        render();
      });
    });

    $$('[data-ex-checkin]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.dataset.exCheckin;
        const dateStr = today();
        if (!State.exerciseCheckins[dateStr]) State.exerciseCheckins[dateStr] = {};
        if (State.exerciseCheckins[dateStr][id]) return;
        State.exerciseCheckins[dateStr][id] = { time: new Date().toISOString() };
        saveAll();
        render();
        showToast('打卡成功 ✓');
      });
    });
  }

  // ============= 成就系统 =============
  function unlockAchievement(id) {
    if (State.achievements[id]) return;
    const ach = window.ACHIEVEMENTS.find((a) => a.id === id);
    if (!ach) return;
    State.achievements[id] = true;
    saveAll();
    showUnlockModal(ach);
  }

  function showUnlockModal(ach) {
    const modal = document.createElement('div');
    modal.className = 'unlock-modal';
    modal.innerHTML = `
      <div class="unlock-modal__card">
        <div class="unlock-modal__eyebrow">ACHIEVEMENT UNLOCKED</div>
        <div class="unlock-modal__icon">${ach.icon}</div>
        <div class="unlock-modal__title">${esc(ach.name)}</div>
        <div class="unlock-modal__desc">${esc(ach.desc)}</div>
        <button class="btn btn--primary btn--full unlock-modal__btn" id="unlock-close">
          <span>收下徽章</span>
        </button>
      </div>
    `;
    document.body.appendChild(modal);
    fireConfetti();
    $('#unlock-close').addEventListener('click', () => {
      modal.style.animation = 'fadeIn 0.3s var(--ease-out) reverse';
      setTimeout(() => modal.remove(), 300);
    });
  }

  // ============= Confetti 粒子效果 =============
  function fireConfetti() {
    const canvas = $('#confetti');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#C9A96E', '#D4A574', '#8FA68E', '#2C3E2D', '#A14A4A'];
    const particles = [];
    const N = 80;
    for (let i = 0; i < N; i++) {
      particles.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 100,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 14,
        vy: Math.random() * -16 - 4,
        g: 0.4,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 20,
        life: 1,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      });
    }

    let frame = 0;
    const maxFrames = 120;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 1 / maxFrames;
        if (p.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    draw();
  }

  // ============= 页面绑定分发 =============
  function bindPage() {
    switch (State.currentPage) {
      case 'guide': bindGuide(); break;
      case 'questionnaire': bindQuestionnaire(); break;
      case 'analyzing': bindAnalyzing(); break;
      case 'report': bindReport(); break;
      case 'checkin': bindCheckIn(); break;
      case 'community': bindCommunity(); break;
      case 'recipes': bindRecipes(); break;
      case 'tracking': bindTracking(); break;
      case 'interact': bindInteract(); break;
      case 'seasonal': bindSeasonal(); break;
      case 'emotion': bindEmotion(); break;
      case 'exercise': bindExercise(); break;
    }
  }

  // ============= 启动 =============
  function start() {
    initState();
    if (!location.hash) location.hash = '/guide';
    State.currentPage = getRoute();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
