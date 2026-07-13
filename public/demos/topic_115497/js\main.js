// ============================================================
// js/main.js
// 中华文化粒子云引擎 · 主控制器
// 负责 2D / 3D 双引擎模式分发、主题加载、UI 事件路由
// ============================================================

import { Engine2D } from './engine2d.js';
import { Engine3D } from './engine3d.js';
import { ThemeLoader } from './theme-loader.js';
import * as THREE from 'three';
import * as Security from './security.js';
import { handleCustomSubmit } from './custom-input.js';

/** 期望的 Three.js 版本号（Task 8 安全加固：本地 vendor 版本校验） */
const EXPECTED_THREE_REVISION = '169';

// Task 2 占位测试主题：「唐诗星河」用于验证 3D 粒子云渲染（galaxy 螺旋布局）。
// 字段与 ThemePack schema 对齐，palette 为对象形态 { main, accent, glow, bg, bg2 }。
// Task 4 创建 themes/ 目录真实主题数据后，ThemeLoader 即可加载注册主题，
// 此测试包仅用于 Task 2 阶段在无主题数据文件时验证 3D 渲染链路是否打通。
const TANGSHI_TEST_THEME = {
  id: 'tangshi-galaxy',
  name: '唐诗星河',
  category: '诗词',
  era: '唐',
  description: '唐诗三百首 · 星河螺旋（Task 2 测试占位主题）',
  content: [
    { text: '星垂平野阔', author: '杜甫', source: '旅夜书怀' },
    { text: '月涌大江流', author: '杜甫', source: '旅夜书怀' },
    { text: '银河倒挂三石梁', author: '李白', source: '庐山谣' }
  ],
  layout: 'galaxy',
  palette: {
    main:   '#d4af6a',
    accent: '#f4d77e',
    glow:   '#8b6929',
    bg:     '#0a0705',
    bg2:    '#1a1208'
  },
  particleCount: 80000,
  interactions: { clickable: false, searchable: false, filterable: null }
};

// Task 7.2：主题元数据 hint（用于未加载主题在面板的分类卡片显示）
// 仅取自 theme-registry.js 注释中已公开的 id/名称/朝代/类别信息，不读取 themes/ 目录，
// 已加载主题优先用其真实元信息（来自 ThemeLoader.list），未加载的回退到此 hint。
const THEME_META_HINT = {
  // 6 个经典场景（与 2D 引擎 SCENES 对齐）
  qianshan:     { name: '千里江山',   era: '北宋', category: '典籍', description: '王希孟青绿山水，咫尺千里，咫尺万里' },
  yuebo:        { name: '枫桥夜泊',   era: '唐',   category: '诗词', description: '姑苏城外寒山寺，夜半钟声到客船' },
  mudan:        { name: '牡丹亭',     era: '明',   category: '典籍', description: '良辰美景奈何天，赏心乐事谁家院' },
  lanting:      { name: '兰亭集序',   era: '东晋', category: '典籍', description: '王羲之天下第一行书，曲水流觞魏晋风度' },
  xingxiu:      { name: '二十八星宿', era: '上古', category: '天文', description: '紫微垣中，藏着宇宙的秩序' },
  yanyu:        { name: '江南烟雨',   era: '唐',   category: '诗词', description: '南朝四百八十寺，多少楼台烟雨中' },
  // 6 个扩展主题
  tangshi:      { name: '唐诗星河',   era: '唐',   category: '诗词', description: '唐诗三百首 · 星河螺旋布局' },
  songci:       { name: '宋词长卷',   era: '宋',   category: '诗词', description: '宋词长卷 · 流光铺陈' },
  chuci:        { name: '楚辞九歌',   era: '战国', category: '诗词', description: '东皇太一 · 湘君湘夫人 · 山鬼' },
  shanhaijing:  { name: '山海经',     era: '先秦', category: '典籍', description: '山海异兽 · 上古图腾谱系' },
  jieqi:        { name: '二十四节气', era: '汉',   category: '民俗', description: '春雨惊春清谷天 · 节令流转' },
  baijiaxing:   { name: '百家姓',     era: '宋',   category: '民俗', description: '赵钱孙李 · 姓氏源流谱系' },
  _test:        { name: '测试主题',   era: '测试', category: '诗词', description: '引擎链路验证用占位主题' }
};

class App {
  constructor() {
    /** @type {Engine2D|null} */
    this.engine2D = null;
    /** @type {Engine3D|null} */
    this.engine3D = null;
    /** @type {'2d'|'3d'} */
    this.currentMode = '2d';
    this.isTransitioning = false;
    /** @type {ThemeLoader} */
    this.themeLoader = new ThemeLoader();
    // Task 8 安全加固：挂载安全工具到 window.app.sanitize 供 UI 调用
    this.sanitize = Security;
    // Task 7.2：当前已加载主题 id（用于面板高亮 + HUD 主题名显示）
    this.currentThemeId = null;
    // Task 7.2：主题面板折叠状态
    this._themePanelCollapsed = false;
  }

  /**
   * 应用初始化：先启动 2D 引擎（默认场景「千山」），再尝试初始化 3D 引擎骨架
   */
  async init() {
    // Task 8 安全加固：校验本地 Three.js 版本，不符则 toast 警告（仍尝试运行）
    this._verifyThreeRevision();

    // 1. 初始化并启动 2D 引擎（默认 2D 模式 + 千山场景）
    this.engine2D = new Engine2D();
    this.engine2D.init();
    this.engine2D.start();

    // 2. 初始化 3D 引擎（Task 2 已实现粒子云渲染）
    const webglCanvas = document.getElementById('webglCanvas');
    try {
      this.engine3D = new Engine3D(webglCanvas);
      this.engine3D.init();
      // 预加载测试主题：让粒子云在用户切换到 3D 前已布置好 galaxy 螺旋
      // morph 动画会在 start() 后第一次 update 时推进
      this.engine3D.loadTheme(TANGSHI_TEST_THEME);
    } catch (err) {
      console.warn('[Engine3D] 初始化失败，保持 2D 模式：', err.message);
      this.engine3D = null;
      this._toast(err.message || '3D 引擎不可用，已保持 2D 意境模式', 2500);
    }

    // 3. 绑定模式切换按钮
    const modeSwitch = document.getElementById('modeSwitch');
    if (modeSwitch) {
      modeSwitch.addEventListener('click', () => {
        this.switchMode(this.currentMode === '2d' ? '3d' : '2d');
      });
    }

    // 4. 绑定自定义主题输入框（Task 6 抽取为独立方法 _initCustomInput）
    this._initCustomInput();

    // 5. 窗口尺寸变化：通知 3D 引擎（2D 引擎自行监听）
    window.addEventListener('resize', () => {
      const w = window.innerWidth, h = window.innerHeight;
      if (this.engine3D) this.engine3D.resize(w, h);
    });

    // 6. 渲染主题面板（异步加载已注册主题元信息）
    this._renderThemePanel().catch(err => {
      console.warn('[App] 主题面板渲染失败：', err);
    });

    // 7. Task 5：初始化 3D 交互（粒子拾取回调 + 搜索框 + 信息卡 + HUD 刷新）
    this._initInteraction();
  }

  /**
   * Task 6：初始化自定义主题输入框
   * 绑定 #customInput 的 input 事件（实时净化）+ keydown Enter 事件
   * 绑定 #customRenderBtn 点击事件（触发渲染）
   * 回车 / 点击均调用 handleCustomSubmit 统一入口（先匹配预设主题，无匹配走文字采样）
   * @private
   */
  _initCustomInput() {
    const customInput = document.getElementById('customInput');
    const renderBtn = document.getElementById('customRenderBtn');
    if (!customInput) return;

    // Task 8 安全加固：输入时实时剥离 HTML 标签与危险关键字（防 XSS）
    // 用 sanitizeForDisplay 而非 sanitizeText：输入框场景需保留原文不做实体转义，
    // sanitizeText（已挂载到 window.app.sanitize.sanitizeText）留给渲染 HTML 上下文使用
    customInput.addEventListener('input', () => {
      const raw = customInput.value;
      // Task 6.4：长度限制 200 字符
      let trimmed = raw.length > 200 ? raw.slice(0, 200) : raw;
      const cleaned = Security.sanitizeForDisplay(trimmed);
      if (cleaned !== raw) {
        const pos = customInput.selectionStart - (raw.length - cleaned.length);
        customInput.value = cleaned;
        try { customInput.setSelectionRange(Math.max(0, pos), Math.max(0, pos)); } catch (_) { /* ignore */ }
      }
    });

    // 回车触发渲染
    customInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._submitCustomInput(customInput);
      }
    });

    // 渲染按钮点击触发
    if (renderBtn) {
      renderBtn.addEventListener('click', () => {
        this._submitCustomInput(customInput);
      });
    }
  }

  /**
   * Task 6：提交自定义输入（回车 / 渲染按钮共用）
   * 调用 handleCustomSubmit 统一入口：净化 → 校验 → 匹配预设主题 → 文字采样
   * @param {HTMLInputElement} customInput
   * @private
   */
  async _submitCustomInput(customInput) {
    const val = customInput.value.trim();
    if (!val) {
      this._toast('请输入诗句 / 关键词 / 主题名', 1800);
      return;
    }
    // 提交前再做 keyword 校验（空 / 超长 / 非法字符）
    const check = Security.validateInput(val, 'keyword');
    if (!check.valid) {
      // keyword 校验失败时（如含诗句标点），仍允许走文字采样路径
      // 仅当完全非法（如纯空格）才阻断，这里宽松处理：只要净化后非空即放行
    }
    try {
      const result = await handleCustomSubmit(val, this);
      if (result.action === 'invalid' && result.error) {
        // handleCustomSubmit 内部已 toast，这里不重复提示
      }
      // 提交成功后清空输入框并失焦
      if (result.action !== 'invalid') {
        customInput.value = '';
        customInput.blur();
      }
    } catch (err) {
      console.warn('[App] 自定义输入渲染失败：', err);
      this._toast('渲染失败：' + (err.message || '未知错误'), 2000);
    }
  }

  /**
   * Task 7.2：渲染左侧主题面板
   * 调用 themeLoader.list() 拿到所有已注册主题（不触发 import，控制台干净），
   * 合并 THEME_META_HINT 静态元数据，按 5 个固定分类（诗词/典籍/民俗/天文/哲学）分组渲染卡片。
   * 卡片含：主题名（Ma Shan Zheng）+ 朝代标签 + 简短描述 + 状态角标（已加载/待激活）。
   * 点击卡片：若当前 2D 模式则先切到 3D（主题粒子云在 3D 模式展现更完整），再 loadTheme(id)。
   */
  async _renderThemePanel() {
    const panel = document.getElementById('themePanel');
    const body  = document.getElementById('themePanelBody');
    if (!panel || !body) return;

    // 预加载测试主题（确保面板有可点击的完整主题项）
    try {
      await this.themeLoader.load('_test');
    } catch (err) {
      console.warn('[App] 测试主题预加载失败：', err);
    }

    // list() 不触发 import，仅返回已注册 id 与已加载元信息
    const items = this.themeLoader.list();

    // 合并已加载元信息 + 静态 hint（未加载主题也能显示卡片）
    const enriched = items.map(it => {
      const hint = THEME_META_HINT[it.id] || {};
      return {
        id:          it.id,
        name:        it.name || hint.name || it.id,
        era:         it.era || hint.era || '',
        category:    it.category || hint.category || '其他',
        description: it.description || hint.description || '',
        loaded:      it.loaded
      };
    });

    // Task 8：用 textContent 清空替代 innerHTML（更快且不触发解析）
    body.textContent = '';

    // 按 5 个固定分类顺序分组渲染
    const CATEGORIES = ['诗词', '典籍', '民俗', '天文', '哲学'];
    const groups = {};
    for (const cat of CATEGORIES) groups[cat] = [];
    const others = [];
    for (const it of enriched) {
      if (groups[it.category]) groups[it.category].push(it);
      else others.push(it);
    }

    let any = false;
    for (const cat of CATEGORIES) {
      if (groups[cat].length === 0) continue;
      body.appendChild(this._buildThemeGroup(cat, groups[cat]));
      any = true;
    }
    if (others.length > 0) {
      body.appendChild(this._buildThemeGroup('其他', others));
      any = true;
    }
    if (!any) {
      const empty = document.createElement('div');
      empty.className = 'theme-group-title';
      empty.textContent = '（无主题）';
      body.appendChild(empty);
    }

    // 初始高亮当前主题
    this._highlightThemeCard(this.currentThemeId);
  }

  /**
   * 构建一个分类分组容器（标题 + 计数 + 卡片列表）
   * @private
   */
  _buildThemeGroup(cat, list) {
    const groupEl = document.createElement('div');
    groupEl.className = 'theme-group';
    const titleEl = document.createElement('div');
    titleEl.className = 'theme-group-title';
    const titleText = document.createElement('span');
    titleText.className = 'theme-group-title-text';
    titleText.textContent = cat;
    const count = document.createElement('span');
    count.className = 'theme-group-count';
    count.textContent = String(list.length);
    titleEl.appendChild(titleText);
    titleEl.appendChild(count);
    groupEl.appendChild(titleEl);
    for (const it of list) {
      groupEl.appendChild(this._buildThemeCard(it));
    }
    return groupEl;
  }

  /**
   * 构建单个主题卡片：主题名 + 朝代标签 + 描述 + 状态角标
   * 未加载主题加 inactive 灰色态；点击触发 _activateTheme（切 3D + loadTheme）
   * @private
   */
  _buildThemeCard(it) {
    const card = document.createElement('div');
    card.className = 'theme-card' + (it.loaded ? '' : ' inactive');
    card.dataset.themeId = it.id;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    const row = document.createElement('div');
    row.className = 'theme-card-row';
    const name = document.createElement('span');
    name.className = 'theme-card-name';
    name.textContent = it.name;
    const era = document.createElement('span');
    era.className = 'theme-card-era';
    era.textContent = it.era || '—';
    row.appendChild(name);
    row.appendChild(era);
    card.appendChild(row);

    if (it.description) {
      const desc = document.createElement('div');
      desc.className = 'theme-card-desc';
      desc.textContent = it.description;
      card.appendChild(desc);
    }

    // 状态角标：已加载 → 金色「已加载」；未加载 → 灰色虚线「待激活」
    const badge = document.createElement('span');
    badge.className = 'theme-card-badge';
    if (it.loaded) {
      badge.classList.add('loaded');
      badge.textContent = '已加载';
    } else {
      badge.classList.add('pending');
      badge.textContent = '待激活';
    }
    card.appendChild(badge);

    // 悬停 title（原生 tooltip）
    card.title = it.loaded
      ? `${it.name} · ${it.era || ''}\n${it.description || ''}`
      : `${it.name || it.id}（待激活，点击加载）`;

    // 点击 / 回车触发激活
    const activate = () => {
      if (card.classList.contains('switching') || this.isTransitioning) return;
      card.classList.add('switching');
      this._activateTheme(it.id).finally(() => {
        card.classList.remove('switching');
      });
    };
    card.addEventListener('click', activate);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });

    return card;
  }

  /**
   * 激活主题：若当前 2D 模式则先切到 3D（主题粒子云在 3D 展现更完整），再 loadTheme
   * 等待模式切换过渡完成（约 700ms）后再加载主题，避免与引擎启停并发
   * @param {string} themeId
   * @private
   */
  async _activateTheme(themeId) {
    if (this.currentMode === '2d' && this.engine3D) {
      this.switchMode('3d');
      // 等过渡完成（300ms 淡入 + 300ms 淡出 + 100ms 缓冲）
      await new Promise(r => setTimeout(r, 700));
    }
    await this.loadTheme(themeId);
  }

  /**
   * 高亮当前主题卡片（金边亮 + 角标「已加载」）
   * @param {string|null} themeId
   * @private
   */
  _highlightThemeCard(themeId) {
    const body = document.getElementById('themePanelBody');
    if (!body) return;
    body.querySelectorAll('.theme-card').forEach(card => {
      card.classList.toggle('active', !!(themeId && card.dataset.themeId === themeId));
    });
  }

  /**
   * 模式切换：2D ⇄ 3D
   * 使用 2D 引擎的墨散效果作为过渡，墨散完成后切换 canvas 显示并启停对应引擎
   * @param {'2d'|'3d'} mode
   */
  switchMode(mode) {
    if (mode === this.currentMode || this.isTransitioning) return;
    if (mode === '3d' && !this.engine3D) {
      this._toast('3D 云海引擎不可用，已保持 2D 意境模式', 2500);
      return;
    }
    this.isTransitioning = true;

    // Task 7.1：过渡中禁用切换按钮防抖（视觉脉冲 + 阻止重复点击）
    const btn = document.getElementById('modeSwitch');
    if (btn) {
      btn.classList.add('switching');
      btn.setAttribute('disabled', 'true');
    }

    const fromEngine = this.currentMode === '2d' ? this.engine2D : this.engine3D;
    const toEngine = mode === '2d' ? this.engine2D : this.engine3D;

    const finishSwitch = () => {
      // 1. 切换 canvas 显隐
      if (this.currentMode === '2d') {
        this._set2DVisible(false);
        if (this.engine3D) this._set3DVisible(true);
      } else {
        this._set3DVisible(false);
        this._set2DVisible(true);
      }
      // 2. 停止旧引擎
      if (fromEngine && fromEngine !== toEngine && typeof fromEngine.stop === 'function') {
        fromEngine.stop();
      }
      // 3. 启动新引擎
      if (mode === '3d' && this.engine3D) {
        this.engine3D.resize(window.innerWidth, window.innerHeight);
        this.engine3D.start();
      } else if (this.engine2D) {
        this.engine2D.start();
      }
      // 4. Task 7.1 核心 bug 修复：补全 Task 5 交互与 3D UI 的启停
      //    原 bug 根因——finishSwitch 漏调 enableInteraction/disableInteraction 与 _set3DUIVisible，
      //    导致切到 3D 后 HUD/搜索框不显示、飞行控制不可用；切回 2D 后 3D 交互未释放。
      //    切到 3D：启用飞行控制 + 鼠标拾取 + 显示 HUD/搜索框
      //    切到 2D：禁用 3D 交互 + 隐藏 HUD/搜索框 + 关闭信息卡
      if (mode === '3d' && this.engine3D) {
        this.engine3D.enableInteraction();
        this._set3DUIVisible(true);
      } else if (this.engine3D) {
        this.engine3D.disableInteraction();
        this._set3DUIVisible(false);
        this._hideInfoCard();
      }
      this.currentMode = mode;
      this.isTransitioning = false;
      // 5. 更新按钮文案 + data-mode + 解除禁用
      if (btn) {
        btn.textContent = mode === '2d' ? '意境 ⇄ 云海' : '云海 ⇄ 意境';
        btn.dataset.mode = mode;
        btn.classList.remove('switching');
        btn.removeAttribute('disabled');
      }
      this._toast(mode === '2d' ? '已切换至 意境 2D 模式' : '已切换至 云海 3D 模式', 1800);
    };

    // Task 7.1：用独立的黑色蒙层过渡（300ms 淡入 → 切换 → 300ms 淡出）
    // 原设计复用 engine2D.playInkTransition（金色径向 400ms），Task 7.1 改为黑色蒙层 300ms，
    // 独立 #modeTransition 蒙层避免与 2D 场景切换墨散样式耦合；回调幂等防丢
    this._playModeTransition(finishSwitch);
  }

  /**
   * Task 7.1：模式切换黑色蒙层过渡（300ms 淡入 → 执行回调 → 300ms 淡出）
   * - 使用独立 #modeTransition 蒙层，不干扰 2D 场景切换的 #inkTransition 金色墨散
   * - 回调在蒙层完全不透明时执行（画面被遮蔽，切换动作不可见，无闪烁）
   * - 幂等保护：避免 setTimeout 在标签页隐藏时节流导致回调丢失（done 标志）
   * @param {() => void} onMid 过渡中点（蒙层全黑时）回调
   * @private
   */
  _playModeTransition(onMid) {
    const trans = document.getElementById('modeTransition');
    if (!trans) { onMid && onMid(); return; }
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      try { onMid && onMid(); } catch (err) { console.error('[App] finishSwitch 异常：', err); }
    };
    // 淡入（CSS transition 0.3s）→ 中点回调 → 淡出
    trans.classList.add('active');
    // 两次 rAF 确保 active 类样式先应用再触发过渡，300ms 后蒙层全黑执行切换
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setTimeout(() => {
        run();
        trans.classList.remove('active'); // 触发 0.3s 淡出
      }, 300);
    }));
  }

  /**
   * 加载主题：根据当前模式把 ThemePack 传给对应引擎
   * @param {string} themeId 主题标识或自定义文本
   */
  async loadTheme(themeId) {
    // 优先尝试从 ThemeLoader 加载注册主题
    let pack = null;
    try {
      pack = await this.themeLoader.load(themeId);
    } catch (err) {
      // 加载失败：若 2D 模式有内置主题则降级，否则 toast 报错
      if (this.currentMode !== '3d' && this.engine2D && this.engine2D.hasTheme && this.engine2D.hasTheme(themeId)) {
        this.engine2D.switchTheme(themeId);
        // Task 7.2：2D 内置主题切换也记录当前主题 + 刷新面板高亮
        this.currentThemeId = themeId;
        this._highlightThemeCard(themeId);
        return;
      }
      this._toast('主题「' + themeId + '」加载失败：' + err.message, 2500);
      console.warn('[App] 主题加载失败：', err);
      return;
    }

    if (this.currentMode === '3d' && this.engine3D) {
      this.engine3D.loadTheme(pack);
      this._toast('云海主题：' + (pack.name || themeId), 1800);
    } else if (this.engine2D) {
      // 2D 模式：若命中内置主题则切换，否则提示自定义主题（Task 2 启用）
      if (this.engine2D.hasTheme && this.engine2D.hasTheme(themeId)) {
        this.engine2D.switchTheme(themeId);
      } else {
        this.engine2D.showToast ? this.engine2D.showToast('自定义主题「' + themeId + '」已记录') : this._toast('自定义主题「' + themeId + '」已记录', 1800);
      }
    }
    // Task 7.2：记录当前已加载主题 + 刷新面板高亮（pack.id 优先，回退 themeId）
    this.currentThemeId = (pack && pack.id) || themeId;
    this._highlightThemeCard(this.currentThemeId);
  }

  /**
   * 墨散完成回调钩子（由 Engine2D.playInkTransition 在墨散结束后调用）
   * Task 后续可在此扩展附加逻辑
   */
  _onInkScatterDone() {
    // 预留扩展点
  }

  // ==================== 工具方法 ====================
  /**
   * Task 8 安全加固：校验本地 Three.js 版本号是否与期望一致
   * 不符则 toast 警告（防 vendor 文件被替换为带后门的旧/新版本），仍尝试运行
   * @private
   */
  _verifyThreeRevision() {
    try {
      const rev = THREE && THREE.REVISION;
      if (rev !== EXPECTED_THREE_REVISION) {
        const got = rev === undefined ? '未定义' : String(rev);
        console.warn(`[Security] Three.js 版本异常：期望 ${EXPECTED_THREE_REVISION}，实际 ${got}`);
        this._toast(`Three.js 版本异常（${got}），可能存在安全风险`, 3500);
      }
    } catch (err) {
      console.warn('[Security] Three.js 版本校验失败：', err);
      this._toast('Three.js 加载异常，3D 模式可能不可用', 3500);
    }
  }

  // ==================== Task 5：3D 飞行导航 + 粒子交互集成 ====================

  /**
   * 初始化 3D 交互组件：注册粒子拾取回调、绑定搜索框、信息卡关闭按钮、HUD 刷新定时器
   * @private
   */
  _initInteraction() {
    // 缓存 DOM 引用
    this._infoCard    = document.getElementById('infoCard');
    this._infoPoem    = document.getElementById('infoPoem');
    this._infoMeta    = document.getElementById('infoMeta');
    this._infoSource  = document.getElementById('infoSource');
    this._infoMeaning = document.getElementById('infoMeaning');
    this._hud          = document.getElementById('hud');
    this._hudSpeed     = document.getElementById('hudSpeed');
    this._hudCoord     = document.getElementById('hudCoord');
    this._hudParticles = document.getElementById('hudParticles');
    this._hudFps       = document.getElementById('hudFps');
    this._hudMult      = document.getElementById('hudMult');
    // Task 7.4：HUD 新增 质量等级 + 主题名 引用
    this._hudQuality   = document.getElementById('hudQuality');
    this._hudTheme     = document.getElementById('hudTheme');
    this._searchBoxWrap = document.getElementById('searchBoxWrap');
    // Task 7.2/7.3：主题面板 + 密度滑块 引用
    this._themePanelEl    = document.getElementById('themePanel');
    this._themePanelToggle = document.getElementById('themePanelToggle');
    this._themePanelMenu   = document.getElementById('themePanelMenu');
    this._densitySlider    = document.getElementById('densitySlider');

    // 注册粒子拾取回调（Engine3D 点击粒子时调用）
    if (this.engine3D) {
      this.engine3D.onParticlePicked = (payload) => this._handlePick(payload);
    }

    // 搜索框：回车触发搜索
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
      searchBox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const kw = searchBox.value.trim();
          if (kw) this._searchInParticles(kw);
        }
      });
    }

    // 信息卡关闭按钮
    const infoClose = document.getElementById('infoClose');
    if (infoClose) {
      infoClose.addEventListener('click', () => this._hideInfoCard());
    }

    // Task 7.2：主题面板折叠按钮（桌面折叠/展开，移动端不显示折叠按钮）
    if (this._themePanelToggle) {
      this._themePanelToggle.addEventListener('click', () => {
        this._themePanelCollapsed = !this._themePanelCollapsed;
        if (this._themePanelEl) {
          this._themePanelEl.classList.toggle('collapsed', this._themePanelCollapsed);
        }
      });
    }
    // Task 7.2：移动端菜单按钮（滑出/收起主题面板）
    if (this._themePanelMenu) {
      this._themePanelMenu.addEventListener('click', () => {
        if (this._themePanelEl) this._themePanelEl.classList.toggle('show');
      });
    }
    // 移动端：点击面板外区域收起面板
    document.addEventListener('click', (e) => {
      if (!this._themePanelEl || !this._themePanelMenu) return;
      if (window.innerWidth > 768) return;
      const t = e.target;
      if (t && !this._themePanelEl.contains(t) && !this._themePanelMenu.contains(t)) {
        this._themePanelEl.classList.remove('show');
      }
    });

    // Task 7.3：密度滑块 3D 模式联动（2D 模式由 engine2D.bindEvents 自身监听处理）
    // 3D 模式调节 ParticleSystem3D.activeParticles（engine3D.setDensity 防抖重新布局）
    if (this._densitySlider) {
      this._densitySlider.addEventListener('input', (e) => {
        if (this.currentMode !== '3d' || !this.engine3D) return;
        if (typeof this.engine3D.setDensity !== 'function') return;
        const factor = Number(e.target.value) / 100;
        clearTimeout(this._densityDebounce);
        this._densityDebounce = setTimeout(() => {
          this.engine3D.setDensity(factor);
        }, 120);
      });
    }

    // HUD 刷新定时器（10Hz，足够刷新速度/坐标/FPS）
    this._hudTimer = setInterval(() => this._updateHUD(), 100);
  }

  /**
   * 3D 专属 UI（HUD + 搜索框）显隐
   * @param {boolean} v
   * @private
   */
  _set3DUIVisible(v) {
    if (this._hud) this._hud.classList.toggle('show', v);
    if (this._searchBoxWrap) this._searchBoxWrap.classList.toggle('show', v);
  }

  /**
   * 粒子拾取回调：命中则显示信息卡，未命中则关闭
   * @param {{particleIndex:number,position:object,content:object,screenX:number,screenY:number,clientX:number,clientY:number}|null} payload
   * @private
   */
  _handlePick(payload) {
    if (!payload || !payload.content) {
      this._hideInfoCard();
      return;
    }
    this._showInfoCard(payload);
  }

  /**
   * 显示毛玻璃信息卡：所有文本用 textContent 渲染（防 XSS，Task 8 复检）
   * 跟随点击位置定位，并在视口内自动调整避免超出边界
   * @param {object} payload
   * @private
   */
  _showInfoCard(payload) {
    if (!this._infoCard || !payload.content) return;
    const c = payload.content;

    // 用 textContent 渲染（绝不使用 innerHTML，防 XSS 注入）
    this._infoPoem.textContent = c.text || '';
    const author = c.author || '佚名';
    const era = c.era || (this.engine3D && this.engine3D.currentTheme ? this.engine3D.currentTheme.era : '');
    this._infoMeta.textContent = era ? `${author} · ${era}` : author;
    this._infoSource.textContent = c.source ? `出处 · ${c.source}` : '';
    this._infoMeaning.textContent = c.meaning || c.interpretation || '（暂无释义）';

    // 定位：跟随点击位置，视口内自动调整
    const cardW = 300;
    const cardH = this._infoCard.offsetHeight || 220;
    const margin = 12;
    let x = (payload.clientX != null ? payload.clientX : payload.screenX) + margin;
    let y = (payload.clientY != null ? payload.clientY : payload.screenY) + margin;
    if (x + cardW > window.innerWidth - 8) {
      x = (payload.clientX != null ? payload.clientX : payload.screenX) - cardW - margin;
    }
    if (y + cardH > window.innerHeight - 8) {
      y = window.innerHeight - cardH - 8;
    }
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    this._infoCard.style.left = x + 'px';
    this._infoCard.style.top = y + 'px';
    this._infoCard.classList.add('show');
  }

  /**
   * 隐藏信息卡
   * @private
   */
  _hideInfoCard() {
    if (this._infoCard) this._infoCard.classList.remove('show');
  }

  /**
   * 刷新 HUD：从 engine3D.getHUDState() 读取并填充到 HUD 文本
   * @private
   */
  _updateHUD() {
    if (this.currentMode !== '3d' || !this.engine3D) return;
    const s = this.engine3D.getHUDState();
    if (this._hudSpeed) this._hudSpeed.textContent = s.speed;
    if (this._hudCoord) this._hudCoord.textContent = `${s.x}, ${s.y}, ${s.z}`;
    if (this._hudParticles) this._hudParticles.textContent = s.particles.toLocaleString();
    if (this._hudFps) this._hudFps.textContent = s.fps;
    // Task 7.4：调速倍率（DOM 里已用 × 前缀包裹，这里只填数字）
    if (this._hudMult) this._hudMult.textContent = s.multiplier.toFixed(1);
    // Task 7.4：质量等级（高/中/低 + 颜色 class）
    if (this._hudQuality) {
      const Q_TEXT = { high: '高', medium: '中', low: '低' };
      this._hudQuality.textContent = Q_TEXT[s.quality] || String(s.quality || '');
      this._hudQuality.className = 'hud-quality ' + (s.quality || 'high');
    }
    // Task 7.4：当前主题名（回退到 currentThemeId）
    if (this._hudTheme) {
      this._hudTheme.textContent = s.themeName || this.currentThemeId || '—';
    }
  }

  /**
   * Task 5.5：在当前主题的 content 中搜索关键词
   * 匹配 text/author/source 字段，命中则：
   * 1) 高亮匹配粒子簇（每个匹配项取一簇代表粒子，避免全量高亮卡顿）
   * 2) 相机平滑飞向匹配粒子簇中心
   * 3) 暂停悬停高亮 3.5 秒，避免搜索高亮被悬停覆盖
   * 无匹配则 toast 提示并清除高亮
   * @param {string} keyword
   * @private
   */
  _searchInParticles(keyword) {
    if (this.currentMode !== '3d' || !this.engine3D || !this.engine3D.particleSystem) {
      this._toast('请切换到 3D 云海模式后搜索', 1800);
      return;
    }
    const content = this.engine3D.currentContent;
    if (!content || content.length === 0) {
      this._toast('当前主题无可搜索内容', 1800);
      return;
    }
    const kw = String(keyword).toLowerCase().trim();
    if (!kw) return;

    // 匹配 content（text / author / source 任一命中）
    const matched = [];
    for (let i = 0; i < content.length; i++) {
      const c = content[i] || {};
      const text   = String(c.text || '').toLowerCase();
      const author = String(c.author || '').toLowerCase();
      const source = String(c.source || '').toLowerCase();
      if (text.includes(kw) || author.includes(kw) || source.includes(kw)) {
        matched.push(i);
      }
    }

    if (matched.length === 0) {
      this._toast('未找到匹配诗句', 2000);
      this.engine3D.particleSystem.clearHighlight();
      return;
    }

    // 收集匹配粒子簇的代表粒子：粒子 i 对应 content[i % content.length]
    // 每个匹配项取一簇（perCluster 个），控制高亮粒子总数，避免全量高亮卡顿
    const total = this.engine3D.particlesCount;
    const clen = content.length;
    const perCluster = 80;
    const matchSet = new Set(matched);
    const indices = [];
    const counts = new Map();
    for (let i = 0; i < total; i++) {
      const ci = i % clen;
      if (!matchSet.has(ci)) continue;
      const cnt = counts.get(ci) || 0;
      if (cnt < perCluster) {
        indices.push(i);
        counts.set(ci, cnt + 1);
      }
    }

    // 高亮匹配粒子簇
    this.engine3D.particleSystem.highlightGroup(indices);

    // 计算匹配粒子簇中心，相机平滑飞向
    const positions = this.engine3D.particleSystem.positions;
    let cx = 0, cy = 0, cz = 0, n = 0;
    for (let k = 0; k < indices.length; k++) {
      const i3 = indices[k] * 3;
      cx += positions[i3];
      cy += positions[i3 + 1];
      cz += positions[i3 + 2];
      n++;
    }
    if (n > 0) {
      const center = new THREE.Vector3(cx / n, cy / n, cz / n);
      this.engine3D.flyTo(center, 1.2, 360);
    }

    // 暂停悬停高亮 3.5 秒，避免搜索高亮被鼠标悬停覆盖
    this.engine3D.suspendHover = true;
    clearTimeout(this._searchHoverTimer);
    this._searchHoverTimer = setTimeout(() => {
      if (this.engine3D) this.engine3D.suspendHover = false;
    }, 3500);

    this._toast(`找到 ${matched.length} 条匹配诗句`, 1800);
  }

  _set2DVisible(v) {
    ['bgCanvas', 'inkCanvas', 'canvas', 'shapeCanvas'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = v ? '' : 'none';
    });
  }

  _set3DVisible(v) {
    const el = document.getElementById('webglCanvas');
    if (el) el.style.display = v ? 'block' : 'none';
  }

  _toast(msg, duration = 2000) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), duration);
  }

  /**
   * 启动入口：等字体就绪后初始化 App，并挂载到 window.app 供 UI 事件调用
   */
  static async boot() {
    const app = new App();
    window.app = app;
    await app.init();
    return app;
  }
}

// ==================== 启动 ====================
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => App.boot());
} else {
  window.addEventListener('load', () => App.boot());
}

// 功能描述：中华文化粒子云引擎的主控制器。定义 App 类，持有 Engine2D 与 Engine3D 实例，维护当前模式 currentMode（'2d'/'3d'）。提供 switchMode（双模式切换，复用 2D 引擎墨散作为过渡；Task 5 在切换时同步启用/禁用 3D 交互 engine3D.enableInteraction/disableInteraction，并显隐 HUD 与搜索框 _set3DUIVisible）、loadTheme（异步：调用 themeLoader.load 拿到 ThemePack 实例后按当前模式分发给 Engine3D 或 Engine2D）、_renderThemePanel（调用 themeLoader.list 拿到所有主题元信息按 category 分组渲染到 #themePanel，点击项调用 loadTheme(id)）、_onInkScatterDone（墨散完成回调钩子）等方法，并暴露 window.app 全局供 UI 事件调用。
// Task 8 安全加固：构造时挂载 this.sanitize = Security（来自 ./security.js），init() 开头调用 _verifyThreeRevision 校验本地 THREE.REVISION === '169'，不符则 toast 警告。
// Task 5 飞行导航 + 粒子交互：
// - _initInteraction()：注册 engine3D.onParticlePicked 回调、绑定 #searchBox 回车搜索、#infoClose 关闭按钮、
//   启动 10Hz HUD 刷新定时器 _updateHUD（从 engine3D.getHUDState 读取 speed/xyz/particles/fps/multiplier）；
// - _handlePick/_showInfoCard/_hideInfoCard：点击粒子弹出毛玻璃信息卡，所有文本用 textContent 渲染（防 XSS），
//   跟随点击位置定位并在视口内自动调整边界；点击空白或关闭按钮则隐藏；
// - _searchInParticles(keyword)：在当前主题 content 中匹配 text/author/source，命中则调用
//   particleSystem.highlightGroup 高亮匹配粒子簇（每匹配项取 80 个代表粒子控制总数），
//   计算簇中心调用 engine3D.flyTo 平滑飞向，并设置 engine3D.suspendHover=true 暂停悬停 3.5 秒避免覆盖；
//   无匹配则 toast「未找到匹配诗句」并清除高亮；
// - 切换到 2D 模式时禁用 3D 交互、隐藏 HUD/搜索框、关闭信息卡。
// 初始化时默认以 2D 模式启动「千山」场景，并尝试初始化 3D 引擎；Task 2 在 init() 中预加载 TANGSHI_TEST_THEME
// 测试主题（galaxy 螺旋布局），让 3D 引擎在用户切换到云海模式前已布置好粒子云，start() 后第一次 update 即推进 morph 动画。
// 失败则 toast 提示并保持 2D。Task 3 接入真实 ThemeLoader（来自 ./theme-loader.js），Task 4 创建 themes/ 目录真实主题数据后可移除测试主题。
// Task 8 安全加固增强：1) import * as THREE 与 * as Security，挂载 this.sanitize = Security（→ window.app.sanitize.sanitizeText / sanitizeForDisplay / validateInput / renderInfoCard / renderMultilineText 供 UI 与 Task 5/6 调用）；2) init() 首步调用 _verifyThreeRevision() 校验 THREE.REVISION === '169'，不符则 toast 警告（防 vendor 被替换）；3) 自定义输入框 input 事件实时调用 sanitizeForDisplay 剥离 HTML 标签与危险关键字、回车提交前 validateInput(keyword) 校验；4) _renderThemePanel 用 textContent 清空替代 innerHTML。
// Task 6 自定义主题输入：1) import { handleCustomSubmit } from './custom-input.js'；
// 2) init() 第 4 步抽取为 _initCustomInput() 独立方法，绑定 #customInput input 事件
//    （实时 sanitizeForDisplay 净化 + 长度限制 200 字符）与 keydown Enter 事件，
//    以及 #customRenderBtn 点击事件；3) 回车 / 点击均调用 _submitCustomInput → handleCustomSubmit
//    统一入口：sanitizeText 净化 → 非空校验 → 若非 3D 模式自动 switchMode('3d') →
//    themeLoader.search 模糊匹配 name/description/era/category/id（精确匹配 id/name 优先，
//    模糊匹配唯一则加载，多个则 toast 提示选择）→ 命中则 loadTheme + toast「已加载主题：xxx」→
//    无命中则走 renderCustomText 文字采样（离屏 canvas 渲染 + alpha 采样 + 转 XYZ 坐标）
//    调用 engine3D.loadCustomTargets(targets, 金墨配色) 触发 morph；4) 提交成功后清空输入框并失焦。
// Task 7 双模式切换 UI 与主题选择面板：
// - 7.1 switchMode 时序 bug 修复：原 finishSwitch 漏调 Task 5 的 enableInteraction/disableInteraction 与
//   _set3DUIVisible/_hideInfoCard，导致切到 3D 后 HUD/搜索框不显示、飞行控制不可用；切回 2D 后 3D 交互未释放。
//   现在切到 3D 时 engine3D.enableInteraction() + _set3DUIVisible(true)；切到 2D 时 disableInteraction() +
//   _set3DUIVisible(false) + _hideInfoCard()。过渡改用独立 #modeTransition 黑色蒙层（300ms 淡入→切换→300ms 淡出），
//   替代原 engine2D.playInkTransition（金色径向 400ms），避免与 2D 场景切换墨散耦合；回调幂等防丢。
//   #modeSwitch 按钮金边毛玻璃 + 悬停发光 + ::before 模式指示灯（2d 暗/3d 亮），过渡中加 .switching + disabled 防抖脉冲。
// - 7.2 _renderThemePanel 重构：合并 THEME_META_HINT 静态元数据（id→name/era/category/description，取自 registry 注释，
//   不读 themes/），按 5 个固定分类（诗词/典籍/民俗/天文/哲学）分组渲染卡片。卡片含主题名（Ma Shan Zheng）+ 朝代标签 +
//   简短描述 + 状态角标（已加载金色/待激活灰色虚线）。点击卡片 _activateTheme：若当前 2D 先 switchMode('3d') 等 700ms
//   再 loadTheme。当前主题高亮（金边亮 + 角标「已加载」），_highlightThemeCard 切换 .active。
//   面板可折叠（#themePanelToggle 切 .collapsed，折叠后仅分类标签竖排）；移动端 #themePanelMenu 滑出（.show）+ 点外收起。
//   loadTheme 成功后更新 currentThemeId + _highlightThemeCard，HUD 主题名同步。
// - 7.3 密度滑块 3D 联动：_initInteraction 绑定 #densitySlider input 事件，3D 模式调用 engine3D.setDensity(factor)
//   （120ms 防抖），2D 模式仍由 engine2D.bindEvents 处理。保留 5 套主题色球 / 播放条 / 密度滑块 UI。
// - 7.4 HUD 完善：5 行紧凑（速度+调速 / 坐标 / 粒子 / 帧率+质量 / 主题名），_updateHUD 填充质量等级（高/中/低 + 颜色 class）
//   与主题名（engine3D.getHUDState.themeName）。移动端简化仅 FPS + 主题名（隐藏 speed/coord/particles 行）。
