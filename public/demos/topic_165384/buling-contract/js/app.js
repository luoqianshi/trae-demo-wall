// ==================== 步灵契约 - 应用主逻辑 ====================

class App {
  constructor() {
    this.state = GameState.load();
    this.currentPage = 'home';
    this.currentExploreType = null;
    this.currentCreature = null;
    this.currentInteraction = null;
    this.currentWeather = getRandomWeather();
    this.currentLocation = getRandomLocation();
    this.tempState = {}; // 用于小游戏状态

    this.init();
  }

  init() {
    this.checkDayReset();
    this.bindEvents();
    this.renderHome();
    this.updateHeader();
    this.addSvgGradient();
  }

  addSvgGradient() {
    const svg = document.querySelector('.steps-ring svg');
    if (svg && !svg.querySelector('defs')) {
      svg.innerHTML = `
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#5eead4"/>
            <stop offset="100%" style="stop-color:#60a5fa"/>
          </linearGradient>
        </defs>
        ${svg.innerHTML}
      `;
    }
  }

  checkDayReset() {
    const today = new Date().toDateString();
    if (this.state.lastDate !== today) {
      this.state.lastDate = today;
      this.state.todaySteps = 0;
      this.state.exploreUsed = { normal: 0, scene: 0, rare: 0, special: 0 };
      this.state.dailyTasks = {
        walk1000: false, walk3000: false, exploreOnce: false, collectOne: false
      };
      this.state.lastActive = Date.now();
      GameState.save(this.state);
    }
  }

  // ==================== 导航 ====================
  navigateTo(page) {
    document.querySelectorAll('main.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`)?.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.nav-btn[data-page="${page}"]`)?.classList.add('active');

    this.currentPage = page;

    if (page === 'home') this.renderHome();
    else if (page === 'collection') this.renderCollection('all');
    else if (page === 'companion') this.renderCompanion();

    window.scrollTo(0, 0);
  }

  goBack() {
    this.navigateTo('home');
  }

  // ==================== 事件绑定 ====================
  bindEvents() {
    // 底部导航
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => this.navigateTo(btn.dataset.page));
    });

    // 返回按钮
    document.querySelectorAll('.btn-back').forEach(btn => {
      btn.addEventListener('click', () => this.goBack());
    });

    // 走路按钮
    document.getElementById('btn-walk').addEventListener('click', () => this.addSteps(500));

    // 开始探索
    document.getElementById('btn-start-explore').addEventListener('click', () => {
      this.renderExploreSelect();
      this.navigateTo('explore-select');
    });

    // 场景继续
    document.getElementById('btn-continue-scene').addEventListener('click', () => {
      this.showEncounter();
    });

    // 遭遇互动按钮
    document.getElementById('btn-interact').addEventListener('click', () => {
      this.renderInteract();
      this.navigateTo('interact');
    });

    // 互动方式选择
    document.querySelectorAll('.interact-btn').forEach(btn => {
      btn.addEventListener('click', () => this.startInteraction(btn.dataset.type));
    });

    // 画符完成
    document.getElementById('btn-draw-done').addEventListener('click', () => {
      this.finishDrawGame();
    });

    // 结果确定
    document.getElementById('btn-result-ok').addEventListener('click', () => {
      this.navigateTo('home');
    });

    // 图鉴筛选
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderCollection(tab.dataset.filter);
      });
    });

    // 重置
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (confirm('确定要重置所有数据吗？')) {
        this.state = GameState.reset();
        this.navigateTo('home');
      }
    });

    // 探索卡片点击
    document.querySelectorAll('.explore-card').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        const available = getAvailableExplores(this.state.todaySteps, this.state.exploreUsed);
        if (available[type] > 0) {
          this.startExplore(type);
        }
      });
    });

    // 绑定小游戏事件
    this.bindMinigameEvents();
  }

  bindMinigameEvents() {
    // 节奏游戏点击
    const rhythmGame = document.getElementById('rhythm-game');
    if (rhythmGame) {
      rhythmGame.addEventListener('click', () => this.onRhythmClick());
      rhythmGame.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.onRhythmClick();
      });
    }

    // 时机游戏点击
    const timingGame = document.getElementById('timing-game');
    if (timingGame) {
      timingGame.addEventListener('click', () => this.onTimingClick());
      timingGame.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.onTimingClick();
      });
    }

    // 画符游戏
    const canvas = document.getElementById('draw-canvas');
    if (canvas) {
      this.setupDrawCanvas(canvas);
    }
  }

  // ==================== 步数系统 ====================
  addSteps(amount) {
    this.state.todaySteps += amount;
    this.state.steps += amount;
    this.state.lastActive = Date.now();

    // 检查任务
    if (this.state.todaySteps >= 1000) this.state.dailyTasks.walk1000 = true;
    if (this.state.todaySteps >= 3000) this.state.dailyTasks.walk3000 = true;

    GameState.save(this.state);
    this.renderHome();
    this.updateHeader();

    // 按钮动画
    const btn = document.getElementById('btn-walk');
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => btn.style.transform = '', 100);
  }

  // ==================== 首页渲染 ====================
  renderHome() {
    // 时间天气
    document.getElementById('current-time-period').textContent = getTimePeriodName();
    const weather = WEATHER_TYPES[this.currentWeather];
    document.getElementById('current-weather').textContent = `${weather.icon} ${weather.name}`;

    // 步数
    document.getElementById('home-steps').textContent = this.state.todaySteps;
    const progress = Math.min(this.state.todaySteps / 10000, 1);
    const offset = 314 - (314 * progress);
    document.getElementById('steps-ring-progress').style.strokeDashoffset = offset;

    // 探索卡片
    const available = getAvailableExplores(this.state.todaySteps, this.state.exploreUsed);
    const totalAvail = getTotalAvailableExplores(this.state.todaySteps, this.state.exploreUsed);

    document.getElementById('count-normal').textContent = `${available.normal}/1`;
    document.getElementById('count-scene').textContent = `${available.scene}/1`;
    document.getElementById('count-rare').textContent = `${available.rare}/1`;
    document.getElementById('count-special').textContent = `${available.special}/1`;

    // 更新卡片可用状态
    document.querySelectorAll('.explore-card').forEach(card => {
      const type = card.dataset.type;
      if (available[type] > 0) {
        card.classList.add('available');
      } else {
        card.classList.remove('available');
      }
    });

    // 探索按钮
    const exploreBtn = document.getElementById('btn-start-explore');
    exploreBtn.disabled = totalAvail === 0;
    exploreBtn.textContent = totalAvail > 0 ? `开始探索 (${totalAvail})` : '今日探索次数已用完';

    // 任务
    this.renderTasks();

    // 伙伴
    this.renderHomeCompanion();
  }

  renderTasks() {
    const tasks = [
      { id: 'task-walk1000', done: this.state.dailyTasks.walk1000 },
      { id: 'task-walk3000', done: this.state.dailyTasks.walk3000 },
      { id: 'task-explore', done: this.state.dailyTasks.exploreOnce },
      { id: 'task-collect', done: this.state.dailyTasks.collectOne }
    ];

    tasks.forEach(task => {
      const el = document.getElementById(task.id);
      if (el) {
        const checkbox = el.querySelector('.task-checkbox');
        if (task.done) {
          el.classList.add('completed');
          checkbox.textContent = '✅';
        } else {
          el.classList.remove('completed');
          checkbox.textContent = '⭕';
        }
      }
    });
  }

  renderHomeCompanion() {
    const section = document.getElementById('home-companion-section');
    const card = document.getElementById('home-companion');

    if (this.state.companion) {
      const creature = CREATURES.find(c => c.id === this.state.companion);
      if (creature) {
        section.style.display = 'block';
        const typeInfo = CREATURE_TYPES[creature.type.toUpperCase()];
        card.innerHTML = `
          <div class="companion-avatar">${typeInfo.icon}</div>
          <div class="companion-info">
            <div class="companion-name">${creature.name}</div>
            <div class="companion-bonus">同行中 - 探索成功率 +5%</div>
          </div>
        `;
      }
    } else {
      section.style.display = 'none';
    }
  }

  updateHeader() {
    document.getElementById('header-steps').textContent = this.state.todaySteps;
    const available = getTotalAvailableExplores(this.state.todaySteps, this.state.exploreUsed);
    document.getElementById('header-explores').textContent = available;
    document.getElementById('header-collection').textContent = `${this.state.collected.length}/30`;
  }

  // ==================== 探索流程 ====================
  renderExploreSelect() {
    const container = document.getElementById('explore-select-list');
    const available = getAvailableExplores(this.state.todaySteps, this.state.exploreUsed);

    const types = [
      { type: 'normal', icon: '🌿', name: '普通探索', desc: '常见生物为主', req: '1,000 步' },
      { type: 'scene', icon: '🌳', name: '场景探索', desc: '场景限定生物', req: '3,000 步' },
      { type: 'rare', icon: '✨', name: '稀有探索', desc: '稀有概率提升', req: '6,000 步' },
      { type: 'special', icon: '🌟', name: '特殊遭遇', desc: '史诗生物概率', req: '10,000 步' }
    ];

    container.innerHTML = types.map(t => {
      const avail = available[t.type] || 0;
      const disabled = avail <= 0;
      return `
        <div class="explore-select-item ${disabled ? 'disabled' : ''}" data-type="${t.type}">
          <div class="explore-select-icon">${t.icon}</div>
          <div class="explore-select-info">
            <div class="explore-select-name">${t.name}</div>
            <div class="explore-select-desc">${t.desc} · 剩余 ${avail} 次</div>
          </div>
          <div class="explore-select-req">${t.req}</div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.explore-select-item:not(.disabled)').forEach(item => {
      item.addEventListener('click', () => this.startExplore(item.dataset.type));
    });
  }

  startExplore(type) {
    this.currentExploreType = type;
    this.state.exploreUsed[type] = (this.state.exploreUsed[type] || 0) + 1;
    this.state.dailyTasks.exploreOnce = true;
    GameState.save(this.state);
    this.updateHeader();

    // 生成随机环境
    this.currentWeather = getRandomWeather();
    this.currentLocation = getRandomLocation();

    this.renderScene();
    this.navigateTo('scene');
  }

  renderScene() {
    const time = getCurrentTimePeriod();
    const weather = WEATHER_TYPES[this.currentWeather];
    const location = LOCATIONS[this.currentLocation];

    document.getElementById('scene-weather').textContent = weather.icon;
    document.getElementById('scene-location').textContent = `${location.icon} ${location.name} · ${getTimePeriodName()}`;

    // 随机场景描述
    const typeKeys = Object.keys(SCENE_TEMPLATES);
    const randomType = typeKeys[Math.floor(Math.random() * typeKeys.length)];
    const templates = SCENE_TEMPLATES[randomType];
    const desc = templates[Math.floor(Math.random() * templates.length)];
    document.getElementById('scene-description').textContent = desc;
  }

  showEncounter() {
    const time = getCurrentTimePeriod();
    const creatures = filterCreaturesByConditions(time, this.currentWeather, this.currentLocation);

    let rarityBias = null;
    if (this.currentExploreType === 'rare') rarityBias = 'rare';
    if (this.currentExploreType === 'special') rarityBias = 'special';

    this.currentCreature = getRandomCreature(creatures, rarityBias);

    if (!this.currentCreature) {
      this.currentCreature = getRandomCreature(CREATURES, rarityBias);
    }

    // 重置遭遇页
    const reveal = document.getElementById('creature-reveal');
    const info = document.getElementById('creature-info');
    const interactBtn = document.getElementById('btn-interact');
    const silhouette = document.getElementById('creature-silhouette');

    reveal.classList.remove('revealed');
    info.style.display = 'none';
    interactBtn.style.display = 'none';
    silhouette.textContent = '?';

    this.navigateTo('encounter');

    // 延迟揭示
    setTimeout(() => {
      const typeInfo = CREATURE_TYPES[this.currentCreature.type.toUpperCase()];
      silhouette.textContent = typeInfo.icon;
      reveal.classList.add('revealed');

      setTimeout(() => {
        document.getElementById('creature-type-badge').textContent = typeInfo.name;
        document.getElementById('creature-type-badge').className = `creature-type-badge type-${this.currentCreature.type}`;
        document.getElementById('creature-name').textContent = this.currentCreature.name;

        const rarityName = getRarityName(this.currentCreature.rarity);
        const stars = '★'.repeat(getRarityStars(this.currentCreature.rarity));
        document.getElementById('creature-rarity').innerHTML = `<span class="rarity-${this.currentCreature.rarity}">${stars} ${rarityName}</span>`;

        document.getElementById('creature-desc').textContent = this.currentCreature.desc;
        document.getElementById('creature-favorite').textContent = this.currentCreature.favorite;

        info.style.display = 'block';
        info.classList.add('fade-in');

        setTimeout(() => {
          interactBtn.style.display = 'block';
          interactBtn.classList.add('fade-in');
        }, 500);
      }, 800);
    }, 600);
  }

  // ==================== 互动 ====================
  renderInteract() {
    if (!this.currentCreature) return;
    const typeInfo = CREATURE_TYPES[this.currentCreature.type.toUpperCase()];
    document.getElementById('interact-creature-header').innerHTML = `
      <div class="interact-creature-emoji">${typeInfo.icon}</div>
      <div class="interact-creature-name">${this.currentCreature.name}</div>
    `;
  }

  startInteraction(type) {
    this.currentInteraction = type;
    const interaction = INTERACTIONS[type];

    if (interaction.minigame === 'rhythm') {
      this.startRhythmGame();
    } else if (interaction.minigame === 'timing') {
      this.startTimingGame();
    } else if (interaction.minigame === 'draw') {
      this.startDrawGame();
    }
  }

  // ==================== 节奏小游戏 ====================
  startRhythmGame() {
    this.tempState = { score: 0, total: 5, hits: 0 };
    document.getElementById('rhythm-score').textContent = '准备...';
    document.getElementById('rhythm-progress').textContent = '0/5';
    this.navigateTo('minigame-rhythm');

    setTimeout(() => this.spawnRhythmRing(), 1000);
  }

  spawnRhythmRing() {
    if (this.tempState.hits >= this.tempState.total) {
      this.finishRhythmGame();
      return;
    }

    const ring = document.getElementById('rhythm-ring');
    ring.classList.remove('active');
    void ring.offsetWidth; // 强制重绘
    ring.classList.add('active');

    this.tempState.canHit = true;
    this.tempState.ringStart = Date.now();

    // 1.5秒后自动失败这一轮
    setTimeout(() => {
      if (this.tempState.canHit && this.currentPage === 'minigame-rhythm') {
        this.tempState.canHit = false;
        document.getElementById('rhythm-score').textContent = '错过!';
        this.tempState.hits++;
        document.getElementById('rhythm-progress').textContent = `${this.tempState.hits}/${this.tempState.total}`;
        setTimeout(() => this.spawnRhythmRing(), 500);
      }
    }, 1500);
  }

  onRhythmClick() {
    if (!this.tempState.canHit || this.currentPage !== 'minigame-rhythm') return;

    const elapsed = Date.now() - this.tempState.ringStart;
    const accuracy = Math.abs(1500 - elapsed) / 1500; // 0 = perfect, 1 = miss

    this.tempState.canHit = false;
    this.tempState.hits++;

    if (accuracy < 0.3) {
      this.tempState.score += 2;
      document.getElementById('rhythm-score').textContent = '完美!';
    } else if (accuracy < 0.6) {
      this.tempState.score += 1;
      document.getElementById('rhythm-score').textContent = '不错!';
    } else {
      document.getElementById('rhythm-score').textContent = '偏了...';
    }

    document.getElementById('rhythm-progress').textContent = `${this.tempState.hits}/${this.tempState.total}`;

    if (this.tempState.hits >= this.tempState.total) {
      setTimeout(() => this.finishRhythmGame(), 500);
    } else {
      setTimeout(() => this.spawnRhythmRing(), 500);
    }
  }

  finishRhythmGame() {
    const success = this.tempState.score >= 5; // 需要至少5分（满分10）
    this.showResult(success);
  }

  // ==================== 时机小游戏 ====================
  startTimingGame() {
    this.tempState = { score: 0, total: 3, hits: 0 };
    document.getElementById('timing-score').textContent = '准备...';
    document.getElementById('timing-progress').textContent = '0/3';
    this.navigateTo('minigame-timing');

    setTimeout(() => {
      const cursor = document.getElementById('timing-cursor');
      cursor.classList.add('active');
      this.tempState.canHit = true;
    }, 1000);
  }

  onTimingClick() {
    if (!this.tempState.canHit || this.currentPage !== 'minigame-timing') return;

    const cursor = document.getElementById('timing-cursor');
    const rect = cursor.parentElement.getBoundingClientRect();
    const cursorLeft = cursor.offsetLeft;
    const barWidth = rect.width;
    const relativePos = cursorLeft / barWidth;

    this.tempState.hits++;

    // 绿色区域 40%-60%
    if (relativePos >= 0.38 && relativePos <= 0.62) {
      this.tempState.score += 2;
      document.getElementById('timing-score').textContent = '完美!';
    } else if (relativePos >= 0.3 && relativePos <= 0.7) {
      this.tempState.score += 1;
      document.getElementById('timing-score').textContent = '不错!';
    } else {
      document.getElementById('timing-score').textContent = '偏了...';
    }

    document.getElementById('timing-progress').textContent = `${this.tempState.hits}/${this.tempState.total}`;

    if (this.tempState.hits >= this.tempState.total) {
      cursor.classList.remove('active');
      setTimeout(() => this.finishTimingGame(), 500);
    }
  }

  finishTimingGame() {
    const success = this.tempState.score >= 3;
    this.showResult(success);
  }

  // ==================== 画符小游戏 ====================
  startDrawGame() {
    this.tempState = { drawn: false };
    document.getElementById('draw-score').textContent = '画一个圆';
    this.navigateTo('minigame-draw');

    const canvas = document.getElementById('draw-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  setupDrawCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    let drawing = false;

    const startDraw = (e) => {
      drawing = true;
      const pos = this.getCanvasPos(canvas, e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = '#5eead4';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
    };

    const draw = (e) => {
      if (!drawing) return;
      const pos = this.getCanvasPos(canvas, e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const endDraw = () => {
      drawing = false;
      this.tempState.drawn = true;
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseout', endDraw);

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startDraw(e.touches[0]);
    });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      draw(e.touches[0]);
    });
    canvas.addEventListener('touchend', endDraw);
  }

  getCanvasPos(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  finishDrawGame() {
    const success = this.tempState.drawn;
    this.showResult(success);
  }

  // ==================== 结果 ====================
  showResult(minigameSuccess) {
    const trust = this.state.creatureTrust[this.currentCreature.id] || 0;
    const baseRate = calculateSuccessRate(this.currentCreature, this.currentInteraction, trust);
    const finalRate = minigameSuccess ? Math.min(baseRate + 0.15, 0.95) : baseRate - 0.1;
    const success = Math.random() < finalRate;

    const typeInfo = CREATURE_TYPES[this.currentCreature.type.toUpperCase()];
    const isCollected = this.state.collected.includes(this.currentCreature.id);

    document.getElementById('result-animation').textContent = success ? '🎉' : '💨';

    const title = document.getElementById('result-title');
    title.textContent = success ? '契约达成!' : '它逃走了...';
    title.className = `result-title ${success ? 'success' : 'fail'}`;

    const msg = document.getElementById('result-message');
    if (success) {
      if (isCollected) {
        msg.textContent = `你再次遇见了${this.currentCreature.name}，你们的羁绊更深了。`;
      } else {
        msg.textContent = `${this.currentCreature.name}愿意与你同行了！它已加入你的图鉴。`;
        this.state.collected.push(this.currentCreature.id);
        this.state.dailyTasks.collectOne = true;
      }
      this.state.creatureTrust[this.currentCreature.id] = (trust || 0) + 1;
    } else {
      msg.textContent = `它暂时躲回了雾里，但你记录下了它的踪迹。下次再试试吧。`;
      if (!this.state.seenCreatures.includes(this.currentCreature.id)) {
        this.state.seenCreatures.push(this.currentCreature.id);
      }
    }

    GameState.save(this.state);
    this.updateHeader();

    document.getElementById('result-creature').innerHTML = `
      <div style="font-size:48px;margin-bottom:8px">${typeInfo.icon}</div>
      <div style="font-size:16px;font-weight:600">${this.currentCreature.name}</div>
    `;

    this.navigateTo('result');
  }

  // ==================== 图鉴 ====================
  renderCollection(filter) {
    const grid = document.getElementById('collection-grid');
    document.getElementById('collection-count').textContent = this.state.collected.length;

    let creatures = CREATURES;
    if (filter !== 'all') {
      creatures = CREATURES.filter(c => c.type === filter);
    }

    grid.innerHTML = creatures.map(c => {
      const isCollected = this.state.collected.includes(c.id);
      const isSeen = this.state.seenCreatures.includes(c.id);
      const typeInfo = CREATURE_TYPES[c.type.toUpperCase()];

      if (isCollected) {
        return `
          <div class="creature-cell" data-id="${c.id}">
            <div class="creature-cell-collected">${typeInfo.icon}</div>
            <div class="creature-cell-name">${c.name}</div>
            <div class="creature-cell-rarity rarity-${c.rarity}">${'★'.repeat(getRarityStars(c.rarity))}</div>
          </div>
        `;
      } else if (isSeen) {
        return `
          <div class="creature-cell unknown" data-id="${c.id}">
            <div class="creature-cell-unknown">${typeInfo.icon}</div>
            <div class="creature-cell-name">???</div>
            <div class="creature-cell-rarity rarity-${c.rarity}">已发现</div>
          </div>
        `;
      } else {
        return `
          <div class="creature-cell unknown">
            <div class="creature-cell-unknown">?</div>
            <div class="creature-cell-name">???</div>
            <div class="creature-cell-rarity">未遇见</div>
          </div>
        `;
      }
    }).join('');

    grid.querySelectorAll('.creature-cell[data-id]').forEach(cell => {
      cell.addEventListener('click', () => this.showCreatureDetail(cell.dataset.id));
    });
  }

  showCreatureDetail(id) {
    const creature = CREATURES.find(c => c.id === id);
    if (!creature) return;

    const isCollected = this.state.collected.includes(id);
    const typeInfo = CREATURE_TYPES[creature.type.toUpperCase()];

    const detail = document.getElementById('creature-detail');
    detail.innerHTML = `
      <div class="creature-detail-emoji">${typeInfo.icon}</div>
      <div class="creature-detail-name">${creature.name}</div>
      <div class="creature-detail-type type-${creature.type}">${typeInfo.name}</div>
      <div class="creature-detail-rarity rarity-${creature.rarity}">
        ${'★'.repeat(getRarityStars(creature.rarity))} ${getRarityName(creature.rarity)}
      </div>
      <div class="creature-detail-desc">${creature.desc}</div>
      ${isCollected ? `
        <div class="creature-detail-conditions">
          <h4>出现条件</h4>
          <p>⏰ 时间: ${creature.conditions.time?.map(t => TIME_PERIODS[t.toUpperCase()]?.name).join('、') || '全天'}</p>
          <p>🌤️ 天气: ${creature.conditions.weather?.map(w => WEATHER_TYPES[w.toUpperCase()]?.name).join('、') || '任何天气'}</p>
          <p>📍 地点: ${creature.conditions.location?.map(l => LOCATIONS[l.toUpperCase()]?.name).join('、') || '任何地点'}</p>
          <p>❤️ 喜欢: ${creature.favorite}</p>
          <p>🤝 互动: ${creature.interaction}</p>
        </div>
      ` : '<div style="color:var(--muted);font-size:14px">收集后才能查看详细信息</div>'}
    `;

    this.navigateTo('creature-detail');
  }

  // ==================== 伙伴 ====================
  renderCompanion() {
    const list = document.getElementById('companion-list');

    if (this.state.collected.length === 0) {
      list.innerHTML = '<div style="text-align:center;color:var(--muted);padding:40px">还没有收集到生物，先去探索吧！</div>';
      return;
    }

    list.innerHTML = this.state.collected.map(id => {
      const creature = CREATURES.find(c => c.id === id);
      const typeInfo = CREATURE_TYPES[creature.type.toUpperCase()];
      const isSelected = this.state.companion === id;

      return `
        <div class="companion-option ${isSelected ? 'selected' : ''}" data-id="${id}">
          <div class="companion-option-emoji">${typeInfo.icon}</div>
          <div class="companion-option-info">
            <div class="companion-option-name">${creature.name}</div>
            <div class="companion-option-bonus">${typeInfo.name} · ${getRarityName(creature.rarity)}</div>
          </div>
          ${isSelected ? '<span style="color:var(--accent)">✓ 同行中</span>' : ''}
        </div>
      `;
    }).join('');

    list.querySelectorAll('.companion-option').forEach(opt => {
      opt.addEventListener('click', () => {
        this.state.companion = opt.dataset.id;
        GameState.save(this.state);
        this.renderCompanion();
        this.renderHomeCompanion();
      });
    });
  }
}

// ==================== 启动 ====================
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
