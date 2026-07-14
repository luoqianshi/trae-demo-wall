window.GameSystem = {
  config: {
    maxHearts: 5,
    heartRestoreMinutes: 10,
    xpPerChar: 10,
    xpPerCorrect: 5,
    xpPerCombo3: 15,
    xpDailyFirst: 20,
    xpStreakBonus: 30,
    xpCompleteLesson: 50,
    xpUpgradeBonus: 100,
    coinsPerChar: 1,
    coinsPerCorrect: 1,
    coinsDailyFirst: 5,
    coinsStreakBonus: 10,
    coinsCompleteLesson: 20,
    coinsUpgradeBonus: 50,
    comboHeartReward: 5,
    priceRestoreHeart: 20,
    priceRestoreAllHearts: 80,
    priceXpBoost: 50,
    priceStreakProtector: 100
  },

  BADGES: {
    fire_guardian: { id: 'fire_guardian', name: '火焰守护者', icon: '🔥', field: 'streak', op: '>=', value: 7 },
    master_reader: { id: 'master_reader', name: '识字达人', icon: '📚', field: 'totalChars', op: '>=', value: 500 },
    sharp_shooter: { id: 'sharp_shooter', name: '精准射手', icon: '🎯', field: 'consecutiveCorrect', op: '>=', value: 20 },
    speed_learner: { id: 'speed_learner', name: '闪电学习者', icon: '⚡', field: 'dailyMinutes', op: '>=', value: 30 },
    explorer: { id: 'explorer', name: '探索家', icon: '🗺️', field: 'completedLessons', op: '>=', value: 10 },
    combo_king: { id: 'combo_king', name: '连击之王', icon: '👑', field: 'maxCombo', op: '>=', value: 10 },
    daily_champion: { id: 'daily_champion', name: '每日冠军', icon: '🏆', field: 'streak', op: '>=', value: 30 },
    heart_breaker: { id: 'heart_breaker', name: '破心者', icon: '💔', field: 'totalWrong', op: '>=', value: 100 }
  },

  LEVELS: [
    { level: 1, minXp: 0 },
    { level: 2, minXp: 100 },
    { level: 3, minXp: 300 },
    { level: 4, minXp: 600 },
    { level: 5, minXp: 1000 },
    { level: 6, minXp: 1500 },
    { level: 7, minXp: 2100 },
    { level: 8, minXp: 2800 },
    { level: 9, minXp: 3600 },
    { level: 10, minXp: 4500 }
  ],

  state: {},

  init: function() {
    this.loadState();
    this.checkDailyReset();
    this.restoreHearts();
    setInterval(() => this.restoreHearts(), 60000);
  },

  loadState: function() {
    const saved = localStorage.getItem('yx_game_state');
    if (saved) {
      try {
        this.state = JSON.parse(saved);
      } catch (e) {
        console.error('[GameSystem] 状态数据损坏，使用默认状态', e);
        this._initDefaultState();
      }
    } else {
      this._initDefaultState();
    }
  },

  _initDefaultState: function() {
    this.state = {
      xp: 1250,
      level: 5,
      coins: 180,
      hearts: 5,
      lastHeartRestore: Date.now(),
      badges: ['fire_guardian', 'sharp_shooter', 'combo_king'],
      completedLessons: ['lesson_1', 'lesson_2', 'lesson_3'],
      currentLessonId: 'lesson_4',
      maxCombo: 0,
      streak: 7,
      totalChars: 128,
      totalCorrect: 456,
      totalWrong: 32,
      consecutiveCorrect: 0,
      dailyMinutes: 0,
      lastPlayDate: new Date().toDateString(),
      xpBoostActive: false,
      xpBoostEndTime: 0,
      streakProtected: false,
      version: 2
    };
    this.saveState();
  },

  saveState: function() {
    localStorage.setItem('yx_game_state', JSON.stringify(this.state));
  },

  checkDailyReset: function() {
    const today = new Date().toDateString();
    if (this.state.lastPlayDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      
      if (this.state.lastPlayDate && this.state.lastPlayDate !== yesterdayStr) {
        if (this.state.streakProtected) {
          this.state.streakProtected = false;
          this.showToast('🛡️ 连胜保护器生效，保住了连续打卡！');
        } else {
          this.state.streak = 0;
        }
      }
      
      this.state.streak += 1;
      this.state.hearts = this.config.maxHearts;
      this.state.dailyMinutes = 0;
      this.state.lastPlayDate = today;
      this.addXP(this.config.xpDailyFirst);
      this.addCoins(this.config.coinsDailyFirst);
      this.saveState();
      this.showMascot('happy');
      this.showToast('🎉 欢迎回来！红心已补满，今日奖励已发放');
    }
  },

  restoreHearts: function() {
    const now = Date.now();
    const minutesPassed = (now - this.state.lastHeartRestore) / 60000;
    const heartsToRestore = Math.floor(minutesPassed / this.config.heartRestoreMinutes);
    
    if (heartsToRestore > 0) {
      const actualRestored = Math.min(heartsToRestore, this.config.maxHearts - this.state.hearts);
      this.state.hearts = Math.min(this.state.hearts + heartsToRestore, this.config.maxHearts);
      this.state.lastHeartRestore += actualRestored * this.config.heartRestoreMinutes * 60000;
      this.saveState();
      this.updateUI();
    }
  },

  addXP: function(amount) {
    const multiplier = this.state.xpBoostActive && Date.now() < this.state.xpBoostEndTime ? 2 : 1;
    const actualAmount = amount * multiplier;
    this.state.xp += actualAmount;
    
    const oldLevel = this.state.level;
    this.calculateLevel();
    const newLevel = this.state.level;
    
    if (newLevel > oldLevel) {
      this.onLevelUp(newLevel);
    }
    
    this.saveState();
    this.updateUI();
    return actualAmount;
  },

  addCoins: function(amount) {
    this.state.coins += amount;
    this.saveState();
    this.updateUI();
  },

  consumeHeart: function() {
    if (this.state.hearts > 0) {
      this.state.hearts--;
      this.state.totalWrong++;
      this.state.consecutiveCorrect = 0;
      
      if (this.state.hearts === 0) {
        this.showMascot('sad');
        this.showToast('❤️ 红心用完了，休息一下吧！');
      }
      
      this.checkBadges();
      this.saveState();
      this.updateUI();
      return true;
    }
    return false;
  },

  addHeart: function() {
    if (this.state.hearts < this.config.maxHearts) {
      this.state.hearts++;
      this.saveState();
      this.updateUI();
    }
  },

  calculateLevel: function() {
    for (let i = this.LEVELS.length - 1; i >= 0; i--) {
      if (this.state.xp >= this.LEVELS[i].minXp) {
        this.state.level = this.LEVELS[i].level;
        return;
      }
    }
    this.state.level = 1;
  },

  getLevelProgress: function() {
    const currentLevelData = this.LEVELS.find(l => l.level === this.state.level);
    const nextLevelData = this.LEVELS.find(l => l.level === this.state.level + 1);
    
    if (!nextLevelData) return 100;
    
    const currentMin = currentLevelData.minXp;
    const nextMin = nextLevelData.minXp;
    const progress = ((this.state.xp - currentMin) / (nextMin - currentMin)) * 100;
    
    return Math.min(Math.max(progress, 0), 100);
  },

  getNextLevelXp: function() {
    const nextLevelData = this.LEVELS.find(l => l.level === this.state.level + 1);
    return nextLevelData ? nextLevelData.minXp : this.state.xp;
  },

  onLevelUp: function(newLevel) {
    this.showMascot('surprised');
    this.addCoins(this.config.coinsUpgradeBonus);
    this.state.xp += this.config.xpUpgradeBonus;
    this.checkBadges();
    this.saveState();
    this.updateUI();
    this.showUpgradeModal(newLevel);
  },

  _evalBadgeCondition: function(badge, progress) {
    const fieldValue = progress[badge.field];
    if (fieldValue === undefined) return false;
    switch (badge.op) {
      case '>=': return fieldValue >= badge.value;
      case '>': return fieldValue > badge.value;
      case '<=': return fieldValue <= badge.value;
      case '<': return fieldValue < badge.value;
      case '==': return fieldValue === badge.value;
      default: return false;
    }
  },

  checkBadges: function() {
    const progress = {
      streak: this.state.streak,
      totalChars: this.state.totalChars,
      consecutiveCorrect: this.state.consecutiveCorrect,
      dailyMinutes: this.state.dailyMinutes,
      completedLessons: this.state.completedLessons.length,
      maxCombo: this.state.maxCombo,
      totalWrong: this.state.totalWrong
    };

    let newBadges = [];
    Object.keys(this.BADGES).forEach(badgeId => {
      if (!this.state.badges.includes(badgeId)) {
        const badge = this.BADGES[badgeId];
        if (this._evalBadgeCondition(badge, progress)) {
          this.state.badges.push(badgeId);
          newBadges.push(badge);
        }
      }
    });

    if (newBadges.length > 0) {
      this.showMascot('happy');
      newBadges.forEach((badge, index) => {
        setTimeout(() => {
          this.showToast(`🏅 获得徽章：${badge.name}`);
        }, index * 800);
      });
      this.saveState();
      this.updateUI();
    }
  },

  onCorrectAnswer: function() {
    this.state.totalCorrect++;
    this.state.consecutiveCorrect++;
    this.state.maxCombo = Math.max(this.state.maxCombo, this.state.consecutiveCorrect);
    
    let xp = this.config.xpPerCorrect;
    let coins = this.config.coinsPerCorrect;
    
    if (this.state.consecutiveCorrect >= 3) {
      xp += this.config.xpPerCombo3;
    }
    
    if (this.state.consecutiveCorrect > 0 && this.state.consecutiveCorrect % this.config.comboHeartReward === 0) {
      this.addHeart();
      this.showToast('❤️ 连续答对奖励一颗红心！');
    }
    
    const actualXp = this.addXP(xp);
    this.addCoins(coins);
    this.checkBadges();
    
    return { xp: actualXp, combo: this.state.consecutiveCorrect };
  },

  onWrongAnswer: function() {
    this.consumeHeart();
  },

  onLearnChar: function() {
    this.state.totalChars++;
    this.addXP(this.config.xpPerChar);
    this.addCoins(this.config.coinsPerChar);
    this.checkBadges();
  },

  onCompleteLesson: function(lessonId) {
    if (!this.state.completedLessons.includes(lessonId)) {
      this.state.completedLessons.push(lessonId);
      this.addXP(this.config.xpCompleteLesson);
      this.addCoins(this.config.coinsCompleteLesson);
      this.checkBadges();
      this.showMascot('happy');
      this.showToast('🎉 恭喜完成课程！');
    }
  },

  buyItem: function(itemId) {
    const prices = {
      restore_heart: this.config.priceRestoreHeart,
      restore_all_hearts: this.config.priceRestoreAllHearts,
      xp_boost: this.config.priceXpBoost,
      streak_protector: this.config.priceStreakProtector
    };

    const price = prices[itemId];
    if (!price) return false;
    if (this.state.coins < price) return false;

    if (itemId === 'restore_heart' && this.state.hearts >= this.config.maxHearts) {
      this.showToast('❤️ 红心已满');
      return false;
    }
    if (itemId === 'restore_all_hearts' && this.state.hearts >= this.config.maxHearts) {
      this.showToast('❤️ 红心已满');
      return false;
    }

    this.state.coins -= price;

    switch (itemId) {
      case 'restore_heart':
        this.addHeart();
        this.showToast('❤️ 恢复一颗红心');
        break;
      case 'restore_all_hearts':
        this.state.hearts = this.config.maxHearts;
        this.showToast('❤️❤️❤️❤️❤️ 红心全部恢复！');
        break;
      case 'xp_boost':
        this.state.xpBoostActive = true;
        this.state.xpBoostEndTime = Date.now() + 3600000;
        this.showToast('⚡ XP翻倍卡已激活，持续1小时！');
        break;
      case 'streak_protector':
        this.state.streakProtected = true;
        this.showToast('🛡️ 连胜保护器已激活！');
        break;
    }

    this.saveState();
    this.updateUI();
    return true;
  },

  updateUI: function() {
    window.dispatchEvent(new CustomEvent('gameStateChange', { detail: this.state }));
  },

  showMascot: function(emotion) {
    window.dispatchEvent(new CustomEvent('mascotEmotion', { detail: emotion }));
  },

  showToast: function(message) {
    const toast = document.createElement('div');
    toast.className = 'game-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-size: 14px;
      z-index: 3000;
      animation: toastAppear 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  },

  showUpgradeModal: function(newLevel) {
    const modal = document.createElement('div');
    modal.className = 'game-modal-overlay';
    
    modal.innerHTML = `
      <div class="game-upgrade-modal">
        <div class="game-upgrade-icon">🎊</div>
        <div class="game-upgrade-title">升级啦！</div>
        <div class="game-upgrade-text">恭喜你达到 ${newLevel} 级</div>
        <div class="game-upgrade-rewards">
          <div class="game-upgrade-reward">
            <div class="game-upgrade-reward-icon">⭐</div>
            <div class="game-upgrade-reward-text">+${this.config.xpUpgradeBonus} XP</div>
          </div>
          <div class="game-upgrade-reward">
            <div class="game-upgrade-reward-icon">💰</div>
            <div class="game-upgrade-reward-text">+${this.config.coinsUpgradeBonus} 识字币</div>
          </div>
        </div>
        <button class="game-upgrade-btn" onclick="document.querySelector('.game-modal-overlay').remove()">太棒了！</button>
      </div>
    `;
    
    document.body.appendChild(modal);
  },

  showFloatingXP: function(xp, x, y) {
    const el = document.createElement('div');
    el.className = 'game-floating-xp';
    el.textContent = `+${xp} XP`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  },

  getUnlockedLessons: function() {
    const lessons = window.DemoData ? window.DemoData.lessons || [] : [];
    return lessons.filter(lesson => {
      if (!lesson.requiredLesson) return true;
      return this.state.completedLessons.includes(lesson.requiredLesson);
    });
  },

  isLessonUnlocked: function(lessonId) {
    const lesson = window.DemoData && window.DemoData.lessons 
      ? window.DemoData.lessons.find(l => l.id === lessonId) 
      : null;
    if (!lesson) return false;
    if (!lesson.requiredLesson) return true;
    return this.state.completedLessons.includes(lesson.requiredLesson);
  },

  isLessonCompleted: function(lessonId) {
    return this.state.completedLessons.includes(lessonId);
  },

  canClaimDailyBonus: function() {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('lastDailyBonusDate');
    return lastDate !== today;
  },

  claimDailyBonus: function() {
    if (!this.canClaimDailyBonus()) return false;
    const today = new Date().toDateString();
    localStorage.setItem('lastDailyBonusDate', today);
    this.addCoins(20);
    this.addXP(10);
    this.addHeart();
    return true;
  },

  onSpeakPractice: function(score) {
    if (score >= 60) {
      this.addXP(5);
      this.addCoins(3);
      return { xp: 5, coins: 3 };
    }
    return { xp: 0, coins: 0 };
  },

  showDailyBonusModal: function() {
    const overlay = document.createElement('div');
    overlay.className = 'daily-bonus-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'daily-bonus-modal';
    
    const canClaim = this.canClaimDailyBonus();
    
    modal.innerHTML = `
      <div class="daily-bonus-title">每日签到奖励</div>
      <div class="daily-bonus-rewards">
        <div class="daily-bonus-reward-item">
          <div class="daily-bonus-coins">💰</div>
          <div class="daily-bonus-reward-text">+20 金币</div>
        </div>
        <div class="daily-bonus-reward-item">
          <div class="daily-bonus-xp">⭐</div>
          <div class="daily-bonus-reward-text">+10 XP</div>
        </div>
        <div class="daily-bonus-reward-item">
          <div class="daily-bonus-heart">❤️</div>
          <div class="daily-bonus-reward-text">+1 红心</div>
        </div>
      </div>
      <button class="daily-bonus-btn ${canClaim ? '' : 'claimed'}" id="dailyBonusBtn">
        ${canClaim ? '立即领取' : '今日已签到'}
      </button>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    const phoneFrame = document.querySelector('.phone-frame');
    if (phoneFrame) {
      const frameRect = phoneFrame.getBoundingClientRect();
      modal.style.left = (frameRect.left + frameRect.width / 2) + 'px';
      modal.style.top = (frameRect.top + frameRect.height / 2) + 'px';
    }
    
    const btn = modal.querySelector('#dailyBonusBtn');
    btn.addEventListener('click', () => {
      if (canClaim) {
        this.claimDailyBonus();
        this.playFlyingCoins(modal);
        overlay.remove();
        this.showToast('🎉 签到成功！奖励已发放');
      } else {
        overlay.remove();
      }
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  },

  playFlyingCoins: function(sourceEl) {
    const sourceRect = sourceEl.getBoundingClientRect();
    const coinContainer = document.querySelector('.game-coin-container');
    const targetRect = coinContainer ? coinContainer.getBoundingClientRect() : null;
    
    const coinCount = 6;
    for (let i = 0; i < coinCount; i++) {
      const coin = document.createElement('div');
      coin.className = 'flying-coin';
      coin.textContent = '💰';
      
      const startX = sourceRect.left + sourceRect.width / 2 + (Math.random() - 0.5) * 60;
      const startY = sourceRect.top + sourceRect.height / 2 + (Math.random() - 0.5) * 40;
      
      let endX, endY;
      if (targetRect) {
        endX = targetRect.left + targetRect.width / 2;
        endY = targetRect.top + targetRect.height / 2;
      } else {
        endX = startX;
        endY = startY - 200;
      }
      
      coin.style.left = startX + 'px';
      coin.style.top = startY + 'px';
      coin.style.setProperty('--end-x', (endX - startX) + 'px');
      coin.style.setProperty('--end-y', (endY - startY) + 'px');
      coin.style.animationDelay = (i * 0.1) + 's';
      
      document.body.appendChild(coin);
      
      setTimeout(() => coin.remove(), 1000 + i * 100);
    }
  }
};

document.addEventListener('DOMContentLoaded', function() {
  window.GameSystem.init();
});