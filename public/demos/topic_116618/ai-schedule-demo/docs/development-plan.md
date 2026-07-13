# AI 日程 — 完整开发计划（含创新功能）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 将当前纯前端 Demo 升级为具备 AI 智能调度、游戏化成长、社交协作、隐私优先的完整日程应用。

**架构：** 采用模块化单页应用架构，每个功能域独立文件。数据层使用 localStorage + 可选 IndexedDB，AI 层采用端侧规则引擎 + 可选云端 API 的混合架构。所有交互通过事件总线解耦。

**技术栈：** 原生 HTML/CSS/JS（零依赖），Web Speech API（语音），Notification API（通知），Service Worker（PWA），localStorage（持久化）。

**创新亮点：**
1. AI 拖延心理模型 — 不仅检测拖延，还分析原因并针对性干预
2. 能量曲线匹配 — 根据用户精力高峰自动安排高认知任务
3. RPG 成长系统 — XP/等级/成就/金币，游戏化驱动习惯养成
4. 护盾保护机制 — 生病/考试时可冻结连续记录而不丢失
5. 语音 + 手势双模交互 — 语音创建任务 + 手势导航
6. 隐私仪表盘 — 展示 AI 为什么这样建议，数据使用完全透明
7. 智能时间块 — 可视化拖拽式日程编排，AI 自动填充空闲时段
8. 社交问责闭环 — 好友监督 + 团队挑战 + 排行榜正向循环

---

## 文件结构总览

```
ai-schedule-demo/
├── index.html                    # 主页面（修改）
├── manifest.json                 # PWA 配置（新建）
├── sw.js                         # Service Worker（新建）
├── css/
│   └── style.css                 # 全局样式（修改 + 扩展）
├── js/
│   ├── app.js                    # 入口 + 初始化 + 事件总线（修改）
│   ├── storage.js                # 数据持久化层（新建）
│   ├── event-bus.js              # 模块间通信（新建）
│   ├── nlp.js                    # 自然语言解析引擎（新建）
│   ├── ai-engine.js              # AI 核心引擎（新建）
│   ├── gamification.js           # RPG 成长系统（新建）
│   ├── energy-curve.js           # 能量曲线分析（新建）
│   ├── procrastination.js        # 拖延心理模型（新建）
│   ├── calendar.js               # 日历视图组件（新建）
│   ├── time-block.js             # 智能时间块组件（新建）
│   ├── notifications.js           # 通知服务（新建）
│   ├── voice.js                  # 语音交互（新建）
│   ├── gestures.js               # 手势导航增强（新建）
│   ├── privacy-dashboard.js      # 隐私仪表盘（新建）
│   ├── social.js                 # 社交问责系统（新建）
│   └── utils.js                  # 通用工具函数（新建）
└── docs/
    └── development-plan.md       # 本文件
```

---

## 第一阶段：基础架构重构（第 1-2 天）

### Task 1: 事件总线与模块化基础

**文件：**
- 创建：`js/event-bus.js`
- 创建：`js/utils.js`
- 修改：`js/app.js`

**目标：** 建立模块间解耦通信机制，提取通用工具函数。

- [ ] **Step 1: 创建事件总线**

```javascript
// js/event-bus.js
const EventBus = {
  _listeners: {},

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
    return () => this.off(event, callback);
  },

  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  },

  emit(event, data) {
    if (!this._listeners[event]) return;
    this._listeners[event].forEach(cb => cb(data));
  },

  once(event, callback) {
    const unsub = this.on(event, (...args) => {
      unsub();
      callback(...args);
    });
    return unsub;
  }
};

// 预定义事件常量
EventBus.EVENTS = {
  TASK_ADDED: 'task:added',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  TASK_COMPLETED: 'task:completed',
  TASK_REORDERED: 'task:reordered',
  CHECKIN_DONE: 'checkin:done',
  FOCUS_STARTED: 'focus:started',
  FOCUS_COMPLETED: 'focus:completed',
  THEME_CHANGED: 'theme:changed',
  XP_GAINED: 'xp:gained',
  LEVEL_UP: 'level:up',
  ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
  DATA_SAVED: 'data:saved',
  DATA_LOADED: 'data:loaded'
};
```

- [ ] **Step 2: 创建通用工具函数**

```javascript
// js/utils.js
const Utils = {
  // HTML 转义（防 XSS）
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // 唯一 ID 生成器
  _idCounter: 10000,
  genId() {
    return ++this._idCounter;
  },

  // 格式化时间 HH:MM
  formatTime(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  // 格式化日期 YYYY-MM-DD
  formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  // 获取中文星期
  getWeekday(date) {
    return ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
  },

  // 获取问候语
  getGreeting() {
    const h = new Date().getHours();
    if (h < 6) return '夜深了';
    if (h < 12) return '早上好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  },

  // 优先级图标
  priorityIcon(p) {
    if (p === 'high') return '🔥';
    if (p === 'low') return '💧';
    return '';
  },

  // 重复标签
  repeatLabel(r) {
    const map = { none: '', daily: '每天', weekly: '每周', monthly: '每月' };
    return map[r] || '';
  },

  // 分类标签
  tagName(tag) {
    const map = { work: '工作', study: '学习', life: '生活' };
    return map[tag] || tag;
  },

  // 防抖
  debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  // 节流
  throttle(fn, interval) {
    let lastTime = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastTime >= interval) {
        lastTime = now;
        fn(...args);
      }
    };
  },

  // 生成随机颜色
  randomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 60%)`;
  },

  // 数字动画（从 a 到 b）
  animateNumber(el, from, to, duration = 800) {
    const start = performance.now();
    const update = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      el.textContent = Math.round(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }
};
```

- [ ] **Step 3: 在 index.html 中按正确顺序引入所有 JS**

```html
<!-- 在 </body> 前按此顺序引入 -->
<script src="js/event-bus.js"></script>
<script src="js/utils.js"></script>
<script src="js/storage.js"></script>
<script src="js/gamification.js"></script>
<script src="js/energy-curve.js"></script>
<script src="js/procrastination.js"></script>
<script src="js/nlp.js"></script>
<script src="js/ai-engine.js"></script>
<script src="js/calendar.js"></script>
<script src="js/time-block.js"></script>
<script src="js/notifications.js"></script>
<script src="js/voice.js"></script>
<script src="js/gestures.js"></script>
<script src="js/privacy-dashboard.js"></script>
<script src="js/social.js"></script>
<script src="js/app.js"></script>
```

---

### Task 2: 数据持久化层

**文件：**
- 创建：`js/storage.js`
- 修改：`js/app.js`

**目标：** 封装 localStorage，支持所有数据类型的持久化与版本迁移。

- [ ] **Step 1: 创建 Storage 模块**

```javascript
// js/storage.js
const Storage = {
  VERSION: 1,
  PREFIX: 'aisched_',

  KEYS: {
    TASKS: 'tasks',
    SETTINGS: 'settings',
    CHECKIN: 'checkin',
    TEAM: 'team',
    USER: 'user',
    GAMIFICATION: 'gami',
    ENERGY: 'energy',
    PRIVACY: 'privacy',
    SOCIAL: 'social',
    META: 'meta'
  },

  _key(name) {
    return this.PREFIX + name;
  },

  get(name, defaultValue = null) {
    try {
      const raw = localStorage.getItem(this._key(name));
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set(name, value) {
    try {
      localStorage.setItem(this._key(name), JSON.stringify(value));
      EventBus.emit(EventBus.EVENTS.DATA_SAVED, { name });
    } catch (e) {
      console.warn('Storage write failed:', e);
    }
  },

  remove(name) {
    localStorage.removeItem(this._key(name));
  },

  // ===== 任务 =====
  getTasks() {
    return this.get(this.KEYS.TASKS, []);
  },

  saveTasks(tasks) {
    this.set(this.KEYS.TASKS, tasks);
  },

  // ===== 设置 =====
  getSettings() {
    return this.get(this.KEYS.SETTINGS, {
      theme: 'dark',
      timezone: 'Asia/Shanghai',
      notifications: {
        taskReminder: true,
        aiSuggestions: true,
        focusMode: false,
        teamMessages: true,
        socialUpdates: true
      },
      privacy: {
        shareStats: false,
        shareAchievements: true,
        dataCollection: false
      }
    });
  },

  saveSettings(settings) {
    this.set(this.KEYS.SETTINGS, settings);
  },

  // ===== 签到 =====
  getCheckin() {
    return this.get(this.KEYS.CHECKIN, {
      streak: 0,
      bestStreak: 0,
      totalDays: 0,
      lastDate: null,
      checkedIn: false,
      shieldActive: false,
      shieldExpiry: null
    });
  },

  saveCheckin(data) {
    this.set(this.KEYS.CHECKIN, data);
  },

  // ===== 用户 =====
  getUser() {
    return this.get(this.KEYS.USER, {
      name: '小明',
      email: '',
      id: 'aisched_' + Math.random().toString(36).substr(2, 8),
      avatar: 1,
      createdAt: Date.now()
    });
  },

  saveUser(user) {
    this.set(this.KEYS.USER, user);
  },

  // ===== 游戏化 =====
  getGamification() {
    return this.get(this.KEYS.GAMIFICATION, {
      xp: 0,
      level: 1,
      coins: 0,
      achievements: [],
      dailyXp: 0,
      lastXpDate: null
    });
  },

  saveGamification(data) {
    this.set(this.KEYS.GAMIFICATION, data);
  },

  // ===== 能量曲线 =====
  getEnergyData() {
    return this.get(this.KEYS.ENERGY, {
      hourlyScores: {},   // { "9": [0.8, 0.9, 0.7], "14": [0.5, 0.6] }
      lastUpdated: null
    });
  },

  saveEnergyData(data) {
    this.set(this.KEYS.ENERGY, data);
  },

  // ===== 隐私日志 =====
  getPrivacyLog() {
    return this.get(this.KEYS.PRIVACY, []);
  },

  addPrivacyEntry(entry) {
    const log = this.getPrivacyLog();
    log.push({ ...entry, timestamp: Date.now() });
    // 只保留最近 100 条
    if (log.length > 100) log.splice(0, log.length - 100);
    this.set(this.KEYS.PRIVACY, log);
  },

  // ===== 版本迁移 =====
  migrate() {
    const meta = this.get(this.KEYS.META, { version: 0 });
    if (meta.version < this.VERSION) {
      // 从 v0 到 v1 的迁移逻辑
      if (meta.version === 0) {
        // 初始版本，无需迁移
      }
      this.set(this.KEYS.META, { version: this.VERSION, migratedAt: Date.now() });
    }
  },

  // ===== 清空 =====
  clearAll() {
    Object.values(this.KEYS).forEach(name => this.remove(name));
  },

  // ===== 导出全部数据 =====
  exportAll() {
    const data = {};
    Object.entries(this.KEYS).forEach(([key, name]) => {
      data[name] = this.get(name);
    });
    return data;
  },

  // ===== 导入数据 =====
  importAll(data) {
    Object.entries(data).forEach(([name, value]) => {
      this.set(name, value);
    });
  }
};
```

- [ ] **Step 2: 在 app.js 初始化中加载持久化数据**

修改 `init()` 函数，在最开头调用 `Storage.migrate()` 并加载数据：

```javascript
function init() {
  // 1. 数据迁移
  Storage.migrate();

  // 2. 加载持久化数据
  const savedTasks = Storage.getTasks();
  if (savedTasks.length > 0) tasks = savedTasks;

  const savedSettings = Storage.getSettings();
  currentTheme = savedSettings.theme;

  const savedCheckin = Storage.getCheckin();
  streak = savedCheckin.streak;
  checkedIn = savedCheckin.checkedIn;
  const today = new Date().toDateString();
  if (savedCheckin.lastDate !== today) {
    checkedIn = false;
    // 检查护盾是否过期
    if (savedCheckin.shieldActive && savedCheckin.shieldExpiry) {
      if (new Date(savedCheckin.shieldExpiry) < new Date()) {
        // 护盾过期，streak 归零
        streak = 0;
        Storage.saveCheckin({ ...savedCheckin, shieldActive: false, streak: 0 });
      }
      // 护盾未过期，保持 streak
    } else if (!savedCheckin.shieldActive && savedCheckin.lastDate) {
      // 无护盾且昨天未签到，连续中断
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (savedCheckin.lastDate !== yesterday.toDateString()) {
        streak = 0;
      }
    }
  }

  const savedUser = Storage.getUser();
  userName = savedUser.name;

  // 3. 初始化游戏化系统
  Gamification.init();

  // 4. 初始化能量曲线
  EnergyCurve.init();

  // 5. 渲染 UI
  updateClock();
  renderTasks();
  updateProgress();
  renderCheckin();
  updateSuggestion(true);
  renderTeamOverview();
  renderStats();
  Gamification.renderHUD();
  EnergyCurve.renderMiniChart();

  // 6. 动画
  setTimeout(() => animateBars(), 300);

  // 7. 手势
  initSwipe();

  // 8. 定时器
  setInterval(updateClock, 30000);

  // 9. 应用主题
  applyTheme(currentTheme);

  // 10. 发射数据加载完成事件
  EventBus.emit(EventBus.EVENTS.DATA_LOADED);
}
```

- [ ] **Step 3: 在所有数据变更点添加持久化调用**

在以下函数末尾添加对应的 `Storage.save*()` 调用：
- `saveTask()` → `Storage.saveTasks(tasks)`
- `deleteTask()` → `Storage.saveTasks(tasks)`
- `toggleTask()` → `Storage.saveTasks(tasks)`
- `handleDrop()` → `Storage.saveTasks(tasks)`
- `doCheckin()` → `Storage.saveCheckin({...})`
- `setTheme()` → `Storage.saveSettings(Storage.getSettings())`
- `saveAccount()` → `Storage.saveUser(Storage.getUser())`
- `toggleNotif()` → `Storage.saveSettings(Storage.getSettings())`
- `addTeamTask()` → `Storage.saveTeam(teamGroups)`
- `publishAnnouncement()` → `Storage.saveTeam(teamGroups)`

---

## 第二阶段：创新功能 — 游戏化成长系统（第 3-4 天）

### Task 3: RPG 成长系统

**文件：**
- 创建：`js/gamification.js`
- 修改：`index.html`（添加 XP 进度条和等级显示）
- 修改：`css/style.css`（游戏化 UI 样式）

**目标：** 实现完整的 XP/等级/成就/金币系统，让任务完成有游戏化反馈。

**创新点：** 结合 VITA Quest 的 RPG 系统和 Habitica 的社交问责，形成"完成任务 → 获得奖励 → 社交认可 → 更多动力"的正向循环。

- [ ] **Step 1: 创建游戏化核心模块**

```javascript
// js/gamification.js
const Gamification = {
  data: null,

  // XP 等级表（指数增长）
  XP_TABLE: [
    0, 100, 250, 500, 850, 1300, 1900, 2700, 3800, 5200,
    7000, 9500, 13000, 18000, 25000, 35000, 50000, 70000, 100000
  ],

  // 成就定义
  ACHIEVEMENTS: [
    { id: 'first_task', name: '初出茅庐', desc: '完成第一个任务', icon: '🌱', xp: 50, condition: (d) => d.totalCompleted >= 1 },
    { id: 'streak_3', name: '三日连胜', desc: '连续签到 3 天', icon: '🔥', xp: 100, condition: (d) => d.streak >= 3 },
    { id: 'streak_7', name: '一周坚持', desc: '连续签到 7 天', icon: '⭐', xp: 300, condition: (d) => d.streak >= 7 },
    { id: 'streak_30', name: '月度达人', desc: '连续签到 30 天', icon: '🏆', xp: 1000, condition: (d) => d.streak >= 30 },
    { id: 'tasks_10', name: '效率新手', desc: '累计完成 10 个任务', icon: '📋', xp: 150, condition: (d) => d.totalCompleted >= 10 },
    { id: 'tasks_50', name: '效率专家', desc: '累计完成 50 个任务', icon: '📊', xp: 500, condition: (d) => d.totalCompleted >= 50 },
    { id: 'tasks_100', name: '效率大师', desc: '累计完成 100 个任务', icon: '💎', xp: 1500, condition: (d) => d.totalCompleted >= 100 },
    { id: 'focus_1h', name: '专注新手', desc: '累计专注 1 小时', icon: '🧘', xp: 100, condition: (d) => d.totalFocusMin >= 60 },
    { id: 'focus_10h', name: '专注达人', desc: '累计专注 10 小时', icon: '🎯', xp: 500, condition: (d) => d.totalFocusMin >= 600 },
    { id: 'level_5', name: '成长中', desc: '达到等级 5', icon: '📈', xp: 200, condition: (d) => d.level >= 5 },
    { id: 'level_10', name: '进阶者', desc: '达到等级 10', icon: '🚀', xp: 500, condition: (d) => d.level >= 10 },
    { id: 'social_first', name: '社交蝴蝶', desc: '首次分享成就', icon: '🦋', xp: 100, condition: (d) => d.sharedCount >= 1 },
    { id: 'shield_used', name: '护盾使者', desc: '首次使用护盾保护连续记录', icon: '🛡️', xp: 50, condition: (d) => d.shieldUsed },
    { id: 'early_bird', name: '早起鸟儿', desc: '在 6:00 前完成一个任务', icon: '🐦', xp: 200, condition: (d) => d.earlyTaskDone },
    { id: 'night_owl', name: '夜猫子', desc: '在 23:00 后完成一个任务', icon: '🦉', xp: 200, condition: (d) => d.lateTaskDone },
    { id: 'perfect_day', name: '完美一天', desc: '一天内完成所有任务', icon: '✨', xp: 500, condition: (d) => d.perfectDays >= 1 },
    { id: 'team_player', name: '团队之星', desc: '完成 10 个团队任务', icon: '🌟', xp: 300, condition: (d) => d.teamCompleted >= 10 }
  ],

  // 奖励商店
  REWARDS: [
    { id: 'theme_unlock', name: '解锁限定主题', cost: 500, icon: '🎨', type: 'unlock' },
    { id: 'avatar_frame', name: '金色头像框', cost: 300, icon: '🖼️', type: 'cosmetic' },
    { id: 'focus_boost', name: '专注加速（+5分钟）', cost: 200, icon: '⚡', type: 'boost' },
    { id: 'streak_protect', name: '护盾（保护1天连续记录）', cost: 400, icon: '🛡️', type: 'shield' },
    { id: 'double_xp', name: '双倍 XP（1小时）', cost: 600, icon: '💎', type: 'boost' }
  ],

  init() {
    this.data = Storage.getGamification();
    // 检查是否是新的一天，重置每日 XP
    const today = new Date().toDateString();
    if (this.data.lastXpDate !== today) {
      this.data.dailyXp = 0;
      this.data.lastXpDate = today;
      Storage.saveGamification(this.data);
    }
  },

  // 获取当前等级所需 XP
  getXpForLevel(level) {
    return this.XP_TABLE[Math.min(level, this.XP_TABLE.length - 1)] || this.XP_TABLE[this.XP_TABLE.length - 1];
  },

  // 获取当前等级进度百分比
  getLevelProgress() {
    const currentLevelXp = this.getXpForLevel(this.data.level);
    const nextLevelXp = this.getXpForLevel(this.data.level + 1);
    const xpInLevel = this.data.xp - currentLevelXp;
    const xpNeeded = nextLevelXp - currentLevelXp;
    return Math.min(Math.round((xpInLevel / xpNeeded) * 100), 100);
  },

  // 增加 XP
  addXp(amount, reason) {
    const oldLevel = this.data.level;
    this.data.xp += amount;
    this.data.dailyXp += amount;

    // 检查升级
    while (this.data.level < this.XP_TABLE.length - 1 &&
           this.data.xp >= this.getXpForLevel(this.data.level + 1)) {
      this.data.level++;
    }

    // 金币奖励（XP 的 10%）
    this.data.coins += Math.floor(amount * 0.1);

    Storage.saveGamification(this.data);

    // 发射事件
    EventBus.emit(EventBus.EVENTS.XP_GAINED, { amount, reason, total: this.data.xp });

    if (this.data.level > oldLevel) {
      EventBus.emit(EventBus.EVENTS.LEVEL_UP, { from: oldLevel, to: this.data.level });
    }

    // 检查成就
    this.checkAchievements();

    return this.data.level > oldLevel; // 返回是否升级
  },

  // 检查成就
  checkAchievements() {
    const context = {
      totalCompleted: tasks.filter(t => t.done).length,
      streak: Storage.getCheckin().streak,
      totalFocusMin: totalFocusMinutes,
      level: this.data.level,
      sharedCount: 0,
      shieldUsed: Storage.getCheckin().shieldActive,
      earlyTaskDone: false,
      lateTaskDone: false,
      perfectDays: 0,
      teamCompleted: 0
    };

    this.ACHIEVEMENTS.forEach(ach => {
      if (!this.data.achievements.includes(ach.id) && ach.condition(context)) {
        this.data.achievements.push(ach.id);
        this.addXp(ach.xp, `成就解锁：${ach.name}`);
        Storage.saveGamification(this.data);
        EventBus.emit(EventBus.EVENTS.ACHIEVEMENT_UNLOCKED, ach);
        showToast(`🏆 成就解锁：${ach.name}（+${ach.xp} XP）`);
      }
    });
  },

  // 使用护盾
  activateShield(days = 1) {
    const checkin = Storage.getCheckin();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    checkin.shieldActive = true;
    checkin.shieldExpiry = expiry.toISOString();
    Storage.saveCheckin(checkin);
    showToast('🛡️ 护盾已激活！连续记录将被保护');
  },

  // 渲染 HUD（抬头显示）
  renderHUD() {
    const hud = document.getElementById('gamiHud');
    if (!hud) return;

    const progress = this.getLevelProgress();
    hud.innerHTML = `
      <div class="gami-hud">
        <div class="gami-level">Lv.${this.data.level}</div>
        <div class="gami-xp-bar">
          <div class="gami-xp-fill" style="width:${progress}%"></div>
        </div>
        <div class="gami-coins">🪙 ${this.data.coins}</div>
      </div>
    `;
  },

  // 渲染成就页面
  renderAchievements() {
    const container = document.getElementById('achievementList');
    if (!container) return;

    container.innerHTML = this.ACHIEVEMENTS.map(ach => {
      const unlocked = this.data.achievements.includes(ach.id);
      return `
        <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
          <span class="ach-icon">${unlocked ? ach.icon : '🔒'}</span>
          <div class="ach-info">
            <div class="ach-name">${ach.name}</div>
            <div class="ach-desc">${ach.desc}</div>
          </div>
          <div class="ach-xp">+${ach.xp} XP</div>
        </div>
      `;
    }).join('');
  },

  // 渲染奖励商店
  renderShop() {
    const container = document.getElementById('rewardShop');
    if (!container) return;

    container.innerHTML = this.REWARDS.map(reward => {
      const canAfford = this.data.coins >= reward.cost;
      return `
        <div class="reward-card ${canAfford ? '' : 'disabled'}" onclick="${canAfford ? `Gamification.buyReward('${reward.id}')` : ''}">
          <span class="reward-icon">${reward.icon}</span>
          <div class="reward-info">
            <div class="reward-name">${reward.name}</div>
            <div class="reward-cost">🪙 ${reward.cost}</div>
          </div>
        </div>
      `;
    }).join('');
  },

  // 购买奖励
  buyReward(id) {
    const reward = this.REWARDS.find(r => r.id === id);
    if (!reward || this.data.coins < reward.cost) return;

    this.data.coins -= reward.cost;
    Storage.saveGamification(this.data);

    if (reward.type === 'shield') {
      this.activateShield(1);
    } else if (reward.type === 'boost') {
      showToast(`✨ ${reward.name} 已激活！`);
    } else {
      showToast(`🎉 ${reward.name} 已解锁！`);
    }

    this.renderHUD();
    this.renderShop();
  }
};
```

- [ ] **Step 2: 在 HTML 中添加游戏化 HUD**

在首页进度环区域下方添加 XP 进度条：

```html
<!-- 在 #tab-home 的进度环后添加 -->
<div id="gamiHud"></div>
```

在"我的"页面添加成就和商店入口：

```html
<!-- 在 #tab-profile 的菜单列表中添加 -->
<div class="menu-item" onclick="openAchievementModal()">
  <span>🏆 成就</span>
  <span class="menu-arrow">›</span>
</div>
<div class="menu-item" onclick="openRewardShop()">
  <span>🪙 奖励商店</span>
  <span class="menu-arrow">›</span>
</div>
```

- [ ] **Step 3: 添加游戏化 CSS 样式**

```css
/* ===== 游戏化 HUD ===== */
.gami-hud {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  margin: 0 16px 12px;
  background: var(--surface);
  border-radius: 16px;
  border: 1px solid var(--border);
}

.gami-level {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 4px 10px;
  border-radius: 10px;
  white-space: nowrap;
}

.gami-xp-bar {
  flex: 1;
  height: 6px;
  background: var(--surface-2);
  border-radius: 3px;
  overflow: hidden;
}

.gami-xp-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #a78bfa);
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.gami-coins {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

/* ===== 升级动画 ===== */
@keyframes levelUpBurst {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.level-up-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px);
  animation: fadeIn 0.3s;
}

.level-up-card {
  text-align: center;
  padding: 40px;
  animation: levelUpBurst 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.level-up-card .level-number {
  font-size: 64px;
  font-weight: 900;
  background: linear-gradient(135deg, #fbbf24, #f59e0b, #ef4444);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ===== 成就卡片 ===== */
.achievement-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--surface);
  border-radius: 14px;
  border: 1px solid var(--border);
  margin-bottom: 8px;
  transition: transform 0.2s;
}

.achievement-card.unlocked {
  border-color: rgba(251, 191, 36, 0.3);
}

.achievement-card.locked {
  opacity: 0.4;
}

.ach-icon { font-size: 28px; }
.ach-info { flex: 1; }
.ach-name { font-size: 14px; font-weight: 600; }
.ach-desc { font-size: 12px; color: var(--text-2); margin-top: 2px; }
.ach-xp { font-size: 12px; color: var(--accent); font-weight: 600; }

/* ===== 奖励商店 ===== */
.reward-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--surface);
  border-radius: 14px;
  border: 1px solid var(--border);
  margin-bottom: 8px;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
}

.reward-card:hover { border-color: var(--accent); transform: translateY(-1px); }
.reward-card.disabled { opacity: 0.4; cursor: not-allowed; }
.reward-icon { font-size: 28px; }
.reward-info { flex: 1; }
.reward-name { font-size: 14px; font-weight: 600; }
.reward-cost { font-size: 12px; color: #fbbf24; margin-top: 2px; }
```

- [ ] **Step 4: 在 app.js 中集成游戏化事件监听**

```javascript
// 监听 XP 获得事件 — 显示浮动 XP 动画
EventBus.on(EventBus.EVENTS.XP_GAINED, ({ amount, reason }) => {
  showFloatingXp(amount);
});

// 监听升级事件 — 显示升级弹窗
EventBus.on(EventBus.EVENTS.LEVEL_UP, ({ from, to }) => {
  showLevelUpModal(to);
});

// 监听成就解锁 — 播放成就动画
EventBus.on(EventBus.EVENTS.ACHIEVEMENT_UNLOCKED, (ach) => {
  spawnConfetti(document.querySelector('.gami-hud'));
});

// 监听任务完成 — 增加 XP
EventBus.on(EventBus.EVENTS.TASK_COMPLETED, (task) => {
  const xpReward = task.priority === 'high' ? 30 : task.priority === 'low' ? 10 : 20;
  Gamification.addXp(xpReward, `完成任务：${task.title}`);
  Gamification.renderHUD();
});

// 监听签到 — 增加 XP
EventBus.on(EventBus.EVENTS.CHECKIN_DONE, () => {
  Gamification.addXp(25, '每日签到');
  Gamification.renderHUD();
});

// 监听专注完成 — 增加 XP
EventBus.on(EventBus.EVENTS.FOCUS_COMPLETED, () => {
  Gamification.addXp(50, '完成一次专注');
  Gamification.renderHUD();
});

// 浮动 XP 动画函数
function showFloatingXp(amount) {
  const el = document.createElement('div');
  el.className = 'floating-xp';
  el.textContent = `+${amount} XP`;
  document.querySelector('.phone').appendChild(el);
  setTimeout(() => el.remove(), 1500);
}
```

添加浮动 XP 动画 CSS：

```css
.floating-xp {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  font-weight: 800;
  color: #fbbf24;
  text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
  pointer-events: none;
  animation: floatUp 1.5s ease-out forwards;
  z-index: 100;
}

@keyframes floatUp {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
  30% { opacity: 1; transform: translate(-50%, -80%) scale(1.2); }
  100% { opacity: 0; transform: translate(-50%, -200%) scale(0.8); }
}
```

- [ ] **Step 5: 修改 toggleTask() 发射事件**

```javascript
function toggleTask(id, e) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;

  if (task.done) {
    weeklyCompleted++;
    EventBus.emit(EventBus.EVENTS.TASK_COMPLETED, task);
    if (e) spawnConfetti(e.target.closest('.task-item'));
  }

  Storage.saveTasks(tasks);
  renderTasks();
  updateProgress();
  updateSuggestion(false);
  renderStats();
}
```

---

### Task 4: 能量曲线 AI

**文件：**
- 创建：`js/energy-curve.js`
- 修改：`js/app.js`
- 修改：`css/style.css`

**目标：** 通过分析用户任务完成时间和速度，学习个人精力高峰/低谷，自动将高认知任务安排在精力高峰时段。

**创新点：** 借鉴 Morgen 的"Frames"理念和 Reclaim 的习惯保护，AI 不仅安排任务，还根据用户生物节律优化安排。

- [ ] **Step 1: 创建能量曲线模块**

```javascript
// js/energy-curve.js
const EnergyCurve = {
  data: null,

  // 24 小时精力分数（0-1），初始为典型曲线
  defaultCurve: {
    0: 0.1, 1: 0.05, 2: 0.05, 3: 0.05, 4: 0.05, 5: 0.1,
    6: 0.3, 7: 0.6, 8: 0.85, 9: 0.95, 10: 0.9, 11: 0.8,
    12: 0.5, 13: 0.4, 14: 0.55, 15: 0.7, 16: 0.75, 17: 0.65,
    18: 0.5, 19: 0.4, 20: 0.3, 21: 0.2, 22: 0.15, 23: 0.1
  },

  init() {
    this.data = Storage.getEnergyData();
    // 如果没有学习数据，使用默认曲线
    if (!this.data.curve) {
      this.data.curve = { ...this.defaultCurve };
      Storage.saveEnergyData(this.data);
    }
  },

  // 记录任务完成事件（用于学习）
  recordCompletion(hour, taskType) {
    // hour: 0-23, taskType: 'work'/'study'/'life'
    if (!this.data.hourlyScores[hour]) {
      this.data.hourlyScores[hour] = [];
    }
    // 记录完成速度（基于任务优先级和完成时间推断精力）
    this.data.hourlyScores[hour].push({
      type: taskType,
      timestamp: Date.now()
    });

    // 只保留最近 30 天的数据
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    Object.keys(this.data.hourlyScores).forEach(h => {
      this.data.hourlyScores[h] = this.data.hourlyScores[h].filter(r => r.timestamp > cutoff);
    });

    this.data.lastUpdated = Date.now();
    Storage.saveEnergyData(this.data);
  },

  // 获取某小时的精力分数
  getScore(hour) {
    return this.data.curve[hour] ?? this.defaultCurve[hour] ?? 0.5;
  },

  // 获取当前精力状态描述
  getCurrentStatus() {
    const hour = new Date().getHours();
    const score = this.getScore(hour);
    if (score >= 0.8) return { label: '精力充沛', color: '#7ee787', emoji: '⚡' };
    if (score >= 0.6) return { label: '状态良好', color: '#5b8def', emoji: '👍' };
    if (score >= 0.4) return { label: '略有疲惫', color: '#fbbf24', emoji: '😴' };
    return { label: '建议休息', color: '#ef5b5b', emoji: '💤' };
  },

  // 智能排序建议：根据能量曲线重新排列未完成任务
  getSuggestedOrder(undoneTasks) {
    const hour = new Date().getHours();
    const currentScore = this.getScore(hour);

    return [...undoneTasks].sort((a, b) => {
      // 高精力时段优先安排高优先级/工作类任务
      const aScore = this.getTaskEnergyFit(a, currentScore);
      const bScore = this.getTaskEnergyFit(b, currentScore);
      return bScore - aScore;
    });
  },

  // 计算任务与当前精力的匹配度
  getTaskEnergyFit(task, energyLevel) {
    let base = task.priority === 'high' ? 0.8 : task.priority === 'low' ? 0.3 : 0.5;
    if (task.tag === 'work') base *= 1.2;
    if (task.tag === 'study') base *= 1.1;
    if (task.tag === 'life') base *= 0.7;
    // 高精力时段更适合高认知任务
    return base * (0.5 + energyLevel * 0.5);
  },

  // 获取最佳专注时段推荐
  getBestFocusSlots(durationMinutes = 25) {
    const now = new Date();
    const currentHour = now.getHours();
    const slots = [];

    for (let h = currentHour; h < 23; h++) {
      const score = this.getScore(h);
      if (score >= 0.7) {
        slots.push({ hour: h, score, label: `${h}:00-${h + 1}:00` });
      }
    }

    return slots.sort((a, b) => b.score - a.score).slice(0, 3);
  },

  // 渲染迷你精力曲线图（在首页显示）
  renderMiniChart() {
    const container = document.getElementById('energyMiniChart');
    if (!container) return;

    const currentHour = new Date().getHours();
    const hours = [];
    for (let h = 6; h <= 22; h++) {
      hours.push(h);
    }

    const maxScore = 1;
    const barWidth = Math.floor(300 / hours.length);

    container.innerHTML = `
      <div class="energy-mini">
        <div class="energy-status">
          <span class="energy-emoji">${this.getCurrentStatus().emoji}</span>
          <span class="energy-label">${this.getCurrentStatus().label}</span>
        </div>
        <svg width="100%" height="40" viewBox="0 0 300 40" preserveAspectRatio="none">
          <defs>
            <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.05"/>
            </linearGradient>
          </defs>
          <path d="${this._generateCurvePath(hours, maxScore)}" fill="url(#energyGrad)" stroke="var(--accent)" stroke-width="1.5"/>
          ${currentHour >= 6 && currentHour <= 22 ? `<circle cx="${((currentHour - 6) / 16) * 300}" cy="${40 - this.getScore(currentHour) * 36}" r="3" fill="var(--accent)"/>` : ''}
        </svg>
        <div class="energy-labels">
          <span>6时</span><span>12时</span><span>18时</span><span>22时</span>
        </div>
      </div>
    `;
  },

  _generateCurvePath(hours, maxScore) {
    const width = 300;
    const height = 40;
    const padding = 4;

    let path = `M 0 ${height}`;
    hours.forEach((h, i) => {
      const x = (i / (hours.length - 1)) * width;
      const y = height - padding - (this.getScore(h) / maxScore) * (height - padding * 2);
      if (i === 0) {
        path = `M ${x} ${y}`;
      } else {
        // 使用贝塞尔曲线平滑
        const prevX = ((i - 1) / (hours.length - 1)) * width;
        const prevY = height - padding - (this.getScore(hours[i - 1]) / maxScore) * (height - padding * 2);
        const cpx = (prevX + x) / 2;
        path += ` C ${cpx} ${prevY}, ${cpx} ${y}, ${x} ${y}`;
      }
    });
    path += ` L ${width} ${height} Z`;
    return path;
  }
};
```

- [ ] **Step 2: 在首页添加能量曲线显示区域**

在 `#tab-home` 的 AI 建议卡片后添加：

```html
<div id="energyMiniChart" class="chart-area" style="margin: 12px 16px; padding: 14px;"></div>
```

- [ ] **Step 3: 在 AI 建议中集成能量曲线**

修改 `updateSuggestion()` 函数，增加精力相关建议：

```javascript
function updateSuggestion(firstRun) {
  const undone = tasks.filter(t => !t.done);
  const total = tasks.length;
  const done = total - undone.length;
  const suggestions = [];

  // ... 原有建议逻辑 ...

  // 新增：能量曲线建议
  const energyStatus = EnergyCurve.getCurrentStatus();
  if (energyStatus.score < 0.4 && undone.length > 0) {
    suggestions.push(`当前${energyStatus.label}，建议处理低优先级任务或休息片刻。`);
    const bestSlots = EnergyCurve.getBestFocusSlots();
    if (bestSlots.length > 0) {
      suggestions.push(`下一个精力高峰在 ${bestSlots[0].label}，届时适合处理高难度任务。`);
    }
  }

  if (energyStatus.score >= 0.8) {
    suggestions.push(`当前${energyStatus.label}！建议趁现在处理最重要的任务。`);
  }

  // ... 选择建议显示 ...
}
```

---

### Task 5: 拖延心理模型

**文件：**
- 创建：`js/procrastination.js`
- 修改：`js/ai-engine.js`

**目标：** 检测拖延行为，分析拖延原因（恐惧/不知所措/完美主义/缺乏动力），提供针对性干预策略。

**创新点：** 借鉴 24me 的"AI 拖延助手"理念，不仅提醒，还理解拖延背后的心理原因。

- [ ] **Step 1: 创建拖延分析模块**

```javascript
// js/procrastination.js
const Procrastination = {
  // 拖延原因分析模型
  REASONS: {
    FEAR: {
      id: 'fear',
      name: '恐惧/焦虑',
      patterns: ['重要', '紧急', '汇报', '演讲', '面试', '考试'],
      color: '#ef5b5b',
      strategies: [
        '试试"2分钟法则"：告诉自己只做2分钟，通常开始后就会继续',
        '把大任务拆成3个小步骤，先完成第一步',
        '想象完成后的轻松感，而非过程中的焦虑'
      ]
    },
    OVERWHELM: {
      id: 'overwhelm',
      name: '不知所措',
      patterns: ['太多', '不知道', '复杂', '不知道从哪开始'],
      color: '#fbbf24',
      strategies: [
        '列出所有待办，只选最重要的1件开始',
        '使用"时间块"方法：为每个任务分配固定时段',
        '关闭所有干扰源（手机静音、关闭社交媒体）'
      ]
    },
    PERFECTIONISM: {
      id: 'perfectionism',
      name: '完美主义',
      patterns: ['做好', '完美', '最好', '不能出错'],
      color: '#a78bfa',
      strategies: [
        '记住："完成"比"完美"更重要',
        '先做一个"足够好"的版本，之后再迭代优化',
        '给自己设定时间限制，到点就提交'
      ]
    },
    LOW_MOTIVATION: {
      id: 'low_motivation',
      name: '缺乏动力',
      patterns: ['不想', '没意思', '无聊', '没动力'],
      color: '#6a6a7d',
      strategies: [
        '给任务绑定一个奖励：完成后看一集剧/吃零食',
        '和朋友一起做，社交压力能提高动力',
        '回忆你最初为什么要做这件事'
      ]
    }
  },

  // 分析任务可能触发拖延的原因
  analyzeTask(task) {
    const title = task.title.toLowerCase();
    const scores = {};

    Object.values(this.REASONS).forEach(reason => {
      scores[reason.id] = reason.patterns.filter(p => title.includes(p)).length;
    });

    // 找到最高分的原因
    const topReason = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    if (topReason && topReason[1] > 0) {
      return this.REASONS[topReason[0]];
    }

    // 根据优先级推断
    if (task.priority === 'high') return this.REASONS.FEAR;
    return null;
  },

  // 检测用户是否在拖延
  detectProcrastination() {
    const undone = tasks.filter(t => !t.done);
    const highPriorityUndone = undone.filter(t => t.priority === 'high');

    // 高优先级任务未完成且已过时间
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const overdue = highPriorityUndone.filter(t => {
      const [h, m] = t.time.split(':').map(Number);
      return (h * 60 + m) < currentMinutes - 60; // 过期超过1小时
    });

    if (overdue.length > 0) {
      return {
        isProcrastinating: true,
        overdueTasks: overdue,
        analysis: overdue.map(t => ({
          task: t,
          reason: this.analyzeTask(t)
        }))
      };
    }

    return { isProcrastinating: false };
  },

  // 生成干预建议
  generateIntervention(task) {
    const reason = this.analyzeTask(task);
    if (!reason) return null;

    const strategy = reason.strategies[Math.floor(Math.random() * reason.strategies.length)];
    return {
      reason: reason,
      strategy,
      message: `检测到「${task.title}」可能因为${reason.name}而拖延。\n\n💡 建议：${strategy}`
    };
  },

  // AI 回复中集成拖延分析
  getProcrastinationReply() {
    const detection = this.detectProcrastination();
    if (!detection.isProcrastinating) return null;

    const task = detection.overdueTasks[0];
    const intervention = this.generateIntervention(task);

    if (intervention) {
      return `⚠️ 我注意到「${task.title}」已经过了预定时间。\n\n${intervention.message}`;
    }
    return null;
  }
};
```

---

## 第三阶段：创新功能 — 智能交互（第 5-6 天）

### Task 6: 自然语言任务解析引擎

**文件：**
- 创建：`js/nlp.js`
- 修改：`js/ai-engine.js`

**目标：** 从自然语言中提取时间、日期、任务名称、优先级、分类，自动创建任务。

**创新点：** 支持中文自然语言的日期时间解析（"明天下午三点"、"下周一上午"、"后天"），智能推断分类和优先级。

- [ ] **Step 1: 创建 NLP 解析模块**

```javascript
// js/nlp.js
const NLP = {
  // 解析自然语言输入为结构化任务数据
  parse(input) {
    const result = {
      title: '',
      time: '',
      date: '',       // 新增：日期字段 YYYY-MM-DD
      tag: 'work',
      priority: 'normal',
      repeat: 'none',
      confidence: 0
    };

    // 1. 提取日期
    const dateInfo = this.extractDate(input);
    if (dateInfo) {
      result.date = dateInfo.date;
      result.title = input.replace(dateInfo.raw, '').trim();
    } else {
      result.date = Utils.formatDate(new Date()); // 默认今天
      result.title = input;
    }

    // 2. 提取时间
    const timeInfo = this.extractTime(result.title);
    if (timeInfo) {
      result.time = timeInfo.time;
      result.title = result.title.replace(timeInfo.raw, '').trim();
    }

    // 3. 清理标题（移除动作词）
    result.title = this.cleanTitle(result.title);

    // 4. 智能分类
    result.tag = this.detectTag(input);

    // 5. 优先级判断
    result.priority = this.detectPriority(input);

    // 6. 重复判断
    result.repeat = this.detectRepeat(input);

    // 7. 计算置信度
    result.confidence = this.calculateConfidence(result, input);

    return result;
  },

  extractDate(input) {
    const now = new Date();

    // "明天"
    if (/明天/.test(input)) {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      return { date: Utils.formatDate(d), raw: '明天' };
    }

    // "后天"
    if (/后天/.test(input)) {
      const d = new Date(now);
      d.setDate(d.getDate() + 2);
      return { date: Utils.formatDate(d), raw: '后天' };
    }

    // "下周X"
    const nextWeekMatch = input.match(/下周([一二三四五六日])/);
    if (nextWeekMatch) {
      const dayMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0 };
      const targetDay = dayMap[nextWeekMatch[1]];
      const d = new Date(now);
      d.setDate(d.getDate() + (7 - d.getDay() + targetDay) % 7 || 7);
      return { date: Utils.formatDate(d), raw: nextWeekMatch[0] };
    }

    // "这周五"、"周六"等
    const thisWeekMatch = input.match(/(这|本)(周|星期)([一二三四五六日])/);
    if (thisWeekMatch) {
      const dayMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0 };
      const targetDay = dayMap[thisWeekMatch[3]];
      const d = new Date(now);
      const diff = (targetDay - d.getDay() + 7) % 7;
      d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
      return { date: Utils.formatDate(d), raw: thisWeekMatch[0] };
    }

    // "X月X日" / "X号"
    const dateMatch = input.match(/(\d{1,2})[月号](\d{1,2})?[日号]?/);
    if (dateMatch) {
      const month = parseInt(dateMatch[1]) - 1;
      const day = parseInt(dateMatch[2]) || 1;
      const d = new Date(now.getFullYear(), month, day);
      if (d >= now) {
        return { date: Utils.formatDate(d), raw: dateMatch[0] };
      }
    }

    return null;
  },

  extractTime(input) {
    // "下午三点" / "上午9点" / "晚上8点半"
    const cnMatch = input.match(/(上午|下午|晚上|凌晨|清晨)(\d{1,2})[点时:](\d{0,2})?/);
    if (cnMatch) {
      let hour = parseInt(cnMatch[2]);
      const minute = parseInt(cnMatch[3]) || 0;
      const period = cnMatch[1];

      if (period === '下午' || period === '晚上') {
        if (hour < 12) hour += 12;
      }
      if (period === '凌晨' && hour === 12) hour = 0;
      if (period === '上午' && hour === 12) hour = 0;

      return {
        time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        raw: cnMatch[0]
      };
    }

    // "3点" / "15:30"
    const directMatch = input.match(/(\d{1,2})[:\:点](\d{2})/);
    if (directMatch) {
      let hour = parseInt(directMatch[1]);
      const minute = parseInt(directMatch[2]);
      return {
        time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        raw: directMatch[0]
      };
    }

    // "半" = 30分
    const halfMatch = input.match(/(\d{1,2})点半/);
    if (halfMatch) {
      let hour = parseInt(halfMatch[1]);
      if (hour < 12) hour += 12; // "三点半" = 15:30
      return {
        time: `${String(hour).padStart(2, '0')}:30`,
        raw: halfMatch[0]
      };
    }

    return null;
  },

  cleanTitle(title) {
    return title
      .replace(/^(提醒我|帮我|请|麻烦|安排|创建|添加|新建|设置|记一下|别忘了|记得)\s*/g, '')
      .replace(/(一下|一下子|吧|呢|吗|啊|哦|呀|啦)$/g, '')
      .trim();
  },

  detectTag(input) {
    if (/学习|读书|英语|课程|考试|复习|背单词|看书|论文|作业|写代码|编程/.test(input)) return 'study';
    if (/健身|运动|跑步|锻炼|吃饭|购物|电影|散步|瑜伽|游泳|做饭|打扫|洗衣/.test(input)) return 'life';
    return 'work';
  },

  detectPriority(input) {
    if (/紧急|重要|必须|马上|立刻|尽快|优先|关键|核心/.test(input)) return 'high';
    if (/随便|有空|不急|可选|看情况|无所谓/.test(input)) return 'low';
    return 'normal';
  },

  detectRepeat(input) {
    if (/每天|每日|天天|日常/.test(input)) return 'daily';
    if (/每周|每星期|每个礼拜/.test(input)) return 'weekly';
    if (/每月|每个月/.test(input)) return 'monthly';
    return 'none';
  },

  calculateConfidence(result, originalInput) {
    let score = 50; // 基础分
    if (result.title.length > 0) score += 20;
    if (result.time) score += 15;
    if (result.date) score += 10;
    if (result.tag !== 'work') score += 5; // 非默认分类说明有明确线索
    return Math.min(score, 100);
  }
};
```

---

### Task 7: AI 核心引擎升级

**文件：**
- 创建：`js/ai-engine.js`
- 修改：`js/app.js`

**目标：** 整合 NLP 解析、拖延分析、能量曲线，提供真正智能的对话体验。

- [ ] **Step 1: 创建 AI 引擎**

```javascript
// js/ai-engine.js
const AIEngine = {
  // 处理用户消息，返回回复
  processMessage(text) {
    const lower = text.toLowerCase().trim();

    // 1. 检测创建任务意图
    if (/提醒|添加|创建|安排|新建|帮我|记一下|别忘了|记得/.test(lower)) {
      return this.handleCreateTask(text);
    }

    // 2. 检测拖延求助
    if (/拖延|不想做|没动力|做不下去|不想开始|好难/.test(lower)) {
      return this.handleProcrastinationHelp(text);
    }

    // 3. 检测精力/状态查询
    if (/精力|状态|效率|能量|什么时候适合/.test(lower)) {
      return this.handleEnergyQuery();
    }

    // 4. 规划今天
    if (/规划|安排今天|今天做什么|日程/.test(lower)) {
      return this.handlePlanToday();
    }

    // 5. 查看待办
    if (/待办|任务|还有什么|未完成|todo/.test(lower)) {
      return this.handleViewTasks();
    }

    // 6. 专注模式
    if (/专注|番茄|集中|计时/.test(lower)) {
      return this.handleFocusMode();
    }

    // 7. 统计
    if (/统计|数据|效率|报告|周报/.test(lower)) {
      return this.handleStats();
    }

    // 8. 团队
    if (/团队|成员|协作/.test(lower)) {
      return this.handleTeamInfo();
    }

    // 9. 冲突
    if (/冲突|撞车|重叠/.test(lower)) {
      return this.handleConflict();
    }

    // 10. 问候
    if (/你好|hi|hello|嗨|hey/.test(lower)) {
      return this.handleGreeting();
    }

    // 11. 感谢
    if (/谢谢|感谢|thanks|thx/.test(lower)) {
      return '不客气！有任何需要随时找我 😊';
    }

    // 12. 默认回复（带拖延检测）
    const procrastinationTip = Procrastination.getProcrastinationReply();
    if (procrastinationTip) {
      return procrastinationTip;
    }

    return this.handleDefault(text);
  },

  handleCreateTask(text) {
    const parsed = NLP.parse(text);

    if (!parsed.title || parsed.title.length < 1) {
      return '请告诉我你想创建什么任务？例如："明天下午3点开会"或"每天早上7点晨读英语"';
    }

    // 创建任务
    const newTask = {
      id: Utils.genId(),
      title: parsed.title,
      time: parsed.time || '09:00',
      date: parsed.date,
      tag: parsed.tag,
      done: false,
      priority: parsed.priority,
      repeat: parsed.repeat
    };

    tasks.push(newTask);
    Storage.saveTasks(tasks);
    renderTasks();
    updateProgress();
    renderStats();

    // 发射事件
    EventBus.emit(EventBus.EVENTS.TASK_ADDED, newTask);

    // 记录隐私日志
    Storage.addPrivacyEntry({
      type: 'task_created',
      trigger: 'nlp',
      input: text,
      result: newTask
    });

    let reply = `已为你创建任务「${parsed.title}」`;
    if (parsed.time) reply += `，时间：${parsed.time}`;
    if (parsed.date !== Utils.formatDate(new Date())) reply += `，日期：${parsed.date}`;
    reply += `\n\n分类：${Utils.tagName(parsed.tag)} | 优先级：${parsed.priority === 'high' ? '高' : parsed.priority === 'low' ? '低' : '普通'}`;

    // 能量曲线建议
    if (parsed.time) {
      const [h] = parsed.time.split(':').map(Number);
      const energyScore = EnergyCurve.getScore(h);
      if (energyScore < 0.4) {
        reply += `\n\n⚠️ 提示：${h}:00 是你的精力低谷时段，建议考虑调整时间。`;
      }
    }

    return reply;
  },

  handleProcrastinationHelp(text) {
    const undone = tasks.filter(t => !t.done && t.priority === 'high');
    if (undone.length === 0) {
      return '看起来你没有高优先级的待办任务，放松一下吧！有需要随时找我。';
    }

    const task = undone[0];
    const intervention = Procrastination.generateIntervention(task);

    if (intervention) {
      return `我理解，有时候确实很难开始。让我帮你分析一下：\n\n${intervention.message}\n\n要试试"2分钟法则"吗？只做2分钟，也许你会发现其实没那么难。`;
    }

    return `试试把「${task.title}」拆成更小的步骤？先做第一步就好，通常开始后就会顺利很多。`;
  },

  handleEnergyQuery() {
    const status = EnergyCurve.getCurrentStatus();
    const bestSlots = EnergyCurve.getBestFocusSlots();

    let reply = `当前精力状态：${status.emoji} ${status.label}\n\n`;

    if (bestSlots.length > 0) {
      reply += '今日最佳专注时段：\n';
      bestSlots.forEach((slot, i) => {
        reply += `${i + 1}. ${slot.label}（精力值 ${Math.round(slot.score * 100)}%）\n`;
      });
    }

    const undone = tasks.filter(t => !t.done);
    if (undone.length > 0) {
      const suggested = EnergyCurve.getSuggestedOrder(undone);
      reply += '\n\n建议当前处理顺序：\n';
      suggested.slice(0, 3).forEach((t, i) => {
        reply += `${i + 1}. ${t.title}（${Utils.tagName(t.tag)}）\n`;
      });
    }

    return reply;
  },

  handlePlanToday() {
    const undone = tasks.filter(t => !t.done);
    if (undone.length === 0) {
      return '今天没有待办任务，享受自由时光吧！';
    }

    const suggested = EnergyCurve.getSuggestedOrder(undone);
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let reply = `📋 今日安排建议（已根据精力曲线优化）：\n\n`;
    suggested.forEach((task, i) => {
      const [h, m] = task.time.split(':').map(Number);
      const taskMinutes = h * 60 + m;
      const status = taskMinutes < currentMinutes ? '⏰ 已过' : '✅ 待做';
      reply += `${i + 1}. ${status} ${task.time} ${task.title} ${Utils.priorityIcon(task.priority)}\n`;
    });

    const energyStatus = EnergyCurve.getCurrentStatus();
    reply += `\n\n${energyStatus.emoji} 当前精力：${energyStatus.label}`;

    return reply;
  },

  handleViewTasks() {
    const undone = tasks.filter(t => !t.done);
    if (undone.length === 0) {
      return '所有任务已完成！太棒了！';
    }

    let reply = `📋 未完成任务（${undone.length}项）：\n\n`;
    undone.forEach((t, i) => {
      reply += `${i + 1}. ${t.time} ${t.title} [${Utils.tagName(t.tag)}] ${Utils.priorityIcon(t.priority)}\n`;
    });

    // 拖延检测
    const procastTip = Procrastination.getProcrastinationReply();
    if (procastTip) {
      reply += `\n\n${procastTip}`;
    }

    return reply;
  },

  handleFocusMode() {
    setTimeout(() => {
      closeAiChat();
      setTimeout(() => openFocusModal(), 400);
    }, 600);
    return '已为你打开专注计时器。25 分钟番茄钟，准备好了就按播放键吧！';
  },

  handleStats() {
    const done = tasks.filter(t => t.done).length;
    const total = tasks.length;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    const focusH = (totalFocusMinutes / 60).toFixed(1);

    return `📊 数据概览：\n\n• 今日完成：${done}/${total}（${rate}%）\n• 专注时长：${focusH} 小时\n• 连续签到：${streak} 天\n• 等级：Lv.${Gamification.data.level}\n• 总 XP：${Gamification.data.xp}\n\n点击统计页面可查看更详细的周报。`;
  },

  handleTeamInfo() {
    const totalMembers = Object.values(teamGroups).reduce((sum, g) => sum + g.members.length, 0);
    const onlineMembers = Object.values(teamGroups).reduce((sum, g) => sum + g.members.filter(m => m.dot === 'online').length, 0);
    const totalTeamTasks = Object.values(teamGroups).reduce((sum, g) => sum + g.tasks.length, 0);

    return `👥 团队概览：\n\n• 参与团队：${myGroups.join('、')}\n• 总成员：${totalMembers} 人\n• 在线：${onlineMembers} 人\n• 团队任务：${totalTeamTasks} 项\n\n切换到团队 Tab 查看详情。`;
  },

  handleConflict() {
    setTimeout(() => {
      closeAiChat();
      setTimeout(() => checkConflicts(), 400);
    }, 600);
    return '正在检测日程冲突...';
  },

  handleGreeting() {
    const greeting = Utils.getGreeting();
    const undone = tasks.filter(t => !t.done).length;
    return `${greeting}！我是你的 AI 日程助手。今天有 ${undone.length} 项待办任务。需要我帮你规划一下吗？`;
  },

  handleDefault(text) {
    const responses = [
      '我理解你的意思。你可以试试这样说："明天下午3点开会"或"提醒我周五交报告"。',
      '你可以让我帮你创建任务、查看待办、规划日程，或者聊聊拖延问题。',
      '试试这些指令：\n• "提醒我明天上午10点开会"\n• "我今天应该做什么"\n• "我有点拖延"\n• "查看统计"'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
};
```

---

### Task 8: 语音交互

**文件：**
- 创建：`js/voice.js`
- 修改：`index.html`（添加语音按钮）
- 修改：`css/style.css`

**目标：** 支持语音输入创建任务，覆盖通勤、做饭等不方便打字的场景。

**创新点：** 三模交互（语音 + 文字 + 手势），语音创建任务后 AI 自动解析并确认。

- [ ] **Step 1: 创建语音模块**

```javascript
// js/voice.js
const Voice = {
  recognition: null,
  isListening: false,

  init() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('浏览器不支持语音识别');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'zh-CN';
    this.recognition.continuous = false;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      this._updateTranscript(transcript);

      if (event.results[event.results.length - 1].isFinal) {
        this._onFinalResult(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.log('语音识别错误:', event.error);
      this.stop();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this._updateUI();
    };

    return true;
  },

  start() {
    if (!this.recognition) {
      showToast('当前浏览器不支持语音输入');
      return;
    }
    this.isListening = true;
    this.recognition.start();
    this._updateUI();
  },

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
    this.isListening = false;
    this._updateUI();
  },

  toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  },

  _updateTranscript(text) {
    const el = document.getElementById('voiceTranscript');
    if (el) el.textContent = text;
  },

  _onFinalResult(text) {
    // 将语音结果填入 AI 聊天输入框
    const input = document.getElementById('aiInput');
    if (input) {
      input.value = text;
    }
  },

  _updateUI() {
    const btn = document.getElementById('voiceBtn');
    if (btn) {
      btn.classList.toggle('listening', this.isListening);
    }
  }
};
```

- [ ] **Step 2: 在 AI 聊天界面添加语音按钮**

在 AI 聊天输入框旁添加麦克风按钮：

```html
<button id="voiceBtn" class="voice-btn" onclick="Voice.toggle()" title="语音输入">
  🎤
</button>
<div id="voiceTranscript" class="voice-transcript"></div>
```

- [ ] **Step 3: 添加语音按钮样式**

```css
.voice-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--surface-2);
  color: var(--text);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
}

.voice-btn.listening {
  background: #ef5b5b;
  color: white;
  animation: voicePulse 1s infinite;
}

@keyframes voicePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 91, 91, 0.4); }
  50% { box-shadow: 0 0 0 12px rgba(239, 91, 91, 0); }
}

.voice-transcript {
  font-size: 12px;
  color: var(--text-2);
  padding: 4px 12px;
  min-height: 20px;
}
```

---

## 第四阶段：日历与时间块（第 7-8 天）

### Task 9: 月视图日历组件

**文件：**
- 创建：`js/calendar.js`
- 修改：`index.html`（添加日历视图切换）
- 修改：`css/style.css`

**目标：** 添加月视图日历，支持查看历史和未来日程，点击日期查看当天任务。

- [ ] **Step 1: 创建日历模块**

```javascript
// js/calendar.js
const Calendar = {
  currentDate: new Date(),
  selectedDate: null,
  viewMode: 'month', // 'month' | 'week'

  init() {
    this.selectedDate = new Date();
  },

  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.viewMode === 'month') {
      this.renderMonth(container);
    } else {
      this.renderWeek(container);
    }
  },

  renderMonth(container) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();

    let html = `
      <div class="cal-header">
        <button class="cal-nav" onclick="Calendar.prevMonth()">‹</button>
        <span class="cal-title">${year}年${month + 1}月</span>
        <button class="cal-nav" onclick="Calendar.nextMonth()">›</button>
      </div>
      <div class="cal-weekdays">
        ${['日','一','二','三','四','五','六'].map(d => `<span>${d}</span>`).join('')}
      </div>
      <div class="cal-grid">
    `;

    // 空白填充
    for (let i = 0; i < startPadding; i++) {
      html += '<span class="cal-day empty"></span>';
    }

    // 日期格子
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = Utils.formatDate(date);
      const dayTasks = tasks.filter(t => t.date === dateStr);
      const hasTasks = dayTasks.length > 0;
      const allDone = hasTasks && dayTasks.every(t => t.done);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = this.selectedDate && date.toDateString() === this.selectedDate.toDateString();

      html += `
        <span class="cal-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasTasks ? 'has-tasks' : ''} ${allDone ? 'all-done' : ''}"
              onclick="Calendar.selectDay(${year}, ${month}, ${day})">
          ${day}
          ${hasTasks ? `<span class="cal-dots">${dayTasks.slice(0, 3).map(t => `<span class="cal-dot tag-${t.tag}"></span>`).join('')}</span>` : ''}
        </span>
      `;
    }

    html += '</div>';

    // 选中日期的任务列表
    if (this.selectedDate) {
      html += this.renderDayTasks();
    }

    container.innerHTML = html;
  },

  renderWeek(container) {
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    let html = `
      <div class="cal-header">
        <button class="cal-nav" onclick="Calendar.prevWeek()">‹</button>
        <span class="cal-title">${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日 - ${startOfWeek.getMonth() + 1}月${startOfWeek.getDate() + 6}日</span>
        <button class="cal-nav" onclick="Calendar.nextWeek()">›</button>
      </div>
      <div class="cal-week-view">
    `;

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      const dateStr = Utils.formatDate(day);
      const dayTasks = tasks.filter(t => t.date === dateStr);
      const isToday = day.toDateString() === new Date().toDateString();

      html += `
        <div class="cal-week-col ${isToday ? 'today' : ''}">
          <div class="cal-week-day">${Utils.getWeekday(day)} ${day.getDate()}</div>
          <div class="cal-week-tasks">
            ${dayTasks.map(t => `
              <div class="cal-week-task tag-${t.tag} ${t.done ? 'done' : ''}" onclick="editTask(${t.id})">
                <span class="cal-task-time">${t.time}</span>
                <span class="cal-task-title">${t.title}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;
  },

  renderDayTasks() {
    const dateStr = Utils.formatDate(this.selectedDate);
    const dayTasks = tasks.filter(t => t.date === dateStr);

    if (dayTasks.length === 0) {
      return `<div class="cal-day-tasks"><div class="empty-state"><div class="empty-icon">📅</div><div class="empty-text">这一天没有日程</div></div></div>`;
    }

    return `
      <div class="cal-day-tasks">
        <div class="cal-day-title">${this.selectedDate.getMonth() + 1}月${this.selectedDate.getDate()}日的日程</div>
        ${dayTasks.map(t => `
          <div class="cal-day-task ${t.done ? 'done' : ''}" onclick="editTask(${t.id})">
            <span class="cal-task-time">${t.time}</span>
            <span class="cal-task-title">${t.title}</span>
            <span class="cal-task-tag tag-${t.tag}">${Utils.tagName(t.tag)}</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  selectDay(year, month, day) {
    this.selectedDate = new Date(year, month, day);
    this.render('calendarContainer');
  },

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.render('calendarContainer');
  },

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.render('calendarContainer');
  },

  prevWeek() {
    this.currentDate.setDate(this.currentDate.getDate() - 7);
    this.render('calendarContainer');
  },

  nextWeek() {
    this.currentDate.setDate(this.currentDate.getDate() + 7);
    this.render('calendarContainer');
  },

  toggleView() {
    this.viewMode = this.viewMode === 'month' ? 'week' : 'month';
    this.render('calendarContainer');
  }
};
```

- [ ] **Step 2: 添加日历 CSS 样式**

```css
/* ===== 日历组件 ===== */
.cal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.cal-title { font-weight: 600; font-size: 15px; }

.cal-nav {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--surface-2);
  color: var(--accent);
  font-size: 18px;
  cursor: pointer;
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  padding: 8px 0;
  font-size: 11px;
  color: var(--text-3);
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  padding: 0 12px 12px;
}

.cal-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.cal-day:hover { background: var(--surface); }
.cal-day.today { background: var(--accent); color: white; font-weight: 700; }
.cal-day.selected { outline: 2px solid var(--accent); outline-offset: -2px; }
.cal-day.empty { cursor: default; }

.cal-dots {
  display: flex;
  gap: 2px;
  position: absolute;
  bottom: 4px;
}

.cal-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
}

.cal-dot.tag-work { background: var(--accent); }
.cal-dot.tag-study { background: var(--accent-2); }
.cal-dot.tag-life { background: #fbbf24; }

.cal-day.all-done { opacity: 0.6; }

/* 日历任务列表 */
.cal-day-tasks {
  padding: 0 16px 16px;
}

.cal-day-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.cal-day-task {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--surface);
  border-radius: 12px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: transform 0.2s;
}

.cal-day-task:active { transform: scale(0.98); }
.cal-day-task.done { opacity: 0.5; }
.cal-day-task.done .cal-task-title { text-decoration: line-through; }

.cal-task-time { font-size: 13px; color: var(--accent); font-weight: 600; min-width: 40px; }
.cal-task-title { flex: 1; font-size: 13px; }
.cal-task-tag { font-size: 11px; padding: 2px 8px; border-radius: 8px; }

/* 周视图 */
.cal-week-view {
  display: flex;
  gap: 6px;
  padding: 0 8px 16px;
  overflow-x: auto;
}

.cal-week-col {
  flex: 1;
  min-width: 80px;
}

.cal-week-day {
  text-align: center;
  font-size: 11px;
  color: var(--text-2);
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.cal-week-col.today .cal-week-day {
  color: var(--accent);
  font-weight: 700;
}

.cal-week-tasks {
  min-height: 100px;
}

.cal-week-task {
  padding: 6px 8px;
  margin: 2px 0;
  border-radius: 8px;
  font-size: 11px;
  border-left: 3px solid;
  cursor: pointer;
}

.cal-week-task.done { opacity: 0.4; text-decoration: line-through; }
.cal-week-task.tag-work { border-color: var(--accent); background: var(--accent-soft); }
.cal-week-task.tag-study { border-color: var(--accent-2); background: rgba(126,231,135,0.1); }
.cal-week-task.tag-life { border-color: #fbbf24; background: rgba(251,191,36,0.1); }

.cal-task-time { font-size: 10px; color: var(--text-3); }
.cal-task-title { font-size: 11px; display: block; }
```

- [ ] **Step 3: 在首页添加日历视图切换按钮**

在首页"今日日程"标题旁添加视图切换：

```html
<div style="display:flex; justify-content:space-between; align-items:center; margin: 16px 16px 8px;">
  <h3>今日日程</h3>
  <div style="display:flex; gap:8px;">
    <button class="view-toggle active" id="viewList" onclick="toggleScheduleView('list')">列表</button>
    <button class="view-toggle" id="viewCalendar" onclick="toggleScheduleView('calendar')">日历</button>
  </div>
</div>
<div id="scheduleList"></div>
<div id="calendarContainer" style="display:none;"></div>
```

```css
.view-toggle {
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-2);
  font-size: 12px;
  cursor: pointer;
}

.view-toggle.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}
```

---

### Task 10: 智能时间块

**文件：**
- 创建：`js/time-block.js`
- 修改：`index.html`
- 修改：`css/style.css`

**目标：** 可视化拖拽式时间块日程编排，AI 自动填充空闲时段。

**创新点：** 借鉴 Trevor AI 的可视化时间块和 Morgen 的 Frames 功能，用户可以拖拽任务块到时间轴上，AI 自动建议最优安排。

- [ ] **Step 1: 创建时间块模块**

```javascript
// js/time-block.js
const TimeBlock = {
  hours: { start: 6, end: 23 }, // 显示 6:00 - 23:00

  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const tasks = tasks.filter(t => !t.done).sort((a, b) => a.time.localeCompare(b.time));

    let html = `<div class="timeblock-container">`;
    html += `<div class="timeblock-labels">`;

    for (let h = this.hours.start; h <= this.hours.end; h++) {
      html += `<div class="timeblock-hour">${String(h).padStart(2, '0')}:00</div>`;
    }
    html += '</div><div class="timeblock-timeline">';

    // 当前时间指示线
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    if (currentHour >= this.hours.start && currentHour <= this.hours.end) {
      const topPercent = ((currentHour - this.hours.start) * 60 + currentMin) / ((this.hours.end - this.hours.start) * 60) * 100;
      html += `<div class="timeblock-now" style="top:${topPercent}%"></div>`;
    }

    // 渲染任务块
    tasks.forEach(task => {
      const [h, m] = task.time.split(':').map(Number);
      if (h < this.hours.start || h > this.hours.end) return;

      const topPercent = ((h - this.hours.start) * 60 + m) / ((this.hours.end - this.hours.start) * 60) * 100;
      const energyScore = EnergyCurve.getScore(h);
      const energyColor = energyScore >= 0.7 ? '#7ee787' : energyScore >= 0.4 ? '#fbbf24' : '#ef5b5b';

      html += `
        <div class="timeblock-item tag-${task.tag} ${task.done ? 'done' : ''}"
             style="top:${topPercent}%; --energy-color:${energyColor}"
             onclick="editTask(${task.id})"
             draggable="true"
             ondragstart="TimeBlock.dragStart(event, ${task.id})"
             ondragover="TimeBlock.dragOver(event)"
             ondrop="TimeBlock.drop(event)">
          <div class="timeblock-time">${task.time}</div>
          <div class="timeblock-title">${task.title}</div>
          <div class="timeblock-energy" title="精力值 ${Math.round(energyScore * 100)}%"></div>
        </div>
      `;
    });

    html += '</div></div>';
    container.innerHTML = html;
  },

  // 拖拽时间块改变时间
  dragStart(e, taskId) {
    e.dataTransfer.setData('text/plain', taskId);
    e.target.style.opacity = '0.5';
  },

  dragOver(e) {
    e.preventDefault();
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percent = y / rect.height;
    const totalMinutes = (this.hours.end - this.hours.start) * 60;
    const minutes = Math.round(percent * totalMinutes);
    const hour = this.hours.start + Math.floor(minutes / 60);
    const min = minutes % 60;

    // 高亮目标时间位置
    const indicator = container.querySelector('.timeblock-drop-indicator');
    if (indicator) {
      indicator.style.top = `${percent * 100}%`;
    }
  },

  drop(e) {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('text/plain'));
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percent = y / rect.height;
    const totalMinutes = (this.hours.end - this.hours.start) * 60;
    const minutes = Math.round(percent * totalMinutes);
    const hour = this.hours.start + Math.floor(minutes / 60);
    const min = minutes % 60;

    // 更新任务时间
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      Storage.saveTasks(tasks);
      renderTasks();
      showToast(`已将「${task.title}」移至 ${task.time}`);
    }

    this.render('timeBlockContainer');
  }
};
```

---

## 第五阶段：通知与 PWA（第 9 天）

### Task 11: 浏览器通知服务

**文件：**
- 创建：`js/notifications.js`
- 修改：`js/app.js`

- [ ] **Step 1: 创建通知模块**

```javascript
// js/notifications.js
const NotificationService = {
  permission: 'default',

  async init() {
    if (!('Notification' in window)) return false;
    this.permission = Notification.permission;
    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }
    return this.permission === 'granted';
  },

  send(title, body, options = {}) {
    if (this.permission !== 'granted') return;
    new Notification(title, {
      body,
      icon: options.icon || '',
      tag: options.tag || 'ai-schedule',
      requireInteraction: options.requireInteraction || false
    });
  },

  // 检查即将到期的任务
  checkUpcoming() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const notified = new Set();

    tasks.filter(t => !t.done).forEach(task => {
      const [h, m] = task.time.split(':').map(Number);
      const taskMinutes = h * 60 + m;
      const diff = taskMinutes - currentMinutes;

      // 提前 15 分钟提醒
      if (diff === 15 && !notified.has(task.id)) {
        this.send('任务即将开始', `「${task.title}」将在 15 分钟后开始`, { tag: `task-${task.id}` });
        notified.add(task.id);
      }

      // 到期提醒
      if (diff === 0 && !notified.has('due-' + task.id)) {
        this.send('任务开始', `现在是「${task.title}」的预定时间`, { tag: `due-${task.id}` });
        notified.add('due-' + task.id);
      }
    });
  },

  // 签到提醒（每天早上 8 点）
  checkCheckinReminder() {
    const now = new Date();
    if (now.getHours() === 8 && now.getMinutes() === 0) {
      const checkin = Storage.getCheckin();
      if (!checkin.checkedIn) {
        this.send('别忘了签到', `你已连续签到 ${checkin.streak} 天，继续保持！`);
      }
    }
  }
};

// 每分钟检查一次
setInterval(() => {
  const settings = Storage.getSettings();
  if (settings.notifications.taskReminder) {
    NotificationService.checkUpcoming();
    NotificationService.checkCheckinReminder();
  }
}, 60000);
```

---

### Task 12: PWA 支持

**文件：**
- 创建：`manifest.json`
- 创建：`sw.js`
- 修改：`index.html`

- [ ] **Step 1: 创建 manifest.json**

```json
{
  "name": "AI 日程 — 智能日程助手",
  "short_name": "AI日程",
  "description": "AI 驱动的智能日程管理，支持自然语言创建任务、游戏化成长、团队协作",
  "start_url": "/index.html",
  "display": "standalone",
  "background_color": "#0c0c14",
  "theme_color": "#5b8def",
  "orientation": "portrait",
  "icons": [
    { "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='80' font-size='80'>📅</text></svg>", "sizes": "any", "type": "image/svg+xml" }
  ]
}
```

- [ ] **Step 2: 创建 Service Worker**

```javascript
// sw.js
const CACHE_NAME = 'ai-schedule-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/event-bus.js',
  '/js/utils.js',
  '/js/storage.js',
  '/js/gamification.js',
  '/js/energy-curve.js',
  '/js/procrastination.js',
  '/js/nlp.js',
  '/js/ai-engine.js',
  '/js/calendar.js',
  '/js/time-block.js',
  '/js/notifications.js',
  '/js/voice.js',
  '/js/gestures.js',
  '/js/privacy-dashboard.js',
  '/js/social.js',
  '/js/app.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('/index.html'))
  );
});
```

- [ ] **Step 3: 在 index.html 中注册**

```html
<link rel="manifest" href="manifest.json">
<!-- 在 app.js 末尾添加 -->
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
</script>
```

---

## 第六阶段：隐私与社交（第 10 天）

### Task 13: 隐私仪表盘

**文件：**
- 创建：`js/privacy-dashboard.js`
- 修改：`index.html`（添加隐私仪表盘入口）

**目标：** 展示 AI 为什么这样建议，数据使用完全透明。

**创新点：** 借鉴 KAI 的智能隐私路由和 AgendaFacile 的本地优先理念，用户可查看 AI 决策日志并随时撤销。

- [ ] **Step 1: 创建隐私仪表盘**

```javascript
// js/privacy-dashboard.js
const PrivacyDashboard = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const log = Storage.getPrivacyLog();
    const settings = Storage.getSettings();

    container.innerHTML = `
      <div class="privacy-dashboard">
        <div class="pd-header">
          <h4>隐私仪表盘</h4>
          <span class="pd-badge ${settings.privacy.dataCollection ? 'active' : 'inactive'}">
            ${settings.privacy.dataCollection ? '数据收集开启' : '数据收集关闭'}
          </span>
        </div>

        <div class="pd-section">
          <h5>数据存储位置</h5>
          <p>所有数据存储在本地浏览器中（localStorage），不会上传到任何服务器。</p>
        </div>

        <div class="pd-section">
          <h5>AI 决策日志（最近 ${log.length} 条）</h5>
          ${log.length === 0 ? '<p class="pd-empty">暂无 AI 决策记录</p>' :
            log.slice(-10).reverse().map(entry => `
              <div class="pd-log-entry">
                <span class="pd-log-type">${entry.type}</span>
                <span class="pd-log-detail">
                  ${entry.trigger ? `触发：${entry.trigger}` : ''}
                  ${entry.result ? `结果：${JSON.stringify(entry.result).substring(0, 50)}...` : ''}
                </span>
                <span class="pd-log-time">${new Date(entry.timestamp).toLocaleString('zh-CN')}</span>
              </div>
            `).join('')
          }
        </div>

        <div class="pd-section">
          <h5>数据控制</h5>
          <button class="btn-secondary" onclick="PrivacyDashboard.exportData()" style="width:100%; margin-bottom:8px;">导出我的数据</button>
          <button class="btn-danger" onclick="PrivacyDashboard.clearData()" style="width:100%;">清除所有数据</button>
        </div>
      </div>
    `;
  },

  exportData() {
    const data = Storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ai-schedule-data-${Utils.formatDate(new Date())}.json`;
    link.click();
    showToast('数据已导出');
  },

  clearData() {
    if (confirm('确定要清除所有数据吗？此操作不可撤销。')) {
      Storage.clearAll();
      location.reload();
    }
  }
};
```

---

### Task 14: 社交问责系统

**文件：**
- 创建：`js/social.js`
- 修改：`index.html`（添加社交入口）

**目标：** 好友系统 + 排行榜 + 团队挑战，形成正向循环。

- [ ] **Step 1: 创建社交模块**

```javascript
// js/social.js
const Social = {
  // 模拟好友数据（Demo 用）
  friends: [
    { name: '小红', avatar: 2, level: 5, streak: 7, weeklyXp: 320 },
    { name: '小刚', avatar: 3, level: 8, streak: 12, weeklyXp: 580 },
    { name: '小美', avatar: 4, level: 3, streak: 2, weeklyXp: 150 },
    { name: '小强', avatar: 1, level: 12, streak: 30, weeklyXp: 920 }
  ],

  // 团队挑战
  challenges: [
    { id: 'early_bird', name: '早起挑战', desc: '连续7天在7:00前完成一个任务', icon: '🐦', participants: 12, daysLeft: 5 },
    { id: 'focus_master', name: '专注大师', desc: '本周累计专注10小时', icon: '🧘', participants: 8, progress: '65%' },
    { id: 'team_10', name: '十人团战', desc: '团队本周完成100个任务', icon: '🏆', participants: 10, progress: '72%' }
  ],

  renderLeaderboard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const allPlayers = [
      { name: userName || '小明', avatar: 1, level: Gamification.data.level, streak, weeklyXp: Gamification.data.dailyXp, isMe: true },
      ...this.friends
    ].sort((a, b) => b.weeklyXp - a.weeklyXp);

    container.innerHTML = `
      <div class="leaderboard">
        <h4>本周排行榜</h4>
        ${allPlayers.map((p, i) => `
          <div class="lb-item ${p.isMe ? 'me' : ''}">
            <span class="lb-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
            <div class="lb-avatar avatar-${p.avatar}">${p.name[0]}</div>
            <div class="lb-info">
              <span class="lb-name">${p.name}${p.isMe ? ' (我)' : ''}</span>
              <span class="lb-meta">Lv.${p.level} | ${p.streak}天连续</span>
            </div>
            <span class="lb-xp">${p.weeklyXp} XP</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderChallenges(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="challenges">
        <h4>团队挑战</h4>
        ${this.challenges.map(c => `
          <div class="challenge-card">
            <span class="challenge-icon">${c.icon}</span>
            <div class="challenge-info">
              <div class="challenge-name">${c.name}</div>
              <div class="challenge-desc">${c.desc}</div>
              <div class="challenge-meta">${c.participants}人参与</div>
            </div>
            <button class="btn-primary btn-sm" onclick="Social.joinChallenge('${c.id}')">参加</button>
          </div>
        `).join('')}
      </div>
    `;
  },

  joinChallenge(id) {
    showToast('已成功加入挑战！');
  }
};
```

---

## 第七阶段：全面测试（第 11 天）

### Task 15: 测试清单

- [ ] **功能测试**
  - [ ] 任务 CRUD（创建/读取/编辑/删除）
  - [ ] 拖拽排序持久化
  - [ ] 优先级和重复字段正确保存和显示
  - [ ] 签到功能（跨天重置、护盾保护）
  - [ ] 重复任务自动生成
  - [ ] 主题切换持久化
  - [ ] 数据导出/导入
  - [ ] AI 聊天自然语言创建任务（"明天下午3点开会"）
  - [ ] AI 拖延分析回复
  - [ ] AI 精力曲线查询
  - [ ] 日历月视图/周视图切换
  - [ ] 时间块拖拽改变时间
  - [ ] 语音输入（Chrome）
  - [ ] 通知权限请求和推送
  - [ ] XP/等级/成就系统
  - [ ] 奖励商店购买
  - [ ] 能量曲线显示
  - [ ] 隐私仪表盘
  - [ ] 排行榜和团队挑战

- [ ] **兼容性测试**
  - [ ] Chrome / Edge / Safari / Firefox
  - [ ] iOS Safari（PWA 安装）
  - [ ] Android Chrome
  - [ ] 不同屏幕尺寸

- [ ] **性能测试**
  - [ ] 100+ 任务列表渲染
  - [ ] localStorage 读写性能
  - [ ] 动画流畅度（60fps）

- [ ] **安全测试**
  - [ ] XSS 防护（所有用户输入经过 escapeHtml）
  - [ ] 数据导出不泄露敏感信息
  - [ ] 隐私仪表盘正确记录 AI 决策

---

## 文件变更汇总

| 文件 | 操作 | 说明 |
|------|------|------|
| `js/event-bus.js` | 新建 | 模块间事件通信 |
| `js/utils.js` | 新建 | 通用工具函数 |
| `js/storage.js` | 新建 | localStorage 持久化层 |
| `js/gamification.js` | 新建 | RPG 成长系统 |
| `js/energy-curve.js` | 新建 | 能量曲线 AI |
| `js/procrastination.js` | 新建 | 拖延心理模型 |
| `js/nlp.js` | 新建 | 自然语言解析引擎 |
| `js/ai-engine.js` | 新建 | AI 核心引擎 |
| `js/calendar.js` | 新建 | 日历视图组件 |
| `js/time-block.js` | 新建 | 智能时间块 |
| `js/notifications.js` | 新建 | 浏览器通知服务 |
| `js/voice.js` | 新建 | 语音交互 |
| `js/gestures.js` | 新建 | 手势导航增强 |
| `js/privacy-dashboard.js` | 新建 | 隐私仪表盘 |
| `js/social.js` | 新建 | 社交问责系统 |
| `sw.js` | 新建 | Service Worker |
| `manifest.json` | 新建 | PWA 配置 |
| `index.html` | 修改 | 引入新 JS、添加日历/游戏化/语音 UI |
| `css/style.css` | 修改 | 新增所有新组件样式 |
| `js/app.js` | 修改 | 集成事件总线、持久化、模块初始化 |

---

## 里程碑

| 阶段 | 时间 | 交付物 | 创新点 |
|------|------|--------|--------|
| 第一阶段 | 第 1-2 天 | 模块化架构 + 数据持久化 | 事件总线解耦 |
| 第二阶段 | 第 3-4 天 | RPG 成长 + 能量曲线 + 拖延模型 | 游戏化 + 心理学 AI |
| 第三阶段 | 第 5-6 天 | NLP 解析 + AI 引擎 + 语音交互 | 自然语言 + 三模交互 |
| 第四阶段 | 第 7-8 天 | 日历视图 + 智能时间块 | 可视化时间编排 |
| 第五阶段 | 第 9 天 | 通知系统 + PWA | 桌面提醒 + 可安装 |
| 第六阶段 | 第 10 天 | 隐私仪表盘 + 社交系统 | 隐私透明 + 社交问责 |
| 第七阶段 | 第 11 天 | 全面测试与修复 | 质量保证 |

---

**计划完成。** 可选择以下执行方式：

1. **分阶段执行（推荐）** — 我按阶段逐步实施，每完成一个阶段进行测试验证
2. **完整执行** — 一次性完成所有开发任务

建议采用 **分阶段执行**，便于及时发现和修复问题。
