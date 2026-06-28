/* character.js — 小人控制器（全局单例 Character） */
/* 从参考文件迁移并封装 SVG 小人，暴露 perform/setAction/setExpression/showBubble/spawnParticles API */

const Character = {
  el: null,
  bubble: null,
  status: null,
  currentAction: 'idle',
  actionTimer: null,
  bubbleTimer: null,
  idleTimer: null,
  busy: false,

  // 动作定义（duration 默认值）
  actions: [
    { name: 'wave', label: '👋 挥手', duration: 2200 },
    { name: 'jump', label: '🦘 蹦跳', duration: 800 },
    { name: 'dance', label: '💃 跳舞', duration: 3200 },
    { name: 'nod', label: '😊 点头', duration: 1200 },
    { name: 'shake', label: '🙅 摇头', duration: 1000 },
    { name: 'walk', label: '🚶 散步', duration: 2500 },
    { name: 'spin', label: '🌀 转圈', duration: 1000 },
    { name: 'sleep', label: '😴 打瞌睡', duration: 4000 },
    { name: 'surprise', label: '😲 惊讶', duration: 1500 }
  ],

  // 动作 → 默认表情映射
  actionExprMap: {
    wave: 'happy', jump: 'surprised', dance: 'love', nod: 'happy',
    shake: 'angry', walk: 'normal', spin: 'dizzy', sleep: 'sleepy', surprise: 'surprised',
    idle: 'normal'
  },

  // 粒子特效映射
  particleMap: {
    hearts: ['❤️', '💕', '💖', '💗'],
    stars: ['⭐', '✨', '💫', '🌟'],
    sparkles: ['✨', '💫', '✴️', '⚡'],
    notes: ['♪', '♫', '🎵', '🎶']
  },

  // 眼/嘴元素引用（init 时填充）
  _eyes: {}, _mouths: {}, _allEyes: [], _allMouths: [],
  _headTrack: null, _pupilsTrack: null,
  _targetX: 0, _targetY: 0, _smoothX: 0, _smoothY: 0,

  init() {
    this.el = document.getElementById('character');
    this.bubble = document.getElementById('speech-bubble');
    this.status = document.getElementById('status');

    // 缓存眼/嘴元素引用
    const eyeIds = ['eyes', 'eyes-happy', 'eyes-surprised', 'eyes-sad', 'eyes-sleepy',
      'eyes-love', 'eyes-wink', 'eyes-angry', 'eyes-dizzy'];
    const mouthIds = ['mouth-default', 'mouth-happy', 'mouth-surprised', 'mouth-sad',
      'mouth-flat', 'mouth-tongue', 'mouth-angry'];
    this._eyes = {};
    eyeIds.forEach(id => this._eyes[id] = document.getElementById(id));
    this._mouths = {};
    mouthIds.forEach(id => this._mouths[id] = document.getElementById(id));
    this._allEyes = eyeIds.map(id => this._eyes[id]).filter(Boolean);
    this._allMouths = mouthIds.map(id => this._mouths[id]).filter(Boolean);

    this._headTrack = document.getElementById('head-track');
    this._pupilsTrack = document.getElementById('pupils-track');

    this._setupMouseTracking();
    this._setupBlink();
    this._setupClick();

    this.setExpression('normal');
    this._scheduleNext();
  },

  /**
   * 动作 Agent 主入口：执行动作+表情+气泡+粒子
   * @param {Object} opts { action, expression, bubble, particles, duration }
   */
  perform(opts) {
    if (!opts || !opts.action) {
      this.setAction('idle');
      return;
    }
    const action = opts.action;
    const meta = this.actions.find(a => a.name === action);
    const duration = opts.duration || (meta ? meta.duration : 2000);

    // 设置动作（会触发对应的动画 class）
    this.setAction(action, duration);

    // 表情：优先用传入的，否则用动作默认映射
    const expr = opts.expression || this.actionExprMap[action] || 'normal';
    // setAction 内部已设置映射表情，这里覆盖为传入的
    setTimeout(() => this.setExpression(expr), 0);

    // 语气气泡
    if (opts.bubble) {
      this.showBubble(opts.bubble, Math.min(duration + 800, 3200));
    }

    // 粒子特效
    if (opts.particles && opts.particles !== 'none' && this.particleMap[opts.particles]) {
      this.spawnParticles(this.particleMap[opts.particles]);
    }
  },

  /** 设置动作 */
  setAction(name, duration) {
    // 清除所有动作 class
    this.el.className = 'character';
    // 移除 zzz
    const zzz = this.el.querySelector('.zzz');
    if (zzz) zzz.remove();

    if (name === 'idle' || !name) {
      this.el.classList.add('idle');
      this.setExpression('normal');
      this.status.textContent = '';
      this.currentAction = 'idle';
      return;
    }

    this.currentAction = name;
    this.el.classList.add(name);
    const meta = this.actions.find(a => a.name === name);
    this.status.textContent = meta ? meta.label : '';

    // 映射默认表情
    const expr = this.actionExprMap[name] || 'normal';
    this.setExpression(expr);

    // sleep 时显示 zzz
    if (name === 'sleep') {
      const z = document.createElement('div');
      z.className = 'zzz';
      z.textContent = 'z Z z';
      this.el.appendChild(z);
    }

    // 动作结束后回到 idle
    if (this.actionTimer) clearTimeout(this.actionTimer);
    if (duration && duration > 0) {
      this.actionTimer = setTimeout(() => {
        this.setAction('idle');
        this._scheduleNext();
      }, duration);
    }
  },

  /** 设置表情（眼+嘴） */
  setExpression(name) {
    // 隐藏全部
    this._allEyes.forEach(g => g.style.display = 'none');
    this._allMouths.forEach(g => g.style.display = 'none');

    const eyeMap = {
      normal: 'eyes', happy: 'eyes-happy', surprised: 'eyes-surprised',
      sad: 'eyes-sad', sleepy: 'eyes-sleepy', love: 'eyes-love',
      wink: 'eyes-wink', angry: 'eyes-angry', dizzy: 'eyes-dizzy'
    };
    const mouthMap = {
      normal: 'mouth-default', happy: 'mouth-happy', surprised: 'mouth-surprised',
      sad: 'mouth-sad', flat: 'mouth-flat', tongue: 'mouth-tongue', angry: 'mouth-angry'
    };

    const eyeEl = this._eyes[eyeMap[name] || 'eyes'];
    const mouthEl = this._mouths[mouthMap[name] || 'mouth-default'];
    if (eyeEl) eyeEl.style.display = '';
    if (mouthEl) mouthEl.style.display = '';
  },

  /** 显示人物上方短语气气泡 */
  showBubble(text, ms) {
    if (!text) return;
    this.bubble.textContent = text;
    this.bubble.classList.add('show');
    if (this.bubbleTimer) clearTimeout(this.bubbleTimer);
    if (ms && ms > 0) {
      this.bubbleTimer = setTimeout(() => this.bubble.classList.remove('show'), ms);
    }
  },

  /** 生成粒子特效 */
  spawnParticles(emojis) {
    if (!emojis || !emojis.length) return;
    const count = 5;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const h = document.createElement('div');
        h.className = 'particle';
        h.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        h.style.left = (80 + this._rndInt(-50, 50)) + 'px';
        h.style.top = (this._rndInt(-30, 30)) + 'px';
        h.style.fontSize = this._rndInt(16, 26) + 'px';
        this.el.appendChild(h);
        setTimeout(() => h.remove(), 1200);
      }, i * 120);
    }
  },

  /** 设置忙碌状态（聊天生成时暂停 idle 自动调度） */
  setBusy(b) {
    this.busy = !!b;
    if (this.busy) {
      if (this.idleTimer) { clearTimeout(this.idleTimer); this.idleTimer = null; }
    } else {
      // 恢复 idle 调度
      if (this.currentAction === 'idle') this._scheduleNext();
    }
  },

  // ===== 内部：idle 自动调度 =====
  _scheduleNext() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.busy) return;
    this.idleTimer = setTimeout(() => {
      if (this.currentAction !== 'idle' || this.busy) return;
      const a = this.actions[Math.floor(Math.random() * this.actions.length)];
      this.setAction(a.name, a.duration);
    }, this._rndInt(2500, 5500));
  },

  // ===== 内部：鼠标追踪 =====
  _setupMouseTracking() {
    document.addEventListener('mousemove', (e) => {
      this._updateTarget(e.clientX, e.clientY);
    });
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this._updateTarget(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    const loop = () => {
      this._smoothX += (this._targetX - this._smoothX) * 0.1;
      this._smoothY += (this._targetY - this._smoothY) * 0.1;

      const headRot = this._smoothX * 7;
      const headTx = this._smoothX * 4;
      const headTy = this._smoothY * 3;
      if (this._headTrack) {
        this._headTrack.setAttribute('transform',
          'translate(' + headTx.toFixed(2) + ' ' + headTy.toFixed(2) +
          ') rotate(' + headRot.toFixed(2) + ' 100 110)');
      }
      const px = this._smoothX * 3.5;
      const py = this._smoothY * 3;
      if (this._pupilsTrack) {
        this._pupilsTrack.setAttribute('transform',
          'translate(' + px.toFixed(2) + ' ' + py.toFixed(2) + ')');
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },

  _updateTarget(cx, cy) {
    if (!this.el) return;
    const rect = this.el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height * 0.35;
    const dx = (cx - centerX) / (rect.width / 2);
    const dy = (cy - centerY) / (rect.height / 2);
    this._targetX = Math.max(-1.5, Math.min(1.5, dx));
    this._targetY = Math.max(-1.5, Math.min(1.5, dy));
  },

  // ===== 内部：眨眼 =====
  _setupBlink() {
    setInterval(() => {
      if (this.currentAction !== 'idle') return;
      if (Math.random() < 0.35) {
        const defaultEyes = this._eyes['eyes'];
        if (!defaultEyes || defaultEyes.style.display === 'none') return;
        const whites = defaultEyes.querySelectorAll('ellipse');
        whites.forEach(el => el.setAttribute('ry', '1.5'));
        if (this._pupilsTrack) this._pupilsTrack.style.opacity = '0';
        setTimeout(() => {
          whites.forEach(el => el.setAttribute('ry', '10'));
          if (this._pupilsTrack) this._pupilsTrack.style.opacity = '1';
        }, 150);
      }
    }, 2500);
  },

  // ===== 内部：部位点击反应（趣味彩蛋）=====
  _setupClick() {
    if (!this.el) return;
    this.el.addEventListener('click', (e) => {
      if (this.busy) return;
      if (this.currentAction !== 'idle') return;
      const part = this._detectPart(e.target);
      const partNames = {
        head: '🧠 摸了摸头', eye: '👀 戳眼睛', mouth: '👄 戳嘴巴',
        hair: '💇 摸头发', body: '👕 戳身体', arm: '💪 戳手臂', leg: '🦵 戳腿'
      };
      this.status.textContent = partNames[part] || '';

      // 简单趣味反应
      const reactions = {
        head: () => { this.setExpression('love'); this.showBubble('嘿嘿~ 🥰', 2500); this.spawnParticles(['❤️', '💕']); setTimeout(() => { this.setExpression('normal'); }, 2500); },
        eye: () => { this.setExpression('surprised'); this.showBubble('哎呀！别戳眼睛~', 2000); setTimeout(() => { this.setExpression('normal'); }, 2000); },
        mouth: () => { this.setExpression('tongue' in this._mouths ? 'tongue' : 'happy'); this.showBubble('略略略~', 2200); setTimeout(() => { this.setExpression('normal'); }, 2200); },
        hair: () => { this.setExpression('wink'); this.showBubble('小心发型~', 2000); setTimeout(() => { this.setExpression('normal'); }, 2000); },
        body: () => { this.setExpression('surprised'); this.showBubble('痒痒！😆', 2200); setTimeout(() => { this.setExpression('normal'); }, 2200); },
        arm: () => { this.setAction('wave', 2200); },
        leg: () => { this.setAction('jump', 800); }
      };
      (reactions[part] || reactions.head)();
    });
  },

  _detectPart(target) {
    let el = target;
    while (el && el !== this.el) {
      if (el.dataset && el.dataset.part) return el.dataset.part;
      const cls = (el.getAttribute && el.getAttribute('class')) || '';
      if (/hit-arm/.test(cls)) return 'arm';
      if (/hit-leg/.test(cls)) return 'leg';
      el = el.parentNode;
    }
    return 'head';
  },

  _rndInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
};
