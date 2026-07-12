/* ============================================================
 * PIXEL MECHA DUEL · 像素机甲对决
 * 纯前端 Canvas 对战小游戏 — 无外部素材，全部程序化绘制
 * ============================================================ */
(function () {
  'use strict';

  /* ---------- 常量 ---------- */
  const VW = 960, VH = 540;        // 逻辑分辨率
  const GROUND_Y = 466;            // 地面 y
  const GRAVITY = 0.6;
  const SPEED = 3.0;
  const JUMP_V = -12.5;
  const MAX_HP = 100;
  const MAX_EN = 100;
  const ROUND_TIME = 60;           // 秒
  const U = 3;                     // 像素单位 → 屏幕像素

  /* ---------- 调色板 ---------- */
  const PAL = {
    crimson: { primary:'#ff2d55', secondary:'#a01230', accent:'#ffd700', eye:'#ffe600', dark:'#3a0612', name:'CRIMSON' },
    azure:   { primary:'#00d4ff', secondary:'#0a7a9e', accent:'#c8f0ff', eye:'#aaffff', dark:'#012a3a', name:'AZURE'  },
  };

  /* ---------- DOM ---------- */
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const $ = (id) => document.getElementById(id);
  const el = {
    hud:$('hud'), title:$('title'), result:$('result'),
    announce:$('announce'), hint:$('hint'), pause:$('pause'),
    p1hp:$('p1hp'), p2hp:$('p2hp'), p1en:$('p1en'), p2en:$('p2en'),
    p1ebar:$('p1ebar'), p2ebar:$('p2ebar'),
    timer:$('timer'), koText:$('koText'), winText:$('winText'),
    p1r0:$('p1r0'), p1r1:$('p1r1'), p2r0:$('p2r0'), p2r1:$('p2r1'),
    p1name:$('p1name'), p2name:$('p2name'),
  };

  /* ---------- 游戏状态 ---------- */
  const G = {
    state: 'title',      // title | intro | battle | roundEnd | result
    mode: '1p',
    mechs: [],
    projectiles: [],
    particles: [],
    shake: 0,
    flash: 0,
    flashColor:'#fff',
    roundTime: ROUND_TIME,
    secAccum: 0,
    rounds: { p1:0, p2:0 },
    round: 1,
    announce: { text:'', color:'#fff', timer:0 },
    introTimer: 0,
    endTimer: 0,
    winner: -1,
    paused: false,
    bgCanvas: null,
  };

  /* ---------- 输入 ---------- */
  const down = new Set();
  const pressed = new Set();
  const GAME_CODES = new Set([
    'KeyA','KeyD','KeyW','KeyS','KeyJ','KeyK','KeyL','KeyU',
    'ArrowLeft','ArrowRight','ArrowUp','ArrowDown',
    'Digit1','Digit2','Digit3','Digit4','Space','Enter','KeyP'
  ]);
  window.addEventListener('keydown', (e) => {
    if (GAME_CODES.has(e.code)) e.preventDefault();
    if (e.repeat) return;
    down.add(e.code);
    pressed.add(e.code);
    if (e.code === 'KeyP' && (G.state === 'battle' || G.state === 'intro')) {
      G.paused = !G.paused;
      el.pause.classList.toggle('hidden', !G.paused);
    }
  });
  window.addEventListener('keyup', (e) => { down.delete(e.code); });

  /* P1 / P2 输入映射 → 返回 intent 对象 */
  function readInputP1(){
    return {
      left: down.has('KeyA'),
      right: down.has('KeyD'),
      jump: pressed.has('KeyW'),
      light: pressed.has('KeyJ'),
      heavy: pressed.has('KeyK'),
      block: down.has('KeyL'),
      special: pressed.has('KeyU'),
    };
  }
  function readInputP2(){
    return {
      left: down.has('ArrowLeft'),
      right: down.has('ArrowRight'),
      jump: pressed.has('ArrowUp'),
      light: pressed.has('Digit1'),
      heavy: pressed.has('Digit2'),
      block: down.has('Digit3'),
      special: pressed.has('Digit4'),
    };
  }

  /* ---------- 工具 ---------- */
  function rect(x,y,w,h,c){ ctx.fillStyle=c; ctx.fillRect(x|0,y|0,w|0,h|0); }
  function clamp(v,a,b){ return v<a?a:v>b?b:v; }
  function aabb(a,b){ return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }
  function rand(a,b){ return a + Math.random()*(b-a); }

  /* ---------- 机甲创建 ---------- */
  function makeMech(id, x, facing, paletteKey, isPlayer){
    const p = PAL[paletteKey];
    return {
      id, x, y: GROUND_Y, vx:0, vy:0,
      w: 14*U, h: 32*U,        // 42 × 96
      facing,
      hp: MAX_HP, maxHp: MAX_HP,
      energy: 0, maxEnergy: MAX_EN,
      state:'idle', stateTimer:0,
      animFrame:0, animTimer:0,
      onGround:true,
      hasHit:false,
      isPlayer,
      paletteKey,
      palette:p,
      name:p.name,
      attackType:null,
      flash:0,
      blockHeld:false,
      // AI
      ai:{ timer:0, mode:'approach', cooldown:0, react:0 },
      // 当前意图
      intent:{ left:false,right:false,jump:false,light:false,heavy:false,block:false,special:false },
    };
  }

  /* ---------- 状态时长 (帧) ---------- */
  const DUR = {
    attackingLight: 18,
    attackingHeavy: 30,
    special: 22,
    hitStunLight: 14,
    hitStunHeavy: 26,
  };
  // 攻击活跃帧区间 [start,end) —— 命中判定窗口
  const ACTIVE = {
    attackingLight: [6,12],
    attackingHeavy: [14,22],
  };

  function setState(m, s, t){
    m.state = s;
    m.stateTimer = t ?? (DUR[s] || 0);
    m.animFrame = 0; m.animTimer = 0;
    if (s === 'attackingLight' || s === 'attackingHeavy' || s === 'special') m.hasHit = false;
  }

  /* ---------- 机甲逻辑更新 ---------- */
  function updateMech(m, opp){
    const it = m.intent;

    // 闪白衰减
    if (m.flash > 0) m.flash--;

    // 状态机：仅可行动状态响应输入
    const canAct = (m.state === 'idle' || m.state === 'walking' || m.state === 'jumping');

    // 自动朝向对手（地面 idle/walk 时）
    if (m.onGround && (m.state==='idle' || m.state==='walking')){
      m.facing = opp.x > m.x ? 'right' : 'left';
    }

    if (canAct){
      // 格挡（持续）
      if (it.block && m.onGround){
        setState(m, 'blocking', 0);
      } else {
        // 必杀
        if (it.special && m.energy >= MAX_EN){
          m.energy = 0;
          setState(m, 'special', DUR.special);
          spawnProjectile(m);
          G.flash = 8; G.flashColor = m.palette.eye;
        }
        // 重击
        else if (it.heavy && m.onGround){
          setState(m, 'attackingHeavy', DUR.attackingHeavy);
          m.attackType = 'heavy';
        }
        // 轻击
        else if (it.light){
          setState(m, 'attackingLight', DUR.attackingLight);
          m.attackType = 'light';
        }
        // 跳跃
        else if (it.jump && m.onGround){
          m.vy = JUMP_V; m.onGround = false;
          setState(m, 'jumping', 0);
        }
        // 移动
        else if (it.left || it.right){
          const dir = it.left ? -1 : 1;
          m.vx = dir * SPEED;
          if (m.onGround) setState(m, 'walking', 0);
        } else {
          m.vx *= 0.6;
          if (Math.abs(m.vx) < 0.1) m.vx = 0;
          if (m.onGround) setState(m, 'idle', 0);
        }
      }
    }

    // 格挡中可松开返回
    if (m.state === 'blocking'){
      if (!it.block){ setState(m,'idle',0); }
      else { m.vx *= 0.5; }
    }

    // 攻击中不可移动
    if (m.state==='attackingLight' || m.state==='attackingHeavy' || m.state==='special'){
      m.vx *= 0.8;
    }
    // 受击硬直
    if (m.state==='hitStunLight' || m.state==='hitStunHeavy'){
      m.vx *= 0.92;
    }

    // 物理
    m.vy += GRAVITY;
    m.x += m.vx;
    m.y += m.vy;
    if (m.y >= GROUND_Y){ m.y = GROUND_Y; m.vy = 0; if(!m.onGround){ m.onGround=true; if(m.state==='jumping') setState(m,'idle',0); } }

    // 边界
    m.x = clamp(m.x, 30, VW-30);
    // 防止穿模：两机甲不重叠
    const minDist = 30;
    if (m.id === 0){
      if (m.x > opp.x - minDist) m.x = opp.x - minDist;
      if (m.x < 30) m.x = 30;
    } else {
      if (m.x < opp.x + minDist) m.x = opp.x + minDist;
      if (m.x > VW-30) m.x = VW-30;
    }

    // 状态计时
    if (m.stateTimer > 0){
      m.stateTimer--;
      if (m.stateTimer === 0){
        if (m.state==='attackingLight'||m.state==='attackingHeavy'||m.state==='special'||m.state==='hitStunLight'||m.state==='hitStunHeavy'){
          setState(m, m.onGround ? 'idle' : 'jumping', 0);
        }
      }
    }

    // 动画帧推进
    m.animTimer++;
    const afp = animFramesFor(m.state);
    if (m.animTimer >= animSpeedFor(m.state)){
      m.animTimer = 0;
      m.animFrame = (m.animFrame + 1) % Math.max(1, afp);
    }
  }

  function animFramesFor(s){
    switch(s){
      case 'idle': return 2;
      case 'walking': return 4;
      case 'jumping': return 1;
      case 'attackingLight': return 3;
      case 'attackingHeavy': return 4;
      case 'blocking': return 1;
      case 'hitStunLight': case 'hitStunHeavy': return 2;
      case 'ko': return 1;
      default: return 1;
    }
  }
  function animSpeedFor(s){
    switch(s){
      case 'idle': return 24;
      case 'walking': return 7;
      case 'attackingLight': return 6;
      case 'attackingHeavy': return 8;
      case 'hitStunLight': case 'hitStunHeavy': return 6;
      default: return 12;
    }
  }

  /* ---------- 攻击命中盒 ---------- */
  function attackHitbox(m){
    if (m.state !== 'attackingLight' && m.state !== 'attackingHeavy') return null;
    const range = m.state==='attackingHeavy' ? 34 : 24;
    const hbw = range, hbh = 26;
    const dir = m.facing==='right' ? 1 : -1;
    const x = dir===1 ? m.x + 8 : m.x - 8 - hbw;
    const y = m.y - 70;
    return { x, y, w:hbw, h:hbh };
  }
  function bodyBox(m){
    return { x: m.x - m.w/2, y: m.y - m.h, w: m.w, h: m.h };
  }

  /* ---------- 战斗判定 ---------- */
  function resolveCombat(){
    const [a, b] = G.mechs;
    checkAttack(a, b);
    checkAttack(b, a);
  }
  function checkAttack(att, def){
    if (att.state!=='attackingLight' && att.state!=='attackingHeavy') return;
    const r = ACTIVE[att.state];
    const elapsed = DUR[att.state] - att.stateTimer;
    if (elapsed < r[0] || elapsed >= r[1]) return;   // 非活跃帧
    if (att.hasHit) return;
    const hb = attackHitbox(att);
    if (!hb) return;
    if (!aabb(hb, bodyBox(def))) return;
    att.hasHit = true;
    applyHit(att, def);
  }
  function applyHit(att, def){
    const heavy = att.state==='attackingHeavy';
    let dmg = heavy ? 18 : 8;
    const blocking = def.state==='blocking' && facingTowards(def, att);
    if (blocking) dmg = Math.round(dmg * 0.3);
    def.hp = Math.max(0, def.hp - dmg);
    // 能量
    att.energy = Math.min(MAX_EN, att.energy + 8);
    def.energy = Math.min(MAX_EN, def.energy + 5);
    // 击退
    const dir = att.facing==='right' ? 1 : -1;
    const kb = heavy ? 7 : 3.5;
    def.vx = dir * kb;
    if (heavy){ def.vy = -4; def.onGround=false; }
    // 闪白 + 硬直
    def.flash = 6;
    if (def.hp <= 0){
      setState(def, 'ko', 99999);
    } else if (blocking){
      setState(def, 'blocking', 0);   // 保持格挡
    } else {
      setState(def, heavy ? 'hitStunHeavy':'hitStunLight', heavy ? DUR.hitStunHeavy : DUR.hitStunLight);
    }
    // 粒子 + 震屏
    spawnHitParticles(def.x + dir*8, def.y - 60, att.palette.eye, heavy);
    G.shake = heavy ? 10 : 5;
    if (heavy){ G.flash = 4; G.flashColor = '#fff'; }
  }
  function facingTowards(self, other){
    const dir = other.x > self.x ? 'right' : 'left';
    return self.facing === dir;
  }

  /* ---------- 弹幕 ---------- */
  function spawnProjectile(m){
    const dir = m.facing==='right' ? 1 : -1;
    G.projectiles.push({
      x: m.x + dir*20, y: m.y - 58,
      vx: dir * 8, w: 18, h: 14,
      damage: 30, owner: m.id, life: 120,
      palette: m.palette,
    });
    G.shake = 4;
  }
  function updateProjectiles(){
    const [a,b] = G.mechs;
    for (let i = G.projectiles.length-1; i>=0; i--){
      const p = G.projectiles[i];
      p.x += p.vx; p.life--;
      const target = p.owner===0 ? b : a;
      // 命中
      if (aabb(p, bodyBox(target))){
        let dmg = p.damage;
        const blocking = target.state==='blocking' && facingTowards(target, p.vx>0?a:b);
        // 判定弹幕来源方向
        const src = p.owner===0 ? a : b;
        const blk = target.state==='blocking' && facingTowards(target, src);
        if (blk) dmg = Math.round(dmg*0.3);
        target.hp = Math.max(0, target.hp - dmg);
        target.energy = Math.min(MAX_EN, target.energy + 5);
        const dir = p.vx > 0 ? 1 : -1;
        target.vx = dir * 6; target.vy = -5; target.onGround=false;
        target.flash = 8;
        if (target.hp <= 0) setState(target,'ko',99999);
        else if (!blk) setState(target,'hitStunHeavy', DUR.hitStunHeavy);
        spawnHitParticles(p.x, p.y, p.palette.eye, true);
        G.shake = 12; G.flash = 6; G.flashColor = p.palette.eye;
        G.projectiles.splice(i,1);
        continue;
      }
      if (p.life<=0 || p.x < -30 || p.x > VW+30){
        G.projectiles.splice(i,1);
      }
    }
  }

  /* ---------- 粒子 ---------- */
  function spawnHitParticles(x,y,color,big){
    const n = big ? 16 : 8;
    for (let i=0;i<n;i++){
      G.particles.push({
        x, y,
        vx: rand(-4,4), vy: rand(-6,-1),
        color: i%3===0 ? '#fff' : color,
        size: big ? rand(2,4)|0 : rand(1,3)|0,
        life: rand(18,32)|0, maxLife: 30,
      });
    }
    if (G.particles.length > 80) G.particles.splice(0, G.particles.length-80);
  }
  function spawnDust(x,y){
    for (let i=0;i<5;i++){
      G.particles.push({ x, y, vx:rand(-2,2), vy:rand(-3,-0.5), color:'rgba(180,190,210,.7)', size:rand(1,3)|0, life:rand(12,22)|0, maxLife:20 });
    }
  }
  function updateParticles(){
    for (let i=G.particles.length-1;i>=0;i--){
      const p = G.particles[i];
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.25; p.life--;
      if (p.life<=0) G.particles.splice(i,1);
    }
  }

  /* ============================================================
   * 渲染：背景
   * ============================================================ */
  function buildBackground(){
    // 离屏 canvas 缓存静态背景
    const off = document.createElement('canvas');
    off.width = VW; off.height = VH;
    const c = off.getContext('2d');
    c.imageSmoothingEnabled = false;

    // 天空渐变
    const g = c.createLinearGradient(0,0,0,VH);
    g.addColorStop(0,'#0a0a2a'); g.addColorStop(0.4,'#1a1040'); g.addColorStop(0.75,'#2a0a3a'); g.addColorStop(1,'#0a0518');
    c.fillStyle = g; c.fillRect(0,0,VW,VH);

    // 星星
    for (let i=0;i<140;i++){
      const x = Math.random()*VW, y = Math.random()*GROUND_Y*0.8;
      const s = Math.random()<0.15 ? 2 : 1;
      c.fillStyle = Math.random()<0.3 ? '#ffe6c0' : '#cfe8ff';
      c.globalAlpha = 0.3 + Math.random()*0.7;
      c.fillRect(x|0, y|0, s, s);
    }
    c.globalAlpha = 1;

    // 月亮
    c.fillStyle = '#f4e8c0';
    c.beginPath(); c.arc(VW-150, 110, 46, 0, Math.PI*2); c.fill();
    c.fillStyle = '#1a1040';
    c.beginPath(); c.arc(VW-128, 96, 40, 0, Math.PI*2); c.fill();
    // 月光环
    c.strokeStyle='rgba(244,232,192,.15)'; c.lineWidth=2;
    c.beginPath(); c.arc(VW-150,110,58,0,Math.PI*2); c.stroke();

    // 远景城市剪影
    drawCityLayer(c, GROUND_Y-120, 0.5, '#0d0a26', 60, 120);
    // 中景城市
    drawCityLayer(c, GROUND_Y-60, 0.8, '#150a2e', 40, 90);
    // 近景细节楼
    drawCityLayer(c, GROUND_Y-30, 1.0, '#1a0a36', 26, 60);

    // 楼宇窗户灯光
    c.fillStyle = 'rgba(255,214,80,.55)';
    for (let i=0;i<60;i++){
      const x = (Math.random()*VW)|0;
      const y = (GROUND_Y - 40 - Math.random()*120)|0;
      c.fillRect(x,y,2,2);
    }

    // 地平线霓虹
    c.fillStyle = 'rgba(255,45,85,.18)'; c.fillRect(0, GROUND_Y-3, VW, 3);
    c.fillStyle = 'rgba(0,212,255,.12)'; c.fillRect(0, GROUND_Y-1, VW, 1);

    // 地面
    const gg = c.createLinearGradient(0,GROUND_Y,0,VH);
    gg.addColorStop(0,'#1a0a2e'); gg.addColorStop(1,'#070210');
    c.fillStyle = gg; c.fillRect(0,GROUND_Y,VW,VH-GROUND_Y);

    // 地面网格透视
    c.strokeStyle = 'rgba(0,212,255,.18)'; c.lineWidth = 1;
    for (let i=0;i<=12;i++){
      const t = i/12;
      const y = GROUND_Y + t*(VH-GROUND_Y);
      c.globalAlpha = 0.5 - t*0.4;
      c.beginPath(); c.moveTo(0,y); c.lineTo(VW,y); c.stroke();
    }
    c.globalAlpha = 0.25;
    for (let i=-10;i<=10;i++){
      const vx = VW/2 + i*70;
      c.beginPath(); c.moveTo(VW/2, GROUND_Y); c.lineTo(vx, VH); c.stroke();
    }
    c.globalAlpha = 1;

    // 平台边缘高光
    c.fillStyle = '#ff2d55'; c.fillRect(0,GROUND_Y-1,VW,1);
    c.fillStyle = 'rgba(255,45,85,.25)'; c.fillRect(0,GROUND_Y,VW,2);

    G.bgCanvas = off;
  }
  function drawCityLayer(c, baseY, scale, color, minH, maxH){
    c.fillStyle = color;
    let x = -20;
    while (x < VW+20){
      const w = (16 + Math.random()*36)|0;
      const h = (minH + Math.random()*(maxH-minH))|0;
      c.fillRect(x, baseY - h, w, h);
      // 顶部细节
      if (Math.random()<0.5){ c.fillRect(x+ (w>>1)-1, baseY-h-6, 2, 6); }
      x += w + (Math.random()*6|0);
    }
  }

  /* ============================================================
   * 渲染：机甲（程序化像素绘制）
   * ============================================================ */
  function drawMech(m){
    const p = m.palette;
    const dir = m.facing==='right' ? 1 : -1;

    // 阴影
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(m.x, GROUND_Y+2, 26, 6, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(m.x|0, m.y|0);
    if (dir === -1) ctx.scale(-1, 1);

    // 呼吸/走动整体偏移
    let bob = 0, lean = 0;
    if (m.state==='idle') bob = (m.animFrame===1 ? -1 : 0);
    if (m.state==='walking') bob = (m.animFrame%2===0 ? -1 : 0);
    if (m.state==='hitStunLight'||m.state==='hitStunHeavy'){ lean = -3; bob = (m.animFrame? -2:0); }

    // ko 倒地
    if (m.state==='ko'){
      ctx.rotate(-Math.PI/2 * 0.9);
      ctx.translate(-30, -20);
    }

    // ---- 腿 ----
    drawLegs(m, p, bob);

    // ---- 躯干 ----
    const torsoY = -22*U + bob;
    // 腰部
    rect(-4*U, torsoY+13*U, 8*U, 3*U, p.secondary);
    rect(-4*U, torsoY+13*U, 8*U, 1*U, p.accent);
    // 胸甲
    rect(-5*U, torsoY+2*U, 10*U, 11*U, p.primary);
    rect(-5*U, torsoY+2*U, 10*U, 2*U, p.accent);          // 肩部高光
    rect(4*U, torsoY+2*U, 1*U, 11*U, p.dark);             // 右侧暗边
    rect(-5*U, torsoY+2*U, 1*U, 11*U, p.dark);            // 左侧暗边
    // 胸口核心（发光）
    rect(-2*U, torsoY+6*U, 4*U, 4*U, p.eye);
    rect(-2*U, torsoY+6*U, 4*U, 1*U, '#ffffff');
    // 胸口纹路
    rect(-3*U, torsoY+11*U, 6*U, 1*U, p.dark);

    // ---- 后臂（先画，在躯干后） ----
    drawArmBack(m, p, bob);

    // ---- 头 ----
    const headY = torsoY - 6*U + bob*0.3;
    // 天线
    rect(2*U, headY-5*U, 1*U, 3*U, p.accent);
    rect(2*U, headY-5*U, 1*U, 1*U, p.eye);
    // 头顶
    rect(-3*U, headY-4*U, 6*U, 1*U, p.primary);
    // 头部主体
    rect(-3*U, headY-3*U, 6*U, 5*U, p.primary);
    rect(2*U, headY-3*U, 1*U, 5*U, p.dark);
    // 面甲 / 护目镜
    rect(-3*U, headY-2*U, 6*U, 2*U, p.dark);
    rect(-2*U, headY-2*U, 4*U, 1*U, p.eye);     // 发光护目镜
    rect(-2*U, headY-2*U, 4*U, 1*U, '#ffffff'); 
    ctx.globalAlpha = 0.5; rect(-1*U, headY-2*U, 1*U, 1*U, p.eye); ctx.globalAlpha=1;
    // 下颌
    rect(-2*U, headY+1*U, 4*U, 1*U, p.secondary);
    rect(-3*U, headY+1*U, 1*U, 1*U, p.accent);

    // ---- 前臂 + 武器 ----
    drawArmFront(m, p, bob);

    // 闪白覆盖
    if (m.flash > 0){
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(255,255,255,'+(m.flash/6*0.8)+')';
      ctx.fillRect(-40, -120, 80, 130);
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
  }

  function drawLegs(m, p, bob){
    const dir = 1;
    if (m.state==='walking'){
      const f = m.animFrame;
      // 4帧步态：前腿前后摆动
      const swing = [ [3,-3], [1,-1], [-3,3], [-1,1] ][f];
      drawLeg(p, 2*U + swing[0], bob);    // 前腿
      drawLeg(p, -2*U + swing[1], bob);   // 后腿
    } else if (m.state==='jumping' || !m.onGround){
      // 跳跃：收腿
      drawLegTucked(p, 2*U, bob);
      drawLegTucked(p, -2*U, bob);
    } else {
      drawLeg(p, 2*U, bob);
      drawLeg(p, -2*U, bob);
    }
  }
  function drawLeg(p, ox, bob){
    const baseY = -10*U + bob;
    rect(ox-1*U, baseY, 2*U, 7*U, p.primary);      // 大腿
    rect(ox-1*U, baseY, 2*U, 1*U, p.accent);
    rect(ox+1*U-1, baseY, 1, 7*U, p.dark);
    rect(ox-1*U, baseY+6*U, 2*U, 3*U, p.secondary);// 小腿
    rect(ox-2*U, baseY+9*U, 4*U, 1*U, p.dark);     // 脚
    rect(ox-2*U, baseY+9*U, 4*U, 1*U, p.accent);
  }
  function drawLegTucked(p, ox, bob){
    const baseY = -8*U + bob;
    rect(ox-1*U, baseY, 2*U, 5*U, p.primary);
    rect(ox-2*U, baseY+4*U, 3*U, 2*U, p.secondary);
  }

  function drawArmBack(m, p, bob){
    const sx = -5*U, sy = -20*U + bob;
    rect(sx, sy, 2*U, 6*U, p.secondary);
    rect(sx, sy, 2*U, 1*U, p.dark);
    rect(sx, sy+5*U, 2*U, 2*U, p.dark);   // 拳头
  }

  function drawArmFront(m, p, bob){
    const sx = 4*U, sy = -20*U + bob;

    if (m.state==='attackingLight'){
      const f = m.animFrame;   // 0 wind, 1 extend, 2 recover
      const ext = [0, 8*U, 4*U][f];
      rect(sx, sy, 2*U, 6*U, p.primary);                 // 肩
      rect(sx + ext, sy+5*U, 2*U, 3*U, p.primary);       // 前臂伸出
      rect(sx + ext + 2*U, sy+4*U, 2*U, 3*U, p.accent);  // 拳/光刃
      if (f===1){
        // 能量刃
        rect(sx + ext + 4*U, sy+5*U, 6*U, 1*U, p.eye);
        rect(sx + ext + 4*U, sy+5*U, 6*U, 1*U, '#fff');
      }
      return;
    }
    if (m.state==='attackingHeavy'){
      const f = m.animFrame;   // 0 wind back, 1 hold, 2 swing, 3 recover
      const off = [-3*U, -4*U, 6*U, 3*U][f];
      rect(sx + (f<=1? off:0), sy, 2*U, 6*U, p.primary);
      rect(sx + off, sy+5*U, 2*U, 4*U, p.secondary);
      rect(sx + off + 2*U, sy+5*U, 3*U, 3*U, p.accent);  // 大拳
      if (f===2){
        rect(sx + off + 5*U, sy+5*U, 8*U, 2*U, p.eye);
        rect(sx + off + 5*U, sy+5*U, 8*U, 1*U, '#fff');
      }
      return;
    }
    if (m.state==='blocking'){
      // 双臂前举 + 盾
      rect(sx, sy, 2*U, 6*U, p.primary);
      rect(sx+2*U, sy+3*U, 2*U, 4*U, p.secondary);
      // 能量盾
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = p.eye;
      ctx.beginPath();
      ctx.arc(sx+6*U, sy+5*U, 12, -Math.PI/2.4, Math.PI/2.4);
      ctx.lineTo(sx+6*U, sy+5*U);
      ctx.fill();
      ctx.globalAlpha = 0.3; ctx.fillStyle='#fff';
      ctx.beginPath();
      ctx.arc(sx+6*U, sy+5*U, 12, -Math.PI/2.4, Math.PI/2.4);
      ctx.lineTo(sx+6*U, sy+5*U);
      ctx.fill();
      ctx.globalAlpha = 1;
      // 盾边框
      ctx.strokeStyle = p.accent; ctx.lineWidth=2;
      ctx.beginPath();
      ctx.arc(sx+6*U, sy+5*U, 12, -Math.PI/2.4, Math.PI/2.4);
      ctx.stroke();
      return;
    }
    if (m.state==='special'){
      const f = m.animFrame;
      // 双臂前伸聚气
      rect(sx, sy, 2*U, 6*U, p.primary);
      rect(sx+2*U, sy+3*U, 3*U, 3*U, p.accent);
      if (f<=1){
        // 蓄力光球
        ctx.globalAlpha = 0.8; ctx.fillStyle = p.eye;
        ctx.beginPath(); ctx.arc(sx+7*U, sy+4*U, 6+f*2, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 0.5; ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(sx+7*U, sy+4*U, 3+f, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      return;
    }
    // 默认 idle/walk 前臂
    let sway = 0;
    if (m.state==='walking') sway = (m.animFrame%2===0? 1:-1)*U;
    rect(sx, sy, 2*U, 6*U, p.primary);
    rect(sx, sy, 2*U, 1*U, p.accent);
    rect(sx+1*U, sy+5*U + sway, 2*U, 3*U, p.secondary);  // 前臂
    rect(sx+1*U, sy+5*U + sway, 1, 3*U, p.dark);
    rect(sx+2*U, sy+6*U + sway, 2*U, 2*U, p.dark);       // 拳
  }

  /* ---------- 弹幕绘制 ---------- */
  function drawProjectile(p){
    const pal = p.palette;
    ctx.save();
    ctx.translate(p.x|0, p.y|0);
    // 拖尾
    ctx.globalAlpha = 0.35; ctx.fillStyle = pal.eye;
    ctx.fillRect(-p.vx*2, -2, 16, 8);
    ctx.globalAlpha = 0.2; ctx.fillStyle = '#fff';
    ctx.fillRect(-p.vx*3, -1, 20, 6);
    ctx.globalAlpha = 1;
    // 弹体
    ctx.fillStyle = pal.eye;
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = pal.primary;
    ctx.beginPath(); ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-2, -1, 3, 2, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  /* ---------- 粒子绘制 ---------- */
  function drawParticles(){
    for (const p of G.particles){
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x|0, p.y|0, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  /* ============================================================
   * AI
   * ============================================================ */
  function updateAI(m, opp){
    if (m.state==='ko') { m.intent = blankIntent(); return; }
    const a = m.ai;
    a.timer--;
    a.cooldown--; a.react--;

    const dist = Math.abs(opp.x - m.x);
    const oppAttacking = opp.state==='attackingLight' || opp.state==='attackingHeavy' || opp.state==='special';
    const oppClose = dist < 90;

    // 反应式格挡：对手近身攻击时概率格挡
    if (oppAttacking && oppClose && a.react <= 0){
      if (Math.random() < 0.45){
        a.mode = 'block'; a.timer = 18; a.react = 30;
      }
    }

    // 必杀：能量满且中远距离
    if (m.energy >= MAX_EN && a.cooldown <= 0 && dist > 120 && Math.random()<0.04){
      m.intent = { ...blankIntent(), special:true };
      a.cooldown = 60;
      return;
    }
    if (m.energy >= MAX_EN && dist < 80 && Math.random()<0.02){
      m.intent = { ...blankIntent(), special:true };
      a.cooldown = 60;
      return;
    }

    if (a.timer <= 0){
      // 重新决策
      if (a.mode==='block'){ a.mode='approach'; a.timer=10; }
      else if (dist > 260){ a.mode='approach'; a.timer = 30 + (Math.random()*30|0); }
      else if (dist > 95){
        const r = Math.random();
        if (r < 0.7) { a.mode='approach'; a.timer = 20+(Math.random()*25|0); }
        else if (r < 0.8) { a.mode='retreat'; a.timer = 15+(Math.random()*15|0); }
        else { a.mode='jump'; a.timer = 5; }
      } else {
        // 近身：攻击 / 格挡 / 后撤
        const r = Math.random();
        if (r < 0.4){ a.mode='attackLight'; a.timer=6; }
        else if (r < 0.6){ a.mode='attackHeavy'; a.timer=8; }
        else if (r < 0.78){ a.mode='block'; a.timer=14+(Math.random()*12|0); }
        else if (r < 0.9){ a.mode='retreat'; a.timer=12; }
        else { a.mode='jump'; a.timer=4; }
      }
    }

    // 执行
    const dir = opp.x > m.x ? 1 : -1;
    let it = blankIntent();
    switch(a.mode){
      case 'approach': it[dir>0?'right':'left'] = true; break;
      case 'retreat':  it[dir>0?'left':'right'] = true; break;
      case 'jump':     it.jump = true; a.mode='approach'; a.timer=20; break;
      case 'attackLight': it.light = true; a.mode='wait'; a.timer=20; break;
      case 'attackHeavy': it.heavy = true; a.mode='wait'; a.timer=30; break;
      case 'block':    it.block = true; break;
      case 'wait':     break;
    }
    // 卡在墙边时跳
    if ((m.x < 50 || m.x > VW-50) && m.onGround && Math.random()<0.02) it.jump = true;
    m.intent = it;
  }
  function blankIntent(){ return { left:false,right:false,jump:false,light:false,heavy:false,block:false,special:false }; }

  /* ============================================================
   * 主循环
   * ============================================================ */
  function frame(){
    if (!G.paused){
      step();
    }
    render();
    // 清除单帧按压
    pressed.clear();
    requestAnimationFrame(frame);
  }

  function step(){
    if (G.flash > 0) G.flash--;
    if (G.shake > 0) G.shake *= 0.85;
    if (G.shake < 0.2) G.shake = 0;

    if (G.announce.timer > 0){
      G.announce.timer--;
      if (G.announce.timer === 0) el.announce.classList.add('hidden');
    }

    if (G.state === 'title'){ return; }

    if (G.state === 'intro'){
      G.introTimer--;
      // 角色待机动画仍在跑
      for (const m of G.mechs){ m.intent = blankIntent(); updateMech(m, other(m)); }
      if (G.introTimer <= 0){
        announce('FIGHT!', '#ffd700', 50);
        G.state = 'battle';
      }
      return;
    }

    if (G.state === 'roundEnd'){
      G.endTimer--;
      for (const m of G.mechs){ m.intent = blankIntent(); updateMech(m, other(m)); }
      updateParticles();
      updateProjectiles();
      if (G.endTimer <= 0){
        if (G.rounds.p1 >= 2 || G.rounds.p2 >= 2){
          showResult();
        } else {
          G.round++;
          startRound();
        }
      }
      return;
    }

    if (G.state !== 'battle') return;

    // 倒计时
    G.secAccum++;
    if (G.secAccum >= 60){
      G.secAccum = 0; G.roundTime--;
      if (G.roundTime <= 0){ endRoundByTime(); }
    }

    // 输入
    G.mechs[0].intent = readInputP1();
    if (G.mode === '2p') G.mechs[1].intent = readInputP2();
    else updateAI(G.mechs[1], G.mechs[0]);

    // 更新
    updateMech(G.mechs[0], G.mechs[1]);
    updateMech(G.mechs[1], G.mechs[0]);
    resolveCombat();
    updateProjectiles();
    updateParticles();

    // KO 检测
    if (G.mechs[0].hp <= 0 || G.mechs[1].hp <= 0){
      endRoundByKO();
    }

    syncHUD();
  }

  function other(m){ return m.id===0 ? G.mechs[1] : G.mechs[0]; }

  /* ---------- 回合控制 ---------- */
  function startRound(){
    // 重置机甲
    G.mechs[0].x = 280; G.mechs[0].y = GROUND_Y; G.mechs[0].vx=0; G.mechs[0].vy=0;
    G.mechs[0].hp = MAX_HP; G.mechs[0].energy = Math.min(G.mechs[0].energy, MAX_EN); 
    G.mechs[0].facing='right'; G.mechs[0].onGround=true; setState(G.mechs[0],'idle',0);

    G.mechs[1].x = 680; G.mechs[1].y = GROUND_Y; G.mechs[1].vx=0; G.mechs[1].vy=0;
    G.mechs[1].hp = MAX_HP; G.mechs[1].facing='left'; G.mechs[1].onGround=true; setState(G.mechs[1],'idle',0);

    G.projectiles.length = 0; G.particles.length = 0;
    G.roundTime = ROUND_TIME; G.secAccum = 0;
    G.shake = 0; G.flash = 0;

    G.state = 'intro';
    G.introTimer = 90;
    announce('ROUND ' + G.round, '#00d4ff', 70);
    syncRounds();
    syncHUD();
  }

  function endRoundByKO(){
    const win = G.mechs[0].hp <= 0 ? 1 : 0;
    G.mechs[win].energy = Math.min(MAX_EN, G.mechs[win].energy + 0);
    if (win === 0) G.rounds.p1++; else G.rounds.p2++;
    G.state = 'roundEnd';
    G.endTimer = 130;
    announce((win===0?'CRIMSON':'AZURE') + ' WINS!', win===0?'#ff2d55':'#00d4ff', 110);
    G.flash = 10; G.flashColor = '#fff'; G.shake = 16;
    syncRounds();
  }
  function endRoundByTime(){
    let win;
    if (G.mechs[0].hp > G.mechs[1].hp) win = 0;
    else if (G.mechs[1].hp > G.mechs[0].hp) win = 1;
    else win = -1;  // 平局
    if (win === 0) G.rounds.p1++; else if (win === 1) G.rounds.p2++;
    G.state = 'roundEnd';
    G.endTimer = 130;
    announce(win<0 ? 'DRAW' : ((win===0?'CRIMSON':'AZURE')+' WINS!'), win<0?'#fff':(win===0?'#ff2d55':'#00d4ff'), 110);
    syncRounds();
  }

  function showResult(){
    G.state = 'result';
    const win = G.rounds.p1 >= 2 ? 0 : 1;
    el.koText.textContent = G.rounds.p1===G.rounds.p2 ? 'DRAW' : 'K.O.';
    el.winText.innerHTML = G.rounds.p1===G.rounds.p2
      ? 'NO CONTEST'
      : '<span>'+(win===0?'CRIMSON':'AZURE')+'</span> WINS THE MATCH';
    el.result.classList.remove('hidden');
    el.hud.classList.add('hidden');
    el.hint.classList.add('hidden');
  }

  /* ---------- 播报 ---------- */
  function announce(text, color, frames){
    G.announce.text = text; G.announce.color = color; G.announce.timer = frames;
    el.announce.textContent = text;
    el.announce.style.color = color;
    el.announce.classList.remove('hidden');
  }

  /* ---------- HUD 同步 ---------- */
  function syncHUD(){
    const [a,b] = G.mechs;
    el.p1hp.style.width = (a.hp/MAX_HP*100)+'%';
    el.p2hp.style.width = (b.hp/MAX_HP*100)+'%';
    el.p1en.style.width = (a.energy/MAX_EN*100)+'%';
    el.p2en.style.width = (b.energy/MAX_EN*100)+'%';
    el.p1ebar.classList.toggle('full', a.energy>=MAX_EN);
    el.p2ebar.classList.toggle('full', b.energy>=MAX_EN);
    el.timer.textContent = G.roundTime;
    el.timer.classList.toggle('low', G.roundTime<=10);
  }
  function syncRounds(){
    el.p1r0.classList.toggle('win', G.rounds.p1>=1);
    el.p1r1.classList.toggle('win', G.rounds.p1>=2);
    el.p2r0.classList.toggle('win', G.rounds.p2>=1);
    el.p2r1.classList.toggle('win', G.rounds.p2>=2);
  }

  /* ============================================================
   * 渲染主函数
   * ============================================================ */
  function render(){
    ctx.save();
    // 震屏
    if (G.shake > 0){
      ctx.translate((Math.random()*2-1)*G.shake, (Math.random()*2-1)*G.shake);
    }

    // 背景
    if (G.bgCanvas) ctx.drawImage(G.bgCanvas, 0, 0);
    else { ctx.fillStyle='#0a0a2a'; ctx.fillRect(0,0,VW,VH); }

    // 战斗中才画机甲
    if (G.state !== 'title'){
      // 按从远到近：用 y 排序（同高则按 id）
      const order = G.mechs.slice().sort((x,y)=> x.y - y.y || x.id - y.id);
      for (const m of order) drawMech(m);
      for (const p of G.projectiles) drawProjectile(p);
      drawParticles();
    }

    ctx.restore();

    // 全屏闪光
    if (G.flash > 0){
      ctx.globalAlpha = clamp(G.flash/10, 0, 0.6);
      ctx.fillStyle = G.flashColor;
      ctx.fillRect(0,0,VW,VH);
      ctx.globalAlpha = 1;
    }

    // 标题界面背景动画（星空缓动）
    if (G.state === 'title'){
      drawTitleBackground();
    }
  }

  // 标题界面动态背景
  let titleStars = null;
  function drawTitleBackground(){
    if (!titleStars){
      titleStars = [];
      for (let i=0;i<60;i++) titleStars.push({ x:Math.random()*VW, y:Math.random()*VH, s:Math.random()*2+0.5, p:Math.random()*Math.PI*2 });
    }
    const t = performance.now()/1000;
    for (const s of titleStars){
      const a = 0.4 + 0.6*Math.abs(Math.sin(t*1.5 + s.p));
      ctx.globalAlpha = a;
      ctx.fillStyle = Math.random()<0.5 ? '#ff7aa0' : '#7ad0ff';
      ctx.fillRect(s.x|0, s.y|0, s.s|0||1, s.s|0||1);
    }
    ctx.globalAlpha = 1;
  }

  /* ============================================================
   * 界面控制
   * ============================================================ */
  function showTitle(){
    G.state = 'title';
    el.title.classList.remove('hidden');
    el.result.classList.add('hidden');
    el.hud.classList.add('hidden');
    el.hint.classList.add('hidden');
    el.announce.classList.add('hidden');
  }
  function startGame(mode){
    G.mode = mode;
    G.rounds = { p1:0, p2:0 };
    G.round = 1;
    G.mechs = [
      makeMech(0, 280, 'right', 'crimson', true),
      makeMech(1, 680, 'left', 'azure', mode!=='2p' ? false : true),
    ];
    el.p1name.textContent = G.mechs[0].name;
    el.p2name.textContent = G.mechs[1].name + (mode==='1p' ? ' [CPU]' : '');
    el.title.classList.add('hidden');
    el.result.classList.add('hidden');
    el.hud.classList.remove('hidden');
    el.hint.classList.remove('hidden');
    syncRounds();
    startRound();
  }

  /* ---------- 事件绑定 ---------- */
  $('mode1p').addEventListener('click', () => { setMode('1p'); startGame('1p'); });
  $('mode2p').addEventListener('click', () => { setMode('2p'); startGame('2p'); });
  $('rematch').addEventListener('click', () => { startGame(G.mode); });
  $('tomenu').addEventListener('click', () => { showTitle(); });

  function setMode(m){
    G.mode = m;
    $('mode1p').classList.toggle('active', m==='1p');
    $('mode2p').classList.toggle('active', m==='2p');
  }

  // 键盘也可从标题开始
  window.addEventListener('keydown', (e)=>{
    if (G.state==='title' && (e.code==='Enter' || e.code==='Space')){
      e.preventDefault();
      startGame(G.mode);
    }
  });

  /* ---------- 启动 ---------- */
  buildBackground();
  showTitle();
  requestAnimationFrame(frame);

})();
