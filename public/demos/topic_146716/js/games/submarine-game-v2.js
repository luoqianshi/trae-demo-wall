/**
 * ============================================================
 * SubmarineGameV2 — 潜艇探险游戏 v2
 * 完全独立模块，不依赖 window.AudioSystem / window.exit2DGame
 * 依赖: window.MiniGameCore (VFX / Audio / Canvas / ScreenShake)
 *
 * 对外接口:
 *   SubmarineGameV2.init(canvas)
 *   SubmarineGameV2.start()
 *   SubmarineGameV2.stop()
 *   SubmarineGameV2.getResult() -> { score, level, enemiesKilled }
 *
 * 关卡: 浅海 → 深海 → 海底洞穴 → 深渊海沟 → 病毒源头（Boss战）
 * 敌人: 变异水母(浮动) / 巨型章鱼(追踪) / 装甲蟹(冲撞) / 深渊鲨鱼(追踪+冲撞)
 * Boss : 3阶段 — 散射 / 追踪弹 / 召唤小怪
 * ============================================================
 */
;(function() {
'use strict';

// ============================================================
// 确保 MiniGameCore 存在
// ============================================================
const Core = window.MiniGameCore;
if (!Core) {
  console.error('[SubmarineGameV2] 缺少依赖: window.MiniGameCore');
  return;
}

const VFX   = Core.VFX;
const Audio = Core.Audio;
const Cv    = Core.Canvas;
const Shake = Core.ScreenShake;

// ============================================================
// 常量 / 配置
// ============================================================
const W = 800;  // 逻辑宽
const H = 600;  // 逻辑高
const PI2 = Math.PI * 2;

const ENEMY_TYPES = [
  { id: 'jellyfish',  name: '变异水母',  color: '#ff44aa', size: 14, hp: 20,  speed: 50,  damage: 6,  score: 10, pattern: 'float'  },
  { id: 'octopus',    name: '巨型章鱼',  color: '#8844cc', size: 24, hp: 55,  speed: 40,  damage: 14, score: 30, pattern: 'chase'  },
  { id: 'armoredcrab',name: '装甲蟹',    color: '#cc8844', size: 20, hp: 45,  speed: 70,  damage: 10, score: 20, pattern: 'charge' },
  { id: 'shark',      name: '深渊鲨鱼',  color: '#cc4444', size: 32, hp: 90,  speed: 75,  damage: 18, score: 50, pattern: 'hunt'   }
];

const LEVELS = [
  {
    name: '浅海区域', desc: '变异水母出没',
    bgTop: '#001f3f', bgBot: '#004080',
    enemyTypes: ['jellyfish'],
    killTarget: 10,
    spawnInterval: 2.0,
    maxEnemies: 6
  },
  {
    name: '中层深海', desc: '章鱼群现身',
    bgTop: '#001a33', bgBot: '#003366',
    enemyTypes: ['jellyfish', 'octopus'],
    killTarget: 14,
    spawnInterval: 1.6,
    maxEnemies: 8
  },
  {
    name: '海底洞穴', desc: '装甲蟹巡逻',
    bgTop: '#000a1a', bgBot: '#001a33',
    enemyTypes: ['octopus', 'armoredcrab'],
    killTarget: 16,
    spawnInterval: 1.4,
    maxEnemies: 9
  },
  {
    name: '深渊海沟', desc: '鲨鱼出没！',
    bgTop: '#000511', bgBot: '#001122',
    enemyTypes: ['armoredcrab', 'shark'],
    killTarget: 18,
    spawnInterval: 1.2,
    maxEnemies: 10
  },
  {
    name: '病毒源头', desc: 'BOSS战',
    bgTop: '#0a0008', bgBot: '#1a0011',
    enemyTypes: ['jellyfish'],
    killTarget: 1,
    spawnInterval: 99,
    maxEnemies: 0,
    isBoss: true
  }
];

// ============================================================
// 游戏状态
// ============================================================
let G = {};

function resetState() {
  G = {
    // 核心状态
    active: false,
    canvas: null,
    ctx: null,
    animId: null,
    lastTime: 0,
    phase: 'playing',        // playing | levelUp | gameover | victory
    level: 0,                // 0-index
    score: 0,
    enemiesKilled: 0,
    totalKills: 0,
    gameOverReason: '',

    // 输入
    keys: {},
    mouseX: W / 2,
    mouseY: H / 2,
    mouseDown: false,

    // 玩家
    player: {
      x: W / 2, y: H - 100,
      angle: -Math.PI / 2,
      hp: 100, maxHp: 100,
      speed: 200,
      fireRate: 0.28,
      fireTimer: 0,
      weaponLevel: 1,          // 1-3
      shield: 50, maxShield: 50,
      shieldRechargeDelay: 1.5,
      shieldRechargeTimer: 0,
      invincible: 0,           // 受伤后无敌秒数
      thrusterTimer: 0
    },

    // 对象池
    bullets: [],
    enemyBullets: [],
    enemies: [],
    allies: [],
    floatingTexts: [],

    // 辅助潜艇
    allyCount: 0,

    // 生成
    spawnTimer: 0,
    killCount: 0,             // 当前关卡击杀

    // BOSS
    boss: null,
    bossWarningTimer: 0,

    // 过渡
    transitionTimer: 0,
    transitionText: '',

    // 背景
    lightBeams: [],
    bgBubbles: [],
    bgTime: 0,

    // 连击
    comboCount: 0,
    comboTimer: 0
  };
}

// ============================================================
// 工具函数
// ============================================================
function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function angleTo(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ============================================================
// 初始化
// ============================================================
function init(canvas) {
  if (!canvas || !canvas.getContext) {
    console.error('[SubmarineGameV2] 无效 Canvas 元素');
    return;
  }
  resetState();

  G.canvas = canvas;
  G.ctx = canvas.getContext('2d');

  // 设置 canvas 尺寸（保持比例）
  const parent = canvas.parentElement;
  if (parent) {
    canvas.width  = parent.clientWidth  || W;
    canvas.height = parent.clientHeight || H;
  } else {
    canvas.width  = W;
    canvas.height = H;
  }

  // 输入
  onInitInput();

  // 背景装饰
  initBackground();

  console.log('[SubmarineGameV2] 初始化完成');
}

function initBackground() {
  G.lightBeams = [];
  for (let i = 0; i < 6; i++) {
    G.lightBeams.push({
      x: rand(0, W),
      speed: rand(8, 20),
      width: rand(20, 60),
      alpha: rand(0.03, 0.08),
      sway: rand(0, PI2),
      swaySpeed: rand(0.3, 0.8)
    });
  }
  G.bgBubbles = [];
  for (let i = 0; i < 20; i++) {
    G.bgBubbles.push(createBgBubble());
  }
}

function createBgBubble() {
  return {
    x: rand(0, W),
    y: rand(0, H),
    size: rand(2, 6),
    speed: rand(10, 30),
    wobble: rand(0, PI2),
    wobbleSpeed: rand(1, 3),
    alpha: rand(0.1, 0.3)
  };
}

// ============================================================
// 输入管理
// ============================================================
function onInitInput() {
  const c = G.canvas;

  const keydown = e => { G.keys[e.key] = true; };
  const keyup   = e => { G.keys[e.key] = false; };

  const mousemove = e => {
    const rect = c.getBoundingClientRect();
    G.mouseX = (e.clientX - rect.left) * (c.width / rect.width);
    G.mouseY = (e.clientY - rect.top)  * (c.height / rect.height);
  };

  const mousedown = e => {
    G.mouseDown = true;
    if (e.button === 0) e.preventDefault();
  };

  const mouseup = e => {
    G.mouseDown = false;
  };

  const contextmenu = e => e.preventDefault();

  c.addEventListener('keydown', keydown);
  c.addEventListener('keyup', keyup);
  c.addEventListener('mousemove', mousemove);
  c.addEventListener('mousedown', mousedown);
  c.addEventListener('mouseup', mouseup);
  c.addEventListener('contextmenu', contextmenu);
  c.setAttribute('tabindex', '0');

  // 清理
  G._cleanupInput = function() {
    c.removeEventListener('keydown', keydown);
    c.removeEventListener('keyup', keyup);
    c.removeEventListener('mousemove', mousemove);
    c.removeEventListener('mousedown', mousedown);
    c.removeEventListener('mouseup', mouseup);
    c.removeEventListener('contextmenu', contextmenu);
  };
}

// ============================================================
// 核心循环
// ============================================================
function start() {
  if (G.active) return;
  if (!G.canvas || !G.ctx) {
    console.error('[SubmarineGameV2] 请先调用 init(canvas)');
    return;
  }
  G.active = true;
  G.lastTime = performance.now();
  VFX.clearParticles();
  loop(G.lastTime);
  console.log('[SubmarineGameV2] 游戏开始');
}

function stop() {
  G.active = false;
  if (G.animId) {
    cancelAnimationFrame(G.animId);
    G.animId = null;
  }
  if (G._cleanupInput) {
    G._cleanupInput();
    G._cleanupInput = null;
  }
  VFX.clearParticles();
  G.keys = {};
  G.mouseDown = false;
}

function getResult() {
  return {
    score: G.score,
    level: G.level + 1,
    enemiesKilled: G.enemiesKilled
  };
}

function loop(timestamp) {
  if (!G.active) return;
  const dt = Math.min((timestamp - G.lastTime) / 1000, 0.05);
  G.lastTime = timestamp;

  update(dt);
  render();

  G.animId = requestAnimationFrame(loop);
}

// ============================================================
// UPDATE
// ============================================================
function update(dt) {
  const { player, boss } = G;

  // 过渡中不更新游戏逻辑
  if (G.phase === 'levelUp') {
    G.transitionTimer -= dt;
    if (G.transitionTimer <= 0) {
      enterLevel(G.level + 1);
    }
    // 粒子继续更新
    VFX.updateParticles(dt);
    return;
  }
  if (G.phase === 'gameover' || G.phase === 'victory') {
    VFX.updateParticles(dt);
    return;
  }

  G.bgTime += dt;

  // ---- 背景气泡 ----
  updateBgBubbles(dt);

  // ---- 连击 ----
  if (G.comboTimer > 0) {
    G.comboTimer -= dt;
    if (G.comboTimer <= 0) G.comboCount = 0;
  }

  // ---- 玩家 ----
  updatePlayer(dt);

  // ---- 辅助潜艇 ----
  updateAllies(dt);

  // ---- 子弹 ----
  updateBullets(dt);

  // ---- 敌人 ----
  updateEnemies(dt);

  // ---- 敌人子弹 ----
  updateEnemyBullets(dt);

  // ---- BOSS ----
  if (boss) {
    updateBoss(dt);
    if (boss.hp <= 0) {
      onBossDefeated();
    }
  }

  // ---- 碰撞 ----
  checkCollisions();

  // ---- 生成敌人 ----
  if (!G.boss) {
    updateSpawning(dt);
  }

  // ---- 关卡进度 ----
  checkLevelProgress();

  // ---- 粒子 ----
  VFX.updateParticles(dt);

  // ---- 屏幕震动 ----
  Shake.update(dt);

  // ---- 浮动文字 ----
  updateFloatingTexts(dt);
}

// ============================================================
// 背景气泡
// ============================================================
function updateBgBubbles(dt) {
  G.bgBubbles.forEach(b => {
    b.y -= b.speed * dt;
    b.wobble += b.wobbleSpeed * dt;
    b.x += Math.sin(b.wobble) * 15 * dt;
    if (b.y < -10) {
      b.y = H + 10;
      b.x = rand(0, W);
    }
  });
}

// ============================================================
// 玩家
// ============================================================
function updatePlayer(dt) {
  const p = G.player;

  // ---- 移动 ----
  let dx = 0, dy = 0;
  if (G.keys['w'] || G.keys['W'] || G.keys['ArrowUp'])    dy = -1;
  if (G.keys['s'] || G.keys['S'] || G.keys['ArrowDown'])  dy = 1;
  if (G.keys['a'] || G.keys['A'] || G.keys['ArrowLeft'])  dx = -1;
  if (G.keys['d'] || G.keys['D'] || G.keys['ArrowRight']) dx = 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len; dy /= len;
    p.x += dx * p.speed * dt;
    p.y += dy * p.speed * dt;

    // 推进器火焰
    p.thrusterTimer += dt;
    if (p.thrusterTimer > 0.05) {
      p.thrusterTimer = 0;
      const backX = p.x - Math.cos(p.angle) * 22;
      const backY = p.y - Math.sin(p.angle) * 22;
      VFX.createTrail(G.ctx, backX, backY, '#ff8844', 2);
      VFX.createTrail(G.ctx, backX, backY, '#ffcc44', 1);
    }
  }

  // 边界
  p.x = clamp(p.x, 25, (G.canvas.width || W) - 25);
  p.y = clamp(p.y, 25, (G.canvas.height || H) - 25);

  // ---- 朝向鼠标 ----
  p.angle = angleTo(p, { x: G.mouseX, y: G.mouseY });

  // ---- 射击 ----
  p.fireTimer -= dt;
  const shooting = G.mouseDown || G.keys[' '];
  if (shooting && p.fireTimer <= 0) {
    firePlayerBullet();
    p.fireTimer = p.fireRate;
  }

  // ---- 护盾回复 ----
  if (p.shield < p.maxShield) {
    p.shieldRechargeTimer -= dt;
    if (p.shieldRechargeTimer <= 0) {
      p.shield = Math.min(p.maxShield, p.shield + 8 * dt);
    }
  }

  // ---- 无敌 ----
  if (p.invincible > 0) p.invincible -= dt;
}

function firePlayerBullet() {
  const p = G.player;
  const lv = p.weaponLevel;
  const cx = G.canvas.width || W;
  const cy = G.canvas.height || H;
  const spd = 500;
  const a = p.angle;

  Audio.playShoot();

  if (lv === 1) {
    // 单发
    G.bullets.push(makeBullet(p.x, p.y, a, spd, 12));
  } else if (lv === 2) {
    // 双发
    const off = 0.12;
    G.bullets.push(makeBullet(p.x, p.y, a - off, spd, 14));
    G.bullets.push(makeBullet(p.x, p.y, a + off, spd, 14));
  } else {
    // 三发散射
    G.bullets.push(makeBullet(p.x, p.y, a, spd, 16));
    G.bullets.push(makeBullet(p.x, p.y, a - 0.2, spd * 0.9, 12));
    G.bullets.push(makeBullet(p.x, p.y, a + 0.2, spd * 0.9, 12));
    // 第五发特殊弹
    G.bullets.push(makeBullet(p.x, p.y, a - 0.35, spd * 0.7, 10, '#44ddff'));
    G.bullets.push(makeBullet(p.x, p.y, a + 0.35, spd * 0.7, 10, '#44ddff'));
  }
}

function makeBullet(x, y, angle, speed, damage, color) {
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    damage: damage,
    radius: 4,
    color: color || '#66ddff',
    life: 2.0,
    trailTimer: 0
  };
}

// ============================================================
// 辅助潜艇（友军AI）
// ============================================================
function updateAllies(dt) {
  const p = G.player;
  for (let i = G.allies.length - 1; i >= 0; i--) {
    const ally = G.allies[i];
    if (ally.hp <= 0) {
      // 辅助艇被摧毁
      VFX.createExplosion(G.ctx, ally.x, ally.y, { color: '#ff6644', count: 25 });
      G.allies.splice(i, 1);
      continue;
    }

    // 跟随玩家
    const targetDist = 80 + i * 30;
    const d = dist(ally, p);
    const a = angleTo(ally, p);

    if (d > targetDist + 20) {
      ally.x += Math.cos(a) * ally.speed * dt;
      ally.y += Math.sin(a) * ally.speed * dt;
    } else if (d < targetDist - 20) {
      ally.x -= Math.cos(a) * ally.speed * 0.5 * dt;
      ally.y -= Math.sin(a) * ally.speed * 0.5 * dt;
    }

    // 自动攻击最近敌人
    ally.fireTimer -= dt;
    const target = findNearestEnemy(ally);
    if (target && ally.fireTimer <= 0) {
      const ta = angleTo(ally, target);
      G.bullets.push(makeBullet(ally.x, ally.y, ta, 400, 8, '#88ff88'));
      ally.fireTimer = ally.fireRate;
    }
  }
}

function findNearestEnemy(from) {
  let best = null, bestD = Infinity;
  G.enemies.forEach(e => {
    const d = dist(from, e);
    if (d < bestD) { bestD = d; best = e; }
  });
  // 也检查BOSS
  if (G.boss) {
    const d = dist(from, G.boss);
    if (d < bestD) { bestD = d; best = G.boss; }
  }
  return best;
}

// ============================================================
// 子弹
// ============================================================
function updateBullets(dt) {
  const cx = G.canvas.width || W;
  const cy = G.canvas.height || H;
  for (let i = G.bullets.length - 1; i >= 0; i--) {
    const b = G.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;

    // 拖尾
    b.trailTimer -= dt;
    if (b.trailTimer <= 0) {
      b.trailTimer = 0.03;
      VFX.createTrail(G.ctx, b.x, b.y, b.color, 1);
    }

    if (b.life <= 0 || b.x < -20 || b.x > cx + 20 || b.y < -20 || b.y > cy + 20) {
      G.bullets.splice(i, 1);
    }
  }
}

// ============================================================
// 敌人
// ============================================================
function spawnEnemy(typeId) {
  const def = ENEMY_TYPES.find(t => t.id === typeId);
  if (!def) return;

  const cx = G.canvas.width || W;
  const cy = G.canvas.height || H;
  const side = randInt(0, 3);
  let x, y;
  if (side === 0) { x = rand(20, cx - 20); y = -30; }          // 上
  else if (side === 1) { x = cx + 30; y = rand(20, cy * 0.5); } // 右
  else if (side === 2) { x = rand(20, cx - 20); y = cy + 30; }  // 下
  else { x = -30; y = rand(20, cy * 0.5); }                      // 左

  const lvMult = 1 + G.level * 0.2;
  const enemy = {
    x, y,
    type: def.id,
    name: def.name,
    color: def.color,
    size: def.size,
    hp: Math.round(def.hp * lvMult),
    maxHp: Math.round(def.hp * lvMult),
    speed: def.speed + G.level * 5,
    damage: Math.round(def.damage * lvMult),
    score: def.score,
    pattern: def.pattern,
    angle: 0,
    // 各种模式状态
    timer: 0,
    chargeCooldown: 0,
    wobble: rand(0, PI2),
    wobbleSpeed: rand(2, 4),
    fireTimer: rand(0.5, 2),
    alive: true
  };
  G.enemies.push(enemy);
}

function updateEnemies(dt) {
  const p = G.player;
  const cx = G.canvas.width || W;
  const cy = G.canvas.height || H;

  for (let i = G.enemies.length - 1; i >= 0; i--) {
    const e = G.enemies[i];
    if (!e.alive || e.hp <= 0) {
      onEnemyKilled(e, i);
      continue;
    }

    e.timer += dt;
    e.fireTimer -= dt;

    // 距离玩家太远则移除
    if (dist(e, p) > 1200) {
      G.enemies.splice(i, 1);
      continue;
    }

    switch (e.pattern) {
      case 'float':
        // 变异水母：浮动+缓慢追踪
        e.wobble += e.wobbleSpeed * dt;
        e.angle = angleTo(e, p);
        e.x += Math.cos(e.angle) * e.speed * 0.4 * dt;
        e.y += Math.sin(e.angle) * e.speed * 0.4 * dt;
        e.y += Math.sin(e.wobble) * 30 * dt;
        // 射击
        if (e.fireTimer <= 0) {
          e.fireTimer = 1.8 - G.level * 0.1;
          const a = angleTo(e, p);
          G.enemyBullets.push(makeEnemyBullet(e.x, e.y, a, 150, e.damage * 0.5, '#ff66aa'));
        }
        break;

      case 'chase':
        // 巨型章鱼：追踪玩家
        e.angle = angleTo(e, p);
        e.x += Math.cos(e.angle) * e.speed * dt;
        e.y += Math.sin(e.angle) * e.speed * dt;
        if (e.fireTimer <= 0) {
          e.fireTimer = 2.0 - G.level * 0.1;
          const a = angleTo(e, p);
          G.enemyBullets.push(makeEnemyBullet(e.x, e.y, a, 200, e.damage * 0.4, '#aa66ff'));
        }
        break;

      case 'charge':
        // 装甲蟹：先定位再冲撞
        if (e.chargeCooldown <= 0) {
          // 蓄力冲撞
          if (e.timer > 2.0) {
            e.angle = angleTo(e, p);
            e.vx = Math.cos(e.angle) * e.speed * 2.5;
            e.vy = Math.sin(e.angle) * e.speed * 2.5;
            e.chargeCooldown = 3.0;
            e.timer = 0;
          } else {
            // 缓慢移动瞄准
            e.angle = angleTo(e, p);
            e.x += Math.cos(e.angle) * e.speed * 0.3 * dt;
            e.y += Math.sin(e.angle) * e.speed * 0.3 * dt;
          }
        } else {
          // 冲撞中
          e.x += (e.vx || 0) * dt;
          e.y += (e.vy || 0) * dt;
          e.chargeCooldown -= dt;
          // 冲撞减速
          if (e.vx) e.vx *= 0.98;
          if (e.vy) e.vy *= 0.98;
          if (e.chargeCooldown <= 2.5) {
            e.vx = 0; e.vy = 0;
          }
          // 冲撞粒子
          if (e.chargeCooldown > 2.5) {
            VFX.createTrail(G.ctx, e.x, e.y, '#ffaa44', 2);
          }
        }
        break;

      case 'hunt':
        // 深渊鲨鱼：追踪+快速冲刺
        e.angle = angleTo(e, p);
        const d = dist(e, p);
        if (d < 250 && e.chargeCooldown <= 0) {
          // 冲刺攻击
          e.vx = Math.cos(e.angle) * e.speed * 3;
          e.vy = Math.sin(e.angle) * e.speed * 3;
          e.chargeCooldown = 2.5;
        } else {
          // 正常追踪
          e.x += Math.cos(e.angle) * e.speed * 0.7 * dt;
          e.y += Math.sin(e.angle) * e.speed * 0.7 * dt;
        }
        if (e.chargeCooldown > 0) {
          e.chargeCooldown -= dt;
          e.x += (e.vx || 0) * dt;
          e.y += (e.vy || 0) * dt;
          if (e.vx) e.vx *= 0.97;
          if (e.vy) e.vy *= 0.97;
          VFX.createTrail(G.ctx, e.x, e.y, '#ff6644', 2);
        }
        break;
    }
  }
}

function onEnemyKilled(enemy, index) {
  // 爆炸特效
  VFX.createExplosion(G.ctx, enemy.x, enemy.y, {
    color: enemy.color,
    color2: '#ffffff',
    count: 35
  });
  Audio.playExplosion();

  // 掉落物可能——加分
  G.score += enemy.score;
  G.enemiesKilled++;
  G.killCount++;
  G.totalKills++;

  // 连击
  G.comboCount++;
  G.comboTimer = 1.5;
  if (G.comboCount >= 3) {
    const bonus = G.comboCount * 2;
    G.score += bonus;
    addFloatingText(enemy.x, enemy.y - 10, '+' + bonus + ' 连击!', '#ffff44');
    if (G.comboCount % 5 === 0) {
      Audio.playCombo();
    }
  }

  addFloatingText(enemy.x, enemy.y, '+' + enemy.score, '#ffffff');

  // 移除
  G.enemies.splice(index, 1);
}

// ============================================================
// 敌弹
// ============================================================
function makeEnemyBullet(x, y, angle, speed, damage, color) {
  return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage, radius: 5, color: color || '#ff4444', life: 3.0 };
}

function updateEnemyBullets(dt) {
  const cx = G.canvas.width || W;
  const cy = G.canvas.height || H;
  for (let i = G.enemyBullets.length - 1; i >= 0; i--) {
    const b = G.enemyBullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.x < -30 || b.x > cx + 30 || b.y < -30 || b.y > cy + 30) {
      G.enemyBullets.splice(i, 1);
    }
  }
}

// ============================================================
// 碰撞检测
// ============================================================
function checkCollisions() {
  const p = G.player;

  // 玩家子弹 vs 敌人
  for (let i = G.bullets.length - 1; i >= 0; i--) {
    const b = G.bullets[i];

    // vs 敌人
    for (let j = G.enemies.length - 1; j >= 0; j--) {
      const e = G.enemies[j];
      if (e.hp <= 0) continue;
      if (dist(b, e) < b.radius + e.size * 0.6) {
        e.hp -= b.damage;
        VFX.createHitSparks(G.ctx, b.x, b.y, '#66ddff');
        Audio.playHit();
        G.bullets.splice(i, 1);

        if (e.hp <= 0) {
          e.alive = false;
        }
        break;
      }
    }

    // vs BOSS
    if (G.boss && G.boss.hp > 0) {
      const b2 = G.bullets[i];
      if (b2 && dist(b2, G.boss) < b2.radius + G.boss.size * 0.6) {
        G.boss.hp -= b2.damage;
        VFX.createHitSparks(G.ctx, b2.x, b2.y, '#ff4444');
        Audio.playHit();
        G.bullets.splice(i, 1);
      }
    }
  }

  // 敌弹 vs 玩家
  if (p.invincible <= 0) {
    for (let i = G.enemyBullets.length - 1; i >= 0; i--) {
      const b = G.enemyBullets[i];
      if (dist(b, p) < b.radius + 12) {
        playerTakeDamage(b.damage);
        G.enemyBullets.splice(i, 1);
      }
    }
  }

  // 敌人碰撞 vs 玩家
  if (p.invincible <= 0) {
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (e.hp <= 0) continue;
      if (dist(e, p) < e.size * 0.6 + 12) {
        playerTakeDamage(e.damage);
        // 反冲
        const a = angleTo(e, p);
        e.x += Math.cos(a) * 40;
        e.y += Math.sin(a) * 40;
        e.hp -= 10; // 碰撞也伤敌
        if (e.hp <= 0) e.alive = false;
      }
    }
  }

  // BOSS vs 玩家
  if (G.boss && G.boss.hp > 0 && p.invincible <= 0) {
    if (dist(G.boss, p) < G.boss.size * 0.5 + 12) {
      playerTakeDamage(G.boss.damage * 2);
    }
  }

  // 辅助艇 vs 敌人（碰撞）
  for (let i = G.allies.length - 1; i >= 0; i--) {
    const ally = G.allies[i];
    for (let j = G.enemies.length - 1; j >= 0; j--) {
      const e = G.enemies[j];
      if (e.hp <= 0) continue;
      if (dist(ally, e) < ally.size + e.size * 0.5) {
        ally.hp -= e.damage * 0.5;
        e.hp -= 5;
        if (e.hp <= 0) e.alive = false;
      }
    }
  }
}

function playerTakeDamage(amount) {
  const p = G.player;
  // 护盾吸收
  if (p.shield > 0) {
    const absorbed = Math.min(p.shield, amount);
    p.shield -= absorbed;
    amount -= absorbed;
    if (amount <= 0) {
      Shake.trigger(5, 0.15);
      p.invincible = 0.3;
      return;
    }
  }
  // 本体受伤
  p.hp -= amount;
  p.invincible = 0.8;
  p.shieldRechargeTimer = p.shieldRechargeDelay;
  Shake.trigger(8, 0.25);
  Audio.playHit(1.5);

  if (p.hp <= 0) {
    p.hp = 0;
    gameOver('潜艇被击沉');
  }
}

// ============================================================
// 生成管理
// ============================================================
function updateSpawning(dt) {
  const lv = LEVELS[G.level];
  if (!lv) return;
  if (G.enemies.length >= lv.maxEnemies) return;

  G.spawnTimer -= dt;
  if (G.spawnTimer <= 0) {
    G.spawnTimer = lv.spawnInterval;
    const typeId = lv.enemyTypes[randInt(0, lv.enemyTypes.length - 1)];
    spawnEnemy(typeId);
  }
}

// ============================================================
// 关卡进度
// ============================================================
function checkLevelProgress() {
  if (G.phase !== 'playing') return;
  if (G.boss) return; // BOSS战由BOSS逻辑控制

  const lv = LEVELS[G.level];
  if (!lv) return;
  if (G.killCount >= lv.killTarget) {
    // 进入下一关
    G.phase = 'levelUp';
    G.transitionTimer = 2.0;
    G.transitionText = '关卡 ' + (G.level + 1) + ' 完成!';
    addFloatingText(W / 2, H / 2, '关卡完成!', '#44ff88');
    Audio.playTreasure();
  }
}

function enterLevel(idx) {
  if (idx >= LEVELS.length) {
    victory();
    return;
  }
  G.level = idx;
  G.killCount = 0;
  G.spawnTimer = 0;
  G.enemies = [];
  G.enemyBullets = [];
  G.boss = null;
  G.phase = 'playing';

  const lv = LEVELS[idx];

  // 升级奖励
  if (idx > 0) {
    const p = G.player;
    // 每关奖励
    p.hp = Math.min(p.maxHp, p.hp + 20);
    p.shield = Math.min(p.maxShield, p.shield + 15);
    Audio.playPowerup();

    // 武器升级
    if (idx % 1 === 0 && p.weaponLevel < 3) {
      p.weaponLevel++;
      addFloatingText(W / 2, H / 2 - 30, '武器升级 Lv.' + p.weaponLevel + '!', '#ffdd44');
      Audio.playPowerup();
    }

    // 辅助潜艇加入
    if (idx >= 2 && G.allies.length < 1) {
      G.allies.push({
        x: G.player.x - 60, y: G.player.y,
        hp: 60, maxHp: 60,
        speed: 150,
        fireRate: 0.6,
        fireTimer: 0,
        size: 16,
        angle: 0
      });
      addFloatingText(W / 2, H / 2 + 10, '辅助潜艇加入!', '#88ff88');
    }
    if (idx >= 3 && G.allies.length < 2) {
      G.allies.push({
        x: G.player.x + 60, y: G.player.y,
        hp: 60, maxHp: 60,
        speed: 150,
        fireRate: 0.6,
        fireTimer: 0.3,
        size: 16,
        angle: 0
      });
    }
  }

  // BOSS关准备
  if (lv.isBoss) {
    G.bossWarningTimer = 2.0;
    Audio.playBossWarning();
  }

  // 更新背景颜色渐变（过渡）在渲染中用
  G.transitionText = '第 ' + (idx + 1) + ' 关: ' + lv.name;
  G.transitionTimer = 0.5;

  const msg = document.getElementById('submarine-message');
  if (msg) msg.textContent = G.transitionText;
}

// ============================================================
// BOSS
// ============================================================
function initBoss() {
  const cx = G.canvas.width || W;
  const lv = G.level;
  const boss = {
    x: cx / 2, y: -80,
    targetY: 80,
    hp: 300 + lv * 100,
    maxHp: 300 + lv * 100,
    size: 50,
    speed: 60,
    damage: 12,
    phase: 1,               // 1, 2, 3
    phaseThreshold: 0.66,   // 进入阶段2
    phaseThreshold2: 0.33,  // 进入阶段3
    timer: 0,
    attackTimer: 0,
    attackCooldown: 1.5,
    angle: 0,
    color: '#cc2266',
    summonCooldown: 0,
    minions: []
  };
  G.boss = boss;
  G.enemies = []; // 清场
  Audio.playBossWarning();

  // 屏幕震动
  Shake.trigger(12, 0.6);

  addFloatingText(W / 2, H / 2, '!!! BOSS 出现 !!!', '#ff2244');
}

function updateBoss(dt) {
  const boss = G.boss;
  if (!boss) return;
  const p = G.player;

  // 入场
  if (boss.y < boss.targetY) {
    boss.y += 60 * dt;
    if (boss.y >= boss.targetY) {
      boss.y = boss.targetY;
      Shake.trigger(10, 0.4);
      Audio.playExplosion(1.3);
    }
    return;
  }

  // 阶段检测
  const hpRatio = boss.hp / boss.maxHp;
  if (hpRatio <= boss.phaseThreshold2) {
    boss.phase = 3;
  } else if (hpRatio <= boss.phaseThreshold) {
    boss.phase = 2;
  }

  // 水平移动
  boss.timer += dt;
  boss.x = (boss.x) + Math.cos(boss.timer * 0.5) * 50 * dt;
  boss.x = clamp(boss.x, 80, (G.canvas.width || W) - 80);
  boss.angle = angleTo(boss, p);

  // 攻击
  boss.attackTimer -= dt;
  if (boss.attackTimer <= 0) {
    boss.attackTimer = boss.attackCooldown;

    switch (boss.phase) {
      case 1:
        bossPhase1Attack(boss);
        break;
      case 2:
        bossPhase2Attack(boss);
        break;
      case 3:
        bossPhase3Attack(boss);
        break;
    }
  }

  // 阶段3：不断召唤小怪
  if (boss.phase >= 3) {
    boss.summonCooldown -= dt;
    if (boss.summonCooldown <= 0) {
      boss.summonCooldown = 3.0;
      summonBossMinions(boss);
    }
  }

  // BOSS周围特效
  if (Math.random() < 0.3) {
    VFX.createTrail(G.ctx, boss.x + rand(-20, 20), boss.y + rand(-20, 20), boss.color, 1);
  }
}

function bossPhase1Attack(boss) {
  // 散射
  const count = 8 + boss.phase * 2;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * PI2 + boss.timer * 0.5;
    const spd = 120 + Math.random() * 60;
    G.enemyBullets.push(makeEnemyBullet(boss.x, boss.y, a, spd, boss.damage * 0.6, '#ff4466'));
  }
  Audio.playShoot(0.8);
}

function bossPhase2Attack(boss) {
  // 追踪弹
  const p = G.player;
  const count = 4 + boss.phase;
  for (let i = 0; i < count; i++) {
    const a = angleTo(boss, p) + (i - count / 2) * 0.15;
    const b = makeEnemyBullet(boss.x, boss.y, a, 180, boss.damage * 0.7, '#ff66aa');
    b.homing = 2.0;    // 追踪时间
    b.homingPower = 2.5;
    G.enemyBullets.push(b);
  }
  Audio.playShoot(0.9);
}

function bossPhase3Attack(boss) {
  // 混合攻击：散射+追踪
  bossPhase1Attack(boss);
  bossPhase2Attack(boss);

  // 警告闪屏
  const ctx = G.ctx;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
  ctx.fillRect(0, 0, G.canvas.width || W, G.canvas.height || H);
  ctx.restore();

  Shake.trigger(6, 0.2);
}

function summonBossMinions(boss) {
  const count = 2 + G.level;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * PI2;
    const m = {
      x: boss.x + Math.cos(a) * 60,
      y: boss.y + Math.sin(a) * 60,
      vx: Math.cos(a) * 40,
      vy: Math.sin(a) * 40,
      hp: 15 + G.level * 3,
      size: 10,
      damage: 6,
      color: '#ff4488',
      life: 5.0
    };
    G.enemies.push({
      x: m.x, y: m.y,
      type: 'minion',
      name: '病毒孢子',
      color: '#ff4488',
      size: 10,
      hp: m.hp,
      maxHp: m.hp,
      speed: 60,
      damage: m.damage,
      score: 5,
      pattern: 'chase',
      timer: 0,
      chargeCooldown: 0,
      wobble: 0,
      wobbleSpeed: 0,
      fireTimer: 99,
      alive: true
    });
  }
  VFX.createBubbleBurst(G.ctx, boss.x, boss.y, 15, '#ff4488');
}

function onBossDefeated() {
  const boss = G.boss;
  // 大爆炸
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      VFX.createExplosion(G.ctx, boss.x + rand(-40, 40), boss.y + rand(-40, 40), {
        color: '#ff2244', color2: '#ff8844', count: 50 + randInt(0, 20)
      });
    }, i * 150);
  }
  Audio.playExplosion(1.5);
  Shake.trigger(15, 0.8);

  G.score += 500;
  addFloatingText(boss.x, boss.y - 30, 'BOSS 击败! +500', '#ffdd44');
  Audio.playTreasure(1.3);
  G.boss = null;

  // 下一关
  G.phase = 'levelUp';
  G.transitionTimer = 3.0;
  G.transitionText = 'BOSS 已消灭!';
}

function victory() {
  G.phase = 'victory';
  G.score += 200;
  addFloatingText(W / 2, H / 2, '全部通关!', '#ffdd44');
  Audio.playTreasure(1.5);
  // 触发完成回调
  if (G._onComplete) {
    G._onComplete();
  }
}

function gameOver(reason) {
  G.phase = 'gameover';
  G.gameOverReason = reason || '游戏结束';
  Shake.trigger(12, 0.5);
  VFX.createExplosion(G.ctx, G.player.x, G.player.y, {
    color: '#ff4400', count: 60, speed: 250
  });
  Audio.playExplosion(1.3);
  // 触发完成回调
  if (G._onComplete) {
    G._onComplete();
  }
}

// ============================================================
// 浮动文字
// ============================================================
function addFloatingText(x, y, text, color) {
  G.floatingTexts.push({ x, y, text, color: color || '#ffffff', life: 1.2, maxLife: 1.2, vy: -60 });
}

function updateFloatingTexts(dt) {
  for (let i = G.floatingTexts.length - 1; i >= 0; i--) {
    const ft = G.floatingTexts[i];
    ft.y += ft.vy * dt;
    ft.life -= dt;
    if (ft.life <= 0) G.floatingTexts.splice(i, 1);
  }
}

// ============================================================
// RENDER
// ============================================================
function render() {
  const ctx = G.ctx;
  if (!ctx) return;
  const cw = G.canvas.width || W;
  const ch = G.canvas.height || H;

  ctx.save();

  // ---- 屏幕震动 ----
  const shake = Shake.getOffset();
  ctx.translate(shake.x, shake.y);

  // ---- 背景 ----
  drawBackground(ctx, cw, ch);

  // ---- 背景气泡 ----
  drawBgBubbles(ctx);

  // ---- BOSS警告 ----
  if (G.bossWarningTimer > 0) {
    G.bossWarningTimer -= 0.016;
    drawBossWarning(ctx, cw, ch);
  }

  // ---- 浮动文字 ----
  drawFloatingTexts(ctx);

  // ---- 子弹 ----
  drawBullets(ctx);

  // ---- 敌人 ----
  drawEnemies(ctx);

  // ---- 敌弹 ----
  drawEnemyBullets(ctx);

  // ---- BOSS ----
  if (G.boss) drawBoss(ctx);

  // ---- 辅助潜艇 ----
  drawAllies(ctx);

  // ---- 玩家 ----
  drawPlayer(ctx);

  // ---- 粒子 ----
  VFX.renderParticles(ctx);

  // ---- HUD ----
  drawHUD(ctx, cw, ch);

  // ---- 过渡 ----
  if (G.phase === 'levelUp') {
    drawTransition(ctx, cw, ch);
  }

  // ---- 游戏结束 ----
  if (G.phase === 'gameover' || G.phase === 'victory') {
    drawEndScreen(ctx, cw, ch);
  }

  ctx.restore();
}

// ============================================================
// 背景绘制
// ============================================================
function drawBackground(ctx, cw, ch) {
  const lv = LEVELS[G.level] || LEVELS[0];
  const top = lv.bgTop || '#001f3f';
  const bot = lv.bgBot || '#004080';

  // 多层渐变
  const grad = ctx.createLinearGradient(0, 0, 0, ch);
  grad.addColorStop(0, top);
  grad.addColorStop(0.3, '#001a3a');
  grad.addColorStop(0.6, '#00102a');
  grad.addColorStop(1, bot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cw, ch);

  // 海底装饰（底部纹路）
  ctx.fillStyle = 'rgba(0, 20, 40, 0.3)';
  for (let i = 0; i < 10; i++) {
    const bx = (i / 10) * cw + Math.sin(G.bgTime * 0.1 + i) * 15;
    ctx.beginPath();
    ctx.ellipse(bx, ch - 5 + Math.sin(i * 2) * 3, 50 + Math.sin(i * 3) * 20, 5, 0, 0, PI2);
    ctx.fill();
  }

  // 动态光柱
  G.lightBeams.forEach(beam => {
    beam.x += beam.speed * 0.016;
    beam.sway += beam.swaySpeed * 0.016;
    if (beam.x > cw + beam.width) beam.x = -beam.width;

    ctx.save();
    ctx.globalAlpha = beam.alpha + Math.sin(beam.sway) * 0.02;
    const grad2 = ctx.createLinearGradient(beam.x, 0, beam.x + beam.width * 0.5, ch);
    grad2.addColorStop(0, 'rgba(100, 200, 255, 0.08)');
    grad2.addColorStop(0.5, 'rgba(100, 200, 255, 0.03)');
    grad2.addColorStop(1, 'rgba(100, 200, 255, 0)');
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.moveTo(beam.x, 0);
    ctx.lineTo(beam.x + beam.width * 0.5 + Math.sin(beam.sway) * 10, ch);
    ctx.lineTo(beam.x - beam.width * 0.5 + Math.sin(beam.sway) * 10, ch);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

// ============================================================
// 背景气泡
// ============================================================
function drawBgBubbles(ctx) {
  G.bgBubbles.forEach(b => {
    ctx.save();
    ctx.globalAlpha = b.alpha;
    ctx.strokeStyle = 'rgba(150, 220, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, PI2);
    ctx.stroke();
    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(b.x - b.size * 0.25, b.y - b.size * 0.25, b.size * 0.3, 0, PI2);
    ctx.fill();
    ctx.restore();
  });
}

// ============================================================
// 玩家绘制
// ============================================================
function drawPlayer(ctx) {
  const p = G.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);

  // 无敌闪烁
  if (p.invincible > 0 && Math.floor(p.invincible * 10) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  // 护盾光环
  if (p.shield > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, PI2);
    ctx.strokeStyle = 'rgba(68, 170, 255, ' + (0.2 + p.shield / p.maxShield * 0.3) + ')';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // 潜艇身体
  ctx.fillStyle = '#446688';
  ctx.strokeStyle = '#66aadd';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 10, 0, 0, PI2);
  ctx.fill();
  ctx.stroke();

  // 潜艇上层建筑
  ctx.fillStyle = '#557799';
  ctx.beginPath();
  ctx.ellipse(-2, -6, 10, 7, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();

  // 窗户
  ctx.fillStyle = '#88ddff';
  ctx.shadowColor = '#88ddff';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(5, -1, 5, 0, PI2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 尾部推进器
  ctx.fillStyle = '#334455';
  ctx.beginPath();
  ctx.ellipse(-20, 0, 5, 6, 0, 0, PI2);
  ctx.fill();

  // 炮管
  ctx.fillStyle = '#667788';
  ctx.fillRect(18, -2, 10, 4);

  ctx.restore();
}

// ============================================================
// 敌人绘制
// ============================================================
function drawEnemies(ctx) {
  G.enemies.forEach(e => {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle);

    switch (e.type) {
      case 'jellyfish':
        // 水母：半圆伞 + 触须
        ctx.fillStyle = e.color;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(0, -e.size * 0.2, e.size * 0.6, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        // 触须
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 1.5;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(i * e.size * 0.15, e.size * 0.1);
          ctx.quadraticCurveTo(i * e.size * 0.2 + Math.sin(e.timer * 3 + i) * 5, e.size * 0.5, i * e.size * 0.15, e.size * 0.7);
          ctx.stroke();
        }
        // 发光
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = e.color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0, -e.size * 0.2, e.size * 0.5, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        break;

      case 'octopus':
        // 章鱼：圆头 + 八爪
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, e.size * 0.4, 0, PI2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // 触手
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * PI2 + Math.sin(e.timer * 2) * 0.3;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * e.size * 0.35, Math.sin(a) * e.size * 0.35);
          ctx.quadraticCurveTo(
            Math.cos(a + 0.3) * e.size * 0.55,
            Math.sin(a + 0.3) * e.size * 0.55,
            Math.cos(a) * e.size * 0.65,
            Math.sin(a) * e.size * 0.65
          );
          ctx.stroke();
        }
        // 眼睛
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(-e.size * 0.15, -e.size * 0.1, 4, 0, PI2);
        ctx.arc(e.size * 0.15, -e.size * 0.1, 4, 0, PI2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-e.size * 0.15, -e.size * 0.1, 2, 0, PI2);
        ctx.arc(e.size * 0.15, -e.size * 0.1, 2, 0, PI2);
        ctx.fill();
        break;

      case 'armoredcrab':
        // 装甲蟹：椭圆甲壳 + 螯 + 腿
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(0, 0, e.size * 0.5, e.size * 0.35, 0, 0, PI2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // 甲壳纹路
        ctx.strokeStyle = '#aa7733';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, e.size * 0.4, e.size * 0.25, 0, 0, PI2);
        ctx.stroke();
        // 螯
        ctx.fillStyle = '#bb7733';
        ctx.beginPath();
        ctx.ellipse(-e.size * 0.5, -e.size * 0.1, e.size * 0.2, e.size * 0.1, -0.3, 0, PI2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(e.size * 0.5, -e.size * 0.1, e.size * 0.2, e.size * 0.1, 0.3, 0, PI2);
        ctx.fill();
        // 眼睛（凸起）
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(-e.size * 0.2, -e.size * 0.25, 3, 0, PI2);
        ctx.arc(e.size * 0.2, -e.size * 0.25, 3, 0, PI2);
        ctx.fill();
        break;

      case 'shark':
        // 深渊鲨鱼：流线型 + 鳍
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(e.size * 0.5, 0);
        ctx.quadraticCurveTo(e.size * 0.3, -e.size * 0.3, -e.size * 0.1, -e.size * 0.2);
        ctx.lineTo(-e.size * 0.5, -e.size * 0.1);
        ctx.lineTo(-e.size * 0.5, e.size * 0.1);
        ctx.lineTo(-e.size * 0.1, e.size * 0.2);
        ctx.quadraticCurveTo(e.size * 0.3, e.size * 0.3, e.size * 0.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // 背鳍
        ctx.fillStyle = '#aa3333';
        ctx.beginPath();
        ctx.moveTo(e.size * 0.1, -e.size * 0.2);
        ctx.lineTo(e.size * 0.05, -e.size * 0.45);
        ctx.lineTo(-e.size * 0.1, -e.size * 0.2);
        ctx.closePath();
        ctx.fill();
        // 牙齿
        ctx.fillStyle = '#fff';
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(e.size * 0.35 + i * 5, 0);
          ctx.lineTo(e.size * 0.4 + i * 5, 5);
          ctx.lineTo(e.size * 0.35 + i * 5 + 3, 0);
          ctx.closePath();
          ctx.fill();
        }
        // 眼睛
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(e.size * 0.1, -e.size * 0.1, 3, 0, PI2);
        ctx.fill();
        ctx.shadowBlur = 0;
        break;

      default:
        // 默认：圆形
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, e.size * 0.4, 0, PI2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // 血条
    if (e.hp < e.maxHp) {
      const bw = e.size;
      const bh = 3;
      const bx = -bw / 2;
      const by = -e.size * 0.5 - 6;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = e.hp / e.maxHp > 0.3 ? '#44ff44' : '#ff4444';
      ctx.fillRect(bx, by, bw * (e.hp / e.maxHp), bh);
    }

    ctx.restore();
  });
}

// ============================================================
// BOSS绘制
// ============================================================
function drawBoss(ctx) {
  const boss = G.boss;
  if (!boss) return;
  ctx.save();
  ctx.translate(boss.x, boss.y);

  // BOSS光环
  const pulse = 1 + Math.sin(G.bgTime * 2) * 0.05;
  ctx.shadowColor = boss.color;
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(0, 0, boss.size * pulse, 0, PI2);
  ctx.fillStyle = boss.color;
  ctx.globalAlpha = 0.15;
  ctx.fill();
  ctx.globalAlpha = 1;

  // BOSS本体
  ctx.shadowBlur = 20;
  ctx.fillStyle = boss.color;
  ctx.beginPath();
  ctx.arc(0, 0, boss.size * 0.6, 0, PI2);
  ctx.fill();

  // 核心
  ctx.shadowBlur = 15;
  const coreColor = boss.phase === 3 ? '#ff0044' : (boss.phase === 2 ? '#ff6622' : '#ff8844');
  ctx.fillStyle = coreColor;
  ctx.beginPath();
  ctx.arc(0, 0, boss.size * 0.3, 0, PI2);
  ctx.fill();

  // 触手/触须
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#881144';
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PI2 + G.bgTime * 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * boss.size * 0.5, Math.sin(a) * boss.size * 0.5);
    const len = boss.size * (0.6 + Math.sin(G.bgTime * 1.5 + i) * 0.2);
    ctx.quadraticCurveTo(
      Math.cos(a + 0.4) * len,
      Math.sin(a + 0.4) * len,
      Math.cos(a) * len * 1.2,
      Math.sin(a) * len * 1.2
    );
    ctx.stroke();
  }

  // 眼睛
  ctx.fillStyle = '#ff0000';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(-12, -8, 6, 0, PI2);
  ctx.arc(12, -8, 6, 0, PI2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(-10, -8, 2, 0, PI2);
  ctx.arc(14, -8, 2, 0, PI2);
  ctx.fill();

  // 阶段指示灯
  ctx.fillStyle = '#fff';
  ctx.shadowBlur = 5;
  ctx.shadowColor = '#fff';
  for (let i = 1; i <= 3; i++) {
    ctx.globalAlpha = boss.phase >= i ? 1 : 0.3;
    ctx.fillRect(-15 + i * 15, 22, 8, 3);
  }
  ctx.globalAlpha = 1;

  ctx.shadowBlur = 0;
  ctx.restore();

  // BOSS血条（顶部）
  drawBossHPBar(ctx);
}

function drawBossHPBar(ctx) {
  const cw = G.canvas.width || W;
  const boss = G.boss;
  if (!boss) return;
  const barW = 300;
  const barH = 16;
  const bx = (cw - barW) / 2;
  const by = 30;

  Cv.drawGlassPanel(ctx, bx - 5, by - 5, barW + 10, barH + 10, {
    bgColor: 'rgba(0,0,0,0.5)',
    borderColor: 'rgba(255, 68, 68, 0.3)',
    radius: 4
  });

  const ratio = boss.hp / boss.maxHp;
  Cv.drawProgressBar(ctx, bx, by, barW, barH, ratio, '#ff4444', '#ff8844');

  Cv.drawGlowText(ctx, 'BOSS', cw / 2, by + barH + 18, '#ff6666', 14, '#ff4444');
}

// ============================================================
// 子弹绘制
// ============================================================
function drawBullets(ctx) {
  G.bullets.forEach(b => {
    ctx.save();
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, PI2);
    ctx.fill();
    // 核心亮白
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius * 0.4, 0, PI2);
    ctx.fill();
    ctx.restore();
  });
}

// ============================================================
// 敌弹绘制
// ============================================================
function drawEnemyBullets(ctx) {
  G.enemyBullets.forEach(b => {
    ctx.save();
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, PI2);
    ctx.fill();
    ctx.restore();
  });
}

// ============================================================
// 辅助潜艇绘制
// ============================================================
function drawAllies(ctx) {
  G.allies.forEach(ally => {
    ctx.save();
    ctx.translate(ally.x, ally.y);

    // 颜色变绿
    ctx.fillStyle = '#448866';
    ctx.strokeStyle = '#66ddaa';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 7, 0, 0, PI2);
    ctx.fill();
    ctx.stroke();

    // 窗户
    ctx.fillStyle = '#88ffaa';
    ctx.shadowColor = '#88ffaa';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(3, 0, 3, 0, PI2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 血条
    const bw = 20;
    const bh = 2;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-bw / 2, -10, bw, bh);
    ctx.fillStyle = '#44ff44';
    ctx.fillRect(-bw / 2, -10, bw * (ally.hp / ally.maxHp), bh);

    ctx.restore();
  });
}

// ============================================================
// BOSS警告
// ============================================================
function drawBossWarning(ctx, cw, ch) {
  const intensity = Math.max(0, G.bossWarningTimer / 2.0);
  ctx.save();
  // 闪红
  ctx.globalAlpha = 0.12 * intensity;
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, cw, ch);
  ctx.globalAlpha = 1;

  // 文字警告
  const scale = 1 + Math.sin(G.bgTime * 8) * 0.1;
  ctx.save();
  ctx.translate(cw / 2, ch / 2);
  ctx.scale(scale, scale);
  Cv.drawGlowText(ctx, '⚠ 警告: BOSS 出现 ⚠', 0, 0,
    'rgba(255, 50, 50, ' + intensity + ')', 36, '#ff0000');
  ctx.restore();

  // 边缘红光
  const grad = ctx.createRadialGradient(cw / 2, ch / 2, 0, cw / 2, ch / 2, Math.max(cw, ch) * 0.5);
  grad.addColorStop(0, 'rgba(255,0,0,0)');
  grad.addColorStop(0.7, 'rgba(255,0,0,0)');
  grad.addColorStop(1, 'rgba(255,0,0,' + (0.2 * intensity) + ')');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cw, ch);

  ctx.restore();
}

// ============================================================
// 浮动文字绘制
// ============================================================
function drawFloatingTexts(ctx) {
  G.floatingTexts.forEach(ft => {
    const alpha = ft.life / ft.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 10;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  });
}

// ============================================================
// HUD
// ============================================================
function drawHUD(ctx, cw, ch) {
  const p = G.player;
  const lv = LEVELS[G.level];
  const margin = 10;

  // ---- 左上：玻璃面板 ----
  Cv.drawGlassPanel(ctx, margin, margin, 200, 90, {
    bgColor: 'rgba(0, 10, 30, 0.6)',
    borderColor: 'rgba(100, 200, 255, 0.25)',
    radius: 8
  });

  // 关卡信息
  Cv.drawGlowText(ctx, '第 ' + (G.level + 1) + ' 关: ' + (lv ? lv.name : ''), margin + 100, margin + 22, '#66ddff', 14, '#4488ff');

  // 分数
  ctx.fillStyle = '#ffffff';
  ctx.font = '13px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('分数: ' + G.score, margin + 10, margin + 42);
  ctx.fillText('击杀: ' + G.enemiesKilled, margin + 10, margin + 58);

  // 关卡进度
  if (lv && !lv.isBoss) {
    const prog = Math.min(1, G.killCount / lv.killTarget);
    ctx.fillText('进度: ' + G.killCount + '/' + lv.killTarget, margin + 10, margin + 74);
    Cv.drawProgressBar(ctx, margin + 90, margin + 67, 100, 6, prog, '#44aaff', '#66ddff');
  }

  // ---- 右上：状态面板 ----
  const rightX = cw - 210;
  Cv.drawGlassPanel(ctx, rightX, margin, 200, 90, {
    bgColor: 'rgba(0, 10, 30, 0.6)',
    borderColor: 'rgba(100, 200, 255, 0.25)',
    radius: 8
  });

  // HP
  ctx.fillStyle = '#ff6666';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('HP', rightX + 10, margin + 22);
  Cv.drawProgressBar(ctx, rightX + 35, margin + 12, 120, 10, p.hp / p.maxHp, '#ff4444', '#ff8866');

  ctx.fillStyle = '#ffffff';
  ctx.font = '10px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(Math.ceil(p.hp) + '/' + p.maxHp, rightX + 190, margin + 21);

  // 护盾
  ctx.fillStyle = '#4488ff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('护盾', rightX + 10, margin + 40);
  Cv.drawProgressBar(ctx, rightX + 35, margin + 30, 120, 10, p.shield / p.maxShield, '#4488ff', '#66ddff');

  ctx.fillStyle = '#ffffff';
  ctx.font = '10px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(Math.ceil(p.shield) + '/' + p.maxShield, rightX + 190, margin + 39);

  // 武器等级
  ctx.fillStyle = '#ffcc44';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('武器 Lv.' + p.weaponLevel, rightX + 10, margin + 60);

  // 辅助艇
  if (G.allies.length > 0) {
    ctx.fillStyle = '#88ff88';
    ctx.fillText('友军 x' + G.allies.length, rightX + 10, margin + 78);
  }

  // ---- 底部：连击显示 ----
  if (G.comboCount >= 3) {
    ctx.save();
    ctx.textAlign = 'center';
    const comboText = G.comboCount + ' 连击!';
    ctx.font = 'bold 20px Arial';
    ctx.shadowColor = '#ffff44';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffff44';
    ctx.fillText(comboText, cw / 2, ch - 20);
    ctx.restore();
  }

  // ---- 敌人数量 ----
  if (G.enemies.length > 0) {
    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px Arial';
    ctx.fillText('敌人: ' + G.enemies.length, cw - margin, ch - margin);
    ctx.restore();
  }
}

// ============================================================
// 过渡画面
// ============================================================
function drawTransition(ctx, cw, ch) {
  ctx.save();
  const alpha = Math.min(1, G.transitionTimer);
  ctx.globalAlpha = alpha * 0.6;

  ctx.fillStyle = '#000a1a';
  ctx.fillRect(0, 0, cw, ch);

  ctx.globalAlpha = alpha;
  Cv.drawGlowText(ctx, G.transitionText, cw / 2, ch / 2 - 20, '#66ddff', 28, '#4488ff');
  Cv.drawGlowText(ctx, '准备中...', cw / 2, ch / 2 + 20, '#ffffff', 16, '#4488ff');

  ctx.restore();
}

// ============================================================
// 结束画面
// ============================================================
function drawEndScreen(ctx, cw, ch) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, 0, cw, ch);

  const isVictory = G.phase === 'victory';
  const title = isVictory ? '全部通关!' : '游戏结束';
  const titleColor = isVictory ? '#ffdd44' : '#ff4444';

  Cv.drawGlowText(ctx, title, cw / 2, ch / 2 - 80, titleColor, 42, titleColor);

  Cv.drawGlassPanel(ctx, cw / 2 - 130, ch / 2 - 30, 260, 120, {
    bgColor: 'rgba(0, 10, 30, 0.7)',
    borderColor: 'rgba(100, 200, 255, 0.3)',
    radius: 12
  });

  ctx.fillStyle = '#ffffff';
  ctx.font = '18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('最终分数: ' + G.score, cw / 2, ch / 2 + 5);
  ctx.fillText('到达关卡: ' + (G.level + 1), cw / 2, ch / 2 + 30);
  ctx.fillText('总击杀: ' + G.enemiesKilled, cw / 2, ch / 2 + 55);

  if (!isVictory) {
    ctx.fillStyle = '#ff8888';
    ctx.font = '14px Arial';
    ctx.fillText(G.gameOverReason, cw / 2, ch / 2 + 80);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '13px Arial';
  ctx.fillText('点击重新开始', cw / 2, ch / 2 + 115);

  ctx.restore();
}

// ============================================================
// 公共API
// ============================================================
window.SubmarineGameV2 = {
  init: function(canvas) {
    init(canvas);
    return this;
  },
  start: function() {
    // 延迟一帧初始化关卡
    setTimeout(() => {
      enterLevel(0);
      start();
    }, 50);
    return this;
  },
  stop: function() {
    stop();
    return this;
  },
  getResult: function() {
    return getResult();
  },
  onComplete: function(cb) {
    G._onComplete = cb;
    return this;
  }
};

console.log('[SubmarineGameV2] 模块加载完成');

})();