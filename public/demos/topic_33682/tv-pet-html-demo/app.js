/**
 * 家庭宠物养成 — 可交互 HTML Demo
 * 完整前端应用，使用 LocalStorage 持久化数据
 */

// ===== Data & Config =====
const PET_TYPES = [
  { type: '鼠', name: '小老鼠', file: 'rat.png', color: '#9E9E9E' },
  { type: '牛', name: '小牛', file: 'ox.png', color: '#795548' },
  { type: '虎', name: '小老虎', file: 'tiger.png', color: '#FF9800' },
  { type: '兔', name: '小兔子', file: 'rabbit.png', color: '#F48FB1' },
  { type: '龙', name: '小龙', file: 'dragon.png', color: '#EF5350' },
  { type: '蛇', name: '小蛇', file: 'snake.png', color: '#66BB6A' },
  { type: '马', name: '小马', file: 'horse.png', color: '#A1887F' },
  { type: '羊', name: '小羊', file: 'sheep.png', color: '#90CAF9' },
  { type: '猴', name: '小猴', file: 'monkey.png', color: '#FF7043' },
  { type: '鸡', name: '小鸡', file: 'rooster.png', color: '#FFC107' },
  { type: '狗', name: '小狗', file: 'dog.png', color: '#8D6E63' },
  { type: '猪', name: '小猪', file: 'pig.png', color: '#F06292' },
  { type: '猫', name: '小猫', file: 'cat.png', color: '#FF9800' },
];

const DEFAULT_TASKS = [
  { id: 1, name: '自己刷牙', desc: '早晚认真刷牙', points: 5, type: 'daily', completed: false },
  { id: 2, name: '帮忙收餐具', desc: '饭后帮忙收拾碗筷', points: 10, type: 'daily', completed: false },
  { id: 3, name: '读绘本20分钟', desc: '认真阅读绘本', points: 15, type: 'daily', completed: false },
  { id: 4, name: '整理自己房间', desc: '把玩具和书本归位', points: 20, type: 'daily', completed: false },
  { id: 5, name: '完成本周作业', desc: '按时完成所有作业', points: 30, type: 'weekly', completed: false },
  { id: 6, name: '学一首新诗', desc: '背诵一首古诗', points: 25, type: 'weekly', completed: false },
  { id: 7, name: '第一次独自睡觉', desc: '勇敢尝试自己睡', points: 50, type: 'onetime', completed: false },
  { id: 8, name: '学会骑自行车', desc: '成功学会骑车', points: 100, type: 'onetime', completed: false },
];

const DEFAULT_REWARDS = [
  { id: 1, name: '看一集动画片', desc: '选择喜欢的动画片', icon: '📺', points: 50 },
  { id: 2, name: '买一个小玩具', desc: '去商店挑选玩具', icon: '🧸', points: 100 },
  { id: 3, name: '去公园玩', desc: '全家一起去公园', icon: '🌳', points: 150 },
  { id: 4, name: '吃一次冰淇淋', desc: '选择喜欢的口味', icon: '🍦', points: 30 },
  { id: 5, name: '买一个大玩具', desc: '期待已久的大礼物', icon: '🎁', points: 500 },
  { id: 6, name: '周末去游乐园', desc: '全家出游一天', icon: '🎢', points: 300 },
];

const OPPONENT_NAMES = ['闪电', '火焰', '冰霜', '风暴', '雷霆', '暗影', '星光', '月光'];

// ===== State Management =====
const AppState = {
  pet: null,
  points: 0,
  tasks: [],
  rewards: [],
  battleCount: 0,
  battleDate: null,
  leaderboard: [],
  adminPassword: 'admin',

  init() {
    this.load();
    if (this.tasks.length === 0) this.tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS));
    if (this.rewards.length === 0) this.rewards = JSON.parse(JSON.stringify(DEFAULT_REWARDS));
    this.resetDailyTasks();
    this.save();
  },

  load() {
    const data = localStorage.getItem('tvPetData');
    if (data) {
      const parsed = JSON.parse(data);
      this.pet = parsed.pet;
      this.points = parsed.points || 0;
      this.tasks = parsed.tasks || [];
      this.rewards = parsed.rewards || [];
      this.battleCount = parsed.battleCount || 0;
      this.battleDate = parsed.battleDate;
      this.leaderboard = parsed.leaderboard || [];
    }
  },

  save() {
    localStorage.setItem('tvPetData', JSON.stringify({
      pet: this.pet,
      points: this.points,
      tasks: this.tasks,
      rewards: this.rewards,
      battleCount: this.battleCount,
      battleDate: this.battleDate,
      leaderboard: this.leaderboard,
    }));
  },

  resetDailyTasks() {
    const today = new Date().toDateString();
    if (this.battleDate !== today) {
      this.battleCount = 0;
      this.battleDate = today;
      this.tasks.forEach(t => {
        if (t.type === 'daily') t.completed = false;
      });
      // Weekly reset on Monday
      if (new Date().getDay() === 1) {
        this.tasks.forEach(t => {
          if (t.type === 'weekly') t.completed = false;
        });
      }
    }
  },

  adoptPet(name, typeIndex) {
    const type = PET_TYPES[typeIndex];
    this.pet = {
      name,
      type: type.type,
      typeName: type.name,
      file: type.file,
      color: type.color,
      level: 1,
      exp: 0,
      expMax: 100,
      attack: 15,
      defense: 12,
      agility: 10,
      hp: 100,
      hpMax: 100,
      dodge: 5,
      dodgeRate: 0.05,
      crit: 5,
      critRate: 0.05,
      wins: 0,
      losses: 0,
      rating: 1000,
    };
    this.save();
  },

  addPoints(amount) {
    this.points += amount;
    this.save();
  },

  addExp(amount) {
    if (!this.pet) return;
    this.pet.exp += amount;
    while (this.pet.exp >= this.pet.expMax) {
      this.pet.exp -= this.pet.expMax;
      this.levelUp();
    }
    this.save();
  },

  levelUp() {
    this.pet.level++;
    this.pet.expMax = 100 * (1 << (this.pet.level - 1));
    this.pet.attack += 3;
    this.pet.defense += 2;
    this.pet.agility += 2;
    this.pet.hpMax += 15;
    this.pet.hp = this.pet.hpMax;
    showToast('🎉', `宠物升级了！现在是 Lv.${this.pet.level}`);
  },

  interact(action) {
    if (!this.pet) return;
    const effects = {
      feed: { hp: 10, exp: 5, msg: '宠物吃饱了！生命+10 经验+5' },
      play: { agility: 1, exp: 8, msg: '宠物玩得很开心！敏捷+1 经验+8' },
      train: { attack: 1, exp: 10, msg: '训练有成效！攻击+1 经验+10' },
      sleep: { hp: 20, defense: 1, exp: 3, msg: '宠物休息好了！生命+20 防御+1 经验+3' },
    };
    const e = effects[action];
    if (e.hp) this.pet.hp = Math.min(this.pet.hpMax, this.pet.hp + e.hp);
    if (e.attack) this.pet.attack += e.attack;
    if (e.defense) this.pet.defense += e.defense;
    if (e.agility) this.pet.agility += e.agility;
    this.addExp(e.exp || 0);
    this.save();
    return e.msg;
  },

  completeTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      task.completed = true;
      this.addPoints(task.points);
      this.addExp(Math.floor(task.points / 2));
      this.save();
      return task.points;
    }
    return 0;
  },

  redeemReward(rewardId) {
    const reward = this.rewards.find(r => r.id === rewardId);
    if (reward && this.points >= reward.points) {
      this.points -= reward.points;
      this.save();
      return true;
    }
    return false;
  },

  recordBattle(won, opponentRating) {
    if (won) {
      this.pet.wins++;
      this.pet.rating += Math.floor((opponentRating - this.pet.rating) * 0.1) + 10;
      this.addPoints(20);
      this.addExp(15);
    } else {
      this.pet.losses++;
      this.pet.rating = Math.max(800, this.pet.rating - 5);
      this.addExp(5);
    }
    this.battleCount++;
    this.updateLeaderboard();
    this.save();
  },

  updateLeaderboard() {
    if (!this.pet) return;
    const entry = {
      name: this.pet.name,
      type: this.pet.type,
      rating: this.pet.rating,
      wins: this.pet.wins,
    };
    const idx = this.leaderboard.findIndex(l => l.name === entry.name);
    if (idx >= 0) {
      this.leaderboard[idx] = entry;
    } else {
      this.leaderboard.push(entry);
    }
    // Add AI opponents
    while (this.leaderboard.length < 10) {
      const ai = this.generateAIOpponent();
      this.leaderboard.push({
        name: ai.name,
        type: ai.type,
        rating: ai.rating,
        wins: Math.floor(Math.random() * 50),
      });
    }
    this.leaderboard.sort((a, b) => b.rating - a.rating);
    this.leaderboard = this.leaderboard.slice(0, 10);
  },

  generateAIOpponent() {
    const type = PET_TYPES[Math.floor(Math.random() * PET_TYPES.length)];
    const name = OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)];
    const rating = Math.max(800, this.pet ? this.pet.rating + Math.floor(Math.random() * 200) - 100 : 1000);
    return {
      name: `${name}·${type.name}`,
      type: type.type,
      file: type.file,
      color: type.color,
      rating,
      attack: 10 + Math.floor(Math.random() * 20),
      defense: 10 + Math.floor(Math.random() * 15),
      agility: 10 + Math.floor(Math.random() * 15),
      hp: 80 + Math.floor(Math.random() * 60),
      hpMax: 80 + Math.floor(Math.random() * 60),
      dodgeRate: 0.03 + Math.random() * 0.07,
      critRate: 0.03 + Math.random() * 0.07,
    };
  },

  getOpponents() {
    const opponents = [];
    for (let i = 0; i < 5; i++) {
      opponents.push(this.generateAIOpponent());
    }
    return opponents;
  },
};

// ===== Battle Engine =====
const BattleEngine = {
  actions: [],

  calculateDamage(attacker, defender, isSkill = false) {
    const baseDamage = attacker.attack * (isSkill ? 1.2 : 1.0);
    const defenseReduction = defender.defense * 0.5;
    let damage = Math.max(1, Math.floor(baseDamage - defenseReduction + (Math.random() * 10 - 5)));

    const isDodge = Math.random() < defender.dodgeRate;
    if (isDodge) return { damage: 0, isCrit: false, isDodge: true };

    const isCrit = Math.random() < attacker.critRate;
    if (isCrit) damage = Math.floor(damage * 1.5);

    return { damage, isCrit, isDodge: false };
  },

  determineFirst(player, opponent) {
    const playerRoll = player.agility + Math.floor(Math.random() * 20);
    const opponentRoll = opponent.agility + Math.floor(Math.random() * 20);
    return playerRoll >= opponentRoll ? 'player' : 'opponent';
  },

  executeTurn(attacker, defender, attackerName, defenderName) {
    const isSkill = Math.random() < 0.3;
    const result = this.calculateDamage(attacker, defender, isSkill);
    const actions = [];

    if (result.isDodge) {
      actions.push({
        text: `${defenderName} 闪避了 ${attackerName} 的攻击！`,
        type: 'dodge',
      });
      return { damage: 0, actions };
    }

    defender.hp = Math.max(0, defender.hp - result.damage);

    let text = `${attackerName} `;
    if (isSkill) text += '使用技能攻击';
    else text += '发动普通攻击';
    if (result.isCrit) text += '（暴击！）';
    text += `，造成 <span class="log-damage">${result.damage}</span> 点伤害！`;

    actions.push({ text, type: result.isCrit ? 'crit' : 'damage' });
    return { damage: result.damage, actions };
  },

  async simulateBattle(player, opponent, onAction, onEnd) {
    this.actions = [];
    const p = { ...player, hp: player.hpMax };
    const o = { ...opponent, hp: opponent.hpMax };
    let turn = 0;
    const maxTurns = 30;

    const first = this.determineFirst(p, o);
    onAction([{ text: `战斗开始！${first === 'player' ? player.name : opponent.name} 先手！`, type: 'normal' }]);
    await sleep(800);

    while (p.hp > 0 && o.hp > 0 && turn < maxTurns) {
      turn++;
      const attacker = turn % 2 === (first === 'player' ? 1 : 0) ? p : o;
      const defender = attacker === p ? o : p;
      const attackerName = attacker === p ? player.name : opponent.name;
      const defenderName = defender === p ? player.name : opponent.name;

      const result = this.executeTurn(attacker, defender, attackerName, defenderName);
      onAction(result.actions);
      onEnd({ playerHp: p.hp, opponentHp: o.hp, playerHpMax: p.hpMax, opponentHpMax: o.hpMax });
      await sleep(1000);

      if (defender.hp <= 0) break;
    }

    const playerWon = o.hp <= 0 || (p.hp > o.hp && turn >= maxTurns);
    return { won: playerWon, turns: turn };
  },
};

// ===== UI Helpers =====
function $(id) { return document.getElementById(id); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function showToast(icon, message) {
  const toast = $('toast');
  $('toast-icon').textContent = icon;
  $('toast-message').textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

function showModal(id) {
  $('modal-overlay').classList.remove('hidden');
  $(id).classList.remove('hidden');
}

function hideModal() {
  $('modal-overlay').classList.add('hidden');
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  $(`page-${pageId}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-page="${pageId}"]`).classList.add('active');
}

function getPetImagePath(file) {
  return `assets/images/pets/${file}`;
}

// ===== Render Functions =====
function renderHeader() {
  $('header-points').textContent = AppState.points;
}

function renderHome() {
  renderHeader();
  const pet = AppState.pet;

  if (!pet) {
    $('pet-image').classList.add('hidden');
    $('pet-placeholder').classList.remove('hidden');
    $('stats-grid').classList.add('hidden');
    $('interaction-buttons').classList.add('hidden');
    $('exp-fill').style.width = '0%';
    $('pet-name').textContent = '未领养宠物';
    $('pet-type').textContent = '--';
    $('pet-level').textContent = '1';
    return;
  }

  $('pet-image').classList.remove('hidden');
  $('pet-placeholder').classList.add('hidden');
  $('stats-grid').classList.remove('hidden');
  $('interaction-buttons').classList.remove('hidden');

  $('pet-image').src = getPetImagePath(pet.file);
  $('pet-name').textContent = pet.name;
  $('pet-type').textContent = pet.typeName;
  $('pet-level').textContent = pet.level;
  $('pet-exp').textContent = pet.exp;
  $('pet-exp-max').textContent = pet.expMax;
  $('exp-fill').style.width = `${(pet.exp / pet.expMax) * 100}%`;

  $('stat-attack').textContent = pet.attack;
  $('stat-defense').textContent = pet.defense;
  $('stat-agility').textContent = pet.agility;
  $('stat-hp').textContent = `${pet.hp}/${pet.hpMax}`;
  $('stat-dodge').textContent = `${Math.round(pet.dodgeRate * 100)}%`;
  $('stat-crit').textContent = `${Math.round(pet.critRate * 100)}%`;
}

function renderTasks(tab = 'daily') {
  const list = $('task-list');
  const filtered = AppState.tasks.filter(t => t.type === tab);

  if (filtered.length === 0) {
    list.innerHTML = '<div class="task-card" style="justify-content:center;color:var(--muted)">暂无任务</div>';
    return;
  }

  list.innerHTML = filtered.map(task => `
    <div class="task-card ${task.completed ? 'completed' : ''}">
      <div class="task-info">
        <div class="task-title">${task.name}</div>
        <div class="task-desc">${task.desc}</div>
      </div>
      <div class="task-reward">
        <span class="task-points">⭐ ${task.points}</span>
        <button class="task-btn" ${task.completed ? 'disabled' : ''} onclick="completeTask(${task.id})">
          ${task.completed ? '已完成' : '完成'}
        </button>
      </div>
    </div>
  `).join('');
}

function renderArena() {
  renderHeader();
  $('arena-count').textContent = AppState.battleCount;

  const opponents = AppState.getOpponents();
  $('opponents-list').innerHTML = opponents.map((opp, i) => `
    <div class="opponent-card">
      <img src="${getPetImagePath(opp.file)}" alt="" class="opponent-img">
      <div class="opponent-info">
        <div class="opponent-name">${opp.name}</div>
        <div class="opponent-stats">
          攻击:${opp.attack} 防御:${opp.defense} 敏捷:${opp.agility} 生命:${opp.hp}
        </div>
      </div>
      <span class="opponent-rating">${opp.rating}</span>
      <button class="challenge-btn" onclick="startBattle(${i})">挑战</button>
    </div>
  `).join('');

  // Cache opponents for battle
  AppState._opponents = opponents;

  // Leaderboard
  AppState.updateLeaderboard();
  $('leaderboard-list').innerHTML = AppState.leaderboard.map((entry, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'normal';
    return `
      <div class="leaderboard-item">
        <span class="leaderboard-rank ${rankClass}">${i + 1}</span>
        <span class="leaderboard-name">${entry.name}</span>
        <span class="leaderboard-score">${entry.rating}</span>
      </div>
    `;
  }).join('');
}

function renderShop() {
  renderHeader();
  $('shop-points').textContent = AppState.points;

  $('reward-list').innerHTML = AppState.rewards.map(reward => {
    const canAfford = AppState.points >= reward.points;
    return `
      <div class="reward-card">
        <div class="reward-icon">${reward.icon}</div>
        <div class="reward-name">${reward.name}</div>
        <div class="reward-desc">${reward.desc}</div>
        <span class="reward-cost">⭐ ${reward.points}</span>
        <button class="redeem-btn" ${!canAfford ? 'disabled' : ''} onclick="redeemReward(${reward.id})">
          ${canAfford ? '兑换' : '积分不足'}
        </button>
      </div>
    `;
  }).join('');
}

function renderAdmin(tab = 'tasks') {
  const content = $('admin-content');

  if (tab === 'tasks') {
    content.innerHTML = `
      <div class="admin-section">
        <h4>添加新任务</h4>
        <div class="form-group">
          <label>任务名称</label>
          <input type="text" id="admin-task-name" placeholder="例如：整理房间">
        </div>
        <div class="form-group">
          <label>任务描述</label>
          <input type="text" id="admin-task-desc" placeholder="简短描述">
        </div>
        <div class="form-group">
          <label>积分奖励</label>
          <input type="number" id="admin-task-points" value="10" min="1">
        </div>
        <div class="form-group">
          <label>任务类型</label>
          <select id="admin-task-type">
            <option value="daily">每日任务</option>
            <option value="weekly">每周任务</option>
            <option value="onetime">一次性任务</option>
          </select>
        </div>
        <button class="btn-primary" onclick="addTask()">添加任务</button>
      </div>
      <div class="admin-section">
        <h4>现有任务</h4>
        <div class="admin-list">
          ${AppState.tasks.map(t => `
            <div class="admin-list-item">
              <span>${t.name} (${t.type === 'daily' ? '每日' : t.type === 'weekly' ? '每周' : '一次性'}) - ⭐${t.points}</span>
              <button class="delete-btn" onclick="deleteTask(${t.id})">删除</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (tab === 'rewards') {
    content.innerHTML = `
      <div class="admin-section">
        <h4>添加新奖励</h4>
        <div class="form-group">
          <label>奖励名称</label>
          <input type="text" id="admin-reward-name" placeholder="例如：看动画片">
        </div>
        <div class="form-group">
          <label>奖励描述</label>
          <input type="text" id="admin-reward-desc" placeholder="简短描述">
        </div>
        <div class="form-group">
          <label>所需积分</label>
          <input type="number" id="admin-reward-points" value="50" min="1">
        </div>
        <div class="form-group">
          <label>图标</label>
          <input type="text" id="admin-reward-icon" value="🎁" maxlength="2">
        </div>
        <button class="btn-primary" onclick="addReward()">添加奖励</button>
      </div>
      <div class="admin-section">
        <h4>现有奖励</h4>
        <div class="admin-list">
          ${AppState.rewards.map(r => `
            <div class="admin-list-item">
              <span>${r.icon} ${r.name} - ⭐${r.points}</span>
              <button class="delete-btn" onclick="deleteReward(${r.id})">删除</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (tab === 'pets') {
    content.innerHTML = `
      <div class="admin-section">
        <h4>宠物属性</h4>
        ${AppState.pet ? `
          <div class="form-group">
            <label>名字</label>
            <input type="text" id="admin-pet-name" value="${AppState.pet.name}">
          </div>
          <div class="form-group">
            <label>攻击</label>
            <input type="number" id="admin-pet-attack" value="${AppState.pet.attack}">
          </div>
          <div class="form-group">
            <label>防御</label>
            <input type="number" id="admin-pet-defense" value="${AppState.pet.defense}">
          </div>
          <div class="form-group">
            <label>敏捷</label>
            <input type="number" id="admin-pet-agility" value="${AppState.pet.agility}">
          </div>
          <div class="form-group">
            <label>生命</label>
            <input type="number" id="admin-pet-hp" value="${AppState.pet.hpMax}">
          </div>
          <button class="btn-primary" onclick="updatePet()">更新属性</button>
          <button class="btn-secondary" onclick="addPoints()" style="margin-left:0.5rem">+1000积分</button>
        ` : '<p style="color:var(--muted)">还没有宠物</p>'}
      </div>
    `;
  }
}

// ===== Action Handlers =====
function completeTask(taskId) {
  const points = AppState.completeTask(taskId);
  if (points > 0) {
    showToast('✅', `任务完成！获得 ${points} 积分`);
    renderTasks(document.querySelector('.task-tab.active').dataset.tab);
    renderHeader();
  }
}

function redeemReward(rewardId) {
  if (AppState.redeemReward(rewardId)) {
    showToast('🎉', '兑换成功！');
    renderShop();
  } else {
    showToast('❌', '积分不足！');
  }
}

async function startBattle(opponentIndex) {
  if (!AppState.pet) {
    showToast('❌', '请先领养宠物！');
    return;
  }
  if (AppState.battleCount >= 3) {
    showToast('⏰', '今日挑战次数已用完！');
    return;
  }

  const opponent = AppState._opponents[opponentIndex];
  showModal('modal-battle');

  // Setup battle UI
  $('battle-player-name').textContent = AppState.pet.name;
  $('battle-player-img').src = getPetImagePath(AppState.pet.file);
  $('battle-opponent-name').textContent = opponent.name;
  $('battle-opponent-img').src = getPetImagePath(opponent.file);
  $('player-hp-fill').style.width = '100%';
  $('opponent-hp-fill').style.width = '100%';
  $('player-hp-text').textContent = `${AppState.pet.hpMax}/${AppState.pet.hpMax}`;
  $('opponent-hp-text').textContent = `${opponent.hp}/${opponent.hp}`;
  $('battle-log').innerHTML = '';
  $('btn-battle-close').classList.remove('hidden');
  $('btn-battle-again').classList.add('hidden');

  const result = await BattleEngine.simulateBattle(
    AppState.pet,
    opponent,
    (actions) => {
      actions.forEach(action => {
        const div = document.createElement('div');
        div.className = 'log-entry';
        div.innerHTML = action.text;
        $('battle-log').appendChild(div);
        $('battle-log').scrollTop = $('battle-log').scrollHeight;
      });
    },
    (state) => {
      $('player-hp-fill').style.width = `${(state.playerHp / state.playerHpMax) * 100}%`;
      $('opponent-hp-fill').style.width = `${(state.opponentHp / state.opponentHpMax) * 100}%`;
      $('player-hp-text').textContent = `${state.playerHp}/${state.playerHpMax}`;
      $('opponent-hp-text').textContent = `${state.opponentHp}/${state.opponentHpMax}`;
    }
  );

  AppState.recordBattle(result.won, opponent.rating);

  // Show result
  setTimeout(() => {
    hideModal();
    showModal('modal-result');
    $('result-icon').textContent = result.won ? '🏆' : '😢';
    $('result-title').textContent = result.won ? '胜利！' : '失败...';
    $('result-message').textContent = result.won
      ? `你的 ${AppState.pet.name} 表现出色，击败了 ${opponent.name}！`
      : `${opponent.name} 太强了，下次再挑战吧！`;
    $('result-points').textContent = result.won ? '20' : '0';
    $('result-exp').textContent = result.won ? '15' : '5';
  }, 1500);
}

function addTask() {
  const name = $('admin-task-name').value.trim();
  const desc = $('admin-task-desc').value.trim();
  const points = parseInt($('admin-task-points').value);
  const type = $('admin-task-type').value;
  if (!name) { showToast('❌', '请输入任务名称'); return; }

  const id = Math.max(0, ...AppState.tasks.map(t => t.id)) + 1;
  AppState.tasks.push({ id, name, desc, points, type, completed: false });
  AppState.save();
  showToast('✅', '任务添加成功！');
  renderAdmin('tasks');
}

function deleteTask(id) {
  AppState.tasks = AppState.tasks.filter(t => t.id !== id);
  AppState.save();
  renderAdmin('tasks');
}

function addReward() {
  const name = $('admin-reward-name').value.trim();
  const desc = $('admin-reward-desc').value.trim();
  const points = parseInt($('admin-reward-points').value);
  const icon = $('admin-reward-icon').value || '🎁';
  if (!name) { showToast('❌', '请输入奖励名称'); return; }

  const id = Math.max(0, ...AppState.rewards.map(r => r.id)) + 1;
  AppState.rewards.push({ id, name, desc, icon, points });
  AppState.save();
  showToast('✅', '奖励添加成功！');
  renderAdmin('rewards');
}

function deleteReward(id) {
  AppState.rewards = AppState.rewards.filter(r => r.id !== id);
  AppState.save();
  renderAdmin('rewards');
}

function updatePet() {
  if (!AppState.pet) return;
  AppState.pet.name = $('admin-pet-name').value.trim() || AppState.pet.name;
  AppState.pet.attack = parseInt($('admin-pet-attack').value) || AppState.pet.attack;
  AppState.pet.defense = parseInt($('admin-pet-defense').value) || AppState.pet.defense;
  AppState.pet.agility = parseInt($('admin-pet-agility').value) || AppState.pet.agility;
  AppState.pet.hpMax = parseInt($('admin-pet-hp').value) || AppState.pet.hpMax;
  AppState.pet.hp = AppState.pet.hpMax;
  AppState.save();
  showToast('✅', '宠物属性已更新！');
  renderHome();
  renderAdmin('pets');
}

function addPoints() {
  AppState.addPoints(1000);
  showToast('✅', '已添加 1000 积分！');
  renderHeader();
  renderAdmin('pets');
}

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', () => {
  // Init state
  AppState.init();

  // Splash screen
  setTimeout(() => {
    $('splash-screen').classList.add('fade-out');
    setTimeout(() => {
      $('splash-screen').classList.add('hidden');
      $('app').classList.remove('hidden');
    }, 600);
  }, 2200);

  // Navigation
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      switchPage(page);
      if (page === 'tasks') renderTasks();
      if (page === 'arena') renderArena();
      if (page === 'shop') renderShop();
      if (page === 'admin') renderAdmin();
    });
  });

  // Quick actions
  $('btn-go-tasks').addEventListener('click', () => {
    switchPage('tasks');
    renderTasks();
    document.querySelector('.nav-item[data-page="tasks"]').classList.add('active');
  });
  $('btn-go-arena').addEventListener('click', () => {
    switchPage('arena');
    renderArena();
    document.querySelector('.nav-item[data-page="arena"]').classList.add('active');
  });

  // Adoption
  $('btn-adopt').addEventListener('click', () => {
    const selector = $('pet-selector');
    selector.innerHTML = PET_TYPES.map((pt, i) => `
      <div class="pet-option ${i === 0 ? 'selected' : ''}" data-index="${i}">
        <img src="${getPetImagePath(pt.file)}" alt="${pt.name}">
        <span>${pt.name}</span>
      </div>
    `).join('');

    selector.querySelectorAll('.pet-option').forEach(opt => {
      opt.addEventListener('click', () => {
        selector.querySelectorAll('.pet-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });

    $('adopt-name').value = '';
    showModal('modal-adoption');
  });

  $('btn-confirm-adopt').addEventListener('click', () => {
    const name = $('adopt-name').value.trim();
    if (!name) { showToast('❌', '请给宠物起个名字'); return; }

    const selected = document.querySelector('.pet-option.selected');
    const typeIndex = selected ? parseInt(selected.dataset.index) : 0;

    AppState.adoptPet(name, typeIndex);
    hideModal();
    showToast('🎉', `恭喜！${name} 成为了你的宠物！`);
    renderHome();
  });

  // Pet interactions
  document.querySelectorAll('.interaction-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!AppState.pet) { showToast('❌', '请先领养宠物'); return; }
      const action = btn.dataset.action;
      const msg = AppState.interact(action);
      showToast('✨', msg);
      renderHome();

      // Animation
      const img = $('pet-image');
      if (action === 'feed') img.classList.add('pet-eat');
      else img.classList.add('pet-happy');
      setTimeout(() => img.classList.remove('pet-eat', 'pet-happy'), 800);
    });
  });

  // Task tabs
  document.querySelectorAll('.task-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.task-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderTasks(tab.dataset.tab);
    });
  });

  // Admin tabs
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderAdmin(tab.dataset.admin);
    });
  });

  // Modal close
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', hideModal);
  });
  $('modal-overlay').addEventListener('click', (e) => {
    if (e.target === $('modal-overlay')) hideModal();
  });

  // Settings / Reset
  $('btn-settings').addEventListener('click', () => {
    if (confirm('确定要重置所有数据吗？这将清除宠物、积分和任务进度。')) {
      localStorage.removeItem('tvPetData');
      location.reload();
    }
  });

  // Initial render
  renderHome();
});
