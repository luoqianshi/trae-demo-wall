// ===== 成就配置 =====
const ACHIEVEMENTS = [
  { id: 'first_listen', name: '初次倾听', desc: '完成第一位顾客的故事', emoji: '🌱', condition: s => s.totalOrders >= 1 },
  { id: 'first_perfect', name: '心灵捕手', desc: '第一次做出完美的回应', emoji: '🎯', condition: s => s.perfectOrders >= 1 },
  { id: 'perfect_3', name: '默契如初', desc: '累计达成 3 次完美回应', emoji: '🏆', condition: s => s.perfectOrders >= 3 },
  { id: 'perfect_10', name: '灵魂咖啡师', desc: '累计达成 10 次完美回应', emoji: '👑', condition: s => s.perfectOrders >= 10 },
  { id: 'warmth_100', name: '温暖传递者', desc: '累计温暖值达到 100', emoji: '🌞', condition: s => s.warmth >= 100 },
  { id: 'warmth_300', name: '城市暖炉', desc: '累计温暖值达到 300', emoji: '🔥', condition: s => s.warmth >= 300 },
  { id: 'orders_5', name: '小有名气的店', desc: '累计接待 5 位顾客', emoji: '🏠', condition: s => s.totalOrders >= 5 },
  { id: 'orders_15', name: '街角避风港', desc: '累计接待 15 位顾客', emoji: '🏘️', condition: s => s.totalOrders >= 15 },
  { id: 'all_chapter1', name: '初春的常客', desc: '完成第一章所有故事', emoji: '🌸', condition: s => CHAPTERS[0].characters.every(cid => s.isStoryCompleted(cid)) },
  { id: 'unlock_chapter2', name: '雨季邀约', desc: '解锁第二章', emoji: '🌧️', condition: s => s.canUnlockChapter(2) },
  { id: 'all_bases', name: '原料大师', desc: '解锁全部四种基底', emoji: '☕', condition: s => s.unlockedBases.length >= 4 },
  { id: 'all_toppings', name: '配料收藏家', desc: '解锁全部五种配料', emoji: '🧁', condition: s => s.unlockedToppings.length >= 5 },
  { id: 'friend_1', name: '第一位朋友', desc: '与某位角色达到朋友关系', emoji: '🤝', condition: s => Object.values(s.favorability).some(f => f >= 80) },
  { id: 'bestie_1', name: '灵魂伴侣', desc: '与某位角色达到挚友关系', emoji: '💞', condition: s => Object.values(s.favorability).some(f => f >= 200) }
];

// ===== 里程碑配置 =====
const MILESTONES = [
  { id: 'm_first_cup', name: '第一杯咖啡', desc: '完成首次调制', emoji: '☕', condition: s => s.totalOrders >= 1 },
  { id: 'm_first_perfect', name: '被理解的瞬间', desc: '首次完美回应顾客', emoji: '💫', condition: s => s.perfectOrders >= 1 },
  { id: 'm_warmth_50', name: '微光聚集', desc: '温暖值达到 50', emoji: '🕯️', condition: s => s.warmth >= 50 },
  { id: 'm_warmth_150', name: '灯火可亲', desc: '温暖值达到 150', emoji: '🏮', condition: s => s.warmth >= 150 },
  { id: 'm_chapter2', name: '雨季开启', desc: '解锁第二章节', emoji: '🌧️', condition: s => s.canUnlockChapter(2) },
  { id: 'm_orders_3', name: '熟客渐多', desc: '累计接待 3 位顾客', emoji: '👥', condition: s => s.totalOrders >= 3 },
  { id: 'm_orders_10', name: '口碑相传', desc: '累计接待 10 位顾客', emoji: '📢', condition: s => s.totalOrders >= 10 },
  { id: 'm_friend', name: '不再孤单', desc: '与一位角色成为朋友', emoji: '🌻', condition: s => Object.values(s.favorability).some(f => f >= 80) }
];

// ===== 好感度等级 =====
const FAVORABILITY_LEVELS = [
  { min: 0, name: '陌生人', emoji: '🌑', desc: '彼此之间还很陌生' },
  { min: 30, name: '熟客', emoji: '🌒', desc: '开始记住彼此的喜好' },
  { min: 80, name: '朋友', emoji: '🌓', desc: '愿意分享更多心事' },
  { min: 150, name: '挚友', emoji: '🌕', desc: '无需言语也能懂得' }
];

// ===== 每日治愈语录 =====
const WARM_QUOTES = [
  '今天的你，已经很努力了。',
  '慢慢来，所有的美好都会准时抵达。',
  '一杯咖啡的时间，足够让心安静下来。',
  '有人正在因为你的一点点善意而感到温暖。',
  '不必着急赶路，偶尔停下来也是一种前进。',
  '你的存在本身，就已经足够治愈。',
  '每一个愿意倾听的人，都是这座城市的光。',
  '今天的咖啡，会替你拥抱那些说不出口的疲惫。'
];

// ===== 账号管理 =====
const PRESET_AVATARS = ['☕', '🐱', '🌸', '🐶', '🦊', '🐰', '🐻', '🌙', '🍀', '✨'];

const AccountManager = {
  getAccounts() {
    try {
      return JSON.parse(localStorage.getItem('timecafe_accounts')) || {};
    } catch (e) {
      return {};
    }
  },
  saveAccounts(accounts) {
    localStorage.setItem('timecafe_accounts', JSON.stringify(accounts));
  },
  getAccount(phone) {
    return this.getAccounts()[phone] || null;
  },
  register(phone, password, nickname, avatar = '☕') {
    const accounts = this.getAccounts();
    if (accounts[phone]) return { success: false, message: '该手机号已注册' };
    if (!/^1\d{10}$/.test(phone)) return { success: false, message: '请输入正确的 11 位手机号' };
    if (password.length < 4) return { success: false, message: '密码至少 4 位' };
    if (!nickname.trim()) return { success: false, message: '请输入昵称' };

    accounts[phone] = {
      phone,
      password, // 注意：本地演示用明文存储，非安全方案
      nickname: nickname.trim(),
      avatar,
      createdAt: Date.now()
    };
    this.saveAccounts(accounts);

    // 若有旧版单用户存档，首次注册时自动迁移
    const legacySave = localStorage.getItem('timecafe_save');
    if (legacySave) {
      localStorage.setItem(`timecafe_save_${phone}`, legacySave);
      localStorage.removeItem('timecafe_save');
    }

    return { success: true };
  },
  login(phone, password) {
    const account = this.getAccount(phone);
    if (!account) return { success: false, message: '该手机号未注册' };
    if (account.password !== password) return { success: false, message: '密码错误' };
    localStorage.setItem('timecafe_current_user', phone);
    return { success: true };
  },
  logout() {
    localStorage.removeItem('timecafe_current_user');
  },
  updateProfile(phone, { nickname, avatar }) {
    const accounts = this.getAccounts();
    if (!accounts[phone]) return { success: false, message: '账号不存在' };
    if (nickname !== undefined) accounts[phone].nickname = nickname.trim();
    if (avatar !== undefined) accounts[phone].avatar = avatar;
    this.saveAccounts(accounts);
    return { success: true };
  },
  changePassword(phone, oldPassword, newPassword) {
    const accounts = this.getAccounts();
    if (!accounts[phone]) return { success: false, message: '账号不存在' };
    if (accounts[phone].password !== oldPassword) return { success: false, message: '原密码错误' };
    if (newPassword.length < 4) return { success: false, message: '新密码至少 4 位' };
    accounts[phone].password = newPassword;
    this.saveAccounts(accounts);
    return { success: true };
  },
  deleteAccount(phone) {
    const accounts = this.getAccounts();
    delete accounts[phone];
    this.saveAccounts(accounts);
    localStorage.removeItem(`timecafe_save_${phone}`);
    if (localStorage.getItem('timecafe_current_user') === phone) {
      localStorage.removeItem('timecafe_current_user');
    }
  }
};

class GameState {
  constructor() {
    this.currentChapter = 1;
    this.unlockedCharacters = [];
    this.completedStories = [];
    this.guestbook = [];
    this.warmth = 0;
    this.unlockedBases = ['espresso', 'milk'];
    this.unlockedToppings = ['milkfoam', 'honey'];
    this.totalOrders = 0;
    this.perfectOrders = 0;
    this.achievements = [];
    this.milestones = [];
    this.favorability = {};
    this.dailyQuoteSeed = null;
    this.heartTokens = 0;
    this.unlockedAudio = ['cafe_ambient'];
    this.audioEnabled = true;
    this.unlockedDecor = [];
    this.aiHealHistory = {};
    this.unlockedWorkshop = false;
    this.customMelodies = [];
    this.activeMelodyId = null;
    // 用户账号信息
    this.phone = null;
    this.nickname = '';
    this.avatar = '☕';
    this.load();
  }

  getSaveKey() {
    return this.phone ? `timecafe_save_${this.phone}` : 'timecafe_save';
  }

  load() {
    try {
      // 加载当前登录用户
      this.phone = localStorage.getItem('timecafe_current_user');
      if (this.phone) {
        const user = AccountManager.getAccount(this.phone);
        if (user) {
          this.nickname = user.nickname || this.phone;
          this.avatar = user.avatar || '☕';
        }
      }

      const data = localStorage.getItem(this.getSaveKey());
      if (data) {
        const saved = JSON.parse(data);
        this.currentChapter = saved.currentChapter || 1;
        this.unlockedCharacters = saved.unlockedCharacters || [];
        this.completedStories = saved.completedStories || [];
        this.guestbook = saved.guestbook || [];
        this.warmth = saved.warmth || 0;
        this.unlockedBases = saved.unlockedBases || ['espresso', 'milk'];
        this.unlockedToppings = saved.unlockedToppings || ['milkfoam', 'honey'];
        this.totalOrders = saved.totalOrders || 0;
        this.perfectOrders = saved.perfectOrders || 0;
        this.achievements = saved.achievements || [];
        this.milestones = saved.milestones || [];
        this.favorability = saved.favorability || {};
        this.dailyQuoteSeed = saved.dailyQuoteSeed || null;
        this.heartTokens = saved.heartTokens || 0;
        this.unlockedAudio = saved.unlockedAudio || ['cafe_ambient'];
        this.audioEnabled = saved.audioEnabled !== undefined ? saved.audioEnabled : true;
        this.unlockedDecor = saved.unlockedDecor || [];
        this.aiHealHistory = saved.aiHealHistory || {};
        this.unlockedWorkshop = saved.unlockedWorkshop || false;
        this.customMelodies = saved.customMelodies || [];
        this.activeMelodyId = saved.activeMelodyId || null;

        // 旧存档迁移：为已完成/已解锁但未有好感度的角色补初始好感度
        this.completedStories.forEach(story => {
          if (story.id && !story.id.startsWith('special_') && !(story.id in this.favorability)) {
            this.favorability[story.id] = 30;
          }
        });
        this.unlockedCharacters.forEach(cid => {
          if (!(cid in this.favorability)) {
            this.favorability[cid] = 10;
          }
        });

        // 若执行了迁移，立即持久化
        if (Object.keys(this.favorability).length > Object.keys(saved.favorability || {}).length) {
          this.save();
        }
      }
    } catch (e) {
      console.log('No saved data');
    }
  }

  save() {
    localStorage.setItem(this.getSaveKey(), JSON.stringify({
      currentChapter: this.currentChapter,
      unlockedCharacters: this.unlockedCharacters,
      completedStories: this.completedStories,
      guestbook: this.guestbook,
      warmth: this.warmth,
      unlockedBases: this.unlockedBases,
      unlockedToppings: this.unlockedToppings,
      totalOrders: this.totalOrders,
      perfectOrders: this.perfectOrders,
      achievements: this.achievements,
      milestones: this.milestones,
      favorability: this.favorability,
      dailyQuoteSeed: this.dailyQuoteSeed,
      heartTokens: this.heartTokens,
      unlockedAudio: this.unlockedAudio,
      audioEnabled: this.audioEnabled,
      unlockedDecor: this.unlockedDecor,
      aiHealHistory: this.aiHealHistory,
      unlockedWorkshop: this.unlockedWorkshop,
      customMelodies: this.customMelodies,
      activeMelodyId: this.activeMelodyId
    }));
  }

  reset() {
    this.currentChapter = 1;
    this.unlockedCharacters = [];
    this.completedStories = [];
    this.guestbook = [];
    this.warmth = 0;
    this.unlockedBases = ['espresso', 'milk'];
    this.unlockedToppings = ['milkfoam', 'honey'];
    this.totalOrders = 0;
    this.perfectOrders = 0;
    this.achievements = [];
    this.milestones = [];
    this.favorability = {};
    this.dailyQuoteSeed = null;
    this.heartTokens = 0;
    this.unlockedAudio = ['cafe_ambient'];
    this.audioEnabled = true;
    this.unlockedDecor = [];
    this.aiHealHistory = {};
    this.unlockedWorkshop = false;
    this.customMelodies = [];
    this.activeMelodyId = null;
    // 保留 phone/nickname/avatar，只清空游戏进度
    localStorage.removeItem(this.getSaveKey());
  }

  isCharacterUnlocked(charId) {
    return this.unlockedCharacters.includes(charId);
  }

  isStoryCompleted(charId) {
    return this.completedStories.some(c => c.id === charId);
  }

  unlockCharacter(charId) {
    if (!this.unlockedCharacters.includes(charId)) {
      this.unlockedCharacters.push(charId);
      this.save();
    }
  }

  completeStory(charId, level) {
    const existing = this.completedStories.find(c => c.id === charId);
    if (!existing) {
      this.completedStories.push({ id: charId, level: level || 'good', date: new Date().toLocaleDateString('zh-CN') });
    } else if (level === 'perfect' && existing.level !== 'perfect') {
      existing.level = 'perfect';
    }
    this.save();
  }

  addFavorability(charId, amount) {
    if (!this.favorability[charId]) this.favorability[charId] = 0;
    const before = this.getFavorabilityLevel(this.favorability[charId]);
    this.favorability[charId] += amount;
    const after = this.getFavorabilityLevel(this.favorability[charId]);
    if (before.name !== after.name) {
      showToast(`与 ${this.getCharName(charId)} 的关系升级为：${after.emoji} ${after.name}`);
    }
    this.save();
  }

  getFavorabilityLevel(value) {
    const v = value || 0;
    for (let i = FAVORABILITY_LEVELS.length - 1; i >= 0; i--) {
      if (v >= FAVORABILITY_LEVELS[i].min) return FAVORABILITY_LEVELS[i];
    }
    return FAVORABILITY_LEVELS[0];
  }

  getCharName(charId) {
    const char = CHARACTERS.find(c => c.id === charId);
    return char ? char.name : charId;
  }

  addToGuestbook(author, text, level) {
    this.guestbook.unshift({ author, text, date: new Date().toLocaleDateString('zh-CN'), level: level || 'good' });
    this.save();
  }

  addWarmth(amount) {
    this.warmth += amount;
    this.checkUnlocks();
    this.save();
  }

  checkUnlocks() {
    if (this.warmth >= 100 && !this.unlockedBases.includes('tea')) {
      this.unlockedBases.push('tea');
      showToast('解锁新原料：清茶 🍵');
    }
    if (this.warmth >= 250 && !this.unlockedBases.includes('cocoa')) {
      this.unlockedBases.push('cocoa');
      showToast('解锁新原料：热可可 🍫');
    }
    if (this.warmth >= 80 && !this.unlockedToppings.includes('mint')) {
      this.unlockedToppings.push('mint');
      showToast('解锁新配料：薄荷 🌿');
    }
    if (this.warmth >= 200 && !this.unlockedToppings.includes('cinnamon')) {
      this.unlockedToppings.push('cinnamon');
      showToast('解锁新配料：肉桂 🥧');
    }
  }

  checkAchievements() {
    ACHIEVEMENTS.forEach(ach => {
      if (!this.achievements.includes(ach.id) && ach.condition(this)) {
        this.achievements.push(ach.id);
        showToast(`获得成就：${ach.emoji} ${ach.name}`);
      }
    });
  }

  checkMilestones() {
    MILESTONES.forEach(ms => {
      if (!this.milestones.includes(ms.id) && ms.condition(this)) {
        this.milestones.push(ms.id);
        showToast(`里程碑达成：${ms.emoji} ${ms.name}`);
      }
    });
  }

  addHeartTokens(amount) {
    this.heartTokens += amount;
    this.save();
  }

  spendHeartTokens(amount) {
    if (this.heartTokens < amount) return false;
    this.heartTokens -= amount;
    this.save();
    return true;
  }

  unlockAudio(audioId) {
    if (!this.unlockedAudio.includes(audioId)) {
      this.unlockedAudio.push(audioId);
      this.save();
      return true;
    }
    return false;
  }

  isAudioUnlocked(audioId) {
    return this.unlockedAudio.includes(audioId);
  }

  toggleAudio(enabled) {
    this.audioEnabled = enabled;
    this.save();
  }

  buyIngredient(type, id, cost) {
    if (!this.spendHeartTokens(cost)) return false;
    if (type === 'base' && !this.unlockedBases.includes(id)) {
      this.unlockedBases.push(id);
      this.save();
      return true;
    }
    if (type === 'topping' && !this.unlockedToppings.includes(id)) {
      this.unlockedToppings.push(id);
      this.save();
      return true;
    }
    return false;
  }

  buyWarmth(amount, cost) {
    if (!this.spendHeartTokens(cost)) return false;
    this.addWarmth(amount);
    return true;
  }

  unlockDecor(decorId) {
    if (!this.unlockedDecor.includes(decorId)) {
      this.unlockedDecor.push(decorId);
      this.save();
      return true;
    }
    return false;
  }

  unlockWorkshop() {
    this.unlockedWorkshop = true;
    this.save();
  }

  addCustomMelody(name, notes, tempo) {
    const melody = {
      id: 'melody_' + Date.now().toString(36),
      name,
      notes,
      tempo,
      createdAt: Date.now()
    };
    this.customMelodies.push(melody);
    this.save();
    return melody;
  }

  deleteCustomMelody(id) {
    this.customMelodies = this.customMelodies.filter(m => m.id !== id);
    if (this.activeMelodyId === id) this.activeMelodyId = null;
    this.save();
  }

  setActiveMelody(id) {
    this.activeMelodyId = id;
    this.save();
  }

  getActiveMelody() {
    if (!this.activeMelodyId) return null;
    return this.customMelodies.find(m => m.id === this.activeMelodyId) || null;
  }

  addAIHealMessage(charId, role, text) {
    if (!this.aiHealHistory[charId]) this.aiHealHistory[charId] = [];
    this.aiHealHistory[charId].push({ role, text, time: Date.now() });
    // 限制历史长度
    if (this.aiHealHistory[charId].length > 50) {
      this.aiHealHistory[charId] = this.aiHealHistory[charId].slice(-50);
    }
    this.save();
  }

  getAIHealHistory(charId) {
    return this.aiHealHistory[charId] || [];
  }

  getDailyQuote() {
    const today = new Date().toLocaleDateString('zh-CN');
    if (this.dailyQuoteSeed !== today) {
      this.dailyQuoteSeed = today;
      this.save();
    }
    const seed = today.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return WARM_QUOTES[seed % WARM_QUOTES.length];
  }

  getChapterProgress(chapterId) {
    const chapter = CHAPTERS.find(c => c.id === chapterId);
    if (!chapter) return 0;
    const completed = chapter.characters.filter(cid => this.isStoryCompleted(cid)).length;
    return Math.round((completed / chapter.characters.length) * 100);
  }

  canUnlockChapter(chapterId) {
    const chapter = CHAPTERS.find(c => c.id === chapterId);
    if (!chapter || !chapter.unlockRequirement) return true;
    const req = chapter.unlockRequirement;
    const prevChapter = CHAPTERS.find(c => c.id === req.chapter);
    if (!prevChapter) return true;
    const completed = prevChapter.characters.filter(cid => this.isStoryCompleted(cid)).length;
    return completed >= req.minStories;
  }

  getRecentUnlocks(limit = 3) {
    const list = [];
    this.achievements.slice(-limit).forEach(id => {
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (ach) list.push({ type: 'achievement', emoji: ach.emoji, name: ach.name });
    });
    this.milestones.slice(-limit).forEach(id => {
      const ms = MILESTONES.find(m => m.id === id);
      if (ms) list.push({ type: 'milestone', emoji: ms.emoji, name: ms.name });
    });
    return list.slice(-limit);
  }
}

let state = new GameState();
let currentCharacter = null;
let currentDrink = null;
let currentBrewStep = 0;
let brewAttempts = 0;
let collectedClues = [];
let dialogueHistory = [];
let currentOrderCounted = false;
let currentPerfectCounted = false;

function $(selector) { return document.querySelector(selector); }
function $$(selector) { return document.querySelectorAll(selector); }

function hideAllScreens() {
  $$('.screen').forEach(s => s.classList.add('hidden'));
}

function showScreen(name) {
  hideAllScreens();
  $(`#screen-${name}`).classList.remove('hidden');

  // 登录/注册页不显示底部导航
  const bottomNav = $('#bottom-nav');
  if (bottomNav) {
    bottomNav.classList.toggle('hidden', name === 'auth');
  }
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ===== 首页 =====
function renderHome() {
  const chapterList = $('#chapter-list');
  chapterList.innerHTML = '';

  CHAPTERS.forEach(chapter => {
    const isUnlocked = state.canUnlockChapter(chapter.id);
    const progress = state.getChapterProgress(chapter.id);

    const card = document.createElement('div');
    card.className = `chapter-card ${isUnlocked ? '' : 'locked'}`;
    card.innerHTML = `
      <div class="chapter-num">第 ${chapter.id} 章</div>
      <h2>${chapter.title}</h2>
      <p class="chapter-desc">${chapter.subtitle}</p>
      <div class="progress-bar"><div class="progress-fill" style="width: ${progress}%"></div></div>
      ${isUnlocked ? '' : `<p style="font-size:0.75rem;color:var(--text-light);margin-top:0.5rem;">完成前一章 ${chapter.unlockRequirement?.minStories || 0} 个故事解锁</p>`}
    `;

    if (isUnlocked) {
      card.addEventListener('click', () => startChapter(chapter.id));
    }
    chapterList.appendChild(card);
  });

  $('#warmth-value').textContent = state.warmth;
  $('#orders-value').textContent = state.totalOrders;
  $('#perfect-value').textContent = state.perfectOrders;
  $('#hearts-value').textContent = state.heartTokens;

  const currentWeather = WEATHER_EFFECTS[state.weather || 'sunny'];
  $('#weather-emoji').textContent = currentWeather.emoji;
  $('#weather-name').textContent = currentWeather.name;
  $('#weather-desc').textContent = currentWeather.description;

  $('#daily-quote').textContent = state.getDailyQuote();

  const recent = state.getRecentUnlocks(3);
  const recentEl = $('#recent-unlocks');
  const recentList = $('#recent-unlocks-list');
  if (recent.length > 0) {
    recentEl.classList.remove('hidden');
    recentList.innerHTML = recent.map(u => `<span class="recent-unlock-tag">${u.emoji} ${u.name}</span>`).join('');
  } else {
    recentEl.classList.add('hidden');
  }

  // 更新首页用户资料条
  const homeAvatar = $('#home-user-avatar');
  const homeName = $('#home-user-name');
  if (homeAvatar && homeName) {
    homeAvatar.textContent = state.avatar || '☕';
    homeName.textContent = state.nickname || '咖啡馆主';
  }

  showScreen('home');
}

function startChapter(chapterId) {
  state.currentChapter = chapterId;
  const chapter = CHAPTERS.find(c => c.id === chapterId);
  const availableChars = chapter.characters.filter(cid => !state.isStoryCompleted(cid));

  if (availableChars.length === 0) {
    alert('本章所有故事已完成！可以回顾留言本或重置进度重新体验。');
    return;
  }

  const charId = availableChars[Math.floor(Math.random() * availableChars.length)];
  startCharacterStory(charId);
}

// ===== 角色出场 =====
function startCharacterStory(charId) {
  currentCharacter = CHARACTERS.find(c => c.id === charId);
  state.unlockCharacter(charId);
  collectedClues = [];
  dialogueHistory = [];
  brewAttempts = 0;
  currentOrderCounted = false;
  currentPerfectCounted = false;

  const charAvatar = $('#char-avatar');
  if (charAvatar && currentCharacter.image) {
    charAvatar.src = currentCharacter.image;
    charAvatar.style.display = 'block';
  }
  $('#char-name').textContent = currentCharacter.name;
  $('#char-title').textContent = currentCharacter.title;
  $('#char-info').textContent = `${currentCharacter.age}岁 · ${currentCharacter.occupation}`;
  $('#char-intro').textContent = currentCharacter.intro;
  $('#char-emotion').textContent = currentCharacter.emotion;

  renderFavorabilityPanel(currentCharacter.id);

  const specialBtn = $('#special-story-btn');
  const specialHint = $('#special-story-hint');
  const startBtn = $('#start-story-btn');
  if (canPlaySpecialStory(currentCharacter.id)) {
    specialBtn.classList.remove('hidden');
    specialHint.classList.remove('hidden');
    specialBtn.onclick = () => playSpecialStory(currentCharacter.id);
    startBtn.textContent = '再次倾听故事';
  } else {
    specialBtn.classList.add('hidden');
    specialHint.classList.add('hidden');
    startBtn.textContent = state.isStoryCompleted(currentCharacter.id) ? '再次倾听故事' : '开始倾听故事';
  }
  startBtn.onclick = () => startDialogue();

  showScreen('character');
}

function renderFavorabilityPanel(charId) {
  const fav = state.favorability[charId] || 0;
  const level = state.getFavorabilityLevel(fav);
  $('#favor-level-emoji').textContent = level.emoji;
  $('#favor-level-name').textContent = level.name;
  $('#favor-level-desc').textContent = level.desc;
  $('#favor-value').textContent = `好感度：${fav}`;
  $('#favor-fill').style.width = `${Math.min(100, (fav / 200) * 100)}%`;
}

function canPlaySpecialStory(charId) {
  const char = CHARACTERS.find(c => c.id === charId);
  if (!char || !char.specialStory) return false;
  const fav = state.favorability[charId] || 0;
  return fav >= char.specialStory.unlockFavorability && !state.isStoryCompleted(`special_${charId}`);
}

function playSpecialStory(charId) {
  const char = CHARACTERS.find(c => c.id === charId);
  if (!char || !char.specialStory) return;

  currentCharacter = char;
  const specialEmoji = $('#special-char-emoji');
  if (specialEmoji && char.image) {
    specialEmoji.src = char.image;
  }
  $('#special-title').textContent = char.specialStory.title;

  const content = $('#special-content');
  content.innerHTML = '';
  char.specialStory.lines.forEach(line => {
    const div = document.createElement('div');
    div.className = `special-line ${line.type}`;
    div.textContent = line.text;
    content.appendChild(div);
  });

  const ending = document.createElement('div');
  ending.className = 'special-ending';
  ending.textContent = char.specialStory.ending;
  content.appendChild(ending);

  $('#special-close-btn').onclick = () => {
    state.completeStory(`special_${charId}`, 'perfect');
    state.addWarmth(char.specialStory.reward || 50);
    state.addFavorability(charId, 20);
    state.checkAchievements();
    state.checkMilestones();
    showToast(`💌 特殊剧情完成，温暖值 +${char.specialStory.reward || 50}`);
    renderHome();
  };

  showScreen('special');
}

// ===== 对话场景 =====
function startDialogue() {
  dialogueHistory = [];
  const area = $('#dialogue-area');
  area.innerHTML = '';

  $('#dialogue-char-name').textContent = currentCharacter.name;
  const dialogueAvatar = $('#dialogue-char-avatar');
  if (dialogueAvatar && currentCharacter.image) {
    dialogueAvatar.src = currentCharacter.image;
  }

  addMessage('narrator', `—— ${currentCharacter.story.opening}`);

  showScreen('dialogue');
  renderDialogueActions('intro');
}

function addMessage(type, text) {
  const area = $('#dialogue-area');
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.textContent = text;
  area.appendChild(msg);
  area.scrollTop = area.scrollHeight;
}

function renderDialogueActions(stage) {
  const actionArea = $('#dialogue-actions');
  actionArea.innerHTML = '';

  if (stage === 'intro') {
    const btn = createActionBtn('继续对话', () => advanceDialogue());
    actionArea.appendChild(btn);
  } else if (stage === 'main') {
    const observeBtn = createActionBtn('👀 观察顾客', () => doObserve());
    const followUpBtn = createActionBtn('💬 追问一句', () => doFollowUp());
    const healBtn = createActionBtn('🤖 AI 疗愈对话', () => openAIHeal());
    const continueBtn = createActionBtn('☕ 开始调制', () => startBrew());
    actionArea.appendChild(observeBtn);
    actionArea.appendChild(followUpBtn);
    actionArea.appendChild(healBtn);
    actionArea.appendChild(continueBtn);
  } else if (stage === 'after-observe') {
    const followUpBtn = createActionBtn('💬 追问一句', () => doFollowUp());
    const continueBtn = createActionBtn('☕ 开始调制', () => startBrew());
    actionArea.appendChild(followUpBtn);
    actionArea.appendChild(continueBtn);
  } else if (stage === 'after-followup') {
    const observeBtn = createActionBtn('👀 再观察一下', () => doObserve());
    const continueBtn = createActionBtn('☕ 开始调制', () => startBrew());
    actionArea.appendChild(observeBtn);
    actionArea.appendChild(continueBtn);
  }
}

function createActionBtn(text, onClick) {
  const btn = document.createElement('button');
  btn.className = 'action-btn';
  btn.textContent = text;
  btn.onclick = onClick;
  return btn;
}

function advanceDialogue() {
  const lines = currentCharacter.story.lines;
  const nextIndex = dialogueHistory.length;

  if (nextIndex < lines.length) {
    const line = lines[nextIndex];
    addMessage(line.type, line.text);
    dialogueHistory.push(line);
    if (line.clue) collectClue(line.clue);

    if (nextIndex === lines.length - 1) {
      renderDialogueActions('main');
    }
  }
}

function doObserve() {
  const obs = currentCharacter.observation;
  addMessage('narrator', `[观察] ${obs.text}`);
  collectClue(obs.clue);
  renderDialogueActions('after-observe');
}

function doFollowUp() {
  const fu = currentCharacter.followUp;
  addMessage('player', fu.text);
  collectClue(fu.clue);
  renderDialogueActions('after-followup');
}

// ===== AI 疗愈对话 =====
function openAIHeal() {
  if (!currentCharacter) return;
  renderAIHeal();
  showScreen('ai-heal');
}

function renderAIHeal() {
  const screen = $('#screen-ai-heal');
  if (!screen || !currentCharacter) return;

  const char = currentCharacter;
  const history = state.getAIHealHistory(char.id);
  const hasHistory = history.length > 0;

  screen.innerHTML = `
    <div class="ai-heal-header">
      <button class="back-btn" onclick="showScreen('dialogue'); renderDialogueActions('main');">← 返回对话</button>
      <div class="ai-heal-title">
        <img class="ai-heal-avatar" src="${char.image}" alt="${char.name}">
        <div>
          <h2>🤖 ${char.name} 的疗愈空间</h2>
          <p class="screen-subtitle" style="margin:0;">在这里，你可以倾诉任何心事，AI 会以 ${char.name} 的视角温柔回应你</p>
        </div>
      </div>
    </div>
    <div class="ai-heal-topic-chips">
      <span class="topic-label">你可以聊聊：</span>
      ${char.keywords.map(k => `<button class="topic-chip" onclick="sendAIHealPrompt('${k.replace(/'/g, "\\'")}')">${k}</button>`).join('')}
    </div>
    <div class="ai-heal-chat" id="ai-heal-chat">
      ${history.length === 0 ? `
        <div class="ai-message ai">
          <div class="ai-bubble">
            <p>嗨，我是 ${char.name}。${char.intro}</p>
            <p style="margin-top:0.6rem;">最近有什么想聊的吗？我会认真倾听。</p>
          </div>
        </div>
      ` : history.map(h => renderAIHealMessage(h)).join('')}
    </div>
    <div class="ai-heal-input">
      <input type="text" id="ai-heal-input" placeholder="说点什么吧..." maxlength="120" autocomplete="off">
      <button id="ai-heal-send" onclick="sendAIHealMessage()">发送</button>
    </div>
    <p class="ai-heal-disclaimer">💡 这是一个本地关键词匹配的模拟 AI 疗愈窗口，倾诉本身就有治愈的力量。</p>
  `;

  const input = $('#ai-heal-input');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendAIHealMessage();
    });
    input.focus();
  }

  scrollAIHealToBottom();
}

function renderAIHealMessage(msg) {
  const isUser = msg.role === 'user';
  const char = currentCharacter || {};
  return `
    <div class="ai-message ${isUser ? 'user' : 'ai'}">
      ${isUser ? '' : `<img class="ai-message-avatar" src="${char.image}" alt="${char.name}">`}
      <div class="ai-bubble">${escapeHtml(msg.text)}</div>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function sendAIHealPrompt(keyword) {
  const input = $('#ai-heal-input');
  if (input) {
    input.value = `我最近一直在想${keyword}这件事，有点不知道怎么办。`;
    sendAIHealMessage();
  }
}

let aiHealReplying = false;
function sendAIHealMessage() {
  if (aiHealReplying || !currentCharacter) return;
  const input = $('#ai-heal-input');
  const text = input ? input.value.trim() : '';
  if (!text) return;

  aiHealReplying = true;
  state.addAIHealMessage(currentCharacter.id, 'user', text);
  appendAIHealMessage('user', text);
  if (input) input.value = '';

  // 模拟 AI 思考时间
  showAIHealTyping();
  setTimeout(() => {
    const reply = generateAIResponse(currentCharacter, text);
    state.addAIHealMessage(currentCharacter.id, 'ai', reply);
    hideAIHealTyping();
    appendAIHealMessage('ai', reply);

    // 首次完成 AI 对话给予少量温暖值奖励
    const history = state.getAIHealHistory(currentCharacter.id);
    if (history.filter(h => h.role === 'user').length === 1) {
      state.addWarmth(5);
      state.addFavorability(currentCharacter.id, 5);
      showToast('完成一次疗愈对话，温暖值 +5');
    }

    aiHealReplying = false;
  }, 800 + Math.random() * 600);
}

function appendAIHealMessage(role, text) {
  const chat = $('#ai-heal-chat');
  if (!chat) return;
  const div = document.createElement('div');
  div.innerHTML = renderAIHealMessage({ role, text });
  chat.appendChild(div.firstElementChild);
  scrollAIHealToBottom();
}

function showAIHealTyping() {
  const chat = $('#ai-heal-chat');
  if (!chat) return;
  const div = document.createElement('div');
  div.className = 'ai-message ai typing-indicator';
  div.id = 'ai-typing';
  div.innerHTML = `
    <img class="ai-message-avatar" src="${currentCharacter.image}" alt="${currentCharacter.name}">
    <div class="ai-bubble"><span class="typing-dots"><span></span><span></span><span></span></span></div>
  `;
  chat.appendChild(div);
  scrollAIHealToBottom();
}

function hideAIHealTyping() {
  const el = $('#ai-typing');
  if (el) el.remove();
}

function scrollAIHealToBottom() {
  const chat = $('#ai-heal-chat');
  if (chat) chat.scrollTop = chat.scrollHeight;
}

function generateAIResponse(char, text) {
  const lower = text.toLowerCase();

  // 情感关键词库
  const emotionPatterns = {
    焦虑: ['焦虑', '担心', '紧张', '睡不着', '压力', '害怕失败', '来不及', '考', 'deadline'],
    孤独: ['孤独', '孤单', '没人理解', '一个人', '寂寞', '空虚', '迷茫', '没意义'],
    难过: ['难过', '伤心', '想哭', '委屈', '痛苦', '失望', '好累', '疲惫'],
    愤怒: ['生气', '愤怒', '烦死了', '讨厌', '不公平', '恨', '受不了'],
    思念: ['想念', '想家', '怀念', '思念', '过去', '老家', '家人', '离开'],
    开心: ['开心', '高兴', '喜欢', '幸福', '温暖', '谢谢', '治愈']
  };

  let detected = [];
  for (const [emotion, patterns] of Object.entries(emotionPatterns)) {
    if (patterns.some(p => lower.includes(p))) detected.push(emotion);
  }

  // 角色专属回应模板
  const charReplies = {
    xiaolin: {
      焦虑: '我懂那种“再撑一下”的感觉。你已经很努力了，偶尔允许自己歇一歇，不会让世界塌下来的。',
      孤独: '备考的路上常常一个人，但你要知道，愿意坚持到现在的你，已经很了不起了。',
      难过: '哭出来也没关系。眼泪不是软弱，是心在告诉自己“我需要被温柔对待”。',
      愤怒: '有情绪很正常，不必为此自责。把怒火写成一行字、画一个圈，然后再继续。',
      思念: '想念一个人的时候，就抬头看看天空。也许你们正看着同一片云。',
      开心: '真好，你的笑容让人觉得很安心。希望你以后也能常常这样笑。',
      default: '谢谢你愿意跟我说这些。无论结果如何，你都在认真对待自己的生活，这本身就很珍贵。'
    },
    ajie: {
      焦虑: '跑车在路上，有时候红灯长一点也没关系。人不是机器，累了就该歇脚。',
      孤独: '凌晨的街道看起来很空，但总有人和你一样在回家的路上。你不是唯一一个。',
      难过: '大男人也可以难过。眼泪流完，明天还要继续跑，但今晚可以先坐下来。',
      愤怒: '这世上确实有很多让人恼火的事。但别让别人的错误，变成你整夜睡不着的理由。',
      思念: '想家的时候，就给家人打个电话，哪怕只说两句。声音有时候比文字暖。',
      开心: '哈哈，听你高兴，我也觉得今天没白跑。',
      default: '日子再难，也总有一杯热的东西在等你。慢慢来，不着急。'
    },
    xiaoyu: {
      焦虑: '害怕的时候，就握紧我的手。你很勇敢，敢说出来就已经很棒了。',
      孤独: '你不是一个人哦。我在这里，咖啡馆也在这里，随时欢迎你。',
      难过: '委屈的时候，可以靠在我肩膀上。等你想说了，我再听。',
      愤怒: '生气的时候，深呼吸三次。你不需要马上原谅谁，但别让自己太难受。',
      思念: '想奶奶的时候，就把她给你做过的事写下来。这样她就像在你身边一样。',
      开心: '哇，你笑起来真好看！像蜂蜜一样甜。',
      default: '不管发生什么，你都是值得被喜欢的小朋友。'
    },
    laoli: {
      焦虑: '年轻人，慌什么。我活了六十多年，明白一件事：天塌不下来，塌下来也有高个子顶着。',
      孤独: '孤独是人生的必修课。但你可以把孤独泡成一杯茶，慢慢品。',
      难过: '难过的时候，就想想那些让你笑过的人。他们也在某个地方希望你能好好的。',
      愤怒: '气大伤身。把火气压一压，喝杯茶，看看窗外，世界还在转。',
      思念: '想老伴了？那就把她教会你的东西继续做下去，她就没走远。',
      开心: '看到你高兴，我也跟着年轻了几岁。',
      default: '日子像茶，第一口苦，第二口涩，第三口才有回甘。'
    },
    xiaomei: {
      焦虑: '我也曾被 KPI 压得喘不过气。后来我发现，真正重要的不是永远在线，而是偶尔离线。',
      孤独: '在大城市里，孤独是常态。但你可以选择让自己被一杯好喝的咖啡拥抱。',
      难过: '别硬撑了。成年人的崩溃不需要观众，但需要一张床和一顿好觉。',
      愤怒: '工作让人发火很正常。但记住，你的价值不由工作定义。',
      思念: '想逃离的时候，就想想那个让你安心的小角落。你值得拥有一个喘息的地方。',
      开心: '太好了！生活就是要抓住这些让自己重新活过来的瞬间。',
      default: '你已经很努力了。下班之后，记得把“工作模式”关掉。'
    },
    liayi: {
      焦虑: '孩子，别把自己逼太紧。日子一天天过，慢慢都会好起来的。',
      孤独: '女儿不在身边的时候，就给她发条语音。有时候听见声音，比什么都强。',
      难过: '心里堵得慌的话，就泡杯茶，慢慢说。我听着呢。',
      愤怒: '气头上的话最伤人。先喝口茶，等心平气和了再处理。',
      思念: '想女儿是正常的。她在那边也在想你呢。',
      开心: '你高兴，我也高兴。日子就是要这样互相牵挂着过。',
      default: '一家人，心在一起，距离就不是问题。'
    }
  };

  const replies = charReplies[char.id] || charReplies.xiaolin;

  // 优先使用检测到的第一个情绪
  for (const emotion of detected) {
    if (replies[emotion]) return replies[emotion];
  }

  // 若提到角色关键词，给出相关回应
  for (const kw of char.keywords) {
    if (lower.includes(kw)) {
      return `关于“${kw}”，我想说：${replies.default}`;
    }
  }

  // 通用兜底
  const fallbacks = [
    '谢谢你愿意告诉我这些。无论发生什么，你都不是一个人。',
    '我听到你了。你的感受很重要，不需要急着否定它。',
    '有时候，把话说出来就已经是一种疗愈了。继续说吧，我在这儿。',
    '你比想象中更坚强。给自己多一点时间，都会好起来的。'
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// ===== 音乐工坊（DIY 背景音乐） =====
const MUSIC_WORKSHOP_NOTES = [
  { note: 'C4', freq: 261.63, label: 'Do' },
  { note: 'E4', freq: 329.63, label: 'Mi' },
  { note: 'G4', freq: 392.00, label: 'Sol' },
  { note: 'B4', freq: 493.88, label: 'Si' }
];

let mwPreviewInterval = null;
let mwCurrentStep = 0;

function showMusicWorkshop() {
  if (!state.unlockedWorkshop) {
    showToast('请先在心动画商店解锁音乐工坊（500💗）');
    return;
  }
  renderMusicWorkshop();
  showScreen('music-workshop');
}

function renderMusicWorkshop() {
  const screen = $('#screen-music-workshop');
  if (!screen) return;

  const savedMelodies = state.customMelodies;
  const activeId = state.activeMelodyId;

  screen.innerHTML = `
    <div class="music-workshop-header">
      <button class="back-btn" onclick="renderHome()">← 返回</button>
      <h2>🎹 音乐工坊</h2>
      <p class="screen-subtitle">谱写属于你自己的咖啡馆旋律</p>
    </div>

    <div class="music-sequencer">
      <div class="sequencer-steps">
        ${[0,1,2,3,4,5,6,7].map(step => `<span class="step-num ${step === 0 ? 'active' : ''}" data-step="${step}">${step + 1}</span>`).join('')}
      </div>
      ${MUSIC_WORKSHOP_NOTES.map((n, rowIdx) => `
        <div class="sequencer-row">
          <span class="row-label">${n.label}</span>
          ${[0,1,2,3,4,5,6,7].map(step => `
            <button class="sequencer-cell" data-row="${rowIdx}" data-step="${step}" onclick="toggleSequencerNote(${rowIdx}, ${step})"></button>
          `).join('')}
        </div>
      `).join('')}
    </div>

    <div class="music-controls">
      <div class="tempo-control">
        <label>速度：<span id="mw-tempo-value">120</span> BPM</label>
        <input type="range" id="mw-tempo" min="60" max="180" value="120" oninput="updateTempoDisplay()">
      </div>
      <div class="music-action-btns">
        <button class="mw-btn play" onclick="previewMelody()">▶️ 试听</button>
        <button class="mw-btn stop" onclick="stopPreview()">⏹ 停止</button>
        <button class="mw-btn save" onclick="saveMelody()">💾 保存旋律</button>
        <button class="mw-btn clear" onclick="clearSequencer()">🗑 清空</button>
      </div>
    </div>

    <div class="saved-melodies">
      <h3>🎵 已保存的旋律</h3>
      ${savedMelodies.length === 0 ? '<p class="empty-melodies">还没有保存的旋律，快来创作第一首吧~</p>' : `
        <div class="melody-list">
          ${savedMelodies.map(m => `
            <div class="melody-item ${m.id === activeId ? 'active' : ''}">
              <div class="melody-info">
                <span class="melody-name">${escapeHtml(m.name)}</span>
                <span class="melody-meta">${m.tempo} BPM · ${m.notes.length} 个音符</span>
              </div>
              <div class="melody-actions">
                <button class="mw-btn small" onclick="playMelodyById('${m.id}')">▶</button>
                <button class="mw-btn small ${m.id === activeId ? 'active' : ''}" onclick="setActiveMelodyById('${m.id}')">${m.id === activeId ? '使用中' : '设为BGM'}</button>
                <button class="mw-btn small danger" onclick="deleteMelodyById('${m.id}')">删除</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <p class="music-tip">💡 小贴士：点击网格中的方块添加音符，再次点击取消。保存后可以在设置中设为咖啡馆背景音乐。</p>
  `;
}

function toggleSequencerNote(row, step) {
  const cell = $(`.sequencer-cell[data-row="${row}"][data-step="${step}"]`);
  if (cell) cell.classList.toggle('active');
}

function getSequencerNotes() {
  const notes = [];
  for (let step = 0; step < 8; step++) {
    for (let row = 0; row < MUSIC_WORKSHOP_NOTES.length; row++) {
      const cell = $(`.sequencer-cell[data-row="${row}"][data-step="${step}"]`);
      if (cell && cell.classList.contains('active')) {
        notes.push({ step, row, freq: MUSIC_WORKSHOP_NOTES[row].freq, note: MUSIC_WORKSHOP_NOTES[row].note });
      }
    }
  }
  return notes;
}

function setSequencerNotes(notes) {
  document.querySelectorAll('.sequencer-cell').forEach(cell => cell.classList.remove('active'));
  notes.forEach(n => {
    const cell = $(`.sequencer-cell[data-row="${n.row}"][data-step="${n.step}"]`);
    if (cell) cell.classList.add('active');
  });
}

function updateTempoDisplay() {
  const tempoEl = $('#mw-tempo');
  const display = $('#mw-tempo-value');
  if (display && tempoEl) display.textContent = tempoEl.value;
}

function clearSequencer() {
  document.querySelectorAll('.sequencer-cell').forEach(cell => cell.classList.remove('active'));
}

function previewMelody() {
  if (mwPreviewInterval) stopPreview();
  const notes = getSequencerNotes();
  const tempoEl = $('#mw-tempo');
  const tempo = tempoEl ? parseInt(tempoEl.value) : 120;
  playNotesSequence(notes, tempo);
}

function playMelodyById(id) {
  const melody = state.customMelodies.find(m => m.id === id);
  if (!melody) return;
  if (mwPreviewInterval) stopPreview();
  setSequencerNotes(melody.notes);
  playNotesSequence(melody.notes, melody.tempo);
}

function playNotesSequence(notes, tempo) {
  if (!state.audioEnabled) return;
  AudioEngine.ensureInit();
  if (!AudioEngine.ctx) return;

  const stepTime = 60 / tempo / 2; // 8分音符
  mwCurrentStep = 0;

  // 高亮当前 step
  const highlightStep = (step) => {
    document.querySelectorAll('.step-num').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.step) === step);
    });
  };

  mwPreviewInterval = setInterval(() => {
    highlightStep(mwCurrentStep);
    const stepNotes = notes.filter(n => n.step === mwCurrentStep);
    stepNotes.forEach(n => AudioEngine.playTone(n.freq, 0.15));
    mwCurrentStep = (mwCurrentStep + 1) % 8;
    if (mwCurrentStep === 0 && notes.length === 0) stopPreview();
  }, stepTime * 1000);
}

function stopPreview() {
  if (mwPreviewInterval) {
    clearInterval(mwPreviewInterval);
    mwPreviewInterval = null;
  }
  mwCurrentStep = 0;
  document.querySelectorAll('.step-num').forEach(el => el.classList.remove('active'));
}

function saveMelody() {
  const notes = getSequencerNotes();
  if (notes.length === 0) {
    showToast('请先添加一些音符');
    return;
  }
  const name = prompt('给你的旋律起个名字：', '我的咖啡馆旋律');
  if (!name || !name.trim()) return;
  const tempoEl = $('#mw-tempo');
  const tempo = tempoEl ? parseInt(tempoEl.value) : 120;
  const melody = state.addCustomMelody(name.trim(), notes, tempo);
  state.setActiveMelody(melody.id);
  showToast('旋律已保存并设为咖啡馆 BGM');
  renderMusicWorkshop();
}

function setActiveMelodyById(id) {
  state.setActiveMelody(id);
  renderMusicWorkshop();
  showToast('已设为咖啡馆背景音乐');
}

function deleteMelodyById(id) {
  if (!confirm('确定要删除这首旋律吗？')) return;
  state.deleteCustomMelody(id);
  renderMusicWorkshop();
  showToast('已删除');
}

function collectClue(clue) {
  if (!collectedClues.includes(clue)) {
    collectedClues.push(clue);
    showToast('💡 获得一条线索');
  }
  renderCluePanel();
}

function renderCluePanel() {
  const html = collectedClues.map(c => `<li>${c}</li>`).join('');

  const panels = [
    { panel: '#clue-panel', list: '#clue-list' },
    { panel: '#brew-clue-panel', list: '#brew-clue-list' }
  ];

  panels.forEach(({ panel, list }) => {
    const p = $(panel);
    const l = $(list);
    if (!p || !l) return;

    if (collectedClues.length > 0) {
      p.classList.remove('hidden');
      l.innerHTML = html;
    }
  });
}

// ===== 调制饮品 =====
const BREW_STEPS = [
  { key: 'base', label: '选择基底', icon: '☕', hint: '咖啡、牛奶、茶还是可可？' },
  { key: 'temperature', label: '控制温度', icon: '🌡️', hint: '热、温还是冰？' },
  { key: 'sweetness', label: '加入甜度', icon: '🍯', hint: '多糖、半糖还是无糖？' },
  { key: 'topping', label: '最后点缀', icon: '✨', hint: '奶泡、蜂蜜、薄荷、肉桂还是不加？' }
];

function startBrew() {
  currentDrink = { base: null, temperature: null, sweetness: null, topping: null };
  currentBrewStep = 0;

  const brewEmoji = $('#brew-customer-emoji');
  if (brewEmoji && currentCharacter.image) {
    brewEmoji.src = currentCharacter.image;
    brewEmoji.className = 'customer-emoji expecting';
  }
  $('#brew-customer-name').textContent = currentCharacter.name;
  $('#brew-customer-mood').textContent = `${currentCharacter.name} 期待地看着你...`;

  hideRoastBubble();
  resetCupAnimation();
  updateBrewStepUI();
  updateDrinkPreview();

  showScreen('brew');
  $('#brew-btn').onclick = () => submitDrink();
  $('#brew-btn').disabled = true;
  $('#brew-btn').textContent = '☕ 完成调制';

  renderCluePanel();
}

function showRoastBubble(text) {
  const bubble = $('#brew-roast-bubble');
  const p = $('#brew-roast-text');
  if (!bubble || !p) return;
  p.textContent = text;
  bubble.classList.remove('hidden');
}

function hideRoastBubble() {
  const bubble = $('#brew-roast-bubble');
  if (bubble) bubble.classList.add('hidden');
}

function resetCupAnimation() {
  $('#cup-liquid').className = 'cup-liquid';
  $('#cup-liquid').style.height = '0%';
  $('#cup-topping').className = 'cup-topping';
  $('#cup-topping').style.opacity = '0';
  $('#ice-cubes').classList.remove('show');
  $('#steam-container').style.opacity = '0';
  $('#stirring-spoon').classList.remove('active');
  $('#heart-decoration').classList.remove('show');
}

function updateBrewStepUI() {
  const step = BREW_STEPS[currentBrewStep];
  $('#brew-step-title').textContent = `${step.icon} ${step.label}`;
  $('#brew-step-hint').textContent = step.hint;

  const dots = $('#brew-step-dots');
  dots.innerHTML = '';
  BREW_STEPS.forEach((s, i) => {
    const dot = document.createElement('span');
    dot.className = 'brew-step-dot';
    if (i < currentBrewStep) dot.classList.add('completed');
    else if (i === currentBrewStep) dot.classList.add('active');
    dots.appendChild(dot);
  });

  renderBrewOptions();
}

function renderBrewOptions() {
  const step = BREW_STEPS[currentBrewStep];
  const container = $('#brew-options');
  container.innerHTML = '';

  let options = DRINK_CONFIG[step.key];
  if (step.key === 'base') {
    options = {};
    state.unlockedBases.forEach(key => options[key] = DRINK_CONFIG.base[key]);
  } else if (step.key === 'topping') {
    options = { none: DRINK_CONFIG.topping.none };
    state.unlockedToppings.forEach(key => {
      if (DRINK_CONFIG.topping[key]) options[key] = DRINK_CONFIG.topping[key];
    });
  }

  Object.entries(options).forEach(([key, data]) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    if (currentDrink[step.key] === key) btn.classList.add('selected');
    btn.innerHTML = `
      <span class="opt-emoji">${data.emoji}</span>
      <span class="opt-name">${data.name}</span>
      <span class="opt-desc">${data.description}</span>
    `;
    btn.onclick = () => selectBrewOption(step.key, key, btn);
    container.appendChild(btn);
  });
}

let isBrewAnimating = false;

function selectBrewOption(type, value, btnElement) {
  if (isBrewAnimating) return;
  isBrewAnimating = true;

  try {
    currentDrink[type] = value;

    const container = btnElement.parentElement;
    if (container) {
      container.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
      btnElement.classList.add('selected');
    }

    const preferred = currentCharacter.preferredDrink[type];
    const reaction = getRealtimeReaction(type, preferred, value);
    const roast = getFailureRoast(type, preferred, value);
    if (reaction) {
      const moodEl = $('#brew-customer-mood');
      if (moodEl) moodEl.textContent = reaction;
      const emojiEl = $('#brew-customer-emoji');
      if (emojiEl) {
        const isNegative = /[？?不没太]|不是|不要|不想|太/.test(reaction);
        emojiEl.className = isNegative ? 'customer-emoji confused' : 'customer-emoji happy';
      }
    }
    if (roast) {
      const isPositive = value === preferred;
      showRoastBubble(isPositive ? `✅ ${roast}` : roast);
    }

    animateBrewStep(type, value, btnElement);
    updateDrinkPreview();

    setTimeout(() => {
      try {
        if (currentBrewStep < BREW_STEPS.length - 1) {
          currentBrewStep++;
          updateBrewStepUI();
        } else {
          const brewBtn = $('#brew-btn');
          if (brewBtn) brewBtn.disabled = false;
          const moodEl = $('#brew-customer-mood');
          if (moodEl) moodEl.textContent = '饮品调制完成，看看顾客的反应吧...';
          const emojiEl = $('#brew-customer-emoji');
          if (emojiEl) emojiEl.className = 'customer-emoji expecting';
          // 确保底部的"完成调制"按钮不被遮挡
          setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }, 100);
        }
      } catch (e) {
        console.error('Brew step transition error:', e);
      } finally {
        isBrewAnimating = false;
      }
    }, 900);
  } catch (e) {
    console.error('selectBrewOption error:', e);
    isBrewAnimating = false;
  }
}

function animateBrewStep(type, value, btnElement) {
  try {
    if (type === 'base') {
      const liquid = $('#cup-liquid');
      if (liquid) {
        liquid.className = `cup-liquid ${value}`;
        liquid.style.height = '50%';
      }
      spawnParticles(btnElement, '✨', 4);
    } else if (type === 'temperature') {
      const liquid = $('#cup-liquid');
      if (liquid) {
        const baseClass = currentDrink.base || 'espresso';
        liquid.className = `cup-liquid ${baseClass} ${value}`;
      }
      const steam = $('#steam-container');
      const ice = $('#ice-cubes');
      if (value === 'iced') {
        ice && ice.classList.add('show');
        if (steam) steam.style.opacity = '0';
      } else {
        ice && ice.classList.remove('show');
        if (steam) steam.style.opacity = value === 'hot' ? '1' : '0.5';
      }
      spawnParticles(btnElement, value === 'iced' ? '❄️' : '✨', 4);
    } else if (type === 'sweetness') {
      const spoon = $('#stirring-spoon');
      if (spoon) {
        spoon.classList.add('active');
        setTimeout(() => spoon.classList.remove('active'), 1200);
      }
      spawnParticles(document.body, '🍬', 5);
    } else if (type === 'topping') {
      const topping = $('#cup-topping');
      const liquid = $('#cup-liquid');
      if (liquid) liquid.style.height = '65%';
      if (topping) {
        if (value !== 'none') {
          topping.className = `cup-topping ${value}`;
          topping.style.opacity = '1';
        } else {
          topping.style.opacity = '0';
        }
      }
      spawnParticles(document.body, '✨', 6);
    }
  } catch (e) {
    console.error('animateBrewStep error:', e);
  }
}

function updateDrinkPreview() {
  $('#preview-name').textContent = getDrinkName(currentDrink);
  const parts = [];
  if (currentDrink.base) parts.push(DRINK_CONFIG.base[currentDrink.base].description);
  if (currentDrink.temperature) parts.push(DRINK_CONFIG.temperature[currentDrink.temperature].description);
  if (currentDrink.sweetness) parts.push(DRINK_CONFIG.sweetness[currentDrink.sweetness].description);
  if (currentDrink.topping) {
    const top = DRINK_CONFIG.topping[currentDrink.topping];
    parts.push(currentDrink.topping === 'none' ? '不加配料' : top.description);
  }
  $('#preview-desc').textContent = parts.length > 0 ? parts.join('，') : '请选择配方开始调制';
}

function submitDrink() {
  const result = calculateMatch(currentDrink, currentCharacter.preferredDrink);
  brewAttempts++;

  $('#heart-decoration').classList.add('show');
  $('#brew-customer-emoji').classList.remove('expecting', 'happy', 'confused');

  if (result.level === 'perfect' || result.level === 'good') {
    $('#brew-customer-emoji').classList.add('happy');
    $('#brew-customer-mood').textContent = '顾客露出了满意的笑容！';
    spawnParticles(document.body, '💖', 10);
  } else {
    $('#brew-customer-emoji').classList.add('confused');
    $('#brew-customer-mood').textContent = '顾客皱了皱眉...';
  }

  setTimeout(() => showFeedback(result), 700);
}

// ===== 反馈界面 =====
function showFeedback(result) {
  const emojiMap = { perfect: '🌟', good: '✨', neutral: '🤔', bad: '💔' };
  const titleMap = { perfect: '完美的回应！', good: '不错的尝试', neutral: '还可以更好', bad: '似乎没有打动TA' };

  $('#feedback-emoji').textContent = emojiMap[result.level];
  $('#feedback-title').textContent = titleMap[result.level];
  $('#feedback-text').textContent = getRandomFeedback(result.level);
  $('#feedback-attempts').textContent = `第 ${brewAttempts} 次尝试`;

  // 收集并展示顾客吐槽
  const roastList = $('#feedback-roast-list');
  const roastPanel = $('#feedback-roast');
  roastList.innerHTML = '';
  const roasts = [];
  ['base', 'temperature', 'sweetness', 'topping'].forEach(key => {
    const preferred = currentCharacter.preferredDrink[key];
    const chosen = currentDrink[key];
    if (preferred && chosen && preferred !== chosen) {
      const roast = getFailureRoast(key, preferred, chosen);
      if (roast) roasts.push(roast);
    }
  });
  if (roasts.length > 0 && result.level !== 'perfect') {
    roastList.innerHTML = roasts.map(r => `<li>${r}</li>`).join('');
    roastPanel.classList.remove('hidden');
  } else {
    roastPanel.classList.add('hidden');
  }

  const storyFrag = $('#story-fragment');
  if (result.level === 'perfect' || result.level === 'good') {
    completeOrder(result.level);
    storyFrag.innerHTML = `
      <h3>📖 故事碎片已解锁</h3>
      <p>${currentCharacter.story.ending[result.level]}</p>
      <p style="margin-top:0.8rem;color:var(--text-secondary);font-size:0.85rem;">「今天有人听懂了我没说出口的话。」—— ${currentCharacter.name}</p>
    `;
    storyFrag.classList.remove('hidden');

    state.addToGuestbook(currentCharacter.name, `「今天有人听懂了我没说出口的话。」`, result.level);
    renderFeedbackActions('success');
  } else {
    storyFrag.classList.add('hidden');
    if (brewAttempts < 3) {
      $('#feedback-text').textContent += ` （${currentCharacter.name} 似乎还想再给你一次机会）`;
      renderFeedbackActions('retry');
    } else {
      completeOrder('bad');
      $('#feedback-text').textContent += ` （${currentCharacter.name} 失望地离开了）`;
      renderFeedbackActions('fail');
    }
  }

  showScreen('feedback');
  // 确保反馈页底部的操作按钮不被遮挡，自动滚动到底部
  setTimeout(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, 50);
}

function completeOrder(level) {
  if (!currentOrderCounted) {
    state.totalOrders++;
    currentOrderCounted = true;
  }
  if (level === 'perfect') {
    if (!currentPerfectCounted) {
      state.perfectOrders++;
      currentPerfectCounted = true;
    }
    state.addWarmth(30);
    state.addFavorability(currentCharacter.id, 30);
  } else if (level === 'good') {
    state.addWarmth(15);
    state.addFavorability(currentCharacter.id, 15);
  } else if (level === 'neutral') {
    state.addWarmth(5);
    state.addFavorability(currentCharacter.id, 5);
  } else if (level === 'bad') {
    state.addFavorability(currentCharacter.id, -10);
  }
  state.completeStory(currentCharacter.id, level);
  state.checkAchievements();
  state.checkMilestones();
}

function renderFeedbackActions(type) {
  const actions = $('#feedback-actions');
  actions.innerHTML = '';

  if (type === 'success') {
    const homeBtn = createActionBtn('🏠 返回咖啡馆', () => renderHome());
    actions.appendChild(homeBtn);
  } else if (type === 'retry') {
    const retryBtn = createActionBtn('🔄 重新调制', () => {
      currentDrink = { base: null, temperature: null, sweetness: null, topping: null };
      currentBrewStep = 0;
      startBrew();
    });
    const talkBtn = createActionBtn('💬 再聊聊', () => {
      showScreen('dialogue');
      addMessage('narrator', `${currentCharacter.name} 叹了口气："也许我需要更直接地告诉你..."`);
      addMessage('customer', currentCharacter.followUp.text);
      collectClue(currentCharacter.followUp.clue);
      renderDialogueActions('after-followup');
    });
    actions.appendChild(retryBtn);
    actions.appendChild(talkBtn);
  } else if (type === 'fail') {
    const homeBtn = createActionBtn('🏠 返回咖啡馆', () => renderHome());
    actions.appendChild(homeBtn);
  }
}

// ===== 粒子效果 =====
function spawnParticles(target, emoji, count) {
  const rect = target && target.getBoundingClientRect
    ? target.getBoundingClientRect()
    : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.textContent = emoji;
    particle.style.left = `${centerX + (Math.random() - 0.5) * 80}px`;
    particle.style.top = `${centerY + (Math.random() - 0.5) * 40}px`;
    particle.style.fontSize = `${1 + Math.random()}rem`;
    particle.style.animationDelay = `${Math.random() * 0.3}s`;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1800);
  }
}

// ===== 留言本 =====
function renderGuestbook() {
  const container = $('#guestbook-list');
  container.innerHTML = '';

  if (state.guestbook.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:2rem;">还没有留言，快去倾听顾客的故事吧~</p>';
  } else {
    state.guestbook.forEach(note => {
      const card = document.createElement('div');
      card.className = `note-card note-${note.level || 'good'}`;
      card.innerHTML = `
        <div class="note-author">${note.author} <span style="font-weight:normal;color:var(--text-light);">· ${note.date}</span></div>
        <div class="note-text">${note.text}</div>
      `;
      container.appendChild(card);
    });
  }

  showScreen('guestbook');
}

// ===== 成就 =====
function renderAchievements() {
  const container = $('#achievements-list');
  container.innerHTML = '';

  ACHIEVEMENTS.forEach(ach => {
    const unlocked = state.achievements.includes(ach.id);
    const item = document.createElement('div');
    item.className = `achievement-item ${unlocked ? 'unlocked' : ''}`;
    item.innerHTML = `
      <span class="item-emoji">${ach.emoji}</span>
      <div class="item-info">
        <div class="item-name">${ach.name}</div>
        <div class="item-desc">${ach.desc}</div>
      </div>
    `;
    container.appendChild(item);
  });

  showScreen('achievements');
}

// ===== 里程碑 =====
function renderMilestones() {
  const container = $('#milestones-list');
  container.innerHTML = '';

  MILESTONES.forEach(ms => {
    const unlocked = state.milestones.includes(ms.id);
    const item = document.createElement('div');
    item.className = `milestone-item ${unlocked ? 'unlocked' : ''}`;
    item.innerHTML = `
      <span class="item-emoji">${ms.emoji}</span>
      <div class="item-info">
        <div class="item-name">${ms.name}</div>
        <div class="item-desc">${ms.desc}</div>
      </div>
    `;
    container.appendChild(item);
  });

  showScreen('milestones');
}

// ===== 角色关系 =====
function renderRelations() {
  const container = $('#relations-list');
  container.innerHTML = '';

  const chars = CHARACTERS.filter(c => state.isCharacterUnlocked(c.id));
  if (chars.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:2rem;">还没有遇见任何顾客，去章节里开始倾听吧~</p>';
  } else {
    chars.forEach(char => {
      const fav = state.favorability[char.id] || 0;
      const level = state.getFavorabilityLevel(fav);
      const completed = state.isStoryCompleted(char.id);
      const hasSpecial = char.specialStory && fav >= char.specialStory.unlockFavorability;
      const card = document.createElement('div');
      card.className = 'relation-card';
      const avatarHtml = char.image
        ? `<img class="relation-avatar" src="${char.image}" alt="${char.name}">`
        : `<div class="relation-avatar">${char.emoji}</div>`;
      card.innerHTML = `
        ${avatarHtml}
        <div class="relation-info">
          <div class="relation-name">${char.name} ${completed ? '✓' : ''}</div>
          <div class="relation-level">${level.emoji} ${level.name}</div>
          <div class="relation-bar"><div class="relation-fill" style="width:${Math.min(100, (fav / 200) * 100)}%"></div></div>
          <div class="relation-status">${hasSpecial ? '💌 特殊剧情已解锁' : level.desc}</div>
        </div>
      `;
      card.onclick = () => startCharacterStory(char.id);
      container.appendChild(card);
    });
  }

  showScreen('relations');
}

// ===== 设置 =====
function renderSettings() {
  $('#save-status').textContent = '已保存';
  $('#save-date').textContent = new Date().toLocaleString('zh-CN');
  $('#reset-warmth').textContent = state.warmth;
  $('#reset-orders').textContent = state.totalOrders;
  $('#reset-perfect').textContent = state.perfectOrders;
  $('#reset-hearts').textContent = state.heartTokens;

  // 更新账号入口
  const settingsAvatar = $('#settings-avatar');
  const settingsNickname = $('#settings-nickname');
  const settingsPhone = $('#settings-phone');
  if (settingsAvatar && settingsNickname && settingsPhone) {
    settingsAvatar.textContent = state.avatar || '☕';
    settingsNickname.textContent = state.nickname || '咖啡馆主';
    settingsPhone.textContent = state.phone || '未登录';
  }

  const audioNames = {
    cafe_ambient: '咖啡馆环境音',
    soft_music: '轻快音乐',
    rain_sound: '窗外雨声',
    lofi_beats: 'Lofi 节拍',
    fireplace: '壁炉白噪音'
  };
  $('#reset-audio').textContent = state.unlockedAudio.map(id => audioNames[id] || id).join('、') || '无';

  const decorNames = {
    cafe_plant: '窗边绿植',
    warm_lamp: '暖黄台灯',
    wall_quote: '留言黑板'
  };
  const decorList = state.unlockedDecor.length > 0
    ? state.unlockedDecor.map(id => decorNames[id] || id).join('、')
    : '暂无';
  const existingDecor = $('#reset-decor');
  if (existingDecor) existingDecor.textContent = decorList;

  const audioToggle = $('#audio-toggle');
  if (audioToggle) {
    audioToggle.checked = state.audioEnabled;
    audioToggle.onchange = (e) => {
      state.toggleAudio(e.target.checked);
      if (state.audioEnabled) {
        playActiveBGM();
      } else {
        AudioEngine.stop();
      }
    };
  }

  // 音乐工坊入口
  const workshopEntry = $('#music-workshop-entry');
  if (workshopEntry) {
    workshopEntry.style.display = state.unlockedWorkshop ? 'flex' : 'none';
  }

  showScreen('settings');
}

function playActiveBGM() {
  if (!state.audioEnabled) return;
  AudioEngine.stop();
  if (state.getActiveMelody()) {
    AudioEngine.playCustomMelody();
  } else if (state.isAudioUnlocked('soft_music')) {
    AudioEngine.playSoftMusic();
  } else if (state.isAudioUnlocked('rain_sound')) {
    AudioEngine.playRain();
  } else if (state.isAudioUnlocked('lofi_beats')) {
    AudioEngine.playLofi();
  } else if (state.isAudioUnlocked('fireplace')) {
    AudioEngine.playFireplace();
  }
}

function resetGame() {
  if (confirm('确定要重置所有进度吗？这将清除所有已解锁的故事、留言和温暖值。')) {
    state.reset();
    alert('游戏已重置');
    renderHome();
  }
}

// ===== 底部导航 =====
function setupNavigation() {
  $('#nav-home').onclick = () => { setActiveNav('home'); renderHome(); };
  $('#nav-minigame').onclick = () => { setActiveNav('minigame'); showMinigame(); };
  $('#nav-achievements').onclick = () => { setActiveNav('achievements'); renderAchievements(); };
  $('#nav-guestbook').onclick = () => { setActiveNav('guestbook'); renderGuestbook(); };
  $('#nav-settings').onclick = () => { setActiveNav('settings'); renderSettings(); };
}

function setActiveNav(name) {
  $$('.nav-btn').forEach(btn => btn.classList.remove('active'));
  $(`#nav-${name}`).classList.add('active');
}

// ===== 初始化 =====
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => $('#loading').classList.add('hidden'), 1200);
  setupNavigation();
  if (!state.phone) {
    renderAuthScreen();
  } else {
    renderHome();
  }
  $('#reset-btn').onclick = () => resetGame();
});

// ===== 登录/注册/账号管理界面 =====
function renderAuthScreen(mode = 'login') {
  const screen = $('#screen-auth');
  if (!screen) return;

  const accounts = AccountManager.getAccounts();
  const accountList = Object.values(accounts);

  if (mode === 'login') {
    screen.innerHTML = `
      <div class="auth-card">
        <div class="auth-logo">☕</div>
        <h1>时光咖啡馆</h1>
        <p class="auth-subtitle">登录你的专属咖啡馆</p>
        <div class="auth-form">
          <input type="tel" id="auth-phone" placeholder="手机号" maxlength="11">
          <input type="password" id="auth-password" placeholder="密码">
          <button class="auth-btn primary" onclick="doLogin()">登录</button>
          <button class="auth-btn secondary" onclick="renderAuthScreen('register')">注册新账号</button>
        </div>
        ${accountList.length > 0 ? `
          <div class="auth-accounts">
            <p class="auth-divider">或选择已有账号</p>
            <div class="account-list">
              ${accountList.map(acc => `
                <div class="account-item" onclick="fillLogin('${acc.phone}')">
                  <span class="account-avatar">${acc.avatar}</span>
                  <div class="account-info">
                    <span class="account-name">${escapeHtml(acc.nickname)}</span>
                    <span class="account-phone">${acc.phone}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  } else {
    screen.innerHTML = `
      <div class="auth-card">
        <div class="auth-logo">☕</div>
        <h1>注册账号</h1>
        <p class="auth-subtitle">创建属于你的咖啡馆</p>
        <div class="auth-form">
          <input type="tel" id="auth-phone" placeholder="手机号" maxlength="11">
          <input type="password" id="auth-password" placeholder="密码（至少 4 位）">
          <input type="password" id="auth-password2" placeholder="确认密码">
          <input type="text" id="auth-nickname" placeholder="昵称" maxlength="12">
          <div class="avatar-picker">
            <p>选择头像</p>
            <div class="avatar-options">
              ${PRESET_AVATARS.map(a => `<button class="avatar-option ${a === '☕' ? 'selected' : ''}" data-avatar="${a}" onclick="selectAvatar(this)">${a}</button>`).join('')}
            </div>
          </div>
          <button class="auth-btn primary" onclick="doRegister()">注册</button>
          <button class="auth-btn secondary" onclick="renderAuthScreen('login')">已有账号？去登录</button>
        </div>
      </div>
    `;
  }
  showScreen('auth');
}

function fillLogin(phone) {
  const phoneInput = $('#auth-phone');
  if (phoneInput) phoneInput.value = phone;
}

let selectedAvatar = '☕';
function selectAvatar(btn) {
  document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedAvatar = btn.dataset.avatar;
}

function doLogin() {
  const phone = $('#auth-phone').value.trim();
  const password = $('#auth-password').value;
  const result = AccountManager.login(phone, password);
  if (result.success) {
    // 重新加载当前账号的存档
    state = new GameState();
    showToast(`欢迎回来，${state.nickname}`);
    renderHome();
  } else {
    showToast(result.message);
  }
}

function doRegister() {
  const phone = $('#auth-phone').value.trim();
  const password = $('#auth-password').value;
  const password2 = $('#auth-password2').value;
  const nickname = $('#auth-nickname').value.trim();

  if (password !== password2) {
    showToast('两次输入的密码不一致');
    return;
  }

  const result = AccountManager.register(phone, password, nickname, selectedAvatar);
  if (result.success) {
    AccountManager.login(phone, password);
    state = new GameState();
    showToast(`欢迎，${state.nickname}`);
    renderHome();
  } else {
    showToast(result.message);
  }
}

function renderProfileEdit() {
  const screen = $('#screen-profile');
  if (!screen) return;
  const account = AccountManager.getAccount(state.phone);
  if (!account) return;

  screen.innerHTML = `
    <div class="profile-card">
      <button class="back-btn" onclick="renderSettings()">← 返回</button>
      <h2>👤 个人资料</h2>
      <div class="profile-avatar-large">${account.avatar}</div>
      <div class="avatar-picker">
        <p>更换头像</p>
        <div class="avatar-options">
          ${PRESET_AVATARS.map(a => `<button class="avatar-option ${a === account.avatar ? 'selected' : ''}" data-avatar="${a}" onclick="selectProfileAvatar(this)">${a}</button>`).join('')}
        </div>
      </div>
      <div class="profile-form">
        <label>昵称</label>
        <input type="text" id="profile-nickname" value="${escapeHtml(account.nickname)}" maxlength="12">
        <label>手机号</label>
        <input type="text" value="${account.phone}" disabled>
        <button class="auth-btn primary" onclick="saveProfile()">保存资料</button>
      </div>
      <div class="profile-password">
        <h4>修改密码</h4>
        <input type="password" id="profile-old-pwd" placeholder="原密码">
        <input type="password" id="profile-new-pwd" placeholder="新密码（至少 4 位）">
        <button class="auth-btn secondary" onclick="changeProfilePassword()">修改密码</button>
      </div>
      <div class="profile-actions">
        <button class="auth-btn secondary" onclick="doSwitchAccount()">切换账号</button>
        <button class="auth-btn danger" onclick="doLogout()">退出登录</button>
      </div>
    </div>
  `;
  showScreen('profile');
}

let profileSelectedAvatar = '';
function selectProfileAvatar(btn) {
  document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  profileSelectedAvatar = btn.dataset.avatar;
}

function saveProfile() {
  const nickname = $('#profile-nickname').value.trim();
  if (!nickname) {
    showToast('昵称不能为空');
    return;
  }
  const updates = { nickname };
  if (profileSelectedAvatar) updates.avatar = profileSelectedAvatar;
  const result = AccountManager.updateProfile(state.phone, updates);
  if (result.success) {
    state.nickname = nickname;
    if (profileSelectedAvatar) state.avatar = profileSelectedAvatar;
    showToast('资料已保存');
    renderHome();
  } else {
    showToast(result.message);
  }
}

function changeProfilePassword() {
  const oldPwd = $('#profile-old-pwd').value;
  const newPwd = $('#profile-new-pwd').value;
  const result = AccountManager.changePassword(state.phone, oldPwd, newPwd);
  showToast(result.success ? '密码已修改' : result.message);
}

function doLogout() {
  AccountManager.logout();
  location.reload();
}

function doSwitchAccount() {
  AccountManager.logout();
  location.reload();
}
