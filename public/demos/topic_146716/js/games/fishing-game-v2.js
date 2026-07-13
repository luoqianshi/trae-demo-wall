/**
 * ============================================================
 * FishingGameV2 — 独立捕鱼游戏模块
 * 完全独立于主线代码（不依赖 window.AudioSystem / window.exit2DGame）
 * 使用 window.MiniGameCore 提供的 VFX / Audio / Canvas / ScreenShake
 * ============================================================
 * 对外接口：
 *   FishingGameV2.init(canvas)    — 传入 Canvas 元素初始化
 *   FishingGameV2.start()         — 启动游戏
 *   FishingGameV2.stop()          — 停止游戏并清理
 *   FishingGameV2.getResult()     — 返回结果 { score, fishCount, fishCaught, fishTypes }
 * ============================================================
 */
;(function() {
'use strict';

// 确保 MiniGameCore 存在
if (!window.MiniGameCore) {
  console.error('[FishingGameV2] 依赖缺失: window.MiniGameCore 未找到');
  return;
}

const VFX = window.MiniGameCore.VFX;
const Audio = window.MiniGameCore.Audio;
const Canvas = window.MiniGameCore.Canvas;
const ScreenShake = window.MiniGameCore.ScreenShake;

const FishingGameV2 = {
  // ============================================================
  // 运行状态
  // ============================================================
  active: false,
  canvas: null,
  ctx: null,
  animationId: null,
  lastTime: 0,
  W: 0,
  H: 0,

  // ============================================================
  // 游戏状态
  // ============================================================
  score: 0,
  coins: 0,
  timeLeft: 60,
  gameStarted: false,
  gameEnded: false,
  combo: 0,
  comboTimer: 0,
  comboMultiplier: 1,
  frenzyMode: false,
  frenzyTimer: 0,
  waveTime: 0,

  // ============================================================
  // 玩家
  // ============================================================
  player: {
    x: 0,
    y: 0,
    angle: -Math.PI / 2,
    targetX: 0
  },

  // ============================================================
  // 武器系统
  // ============================================================
  currentWeapon: 'harpoon',
  ammo: {
    harpoon: Infinity,
    torpedo: 5,
    sonar: 2
  },
  weaponCooldown: 0,

  // ============================================================
  // 技能系统
  // ============================================================
  skills: {
    freeze: 1,
    bomb: 1,
    speed: 1
  },
  skillCooldowns: {
    freeze: 0,
    bomb: 0,
    speed: 0
  },

  // ============================================================
  // 效果状态
  // ============================================================
  effects: {
    frozen: false,
    frozenTimer: 0,
    speedBoost: false,
    speedTimer: 0
  },

  // ============================================================
  // 游戏对象容器
  // ============================================================
  fishes: [],
  projectiles: [],
  floatingTexts: [],
  bubbles: [],
  seaweeds: [],
  treasure: null,
  decorations: [],

  // ============================================================
  // 生成计时器
  // ============================================================
  spawnTimer: 0,
  spawnInterval: 1.5,
  treasureTimer: 0,
  treasureInterval: 8,
  rareFishTimer: 0,
  rareFishInterval: 15,

  // ============================================================
  // 输入状态
  // ============================================================
  keys: {},
  mousePos: { x: 0, y: 0 },
  mouseDown: false,

  // ============================================================
  // 结果数据
  // ============================================================
  _result: {
    score: 0,
    fishCount: 0,
    fishCaught: 0,
    fishTypes: {}
  },
  _returning: false,

  // ============================================================
  // 鱼类定义（5种）
  // ============================================================
  FISH_TYPES: [
    {
      id: 'clownfish',
      name: '小丑鱼',
      color: '#ff6b35',
      color2: '#ff4400',
      size: 14,
      speed: 100,
      score: 2,
      hp: 1,
      weight: 35,
      pattern: 'sine'
    },
    {
      id: 'tropical',
      name: '热带鱼',
      color: '#ffdd44',
      color2: '#ff8800',
      size: 18,
      speed: 80,
      score: 5,
      hp: 2,
      weight: 28,
      pattern: 'zigzag'
    },
    {
      id: 'pufferfish',
      name: '河豚',
      color: '#88dd44',
      color2: '#44aa22',
      size: 22,
      speed: 50,
      score: 8,
      hp: 3,
      weight: 20,
      pattern: 'bounce'
    },
    {
      id: 'tuna',
      name: '金枪鱼',
      color: '#4488cc',
      color2: '#2255aa',
      size: 26,
      speed: 130,
      score: 12,
      hp: 4,
      weight: 12,
      pattern: 'fast'
    },
    {
      id: 'shark',
      name: '鲨鱼',
      color: '#886666',
      color2: '#664444',
      size: 36,
      speed: 70,
      score: 20,
      hp: 6,
      weight: 5,
      pattern: 'charge'
    },
    {
      id: 'jellyfish',
      name: '水母',
      color: '#cc88ff',
      color2: '#aa44dd',
      size: 16,
      speed: 30,
      score: 6,
      hp: 2,
      weight: 15,
      pattern: 'float'
    },
    {
      id: 'swordfish',
      name: '剑鱼',
      color: '#4488aa',
      color2: '#226688',
      size: 30,
      speed: 180,
      score: 18,
      hp: 5,
      weight: 8,
      pattern: 'dash'
    },
    {
      id: 'lanternfish',
      name: '灯笼鱼',
      color: '#ffaa44',
      color2: '#ff8800',
      size: 12,
      speed: 40,
      score: 15,
      hp: 1,
      weight: 10,
      pattern: 'lure'
    }
  ],

  // ============================================================
  // 稀有鱼类型（不在普通生成池中）
  // ============================================================
  RARE_FISH_TYPES: [
    {
      id: 'golden_koi',
      name: '黄金锦鲤',
      color: '#ffd700',
      color2: '#ffaa00',
      size: 28,
      speed: 60,
      score: 50,
      hp: 3,
      weight: 0,
      pattern: 'zigzag',
      rarity: 'rare',
      glowColor: '#ffd700'
    },
    {
      id: 'ghost_shark',
      name: '幽灵鲨',
      color: 'rgba(150,180,200,0.5)',
      color2: 'rgba(100,140,160,0.3)',
      size: 40,
      speed: 90,
      score: 80,
      hp: 8,
      weight: 0,
      pattern: 'charge',
      rarity: 'epic',
      glowColor: '#88ccff',
      special: 'phase'
    }
  ],

  // ============================================================
  // 武器配置
  // ============================================================
  WEAPON_CONFIG: {
    harpoon: {
      name: '鱼叉',
      speed: 500,
      damage: 1,
      size: 6,
      color: '#88ccff',
      trailColor: '#66aaff',
      ammoKey: 'harpoon',
      aoe: 0,
      cooldown: 0.15
    },
    torpedo: {
      name: '鱼雷',
      speed: 280,
      damage: 3,
      size: 12,
      color: '#ff6644',
      trailColor: '#ff4400',
      ammoKey: 'torpedo',
      aoe: 60,
      cooldown: 0.4
    },
    sonar: {
      name: '声纳',
      speed: 350,
      damage: 0,
      size: 8,
      color: '#44ffaa',
      trailColor: '#22dd88',
      ammoKey: 'sonar',
      aoe: 0,
      cooldown: 0.3
    }
  },

  // ============================================================
  // 技能配置
  // ============================================================
  SKILL_CONFIG: {
    freeze: { name: '冰冻', key: 'Q', color: '#44ccff', cooldown: 12 },
    bomb: { name: '炸弹', key: 'W', color: '#ff6644', cooldown: 15 },
    speed: { name: '加速', key: 'E', color: '#44ff44', cooldown: 10 }
  },

  // ============================================================
  // 对外接口
  // ============================================================

  /**
   * 初始化游戏
   * @param {HTMLCanvasElement} canvas - 用于渲染的 Canvas 元素
   */
  init(canvas) {
    if (!canvas) {
      console.error('[FishingGameV2] init: canvas 参数为空');
      return;
    }
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = canvas.width;
    this.H = canvas.height;

    console.log('[FishingGameV2] 初始化完成', this.W, 'x', this.H);
  },

  /**
   * 启动游戏
   */
  start() {
    if (this.active) return;
    this.active = true;
    this.gameStarted = true;
    this.gameEnded = false;
    this._returning = false;

    // 重置全部状态
    this.score = 0;
    this.coins = 0;
    this.timeLeft = 60;
    this.combo = 0;
    this.comboTimer = 0;
    this.comboMultiplier = 1;
    this.frenzyMode = false;
    this.frenzyTimer = 0;
    this.waveTime = 0;
    this.currentWeapon = 'harpoon';
    this.weaponCooldown = 0;

    this.ammo = { harpoon: Infinity, torpedo: 5, sonar: 2 };
    this.skills = { freeze: 1, bomb: 1, speed: 1 };
    this.skillCooldowns = { freeze: 0, bomb: 0, speed: 0 };
    this.effects = { frozen: false, frozenTimer: 0, speedBoost: false, speedTimer: 0 };

    this.fishes = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.treasure = null;
    this.spawnTimer = 0;
    this.spawnInterval = 1.5;
    this.treasureTimer = 0;

    this._result = { score: 0, fishCount: 0, fishCaught: 0, fishTypes: {}, coins: 0 };

    // 清空粒子
    VFX.clearParticles();

    // 玩家位置
    this.player.x = this.W / 2;
    this.player.y = this.H * 0.85;
    this.player.targetX = this.W / 2;
    this.player.angle = -Math.PI / 2;

    // 初始化环境
    this._initDecorations();

    // 绑定输入
    this._bindInput();

    // 启动倒计时
    this._startTimer();

    // 启动游戏循环
    this.lastTime = performance.now();
    this._gameLoop(this.lastTime);

    console.log('[FishingGameV2] 游戏已启动');
  },

  /**
   * 停止游戏并清理
   */
  stop() {
    this.active = false;
    this.gameStarted = false;
    this.gameEnded = true;

    // 停止倒计时
    this._stopTimer();

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this._unbindInput();
    VFX.clearParticles();

    console.log('[FishingGameV2] 游戏已停止');
  },

  /**
   * 获取结果
   * @returns {{ score: number, fishCount: number, fishCaught: number, fishTypes: object }}
   */
  getResult() {
    return { ...this._result };
  },

  // ============================================================
  // 环境初始化
  // ============================================================
  _initDecorations() {
    // 海草
    this.seaweeds = [];
    for (let i = 0; i < 16; i++) {
      this.seaweeds.push({
        x: this.W * 0.04 + (i / 15) * (this.W * 0.92),
        h: this.H * 0.06 + Math.random() * this.H * 0.08,
        w: 3 + Math.random() * 3,
        color: `hsl(${110 + Math.random() * 30}, ${50 + Math.random() * 30}%, ${22 + Math.random() * 16}%)`,
        phase: Math.random() * Math.PI * 2,
        speed: 1.2 + Math.random() * 1.5
      });
    }

    // 气泡
    this.bubbles = [];
    for (let i = 0; i < 25; i++) {
      this.bubbles.push(this._createBubble());
    }

    // 海底装饰石
    this.decorations = [];
    for (let i = 0; i < 4; i++) {
      this.decorations.push({
        x: this.W * 0.08 + (i / 3) * (this.W * 0.84) + (Math.random() - 0.5) * this.W * 0.05,
        y: this.H * 0.86 + Math.random() * this.H * 0.06,
        r: 6 + Math.random() * 14,
        color: `hsl(30, ${10 + Math.random() * 15}%, ${30 + Math.random() * 20}%)`
      });
    }
  },

  _createBubble() {
    return {
      x: Math.random() * this.W,
      y: this.H * 0.75 + Math.random() * this.H * 0.2,
      r: 1.5 + Math.random() * 5,
      speed: 15 + Math.random() * 35,
      wobble: Math.random() * Math.PI * 2,
      alpha: 0.1 + Math.random() * 0.25
    };
  },

  // ============================================================
  // 输入绑定
  // ============================================================
  _bindInput() {
    this._onKeyDown = (e) => {
      this.keys[e.code] = true;

      if (this.gameEnded) {
        if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter') {
          this._returnToMenu();
        }
        return;
      }

      // 武器切换
      if (e.code === 'Digit1') this.currentWeapon = 'harpoon';
      if (e.code === 'Digit2') this.currentWeapon = 'torpedo';
      if (e.code === 'Digit3') this.currentWeapon = 'sonar';

      // 技能
      if (e.code === 'KeyQ') this._useSkill('freeze');
      if (e.code === 'KeyW') this._useSkill('bomb');
      if (e.code === 'KeyE') this._useSkill('speed');

      if (e.code === 'Escape') { this.stop(); }
    };

    this._onKeyUp = (e) => {
      this.keys[e.code] = false;
    };

    this._onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const sx = this.canvas.width / rect.width;
      const sy = this.canvas.height / rect.height;
      this.mousePos.x = (e.clientX - rect.left) * sx;
      this.mousePos.y = (e.clientY - rect.top) * sy;
      this.player.targetX = Math.max(this.W * 0.05, Math.min(this.W * 0.95, this.mousePos.x));
    };

    this._onMouseDown = (e) => {
      if (e.button !== 0) return;
      if (this.gameEnded) {
        if (!this._returning) {
          this._returning = true;
          this._returnToMenu();
        }
        return;
      }
      this.mouseDown = true;
      this._fireWeapon();
    };

    this._onMouseUp = (e) => {
      if (e.button === 0) this.mouseDown = false;
    };

    this._onWheel = (e) => {
      e.preventDefault();
      const weapons = ['harpoon', 'torpedo', 'sonar'];
      const idx = weapons.indexOf(this.currentWeapon);
      if (e.deltaY > 0) {
        this.currentWeapon = weapons[(idx + 1) % weapons.length];
      } else {
        this.currentWeapon = weapons[(idx - 1 + weapons.length) % weapons.length];
      }
    };

    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mouseup', this._onMouseUp);
    this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
  },

  _unbindInput() {
    if (this._onKeyDown) document.removeEventListener('keydown', this._onKeyDown);
    if (this._onKeyUp) document.removeEventListener('keyup', this._onKeyUp);
    if (this._onMouseMove && this.canvas) this.canvas.removeEventListener('mousemove', this._onMouseMove);
    if (this._onMouseDown && this.canvas) this.canvas.removeEventListener('mousedown', this._onMouseDown);
    if (this._onMouseUp) document.removeEventListener('mouseup', this._onMouseUp);
    if (this._onWheel && this.canvas) this.canvas.removeEventListener('wheel', this._onWheel);
  },

  // ============================================================
  // 武器发射
  // ============================================================
  _fireWeapon() {
    if (this.gameEnded) return;
    if (this.weaponCooldown > 0) return;

    const cfg = this.WEAPON_CONFIG[this.currentWeapon];
    if (!cfg) return;

    // 弹药检查
    const ammoKey = cfg.ammoKey;
    if (this.ammo[ammoKey] === undefined || this.ammo[ammoKey] <= 0) {
      this._showFloatingText(this.player.x, this.player.y - 20, '弹药不足!', '#ff4444');
      return;
    }

    // 消耗弹药
    if (ammoKey !== 'harpoon') {
      this.ammo[ammoKey]--;
    }

    this.weaponCooldown = cfg.cooldown;

    const angle = this.player.angle;
    const startX = this.player.x;
    const startY = this.player.y - 10;

    // 声纳武器立即扩散
    if (this.currentWeapon === 'sonar') {
      this._fireSonar(startX, startY, cfg);
      Audio.playShoot(0.4);
      return;
    }

    const proj = {
      x: startX,
      y: startY,
      vx: Math.cos(angle) * cfg.speed,
      vy: Math.sin(angle) * cfg.speed,
      weapon: this.currentWeapon,
      damage: cfg.damage,
      size: cfg.size,
      color: cfg.color,
      trailColor: cfg.trailColor,
      life: 2.5,
      aoe: cfg.aoe || 0,
      hitFishes: new Set()
    };
    this.projectiles.push(proj);

    // 射击火花特效
    VFX.createHitSparks(this.ctx, startX, startY, cfg.color);
    Audio.playShoot(0.3);
  },

  _fireSonar(x, y, cfg) {
    // 声纳：360度脉冲，对所有鱼造成伤害
    const radius = Math.min(this.W, this.H) * 0.5;

    VFX.createExplosion(this.ctx, x, y, {
      color: '#44ffaa',
      color2: '#22dd88',
      color3: '#ffffff',
      count: 50,
      speed: 150,
      size: 5,
      life: 0.6
    });

    for (let i = this.fishes.length - 1; i >= 0; i--) {
      const fish = this.fishes[i];
      const dist = Math.hypot(fish.x - x, fish.y - y);
      if (dist < radius) {
        fish.hp -= 2;
        fish.flashTimer = 0.15;
        if (fish.hp <= 0) {
          this._catchFish(fish);
        }
      }
    }

    ScreenShake.trigger(8, 0.3);
  },

  // ============================================================
  // 技能使用
  // ============================================================
  _useSkill(skillName) {
    if (this.gameEnded) return;
    if (!this.skills[skillName] || this.skills[skillName] <= 0) {
      this._showFloatingText(this.player.x, this.player.y - 20, '技能冷却中!', '#ff8844');
      return;
    }

    const cfg = this.SKILL_CONFIG[skillName];
    this.skills[skillName] = 0;
    this.skillCooldowns[skillName] = cfg.cooldown;

    Audio.playPowerup(0.4);

    switch (skillName) {
      case 'freeze':
        this.effects.frozen = true;
        this.effects.frozenTimer = 3;
        this._showFloatingText(this.W / 2, this.H * 0.35, '冰冻全场!(3秒)', cfg.color);
        break;

      case 'bomb':
        // 全屏轰炸
        VFX.createExplosion(this.ctx, this.W / 2, this.H / 2, {
          color: '#ff6644',
          color2: '#ff2200',
          color3: '#ffaa44',
          count: 60,
          speed: 300,
          size: 8,
          life: 0.8
        });
        for (let i = this.fishes.length - 1; i >= 0; i--) {
          const fish = this.fishes[i];
          fish.hp -= 3;
          fish.flashTimer = 0.2;
          if (fish.hp <= 0) {
            this._catchFish(fish);
          }
        }
        ScreenShake.trigger(12, 0.5);
        this._showFloatingText(this.W / 2, this.H * 0.35, '全屏轰炸!', cfg.color);
        break;

      case 'speed':
        this.effects.speedBoost = true;
        this.effects.speedTimer = 5;
        this._showFloatingText(this.W / 2, this.H * 0.35, '加速模式!(5秒)', cfg.color);
        break;
    }
  },

  // ============================================================
  // 游戏主循环
  // ============================================================
  _gameLoop(timestamp) {
    if (!this.active) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    // 更新 ScreenShake
    ScreenShake.update(dt);

    this._update(dt);
    this._render();

    this.animationId = requestAnimationFrame((t) => this._gameLoop(t));
  },

  // ============================================================
  // 更新逻辑
  // ============================================================
  _update(dt) {
    this.waveTime += dt;

    if (this.gameEnded) return;

    // 更新玩家
    this._updatePlayer(dt);

    // 武器冷却
    if (this.weaponCooldown > 0) this.weaponCooldown -= dt;

    // 生成
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this._spawnFish();
      this.spawnInterval = Math.max(0.4, 1.5 - (60 - this.timeLeft) * 0.02);
    }

    // 更新鱼
    this._updateFishes(dt);

    // 更新投射物
    this._updateProjectiles(dt);

    // 碰撞检测
    this._checkCollisions();

    // 更新 VFX 粒子
    VFX.updateParticles(dt);

    // 更新气泡
    this._updateBubbles(dt);

    // 宝藏箱
    this._updateTreasure(dt);

    // 稀有鱼随机生成事件
    this.rareFishTimer += dt;
    if (this.rareFishTimer >= this.rareFishInterval) {
      this.rareFishTimer = 0;
      if (Math.random() < 0.1) {
        this._spawnRareFish();
      }
    }

    // 连击计时
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboMultiplier = 1;
      }
    }

    // 冻结计时
    if (this.effects.frozen) {
      this.effects.frozenTimer -= dt;
      if (this.effects.frozenTimer <= 0) this.effects.frozen = false;
    }

    // 加速计时
    if (this.effects.speedBoost) {
      this.effects.speedTimer -= dt;
      if (this.effects.speedTimer <= 0) this.effects.speedBoost = false;
    }

    // 狂暴模式
    if (this.frenzyMode) {
      this.frenzyTimer -= dt;
      if (this.frenzyTimer <= 0) {
        this.frenzyMode = false;
      } else if (Math.random() < 0.35 && this.weaponCooldown <= 0) {
        this._fireWeapon();
      }
    }

    // 按住鼠标连续发射
    if (this.mouseDown && this.weaponCooldown <= 0) {
      this._fireWeapon();
    }

    // 技能冷却恢复
    for (const key in this.skillCooldowns) {
      if (this.skillCooldowns[key] > 0) {
        this.skillCooldowns[key] -= dt;
        if (this.skillCooldowns[key] <= 0) {
          this.skillCooldowns[key] = 0;
          this.skills[key] = 1;
        }
      }
    }

    // 浮动文字
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  },

  // ============================================================
  // 更新玩家
  // ============================================================
  _updatePlayer(dt) {
    const player = this.player;
    const dx = player.targetX - player.x;
    const moveSpeed = this.effects.speedBoost ? 16 : 8;
    player.x += dx * moveSpeed * dt;
    player.x = Math.max(this.W * 0.04, Math.min(this.W * 0.96, player.x));

    // 键盘左右移动
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      player.targetX -= this.W * 0.2 * dt;
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      player.targetX += this.W * 0.2 * dt;
    }
    player.targetX = Math.max(this.W * 0.04, Math.min(this.W * 0.96, player.targetX));

    // 瞄准角度
    const mx = this.mousePos.x - player.x;
    const my = this.mousePos.y - player.y;
    player.angle = Math.atan2(my, mx);
  },

  // ============================================================
  // 生成鱼
  // ============================================================
  _spawnFish() {
    const totalWeight = this.FISH_TYPES.reduce((s, t) => s + t.weight, 0);
    let rand = Math.random() * totalWeight;
    let fishType = this.FISH_TYPES[0];
    for (const ft of this.FISH_TYPES) {
      rand -= ft.weight;
      if (rand <= 0) { fishType = ft; break; }
    }

    const fromLeft = Math.random() < 0.5;
    const y = this.H * 0.08 + Math.random() * this.H * 0.68;

    this.fishes.push({
      x: fromLeft ? -this.W * 0.06 : this.W * 1.06,
      y: y,
      vx: (fromLeft ? 1 : -1) * fishType.speed * (0.8 + Math.random() * 0.4),
      vy: 0,
      type: fishType,
      hp: fishType.hp,
      maxHp: fishType.hp,
      angle: fromLeft ? 0 : Math.PI,
      patternTimer: 0,
      patternOffset: Math.random() * Math.PI * 2,
      flashTimer: 0,
      tailPhase: Math.random() * Math.PI * 2,
      scaleY: 1,
      // 品质系统：10%银色品质，2%金色品质
      quality: Math.random() < 0.02 ? 'gold' : (Math.random() < 0.1 ? 'silver' : 'normal')
    });
  },

  // ============================================================
  // 更新鱼
  // ============================================================
  _updateFishes(dt) {
    const frozen = this.effects.frozen;

    for (let i = this.fishes.length - 1; i >= 0; i--) {
      const fish = this.fishes[i];

      // 闪烁计时
      if (fish.flashTimer > 0) fish.flashTimer -= dt;

      if (frozen) continue;

      fish.patternTimer += dt;
      fish.tailPhase += dt * 10;

      const ft = fish.type;

      switch (ft.pattern) {
        case 'sine':
          fish.vy = Math.sin(fish.patternTimer * 2.5 + fish.patternOffset) * 35;
          break;
        case 'zigzag':
          if (Math.floor(fish.patternTimer * 2) % 2 === 0) {
            fish.vy = 50;
          } else {
            fish.vy = -50;
          }
          break;
        case 'bounce':
          fish.vy = Math.sin(fish.patternTimer * 3 + fish.patternOffset) * 25;
          fish.vx *= 0.9995;
          break;
        case 'fast':
          fish.vy = Math.sin(fish.patternTimer * 4 + fish.patternOffset) * 30;
          break;
        case 'charge':
          // 鲨鱼冲向潜艇
          const dx = this.player.x - fish.x;
          const dy = this.player.y - fish.y;
          const dist = Math.hypot(dx, dy);
          if (dist < this.W * 0.4) {
            const chargeSpeed = ft.speed * 1.8;
            fish.vx = (dx / dist) * chargeSpeed;
            fish.vy = (dy / dist) * chargeSpeed;
          } else {
            fish.vy = Math.sin(fish.patternTimer * 1.5 + fish.patternOffset) * 20;
          }
          break;
        case 'float':
          // 水母上下漂浮，缓慢左右移动
          fish.vy = Math.sin(fish.patternTimer * 1.2 + fish.patternOffset) * 25;
          fish.vx = (fish.vx > 0 ? 1 : -1) * ft.speed * 0.5;
          break;
        case 'dash':
          // 剑鱼高速直线冲刺，冲刺后短暂停顿
          if (!fish.dashState) {
            fish.dashState = 'dashing';
            fish.dashTimer = 0;
          }
          fish.dashTimer += dt;
          if (fish.dashState === 'dashing') {
            // 高速直线冲刺
            fish.vy = 0;
            fish.vx = (fish.vx > 0 ? 1 : -1) * ft.speed;
            if (fish.dashTimer > 1.5) {
              fish.dashState = 'pausing';
              fish.dashTimer = 0;
              fish.vx = 0;
            }
          } else if (fish.dashState === 'pausing') {
            // 短暂停顿
            fish.vx = 0;
            fish.vy = Math.sin(fish.patternTimer * 3 + fish.patternOffset) * 8;
            if (fish.dashTimer > 0.8) {
              fish.dashState = 'dashing';
              fish.dashTimer = 0;
              fish.vx = (Math.random() < 0.5 ? 1 : -1) * ft.speed;
            }
          }
          break;
        case 'lure':
          // 灯笼鱼缓慢移动，周围生成1-2条小鱼跟随
          fish.vy = Math.sin(fish.patternTimer * 0.8 + fish.patternOffset) * 15;
          fish.vx = (fish.vx > 0 ? 1 : -1) * ft.speed * 0.6;
          // 定期生成跟随小鱼
          if (!fish.lureSpawned || fish.patternTimer - fish.lureSpawned > 5) {
            fish.lureSpawned = fish.patternTimer;
            const followerCount = 1 + Math.floor(Math.random() * 2);
            for (let f = 0; f < followerCount; f++) {
              this.fishes.push({
                x: fish.x + (Math.random() - 0.5) * 30,
                y: fish.y + (Math.random() - 0.5) * 20,
                vx: fish.vx * 0.8,
                vy: 0,
                type: this.FISH_TYPES[0], // 小丑鱼作为跟随者
                hp: 1,
                maxHp: 1,
                angle: fish.angle,
                patternTimer: 0,
                patternOffset: Math.random() * Math.PI * 2,
                flashTimer: 0,
                tailPhase: Math.random() * Math.PI * 2,
                scaleY: 1,
                isLureFollower: true,
                lureParent: fish
              });
            }
          }
          break;
      }

      fish.x += fish.vx * dt;
      fish.y += fish.vy * dt;
      fish.angle = Math.atan2(fish.vy, fish.vx);

      // 灯笼鱼跟随者：朝父鱼移动
      if (fish.isLureFollower && fish.lureParent) {
        const pdx = fish.lureParent.x - fish.x;
        const pdy = fish.lureParent.y - fish.y;
        const pdist = Math.hypot(pdx, pdy);
        if (pdist > 25) {
          fish.vx = (pdx / pdist) * 60;
          fish.vy = (pdy / pdist) * 60;
        }
      }

      // 幽灵鲨穿墙能力：从另一侧出现
      if (ft.special === 'phase') {
        if (fish.x < -this.W * 0.05) fish.x = this.W * 1.05;
        if (fish.x > this.W * 1.05) fish.x = -this.W * 0.05;
        if (fish.y < -this.H * 0.05) fish.y = this.H * 1.05;
        if (fish.y > this.H * 1.05) fish.y = -this.H * 0.05;
        continue; // 穿墙鱼不移除
      }

      // 边界移除
      if (fish.x < -this.W * 0.1 || fish.x > this.W * 1.1 ||
          fish.y < -this.H * 0.1 || fish.y > this.H * 1.05) {
        this.fishes.splice(i, 1);
      }
    }
  },

  // ============================================================
  // 更新投射物
  // ============================================================
  _updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // 鱼雷有重力下坠
      if (p.weapon === 'torpedo') {
        p.vy += 40 * dt;
      }

      // 拖尾特效
      if (p.trailColor) {
        VFX.createTrail(this.ctx, p.x, p.y, p.trailColor, 2);
      }

      // 边界或寿命结束
      if (p.x < -30 || p.x > this.W + 30 || p.y < -30 || p.y > this.H + 30 || p.life <= 0) {
        // 鱼雷爆炸
        if (p.weapon === 'torpedo' && p.aoe > 0) {
          this._torpedoExplode(p);
        }
        this.projectiles.splice(i, 1);
      }
    }
  },

  _torpedoExplode(p) {
    VFX.createExplosion(this.ctx, p.x, p.y, {
      color: '#ff6644',
      color2: '#ff2200',
      color3: '#ffaa44',
      count: 35,
      speed: 180,
      size: 6,
      life: 0.6
    });
    Audio.playExplosion(0.5);
    ScreenShake.trigger(8, 0.3);

    // 范围伤害
    const radius = p.aoe;
    for (let i = this.fishes.length - 1; i >= 0; i--) {
      const fish = this.fishes[i];
      const dist = Math.hypot(fish.x - p.x, fish.y - p.y);
      if (dist < radius) {
        fish.hp -= p.damage;
        fish.flashTimer = 0.15;
        if (fish.hp <= 0) {
          this._catchFish(fish);
        }
      }
    }
  },

  // ============================================================
  // 碰撞检测
  // ============================================================
  _checkCollisions() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (p.weapon === 'torpedo') continue; // 鱼雷在边界/寿命结束时处理

      for (let j = this.fishes.length - 1; j >= 0; j--) {
        const fish = this.fishes[j];
        const dist = Math.hypot(fish.x - p.x, fish.y - p.y);

        if (dist < fish.type.size + p.size) {
          // 部位伤害判定
          const hitMultiplier = this._calcHitZone(p, fish);
          const finalDamage = p.damage * hitMultiplier;

          fish.hp -= finalDamage;
          fish.flashTimer = 0.12;

          // 命中特效
          VFX.createHitSparks(this.ctx, p.x, p.y, '#ffdd44');
          Audio.playHit(0.3);

          // 部位伤害提示
          if (hitMultiplier >= 2.0) {
            this._showFloatingText(p.x, p.y - 10, '爆头! x2.0', '#ff4444');
          } else if (hitMultiplier < 0.8) {
            this._showFloatingText(p.x, p.y - 10, '擦伤 x0.7', '#888888');
          }

          // 鱼叉一击必杀（默认伤害1，鱼有hp）
          if (p.weapon === 'harpoon') {
            if (fish.hp <= 0) {
              this._catchFish(fish);
            }
            this.projectiles.splice(i, 1);
            break;
          }

          if (fish.hp <= 0) {
            this._catchFish(fish);
          }
        }
      }
    }

    // 宝藏箱碰撞
    if (this.treasure) {
      const dist = Math.hypot(this.player.x - this.treasure.x, this.player.y - this.treasure.y);
      if (dist < this.treasure.size + 25) {
        this._openTreasure();
      }
    }
  },

  // ============================================================
  // 部位伤害判定
  // ============================================================
  _calcHitZone(proj, fish) {
    // 将投射物命中点转换到鱼的局部坐标系
    const dx = proj.x - fish.x;
    const dy = proj.y - fish.y;
    const fishAngle = Math.atan2(fish.vy, fish.vx);
    // 在鱼朝向上的投影（正方向=头部）
    const localX = dx * Math.cos(fishAngle) + dy * Math.sin(fishAngle);
    const fishLen = fish.type.size * 2;

    // 头部（前方30%区域）: 2.0x伤害
    if (localX > fishLen * 0.2) return 2.0;
    // 躯干（中间40%区域）: 1.0x伤害
    if (localX > -fishLen * 0.2) return 1.0;
    // 尾部（后方30%区域）: 0.7x伤害
    return 0.7;
  },

  // ============================================================
  // 捕获鱼
  // ============================================================
  _catchFish(fish) {
    const idx = this.fishes.indexOf(fish);
    if (idx > -1) this.fishes.splice(idx, 1);

    const ft = fish.type;
    const multiplier = this.comboMultiplier;

    // 品质倍率
    const qualityMultiplier = fish.quality === 'gold' ? 3 : (fish.quality === 'silver' ? 1.5 : 1);
    const finalScore = Math.round(ft.score * multiplier * qualityMultiplier);
    const earnedCoins = Math.round(ft.score * qualityMultiplier);

    this.score += finalScore;
    this.coins += earnedCoins;
    this._result.score = this.score;
    this._result.coins = this.coins;
    this._result.fishCaught = (this._result.fishCaught || 0) + 1;
    this._result.fishTypes[ft.name] = (this._result.fishTypes[ft.name] || 0) + 1;

    // 金色爆炸特效
    VFX.createExplosion(this.ctx, fish.x, fish.y, {
      color: '#ffd700',
      color2: '#ffaa00',
      color3: '#ffffff',
      count: 40,
      speed: 180,
      size: 5,
      life: 0.7
    });

    // 气泡
    VFX.createBubbleBurst(this.ctx, fish.x, fish.y, 6, 'rgba(200, 220, 255, 0.5)');

    Audio.playCatch(0.35);
    ScreenShake.trigger(4, 0.15);

    // 分数浮动文字（含品质标识）
    const qualityText = fish.quality === 'gold' ? ' [金]' : (fish.quality === 'silver' ? ' [银]' : '');
    this._showFloatingText(fish.x, fish.y - 15, '+' + finalScore + qualityText,
      fish.quality === 'gold' ? '#ffd700' : (fish.quality === 'silver' ? '#c0c0c0' : ft.color));

    // 海币浮动文字
    this._showFloatingText(fish.x + 20, fish.y - 5, '+' + earnedCoins + ' 海币', '#44ddff');

    // 连击
    this._addCombo();

    // 拖尾残留
    for (let k = 0; k < 3; k++) {
      VFX.createTrail(this.ctx, fish.x + (Math.random() - 0.5) * 10, fish.y + (Math.random() - 0.5) * 10, ft.color, 3);
    }

    // 水母分裂机制
    if (ft.id === 'jellyfish' && !fish.isSplit) {
      this._splitJellyfish(fish);
    }
  },

  // ============================================================
  // 水母分裂机制
  // ============================================================
  _splitJellyfish(fish) {
    for (let i = 0; i < 2; i++) {
      const angle = (i === 0 ? -1 : 1) * (Math.PI / 4) + fish.angle;
      this.fishes.push({
        x: fish.x + (Math.random() - 0.5) * 10,
        y: fish.y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * 40,
        vy: Math.sin(angle) * 40,
        type: {
          id: 'jellyfish',
          name: '小水母',
          color: '#cc88ff',
          color2: '#aa44dd',
          size: 8,
          speed: 40,
          score: 3,
          hp: 1,
          weight: 0,
          pattern: 'float'
        },
        hp: 1,
        maxHp: 1,
        angle: angle,
        patternTimer: 0,
        patternOffset: Math.random() * Math.PI * 2,
        flashTimer: 0,
        tailPhase: Math.random() * Math.PI * 2,
        scaleY: 1,
        quality: 'normal',
        isSplit: true
      });
    }
  },

  // ============================================================
  // 连击系统
  // ============================================================
  _addCombo() {
    this.combo++;
    this.comboTimer = 2.5;

    const W = this.W;
    const H = this.H;

    if (this.combo >= 30 && !this.frenzyMode) {
      // 30连击：狂暴模式
      this.comboMultiplier = 3;
      this.frenzyMode = true;
      this.frenzyTimer = 5;
      VFX.createComboFlash(this.ctx, W, H, 30);
      Audio.playCombo(0.6);
      ScreenShake.trigger(10, 0.4);
      this._showFloatingText(W / 2, H * 0.3, '狂暴模式! 自动射击5秒', '#ff4444');
    } else if (this.combo >= 20) {
      // 20连击：x3倍 + 时间+5秒
      this.comboMultiplier = 3;
      this.timeLeft += 5;
      VFX.createComboFlash(this.ctx, W, H, 20);
      Audio.playCombo(0.5);
      this._showFloatingText(W / 2, H * 0.3, '20连击! x3倍 时间+5秒', '#ffaa00');
    } else if (this.combo >= 10) {
      // 10连击：x2倍
      this.comboMultiplier = 2;
      if (this.combo === 10) {
        VFX.createComboFlash(this.ctx, W, H, 10);
        Audio.playCombo(0.4);
        this._showFloatingText(W / 2, H * 0.3, '10连击! x2倍', '#ffdd44');
      }
    }
  },

  // ============================================================
  // 稀有鱼生成
  // ============================================================
  _spawnRareFish() {
    const rareType = this.RARE_FISH_TYPES[Math.floor(Math.random() * this.RARE_FISH_TYPES.length)];
    const fromLeft = Math.random() < 0.5;
    const y = this.H * 0.1 + Math.random() * this.H * 0.6;

    this.fishes.push({
      x: fromLeft ? -this.W * 0.06 : this.W * 1.06,
      y: y,
      vx: (fromLeft ? 1 : -1) * rareType.speed * (0.9 + Math.random() * 0.2),
      vy: 0,
      type: rareType,
      hp: rareType.hp,
      maxHp: rareType.hp,
      angle: fromLeft ? 0 : Math.PI,
      patternTimer: 0,
      patternOffset: Math.random() * Math.PI * 2,
      flashTimer: 0,
      tailPhase: Math.random() * Math.PI * 2,
      scaleY: 1,
      quality: 'normal',
      isRare: true
    });

    // 全屏闪烁 + 文字提示
    const rarityText = rareType.rarity === 'epic' ? '史诗级!' : '稀有!';
    const rarityColor = rareType.rarity === 'epic' ? '#ff44ff' : '#ffd700';
    this._showFloatingText(this.W / 2, this.H * 0.25, rarityText + ' ' + rareType.name + ' 出现!', rarityColor);
    ScreenShake.trigger(6, 0.3);
  },

  // ============================================================
  // 宝藏箱
  // ============================================================
  _updateTreasure(dt) {
    if (!this.treasure) {
      this.treasureTimer += dt;
      if (this.treasureTimer >= this.treasureInterval) {
        this.treasureTimer = 0;
        this._spawnTreasure();
      }
    }
  },

  _spawnTreasure() {
    this.treasure = {
      x: this.W * 0.1 + Math.random() * this.W * 0.8,
      y: this.H * 0.82 + Math.random() * this.H * 0.06,
      size: Math.min(this.W, this.H) * 0.035,
      glowPhase: 0,
      bobPhase: Math.random() * Math.PI * 2
    };
  },

  _openTreasure() {
    if (!this.treasure) return;
    const tx = this.treasure.x;
    const ty = this.treasure.y;

    // 紫色爆炸特效
    VFX.createExplosion(this.ctx, tx, ty, {
      color: '#aa44ff',
      color2: '#6600cc',
      color3: '#ff88ff',
      count: 55,
      speed: 250,
      size: 7,
      life: 0.9
    });

    // 气泡爆发
    VFX.createBubbleBurst(this.ctx, tx, ty, 12, 'rgba(180, 100, 255, 0.5)');

    Audio.playTreasure(0.5);
    ScreenShake.trigger(10, 0.4);

    const bonus = 500;
    this.score += bonus;
    this._result.score = this.score;

    this._showFloatingText(tx, ty - 20, '+' + bonus, '#aa44ff');
    this._showFloatingText(this.W / 2, this.H * 0.35, '发现宝藏箱! +500', '#aa44ff');

    this.treasure = null;
    this.treasureTimer = 0;
  },

  // ============================================================
  // 气泡更新
  // ============================================================
  _updateBubbles(dt) {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.y -= b.speed * dt;
      b.wobble += dt * 2;
      b.x += Math.sin(b.wobble) * 8 * dt;
      b.alpha = 0.1 + Math.sin(b.wobble * 0.5) * 0.08;

      if (b.y < -10) {
        this.bubbles[i] = this._createBubble();
      }
    }
  },

  // ============================================================
  // 浮动文字
  // ============================================================
  _showFloatingText(x, y, text, color) {
    this.floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color || '#ffffff',
      life: 1.2,
      maxLife: 1.2,
      vy: -(50 + Math.random() * 30)
    });
  },

  // ============================================================
  // 计时器
  // ============================================================
  _timerInterval: null,

  _startTimer() {
    this._stopTimer();
    this._timerInterval = setInterval(() => {
      if (this.gameEnded || !this.active) {
        this._stopTimer();
        return;
      }
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this._endGame();
      }
    }, 1000);
  },

  _stopTimer() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  },

  // ============================================================
  // 游戏结束
  // ============================================================
  _endGame() {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this._stopTimer();
    Audio.playExplosion(0.5);
    this._result.fishCount = this._result.fishCaught || 0;
    this._result.score = this.score;
  },

  // ============================================================
  // 返回菜单
  // ============================================================
  _returnToMenu() {
    this.stop();
    // 触发回调（如果有）
    if (typeof this._onReturn === 'function') {
      this._onReturn(this.getResult());
    }
  },

  /**
   * 设置返回回调
   */
  onReturn(callback) {
    this._onReturn = callback;
  },

  // ============================================================
  // 渲染
  // ============================================================
  _render() {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const W = this.W;
    const H = this.H;

    ctx.save();

    // 屏幕震动偏移
    const shake = ScreenShake.getOffset();
    ctx.translate(shake.x, shake.y);

    ctx.clearRect(-10, -10, W + 20, H + 20);

    // --- 背景 ---
    this._renderBackground(ctx);

    // --- 水面波浪 ---
    this._renderWaves(ctx);

    // --- 气泡 ---
    this._renderBubbles(ctx);

    // --- 海底 ---
    this._renderSeaFloor(ctx);

    // --- 宝藏箱 ---
    this._renderTreasure(ctx);

    // --- 鱼 ---
    this._renderFishes(ctx);

    // --- 投射物 ---
    this._renderProjectiles(ctx);

    // --- 玩家 ---
    this._renderPlayer(ctx);

    // --- VFX粒子 ---
    VFX.renderParticles(ctx);

    // --- 浮动文字 ---
    this._renderFloatingTexts(ctx);

    // --- UI覆盖层 ---
    this._renderUI(ctx);

    // --- 状态覆盖层 ---
    if (this.effects.frozen) {
      ctx.fillStyle = 'rgba(68, 204, 255, 0.12)';
      ctx.fillRect(0, 0, W, H);
    }
    if (this.effects.speedBoost) {
      ctx.fillStyle = 'rgba(68, 255, 68, 0.06)';
      ctx.fillRect(0, 0, W, H);
    }
    if (this.frenzyMode) {
      ctx.fillStyle = 'rgba(255, 68, 68, 0.08)';
      ctx.fillRect(0, 0, W, H);
    }

    // --- 游戏结束面板 ---
    if (this.gameEnded) {
      this._renderResultScreen(ctx);
    }

    ctx.restore();
  },

  // ============================================================
  // 渲染背景
  // ============================================================
  _renderBackground(ctx) {
    const W = this.W;
    const H = this.H;

    // 深海渐变
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#000d1a');
    grad.addColorStop(0.3, '#001a33');
    grad.addColorStop(0.6, '#00264d');
    grad.addColorStop(0.85, '#003366');
    grad.addColorStop(1, '#004d4d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 水下光线
    const time = Date.now() * 0.0005;
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const lx = W * 0.08 + (i / 5) * W * 0.84;
      const sway = Math.sin(time + i * 1.2) * W * 0.04;
      ctx.beginPath();
      ctx.moveTo(lx + sway, 0);
      ctx.quadraticCurveTo(lx + sway + W * 0.03, H * 0.35, lx + sway - W * 0.02, H * 0.65);
      ctx.lineTo(lx + sway - W * 0.06, H * 0.65);
      ctx.quadraticCurveTo(lx + sway - W * 0.05, H * 0.35, lx + sway, 0);
      ctx.closePath();
      const lg = ctx.createLinearGradient(lx + sway, 0, lx + sway, H * 0.65);
      lg.addColorStop(0, 'rgba(180, 220, 255, 0.06)');
      lg.addColorStop(1, 'rgba(180, 220, 255, 0)');
      ctx.fillStyle = lg;
      ctx.fill();
    }
    ctx.restore();

    // 海底沙地
    ctx.fillStyle = '#1a3a2a';
    ctx.fillRect(0, H * 0.88, W, H * 0.12);
    // 沙地纹理
    ctx.fillStyle = '#2a4a3a';
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * W;
      const sy = H * 0.88 + Math.random() * H * 0.1;
      ctx.beginPath();
      ctx.arc(sx, sy, 1 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // ============================================================
  // 水面波浪（正弦波动画）
  // ============================================================
  _renderWaves(ctx) {
    const W = this.W;
    const H = this.H;
    const time = this.waveTime;

    ctx.save();
    const waveY = H * 0.03;
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.2)';
    ctx.lineWidth = 1.5;

    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath();
      const amp = 3 + layer * 2;
      const freq = 0.008 + layer * 0.003;
      const speed = 1.5 + layer * 0.8;
      for (let x = 0; x <= W; x += 3) {
        const y = waveY + layer * 6 + Math.sin(x * freq + time * speed + layer) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 水面高光
    for (let i = 0; i < 8; i++) {
      const fx = (i / 7) * W + Math.sin(time * 1.2 + i * 2) * W * 0.05;
      const fy = waveY + Math.sin(fx * 0.01 + time * 2) * 5;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.03 + Math.sin(time + i) * 0.02})`;
      ctx.beginPath();
      ctx.arc(fx, fy, 8 + Math.sin(time + i * 0.5) * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  },

  // ============================================================
  // 渲染气泡
  // ============================================================
  _renderBubbles(ctx) {
    ctx.save();
    this.bubbles.forEach(b => {
      ctx.globalAlpha = b.alpha;
      ctx.strokeStyle = 'rgba(180, 220, 255, 0.35)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(180, 220, 255, 0.08)';
      ctx.fill();
      // 高光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.25, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  },

  // ============================================================
  // 渲染海底
  // ============================================================
  _renderSeaFloor(ctx) {
    const H = this.H;
    const time = this.waveTime;

    // 石头
    ctx.save();
    this.decorations.forEach(d => {
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.r, d.r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      // 高光
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.ellipse(d.x - d.r * 0.2, d.y - d.r * 0.15, d.r * 0.4, d.r * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 海草
    ctx.save();
    this.seaweeds.forEach(sw => {
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.w;
      ctx.lineCap = 'round';
      const segments = 6;
      const segH = sw.h / segments;
      ctx.beginPath();
      ctx.moveTo(sw.x, H);
      let cx = sw.x;
      let cy = H;
      for (let j = 0; j < segments; j++) {
        const sway = Math.sin(time * sw.speed + sw.phase + j * 0.6) * (j + 1) * 2.5;
        cx = sw.x + sway;
        cy -= segH;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    });
    ctx.restore();
  },

  // ============================================================
  // 渲染宝藏箱
  // ============================================================
  _renderTreasure(ctx) {
    if (!this.treasure) return;
    const t = this.treasure;
    const time = this.waveTime;

    t.glowPhase += 0.04;
    const bobY = Math.sin(time * 1.5 + t.bobPhase) * 4;

    ctx.save();
    ctx.translate(t.x, t.y + bobY);

    const s = t.size;

    // 呼吸光晕
    const glowAlpha = 0.15 + Math.sin(t.glowPhase) * 0.1;
    ctx.globalAlpha = glowAlpha;
    ctx.fillStyle = '#aa44ff';
    ctx.beginPath();
    ctx.arc(0, -s * 0.3, s * 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 箱体
    ctx.fillStyle = '#8B6914';
    Canvas._roundRect(ctx, -s, -s * 0.6, s * 2, s * 0.6, 2);
    ctx.fill();

    // 箱盖
    ctx.fillStyle = '#A0781A';
    ctx.beginPath();
    ctx.moveTo(-s, -s * 0.6);
    ctx.lineTo(-s * 0.85, -s * 0.95);
    ctx.lineTo(s * 0.85, -s * 0.95);
    ctx.lineTo(s, -s * 0.6);
    ctx.closePath();
    ctx.fill();

    // 金边
    ctx.strokeStyle = '#aa44ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#aa44ff';
    ctx.shadowBlur = 10;
    ctx.strokeRect(-s, -s * 0.6, s * 2, s * 0.6);
    ctx.shadowBlur = 0;

    // 锁（紫色宝石）
    ctx.fillStyle = '#cc66ff';
    ctx.shadowColor = '#cc66ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, -s * 0.3, s * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 金色亮点
    ctx.fillStyle = '#ffd700';
    for (let i = 0; i < 3; i++) {
      const sx = (Math.random() - 0.5) * s * 1.2;
      const sy = -s * 0.3 + (Math.random() - 0.5) * s * 0.5;
      ctx.globalAlpha = 0.3 + Math.random() * 0.3;
      ctx.beginPath();
      ctx.arc(sx, sy, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  },

  // ============================================================
  // 渲染鱼
  // ============================================================
  _renderFishes(ctx) {
    const time = this.waveTime;

    this.fishes.forEach(fish => {
      ctx.save();
      ctx.translate(fish.x, fish.y);

      // 方向翻转
      const flip = fish.vx < 0 ? -1 : 1;
      ctx.scale(flip, 1);
      ctx.rotate(fish.vy * 0.003 * flip);

      const ft = fish.type;
      const s = ft.size;
      const tailWag = Math.sin(fish.tailPhase) * 0.12;
      const flash = fish.flashTimer > 0;

      // 鱼发光拖尾
      VFX.createTrail(ctx, 0, 0, ft.color, 1);

      // 闪烁效果（被攻击时白色闪烁）
      if (flash) {
        ctx.globalAlpha = 0.5 + Math.sin(time * 60) * 0.3;
      }

      // 外发光（稀有/高分鱼）
      if (ft.score >= 12 || fish.isRare) {
        ctx.shadowColor = fish.isRare ? (ft.glowColor || ft.color) : ft.color;
        ctx.shadowBlur = fish.isRare ? 18 : 12;
      }

      // 品质光环
      if (fish.quality === 'gold') {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;
      } else if (fish.quality === 'silver') {
        ctx.shadowColor = '#c0c0c0';
        ctx.shadowBlur = 10;
      }

      // 根据鱼种绘制
      switch (ft.id) {
        case 'clownfish':
          this._drawClownfish(ctx, s, tailWag, ft);
          break;
        case 'tropical':
          this._drawTropicalFish(ctx, s, tailWag, ft);
          break;
        case 'pufferfish':
          this._drawPufferfish(ctx, s, tailWag, ft);
          break;
        case 'tuna':
          this._drawTuna(ctx, s, tailWag, ft);
          break;
        case 'shark':
          this._drawShark(ctx, s, tailWag, ft);
          break;
        case 'jellyfish':
          this._drawJellyfish(ctx, s, tailWag, ft, fish);
          break;
        case 'swordfish':
          this._drawSwordfish(ctx, s, tailWag, ft);
          break;
        case 'lanternfish':
          this._drawLanternfish(ctx, s, tailWag, ft, fish);
          break;
        case 'golden_koi':
          this._drawGoldenKoi(ctx, s, tailWag, ft, fish);
          break;
        case 'ghost_shark':
          this._drawGhostShark(ctx, s, tailWag, ft, fish);
          break;
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.restore();
    });
  },

  _drawClownfish(ctx, s, tailWag, ft) {
    // 身体（橙色+白色条纹）
    ctx.fillStyle = ft.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 白色条纹
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(-s * 0.15, -s * 0.4, s * 0.15, s * 0.8);
    ctx.fillRect(s * 0.2, -s * 0.35, s * 0.12, s * 0.7);
    ctx.fillRect(-s * 0.45, -s * 0.3, s * 0.12, s * 0.6);

    // 尾巴
    ctx.fillStyle = ft.color2;
    ctx.beginPath();
    ctx.moveTo(-s + 2, 0);
    ctx.lineTo(-s - 7, -5 + tailWag * 15);
    ctx.lineTo(-s - 7, 5 + tailWag * 15);
    ctx.closePath();
    ctx.fill();

    // 背鳍
    ctx.fillStyle = ft.color2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.45);
    ctx.lineTo(s * 0.1, -s * 0.85);
    ctx.lineTo(s * 0.4, -s * 0.45);
    ctx.closePath();
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 0.35, -s * 0.1, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(s * 0.4, -s * 0.1, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
  },

  _drawTropicalFish(ctx, s, tailWag, ft) {
    // 身体（鲜艳黄色）
    ctx.fillStyle = ft.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();

    // 鳞片纹理
    ctx.strokeStyle = 'rgba(255,255,200,0.25)';
    ctx.lineWidth = 0.8;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc(i * s * 0.25, 0, s * 0.3, -0.6, 0.6);
      ctx.stroke();
    }

    // 尾巴
    ctx.fillStyle = ft.color2;
    ctx.beginPath();
    ctx.moveTo(-s + 2, 0);
    ctx.lineTo(-s - 9, -6 + tailWag * 18);
    ctx.lineTo(-s - 9, 6 + tailWag * 18);
    ctx.closePath();
    ctx.fill();

    // 大背鳍
    ctx.fillStyle = ft.color2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.47);
    ctx.lineTo(s * 0.15, -s * 1.0);
    ctx.lineTo(s * 0.5, -s * 0.47);
    ctx.closePath();
    ctx.fill();

    // 腹鳍
    ctx.beginPath();
    ctx.moveTo(0, s * 0.4);
    ctx.lineTo(-s * 0.2, s * 0.75);
    ctx.lineTo(s * 0.25, s * 0.5);
    ctx.closePath();
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 0.4, -s * 0.12, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(s * 0.45, -s * 0.12, s * 0.11, 0, Math.PI * 2);
    ctx.fill();
  },

  _drawPufferfish(ctx, s, tailWag, ft) {
    // 身体（胖球型）
    ctx.fillStyle = ft.color;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // 肚皮（更亮）
    ctx.fillStyle = '#aaff88';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.2, s * 0.5, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 斑点
    ctx.fillStyle = '#66aa33';
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r = s * 0.4;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }

    // 小尾巴
    ctx.fillStyle = ft.color2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.6, 0);
    ctx.lineTo(-s - 5, -3 + tailWag * 10);
    ctx.lineTo(-s - 5, 3 + tailWag * 10);
    ctx.closePath();
    ctx.fill();

    // 背鳍
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.7);
    ctx.lineTo(s * 0.1, -s * 1.1);
    ctx.lineTo(s * 0.3, -s * 0.7);
    ctx.closePath();
    ctx.fill();

    // 大眼睛
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 0.25, -s * 0.25, s * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(s * 0.3, -s * 0.25, s * 0.13, 0, Math.PI * 2);
    ctx.fill();
  },

  _drawTuna(ctx, s, tailWag, ft) {
    // 身体（流线型）
    ctx.fillStyle = ft.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();

    // 深色背部
    ctx.fillStyle = ft.color2;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.1, s * 0.85, s * 0.3, 0, Math.PI, 0);
    ctx.fill();

    // 尾巴（大而有力）
    ctx.fillStyle = ft.color2;
    ctx.beginPath();
    ctx.moveTo(-s + 2, 0);
    ctx.lineTo(-s - 12, -8 + tailWag * 22);
    ctx.lineTo(-s - 12, 8 + tailWag * 22);
    ctx.closePath();
    ctx.fill();

    // 第一背鳍
    ctx.fillStyle = ft.color2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.45);
    ctx.lineTo(s * 0.1, -s * 0.9);
    ctx.lineTo(s * 0.35, -s * 0.45);
    ctx.closePath();
    ctx.fill();

    // 第二背鳍
    ctx.beginPath();
    ctx.moveTo(s * 0.3, -s * 0.4);
    ctx.lineTo(s * 0.5, -s * 0.65);
    ctx.lineTo(s * 0.6, -s * 0.35);
    ctx.closePath();
    ctx.fill();

    // 腹鳍
    ctx.beginPath();
    ctx.moveTo(0, s * 0.4);
    ctx.lineTo(-s * 0.2, s * 0.7);
    ctx.lineTo(s * 0.25, s * 0.45);
    ctx.closePath();
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 0.4, -s * 0.12, s * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(s * 0.44, -s * 0.12, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
  },

  _drawShark(ctx, s, tailWag, ft) {
    // 身体（灰褐色、流线型）
    ctx.fillStyle = ft.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();

    // 腹部（更浅）
    ctx.fillStyle = '#aa8888';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.05, s * 0.7, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 大嘴巴
    ctx.fillStyle = '#442222';
    ctx.beginPath();
    ctx.ellipse(s * 0.45, s * 0.1, s * 0.35, s * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 尖牙
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(s * 0.3 + i * s * 0.1, s * 0.05);
      ctx.lineTo(s * 0.35 + i * s * 0.1, s * 0.2);
      ctx.lineTo(s * 0.4 + i * s * 0.1, s * 0.05);
      ctx.closePath();
      ctx.fill();
    }

    // 背鳍（鲨鱼标志性大鳍）
    ctx.fillStyle = ft.color2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, -s * 0.45);
    ctx.lineTo(s * 0.15, -s * 1.1);
    ctx.lineTo(s * 0.45, -s * 0.45);
    ctx.closePath();
    ctx.fill();

    // 尾巴（叉形）
    ctx.fillStyle = ft.color2;
    ctx.beginPath();
    ctx.moveTo(-s + 2, 0);
    ctx.lineTo(-s - 14, -10 + tailWag * 20);
    ctx.lineTo(-s - 10, 0);
    ctx.lineTo(-s - 14, 10 + tailWag * 20);
    ctx.closePath();
    ctx.fill();

    // 胸鳍
    ctx.beginPath();
    ctx.moveTo(0, s * 0.35);
    ctx.lineTo(-s * 0.3, s * 0.75);
    ctx.lineTo(s * 0.2, s * 0.45);
    ctx.closePath();
    ctx.fill();

    // 凶恶眼睛
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(s * 0.25, -s * 0.25, s * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(s * 0.3, -s * 0.25, s * 0.09, 0, Math.PI * 2);
    ctx.fill();

    // 鳃裂
    ctx.strokeStyle = '#554444';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(s * 0.2 - i * s * 0.05, -s * 0.2);
      ctx.lineTo(s * 0.15 - i * s * 0.05, s * 0.15);
      ctx.stroke();
    }
  },

  _drawJellyfish(ctx, s, tailWag, ft, fish) {
    // 半透明伞状体
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = ft.color;
    ctx.beginPath();
    ctx.arc(0, 0, s, Math.PI, 0);
    ctx.quadraticCurveTo(s, s * 0.3, 0, s * 0.4);
    ctx.quadraticCurveTo(-s, s * 0.3, -s, 0);
    ctx.fill();

    // 伞体高光
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -s * 0.3, s * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // 触须（波浪状）
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = ft.color2;
    ctx.lineWidth = 1.2;
    const time = fish ? fish.patternTimer || 0 : 0;
    for (let i = 0; i < 5; i++) {
      const tx = -s * 0.6 + i * s * 0.3;
      ctx.beginPath();
      ctx.moveTo(tx, s * 0.3);
      const tentLen = s * 0.8 + Math.sin(time * 2 + i) * s * 0.3;
      ctx.quadraticCurveTo(
        tx + Math.sin(time * 3 + i * 1.5) * s * 0.3,
        s * 0.3 + tentLen * 0.5,
        tx + Math.sin(time * 2.5 + i) * s * 0.2,
        s * 0.3 + tentLen
      );
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  },

  _drawSwordfish(ctx, s, tailWag, ft) {
    // 流线型身体
    ctx.fillStyle = ft.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.85, s * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // 深色背部
    ctx.fillStyle = ft.color2;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.08, s * 0.75, s * 0.2, 0, Math.PI, 0);
    ctx.fill();

    // 尖吻/剑
    ctx.fillStyle = '#6699bb';
    ctx.beginPath();
    ctx.moveTo(s * 0.85, 0);
    ctx.lineTo(s * 1.5, -1);
    ctx.lineTo(s * 1.5, 1);
    ctx.closePath();
    ctx.fill();

    // 背鳍
    ctx.fillStyle = ft.color2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.3);
    ctx.lineTo(s * 0.1, -s * 0.7);
    ctx.lineTo(s * 0.35, -s * 0.3);
    ctx.closePath();
    ctx.fill();

    // 尾巴
    ctx.fillStyle = ft.color2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.85, 0);
    ctx.lineTo(-s * 1.3, -8 + tailWag * 20);
    ctx.lineTo(-s * 1.3, 8 + tailWag * 20);
    ctx.closePath();
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 0.45, -s * 0.08, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(s * 0.48, -s * 0.08, s * 0.06, 0, Math.PI * 2);
    ctx.fill();
  },

  _drawLanternfish(ctx, s, tailWag, ft, fish) {
    // 圆身体
    ctx.fillStyle = ft.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // 深色背部
    ctx.fillStyle = ft.color2;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.1, s * 0.8, s * 0.3, 0, Math.PI, 0);
    ctx.fill();

    // 头部发光灯笼
    const time = fish ? fish.patternTimer || 0 : 0;
    const glowPulse = 0.5 + Math.sin(time * 4) * 0.3;
    ctx.save();
    ctx.globalAlpha = glowPulse;
    ctx.fillStyle = '#ffff88';
    ctx.shadowColor = '#ffdd44';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(s * 0.7, -s * 0.3, s * 0.25, 0, Math.PI * 2);
    ctx.fill();
    // 灯笼触须
    ctx.strokeStyle = '#ffdd44';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s * 0.5, -s * 0.15);
    ctx.quadraticCurveTo(s * 0.65, -s * 0.5, s * 0.7, -s * 0.3);
    ctx.stroke();
    ctx.restore();

    // 灯笼光晕
    ctx.save();
    ctx.globalAlpha = 0.15 + Math.sin(time * 4) * 0.1;
    const lg = ctx.createRadialGradient(s * 0.7, -s * 0.3, 0, s * 0.7, -s * 0.3, s * 1.5);
    lg.addColorStop(0, 'rgba(255, 221, 68, 0.4)');
    lg.addColorStop(1, 'rgba(255, 221, 68, 0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(s * 0.7, -s * 0.3, s * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 小尾巴
    ctx.fillStyle = ft.color2;
    ctx.beginPath();
    ctx.moveTo(-s + 2, 0);
    ctx.lineTo(-s - 5, -3 + tailWag * 10);
    ctx.lineTo(-s - 5, 3 + tailWag * 10);
    ctx.closePath();
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 0.3, -s * 0.1, s * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(s * 0.34, -s * 0.1, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
  },

  _drawGoldenKoi(ctx, s, tailWag, ft, fish) {
    const time = fish ? fish.patternTimer || 0 : 0;

    // 金色鲤鱼身体
    ctx.fillStyle = ft.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 鳞片闪光效果
    ctx.fillStyle = '#fff8dc';
    for (let i = 0; i < 8; i++) {
      const sx = -s * 0.6 + i * s * 0.18;
      const sy = Math.sin(i * 0.8) * s * 0.15;
      const sparkle = Math.sin(time * 5 + i * 1.2) * 0.5 + 0.5;
      ctx.globalAlpha = sparkle * 0.6;
      ctx.beginPath();
      ctx.arc(sx, sy, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 深色背部
    ctx.fillStyle = ft.color2;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.1, s * 0.85, s * 0.25, 0, Math.PI, 0);
    ctx.fill();

    // 大尾巴（锦鲤特征）
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.moveTo(-s + 2, 0);
    ctx.quadraticCurveTo(-s - 8, -s * 0.5 + tailWag * 20, -s - 14, -s * 0.3 + tailWag * 25);
    ctx.lineTo(-s - 8, 0);
    ctx.lineTo(-s - 14, s * 0.3 + tailWag * 25);
    ctx.quadraticCurveTo(-s - 8, s * 0.5 + tailWag * 20, -s + 2, 0);
    ctx.fill();

    // 背鳍
    ctx.fillStyle = ft.color2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.45);
    ctx.lineTo(s * 0.15, -s * 0.8);
    ctx.lineTo(s * 0.4, -s * 0.45);
    ctx.closePath();
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 0.4, -s * 0.1, s * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.arc(s * 0.44, -s * 0.1, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
  },

  _drawGhostShark(ctx, s, tailWag, ft, fish) {
    const time = fish ? fish.patternTimer || 0 : 0;

    // 半透明鲨鱼身体
    ctx.globalAlpha = 0.4 + Math.sin(time * 2) * 0.1;
    ctx.fillStyle = ft.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();

    // 幽灵光效
    ctx.save();
    ctx.globalAlpha = 0.2 + Math.sin(time * 3) * 0.1;
    const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 1.5);
    gg.addColorStop(0, 'rgba(136, 204, 255, 0.3)');
    gg.addColorStop(1, 'rgba(136, 204, 255, 0)');
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.arc(0, 0, s * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 腹部
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = 'rgba(200, 220, 240, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.05, s * 0.7, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 背鳍
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = 'rgba(100, 140, 160, 0.5)';
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, -s * 0.45);
    ctx.lineTo(s * 0.15, -s * 1.1);
    ctx.lineTo(s * 0.45, -s * 0.45);
    ctx.closePath();
    ctx.fill();

    // 尾巴（叉形）
    ctx.fillStyle = 'rgba(100, 140, 160, 0.4)';
    ctx.beginPath();
    ctx.moveTo(-s + 2, 0);
    ctx.lineTo(-s - 14, -10 + tailWag * 20);
    ctx.lineTo(-s - 10, 0);
    ctx.lineTo(-s - 14, 10 + tailWag * 20);
    ctx.closePath();
    ctx.fill();

    // 幽灵眼睛（发光）
    ctx.globalAlpha = 0.7 + Math.sin(time * 4) * 0.3;
    ctx.fillStyle = '#88ccff';
    ctx.shadowColor = '#88ccff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(s * 0.25, -s * 0.2, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.globalAlpha = 1;
  },

  // ============================================================
  // 渲染投射物
  // ============================================================
  _renderProjectiles(ctx) {
    this.projectiles.forEach(p => {
      ctx.save();

      if (p.weapon === 'harpoon') {
        // 鱼叉：加长的射弹
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        const angle = Math.atan2(p.vy, p.vx);
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillRect(-4, -2, 12, 4);
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(14, -3);
        ctx.lineTo(14, 3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (p.weapon === 'torpedo') {
        // 鱼雷：大发光球体+尾焰
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        // 尾焰
        ctx.fillStyle = '#ffaa44';
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(p.x - 10, p.y, p.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    });
  },

  // ============================================================
  // 渲染玩家（潜艇）
  // ============================================================
  _renderPlayer(ctx) {
    const px = this.player.x;
    const py = this.player.y;

    ctx.save();

    // 探照灯光锥
    ctx.save();
    const lightAngle = this.player.angle;
    const lightLen = Math.min(this.W, this.H) * 0.3;
    const lightW = lightLen * 0.15;
    ctx.translate(px, py);
    ctx.rotate(lightAngle);
    const lg = ctx.createRadialGradient(0, 0, 5, lightLen * 0.6, 0, lightLen);
    lg.addColorStop(0, 'rgba(200, 220, 255, 0.15)');
    lg.addColorStop(0.6, 'rgba(200, 220, 255, 0.04)');
    lg.addColorStop(1, 'rgba(200, 220, 255, 0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(lightLen, -lightW);
    ctx.lineTo(lightLen, lightW);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 角色偏移动画
    const bob = Math.sin(this.waveTime * 2) * 1.5;

    ctx.translate(px, py + bob);

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(3, 3, 22, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // 旋转至武器方向（面朝上偏右=默认）
    ctx.rotate(this.player.angle + Math.PI / 2);

    // 潜艇主体
    ctx.fillStyle = '#3a5a7a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // 主体高光
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.ellipse(-4, -4, 12, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 指挥塔
    ctx.fillStyle = '#4a6a8a';
    ctx.beginPath();
    ctx.ellipse(0, -10, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // 指挥塔窗户
    ctx.fillStyle = 'rgba(100, 200, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, -12, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 潜望镜
    ctx.fillStyle = '#6a8aaa';
    ctx.fillRect(-2, -24, 4, 10);
    ctx.fillRect(-5, -26, 10, 4);

    // 尾翼
    ctx.fillStyle = '#2a4a6a';
    ctx.beginPath();
    ctx.moveTo(0, 26);
    ctx.lineTo(-14, 36);
    ctx.lineTo(14, 36);
    ctx.closePath();
    ctx.fill();

    // 螺旋桨（旋转）
    ctx.save();
    ctx.translate(0, 36);
    const propAngle = Date.now() * 0.015;
    ctx.rotate(propAngle);
    ctx.fillStyle = '#8a9aaa';
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  },

  // ============================================================
  // 渲染浮动文字
  // ============================================================
  _renderFloatingTexts(ctx) {
    this.floatingTexts.forEach(ft => {
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      Canvas.drawGlowText(ctx, ft.text, ft.x, ft.y, ft.color, Math.max(16, this.H * 0.022), ft.color);
      ctx.restore();
    });
  },

  // ============================================================
  // 渲染UI
  // ============================================================
  _renderUI(ctx) {
    const W = this.W;
    const H = this.H;

    // === 顶部信息栏（玻璃面板） ===
    Canvas.drawGlassPanel(ctx, W * 0.01, H * 0.01, W * 0.98, H * 0.06, {
      bgColor: 'rgba(0, 10, 30, 0.65)',
      borderColor: 'rgba(100, 200, 255, 0.25)',
      radius: 10
    });

    // 分数
    Canvas.drawGlowText(ctx, '得分: ' + this.score, W * 0.06, H * 0.052, '#ffd700', Math.max(18, H * 0.026), '#ffd700');

    // 海币
    Canvas.drawGlowText(ctx, '海币: ' + this.coins, W * 0.22, H * 0.052, '#44ddff', Math.max(16, H * 0.022), '#44ddff');

    // 时间
    const timeColor = this.timeLeft <= 10 ? (Math.floor(Date.now() * 0.01) % 2 === 0 ? '#ff4444' : '#ff8888') : '#ffffff';
    Canvas.drawGlowText(ctx, this.timeLeft + 's', W / 2, H * 0.052, timeColor, Math.max(22, H * 0.03), timeColor);

    // AI图标
    Canvas.drawIcon(ctx, W * 0.015 + 12, H * 0.04, 14, 'fish', '#44aaff');

    // === 连击文字 ===
    if (this.combo > 1) {
      const comboColor = this.frenzyMode ? '#ff4444' : (this.combo >= 20 ? '#ffaa00' : '#ffdd44');
      ctx.save();
      Canvas.drawGlowText(ctx, this.combo + ' 连击! x' + this.comboMultiplier, W / 2, H * 0.12, comboColor, Math.max(22, H * 0.034), comboColor);
      if (this.frenzyMode) {
        Canvas.drawGlowText(ctx, '狂暴模式', W / 2, H * 0.155, '#ff4444', Math.max(16, H * 0.022), '#ff4444');
      }
      ctx.restore();
    }

    // === 底部武器栏（玻璃面板） ===
    const weaponBarW = Math.min(400, W * 0.45);
    const weaponBarH = H * 0.05;
    const weaponBarX = (W - weaponBarW) / 2;
    const weaponBarY = H * 0.925;

    Canvas.drawGlassPanel(ctx, weaponBarX, weaponBarY, weaponBarW, weaponBarH, {
      bgColor: 'rgba(0, 10, 30, 0.7)',
      borderColor: 'rgba(100, 200, 255, 0.2)',
      radius: 8
    });

    const weapons = [
      { key: 'harpoon', name: '1.鱼叉', color: '#88ccff', ammo: this.ammo.harpoon },
      { key: 'torpedo', name: '2.鱼雷', color: '#ff6644', ammo: this.ammo.torpedo },
      { key: 'sonar', name: '3.声纳', color: '#44ffaa', ammo: this.ammo.sonar }
    ];

    const weaponSpacing = weaponBarW / weapons.length;
    weapons.forEach((w, i) => {
      const isActive = this.currentWeapon === w.key;
      const wx = weaponBarX + weaponSpacing * i + weaponSpacing * 0.5;

      ctx.save();
      if (isActive) {
        ctx.shadowColor = w.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = w.color;
        ctx.font = 'bold ' + Math.max(12, H * 0.02) + 'px Arial';
      } else {
        ctx.fillStyle = '#8899aa';
        ctx.font = Math.max(12, H * 0.02) + 'px Arial';
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const ammoText = w.ammo === Infinity ? '\u221E' : w.ammo;
      ctx.fillText(w.name + ': ' + ammoText, wx, weaponBarY + weaponBarH * 0.5);

      if (isActive) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = w.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(weaponBarX + weaponSpacing * i + 3, weaponBarY + 2, weaponSpacing - 6, weaponBarH - 4);
      }
      ctx.restore();
    });

    // === 左侧技能栏（玻璃面板） ===
    const skills = [
      { key: 'freeze', name: 'Q.冰冻', color: '#44ccff' },
      { key: 'bomb', name: 'W.炸弹', color: '#ff6644' },
      { key: 'speed', name: 'E.加速', color: '#44ff44' }
    ];

    const skillBoxW = Math.min(100, W * 0.12);
    const skillBoxH = H * 0.042;
    const skillStartY = H * 0.2;

    skills.forEach((s, i) => {
      const sy = skillStartY + i * (skillBoxH + H * 0.012);
      const ready = this.skills[s.key] > 0 && this.skillCooldowns[s.key] <= 0;

      Canvas.drawGlassPanel(ctx, W * 0.01, sy, skillBoxW, skillBoxH, {
        bgColor: ready ? 'rgba(0, 10, 30, 0.6)' : 'rgba(0, 0, 0, 0.4)',
        borderColor: ready ? s.color : 'rgba(255,255,255,0.1)',
        radius: 6
      });

      // 冷却遮罩
      if (this.skillCooldowns[s.key] > 0) {
        const cdRatio = this.skillCooldowns[s.key] / this.SKILL_CONFIG[s.key].cooldown;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(W * 0.01 + 1, sy + 1, skillBoxW - 2, skillBoxH * cdRatio - 2);
      }

      ctx.save();
      ctx.fillStyle = ready ? s.color : '#556677';
      ctx.font = (ready ? 'bold ' : '') + Math.max(11, H * 0.016) + 'px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.name, W * 0.02, sy + skillBoxH * 0.5);
      ctx.restore();
    });

    // === 冻结指示 ===
    if (this.effects.frozen) {
      Canvas.drawGlowText(ctx, '冰冻 ' + this.effects.frozenTimer.toFixed(1) + 's', W / 2, H * 0.5, '#44ccff', Math.max(20, H * 0.032), '#44ccff');
    }

    // === 加速指示 ===
    if (this.effects.speedBoost) {
      ctx.save();
      ctx.fillStyle = 'rgba(68, 255, 68, 0.08)';
      ctx.fillRect(0, 0, W, H);
      Canvas.drawGlowText(ctx, '加速 ' + this.effects.speedTimer.toFixed(1) + 's', W * 0.15, H * 0.16, '#44ff44', Math.max(14, H * 0.02), '#44ff44');
      ctx.restore();
    }

    // === 狂暴模式指示 ===
    if (this.frenzyMode) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 68, 68, 0.06)';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // === 操作提示 ===
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = Math.max(9, H * 0.013) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('鼠标移动 | 左键射击 | 滚轮切换武器 | 1/2/3切换 | Q/W/E技能 | ESC退出', W / 2, H * 0.985);
    ctx.restore();
  },

  // ============================================================
  // 渲染结果面板（玻璃面板）
  // ============================================================
  _renderResultScreen(ctx) {
    const W = this.W;
    const H = this.H;

    ctx.save();

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, W, H);

    // 主面板
    const panelW = Math.min(380, W * 0.55);
    const panelH = Math.min(400, H * 0.55);
    const panelX = (W - panelW) / 2;
    const panelY = (H - panelH) / 2;

    Canvas.drawGlassPanel(ctx, panelX, panelY, panelW, panelH, {
      bgColor: 'rgba(0, 15, 40, 0.8)',
      borderColor: 'rgba(100, 200, 255, 0.4)',
      radius: 16,
      glow: true
    });

    const cx = W / 2;
    let ry = panelY + panelH * 0.1;

    // 标题
    Canvas.drawGlowText(ctx, '捕鱼结束!', cx, ry, '#ffd700', Math.max(28, H * 0.042), '#ffd700');
    ry += panelH * 0.14;

    // 得分
    Canvas.drawGlowText(ctx, '总得分: ' + this.score, cx, ry, '#44aaff', Math.max(22, H * 0.032), '#44aaff');
    ry += panelH * 0.1;

    // 海币
    Canvas.drawGlowText(ctx, '海币: ' + this.coins, cx, ry, '#44ddff', Math.max(18, H * 0.026), '#44ddff');
    ry += panelH * 0.1;

    // 捕获数量
    Canvas.drawGlowText(ctx, '捕获鱼类: ' + (this._result.fishCaught || 0) + ' 条', cx, ry, '#ffffff', Math.max(16, H * 0.024), '#ffffff');
    ry += panelH * 0.08;

    // 鱼种明细
    ctx.save();
    ctx.font = Math.max(13, H * 0.019) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const types = this._result.fishTypes || {};
    const typeNames = Object.keys(types);
    if (typeNames.length > 0) {
      typeNames.slice(0, 6).forEach(name => {
        ctx.fillStyle = '#aaccdd';
        ctx.fillText(name + ': ' + types[name] + ' 条', cx, ry);
        ry += panelH * 0.055;
      });
    } else {
      ctx.fillStyle = '#8899aa';
      ctx.fillText('未捕获任何鱼', cx, ry);
      ry += panelH * 0.055;
    }
    ctx.restore();

    // 提示
    const hintY = panelY + panelH * 0.88;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + Math.sin(Date.now() * 0.004) * 0.15) + ')';
    ctx.font = Math.max(13, H * 0.018) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('点击任意位置或按 ESC 返回', cx, hintY);
    ctx.restore();

    ctx.restore();
  }
};

// 暴露到全局
window.FishingGameV2 = FishingGameV2;

console.log('[FishingGameV2] 模块已加载');

})();