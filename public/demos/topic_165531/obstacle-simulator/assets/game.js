/**
 * 军营障碍王：400米障碍模拟器 - 竞赛级版本
 * 2D横版侧视视角 | 角色固定在画面左侧，向右奔跑，摄像机跟随
 * IIFE封装为 window.ObstacleGame
 * 
 * 升级内容：
 *   - AI军事教练系统（数据采集+个性化分析+打字机效果）
 *   - 开始界面（标准/挑战/训练三种模式）
 *   - 成就系统（6个成就徽章，localStorage持久化）
 *   - 视觉全面升级（6帧跑步动画、场景细节、UI面板、进度条）
 *   - 音效升级（背景音乐、脚步声、呼吸声，Web Audio合成）
 *   - 设置功能（音效/音乐/粒子开关）
 *   - 转场效果
 */
window.ObstacleGame = (function () {
  'use strict';

  /* ============================================================
   * 第一部分：常量与配置
   * ============================================================ */

  var CANVAS_HEIGHT = 480;       // Canvas高度
  var TRACK_LENGTH = 6200;     // 赛道总长度（虚拟像素）
  var FINISH_LINE_X = 5800;     // 终点线X坐标
  var GROUND_RATIO = 0.75;      // 地面线位置比例

  /* 角色尺寸 */
  var PLAYER_W = 36;
  var PLAYER_H = 52;

  /* 基础速度配置 (px/帧) */
  var SPEED_RUN = 3;
  var SPEED_CRAWL = 1.5;
  var SPEED_BRIDGE = 2;
  var SPEED_SPRINT = 5;
  var SPRINT_X = 5200;
  var CLIMB_FRAMES = 120;
  var CRAWL_DURATION = 36;

  /* 跳跃物理 */
  var JUMP_VEL = -11.5;
  var GRAVITY = 0.58;
  var MAX_JUMPS = 2;

  /* 粒子池 */
  var PARTICLE_POOL_SIZE = 300;

  /* 碰撞容错 */
  var GRACE_FRAMES = 8;

  /* 游戏状态枚举 */
  var GS = {
    START: -1,       // 开始界面
    READY: 0,         // 准备开始（倒计时）
    PLAYING: 1,       // 游戏中
    FINISHED: 2,       // 结算界面
    SETTINGS: 3        // 设置面板
  };

  /* 角色状态枚举 */
  var PS = { RUNNING: 0, JUMPING: 1, CRAWLING: 2, CLIMBING: 3, SPRINTING: 4 };

  /* 游戏模式枚举 */
  var GM = {
    STANDARD: 0,   // 标准模式
    CHALLENGE: 1,  // 挑战模式
    TRAINING: 2    // 训练模式
  };

  /* 模式配置 */
  var MODE_CONFIG = [
    { name: '标准模式', desc: '正常速度，正常惩罚', speedMul: 1.0, penMul: 1.0, scoreMul: 1.0, noDeath: false },
    { name: '挑战模式', desc: '速度1.3倍，惩罚翻倍，分数×1.5', speedMul: 1.3, penMul: 2.0, scoreMul: 1.5, noDeath: false },
    { name: '训练模式', desc: '速度0.8倍，碰撞无惩罚', speedMul: 0.8, penMul: 0.0, scoreMul: 0.5, noDeath: true }
  ];

  /* 成就定义 */
  var ACHIEVEMENTS = [
    { id: 'first_run', name: '初出茅庐', desc: '完成第一次训练', icon: '🌟' },
    { id: 'no_hit', name: '身轻如燕', desc: '全程零碰撞完成', icon: '🦅' },
    { id: 'speed_demon', name: '神速突击', desc: '标准模式跑进40秒', icon: '⚡' },
    { id: 'top_soldier', name: '特等兵王', desc: '标准模式达到90分以上', icon: '👑' },
    { id: 'challenge_master', name: '挑战达人', desc: '挑战模式完成一次', icon: '🔥' },
    { id: 'veteran', name: '百炼成钢', desc: '累计完成10次', icon: '💪' }
  ];

  /* ==================== 配色方案（扩展） ==================== */
  var CL = {
    /* 天空 */
    skyTop: '#1e3a5f', skyBot: '#2d5a87',
    /* 太阳 */
    sunCore: '#FFE066', sunGlow: 'rgba(255,200,80,0.15)',
    /* 地面 */
    ground: '#8B7355', groundDark: '#7a6348',
    trackLine: 'rgba(255,255,255,0.35)',
    grass: '#4a6b2a', grassDark: '#3a5a1a', grassLight: '#6a8a4a',
    /* 山脉 */
    mtnFar: '#2d4a3e', mtnNear: '#1e3a2a',
    /* 军营 */
    tent: '#5a4a3a',
    /* 训练塔 */
    tower: '#6B5344', towerDark: '#5a4435',
    /* 角色配色 */
    helmet: '#5a7a3a', helmetDark: '#4a6a2a',
    skin: '#e8c4a0',
    vest: '#4a6a2a', vestLight: '#5a7a3a',
    pants: '#3a4a2a', boot: '#3e2a1a',
    /* 障碍物 */
    stake: '#8B6914', stakeDark: '#6B4F10', stakeTop: '#A0784C',
    trenchDark: '#3E2A1A', trenchMound: '#8B7355',
    brick: '#B85C3A', brickDark: '#9A4A2E', brickTop: '#D06E4A',
    wood: '#A0784C', woodDark: '#80603C', woodTop: '#B89060',
    bridge: '#8B6914', bridgeDark: '#6B4F10', bridgePole: '#707070',
    wall: '#B0B0B0', wallDark: '#909090', wallTop: '#C8C8C8', wallGrip: '#888888',
    net: '#4CAF50', netDark: '#388E3C', netPole: '#9E9E9E',
    finW: '#FFFFFF', finB: '#1a1a1a',
    /* 粒子 */
    dust: '#C4A66A', sparkG: '#66FF66', sparkR: '#FF4444',
    /* HUD */
    hudBg: 'rgba(20,30,50,0.75)',
    hudBorder: 'rgba(255,255,255,0.15)',
    labelTxt: '#FFFFFF',
    staminaBg: 'rgba(0,0,0,0.4)', staminaFill: '#4CAF50', staminaFillLight: '#66BB6A',
    /* UI面板 */
    panelBg: 'rgba(25,35,55,0.97)',
    panelBorder: 'rgba(255,215,0,0.3)',
    gold: '#FFD700',
    goldDark: '#DAA520',
    /* AI教练 */
    aiBody: '#4A90D9',
    aiBodyDark: '#357ABD',
    aiEye: '#FFFFFF',
    aiPupil: '#1a1a2e'
  };

  /* ==================== 8个障碍物定义 ==================== */
  var OBS = [
    { id: 0, name: '跨桩',     x1: 600,  x2: 880,  act: 'jump',  pen: 1, reset: false, desc: '跳跃越过' },
    { id: 1, name: '壕沟',     x1: 1200, x2: 1320, act: 'jump',  pen: 2, reset: true,  desc: '跳跃跨越' },
    { id: 2, name: '矮墙',     x1: 1800, x2: 1860, act: 'jump',  pen: 1, reset: false, desc: '跳跃翻越' },
    { id: 3, name: '高板跳台', x1: 2400, x2: 2650, act: 'jump',  pen: 1, reset: false, desc: '连续跳跃攀登' },
    { id: 4, name: '独木桥',   x1: 3200, x2: 3500, act: 'jump',  pen: 2, reset: true,  desc: '跳上去走过去' },
    { id: 5, name: '高墙',     x1: 4000, x2: 4030, act: 'climb', pen: 2, reset: false, desc: '自动攀爬' },
    { id: 6, name: '低桩网',   x1: 4600, x2: 4850, act: 'crawl', pen: 2, reset: false, desc: '匍匐通过' },
    { id: 7, name: '冲刺终点', x1: 5500, x2: 5800, act: 'sprint',pen: 0, reset: false, desc: '全力冲刺' }
  ];

  /* ============================================================
   * 第二部分：游戏变量
   * ============================================================ */

  var canvas, ctx, W, H;
  var groundY;
  var playerX, playerVY, playerYOff, jumpCount, playerState;
  var climbTimer, crawlTimer;
  var gameState, gameTime, score, penaltyTotal;
  var particles;
  var clouds, mountains, birds, flags;
  var obsStates;
  var consecutiveClear;
  var audioCtx;
  var frameCount;
  var mouseX, mouseY, mouseIn;
  var restartBtn;
  var keys;
  var shakeX, shakeY, shakeTimer;
  var flashAlpha, flashColor;
  var cameraX;
  var playerScreenX;
  var stompedStakeIndex = -1; /* 当前被踩踏的木桩索引，-1表示无 */
  var stompTimer = 0; /* 踩踏动画计时 */
  var onPlatform = null; /* 当前站立的平台 {type: 'stake'/'lowwall'/'platform'/'bridge', height: 30} */
  var wallTopTimer = 0; /* 高墙顶部停留计时器 */
  var hitFlashTimer = 0;  /* 碰撞后角色闪烁计时 */
  var landSquash = 0;     /* 落地压缩效果计时 */

  /* 新增变量 */
  var gameMode = GM.STANDARD;       // 当前游戏模式
  var selectedMode = 0;              // 开始界面选中的模式
  var settings = {                   // 设置
    sound: true,
    music: true,
    particles: 'high'  // high / low / off
  };
  var achievements = {};             // 成就解锁状态
  var bestTimes = { standard: null, challenge: null, training: null };
  var totalRuns = 0;                  // 累计完成次数
  var showSettings = false;          // 设置面板显示
  var resultTab = 0;                  // 结算面板Tab 0=成绩 1=AI教练

  /* AI教练数据 */
  var aiData = null;
  var aiTypewriter = null;              // 打字机效果状态
  var aiAnalysis = null;            // AI分析结果

  /* 转场效果 */
  var transition = {
    active: false,
    alpha: 0,
    type: 'fade',  // fade / zoom
    direction: 'in', // in / out
    callback: null
  };

  /* 倒计时 */
  var countdown = 0;

  /* 浮动文字 */
  var floatTexts = [];

  /* 音效系统扩展 */
  var bgmNodes = null;
  var footstepTimer = 0;
  var breathGain = null;
  var bgmGain = null;
  var sfxGain = null;

  /* 跑步动画6帧摆动表 */
  var RUN_FRAMES = 6;

  /* ============================================================
   * 第三部分：本地存储
   * ============================================================ */

  function loadStorage() {
    try {
      var s = localStorage.getItem('obstacle_game_settings');
      if (s) settings = JSON.parse(s);
      var a = localStorage.getItem('obstacle_game_achievements');
      if (a) achievements = JSON.parse(a);
      var b = localStorage.getItem('obstacle_game_best');
      if (b) bestTimes = JSON.parse(b);
      var t = localStorage.getItem('obstacle_game_total');
      if (t) totalRuns = parseInt(t) || 0;
    } catch (e) { /* 静默 */ }
  }

  function saveSettings() {
    try { localStorage.setItem('obstacle_game_settings', JSON.stringify(settings)); } catch (e) {}
  }

  function saveAchievements() {
    try { localStorage.setItem('obstacle_game_achievements', JSON.stringify(achievements)); } catch (e) {}
  }

  function saveBestTime(mode, time) {
    try {
      var key = ['standard', 'challenge', 'training'][mode];
      if (bestTimes[key] === null || time < bestTimes[key]) {
        bestTimes[key] = time;
        localStorage.setItem('obstacle_game_best', JSON.stringify(bestTimes));
      }
    } catch (e) {}
  }

  function saveTotalRuns() {
    try { localStorage.setItem('obstacle_game_total', String(totalRuns)); } catch (e) {}
  }

  function unlockAchievement(id) {
    if (!achievements[id]) {
      achievements[id] = { unlocked: true, time: Date.now() };
      saveAchievements();
      return true;
    }
    return false;
  }

  /* ============================================================
   * 第四部分：音效系统（Web Audio API - 扩展版）
   * ============================================================ */

  function initAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      /* 主增益节点 */
      sfxGain = audioCtx.createGain();
      sfxGain.gain.value = settings.sound ? 0.3 : 0;
      sfxGain.connect(audioCtx.destination);
      bgmGain = audioCtx.createGain();
      bgmGain.gain.value = settings.music ? 0.15 : 0;
      bgmGain.connect(audioCtx.destination);
      breathGain = audioCtx.createGain();
      breathGain.gain.value = 0;
      breathGain.connect(sfxGain);
    } catch (e) { /* 静默失败 */ }
  }

  function playSound(type) {
    if (!audioCtx || !settings.sound) return;
    try {
      var t = audioCtx.currentTime;
      switch (type) {
        case 'finish':
          playFinishFanfare(t);
          break;
        case 'jump':
          playTone(t, 350, 700, 0.12, 'sine', 0.1);
          break;
        case 'hit':
          playHit(t);
          break;
        case 'clear':
          playClear(t);
          break;
        case 'menu_move':
          playTone(t, 600, 600, 0.05, 'square', 0.08);
          break;
        case 'menu_select':
          playTone(t, 800, 1000, 0.1, 'sine', 0.12);
          break;
        case 'beep':
          playTone(t, 1000, 1000, 0.08, 'sine', 0.1);
          break;
        case 'countdown':
          playTone(t, 440, 440, 0.15, 'sine', 0.15);
          break;
        case 'go':
          playTone(t, 880, 880, 0.3, 'sine', 0.2);
          break;
        case 'achievement':
          playAchievementSound(t);
          break;
      }
    } catch (e) { /* 静默 */ }
  }

  function playTone(startTime, startFreq, endFreq, duration, type, volume) {
    var osc = audioCtx.createOscillator();
    var gn = audioCtx.createGain();
    osc.connect(gn); gn.connect(sfxGain);
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startTime);
    if (startFreq !== endFreq) {
      osc.frequency.linearRampToValueAtTime(endFreq, startTime + duration);
    }
    gn.gain.setValueAtTime(volume, startTime);
    gn.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.start(startTime); osc.stop(startTime + duration + 0.02);
  }

  function playHit(startTime) {
    var osc = audioCtx.createOscillator();
    var gn = audioCtx.createGain();
    var filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    osc.connect(filter); filter.connect(gn); gn.connect(sfxGain);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, startTime);
    osc.frequency.linearRampToValueAtTime(40, startTime + 0.2);
    gn.gain.setValueAtTime(0.15, startTime);
    gn.gain.linearRampToValueAtTime(0, startTime + 0.22);
    osc.start(startTime); osc.stop(startTime + 0.23);
  }

  function playClear(startTime) {
    var osc = audioCtx.createOscillator();
    var gn = audioCtx.createGain();
    osc.connect(gn); gn.connect(sfxGain);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, startTime);
    osc.frequency.setValueAtTime(1100, startTime + 0.08);
    gn.gain.setValueAtTime(0.08, startTime);
    gn.gain.linearRampToValueAtTime(0, startTime + 0.18);
    osc.start(startTime); osc.stop(startTime + 0.2);
  }

  function playFinishFanfare(startTime) {
    var notes = [523, 659, 784, 1047, 784, 1047];
    for (var i = 0; i < notes.length; i++) {
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.connect(g); g.connect(sfxGain);
      o.type = 'sine'; o.frequency.value = notes[i];
      var delay = i * 0.12;
      g.gain.setValueAtTime(0.15, startTime + delay);
      g.gain.linearRampToValueAtTime(0, startTime + delay + 0.25);
      o.start(startTime + delay); o.stop(startTime + delay + 0.3);
    }
  }

  function playAchievementSound(startTime) {
    var notes = [523, 659, 784, 1047];
    for (var i = 0; i < notes.length; i++) {
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.connect(g); g.connect(sfxGain);
      o.type = 'triangle'; o.frequency.value = notes[i];
      var delay = i * 0.08;
      g.gain.setValueAtTime(0.1, startTime + delay);
      g.gain.linearRampToValueAtTime(0, startTime + delay + 0.2);
      o.start(startTime + delay); o.stop(startTime + delay + 0.22);
    }
  }

  /* 军鼓节奏背景音乐 */
  function startBGM() {
    if (!audioCtx || !settings.music || bgmNodes) return;
    try {
      var t0 = audioCtx.currentTime;
      bgmNodes = { timer: null, interval: null };
      var bpm = 120;
      var beatDur = 60 / bpm;
      var beatCount = 0;

      function scheduleBeat() {
        if (!bgmNodes) return;
        var now = audioCtx.currentTime;
        /* 军鼓：噪声爆发 */
        var noiseBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
        var data = noiseBuf.getChannelData(0);
        for (var i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
        }
        var noise = audioCtx.createBufferSource();
        noise.buffer = noiseBuf;
        var nGain = audioCtx.createGain();
        var nFilter = audioCtx.createBiquadFilter();
        nFilter.type = 'highpass';
        nFilter.frequency.value = beatCount % 2 === 0 ? 1000 : 1500;
        noise.connect(nFilter); nFilter.connect(nGain); nGain.connect(bgmGain);
        var vol = (beatCount % 4 === 0) ? 0.25 : 0.15;
        nGain.gain.setValueAtTime(vol, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        noise.start(now); noise.stop(now + 0.06);

        /* 底鼓：低频正弦 */
        if (beatCount % 2 === 0) {
          var kick = audioCtx.createOscillator();
          var kGain = audioCtx.createGain();
          kick.connect(kGain); kGain.connect(bgmGain);
          kick.type = 'sine';
          kick.frequency.setValueAtTime(80, now);
          kick.frequency.exponentialRampToValueAtTime(30, now + 0.1);
          kGain.gain.setValueAtTime(0.3, now);
          kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          kick.start(now); kick.stop(now + 0.13);
        }

        beatCount++;
      }

      bgmNodes.interval = setInterval(scheduleBeat, beatDur * 1000);
      scheduleBeat();
    } catch (e) { /* 静默 */ }
  }

  function stopBGM() {
    if (bgmNodes && bgmNodes.interval) {
      clearInterval(bgmNodes.interval);
      bgmNodes = null;
    }
  }

  /* 更新音效设置 */
  function updateAudioSettings() {
    if (!audioCtx) return;
    if (sfxGain) sfxGain.gain.value = settings.sound ? 0.3 : 0;
    if (bgmGain) bgmGain.gain.value = settings.music ? 0.15 : 0;
  }

  /* ============================================================
   * 第五部分：粒子系统（保留对象池 + 质量设置）
   * ============================================================ */

  function createParticle() {
    return { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 2, color: '#fff', gravity: 0 };
  }

  function initParticles() {
    particles = [];
    for (var i = 0; i < PARTICLE_POOL_SIZE; i++) particles.push(createParticle());
  }

  function spawnParticle(x, y, vx, vy, life, size, color, grav) {
    if (settings.particles === 'off') return;
    /* 支持对象参数形式 */
    if (typeof x === 'object') {
      var o = x;
      x = o.x; y = o.y; vx = o.vx; vy = o.vy;
      life = o.life; size = o.size; color = o.color; grav = o.gravity;
    }
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (!p.active) {
        p.active = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy;
        p.life = life; p.maxLife = life; p.size = size; p.color = color;
        p.gravity = grav || 0;
        return;
      }
    }
  }

  function spawnDust(x, y, count) {
    if (settings.particles === 'off') return;
    if (settings.particles === 'low') count = Math.ceil(count / 2);
    for (var i = 0; i < count; i++) {
      spawnParticle(x + (Math.random() - 0.5) * 20, y,
        -Math.random() * 2 - 0.5, -Math.random() * 1.5 - 0.3,
        20 + Math.random() * 15, 2 + Math.random() * 2, CL.dust, 0.02);
    }
  }

  function spawnLandingDust(x, y) {
    if (settings.particles === 'off') return;
    var count = settings.particles === 'low' ? 8 : 15;
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI;
      var spd = 1 + Math.random() * 3;
      spawnParticle(x, y, Math.cos(ang) * spd * (Math.random() > 0.5 ? 1 : -1),
        -Math.sin(ang) * spd, 25 + Math.random() * 15, 2 + Math.random() * 3, CL.dust, 0.04);
    }
  }

  function spawnStompEffect(worldX, stakeIdx) {
    /* 木桩被踩踏时的尘土效果 */
    var sx = toScreenX(worldX);
    for (var i = 0; i < 6; i++) {
      spawnParticle({
        x: sx + (Math.random() - 0.5) * 10,
        y: groundY - 30,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 3 - 1,
        life: 20 + Math.random() * 15,
        maxLife: 35,
        size: 2 + Math.random() * 2,
        color: '#C4A66A',
        gravity: 0.15
      });
    }
    stompedStakeIndex = stakeIdx;
    stompTimer = 15;
  }

  function spawnHitFlash(x, y) {
    if (settings.particles === 'off') return;
    var count = settings.particles === 'low' ? 5 : 10;
    for (var i = 0; i < count; i++) {
      spawnParticle(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3,
        15 + Math.random() * 10, 3 + Math.random() * 2, CL.sparkR, 0);
    }
    flashAlpha = 0.3; flashColor = 'rgba(255,50,50,';
  }

  function spawnClearSparkle(x, y) {
    if (settings.particles === 'off') return;
    var count = settings.particles === 'low' ? 7 : 15;
    for (var i = 0; i < count; i++) {
      spawnParticle(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 2, -Math.random() * 3 - 1,
        30 + Math.random() * 20, 2 + Math.random() * 2, CL.sparkG, 0.02);
    }
  }

  function spawnPassEffect(sx, sy) {
    if (settings.particles === 'off') return;
    /* 放射状绿色粒子 */
    for (var i = 0; i < 12; i++) {
      var angle = (Math.PI * 2 / 12) * i;
      spawnParticle(
        sx, sy,
        Math.cos(angle) * (2 + Math.random() * 2),
        Math.sin(angle) * (2 + Math.random() * 2) - 1,
        25 + Math.random() * 15, 3 + Math.random() * 2, '#4CAF50', 0.1
      );
    }
    /* 中心白色闪光粒子 */
    spawnParticle(
      sx, sy,
      0, 0,
      8, 30, '#FFFFFF', 0
    );
  }

  function spawnPlatformLandEffect(sx, sy) {
    if (settings.particles === 'off') return;
    /* 白色扩散圆圈 */
    spawnParticle({
      x: sx, y: sy,
      vx: 0, vy: 0,
      life: 12, maxLife: 12,
      size: 5, color: 'rgba(255,255,255,0.4)',
      gravity: 0
    });
    /* 金色星形粒子 */
    for (var i = 0; i < 8; i++) {
      var angle = (Math.PI * 2 / 8) * i;
      spawnParticle({
        x: sx, y: sy,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2 - 1,
        life: 20, maxLife: 20,
        size: 3, color: '#FFD700',
        gravity: 0.1
      });
    }
  }

  function spawnConfetti(x, y, count) {
    if (settings.particles === 'off') return;
    if (settings.particles === 'low') count = Math.ceil(count / 2);
    var colors = ['#FF4444', '#44FF44', '#4444FF', '#FFFF44', '#FF44FF', '#44FFFF', '#FFA500', '#FF69B4'];
    for (var i = 0; i < count; i++) {
      spawnParticle(x + (Math.random() - 0.5) * W, y - Math.random() * 100,
        (Math.random() - 0.5) * 4, Math.random() * 2 + 1,
        80 + Math.random() * 60, 3 + Math.random() * 3,
        colors[Math.floor(Math.random() * colors.length)], 0.03);
    }
  }

  function updateParticles() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (!p.active) continue;
      p.x += p.vx; p.y += p.vy;
      p.vy += p.gravity; p.life--;
      if (p.life <= 0) p.active = false;
    }
  }

  function drawParticles() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (!p.active) continue;
      var alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  /* ============================================================
   * 第六部分：AI教练系统
   * ============================================================ */

  function initAIData() {
    aiData = {
      obstacleTimes: [],       // 每个障碍通过时间
      obstacleCollisions: [], // 每个障碍碰撞次数
      obstacleMaxHeights: [], // 每个障碍最大跳跃高度
      crawlTiming: [],         // 匍匐时机数据
      speedPhases: [],         // 各阶段速度
      jumpCount: 0,
      totalJumps: 0,
      perfectObstacles: 0,
      firstCrawlFrame: 0
    };
    for (var i = 0; i < OBS.length; i++) {
      aiData.obstacleTimes.push(0);
      aiData.obstacleCollisions.push(0);
      aiData.obstacleMaxHeights.push(0);
    }
  }

  function recordObstacleData(idx, time, collisions, maxHeight) {
    if (!aiData) return;
    aiData.obstacleTimes[idx] = time;
    aiData.obstacleCollisions[idx] = collisions;
    aiData.obstacleMaxHeights[idx] = maxHeight;
  }

  function generateAIAnalysis() {
    if (!aiData) return null;

    var finalScore = Math.max(0, Math.round(score));
    var rank = getRank(finalScore);
    var totalCollisions = countCollisions();
    var modeCfg = MODE_CONFIG[gameMode];

    /* 找出表现最好和最差的障碍 */
    var bestObs = -1, bestTime = Infinity;
    var worstObs = -1, worstTime = -1;
    var perfectObs = [];

    /* 标准参考时间（秒） */
    var stdTimes = [1.5, 1.0, 0.8, 2.0, 3.0, 2.0, 5.0, 4.0];

    for (var i = 0; i < 7; i++) {
      var t = aiData.obstacleTimes[i];
      if (t <= 0) continue;
      var rel = t / stdTimes[i];
      if (aiData.obstacleCollisions[i] === 0 && rel < 1.3) {
        perfectObs.push(i);
      }
      if (rel < bestTime) { bestTime = rel; bestObs = i; }
      if (rel > worstTime) { worstTime = rel; worstObs = i; }
    }

    /* 优点列表 */
    var strengths = [];
    if (bestObs >= 0 && aiData.obstacleCollisions[bestObs] === 0) {
      var obsNames = ['跨桩', '壕沟', '矮墙', '高板跳台', '独木桥', '高墙', '低桩网'];
      var praiseTemplates = [
        obsNames[bestObs] + '动作标准，一气呵成',
        obsNames[bestObs] + '通过节奏稳定，爆发力不错',
        obsNames[bestObs] + '技巧娴熟，堪称范本级表现'
      ];
      strengths.push(praiseTemplates[Math.floor(Math.random() * praiseTemplates.length)]);
    }
    if (totalCollisions <= 2) {
      strengths.push('整体失误控制较好，稳定性不错');
    }
    if (aiData.obstacleCollisions[5] === 0 && aiData.obstacleTimes[5] > 0) {
      strengths.push('高墙攀爬动作标准，上肢力量充足');
    }
    if (aiData.obstacleCollisions[0] === 0 && aiData.obstacleTimes[0] > 0) {
      strengths.push('跨桩节奏稳定，步法灵活');
    }
    if (strengths.length < 2) {
      strengths.push('完成了全部训练，值得肯定');
    }
    if (strengths.length > 3) strengths = strengths.slice(0, 3);

    /* 缺点列表 */
    var weaknesses = [];
    if (worstObs >= 0 && aiData.obstacleCollisions[worstObs] > 0) {
      var obsNames2 = ['跨桩', '壕沟', '矮墙', '高板跳台', '独木桥', '高墙', '低桩网'];
      var lossTime = (aiData.obstacleTimes[worstObs] - stdTimes[worstObs]).toFixed(1);
      weaknesses.push(obsNames2[worstObs] + '失误较多，损失约' + lossTime + '秒');
    }
    if (totalCollisions >= 3) {
      weaknesses.push('整体失误偏多，需要加强稳定性训练');
    }
    /* 壕沟起跳时机分析 */
    if (aiData.obstacleCollisions[1] > 0 || (aiData.obstacleTimes[1] > stdTimes[1] * 1.5)) {
      weaknesses.push('壕沟起跳点偏晚，建议提前0.2秒起跳');
    }
    /* 低桩网匍匐反应 */
    if (aiData.obstacleCollisions[6] > 0) {
      weaknesses.push('低桩网匍匐反应慢，建议提前压低身体');
    }
    /* 冲刺阶段分析 */
    var sprintTime = aiData.obstacleTimes[7];
    if (sprintTime > 0 && sprintTime > stdTimes[7] * 1.3) {
      weaknesses.push('后程冲刺乏力，需要加强耐力训练');
    }
    if (weaknesses.length < 2) {
      weaknesses.push('继续保持，向更高目标迈进');
    }
    if (weaknesses.length > 3) weaknesses = weaknesses.slice(0, 3);

    /* 个性化建议 */
    var suggestions = [];
    var focusObs = worstObs >= 0 ? worstObs : 1;
    var obsNames3 = ['跨桩节奏', '壕沟起跳时机', '矮墙翻越', '高板跳台连续跳跃', '独木桥平衡', '高墙攀爬', '低桩网匍匐'];
    suggestions.push('建议重点练习「' + obsNames3[focusObs] + '」');

    var trainTips = [
      '每天做 3 组立定跳远增强爆发力',
      '每天做 2 组深蹲跳，每组 20 次',
      '加强核心力量训练，平板支撑 3 组 × 1 分钟',
      '每天晨跑 1000 米提升耐力',
      '每周 2 次上肢力量训练（俯卧撑+引体向上）'
    ];
    suggestions.push(trainTips[Math.floor(Math.random() * trainTips.length)]);

    /* 预计提升 */
    var improvement = Math.min(10, Math.max(3, Math.round(totalCollisions * 2 + (worstTime > 1.5 ? 3 : 0))));

    return {
      score: finalScore,
      rank: rank,
      strengths: strengths,
      weaknesses: weaknesses,
      suggestions: suggestions,
      improvement: improvement,
      totalCollisions: totalCollisions,
      modeName: modeCfg.name
    };
  }

  /* 打字机效果 */
  function startTypewriter(analysis) {
    var fullText = buildAIText(analysis);
    aiTypewriter = {
      fullText: fullText,
      displayed: '',
      index: 0,
      speed: 2,  // 每帧字符数
      timer: 0
    };
  }

  function buildAIText(analysis) {
    var lines = [];
    lines.push('综合评分：' + analysis.score + '/100  军衔：' + analysis.rank);
    lines.push('');
    lines.push('✅ 优点：');
    for (var i = 0; i < analysis.strengths.length; i++) {
      lines.push('• ' + analysis.strengths[i]);
    }
    lines.push('');
    lines.push('⚠️ 待改进：');
    for (var j = 0; j < analysis.weaknesses.length; j++) {
      lines.push('• ' + analysis.weaknesses[j]);
    }
    lines.push('');
    lines.push('💡 个性化训练建议：');
    for (var k = 0; k < analysis.suggestions.length; k++) {
      lines.push(analysis.suggestions[k]);
    }
    lines.push('');
    lines.push('预计提升：坚持训练1周可提升 ' + analysis.improvement + '-' + (analysis.improvement + 3) + ' 秒');
    return lines.join('\n');
  }

  function updateTypewriter() {
    if (!aiTypewriter) return;
    aiTypewriter.timer++;
    if (aiTypewriter.timer >= 2) {
      aiTypewriter.timer = 0;
      if (aiTypewriter.index < aiTypewriter.fullText.length) {
        aiTypewriter.displayed += aiTypewriter.fullText.charAt(aiTypewriter.index);
        aiTypewriter.index++;
      }
    }
  }

  /* ============================================================
   * 第七部分：成就系统
   * ============================================================ */

  function checkAchievements() {
    var newlyUnlocked = [];
    var finalScore = Math.max(0, Math.round(score));
    var totalCollisions = countCollisions();

    /* 初出茅庐：完成第一次训练 */
    if (unlockAchievement('first_run')) newlyUnlocked.push('first_run');

    /* 身轻如燕：全程零碰撞完成 */
    if (totalCollisions === 0) {
      if (unlockAchievement('no_hit')) newlyUnlocked.push('no_hit');
    }

    /* 神速突击：标准模式跑进40秒 */
    if (gameMode === GM.STANDARD && gameTime < 40) {
      if (unlockAchievement('speed_demon')) newlyUnlocked.push('speed_demon');
    }

    /* 特等兵王：标准模式达到90分以上 */
    if (gameMode === GM.STANDARD && finalScore >= 90) {
      if (unlockAchievement('top_soldier')) newlyUnlocked.push('top_soldier');
    }

    /* 挑战达人：挑战模式完成一次 */
    if (gameMode === GM.CHALLENGE) {
      if (unlockAchievement('challenge_master')) newlyUnlocked.push('challenge_master');
    }

    /* 百炼成钢：累计完成10次 */
    totalRuns++;
    saveTotalRuns();
    if (totalRuns >= 10) {
      if (unlockAchievement('veteran')) newlyUnlocked.push('veteran');
    }

    return newlyUnlocked;
  }

  /* ============================================================
   * 第八部分：云朵、飞鸟、旗帜等背景系统
   * ============================================================ */

  function initClouds() {
    clouds = [];
    for (var i = 0; i < 6; i++) {
      clouds.push({
        x: Math.random() * 1600 - 200,
        y: 20 + Math.random() * (groundY * 0.35),
        w: 80 + Math.random() * 120,
        h: 25 + Math.random() * 20,
        speed: 0.15 + Math.random() * 0.25,
        parallax: 0.1 + Math.random() * 0.15
      });
    }
  }

  function updateClouds() {
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      c.x += c.speed;
      if (c.x > W + 300) c.x = -300;
    }
  }

  function initBirds() {
    birds = [];
    for (var i = 0; i < 3; i++) {
      birds.push({
        x: Math.random() * W,
        y: 30 + Math.random() * 60,
        speed: 0.5 + Math.random() * 0.5,
        wingPhase: Math.random() * Math.PI * 2,
        size: 6 + Math.random() * 4
      });
    }
  }

  function updateBirds() {
    for (var i = 0; i < birds.length; i++) {
      var b = birds[i];
      b.x += b.speed;
      b.wingPhase += 0.15;
      if (b.x > W + 50) {
        b.x = -50;
        b.y = 30 + Math.random() * 60;
      }
    }
  }

  function initFlags() {
    flags = [];
    /* 在训练塔旁边放置旗帜 */
    flags.push({ x: 800, y: groundY - 120, phase: 0 });
    flags.push({ x: 3000, y: groundY - 100, phase: 1 });
  }

  /* ============================================================
   * 第九部分：输入处理
   * ============================================================ */

  function initInput() {
    keys = { jump: false, down: false, up: false, left: false, right: false, sprint: false, jumpPressed: false, downPressed: false, upPressed: false };
    mouseX = 0; mouseY = 0; mouseIn = false;

    document.addEventListener('keydown', function (e) {
      var code = e.code;

      /* 开始界面操作 */
      if (gameState === GS.START) {
        if (showSettings) {
          if (code === 'Escape') {
            showSettings = false;
            playSound('menu_move');
          }
          return;
        }
        if (code === 'ArrowUp' || code === 'KeyW') {
          e.preventDefault();
          selectedMode = (selectedMode + 2) % 3;
          playSound('menu_move');
        }
        if (code === 'ArrowDown' || code === 'KeyS') {
          e.preventDefault();
          selectedMode = (selectedMode + 1) % 3;
          playSound('menu_move');
        }
        if (code === 'Enter' || code === 'Space') {
          e.preventDefault();
          startGameFromMenu();
        }
        return;
      }

      if (gameState === GS.SETTINGS) {
        if (code === 'Escape') {
          gameState = GS.START;
          playSound('menu_move');
        }
        return;
      }

      /* 结算界面操作 */
      if (gameState === GS.FINISHED) {
        if (code === 'Tab') {
          e.preventDefault();
          resultTab = 1 - resultTab;
          playSound('menu_move');
          if (resultTab === 1 && aiAnalysis && !aiTypewriter) {
            startTypewriter(aiAnalysis);
          }
        }
        if (code === 'KeyR' || code === 'Enter' || code === 'Space') {
          e.preventDefault();
          restartToMenu();
        }
        return;
      }

      /* 游戏中操作 */
      if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') {
        e.preventDefault();
        if (!keys.jump) keys.jumpPressed = true;
        keys.jump = true;
      }
      if (code === 'KeyS' || code === 'ArrowDown') {
        e.preventDefault();
        keys.down = true;
        keys.downPressed = true;
      }
      if (code === 'KeyA' || code === 'ArrowLeft') {
        e.preventDefault();
        keys.left = true;
      }
      if (code === 'KeyD' || code === 'ArrowRight') {
        e.preventDefault();
        keys.right = true;
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight') {
        keys.sprint = true;
      }
      if (code === 'KeyR' || code === 'Enter') {
        e.preventDefault();
        if (gameState === GS.READY) startGame();
        else if (gameState === GS.FINISHED) resetAndStart();
      }
    });

    document.addEventListener('keyup', function (e) {
      var code = e.code;
      if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') keys.jump = false;
      if (code === 'KeyS' || code === 'ArrowDown') keys.down = false;
      if (code === 'KeyA' || code === 'ArrowLeft') keys.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') keys.right = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight') keys.sprint = false;
    });

    canvas.addEventListener('mousedown', function (e) {
      var rect = canvas.getBoundingClientRect();
      var scaleX = W / rect.width;
      var scaleY = H / rect.height;
      mouseX = (e.clientX - rect.left) * scaleX;
      mouseY = (e.clientY - rect.top) * scaleY;
      mouseIn = true;

      if (gameState === GS.START) {
        handleStartScreenClick(mouseX, mouseY);
      } else if (gameState === GS.FINISHED) {
        handleResultScreenClick(mouseX, mouseY);
      } else if (gameState === GS.READY) {
        startGame();
      }
    });

    canvas.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) * (W / rect.width);
      mouseY = (e.clientY - rect.top) * (H / rect.height);
    });
  }

  function handleStartScreenClick(x, y) {
    /* 设置按钮 */
    var gearX = W - 50, gearY = H - 50, gearR = 20;
    var dx = x - gearX, dy = y - gearY;
    if (dx * dx + dy * dy <= gearR * gearR) {
      showSettings = !showSettings;
      playSound('menu_select');
      return;
    }

    if (showSettings) {
      handleSettingsClick(x, y);
      return;
    }

    /* 模式按钮 */
    var btnW = 280, btnH = 44;
    var btnX = W / 2 - btnW / 2;
    for (var i = 0; i < 3; i++) {
      var by = H * 0.42 + i * 54;
      if (x >= btnX && x <= btnX + btnW && y >= by && y <= by + btnH) {
        selectedMode = i;
        playSound('menu_move');
        startGameFromMenu();
        return;
      }
    }
  }

  function handleSettingsClick(x, y) {
    /* 音效开关 */
    var sx = W / 2 - 120;
    var sy = H / 2 - 60;
    var sw = 240, sh = 40;
    if (x >= sx && x <= sx + sw && y >= sy && y <= sy + sh) {
      settings.sound = !settings.sound;
      saveSettings();
      updateAudioSettings();
      playSound('menu_select');
      return;
    }
    /* 音乐开关 */
    sy += 50;
    if (x >= sx && x <= sx + sw && y >= sy && y <= sy + sh) {
      settings.music = !settings.music;
      saveSettings();
      updateAudioSettings();
      if (settings.music) startBGM(); else stopBGM();
      playSound('menu_select');
      return;
    }
    /* 粒子效果 */
    sy += 50;
    if (x >= sx && x <= sx + sw && y >= sy && y <= sy + sh) {
      var levels = ['high', 'low', 'off'];
      var idx = levels.indexOf(settings.particles);
      settings.particles = levels[(idx + 1) % 3];
      saveSettings();
      playSound('menu_select');
      return;
    }
  }

  function handleResultScreenClick(x, y) {
    /* Tab 切换 - 与 drawResultPanel 保持一致 */
    var panelH = 420;
    var panelY = H / 2 - panelH / 2;
    var tabY = panelY - 36 + 1;
    var tabW = 120, tabH = 36;
    var tab1X = W / 2 - tabW - 5;
    var tab2X = W / 2 + 5;
    if (y >= tabY && y <= tabY + tabH) {
      if (x >= tab1X && x <= tab1X + tabW && resultTab !== 0) {
        resultTab = 0;
        playSound('menu_move');
        return;
      }
      if (x >= tab2X && x <= tab2X + tabW && resultTab !== 1) {
        resultTab = 1;
        playSound('menu_move');
        /* 切换到AI教练Tab时重新开始打字机 */
        if (aiAnalysis && !aiTypewriter) {
          startTypewriter(aiAnalysis);
        }
        return;
      }
    }

    /* 重新开始按钮 - 使用传入的 x/y 而非全局 mouseX/mouseY */
    if (restartBtn && x >= restartBtn.x && x <= restartBtn.x + restartBtn.w &&
        y >= restartBtn.y && y <= restartBtn.y + restartBtn.h) {
      restartToMenu();
    }
  }

  /* ============================================================
   * 第十部分：坐标转换
   * ============================================================ */

  function toScreenX(worldX) { return worldX - cameraX; }
  function toWorldX(screenX) { return screenX + cameraX; }

  /* ============================================================
   * 第十一部分：绘制 - 天空与背景（升级版）
   * ============================================================ */

  function drawSky() {
    /* 天空渐变 */
    var grad = ctx.createLinearGradient(0, 0, 0, groundY);
    grad.addColorStop(0, CL.skyTop);
    grad.addColorStop(1, CL.skyBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, groundY);

    /* 太阳光晕 */
    var sunX = W * 0.8, sunY = groundY * 0.25;
    var sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 120);
    sunGrad.addColorStop(0, 'rgba(255,220,100,0.4)');
    sunGrad.addColorStop(0.5, 'rgba(255,200,80,0.15)');
    sunGrad.addColorStop(1, 'rgba(255,180,60,0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(sunX - 120, sunY - 120, 240, 240);
    /* 太阳本体 */
    ctx.fillStyle = CL.sunCore;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 25, 0, Math.PI * 2);
    ctx.fill();

    /* 云朵 */
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      var cx = ((c.x - cameraX * c.parallax) % (W + 600));
      if (cx < -300) cx += W + 600;
      drawCloud(cx, c.y, c.w, c.h);
    }

    /* 飞鸟 */
    drawBirds();
  }

  function drawCloud(x, y, w, h) {
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - w * 0.3, y + h * 0.1, w * 0.3, h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.3, y + h * 0.05, w * 0.35, h * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBirds() {
    ctx.strokeStyle = 'rgba(50,50,70,0.6)';
    ctx.lineWidth = 1.5;
    for (var i = 0; i < birds.length; i++) {
      var b = birds[i];
      var bx = b.x - cameraX * 0.05;
      while (bx < -20) bx += W + 40;
      while (bx > W + 20) bx -= W + 40;
      var wingY = Math.sin(b.wingPhase) * b.size * 0.6;
      ctx.beginPath();
      ctx.moveTo(bx - b.size, b.y + wingY);
      ctx.quadraticCurveTo(bx, b.y - wingY * 0.5, bx + b.size, b.y + wingY);
      ctx.stroke();
    }
  }

  function drawMountains() {
    var farOffset = -(cameraX * 0.08) % W;
    var nearOffset = -(cameraX * 0.15) % W;

    /* 远山 */
    ctx.fillStyle = CL.mtnFar;
    drawMountainLayer(farOffset, 0.6);
    drawMountainLayer(farOffset + W, 0.6);

    /* 近山 */
    ctx.fillStyle = CL.mtnNear;
    drawMountainLayer(nearOffset, 0.4);
    drawMountainLayer(nearOffset + W, 0.4);

    /* 训练塔（远景） */
    drawTrainingTowers();

    /* 军营帐篷剪影 */
    drawTents();
  }

  function drawMountainLayer(offset, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(offset, groundY);
    var peaks = [0, 0.12, 0.25, 0.38, 0.52, 0.65, 0.78, 0.9, 1.0];
    var heights = [40, 70, 50, 85, 45, 65, 55, 75, 35];
    for (var i = 0; i < peaks.length; i++) {
      ctx.lineTo(offset + W * peaks[i], groundY - heights[i]);
    }
    ctx.lineTo(offset + W, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawTrainingTowers() {
    var towerOffset = -(cameraX * 0.1) % (W * 1.5);
    var towerData = [
      { x: 0.2, w: 30, h: 80 },
      { x: 0.7, w: 25, h: 65 }
    ];
    for (var i = 0; i < towerData.length; i++) {
      var td = towerData[i];
      var tx = towerOffset + W * td.x;
      while (tx < -50) tx += W * 1.5;
      while (tx > W + 50) tx -= W * 1.5;
      if (tx < -50 || tx > W + 50) continue;

      ctx.fillStyle = CL.tower;
      ctx.fillRect(tx - td.w / 2, groundY - td.h, td.w, td.h);
      /* 塔顶 */
      ctx.beginPath();
      ctx.moveTo(tx - td.w / 2 - 5, groundY - td.h);
      ctx.lineTo(tx, groundY - td.h - 15);
      ctx.lineTo(tx + td.w / 2 + 5, groundY - td.h);
      ctx.closePath();
      ctx.fill();
      /* 窗户 */
      ctx.fillStyle = CL.towerDark;
      for (var j = 0; j < 3; j++) {
        ctx.fillRect(tx - 4, groundY - td.h + 15 + j * 20, 8, 10);
      }
      /* 旗帜 */
      var flagWave = Math.sin(frameCount * 0.05 + i) * 3;
      ctx.fillStyle = '#CC3333';
      ctx.beginPath();
      ctx.moveTo(tx, groundY - td.h - 15);
      ctx.lineTo(tx + 12 + flagWave, groundY - td.h - 12);
      ctx.lineTo(tx, groundY - td.h - 8);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawTents() {
    var tentOffset = -(cameraX * 0.12) % (W * 2);
    var tentData = [
      { x: 0.15, w: 50, h: 28 }, { x: 0.32, w: 40, h: 22 },
      { x: 0.68, w: 55, h: 30 }, { x: 0.85, w: 45, h: 24 }
    ];
    for (var i = 0; i < tentData.length; i++) {
      var td = tentData[i];
      var tx = tentOffset + W * td.x;
      while (tx < -100) tx += W * 2;
      while (tx > W + 100) tx -= W * 2;
      if (tx < -100 || tx > W + 100) continue;

      ctx.fillStyle = CL.tent;
      ctx.beginPath();
      ctx.moveTo(tx - td.w / 2, groundY);
      ctx.lineTo(tx, groundY - td.h);
      ctx.lineTo(tx + td.w / 2, groundY);
      ctx.closePath(); ctx.fill();
      /* 暗面 */
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.moveTo(tx, groundY - td.h);
      ctx.lineTo(tx + td.w / 2, groundY);
      ctx.lineTo(tx, groundY);
      ctx.closePath(); ctx.fill();
    }
  }

  /* ============================================================
   * 第十二部分：绘制 - 地面（升级版）
   * ============================================================ */

  function drawGround() {
    /* 草地 */
    var grassGrad = ctx.createLinearGradient(0, groundY - 20, 0, groundY + 5);
    grassGrad.addColorStop(0, '#5a8a3a');
    grassGrad.addColorStop(1, CL.grass);
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, groundY - 10, W, 15);

    /* 草丛细节 */
    drawGrassDetails();

    /* 地面线 */
    ctx.strokeStyle = CL.groundDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    /* 泥土 */
    ctx.fillStyle = CL.ground;
    ctx.fillRect(0, groundY, W, H - groundY);

    /* 泥土纹理石子 */
    ctx.fillStyle = CL.groundDark;
    for (var i = 0; i < 20; i++) {
      var seed = (Math.floor(cameraX / 50) + i) * 2654435761;
      var dx = (seed % 1000) / 1000 * W;
      var dy = groundY + 5 + ((seed * 7) % 1000) / 1000 * (H - groundY - 10);
      ctx.fillRect(dx, dy, 3 + (seed % 4), 2);
    }
    /* 小石子 */
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (var j = 0; j < 15; j++) {
      var s2 = (Math.floor(cameraX / 30) + j * 7) * 1234567;
      var sx2 = (s2 % 1000) / 1000 * W;
      var sy2 = groundY + 8 + ((s2 * 13) % 1000) / 1000 * (H - groundY - 15);
      ctx.fillRect(sx2, sy2, 2, 1);
    }

    /* 距离标记 */
    var markStart = Math.floor((cameraX - 50) / 100) * 100;
    for (var mx = markStart; mx < cameraX + W + 100; mx += 100) {
      var sx = toScreenX(mx);
      if (sx < -20 || sx > W + 20) continue;
      if (mx % 500 === 0 && mx >= 0 && mx <= TRACK_LENGTH) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, groundY - 8);
        ctx.lineTo(sx, groundY + 8);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((mx / 10) + 'm', sx, groundY - 10);
      } else if (mx % 100 === 0 && mx >= 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, groundY - 4);
        ctx.lineTo(sx, groundY + 4);
        ctx.stroke();
      }
    }

    /* 起点线 */
    var startScreenX = toScreenX(0);
    if (startScreenX > -20 && startScreenX < W + 20) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startScreenX, groundY - 15);
      ctx.lineTo(startScreenX, groundY + 15);
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('起点', startScreenX, groundY - 20);
    }
  }

  function drawGrassDetails() {
    ctx.fillStyle = CL.grassLight;
    for (var i = 0; i < 40; i++) {
      var seed = (Math.floor(cameraX / 20) + i) * 374761393;
      var gx = (seed % 1000) / 1000 * W;
      var gy = groundY - 2 - ((seed * 3) % 8);
      var gh = 3 + (seed % 5);
      ctx.fillRect(gx, gy, 1, gh);
    }
  }

  /* ============================================================
   * 第十三部分：绘制 - 障碍物（升级版，增加阴影）
   * ============================================================ */

  function drawObstacles() {
    for (var i = 0; i < OBS.length; i++) {
      var o = OBS[i];
      var sx1 = toScreenX(o.x1);
      var sx2 = toScreenX(o.x2);
      if (sx2 < -200 || sx1 > W + 200) continue;

      var st = obsStates[i];
      if (st.cleared) {
        ctx.globalAlpha = Math.max(0.25, 1 - (playerX - o.x2) / 800);
      }

      /* 障碍物阴影 */
      drawObstacleShadow(o, sx1, sx2, i);

      switch (i) {
        case 0: drawStakes(o); break;
        case 1: drawTrench(o); break;
        case 2: drawLowWall(o); break;
        case 3: drawPlatform(o); break;
        case 4: drawBridge(o); break;
        case 5: drawHighWall(o); break;
        case 6: drawCrawlNet(o); break;
        case 7: drawFinishLine(o); break;
      }
      ctx.globalAlpha = 1;

      drawObsLabel(o, i);

      /* 障碍接近预警 */
      if (o.act !== 'sprint' && !st.cleared) {
        var dist = o.x1 - playerX;
        if (dist > 50 && dist < 300) {
          var sx = toScreenX(o.x1 + (o.x2 - o.x1) / 2);
          var warnText = '';
          var warnColor = '#FFD700';
          switch (o.act) {
            case 'jump': warnText = '>> JUMP! <<'; break;
            case 'crawl': warnText = '>> CRAWL! <<'; break;
            case 'run': warnText = '>> BALANCE! <<'; break;
            case 'climb': warnText = '>> CLIMB! <<'; break;
          }
          if (warnText) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, (300 - dist) / 150) * (0.5 + 0.5 * Math.sin(frameCount * 0.15));
            ctx.fillStyle = warnColor;
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(warnText, sx, groundY - 80);
            ctx.restore();
          }
        }
      }
    }
  }

  function drawObstacleShadow(o, sx1, sx2, idx) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    switch (idx) {
      case 2: /* 矮墙阴影 */
        ctx.fillRect(sx1 + 60, groundY + 2, 15, 4);
        break;
      case 5: /* 高墙阴影 */
        ctx.fillRect(sx1 + 30, groundY + 2, 20, 5);
        break;
    }
  }

  function drawObsLabel(o, idx) {
    var st = obsStates[idx];
    if (st.cleared) return;
    var sx = toScreenX(o.x1);
    if (sx < -50 || sx > W + 50) return;
    if (sx < 80) return;

    var alpha = 1;
    if (sx > W - 100) alpha = (W - sx) / 100;
    if (alpha <= 0) return;

    ctx.globalAlpha = alpha * 0.9;
    var label = '0' + (idx + 1) + ' ' + o.name;
    ctx.font = 'bold 13px sans-serif';
    var tw = ctx.measureText(label).width + 16;
    var th = 24;
    var lx = sx - tw / 2;
    var ly = groundY - 100;

    ctx.fillStyle = CL.hudBg;
    roundRect(ctx, lx, ly, tw, th, 4);
    ctx.fill();
    ctx.strokeStyle = CL.hudBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, lx, ly, tw, th, 4);
    ctx.stroke();
    ctx.fillStyle = CL.labelTxt;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, sx, ly + th / 2);
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic';
  }

  /* --- 1. 跨桩 --- */
  function drawStakes(o) {
    var count = 5;
    var spacing = (o.x2 - o.x1) / (count - 1);
    for (var j = 0; j < count; j++) {
      var sx = toScreenX(o.x1 + spacing * j);
      if (sx < -30 || sx > W + 30) continue;
      var stakeW = 14;
      var stakeH = 30;
      var x = sx;
      var y = groundY;
      var stompOffset = (stompedStakeIndex === j && stompTimer > 0) ? (stompTimer / 15) * 4 : 0;

      /* 阴影 */
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(x + 3, y + 2, stakeW * 0.6, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      /* 木桩侧面 */
      ctx.fillStyle = CL.stake;
      ctx.fillRect(x - stakeW / 2, y - stakeH + stompOffset, stakeW, stakeH);
      /* 顶面 */
      ctx.fillStyle = CL.stakeTop;
      ctx.beginPath();
      ctx.ellipse(x, y - stakeH + stompOffset, stakeW / 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      /* 暗面 */
      ctx.fillStyle = CL.stakeDark;
      ctx.fillRect(x - stakeW / 2, y - stakeH + stompOffset, stakeW * 0.3, stakeH);
    }
  }

  /* --- 2. 壕沟 --- */
  function drawTrench(o) {
    var sx1 = toScreenX(o.x1);
    var sx2 = toScreenX(o.x2);
    var width = sx2 - sx1;
    if (width < 1) return;
    var depth = 50;
    var x = sx1;

    /* 两侧土堆阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(x - 18, groundY + 2, 20, 4);
    ctx.fillRect(x + width - 2, groundY + 2, 20, 4);

    /* 壕沟凹陷 */
    ctx.fillStyle = CL.trenchDark;
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x + width, groundY);
    ctx.lineTo(x + width - width * 0.15, groundY + depth);
    ctx.lineTo(x + width * 0.15, groundY + depth);
    ctx.closePath();
    ctx.fill();

    /* 两侧土堆 */
    ctx.fillStyle = CL.trenchMound;
    ctx.beginPath();
    ctx.moveTo(x - 15, groundY + 3);
    ctx.quadraticCurveTo(x + 5, groundY - 18, x + 18, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + width + 15, groundY + 3);
    ctx.quadraticCurveTo(x + width - 5, groundY - 18, x + width - 18, groundY);
    ctx.closePath();
    ctx.fill();

    /* 深度阴影 */
    var tGrad = ctx.createLinearGradient(x, groundY, x, groundY + depth);
    tGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
    tGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x + width, groundY);
    ctx.lineTo(x + width - width * 0.15, groundY + depth);
    ctx.lineTo(x + width * 0.15, groundY + depth);
    ctx.closePath();
    ctx.fill();
  }

  /* --- 3. 矮墙 --- */
  function drawLowWall(o) {
    var sx = toScreenX(o.x1);
    if (sx < -80 || sx > W + 80) return;
    var wallW = 60;  /* 加宽到60px */
    var wallH = 75;  /* 加高到75px */
    var x = sx;

    /* 阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x + wallW, groundY + 2, 12, 4);

    /* 墙体 */
    ctx.fillStyle = CL.wall;  /* 砖红色 */
    ctx.fillRect(x, groundY - wallH, wallW, wallH);

    /* 砖缝纹理 */
    ctx.strokeStyle = CL.wallDark;
    ctx.lineWidth = 1;
    var rows = 5;
    for (var row = 0; row < rows; row++) {
      var ry = groundY - wallH + wallH * (row + 1) / rows;
      ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x + wallW, ry); ctx.stroke();
    }
    /* 竖向砖缝 */
    for (var c = 0; c < 3; c++) {
      var cx = x + wallW * (c + 1) / 3;
      ctx.beginPath();
      ctx.moveTo(cx, groundY - wallH);
      ctx.lineTo(cx, groundY);
      ctx.stroke();
    }

    /* 顶面 */
    ctx.fillStyle = CL.wallTop;
    ctx.fillRect(x, groundY - wallH - 4, wallW, 4);

    /* 侧面暗面 */
    ctx.fillStyle = CL.wallDark;
    ctx.fillRect(x + wallW - 6, groundY - wallH, 6, wallH);
  }

  /* --- 4. 高板跳台 --- */
  function drawPlatform(o) {
    var levels = [
      { x: o.x1 + 15, w: 55, h: 45 },   /* 第一级 */
      { x: o.x1 + 85, w: 55, h: 60 },   /* 第二级 */
      { x: o.x1 + 155, w: 55, h: 75 }   /* 第三级 */
    ];

    for (var i = 0; i < levels.length; i++) {
      var lv = levels[i];
      var sx = toScreenX(lv.x);
      if (sx < -60 || sx > W + 60) continue;
      var lw = lv.w;
      var lh = lv.h;

      /* 阴影 */
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(sx + lw, groundY + 2, 10, 3);

      /* 台阶正面 */
      ctx.fillStyle = CL.wood;
      ctx.fillRect(sx, groundY - lh, lw, lh);
      /* 顶面 */
      ctx.fillStyle = CL.woodTop;
      ctx.fillRect(sx, groundY - lh - 4, lw, 4);
      /* 暗面 */
      ctx.fillStyle = CL.woodDark;
      ctx.fillRect(sx + lw - 4, groundY - lh, 4, lh);
      /* 木板纹理 */
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 10, groundY - lh + 5);
      ctx.lineTo(sx + 10, groundY - 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + lw - 10, groundY - lh + 5);
      ctx.lineTo(sx + lw - 10, groundY - 5);
      ctx.stroke();
    }

    /* 最高级跳板 */
    var topX = toScreenX(o.x1 + 220);
    if (topX > -40 && topX < W + 40) {
      ctx.fillStyle = '#CC4444';
      ctx.fillRect(topX, groundY - 83, 40, 8);  /* 跳板高83px */
    }
  }

  /* --- 5. 独木桥 --- */
  function drawBridge(o) {
    var sx1 = toScreenX(o.x1);
    var sx2 = toScreenX(o.x2);
    var width = sx2 - sx1;
    if (width < 1) return;
    var bridgeH = 45;  /* 桥高45px */
    var boardW = 12;   /* 桥面厚12px */

    /* 支撑柱（连接到地面） */
    var polePositions = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    ctx.fillStyle = CL.bridgePole;
    for (var j = 0; j < polePositions.length; j++) {
      var px = sx1 + width * polePositions[j];
      /* 支撑柱从桥面底部延伸到地面 */
      ctx.fillRect(px - 3, groundY - bridgeH, 6, bridgeH);
      /* 支撑柱顶部横梁 */
      ctx.fillRect(px - 5, groundY - bridgeH - 2, 10, 4);
    }

    /* 桥面（一条明显的可走路径） */
    /* 桥面顶部在 groundY - bridgeH - boardW = groundY - 57 */
    /* 桥面底部在 groundY - bridgeH = groundY - 45 */
    var bridgeTop = groundY - bridgeH - boardW;  /* groundY - 57 */
    var bridgeBot = groundY - bridgeH;           /* groundY - 45 */

    /* 桥面主体 - 深色木板 */
    ctx.fillStyle = '#6B4F10';
    ctx.fillRect(sx1, bridgeTop, width, boardW);

    /* 桥面顶部高光（可走的表面） */
    ctx.fillStyle = '#9B7B3E';
    ctx.fillRect(sx1, bridgeTop, width, 3);

    /* 桥面侧面 */
    ctx.fillStyle = '#4A3510';
    ctx.fillRect(sx1, bridgeBot - 2, width, 3);

    /* 桥下方空隙阴影 */
    ctx.fillStyle = 'rgba(40,30,10,0.4)';
    ctx.fillRect(sx1 + 2, bridgeBot, width - 4, 4);

    /* 桥面木板接缝 */
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    var steps = 12;
    for (var i = 0; i <= steps; i++) {
      var bx = sx1 + width * i / steps;
      ctx.beginPath();
      ctx.moveTo(bx, bridgeTop);
      ctx.lineTo(bx, bridgeBot);
      ctx.stroke();
    }

    /* 护栏绳索 */
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(sx1, bridgeTop - 10);
    ctx.lineTo(sx2, bridgeTop - 10);
    ctx.stroke();

    /* 护栏立柱 */
    for (var k = 0; k < polePositions.length; k++) {
      var rx = sx1 + width * polePositions[k];
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx, bridgeTop);
      ctx.lineTo(rx, bridgeTop - 10);
      ctx.stroke();
    }
  }

  /* --- 6. 高墙 --- */
  function drawHighWall(o) {
    var sx = toScreenX(o.x1);
    if (sx < -60 || sx > W + 60) return;
    var wallW = 30;
    var wallH = 100;
    var x = sx;

    /* 阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x + wallW, groundY + 2, 15, 5);

    /* 正面 */
    ctx.fillStyle = CL.wall;
    ctx.fillRect(x, groundY - wallH, wallW, wallH);

    /* 砖缝 */
    ctx.strokeStyle = CL.wallDark;
    ctx.lineWidth = 1;
    for (var row = 0; row < 5; row++) {
      var ry = groundY - wallH + wallH * (row + 1) / 5;
      ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x + wallW, ry); ctx.stroke();
    }

    /* 攀爬抓手 */
    var grips = [[6, 0.25], [22, 0.25], [14, 0.45], [8, 0.65], [22, 0.65], [14, 0.85]];
    ctx.fillStyle = CL.wallGrip;
    for (var g = 0; g < grips.length; g++) {
      var gx = x + grips[g][0];
      var gy = groundY - wallH + wallH * grips[g][1];
      ctx.fillRect(gx - 3, gy - 3, 6, 6);
    }

    /* 顶面 */
    ctx.fillStyle = CL.wallTop;
    ctx.fillRect(x, groundY - wallH - 4, wallW, 4);
    /* 暗面 */
    ctx.fillStyle = CL.wallDark;
    ctx.fillRect(x + wallW - 5, groundY - wallH, 5, wallH);
  }

  /* --- 7. 低桩网 --- */
  function drawCrawlNet(o) {
    var sx1 = toScreenX(o.x1);
    var sx2 = toScreenX(o.x2);
    var width = sx2 - sx1;
    if (width < 1) return;
    var netH = 25;

    /* 阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(sx1, groundY + 2, width, 3);

    /* 支撑柱 */
    var poleCount = 4;
    ctx.fillStyle = CL.netPole;
    for (var p = 0; p < poleCount; p++) {
      var px = sx1 + width * p / (poleCount - 1);
      ctx.fillRect(px - 2, groundY - netH - 5, 4, netH + 5);
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.arc(px, groundY - netH - 5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = CL.netPole;
    }

    /* 检测角色是否在网下匍匐 */
    var playerInNet = (playerState === PS.CRAWLING && playerX >= o.x1 && playerX <= o.x2);

    if (playerInNet) {
      /* 角色在网下匍匐：只绘制网的下半部分（地面到一半高度），上半部分由 drawNetOverlay 绘制 */
      var halfH = netH / 2;

      /* 网面下半部分 */
      ctx.fillStyle = CL.net;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(sx1, groundY - halfH, width, halfH);
      ctx.globalAlpha = 1;

      /* 网格纹理 - 下半部分 */
      ctx.strokeStyle = CL.netDark;
      ctx.lineWidth = 1;
      var gridSteps = 10;
      for (var i = 0; i <= gridSteps; i++) {
        var gx = sx1 + width * i / gridSteps;
        var t = i / gridSteps;
        ctx.beginPath();
        var midY = groundY - netH / 2 + Math.sin(t * Math.PI * 2) * 2;
        ctx.moveTo(gx, groundY);
        ctx.lineTo(gx, Math.max(midY, groundY - halfH));
        ctx.stroke();
      }
      for (var j = 2; j < 4; j++) {
        var gy = groundY - netH * (j + 1) / 4;
        if (gy >= groundY - halfH) {
          ctx.beginPath();
          ctx.moveTo(sx1, gy);
          ctx.lineTo(sx2, gy);
          ctx.stroke();
        }
      }
    } else {
      /* 角色不在网下：完整绘制网 */
      /* 网面 */
      ctx.fillStyle = CL.net;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(sx1, groundY - netH, width, netH);
      ctx.globalAlpha = 1;

      /* 网格纹理 */
      ctx.strokeStyle = CL.netDark;
      ctx.lineWidth = 1;
      var gridSteps2 = 10;
      for (var i2 = 0; i2 <= gridSteps2; i2++) {
        var gx2 = sx1 + width * i2 / gridSteps2;
        var t2 = i2 / gridSteps2;
        ctx.beginPath();
        var midY2 = groundY - netH / 2 + Math.sin(t2 * Math.PI * 2) * 2;
        ctx.moveTo(gx2, groundY);
        ctx.lineTo(gx2, midY2);
        ctx.lineTo(gx2, groundY - netH);
        ctx.stroke();
      }
      for (var j2 = 0; j2 < 4; j2++) {
        var gy2 = groundY - netH * (j2 + 1) / 4;
        ctx.beginPath();
        ctx.moveTo(sx1, gy2);
        ctx.lineTo(sx2, gy2);
        ctx.stroke();
      }

      /* 网顶部弧线 */
      ctx.strokeStyle = CL.netDark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx1, groundY - netH);
      for (var k = 0; k <= 20; k++) {
        var t3 = k / 20;
        var ax = sx1 + width * t3;
        var ay = groundY - netH + Math.sin(t3 * Math.PI) * 5;
        ctx.lineTo(ax, ay);
      }
      ctx.stroke();
    }
  }

  /** 低桩网覆盖层 - 在角色绘制之后调用，使网看起来在角色上方 */
  function drawNetOverlay() {
    var netDef = OBS[6];
    var sx1 = toScreenX(netDef.x1);
    var sx2 = toScreenX(netDef.x2);
    var width = sx2 - sx1;
    if (width < 1) return;
    var netH = 25;
    var halfH = netH / 2;

    ctx.save();

    /* 网面上半部分（覆盖在匍匐角色上方） */
    ctx.fillStyle = CL.net;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(sx1, groundY - netH, width, halfH + 2);
    ctx.globalAlpha = 1;

    /* 网格纹理 - 上半部分 */
    ctx.strokeStyle = CL.netDark;
    ctx.lineWidth = 1;
    var gridSteps = 10;
    for (var i = 0; i <= gridSteps; i++) {
      var gx = sx1 + width * i / gridSteps;
      var t = i / gridSteps;
      var midY = groundY - netH / 2 + Math.sin(t * Math.PI * 2) * 2;
      ctx.beginPath();
      ctx.moveTo(gx, groundY - netH);
      ctx.lineTo(gx, Math.min(midY, groundY - halfH + 2));
      ctx.stroke();
    }
    for (var j = 0; j < 2; j++) {
      var gy = groundY - netH * (j + 1) / 4;
      if (gy <= groundY - halfH + 2) {
        ctx.beginPath();
        ctx.moveTo(sx1, gy);
        ctx.lineTo(sx2, gy);
        ctx.stroke();
      }
    }

    /* 网顶部弧线 */
    ctx.strokeStyle = CL.netDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx1, groundY - netH);
    for (var k = 0; k <= 20; k++) {
      var t2 = k / 20;
      var ax = sx1 + width * t2;
      var ay = groundY - netH + Math.sin(t2 * Math.PI) * 5;
      ctx.lineTo(ax, ay);
    }
    ctx.stroke();

    ctx.restore();
  }

  /* --- 8. 冲刺终点线 --- */
  function drawFinishLine(o) {
    var sx = toScreenX(o.x2);
    if (sx < -100 || sx > W + 100) return;
    var lineH = 60;
    var poleW = 6;

    /* 阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(sx - poleW / 2 + 5, groundY + 2, poleW + 5, 3);

    /* 支撑柱 */
    ctx.fillStyle = '#888';
    ctx.fillRect(sx - poleW / 2, groundY - lineH, poleW, lineH);

    /* 终点横幅 */
    var numStripes = 8;
    var stripeW = 40 / numStripes;
    for (var i = 0; i < numStripes; i++) {
      ctx.fillStyle = (i % 2 === 0) ? CL.finW : CL.finB;
      ctx.fillRect(sx - 20 + stripeW * i, groundY - lineH, stripeW, 15);
    }

    /* "终点" 文字 */
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('终点', sx, groundY - lineH - 8);

    /* 跑道终点线标记 */
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, groundY - 5);
    ctx.lineTo(sx, groundY + 5);
    ctx.stroke();
  }

  /* ============================================================
   * 第十四部分：绘制 - 角色（升级版：6帧动画、身体起伏、蜷缩伸展）
   * ============================================================ */

  function drawPlayer() {
    var px = playerScreenX;
    var py = groundY + playerYOff;
    var isCrawling = (playerState === PS.CRAWLING);
    var isClimbing = (playerState === PS.CLIMBING);
    var isJumping = (playerState === PS.JUMPING);
    var isSprinting = (playerState === PS.SPRINTING);
    var isRunning = (playerState === PS.RUNNING);

    /* 角色阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    var shadowW = isCrawling ? 30 : 20;
    var shadowY = groundY + 2;  /* 默认地面阴影 */
    if (onPlatform && onPlatform.height > 0) {
      /* 站在平台上，阴影投射到平台表面 */
      shadowY = groundY - onPlatform.height + 2;
    } else if (isClimbing) {
      /* 攀爬时阴影在墙上 */
      shadowY = groundY + 2;
    }
    ctx.beginPath();
    ctx.ellipse(px, shadowY, shadowW, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();

    /* 碰撞闪烁效果：叠加半透明红色矩形 */
    if (hitFlashTimer > 0 && Math.floor(frameCount / 3) % 2 === 0) {
      ctx.fillStyle = 'rgba(255,100,100,0.4)';
      ctx.fillRect(px - 15, groundY + playerYOff - PLAYER_H, 30, PLAYER_H);
    }

    if (isCrawling) {
      drawPlayerCrawling(px, py);
    } else if (isClimbing) {
      drawPlayerClimbing(px, py);
    } else {
      drawPlayerStanding(px, py, isJumping, isSprinting, isRunning);
    }

    ctx.restore();

    /* 冲刺速度线 - 增强版 */
    if ((isSprinting || keys.sprint) && settings.particles !== 'off') {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = keys.sprint ? 2.5 : 1.5;
      var lineCount = keys.sprint ? 14 : 8;
      for (var sl = 0; sl < lineCount; sl++) {
        var sxx = px - 50 + sl * 12 + Math.random() * 10;
        var sLen = (keys.sprint ? 35 : 20) + Math.random() * 35;
        var syy = py - PLAYER_H / 2 - 15 + Math.random() * PLAYER_H;
        ctx.beginPath();
        ctx.moveTo(sxx, syy);
        ctx.lineTo(sxx - sLen, syy);
        ctx.stroke();
      }
    }
  }

  /** 绘制站立/跑步/跳跃/冲刺姿态 - 6帧动画 */
  function drawPlayerStanding(px, py, isJumping, isSprinting, isRunning) {
    var bob = 0;
    var bodyAngle = 0;
    var animSpeed = 0.25;

    /* 落地压缩效果 */
    var sq = 1;
    if (landSquash > 0) {
      sq = 1 + (landSquash / 6) * 0.15; /* 水平拉伸 */
    }

    if (isRunning || isSprinting) {
      animSpeed = isSprinting ? 0.4 : 0.25;
      bob = Math.sin(frameCount * animSpeed * 2) * 2;
    }
    if (isSprinting) bodyAngle = 0.2; /* 冲刺时前倾更明显 */
    if (keys.right) bodyAngle += 0.05; /* 手动前进时额外前倾 */
    if (keys.left) bodyAngle -= 0.05;  /* 手动后退时后倾 */

    /* 站在独木桥上时轻微左右晃动（模拟平衡） */
    if (onPlatform && onPlatform.type === 'bridge') {
      bodyAngle += Math.sin(frameCount * 0.1) * 0.03;
    }
    /* 站在高板跳台台阶上时轻微不稳 */
    if (onPlatform && onPlatform.type === 'platform') {
      bodyAngle += Math.sin(frameCount * 0.15) * 0.02;
    }

    /* 6帧跑步动画周期 */
    var cycle = Math.floor(frameCount * animSpeed) % RUN_FRAMES;

    var bodyY = py - PLAYER_H + bob;

    /* 落地压缩变形 */
    if (landSquash > 0) {
      ctx.save();
      ctx.translate(px, groundY);
      ctx.scale(sq, 1 / sq);
      ctx.translate(-px, -groundY);
    }

    ctx.translate(px, 0);
    ctx.rotate(bodyAngle);

    /* 腿摆动 - 6帧 */
    var legSwing = 0;
    var armSwing = 0;
    var legBend = 0; /* 膝盖弯曲程度 */

    if (isRunning || isSprinting) {
      /* 6帧摆动表：更流畅的跑步循环 */
      var swingTable = [0.5, 0.25, 0, -0.25, -0.5, -0.25];
      var bendTable = [0.3, 0.1, 0, 0.1, 0.3, 0.4];
      legSwing = swingTable[cycle];
      legBend = bendTable[cycle];
      armSwing = -swingTable[(cycle + 3) % RUN_FRAMES];
    }

    if (isJumping) {
      /* 跳跃蜷缩→伸展过程 */
      var jumpProgress = 0;
      if (playerVY < 0) {
        /* 上升阶段：蜷缩 */
        jumpProgress = 1 - Math.abs(playerVY / JUMP_VEL);
        legSwing = -0.6 + jumpProgress * 0.2;
        armSwing = -0.9 + jumpProgress * 0.3;
      } else {
        /* 下落阶段：伸展准备落地 */
        jumpProgress = Math.min(1, playerVY / 8);
        legSwing = -0.4 + jumpProgress * 0.4;
        armSwing = -0.6 + jumpProgress * 0.4;
      }
    }

    /* 落地反弹 */
    var landBounce = 0;
    if (!isJumping && !isRunning && !isSprinting) {
      /* 站立姿态 */
    }

    /* 后腿（带膝盖弯曲） */
    drawLeg(-6, bodyY + 36, legSwing, true, legBend);
    /* 前腿 */
    drawLeg(6, bodyY + 36, -legSwing, false, legBend);

    /* 躯干 */
    ctx.fillStyle = CL.vest;
    ctx.fillRect(-10, bodyY + 18, 20, 20);
    /* 背心高光 */
    ctx.fillStyle = CL.vestLight;
    ctx.fillRect(-3, bodyY + 20, 6, 14);

    /* 手臂 */
    drawArm(-12, bodyY + 20, armSwing, true);
    drawArm(8, bodyY + 20, -armSwing, false);

    /* 头部 */
    drawHead(0, bodyY + 10);

    /* 恢复落地压缩变形 */
    if (landSquash > 0) {
      ctx.restore();
    }
  }

  /** 绘制头部（侧面） */
  function drawHead(x, y) {
    /* 钢盔 */
    ctx.fillStyle = CL.helmet;
    ctx.beginPath();
    ctx.ellipse(x, y, 11, 10, 0, Math.PI, 0, false);
    ctx.fill();
    /* 钢盔帽檐 */
    ctx.beginPath();
    ctx.ellipse(x + 2, y - 2, 12, 4, 0.1, 0, Math.PI * 2);
    ctx.fill();
    /* 钢盔暗面 */
    ctx.fillStyle = CL.helmetDark;
    ctx.beginPath();
    ctx.ellipse(x - 3, y - 2, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    /* 面部 */
    ctx.fillStyle = CL.skin;
    ctx.beginPath();
    ctx.ellipse(x + 1, y + 2, 8, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    /* 眼睛 */
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(x + 4, y, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    /* 鼻子 */
    ctx.fillStyle = '#d4a070';
    ctx.beginPath();
    ctx.moveTo(x + 7, y + 2);
    ctx.lineTo(x + 10, y + 4);
    ctx.lineTo(x + 7, y + 5);
    ctx.closePath();
    ctx.fill();

    /* 嘴巴 */
    ctx.strokeStyle = '#c49060';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 5);
    ctx.quadraticCurveTo(x + 7, y + 6, x + 8, y + 5);
    ctx.stroke();
  }

  /** 绘制手臂 */
  function drawArm(shoulderX, shoulderY, angle, isBack) {
    ctx.save();
    ctx.translate(shoulderX, shoulderY);
    ctx.rotate(angle);
    /* 上臂 */
    ctx.fillStyle = CL.vest;
    ctx.fillRect(-3, 0, 6, 12);
    /* 前臂 - 带肘部弯曲 */
    ctx.save();
    ctx.translate(0, 10);
    ctx.rotate(Math.abs(angle) * 0.3);
    ctx.fillStyle = CL.skin;
    ctx.fillRect(-2.5, 0, 5, 10);
    /* 手 */
    ctx.fillStyle = CL.skin;
    ctx.beginPath();
    ctx.arc(0, 11, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  /** 绘制腿 - 带膝盖弯曲 */
  function drawLeg(hipX, hipY, angle, isBack, bend) {
    ctx.save();
    ctx.translate(hipX, hipY);
    ctx.rotate(angle);
    /* 大腿 */
    ctx.fillStyle = CL.pants;
    ctx.fillRect(-4, 0, 8, 10);
    /* 小腿 - 带膝盖弯曲 */
    ctx.save();
    ctx.translate(0, 8);
    ctx.rotate(bend);
    ctx.fillStyle = CL.pants;
    ctx.fillRect(-3.5, 0, 7, 12);
    ctx.restore();
    ctx.restore();

    /* 军靴 */
    var bootX = hipX + Math.sin(angle + bend * 0.5) * 18;
    var bootY = hipY + 18 + Math.cos(bend) * 2;
    ctx.fillStyle = CL.boot;
    ctx.fillRect(bootX - 5, bootY, 10, 5);
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(bootX - 5, bootY + 4, 10, 2);
  }

  /** 绘制匍匐姿态 - 增加手臂划动动画 */
  function drawPlayerCrawling(px, py) {
    var crawlH = PLAYER_H / 2;
    var bodyY = py - crawlH;
    var armCycle = Math.floor(frameCount * 0.2) % 4;

    ctx.translate(px, 0);

    /* 身体（水平） */
    ctx.fillStyle = CL.vest;
    ctx.fillRect(-18, bodyY, 36, crawlH - 4);
    /* 背心高光 */
    ctx.fillStyle = CL.vestLight;
    ctx.fillRect(-3, bodyY + 2, 6, crawlH - 8);

    /* 钢盔 */
    ctx.fillStyle = CL.helmet;
    ctx.beginPath();
    ctx.ellipse(14, bodyY + 6, 9, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    /* 面部 */
    ctx.fillStyle = CL.skin;
    ctx.beginPath();
    ctx.ellipse(16, bodyY + 7, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    /* 眼睛 */
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(18, bodyY + 6, 1.5, 0, Math.PI * 2);
    ctx.fill();

    /* 手臂前伸划动动画 */
    var armOff = [0, 5, 2, -3][armCycle];
    var armOff2 = [2, -3, 0, 5][armCycle];
    ctx.fillStyle = CL.skin;
    ctx.fillRect(12, bodyY + 10 + armOff, 14, 4);
    ctx.fillRect(10, bodyY + 16 + armOff2, 12, 4);

    /* 腿部交替蹬地 */
    var legOff = [-2, 0, 2, 0][armCycle];
    ctx.fillStyle = CL.pants;
    ctx.fillRect(-16, bodyY + crawlH - 8 + legOff, 14, 6);
    ctx.fillRect(-18, bodyY + crawlH - 4 - legOff, 10, 4);

    /* 军靴 */
    ctx.fillStyle = CL.boot;
    ctx.fillRect(-20, bodyY + crawlH - 2 + legOff, 8, 4);
  }

  /** 绘制攀爬姿态 */
  function drawPlayerClimbing(px, py) {
    /* 墙顶停留阶段：显示站立在墙顶的姿态 */
    if (wallTopTimer > 0) {
      var wallScreenX = toScreenX(OBS[5].x1);
      ctx.translate(wallScreenX + 10, py);
      /* 身体稍微前倾，准备跳下 */
      var leanAngle = Math.min(0.3, wallTopTimer / 30 * 0.3);
      ctx.rotate(leanAngle);

      /* 腿（站立，微曲） */
      ctx.fillStyle = CL.pants;
      ctx.fillRect(-8, 30, 7, 22);
      ctx.fillRect(2, 32, 7, 20);
      /* 靴子 */
      ctx.fillStyle = CL.boot;
      ctx.fillRect(-9, 50, 9, 4);
      ctx.fillRect(1, 50, 9, 4);

      /* 躯干 */
      ctx.fillStyle = CL.vest;
      ctx.fillRect(-10, 10, 20, 22);

      /* 手臂（自然下垂，准备起跳） */
      ctx.fillStyle = CL.vest;
      ctx.fillRect(-14, 14, 5, 18);
      ctx.fillRect(9, 14, 5, 18);
      ctx.fillStyle = CL.skin;
      ctx.fillRect(-14, 30, 5, 5);
      ctx.fillRect(9, 30, 5, 5);

      /* 头部 */
      drawHead(0, 4);
      return;
    }

    var ct = climbTimer / CLIMB_FRAMES;
    var climbOff = 0;
    if (ct < 0.5) {
      climbOff = -PLAYER_H * 1.2 * (ct / 0.5);
    } else {
      climbOff = -PLAYER_H * 1.2 * ((1 - ct) / 0.5);
    }
    var wallScreenX = toScreenX(OBS[5].x1);

    ctx.translate(wallScreenX - 4, py + climbOff);

    var armAlt = Math.sin(frameCount * 0.3) * 0.3;

    /* 腿（蹬墙，蜷缩） */
    ctx.fillStyle = CL.pants;
    ctx.fillRect(-12, 30, 8, 12);
    ctx.fillRect(-2, 35, 8, 10);

    /* 躯干 */
    ctx.fillStyle = CL.vest;
    ctx.fillRect(-10, 12, 18, 20);

    /* 手臂（向上伸展，交替抓握） */
    ctx.save();
    ctx.translate(-10, 14);
    ctx.rotate(-0.6 + armAlt);
    ctx.fillStyle = CL.vest;
    ctx.fillRect(-3, -14, 6, 16);
    ctx.fillStyle = CL.skin;
    ctx.fillRect(-2.5, -18, 5, 6);
    ctx.restore();

    ctx.save();
    ctx.translate(2, 14);
    ctx.rotate(-0.6 - armAlt);
    ctx.fillStyle = CL.vest;
    ctx.fillRect(-3, -14, 6, 16);
    ctx.fillStyle = CL.skin;
    ctx.fillRect(-2.5, -18, 5, 6);
    ctx.restore();

    /* 头部 */
    drawHead(-2, 6);
  }

  /* ============================================================
   * 第十五部分：绘制 - HUD（升级版：半透明圆角面板）
   * ============================================================ */

  function drawHUD() {
    /* 左上角：计时器面板 */
    var timeStr = formatTime(gameTime);
    var timeW = 120, timeH = 50;
    ctx.fillStyle = CL.hudBg;
    roundRect(ctx, 12, 10, timeW, timeH, 8);
    ctx.fill();
    ctx.strokeStyle = CL.hudBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, 12, 10, timeW, timeH, 8);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    /* 数字跳动效果 */
    var timeJitter = (gameState === GS.PLAYING) ? Math.sin(frameCount * 0.3) * 0.3 : 0;
    ctx.fillText(timeStr, 22 + timeJitter, 16);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('用时', 22, 42);

    /* 障碍进度条（顶部中央） */
    var progBarW = Math.min(300, W * 0.4);
    var progBarH = 10;
    var progBarX = W / 2 - progBarW / 2;
    var progBarY = 14;
    var passed = 0;
    for (var i = 0; i < obsStates.length; i++) {
      if (obsStates[i].cleared) passed++;
    }
    ctx.fillStyle = CL.hudBg;
    roundRect(ctx, progBarX, progBarY, progBarW, progBarH, 5);
    ctx.fill();
    ctx.strokeStyle = CL.hudBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, progBarX, progBarY, progBarW, progBarH, 5);
    ctx.stroke();
    /* 进度填充 */
    var progFillW = progBarW * passed / 8;
    if (progFillW > 0) {
      var progGrad = ctx.createLinearGradient(progBarX, 0, progBarX + progFillW, 0);
      progGrad.addColorStop(0, '#66BB6A');
      progGrad.addColorStop(1, '#4CAF50');
      ctx.fillStyle = progGrad;
      roundRect(ctx, progBarX, progBarY, progFillW, progBarH, 5);
      ctx.fill();
    }
    /* 障碍节点 */
    for (var j = 0; j < 8; j++) {
      var nodeX = progBarX + progBarW * j / 7;
      var nodeCleared = obsStates[j].cleared;
      var nodeCollided = obsStates[j].collided;
      ctx.fillStyle = nodeCleared ? (nodeCollided ? '#FF6B6B' : '#66BB6A') : 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(nodeX, progBarY + progBarH / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('障碍 ' + passed + '/8', W / 2, progBarY + progBarH + 4);

    /* 右上角：评分面板 */
    var scoreW = 100, scoreH = 50;
    var scoreX = W - scoreW - 12;
    ctx.fillStyle = CL.hudBg;
    roundRect(ctx, scoreX, 10, scoreW, scoreH, 8);
    ctx.fill();
    ctx.strokeStyle = CL.hudBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, scoreX, 10, scoreW, scoreH, 8);
    ctx.stroke();

    var displayScore = Math.max(0, Math.round(score));
    var scoreColor = displayScore >= 90 ? '#4CAF50' : displayScore >= 70 ? '#FFD700' : displayScore >= 50 ? '#FF9800' : '#FF4444';
    ctx.fillStyle = scoreColor;
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(displayScore + '分', W - 22, 16);

    var rank = getRank(displayScore);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '12px sans-serif';
    ctx.fillText(rank, W - 22, 42);

    /* 底部中央：体力条 */
    var hpW = 180, hpH = 10;
    var hpX = W / 2 - hpW / 2;
    var hpY = H - 22;
    ctx.fillStyle = CL.hudBg;
    roundRect(ctx, hpX - 4, hpY - 18, hpW + 8, hpH + 24, 6);
    ctx.fill();
    ctx.strokeStyle = CL.hudBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, hpX - 4, hpY - 18, hpW + 8, hpH + 24, 6);
    ctx.stroke();

    ctx.fillStyle = CL.staminaBg;
    roundRect(ctx, hpX, hpY, hpW, hpH, 4);
    ctx.fill();
    var hpRatio = Math.max(0.15, 1 - gameTime / 180);
    var hpGrad = ctx.createLinearGradient(hpX, 0, hpX + hpW * hpRatio, 0);
    hpGrad.addColorStop(0, CL.staminaFillLight);
    hpGrad.addColorStop(1, CL.staminaFill);
    ctx.fillStyle = hpGrad;
    roundRect(ctx, hpX, hpY, hpW * hpRatio, hpH, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('体力', W / 2, hpY - 6);

    /* 模式标签 */
    var modeLabel = MODE_CONFIG[gameMode].name;
    ctx.fillStyle = 'rgba(255,215,0,0.8)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(modeLabel, 16, 68);

    ctx.textBaseline = 'alphabetic';
  }

  /* ============================================================
   * 第十六部分：浮动文字效果
   * ============================================================ */

  function spawnFloatText(x, y, text, color) {
    floatTexts.push({
      x: x, y: y, text: text, color: color || '#FFFFFF',
      life: 60, maxLife: 60,
      vy: -1
    });
  }

  function updateFloatTexts() {
    for (var i = floatTexts.length - 1; i >= 0; i--) {
      var ft = floatTexts[i];
      ft.y += ft.vy;
      ft.life--;
      if (ft.life <= 0) floatTexts.splice(i, 1);
    }
  }

  function drawFloatTexts() {
    for (var i = 0; i < floatTexts.length; i++) {
      var ft = floatTexts[i];
      var alpha = ft.life / ft.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;
  }

  /* ============================================================
   * 第十七部分：开始界面
   * ============================================================ */

  function drawStartScreen() {
    /* 背景：静态游戏场景作为背景 */
    drawSky();
    drawMountains();
    drawGround();

    /* 暗色遮罩 */
    ctx.fillStyle = 'rgba(10,20,40,0.75)';
    ctx.fillRect(0, 0, W, H);

    /* 标题 */
    var titleY = H * 0.18;
    ctx.fillStyle = CL.gold;
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    /* 标题描边 */
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 4;
    ctx.strokeText('🎖️ 军 营 障 碍 王 🎖️', W / 2, titleY);
    ctx.fillText('🎖️ 军 营 障 碍 王 🎖️', W / 2, titleY);

    /* 副标题 */
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '18px sans-serif';
    ctx.fillText('400米障碍模拟器', W / 2, titleY + 45);

    /* 模式选择 */
    var btnW = 280, btnH = 52;
    var btnX = W / 2 - btnW / 2;
    var startY = H * 0.42;
    var modeNames = ['标准模式', '挑战模式', '训练模式'];
    var modeDescs = ['正常速度 正常惩罚', '速度1.3x 惩罚翻倍 分数x1.5', '速度0.8x 无惩罚 练习专用'];
    for (var i = 0; i < 3; i++) {
      var by = startY + i * 62;
      var isSelected = (selectedMode === i);

      /* 按钮背景 */
      if (isSelected) {
        var btnGrad = ctx.createLinearGradient(btnX, by, btnX + btnW, by + btnH);
        btnGrad.addColorStop(0, 'rgba(255,215,0,0.25)');
        btnGrad.addColorStop(1, 'rgba(255,180,0,0.15)');
        ctx.fillStyle = btnGrad;
        roundRect(ctx, btnX, by, btnW, btnH, 8);
        ctx.fill();
        ctx.strokeStyle = CL.gold;
        ctx.lineWidth = 2;
        roundRect(ctx, btnX, by, btnW, btnH, 8);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        roundRect(ctx, btnX, by, btnW, btnH, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        roundRect(ctx, btnX, by, btnW, btnH, 8);
        ctx.stroke();
      }

      /* 模式名称 */
      ctx.fillStyle = isSelected ? CL.gold : '#FFFFFF';
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(modeNames[i], btnX + 20, by + 6);

      /* 模式描述 */
      ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.5)';
      ctx.font = '12px sans-serif';
      ctx.fillText(modeDescs[i], btnX + 20, by + 30);

      /* 选择指示箭头 */
      if (isSelected) {
        ctx.fillStyle = CL.gold;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('▶', btnX + btnW - 15, by + 14);
      }
    }

    /* 操作提示 */
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';


    /* 历史最佳 */
    var bestKey = ['standard', 'challenge', 'training'][selectedMode];
    var bestVal = bestTimes[bestKey];
    var bestStr = bestVal !== null ? formatTime(bestVal) + ' / ' + getBestScore(selectedMode) + '分' : '--秒 / --分';
    ctx.fillStyle = 'rgba(255,215,0,0.8)';
    ctx.font = '13px sans-serif';
    ctx.fillText('🏆 历史最佳：' + bestStr, W / 2, H * 0.82);

    /* 成就图标 */
    drawAchievementIcons();

    /* 设置按钮 */
    drawSettingsGear();

    /* 设置面板 */
    if (showSettings) {
      drawSettingsPanel();
    }

    ctx.textBaseline = 'alphabetic';
  }

  function getBestScore(mode) {
    /* 估算最佳分数（简化：用时间推算） */
    var key = ['standard', 'challenge', 'training'][mode];
    if (bestTimes[key] === null) return '--';
    var t = bestTimes[key];
    var baseScore = Math.max(0, 100 - t * 0.8) * MODE_CONFIG[mode].scoreMul;
    return Math.round(baseScore);
  }

  function drawAchievementIcons() {
    var iconSize = 28;
    var spacing = 8;
    var totalW = ACHIEVEMENTS.length * iconSize + (ACHIEVEMENTS.length - 1) * spacing;
    var startX = W / 2 - totalW / 2;
    var y = H - 60;

    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
      var ax = startX + i * (iconSize + spacing);
      var unlocked = achievements[ACHIEVEMENTS[i].id];

      /* 背景圆 */
      ctx.fillStyle = unlocked ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(ax + iconSize / 2, y + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = unlocked ? CL.gold : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ax + iconSize / 2, y + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
      ctx.stroke();

      /* 图标 */
      ctx.globalAlpha = unlocked ? 1 : 0.3;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ACHIEVEMENTS[i].icon, ax + iconSize / 2, y + iconSize / 2 + 1);
      ctx.globalAlpha = 1;
    }

    ctx.textBaseline = 'alphabetic';
  }

  function drawSettingsGear() {
    var gx = W - 35, gy = H - 35;
    var gr = 18;

    /* 背景圆 */
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.arc(gx, gy, gr, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(gx, gy, gr, 0, Math.PI * 2);
    ctx.stroke();

    /* 齿轮图标 */
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(frameCount * 0.01);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚙', 0, 1);
    ctx.restore();
  }

  function drawSettingsPanel() {
    var pw = 300, ph = 240;
    var px = W / 2 - pw / 2;
    var py = H / 2 - ph / 2;

    /* 面板背景 */
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = CL.panelBg;
    roundRect(ctx, px, py, pw, ph, 12);
    ctx.fill();
    ctx.strokeStyle = CL.panelBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, px, py, pw, ph, 12);
    ctx.stroke();

    /* 标题 */
    ctx.fillStyle = CL.gold;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('⚙️ 设置', W / 2, py + 18);

    /* 设置项 */
    var sy = py + 60;
    var sh = 40;
    var sx = px + 30;
    var sw = pw - 60;

    /* 音效 */
    drawSettingRow(sx, sy, sw, sh, '🔊 音效', settings.sound ? '开' : '关');
    sy += sh + 10;

    /* 音乐 */
    drawSettingRow(sx, sy, sw, sh, '🎵 背景音乐', settings.music ? '开' : '关');
    sy += sh + 10;

    /* 粒子 */
    var partLabel = { high: '高', low: '低', off: '关' };
    drawSettingRow(sx, sy, sw, sh, '✨ 粒子效果', partLabel[settings.particles]);

    /* 提示 */
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('点击选项切换  |  ESC 关闭', W / 2, py + ph - 24);

    ctx.textBaseline = 'alphabetic';
  }

  function drawSettingRow(x, y, w, h, label, value) {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, w, h, 6);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 15, y + h / 2);

    ctx.fillStyle = CL.gold;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(value, x + w - 15, y + h / 2);

    ctx.textBaseline = 'alphabetic';
  }

  /* ============================================================
   * 第十八部分：结算面板（升级版：双Tab + AI教练）
   * ============================================================ */

  function drawResultPanel() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);

    var pw = Math.min(440, W - 40);
    var ph = 420;
    var px = W / 2 - pw / 2;
    var py = H / 2 - ph / 2;

    /* 面板背景 */
    ctx.fillStyle = CL.panelBg;
    roundRect(ctx, px, py, pw, ph, 12);
    ctx.fill();
    ctx.strokeStyle = CL.panelBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, px, py, pw, ph, 12);
    ctx.stroke();

    /* Tab 按钮 */
    var tabW = 120, tabH = 36;
    var tabY = py - tabH + 1;
    var tab1X = W / 2 - tabW - 5;
    var tab2X = W / 2 + 5;

    /* Tab 1: 成绩 */
    var tabActive = (resultTab === 0);
    ctx.fillStyle = tabActive ? CL.panelBg : 'rgba(255,255,255,0.08)';
    roundRect(ctx, tab1X, tabY, tabW, tabH, [8, 8, 0, 0]);
    ctx.fill();
    if (tabActive) {
      ctx.strokeStyle = CL.panelBorder;
      ctx.lineWidth = 1;
      roundRect(ctx, tab1X, tabY, tabW, tabH, [8, 8, 0, 0]);
      ctx.stroke();
    }
    ctx.fillStyle = tabActive ? CL.gold : 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📊 成绩详情', tab1X + tabW / 2, tabY + tabH / 2);

    /* Tab 2: AI教练 */
    tabActive = (resultTab === 1);
    ctx.fillStyle = tabActive ? CL.panelBg : 'rgba(255,255,255,0.08)';
    roundRect(ctx, tab2X, tabY, tabW, tabH, [8, 8, 0, 0]);
    ctx.fill();
    if (tabActive) {
      ctx.strokeStyle = CL.panelBorder;
      ctx.lineWidth = 1;
      roundRect(ctx, tab2X, tabY, tabW, tabH, [8, 8, 0, 0]);
      ctx.stroke();
    }
    ctx.fillStyle = tabActive ? CL.gold : 'rgba(255,255,255,0.6)';
    ctx.fillText('🤖 AI教练', tab2X + tabW / 2, tabY + tabH / 2);

    /* Tab 内容 */
    if (resultTab === 0) {
      drawResultScoreTab(px, py, pw, ph);
    } else {
      drawResultAITab(px, py, pw, ph);
    }

    /* 重新开始按钮 */
    var btnW = 160, btnH = 38;
    var btnX = W / 2 - btnW / 2;
    var btnY = py + ph - 52;
    var hovered = mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
    ctx.fillStyle = hovered ? '#2ECC71' : '#27AE60';
    roundRect(ctx, btnX, btnY, btnW, btnH, 6);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('返回主菜单 (R)', btnX + btnW / 2, btnY + btnH / 2 + 1);

    restartBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
    ctx.textBaseline = 'alphabetic';
  }

  function drawResultScoreTab(px, py, pw, ph) {
    var tx = px + pw / 2;
    var cy = py + 30;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    /* 标题 */
    ctx.fillStyle = CL.gold;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('训练完成', tx, cy);
    cy += 36;

    /* 总用时 */
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 30px monospace';
    ctx.fillText(formatTime(gameTime), tx, cy);
    cy += 26;
    ctx.font = '13px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('总用时  (' + MODE_CONFIG[gameMode].name + ')', tx, cy);
    cy += 30;

    /* 总评分 */
    var finalScore = Math.max(0, Math.round(score));
    var sColor = finalScore >= 90 ? '#4CAF50' : finalScore >= 70 ? '#FFD700' : finalScore >= 50 ? '#FF9800' : '#FF4444';
    ctx.fillStyle = sColor;
    ctx.font = 'bold 26px monospace';
    ctx.fillText(finalScore + ' 分', tx, cy);
    cy += 22;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '13px sans-serif';
    ctx.fillText('军衔：' + getRank(finalScore), tx, cy);
    cy += 28;

    /* 碰撞统计 */
    var totalCol = countCollisions();
    ctx.fillStyle = totalCol === 0 ? '#4CAF50' : '#FF6B6B';
    ctx.font = '14px sans-serif';
    ctx.fillText('碰撞：' + totalCol + ' 次', tx, cy);
    cy += 24;

    /* 各障碍单项用时 */
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    var col1x = px + 25;
    var col2x = px + pw / 2 + 10;
    for (var i = 0; i < 8; i++) {
      var col = (i < 4) ? col1x : col2x;
      var row = (i < 4) ? i : i - 4;
      var oy = cy + row * 22;

      ctx.fillStyle = obsStates[i].collided ? '#FF6B6B' : 'rgba(255,255,255,0.8)';
      var mark = obsStates[i].collided ? ' ×' : ' ✓';
      ctx.fillText('0' + (i + 1) + ' ' + obsStates[i].name + mark, col, oy);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(formatTime(obsStates[i].timeTaken), col + 100, oy);
    }
  }

  function drawResultAITab(px, py, pw, ph) {
    var tx = px + pw / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    /* 标题 */
    ctx.fillStyle = CL.gold;
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('🤖 AI 军事训练教练 分析报告', tx, py + 25);

    /* AI头像 */
    drawAIAvatar(px + 35, py + 70, 40);

    /* 打字机文本 */
    if (aiTypewriter) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      var lines = aiTypewriter.displayed.split('\n');
      var textX = px + 90;
      var textY = py + 55;
      var lineH = 20;
      for (var i = 0; i < lines.length; i++) {
        if (textY + lineH > py + ph - 70) break;
        var line = lines[i];
        /* 特殊行着色 */
        if (line.indexOf('综合评分') === 0) {
          ctx.fillStyle = CL.gold;
          ctx.font = 'bold 14px sans-serif';
        } else if (line.indexOf('✅') === 0 || line.indexOf('⚠️') === 0 || line.indexOf('💡') === 0) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 13px sans-serif';
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.font = '12px sans-serif';
        }
        ctx.fillText(line, textX, textY + i * lineH);
      }

      /* 光标闪烁 */
      if (aiTypewriter.index < aiTypewriter.fullText.length && Math.floor(frameCount / 15) % 2 === 0) {
        var lastLineY = textY + (lines.length - 1) * lineH;
        var lastLineW = ctx.measureText(lines[lines.length - 1]).width;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(textX + lastLineW + 2, lastLineY, 2, 14);
      }
    }

    ctx.textBaseline = 'alphabetic';
  }

  /** 绘制AI教练头像（Canvas简笔机器人军官） */
  function drawAIAvatar(x, y, size) {
    ctx.save();
    ctx.translate(x, y);

    /* 头部 */
    ctx.fillStyle = CL.aiBody;
    roundRect(ctx, -size * 0.4, -size * 0.5, size * 0.8, size * 0.6, 6);
    ctx.fill();

    /* 眼睛 */
    ctx.fillStyle = CL.aiEye;
    ctx.beginPath();
    ctx.arc(-size * 0.15, -size * 0.2, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.15, -size * 0.2, size * 0.1, 0, Math.PI * 2);
    ctx.fill();

    /* 瞳孔 */
    ctx.fillStyle = CL.aiPupil;
    ctx.beginPath();
    ctx.arc(-size * 0.15, -size * 0.2, size * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.15, -size * 0.2, size * 0.04, 0, Math.PI * 2);
    ctx.fill();

    /* 嘴巴（扫描线效果） */
    ctx.strokeStyle = CL.aiEye;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    var mouthW = size * 0.2;
    ctx.moveTo(-mouthW, size * 0.02);
    ctx.lineTo(mouthW, size * 0.02);
    ctx.stroke();

    /* 天线 */
    ctx.strokeStyle = CL.aiBodyDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.lineTo(0, -size * 0.65);
    ctx.stroke();
    ctx.fillStyle = CL.gold;
    ctx.beginPath();
    ctx.arc(0, -size * 0.68, size * 0.06, 0, Math.PI * 2);
    ctx.fill();

    /* 军帽檐 */
    ctx.fillStyle = '#2a4a6a';
    ctx.fillRect(-size * 0.45, -size * 0.55, size * 0.9, size * 0.1);

    /* 帽徽 */
    ctx.fillStyle = CL.gold;
    ctx.font = 'bold ' + Math.floor(size * 0.15) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', 0, -size * 0.5);

    ctx.restore();
  }

  /* ============================================================
   * 第十九部分：辅助函数
   * ============================================================ */

  function formatTime(seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    return (mins > 0 ? mins + ':' : '') + secs.toFixed(1) + 's';
  }

  function getRank(s) {
    if (s >= 90) return '特等兵';
    if (s >= 80) return '一等兵';
    if (s >= 70) return '二等兵';
    if (s >= 60) return '三等兵';
    return '新兵';
  }

  function roundRect(c, x, y, w, h, r) {
    if (typeof r === 'number') r = Math.min(r, w / 2, h / 2);
    else if (Array.isArray(r)) r = r[0];
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.arcTo(x + w, y, x + w, y + r, r);
    c.lineTo(x + w, y + h - r);
    c.arcTo(x + w, y + h, x + w - r, y + h, r);
    c.lineTo(x + r, y + h);
    c.arcTo(x, y + h, x, y + h - r, r);
    c.lineTo(x, y + r);
    c.arcTo(x, y, x + r, y, r);
    c.closePath();
  }

  /* ============================================================
   * 第二十部分：碰撞检测（升级：模式支持）
   * ============================================================ */

  /** 检测角色当前位置下方是否有可站立的平台
   * 返回角色应该站立的Y偏移（负值，因为playerYOff向上为负）
   * 如果没有平台，返回 null
   */
  function checkPlatformCollision() {
    /* 1. 跨桩 - 木桩顶部（保持不变） */
    if (playerX >= 600 && playerX <= 880) {
      var stakeSpacing = 40;
      var firstStakeX = 600 + 20;
      var relativeX = playerX - firstStakeX;
      var stakeIndex = Math.round(relativeX / stakeSpacing);
      var stakeCenterX = firstStakeX + stakeIndex * stakeSpacing;
      if (Math.abs(playerX - stakeCenterX) < 12 && stakeIndex >= 0 && stakeIndex <= 7) {
        return -30; /* 木桩高30px */
      }
    }

    /* 2. 矮墙顶部 - 高75px */
    if (playerX >= 1800 && playerX <= 1860) {
      return -75;
    }

    /* 3. 高板跳台 - 三级台阶 */
    if (playerX >= 2400 && playerX <= 2650) {
      var offsetX = playerX - 2400;
      if (offsetX >= 15 && offsetX < 70) return -45;   /* 第一级 45px */
      if (offsetX >= 85 && offsetX < 140) return -60;  /* 第二级 60px */
      if (offsetX >= 155 && offsetX < 210) return -75; /* 第三级 75px */
      if (offsetX >= 220 && offsetX < 260) return -83; /* 跳板 83px */
    }

    /* 4. 独木桥 - 桥面顶部在 groundY - 57 */
    if (playerX >= 3200 && playerX <= 3500) {
      return -57;
    }

    return null;
  }

  /** 获取当前位置对应的平台类型 */
  function getCurrentPlatformType() {
    if (playerX >= 600 && playerX <= 880) return 'stake';
    if (playerX >= 1800 && playerX <= 1860) return 'lowwall';
    if (playerX >= 2400 && playerX <= 2650) return 'platform';
    if (playerX >= 3200 && playerX <= 3500) return 'bridge';
    return 'ground';
  }

  function getPlayerHitbox() {
    var h = (playerState === PS.CRAWLING) ? PLAYER_H / 2 : PLAYER_H;
    return {
      x: playerX - 15,
      y: (groundY + playerYOff) - h,
      w: 30,
      h: h
    };
  }

  function checkCollisions() {
    var modeCfg = MODE_CONFIG[gameMode];
    for (var i = 0; i < OBS.length; i++) {
      var o = OBS[i];
      var st = obsStates[i];
      if (st.cleared && !o.reset) continue;
      if (o.act === 'sprint') continue;

      var inZone = playerX >= o.x1 && playerX <= o.x2;
      var pastZone = playerX > o.x2;
      var beforeZone = playerX < o.x1;

      /* 进入区域 */
      if (inZone && !st.active) {
        st.active = true;
        st.enterTime = gameTime;
        st.collideTimer = 0;
        st.maxHeight = 0;
      }

      /* 记录区域内最大跳跃高度 */
      if (st.active && aiData) {
        var h = Math.abs(playerYOff);
        if (h > st.maxHeight) st.maxHeight = h;
      }

      /* 区域内检测 */
      if (st.active && !st.collided) {
        var needPenalty = false;

        switch (o.act) {
          case 'jump':
            /* 跨桩区域：如果在木桩上方则不算碰撞 */
            if (i === 0 && playerYOff <= -25) {
              st.collideTimer = 0;
            }
            /* 矮墙：如果站在墙顶（Y在-70以下）则不算碰撞 */
            else if (i === 2 && playerYOff <= -70) {
              st.collideTimer = 0;
            }
            /* 高板跳台：如果站在任意一级台阶顶部则不算碰撞 */
            else if (i === 3 && onPlatform && onPlatform.type === 'platform') {
              st.collideTimer = 0;
            }
            /* 独木桥：如果站在桥面上则不算碰撞 */
            else if (i === 4 && onPlatform && onPlatform.type === 'bridge') {
              st.collideTimer = 0;
            }
            else if (playerState !== PS.JUMPING && playerState !== PS.CLIMBING) {
              st.collideTimer++;
              if (st.collideTimer > GRACE_FRAMES) needPenalty = true;
            } else {
              st.collideTimer = 0;
            }
            break;
          case 'crawl':
            if (playerState !== PS.CRAWLING && playerYOff > -30) {
              st.collideTimer++;
              if (st.collideTimer > GRACE_FRAMES) needPenalty = true;
            } else {
              st.collideTimer = 0;
            }
            break;
          case 'run':
            /* 独木桥：如果站在桥上则不算碰撞 */
            if (i === 4 && onPlatform && onPlatform.type === 'bridge') {
              st.collideTimer = 0;
            } else if (o.noJump && playerState === PS.JUMPING) {
              needPenalty = true;
            }
            break;
          case 'climb':
            break;
        }

        if (needPenalty) {
          /* 训练模式无惩罚 */
          if (modeCfg.noDeath) {
            /* 仅记录碰撞，不惩罚不重置 */
            st.collided = true;
            if (aiData) aiData.obstacleCollisions[i]++;
            spawnFloatText(playerScreenX, groundY - 80, '练习中', '#FFD700');
            continue;
          }

          st.collided = true;
          if (aiData) aiData.obstacleCollisions[i]++;
          penaltyTotal += o.pen * modeCfg.penMul;
          consecutiveClear = 0;
          score -= 5 * modeCfg.scoreMul;
          playSound('hit');
          spawnHitFlash(playerScreenX, groundY + playerYOff - PLAYER_H / 2);
          shakeTimer = 12;
          hitFlashTimer = 30; /* 碰撞后闪烁0.5秒 */
          /* 碰撞碎片粒子 */
          for (var deb = 0; deb < 8; deb++) {
            spawnParticle(
              playerScreenX + (Math.random() - 0.5) * 20,
              groundY + playerYOff - PLAYER_H / 2,
              (Math.random() - 0.5) * 6,
              -Math.random() * 5 - 2,
              25 + Math.random() * 15, 3 + Math.random() * 3,
              Math.random() > 0.5 ? '#FF6B6B' : '#FFD700', 0.2
            );
          }

          if (o.reset) {
            playerX = o.x1 - 80;
            st.active = false;
            st.collided = false;
            st.collideTimer = 0;
            playerVY = 0;
            playerYOff = 0;
            playerState = PS.RUNNING;
            jumpCount = 0;
            crawlTimer = 0;
          }
        }
      }

      /* 离开区域 */
      if (pastZone && st.active) {
        st.active = false;
        st.exitTime = gameTime;
        st.timeTaken = st.exitTime - st.enterTime;
        st.cleared = true;

        /* 记录AI数据 */
        if (aiData) {
          aiData.obstacleTimes[i] = st.timeTaken;
          recordObstacleData(i, st.timeTaken, st.collided ? 1 : 0, st.maxHeight || 0);
        }

        if (!st.collided) {
          consecutiveClear++;
          score += 8 * modeCfg.scoreMul;
          playSound('clear');
          spawnClearSparkle(playerScreenX, groundY - 40);
          spawnPassEffect(playerScreenX, groundY - 20);
          if (consecutiveClear > 1) {
            spawnFloatText(playerScreenX, groundY - 90, '+' + (8 * consecutiveClear) + ' 连续!', '#4CAF50');
          } else {
            spawnFloatText(playerScreenX, groundY - 60, '完美!', '#4CAF50');
          }
          /* 通过时的轻微屏幕震动 */
          if (!st.passedShake) {
            shakeTimer = 3;
            st.passedShake = true;
          }
        } else {
          spawnFloatText(playerScreenX, groundY - 60, '有碰撞', '#FF6B6B');
        }
      }

      if (beforeZone && st.active) {
        st.active = false;
        st.collideTimer = 0;
      }
    }
  }

  /* ============================================================
   * 第二十一部分：高墙自动攀爬
   * ============================================================ */

  function checkHighWall() {
    if (playerState === PS.CLIMBING) return;
    var wallDef = OBS[5];
    if (playerX >= wallDef.x1 - 5 && playerX <= wallDef.x2 + 10 && playerState !== PS.JUMPING) {
      playerState = PS.CLIMBING;
      climbTimer = 0;
      playerVY = 0;
      playerYOff = 0;
    }
  }

  /* ============================================================
   * 第二十二部分：游戏更新（升级版：模式、AI数据、脚步声）
   * ============================================================ */

  function update() {
    frameCount++;
    updateClouds();
    updateBirds();

    /* 更新摄像机 */
    cameraX = playerX - playerScreenX;

    /* 打字机效果 */
    if (gameState === GS.FINISHED && resultTab === 1) {
      updateTypewriter();
    }

    /* 浮动文字 */
    updateFloatTexts();

    if (gameState !== GS.PLAYING) return;

    gameTime = frameCount / 60;

    /* ---- 攀爬状态 ---- */
    if (playerState === PS.CLIMBING) {
      climbTimer++;
      if (climbTimer >= CLIMB_FRAMES) {
        /* 到达墙顶，开始墙顶停留计时 */
        wallTopTimer++;
        if (wallTopTimer < 30) {
          /* 在墙顶停留，保持攀爬状态但位置在墙顶 */
          playerYOff = -100;
          playerState = PS.CLIMBING;
        } else {
          /* 从墙顶跳下 */
          playerState = PS.JUMPING;
          playerVY = -2; /* 轻微向上起跳 */
          playerYOff = -100;
          playerX = OBS[5].x2 + 15; /* 向前移动到墙外侧 */
          climbTimer = 0;
          wallTopTimer = 0;
          onPlatform = null;
          spawnLandingDust(playerScreenX, groundY - 100);
        }
      } else {
        /* 攀爬过程中，逐渐上升 */
        playerYOff = -100 * (climbTimer / CLIMB_FRAMES);
      }
      updateParticles();
      return;
    }

    /* ---- 速度计算（带模式倍率） ---- */
    var modeCfg = MODE_CONFIG[gameMode];
    var speed = SPEED_RUN * modeCfg.speedMul;
    if (playerState === PS.CRAWLING) {
      speed = SPEED_CRAWL * modeCfg.speedMul;
    } else if (playerX >= 3200 && playerX <= 3500 && playerState !== PS.JUMPING) {
      speed = SPEED_BRIDGE * modeCfg.speedMul;
    }
    if (playerX > SPRINT_X && playerState !== PS.CRAWLING) {
      speed = SPEED_SPRINT * modeCfg.speedMul;
      if (playerState !== PS.JUMPING) playerState = PS.SPRINTING;
    }
    /* Shift 冲刺加速 */
    if (keys.sprint && (playerState === PS.RUNNING || playerState === PS.SPRINTING)) {
      speed *= 1.5;
    }

    /* 脚步声 */
    if (settings.sound && (playerState === PS.RUNNING || playerState === PS.SPRINTING)) {
      footstepTimer++;
      var stepInterval = (playerState === PS.SPRINTING || keys.sprint) ? 4 : 10;
      stepInterval = Math.round(stepInterval / modeCfg.speedMul);
      if (footstepTimer >= stepInterval) {
        footstepTimer = 0;
        playFootstep();
      }
    }

    /* ---- 跳跃输入 ---- */
    if (keys.jumpPressed && playerState !== PS.CLIMBING) {
      if (playerState === PS.JUMPING && jumpCount < MAX_JUMPS) {
        playerVY = JUMP_VEL * 0.85;
        jumpCount++;
        playSound('jump');
        spawnDust(playerScreenX, groundY + playerYOff, 4);
        /* 二段跳白色粒子爆发 */
        for (var dj = 0; dj < 6; dj++) {
          spawnParticle(
            playerScreenX + (Math.random() - 0.5) * 15,
            groundY + playerYOff,
            (Math.random() - 0.5) * 3,
            Math.random() * 2 + 1,
            15 + Math.random() * 10, 2 + Math.random() * 2, '#FFFFFF', 0.1
          );
        }
      } else if (playerState === PS.RUNNING || playerState === PS.SPRINTING || playerState === PS.CRAWLING) {
        playerVY = JUMP_VEL;
        jumpCount = 1;
        playerState = PS.JUMPING;
        playSound('jump');
        spawnDust(playerScreenX, groundY, 5);
      }
    }
    keys.jumpPressed = false;

    /* ---- 匍匐输入：按住持续匍匐，松开后站起 ---- */
    if (keys.down && playerState !== PS.JUMPING && playerState !== PS.CLIMBING && playerState !== PS.SPRINTING) {
      if (playerState !== PS.CRAWLING) {
        playerState = PS.CRAWLING;
        playerYOff = 0;
        playerVY = 0;
        jumpCount = 0;
        crawlTimer = 0;
        playSound('crawl');
      }
    } else if (playerState === PS.CRAWLING && !keys.down) {
      /* 松开S后站起 */
      playerState = PS.RUNNING;
      playerYOff = 0;
      playerVY = 0;
      jumpCount = 0;
      crawlTimer = 0;
    }
    keys.downPressed = false;

    /* ---- 跳跃物理 ---- */
    if (playerState === PS.JUMPING) {
      playerVY += GRAVITY;
      var prevYOff = playerYOff;
      playerYOff += playerVY;

      /* 平台碰撞检测：从上方下落到平台表面时着陆 */
      var platformY = checkPlatformCollision();
      if (platformY !== null) {
        /* 只有下落过程中（VY > 0）才检测平台着陆，避免上升时被吸上去
         * 吸附容差：上一帧在平台上方（prevYOff <= platformY），
         * 这一帧到达或穿过平台（playerYOff >= platformY - 15），
         * 即从上方接近并穿过平台顶部时着陆 */
        if (playerVY > 0 && prevYOff <= platformY && playerYOff >= platformY - 15) {
          playerYOff = platformY;
          playerVY = 0;
          jumpCount = 0;
          playerState = (playerX > SPRINT_X) ? PS.SPRINTING : PS.RUNNING;
          /* 平台着陆增强反馈 */
          spawnLandingDust(playerScreenX, groundY + platformY);
          spawnPlatformLandEffect(playerScreenX, groundY + platformY);
          playSound('clear');
          landSquash = 6;
          var pType = getCurrentPlatformType();
          onPlatform = { type: pType, height: -platformY };
          /* 跨桩踩踏特效 */
          if (pType === 'stake') {
            var stakeSpacing = 40;
            var firstStakeX = 600 + 20;
            var relativeX = playerX - firstStakeX;
            var stakeIdx = Math.round(relativeX / stakeSpacing);
            var stakeCenterX = firstStakeX + stakeIdx * stakeSpacing;
            spawnStompEffect(stakeCenterX, stakeIdx);
          }
        }
      }

      /* 落地检测（地面） */
      if (playerYOff >= 0) {
        playerYOff = 0;
        playerVY = 0;
        jumpCount = 0;
        playerState = (playerX > SPRINT_X) ? PS.SPRINTING : PS.RUNNING;
        spawnLandingDust(playerScreenX, groundY);
        onPlatform = null;
        /* 落地压缩效果 */
        landSquash = 6;
      }
    } else if (playerState === PS.RUNNING || playerState === PS.SPRINTING) {
      /* 跑步状态下检测是否还在平台上 */
      if (onPlatform) {
        var curPlatformY = checkPlatformCollision();
        if (curPlatformY === null) {
          /* 离开了平台边缘，开始下落 */
          playerState = PS.JUMPING;
          playerVY = 0;
          onPlatform = null;
        } else if (curPlatformY !== playerYOff) {
          /* 平台高度变化（如上坡/下坡台阶），直接过渡 */
          playerYOff = curPlatformY;
          onPlatform.height = -curPlatformY;
          onPlatform.type = getCurrentPlatformType();
        }
      }
    }

    /* ---- 水平移动（含手动左右控制） ---- */
    var manualX = 0;
    if (keys.left) manualX -= 1.5;
    if (keys.right) manualX += 1.5;

    /* 独木桥：跳上桥面后自动前进暂停，需按→键手动走过去 */
    var isOnBridge = (playerX >= 3200 && playerX <= 3500 && onPlatform && onPlatform.type === 'bridge');
    if (isOnBridge) {
      /* 桥上：不按→时自动前进为0，完全停住 */
      if (keys.right) {
        playerX += 2.5; /* 按→时手动前进 */
      } else if (keys.left) {
        playerX -= 1.5; /* 按←时后退 */
      }
      /* 不按任何方向键时角色停在桥上（依靠平衡晃动动画） */
    } else if (playerState === PS.RUNNING || playerState === PS.SPRINTING) {
      playerX += speed + manualX;
    } else if (playerState === PS.CRAWLING) {
      playerX += speed + manualX;
    } else if (playerState === PS.CLIMBING) {
      /* 攀爬时不能手动移动 */
    } else {
      playerX += speed + manualX;
    }
    /* 限制不能后退过起点 */
    if (playerX < 0) playerX = 0;

    /* ---- 高墙自动攀爬检测 ---- */
    checkHighWall();

    /* ---- 碰撞检测 ---- */
    checkCollisions();

    /* ---- 跑步扬尘 ---- */
    if (playerState === PS.RUNNING || playerState === PS.SPRINTING) {
      if (frameCount % 6 === 0) {
        var dustY = groundY;
        if (onPlatform && onPlatform.height > 0) {
          dustY = groundY - onPlatform.height;
        }
        spawnDust(playerScreenX - 8, dustY, 2);
      }
    } else if (playerState === PS.CRAWLING) {
      if (frameCount % 8 === 0) {
        spawnDust(playerScreenX - 8, groundY, 2);
        /* 低桩网区域额外尘土 */
        if (playerX >= 4600 && playerX <= 4850) {
          spawnDust(playerScreenX + 5, groundY - 5, 1);
        }
      }
    }

    /* ---- 屏幕震动 ---- */
    if (shakeTimer > 0) {
      shakeTimer--;
      shakeX = (Math.random() - 0.5) * 6;
      shakeY = (Math.random() - 0.5) * 6;
    } else {
      shakeX = 0; shakeY = 0;
    }

    /* ---- 红色闪光衰减 ---- */
    if (flashAlpha > 0) {
      flashAlpha -= 0.02;
      if (flashAlpha < 0) flashAlpha = 0;
    }

    /* ---- 碰撞闪烁衰减 ---- */
    if (hitFlashTimer > 0) hitFlashTimer--;
    /* ---- 落地压缩衰减 ---- */
    if (landSquash > 0) landSquash--;

    /* ---- 踩踏动画计时 ---- */
    if (stompTimer > 0) {
      stompTimer--;
    }

    /* ---- 粒子更新 ---- */
    updateParticles();

    /* ---- 终点检测 ---- */
    if (playerX >= FINISH_LINE_X) {
      playerX = FINISH_LINE_X;
      gameState = GS.FINISHED;
      /* 计算最终分数 */
      var baseScore = Math.max(0, 100 - gameTime * 0.8) * modeCfg.scoreMul;
      score = baseScore + consecutiveClear * 8 * modeCfg.scoreMul - (5 * countCollisions() * modeCfg.penMul * modeCfg.scoreMul);
      score = Math.max(0, Math.round(score));
      playSound('finish');
      spawnConfetti(playerScreenX, H * 0.3, 80);

      /* 保存最佳成绩 */
      saveBestTime(gameMode, gameTime);

      /* 生成AI分析 */
      aiAnalysis = generateAIAnalysis();
      aiTypewriter = null; /* 切换到AI Tab时再启动 */
      resultTab = 0;

      /* 检查成就 */
      var newAch = checkAchievements();
      if (newAch.length > 0) {
        playSound('achievement');
      }

      /* 停止BGM */
      stopBGM();
    }
  }

  function playFootstep() {
    if (!audioCtx || !settings.sound) return;
    try {
      var t = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var gn = audioCtx.createGain();
      var filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 300 + Math.random() * 200;
      osc.connect(filter); filter.connect(gn); gn.connect(sfxGain);
      osc.type = 'triangle';
      osc.frequency.value = 80 + Math.random() * 40;
      gn.gain.setValueAtTime(0.06, t);
      gn.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.start(t); osc.stop(t + 0.06);
    } catch (e) {}
  }

  function countCollisions() {
    var c = 0;
    for (var i = 0; i < obsStates.length; i++) {
      if (obsStates[i].collided) c++;
    }
    return c;
  }

  /* ============================================================
   * 第二十三部分：游戏渲染
   * ============================================================ */

  function render() {
    ctx.save();

    /* 屏幕震动偏移 */
    if (shakeTimer > 0) ctx.translate(shakeX, shakeY);

    /* 清空画布 */
    ctx.clearRect(-10, -10, W + 20, H + 20);

    /* 开始界面 */
    if (gameState === GS.START) {
      drawStartScreen();
      ctx.restore();
      return;
    }

    /* 1. 天空与背景 */
    drawSky();
    drawMountains();

    /* 2. 地面 */
    drawGround();

    /* 3. 障碍物 */
    drawObstacles();

    /* 4. 角色 */
    drawPlayer();

    /* 4.5 低桩网覆盖层（角色匍匐时网在角色上方） */
    if (playerState === PS.CRAWLING && playerX >= 4600 && playerX <= 4850) {
      drawNetOverlay();
    }

    /* 5. 粒子效果 */
    drawParticles();

    /* 6. 浮动文字 */
    drawFloatTexts();

    /* 7. 碰撞闪光 */
    if (flashAlpha > 0) {
      ctx.fillStyle = flashColor + flashAlpha + ')';
      ctx.fillRect(0, 0, W, H);
    }

    /* 8. HUD */
    if (gameState === GS.PLAYING || gameState === GS.FINISHED || gameState === GS.READY) {
      drawHUD();
    }

    ctx.restore();

    /* 9. 覆盖层（不受震动影响） */
    if (gameState === GS.READY) {
      drawCountdown();
    } else if (gameState === GS.FINISHED) {
      drawResultPanel();
    }
  }

  function drawCountdown() {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, W, H);

    var count = Math.ceil(countdown);
    ctx.fillStyle = count <= 1 ? '#4CAF50' : CL.gold;
    ctx.font = 'bold 120px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var text = count <= 0 ? 'GO!' : String(count);
    var scale = 1 + (countdown % 1) * 0.2;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 6;
    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  }

  /* ============================================================
   * 第二十四部分：游戏循环
   * ============================================================ */

  function gameLoop() {
    /* 倒计时更新 */
    if (gameState === GS.READY) {
      countdown -= 1 / 60;
      if (countdown <= 0) {
        gameState = GS.PLAYING;
        frameCount = 0;
        playSound('go');
        startBGM();
      }
    }

    update();
    render();
    animFrame = requestAnimationFrame(gameLoop);
  }

  var animFrame;

  /* ============================================================
   * 第二十五部分：游戏控制
   * ============================================================ */

  function resetGame() {
    playerX = 0;
    playerVY = 0;
    playerYOff = 0;
    jumpCount = 0;
    playerState = PS.RUNNING;
    climbTimer = 0;
    crawlTimer = 0;
    gameTime = 0;
    score = 0;
    penaltyTotal = 0;
    consecutiveClear = 0;
    frameCount = 0;
    shakeX = 0; shakeY = 0; shakeTimer = 0;
    flashAlpha = 0; flashColor = 'rgba(255,50,50,';
    restartBtn = null;
    cameraX = 0;
    footstepTimer = 0;
    floatTexts = [];
    onPlatform = null;
    wallTopTimer = 0;
    hitFlashTimer = 0;
    landSquash = 0;

    /* 重置障碍状态 */
    obsStates = [];
    for (var i = 0; i < OBS.length; i++) {
      obsStates.push({
        name: OBS[i].name,
        active: false, cleared: false, collided: false,
        collideTimer: 0, enterTime: 0, exitTime: 0, timeTaken: 0,
        maxHeight: 0
      });
    }

    /* 重置粒子 */
    initParticles();

    /* 重置AI数据 */
    initAIData();

    /* 重置按键 */
    if (keys) {
      keys.jump = false; keys.down = false; keys.jumpPressed = false; keys.downPressed = false;
    }
  }

  function startGame() {
    initAudio();
    resetGame();
    countdown = 3;
    gameState = GS.READY;
    playSound('countdown');
  }

  function startGameFromMenu() {
    initAudio();
    gameMode = selectedMode;
    playSound('menu_select');
    resetGame();
    countdown = 3;
    gameState = GS.READY;
    playSound('countdown');
  }

  function resetAndStart() {
    initAudio();
    resetGame();
    countdown = 3;
    gameState = GS.READY;
    playSound('countdown');
  }

  function restartToMenu() {
    stopBGM();
    gameState = GS.START;
    playSound('menu_move');
  }

  /* ============================================================
   * 第二十六部分：初始化
   * ============================================================ */

  function init(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    /* 加载存储数据 */
    loadStorage();

    /* 创建Canvas */
    canvas = document.createElement('canvas');
    canvas.height = CANVAS_HEIGHT;
    canvas.width = Math.min(960, container.clientWidth || 800);
    canvas.style.width = '100%';
    canvas.style.height = CANVAS_HEIGHT + 'px';
    canvas.style.display = 'block';
    canvas.style.background = '#1a2a1a';
    canvas.style.cursor = 'pointer';
    container.appendChild(canvas);

    ctx = canvas.getContext('2d');
    W = canvas.width;
    H = canvas.height;
    groundY = Math.round(H * GROUND_RATIO);
    playerScreenX = Math.round(W * 0.15);

    /* 初始化子系统 */
    initParticles();
    initClouds();
    initBirds();
    initFlags();
    initAIData();
    resetGame();

    /* 输入 */
    initInput();

    /* 初始状态：开始界面 */
    gameState = GS.START;

    /* 启动循环 */
    if (animFrame) cancelAnimationFrame(animFrame);
    gameLoop();
  }

  /* 暴露接口 */
  return { init: init };
})();