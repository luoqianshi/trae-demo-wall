// ===== 萌宠学堂 - 应用主逻辑 =====
(function() {
'use strict';

// ===== State Management =====
const Store = {
  _state: {
    currentScreen: 'login', // 启动先到登录页
    isLoggedIn: false,
    loginInfo: null, // { phone, loginTime }
    mode: 'child',
    children: [],
    activeChildIndex: 0,
    isSleeping: false,
    // 当前播放状态
    player: { videoId: null, elapsed: 0, isPlaying: false, quizShown: [], isAFK: false, afkTimer: null },
    // 答题
    quiz: { active: false, videoId: null, questionIndex: 0, selectedIndex: -1, answered: false, showFeedback: false },
    // 家长端
    parentTab: 'report',
    parentQuizStep: 'category', // category | type | difficulty | edit | preview
    parentQuizDraft: null,
    // 管理员端
    adminTab: 'templates',
    // 家长即时消息
    parentMessages: [],
  },
  _listeners: [],

  _lastStage: null,
  _consentAccepted: false,

  init() {
    const saved = Utils.loadLocal('state');
    if (saved) {
      Object.assign(this._state, saved);
      // 恢复后重置临时状态
      this._state.quiz = { active: false, videoId: null, questionIndex: 0, selectedIndex: -1, answered: false, showFeedback: false };
      this._state.player = { videoId: null, elapsed: 0, isPlaying: false, quizShown: [], isAFK: false, afkTimer: null };
    }
    // 已登录且无儿童 → 跳转设置页，登录但无儿童 → 设置页，未登录 → 登录页
    if (this._state.isLoggedIn && this._state.children.length === 0) {
      this._state.currentScreen = 'profile-setup';
    } else if (this._state.isLoggedIn && this._state.children.length > 0) {
      this._state.currentScreen = 'home';
    } else {
      this._state.currentScreen = 'login';
    }
    this._persist();
  },

  _createChild(name, birthYear) {
    return {
      name, birthYear,
      ageGroup: Utils.getAgeGroup(birthYear),
      pets: [],
      activePetIndex: 0,
      room: { bg: 'bg-star', furniture: [], costumes: [] },
      stats: { totalWatchTime: 0, effectiveWatchTime: 0, quizzesAnswered: 0, quizzesCorrect: 0, consecutiveDays: 0, lastWatchDate: null },
      history: [],
      controls: { ...Data.defaultControls },
      unlockedItems: ['bg-star', 'bg-forest', 'bg-study', 'bg-ocean', 'bg-garden', 'f-lamp', 'f-rug', 'f-clock', 'c-hat']
    };
  },

  get state() { return this._state; },

  set(updates) {
    Object.assign(this._state, updates);
    this._persist();
    this._notify();
  },

  updateChild(index, updates) {
    if (this._state.children[index]) {
      Object.assign(this._state.children[index], updates);
      this._persist();
      this._notify();
    }
  },

  activeChild() { return this._state.children[this._state.activeChildIndex]; },

  _persist() { Utils.saveLocal('state', { children: this._state.children, activeChildIndex: this._state.activeChildIndex, mode: this._state.mode, adminTab: this._state.adminTab, parentTab: this._state.parentTab, isLoggedIn: this._state.isLoggedIn, loginInfo: this._state.loginInfo, parentMessages: this._state.parentMessages }); },
  _notify() { this._listeners.forEach(fn => fn(this._state)); },
  subscribe(fn) { this._listeners.push(fn); }
};

// ===== TV Remote Engine =====
const Remote = {
  focusables: [],
  focusIndex: -1,

  refresh() {
    this.focusables = Array.from(document.querySelectorAll('[data-tv-focusable]:not(.hidden)'));
    this.focusIndex = Math.min(this.focusIndex, this.focusables.length - 1);
    this._updateFocus();
  },

  _updateFocus() {
    this.focusables.forEach((el, i) => {
      el.classList.toggle('tv-focus', i === this.focusIndex);
      if (i === this.focusIndex) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    });
  },

  move(dir) {
    if (this.focusables.length === 0) return;
    const current = this.focusables[this.focusIndex];
    if (!current) { this.focusIndex = 0; this._updateFocus(); return; }

    const rect = current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    let best = null, bestDist = Infinity;

    for (let i = 0; i < this.focusables.length; i++) {
      if (i === this.focusIndex) continue;
      const el = this.focusables[i];
      const r = el.getBoundingClientRect();
      const ex = r.left + r.width / 2, ey = r.top + r.height / 2;
      const dx = ex - cx, dy = ey - cy;

      if (dir === 'left' && dx >= -10) continue;
      if (dir === 'right' && dx <= 10) continue;
      if (dir === 'up' && dy >= -10) continue;
      if (dir === 'down' && dy <= 10) continue;

      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) { bestDist = dist; best = i; }
    }

    if (best !== null) { this.focusIndex = best; this._updateFocus(); }
  },

  confirm() {
    if (this.focusables[this.focusIndex]) {
      this.focusables[this.focusIndex].click();
    }
  },

  back() { Router.navigateBack(); },

  handleKey(e) {
    const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', Enter: 'confirm', Backspace: 'back', Escape: 'back' };
    const action = map[e.key];
    if (!action) return true;
    e.preventDefault();
    if (action === 'confirm') this.confirm();
    else if (action === 'back') this.back();
    else this.move(action);
    return false;
  }
};

// ===== Router =====
const Router = {
  _history: [],
  navigate(screen) {
    const prev = Store.state.currentScreen;
    if (prev !== screen) this._history.push(prev);
    Store.set({ currentScreen: screen });
    App.render();
    setTimeout(() => Remote.refresh(), 50);
  },
  navigateBack() {
    if (Store.state.quiz.active) { App.cancelQuiz(); return; }
    if (Store.state.currentScreen === 'player') { App.exitPlayer(); return; }
    const prev = this._history.pop() || 'video-feed';
    Store.set({ currentScreen: prev });
    App.render();
    setTimeout(() => Remote.refresh(), 50);
  }
};

// ===== 工具：渲染宠物/阶段图标（支持emoji和base64图片） =====
function renderPetIcon(icon) {
  if (!icon) return '⭐';
  if (icon.startsWith('data:image')) return `<img src="${icon}" style="width:1em;height:1em;vertical-align:middle;object-fit:contain;">`;
  return icon;
}

// ===== Pet Logic =====
const PetLogic = {
  // 获取当前活跃的宠物
  getActivePet(child) {
    if (!child || !child.pets || child.pets.length === 0) return null;
    return child.pets[child.activePetIndex] || null;
  },

  // 获取宠物的专属成长值
  getGrowthValue(child) {
    const pet = this.getActivePet(child);
    if (!pet) return 0;
    return (pet.petGrowthValue || 0);
  },

  // 判定当前宠物是否已经完成全部成长（到达最终阶段）
  isPetComplete(child) {
    const pet = this.getActivePet(child);
    if (!pet) return false;
    if (pet.completed) return true;
    const allTypes = Data.getAllPetTypes();
    const type = allTypes.find(t => t.id === pet.typeId);
    if (!type) return false;
    const gv = this.getGrowthValue(child);
    const lastStage = type.stages[type.stages.length - 1];
    return gv >= lastStage.threshold;
  },

  // 获取当前阶段
  getCurrentStage(child) {
    const pet = this.getActivePet(child);
    if (!pet) return null;
    const allTypes = Data.getAllPetTypes();
    const type = allTypes.find(t => t.id === pet.typeId);
    if (!type) return null;
    const gv = this.getGrowthValue(child);
    let stage = type.stages[0];
    for (const s of type.stages) { if (gv >= s.threshold) stage = s; }
    return { ...stage, typeId: type.id, typeName: type.name };
  },

  // 获取到下一阶段的进度百分比
  getProgressToNext(child) {
    const pet = this.getActivePet(child);
    if (!pet) return 0;
    const allTypes = Data.getAllPetTypes();
    const type = allTypes.find(t => t.id === pet.typeId);
    if (!type) return 0;
    const gv = this.getGrowthValue(child);
    let prev = 0, next = type.stages[type.stages.length - 1].threshold;
    for (let i = 0; i < type.stages.length; i++) {
      if (gv < type.stages[i].threshold) { next = type.stages[i].threshold; break; }
      prev = type.stages[i].threshold;
    }
    const range = next - prev;
    return range > 0 ? ((gv - prev) / range) * 100 : 100;
  },

  // 添加观看时长 — 同时更新整体统计和宠物专属成长值
  addWatchTime(seconds, effective) {
    const child = Store.activeChild();
    if (!child) return;
    const pet = this.getActivePet(child);
    const today = new Date().toDateString();
    child.stats.totalWatchTime += seconds;
    if (effective) {
      child.stats.effectiveWatchTime += seconds;
      if (pet) { pet.petGrowthValue = (pet.petGrowthValue || 0) + Math.floor(seconds / 60); }
    }
    if (child.stats.lastWatchDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      child.stats.consecutiveDays = (child.stats.lastWatchDate === yesterday) ? child.stats.consecutiveDays + 1 : 1;
      child.stats.lastWatchDate = today;
    }
    Store.updateChild(Store.state.activeChildIndex, { stats: child.stats, pets: child.pets });
    this._checkUnlocks(child);
    this._checkPetCompletion(child);
    this._checkGrowthStageChange(child);
    // 播放音效
    this.Sound.play('watch');
  },

  // 记录答题
  recordQuiz(correct) {
    const child = Store.activeChild();
    if (!child) return;
    const pet = this.getActivePet(child);
    child.stats.quizzesAnswered++;
    if (correct) {
      child.stats.quizzesCorrect++;
      if (pet) { pet.petGrowthValue = (pet.petGrowthValue || 0) + 3; }
    }
    Store.updateChild(Store.state.activeChildIndex, { stats: child.stats, pets: child.pets });
    this._checkUnlocks(child);
    this._checkPetCompletion(child);
    this._checkGrowthStageChange(child);
    // 播放答题音效
    this.Sound.play(correct ? 'correct' : 'wrong');
  },

  // 检查宠物是否完成，标记 completed
  _checkPetCompletion(child) {
    const pet = this.getActivePet(child);
    if (!pet || pet.completed) return;
    if (this.isPetComplete(child)) {
      pet.completed = true;
      pet.completedAt = Date.now();
      Store.updateChild(Store.state.activeChildIndex, { pets: child.pets });
      // 宠物完成成长音效
      this.Sound.play('complete');
    }
  },

  _lastGrowthStage: {}, // 记录每个宠物上次检测到的成长阶段

  _checkGrowthStageChange(child) {
    const pet = this.getActivePet(child);
    if (!pet) return;
    const type = Data.getAllPetTypes().find(t => t.id === pet.typeId);
    if (!type || !type.stages) return;
    const currentStage = type.stages.reduce((last, s) => (pet.petGrowthValue || 0) >= s.threshold ? s : last, type.stages[0]);
    const petKey = child.name + '_' + (child.pets.indexOf(pet));
    const lastStageName = this._lastGrowthStage[petKey];
    if (lastStageName && lastStageName !== currentStage.name) {
      // 阶段升级了，播放过渡动画
      this._playGrowthTransition(currentStage);
    }
    this._lastGrowthStage[petKey] = currentStage.name;
  },

  _playGrowthTransition(stage) {
    // 创建全屏过渡动画遮罩
    const overlay = document.createElement('div');
    overlay.className = 'growth-transition-overlay';
    overlay.innerHTML = `<div class="gt-content">
      <div class="gt-stage-icon">${stage.icon}</div>
      <div class="gt-stage-name">成长到了新阶段：${stage.name}</div>
      <div class="gt-sparkles">✨ 🌟 ✨</div>
    </div>`;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 50);
    setTimeout(() => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 600);
    }, 2500);
  },

  _checkUnlocks(child) {
    const days = child.stats.consecutiveDays;
    const correct = child.stats.quizzesCorrect;
    Data.rooms.backgrounds.forEach(b => { if (!b.locked && !child.unlockedItems.includes(b.id)) child.unlockedItems.push(b.id); });
    Data.rooms.furniture.forEach(f => { if (f.unlock <= days && !child.unlockedItems.includes(f.id)) { child.unlockedItems.push(f.id); f.locked = false; } });
    Data.rooms.costumes.forEach(c => { if (c.unlock <= correct && !child.unlockedItems.includes(c.id)) { child.unlockedItems.push(c.id); c.locked = false; } });
    Store.updateChild(Store.state.activeChildIndex, { unlockedItems: child.unlockedItems });
  },

  // ===== Sound System =====
  Sound: {
    _audioCtx: null,
    _getCtx() {
      if (!this._audioCtx) {
        this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      return this._audioCtx;
    },
    play(type) {
      try {
        const ctx = this._getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.value = 0.3;
        const now = ctx.currentTime;
        switch (type) {
          case 'watch':
            osc.frequency.value = 800;
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
            break;
          case 'correct':
            osc.frequency.value = 1000;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            // 第二个音
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            gain2.gain.value = 0.3;
            osc2.frequency.value = 1500;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.3, now + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
            osc2.start(now + 0.15);
            osc2.stop(now + 0.45);
            break;
          case 'wrong':
            osc.frequency.value = 200;
            osc.type = 'sawtooth';
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            break;
          case 'complete':
            // 上升音阶
            for (let i = 0; i < 3; i++) {
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.connect(g);
              g.connect(ctx.destination);
              g.gain.value = 0.2;
              o.frequency.value = 500 + i * 300;
              o.type = 'sine';
              g.gain.setValueAtTime(0.2, now + i * 0.2);
              g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.2);
              o.start(now + i * 0.2);
              o.stop(now + i * 0.2 + 0.2);
            }
            break;
          default:
            // 默认短促音
            osc.frequency.value = 600;
            osc.type = 'square';
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        }
      } catch (e) {
        // 静默失败，不影响游戏
      }
    }
  },

  // ===== Voice Synthesis =====
  speak(text, lang = 'zh-CN') {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1.2;
    window.speechSynthesis.speak(utterance);
  },

  // ===== Pet Interaction =====
  interactWithPet(action) {
     const child = Store.activeChild();
     const pet = this.getActivePet(child);
     if (!pet) return;
     const stage = this.getCurrentStage(child);
     if (!stage) return;
     // 触发弹跳动画
     const float = document.getElementById('pet-float');
     if (float) {
       float.classList.remove('idle', 'bounce');
       float.classList.add('bounce');
       setTimeout(() => { float.classList.remove('bounce'); float.classList.add('idle'); }, 500);
     }
     // 根据动作播放不同音效和语音
    switch (action) {
      case 'pet':
        this.Sound.play('watch');
        this.speak(`好舒服呀，${pet.variety}很开心！`);
        // 增加少量成长值作为互动奖励
        pet.petGrowthValue = (pet.petGrowthValue || 0) + 1;
        Store.updateChild(Store.state.activeChildIndex, { pets: child.pets });
        break;
      case 'feed':
        this.Sound.play('correct');
        this.speak(`谢谢主人，${pet.variety}吃饱了！`);
        pet.petGrowthValue = (pet.petGrowthValue || 0) + 2;
        Store.updateChild(Store.state.activeChildIndex, { pets: child.pets });
        break;
      case 'play':
        this.Sound.play('complete');
        this.speak(`来玩吧！${stage.name}最爱和你玩了！`);
        pet.petGrowthValue = (pet.petGrowthValue || 0) + 2;
        Store.updateChild(Store.state.activeChildIndex, { pets: child.pets });
        break;
      default:
        this.speak(`${pet.variety}在看着你呢！`);
    }
    this._checkPetCompletion(child);
  }
};

// ===== App =====
const App = {
  playerTimer: null,
  quizTimer: null,

  _eventNameMap: {
    'video_start': '视频开始',
    'video_end': '视频结束',
    'quiz_submit': '答题提交',
    'pet_adopt': '领养宠物',
    'room_enter': '进入宠物家',
    'parent_sleep_signal': '睡眠信号',
    'parent_pause': '暂停使用',
    'creator_tip': '打赏博主'
  },

  init() {
    Store.init();
    document.addEventListener('keydown', (e) => Remote.handleKey(e));
    this.render();
    setTimeout(() => Remote.refresh(), 100);
  },

  render() {
    const screen = Store.state.currentScreen;
    const $app = document.getElementById('app');
    let html = '';

    // 登录页和设置页不需要 Header
    const noHeaderScreens = ['player', 'pet-select', 'login', 'profile-setup', 'child-manage', 'video-feed'];

    // 儿童端顶部即时消息条（始终最优先显示，player页面也显示）
    if (Store.state.mode === 'child' && Store.state.parentMessages && Store.state.parentMessages.length > 0) {
      html += this._renderParentMessageBar();
    }

    if (!noHeaderScreens.includes(screen)) {
      html += this._renderHeader();
    }

    // 儿童端不显示底部导航（视频自动播放，宠物家通过按钮入口）
    // 底部导航仅在管理端/家长端非标准页面保留
    const showBottomNav = false;
    if (showBottomNav) {
      html += this._renderBottomNav();
    }

    html += `<div class="screen ${screen === 'player' ? 'player-screen' : ''} ${screen === 'pet-select' ? 'pet-select-screen' : ''} ${screen === 'room' ? 'room-screen' : ''} ${screen.startsWith('parent-') ? 'parent-screen' : ''} ${screen.startsWith('admin-') ? 'admin-screen' : ''} ${screen === 'growth' ? 'growth-screen' : ''} ${screen === 'login' ? 'login-screen' : ''} ${screen === 'profile-setup' ? 'setup-screen' : ''} ${screen === 'child-manage' ? 'setup-screen' : ''} ${screen === 'video-feed' ? 'video-feed-screen' : ''} active" id="screen-${screen}">`;

    // Initialize _lastStage on first render with active child
    if (!this._lastStage && Store.activeChild()) {
      this._lastStage = PetLogic.getCurrentStage(Store.activeChild());
    }

    switch (screen) {
      case 'login': html += this._renderLogin(); break;
      case 'profile-setup': html += this._renderProfileSetup(); break;
      case 'child-manage': html += this._renderChildManage(); break;
      case 'pet-select': html += this._renderPetSelect(); break;
      case 'home': html += this._renderVideoFeed(); break;
      case 'library': html += this._renderLibrary(); break;
      case 'video-feed': html += this._renderVideoFeed(); break;
      case 'player': html += this._renderPlayer(); break;
      case 'room': html += this._renderRoom(); break;
      case 'growth': html += this._renderGrowth(); break;
      case 'parent-report': html += this._renderParentReport(); break;
      case 'parent-control': html += this._renderParentControl(); break;
      case 'parent-quiz': html += this._renderParentQuizCreate(); break;
      case 'parent-content': html += this._renderParentContent(); break;
      case 'admin-templates': html += this._renderAdminTemplates(); break;
      case 'admin-content': html += this._renderAdminContent(); break;
      case 'admin-tasks': html += this._renderAdminTasks(); break;
      case 'admin-settings': html += this._renderAdminSettings(); break;
      default: html += this._renderVideoFeed();
    }

    html += '</div>';

    // 答题覆盖层（全局显示，支持家长出题和视频答题）
    if (Store.state.quiz.active) {
      html += this._renderQuizOverlay();
    }

    // 阶段变化动画层
    html += '<div id="stage-change-overlay" class="stage-change-overlay hidden"></div>';

    $app.innerHTML = html;
    this._bindEvents();
    setTimeout(() => Remote.refresh(), 50);

    // 恢复播放状态
    if (screen === 'player' && Store.state.player.isPlaying) {
      this._startPlayback();
    }

    // 睡眠模式检查
    if (screen !== 'pet-select' && Store.state.isSleeping) {
      this._showSleepOverlay();
    }

    // 知情同意书弹窗（首次进入注册页时自动弹出）
    if (screen === 'profile-setup' && !this._consentAccepted) {
      this._consentAccepted = false;
      setTimeout(() => this._showConsentModal(), 300);
    }

    // Three.js 宠物家初始化
    if (screen === 'room') {
      setTimeout(() => this._initRoom3D(), 100);
    }
  },

  // --- Bottom Nav ---
  _renderBottomNav() {
    const screen = Store.state.currentScreen;
    const tabs = [
      { id: 'video-feed', icon: '📺', label: '视频' },
      { id: 'room', icon: '🏡', label: '宠物家' },
    ];
    return `<nav class="bottom-nav">
      ${tabs.map(t => `<div class="bn-tab ${screen === t.id ? 'active' : ''}" data-tv-focusable onclick="App.bottomNavTo('${t.id}')">
        <span class="bn-icon">${t.icon}</span>
        <span class="bn-label">${t.label}</span>
      </div>`).join('')}
    </nav>`;
  },

  bottomNavTo(id) {
    if (id === 'video-feed') { this._videoFeedIndex = 0; }
    Router.navigate(id);
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  // --- Parent Message Bar (儿童端顶部) ---
  _renderParentMessageBar() {
    const msgs = Store.state.parentMessages || [];
    if (msgs.length === 0) return '';
    const latest = msgs[msgs.length - 1];
    return `<div class="parent-msg-bar">
      <div class="pmb-content">
        <span class="pmb-icon">💬</span>
        <span class="pmb-text">${latest.text}</span>
      </div>
      <button class="pmb-close" onclick="App.dismissParentMessage(${msgs.length - 1})" data-tv-focusable>✕</button>
    </div>`;
  },

  // --- Header ---
  _renderHeader() {
    const mode = Store.state.mode;
    const activeChild = Store.activeChild();
    const stage = activeChild ? PetLogic.getCurrentStage(activeChild) : null;
    const activePet = PetLogic.getActivePet(activeChild);
    const isAdmin = mode === 'admin';
    const isParent = mode === 'parent';

    // 多宠物指示器
    let multiPetHtml = '';
    if (mode === 'child' && activeChild && activeChild.pets.length > 1) {
      multiPetHtml = `<div class="multi-pet-indicator" data-tv-focusable onclick="App.cycleActivePet()" title="切换宠物">
        ${activeChild.pets.map((p, i) => {
          const allTypes = Data.getAllPetTypes();
          const t = allTypes.find(tt => tt.id === p.typeId);
          const petStage = t ? t.stages.find(s => s.threshold <= (p.petGrowthValue || 0)) || t.stages[0] : null;
          // Find the last reached stage
          let lastReached = t ? t.stages[0] : null;
          if (t) { for (const s of t.stages) { if ((p.petGrowthValue || 0) >= s.threshold) lastReached = s; } }
          return `<span class="pet-dot ${i === activeChild.activePetIndex ? 'active' : ''} ${p.completed ? 'completed' : ''}" title="${p.variety}${p.completed ? ' (已完成)' : ''}">${lastReached ? lastReached.icon : t.stages[0].icon}</span>`;
        }).join('')}
      </div>`;
    }

    return `<header class="app-header">
      <div class="brand">
        <span class="brand-icon">${isAdmin ? '⚙️' : isParent ? '📊' : '🏠'}</span>
        <span class="brand-name">${isAdmin ? '管理后台' : isParent ? '家长中心' : '萌宠学堂'}</span>
      </div>
      <div class="header-right">
        ${mode === 'child' ? `<button class="switch-btn" onclick="App.openChildManage()" data-tv-focusable>${activeChild?.name || '小朋友'} ▾</button>` : ''}
        ${multiPetHtml}
        ${!isAdmin && !isParent && stage ? `<div class="child-switcher" onclick="App.goRoom()" data-tv-focusable><span class="pet-mini">${stage.icon}</span>${stage.name}</div>` : ''}
        ${!isAdmin && !isParent ? `<button class="switch-btn" onclick="App.switchToParent()" data-tv-focusable>家长中心</button>` : ''}
        ${!isAdmin ? `<button class="switch-btn admin-btn" onclick="App.switchToAdmin()" data-tv-focusable>管理后台</button>` : ''}
        ${isParent || isAdmin ? `<button class="switch-btn" onclick="App.switchToChild()" data-tv-focusable>返回儿童端</button>` : ''}
      </div>
    </header>`;
  },

  openChildManage() {
    this._videoFeedIndex = 0;
    Router.navigate('child-manage');
  },

  // --- Pet Selection ---
  _renderPetSelect() {
    const child = Store.activeChild();
    const baseTypes = Data.petTypes;
    return `
      <div class="select-title">${child && child.pets.length > 0 ? '领养新伙伴' : '选择你的小伙伴'}</div>
      <p style="text-align:center;font-size:0.82rem;color:var(--muted);margin-bottom:1.2rem;position:relative;z-index:1;">选一颗蛋，看看会孵化出什么吧！</p>
      <div class="pet-select-cards">
        ${baseTypes.map((t, i) => `
          <div class="pet-type-card ${i === 0 ? 'tv-focus' : ''}" data-tv-focusable onclick="App.selectPetType(${i})">
            <div class="type-icon">${t.icon}</div>
            <div class="type-name">${t.name}</div>
            <div class="type-desc" style="font-size:0.75rem;color:var(--muted);">${t.desc}</div>
          </div>
        `).join('')}
      </div>
      <div class="pet-select-actions">
        <button class="btn-primary" id="confirm-pet-btn" onclick="App.confirmPet()" data-tv-focusable>开始孵化</button>
      </div>
      <p style="margin-top:1.2rem;font-size:0.72rem;color:var(--muted);position:relative;z-index:1;">使用 ← → 切换，确认键选择</p>`;
  },

  _selectedTypeIndex: 0,
  _selectedVariety: null,

  selectPetType(index) {
    this._selectedTypeIndex = index;
    document.querySelectorAll('.pet-type-card').forEach((c, i) => {
      c.classList.toggle('tv-focus', i === index);
      c.style.borderColor = i === index ? 'var(--accent)' : '';
    });
  },

  confirmPet() {
    const child = Store.activeChild();
    // 只从基础类型中选，随机分配品种
    const type = Data.petTypes[this._selectedTypeIndex];
    const variety = type.varieties[Math.floor(Math.random() * type.varieties.length)];
    const newPet = {
      typeId: type.id,
      variety: variety,
      color: ['暖色', '冷色', '自然', '柔和'][Math.floor(Math.random() * 4)],
      adoptedAt: Date.now(),
      petGrowthValue: 0,
      completed: false,
      completedAt: null
    };
    child.pets.push(newPet);
    child.activePetIndex = child.pets.length - 1;
    Store.updateChild(Store.state.activeChildIndex, { pets: child.pets, activePetIndex: child.activePetIndex });
    Data.trackEvent('pet_adopt', { typeId: type.id, variety: variety, childName: child.name });
    // Show hatch animation
    const isSecondPet = child.pets.length > 1;
    this._showStageChange(
      type.stages[0].icon,
      isSecondPet ? '新伙伴来啦！' : `${variety}孵化成功！`,
      isSecondPet ? '又多了一个小伙伴' : '开始探索吧'
    );
    // 选完宠物直接自动播放视频
    setTimeout(() => { this._videoFeedIndex = 0; Router.navigate('video-feed'); this.render(); }, 3000);
  },

  // --- Home ---
  _renderHome() {
    const child = Store.activeChild();
    if (!child) return '<div class="empty-state">请先选择或添加小朋友</div>';
    const ageGroup = child?.ageGroup || '3-6';
    const activePet = PetLogic.getActivePet(child);
    const stage = activePet ? PetLogic.getCurrentStage(child) : null;
    const isComplete = PetLogic.isPetComplete(child);
    const progress = PetLogic.getProgressToNext(child);
    const gv = PetLogic.getGrowthValue(child);

    // 自动打卡状态（有观看记录即自动打卡）
    const today = new Date().toDateString();
    const hasWatched = child.stats.lastWatchDate === today;
    const autoStatus = hasWatched
      ? '<span style="color:var(--accent2);font-weight:600;font-size:0.8rem;">✅ 今日已学习 · 连续' + child.stats.consecutiveDays + '天</span>'
      : '<span style="color:var(--muted);font-size:0.8rem;">今日还未开始学习</span>';

    // 宠物状态卡 — 悬浮头像可跳转宠物家
    let petCardHtml = '';
    if (stage && activePet) {
      petCardHtml = `<div class="home-pet-card">
        <div class="hpc-left">
          <div class="hpc-pet-icon hpc-pet-clickable" onclick="App.goToRoom()" data-tv-focusable title="去宠物家">${renderPetIcon(stage.icon)}</div>
          <div class="hpc-info">
            <div class="hpc-name">${activePet.variety} · ${stage.name}</div>
            <div class="hpc-progress-bar"><div class="hpc-progress-fill" style="width:${Math.min(progress, 100)}%"></div></div>
            <div class="hpc-sub">成长值 ${gv} ${isComplete ? '🏆' : ''}</div>
          </div>
        </div>
        <div class="hpc-right">
          <button class="btn-secondary" onclick="App.adoptNewPet()" data-tv-focusable style="padding:0.3rem 0.7rem;font-size:0.75rem;">🐾 新宠物</button>
          <button class="btn-secondary" onclick="App.goToRoom()" data-tv-focusable style="padding:0.3rem 0.7rem;font-size:0.75rem;">🏠 宠物家</button>
        </div>
      </div>`;
    } else {
      petCardHtml = `<div class="home-pet-card" onclick="Router.navigate('pet-select')" data-tv-focusable style="justify-content:center;">
        <span style="font-size:1.2rem;">🐾</span> 点击领养你的第一个小伙伴
      </div>`;
    }

    // 宠物完成横幅
    let topBanner = '';
    if (isComplete && activePet) {
      topBanner = `<div class="pet-complete-banner">
        <span class="complete-icon">🎉</span>
        <span>${activePet.variety}已经完全成长啦！快去领养新伙伴吧</span>
        <button class="btn-primary" onclick="App.adoptNewPet()" data-tv-focusable style="padding:0.3rem 1rem;font-size:0.82rem;">领养新伙伴</button>
      </div>`;
    }

    // 开始学习大按钮
    const learnBtn = activePet
      ? `<div class="home-learn-btn" onclick="App.openVideoFeed()" data-tv-focusable>
          <div class="hlb-icon">▶</div>
          <div class="hlb-text">开始学习</div>
        </div>`
      : '';

    return `
      ${topBanner}
      <div class="home-pet-section">
        ${petCardHtml}
        <div class="home-checkin">${autoStatus}</div>
      </div>
      ${learnBtn}
      ${this._renderParentQuizEntry()}
      <div class="home-section-title"><span class="icon">📚</span> 最近在看</div>
      <div class="video-grid">
        ${this._renderRecentVideos(child)}
      </div>`;
  },

  _renderRecentVideos(child) {
    const watched = child.history || [];
    if (watched.length === 0) {
      const ageGroup = child?.ageGroup || '3-6';
      const recommended = Data.getAllVideos().filter(v => v.ageGroup === ageGroup).slice(0, 4);
      if (recommended.length === 0) return '<p style="color:var(--muted);font-size:0.82rem;">暂无内容</p>';
      return recommended.map(v => this._renderVideoCard(v)).join('');
    }
    // 显示最近看过的和同分类推荐
    const watchedIds = new Set(watched.map(w => w.videoId));
    const recentVids = watched.slice(-4).reverse().map(w => {
      const v = Data.getAllVideos().find(vv => vv.id === w.videoId);
      return v;
    }).filter(Boolean);
    return recentVids.map(v => this._renderVideoCard(v)).join('');
  },

  goToRoom() {
    Data.trackEvent('room_enter', { childName: Store.activeChild()?.name });
    Router.navigate('room');
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  openVideoFeed() {
    this._videoFeedIndex = 0;
    Router.navigate('video-feed');
    // 自动播放第一个视频
    if (Store.state.mode === 'child') {
      const videos = this._getFeedVideos();
      if (videos.length > 0) {
        const v = videos[0];
        setTimeout(() => this.playVideo(v.id), 200);
      }
    }
  },

  _renderParentQuizEntry() {
    const count = Data.getParentQuizzes({ status: 'active' }).length;
    if (count === 0) return '';
    return `
      <div class="home-section-title"><span class="icon">✏️</span> 家长出题</div>
      <div class="pq-entry-card" data-tv-focusable onclick="App.startParentQuiz()">
        <div class="pq-entry-icon">📝</div>
        <div class="pq-entry-info">
          <div class="pq-entry-title">爸妈给我出的题</div>
          <div class="pq-entry-desc">${count} 道练习题等你挑战，答对获得成长值！</div>
        </div>
        <div class="pq-entry-arrow">▸</div>
      </div>`;
  },

  startParentQuiz() {
    const quizzes = Data.getParentQuizzes({ status: 'active' });
    if (quizzes.length === 0) { App._alert('暂无家长出题'); return; }
    const q = quizzes[0];
    Store.set({
      quiz: {
        active: true,
        isParentQuiz: true,
        parentQuizId: q.id,
        videoId: null,
        questionIndex: 0,
        selectedIndex: -1,
        answered: false,
        showFeedback: false,
        fillAnswer: ''
      }
    });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  // --- 抖音式视频流 ---
  _videoFeedIndex: 0,

  _getFeedVideos() {
    const child = Store.activeChild();
    if (!child) return [];
    const ageGroup = child?.ageGroup || '3-6';
    const ctrl = child.controls || {};
    let allVideos = Data.getAllVideos();

    // 合并家长自定义视频
    if (ctrl.customVideos && ctrl.customVideos.length > 0) {
      const customs = ctrl.customVideos.map((cv, i) => ({
        id: 'custom-' + i, title: cv.title, category: cv.category,
        ageGroup: cv.ageGroup || '7-9', duration: 180, icon: '🔗',
        desc: '家长自定义视频', source: '家长分享',
        sourceUrl: cv.url
      }));
      allVideos = [...allVideos, ...customs];
    }

    // 关键词黑名单过滤
    if (ctrl.blacklistKeywords && ctrl.blacklistKeywords.length > 0) {
      const kws = ctrl.blacklistKeywords.map(k => k.toLowerCase());
      allVideos = allVideos.filter(v =>
        !kws.some(kw => v.title.toLowerCase().includes(kw) || (v.desc || '').toLowerCase().includes(kw))
      );
    }

    // 内容分级管控
    if (ctrl.contentLevel === 'strict' && ctrl.whitelistedCreators) {
      const allowed = ctrl.whitelistedCreators;
      allVideos = allVideos.filter(v => {
        const creator = Data.creators?.find(c => c.id === v.creatorId);
        return creator ? allowed.includes(creator.id) : false;
      });
    } else if (ctrl.contentLevel === 'relaxed') {
      allVideos = allVideos.filter(v => !v.isExplicit);
    }

    // 家长优先级：先看家长推送的视频（任务关联），再看同年龄匹配，最后其他
    const tasks = Data.getAllTasks();
    const taskVideoIds = new Set(tasks.map(t => t.videoId));

    const parentPushed = allVideos.filter(v => taskVideoIds.has(v.id) && v.ageGroup === ageGroup);
    const ageMatch = allVideos.filter(v => v.ageGroup === ageGroup && !taskVideoIds.has(v.id));
    const others = allVideos.filter(v => v.ageGroup !== ageGroup && !taskVideoIds.has(v.id));

    return [...parentPushed, ...ageMatch, ...others];
  },

  _renderVideoFeed() {
    const videos = this._getFeedVideos();
    if (videos.length === 0) return '<div class="empty-state">暂无视频内容</div>';

    const idx = Math.min(this._videoFeedIndex, videos.length - 1);
    const v = videos[idx];
    const allQuizzes = Data.getAllQuizzes();
    const hasQuiz = allQuizzes[v.id] && allQuizzes[v.id].length > 0;
    const categoryGradients = {
      '自然科学': 'linear-gradient(180deg, #1A5276 0%, #1A8B6E 100%)',
      '历史人文': 'linear-gradient(180deg, #6C3483 0%, #A04000 100%)',
      '数学思维': 'linear-gradient(180deg, #1F618D 0%, #2E86C1 100%)',
      '艺术审美': 'linear-gradient(180deg, #7D3C98 0%, #E74C8B 100%)',
      '语言表达': 'linear-gradient(180deg, #117A65 0%, #1ABC9C 100%)',
      '生活常识': 'linear-gradient(180deg, #D68910 0%, #F39C12 100%)'
    };
    const grad = categoryGradients[v.category] || 'linear-gradient(180deg, #2C3E50 0%, #3498DB 100%)';
    const minutes = Math.floor(v.duration / 60);
    const seconds = v.duration % 60;

    return `
      <div class="vf-container" style="background:${grad}">
        <div class="vf-top-bar">
          <button class="vf-back-btn" onclick="App.startVideoSession()" data-tv-focusable>▶ 播放</button>
          <span class="vf-counter">${idx + 1} / ${videos.length}</span>
          <button class="vf-home-btn" onclick="App.switchToParent()" data-tv-focusable>📊</button>
        </div>
        <div class="vf-content">
          <div class="vf-icon">${v.icon}</div>
          <div class="vf-title">${v.title}</div>
          <div class="vf-desc">${v.desc}</div>
          <div class="vf-meta">
            <span>${v.category}</span>
            <span>·</span>
            <span>${minutes}:${String(seconds).padStart(2, '0')}</span>
            <span>·</span>
            <span>适合${v.ageGroup}岁</span>
          </div>
          ${hasQuiz ? '<div class="vf-quiz-tag">📝 含课后问答</div>' : ''}
        </div>
        <div class="vf-actions">
          <button class="vf-action-btn vf-room-btn" onclick="App.goToRoom()" data-tv-focusable title="宠物家">
            <span class="vfa-icon">🏡</span>
            <span class="vfa-label">宠物家</span>
          </button>
          ${idx > 0 ? `<button class="vf-action-btn" onclick="App.feedPrev()" data-tv-focusable>
            <span class="vfa-icon">↑</span>
            <span class="vfa-label">上一个</span>
          </button>` : ''}
          ${idx < videos.length - 1 ? `<button class="vf-action-btn" onclick="App.feedNext()" data-tv-focusable>
            <span class="vfa-icon">↓</span>
            <span class="vfa-label">下一个</span>
          </button>` : ''}
        </div>
        <div class="vf-progress">
          <div class="vf-progress-fill" style="width:${((idx + 1) / videos.length * 100)}%"></div>
        </div>
      </div>`;
  },

  feedPlayVideo(videoId) {
    this.playVideo(videoId);
  },

  feedPrev() {
    if (this._videoFeedIndex > 0) {
      this._videoFeedIndex--;
      this.render();
      setTimeout(() => Remote.refresh(), 50);
    }
  },

  feedNext() {
    const videos = this._getFeedVideos();
    if (this._videoFeedIndex < videos.length - 1) {
      this._videoFeedIndex++;
      this.render();
      setTimeout(() => Remote.refresh(), 50);
    }
  },

  // 每日签到（改为自动，保留方法以防引用）
  dailyCheckin() {
    const child = Store.activeChild();
    if (!child) return;
    const today = new Date().toDateString();
    if (child.stats.lastWatchDate === today) {
      App._alert('今天已经签到了，去看个视频吧'); return;
    }
    child.stats.consecutiveDays += 1;
    child.stats.lastWatchDate = today;
    Store.updateChild(Store.state.activeChildIndex, { stats: child.stats });
    PetLogic._checkUnlocks(child);
    Data.logOp('每日签到', `${child.name} 连续${child.stats.consecutiveDays}天`);
    // 签到给少量成长值
    const pet = PetLogic.getActivePet(child);
    if (pet) {
      pet.petGrowthValue = (pet.petGrowthValue || 0) + 2;
      Store.updateChild(Store.state.activeChildIndex, { pets: child.pets });
    }
    Sound.play('correct');
    this.render();
    // 简单庆祝
    const petArea = document.getElementById('player-pet');
    if (petArea) {
      petArea.classList.add('celebrate');
      setTimeout(() => petArea.classList.remove('celebrate'), 800);
    }
  },

  _renderLibrary() {
    const child = Store.activeChild();
    const ageGroup = child?.ageGroup || '3-6';
    const allVideos = Data.getAllVideos();
    const ageFiltered = allVideos.filter(v => v.ageGroup === ageGroup);
    const categories = Data.getAllCategories();
    let html = `
      <div class="home-section-title"><span class="icon">📖</span> 内容库 <span style="font-size:0.72rem;color:var(--muted);font-weight:400;">${child?.name || ''} · ${ageGroup}岁 · ${ageFiltered.length}个适合视频</span></div>
      <div style="display:flex;gap:0.4rem;margin-bottom:1rem;flex-wrap:wrap;">
        <span class="room-tab active" data-tv-focusable onclick="App.filterLibrary('all', this)">适合我</span>
        <span class="room-tab" data-tv-focusable onclick="App.filterLibrary('all-ages', this)">全部</span>
        ${categories.map(c => `<span class="room-tab" data-tv-focusable onclick="App.filterLibrary('${c}', this)">${c}</span>`).join('')}
      </div>
      <div class="video-grid" id="library-grid">
        ${ageFiltered.map(v => this._renderVideoCard(v)).join('')}
      </div>`;
    return html;
  },

  filterLibrary(cat, el) {
    const child = Store.activeChild();
    const ageGroup = child?.ageGroup || '3-6';
    document.querySelectorAll('.room-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    const allVideos = Data.getAllVideos();
    let filtered;
    if (cat === 'all') {
      filtered = allVideos.filter(v => v.ageGroup === ageGroup);
    } else if (cat === 'all-ages') {
      filtered = allVideos;
    } else {
      filtered = allVideos.filter(v => v.category === cat);
    }
    const grid = document.getElementById('library-grid');
    if (grid) { grid.innerHTML = filtered.map(v => this._renderVideoCard(v)).join(''); Remote.refresh(); }
  },

  _renderVideoCard(v) {
    const child = Store.activeChild();
    const watched = child?.history.find(h => h.videoId === v.id);
    return `<div class="video-card" data-tv-focusable onclick="App.playVideo('${v.id}')">
      <div class="thumb" style="background:linear-gradient(135deg, ${this._categoryColor(v.category)}, var(--bg2))">
        <span>${v.icon}</span>
        <span class="duration-tag">${Utils.formatTime(v.duration)}</span>
      </div>
      <div class="info">
        <div class="title">${v.title}</div>
        <div class="meta">${v.category} ${watched ? '· 已看' : ''}</div>
      </div>
    </div>`;
  },

  _categoryColor(cat) {
    const colors = { '自然科学': '#B3E5FC', '历史人文': '#FFE0B2', '数学思维': '#C8E6C9', '艺术审美': '#F8BBD0', '语言表达': '#D1C4E9' };
    return colors[cat] || '#E0E0E0';
  },

  // --- Player ---
  _renderPlayer() {
    const p = Store.state.player;
    const allVideos = Data.getAllVideos();
    const allQuizzes = Data.getAllQuizzes();
    const video = p.videoId ? allVideos.find(v => v.id === p.videoId) : null;
    const child = Store.activeChild();
    const remaining = child ? (child.controls.dailyLimit * 60 - child.stats.totalWatchTime) : 9999;
    const progress = video ? (p.elapsed / video.duration * 100) : 0;
    const stage = child ? PetLogic.getCurrentStage(child) : null;

    // 沉浸式场景色 — 根据视频分类生成
    const catColors = {
      '自然科学': ['#0D47A1', '#1565C0', '#1E88E5'],
      '历史人文': ['#4A148C', '#6A1B9A', '#8E24AA'],
      '数学思维': ['#004D40', '#00695C', '#00897B'],
      '艺术审美': ['#BF360C', '#D84315', '#E64A19'],
      '语言表达': ['#1B5E20', '#2E7D32', '#388E3C'],
      '生活常识': ['#E65100', '#EF6C00', '#F57C00']
    };
    const colors = catColors[video?.category] || ['#333', '#555', '#777'];

    return `<div class="player-container">
      <button class="player-back-btn" data-tv-focusable onclick="App.exitPlayer()">← 返回</button>
      <div class="player-video-area" style="background: linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]});">
        ${!video ? '<div class="empty-state"><span class="empty-icon">📺</span>选择一个视频开始观看</div>' : `
          <div class="player-scene-content">
            <div class="scene-main-icon">${video.icon}</div>
            <div class="scene-title">${video.title}</div>
            <div class="scene-desc">${video.desc}</div>
            ${p.isPlaying ? `<div class="scene-playing"><span class="playing-dot"></span> 正在播放</div>` : '<div class="scene-paused">已暂停</div>'}
          </div>
        `}
        ${stage ? `<div class="player-pet-area" id="player-pet" onclick="App.goToRoom()" data-tv-focusable title="去宠物家" style="cursor:pointer;">${renderPetIcon(stage.icon)}</div>` : ''}
      </div>
      ${video ? `
        <div class="player-progress" onclick="App.seekPlayer(event)">
          <div class="player-progress-bar" style="width:${Math.min(progress, 100)}%" id="progress-bar"></div>
        </div>
        <div class="player-controls">
          <button class="ctrl-btn" data-tv-focusable onclick="App.exitPlayer()">← 返回</button>
          <button class="ctrl-btn" data-tv-focusable onclick="App.wakeUpQuiz()" ${(!video || !allQuizzes[video.id] || p.quizShown.length >= allQuizzes[video.id].length) ? 'disabled style="opacity:0.3;pointer-events:none;"' : ''}>📝 ${(!video || !allQuizzes[video.id]) ? '无题目' : p.quizShown.length >= allQuizzes[video.id].length ? '已答完' : '答题'}</button>
          <span class="time-display">${Utils.formatTime(p.elapsed)} / ${Utils.formatTime(video.duration)}</span>
          <button class="ctrl-btn main-ctrl" data-tv-focusable onclick="App.togglePlay()">${p.isPlaying ? '⏸ 暂停' : '▶ 播放'}</button>
        </div>
        <div class="player-extra-info">
          <span>📂 ${video.category}</span>
          <span>👤 ${video.ageGroup}岁</span>
          <span>📡 ${video.source || ''}</span>
          <span>⏱ 剩余 ${Utils.formatMinutes(remaining)} 分钟</span>
        </div>
      ` : ''}
      ${Store.state.quiz.active ? this._renderQuizOverlay() : ''}
      ${Store.state.isSleeping ? this._showSleepOverlay() : ''}
    </div>`;
  },

  playVideo(videoId) {
    const child = Store.activeChild();
    if (!child) return;
    const ctrl = child.controls || {};

    // 暂停状态检查
    if (ctrl.paused) { App._alert('家长已暂停使用，请稍后再来～'); return; }

    // 时段管控检查
    if (ctrl.allowedSlots && ctrl.allowedSlots.length > 0) {
      const currentHour = new Date().getHours();
      if (!ctrl.allowedSlots.includes(currentHour)) {
        App._alert('现在不是学习时间哦，等会儿再来吧！'); return;
      }
    }

    // 时长限制检查
    const remaining = ctrl.dailyLimit * 60 - child.stats.totalWatchTime;
    if (remaining <= 0) { App._alert('今天的观看时间已经用完啦，明天再来找小伙伴玩吧！'); return; }

    // 睡眠模式检查
    if (Store.state.isSleeping) return;

    Store.set({
      currentScreen: 'player',
      player: { videoId, elapsed: 0, isPlaying: true, quizShown: [], isAFK: false, afkTimer: null }
    });
    Router._history.push('video-feed');
    this.render();
    Data.trackEvent('video_start', { videoId, childName: child?.name, ageGroup: child?.ageGroup });
    this._startPlayback();
  },

  _startPlayback() {
    if (this.playerTimer) clearInterval(this.playerTimer);
    this.playerTimer = setInterval(() => {
      const p = Store.state.player;
      const allVideos = Data.getAllVideos();
      const video = allVideos.find(v => v.id === p.videoId);
      if (!video || !p.isPlaying) return;

      p.elapsed += 1;
      Store.set({ player: p });

      // Update progress bar
      const bar = document.getElementById('progress-bar');
      if (bar) bar.style.width = Math.min(p.elapsed / video.duration * 100, 100) + '%';
      // Update time display
      const timeDisplay = document.querySelector('.time-display');
      if (timeDisplay) timeDisplay.textContent = `${Utils.formatTime(p.elapsed)} / ${Utils.formatTime(video.duration)}`;

      // Check quiz triggers (at 1/3 and 2/3)
      const allQuizzes = Data.getAllQuizzes();
      const quizzes = allQuizzes[p.videoId] || [];
      const trigger1 = Math.floor(video.duration / 3);
      const trigger2 = Math.floor(video.duration * 2 / 3);
      if (quizzes.length > 0 && p.elapsed === trigger1 && !p.quizShown.includes(0)) {
        this._showQuiz(0);
      } else if (quizzes.length > 1 && p.elapsed === trigger2 && !p.quizShown.includes(1)) {
        this._showQuiz(1);
      }

      // Check continuous watch time (30 min rest reminder)
      const continuousWatch = p.elapsed;
      if (continuousWatch > 0 && !p._restRemindedAt30 && continuousWatch >= 1800) {
        p._restRemindedAt30 = true;
        this._showRestReminder();
      }
      if (continuousWatch > 0 && !p._restRemindedAt60 && continuousWatch >= 3600) {
        p._restRemindedAt60 = true;
        this._showRestReminder();
      }

      // Check time limit
      const child = Store.activeChild();
      if (child && child.stats.totalWatchTime >= child.controls.dailyLimit * 60) {
        this._stopPlayback();
        this._showTimeLimitOverlay();
        return;
      }

      // Check video end
      if (p.elapsed >= video.duration) {
        this._stopPlayback();
        this._petCelebrate();
        // 自动播放下一个视频
        setTimeout(() => this.playNextVideo(), 2500);
        return;
      }
    }, 1000);
  },

  _stopPlayback() {
    const child = Store.activeChild();
    const p = Store.state.player;
    Data.trackEvent('video_end', { videoId: p.videoId, duration: p.elapsed, childName: child?.name });
    if (this.playerTimer) { clearInterval(this.playerTimer); this.playerTimer = null; }
    if (p.videoId) {
      const prevDur = Store.activeChild()?.history.find(h => h.videoId === p.videoId)?.duration || 0;
      PetLogic.addWatchTime(Math.max(0, p.elapsed - prevDur), true);
      const child = Store.activeChild();
      if (child) {
        const existing = child.history.findIndex(h => h.videoId === p.videoId);
        const record = { videoId: p.videoId, duration: p.elapsed, timestamp: Date.now(), quizzesTaken: p.quizShown.length };
        if (existing >= 0) child.history[existing] = record;
        else child.history.unshift(record);
        if (child.history.length > 50) child.history = child.history.slice(0, 50);
        Store.updateChild(Store.state.activeChildIndex, { history: child.history });
      }
    }
  },

  _showRestReminder() {
    this._showModal('该休息一下啦', `<div style="text-align:center;padding:1rem;">
        <div style="font-size:3rem;margin-bottom:0.5rem;">😴</div>
        <p>已经连续观看30分钟了</p>
        <p style="color:var(--muted);font-size:0.85rem;margin-top:0.3rem;">宠物小伙伴也累了，休息一会儿眼睛吧</p>
      </div>`, () => { this._closeModal(); }, '知道了', false);
  },

  togglePlay() {
    const p = Store.state.player;
    p.isPlaying = !p.isPlaying;
    Store.set({ player: p });
    this.render();
    if (p.isPlaying) this._startPlayback();
  },

  seekRelative(delta) {
    const p = Store.state.player;
    const allVideos = Data.getAllVideos();
    const video = allVideos.find(v => v.id === p.videoId);
    if (!video) return;
    p.elapsed = Math.max(0, Math.min(video.duration, p.elapsed + delta));
    Store.set({ player: p });
    this.render();
    if (p.isPlaying) this._startPlayback();
  },

  seekPlayer(event) {
    const bar = event.currentTarget;
    const allVideos = Data.getAllVideos();
    const video = allVideos.find(v => v.id === Store.state.player.videoId);
    if (!video) return;
    const ratio = event.offsetX / bar.offsetWidth;
    Store.state.player.elapsed = Math.floor(video.duration * ratio);
    Store.set({ player: Store.state.player });
    this.render();
  },

  exitPlayer() {
    this._stopPlayback();
    Store.set({ player: { videoId: null, elapsed: 0, isPlaying: false, quizShown: [], isAFK: false, afkTimer: null } });
    Router.navigate('video-feed');
  },

  startVideoSession() {
    const videos = this._getFeedVideos();
    const idx = Math.min(this._videoFeedIndex, videos.length - 1);
    if (videos.length > 0) {
      this.playVideo(videos[idx].id);
    }
  },

  playNextVideo() {
    const videos = this._getFeedVideos();
    if (this._videoFeedIndex < videos.length - 1) {
      this._videoFeedIndex++;
    } else {
      this._videoFeedIndex = 0;
    }
    const videos2 = this._getFeedVideos();
    if (videos2.length > 0) {
      const idx = Math.min(this._videoFeedIndex, videos2.length - 1);
      this.playVideo(videos2[idx].id);
    }
  },

  _showTimeLimitOverlay() {
    const container = document.querySelector('.player-container');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'player-time-limit-overlay';
    div.innerHTML = `<div class="limit-icon">😴</div><div class="limit-text">今天看够啦</div><div class="limit-sub">明天再来找小伙伴玩吧</div>`;
    container.appendChild(div);
    setTimeout(() => this.exitPlayer(), 4000);
  },

  _showSleepOverlay() {
    const container = document.querySelector('.player-container');
    if (!container) return;
    if (container.querySelector('.player-sleep-overlay')) return;
    const div = document.createElement('div');
    div.className = 'player-sleep-overlay';
    div.innerHTML = `<div class="sleep-pet">💤</div><div class="sleep-text">该睡觉啦，明天再来找小伙伴玩</div><div class="zzz">💤</div>`;
    container.appendChild(div);
  },

  // --- Quiz ---
  _showQuiz(index) {
    const p = Store.state.player;
    const allQuizzes = Data.getAllQuizzes();
    const quizzes = allQuizzes[p.videoId];
    if (!quizzes || !quizzes[index]) return;
    p.quizShown.push(index);
    p.isPlaying = false;
    Store.set({
      player: p,
      quiz: { active: true, videoId: p.videoId, questionIndex: index, selectedIndex: -1, answered: false, showFeedback: false }
    });
    this.render();
  },

  _renderQuizOverlay() {
    const q = Store.state.quiz;
    let quiz = null;
    let sourceTitle = '';

    if (q.isParentQuiz) {
      quiz = Data.getParentQuizById(q.parentQuizId);
      sourceTitle = '家长出题';
    } else {
      const allQuizzes = Data.getAllQuizzes();
      const quizzes = allQuizzes[q.videoId];
      quiz = quizzes ? quizzes[q.questionIndex] : null;
      const allVideos = Data.getAllVideos();
      sourceTitle = allVideos.find(v => v.id === q.videoId)?.title || '';
    }

    if (!quiz) return '';

    const child = Store.activeChild();
    const ageGroup = child ? child.ageGroup : '7-9';

    if (q.showFeedback) {
      let isCorrect = false;
      if (quiz.type === 'fillblank') {
        isCorrect = q.fillAnswer && quiz.answerText && q.fillAnswer.trim().toLowerCase() === quiz.answerText.trim().toLowerCase();
      } else if (quiz.type === 'multichoice') {
        const selected = (q.selectedIndices || []).sort((a, b) => a - b);
        const correct = (quiz.answer || []).sort((a, b) => a - b);
        isCorrect = selected.length === correct.length && selected.every((v, i) => v === correct[i]);
      } else if (quiz.type === 'sort') {
        const current = q.sortOrder || quiz.options.map((_, i) => i);
        isCorrect = current.every((v, i) => v === quiz.answer[i]);
      } else {
        isCorrect = q.selectedIndex === quiz.answer;
      }
      let correctAnswerText = '';
      if (!isCorrect) {
        if (quiz.type === 'fillblank') {
          correctAnswerText = '正确答案是：' + quiz.answerText;
        } else if (quiz.type === 'multichoice') {
          correctAnswerText = '正确答案是：' + (quiz.answer || []).map(i => quiz.options[i]).join('、');
        } else if (quiz.type === 'sort') {
          correctAnswerText = '正确顺序是：' + (quiz.answer || []).map(i => quiz.options[i]).join(' → ');
        } else {
          correctAnswerText = '正确答案是：' + quiz.options[quiz.answer];
        }
      }
      return `<div class="quiz-overlay">
        <div class="quiz-feedback ${isCorrect ? 'correct' : 'wrong'}">
          <div class="fb-icon">${isCorrect ? '🎉' : '💡'}</div>
          <div class="fb-text">${isCorrect ? '答对啦！成长值 +' + (PetLogic._quizReward || 3) : '没关系，记住啦'}</div>
          <div class="fb-detail">${correctAnswerText}</div>
        </div>
        ${isCorrect ? '<canvas id="confetti-canvas" class="confetti-canvas"></canvas>' : ''}
      </div>`;
    }

    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    // 自动语音朗读题目
    setTimeout(() => PetLogic.speak(quiz.question), 300);

    let optionsHtml = '';
    if (quiz.type === 'multichoice') {
      // 10-12岁多选题
      optionsHtml = quiz.options.map((opt, i) => `
        <div class="quiz-option ${(q.selectedIndices || []).includes(i) ? 'selected' : ''} ${q.answered ? 'disabled' : ''}"
             data-tv-focusable onclick="App.toggleMultiOption(${i})">
          <span class="opt-idx">${(q.selectedIndices || []).includes(i) ? '☑️' : '⬜'}</span>
          <span>${opt}</span>
        </div>
      `).join('') + '<div style="font-size:0.72rem;color:var(--accent);text-align:center;margin-top:0.4rem;">💡 请选择所有正确答案</div>';
    } else if (quiz.type === 'sort') {
      // 10-12岁排序题
      optionsHtml = `<div class="sort-quiz-container" style="margin-top:1rem;">
        ${(q.sortOrder || quiz.options.map((_, i) => i)).map((idx, pos) => `
          <div class="sort-item ${q.answered ? 'disabled' : ''}" data-tv-focusable onclick="App.moveSortItem(${pos})">
            <span class="sort-pos">${pos + 1}</span>
            <span>${quiz.options[idx]}</span>
          </div>
        `).join('')}
        <div style="font-size:0.75rem;color:var(--muted);text-align:center;margin-top:0.5rem;">点击可向上移动，最后一项可向下移动</div>
      </div>`;
    } else if (quiz.type === 'fillblank') {
      optionsHtml = `
        <div class="form-group" style="margin-top:1rem;">
          <input type="text" id="quiz-fill-input" class="pq-input" placeholder="请输入答案..."
            value="${q.fillAnswer || ''}" oninput="App.updateFillAnswer(this.value)"
            style="font-size:1rem;padding:0.8rem 1rem;text-align:center;"
            data-tv-focusable>
        </div>`;
    } else if (quiz.type === 'truefalse') {
      optionsHtml = `
        <div class="pq-tf-group" style="margin-top:1rem;justify-content:center;">
          <button class="pq-tf-btn ${q.selectedIndex === 1 ? 'selected' : ''}" onclick="App.selectQuizOption(1)" data-tv-focusable>✅ 正确</button>
          <button class="pq-tf-btn ${q.selectedIndex === 0 ? 'selected' : ''}" onclick="App.selectQuizOption(0)" data-tv-focusable>❌ 错误</button>
        </div>`;
    } else {
      // 普通选择题（支持3-6岁大图标）
      const isYoung = ageGroup === '3-6';
      const displayOptions = isYoung && quiz.options.length > 2 ? quiz.options.slice(0, 2) : quiz.options;
      optionsHtml = displayOptions.map((opt, i) => `
        <div class="quiz-option ${q.selectedIndex === i ? 'selected' : ''} ${q.answered ? 'disabled' : ''} ${isYoung ? 'young-option' : ''}"
             data-tv-focusable onclick="App.selectQuizOption(${i})">
          <span class="opt-idx">${labels[i]}</span>
          <span>${opt}</span>
        </div>
      `).join('');
    }

    let canSubmit = false;
    if (quiz.type === 'fillblank') {
      canSubmit = q.fillAnswer && q.fillAnswer.trim().length > 0;
    } else if (quiz.type === 'multichoice') {
      canSubmit = (q.selectedIndices || []).length > 0;
    } else if (quiz.type === 'sort') {
      canSubmit = true; // 排序题随时可以提交
    } else {
      canSubmit = q.selectedIndex >= 0;
    }

    return `<div class="quiz-overlay">
      <div class="quiz-card">
        <div class="quiz-source">来自：${sourceTitle}</div>
        <div class="quiz-question">
          <span>${quiz.question}</span>
          <button class="quiz-speak-btn" onclick="PetLogic.speak('${quiz.question.replace(/'/g, "\\'")}')" title="读题">🔊</button>
        </div>
        ${optionsHtml}
        <div class="quiz-actions">
          <button class="btn-primary" onclick="App.submitQuiz()" data-tv-focusable ${!canSubmit ? 'disabled style="opacity:0.4;pointer-events:none;"' : ''}>提交答案</button>
        </div>
        <div class="quiz-hint">${quiz.type === 'fillblank' ? '输入答案后点击提交' : '↑↓ 选择选项，确认键提交'}</div>
      </div>
    </div>`;
  },

  selectQuizOption(index) {
    if (Store.state.quiz.answered) return;
    Store.state.quiz.selectedIndex = index;
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  toggleMultiOption(index) {
    if (Store.state.quiz.answered) return;
    const q = Store.state.quiz;
    const indices = q.selectedIndices || [];
    const pos = indices.indexOf(index);
    if (pos >= 0) {
      indices.splice(pos, 1);
    } else {
      indices.push(index);
    }
    Store.set({ quiz: { ...q, selectedIndices: indices } });
    this.render();
  },

  moveSortItem(position) {
    if (Store.state.quiz.answered) return;
    const q = Store.state.quiz;
    const quiz = Data.getAllQuizzes()[q.videoId][q.questionIndex];
    const order = q.sortOrder || quiz.options.map((_, i) => i);
    const len = order.length;
    // Click top half = move up, bottom half = move down
    if (position < len / 2 || position === 0) {
      // Move up
      if (position > 0) {
        [order[position], order[position - 1]] = [order[position - 1], order[position]];
      }
    } else {
      // Move down
      if (position < len - 1) {
        [order[position], order[position + 1]] = [order[position + 1], order[position]];
      }
    }
    Store.set({ quiz: { ...q, sortOrder: order } });
    this.render();
  },

  updateFillAnswer(value) {
    Store.state.quiz.fillAnswer = value;
  },

  submitQuiz() {
    const q = Store.state.quiz;
    if (q.answered) return;

    let quiz = null;
    if (q.isParentQuiz) {
      quiz = Data.getParentQuizById(q.parentQuizId);
    } else {
      const allQuizzes = Data.getAllQuizzes();
      const quizzes = allQuizzes[q.videoId];
      quiz = quizzes ? quizzes[q.questionIndex] : null;
    }
    if (!quiz) return;

    let isCorrect = false;
    if (quiz.type === 'fillblank') {
      isCorrect = q.fillAnswer && quiz.answerText && q.fillAnswer.trim() === quiz.answerText.trim();
    } else if (quiz.type === 'multichoice') {
      const selected = (q.selectedIndices || []).sort((a, b) => a - b);
      const correct = (quiz.answer || []).sort((a, b) => a - b);
      isCorrect = selected.length === correct.length && selected.every((v, i) => v === correct[i]);
    } else if (quiz.type === 'sort') {
      const current = q.sortOrder || quiz.options.map((_, i) => i);
      isCorrect = current.every((v, i) => v === quiz.answer[i]);
    } else {
      if (q.selectedIndex < 0) return;
      isCorrect = q.selectedIndex === quiz.answer;
    }

    q.answered = true;
    Data.trackEvent('quiz_submit', { videoId: q.videoId, correct: isCorrect, questionIndex: q.questionIndex, type: quiz.type });
    q.showFeedback = true;
    Store.set({ quiz: q });
    PetLogic.recordQuiz(isCorrect);
    this.render();

    // 答对触发 confetti
    if (isCorrect) {
      setTimeout(() => this._launchConfetti(), 100);
    }

    // Check for stage change
    const child = Store.activeChild();
    const activePet = PetLogic.getActivePet(child);
    const oldStage = this._lastStage;
    const newStage = PetLogic.getCurrentStage(child);
    if (oldStage && newStage && oldStage.name !== newStage.name) {
      setTimeout(() => this._showStageChange(newStage.icon, `${newStage.name}！`, `${activePet.variety}成长了`), 1500);
    }
    this._lastStage = newStage;

    // Auto dismiss
    setTimeout(() => {
      q.active = false;
      q.showFeedback = false;
      q.fillAnswer = '';
      if (!q.isParentQuiz && Store.state.player.videoId) {
        Store.state.player.isPlaying = true;
        Store.set({ quiz: q, player: Store.state.player });
        this.render();
        this._startPlayback();
      } else {
        Store.set({ quiz: q });
        this.render();
      }
    }, 2200);
  },

  cancelQuiz() {
    Store.set({ quiz: { active: false, videoId: null, questionIndex: 0, selectedIndex: -1, answered: false, showFeedback: false, isParentQuiz: false, parentQuizId: null, fillAnswer: '' } });
    if (Store.state.player.videoId) {
      Store.state.player.isPlaying = true;
      Store.set({ player: Store.state.player });
      this._startPlayback();
    }
    this.render();
  },

  // --- Pet Room (Three.js) ---
  _lastRenderedBg: null,

  _renderRoom() {
    const child = Store.activeChild();
    if (!child || !PetLogic.getActivePet(child)) return '<div class="empty-state"><span class="empty-icon">🏡</span>还没有宠物，快去领养一个吧</div>';

    const tab = this._currentRoomTab || 'bg';
    const items = tab === 'bg' ? Data.rooms.backgrounds : tab === 'furniture' ? Data.rooms.furniture : Data.rooms.costumes;

    // Background changed → re-init 3D scene after render
    if (this._lastRenderedBg && this._lastRenderedBg !== child.room.bg) {
      setTimeout(() => { this._destroyRoom3D(); this._initRoom3D(); }, 80);
    }
    this._lastRenderedBg = child.room.bg;

    return `
      <button class="room-back" data-tv-focusable onclick="App.exitRoom()">← 返回</button>
      <div class="room-display" id="room-3d-container">
        <div class="room-loading" id="room-loading"><div class="loading-pet">🐾</div><span>小窝加载中...</span></div>
        <canvas id="room-3d-canvas"></canvas>
        <div class="room-pet-name" id="room-pet-name"></div>
      </div>
      <div class="room-panel">
        <div class="room-tabs">
          <span class="room-tab ${tab === 'bg' ? 'active' : ''}" data-tv-focusable onclick="App.switchRoomTab('bg', this)">🌈 背景</span>
          <span class="room-tab ${tab === 'furniture' ? 'active' : ''}" data-tv-focusable onclick="App.switchRoomTab('furniture', this)">🪑 家具</span>
          <span class="room-tab ${tab === 'costume' ? 'active' : ''}" data-tv-focusable onclick="App.switchRoomTab('costume', this)">👗 服饰</span>
        </div>
        <div class="room-items" id="room-items-container">
          ${items.map(b => this._renderRoomItem(b, child, tab)).join('')}
        </div>
        <div class="room-disclaimer">🎀 装扮仅用于学习激励，不可交易或转让哦～</div>
        <button class="btn-secondary" onclick="App.adoptNewPet()" data-tv-focusable style="width:100%;margin-top:0.6rem;font-size:0.82rem;">🐾 领养新宠物</button>
      </div>`;
  },

  _room3D: { scene: null, camera: null, renderer: null, petGroup: null, animId: null, mixer: null },

  _initRoom3D() {
    const canvas = document.getElementById('room-3d-canvas');
    if (!canvas) return;

    this._destroyRoom3D();
    const child = Store.activeChild();
    if (!child) return;
    const activePet = PetLogic.getActivePet(child);
    if (!activePet) return;

    const container = document.getElementById('room-3d-container');
    if (!container) return;

    // Update pet name label
    const nameEl = document.getElementById('room-pet-name');
    if (nameEl) nameEl.textContent = activePet.variety;

    // Hide loading
    const loading = document.getElementById('room-loading');
    if (loading) loading.style.display = 'none';

    // Check Three.js availability
    if (typeof THREE === 'undefined') {
      this._showFallbackRoom(activePet, child);
      return;
    }

    try {
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 400;
      if (w === 0 || h === 0) {
        this._showFallbackRoom(activePet, child);
        return;
      }

      // Scene
      const scene = new THREE.Scene();
      const bgColors = this._getRoomBgColors(child.room.bg);
      scene.background = new THREE.Color(bgColors.sky);
      scene.fog = new THREE.Fog(bgColors.fog || bgColors.sky, 8, 25);

      // Camera
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
      camera.position.set(0, 2.5, 6);
      camera.lookAt(0, 1, 0);

      // Renderer
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
      renderer.setSize(w, h);
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = false;

      // Lights
      const ambient = new THREE.AmbientLight(bgColors.ambient || 0xffffff, 0.7);
      scene.add(ambient);
      const dirLight = new THREE.DirectionalLight(bgColors.dirColor || 0xfff5e6, 1.2);
      dirLight.position.set(3, 8, 5);
      scene.add(dirLight);
      const hemi = new THREE.HemisphereLight(bgColors.sky, bgColors.ground, 0.5);
      scene.add(hemi);

      // SpotLight from above targeting pet
      const spotLight = new THREE.SpotLight(bgColors.dirColor || 0xfff5e6, 0.6, 10, Math.PI / 6, 0.5);
      spotLight.position.set(0, 5, 2);
      spotLight.target.position.set(0, 0.8, 0);
      scene.add(spotLight);
      scene.add(spotLight.target);

      // Ground
      const groundGeo = new THREE.CircleGeometry(12, 32);
      const groundMat = new THREE.MeshStandardMaterial({ color: bgColors.ground, roughness: 0.9 });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      scene.add(ground);

      // Pet model based on type
      const petGroup = this._buildPetModel(activePet.typeId, activePet.variety, child.room.costumes);
      petGroup.position.set(0, 0, 0);
      scene.add(petGroup);

      // Furniture decorations
      this._buildFurniture(scene, child.room.furniture);

      // Floating particles
      this._buildParticles(scene);

      // Stars / fireflies / ocean ripples
      this._buildStars(scene, child.room.bg);

      // Ground decorations (flowers, mushrooms, stones)
      this._buildGroundDecor(scene, child.room.bg);

      // Ground aura ring under pet
      const auraGeo = new THREE.RingGeometry(0.6, 0.7, 32);
      const auraMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
      });
      const aura = new THREE.Mesh(auraGeo, auraMat);
      aura.rotation.x = -Math.PI / 2;
      aura.position.set(0, 0.02, 0);
      aura.userData.isAura = true;
      scene.add(aura);

      // Store refs
      this._room3D = { scene, camera, renderer, petGroup, animId: null };

      // Animation loop
      const clock = new THREE.Clock();
      let lastBlinkTime = 0;
      let isBlinking = false;
      let blinkEndTime = 0;
      const blinkInterval = 3 + Math.random() * 2; // 3-5 seconds
      const typeId = activePet.typeId;

      // Cache eye references for blink animation
      const eyeMeshes = [];
      petGroup.traverse(child => {
        if (child.isMesh && child.geometry &&
            child.geometry.parameters &&
            child.geometry.parameters.radius === 0.08 &&
            child.position.y >= 1.0) {
          eyeMeshes.push(child);
        }
        // Also capture amphibian eye blacks (radius 0.09)
        if (child.isMesh && child.geometry &&
            child.geometry.parameters &&
            child.geometry.parameters.radius === 0.09) {
          eyeMeshes.push(child);
        }
      });

      // Cache wing references for egg type flapping
      const wingMeshes = [];
      if (typeId === 'egg') {
        petGroup.traverse(child => {
          if (child.isMesh && child.geometry &&
              child.geometry.parameters &&
              child.geometry.parameters.radius === 0.35) {
            wingMeshes.push(child);
          }
        });
      }

      const animate = () => {
        if (!this._room3D || !this._room3D.petGroup) return;
        this._room3D.animId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Pet breathing
        const s = 1 + Math.sin(t * 2.5) * 0.03;
        petGroup.scale.set(1, s, 1);

        // Pet floating
        petGroup.position.y = Math.sin(t * 1.2) * 0.08;

        // Gentle rotation
        petGroup.rotation.y = Math.sin(t * 0.3) * 0.15;

        // Plant swaying (seed type only)
        if (typeId === 'seed') {
          petGroup.rotation.z = Math.sin(t * 1.5) * 0.05;
        }

        // Pet blink effect
        if (!isBlinking && (t - lastBlinkTime) > blinkInterval + Math.sin(t * 0.1) * 0.5) {
          isBlinking = true;
          blinkEndTime = t + 0.15;
          lastBlinkTime = t;
        }
        if (isBlinking) {
          if (t < blinkEndTime) {
            eyeMeshes.forEach(eye => { eye.scale.y = 0.1; });
          } else {
            eyeMeshes.forEach(eye => { eye.scale.y = 1; });
            isBlinking = false;
          }
        }

        // Wing flapping (egg type only)
        if (typeId === 'egg' && wingMeshes.length >= 2) {
          const flapAngle = Math.sin(t * Math.PI * 1.6) * 0.3; // ~0.8Hz
          wingMeshes[0].rotation.z = flapAngle;
          wingMeshes[1].rotation.z = -flapAngle;
        }

        // Decorative animations
        scene.children.forEach(c => {
          if (c.userData && c.userData.isParticle) {
            c.position.y += Math.sin(t * 0.8 + c.userData.offset) * 0.002;
            c.rotation.y += 0.005;
          }
          if (c.userData && c.userData.isAura) {
            const auraScale = 1 + Math.sin(t * 1.8) * 0.15;
            c.scale.set(auraScale, auraScale, auraScale);
            c.material.opacity = 0.25 + Math.sin(t * 1.8) * 0.1;
          }
          if (c.userData && c.userData.isDecoration && c.userData.fireflyBasePos) {
            const bp = c.userData.fireflyBasePos;
            c.position.x = bp.x + Math.sin(t * 0.5 + c.userData.fireflyOffset) * 0.3;
            c.position.y = bp.y + Math.sin(t * 0.8 + c.userData.fireflyOffset) * 0.2;
            c.position.z = bp.z + Math.cos(t * 0.6 + c.userData.fireflyOffset) * 0.3;
          }
          if (c.userData && c.userData.isDecoration && c.userData.twinkleOffset !== undefined && !c.userData.fireflyBasePos && !c.userData.isRipple && !c.userData.isShootingStar && !c.userData.isFish && !c.userData.isBubble && !c.userData.isButterfly) {
            const twinkle = 0.5 + Math.sin(t * 2 + c.userData.twinkleOffset) * 0.5;
            if (c.material && c.material.opacity !== undefined) c.material.opacity = twinkle;
            if (c.material && c.material.emissiveIntensity !== undefined) c.material.emissiveIntensity = 0.3 + twinkle * 0.5;
          }
          if (c.userData && c.userData.isRipple) {
            const phase = (t + c.userData.ripplePhase) % 4;
            const rippleScale = 1 + phase * 1.5;
            c.scale.set(rippleScale, rippleScale, 1);
            c.material.opacity = Math.max(0, 0.3 - phase * 0.08);
          }
          // Butterfly flutter
          if (c.userData && c.userData.isButterfly) {
            c.position.y += Math.sin(t * 2 + c.userData.bfOffset) * 0.003;
            c.position.x += Math.sin(t * 0.3 + c.userData.bfOffset) * 0.005;
            c.rotation.y = Math.sin(t * 0.5 + c.userData.bfOffset) * 0.5;
            // Wing flap
            c.children.forEach((wing, wi) => {
              wing.rotation.y = Math.sin(t * 8 + c.userData.bfOffset + wi) * 0.6;
            });
          }
          // Fish swim
          if (c.userData && c.userData.isFish) {
            c.position.x += Math.sin(t * c.userData.fishSpeed + c.userData.fishPhase) * 0.008;
            c.position.y += Math.sin(t * 0.5 + c.userData.fishPhase) * 0.002;
            c.rotation.y = Math.sin(t * c.userData.fishSpeed + c.userData.fishPhase) > 0 ? 0 : Math.PI;
          }
          // Bubble rise
          if (c.userData && c.userData.isBubble) {
            c.position.y += c.userData.bubbleSpeed * 0.003;
            c.position.x += Math.sin(t * 2 + c.userData.bubbleBaseY) * 0.001;
            if (c.position.y > 4) c.position.y = c.userData.bubbleBaseY;
          }
          // Shooting star streak
          if (c.userData && c.userData.isShootingStar) {
            const sp = ((t * 0.5 + c.userData.starPhase) % 8);
            c.position.x = -4 + sp * 2;
            c.position.y = 5 + Math.sin(sp) * 0.5;
            c.material.opacity = sp < 0.5 ? sp * 2 : (sp > 6 ? (8 - sp) * 0.5 : 0.6);
          }
        });

        // Camera slow orbit around center
        camera.position.x = 6 * Math.sin(t * 0.15);
        camera.position.z = 6 * Math.cos(t * 0.15);
        camera.position.y = 2.5;
        camera.lookAt(0, 1, 0);

        renderer.render(scene, camera);
      };
      animate();

      // Resize handler
      const onResize = () => {
        if (!this._room3D || !this._room3D.camera || !container) return;
        const nw = container.clientWidth || 800;
        const nh = container.clientHeight || 400;
        if (nw === 0 || nh === 0) return;
        this._room3D.camera.aspect = nw / nh;
        this._room3D.camera.updateProjectionMatrix();
        this._room3D.renderer.setSize(nw, nh);
      };
      this._room3D._resizeHandler = onResize;
      window.addEventListener('resize', onResize);
    } catch (e) {
      console.warn('Three.js init failed, falling back to 2D:', e);
      this._showFallbackRoom(activePet, child);
    }
  },

  _showFallbackRoom(activePet, child) {
    const container = document.getElementById('room-3d-container');
    if (!container) return;
    const bgColors = this._getRoomBgColors(child.room.bg);
    const toHex = (n) => '#' + n.toString(16).padStart(6, '0');
    const skyHex = typeof THREE !== 'undefined' ? '#' + new THREE.Color(bgColors.sky).getHexString() : toHex(bgColors.sky);
    const groundHex = typeof THREE !== 'undefined' ? '#' + new THREE.Color(bgColors.ground).getHexString() : toHex(bgColors.ground);
    container.style.background = `radial-gradient(circle at 50% 30%, ${skyHex}, ${groundHex})`;
    const stage = PetLogic.getCurrentStage(child);
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:1rem;position:relative;z-index:2;">
        <div style="font-size:5rem;animation:petBreath 3s ease-in-out infinite;filter:drop-shadow(0 8px 16px rgba(0,0,0,0.3));">${stage ? stage.icon : '🐾'}</div>
        <div style="color:#fff;font-size:1.1rem;font-weight:600;text-shadow:0 2px 8px rgba(0,0,0,0.5);">${activePet.variety}</div>
        <div style="color:rgba(255,255,255,0.6);font-size:0.8rem;">✨ 小窝正在搭建中...</div>
      </div>
      <div style="position:absolute;inset:0;overflow:hidden;pointer-events:none;">
        ${Array.from({length:12}).map((_,i)=>`<div style="position:absolute;left:${Math.random()*100}%;top:${Math.random()*100}%;font-size:${0.5+Math.random()}rem;opacity:${0.3+Math.random()*0.4};animation:floatUp ${2+Math.random()*3}s ease-in-out infinite;animation-delay:${Math.random()*2}s;">✨</div>`).join('')}
      </div>
    `;
  },

  _destroyRoom3D() {
    if (this._room3D.animId) {
      cancelAnimationFrame(this._room3D.animId);
      this._room3D.animId = null;
    }
    if (this._room3D._resizeHandler) {
      window.removeEventListener('resize', this._room3D._resizeHandler);
    }
    if (this._room3D.renderer) {
      this._room3D.renderer.dispose();
    }
    this._room3D = { scene: null, camera: null, renderer: null, petGroup: null, animId: null };
  },

  _getRoomBgColors(bgId) {
    const map = {
      'bg-star':   { sky: 0x0B0E2D, ground: 0x1A1B4B, fog: 0x0B0E2D, ambient: 0x6666AA, dirColor: 0xCCBBFF },
      'bg-forest': { sky: 0x1B4332, ground: 0x2D6A4F, fog: 0x1B4332, ambient: 0x558866, dirColor: 0xAAEECC },
      'bg-study':  { sky: 0x3E2723, ground: 0x5D4037, fog: 0x3E2723, ambient: 0xAA8866, dirColor: 0xFFDDAA },
      'bg-ocean':  { sky: 0x01579B, ground: 0x0288D1, fog: 0x01579B, ambient: 0x4488BB, dirColor: 0x88CCEE },
      'bg-garden': { sky: 0xF8BBD0, ground: 0xC8E6C9, fog: 0xF8BBD0, ambient: 0xDDAACC, dirColor: 0xFFDDEE },
      'bg-desert': { sky: 0xE65100, ground: 0xFF8F00, fog: 0xE65100, ambient: 0xDD9944, dirColor: 0xFFCC66 },
      'bg-space':  { sky: 0x000022, ground: 0x0D0D3B, fog: 0x000022, ambient: 0x4444AA, dirColor: 0x8888FF },
    };
    return map[bgId] || { sky: 0xB3E5FC, ground: 0xC8E6C9, fog: 0xB3E5FC, ambient: 0x999999, dirColor: 0xFFFFFF };
  },

  _buildPetModel(typeId, variety, costumes) {
    const g = new THREE.Group();

    if (typeId === 'egg') {
      // Bird-like: yellow sphere body + small wings + beak
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xFFD54F, roughness: 0.5 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 32), bodyMat);
      body.position.y = 0.8;
      body.castShadow = true;
      g.add(body);
      // Wings
      const wingGeo = new THREE.SphereGeometry(0.35, 16, 16);
      wingGeo.scale(1, 0.3, 0.6);
      const wingMat = new THREE.MeshStandardMaterial({ color: 0xFFCA28 });
      const lw = new THREE.Mesh(wingGeo, wingMat); lw.position.set(-0.55, 0.9, 0); g.add(lw);
      const rw = new THREE.Mesh(wingGeo, wingMat); rw.position.set(0.55, 0.9, 0); g.add(rw);
      // Eyes
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      const le = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat); le.position.set(-0.18, 1.05, 0.48); g.add(le);
      const re = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat); re.position.set(0.18, 1.05, 0.48); g.add(re);
      // Beak
      const beakMat = new THREE.MeshStandardMaterial({ color: 0xFF6F00 });
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 8), beakMat);
      beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.95, 0.62); g.add(beak);
      // Feet
      const footMat = new THREE.MeshStandardMaterial({ color: 0xFF8F00 });
      const lf = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.15), footMat); lf.position.set(-0.15, 0.08, 0); g.add(lf);
      const rf = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.15), footMat); rf.position.set(0.15, 0.08, 0); g.add(rf);
    } else if (typeId === 'amphibian') {
      // Frog-like: green body + big eyes + legs
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x66BB6A, roughness: 0.6 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 32), bodyMat);
      body.scale.set(1, 0.75, 1);
      body.position.y = 0.55;
      body.castShadow = true;
      g.add(body);
      // Eyes (big bulging)
      const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const eyeBlack = new THREE.MeshStandardMaterial({ color: 0x222222 });
      const lew = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), eyeWhite); lew.position.set(-0.22, 0.95, 0.35); g.add(lew);
      const rew = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), eyeWhite); rew.position.set(0.22, 0.95, 0.35); g.add(rew);
      const leb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), eyeBlack); leb.position.set(-0.22, 0.98, 0.48); g.add(leb);
      const reb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), eyeBlack); reb.position.set(0.22, 0.98, 0.48); g.add(reb);
      // Legs
      const legMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
      const ll = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.4), legMat); ll.position.set(-0.4, 0.2, 0); ll.rotation.z = 0.3; g.add(ll);
      const rl = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.4), legMat); rl.position.set(0.4, 0.2, 0); rl.rotation.z = -0.3; g.add(rl);
      const bl = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.35), legMat); bl.position.set(0, 0.18, -0.35); bl.rotation.x = -0.4; g.add(bl);
    } else {
      // Plant-like: pot + stem + leaves
      const potMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63, roughness: 0.8 });
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.45, 16), potMat);
      pot.position.y = 0.23;
      pot.castShadow = true;
      g.add(pot);
      // Stem
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), stemMat);
      stem.position.y = 0.8;
      g.add(stem);
      // Leaves
      const leafGeo = new THREE.SphereGeometry(0.2, 8, 8);
      leafGeo.scale(1.8, 0.2, 1);
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x66BB6A });
      const l1 = new THREE.Mesh(leafGeo, leafMat); l1.position.set(0.25, 1.0, 0); l1.rotation.z = -0.5; g.add(l1);
      const l2 = new THREE.Mesh(leafGeo, leafMat); l2.position.set(-0.25, 1.15, 0); l2.rotation.z = 0.5; g.add(l2);
      const l3 = new THREE.Mesh(leafGeo, leafMat); l3.position.set(0, 1.3, 0.2); l3.rotation.x = 0.5; g.add(l3);
      // Flower center (if sunflower)
      if (variety === '向日葵') {
        const center = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({ color: 0x5D4037 }));
        center.position.y = 1.45; g.add(center);
        const petalMat = new THREE.MeshStandardMaterial({ color: 0xFFEB3B });
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const petal = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), petalMat);
          petal.scale.set(1, 0.3, 2);
          petal.position.set(Math.cos(angle) * 0.18, 1.45, Math.sin(angle) * 0.18);
          petal.rotation.y = -angle;
          g.add(petal);
        }
      }
    }

    // Costumes
    if (costumes && costumes.includes('c-hat')) {
      const hatMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.15, 16), hatMat);
      hat.position.y = typeId === 'seed' ? 1.55 : 1.35;
      g.add(hat);
      const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.25, 16), hatMat);
      hatTop.position.y = typeId === 'seed' ? 1.75 : 1.55;
      g.add(hatTop);
    }
    if (costumes && costumes.includes('c-bow')) {
      const bowMat = new THREE.MeshStandardMaterial({ color: 0xE91E63 });
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 8, 16), bowMat);
      bow.position.set(0, typeId === 'seed' ? 0.95 : 0.55, 0.45);
      g.add(bow);
    }

    // c-scarf (围巾)
    if (costumes && costumes.includes('c-scarf')) {
      const scarfMat = new THREE.MeshStandardMaterial({ color: 0xCC0000, roughness: 0.6 });
      const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.05, 8, 16), scarfMat);
      const scarfY = typeId === 'egg' ? 0.7 : typeId === 'amphibian' ? 0.45 : 0.6;
      scarf.position.set(0, scarfY, 0);
      scarf.rotation.x = Math.PI / 3;
      scarf.userData.costumeType = 'c-scarf';
      g.add(scarf);
    }

    // c-glasses (眼镜)
    if (costumes && costumes.includes('c-glasses')) {
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.3, roughness: 0.4 });
      const glassGroup = new THREE.Group();
      // 左镜片
      const lensGeo = new THREE.TorusGeometry(0.1, 0.02, 8, 16);
      const ll = new THREE.Mesh(lensGeo, glassMat);
      ll.position.set(-0.13, 0, 0);
      glassGroup.add(ll);
      // 右镜片
      const rl = new THREE.Mesh(lensGeo, glassMat);
      rl.position.set(0.13, 0, 0);
      glassGroup.add(rl);
      // 鼻梁连接
      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.06, 8), glassMat);
      bridge.rotation.z = Math.PI / 2;
      bridge.position.set(0, 0, 0);
      glassGroup.add(bridge);
      // 位置根据 typeId 调整
      const glassY = (typeId === 'egg' || typeId === 'amphibian') ? 1.05 : 0.9;
      const glassZ = (typeId === 'egg' || typeId === 'amphibian') ? 0.5 : 0.3;
      glassGroup.position.set(0, glassY, glassZ);
      glassGroup.userData.costumeType = 'c-glasses';
      g.add(glassGroup);
    }

    // c-crown (皇冠)
    if (costumes && costumes.includes('c-crown')) {
      const crownMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.5, roughness: 0.3 });
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.15, 5), crownMat);
      const crownY = typeId === 'egg' ? 1.5 : typeId === 'amphibian' ? 1.2 : 1.6;
      crown.position.set(0, crownY, 0);
      crown.userData.costumeType = 'c-crown';
      g.add(crown);
    }
    // c-wings (天使翅膀)
    if (costumes && costumes.includes('c-wings')) {
      const wingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
      const wingGeo = new THREE.SphereGeometry(0.4, 8, 8);
      wingGeo.scale(0.5, 0.8, 1.2);
      const lw = new THREE.Mesh(wingGeo, wingMat); lw.position.set(-0.6, 1.1, -0.2); lw.rotation.z = 0.4; lw.userData.costumeType = 'c-wings'; g.add(lw);
      const rw = new THREE.Mesh(wingGeo, wingMat); rw.position.set(0.6, 1.1, -0.2); rw.rotation.z = -0.4; rw.userData.costumeType = 'c-wings'; g.add(rw);
    }
    // c-halo (光环)
    if (costumes && costumes.includes('c-halo')) {
      const haloMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.4, transparent: true, opacity: 0.6 });
      const haloY = typeId === 'seed' ? 1.7 : typeId === 'amphibian' ? 1.3 : 1.55;
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 8, 32), haloMat);
      halo.position.set(0, haloY, 0); halo.rotation.x = Math.PI / 2;
      halo.userData.costumeType = 'c-halo'; g.add(halo);
    }
    // c-bell (铃铛)
    if (costumes && costumes.includes('c-bell')) {
      const bellMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8, roughness: 0.2 });
      const bell = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.7), bellMat);
      const bellY = typeId === 'seed' ? 1.2 : 0.85;
      bell.position.set(0, bellY, 0.35); bell.rotation.x = Math.PI;
      bell.userData.costumeType = 'c-bell'; g.add(bell);
    }
    // c-cape (披风)
    if (costumes && costumes.includes('c-cape')) {
      const capeMat = new THREE.MeshStandardMaterial({ color: 0xD32F2F, side: THREE.DoubleSide });
      const capeGeo = new THREE.PlaneGeometry(0.9, 1.0);
      const cape = new THREE.Mesh(capeGeo, capeMat);
      const capeY = typeId === 'seed' ? 1.0 : 0.7;
      cape.position.set(0, capeY, -0.3);
      cape.userData.costumeType = 'c-cape'; g.add(cape);
    }
    // c-magic (魔法帽)
    if (costumes && costumes.includes('c-magic')) {
      const magicMat = new THREE.MeshStandardMaterial({ color: 0x4A148C });
      const coneH = 0.5;
      const magicCone = new THREE.Mesh(new THREE.ConeGeometry(0.25, coneH, 16), magicMat);
      const magicY = typeId === 'seed' ? 1.7 : 1.5;
      magicCone.position.set(0, magicY, 0);
      magicCone.userData.costumeType = 'c-magic'; g.add(magicCone);
      // 帽檐
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 16), magicMat);
      brim.position.set(0, magicY - coneH / 2 + 0.02, 0);
      brim.userData.costumeType = 'c-magic'; g.add(brim);
      // 星星装饰
      const starMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.5 });
      const star = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), starMat);
      star.position.set(0.12, magicY + 0.1, 0.2);
      star.userData.costumeType = 'c-magic'; g.add(star);
    }

    return g;
  },

  _buildFurniture(scene, furnitureIds) {
    if (!furnitureIds || furnitureIds.length === 0) return;
    const fMap = {
      'f-lamp': () => {
        const g = new THREE.Group(); g.userData.isFurniture = true;
        const matWood = new THREE.MeshStandardMaterial({ color: 0x6D4C41, roughness: 0.7 });
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.06, 16), matWood); base.position.set(-2, 0.03, -1.5); g.add(base);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 8), matWood); pole.position.set(-2, 0.73, -1.5); g.add(pole);
        const shadeMat = new THREE.MeshStandardMaterial({ color: 0xFFE0B2, emissive: 0xFFCC80, emissiveIntensity: 0.5, transparent: true, opacity: 0.9 });
        const shade = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.35, 16, 1, true), shadeMat); shade.position.set(-2, 1.45, -1.5); g.add(shade);
        const bulb = new THREE.PointLight(0xFFECB3, 1.2, 8, 2);
        bulb.position.set(-2, 1.3, -1.5); g.add(bulb);
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xFFECB3 }));
        glow.position.set(-2, 1.3, -1.5); g.add(glow);
        return g;
      },
      'f-clock': () => {
        const g = new THREE.Group(); g.userData.isFurniture = true;
        const faceMat = new THREE.MeshStandardMaterial({ color: 0xFFF8E1, roughness: 0.3 });
        const face = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 32), faceMat); face.rotation.x = Math.PI / 2; face.position.set(2, 1.3, -2.5); g.add(face);
        const rimMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63, metalness: 0.4, roughness: 0.4 });
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 12, 32), rimMat); rim.position.set(2, 1.3, -2.44); g.add(rim);
        const hand1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.01), new THREE.MeshStandardMaterial({ color: 0x3E2723 })); hand1.position.set(2, 1.38, -2.43); g.add(hand1);
        const hand2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.12, 0.01), new THREE.MeshStandardMaterial({ color: 0x5D4037 })); hand2.position.set(2.06, 1.34, -2.43); hand2.rotation.z = 0.5; g.add(hand2);
        const centerDot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshStandardMaterial({ color: 0xD94A4A })); centerDot.position.set(2, 1.3, -2.42); g.add(centerDot);
        return g;
      },
      'f-plant': () => {
        const g = new THREE.Group(); g.userData.isFurniture = true;
        const potMat = new THREE.MeshStandardMaterial({ color: 0xA1887F, roughness: 0.8 });
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.28, 16), potMat); pot.position.set(1.8, 0.14, 1.5); g.add(pot);
        const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 16), new THREE.MeshStandardMaterial({ color: 0x4E342E })); soil.position.set(1.8, 0.28, 1.5); g.add(soil);
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x66BB6A, roughness: 0.6 });
        for (let i = 0; i < 5; i++) {
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), leafMat);
          const a = (i / 5) * Math.PI * 2;
          leaf.scale.set(1.2, 0.4, 1.8); leaf.position.set(1.8 + Math.cos(a) * 0.12, 0.42 + i * 0.08, 1.5 + Math.sin(a) * 0.12); leaf.rotation.y = a;
          g.add(leaf);
        }
        const top = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshStandardMaterial({ color: 0x81C784 })); top.position.set(1.8, 0.8, 1.5); g.add(top);
        return g;
      },
      'f-shelf': () => {
        const g = new THREE.Group(); g.userData.isFurniture = true;
        const mat = new THREE.MeshStandardMaterial({ color: 0x8D6E63, roughness: 0.6 });
        const s1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.35), mat); s1.position.set(-2, 0.8, -2.3); g.add(s1);
        const s2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.35), mat); s2.position.set(-2, 1.5, -2.3); g.add(s2);
        const side1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 0.35), mat); side1.position.set(-2.6, 1.15, -2.3); g.add(side1);
        const side2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 0.35), mat); side2.position.set(-1.4, 1.15, -2.3); g.add(side2);
        // Books
        const bookColors = [0xE57373, 0x64B5F6, 0x81C784, 0xFFD54F, 0xBA68C8];
        for (let i = 0; i < 4; i++) {
          const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.28), new THREE.MeshStandardMaterial({ color: bookColors[i] }));
          b.position.set(-2.3 + i * 0.14, 0.95, -2.3); g.add(b);
        }
        return g;
      },
      'f-globe': () => {
        const g = new THREE.Group(); g.userData.isFurniture = true;
        const standMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.6 });
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.45, 16), standMat); stand.position.set(2.2, 0.23, 1.8); g.add(stand);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 16), standMat); base.position.set(2.2, 0.02, 1.8); g.add(base);
        const ballMat = new THREE.MeshStandardMaterial({ color: 0x42A5F5, emissive: 0x1565C0, emissiveIntensity: 0.2, roughness: 0.3 });
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 24), ballMat); ball.position.set(2.2, 0.58, 1.8); g.add(ball);
        const arc = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.015, 8, 32), new THREE.MeshStandardMaterial({ color: 0xFFD54F, metalness: 0.6 }));
        arc.position.set(2.2, 0.58, 1.8); arc.rotation.x = Math.PI / 4; g.add(arc);
        return g;
      },
      'f-telescope': () => {
        const g = new THREE.Group(); g.userData.isFurniture = true;
        const metal = new THREE.MeshStandardMaterial({ color: 0x424242, metalness: 0.5, roughness: 0.4 });
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.6, 12), metal); tube.rotation.z = 0.6; tube.position.set(-2.5, 0.85, 1.5); g.add(tube);
        const lens = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), new THREE.MeshStandardMaterial({ color: 0x90CAF9, transparent: true, opacity: 0.7 })); lens.position.set(-2.2, 1.1, 1.5); g.add(lens);
        const tripodMat = new THREE.MeshStandardMaterial({ color: 0x616161, metalness: 0.4 });
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2;
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.7, 8), tripodMat);
          leg.position.set(-2.5 + Math.cos(a) * 0.15, 0.35, 1.5 + Math.sin(a) * 0.15); leg.rotation.x = Math.cos(a) * 0.3; leg.rotation.z = Math.sin(a) * 0.3; g.add(leg);
        }
        return g;
      },
    };
    furnitureIds.forEach(id => {
      if (fMap[id]) scene.add(fMap[id]());
    });
  },

  _rebuildFurniture3D(child) {
    const scene = this._room3D.scene;
    if (!scene || !child) return;
    // Remove old furniture
    const toRemove = [];
    scene.traverse(obj => { if (obj.userData && obj.userData.isFurniture) toRemove.push(obj); });
    toRemove.forEach(obj => { if (obj.parent) obj.parent.remove(obj); });
    // Add new furniture
    this._buildFurniture(scene, child.room.furniture);
  },

  _buildParticles(scene) {
    const geo = new THREE.BufferGeometry();
    const count = 30;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = Math.random() * 3 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.6 });
    const pts = new THREE.Points(geo, mat);
    pts.userData.isParticle = true;
    pts.userData.offset = Math.random() * 10;
    scene.add(pts);
  },

  _buildStars(scene, bgId) {
    if (!bgId) return;

    // ===== 星空 / 宇宙 =====
    if (bgId.includes('star') || bgId.includes('space')) {
      const isSpace = bgId.includes('space');
      // 大量星点
      const starCount = isSpace ? 200 : 120;
      const starMat = new THREE.MeshStandardMaterial({ color: 0xCCDDFF, emissive: 0xAABBFF, emissiveIntensity: isSpace ? 0.8 : 0.5 });
      for (let i = 0; i < starCount; i++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.015 + Math.random() * 0.02, 6, 6), starMat);
        s.position.set((Math.random() - 0.5) * 20, Math.random() * 8 + 1, (Math.random() - 0.5) * 20);
        s.userData.isDecoration = true; s.userData.twinkleOffset = Math.random() * 10;
        scene.add(s);
      }
      // 月亮（星空）
      if (!isSpace) {
        const moon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), new THREE.MeshStandardMaterial({ color: 0xFFF8DC, emissive: 0xFFF8DC, emissiveIntensity: 0.4 }));
        moon.position.set(3, 4, -5); moon.userData.isDecoration = true; scene.add(moon);
      }
      // 行星（宇宙）
      if (isSpace) {
        const planetColors = [0xFF6B6B, 0x4ECDC4, 0xFFE66D, 0x95E1D3];
        for (let i = 0; i < 3; i++) {
          const p = new THREE.Mesh(new THREE.SphereGeometry(0.15 + Math.random() * 0.2, 16, 16), new THREE.MeshStandardMaterial({ color: planetColors[i], emissive: planetColors[i], emissiveIntensity: 0.3 }));
          p.position.set((Math.random() - 0.5) * 10, 3 + Math.random() * 3, -4 - Math.random() * 4); p.userData.isDecoration = true; scene.add(p);
        }
        // 光环
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.7, 32), new THREE.MeshStandardMaterial({ color: 0xC8B6FF, transparent: true, opacity: 0.3, side: THREE.DoubleSide }));
        ring.position.set(-2, 4, -6); ring.rotation.x = 0.5; ring.userData.isDecoration = true; scene.add(ring);
      }
      // 流星
      for (let i = 0; i < 3; i++) {
        const trail = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.015, 0.8, 4), new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.6 }));
        trail.position.set((Math.random() - 0.5) * 12, 5 + Math.random() * 2, -3); trail.rotation.z = 0.8 + Math.random() * 0.4;
        trail.userData.isDecoration = true; trail.userData.isShootingStar = true; trail.userData.starPhase = i * 3;
        scene.add(trail);
      }
    }

    // ===== 森林 / 花园 =====
    else if (bgId.includes('forest') || bgId.includes('garden')) {
      const isGarden = bgId.includes('garden');
      // 萤火虫
      const ffMat = new THREE.MeshStandardMaterial({ color: 0xCCFF66, emissive: 0xCCFF66, emissiveIntensity: 0.9 });
      for (let i = 0; i < 20; i++) {
        const ff = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), ffMat);
        ff.position.set((Math.random() - 0.5) * 8, Math.random() * 2.5 + 0.3, (Math.random() - 0.5) * 8);
        ff.userData.isDecoration = true; ff.userData.fireflyOffset = Math.random() * 10; ff.userData.fireflyBasePos = ff.position.clone();
        scene.add(ff);
      }
      // 蝴蝶（花园）
      if (isGarden) {
        const butterflyColors = [0xFF69B4, 0x87CEEB, 0xFFD700, 0xDDA0DD];
        for (let i = 0; i < 6; i++) {
          const bg = new THREE.Group(); bg.userData.isDecoration = true; bg.userData.isButterfly = true; bg.userData.bfOffset = i * 2;
          const wMat = new THREE.MeshStandardMaterial({ color: butterflyColors[i % butterflyColors.length], side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
          const w1 = new THREE.Mesh(new THREE.CircleGeometry(0.06, 8), wMat); w1.position.set(-0.04, 0, 0); bg.add(w1);
          const w2 = new THREE.Mesh(new THREE.CircleGeometry(0.05, 8), wMat); w2.position.set(0.04, 0, 0); bg.add(w2);
          bg.position.set((Math.random() - 0.5) * 6, 1 + Math.random() * 1.5, (Math.random() - 0.5) * 6);
          scene.add(bg);
        }
      }
      // 森林特有：更暗的氛围粒子
      if (!isGarden) {
        const mistGeo = new THREE.BufferGeometry();
        const mistCount = 50;
        const mistPos = new Float32Array(mistCount * 3);
        for (let i = 0; i < mistCount; i++) {
          mistPos[i * 3] = (Math.random() - 0.5) * 10; mistPos[i * 3 + 1] = Math.random() * 0.8; mistPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));
        const mist = new THREE.Points(mistGeo, new THREE.PointsMaterial({ color: 0x88AA88, size: 0.1, transparent: true, opacity: 0.3 }));
        mist.userData.isDecoration = true; scene.add(mist);
      }
    }

    // ===== 海洋 =====
    else if (bgId.includes('ocean')) {
      // 气泡上升
      const bubbleMat = new THREE.MeshStandardMaterial({ color: 0xAADDFF, transparent: true, opacity: 0.5, emissive: 0x66AAFF, emissiveIntensity: 0.3 });
      for (let i = 0; i < 25; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.03 + Math.random() * 0.05, 8, 8), bubbleMat);
        b.position.set((Math.random() - 0.5) * 8, Math.random() * 3, (Math.random() - 0.5) * 8);
        b.userData.isDecoration = true; b.userData.isBubble = true; b.userData.bubbleSpeed = 0.3 + Math.random() * 0.5; b.userData.bubbleBaseY = b.position.y;
        scene.add(b);
      }
      // 小鱼群
      const fishColors = [0xFF6B35, 0xFFD93D, 0x6BCB77, 0xFF8FAB];
      for (let i = 0; i < 8; i++) {
        const fg = new THREE.Group(); fg.userData.isDecoration = true; fg.userData.isFish = true; fg.userData.fishSpeed = 0.5 + Math.random() * 0.5; fg.userData.fishPhase = i;
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshStandardMaterial({ color: fishColors[i % fishColors.length] }));
        body.scale.set(1.5, 0.8, 0.6); fg.add(body);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 4), new THREE.MeshStandardMaterial({ color: fishColors[i % fishColors.length] }));
        tail.rotation.z = Math.PI / 2; tail.position.set(-0.1, 0, 0); fg.add(tail);
        fg.position.set((Math.random() - 0.5) * 6, 1 + Math.random() * 2, (Math.random() - 0.5) * 4);
        scene.add(fg);
      }
      // 水面波纹
      for (let i = 0; i < 5; i++) {
        const rMat = new THREE.MeshStandardMaterial({ color: 0x88ccee, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
        const r = new THREE.Mesh(new THREE.RingGeometry(0.2 + i * 0.1, 0.4 + i * 0.1, 16), rMat);
        r.rotation.x = -Math.PI / 2; r.position.set((Math.random() - 0.5) * 5, 0.01, (Math.random() - 0.5) * 5);
        r.userData.isDecoration = true; r.userData.isRipple = true; r.userData.ripplePhase = i * 1.5;
        scene.add(r);
      }
      // 珊瑚礁
      const coralColors = [0xFF6B6B, 0xFF8E53, 0xC44569, 0xF8B500];
      for (let i = 0; i < 5; i++) {
        const cg = new THREE.Group(); cg.userData.isDecoration = true;
        const cMat = new THREE.MeshStandardMaterial({ color: coralColors[i % coralColors.length], roughness: 0.8 });
        for (let j = 0; j < 3; j++) {
          const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.2 + Math.random() * 0.3, 6), cMat);
          branch.position.set(Math.cos(j * 2) * 0.05, 0.1 + j * 0.1, Math.sin(j * 2) * 0.05); branch.rotation.z = (Math.random() - 0.5) * 0.5; cg.add(branch);
        }
        cg.position.set((Math.random() - 0.5) * 7, 0, (Math.random() - 0.5) * 7); scene.add(cg);
      }
    }

    // ===== 书房 =====
    else if (bgId.includes('study')) {
      // 漂浮的尘埃微粒
      const dustGeo = new THREE.BufferGeometry();
      const dustCount = 60;
      const dustPos = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) {
        dustPos[i * 3] = (Math.random() - 0.5) * 8; dustPos[i * 3 + 1] = Math.random() * 4; dustPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
      }
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
      const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xFFE0B2, size: 0.05, transparent: true, opacity: 0.4 }));
      dust.userData.isDecoration = true; scene.add(dust);
    }

    // ===== 沙漠 =====
    else if (bgId.includes('desert')) {
      // 热浪扭曲效果（用半透明粒子模拟）
      const heatGeo = new THREE.BufferGeometry();
      const heatCount = 30;
      const heatPos = new Float32Array(heatCount * 3);
      for (let i = 0; i < heatCount; i++) {
        heatPos[i * 3] = (Math.random() - 0.5) * 8; heatPos[i * 3 + 1] = 0.2 + Math.random() * 1; heatPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      }
      heatGeo.setAttribute('position', new THREE.BufferAttribute(heatPos, 3));
      const heat = new THREE.Points(heatGeo, new THREE.PointsMaterial({ color: 0xFFCC80, size: 0.15, transparent: true, opacity: 0.15 }));
      heat.userData.isDecoration = true; scene.add(heat);
    }
  },

  _buildGroundDecor(scene, bgId) {
    if (!bgId) return;

    // ===== 森林：大树、灌木、蕨类 =====
    if (bgId === 'bg-forest') {
      // 大树
      const treeCount = 5 + Math.floor(Math.random() * 3);
      for (let i = 0; i < treeCount; i++) {
        const tg = new THREE.Group(); tg.userData.isDecoration = true;
        const trunkH = 1.5 + Math.random() * 1;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, trunkH, 8), new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.9 }));
        trunk.position.set(0, trunkH / 2, 0); tg.add(trunk);
        const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.5 + Math.random() * 0.3, 8, 8), new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.8 }));
        canopy.position.set(0, trunkH + 0.3, 0); canopy.scale.y = 0.7; tg.add(canopy);
        // 第二层树冠
        const canopy2 = new THREE.Mesh(new THREE.SphereGeometry(0.35 + Math.random() * 0.2, 8, 8), new THREE.MeshStandardMaterial({ color: 0x388E3C, roughness: 0.8 }));
        canopy2.position.set(0.1, trunkH + 0.6, 0.1); canopy2.scale.y = 0.6; tg.add(canopy2);
        const angle = (i / treeCount) * Math.PI * 2 + Math.random() * 0.5;
        const dist = 2.5 + Math.random() * 3;
        tg.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
        scene.add(tg);
      }
      // 灌木丛
      for (let i = 0; i < 6; i++) {
        const bush = new THREE.Mesh(new THREE.SphereGeometry(0.2 + Math.random() * 0.15, 8, 8), new THREE.MeshStandardMaterial({ color: 0x43A047, roughness: 0.9 }));
        bush.position.set((Math.random() - 0.5) * 7, 0.15, (Math.random() - 0.5) * 7); bush.scale.y = 0.5; bush.userData.isDecoration = true; scene.add(bush);
      }
      // 蘑菇
      for (let i = 0; i < 4; i++) {
        const mg = new THREE.Group(); mg.userData.isDecoration = true;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.12, 8), new THREE.MeshStandardMaterial({ color: 0xFAFAFA })); stem.position.set(0, 0.06, 0); mg.add(stem);
        const capColors = [0xD32F2F, 0xFF6F00, 0x8E24AA];
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: capColors[i % capColors.length] })); cap.position.set(0, 0.12, 0); mg.add(cap);
        // 白点
        for (let j = 0; j < 3; j++) {
          const dot = new THREE.Mesh(new THREE.SphereGeometry(0.015, 4, 4), new THREE.MeshStandardMaterial({ color: 0xFFFFFF }));
          dot.position.set(Math.cos(j * 2) * 0.04, 0.14, Math.sin(j * 2) * 0.04); mg.add(dot);
        }
        mg.position.set((Math.random() - 0.5) * 5, 0, (Math.random() - 0.5) * 5); scene.add(mg);
      }
    }

    // ===== 花园：花坛、小路、灌木 =====
    else if (bgId === 'bg-garden') {
      // 花圃（圆形花坛）
      for (let bed = 0; bed < 3; bed++) {
        const bedG = new THREE.Group(); bedG.userData.isDecoration = true;
        const bedR = 0.4 + Math.random() * 0.2;
        const soil = new THREE.Mesh(new THREE.CylinderGeometry(bedR, bedR, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0x5D4037 })); soil.position.y = 0.025; bedG.add(soil);
        const bedBorder = new THREE.Mesh(new THREE.TorusGeometry(bedR, 0.03, 6, 16), new THREE.MeshStandardMaterial({ color: 0x8D6E63 })); bedBorder.rotation.x = Math.PI / 2; bedBorder.position.y = 0.05; bedG.add(bedBorder);
        const flowerColors = [0xFF69B4, 0xFF6347, 0xEE82EE, 0xFFD700, 0xFF1493, 0x00BCD4];
        const fCount = 5 + Math.floor(Math.random() * 4);
        for (let i = 0; i < fCount; i++) {
          const fg = new THREE.Group();
          const a = (i / fCount) * Math.PI * 2 + Math.random() * 0.3;
          const r = Math.random() * bedR * 0.7;
          const petalMat = new THREE.MeshStandardMaterial({ color: flowerColors[i % flowerColors.length] });
          for (let j = 0; j < 5; j++) {
            const angle = (j / 5) * Math.PI * 2;
            const petal = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), petalMat); petal.scale.set(1, 0.4, 1);
            petal.position.set(Math.cos(angle) * 0.04, 0.15, Math.sin(angle) * 0.04); fg.add(petal);
          }
          const center = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), new THREE.MeshStandardMaterial({ color: 0xFFFF00 })); center.position.set(0, 0.15, 0); fg.add(center);
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.15, 4), new THREE.MeshStandardMaterial({ color: 0x4CAF50 })); stem.position.set(0, 0.075, 0); fg.add(stem);
          fg.position.set(Math.cos(a) * r, 0.05, Math.sin(a) * r); bedG.add(fg);
        }
        const bedAngle = (bed / 3) * Math.PI * 2;
        bedG.position.set(Math.cos(bedAngle) * (1.5 + Math.random()), 0, Math.sin(bedAngle) * (1.5 + Math.random()));
        scene.add(bedG);
      }
      // 小径（扁平石板）
      for (let i = 0; i < 8; i++) {
        const stone = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 0.2), new THREE.MeshStandardMaterial({ color: 0xBCAAA4, roughness: 0.9 }));
        stone.position.set((Math.random() - 0.5) * 4, 0.01, (Math.random() - 0.5) * 4); stone.rotation.y = Math.random() * 0.5; stone.userData.isDecoration = true; scene.add(stone);
      }
      // 小灌木
      for (let i = 0; i < 4; i++) {
        const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.25 + Math.random() * 0.1, 8, 8), new THREE.MeshStandardMaterial({ color: 0x66BB6A, roughness: 0.8 }));
        shrub.position.set((Math.random() - 0.5) * 6, 0.15, (Math.random() - 0.5) * 6); shrub.scale.y = 0.6; shrub.userData.isDecoration = true; scene.add(shrub);
      }
    }

    // ===== 书房：书架、书桌、地毯 =====
    else if (bgId === 'bg-study') {
      // 大书架（后方）
      const shelfMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.7 });
      for (let s = 0; s < 2; s++) {
        const sg = new THREE.Group(); sg.userData.isDecoration = true;
        const back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.2, 0.08), shelfMat); back.position.set(0, 1.1, -0.2); sg.add(back);
        for (let lvl = 0; lvl < 5; lvl++) {
          const sl = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.35), shelfMat); sl.position.set(0, 0.3 + lvl * 0.45, 0); sg.add(sl);
          // 书
          const bookColors = [0xE57373, 0x64B5F6, 0x81C784, 0xFFD54F, 0xBA68C8, 0xFF8A65, 0x4DD0E1];
          const bookCount = 4 + Math.floor(Math.random() * 4);
          for (let b = 0; b < bookCount; b++) {
            const bh = 0.2 + Math.random() * 0.15;
            const book = new THREE.Mesh(new THREE.BoxGeometry(0.08, bh, 0.28), new THREE.MeshStandardMaterial({ color: bookColors[(b + lvl) % bookColors.length] }));
            book.position.set(-0.6 + b * 0.12, 0.3 + lvl * 0.45 + bh / 2, 0); sg.add(book);
          }
        }
        sg.position.set(s === 0 ? -3 : 3, 0, -3.5); scene.add(sg);
      }
      // 书桌
      const deskG = new THREE.Group(); deskG.userData.isDecoration = true;
      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.9), new THREE.MeshStandardMaterial({ color: 0x6D4C41, roughness: 0.6 })); deskTop.position.set(0, 0.75, 0); deskG.add(deskTop);
      for (let c = 0; c < 4; c++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.75, 8), new THREE.MeshStandardMaterial({ color: 0x5D4037 }));
        leg.position.set((c < 2 ? -0.8 : 0.8), 0.375, (c % 2 === 0 ? -0.4 : 0.4)); deskG.add(leg);
      }
      deskG.position.set(0, 0, -2.5); scene.add(deskG);
      // 台灯（书桌上）
      const lampG = new THREE.Group(); lampG.userData.isDecoration = true;
      const lBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.03, 8), new THREE.MeshStandardMaterial({ color: 0x424242 })); lBase.position.y = 0.015; lampG.add(lBase);
      const lPole = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4), new THREE.MeshStandardMaterial({ color: 0x424242 })); lPole.position.y = 0.17; lampG.add(lPole);
      const lShade = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.12, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0xFFE0B2, transparent: true, opacity: 0.8 })); lShade.position.y = 0.32; lampG.add(lShade);
      const lBulb = new THREE.PointLight(0xFFECB3, 0.8, 3, 2); lBulb.position.y = 0.28; lampG.add(lBulb);
      lampG.position.set(-0.3, 0.78, -2.8); scene.add(lampG);
      // 地毯
      const rug = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.02, 32), new THREE.MeshStandardMaterial({ color: 0x8D6E63, roughness: 0.9 }));
      rug.position.set(0, 0.01, 0); rug.userData.isDecoration = true; scene.add(rug);
      // 吊灯
      const pendant = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.1, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0xFFECB3, emissive: 0xFFECB3, emissiveIntensity: 0.3, transparent: true, opacity: 0.8 }));
      pendant.position.set(0, 3.5, 0); pendant.userData.isDecoration = true; scene.add(pendant);
      const pLight = new THREE.PointLight(0xFFECB3, 0.6, 6, 2); pLight.position.set(0, 3.3, 0); scene.add(pLight);
    }

    // ===== 沙漠：沙丘、仙人掌、棕榈树 =====
    else if (bgId === 'bg-desert') {
      // 沙丘（大起伏地形替代平面）
      for (let i = 0; i < 4; i++) {
        const dune = new THREE.Mesh(new THREE.SphereGeometry(1.5 + Math.random(), 16, 16, 0, Math.PI * 2, 0, Math.PI / 3), new THREE.MeshStandardMaterial({ color: 0xE6C278, roughness: 0.95 }));
        dune.position.set((Math.random() - 0.5) * 10, -0.3, (Math.random() - 0.5) * 8); dune.scale.y = 0.3; dune.userData.isDecoration = true; scene.add(dune);
      }
      // 仙人掌
      for (let i = 0; i < 4; i++) {
        const cg = new THREE.Group(); cg.userData.isDecoration = true;
        const cMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.8 });
        const main = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.6, 8), cMat); main.position.y = 0.3; cg.add(main);
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.3, 8), cMat); arm.position.set(0.12, 0.4, 0); arm.rotation.z = -0.5; cg.add(arm);
        const armTop = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.15, 8), cMat); armTop.position.set(0.2, 0.52, 0); cg.add(armTop);
        for (let s = 0; s < 4; s++) {
          const spine = new THREE.Mesh(new THREE.ConeGeometry(0.005, 0.03, 3), new THREE.MeshStandardMaterial({ color: 0xFFF8E1 }));
          spine.position.set(0.1, 0.2 + s * 0.1, 0.1); spine.rotation.x = 0.5; cg.add(spine);
        }
        cg.position.set((Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 6); scene.add(cg);
      }
      // 棕榈树
      for (let i = 0; i < 2; i++) {
        const pg = new THREE.Group(); pg.userData.isDecoration = true;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.8, 8), new THREE.MeshStandardMaterial({ color: 0x8D6E63, roughness: 0.9 })); trunk.position.y = 0.9; pg.add(trunk);
        for (let f = 0; f < 6; f++) {
          const a = (f / 6) * Math.PI * 2;
          const frond = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.5, 4), new THREE.MeshStandardMaterial({ color: 0x4CAF50 }));
          frond.position.set(Math.cos(a) * 0.15, 1.8, Math.sin(a) * 0.15); frond.rotation.z = 0.6; frond.rotation.y = a; pg.add(frond);
        }
        pg.position.set((Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 6); scene.add(pg);
      }
      // 石头
      for (let i = 0; i < 5; i++) {
        const s = 0.1 + Math.random() * 0.15;
        const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), new THREE.MeshStandardMaterial({ color: 0xD4A054, roughness: 0.9 }));
        stone.position.set((Math.random() - 0.5) * 8, s * 0.4, (Math.random() - 0.5) * 6); stone.rotation.set(Math.random(), Math.random(), Math.random()); stone.userData.isDecoration = true; scene.add(stone);
      }
    }

    // ===== 海洋：海底沙地、海草 =====
    else if (bgId === 'bg-ocean') {
      // 海草
      for (let i = 0; i < 12; i++) {
        const sg = new THREE.Group(); sg.userData.isDecoration = true;
        const h = 0.3 + Math.random() * 0.4;
        const grass = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.02, h, 4), new THREE.MeshStandardMaterial({ color: 0x2E7D32, transparent: true, opacity: 0.8 }));
        grass.position.y = h / 2; sg.add(grass);
        sg.position.set((Math.random() - 0.5) * 7, 0, (Math.random() - 0.5) * 7); scene.add(sg);
      }
      // 沙地起伏
      for (let i = 0; i < 3; i++) {
        const sand = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 12, 0, Math.PI * 2, 0, Math.PI / 4), new THREE.MeshStandardMaterial({ color: 0xD4C4A8, roughness: 1 }));
        sand.position.set((Math.random() - 0.5) * 8, -0.2, (Math.random() - 0.5) * 6); sand.scale.y = 0.2; sand.userData.isDecoration = true; scene.add(sand);
      }
    }

    // ===== 星空/宇宙：陨石坑地面 =====
    else if (bgId.includes('star') || bgId.includes('space')) {
      for (let i = 0; i < 6; i++) {
        const crater = new THREE.Mesh(new THREE.RingGeometry(0.1 + Math.random() * 0.3, 0.15 + Math.random() * 0.35, 16), new THREE.MeshStandardMaterial({ color: 0x555577, side: THREE.DoubleSide }));
        crater.rotation.x = -Math.PI / 2; crater.position.set((Math.random() - 0.5) * 8, 0.01, (Math.random() - 0.5) * 6); crater.userData.isDecoration = true; scene.add(crater);
      }
    }
  },

  exitRoom() {
    this._destroyRoom3D();
    Router.navigate('video-feed');
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  _renderRoomItem(item, child, type) {
    const totalMinutes = Math.floor((child.stats.totalWatchTime || 0) / 60);
    const totalQuizzes = child.stats.quizzesAnswered || 0;
    // 渐进解锁：背景靠观看分钟数，家具/服饰靠答题数
    const isUnlocked = type === 'bg'
      ? totalMinutes >= item.unlock
      : totalQuizzes >= item.unlock;
    const roomProp = type === 'costume' ? 'costumes' : type;
    const isActive = type === 'bg' ? child.room.bg === item.id : child.room[roomProp].includes(item.id);
    const locked = !isUnlocked;
    const progressText = type === 'bg'
      ? `🎬 看${item.unlock}分钟就能解锁啦 (${totalMinutes}/${item.unlock})`
      : `✏️ 答对${item.unlock}题就能解锁啦 (${totalQuizzes}/${item.unlock})`;

    // 自动解锁
    if (isUnlocked && !child.unlockedItems.includes(item.id)) {
      child.unlockedItems.push(item.id);
      Store.updateChild(Store.state.activeChildIndex, { unlockedItems: child.unlockedItems });
    }

    return `<div class="room-item ${locked ? 'locked' : ''} ${isActive ? 'active' : ''}" data-tv-focusable
                onclick="${locked ? '' : `App.applyRoomItem('${type}', '${item.id}')`}">
      <div class="item-icon">${locked ? '🔒' : item.icon}</div>
      <div>${item.name}</div>
      ${locked ? `<div class="lock-reason">${progressText}</div>` : ''}
    </div>`;
  },

  _currentRoomTab: 'bg',

  switchRoomTab(tab, el) {
    this._currentRoomTab = tab;
    document.querySelectorAll('.room-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    const child = Store.activeChild();
    const items = tab === 'bg' ? Data.rooms.backgrounds : tab === 'furniture' ? Data.rooms.furniture : Data.rooms.costumes;
    const container = document.getElementById('room-items-container');
    if (container) { container.innerHTML = items.map(i => this._renderRoomItem(i, child, tab)).join(''); Remote.refresh(); }
  },

  applyRoomItem(type, id) {
    const child = Store.activeChild();
    if (type === 'bg') {
      child.room.bg = id;
      Store.updateChild(Store.state.activeChildIndex, { room: child.room });
      // 背景切换需要完整重新渲染以重建3D场景
      this.render();
    } else {
      const roomProp = type === 'costume' ? 'costumes' : type;
      const idx = child.room[roomProp].indexOf(id);
      if (idx >= 0) child.room[roomProp].splice(idx, 1);
      else child.room[roomProp].push(id);
      Store.updateChild(Store.state.activeChildIndex, { room: child.room });
      // 家具/服饰只更新列表状态，不重建3D
      const container = document.getElementById('room-items-container');
      if (container) {
        const items = this._currentRoomTab === 'bg' ? Data.rooms.backgrounds : this._currentRoomTab === 'furniture' ? Data.rooms.furniture : Data.rooms.costumes;
        container.innerHTML = items.map(i => this._renderRoomItem(i, child, this._currentRoomTab)).join('');
      }
      // 3D场景中更新家具
      if (type === 'furniture' && this._room3D.scene) {
        this._rebuildFurniture3D(child);
      }
      // 服饰是宠物模型的一部分，需要完整重建3D场景
      if (type === 'costume' && this._room3D.scene) {
        this._destroyRoom3D();
        this._initRoom3D();
      }
    }
    // Pet celebrate
    const pet = document.getElementById('room-pet-large');
    if (pet) { pet.classList.add('celebrate'); setTimeout(() => pet.classList.remove('celebrate'), 800); }
    setTimeout(() => Remote.refresh(), 50);
  },

  goRoom() { Router.navigate('room'); },

  // --- Growth ---
  _renderGrowth() {
    const child = Store.activeChild();
    const activePet = PetLogic.getActivePet(child);
    if (!child || !activePet) return '<div class="empty-state"><span class="empty-icon">📊</span>还没有宠物</div>';
    const allTypes = Data.getAllPetTypes();
    const type = allTypes.find(t => t.id === activePet.typeId);
    const stage = PetLogic.getCurrentStage(child);
    const gv = PetLogic.getGrowthValue(child);
    const progress = PetLogic.getProgressToNext(child);
    const isComplete = PetLogic.isPetComplete(child);

    return `
      <div class="growth-display">
        <span class="growth-pet">${stage.icon}</span>
        <div class="growth-stage-name">${stage.name} ${isComplete ? '🏆' : ''}</div>
        <div class="growth-type-name">${activePet.variety} · ${type.name}</div>
        ${isComplete ? '<div class="growth-complete-badge">🎉 完全成长！</div>' : ''}
      </div>
      <div class="growth-stats">
        <div class="growth-stat"><div class="stat-value">${Utils.formatMinutes(child.stats.effectiveWatchTime)}</div><div class="stat-label">有效学习(分钟)</div></div>
        <div class="growth-stat"><div class="stat-value">${child.stats.quizzesCorrect}/${child.stats.quizzesAnswered}</div><div class="stat-label">答对/答题</div></div>
        <div class="growth-stat"><div class="stat-value">${child.stats.consecutiveDays}天</div><div class="stat-label">连续观看</div></div>
        <div class="growth-stat"><div class="stat-value">${gv}</div><div class="stat-label">成长值</div></div>
      </div>
      <div class="growth-timeline">
        <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:0.5rem;">成长路线</h3>
        ${type.stages.map(s => {
          const reached = gv >= s.threshold;
          const isCurrent = s.name === stage.name;
          return `<div class="tl-item">
            <div class="tl-dot ${isCurrent ? 'current' : reached ? 'reached' : 'future'}"></div>
            <span class="tl-name">${renderPetIcon(s.icon)} ${s.name}</span>
            <span class="tl-req">${reached ? '已达成' : `需要 ${s.threshold} 成长值`}</span>
          </div>`;
        }).join('')}
      </div>
      ${isComplete ? `<div style="margin-top:1rem;text-align:center;">
        <button class="btn-primary" onclick="App.adoptNewPet()" data-tv-focusable>领养新伙伴</button>
      </div>` : ''}`;
  },

  // --- Parent Tab Navigation ---
  _renderParentTabs() {
    const tab = Store.state.parentTab;
    return `<div style="display:flex;gap:0.4rem;margin-bottom:1rem;flex-wrap:wrap;">
      <span class="room-tab ${tab === 'report' ? 'active' : ''}" data-tv-focusable onclick="App.switchParentTab('report')">学习报告</span>
      <span class="room-tab ${tab === 'control' ? 'active' : ''}" data-tv-focusable onclick="App.switchParentTab('control')">管控设置</span>
      <span class="room-tab ${tab === 'quiz' ? 'active' : ''}" data-tv-focusable onclick="App.switchParentTab('quiz')">出题</span>
      <span class="room-tab ${tab === 'content' ? 'active' : ''}" data-tv-focusable onclick="App.switchParentTab('content')">📚 内容管理</span>
    </div>`;
  },

  switchParentTab(tab) {
    Store.set({ parentTab: tab });
    if (tab === 'quiz') Router.navigate('parent-quiz');
    else if (tab === 'report') Router.navigate('parent-report');
    else if (tab === 'control') Router.navigate('parent-control');
    else if (tab === 'content') Router.navigate('parent-content');
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  // --- Parent Report ---
  _renderParentReport() {
    const child = Store.activeChild();
    if (!child) return '';
    const correctRate = child.stats.quizzesAnswered > 0 ? Math.round(child.stats.quizzesCorrect / child.stats.quizzesAnswered * 100) : 0;
    const allVideos = Data.getAllVideos();
    const allQuizzes = Data.getAllQuizzes();

    const eventStats = Data.getEventStats();
    const eventStatsHtml = Object.keys(eventStats).length > 0 ? `
      <div class="report-section">
        <h3>行为数据概览（近7天）</h3>
        <div class="event-stats-grid">
          ${Object.entries(eventStats).map(([k, v]) => `<div class="event-stat-item">
            <div class="event-stat-name">${this._eventNameMap[k] || k}</div>
            <div class="event-stat-value">${v}</div>
          </div>`).join('')}
        </div>
      </div>
    ` : '';

    // ===== (a) AI 智能洞察 =====
    const insights = [];
    if (child.stats.consecutiveDays >= 7) {
      insights.push({ icon: '🔥', text: `${child.name}已连续学习${child.stats.consecutiveDays}天，学习习惯非常好，请继续保持鼓励！` });
    } else if (child.stats.consecutiveDays >= 3) {
      insights.push({ icon: '👍', text: `${child.name}已连续打卡${child.stats.consecutiveDays}天，再坚持几天就能获得"学习之星"成就啦！` });
    } else if (child.stats.consecutiveDays > 0) {
      insights.push({ icon: '💪', text: `${child.name}今天开始学习了，坚持每天打卡能让宠物更快成长哦！` });
    }

    // 找薄弱科目
    const catStats = {};
    child.history.forEach(h => {
      const v = allVideos.find(vv => vv.id === h.videoId);
      if (v) {
        if (!catStats[v.category]) catStats[v.category] = { count: 0, correct: 0, total: 0 };
        catStats[v.category].count++;
      }
    });
    // 从答题记录中按分类统计正确率
    const quizCatStats = {};
    Object.entries(allQuizzes).forEach(([videoId, quizzes]) => {
      const v = allVideos.find(vv => vv.id === videoId);
      if (!v) return;
      const cat = v.category;
      if (!quizCatStats[cat]) quizCatStats[cat] = { correct: 0, total: 0 };
      // We don't have per-question history, so we use overall stats as approximation
      quizCatStats[cat].total += quizzes.length;
    });
    const catEntries = Object.entries(catStats).sort((a, b) => a[1].count - b[1].count);
    if (catEntries.length >= 2) {
      const weak = catEntries[0];
      insights.push({ icon: '📚', text: `${weak[0]}类别目前观看较少（${weak[1].count}次），建议适当增加该领域的探索，帮助${child.name}全面发展。` });
    }
    if (correctRate < 60 && child.stats.quizzesAnswered > 0) {
      insights.push({ icon: '🎯', text: `综合正确率${correctRate}%还有提升空间，建议${child.name}在看视频时多留意知识细节，答题前先思考再选择。` });
    }
    // 检查观看时段
    const nightWatch = child.history.filter(h => {
      const hour = new Date(h.timestamp).getHours();
      return hour >= 20 || hour < 7;
    });
    if (nightWatch.length > 2) {
      insights.push({ icon: '🌙', text: `检测到${child.name}有${nightWatch.length}次在晚间时段学习，建议调整到白天，晚间用眼更容易疲劳。` });
    }

    const insightHtml = insights.length > 0 ? insights.map(i =>
      `<div class="report-insight"><div class="ri-title">${i.icon} AI 智能洞察</div><div class="ri-text">${i.text}</div></div>`
    ).join('') : '';

    // ===== (b) 核心数据看板 =====
    const summaryCards = `
      <div class="report-summary-cards">
        <div class="report-summary-card"><div class="rsc-icon">📅</div><div class="rsc-value">${child.stats.consecutiveDays}</div><div class="rsc-label">连续学习天数</div></div>
        <div class="report-summary-card"><div class="rsc-icon">🏆</div><div class="rsc-value">${child.stats.quizzesAnswered}</div><div class="rsc-label">累计答题数</div></div>
        <div class="report-summary-card"><div class="rsc-icon">⭐</div><div class="rsc-value">${correctRate}%</div><div class="rsc-label">综合正确率</div></div>
      </div>`;

    // ===== (c) 科目分布柱状图 =====
    const categoryColors = { '自然科学': '#4CAF50', '历史人文': '#FF9800', '数学思维': '#2196F3', '艺术审美': '#9C27B0', '语言表达': '#00BCD4', '生活常识': '#FF5722' };
    const catCounts = {};
    child.history.forEach(h => {
      const v = allVideos.find(vv => vv.id === h.videoId);
      if (v) catCounts[v.category] = (catCounts[v.category] || 0) + 1;
    });
    const maxCatCount = Math.max(1, ...Object.values(catCounts));
    const barChartHtml = Object.entries(catCounts).map(([cat, count]) => {
      const pct = Math.round(count / maxCatCount * 100);
      const color = categoryColors[cat] || '#888';
      return `<div class="report-bar-row">
        <div class="report-bar-label">${cat}</div>
        <div class="report-bar-track"><div class="report-bar-fill" style="width:${pct}%;background:${color};">${count}</div></div>
      </div>`;
    }).join('');

    // ===== (d) 每周学习趋势 =====
    const dayLabels = ['日', '一', '二', '三', '四', '五', '六'];
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toDateString();
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      const daySeconds = child.history.filter(h => h.timestamp >= dayStart && h.timestamp < dayEnd).reduce((s, h) => s + (h.duration || 0), 0);
      weekData.push({ label: dayLabels[d.getDay()], minutes: Math.round(daySeconds / 60), date: `${d.getMonth()+1}/${d.getDate()}` });
    }
    const maxWeekMin = Math.max(1, ...weekData.map(d => d.minutes));
    const totalWeekMin = weekData.reduce((s, d) => s + d.minutes, 0);
    const avgWeekMin = Math.round(totalWeekMin / 7);
    const weekRange = `${weekData[0].date} ~ ${weekData[6].date}`;
    const weekTrendHtml = weekData.map(d => {
      const ratio = d.minutes / maxWeekMin;
      const h = Math.max(4, Math.round(ratio * 80));
      let color = 'var(--rule)';
      if (d.minutes >= avgWeekMin * 1.5) color = 'var(--accent)';
      else if (d.minutes > 0) color = 'var(--accent2)';
      const barLabel = d.minutes > 0 ? `${d.minutes}分` : '';
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:0.2rem;flex:1;min-width:36px;">
        <div style="font-size:0.58rem;color:var(--muted);font-weight:600;height:14px;">${barLabel}</div>
        <div style="width:100%;max-width:28px;height:${h}px;background:${color};border-radius:4px 4px 0 0;transition:height 0.5s;position:relative;" title="${d.date} ${d.label} ${d.minutes}分钟"></div>
        <div style="font-size:0.7rem;color:var(--ink);font-weight:600;">${d.label}</div>
        <div style="font-size:0.55rem;color:var(--rule);">${d.date}</div>
      </div>`;
    }).join('');

    // ===== (e) 学习活跃热力图（最近4周） =====
    const heatmapCells = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // 找到4周前的周一
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setDate(startOfWeek.getDate() - 21); // go back 3 weeks to have 4 total
    for (let i = 0; i < 28; i++) {
      const dayDate = new Date(startOfWeek.getTime() + i * 86400000);
      const dayStart = dayDate.getTime();
      const dayEnd = dayStart + 86400000;
      const daySec = child.history.filter(h => h.timestamp >= dayStart && h.timestamp < dayEnd).reduce((s, h) => s + (h.duration || 0), 0);
      const dayMin = Math.round(daySec / 60);
      let bg = '#fff';
      let titleText = '';
      if (dayDate > today) {
        bg = 'var(--bg2)';
        titleText = '未来';
      } else if (dayMin === 0) {
        bg = '#fff';
        titleText = `${dayDate.getMonth()+1}/${dayDate.getDate()} 无记录`;
      } else if (dayMin < 10) {
        bg = '#C8E6C9';
        titleText = `${dayDate.getMonth()+1}/${dayDate.getDate()} ${dayMin}分钟`;
      } else if (dayMin <= 30) {
        bg = '#66BB6A';
        titleText = `${dayDate.getMonth()+1}/${dayDate.getDate()} ${dayMin}分钟`;
      } else {
        bg = '#2E7D32';
        titleText = `${dayDate.getMonth()+1}/${dayDate.getDate()} ${dayMin}分钟`;
      }
      heatmapCells.push(`<div class="heatmap-cell" style="background:${bg};border:1px solid var(--rule);" title="${titleText}"></div>`);
    }
    const heatmapHtml = `<div class="report-heatmap">${heatmapCells.join('')}</div>
      <div style="display:flex;align-items:center;gap:0.3rem;margin-top:0.3rem;font-size:0.65rem;color:var(--muted);">
        <span>少</span>
        <div style="width:12px;height:12px;background:#fff;border:1px solid var(--rule);border-radius:2px;"></div>
        <div style="width:12px;height:12px;background:#C8E6C9;border-radius:2px;"></div>
        <div style="width:12px;height:12px;background:#66BB6A;border-radius:2px;"></div>
        <div style="width:12px;height:12px;background:#2E7D32;border-radius:2px;"></div>
        <span>多</span>
      </div>`;

    // ===== (f) 知识回顾 =====
    const wrongItems = [];
    // Iterate all quiz history: for each history item, check if there are quizzes for that video
    // Since we don't store individual quiz results, we'll simulate from history data
    // We'll extract wrong items by looking at the video quizzes and marking some as "wrong" based on stats
    child.history.forEach(h => {
      const v = allVideos.find(vv => vv.id === h.videoId);
      if (!v) return;
      const quizzes = allQuizzes[h.videoId] || [];
      if (quizzes.length === 0) return;
      // If quizzesTaken > 0, we simulate that some could be wrong
      // We show the quiz questions as reference items
      const cat = v.category;
      quizzes.forEach((q, qi) => {
        // Show a sample wrong item (we don't have per-question correct/wrong tracking, so we show all as review items)
        if (wrongItems.length >= 10) return;
        const answerText = q.type === 'fillblank' ? (q.answerText || '') : (q.options ? q.options[q.answer] : '');
        wrongItems.push({
          category: cat,
          question: q.question,
          answer: answerText,
          time: new Date(h.timestamp).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        });
      });
    });

    const wrongHeader = wrongItems.length > 0 ? `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
        <h3 style="margin:0;">知识回顾</h3>
        <button class="btn-secondary" style="padding:0.3rem 0.8rem;font-size:0.78rem;" onclick="App.exportWrongQuestions()" data-tv-focusable>导出图片</button>
      </div>` : '<h3>知识回顾</h3>';

    const wrongListHtml = wrongItems.length > 0 ? `<div class="report-wrong-list">
      ${wrongItems.map(w => `<div class="wrong-item">
        <span class="wi-category">${w.category}</span>
        <div class="wi-content">
          <div class="wi-question">${w.question}</div>
          <div class="wi-answer">正确答案：${w.answer}</div>
        </div>
        <span class="wi-time">${w.time}</span>
      </div>`).join('')}
    </div>` : '<p style="font-size:0.82rem;color:var(--muted);">暂无观看记录下的题目，看视频后即可回顾！</p>';

    // ===== (g) 观看历史（时间线） =====
    const timelineHtml = child.history.length === 0
      ? '<p style="font-size:0.82rem;color:var(--muted);">暂无观看记录</p>'
      : `<div class="report-timeline">${child.history.slice(0, 10).map(h => {
        const v = allVideos.find(vv => vv.id === h.videoId);
        if (!v) return '';
        const pct = Math.round(h.duration / v.duration * 100);
        const badge = pct >= 90 ? '<span class="badge-sm green">完整观看</span>' : pct < 30 ? '<span class="badge-sm orange">跳看</span>' : '';
        const timeStr = new Date(h.timestamp).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        return `<div class="timeline-item">
          <div class="tl-time">${timeStr} · ${Utils.formatMinutes(h.duration)}分钟 ${badge}</div>
          <div class="tl-content">${v.icon} ${v.title}</div>
        </div>`;
      }).join('')}</div>`;

    return `${this._renderParentTabs()}
      <div class="report-header"><h2>学习报告 — <span class="child-name">${child.name}</span></h2></div>

      ${eventStatsHtml}

      ${insightHtml}

      ${summaryCards}

      <div class="report-section">
        <h3>科目分布</h3>
        <div class="report-bar-chart">${barChartHtml || '<p style="font-size:0.82rem;color:var(--muted);">暂无数据</p>'}</div>
      </div>

      <div class="report-section">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.5rem;">
          <h3 style="margin:0;">近7天学习时长</h3>
          <div style="font-size:0.75rem;color:var(--muted);">${weekRange} · 总计 ${totalWeekMin}分钟 · 日均 ${avgWeekMin}分钟</div>
        </div>
        <div style="display:flex;align-items:flex-end;gap:0.3rem;padding:0.8rem 0 0.3rem;">${weekTrendHtml}</div>
        <div style="display:flex;gap:1rem;justify-content:center;font-size:0.68rem;color:var(--muted);margin-top:0.3rem;">
          <span><span style="display:inline-block;width:8px;height:8px;background:var(--accent);border-radius:2px;margin-right:0.2rem;"></span>高于平均</span>
          <span><span style="display:inline-block;width:8px;height:8px;background:var(--accent2);border-radius:2px;margin-right:0.2rem;"></span>有学习</span>
          <span><span style="display:inline-block;width:8px;height:8px;background:var(--rule);border-radius:2px;margin-right:0.2rem;"></span>无记录</span>
        </div>
      </div>

      <div class="report-section">
        <h3>学习活跃热力图（最近4周）</h3>
        <div style="font-size:0.68rem;color:var(--muted);margin-bottom:0.4rem;">周一到周日，颜色越深表示学习时间越长</div>
        ${heatmapHtml}
      </div>

      <div class="report-section">
        <h3>答题明细</h3>
        <div id="report-radar-chart" class="chart-container"></div>
        ${wrongHeader}
        ${wrongListHtml}
      </div>

      <div class="report-section">
        <h3>观看历史</h3>
        ${timelineHtml}
      </div>

      <div class="report-section">
        <h3>视频来源与任务</h3>
        ${this._renderParentTasks()}
      </div>`;
  },

  exportWrongQuestions() {
    const child = Store.activeChild();
    if (!child) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = 2;
    const W = 360 * scale, H = 640 * scale;
    canvas.width = W; canvas.height = H;

    // Background
    ctx.fillStyle = '#FFF8F5';
    ctx.fillRect(0, 0, W, H);

    // Header
    ctx.fillStyle = '#D4663A';
    ctx.fillRect(0, 0, W, 80 * scale);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${22 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`${child.name} 的知识回顾`, W / 2, 48 * scale);

    // Subtitle
    ctx.fillStyle = '#8A8580';
    ctx.font = `${12 * scale}px sans-serif`;
    ctx.fillText(`生成时间：${new Date().toLocaleString('zh-CN')}`, W / 2, 72 * scale);

    // Wrong items
    const allVideos = Data.getAllVideos();
    const allQuizzes = Data.getAllQuizzes();
    let y = 100 * scale;
    let count = 0;
    child.history.forEach(h => {
      if (count >= 5) return;
      const v = allVideos.find(vv => vv.id === h.videoId);
      if (!v) return;
      const quizzes = allQuizzes[h.videoId] || [];
      quizzes.forEach((q, qi) => {
        if (count >= 5 || y > H - 60 * scale) return;
        const answerText = q.type === 'fillblank' ? (q.answerText || '') : (q.options ? q.options[q.answer] : '');
        ctx.fillStyle = '#fff';
        ctx.fillRect(16 * scale, y, W - 32 * scale, 80 * scale);
        ctx.strokeStyle = '#E8E0D8';
        ctx.lineWidth = 1 * scale;
        ctx.strokeRect(16 * scale, y, W - 32 * scale, 80 * scale);
        ctx.fillStyle = '#D4663A';
        ctx.font = `bold ${11 * scale}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(v.category, 24 * scale, y + 18 * scale);
        ctx.fillStyle = '#2D2A26';
        ctx.font = `${13 * scale}px sans-serif`;
        const qText = q.question.length > 18 ? q.question.slice(0, 18) + '...' : q.question;
        ctx.fillText(qText, 24 * scale, y + 40 * scale);
        ctx.fillStyle = '#6B9E78';
        ctx.font = `${11 * scale}px sans-serif`;
        ctx.fillText(`正确答案：${answerText}`, 24 * scale, y + 64 * scale);
        y += 90 * scale;
        count++;
      });
    });

    // Footer
    ctx.fillStyle = '#8A8580';
    ctx.font = `${10 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('萌宠学堂 — 陪伴式虚拟宠物学习应用', W / 2, H - 20 * scale);

    // Download
    const link = document.createElement('a');
    link.download = `${child.name}_错题本_${new Date().toISOString().slice(0,10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  },

  _renderParentTasks() {
    const child = Store.activeChild();
    // Group videos by source
    const allVideos = Data.getAllVideos();
    const sourceMap = {};
    allVideos.forEach(v => {
      const src = v.source || '未知来源';
      if (!sourceMap[src]) sourceMap[src] = [];
      sourceMap[src].push(v);
    });

    // 管理员发布的任务
    const adminTasks = Data.getAllTasks().filter(t => t.status === 'active');
    // 为每个任务计算完成进度（基于该分类视频的观看比例）
    const taskProgress = adminTasks.map(t => {
      const relatedVideos = allVideos.filter(v => v.category === t.category);
      const watched = child.history.filter(h => relatedVideos.some(rv => rv.id === h.videoId));
      const totalDuration = relatedVideos.reduce((s, v) => s + v.duration, 0);
      const watchedDuration = watched.reduce((s, h) => s + h.duration, 0);
      const progress = totalDuration > 0 ? Math.min(Math.round(watchedDuration / totalDuration * 100), 100) : 0;
      return { ...t, progress, relatedVideos: relatedVideos.length, watchedVideos: watched.length };
    });

    let html = '';

    // Source breakdown
    html += `<div class="report-section">
        <h3>家长推送的内容</h3>
        <div class="source-grid">`;
    for (const [src, vids] of Object.entries(sourceMap)) {
      const watchedCount = vids.filter(v => child.history.some(h => h.videoId === v.id)).length;
      html += `<div class="source-card">
        <div class="source-name">${src}</div>
        <div class="source-count">${vids.length}个视频，已看${watchedCount}个</div>
        <div class="source-bar"><div class="source-bar-fill" style="width:${Math.round(watchedCount/vids.length*100)}%"></div></div>
      </div>`;
    }
    html += `</div></div>`;

    // 管理员任务
    if (adminTasks.length > 0) {
      html += `<div class="report-section">
        <h3>平台学习任务</h3>
        <div class="task-progress-list">`;
      taskProgress.forEach(t => {
        const statusText = t.progress >= 100 ? '已完成' : `${t.progress}%`;
        html += `<div class="task-progress-item">
          <div class="tp-header">
            <span class="tp-title">${t.title}</span>
            <span class="tp-status">${t.progress >= 100 ? '✅' : '📌'} ${statusText}</span>
          </div>
          <div class="tp-meta">${t.category} | 已看 ${t.watchedVideos}/${t.relatedVideos} 个视频</div>
          <div class="tp-bar"><div class="tp-bar-fill" style="width:${t.progress}%"></div></div>
        </div>`;
      });
      html += `</div></div>`;
    }

    return html;
  },

  _renderParentControl() {
    const child = Store.activeChild();
    if (!child) return '';
    const used = child.stats.totalWatchTime;
    const limit = child.controls.dailyLimit * 60;
    const remaining = Math.max(0, limit - used);
    const usedPct = limit > 0 ? Math.min(100, Math.round(used / limit * 100)) : 0;
    const allowedSlots = child.controls.allowedSlots || [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];
    const isPaused = child.controls.paused || false;
    const eyeCare = child.controls.eyeCare !== false;

    // ===== (a) 每日时长管控卡片 =====
    const limitOptions = [10, 20, 30, 40, 60, 90, 120];
    const limitChips = limitOptions.map(m =>
      `<div class="time-slot ${child.controls.dailyLimit === m ? 'active' : ''}" data-tv-focusable onclick="App.setDailyLimit(${m})">${m}分</div>`
    ).join('');

    // ===== (b) 时段管控卡片 =====
    const slotItems = [];
    for (let h = 0; h < 24; h++) {
      const isLocked = h >= 22 || h < 6;
      const isActive = allowedSlots.includes(h);
      const cls = isLocked ? 'disabled' : (isActive ? 'active' : '');
      const label = `${String(h).padStart(2, '0')}:00`;
      slotItems.push(`<div class="time-slot ${cls}" ${!isLocked ? `data-tv-focusable onclick="App.toggleTimeSlot(${h})"` : ''}>${label}</div>`);
    }

    // ===== (c) 内容分级 =====
    const contentLevel = child.controls.contentLevel || 'standard';
    const levelLabels = { relaxed: '宽松', standard: '标准', strict: '严格' };
    const levelLabel = levelLabels[contentLevel] || '标准';

    return `${this._renderParentTabs()}
      <div class="report-header"><h2>管控设置 — <span class="child-name">${child.name}</span></h2></div>

      ${isPaused ? `<div style="background:var(--danger-light);border:2px solid var(--danger);border-radius:var(--radius);padding:0.8rem 1rem;margin-bottom:0.8rem;text-align:center;">
        <div style="font-size:1rem;font-weight:700;color:var(--danger);margin-bottom:0.3rem;">⛔ 已暂停使用</div>
        <div style="font-size:0.78rem;color:var(--muted);margin-bottom:0.5rem;">${child.name}的账号已被暂停，需要家长解除</div>
        <button class="btn-primary" data-tv-focusable onclick="App.resumeUsage()">解除暂停</button>
      </div>` : ''}

      <div class="control-card">
        <div class="cc-title">⏱️ 每日时长管控</div>
        <div class="cc-desc">已使用 ${Utils.formatMinutes(used)} 分钟，剩余 ${Utils.formatMinutes(remaining)} 分钟</div>
        <div style="height:8px;background:var(--bg2);border-radius:4px;overflow:hidden;margin-bottom:0.6rem;">
          <div style="height:100%;width:${usedPct}%;background:${usedPct > 80 ? 'var(--danger)' : 'var(--accent2)'};border-radius:4px;transition:width 0.5s;"></div>
        </div>
        <div class="time-slots">${limitChips}</div>
      </div>

      <div class="control-card">
        <div class="cc-title">🕐 时段管控</div>
        <div class="cc-desc">点击切换允许/禁止，22:00-06:00 法规锁定不可更改</div>
        <div class="time-slots">${slotItems.join('')}</div>
      </div>

      <div class="control-card">
        <div class="cc-title">📂 内容分级管控</div>
        <div class="cc-desc">当前级别：${levelLabel}，点击前往详细设置</div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <span class="badge-sm ${contentLevel === 'strict' ? 'red' : contentLevel === 'relaxed' ? 'green' : 'orange'}">${levelLabel}</span>
          </div>
          <button class="btn-secondary" data-tv-focusable onclick="Router.navigate('parent-content')" style="font-size:0.78rem;">前往设置</button>
        </div>
      </div>

      <div class="control-card">
        <div class="cc-title">👁️ 护眼提醒</div>
        <div class="cc-desc">每30分钟自动提醒${child.name}休息眼睛</div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:0.82rem;">${eyeCare ? '已开启' : '已关闭'}</span>
          <div class="toggle-switch ${eyeCare ? 'on' : ''}" data-tv-focusable onclick="App.toggleEyeCare()"></div>
        </div>
      </div>

      <div class="control-card">
        <div class="cc-title">🎮 远程操控</div>
        <div class="cc-desc">远程对${child.name}的设备发送指令</div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button class="btn-secondary" data-tv-focusable onclick="App.sendSleepSignal()" style="flex:1;min-width:120px;">
            🌙 该睡觉了
          </button>
          ${!isPaused ? `<button class="btn-secondary" data-tv-focusable onclick="App.pauseUsage()" style="flex:1;min-width:120px;border-color:var(--danger);color:var(--danger);">
            ⏸️ 暂停使用
          </button>` : ''}
          <button class="btn-secondary" data-tv-focusable onclick="App.sendEncourage()" style="flex:1;min-width:120px;${isPaused ? 'opacity:0.3;pointer-events:none;' : ''}">
            ❤️ 发送鼓励
          </button>
        </div>
      </div>

      <div class="control-card">
        <div class="cc-title">💬 即时消息</div>
        <div class="cc-desc">发送消息到${child.name}的屏幕顶部</div>
        ${!isPaused ? `<div style="display:flex;gap:0.5rem;margin-top:0.5rem;">
          <input type="text" id="parent-msg-input" placeholder="输入要发送的消息..." data-tv-focusable
            style="flex:1;padding:0.5rem 0.8rem;border:2px solid var(--rule);border-radius:var(--radius-sm);font-size:0.85rem;font-family:inherit;"
            onkeydown="if(event.key==='Enter')App.sendParentMessage()" />
          <button class="btn-primary" data-tv-focusable onclick="App.sendParentMessage()" style="padding:0.5rem 1rem;font-size:0.85rem;">发送</button>
        </div>` : '<div style="color:var(--muted);font-size:0.82rem;">账号已暂停，无法发送消息</div>'}
        ${Store.state.parentMessages.length > 0 ? `<div style="margin-top:0.5rem;font-size:0.75rem;color:var(--muted);">最近消息：${Store.state.parentMessages.slice(-3).map(m => '<span style=\"background:var(--bg2);padding:0.1rem 0.4rem;border-radius:6px;margin:0 0.2rem;\">' + m.text + '</span>').join('')}</div>` : ''}
      </div>

      <div class="report-section" style="margin-top:1rem;">
        <h3>快捷操作</h3>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.5rem;">
          <button class="btn-secondary" data-tv-focusable onclick="App.goRoom()">🏠 宠物小屋</button>
          <button class="btn-secondary" data-tv-focusable onclick="Router.navigate('growth')">📊 成长记录</button>
          <button class="btn-secondary" data-tv-focusable onclick="App.adoptNewPet()">🐾 领养新宠物</button>
        </div>
      </div>
      <div class="report-section" style="margin-top:1.5rem;border:1px dashed var(--danger);border-radius:12px;padding:1rem;">
        <h3 style="color:var(--danger);">⚠️ 危险操作</h3>
        <p style="font-size:0.78rem;color:var(--muted);margin:0.3rem 0 0.5rem;">重置将清除所有儿童数据、宠物成长记录和学习历史，此操作不可撤销。</p>
        <button class="btn-secondary" data-tv-focusable onclick="App.resetData()" style="border-color:var(--danger);color:var(--danger);">🗑️ 重置所有数据</button>
      </div>`;
  },

  // --- Parent Quiz Create ---
  _renderParentQuizCreate() {
    const step = Store.state.parentQuizStep || 'category';
    const draft = Store.state.parentQuizDraft || {};
    const categories = Data.getAllCategories();
    const templates = Data.questionTypeTemplates;
    const existingQuizzes = Data.getParentQuizzes({ status: 'active' });

    let stepHtml = '';

    if (step === 'category') {
      stepHtml = `
        <div class="pq-step-title"><span class="pq-step-num">1</span> 选择知识分类</div>
        <div class="pq-grid">
          ${categories.map(cat => `
            <div class="pq-card ${draft.category === cat ? 'selected' : ''}" data-tv-focusable onclick="App.selectQuizCategory('${cat}')">
              <div class="pq-card-icon">${this._categoryIcon(cat)}</div>
              <div class="pq-card-name">${cat}</div>
              <div class="pq-card-hint">${(Data.quizCategoryHints[cat] || []).slice(0, 2).join(' · ')}</div>
            </div>
          `).join('')}
        </div>`;
    } else if (step === 'type') {
      stepHtml = `
        <div class="pq-step-title"><span class="pq-step-num">2</span> 选择题型</div>
        <div class="pq-type-list">
          ${templates.map(t => `
            <div class="pq-type-card ${draft.type === t.id ? 'selected' : ''}" data-tv-focusable onclick="App.selectQuizType('${t.id}')">
              <div class="pq-type-icon">${t.icon}</div>
              <div class="pq-type-info">
                <div class="pq-type-name">${t.name}</div>
                <div class="pq-type-desc">${t.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>`;
    } else if (step === 'difficulty') {
      const tmpl = templates.find(t => t.id === draft.type);
      const diffs = tmpl ? tmpl.difficulties : {};
      stepHtml = `
        <div class="pq-step-title"><span class="pq-step-num">3</span> 选择难度级别</div>
        <div class="pq-diff-list">
          ${Object.entries(diffs).map(([key, d]) => `
            <div class="pq-diff-card ${draft.difficulty === key ? 'selected' : ''} pq-diff-${key}" data-tv-focusable onclick="App.selectQuizDifficulty('${key}')">
              <div class="pq-diff-badge">${d.name}</div>
              <div class="pq-diff-desc">${d.desc}</div>
              <div class="pq-diff-meta">${draft.type === 'fillblank' ? '最多' + d.maxLength + '字' : d.optionCount + '个选项'} ${d.hasHint ? '· 提供提示' : ''}</div>
            </div>
          `).join('')}
        </div>`;
    } else if (step === 'edit') {
      const tmpl = templates.find(t => t.id === draft.type);
      const diff = tmpl?.difficulties?.[draft.difficulty];
      stepHtml = `
        <div class="pq-step-title"><span class="pq-step-num">4</span> 编辑题目内容</div>
        <div class="pq-edit-panel">
          <div class="pq-edit-meta">
            <span class="pq-meta-tag">${draft.category}</span>
            <span class="pq-meta-tag">${tmpl?.name}</span>
            <span class="pq-meta-tag">${diff?.name}</span>
          </div>
          <div class="form-group">
            <label>题目内容</label>
            <textarea id="pq-question" class="pq-textarea" rows="3" placeholder="请输入题目，例如：蝴蝶是由什么变成的？">${draft.question || ''}</textarea>
          </div>
          ${draft.type === 'choice' ? `
            <div class="form-group">
              <label>选项（用换行或逗号分隔）</label>
              <textarea id="pq-options" class="pq-textarea" rows="3" placeholder="例如：毛毛虫&#10;蚯蚓&#10;蜘蛛">${(draft.options || []).join('\n')}</textarea>
              <div class="pq-field-hint">请提供 ${diff?.optionCount || 2} 个选项</div>
            </div>
            <div class="form-group">
              <label>正确答案（填写选项序号 1, 2, 3...）</label>
              <input type="number" id="pq-answer" class="pq-input" min="1" max="${diff?.optionCount || 4}" value="${draft.answer !== undefined ? draft.answer + 1 : ''}">
            </div>
          ` : draft.type === 'truefalse' ? `
            <div class="form-group">
              <label>正确答案</label>
              <div class="pq-tf-group">
                <button class="pq-tf-btn ${draft.answer === 1 ? 'selected' : ''}" onclick="App.setTfAnswer(1)" data-tv-focusable>✅ 正确</button>
                <button class="pq-tf-btn ${draft.answer === 0 ? 'selected' : ''}" onclick="App.setTfAnswer(0)" data-tv-focusable>❌ 错误</button>
              </div>
            </div>
          ` : `
            <div class="form-group">
              <label>正确答案（最多 ${diff?.maxLength || 15} 个字）</label>
              <input type="text" id="pq-answer-text" class="pq-input" maxlength="${diff?.maxLength || 15}" value="${draft.answerText || ''}" placeholder="请输入答案">
            </div>
          `}
          <div class="form-group">
            <label>知识点标签（可选）</label>
            <input type="text" id="pq-knowledge" class="pq-input" value="${draft.knowledge || ''}" placeholder="例如：昆虫变态发育">
          </div>
        </div>`;
    } else if (step === 'preview') {
      stepHtml = `
        <div class="pq-step-title"><span class="pq-step-num">5</span> 预览并发布</div>
        <div class="pq-preview-panel">
          <div class="pq-preview-card">
            <div class="pq-preview-header">
              <span class="pq-meta-tag">${draft.category}</span>
              <span class="pq-meta-tag">${draft.typeName}</span>
              <span class="pq-meta-tag">${draft.difficultyName}</span>
            </div>
            <div class="pq-preview-question">${draft.question}</div>
            ${draft.type === 'choice' ? `
              <div class="pq-preview-options">
                ${draft.options.map((opt, i) => `
                  <div class="pq-preview-opt ${draft.answer === i ? 'correct' : ''}">
                    <span class="pq-preview-idx">${['A','B','C','D'][i]}</span> ${opt}
                    ${draft.answer === i ? '<span class="pq-correct-mark">✓</span>' : ''}
                  </div>
                `).join('')}
              </div>
            ` : draft.type === 'truefalse' ? `
              <div class="pq-preview-tf">正确答案：${draft.answer === 1 ? '✅ 正确' : '❌ 错误'}</div>
            ` : `
              <div class="pq-preview-tf">正确答案：${draft.answerText}</div>
            `}
            ${draft.knowledge ? `<div class="pq-preview-knowledge">💡 知识点：${draft.knowledge}</div>` : ''}
          </div>
        </div>`;
    }

    // Step indicator
    const steps = ['category', 'type', 'difficulty', 'edit', 'preview'];
    const stepIdx = steps.indexOf(step);
    const progressDots = steps.map((s, i) => `<span class="pq-dot ${i <= stepIdx ? 'active' : ''} ${i === stepIdx ? 'current' : ''}"></span>`).join('');

    return `${this._renderParentTabs()}
      <div class="report-header"><h2>自定义出题</h2><p style="font-size:0.8rem;color:var(--muted);">为${Store.activeChild()?.name || '孩子'}量身定制练习题</p></div>
      <div class="pq-stepper">${progressDots}</div>
      <div class="pq-container">
        ${stepHtml}
      </div>
      <div class="pq-actions-bar">
        ${step !== 'category' ? `<button class="btn-secondary" data-tv-focusable onclick="App.prevQuizStep()">上一步</button>` : '<span></span>'}
        ${step === 'preview' ? `<button class="btn-primary" data-tv-focusable onclick="App.publishParentQuiz()">🚀 发布题目</button>` : `<button class="btn-primary" data-tv-focusable onclick="App.nextQuizStep()">下一步</button>`}
      </div>

      <div class="report-section" style="margin-top:1.5rem;">
        <h3>已发布的题目 (${existingQuizzes.length})</h3>
        ${existingQuizzes.length === 0 ? '<p style="font-size:0.82rem;color:var(--muted);">还没有发布过题目，开始创建第一道题吧！</p>' :
          `<div class="pq-list">
            ${existingQuizzes.map(q => `
              <div class="pq-item">
                <div class="pq-item-main">
                  <div class="pq-item-q">${q.question}</div>
                  <div class="pq-item-meta">
                    <span class="pq-meta-tag">${q.category}</span>
                    <span class="pq-meta-tag">${q.typeName}</span>
                    <span class="pq-meta-tag">${q.difficultyName}</span>
                  </div>
                </div>
                <div class="pq-item-actions">
                  <button class="pq-item-btn" onclick="App.deleteParentQuizItem('${q.id}')" title="删除">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>`}
      </div>`;
  },

  _categoryIcon(cat) {
    const map = { '自然科学': '🔬', '历史人文': '📜', '数学思维': '🔢', '艺术审美': '🎨', '语言表达': '🗣️', '生活常识': '🏠' };
    return map[cat] || '📚';
  },

  selectQuizCategory(cat) {
    Store.set({ parentQuizDraft: { ...Store.state.parentQuizDraft, category: cat }, parentQuizStep: 'type' });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  selectQuizType(typeId) {
    const draft = Store.state.parentQuizDraft || {};
    const tmpl = Data.questionTypeTemplates.find(t => t.id === typeId);
    Store.set({ parentQuizDraft: { ...draft, type: typeId, typeName: tmpl?.name || typeId }, parentQuizStep: 'difficulty' });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  selectQuizDifficulty(diff) {
    const draft = Store.state.parentQuizDraft || {};
    const tmpl = Data.questionTypeTemplates.find(t => t.id === draft.type);
    const diffName = tmpl?.difficulties?.[diff]?.name || diff;
    Store.set({ parentQuizDraft: { ...draft, difficulty: diff, difficultyName: diffName }, parentQuizStep: 'edit' });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  setTfAnswer(val) {
    const draft = Store.state.parentQuizDraft || {};
    Store.set({ parentQuizDraft: { ...draft, answer: val } });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  nextQuizStep() {
    const step = Store.state.parentQuizStep;
    const draft = Store.state.parentQuizDraft || {};
    const steps = ['category', 'type', 'difficulty', 'edit', 'preview'];
    const idx = steps.indexOf(step);

    if (step === 'edit') {
      // Validate and collect data
      const question = document.getElementById('pq-question')?.value.trim();
      if (!question) { App._alert('请输入题目内容'); return; }

      let answer = undefined;
      let options = [];
      let answerText = '';

      if (draft.type === 'choice') {
        const optsRaw = document.getElementById('pq-options')?.value || '';
        options = optsRaw.split(/[\n,，]/).map(s => s.trim()).filter(Boolean);
        const ansIdx = parseInt(document.getElementById('pq-answer')?.value, 10);
        if (options.length < 2) { App._alert('请至少提供2个选项'); return; }
        if (!ansIdx || ansIdx < 1 || ansIdx > options.length) { App._alert('请填写正确的答案序号'); return; }
        answer = ansIdx - 1;
      } else if (draft.type === 'truefalse') {
        if (draft.answer === undefined) { App._alert('请选择正确答案'); return; }
        answer = draft.answer;
      } else {
        answerText = document.getElementById('pq-answer-text')?.value.trim();
        if (!answerText) { App._alert('请输入正确答案'); return; }
      }

      const knowledge = document.getElementById('pq-knowledge')?.value.trim() || '';
      Store.set({
        parentQuizDraft: {
          ...draft, question, options, answer, answerText, knowledge,
          optionCount: options.length
        },
        parentQuizStep: 'preview'
      });
    } else {
      if (idx < steps.length - 1) {
        Store.set({ parentQuizStep: steps[idx + 1] });
      }
    }
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  prevQuizStep() {
    const steps = ['category', 'type', 'difficulty', 'edit', 'preview'];
    const idx = steps.indexOf(Store.state.parentQuizStep);
    if (idx > 0) Store.set({ parentQuizStep: steps[idx - 1] });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  publishParentQuiz() {
    const draft = Store.state.parentQuizDraft;
    if (!draft || !draft.question) return;

    const quiz = {
      category: draft.category,
      type: draft.type,
      typeName: draft.typeName,
      difficulty: draft.difficulty,
      difficultyName: draft.difficultyName,
      question: draft.question,
      options: draft.type === 'choice' ? draft.options : (draft.type === 'truefalse' ? ['错误', '正确'] : []),
      answer: draft.type === 'fillblank' ? -1 : draft.answer,
      answerText: draft.type === 'fillblank' ? draft.answerText : undefined,
      knowledge: draft.knowledge || ''
    };

    Data.addParentQuiz(quiz);
    App._alert('题目发布成功！孩子端可以看到啦');
    Store.set({ parentQuizStep: 'category', parentQuizDraft: null });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  deleteParentQuizItem(id) {
    App._confirm('确定要删除这道题吗？', () => {
      Data.deleteParentQuiz(id);
      this.render();
      setTimeout(() => Remote.refresh(), 50);
    });
  },

  cycleTimeLimit() {
    const child = Store.activeChild();
    const options = [15, 30, 45, 60, 90];
    const idx = options.indexOf(child.controls.dailyLimit);
    child.controls.dailyLimit = options[(idx + 1) % options.length];
    Store.updateChild(Store.state.activeChildIndex, { controls: child.controls });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  toggleContentMode() {
    const child = Store.activeChild();
    child.controls.contentMode = child.controls.contentMode === 'recommended' ? 'open' : 'recommended';
    Store.updateChild(Store.state.activeChildIndex, { controls: child.controls });
    this.render();
  },

  toggleEyeCare() {
    const child = Store.activeChild();
    if (!child) return;
    const current = child.controls.eyeCare || false;
    Store.updateChild(Store.state.activeChildIndex, { controls: { ...child.controls, eyeCare: !current } });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  toggleTimeSlot(hour) {
    if (hour >= 22 || hour < 6) return; // 法规锁定
    const child = Store.activeChild();
    if (!child) return;
    let slots = [...(child.controls.allowedSlots || [])];
    if (slots.includes(hour)) { slots = slots.filter(h => h !== hour); }
    else { slots.push(hour); slots.sort(); }
    Store.updateChild(Store.state.activeChildIndex, { controls: { ...child.controls, allowedSlots: slots } });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  setDailyLimit(minutes) {
    const child = Store.activeChild();
    if (!child) return;
    Store.updateChild(Store.state.activeChildIndex, { controls: { ...child.controls, dailyLimit: minutes } });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  sendEncourage() {
    // 设置一个标志，在儿童端播放器中检测并显示爱心动画
    Store.set({ encourageFlag: Date.now() });
    App._alert('已发送鼓励，宝贝的宠物会收到一份爱心哦！');
  },

  pauseUsage() {
    const child = Store.activeChild();
    if (!child) return;
    Data.trackEvent('parent_pause', { childName: child?.name });
    Store.updateChild(Store.state.activeChildIndex, { controls: { ...child.controls, paused: true } });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  resumeUsage() {
    const child = Store.activeChild();
    if (!child) return;
    Store.updateChild(Store.state.activeChildIndex, { controls: { ...child.controls, paused: false } });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  // --- Parent Content Management ---
  _renderParentContent() {
    const child = Store.activeChild();
    if (!child) return '';
    const level = child.controls.contentLevel || 'standard';
    const whitelisted = child.controls.whitelistedCreators || [];
    const customVideos = child.controls.customVideos || [];
    const blacklist = child.controls.blacklistKeywords || [];
    const creators = Data.creators || [];

    const levelConfig = {
      relaxed: { icon: '🌿', name: '宽松模式', desc: '前置过滤不适宜内容，保留较宽观看范围' },
      standard: { icon: '🛡️', name: '标准模式', desc: '仅开放经审核的少儿内容池（默认推荐）' },
      strict: { icon: '🔒', name: '严格模式', desc: '白名单模式，只能看家长选定的博主内容' }
    };

    let levelCards = '';
    for (const [key, cfg] of Object.entries(levelConfig)) {
      levelCards += `
        <div class="content-level-card ${level === key ? 'active' : ''}" data-tv-focusable onclick="App.toggleContentLevel('${key}')">
          <span class="cl-icon">${cfg.icon}</span>
          <div class="cl-name">${cfg.name}</div>
          <div class="cl-desc">${cfg.desc}</div>
        </div>`;
    }

    let creatorCards = '';
    creators.forEach(c => {
      const isFollowed = whitelisted.includes(c.id);
      creatorCards += `
        <div class="creator-card ${isFollowed ? 'followed' : ''}" data-tv-focusable onclick="App.toggleCreator('${c.id}')">
          <span class="cc-avatar">${c.avatar}</span>
          <div class="cc-info">
            <div class="cc-name">
              ${c.name}
              ${c.recommended ? '<span class="cc-rec">推荐</span>' : ''}
            </div>
            <div class="cc-meta">${c.desc} · ${c.categories.join(', ')} · ${c.videoCount}个视频 · ${c.subscriberCount}订阅</div>
          </div>
          <span class="cc-follow">${isFollowed ? '✓ 已关注' : '+ 关注'}</span>
          ${this._renderTipButton(c.id)}
        </div>`;
    });

    const categoryOptions = ['自然科学', '历史人文', '数学思维', '艺术审美', '语言表达', '生活常识'].map(c => `<option value="${c}">${c}</option>`).join('');
    const ageOptions = ['3-6', '7-9', '10-12'].map(a => `<option value="${a}">${a}岁</option>`).join('');

    let customVideoList = '';
    customVideos.forEach((v, i) => {
      customVideoList += `
        <div class="custom-video-item">
          <div class="cvi-info">
            <div class="cvi-title">${v.title}</div>
            <div class="cvi-url">${v.url}</div>
          </div>
          <button class="child-delete-btn" onclick="App.deleteCustomVideo(${i})">删除</button>
        </div>`;
    });

    let blacklistTags = '';
    blacklist.forEach((kw, i) => {
      blacklistTags += `<span class="bl-tag">${kw} <span class="bl-remove" onclick="App.removeBlacklistKeyword(${i})">✕</span></span>`;
    });

    return `${this._renderParentTabs()}
      <div class="report-header"><h2>📚 内容管理 — <span class="child-name">${child.name}</span></h2></div>

      <div class="report-section">
        <h3>管控级别</h3>
        <div class="content-level-cards">${levelCards}</div>
      </div>

      <div class="report-section">
        <h3>博主管理${level === 'strict' ? ' <span style="font-size:0.72rem;color:var(--danger);font-weight:400;">（严格模式：仅白名单博主可观看）</span>' : ''}</h3>
        <div class="creator-list">${creatorCards}</div>
      </div>

      <div class="report-section">
        <h3>自定义视频</h3>
        <div class="custom-video-form">
          <input type="text" id="cv-title" placeholder="视频标题" data-tv-focusable />
          <input type="url" id="cv-url" placeholder="视频链接" data-tv-focusable />
          <select id="cv-category" data-tv-focusable>${categoryOptions}</select>
          <select id="cv-age" data-tv-focusable>${ageOptions}</select>
          <button class="btn-primary" style="padding:0.5rem 1rem;font-size:0.82rem;" onclick="App.addCustomVideo()" data-tv-focusable>+ 添加</button>
        <div style="font-size:0.72rem;color:var(--muted);margin-top:0.3rem;">📌 自定义视频将在后续版本支持在线播放，当前仅记录管理</div>
        </div>
        ${customVideoList || '<div class="empty-state" style="padding:1rem;"><span style="font-size:1.5rem;">📋</span><br>暂无自定义视频</div>'}
      </div>

      <div class="report-section">
        <h3>关键词黑名单</h3>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          <input type="text" id="bl-keyword" placeholder="输入屏蔽关键词" style="flex:1;padding:0.5rem 0.8rem;border:2px solid var(--rule);border-radius:var(--radius-sm);font-size:0.82rem;font-family:inherit;" data-tv-focusable />
          <button class="btn-primary" style="padding:0.5rem 1rem;font-size:0.82rem;" onclick="App.addBlacklistKeyword()" data-tv-focusable>+ 添加</button>
        </div>
        <div class="blacklist-section">
          <div class="blacklist-tags">${blacklistTags || '<span style="font-size:0.78rem;color:var(--muted);">暂无屏蔽关键词</span>'}</div>
        </div>
      </div>`;
  },

  toggleContentLevel(level) {
    const child = Store.activeChild();
    if (!child) return;
    Store.updateChild(Store.state.activeChildIndex, { controls: { ...child.controls, contentLevel: level } });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  toggleCreator(creatorId) {
    const child = Store.activeChild();
    if (!child) return;
    let list = [...(child.controls.whitelistedCreators || [])];
    if (list.includes(creatorId)) { list = list.filter(id => id !== creatorId); }
    else { list.push(creatorId); }
    Store.updateChild(Store.state.activeChildIndex, { controls: { ...child.controls, whitelistedCreators: list } });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  addCustomVideo() {
    const title = document.getElementById('cv-title')?.value?.trim();
    const url = document.getElementById('cv-url')?.value?.trim();
    const category = document.getElementById('cv-category')?.value;
    const ageGroup = document.getElementById('cv-age')?.value;
    if (!title || !url) { App._alert('请填写视频标题和链接'); return; }
    const child = Store.activeChild();
    if (!child) return;
    const videos = [...(child.controls.customVideos || []), { title, url, category: category || '自然科学', ageGroup: ageGroup || '7-9', addedAt: Date.now() }];
    Store.updateChild(Store.state.activeChildIndex, { controls: { ...child.controls, customVideos: videos } });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  deleteCustomVideo(idx) {
    const child = Store.activeChild();
    if (!child) return;
    const videos = [...(child.controls.customVideos || [])];
    videos.splice(idx, 1);
    Store.updateChild(Store.state.activeChildIndex, { controls: { ...child.controls, customVideos: videos } });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  addBlacklistKeyword() {
    const input = document.getElementById('bl-keyword');
    const kw = input?.value?.trim();
    if (!kw) return;
    const child = Store.activeChild();
    if (!child) return;
    const list = [...(child.controls.blacklistKeywords || []), kw];
    Store.updateChild(Store.state.activeChildIndex, { controls: { ...child.controls, blacklistKeywords: list } });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },

  removeBlacklistKeyword(idx) {
    const child = Store.activeChild();
    if (!child) return;
    const list = [...(child.controls.blacklistKeywords || [])];
    list.splice(idx, 1);
    Store.updateChild(Store.state.activeChildIndex, { controls: { ...child.controls, blacklistKeywords: list } });
    this.render();
    setTimeout(() => Remote.refresh(), 50);
  },
  // --- Tip Creator (打赏博主) ---
  _renderTipButton(creatorId) {
    return `<button class="tip-btn" onclick="App.showTipModal('${creatorId}')" data-tv-focusable title="给博主打赏">💰 打赏</button>`;
  },

  showTipModal(creatorId) {
    const creator = Data.creators.find(c => c.id === creatorId);
    if (!creator) return;
    const q = this._generateMathQuestion();
    this._showModal(`💰 打赏 ${creator.name}`, `<div style="text-align:center;margin-bottom:1rem;">
        <div style="font-size:2.5rem;margin-bottom:0.5rem;">${creator.avatar}</div>
        <div style="font-size:1.1rem;font-weight:600;">${creator.name}</div>
        <div style="font-size:0.82rem;color:var(--muted);">${creator.desc}</div>
      </div>
      <div class="form-group">
        <label>打赏金额（元）</label>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.3rem;">
          ${[1,2,5,10,20,50].map(a => `<button class="tip-amount-chip" onclick="App._selectTipAmount(${a})" data-tv-focusable>¥${a}</button>`).join('')}
          <input type="number" id="tip-custom" placeholder="自定义" style="width:80px;padding:0.4rem;border:2px solid var(--rule);border-radius:8px;text-align:center;" />
        </div>
      </div>
      <div class="math-verify"><div class="mv-label">🔐 家长验证 — 请回答以下问题确认您是家长</div>
        <div class="mv-question">${q.question}</div>
        <input type="number" id="math-answer-tip" class="mv-input" placeholder="输入答案" data-tv-focusable />
      </div>
      <div class="modal-actions"><button class="btn-primary" onclick="App._verifyAndTip('${creatorId}', ${q.answer})">确认打赏</button></div>`, null, null, true);
  },

  _selectedTipAmount: null,

  _selectTipAmount(amount) {
    this._selectedTipAmount = amount;
    document.querySelectorAll('.tip-amount-chip').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('tip-custom').value = '';
  },

  _generateMathQuestion() {
    const ops = [
      () => { const a = 10 + Math.floor(Math.random() * 80), b = 10 + Math.floor(Math.random() * 80); return { question: `${a} + ${b} = ?`, answer: a + b }; },
      () => { let a = 30 + Math.floor(Math.random() * 70), b = 10 + Math.floor(Math.random() * 29); return { question: `${a} - ${b} = ?`, answer: a - b }; },
      () => { const a = 2 + Math.floor(Math.random() * 8), b = 2 + Math.floor(Math.random() * 8); return { question: `${a} \u00d7 ${b} = ?`, answer: a * b }; }
    ];
    return ops[Math.floor(Math.random() * ops.length)]();
  },

  _verifyAndTip(creatorId, expectedAnswer) {
    const ans = parseInt(document.getElementById('math-answer-tip')?.value);
    if (ans !== expectedAnswer) { App._alert('验证答案不正确，请重试'); return; }
    let amount = this._selectedTipAmount;
    const custom = parseFloat(document.getElementById('tip-custom')?.value);
    if (!amount && custom && custom > 0) amount = custom;
    if (!amount || amount <= 0) { App._alert('请选择或输入打赏金额'); return; }
    const creator = Data.creators.find(c => c.id === creatorId);
    if (!creator) return;
    this._simulateTip(creator, amount);
  },

  _simulateTip(creator, amount) {
    Data.trackEvent('creator_tip', { creatorId: creator.id, creatorName: creator.name, amount: amount });
    const btn = document.querySelector('.modal-actions .btn-primary');
    if (btn) { btn.textContent = '支付中...'; btn.disabled = true; }
    setTimeout(() => {
      creator.tips = (creator.tips || 0) + amount;
      this._closeModal();
      App._alert(`🎉 打赏成功！\n已向「${creator.name}」打赏 ¥${amount}`);
      this.render();
    }, 1200);
  },

  // --- Demo shortcuts ---
  wakeUpQuiz() {
    const p = Store.state.player;
    if (!p.videoId) return;
    const quizzes = Data.quizzes[p.videoId] || [];
    if (quizzes.length === 0) { App._alert('当前视频暂无题目'); return; }
    // Find first unanswered quiz
    let idx = 0;
    for (let i = 0; i < quizzes.length; i++) {
      if (!p.quizShown.includes(i)) { idx = i; break; }
    }
    if (p.quizShown.includes(idx) && p.quizShown.length >= quizzes.length) {
      App._alert('当前视频题目已全部完成');
      return;
    }
    p.isPlaying = false;
    Store.set({ player: p });
    this._showQuiz(idx);
  },

  addWatchTimeDemo() {
    const child = Store.activeChild();
    if (!child) return;
    const pet = PetLogic.getActivePet(child);
    const seconds = 300; // 5 minutes
    child.stats.totalWatchTime += seconds;
    child.stats.effectiveWatchTime += seconds;
    if (pet) { pet.petGrowthValue = (pet.petGrowthValue || 0) + 5; }
    // Record to history if there's a playing video
    const p = Store.state.player;
    if (p.videoId) {
      const existing = child.history.findIndex(h => h.videoId === p.videoId);
      const record = { videoId: p.videoId, duration: (child.history.find(h => h.videoId === p.videoId)?.duration || 0) + seconds, timestamp: Date.now(), quizzesTaken: p.quizShown.length };
      if (existing >= 0) child.history[existing] = record;
      else child.history.unshift(record);
    }
    Store.updateChild(Store.state.activeChildIndex, { stats: child.stats, pets: child.pets, history: child.history });
    PetLogic._checkUnlocks(child);
    PetLogic._checkPetCompletion(child);
    // Check stage change
    const oldStage = this._lastStage;
    const newStage = PetLogic.getCurrentStage(child);
    const activePet = PetLogic.getActivePet(child);
    if (oldStage && newStage && oldStage.name !== newStage.name) {
      this._showStageChange(newStage.icon, `${newStage.name}！`, `${activePet.variety}成长了`);
    }
    this._lastStage = newStage;
    this._petCelebrate();
    // Update player display
    this.render();
  },

  sendParentMessage() {
    const input = document.getElementById('parent-msg-input');
    const text = input?.value?.trim();
    if (!text) return;
    if (text.length > 50) { App._alert('消息不能超过50个字'); return; }
    const msgs = [...(Store.state.parentMessages || []), { text, timestamp: Date.now() }];
    // 最多保留20条
    if (msgs.length > 20) msgs.splice(0, msgs.length - 20);
    Store.set({ parentMessages: msgs });
    this.render();
  },

  dismissParentMessage(index) {
    const msgs = Store.state.parentMessages || [];
    msgs.splice(index, 1);
    Store.set({ parentMessages: msgs });
    this.render();
  },

  sendSleepSignal() {
    Data.trackEvent('parent_sleep_signal', { childName: Store.activeChild()?.name });
    Store.set({ isSleeping: true, sleepSignalTime: Date.now() });
    if (Store.state.currentScreen === 'player') { this.render(); }
  },
  wakeUpChild() {
    Store.set({ isSleeping: false });
    this.render();
  },

  resetData() {
    App._confirm('确定要重置所有数据吗？这将清除所有儿童、宠物、学习记录和管理员配置。此操作不可撤销。', () => {
      // 关闭3D场景
      if (App._room3D && App._room3D.renderer) { App._destroyRoom3D(); }
      // 清除全部localStorage
      Utils.clearLocal();
      App._alert('数据已全部清除，即将重新加载');
      setTimeout(() => location.reload(), 1000);
    });
  },

  // --- Mode Switch ---
  switchToParent() {
    Store.set({ mode: 'parent', parentTab: 'report' });
    Router.navigate('parent-report');
  },

  switchToChild() {
    Store.set({ mode: 'child', isSleeping: false });
    this._videoFeedIndex = 0;
    Router.navigate('video-feed');
    const videos = this._getFeedVideos();
    if (videos.length > 0) {
      setTimeout(() => this.playVideo(videos[0].id), 200);
    }
  },

  switchToAdmin() {
    if (!Store.state._adminVerified) {
      this._showModal('管理后台验证', `
        <div style="padding:0.5rem;">
          <p style="margin-bottom:0.8rem;color:var(--muted);">请输入管理密码（默认：admin123）</p>
          <input type="password" id="admin-pwd-input" class="pq-input" placeholder="管理密码" style="width:100%;padding:0.6rem 0.8rem;font-size:0.9rem;" onkeydown="if(event.key==='Enter')App._confirmModal()">
        </div>`, () => {
          const pwd = document.getElementById('admin-pwd-input')?.value;
          if (pwd === 'admin123') {
            Store.state._adminVerified = true;
            this._hideModal();
            Store.set({ mode: 'admin', adminTab: 'templates' });
            Router.navigate('admin-templates');
          } else {
            App._alert('密码错误');
            return false;
          }
        }, '验证', true);
      return;
    }
    Store.set({ mode: 'admin', adminTab: 'templates' });
    Router.navigate('admin-templates');
  },

  // ===== Login System =====
  _generateVerifyCode() {
    // 简单的四位验证码
    const chars = '0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  },

  _renderLogin() {
    this._currentVerifyCode = this._generateVerifyCode();
    return `<div class="login-container">
      <div class="login-header">
        <span class="brand-icon">🐾</span>
        <div>
          <h1>萌宠学堂</h1>
          <p>陪伴式虚拟宠物学习平台</p>
        </div>
      </div>
      <div class="login-form">
        <div class="form-group">
          <label>手机号</label>
          <div class="login-phone-wrap">
            <input type="tel" id="login-phone" placeholder="请输入手机号" maxlength="11">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>验证码</label>
            <input type="text" id="login-code" placeholder="输入验证码">
          </div>
          <div class="verify-code-box" onclick="App.regenerateVerifyCode()" data-tv-focusable>
            ${this._currentVerifyCode}
          </div>
        </div>
        <div class="login-actions">
          <button class="btn-primary" id="login-btn" onclick="App.doLogin()" data-tv-focusable>登录</button>
          <div class="login-hint">演示版不需要短信验证，点击验证码刷新即可</div>
        </div>
      </div>
      <div class="login-divider"><span>或直接体验</span></div>
      <div class="login-quick-actions">
        <button class="quick-btn child-qb" onclick="App.quickEnter('child')" data-tv-focusable>
          <span class="qb-icon">👶</span>
          <span class="qb-label">儿童体验</span>
          <span class="qb-desc">跳过登录，直接进入</span>
        </button>
        <button class="quick-btn parent-qb" onclick="App.quickEnter('parent')" data-tv-focusable>
          <span class="qb-icon">📊</span>
          <span class="qb-label">家长中心</span>
          <span class="qb-desc">查看学习报告</span>
        </button>
        <button class="quick-btn admin-qb" onclick="App.quickEnter('admin')" data-tv-focusable>
          <span class="qb-icon">⚙️</span>
          <span class="qb-label">管理后台</span>
          <span class="qb-desc">运营配置管理</span>
        </button>
      </div>
      <div class="login-footer">
        <p>适合3-12岁儿童 · 陪伴式学习 · 合规设计</p>
        <div class="login-legal-links">
          <a href="javascript:void(0)" onclick="App._showLegalDoc('privacy')">《隐私政策》</a>
          <a href="javascript:void(0)" onclick="App._showLegalDoc('terms')">《用户服务协议》</a>
          <a href="javascript:void(0)" onclick="App._showLegalDoc('children')">《儿童个人信息保护指引》</a>
        </div>
      </div>
    </div>`;
  },

  regenerateVerifyCode() {
    this._currentVerifyCode = this._generateVerifyCode();
    const box = document.querySelector('.verify-code-box');
    if (box) box.textContent = this._currentVerifyCode;
  },

  _showLegalDoc(type) {
    const docs = {
      privacy: {
        title: '隐私政策',
        body: `<div style="max-height:50vh;overflow-y:auto;font-size:0.85rem;line-height:1.8;color:var(--muted);">
<p style="font-weight:600;color:var(--ink);margin-bottom:0.5rem;">更新日期：2026年7月14日</p>
<p><strong style="color:var(--ink);">一、我们收集的信息</strong></p>
<p>为提供教育内容服务，我们仅收集以下必要信息：</p>
<ul style="margin:0.3rem 0 0.8rem 1.2rem;"><li>儿童学习行为数据：观看记录、答题记录、学习时长（仅存储于本地设备）</li><li>家长账号信息：手机号（仅用于登录验证）</li></ul>
<p><strong style="color:var(--ink);">二、我们如何使用信息</strong></p>
<p>收集的信息仅用于：生成学习报告、提供家长管控功能、优化内容推荐。我们不会将信息用于任何商业营销目的。</p>
<p><strong style="color:var(--ink);">三、信息存储与安全</strong></p>
<p>所有儿童数据存储于用户本地设备（浏览器 localStorage），不会上传至远程服务器。家长可随时在家长端查看或删除儿童数据。</p>
<p><strong style="color:var(--ink);">四、信息共享</strong></p>
<p>我们不会与任何第三方共享儿童的个人信息。</p>
<p><strong style="color:var(--ink);">五、您的权利</strong></p>
<p>作为监护人，您有权：查看儿童数据、要求删除儿童数据、撤回同意。请联系应用内家长中心的"数据管理"功能。</p>
</div>`
      },
      terms: {
        title: '用户服务协议',
        body: `<div style="max-height:50vh;overflow-y:auto;font-size:0.85rem;line-height:1.8;color:var(--muted);">
<p style="font-weight:600;color:var(--ink);margin-bottom:0.5rem;">更新日期：2026年7月14日</p>
<p><strong style="color:var(--ink);">一、服务说明</strong></p>
<p>萌宠学堂是一款面向 3-12 岁儿童的陪伴式虚拟宠物学习应用，提供教育视频内容、趣味问答、宠物养成等功能。</p>
<p><strong style="color:var(--ink);">二、使用规范</strong></p>
<ul style="margin:0.3rem 0 0.8rem 1.2rem;"><li>本应用仅供未成年人教育学习使用</li><li>家长/监护人须对儿童使用行为进行监督</li><li>禁止利用本应用从事任何违法活动</li></ul>
<p><strong style="color:var(--ink);">三、虚拟物品声明</strong></p>
<p>应用中的虚拟宠物及装扮道具仅供个人学习激励使用，不可交易、不可兑换为法定货币、不可在用户间转让。</p>
<p><strong style="color:var(--ink);">四、免责声明</strong></p>
<p>本应用提供的视频内容来源于公开教育资源，我们会尽力确保内容安全，但不对内容的绝对准确性承担责任。</p>
<p><strong style="color:var(--ink);">五、协议变更</strong></p>
<p>我们可能会不时更新本协议。重大变更将通过应用内公告通知。</p>
</div>`
      },
      children: {
        title: '儿童个人信息保护指引',
        body: `<div style="max-height:50vh;overflow-y:auto;font-size:0.85rem;line-height:1.8;color:var(--muted);">
<p style="font-weight:600;color:var(--ink);margin-bottom:0.5rem;">依据《儿童个人信息网络保护规定》《未成年人网络保护条例》</p>
<p><strong style="color:var(--ink);">一、监护人同意</strong></p>
<p>我们收集不满 14 周岁儿童信息前，须征得监护人同意。首次使用时，家长/监护人需阅读并同意《儿童个人信息保护知情同意书》。</p>
<p><strong style="color:var(--ink);">二、最小必要原则</strong></p>
<p>我们仅收集提供教育服务所必需的信息，包括：学习行为数据（观看记录、答题记录）。我们不采集儿童的姓名、人脸、精确位置、身份证号等敏感信息。</p>
<p><strong style="color:var(--ink);">三、本地存储</strong></p>
<p>所有儿童数据存储于本地设备，不上传至远程服务器。家长可随时查看和删除。</p>
<p><strong style="color:var(--ink);">四、删除权</strong></p>
<p>家长可通过家长端"数据管理"功能，一键删除该儿童的全部数据。应用停止运营时将立即删除全部儿童个人信息。</p>
<p><strong style="color:var(--ink);">五、适龄内容</strong></p>
<p>应用按年龄段（3-6/7-9/10-12岁）推荐适龄内容，不会向儿童推送与教育无关的广告或内容。</p>
</div>`
      }
    };
    const doc = docs[type];
    if (!doc) return;
    this._showModal(doc.title, doc.body, null, '我已了解', false);
  },

  doLogin() {
    const phone = document.getElementById('login-phone').value.trim();
    const code = document.getElementById('login-code').value.trim();
    if (!phone || phone.length !== 11) {
      App._alert('请输入正确的11位手机号'); return false;
    }
    if (code !== this._currentVerifyCode) {
      App._alert('验证码不正确，请输入图片中的四位数字');
      this.regenerateVerifyCode();
      return false;
    }
    // 登录成功，保存登录信息
    Store.set({
      isLoggedIn: true,
      loginInfo: { phone, loginTime: Date.now() }
    });
    Data.logOp('用户登录', `手机号 ${phone}`);
    // 如果已有儿童，自动播放视频流；否则跳转设置页
    if (Store.state.children.length === 0) {
      Router.navigate('profile-setup');
    } else {
      this._videoFeedIndex = 0;
      Router.navigate('video-feed');
      const videos = this._getFeedVideos();
      if (videos.length > 0) {
        setTimeout(() => this.playVideo(videos[0].id), 200);
      }
    }
    return true;
  },

  doLogout() {
    App._confirm('确定要退出登录吗？退出后数据仍保留在本地。', () => {
      Store.set({
        isLoggedIn: false,
        loginInfo: null,
        mode: 'child',
        activeChildIndex: 0,
        currentScreen: 'login'
      });
      Router.navigate('login');
      this.render();
    });
  },

  // 快速入口：跳过登录直接体验
  quickEnter(mode) {
    // 如果没有儿童，先创建一个默认儿童
    if (Store.state.children.length === 0) {
      Store.state.children.push(Store._createChild('体验小朋友', 2020));
      Store.state.activeChildIndex = 0;
    }
    // 如果儿童没有宠物且是儿童模式，跳到设置页
    const child = Store.activeChild();
    if (mode === 'child' && child.pets.length === 0) {
      Store.set({ isLoggedIn: true, loginInfo: { phone: 'demo', loginTime: Date.now() } });
      Router.navigate('profile-setup');
    } else if (mode === 'child') {
      Store.set({ mode: 'child', isLoggedIn: true, loginInfo: { phone: 'demo', loginTime: Date.now() } });
      // 自动播放视频
      this._videoFeedIndex = 0;
      Router.navigate('video-feed');
      const videos = this._getFeedVideos();
      if (videos.length > 0) {
        setTimeout(() => this.playVideo(videos[0].id), 200);
      }
    } else if (mode === 'parent') {
      Store.set({ mode: 'parent', isLoggedIn: true, loginInfo: { phone: 'demo', loginTime: Date.now() } });
      Router.navigate('parent-report');
    } else if (mode === 'admin') {
      Store.set({ mode: 'admin', adminTab: 'templates', isLoggedIn: true, loginInfo: { phone: 'admin', loginTime: Date.now() } });
      Router.navigate('admin-templates');
    }
  },

  _randomNames: ['豆豆', '果果', '糖糖', '乐乐', '星星', '圆圆', '朵朵', '泡泡', '嘟嘟', '球球', '暖暖', '甜甜', '喵喵', '贝贝', '叮当', '小宝', '年糕', '汤圆', '芒果', '柚子'],

  _renderProfileSetup() {
    const currentYear = new Date().getFullYear();
    // 年龄段分组：3-6岁 / 7-9岁 / 10-12岁
    const ageGroups = [
      { label: '3~6岁（幼儿）', range: [currentYear - 6, currentYear - 3] },
      { label: '7~9岁（小学低段）', range: [currentYear - 9, currentYear - 7] },
      { label: '10~12岁（小学高段）', range: [currentYear - 12, currentYear - 10] }
    ];
    // 随机选取3个不重复名称
    const shuffled = [...this._randomNames].sort(() => Math.random() - 0.5);
    const suggestNames = shuffled.slice(0, 3);

    return `<div class="setup-container">
      <div class="setup-header">
        <h2>欢迎你！</h2>
        <p>选一个名字，告诉我年龄吧</p>
      </div>
      <div class="form-group">
        <label>小朋友叫什么名字？</label>
        <div class="name-suggest-row">
          ${suggestNames.map(n => `<button class="name-chip" data-tv-focusable onclick="App.pickSuggestedName('${n}')">${n}</button>`).join('')}
        </div>
        <input type="text" id="child-name" placeholder="或自己输入一个名字">
      </div>
      <div class="form-group">
        <label>年龄阶段</label>
        <div class="age-group-cards">
          ${ageGroups.map((g, i) => `
            <div class="age-group-card ${i === 0 ? 'selected' : ''}" data-tv-focusable onclick="App.selectAgeGroup(${i}, this)">
              <div class="agg-label">${g.label}</div>
              <div class="agg-years">${g.range[0]} ~ ${g.range[1]}年出生</div>
            </div>
          `).join('')}
        </div>
        <input type="hidden" id="child-year" value="${ageGroups[0].range[1]}">
        <p class="form-hint">我们会根据年龄自动推荐适合的学习内容</p>
      </div>
      <div class="setup-actions">
        <button class="btn-primary" onclick="App.addNewChildAndContinue()" data-tv-focusable>开始体验</button>
      </div>
    </div>`;
  },

  _showConsentModal() {
    const bodyHTML = `<div class="consent-box" style="margin:0;box-shadow:none;border:none;">
        <div class="consent-header">
          <span class="consent-icon">📋</span>
          <div class="consent-title-row">
            <div class="consent-title">《儿童个人信息保护知情同意书》</div>
            <div class="consent-subtitle">请仔细阅读后勾选同意</div>
          </div>
        </div>
        <div class="consent-body">
          <p>本应用（萌宠学堂）面向未成年人提供教育内容服务。作为家长/监护人，在使用本应用前，请您仔细阅读并确认以下事项：</p>
          <div class="consent-items">
            <div class="consent-item">
              <span class="consent-num">1</span>
              <span>您是该儿童的<strong>法定监护人</strong>，有权同意其使用本应用提供的教育内容服务。</span>
            </div>
            <div class="consent-item">
              <span class="consent-num">2</span>
              <span>您已了解应用内置<strong>内容过滤</strong>和<strong>家长管控</strong>功能，包括但不限于观看时长限制、可观看时段设置及内容范围管理。</span>
            </div>
            <div class="consent-item">
              <span class="consent-num">3</span>
              <span>您同意应用收集<strong>必要的使用数据</strong>（观看记录、答题记录）以生成学习报告。所有数据仅存储于本地设备，不会上传至远程服务器。您可随时在家长端查看或删除儿童数据。</span>
            </div>
            <div class="consent-item">
              <span class="consent-num">4</span>
              <span>您理解本应用中的<strong>虚拟宠物及装扮道具</strong>仅供学习激励使用，不可交易、不可兑换为法定货币、不可在用户间转让。</span>
            </div>
          </div>
        </div>
        <label class="consent-agree-row" id="consent-label" style="cursor:pointer;">
          <input type="checkbox" id="consent-check" data-tv-focusable>
          <span class="consent-checkbox-custom"></span>
          <span class="consent-agree-text">我已阅读并同意《儿童个人信息保护知情同意书》及《用户服务协议》</span>
        </label>
      </div>`;
    this._showModal('监护人同意书', bodyHTML, () => {
      const consent = document.getElementById('consent-check');
      if (!consent || !consent.checked) {
        App._alert('请先勾选同意后再继续');
        return false;
      }
      this._consentAccepted = true;
      this._hideModal();
      return true;
    }, '我已同意，继续', true);
  },

  pickSuggestedName(name) {
    const input = document.getElementById('child-name');
    if (input) { input.value = name; }
    document.querySelectorAll('.name-chip').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
  },

  selectAgeGroup(index, el) {
    const currentYear = new Date().getFullYear();
    const ageGroups = [
      [currentYear - 6, currentYear - 3],
      [currentYear - 9, currentYear - 7],
      [currentYear - 12, currentYear - 10]
    ];
    document.querySelectorAll('.age-group-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    // 默认取年龄段中间值
    const range = ageGroups[index];
    const mid = Math.round((range[0] + range[1]) / 2);
    document.getElementById('child-year').value = mid;
  },

  addNewChildAndContinue() {
    if (!this._consentAccepted) {
      this._showConsentModal();
      return false;
    }
    const name = document.getElementById('child-name').value.trim();
    const birthYear = parseInt(document.getElementById('child-year').value, 10);
    if (!name) { App._alert('请选择或输入小朋友名字'); return false; }
    if (isNaN(birthYear)) { App._alert('请选择年龄阶段'); return false; }
    Store.state.children.push(Store._createChild(name, birthYear));
    Store.updateChild(Store.state.children.length - 1, { name, birthYear });
    Store.set({ activeChildIndex: Store.state.children.length - 1 });
    Store._persist();
    Data.logOp('新增儿童档案', `${name} (${birthYear})`);
    Router.navigate('pet-select');
    return true;
  },

  _renderChildManage() {
    const children = Store.state.children;
    return `<div class="setup-container">
      <div class="setup-header">
        <h2>儿童管理</h2>
        <p>切换或添加小朋友，每个小朋友有独立学习记录</p>
      </div>
      <div class="child-list">
        ${children.map((child, idx) => {
          const age = 2026 - child.birthYear;
          const active = idx === Store.state.activeChildIndex;
          return `<div class="child-card ${active ? 'active' : ''}" data-tv-focusable onclick="App.switchToChildIndex(${idx})">
            <div class="child-info">
              <div class="child-name">${child.name}</div>
              <div class="child-age">${age}岁 · ${child.ageGroup}岁组</div>
            </div>
            <div class="child-pets">🐾 ${child.pets.length}只宠物</div>
            ${children.length > 1 ? `<button class="child-delete-btn" onclick="event.stopPropagation();App.deleteChild(${idx})" data-tv-focusable>删除</button>` : ''}
          </div>`;
        }).join('')}
        <div class="add-child-card" data-tv-focusable onclick="App.addNewChildModal()">
          <span>+</span> 添加新小朋友
        </div>
      </div>
      <div class="setup-actions" style="margin-top:1.5rem;">
        <button class="btn-primary" onclick="App.switchToChild()" data-tv-focusable>返回首页</button>
        ${Store.state.isLoggedIn ? `<button class="btn-secondary" onclick="App.doLogout()" data-tv-focusable>退出登录</button>` : ''}
      </div>
    </div>`;
  },

  switchToChildIndex(index) {
    Store.set({ activeChildIndex: index });
    Store._persist();
    this.render();
  },

  deleteChild(index) {
    if (Store.state.children.length <= 1) {
      this._showModal('提示', '<p style="text-align:center;padding:1rem;">至少保留一个小朋友哦</p>', null, '知道了', false);
      return;
    }
    const child = Store.state.children[index];
    if (!child) return;
    const name = child.name;
    this._showModal('确认删除',
      `<div style="text-align:center;padding:1rem;"><div style="font-size:2.5rem;margin-bottom:0.5rem;">🗑️</div><p>确定要删除小朋友「${name}」吗？</p><p style="color:var(--muted);font-size:0.85rem;margin-top:0.3rem;">所有学习记录会一起删除。</p></div>`,
      () => {
        const newChildren = [...Store.state.children];
        newChildren.splice(index, 1);
        let newIndex = Store.state.activeChildIndex;
        if (newIndex >= index) {
          newIndex = Math.max(0, newIndex - 1);
        }
        if (newIndex >= newChildren.length) {
          newIndex = newChildren.length - 1;
        }
        Store.set({
          children: newChildren,
          activeChildIndex: newIndex
        });
        Data.logOp('删除儿童档案', name);
        this.render();
        return true;
      },
      '删除',
      true
    );
  },

  addNewChildModal() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 15; y <= currentYear; y++) years.push(y);
    const body = `<div class="form-group">
        <label>小朋友叫什么名字？</label>
        <input type="text" id="new-child-name" placeholder="输入名字">
      </div>
      <div class="form-group">
        <label>哪一年出生的？</label>
        <select id="new-child-year">
          ${years.map(y => `<option value="${y}">${y}年</option>`).join('')}
        </select>
      </div>`;
    this._showModal('添加小朋友', body, () => {
      const name = document.getElementById('new-child-name').value.trim();
      const birthYear = parseInt(document.getElementById('new-child-year').value, 10);
      if (!name) { this._showModal('提示', '<p style="text-align:center;padding:1rem;">请输入小朋友名字</p>', null, '知道了', false); return false; }
      if (isNaN(birthYear)) { this._showModal('提示', '<p style="text-align:center;padding:1rem;">请选择正确的出生年份</p>', null, '知道了', false); return false; }
      Store.state.children.push(Store._createChild(name, birthYear));
      Store.set({ activeChildIndex: Store.state.children.length - 1 });
      Store._persist();
      Data.logOp('新增儿童档案', `${name} (${birthYear})`);
      this._hideModal();
      setTimeout(() => { Router.navigate('pet-select'); this.render(); }, 50);
      return true;
    });
  },

  switchAdminTab(tab) {
    Store.set({ adminTab: tab });
    Router.navigate('admin-' + tab);
  },

  // 多宠物切换
  cycleActivePet() {
    const child = Store.activeChild();
    if (!child || child.pets.length < 2) return;
    child.activePetIndex = (child.activePetIndex + 1) % child.pets.length;
    Store.updateChild(Store.state.activeChildIndex, { activePetIndex: child.activePetIndex });
    this.render();
    this._lastStage = PetLogic.getCurrentStage(child);
    setTimeout(() => Remote.refresh(), 50);
  },

  // 领养新宠物
  adoptNewPet() {
    const child = Store.activeChild();
    const activePet = child ? PetLogic.getActivePet(child) : null;
    const isComplete = activePet ? PetLogic.isPetComplete(child) : true;
    if (!isComplete && activePet) {
      this._showModal('领养新宠物',
        `<div style="text-align:center;padding:1rem;"><div style="font-size:2.5rem;margin-bottom:0.5rem;">🐾</div><p>当前宠物「${activePet.variety}」还在成长中</p><p style="color:var(--muted);font-size:0.85rem;margin-top:0.3rem;">可以领养新宠物，但成长值会独立计算</p></div>`,
        () => { this._hideModal(); Router.navigate('pet-select'); this.render(); return true; },
        '继续领养',
        true
      );
    } else {
      Router.navigate('pet-select');
      this.render();
    }
  },

  // 宠物互动弹窗
  showPetInteractions() {
    const child = Store.activeChild();
    const pet = PetLogic.getActivePet(child);
    const stage = PetLogic.getCurrentStage(child);
    if (!pet || !stage) return;
    const body = `
      <div class="pet-interact-modal">
        <div class="pim-pet" style="font-size:3rem;text-align:center;margin-bottom:0.5rem;">${stage.icon}</div>
        <div class="pim-name" style="text-align:center;font-size:1rem;font-weight:700;margin-bottom:0.5rem;">${pet.variety} · ${stage.name}</div>
        <div class="pim-stats" style="text-align:center;font-size:0.82rem;color:var(--muted);margin-bottom:1rem;">
          成长值: ${pet.petGrowthValue || 0} ${pet.completed ? '🏆已完成' : ''}
        </div>
        <div class="pim-actions" style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;">
          <button class="btn-primary" onclick="PetLogic.interactWithPet('pet');App._hideModal()" data-tv-focusable>👋 抚摸</button>
          <button class="btn-primary" onclick="PetLogic.interactWithPet('feed');App._hideModal()" data-tv-focusable>🍽️ 喂食</button>
          <button class="btn-primary" onclick="PetLogic.interactWithPet('play');App._hideModal()" data-tv-focusable>🎾 玩耍</button>
        </div>
        <div style="text-align:center;margin-top:0.5rem;font-size:0.72rem;color:var(--muted);">
          互动增加成长值，每日互动次数不限
        </div>
      </div>`;
    this._showModal(`与${pet.variety}互动`, body, null, '关闭', false);
    setTimeout(() => Remote.refresh(), 50);
  },

  // ===== Modal System =====
  _modalCallback: null,

  _showModal(title, bodyHtml, onConfirm, confirmText = '确认', showCancel = true) {
    this._modalCallback = onConfirm;
    // 移除已存在的弹窗，避免堆叠
    const existing = document.getElementById('admin-modal');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'admin-modal';
    overlay.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="App._hideModal()">&times;</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        <div class="modal-footer">
          ${showCancel ? '<button class="btn-secondary" onclick="App._hideModal()" data-tv-focusable>取消</button>' : ''}
          <button class="btn-primary" onclick="App._confirmModal()" data-tv-focusable>${confirmText}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    // Close on backdrop click
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this._hideModal(); });
    setTimeout(() => Remote.refresh(), 50);
  },

  _hideModal() {
    const modal = document.getElementById('admin-modal');
    if (modal) modal.remove();
    this._modalCallback = null;
  },

  _confirmModal() {
    if (this._modalCallback) {
      const result = this._modalCallback();
      if (result !== false) this._hideModal();
    } else {
      this._hideModal();
    }
  },

  // 快捷提示（替代 alert）
  _alert(msg) {
    this._showModal('提示', `<p style="text-align:center;padding:0.8rem 1rem;">${msg}</p>`, null, '知道了', false);
  },

  // 快捷确认（替代 confirm），仅支持简单文本+回调
  _confirm(msg, onYes) {
    this._showModal('确认', `<p style="text-align:center;padding:0.8rem 1rem;">${msg}</p>`, () => { this._hideModal(); if (onYes) onYes(); return true; }, '确认', true);
  },

  // --- Admin: 宠物模板管理 ---
  _renderAdminTemplates() {
    const allTypes = Data.getAllPetTypes();
    return `${this._renderAdminTabs()}
      <div class="admin-section">
        <div class="admin-section-header">
          <h2>宠物模板管理</h2>
          <button class="btn-primary" onclick="App.showAddTemplateModal()" data-tv-focusable style="padding:0.4rem 1rem;font-size:0.82rem;">+ 新增模板</button>
        </div>
        <div class="admin-template-grid">
          ${allTypes.map((t, i) => {
            const isBase = i < Data.petTypes.length;
            const isEnabled = t.enabled !== false;
            return `<div class="admin-template-card ${!isEnabled ? 'disabled' : ''}" data-tv-focusable>
              <div class="atc-icon">${t.icon}</div>
              <div class="atc-name">${t.name} ${isBase ? '<span class="badge-sm green">基础</span>' : '<span class="badge-sm orange">扩展</span>'} ${!isEnabled ? '<span class="badge-sm red">已下架</span>' : ''}</div>
              <div class="atc-desc">${t.desc}</div>
              <div class="atc-varieties">品种: ${t.varieties.join('、')}</div>
              <div class="atc-stages">${t.stages.length} 阶段: ${t.stages.map(s => s.icon + s.name).join(' → ')}</div>
              <div class="atc-thresholds">成长值阈值: ${t.stages.map(s => s.threshold).join(' → ')}</div>
              ${!isBase ? `<div class="admin-actions">
                <button onclick="App.showEditTemplateModal('${t.id}')" data-tv-focusable>编辑</button>
                <button onclick="App.toggleTemplateStatus('${t.id}')" data-tv-focusable>${isEnabled ? '下架' : '上架'}</button>
                <button class="danger" onclick="App.deleteTemplate('${t.id}')" data-tv-focusable>删除</button>
              </div>` : ''}
            </div>`;
          }).join('')}
        </div>
        <div class="admin-hint">💡 基础模板不可编辑。扩展模板支持增删改和上下架操作。</div>
      </div>`;
  },

  showAddTemplateModal() {
    const baseTypeOptions = [
      { id: 'egg', name: '蛋生', icon: '🥚', defaultStages: [
        { name: '蛋', icon: '🥚', threshold: 0 },
        { name: '幼崽', icon: '🐣', threshold: 30 },
        { name: '成长期', icon: '🐤', threshold: 100 },
        { name: '成熟期', icon: '🐔', threshold: 250 }
      ]},
      { id: 'larva', name: '卵生', icon: '🥚', defaultStages: [
        { name: '卵', icon: '🥚', threshold: 0 },
        { name: '幼体', icon: '🐛', threshold: 30 },
        { name: '亚成体', icon: '🦋', threshold: 100 },
        { name: '成体', icon: '🦋', threshold: 250 }
      ]},
      { id: 'seed', name: '种子', icon: '🌱', defaultStages: [
        { name: '种子', icon: '🌰', threshold: 0 },
        { name: '发芽', icon: '🌱', threshold: 30 },
        { name: '幼苗', icon: '🌿', threshold: 80 },
        { name: '开花', icon: '🌸', threshold: 180 },
        { name: '结果', icon: '🍎', threshold: 300 }
      ]}
    ];
    const body = `
      <div class="form-group">
        <label>1. 选择基础类型</label>
        <div style="display:flex;gap:0.5rem;margin-top:0.3rem;" id="base-type-selector">
          ${baseTypeOptions.map((bt, i) => `<button class="btn-secondary base-type-chip ${i === 0 ? 'active' : ''}" data-base="${bt.id}" onclick="App.selectBaseType('${bt.id}')" data-tv-focusable>${bt.icon} ${bt.name}</button>`).join('')}
        </div>
        <input type="hidden" id="tpl-base-type" value="egg">
      </div>
      <div class="form-group"><label>2. 名称</label><input type="text" id="tpl-name" placeholder="如：小猫"></div>
      <div class="form-group"><label>3. 描述</label><input type="text" id="tpl-desc" placeholder="如：小猫从幼崽到成年"></div>
      <div class="form-row">
        <div class="form-group"><label>图标</label><input type="text" id="tpl-icon" placeholder="如：🐱"></div>
        <div class="form-group"><label>品种（逗号分隔）</label><input type="text" id="tpl-varieties" placeholder="如：橘猫, 白猫, 黑猫"></div>
      </div>
      <div class="form-group">
        <label>成长阶段 <button type="button" class="btn-secondary" style="padding:0.15rem 0.4rem;font-size:0.7rem;" onclick="App.addStageRow()">+ 添加阶段</button></label>
        <div id="stage-rows">
          ${baseTypeOptions[0].defaultStages.map(s => this._buildStageRowHtml(s)).join('')}
        </div>
      </div>`;
    this._showModal('新增宠物模板', body, () => {
      const name = document.getElementById('tpl-name').value.trim();
      const desc = document.getElementById('tpl-desc').value.trim();
      const icon = document.getElementById('tpl-icon').value.trim();
      const varieties = document.getElementById('tpl-varieties').value.split(',').map(s => s.trim()).filter(Boolean);
      const baseType = document.getElementById('tpl-base-type').value;
      const rows = document.querySelectorAll('#stage-rows .stage-editor-row');
      const stages = [];
      rows.forEach(row => {
        const n = row.querySelector('.st-name').value.trim();
        const ic = row.querySelector('.st-icon').value.trim();
        const th = parseInt(row.querySelector('.st-threshold').value, 10);
        if (n && !isNaN(th)) stages.push({ name: n, icon: ic || '⭐', threshold: th });
      });
      if (!name || varieties.length === 0 || stages.length < 2) {
        this._showModal('提示', '<p style="text-align:center;padding:1rem;">请填写完整信息，至少2个成长阶段</p>', null, '知道了', false); return false;
      }
      Data.addTemplate({ name, desc, icon, varieties, stages, baseType });
      this.render();
      return true;
    });
  },

  selectBaseType(baseId) {
    const baseTypeOptions = {
      egg: { stages: [
        { name: '蛋', icon: '🥚', threshold: 0 },
        { name: '幼崽', icon: '🐣', threshold: 30 },
        { name: '成长期', icon: '🐤', threshold: 100 },
        { name: '成熟期', icon: '🐔', threshold: 250 }
      ]},
      larva: { stages: [
        { name: '卵', icon: '🥚', threshold: 0 },
        { name: '幼体', icon: '🐛', threshold: 30 },
        { name: '亚成体', icon: '🦋', threshold: 100 },
        { name: '成体', icon: '🦋', threshold: 250 }
      ]},
      seed: { stages: [
        { name: '种子', icon: '🌰', threshold: 0 },
        { name: '发芽', icon: '🌱', threshold: 30 },
        { name: '幼苗', icon: '🌿', threshold: 80 },
        { name: '开花', icon: '🌸', threshold: 180 },
        { name: '结果', icon: '🍎', threshold: 300 }
      ]}
    };
    document.getElementById('tpl-base-type').value = baseId;
    document.querySelectorAll('.base-type-chip').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-base="${baseId}"]`)?.classList.add('active');
    const container = document.getElementById('stage-rows');
    if (container) {
      container.innerHTML = baseTypeOptions[baseId].stages.map(s => App._buildStageRowHtml(s)).join('');
    }
  },

  // 预设emoji图标列表（按分类）
  _stageEmojiPresets: {
    '蛋生/鸟类': ['🥚','🐣','🐥','🐤','🐔','🐓','🦚','🦜','🦢','🦩','🦆','🦅','🕊️','🐧','🦉'],
    '卵生/两栖': ['🫧','🐛','🦠','🐛','🦗','🦂','🐢','🐊','🐸','🦎','🐲','🦕','🦖'],
    '植物/种子': ['🌰','🌱','🌿','🍃','🌳','🎄','🎋','🎍','🌺','🌸','🌼','🌻','🌷','🌹'],
    '其他/装饰': ['⭐','🌟','✨','💫','🔥','💎','🌈','👑','🎁','🎀','🎯','🏆','❤️','💙','💜','🧡','💚']
  },

  _buildStageIconHtml(currentIcon) {
    // 判断是否为base64图片
    const isImg = currentIcon && currentIcon.startsWith('data:image');
    return `<div class="stage-icon-picker">
      <span class="st-icon-display" onclick="App._toggleEmojiPanel(this)">${isImg ? `<img src="${currentIcon}" class="st-icon-img">` : (currentIcon || '⭐')}</span>
      <input type="hidden" class="st-icon" value="${currentIcon || ''}">
      <div class="st-emoji-panel hidden">
        ${Object.entries(this._stageEmojiPresets).map(([cat, emojis]) =>
          `<div class="emoji-cat"><div class="emoji-cat-label">${cat}</div><div class="emoji-grid">${emojis.map(e => `<span class="emoji-opt" onclick="App._pickStageEmoji(this,'${e}')">${e}</span>`).join('')}</div></div>`
        ).join('')}
        <div class="emoji-cat">
          <div class="emoji-cat-label">自定义图片</div>
          <button class="btn-secondary" style="font-size:0.7rem;padding:0.2rem 0.5rem;" onclick="App._uploadStageIcon(this)">📷 上传图片</button>
        </div>
      </div>
    </div>`;
  },

  _toggleEmojiPanel(displayEl) {
    const panel = displayEl.closest('.stage-icon-picker').querySelector('.st-emoji-panel');
    panel.classList.toggle('hidden');
  },

  _pickStageEmoji(el, emoji) {
    const picker = el.closest('.stage-icon-picker');
    picker.querySelector('.st-icon').value = emoji;
    picker.querySelector('.st-icon-display').textContent = emoji;
    picker.querySelector('.st-emoji-panel').classList.add('hidden');
  },

  _uploadStageIcon(btnEl) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 100 * 1024) {
        this._showModal('提示', '<p style="text-align:center;padding:1rem;">图片不能超过100KB，请选择更小的图片</p>', null, '知道了', false);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result;
        const picker = btnEl.closest('.stage-icon-picker');
        picker.querySelector('.st-icon').value = base64;
        picker.querySelector('.st-icon-display').innerHTML = `<img src="${base64}" class="st-icon-img">`;
        picker.querySelector('.st-emoji-panel').classList.add('hidden');
      };
      reader.readAsDataURL(file);
    };
    input.click();
  },

  // 生成单行阶段编辑行HTML
  _buildStageRowHtml(stage) {
    const iconHtml = this._buildStageIconHtml(stage.icon || '');
    return `<div class="stage-editor-row"><input placeholder="阶段名" class="st-name" value="${stage.name || ''}">${iconHtml}<input type="number" placeholder="阈值" class="st-threshold" value="${stage.threshold || 0}"><button class="stage-del-btn" onclick="this.parentElement.remove()">&times;</button></div>`;
  },

  addStageRow() {
    const container = document.getElementById('stage-rows');
    if (!container) return;
    const row = document.createElement('div');
    row.innerHTML = this._buildStageRowHtml({ name: '', icon: '⭐', threshold: 0 });
    container.appendChild(row.firstElementChild);
  },

  showEditTemplateModal(id) {
    const tpl = Data.adminPetTemplates.find(t => t.id === id);
    if (!tpl) return;
    const body = `
      <input type="hidden" id="edit-tpl-id" value="${id}">
      <div class="form-group"><label>名称</label><input type="text" id="tpl-name" value="${tpl.name}"></div>
      <div class="form-group"><label>描述</label><input type="text" id="tpl-desc" value="${tpl.desc}"></div>
      <div class="form-row">
        <div class="form-group"><label>图标</label><input type="text" id="tpl-icon" value="${tpl.icon}"></div>
        <div class="form-group"><label>品种（逗号分隔）</label><input type="text" id="tpl-varieties" value="${tpl.varieties.join(', ')}"></div>
      </div>
      <div class="form-group">
        <label>成长阶段 <button type="button" class="btn-secondary" style="padding:0.15rem 0.4rem;font-size:0.7rem;" onclick="App.addStageRow()">+ 添加阶段</button></label>
        <div id="stage-rows">
          ${tpl.stages.map(s => this._buildStageRowHtml(s)).join('')}
        </div>
      </div>`;
    this._showModal('编辑宠物模板', body, () => {
      const name = document.getElementById('tpl-name').value.trim();
      const desc = document.getElementById('tpl-desc').value.trim();
      const icon = document.getElementById('tpl-icon').value.trim();
      const varieties = document.getElementById('tpl-varieties').value.split(',').map(s => s.trim()).filter(Boolean);
      const rows = document.querySelectorAll('#stage-rows .stage-editor-row');
      const stages = [];
      rows.forEach(row => {
        const n = row.querySelector('.st-name').value.trim();
        const ic = row.querySelector('.st-icon').value.trim();
        const th = parseInt(row.querySelector('.st-threshold').value, 10);
        if (n && !isNaN(th)) stages.push({ name: n, icon: ic || '⭐', threshold: th });
      });
      if (!name || varieties.length === 0 || stages.length < 2) {
        this._showModal('提示', '<p style="text-align:center;padding:1rem;">请填写完整信息，至少2个成长阶段</p>', null, '知道了', false); return false;
      }
      Data.updateTemplate(id, { name, desc, icon, varieties, stages });
      this.render();
      return true;
    });
  },

  toggleTemplateStatus(id) {
    Data.toggleTemplate(id);
    this.render();
  },

  deleteTemplate(id) {
    const tpl = Data.adminPetTemplates.find(t => t.id === id);
    if (!tpl) return;
    App._confirm(`确定要删除模板「${tpl.name}」吗？已领养该类型的儿童不受影响。`, () => {
      Data.deleteTemplate(id);
      this.render();
    });
  },

  // --- Admin: 内容配置 ---
  _renderAdminContent() {
    const allVideos = Data.getAllVideos();
    const allQuizzes = Data.getAllQuizzes();
    return `${this._renderAdminTabs()}
      <div class="admin-section">
        <div class="admin-section-header">
          <h2>内容配置</h2>
          <button class="btn-primary" onclick="App.showAddVideoModal()" data-tv-focusable style="padding:0.4rem 1rem;font-size:0.82rem;">+ 新增视频</button>
        </div>
        <div class="admin-content-table">
          <div class="act-header">
            <span>视频</span><span>分类</span><span>年龄段</span><span>时长</span><span>来源</span><span>题目</span><span>操作</span>
          </div>
          ${allVideos.map(v => {
            const qCount = (allQuizzes[v.id] || []).length;
            const isCustom = v.id.startsWith('cv_');
            return `<div class="act-row" data-tv-focusable>
              <span><strong>${v.icon} ${v.title}</strong></span>
              <span>${v.category}</span>
              <span>${v.ageGroup}岁</span>
              <span>${Utils.formatTime(v.duration)}</span>
              <span>${v.source || '未知'}</span>
              <span>${qCount}题 <button class="btn-secondary" style="padding:0.1rem 0.4rem;font-size:0.68rem;" onclick="App.showQuizManager('${v.id}')" data-tv-focusable>管理</button></span>
              <span>
                ${isCustom ? `<button onclick="App.showEditVideoModal('${v.id}')" data-tv-focusable style="padding:0.1rem 0.4rem;font-size:0.68rem;">编辑</button>
                <button class="danger" onclick="App.deleteVideo('${v.id}')" data-tv-focusable style="padding:0.1rem 0.4rem;font-size:0.68rem;">删除</button>` : '<span style="font-size:0.7rem;color:var(--muted);">内置</span>'}
              </span>
            </div>`;
          }).join('')}
        </div>
        <div class="admin-hint">💡 内置视频不可编辑。自定义视频支持增删改和题目管理。</div>
      </div>`;
  },

  showAddVideoModal() {
    const body = `
      <div class="form-row">
        <div class="form-group"><label>标题</label><input type="text" id="v-title" placeholder="视频标题"></div>
        <div class="form-group"><label>图标</label><input type="text" id="v-icon" placeholder="如：🦋"></div>
      </div>
      <div class="form-group"><label>描述</label><textarea id="v-desc" placeholder="视频简短描述..."></textarea></div>
      <div class="form-row">
        <div class="form-group"><label>分类</label><select id="v-category"><option>自然科学</option><option>历史人文</option><option>数学思维</option><option>艺术审美</option><option>语言表达</option></select></div>
        <div class="form-group"><label>年龄段</label><select id="v-age"><option>3-6</option><option>7-9</option><option>10-12</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>时长（秒）</label><input type="number" id="v-duration" placeholder="300"></div>
        <div class="form-group"><label>来源</label><input type="text" id="v-source" placeholder="如：教育部科普资源库"></div>
      </div>`;
    this._showModal('新增视频', body, () => {
      const title = document.getElementById('v-title').value.trim();
      const icon = document.getElementById('v-icon').value.trim();
      const desc = document.getElementById('v-desc').value.trim();
      const category = document.getElementById('v-category').value;
      const ageGroup = document.getElementById('v-age').value;
      const duration = parseInt(document.getElementById('v-duration').value, 10);
      const source = document.getElementById('v-source').value.trim() || '管理员添加';
      if (!title || !desc || isNaN(duration) || duration <= 0) {
        App._alert('请填写完整信息'); return false;
      }
      Data.addVideo({ title, icon, desc, category, ageGroup, duration, source });
      this.render();
      return true;
    });
  },

  showEditVideoModal(id) {
    const v = Data.videos.find(vv => vv.id === id);
    if (!v) return;
    const body = `
      <div class="form-row">
        <div class="form-group"><label>标题</label><input type="text" id="v-title" value="${v.title}"></div>
        <div class="form-group"><label>图标</label><input type="text" id="v-icon" value="${v.icon}"></div>
      </div>
      <div class="form-group"><label>描述</label><textarea id="v-desc">${v.desc}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>分类</label><select id="v-category">${['自然科学','历史人文','数学思维','艺术审美','语言表达'].map(c => `<option ${c===v.category?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="form-group"><label>年龄段</label><select id="v-age">${['3-6','7-9','10-12'].map(a => `<option ${a===v.ageGroup?'selected':''}>${a}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>时长（秒）</label><input type="number" id="v-duration" value="${v.duration}"></div>
        <div class="form-group"><label>来源</label><input type="text" id="v-source" value="${v.source || ''}"></div>
      </div>`;
    this._showModal('编辑视频', body, () => {
      const title = document.getElementById('v-title').value.trim();
      const icon = document.getElementById('v-icon').value.trim();
      const desc = document.getElementById('v-desc').value.trim();
      const category = document.getElementById('v-category').value;
      const ageGroup = document.getElementById('v-age').value;
      const duration = parseInt(document.getElementById('v-duration').value, 10);
      const source = document.getElementById('v-source').value.trim();
      if (!title || !desc || isNaN(duration) || duration <= 0) {
        App._alert('请填写完整信息'); return false;
      }
      Data.updateVideo(id, { title, icon, desc, category, ageGroup, duration, source });
      this.render();
      return true;
    });
  },

  deleteVideo(id) {
    const v = Data.videos.find(vv => vv.id === id);
    if (!v) return;
    App._confirm(`确定要删除视频「${v.title}」吗？关联的题目也会被删除。`, () => {
      Data.deleteVideo(id);
      this.render();
    });
  },

  showQuizManager(videoId) {
    const allQuizzes = Data.getAllQuizzes();
    const quizzes = allQuizzes[videoId] || [];
    const video = Data.getAllVideos().find(v => v.id === videoId);
    const listHtml = quizzes.length === 0 ? '<p style="color:var(--muted);font-size:0.82rem;">暂无题目</p>' :
      quizzes.map((q, i) => `<div class="quiz-editor-item">
        <div class="qe-question">${i+1}. ${q.question}</div>
        <div class="qe-options">${q.options.map((o, j) => `${String.fromCharCode(65+j)}. ${o}${j===q.answer?' ✓':''}`).join(' / ')}</div>
        <div class="admin-actions">
          <button class="danger" onclick="App.deleteQuiz('${videoId}', ${i})" data-tv-focusable>删除</button>
        </div>
      </div>`).join('');

    const body = `
      <div class="form-group"><label>题目</label><input type="text" id="q-question" placeholder="输入问题..."></div>
      <div class="form-group"><label>选项（逗号分隔）</label><input type="text" id="q-options" placeholder="如：选项A, 选项B, 选项C, 选项D"></div>
      <div class="form-row">
        <div class="form-group"><label>正确答案索引（0开始）</label><input type="number" id="q-answer" placeholder="0" min="0"></div>
        <div class="form-group"><label>知识点标签</label><input type="text" id="q-knowledge" placeholder="如：昆虫变态发育"></div>
      </div>
      <div style="margin-top:1rem;"><h4 style="font-size:0.85rem;margin-bottom:0.5rem;">现有题目 (${quizzes.length})</h4>${listHtml}</div>`;

    this._showModal(`管理题目 — ${video?.title || videoId}`, body, () => {
      const question = document.getElementById('q-question').value.trim();
      const options = document.getElementById('q-options').value.split(',').map(s => s.trim()).filter(Boolean);
      const answer = parseInt(document.getElementById('q-answer').value, 10);
      const knowledge = document.getElementById('q-knowledge').value.trim();
      if (!question || options.length < 2 || isNaN(answer) || answer < 0 || answer >= options.length) {
        if (question) { App._alert('请填写完整的题目信息'); return false; }
        return true; // empty, just close
      }
      Data.addQuiz(videoId, { question, options, answer, knowledge });
      this.render();
      // Re-open modal to show updated list
      setTimeout(() => this.showQuizManager(videoId), 50);
      return true;
    }, '添加题目');
  },

  deleteQuiz(videoId, index) {
    App._confirm('确定删除这道题目吗？', () => {
      Data.deleteQuiz(videoId, index);
      this.render();
    });
  },

  // --- Admin: 任务配置 ---
  _renderAdminTasks() {
    const tasks = Data.getAllTasks();
    return `${this._renderAdminTabs()}
      <div class="admin-section">
        <div class="admin-section-header">
          <h2>任务配置</h2>
          <button class="btn-primary" onclick="App.showAddTaskModal()" data-tv-focusable style="padding:0.4rem 1rem;font-size:0.82rem;">+ 新建任务</button>
        </div>
        <div class="admin-task-list">
          ${tasks.length === 0 ? '<p style="color:var(--muted);font-size:0.85rem;text-align:center;padding:1rem;">暂无任务，点击右上角新建</p>' :
            tasks.map(t => {
              const statusBadge = t.status === 'active' ? '<span class="badge-sm green">进行中</span>' :
                                 t.status === 'completed' ? '<span class="badge-sm orange">已完成</span>' :
                                 '<span class="badge-sm red">草稿</span>';
              return `<div class="admin-task-card" data-tv-focusable>
                <div class="atc-header">
                  <span class="atc-title">${t.title}</span>
                  ${statusBadge}
                </div>
                <div class="atc-meta">分类: ${t.category} | 目标: ${t.targetAudience}</div>
                <div class="admin-actions">
                  <button onclick="App.showEditTaskModal('${t.id}')" data-tv-focusable>编辑</button>
                  <button onclick="App.toggleTaskStatus('${t.id}')" data-tv-focusable>${t.status === 'active' ? '暂停' : '发布'}</button>
                  <button class="danger" onclick="App.deleteTask('${t.id}')" data-tv-focusable>删除</button>
                </div>
              </div>`;
            }).join('')}
        </div>
        <div class="admin-hint">💡 管理员可在此创建和管理学习任务。已发布的任务将推送到家长端。</div>
      </div>`;
  },

  showAddTaskModal() {
    const body = `
      <div class="form-group"><label>任务标题</label><input type="text" id="task-title" placeholder="如：本周看完太阳系相关视频"></div>
      <div class="form-group"><label>任务描述</label><textarea id="task-desc" placeholder="描述任务目标和要求..."></textarea></div>
      <div class="form-row">
        <div class="form-group"><label>分类</label><select id="task-category"><option>自然科学</option><option>历史人文</option><option>数学思维</option><option>艺术审美</option><option>语言表达</option></select></div>
        <div class="form-group"><label>目标年龄段</label><select id="task-age"><option>3-6</option><option>7-9</option><option>10-12</option><option>全部</option></select></div>
      </div>
      <div class="form-group"><label>初始状态</label><select id="task-status"><option value="draft">草稿</option><option value="active">直接发布</option></select></div>`;
    this._showModal('新建任务', body, () => {
      const title = document.getElementById('task-title').value.trim();
      const desc = document.getElementById('task-desc').value.trim();
      const category = document.getElementById('task-category').value;
      const targetAudience = document.getElementById('task-age').value;
      const status = document.getElementById('task-status').value;
      if (!title) { App._alert('请输入任务标题'); return false; }
      Data.addTask({ title, desc, category, targetAudience, status });
      this.render();
      return true;
    });
  },

  showEditTaskModal(id) {
    const t = Data.adminConfig.customTasks.find(tt => tt.id === id);
    if (!t) return;
    const body = `
      <div class="form-group"><label>任务标题</label><input type="text" id="task-title" value="${t.title}"></div>
      <div class="form-group"><label>任务描述</label><textarea id="task-desc">${t.desc || ''}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>分类</label><select id="task-category">${['自然科学','历史人文','数学思维','艺术审美','语言表达'].map(c => `<option ${c===t.category?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="form-group"><label>目标年龄段</label><select id="task-age">${['3-6','7-9','10-12','全部'].map(a => `<option ${a===t.targetAudience?'selected':''}>${a}</option>`).join('')}</select></div>
      </div>`;
    this._showModal('编辑任务', body, () => {
      const title = document.getElementById('task-title').value.trim();
      const desc = document.getElementById('task-desc').value.trim();
      const category = document.getElementById('task-category').value;
      const targetAudience = document.getElementById('task-age').value;
      if (!title) { App._alert('请输入任务标题'); return false; }
      Data.updateTask(id, { title, desc, category, targetAudience });
      this.render();
      return true;
    });
  },

  toggleTaskStatus(id) {
    const t = Data.adminConfig.customTasks.find(tt => tt.id === id);
    if (!t) return;
    const newStatus = t.status === 'active' ? 'paused' : 'active';
    Data.updateTask(id, { status: newStatus });
    this.render();
  },

  deleteTask(id) {
    const t = Data.adminConfig.customTasks.find(tt => tt.id === id);
    if (!t) return;
    App._confirm(`确定要删除任务「${t.title}」吗？`, () => {
      Data.deleteTask(id);
      this.render();
    });
  },

  // --- Admin: 系统设置 ---
  _renderAdminSettings() {
    const s = Data.adminConfig.settings;
    const logs = Data.adminConfig.opLog.slice(0, 20);
    return `${this._renderAdminTabs()}
      <div class="admin-section">
        <div class="admin-section-header"><h2>系统设置</h2></div>
        <div class="admin-settings-grid">
          <div class="admin-setting-card" data-tv-focusable onclick="App.showEditSetting('defaultDailyLimit', '默认每日时长', '${s.defaultDailyLimit}', 'number')">
            <div class="asc-icon">⏱</div>
            <div class="asc-label">默认每日时长</div>
            <div class="asc-value">${s.defaultDailyLimit} 分钟</div>
            <div class="asc-desc">所有儿童的默认每日观看时长上限</div>
            <button class="btn-secondary" style="padding:0.3rem 0.8rem;font-size:0.78rem;margin-top:0.5rem;">修改</button>
          </div>
          <div class="admin-setting-card" data-tv-focusable onclick="App.showEditTimeRange()">
            <div class="asc-icon">🕐</div>
            <div class="asc-label">允许观看时段</div>
            <div class="asc-value">${s.defaultAllowedStart} - ${s.defaultAllowedEnd}</div>
            <div class="asc-desc">符合法规要求的未成年人使用时段</div>
            <button class="btn-secondary" style="padding:0.3rem 0.8rem;font-size:0.78rem;margin-top:0.5rem;">修改</button>
          </div>
          <div class="admin-setting-card" data-tv-focusable onclick="App.showEditSetting('growthWatchRate', '观看成长比例', '${s.growthWatchRate}', 'number')">
            <div class="asc-icon">🐾</div>
            <div class="asc-label">观看成长比例</div>
            <div class="asc-value">1分钟 = ${s.growthWatchRate}成长值</div>
            <div class="asc-desc">有效观看时长换算为宠物成长值的比例</div>
            <button class="btn-secondary" style="padding:0.3rem 0.8rem;font-size:0.78rem;margin-top:0.5rem;">修改</button>
          </div>
          <div class="admin-setting-card" data-tv-focusable onclick="App.showEditSetting('growthQuizRate', '答题成长比例', '${s.growthQuizRate}', 'number')">
            <div class="asc-icon">📝</div>
            <div class="asc-label">答题成长比例</div>
            <div class="asc-value">1题正确 = ${s.growthQuizRate}成长值</div>
            <div class="asc-desc">答题正确换算为宠物成长值的比例</div>
            <button class="btn-secondary" style="padding:0.3rem 0.8rem;font-size:0.78rem;margin-top:0.5rem;">修改</button>
          </div>
        </div>

        <div style="margin-top:1.5rem;">
          <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:0.6rem;">操作日志（最近20条）</h3>
          <div class="op-log-list">
            ${logs.length === 0 ? '<p style="color:var(--muted);font-size:0.82rem;">暂无操作记录</p>' :
              logs.map(l => `<div class="op-log-item">
                <span><span class="op-action">${l.action}</span> — ${l.detail}</span>
                <span class="op-time">${l.timeStr}</span>
              </div>`).join('')}
          </div>
        </div>

        <div style="margin-top:1rem;padding:1rem;background:var(--danger-light);border-radius:var(--radius-sm);">
          <strong style="color:var(--danger);">⚠ 危险操作</strong>
          <p style="font-size:0.82rem;color:var(--muted);margin-top:0.3rem;">以下操作不可撤销，请谨慎操作</p>
          <div style="display:flex;gap:0.5rem;margin-top:0.5rem;flex-wrap:wrap;">
            <button class="btn-secondary" data-tv-focusable onclick="App.resetData()" style="border-color:var(--danger);color:var(--danger);">重置所有用户数据</button>
            <button class="btn-secondary" data-tv-focusable onclick="App.clearHistory()" style="border-color:var(--danger);color:var(--danger);">清空观看历史</button>
            <button class="btn-secondary" data-tv-focusable onclick="App.clearAdminConfig()" style="border-color:var(--danger);color:var(--danger);">重置管理员配置</button>
          </div>
        </div>
      </div>`;
  },

  showEditSetting(key, label, currentValue, type) {
    const body = `
      <div class="form-group">
        <label>${label}</label>
        <input type="${type}" id="setting-value" value="${currentValue}">
      </div>`;
    this._showModal(`修改 ${label}`, body, () => {
      const val = document.getElementById('setting-value').value;
      const parsed = type === 'number' ? parseFloat(val) : val;
      if (isNaN(parsed) || parsed === '') { App._alert('请输入有效值'); return false; }
      Data.updateSetting(key, parsed);
      this.render();
      return true;
    });
  },

  showEditTimeRange() {
    const s = Data.adminConfig.settings;
    const body = `
      <div class="form-row">
        <div class="form-group"><label>开始时间</label><input type="time" id="time-start" value="${s.defaultAllowedStart}"></div>
        <div class="form-group"><label>结束时间</label><input type="time" id="time-end" value="${s.defaultAllowedEnd}"></div>
      </div>`;
    this._showModal('修改允许观看时段', body, () => {
      const start = document.getElementById('time-start').value;
      const end = document.getElementById('time-end').value;
      if (!start || !end) { App._alert('请填写完整时段'); return false; }
      Data.updateSetting('defaultAllowedStart', start);
      Data.updateSetting('defaultAllowedEnd', end);
      this.render();
      return true;
    });
  },

  clearHistory() {
    App._confirm('确定要清空所有儿童的观看历史吗？此操作不可撤销。', () => {
      Store.state.children.forEach((child, i) => {
        child.history = [];
        child.stats = { totalWatchTime: 0, totalQuizCount: 0, totalCorrectCount: 0, dailyWatchTime: 0, weeklyWatchTime: [0,0,0,0,0,0,0] };
        child.pets.forEach(pet => {
          pet.growthValue = 0;
          pet.currentStage = 0;
        });
        Store.updateChild(i, { history: [], stats: child.stats, pets: child.pets });
      });
      Data.logOp('清空观看历史', '全部儿童');
      App._alert('观看历史已清空');
      App.render();
    });
  },

  clearAdminConfig() {
    App._confirm('确定要重置所有管理员配置吗？自定义的模板、视频、任务将全部删除。此操作不可撤销。', () => {
      Utils.saveLocal('adminConfig', null);
      App._alert('管理员配置已重置');
      setTimeout(() => location.reload(), 800);
    });
  },

  // --- Admin: Tab Navigation ---
  _renderAdminTabs() {
    const tab = Store.state.adminTab;
    const tabs = [
      { id: 'templates', label: '宠物模板', icon: '🐾' },
      { id: 'content', label: '内容配置', icon: '📺' },
      { id: 'tasks', label: '任务配置', icon: '📋' },
      { id: 'settings', label: '系统设置', icon: '⚙️' }
    ];
    return `<div style="display:flex;gap:0.4rem;margin-bottom:1rem;flex-wrap:wrap;">
      ${tabs.map(t => `<span class="room-tab ${tab === t.id ? 'active' : ''}" data-tv-focusable onclick="App.switchAdminTab('${t.id}')">${t.icon} ${t.label}</span>`).join('')}
    </div>`;
  },

  // --- Pet Effects ---
  _petCelebrate() {
    const petArea = document.getElementById('player-pet');
    if (!petArea) return;
    petArea.classList.remove('celebrate');
    petArea.classList.add('celebrate');
    // Stars burst
    for (let i = 0; i < 5; i++) {
      const star = document.createElement('span');
      star.className = 'star-particle';
      star.textContent = ['✨', '⭐', '🌟', '💫', '✨'][i];
      star.style.setProperty('--tx', (Math.random() * 80 - 40) + 'px');
      star.style.setProperty('--ty', (Math.random() * -60 - 10) + 'px');
      star.style.left = '50%'; star.style.top = '50%';
      petArea.appendChild(star);
      setTimeout(() => star.remove(), 700);
    }
    setTimeout(() => { petArea.classList.remove('celebrate'); }, 800);
  },

  // Confetti 撒花动画
  _launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    const particles = [];
    const colors = ['#D4663A', '#6B9E78', '#FFD54F', '#FF7043', '#42A5F5', '#AB47BC', '#FF4081'];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 40,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: Math.random() * -10 - 3,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 15,
        life: 1
      });
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        if (p.life <= 0) return;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.rotation += p.rotSpeed;
        p.life -= 0.015;
        p.vx *= 0.99;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (alive) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  },

  _showStageChange(icon, text, sub) {
    const overlay = document.getElementById('stage-change-overlay');
    if (!overlay) return;
    const sparkleColors = ['#FFB5C2', '#C8B6FF', '#B5EAD7', '#FFDAC1', '#A0D2DB', '#FFD54F', '#FF8FAB'];
    const sparkles = Array.from({ length: 12 }, (_, i) => {
      const color = sparkleColors[i % sparkleColors.length];
      const left = 15 + Math.random() * 70;
      const top = 20 + Math.random() * 50;
      const delay = Math.random() * 1.5;
      const size = 5 + Math.random() * 8;
      return `<div class="sc-sparkle" style="left:${left}%;top:${top}%;width:${size}px;height:${size}px;background:${color};animation-delay:${delay}s;animation-duration:${1.5 + Math.random()}s;"></div>`;
    }).join('');
    overlay.innerHTML = `<div class="sc-sparkles">${sparkles}</div><div class="sc-pet">${renderPetIcon(icon)}</div><div class="sc-text">${text}</div><div class="sc-sub">${sub}</div>`;
    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.add('hidden'), 3500);
  },

  _updatePetFloat() {
    const float = document.getElementById('pet-float');
    if (float) {
      const child = Store.activeChild();
      const stage = child ? PetLogic.getCurrentStage(child) : null;
      const activePet = PetLogic.getActivePet(child);
      if (stage && activePet) {
        float.querySelector('.pet-name-tag').textContent = `${child.name}的${stage.name}`;
        // Update icon (emoji or image)
        const iconEl = float.querySelector('.float-pet-icon');
        if (iconEl) {
          if (stage.icon && stage.icon.startsWith('data:image')) {
            iconEl.innerHTML = `<img src="${stage.icon}" style="width:1.5em;height:1.5em;vertical-align:middle;object-fit:contain;">`;
          } else {
            iconEl.textContent = stage.icon || '⭐';
          }
        }
      }
    }
  },

  // --- Event Binding ---
  _bindEvents() {
    // Keyboard AFK detection
    let afkTimeout;
    const resetAFK = () => {
      if (Store.state.player.isPlaying) {
        clearTimeout(afkTimeout);
        afkTimeout = setTimeout(() => {
          if (Store.state.currentScreen === 'player' && Store.state.player.isPlaying) {
            // Mark as AFK - in real app, would flag for effective time calculation
          }
        }, 180000); // 3 minutes
      }
    };
    document.addEventListener('keydown', resetAFK);
    document.addEventListener('click', resetAFK);
  },

  // Init last stage tracker
  _lastStage: null
};

// ===== Boot =====
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  // Track initial stage
  const child = Store.activeChild();
  if (PetLogic.getActivePet(child)) App._lastStage = PetLogic.getCurrentStage(child);
});

// Expose to global for inline handlers
window.App = App;
window.Router = Router;
window.Remote = Remote;
window.PetLogic = PetLogic;

})();