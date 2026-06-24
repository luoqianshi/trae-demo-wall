var MiniGames = (function () {
  'use strict';

  // ==================== 工具函数 ====================

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ==================== 游戏状态 ====================

  var _currentGame = null;   // { id, state, canvas, ctx, resolve, reject, loopId, data }
  var _gameRegistry = {};     // 注册表：可扩展新游戏

  // ==================== 钓鱼游戏 ====================

  var FISH_DATA = {
    morning: [
      { name: '鲫鱼', value: 5,  weight: 40 },
      { name: '草鱼', value: 10, weight: 60 }
    ],
    day: [
      { name: '鲤鱼', value: 15, weight: 50 },
      { name: '鲢鱼', value: 20, weight: 50 }
    ],
    night: [
      { name: '鲶鱼', value: 30, weight: 60 },
      { name: '甲鱼', value: 50, weight: 40 }
    ],
    rare: [
      { name: '灵鱼', value: 50, weight: 100, minLevel: 3 }
    ]
  };

  function _getTimePeriod() {
    if (typeof GameTime !== 'undefined' && GameTime.getPeriod) {
      var p = GameTime.getPeriod();
      if (p.id === 'morning' || p.id === 'dawn') return 'morning';
      if (p.id === 'afternoon' || p.id === 'noon') return 'day';
      return 'night';
    }
    return 'day';
  }

  function _pickFish(teaHouseLevel) {
    var period = _getTimePeriod();
    var pool = FISH_DATA[period].slice();
    // 灵鱼5%概率，需3级茶馆
    if (teaHouseLevel >= 3 && Math.random() < 0.05) {
      return FISH_DATA.rare[0];
    }
    var totalWeight = 0;
    for (var i = 0; i < pool.length; i++) totalWeight += pool[i].weight;
    var r = Math.random() * totalWeight;
    var acc = 0;
    for (var j = 0; j < pool.length; j++) {
      acc += pool[j].weight;
      if (r <= acc) return pool[j];
    }
    return pool[0];
  }

  function _createFishingGame(canvas, ctx, options) {
    var W = canvas.width;
    var H = canvas.height;
    var teaHouseLevel = (options && options.teaHouseLevel) || 1;

    var state = {
      phase: 'waiting',       // waiting -> ripple -> reacting -> result
      fish: _pickFish(teaHouseLevel),
      rippleTime: 0,
      rippleDuration: randFloat(1.5, 3.5),
      reactStart: 0,
      result: null,
      resultTimer: 0,
      waterOffset: 0,
      bobberY: 0,
      showRipple: false
    };

    // 等待随机时间后出现波纹
    var waitTimeout = setTimeout(function () {
      state.phase = 'ripple';
      state.rippleTime = performance.now();
      state.showRipple = true;
    }, randFloat(1500, 4000));

    function handleAction() {
      if (state.phase === 'waiting') {
        // 还没波纹就按了 → 失败
        state.phase = 'result';
        state.result = { grade: 'fail', fish: null, message: '还没有鱼上钩，太心急了！' };
        state.resultTimer = performance.now();
        return;
      }
      if (state.phase === 'ripple') {
        var elapsed = (performance.now() - state.rippleTime) / 1000;
        var diff = Math.abs(elapsed - state.rippleDuration);
        state.phase = 'result';
        state.resultTimer = performance.now();

        if (diff <= 0.1) {
          state.result = { grade: 'perfect', fish: state.fish, message: '完美！钓到了' + state.fish.name + '！' };
        } else if (diff <= 0.3) {
          state.result = { grade: 'good', fish: state.fish, message: '不错！钓到了' + state.fish.name + '！' };
        } else if (diff <= 0.5) {
          state.result = { grade: 'ok', fish: state.fish, message: '勉强钓到了' + state.fish.name + '。' };
        } else {
          state.result = { grade: 'fail', fish: null, message: '鱼跑掉了…' };
        }
        return;
      }
      if (state.phase === 'result') {
        // 已经出结果了，忽略
      }
    }

    function update(dt) {
      state.waterOffset += dt * 30;
      if (state.phase === 'ripple') {
        var elapsed = (performance.now() - state.rippleTime) / 1000;
        state.bobberY = Math.sin(elapsed * 8) * 6;
        // 超时自动失败
        if (elapsed > state.rippleDuration + 0.5) {
          state.phase = 'result';
          state.result = { grade: 'fail', fish: null, message: '反应太慢，鱼跑掉了！' };
          state.resultTimer = performance.now();
        }
      }
      if (state.phase === 'result' && state.result) {
        if (performance.now() - state.resultTimer > 2500) {
          _finishGame(state.result);
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // 天空
      var grad = ctx.createLinearGradient(0, 0, 0, H * 0.45);
      grad.addColorStop(0, '#87CEEB');
      grad.addColorStop(1, '#B0E0E6');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H * 0.45);

      // 水面
      var waterGrad = ctx.createLinearGradient(0, H * 0.45, 0, H);
      waterGrad.addColorStop(0, '#4A90D9');
      waterGrad.addColorStop(1, '#2C5F8A');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, H * 0.45, W, H * 0.55);

      // 水波纹
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      for (var i = 0; i < 5; i++) {
        ctx.beginPath();
        var baseY = H * 0.45 + i * 20;
        for (var x = 0; x < W; x += 4) {
          var y = baseY + Math.sin((x + state.waterOffset + i * 40) * 0.03) * 3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // 鱼竿
      var rodBaseX = W * 0.3;
      var rodBaseY = H * 0.1;
      var rodTipX = W * 0.55;
      var rodTipY = H * 0.35;
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rodBaseX, rodBaseY);
      ctx.quadraticCurveTo(W * 0.45, H * 0.15, rodTipX, rodTipY);
      ctx.stroke();

      // 鱼线
      var bobberBaseY = H * 0.48;
      var bobberDrawY = bobberBaseY + (state.phase === 'ripple' ? state.bobberY : 0);
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rodTipX, rodTipY);
      ctx.lineTo(W * 0.55, bobberDrawY);
      ctx.stroke();

      // 浮标
      ctx.fillStyle = '#FF4500';
      ctx.beginPath();
      ctx.arc(W * 0.55, bobberDrawY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(W * 0.55, bobberDrawY - 3, 3, 0, Math.PI * 2);
      ctx.fill();

      // 波纹特效
      if (state.showRipple && state.phase === 'ripple') {
        var rippleElapsed = (performance.now() - state.rippleTime) / 1000;
        var rippleAlpha = clamp(1 - rippleElapsed / state.rippleDuration, 0, 1);
        for (var r = 0; r < 3; r++) {
          var radius = 10 + r * 15 + rippleElapsed * 20;
          ctx.strokeStyle = 'rgba(255,255,255,' + (rippleAlpha * 0.5) + ')';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(W * 0.55, H * 0.5, radius, radius * 0.4, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 进度条（反应窗口）
      if (state.phase === 'ripple') {
        var elapsed2 = (performance.now() - state.rippleTime) / 1000;
        var progress = clamp(elapsed2 / (state.rippleDuration + 0.5), 0, 1);
        var barW = W * 0.6;
        var barH = 12;
        var barX = (W - barW) / 2;
        var barY = H * 0.08;

        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);

        // 判定区间
        var perfectStart = clamp((state.rippleDuration - 0.1) / (state.rippleDuration + 0.5), 0, 1);
        var perfectEnd = clamp((state.rippleDuration + 0.1) / (state.rippleDuration + 0.5), 0, 1);
        var goodStart = clamp((state.rippleDuration - 0.3) / (state.rippleDuration + 0.5), 0, 1);
        var goodEnd = clamp((state.rippleDuration + 0.3) / (state.rippleDuration + 0.5), 0, 1);
        var okStart = clamp((state.rippleDuration - 0.5) / (state.rippleDuration + 0.5), 0, 1);
        var okEnd = clamp((state.rippleDuration + 0.5) / (state.rippleDuration + 0.5), 0, 1);

        ctx.fillStyle = 'rgba(255,165,0,0.4)';
        ctx.fillRect(barX + okStart * barW, barY, (okEnd - okStart) * barW, barH);
        ctx.fillStyle = 'rgba(255,255,0,0.5)';
        ctx.fillRect(barX + goodStart * barW, barY, (goodEnd - goodStart) * barW, barH);
        ctx.fillStyle = 'rgba(0,255,0,0.6)';
        ctx.fillRect(barX + perfectStart * barW, barY, (perfectEnd - perfectStart) * barW, barH);

        // 游标
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(barX + progress * barW - 2, barY - 2, 4, barH + 4);
      }

      // 提示文字
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      if (state.phase === 'waiting') {
        ctx.fillText('等待鱼上钩... 按空格或点击', W / 2, H * 0.92);
      } else if (state.phase === 'ripple') {
        ctx.fillStyle = '#FFD700';
        ctx.fillText('鱼上钩了！快按空格或点击！', W / 2, H * 0.92);
      }

      // 结果
      if (state.phase === 'result' && state.result) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, H * 0.3, W, H * 0.35);
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        var gradeColors = { perfect: '#FFD700', good: '#32CD32', ok: '#FFA500', fail: '#FF6347' };
        ctx.fillStyle = gradeColors[state.result.grade] || '#FFF';
        ctx.fillText(state.result.message, W / 2, H * 0.48);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#CCC';
        ctx.fillText('自动返回...', W / 2, H * 0.56);
      }
    }

    function destroy() {
      clearTimeout(waitTimeout);
    }

    return { update: update, draw: draw, handleAction: handleAction, destroy: destroy };
  }

  // ==================== 采药游戏 ====================

  var HERB_LIST = [
    { id: 'jinyinhua', name: '金银花', color: '#FFD700', desc: '清热解毒' },
    { id: 'juhua',     name: '菊花',   color: '#FF8C00', desc: '清肝明目' },
    { id: 'bohe',      name: '薄荷',   color: '#90EE90', desc: '疏散风热' },
    { id: 'gancao',    name: '甘草',   color: '#DEB887', desc: '调和诸药' },
    { id: 'danggui',   name: '当归',   color: '#8B4513', desc: '补血活血' },
    { id: 'renshen',   name: '人参',   color: '#F5DEB3', desc: '大补元气' }
  ];

  function _createHerbGame(canvas, ctx, options) {
    var W = canvas.width;
    var H = canvas.height;
    var level = (options && options.level) || 1;
    var pairCount = Math.min(6, 3 + level); // 等级1=4对, 等级2=5对, 等级3+=6对

    // 选择草药
    var herbs = HERB_LIST.slice(0, pairCount);
    // 创建卡牌对
    var cards = [];
    for (var i = 0; i < herbs.length; i++) {
      cards.push({ herb: herbs[i], matched: false });
      cards.push({ herb: herbs[i], matched: false });
    }
    // 洗牌
    for (var j = cards.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = cards[j];
      cards[j] = cards[k];
      cards[k] = tmp;
    }

    var state = {
      cards: cards,
      flipped: [],        // 当前翻开的索引
      matched: [],        // 已匹配的索引
      lockInput: false,
      flipAnim: {},       // index -> { progress, direction }
      collected: [],      // 收集到的草药
      attempts: 0,
      flipTimer: null
    };

    var cols = Math.ceil(Math.sqrt(cards.length));
    var rows = Math.ceil(cards.length / cols);
    var cardW = Math.min(80, (W - 40) / cols - 10);
    var cardH = Math.min(100, (H - 80) / rows - 10);
    var gridStartX = (W - cols * (cardW + 10) + 10) / 2;
    var gridStartY = 50;

    function getCardRect(index) {
      var col = index % cols;
      var row = Math.floor(index / cols);
      return {
        x: gridStartX + col * (cardW + 10),
        y: gridStartY + row * (cardH + 10),
        w: cardW,
        h: cardH
      };
    }

    function handleClick(mx, my) {
      if (state.lockInput) return;
      // 找点击的卡牌
      for (var i = 0; i < cards.length; i++) {
        if (state.matched.indexOf(i) !== -1) continue;
        if (state.flipped.indexOf(i) !== -1) continue;
        var r = getCardRect(i);
        if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
          flipCard(i);
          break;
        }
      }
    }

    function flipCard(index) {
      state.flipped.push(index);
      state.flipAnim[index] = { progress: 0, direction: 'open' };

      if (state.flipped.length === 2) {
        state.attempts++;
        state.lockInput = true;
        var first = state.flipped[0];
        var second = state.flipped[1];

        if (cards[first].herb.id === cards[second].herb.id) {
          // 匹配成功
          setTimeout(function () {
            state.matched.push(first, second);
            state.collected.push(cards[first].herb);
            state.flipped = [];
            state.lockInput = false;
            delete state.flipAnim[first];
            delete state.flipAnim[second];
            // 检查是否全部完成
            if (state.matched.length === cards.length) {
              setTimeout(function () {
                _finishGame({ collected: state.collected, attempts: state.attempts, grade: state.attempts <= pairCount + 2 ? 'perfect' : state.attempts <= pairCount * 2 ? 'good' : 'ok' });
              }, 600);
            }
          }, 500);
        } else {
          // 不匹配，翻回去
          setTimeout(function () {
            state.flipAnim[first] = { progress: 0, direction: 'close' };
            state.flipAnim[second] = { progress: 0, direction: 'close' };
            setTimeout(function () {
              state.flipped = [];
              state.lockInput = false;
              delete state.flipAnim[first];
              delete state.flipAnim[second];
            }, 300);
          }, 700);
        }
      }
    }

    function handleAction() {
      // 键盘操作不适用于此游戏，空操作
    }

    function update(dt) {
      // 更新翻转动画
      var keys = Object.keys(state.flipAnim);
      for (var i = 0; i < keys.length; i++) {
        var anim = state.flipAnim[keys[i]];
        anim.progress = Math.min(1, anim.progress + dt * 4);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // 背景
      ctx.fillStyle = '#2D5016';
      ctx.fillRect(0, 0, W, H);

      // 标题
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('采药 - 翻牌配对草药', W / 2, 30);

      // 卡牌
      for (var i = 0; i < cards.length; i++) {
        var r = getCardRect(i);
        var isFlipped = state.flipped.indexOf(i) !== -1;
        var isMatched = state.matched.indexOf(i) !== -1;
        var anim = state.flipAnim[i];

        if (isMatched) {
          // 已匹配：显示半透明
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = cards[i].herb.color;
          ctx.fillRect(r.x, r.y, r.w, r.h);
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = '#FFF';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(cards[i].herb.name, r.x + r.w / 2, r.y + r.h / 2);
          ctx.globalAlpha = 1;
          continue;
        }

        if (anim) {
          var scaleX = anim.direction === 'open'
            ? (anim.progress < 0.5 ? 1 - anim.progress * 2 : (anim.progress - 0.5) * 2)
            : (anim.progress < 0.5 ? 1 - anim.progress * 2 : (anim.progress - 0.5) * 2);

          ctx.save();
          ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
          ctx.scale(Math.max(0.02, scaleX), 1);

          if ((anim.direction === 'open' && anim.progress >= 0.5) ||
              (anim.direction === 'close' && anim.progress < 0.5)) {
            // 正面
            ctx.fillStyle = cards[i].herb.color;
            ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h);
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(cards[i].herb.name, 0, 4);
          } else {
            // 背面
            ctx.fillStyle = '#8B7355';
            ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h);
            ctx.strokeStyle = '#6B5335';
            ctx.lineWidth = 2;
            ctx.strokeRect(-r.w / 2, -r.h / 2, r.w, r.h);
            ctx.fillStyle = '#A08050';
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('?', 0, 6);
          }
          ctx.restore();
        } else if (isFlipped) {
          // 翻开状态
          ctx.fillStyle = cards[i].herb.color;
          ctx.fillRect(r.x, r.y, r.w, r.h);
          ctx.strokeStyle = '#FFF';
          ctx.lineWidth = 2;
          ctx.strokeRect(r.x, r.y, r.w, r.h);
          ctx.fillStyle = '#333';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(cards[i].herb.name, r.x + r.w / 2, r.y + r.h / 2);
          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#555';
          ctx.fillText(cards[i].herb.desc, r.x + r.w / 2, r.y + r.h / 2 + 16);
        } else {
          // 背面
          ctx.fillStyle = '#8B7355';
          ctx.fillRect(r.x, r.y, r.w, r.h);
          ctx.strokeStyle = '#6B5335';
          ctx.lineWidth = 2;
          ctx.strokeRect(r.x, r.y, r.w, r.h);
          ctx.fillStyle = '#A08050';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('?', r.x + r.w / 2, r.y + r.h / 2 + 6);
        }
      }

      // 底部信息
      ctx.fillStyle = '#FFF';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('已收集: ' + state.collected.length + '/' + pairCount + '  尝试: ' + state.attempts, W / 2, H - 15);
    }

    function destroy() {
      // 清理
    }

    return { update: update, draw: draw, handleAction: handleAction, handleClick: handleClick, destroy: destroy };
  }

  // ==================== 种茶游戏 ====================

  function _createTeaPlantingGame(canvas, ctx, options) {
    var W = canvas.width;
    var H = canvas.height;

    var PHASES = [
      { name: '发芽', color: '#90EE90', targetPos: 0.5, windowSize: 0.15 },
      { name: '生长', color: '#32CD32', targetPos: 0.55, windowSize: 0.12 },
      { name: '成熟', color: '#006400', targetPos: 0.6, windowSize: 0.10 }
    ];

    var state = {
      currentPhase: 0,
      barProgress: 0,
      barSpeed: 0.3,
      barDirection: 1,
      phaseResults: [],
      phaseAnimTimer: 0,
      showPhaseResult: false,
      lastGrade: '',
      finished: false,
      plantHeight: 0,
      waterDrops: []
    };

    function handleAction() {
      if (state.finished) return;
      if (state.currentPhase >= PHASES.length) return;

      var phase = PHASES[state.currentPhase];
      var diff = Math.abs(state.barProgress - phase.targetPos);
      var grade, accuracy;

      if (diff <= phase.windowSize * 0.33) {
        grade = 'perfect'; accuracy = 1.0;
      } else if (diff <= phase.windowSize * 0.66) {
        grade = 'good'; accuracy = 0.75;
      } else if (diff <= phase.windowSize) {
        grade = 'ok'; accuracy = 0.5;
      } else {
        grade = 'fail'; accuracy = 0.2;
      }

      state.phaseResults.push({ grade: grade, accuracy: accuracy });
      state.lastGrade = grade;
      state.showPhaseResult = true;
      state.phaseAnimTimer = performance.now();

      // 浇水特效
      for (var i = 0; i < 8; i++) {
        state.waterDrops.push({
          x: W * 0.5 + randFloat(-30, 30),
          y: H * 0.35,
          vy: randFloat(1, 3),
          life: 1.0
        });
      }

      // 下一阶段
      state.currentPhase++;
      state.barProgress = 0;
      state.barDirection = 1;

      if (state.currentPhase >= PHASES.length) {
        state.finished = true;
        setTimeout(function () {
          var totalAcc = 0;
          for (var i = 0; i < state.phaseResults.length; i++) totalAcc += state.phaseResults[i].accuracy;
          var avgAcc = totalAcc / state.phaseResults.length;
          var teaCount = Math.max(1, Math.round(avgAcc * 5));
          _finishGame({ teaCount: teaCount, accuracy: avgAcc, phaseResults: state.phaseResults });
        }, 1500);
      }
    }

    function update(dt) {
      // 进度条来回移动
      if (!state.finished && state.currentPhase < PHASES.length) {
        state.barProgress += state.barSpeed * dt * state.barDirection;
        if (state.barProgress >= 1) {
          state.barProgress = 1;
          state.barDirection = -1;
        } else if (state.barProgress <= 0) {
          state.barProgress = 0;
          state.barDirection = 1;
        }
      }

      // 植物生长
      var growTarget = (state.currentPhase / PHASES.length) * 0.8;
      state.plantHeight += (growTarget - state.plantHeight) * dt * 3;

      // 水滴特效
      for (var i = state.waterDrops.length - 1; i >= 0; i--) {
        var drop = state.waterDrops[i];
        drop.y += drop.vy;
        drop.life -= dt * 2;
        if (drop.life <= 0) state.waterDrops.splice(i, 1);
      }

      // 阶段结果动画
      if (state.showPhaseResult && performance.now() - state.phaseAnimTimer > 800) {
        state.showPhaseResult = false;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // 背景 - 茶园
      var skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.5);
      skyGrad.addColorStop(0, '#87CEEB');
      skyGrad.addColorStop(1, '#C8E6C9');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H * 0.5);

      // 土地
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(0, H * 0.5, W, H * 0.5);
      ctx.fillStyle = '#4E342E';
      ctx.fillRect(0, H * 0.55, W, H * 0.45);

      // 茶苗
      var plantX = W * 0.5;
      var plantBaseY = H * 0.5;
      var plantH = state.plantHeight * H * 0.35;

      // 茎
      ctx.strokeStyle = '#33691E';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(plantX, plantBaseY);
      ctx.lineTo(plantX, plantBaseY - plantH);
      ctx.stroke();

      // 叶子
      if (state.currentPhase >= 1) {
        for (var l = 0; l < Math.min(state.currentPhase, 3); l++) {
          var leafY = plantBaseY - plantH * (0.4 + l * 0.25);
          var leafSize = 12 + l * 4;
          var dir = l % 2 === 0 ? 1 : -1;
          ctx.fillStyle = PHASES[Math.min(l, 2)].color;
          ctx.beginPath();
          ctx.ellipse(plantX + dir * leafSize * 0.6, leafY, leafSize, leafSize * 0.4, dir * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 水滴特效
      for (var d = 0; d < state.waterDrops.length; d++) {
        var drop = state.waterDrops[d];
        ctx.fillStyle = 'rgba(100,180,255,' + drop.life + ')';
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 进度条
      if (!state.finished && state.currentPhase < PHASES.length) {
        var phase = PHASES[state.currentPhase];
        var barW = W * 0.7;
        var barH = 20;
        var barX = (W - barW) / 2;
        var barY = H * 0.08;

        // 标签
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('第' + (state.currentPhase + 1) + '阶段: ' + phase.name + ' - 按空格浇水', W / 2, barY - 8);

        // 条背景
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);

        // 绿色区域（浇水窗口）
        var greenX = barX + (phase.targetPos - phase.windowSize) * barW;
        var greenW = phase.windowSize * 2 * barW;
        ctx.fillStyle = 'rgba(0,200,0,0.5)';
        ctx.fillRect(greenX, barY, greenW, barH);

        // 中心线
        ctx.strokeStyle = '#0F0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(barX + phase.targetPos * barW, barY);
        ctx.lineTo(barX + phase.targetPos * barW, barY + barH);
        ctx.stroke();

        // 游标
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(barX + state.barProgress * barW - 2, barY - 3, 4, barH + 6);
      }

      // 阶段结果
      if (state.showPhaseResult) {
        var gradeColors = { perfect: '#FFD700', good: '#32CD32', ok: '#FFA500', fail: '#FF6347' };
        ctx.fillStyle = gradeColors[state.lastGrade] || '#FFF';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        var gradeText = { perfect: '完美！', good: '不错！', ok: '一般', fail: '偏了！' };
        ctx.fillText(gradeText[state.lastGrade] || '', W / 2, H * 0.7);
      }

      // 完成
      if (state.finished) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, H * 0.3, W, H * 0.3);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('种茶完成！', W / 2, H * 0.45);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#FFF';
        var totalAcc = 0;
        for (var r = 0; r < state.phaseResults.length; r++) totalAcc += state.phaseResults[r].accuracy;
        ctx.fillText('准确率: ' + Math.round((totalAcc / state.phaseResults.length) * 100) + '%', W / 2, H * 0.52);
      }
    }

    function destroy() {}

    return { update: update, draw: draw, handleAction: handleAction, destroy: destroy };
  }

  // ==================== 下棋游戏 ====================

  function _createChessGame(canvas, ctx, options) {
    var W = canvas.width;
    var H = canvas.height;
    var bet = clamp((options && options.bet) || 10, 5, 50);
    var BOARD_SIZE = 9;
    var WIN_COUNT = 4;

    var board = [];
    for (var r = 0; r < BOARD_SIZE; r++) {
      board[r] = [];
      for (var c = 0; c < BOARD_SIZE; c++) {
        board[r][c] = 0; // 0=空, 1=玩家, 2=NPC
      }
    }

    var state = {
      board: board,
      currentPlayer: 1, // 1=玩家, 2=NPC
      winner: 0,
      winLine: null,
      hoverCell: null,
      lastMove: null,
      npcThinking: false,
      gameOver: false,
      moveCount: 0
    };

    var cellSize = Math.min(Math.floor((W - 60) / BOARD_SIZE), Math.floor((H - 80) / BOARD_SIZE));
    var boardPx = cellSize * BOARD_SIZE;
    var offsetX = (W - boardPx) / 2;
    var offsetY = (H - boardPx) / 2 + 15;

    function getCell(mx, my) {
      var col = Math.floor((mx - offsetX) / cellSize);
      var row = Math.floor((my - offsetY) / cellSize);
      if (col >= 0 && col < BOARD_SIZE && row >= 0 && row < BOARD_SIZE) {
        return { row: row, col: col };
      }
      return null;
    }

    function checkWin(player) {
      var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
      for (var r = 0; r < BOARD_SIZE; r++) {
        for (var c = 0; c < BOARD_SIZE; c++) {
          if (board[r][c] !== player) continue;
          for (var d = 0; d < dirs.length; d++) {
            var dr = dirs[d][0], dc = dirs[d][1];
            var count = 0;
            var line = [];
            for (var k = 0; k < WIN_COUNT; k++) {
              var nr = r + dr * k;
              var nc = c + dc * k;
              if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
              if (board[nr][nc] !== player) break;
              count++;
              line.push({ row: nr, col: nc });
            }
            if (count >= WIN_COUNT) return line;
          }
        }
      }
      return null;
    }

    function isBoardFull() {
      for (var r = 0; r < BOARD_SIZE; r++) {
        for (var c = 0; c < BOARD_SIZE; c++) {
          if (board[r][c] === 0) return false;
        }
      }
      return true;
    }

    // NPC AI: 简单策略
    function npcMove() {
      state.npcThinking = true;

      // 1. 检查能否赢
      var winMove = _findCriticalMove(2);
      if (winMove) { placePiece(winMove.row, winMove.col, 2); return; }

      // 2. 堵玩家
      var blockMove = _findCriticalMove(1);
      if (blockMove) { placePiece(blockMove.row, blockMove.col, 2); return; }

      // 3. 进攻：找最佳位置
      var bestScore = -1;
      var bestMoves = [];
      for (var r = 0; r < BOARD_SIZE; r++) {
        for (var c = 0; c < BOARD_SIZE; c++) {
          if (board[r][c] !== 0) continue;
          var score = _evalCell(r, c, 2);
          if (score > bestScore) {
            bestScore = score;
            bestMoves = [{ row: r, col: c }];
          } else if (score === bestScore) {
            bestMoves.push({ row: r, col: c });
          }
        }
      }
      if (bestMoves.length > 0) {
        var mv = pickRandom(bestMoves);
        placePiece(mv.row, mv.col, 2);
      }
    }

    function _findCriticalMove(player) {
      // 找能让player连成WIN_COUNT的位置
      for (var r = 0; r < BOARD_SIZE; r++) {
        for (var c = 0; c < BOARD_SIZE; c++) {
          if (board[r][c] !== 0) continue;
          board[r][c] = player;
          if (checkWin(player)) {
            board[r][c] = 0;
            return { row: r, col: c };
          }
          board[r][c] = 0;
        }
      }
      return null;
    }

    function _evalCell(row, col, player) {
      var score = 0;
      // 中心加分
      var centerDist = Math.abs(row - 4) + Math.abs(col - 4);
      score += (8 - centerDist) * 0.5;
      // 邻近己方棋子加分
      var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
      for (var d = 0; d < dirs.length; d++) {
        var count = 0;
        for (var k = -1; k <= 1; k += 2) {
          var nr = row + dirs[d][0] * k;
          var nc = col + dirs[d][1] * k;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            if (board[nr][nc] === player) count++;
          }
        }
        score += count * 2;
      }
      return score;
    }

    function placePiece(row, col, player) {
      board[row][col] = player;
      state.lastMove = { row: row, col: col };
      state.moveCount++;

      var winLine = checkWin(player);
      if (winLine) {
        state.winner = player;
        state.winLine = winLine;
        state.gameOver = true;
        state.npcThinking = false;
        setTimeout(function () {
          var result = {
            winner: player,
            bet: bet,
            reward: player === 1 ? bet : -bet,
            message: player === 1 ? '你赢了！获得' + bet + '铜钱' : '你输了…失去' + bet + '铜钱'
          };
          _finishGame(result);
        }, 1500);
        return;
      }

      if (isBoardFull()) {
        state.gameOver = true;
        state.npcThinking = false;
        setTimeout(function () {
          _finishGame({ winner: 0, bet: bet, reward: 0, message: '平局！' });
        }, 1000);
        return;
      }

      state.currentPlayer = player === 1 ? 2 : 1;
      state.npcThinking = false;

      if (state.currentPlayer === 2 && !state.gameOver) {
        state.npcThinking = true;
        setTimeout(function () {
          if (!state.gameOver) npcMove();
        }, 400 + Math.random() * 400);
      }
    }

    function handleClick(mx, my) {
      if (state.gameOver || state.currentPlayer !== 1 || state.npcThinking) return;
      var cell = getCell(mx, my);
      if (cell && board[cell.row][cell.col] === 0) {
        placePiece(cell.row, cell.col, 1);
      }
    }

    function handleAction() {
      // 键盘操作备用，下棋主要用鼠标
    }

    function handleMouseMove(mx, my) {
      state.hoverCell = getCell(mx, my);
    }

    function update(dt) {}

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // 背景
      ctx.fillStyle = '#F5DEB3';
      ctx.fillRect(0, 0, W, H);

      // 标题
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('五子棋 (9×9 连4子)  赌注: ' + bet + '铜', W / 2, 18);

      // 棋盘
      ctx.fillStyle = '#DEB887';
      ctx.fillRect(offsetX, offsetY, boardPx, boardPx);

      // 网格线
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (var i = 0; i < BOARD_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + i * cellSize + cellSize / 2, offsetY + cellSize / 2);
        ctx.lineTo(offsetX + i * cellSize + cellSize / 2, offsetY + boardPx - cellSize / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(offsetX + cellSize / 2, offsetY + i * cellSize + cellSize / 2);
        ctx.lineTo(offsetX + boardPx - cellSize / 2, offsetY + i * cellSize + cellSize / 2);
        ctx.stroke();
      }

      // 星位
      var starPoints = [2, 4, 6];
      ctx.fillStyle = '#333';
      for (var si = 0; si < starPoints.length; si++) {
        for (var sj = 0; sj < starPoints.length; sj++) {
          ctx.beginPath();
          ctx.arc(offsetX + starPoints[si] * cellSize + cellSize / 2, offsetY + starPoints[sj] * cellSize + cellSize / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 悬停提示
      if (state.hoverCell && !state.gameOver && state.currentPlayer === 1 && !state.npcThinking) {
        var hr = state.hoverCell;
        if (board[hr.row][hr.col] === 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.beginPath();
          ctx.arc(offsetX + hr.col * cellSize + cellSize / 2, offsetY + hr.row * cellSize + cellSize / 2, cellSize * 0.38, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 棋子
      for (var r = 0; r < BOARD_SIZE; r++) {
        for (var c = 0; c < BOARD_SIZE; c++) {
          if (board[r][c] === 0) continue;
          var cx = offsetX + c * cellSize + cellSize / 2;
          var cy = offsetY + r * cellSize + cellSize / 2;
          var radius = cellSize * 0.38;

          if (board[r][c] === 1) {
            // 黑棋（玩家）
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            // 高光
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.arc(cx - radius * 0.25, cy - radius * 0.25, radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // 白棋（NPC）
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // 最后落子标记
          if (state.lastMove && state.lastMove.row === r && state.lastMove.col === c) {
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 胜利连线
      if (state.winLine) {
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        var first = state.winLine[0];
        var last = state.winLine[state.winLine.length - 1];
        ctx.moveTo(offsetX + first.col * cellSize + cellSize / 2, offsetY + first.row * cellSize + cellSize / 2);
        ctx.lineTo(offsetX + last.col * cellSize + cellSize / 2, offsetY + last.row * cellSize + cellSize / 2);
        ctx.stroke();
      }

      // 状态信息
      ctx.fillStyle = '#333';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      if (state.gameOver) {
        var msg = state.winner === 1 ? '你赢了！' : state.winner === 2 ? '你输了…' : '平局！';
        ctx.fillStyle = state.winner === 1 ? '#DAA520' : state.winner === 2 ? '#FF6347' : '#666';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(msg, W / 2, H - 12);
      } else if (state.npcThinking) {
        ctx.fillText('对手思考中...', W / 2, H - 12);
      } else if (state.currentPlayer === 1) {
        ctx.fillText('轮到你下棋（黑子）', W / 2, H - 12);
      }
    }

    function destroy() {}

    return { update: update, draw: draw, handleAction: handleAction, handleClick: handleClick, handleMouseMove: handleMouseMove, destroy: destroy };
  }

  // ==================== 游戏引擎 ====================

  var GAME_CREATORS = {
    fishing: _createFishingGame,
    herb_collecting: _createHerbGame,
    tea_planting: _createTeaPlantingGame,
    chess: _createChessGame
  };

  function _finishGame(result) {
    if (!_currentGame) return;
    var game = _currentGame;
    game.result = result;
    game.state = 'finished';

    // 停止循环
    if (game.loopId) {
      cancelAnimationFrame(game.loopId);
      game.loopId = null;
    }

    // 移除事件监听
    _removeEventListeners(game);

    // 销毁游戏实例
    if (game.instance && game.instance.destroy) {
      game.instance.destroy();
    }

    // 恢复主地图渲染
    _resumeMainRender();

    var resolve = game.resolve;
    _currentGame = null;

    if (resolve) {
      resolve(result);
    }
  }

  function _pauseMainRender() {
    if (typeof yunluo_map !== 'undefined' && yunluo_map.pauseRender) {
      yunluo_map.pauseRender();
    }
  }

  function _resumeMainRender() {
    if (typeof yunluo_map !== 'undefined' && yunluo_map.resumeRender) {
      yunluo_map.resumeRender();
    }
  }

  function _addEventListeners(game) {
    var canvas = game.canvas;

    game._onKeydown = function (e) {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (game.instance && game.instance.handleAction) {
          game.instance.handleAction();
        }
      }
      if (e.code === 'Escape') {
        _finishGame({ cancelled: true });
      }
    };

    game._onClick = function (e) {
      var rect = canvas.getBoundingClientRect();
      var scaleX = canvas.width / rect.width;
      var scaleY = canvas.height / rect.height;
      var mx = (e.clientX - rect.left) * scaleX;
      var my = (e.clientY - rect.top) * scaleY;

      if (game.instance && game.instance.handleClick) {
        game.instance.handleClick(mx, my);
      } else if (game.instance && game.instance.handleAction) {
        game.instance.handleAction();
      }
    };

    game._onMouseMove = function (e) {
      var rect = canvas.getBoundingClientRect();
      var scaleX = canvas.width / rect.width;
      var scaleY = canvas.height / rect.height;
      var mx = (e.clientX - rect.left) * scaleX;
      var my = (e.clientY - rect.top) * scaleY;

      if (game.instance && game.instance.handleMouseMove) {
        game.instance.handleMouseMove(mx, my);
      }
    };

    document.addEventListener('keydown', game._onKeydown);
    canvas.addEventListener('click', game._onClick);
    canvas.addEventListener('mousemove', game._onMouseMove);
  }

  function _removeEventListeners(game) {
    if (game._onKeydown) document.removeEventListener('keydown', game._onKeydown);
    if (game._onClick) game.canvas.removeEventListener('click', game._onClick);
    if (game._onMouseMove) game.canvas.removeEventListener('mousemove', game._onMouseMove);
  }

  function _gameLoop(timestamp) {
    if (!_currentGame || _currentGame.state !== 'playing') return;

    var game = _currentGame;
    var dt = game.lastTime ? (timestamp - game.lastTime) / 1000 : 0.016;
    dt = Math.min(dt, 0.1); // 防止大跳帧
    game.lastTime = timestamp;

    if (game.instance) {
      game.instance.update(dt);
      game.instance.draw();
    }

    game.loopId = requestAnimationFrame(_gameLoop);
  }

  // ==================== 公开接口 ====================

  /**
   * 启动小游戏
   * @param {string} gameId - 游戏ID: fishing / herb_collecting / tea_planting / chess
   * @param {object} options - 游戏选项
   * @param {HTMLCanvasElement} options.canvas - 渲染用Canvas元素
   * @param {number} [options.teaHouseLevel] - 茶馆等级（钓鱼用）
   * @param {number} [options.level] - 难度等级（采药用）
   * @param {number} [options.bet] - 赌注（下棋用）
   * @returns {Promise} resolve时返回游戏结果
   */
  function start(gameId, options) {
    if (_currentGame) {
      return Promise.reject(new Error('已有小游戏正在运行，请先停止'));
    }

    var creator = GAME_CREATORS[gameId] || _gameRegistry[gameId];
    if (!creator) {
      return Promise.reject(new Error('未知的小游戏: ' + gameId));
    }

    var canvas = options && options.canvas;
    if (!canvas) {
      return Promise.reject(new Error('必须提供canvas参数'));
    }

    var ctx = canvas.getContext('2d');
    if (!ctx) {
      return Promise.reject(new Error('无法获取Canvas 2D上下文'));
    }

    // 暂停主地图渲染
    _pauseMainRender();

    var game = {
      id: gameId,
      state: 'playing',
      canvas: canvas,
      ctx: ctx,
      instance: null,
      loopId: null,
      lastTime: 0,
      result: null,
      resolve: null,
      reject: null
    };

    var promise = new Promise(function (resolve, reject) {
      game.resolve = resolve;
      game.reject = reject;
    });

    // 创建游戏实例
    game.instance = creator(canvas, ctx, options);

    // 添加事件监听
    _addEventListeners(game);

    // 保存状态
    _currentGame = game;

    // 启动游戏循环
    game.lastTime = performance.now();
    game.loopId = requestAnimationFrame(_gameLoop);

    return promise;
  }

  /**
   * 强制停止当前游戏
   */
  function stop() {
    if (!_currentGame) return;
    _finishGame({ cancelled: true });
  }

  /**
   * 获取当前游戏状态
   * @returns {object|null}
   */
  function getCurrentGame() {
    if (!_currentGame) return null;
    return {
      id: _currentGame.id,
      state: _currentGame.state,
      result: _currentGame.result
    };
  }

  /**
   * 是否正在玩小游戏
   * @returns {boolean}
   */
  function isPlaying() {
    return _currentGame !== null && _currentGame.state === 'playing';
  }

  /**
   * 注册新小游戏
   * @param {object} gameConfig - 游戏配置
   * @param {string} gameConfig.id - 游戏唯一ID
   * @param {function} gameConfig.create - 创建函数: (canvas, ctx, options) => gameInstance
   */
  function registerGame(gameConfig) {
    if (!gameConfig || !gameConfig.id || !gameConfig.create) {
      throw new Error('注册小游戏需要提供 id 和 create 函数');
    }
    _gameRegistry[gameConfig.id] = gameConfig.create;
  }

  // 返回公开接口
  return {
    start: start,
    stop: stop,
    getCurrentGame: getCurrentGame,
    isPlaying: isPlaying,
    registerGame: registerGame
  };
})();

window.MiniGames = MiniGames;
