/* ============================================================
 * BACKROOMS ESCAPE · 后室逃生
 * 俯视角像素恐怖生存小游戏 · 纯前端 Canvas 2D
 * ============================================================ */
(function () {
  'use strict';

  /* ========== 常量与可调参数 ========== */
  const VW = 800, VH = 600;
  const TILE = 32;                   // 单瓦片像素大小
  const MAP_W = 60, MAP_H = 50;      // 地图瓦片数（每层）
  const PLAYER_SPEED = 140;          // 像素/秒
  const PLAYER_MAX_HP = 100;
  const PLAYER_MAX_OX = 100;
  const OXY_DRAIN_NORMAL = 0.3;      // 每秒氧气消耗（正常）
  const OXY_DRAIN_GAS = 3.0;         // 每秒氧气消耗（毒气中）
  const GAS_DAMAGE = 5;              // 毒气每秒伤害
  const MELEE_DAMAGE = 15;
  const MELEE_RANGE = 44;
  const MELEE_ARC = 80;              // 攻击判定宽度
  const MELEE_COOLDOWN = 0.35;       // 秒
  const BLOCK_REDUCTION = 0.4;       // 格挡后剩余伤害比例（60%减伤）
  const FLASHBANG_RADIUS = 100;
  const FLASHBANG_STUN = 3.5;        // 秒
  const INVULN_TIME = 0.6;           // 受击无敌秒数
  const ZOMBIE_SPEED = 55;
  const ZOMBIE_DAMAGE = 8;           // 每秒接触伤害
  const ZOMBIE_HP = 30;
  const BUG_SPEED = 95;
  const BUG_DAMAGE = 12;             // 俯冲伤害
  const BUG_HP = 15;
  const BUG_DIVE_COOLDOWN = 2.5;
  const CAMERA_LERP = 6;             // 相机跟随速度
  const AI_FOLLOW_DIST = 120;        // AI 队友跟随距离

  /* ========== 调色板 ========== */
  const PAL = {
    floor1: '#d4c86a',
    floor2: '#c9b981',
    floorSpot: '#b8a85a',
    floorStain: '#8a7a3c',
    wall1: '#8a7a3c',
    wall2: '#6b5a2e',
    wall3: '#4a3f1e',
    wallHighlight: '#a89a48',
    wallShadow: '#3d3418',
    exit1: '#2ecc71',
    exit2: '#1a7a40',
    hazmatYellow: '#e8d45a',
    hazmatYellow2: '#d4c044',
    hazmatDark: '#8a7a2c',
    maskBlack: '#1a1a1a',
    filterRed: '#c0392b',
    filterBlue: '#3498db',
    tankSilver: '#8a8a7a',
    tankSilver2: '#b8b8a8',
    bootDark: '#3a3a2a',
    zombieSkin: '#7a8a6a',
    zombieSkin2: '#5a6a4a',
    zombieEye: '#c0392b',
    zombieCloth: '#4a3a2a',
    bugBody: '#2a2a1a',
    bugWing: 'rgba(200,200,180,0.6)',
    bugEye: '#ff4444',
    gasGreen: 'rgba(46,204,113,',
    blood: '#c0392b',
    bloodDark: '#7a1e15',
    flash: '#fffde7',
    door: '#5a4a2a',
    doorFrame: '#3a3018',
  };

  /* ========== DOM ========== */
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const mmCanvas = document.getElementById('minimap');
  const mmCtx = mmCanvas.getContext('2d');
  mmCtx.imageSmoothingEnabled = false;

  const $ = (id) => document.getElementById(id);
  const el = {
    hud:$('hud'), title:$('title'), result:$('result'), hint:$('hint'),
    p1hp:$('p1hp'), p2hp:$('p2hp'), p1ox:$('p1ox'), p2ox:$('p2ox'),
    p1fb:$('p1fb'), p2fb:$('p2fb'), p1name:$('p1name'), p2name:$('p2name'),
    levelBadge:$('levelBadge'),
    endTitle:$('endTitle'), endLevel:$('endLevel'), endTime:$('endTime'), endKills:$('endKills'),
    bloodoverlay: $('bloodoverlay'),
  };

  /* ========== 全局游戏状态 ========== */
  const G = {
    state: 'title',          // title | playing | dead
    mode: '1p',              // 1p | 2p
    level: 0,
    kills: 0,
    timeAlive: 0,
    players: [],
    enemies: [],
    gasses: [],              // 毒气云
    items: [],               // 道具
    particles: [],
    map: null,               // {tiles, width, height, rooms, exitX, exitY, bgCanvas, explored}
    camera: { x: 0, y: 0 },
    shake: 0,
    flashAmt: 0,             // 闪光弹白屏
    flashTimer: 0,
    flickerTimer: 0,
    flickerOn: true,
  };

  /* ========== 输入 ========== */
  const keysDown = new Set();
  const keysPressed = new Set();
  const GAME_KEYS = new Set([
    'KeyW','KeyA','KeyS','KeyD','KeyJ','KeyK','KeyL',
    'ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
    'Digit1','Digit2','Digit3','Enter','Space','Escape'
  ]);
  window.addEventListener('keydown', (e) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if (e.repeat) return;
    keysDown.add(e.code);
    keysPressed.add(e.code);
  });
  window.addEventListener('keyup', (e) => { keysDown.delete(e.code); });

  function inputP1(){
    return {
      up: keysDown.has('KeyW'), down: keysDown.has('KeyS'),
      left: keysDown.has('KeyA'), right: keysDown.has('KeyD'),
      attack: keysPressed.has('KeyJ'),
      flashbang: keysPressed.has('KeyK'),
      block: keysDown.has('KeyL'),
    };
  }
  function inputP2(){
    return {
      up: keysDown.has('ArrowUp'), down: keysDown.has('ArrowDown'),
      left: keysDown.has('ArrowLeft'), right: keysDown.has('ArrowRight'),
      attack: keysPressed.has('Digit1'),
      flashbang: keysPressed.has('Digit2'),
      block: keysDown.has('Digit3'),
    };
  }

  /* ========== 工具函数 ========== */
  function clamp(v,a,b){ return v<a?a:v>b?b:v; }
  function rand(a,b){ return a + Math.random()*(b-a); }
  function irand(a,b){ return Math.floor(rand(a,b+1)); }
  function dist(ax,ay,bx,by){ const dx=ax-bx, dy=ay-by; return Math.sqrt(dx*dx+dy*dy); }
  function rectsOverlap(ax,ay,aw,ah, bx,by,bw,bh){
    return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
  }

  /* ========== 地图生成 ========== */
  function generateMap(level){
    const tiles = [];
    for (let y=0;y<MAP_H;y++){
      tiles[y] = [];
      for (let x=0;x<MAP_W;x++) tiles[y][x] = 1; // 1=墙
    }

    const rooms = [];
    const roomCount = 6 + Math.min(level, 6);
    const minSize = 5, maxSize = 10 + Math.min(level, 4);

    for (let i=0;i<roomCount*3 && rooms.length<roomCount;i++){
      const w = irand(minSize, maxSize);
      const h = irand(minSize, maxSize);
      const x = irand(2, MAP_W - w - 2);
      const y = irand(2, MAP_H - h - 2);
      let overlap = false;
      for (const r of rooms){
        if (x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y){
          overlap = true; break;
        }
      }
      if (overlap) continue;
      rooms.push({ x, y, w, h });
      // 挖空房间
      for (let yy=y; yy<y+h; yy++)
        for (let xx=x; xx<x+w; xx++) tiles[yy][xx] = 0;
    }

    // 走廊连接（按顺序连）
    for (let i=1;i<rooms.length;i++){
      const a = rooms[i-1], b = rooms[i];
      const ax = Math.floor(a.x + a.w/2), ay = Math.floor(a.y + a.h/2);
      const bx = Math.floor(b.x + b.w/2), by = Math.floor(b.y + b.h/2);
      // L 形走廊：先水平后垂直
      if (Math.random() < 0.5){
        carveH(tiles, ax, bx, ay);
        carveV(tiles, ay, by, bx);
      } else {
        carveV(tiles, ay, by, ax);
        carveH(tiles, ax, bx, by);
      }
    }

    // 出口放在最后一个房间
    const exitRoom = rooms[rooms.length - 1];
    const exitX = Math.floor(exitRoom.x + exitRoom.w/2);
    const exitY = Math.floor(exitRoom.y + exitRoom.h/2);
    tiles[exitY][exitX] = 3; // 3=楼梯

    // 已探索矩阵
    const explored = [];
    for (let y=0;y<MAP_H;y++){ explored[y] = []; for (let x=0;x<MAP_W;x++) explored[y][x] = false; }

    // 预渲染背景到离屏 canvas
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = MAP_W * TILE;
    bgCanvas.height = MAP_H * TILE;
    renderMapToCanvas(bgCanvas, tiles);

    return { tiles, width: MAP_W, height: MAP_H, rooms, exitX, exitY, bgCanvas, explored };
  }
  function carveH(tiles, x1, x2, y){
    const a = Math.min(x1,x2), b = Math.max(x1,x2);
    for (let x=a; x<=b; x++){
      tiles[y][x] = 0;
      if (y+1 < tiles.length) tiles[y+1][x] = 0; // 走廊 2 格高
    }
  }
  function carveV(tiles, y1, y2, x){
    const a = Math.min(y1,y2), b = Math.max(y1,y2);
    for (let y=a; y<=b; y++){
      tiles[y][x] = 0;
      if (x+1 < tiles[0].length) tiles[y][x+1] = 0;
    }
  }

  function isWall(tx, ty){
    if (tx<0||ty<0||tx>=MAP_W||ty>=MAP_H) return true;
    return G.map.tiles[ty][tx] === 1;
  }
  // 像素坐标是否撞墙（AABB）
  function collidesWall(px, py, pw, ph){
    const x1 = Math.floor(px / TILE);
    const y1 = Math.floor(py / TILE);
    const x2 = Math.floor((px + pw - 1) / TILE);
    const y2 = Math.floor((py + ph - 1) / TILE);
    for (let y=y1;y<=y2;y++)
      for (let x=x1;x<=x2;x++)
        if (isWall(x,y)) return true;
    return false;
  }

  // 分轴移动并解算碰撞
  function moveWithCollision(entity, dx, dy){
    // X 轴
    if (dx !== 0){
      const nx = entity.x + dx;
      if (!collidesWall(nx, entity.y, entity.w, entity.h)){
        entity.x = nx;
      } else {
        // 逐像素逼近
        const step = dx > 0 ? 1 : -1;
        while (!collidesWall(entity.x + step, entity.y, entity.w, entity.h)){
          entity.x += step;
          if (Math.abs(entity.x + step - (entity.x - dx)) > Math.abs(dx)) break;
        }
        entity.vx = 0;
      }
    }
    // Y 轴
    if (dy !== 0){
      const ny = entity.y + dy;
      if (!collidesWall(entity.x, ny, entity.w, entity.h)){
        entity.y = ny;
      } else {
        const step = dy > 0 ? 1 : -1;
        while (!collidesWall(entity.x, entity.y + step, entity.w, entity.h)){
          entity.y += step;
        }
        entity.vy = 0;
      }
    }
  }

  /* ========== 背景渲染（预渲染到离屏） ========== */
  function renderMapToCanvas(cv, tiles){
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    for (let y=0;y<MAP_H;y++){
      for (let x=0;x<MAP_W;x++){
        const t = tiles[y][x];
        const px = x*TILE, py = y*TILE;
        if (t === 1){
          // 墙
          c.fillStyle = PAL.wall2;
          c.fillRect(px, py, TILE, TILE);
          // 斑驳纹理
          const seed = (x*73 + y*131) % 100;
          if (seed < 20){
            c.fillStyle = PAL.wall1;
            c.fillRect(px+2, py+2, TILE-4, 3);
          }
          if (seed > 60){
            c.fillStyle = PAL.wall3;
            c.fillRect(px+4, py+TILE-5, TILE-8, 2);
          }
          if (seed > 80){
            c.fillStyle = PAL.wallShadow;
            c.fillRect(px+TILE-3, py+6, 2, TILE-10);
          }
          // 墙角高光
          c.fillStyle = PAL.wallHighlight;
          c.fillRect(px, py, TILE, 2);
          c.fillRect(px, py, 2, TILE);
        } else if (t === 0){
          // 地板
          c.fillStyle = PAL.floor1;
          c.fillRect(px, py, TILE, TILE);
          // 地毯花纹
          const seed = (x*37 + y*59) % 100;
          if (seed < 15){
            c.fillStyle = PAL.floorSpot;
            c.fillRect(px+4, py+6, 3, 2);
            c.fillRect(px+10, py+18, 2, 3);
          } else if (seed < 25){
            c.fillStyle = PAL.floorStain;
            c.fillRect(px+8, py+12, 4, 2);
          }
          // 格子线
          c.strokeStyle = 'rgba(0,0,0,0.06)';
          c.lineWidth = 1;
          c.strokeRect(px+0.5, py+0.5, TILE-1, TILE-1);
        } else if (t === 3){
          // 楼梯出口
          c.fillStyle = PAL.floor2;
          c.fillRect(px, py, TILE, TILE);
          // 楼梯向下
          c.fillStyle = PAL.exit2;
          c.fillRect(px+4, py+4, TILE-8, TILE-8);
          c.fillStyle = PAL.exit1;
          for (let i=0;i<4;i++){
            c.fillRect(px+6+i*5, py+6+i*5, TILE-12-i*10, 2);
          }
          // 绿色箭头
          c.fillStyle = PAL.exit1;
          c.fillRect(px+TILE/2-1, py+TILE-6, 2, 4);
          c.fillRect(px+TILE/2-3, py+TILE-8, 6, 2);
        }
      }
    }
  }

  /* ========== 玩家创建 ========== */
  function makePlayer(id, x, y, variant){
    return {
      id, x, y,
      w: 20, h: 26,
      vx: 0, vy: 0,
      hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP,
      oxygen: PLAYER_MAX_OX, maxOxygen: PLAYER_MAX_OX,
      flashbangs: 3,
      facing: 'down',         // up/down/left/right
      state: 'idle',          // idle/walking/attacking/blocking/hurt/dead
      stateTimer: 0,
      attackCooldown: 0,
      animFrame: 0, animTimer: 0,
      invulnTimer: 0,
      isPlayer: true,
      variant: variant || 'alpha',
      hurtFlash: 0,
    };
  }

  /* ========== 敌人创建 ========== */
  function makeZombie(x,y){
    return {
      type:'zombie', x, y,
      w: 22, h: 24,
      vx:0, vy:0,
      hp: ZOMBIE_HP, maxHp: ZOMBIE_HP,
      state: 'idle', stateTimer: 0,
      stunTimer: 0,
      animFrame:0, animTimer:0,
      speed: ZOMBIE_SPEED + rand(-10,10),
      damage: ZOMBIE_DAMAGE,
      alertRange: 180,
      facing:'down',
    };
  }
  function makeBug(x,y){
    return {
      type:'bug', x, y,
      w: 16, h: 16,
      vx:0, vy:0,
      hp: BUG_HP, maxHp: BUG_HP,
      state: 'idle', stateTimer: 0,
      stunTimer: 0,
      animFrame:0, animTimer:0,
      speed: BUG_SPEED,
      damage: BUG_DAMAGE,
      diveCooldown: rand(0.5, BUG_DIVE_COOLDOWN),
      hoverT: Math.random()*Math.PI*2,
      homeX: x, homeY: y,
    };
  }
  function makeGas(x,y,r){
    return { x, y, r: r||60, damageTimer: 0 };
  }
  function makeItem(x,y,type){
    return { x, y, type, w:14, h:14, bobT: Math.random()*Math.PI*2 };
    // type: 'oxygen' | 'flashbang' | 'medkit'
  }

  /* ========== 生成楼层内容 ========== */
  function populateLevel(level){
    G.enemies = [];
    G.gasses = [];
    G.items = [];
    G.particles = [];

    const rooms = G.map.rooms;
    const startRoom = rooms[0];

    // 玩家放在起始房间
    G.players[0].x = (startRoom.x + 2) * TILE;
    G.players[0].y = (startRoom.y + 2) * TILE;
    G.players[0].hp = G.players[0].maxHp;
    // 氧气不回满，但回一点
    G.players[0].oxygen = Math.min(G.players[0].maxOxygen, G.players[0].oxygen + 30);
    G.players[0].state = 'idle';
    G.players[0].invulnTimer = 1;

    if (G.players[1]){
      G.players[1].x = (startRoom.x + 3) * TILE;
      G.players[1].y = (startRoom.y + 2) * TILE;
      G.players[1].hp = G.players[1].maxHp;
      G.players[1].oxygen = Math.min(G.players[1].maxOxygen, G.players[1].oxygen + 30);
      G.players[1].state = 'idle';
      G.players[1].invulnTimer = 1;
    }

    // 敌人数量随楼层增加
    const zombieCount = 3 + Math.floor(level * 0.8);
    const bugCount = 1 + Math.floor(level * 0.5);
    const gasCount = level >= 2 ? 1 + Math.floor(level/3) : 0;
    const itemCount = 2 + Math.floor(level/2);

    // 在非起始房间生成
    const validRooms = rooms.slice(1);
    for (let i=0;i<zombieCount;i++){
      const r = validRooms[irand(0, validRooms.length-1)];
      const ex = (r.x + 1 + Math.random()*(r.w-2)) * TILE;
      const ey = (r.y + 1 + Math.random()*(r.h-2)) * TILE;
      G.enemies.push(makeZombie(ex, ey));
    }
    for (let i=0;i<bugCount;i++){
      const r = validRooms[irand(0, validRooms.length-1)];
      const ex = (r.x + 1 + Math.random()*(r.w-2)) * TILE;
      const ey = (r.y + 1 + Math.random()*(r.h-2)) * TILE;
      G.enemies.push(makeBug(ex, ey));
    }
    // 毒气云
    for (let i=0;i<gasCount;i++){
      const r = validRooms[irand(0, validRooms.length-1)];
      const ex = (r.x + r.w/2) * TILE;
      const ey = (r.y + r.h/2) * TILE;
      G.gasses.push(makeGas(ex, ey, 50 + level*5));
    }
    // 道具
    const itemTypes = ['oxygen', 'oxygen', 'flashbang', 'medkit'];
    for (let i=0;i<itemCount;i++){
      const r = validRooms[irand(0, validRooms.length-1)];
      const ex = (r.x + 1 + Math.random()*(r.w-2)) * TILE;
      const ey = (r.y + 1 + Math.random()*(r.h-2)) * TILE;
      const type = itemTypes[irand(0, itemTypes.length-1)];
      G.items.push(makeItem(ex, ey, type));
    }
  }

  /* ========== 开始新楼层 ========== */
  function nextLevel(){
    G.level++;
    G.map = generateMap(G.level);
    populateLevel(G.level);
    G.camera.x = G.players[0].x - VW/2;
    G.camera.y = G.players[0].y - VH/2;
    el.levelBadge.textContent = 'LEVEL ' + G.level;
    flashScreen('#fffde7', 0.4);
    G.shake = 8;
  }

  /* ========== 玩家更新 ========== */
  function updatePlayer(p, input, dt){
    if (p.state === 'dead') return;

    // 计时器
    if (p.invulnTimer > 0) p.invulnTimer -= dt;
    if (p.attackCooldown > 0) p.attackCooldown -= dt;
    if (p.hurtFlash > 0) p.hurtFlash -= dt;

    // 氧气消耗
    let inGas = false;
    for (const g of G.gasses){
      if (dist(p.x+p.w/2, p.y+p.h/2, g.x, g.y) < g.r){ inGas = true; break; }
    }
    const oxyRate = inGas ? OXY_DRAIN_GAS : OXY_DRAIN_NORMAL;
    p.oxygen -= oxyRate * dt;
    if (p.oxygen <= 0){
      p.oxygen = 0;
      // 缺氧掉血
      p.hp -= 3 * dt;
    }
    if (inGas){
      // 防毒面具减伤
      p.hp -= GAS_DAMAGE * 0.3 * dt;
    }

    // 移动
    let dx = 0, dy = 0;
    const canMove = p.state !== 'attacking' && p.state !== 'hurt';
    const blocking = input.block && canMove && p.state !== 'attacking';

    if (canMove && !blocking){
      if (input.left) dx -= 1;
      if (input.right) dx += 1;
      if (input.up) dy -= 1;
      if (input.down) dy += 1;
      // 归一化
      if (dx !== 0 && dy !== 0){ const s = 0.7071; dx *= s; dy *= s; }
    } else if (blocking){
      p.state = 'blocking';
      // 格挡时慢速移动
      if (input.left) dx -= 0.4;
      if (input.right) dx += 0.4;
      if (input.up) dy -= 0.4;
      if (input.down) dy += 0.4;
      if (dx !== 0 && dy !== 0){ const s = 0.7071; dx *= s; dy *= s; }
    }

    const spd = blocking ? PLAYER_SPEED * 0.4 : PLAYER_SPEED;
    moveWithCollision(p, dx * spd * dt, dy * spd * dt);

    // 朝向
    if (canMove && (dx !== 0 || dy !== 0)){
      if (Math.abs(dx) > Math.abs(dy)) p.facing = dx > 0 ? 'right' : 'left';
      else p.facing = dy > 0 ? 'down' : 'up';
    }

    // 状态
    if (p.state === 'hurt'){
      p.stateTimer -= dt;
      if (p.stateTimer <= 0) p.state = 'idle';
    }
    if (p.state === 'attacking'){
      p.stateTimer -= dt;
      if (p.stateTimer <= 0) p.state = 'idle';
    }
    if (p.state === 'blocking' && !blocking){
      p.state = 'idle';
    }

    // 步行/待机
    if (canMove && !blocking && p.state !== 'attacking' && p.state !== 'hurt'){
      if (dx !== 0 || dy !== 0) p.state = 'walking';
      else p.state = 'idle';
    }

    // 攻击
    if (input.attack && p.attackCooldown <= 0 && canMove){
      p.state = 'attacking';
      p.stateTimer = 0.28;
      p.attackCooldown = MELEE_COOLDOWN;
      performMeleeAttack(p);
    }

    // 闪光弹
    if (input.flashbang && p.flashbangs > 0 && canMove){
      p.flashbangs--;
      throwFlashbang(p);
    }

    // 动画帧
    p.animTimer += dt;
    const fps = p.state === 'walking' ? 8 : (p.state === 'attacking' ? 16 : 3);
    if (p.animTimer >= 1/fps){
      p.animTimer = 0;
      p.animFrame = (p.animFrame + 1) % animFrameCount(p.state);
    }

    // 检测到达出口
    const tx = Math.floor((p.x + p.w/2) / TILE);
    const ty = Math.floor((p.y + p.h/2) / TILE);
    if (G.map.tiles[ty] && G.map.tiles[ty][tx] === 3){
      nextLevel();
      return;
    }

    // 探索记录
    markExplored(p.x + p.w/2, p.y + p.h/2);
  }

  function animFrameCount(state){
    switch(state){
      case 'walking': return 4;
      case 'attacking': return 3;
      case 'blocking': return 1;
      case 'hurt': return 2;
      default: return 2;
    }
  }

  /* ========== 近战攻击 ========== */
  function performMeleeAttack(p){
    // 攻击判定矩形（基于朝向）
    const cx = p.x + p.w/2;
    const cy = p.y + p.h/2;
    let rx = cx, ry = cy, rw = MELEE_RANGE, rh = MELEE_ARC;
    if (p.facing === 'right'){ rx = cx; ry = cy - MELEE_ARC/2; }
    else if (p.facing === 'left'){ rx = cx - MELEE_RANGE; ry = cy - MELEE_ARC/2; }
    else if (p.facing === 'down'){ rx = cx - MELEE_ARC/2; ry = cy; rw = MELEE_ARC; rh = MELEE_RANGE; }
    else { rx = cx - MELEE_ARC/2; ry = cy - MELEE_RANGE; rw = MELEE_ARC; rh = MELEE_RANGE; }

    for (const e of G.enemies){
      if (e.state === 'dead') continue;
      if (rectsOverlap(rx, ry, rw, rh, e.x, e.y, e.w, e.h)){
        hitEnemy(e, MELEE_DAMAGE, p.facing);
      }
    }
    // 命中粒子
    spawnHitParticles(cx + (p.facing==='right'?MELEE_RANGE/2 : p.facing==='left'?-MELEE_RANGE/2:0),
                      cy + (p.facing==='down'?MELEE_RANGE/2 : p.facing==='up'?-MELEE_RANGE/2:0),
                      '#fff');
  }

  function hitEnemy(e, dmg, fromDir){
    e.hp -= dmg;
    e.stunTimer = 0.2;
    e.hurtFlash = 0.15;
    // 击退
    const kb = 20;
    if (fromDir === 'right') e.x -= kb;
    else if (fromDir === 'left') e.x += kb;
    else if (fromDir === 'down') e.y -= kb;
    else e.y += kb;
    spawnHitParticles(e.x+e.w/2, e.y+e.h/2, PAL.blood, false);

    if (e.hp <= 0){
      e.state = 'dead';
      G.kills++;
      G.shake = Math.max(G.shake, 4);
      // 死亡粒子
      for (let i=0;i<12;i++){
        G.particles.push({
          x: e.x+e.w/2, y: e.y+e.h/2,
          vx: rand(-80,80), vy: rand(-100,20),
          life: rand(0.4,0.8), maxLife: 0.8,
          color: PAL.blood, size: irand(2,4),
          gravity: 200,
        });
      }
    }
  }

  /* ========== 闪光弹 ========== */
  function throwFlashbang(p){
    const cx = p.x + p.w/2;
    const cy = p.y + p.h/2;
    const fwd = 80;
    let tx = cx, ty = cy;
    if (p.facing === 'right') tx += fwd;
    else if (p.facing === 'left') tx -= fwd;
    else if (p.facing === 'down') ty += fwd;
    else ty -= fwd;

    // 延时 0.5 秒后爆炸（简化：直接爆炸）
    flashScreen(PAL.flash, 0.5);
    G.shake = 6;

    // 眩晕范围内敌人
    for (const e of G.enemies){
      if (e.state === 'dead') continue;
      if (dist(tx, ty, e.x+e.w/2, e.y+e.h/2) < FLASHBANG_RADIUS){
        e.stunTimer = FLASHBANG_STUN;
        e.state = 'stunned';
      }
    }
    // 粒子
    for (let i=0;i<20;i++){
      G.particles.push({
        x: tx, y: ty,
        vx: rand(-120,120), vy: rand(-120,120),
        life: rand(0.3,0.7), maxLife: 0.7,
        color: PAL.flash, size: irand(2,4),
        gravity: 0,
      });
    }
  }

  /* ========== 敌人 AI ========== */
  function updateEnemy(e, dt){
    if (e.state === 'dead'){
      // 死亡动画后保持不动
      return;
    }
    if (e.hurtFlash > 0) e.hurtFlash -= dt;
    if (e.stunTimer > 0){
      e.stunTimer -= dt;
      e.state = 'stunned';
      e.vx *= 0.9; e.vy *= 0.9;
      if (e.stunTimer <= 0) e.state = 'idle';
      return;
    }

    // 找最近玩家
    let target = null, minD = 99999;
    for (const p of G.players){
      if (!p || p.state === 'dead') continue;
      const d = dist(e.x+e.w/2, e.y+e.h/2, p.x+p.w/2, p.y+p.h/2);
      if (d < minD){ minD = d; target = p; }
    }
    if (!target) return;

    if (e.type === 'zombie'){
      updateZombie(e, target, minD, dt);
    } else if (e.type === 'bug'){
      updateBug(e, target, minD, dt);
    }
  }

  function updateZombie(e, target, d, dt){
    const cx = e.x + e.w/2, cy = e.y + e.h/2;
    const tx = target.x + target.w/2, ty = target.y + target.h/2;

    // 感知范围内追击
    if (d < e.alertRange || e.state === 'chase'){
      e.state = 'chase';
      const dx = tx - cx, dy = ty - cy;
      const len = Math.sqrt(dx*dx+dy*dy) || 1;
      const nx = dx/len, ny = dy/len;
      moveWithCollision(e, nx * e.speed * dt, ny * e.speed * dt);
      e.facing = Math.abs(dx) > Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up');

      // 接触伤害
      if (d < 24){
        damagePlayer(target, e.damage * dt, e);
      }
    } else {
      e.state = 'idle';
    }

    // 动画
    e.animTimer += dt;
    const fps = e.state === 'chase' ? 6 : 2;
    if (e.animTimer >= 1/fps){ e.animTimer = 0; e.animFrame = (e.animFrame+1)%4; }
  }

  function updateBug(e, target, d, dt){
    const cx = e.x + e.w/2, cy = e.y + e.h/2;
    const tx = target.x + target.w/2, ty = target.y + target.h/2;

    e.diveCooldown -= dt;
    e.hoverT += dt * 3;

    if (e.state === 'diving'){
      // 俯冲中
      moveWithCollision(e, e.vx * dt, e.vy * dt);
      e.stateTimer -= dt;
      if (d < 18){
        damagePlayer(target, e.damage, e);
        e.state = 'retreat';
        e.stateTimer = 1.0;
        e.diveCooldown = BUG_DIVE_COOLDOWN;
      }
      if (e.stateTimer <= 0){
        e.state = 'retreat';
        e.stateTimer = 0.8;
      }
    } else if (e.state === 'retreat'){
      // 飞回原位附近
      const dx = e.homeX - cx, dy = e.homeY - cy;
      const len = Math.sqrt(dx*dx+dy*dy) || 1;
      moveWithCollision(e, dx/len * e.speed * 0.6 * dt, dy/len * e.speed * 0.6 * dt);
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) e.state = 'hover';
    } else {
      // 盘旋
      e.state = 'hover';
      // 缓慢接近目标
      if (d < 200){
        const dx = tx - cx, dy = ty - cy;
        const len = Math.sqrt(dx*dx+dy*dy) || 1;
        moveWithCollision(e, dx/len * e.speed * 0.3 * dt, dy/len * e.speed * 0.3 * dt);
        // 俯冲
        if (d < 80 && e.diveCooldown <= 0){
          e.state = 'diving';
          e.stateTimer = 0.6;
          e.vx = dx/len * e.speed * 1.8;
          e.vy = dy/len * e.speed * 1.8;
        }
      } else {
        // 悬停摆动
        const hx = Math.sin(e.hoverT) * 10;
        const hy = Math.cos(e.hoverT*0.7) * 8;
        e.x += hx * dt * 2;
        e.y += hy * dt * 2;
      }
    }

    // 动画
    e.animTimer += dt;
    if (e.animTimer >= 1/20){ e.animTimer = 0; e.animFrame = (e.animFrame+1)%2; }
  }

  /* ========== 玩家受伤 ========== */
  function damagePlayer(p, amount, source){
    if (p.invulnTimer > 0 || p.state === 'dead') return;

    // 格挡检测
    let dmg = amount;
    if (p.state === 'blocking' || (p.state === 'idle' && keysDown.has(p.id===0?'KeyL':'Digit3'))){
      // 正面格挡：源方向与朝向相反则格挡
      const sx = source.x + source.w/2;
      const sy = source.y + source.h/2;
      const px = p.x + p.w/2, py = p.y + p.h/2;
      const dx = sx - px, dy = sy - py;
      let front = false;
      if (p.facing === 'right' && dx > 0) front = true;
      else if (p.facing === 'left' && dx < 0) front = true;
      else if (p.facing === 'down' && dy > 0) front = true;
      else if (p.facing === 'up' && dy < 0) front = true;
      if (front) dmg *= BLOCK_REDUCTION;
    }

    p.hp -= dmg;
    p.invulnTimer = INVULN_TIME;
    p.hurtFlash = 0.2;
    G.shake = Math.max(G.shake, 3);

    // 血溅粒子
    for (let i=0;i<8;i++){
      G.particles.push({
        x: p.x+p.w/2, y: p.y+p.h/2,
        vx: rand(-100,100), vy: rand(-80,20),
        life: rand(0.3,0.6), maxLife: 0.6,
        color: PAL.blood, size: irand(2,3),
        gravity: 180,
      });
    }

    if (p.hp <= 0){
      p.hp = 0;
      p.state = 'dead';
      checkGameOver();
    }
  }

  /* ========== 道具拾取 ========== */
  function checkItemPickup(p){
    if (p.state === 'dead') return;
    for (let i=G.items.length-1;i>=0;i--){
      const it = G.items[i];
      if (rectsOverlap(p.x,p.y,p.w,p.h, it.x,it.y,it.w,it.h)){
        applyItem(p, it.type);
        G.items.splice(i,1);
        // 拾取粒子
        for (let j=0;j<10;j++){
          G.particles.push({
            x: it.x+it.w/2, y: it.y+it.h/2,
            vx: rand(-60,60), vy: rand(-80,-20),
            life: rand(0.3,0.6), maxLife: 0.6,
            color: it.type==='oxygen'? '#2ecc71' : it.type==='medkit'? '#e74c3c' : '#fffde7',
            size: irand(2,3), gravity: 100,
          });
        }
      }
    }
  }
  function applyItem(p, type){
    if (type === 'oxygen'){ p.oxygen = Math.min(p.maxOxygen, p.oxygen + 50); }
    else if (type === 'medkit'){ p.hp = Math.min(p.maxHp, p.hp + 30); }
    else if (type === 'flashbang'){ p.flashbangs = Math.min(6, p.flashbangs + 2); }
  }

  /* ========== 毒气云伤害 ========== */
  function updateGas(dt){
    for (const g of G.gasses){
      g.damageTimer -= dt;
      if (g.damageTimer <= 0){
        g.damageTimer = 0.2;
        for (const p of G.players){
          if (!p || p.state === 'dead') continue;
          if (dist(p.x+p.w/2, p.y+p.h/2, g.x, g.y) < g.r){
            // 防毒面具已在玩家更新中计，这里只做额外伤害
            // 已在 updatePlayer 的 inGas 中处理
          }
        }
      }
      // 毒气云轻微脉动
      g.pulse = (g.pulse || 0) + dt * 2;
    }
  }

  /* ========== 粒子更新 ========== */
  function updateParticles(dt){
    for (let i=G.particles.length-1;i>=0;i--){
      const p = G.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      p.life -= dt;
      if (p.life <= 0) G.particles.splice(i,1);
    }
    if (G.particles.length > 80) G.particles.splice(0, G.particles.length-80);
  }
  function spawnHitParticles(x,y,color,big){
    const n = big ? 10 : 5;
    for (let i=0;i<n;i++){
      G.particles.push({
        x, y,
        vx: rand(-60,60), vy: rand(-70,-10),
        life: rand(0.2,0.5), maxLife: 0.5,
        color, size: big? irand(2,4): irand(1,3),
        gravity: 150,
      });
    }
  }

  /* ========== 游戏结束检测 ========== */
  function checkGameOver(){
    let allDead = true;
    for (const p of G.players){
      if (p && p.state !== 'dead') allDead = false;
    }
    if (allDead) gameOver();
  }
  function gameOver(){
    G.state = 'dead';
    el.endTitle.textContent = 'YOU DIED';
    el.endLevel.textContent = G.level;
    el.endTime.textContent = Math.floor(G.timeAlive) + 's';
    el.endKills.textContent = G.kills;
    el.result.classList.remove('hidden');
    el.hud.classList.add('hidden');
    el.hint.classList.add('hidden');
    mmCanvas.classList.add('hidden');
  }

  /* ========== 探索标记 ========== */
  function markExplored(x, y){
    const radius = 6; // 瓦片
    const tx = Math.floor(x/TILE);
    const ty = Math.floor(y/TILE);
    for (let dy=-radius; dy<=radius; dy++){
      for (let dx=-radius; dx<=radius; dx++){
        const xx = tx+dx, yy = ty+dy;
        if (xx<0||yy<0||xx>=MAP_W||yy>=MAP_H) continue;
        if (dx*dx+dy*dy <= radius*radius) G.map.explored[yy][xx] = true;
      }
    }
  }

  /* ========== AI 队友 ========== */
  function updateAI(p, dt){
    const leader = G.players[0];
    if (!leader || leader.state === 'dead' || p.state === 'dead') return;

    const input = { up:false, down:false, left:false, right:false, attack:false, flashbang:false, block:false };
    const d = dist(p.x+p.w/2, p.y+p.h/2, leader.x+leader.w/2, leader.y+leader.h/2);

    // 找最近敌人
    let nearest = null, nd = 9999;
    for (const e of G.enemies){
      if (e.state === 'dead') continue;
      const d2 = dist(p.x,p.y,e.x,e.y);
      if (d2 < nd){ nd = d2; nearest = e; }
    }

    // 有敌人且较近 → 攻击
    if (nearest && nd < 50){
      // 面向敌人并攻击
      const ecx = nearest.x + nearest.w/2;
      const ecy = nearest.y + nearest.h/2;
      const pcx = p.x + p.w/2, pcy = p.y + p.h/2;
      const dx = ecx - pcx, dy = ecy - pcy;
      if (Math.abs(dx) > Math.abs(dy)){
        p.facing = dx > 0 ? 'right' : 'left';
      } else {
        p.facing = dy > 0 ? 'down' : 'up';
      }
      input.attack = Math.random() < 0.08; // 约 5 次/秒
      // 近距离格挡
      if (nd < 30 && Math.random() < 0.3) input.block = true;
    }

    // 跟随队长
    if (d > AI_FOLLOW_DIST){
      const dx = leader.x - p.x, dy = leader.y - p.y;
      const len = Math.sqrt(dx*dx+dy*dy) || 1;
      if (dx/len > 0.3) input.right = true;
      if (dx/len < -0.3) input.left = true;
      if (dy/len > 0.3) input.down = true;
      if (dy/len < -0.3) input.up = true;
    } else if (d < 40 && !nearest){
      // 太近就停下
      // 不输入方向
    }

    // 闪光弹：被包围时
    if (p.flashbangs > 0 && nearest && nd < 100){
      let nearCount = 0;
      for (const e of G.enemies){
        if (e.state==='dead'||e.stunTimer>0) continue;
        if (dist(p.x,p.y,e.x,e.y) < 80) nearCount++;
      }
      if (nearCount >= 3 && Math.random() < 0.01){
        input.flashbang = true;
      }
    }

    return input;
  }

  /* ========== 相机 ========== */
  function updateCamera(dt){
    // 以玩家 1 为中心
    const p = G.players[0];
    if (!p) return;
    const targetX = p.x + p.w/2 - VW/2;
    const targetY = p.y + p.h/2 - VH/2;
    G.camera.x += (targetX - G.camera.x) * CAMERA_LERP * dt;
    G.camera.y += (targetY - G.camera.y) * CAMERA_LERP * dt;
    // 限制在地图范围内
    G.camera.x = clamp(G.camera.x, 0, MAP_W*TILE - VW);
    G.camera.y = clamp(G.camera.y, 0, MAP_H*TILE - VH);
  }

  /* ========== 闪光 ========== */
  function flashScreen(color, time){
    G.flashColor = color;
    G.flashAmt = 1;
    G.flashTimer = time;
  }

  /* ========== 渲染 ========== */
  function render(){
    ctx.save();

    // 震屏
    if (G.shake > 0){
      ctx.translate((Math.random()*2-1)*G.shake, (Math.random()*2-1)*G.shake);
      G.shake *= 0.88;
      if (G.shake < 0.1) G.shake = 0;
    }

    // 背景（地图）
    if (G.map){
      const cx = Math.floor(G.camera.x);
      const cy = Math.floor(G.camera.y);
      ctx.drawImage(G.map.bgCanvas, cx, cy, VW, VH, 0, 0, VW, VH);

      // 毒气云
      for (const g of G.gasses){
        const sx = g.x - cx, sy = g.y - cy;
        if (sx < -g.r || sx > VW+g.r || sy < -g.r || sy > VH+g.r) continue;
        const pulse = 1 + Math.sin((g.pulse||0)) * 0.08;
        const r = g.r * pulse;
        const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
        grd.addColorStop(0, PAL.gasGreen + '0.45)');
        grd.addColorStop(0.6, PAL.gasGreen + '0.25)');
        grd.addColorStop(1, PAL.gasGreen + '0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI*2); ctx.fill();
      }

      // 道具
      for (const it of G.items){
        const sx = it.x - cx, sy = it.y - cy;
        if (sx < -30 || sx > VW+30 || sy < -30 || sy > VH+30) continue;
        drawItem(it, sx, sy);
      }

      // 敌人
      for (const e of G.enemies){
        const sx = e.x - cx, sy = e.y - cy;
        if (sx < -50 || sx > VW+50 || sy < -50 || sy > VH+50) continue;
        if (e.type === 'zombie') drawZombie(e, sx, sy);
        else if (e.type === 'bug') drawBug(e, sx, sy);
      }

      // 玩家
      for (const p of G.players){
        if (!p) continue;
        const sx = p.x - cx, sy = p.y - cy;
        drawPlayer(p, sx, sy);
      }

      // 粒子
      for (const p of G.particles){
        const sx = p.x - cx, sy = p.y - cy;
        ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
        ctx.fillStyle = p.color;
        ctx.fillRect(sx|0, sy|0, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      // 黑暗/光照遮罩（雾效）
      drawLighting(cx, cy);
    } else {
      ctx.fillStyle = '#0d0a04';
      ctx.fillRect(0, 0, VW, VH);
    }

    ctx.restore();

    // 全屏闪光
    if (G.flashTimer > 0){
      ctx.globalAlpha = G.flashAmt * (G.flashTimer / 0.5);
      ctx.fillStyle = G.flashColor || '#fff';
      ctx.fillRect(0, 0, VW, VH);
      ctx.globalAlpha = 1;
    }

    // 低血红视效果
    const p1 = G.players[0];
    if (p1 && p1.hp < 30){
      const intensity = (30 - p1.hp) / 30 * 0.5;
      ctx.globalAlpha = intensity * (0.5 + 0.5*Math.sin(performance.now()/200));
      ctx.fillStyle = 'rgba(192,57,43,0.3)';
      ctx.fillRect(0,0,VW,VH);
      ctx.globalAlpha = 1;
    }
  }

  /* ---------- 光照/雾效 ---------- */
  function drawLighting(cx, cy){
    // 径向渐变：玩家位置亮，远处暗
    const p = G.players[0];
    if (!p) return;
    const px = p.x + p.w/2 - cx;
    const py = p.y + p.h/2 - cy;

    const grd = ctx.createRadialGradient(px, py, 40, px, py, 260);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(0.5, 'rgba(0,0,0,0.3)');
    grd.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, VW, VH);

    // 手电光锥
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    let dx=0, dy=0;
    if (p.facing === 'right') dx = 1;
    else if (p.facing === 'left') dx = -1;
    else if (p.facing === 'down') dy = 1;
    else dy = -1;
    const angle = Math.atan2(dy, dx);
    ctx.translate(px, py);
    ctx.rotate(angle);
    const coneGrd = ctx.createLinearGradient(0, 0, 180, 0);
    coneGrd.addColorStop(0, 'rgba(255,248,180,0.25)');
    coneGrd.addColorStop(1, 'rgba(255,248,180,0)');
    ctx.fillStyle = coneGrd;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(180, -60);
    ctx.lineTo(180, 60);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ---------- 玩家绘制（程序化像素） ---------- */
  function drawPlayer(p, sx, sy){
    ctx.save();
    // 闪烁（无敌帧）
    if (p.invulnTimer > 0 && Math.floor(p.invulnTimer * 20) % 2 === 0){
      ctx.globalAlpha = 0.5;
    }

    const dir = p.facing;
    const bob = p.state === 'walking' ? (p.animFrame % 2 === 0 ? -1 : 0) : 0;

    // 阴影
    ctx.globalAlpha *= 0.4;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(sx + p.w/2, sy + p.h + 1, p.w*0.5, 3, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = p.invulnTimer > 0 && Math.floor(p.invulnTimer * 20) % 2 === 0 ? 0.5 : 1;

    const px = Math.floor(sx + p.w/2);
    const py = Math.floor(sy + p.h + bob);
    const S = 2;   // 像素大小

    // 颜色（variant）
    const c = p.variant === 'bravo'
      ? { suit:'#b8a848', suit2:'#9a8a30', mask:'#1a1a1a', filter:'#3498db', tank:'#8a8a7a', boot:'#3a3a2a', accent:'#ffd700' }
      : { suit:'#e8d45a', suit2:'#d4c044', mask:'#1a1a1a', filter:'#c0392b', tank:'#b8b8a8', boot:'#3a3a2a', accent:'#fffde7' };

    // 角色朝向不同绘制不同视角
    // 统一用俯视角度，简化为 4 方向
    // 基础身体：中心在 px, 脚下在 py
    const bx = px;
    const by = py;

    // 腿
    const legOff = p.state === 'walking' ? (p.animFrame < 2 ? 2 : -2) : 0;
    ctx.fillStyle = c.boot;
    ctx.fillRect(bx - 5*S, by - 3*S, 3*S, 3*S);       // 左脚
    ctx.fillRect(bx + 2*S, by - 3*S + Math.abs(legOff), 3*S, 3*S); // 右脚
    ctx.fillStyle = c.suit2;
    ctx.fillRect(bx - 5*S, by - 6*S, 3*S, 3*S);       // 左小腿
    ctx.fillRect(bx + 2*S, by - 6*S + Math.abs(legOff), 3*S, 3*S);

    // 躯干 (防化服主体)
    ctx.fillStyle = c.suit;
    ctx.fillRect(bx - 7*S, by - 14*S, 14*S, 8*S);
    ctx.fillStyle = c.suit2;
    ctx.fillRect(bx - 7*S, by - 8*S, 14*S, 2*S);      // 腰带
    ctx.fillRect(bx - 7*S, by - 14*S, 2*S, 8*S);      // 左肩暗
    // 胸前反光条
    ctx.fillStyle = c.accent;
    ctx.fillRect(bx - 5*S, by - 12*S, 10*S, 1*S);

    // 氧气瓶（背后，根据朝向调整可见度）
    if (dir === 'up'){
      ctx.fillStyle = c.tank;
      ctx.fillRect(bx - 4*S, by - 14*S, 8*S, 6*S);
      ctx.fillStyle = '#6a6a5a';
      ctx.fillRect(bx - 4*S, by - 14*S, 8*S, 1*S);
      ctx.fillRect(bx - 1, by - 15*S, 2, S);  // 阀门
    } else {
      // 侧面看到一点氧气瓶
      ctx.fillStyle = c.tank;
      ctx.globalAlpha *= 0.7;
      if (dir === 'left'){
        ctx.fillRect(bx + 4*S, by - 13*S, 2*S, 6*S);
      } else if (dir === 'right'){
        ctx.fillRect(bx - 6*S, by - 13*S, 2*S, 6*S);
      }
      ctx.globalAlpha = p.invulnTimer > 0 && Math.floor(p.invulnTimer * 20) % 2 === 0 ? 0.5 : 1;
    }

    // 手臂
    ctx.fillStyle = c.suit;
    if (p.state === 'attacking'){
      // 挥击动画
      const f = p.animFrame;
      let reach = [0, 8*S, 4*S][f];
      let armX, armY;
      if (dir === 'right'){ armX = bx + 5*S + reach; armY = by - 12*S; }
      else if (dir === 'left'){ armX = bx - 5*S - reach - 2*S; armY = by - 12*S; }
      else if (dir === 'down'){ armX = bx - 1*S; armY = by - 6*S + reach; }
      else { armX = bx - 1*S; armY = by - 14*S - reach; }
      ctx.fillRect(armX, armY, 2*S, 4*S);
      // 警棍/手
      ctx.fillStyle = c.boot;
      if (dir === 'right' || dir === 'left'){
        ctx.fillRect(armX + (dir==='right'?0:-1), armY + 3*S, 3*S, 1*S);
      } else {
        ctx.fillRect(armX - 1*S, armY + (dir==='down'?3*S:-1), 4*S, 1*S);
      }
    } else if (p.state === 'blocking'){
      // 双臂前举格挡
      if (dir === 'right'){
        ctx.fillStyle = c.suit;
        ctx.fillRect(bx + 5*S, by - 13*S, 3*S, 6*S);
        ctx.fillStyle = c.filter;
        ctx.fillRect(bx + 8*S, by - 14*S, 2*S, 8*S);  // 防暴盾
      } else if (dir === 'left'){
        ctx.fillStyle = c.suit;
        ctx.fillRect(bx - 8*S, by - 13*S, 3*S, 6*S);
        ctx.fillStyle = c.filter;
        ctx.fillRect(bx - 10*S, by - 14*S, 2*S, 8*S);
      } else if (dir === 'down'){
        ctx.fillStyle = c.suit;
        ctx.fillRect(bx - 6*S, by - 6*S, 12*S, 2*S);
        ctx.fillStyle = c.filter;
        ctx.fillRect(bx - 6*S, by - 4*S, 12*S, 2*S);
      } else {
        ctx.fillStyle = c.suit;
        ctx.fillRect(bx - 6*S, by - 15*S, 12*S, 2*S);
      }
    } else {
      // 普通手臂
      const sway = p.state === 'walking' ? (p.animFrame % 2 === 0 ? S : -S) : 0;
      ctx.fillRect(bx - 7*S, by - 13*S + sway, 2*S, 5*S);
      ctx.fillRect(bx + 5*S, by - 13*S - sway, 2*S, 5*S);
      // 手
      ctx.fillStyle = c.boot;
      ctx.fillRect(bx - 7*S, by - 8*S + sway, 2*S, 1*S);
      ctx.fillRect(bx + 5*S, by - 8*S - sway, 2*S, 1*S);
    }

    // 头 + 防毒面具
    const headY = by - 18*S;
    ctx.fillStyle = c.suit;
    ctx.fillRect(bx - 4*S, headY, 8*S, 4*S);       // 头套
    // 防毒面具（面罩）
    ctx.fillStyle = c.mask;
    ctx.fillRect(bx - 4*S, headY + 1*S, 8*S, 3*S);
    // 滤毒罐（两侧）
    ctx.fillStyle = c.filter;
    if (dir === 'front' || dir === 'down'){
      ctx.fillRect(bx - 5*S, headY + 1*S, 1*S, 2*S);
      ctx.fillRect(bx + 4*S, headY + 1*S, 1*S, 2*S);
    } else if (dir === 'right'){
      ctx.fillRect(bx + 3*S, headY + 1*S, 2*S, 2*S);
    } else if (dir === 'left'){
      ctx.fillRect(bx - 5*S, headY + 1*S, 2*S, 2*S);
    }
    // 护目镜（发光）
    ctx.fillStyle = '#7fe0ff';
    if (dir === 'up'){
      ctx.fillRect(bx - 3*S, headY + 1*S, 6*S, 1*S);
    } else {
      ctx.fillRect(bx - 3*S, headY + 1*S, 2*S, 1*S);
      ctx.fillRect(bx + 1*S, headY + 1*S, 2*S, 1*S);
    }
    // 头顶灯
    ctx.fillStyle = c.accent;
    ctx.fillRect(bx - 1, headY - 1*S, 2, 1*S);

    // 闪白
    if (p.hurtFlash > 0){
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(255,255,255,' + (p.hurtFlash*3) + ')';
      ctx.fillRect(bx - 10*S, headY - S, 20*S, 20*S);
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
  }

  /* ---------- 丧尸绘制 ---------- */
  function drawZombie(e, sx, sy){
    ctx.save();
    const px = Math.floor(sx + e.w/2);
    const py = Math.floor(sy + e.h);
    const S = 2;

    // 阴影
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(px, sy+e.h+1, e.w*0.5, 3, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;

    const bob = e.state === 'chase' ? (e.animFrame % 2 === 0 ? -1 : 0) : 0;
    const tilt = e.state === 'chase' ? (e.animFrame % 2 === 0 ? 0.06 : -0.06) : 0;

    ctx.translate(px, py + bob*S);
    ctx.rotate(tilt);

    // 腿
    ctx.fillStyle = PAL.zombieCloth;
    const legOff = e.state === 'chase' ? (e.animFrame < 2 ? 2 : -2) : 0;
    ctx.fillRect(-5*S, -3*S, 3*S, 3*S);
    ctx.fillRect(2*S, -3*S + Math.abs(legOff), 3*S, 3*S);
    // 破损裤子
    ctx.fillStyle = '#6a5a3a';
    ctx.fillRect(-5*S, -6*S, 3*S, 3*S);
    ctx.fillRect(2*S, -6*S + Math.abs(legOff), 3*S, 3*S);

    // 躯干
    ctx.fillStyle = PAL.zombieCloth;
    ctx.fillRect(-6*S, -13*S, 12*S, 7*S);
    // 衣服撕裂
    ctx.fillStyle = PAL.zombieSkin;
    ctx.fillRect(-3*S, -10*S, 2*S, 3*S);
    ctx.fillRect(2*S, -9*S, 2*S, 2*S);
    // 血迹
    ctx.fillStyle = PAL.bloodDark;
    ctx.fillRect(-5*S, -11*S, 3*S, 1*S);
    ctx.fillRect(1*S, -7*S, 4*S, 1*S);

    // 手臂（前伸）
    ctx.fillStyle = PAL.zombieSkin;
    const armL = e.state==='chase' && e.animFrame%2===0 ? 6*S : 5*S;
    ctx.fillRect(-8*S, -12*S, 2*S, armL);
    ctx.fillRect(6*S, -12*S, 2*S, armL);
    // 手
    ctx.fillStyle = PAL.zombieSkin2;
    ctx.fillRect(-9*S, -12*S+armL-S, 3*S, 1*S);
    ctx.fillRect(6*S, -12*S+armL-S, 3*S, 1*S);

    // 头
    ctx.fillStyle = PAL.zombieSkin;
    ctx.fillRect(-4*S, -17*S, 8*S, 4*S);
    // 头发/秃
    ctx.fillStyle = '#3a3a2a';
    ctx.fillRect(-4*S, -17*S, 8*S, 1*S);
    // 红眼
    ctx.fillStyle = PAL.zombieEye;
    ctx.fillRect(-3*S, -15*S, 1*S, 1*S);
    ctx.fillRect(2*S, -15*S, 1*S, 1*S);
    // 嘴
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(-2*S, -13*S, 4*S, 1*S);

    // 眩晕
    if (e.stunTimer > 0){
      ctx.rotate(-tilt);
      ctx.fillStyle = '#fffde7';
      const t = performance.now()/100;
      for (let i=0;i<3;i++){
        const a = t + i*Math.PI*2/3;
        const sx2 = Math.cos(a)*12, sy2 = -18*S + Math.sin(a)*4 - 4;
        ctx.font = '10px VT323';
        ctx.fillText('★', sx2-4, sy2);
      }
    }

    // 血条
    if (e.hp < e.maxHp){
      ctx.rotate(-tilt);
      ctx.fillStyle = '#1a0a04';
      ctx.fillRect(-e.w/2, -20*S, e.w, 3);
      ctx.fillStyle = PAL.blood;
      ctx.fillRect(-e.w/2, -20*S, e.w * (e.hp/e.maxHp), 3);
    }

    ctx.restore();
  }

  /* ---------- 飞虫绘制 ---------- */
  function drawBug(e, sx, sy){
    ctx.save();
    const px = sx + e.w/2;
    const py = sy + e.h/2 + Math.sin(e.hoverT||0)*2;

    // 阴影（在下方）
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(px, py + 20, 8, 2, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 翅膀
    const wingFlap = e.animFrame === 0;
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = PAL.bugWing;
    if (wingFlap){
      ctx.beginPath();
      ctx.ellipse(px - 6, py - 2, 8, 4, -0.3, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(px + 6, py - 2, 8, 4, 0.3, 0, Math.PI*2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(px - 5, py, 6, 3, -0.5, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(px + 5, py, 6, 3, 0.5, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 身体
    ctx.fillStyle = PAL.bugBody;
    ctx.beginPath();
    ctx.ellipse(px, py, 5, 7, 0, 0, Math.PI*2);
    ctx.fill();
    // 分节
    ctx.fillStyle = '#1a1a0e';
    ctx.fillRect(px-4, py-1, 8, 1);
    ctx.fillRect(px-3, py+3, 6, 1);
    // 头
    ctx.fillStyle = '#2a2a1a';
    ctx.beginPath();
    ctx.arc(px, py - 5, 3, 0, Math.PI*2);
    ctx.fill();
    // 红眼睛
    ctx.fillStyle = PAL.bugEye;
    ctx.fillRect(px-2, py-5, 1, 1);
    ctx.fillRect(px+1, py-5, 1, 1);

    // 眩晕
    if (e.stunTimer > 0){
      ctx.fillStyle = '#fffde7';
      const t = performance.now()/100;
      ctx.font = '8px VT323';
      for (let i=0;i<2;i++){
        const a = t + i*Math.PI;
        ctx.fillText('·', px + Math.cos(a)*10 - 2, py - 10 + Math.sin(a)*3);
      }
    }

    // 血条
    if (e.hp < e.maxHp){
      ctx.fillStyle = '#1a0a04';
      ctx.fillRect(px - e.w/2, py - e.h/2 - 6, e.w, 2);
      ctx.fillStyle = PAL.blood;
      ctx.fillRect(px - e.w/2, py - e.h/2 - 6, e.w * (e.hp/e.maxHp), 2);
    }

    ctx.restore();
  }

  /* ---------- 道具绘制 ---------- */
  function drawItem(it, sx, sy){
    const bob = Math.sin(it.bobT + performance.now()/300) * 2;
    const px = sx + it.w/2;
    const py = sy + it.h/2 + bob;

    // 光晕
    ctx.globalAlpha = 0.3;
    if (it.type === 'oxygen') ctx.fillStyle = '#2ecc71';
    else if (it.type === 'medkit') ctx.fillStyle = '#e74c3c';
    else ctx.fillStyle = '#fffde7';
    ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;

    if (it.type === 'oxygen'){
      // 氧气罐
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(px-4, py-6, 8, 10);
      ctx.fillStyle = '#1a7a40';
      ctx.fillRect(px-4, py-6, 8, 2);
      ctx.fillStyle = '#8a8a7a';
      ctx.fillRect(px-2, py-8, 4, 3);
      ctx.fillStyle = '#fff';
      ctx.font = '8px VT323';
      ctx.fillText('O₂', px-5, py+1);
    } else if (it.type === 'medkit'){
      ctx.fillStyle = '#fff';
      ctx.fillRect(px-5, py-4, 10, 8);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(px-1, py-3, 2, 6);
      ctx.fillRect(px-4, py, 8, 2);
    } else if (it.type === 'flashbang'){
      ctx.fillStyle = '#fffde7';
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#8a8a7a';
      ctx.fillRect(px-1, py-7, 2, 3);
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(px-2, py-8, 4, 2);
    }
  }

  /* ---------- 小地图 ---------- */
  function renderMinimap(){
    if (!G.map) return;
    mmCtx.fillStyle = '#0a0804';
    mmCtx.fillRect(0, 0, 140, 140);
    const sx = 140 / MAP_W;
    const sy = 140 / MAP_H;
    for (let y=0; y<MAP_H; y++){
      for (let x=0; x<MAP_W; x++){
        if (!G.map.explored[y][x]) continue;
        const t = G.map.tiles[y][x];
        if (t === 1) mmCtx.fillStyle = '#6b5a2e';
        else if (t === 0) mmCtx.fillStyle = '#d4c86a';
        else if (t === 3) mmCtx.fillStyle = '#2ecc71';
        mmCtx.fillRect(x*sx, y*sy, Math.ceil(sx), Math.ceil(sy));
      }
    }
    // 玩家
    for (const p of G.players){
      if (!p || p.state === 'dead') continue;
      const px = (p.x + p.w/2) / TILE * sx;
      const py = (p.y + p.h/2) / TILE * sy;
      mmCtx.fillStyle = p.id === 0 ? '#e74c3c' : '#3498db';
      mmCtx.fillRect(px-2, py-2, 4, 4);
    }
  }

  /* ========== HUD 同步 ========== */
  function syncHUD(){
    const p1 = G.players[0], p2 = G.players[1];
    if (p1){
      el.p1hp.style.width = (p1.hp/p1.maxHp*100)+'%';
      el.p1ox.style.width = (p1.oxygen/p1.maxOxygen*100)+'%';
      el.p1fb.textContent = p1.flashbangs;
    }
    if (p2){
      el.p2hp.style.width = (p2.hp/p2.maxHp*100)+'%';
      el.p2ox.style.width = (p2.oxygen/p2.maxOxygen*100)+'%';
      el.p2fb.textContent = p2.flashbangs;
    }
    // 低血量屏幕血溅
    const p1hp = p1 ? p1.hp : 100;
    const t = p1hp < 40 ? (40-p1hp)/40 * 0.8 : 0;
    el.bloodoverlay.style.opacity = t;
  }

  /* ========== 暂停控制 ========== */
  let isPaused = false;
  function paused(){ return isPaused; }
  function togglePause(){
    if (G.state !== 'playing') return;
    isPaused = !isPaused;
  }

  /* ========== 主循环 ========== */
  let lastTime = 0;
  function loop(now){
    const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
    lastTime = now;

    if (G.state === 'playing' && !paused()){
      update(dt);
    }

    if (G.state === 'title'){
      titleRender();
    } else {
      render();
      renderMinimap();
      syncHUD();
    }

    keysPressed.clear();
    requestAnimationFrame(loop);
  }

  function update(dt){
    G.timeAlive += dt;
    if (G.flashTimer > 0){ G.flashTimer -= dt; if (G.flashTimer<0) G.flashTimer=0; }

    // 玩家 1
    updatePlayer(G.players[0], inputP1(), dt);
    checkItemPickup(G.players[0]);

    // 玩家 2 / AI
    if (G.players[1]){
      const input = G.mode === '2p' ? inputP2() : updateAI(G.players[1], dt);
      updatePlayer(G.players[1], input, dt);
      checkItemPickup(G.players[1]);
    }

    // 敌人
    for (const e of G.enemies) updateEnemy(e, dt);

    // 毒气
    updateGas(dt);

    // 粒子
    updateParticles(dt);

    // 相机
    updateCamera(dt);

    // 死亡敌人清理（延迟一点让尸体留会儿）
    // 简单：不清理，直接跳过死亡敌人
  }

  /* ========== 游戏控制 ========== */
  function startGame(mode){
    G.mode = mode;
    G.state = 'playing';
    G.level = 0;
    G.kills = 0;
    G.timeAlive = 0;
    G.players = [makePlayer(0, 0, 0, 'alpha')];
    if (mode === '2p'){
      G.players.push(makePlayer(1, 0, 0, 'bravo'));
    } else {
      // AI 队友
      const ai = makePlayer(1, 0, 0, 'bravo');
      ai.isPlayer = false;
      G.players.push(ai);
      el.p2name.textContent = 'BRAVO · AI';
    }
    el.p2name.textContent = mode === '2p' ? 'BRAVO · 2P' : 'BRAVO · AI';

    G.map = generateMap(0);
    populateLevel(0);
    G.level = 0;
    el.levelBadge.textContent = 'LEVEL 0';

    G.camera.x = G.players[0].x - VW/2;
    G.camera.y = G.players[0].y - VH/2;

    el.title.classList.add('hidden');
    el.result.classList.add('hidden');
    el.hud.classList.remove('hidden');
    el.hint.classList.remove('hidden');
    mmCanvas.classList.remove('hidden');
  }

  function backToMenu(){
    G.state = 'title';
    el.title.classList.remove('hidden');
    el.result.classList.add('hidden');
    el.hud.classList.add('hidden');
    el.hint.classList.add('hidden');
    mmCanvas.classList.add('hidden');
    el.bloodoverlay.style.opacity = 0;
  }

  /* ========== 事件绑定 ========== */
  function setMode(m){
    G.mode = m;
    $('mode1p').classList.toggle('active', m==='1p');
    $('mode2p').classList.toggle('active', m==='2p');
  }
  $('mode1p').addEventListener('click', () => { setMode('1p'); startGame('1p'); });
  $('mode2p').addEventListener('click', () => { setMode('2p'); startGame('2p'); });
  $('retry').addEventListener('click', () => { startGame(G.mode); });
  $('tomenu').addEventListener('click', () => { backToMenu(); });

  window.addEventListener('keydown', (e) => {
    if (G.state === 'title' && (e.code === 'Enter' || e.code === 'Space')){
      e.preventDefault();
      startGame(G.mode);
    }
    if (e.code === 'Escape'){
      e.preventDefault();
      togglePause();
    }
  });

  /* ========== 标题页背景动画 ========== */
  function titleRender(){
    ctx.fillStyle = '#0d0a04';
    ctx.fillRect(0, 0, VW, VH);
    for (let i=0;i<200;i++){
      const x = Math.random()*VW, y = Math.random()*VH;
      ctx.globalAlpha = Math.random()*0.08;
      ctx.fillStyle = Math.random()<0.3 ? '#d4c86a' : '#2a2210';
      ctx.fillRect(x|0, y|0, 1, 1);
    }
    ctx.globalAlpha = 1;
    const t = performance.now()/1000;
    const flick = 0.8 + 0.2*Math.sin(t*2) + 0.1*Math.sin(t*7.3);
    const grd = ctx.createRadialGradient(VW/2, VH*0.3, 0, VW/2, VH*0.3, 300*flick);
    grd.addColorStop(0, 'rgba(212,200,106,0.15)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,VW,VH);
  }

  /* ========== 启动 ========== */
  requestAnimationFrame(loop);

})();
